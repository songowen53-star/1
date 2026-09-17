// GET  /api/favorites/:user_id?type=question|paper|point&subject=&page=&size= — 获取用户收藏列表
// DELETE /api/favorites/:favorite_id — 取消收藏（同一文件按 HTTP 方法分流）
// 对应后端 backend/routes/favorites.js 中的 router.get('/:user_id') 与 router.delete('/:favorite_id')
import { listTable } from '../../_shared/kv-db.js';

export async function onRequestGet({ params, env, request }) {
    try {
        // GET 场景：params.user_id 为用户 ID
        const user_id = params.user_id;
        const url = new URL(request.url);
        const type = url.searchParams.get('type');
        const subject = url.searchParams.get('subject');
        const page = Math.max(1, parseInt(url.searchParams.get('page')) || 1);
        const size = Math.min(100, Math.max(1, parseInt(url.searchParams.get('size')) || 20));

        let list = (await listTable(env, 'favorites')).filter(f => f.user_id === user_id);
        if (type) list = list.filter(f => f.type === type);
        if (subject) list = list.filter(f => f.subject === subject);

        // 按收藏时间倒序
        list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

        const total = list.length;
        const start = (page - 1) * size;
        const questions = await listTable(env, 'questions');
        const points = await listTable(env, 'knowledge_points');

        const paged = list.slice(start, start + size).map(f => {
            // 关联目标对象快照
            let target = null;
            if (f.type === 'question') target = questions.find(q => q.id === f.target_id);
            else if (f.type === 'point') target = points.find(p => p.id === f.target_id);
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

        return Response.json({
            code: 0,
            data: paged,
            total,
            page,
            size,
            pages: Math.ceil(total / size)
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载收藏列表失败: ' + e.message }, { status: 500 });
    }
}

export async function onRequestDelete({ params, env }) {
    try {
        // DELETE 场景：params.user_id 实为 favorite_id（收藏记录 ID）
        const favorite_id = params.user_id;

        const raw = await env.DATA_STORE.get('favorites.json');
        const list = raw ? JSON.parse(raw) : [];
        const idx = list.findIndex(f => f.id === favorite_id);
        if (idx === -1) {
            return Response.json({ code: 1, msg: '收藏记录不存在' }, { status: 404 });
        }
        list.splice(idx, 1);
        await env.DATA_STORE.put('favorites.json', JSON.stringify(list, null, 2));
        return Response.json({ code: 0, msg: '已取消收藏' });
    } catch (e) {
        return Response.json({ code: 1, msg: '取消收藏失败: ' + e.message }, { status: 500 });
    }
}
