// PUT /api/ai/models/:key/route — 更新模型路由规则
// 对应后端：backend/routes/ai-models.js PUT /:key/route
// body: { keywords, priority }，写入 model_routes 表
import { listTable } from '../../../../_shared/kv-db.js';

const MODELS = [
    { key: 'deepseek-r1', name: 'DeepSeek-R1' },
    { key: 'deepseek-v3', name: 'DeepSeek-V3' },
    { key: 'qwen3-72b', name: 'Qwen3-72B' }
];

export async function onRequestPut({ params, env, request }) {
    try {
        const { key } = params;
        const body = await request.json();
        const { keywords, priority } = body || {};

        const model = MODELS.find(m => m.key === key);
        if (!model) return Response.json({ code: 1013, msg: '模型 key 不存在' }, { status: 404 });

        const arr = await listTable(env, 'model_routes');
        const record = {
            id: `model_routes_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            model_key: key,
            model_name: model.name,
            keywords: keywords || [],
            priority: priority || 1,
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString()
        };
        arr.push(record);
        await env.DATA_STORE.put('model_routes.json', JSON.stringify(arr, null, 2));

        return Response.json({
            code: 0,
            data: record,
            msg: `模型 ${model.name} 路由规则已更新`
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '更新路由规则失败: ' + e.message }, { status: 500 });
    }
}
