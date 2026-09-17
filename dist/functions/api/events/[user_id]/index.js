// GET /api/events/:user_id?type=&days=7&page=1&size=20 — 用户事件流查询（数据飞轮可观测）
// 对应后端：backend/routes/events.js GET /:user_id
import { listTable } from '../../../_shared/kv-db.js';

export async function onRequestGet({ params, env, request }) {
    try {
        const userId = params.user_id;
        const url = new URL(request.url);
        const type = url.searchParams.get('type');
        const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get('days')) || 7));
        const page = Math.max(1, parseInt(url.searchParams.get('page')) || 1);
        const size = Math.min(100, Math.max(1, parseInt(url.searchParams.get('size')) || 20));

        const since = new Date();
        since.setDate(since.getDate() - days);
        const sinceTime = since.getTime();

        let list = (await listTable(env, 'events')).filter(e =>
            e.user_id === userId && new Date(e.ts || e.created_at).getTime() >= sinceTime
        );
        if (type) list = list.filter(e => e.type === type);

        list.sort((a, b) => new Date(b.ts || b.created_at).getTime() - new Date(a.ts || a.created_at).getTime());

        const total = list.length;
        const start = (page - 1) * size;
        const paged = list.slice(start, start + size);

        const typeStats = {};
        list.forEach(e => { typeStats[e.type] = (typeStats[e.type] || 0) + 1; });

        return Response.json({
            code: 0,
            data: paged,
            total,
            page,
            size,
            pages: Math.ceil(total / size),
            type_stats: typeStats
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '事件查询失败: ' + e.message }, { status: 500 });
    }
}
