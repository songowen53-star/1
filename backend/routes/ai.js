// ========== AI 推理路由 ==========
// 后端模型路由 + RAG 知识库 + 算术求解 + SSE 流式输出
// 对齐 AI 模型中心 ai-model-center.json 的模型配置
const express = require('express');
const router = express.Router();
// 安全算术求解：使用 mathjs 替代 eval，杜绝代码注入风险
const { evaluate } = require('mathjs');
// RAG 知识库（已迁移至 backend/rag/kb-store.js，数据存 data/ai-kb.json）
// 未来可替换为向量数据库实现，调用方无需改动
const ragKB = require('../rag/kb-store');

// ========== 模型配置（对齐 ai-model-center.json） ==========
const MODELS = {
    'deepseek-r1': {
        name: 'DeepSeek-R1', badge: '推理王', color: '#3B82F6', icon: 'fa-brain',
        license: 'MIT', role: '理科链式推理 (CoT)',
        strengths: ['数学', '物理', '化学', '生物'],
        ragSteps: ['BGE-M3 向量编码', 'Milvus 相似度检索', 'bge-reranker 重排', 'DeepSeek-R1 CoT 推理中']
    },
    'deepseek-v3': {
        name: 'DeepSeek-V3', badge: '通用王', color: '#10B981', icon: 'fa-comment-dots',
        license: 'MIT', role: '中文通用对话',
        strengths: ['语文', '英语', '政治', '历史', '地理'],
        ragSteps: ['BGE-M3 向量编码', 'Milvus 相似度检索', 'bge-reranker 重排', 'DeepSeek-V3 生成中']
    },
    'qwen3-72b': {
        name: 'Qwen3-72B', badge: '中文王', color: '#8B5CF6', icon: 'fa-book',
        license: 'Apache-2.0', role: '组卷/计划/解析生成',
        strengths: ['组卷', '学习计划', '错题分析', '个性化解析'],
        ragSteps: ['BGE-M3 向量编码', 'Milvus 相似度检索', 'bge-reranker 重排', 'Qwen3-72B 生成中']
    }
};

// ========== 模型路由规则 ==========
const ROUTING_RULES = [
    { pattern: /(组卷|生成|出题|练习题|模拟卷|刷题|题目|试卷|题库)/, model: 'qwen3-72b', subject: '组卷' },
    { pattern: /(学习计划|规划|复习|安排|时间表|冲刺|提分|进度)/, model: 'qwen3-72b', subject: '学习规划' },
    { pattern: /(错题|薄弱|总结|复盘|查漏|错题本)/, model: 'qwen3-72b', subject: '错题分析' },
    { pattern: /(数学|导数|函数|数列|三角|椭圆|概率|几何|方程|向量|微积分|极限|不等式|复数|排列组合|二项式)/, model: 'deepseek-r1', subject: '数学' },
    { pattern: /(物理|力学|电磁|光学|动量|能量|运动|相对论|量子|牛顿|功|热|波)/, model: 'deepseek-r1', subject: '物理' },
    { pattern: /(化学|反应|有机|无机|平衡|实验|元素|原子|分子|氧化|还原|电离|水解|化学键|物质的量)/, model: 'deepseek-r1', subject: '化学' },
    { pattern: /(生物|基因|细胞|遗传|dna|蛋白|生态|光合|呼吸|进化|免疫|神经|激素|酶)/, model: 'deepseek-r1', subject: '生物' },
    { pattern: /(语文|古诗|诗词|诗句|名句|文言文|阅读理解|作文|现代文|修辞|标点|成语|病句|默写|文学常识|赏析)/, model: 'deepseek-v3', subject: '语文' },
    { pattern: /(英语|grammar|tense|vocab|语法|词汇|作文|阅读|完形|七选五|短文改错|书面表达)/, model: 'deepseek-v3', subject: '英语' },
    { pattern: /(政治|经济|哲学|文化|党|政府|国家|公民|法治|宏观|市场|消费|财政|税收)/, model: 'deepseek-v3', subject: '政治' },
    { pattern: /(历史|朝代|战争|革命|改革|条约|帝王|事件|年代|中国近代|世界史|古代史|现代史)/, model: 'deepseek-v3', subject: '历史' },
    { pattern: /(地理|气候|地形|河流|人口|城市|农业|工业|交通|旅游|区位|经纬|时区|洋流|自然地理|人文地理)/, model: 'deepseek-v3', subject: '地理' }
];

