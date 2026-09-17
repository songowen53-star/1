// GET /api/learning/:user_id/duration-stats — 学习时长统计
import { listTable } from '../../../_shared/kv-db.js';

export async function onRequestGet({ params, env }) {
    try {
        const userId = params.user_id || 'u_001';
        const allRecords = (await listTable(env, 'learning_records')).filter(r => r.user_id === userId);

        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);

        const fmt = (d) => d.toISOString().slice(0, 10);
        const getWeekStart = (d) => {
            const x = new Date(d);
            const day = (x.getDay() + 6) % 7; // 周一=0
            x.setDate(x.getDate() - day);
            x.setHours(0, 0, 0, 0);
            return x;
        };
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

        const prevSameDay = new Date(now);
        prevSameDay.setDate(prevSameDay.getDate() - 7);
        const prevSameDayStr = fmt(prevSameDay);
        const prevTodayMin = sumMin(allRecords.filter(r => r.date === prevSameDayStr));
        const todayChange = prevTodayMin > 0 ? Math.round((todayMin - prevTodayMin) / prevTodayMin * 100) : (todayMin > 0 ? 100 : 0);

        const dailyGoalMin = 360;
        const todayGoalRate = dailyGoalMin > 0 ? Math.min(100, Math.round(todayMin / dailyGoalMin * 100)) : 0;

        // 本周
        const weekRecords = allRecords.filter(r => inRange(r, weekStart, weekEnd));
        const prevWeekRecords = allRecords.filter(r => inRange(r, prevWeekStart, prevWeekEnd));
        const weekMin = sumMin(weekRecords);
        const prevWeekMin = sumMin(prevWeekRecords);
        const weekHours = +(weekMin / 60).toFixed(1);
        const weekChange = prevWeekMin > 0 ? Math.round((weekMin - prevWeekMin) / prevWeekMin * 100) : (weekMin > 0 ? 100 : 0);

        // 本月
        const monthRecords = allRecords.filter(r => inRange(r, monthStart, monthEnd));
        const prevMonthRecords = allRecords.filter(r => inRange(r, prevMonthStart, prevMonthEnd));
        const monthMin = sumMin(monthRecords);
        const prevMonthMin = sumMin(prevMonthRecords);
        const monthHours = +(monthMin / 60).toFixed(1);
        const monthChange = prevMonthMin > 0 ? Math.round((monthMin - prevMonthMin) / prevMonthMin * 100) : (monthMin > 0 ? 100 : 0);

        // 本周每日分布
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
        const weekGoalHours = 42;
        const weekGoalMin = weekGoalHours * 60;
        const weekGoalRate = weekGoalMin > 0 ? Math.min(100, Math.round(weekMin / weekGoalMin * 100)) : 0;

        const elapsedDays = Math.max(1, ((now - weekStart) / (1000 * 60 * 60 * 24)));
        const avgHours = +(weekHours / Math.min(7, Math.ceil(elapsedDays))).toFixed(1);
        const prevAvgMin = prevWeekMin > 0 ? prevWeekMin / 7 : 0;
        const avgChange = prevAvgMin > 0 ? Math.round(((weekMin / Math.min(7, Math.ceil(elapsedDays))) - prevAvgMin) / prevAvgMin * 100) : (weekMin > 0 ? 100 : 0);

        // 各科
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

        // 热力图 7×24
        const heatmap = [];
        const hourCounts = [];
        let maxCount = 1;
        for (let i = 0; i < 7; i++) hourCounts.push(new Array(24).fill(0));
        allRecords.forEach(r => {
            let dt;
            try { dt = new Date(r.created_at || r.date); } catch (e) { return; }
            if (isNaN(dt.getTime())) return;
            const dow = (dt.getDay() + 6) % 7;
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
        const hourScore = new Array(24).fill(0);
        for (let i = 0; i < 7; i++) for (let h = 0; h < 24; h++) hourScore[h] += hourCounts[i][h];
        let peakStart = 19, peakEnd = 22, peakMax = 0;
        for (let h = 0; h < 24; h++) if (hourScore[h] > peakMax) { peakMax = hourScore[h]; peakStart = h; }
        peakEnd = Math.min(23, peakStart + 3);

        // AI 建议
        let advice = '';
        if (subjects.length === 0) {
            advice = '本周暂无学习记录，建议从薄弱科目开始，每日坚持学习2小时以上。';
        } else {
            const minSubject = subjects[subjects.length - 1];
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

        return Response.json({
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
                weekly,
                week_total_hours: weekHours,
                week_goal_hours: weekGoalHours,
                week_goal_rate: weekGoalRate,
                subjects,
                subject_total_hours: subjectTotalHours,
                heatmap,
                peak_start: peakStart,
                peak_end: peakEnd,
                advice
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: 'duration-stats 失败: ' + e.message }, { status: 500 });
    }
}
