// ============================================================
// 原型核心 - 路由系统 & 导航
// ============================================================

// 页面注册表（由各 pages-*.js 文件填充）
const PAGES = {};
const PAGE_GROUPS = [];
// 暴露给浏览器调试工具
if (typeof window !== 'undefined') {
    window.PAGES = PAGES;
    window.PAGE_GROUPS = PAGE_GROUPS;
}

// 注册页面：icon 参数可传，未传的情况下 buildSidebar 会按 key/title 自动匹配语义图标
function registerPage(key, title, group, icon, render) {
    PAGES[key] = { key, title, group, icon: icon || '', render };
}

// 按页面 key/title 语义匹配图标：语义结果优先，页面显式传的图标仅在不是"占位符/通用图标"时才生效，保证每个模块图标真正不同
function _resolvePageIcon(page) {
    const key = (page.key || '').toLowerCase();
    const title = page.title || '';
    const iconMap = [
        // ========== 高精度专属规则（放在前面优先匹配，key/title 双限定）==========
        // AI核心模块（与 AI学习中心组 做区分）
        [/^ai-module-coach$|AI核心模块.*教练/, 'fa-microchip'],
        [/^ai-module-explain$|AI核心模块.*讲题引擎/, 'fa-sitemap'],
        [/^ai-module-paper$|AI核心模块.*组卷引擎/, 'fa-file-circle-plus'],
        [/^ai-module-predict$|AI预测高考$|AI核心模块.*预测/, 'fa-brain'],
        [/^ai-auto-import$|AI自动入库/, 'fa-inbox'],
        [/^ai-auto-import-cut$|LLM切题详情/, 'fa-code'],      // LLM切题详情：代码/算法处理（区别于教师AI切题fa-scissors）
        [/^ai-auto-import-ocr$|OCR识别详情/, 'fa-eye'],        // OCR识别详情
        [/auto.*import.*ocr|AI自动OCR/, 'fa-eye'],
        [/^ai-module-graph$|AI核心模块.*图谱/, 'fa-share-nodes'],
        [/^ai-model-center$|AI模型中心/, 'fa-microchip'],
        // 教师后台 vs 拍照搜题 组里"AI解析"做区分
        [/^teacher-parse$|教师.*解析/, 'fa-wand-sparkles'],
        // 运营后台"用户/会员/OCR"更细分
        [/^admin-users$|运营.*用户管理/, 'fa-user-tie'],
        [/^admin-members$|运营.*会员/, 'fa-id-card'],
        [/^admin-ocr$|运营.*OCR/, 'fa-stamp'],
        // 登录注册组（更具体优先，分开避免相同图标）
        [/^login-register$/, 'fa-file-signature'], // 密码注册：签名/表单
        [/^login$/, 'fa-right-to-bracket'],        // 登录：进入箭头
        [/^login-wechat$/, 'fa-comment'],           // 微信登录
        [/^login-wechat-qrcode$/, 'fa-qrcode'],     // 扫码登录
        [/^login-sms$/, 'fa-mobile-screen-button'], // 手机验证码
        [/^login-parent-bind$/, 'fa-users-gear'],   // 家长绑定
        // 首页组：首页(home)与其他首页子页区分
        [/^home$/, 'fa-bolt'],
        [/^home-countdown$/, 'fa-hourglass-half'],  // 高考倒计时
        [/^home-plan$/, 'fa-calendar-check'],       // AI学习计划（日历勾选=每日计划打卡）
        [/^home-task$/, 'fa-list-check'],           // 今日任务
        [/^home-duration$/, 'fa-clock'],            // 学习时长
        [/^home-analysis$/, 'fa-chart-simple'],     // AI学情分析
        [/^home-predict$/, 'fa-chart-line'],        // 提分预测
        [/^home-task-learn$/, 'fa-headphones'],     // 学习会话
        // AI学习中心组（必须放在次级/plan/规则前面，否则被提前匹配!）
        [/^ai-coach$/, 'fa-robot'],                  // AI学习教练（AI学习中心）
        [/^ai-explain$/, 'fa-chalkboard-user'],      // AI讲题（AI学习中心）
        [/^ai-qa$/, 'fa-question-circle'],           // AI答疑
        [/^ai-error$/, 'fa-xmark-circle'],           // AI错题分析
        [/^ai-plan$/, 'fa-route'],                   // AI学习规划：长期路线图（≠首页AI学习计划fa-calendar-check）
        // 志愿填报（确保唯一性）
        [/^college-recommend$/, 'fa-university'],
        [/^college-major$/, 'fa-graduation-cap'],
        [/^college-rank$/, 'fa-layer-group'],
        // 智能刷题组（更具体）
        [/^practice-real-exam$/, 'fa-book-open'],   // 真题
        [/^practice-mock$/, 'fa-file-pen'],         // 模拟题（做题）
        [/^practice-ai-recommend$/, 'fa-wand-magic-sparkles'], // AI推荐题
        [/^practice-mistakes$/, 'fa-circle-exclamation'],      // 易错题
        [/^practice-hotpoints$/, 'fa-fire'],                   // 高频考点
        // 成绩分析 更具体
        [/^score-monthly$/, 'fa-clipboard-list'],   // 月考分析：成绩单剪贴板列表（≠首页AI学习计划fa-calendar-check）
        [/^score-mock$/, 'fa-chart-column'],       // 模考分析（柱状分析图）
        [/^score-school-rank$/, 'fa-trophy'],
        [/^score-province-rank$/, 'fa-globe-asia'],
        [/^score-improvement$/, 'fa-rocket'],
        // 个人中心
        [/^profile-main$|个人中心$/, 'fa-user-circle'],
        [/^profile-vip$/, 'fa-crown'],
        [/^profile-report$/, 'fa-chart-pie'],
        [/^profile-parent$/, 'fa-users'],
        [/^profile-settings$/, 'fa-gear'],
        // 教师后台 更具体
        [/^teacher-dashboard$/, 'fa-house-chimney-window'],
        [/^teacher-upload$/, 'fa-cloud-arrow-up'],
        [/^teacher-split$/, 'fa-scissors'],
        [/^teacher-tag$/, 'fa-tags'],
        [/^teacher-exercise$/, 'fa-chalkboard'],
        [/^teacher-paper$/, 'fa-file-lines'],
        // 运营后台 更具体
        [/^admin-dashboard$/, 'fa-gauge-high'],
        [/^admin-exams$/, 'fa-book'],
        [/^admin-ai-review$/, 'fa-check-double'],
        [/^admin-content$/, 'fa-newspaper'],
        [/^admin-banner$/, 'fa-images'],
        [/^admin-stats$/, 'fa-table-columns'],       // 数据统计：数据表（≠成绩分析-模考分析fa-chart-column）
        [/^admin-retention$/, 'fa-arrow-trend-up'],
        // ========== 原有语义规则（降为次级匹配）==========
        // 登录注册组（次级）
        [/register|注册/, 'fa-file-signature'],
        [/wechat.*qrcode|qrcode.*login|扫码登录/, 'fa-qrcode'],
        [/login.*wechat|微信登录/, 'fa-comment'],
        [/login.*sms|验证码|短信/, 'fa-mobile-screen-button'],
        [/parent.*bind|家长绑定/, 'fa-users-gear'],
        [/login|登录/, 'fa-right-to-bracket'],
        // 首页组（次级）
        [/countdown|倒计时/, 'fa-hourglass-half'],
        [/plan|学习计划/, 'fa-calendar-days'],
        [/task.*learn|tasklearn|会话/, 'fa-headphones'],
        [/duration|学习时长/, 'fa-clock'],
        [/analysis|学情分析/, 'fa-chart-simple'],
        [/predict|提分预测/, 'fa-chart-line'],
        [/home.*task|今日任务/, 'fa-list-check'],
        [/今日提分/, 'fa-bolt'],
        [/^discover$|^discover-|发现/, 'fa-compass'],
        [/message|消息/, 'fa-comment-dots'],
        // 智能刷题组
        [/real.*exam|真题/, 'fa-book-open'],
        [/score.*mock|模考/, 'fa-file-alt'],
        [/^practice-mock$|模拟题$/, 'fa-file-pen'],
        [/ai.*recommend|AI推荐题/, 'fa-wand-magic-sparkles'],
        [/mistake|易错题/, 'fa-circle-exclamation'],
        [/hotpoint|高频考点/, 'fa-fire'],
        // 成绩分析组
        [/monthly|月考/, 'fa-clipboard-list'],
        [/school.*rank|校排名/, 'fa-trophy'],
        [/province.*rank|全省排名/, 'fa-globe-asia'],
        [/improvement|提分空间/, 'fa-rocket'],
        // 志愿填报组
        [/recommend|院校推荐/, 'fa-university'],
        [/major|专业推荐/, 'fa-graduation-cap'],
        [/rank|位次分析/, 'fa-layer-group'],
        // AI学习中心组（与首页组同语义做区分：长期学习路径 vs 日常学习计划）
        [/^ai-coach$|AI学习中心.*教练/, 'fa-robot'],
        [/^ai-explain$|AI学习中心.*讲题$/, 'fa-chalkboard-user'],
        [/^ai-qa$|答疑/, 'fa-question-circle'],
        [/^ai-error$|AI错题分析/, 'fa-xmark-circle'],
        [/^ai-plan$|AI学习中心.*学习规划/, 'fa-route'],   // AI学习规划：长期路线图（区别于首页AI学习计划fa-calendar-check）
        // AI核心模块（次级，已被高精度覆盖的会跳过）
        [/graph|知识图谱/, 'fa-diagram-project'],
        [/paper|组卷/, 'fa-file-lines'],
        // 拍照搜题组
        [/^photo-ocr$|^photo$|拍照搜题$/, 'fa-camera'],
        [/^photo-parse$|拍照.*解析$/, 'fa-magnifying-glass-chart'],
        [/similar|相似题/, 'fa-copy'],
        [/video|视频讲解/, 'fa-video'],
        // 个人中心（次级）
        [/vip|会员/, 'fa-crown'],
        [/report|报告/, 'fa-chart-pie'],
        [/parent|家长/, 'fa-users'],
        [/settings?|设置/, 'fa-gear'],
        [/profile$|main|个人中心/, 'fa-user-circle'],
        // 教师后台（次级）
        [/teacher.*dashboard|教学首页/, 'fa-house-chimney-window'],
        [/teacher.*upload|上传/, 'fa-cloud-arrow-up'],
        [/teacher.*split|切题/, 'fa-scissors'],
        [/teacher.*parse|解析/, 'fa-wand-sparkles'],
        [/teacher.*tag|知识点|标知识/, 'fa-tags'],
        [/teacher.*exercise|练习/, 'fa-chalkboard'],
        // 运营后台（次级）
        [/admin.*dashboard|数据看板/, 'fa-gauge-high'],
        [/admin.*users|用户管理/, 'fa-users'],
        [/admin.*member|会员/, 'fa-id-card'],
        [/admin.*exam|真题/, 'fa-book'],
        [/admin.*ocr|OCR/, 'fa-eye'],
        [/admin.*review|AI审核/, 'fa-check-double'],
        [/admin.*content|内容/, 'fa-newspaper'],
        [/admin.*banner|Banner/, 'fa-images'],
        [/admin.*stats|数据统计/, 'fa-table-columns'],
        [/admin.*retention|留存/, 'fa-arrow-trend-up']
    ];
    for (let i = 0; i < iconMap.length; i++) {
        if (iconMap[i][0].test(key) || iconMap[i][0].test(title)) return iconMap[i][1];
    }
    // 语义匹配不到时：若页面传了非占位图标则用之，否则兜底
    const placeholders = ['fa-home', 'fa-sign-in-alt', 'fa-file-alt', 'fa-robot', ''];
    if (page.icon && placeholders.indexOf(page.icon) === -1) return page.icon;
    return 'fa-file-lines';
}

