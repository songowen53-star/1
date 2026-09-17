// POST /api/ai/engine/:user_id/refresh — 手动触发飞轮一轮：重新计算知识点掌握度
// 对应后端：backend/routes/ai-engine.js POST /:user_id/refresh
// 读取 knowledge_points + answer_records，重新计算每个知识点的 mastery_rate，写回 KV
import { listTable } from '../../../../_shared/kv-db.js';

export async function onRequestPost({ params, env }) {
    try {
        const userId = params.user_id;
        const kps = await listTable(env, 'knowledge_points');
        const allAnswers = await listTable(env, 'answer_records');

        let updated = 0;
        kps.forEach((kp, idx) => {
            const records = allAnswers.filter(r =>
                r.user_id === userId && r.knowledge_point_id === kp.id
            );
            if (records.length === 0) return;

            const correctCount = records.filter(r => r.is_correct).length;
            const newMastery = correctCount / records.length;
            const oldMastery = kp.mastery_rate || 0;
            const smoothed = oldMastery * 0.3 + newMastery * 0.7;

            kps[idx] = {
                ...kp,
                mastery_rate: +smoothed.toFixed(3),
                last_practice_at: records[0].created_at,
                practice_count: records.length
            };
            updated++;
        });

        if (updated > 0) {
            await env.DATA_STORE.put('knowledge_points.json', JSON.stringify(kps, null, 2));
        }

        return Response.json({
            code: 0,
            data: {
                user_id: userId,
                knowledge_points_updated: updated,
                refreshed_at: new Date().toISOString()
            },
            msg: `飞轮已刷新，更新 ${updated} 个知识点掌握度`
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '飞轮刷新失败: ' + e.message }, { status: 500 });
    }
}
