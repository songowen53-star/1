// GET /api/favorites/:user_id/check?type=&target_id= — 检查是否已收藏
// 对应后端 backend/routes/favorites.js 中的 router.get('/:user_id/check')
import { listTable } from '../../../_shared/kv-db.js';

export async function onRequestGet({ params, env, request }) {
    try {
        const { user_id } = params;
        const url = new URL(request.url);
        const type = url.searchParams.get('type');
        const target_id = url.searchParams.get('target_id');
        if (!type || !target_id) {
            return Response.json({ code: 1, msg: 'type 和 target_id 必填' }, { status: 400 });
        }
        const hit = (await listTable(env, 'favorites')).find(f =>
            f.user_id === user_id && f.type === type && f.target_id === target_id
        );
        return Response.json({
            code: 0,
            data: { favorited: !!hit, favorite_id: hit ? hit.id : null }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '检查收藏状态失败: ' + e.message }, { status: 500 });
    }
}
