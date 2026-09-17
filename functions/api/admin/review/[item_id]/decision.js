// POST /api/admin/review/:item_id/decision — 提交审核决定
// 对应后端 backend/routes/admin-review.js 中的 router.post('/:item_id/decision')
// body: { reviewer, decision, comments, corrections }

export async function onRequestPost({ params, env, request }) {
    try {
        const { item_id } = params;
        const body = await request.json();
        const { reviewer, decision, comments, corrections } = body || {};

        const record = {
            id: 'rd_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
            item_id,
            reviewer: reviewer || 'admin',
            decision: decision || 'approve',
            comments: comments || '',
            corrections: corrections || {},
            reviewed_at: new Date().toISOString()
        };

        // 写入 review_decisions.json
        const raw = await env.DATA_STORE.get('review_decisions.json');
        const list = raw ? JSON.parse(raw) : [];
        list.push(record);
        await env.DATA_STORE.put('review_decisions.json', JSON.stringify(list, null, 2));

        return Response.json({
            code: 0,
            data: {
                item_id,
                decision,
                reviewed_at: record.reviewed_at,
                next_pending: Math.max(0, 7 - (decision === 'approve' ? 1 : 0))
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '提交审核决定失败: ' + e.message }, { status: 500 });
    }
}
