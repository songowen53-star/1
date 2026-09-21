// AI高考 - 后端服务（Express）
// 提供 /api/page-data/:key 接口与 prototype 静态托管
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// 简易请求日志中间件
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const dur = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${dur}ms`);
    });
    next();
});

// 统一响应封装
function ok(data) { return { code: 0, data }; }

// ========== Mock 数据 ==========
const MOCK = {
    // 薄弱知识点
    weakPoints: [
        { id: 'kp_001', subject: '数学', name: '圆锥曲线综合', mastery_rate: 0.41, score_gain: 18, total_questions: 45, correct_count: 18 },
        { id: 'kp_002', subject: '物理', name: '电磁感应综合题', mastery_rate: 0.48, score_gain: 12, total_questions: 38, correct_count: 18 },
        { id: 'kp_003', subject: '英语', name: '完形填空技巧', mastery_rate: 0.53, score_gain: 9, total_questions: 52, correct_count: 28 },
        { id: 'kp_004', subject: '化学', name: '有机推断题型', mastery_rate: 0.58, score_gain: 7, total_questions: 30, correct_count: 17 },
        { id: 'kp_005', subject: '数学', name: '概率统计', mastery_rate: 0.62, score_gain: 5, total_questions: 40, correct_count: 25 },
        { id: 'kp_006', subject: '物理', name: '力学综合分析', mastery_rate: 0.55, score_gain: 10, total_questions: 35, correct_count: 19 },
        { id: 'kp_007', subject: '英语', name: '阅读理解推理题', mastery_rate: 0.59, score_gain: 8, total_questions: 48, correct_count: 28 },
        { id: 'kp_008', subject: '化学', name: '电化学原理', mastery_rate: 0.51, score_gain: 11, total_questions: 28, correct_count: 14 },
        { id: 'kp_009', subject: '数学', name: '导数应用专题', mastery_rate: 0.45, score_gain: 15, total_questions: 42, correct_count: 19 },
        { id: 'kp_010', subject: '物理', name: '动量与冲量', mastery_rate: 0.57, score_gain: 8, total_questions: 32, correct_count: 18 },
        { id: 'kp_011', subject: '英语', name: '语法填空', mastery_rate: 0.63, score_gain: 6, total_questions: 50, correct_count: 32 },
        { id: 'kp_012', subject: '化学', name: '化学平衡计算', mastery_rate: 0.49, score_gain: 13, total_questions: 26, correct_count: 13 },
        { id: 'kp_013', subject: '数学', name: '立体几何向量法', mastery_rate: 0.56, score_gain: 9, total_questions: 36, correct_count: 20 },
        { id: 'kp_014', subject: '物理', name: '热学基础', mastery_rate: 0.60, score_gain: 7, total_questions: 24, correct_count: 14 },
        { id: 'kp_015', subject: '英语', name: '书面表达高级句式', mastery_rate: 0.52, score_gain: 10, total_questions: 20, correct_count: 10 },
        { id: 'kp_016', subject: '化学', name: '离子反应方程式', mastery_rate: 0.64, score_gain: 5, total_questions: 38, correct_count: 24 },
        { id: 'kp_017', subject: '数学', name: '数列求和方法', mastery_rate: 0.54, score_gain: 11, total_questions: 34, correct_count: 18 },
        { id: 'kp_018', subject: '物理', name: '光学与原子物理', mastery_rate: 0.66, score_gain: 4, total_questions: 22, correct_count: 15 },
        { id: 'kp_019', subject: '英语', name: '七选五阅读', mastery_rate: 0.58, score_gain: 8, total_questions: 30, correct_count: 17 },
        { id: 'kp_020', subject: '化学', name: '实验综合分析', mastery_rate: 0.50, score_gain: 12, total_questions: 28, correct_count: 14 }
    ],

    // 推荐计划（按 available_minutes 截取）
    recommendPlan: [
        { subject: '数学', knowledge_point_name: '导数应用专题', mastery_rate: 0.45, score_gain: 15, allocated_minutes: 35, strategy: '专项突破' },
        { subject: '数学', knowledge_point_name: '圆锥曲线综合', mastery_rate: 0.41, score_gain: 18, allocated_minutes: 40, strategy: '优先突破' },
        { subject: '物理', knowledge_point_name: '电磁感应综合题', mastery_rate: 0.48, score_gain: 12, allocated_minutes: 30, strategy: '重点突破' },
        { subject: '化学', knowledge_point_name: '化学平衡计算', mastery_rate: 0.49, score_gain: 13, allocated_minutes: 25, strategy: '重点突破' },
        { subject: '英语', knowledge_point_name: '书面表达高级句式', mastery_rate: 0.52, score_gain: 10, allocated_minutes: 20, strategy: '加强训练' },
        { subject: '化学', knowledge_point_name: '电化学原理', mastery_rate: 0.51, score_gain: 11, allocated_minutes: 25, strategy: '专项突破' },
        { subject: '数学', knowledge_point_name: '数列求和方法', mastery_rate: 0.54, score_gain: 11, allocated_minutes: 25, strategy: '加强训练' },
        { subject: '物理', knowledge_point_name: '力学综合分析', mastery_rate: 0.55, score_gain: 10, allocated_minutes: 20, strategy: '加强训练' },
        { subject: '英语', knowledge_point_name: '完形填空技巧', mastery_rate: 0.53, score_gain: 9, allocated_minutes: 20, strategy: '加强训练' },
        { subject: '化学', knowledge_point_name: '有机推断题型', mastery_rate: 0.58, score_gain: 7, allocated_minutes: 15, strategy: '巩固训练' }
    ],

    // 推荐题目
    recommendQuestions: [
        { id: 'q_1001', subject: '数学', type: '选择题', difficulty: 4, knowledge_point: '圆锥曲线综合', title: '已知椭圆 C: x²/4 + y²/3 = 1，过点 P(1,1) 的直线与椭圆交于 A,B 两点，求弦长 |AB| 的取值范围。', options: ['A. [2,2√3]', 'B. [√3,2√3]', 'C. [2,4]', 'D. [√2,2√2]'], answer: 'B', analysis: '设直线斜率为 k，联立椭圆方程，利用韦达定理求弦长公式 |AB|=√(1+k²)·|x₁-x₂|，再求最值。' },
        { id: 'q_1002', subject: '物理', type: '计算题', difficulty: 4, knowledge_point: '电磁感应综合题', title: '如图，导体棒 ab 在匀强磁场 B 中以速度 v 向右运动，回路电阻为 R，求棒中感应电流大小及方向。', answer: 'I = BLv/R，方向由 b 向 a（右手定则）', analysis: '由法拉第电磁感应定律 ε=BLv，闭合电路欧姆定律 I=ε/R，右手定则判断方向。' },
        { id: 'q_1003', subject: '化学', type: '推断题', difficulty: 5, knowledge_point: '有机推断题型', title: '某链状化合物 A 分子式 C₄H₈O₂，可与 NaHCO₃ 反应放出 CO₂，A 在浓硫酸催化下生成 B (C₈H₁₄O₂)，推断 A、B 结构。', answer: 'A: CH₃CH₂CH₂COOH（丁酸）；B: (CH₃CH₂CH₂CO)₂O（丁酸酐）', analysis: 'A 能与 NaHCO₃ 反应说明为羧酸，脱水生成酸酐 B，分子式翻倍。' },
        { id: 'q_1004', subject: '英语', type: '完形填空', difficulty: 3, knowledge_point: '完形填空技巧', title: 'Choose the best word: "The students were ___ by the teacher\'s inspiring speech."', options: ['A. bored', 'B. moved', 'C. confused', 'D. scared'], answer: 'B', analysis: '"inspiring speech" 暗示积极情绪，moved（感动）最符合语境。' },
        { id: 'q_1005', subject: '数学', type: '解答题', difficulty: 5, knowledge_point: '导数应用专题', title: '设 f(x) = x³ - 3x + 1，求 f(x) 在 R 上的极值，并讨论方程 f(x)=0 的实根个数。', answer: '极大值 f(-1)=3，极小值 f(1)=-1；方程有 3 个实根。', analysis: 'f\'(x)=3x²-3，令 f\'(x)=0 得 x=±1，列表判断极值，由零点存在定理讨论根个数。' },
        { id: 'q_1006', subject: '物理', type: '选择题', difficulty: 4, knowledge_point: '力学综合分析', title: '一物体从高 h 处自由下落，落到地面时速度大小为 v，若物体质量为 m，重力加速度为 g，则落地过程中合外力做功为：', options: ['A. mgh', 'B. ½mv²', 'C. mgh - ½mv²', 'D. 0'], answer: 'B', analysis: '由动能定理 W=ΔEk=½mv²-0=½mv²，合外力做功等于动能变化量。' },
        { id: 'q_1007', subject: '化学', type: '选择题', difficulty: 3, knowledge_point: '电化学原理', title: '在原电池中，下列说法正确的是：', options: ['A. 正极发生氧化反应', 'B. 负极发生还原反应', 'C. 电子由负极经外电路流向正极', 'D. 阳离子向负极迁移'], answer: 'C', analysis: '原电池中负极失电子（氧化），电子经外电路到正极；正极得电子（还原）；阳离子向正极迁移。' },
        { id: 'q_1008', subject: '英语', type: '写作', difficulty: 4, knowledge_point: '书面表达高级句式', title: 'Write a paragraph (80 words) describing your hometown using at least 2 advanced sentence patterns (inversion, emphasis, non-restrictive clause).', answer: '参考范文：Not only is my hometown rich in natural resources, but it also boasts a long history. It is the beautiful West Lake that attracts millions of tourists every year, which has greatly promoted the local economy.', analysis: '使用了 Not only...but also 倒装句、It is...that 强调句、which 非限制性定语从句三种高级句式。' }
    ],

    // 推荐试卷
    recommendPaper: {
        paper: [
            { id: 'q_1001', subject: '数学', type: '选择题', difficulty: 4, knowledge_point: '圆锥曲线综合', title: '已知椭圆 C: x²/4 + y²/3 = 1，过点 P(1,1) 的直线与椭圆交于 A,B 两点，求弦长 |AB| 的取值范围。', options: ['A. [2,2√3]', 'B. [√3,2√3]', 'C. [2,4]', 'D. [√2,2√2]'], answer: 'B', analysis: '设直线斜率为 k，联立椭圆方程，利用韦达定理求弦长公式。' },
            { id: 'q_1002', subject: '物理', type: '计算题', difficulty: 4, knowledge_point: '电磁感应综合题', title: '导体棒 ab 在匀强磁场 B 中以速度 v 向右运动，求感应电流。', answer: 'I = BLv/R', analysis: '由法拉第电磁感应定律和欧姆定律求解。' },
            { id: 'q_1003', subject: '化学', type: '推断题', difficulty: 5, knowledge_point: '有机推断题型', title: '某链状化合物 A 分子式 C₄H₈O₂，可与 NaHCO₃ 反应，推断结构。', answer: 'A: 丁酸', analysis: '根据官能团反应特性推断。' },
            { id: 'q_1004', subject: '英语', type: '完形填空', difficulty: 3, knowledge_point: '完形填空技巧', title: 'The students were ___ by the inspiring speech.', options: ['A. bored', 'B. moved', 'C. confused', 'D. scared'], answer: 'B', analysis: '语境推断题。' },
            { id: 'q_1005', subject: '数学', type: '解答题', difficulty: 5, knowledge_point: '导数应用专题', title: 'f(x) = x³ - 3x + 1，求极值及零点个数。', answer: '极大值3，极小值-1，3个零点', analysis: '利用导数和零点定理。' },
            { id: 'q_1006', subject: '物理', type: '选择题', difficulty: 4, knowledge_point: '力学综合分析', title: '物体自由下落高度 h，落地速度 v，合外力做功？', options: ['A. mgh', 'B. ½mv²', 'C. mgh-½mv²', 'D. 0'], answer: 'B', analysis: '动能定理。' },
            { id: 'q_1007', subject: '化学', type: '选择题', difficulty: 3, knowledge_point: '电化学原理', title: '原电池中正确的是？', options: ['A. 正极氧化', 'B. 负极还原', 'C. 电子负→正', 'D. 阳离子向负极'], answer: 'C', analysis: '原电池原理。' },
            { id: 'q_1008', subject: '英语', type: '写作', difficulty: 4, knowledge_point: '书面表达高级句式', title: '描写家乡，至少2种高级句式。', answer: '见范文', analysis: '倒装、强调、非限制性定语从句。' },
            { id: 'q_1009', subject: '数学', type: '选择题', difficulty: 3, knowledge_point: '概率统计', title: '从 5 男 3 女中选 3 人，至少 1 女的概率？', options: ['A. 5/14', 'B. 9/14', 'C. 15/28', 'D. 23/28'], answer: 'D', analysis: '对立事件：全男概率 C(5,3)/C(8,3)=10/56，所求=1-10/56=23/28。' },
            { id: 'q_1010', subject: '物理', type: '选择题', difficulty: 3, knowledge_point: '动量与冲量', title: '质量 2kg 物体速度从 3m/s 增大到 5m/s，动量变化量大小？', options: ['A. 4 kg·m/s', 'B. 6 kg·m/s', 'C. 8 kg·m/s', 'D. 10 kg·m/s'], answer: 'A', analysis: 'Δp=m(v₂-v₁)=2×(5-3)=4 kg·m/s。' }
        ],
        meta: {
            total_count: 10,
            subjects: ['数学', '物理', '化学', '英语'],
            total_score: 150,
            estimated_time: 120,
            difficulty: '中等偏难',
            generated_by: 'AI推荐引擎 v2.1',
            generated_at: new Date().toISOString()
        }
    },

    // 模考预测报告
    predictReport: {
        predicted_score: 568,
        rank: 12580,
        percentile: 15,
        days_to_exam: (function() {
            const now = new Date();
            const exam = new Date(2027, 5, 7);
            return Math.max(0, Math.ceil((exam - now) / 86400000));
        })(),
        yiben_line_diff: 3,
        probability: { p985: 35, p211: 62, yiben: 85 },
        trend_impact: 5,
        confidence: 89,
        model: 'AI-Gaokao-Predict-v3.2',
        subject_scores: [
            { subject: '语文', score: 112, max_score: 150 },
            { subject: '数学', score: 105, max_score: 150 },
            { subject: '英语', score: 118, max_score: 150 },
            { subject: '物理', score: 78, max_score: 100 },
            { subject: '化学', score: 85, max_score: 100 },
            { subject: '生物', score: 70, max_score: 100 }
        ],
        weak_advice: [
            '数学圆锥曲线和导数模块掌握率偏低，建议每日专项训练 30 分钟',
            '物理电磁感应是薄弱环节，建议结合实验视频加深理解',
            '英语书面表达可提升空间大，多背诵高级句式模板',
            '化学有机推断题错误率高，建议系统梳理有机反应类型'
        ]
    },

    // 学情汇总
    learningSummary: {
        duration_hours: 12.5,
        questions_count: 186,
        correct_rate: 78,
        points: 1240,
        study_days: 6,
        avg_daily_hours: 2.1,
        changes: {
            duration: 12,
            questions: 8,
            correct_rate: 5,
            points: 120
        },
        subjects: [
            { subject: '数学', duration_hours: 3.5, questions: 52, correct_rate: 72 },
            { subject: '语文', duration_hours: 2.0, questions: 28, correct_rate: 81 },
            { subject: '英语', duration_hours: 3.0, questions: 48, correct_rate: 80 },
            { subject: '物理', duration_hours: 2.5, questions: 35, correct_rate: 74 },
            { subject: '化学', duration_hours: 1.5, questions: 23, correct_rate: 83 }
        ]
    },

    // 学科能力 - 字段对齐前端 renderAnalysisOverview（duration_min/questions/correct_rate）
    subjectStats: [
        { subject: '数学', duration_min: 320, questions: 486, correct_rate: 72, score: 105, max_score: 150, mastery_rate: 0.70, trend: 'up' },
        { subject: '语文', duration_min: 280, questions: 412, correct_rate: 75, score: 112, max_score: 150, mastery_rate: 0.75, trend: 'stable' },
        { subject: '英语', duration_min: 350, questions: 538, correct_rate: 79, score: 118, max_score: 150, mastery_rate: 0.79, trend: 'up' },
        { subject: '物理', duration_min: 240, questions: 367, correct_rate: 78, score: 78, max_score: 100, mastery_rate: 0.78, trend: 'up' },
        { subject: '化学', duration_min: 210, questions: 325, correct_rate: 85, score: 85, max_score: 100, mastery_rate: 0.85, trend: 'stable' },
        { subject: '生物', duration_min: 180, questions: 274, correct_rate: 70, score: 70, max_score: 100, mastery_rate: 0.70, trend: 'down' }
    ],

    // 知识点库
    knowledgePoints: [
        { id: 'kp_001', subject: '数学', name: '圆锥曲线综合', mastery_rate: 0.41, score_gain: 18 },
        { id: 'kp_002', subject: '物理', name: '电磁感应综合题', mastery_rate: 0.48, score_gain: 12 },
        { id: 'kp_003', subject: '英语', name: '完形填空技巧', mastery_rate: 0.53, score_gain: 9 },
        { id: 'kp_004', subject: '化学', name: '有机推断题型', mastery_rate: 0.58, score_gain: 7 },
        { id: 'kp_005', subject: '数学', name: '概率统计', mastery_rate: 0.62, score_gain: 5 },
        { id: 'kp_006', subject: '物理', name: '力学综合分析', mastery_rate: 0.55, score_gain: 10 },
        { id: 'kp_007', subject: '英语', name: '阅读理解推理题', mastery_rate: 0.59, score_gain: 8 },
        { id: 'kp_008', subject: '化学', name: '电化学原理', mastery_rate: 0.51, score_gain: 11 },
        { id: 'kp_009', subject: '数学', name: '导数应用专题', mastery_rate: 0.45, score_gain: 15 },
        { id: 'kp_010', subject: '物理', name: '动量与冲量', mastery_rate: 0.57, score_gain: 8 }
    ]
};

// ========== API 路由 ==========

// API: 获取页面 mock 数据（统一 {code:0, data:...} 包装，兼容前端 api.request）
app.get('/api/page-data/:key', (req, res) => {
    const key = req.params.key;
    const filePath = path.join(__dirname, 'data', 'pages', `${key}.json`);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).json({ code: 1, msg: 'page not found', key });
        }
        try {
            const parsed = JSON.parse(data);
            res.json(ok(parsed));
        } catch (e) {
            res.status(500).json({ code: 1, msg: 'invalid json', key });
        }
    });
});

// ========== 考点库 ==========
app.get('/api/knowledge', (req, res) => {
    let list = MOCK.knowledgePoints;
    if (req.query.subject) {
        list = list.filter(k => k.subject === req.query.subject);
    }
    res.json(ok(list));
});

app.get('/api/knowledge/weak', (req, res) => {
    const threshold = parseFloat(req.query.threshold) || 0.6;
    const limit = parseInt(req.query.limit) || 10;
    let list = MOCK.weakPoints.filter(k => k.mastery_rate < threshold);
    list = list.slice(0, limit);
    res.json(ok(list));
});

// ========== 题库 ==========
app.get('/api/questions', (req, res) => {
    let list = MOCK.recommendQuestions;
    if (req.query.subject) {
        list = list.filter(q => q.subject === req.query.subject);
    }
    if (req.query.source === 'real_exam') {
        list = list.map(q => ({ ...q, source: 'real_exam', year: 2024 }));
    }
    const count = parseInt(req.query.count);
    if (count && count > 0) {
        list = list.slice(0, count);
    }
    res.json(ok(list));
});

app.get('/api/questions/:id', (req, res) => {
    const q = MOCK.recommendQuestions.find(q => q.id === req.params.id);
    if (q) res.json(ok(q));
    else res.status(404).json({ code: 1, msg: '题目不存在' });
});

// ========== 学情数据 ==========
app.get('/api/learning/:userId/summary', (req, res) => {
    const days = parseInt(req.query.days) || 7;
    const base = MOCK.learningSummary;
    // 根据天数调整数据
    const factor = days / 7;
    const data = {
        ...base,
        duration_hours: Math.round(base.duration_hours * factor * 10) / 10,
        questions_count: Math.round(base.questions_count * factor),
        study_days: Math.min(7, Math.round(base.study_days * factor)),
        avg_daily_hours: Math.round(base.avg_daily_hours * 10) / 10
    };
    res.json(ok(data));
});

app.get('/api/learning/:userId/subject-stats', (req, res) => {
    const days = parseInt(req.query.days) || 14;
    res.json(ok(MOCK.subjectStats));
});

// ========== AI 推荐 ==========
app.get('/api/recommend/:userId/plan', (req, res) => {
    const available = parseInt(req.query.available_minutes) || 120;
    let plan = [...MOCK.recommendPlan];
    let total = 0;
    const result = [];
    for (const p of plan) {
        if (total + p.allocated_minutes <= available) {
            result.push(p);
            total += p.allocated_minutes;
        }
    }
    const estimatedGain = result.reduce((s, p) => s + p.score_gain, 0);
    res.json(ok({
        plan: result,
        total_minutes: total,
        task_count: result.length,
        estimated_score_gain: estimatedGain
    }));
});

app.get('/api/recommend/:userId/questions', (req, res) => {
    console.log('DEBUG questions query:', JSON.stringify(req.query), 'headers:', JSON.stringify(req.headers));
    const count = parseInt(req.query.count) || 10;
    let list = MOCK.recommendQuestions;
    if (req.query.subject) {
        const subject = req.query.subject;
        console.log('DEBUG subject param:', subject, 'type:', typeof subject);
        list = list.filter(q => q.subject === subject);
    }
    list = list.slice(0, count);
    res.json(ok(list));
});

app.get('/api/recommend/:userId/paper', (req, res) => {
    const count = parseInt(req.query.count) || 10;
    const paper = MOCK.recommendPaper.paper.slice(0, count);
    res.json(ok({
        paper,
        meta: { ...MOCK.recommendPaper.meta, total_count: paper.length }
    }));
});

// ========== 模考预测 ==========
app.get('/api/predict/:userId/score', (req, res) => {
    res.json(ok({ predicted_score: MOCK.predictReport.predicted_score }));
});

app.get('/api/predict/:userId/rank', (req, res) => {
    res.json(ok({ rank: MOCK.predictReport.rank, percentile: MOCK.predictReport.percentile }));
});

app.get('/api/predict/:userId/report', (req, res) => {
    res.json(ok(MOCK.predictReport));
});

// ========== 答题 ==========
app.post('/api/answers', (req, res) => {
    res.json(ok({ success: true, question_id: req.body.question_id, is_correct: true }));
});

app.post('/api/answers/batch', (req, res) => {
    const records = req.body.records || [];
    res.json(ok({ success: true, count: records.length }));
});

app.get('/api/answers/:userId/stats', (req, res) => {
    const days = parseInt(req.query.days) || 30;
    res.json(ok({
        total: Math.round(MOCK.learningSummary.questions_count * days / 7),
        correct: Math.round(MOCK.learningSummary.questions_count * days / 7 * MOCK.learningSummary.correct_rate / 100),
        correct_rate: MOCK.learningSummary.correct_rate,
        avg_time_per_question: 180,
        knowledge_point_stats: MOCK.weakPoints.map(k => ({
            id: k.id,
            subject: k.subject,
            name: k.name,
            total: k.total_questions || Math.floor(Math.random() * 30) + 15,
            correct_rate: Math.round(k.mastery_rate * 100)
        }))
    }));
});

// ========== 文章 ==========
app.get('/api/articles', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    res.json(ok([
        { id: 'a1', title: '2024高考数学压轴题5种解法', views: 12500, favorites: 1200, tag: '数学', summary: '圆锥曲线、导数、概率统计等压轴题的5种经典解法详解。' },
        { id: 'a2', title: '高考英语完形填空三大技巧', views: 8700, favorites: 980, tag: '英语', summary: '语境推断、词义辨析、逻辑衔接三大核心技巧。' },
        { id: 'a3', title: '物理电磁感应题型全解', views: 6300, favorites: 750, tag: '物理', summary: '从基础到进阶，电磁感应题型一网打尽。' }
    ].slice(0, limit)));
});

// ========== 课程 ==========
app.get('/api/courses', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    res.json(ok([
        { id: 'c1', title: '圆锥曲线专题突破', teacher: '王老师', lessons: 12, rating: 4.9, subject: '数学' },
        { id: 'c2', title: '英语写作高分模板', teacher: '李老师', lessons: 8, rating: 4.8, subject: '英语' },
        { id: 'c3', title: '物理大题解题方法', teacher: '张老师', lessons: 10, rating: 4.7, subject: '物理' }
    ].slice(0, limit)));
});

// ========== 学科列表 ==========
app.get('/api/subjects', (req, res) => {
    res.json(ok([
        { id: 'math', name: '数学', icon: 'fa-square-root-variable', color: '#3B82F6' },
        { id: 'chinese', name: '语文', icon: 'fa-book', color: '#EF4444' },
        { id: 'english', name: '英语', icon: 'fa-language', color: '#8B5CF6' },
        { id: 'physics', name: '物理', icon: 'fa-atom', color: '#F59E0B' },
        { id: 'chemistry', name: '化学', icon: 'fa-flask', color: '#10B981' },
        { id: 'biology', name: '生物', icon: 'fa-dna', color: '#EC4899' },
        { id: 'politics', name: '政治', icon: 'fa-landmark', color: '#EF4444' },
        { id: 'history', name: '历史', icon: 'fa-ribbon', color: '#D97706' },
        { id: 'geography', name: '地理', icon: 'fa-globe-asia', color: '#059669' },
        { id: 'science', name: '理综', icon: 'fa-vials', color: '#6B7280' }
    ]));
});

// ========== 消息通知 ==========
app.get('/api/notifications/:userId', (req, res) => {
    const limit = parseInt(req.query.limit) || 30;
    res.json(ok([
        { id: 'n1', type: 'info', title: '学习周报已生成', content: '本周学习时长 12.5h，正确率提升 5%，继续加油！', created_at: new Date(Date.now() - 2 * 60000).toISOString(), is_read: false },
        { id: 'n2', type: 'warning', title: '错题本更新', content: '今日新增 3 道错题，建议尽快复习巩固', created_at: new Date(Date.now() - 60 * 60000).toISOString(), is_read: false },
        { id: 'n3', type: 'success', title: 'AI推荐试卷', content: 'AI已为你生成专属冲刺试卷，点击查看', created_at: new Date(Date.now() - 24 * 3600000).toISOString(), is_read: false },
        { id: 'n4', type: 'info', title: '高考报名提醒', content: '2027 年高考报名即将开始，请关注通知', created_at: new Date(Date.now() - 3 * 24 * 3600000).toISOString(), is_read: true }
    ].slice(0, limit)));
});

app.post('/api/notifications/:userId/:id/read', (req, res) => {
    res.json(ok({ success: true, id: req.params.id }));
});

// ========== 拍照搜题 ==========
app.post('/api/search/image', (req, res) => {
    res.json(ok({
        question_id: 'q_1001',
        question: MOCK.recommendQuestions[0],
        candidates: MOCK.recommendQuestions.slice(0, 3),
        confidence: 0.92
    }));
});

app.get('/api/search/:userId/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    res.json(ok([
        { id: 'h1', question_title: '圆锥曲线综合题', subject: '数学', searched_at: new Date(Date.now() - 3600000).toISOString() },
        { id: 'h2', question_title: '电磁感应计算题', subject: '物理', searched_at: new Date(Date.now() - 7200000).toISOString() },
        { id: 'h3', question_title: '有机推断题', subject: '化学', searched_at: new Date(Date.now() - 86400000).toISOString() }
    ].slice(0, limit)));
});

// ========== 用户信息 ==========
app.get('/api/users/:userId', (req, res) => {
    res.json(ok({
        id: req.params.userId,
        name: '张同学',
        avatar: '',
        is_vip: true,
        grade: '高三',
        province: '浙江',
        current_score: 580,
        target_score: 620,
        days_to_gaokao: 259
    }));
});

app.put('/api/users/:userId', (req, res) => {
    res.json(ok({ ...req.body, id: req.params.userId }));
});

// ========== AI模型中心 ==========
// 读取 ai-model-center.json 并附加动态运行状态
app.get('/api/ai/model-center', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'pages', 'ai-model-center.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(404).json({ code: 1, msg: 'model center data not found' });
        try {
            const obj = JSON.parse(data);
            // 动态计算运行中模型数 / 总数 / 可用率
            let total = 0, running = 0;
            (obj.categories || []).forEach(cat => {
                (cat.models || []).forEach(m => {
                    total++;
                    if (m.status === 'running') running++;
                });
            });
            // 随机抖动 98.5%~99.9% 模拟实时可用率
            const availability = (98.5 + Math.random() * 1.4).toFixed(1);
            if (obj.header_card && obj.header_card.stats) {
                obj.header_card.stats = obj.header_card.stats.map(s => {
                    if (s.label === '已集成模型') return { ...s, value: String(total) };
                    if (s.label === '运行中') return { ...s, value: String(running) };
                    if (s.label === '待命') return { ...s, value: String(total - running) };
                    if (s.label === '可用率') return { ...s, value: availability + '%' };
                    return s;
                });
            }
            // 动态刷新 model_card 的指标趋势
            if (obj.model_card && obj.model_card.metrics) {
                obj.model_card.metrics = obj.model_card.metrics.map(m => ({
                    ...m,
                    value: typeof m.value === 'string' && m.value.endsWith('%')
                        ? (90 + Math.floor(Math.random() * 10)) + '%'
                        : m.value
                }));
            }
            res.json(ok(obj));
        } catch (e) {
            res.status(500).json({ code: 1, msg: 'invalid json' });
        }
    });
});

// AI模型中心：模型连通性测试
app.post('/api/ai/model-center/test', (req, res) => {
    const { model_name, test_type } = (req.body || {});
    if (!model_name) return res.status(400).json({ code: 1, msg: 'model_name required' });
    // 模拟连通性测试：随机延迟与结果
    const latency = 30 + Math.floor(Math.random() * 120);
    const success = Math.random() > 0.1; // 90% 成功
    res.json(ok({
        model: model_name,
        test_type: test_type || 'connectivity',
        success,
        latency_ms: latency,
        result: success
            ? `✓ 连通正常，响应延迟 ${latency}ms，模型状态：运行中`
            : `✗ 连接超时，模型可能暂时不可用，请稍后重试`,
        timestamp: new Date().toISOString()
    }));
});

// ========== AI学习中心 ==========
// 通用加载器：读取 ai-module-*.json 并附加动态字段
function loadAiModuleData(key, enhancer, res) {
    const filePath = path.join(__dirname, 'data', 'pages', `${key}.json`);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(404).json({ code: 1, msg: `${key} data not found` });
        try {
            const obj = JSON.parse(data);
            if (enhancer) enhancer(obj);
            res.json(ok(obj));
        } catch (e) {
            res.status(500).json({ code: 1, msg: 'invalid json' });
        }
    });
}

app.get('/api/ai-module/coach', (req, res) => {
    loadAiModuleData('ai-module-coach', obj => {
        // 动态注入今日日期
        if (obj.today_analysis) {
            obj.today_analysis.date = new Date().toLocaleDateString('zh-CN');
        }
    }, res);
});

app.get('/api/ai-module/explain', (req, res) => {
    loadAiModuleData('ai-module-explain', null, res);
});

app.get('/api/ai-module/paper', (req, res) => {
    loadAiModuleData('ai-module-paper', obj => {
        // 动态刷新生成时间
        if (obj.header_card) obj.header_card.generated_at = new Date().toLocaleString('zh-CN');
    }, res);
});

app.get('/api/ai-module/graph', (req, res) => {
    loadAiModuleData('ai-module-graph', null, res);
});

app.get('/api/ai-module/predict', (req, res) => {
    loadAiModuleData('ai-module-predict', obj => {
        // 动态计算距高考天数
        const now = new Date();
        const exam = new Date(2027, 5, 7);
        const days = Math.max(0, Math.ceil((exam - now) / 86400000));
        if (obj.header_card && obj.header_card.stats) {
            obj.header_card.stats = obj.header_card.stats.map(s =>
                s.label && s.label.includes('高考') ? { ...s, value: String(days) + '天' } : s
            );
        }
    }, res);
});

// ========== 志愿填报 ==========
app.get('/api/college/recommend', (req, res) => {
    const userId = req.query.user_id || 'u_001';
    const filePath = path.join(__dirname, 'data', 'pages', 'college-recommend.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(404).json({ code: 1, msg: 'college recommend data not found' });
        try {
            const obj = JSON.parse(data);
            // 根据用户身份微调录取概率（模拟个性化推荐）
            const seed = userId.charCodeAt(userId.length - 1) || 0;
            obj.colleges = (obj.colleges || []).map((c, i) => {
                const jitter = ((seed + i) % 7) - 3; // -3~+3
                const prob = Math.max(5, Math.min(99, c.prob + jitter));
                return { ...c, prob };
            });
            res.json(ok(obj));
        } catch (e) {
            res.status(500).json({ code: 1, msg: 'invalid json' });
        }
    });
});

app.get('/api/college/major', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'pages', 'college-major.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(404).json({ code: 1, msg: 'college major data not found' });
        try { res.json(ok(JSON.parse(data))); }
        catch (e) { res.status(500).json({ code: 1, msg: 'invalid json' }); }
    });
});

app.get('/api/college/rank', (req, res) => {
    const filePath = path.join(__dirname, 'data', 'pages', 'college-rank.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) return res.status(404).json({ code: 1, msg: 'college rank data not found' });
        try { res.json(ok(JSON.parse(data))); }
        catch (e) { res.status(500).json({ code: 1, msg: 'invalid json' }); }
    });
});

// 志愿填报：保存用户调整的推荐条件
app.put('/api/college/recommend/conditions', (req, res) => {
    const { user_id, conditions } = (req.body || {});
    res.json(ok({ user_id: user_id || 'u_001', conditions: conditions || [], updated_at: new Date().toISOString() }));
});

// ========== 模块配置 ==========
app.get('/api/modules', (req, res) => {
    res.json(ok([]));
});

app.get('/api/modules/:key', (req, res) => {
    res.status(404).json({ code: 1, msg: 'module not found' });
});

app.put('/api/modules/:key', (req, res) => {
    res.json(ok({ ...req.body, key: req.params.key }));
});

// ========== 认证（auth）==========
// 简易内存态用户表 + token 池，演示用
const _users = {};           // username -> {id, username, password, name, grade, province}
const _tokens = {};          // token -> userId
let _userSeq = 0;
function _newToken() { return 'tk_' + Math.random().toString(36).slice(2) + Date.now().toString(36); }
function _newUserId() { _userSeq++; return 'u_' + String(_userSeq).padStart(3, '0'); }
function _userPublic(u) { if (!u) return null; const { password, ...pub } = u; return pub; }
function _authUser(req) {
    const auth = req.headers.authorization || '';
    const m = auth.match(/^Bearer\s+(.+)$/);
    if (!m) return null;
    const uid = _tokens[m[1]];
    if (!uid) return null;
    return Object.values(_users).find(u => u.id === uid);
}

app.post('/api/auth/register', (req, res) => {
    const { username, password, name, grade, province } = (req.body || {});
    if (!username || !password) return res.status(400).json({ code: 1, msg: '用户名和密码必填' });
    if (_users[username]) return res.status(409).json({ code: 1, msg: '用户名已存在' });
    const user = { id: _newUserId(), username, password, name: name || username, grade: grade || '高三', province: province || '浙江' };
    _users[username] = user;
    const token = _newToken(); _tokens[token] = user.id;
    res.json(ok({ token, user_id: user.id, user: _userPublic(user) }));
});
app.post('/api/auth/login', (req, res) => {
    const { username, password } = (req.body || {});
    const u = _users[username];
    if (!u || u.password !== password) return res.status(401).json({ code: 1, msg: '用户名或密码错误' });
    const token = _newToken(); _tokens[token] = u.id;
    res.json(ok({ token, user_id: u.id, user: _userPublic(u) }));
});
app.post('/api/auth/logout', (req, res) => {
    const auth = req.headers.authorization || '';
    const m = auth.match(/^Bearer\s+(.+)$/);
    if (m) delete _tokens[m[1]];
    res.json(ok({ success: true }));
});
app.get('/api/auth/me', (req, res) => {
    const u = _authUser(req);
    if (!u) return res.status(401).json({ code: 1, msg: '未登录' });
    res.json(ok(_userPublic(u)));
});
app.post('/api/auth/wechat-login', (req, res) => {
    const code = (req.body || {}).code;
    if (!code) return res.status(400).json({ code: 1, msg: '缺少 code' });
    // 演示：以 code 生成临时微信用户
    const username = 'wx_' + code.slice(0, 8);
    let u = _users[username];
    if (!u) {
        u = { id: _newUserId(), username, password: '', name: '微信用户', grade: '高三', province: '浙江', openid: code };
        _users[username] = u;
    }
    const token = _newToken(); _tokens[token] = u.id;
    res.json(ok({ token, user_id: u.id, user: _userPublic(u), is_new: !u.password }));
});
// ===== 微信扫码登录 =====
const _qrScenes = {};  // sceneId -> { status, openid, created_at, mock_openid }
function _newSceneId() { return 'sc_' + Math.random().toString(36).slice(2, 10); }
app.get('/api/auth/wechat-qrcode', (req, res) => {
    const sceneId = _newSceneId();
    _qrScenes[sceneId] = { status: 'waiting', openid: '', created_at: Date.now() };
    res.json(ok({
        scene_id: sceneId,
        qrcode_url: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><rect width='220' height='220' fill='%23fff'/><text x='50%25' y='50%25' font-size='14' text-anchor='middle'>扫码登录</text></svg>`,
        expires_in: 300
    }));
});
app.get('/api/auth/wechat-qrcode-status', (req, res) => {
    const s = _qrScenes[req.query.scene_id];
    if (!s) return res.status(404).json({ code: 1, msg: '场景不存在或已过期' });
    res.json(ok({ scene_id: req.query.scene_id, status: s.status, openid: s.openid || '' }));
});
app.post('/api/auth/wechat-mock-scan', (req, res) => {
    const { scene_id, action, mock_openid } = (req.body || {});
    const s = _qrScenes[scene_id];
    if (!s) return res.status(404).json({ code: 1, msg: '场景不存在或已过期' });
    if (action === 'scan') {
        s.status = 'scanned';
        s.openid = mock_openid || ('mock_' + Math.random().toString(36).slice(2, 10));
    } else if (action === 'confirm') {
        s.status = 'confirmed';
    } else if (action === 'cancel') {
        s.status = 'canceled';
    }
    res.json(ok({ scene_id, status: s.status }));
});
app.post('/api/auth/wechat-qrcode-cancel', (req, res) => {
    const s = _qrScenes[(req.body || {}).scene_id];
    if (s) s.status = 'canceled';
    res.json(ok({ success: true }));
});
app.post('/api/auth/wechat-qrcode-refresh', (req, res) => {
    const sceneId = (req.body || {}).scene_id || _newSceneId();
    _qrScenes[sceneId] = { status: 'waiting', openid: '', created_at: Date.now() };
    res.json(ok({
        scene_id: sceneId,
        qrcode_url: `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><rect width='220' height='220' fill='%23fff'/><text x='50%25' y='50%25' font-size='14' text-anchor='middle'>扫码登录</text></svg>`,
        expires_in: 300
    }));
});
app.post('/api/auth/sms-send', (req, res) => {
    const phone = (req.body || {}).phone;
    if (!phone || !/^1\d{10}$/.test(phone)) return res.status(400).json({ code: 1, msg: '手机号不合法' });
    // 演示：固定验证码 8888
    res.json(ok({ success: true, expires_in: 300, _dev_code: '8888' }));
});
app.post('/api/auth/sms-login', (req, res) => {
    const { phone, code } = (req.body || {});
    if (!phone || !code) return res.status(400).json({ code: 1, msg: '缺少参数' });
    if (code !== '8888') return res.status(401).json({ code: 1, msg: '验证码错误' });
    let u = Object.values(_users).find(x => x.username === phone);
    if (!u) {
        u = { id: _newUserId(), username: phone, password: '', name: '手机用户', grade: '高三', province: '浙江', phone };
        _users[phone] = u;
    }
    const token = _newToken(); _tokens[token] = u.id;
    res.json(ok({ token, user_id: u.id, user: _userPublic(u), is_new: !u.password }));
});
app.post('/api/auth/parent-bind', (req, res) => {
    const { student_phone, parent_phone, relation, sms_code } = (req.body || {});
    if (!student_phone || !parent_phone) return res.status(400).json({ code: 1, msg: '学生/家长手机号必填' });
    if (sms_code && sms_code !== '8888') return res.status(401).json({ code: 1, msg: '短信验证码错误' });
    res.json(ok({
        binding_id: 'b_' + Math.random().toString(36).slice(2, 10),
        student_phone, parent_phone, relation: relation || '父',
        status: sms_code ? 'active' : 'pending',
        created_at: new Date().toISOString()
    }));
});
app.get('/api/auth/parent-bindings', (req, res) => {
    res.json(ok([]));
});
app.post('/api/auth/parent-bindings/:id/confirm', (req, res) => {
    res.json(ok({ binding_id: req.params.id, status: 'active', confirmed_at: new Date().toISOString() }));
});

