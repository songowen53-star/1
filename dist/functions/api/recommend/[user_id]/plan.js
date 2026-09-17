// GET /api/recommend/:user_id/plan?available_minutes=120&shuffle=1 — 每日学习计划
import { listTable } from '../../../_shared/kv-db.js';

function recommendDifficulty(masteryRate) {
    if (masteryRate < 0.4) return [1, 2, 3];
    if (masteryRate < 0.6) return [2, 3, 4];
    if (masteryRate < 0.8) return [3, 4, 5];
    return [4, 5];
}

export async function onRequestGet({ params, env, request }) {
    try {
        const userId = params.user_id || 'u_001';
        const url = new URL(request.url);
        const availableMin = parseInt(url.searchParams.get('available_minutes')) || 120;
        const shuffle = url.searchParams.get('shuffle') === '1';

        const questions = await listTable(env, 'questions');
        const validKpIds = new Set(questions.map(q => q.knowledge_point_id).filter(Boolean));

        let weakPoints = (await listTable(env, 'knowledge_points'))
            .filter(k => k.mastery_rate < 0.7 && validKpIds.has(k.id));
        weakPoints.sort((a, b) => b.score_gain - a.score_gain);
        weakPoints = weakPoints.slice(0, 6);

        const totalGain = weakPoints.reduce((s, k) => s + k.score_gain, 0) || 1;
        const plan = [];
        let usedMin = 0;

        if (shuffle && weakPoints.length > 1) {
            for (let i = weakPoints.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [weakPoints[i], weakPoints[j]] = [weakPoints[j], weakPoints[i]];
            }
        }

        weakPoints.forEach((kp, idx) => {
            if (usedMin >= availableMin) return;
            const baseAlloc = Math.round(availableMin * kp.score_gain / totalGain);
            const timeVar = shuffle ? (Math.random() > 0.5 ? 5 : -5) : 0;
            const allocMin = Math.min(availableMin - usedMin, Math.max(15, baseAlloc + timeVar));
            const targetDifficulties = recommendDifficulty(kp.mastery_rate);
            const kpQuestions = questions
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
                question_count: kpQuestions.length,
                question_ids: kpQuestions.map(q => q.id),
                difficulty: targetDifficulties[0],
                strategy: kp.mastery_rate < 0.4 ? '基础巩固' : (kp.mastery_rate < 0.6 ? '专项强化' : '提升突破')
            });
            usedMin += allocMin;
        });

        if (shuffle && plan.length > 1) {
            for (let i = plan.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [plan[i], plan[j]] = [plan[j], plan[i]];
                plan[i].order = i + 1;
                plan[j].order = j + 1;
            }
        }

        return Response.json({
            code: 0,
            data: {
                total_minutes: usedMin,
                task_count: plan.length,
                estimated_score_gain: weakPoints.reduce((s, k) => s + k.score_gain, 0),
                replanned: shuffle,
                plan
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '生成学习计划失败: ' + e.message }, { status: 500 });
    }
}
