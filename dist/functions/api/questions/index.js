// GET /api/questions — 题库列表（支持科目、考点、难度、题型、来源、数量筛选）
// 对应后端 backend/routes/questions.js 的 GET / 逻辑
import { listTable } from '../../_shared/kv-db.js';

// 学科名归一化：兼容"思想政治/政治/思政/道德与法治"
function normSubject(s) {
    if (!s) return s;
    if (/^思想?政治?$|^思政$|^道德与法治$/.test(s)) return '政治';
    return s;
}

export async function onRequestGet({ request, env }) {
    try {
        const url = new URL(request.url);
        const subject = url.searchParams.get('subject');
        const kpId = url.searchParams.get('knowledge_point_id');
        const difficulty = url.searchParams.get('difficulty');
        const type = url.searchParams.get('type');
        const source = url.searchParams.get('source');
        const countStr = url.searchParams.get('count') || url.searchParams.get('limit') || '0';

        let list = await listTable(env, 'questions');

        if (subject) {
            const nSub = normSubject(subject);
            list = list.filter(q => normSubject(q.subject) === nSub);
        }
        if (kpId) list = list.filter(q => q.knowledge_point_id === kpId);
        if (difficulty) {
            const d = parseInt(difficulty);
            list = list.filter(q => q.difficulty === d);
        }
        if (type) list = list.filter(q => q.type === type);
        if (source) {
            if (source === 'real_exam') {
                list = list.filter(q => q.source === 'real_exam');
            } else {
                list = list.filter(q => (q.source || 'other') === source);
            }
        }

        const total = list.length;
        const count = parseInt(countStr || '0', 10);
        if (count > 0 && count < list.length) {
            list = list.slice(0, count);
        }

        return Response.json({ code: 0, data: list, total });
    } catch (e) {
        return Response.json({ code: 1, msg: '题库查询失败: ' + e.message, data: [], total: 0 }, { status: 500 });
    }
}
