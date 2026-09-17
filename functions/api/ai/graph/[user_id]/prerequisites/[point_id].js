// GET /api/ai/graph/:user_id/prerequisites/:point_id — 前置依赖链
// 对应后端：backend/routes/ai-graph.js GET /:user_id/prerequisites/:point_id
import { listTable } from '../../../../../_shared/kv-db.js';

const KP_DEPENDENCIES = {
    'kp_math_002': ['kp_math_010', 'kp_math_011', 'kp_math_012'],
    'kp_math_001': ['kp_math_020'],
    'kp_phy_001': ['kp_phy_010', 'kp_phy_011']
};

function statusOf(mastery) {
    if (mastery >= 0.8) return 'green';
    if (mastery >= 0.5) return 'yellow';
    return 'red';
}

export async function onRequestGet({ params, env }) {
    try {
        const { user_id, point_id } = params;

        const allKps = await listTable(env, 'knowledge_points');
        const target = allKps.find(k => k.id === point_id);
        if (!target) return Response.json({ code: 1, msg: '知识点不存在' }, { status: 404 });

        // 递归获取前置链
        const chain = [];
        const visited = new Set();
        const collectPrereqs = (pid) => {
            if (visited.has(pid)) return;
            visited.add(pid);
            const prereqs = KP_DEPENDENCIES[pid] || [];
            prereqs.forEach(preId => {
                const kp = allKps.find(k => k.id === preId);
                if (kp) {
                    const mastery = kp.mastery_rate || 0;
                    chain.push({ id: kp.id, label: kp.name, mastery, status: statusOf(mastery) });
                    collectPrereqs(preId);
                }
            });
        };
        collectPrereqs(point_id);

        const targetMastery = target.mastery_rate || 0;
        const targetStatus = statusOf(targetMastery);

        const learningPath = chain.filter(c => c.status !== 'green').map(c => c.label);

        return Response.json({
            code: 0,
            data: {
                target: { id: target.id, label: target.name, mastery: targetMastery, status: targetStatus },
                chain: chain.length > 0 ? chain : [{ id: target.id, label: target.name, mastery: targetMastery, status: targetStatus }],
                learning_path: learningPath.length > 0
                    ? ['先复习' + learningPath.join(' → ') + ' → 再突破' + target.name]
                    : ['直接突破 ' + target.name]
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载前置依赖失败: ' + e.message }, { status: 500 });
    }
}
