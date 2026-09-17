// ============================================================
// 运营后台模块 - pages-admin.js（动态加载：数据来自 /api/page-data/:key）
// ============================================================

// 后台菜单常量
const ADMIN_MENU = [
    { key: 'dashboard', icon: 'fa-tachometer-alt', label: '数据看板', page: 'admin-dashboard' },
    { key: 'users', icon: 'fa-users', label: '用户管理', page: 'admin-users' },
    { key: 'members', icon: 'fa-crown', label: '会员管理', page: 'admin-members' },
    { key: 'exams', icon: 'fa-file-alt', label: '真题管理', page: 'admin-exams' },
    { key: 'ocr-review', icon: 'fa-image', label: 'OCR审核', page: 'admin-ocr' },
    { key: 'ai-review', icon: 'fa-robot', label: 'AI审核', page: 'admin-ai-review' },
    { key: 'content', icon: 'fa-shield-alt', label: '内容审核', page: 'admin-content' },
    { key: 'banner', icon: 'fa-image', label: 'Banner管理', page: 'admin-banner' },
    { key: 'stats', icon: 'fa-chart-bar', label: '数据统计', page: 'admin-stats' },
    { key: 'retention', icon: 'fa-user-check', label: '留存分析', page: 'admin-retention' }
];

// 卡片网格容器（用于横排统计卡片）
function adminStatGrid(html) {
    return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px;">${html}</div>`;
}

// 后台区块卡片
function adminCard(title, content) {
    return `<div style="background:white;border-radius:12px;padding:18px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        ${title ? `<div style="font-size:15px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;"><span>${title}</span></div>` : ''}
        ${content}
    </div>`;
}

// 加载中占位内容
function adminLoading(key) {
    return `<div id="${key}-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>`;
}

// 内置兜底数据（静态部署 / API不可用时自动使用，确保原型离线可用）
const ADMIN_FALLBACK_DATA = {
    'admin-dashboard': {
        stats: [
            { label: '总用户数', value: '12.5万', change: 8, color: 'blue' },
            { label: '日活跃', value: '3.2万', change: 5, color: 'green' },
            { label: '付费率', value: '18%', change: 3, color: 'orange' },
            { label: '今日收入', value: '￥8.6万', change: 12, color: 'purple' }
        ],
        charts: [
            { title: '用户增长趋势', label: '近30天新增用户趋势折线图', height: 180 },
            { title: '收入趋势', label: '近30天收入趋势柱状图', height: 180 }
        ],
        realtime: [
            { label: '在线用户', value: '1,856', bg: '#EFF6FF', color: '#3B82F6' },
            { label: '今日新增', value: '432', bg: '#F0FDF4', color: '#10B981' },
            { label: '今日订单', value: '128', bg: '#FFF7ED', color: '#F59E0B' },
            { label: 'AI调用', value: '5.2万', bg: '#FDF2F8', color: '#EC4899' }
        ]
    },
    'admin-users': {
        total: 12568,
        filters: { grades: ['全部年级', '高三', '高二', '高一'] },
        users: [
            { name: '张同学', phone: '138****8888', grade: '高三', time: '2026-07-28', status: '正常', avatar: 12 },
            { name: '李明', phone: '139****6666', grade: '高二', time: '2026-07-26', status: '正常', avatar: 33 },
            { name: '王芳', phone: '137****1234', grade: '高三', time: '2026-07-25', status: 'VIP', avatar: 45 },
            { name: '赵磊', phone: '135****5678', grade: '高一', time: '2026-07-20', status: '禁用', avatar: 8 },
            { name: '陈静', phone: '136****9012', grade: '高三', time: '2026-07-15', status: '正常', avatar: 27 }
        ]
    },
    'admin-members': {
        stats: [
            { label: '总会员数', value: '2.3万', change: 0, color: 'blue' },
            { label: '本月新增', value: '856', change: 12, color: 'green' },
            { label: '续费率', value: '72%', change: 4, color: 'orange' }
        ],
        members: [
            { name: '张同学', plan: '年卡', amount: '￥198', start: '2026-01-15', end: '2027-01-15', status: '有效' },
            { name: '王芳', plan: '季卡', amount: '￥68', start: '2026-06-01', end: '2026-09-01', status: '有效' },
            { name: '刘洋', plan: '月卡', amount: '￥28', start: '2026-07-01', end: '2026-08-01', status: '有效' },
            { name: '孙琪', plan: '年卡', amount: '￥198', start: '2025-08-10', end: '2026-08-10', status: '即将到期' },
            { name: '周婷', plan: '季卡', amount: '￥68', start: '2026-04-20', end: '2026-07-20', status: '已过期' }
        ]
    },
    'admin-exams': {
        exams: [
            // 2025
            { year: '2025', province: '浙江', subject: '数学', no: '21', diff: '困难', status: '已发布' },
            { year: '2025', province: '浙江', subject: '物理', no: '18', diff: '中等', status: '已发布' },
            { year: '2025', province: '北京', subject: '语文', no: '15', diff: '中等', status: '已发布' },
            { year: '2025', province: '上海', subject: '英语', no: '22', diff: '中等', status: '审核中' },
            { year: '2025', province: '江苏', subject: '化学', no: '12', diff: '简单', status: '已发布' },
            { year: '2025', province: '广东', subject: '生物', no: '9', diff: '中等', status: '已发布' },
            { year: '2025', province: '山东', subject: '政治', no: '16', diff: '中等', status: '已发布' },
            { year: '2025', province: '河南', subject: '历史', no: '14', diff: '困难', status: '审核中' },
            { year: '2025', province: '四川', subject: '地理', no: '11', diff: '简单', status: '已发布' },
            // 2024
            { year: '2024', province: '浙江', subject: '数学', no: '20', diff: '困难', status: '已发布' },
            { year: '2024', province: '北京', subject: '物理', no: '17', diff: '中等', status: '已发布' },
            { year: '2024', province: '上海', subject: '化学', no: '15', diff: '简单', status: '已发布' },
            { year: '2024', province: '江苏', subject: '语文', no: '13', diff: '中等', status: '已发布' },
            { year: '2024', province: '湖北', subject: '英语', no: '21', diff: '中等', status: '已发布' },
            { year: '2024', province: '湖南', subject: '生物', no: '8', diff: '简单', status: '已发布' },
            { year: '2024', province: '福建', subject: '政治', no: '15', diff: '中等', status: '审核中' },
            { year: '2024', province: '安徽', subject: '历史', no: '13', diff: '中等', status: '已发布' },
            { year: '2024', province: '河北', subject: '地理', no: '10', diff: '简单', status: '已发布' },
            // 2023
            { year: '2023', province: '浙江', subject: '数学', no: '19', diff: '中等', status: '已发布' },
            { year: '2023', province: '北京', subject: '语文', no: '14', diff: '中等', status: '已发布' },
            { year: '2023', province: '上海', subject: '英语', no: '20', diff: '中等', status: '已发布' },
            { year: '2023', province: '江苏', subject: '物理', no: '16', diff: '困难', status: '已发布' },
            { year: '2023', province: '广东', subject: '化学', no: '11', diff: '中等', status: '已发布' },
            { year: '2023', province: '山东', subject: '生物', no: '7', diff: '简单', status: '审核中' },
            { year: '2023', province: '河南', subject: '政治', no: '14', diff: '中等', status: '已发布' },
            // 2022
            { year: '2022', province: '浙江', subject: '物理', no: '16', diff: '中等', status: '已发布' },
            { year: '2022', province: '北京', subject: '数学', no: '18', diff: '困难', status: '已发布' },
            { year: '2022', province: '上海', subject: '化学', no: '14', diff: '中等', status: '已发布' },
            { year: '2022', province: '湖北', subject: '语文', no: '12', diff: '简单', status: '已发布' },
            { year: '2022', province: '四川', subject: '英语', no: '19', diff: '中等', status: '审核中' },
            // 2021
            { year: '2021', province: '江苏', subject: '数学', no: '17', diff: '困难', status: '已发布' },
            { year: '2021', province: '广东', subject: '语文', no: '13', diff: '中等', status: '已发布' },
            { year: '2021', province: '湖南', subject: '物理', no: '15', diff: '中等', status: '已发布' },
            { year: '2021', province: '福建', subject: '英语', no: '18', diff: '简单', status: '已发布' },
            // 2020
            { year: '2020', province: '山东', subject: '数学', no: '16', diff: '中等', status: '已发布' },
            { year: '2020', province: '河南', subject: '化学', no: '10', diff: '简单', status: '已发布' },
            { year: '2020', province: '河北', subject: '生物', no: '6', diff: '中等', status: '审核中' },
            // 2019
            { year: '2019', province: '浙江', subject: '历史', no: '12', diff: '中等', status: '已发布' },
            { year: '2019', province: '北京', subject: '地理', no: '9', diff: '简单', status: '已发布' },
            { year: '2019', province: '四川', subject: '政治', no: '13', diff: '中等', status: '已发布' },
            // 2018
            { year: '2018', province: '上海', subject: '数学', no: '15', diff: '困难', status: '已发布' },
            { year: '2018', province: '江苏', subject: '物理', no: '14', diff: '中等', status: '已发布' },
            // 2017
            { year: '2017', province: '广东', subject: '英语', no: '16', diff: '中等', status: '已发布' },
            { year: '2017', province: '湖北', subject: '化学', no: '9', diff: '简单', status: '已发布' },
            // 2016
            { year: '2016', province: '山东', subject: '语文', no: '11', diff: '中等', status: '已发布' },
            { year: '2016', province: '湖南', subject: '生物', no: '5', diff: '简单', status: '审核中' },
            // 2015
            { year: '2015', province: '浙江', subject: '英语', no: '15', diff: '中等', status: '已发布' },
            { year: '2015', province: '河南', subject: '数学', no: '14', diff: '困难', status: '已发布' },
            // 2014
            { year: '2014', province: '北京', subject: '化学', no: '8', diff: '简单', status: '已发布' },
            { year: '2014', province: '福建', subject: '物理', no: '13', diff: '中等', status: '已发布' },
            // 2013
            { year: '2013', province: '上海', subject: '语文', no: '10', diff: '中等', status: '已发布' },
            { year: '2013', province: '安徽', subject: '政治', no: '12', diff: '中等', status: '已发布' },
            // 2012
            { year: '2012', province: '江苏', subject: '历史', no: '11', diff: '中等', status: '已发布' },
            { year: '2012', province: '四川', subject: '地理', no: '8', diff: '简单', status: '已发布' },
            // 2011
            { year: '2011', province: '广东', subject: '数学', no: '13', diff: '困难', status: '已发布' },
            { year: '2011', province: '河北', subject: '英语', no: '14', diff: '中等', status: '已发布' },
            // 2010
            { year: '2010', province: '浙江', subject: '物理', no: '12', diff: '中等', status: '已发布' },
            { year: '2010', province: '山东', subject: '化学', no: '7', diff: '简单', status: '已发布' },
            // 2009
            { year: '2009', province: '北京', subject: '生物', no: '4', diff: '简单', status: '已发布' },
            { year: '2009', province: '湖北', subject: '语文', no: '9', diff: '中等', status: '已发布' },
            // 2008
            { year: '2008', province: '上海', subject: '政治', no: '11', diff: '中等', status: '已发布' },
            { year: '2008', province: '江苏', subject: '数学', no: '12', diff: '困难', status: '已发布' },
            // 2007
            { year: '2007', province: '广东', subject: '历史', no: '10', diff: '中等', status: '已发布' },
            { year: '2007', province: '湖南', subject: '地理', no: '7', diff: '简单', status: '已发布' },
            // 2006
            { year: '2006', province: '浙江', subject: '英语', no: '13', diff: '中等', status: '已发布' },
            { year: '2006', province: '四川', subject: '物理', no: '11', diff: '中等', status: '已发布' }
        ]
    },
    'admin-ocr': {
        stats: [
            { label: '待审核', value: '48', change: 0, color: 'orange' },
            { label: '今日已审', value: '126', change: 0, color: 'green' },
            { label: '平均置信度', value: '91%', change: 0, color: 'blue' }
        ],
        reviews: [
            { subject: '数学', text: '已知函数 f(x)=x³-3x+1，求极值...', confidence: 96, time: '5分钟前' },
            { subject: '物理', text: '一物体从高h处自由下落，落地速度为v...', confidence: 88, time: '5分钟前' },
            { subject: '化学', text: '反应 N₂+3H₂⇌2NH₃ 达到平衡时...', confidence: 92, time: '5分钟前' },
            { subject: '英语', text: 'The teacher, together with his students...', confidence: 75, time: '5分钟前' }
        ]
    },
    'admin-ai-review': {
        stats: [
            { label: '待审内容', value: '32', change: 0, color: 'orange' },
            { label: '今日已审', value: '158', change: 0, color: 'green' },
            { label: '平均AI评分', value: '89', change: 0, color: 'blue' },
            { label: '需复审', value: '5', change: 0, color: 'red' }
        ],
        notice: 'AI评分低于 80 分的内容需人工复审后再发布',
        items: [
            { type: 'AI解析', content: '本题考查导数的极值求法，需先求导再令其等于零...', score: 95, status: '待审核' },
            { type: 'AI讲题', content: '第一步：求导数 f(x)=3x²-3，第二步：令 f(x)=0 解得驻点...', score: 88, status: '待审核' },
            { type: 'AI答疑', content: '椭圆是到两定点距离之和为常数的轨迹，双曲线则是距离之差...', score: 72, status: '需复审' }
        ]
    },
    'admin-content': {
        stats: [
            { label: '待处理', value: '12', change: 0, color: 'orange' },
            { label: '今日处理', value: '34', change: 0, color: 'green' },
            { label: '累计举报', value: '1,256', change: 0, color: 'blue' }
        ],
        reports: [
            { type: '违规广告', content: '加微信xxx免费领取高考真题密卷...', user: '用户A', time: '10分钟前', status: '待处理', icon: 'fa-bullhorn', iconBg: '#FEE2E2', iconColor: '#EF4444' },
            { type: '不当言论', content: '讨论区出现不文明用语及人身攻击...', user: '用户B', time: '1小时前', status: '待处理', icon: 'fa-comment-slash', iconBg: '#FED7AA', iconColor: '#EA580C' },
            { type: '抄袭内容', content: '该解析与原创作者内容高度雷同...', user: '用户C', time: '3小时前', status: '处理中', icon: 'fa-copy', iconBg: '#E0E7FF', iconColor: '#6366F1' },
            { type: '垃圾信息', content: '评论区连续发布无意义重复内容...', user: '用户D', time: '昨天', status: '已处理', icon: 'fa-trash', iconBg: '#FEF3C7', iconColor: '#F59E0B' }
        ]
    },
    'admin-banner': {
        total: 4,
        banners: [
            { title: '暑期冲刺特惠', link: '/vip', sort: 1, status: '上线' },
            { title: 'AI讲题新功能上线', link: '/ai-explain', sort: 2, status: '上线' },
            { title: '高考倒计时提醒', link: '/countdown', sort: 3, status: '下线' },
            { title: '邀请好友得会员', link: '/invite', sort: 4, status: '上线' }
        ]
    },
    'admin-stats': {
        ranges: ['最近7天', '最近30天', '最近90天'],
        stats: [
            { label: '累计做题量', value: '1,256万', change: 18, color: 'blue' },
            { label: '平均提分', value: '+23分', change: 0, color: 'green' },
            { label: 'AI调用次数', value: '5,820万', change: 32, color: 'purple' },
            { label: '用户满意度', value: '94%', change: 2, color: 'orange' }
        ],
        charts: [
            { title: '做题量趋势', label: '近30天全平台做题量趋势', height: 180 },
            { title: '提分分布', label: '用户提分区间分布柱状图', height: 180 },
            { title: '学科分布', label: '各学科做题量占比饼图', height: 180 }
        ]
    },
    'admin-retention': {
        stats: [
            { label: '次日留存', value: '45%', change: 3, color: 'blue' },
            { label: '7日留存', value: '32%', change: 5, color: 'green' },
            { label: '30日留存', value: '22%', change: 8, color: 'orange' }
        ],
        retention: [
            { date: '07-28', reg: 1124, d1: 45, d3: 38, d7: 32, d14: 28, d30: 22 },
            { date: '07-21', reg: 1156, d1: 48, d3: 40, d7: 34, d14: 30, d30: 24 },
            { date: '07-14', reg: 1089, d1: 42, d3: 36, d7: 31, d14: 27, d30: 21 },
            { date: '07-07', reg: 1142, d1: 46, d3: 39, d7: 33, d14: 29, d30: 23 },
            { date: '06-30', reg: 1078, d1: 44, d3: 37, d7: 30, d14: 26, d30: 20 },
            { date: '06-23', reg: 1163, d1: 47, d3: 41, d7: 35, d14: 31, d30: 25 },
            { date: '06-16', reg: 1056, d1: 43, d3: 35, d7: 29, d14: 25, d30: 19 }
        ],
        chart: '用户留存率衰减曲线（次日-30日）'
    }
};