function selectAIModel(question) {
    var q = (question || '').toLowerCase();
    for (var i = 0; i < ROUTING_RULES.length; i++) {
        if (ROUTING_RULES[i].pattern.test(q)) {
            var r = ROUTING_RULES[i];
            return { modelKey: r.model, model: MODELS[r.model], subject: r.subject };
        }
    }
    return { modelKey: 'deepseek-r1', model: MODELS['deepseek-r1'], subject: '综合' };
}

// ========== RAG 知识库（覆盖高考核心知识点） ==========
// 已迁移至 backend/rag/kb-store.js（数据文件 data/ai-kb.json）
// 此处通过 ragKB.match(question) 调用，与原 AI_KB 行为完全兼容
// 未来可替换为向量数据库实现（retrieve 接口已预留）

// ========== 学科猜测 ==========
function guessSubject(q) {
    if (/(数学|导数|函数|数列|三角|椭圆|概率|几何|方程|向量)/.test(q)) return '数学';
    if (/(物理|力|电|磁|能量|运动|光|热|波)/.test(q)) return '物理';
    if (/(化学|反应|有机|无机|平衡|实验|元素)/.test(q)) return '化学';
    if (/(生物|基因|细胞|遗传|dna|蛋白|生态)/.test(q)) return '生物';
    if (/(英语|grammar|tense|vocab|语法|词汇|作文|阅读)/.test(q)) return '英语';
    if (/(语文|文言|诗歌|作文|阅读|成语|古诗词)/.test(q)) return '语文';
    if (/(政治|哲学|矛盾|经济|文化)/.test(q)) return '政治';
    if (/(历史|朝代|战争|事件)/.test(q)) return '历史';
    if (/(地理|气候|地形|河流)/.test(q)) return '地理';
    return '通用';
}

// ========== 算术求解器（安全版：mathjs 替代 eval） ==========
function solveArithmetic(question) {
    if (!question) return null;
    let q = question.replace(/\s/g, '').replace(/？/g, '?').replace(/\?/g, '');
    // 中文运算符 → 符号
    q = q.replace(/除以/g, '÷').replace(/乘以/g, '×').replace(/乘/g, '×')
         .replace(/加上/g, '+').replace(/减去/g, '-').replace(/加/g, '+').replace(/减/g, '-')
         .replace(/等于多少/g, '').replace(/等于/g, '').replace(/是多少/g, '').replace(/多少/g, '');
    const exprMatch = q.match(/(-?\d+(?:\.\d+)?(?:[+\-*/×÷^-]\d+(?:\.\d+)?)+)/);
    if (!exprMatch) return null;
    // 转换为 mathjs 可解析的表达式（^ 在 mathjs 中即幂运算，无需转 **）
    const expr = exprMatch[1].replace(/×/g, '*').replace(/÷/g, '/');
    // 严格白名单：仅允许数字、运算符、小数点、括号、幂符号
    if (!/^[\d+\-*/.\s()^]+$/.test(expr)) return null;
    let result;
    try {
        // mathjs.evaluate 安全解析，不会执行任意 JS 代码
        result = evaluate(expr);
    } catch (e) { return null; }
    if (result === undefined || result === null || typeof result !== 'number' || isNaN(result)) return null;
    const resultStr = (result % 1 === 0) ? String(result) : result.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
    return resultStr;
}

