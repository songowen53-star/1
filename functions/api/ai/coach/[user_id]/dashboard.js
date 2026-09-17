// GET /api/ai/coach/:user_id/dashboard — 教练驾驶舱
// 对应后端：backend/routes/ai-coach.js GET /:user_id/dashboard
import { listTable } from '../../../../_shared/kv-db.js';

export async function onRequestGet({ params, env }) {
    try {
        const userId = params.user_id;
        const today = new Date().toISOString().slice(0, 10);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoTime = weekAgo.getTime();

        const learning = await listTable(env, 'learning_records');
        const todayRecords = learning.filter(r => r.user_id === userId && r.date === today);
        const weekRecords = learning.filter(r =>
            r.user_id === userId && new Date(r.date).getTime() >= weekAgoTime
        );

        const todayDuration = todayRecords.reduce((s, r) => s + (r.duration_min || 0), 0);
        const todayQuestions = todayRecords.reduce((s, r) => s + (r.questions_count || 0), 0);
        const todayCorrect = todayRecords.reduce((s, r) => s + (r.correct_count || 0), 0);
        const weekDuration = weekRecords.reduce((s, r) => s + (r.duration_min || 0), 0);
        const weekQuestions = weekRecords.reduce((s, r) => s + (r.questions_count || 0), 0);
        const weekCorrect = weekRecords.reduce((s, r) => s + (r.correct_count || 0), 0);

        const weakCount = (await listTable(env, 'knowledge_points')).filter(k =>
            k.mastery_rate < 0.7 && k.user_id === userId
        ).length;

        return Response.json({
            code: 0,
            data: {
                user_id: userId,
                today: {
                    duration_min: todayDuration,
                    questions: todayQuestions,
                    correct_rate: todayQuestions > 0 ? Math.round(todayCorrect / todayQuestions * 100) : 0,
                    points: todayDuration * 2 + todayCorrect * 3
                },
                week: {
                    duration_min: weekDuration,
                    questions: weekQuestions,
                    correct_rate: weekQuestions > 0 ? Math.round(weekCorrect / weekQuestions * 100) : 0,
                    target_completion: Math.min(100, Math.round(weekDuration / 2520 * 100))
                },
                weak_points: weakCount,
                predicted_score: 615,
                score_trend: 'up',
                next_action: weakCount > 0 ? '继续突破薄弱知识点，预计提分 ' + (weakCount * 5) : '保持当前节奏'
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载教练驾驶舱失败: ' + e.message }, { status: 500 });
    }
}