// ========== 题库导入 ==========
app.post('/api/questions/import', (req, res) => {
    const { format, data } = (req.body || {});
    if (!data) return res.status(400).json({ code: 1, msg: '缺少数据' });
    // 演示：返回导入统计（不真实落库）
    const count = Array.isArray(data) ? data.length : (typeof data === 'string' ? data.split('\n').filter(Boolean).length : 1);
    res.json(ok({
        format: format || 'json',
        imported: count,
        skipped: 0,
        imported_at: new Date().toISOString()
    }));
});

// ========== 学情扩展 ==========
app.get('/api/learning/:userId/review-progress', (req, res) => {
    res.json(ok({
        user_id: req.params.userId,
        total_points: 120,
        reviewed: 78,
        reviewing: 22,
        not_started: 20,
        review_rate: 0.65,
        next_review: ['导数应用专题', '电磁感应综合题', '有机推断题型']
    }));
});
app.get('/api/learning/:userId/today-tasks', (req, res) => {
    const _now = new Date();
    const _w = ['日', '一', '二', '三', '四', '五', '六'];
    const dateStr = `${_now.getMonth() + 1}月${_now.getDate()}日 周${_w[_now.getDay()]}`;
    res.json(ok({
        date: dateStr,
        tasks: [
            { subject: '语文', color: 'red', icon: 'fa-book', knowledge_point_id: 'kp_chn_01', point: '古诗文鉴赏', difficulty: '困难', time: '32min', questions_count: 10, status: 'todo' },
            { subject: '物理', color: 'purple', icon: 'fa-atom', knowledge_point_id: 'kp_phy_02', point: '力学综合', difficulty: '困难', time: '28min', questions_count: 6, status: 'todo' },
            { subject: '数学', color: 'blue', icon: 'fa-square-root-variable', knowledge_point_id: 'kp_math_01', point: '圆锥曲线综合', difficulty: '困难', time: '47min', questions_count: 22, status: 'todo' },
            { subject: '数学', color: 'blue', icon: 'fa-square-root-variable', knowledge_point_id: 'kp_math_02', point: '导数第二问', difficulty: '困难', time: '41min', questions_count: 17, status: 'todo' }
        ],
        done_count: 0,
        total_count: 4,
        completion_rate: 0
    }));
});
app.get('/api/learning/:userId/duration-stats', (req, res) => {
    const _now = new Date();
    const _w = ['日', '一', '二', '三', '四', '五', '六'];
    const _dayIdx = (_now.getDay() + 6) % 7; // 周一为0
    const _weekHours = [2.1, 2.8, 3.5, 2.0, 2.6, 1.4, 3.2];
    const _total = _weekHours.reduce((s, v) => s + v, 0);
    const _today = _weekHours[_dayIdx];
    res.json(ok({
        today: { duration_min: Math.round(_today * 60), duration_hours: _today, change_pct: 12, daily_goal_hours: 6, goal_rate: Math.round(_today / 6 * 100) },
        summary: { week_hours: _total, week_change: 8, month_hours: _total * 4, month_change: 5, avg_hours: Math.round(_total / 7 * 10) / 10, avg_change: 6 },
        weekly: _weekHours.map((h, i) => ({ day: ['一', '二', '三', '四', '五', '六', '日'][i], date: new Date(_now.getTime() - (_dayIdx - i) * 86400000).toISOString().slice(0, 10), hours: h, min: Math.round(h * 60), is_today: i === _dayIdx })),
        week_total_hours: _total,
        week_goal_hours: 42,
        week_goal_rate: Math.round(_total / 42 * 100),
        subjects: [
            { subject: '数学', hours: 5.2, color: '#3B82F6' },
            { subject: '物理', hours: 3.8, color: '#F59E0B' },
            { subject: '英语', hours: 3.1, color: '#10B981' },
            { subject: '化学', hours: 2.4, color: '#8B5CF6' }
        ],
        subject_total_hours: 14.5,
        heatmap: []
    }));
});
app.get('/api/learning/:userId/daily-series', (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const subject = req.query.subject;
    const series = [];
    const labels = [];
    const duration_minutes = [];
    const answer_count = [];
    const correct_rate = [];
    const _now = Date.now();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(_now - i * 86400000);
        const dateStr = d.toISOString().slice(0, 10);
        const label = (d.getMonth() + 1) + '/' + d.getDate();
        const hours = Math.round((1.5 + Math.random() * 2.5) * 10) / 10;
        const questions = Math.floor(20 + Math.random() * 40);
        const rate = Math.floor(60 + Math.random() * 35);
        series.push({ date: dateStr, hours, questions, correct_rate: rate, subject: subject || '全部' });
        labels.push(label);
        duration_minutes.push(Math.round(hours * 60));
        answer_count.push(questions);
        correct_rate.push(rate);
    }
    // 字段对齐前端 renderAnalysisScoreTrend：daily.labels/duration_minutes, answerTrend.labels/answer_count/correct_rate
    res.json(ok({ days, subject: subject || '全部', series, labels, duration_minutes, answer_count, correct_rate }));
});
app.get('/api/learning/:userId/subject-mastery', (req, res) => {
    const days = parseInt(req.query.days) || 30;
    // 字段对齐前端 renderAnalysisRadar：
    //   radar[] 用于学科掌握详情（current_mastery/target_mastery/color/icon/duration_hours/questions_count/correct_rate）
    //   radar_labels/radar_current/radar_target 用于 Chart.js 雷达图
    const subjects = [
        { subject: '数学', current_mastery: 68, target_mastery: 85, color: '#3B82F6', icon: 'fa-square-root-variable', duration_hours: 5.3, questions_count: 486, correct_rate: 72 },
        { subject: '语文', current_mastery: 75, target_mastery: 80, color: '#EF4444', icon: 'fa-book-open', duration_hours: 4.7, questions_count: 412, correct_rate: 75 },
        { subject: '英语', current_mastery: 80, target_mastery: 85, color: '#10B981', icon: 'fa-language', duration_hours: 5.8, questions_count: 538, correct_rate: 79 },
        { subject: '物理', current_mastery: 71, target_mastery: 82, color: '#8B5CF6', icon: 'fa-atom', duration_hours: 4.0, questions_count: 367, correct_rate: 78 },
        { subject: '化学', current_mastery: 66, target_mastery: 80, color: '#F59E0B', icon: 'fa-flask', duration_hours: 3.5, questions_count: 325, correct_rate: 85 },
        { subject: '生物', current_mastery: 70, target_mastery: 78, color: '#06B6D4', icon: 'fa-dna', duration_hours: 3.0, questions_count: 274, correct_rate: 70 },
        { subject: '政治', current_mastery: 73, target_mastery: 80, color: '#DC2626', icon: 'fa-landmark', duration_hours: 2.5, questions_count: 198, correct_rate: 76 },
        { subject: '历史', current_mastery: 76, target_mastery: 82, color: '#7C3AED', icon: 'fa-landmark-flag', duration_hours: 2.8, questions_count: 215, correct_rate: 78 },
        { subject: '地理', current_mastery: 74, target_mastery: 80, color: '#0891B2', icon: 'fa-earth-asia', duration_hours: 2.6, questions_count: 188, correct_rate: 75 }
    ];
    res.json(ok({
        days,
        // 学科掌握详情数据（前端变量名为 radar）
        radar: subjects,
        // 雷达图数据（Chart.js labels + 两条 dataset）
        radar_labels: subjects.map(s => s.subject),
        radar_current: subjects.map(s => s.current_mastery),
        radar_target: subjects.map(s => s.target_mastery),
        subjects: subjects.map(s => ({ subject: s.subject, mastery: s.current_mastery / 100, change: 0.05 })),
        weakest_subjects: subjects.filter(s => s.target_mastery - s.current_mastery >= 10).sort((a, b) => (b.target_mastery - b.current_mastery) - (a.target_mastery - a.current_mastery)).map(s => ({ ...s, gap: s.target_mastery - s.current_mastery, current: s.current_mastery, target: s.target_mastery })),
        strongest_subjects: subjects.filter(s => s.target_mastery - s.current_mastery < 8).sort((a, b) => b.current_mastery - a.current_mastery).map(s => ({ ...s, gap: Math.max(0, s.target_mastery - s.current_mastery), current: s.current_mastery, target: s.target_mastery }))
    }));
});

