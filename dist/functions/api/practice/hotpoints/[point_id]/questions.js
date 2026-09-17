// GET /api/practice/hotpoints/:point_id/questions?count= — 配套练习题
// 对应后端 backend/routes/practice-hotpoints.js 中的 router.get('/:point_id/questions')
import { listTable } from '../../../../_shared/kv-db.js';

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

export async function onRequestGet({ params, env, request }) {
    try {
        const { point_id } = params;
        const url = new URL(request.url);
        const count = Math.min(20, parseInt(url.searchParams.get('count')) || 5);

        const hp = HOTPOINTS.find(h => h.id === point_id);
        if (!hp) {
            return Response.json({ code: 1015, msg: '高频考点不存在' }, { status: 404 });
        }

        // 从题库取该学科题目
        const candidates = (await listTable(env, 'questions')).filter(q => q.subject === hp.subject);
        const questions = candidates.slice(0, count).map(q => ({
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

        return Response.json({ code: 0, data: questions, total: questions.length });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载配套练习题失败: ' + e.message }, { status: 500 });
    }
}
