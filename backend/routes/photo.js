// ========== 拍照搜题路由 ==========
// 拍照 OCR → AI 解析 → 相似题 → 视频讲解
// 对应原型：photo-ocr / photo-parse / photo-similar / photo-video
const express = require('express');
const router = express.Router();
const db = require('../db');

// 学科猜测（简化版）
function guessSubjectByText(content) {
    if (/(函数|导数|方程|几何|概率|数列)/.test(content)) return '数学';
    if (/(力|电|磁|运动|能量)/.test(content)) return '物理';
    if (/(反应|化学|有机|平衡)/.test(content)) return '化学';
    if (/(基因|细胞|遗传|生物)/.test(content)) return '生物';
    if (/(翻译|语法|英语|grammar)/.test(content)) return '英语';
    if (/(文言|古诗|语文|阅读)/.test(content)) return '语文';
    return '通用';
}

// POST /api/photo/ocr
// 拍照 OCR 识别
router.post('/ocr', (req, res) => {
    const { image_base64, user_id } = req.body || {};
    if (!image_base64) return res.status(400).json({ code: 1, msg: 'image_base64 必填' });

    // 模拟 OCR 识别结果
    const sampleContent = '已知函数 f(x) = ln x - ax，讨论 f(x) 的单调性';
    const subject = guessSubjectByText(sampleContent);
    const ocrId = 'ocr_' + Date.now();

    const record = db.insert('ocr_records', {
        ocr_id: ocrId,
        user_id: user_id || 'guest',
        subject,
        confidence: 0.96,
        content: sampleContent,
        formulas: [{ latex: 'f(x) = \\ln x - ax', bbox: [120, 80, 280, 120] }],
        images: [],
        time: new Date().toISOString()
    });

    res.json({
        code: 0,
        data: {
            ocr_id: ocrId,
            subject,
            confidence: 0.96,
            content: sampleContent,
            formulas: [{ latex: 'f(x) = \\ln x - ax', bbox: [120, 80, 280, 120] }],
            images: []
        }
    });
});

// POST /api/photo/parse
// AI 解析题目（SSE 流式）
router.post('/parse', (req, res) => {
    const { ocr_id, user_id } = req.body || {};
    if (!ocr_id) return res.status(400).json({ code: 1, msg: 'ocr_id 必填' });

    const ocr = db.list('ocr_records').find(r => r.ocr_id === ocr_id);
    if (!ocr) return res.status(404).json({ code: 1, msg: 'OCR 记录不存在' });

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    function sendEvent(event, data) {
        res.write('event: ' + event + '\n');
        res.write('data: ' + JSON.stringify(data) + '\n\n');
    }

    sendEvent('route', { modelKey: 'deepseek-r1', role: '数学推理' });

    setTimeout(() => {
        const analysis = '对数函数 ln x 定义域 x>0，对 f(x) 求导得 f\'(x) = 1/x - a。讨论 f\'(x) 符号判断单调性。';
        const answer = 'a≥0 时，f(x) 在 (0,1/a] 单调递增，在 [1/a,+∞) 单调递减；a<0 时，f(x) 在 (0,+∞) 单调递增。';

        sendEvent('reply', { analysis, answer });

        // 保存解析记录
        db.insert('photo_parse_records', {
            ocr_id,
            user_id: user_id || 'guest',
            analysis,
            answer,
            model: 'deepseek-r1',
            time: new Date().toISOString()
        });

        sendEvent('done', { code: 0 });
        res.end();
    }, 800);
});

// GET /api/photo/similar
// 相似题推荐
router.get('/similar', (req, res) => {
    const { question_id } = req.query;
    const count = Math.min(20, parseInt(req.query.count) || 5);

    // 从题库随机取相似题（简化：取同学科题目）
    let candidates = db.list('questions');
    if (question_id) {
        const target = db.findById('questions', question_id);
        if (target) {
            candidates = candidates.filter(q => q.subject === target.subject && q.id !== question_id);
        }
    }

    const similar = candidates.slice(0, count).map((q, i) => ({
        id: q.id,
        content: q.content ? q.content.slice(0, 60) + '...' : '',
        similarity: Math.round((0.95 - i * 0.05) * 100) / 100
    }));

    res.json({ code: 0, data: similar, total: similar.length });
});

// GET /api/photo/video
// 视频讲解
router.get('/video', (req, res) => {
    const { question_id } = req.query;
    if (!question_id) return res.status(400).json({ code: 1, msg: 'question_id 必填' });

    res.json({
        code: 0,
        data: {
            video_url: 'https://cdn.example.com/videos/' + question_id + '_explain.mp4',
            duration_sec: 180,
            chapters: [
                { time: 0, title: '审题' },
                { time: 30, title: '求导' },
                { time: 90, title: '讨论单调性' }
            ]
        }
    });
});

// GET /api/photo/:user_id/history
// 搜题历史
router.get('/:user_id/history', (req, res) => {
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const list = db.list('ocr_records')
        .filter(r => r.user_id === req.params.user_id)
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
        .slice(0, limit)
        .map(r => ({
            ocr_id: r.ocr_id,
            subject: r.subject,
            content: r.content ? r.content.slice(0, 40) + '...' : '',
            time: r.time,
            confidence: r.confidence
        }));

    res.json({ code: 0, data: list, total: list.length });
});

module.exports = router;
