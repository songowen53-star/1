// GET /api/favorites/:user_id/stats — 收藏统计
// 对应后端 backend/routes/favorites.js 中的 router.get('/:user_id/stats')
import { listTable } from '../../../_shared/kv-db.js';

export async function onRequestGet({ params, env }) {
    try {
        const { user_id } = params;
        const list = (await listTable(env, 'favorites')).filter(f => f.user_id === user_id);
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
        return Response.json({ code: 0, data: stats });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载收藏统计失败: ' + e.message }, { status: 500 });
    }
}