// 通用异步加载逻辑（API优先，失败时使用内置兜底数据，确保静态部署也能正常展示）
// 接入数据中台：首次加载若 KV 无数据，自动初始化写入；缓存至 window._adminData 供写操作使用
function adminLoadData(key, renderFn) {
    setTimeout(function () {
        var container = document.getElementById(key + '-content');
        if (!container) return;

        // 优先尝试 API 加载
        var apiAvailable = (typeof api !== 'undefined' && api.getPageData);
        if (apiAvailable) {
            api.getPageData(key).then(function (data) {
                if (data) {
                    // 缓存数据，供操作函数修改后回写
                    window._adminData = window._adminData || {};
                    window._adminData[key] = data;
                    renderFn(container, data);
                } else {
                    // API 返回 null → 使用兜底数据，并异步初始化写入 KV（数据中台初始化）
                    var fallback = ADMIN_FALLBACK_DATA[key];
                    if (fallback) {
                        window._adminData = window._adminData || {};
                        window._adminData[key] = fallback;
                        renderFn(container, fallback);
                        // 异步初始化写入数据中台（不阻塞渲染）
                        if (api.savePageData) {
                            api.savePageData(key, fallback).then(function () {
                                console.log('[数据中台] 初始化写入成功：' + key);
                            }).catch(function (e) {
                                console.warn('[数据中台] 初始化写入失败：' + key, e);
                            });
                        }
                    } else {
                        container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div></div>';
                    }
                }
            }).catch(function () {
                // API 异常 → 使用兜底数据
                var fallback = ADMIN_FALLBACK_DATA[key];
                if (fallback) {
                    window._adminData = window._adminData || {};
                    window._adminData[key] = fallback;
                    renderFn(container, fallback);
                } else {
                    container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
                }
            });
        } else {
            // API 不可用（静态部署）→ 直接使用兜底数据
            var fallback = ADMIN_FALLBACK_DATA[key];
            if (fallback) {
                window._adminData = window._adminData || {};
                window._adminData[key] = fallback;
                renderFn(container, fallback);
            } else {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">暂无数据</div></div>';
            }
        }
    }, 100);
}

// 通用数据中台写回函数：修改 window._adminData[key] 后调用，写回 KV 并刷新 Toast
function adminSave(key, msg) {
    if (typeof api === 'undefined' || !api.savePageData) {
        showToast('⚠️ 数据中台不可用（已修改本地缓存）');
        return Promise.resolve(false);
    }
    var data = (window._adminData || {})[key];
    if (!data) {
        showToast('⚠️ 数据未加载');
        return Promise.resolve(false);
    }
    return api.savePageData(key, data).then(function () {
        showToast(msg || '✅ 已写入数据中台');
        return true;
    }).catch(function (e) {
        console.warn('[数据中台] 写回失败：' + key, e);
        showToast('⚠️ 云端写入失败（已修改本地缓存）');
        return false;
    });
}

// 通用本地刷新：重新渲染当前页面（操作后视图同步）
function adminRefresh(key) {
    var pageKey = key.replace(/^admin-/, '');
    if (typeof renderPage === 'function') {
        renderPage('admin-' + pageKey);
    }
}

