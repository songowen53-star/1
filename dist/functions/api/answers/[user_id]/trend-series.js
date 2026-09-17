// GET /api/answers/:user_id/trend-series?days=14 — 每日答题趋势序列（答题趋势图）
import { listTable } from '../../../_shared/kv-db.js';

export async function onRequestGet({ params, env, request }) {
    try {
        const url = new URL(request.url);
        const days = Math.min(180, Math.max(3, parseInt(url.searchParams.get('days')) || 14));
        const userId = params.user_id;

        const fmtMD = (d) => (d.getMonth() + 1) + '/' + d.getDate();
        const labels = [];
        const counts = [];
        const corrects = [];
        const rates = [];
        const times = [];
        const today = new Date();
        const allRecords = (await listTable(env, 'answer_records')).filter(r => r.user_id === userId);

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dStr = d.toISOString().slice(0, 10);
            labels.push(fmtMD(d));
            const day = allRecords.filter(r => (r.created_at || '').slice(0, 10) === dStr);
            const total = day.length;
            const correct = day.filter(r => r.is_correct).length;
            counts.push(total);
            corrects.push(correct);
            rates.push(total > 0 ? Math.round(correct / total * 100) : 0);
            const avgSec = total > 0 ? Math.round(day.reduce((s, r) => s + (r.time_cost_sec || 0), 0) / total) : 0;
            times.push(avgSec);
        }

        return Response.json({
            code: 0,
            data: { days, labels, answer_count: counts, correct_count: corrects, correct_rate: rates, avg_time_sec: times }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: 'trend-series 失败: ' + e.message }, { status: 500 });
    }
}
