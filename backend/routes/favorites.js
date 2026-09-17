// ========== 收藏路由 ==========
// 学生收藏题目/试卷/知识点，云端持久化
const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取用户收藏列表
// GET /api/favorites/:user_id?type=question|paper|point&subject=&page=&size=
router.get('/:user_id', (req, res) => {
    const { user_id } = req.params;
    const { type, subject } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const size = Math.min(100, Math.max(1, parseInt(req.query.size) || 20));

    let list = db.find('favorites', f => f.user_id === user_id);
    if (type) list = list.filter(f => f.type === type);
    if (subject) list = list.filter(f => f.subject === subject);

    // 按收藏时间倒序
    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    const total = list.length;
    const start = (page - 1) * size;
    const paged = list.slice(start, start + size).map(f => {
        // 关联目标对象快照
        let target = null;
        if (f.type === 'question') target = db.findById('questions', f.target_id);
        else if (f.type === 'point') target = db.findById('knowledge_points', f.target_id);
        return {
            favorite_id: f.id,
            user_id: f.user_id,
            type: f.type,
            target_id: f.target_id,
            subject: f.subject,
            note: f.note || '',
            created_at: f.created_at,
            target: target ? {
                id: target.id,
                content: target.content || target.name || '',
                subject: target.subject,
                type: target.type,
                difficulty: target.difficulty
            } : null
        };
    });

    res.json({
        code: 0,
        data: paged,
        total,
        page,
        size,
        pages: Math.ceil(total / size)
    });
});

// 添加收藏
// POST /api/favorites  body: { user_id, type: 'question'|'paper'|'point', target_id, subject?, note? }
router.post('/', (req, res) => {
    const { user_id, type, target_id, subject, note } = req.body || {};
    if (!user_id) return res.status(400).json({ code: 1, msg: 'user_id 必填' });
    if (!type || !['question', 'paper', 'point'].includes(type)) {
        return res.status(400).json({ code: 1, msg: "type 必须为 'question'|'paper'|'point'" });
    }
    if (!target_id) return res.status(400).json({ code: 1, msg: 'target_id 必填' });

    // 去重：同一用户对同一目标只能收藏一次
    const existing = db.find('favorites', f =>
        f.user_id === user_id && f.type === type && f.target_id === target_id
    );
    if (existing.length > 0) {
        return res.json({ code: 0, data: existing[0], msg: '已收藏，无需重复操作' });
    }

    // 校验目标存在
    const tableMap = { question: 'questions', point: 'knowledge_points', paper: 'papers' };
    const target = db.findById(tableMap[type], target_id);
    // paper 表暂不存在时跳过校验
    if (type !== 'paper' && !target) {
        return res.status(404).json({ code: 1, msg: '收藏目标不存在' });
    }

    const record = db.insert('favorites', {
        user_id,
        type,
        target_id,
        subject: subject || (target && target.subject) || '通用',
        note: note || ''
    });

    res.json({ code: 0, data: record, msg: '收藏成功' });
});

// 检查是否已收藏
// GET /api/favorites/:user_id/check?type=&target_id=
router.get('/:user_id/check', (req, res) => {
    const { user_id } = req.params;
    const { type, target_id } = req.query;
    if (!type || !target_id) {
        return res.status(400).json({ code: 1, msg: 'type 和 target_id 必填' });
    }
    const hit = db.find('favorites', f =>
        f.user_id === user_id && f.type === type && f.target_id === target_id
    );
    res.json({ code: 0, data: { favorited: hit.length > 0, favorite_id: hit[0] ? hit[0].id : null } });
});

// 取消收藏
// DELETE /api/favorites/:favorite_id
router.delete('/:favorite_id', (req, res) => {
    const ok = db.remove('favorites', req.params.favorite_id);
    if (!ok) return res.status(404).json({ code: 1, msg: '收藏记录不存在' });
    res.json({ code: 0, msg: '已取消收藏' });
});

// 批量取消收藏
// POST /api/favorites/batch-remove  body: { favorite_ids: [...] }
router.post('/batch-remove', (req, res) => {
    const { favorite_ids } = req.body || {};
    if (!Array.isArray(favorite_ids) || favorite_ids.length === 0) {
        return res.status(400).json({ code: 1, msg: 'favorite_ids 必填且非空数组' });
    }
    let removed = 0;
    favorite_ids.forEach(id => {
        if (db.remove('favorites', id)) removed++;
    });
    res.json({ code: 0, data: { removed, total: favorite_ids.length }, msg: `已取消 ${removed} 条收藏` });
});

// 收藏统计
// GET /api/favorites/:user_id/stats
router.get('/:user_id/stats', (req, res) => {
    const { user_id } = req.params;
    const list = db.find('favorites', f => f.user_id === user_id);
    const stats = {
        total: list.length,
        by_type: {
            question: list.filter(f => f.type === 'question').length,
            paper: list.filter(f => f.type === 'paper').length,
            point: list.filter(f => f.type === 'point').length
        },
        by_subject: {}
    };
    list.forEach(f => {
        const s = f.subject || '通用';
        stats.by_subject[s] = (stats.by_subject[s] || 0) + 1;
    });
    res.json({ code: 0, data: stats });
});

module.exports = router;
