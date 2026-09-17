// ========== AI推荐算法服务 ==========
// 基于薄弱知识点 + 难度自适应的题目推荐、学习计划、智能组卷
const express = require('express');
const router = express.Router();
const db = require('../db');

// 难度自适应：根据掌握率推荐合适难度
function recommendDifficulty(masteryRate) {
    if (masteryRate < 0.4) return [1, 2, 3];       // 基础题为主
    if (masteryRate < 0.6) return [2, 3, 4];       // 中等题为主
    if (masteryRate < 0.8) return [3, 4, 5];       // 提升题为主
    return [4, 5];                                  // 挑战题
}

// 获取用户已答过的题目ID集合（避免重复推荐）
function getAnsweredQuestionIds(userId) {
    return new Set(db.list('answer_records')
        .filter(r => r.user_id === userId)
        .map(r => r.question_id));
}

// 推荐题目（基于薄弱点 + 难度自适应）
// GET /api/recommend/:user_id/questions?count=10&subject=数学
router.get('/:user_id/questions', (req, res) => {
    const count = parseInt(req.query.count) || 10;
    const userId = req.params.user_id;
    const subjectFilter = req.query.subject;

    // 有对应题目的知识点ID集合（用于过滤薄弱点，避免推荐无题目可做的"假薄弱点"）
    const validKpIds = new Set(db.list('questions').map(q => q.knowledge_point_id).filter(Boolean));

    // 1. 获取薄弱知识点（掌握率<0.7，按提分收益降序）+ 只保留题库中真正有题目的
    let weakPoints = db.list('knowledge_points')
        .filter(k => k.mastery_rate < 0.7 && validKpIds.has(k.id));
    if (subjectFilter) weakPoints = weakPoints.filter(k => k.subject === subjectFilter);
    weakPoints.sort((a, b) => b.score_gain - a.score_gain);

    if (weakPoints.length === 0) {
        return res.json({ code: 0, data: [], msg: '当前无薄弱知识点，可挑战综合题', strategy: 'maintain' });
    }

    // 2. 难度自适应：为每个薄弱点匹配合适难度的题目
    const allQuestions = db.list('questions');
    const answeredSet = getAnsweredQuestionIds(userId);
    const recommendations = [];

    // 按提分收益从高到低遍历薄弱点，分配题目数量
    const totalGain = weakPoints.reduce((s, k) => s + k.score_gain, 0);
    weakPoints.forEach(kp => {
        // 按提分收益占比分配题目数量
        const allocCount = Math.max(1, Math.round(count * kp.score_gain / totalGain));
        const targetDifficulties = recommendDifficulty(kp.mastery_rate);

        // 优先未答过的题目；不足时回退到已答题目（复习模式）
        let fresh = allQuestions.filter(q => q.knowledge_point_id === kp.id && !answeredSet.has(q.id));
        let reviewed = allQuestions.filter(q => q.knowledge_point_id === kp.id && answeredSet.has(q.id));
        const sortByDiff = arr => arr.sort((a, b) => {
            const aScore = targetDifficulties.indexOf(a.difficulty);
            const bScore = targetDifficulties.indexOf(b.difficulty);
            return (aScore === -1 ? 99 : aScore) - (bScore === -1 ? 99 : bScore);
        });
        sortByDiff(fresh);
        sortByDiff(reviewed);

        let picked = fresh.slice(0, allocCount);
        if (picked.length < allocCount) {
            // 补充复习题
            picked = picked.concat(reviewed.slice(0, allocCount - picked.length).map(q => ({ ...q, is_review: true })));
        }

        picked.forEach(q => {
            recommendations.push({
                ...q,
                knowledge_point_name: kp.name,
                recommend_reason: q.is_review ? `复习巩固：${genReason(kp, q)}` : genReason(kp, q),
                priority: kp.priority
            });
        });
    });

    // 不足count时，优先从薄弱点的所有题目补充（保证命中率），不足再从其他题目补充
    if (recommendations.length < count) {
        const usedIds = new Set(recommendations.map(r => r.id));
        // 第一步：从薄弱点补充（遍历所有薄弱点的题目，未用的优先加入）
        for (const kp of weakPoints) {
            if (recommendations.length >= count) break;
            const kpQs = allQuestions.filter(q =>
                q.knowledge_point_id === kp.id && !usedIds.has(q.id));
            for (const q of kpQs) {
                if (recommendations.length >= count) break;
                if (usedIds.has(q.id)) continue;
                usedIds.add(q.id);
                recommendations.push({
                    ...q,
                    knowledge_point_name: kp.name,
                    recommend_reason: genReason(kp, q),
                    priority: kp.priority || 'medium'
                });
            }
        }
        // 第二步：仍不足时，从其他题目（非薄弱点也可）兜底
        if (recommendations.length < count) {
            const extra = allQuestions
                .filter(q => !usedIds.has(q.id))
                .slice(0, count - recommendations.length);
            extra.forEach(q => {
                const kp = db.findById('knowledge_points', q.knowledge_point_id);
                recommendations.push({
                    ...q,
                    knowledge_point_name: kp ? kp.name : '',
                    recommend_reason: '综合能力训练',
                    priority: 'low'
                });
            });
        }
    }

    res.json({
        code: 0,
        data: recommendations.slice(0, count),
        total: recommendations.length,
        strategy: 'weakness_adaptive',
        weak_points: weakPoints.slice(0, 5).map(k => ({ id: k.id, name: k.name, mastery_rate: k.mastery_rate, score_gain: k.score_gain }))
    });
});

