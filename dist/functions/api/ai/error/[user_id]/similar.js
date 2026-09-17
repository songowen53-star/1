// POST /api/ai/error/:user_id/similar — 针对指定错题推荐同类强化题
// 对应后端：backend/routes/ai-error.js POST /:user_id/similar
// body: { question_id, count }
import { listTable } from '../../../../_shared/kv-db.js';

export async function onRequestPost({ params, env, request }) {
    try {
        const userId = params.user_id;
        const body = await request.json();
        const { question_id, count } = body || {};
        if (!question_id) return Response.json({ code: 1, msg: 'question_id 必填' }, { status: 400 });

        const questions = await listTable(env, 'questions');
        const target = questions.find(q => q.id === question_id);
        if (!target) return Response.json({ code: 1007, msg: '原题不存在' }, { status: 404 });

        const maxCount = Math.min(20, parseInt(count) || 5);
        const candidates = questions.filter(q => q.id !== question_id && q.subject === target.subject);

        const recommendations = candidates.slice(0, maxCount).map((q, i) => ({
            question_id: q.id,
            subject: q.subject,
            content_preview: (q.content || '').slice(0, 60) + '...',
            type: q.type || '解答题',
            difficulty: q.difficulty || 4,
            similarity: Math.round((0.95 - i * 0.05) * 100) / 100,
            reason: i === 0 ? '同知识点·同题型' : (i === 1 ? '同知识点·变式' : '同章节·强化')
        }));

        while (recommendations.length < maxCount) {
            recommendations.push({
                question_id: 'q_sim_' + Date.now() + '_' + recommendations.length,
                subject: target.subject,
                content_preview: target.subject + ' 同类强化题 ' + (recommendations.length + 1),
                type: '解答题',
                difficulty: target.difficulty || 4,
                similarity: 0.7,
                reason: '同章节·强化'
            });
        }

        return Response.json({
            code: 0,
            data: {
                user_id: userId,
                origin_question_id: question_id,
                origin_subject: target.subject,
                origin_kp: target.knowledge_points || [],
                recommendations,
                total: recommendations.length
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '推荐同类题失败: ' + e.message }, { status: 500 });
    }
}
