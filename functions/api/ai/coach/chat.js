// POST /api/ai/coach/chat — 教练对话（SSE 降级为一次性 JSON 响应）
// 对应后端：backend/routes/ai-coach.js POST /chat
// 后端为 SSE 流式；Cloudflare 边缘不易支持长连接，降级为 JSON 返回模拟回复 + 上下文 + 动作
import { listTable } from '../../../_shared/kv-db.js';

async function insertIntoTable(env, tableName, record) {
    const arr = await listTable(env, tableName);
    const newRec = {
        id: `${tableName}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        created_at: new Date().toISOString(),
        ...record
    };
    arr.push(newRec);
    await env.DATA_STORE.put(`${tableName}.json`, JSON.stringify(arr, null, 2));
    return newRec;
}

export async function onRequestPost({ env, request }) {
    try {
        const body = await request.json();
        const { user_id, message, context } = body || {};
        if (!message || !String(message).trim()) {
            return Response.json({ code: 1, msg: 'message 必填' }, { status: 400 });
        }

        // 聚合学情上下文
        const today = new Date().toISOString().slice(0, 10);
        const todayRecords = (await listTable(env, 'learning_records')).filter(r =>
            r.user_id === user_id && r.date === today
        );
        const todayDuration = todayRecords.reduce((s, r) => s + (r.duration_min || 0), 0);
        const todayQuestions = todayRecords.reduce((s, r) => s + (r.questions_count || 0), 0);
        const todayCorrect = todayRecords.reduce((s, r) => s + (r.correct_count || 0), 0);
        const correctRate = todayQuestions > 0 ? Math.round(todayCorrect / todayQuestions * 100) : 0;

        const weakPoints = (await listTable(env, 'knowledge_points')).filter(k =>
            k.mastery_rate < 0.7 && k.user_id === user_id
        ).slice(0, 3);

        // 生成回复（规则匹配，模拟 LLM 输出）
        let text = '';
        const actions = [];
        const msg = String(message);
        if (/今天|怎么样|学得/.test(msg)) {
            text = `今天学习时长 ${todayDuration} 分钟，做题 ${todayQuestions} 道，正确率 ${correctRate}%。`;
            if (correctRate < 80 && weakPoints[0]) {
                text += `不过${weakPoints[0].subject || ''}正确率有提升空间，主要是${weakPoints[0].name}。我给你推荐 3 道练习题，做完我帮你复盘。`;
                actions.push({ label: '开始练习', type: 'practice', target: 'q_001,q_002,q_003' });
            } else {
                text += '继续保持！';
            }
        } else if (/计划|明天|安排/.test(msg)) {
            text = '基于你的薄弱点，建议明天：①数学导数 40min ②物理电磁感应 35min ③英语阅读 30min。预计提分 5 分。';
            actions.push({ label: '生成计划', type: 'plan', target: '/api/recommend/' + user_id + '/plan' });
        } else if (/分数|预测|高考/.test(msg)) {
            text = '基于当前学情，预测高考分数约 615 分（较上次 +8 分），985 录取概率 67%，211 录取概率 85%。';
            actions.push({ label: '查看预测', type: 'predict', target: '/api/predict/' + user_id + '/score' });
        } else {
            text = '我是你的 AI 学习教练，可以帮你：①分析学情 ②生成学习计划 ③推荐练习题 ④预测分数。告诉我你想了解什么？';
        }

        // 保存对话到 KV
        await insertIntoTable(env, 'coach_history', {
            user_id: user_id || 'guest',
            message: msg,
            reply: text,
            context: { todayDuration, todayQuestions, correctRate },
            time: new Date().toISOString()
        });

        return Response.json({
            code: 0,
            data: {
                route: { modelKey: 'qwen3-72b', role: '个性化教练' },
                context: {
                    today_duration_min: todayDuration,
                    today_questions: todayQuestions,
                    correct_rate: correctRate,
                    weak_point: weakPoints[0] ? weakPoints[0].name : '无'
                },
                reply: { text, actions },
                done: true
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '教练对话失败: ' + e.message }, { status: 500 });
    }
}