// ============================================================
// 1. 数据看板
// ============================================================
registerPage('admin-dashboard', '数据看板', '运营后台', '', function () {
    adminLoadData('admin-dashboard', function (container, data) {
        const stats = data.stats || [];
        const charts = data.charts || [];
        const realtime = data.realtime || [];

        const statsHtml = stats.map(s => StatCard(s.label, s.value, s.change, s.color)).join('');
        const chartsHtml = charts.map(c => adminCard(c.title, ChartPlaceholder(c.label, c.height))).join('');
        const realtimeHtml = realtime.map(r => `
            <div style="text-align:center;padding:14px;background:${r.bg};border-radius:10px;">
                <div style="font-size:11px;color:#6B7280;">${r.label}</div>
                <div style="font-size:22px;font-weight:700;color:${r.color};margin-top:4px;">${r.value}</div>
            </div>
        `).join('');

        container.innerHTML = `
            ${adminStatGrid(statsHtml)}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">${chartsHtml}</div>
            ${adminCard('实时数据', `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">${realtimeHtml}</div>`)}
        `;
    });

    return AdminPage('数据看板', ADMIN_MENU, 'dashboard', adminLoading('admin-dashboard'));
});

// ============================================================
// 2. 用户管理
// ============================================================
registerPage('admin-users', '用户管理', '运营后台', '', function () {
    adminLoadData('admin-users', function (container, data) {
        const total = data.total || 0;
        const grades = (data.filters && data.filters.grades) || [];
        const users = data.users || [];

        const gradesOptions = grades.map(g => `<option>${g}</option>`).join('');
        const rowsHtml = users.map((u, idx) => {
            const statusBadge = u.status === 'VIP'
                ? '<span style="background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:6px;font-size:12px;font-weight:600;">VIP</span>'
                : u.status === '禁用'
                ? '<span style="background:#FEE2E2;color:#991B1B;padding:2px 8px;border-radius:6px;font-size:12px;font-weight:600;">禁用</span>'
                : '<span style="background:#D1FAE5;color:#065F46;padding:2px 8px;border-radius:6px;font-size:12px;font-weight:600;">正常</span>';
            return `
                <tr>
                    <td><div style="display:flex;align-items:center;gap:8px;"><img src="${svgAvatar(u.name, null, 28)}" style="width:28px;height:28px;border-radius:50%;" onerror="this.style.display='none'">${u.name}</div></td>
                    <td>${u.phone}</td>
                    <td>${u.grade}</td>
                    <td>${u.time}</td>
                    <td>${statusBadge}</td>
                    <td><a style="color:#3B82F6;cursor:pointer;margin-right:10px;" onclick="openModal('用户详情', '<div style=&quot;padding:16px;line-height:1.8;font-size:14px;&quot;><b>用户名：</b>${u.name}<br><b>手机号：</b>${u.phone}<br><b>年级：</b>${u.grade}<br><b>注册时间：</b>${u.time}<br><b>状态：</b>${u.status}</div>')">详情</a><a style="color:#EF4444;cursor:pointer;" onclick="toggleUserStatus(${idx})">${u.status === '禁用' ? '启用' : '禁用'}</a></td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div style="background:white;border-radius:12px;padding:14px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);display:flex;gap:10px;align-items:center;">
                <input class="proto-input" placeholder="搜索用户名/手机号" style="flex:1;" onchange="showToast('已输入：'+this.value)">
                <select class="proto-input" style="width:120px;" onchange="showToast('已切换：'+this.value)">${gradesOptions}</select>
                <button class="proto-btn proto-btn-primary" style="width:auto;padding:0 20px;height:42px;border-radius:8px;" onclick="var kw=this.parentElement.querySelector('input').value||'(全部)';var grade=this.parentElement.querySelector('select').value;openModal('搜索结果', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b>搜索关键词：</b>'+kw+'<br><b>筛选年级：</b>'+grade+'<br><b>匹配结果：</b>${total.toLocaleString()} 条<br><br><span style=&quot;color:#6B7280;&quot;>已为您筛选出符合条件的用户记录，结果已按注册时间倒序排列。</span></div>')"><i class="fas fa-search"></i> 搜索</button>
            </div>
            ${adminCard(null, `
                <table class="admin-table">
                    <thead><tr><th>用户名</th><th>手机号</th><th>年级</th><th>注册时间</th><th>状态</th><th>操作</th></tr></thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;font-size:12px;color:#6B7280;">
                    <span>共 ${total.toLocaleString()} 条记录</span>
                    <div style="display:flex;gap:6px;">
                        <button style="padding:4px 10px;border:1px solid #E5E7EB;background:white;border-radius:6px;cursor:pointer;" onclick="showToast('已是第一页')">上一页</button>
                        <button class="pg-num" data-page="1" data-active="true" style="padding:4px 10px;border:1px solid #3B82F6;background:#3B82F6;color:white;border-radius:6px;cursor:pointer;" onclick="showToast('已切换到第1页')">1</button>
                        <button class="pg-num" data-page="2" data-active="false" style="padding:4px 10px;border:1px solid #E5E7EB;background:white;border-radius:6px;cursor:pointer;" onclick="showToast('已切换到第2页')">2</button>
                        <button style="padding:4px 10px;border:1px solid #E5E7EB;background:white;border-radius:6px;cursor:pointer;" onclick="showToast('已是最后一页')">下一页</button>
                    </div>
                </div>
            `)}
        `;
    });

    return AdminPage('用户管理', ADMIN_MENU, 'users', adminLoading('admin-users'));
});

// 用户管理：切换启用/禁用状态（写入数据中台）
function toggleUserStatus(idx) {
    var data = (window._adminData || {})['admin-users'];
    if (!data || !data.users || !data.users[idx]) {
        showToast('⚠️ 用户数据未加载');
        return;
    }
    var u = data.users[idx];
    var newStatus = u.status === '禁用' ? '正常' : '禁用';
    u.status = newStatus;
    var action = newStatus === '禁用' ? '禁用' : '启用';
    adminSave('admin-users', action + '用户：' + u.name + '（已写入数据中台）').then(function () {
        adminRefresh('admin-users');
    });
}

// ============================================================
// 3. 会员管理
// ============================================================
registerPage('admin-members', '会员管理', '运营后台', '', function () {
    adminLoadData('admin-members', function (container, data) {
        const stats = data.stats || [];
        const members = data.members || [];

        const statsHtml = stats.map(s => StatCard(s.label, s.value, s.change, s.color)).join('');
        const rowsHtml = members.map(m => {
            const statusBadge = m.status === '有效'
                ? '<span style="background:#D1FAE5;color:#065F46;padding:2px 8px;border-radius:6px;font-size:12px;">有效</span>'
                : m.status === '即将到期'
                ? '<span style="background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:6px;font-size:12px;">即将到期</span>'
                : '<span style="background:#FEE2E2;color:#991B1B;padding:2px 8px;border-radius:6px;font-size:12px;">已过期</span>';
            return `
                <tr>
                    <td>${m.name}</td>
                    <td>${m.plan}</td>
                    <td style="font-weight:600;color:#F59E0B;">${m.amount}</td>
                    <td>${m.start}</td>
                    <td>${m.end}</td>
                    <td>${statusBadge}</td>
                    <td><a style="color:#3B82F6;cursor:pointer;" onclick="openModal('会员续费', '<div style=&quot;padding:16px;line-height:1.8;font-size:14px;&quot;><b>会员：</b>${m.name}<br><b>当前套餐：</b>${m.plan}<br><b>到期时间：</b>${m.end}<br><b>状态：</b>${m.status}</div>')">续费</a></td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px;">${statsHtml}</div>
            ${adminCard(null, `
                <table class="admin-table">
                    <thead><tr><th>会员</th><th>套餐</th><th>金额</th><th>开始时间</th><th>到期时间</th><th>状态</th><th>操作</th></tr></thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            `)}
        `;
    });

    return AdminPage('会员管理', ADMIN_MENU, 'members', adminLoading('admin-members'));
});

// ============================================================
// 4. 真题管理
// ============================================================
registerPage('admin-exams', '真题管理', '运营后台', '', function () {
    adminLoadData('admin-exams', function (container, data) {
        var exams = data.exams || [];

        // 全量筛选选项（不依赖后端返回，确保覆盖完整）
        var YEAR_OPTS = ['全部年份'];
        for (var y = 2026; y >= 2006; y--) YEAR_OPTS.push(String(y));
        var PROV_OPTS = ['全部省份','北京','天津','河北','山西','内蒙古','辽宁','吉林','黑龙江','上海','江苏','浙江','安徽','福建','江西','山东','河南','湖北','湖南','广东','广西','海南','重庆','四川','贵州','云南','西藏','陕西','甘肃','青海','宁夏','新疆','香港','澳门','台湾'];
        var SUBJ_OPTS = ['全部科目','数学','语文','英语','物理','化学','生物','政治','历史','地理'];

        // 存储全量数据供筛选使用
        window._examsAllData = exams;

        container.innerHTML = ''
            + '<div style="background:white;border-radius:12px;padding:14px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);display:flex;gap:10px;align-items:center;flex-wrap:wrap;">'
            +   '<select id="exam-filter-year" class="proto-input" style="width:110px;" onchange="filterExams()">' + YEAR_OPTS.map(function(y){return '<option>'+y+'</option>';}).join('') + '</select>'
            +   '<select id="exam-filter-province" class="proto-input" style="width:130px;" onchange="filterExams()">' + PROV_OPTS.map(function(p){return '<option>'+p+'</option>';}).join('') + '</select>'
            +   '<select id="exam-filter-subject" class="proto-input" style="width:120px;" onchange="filterExams()">' + SUBJ_OPTS.map(function(s){return '<option>'+s+'</option>';}).join('') + '</select>'
            +   '<button class="proto-btn proto-btn-primary" style="width:auto;padding:0 20px;height:42px;border-radius:8px;" onclick="filterExams()"><i class="fas fa-filter"></i> 筛选</button>'
            +   '<button class="proto-btn" style="width:auto;padding:0 16px;height:42px;border-radius:8px;background:#F3F4F6;color:#374151;" onclick="resetExamFilter()"><i class="fas fa-undo"></i> 重置</button>'
            +   '<span id="exam-filter-count" style="font-size:13px;color:#6B7280;margin-left:8px;"></span>'
            +   '<button class="proto-btn proto-btn-primary" style="width:auto;padding:0 20px;height:42px;border-radius:8px;margin-left:auto;background:#10B981;" onclick="openExamEntryForm()"><i class="fas fa-plus"></i> 录入真题</button>'
            + '</div>'
            + '<div id="exam-table-wrapper">' + examTableHTML(exams) + '</div>';

        filterExams(); // 初始化计数

        // 接入数据中台：从中央题库 /api/questions 拉取真实数据，与 page-data 合并展示
        fetch('/api/questions?source=real_exam')
            .then(function (r) { return r.json(); })
            .then(function (res) {
                if (res.code === 0 && res.data && res.data.length) {
                    // 将数据库题库映射为列表展示格式
                    var dbExams = res.data.map(function (q) {
                        var diffLabel = q.difficulty >= 4 ? '困难' : q.difficulty === 3 ? '中等' : '简单';
                        return {
                            year: q.year ? String(q.year) : '—',
                            province: q.province || '—',
                            subject: q.subject || '—',
                            no: q.question_number || '—',
                            diff: diffLabel,
                            status: q.status || '已发布',
                            _id: q.id,
                            _source: 'db'
                        };
                    });
                    // 数据库数据置顶，page-data 数据作为兜底补充
                    var merged = dbExams.concat(exams.filter(function (e) { return !e._source; }));
                    window._examsAllData = merged;
                    var wrapper = document.getElementById('exam-table-wrapper');
                    if (wrapper) wrapper.innerHTML = examTableHTML(merged);
                    filterExams();
                }
            })
            .catch(function (e) {
                console.warn('[数据中台] 题库加载失败，使用 page-data 数据', e);
            });
    });

    return AdminPage('真题管理', ADMIN_MENU, 'exams', adminLoading('admin-exams'));
});

// 生成表格 HTML
function examTableHTML(list) {
    var rows = list.map(function(e) {
        var diffHtml = e.diff === '困难' ? '<span style="color:#EF4444;">困难</span>' : e.diff === '中等' ? '<span style="color:#F59E0B;">中等</span>' : '<span style="color:#10B981;">简单</span>';
        var statusHtml = e.status === '已发布' ? '<span style="background:#D1FAE5;color:#065F46;padding:2px 8px;border-radius:6px;font-size:12px;">已发布</span>' : '<span style="background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:6px;font-size:12px;">审核中</span>';
        return '<tr><td>' + e.year + '</td><td>' + e.province + '</td><td>' + e.subject + '</td><td>第' + e.no + '题</td><td>' + diffHtml + '</td><td>' + statusHtml + '</td>'
            + '<td><a style="color:#3B82F6;cursor:pointer;margin-right:8px;" onclick="openModal(\'编辑真题\', \'<div style=&quot;padding:16px;line-height:1.8;font-size:14px;&quot;><b>年份：</b>' + e.year + '<br><b>省份：</b>' + e.province + '<br><b>科目：</b>' + e.subject + '<br><b>题号：</b>第' + e.no + '题<br><b>难度：</b>' + e.diff + '</div>\')">编辑</a>'
            + '<a style="color:#EF4444;cursor:pointer;" onclick="openModal(\'确认删除真题\', \'<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><div style=&quot;text-align:center;padding:12px 0;&quot;><i class=&quot;fas fa-exclamation-triangle&quot; style=&quot;font-size:32px;color:#EF4444;&quot;></i></div><b>年份：</b>' + e.year + '<br><b>省份：</b>' + e.province + '<br><b>科目：</b>' + e.subject + '<br><b>题号：</b>第' + e.no + '题<br><b>难度：</b>' + e.diff + '<br><br><span style=&quot;color:#6B7280;&quot;>删除后不可恢复，确定要删除该真题吗？</span></div>\')">删除</a></td></tr>';
    }).join('');

    if (!list.length) {
        rows = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-inbox" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">没有符合条件的真题</div></td></tr>';
    }

    return '<div class="admin-card" style="background:white;border-radius:12px;padding:0;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;">'
        + '<table class="admin-table"><thead><tr><th>年份</th><th>省份</th><th>科目</th><th>题号</th><th>难度</th><th>状态</th><th>操作</th></tr></thead><tbody>' + rows + '</tbody></table>'
        + '</div>';
}

// 筛选真题
function filterExams() {
    var all = window._examsAllData || [];
    var ySel = document.getElementById('exam-filter-year');
    var pSel = document.getElementById('exam-filter-province');
    var sSel = document.getElementById('exam-filter-subject');
    if (!ySel || !pSel || !sSel) return;

    var y = ySel.value, p = pSel.value, s = sSel.value;
    var filtered = all.filter(function(e) {
        if (y !== '全部年份' && String(e.year) !== y) return false;
        if (p !== '全部省份' && e.province !== p) return false;
        if (s !== '全部科目' && e.subject !== s) return false;
        return true;
    });

    var wrapper = document.getElementById('exam-table-wrapper');
    if (wrapper) wrapper.innerHTML = examTableHTML(filtered);

    var count = document.getElementById('exam-filter-count');
    if (count) count.textContent = '共 ' + filtered.length + ' 条';
}

// 重置筛选
function resetExamFilter() {
    var ySel = document.getElementById('exam-filter-year');
    var pSel = document.getElementById('exam-filter-province');
    var sSel = document.getElementById('exam-filter-subject');
    if (ySel) ySel.selectedIndex = 0;
    if (pSel) pSel.selectedIndex = 0;
    if (sSel) sSel.selectedIndex = 0;
    filterExams();
    showToast('筛选已重置');
}

// ============================================================
// 5. OCR审核
// ============================================================
registerPage('admin-ocr', 'OCR审核', '运营后台', '', function () {
    adminLoadData('admin-ocr', function (container, data) {
        const stats = data.stats || [];
        const reviews = data.reviews || [];

        const statsHtml = stats.map(s => StatCard(s.label, s.value, s.change, s.color)).join('');
        const reviewsHtml = reviews.map((r, idx) => {
            const confColor = r.confidence >= 90 ? '#10B981' : '#F59E0B';
            const statusBadge = r.status === '通过'
                ? '<span style="background:#D1FAE5;color:#065F46;padding:2px 8px;border-radius:6px;font-size:11px;">通过</span>'
                : r.status === '拒绝'
                ? '<span style="background:#FEE2E2;color:#991B1B;padding:2px 8px;border-radius:6px;font-size:11px;">拒绝</span>'
                : '<span style="background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:6px;font-size:11px;">待审核</span>';
            return `
                <div style="display:flex;gap:14px;padding:14px;background:#F9FAFB;border-radius:10px;border:1px solid #F3F4F6;">
                    <div style="width:90px;height:90px;background:linear-gradient(135deg,#E0E7FF,#C7D2FE);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fas fa-image" style="font-size:24px;color:#6366F1;"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                            <span style="background:#EFF6FF;color:#2563EB;padding:2px 8px;border-radius:6px;font-size:12px;font-weight:600;">${r.subject}</span>
                            <span style="font-size:12px;color:#9CA3AF;">识别置信度</span>
                            <span style="font-size:12px;font-weight:700;color:${confColor};">${r.confidence}%</span>
                            ${statusBadge}
                            <span style="margin-left:auto;font-size:11px;color:#9CA3AF;"><i class="far fa-clock"></i> ${r.time}</span>
                        </div>
                        <div style="font-size:13px;color:#374151;background:white;padding:8px 10px;border-radius:6px;line-height:1.5;">${r.text}</div>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:6px;justify-content:center;">
                        <button style="padding:6px 14px;background:#10B981;color:white;border:none;border-radius:6px;font-size:12px;cursor:pointer;" onclick="auditOcrReview(${idx}, '通过')"><i class="fas fa-check"></i> 通过</button>
                        <button style="padding:6px 14px;background:#EF4444;color:white;border:none;border-radius:6px;font-size:12px;cursor:pointer;" onclick="auditOcrReview(${idx}, '拒绝')"><i class="fas fa-times"></i> 拒绝</button>
                        <button style="padding:6px 14px;background:#F59E0B;color:white;border:none;border-radius:6px;font-size:12px;cursor:pointer;" onclick="editOcrReview(${idx})"><i class="fas fa-edit"></i> 修改</button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px;">${statsHtml}</div>
            ${adminCard(null, `<div style="display:flex;flex-direction:column;gap:14px;">${reviewsHtml}</div>`)}
        `;
    });

    return AdminPage('OCR审核', ADMIN_MENU, 'ocr-review', adminLoading('admin-ocr'));
});

// OCR审核：通过/拒绝（写入数据中台；通过时同步入库题库）
function auditOcrReview(idx, action) {
    var data = (window._adminData || {})['admin-ocr'];
    if (!data || !data.reviews || !data.reviews[idx]) {
        showToast('⚠️ 审核数据未加载');
        return;
    }
    var r = data.reviews[idx];
    r.status = action;
    var icon = action === '通过' ? 'fa-check-circle' : 'fa-times-circle';
    var color = action === '通过' ? '#10B981' : '#EF4444';
    var title = 'OCR审核' + action;
    var extra = action === '通过' ? '该OCR识别结果已通过审核，将进入题库。' : '该OCR识别结果已被拒绝，不会进入题库。';
    openModal(title, '<div style="padding:14px;font-size:13px;line-height:1.8;color:#374151;"><div style="text-align:center;padding:8px 0;"><i class="fas ' + icon + '" style="font-size:36px;color:' + color + ';"></i><div style="margin-top:8px;font-weight:600;color:' + color + ';">审核已' + action + '</div></div><b>科目：</b>' + r.subject + '<br><b>识别置信度：</b>' + r.confidence + '%<br><b>识别文本：</b>' + r.text + '<br><br><span style="color:#6B7280;">' + extra + '</span></div>');

    // 同步更新统计
    var stats = data.stats || [];
    stats.forEach(function (s) {
        if (s.label === '待审核') {
            var v = parseInt(String(s.value).replace(/[^\d]/g, '')) || 0;
            s.value = String(Math.max(0, v - 1));
        }
        if (s.label === '今日已审') {
            var v = parseInt(String(s.value).replace(/[^\d]/g, '')) || 0;
            s.value = String(v + 1);
        }
    });

    // 通过的题同步写入中央题库
    if (action === '通过' && typeof api !== 'undefined' && api.request) {
        fetch('/api/questions/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                format: 'json',
                data: [{
                    source: 'ocr_review',
                    subject: r.subject,
                    type: '解答题',
                    content: r.text,
                    answer: '',
                    analysis: ''
                }]
            })
        }).then(function (res) { return res.json(); }).then(function (res) {
            if (res.code === 0) console.log('[数据中台] OCR 通过题目已入库');
        }).catch(function (e) { console.warn('OCR 入库失败', e); });
    }

    adminSave('admin-ocr', 'OCR 审核' + action + '（已写入数据中台）').then(function () {
        adminRefresh('admin-ocr');
    });
}

// OCR审核：修改识别结果（写入数据中台）
function editOcrReview(idx) {
    var data = (window._adminData || {})['admin-ocr'];
    if (!data || !data.reviews || !data.reviews[idx]) return;
    var r = data.reviews[idx];
    var html = '<div style="display:flex;flex-direction:column;gap:12px;">'
        + '<div style="font-size:12px;color:#6B7280;">科目：' + r.subject + ' · 置信度：' + r.confidence + '%</div>'
        + '<label><span style="font-size:12px;color:#6B7280;">识别文本</span><textarea id="ocr-edit-text" class="proto-input" style="width:100%;min-height:100px;font-size:13px;margin-top:2px;resize:vertical;">' + (r.text || '').replace(/</g, '&lt;') + '</textarea></label>'
        + '<button class="proto-btn proto-btn-primary" style="width:100%;height:42px;border-radius:8px;background:#10B981;" onclick="saveOcrEdit(' + idx + ')"><i class="fas fa-check"></i> 保存</button>'
        + '</div>';
    openModal('修改OCR结果', html, { width: 460 });
}

function saveOcrEdit(idx) {
    var data = (window._adminData || {})['admin-ocr'];
    if (!data || !data.reviews || !data.reviews[idx]) return;
    var text = document.getElementById('ocr-edit-text').value.trim();
    if (!text) { showToast('识别文本不能为空'); return; }
    data.reviews[idx].text = text;
    closeModal();
    adminSave('admin-ocr', 'OCR 识别结果已修改（已写入数据中台）').then(function () {
        adminRefresh('admin-ocr');
    });
}

// ============================================================
// 6. AI审核
// ============================================================
registerPage('admin-ai-review', 'AI审核', '运营后台', '', function () {
    adminLoadData('admin-ai-review', function (container, data) {
        const stats = data.stats || [];
        const notice = data.notice || '';
        const items = data.items || [];

        const statsHtml = stats.map(s => StatCard(s.label, s.value, s.change, s.color)).join('');
        const itemsHtml = items.map((it, idx) => {
            const scoreColor = it.score >= 90 ? '#10B981' : it.score >= 80 ? '#F59E0B' : '#EF4444';
            const statusBadge = it.status === '已通过'
                ? '<span style="background:#D1FAE5;color:#065F46;padding:2px 8px;border-radius:6px;font-size:11px;">已通过</span>'
                : it.status === '已拒绝'
                ? '<span style="background:#FEE2E2;color:#991B1B;padding:2px 8px;border-radius:6px;font-size:11px;">已拒绝</span>'
                : it.status === '需复审'
                ? '<span style="background:#FEE2E2;color:#991B1B;padding:2px 8px;border-radius:6px;font-size:11px;">需复审</span>'
                : '<span style="background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:6px;font-size:11px;">待审核</span>';
            return `
                <div style="padding:14px;background:#F9FAFB;border-radius:10px;border-left:3px solid ${scoreColor};">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                        <span style="background:#EDE9FE;color:#5B21B6;padding:2px 10px;border-radius:6px;font-size:12px;font-weight:600;"><i class="fas fa-robot"></i> ${it.type}</span>
                        ${statusBadge}
                        <div style="display:flex;align-items:center;gap:10px;">
                            <span style="font-size:12px;color:#6B7280;">AI评分</span>
                            <span style="font-size:18px;font-weight:700;color:${scoreColor};">${it.score}</span>
                        </div>
                    </div>
                    <div style="font-size:13px;color:#374151;line-height:1.6;background:white;padding:10px 12px;border-radius:6px;margin-bottom:10px;">${it.content}</div>
                    <div style="display:flex;gap:8px;">
                        <button style="padding:6px 16px;background:#10B981;color:white;border:none;border-radius:6px;font-size:12px;cursor:pointer;" onclick="auditAiReview(${idx}, '通过')"><i class="fas fa-check"></i> 通过发布</button>
                        <button style="padding:6px 16px;background:#F59E0B;color:white;border:none;border-radius:6px;font-size:12px;cursor:pointer;" onclick="editAiReview(${idx})"><i class="fas fa-edit"></i> 人工修改</button>
                        <button style="padding:6px 16px;background:#EF4444;color:white;border:none;border-radius:6px;font-size:12px;cursor:pointer;" onclick="auditAiReview(${idx}, '拒绝')"><i class="fas fa-ban"></i> 拒绝</button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px;">${statsHtml}</div>
            <div style="background:#FFF7ED;border-left:4px solid #F59E0B;border-radius:8px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:center;gap:10px;">
                <i class="fas fa-exclamation-triangle" style="color:#F59E0B;font-size:18px;"></i>
                <span style="font-size:13px;color:#92400E;">${notice}</span>
            </div>
            ${adminCard('AI生成内容审核队列', `<div style="display:flex;flex-direction:column;gap:14px;">${itemsHtml}</div>`)}
        `;
    });

    return AdminPage('AI审核', ADMIN_MENU, 'ai-review', adminLoading('admin-ai-review'));
});

// AI审核：通过/拒绝（写入数据中台）
function auditAiReview(idx, action) {
    var data = (window._adminData || {})['admin-ai-review'];
    if (!data || !data.items || !data.items[idx]) {
        showToast('⚠️ 审核数据未加载');
        return;
    }
    var it = data.items[idx];
    it.status = action === '通过' ? '已通过' : '已拒绝';
    var icon = action === '通过' ? 'fa-check-circle' : 'fa-ban';
    var color = action === '通过' ? '#10B981' : '#EF4444';
    var title = 'AI内容审核' + (action === '通过' ? '通过' : '拒绝');
    var extra = action === '通过' ? '该AI生成内容已通过审核并发布。' : '该AI生成内容已被拒绝，不会发布。';
    openModal(title, '<div style="padding:14px;font-size:13px;line-height:1.8;color:#374151;"><div style="text-align:center;padding:8px 0;"><i class="fas ' + icon + '" style="font-size:36px;color:' + color + ';"></i><div style="margin-top:8px;font-weight:600;color:' + color + ';">' + (action === '通过' ? '已通过发布' : '已拒绝发布') + '</div></div><b>类型：</b>' + it.type + '<br><b>AI评分：</b>' + it.score + '<br><b>内容：</b>' + it.content + '<br><br><span style="color:#6B7280;">' + extra + '</span></div>');

    // 同步统计
    var stats = data.stats || [];
    stats.forEach(function (s) {
        if (s.label === '待审内容') {
            var v = parseInt(String(s.value).replace(/[^\d]/g, '')) || 0;
            s.value = String(Math.max(0, v - 1));
        }
        if (s.label === '今日已审') {
            var v = parseInt(String(s.value).replace(/[^\d]/g, '')) || 0;
            s.value = String(v + 1);
        }
        if (s.label === '需复审' && it.score < 80 && action === '通过') {
            var v = parseInt(String(s.value).replace(/[^\d]/g, '')) || 0;
            s.value = String(Math.max(0, v - 1));
        }
    });

    adminSave('admin-ai-review', 'AI 审核' + action + '（已写入数据中台）').then(function () {
        adminRefresh('admin-ai-review');
    });
}

// AI审核：人工修改（写入数据中台）
function editAiReview(idx) {
    var data = (window._adminData || {})['admin-ai-review'];
    if (!data || !data.items || !data.items[idx]) return;
    var it = data.items[idx];
    var html = '<div style="display:flex;flex-direction:column;gap:12px;">'
        + '<div style="font-size:12px;color:#6B7280;">类型：' + it.type + ' · AI评分：' + it.score + '</div>'
        + '<label><span style="font-size:12px;color:#6B7280;">内容</span><textarea id="ai-edit-content" class="proto-input" style="width:100%;min-height:120px;font-size:13px;margin-top:2px;resize:vertical;">' + (it.content || '').replace(/</g, '&lt;') + '</textarea></label>'
        + '<label><span style="font-size:12px;color:#6B7280;">人工评分</span><input id="ai-edit-score" type="number" min="0" max="100" class="proto-input" value="' + (it.score || 80) + '" style="width:100%;height:38px;font-size:13px;margin-top:2px;"></label>'
        + '<button class="proto-btn proto-btn-primary" style="width:100%;height:42px;border-radius:8px;background:#10B981;" onclick="saveAiEdit(' + idx + ')"><i class="fas fa-check"></i> 保存</button>'
        + '</div>';
    openModal('人工修改', html, { width: 460 });
}

function saveAiEdit(idx) {
    var data = (window._adminData || {})['admin-ai-review'];
    if (!data || !data.items || !data.items[idx]) return;
    var content = document.getElementById('ai-edit-content').value.trim();
    var score = parseInt(document.getElementById('ai-edit-score').value);
    if (!content) { showToast('内容不能为空'); return; }
    if (isNaN(score) || score < 0 || score > 100) { showToast('评分需在 0-100 之间'); return; }
    data.items[idx].content = content;
    data.items[idx].score = score;
    data.items[idx].status = '已修改';
    closeModal();
    adminSave('admin-ai-review', 'AI 内容已人工修改（已写入数据中台）').then(function () {
        adminRefresh('admin-ai-review');
    });
}

// ============================================================
// 7. 内容审核
// ============================================================
registerPage('admin-content', '内容审核', '运营后台', '', function () {
    adminLoadData('admin-content', function (container, data) {
        const stats = data.stats || [];
        const reports = data.reports || [];

        const statsHtml = stats.map(s => StatCard(s.label, s.value, s.change, s.color)).join('');
        const reportsHtml = reports.map((r, idx) => {
            const statusBadge = r.status === '待处理'
                ? '<span style="background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:6px;font-size:11px;">待处理</span>'
                : r.status === '处理中'
                ? '<span style="background:#DBEAFE;color:#1E40AF;padding:2px 8px;border-radius:6px;font-size:11px;">处理中</span>'
                : '<span style="background:#D1FAE5;color:#065F46;padding:2px 8px;border-radius:6px;font-size:11px;">已处理</span>';
            return `
                <div style="padding:14px;background:#F9FAFB;border-radius:10px;display:flex;gap:14px;align-items:flex-start;">
                    <div style="width:40px;height:40px;border-radius:10px;background:${r.iconBg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fas ${r.icon}" style="color:${r.iconColor};font-size:16px;"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                            <span style="font-size:13px;font-weight:600;">${r.type}</span>
                            <span style="font-size:11px;color:#9CA3AF;">·</span>
                            <span style="font-size:11px;color:#9CA3AF;">举报人 ${r.user}</span>
                            <span style="font-size:11px;color:#9CA3AF;margin-left:auto;">${r.time}</span>
                        </div>
                        <div style="font-size:13px;color:#374151;line-height:1.5;background:white;padding:8px 10px;border-radius:6px;">${r.content}</div>
                    </div>
                    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px;">
                        ${statusBadge}
                        <button style="padding:4px 12px;background:#3B82F6;color:white;border:none;border-radius:6px;font-size:12px;cursor:pointer;" onclick="handleContentReport(${idx})">处理</button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px;">${statsHtml}</div>
            ${adminCard('举报内容列表', `<div style="display:flex;flex-direction:column;gap:12px;">${reportsHtml}</div>`)}
        `;
    });

    return AdminPage('内容审核', ADMIN_MENU, 'content', adminLoading('admin-content'));
});

// 内容审核：处理举报（写入数据中台）
function handleContentReport(idx) {
    var data = (window._adminData || {})['admin-content'];
    if (!data || !data.reports || !data.reports[idx]) {
        showToast('⚠️ 举报数据未加载');
        return;
    }
    var r = data.reports[idx];
    if (r.status === '已处理') {
        showToast('该举报已处理');
        return;
    }
    // 待处理 → 处理中 → 已处理
    r.status = r.status === '待处理' ? '处理中' : '已处理';
    var stage = r.status === '处理中' ? '已开始处理' : '已处理完成';
    openModal('举报处理', '<div style="padding:14px;font-size:13px;line-height:1.8;color:#374151;"><div style="text-align:center;padding:8px 0;"><i class="fas fa-check-circle" style="font-size:36px;color:#3B82F6;"></i><div style="margin-top:8px;font-weight:600;color:#3B82F6;">' + stage + '</div></div><b>举报类型：</b>' + r.type + '<br><b>举报人：</b>' + r.user + '<br><b>举报内容：</b>' + r.content + '<br><br><span style="color:#6B7280;">该举报状态已更新为「' + r.status + '」，已写入数据中台。</span></div>');
    // 同步更新统计数据
    var stats = data.stats || [];
    stats.forEach(function (s) {
        if (s.label === '待处理' && s.value !== undefined) {
            var v = parseInt(String(s.value).replace(/[^\d]/g, '')) || 0;
            s.value = String(Math.max(0, v - 1));
        }
        if (s.label === '今日处理' && s.value !== undefined) {
            var v = parseInt(String(s.value).replace(/[^\d]/g, '')) || 0;
            s.value = String(v + 1);
        }
    });
    adminSave('admin-content', stage + '举报：' + r.type + '（已写入数据中台）').then(function () {
        adminRefresh('admin-content');
    });
}

// ============================================================
// 8. Banner管理
// ============================================================
registerPage('admin-banner', 'Banner管理', '运营后台', '', function () {
    adminLoadData('admin-banner', function (container, data) {
        const total = data.total || 0;
        const banners = data.banners || [];

        const bannersHtml = banners.map((b, idx) => {
            const statusBadge = b.status === '上线'
                ? '<span class="banner-status" style="background:#D1FAE5;color:#065F46;padding:1px 8px;border-radius:6px;font-size:11px;">上线</span>'
                : '<span class="banner-status" style="background:#F3F4F6;color:#6B7280;padding:1px 8px;border-radius:6px;font-size:11px;">下线</span>';
            return `
                <div data-banner-row="1" style="display:flex;align-items:center;gap:14px;padding:14px;background:#F9FAFB;border-radius:10px;">
                    <div style="width:160px;height:72px;background:linear-gradient(135deg,#3B82F6,#8B5CF6);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fas fa-image" style="font-size:24px;color:rgba(255,255,255,0.8);"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                            <span style="font-size:14px;font-weight:600;">${b.title}</span>
                            ${statusBadge}
                        </div>
                        <div style="font-size:12px;color:#9CA3AF;">链接：${b.link}</div>
                        <div style="font-size:12px;color:#9CA3AF;margin-top:2px;">排序：第 ${b.sort} 位</div>
                    </div>
                    <div style="display:flex;gap:6px;">
                        <button style="padding:6px 12px;background:#3B82F6;color:white;border:none;border-radius:6px;font-size:12px;cursor:pointer;" onclick="editBanner(${idx})">编辑</button>
                        <button style="padding:6px 12px;background:#F59E0B;color:white;border:none;border-radius:6px;font-size:12px;cursor:pointer;" onclick="toggleBanner(${idx})">${b.status === '上线' ? '下线' : '上线'}</button>
                        <button style="padding:6px 12px;background:#EF4444;color:white;border:none;border-radius:6px;font-size:12px;cursor:pointer;" onclick="deleteBanner(${idx})">删除</button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
                <div style="font-size:14px;color:#6B7280;">共 ${total} 个Banner</div>
                <button class="proto-btn proto-btn-primary" style="width:auto;padding:0 20px;height:42px;border-radius:8px;background:#10B981;" onclick="openBannerForm()"><i class="fas fa-plus"></i> 新增Banner</button>
            </div>
            ${adminCard(null, `<div style="display:flex;flex-direction:column;gap:14px;">${bannersHtml}</div>`)}
        `;
    });

    return AdminPage('Banner管理', ADMIN_MENU, 'banner', adminLoading('admin-banner'));
});

// Banner管理：上下线切换（写入数据中台）
function toggleBanner(idx) {
    var data = (window._adminData || {})['admin-banner'];
    if (!data || !data.banners || !data.banners[idx]) {
        showToast('⚠️ Banner 数据未加载');
        return;
    }
    var b = data.banners[idx];
    b.status = b.status === '上线' ? '下线' : '上线';
    var action = b.status === '上线' ? '上线' : '下线';
    adminSave('admin-banner', action + ' Banner：' + b.title + '（已写入数据中台）').then(function () {
        adminRefresh('admin-banner');
    });
}

// Banner管理：删除（写入数据中台）
function deleteBanner(idx) {
    var data = (window._adminData || {})['admin-banner'];
    if (!data || !data.banners || !data.banners[idx]) {
        showToast('⚠️ Banner 数据未加载');
        return;
    }
    var b = data.banners[idx];
    openModal('确认删除Banner', '<div style="padding:14px;font-size:13px;line-height:1.8;color:#374151;"><div style="text-align:center;padding:8px 0;"><i class="fas fa-exclamation-triangle" style="font-size:32px;color:#EF4444;"></i></div><b>标题：</b>' + b.title + '<br><b>链接：</b>' + b.link + '<br><b>排序：</b>第' + b.sort + '位<br><b>状态：</b>' + b.status + '<br><br><span style="color:#6B7280;">删除后不可恢复，确定要删除该Banner吗？</span></div>', {
        footer: '<button class="proto-btn" style="width:auto;padding:0 16px;height:36px;border-radius:8px;background:#E5E7EB;color:#374151;" onclick="closeModal()">取消</button><button class="proto-btn" style="width:auto;padding:0 16px;height:36px;border-radius:8px;background:#EF4444;color:white;margin-left:8px;" onclick="confirmDeleteBanner(' + idx + ')">确认删除</button>'
    });
}

function confirmDeleteBanner(idx) {
    var data = (window._adminData || {})['admin-banner'];
    if (!data || !data.banners) return;
    var b = data.banners[idx];
    data.banners.splice(idx, 1);
    data.total = data.banners.length;
    closeModal();
    adminSave('admin-banner', '删除 Banner：' + (b ? b.title : '') + '（已写入数据中台）').then(function () {
        adminRefresh('admin-banner');
    });
}

// Banner管理：编辑（表单回填，写入数据中台）
function editBanner(idx) {
    var data = (window._adminData || {})['admin-banner'];
    if (!data || !data.banners || !data.banners[idx]) return;
    var b = data.banners[idx];
    var html = '<div style="display:flex;flex-direction:column;gap:12px;">'
        + '<label><span style="font-size:12px;color:#6B7280;">标题</span><input id="banner-title" type="text" class="proto-input" value="' + (b.title || '').replace(/"/g, '&quot;') + '" style="width:100%;height:38px;font-size:13px;margin-top:2px;"></label>'
        + '<label><span style="font-size:12px;color:#6B7280;">跳转链接</span><input id="banner-link" type="text" class="proto-input" value="' + (b.link || '').replace(/"/g, '&quot;') + '" style="width:100%;height:38px;font-size:13px;margin-top:2px;"></label>'
        + '<label><span style="font-size:12px;color:#6B7280;">排序权重</span><input id="banner-sort" type="number" class="proto-input" value="' + (b.sort || 1) + '" style="width:100%;height:38px;font-size:13px;margin-top:2px;"></label>'
        + '<label><span style="font-size:12px;color:#6B7280;">状态</span><select id="banner-status" class="proto-input" style="width:100%;height:38px;font-size:13px;margin-top:2px;"><option value="上线"' + (b.status === '上线' ? ' selected' : '') + '>上线</option><option value="下线"' + (b.status === '下线' ? ' selected' : '') + '>下线</option></select></label>'
        + '<button class="proto-btn proto-btn-primary" style="width:100%;height:42px;border-radius:8px;background:#10B981;" onclick="saveBannerEdit(' + idx + ')"><i class="fas fa-check"></i> 保存</button>'
        + '</div>';
    openModal('编辑Banner', html, { width: 460 });
}

function saveBannerEdit(idx) {
    var data = (window._adminData || {})['admin-banner'];
    if (!data || !data.banners || !data.banners[idx]) return;
    var title = document.getElementById('banner-title').value.trim();
    var link = document.getElementById('banner-link').value.trim();
    var sort = parseInt(document.getElementById('banner-sort').value) || 1;
    var status = document.getElementById('banner-status').value;
    if (!title) { showToast('请填写标题'); return; }
    data.banners[idx] = { title: title, link: link, sort: sort, status: status };
    closeModal();
    adminSave('admin-banner', '编辑 Banner：' + title + '（已写入数据中台）').then(function () {
        adminRefresh('admin-banner');
    });
}

// Banner管理：新增（表单录入，写入数据中台）
function openBannerForm() {
    var html = '<div style="display:flex;flex-direction:column;gap:12px;">'
        + '<label><span style="font-size:12px;color:#6B7280;">标题</span><input id="banner-new-title" type="text" class="proto-input" placeholder="请输入Banner标题" style="width:100%;height:38px;font-size:13px;margin-top:2px;"></label>'
        + '<label><span style="font-size:12px;color:#6B7280;">跳转链接</span><input id="banner-new-link" type="text" class="proto-input" placeholder="/xxx" style="width:100%;height:38px;font-size:13px;margin-top:2px;"></label>'
        + '<label><span style="font-size:12px;color:#6B7280;">排序权重</span><input id="banner-new-sort" type="number" class="proto-input" value="1" style="width:100%;height:38px;font-size:13px;margin-top:2px;"></label>'
        + '<label><span style="font-size:12px;color:#6B7280;">状态</span><select id="banner-new-status" class="proto-input" style="width:100%;height:38px;font-size:13px;margin-top:2px;"><option value="上线">上线</option><option value="下线">下线</option></select></label>'
        + '<button class="proto-btn proto-btn-primary" style="width:100%;height:42px;border-radius:8px;background:#10B981;" onclick="saveBannerNew()"><i class="fas fa-check"></i> 保存</button>'
        + '</div>';
    openModal('新增Banner', html, { width: 460 });
}

function saveBannerNew() {
    var data = (window._adminData || {})['admin-banner'];
    if (!data) { showToast('⚠️ 数据未加载'); return; }
    var title = document.getElementById('banner-new-title').value.trim();
    var link = document.getElementById('banner-new-link').value.trim();
    var sort = parseInt(document.getElementById('banner-new-sort').value) || 1;
    var status = document.getElementById('banner-new-status').value;
    if (!title) { showToast('请填写标题'); return; }
    data.banners = data.banners || [];
    data.banners.push({ title: title, link: link, sort: sort, status: status });
    data.total = data.banners.length;
    closeModal();
    adminSave('admin-banner', '新增 Banner：' + title + '（已写入数据中台）').then(function () {
        adminRefresh('admin-banner');
    });
}

// ============================================================
// 9. 数据统计
// ============================================================
registerPage('admin-stats', '数据统计', '运营后台', '', function () {
    adminLoadData('admin-stats', function (container, data) {
        const ranges = data.ranges || [];
        const stats = data.stats || [];
        const charts = data.charts || [];

        const rangesOpts = ranges.map(r => `<option>${r}</option>`).join('');
        const statsHtml = stats.map(s => StatCard(s.label, s.value, s.change, s.color)).join('');
        // 前两张图表左右排布，其余整行排布（保持原视觉布局）
        const gridCharts = charts.slice(0, 2).map(c => adminCard(c.title, ChartPlaceholder(c.label, c.height))).join('');
        const restCharts = charts.slice(2).map(c => adminCard(c.title, ChartPlaceholder(c.label, c.height))).join('');

        container.innerHTML = `
            <div style="background:white;border-radius:12px;padding:14px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);display:flex;gap:10px;align-items:center;">
                <select class="proto-input" style="width:140px;" onchange="showToast('已切换：'+this.value)">${rangesOpts}</select>
                <button class="proto-btn proto-btn-primary" style="width:auto;padding:0 20px;height:42px;border-radius:8px;" onclick="var rng=this.parentElement.querySelector('select').value;openModal('导出报表', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b>统计周期：</b>'+rng+'<br><b>报表内容：</b>用户数据、学习数据、会员数据、留存数据<br><b>格式：</b>Excel (.xlsx)<br><br><div style=&quot;text-align:center;padding:16px;background:#F0FDF4;border-radius:8px;margin:8px 0;&quot;><i class=&quot;fas fa-check-circle&quot; style=&quot;font-size:32px;color:#10B981;&quot;></i><div style=&quot;margin-top:8px;font-weight:600;color:#10B981;&quot;>报表已导出完毕</div></div><span style=&quot;color:#6B7280;&quot;>点击下方按钮下载报表文件。</span></div>')"><i class="fas fa-download"></i> 导出报表</button>
            </div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px;">${statsHtml}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">${gridCharts}</div>
            ${restCharts}
        `;
    });

    return AdminPage('数据统计', ADMIN_MENU, 'stats', adminLoading('admin-stats'));
});

// ============================================================
// 10. 留存分析
// ============================================================
registerPage('admin-retention', '留存分析', '运营后台', '', function () {
    adminLoadData('admin-retention', function (container, data) {
        const stats = data.stats || [];
        const retention = data.retention || [];
        const chart = data.chart || '图表区域';

        const statsHtml = stats.map(s => StatCard(s.label, s.value, s.change, s.color)).join('');
        const cellColor = v => v >= 40 ? '#1D4ED8' : v >= 30 ? '#3B82F6' : v >= 25 ? '#60A5FA' : v >= 20 ? '#93C5FD' : '#DBEAFE';
        const cell = v => `<td><span style="display:inline-block;padding:3px 10px;border-radius:6px;color:white;font-weight:600;font-size:12px;background:${cellColor(v)};">${v}%</span></td>`;

        const rowsHtml = retention.map(r => `
            <tr>
                <td>${r.date}</td>
                <td>${r.reg}</td>
                ${cell(r.d1)}${cell(r.d3)}${cell(r.d7)}${cell(r.d14)}${cell(r.d30)}
            </tr>
        `).join('');

        container.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:16px;">${statsHtml}</div>
            ${adminCard('留存率表格', `
                <table class="admin-table">
                    <thead><tr><th>注册日期</th><th>注册数</th><th>次日</th><th>3日</th><th>7日</th><th>14日</th><th>30日</th></tr></thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            `)}
            ${adminCard('留存曲线', ChartPlaceholder(chart, 200))}
        `;
    });

    return AdminPage('留存分析', ADMIN_MENU, 'retention', adminLoading('admin-retention'));
});

