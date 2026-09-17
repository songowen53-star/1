// GET /api/answers/:user_id/loss-analysis?days=30&limit=8 — 失分归因 Top N
import { listTable } from '../../../_shared/kv-db.js';

export async function onRequestGet({ params, env, request }) {
    try {
        const url = new URL(request.url);
        const days = Math.min(180, Math.max(7, parseInt(url.searchParams.get('days')) || 30));
        const limit = Math.min(20, Math.max(3, parseInt(url.searchParams.get('limit')) || 8));
        const userId = params.user_id;

        const since = new Date();
        since.setDate(since.getDate() - days);

        const wrong = (await listTable(env, 'answer_records')).filter(r =>
            r.user_id === userId && !r.is_correct && new Date(r.created_at) >= since
        );

        const byKp = {};
        wrong.forEach(r => {
            const kid = r.knowledge_point_id || 'other';
            if (!byKp[kid]) byKp[kid] = { count: 0, subject: r.subject || '综合', name: r.knowledge_point_name || '其他' };
            byKp[kid].count++;
        });

        const bySubject = {};
        wrong.forEach(r => {
            const s = r.subject || '综合';
            if (!bySubject[s]) bySubject[s] = 0;
            bySubject[s]++;
        });

        const kpList = Object.values(byKp).sort((a, b) => b.count - a.count).slice(0, limit);
        const totalWrong = wrong.length;
        kpList.forEach(k => {
            k.percent = totalWrong > 0 ? Math.round(k.count / totalWrong * 100) : 0;
        });

        const subjectLoss = Object.entries(bySubject)
            .map(([s, c]) => ({ subject: s, wrong_count: c, percent: totalWrong > 0 ? Math.round(c / totalWrong * 100) : 0 }))
            .sort((a, b) => b.wrong_count - a.wrong_count);

        const typeCount = {};
        wrong.forEach(r => { const t = r.type || '其他'; typeCount[t] = (typeCount[t] || 0) + 1; });
        const diffCount = {};
        wrong.forEach(r => { const d = r.difficulty || 0; diffCount[d] = (diffCount[d] || 0) + 1; });
        const topType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0];
        const topDiff = Object.entries(diffCount).sort((a, b) => b[1] - a[1])[0];

        return Response.json({
            code: 0,
            data: {
                days,
                total_wrong: totalWrong,
                top_loss_points: kpList,
                subjects: subjectLoss,
                top_wrong_type: topType ? { type: topType[0], count: topType[1] } : null,
                top_wrong_difficulty: topDiff
                    ? { level: Number(topDiff[0]) || 0, label: ['简单','基础','中等','困难','压轴'][Number(topDiff[0])] || '综合', count: topDiff[1] }
                    : null
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: 'loss-analysis 失败: ' + e.message }, { status: 500 });
    }
}