// ========== 答题分析 ==========
app.get('/api/answers/:userId/trend-series', (req, res) => {
    const days = parseInt(req.query.days) || 14;
    const series = [];
    const labels = [];
    const answer_count = [];
    const correct_rate = [];
    const _now = Date.now();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(_now - i * 86400000);
        const dateStr = d.toISOString().slice(0, 10);
        const label = (d.getMonth() + 1) + '/' + d.getDate();
        const rate = Math.round((0.65 + Math.random() * 0.25) * 100);
        const total = Math.floor(15 + Math.random() * 30);
        series.push({ date: dateStr, correct_rate: rate / 100, total });
        labels.push(label);
        answer_count.push(total);
        correct_rate.push(rate);
    }
    // 字段对齐前端 renderAnalysisScoreTrend：answerTrend.labels/answer_count/correct_rate
    res.json(ok({ days, series, labels, answer_count, correct_rate }));
});
app.get('/api/answers/:userId/loss-analysis', (req, res) => {
    const days = parseInt(req.query.days) || 30;
    const limit = parseInt(req.query.limit) || 10;
    res.json(ok({
        days, limit,
        items: MOCK.weakPoints.slice(0, limit).map(k => ({
            knowledge_point_id: k.id,
            subject: k.subject,
            point: k.name,
            loss_score: Math.round((1 - k.mastery_rate) * 20),
            total_wrong: k.total_questions - k.correct_count,
            mastery_rate: k.mastery_rate
        }))
    }));
});

