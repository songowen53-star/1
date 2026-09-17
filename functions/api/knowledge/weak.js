// GET /api/knowledge/weak?threshold=0.6&limit=5 — 薄弱知识点列表（首页 AI今日提分：薄弱考点TopN + 提分收益）
import { listTable } from '../../_shared/kv-db.js';

export async function onRequestGet({ params, env, request }) {
    try {
        const url = new URL(request.url);
        const threshold = parseFloat(url.searchParams.get('threshold')) || 0.6;
        const limit = parseInt(url.searchParams.get('limit')) || 5;

        // 只返回题库中有真实题目的薄弱点，避免假推荐
        const questions = await listTable(env, 'questions');
        const validKpIds = new Set(questions.map(q => q.knowledge_point_id).filter(Boolean));

        const list = (await listTable(env, 'knowledge_points'))
            .filter(k => k.mastery_rate < threshold && validKpIds.has(k.id))
            .sort((a, b) => (b.score_gain || 0) - (a.score_gain || 0))
            .slice(0, limit);

        return Response.json({ code: 0, data: list });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载薄弱知识点失败: ' + e.message }, { status: 500 });
    }
}
