// ========== AI 分析引擎（统一入口） ==========
// 数据飞轮的"分析层"：聚合 知识状态 + 能力模型 + 推荐模型
// 输入：用户的答题/学习/AI对话行为（来自 Event API → 业务库）
// 输出：① 个人知识图谱  ② 学科能力模型  ③ 个性化推荐
// 学生 → 推荐题目 → 答题 → 飞轮自动更新掌握度 → 重新生成推荐 → 学生
const express = require('express');
const router = express.Router();
const db = require('../db');

// ========== GET /api/ai/engine/:user_id/dashboard ==========
// 数据飞轮总览：行为输入 → 分析结果 → 推荐输出
router.get('/:user_id/dashboard', (req, res) => {
    const userId = req.params.user_id;
    const days = Math.min(90, Math.max(1, parseInt(req.query.days) || 30));
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);

    // === 输入层：行为数据 ===
    const events = db.find('events', e => e.user_id === userId && new Date(e.ts || e.created_at) >= since);
    const answers = db.find('answer_records', r => r.user_id === userId && new Date(r.created_at) >= since);
    const learning = db.find('learning_records', r => r.user_id === userId && r.date >= sinceStr);
    const aiChats = db.find('coach_history', c => c.user_id === userId && new Date(c.time || c.created_at) >= since)
        .concat(db.find('qa_history', c => c.user_id === userId && new Date(c.time || c.created_at) >= since));

    const answerCount = answers.length;
    const correctCount = answers.filter(a => a.is_correct).length;
    const correctRate = answerCount > 0 ? Math.round(correctCount / answerCount * 100) : 0;
    const learningDuration = learning.reduce((s, r) => s + (r.duration_min || 0), 0);

    // === 分析层 ①：知识状态 ===
    const allKps = db.list('knowledge_points');
    const userKps = allKps.filter(k => k.user_id === userId || k.last_practice_at);
    const mastered = userKps.filter(k => (k.mastery_rate || 0) >= 0.8).length;
    const partial = userKps.filter(k => (k.mastery_rate || 0) >= 0.5 && (k.mastery_rate || 0) < 0.8).length;
    const unmastered = userKps.filter(k => (k.mastery_rate || 0) < 0.5).length;
    const avgMastery = userKps.length > 0
        ? +(userKps.reduce((s, k) => s + (k.mastery_rate || 0), 0) / userKps.length).toFixed(3)
        : 0;

    // === 分析层 ②：能力模型（按学科） ===
    const subjectConfig = ['数学', '语文', '英语', '物理', '化学', '生物', '思想政治', '历史', '地理'];
    const abilityModel = subjectConfig.map(subj => {
        const kps = allKps.filter(k => k.subject === subj);
        const subjAns = answers.filter(a => a.subject === subj);
        const subjCorrect = subjAns.filter(a => a.is_correct).length;
        const subjRate = subjAns.length > 0 ? Math.round(subjCorrect / subjAns.length * 100) : 0;
        const subjMastery = kps.length > 0
            ? Math.round(kps.reduce((s, k) => s + (k.mastery_rate || 0), 0) / kps.length * 100)
            : 0;
        return {
            subject: subj,
            mastery_rate: subjMastery,
            correct_rate: subjRate,
            question_count: subjAns.length,
            knowledge_points: kps.length
        };
    });

    // === 分析层 ③：推荐模型（基于薄弱点） ===
    const weakKps = allKps
        .filter(k => (k.mastery_rate || 0) < 0.7)
        .sort((a, b) => (b.score_gain || 0) - (a.score_gain || 0))
        .slice(0, 5)
        .map(k => ({
            id: k.id,
            name: k.name,
            subject: k.subject,
            mastery: +(k.mastery_rate || 0).toFixed(2),
            score_gain: k.score_gain || 0
        }));

    res.json({
        code: 0,
        data: {
            user_id: userId,
            days,
            // 输入层
            inputs: {
                events: events.length,
                answers: answerCount,
                correct_rate: correctRate,
                learning_min: learningDuration,
                ai_chats: aiChats.length
            },
            // 分析层
            knowledge_state: {
                total: userKps.length,
                mastered, partial, unmastered,
                avg_mastery: avgMastery
            },
            ability_model: abilityModel,
            // 输出层
            recommendation: {
                weak_points: weakKps,
                total_weak: allKps.filter(k => (k.mastery_rate || 0) < 0.7).length
            },
            // 飞轮状态
            flywheel: {
                active: answerCount > 0,
                last_answer_at: answers.length > 0 ? answers[0].created_at : null,
                knowledge_updated: userKps.filter(k => k.last_practice_at).length > 0,
                loop_running: answerCount > 0 && userKps.filter(k => k.last_practice_at).length > 0
            }
        }
    });
});

// ========== POST /api/ai/engine/:user_id/refresh ==========
// 手动触发飞轮一轮：重新计算知识点掌握度（基于历史答题）
router.post('/:user_id/refresh', (req, res) => {
    const userId = req.params.user_id;
    const allKps = db.list('knowledge_points');
    let updated = 0;

    allKps.forEach(kp => {
        const records = db.find('answer_records', r =>
            r.user_id === userId && r.knowledge_point_id === kp.id
        );
        if (records.length === 0) return;

        const correctCount = records.filter(r => r.is_correct).length;
        const newMastery = correctCount / records.length;
        const oldMastery = kp.mastery_rate || 0;
        const smoothed = oldMastery * 0.3 + newMastery * 0.7;

        db.update('knowledge_points', kp.id, {
            mastery_rate: +smoothed.toFixed(3),
            last_practice_at: records[0].created_at,
            practice_count: records.length
        });
        updated++;
    });

    res.json({
        code: 0,
        data: {
            user_id: userId,
            knowledge_points_updated: updated,
            refreshed_at: new Date().toISOString()
        },
        msg: `飞轮已刷新，更新 ${updated} 个知识点掌握度`
    });
});

// ========== GET /api/ai/engine/:user_id/loop-trace ==========
// 飞轮运行轨迹（最近 N 次飞轮循环的可视化数据）
router.get('/:user_id/loop-trace', (req, res) => {
    const userId = req.params.user_id;
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit) || 20));

    const events = db.find('events', e => e.user_id === userId && e.type === 'answer')
        .sort((a, b) => new Date(b.ts || b.created_at) - new Date(a.ts || b.created_at))
        .slice(0, limit);

    const trace = events.map((ev, idx) => {
        const qid = ev.payload && ev.payload.question_id;
        const q = qid ? db.findById('questions', qid) : null;
        const kp = q && q.knowledge_point_id ? db.findById('knowledge_points', q.knowledge_point_id) : null;
        return {
            step: idx + 1,
            time: ev.ts || ev.created_at,
            question_id: qid,
            knowledge_point: kp ? kp.name : null,
            subject: q ? q.subject : null,
            is_correct: !!(ev.payload && ev.payload.is_correct),
            mastery_after: kp ? +(kp.mastery_rate || 0).toFixed(2) : null
        };
    }).reverse();

    res.json({
        code: 0,
        data: {
            user_id: userId,
            loop_count: trace.length,
            trace
        }
    });
});

module.exports = router;
