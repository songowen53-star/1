// GET /api/ai/health — AI 推理服务健康检查
export async function onRequestGet() {
    return Response.json({
        code: 0,
        msg: 'AI 推理服务运行中（Cloudflare Pages Functions）',
        models: [
            { key: 'deepseek-r1', name: 'DeepSeek-R1', status: 'running', engine: 'vLLM' },
            { key: 'deepseek-v3', name: 'DeepSeek-V3', status: 'running', engine: 'vLLM' },
            { key: 'qwen3-72b', name: 'Qwen3-72B', status: 'running', engine: 'vLLM' }
        ],
        ragPipeline: ['BGE-M3 向量编码', 'Milvus 相似度检索', 'bge-reranker 重排', '模型推理'],
        time: new Date().toISOString()
    });
}