// ========== 预测扩展 ==========
app.get('/api/predict/:userId/score-trend', (req, res) => {
    const days = parseInt(req.query.days) || 60;
    const series = [];
    const labels = [];
    const history = [];
    const predict = [];
    const _now = Date.now();
    const total = days;
    const historyPortion = Math.floor(total * 0.6); // 前 60% 为历史真实分
    let score = 565;
    for (let i = total - 1; i >= 0; i--) {
        const d = new Date(_now - i * 86400000);
        const dateStr = d.toISOString().slice(0, 10);
        const label = (d.getMonth() + 1) + '/' + d.getDate();
        labels.push(label);
        score += Math.round((Math.random() - 0.3) * 3);
        if (score < 480) score = 480 + Math.floor(Math.random() * 10);
        if (score > 640) score = 640 - Math.floor(Math.random() * 10);
        series.push({ date: dateStr, estimated_score: score });
        if (i >= total - historyPortion) {
            // 历史真实分
            history.push(score);
            predict.push(null);
        } else {
            // 未来预测分
            history.push(null);
            predict.push(score + Math.round((Math.random() - 0.4) * 5));
        }
    }
    // 字段对齐前端 renderAnalysisScoreTrend：labels/history/predict/target_score/yiben_line/current_score
    res.json(ok({
        days,
        current_score: score,
        target_score: 620,
        yiben_line: 520,
        labels,
        history,
        predict,
        series
    }));
});

