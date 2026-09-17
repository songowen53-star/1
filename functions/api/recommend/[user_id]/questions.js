// GET /api/recommend/:user_id/questions?count=10&subject=数学 — 基于薄弱点的题目推荐
import { listTable } from '../../../_shared/kv-db.js';

function recommendDifficulty(masteryRate) {
    if (masteryRate < 0.4) return [1, 2, 3];
    if (masteryRate < 0.6) return [2, 3, 4];
    if (masteryRate < 0.8) return [3, 4, 5];
    return [4, 5];
}

function genReason(kp, q) {
    if (kp.mastery_rate < 0.4) {
        return `「${kp.name}」掌握率仅${Math.round(kp.mastery_rate * 100)}%，先巩固基础，预计可提${kp.score_gain}分`;
    } else if (kp.mastery_rate < 0.6) {
        return `「${kp.name}」掌握率${Math.round(kp.mastery_rate * 100)}%，中等难度强化，预计可提${kp.score_gain}分`;
    }
    return `「${kp.name}」接近掌握，挑战提升题，预计可提${kp.score_gain}分`;
}

export async function onRequestGet({ params, env, request }) {
    try {
        const userId = params.user_id || 'u_001';
        const url = new URL(request.url);
        const count = parseInt(url.searchParams.get('count')) || 10;
        const subjectFilter = url.searchParams.get('subject');

        const allQuestions = await listTable(env, 'questions');
        const validKpIds = new Set(allQuestions.map(q => q.knowledge_point_id).filter(Boolean));

        let weakPoints = (await listTable(env, 'knowledge_points'))
            .filter(k => k.mastery_rate < 0.7 && validKpIds.has(k.id));
        if (subjectFilter) weakPoints = weakPoints.filter(k => k.subject === subjectFilter);
        weakPoints.sort((a, b) => b.score_gain - a.score_gain);

        if (weakPoints.length === 0) {
            return Response.json({ code: 0, data: [], msg: '当前无薄弱知识点，可挑战综合题', strategy: 'maintain' });
        }

        const answerRecords = await listTable(env, 'answer_records');
        const answeredSet = new Set(answerRecords.filter(r => r.user_id === userId).map(r => r.question_id));
        const recommendations = [];
        const totalGain = weakPoints.reduce((s, k) => s + k.score_gain, 0);

        weakPoints.forEach(kp => {
            const allocCount = Math.max(1, Math.round(count * kp.score_gain / totalGain));
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
            let picked = fresh.slice(0, allocCount);
            if (picked.length < allocCount) {
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

        if (recommendations.length < count) {
            const usedIds = new Set(recommendations.map(r => r.id));
            for (const kp of weakPoints) {
                if (recommendations.length >= count) break;
                const kpQs = allQuestions.filter(q => q.knowledge_point_id === kp.id && !usedIds.has(q.id));
                for (const q of kpQs) {
                    if (recommendations.length >= count) break;
                    usedIds.add(q.id);
                    recommendations.push({
                        ...q,
                        knowledge_point_name: kp.name,
                        recommend_reason: genReason(kp, q),
                        priority: kp.priority || 'medium'
                    });
                }
            }
            if (recommendations.length < count) {
                const kpMap = {};
                (await listTable(env, 'knowledge_points')).forEach(k => { kpMap[k.id] = k; });
                const extra = allQuestions.filter(q => !usedIds.has(q.id)).slice(0, count - recommendations.length);
                extra.forEach(q => {
                    const kp = kpMap[q.knowledge_point_id];
                    recommendations.push({
                        ...q,
                        knowledge_point_name: kp ? kp.name : '',
                        recommend_reason: '综合能力训练',
                        priority: 'low'
                    });
                });
            }
        }

        return Response.json({
            code: 0,
            data: recommendations.slice(0, count),
            total: recommendations.length,
            strategy: 'weakness_adaptive',
            weak_points: weakPoints.slice(0, 5).map(k => ({ id: k.id, name: k.name, mastery_rate: k.mastery_rate, score_gain: k.score_gain }))
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '推荐题目失败: ' + e.message }, { status: 500 });
    }
}