// ============================================================
// 录入真题表单 + 本地文件导入
// ============================================================
function openExamEntryForm() {
    var html = '<div style="display:flex;flex-direction:column;gap:14px;">'
        // 行：年份 + 省份
        + '<div style="display:flex;gap:8px;">'
        +   '<label style="flex:1;"><span style="font-size:12px;color:#6B7280;">年份</span>'
        +   '<select id="exam-year" class="proto-input" style="width:100%;height:38px;font-size:13px;margin-top:2px;">'
        +   '<option value="">请选择</option><option>2025</option><option>2024</option><option>2023</option><option>2022</option><option>2021</option>'
        +   '</select></label>'
        +   '<label style="flex:1;"><span style="font-size:12px;color:#6B7280;">省份</span>'
        +   '<select id="exam-province" class="proto-input" style="width:100%;height:38px;font-size:13px;margin-top:2px;">'
        +   '<option value="">请选择</option><option>浙江</option><option>北京</option><option>上海</option><option>江苏</option><option>广东</option><option>山东</option><option>河南</option><option>四川</option><option>湖北</option><option>湖南</option>'
        +   '</select></label>'
        + '</div>'
        // 行：科目 + 题型
        + '<div style="display:flex;gap:8px;">'
        +   '<label style="flex:1;"><span style="font-size:12px;color:#6B7280;">科目</span>'
        +   '<select id="exam-subject" class="proto-input" style="width:100%;height:38px;font-size:13px;margin-top:2px;">'
        +   '<option value="">请选择</option><option>数学</option><option>语文</option><option>英语</option><option>物理</option><option>化学</option><option>生物</option><option>政治</option><option>历史</option><option>地理</option>'
        +   '</select></label>'
        +   '<label style="flex:1;"><span style="font-size:12px;color:#6B7280;">题型</span>'
        +   '<select id="exam-type" class="proto-input" style="width:100%;height:38px;font-size:13px;margin-top:2px;" onchange="toggleExamOptions()">'
        +   '<option value="选择题">选择题</option><option value="填空题">填空题</option><option value="解答题">解答题</option><option value="实验题">实验题</option>'
        +   '</select></label>'
        + '</div>'
        // 行：题号 + 难度
        + '<div style="display:flex;gap:8px;">'
        +   '<label style="flex:1;"><span style="font-size:12px;color:#6B7280;">题号</span>'
        +   '<input id="exam-no" type="text" class="proto-input" placeholder="如：21" style="width:100%;height:38px;font-size:13px;margin-top:2px;"></label>'
        +   '<label style="flex:1;"><span style="font-size:12px;color:#6B7280;">难度</span>'
        +   '<select id="exam-difficulty" class="proto-input" style="width:100%;height:38px;font-size:13px;margin-top:2px;">'
        +   '<option value="简单">简单</option><option value="中等">中等</option><option value="困难">困难</option>'
        +   '</select></label>'
        + '</div>'
        // 题干
        + '<label><span style="font-size:12px;color:#6B7280;">题干内容</span>'
        + '<textarea id="exam-content" class="proto-input" placeholder="请输入题目内容..." style="width:100%;min-height:80px;font-size:13px;margin-top:2px;resize:vertical;"></textarea></label>'
        // 选项（选择题时显示）
        + '<div id="exam-options-area" style="display:flex;flex-direction:column;gap:6px;">'
        +   '<span style="font-size:12px;color:#6B7280;">选项（A/B/C/D）</span>'
        +   '<input id="exam-opt-a" type="text" class="proto-input" placeholder="A. 选项内容" style="width:100%;height:34px;font-size:13px;">'
        +   '<input id="exam-opt-b" type="text" class="proto-input" placeholder="B. 选项内容" style="width:100%;height:34px;font-size:13px;">'
        +   '<input id="exam-opt-c" type="text" class="proto-input" placeholder="C. 选项内容" style="width:100%;height:34px;font-size:13px;">'
        +   '<input id="exam-opt-d" type="text" class="proto-input" placeholder="D. 选项内容" style="width:100%;height:34px;font-size:13px;">'
        + '</div>'
        // 正确答案
        + '<label><span style="font-size:12px;color:#6B7280;">正确答案</span>'
        + '<input id="exam-answer" type="text" class="proto-input" placeholder="如：B 或 详细解答" style="width:100%;height:38px;font-size:13px;margin-top:2px;"></label>'
        // 解析
        + '<label><span style="font-size:12px;color:#6B7280;">答案解析</span>'
        + '<textarea id="exam-analysis" class="proto-input" placeholder="请输入答案解析..." style="width:100%;min-height:60px;font-size:13px;margin-top:2px;resize:vertical;"></textarea></label>'
        // 分隔线
        + '<div style="border-top:1px solid #E5E7EB;margin:2px 0;"></div>'
        // 文件导入区域
        + '<div style="background:#F9FAFB;border:1px dashed #D1D5DB;border-radius:8px;padding:14px;display:flex;flex-direction:column;gap:8px;">'
        +   '<div style="font-size:13px;font-weight:600;color:#374151;"><i class="fas fa-file-import" style="margin-right:6px;"></i>从本地设备导入</div>'
        +   '<div style="font-size:12px;color:#6B7280;">支持 JSON 格式真题文件，自动填充表单</div>'
        +   '<div style="display:flex;gap:8px;">'
        +     '<button class="proto-btn proto-btn-primary" style="flex:1;height:36px;border-radius:8px;font-size:13px;background:#3B82F6;" onclick="document.getElementById(\'exam-file-input\').click()"><i class="fas fa-upload"></i> 选择文件</button>'
        +     '<button class="proto-btn" style="flex:1;height:36px;border-radius:8px;font-size:13px;background:#F3F4F6;color:#374151;" onclick="showExamFileFormat()">查看格式</button>'
        +   '</div>'
        +   '<input id="exam-file-input" type="file" accept=".json,.txt" style="display:none;" onchange="importExamFromFile(this)">'
        +   '<div id="exam-file-status" style="font-size:12px;color:#10B981;display:none;"></div>'
        + '</div>'
        // 按钮组
        + '<div style="display:flex;gap:8px;margin-top:4px;">'
        +   '<button class="proto-btn proto-btn-primary" style="flex:1;height:42px;border-radius:8px;font-size:14px;background:#10B981;" onclick="saveExamQuestion()"><i class="fas fa-check"></i> 保存真题</button>'
        +   '<button class="proto-btn" style="width:80px;height:42px;border-radius:8px;font-size:14px;background:#F3F4F6;color:#374151;" onclick="closeModal()">取消</button>'
        + '</div>'
        + '</div>';
    openModal('录入真题', html, { width: 500 });
}

