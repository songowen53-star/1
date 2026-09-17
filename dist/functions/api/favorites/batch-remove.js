// POST /api/favorites/batch-remove — 批量取消收藏
// 对应后端 backend/routes/favorites.js 中的 router.post('/batch-remove')
// body: { favorite_ids: [...] }
export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { favorite_ids } = body || {};
        if (!Array.isArray(favorite_ids) || favorite_ids.length === 0) {
            return Response.json({ code: 1, msg: 'favorite_ids 必填且非空数组' }, { status: 400 });
        }

        const idSet = new Set(favorite_ids);
        const raw = await env.DATA_STORE.get('favorites.json');
        const list = raw ? JSON.parse(raw) : [];
        const before = list.length;
        const remaining = list.filter(f => !idSet.has(f.id));
        const removed = before - remaining.length;
        await env.DATA_STORE.put('favorites.json', JSON.stringify(remaining, null, 2));

        return Response.json({
            code: 0,
            data: { removed, total: favorite_ids.length },
            msg: `已取消 ${removed} 条收藏`
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '批量取消收藏失败: ' + e.message }, { status: 500 });
    }
}
