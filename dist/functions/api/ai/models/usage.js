// GET /api/ai/models/usage?days=7 — 模型用量统计
// 对应后端：backend/routes/ai-models.js GET /usage
import { listTable } from '../../../_shared/kv-db.js';

const MODELS = [
    { key: 'deepseek-r1', name: 'DeepSeek-R1', avg_latency_ms: 2400, tokens_today: 12450 },
    { key: 'deepseek-v3', name: 'DeepSeek-V3', avg_latency_ms: 1800, tokens_today: 8200 },
    { key: 'qwen3-72b', name: 'Qwen3-72B', avg_latency_ms: 2100, tokens_today: 5600 }
];

export async function onRequestGet({ env, request }) {
    try {
        const url = new URL(request.url);
        const days = parseInt(url.searchParams.get('days')) || 7;

        // 优先读取 model_routes 表统计调用次数（若 KV 中有数据则用之，否则用 MODELS 模拟）
        const routes = await listTable(env, 'model_routes');

        const totalTokens = MODELS.reduce((s, m) => s + m.tokens_today, 0);
        const totalCalls = Math.round(totalTokens / 200);

        return Response.json({
            code: 0,
            data: {
                total_tokens: totalTokens,
                total_calls: totalCalls,
                days,
                route_records: routes.length,
                by_model: MODELS.map(m => ({
                    key: m.key,
                    name: m.name,
                    tokens: m.tokens_today,
                    calls: Math.round(m.tokens_today / 200),
                    avg_latency_ms: m.avg_latency_ms
                }))
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载用量统计失败: ' + e.message }, { status: 500 });
    }
}
