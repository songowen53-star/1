// ========== 模考预测模型 ==========
// 基于考点掌握率 + 答题趋势 + 线性回归外推的高考分数预测
const express = require('express');
const router = express.Router();
const db = require('../db');

// 科目满分配置（数学/语文/英语 主科 150，其余选科 100）
const SUBJECT_MAX = {
    '数学': 150, '语文': 150, '英语': 150,
    '物理': 150, '化学': 150,
    '生物': 100, '政治': 100, '历史': 100, '地理': 100
};
const TOTAL_MAX = 750;  // 预测总分上限（仅按 5 核心科计算，保持模型稳定）

// 数据中使用"思想政治"，对外展示用"政治"；查询考点时做别名映射
const SUBJECT_ALIAS = { '政治': '思想政治' };
function resolveSubject(subject) { return SUBJECT_ALIAS[subject] || subject; }

// 核心预测科目（仅用于 currentPredicted 计算，保持模型行为不变）
const CORE_SUBJECTS = ['数学', '语文', '英语', '物理', '化学'];
// 雷达图展示科目（高考 9 科全部）
const ALL_SUBJECTS = ['数学', '语文', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];

// 省份参数（简化正态分布：均值、标准差、考生数）
const PROVINCE_PARAMS = {
    '浙江': { mean: 480, std: 90, count: 320000 },
    '四川': { mean: 450, std: 95, count: 580000 },
    '全国': { mean: 450, std: 95, count: 1000000 }
};

// 标准正态分布累积分布函数近似（Abramowitz & Stegun）
function normalCDF(x) {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - p : p;
}

// sigmoid 函数
function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}

// 计算某科目预测得分（基于考点加权掌握率）
function calcSubjectScore(subject) {
    const dataSubject = resolveSubject(subject);
    const kps = db.list('knowledge_points').filter(k => k.subject === dataSubject);
    if (kps.length === 0) return 0;
    const maxScore = SUBJECT_MAX[subject] || 100;

    // 权重 = score_gain + 1（避免权重为0），掌握率为得分率
    let totalWeight = 0;
    let weightedMastery = 0;
    kps.forEach(kp => {
        const w = (kp.score_gain || 1) + 1;
        totalWeight += w;
        weightedMastery += w * kp.mastery_rate;
    });
    const avgMastery = totalWeight > 0 ? weightedMastery / totalWeight : 0.6;
    // 掌握率→得分率非线性映射：高考基础题占比高，掌握率0.5约能拿75%分数
    // scoreRate = 0.45 + 0.5 × mastery（上限0.98）
    const scoreRate = Math.min(0.98, 0.45 + 0.5 * avgMastery);
    return Math.round(maxScore * scoreRate);
}

// 计算学习趋势斜率（基于答题正确率变化）
function calcTrendSlope(userId) {
    const now = new Date();
    const recent7 = new Date(now); recent7.setDate(recent7.getDate() - 7);
    const prev7 = new Date(recent7); prev7.setDate(prev7.getDate() - 7);
    const recent7Str = recent7.toISOString().slice(0, 10);
    const prev7Str = prev7.toISOString().slice(0, 10);

    const allAnswers = db.list('answer_records').filter(r => r.user_id === userId);
    const recent = allAnswers.filter(r => r.created_at >= recent7Str);
    const prev = allAnswers.filter(r => r.created_at >= prev7Str && r.created_at < recent7Str);

    const recentRate = recent.length > 0 ? recent.filter(r => r.is_correct).length / recent.length : 0.6;
    const prevRate = prev.length > 0 ? prev.filter(r => r.is_correct).length / prev.length : 0.6;

    // 斜率 = 每日正确率变化
    return (recentRate - prevRate) / 7;
}