// 按组名匹配不同的组图标（替代统一文件夹图标）
function _resolveGroupIcon(groupName, pageGroups) {
    const g = pageGroups.find(x => x.name === groupName);
    if (g && g.icon) return g.icon;
    const map = {
        '登录注册': 'fa-user-lock',
        '首页': 'fa-house',
        '智能刷题': 'fa-pen-to-square',
        '成绩分析': 'fa-chart-line',
        '志愿填报': 'fa-graduation-cap',
        'AI学习中心': 'fa-lightbulb',
        'AI核心模块': 'fa-microchip',
        '拍照搜题': 'fa-camera-retro',
        '个人中心': 'fa-user',
        '教师后台': 'fa-chalkboard-user',
        '运营后台': 'fa-screwdriver-wrench'
    };
    return map[groupName] || 'fa-folder-open';
}

function registerGroup(name, icon) {
    PAGE_GROUPS.push({ name, icon, pages: [] });
}

// 导航历史
let navHistory = [];

// 导航到指定页面
function navigateTo(key) {
    if (!PAGES[key]) {
        document.getElementById('device-screen').innerHTML = `<div style="padding:40px;text-align:center;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:32px;margin-bottom:12px;"></i><p>页面 "${key}" 暂未实现</p></div>`;
        return;
    }
    navHistory.push(key);
    renderPage(key);
    // 更新导航高亮
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const navEl = document.querySelector(`.nav-item[data-page="${key}"]`);
    if (navEl) {
        navEl.classList.add('active');
        navEl.scrollIntoView({ block: 'nearest' });
    }
}

