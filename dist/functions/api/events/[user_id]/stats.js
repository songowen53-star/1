// GET /api/events/:user_id/stats?days=30 — 事件流统计（数据飞轮运行状态）
// 对应后端：backend/routes/events.js GET /:user_id/stats
import { listTable } from '../../../_shared/kv-db.js';

const VALID_EVENTS = ['answer','learning','ai_chat','favorite','view','practice','mock_exam','photo_solve','review','plan_complete'];

export async function onRequestGet({ params, env, request }) {
    try {
        const userId = params.user_id;
        const url = new URL(request.url);
        const days = Math.min(180, Math.max(1, parseInt(url.searchParams.get('days')) || 30));
        const since = new Date();
        since.setDate(since.getDate() - days);
        const sinceTime = since.getTime();

        const events = (await listTable(env, 'events')).filter(e =>
            e.user_id === userId && new Date(e.ts || e.created_at).getTime() >= sinceTime
        );

        // 按类型统计
        const byType = {};
        VALID_EVENTS.forEach(t => { byType[t] = 0; });
        events.forEach(e => { byType[e.type] = (byType[e.type] || 0) + 1; });

        // 按天分布
        const byDay = {};
        events.forEach(e => {
            const day = (e.ts || e.created_at || '').slice(0, 10);
            byDay[day] = (byDay[day] || 0) + 1;
        });

        // 数据飞轮完整性指标
        const answerCount = byType.answer || 0;
        const learningCount = byType.learning || 0;
        const aiCount = byType.ai_chat || 0;

        const kps = (await listTable(env, 'knowledge_points')).filter(k => k.user_id === userId || k.last_practice_at);
        const updatedKps = kps.filter(k => k.last_practice_at && new Date(k.last_practice_at).getTime() >= sinceTime).length;

        return Response.json({
            code: 0,
            data: {
                total_events: events.length,
                by_type: byType,
                by_day: byDay,
                flywheel: {
                    input: { answer: answerCount, learning: learningCount, ai_chat: aiCount },
                    knowledge_updates: updatedKps,
                    loop_active: answerCount > 0 && updatedKps > 0
                }
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '事件统计失败: ' + e.message }, { status: 500 });
    }
}
