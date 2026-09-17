// GET /api/knowledge?subject=数学 — 知识点列表（支持按学科筛选）
import { listTable } from '../../_shared/kv-db.js';

export async function onRequestGet({ env, request }) {
    try {
        const url = new URL(request.url);
        const subject = url.searchParams.get('subject');

        let list = await listTable(env, 'knowledge_points');
        if (subject) list = list.filter(k => k.subject === subject);

        return Response.json({ code: 0, data: list });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载知识点失败: ' + e.message }, { status: 500 });
    }
}
