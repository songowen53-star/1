// GET /api/admin/review/queue?type=&status=&page=&size= — 审核队列
// 对应后端 backend/routes/admin-review.js 中的 router.get('/queue')

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

export async function onRequestGet({ request }) {
    try {
        const url = new URL(request.url);
        const type = url.searchParams.get('type') || 'ocr';
        const status = url.searchParams.get('status') || 'pending';
        const page = parseInt(url.searchParams.get('page')) || 1;
        const size = parseInt(url.searchParams.get('size')) || 20;

        const { items, total } = genReviewQueue(type, status, page, size);

        return Response.json({ code: 0, data: items, total });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载审核队列失败: ' + e.message }, { status: 500 });
    }
}
