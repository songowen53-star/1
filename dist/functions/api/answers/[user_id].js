// GET /api/answers/:user_id?days=14&subject=数学 — 用户答题记录（错题本来源）
import { listTable } from '../../_shared/kv-db.js';

export async function onRequestGet({ params, env, request }) {
    try {
        const url = new URL(request.url);
        const days = parseInt(url.searchParams.get('days')) || 14;
        const since = new Date();
        since.setDate(since.getDate() - days);

        let list = (await listTable(env, 'answer_records'))
            .filter(r => r.user_id === params.user_id && new Date(r.created_at) >= since);

        const subject = url.searchParams.get('subject');
        if (subject) list = list.filter(r => r.subject === subject);

        const kpId = url.searchParams.get('knowledge_point_id');
        if (kpId) list = list.filter(r => r.knowledge_point_id === kpId);

        list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));

        return Response.json({ code: 0, data: list, total: list.length });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载答题记录失败: ' + e.message }, { status: 500 });
    }
}
