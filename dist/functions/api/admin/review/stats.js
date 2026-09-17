// GET /api/admin/review/stats?days= — 审核统计
// 对应后端 backend/routes/admin-review.js 中的 router.get('/stats')

export async function onRequestGet({ request }) {
    try {
        const url = new URL(request.url);
        const days = parseInt(url.searchParams.get('days')) || 7;

        return Response.json({
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
    } catch (e) {
        return Response.json({ code: 1, msg: '加载审核统计失败: ' + e.message }, { status: 500 });
    }
}