// 预测高考分数
// GET /api/predict/:user_id/score
router.get('/:user_id/score', (req, res) => {
    const userId = req.params.user_id;
    const user = db.list('users').find(u => u.id === userId);
    if (!user) return res.status(404).json({ code: 1, msg: '用户不存在' });

    // 1. 各科预测得分（雷达图展示全部 9 科，预测仍按 5 核心科）
    const subjectScores = ALL_SUBJECTS.map(s => ({
        subject: s,
        score: calcSubjectScore(s),
        max_score: SUBJECT_MAX[s] || 100
    }));
    const currentPredicted = CORE_SUBJECTS.reduce((sum, subj) => {
        const ss = subjectScores.find(x => x.subject === subj);
        return sum + (ss ? ss.score : 0);
    }, 0);

    // 2. 趋势外推
    const slope = calcTrendSlope(userId); // 每日正确率变化
    const examDate = new Date(user.exam_date || '2026-06-07');
    const daysToExam = Math.max(1, Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24)));
    // 趋势对分数的影响：斜率 × 天数 × 总分 × 影响系数
    const trendImpact = Math.round(slope * daysToExam * TOTAL_MAX * 0.3);
    const trendCapped = Math.max(-30, Math.min(40, trendImpact)); // 限制在-30~+40
    const finalPredicted = Math.max(0, Math.min(TOTAL_MAX, currentPredicted + trendCapped));

    // 3. 置信度：基于答题样本量
    const answerCount = db.list('answer_records').filter(r => r.user_id === userId).length;
    const confidence = Math.min(0.95, 0.5 + answerCount / 200);

    res.json({
        code: 0,
        data: {
            current_predicted: currentPredicted,
            trend_impact: trendCapped,
            final_predicted: finalPredicted,
            predicted_score: finalPredicted,   // 兼容字段
            score: finalPredicted,             // 兼容字段
            target_score: user.target_score,
            days_to_exam: daysToExam,
            confidence: Math.round(confidence * 100),
            trend_slope: +slope.toFixed(4),
            subject_scores: subjectScores
        }
    });
});

// 预测排名 + 院校概率
// GET /api/predict/:user_id/rank
router.get('/:user_id/rank', (req, res) => {
    const userId = req.params.user_id;
    const user = db.list('users').find(u => u.id === userId);
    if (!user) return res.status(404).json({ code: 1, msg: '用户不存在' });

    // 获取预测分（按 5 核心科计算，行为不变）
    const currentPredicted = CORE_SUBJECTS.reduce((s, subj) => s + calcSubjectScore(subj), 0);
    const slope = calcTrendSlope(userId);
    const examDate = new Date(user.exam_date || '2026-06-07');
    const daysToExam = Math.max(1, Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24)));
    const trendImpact = Math.max(-30, Math.min(40, Math.round(slope * daysToExam * TOTAL_MAX * 0.3)));
    const finalScore = Math.max(0, Math.min(TOTAL_MAX, currentPredicted + trendImpact));

    // 排名预测（正态分布）
    const province = user.province || '浙江';
    const params = PROVINCE_PARAMS[province] || PROVINCE_PARAMS['全国'];
    const zScore = (finalScore - params.mean) / params.std;
    const percentile = normalCDF(zScore); // 超过此分数的比例
    const rank = Math.max(1, Math.round(params.count * (1 - percentile)));

    // 院校录取概率（sigmoid模型）
    // 985线约620，211线约570，一本线约520（浙江示例）
    const p985 = Math.round(sigmoid((finalScore - 620) / 15) * 100);
    const p211 = Math.round(sigmoid((finalScore - 570) / 15) * 100);
    const pYiben = Math.round(sigmoid((finalScore - 520) / 15) * 100);
    const yibenDiff = finalScore - 520;

    res.json({
        code: 0,
        data: {
            predicted_score: finalScore,
            province,
            rank,
            total_candidates: params.count,
            percentile: +(percentile * 100).toFixed(2),
            probability: {
                yiben: pYiben,
                p211: p211,
                p985: p985
            },
            yiben_line_diff: yibenDiff
        }
    });
});

