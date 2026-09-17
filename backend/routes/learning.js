// ========== 学情数据采集与存储路由 ==========
// 采集学习时长、题目数、正确率，提供汇总统计
const express = require('express');
const router = express.Router();
const db = require('../db');

// 上传学情记录
// POST /api/learning  body: { user_id, date, subject, knowledge_point_id, duration_min, questions_count, correct_count }
router.post('/', (req, res) => {
    const { user_id, date, subject, knowledge_point_id, duration_min, questions_count, correct_count } = req.body;
    if (!user_id || !subject) return res.status(400).json({ code: 1, msg: 'user_id 和 subject 必填' });
    const record = db.insert('learning_records', {
        user_id,
        date: date || new Date().toISOString().slice(0, 10),
        subject,
        knowledge_point_id: knowledge_point_id || null,
        duration_min: duration_min || 0,
        questions_count: questions_count || 0,
        correct_count: correct_count || 0
    });
    res.json({ code: 0, data: record, msg: '学情已记录' });
});

// 获取用户学情列表
// GET /api/learning/:user_id?days=7
router.get('/:user_id', (req, res) => {
    const days = parseInt(req.query.days) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);
    const list = db.list('learning_records')
        .filter(r => r.user_id === req.params.user_id && r.date >= sinceStr)
        .sort((a, b) => b.date.localeCompare(a.date));
    res.json({ code: 0, data: list, total: list.length });
});

// 学情汇总（总时长、总题数、正确率、积分）
// GET /api/learning/:user_id/summary?days=7
router.get('/:user_id/summary', (req, res) => {
    const days = parseInt(req.query.days) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);
    const records = db.list('learning_records')
        .filter(r => r.user_id === req.params.user_id && r.date >= sinceStr);

    const totalDuration = records.reduce((s, r) => s + (r.duration_min || 0), 0);
    const totalQuestions = records.reduce((s, r) => s + (r.questions_count || 0), 0);
    const totalCorrect = records.reduce((s, r) => s + (r.correct_count || 0), 0);
    const correctRate = totalQuestions > 0 ? Math.round(totalCorrect / totalQuestions * 100) : 0;
    const points = Math.round(totalDuration * 2 + totalCorrect * 5 + totalQuestions * 1);

    // 对比上一周期，计算变化率
    const prevSince = new Date(since);
    prevSince.setDate(prevSince.getDate() - days);
    const prevSinceStr = prevSince.toISOString().slice(0, 10);
    const prevRecords = db.list('learning_records')
        .filter(r => r.user_id === req.params.user_id && r.date >= prevSinceStr && r.date < sinceStr);
    const prevDuration = prevRecords.reduce((s, r) => s + (r.duration_min || 0), 0);
    const prevQuestions = prevRecords.reduce((s, r) => s + (r.questions_count || 0), 0);
    const prevCorrect = prevRecords.reduce((s, r) => s + (r.correct_count || 0), 0);
    const prevRate = prevQuestions > 0 ? prevCorrect / prevQuestions : 0;

    const calcChange = (cur, prev) => prev > 0 ? Math.round((cur - prev) / prev * 100) : (cur > 0 ? 100 : 0);

    res.json({
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
});

// 分科目统计（覆盖高考9大学科）
// GET /api/learning/:user_id/subject-stats?days=14
router.get('/:user_id/subject-stats', (req, res) => {
    const days = parseInt(req.query.days) || 14;
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);
    const records = db.list('learning_records')
        .filter(r => r.user_id === req.params.user_id && r.date >= sinceStr);

    const subjectMap = {};
    records.forEach(r => {
        if (!subjectMap[r.subject]) subjectMap[r.subject] = { duration_min: 0, questions: 0, correct: 0 };
        subjectMap[r.subject].duration_min += r.duration_min || 0;
        subjectMap[r.subject].questions += r.questions_count || 0;
        subjectMap[r.subject].correct += r.correct_count || 0;
    });

    // 高考9大学科
    const subjects = ['数学', '语文', '英语', '物理', '化学', '生物', '思想政治', '历史', '地理'];
    const data = subjects.map(s => {
        const d = subjectMap[s] || { duration_min: 0, questions: 0, correct: 0 };
        return {
            subject: s,
            duration_min: d.duration_min,
            questions: d.questions,
            correct_rate: d.questions > 0 ? Math.round(d.correct / d.questions * 100) : 0
        };
    });
    res.json({ code: 0, data });
});

