// ========== 用户答题数据上传路由 ==========
// 上传答题记录、自动判分、联动更新考点掌握率
const express = require('express');
const router = express.Router();
const db = require('../db');

// 上传单条答题记录（自动判分）
// POST /api/answers  body: { user_id, question_id, user_answer, time_cost_sec }
router.post('/', (req, res) => {
    const { user_id, question_id, user_answer, time_cost_sec } = req.body;
    if (!user_id || !question_id) return res.status(400).json({ code: 1, msg: 'user_id 和 question_id 必填' });

    const question = db.findById('questions', question_id);
    if (!question) return res.status(404).json({ code: 1, msg: '题目不存在' });

    // 自动判分：标准化后比对答案
    const normalize = s => String(s || '').trim().replace(/\s+/g, '').toLowerCase();
    const isCorrect = normalize(user_answer) === normalize(question.answer);

    const record = db.insert('answer_records', {
        user_id,
        question_id,
        knowledge_point_id: question.knowledge_point_id,
        subject: question.subject,
        is_correct: isCorrect,
        user_answer: user_answer || '',
        correct_answer: question.answer,
        time_cost_sec: time_cost_sec || 0,
        difficulty: question.difficulty
    });

    // 联动更新考点掌握率：统计该考点最近答题情况
    updateKnowledgeMastery(question.knowledge_point_id, user_id);

    res.json({
        code: 0,
        data: {
            ...record,
            analysis: question.analysis,
            is_correct: isCorrect
        },
        msg: isCorrect ? '回答正确' : '回答错误'
    });
});

// 批量上传答题记录
// POST /api/answers/batch  body: { user_id, records: [{question_id, user_answer, time_cost_sec}] }
router.post('/batch', (req, res) => {
    const { user_id, records } = req.body;
    if (!user_id || !Array.isArray(records)) return res.status(400).json({ code: 1, msg: '参数错误' });

    const results = [];
    const normalize = s => String(s || '').trim().replace(/\s+/g, '').toLowerCase();
    const kpUpdates = {};

    records.forEach(r => {
        const question = db.findById('questions', r.question_id);
        if (!question) return;
        const isCorrect = normalize(r.user_answer) === normalize(question.answer);
        const record = db.insert('answer_records', {
            user_id,
            question_id: r.question_id,
            knowledge_point_id: question.knowledge_point_id,
            subject: question.subject,
            is_correct: isCorrect,
            user_answer: r.user_answer || '',
            correct_answer: question.answer,
            time_cost_sec: r.time_cost_sec || 0,
            difficulty: question.difficulty
        });
        if (!kpUpdates[question.knowledge_point_id]) kpUpdates[question.knowledge_point_id] = { correct: 0, total: 0 };
        kpUpdates[question.knowledge_point_id].total++;
        if (isCorrect) kpUpdates[question.knowledge_point_id].correct++;
        results.push({ question_id: r.question_id, is_correct: isCorrect });
    });

    // 批量更新考点掌握率
    Object.entries(kpUpdates).forEach(([kpId, v]) => {
        updateKnowledgeMastery(kpId, user_id, v.correct, v.total);
    });

    res.json({ code: 0, data: results, msg: `已上传 ${results.length} 条答题记录` });
});

// 获取用户答题记录
// GET /api/answers/:user_id?days=14&subject=数学
router.get('/:user_id', (req, res) => {
    const days = parseInt(req.query.days) || 14;
    const since = new Date();
    since.setDate(since.getDate() - days);
    let list = db.list('answer_records')
        .filter(r => r.user_id === req.params.user_id && new Date(r.created_at) >= since);
    if (req.query.subject) list = list.filter(r => r.subject === req.query.subject);
    if (req.query.knowledge_point_id) list = list.filter(r => r.knowledge_point_id === req.query.knowledge_point_id);
    list.sort((a, b) => b.created_at.localeCompare(a.created_at));
    res.json({ code: 0, data: list, total: list.length });
});

// 答题统计（总体正确率 + 各考点正确率）
// GET /api/answers/:user_id/stats?days=30
router.get('/:user_id/stats', (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const records = db.list('answer_records')
        .filter(r => r.user_id === req.params.user_id && new Date(r.created_at) >= since);

    const total = records.length;
    const correct = records.filter(r => r.is_correct).length;
    const overallRate = total > 0 ? Math.round(correct / total * 100) : 0;

    // 按考点分组统计
    const kpMap = {};
    records.forEach(r => {
        if (!kpMap[r.knowledge_point_id]) kpMap[r.knowledge_point_id] = { total: 0, correct: 0, subject: r.subject };
        kpMap[r.knowledge_point_id].total++;
        if (r.is_correct) kpMap[r.knowledge_point_id].correct++;
    });

    const allKp = db.list('knowledge_points');
    const kpStats = Object.entries(kpMap).map(([kpId, v]) => {
        const kp = allKp.find(k => k.id === kpId);
        return {
            knowledge_point_id: kpId,
            name: kp ? kp.name : '未知',
            subject: v.subject,
            total: v.total,
            correct: v.correct,
            correct_rate: v.total > 0 ? Math.round(v.correct / v.total * 100) : 0,
            mastery_rate: kp ? kp.mastery_rate : 0
        };
    }).sort((a, b) => a.correct_rate - b.correct_rate);

    res.json({
        code: 0,
        data: {
            total,
            correct,
            correct_rate: overallRate,
            avg_time_sec: total > 0 ? Math.round(records.reduce((s, r) => s + (r.time_cost_sec || 0), 0) / total) : 0,
            knowledge_point_stats: kpStats
        }
    });
});

