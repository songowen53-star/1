// GET /api/ai/models — AI 模型列表
// 对应后端：backend/routes/ai-models.js GET /
const MODELS = [
    {
        key: 'deepseek-r1', name: 'DeepSeek-R1', badge: '推理王', color: '#3B82F6', icon: 'fa-brain',
        role: '理科链式推理 (CoT)', license: 'MIT', engine: 'vLLM', status: 'running',
        strengths: ['数学', '物理', '化学', '生物'],
        avg_latency_ms: 2400, tokens_today: 12450
    },
    {
        key: 'deepseek-v3', name: 'DeepSeek-V3', badge: '通用王', color: '#10B981', icon: 'fa-comment-dots',
        role: '中文通用对话', license: 'MIT', engine: 'vLLM', status: 'running',
        strengths: ['语文', '英语', '政治', '历史', '地理'],
        avg_latency_ms: 1800, tokens_today: 8200
    },
    {
        key: 'qwen3-72b', name: 'Qwen3-72B', badge: '中文王', color: '#8B5CF6', icon: 'fa-book',
        role: '组卷/计划/解析生成', license: 'Apache-2.0', engine: 'vLLM', status: 'running',
        strengths: ['组卷', '学习计划', '错题分析', '个性化解析'],
        avg_latency_ms: 2100, tokens_today: 5600
    }
];

export async function onRequestGet() {
    return Response.json({ code: 0, data: MODELS });
}

export { MODELS };