// 生成推荐理由
function genReason(kp, q) {
    if (kp.mastery_rate < 0.4) {
        return `「${kp.name}」掌握率仅${Math.round(kp.mastery_rate * 100)}%，先巩固基础，预计可提${kp.score_gain}分`;
    } else if (kp.mastery_rate < 0.6) {
        return `「${kp.name}」掌握率${Math.round(kp.mastery_rate * 100)}%，中等难度强化，预计可提${kp.score_gain}分`;
    } else {
        return `「${kp.name}」接近掌握，挑战提升题，预计可提${kp.score_gain}分`;
    }
}

// 智能组卷
// GET /api/recommend/:user_id/paper?count=15&subjects=数学,物理
router.get('/:user_id/paper', (req, res) => {
    const count = parseInt(req.query.count) || 15;
    const userId = req.params.user_id;
    const subjects = req.query.subjects ? req.query.subjects.split(',') : null;

    let weakPoints = db.list('knowledge_points').filter(k => k.mastery_rate < 0.7);
    if (subjects) weakPoints = weakPoints.filter(k => subjects.includes(k.subject));
    weakPoints.sort((a, b) => b.score_gain - a.score_gain);

    const allQuestions = db.list('questions');
    const answeredSet = getAnsweredQuestionIds(userId);
    const paper = [];
    let totalScore = 0;
    const kpCoverage = new Set();

    weakPoints.forEach(kp => {
        const targetDifficulties = recommendDifficulty(kp.mastery_rate);
        // 优先未答题目，不足回退已答题目
        let fresh = allQuestions.filter(q => q.knowledge_point_id === kp.id && !answeredSet.has(q.id));
        let reviewed = allQuestions.filter(q => q.knowledge_point_id === kp.id && answeredSet.has(q.id));
        const sortByDiff = arr => arr.sort((a, b) => {
            const aScore = targetDifficulties.indexOf(a.difficulty);
            const bScore = targetDifficulties.indexOf(b.difficulty);
            return (aScore === -1 ? 99 : aScore) - (bScore === -1 ? 99 : bScore);
        });
        sortByDiff(fresh);
        sortByDiff(reviewed);
        let candidates = fresh.concat(reviewed);
        // 每个考点最多取2题，保证覆盖面
        candidates.slice(0, 2).forEach(q => {
            if (paper.length < count) {
                paper.push(q);
                totalScore += q.score || 0;
                kpCoverage.add(kp.id);
            }
        });
    });

    // 难度分布统计
    const difficultyDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    paper.forEach(q => difficultyDist[q.difficulty]++);

    res.json({
        code: 0,
        data: {
            paper,
            meta: {
                question_count: paper.length,
                total_score: totalScore,
                knowledge_point_count: kpCoverage.size,
                difficulty_distribution: difficultyDist,
                estimated_time_min: paper.length * 3
            }
        }
    });
});

