// GET /api/photo/video?question_id= — 视频讲解
// 对应后端 backend/routes/photo.js 中的 router.get('/video')
export async function onRequestGet({ request }) {
    try {
        const url = new URL(request.url);
        const question_id = url.searchParams.get('question_id');
        if (!question_id) {
            return Response.json({ code: 1, msg: 'question_id 必填' }, { status: 400 });
        }

        return Response.json({
            code: 0,
            data: {
                video_url: 'https://cdn.example.com/videos/' + question_id + '_explain.mp4',
                duration_sec: 180,
                chapters: [
                    { time: 0, title: '审题' },
                    { time: 30, title: '求导' },
                    { time: 90, title: '讨论单调性' }
                ]
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载视频讲解失败: ' + e.message }, { status: 500 });
    }
}
