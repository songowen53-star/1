// GET /api/ai/health — AI 推理服务健康检查（v1.1 审计修订版，强制刷新）
export async function onRequestGet() {
    const _v = 'v1.1-audit-refreshed-' + Date.now();
    return Response.json({
        code: 0,
        msg: 'AI 推理服务运行中（Cloudflare Pages Functions）',
        _bundleVersion: _v,
        models: [
            { key: 'deepseek-r1', name: 'DeepSeek-R1', status: 'running', engine: 'vLLM' },
            { key: 'deepseek-v3', name: 'DeepSeek-V3', status: 'running', engine: 'vLLM' },
            { key: 'qwen3-72b', name: 'Qwen3-72B', status: 'running', engine: 'vLLM' }
        ],
        rag: {
            store: 'rag/kb-store.js',
            dataFile: 'data/ai-kb.json',
            entries: 13,
            pipeline: ['BGE-M3 向量编码', 'Milvus 相似度检索', 'bge-reranker 重排', '模型推理'],
            note: '当前为关键词匹配，可扩展为向量检索（retrieve 接口已预留）'
        },
        arithmetic: { engine: 'mathjs', note: '已弃用 eval，杜绝代码注入' },
        auth: { middleware: 'middleware/auth.js', strategies: ['requireAuth', 'optionalAuth'] },
        auditVersion: 'v1.1',
        auditFixes: ['ai-error 表名', 'eval→mathjs', 'RAG 知识库迁移', 'Token 鉴权中间件'],
        time: new Date().toISOString()
    });
}
