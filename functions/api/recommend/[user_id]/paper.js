// GET /api/recommend/:user_id/paper?count=15&subjects=数学,物理 — 智能组卷
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
        const count = parseInt(url.searchParams.get('count')) || 15;
        const subjects = url.searchParams.get('subjects') ? url.searchParams.get('subjects').split(',') : null;

        let weakPoints = (await listTable(env, 'knowledge_points')).filter(k => k.mastery_rate < 0.7);
        if (subjects) weakPoints = weakPoints.filter(k => subjects.includes(k.subject));
        weakPoints.sort((a, b) => b.score_gain - a.score_gain);

        const allQuestions = await listTable(env, 'questions');
        const answerRecords = await listTable(env, 'answer_records');
        const answeredSet = new Set(answerRecords.filter(r => r.user_id === userId).map(r => r.question_id));
        const paper = [];
        let totalScore = 0;
        const kpCoverage = new Set();

        weakPoints.forEach(kp => {
            const targetDifficulties = recommendDifficulty(kp.mastery_rate);
            let fresh = allQuestions.filter(q => q.knowledge_point_id === kp.id && !answeredSet.has(q.id));
            let reviewed = allQuestions.filter(q => q.knowledge_point_id === kp.id && answeredSet.has(q.id));
            const sortByDiff = arr => arr.sort((a, b) => {
                const aScore = targetDifficulties.indexOf(a.difficulty);
                const bScore = targetDifficulties.indexOf(b.difficulty);
                return (aScore === -1 ? 99 : aScore) - (bScore === -1 ? 99 : bScore);
            });
            sortByDiff(fresh);
            sortByDiff(reviewed);
            const candidates = fresh.concat(reviewed);
            candidates.slice(0, 2).forEach(q => {
                if (paper.length < count) {
                    paper.push(q);
                    totalScore += q.score || 0;
                    kpCoverage.add(kp.id);
                }
            });
        });

        const difficultyDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        paper.forEach(q => { difficultyDist[q.difficulty] = (difficultyDist[q.difficulty] || 0) + 1; });

        return Response.json({
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
    } catch (e) {
        return Response.json({ code: 1, msg: '智能组卷失败: ' + e.message }, { status: 500 });
    }
}
