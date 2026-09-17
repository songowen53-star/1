// ========== AI 学习教练路由 ==========
// 1对1 对话 + 教练驾驶舱 + 主动推送
// 对应原型：ai-module-coach / ai-coach
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/ai/coach/chat
// 教练对话（SSE 流式）
router.post('/chat', (req, res) => {
    const { user_id, message, context } = req.body || {};
    if (!message || !message.trim()) return res.status(400).json({ code: 1, msg: 'message 必填' });

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    function sendEvent(event, data) {
        res.write('event: ' + event + '\n');
        res.write('data: ' + JSON.stringify(data) + '\n\n');
    }

    sendEvent('route', { modelKey: 'qwen3-72b', role: '个性化教练' });

    // 聚合学情上下文
    const todayRecords = db.list('learning_records').filter(r =>
        r.user_id === user_id && r.date === new Date().toISOString().slice(0, 10)
    );
    const todayDuration = todayRecords.reduce((s, r) => s + (r.duration_min || 0), 0);
    const todayQuestions = todayRecords.reduce((s, r) => s + (r.questions_count || 0), 0);
    const todayCorrect = todayRecords.reduce((s, r) => s + (r.correct_count || 0), 0);
    const correctRate = todayQuestions > 0 ? Math.round(todayCorrect / todayQuestions * 100) : 0;

    const weakPoints = db.list('knowledge_points').filter(k =>
        k.mastery_rate < 0.7 && k.user_id === user_id
    ).slice(0, 3);

    sendEvent('context', {
        today_duration_min: todayDuration,
        today_questions: todayQuestions,
        correct_rate: correctRate,
        weak_point: weakPoints[0] ? weakPoints[0].name : '无'
    });

    // 生成回复
    setTimeout(() => {
        let text = '';
        const actions = [];

        if (/今天|怎么样|学得/.test(message)) {
            text = `今天学习时长 ${todayDuration} 分钟，做题 ${todayQuestions} 道，正确率 ${correctRate}%。`;
            if (correctRate < 80 && weakPoints[0]) {
                text += `不过${weakPoints[0].subject || ''}正确率有提升空间，主要是${weakPoints[0].name}。我给你推荐 3 道练习题，做完我帮你复盘。`;
                actions.push({ label: '开始练习', type: 'practice', target: 'q_001,q_002,q_003' });
            } else {
                text += '继续保持！';
            }
        } else if (/计划|明天|安排/.test(message)) {
            text = '基于你的薄弱点，建议明天：①数学导数 40min ②物理电磁感应 35min ③英语阅读 30min。预计提分 5 分。';
            actions.push({ label: '生成计划', type: 'plan', target: '/api/recommend/' + user_id + '/plan' });
        } else if (/分数|预测|高考/.test(message)) {
            text = '基于当前学情，预测高考分数约 615 分（较上次 +8 分），985 录取概率 67%，211 录取概率 85%。';
            actions.push({ label: '查看预测', type: 'predict', target: '/api/predict/' + user_id + '/score' });
        } else {
            text = '我是你的 AI 学习教练，可以帮你：①分析学情 ②生成学习计划 ③推荐练习题 ④预测分数。告诉我你想了解什么？';
        }

        sendEvent('reply', { text, actions });

        // 保存对话
        db.insert('coach_history', {
            user_id: user_id || 'guest',
            message,
            reply: text,
            context: { todayDuration, todayQuestions, correctRate },
            time: new Date().toISOString()
        });

        sendEvent('done', { code: 0 });
        res.end();
    }, 600);
});

// GET /api/ai/coach/:user_id/dashboard
// 教练驾驶舱
router.get('/:user_id/dashboard', (req, res) => {
    const { user_id } = req.params;
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const todayRecords = db.list('learning_records').filter(r => r.user_id === user_id && r.date === today);
    const weekRecords = db.list('learning_records').filter(r =>
        r.user_id === user_id && new Date(r.date) >= weekAgo
    );

    const todayDuration = todayRecords.reduce((s, r) => s + (r.duration_min || 0), 0);
    const todayQuestions = todayRecords.reduce((s, r) => s + (r.questions_count || 0), 0);
    const todayCorrect = todayRecords.reduce((s, r) => s + (r.correct_count || 0), 0);
    const weekDuration = weekRecords.reduce((s, r) => s + (r.duration_min || 0), 0);
    const weekQuestions = weekRecords.reduce((s, r) => s + (r.questions_count || 0), 0);
    const weekCorrect = weekRecords.reduce((s, r) => s + (r.correct_count || 0), 0);

    const weakCount = db.list('knowledge_points').filter(k =>
        k.mastery_rate < 0.7 && k.user_id === user_id
    ).length;

    res.json({
        code: 0,
        data: {
            user_id,
            today: {
                duration_min: todayDuration,
                questions: todayQuestions,
                correct_rate: todayQuestions > 0 ? Math.round(todayCorrect / todayQuestions * 100) : 0,
                points: todayDuration * 2 + todayCorrect * 3
            },
            week: {
                duration_min: weekDuration,
                questions: weekQuestions,
                correct_rate: weekQuestions > 0 ? Math.round(weekCorrect / weekQuestions * 100) : 0,
                target_completion: Math.min(100, Math.round(weekDuration / 2520 * 100))
            },
            weak_points: weakCount,
            predicted_score: 615,
            score_trend: 'up',
            next_action: weakCount > 0 ? '继续突破薄弱知识点，预计提分 ' + (weakCount * 5) : '保持当前节奏'
        }
    });
});

// POST /api/ai/coach/:user_id/proactive
// 主动推送诊断
router.post('/:user_id/proactive', (req, res) => {
    const { user_id } = req.params;
    const { message, trigger } = req.body || {};

    const record = db.insert('coach_proactive', {
        user_id,
        message: message || '检测到你最近数学正确率下降 8%，建议复习导数第二问',
        trigger: trigger || 'correct_rate_drop',
        status: 'sent',
        time: new Date().toISOString()
    });

    res.json({ code: 0, data: record });
});

// GET /api/ai/coach/:user_id/goals
// 长期目标跟踪
router.get('/:user_id/goals', (req, res) => {
    const { user_id } = req.params;
    const goals = db.list('coach_goals').filter(g => g.user_id === user_id);

    // 若无目标，返回默认
    if (goals.length === 0) {
        return res.json({
            code: 0,
            data: [{
                id: 'goal_default',
                user_id,
                target_score: 650,
                current_score: 615,
                gap: 35,
                deadline: '2027-06-07',
                days_left: 265,
                progress_percent: 94
            }]
        });
    }

    res.json({ code: 0, data: goals });
});

module.exports = router;
