// ========== 考点库路由 ==========
// 提供考点CRUD + 薄弱点查询 + 掌握率联动更新
const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取薄弱知识点（掌握率低于阈值，按提分收益降序）
// GET /api/knowledge/weak?threshold=0.6&limit=5
router.get('/weak', (req, res) => {
    const threshold = parseFloat(req.query.threshold) || 0.6;
    const limit = parseInt(req.query.limit) || 5;
    // 只返回题库中真正有对应题目的薄弱知识点，避免"假薄弱点"影响推荐
    const validKpIds = new Set(db.list('questions').map(q => q.knowledge_point_id).filter(Boolean));
    const list = db.list('knowledge_points')
        .filter(k => k.mastery_rate < threshold && validKpIds.has(k.id))
        .sort((a, b) => b.score_gain - a.score_gain)
        .slice(0, limit);
    res.json({ code: 0, data: list });
});

// 考点列表（支持科目、优先级筛选）
// GET /api/knowledge?subject=数学&priority=high
router.get('/', (req, res) => {
    let list = db.list('knowledge_points');
    if (req.query.subject) list = list.filter(k => k.subject === req.query.subject);
    if (req.query.priority) list = list.filter(k => k.priority === req.query.priority);
    res.json({ code: 0, data: list, total: list.length });
});

// 考点详情
router.get('/:id', (req, res) => {
    const kp = db.findById('knowledge_points', req.params.id);
    if (!kp) return res.status(404).json({ code: 1, msg: '考点不存在' });
    res.json({ code: 0, data: kp });
});

// 新增考点
router.post('/', (req, res) => {
    const { subject, name, mastery_rate, score_gain, difficulty, priority, description } = req.body;
    if (!subject || !name) return res.status(400).json({ code: 1, msg: '科目和名称必填' });
    const record = db.insert('knowledge_points', {
        subject, name,
        mastery_rate: mastery_rate || 0,
        score_gain: score_gain || 0,
        difficulty: difficulty || 3,
        priority: priority || 'medium',
        description: description || ''
    });
    res.json({ code: 0, data: record, msg: '新增成功' });
});

// 更新考点
router.put('/:id', (req, res) => {
    const record = db.update('knowledge_points', req.params.id, req.body);
    if (!record) return res.status(404).json({ code: 1, msg: '考点不存在' });
    res.json({ code: 0, data: record, msg: '更新成功' });
});

// 更新考点掌握率（答题后联动调用）
// PUT /api/knowledge/:id/mastery  body: { correct_count, total_count }
router.put('/:id/mastery', (req, res) => {
    const { correct_count, total_count } = req.body;
    if (!total_count || total_count <= 0) return res.status(400).json({ code: 1, msg: '参数错误' });
    const newRate = correct_count / total_count;
    const record = db.update('knowledge_points', req.params.id, { mastery_rate: Math.round(newRate * 100) / 100 });
    if (!record) return res.status(404).json({ code: 1, msg: '考点不存在' });
    res.json({ code: 0, data: record, msg: '掌握率已更新' });
});

// 删除考点
router.delete('/:id', (req, res) => {
    const ok = db.remove('knowledge_points', req.params.id);
    if (!ok) return res.status(404).json({ code: 1, msg: '考点不存在' });
    res.json({ code: 0, msg: '删除成功' });
});

module.exports = router;
