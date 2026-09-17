// ========== AI 错题分析路由 ==========
// 错题汇总 + 按错因分类 + 推荐同类强化题
// 对应原型：ai-error
const express = require('express');
const router = express.Router();
const db = require('../db');

// 错因分类（预定义常见错因）
const ERROR_CAUSES = [
    { code: 'concept', label: '概念不清', color: '#EF4444', suggestion: '回顾课本定义与定理，重做基础题巩固。' },
    { code: 'calc', label: '计算失误', color: '#F59E0B', suggestion: '限时训练提升计算准确率，养成验算习惯。' },
    { code: 'method', label: '方法不当', color: '#3B82F6', suggestion: '归纳题型套路，建立"题型→方法"映射。' },
    { code: 'read', label: '审题不清', color: '#8B5CF6', suggestion: '画关键字、列已知/求，养成结构化读题习惯。' },
    { code: 'formula', label: '公式记错', color: '#10B981', suggestion: '整理公式卡，每日默写 5 条核心公式。' },
    { code: 'logic', label: '推理跳跃', color: '#EC4899', suggestion: '分步书写，每步注明依据，避免跳步。' },
    { code: 'other', label: '其他', color: '#6B7280', suggestion: '单独整理到错题本，找老师面批一次。' }
];

// GET /api/ai/error/:user_id/summary
// 错题汇总（按学科+错因分布）
router.get('/:user_id/summary', (req, res) => {
    const { user_id } = req.params;
    const days = parseInt(req.query.days) || 30;

    // 取该用户所有错题答题记录
    const answers = db.list('answer_records').filter(a =>
        a.user_id === user_id && a.is_correct === false
    );

    // 简化错因推断：若记录里没有 cause 字段，按 subject 派生一个示例错因
    const byCause = {};
    const bySubject = {};
    answers.forEach(a => {
        const cause = a.cause || (a.subject === '数学' ? 'calc' : 'concept');
        byCause[cause] = (byCause[cause] || 0) + 1;
        bySubject[a.subject] = (bySubject[a.subject] || 0) + 1;
    });

    // 补充示例数据，保证界面有内容
    if (answers.length === 0) {
        ['concept', 'calc', 'method', 'read'].forEach(c => { byCause[c] = byCause[c] || 2; });
        ['数学', '物理', '化学'].forEach(s => { bySubject[s] = bySubject[s] || 3; });
    }

    const causeDist = Object.entries(byCause).map(([code, count]) => {
        const meta = ERROR_CAUSES.find(c => c.code === code) || ERROR_CAUSES.find(c => c.code === 'other');
        return { code, label: meta.label, color: meta.color, count, suggestion: meta.suggestion };
    }).sort((a, b) => b.count - a.count);

    const subjectDist = Object.entries(bySubject).map(([subject, count]) => ({ subject, count }))
        .sort((a, b) => b.count - a.count);

    const total = answers.length || Object.values(byCause).reduce((s, n) => s + n, 0);

    res.json({
        code: 0,
        data: {
            user_id,
            days,
            total_wrong: total,
            by_cause: causeDist,
            by_subject: subjectDist,
            top_loss_cause: causeDist[0] ? causeDist[0].code : 'other',
            improvement_priority: causeDist.slice(0, 3).map(c => c.label)
        }
    });
});

// GET /api/ai/error/:user_id/by-cause
// 按错因分类返回错题明细
router.get('/:user_id/by-cause', (req, res) => {
    const { user_id } = req.params;
    const cause = req.query.cause;
    const limit = Math.min(50, parseInt(req.query.limit) || 10);

    const answers = db.list('answer_records').filter(a =>
        a.user_id === user_id && a.is_correct === false &&
        (!cause || (a.cause || 'concept') === cause)
    );

    // 不足则补示例错题
    const items = answers.slice(0, limit).map(a => {
        const q = db.findById('questions', a.question_id) || {};
        const meta = ERROR_CAUSES.find(c => c.code === (a.cause || 'concept')) || ERROR_CAUSES[0];
        return {
            question_id: a.question_id,
            subject: a.subject,
            content_preview: (q.content || a.content_preview || '示例错题内容').slice(0, 60),
            cause: a.cause || 'concept',
            cause_label: meta.label,
            suggestion: meta.suggestion,
            wrong_at: a.created_at,
            reviewed: a.reviewed || false
        };
    });

    while (items.length < Math.min(limit, 3)) {
        const meta = ERROR_CAUSES[items.length % ERROR_CAUSES.length];
        items.push({
            question_id: 'err_sample_' + items.length,
            subject: '数学',
            content_preview: '示例错题：设函数 f(x)=x³-3x²+2，求极值。',
            cause: meta.code,
            cause_label: meta.label,
            suggestion: meta.suggestion,
            wrong_at: new Date(Date.now() - items.length * 86400000).toISOString(),
            reviewed: false
        });
    }

    res.json({
        code: 0,
        data: {
            user_id,
            cause: cause || 'all',
            total: items.length,
            items
        }
    });
});

// POST /api/ai/error/:user_id/similar
// 针对指定错题推荐同类强化题
router.post('/:user_id/similar', (req, res) => {
    const { user_id } = req.params;
    const { question_id, count } = req.body || {};
    if (!question_id) return res.status(400).json({ code: 1, msg: 'question_id 必填' });

    const target = db.findById('questions', question_id);
    if (!target) return res.status(404).json({ code: 1007, msg: '原题不存在' });

    const maxCount = Math.min(20, parseInt(count) || 5);

    // 从同学科题库取相似题（简化：同学科且非自身）
    const candidates = db.list('questions').filter(q =>
        q.id !== question_id && q.subject === target.subject
    );

    const recommendations = candidates.slice(0, maxCount).map((q, i) => ({
        question_id: q.id,
        subject: q.subject,
        content_preview: (q.content || '').slice(0, 60) + '...',
        type: q.type || '解答题',
        difficulty: q.difficulty || 4,
        similarity: Math.round((0.95 - i * 0.05) * 100) / 100,
        reason: i === 0 ? '同知识点·同题型' : (i === 1 ? '同知识点·变式' : '同章节·强化')
    }));

    // 不足则补示例
    while (recommendations.length < maxCount) {
        recommendations.push({
            question_id: 'q_sim_' + Date.now() + '_' + recommendations.length,
            subject: target.subject,
            content_preview: target.subject + ' 同类强化题 ' + (recommendations.length + 1),
            type: '解答题',
            difficulty: target.difficulty || 4,
            similarity: 0.7,
            reason: '同章节·强化'
        });
    }

    res.json({
        code: 0,
        data: {
            user_id,
            origin_question_id: question_id,
            origin_subject: target.subject,
            origin_kp: target.knowledge_points || [],
            recommendations,
            total: recommendations.length
        }
    });
});

module.exports = router;
