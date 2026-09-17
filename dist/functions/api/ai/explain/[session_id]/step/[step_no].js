// GET /api/ai/explain/:session_id/step/:step_no — 获取指定步骤讲解 + 理解度检测题
// 对应后端：backend/routes/ai-explain.js GET /:session_id/step/:step_no
import { listTable } from '../../../../../_shared/kv-db.js';

const UNDERSTANDING_CHECKS = [
    { question: '本题的关键条件是？', options: ['已知量+求解目标', '仅求解目标', '仅已知量', '都不对'] },
    { question: '本题的核心方法是？', options: ['定义法', '公式法', '分类讨论', '数形结合'] },
    { question: '下一步应先做什么？', options: ['代入数据', '简化表达式', '验证答案', '结束'] },
    { question: '答案是否合理？', options: ['合理', '过大', '过小', '无法判断'] },
    { question: '本题易错点是？', options: ['符号处理', '运算顺序', '定义域', '以上都是'] }
];

export async function onRequestGet({ params, env }) {
    try {
        const { session_id, step_no } = params;
        const num = parseInt(step_no);

        const sessions = await listTable(env, 'explain_sessions');
        const session = sessions.find(s => s.session_id === session_id);
        if (!session) return Response.json({ code: 1007, msg: '讲题会话不存在' }, { status: 404 });
        if (num < 1 || num > session.total_steps) {
            return Response.json({ code: 1008, msg: '步骤号超出范围' }, { status: 400 });
        }

        const step = session.steps[num - 1];
        const check = UNDERSTANDING_CHECKS[num - 1] || UNDERSTANDING_CHECKS[0];

        return Response.json({
            code: 0,
            data: {
                session_id,
                step_no: num,
                status: step.status,
                title: step.title,
                desc: step.desc,
                time: step.time,
                tokens: 200 + num * 30,
                model: session.model,
                understanding_check: check
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载步骤失败: ' + e.message }, { status: 500 });
    }
}
