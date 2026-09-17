// GET /api/events/health — 飞轮链路健康检查
// 对应后端：backend/routes/events.js GET /health
import { listTable } from '../../_shared/kv-db.js';

export async function onRequestGet({ env }) {
    try {
        const totalEvents = (await listTable(env, 'events')).length;
        const totalAnswers = (await listTable(env, 'answer_records')).length;
        const totalKps = (await listTable(env, 'knowledge_points')).filter(k => k.last_practice_at).length;

        return Response.json({
            code: 0,
            data: {
                total_events: totalEvents,
                total_answers: totalAnswers,
                knowledge_points_with_practice: totalKps,
                flywheel_status: totalEvents > 0 && totalAnswers > 0 ? 'running' : 'idle'
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '健康检查失败: ' + e.message }, { status: 500 });
    }
}