// 各科复习进度（基于知识点掌握率计算，覆盖高考9大学科）
// GET /api/learning/:user_id/review-progress
router.get('/:user_id/review-progress', (req, res) => {
    const allKps = db.list('knowledge_points');
    const records = db.list('learning_records').filter(r => r.user_id === req.params.user_id);

    // 高考9大学科配置（含图标与主题色）
    const subjectConfig = [
        { name: '数学', color: '#3B82F6', icon: 'fa-square-root-variable' },
        { name: '语文', color: '#F59E0B', icon: 'fa-book' },
        { name: '英语', color: '#10B981', icon: 'fa-language' },
        { name: '物理', color: '#8B5CF6', icon: 'fa-atom' },
        { name: '化学', color: '#06B6D4', icon: 'fa-flask' },
        { name: '生物', color: '#EC4899', icon: 'fa-dna' },
        { name: '思想政治', color: '#EF4444', icon: 'fa-landmark' },
        { name: '历史', color: '#D97706', icon: 'fa-ribbon' },
        { name: '地理', color: '#059669', icon: 'fa-globe-asia' }
    ];

    const data = subjectConfig.map(s => {
        const kps = allKps.filter(k => k.subject === s.name);
        // 复习进度 = 所有知识点掌握率的平均值
        let percent = 0;
        if (kps.length > 0) {
            const avgMastery = kps.reduce((sum, k) => sum + (k.mastery_rate || 0), 0) / kps.length;
            percent = Math.round(avgMastery * 100);
        }
        // 统计该科目实际学习记录
        const subjectRecords = records.filter(r => r.subject === s.name);
        const totalQuestions = subjectRecords.reduce((sum, r) => sum + (r.questions_count || 0), 0);
        const totalCorrect = subjectRecords.reduce((sum, r) => sum + (r.correct_count || 0), 0);
        const totalDuration = subjectRecords.reduce((sum, r) => sum + (r.duration_min || 0), 0);

        return {
            subject: s.name,
            percent,
            color: s.color,
            icon: s.icon,
            knowledge_points: kps.length,
            duration_min: totalDuration,
            questions: totalQuestions,
            correct_rate: totalQuestions > 0 ? Math.round(totalCorrect / totalQuestions * 100) : 0
        };
    });

    res.json({ code: 0, data });
});
// 今日任务列表（基于本周计划中今天的任务 + 学习记录动态生成）
// GET /api/learning/:user_id/today-tasks
router.get('/:user_id/today-tasks', (req, res) => {
    const userId = req.params.user_id;
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const todayWeekday = (today.getDay() + 6) % 7; // 周一=0

    // 学科图标配置（学科名归一化：兼容"思想政治/政治/思政"）
    const normSubject = (s) => {
        if (!s) return s;
        if (/^思想?政治?$|^思政$|^道德与法治$/.test(s)) return '政治';
        return s;
    };
    const subjectIcons = {
        '数学': { icon: 'fa-square-root-variable', color: 'blue' },
        '语文': { icon: 'fa-book', color: 'red' },
        '英语': { icon: 'fa-language', color: 'green' },
        '物理': { icon: 'fa-atom', color: 'purple' },
        '化学': { icon: 'fa-flask', color: 'orange' },
        '生物': { icon: 'fa-dna', color: 'pink' },
        '政治': { icon: 'fa-landmark', color: 'red' },
        '历史': { icon: 'fa-ribbon', color: 'orange' },
        '地理': { icon: 'fa-globe-asia', color: 'green' },
        '综合': { icon: 'fa-layer-group', color: 'purple' }
    };

    // 1. 获取今天的薄弱知识点任务（复用week-plan逻辑，只保留有题目的）
    //    validKpIds：先把 questions 的学科归一化后，再把题目对应的 knowledge_point_id 列入白名单
    const questionKpSubjects = {};
    db.list('questions').forEach(q => {
        if (q.knowledge_point_id) questionKpSubjects[q.knowledge_point_id] = normSubject(q.subject);
    });
    const validKpIds = new Set(Object.keys(questionKpSubjects));
    let weakPoints = db.list('knowledge_points')
        .filter(k => k.mastery_rate < 0.7 && (validKpIds.has(k.id) || questionKpSubjects[k.id] === normSubject(k.subject)));
    weakPoints.sort((a, b) => b.score_gain - a.score_gain);

    // 按week-plan相同的分配逻辑，取今天的任务
    const todayTasks = [];
    const learnedKpIds = new Set(db.list('learning_records')
        .filter(r => r.user_id === userId)
        .map(r => r.knowledge_point_id));

    weakPoints.forEach((kp, idx) => {
        const dayIdx = idx % 7;
        if (dayIdx === todayWeekday) {
            const kpSubject = normSubject(kp.subject);
            const cfg = subjectIcons[kpSubject] || subjectIcons['综合'];
            todayTasks.push({
                subject: kpSubject,
                color: cfg.color,
                icon: cfg.icon,
                knowledge_point_id: kp.id,
                point: kp.name,
                difficulty: kp.difficulty >= 4 ? '困难' : (kp.difficulty >= 3 ? '中等' : '简单'),
                time: (20 + Math.round(kp.score_gain * 1.5)) + 'min',
                questions_count: Math.max(5, Math.round((kp.score_gain || 5) * 1.2)),
                status: 'todo'
            });
        }
    });

    // 2. 获取今天的学习记录，更新任务状态
    const todayRecords = db.list('learning_records').filter(r => r.user_id === userId && r.date === todayStr);
    todayRecords.forEach(rec => {
        const task = todayTasks.find(t => t.knowledge_point_id === rec.knowledge_point_id);
        if (task) {
            task.status = 'done';
            task.questions_count = rec.questions_count;
            task.correct_rate = rec.questions_count > 0 ? Math.round(rec.correct_count / rec.questions_count * 100) : 0;
            task.duration_min = rec.duration_min;
        }
    });

    // 3. 保证学科多样性：9科中如果有薄弱知识点，则至少每个薄弱科出1个任务；总任务数4~8，未出现学科优先。
    const usedKpIds = new Set(todayTasks.map(t => t.knowledge_point_id));
    const usedSubjects = new Set(todayTasks.map(t => t.subject));
    const MAX_TASKS = 8;
    const MIN_SUBJECT_COVER = Math.min(9, weakPoints.reduce((s, kp) => s.add(normSubject(kp.subject)), new Set()).size); // 不同学科的weak数量上限

    // 3.1 第一轮：补齐未出现过的学科（最多加到MAX_TASKS个）
    if (todayTasks.length < MAX_TASKS) {
        for (const kp of weakPoints) {
            if (todayTasks.length >= MAX_TASKS) break;
            if (usedKpIds.has(kp.id)) continue;
            const kpSubject = normSubject(kp.subject);
            if (usedSubjects.has(kpSubject)) continue; // 只补从未出现过的学科
            const cfg = subjectIcons[kpSubject] || subjectIcons['综合'];
            todayTasks.push({
                subject: kpSubject,
                color: cfg.color,
                icon: cfg.icon,
                knowledge_point_id: kp.id,
                point: kp.name,
                difficulty: kp.difficulty >= 4 ? '困难' : (kp.difficulty >= 3 ? '中等' : '简单'),
                time: (20 + Math.round(kp.score_gain * 1.5)) + 'min',
                questions_count: Math.max(5, Math.round((kp.score_gain || 5) * 1.2)),
                status: 'todo'
            });
            usedKpIds.add(kp.id);
            usedSubjects.add(kpSubject);
        }
    }

    // 3.2 第二轮：如果仍然少于4个任务，从剩余weak中按学科多样性再补充
    if (todayTasks.length < 4 && weakPoints.length > usedKpIds.size) {
        for (let pass = 0; pass < 2 && todayTasks.length < 6; pass++) {
            for (const kp of weakPoints) {
                if (todayTasks.length >= 6) break;
                if (usedKpIds.has(kp.id)) continue;
                const kpSubject = normSubject(kp.subject);
                if (pass === 0 && usedSubjects.has(kpSubject)) continue;
                const cfg = subjectIcons[kpSubject] || subjectIcons['综合'];
                todayTasks.push({
                    subject: kpSubject,
                    color: cfg.color,
                    icon: cfg.icon,
                    knowledge_point_id: kp.id,
                    point: kp.name,
                    difficulty: kp.difficulty >= 4 ? '困难' : (kp.difficulty >= 3 ? '中等' : '简单'),
                    time: (20 + Math.round(kp.score_gain * 1.5)) + 'min',
                    questions_count: Math.max(5, Math.round((kp.score_gain || 5) * 1.2)),
                    status: 'todo'
                });
                usedKpIds.add(kp.id);
                usedSubjects.add(kpSubject);
            }
        }
    }

    // 4. 统计
    const doneCount = todayTasks.filter(t => t.status === 'done').length;
    const totalCount = todayTasks.length;
    const completionRate = totalCount > 0 ? Math.round(doneCount / totalCount * 100) : 0;

    // 5. 日期格式化
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const dateText = month + '月' + day + '日 ' + weekdayNames[today.getDay()];

    res.json({
        code: 0,
        data: {
            date: dateText,
            tasks: todayTasks,
            done_count: doneCount,
            total_count: totalCount,
            completion_rate: completionRate
        }
    });
});