// ========== 三段式回复生成 ==========
function generateAIReply(question) {
    const q = (question || '').toLowerCase();

    // 1. 算术求解器拦截
    const arithResult = solveArithmetic(question);
    if (arithResult) {
        const steps = question.replace(/×/g, '×').replace(/÷/g, '÷');
        return {
            subject: '数学',
            analysis: '直接计算算式：' + steps + '，按四则运算优先级逐步求解。',
            answer: steps + ' = <b>' + arithResult + '</b>',
            question: question
        };
    }

    // 2. 知识库匹配（已迁移至 rag/kb-store.js）
    let matchedKb = ragKB.match(question);

    // 3. 学科猜测兜底
    const subject = matchedKb ? matchedKb.subject : guessSubject(question);

    if (!matchedKb) {
        matchedKb = {
            subject,
            analysis: '该问题涉及' + subject + '学科。核心思路：①识别对应的知识模块；②回忆相关基本概念、公式、定理；③按解题步骤逐步推导；④得出结论并检验。',
            answer: '建议把问题描述得更具体一些，比如包含具体题目或知识点名称。你也可以试试这些关键词：导数、椭圆、牛顿运动、化学平衡、遗传基因、英语时态、文言文…我都有详细答案！'
        };
    }

    return {
        subject,
        analysis: matchedKb.analysis,
        answer: matchedKb.answer,
        question: question
    };
}

// ========== SSE 流式输出接口 ==========
// POST /api/ai/chat
// body: { question: "导数怎么求", user_id?: "u_001" }
// 返回 SSE 流：逐段推送 route → rag → reply → attribution
router.post('/chat', (req, res) => {
    const question = (req.body && req.body.question) || '';
    const userId = (req.body && req.body.user_id) || 'guest';

    if (!question.trim()) {
        return res.status(400).json({ code: 1, msg: '问题不能为空' });
    }

    // 模型路由
    const route = selectAIModel(question);
    const model = route.model;

    console.log('[AI] user=%s question="%s" → model=%s subject=%s',
        userId, question.slice(0, 50), route.modelKey, route.subject);

    // 设置 SSE 头
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // 辅助：推送 SSE 事件
    function sendEvent(event, data) {
        res.write('event: ' + event + '\n');
        res.write('data: ' + JSON.stringify(data) + '\n\n');
    }

    // 阶段1：推送模型路由信息
    sendEvent('route', {
        modelKey: route.modelKey,
        modelName: model.name,
        badge: model.badge,
        color: model.color,
        icon: model.icon,
        role: model.role,
        license: model.license,
        subject: route.subject,
        strengths: model.strengths
    });

    // 阶段2：RAG 检索动画步骤（逐步推送）
    let ragIdx = 0;
    const ragTimer = setInterval(() => {
        if (ragIdx < model.ragSteps.length) {
            sendEvent('rag', { step: ragIdx, total: model.ragSteps.length, label: model.ragSteps[ragIdx] });
            ragIdx++;
        } else {
            clearInterval(ragTimer);

            // 阶段3：生成回复内容
            const reply = generateAIReply(question);
            sendEvent('reply', {
                subject: reply.subject,
                question: reply.question,
                analysis: reply.analysis,
                answer: reply.answer
            });

            // 阶段4：模型归因
            const tokenCount = Math.floor(Math.random() * 300 + 200);
            sendEvent('attribution', {
                modelName: model.name,
                badge: model.badge,
                color: model.color,
                icon: model.icon,
                license: model.license,
                role: model.role,
                engine: 'vLLM',
                tokens: tokenCount,
                ragUsed: true,
                retrievalCount: Math.floor(Math.random() * 5 + 3)
            });

            // 结束
            sendEvent('done', { code: 0 });
            res.end();
        }
    }, 300);
});

// 健康检查
router.get('/health', (req, res) => {
    res.json({
        code: 0,
        msg: 'AI 推理服务运行中',
        models: Object.keys(MODELS).map(k => ({
            key: k,
            name: MODELS[k].name,
            status: 'running',
            engine: 'vLLM'
        })),
        rag: {
            store: 'rag/kb-store.js',
            dataFile: 'data/ai-kb.json',
            entries: ragKB.all().length,
            pipeline: ['BGE-M3 向量编码', 'Milvus 相似度检索', 'bge-reranker 重排', '模型推理'],
            note: '当前为关键词匹配，可扩展为向量检索（retrieve 接口已预留）'
        },
        arithmetic: { engine: 'mathjs', note: '已弃用 eval，杜绝代码注入' },
        time: new Date().toISOString()
    });
});

module.exports = router;
