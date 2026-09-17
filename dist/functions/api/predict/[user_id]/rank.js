// GET /api/predict/:user_id/rank — 预测排名 + 院校录取概率
import { listTable } from '../../../_shared/kv-db.js';

const SUBJECT_MAX = {
    '数学': 150, '语文': 150, '英语': 150,
    '物理': 150, '化学': 150,
    '生物': 100, '政治': 100, '历史': 100, '地理': 100
};
const CORE_SUBJECTS = ['数学', '语文', '英语', '物理', '化学'];
const TOTAL_MAX = 750;
const SUBJECT_ALIAS = { '政治': '思想政治' };
function resolveSubject(subject) { return SUBJECT_ALIAS[subject] || subject; }

const PROVINCE_PARAMS = {
    '浙江': { mean: 480, std: 90, count: 320000 },
    '四川': { mean: 450, std: 95, count: 580000 },
    '全国': { mean: 450, std: 95, count: 1000000 }
};

function normalCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
}
function sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

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

        const currentPredicted = await CORE_SUBJECTS.reduce(async (sumPromise, subj) => {
            const sum = await sumPromise;
            return sum + await calcSubjectScore(kpList, subj);
        }, Promise.resolve(0));

        const slope = await calcTrendSlope(answerRecords, userId);
        const examDate = new Date(user.exam_date || '2026-06-07');
        const daysToExam = Math.max(1, Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24)));
        const trendImpact = Math.max(-30, Math.min(40, Math.round(slope * daysToExam * TOTAL_MAX * 0.3)));
        const finalScore = Math.max(0, Math.min(TOTAL_MAX, currentPredicted + trendImpact));

        const province = user.province || '四川';
        const provParams = PROVINCE_PARAMS[province] || PROVINCE_PARAMS['全国'];
        const zScore = (finalScore - provParams.mean) / provParams.std;
        const percentile = normalCDF(zScore);
        const rank = Math.max(1, Math.round(provParams.count * (1 - percentile)));

        const p985 = Math.round(sigmoid((finalScore - 620) / 15) * 100);
        const p211 = Math.round(sigmoid((finalScore - 570) / 15) * 100);
        const pYiben = Math.round(sigmoid((finalScore - 520) / 15) * 100);
        const yibenDiff = finalScore - 520;

        return Response.json({
            code: 0,
            data: {
                predicted_score: finalScore,
                province,
                rank,
                total_candidates: provParams.count,
                percentile: +(percentile * 100).toFixed(2),
                probability: {
                    yiben: pYiben,
                    p211: p211,
                    p985: p985
                },
                yiben_line_diff: yibenDiff
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载预测排名失败: ' + e.message }, { status: 500 });
    }
}
