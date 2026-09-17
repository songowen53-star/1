// POST /api/teacher/ai/paper — AI 组卷
// 对应后端 backend/routes/teacher-ai.js 中的 router.post('/paper')
// body: { subject, question_count, total_score, teacher_id, class_id }

export async function onRequestPost({ request }) {
    try {
        const body = await request.json();
        const { subject, question_count, total_score, teacher_id } = body || {};
        const qCount = Math.min(50, Math.max(5, question_count || 20));
        const tScore = total_score || 150;

        // 题型分布
        const choiceCount = Math.round(qCount * 0.4);
        const fillCount = Math.round(qCount * 0.2);
        const solveCount = qCount - choiceCount - fillCount;
        const choiceScore = Math.round(tScore * 0.4 / choiceCount * 10) / 10;
        const fillScore = Math.round(tScore * 0.2 / fillCount * 10) / 10;
        const solveScore = Math.round(tScore * 0.4 / solveCount * 10) / 10;

        const questions = [];
        for (let i = 0; i < qCount; i++) {
            let type, score;
            if (i < choiceCount) { type = '选择题'; score = choiceScore; }
            else if (i < choiceCount + fillCount) { type = '填空题'; score = fillScore; }
            else { type = '解答题'; score = solveScore; }

            questions.push({
                seq: i + 1,
                id: 'q_paper_' + Date.now() + '_' + i,
                type,
                difficulty: (i % 5) + 1,
                content: '示例题目 ' + (i + 1) + '（' + (subject || '数学') + '）',
                options: type === '选择题' ? ['A', 'B', 'C', 'D'] : null,
                answer: type === '选择题' ? 'B' : '解析略',
                score,
                knowledge_point: '示例知识点',
                knowledge_point_id: 'kp_demo_' + (i + 1)
            });
        }

        const paperId = 'paper_' + Date.now();
        return Response.json({
            code: 0,
            data: {
                paper_id: paperId,
                paper_name: (teacher_id || 'teacher') + ' 专属智能组卷 · ' + new Date().toISOString().slice(0, 10),
                subject: subject || '数学',
                total_score: tScore,
                question_count: qCount,
                duration_min: 120,
                type_distribution: {
                    '选择题': { count: choiceCount, score_per: choiceScore, total: Math.round(choiceCount * choiceScore * 10) / 10 },
                    '填空题': { count: fillCount, score_per: fillScore, total: Math.round(fillCount * fillScore * 10) / 10 },
                    '解答题': { count: solveCount, score_per: solveScore, total: Math.round(solveCount * solveScore * 10) / 10 }
                },
                difficulty_distribution: {
                    '基础': Math.round(qCount * 0.3),
                    '中等': Math.round(qCount * 0.5),
                    '提升': qCount - Math.round(qCount * 0.3) - Math.round(qCount * 0.5)
                },
                questions
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: 'AI 组卷失败: ' + e.message }, { status: 500 });
    }
}