// 题型切换时显示/隐藏选项区域
function toggleExamOptions() {
    var type = document.getElementById('exam-type');
    if (!type) return;
    var area = document.getElementById('exam-options-area');
    if (type.value === '选择题') {
        area.style.display = 'flex';
    } else {
        area.style.display = 'none';
    }
}

// 保存真题
function saveExamQuestion() {
    var year = document.getElementById('exam-year').value;
    var province = document.getElementById('exam-province').value;
    var subject = document.getElementById('exam-subject').value;
    var no = document.getElementById('exam-no').value;
    var type = document.getElementById('exam-type').value;
    var difficulty = document.getElementById('exam-difficulty').value;
    var content = document.getElementById('exam-content').value;

    if (!year || !province || !subject || !content) {
        showToast('请填写年份、省份、科目和题干内容');
        return;
    }

    // 难度字符串转数字（简单→1，中等→2，困难→3）
    var diffNum = difficulty === '简单' ? 1 : difficulty === '困难' ? 3 : 2;

    // 构造后端 API 要求的题目对象（字段映射：no → question_number）
    var question = {
        source: 'real_exam',
        year: parseInt(year) || null,
        province: province,
        subject: subject,
        question_number: no || '未编号',
        type: type,
        difficulty: diffNum,
        content: content,
        options: type === '选择题' ? {
            A: document.getElementById('exam-opt-a').value,
            B: document.getElementById('exam-opt-b').value,
            C: document.getElementById('exam-opt-c').value,
            D: document.getElementById('exam-opt-d').value
        } : null,
        answer: document.getElementById('exam-answer').value,
        analysis: document.getElementById('exam-analysis').value
    };

    // 同步保存到 localStorage（原型级数据持久化 + 降级兜底）
    try {
        var list = JSON.parse(localStorage.getItem('custom_exams') || '[]');
        list.push(question);
        localStorage.setItem('custom_exams', JSON.stringify(list));
    } catch (e) { console.warn('localStorage 不可用', e); }

    // 调用后端 API 写入云端 KV 数据库（智能中台）
    try {
        var btn = (typeof event !== 'undefined' && event && event.target) || null;
        if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; btn.textContent = '保存中...'; }
    } catch(e) { /* event 不可用时忽略 */ }

    fetch('/api/questions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'json', data: [question] })
    })
    .then(function (r) { return r.json(); })
    .then(function (res) {
        try { if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.innerHTML = '<i class="fas fa-check"></i> 保存真题'; } } catch(e) {}
        if (res.code === 0) {
            closeModal();
            showToast('✅ 真题已入库：' + year + ' ' + province + ' ' + subject + ' 第' + (no || '?') + '题（已写入云端题库）');
            // 刷新真题列表（如果页面有渲染函数则调用）
            if (typeof renderAdminExams === 'function') renderAdminExams();
        } else {
            showToast('⚠️ 已暂存本地，云端入库失败：' + (res.msg || '未知错误'));
        }
    })
    .catch(function (err) {
        try { if (btn) { btn.disabled = false; btn.style.opacity = '1'; btn.innerHTML = '<i class="fas fa-check"></i> 保存真题'; } } catch(e) {}
        console.error('入库失败', err);
        closeModal();
        showToast('⚠️ 已暂存本地，云端服务不可用（已保存至浏览器本地）');
    });
}

