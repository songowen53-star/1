// POST /api/teacher/ai/tag — AI 标知识点
// 对应后端 backend/routes/teacher-ai.js 中的 router.post('/tag')
// body: { question_ids, subject }

export async function onRequestPost({ request }) {
    try {
        const body = await request.json();
        const { question_ids, subject } = body || {};
        if (!Array.isArray(question_ids) || question_ids.length === 0) {
            return Response.json({ code: 1, msg: 'question_ids 必填' }, { status: 400 });
        }

        // 模拟 AI 知识点标注
        const tagMap = {
            '数学': ['集合运算', '函数性质', '导数应用', '圆锥曲线', '数列求和'],
            '物理': ['牛顿运动定律', '电磁感应', '动量守恒', '能量转化'],
            '化学': ['化学平衡', '有机推断', '氧化还原', '电解质溶液']
        };
        const tags = tagMap[subject || '数学'] || tagMap['数学'];

        const results = question_ids.map((qid, i) => ({
            id: qid,
            knowledge_points: [tags[i % tags.length], tags[(i + 1) % tags.length]],
            kp_ids: ['kp_' + subject + '_' + (i + 1)],
            confidence: Math.round((0.85 + Math.random() * 0.13) * 100) / 100
        }));

        return Response.json({ code: 0, data: results });
    } catch (e) {
        return Response.json({ code: 1, msg: 'AI 标知识点失败: ' + e.message }, { status: 500 });
    }
}
