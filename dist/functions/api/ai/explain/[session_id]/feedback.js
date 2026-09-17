// POST /api/ai/explain/:session_id/feedback — 提交理解度反馈，AI 动态调整下一步策略
// 对应后端：backend/routes/ai-explain.js POST /:session_id/feedback
// body: { step_no, understood, answer, confidence }，写回 explain_sessions
import { listTable } from '../../../../_shared/kv-db.js';

export async function onRequestPost({ params, env, request }) {
    try {
        const { session_id } = params;
        const body = await request.json();
        const { step_no, understood, answer, confidence } = body || {};
        const num = parseInt(step_no);

        const sessions = await listTable(env, 'explain_sessions');
        const idx = sessions.findIndex(s => s.session_id === session_id);
        if (idx < 0) return Response.json({ code: 1007, msg: '讲题会话不存在' }, { status: 404 });

        const session = sessions[idx];
        const step = session.steps[num - 1];
        if (!step) return Response.json({ code: 1008, msg: '步骤号超出范围' }, { status: 400 });

        // 记录反馈
        step.understood = understood;
        step.feedback_count = (step.feedback_count || 0) + 1;
        step.status = 'done';
        step.time = '用时 ' + (1 + num) + 'min';

        // 策略决策
        let strategy = 'advance';
        let nextStep = num + 1;
        if (understood && answer === 'C') {
            strategy = 'advance';
        } else if (understood && answer !== 'C') {
            strategy = 're_explain';
            step.status = 'active';
            nextStep = num;
        } else if (!understood) {
            if (step.feedback_count >= 3) {
                strategy = 'escalate';
                nextStep = num;
            } else {
                strategy = 'example';
                step.status = 'active';
                nextStep = num;
            }
        }

        if (strategy === 'advance' && nextStep <= session.total_steps) {
            session.steps[nextStep - 1].status = 'active';
            session.current_step = nextStep;
        }
        session.progress_percent = Math.round(session.steps.filter(s => s.status === 'done').length / session.total_steps * 100);

        sessions[idx] = {
            ...session,
            steps: session.steps,
            current_step: session.current_step,
            progress_percent: session.progress_percent,
            status: session.progress_percent === 100 ? 'completed' : 'active'
        };
        await env.DATA_STORE.put('explain_sessions.json', JSON.stringify(sessions, null, 2));

        return Response.json({
            code: 0,
            data: {
                next_step: nextStep,
                strategy,
                progress_percent: session.progress_percent,
                remaining_steps: session.total_steps - session.steps.filter(s => s.status === 'done').length
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '提交反馈失败: ' + e.message }, { status: 500 });
    }
}
