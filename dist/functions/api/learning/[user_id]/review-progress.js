// GET /api/learning/:user_id/review-progress — 各科复习进度（9大学科）
import { listTable } from '../../../_shared/kv-db.js';

export async function onRequestGet({ params, env }) {
    try {
        const userId = params.user_id || 'u_001';
        const allKps = await listTable(env, 'knowledge_points');
        const records = (await listTable(env, 'learning_records')).filter(r => r.user_id === userId);

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
            let percent = 0;
            if (kps.length > 0) {
                const avgMastery = kps.reduce((sum, k) => sum + (k.mastery_rate || 0), 0) / kps.length;
                percent = Math.round(avgMastery * 100);
            }
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

        return Response.json({ code: 0, data });
    } catch (e) {
        return Response.json({ code: 1, msg: 'review-progress 失败: ' + e.message }, { status: 500 });
    }
}
