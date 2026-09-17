// ========== 高频考点路由 ==========
// 高频考点列表 + 命题趋势 + 配套练习题
// 对应原型：practice-hotpoints
const express = require('express');
const router = express.Router();
const db = require('../db');

// 高频考点预定义数据
const HOTPOINTS = [
    { id: 'hp_math_001', subject: '数学', point: '导数综合应用', frequency: 18, appear_years: [2020, 2021, 2022, 2023, 2024, 2025], trend: 'rising', score_avg: 14, difficulty: 4, mastery_rate: 0.52 },
    { id: 'hp_math_002', subject: '数学', point: '圆锥曲线综合', frequency: 15, appear_years: [2020, 2022, 2023, 2024, 2025], trend: 'stable', score_avg: 12, difficulty: 5, mastery_rate: 0.17 },
    { id: 'hp_math_003', subject: '数学', point: '概率统计', frequency: 12, appear_years: [2020, 2021, 2023, 2024, 2025], trend: 'rising', score_avg: 10, difficulty: 3, mastery_rate: 0.65 },
    { id: 'hp_math_004', subject: '数学', point: '数列综合', frequency: 10, appear_years: [2021, 2022, 2024, 2025], trend: 'stable', score_avg: 10, difficulty: 4, mastery_rate: 0.55 },
    { id: 'hp_phy_001', subject: '物理', point: '电磁感应综合', frequency: 16, appear_years: [2020, 2021, 2022, 2023, 2024, 2025], trend: 'rising', score_avg: 12, difficulty: 4, mastery_rate: 0.45 },
    { id: 'hp_phy_002', subject: '物理', point: '牛顿运动定律', frequency: 14, appear_years: [2020, 2021, 2022, 2023, 2024], trend: 'stable', score_avg: 10, difficulty: 3, mastery_rate: 0.70 },
    { id: 'hp_chem_001', subject: '化学', point: '化学平衡', frequency: 13, appear_years: [2020, 2022, 2023, 2024, 2025], trend: 'stable', score_avg: 10, difficulty: 4, mastery_rate: 0.60 },
    { id: 'hp_bio_001', subject: '生物', point: '遗传综合', frequency: 11, appear_years: [2021, 2022, 2023, 2024, 2025], trend: 'rising', score_avg: 10, difficulty: 4, mastery_rate: 0.50 },
    { id: 'hp_chinese_001', subject: '语文', point: '文言文阅读', frequency: 17, appear_years: [2020, 2021, 2022, 2023, 2024, 2025], trend: 'stable', score_avg: 19, difficulty: 3, mastery_rate: 0.62 },
    { id: 'hp_english_001', subject: '英语', point: '阅读理解', frequency: 20, appear_years: [2020, 2021, 2022, 2023, 2024, 2025], trend: 'rising', score_avg: 30, difficulty: 3, mastery_rate: 0.68 }
];

// GET /api/practice/hotpoints
// 高频考点列表
router.get('/', (req, res) => {
    const { subject } = req.query;
    const limit = Math.min(50, parseInt(req.query.limit) || 10);

    let list = HOTPOINTS.slice();
    if (subject) list = list.filter(h => h.subject === subject);
    list.sort((a, b) => b.frequency - a.frequency);
    list = list.slice(0, limit);

    res.json({ code: 0, data: list, total: list.length });
});

// GET /api/practice/hotpoints/:subject/trend
// 命题趋势
router.get('/:subject/trend', (req, res) => {
    const { subject } = req.params;
    const years = parseInt(req.query.years) || 5;
    const currentYear = new Date().getFullYear();
    const yearList = [];
    for (let i = years - 1; i >= 0; i--) yearList.push(currentYear - i);

    const list = HOTPOINTS.filter(h => h.subject === subject);
    const series = list.map(h => {
        const frequency = yearList.map(y => h.appear_years.includes(y) ? Math.ceil(h.frequency / h.appear_years.length) : 0);
        const firstFreq = frequency[0] || 1;
        const lastFreq = frequency[frequency.length - 1] || 1;
        const changePct = Math.round((lastFreq - firstFreq) / firstFreq * 100);
        return {
            point: h.point,
            frequency,
            years: yearList,
            trend: h.trend,
            change_pct: changePct
        };
    });

    res.json({
        code: 0,
        data: {
            subject,
            series
        }
    });
});

// GET /api/practice/hotpoints/:point_id/questions
// 配套练习题
router.get('/:point_id/questions', (req, res) => {
    const { point_id } = req.params;
    const count = Math.min(20, parseInt(req.query.count) || 5);

    const hp = HOTPOINTS.find(h => h.id === point_id);
    if (!hp) return res.status(404).json({ code: 1015, msg: '高频考点不存在' });

    // 从题库取该学科题目
    const candidates = db.list('questions').filter(q => q.subject === hp.subject);
    const questions = (candidates.length > 0 ? candidates : []).slice(0, count).map((q, i) => ({
        id: q.id,
        year: 2025,
        province: '全国甲卷',
        type: q.type || '解答题',
        difficulty: q.difficulty || 4,
        content: q.content ? q.content.slice(0, 60) + '...' : '示例题目'
    }));

    // 题库不足时补充示例题
    while (questions.length < count) {
        questions.push({
            id: 'q_hp_' + Date.now() + '_' + questions.length,
            year: 2025,
            province: '全国甲卷',
            type: ['选择题', '填空题', '解答题'][questions.length % 3],
            difficulty: hp.difficulty,
            content: hp.point + ' 示例题 ' + (questions.length + 1)
        });
    }

    res.json({ code: 0, data: questions, total: questions.length });
});

module.exports = router;