// 推荐学习计划（每日任务安排）
// GET /api/recommend/:user_id/plan?available_minutes=120&shuffle=1
router.get('/:user_id/plan', (req, res) => {
    const availableMin = parseInt(req.query.available_minutes) || 120;
    const shuffle = req.query.shuffle === '1';
    const userId = req.params.user_id;

    const validKpIds = new Set(db.list('questions').map(q => q.knowledge_point_id).filter(Boolean));
    let weakPoints = db.list('knowledge_points')
        .filter(k => k.mastery_rate < 0.7 && validKpIds.has(k.id));
    weakPoints.sort((a, b) => b.score_gain - a.score_gain);
    weakPoints = weakPoints.slice(0, 6); // 取前6个薄弱点

    const totalGain = weakPoints.reduce((s, k) => s + k.score_gain, 0) || 1;
    const plan = [];
    let usedMin = 0;

    // shuffle 支持：重新规划时打乱薄弱点顺序 + 微调时长
    if (shuffle && weakPoints.length > 1) {
        for (let i = weakPoints.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [weakPoints[i], weakPoints[j]] = [weakPoints[j], weakPoints[i]];
        }
    }

    weakPoints.forEach((kp, idx) => {
        if (usedMin >= availableMin) return;
        // 按提分收益占比分配时间
        const baseAlloc = Math.round(availableMin * kp.score_gain / totalGain);
        const timeVar = shuffle ? (Math.random() > 0.5 ? 5 : -5) : 0;
        const allocMin = Math.min(
            availableMin - usedMin,
            Math.max(15, baseAlloc + timeVar)
        );
        const targetDifficulties = recommendDifficulty(kp.mastery_rate);
        const questions = db.list('questions')
            .filter(q => q.knowledge_point_id === kp.id)
            .sort((a, b) => Math.abs(targetDifficulties[0] - a.difficulty) - Math.abs(targetDifficulties[0] - b.difficulty))
            .slice(0, Math.max(2, Math.floor(allocMin / 10)));

        plan.push({
            order: idx + 1,
            subject: kp.subject,
            knowledge_point_id: kp.id,
            knowledge_point_name: kp.name,
            mastery_rate: kp.mastery_rate,
            score_gain: kp.score_gain,
            allocated_minutes: allocMin,
            question_count: questions.length,
            question_ids: questions.map(q => q.id),
            difficulty: targetDifficulties[0],
            strategy: kp.mastery_rate < 0.4 ? '基础巩固' : (kp.mastery_rate < 0.6 ? '专项强化' : '提升突破')
        });
        usedMin += allocMin;
    });

    // shuffle：打乱任务顺序
    if (shuffle && plan.length > 1) {
        for (let i = plan.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [plan[i], plan[j]] = [plan[j], plan[i]];
            // 修正 order
            plan[i].order = i + 1;
            plan[j].order = j + 1;
        }
    }

    res.json({
        code: 0,
        data: {
            total_minutes: usedMin,
            task_count: plan.length,
            estimated_score_gain: weakPoints.reduce((s, k) => s + k.score_gain, 0),
            replanned: shuffle,
            plan
        }
    });
});

