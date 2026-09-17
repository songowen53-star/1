// 为浏览器三个核心模块生成 secrets 数据文件
// 每个文件包含：模块标识、版本、更新时间、数据源、交互元数据、完整数据
const fs = require('fs');
const path = require('path');

const SECRETS_DIR = '/workspace/secrets';
const PAGES_DIR = '/workspace/backend/data/pages';

// 三个目标模块配置
const MODULES = [
    {
        key: 'profile-main',
        name: '个人中心',
        version: '20260824A',
        source: 'backend/data/pages/profile-main.json',
        interactions: [
            { id: 'navigate-to-profile', type: 'navigation', desc: '从首页底部 Tab「我的」进入个人中心页面' },
            { id: 'show-user-info', type: 'display', desc: '显示用户信息（李同学、VIP、高三、浙江）' },
            { id: 'calc-days-to-gaokao', type: 'dynamic', desc: '动态计算距2027高考倒计时（297天），与首页 getNextGaokao 同算法' },
            { id: 'show-target-score', type: 'display', desc: '显示目标分数620、当前估分580' },
            { id: 'show-learning-stats', type: 'display', desc: '显示学习数据概览：累计学习186h、做题量3267、正确率78%' },
            { id: 'menu-vip', type: 'click', desc: '点击「VIP会员」菜单项' },
            { id: 'menu-report', type: 'click', desc: '点击「学习报告」菜单项' },
            { id: 'menu-parent', type: 'click', desc: '点击「家长中心」菜单项' },
            { id: 'menu-settings', type: 'click', desc: '点击「设置」菜单项' }
        ]
    },
    {
        key: 'home-plan',
        name: 'AI智能学习计划',
        version: '20260824A',
        source: 'prototype/js/design-system.js (WEEK_PLAN_MOCK)',
        interactions: [
            { id: 'navigate-to-plan', type: 'navigation', desc: '从首页点击「AI学习计划」卡片进入 home-plan 页面' },
            { id: 'load-week-plan', type: 'async-load', desc: '异步加载 WEEK_PLAN_MOCK，显示本周7天14个任务' },
            { id: 'filter-week', type: 'tab', desc: '点击「本周/下周/本月」Tab 切换（本周为默认）' },
            { id: 'task-detail', type: 'click', desc: '点击任务卡片弹出详情 Modal（科目、知识点、时间、题量、状态）' },
            { id: 'toggle-task', type: 'click', desc: '点击圆形勾选框 toggleTask，切换任务完成状态（边框/背景/✓图标）' },
            { id: 'ai-replan', type: 'click', desc: '点击「让AI重新规划」按钮 aiReplan()，重新生成学习计划' }
        ]
    },
    {
        key: 'practice-real-exam',
        name: '智能刷题-真题',
        version: '20260818C',
        source: 'backend/data/pages/practice-real-exam.json (从 D:\\高考数据库 导入)',
        interactions: [
            { id: 'navigate-to-exam', type: 'navigation', desc: '从首页「智能刷题」→「真题」进入 practice-real-exam 页面' },
            { id: 'load-exam-data', type: 'async-load', desc: '异步加载真题数据，显示9个科目+5个年份+93道真题（含 D:\\高考数据库 导入的43道）' },
            { id: 'filter-by-subject', type: 'click', desc: '点击科目按钮 filterPracticeExamBySubject(idx)，筛选对应科目真题（高亮蓝色）' },
            { id: 'filter-by-year', type: 'click', desc: '点击年份按钮 filterPracticeExamByYear(year)，筛选对应年份真题（再次点击取消）' },
            { id: 'dual-filter', type: 'combined', desc: '科目+年份双重筛选，实时更新「共找到 N 道真题」和题目列表' },
            { id: 'exam-detail', type: 'click', desc: '点击真题卡片 openPracticeExamDetail(idx)，弹出详情Modal（题干+选项+答案+解析）' },
            { id: 'show-answer', type: 'click', desc: '在详情Modal中点击「查看答案」按钮显示参考答案' },
            { id: 'show-analysis', type: 'click', desc: '在详情Modal中点击「查看解析」按钮显示详细解析' }
        ]
    }
];

// 确保目录存在
if (!fs.existsSync(SECRETS_DIR)) {
    fs.mkdirSync(SECRETS_DIR, { recursive: true });
}

const now = new Date().toISOString();
let created = 0;

