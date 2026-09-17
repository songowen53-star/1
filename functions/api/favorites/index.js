// POST /api/favorites — 添加收藏
// 对应后端 backend/routes/favorites.js 中的 router.post('/')
// body: { user_id, type: 'question'|'paper'|'point', target_id, subject?, note? }
import { listTable } from '../../_shared/kv-db.js';

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { user_id, type, target_id, subject, note } = body || {};
        if (!user_id) return Response.json({ code: 1, msg: 'user_id 必填' }, { status: 400 });
        if (!type || !['question', 'paper', 'point'].includes(type)) {
            return Response.json({ code: 1, msg: "type 必须为 'question'|'paper'|'point'" }, { status: 400 });
        }
        if (!target_id) return Response.json({ code: 1, msg: 'target_id 必填' }, { status: 400 });

        // 去重：同一用户对同一目标只能收藏一次
        const existing = (await listTable(env, 'favorites')).find(f =>
            f.user_id === user_id && f.type === type && f.target_id === target_id
        );
        if (existing) {
            return Response.json({ code: 0, data: existing, msg: '已收藏，无需重复操作' });
        }

        // 校验目标存在
        const tableMap = { question: 'questions', point: 'knowledge_points', paper: 'papers' };
        const target = (await listTable(env, tableMap[type])).find(x => x.id === target_id);
        // paper 表暂不存在时跳过校验
        if (type !== 'paper' && !target) {
            return Response.json({ code: 1, msg: '收藏目标不存在' }, { status: 404 });
        }

        const record = {
            id: 'fav_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
            user_id,
            type,
            target_id,
            subject: subject || (target && target.subject) || '通用',
            note: note || '',
            created_at: new Date().toISOString()
        };

        // 写入 KV：读取现有数组 → 追加 → 写回
        const raw = await env.DATA_STORE.get('favorites.json');
        const list = raw ? JSON.parse(raw) : [];
        list.push(record);
        await env.DATA_STORE.put('favorites.json', JSON.stringify(list, null, 2));

        return Response.json({ code: 0, data: record, msg: '收藏成功' });
    } catch (e) {
        return Response.json({ code: 1, msg: '收藏失败: ' + e.message }, { status: 500 });
    }
}
