// GET /api/ai/graph/:user_id?subject=数学 — 学生个人知识图谱
// 对应后端：backend/routes/ai-graph.js GET /:user_id
import { listTable } from '../../../../_shared/kv-db.js';

const KP_DEPENDENCIES = {
    'kp_math_002': ['kp_math_010', 'kp_math_011', 'kp_math_012'],
    'kp_math_001': ['kp_math_020'],
    'kp_phy_001': ['kp_phy_010', 'kp_phy_011']
};

function buildGraph(userKp) {
    const nodes = userKp.map(k => {
        const mastery = k.mastery_rate || 0;
        let status = 'red';
        if (mastery >= 0.8) status = 'green';
        else if (mastery >= 0.5) status = 'yellow';
        return {
            id: k.id,
            label: k.name,
            mastery,
            status,
            level: k.level || 1,
            subject: k.subject,
            score_gain: k.score_gain || 5
        };
    });

    const edges = [];
    Object.entries(KP_DEPENDENCIES).forEach(([target, prereqs]) => {
        prereqs.forEach(from => {
            if (nodes.find(n => n.id === from) && nodes.find(n => n.id === target)) {
                edges.push({ from, to: target, type: 'prerequisite' });
            }
        });
    });

    const summary = {
        total_points: nodes.length,
        mastered: nodes.filter(n => n.status === 'green').length,
        partial: nodes.filter(n => n.status === 'yellow').length,
        unmastered: nodes.filter(n => n.status === 'red').length
    };
    return { nodes, edges, summary };
}

export async function onRequestGet({ params, env, request }) {
    try {
        const userId = params.user_id;
        const url = new URL(request.url);
        const subject = url.searchParams.get('subject');

        let allKp = await listTable(env, 'knowledge_points');
        if (subject) allKp = allKp.filter(k => k.subject === subject);

        const userKp = allKp.filter(k => !k.user_id || k.user_id === userId);
        const { nodes, edges, summary } = buildGraph(userKp);

        return Response.json({
            code: 0,
            data: {
                user_id: userId,
                subject: subject || 'all',
                summary,
                nodes,
                edges
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载知识图谱失败: ' + e.message }, { status: 500 });
    }
}
