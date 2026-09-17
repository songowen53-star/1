// GET /api/ai/qa/:user_id/history?limit=10 — 历史问答
// 对应后端：backend/routes/ai-qa.js GET /:user_id/history
import { listTable } from '../../../../_shared/kv-db.js';

export async function onRequestGet({ params, env, request }) {
    try {
        const userId = params.user_id;
        const url = new URL(request.url);
        const limit = Math.min(50, parseInt(url.searchParams.get('limit')) || 10);

        const list = (await listTable(env, 'qa_history'))
            .filter(q => q.user_id === userId)
            .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
            .slice(0, limit);

        return Response.json({ code: 0, data: list, total: list.length });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载历史问答失败: ' + e.message }, { status: 500 });
    }
}
