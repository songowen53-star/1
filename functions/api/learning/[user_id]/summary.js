// GET /api/learning/:user_id/summary?days=7 — 学习汇总（今日提分：总时长/题数/正确率/积分/环比）
import { listTable } from '../../../_shared/kv-db.js';

export async function onRequestGet({ params, env, request }) {
    try {
        const userId = params.user_id || 'u_001';
        const days = parseInt(new URL(request.url).searchParams.get('days')) || 7;

        const since = new Date();
        since.setDate(since.getDate() - days);
        const sinceStr = since.toISOString().slice(0, 10);

        const records = (await listTable(env, 'learning_records'))
            .filter(r => r.user_id === userId && r.date >= sinceStr);

        const totalDuration = records.reduce((s, r) => s + (r.duration_min || 0), 0);
        const totalQuestions = records.reduce((s, r) => s + (r.questions_count || 0), 0);
        const totalCorrect = records.reduce((s, r) => s + (r.correct_count || 0), 0);
        const correctRate = totalQuestions > 0 ? Math.round(totalCorrect / totalQuestions * 100) : 0;
        const points = Math.round(totalDuration * 2 + totalCorrect * 5 + totalQuestions * 1);

        // 上一周期
        const prevSince = new Date(since);
        prevSince.setDate(prevSince.getDate() - days);
        const prevSinceStr = prevSince.toISOString().slice(0, 10);
        const prevRecords = (await listTable(env, 'learning_records'))
            .filter(r => r.user_id === userId && r.date >= prevSinceStr && r.date < sinceStr);
        const prevDuration = prevRecords.reduce((s, r) => s + (r.duration_min || 0), 0);
        const prevQuestions = prevRecords.reduce((s, r) => s + (r.questions_count || 0), 0);
        const prevCorrect = prevRecords.reduce((s, r) => s + (r.correct_count || 0), 0);
        const prevRate = prevQuestions > 0 ? prevCorrect / prevQuestions : 0;

        const calcChange = (cur, prev) => prev > 0 ? Math.round((cur - prev) / prev * 100) : (cur > 0 ? 100 : 0);

        return Response.json({
            code: 0,
            data: {
                duration_min: totalDuration,
                duration_hours: +(totalDuration / 60).toFixed(1),
                questions_count: totalQuestions,
                correct_count: totalCorrect,
                correct_rate: correctRate,
                points,
                changes: {
                    duration: calcChange(totalDuration, prevDuration),
                    questions: calcChange(totalQuestions, prevQuestions),
                    correct_rate: calcChange(correctRate, Math.round(prevRate * 100))
                }
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载学习汇总失败: ' + e.message }, { status: 500 });
    }
}
