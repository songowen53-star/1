// POST /api/teacher/ai/exercise — 课堂练习下发
// 对应后端 backend/routes/teacher-ai.js 中的 router.post('/exercise')
// body: { teacher_id, class_id, question_ids, duration_min }

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { teacher_id, class_id, question_ids, duration_min } = body || {};
        if (!teacher_id || !class_id || !Array.isArray(question_ids)) {
            return Response.json({ code: 1, msg: 'teacher_id, class_id, question_ids 必填' }, { status: 400 });
        }

        const record = {
            id: 'te_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
            teacher_id,
            class_id,
            question_ids,
            duration_min: duration_min || 30,
            status: 'published',
            created_at: new Date().toISOString(),
            time: new Date().toISOString()
        };

        // 写入 teacher_exercises.json
        const raw = await env.DATA_STORE.get('teacher_exercises.json');
        const list = raw ? JSON.parse(raw) : [];
        list.push(record);
        await env.DATA_STORE.put('teacher_exercises.json', JSON.stringify(list, null, 2));

        return Response.json({
            code: 0,
            data: {
                exercise_id: record.id,
                teacher_id,
                class_id,
                question_count: question_ids.length,
                duration_min: duration_min || 30,
                status: 'published',
                msg: '课堂练习已下发到班级 ' + class_id
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '下发课堂练习失败: ' + e.message }, { status: 500 });
    }
}
