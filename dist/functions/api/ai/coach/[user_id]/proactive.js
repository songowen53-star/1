// POST /api/ai/coach/:user_id/proactive — 主动推送诊断
// 对应后端：backend/routes/ai-coach.js POST /:user_id/proactive
import { listTable } from '../../../../_shared/kv-db.js';

export async function onRequestPost({ params, env, request }) {
    try {
        const userId = params.user_id;
        const body = await request.json();
        const { message, trigger } = body || {};

        const arr = await listTable(env, 'coach_proactive');
        const record = {
            id: `coach_proactive_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            user_id: userId,
            message: message || '检测到你最近数学正确率下降 8%，建议复习导数第二问',
            trigger: trigger || 'correct_rate_drop',
            status: 'sent',
            time: new Date().toISOString(),
            created_at: new Date().toISOString()
        };
        arr.push(record);
        await env.DATA_STORE.put('coach_proactive.json', JSON.stringify(arr, null, 2));

        return Response.json({ code: 0, data: record });
    } catch (e) {
        return Response.json({ code: 1, msg: '主动推送失败: ' + e.message }, { status: 500 });
    }
}
