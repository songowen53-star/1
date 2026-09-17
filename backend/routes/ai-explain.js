// ========== AI 讲题引擎路由 ==========
// 分步讲解 + 理解度检测 + 动态调整下一步策略
// 对应原型：ai-module-explain / ai-explain
const express = require('express');
const router = express.Router();
const db = require('../db');

// 讲解步骤模板：根据题目知识点自动生成 5 步讲解
const STEP_TEMPLATES = [
    { title: '审题分析', desc: '识别题目关键条件、已知量与求解目标，明确考点所属知识模块。' },
    { title: '建立方程', desc: '将文字条件转化为数学表达式，建立等量关系或函数关系。' },
    { title: '方法应用', desc: '选择合适的方法（如韦达定理、求导、向量分解等）简化计算。' },
    { title: '求解过程', desc: '代入数据，逐步求解，注意运算顺序与符号处理。' },
    { title: '结论验证', desc: '检验答案是否符合题意与定义域，写出最终结论。' }
];

// POST /api/ai/explain/start
// 启动一道题的分步讲解
router.post('/start', (req, res) => {
    const { question_id, user_id, model } = req.body || {};
    if (!question_id) return res.status(400).json({ code: 1, msg: 'question_id 必填' });

    const question = db.findById('questions', question_id);
    if (!question) return res.status(404).json({ code: 1007, msg: '讲题会话不存在：题目未找到' });

    const sessionId = 'exp_' + Date.now() + '_' + (user_id || 'guest');
    const session = db.insert('explain_sessions', {
        session_id: sessionId,
        question_id,
        user_id: user_id || 'guest',
        subject: question.subject,
        total_steps: 5,
        current_step: 1,
        progress_percent: 0,
        status: 'active',
        model: model || 'deepseek-r1',
        steps: STEP_TEMPLATES.map((t, i) => ({
            num: i + 1,
            status: i === 0 ? 'active' : 'locked',
            title: t.title,
            desc: t.desc,
            time: '待开始',
            understood: null,
            feedback_count: 0
        })),
        estimated_min: 10
    });

    res.json({
        code: 0,
        data: {
            session_id: sessionId,
            question_id,
            total_steps: 5,
            current_step: 1,
            progress_percent: 0,
            estimated_min: 10,
            model: model || 'deepseek-r1',
            question_content: question.content
        }
    });
});

// GET /api/ai/explain/:session_id/step/:step_no
// 获取指定步骤讲解
router.get('/:session_id/step/:step_no', (req, res) => {
    const { session_id, step_no } = req.params;
    const num = parseInt(step_no);

    const session = db.list('explain_sessions').find(s => s.session_id === session_id);
    if (!session) return res.status(404).json({ code: 1007, msg: '讲题会话不存在' });
    if (num < 1 || num > session.total_steps) return res.status(400).json({ code: 1008, msg: '步骤号超出范围' });

    const step = session.steps[num - 1];
    // 生成理解度检测题
    const understandingChecks = [
        { question: '本题的关键条件是？', options: ['已知量+求解目标', '仅求解目标', '仅已知量', '都不对'] },
        { question: '本题的核心方法是？', options: ['定义法', '公式法', '分类讨论', '数形结合'] },
        { question: '下一步应先做什么？', options: ['代入数据', '简化表达式', '验证答案', '结束'] },
        { question: '答案是否合理？', options: ['合理', '过大', '过小', '无法判断'] },
        { question: '本题易错点是？', options: ['符号处理', '运算顺序', '定义域', '以上都是'] }
    ];
    const check = understandingChecks[num - 1] || understandingChecks[0];

    res.json({
        code: 0,
        data: {
            session_id,
            step_no: num,
            status: step.status,
            title: step.title,
            desc: step.desc,
            time: step.time,
            tokens: 200 + num * 30,
            model: session.model,
            understanding_check: check
        }
    });
});

// POST /api/ai/explain/:session_id/feedback
// 提交理解度反馈，AI 动态调整下一步策略
router.post('/:session_id/feedback', (req, res) => {
    const { session_id } = req.params;
    const { step_no, understood, answer, confidence } = req.body || {};
    const num = parseInt(step_no);

    const session = db.list('explain_sessions').find(s => s.session_id === session_id);
    if (!session) return res.status(404).json({ code: 1007, msg: '讲题会话不存在' });

    const step = session.steps[num - 1];
    if (!step) return res.status(400).json({ code: 1008, msg: '步骤号超出范围' });

    // 记录反馈
    step.understood = understood;
    step.feedback_count = (step.feedback_count || 0) + 1;
    step.status = 'done';
    step.time = '用时 ' + (1 + num) + 'min';

    // 策略决策
    let strategy = 'advance';
    let nextStep = num + 1;
    if (understood && answer === 'C') {
        strategy = 'advance';
    } else if (understood && answer !== 'C') {
        strategy = 're_explain';
        step.status = 'active'; // 重讲本步
        nextStep = num;
    } else if (!understood) {
        if (step.feedback_count >= 3) {
            strategy = 'escalate';
            nextStep = num;
        } else {
            strategy = 'example';
            step.status = 'active';
            nextStep = num;
        }
    }

    // 推进到下一步
    if (strategy === 'advance' && nextStep <= session.total_steps) {
        session.steps[nextStep - 1].status = 'active';
        session.current_step = nextStep;
    }
    session.progress_percent = Math.round(session.steps.filter(s => s.status === 'done').length / session.total_steps * 100);

    db.update('explain_sessions', session.id, {
        steps: session.steps,
        current_step: session.current_step,
        progress_percent: session.progress_percent,
        status: session.progress_percent === 100 ? 'completed' : 'active'
    });

    res.json({
        code: 0,
        data: {
            next_step: nextStep,
            strategy,
            progress_percent: session.progress_percent,
            remaining_steps: session.total_steps - session.steps.filter(s => s.status === 'done').length
        }
    });
});

// GET /api/ai/explain/:session_id/progress
// 查询讲解进度
router.get('/:session_id/progress', (req, res) => {
    const { session_id } = req.params;
    const session = db.list('explain_sessions').find(s => s.session_id === session_id);
    if (!session) return res.status(404).json({ code: 1007, msg: '讲题会话不存在' });

    res.json({
        code: 0,
        data: {
            session_id,
            completed: session.steps.filter(s => s.status === 'done').length,
            total: session.total_steps,
            percent: session.progress_percent,
            current_step: session.current_step,
            current_status: session.status,
            steps: session.steps
        }
    });
});

// GET /api/ai/explain/history?user_id=xxx
// 历史讲题记录
router.get('/history', (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ code: 1, msg: 'user_id 必填' });

    const list = db.list('explain_sessions')
        .filter(s => s.user_id === user_id)
        .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
        .slice(0, 20)
        .map(s => ({
            session_id: s.session_id,
            question_id: s.question_id,
            subject: s.subject,
            progress_percent: s.progress_percent,
            status: s.status,
            model: s.model,
            created_at: s.created_at
        }));

    res.json({ code: 0, data: list, total: list.length });
});

module.exports = router;
