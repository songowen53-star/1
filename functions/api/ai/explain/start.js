// POST /api/ai/explain/start — 启动一道题的分步讲解
// 对应后端：backend/routes/ai-explain.js POST /start
// body: { question_id, user_id, model }，写入 explain_sessions 表
import { listTable } from '../../../_shared/kv-db.js';

const STEP_TEMPLATES = [
    { title: '审题分析', desc: '识别题目关键条件、已知量与求解目标，明确考点所属知识模块。' },
    { title: '建立方程', desc: '将文字条件转化为数学表达式，建立等量关系或函数关系。' },
    { title: '方法应用', desc: '选择合适的方法（如韦达定理、求导、向量分解等）简化计算。' },
    { title: '求解过程', desc: '代入数据，逐步求解，注意运算顺序与符号处理。' },
    { title: '结论验证', desc: '检验答案是否符合题意与定义域，写出最终结论。' }
];

export async function onRequestPost({ env, request }) {
    try {
        const body = await request.json();
        const { question_id, user_id, model } = body || {};
        if (!question_id) return Response.json({ code: 1, msg: 'question_id 必填' }, { status: 400 });

        const questions = await listTable(env, 'questions');
        const question = questions.find(q => q.id === question_id);
        if (!question) return Response.json({ code: 1007, msg: '讲题会话不存在：题目未找到' }, { status: 404 });

        const sessionId = 'exp_' + Date.now() + '_' + (user_id || 'guest');
        const now = new Date().toISOString();

        const sessions = await listTable(env, 'explain_sessions');
        const session = {
            id: `explain_sessions_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            session_id: sessionId,
            question_id,
            user_id: user_id || 'guest',
            subject: question.subject,
            total_steps: 5,
            current_step: 1,
            progress_percent: 0,
            status: 'active',
            model: model || 'deepseek-r1',
            steps: STEP_TEMPLATES.map((t, i) => ({
                num: i + 1,
                status: i === 0 ? 'active' : 'locked',
                title: t.title,
                desc: t.desc,
                time: '待开始',
                understood: null,
                feedback_count: 0
            })),
            estimated_min: 10,
            created_at: now
        };
        sessions.push(session);
        await env.DATA_STORE.put('explain_sessions.json', JSON.stringify(sessions, null, 2));

        return Response.json({
            code: 0,
            data: {
                session_id: sessionId,
                question_id,
                total_steps: 5,
                current_step: 1,
                progress_percent: 0,
                estimated_min: 10,
                model: model || 'deepseek-r1',
                question_content: question.content
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '启动讲题失败: ' + e.message }, { status: 500 });
    }
}
