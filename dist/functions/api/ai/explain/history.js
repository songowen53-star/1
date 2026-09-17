// GET /api/ai/explain/history?user_id=xxx — 历史讲题记录
// 对应后端：backend/routes/ai-explain.js GET /history
import { listTable } from '../../../_shared/kv-db.js';

export async function onRequestGet({ env, request }) {
    try {
        const url = new URL(request.url);
        const user_id = url.searchParams.get('user_id');
        if (!user_id) return Response.json({ code: 1, msg: 'user_id 必填' }, { status: 400 });

        const list = (await listTable(env, 'explain_sessions'))
            .filter(s => s.user_id === user_id)
            .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
            .slice(0, 20)
            .map(s => ({
                session_id: s.session_id,
                question_id: s.question_id,
                subject: s.subject,
                progress_percent: s.progress_percent,
                status: s.status,
                model: s.model,
                created_at: s.created_at
            }));

        return Response.json({ code: 0, data: list, total: list.length });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载历史讲题失败: ' + e.message }, { status: 500 });
    }
}