MODULES.forEach(function (mod) {
    // 读取对应的页面数据
    let pageData = null;
    const pageFile = path.join(PAGES_DIR, mod.key + '.json');
    if (fs.existsSync(pageFile)) {
        try {
            pageData = JSON.parse(fs.readFileSync(pageFile, 'utf8'));
        } catch (e) {
            console.error('读取 ' + pageFile + ' 失败: ' + e.message);
        }
    }

    // 特殊处理：home-plan 的数据来自 design-system.js 的 WEEK_PLAN_MOCK
    if (mod.key === 'home-plan' && pageData === null) {
        // 直接写入 WEEK_PLAN_MOCK 数据（与 design-system.js 中定义一致）
        pageData = {
            week_plan: [
                { day: '周一', date: '8月10日', isToday: true, tasks: [
                    { subject: '语文', color: 'red', point: '古诗文鉴赏', time: '32min', questions_count: 10, done: false },
                    { subject: '物理', color: 'purple', point: '力学综合', time: '28min', questions_count: 8, done: false },
                    { subject: '数学', color: 'blue', point: '圆锥曲线综合', time: '47min', questions_count: 12, done: false }
                ]},
                { day: '周二', date: '8月11日', isToday: false, tasks: [
                    { subject: '英语', color: 'green', point: '完形填空专项', time: '35min', questions_count: 10, done: false },
                    { subject: '化学', color: 'orange', point: '氧化还原反应', time: '40min', questions_count: 8, done: false }
                ]},
                { day: '周三', date: '8月12日', isToday: false, tasks: [
                    { subject: '数学', color: 'blue', point: '导数与极值', time: '45min', questions_count: 10, done: false },
                    { subject: '物理', color: 'purple', point: '电磁感应综合', time: '38min', questions_count: 8, done: false }
                ]},
                { day: '周四', date: '8月13日', isToday: false, tasks: [
                    { subject: '语文', color: 'red', point: '现代文阅读', time: '30min', questions_count: 8, done: false },
                    { subject: '英语', color: 'green', point: '阅读理解D篇', time: '32min', questions_count: 5, done: false }
                ]},
                { day: '周五', date: '8月14日', isToday: false, tasks: [
                    { subject: '数学', color: 'blue', point: '概率统计', time: '40min', questions_count: 8, done: false },
                    { subject: '化学', color: 'orange', point: '化学平衡', time: '35min', questions_count: 6, done: false }
                ]},
                { day: '周六', date: '8月15日', isToday: false, tasks: [
                    { subject: '综合', color: 'purple', point: '理科综合模拟', time: '90min', questions_count: 21, done: false }
                ]},
                { day: '周日', date: '8月16日', isToday: false, tasks: [
                    { subject: '综合', color: 'orange', point: '错题回顾与总结', time: '60min', questions_count: 15, done: false }
                ]}
            ],
            total_tasks: 14,
            done_tasks: 0,
            estimated_score_gain: 18,
            weak_point_count: 8,
            replanned: false
        };
    }

    if (!pageData) {
        console.error('模块 ' + mod.key + ' 无数据，跳过');
        return;
    }

    // 构建 secrets 文件内容
    const secretsContent = {
        module: mod.key,
        name: mod.name,
        version: mod.version,
        updated_at: now,
        source: mod.source,
        browser_url: 'http://localhost:8788/prototype/index.html',
        cloud_url: 'https://ai-gaokao-static.pages.dev/prototype/index.html',
        interactions: mod.interactions,
        interaction_count: mod.interactions.length,
        data: pageData
    };

    const outFile = path.join(SECRETS_DIR, mod.key + '.json');
    fs.writeFileSync(outFile, JSON.stringify(secretsContent, null, 2), 'utf8');
    created++;
    console.log('✓ 创建 ' + mod.key + '.json (' + mod.interactions.length + ' 个交互)');
});

console.log('\n=== secrets 目录更新完成 ===');
console.log('已创建/更新 ' + created + ' 个模块数据文件');
console.log('目录: ' + SECRETS_DIR);
console.log('\nsecrets 目录现有文件:');
fs.readdirSync(SECRETS_DIR).forEach(function (f) {
    const stat = fs.statSync(path.join(SECRETS_DIR, f));
    console.log('  ' + f + ' (' + Math.round(stat.size / 1024) + 'KB)');
});
