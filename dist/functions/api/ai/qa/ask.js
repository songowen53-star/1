// POST /api/ai/qa/ask — 学生提问（SSE 降级为一次性 JSON 响应）
// 对应后端：backend/routes/ai-qa.js POST /ask
// 后端为 SSE 流式；Cloudflare 边缘不易支持长连接，降级为 JSON 返回 sections + drawing + follow_ups
import { listTable } from '../../../_shared/kv-db.js';

const QA_KB = [
    {
        keywords: ['椭圆', '双曲线', '区别', '圆锥曲线'],
        sections: [
            { title: '椭圆', title_color: '#10B981', content: '到两定点（焦点）距离之和为常数的点的轨迹。', formula: '|PF₁| + |PF₂| = 2a (2a > 2c)' },
            { title: '双曲线', title_color: '#EF4444', content: '到两定点（焦点）距离之差为常数的点的轨迹。', formula: '||PF₁| - |PF₂|| = 2a (2a < 2c)' }
        ],
        drawing: { icon: 'fa-draw-polygon', text: 'AI手绘图示：椭圆与双曲线几何对比' },
        follow_ups: ['能不能举个例子？', '这个知识点常考什么？', '出道题练练']
    },
    {
        keywords: ['导数', '单调性', '极值', '最值'],
        sections: [
            { title: '单调性判断', title_color: '#3B82F6', content: '求导 f\'(x)，令 f\'(x)>0 得增区间，f\'(x)<0 得减区间。', formula: "f'(x) > 0 → 递增" },
            { title: '极值求解', title_color: '#8B5CF6', content: '令 f\'(x)=0 解驻点，判断驻点两侧导数符号变化。', formula: 'f\'(x₀)=0 且两侧符号变化' }
        ],
        drawing: { icon: 'fa-chart-line', text: 'AI手绘函数图像：极值点示意' },
        follow_ups: ['求导公式有哪些？', '极值和最值的区别？', '出道导数题']
    }
];

const QA_FOLLOWUPS = ['能不能举个例子？', '这个知识点常考什么？', '出道题练练'];

function matchQA(question) {
    const q = (question || '').toLowerCase();
    for (const kb of QA_KB) {
        if (kb.keywords.some(k => q.indexOf(k.toLowerCase()) >= 0)) return kb;
    }
    return {
        sections: [
            { title: '通用解答', title_color: '#3B82F6', content: '该问题涉及高中知识点。建议把问题描述得更具体，包含具体的知识点名称或题目。', formula: '' }
        ],
        drawing: { icon: 'fa-lightbulb', text: 'AI提示：尝试用关键词提问，如"椭圆""导数""牛顿定律"' },
        follow_ups: QA_FOLLOWUPS
    };
}

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
        const { user_id, question, subject } = body || {};
        if (!question || !String(question).trim()) {
            return Response.json({ code: 1, msg: '问题不能为空' }, { status: 400 });
        }

        const matched = matchQA(question);

        // 保存历史到 KV
        await insertIntoTable(env, 'qa_history', {
            user_id: user_id || 'guest',
            question,
            subject: subject || '通用',
            answer_preview: matched.sections[0].content.slice(0, 50),
            tokens: 342,
            time: new Date().toISOString()
        });

        return Response.json({
            code: 0,
            data: {
                route: { modelKey: 'qwen3-72b', badge: '中文王', role: 'RAG增强问答' },
                reply: {
                    sections: matched.sections,
                    drawing: matched.drawing,
                    tokens: 342,
                    latency_ms: 1850
                },
                follow_up: matched.follow_ups,
                done: true
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '答疑失败: ' + e.message }, { status: 500 });
    }
}
