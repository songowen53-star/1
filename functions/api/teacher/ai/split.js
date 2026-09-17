// POST /api/teacher/ai/split — AI 切题
// 对应后端 backend/routes/teacher-ai.js 中的 router.post('/split')
// body: { file_path, teacher_id }

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { file_path, teacher_id } = body || {};
        if (!file_path) {
            return Response.json({ code: 1, msg: 'file_path 必填' }, { status: 400 });
        }

        // 模拟 AI 切题结果
        const questions = [
            { no: 1, type: '选择题', score: 5, difficulty: '简单', content_preview: '已知集合 A={1,2,3}，B={2,3,4}...' },
            { no: 2, type: '选择题', score: 5, difficulty: '简单', content_preview: '复数 z=1+i 的共轭复数...' },
            { no: 3, type: '选择题', score: 5, difficulty: '中等', content_preview: '函数 f(x)=sin(2x+π/6)...' },
            { no: 4, type: '选择题', score: 5, difficulty: '中等', content_preview: '数列 {aₙ} 的前 n 项和...' },
            { no: 5, type: '填空题', score: 5, difficulty: '困难', content_preview: '设函数 f(x)=x³-3x²+2...' },
            { no: 6, type: '填空题', score: 5, difficulty: '困难', content_preview: '椭圆 x²/4+y²=1...' }
        ];

        const record = {
            id: 'tsj_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
            file_path,
            teacher_id: teacher_id || 'guest',
            total_questions: questions.length,
            questions,
            created_at: new Date().toISOString(),
            time: new Date().toISOString()
        };

        // 写入 teacher_split_jobs.json
        const raw = await env.DATA_STORE.get('teacher_split_jobs.json');
        const list = raw ? JSON.parse(raw) : [];
        list.push(record);
        await env.DATA_STORE.put('teacher_split_jobs.json', JSON.stringify(list, null, 2));

        return Response.json({
            code: 0,
            data: {
                job_id: record.id,
                total_questions: questions.length,
                questions
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: 'AI 切题失败: ' + e.message }, { status: 500 });
    }
}