// 返回上一页
function navigateBack() {
    navHistory.pop();
    const prev = navHistory[navHistory.length - 1] || 'home';
    renderPage(prev);
}

// 渲染页面
function renderPage(key) {
    const page = PAGES[key];
    if (!page) return;
    const screen = document.getElementById('device-screen');
    screen.scrollTop = 0;
    screen.innerHTML = page.render();
    // 渲染后调用页面钩子（如扫码登录页自动生成二维码）
    if (typeof page.afterRender === 'function') {
        try { page.afterRender(); } catch (e) { console.warn('[renderPage] afterRender 异常', e); }
    }
}

// 弹窗（模态框）— 支持可选宽度参数
function openModal(title, contentHTML, opts) {
    // 移除已有弹窗
    closeModal();
    var maxW = (opts && opts.width) ? opts.width : 340;
    
    const overlay = document.createElement('div');
    overlay.id = 'proto-modal-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    
    const modal = document.createElement('div');
    modal.style.cssText = 'background:white;border-radius:16px;width:100%;max-width:' + maxW + 'px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);';
    modal.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #E5E7EB;">
            <div style="font-size:16px;font-weight:700;">${title}</div>
            <i class="fas fa-times" onclick="closeModal()" style="color:#9CA3AF;cursor:pointer;font-size:18px;"></i>
        </div>
        <div style="padding:20px;overflow-y:auto;font-size:14px;color:#374151;line-height:1.7;">${contentHTML}</div>
    `;
    
    overlay.appendChild(modal);
    // 点击遮罩层关闭弹窗
    overlay.addEventListener('click', function(e) { 
        if (e.target === overlay) closeModal(); 
    });
    // 按ESC键关闭弹窗
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    document.body.appendChild(overlay);
}

function closeModal() {
    const overlay = document.getElementById('proto-modal-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// 设备切换
let currentDevice = 'mobile';
function applyDeviceScale() {
    var preview = document.getElementById('proto-preview');
    var inner = document.getElementById('proto-preview-inner');
    var frame = document.getElementById('device-frame');
    if (!preview || !inner || !frame) return;
    try {
        inner.style.transform = 'none';
        var availW = Math.max(preview.clientWidth - 20, 200);
        var availH = Math.max(preview.clientHeight - 20, 200);
        var naturalW = frame.offsetWidth || 390;
        var naturalH = frame.offsetHeight || 780;
        var scale = Math.min(availW / naturalW, availH / naturalH, 1);
        inner.style.transform = 'scale(' + scale + ')';
    } catch (e) { /* ignore */ }
}
function switchDevice(device) {
    currentDevice = device;
    const frame = document.getElementById('device-frame');
    frame.className = `device-frame ${device}`;
    document.querySelectorAll('.proto-device-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.device === device);
    });
    applyDeviceScale();
}

// 分段控制器切换
function switchSegment(el) {
    el.parentElement.querySelectorAll('.proto-segment-item').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
}

// 构建侧边栏导航
function buildSidebar() {
    const sidebar = document.getElementById('proto-sidebar');
    let html = '';

    // 按组组织页面
    const groups = {};
    Object.values(PAGES).forEach(page => {
        if (!groups[page.group]) groups[page.group] = [];
        groups[page.group].push(page);
    });

    Object.keys(groups).forEach(groupName => {
        const pages = groups[groupName];
        const groupIcon = _resolveGroupIcon(groupName, PAGE_GROUPS);
        html += `<div class="nav-group">`;
        html += `<div class="nav-group-title"><i class="fas ${groupIcon}"></i> ${groupName} <span class="count">${pages.length}</span></div>`;
        pages.forEach(page => {
            const pageIcon = _resolvePageIcon(page);
            html += `<div class="nav-item" data-page="${page.key}" onclick="navigateTo('${page.key}')"><i class="fas ${pageIcon}"></i> ${page.title}</div>`;
        });
        html += `</div>`;
    });

    sidebar.innerHTML = html;

    // 更新页数统计
    document.getElementById('page-count').textContent = `${Object.keys(PAGES).length} 页`;
}

// 搜索
function initSearch() {
    document.getElementById('page-search').addEventListener('input', function(e) {
        const keyword = e.target.value.toLowerCase();
        document.querySelectorAll('.nav-item').forEach(item => {
            const text = item.textContent.toLowerCase();
            const page = item.dataset.page;
            const match = !keyword || text.includes(keyword) || (PAGES[page] && PAGES[page].title.toLowerCase().includes(keyword));
            item.style.display = match ? '' : 'none';
        });
    });
}

// 初始化
function initPrototype() {
    switchDevice('mobile');
    buildSidebar();
    initSearch();
    navigateTo('home');
    // 确保首屏和窗口大小变化时设备始终适配预览区
    try {
        applyDeviceScale();
        setTimeout(applyDeviceScale, 50);
        setTimeout(applyDeviceScale, 300);
    } catch (e) {}
    if (window.addEventListener) {
        window.addEventListener('resize', applyDeviceScale);
    }
}

// 等所有页面文件注册完毕后再初始化
// prototype.js 在 index.html 中先于 pages-*.js 加载，所以用 load 事件确保全部脚本执行完
window.addEventListener('load', initPrototype);
