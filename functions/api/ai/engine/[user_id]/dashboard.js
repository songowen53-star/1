// GET /api/ai/engine/:user_id/dashboard?days=30 — 数据飞轮总览
// 对应后端：backend/routes/ai-engine.js GET /:user_id/dashboard
// 输入层(行为) → 分析层(知识状态+能力模型) → 输出层(推荐)
import { listTable } from '../../../../_shared/kv-db.js';

export async function onRequestGet({ params, env, request }) {
    try {
        const userId = params.user_id;
        const url = new URL(request.url);
        const days = Math.min(90, Math.max(1, parseInt(url.searchParams.get('days')) || 30));
        const since = new Date();
        since.setDate(since.getDate() - days);
        const sinceTime = since.getTime();
        const sinceStr = since.toISOString().slice(0, 10);

        // === 输入层：行为数据 ===
        const events = (await listTable(env, 'events')).filter(e => e.user_id === userId && new Date(e.ts || e.created_at).getTime() >= sinceTime);
        const answers = (await listTable(env, 'answer_records')).filter(r => r.user_id === userId && new Date(r.created_at).getTime() >= sinceTime);
        const learning = (await listTable(env, 'learning_records')).filter(r => r.user_id === userId && r.date >= sinceStr);
        const coachHistory = (await listTable(env, 'coach_history')).filter(c => c.user_id === userId && new Date(c.time || c.created_at).getTime() >= sinceTime);
        const qaHistory = (await listTable(env, 'qa_history')).filter(c => c.user_id === userId && new Date(c.time || c.created_at).getTime() >= sinceTime);
        const aiChats = coachHistory.concat(qaHistory);

        const answerCount = answers.length;
        const correctCount = answers.filter(a => a.is_correct).length;
        const correctRate = answerCount > 0 ? Math.round(correctCount / answerCount * 100) : 0;
        const learningDuration = learning.reduce((s, r) => s + (r.duration_min || 0), 0);

        // === 分析层 ①：知识状态 ===
        const allKps = await listTable(env, 'knowledge_points');
        const userKps = allKps.filter(k => k.user_id === userId || k.last_practice_at);
        const mastered = userKps.filter(k => (k.mastery_rate || 0) >= 0.8).length;
        const partial = userKps.filter(k => (k.mastery_rate || 0) >= 0.5 && (k.mastery_rate || 0) < 0.8).length;
        const unmastered = userKps.filter(k => (k.mastery_rate || 0) < 0.5).length;
        const avgMastery = userKps.length > 0
            ? +(userKps.reduce((s, k) => s + (k.mastery_rate || 0), 0) / userKps.length).toFixed(3)
            : 0;

        // === 分析层 ②：能力模型（按学科） ===
        const subjectConfig = ['数学', '语文', '英语', '物理', '化学', '生物', '思想政治', '历史', '地理'];
        const abilityModel = subjectConfig.map(subj => {
            const kps = allKps.filter(k => k.subject === subj);
            const subjAns = answers.filter(a => a.subject === subj);
            const subjCorrect = subjAns.filter(a => a.is_correct).length;
            const subjRate = subjAns.length > 0 ? Math.round(subjCorrect / subjAns.length * 100) : 0;
            const subjMastery = kps.length > 0
                ? Math.round(kps.reduce((s, k) => s + (k.mastery_rate || 0), 0) / kps.length * 100)
                : 0;
            return {
                subject: subj,
                mastery_rate: subjMastery,
                correct_rate: subjRate,
                question_count: subjAns.length,
                knowledge_points: kps.length
            };
        });

        // === 分析层 ③：推荐模型（基于薄弱点） ===
        const weakKps = allKps
            .filter(k => (k.mastery_rate || 0) < 0.7)
            .sort((a, b) => (b.score_gain || 0) - (a.score_gain || 0))
            .slice(0, 5)
            .map(k => ({
                id: k.id,
                name: k.name,
                subject: k.subject,
                mastery: +(k.mastery_rate || 0).toFixed(2),
                score_gain: k.score_gain || 0
            }));

        return Response.json({
            code: 0,
            data: {
                user_id: userId,
                days,
                inputs: {
                    events: events.length,
                    answers: answerCount,
                    correct_rate: correctRate,
                    learning_min: learningDuration,
                    ai_chats: aiChats.length
                },
                knowledge_state: {
                    total: userKps.length,
                    mastered, partial, unmastered,
                    avg_mastery: avgMastery
                },
                ability_model: abilityModel,
                recommendation: {
                    weak_points: weakKps,
                    total_weak: allKps.filter(k => (k.mastery_rate || 0) < 0.7).length
                },
                flywheel: {
                    active: answerCount > 0,
                    last_answer_at: answers.length > 0 ? answers[0].created_at : null,
                    knowledge_updated: userKps.filter(k => k.last_practice_at).length > 0,
                    loop_running: answerCount > 0 && userKps.filter(k => k.last_practice_at).length > 0
                }
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载飞轮总览失败: ' + e.message }, { status: 500 });
    }
}
