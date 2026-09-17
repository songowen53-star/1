// GET /api/predict/:user_id/score-trend?days=60 — 成绩趋势预测时间序列
import { listTable } from '../../../_shared/kv-db.js';

const SUBJECT_MAX = {
    '数学': 150, '语文': 150, '英语': 150,
    '物理': 150, '化学': 150,
    '生物': 100, '政治': 100, '历史': 100, '地理': 100
};
const TOTAL_MAX = 750;
const SUBJECT_ALIAS = { '政治': '思想政治' };
function resolveSubject(subject) { return SUBJECT_ALIAS[subject] || subject; }
const CORE_SUBJECTS = ['数学', '语文', '英语', '物理', '化学'];

function calcSubjectScoreLocal(kps, subject) {
    const dataSubject = resolveSubject(subject);
    const subKps = kps.filter(k => k.subject === dataSubject);
    if (subKps.length === 0) return 0;
    const maxScore = SUBJECT_MAX[subject] || 100;
    let totalWeight = 0;
    let weightedMastery = 0;
    subKps.forEach(kp => {
        const w = (kp.score_gain || 1) + 1;
        totalWeight += w;
        weightedMastery += w * (kp.mastery_rate || 0);
    });
    const avgMastery = totalWeight > 0 ? weightedMastery / totalWeight : 0.6;
    const scoreRate = Math.min(0.98, 0.45 + 0.5 * avgMastery);
    return Math.round(maxScore * scoreRate);
}

function calcTrendSlope(answerRecords, userId) {
    const now = new Date();
    const recent7 = new Date(now); recent7.setDate(recent7.getDate() - 7);
    const prev7 = new Date(recent7); prev7.setDate(prev7.getDate() - 7);
    const recent7Str = recent7.toISOString().slice(0, 10);
    const prev7Str = prev7.toISOString().slice(0, 10);
    const records = answerRecords.filter(r => r.user_id === userId);
    const recent = records.filter(r => (r.created_at || '') >= recent7Str);
    const prev = records.filter(r => (r.created_at || '') >= prev7Str && (r.created_at || '') < recent7Str);
    const recentRate = recent.length > 0 ? recent.filter(r => r.is_correct).length / recent.length : 0.6;
    const prevRate = prev.length > 0 ? prev.filter(r => r.is_correct).length / prev.length : 0.6;
    return (recentRate - prevRate) / 7;
}

export async function onRequestGet({ params, env, request }) {
    try {
        const url = new URL(request.url);
        const userId = params.user_id;
        const users = await listTable(env, 'users');
        const user = users.find(u => u.id === userId) || {
            exam_date: '2026-06-07', current_score: 580, target_score: 650
        };

        const days = Math.min(180, Math.max(7, parseInt(url.searchParams.get('days')) || 60));
        const fmtMD = (d) => (d.getMonth() + 1) + '/' + d.getDate();
        const labels = [];
        const history = [];
        const predict = [];
        const today = new Date();
        const examDate = new Date(user.exam_date || '2026-06-07');
        const baseScore = user.current_score || 580;
        const targetScore = user.target_score || 650;

        const historyDays = Math.min(days, 45);
        for (let i = historyDays - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            labels.push(fmtMD(d));
            const factor = 1 - (i / historyDays) * 0.08;
            const wavy = Math.sin(d.getDate() * 0.8 + (d.getMonth() + 1)) * 3;
            const s = Math.max(450, Math.round(baseScore * factor + wavy));
            history.push(s);
            predict.push(null);
        }

        const answerRecords = await listTable(env, 'answer_records');
        const slope = calcTrendSlope(answerRecords, userId);
        const examDaysLeft = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
        const maxFutureDays = Math.max(7, days - historyDays);
        const predictDays = examDaysLeft > 0 ? Math.min(maxFutureDays, examDaysLeft) : maxFutureDays;
        let currentScore = baseScore;

        for (let i = 1; i <= predictDays; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            labels.push(fmtMD(d));
            history.push(null);
            const trendStep = Math.round(slope * TOTAL_MAX * 0.3);
            const pull = Math.max(0, targetScore - currentScore) * 0.03;
            currentScore = Math.min(targetScore, Math.round(currentScore + trendStep + pull));
            predict.push(currentScore);
        }

        return Response.json({
            code: 0,
            data: {
                days: labels.length,
                labels,
                history,
                predict,
                target_score: targetScore,
                current_score: baseScore,
                yiben_line: 520,
                days_to_exam: examDaysLeft
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: 'score-trend 失败: ' + e.message }, { status: 500 });
    }
}