// 学习时长统计（今日/本周/本月、每日分布、各科占比、热力图、AI建议）
// GET /api/learning/:user_id/duration-stats
router.get('/:user_id/duration-stats', (req, res) => {
    const userId = req.params.user_id;
    const allRecords = db.list('learning_records').filter(r => r.user_id === userId);

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // 日期工具：返回 yyyy-mm-dd
    const fmt = (d) => d.toISOString().slice(0, 10);
    // 周一为一周开始
    const getWeekStart = (d) => {
        const x = new Date(d);
        const day = (x.getDay() + 6) % 7; // 周一=0
        x.setDate(x.getDate() - day);
        x.setHours(0, 0, 0, 0);
        return x;
    };
    // 本周/本月/上周/上月范围
    const weekStart = getWeekStart(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = weekStart;

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = monthStart;

    const inRange = (r, s, e) => r.date >= fmt(s) && r.date < fmt(e);
    const sumMin = (arr) => arr.reduce((s, r) => s + (r.duration_min || 0), 0);

    // 今日
    const todayRecords = allRecords.filter(r => r.date === todayStr);
    const todayMin = sumMin(todayRecords);
    const todayHours = +(todayMin / 60).toFixed(1);

    // 上周同日（用于今日同比）
    const prevSameDay = new Date(now);
    prevSameDay.setDate(prevSameDay.getDate() - 7);
    const prevSameDayStr = fmt(prevSameDay);
    const prevTodayMin = sumMin(allRecords.filter(r => r.date === prevSameDayStr));
    const todayChange = prevTodayMin > 0 ? Math.round((todayMin - prevTodayMin) / prevTodayMin * 100) : (todayMin > 0 ? 100 : 0);

    // 日目标 6h = 360min
    const dailyGoalMin = 360;
    const todayGoalRate = dailyGoalMin > 0 ? Math.min(100, Math.round(todayMin / dailyGoalMin * 100)) : 0;

    // 本周/上周
    const weekRecords = allRecords.filter(r => inRange(r, weekStart, weekEnd));
    const prevWeekRecords = allRecords.filter(r => inRange(r, prevWeekStart, prevWeekEnd));
    const weekMin = sumMin(weekRecords);
    const prevWeekMin = sumMin(prevWeekRecords);
    const weekHours = +(weekMin / 60).toFixed(1);
    const weekChange = prevWeekMin > 0 ? Math.round((weekMin - prevWeekMin) / prevWeekMin * 100) : (weekMin > 0 ? 100 : 0);

    // 本月/上月
    const monthRecords = allRecords.filter(r => inRange(r, monthStart, monthEnd));
    const prevMonthRecords = allRecords.filter(r => inRange(r, prevMonthStart, prevMonthEnd));
    const monthMin = sumMin(monthRecords);
    const prevMonthMin = sumMin(prevMonthRecords);
    const monthHours = +(monthMin / 60).toFixed(1);
    const monthChange = prevMonthMin > 0 ? Math.round((monthMin - prevMonthMin) / prevMonthMin * 100) : (monthMin > 0 ? 100 : 0);

    // 本周每日分布（周一到周日）
    const weekDayNames = ['一', '二', '三', '四', '五', '六', '日'];
    const weekly = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        const dStr = fmt(d);
        const dayMin = sumMin(allRecords.filter(r => r.date === dStr));
        weekly.push({
            day: weekDayNames[i],
            date: dStr,
            hours: +(dayMin / 60).toFixed(1),
            min: dayMin,
            is_today: dStr === todayStr
        });
    }
    // 本周目标 42h = 2520min
    const weekGoalHours = 42;
    const weekGoalMin = weekGoalHours * 60;
    const weekGoalRate = weekGoalMin > 0 ? Math.min(100, Math.round(weekMin / weekGoalMin * 100)) : 0;

    // 日均时长 = 本周时长 / 已过天数（至少1）
    const elapsedDays = Math.max(1, ((now - weekStart) / (1000 * 60 * 60 * 24)));
    const avgHours = +(weekHours / Math.min(7, Math.ceil(elapsedDays))).toFixed(1);
    const prevAvgMin = prevWeekMin > 0 ? prevWeekMin / 7 : 0;
    const avgChange = prevAvgMin > 0 ? Math.round(((weekMin / Math.min(7, Math.ceil(elapsedDays))) - prevAvgMin) / prevAvgMin * 100) : (weekMin > 0 ? 100 : 0);

    // 各科学习时长（本周，覆盖9大学科）
    const subjectConfig = [
        { name: '数学', color: '#3B82F6' },
        { name: '语文', color: '#F59E0B' },
        { name: '英语', color: '#10B981' },
        { name: '物理', color: '#8B5CF6' },
        { name: '化学', color: '#06B6D4' },
        { name: '生物', color: '#EC4899' },
        { name: '思想政治', color: '#EF4444' },
        { name: '历史', color: '#D97706' },
        { name: '地理', color: '#059669' }
    ];
    const subjectMinMap = {};
    weekRecords.forEach(r => {
        if (!subjectMinMap[r.subject]) subjectMinMap[r.subject] = 0;
        subjectMinMap[r.subject] += r.duration_min || 0;
    });
    // 只展示有时长的学科，加上"其他"兜底
    const subjects = subjectConfig
        .map(s => {
            const min = subjectMinMap[s.name] || 0;
            return { subject: s.name, color: s.color, min, hours: +(min / 60).toFixed(1) };
        })
        .filter(s => s.min > 0)
        .sort((a, b) => b.min - a.min);
    const subjectTotalMin = subjects.reduce((s, x) => s + x.min, 0);
    subjects.forEach(s => {
        s.percent = subjectTotalMin > 0 ? Math.round(s.min / subjectTotalMin * 100) : 0;
    });
    const subjectTotalHours = +(subjectTotalMin / 60).toFixed(1);

    // 学习时段热力图（基于 created_at 的小时分布，24h × 7天）
    // 矩阵：7行(周一~周日) × 24列(0~23点)，值为 0-4 强度等级
    const heatmap = [];
    const hourCounts = []; // [7][24]
    let maxCount = 1;
    for (let i = 0; i < 7; i++) {
        hourCounts.push(new Array(24).fill(0));
    }
    allRecords.forEach(r => {
        let dt;
        try { dt = new Date(r.created_at || r.date); } catch (e) { return; }
        if (isNaN(dt.getTime())) return;
        const dow = (dt.getDay() + 6) % 7; // 周一=0
        const hour = dt.getHours();
        hourCounts[dow][hour] = (hourCounts[dow][hour] || 0) + 1;
        if (hourCounts[dow][hour] > maxCount) maxCount = hourCounts[dow][hour];
    });
    for (let i = 0; i < 7; i++) {
        const row = [];
        for (let h = 0; h < 24; h++) {
            const c = hourCounts[i][h];
            let level = 0;
            if (c > 0) level = Math.min(4, Math.ceil(c / maxCount * 4));
            row.push(level);
        }
        heatmap.push(row);
    }
    // 找出高峰时段（强度>=3的小时）
    const hourScore = new Array(24).fill(0);
    for (let i = 0; i < 7; i++) for (let h = 0; h < 24; h++) hourScore[h] += hourCounts[i][h];
    let peakStart = 19, peakEnd = 22, peakMax = 0;
    for (let h = 0; h < 24; h++) if (hourScore[h] > peakMax) { peakMax = hourScore[h]; peakStart = h; }
    peakEnd = Math.min(23, peakStart + 3);

    // AI学习建议（基于数据分析动态生成）
    let advice = '';
    if (subjects.length === 0) {
        advice = '本周暂无学习记录，建议从薄弱科目开始，每日坚持学习2小时以上。';
    } else {
        const minSubject = subjects[subjects.length - 1]; // 时长最少的学科
        const maxSubject = subjects[0];
        const minPercent = minSubject.percent;
        const parts = [];
        if (minSubject.percent < 15 && subjects.length > 1) {
            parts.push(`${minSubject.subject}学习时长偏少（仅${minSubject.percent}%），建议每日增加 30 分钟${minSubject.subject}专项训练`);
        }
        if (todayHours < 2) {
            parts.push(`今日学习时长仅${todayHours}小时，低于推荐值，请抓紧时间完成今日任务`);
        } else if (todayHours >= 6) {
            parts.push(`今日已学习${todayHours}小时，达到日目标，注意劳逸结合`);
        }
        parts.push(`你的高效学习时段为 ${peakStart}:00-${peakEnd}:00，可在此时段安排薄弱科目`);
        advice = parts.join('。') + '。';
    }

    res.json({
        code: 0,
        data: {
            today: {
                duration_min: todayMin,
                duration_hours: todayHours,
                change_pct: todayChange,
                daily_goal_hours: dailyGoalMin / 60,
                goal_rate: todayGoalRate
            },
            summary: {
                week_hours: weekHours,
                week_change: weekChange,
                month_hours: monthHours,
                month_change: monthChange,
                avg_hours: avgHours,
                avg_change: avgChange
            },
            weekly: weekly,
            week_total_hours: weekHours,
            week_goal_hours: weekGoalHours,
            week_goal_rate: weekGoalRate,
            subjects: subjects,
            subject_total_hours: subjectTotalHours,
            heatmap: heatmap,
            peak_start: peakStart,
            peak_end: peakEnd,
            advice: advice
        }
    });
});