// ========== 推荐扩展 ==========
app.get('/api/recommend/:userId/week-plan', (req, res) => {
    const shuffle = req.query.shuffle === '1';
    const range = req.query.range || 'this_week';
    // 候选任务池：覆盖多学科多知识点，模拟 AI 个性化推荐
    const taskPool = [
        { subject: '数学', point: '导数应用专题', time: '40min', priority: '高', color: 'blue' },
        { subject: '数学', point: '圆锥曲线综合', time: '45min', priority: '高', color: 'blue' },
        { subject: '数学', point: '概率统计', time: '30min', priority: '中', color: 'blue' },
        { subject: '数学', point: '立体几何向量法', time: '35min', priority: '中', color: 'blue' },
        { subject: '数学', point: '数列求和方法', time: '30min', priority: '中', color: 'blue' },
        { subject: '物理', point: '电磁感应', time: '30min', priority: '中', color: 'purple' },
        { subject: '物理', point: '力学综合分析', time: '35min', priority: '高', color: 'purple' },
        { subject: '物理', point: '动量与冲量', time: '28min', priority: '中', color: 'purple' },
        { subject: '物理', point: '光学与原子物理', time: '25min', priority: '低', color: 'purple' },
        { subject: '英语', point: '完形填空技巧', time: '25min', priority: '中', color: 'green' },
        { subject: '英语', point: '阅读理解推理题', time: '30min', priority: '高', color: 'green' },
        { subject: '英语', point: '书面表达高级句式', time: '35min', priority: '高', color: 'green' },
        { subject: '英语', point: '语法填空', time: '20min', priority: '中', color: 'green' },
        { subject: '化学', point: '有机推断题型', time: '30min', priority: '高', color: 'orange' },
        { subject: '化学', point: '化学平衡计算', time: '28min', priority: '中', color: 'orange' },
        { subject: '化学', point: '电化学原理', time: '25min', priority: '中', color: 'orange' },
        { subject: '化学', point: '实验综合分析', time: '32min', priority: '高', color: 'orange' },
        { subject: '语文', point: '古诗文鉴赏', time: '30min', priority: '中', color: 'red' },
        { subject: '语文', point: '现代文阅读理解', time: '35min', priority: '高', color: 'red' },
        { subject: '语文', point: '作文立意深度', time: '40min', priority: '高', color: 'red' }
    ];
    // 随机抽取函数（不重复）
    function pickTasks(pool, n) {
        const arr = [...pool];
        const result = [];
        for (let i = 0; i < n && arr.length; i++) {
            const idx = Math.floor(Math.random() * arr.length);
            result.push(arr.splice(idx, 1)[0]);
        }
        return result;
    }
    let days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    if (shuffle) days = days.sort(() => Math.random() - 0.5);
    res.json(ok({
        range,
        shuffle: !!shuffle,
        days: days.map((d, i) => ({
            day: d,
            // 每天抽取 1-3 个任务（shuffle 时使用随机抽取，否则用固定模式）
            tasks: shuffle ? pickTasks(taskPool, Math.floor(Math.random() * 3) + 1) : pickTasks(taskPool, (i % 3) + 1)
        }))
    }));
});