// 完整模考预测报告
// GET /api/predict/:user_id/report
router.get('/:user_id/report', (req, res) => {
    const userId = req.params.user_id;
    const user = db.list('users').find(u => u.id === userId);
    if (!user) return res.status(404).json({ code: 1, msg: '用户不存在' });

    // 组合分数预测 + 排名预测
    const subjectScores = ALL_SUBJECTS.map(s => ({
        subject: s,
        score: calcSubjectScore(s),
        max_score: SUBJECT_MAX[s] || 100
    }));
    const currentPredicted = CORE_SUBJECTS.reduce((sum, subj) => {
        const ss = subjectScores.find(x => x.subject === subj);
        return sum + (ss ? ss.score : 0);
    }, 0);
    const slope = calcTrendSlope(userId);
    const examDate = new Date(user.exam_date || '2026-06-07');
    const daysToExam = Math.max(1, Math.ceil((examDate - new Date()) / (1000 * 60 * 60 * 24)));
    const trendImpact = Math.max(-30, Math.min(40, Math.round(slope * daysToExam * TOTAL_MAX * 0.3)));
    const finalScore = Math.max(0, Math.min(TOTAL_MAX, currentPredicted + trendImpact));

    const province = user.province || '浙江';
    const params = PROVINCE_PARAMS[province] || PROVINCE_PARAMS['全国'];
    const zScore = (finalScore - params.mean) / params.std;
    const percentile = normalCDF(zScore);
    const rank = Math.max(1, Math.round(params.count * (1 - percentile)));
    const p985 = Math.round(sigmoid((finalScore - 620) / 15) * 100);
    const p211 = Math.round(sigmoid((finalScore - 570) / 15) * 100);
    const answerCount = db.list('answer_records').filter(r => r.user_id === userId).length;
    const confidence = Math.min(0.95, 0.5 + answerCount / 200);

    // 薄弱考点Top3（提分建议）
    const weakAdvice = db.list('knowledge_points')
        .filter(k => k.mastery_rate < 0.6)
        .sort((a, b) => b.score_gain - a.score_gain)
        .slice(0, 3)
        .map(k => `加强「${k.name}」练习，掌握率${Math.round(k.mastery_rate * 100)}%，预计可提${k.score_gain}分`);

    // 与上次对比（简化：取7天前预测）
    const lastScore = currentPredicted - Math.round(trendImpact * 0.3);

    res.json({
        code: 0,
        data: {
            predicted_score: finalScore,
            current_score: user.current_score,
            target_score: user.target_score,
            rank,
            province,
            percentile: +(percentile * 100).toFixed(2),
            confidence: Math.round(confidence * 100),
            days_to_exam: daysToExam,
            trend_impact: trendImpact,
            improvement_vs_last: finalScore - lastScore,
            probability: { yiben: Math.round(sigmoid((finalScore - 520) / 15) * 100), p211, p985 },
            yiben_line_diff: finalScore - 520,
            subject_scores: subjectScores,
            weak_advice: weakAdvice,
            model: 'weighted_mastery + linear_trend_extrapolation'
        }
    });
});

// 成绩趋势预测时间序列（近 N 天 → 高考前 N 天的分数预测轨迹）
// GET /api/predict/:user_id/score-trend?days=60
//   → { labels: [...], history: [...], predict_line: [...], target: number, yiben_line: number }
router.get('/:user_id/score-trend', (req, res) => {
    const userId = req.params.user_id;
    const user = db.list('users').find(u => u.id === userId) || {
        exam_date: '2026-06-07', current_score: 580, target_score: 650
    };
    const days = Math.min(180, Math.max(7, parseInt(req.query.days) || 60));
    const fmtMD = (d) => (d.getMonth() + 1) + '/' + d.getDate();
    const labels = [];
    const history = []; // 历史真实分（前半段）
    const predict = []; // 预测分轨迹（后半段），历史部分用 null 让图断开
    const today = new Date();
    const examDate = new Date(user.exam_date || '2026-06-07');
    const baseScore = user.current_score || 580;
    const targetScore = user.target_score || 650;

    // 前 2/3 展示到今天为止的历史模拟分，后 1/3 展示到高考前的外推预测
    const historyDays = Math.min(days, 45);
    for (let i = historyDays - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        labels.push(fmtMD(d));
        // 围绕当前分数轻微波动：离今日越近越接近 baseScore，越久以前越低
        const factor = 1 - (i / historyDays) * 0.08; // 8%波动区间
        const wavy = Math.sin(d.getDate() * 0.8 + (d.getMonth() + 1)) * 3;
        const s = Math.max(450, Math.round(baseScore * factor + wavy));
        history.push(s);
        predict.push(null);
    }
    const slope = calcTrendSlope(userId); // 每日正确率斜率
    const examDaysLeft = Math.ceil((examDate - today) / (1000 * 60 * 60 * 24));
    // 若已过高考日期，视为"下一轮高考冲刺"，允许从今天再生成预测点，避免预测段全为 null
    const maxFutureDays = Math.max(7, days - historyDays);
    const predictDays = examDaysLeft > 0
        ? Math.min(maxFutureDays, examDaysLeft)
        : maxFutureDays;
    let currentScore = baseScore;
    for (let i = 1; i <= predictDays; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        labels.push(fmtMD(d));
        history.push(null);
        // 每天受斜率影响（趋势影响）+ 逐渐逼近目标
        const trendStep = Math.round(slope * TOTAL_MAX * 0.3);
        const pull = Math.max(0, targetScore - currentScore) * 0.03;
        currentScore = Math.min(targetScore, Math.round(currentScore + trendStep + pull));
        predict.push(currentScore);
    }

    res.json({
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
});

module.exports = router;
