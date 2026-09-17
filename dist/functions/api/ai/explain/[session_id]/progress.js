// GET /api/ai/explain/:session_id/progress — 查询讲解进度
// 对应后端：backend/routes/ai-explain.js GET /:session_id/progress
import { listTable } from '../../../../_shared/kv-db.js';

export async function onRequestGet({ params, env }) {
    try {
        const { session_id } = params;
        const session = (await listTable(env, 'explain_sessions')).find(s => s.session_id === session_id);
        if (!session) return Response.json({ code: 1007, msg: '讲题会话不存在' }, { status: 404 });

        return Response.json({
            code: 0,
            data: {
                session_id,
                completed: session.steps.filter(s => s.status === 'done').length,
                total: session.total_steps,
                percent: session.progress_percent,
                current_step: session.current_step,
                current_status: session.status,
                steps: session.steps
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载进度失败: ' + e.message }, { status: 500 });
    }
}
