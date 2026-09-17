// ========== 运营 AI 审核路由 ==========
// OCR 审核 + AI 审核队列 + 审核统计
// 对应原型：admin-ocr / admin-ai-review
const express = require('express');
const router = express.Router();
const db = require('../db');

// 生成模拟审核队列
function genReviewQueue(type, status, page, size) {
    const items = [];
    const total = 8;
    const start = (page - 1) * size;
    for (let i = 0; i < Math.min(size, total - start); i++) {
        items.push({
            item_id: 'rev_' + type + '_' + (start + i + 1),
            job_id: 'import_20260915_001',
            question_no: (start + i + 1),
            type: ['选择题', '填空题', '解答题'][i % 3],
            content_preview: ['已知集合 A=...', '设函数 f(x)=...', '已知椭圆 C...'][i % 3],
            ocr_confidence: Math.round((0.85 + Math.random() * 0.13) * 100) / 100,
            need_review: Math.random() > 0.6,
            submitted_at: '2026-09-15 14:30',
            status: status
        });
    }
    return { items, total };
}

// GET /api/admin/review/queue
// 审核队列
router.get('/queue', (req, res) => {
    const type = req.query.type || 'ocr';
    const status = req.query.status || 'pending';
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 20;

    const { items, total } = genReviewQueue(type, status, page, size);

    res.json({ code: 0, data: items, total });
});

// POST /api/admin/review/:item_id/decision
// 提交审核决定
router.post('/:item_id/decision', (req, res) => {
    const { item_id } = req.params;
    const { reviewer, decision, comments, corrections } = req.body || {};

    const record = db.insert('review_decisions', {
        item_id,
        reviewer: reviewer || 'admin',
        decision: decision || 'approve',
        comments: comments || '',
        corrections: corrections || {},
        reviewed_at: new Date().toISOString()
    });

    res.json({
        code: 0,
        data: {
            item_id,
            decision,
            reviewed_at: record.reviewed_at,
            next_pending: Math.max(0, 7 - (decision === 'approve' ? 1 : 0))
        }
    });
});

// GET /api/admin/review/stats
// 审核统计
router.get('/stats', (req, res) => {
    const days = parseInt(req.query.days) || 7;

    res.json({
        code: 0,
        data: {
            total_pending: 8,
            total_reviewed: 42,
            approved: 38,
            rejected: 4,
            avg_review_time_min: 3.5,
            days: days,
            by_type: [
                { type: 'ocr', pending: 3, reviewed: 22 },
                { type: 'ai', pending: 5, reviewed: 20 }
            ]
        }
    });
});

module.exports = router;
