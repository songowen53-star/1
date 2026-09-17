// ========== AI 答疑路由 ==========
// 学生知识点问答 + 拍照提问 + 追问推荐
// 对应原型：ai-qa
const express = require('express');
const router = express.Router();
const db = require('../db');

// 复用 ai.js 的知识库与模型路由（简化版内联）
const QA_KB = [
    {
        keywords: ['椭圆', '双曲线', '区别', '圆锥曲线'],
        sections: [
            { title: '椭圆', title_color: '#10B981', content: '到两定点（焦点）距离之和为常数的点的轨迹。', formula: '|PF₁| + |PF₂| = 2a (2a > 2c)' },
            { title: '双曲线', title_color: '#EF4444', content: '到两定点（焦点）距离之差为常数的点的轨迹。', formula: '||PF₁| - |PF₂|| = 2a (2a < 2c)' }
        ],
        drawing: { icon: 'fa-draw-polygon', text: 'AI手绘图示：椭圆与双曲线几何对比' },
        follow_ups: ['能不能举个例子？', '这个知识点常考什么？', '出道题练练']
    },
    {
        keywords: ['导数', '单调性', '极值', '最值'],
        sections: [
            { title: '单调性判断', title_color: '#3B82F6', content: '求导 f\'(x)，令 f\'(x)>0 得增区间，f\'(x)<0 得减区间。', formula: "f'(x) > 0 → 递增" },
            { title: '极值求解', title_color: '#8B5CF6', content: '令 f\'(x)=0 解驻点，判断驻点两侧导数符号变化。', formula: 'f\'(x₀)=0 且两侧符号变化' }
        ],
        drawing: { icon: 'fa-chart-line', text: 'AI手绘函数图像：极值点示意' },
        follow_ups: ['求导公式有哪些？', '极值和最值的区别？', '出道导数题']
    }
];

const QA_FOLLOWUPS = ['能不能举个例子？', '这个知识点常考什么？', '出道题练练'];

function matchQA(question) {
    const q = (question || '').toLowerCase();
    for (const kb of QA_KB) {
        if (kb.keywords.some(k => q.indexOf(k.toLowerCase()) >= 0)) return kb;
    }
    // 兜底：通用回答
    return {
        sections: [
            { title: '通用解答', title_color: '#3B82F6', content: '该问题涉及高中知识点。建议把问题描述得更具体，包含具体的知识点名称或题目。', formula: '' }
        ],
        drawing: { icon: 'fa-lightbulb', text: 'AI提示：尝试用关键词提问，如"椭圆""导数""牛顿定律"' },
        follow_ups: QA_FOLLOWUPS
    };
}

// POST /api/ai/qa/ask
// 学生提问（SSE 流式）
router.post('/ask', (req, res) => {
    const { user_id, question, subject } = req.body || {};
    if (!question || !question.trim()) return res.status(400).json({ code: 1, msg: '问题不能为空' });

    // 设置 SSE
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    function sendEvent(event, data) {
        res.write('event: ' + event + '\n');
        res.write('data: ' + JSON.stringify(data) + '\n\n');
    }

    // 路由模型（简化：默认 qwen3-72b）
    sendEvent('route', { modelKey: 'qwen3-72b', badge: '中文王', role: 'RAG增强问答' });

    const matched = matchQA(question);

    // 模拟检索延迟
    setTimeout(() => {
        sendEvent('reply', {
            sections: matched.sections,
            drawing: matched.drawing,
            tokens: 342,
            latency_ms: 1850
        });

        sendEvent('follow_up', matched.follow_ups);

        // 保存历史
        db.insert('qa_history', {
            user_id: user_id || 'guest',
            question,
            subject: subject || '通用',
            answer_preview: matched.sections[0].content.slice(0, 50),
            tokens: 342,
            time: new Date().toISOString()
        });

        sendEvent('done', { code: 0 });
        res.end();
    }, 500);
});

// GET /api/ai/qa/:user_id/history
// 历史问答
router.get('/:user_id/history', (req, res) => {
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const list = db.list('qa_history')
        .filter(q => q.user_id === req.params.user_id)
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
        .slice(0, limit);

    res.json({ code: 0, data: list, total: list.length });
});

// GET /api/ai/qa/follow-ups?question_id=xxx
// 推荐追问
router.get('/follow-ups', (req, res) => {
    res.json({ code: 0, data: QA_FOLLOWUPS });
});

// POST /api/ai/qa/photo
// 拍照提问（转交 photo 模块，此处仅记录）
router.post('/photo', (req, res) => {
    const { user_id, image_base64 } = req.body || {};
    if (!image_base64) return res.status(400).json({ code: 1, msg: 'image_base64 必填' });

    const record = db.insert('qa_history', {
        user_id: user_id || 'guest',
        question: '[拍照提问]',
        subject: '待识别',
        answer_preview: '',
        tokens: 0,
        time: new Date().toISOString(),
        type: 'photo',
        status: 'pending_ocr'
    });

    res.json({
        code: 0,
        data: { qa_id: record.id, msg: '已收到图片，请调用 /api/photo/ocr 进行识别' }
    });
});

module.exports = router;
