// GET /api/learning/:user_id/daily-series?days=7&subject=数学 — 每日学习序列（柱状图数据源）
import { listTable } from '../../../_shared/kv-db.js';

export async function onRequestGet({ params, env, request }) {
    try {
        const url = new URL(request.url);
        const days = Math.min(180, Math.max(3, parseInt(url.searchParams.get('days')) || 7));
        const subjectRaw = url.searchParams.get('subject');
        const subject = subjectRaw && subjectRaw !== '全部' ? String(subjectRaw) : null;
        const userId = params.user_id;

        const fmtMD = (d) => (d.getMonth() + 1) + '/' + d.getDate();
        const labels = [];
        const minutes = [];
        const questions = [];
        const correct_counts = [];
        const today = new Date();

        const allRecords = (await listTable(env, 'learning_records')).filter(r => r.user_id === userId);

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dStr = d.toISOString().slice(0, 10);
            labels.push(fmtMD(d));
            const rows = allRecords.filter(r =>
                r.date === dStr && (!subject || r.subject === subject)
            );
            const min = rows.reduce((s, r) => s + (r.duration_min || 0), 0);
            const q = rows.reduce((s, r) => s + (r.questions_count || 0), 0);
            const c = rows.reduce((s, r) => s + (r.correct_count || 0), 0);
            minutes.push(min);
            questions.push(q);
            correct_counts.push(c);
        }
        const correct_rate = questions.map((n, i) => n > 0 ? Math.round(correct_counts[i] / n * 100) : 0);

        return Response.json({
            code: 0,
            data: {
                days,
                subject: subject || '全部',
                labels,
                duration_minutes: minutes,
                questions,
                correct_counts,
                correct_rate
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: 'daily-series 失败: ' + e.message }, { status: 500 });
    }
}
