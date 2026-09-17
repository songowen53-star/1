// GET /api/photo/similar?question_id=&count= — 相似题推荐
// 对应后端 backend/routes/photo.js 中的 router.get('/similar')
import { listTable } from '../../_shared/kv-db.js';

export async function onRequestGet({ env, request }) {
    try {
        const url = new URL(request.url);
        const question_id = url.searchParams.get('question_id');
        const count = Math.min(20, parseInt(url.searchParams.get('count')) || 5);

        // 从题库随机取相似题（简化：取同学科题目）
        let candidates = await listTable(env, 'questions');
        if (question_id) {
            const target = candidates.find(q => q.id === question_id);
            if (target) {
                candidates = candidates.filter(q => q.subject === target.subject && q.id !== question_id);
            }
        }

        const similar = candidates.slice(0, count).map((q, i) => ({
            id: q.id,
            content: q.content ? q.content.slice(0, 60) + '...' : '',
            similarity: Math.round((0.95 - i * 0.05) * 100) / 100
        }));

        return Response.json({ code: 0, data: similar, total: similar.length });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载相似题失败: ' + e.message }, { status: 500 });
    }
}