// ========== 教师上传 ==========
const multer = require('multer');
const _upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
app.post('/api/teacher/upload', _upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ code: 1, msg: '缺少上传文件' });
    res.json(ok({
        file_name: req.file.originalname,
        size: req.file.size,
        mime: req.file.mimetype,
        uploaded_at: new Date().toISOString(),
        paper_id: 'p_' + Math.random().toString(36).slice(2, 10),
        ocr_pending: true
    }));
});

// ========== 页面数据保存 ==========
app.put('/api/page-data/:key', (req, res) => {
    const key = req.params.key;
    const data = (req.body || {}).data;
    if (!data) return res.status(400).json({ code: 1, msg: '缺少 data' });
    const filePath = path.join(__dirname, 'data', 'pages', `${key}.json`);
    const content = JSON.stringify(data, null, 2);
    fs.writeFile(filePath, content, 'utf8', (err) => {
        if (err) return res.status(500).json({ code: 1, msg: '保存失败', error: err.message });
        res.json(ok({ key, saved: true, saved_at: new Date().toISOString() }));
    });
});

// ========== 模块配置扩展 ==========
const _moduleConfigs = {};  // key -> config
app.put('/api/modules', (req, res) => {
    const modules = (req.body || {}).modules || [];
    (Array.isArray(modules) ? modules : []).forEach(m => {
        if (m && m.key) _moduleConfigs[m.key] = m;
    });
    res.json(ok({ saved: true, count: (Array.isArray(modules) ? modules : []).length, saved_at: new Date().toISOString() }));
});
app.delete('/api/modules/:key', (req, res) => {
    delete _moduleConfigs[req.params.key];
    res.json(ok({ key: req.params.key, reset: true }));
});
app.post('/api/modules/:key/import', (req, res) => {
    const { format, data } = (req.body || {});
    if (!data) return res.status(400).json({ code: 1, msg: '缺少 data' });
    const count = Array.isArray(data) ? data.length : (typeof data === 'string' ? data.split('\n').filter(Boolean).length : 1);
    res.json(ok({ key: req.params.key, format: format || 'json', imported: count, imported_at: new Date().toISOString() }));
});

// 根路径重定向到 prototype
app.get('/', (req, res) => res.redirect('/prototype/'));

// 静态托管（放在 API 路由之后，避免拦截 /api 请求）
app.use('/prototype', express.static(path.join(__dirname, '..', 'prototype')));
app.use('/', express.static(path.join(__dirname, '..', 'dist')));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI高考后端服务已启动: http://localhost:${PORT}`);
    console.log(`产品原型端: http://localhost:${PORT}/prototype/`);
    console.log(`API 示例: http://localhost:${PORT}/api/page-data/college-recommend`);
});
