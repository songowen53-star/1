// GET /api/predict/:user_id/score — 预测高考分数（含各科预测得分）
import { listTable } from '../../../_shared/kv-db.js';

const SUBJECT_MAX = {
    '数学': 150, '语文': 150, '英语': 150,
    '物理': 150, '化学': 150,
    '生物': 100, '政治': 100, '历史': 100, '地理': 100
};
const CORE_SUBJECTS = ['数学', '语文', '英语', '物理', '化学'];
const ALL_SUBJECTS = ['数学', '语文', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];
const TOTAL_MAX = 750;
const SUBJECT_ALIAS = { '政治': '思想政治' };
function resolveSubject(subject) { return SUBJECT_ALIAS[subject] || subject; }

function normalCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
}

async function calcSubjectScore(kpList, subject) {
    const dataSubject = resolveSubject(subject);
    const kps = kpList.filter(k => k.subject === dataSubject);
    if (kps.length === 0) return 0;
    const maxScore = SUBJECT_MAX[subject] || 100;
    let totalWeight = 0;
    let weightedMastery = 0;
    kps.forEach(kp => {
        const w = (kp.score_gain || 1) + 1;
        totalWeight += w;
        weightedMastery += w * (kp.mastery_rate || 0);
    });
    const avgMastery = totalWeight > 0 ? weightedMastery / totalWeight : 0.6;
    const scoreRate = Math.min(0.98, 0.45 + 0.5 * avgMastery);
    return Math.round(maxScore * scoreRate);
}

async function calcTrendSlope(answerRecords, userId) {
    const now = new Date();
    const recent7 = new Date(now); recent7.setDate(recent7.getDate() - 7);
    const prev7 = new Date(recent7); prev7.setDate(prev7.getDate() - 7);
    const recent7Str = recent7.toISOString().slice(0, 10);
    const prev7Str = prev7.toISOString().slice(0, 10);
    const allAnswers = answerRecords.filter(r => r.user_id === userId);
    const recent = allAnswers.filter(r => (r.created_at || '') >= recent7Str);
    const prev = allAnswers.filter(r => (r.created_at || '') >= prev7Str && (r.created_at || '') < recent7Str);
    const recentRate = recent.length > 0 ? recent.filter(r => r.is_correct).length / recent.length : 0.6;
    const prevRate = prev.length > 0 ? prev.filter(r => r.is_correct).length / prev.length : 0.6;
    return (recentRate - prevRate) / 7;
}

export async function onRequestGet({ params, env }) {
    try {
        const userId = params.user_id || 'u_001';
        const users = await listTable(env, 'users');
        const user = users.find(u => u.id === userId) || users[0] || {
            id: userId, province: '四川', current_score: 580, target_score: 650, exam_date: '2026-06-07'
        };

        const kpList = await listTable(env, 'knowledge_points');
        const answerRecords = await listTable(env, 'answer_records');

        const subjectScores = await Promise.all(ALL_SUBJECTS.map(async s => ({
            subject: s,
            score: await calcSubjectScore(kpList, s),
            max_score: SUBJECT_MAX[s] || 100
        })));
        const currentPredicted = CORE_SUBJECTS.reduce((sum, subj) => {
            const ss = subjectScores.find(x => x.subject === subj);
            return sum + (ss ? ss.score : 0);
        }, 0);

        const slope = await calcTrendSlope(answerRecords, userId);
        const examDate = new Date(user.exam_date || '2026-06-07');
        const daysToExam = Math.max(1, Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24)));
        const trendImpact = Math.round(slope * daysToExam * TOTAL_MAX * 0.3);
        const trendCapped = Math.max(-30, Math.min(40, trendImpact));
        const finalPredicted = Math.max(0, Math.min(TOTAL_MAX, currentPredicted + trendCapped));

        const answerCount = answerRecords.filter(r => r.user_id === userId).length;
        const confidence = Math.min(0.95, 0.5 + answerCount / 200);

        return Response.json({
            code: 0,
            data: {
                current_predicted: currentPredicted,
                trend_impact: trendCapped,
                final_predicted: finalPredicted,
                predicted_score: finalPredicted,
                score: finalPredicted,
                target_score: user.target_score,
                days_to_exam: daysToExam,
                confidence: Math.round(confidence * 100),
                trend_slope: +slope.toFixed(4),
                subject_scores: subjectScores
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载预测分数失败: ' + e.message }, { status: 500 });
    }
}
