// GET /api/learning/:user_id/subject-mastery?days=30 — 学科掌握率（能力雷达）
import { listTable } from '../../../_shared/kv-db.js';

export async function onRequestGet({ params, env, request }) {
    try {
        const url = new URL(request.url);
        const days = Math.min(180, Math.max(7, parseInt(url.searchParams.get('days')) || 30));
        const userId = params.user_id;

        const since = new Date();
        since.setDate(since.getDate() - days);
        const sinceStr = since.toISOString().slice(0, 10);

        const allKps = await listTable(env, 'knowledge_points');
        const records = (await listTable(env, 'learning_records')).filter(r => r.user_id === userId && r.date >= sinceStr);
        const answerRecords = (await listTable(env, 'answer_records')).filter(r => r.user_id === userId && new Date(r.created_at) >= since);

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
            const avgMastery = kps.length > 0
                ? Math.round(kps.reduce((sum, k) => sum + (k.mastery_rate || 0), 0) / kps.length * 100)
                : 0;
            const subRec = records.filter(r => r.subject === s.name);
            const subAns = answerRecords.filter(r => r.subject === s.name);
            const durationMin = subRec.reduce((a, r) => a + (r.duration_min || 0), 0);
            const totalQ = subRec.reduce((a, r) => a + (r.questions_count || 0), 0) + subAns.length;
            const ansCorrect = subAns.filter(a => a.is_correct).length + subRec.reduce((a, r) => a + (r.correct_count || 0), 0);
            const ansTotal = subAns.length + subRec.reduce((a, r) => a + (r.questions_count || 0), 0);
            const rate = ansTotal > 0 ? Math.round(ansCorrect / ansTotal * 100) : 0;
            const gap = s.target - avgMastery;
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

        const rank = [...radar].sort((a, b) => b.gap_pct - a.gap_pct);
        const weakest = rank.slice(0, 3).map(r => ({ subject: r.subject, color: r.color, gap: r.gap_pct, current: r.current_mastery, target: r.target_mastery }));
        const strongest = [...radar].sort((a, b) => a.gap_pct - b.gap_pct).slice(0, 2).map(r => ({ subject: r.subject, color: r.color, gap: r.gap_pct, current: r.current_mastery }));

        return Response.json({
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
    } catch (e) {
        return Response.json({ code: 1, msg: 'subject-mastery 失败: ' + e.message }, { status: 500 });
    }
}
