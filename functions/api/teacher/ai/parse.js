// POST /api/teacher/ai/parse — AI 解析（生成答案+解析）
// 对应后端 backend/routes/teacher-ai.js 中的 router.post('/parse')
// body: { question_ids, model }
import { listTable } from '../../../_shared/kv-db.js';

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { question_ids, model } = body || {};
        if (!Array.isArray(question_ids) || question_ids.length === 0) {
            return Response.json({ code: 1, msg: 'question_ids 必填' }, { status: 400 });
        }

        const questions = await listTable(env, 'questions');

        const results = question_ids.map(qid => {
            const q = questions.find(x => x.id === qid);
            if (!q) return { id: qid, answer: '解析失败', analysis: '题目不存在', confidence: 0 };

            // 模拟 AI 解析生成
            return {
                id: qid,
                answer: q.answer || 'B',
                analysis: q.analysis || '由题意分析，应用基本概念求解。',
                confidence: 0.95,
                model: model || 'deepseek-r1'
            };
        });

        return Response.json({ code: 0, data: results });
    } catch (e) {
        return Response.json({ code: 1, msg: 'AI 解析失败: ' + e.message }, { status: 500 });
    }
}
