// GET /api/ai/coach/:user_id/goals — 长期目标跟踪
// 对应后端：backend/routes/ai-coach.js GET /:user_id/goals
import { listTable } from '../../../../_shared/kv-db.js';

export async function onRequestGet({ params, env }) {
    try {
        const userId = params.user_id;
        const goals = (await listTable(env, 'coach_goals')).filter(g => g.user_id === userId);

        if (goals.length === 0) {
            return Response.json({
                code: 0,
                data: [{
                    id: 'goal_default',
                    user_id: userId,
                    target_score: 650,
                    current_score: 615,
                    gap: 35,
                    deadline: '2027-06-07',
                    days_left: 265,
                    progress_percent: 94
                }]
            });
        }

        return Response.json({ code: 0, data: goals });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载目标失败: ' + e.message }, { status: 500 });
    }
}
