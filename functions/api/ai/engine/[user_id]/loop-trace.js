// GET /api/ai/engine/:user_id/loop-trace?limit=20 — 飞轮运行轨迹
// 对应后端：backend/routes/ai-engine.js GET /:user_id/loop-trace
import { listTable } from '../../../../_shared/kv-db.js';

export async function onRequestGet({ params, env, request }) {
    try {
        const userId = params.user_id;
        const url = new URL(request.url);
        const limit = Math.min(50, Math.max(5, parseInt(url.searchParams.get('limit')) || 20));

        const events = (await listTable(env, 'events'))
            .filter(e => e.user_id === userId && e.type === 'answer')
            .sort((a, b) => new Date(b.ts || b.created_at).getTime() - new Date(a.ts || a.created_at).getTime())
            .slice(0, limit);

        const questions = await listTable(env, 'questions');
        const kps = await listTable(env, 'knowledge_points');

        const trace = events.map((ev, idx) => {
            const qid = ev.payload && ev.payload.question_id;
            const q = qid ? questions.find(x => x.id === qid) : null;
            const kp = q && q.knowledge_point_id ? kps.find(x => x.id === q.knowledge_point_id) : null;
            return {
                step: idx + 1,
                time: ev.ts || ev.created_at,
                question_id: qid,
                knowledge_point: kp ? kp.name : null,
                subject: q ? q.subject : null,
                is_correct: !!(ev.payload && ev.payload.is_correct),
                mastery_after: kp ? +(kp.mastery_rate || 0).toFixed(2) : null
            };
        }).reverse();

        return Response.json({
            code: 0,
            data: {
                user_id: userId,
                loop_count: trace.length,
                trace
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载飞轮轨迹失败: ' + e.message }, { status: 500 });
    }
}