// 推荐学习计划（周/月计划，基于薄弱知识点动态生成）
// GET /api/recommend/:user_id/week-plan?shuffle=1&range=this_week|next_week|this_month
router.get('/:user_id/week-plan', (req, res) => {
    const userId = req.params.user_id;
    const shuffle = req.query.shuffle === '1';
    const range = (req.query.range || 'this_week').toLowerCase();
    const validRange = ['this_week', 'next_week', 'this_month'].includes(range) ? range : 'this_week';
    const rangeLabel = validRange === 'this_week' ? '本周' : validRange === 'next_week' ? '下周' : '本月';

    // 获取某天所在周的周一（0时0分）
    function getMondayOf(d) {
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        const day = x.getDay();
        const diff = x.getDate() - day + (day === 0 ? -6 : 1);
        x.setDate(diff);
        return x;
    }
    function buildDateRange(range, today) {
        const WK = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        const thisMonday = getMondayOf(today);
        let startMonday = new Date(thisMonday);
        let totalDays = 7;
        if (range === 'next_week') { startMonday.setDate(thisMonday.getDate() + 7); totalDays = 7; }
        else if (range === 'this_month') { totalDays = 28; }
        const out = [];
        for (let i = 0; i < totalDays; i++) {
            const d = new Date(startMonday);
            d.setDate(startMonday.getDate() + i);
            const wkIdx = i % 7;
            const sameDay = d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
            out.push({
                day: WK[wkIdx],
                date: (d.getMonth() + 1) + '/' + d.getDate(),
                isToday: sameDay && (range === 'this_week'),
                week_group: Math.floor(i / 7),
                week_group_name: range === 'this_month' ? `第${Math.floor(i / 7) + 1}周` : null
            });
        }
        return out;
    }

    // 1. 获取薄弱知识点（掌握率<0.7）+ 只保留有题目的，按提分收益降序
    const validKpIds = new Set(db.list('questions').map(q => q.knowledge_point_id).filter(Boolean));
    let weakPoints = db.list('knowledge_points')
        .filter(k => k.mastery_rate < 0.7 && validKpIds.has(k.id));
    weakPoints.sort((a, b) => b.score_gain - a.score_gain);

    // 重新规划时打乱薄弱点顺序，使每次规划结果不同
    if (shuffle && weakPoints.length > 1) {
        const topPicks = weakPoints.slice(0, 3);
        const rest = weakPoints.slice(3);
        for (let i = rest.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rest[i], rest[j]] = [rest[j], rest[i]];
        }
        if (Math.random() > 0.5) {
            for (let i = topPicks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [topPicks[i], topPicks[j]] = [topPicks[j], topPicks[i]];
            }
        }
        weakPoints = topPicks.concat(rest);
    }

    // 2. 获取用户学习记录，判断哪些知识点近期已学过（算作已完成，仅本周范围）
    const learnedKpIds = new Set(db.list('learning_records')
        .filter(r => r.user_id === userId)
        .map(r => r.knowledge_point_id));

    // 3. 学科配置（含图标与颜色标识）
    const subjectConfig = {
        '数学': 'blue', '语文': 'red', '英语': 'green',
        '物理': 'purple', '化学': 'orange', '生物': 'green',
        '思想政治': 'red', '历史': 'orange', '地理': 'blue', '综合': 'purple'
    };

    // 4. 生成日期范围（本周 / 下周 / 本月）
    const today = new Date();
    const rangeDates = buildDateRange(validRange, today);

    // 5. 分配到 N 天（N = 7 或 28）
    const planDays = rangeDates.map(wd => ({
        day: wd.day, date: wd.date, isToday: !!wd.isToday,
        week_group: wd.week_group, week_group_name: wd.week_group_name, tasks: []
    }));
    const totalDays = planDays.length;
    const startOffset = shuffle ? Math.floor(Math.random() * Math.min(7, totalDays)) : 0;

    if (weakPoints.length === 0) {
        planDays.forEach((d, idx) => {
            const wkIdx = idx % 7;
            d.tasks.push({
                subject: '综合', color: 'purple',
                point: wkIdx === 5 ? '理科综合模拟' : (wkIdx === 6 ? '错题回顾与总结' : '综合能力训练'),
                time: wkIdx >= 5 ? '90min' : '40min', done: false
            });
        });
    } else {
        weakPoints.forEach((kp, idx) => {
            const dayIdx = (idx + startOffset) % totalDays;
            const isDone = validRange === 'this_week' && learnedKpIds.has(kp.id);
            const baseMin = 20 + Math.round(kp.score_gain * 1.5);
            const timeVar = shuffle ? (Math.random() > 0.5 ? 5 : -5) : 0;
            planDays[dayIdx].tasks.push({
                subject: kp.subject, color: subjectConfig[kp.subject] || 'blue',
                point: kp.name, time: Math.max(15, baseMin + timeVar) + 'min', done: isDone
            });
        });
        // 每周周六/周日安排综合模拟与错题回顾
        for (let w = 0; w < Math.ceil(totalDays / 7); w++) {
            const satIdx = w * 7 + 5, sunIdx = w * 7 + 6;
            if (satIdx < totalDays && planDays[satIdx].tasks.length < 2)
                planDays[satIdx].tasks.push({ subject: '综合', color: 'purple', point: '理科综合模拟', time: '90min', done: false });
            if (sunIdx < totalDays && planDays[sunIdx].tasks.length < 2)
                planDays[sunIdx].tasks.push({ subject: '综合', color: 'orange', point: '错题回顾与总结', time: '60min', done: false });
        }
    }

    // 6. 统计
    const allTasks = planDays.reduce((arr, d) => arr.concat(d.tasks), []);
    const doneCount = allTasks.filter(t => t.done).length;

    res.json({
        code: 0,
        data: {
            week_plan: planDays,
            total_tasks: allTasks.length,
            done_tasks: doneCount,
            estimated_score_gain: weakPoints.reduce((s, k) => s + k.score_gain, 0),
            weak_point_count: weakPoints.length,
            replanned: shuffle,
            range: validRange,
            range_label: rangeLabel
        }
    });
});

module.exports = router;