// 每日答题趋势序列（支持 days 参数，供学情分析页分段切换渲染折线/柱状图）
// GET /api/answers/:user_id/trend-series?days=14
//   → { labels: ['8/25', ...], answer_count: [...], correct_count: [...], correct_rate: [...], avg_time_sec: [...] }
router.get('/:user_id/trend-series', (req, res) => {
    const days = Math.min(180, Math.max(3, parseInt(req.query.days) || 14));
    const fmtMD = (d) => (d.getMonth() + 1) + '/' + d.getDate();
    const labels = [];
    const counts = [];
    const corrects = [];
    const rates = [];
    const times = [];
    const today = new Date();
    const allRecords = db.list('answer_records').filter(r => r.user_id === req.params.user_id);
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dStr = d.toISOString().slice(0, 10);
        labels.push(fmtMD(d));
        const day = allRecords.filter(r => (r.created_at || '').slice(0, 10) === dStr);
        const total = day.length;
        const correct = day.filter(r => r.is_correct).length;
        counts.push(total);
        corrects.push(correct);
        rates.push(total > 0 ? Math.round(correct / total * 100) : 0);
        const avgSec = total > 0 ? Math.round(day.reduce((s, r) => s + (r.time_cost_sec || 0), 0) / total) : 0;
        times.push(avgSec);
    }
    res.json({
        code: 0,
        data: { days, labels, answer_count: counts, correct_count: corrects, correct_rate: rates, avg_time_sec: times }
    });
});

// 失分归因 Top N（按知识板块 & 题型 & 难度维度聚合错误原因，供失分归因卡片展示）
// GET /api/answers/:user_id/loss-analysis?days=30&limit=8
router.get('/:user_id/loss-analysis', (req, res) => {
    const days = Math.min(180, Math.max(7, parseInt(req.query.days) || 30));
    const limit = Math.min(20, Math.max(3, parseInt(req.query.limit) || 8));
    const since = new Date();
    since.setDate(since.getDate() - days);
    const wrong = db.list('answer_records').filter(r =>
        r.user_id === req.params.user_id && !r.is_correct && new Date(r.created_at) >= since
    );
    const byKp = {};
    wrong.forEach(r => {
        const kid = r.knowledge_point_id || 'other';
        if (!byKp[kid]) byKp[kid] = { count: 0, subject: r.subject || '综合', name: r.knowledge_point_name || '其他' };
        byKp[kid].count++;
    });
    const bySubject = {};
    wrong.forEach(r => {
        const s = r.subject || '综合';
        if (!bySubject[s]) bySubject[s] = 0;
        bySubject[s]++;
    });
    const kpList = Object.values(byKp).sort((a, b) => b.count - a.count).slice(0, limit);
    const totalWrong = wrong.length;
    kpList.forEach(k => {
        k.percent = totalWrong > 0 ? Math.round(k.count / totalWrong * 100) : 0;
    });
    const subjectLoss = Object.entries(bySubject).map(([s, c]) => ({ subject: s, wrong_count: c, percent: totalWrong > 0 ? Math.round(c / totalWrong * 100) : 0 })).sort((a, b) => b.wrong_count - a.wrong_count);

    // 归因标签：频次最多的题型/难度
    const typeCount = {};
    wrong.forEach(r => { const t = r.type || '其他'; typeCount[t] = (typeCount[t] || 0) + 1; });
    const diffCount = {};
    wrong.forEach(r => { const d = r.difficulty || 0; diffCount[d] = (diffCount[d] || 0) + 1; });
    const topType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0];
    const topDiff = Object.entries(diffCount).sort((a, b) => b[1] - a[1])[0];

    res.json({
        code: 0,
        data: {
            days,
            total_wrong: totalWrong,
            top_loss_points: kpList,
            subjects: subjectLoss,
            top_wrong_type: topType ? { type: topType[0], count: topType[1] } : null,
            top_wrong_difficulty: topDiff ? { level: Number(topDiff[0]) || 0, label: ['简单','基础','中等','困难','压轴'][Number(topDiff[0])] || '综合', count: topDiff[1] } : null
        }
    });
});

// 内部函数：更新考点掌握率
// 策略：以最近20条答题记录的正确率为主，结合历史掌握率加权平滑
function updateKnowledgeMastery(kpId, userId, batchCorrect, batchTotal) {
    if (!kpId) return;
    const kp = db.findById('knowledge_points', kpId);
    if (!kp) return;

    let recentRate;
    if (batchCorrect !== undefined && batchTotal !== undefined) {
        recentRate = batchCorrect / batchTotal;
    } else {
        // 取该考点最近20条答题记录
        const records = db.list('answer_records')
            .filter(r => r.knowledge_point_id === kpId && r.user_id === userId)
            .slice(-20);
        if (records.length === 0) return;
        const correct = records.filter(r => r.is_correct).length;
        recentRate = correct / records.length;
    }

    // 加权平滑：历史掌握率0.4 + 最近正确率0.6
    const newRate = Math.round((kp.mastery_rate * 0.4 + recentRate * 0.6) * 100) / 100;
    db.update('knowledge_points', kpId, { mastery_rate: newRate });
}

module.exports = router;