// 从本地文件导入真题
function importExamFromFile(input) {
    var file = input.files[0];
    if (!file) return;
    var status = document.getElementById('exam-file-status');
    var reader = new FileReader();

    reader.onload = function (e) {
        var text = e.target.result;
        var data = null;
        try {
            data = JSON.parse(text);
        } catch (err) {
            status.style.color = '#EF4444';
            status.textContent = '文件解析失败：非有效 JSON 格式';
            status.style.display = 'block';
            return;
        }

        // 支持单个题目对象或题目数组
        var q = Array.isArray(data) ? data[0] : data;
        if (!q) {
            status.style.color = '#EF4444';
            status.textContent = '文件中未找到题目数据';
            status.style.display = 'block';
            return;
        }

        // 填充表单
        if (q.year) document.getElementById('exam-year').value = q.year;
        if (q.province) document.getElementById('exam-province').value = q.province;
        if (q.subject) document.getElementById('exam-subject').value = q.subject;
        if (q.no) document.getElementById('exam-no').value = q.no;
        if (q.type) document.getElementById('exam-type').value = q.type;
        if (q.difficulty) document.getElementById('exam-difficulty').value = q.difficulty;
        if (q.content) document.getElementById('exam-content').value = q.content;
        if (q.answer) document.getElementById('exam-answer').value = q.answer;
        if (q.analysis) document.getElementById('exam-analysis').value = q.analysis;
        if (q.options && q.options.A) document.getElementById('exam-opt-a').value = q.options.A;
        if (q.options && q.options.B) document.getElementById('exam-opt-b').value = q.options.B;
        if (q.options && q.options.C) document.getElementById('exam-opt-c').value = q.options.C;
        if (q.options && q.options.D) document.getElementById('exam-opt-d').value = q.options.D;

        toggleExamOptions();
        status.style.color = '#10B981';
        status.textContent = '已导入：' + file.name + '（' + (Array.isArray(data) ? data.length + '题' : '1题') + '）';
        status.style.display = 'block';
        showToast('文件导入成功，已自动填充表单');
    };

    reader.onerror = function () {
        status.style.color = '#EF4444';
        status.textContent = '文件读取失败';
        status.style.display = 'block';
    };

    reader.readAsText(file, 'UTF-8');
}

