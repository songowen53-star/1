// GET /api/practice/hotpoints?subject=&limit= — 高频考点列表
// 对应后端 backend/routes/practice-hotpoints.js 中的 router.get('/')

// 高频考点预定义数据（与后端保持一致）
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

export async function onRequestGet({ request }) {
    try {
        const url = new URL(request.url);
        const subject = url.searchParams.get('subject');
        const limit = Math.min(50, parseInt(url.searchParams.get('limit')) || 10);

        let list = HOTPOINTS.slice();
        if (subject) list = list.filter(h => h.subject === subject);
        list.sort((a, b) => b.frequency - a.frequency);
        list = list.slice(0, limit);

        return Response.json({ code: 0, data: list, total: list.length });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载高频考点失败: ' + e.message }, { status: 500 });
    }
}
