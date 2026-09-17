// GET /api/recommend/:user_id/week-plan?shuffle=1&range=this_week|next_week|this_month — AI学习计划
import { listTable } from '../../../_shared/kv-db.js';

// 获取某天所在周的周一（0时0分）
function getMondayOf(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    const day = x.getDay(); // 0=Sun..6=Sat
    const diff = x.getDate() - day + (day === 0 ? -6 : 1);
    x.setDate(diff);
    return x;
}

// 根据 range 生成计划覆盖的日期条目
// this_week:  本周一 ~ 本周日（7天）
// next_week:  下周一 ~ 下周日（7天）
// this_month: 连续 4 周 = 28 天（从本周一开始，覆盖本月大部分时间）
function buildDateRange(range, today) {
    const WK = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const thisMonday = getMondayOf(today);
    const todayWeekday = (today.getDay() + 6) % 7; // 0=Mon..6=Sun
    let startMonday = new Date(thisMonday);
    let totalDays = 7;
    if (range === 'next_week') {
        startMonday.setDate(thisMonday.getDate() + 7);
        totalDays = 7;
    } else if (range === 'this_month') {
        totalDays = 28; // 4 consecutive weeks
    }
    const out = [];
    for (let i = 0; i < totalDays; i++) {
        const d = new Date(startMonday);
        d.setDate(startMonday.getDate() + i);
        const wkIdx = i % 7;
        // 仅在 this_week 范围内的今天才高亮
        const sameDay =
            d.getFullYear() === today.getFullYear() &&
            d.getMonth() === today.getMonth() &&
            d.getDate() === today.getDate();
        out.push({
            day: WK[wkIdx],
            date: (d.getMonth() + 1) + '/' + d.getDate(),
            isToday: sameDay && (range === 'this_week'),
            // for month view grouping by week
            week_group: Math.floor(i / 7),
            week_group_name: range === 'this_month' ? `第${Math.floor(i / 7) + 1}周` : null
        });
    }
    return out;
}

export async function onRequestGet({ params, env, request }) {
    try {
        const userId = params.user_id || 'u_001';
        const url = new URL(request.url);
        const shuffle = url.searchParams.get('shuffle') === '1';
        const range = (url.searchParams.get('range') || 'this_week').toLowerCase();
        const validRange = ['this_week', 'next_week', 'this_month'].includes(range) ? range : 'this_week';
        const rangeLabel = validRange === 'this_week' ? '本周' : validRange === 'next_week' ? '下周' : '本月';

        // 1. 薄弱知识点（只保留题库中有题目的）
        const questions = await listTable(env, 'questions');
        const validKpIds = new Set(questions.map(q => q.knowledge_point_id).filter(Boolean));
        const kpList = await listTable(env, 'knowledge_points');
        let weakPoints = kpList.filter(k => k.mastery_rate < 0.7 && validKpIds.has(k.id));
        weakPoints.sort((a, b) => b.score_gain - a.score_gain);

        // shuffle 打乱
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

        // 2. 近期学习记录
        const learningRecords = await listTable(env, 'learning_records');
        const learnedKpIds = new Set(learningRecords
            .filter(r => r.user_id === userId)
            .map(r => r.knowledge_point_id));

        // 3. 学科配色
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
            day: wd.day,
            date: wd.date,
            isToday: !!wd.isToday,
            week_group: wd.week_group,
            week_group_name: wd.week_group_name,
            tasks: []
        }));
        const totalDays = planDays.length;
        const startOffset = shuffle ? Math.floor(Math.random() * Math.min(7, totalDays)) : 0;

        if (weakPoints.length === 0) {
            planDays.forEach((d, idx) => {
                const wkIdx = idx % 7;
                d.tasks.push({
                    subject: '综合', color: 'purple',
                    point: wkIdx === 5 ? '理科综合模拟' : (wkIdx === 6 ? '错题回顾与总结' : '综合能力训练'),
                    time: wkIdx >= 5 ? '90min' : '40min',
                    done: false
                });
            });
        } else {
            weakPoints.forEach((kp, idx) => {
                const dayIdx = (idx + startOffset) % totalDays;
                const isDone = validRange === 'this_week' && learnedKpIds.has(kp.id);
                const baseMin = 20 + Math.round((kp.score_gain || 5) * 1.5);
                const timeVar = shuffle ? (Math.random() > 0.5 ? 5 : -5) : 0;
                planDays[dayIdx].tasks.push({
                    subject: kp.subject,
                    color: subjectConfig[kp.subject] || 'blue',
                    point: kp.name,
                    time: Math.max(15, baseMin + timeVar) + 'min',
                    done: isDone
                });
            });
            // 每周的周六/周日安排综合模拟和错题回顾（本月视图 4 周都安排）
            for (let w = 0; w < Math.ceil(totalDays / 7); w++) {
                const satIdx = w * 7 + 5;
                const sunIdx = w * 7 + 6;
                if (satIdx < totalDays && planDays[satIdx].tasks.length < 2) {
                    planDays[satIdx].tasks.push({ subject: '综合', color: 'purple', point: '理科综合模拟', time: '90min', done: false });
                }
                if (sunIdx < totalDays && planDays[sunIdx].tasks.length < 2) {
                    planDays[sunIdx].tasks.push({ subject: '综合', color: 'orange', point: '错题回顾与总结', time: '60min', done: false });
                }
            }
        }

        // 6. 统计
        const allTasks = planDays.reduce((arr, d) => arr.concat(d.tasks), []);
        const doneCount = allTasks.filter(t => t.done).length;

        return Response.json({
            code: 0,
            data: {
                week_plan: planDays,
                total_tasks: allTasks.length,
                done_tasks: doneCount,
                estimated_score_gain: weakPoints.reduce((s, k) => s + (k.score_gain || 0), 0),
                weak_point_count: weakPoints.length,
                replanned: shuffle,
                range: validRange,
                range_label: rangeLabel
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: 'week-plan 失败: ' + e.message }, { status: 500 });
    }
}
