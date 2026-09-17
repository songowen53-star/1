// ========== 教师 AI 工作台扩展路由 ==========
// AI 切题 / AI 解析 / AI 标知识点 / AI 课堂练习
// 对应原型：teacher-split / teacher-parse / teacher-tag / teacher-paper / teacher-exercise
// 注：teacher-upload 已在 routes/teacher.js 实现
const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/teacher/split
// AI 切题
router.post('/split', (req, res) => {
    const { file_path, teacher_id } = req.body || {};
    if (!file_path) return res.status(400).json({ code: 1, msg: 'file_path 必填' });

    // 模拟 AI 切题结果
    const questions = [
        { no: 1, type: '选择题', score: 5, difficulty: '简单', content_preview: '已知集合 A={1,2,3}，B={2,3,4}...' },
        { no: 2, type: '选择题', score: 5, difficulty: '简单', content_preview: '复数 z=1+i 的共轭复数...' },
        { no: 3, type: '选择题', score: 5, difficulty: '中等', content_preview: '函数 f(x)=sin(2x+π/6)...' },
        { no: 4, type: '选择题', score: 5, difficulty: '中等', content_preview: '数列 {aₙ} 的前 n 项和...' },
        { no: 5, type: '填空题', score: 5, difficulty: '困难', content_preview: '设函数 f(x)=x³-3x²+2...' },
        { no: 6, type: '填空题', score: 5, difficulty: '困难', content_preview: '椭圆 x²/4+y²=1...' }
    ];

    // 保存切题记录
    const record = db.insert('teacher_split_jobs', {
        file_path,
        teacher_id: teacher_id || 'guest',
        total_questions: questions.length,
        questions,
        time: new Date().toISOString()
    });

    res.json({
        code: 0,
        data: {
            job_id: record.id,
            total_questions: questions.length,
            questions
        }
    });
});

// POST /api/teacher/parse
// AI 解析（生成答案+解析）
router.post('/parse', (req, res) => {
    const { question_ids, model } = req.body || {};
    if (!Array.isArray(question_ids) || question_ids.length === 0) {
        return res.status(400).json({ code: 1, msg: 'question_ids 必填' });
    }

    const results = question_ids.map(qid => {
        const q = db.findById('questions', qid);
        if (!q) return { id: qid, answer: '解析失败', analysis: '题目不存在', confidence: 0 };

        // 模拟 AI 解析生成
        return {
            id: qid,
            answer: q.answer || 'B',
            analysis: q.analysis || '由题意分析，应用基本概念求解。',
            confidence: 0.95,
            model: model || 'deepseek-r1'
        };
    });

    res.json({ code: 0, data: results });
});

// POST /api/teacher/tag
// AI 标知识点
router.post('/tag', (req, res) => {
    const { question_ids, subject } = req.body || {};
    if (!Array.isArray(question_ids) || question_ids.length === 0) {
        return res.status(400).json({ code: 1, msg: 'question_ids 必填' });
    }

    // 模拟 AI 知识点标注
    const tagMap = {
        '数学': ['集合运算', '函数性质', '导数应用', '圆锥曲线', '数列求和'],
        '物理': ['牛顿运动定律', '电磁感应', '动量守恒', '能量转化'],
        '化学': ['化学平衡', '有机推断', '氧化还原', '电解质溶液']
    };
    const tags = tagMap[subject || '数学'] || tagMap['数学'];

    const results = question_ids.map((qid, i) => ({
        id: qid,
        knowledge_points: [tags[i % tags.length], tags[(i + 1) % tags.length]],
        kp_ids: ['kp_' + subject + '_' + (i + 1)],
        confidence: Math.round((0.85 + Math.random() * 0.13) * 100) / 100
    }));

    res.json({ code: 0, data: results });
});

// POST /api/teacher/paper
// AI 组卷（复用 recommend 逻辑的简化版）
router.post('/paper', (req, res) => {
    const { subject, question_count, total_score, teacher_id, class_id } = req.body || {};
    const qCount = Math.min(50, Math.max(5, question_count || 20));
    const tScore = total_score || 150;

    // 题型分布
    const choiceCount = Math.round(qCount * 0.4);
    const fillCount = Math.round(qCount * 0.2);
    const solveCount = qCount - choiceCount - fillCount;
    const choiceScore = Math.round(tScore * 0.4 / choiceCount * 10) / 10;
    const fillScore = Math.round(tScore * 0.2 / fillCount * 10) / 10;
    const solveScore = Math.round(tScore * 0.4 / solveCount * 10) / 10;

    const questions = [];
    for (let i = 0; i < qCount; i++) {
        let type, score;
        if (i < choiceCount) { type = '选择题'; score = choiceScore; }
        else if (i < choiceCount + fillCount) { type = '填空题'; score = fillScore; }
        else { type = '解答题'; score = solveScore; }

        questions.push({
            seq: i + 1,
            id: 'q_paper_' + Date.now() + '_' + i,
            type,
            difficulty: (i % 5) + 1,
            content: '示例题目 ' + (i + 1) + '（' + (subject || '数学') + '）',
            options: type === '选择题' ? ['A', 'B', 'C', 'D'] : null,
            answer: type === '选择题' ? 'B' : '解析略',
            score,
            knowledge_point: '示例知识点',
            knowledge_point_id: 'kp_demo_' + (i + 1)
        });
    }

    const paperId = 'paper_' + Date.now();
    res.json({
        code: 0,
        data: {
            paper_id: paperId,
            paper_name: (teacher_id || 'teacher') + ' 专属智能组卷 · ' + new Date().toISOString().slice(0, 10),
            subject: subject || '数学',
            total_score: tScore,
            question_count: qCount,
            duration_min: 120,
            type_distribution: {
                '选择题': { count: choiceCount, score_per: choiceScore, total: Math.round(choiceCount * choiceScore * 10) / 10 },
                '填空题': { count: fillCount, score_per: fillScore, total: Math.round(fillCount * fillScore * 10) / 10 },
                '解答题': { count: solveCount, score_per: solveScore, total: Math.round(solveCount * solveScore * 10) / 10 }
            },
            difficulty_distribution: {
                '基础': Math.round(qCount * 0.3),
                '中等': Math.round(qCount * 0.5),
                '提升': qCount - Math.round(qCount * 0.3) - Math.round(qCount * 0.5)
            },
            questions
        }
    });
});

// POST /api/teacher/exercise
// 课堂练习下发
router.post('/exercise', (req, res) => {
    const { teacher_id, class_id, question_ids, duration_min } = req.body || {};
    if (!teacher_id || !class_id || !Array.isArray(question_ids)) {
        return res.status(400).json({ code: 1, msg: 'teacher_id, class_id, question_ids 必填' });
    }

    const record = db.insert('teacher_exercises', {
        teacher_id,
        class_id,
        question_ids,
        duration_min: duration_min || 30,
        status: 'published',
        time: new Date().toISOString()
    });

    res.json({
        code: 0,
        data: {
            exercise_id: record.id,
            teacher_id,
            class_id,
            question_count: question_ids.length,
            duration_min: duration_min || 30,
            status: 'published',
            msg: '课堂练习已下发到班级 ' + class_id
        }
    });
});

module.exports = router;
