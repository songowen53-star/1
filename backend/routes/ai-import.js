// ========== AI 自动入库路由 ==========
// PDF→OCR→公式→图片→LLM切题→JSON→审核→知识图谱→入库
// 对应原型：ai-auto-import / ai-auto-import-ocr / ai-auto-import-cut
const express = require('express');
const router = express.Router();
const db = require('../db');

// 9 步流程定义
const IMPORT_STEPS = [
    { num: 1, title: 'PDF上传', desc: '上传试卷文件' },
    { num: 2, title: 'OCR文字识别', desc: '识别全部文字内容' },
    { num: 3, title: '公式识别（LaTeX）', desc: '识别数学公式转为 LaTeX' },
    { num: 4, title: '图片识别与提取', desc: '识别图表/函数图像/几何图形' },
    { num: 5, title: 'LLM智能切题', desc: '识别独立题目，含题型/分值' },
    { num: 6, title: 'JSON结构化', desc: '题目/选项/答案/解析结构化' },
    { num: 7, title: 'AI审核校验', desc: '校验内容完整性、公式准确性' },
    { num: 8, title: '知识图谱标注', desc: '关联知识点节点，标注考点与难度' },
    { num: 9, title: '入库完成', desc: '写入题库数据库，建立索引' }
];

// POST /api/ai/import/start
// 启动自动入库流程
router.post('/start', (req, res) => {
    const { file_path, source, year, subject } = req.body || {};
    if (!file_path) return res.status(400).json({ code: 1, msg: 'file_path 必填' });

    const jobId = 'import_' + Date.now();
    const job = db.insert('import_jobs', {
        job_id: jobId,
        file_path,
        source: source || 'real_exam',
        year: year || null,
        subject: subject || '数学',
        total_steps: 9,
        current_step: 1,
        current_status: 'PDF上传',
        completed_steps: 0,
        progress_percent: 0,
        status: 'running',
        steps: IMPORT_STEPS.map((s, i) => ({
            ...s,
            status: i === 0 ? 'done' : 'locked',
            time: i === 0 ? '已完成' : '待处理',
            desc: s.desc
        })),
        created_at: new Date().toISOString()
    });

    // 模拟异步推进后续步骤（实际生产应接入 OCR/LLM 服务）
    setTimeout(() => {
        const updated = db.list('import_jobs').find(j => j.job_id === jobId);
        if (!updated) return;
        // 自动推进到第 7 步（AI审核校验）
        updated.steps.forEach((s, i) => {
            if (i < 6) { s.status = 'done'; s.time = '已完成'; }
            else if (i === 6) { s.status = 'active'; s.time = '进行中'; }
            else { s.status = 'locked'; s.time = '待处理'; }
        });
        updated.current_step = 7;
        updated.current_status = 'AI审核校验';
        updated.completed_steps = 6;
        updated.progress_percent = 67;
        db.update('import_jobs', updated.id, updated);
    }, 2000);

    res.json({
        code: 0,
        data: {
            job_id: jobId,
            total_steps: 9,
            current_step: 1,
            current_status: 'PDF上传',
            progress_percent: 0
        }
    });
});

// GET /api/ai/import/:job_id/status
// 查询流程进度
router.get('/:job_id/status', (req, res) => {
    const { job_id } = req.params;
    const job = db.list('import_jobs').find(j => j.job_id === job_id);
    if (!job) return res.status(404).json({ code: 1009, msg: '入库任务不存在' });

    res.json({
        code: 0,
        data: {
            job_id,
            current_step: job.current_step,
            current_status: job.current_status,
            completed_steps: job.completed_steps,
            total_steps: job.total_steps,
            progress_percent: job.progress_percent,
            steps: job.steps
        }
    });
});

// GET /api/ai/import/:job_id/ocr-detail
// OCR 识别详情
router.get('/:job_id/ocr-detail', (req, res) => {
    const { job_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const job = db.list('import_jobs').find(j => j.job_id === job_id);
    if (!job) return res.status(404).json({ code: 1009, msg: '入库任务不存在' });

    // 模拟 OCR 详情
    res.json({
        code: 0,
        data: {
            total_pages: 12,
            current_page: page,
            accuracy: 96.8,
            blocks: [
                { type: 'text', content: '已知函数 f(x) = x³ - 3x² + 2，求 f(x) 的极值。', confidence: 0.98 },
                { type: 'formula', content: "f'(x) = 3x² - 6x", latex: "f'(x) = 3x^2 - 6x", confidence: 0.95, need_review: false },
                { type: 'image', content: '函数图像', bbox: [120, 80, 280, 200], confidence: 0.89 }
            ],
            need_review_count: 3
        }
    });
});

// GET /api/ai/import/:job_id/cut-detail
// LLM 切题详情
router.get('/:job_id/cut-detail', (req, res) => {
    const { job_id } = req.params;
    const job = db.list('import_jobs').find(j => j.job_id === job_id);
    if (!job) return res.status(404).json({ code: 1009, msg: '入库任务不存在' });

    res.json({
        code: 0,
        data: {
            total_questions: 12,
            cut_questions: [
                { no: 1, type: '选择题', score: 5, difficulty: '简单', confidence: 0.98, content_preview: '已知集合 A={1,2,3}...' },
                { no: 5, type: '填空题', score: 5, difficulty: '困难', confidence: 0.92, content_preview: '设函数 f(x)=...' },
                { no: 10, type: '解答题', score: 12, difficulty: '困难', confidence: 0.95, content_preview: '已知椭圆 C...' }
            ],
            low_confidence_count: 1
        }
    });
});

// POST /api/ai/import/:job_id/review
// 提交审核结果
router.post('/:job_id/review', (req, res) => {
    const { job_id } = req.params;
    const { reviewer, decision, comments, adjustments } = req.body || {};
    const job = db.list('import_jobs').find(j => j.job_id === job_id);
    if (!job) return res.status(404).json({ code: 1009, msg: '入库任务不存在' });

    // 更新步骤状态：审核通过则推进到入库完成
    if (decision === 'approve') {
        job.steps.forEach((s, i) => {
            if (i < 9) { s.status = 'done'; s.time = '已完成'; }
        });
        job.current_step = 9;
        job.current_status = '入库完成';
        job.completed_steps = 9;
        job.progress_percent = 100;
        job.status = 'completed';
    } else if (decision === 'reject') {
        job.steps[6].status = 'active';
        job.steps[6].desc = '审核驳回：' + (comments || '需重新校验');
        job.status = 'rejected';
    }

    db.update('import_jobs', job.id, {
        steps: job.steps,
        current_step: job.current_step,
        current_status: job.current_status,
        completed_steps: job.completed_steps,
        progress_percent: job.progress_percent,
        status: job.status,
        reviewer,
        review_comments: comments,
        reviewed_at: new Date().toISOString()
    });

    res.json({
        code: 0,
        data: {
            job_id,
            decision,
            progress_percent: job.progress_percent,
            status: job.status,
            msg: decision === 'approve' ? '审核通过，已入库' : '审核驳回，需重新处理'
        }
    });
});

module.exports = router;