// 显示文件格式说明
function showExamFileFormat() {
    var sample = {
        year: '2025',
        province: '浙江',
        subject: '数学',
        no: '21',
        type: '选择题',
        difficulty: '中等',
        content: '已知函数 f(x) = x³ - 3x + 1，求 f(x) 的极值。',
        options: { A: '极大值3，极小值-3', B: '极大值3，极小值-1', C: '极大值1，极小值-3', D: '无极值' },
        answer: 'C',
        analysis: '求导 f\'(x)=3x²-3，令 f\'(x)=0 得 x=±1。f(1)=-1 为极小值，f(-1)=3 为极大值。'
    };
    var html = '<div style="font-size:13px;line-height:1.8;color:#374151;">'
        + '<p>JSON 文件格式示例：</p>'
        + '<pre style="background:#F3F4F6;border-radius:8px;padding:12px;overflow-x:auto;font-size:12px;line-height:1.6;white-space:pre-wrap;">'
        + JSON.stringify(sample, null, 2)
        + '</pre>'
        + '<p style="margin-top:10px;color:#6B7280;">字段说明：<br>'
        + '· year: 年份（如 2025）<br>'
        + '· province: 省份（如 浙江）<br>'
        + '· subject: 科目（如 数学）<br>'
        + '· no: 题号<br>'
        + '· type: 题型（选择题/填空题/解答题/实验题）<br>'
        + '· difficulty: 难度（简单/中等/困难）<br>'
        + '· content: 题干内容<br>'
        + '· options: 选项（选择题时使用）<br>'
        + '· answer: 正确答案<br>'
        + '· analysis: 答案解析</p>'
        + '</div>';
    openModal('文件格式说明', html, { width: 460 });
}