// 每日学习序列（支持 days 参数，供"近7天/近30天/本学期"分段切换）
// GET /api/learning/:user_id/daily-series?days=7&subject=数学
//   → 返回 { labels: ['8/25', ...], duration_minutes: [...], questions: [...], correct_rate: [...] }
router.get('/:user_id/daily-series', (req, res) => {
    const days = Math.min(180, Math.max(3, parseInt(req.query.days) || 7));
    const subject = req.query.subject && req.query.subject !== '全部' ? String(req.query.subject) : null;
    const fmtMD = (d) => (d.getMonth() + 1) + '/' + d.getDate();
    const labels = [];
    const minutes = [];
    const questions = [];
    const correct_counts = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dStr = d.toISOString().slice(0, 10);
        labels.push(fmtMD(d));
        const rows = db.list('learning_records').filter(r =>
            r.user_id === req.params.user_id && r.date === dStr && (!subject || r.subject === subject)
        );
        const min = rows.reduce((s, r) => s + (r.duration_min || 0), 0);
        const q = rows.reduce((s, r) => s + (r.questions_count || 0), 0);
        const c = rows.reduce((s, r) => s + (r.correct_count || 0), 0);
        minutes.push(min);
        questions.push(q);
        correct_counts.push(c);
    }
    const correct_rate = questions.map((n, i) => n > 0 ? Math.round(correct_counts[i] / n * 100) : 0);
    res.json({
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
});

// 学科掌握（能力雷达）详情：返回当前掌握率 + 目标掌握率 + 学科统计摘要，接受 range=7/30/120 切换评估窗口
// GET /api/learning/:user_id/subject-mastery?days=30
router.get('/:user_id/subject-mastery', (req, res) => {
    const days = Math.min(180, Math.max(7, parseInt(req.query.days) || 30));
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);
    const allKps = db.list('knowledge_points');
    const records = db.list('learning_records').filter(r => r.user_id === req.params.user_id && r.date >= sinceStr);
    const answerRecords = db.list('answer_records').filter(r => r.user_id === req.params.user_id && new Date(r.created_at) >= since);

    const subjectConfig = [
        { name: '数学', color: '#3B82F6', icon: 'fa-square-root-variable', target: 90 },
        { name: '语文', color: '#F59E0B', icon: 'fa-book',                  target: 85 },
        { name: '英语', color: '#10B981', icon: 'fa-language',              target: 88 },
        { name: '物理', color: '#8B5CF6', icon: 'fa-atom',                  target: 90 },
        { name: '化学', color: '#06B6D4', icon: 'fa-flask',                 target: 88 },
        { name: '生物', color: '#EC4899', icon: 'fa-dna',                   target: 86 },
        { name: '思想政治', color: '#EF4444', icon: 'fa-landmark',          target: 85 },
        { name: '历史', color: '#D97706', icon: 'fa-ribbon',                target: 86 },
        { name: '地理', color: '#059669', icon: 'fa-globe-asia',            target: 84 }
    ];

    const radar = subjectConfig.map(s => {
        const kps = allKps.filter(k => k.subject === s.name);
        const avgMastery = kps.length > 0 ? Math.round(kps.reduce((sum, k) => sum + (k.mastery_rate || 0), 0) / kps.length * 100) : 0;
        const subRec = records.filter(r => r.subject === s.name);
        const subAns = answerRecords.filter(r => r.subject === s.name);
        const durationMin = subRec.reduce((a, r) => a + (r.duration_min || 0), 0);
        const totalQ = subRec.reduce((a, r) => a + (r.questions_count || 0), 0) + subAns.length;
        const ansCorrect = subAns.filter(a => a.is_correct).length + subRec.reduce((a, r) => a + (r.correct_count || 0), 0);
        const ansTotal = subAns.length + subRec.reduce((a, r) => a + (r.questions_count || 0), 0);
        const rate = ansTotal > 0 ? Math.round(ansCorrect / ansTotal * 100) : 0;
        const gap = s.target - avgMastery; // 离目标还差多少
        return {
            subject: s.name,
            color: s.color,
            icon: s.icon,
            current_mastery: avgMastery,
            target_mastery: s.target,
            gap_pct: gap,
            duration_min: durationMin,
            duration_hours: +(durationMin / 60).toFixed(1),
            questions_count: totalQ,
            correct_rate: rate
        };
    });

    // 薄弱 TOP 学科（根据 gap 排序）
    const rank = [...radar].sort((a, b) => b.gap_pct - a.gap_pct);
    const weakest = rank.slice(0, 3).map(r => ({ subject: r.subject, color: r.color, gap: r.gap_pct, current: r.current_mastery, target: r.target_mastery }));
    const strongest = [...radar].sort((a, b) => a.gap_pct - b.gap_pct).slice(0, 2).map(r => ({ subject: r.subject, color: r.color, gap: r.gap_pct, current: r.current_mastery }));

    res.json({
        code: 0,
        data: {
            days,
            radar,
            weakest_subjects: weakest,
            strongest_subjects: strongest,
            radar_labels: radar.map(r => r.subject === '思想政治' ? '政治' : r.subject),
            radar_current: radar.map(r => r.current_mastery),
            radar_target: radar.map(r => r.target_mastery)
        }
    });
});

module.exports = router;
