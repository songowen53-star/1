// ========== AI 模型中心扩展路由 ==========
// 模型列表 + 路由规则管理 + 用量统计
// 对应原型：ai-model-center
const express = require('express');
const router = express.Router();
const db = require('../db');

// 模型配置（对齐 ai.js 的 MODELS）
const MODELS = [
    {
        key: 'deepseek-r1',
        name: 'DeepSeek-R1',
        badge: '推理王',
        color: '#3B82F6',
        icon: 'fa-brain',
        role: '理科链式推理 (CoT)',
        license: 'MIT',
        engine: 'vLLM',
        status: 'running',
        strengths: ['数学', '物理', '化学', '生物'],
        avg_latency_ms: 2400,
        tokens_today: 12450
    },
    {
        key: 'deepseek-v3',
        name: 'DeepSeek-V3',
        badge: '通用王',
        color: '#10B981',
        icon: 'fa-comment-dots',
        role: '中文通用对话',
        license: 'MIT',
        engine: 'vLLM',
        status: 'running',
        strengths: ['语文', '英语', '政治', '历史', '地理'],
        avg_latency_ms: 1800,
        tokens_today: 8200
    },
    {
        key: 'qwen3-72b',
        name: 'Qwen3-72B',
        badge: '中文王',
        color: '#8B5CF6',
        icon: 'fa-book',
        role: '组卷/计划/解析生成',
        license: 'Apache-2.0',
        engine: 'vLLM',
        status: 'running',
        strengths: ['组卷', '学习计划', '错题分析', '个性化解析'],
        avg_latency_ms: 2100,
        tokens_today: 5600
    }
];

// GET /api/ai/models
// 模型列表
router.get('/', (req, res) => {
    res.json({ code: 0, data: MODELS });
});

// PUT /api/ai/models/:key/route
// 更新路由规则
router.put('/:key/route', (req, res) => {
    const { key } = req.params;
    const { keywords, priority } = req.body || {};

    const model = MODELS.find(m => m.key === key);
    if (!model) return res.status(404).json({ code: 1013, msg: '模型 key 不存在' });

    // 记录路由规则更新
    const record = db.insert('model_routes', {
        model_key: key,
        model_name: model.name,
        keywords: keywords || [],
        priority: priority || 1,
        updated_at: new Date().toISOString()
    });

    res.json({
        code: 0,
        data: record,
        msg: `模型 ${model.name} 路由规则已更新`
    });
});

// GET /api/ai/models/usage
// 用量统计
router.get('/usage', (req, res) => {
    const days = parseInt(req.query.days) || 7;

    // 基于 MODELS 的 tokens_today 模拟聚合
    const totalTokens = MODELS.reduce((s, m) => s + m.tokens_today, 0);
    const totalCalls = Math.round(totalTokens / 200);

    res.json({
        code: 0,
        data: {
            total_tokens: totalTokens,
            total_calls: totalCalls,
            days: days,
            by_model: MODELS.map(m => ({
                key: m.key,
                name: m.name,
                tokens: m.tokens_today,
                calls: Math.round(m.tokens_today / 200),
                avg_latency_ms: m.avg_latency_ms
            }))
        }
    });
});

module.exports = router;
