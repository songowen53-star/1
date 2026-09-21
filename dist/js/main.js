// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', async function() {
    initNavigation();
    initInteractions();
    // 先用默认数据初始化图表（避免空白）
    initScoreChart();
    initRadarChart();
    animateProgressBars();
    animateRingChart();
    // 立即同步顶部日期与登录用户名（避免后端延迟期间显示静态文本）
    updateHeaderInfo();
    // 异步加载后端真实数据并更新UI
    await loadAppData();
});

// 立即同步顶部：真实日历日期 + 距高考天数 + 登录用户名
function updateHeaderInfo() {
    // 1. 真实日期：YYYY年M月D日 星期X
    try {
        const now = new Date();
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const dateStr = now.getFullYear() + '年' + (now.getMonth() + 1) + '月' + now.getDate() + '日 星期' + weekdays[now.getDay()];
        const firstSpan = document.querySelector('.date-info > span:first-child');
        if (firstSpan) firstSpan.textContent = dateStr;
    } catch (e) { console.warn('更新顶部日期失败', e); }

    // 2. 距高考天数：默认 2027 年 6 月 7 日；若用户已设置 exam_date 则用用户值
    //    若 exam_date 已过（如 2026-06-07 已过），自动顺延到下一年
    try {
        let examDateStr = '2027-06-07';
        const cached = (typeof Auth !== 'undefined' && Auth.getCachedUser) ? Auth.getCachedUser() : null;
        if (cached && cached.exam_date) examDateStr = cached.exam_date;
        const examDate = new Date(examDateStr + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // 若考试日期已过，自动顺延到下一年（高考每年 6 月 7 日）
        while (examDate < today) {
            examDate.setFullYear(examDate.getFullYear() + 1);
        }
        const days = Math.max(0, Math.ceil((examDate - today) / 86400000));
        const hl = document.querySelector('.highlight-days');
        if (hl) hl.textContent = days;
        // 同步底部「高考冲刺计划」横幅：剩余天数 + 预计提升分（距高考越近，AI 提分建议越保守）
        const bannerDays = document.getElementById('banner-days');
        if (bannerDays) bannerDays.textContent = days;
        const bannerImprove = document.getElementById('banner-improve');
        if (bannerImprove) {
            // 基础 30 分，超过 365 天按比例放大，临近高考（≤30 天）保守化
            const improve = days > 365 ? Math.round(30 + (days - 365) / 30) : Math.max(10, Math.round(30 * days / 365));
            bannerImprove.textContent = improve;
        }
    } catch (e) { console.warn('更新高考倒计时失败', e); }

    // 3. 登录用户名：优先 localStorage 缓存，未登录保持默认
    try {
        const cached = (typeof Auth !== 'undefined' && Auth.getCachedUser) ? Auth.getCachedUser() : null;
        if (cached && cached.name) {
            const el = document.getElementById('welcome-text');
            if (el) el.textContent = 'Hi, ' + cached.name + ' 👋';
            document.querySelectorAll('.chat-bubble').forEach(b => {
                if (b.textContent.includes('张同学')) {
                    b.textContent = b.textContent.replace(/张同学/g, cached.name);
                }
            });
        }
    } catch (e) { console.warn('更新用户名失败', e); }

    // 4. 学习日历周历同步：高亮今天、今天之前日期自动打勾
    try { syncCalendarToday(); } catch (e) { console.warn('同步学习日历失败', e); }
}

// 同步学习日历：根据真实星期几高亮今天 + 自动为今天之前（本周内已过去的）打勾
function syncCalendarToday() {
    const dayItems = document.querySelectorAll('.week-days .day-item');
    if (!dayItems.length) return;

    // 顺序：一 二 三 四 五 六 日（与 dayItems 一致）
    const labels = ['一', '二', '三', '四', '五', '六', '日'];
    // JS getDay(): 0=周日, 1=周一, ... 6=周六
    const jsDay = new Date().getDay();
    // 转为 labels 下标：周日(0)->6, 周一(1)->0, ..., 周六(6)->5
    const todayIdx = jsDay === 0 ? 6 : jsDay - 1;
    if (todayIdx < 0 || todayIdx >= dayItems.length) return;

    dayItems.forEach((item, i) => {
        item.classList.remove('today', 'active');
        const check = item.querySelector('.day-check');
        if (i < todayIdx) {
            // 今天之前的本周日期：已过去 → 默认打勾（学习过）
            item.classList.add('active');
            if (check) check.innerHTML = '<i class="fas fa-check"></i>';
        } else if (i === todayIdx) {
            // 今天：高亮 + 待打卡
            item.classList.add('today');
            if (check) check.innerHTML = '';
        } else {
            // 今天之后：未打卡
            if (check) check.innerHTML = '';
        }
    });

    // 同步"本周学习情况"副标题为本周日期范围（周一 ~ 今天）
    const subtitle = document.querySelector('.calendar-subtitle');
    if (subtitle) {
        const now = new Date();
        // 找到本周周一日期
        const monday = new Date(now);
        const offset = jsDay === 0 ? -6 : 1 - jsDay; // 周日回到周一需往前6天
        monday.setDate(now.getDate() + offset);
        const fmt = d => `${d.getMonth() + 1}月${d.getDate()}日`;
        subtitle.textContent = `${fmt(monday)} - ${fmt(now)} 本周学习情况`;
    }
}

// ========== 从后端加载全部数据 ==========
async function loadAppData() {
    // 并行加载所有数据
    const [user, weakPoints, summary, predictReport] = await Promise.all([
        api.getUser(),
        api.getWeakPoints(0.65, 5),
        api.getLearningSummary(7),
        api.getPredictReport()
    ]);

    if (user) updateUserUI(user);
    if (weakPoints) { renderWeakPoints(weakPoints); updateAIAdvice(weakPoints); }
    if (summary) renderGrowthRecord(summary);
    if (predictReport) {
        renderExamPredict(predictReport);
        renderSubjectScores(predictReport.subject_scores);
        updateRadarChart(predictReport.subject_scores);
        updateScoreChart(predictReport.predicted_score, predictReport.target_score);
    }

    // 加载今日任务和学习时长（同步原型端 AI今日提分模块）
    loadTodayTasks();
    loadDurationStats();

    // 加载已保存的模块自定义配置（覆盖默认显示）
    await loadModuleConfigs();
    // 初始化模块联动事件
    initLinkageEvents();
}

// 更新用户信息UI
function updateUserUI(user) {
    if (!user) return;
    const current = user.current_score || 0;
    const target = user.target_score || 0;
    // 首页元素可能不存在（用户在其他页面），统一加 null 检查
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    const setWidth = (id, val) => { const el = document.getElementById(id); if (el) el.style.width = val; };
    if (user.current_score) setText('current-score-num', current);
    if (user.target_score) {
        setText('target-score-num', target);
        setText('improvement-num', target - current);
    }
    if (current && target) {
        const rate = Math.min(100, Math.round((current / target) * 100));
        setText('goal-rate', rate + '%');
        setWidth('goal-progress-fill', rate + '%');
    }
    if (user.exam_date) {
        const examDate = new Date(user.exam_date);
        const days = Math.max(0, Math.ceil((examDate - new Date()) / 86400000));
        const highlightEl = document.querySelector('.highlight-days');
        if (highlightEl) highlightEl.textContent = days;
    }
    if (user.name) {
        setText('welcome-text', 'Hi, ' + user.name + ' 👋');
        document.querySelectorAll('.chat-bubble').forEach(b => {
            if (b.textContent.includes('张同学')) {
                b.textContent = b.textContent.replace(/张同学/g, user.name);
            }
        });
    }
    // 再次刷新顶部：真实日期 + 高考倒计时（覆盖HTML写死的静态值）
    updateHeaderInfo();
}

// 渲染薄弱知识点表格
function renderWeakPoints(weakPoints) {
    const tbody = document.querySelector('.weak-table tbody');
    if (!tbody || weakPoints.length === 0) return;

    const tagClass = { '数学': 'tag-math', '英语': 'tag-english', '物理': 'tag-physics', '化学': 'tag-chem', '语文': 'tag-chinese' };
    const tagText = { '数学': '数', '英语': '英', '物理': '物', '化学': '化', '语文': '语' };
    const fillClass = (rate) => rate < 0.45 ? 'red' : (rate < 0.55 ? 'orange' : (rate < 0.65 ? 'blue' : 'green'));
    const adviceClass = (kp) => {
        if (kp.mastery_rate < 0.45) return '<span class="advice advice-priority">优先突破</span>';
        if (kp.mastery_rate < 0.55) return '<span class="advice advice-focus">重点突破</span>';
        if (kp.mastery_rate < 0.65) return '<span class="advice advice-train">加强训练</span>';
        return '<span class="advice advice-solid">巩固提升</span>';
    };

    tbody.innerHTML = weakPoints.map(kp => `
        <tr>
            <td>
                <span class="tag ${tagClass[kp.subject] || 'tag-math'}">${tagText[kp.subject] || '综'}</span>
                ${kp.name}
            </td>
            <td>
                <div class="mastery-bar">
                    <div class="mastery-fill ${fillClass(kp.mastery_rate)}" style="width: ${Math.round(kp.mastery_rate * 100)}%"></div>
                </div>
                <span class="mastery-text">${Math.round(kp.mastery_rate * 100)}%</span>
            </td>
            <td><span class="score-gain">+${kp.score_gain}分</span></td>
            <td>${adviceClass(kp)}</td>
        </tr>
    `).join('');

    // 重新绑定交互
    initInteractions();
}

// 渲染各科分数
function renderSubjectScores(subjectScores) {
    if (!subjectScores) return;
    const container = document.querySelector('.subject-scores');
    if (!container) return;
    container.innerHTML = subjectScores.map(s => `
        <div class="sub-score">
            <div class="sub-name">${s.subject}</div>
            <div class="sub-num">${s.score}/${s.max_score}</div>
        </div>
    `).join('');
    // 更新总分
    const total = subjectScores.reduce((sum, s) => sum + s.score, 0);
    const radarScore = document.querySelector('.radar-score strong');
    if (radarScore) radarScore.textContent = total;
}

// 渲染成长记录
function renderGrowthRecord(summary) {
    if (!summary) return;
    const values = document.querySelectorAll('.growth-value');
    const changes = document.querySelectorAll('.growth-change');
    if (values.length >= 4) {
        values[0].textContent = summary.duration_hours + ' 小时';
        values[1].textContent = summary.questions_count + ' 题';
        values[2].textContent = summary.correct_rate + '%';
        values[3].textContent = summary.points + ' 分';
    }
    if (changes.length >= 3 && summary.changes) {
        const c = summary.changes;
        const arrowUp = '<i class="fas fa-arrow-up"></i>';
        const arrowDown = '<i class="fas fa-arrow-down"></i>';
        changes[0].innerHTML = `较上周 ${c.duration >= 0 ? arrowUp : arrowDown} ${Math.abs(c.duration)}%`;
        changes[0].className = `growth-change ${c.duration >= 0 ? 'up' : 'down'}`;
        changes[1].innerHTML = `较上周 ${c.questions >= 0 ? arrowUp : arrowDown} ${Math.abs(c.questions)}%`;
        changes[1].className = `growth-change ${c.questions >= 0 ? 'up' : 'down'}`;
        changes[2].innerHTML = `较上周 ${c.correct_rate >= 0 ? arrowUp : arrowDown} ${Math.abs(c.correct_rate)}%`;
        changes[2].className = `growth-change ${c.correct_rate >= 0 ? 'up' : 'down'}`;
    }
}

// 加载今日学习任务（同步原型端 AI今日提分 → 今日学习计划）
async function loadTodayTasks() {
    const container = document.getElementById('home-plan-list');
    if (!container) return;
    try {
        let data = await api.getTodayTasks();
        // 云端静态环境回退：API 失败时使用静态 JSON 文件
        if (!data || !data.tasks) {
            try {
                const resp = await fetch('prototype/data/pages/home-task.json');
                if (resp.ok) {
                    data = await resp.json();
                }
            } catch(e2) {}
        }
        if (!data || !data.tasks) {
            // 静态 JSON 也失败时，显示默认任务列表
            const progressSpan = document.getElementById('today-task-progress');
            if (progressSpan) progressSpan.textContent = '0/4';
            const progressFill = document.getElementById('today-progress-fill');
            if (progressFill) progressFill.style.width = '0%';
            const encourage = document.getElementById('calendar-encourage');
            if (encourage) encourage.textContent = '开始今天的学习之旅吧！';
            container.innerHTML = '<div class="plan-item"><div class="plan-subject subject-chinese">语</div><div class="plan-name">语文 · 古诗文鉴赏</div><div class="plan-time">32min</div></div><div class="plan-item"><div class="plan-subject subject-physics">物</div><div class="plan-name">物理 · 力学综合</div><div class="plan-time">28min</div></div><div class="plan-item"><div class="plan-subject subject-math">数</div><div class="plan-name">数学 · 圆锥曲线综合</div><div class="plan-time">47min</div></div><div class="plan-item"><div class="plan-subject subject-math">数</div><div class="plan-name">数学 · 导数第二问</div><div class="plan-time">41min</div></div>';
            return;
        }
        const tasks = data.tasks;
        const doneCount = data.done_count || 0;
        const totalCount = data.total_count || 0;
        const rate = data.completion_rate || 0;

        // 更新今日任务进度（学习日历卡片）
        const progressSpan = document.getElementById('today-task-progress');
        if (progressSpan) progressSpan.textContent = doneCount + '/' + totalCount;
        const progressFill = document.getElementById('today-progress-fill');
        if (progressFill) progressFill.style.width = rate + '%';

        // 渲染任务列表
        const tagClass = { '数学':'subject-math','语文':'subject-chinese','英语':'subject-english','物理':'subject-physics','化学':'subject-chem','生物':'subject-bio','政治':'subject-politics','历史':'subject-history','地理':'subject-geo' };
        const tagText = { '数学':'数','语文':'语','英语':'英','物理':'物','化学':'化','生物':'生','政治':'政','历史':'史','地理':'地' };

        if (tasks.length === 0) {
            container.innerHTML = '<div class="plan-item" style="justify-content:center;color:#10B981;"><i class="fas fa-check-circle" style="margin-right:6px;"></i>今日任务已全部完成</div>';
        } else {
            container.innerHTML = tasks.slice(0, 5).map(t => {
                const isDone = t.status === 'done';
                const cls = tagClass[t.subject] || 'subject-math';
                const txt = tagText[t.subject] || '综';
                return `<div class="plan-item" style="${isDone ? 'opacity:0.5;' : ''}">
                    <div class="plan-subject ${cls}">${txt}</div>
                    <div class="plan-name" style="${isDone ? 'text-decoration:line-through;' : ''}">${t.subject} · ${t.point}</div>
                    <div class="plan-time">${t.time}</div>
                </div>`;
            }).join('');
        }

        // 更新鼓励文字
        const encourage = document.getElementById('calendar-encourage');
        if (encourage) {
            if (rate >= 100) encourage.textContent = '今日任务全部完成，太棒了！';
            else if (rate >= 50) encourage.textContent = '已完成过半，继续保持！';
            else encourage.textContent = '开始今天的学习之旅吧！';
        }
    } catch (e) {
        console.warn('加载今日任务失败', e);
        container.innerHTML = '<div class="plan-item" style="justify-content:center;color:#9CA3AF;">暂无今日任务</div>';
    }
}

// 加载学习时长统计（同步原型端 AI今日提分 → 学习时长）
async function loadDurationStats() {
    try {
        let data = await api.getDurationStats();
        if (!data) {
            // 云端静态环境回退：使用默认值
            const hoursNum = document.getElementById('week-hours-num');
            if (hoursNum) hoursNum.textContent = '17.6';
            const hoursGoal = document.getElementById('week-hours-goal');
            if (hoursGoal) hoursGoal.textContent = '15';
            return;
        }
        // 更新本周学习时长
        const weekHours = data.summary || {};
        const hoursNum = document.getElementById('week-hours-num');
        if (hoursNum) hoursNum.textContent = (weekHours.week_hours || 0).toFixed(1);
        const hoursGoal = document.getElementById('week-hours-goal');
        if (hoursGoal) hoursGoal.textContent = (weekHours.daily_goal_hours ? (weekHours.daily_goal_hours * 7).toFixed(0) : 15);
    } catch (e) {
        console.warn('加载时长统计失败', e);
        // 异常时也显示默认值
        const hoursNum = document.getElementById('week-hours-num');
        if (hoursNum) hoursNum.textContent = '17.6';
        const hoursGoal = document.getElementById('week-hours-goal');
        if (hoursGoal) hoursGoal.textContent = '15';
    }
}

// 更新AI建议文字（基于薄弱知识点数据）
function updateAIAdvice(weakPoints) {
    if (!weakPoints || !weakPoints.length) return;
    const adviceEl = document.getElementById('ai-advice-text');
    if (!adviceEl) return;
    const top2 = weakPoints.slice(0, 2).map(w => w.subject + (w.name || ''));
    adviceEl.textContent = 'AI建议：重点突破' + top2.join('与');
}

// 渲染模考预测
function renderExamPredict(report) {
    if (!report) return;
    // 更新预测分数
    const predictScore = document.querySelector('.predict-score');
    if (predictScore) {
        predictScore.innerHTML = `${report.predicted_score}<span class="score-unit">分</span>`;
    }
    // 更新排名
    const predictRank = document.querySelector('.predict-rank');
    if (predictRank) {
        predictRank.innerHTML = `预测排名：全省 <strong>${report.rank.toLocaleString()}</strong> 名`;
    }
    // 更新置信度
    const confidence = document.querySelector('.confidence');
    if (confidence) {
        confidence.innerHTML = `置信度：<strong>${report.confidence}%</strong>`;
    }
    // 更新圆环图（用985概率作为百分比）
    const ringPercent = document.querySelector('.ring-percent');
    if (ringPercent) {
        ringPercent.textContent = report.probability.p985 + '%';
    }
    const ringFill = document.querySelector('.ring-fill');
    if (ringFill) {
        const circumference = 2 * Math.PI * 50;
        const offset = circumference - (report.probability.p985 / 100) * circumference;
        ringFill.style.strokeDashoffset = offset;
    }
}

// 更新雷达图（用各科得分率作为掌握率）
function updateRadarChart(subjectScores) {
    if (!subjectScores) return;
    const chart = Chart.getChart('radarChart');
    if (!chart) return;
    const currentData = subjectScores.map(s => Math.round(s.score / s.max_score * 100));
    chart.data.datasets[0].data = currentData;
    chart.update();
}

// 更新分数趋势图
function updateScoreChart(currentPredicted, targetScore) {
    const chart = Chart.getChart('scoreChart');
    if (!chart) return;
    const improvement = (targetScore || 633) - currentPredicted;
    const mid1 = Math.round(currentPredicted + improvement * 0.3);
    const mid2 = Math.round(currentPredicted + improvement * 0.6);
    chart.data.datasets[0].data = [currentPredicted, mid1, mid2, targetScore];
    chart.update();
}

// ========== 分数趋势折线图 ==========
function initScoreChart() {
    const ctx = document.getElementById('scoreChart');
    if (!ctx) return;

    const container = ctx.parentElement;
    ctx.width = container.offsetWidth;
    ctx.height = container.offsetHeight;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['当前', '30天后', '60天后', '90天后'],
            datasets: [{
                label: '预测分数',
                data: [603, 611, 620, 633],
                borderColor: 'rgba(255,255,255,0.9)',
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: 'white',
                pointBorderColor: 'rgba(255,255,255,0.9)',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    titleColor: '#1F2937',
                    bodyColor: '#1F2937',
                    borderColor: '#E5E7EB',
                    borderWidth: 1,
                    padding: 8,
                    displayColors: false,
                    callbacks: { label: function(c) { return c.parsed.y + '分'; } }
                }
            },
            scales: {
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: 'rgba(255,255,255,0.8)', font: { size: 11 } },
                    border: { display: false }
                },
                y: {
                    min: 590, max: 640,
                    grid: { color: 'rgba(255,255,255,0.1)', drawBorder: false },
                    ticks: { display: false },
                    border: { display: false }
                }
            },
            animation: { duration: 1500, easing: 'easeInOutQuart' }
        },
        plugins: [{
            id: 'customDataLabels',
            afterDatasetsDraw(chart) {
                const ctx = chart.ctx;
                const dataset = chart.data.datasets[0];
                const meta = chart.getDatasetMeta(0);
                ctx.save();
                ctx.font = 'bold 12px sans-serif';
                ctx.fillStyle = 'rgba(255,255,255,0.95)';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                meta.data.forEach((point, index) => {
                    ctx.fillText(dataset.data[index], point.x, point.y - 10);
                });
                ctx.restore();
            }
        }]
    });
}

// ========== 学科能力雷达图 ==========
function initRadarChart() {
    const ctx = document.getElementById('radarChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['数学', '语文', '英语', '物理', '化学', '生物', '政治', '历史', '地理'],
            datasets: [{
                label: '当前水平',
                data: [77, 72, 81, 80, 79, 76, 74, 75, 73],
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59,130,246,0.15)',
                borderWidth: 2,
                pointBackgroundColor: '#3B82F6',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 3
            }, {
                label: '高考目标',
                data: [90, 85, 88, 90, 88, 86, 85, 86, 84],
                borderColor: '#9CA3AF',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointBackgroundColor: '#9CA3AF',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    titleColor: '#1F2937',
                    bodyColor: '#1F2937',
                    borderColor: '#E5E7EB',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true,
                    callbacks: { label: function(c) { return c.dataset.label + ': ' + c.parsed.r + '%'; } }
                }
            },
            scales: {
                r: {
                    min: 0, max: 100,
                    ticks: { display: false, stepSize: 20 },
                    grid: { color: '#E5E7EB' },
                    angleLines: { color: '#E5E7EB' },
                    pointLabels: { color: '#6B7280', font: { size: 12 } }
                }
            },
            animation: { duration: 1500, easing: 'easeInOutQuart' }
        }
    });
}

// ========== 进度条动画 ==========
function animateProgressBars() {
    document.querySelectorAll('.progress-fill').forEach(bar => {
        const targetWidth = bar.style.width;
        bar.style.width = '0%';
        setTimeout(() => { bar.style.width = targetWidth; }, 300);
    });
}

// ========== 圆环图动画 ==========
function animateRingChart() {
    const ringFill = document.querySelector('.ring-fill');
    if (!ringFill) return;
    const circumference = 2 * Math.PI * 50;
    const targetPercent = 67;
    const targetOffset = circumference - (targetPercent / 100) * circumference;
    ringFill.style.strokeDashoffset = circumference;
    setTimeout(() => { ringFill.style.strokeDashoffset = targetOffset; }, 500);
}

// ========== 导航页面切换 ==========
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            navItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            const page = this.dataset.page;
            switchPage(page);
        });
    });

    // 底部导航：点击跳转到对应页面（与完整产品原型保持一致）
    const bottomTabMap = {
        '学习': 'home',
        '发现': 'discover',
        '搜题': 'photo-ocr',
        '消息': 'message',
        '我的': 'profile'
    };
    document.querySelectorAll('.bottom-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.bottom-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            const label = this.querySelector('span')?.textContent || '';
            const page = bottomTabMap[label];
            if (page) {
                // 同步侧边栏高亮：目标侧边项存在则高亮，否则清除全部高亮（保留底部 tab 自身高亮）
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
                if (navEl) {
                    navEl.classList.add('active');
                } else {
                    // 侧边栏无对应项（如 发现/消息/搜题），把底部 tab 自身作为活动高亮
                    this.classList.add('active');
                }
                switchPage(page);
            }
        });
    });
}

async function switchPage(page) {
    const scrollArea = document.querySelector('.content-scroll');
    if (page === 'home') {
        if (scrollArea.dataset.savedContent) {
            scrollArea.innerHTML = scrollArea.dataset.savedContent;
            if (typeof Chart !== 'undefined') {
                initScoreChart();
                initRadarChart();
                animateProgressBars();
                animateRingChart();
            }
            initInteractions();
            await loadAppData();
        }
        return;
    }
    if (!scrollArea.dataset.savedContent) {
        scrollArea.dataset.savedContent = scrollArea.innerHTML;
    }
    scrollArea.innerHTML = '<div style="text-align:center;padding:80px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:32px;margin-bottom:16px;display:block;"></i>加载中...</div>';
    try {
        switch (page) {
            case 'analysis': await renderAnalysisPage(scrollArea); break;
            case 'plan': await renderPlanPage(scrollArea); break;
            case 'home-countdown': renderCountdownPage(scrollArea); break;
            case 'home-task': renderTodayTaskPage(scrollArea); break;
            case 'home-duration': renderDurationPage(scrollArea); break;
            case 'home-task-learn': renderLearnSessionPage(scrollArea); break;
            case 'knowledge': await renderKnowledgePage(scrollArea); break;
            case 'training': await renderTrainingPage(scrollArea); break;
            case 'mistakes': await renderMistakesPage(scrollArea); break;
            case 'practice-real-exam': renderRealExamPage(scrollArea); break;
            case 'practice-mock': renderMockExamPage(scrollArea); break;
            case 'practice-ai-recommend': renderAIRecommendPage(scrollArea); break;
            case 'practice-hotpoints': renderHotpointsPage(scrollArea); break;
            case 'ai-explain': renderAIExplainPage(scrollArea); break;
            case 'ai-coach': renderAICoachPage(scrollArea); break;
            case 'ai-qa': renderAIQAPage(scrollArea); break;
            case 'ai-error': renderAIErrorPage(scrollArea); break;
            case 'ai-plan': renderAIPlanPage(scrollArea); break;
            case 'exam-predict': await renderExamPredictPage(scrollArea); break;
            case 'volunteer': renderVolunteerPage(scrollArea); break;
            case 'profile': await renderProfilePage(scrollArea); break;
            case 'discover': await renderDiscoverPage(scrollArea); break;
            case 'message': renderMessagePage(scrollArea); break;
            case 'photo-ocr': renderPhotoOcrPage(scrollArea); break;
            default: scrollArea.innerHTML = '<div style="padding:40px;">页面不存在</div>';
        }
    } catch (e) {
        console.error('页面加载失败', page, e);
        scrollArea.innerHTML = '<div style="padding:40px;color:#EF4444;"><i class="fas fa-exclamation-circle"></i> 页面加载失败，请稍后重试</div>';
    }
}

// ========== Toast 通知系统 ==========
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'toastOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ========== Modal 弹窗系统 ==========
function openModal(title, bodyHTML) {
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = bodyHTML;
    overlay.classList.add('show');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('show');
}

// 协议/隐私政策弹窗
function showProtoModal(type) {
    const content = {
        '用户协议': `<p style="margin-bottom:12px;"><strong>欢迎您使用高分AI-AI高考智能提分教练</strong></p>
            <p style="margin-bottom:10px;">本协议是您与AI高考之间就使用本服务所订立的契约。请您仔细阅读本协议全部内容。</p>
            <p style="margin-bottom:10px;"><strong>一、服务内容</strong></p>
            <p style="margin-bottom:10px;">本服务为高中生提供AI驱动的智能学习辅助，包括智能刷题、AI讲题、成绩分析、志愿填报推荐等功能。</p>
            <p style="margin-bottom:10px;"><strong>二、用户责任</strong></p>
            <p style="margin-bottom:10px;">1. 您应保证注册信息真实、准确；<br>2. 您不得将账号转让、出借给他人使用；<br>3. 您应合理使用本服务。</p>
            <p><strong>三、免责声明</strong></p>
            <p>本服务提供的AI分析结果仅供参考，不构成最终决策建议。</p>`,
        '隐私政策': `<p style="margin-bottom:12px;"><strong>我们重视您的隐私</strong></p>
            <p style="margin-bottom:10px;">本隐私政策说明我们如何收集、使用和保护您的个人信息。</p>
            <p style="margin-bottom:10px;"><strong>一、信息收集</strong></p>
            <p style="margin-bottom:10px;">我们可能收集：手机号（用于注册登录）、学习数据（答题记录、成绩信息）、设备信息。</p>
            <p style="margin-bottom:10px;"><strong>二、信息使用</strong></p>
            <p style="margin-bottom:10px;">收集的信息将用于：提供个性化学习推荐、改善服务质量、向家长推送学习进度（需授权绑定）。</p>
            <p><strong>三、信息保护</strong></p>
            <p>我们采用业界标准的安全措施保护您的信息，未经您授权不会向第三方共享。</p>`
    };
    openModal(type, content[type] || '<p>内容暂未提供</p>');
}

// 全局点击：关闭遮罩、通知、搜索结果
document.addEventListener('click', function(e) {
    // 点击遮罩关闭弹窗
    if (e.target.id === 'modal-overlay') closeModal();

    // 点击通知区域外关闭通知
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown && !e.target.closest('.notification')) {
        dropdown.classList.remove('show');
    }

    // 点击搜索框外关闭搜索结果
    const searchResults = document.getElementById('search-results');
    if (searchResults && !e.target.closest('.search-box')) {
        searchResults.classList.remove('show');
    }
});

// ========== 通知下拉 ==========
function toggleNotifications(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('notification-dropdown');
    const isShowing = dropdown.classList.contains('show');
    // 先关闭搜索结果
    document.getElementById('search-results')?.classList.remove('show');
    if (isShowing) {
        dropdown.classList.remove('show');
    } else {
        dropdown.classList.add('show');
    }
}

// 通知项点击：标记已读 + 显示Toast + 关闭下拉
function handleNotifClick(el, message, type) {
    el.classList.remove('unread');
    updateNotifBadge();
    showToast(message, type);
    document.getElementById('notification-dropdown').classList.remove('show');
}

// ========== 搜索功能 ==========
const searchData = [
    { type: '知识点', tag: '数学', tagColor: '#3B82F6', name: '圆锥曲线综合' },
    { type: '知识点', tag: '数学', tagColor: '#3B82F6', name: '导数应用专题' },
    { type: '知识点', tag: '数学', tagColor: '#3B82F6', name: '立体几何证明' },
    { type: '知识点', tag: '数学', tagColor: '#3B82F6', name: '概率统计' },
    { type: '知识点', tag: '英语', tagColor: '#8B5CF6', name: '完形填空技巧' },
    { type: '知识点', tag: '英语', tagColor: '#8B5CF6', name: '阅读理解策略' },
    { type: '知识点', tag: '物理', tagColor: '#F59E0B', name: '电磁感应综合题' },
    { type: '知识点', tag: '化学', tagColor: '#10B981', name: '有机推断题型' },
    { type: '题目', tag: '数学', tagColor: '#3B82F6', name: '2024年高考数学导数大题' },
    { type: '题目', tag: '物理', tagColor: '#F59E0B', name: '电磁感应能量守恒问题' },
    { type: '试卷', tag: '综合', tagColor: '#6B7280', name: '2024年全国卷理综模拟' },
    { type: '试卷', tag: '数学', tagColor: '#3B82F6', name: '圆锥曲线专项测试卷' }
];

function handleSearch(query) {
    const results = document.getElementById('search-results');
    if (!query || query.trim() === '') {
        results.classList.remove('show');
        return;
    }

    const filtered = searchData.filter(item =>
        item.name.includes(query) || item.tag.includes(query) || item.type.includes(query)
    );

    if (filtered.length === 0) {
        results.innerHTML = '<div class="search-result-item" style="color:#9CA3AF;text-align:center;">未找到相关结果</div>';
    } else {
        results.innerHTML = filtered.map(item =>
            `<div class="search-result-item" onclick="showToast('已跳转到：${item.name}','success');document.getElementById('search-results').classList.remove('show');document.getElementById('search-input').value='';">
                <span class="sr-tag" style="background:${item.tagColor}">${item.tag}</span>
                <span style="color:#9CA3AF;font-size:11px;">[${item.type}]</span>
                ${item.name}
            </div>`
        ).join('');
    }
    results.classList.add('show');
}

// ========== AI教练聊天 ==========
function toggleAIChat() {
    const widget = document.getElementById('ai-chat-widget');
    if (!widget) {
        showToast('AI 教练窗口未加载，请刷新页面重试', 'warning');
        return;
    }
    widget.classList.toggle('show');
    if (widget.classList.contains('show')) {
        setTimeout(() => {
            const input = document.getElementById('chat-input');
            if (input) input.focus();
            const messages = document.getElementById('chat-messages');
            if (messages) messages.scrollTop = messages.scrollHeight;
        }, 260);
    }
}

// ========== AI学习教练：模型路由 + 知识库 + 算术求解 ==========
// 模型路由规则（对齐 AI 模型中心 ai-model-center.json + 原型 AI_ROUTER）：
//   理科推理（数学/物理/化学/生物）→ DeepSeek-R1（思维链 CoT 推理）
//   文科通用（语文/英语/政治/历史/地理）→ DeepSeek-V3（中文通用对话）
//   生成任务（组卷/计划/错题分析）→ Qwen3-72B（通用大模型生成）
// 所有模型均走 BGE-M3 向量编码 → Milvus 相似度检索 → bge-reranker 重排序 → 模型生成 的 RAG 链路
const AI_ROUTER = (function () {
    var MODELS = {
        'deepseek-r1': {
            name: 'DeepSeek-R1', badge: '推理王', color: '#3B82F6', icon: 'fa-brain',
            license: 'MIT', role: '理科链式推理 (CoT)',
            strengths: ['数学', '物理', '化学', '生物'],
            ragSteps: ['BGE-M3 向量编码', 'Milvus 相似度检索', 'bge-reranker 重排', 'DeepSeek-R1 CoT 推理中']
        },
        'deepseek-v3': {
            name: 'DeepSeek-V3', badge: '通用王', color: '#10B981', icon: 'fa-comment-dots',
            license: 'MIT', role: '中文通用对话',
            strengths: ['语文', '英语', '政治', '历史', '地理'],
            ragSteps: ['BGE-M3 向量编码', 'Milvus 相似度检索', 'bge-reranker 重排', 'DeepSeek-V3 生成中']
        },
        'qwen3-72b': {
            name: 'Qwen3-72B', badge: '中文王', color: '#8B5CF6', icon: 'fa-book',
            license: 'Apache-2.0', role: '组卷/计划/解析生成',
            strengths: ['组卷', '学习计划', '错题分析', '个性化解析'],
            ragSteps: ['BGE-M3 向量编码', 'Milvus 相似度检索', 'bge-reranker 重排', 'Qwen3-72B 生成中']
        }
    };
    var ROUTING_RULES = [
        { pattern: /(组卷|生成|出题|练习题|模拟卷|刷题|题目|试卷|题库)/, model: 'qwen3-72b', subject: '组卷' },
        { pattern: /(学习计划|规划|复习|安排|时间表|冲刺|提分|进度)/, model: 'qwen3-72b', subject: '学习规划' },
        { pattern: /(错题|薄弱|总结|复盘|查漏|错题本)/, model: 'qwen3-72b', subject: '错题分析' },
        { pattern: /(数学|导数|函数|数列|三角|椭圆|概率|几何|方程|向量|微积分|极限|不等式|复数|排列组合|二项式)/, model: 'deepseek-r1', subject: '数学' },
        { pattern: /(物理|力学|电磁|光学|动量|能量|运动|相对论|量子|牛顿|功|热|波)/, model: 'deepseek-r1', subject: '物理' },
        { pattern: /(化学|反应|有机|无机|平衡|实验|元素|原子|分子|氧化|还原|电离|水解|化学键|物质的量)/, model: 'deepseek-r1', subject: '化学' },
        { pattern: /(生物|基因|细胞|遗传|dna|蛋白|生态|光合|呼吸|进化|免疫|神经|激素|酶)/, model: 'deepseek-r1', subject: '生物' },
        { pattern: /(语文|古诗|诗词|诗句|名句|文言文|阅读理解|作文|现代文|修辞|标点|成语|病句|默写|文学常识|赏析)/, model: 'deepseek-v3', subject: '语文' },
        { pattern: /(英语|grammar|tense|vocab|语法|词汇|作文|阅读|完形|七选五|短文改错|书面表达)/, model: 'deepseek-v3', subject: '英语' },
        { pattern: /(政治|经济|哲学|文化|党|政府|国家|公民|法治|宏观|市场|消费|财政|税收)/, model: 'deepseek-v3', subject: '政治' },
        { pattern: /(历史|朝代|战争|革命|改革|条约|帝王|事件|年代|中国近代|世界史|古代史|现代史)/, model: 'deepseek-v3', subject: '历史' },
        { pattern: /(地理|气候|地形|河流|人口|城市|农业|工业|交通|旅游|区位|经纬|时区|洋流|自然地理|人文地理)/, model: 'deepseek-v3', subject: '地理' }
    ];
    function selectAIModel(question) {
        var q = (question || '').toLowerCase();
        for (var i = 0; i < ROUTING_RULES.length; i++) {
            if (ROUTING_RULES[i].pattern.test(q)) {
                var r = ROUTING_RULES[i];
                return { modelKey: r.model, model: MODELS[r.model], subject: r.subject };
            }
        }
        return { modelKey: 'deepseek-r1', model: MODELS['deepseek-r1'], subject: '综合' };
    }
    return { selectAIModel: selectAIModel, MODELS: MODELS };
})();
// 兼容旧代码：AI_MODEL_ROUTER[subject] → 返回 {name, desc, color}
const AI_MODEL_ROUTER = new Proxy({}, {
    get: function (_, subject) {
        var route = AI_ROUTER.selectAIModel(subject || '');
        var m = route.model;
        return { name: m.name, desc: m.role, color: m.color };
    }
});

// 知识库（覆盖高考核心知识点，与原型 AI_KNOWLEDGE_BASE 对齐）
const AI_KB = [
    { keywords:['导数','求导','微分'], subject:'数学',
      analysis:'导数问题从定义出发：f\'(x₀)=lim(Δx→0)[f(x₀+Δx)-f(x₀)]/Δx。解题思路：①识别函数类型选求导公式；②应用四则运算法则逐步求导；③结合几何意义（切线斜率）或极值判断方向；④验算结果。',
      answer:'<b>常用求导公式</b>：(xⁿ)\'=nxⁿ⁻¹、(sinx)\'=cosx、(eˣ)\'=eˣ、(lnx)\'=1/x<br><b>四则运算法则</b>：(u±v)\'=u\'±v\'、(uv)\'=u\'v+uv\'、(u/v)\'=(u\'v-uv\')/v²<br><b>几何意义</b>：f\'(x₀) 是曲线在该点的切线斜率。' },
    { keywords:['椭圆','双曲线','抛物线','圆锥曲线'], subject:'数学',
      analysis:'圆锥曲线先看定义：椭圆距离和=2a、双曲线距离差=2a、抛物线到焦点=到准线。思路：①由定义判断类型；②写标准方程；③用a、b、c关系求未知量；④离心率e=c/a区分类型。',
      answer:'<b>椭圆</b>：x²/a²+y²/b²=1，a²=b²+c²，e<1<br><b>双曲线</b>：x²/a²-y²/b²=1，c²=a²+b²，e>1<br><b>抛物线</b>：y²=2px，e=1<br>直线与圆锥曲线联立，用韦达定理处理焦点弦、中点弦问题。' },
    { keywords:['极值','最值','单调性','驻点'], subject:'数学',
      analysis:'极值/单调性用导数工具。思路：①求导f\'(x)；②令f\'(x)=0解驻点；③判断驻点两侧导数符号变化（正变负→极大值，负变正→极小值）；④闭区间最值比较端点值和不可导点值。',
      answer:'<b>单调性</b>：f\'(x)>0→递增，f\'(x)<0→递减<br><b>求极值步骤</b>：求导→令f\'(x)=0解驻点→判断两侧符号变化<br><b>极值vs最值</b>：极值是局部概念，最值是全局概念。' },
    { keywords:['三角','sin','cos','诱导公式'], subject:'数学',
      analysis:'三角函数核心是诱导公式与恒等变换。口诀：奇变偶不变，符号看象限。',
      answer:'<b>口诀</b>：奇变偶不变，符号看象限<br><b>同角关系</b>：sin²x+cos²x=1，tanx=sinx/cosx<br><b>和差角</b>：sin(A±B)=sinAcosB±cosAsinB，cos(A±B)=cosAcosB∓sinAsinB' },
    { keywords:['数列','等差','等比'], subject:'数学',
      analysis:'数列先判断等差/等比，再用对应通项与求和公式。',
      answer:'<b>等差</b>：aₙ=a₁+(n-1)d，Sₙ=n(a₁+aₙ)/2<br><b>等比</b>：aₙ=a₁·qⁿ⁻¹，Sₙ=a₁(1-qⁿ)/(1-q) (q≠1)<br><b>技巧</b>：裂项相消、错位相减、分组求和。' },
    { keywords:['概率','统计','分布','期望','方差'], subject:'数学',
      analysis:'概率统计区分古典概型与几何概型，掌握常见分布的期望方差。',
      answer:'<b>古典概型</b>：P(A)=事件A基本事件数/总基本事件数<br><b>二项分布B(n,p)</b>：E(X)=np，D(X)=np(1-p)<br><b>正态分布N(μ,σ²)</b>：3σ原则覆盖99.7%数据。' },
    { keywords:['牛顿','运动','加速度','力学','受力'], subject:'物理',
      analysis:'牛顿运动定律用F合=ma求解。思路：①选研究对象；②画受力分析图；③沿加速度方向建坐标系；④分解力列方程；⑤解方程。',
      answer:'<b>第二定律</b>：F合=ma<br><b>解题步骤</b>：选对象→画受力图→建坐标系→分解力列方程→解方程<br><b>易错</b>：超重是支持力N>mg（加速度向上），不是重力变大。' },
    { keywords:['电磁','安培','洛伦兹','电场','磁场','感应'], subject:'物理',
      analysis:'电磁问题分电场、磁场、电磁感应三大块。力用左手定则，电用右手定则。',
      answer:'<b>电场</b>：F=kQq/r²，E=F/q<br><b>安培力</b>：F=BIL，左手定则<br><b>洛伦兹力</b>：F=qvB，左手定则（正负电荷方向相反）<br><b>电磁感应</b>：ε=nΔΦ/Δt，楞次定律/右手定则。' },
    { keywords:['能量','动能','动量','守恒','功'], subject:'物理',
      analysis:'能量/动量问题优先考虑守恒定律，比牛顿定律更简洁。',
      answer:'<b>动能定理</b>：W合=ΔEk<br><b>动量守恒</b>：系统不受外力或合外力为零时，总动量守恒<br><b>机械能守恒</b>：只有重力/弹力做功时，E₁=E₂。' },
    { keywords:['有机','化学','反应','平衡','实验'], subject:'化学',
      analysis:'有机推断抓特征反应和官能团转化，常用逆向推导。',
      answer:'<b>有机转化链</b>：醇→醛→酸→酯<br><b>反应类型</b>：取代、加成、消去、酯化、氧化<br><b>化学平衡</b>：勒夏特列原理——改变条件，平衡向减弱改变的方向移动。' },
    { keywords:['基因','细胞','遗传','dna','蛋白','生态'], subject:'生物',
      analysis:'遗传题用孟德尔定律，分子题抓中心法则。',
      answer:'<b>孟德尔定律</b>：分离定律（3:1）、自由组合定律（9:3:3:1）<br><b>中心法则</b>：DNA→RNA→蛋白质<br><b>减数分裂</b>：染色体减半，产生配子。' },
    { keywords:['英语','完形','阅读','作文','语法','词汇'], subject:'英语',
      analysis:'英语提分靠语感+技巧。完形先通读，阅读先读题，作文背模板。',
      answer:'<b>完形填空</b>：先通读全文理解大意，再根据上下文逻辑选择，注意固定搭配<br><b>阅读理解</b>：先读题目再回文定位关键词<br><b>作文</b>：背诵高级句式模板，注意三段式结构。' },
    { keywords:['文言','诗歌','作文','成语','古诗词'], subject:'语文',
      analysis:'语文重积累与方法。文言文抓实词虚词，作文重立意与结构。',
      answer:'<b>文言文</b>：积累120个常见实词，翻译注意逐字对应、特殊句式<br><b>古诗词</b>：掌握常见意象与情感，注意表现手法<br><b>作文</b>：立意深刻、结构清晰、素材新颖。' }
];

// 学科猜测兜底
function guessSubject(q) {
    if (/(数学|导数|函数|数列|三角|椭圆|概率|几何|方程|向量)/.test(q)) return '数学';
    if (/(物理|力|电|磁|能量|运动|光|热|波)/.test(q)) return '物理';
    if (/(化学|反应|有机|无机|平衡|实验|元素)/.test(q)) return '化学';
    if (/(生物|基因|细胞|遗传|dna|蛋白|生态)/.test(q)) return '生物';
    if (/(英语|grammar|tense|vocab|语法|词汇|作文|阅读)/.test(q)) return '英语';
    if (/(语文|文言|诗歌|作文|阅读|成语|古诗词)/.test(q)) return '语文';
    if (/(政治|哲学|矛盾|经济|文化)/.test(q)) return '政治';
    if (/(历史|朝代|战争|事件)/.test(q)) return '历史';
    if (/(地理|气候|地形|河流)/.test(q)) return '地理';
    return '通用';
}

// 基础算术求解器（对齐原型 solveArithmetic，扩展支持中文运算符）
function solveArithmetic(question) {
    if (!question) return null;
    let q = question.replace(/\s/g, '').replace(/？/g, '?').replace(/\?/g, '');
    // 中文运算符 → 符号（在正则匹配前转换）
    q = q.replace(/除以/g, '÷').replace(/乘以/g, '×').replace(/乘/g, '×')
         .replace(/加上/g, '+').replace(/减去/g, '-').replace(/加/g, '+').replace(/减/g, '-')
         .replace(/等于多少/g, '').replace(/等于/g, '').replace(/是多少/g, '').replace(/多少/g, '');
    const exprMatch = q.match(/(-?\d+(?:\.\d+)?(?:[+\-*/×÷^-]\d+(?:\.\d+)?)+)/);
    if (!exprMatch) return null;
    const expr = exprMatch[1].replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**');
    if (!/^[\d+\-*/.\s()^]+$/.test(expr.replace(/\*\*/g, '^'))) return null;
    let result;
    try { result = Function('"use strict";return (' + expr + ')')(); }
    catch (e) { return null; }
    if (result === undefined || result === null || isNaN(result)) return null;
    const resultStr = (result % 1 === 0) ? String(result) : result.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
    return resultStr;
}

// 生成AI回复（模型路由 + 知识库 + 算术求解 + 三段式输出）
function generateAIReply(question) {
    const q = (question || '').toLowerCase();

    // 1. 算术求解器拦截
    const arithResult = solveArithmetic(question);
    if (arithResult) {
        const steps = question.replace(/×/g, '×').replace(/÷/g, '÷');
        return wrapAIChatReply({
            subject: '数学',
            model: AI_MODEL_ROUTER['数学'],
            question: question,
            analysis: `直接计算算式：<code style="background:#FEF3C7;padding:2px 6px;border-radius:4px;">${escapeHtml(steps)}</code>，按四则运算优先级逐步求解。`,
            answer: `${escapeHtml(steps)} = <b style="font-size:16px;">${escapeHtml(arithResult)}</b>`
        });
    }

    // 2. 知识库匹配
    let matchedKb = null;
    for (const kb of AI_KB) {
        for (const kw of kb.keywords) {
            if (q.indexOf(kw.toLowerCase()) >= 0) { matchedKb = kb; break; }
        }
        if (matchedKb) break;
    }

    // 3. 学科猜测兜底
    const subject = matchedKb ? matchedKb.subject : guessSubject(question);

    if (!matchedKb) {
        matchedKb = {
            subject,
            analysis: `该问题涉及${subject}学科。核心思路：①识别对应的知识模块；②回忆相关基本概念、公式、定理；③按解题步骤逐步推导；④得出结论并检验。`,
            answer: `建议把问题描述得更具体一些，比如包含具体题目或知识点名称。你也可以试试这些关键词：导数、椭圆、牛顿运动、化学平衡、遗传基因、英语时态、文言文…我都有详细答案！`
        };
    }

    return wrapAIChatReply({
        subject,
        model: AI_MODEL_ROUTER[subject] || AI_MODEL_ROUTER['通用'],
        question,
        analysis: matchedKb.analysis,
        answer: matchedKb.answer
    });
}

// 包装为三段式（问题→分析→答案）+ 模型标识
function wrapAIChatReply({ subject, model, question, analysis, answer }) {
    const subjectTag = subject ? `<div style="display:inline-block;background:#EFF6FF;color:#2563EB;padding:2px 8px;border-radius:10px;font-size:11px;margin-bottom:10px;"><i class="fas fa-tag"></i> ${subject}</div>` : '';
    const modelTag = model ? `<div style="display:inline-flex;align-items:center;gap:4px;background:${model.color}15;color:${model.color};padding:2px 8px;border-radius:10px;font-size:11px;margin-bottom:10px;margin-left:6px;border:1px solid ${model.color}40;"><i class="fas fa-microchip"></i> ${model.name} · ${model.desc}</div>` : '';
    const questionBlock = `<div style="background:#F9FAFB;border-left:3px solid #9CA3AF;padding:8px 12px;border-radius:0 6px 6px 0;margin-bottom:12px;font-size:12px;color:#4B5563;"><span style="color:#6B7280;font-weight:600;">📝 问题：</span><span style="color:#111827;">${escapeHtml(question)}</span></div>`;
    const analysisBlock = `<div style="background:#FFFBEB;border-left:3px solid #F59E0B;padding:10px 12px;border-radius:0 6px 6px 0;margin-bottom:12px;"><div style="font-size:12px;font-weight:700;color:#92400E;margin-bottom:6px;"><i class="fas fa-brain"></i> 分析</div><div style="font-size:13px;color:#78350F;line-height:1.7;">${analysis}</div></div>`;
    const answerBlock = `<div style="background:#ECFDF5;border-left:3px solid #10B981;padding:10px 12px;border-radius:0 6px 6px 0;"><div style="font-size:12px;font-weight:700;color:#065F46;margin-bottom:6px;"><i class="fas fa-check-circle"></i> 答案</div><div style="font-size:13px;color:#064E3B;line-height:1.7;">${answer}</div></div>`;
    return `<div style="line-height:1.6;">${subjectTag}${modelTag}${questionBlock}${analysisBlock}${answerBlock}</div>`;
}

// AI对话通用流程：后端模型路由 → RAG检索动画 → 流式输出 → 模型归因
// 调用后端 /api/ai/chat SSE 接口，实现真实的模型推理链路
// bubbleEl: 已创建的气泡 DOM 元素（内容容器），messagesEl: 滚动容器
function streamAIReplyInto(bubbleEl, messagesEl, question) {
    // 初始 loading 状态
    bubbleEl.innerHTML = '<div style="color:#6B7280;font-size:12px;">' +
        '<i class="fas fa-spinner fa-spin" style="color:#10B981;"></i> 正在连接 AI 推理服务…</div>' +
        '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;"></div>';

    var ragBox = null;
    var modelInfo = null;

    fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question, user_id: (window.currentUserId || 'u_001') })
    }).then(function (response) {
        if (!response.ok) throw new Error('AI 服务返回 ' + response.status);
        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var buffer = '';

        function readChunk() {
            reader.read().then(function (chunk) {
                if (chunk.done) return;
                buffer += decoder.decode(chunk.value, { stream: true });
                var lines = buffer.split('\n');
                buffer = lines.pop();

                var eventType = '';
                var eventData = '';
                for (var i = 0; i < lines.length; i++) {
                    if (lines[i].indexOf('event: ') === 0) {
                        eventType = lines[i].slice(7);
                    } else if (lines[i].indexOf('data: ') === 0) {
                        eventData = lines[i].slice(6);
                    } else if (lines[i] === '' && eventType && eventData) {
                        handleSSEEvent(eventType, eventData);
                        eventType = '';
                        eventData = '';
                    }
                }
                readChunk();
            }).catch(function (err) {
                showAIError(bubbleEl, '流式读取失败: ' + err.message);
            });
        }
        readChunk();
    }).catch(function (err) {
        // 后端不可用时回退到前端本地推理
        fallbackLocalAI(bubbleEl, messagesEl, question, err.message);
    });

    function handleSSEEvent(type, dataStr) {
        var data;
        try { data = JSON.parse(dataStr); } catch (e) { return; }

        if (type === 'route') {
            modelInfo = data;
            // 渲染模型路由信息
            bubbleEl.innerHTML = '<div style="color:#6B7280;font-size:12px;">' +
                '<i class="fas fa-route" style="color:' + data.color + ';"></i> ' +
                '智能路由 → <b style="color:' + data.color + ';">' + data.modelName + '</b> ' +
                '<span style="background:' + data.color + ';color:white;padding:1px 6px;border-radius:6px;font-size:9px;">' + data.badge + '</span> ' +
                '<span style="color:#9CA3AF;">(' + data.subject + ' · ' + data.role + ')</span></div>' +
                '<div style="margin-top:6px;color:#6B7280;font-size:12px;"><i class="fas fa-search" style="color:#10B981;"></i> 正在RAG检索相关知识…</div>' +
                '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;"></div>';
            ragBox = bubbleEl.querySelector('div:nth-child(3)');
            if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
        }
        else if (type === 'rag') {
            if (ragBox) {
                var chip = document.createElement('span');
                var c = modelInfo ? modelInfo.color : '#10B981';
                chip.style.cssText = 'background:white;border:1px solid ' + c + ';color:' + c + ';padding:2px 8px;border-radius:10px;font-size:10px;';
                chip.innerHTML = '<i class="fas fa-check"></i> ' + data.label;
                ragBox.appendChild(chip);
                if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
            }
        }
        else if (type === 'reply') {
            // 构建三段式回复 HTML
            var replyHTML = wrapAIChatReply({
                subject: data.subject,
                model: modelInfo ? { name: modelInfo.modelName, desc: modelInfo.role, color: modelInfo.color } : null,
                question: data.question,
                analysis: data.analysis,
                answer: data.answer
            });
            // 流式逐字输出
            streamText(bubbleEl, replyHTML, function () {
                if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
            });
        }
        else if (type === 'attribution') {
            // 等流式输出完成后追加归因（用定时器检测）
            var checkComplete = setInterval(function () {
                if (bubbleEl.getAttribute('data-stream-done') === '1') {
                    clearInterval(checkComplete);
                    var attr = document.createElement('div');
                    attr.style.cssText = 'margin-top:8px;padding-top:8px;border-top:1px solid #E5E7EB;font-size:10px;color:#9CA3AF;display:flex;gap:8px;align-items:center;flex-wrap:wrap;';
                    attr.innerHTML = '<i class="fas ' + data.icon + '" style="color:' + data.color + ';"></i> ' +
                        '<b style="color:' + data.color + ';">' + data.modelName + '</b> ' +
                        '<span style="background:' + data.color + ';color:white;padding:1px 5px;border-radius:4px;font-size:9px;">' + data.badge + '</span> ' +
                        '· ' + data.license + ' · ' + data.role + ' · ' + data.engine + ' 推理 · ' +
                        '<span style="color:#10B981;">' + data.tokens + ' tokens</span> · ' +
                        '<span style="color:#9CA3AF;">RAG 检索 ' + data.retrievalCount + ' 条</span>';
                    bubbleEl.appendChild(attr);
                    if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
                }
            }, 100);
        }
        else if (type === 'done') {
            // 推理完成
            console.log('[AI] 推理完成');
        }
    }
}

// AI 服务错误提示
function showAIError(bubbleEl, msg) {
    bubbleEl.innerHTML = '<div style="color:#EF4444;font-size:12px;"><i class="fas fa-exclamation-circle"></i> ' + msg + '</div>';
}

// 后端不可用时回退到前端本地推理
function fallbackLocalAI(bubbleEl, messagesEl, question, errMsg) {
    console.warn('[AI] 后端不可用，回退本地推理:', errMsg);
    var route = AI_ROUTER.selectAIModel(question);
    var model = route.model;
    var subjectTag = route.subject;

    bubbleEl.innerHTML = '<div style="color:#6B7280;font-size:12px;">' +
        '<i class="fas fa-route" style="color:' + model.color + ';"></i> ' +
        '本地路由 → <b style="color:' + model.color + ';">' + model.name + '</b> ' +
        '<span style="background:' + model.color + ';color:white;padding:1px 6px;border-radius:6px;font-size:9px;">' + model.badge + '</span> ' +
        '<span style="color:#9CA3AF;">(' + subjectTag + ' · ' + model.role + ')</span> ' +
        '<span style="color:#F59E0B;font-size:10px;">[离线模式]</span></div>' +
        '<div style="margin-top:6px;color:#6B7280;font-size:12px;"><i class="fas fa-search" style="color:#10B981;"></i> 正在RAG检索相关知识…</div>' +
        '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;"></div>';
    var ragBox = bubbleEl.querySelector('div:nth-child(3)');
    var ragSteps = model.ragSteps;
    var stepIdx = 0;
    var ragTimer = setInterval(function () {
        if (stepIdx < ragSteps.length) {
            var chip = document.createElement('span');
            chip.style.cssText = 'background:white;border:1px solid ' + model.color + ';color:' + model.color + ';padding:2px 8px;border-radius:10px;font-size:10px;';
            chip.innerHTML = '<i class="fas fa-check"></i> ' + ragSteps[stepIdx];
            ragBox.appendChild(chip);
            stepIdx++;
            if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
        } else {
            clearInterval(ragTimer);
            var aiReplyHTML = generateAIReply(question);
            streamText(bubbleEl, aiReplyHTML, function () {
                var attr = document.createElement('div');
                attr.style.cssText = 'margin-top:8px;padding-top:8px;border-top:1px solid #E5E7EB;font-size:10px;color:#9CA3AF;display:flex;gap:8px;align-items:center;flex-wrap:wrap;';
                attr.innerHTML = '<i class="fas ' + model.icon + '" style="color:' + model.color + ';"></i> ' +
                    '<b style="color:' + model.color + ';">' + model.name + '</b> ' +
                    '<span style="background:' + model.color + ';color:white;padding:1px 5px;border-radius:4px;font-size:9px;">' + model.badge + '</span> ' +
                    '· ' + model.license + ' · ' + model.role + ' · 本地推理 · ' +
                    '<span style="color:#10B981;">' + Math.floor(Math.random() * 300 + 200) + ' tokens</span> · ' +
                    '<span style="color:#F59E0B;">[离线模式]</span>';
                bubbleEl.appendChild(attr);
                if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
            });
        }
    }, 200);
}

// 流式逐字输出 HTML 内容（模拟 LLM token 流式输出）
function streamText(element, html, onComplete) {
    element.innerHTML = '';
    element.removeAttribute('data-stream-done');
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    const text = tempDiv.textContent || '';
    const len = text.length;
    let idx = 0;
    const charSpeed = Math.max(2, Math.floor(1500 / Math.max(len, 1)));
    const timer = setInterval(function () {
        if (idx < len) {
            idx += Math.max(1, Math.floor(len / 40));
            if (idx > len) idx = len;
            element.innerHTML = html.substring(0, Math.floor(html.length * idx / len));
        } else {
            clearInterval(timer);
            element.innerHTML = html;
            element.setAttribute('data-stream-done', '1');
            if (onComplete) onComplete();
        }
    }, charSpeed);
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    const messages = document.getElementById('chat-messages');

    // 添加用户消息
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user';
    userMsg.innerHTML = `<div class="chat-avatar"><i class="fas fa-user"></i></div><div class="chat-bubble">${escapeHtml(msg)}</div>`;
    messages.appendChild(userMsg);

    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    // 创建 AI 气泡容器
    const botMsg = document.createElement('div');
    botMsg.className = 'chat-msg bot';
    botMsg.innerHTML = '<div class="chat-avatar"><i class="fas fa-robot"></i></div><div class="chat-bubble"></div>';
    messages.appendChild(botMsg);
    const bubbleEl = botMsg.querySelector('.chat-bubble');
    messages.scrollTop = messages.scrollHeight;

    // 模型路由 → RAG → 流式输出 → 模型归因
    streamAIReplyInto(bubbleEl, messages, msg);
}

// 转义 HTML 防注入
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ========== 学习计时器 ==========
let studyTimerInterval = null;
let studyTimerSeconds = 0;

function startStudy() {
    const timer = document.getElementById('study-timer');
    const firstPlan = document.querySelector('.plan-item .plan-name');
    const subjectName = firstPlan ? firstPlan.textContent : '导数应用专题';

    document.getElementById('timer-subject').textContent = subjectName;
    timer.classList.remove('hidden');
    studyTimerSeconds = 0;

    if (studyTimerInterval) clearInterval(studyTimerInterval);
    studyTimerInterval = setInterval(() => {
        studyTimerSeconds++;
        const m = Math.floor(studyTimerSeconds / 60);
        const s = studyTimerSeconds % 60;
        const disp = document.getElementById('timer-display');
        if (disp) disp.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }, 1000);

    showToast('开始学习！计时已启动，正在加载题目...', 'success');
    // 跳转到学习会话页，展示实际学习内容（题目+选项+解析）
    if (typeof switchPage === 'function') {
        setTimeout(() => switchPage('home-task-learn'), 400);
    }
}

function stopStudy() {
    const timer = document.getElementById('study-timer');
    timer.classList.add('hidden');
    if (studyTimerInterval) {
        clearInterval(studyTimerInterval);
        studyTimerInterval = null;
    }
    const m = Math.floor(studyTimerSeconds / 60);
    showToast(`本次学习结束，时长 ${m} 分钟，继续加油！`, 'success');
    studyTimerSeconds = 0;
}

// ========== 编辑高考目标分 ==========
let scoreChartInstance = null;

function editGoalScore() {
    const currentScore = document.getElementById('current-score-num')?.textContent || '615';
    const targetScore = document.getElementById('target-score-num')?.textContent || '633';

    const bodyHTML = `
        <div class="score-input-group">
            <div class="score-input-row">
                <label>当前估分</label>
                <input type="number" id="input-current-score" value="${currentScore}" min="0" max="750" oninput="updateScorePreview()">
                <span style="color:#9CA3AF;font-size:13px;">/ 750</span>
            </div>
            <div class="score-input-hint">输入你最近的模考或统考总分</div>
            <div class="score-input-row">
                <label>目标分数</label>
                <input type="number" id="input-target-score" value="${targetScore}" min="0" max="750" oninput="updateScorePreview()">
                <span style="color:#9CA3AF;font-size:13px;">/ 750</span>
            </div>
            <div class="score-input-hint">输入你期望达到的高考目标分数</div>
            <div class="score-preview">
                <div class="sp-item">
                    <div class="sp-label">当前估分</div>
                    <div class="sp-value" id="preview-current">${currentScore}</div>
                </div>
                <div class="sp-item">
                    <div class="sp-label">预计提升</div>
                    <div class="sp-value" id="preview-improvement" style="color:#10B981;">+${parseInt(targetScore) - parseInt(currentScore)}</div>
                </div>
                <div class="sp-item">
                    <div class="sp-label">目标分数</div>
                    <div class="sp-value" id="preview-target">${targetScore}</div>
                </div>
            </div>
            <div class="modal-footer" style="border:none;padding:20px 0 0;">
                <button class="modal-btn secondary" onclick="closeModal()">取消</button>
                <button class="modal-btn primary" onclick="saveGoalScore()">保存</button>
            </div>
        </div>
    `;
    openModal('编辑高考目标分', bodyHTML);
}

function updateScorePreview() {
    const current = parseInt(document.getElementById('input-current-score').value) || 0;
    const target = parseInt(document.getElementById('input-target-score').value) || 0;
    const improvement = target - current;

    document.getElementById('preview-current').textContent = current;
    document.getElementById('preview-target').textContent = target;
    document.getElementById('preview-improvement').textContent = (improvement >= 0 ? '+' : '') + improvement;
    document.getElementById('preview-improvement').style.color = improvement >= 0 ? '#10B981' : '#EF4444';
}

function saveGoalScore() {
    const current = parseInt(document.getElementById('input-current-score').value) || 0;
    const target = parseInt(document.getElementById('input-target-score').value) || 0;

    if (current < 0 || current > 750) {
        showToast('当前估分应在 0-750 之间', 'error');
        return;
    }
    if (target < 0 || target > 750) {
        showToast('目标分数应在 0-750 之间', 'error');
        return;
    }
    if (target < current) {
        showToast('目标分数低于当前估分，请确认', 'warning');
    }

    const improvement = target - current;

    // 更新页面显示
    document.getElementById('current-score-num').textContent = current;
    document.getElementById('target-score-num').textContent = target;
    document.getElementById('improvement-num').textContent = improvement;

    // 更新达成率（简单公式：当前分/目标分 * 100，上限99%）
    const rate = Math.min(99, Math.round(current / target * 100));
    document.getElementById('goal-rate').textContent = rate + '%';
    document.getElementById('goal-progress-fill').style.width = rate + '%';

    // 更新折线图数据
    const chart = Chart.getChart('scoreChart');
    if (chart) {
        const mid1 = Math.round(current + improvement * 0.3);
        const mid2 = Math.round(current + improvement * 0.6);
        chart.data.datasets[0].data = [current, mid1, mid2, target];
        chart.update();
    }

    closeModal();
    showToast(`目标分已更新：${current} → ${target}，预计提升 ${improvement} 分`, 'success');

    // 同步到后端
    api.updateUser({ current_score: current, target_score: target }).then(() => {
        // 重新加载预测数据
        api.getPredictReport().then(report => {
            if (report) {
                renderExamPredict(report);
                renderSubjectScores(report.subject_scores);
                updateRadarChart(report.subject_scores);
            }
        });
    });
}

// ========== 调整计划（对接AI推荐计划API）==========
async function adjustPlan(e) {
    if (e) e.preventDefault();
    openModal('调整学习计划', '<div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:#3B82F6;"></i><p style="margin-top:12px;color:#6B7280;">AI正在为你生成个性化学习计划...</p></div>');

    const result = await api.getRecommendPlan(90);
    if (!result || result.plan.length === 0) {
        openModal('调整学习计划', '<p style="text-align:center;padding:20px;color:#6B7280;">暂无推荐计划</p>');
        return;
    }

    const subjectColor = { '数学': '#3B82F6', '英语': '#8B5CF6', '物理': '#F59E0B', '化学': '#10B981', '语文': '#EF4444' };
    const planHTML = result.plan.map(p => `
        <div class="info-row" style="align-items:center;">
            <span class="info-label">
                <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;border-radius:4px;background:${subjectColor[p.subject] || '#6B7280'};color:white;font-size:11px;margin-right:8px;">${p.subject[0]}</span>
                ${p.knowledge_point_name}
                <span style="font-size:11px;color:#9CA3AF;margin-left:6px;">[${p.strategy}]</span>
            </span>
            <span class="info-value">
                <span style="font-size:12px;color:#6B7280;margin-right:8px;">掌握${Math.round(p.mastery_rate * 100)}% | +${p.score_gain}分</span>
                <strong style="color:#3B82F6;">${p.allocated_minutes}分钟</strong>
            </span>
        </div>
    `).join('');

    openModal('调整学习计划', `
        <p style="margin-bottom:12px;color:#6B7280;">AI根据你的薄弱知识点生成以下计划，预计可提分 <strong style="color:#3B82F6;">${result.estimated_score_gain}分</strong>：</p>
        <div style="margin-bottom:12px;padding:10px;background:#F0F7FF;border-radius:8px;font-size:13px;color:#3B82F6;">
            <i class="fas fa-clock"></i> 总时长 ${result.total_minutes} 分钟 | ${result.task_count} 个任务
        </div>
        ${planHTML}
        <div class="modal-footer" style="border:none;padding:20px 0 0;">
            <button class="modal-btn secondary" onclick="closeModal()">取消</button>
            <button class="modal-btn primary" onclick="closeModal();startStudy();showToast('学习计划已应用！计时已启动','success');">开始学习</button>
        </div>
    `);
}

// ========== 薄弱知识点更多（对接考点库API）==========
async function showWeakDetails(e) {
    if (e) e.preventDefault();
    openModal('全部薄弱知识点', '<div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:#3B82F6;"></i></div>');
    const weakPoints = await api.getWeakPoints(0.75, 20);
    if (!weakPoints || weakPoints.length === 0) {
        openModal('全部薄弱知识点', '<p style="text-align:center;padding:20px;color:#6B7280;">暂无薄弱知识点数据</p>');
        return;
    }

    const colorByRate = (rate) => rate < 0.45 ? '#EF4444' : (rate < 0.55 ? '#F97316' : (rate < 0.65 ? '#3B82F6' : '#10B981'));
    const rowsHTML = weakPoints.map(kp => `
        <div class="info-row">
            <span class="info-label">
                <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;border-radius:4px;background:${colorByRate(kp.mastery_rate)};color:white;font-size:11px;margin-right:8px;">${kp.subject[0]}</span>
                ${kp.name}
            </span>
            <span class="info-value" style="color:${colorByRate(kp.mastery_rate)};">掌握率 ${Math.round(kp.mastery_rate * 100)}% | 预计+${kp.score_gain}分</span>
        </div>
    `).join('');

    const totalGain = weakPoints.reduce((s, k) => s + k.score_gain, 0);
    openModal('全部薄弱知识点', `
        <p style="margin-bottom:16px;color:#6B7280;">共 ${weakPoints.length} 个薄弱知识点，预计可提分 <strong style="color:#3B82F6;">${totalGain}分</strong></p>
        ${rowsHTML}
        <div class="modal-footer" style="border:none;padding:20px 0 0;">
            <button class="modal-btn primary" onclick="closeModal();handleRecommend('考点训练');">一键生成训练计划</button>
        </div>
    `);
}

// ========== AI推荐按钮（对接后端真实推荐）==========
async function handleRecommend(name) {
    if (name === '真题演练') {
        // 真题演练专用入口
        return handleRealExam();
    }
    showToast(`正在为你生成${name}方案，基于你的薄弱知识点...`, 'info');
    openModal(name, '<div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:#3B82F6;"></i><p style="margin-top:12px;color:#6B7280;">AI正在分析你的学情并推荐题目...</p></div>');

    // 根据类型调用不同API
    let questions = [];
    let meta = null;
    if (name === '智能组卷') {
        const result = await api.getRecommendPaper(10);
        if (result) { questions = result.paper || []; meta = result.meta; }
    } else {
        // api.request 已解包 data 字段，getRecommendQuestions 返回数组本身
        const result = await api.getRecommendQuestions(8);
        if (Array.isArray(result)) {
            questions = result;
        } else if (result) {
            questions = result.data || result.questions || [];
        }
    }

    if (questions.length === 0) {
        openModal(name, '<p style="text-align:center;padding:20px;color:#6B7280;">暂无推荐题目，请先完成更多练习以生成个性化推荐。</p>');
        return;
    }

    // 渲染题目列表
    const subjectColor = { '数学': '#3B82F6', '英语': '#8B5CF6', '物理': '#F59E0B', '化学': '#10B981', '语文': '#EF4444' };
    const diffStars = (d) => '★'.repeat(d) + '☆'.repeat(5 - d);

    let metaHTML = '';
    if (meta) {
        metaHTML = `
            <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
                <div style="background:#EFF6FF;padding:8px 14px;border-radius:8px;font-size:13px;">题目数：<strong>${meta.total_count || meta.question_count || questions.length}</strong></div>
                <div style="background:#EFF6FF;padding:8px 14px;border-radius:8px;font-size:13px;">总分：<strong>${meta.total_score || '-'}</strong></div>
                <div style="background:#EFF6FF;padding:8px 14px;border-radius:8px;font-size:13px;">覆盖科目：<strong>${(meta.subjects || []).join(' / ') || '-'}</strong></div>
                <div style="background:#EFF6FF;padding:8px 14px;border-radius:8px;font-size:13px;">预计用时：<strong>${meta.estimated_time || meta.estimated_time_min || '-'}分钟</strong></div>
                <div style="background:#EFF6FF;padding:8px 14px;border-radius:8px;font-size:13px;">难度：<strong>${meta.difficulty || '-'}</strong></div>
            </div>
        `;
    }

    const bodyHTML = `
        ${metaHTML}
        <div style="max-height:400px;overflow-y:auto;">
            ${questions.map((q, i) => `
                <div class="recommend-question-item" style="border:1px solid #E5E7EB;border-radius:10px;padding:14px;margin-bottom:10px;cursor:pointer;" onclick="showQuestionDetail('${q.id}')">
                    <div style="display:flex;justify-content:space-between;align-items:start;">
                        <div style="flex:1;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                                <span style="background:${subjectColor[q.subject] || '#6B7280'};color:white;font-size:11px;padding:2px 8px;border-radius:4px;">${q.subject}</span>
                                <span style="font-size:12px;color:#9CA3AF;">${q.type}</span>
                                <span style="font-size:12px;color:#F59E0B;">${diffStars(q.difficulty)}</span>
                                ${q.is_review ? '<span style="font-size:11px;color:#10B981;border:1px solid #10B981;padding:1px 6px;border-radius:4px;">复习</span>' : ''}
                            </div>
                            <div style="font-size:13px;line-height:1.5;color:#374151;">${i + 1}. ${(q.content || q.title || '').length > 60 ? (q.content || q.title).slice(0, 60) + '...' : (q.content || q.title)}</div>
                            ${q.recommend_reason ? `<div style="font-size:11px;color:#3B82F6;margin-top:6px;"><i class="fas fa-lightbulb"></i> ${q.recommend_reason}</div>` : ''}
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="modal-footer" style="border:none;padding:20px 0 0;">
            <button class="modal-btn secondary" onclick="closeModal()">稍后</button>
            <button class="modal-btn primary" onclick="closeModal();startStudy();showToast('训练已开始！计时已启动','success');">开始训练</button>
        </div>
    `;
    openModal(name, bodyHTML);
}

// ========== 真题演练专用逻辑（数据来源：D盘五层架构成果提取）==========
let currentSubjectFilter = '';
let currentYearFilter = '';

async function handleRealExam() {
    showToast('正在从五层架构题库加载真题...', 'info');
    openModal('真题演练', `<div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:#10B981;"></i><p style="margin-top:12px;color:#6B7280;">正在加载来自 D:\\新资料\\五层架构成果 的真题...</p></div>`);

    const result = await api.getRealExamQuestions();
    let questions = result ? (result.data || result) || [] : [];

    if (!Array.isArray(questions)) questions = [];

    // 从题库汇总可筛选的年份和科目
    const years = [...new Set(questions.map(q => q.year).filter(Boolean))].sort((a, b) => b - a);
    const subjects = [...new Set(questions.map(q => q.subject).filter(Boolean))];

    // 渲染筛选栏 + 导入按钮 + 题目列表
    renderRealExamModal(questions, years, subjects);
}

function renderRealExamModal(questions, years, subjects) {
    const subjectColor = { '数学': '#3B82F6', '英语': '#8B5CF6', '物理': '#F59E0B', '化学': '#10B981', '语文': '#EF4444' };
    const diffStars = (d) => '★'.repeat(d) + '☆'.repeat(5 - d);

    // 按当前筛选条件过滤
    let filtered = questions;
    if (currentSubjectFilter) filtered = filtered.filter(q => q.subject === currentSubjectFilter);
    if (currentYearFilter) filtered = filtered.filter(q => q.year === parseInt(currentYearFilter));

    const totalScore = filtered.reduce((s, q) => s + (q.score || 0), 0);
    const subjectCount = [...new Set(filtered.map(q => q.subject))].length;

    const bodyHTML = `
        <!-- 顶部说明 -->
        <div style="background:#ECFDF5;border:1px solid #6EE7B7;border-radius:10px;padding:12px 14px;margin-bottom:16px;">
            <div style="display:flex;align-items:start;gap:10px;">
                <i class="fas fa-database" style="color:#047857;margin-top:2px;"></i>
                <div style="font-size:13px;line-height:1.6;color:#065F46;">
                    <strong>真题来源：</strong>D:\\新资料\\五层架构成果 目录（已预置 2021-2025 年全国卷/新高考/北京/天津/浙江/山东/广东等省高考真题共 ${questions.length} 道）
                    <br><strong>五层架构解析：</strong>每道真题均配有 L1考点定位 → L2方法选择 → L3步骤规范 → L4检验校验 → L5反思归纳 的完整解题路径。
                </div>
            </div>
        </div>

        <!-- 筛选栏 -->
        <div style="display:flex;gap:10px;margin-bottom:12px;flex-wrap:wrap;align-items:center;">
            <span style="font-size:13px;color:#374151;font-weight:600;"><i class="fas fa-filter"></i> 筛选：</span>
            <select id="exam-year-filter" onchange="currentYearFilter=this.value;handleRealExamRefresh();" style="padding:6px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
                <option value="">全部年份</option>
                ${years.map(y => `<option value="${y}" ${currentYearFilter == y ? 'selected' : ''}>${y}年</option>`).join('')}
            </select>
            <select id="exam-subject-filter" onchange="currentSubjectFilter=this.value;handleRealExamRefresh();" style="padding:6px 10px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
                <option value="">全部科目</option>
                ${subjects.map(s => `<option value="${s}" ${currentSubjectFilter === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
            <div style="flex:1;"></div>
            <button class="modal-btn secondary" style="padding:6px 12px;font-size:12px;" onclick="showImportPanel()">
                <i class="fas fa-file-import"></i> 导入D盘真题
            </button>
        </div>

        <!-- 真题统计 -->
        <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
            <div style="background:#F0FDF4;padding:8px 12px;border-radius:8px;font-size:12px;"><i class="fas fa-list-check" style="color:#10B981;"></i> 真题数：<strong>${filtered.length}</strong> 道</div>
            <div style="background:#EFF6FF;padding:8px 12px;border-radius:8px;font-size:12px;"><i class="fas fa-percent" style="color:#3B82F6;"></i> 总分值：<strong>${totalScore}</strong> 分</div>
            <div style="background:#FEF3C7;padding:8px 12px;border-radius:8px;font-size:12px;"><i class="fas fa-book-open" style="color:#F59E0B;"></i> 覆盖科目：<strong>${subjectCount}</strong> 科</div>
            ${years.length ? `<div style="background:#FAF5FF;padding:8px 12px;border-radius:8px;font-size:12px;"><i class="fas fa-calendar" style="color:#8B5CF6;"></i> 年份跨度：<strong>${years[years.length-1]}-${years[0]}</strong></div>` : ''}
        </div>

        <!-- 题目列表 -->
        <div style="max-height:360px;overflow-y:auto;">
            ${filtered.length === 0 ? `
                <div style="text-align:center;padding:40px;color:#6B7280;">
                    <i class="fas fa-folder-open" style="font-size:32px;margin-bottom:12px;color:#D1D5DB;"></i>
                    <p>当前筛选条件下暂无真题，请调整筛选或点击"导入D盘真题"手动添加</p>
                </div>
            ` : filtered.map((q, i) => `
                <div class="recommend-question-item" style="border:1px solid #E5E7EB;border-radius:10px;padding:12px 14px;margin-bottom:10px;cursor:pointer;background:white;" onclick="showQuestionDetail('${q.id}')">
                    <div style="display:flex;justify-content:space-between;align-items:start;gap:10px;">
                        <div style="flex:1;">
                            <!-- 真题特有标签：年份+省份+试卷+题号 -->
                            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
                                <span style="background:${subjectColor[q.subject] || '#6B7280'};color:white;font-size:11px;padding:2px 8px;border-radius:4px;font-weight:600;">${q.subject}</span>
                                ${q.year ? `<span style="background:#10B981;color:white;font-size:11px;padding:2px 7px;border-radius:4px;"><i class="fas fa-calendar-day"></i> ${q.year}年</span>` : ''}
                                ${q.province ? `<span style="background:#F3F4F6;color:#111827;font-size:11px;padding:2px 7px;border-radius:4px;"><i class="fas fa-map-marker-alt"></i> ${q.province}</span>` : ''}
                                ${q.paper_name ? `<span style="background:#FEF3C7;color:#92400E;font-size:11px;padding:2px 7px;border-radius:4px;"><i class="fas fa-scroll"></i> ${q.paper_name}</span>` : ''}
                                ${q.question_number ? `<span style="background:#EEF2FF;color:#4338CA;font-size:11px;padding:2px 7px;border-radius:4px;">${q.question_number}</span>` : ''}
                                <span style="font-size:11px;color:#9CA3AF;">${q.type || '解答题'}</span>
                                <span style="font-size:11px;color:#F59E0B;">${diffStars(q.difficulty || 3)}</span>
                                ${q.score ? `<span style="font-size:11px;color:#374151;"><strong>${q.score}</strong>分</span>` : ''}
                            </div>
                            <div style="font-size:13px;line-height:1.55;color:#374151;">
                                <span style="color:#9CA3AF;font-weight:600;">${i + 1}.</span>
                                ${(q.content || q.title || '').length > 120 ? (q.content || q.title).slice(0, 120) + '...' : (q.content || q.title)}
                            </div>
                            <!-- 五层架构标签：显示在题目下方的提示 -->
                            ${q.analysis && q.analysis.includes('五层架构') ? `
                                <div style="font-size:11px;color:#10B981;margin-top:6px;background:#ECFDF5;padding:4px 8px;border-radius:4px;display:inline-block;">
                                    <i class="fas fa-layer-group"></i> 含五层架构完整解题路径（L1-L5）
                                </div>
                            ` : ''}
                        </div>
                        <div style="color:#D1D5DB;font-size:14px;align-self:center;"><i class="fas fa-chevron-right"></i></div>
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="modal-footer" style="border:none;padding:16px 0 0;">
            <button class="modal-btn secondary" onclick="closeModal()">关闭</button>
            <button class="modal-btn primary" onclick="startExamFromFiltered()">
                <i class="fas fa-play-circle"></i> 开始真题演练
            </button>
        </div>
    `;
    openModal('真题演练', bodyHTML);
}

// 刷新真题列表（在筛选条件变更时）
async function handleRealExamRefresh() {
    const result = await api.getRealExamQuestions();
    let questions = result ? (result.data || result) || [] : [];
    if (!Array.isArray(questions)) questions = [];
    const years = [...new Set(questions.map(q => q.year).filter(Boolean))].sort((a, b) => b - a);
    const subjects = [...new Set(questions.map(q => q.subject).filter(Boolean))];
    renderRealExamModal(questions, years, subjects);
}

// 开始演练：取当前筛选后的题目前N道（此处复用已加载数据，简化处理）
function startExamFromFiltered() {
    closeModal();
    startStudy();
    showToast('真题演练已开始！建议先做标记为"五层架构"的题目掌握解题方法', 'success');
}

// ========== 导入真题面板（从D盘复制文本粘贴导入）==========
function showImportPanel() {
    const templateText = `【年份】2025
【省份】全国甲卷
【试卷】理科数学
【题号】21题(12分)
【科目】数学
【题型】解答题
【难度】5
【分值】12
【题干】已知椭圆C: x²/4 + y² = 1，过右焦点F的直线l交椭圆于A、B两点...
【答案】(1)|AB|=16/5；(2)k_OM·k_l=-1/4
【解析】五层架构解题路径：L1定位→...；L2方法→...；L3步骤→...；L4检验→...；L5反思→...
---
【年份】2024
【省份】浙江卷
【试卷】英语
【科目】英语
【题型】语法填空
【题干】The Forbidden City, ____ (locate) in the heart of Beijing...
【答案】located
【解析】过去分词作定语...
`;

    const bodyHTML = `
        <div style="margin-bottom:12px;">
            <div style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:10px;padding:12px 14px;margin-bottom:14px;">
                <div style="font-size:13px;line-height:1.6;color:#92400E;">
                    <i class="fas fa-info-circle"></i>
                    <strong>使用说明：</strong>由于服务器环境无法直接访问本地 D:\\新资料\\五层架构成果 目录，请按以下格式将 D 盘中的真题文本复制粘贴到下方文本框中，点击导入即可加入题库。
                    <br>支持格式：【题干】【答案】【解析】【年份】【省份】【试卷】【科目】【题型】【难度】【分值】，多道题目之间用 <code style="background:#FEF9C3;padding:1px 4px;border-radius:3px;">---</code> 分隔。
                </div>
            </div>
            <label style="font-size:13px;color:#374151;font-weight:600;display:block;margin-bottom:6px;">
                粘贴真题文本（可一次导入多道）：
            </label>
            <textarea id="import-textarea" style="width:100%;min-height:260px;border:1px solid #D1D5DB;border-radius:8px;padding:10px;font-size:12px;line-height:1.6;outline:none;font-family:monospace;" placeholder="${templateText.replace(/"/g, '&quot;')}"></textarea>
            <div style="margin-top:8px;">
                <button class="modal-btn secondary" style="padding:6px 10px;font-size:12px;" onclick="document.getElementById('import-textarea').value=\`${templateText}\`">
                    <i class="fas fa-magic"></i> 填入示例模板
                </button>
                <button class="modal-btn secondary" style="padding:6px 10px;font-size:12px;" onclick="document.getElementById('import-textarea').value=''">
                    <i class="fas fa-eraser"></i> 清空
                </button>
            </div>
            <div id="import-result" style="margin-top:12px;"></div>
        </div>
        <div class="modal-footer" style="border:none;padding:10px 0 0;">
            <button class="modal-btn secondary" onclick="handleRealExamRefresh();">返回真题列表</button>
            <button class="modal-btn primary" onclick="submitImportQuestions()">
                <i class="fas fa-upload"></i> 导入到真题题库
            </button>
        </div>
    `;
    openModal('导入D盘真题', bodyHTML);
}

// 执行导入
async function submitImportQuestions() {
    const textarea = document.getElementById('import-textarea');
    const resultDiv = document.getElementById('import-result');
    if (!textarea || !textarea.value.trim()) {
        showToast('请先粘贴真题文本再导入', 'warning');
        return;
    }
    resultDiv.innerHTML = '<div style="text-align:center;padding:10px;"><i class="fas fa-spinner fa-spin" style="color:#3B82F6;"></i> 正在导入...</div>';
    const result = await api.importQuestions('text', textarea.value.trim());
    if (result && result.count) {
        resultDiv.innerHTML = `
            <div style="background:#ECFDF5;border:1px solid #6EE7B7;border-radius:8px;padding:12px;color:#065F46;">
                <i class="fas fa-check-circle"></i> 导入成功！共导入 <strong>${result.count}</strong> 道真题。
            </div>
        `;
        showToast(`成功导入 ${result.count} 道真题！`, 'success');
    } else {
        resultDiv.innerHTML = `
            <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px;color:#991B1B;">
                <i class="fas fa-exclamation-circle"></i> 导入失败，请检查文本格式是否正确。
            </div>
        `;
        showToast('导入失败，请检查格式', 'warning');
    }
}

// 题目详情 + 答题
async function showQuestionDetail(questionId) {
    openModal('答题训练', '<div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:#3B82F6;"></i></div>');
    const q = await api.getQuestion(questionId);
    if (!q) {
        openModal('答题训练', '<p>题目加载失败</p>');
        return;
    }

    const subjectColor = { '数学': '#3B82F6', '英语': '#8B5CF6', '物理': '#F59E0B', '化学': '#10B981', '语文': '#EF4444' };
    const diffStars = (d) => '★'.repeat(d) + '☆'.repeat(5 - d);
    const startTime = Date.now();

    const bodyHTML = `
        <div style="margin-bottom:16px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                <span style="background:${subjectColor[q.subject] || '#6B7280'};color:white;font-size:12px;padding:3px 10px;border-radius:4px;">${q.subject}</span>
                <span style="font-size:12px;color:#9CA3AF;">${q.type} | ${q.score}分</span>
                <span style="font-size:12px;color:#F59E0B;">${diffStars(q.difficulty)}</span>
            </div>
            ${q.knowledge_point ? `<div style="font-size:12px;color:#3B82F6;margin-bottom:10px;">考点：${q.knowledge_point.name}</div>` : ''}
            <div style="font-size:14px;line-height:1.7;color:#1F2937;background:#F9FAFB;padding:14px;border-radius:8px;">${q.content || q.title || ''}</div>
        </div>
        <div style="margin-bottom:16px;">
            <label style="font-size:13px;color:#6B7280;display:block;margin-bottom:6px;">你的答案：</label>
            <textarea id="answer-input" style="width:100%;min-height:80px;border:1px solid #E5E7EB;border-radius:8px;padding:10px;font-size:13px;outline:none;" placeholder="请输入你的答案..."></textarea>
        </div>
        <div id="answer-result" style="display:none;"></div>
        <div class="modal-footer" style="border:none;padding:20px 0 0;">
            <button class="modal-btn secondary" onclick="closeModal()">关闭</button>
            <button class="modal-btn primary" onclick="submitAnswerHandler('${q.id}', ${startTime})">提交答案</button>
        </div>
    `;
    openModal('答题训练', bodyHTML);
}

// 提交答案处理
async function submitAnswerHandler(questionId, startTime) {
    const input = document.getElementById('answer-input');
    if (!input || !input.value.trim()) {
        showToast('请输入答案后再提交', 'warning');
        return;
    }
    const timeCost = Math.round((Date.now() - startTime) / 1000);
    const resultDiv = document.getElementById('answer-result');
    resultDiv.style.display = 'block';
    resultDiv.innerHTML = '<div style="text-align:center;padding:10px;"><i class="fas fa-spinner fa-spin" style="color:#3B82F6;"></i> 提交中...</div>';

    const result = await api.submitAnswer(questionId, input.value.trim(), timeCost);
    if (!result) {
        resultDiv.innerHTML = '<div style="color:#EF4444;padding:10px;">提交失败，请重试</div>';
        return;
    }

    const isCorrect = result.is_correct;
    resultDiv.innerHTML = `
        <div style="padding:14px;border-radius:8px;margin-bottom:12px;background:${isCorrect ? '#ECFDF5' : '#FEF2F2'};border:1px solid ${isCorrect ? '#10B981' : '#EF4444'};">
            <div style="font-weight:600;color:${isCorrect ? '#10B981' : '#EF4444'};margin-bottom:8px;">
                <i class="fas ${isCorrect ? 'fa-check-circle' : 'fa-times-circle'}"></i> ${isCorrect ? '回答正确！' : '回答错误'}
                <span style="font-size:12px;color:#9CA3AF;font-weight:normal;margin-left:8px;">用时 ${timeCost}秒</span>
            </div>
            <div style="font-size:13px;color:#374151;margin-bottom:6px;"><strong>正确答案：</strong>${result.correct_answer}</div>
            <div style="font-size:13px;color:#6B7280;line-height:1.6;"><strong>解析：</strong>${result.analysis}</div>
        </div>
    `;
    showToast(isCorrect ? '回答正确！掌握率已更新' : '回答错误，查看解析', isCorrect ? 'success' : 'warning');

    // 更新薄弱知识点表格
    setTimeout(async () => {
        const weakPoints = await api.getWeakPoints(0.65, 5);
        if (weakPoints) renderWeakPoints(weakPoints);
    }, 500);
}

// ========== 模考预测报告（对接后端预测模型）==========
async function showExamReport() {
    openModal('模考预测详情报告', '<div style="text-align:center;padding:20px;"><i class="fas fa-spinner fa-spin" style="font-size:24px;color:#3B82F6;"></i><p style="margin-top:12px;color:#6B7280;">AI模型正在计算预测结果...</p></div>');
    const report = await api.getPredictReport();
    if (!report) {
        openModal('模考预测详情报告', '<p style="text-align:center;padding:20px;color:#6B7280;">预测服务暂时不可用</p>');
        return;
    }

    const adviceHTML = report.weak_advice ? report.weak_advice.map(a => `<div style="padding:6px 0;font-size:13px;color:#3B82F6;"><i class="fas fa-lightbulb"></i> ${a}</div>`).join('') : '';
    const subjectHTML = report.subject_scores ? report.subject_scores.map(s => `
        <div class="info-row"><span class="info-label">${s.subject}</span><span class="info-value">${s.score} / ${s.max_score}</span></div>
    `).join('') : '';

    const bodyHTML = `
        <div style="text-align:center;margin-bottom:20px;">
            <div style="font-size:48px;font-weight:700;color:#3B82F6;">${report.predicted_score}<span style="font-size:16px;">分</span></div>
            <div style="color:#6B7280;font-size:13px;margin-top:4px;">预测高考分数（满分750）</div>
        </div>
        <div class="info-row"><span class="info-label">预测总分</span><span class="info-value">${report.predicted_score} / 750</span></div>
        <div class="info-row"><span class="info-label">预测排名</span><span class="info-value">全省 ${report.rank.toLocaleString()} 名</span></div>
        <div class="info-row"><span class="info-label">百分位</span><span class="info-value">前 ${report.percentile}%</span></div>
        <div class="info-row"><span class="info-label">距高考</span><span class="info-value">${report.days_to_exam} 天</span></div>
        <div class="info-row"><span class="info-label">一本线差</span><span class="info-value" style="color:${report.yiben_line_diff >= 0 ? '#10B981' : '#EF4444'};">${report.yiben_line_diff >= 0 ? '+' : ''}${report.yiben_line_diff}分</span></div>
        <div class="info-row"><span class="info-label">985概率</span><span class="info-value" style="color:${report.probability.p985 >= 50 ? '#10B981' : '#F59E0B'};">${report.probability.p985}%</span></div>
        <div class="info-row"><span class="info-label">211概率</span><span class="info-value" style="color:${report.probability.p211 >= 50 ? '#10B981' : '#F59E0B'};">${report.probability.p211}%</span></div>
        <div class="info-row"><span class="info-label">一本概率</span><span class="info-value" style="color:#10B981;">${report.probability.yiben}%</span></div>
        <div class="info-row"><span class="info-label">趋势影响</span><span class="info-value" style="color:${report.trend_impact >= 0 ? '#10B981' : '#EF4444'};">${report.trend_impact >= 0 ? '+' : ''}${report.trend_impact}分</span></div>
        <div class="info-row"><span class="info-label">置信度</span><span class="info-value">${report.confidence}%</span></div>
        ${subjectHTML ? '<div style="margin-top:12px;font-size:13px;color:#6B7280;font-weight:600;">各科预测得分</div>' + subjectHTML : ''}
        ${adviceHTML ? `<div style="margin-top:16px;padding:12px;background:#EFF6FF;border-radius:8px;"><div style="font-size:13px;font-weight:600;color:#1F2937;margin-bottom:6px;">AI提分建议</div>${adviceHTML}</div>` : ''}
        <div style="margin-top:8px;font-size:11px;color:#9CA3AF;text-align:center;">模型：${report.model || 'AI预测模型'}</div>
        <div class="modal-footer" style="border:none;padding:20px 0 0;">
            <button class="modal-btn primary" onclick="closeModal();showToast('报告已保存','success');">保存报告</button>
        </div>
    `;
    openModal('模考预测详情报告', bodyHTML);
}

// ========== 周选择器（对接学情API）==========
async function handleWeekChange(value) {
    const days = value === '本周' ? 7 : 14;
    showToast(value === '本周' ? '加载本周数据...' : '加载近两周数据...', 'info');
    const summary = await api.getLearningSummary(days);
    if (summary) {
        renderGrowthRecord(summary);
        // 更新第四个变化的文案
        const changes = document.querySelectorAll('.growth-change');
        if (changes[3] && summary.changes) {
            const arrowUp = '<i class="fas fa-arrow-up"></i>';
            const arrowDown = '<i class="fas fa-arrow-down"></i>';
            // 积分变化用时长变化近似
            const pointsChange = summary.changes.duration;
            changes[3].innerHTML = `较上期 ${pointsChange >= 0 ? arrowUp : arrowDown} ${Math.abs(pointsChange)}%`;
            changes[3].className = `growth-change ${pointsChange >= 0 ? 'up' : 'down'}`;
        }
    }
}

// ========== 其他交互 ==========
function initInteractions() {
    // AI 学习教练输入框：支持中文输入法（isComposing 期间 Enter 确认候选词，不触发发送）
    const chatInput = document.getElementById('chat-input');
    if (chatInput && !chatInput._imeBound) {
        chatInput._imeBound = true;
        chatInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }

    // 搜索框焦点效果
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('focus', function() {
            this.parentElement.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)';
        });
        searchInput.addEventListener('blur', function() {
            this.parentElement.style.boxShadow = 'none';
        });
    }

    // 学习计划项悬停效果
    document.querySelectorAll('.plan-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#F9FAFB';
            this.style.borderRadius = '8px';
            this.style.padding = '6px';
            this.style.margin = '-6px';
            this.style.transition = 'all 0.2s';
        });
        item.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
            this.style.borderRadius = '';
            this.style.padding = '';
            this.style.margin = '';
        });
    });

    // 薄弱知识点行悬停效果
    document.querySelectorAll('.weak-table tbody tr').forEach(row => {
        row.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#F9FAFB';
            this.style.cursor = 'pointer';
        });
        row.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
        });
        row.addEventListener('click', function() {
            const name = this.querySelector('td').textContent.trim();
            showToast(`查看知识点：${name}`, 'info');
        });
    });

    // AI推荐卡片悬停效果
    document.querySelectorAll('.recommend-item').forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
            this.style.transition = 'all 0.2s ease';
        });
        item.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });

    // 底部高考冲刺计划横幅：点击整个卡片或按钮跳转到学习计划页
    const bannerCard = document.querySelector('.banner-card');
    if (bannerCard) {
        bannerCard.style.cursor = 'pointer';
        bannerCard.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 6px 20px rgba(0,0,0,0.10)';
            this.style.transition = 'all 0.2s ease';
        });
        bannerCard.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
        bannerCard.addEventListener('click', function(e) {
            // 避免按钮 onclick 与卡片重复触发跳转
            if (e.target.closest('.banner-btn')) return;
            showToast('正在打开高考冲刺计划...', 'info');
            switchPage('plan');
        });
    }

    // 顶部欢迎语：点击弹出登录/账户弹窗（不跳转页面）
    const welcomeEl = document.getElementById('welcome-text');
    if (welcomeEl) {
        welcomeEl.style.cursor = 'pointer';
        welcomeEl.title = '点击登录 / 查看账户';
        welcomeEl.addEventListener('click', function() {
            openAuthModal();
        });
    }

    // 首页各功能子模块卡片点击跳转（data-module → 目标页）
    // 避开卡片内部按钮/链接，仅在卡片空白处触发跳转
    var cardNavMap = {
        'goal':        { page: 'analysis',      msg: '查看学情分析' },
        'weak-points': { page: 'analysis',      msg: '查看薄弱知识点', tab: 'weak' },
        'radar':       { page: 'analysis',      msg: '查看学科能力雷达图', tab: 'radar' },
        'calendar':    { page: 'home-duration', msg: '查看学习时长详情' },
        'exam-predict': { page: 'exam-predict', msg: '查看模考预测报告' },
        'growth':      { page: 'home-duration', msg: '查看成长记录' }
    };
    Object.keys(cardNavMap).forEach(function(mod) {
        var cfg = cardNavMap[mod];
        var card = document.querySelector('[data-module="' + mod + '"]');
        if (!card || card._navBound) return;
        card._navBound = true;
        card.style.cursor = 'pointer';
        card.addEventListener('click', function(e) {
            // 卡片内部按钮/链接/a 标签的点击不触发卡片跳转
            if (e.target.closest('button, a, select, input, .recommend-btn, .banner-btn, .more-link, .adjust-link, .view-report-btn, .weak-table tbody tr')) return;
            if (cfg.msg) showToast(cfg.msg, 'info');
            switchPage(cfg.page);
        });
    });
}

function updateNotifBadge() {
    const unread = document.querySelectorAll('.notif-item.unread').length;
    const badge = document.getElementById('notif-badge');
    if (badge) {
        if (unread === 0) {
            badge.style.display = 'none';
        } else {
            badge.textContent = unread;
        }
    }
}

// ESC关闭弹窗
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
        document.getElementById('ai-chat-widget')?.classList.remove('show');
        document.getElementById('notification-dropdown')?.classList.remove('show');
        document.getElementById('search-results')?.classList.remove('show');
    }
});

// ========== 各功能页面渲染 ==========

// ========== AI学情分析（完整交互：周期分段切换 + 5 个子 Tab + Chart.js 图表）==========
// 全局交互状态：当前周期天数 & 当前选中的子 Tab
window._analysisDays = window._analysisDays || 7;
window._analysisTab = window._analysisTab || 'overview';
window._analysisSubject = window._analysisSubject || '全部';
// 显示名 → 天数映射（周期分段）
const ANALYSIS_PERIODS = { '近7天': 7, '近30天': 30, '本学期': 120 };
// 子 Tab 定义：key → { 名称, 图标, 数据范围建议天数(覆盖周期) }
const ANALYSIS_TABS = [
    { key: 'overview',  name: '综合概览', icon: 'fa-th-large'   },
    { key: 'trend',     name: '成绩趋势', icon: 'fa-chart-line' },
    { key: 'radar',     name: '能力雷达', icon: 'fa-crosshairs' },
    { key: 'weak',      name: '薄弱分析', icon: 'fa-exclamation-triangle' },
    { key: 'loss',      name: '失分归因', icon: 'fa-bug' },
    { key: 'report',    name: 'AI报告',   icon: 'fa-robot' }
];
// Chart 实例缓存（便于重绘前销毁）
window._analysisCharts = window._analysisCharts || {};
function destroyAnalysisChart(id) {
    if (!window._analysisCharts) return;
    const c = window._analysisCharts[id];
    try { if (c && typeof c.destroy === 'function') c.destroy(); } catch (e) {}
    delete window._analysisCharts[id];
}
function registerAnalysisChart(id, chart) {
    destroyAnalysisChart(id);
    window._analysisCharts[id] = chart;
}

// 周期分段切换 → 重新加载当前 Tab 数据
window.switchAnalysisPeriod = function(el) {
    if (!el || !el.parentElement) return;
    const parent = el.parentElement;
    parent.querySelectorAll('.analysis-period-item').forEach(function(s) {
        s.classList.remove('active');
        s.style.background = 'transparent';
        s.style.color = '#6B7280';
        s.style.boxShadow = 'none';
    });
    el.classList.add('active');
    el.style.background = 'white';
    el.style.color = '#3B82F6';
    el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    const text = (el.textContent || '').trim();
    const days = ANALYSIS_PERIODS[text];
    if (!days) return;
    window._analysisDays = days;
    loadAnalysisTab(window._analysisTab || 'overview');
};

// 子 Tab 切换 → 切换激活态并加载对应内容
window.switchAnalysisTab = function(tabKey) {
    if (!tabKey) return;
    window._analysisTab = tabKey;
    const tabs = document.querySelectorAll('.analysis-subtab');
    tabs.forEach(function(t) {
        const active = t.dataset.tab === tabKey;
        t.classList.toggle('active', active);
        t.style.color = active ? '#3B82F6' : '#6B7280';
        t.style.borderBottom = active ? '2px solid #3B82F6' : '2px solid transparent';
        t.style.fontWeight = active ? '700' : '500';
        t.style.background = active ? '#EFF6FF' : 'transparent';
    });
    // 同时同步 Tab 栏下方周期分段控件激活态（若当前 Tab 有建议天数）
    loadAnalysisTab(tabKey);
};

// 学科选择器（仅成绩趋势 Tab 使用）
window.switchAnalysisSubject = function(selectEl) {
    if (!selectEl) return;
    window._analysisSubject = selectEl.value || '全部';
    if (window._analysisTab === 'trend') loadAnalysisTab('trend');
};

// 生成学情分析默认数据（云端静态环境回退用）
function getAnalysisDefaults() {
    return {
        summary: { duration_hours: 12.5, questions_count: 186, correct_rate: 78, points: 1240, changes: { duration: 12, questions: 8, correct_rate: 5 } },
        subjectStats: [
            { subject: '数学', duration_min: 320, questions: 486, correct_rate: 72 },
            { subject: '语文', duration_min: 180, questions: 215, correct_rate: 80 },
            { subject: '英语', duration_min: 240, questions: 320, correct_rate: 85 },
            { subject: '物理', duration_min: 210, questions: 280, correct_rate: 68 },
            { subject: '化学', duration_min: 180, questions: 260, correct_rate: 75 },
            { subject: '生物', duration_min: 120, questions: 150, correct_rate: 82 }
        ],
        mastery: {
            radar_labels: ['数学','语文','英语','物理','化学','生物','政治','历史','地理'],
            radar_current: [68, 75, 80, 71, 66, 70, 73, 76, 74],
            radar_target: [85, 80, 85, 82, 80, 78, 80, 82, 80],
            radar: [
                { subject: '数学', current_mastery: 68, target_mastery: 85, color: '#3B82F6', icon: 'fa-calculator', duration_hours: 5.3, questions_count: 486, correct_rate: 72, gap: 17 },
                { subject: '语文', current_mastery: 75, target_mastery: 80, color: '#EF4444', icon: 'fa-book', duration_hours: 3.0, questions_count: 215, correct_rate: 80, gap: 5 },
                { subject: '英语', current_mastery: 80, target_mastery: 85, color: '#10B981', icon: 'fa-language', duration_hours: 4.0, questions_count: 320, correct_rate: 85, gap: 5 },
                { subject: '物理', current_mastery: 71, target_mastery: 82, color: '#8B5CF6', icon: 'fa-atom', duration_hours: 3.5, questions_count: 280, correct_rate: 68, gap: 11 },
                { subject: '化学', current_mastery: 66, target_mastery: 80, color: '#F59E0B', icon: 'fa-flask', duration_hours: 3.0, questions_count: 260, correct_rate: 75, gap: 14 },
                { subject: '生物', current_mastery: 70, target_mastery: 78, color: '#10B981', icon: 'fa-dna', duration_hours: 2.0, questions_count: 150, correct_rate: 82, gap: 8 },
                { subject: '政治', current_mastery: 73, target_mastery: 80, color: '#EF4444', icon: 'fa-landmark', duration_hours: 1.5, questions_count: 120, correct_rate: 76, gap: 7 },
                { subject: '历史', current_mastery: 76, target_mastery: 82, color: '#F59E0B', icon: 'fa-archway', duration_hours: 1.8, questions_count: 140, correct_rate: 79, gap: 6 },
                { subject: '地理', current_mastery: 74, target_mastery: 80, color: '#3B82F6', icon: 'fa-globe-asia', duration_hours: 1.6, questions_count: 130, correct_rate: 77, gap: 6 }
            ],
            weakest_subjects: [
                { subject: '化学', current: 66, target: 80, gap: 14, color: '#F59E0B' },
                { subject: '数学', current: 68, target: 85, gap: 17, color: '#3B82F6' },
                { subject: '物理', current: 71, target: 82, gap: 11, color: '#8B5CF6' }
            ],
            strongest_subjects: [
                { subject: '英语', current: 80, target: 85, gap: 5, color: '#10B981' },
                { subject: '历史', current: 76, target: 82, gap: 6, color: '#F59E0B' },
                { subject: '语文', current: 75, target: 80, gap: 5, color: '#EF4444' }
            ]
        },
        answerStats: {
            total: 186,
            correct: 145,
            wrong: 41,
            knowledge_point_stats: [
                { subject: '数学', name: '圆锥曲线综合', total: 45, correct_rate: 42 },
                { subject: '数学', name: '导数应用专题', total: 38, correct_rate: 51 },
                { subject: '物理', name: '电磁感应综合', total: 32, correct_rate: 55 },
                { subject: '化学', name: '有机推断题型', total: 28, correct_rate: 48 },
                { subject: '英语', name: '完形填空技巧', total: 41, correct_rate: 63 },
                { subject: '数学', name: '概率统计应用', total: 35, correct_rate: 58 },
                { subject: '物理', name: '力学综合分析', total: 30, correct_rate: 65 },
                { subject: '化学', name: '电化学原理', total: 25, correct_rate: 72 },
                { subject: '英语', name: '书面表达高级句式', total: 22, correct_rate: 68 },
                { subject: '数学', name: '函数与方程', total: 40, correct_rate: 55 },
                { subject: '物理', name: '热力学基础', total: 18, correct_rate: 75 },
                { subject: '化学', name: '化学平衡移动', total: 26, correct_rate: 62 }
            ]
        },
        weakPoints: [
            { subject: '数学', name: '圆锥曲线综合', mastery_rate: 0.41, difficulty: 4, score_gain: 18, priority: 'high', description: '椭圆与直线联立、弦长公式应用不熟练' },
            { subject: '数学', name: '导数应用专题', mastery_rate: 0.45, difficulty: 5, score_gain: 15, priority: 'high', description: '极值点偏移、零点分布需强化' },
            { subject: '物理', name: '电磁感应综合', mastery_rate: 0.48, difficulty: 4, score_gain: 12, priority: 'high', description: '电磁感应与力学综合题分析困难' },
            { subject: '化学', name: '化学平衡计算', mastery_rate: 0.49, difficulty: 4, score_gain: 13, priority: 'high', description: '平衡常数与转化率计算易错' },
            { subject: '化学', name: '有机推断题型', mastery_rate: 0.58, difficulty: 4, score_gain: 7, priority: 'mid', description: '官能团性质与反应条件不清晰' },
            { subject: '数学', name: '概率统计应用', mastery_rate: 0.62, difficulty: 3, score_gain: 5, priority: 'mid', description: '概率分布列与期望计算需练习' },
            { subject: '物理', name: '力学综合分析', mastery_rate: 0.55, difficulty: 4, score_gain: 10, priority: 'mid', description: '多过程受力分析与能量守恒' },
            { subject: '英语', name: '完形填空技巧', mastery_rate: 0.53, difficulty: 3, score_gain: 9, priority: 'mid', description: '上下文逻辑推理能力不足' },
            { subject: '英语', name: '书面表达高级句式', mastery_rate: 0.52, difficulty: 4, score_gain: 10, priority: 'mid', description: '高级句式应用与词汇多样性' },
            { subject: '数学', name: '立体几何向量法', mastery_rate: 0.56, difficulty: 4, score_gain: 9, priority: 'mid', description: '空间向量建系与法向量计算' },
            { subject: '物理', name: '动量与冲量', mastery_rate: 0.57, difficulty: 3, score_gain: 8, priority: 'low', description: '动量守恒条件判断与应用' },
            { subject: '化学', name: '电化学原理', mastery_rate: 0.51, difficulty: 3, score_gain: 11, priority: 'high', description: '原电池与电解池判断易混淆' },
            { subject: '英语', name: '语法填空', mastery_rate: 0.63, difficulty: 2, score_gain: 6, priority: 'low', description: '词性转换与从句连接词' },
            { subject: '数学', name: '数列求和方法', mastery_rate: 0.54, difficulty: 3, score_gain: 11, priority: 'mid', description: '错位相减与裂项相消' },
            { subject: '化学', name: '实验综合分析', mastery_rate: 0.50, difficulty: 4, score_gain: 12, priority: 'high', description: '实验设计与误差分析' }
        ],
        loss: {
            total_wrong: 41,
            top_loss_points: [
                { subject: '数学', name: '圆锥曲线综合', count: 12, percent: 29 },
                { subject: '数学', name: '导数应用专题', count: 8, percent: 20 },
                { subject: '物理', name: '电磁感应综合', count: 6, percent: 15 },
                { subject: '化学', name: '有机推断题型', count: 5, percent: 12 },
                { subject: '英语', name: '完形填空技巧', count: 4, percent: 10 },
                { subject: '化学', name: '化学平衡计算', count: 3, percent: 7 },
                { subject: '物理', name: '力学综合分析', count: 3, percent: 7 }
            ],
            subjects: [
                { subject: '数学', wrong_count: 20, percent: 49 },
                { subject: '物理', wrong_count: 9, percent: 22 },
                { subject: '化学', wrong_count: 8, percent: 20 },
                { subject: '英语', wrong_count: 4, percent: 10 }
            ],
            top_wrong_type: { type: '选择题', count: 28 },
            top_wrong_difficulty: { label: '中等', count: 22 }
        },
        dailySeries: {
            labels: ['9/15','9/16','9/17','9/18','9/19','9/20','9/21'],
            duration_minutes: [120, 95, 150, 110, 180, 90, 135],
            answer_count: [28, 22, 35, 26, 42, 18, 30],
            correct_rate: [75, 68, 80, 72, 85, 65, 78]
        },
        answerTrend: {
            labels: ['9/15','9/16','9/17','9/18','9/19','9/20','9/21'],
            answer_count: [28, 22, 35, 26, 42, 18, 30],
            correct_rate: [75, 68, 80, 72, 85, 65, 78]
        },
        scoreTrend: {
            labels: ['7月','8月初','8月中','8月末','9月初','9月中','9月末','10月','11月','12月'],
            history: [545, 552, 558, 562, 565, 568, null, null, null, null],
            predict: [null, null, null, null, 568, 572, 578, 585, 595, 605],
            target_score: 620,
            yiben_line: 520,
            current_score: 568
        },
        report: {
            model: 'AI-Gaokao-Predictor v2.1',
            confidence: 89,
            days_to_exam: 259,
            current_score: 568,
            predicted_score: 605,
            target_score: 620,
            rank: 12580,
            province: '浙江',
            yiben_line_diff: 48,
            probability: { yiben: 72, p211: 55, p985: 28 },
            weak_advice: [
                '数学圆锥曲线综合：建议每天 2 题专项，掌握联立方程与韦达定理应用',
                '化学有机推断：梳理官能团性质表，完成 3 套有机推断专项训练',
                '物理电磁感应：强化受力分析与能量守恒综合应用，每周 1 套综合题'
            ],
            subject_scores: [
                { subject: '语文', score: 112, max_score: 150 },
                { subject: '数学', score: 105, max_score: 150 },
                { subject: '英语', score: 118, max_score: 150 },
                { subject: '物理', score: 78, max_score: 100 },
                { subject: '化学', score: 85, max_score: 100 },
                { subject: '生物', score: 70, max_score: 100 }
            ]
        },
        predictScore: { current_predicted: 568, final_predicted: 605 },
        predictRank: { rank: 12580, province: '浙江', probability: { yiben: 72, p211: 55, p985: 28 } },
        durationStats: { advice: 'AI建议：数学圆锥曲线综合与导数应用专题掌握率偏低，建议每日安排40分钟专项训练，优先突破提分空间最大的薄弱点。' }
    };
}

// Tab → 具体加载函数分发
function loadAnalysisTab(tabKey) {
    const content = document.getElementById('analysis-tab-content');
    if (!content) return;
    content.innerHTML = '<div style="text-align:center;padding:60px 20px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:28px;margin-bottom:14px;display:block;"></i><div style="font-size:13px;">分析你的学习数据…</div></div>';
    // 销毁已存在的 Chart.js 实例，避免 canvas 复用报错
    Object.keys(window._analysisCharts || {}).forEach(destroyAnalysisChart);
    switch (tabKey) {
        case 'overview': return renderAnalysisOverview(content);
        case 'trend':    return renderAnalysisScoreTrend(content);
        case 'radar':    return renderAnalysisRadar(content);
        case 'weak':     return renderAnalysisWeak(content);
        case 'loss':     return renderAnalysisLoss(content);
        case 'report':   return renderAnalysisReport(content);
        default:         content.innerHTML = '<div style="padding:40px;text-align:center;color:#9CA3AF;">暂未实现</div>';
    }
}

// 顶部摘要卡片：展示 4 个核心指标
function analysisSummaryCards(summary) {
    if (!summary) return '';
    const durH = (summary.duration_hours != null) ? summary.duration_hours : 0;
    const q = summary.questions_count || 0;
    const rate = summary.correct_rate || 0;
    const pts = summary.points || 0;
    const changes = summary.changes || {};
    const chip = function(v, unit) {
        if (v == null) return '';
        if (v > 0) return '<span style="margin-left:6px;font-size:11px;color:#10B981;">▲ ' + v + (unit || '%') + '</span>';
        if (v < 0) return '<span style="margin-left:6px;font-size:11px;color:#EF4444;">▼ ' + Math.abs(v) + (unit || '%') + '</span>';
        return '<span style="margin-left:6px;font-size:11px;color:#6B7280;">—</span>';
    };
    return '<div class="stats-grid" style="margin-bottom:14px;">' +
        '<div class="stat-item"><div class="stat-num">' + durH + '</div><div class="stat-label">学习时长（小时）' + chip(changes.duration, '%') + '</div></div>' +
        '<div class="stat-item"><div class="stat-num">' + q + '</div><div class="stat-label">做题数量' + chip(changes.questions, '%') + '</div></div>' +
        '<div class="stat-item"><div class="stat-num">' + rate + '%</div><div class="stat-label">正确率' + chip(changes.correct_rate, '%') + '</div></div>' +
        '<div class="stat-item"><div class="stat-num">' + pts + '</div><div class="stat-label">获得积分</div></div>' +
    '</div>';
}

function tagClassFor(subject) {
    switch (subject) {
        case '数学': return 'tag-math';
        case '英语': return 'tag-english';
        case '物理': return 'tag-physics';
        case '化学': return 'tag-chem';
        default:      return 'tag-chinese';
    }
}

async function renderAnalysisOverview(container) {
    const days = window._analysisDays || 7;
    const [summary, subjectStats, answerStats, mastery, durationStats] = await Promise.all([
        api.getLearningSummary(days),
        api.getSubjectStats(days),
        api.getAnswerStats(days),
        api.getSubjectMastery(days),
        api.getDurationStats().catch(() => null)
    ]);
    // 云端静态环境回退：API 失败时或字段不匹配时使用默认数据
    const _d = getAnalysisDefaults();
    const _summary = summary || _d.summary;
    // 检查 subjectStats 是否有必需字段（duration_min/questions/correct_rate）
    var _subjectStats = subjectStats;
    if (_subjectStats && Array.isArray(_subjectStats) && _subjectStats.length > 0) {
        var _ss0 = _subjectStats[0];
        if (_ss0.duration_min === undefined || _ss0.questions === undefined || _ss0.correct_rate === undefined) {
            _subjectStats = _d.subjectStats;
        }
    } else if (!_subjectStats || !Array.isArray(_subjectStats) || _subjectStats.length === 0) {
        _subjectStats = _d.subjectStats;
    }
    const _answerStats = answerStats || _d.answerStats;
    // 检查 mastery 是否有必需字段
    var _mastery = mastery;
    if (_mastery && (!_mastery.radar || !_mastery.radar_labels || !_mastery.radar_current)) {
        _mastery = _d.mastery;
    } else if (!_mastery) {
        _mastery = _d.mastery;
    }
    const _durationStats = durationStats || _d.durationStats;
    const sArr = Array.isArray(_subjectStats) ? _subjectStats : (_subjectStats && _subjectStats.data) || [];
    const kpArr = (_answerStats && _answerStats.knowledge_point_stats) || [];
    const weakest = (_mastery && _mastery.weakest_subjects) || [];
    const advice = (_durationStats && _durationStats.advice) || '';

    let subjectHTML = '';
    if (sArr.length) {
        subjectHTML = sArr.map(function(s) {
            return '<div class="analysis-card">' +
                '<div class="analysis-subject">' + s.subject + '</div>' +
                '<div class="analysis-row"><span>学习时长</span><strong>' + s.duration_min + ' 分钟</strong></div>' +
                '<div class="analysis-row"><span>做题数量</span><strong>' + s.questions + ' 题</strong></div>' +
                '<div class="analysis-row"><span>正确率</span><strong style="color:' + (s.correct_rate>=60?'#10B981':'#EF4444') + '">' + s.correct_rate + '%</strong></div>' +
            '</div>';
        }).join('');
    }

    let kpHTML = '';
    if (kpArr.length) {
        kpHTML = kpArr.slice(0, 12).map(function(k) {
            return '<tr>' +
                '<td><span class="tag ' + tagClassFor(k.subject) + '">' + (k.subject || '综')[0] + '</span> ' + (k.name || '—') + '</td>' +
                '<td>' + k.total + '</td>' +
                '<td><strong style="color:' + (k.correct_rate>=60?'#10B981':'#EF4444') + '">' + k.correct_rate + '%</strong></td>' +
                '<td><div class="mastery-bar"><div class="mastery-fill ' + (k.correct_rate<40?'red':k.correct_rate<60?'orange':'green') + '" style="width:' + k.correct_rate + '%"></div></div></td>' +
            '</tr>';
        }).join('');
    }

    let weakBlock = '';
    if (weakest.length) {
        weakBlock = '<div class="row" style="margin-top:14px;"><div class="card" style="flex:1;">' +
            '<div class="card-title"><i class="fas fa-exclamation-triangle" style="color:#F59E0B;margin-right:6px;"></i>待突破 TOP3 学科</div>' +
            weakest.map(function(w) {
                const gapPct = Math.max(0, Math.min(100, (w.gap || 0)));
                return '<div style="margin-bottom:12px;">' +
                    '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">' +
                        '<span><b>' + w.subject + '</b> · 当前 ' + w.current + '% → 目标 ' + w.target + '%</span>' +
                        '<span style="color:#F59E0B;font-weight:700;">还差 ' + w.gap + '%</span>' +
                    '</div>' +
                    '<div style="height:10px;background:#F3F4F6;border-radius:5px;overflow:hidden;">' +
                        '<div style="height:100%;width:' + Math.round((w.current / (w.target||90)) * 100) + '%;background:linear-gradient(90deg,' + w.color + ',#6D28D9);border-radius:5px;"></div>' +
                    '</div></div>';
            }).join('') + '</div></div>';
    }

    const adviceBlock = advice
        ? '<div class="row" style="margin-top:14px;"><div class="card" style="flex:1;background:#EFF6FF;border:1px solid #DBEAFE;">' +
            '<div class="card-title"><i class="fas fa-lightbulb" style="color:#3B82F6;margin-right:6px;"></i>AI 学习建议</div>' +
            '<div style="font-size:13px;line-height:1.8;color:#1E3A8A;">' + advice + '</div></div></div>'
        : '';

    container.innerHTML =
        analysisSummaryCards(_summary) +
        '<div class="row"><div class="card" style="flex:1;"><div class="card-title">各科学习统计</div>' +
            '<div class="analysis-grid">' + (subjectHTML || '<div style="color:#9CA3AF;padding:20px;text-align:center;">暂无数据</div>') + '</div>' +
        '</div></div>' +
        '<div class="row"><div class="card" style="flex:1;">' +
            '<div class="card-title">考点掌握情况（Top12）</div>' +
            '<table class="weak-table"><thead><tr><th>考点</th><th>答题数</th><th>正确率</th><th>掌握度</th></tr></thead>' +
            '<tbody>' + (kpHTML || '<tr><td colspan="4" style="text-align:center;color:#9CA3AF;">暂无数据</td></tr>') + '</tbody></table>' +
        '</div></div>' +
        weakBlock + adviceBlock;
}

async function renderAnalysisScoreTrend(container) {
    const days = window._analysisDays || 7;
    const subject = window._analysisSubject || '全部';
    const [daily, answerTrend, scoreTrend] = await Promise.all([
        api.getLearningDailySeries(days, subject),
        api.getAnswerTrend(days),
        api.getPredictScoreTrend(Math.max(60, days * 2)).catch(() => null)
    ]);
    // 云端静态环境回退：API 失败时使用默认数据
    const _d = getAnalysisDefaults();
    const _daily = daily || _d.dailySeries;
    const _answerTrend = answerTrend || _d.answerTrend;
    const _scoreTrend = scoreTrend || _d.scoreTrend;

    const subjects = ['全部','数学','语文','英语','物理','化学','生物','思想政治','历史','地理'];
    const selector = '<div style="margin:-6px 0 10px;display:flex;align-items:center;gap:10px;">' +
        '<label style="font-size:12px;color:#6B7280;">学科筛选：</label>' +
        '<select onchange="window.switchAnalysisSubject(this)" style="padding:6px 10px;border-radius:8px;border:1px solid #D1D5DB;font-size:12px;background:white;">' +
        subjects.map(function(s) { return '<option value="' + s + '"' + (s===subject?' selected':'') + '>' + s + '</option>'; }).join('') +
        '</select></div>';

    container.innerHTML =
        selector +
        '<div class="row"><div class="card" style="flex:1;">' +
            '<div class="card-title">每日学习时长（分钟）</div>' +
            '<div style="height:220px;"><canvas id="analysisChartDuration"></canvas></div>' +
        '</div></div>' +
        '<div class="row"><div class="card" style="flex:1;">' +
            '<div class="card-title">每日答题量 & 正确率</div>' +
            '<div style="height:220px;"><canvas id="analysisChartAnswer"></canvas></div>' +
        '</div></div>' +
        '<div class="row"><div class="card" style="flex:1;">' +
            '<div class="card-title">高考成绩趋势预测（历史真实分 · 未来预测分 · 目标分 · 一本线）</div>' +
            '<div style="height:240px;"><canvas id="analysisChartScore"></canvas></div>' +
        '</div></div>';

    // Chart 1: Duration bar
    if (typeof Chart !== 'undefined') {
        if (_daily && _daily.labels) {
            const ctx1 = document.getElementById('analysisChartDuration');
            if (ctx1) registerAnalysisChart('duration', new Chart(ctx1, {
                type: 'bar',
                data: { labels: _daily.labels, datasets: [{
                    label: '学习时长（分钟）',
                    data: _daily.duration_minutes,
                    backgroundColor: '#3B82F6',
                    borderRadius: 4
                }]},
                options: { responsive:true, maintainAspectRatio:false,
                    plugins: { legend: { display:false } },
                    scales: { y: { beginAtZero:true, grid: { color:'#F3F4F6' } }, x: { grid:{display:false}, ticks:{font:{size:10},color:'#6B7280'} } }
                }
            }));
        }
        // Chart 2: Answer count + correct_rate (双轴)
        if (_answerTrend && _answerTrend.labels) {
            const ctx2 = document.getElementById('analysisChartAnswer');
            if (ctx2) registerAnalysisChart('answer', new Chart(ctx2, {
                type: 'bar',
                data: {
                    labels: _answerTrend.labels,
                    datasets: [
                        { type:'bar', label:'答题数', data: _answerTrend.answer_count, backgroundColor:'#8B5CF6', yAxisID:'y', order:2, borderRadius:3 },
                        { type:'line', label:'正确率(%)', data: _answerTrend.correct_rate, borderColor:'#10B981', backgroundColor:'#10B981', tension:0.35, borderWidth:2, yAxisID:'y1', order:1, pointRadius:2 }
                    ]
                },
                options: {
                    responsive:true, maintainAspectRatio:false,
                    plugins: { legend: { display:true, labels:{ boxWidth:10, font:{size:11}, color:'#6B7280' } } },
                    scales: {
                        y:  { position:'left',  beginAtZero:true, grid:{color:'#F3F4F6'}, ticks:{color:'#6B7280'} },
                        y1: { position:'right', beginAtZero:true, min:0, max:100, grid:{display:false}, ticks:{color:'#6B7280', callback:function(v){return v+'%'}} },
                        x:  { grid:{display:false}, ticks:{font:{size:10}, color:'#6B7280'} }
                    }
                }
            }));
        }
        // Chart 3: Score trend (history实心, predict虚线+渐变填, target/一本线参考线)
        if (_scoreTrend && _scoreTrend.labels) {
            const ctx3 = document.getElementById('analysisChartScore');
            if (ctx3) {
                const targetLine = _scoreTrend.target_score;
                const yiben = _scoreTrend.yiben_line || 520;
                const yMin = Math.floor(Math.min(yiben, (_scoreTrend.current_score||600) - 40) / 10) * 10;
                const yMax = Math.ceil((Math.max(targetLine || 650, ...(_scoreTrend.history||[]).filter(Boolean), ...(_scoreTrend.predict||[]).filter(Boolean)) + 20) / 10) * 10;
                registerAnalysisChart('score', new Chart(ctx3, {
                    type: 'line',
                    data: {
                        labels: _scoreTrend.labels,
                        datasets: [
                            { label:'真实分', data: _scoreTrend.history, borderColor:'#3B82F6', backgroundColor:'rgba(59,130,246,0.12)',
                                borderWidth:2, tension:0.3, fill:true, pointRadius:1, spanGaps:false },
                            { label:'预测分', data: _scoreTrend.predict, borderColor:'#F59E0B', borderDash:[6,4],
                                borderWidth:2, tension:0.3, backgroundColor:'rgba(245,158,11,0.08)', fill:true, pointRadius:1, spanGaps:false }
                        ]
                    },
                    options: {
                        responsive:true, maintainAspectRatio:false,
                        plugins: {
                            legend: { display:true, labels:{ boxWidth:12, font:{size:11}, color:'#6B7280' } },
                            tooltip: { callbacks: { label: function(c){ return c.dataset.label + ': ' + (c.parsed.y ?? '—') + ' 分'; } } },
                            annotation: (typeof Chart.plugins !== 'undefined' ? undefined : undefined)
                        },
                        scales: {
                            x: { grid:{display:false}, ticks:{ maxRotation:0, autoSkip:true, maxTicksLimit:10, font:{size:10}, color:'#6B7280' } },
                            y: { min: yMin, max: yMax,
                                grid: { color:'#F3F4F6' },
                                ticks: { color:'#6B7280' },
                                suggestedMin: 500
                            }
                        }
                    },
                    plugins: [{
                        id: 'analysisTargetLines',
                        afterDraw: function(chart) {
                            const yScale = chart.scales.y;
                            const xScale = chart.scales.x;
                            if (!yScale || !xScale) return;
                            const draw = function(y, color, label, align) {
                                if (y < yScale.min || y > yScale.max) return;
                                const yPx = yScale.getPixelForValue(y);
                                const ctx = chart.ctx;
                                ctx.save();
                                ctx.strokeStyle = color;
                                ctx.lineWidth = 1.5;
                                ctx.setLineDash([4,4]);
                                ctx.beginPath();
                                ctx.moveTo(xScale.left, yPx);
                                ctx.lineTo(xScale.right, yPx);
                                ctx.stroke();
                                ctx.setLineDash([]);
                                ctx.fillStyle = color;
                                ctx.font = 'bold 11px sans-serif';
                                ctx.textBaseline = 'bottom';
                                if (align === 'right') { ctx.textAlign = 'right'; ctx.fillText(label + ' ' + y + '分', xScale.right - 4, yPx - 2); }
                                else { ctx.textAlign = 'left'; ctx.fillText(label + ' ' + y + '分', xScale.left + 4, yPx - 2); }
                                ctx.restore();
                            };
                            draw(targetLine, '#EF4444', '🎯 目标分', 'right');
                            draw(yiben,      '#10B981', '📘 一本线', 'left');
                        }
                    }]
                }));
            }
        }
    }
}

async function renderAnalysisRadar(container) {
    const days = window._analysisDays || 7;
    const mastery = await api.getSubjectMastery(days);
    // 云端静态环境回退：API 失败时或字段不匹配时使用默认数据
    var _mastery = mastery;
    if (_mastery && (!_mastery.radar || !_mastery.radar_labels || !_mastery.radar_current)) {
        _mastery = getAnalysisDefaults().mastery;
    } else if (!_mastery) {
        _mastery = getAnalysisDefaults().mastery;
    }
    const radar = (_mastery && _mastery.radar) || [];
    const weakest = (_mastery && _mastery.weakest_subjects) || [];
    const strongest = (_mastery && _mastery.strongest_subjects) || [];

    container.innerHTML =
        '<div class="row"><div class="card" style="flex:1;">' +
            '<div class="card-title">九科能力雷达（当前掌握率 · 目标掌握率）</div>' +
            '<div style="height:320px;padding:10px 20px;"><canvas id="analysisRadar"></canvas></div>' +
        '</div></div>' +
        '<div class="row"><div class="card" style="flex:1;">' +
            '<div class="card-title">学科掌握详情</div>' +
            (radar.length ? '<div class="analysis-grid">' + radar.map(function(r) {
                const dis = r.current_mastery < 40 ? '#EF4444' : r.current_mastery < 60 ? '#F59E0B' : '#10B981';
                return '<div class="analysis-card" style="border-left:3px solid ' + r.color + ';">' +
                    '<div class="analysis-subject"><i class="fas ' + r.icon + '" style="color:' + r.color + ';margin-right:4px;"></i>' + r.subject + '</div>' +
                    '<div class="analysis-row"><span>当前掌握率</span><strong style="color:' + dis + ';">' + r.current_mastery + '%</strong></div>' +
                    '<div class="analysis-row"><span>目标掌握率</span><strong>' + r.target_mastery + '%</strong></div>' +
                    '<div class="analysis-row"><span>近' + days + '天学习</span><strong>' + r.duration_hours + 'h / ' + r.questions_count + '题</strong></div>' +
                    '<div class="analysis-row"><span>答题正确率</span><strong style="color:' + (r.correct_rate>=60?'#10B981':'#EF4444') + ';">' + r.correct_rate + '%</strong></div>' +
                    '<div style="margin-top:8px;height:8px;background:#F3F4F6;border-radius:4px;overflow:hidden;">' +
                        '<div style="height:100%;width:' + r.current_mastery + '%;background:linear-gradient(90deg,' + r.color + ',#6D28D9);"></div>' +
                    '</div></div>';
            }).join('') + '</div>' : '<div style="color:#9CA3AF;padding:20px;text-align:center;">暂无数据</div>') +
        '</div></div>' +
        '<div class="row"><div class="card" style="flex:1;min-width:0;">' +
            '<div class="card-title"><i class="fas fa-fire" style="color:#EF4444;margin-right:6px;"></i>薄弱科目（差距最大）</div>' +
            (weakest.length ? weakest.map(function(w) {
                return '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px dashed #E5E7EB;">' +
                    '<div style="width:30px;height:30px;border-radius:8px;background:' + w.color + '22;color:' + w.color + ';display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;">' + w.subject[0] + '</div>' +
                    '<div style="flex:1;min-width:0;">' +
                        '<div style="font-size:13px;font-weight:700;">' + w.subject + ' · <span style="color:#F59E0B;">差 ' + w.gap + '%</span></div>' +
                        '<div style="font-size:11px;color:#6B7280;">当前 ' + w.current + '% → 目标 ' + w.target + '%</div>' +
                        '<div style="height:6px;background:#F3F4F6;border-radius:3px;margin-top:4px;"><div style="height:100%;width:' + Math.round(w.current/(w.target||90)*100) + '%;background:' + w.color + ';border-radius:3px;"></div></div>' +
                    '</div>' +
                    '<button class="btn-primary" style="height:30px;padding:0 12px;border-radius:15px;font-size:12px;" onclick="showToast(\'已加入学习计划：' + w.subject + '专项训练\',\'success\');switchPage(\'plan\');">立即突破</button>' +
                '</div>';
            }).join('') : '<div style="color:#9CA3AF;padding:20px;text-align:center;">暂无数据</div>') +
        '</div><div class="card" style="flex:1;min-width:0;">' +
            '<div class="card-title"><i class="fas fa-trophy" style="color:#10B981;margin-right:6px;"></i>优势科目</div>' +
            (strongest.length ? strongest.map(function(s){
                return '<div style="padding:10px 0;border-bottom:1px dashed #E5E7EB;">' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;">' +
                        '<span><b style="color:' + s.color + ';">' + s.subject + '</b> · 掌握率 <b>' + s.current + '%</b></span>' +
                        (s.gap <= 0 ? '<span style="color:#10B981;font-weight:700;">✓ 达标</span>' : '<span style="color:#6B7280;">距目标 ' + s.gap + '%</span>') +
                    '</div></div>';
            }).join('') : '<div style="color:#9CA3AF;padding:20px;text-align:center;">暂无数据</div>') +
        '</div></div>';

    if (typeof Chart !== 'undefined' && _mastery && _mastery.radar_labels) {
        const ctx = document.getElementById('analysisRadar');
        if (ctx) registerAnalysisChart('radar', new Chart(ctx, {
            type: 'radar',
            data: {
                labels: _mastery.radar_labels,
                datasets: [
                    { label: '当前掌握', data: _mastery.radar_current,
                        borderColor:'#3B82F6', backgroundColor:'rgba(59,130,246,0.18)',
                        borderWidth:2, pointBackgroundColor:'#3B82F6', pointBorderColor:'#fff', pointRadius:3 },
                    { label: '目标掌握', data: _mastery.radar_target,
                        borderColor:'#9CA3AF', backgroundColor:'transparent',
                        borderDash:[5,5], borderWidth:2, pointBackgroundColor:'#9CA3AF', pointBorderColor:'#fff', pointRadius:3 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position:'bottom', labels:{ boxWidth:12, font:{size:11}, color:'#6B7280' } } },
                scales: { r: { min:0, max:100, ticks:{display:false, stepSize:20}, grid:{color:'#E5E7EB'}, angleLines:{color:'#E5E7EB'}, pointLabels:{color:'#111827', font:{size:12}} } },
                animation: { duration:1200, easing:'easeInOutQuart' }
            }
        }));
    }
}

async function renderAnalysisWeak(container) {
    const days = window._analysisDays || 7;
    const [weakKps, answerStats, mastery] = await Promise.all([
        api.getWeakPoints(0.65, 15),
        api.getAnswerStats(days),
        api.getSubjectMastery(days)
    ]);
    // 云端静态环境回退：API 失败时使用默认数据
    const _d = getAnalysisDefaults();
    const _weakKps = weakKps || _d.weakPoints;
    const _mastery = mastery || _d.mastery;
    const arr = Array.isArray(_weakKps) ? _weakKps : (_weakKps && _weakKps.data) || [];
    const weakest = (_mastery && _mastery.weakest_subjects) || [];

    const colorMap = { '数学':'#3B82F6','语文':'#EF4444','英语':'#10B981','物理':'#8B5CF6','化学':'#F59E0B','生物':'#10B981','思想政治':'#EF4444','历史':'#F59E0B','地理':'#3B82F6','综合':'#8B5CF6' };
    const masteryTxt = function(k) {
        const pct = Math.round((k.mastery_rate || 0) * 100);
        return pct;
    };

    container.innerHTML =
        '<div class="row"><div class="card" style="flex:1;">' +
            '<div class="card-title"><i class="fas fa-bullseye" style="color:#EF4444;margin-right:6px;"></i>高提分空间薄弱点（点击进入专项训练）</div>' +
            (arr.length ? '<div style="display:flex;flex-direction:column;gap:10px;">' + arr.map(function(k, idx) {
                const pct = masteryTxt(k);
                const color = colorMap[k.subject] || '#3B82F6';
                return '<div onclick="showToast(\'进入 ' + k.name + ' 专项训练\',\'success\');switchPage(\'training\');" style="padding:12px 14px;background:#F9FAFB;border-radius:12px;cursor:pointer;display:flex;gap:12px;align-items:flex-start;transition:all .15s;" onmouseover="this.style.background=\'#EFF6FF\';this.style.boxShadow=\'0 2px 6px rgba(59,130,246,0.1)\';" onmouseout="this.style.background=\'#F9FAFB\';this.style.boxShadow=\'none\';">' +
                    '<div style="width:34px;height:34px;border-radius:10px;background:' + color + ';color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;flex-shrink:0;">' + (idx+1) + '</div>' +
                    '<div style="flex:1;min-width:0;">' +
                        '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px;">' +
                            '<span class="tag ' + tagClassFor(k.subject) + '">' + k.subject + '</span>' +
                            '<b style="font-size:14px;">' + k.name + '</b>' +
                        '</div>' +
                        (k.description ? '<div style="font-size:12px;color:#6B7280;line-height:1.6;margin-bottom:6px;">' + k.description + '</div>' : '') +
                        '<div style="display:flex;gap:16px;flex-wrap:wrap;font-size:12px;">' +
                            '<span>掌握率 <b style="color:' + (pct<40?'#EF4444':pct<60?'#F59E0B':'#10B981') + ';">' + pct + '%</b></span>' +
                            '<span>难度 <b>' + ['简单','基础','中等','困难','压轴'][Math.min(4, Math.max(0, (k.difficulty||3)-1))] + '</b></span>' +
                            '<span>提分空间 <b style="color:#F59E0B;">+' + (k.score_gain || 0) + ' 分</b></span>' +
                            '<span>优先级 <b style="color:' + (k.priority==='high'?'#EF4444':k.priority==='mid'?'#F59E0B':'#10B981') + ';">' + ({high:'高',mid:'中',low:'低'}[k.priority] || '中') + '</b></span>' +
                        '</div>' +
                        '<div style="height:8px;background:#E5E7EB;border-radius:4px;margin-top:8px;overflow:hidden;">' +
                            '<div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,' + color + ',#6D28D9);"></div>' +
                        '</div>' +
                    '</div>' +
                    '<i class="fas fa-chevron-right" style="color:#9CA3AF;font-size:11px;padding-top:12px;"></i>' +
                '</div>';
            }).join('') + '</div>' : '<div style="color:#9CA3AF;padding:30px;text-align:center;">暂无薄弱点</div>') +
        '</div></div>' +
        '<div class="row"><div class="card" style="flex:1;">' +
            '<div class="card-title"><i class="fas fa-layer-group" style="color:#8B5CF6;margin-right:6px;"></i>按学科薄弱分布</div>' +
            (weakest.length ? weakest.map(function(w) {
                return '<div style="margin-bottom:10px;">' +
                    '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">' +
                        '<span><b>' + w.subject + '</b></span>' +
                        '<span>当前 ' + w.current + '% · 差距 <b style="color:#F59E0B;">' + w.gap + '%</b></span>' +
                    '</div>' +
                    '<div style="height:10px;background:#F3F4F6;border-radius:5px;overflow:hidden;"><div style="height:100%;width:' + w.current + '%;background:linear-gradient(90deg,' + w.color + ',#6D28D9);border-radius:5px;"></div></div>' +
                '</div>';
            }).join('') : '<div style="color:#9CA3AF;padding:20px;text-align:center;">暂无数据</div>') +
        '</div></div>';
}

async function renderAnalysisLoss(container) {
    const days = window._analysisDays || 7;
    const [loss, answerStats] = await Promise.all([
        api.getLossAnalysis(days, 12),
        api.getAnswerStats(days)
    ]);
    // 云端静态环境回退：API 失败时使用默认数据
    const _d = getAnalysisDefaults();
    const _loss = loss || _d.loss;
    const _answerStats = answerStats || _d.answerStats;
    const totalWrong = (_loss && _loss.total_wrong) || 0;
    const points = (_loss && _loss.top_loss_points) || [];
    const subjects = (_loss && _loss.subjects) || [];
    const totalAns = (_answerStats && _answerStats.total) || 0;
    const ansRate = totalAns > 0 ? Math.round((totalAns - totalWrong) / totalAns * 100) : 0;
    const topType = _loss && _loss.top_wrong_type;
    const topDiff = _loss && _loss.top_wrong_difficulty;

    container.innerHTML =
        '<div class="stats-grid" style="margin-bottom:14px;">' +
            '<div class="stat-item"><div class="stat-num">' + totalWrong + '</div><div class="stat-label">错题数（近' + days + '天）</div></div>' +
            '<div class="stat-item"><div class="stat-num">' + ansRate + '%</div><div class="stat-label">整体正确率</div></div>' +
            '<div class="stat-item"><div class="stat-num">' + (topDiff ? topDiff.label : '—') + '</div><div class="stat-label">高频错难度档' + (topDiff ? '（' + topDiff.count + '题）' : '') + '</div></div>' +
            '<div class="stat-item"><div class="stat-num">' + (topType ? topType.type : '—') + '</div><div class="stat-label">高频错题型' + (topType ? '（' + topType.count + '题）' : '') + '</div></div>' +
        '</div>' +
        '<div class="row"><div class="card" style="flex:1;">' +
            '<div class="card-title"><i class="fas fa-map-pin" style="color:#EF4444;margin-right:6px;"></i>错题知识板块 TOP</div>' +
            (points.length ? '<div style="display:flex;flex-direction:column;gap:10px;">' + points.map(function(p) {
                const colorMap = { '数学':'#3B82F6','语文':'#EF4444','英语':'#10B981','物理':'#8B5CF6','化学':'#F59E0B','生物':'#10B981','思想政治':'#EF4444','历史':'#F59E0B','地理':'#3B82F6','综合':'#8B5CF6' };
                const color = colorMap[p.subject] || '#8B5CF6';
                return '<div style="display:flex;gap:10px;align-items:center;">' +
                    '<span class="tag ' + tagClassFor(p.subject) + '" style="flex-shrink:0;">' + p.subject + '</span>' +
                    '<div style="flex:1;min-width:0;">' +
                        '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">' +
                            '<b style="min-width:0;">' + p.name + '</b>' +
                            '<span style="margin-left:8px;"><b>' + p.count + '</b> 题 · ' + p.percent + '%</span>' +
                        '</div>' +
                        '<div style="height:8px;background:#F3F4F6;border-radius:4px;overflow:hidden;"><div style="height:100%;width:' + p.percent + '%;background:' + color + ';"></div></div>' +
                    '</div></div>';
            }).join('') + '</div>' : '<div style="color:#9CA3AF;padding:30px;text-align:center;">暂无错题数据</div>') +
        '</div></div>' +
        '<div class="row"><div class="card" style="flex:1;">' +
            '<div class="card-title"><i class="fas fa-chart-pie" style="color:#8B5CF6;margin-right:6px;"></i>按学科错题占比</div>' +
            (subjects.length ? '<div style="display:flex;flex-direction:column;gap:10px;">' + subjects.map(function(s) {
                const colorMap = { '数学':'#3B82F6','语文':'#EF4444','英语':'#10B981','物理':'#8B5CF6','化学':'#F59E0B','生物':'#10B981','思想政治':'#EF4444','历史':'#F59E0B','地理':'#3B82F6','综合':'#8B5CF6' };
                const color = colorMap[s.subject] || '#8B5CF6';
                return '<div>' +
                    '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">' +
                        '<span><b>' + s.subject + '</b></span>' +
                        '<span>' + s.wrong_count + ' 题 · ' + s.percent + '%</span>' +
                    '</div>' +
                    '<div style="height:10px;background:#F3F4F6;border-radius:5px;overflow:hidden;"><div style="height:100%;width:' + s.percent + '%;background:linear-gradient(90deg,' + color + ',#6D28D9);border-radius:5px;"></div></div>' +
                '</div>';
            }).join('') + '</div>' : '<div style="color:#9CA3AF;padding:20px;text-align:center;">暂无学科分布</div>') +
        '</div></div>' +
        '<div class="row"><div class="card" style="flex:1;background:#FFF7ED;border:1px solid #FED7AA;">' +
            '<div class="card-title"><i class="fas fa-magic" style="color:#F59E0B;margin-right:6px;"></i>AI 归因分析与建议</div>' +
            '<div style="font-size:13px;line-height:1.9;color:#7C2D12;">' +
                (totalWrong === 0 ? '🎉 近 ' + days + ' 天无错题，继续保持！' :
                    '<div>• 共出现 <b>' + totalWrong + '</b> 道错题，覆盖 <b>' + points.length + '</b> 个薄弱知识板块。</div>' +
                    (topType ? '<div>• 最常错题型：<b>' + topType.type + '</b>（' + topType.count + ' 题），建议系统复习该题型解题模板。</div>' : '') +
                    (topDiff ? '<div>• 最常错难度：<b>' + topDiff.label + '</b>（' + topDiff.count + ' 题），可适当减少该难度题量，先巩固基础。</div>' : '') +
                    (points[0] ? '<div>• 首要突破：<b>' + points[0].subject + ' · ' + points[0].name + '</b>，建议安排 2 小时专题训练。</div>' : '') +
                    '<div><button class="btn-primary" style="height:36px;margin-top:10px;padding:0 18px;border-radius:18px;" onclick="showToast(\'已生成错题相似题训练\',\'success\');switchPage(\'training\');"><i class="fas fa-dumbbell"></i> 开始错题专项训练</button></div>') +
            '</div></div></div>';
}

async function renderAnalysisReport(container) {
    const days = window._analysisDays || 7;
    const [report, scoreTrend, predictScore, predictRank] = await Promise.all([
        api.getPredictReport(),
        api.getPredictScoreTrend(Math.max(60, days * 2)).catch(() => null),
        api.getPredictScore().catch(() => null),
        api.getPredictRank().catch(() => null)
    ]);
    // 云端静态环境回退：API 失败时使用默认数据
    const _d = getAnalysisDefaults();
    const _report = report || _d.report;
    const _scoreTrend = scoreTrend || _d.scoreTrend;
    const _predictScore = predictScore || _d.predictScore;
    const _predictRank = predictRank || _d.predictRank;
    const weakAdvice = (_report && _report.weak_advice) || [];
    const subjectScores = (_report && _report.subject_scores) || [];
    const prob = (_report && _report.probability) || (_predictRank && _predictRank.probability) || {};

    container.innerHTML =
        '<div class="row"><div class="card" style="flex:1;background:linear-gradient(135deg,#3B82F6,#1D4ED8);color:white;">' +
            '<div style="display:flex;gap:14px;align-items:center;">' +
                '<div style="width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
                    '<i class="fas fa-user-graduate" style="font-size:26px;"></i></div>' +
                '<div style="flex:1;">' +
                    '<div style="font-size:18px;font-weight:800;">AI 高考预测报告</div>' +
                    '<div style="font-size:12px;opacity:0.9;margin-top:2px;">' +
                        (_report && _report.model ? '模型：' + _report.model : '') +
                        (_report && _report.confidence ? ' · 置信度 ' + _report.confidence + '%' : '') +
                        (_report && _report.days_to_exam != null ? ' · 高考 ' + _report.days_to_exam + ' 天' : '') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="stats-grid" style="margin-top:14px;">' +
                '<div class="stat-item-light"><div class="stat-num">' + ((_report && _report.current_score != null) ? _report.current_score : (_predictScore && _predictScore.current_predicted != null ? _predictScore.current_predicted : '—')) + '</div><div class="stat-label">当前分数</div></div>' +
                '<div class="stat-item-light"><div class="stat-num">' + ((_report && _report.predicted_score != null) ? _report.predicted_score : (_predictScore && _predictScore.final_predicted != null ? _predictScore.final_predicted : '—')) + '</div><div class="stat-label">AI 预测分</div></div>' +
                '<div class="stat-item-light"><div class="stat-num">' + ((_report && _report.target_score != null) ? _report.target_score : '—') + '</div><div class="stat-label">目标分</div></div>' +
                '<div class="stat-item-light"><div class="stat-num">' + ((_predictRank && _predictRank.rank != null) ? _predictRank.rank : (_report && _report.rank != null ? _report.rank : '—')) + '</div><div class="stat-label">' + ((_predictRank && _predictRank.province) ? _predictRank.province : (_report && _report.province ? _report.province : '全省')) + '预测排名</div></div>' +
            '</div>' +
        '</div></div>' +
        '<div class="row"><div class="card" style="flex:1;">' +
            '<div class="card-title">成绩趋势 & 高考目标</div>' +
            '<div style="height:240px;"><canvas id="analysisReportChart"></canvas></div>' +
        '</div></div>' +
        '<div class="row"><div class="card" style="flex:1;">' +
            '<div class="card-title"><i class="fas fa-book-open" style="color:#3B82F6;margin-right:6px;"></i>各科分数拆解</div>' +
            (subjectScores.length ? subjectScores.map(function(s) {
                const max = s.max_score || 100;
                const pct = Math.round((s.score / max) * 100);
                const color = pct >= 85 ? '#10B981' : pct >= 60 ? '#F59E0B' : '#EF4444';
                return '<div style="margin-bottom:10px;">' +
                    '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">' +
                        '<span><b>' + s.subject + '</b></span>' +
                        '<span><b style="color:' + color + ';">' + s.score + '</b> / ' + max + ' 分</span>' +
                    '</div>' +
                    '<div style="height:10px;background:#F3F4F6;border-radius:5px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,#3B82F6,#6D28D9);border-radius:5px;"></div></div>' +
                '</div>';
            }).join('') : '<div style="color:#9CA3AF;padding:20px;text-align:center;">暂无数据</div>') +
        '</div></div>' +
        '<div class="row"><div class="card" style="flex:1;">' +
            '<div class="card-title"><i class="fas fa-chart-pie" style="color:#F59E0B;margin-right:6px;"></i>录取概率 & 分差</div>' +
            (Object.keys(prob).length ? '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">' +
                [['yiben','一本',   '#10B981'],['p211','211 院校','#F59E0B'],['p985','985 院校','#8B5CF6']].map(function(row){
                    const v = prob[row[0]] != null ? prob[row[0]] : '—';
                    const pctNum = typeof v === 'number' ? v : 0;
                    return '<div style="padding:14px;border-radius:12px;background:' + row[2] + '11;border:1px solid ' + row[2] + '33;text-align:center;">' +
                        '<div style="font-size:22px;font-weight:800;color:' + row[2] + ';">' + v + '%</div>' +
                        '<div style="font-size:12px;color:#374151;margin-top:2px;">' + row[1] + '录取概率</div>' +
                        '<div style="margin-top:10px;height:8px;background:white;border-radius:4px;overflow:hidden;"><div style="height:100%;width:' + pctNum + '%;background:' + row[2] + ';"></div></div>' +
                    '</div>';
                }).join('') + '</div>' +
                (_report && _report.yiben_line_diff != null ?
                    '<div style="margin-top:12px;padding:10px 14px;border-radius:10px;background:' + (_report.yiben_line_diff>=0?'#ECFDF5':'#FEF2F2') + ';color:' + (_report.yiben_line_diff>=0?'#065F46':'#991B1B') + ';font-size:13px;font-weight:600;">' +
                        '📘 距一本线 ' + (_report.yiben_line_diff>=0?'超 ':'差 ') + Math.abs(_report.yiben_line_diff) + ' 分' +
                    '</div>' : '') : '<div style="color:#9CA3AF;padding:20px;text-align:center;">暂无概率数据</div>') +
        '</div></div>' +
        '<div class="row"><div class="card" style="flex:1;background:#EFF6FF;border:1px solid #DBEAFE;">' +
            '<div class="card-title"><i class="fas fa-lightbulb" style="color:#3B82F6;margin-right:6px;"></i>AI 提分建议（薄弱点 Top3）</div>' +
            (weakAdvice.length ? '<ol style="padding-left:18px;margin:0;">' + weakAdvice.map(function(a) {
                return '<li style="margin-bottom:8px;font-size:13px;line-height:1.8;color:#1E3A8A;">' + a + '</li>';
            }).join('') + '</ol>' : '<div style="color:#6B7280;font-size:13px;">暂无建议</div>') +
            '<div style="margin-top:10px;">' +
                '<button class="btn-primary" style="height:38px;padding:0 16px;border-radius:19px;font-size:13px;" onclick="showToast(\'已生成专属提升方案并加入学习计划\',\'success\');switchPage(\'plan\');"><i class="fas fa-magic"></i> 生成 AI 学习计划</button>' +
            '</div></div></div>';

    // 绘制报告里的成绩趋势图
    if (typeof Chart !== 'undefined' && _scoreTrend && _scoreTrend.labels) {
        const ctx = document.getElementById('analysisReportChart');
        if (ctx) {
            const target = _scoreTrend.target_score;
            const yiben = _scoreTrend.yiben_line || 520;
            registerAnalysisChart('report', new Chart(ctx, {
                type: 'line',
                data: {
                    labels: _scoreTrend.labels,
                    datasets: [
                        { label:'真实分', data: _scoreTrend.history, borderColor:'#3B82F6', backgroundColor:'rgba(59,130,246,0.15)',
                            borderWidth:2, tension:0.3, fill:true, pointRadius:1 },
                        { label:'预测分', data: _scoreTrend.predict, borderColor:'#F59E0B', backgroundColor:'rgba(245,158,11,0.1)',
                            borderDash:[6,4], borderWidth:2, tension:0.3, fill:true, pointRadius:1, spanGaps:false }
                    ]
                },
                options: {
                    responsive:true, maintainAspectRatio:false,
                    plugins: { legend: { labels:{ boxWidth:12, font:{size:11}, color:'#6B7280' } },
                              tooltip:{ callbacks:{ label:function(c){ return c.dataset.label + ': ' + (c.parsed.y ?? '—') + ' 分'; } } } },
                    scales: { x:{ grid:{display:false}, ticks:{maxTicksLimit:10,font:{size:10},color:'#6B7280'} },
                              y:{ grid:{color:'#F3F4F6'}, ticks:{color:'#6B7280'}, suggestedMin: 500, suggestedMax: (target||680)+20 } }
                },
                plugins: [{
                    id: 'reportTargetLine',
                    afterDraw: function(chart) {
                        const y = chart.scales.y; const x = chart.scales.x; if(!y||!x) return;
                        const draw = function(val, color, label, right) {
                            if (val < y.min || val > y.max) return;
                            const px = y.getPixelForValue(val); const c2 = chart.ctx; c2.save();
                            c2.strokeStyle = color; c2.lineWidth = 1.5; c2.setLineDash([4,4]);
                            c2.beginPath(); c2.moveTo(x.left, px); c2.lineTo(x.right, px); c2.stroke(); c2.setLineDash([]);
                            c2.fillStyle = color; c2.font = 'bold 11px sans-serif'; c2.textBaseline = 'bottom';
                            c2.textAlign = right ? 'right' : 'left';
                            c2.fillText(label + ' ' + val + '分', right ? x.right - 4 : x.left + 4, px - 2); c2.restore();
                        };
                        draw(target, '#EF4444', '🎯 目标', true); draw(yiben, '#10B981', '📘 一本线', false);
                    }
                }]
            }));
        }
    }
}

async function renderAnalysisPage(container) {
    // 初始化/重置分段周期 & Tab
    window._analysisDays = window._analysisDays || 7;
    window._analysisTab = window._analysisTab || 'overview';
    window._analysisSubject = window._analysisSubject || '全部';
    // 预先销毁可能残留的旧图表（避免再次进入页面 canvas 报错）
    Object.keys(window._analysisCharts || {}).forEach(destroyAnalysisChart);
    const periodNames = Object.keys(ANALYSIS_PERIODS);
    const activeIndex = Math.max(0, periodNames.findIndex(function(n){ return ANALYSIS_PERIODS[n] === window._analysisDays; }));

    container.innerHTML =
        '<div class="page-header"><h2><i class="fas fa-chart-bar"></i> AI学情分析</h2><p>基于你的学习记录动态分析，支持按时间范围、学科筛选切换查看</p></div>' +
        // 周期分段
        '<div style="display:flex;background:#F3F4F6;border-radius:10px;padding:3px;margin-bottom:14px;">' +
            periodNames.map(function(name, idx) {
                const active = idx === activeIndex;
                return '<div class="analysis-period-item' + (active?' active':'') + '" onclick="window.switchAnalysisPeriod(this)"' +
                    ' style="flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;' +
                    (active ? 'background:white;color:#3B82F6;box-shadow:0 1px 3px rgba(0,0,0,0.1);' : 'color:#6B7280;') + '">' + name + '</div>';
            }).join('') +
        '</div>' +
        // 子 Tab 栏
        '<div class="row" style="margin-bottom:14px;"><div class="card" style="flex:1;padding:0;overflow:hidden;">' +
            '<div style="display:flex;overflow-x:auto;border-bottom:1px solid #E5E7EB;">' +
                ANALYSIS_TABS.map(function(t, idx) {
                    const active = (t.key === window._analysisTab);
                    return '<div class="analysis-subtab" data-tab="' + t.key + '" onclick="window.switchAnalysisTab(\'' + t.key + '\')"' +
                        ' style="flex:1;min-width:78px;text-align:center;padding:12px 6px;cursor:pointer;font-size:13px;' +
                        ' color:' + (active?'#3B82F6':'#6B7280') + ';border-bottom:' + (active?'2px solid #3B82F6':'2px solid transparent') + ';' +
                        ' font-weight:' + (active?'700':'500') + ';background:' + (active?'#EFF6FF':'transparent') + ';transition:all .2s;white-space:nowrap;">' +
                        '<i class="fas ' + t.icon + '" style="margin-right:4px;"></i>' + t.name + '</div>';
                }).join('') +
            '</div>' +
            '<div id="analysis-tab-content" style="padding:16px;min-height:300px;">' +
                '<div style="text-align:center;padding:60px 20px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:28px;margin-bottom:14px;display:block;"></i><div style="font-size:13px;">分析你的学习数据…</div></div>' +
            '</div>' +
        '</div></div>';
    // 触发一次默认 Tab 数据加载
    loadAnalysisTab(window._analysisTab);
}

// 安装全局交互函数（供 HTML onclick 调用）
(function installAnalysisGlobals() {
    if (typeof window === 'undefined') return;
    window.switchAnalysisPeriod = window.switchAnalysisPeriod || function() {};
    window.switchAnalysisTab = window.switchAnalysisTab || function() {};
    window.switchAnalysisSubject = window.switchAnalysisSubject || function() {};
    window.loadAnalysisTab = loadAnalysisTab;
})();

// ========== AI学习计划（同步自原型 home-plan 子模块，完整周计划实现）==========
// 学科 -> 标签颜色映射（与后端 week-plan 接口一致）
const WEEK_PLAN_SUBJECT_COLOR = {
    '数学': '#3B82F6', '语文': '#EF4444', '英语': '#10B981',
    '物理': '#8B5CF6', '化学': '#F59E0B', '生物': '#10B981',
    '思想政治': '#EF4444', '历史': '#F59E0B', '地理': '#3B82F6', '综合': '#8B5CF6'
};
// 内联学科标签（不依赖原型 proto-tag CSS）
function weekPlanTag(subject, color) {
    const c = color || WEEK_PLAN_SUBJECT_COLOR[subject] || '#3B82F6';
    return '<span style="display:inline-block;padding:1px 7px;border-radius:6px;font-size:11px;font-weight:600;color:white;background:' + c + ';">' + subject + '</span>';
}
// 当前分段范围（本周/下周/本月）全局状态
window._currentPlanRange = window._currentPlanRange || 'this_week';
// 分段控制器切换 → 切换激活态 + 加载对应范围数据
function switchSegment(el) {
    if (!el || !el.parentElement) return;
    el.parentElement.querySelectorAll('.wp-segment-item').forEach(function (s) { s.classList.remove('active'); });
    el.classList.add('active');
    // 原型端使用 proto-segment-item，主应用用 wp-segment-item；应用内联样式激活态需要同步写入背景/阴影/颜色
    const parent = el.parentElement;
    parent.querySelectorAll('.wp-segment-item, .proto-segment-item').forEach(function (s) {
        if (s.classList.contains('active')) {
            s.style.background = 'white';
            s.style.color = '#3B82F6';
            s.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        } else {
            s.style.background = 'transparent';
            s.style.color = '#6B7280';
            s.style.boxShadow = 'none';
        }
    });
    const text = (el.textContent || '').trim();
    const rangeMap = { '本周': 'this_week', '下周': 'next_week', '本月': 'this_month' };
    const newRange = rangeMap[text];
    if (!newRange) return;
    window._currentPlanRange = newRange;
    loadSegmentPlan(newRange);
}
// 生成默认学习计划数据（云端静态环境回退用）
function getDefaultWeekPlan(range) {
    var dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    var todayIdx = new Date().getDay();
    todayIdx = (todayIdx === 0) ? 6 : todayIdx - 1;
    var dateBase = new Date();
    var taskPool = [
        { subject: '数学', point: '圆锥曲线综合', time: 45, difficulty: '★★★★', type: '专项训练' },
        { subject: '数学', point: '导数应用专题', time: 40, difficulty: '★★★★', type: '专项训练' },
        { subject: '物理', point: '电磁感应综合', time: 35, difficulty: '★★★★', type: '专项训练' },
        { subject: '物理', point: '力学综合分析', time: 30, difficulty: '★★★', type: '专项训练' },
        { subject: '化学', point: '有机推断题型', time: 30, difficulty: '★★★★', type: '专项训练' },
        { subject: '化学', point: '化学平衡计算', time: 25, difficulty: '★★★', type: '专项训练' },
        { subject: '英语', point: '完形填空技巧', time: 25, difficulty: '★★★', type: '专项训练' },
        { subject: '英语', point: '书面表达高级句式', time: 30, difficulty: '★★★★', type: '专项训练' },
        { subject: '语文', point: '古诗文鉴赏', time: 32, difficulty: '★★★', type: '专项训练' },
        { subject: '语文', point: '现代文阅读理解', time: 35, difficulty: '★★★', type: '专项训练' },
        { subject: '数学', point: '数列求和方法', time: 40, difficulty: '★★★', type: '专项训练' },
        { subject: '物理', point: '动量与冲量', time: 28, difficulty: '★★★', type: '专项训练' },
        { subject: '化学', point: '电化学原理', time: 25, difficulty: '★★★', type: '专项训练' },
        { subject: '英语', point: '语法填空', time: 20, difficulty: '★★', type: '专项训练' },
        { subject: '数学', point: '立体几何向量法', time: 35, difficulty: '★★★★', type: '专项训练' }
    ];
    var days = [];
    var numDays = (range === 'this_month') ? 30 : 7;
    var startOffset = (range === 'next_week') ? 7 : 0;
    for (var i = 0; i < numDays; i++) {
        var dayIdx = i % 7;
        var dt = new Date(dateBase.getTime() + (startOffset + i - todayIdx) * 86400000);
        var dayObj = {
            day: dayNames[dayIdx],
            date: dt.toISOString().slice(0, 10),
            isToday: (dayIdx === todayIdx && range !== 'next_week'),
            tasks: []
        };
        var numTasks = 1 + (i % 3);
        var shuffled = taskPool.slice();
        for (var j = shuffled.length - 1; j > 0; j--) {
            var k = Math.floor(Math.random() * (j + 1));
            var tmp = shuffled[j]; shuffled[j] = shuffled[k]; shuffled[k] = tmp;
        }
        for (var t = 0; t < numTasks; t++) {
            var task = shuffled[t];
            dayObj.tasks.push({
                subject: task.subject,
                point: task.point,
                time: task.time,
                difficulty: task.difficulty,
                type: task.type,
                status: 'pending'
            });
        }
        if (range === 'this_month') {
            dayObj.week_group = Math.floor(i / 7);
            dayObj.week_group_name = '第' + (dayObj.week_group + 1) + '周';
        }
        days.push(dayObj);
    }
    return days;
}
// 加载指定范围的计划（供 switchSegment / renderPlanPage / executeReplan 复用）
function loadSegmentPlan(range, shuffle) {
    const listContainer = document.getElementById('week-plan-list');
    const summaryContainer = document.getElementById('week-plan-summary');
    if (!listContainer) return;
    listContainer.innerHTML =
        '<div class="card" style="margin:0 0 12px;text-align:center;padding:40px;color:#9CA3AF;">' +
        '<i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i>' +
        '<div style="font-size:13px;">AI正在生成学习计划…</div></div>';
    if (summaryContainer) {
        summaryContainer.innerHTML =
            '<div style="font-size:15px;font-weight:700;">AI智能学习计划</div>' +
            '<div style="font-size:12px;opacity:0.85;margin-top:2px;">分析薄弱点中…</div>';
    }
    if (typeof api === 'undefined' || !api.getWeekPlan) {
        listContainer.innerHTML = '<div class="card" style="margin:0 0 12px;text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">API不可用</div></div>';
        return;
    }
    api.getWeekPlan(!!shuffle, range).then(function (data) {
        // 如果当前DOM已不存在（页面切换了），静默退出
        if (!document.getElementById('week-plan-list')) return;
        // 云端静态环境回退：API 失败时使用默认学习计划数据
        if (!data) {
            var defaultDays = getDefaultWeekPlan(range);
            if (defaultDays && defaultDays.length) {
                var todayIdx2 = new Date().getDay();
                todayIdx2 = (todayIdx2 === 0) ? 6 : todayIdx2 - 1;
                var dayNames2 = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
                var todayStr2 = dayNames2[todayIdx2];
                var dateBase2 = new Date();
                defaultDays.forEach(function (d, i) {
                    if (d.isToday === undefined) d.isToday = (d.day === todayStr2);
                    if (!d.date) {
                        var dt2 = new Date(dateBase2.getTime() - (todayIdx2 - i) * 86400000);
                        d.date = dt2.toISOString().slice(0, 10);
                    }
                });
                var list2 = document.getElementById('week-plan-list');
                if (list2) list2.innerHTML = renderWeekPlanGrouped(defaultDays, range);
                var summary2 = document.getElementById('week-plan-summary');
                if (summary2) {
                    var totalTasks2 = defaultDays.reduce(function (s, d) { return s + (d.tasks ? d.tasks.length : 0); }, 0);
                    summary2.innerHTML = '<div style="font-size:15px;font-weight:700;">AI智能学习计划</div>' +
                        '<div style="font-size:12px;opacity:0.85;margin-top:2px;">基于薄弱点分析 · ' + (range === 'this_week' ? '本周' : range === 'next_week' ? '下周' : '本月') + '共' + totalTasks2 + '个任务</div>';
                }
                if (shuffle) showToast('AI已为你重新生成学习计划');
                return;
            }
        }
        // 兼容后端两种字段名：days（新） 或 week_plan（旧）
        var planDays = (data && data.days) || (data && data.week_plan) || [];
        if (data && planDays.length) {
            // 补充今日标记和日期（后端可能未返回）
            var todayIdx = new Date().getDay();
            todayIdx = (todayIdx === 0) ? 6 : todayIdx - 1; // 周一=0 ... 周日=6
            var dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            var todayStr = dayNames[todayIdx];
            var dateBase = new Date();
            planDays.forEach(function (d, i) {
                if (d.isToday === undefined) d.isToday = (d.day === todayStr);
                if (!d.date) {
                    var dt = new Date(dateBase.getTime() - (todayIdx - i) * 86400000);
                    d.date = dt.toISOString().slice(0, 10);
                }
                // 兼容任务的 priority 字段（后端有，前端不用）
            });
            const list = document.getElementById('week-plan-list');
            list.innerHTML = renderWeekPlanGrouped(planDays, range);
            fillWeekPlanSummary(data, planDays);
        } else {
            document.getElementById('week-plan-list').innerHTML =
                '<div class="card" style="margin:0 0 12px;text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">暂无学习数据</div></div>';
        }
        if (shuffle) showToast('AI已为你重新生成学习计划');
    }).catch(function () {
        // 云端静态环境回退：catch 时使用默认学习计划
        var defaultDays = getDefaultWeekPlan(range);
        if (defaultDays && defaultDays.length) {
            var todayIdx3 = new Date().getDay();
            todayIdx3 = (todayIdx3 === 0) ? 6 : todayIdx3 - 1;
            var dayNames3 = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            var todayStr3 = dayNames3[todayIdx3];
            var dateBase3 = new Date();
            defaultDays.forEach(function (d, i) {
                if (d.isToday === undefined) d.isToday = (d.day === todayStr3);
                if (!d.date) {
                    var dt3 = new Date(dateBase3.getTime() - (todayIdx3 - i) * 86400000);
                    d.date = dt3.toISOString().slice(0, 10);
                }
            });
            var list3 = document.getElementById('week-plan-list');
            if (list3) list3.innerHTML = renderWeekPlanGrouped(defaultDays, range);
            var summary3 = document.getElementById('week-plan-summary');
            if (summary3) {
                var totalTasks3 = defaultDays.reduce(function (s, d) { return s + (d.tasks ? d.tasks.length : 0); }, 0);
                summary3.innerHTML = '<div style="font-size:15px;font-weight:700;">AI智能学习计划</div>' +
                    '<div style="font-size:12px;opacity:0.85;margin-top:2px;">基于薄弱点分析 · ' + (range === 'this_week' ? '本周' : range === 'next_week' ? '下周' : '本月') + '共' + totalTasks3 + '个任务</div>';
            }
            if (shuffle) showToast('AI已为你重新生成学习计划');
            return;
        }
        const lc = document.getElementById('week-plan-list');
        if (lc) lc.innerHTML = '<div class="card" style="margin:0 0 12px;text-align:center;padding:40px;color:#EF4444;"><div style="font-size:13px;">加载失败，请稍后重试</div></div>';
        if (shuffle) showToast('重新规划失败，请稍后重试');
    });
}
// 渲染计划列表：本月视图按 week_group 插入分组标题；其他视图直接平铺
function renderWeekPlanGrouped(planDays, range) {
    const isMonth = (range === 'this_month') || planDays.some(function (d) { return d.week_group_name; });
    if (!isMonth) return planDays.map(function (d) { return renderWeekPlanDayCard(d); }).join('');
    // 本月视图：先按 week_group 分组
    const groups = {};
    planDays.forEach(function (d) {
        const g = typeof d.week_group === 'number' ? d.week_group : 0;
        if (!groups[g]) groups[g] = { name: d.week_group_name || ('第' + (g + 1) + '周'), days: [] };
        groups[g].days.push(d);
    });
    const keys = Object.keys(groups).sort(function (a, b) { return Number(a) - Number(b); });
    let html = '';
    keys.forEach(function (k) {
        const grp = groups[k];
        // 计算整周日期范围 (MM/DD ~ MM/DD)
        const firstDate = grp.days[0] && grp.days[0].date;
        const lastDate = grp.days[grp.days.length - 1] && grp.days[grp.days.length - 1].date;
        const dateRange = firstDate && lastDate ? '（' + firstDate + ' ~ ' + lastDate + '）' : '';
        html +=
            '<div style="margin:0 0 8px;padding:8px 12px;background:#EFF6FF;border-radius:8px;display:flex;align-items:center;justify-content:space-between;">' +
            '<div style="font-size:13px;font-weight:700;color:#1E40AF;"><i class="fas fa-calendar-week" style="margin-right:6px;"></i>' + grp.name + dateRange + '</div>' +
            '<div style="font-size:11px;color:#3B82F6;">' + grp.days.length + '天</div></div>';
        html += grp.days.map(function (d) { return renderWeekPlanDayCard(d); }).join('');
    });
    return html;
}
// 任务勾选（周计划任务卡片）
function toggleTask(el) {
    const isDone = el.classList.toggle('done');
    el.style.borderColor = isDone ? '#10B981' : '#D1D5DB';
    el.style.background = isDone ? '#10B981' : 'transparent';
    el.innerHTML = isDone ? '<i class="fas fa-check" style="color:white;font-size:10px;"></i>' : '';
    const text = el.parentElement && el.parentElement.querySelector('.task-name');
    if (text) {
        text.style.textDecoration = isDone ? 'line-through' : 'none';
        text.style.color = isDone ? '#9CA3AF' : '';
    }
    const row = el.parentElement;
    if (row) row.style.background = isDone ? '#F0FDF4' : '#F9FAFB';
}
// 任务详情弹窗（点击任务卡片触发，data-task-detail 承载 JSON）
window.openTaskDetailFromHomePlan = function (el) {
    if (!el) return;
    const raw = el.getAttribute('data-task-detail');
    if (!raw) { showToast('任务详情数据缺失'); return; }
    try {
        const t = JSON.parse(decodeURIComponent(raw));
        const subject = t.subject || '未知科目';
        const point = t.point || '未知知识点';
        openModal('任务详情',
            '<div style="padding:14px;font-size:13px;line-height:1.8;color:#374151;">' +
            '<b>' + subject + ' · ' + point + '</b><br><br>' +
            '<b>预计时间：</b>' + t.time + '<br>' +
            '<b>题目数量：</b>' + (t.questions_count || 8) + ' 道<br>' +
            '<b>当前状态：</b>' + (t.done
                ? '<span style="color:#10B981;font-weight:600;">已完成</span>'
                : '<span style="color:#F59E0B;font-weight:600;">待完成</span>') +
            '</div>');
    } catch (e) {
        showToast('任务详情解析失败');
    }
};
// 渲染单日计划卡片（供初次加载与重新规划复用）
function renderWeekPlanDayCard(d) {
    const totalMin = d.tasks.reduce((a, b) => a + parseInt(b.time), 0);
    const taskCards = d.tasks.map((t) => {
        const qCount = t.questions_count || 8;
        const detailJson = encodeURIComponent(JSON.stringify({
            subject: t.subject || '', point: t.point || '', time: t.time, questions_count: qCount, done: !!t.done
        }));
        return '<div data-task-detail="' + detailJson + '" style="display:flex;align-items:center;gap:10px;padding:10px;background:' + (t.done ? '#F0FDF4' : '#F9FAFB') + ';border-radius:10px;cursor:pointer;" onclick="window.openTaskDetailFromHomePlan(this)">' +
            '<div onclick="event.stopPropagation();window.toggleTask(this)" class="' + (t.done ? 'done' : '') + '" style="width:18px;height:18px;border-radius:50%;border:2px solid ' + (t.done ? '#10B981' : '#D1D5DB') + ';background:' + (t.done ? '#10B981' : 'transparent') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;">' +
            (t.done ? '<i class="fas fa-check" style="color:white;font-size:10px;"></i>' : '') + '</div>' +
            '<div class="task-name" style="flex:1;font-size:13px;' + (t.done ? 'text-decoration:line-through;color:#9CA3AF;' : '') + ';">' +
            weekPlanTag(t.subject, t.color) + '<span style="margin-left:6px;font-weight:600;">' + t.point + '</span></div>' +
            '<span style="font-size:11px;color:#6B7280;"><i class="far fa-clock"></i> ' + t.time + ' <i class="fas fa-chevron-right" style="margin-left:2px;font-size:9px;opacity:0.5;"></i></span>' +
            '</div>';
    }).join('');
    return '<div class="card" style="margin:0 0 12px;' + (d.isToday ? 'border-left:3px solid #3B82F6;' : '') + '">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
        '<div style="width:36px;height:36px;border-radius:10px;background:' + (d.isToday ? '#3B82F6' : '#F3F4F6') + ';color:' + (d.isToday ? 'white' : '#6B7280') + ';display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;line-height:1.1;">' + d.day + '</div>' +
        '<div><div style="font-size:14px;font-weight:700;">' + d.day + (d.isToday ? ' <span style="font-size:11px;color:#3B82F6;font-weight:400;">（今天）</span>' : '') + '</div>' +
        '<div style="font-size:11px;color:#9CA3AF;">' + d.date + ' · ' + d.tasks.length + '个任务</div></div></div>' +
        '<span style="font-size:11px;color:#6B7280;">共 ' + totalMin + 'min</span></div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;">' + taskCards + '</div></div>';
}
// 填充周计划头部摘要
function fillWeekPlanSummary(data, planDays) {
    const summaryContainer = document.getElementById('week-plan-summary');
    if (!summaryContainer) return;
    const rangeMap = { 'this_week': '本周', 'next_week': '下周', 'this_month': '本月' };
    const rangeLabel = (data && data.range_label) ? data.range_label : (rangeMap[data && data.range] || '本周');
    // 计算任务总数和完成数（兼容后端字段缺失情况）
    var totalTasks = (data && data.total_tasks) || 0;
    var doneTasks = (data && data.done_tasks) || 0;
    if (!totalTasks && planDays && planDays.length) {
        planDays.forEach(function (d) {
            (d.tasks || []).forEach(function (t) {
                totalTasks++;
                if (t.done) doneTasks++;
            });
        });
    }
    summaryContainer.innerHTML =
        '<div style="font-size:15px;font-weight:700;">AI智能学习计划</div>' +
        '<div style="font-size:12px;opacity:0.85;margin-top:2px;">基于薄弱点分析 · ' + rangeLabel + '共' + totalTasks + '个任务</div>';
    const parent = summaryContainer.parentElement;
    if (!parent) return;
    // 先移除旧徽章（重新规划/切换分段时会重建）
    const oldBadge = parent.querySelector('.done-badge');
    if (oldBadge) oldBadge.remove();
    const badge = document.createElement('div');
    badge.className = 'done-badge';
    badge.style.cssText = 'text-align:center;background:rgba(255,255,255,0.2);border-radius:10px;padding:6px 10px;';
    badge.innerHTML = '<div style="font-size:18px;font-weight:800;">' + doneTasks + '</div><div style="font-size:9px;">已完成</div>';
    parent.appendChild(badge);
}
// AI 重新规划：弹窗确认
function aiReplan() {
    openModal('AI重新规划',
        '<div style="text-align:center;padding:8px 0 12px;">' +
        '<div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#1D4ED8);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">' +
        '<i class="fas fa-robot" style="color:white;font-size:24px;"></i></div>' +
        '<div style="font-size:16px;font-weight:700;">AI正在重新分析你的学习数据</div>' +
        '<div style="font-size:12px;color:#9CA3AF;margin-top:4px;">基于最近7天答题记录与薄弱点变化</div></div>' +
        '<div style="background:#F9FAFB;border-radius:10px;padding:12px;font-size:12px;color:#6B7280;line-height:1.8;margin-bottom:14px;">' +
        '<div style="font-weight:600;color:#374151;margin-bottom:6px;"><i class="fas fa-cog"></i> AI规划中将：</div>' +
        '<div>• 重新评估各科薄弱知识点权重</div>' +
        '<div>• 优化每日任务时长分配</div>' +
        '<div>• 优先安排高提分空间的内容</div>' +
        '<div>• 调整复习与练习的比例</div></div>' +
        '<button class="modal-btn primary" style="height:42px;border-radius:21px;width:100%;" onclick="window.executeReplan()">开始重新规划</button>');
}
// 执行重新规划：关闭弹窗 → 调用当前分段范围的 shuffle 加载
function executeReplan() {
    closeModal();
    const currentRange = window._currentPlanRange || 'this_week';
    // 使用 loadSegmentPlan 统一 loading 流程
    loadSegmentPlan(currentRange, true);
}
// 显式挂载 AI学习计划 全局交互函数到 window（确保 inline onclick 可调用，不受作用域包装影响）
(function installPlanGlobals() {
    if (typeof window === 'undefined') return;
    window.toggleTask = toggleTask;
    window.switchSegment = switchSegment;
    window.aiReplan = aiReplan;
    window.executeReplan = executeReplan;
    window.weekPlanTag = weekPlanTag;
    window.renderWeekPlanDayCard = renderWeekPlanDayCard;
    window.fillWeekPlanSummary = fillWeekPlanSummary;
    window.loadSegmentPlan = loadSegmentPlan;
    window.renderWeekPlanGrouped = renderWeekPlanGrouped;
    if (typeof window.openTaskDetailFromHomePlan === 'undefined') {
        window.openTaskDetailFromHomePlan = function (el) { }; // 占位，实际在上方已赋值
    }
})();
async function renderPlanPage(container) {
    // 初始化分段状态（默认 this_week，默认激活第一个分段 tab）
    window._currentPlanRange = 'this_week';
    container.innerHTML =
        '<div class="page-header"><h2><i class="fas fa-calendar-check"></i> AI学习计划</h2><p>AI根据你的薄弱点智能生成的专属学习计划</p></div>' +
        // AI生成说明（渐变卡片）
        '<div style="background:linear-gradient(135deg,#3B82F6,#1D4ED8);color:white;border-radius:14px;padding:16px;margin-bottom:14px;">' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
        '<div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
        '<i class="fas fa-robot" style="font-size:22px;"></i></div>' +
        '<div style="flex:1;" id="week-plan-summary">' +
        '<div style="font-size:15px;font-weight:700;">AI智能学习计划</div>' +
        '<div style="font-size:12px;opacity:0.85;margin-top:2px;">正在分析薄弱点生成计划…</div>' +
        '</div></div></div>' +
        // 分段控制器
        '<div style="display:flex;background:#F3F4F6;border-radius:10px;padding:3px;margin-bottom:14px;">' +
        ['本周', '下周', '本月'].map((s, i) =>
            '<div class="wp-segment-item' + (i === 0 ? ' active' : '') + '" onclick="window.switchSegment(this)" style="flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;' + (i === 0 ? 'background:white;color:#3B82F6;box-shadow:0 1px 3px rgba(0,0,0,0.1);' : 'color:#6B7280;') + '">' + s + '</div>'
        ).join('') + '</div>' +
        // 每日计划（动态加载）
        '<div id="week-plan-list">' +
        '<div class="card" style="margin:0 0 12px;text-align:center;padding:40px;color:#9CA3AF;">' +
        '<i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i>' +
        '<div style="font-size:13px;">AI正在生成学习计划…</div></div></div>' +
        // 重新规划按钮
        '<div style="position:sticky;bottom:0;background:white;border-top:1px solid #E5E7EB;padding:14px 0;margin:0 -16px -12px;text-align:center;">' +
        '<button class="btn-primary" style="height:46px;border-radius:23px;padding:0 32px;" onclick="window.aiReplan()"><i class="fas fa-magic"></i> 让AI重新规划</button></div>';
    // 异步加载本周学习计划（复用 loadSegmentPlan，与 switchSegment / executeReplan 链路一致）
    loadSegmentPlan('this_week', false);
}

async function renderKnowledgePage(container) {
    const kps = await api.getKnowledgePoints();
    const kpsArr = Array.isArray(kps) ? kps : (kps && kps.data) || [];
    const subjects = { '数学':'', '语文':'', '英语':'', '物理':'', '化学':'', '生物':'', '政治':'', '历史':'', '地理':'' };
    if (kpsArr.length) {
        kpsArr.forEach(k => {
            // 数据中"思想政治"对外展示为"政治"
            const displaySubject = k.subject === '思想政治' ? '政治' : k.subject;
            if (!(displaySubject in subjects)) return;
            subjects[displaySubject] += `<div class="kp-item">
                <div class="kp-name">${k.name}</div>
                <div class="kp-meta">
                    <span class="kp-difficulty">难度 ${k.difficulty}</span>
                    <span class="kp-mastery" style="color:${(k.mastery_rate*100)<40?'#EF4444':(k.mastery_rate*100)<60?'#F97316':'#10B981'}">掌握率 ${Math.round(k.mastery_rate*100)}%</span>
                </div>
                <div class="mastery-bar" style="margin-top:6px;"><div class="mastery-fill ${(k.mastery_rate*100)<40?'red':(k.mastery_rate*100)<60?'orange':'green'}" style="width:${Math.round(k.mastery_rate*100)}%"></div></div>
            </div>`;
        });
    }
    const subjectSection = (title, html) => html ? `<div class="knowledge-section"><div class="knowledge-section-title">${title}</div><div class="knowledge-grid">${html}</div></div>` : '';
    container.innerHTML = `
        <div class="page-header"><h2><i class="fas fa-project-diagram"></i> 知识图谱</h2><p>全面掌握高考9科考点，精准定位薄弱环节</p></div>
        ${subjectSection('数学', subjects['数学'])}
        ${subjectSection('语文', subjects['语文'])}
        ${subjectSection('英语', subjects['英语'])}
        ${subjectSection('物理', subjects['物理'])}
        ${subjectSection('化学', subjects['化学'])}
        ${subjectSection('生物', subjects['生物'])}
        ${subjectSection('政治', subjects['政治'])}
        ${subjectSection('历史', subjects['历史'])}
        ${subjectSection('地理', subjects['地理'])}
    `;
}

async function renderTrainingPage(container) {
    container.innerHTML = `
        <div class="page-header"><h2><i class="fas fa-dumbbell"></i> 智能训练</h2><p>AI根据你的薄弱点推荐针对性训练题目，覆盖高考全学科</p></div>
        <div class="row"><div class="card" style="flex:1;padding:0;overflow:hidden;">
            <div style="display:flex;overflow-x:auto;border-bottom:1px solid #E5E7EB;">
                ${[
                    {key:'real',name:'真题',icon:'fa-file-alt'},
                    {key:'mock',name:'模拟题',icon:'fa-copy'},
                    {key:'ai',name:'AI推荐题',icon:'fa-robot'},
                    {key:'mistake',name:'易错题',icon:'fa-exclamation-triangle'},
                    {key:'hot',name:'高频考点',icon:'fa-fire'}
                ].map((t,i)=>`
                    <div class="training-tab ${i===0?'active':''}" data-tab="${t.key}" onclick="switchTrainingTab('${t.key}')" style="flex:1;min-width:80px;text-align:center;padding:12px 8px;cursor:pointer;font-size:13px;color:${i===0?'#3B82F6':'#6B7280'};border-bottom:${i===0?'2px solid #3B82F6':'2px solid transparent'};font-weight:${i===0?'600':'400'};transition:all 0.2s;">
                        <i class="fas ${t.icon}" style="margin-right:4px;"></i>${t.name}
                    </div>
                `).join('')}
            </div>
            <div id="training-content" style="padding:16px;min-height:300px;">
                <div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">加载中…</div></div>
            </div>
        </div></div>
    `;
    // 默认加载第一个 tab
    loadTrainingTab('real');
}

// 切换智能训练子标签
window.switchTrainingTab = function(key) {
    document.querySelectorAll('.training-tab').forEach(t => {
        const active = t.dataset.tab === key;
        t.classList.toggle('active', active);
        t.style.color = active ? '#3B82F6' : '#6B7280';
        t.style.borderBottom = `2px solid ${active ? '#3B82F6' : 'transparent'}`;
        t.style.fontWeight = active ? '600' : '400';
    });
    loadTrainingTab(key);
};

// 加载各训练子标签数据（数据来自 /api/page-data/practice-*）
async function loadTrainingTab(key) {
    const content = document.getElementById('training-content');
    if (!content) return;
    content.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">加载中…</div></div>';
    const keyMap = { real:'practice-real-exam', mock:'practice-mock', ai:'practice-ai-recommend', mistake:'practice-mistakes', hot:'practice-hotpoints' };
    const dataKey = keyMap[key] || 'practice-real-exam';
    try {
        let resp = await fetch(`/api/page-data/${dataKey}`);
        if (!resp.ok) resp = await fetch(`/api/page-data/${dataKey}.json`);
        const json = await resp.json();
        const data = json.data || json;
        if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
            content.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">暂无数据</div></div>';
            return;
        }
        if (key === 'real') renderRealExamTab(content, data);
        else if (key === 'mock') renderMockTab(content, data);
        else if (key === 'ai') renderAITab(content, data);
        else if (key === 'mistake') renderMistakeTab(content, data);
        else if (key === 'hot') renderHotTab(content, data);
    } catch (e) {
        console.warn('loadTrainingTab 失败:', key, e);
        content.innerHTML = `<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败，请刷新重试</div></div>`;
    }
}

// 公共：构建题目详情弹窗 HTML
window.buildExamDetailHtml = function(e, extraMetaHtml) {
    if (!e) return '<div style="padding:15px;">题目数据加载失败</div>';
    let html = '<div style="padding:14px;max-height:60vh;overflow-y:auto;">';
    if (extraMetaHtml) html += `<div style="background:#F9FAFB;padding:10px 14px;border-radius:8px;margin-bottom:12px;font-size:12px;color:#374151;line-height:1.8;">${extraMetaHtml}</div>`;
    const q = e.question || e.q || '暂无题干';
    html += `<div style="font-size:14px;color:#111827;line-height:1.8;white-space:pre-wrap;word-break:break-word;margin-bottom:14px;">${q}</div>`;
    if (e.options && e.options.length) {
        html += '<div style="margin-bottom:14px;">';
        e.options.forEach(opt => { html += `<div style="background:#F9FAFB;border-radius:8px;padding:10px 12px;margin-bottom:6px;font-size:13px;color:#374151;">${opt}</div>`; });
        html += '</div>';
    }
    const ansId = 'ans-' + Math.random().toString(36).substr(2,9);
    const anaId = 'ana-' + Math.random().toString(36).substr(2,9);
    html += `<div style="display:flex;gap:8px;margin-bottom:14px;">
        <button onclick="(function(b){var a=document.getElementById('${ansId}');a.style.display=a.style.display==='none'?'block':'none';b.innerText=a.style.display==='block'?'隐藏答案':'查看答案';})(this);" style="flex:1;background:#10B981;color:white;border:none;padding:10px;border-radius:8px;font-size:13px;cursor:pointer;font-weight:600;"><i class="fas fa-check-circle"></i> 查看答案</button>
        <button onclick="(function(b){var a=document.getElementById('${anaId}');a.style.display=a.style.display==='none'?'block':'none';b.innerText=a.style.display==='block'?'隐藏解析':'查看解析';})(this);" style="flex:1;background:#3B82F6;color:white;border:none;padding:10px;border-radius:8px;font-size:13px;cursor:pointer;font-weight:600;"><i class="fas fa-lightbulb"></i> 查看解析</button>
    </div>`;
    html += `<div id="${ansId}" style="display:none;background:#F0FDF4;border-left:3px solid #10B981;padding:10px 12px;border-radius:0 8px 8px 0;font-size:13px;color:#065F46;line-height:1.7;white-space:pre-wrap;word-break:break-word;margin-bottom:10px;"><b>✅ 参考答案</b><br>${e.answer || '暂无答案'}</div>`;
    let ana = e.analysis || '暂无解析';
    if (e.error_reason) ana += `\n\n📌 <b>错误原因分析</b>\n${e.error_reason}`;
    html += `<div id="${anaId}" style="display:none;background:#FFFBEB;border-left:3px solid #F59E0B;padding:10px 12px;border-radius:0 8px 8px 0;font-size:13px;color:#92400E;line-height:1.7;white-space:pre-wrap;word-break:break-word;"><b>💡 详细解析</b><br>${ana}</div>`;
    html += '</div>';
    return html;
};

// Tab1：真题（含科目/年份筛选）
window.__practiceExamFilter = { subjectIdx: 0, year: null };
window.filterPracticeExamBySubject = function(idx) {
    window.__practiceExamFilter.subjectIdx = idx;
    const data = window.__practiceRealExamData;
    if (data) renderRealExamList(document.getElementById('training-content'), data);
};
window.filterPracticeExamByYear = function(year) {
    const f = window.__practiceExamFilter;
    f.year = f.year === year ? null : year;
    const data = window.__practiceRealExamData;
    if (data) renderRealExamList(document.getElementById('training-content'), data);
};
window.openPracticeExamDetail = function(idx) {
    const exam = window.__practiceRealExams && window.__practiceRealExams[idx];
    if (!exam) { showToast('题目数据加载中，请稍候','info'); return; }
    const stars = '★'.repeat(exam.level) + '☆'.repeat(5 - exam.level);
    const meta = `<div style="display:flex;gap:14px;flex-wrap:wrap;"><span><b>年份：</b>${exam.year} · ${exam.region}</span><span><b>题号：</b>${exam.no}</span><span><b>难度：</b><span style="color:#F59E0B;">${stars}</span></span><span><b>分值：</b><span style="color:#3B82F6;font-weight:600;">${exam.score}分</span></span></div>`;
    openModal('题目详情 · ' + exam.no, window.buildExamDetailHtml(exam, meta));
};
function renderRealExamTab(container, data) {
    window.__practiceRealExamData = data;
    renderRealExamList(container, data);
}
function renderRealExamList(container, data) {
    const filter = window.__practiceExamFilter || { subjectIdx: 0, year: null };
    const subjects = data.subjects || [];
    const years = data.years || [];
    const allExams = data.exams || [];
    window.__practiceRealExams = allExams;
    const filtered = allExams.filter(e => {
        const okSubj = filter.subjectIdx > 0 && subjects[filter.subjectIdx] !== '全部' ? e.subject === subjects[filter.subjectIdx] : true;
        const okYear = filter.year ? String(e.year) === String(filter.year) : true;
        return okSubj && okYear;
    });
    let html = '';
    // 科目筛选条
    html += '<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;margin-bottom:10px;">';
    subjects.forEach((s, i) => {
        const active = i === filter.subjectIdx;
        html += `<button onclick="filterPracticeExamBySubject(${i})" style="padding:6px 12px;border-radius:16px;border:1px solid ${active?'#3B82F6':'#E5E7EB'};background:${active?'#3B82F6':'white'};color:${active?'white':'#374151'};font-size:12px;cursor:pointer;white-space:nowrap;">${s}</button>`;
    });
    html += '</div>';
    // 年份筛选条
    html += '<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:12px;margin-bottom:8px;">';
    years.forEach(y => {
        const active = String(filter.year) === String(y.year);
        html += `<button onclick="filterPracticeExamByYear('${y.year}')" style="padding:4px 10px;border-radius:12px;border:1px solid ${active?'#8B5CF6':'#E5E7EB'};background:${active?'#8B5CF6':'white'};color:${active?'white':'#6B7280'};font-size:12px;cursor:pointer;">${y.year}年</button>`;
    });
    html += '</div>';
    // 题目列表
    if (!filtered.length) {
        html += '<div style="text-align:center;padding:30px;color:#9CA3AF;"><div style="font-size:13px;">该筛选条件下暂无题目</div></div>';
    } else {
        filtered.forEach(e => {
            const idx = allExams.indexOf(e);
            const stars = '★'.repeat(e.level) + '☆'.repeat(5 - e.level);
            html += `<div onclick="openPracticeExamDetail(${idx})" style="background:white;border:1px solid #E5E7EB;border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.borderColor='#3B82F6'" onmouseout="this.style.borderColor='#E5E7EB'">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                    <div style="display:flex;gap:8px;align-items:center;">
                        <span style="background:#3B82F6;color:white;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">${e.subject}</span>
                        <span style="font-size:13px;color:#374151;font-weight:600;">${e.no}</span>
                        ${e.hot ? '<span style="color:#EF4444;font-size:11px;"><i class="fas fa-fire"></i> 热门</span>' : ''}
                    </div>
                    <span style="color:#F59E0B;font-size:12px;">${stars}</span>
                </div>
                <div style="font-size:13px;color:#6B7280;line-height:1.6;">${e.question ? e.question.substring(0, 80) + (e.question.length > 80 ? '...' : '') : '暂无题干'}</div>
                <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:11px;color:#9CA3AF;">
                    <span><i class="fas fa-tag"></i> ${e.knowledge_point || '—'}</span>
                    <span><i class="fas fa-calendar"></i> ${e.year} · ${e.region} · ${e.score}分</span>
                </div>
            </div>`;
        });
    }
    container.innerHTML = html;
}

// Tab2：模拟题
window.openPracticeMockDetail = function(idx) {
    const mock = window.__practiceMocks && window.__practiceMocks[idx];
    if (!mock) { showToast('模拟卷数据加载中','info'); return; }
    const stars = '★'.repeat(mock.level) + '☆'.repeat(5 - mock.level);
    const meta = `<div style="display:flex;gap:14px;flex-wrap:wrap;"><span><b>来源：</b>${mock.source}</span><span><b>难度：</b><span style="color:#F59E0B;">${stars}</span></span><span><b>完成人数：</b>${mock.count.toLocaleString()}人</span><span><b>好评率：</b><span style="color:#10B981;font-weight:600;">${mock.rate}%</span></span></div>`;
    openModal('模拟卷详情 · ' + mock.name, window.buildExamDetailHtml(mock, meta));
};
function renderMockTab(container, data) {
    const mocks = data.mocks || [];
    window.__practiceMocks = mocks;
    if (!mocks.length) { container.innerHTML = '<div style="text-align:center;padding:30px;color:#9CA3AF;">暂无模拟卷</div>'; return; }
    let html = '';
    mocks.forEach((m, i) => {
        const stars = '★'.repeat(m.level) + '☆'.repeat(5 - m.level);
        html += `<div onclick="openPracticeMockDetail(${i})" style="background:white;border:1px solid #E5E7EB;border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer;" onmouseover="this.style.borderColor='#8B5CF6'" onmouseout="this.style.borderColor='#E5E7EB'">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <div><div style="font-size:14px;font-weight:600;color:#111827;">${m.name}</div><div style="font-size:11px;color:#9CA3AF;margin-top:2px;">${m.source}</div></div>
                <span style="color:#F59E0B;font-size:12px;">${stars}</span>
            </div>
            <div style="display:flex;gap:12px;font-size:12px;color:#6B7280;">
                <span><i class="fas fa-users"></i> ${m.count.toLocaleString()}人完成</span>
                <span><i class="fas fa-thumbs-up"></i> <span style="color:#10B981;font-weight:600;">${m.rate}%</span> 好评</span>
                <span><i class="fas fa-clock"></i> ${m.time}分钟</span>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

// Tab3：AI 推荐题
window.openPracticeRecommendDetail = function(idx) {
    const rec = window.__practiceRecommends && window.__practiceRecommends[idx];
    if (!rec) { showToast('推荐题数据加载中','info'); return; }
    const stars = '★'.repeat(rec.level) + '☆'.repeat(5 - rec.level);
    const reasonBg = rec.reasonColor === 'red' ? '#FEE2E2' : rec.reasonColor === 'orange' ? '#FEF3C7' : '#EDE9FE';
    const reasonColor = rec.reasonColor === 'red' ? '#991B1B' : rec.reasonColor === 'orange' ? '#92400E' : '#5B21B6';
    const meta = `<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;"><span><b>推荐理由：</b><span style="background:${reasonBg};color:${reasonColor};padding:2px 8px;border-radius:6px;font-weight:600;">${rec.reason}</span></span><span><b>匹配度：</b><span style="color:#10B981;font-weight:600;">${rec.match}%</span></span><span><b>难度：</b><span style="color:#F59E0B;">${stars}</span></span><span><b>预计用时：</b>${rec.time}分钟</span></div>`;
    openModal('AI推荐题详情', window.buildExamDetailHtml(rec, meta));
};
function renderAITab(container, data) {
    const recs = data.recommends || data.items || [];
    window.__practiceRecommends = recs;
    if (!recs.length) { container.innerHTML = '<div style="text-align:center;padding:30px;color:#9CA3AF;">暂无AI推荐题</div>'; return; }
    let html = '';
    recs.forEach((r, i) => {
        const stars = '★'.repeat(r.level) + '☆'.repeat(5 - r.level);
        const reasonBg = r.reasonColor === 'red' ? '#FEE2E2' : r.reasonColor === 'orange' ? '#FEF3C7' : '#EDE9FE';
        const reasonColor = r.reasonColor === 'red' ? '#991B1B' : r.reasonColor === 'orange' ? '#92400E' : '#5B21B6';
        html += `<div onclick="openPracticeRecommendDetail(${i})" style="background:white;border:1px solid #E5E7EB;border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer;" onmouseover="this.style.borderColor='#10B981'" onmouseout="this.style.borderColor='#E5E7EB'">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <div style="display:flex;gap:8px;align-items:center;">
                    <span style="background:#10B981;color:white;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">${r.subject}</span>
                    <span style="font-size:13px;color:#374151;font-weight:600;">${r.knowledge_point || '—'}</span>
                </div>
                <span style="color:#F59E0B;font-size:12px;">${stars}</span>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                <span style="background:${reasonBg};color:${reasonColor};padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;">${r.reason}</span>
                <span style="color:#10B981;font-size:11px;font-weight:600;">匹配度 ${r.match}%</span>
                <span style="color:#6B7280;font-size:11px;"><i class="fas fa-clock"></i> ${r.time}分钟</span>
            </div>
            <div style="font-size:12px;color:#6B7280;line-height:1.5;">${r.question ? r.question.substring(0, 60) + '...' : '点击查看完整题目'}</div>
        </div>`;
    });
    container.innerHTML = html;
}

// Tab4：易错题
window.openPracticeMistakeDetail = function(idx) {
    const m = window.__practiceMistakes && window.__practiceMistakes[idx];
    if (!m) { showToast('错题数据加载中','info'); return; }
    const meta = `<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;"><span><b>错误次数：</b><span style="color:#EF4444;font-weight:600;">${m.count}次</span></span><span><b>上次错误：</b>${m.last}</span></div>`;
    openModal('错题解析 · ' + m.subject, window.buildExamDetailHtml(m, meta));
};
function renderMistakeTab(container, data) {
    const mistakes = data.mistakes || data.items || [];
    window.__practiceMistakes = mistakes;
    if (!mistakes.length) { container.innerHTML = '<div style="text-align:center;padding:30px;color:#9CA3AF;">暂无易错题</div>'; return; }
    let html = '';
    mistakes.forEach((m, i) => {
        html += `<div onclick="openPracticeMistakeDetail(${i})" style="background:white;border:1px solid #E5E7EB;border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer;" onmouseover="this.style.borderColor='#EF4444'" onmouseout="this.style.borderColor='#E5E7EB'">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <div style="display:flex;gap:8px;align-items:center;">
                    <span style="background:#EF4444;color:white;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">${m.subject}</span>
                    <span style="font-size:13px;color:#374151;">${m.knowledge_point || '—'}</span>
                </div>
                <span style="color:#EF4444;font-size:12px;font-weight:600;">错误 ${m.count}次</span>
            </div>
            <div style="font-size:12px;color:#6B7280;line-height:1.5;">${m.question ? m.question.substring(0, 60) + '...' : '点击查看详情'}</div>
            <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">上次错误：${m.last}</div>
        </div>`;
    });
    container.innerHTML = html;
}

// Tab5：高频考点
// 高频考点数据（按学科分组），供学科切换使用
window.__hotTabData__ = null;
window.switchHotTabSubject = function(subject) {
    const content = document.getElementById('training-content');
    if (!content || !window.__hotTabData__) return;
    // 更新 tab 高亮
    document.querySelectorAll('.hot-subj-btn').forEach(btn => {
        const active = btn.dataset.subj === subject;
        btn.style.background = active ? '#3B82F6' : 'white';
        btn.style.color = active ? 'white' : '#374151';
        btn.style.borderColor = active ? '#3B82F6' : '#E5E7EB';
    });
    renderHotpointsList(content, window.__hotTabData__, subject);
};
function renderHotpointsList(container, data, subject) {
    const hotpoints = (data.hotpoints && data.hotpoints[subject]) ? data.hotpoints[subject] : [];
    const listEl = container.querySelector('#hot-list');
    if (!listEl) return;
    if (!hotpoints.length) {
        listEl.innerHTML = '<div style="text-align:center;padding:30px;color:#9CA3AF;"><i class="fas fa-info-circle" style="font-size:20px;margin-bottom:8px;"></i><div style="font-size:13px;">该学科暂无高频考点数据</div></div>';
        return;
    }
    let html = '';
    hotpoints.forEach((h, i) => {
        const masteryColor = h.mastery >= 75 ? '#10B981' : h.mastery >= 60 ? '#F59E0B' : '#EF4444';
        html += `<div style="background:white;border:1px solid #E5E7EB;border-radius:12px;margin-bottom:10px;overflow:hidden;">
            <div style="padding:14px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:8px;flex:1;">
                        <span style="width:22px;height:22px;border-radius:50%;background:#FEF3C7;color:#92400E;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">${i+1}</span>
                        <span style="font-size:14px;font-weight:600;color:#111827;">${h.name}</span>
                    </div>
                </div>
                <div style="display:flex;gap:12px;font-size:12px;color:#6B7280;margin-bottom:8px;flex-wrap:wrap;">
                    <span><i class="fas fa-fire" style="color:#EF4444;"></i> 近5年出现 ${h.freq}次</span>
                    <span>推荐练习 <span style="color:#3B82F6;font-weight:600;">${h.exercises}</span> 题</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:11px;color:#6B7280;flex-shrink:0;">掌握率</span>
                    <div style="flex:1;height:6px;background:#F3F4F6;border-radius:3px;overflow:hidden;">
                        <div style="height:100%;width:${h.mastery}%;background:${masteryColor};"></div>
                    </div>
                    <span style="font-size:12px;font-weight:600;color:${masteryColor};">${h.mastery}%</span>
                </div>
                ${h.analysis ? `<div style="margin-top:10px;background:#F9FAFB;border-radius:8px;padding:10px;font-size:12px;color:#6B7280;line-height:1.6;"><b style="color:#374151;">考情分析：</b>${h.analysis}</div>` : ''}
                ${h.types ? `<div style="margin-top:6px;font-size:12px;color:#6B7280;line-height:1.5;"><b style="color:#374151;">典型题型：</b>${h.types}</div>` : ''}
                ${h.tips ? `<div style="margin-top:6px;font-size:12px;color:#6B7280;line-height:1.5;"><b style="color:#374151;">解题技巧：</b>${h.tips}</div>` : ''}
            </div>
        </div>`;
    });
    listEl.innerHTML = html;
}
function renderHotTab(container, data) {
    // 后端数据结构: { subjects:[], info:'', hotpoints:{ '数学':[...], '语文':[...] } }
    const subjects = data.subjects || Object.keys(data.hotpoints || {}) || [];
    if (!subjects.length) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:#9CA3AF;">暂无高频考点</div>';
        return;
    }
    window.__hotTabData__ = data;
    const firstSubj = subjects[0];
    let html = '';
    // 学科切换按钮
    html += '<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;margin-bottom:10px;">';
    subjects.forEach((s, i) => {
        const active = i === 0;
        html += `<button class="hot-subj-btn" data-subj="${s}" onclick="switchHotTabSubject('${s}')" style="padding:6px 14px;border-radius:16px;border:1px solid ${active?'#3B82F6':'#E5E7EB'};background:${active?'#3B82F6':'white'};color:${active?'white':'#374151'};font-size:12px;cursor:pointer;white-space:nowrap;font-weight:${active?'600':'400'};">${s}</button>`;
    });
    html += '</div>';
    // 说明
    if (data.info) {
        html += `<div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:8px;"><i class="fas fa-info-circle" style="color:#3B82F6;"></i><span style="font-size:12px;color:#2563EB;">${data.info}</span></div>`;
    }
    // 考点列表容器
    html += '<div id="hot-list"></div>';
    container.innerHTML = html;
    // 渲染第一个学科
    renderHotpointsList(container, data, firstSubj);
}

async function renderMistakesPage(container) {
    const answers = await api.request(`/api/answers/${getUserId()}?days=30`);
    const all = Array.isArray(answers) ? answers : (answers && answers.data) || [];
    const mistakes = all.filter(a => !a.is_correct);
    // 按学科分组统计
    const subjectMap = {};
    mistakes.forEach(m => {
        const subj = m.subject || '其他';
        if (!subjectMap[subj]) subjectMap[subj] = [];
        subjectMap[subj].push(m);
    });
    // 概览统计
    const totalAnswers = all.length;
    const totalMistakes = mistakes.length;
    const correctRate = totalAnswers ? Math.round((1 - totalMistakes / totalAnswers) * 100) : 0;
    const subjects = Object.keys(subjectMap);
    const reviewNeeded = mistakes.filter(m => !m.reviewed).length;

    // 概览卡片
    const overviewHTML = `
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px;">
            <div style="background:white;border:1px solid #E5E7EB;border-radius:12px;padding:12px;text-align:center;">
                <div style="font-size:24px;font-weight:700;color:#EF4444;">${totalMistakes}</div>
                <div style="font-size:11px;color:#6B7280;margin-top:2px;">错题总数</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:12px;padding:12px;text-align:center;">
                <div style="font-size:24px;font-weight:700;color:#10B981;">${correctRate}%</div>
                <div style="font-size:11px;color:#6B7280;margin-top:2px;">正确率</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:12px;padding:12px;text-align:center;">
                <div style="font-size:24px;font-weight:700;color:#3B82F6;">${subjects.length}</div>
                <div style="font-size:11px;color:#6B7280;margin-top:2px;">涉及学科</div>
            </div>
            <div style="background:white;border:1px solid #E5E7EB;border-radius:12px;padding:12px;text-align:center;">
                <div style="font-size:24px;font-weight:700;color:#F59E0B;">${reviewNeeded}</div>
                <div style="font-size:11px;color:#6B7280;margin-top:2px;">待复习</div>
            </div>
        </div>
    `;

    // 学科筛选条
    const filterHTML = subjects.length ? `
        <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;margin-bottom:10px;">
            <button class="mistake-subj-btn active" data-subj="全部" onclick="filterMistakeBySubject('全部')" style="padding:6px 12px;border-radius:16px;border:1px solid #3B82F6;background:#3B82F6;color:white;font-size:12px;cursor:pointer;white-space:nowrap;">全部 (${totalMistakes})</button>
            ${subjects.map(s => `<button class="mistake-subj-btn" data-subj="${s}" onclick="filterMistakeBySubject('${s}')" style="padding:6px 12px;border-radius:16px;border:1px solid #E5E7EB;background:white;color:#374151;font-size:12px;cursor:pointer;white-space:nowrap;">${s} (${subjectMap[s].length})</button>`).join('')}
        </div>
    ` : '';

    // 错题列表
    const listHTML = mistakes.length ? mistakes.map((m, i) => `
        <div class="mistake-item" data-subj="${m.subject||'其他'}" style="background:white;border:1px solid #E5E7EB;border-radius:12px;padding:14px;margin-bottom:10px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <div style="display:flex;gap:8px;align-items:center;">
                    <span style="background:${m.subject==='数学'?'#3B82F6':m.subject==='英语'?'#10B981':m.subject==='物理'?'#8B5CF6':m.subject==='化学'?'#F59E0B':m.subject==='生物'?'#22C55E':m.subject==='政治'?'#EC4899':m.subject==='历史'?'#F97316':m.subject==='地理'?'#06B6D4':'#6B7280'};color:white;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">${(m.subject||'?')[0]}</span>
                    <span style="font-size:13px;color:#374151;">${m.question_id ? '题目 #' + m.question_id : '错题记录'}</span>
                    ${m.difficulty ? `<span style="font-size:11px;color:#9CA3AF;">难度 ${m.difficulty}</span>` : ''}
                </div>
                <span style="color:#EF4444;font-size:12px;"><i class="fas fa-times-circle"></i> 错误</span>
            </div>
            ${m.content || m.question ? `<div style="font-size:13px;color:#6B7280;line-height:1.6;margin-bottom:8px;">${(m.content || m.question).substring(0, 80)}${(m.content||m.question).length>80?'...':''}</div>` : ''}
            ${m.correct_answer ? `<div style="margin-top:6px;padding:8px 10px;background:#FEF2F2;border-radius:6px;font-size:12px;color:#991B1B;"><i class="fas fa-check"></i> <strong>正确答案:</strong> ${m.correct_answer}</div>` : ''}
            ${m.analysis ? `<div style="margin-top:6px;padding:8px 10px;background:#EFF6FF;border-radius:6px;font-size:12px;color:#1E40AF;"><i class="fas fa-lightbulb"></i> <strong>解析:</strong> ${m.analysis}</div>` : ''}
            <div style="display:flex;justify-content:space-between;margin-top:8px;">
                <span style="font-size:11px;color:#9CA3AF;">${m.created_at || m.date || ''}</span>
                <button onclick="markMistakeReviewed(${i})" style="background:${m.reviewed?'#10B981':'#F3F4F6'};color:${m.reviewed?'white':'#6B7280'};border:none;padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;font-weight:600;">
                    <i class="fas ${m.reviewed?'fa-check-circle':'fa-circle'}"></i> ${m.reviewed?'已复习':'标记已复习'}
                </button>
            </div>
        </div>
    `).join('') : '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-check-circle" style="font-size:32px;color:#10B981;margin-bottom:8px;"></i><div style="font-size:14px;color:#374151;font-weight:600;">最近30天无错题</div><div style="font-size:12px;color:#9CA3AF;margin-top:4px;">继续保持，你正在进步！</div></div>';

    container.innerHTML = `
        <div class="page-header"><h2><i class="fas fa-book-open"></i> 错题本</h2><p>自动收录错题，定期复习强化</p></div>
        ${overviewHTML}
        <div class="row"><div class="card" style="flex:1;padding:14px;">
            ${filterHTML}
            <div id="mistake-list">${listHTML}</div>
        </div></div>
    `;
}

window.filterMistakeBySubject = function(subj) {
    document.querySelectorAll('.mistake-subj-btn').forEach(b => {
        const active = b.dataset.subj === subj;
        b.classList.toggle('active', active);
        b.style.background = active ? '#3B82F6' : 'white';
        b.style.color = active ? 'white' : '#374151';
        b.style.borderColor = active ? '#3B82F6' : '#E5E7EB';
    });
    document.querySelectorAll('.mistake-item').forEach(item => {
        item.style.display = (subj === '全部' || item.dataset.subj === subj) ? '' : 'none';
    });
};

window.markMistakeReviewed = function(idx) {
    // 本地状态切换（演示）
    showToast('已标记为已复习','success');
};

function renderAIExplainPage(container) {
    container.innerHTML = `
        <div class="page-header"><h2><i class="fas fa-robot"></i> AI讲题</h2><p>把你的学习问题告诉AI教练，获得详细解答</p></div>
        <div class="row">
            <div class="card" style="flex:1">
                <div id="ai-explain-chat" style="height:400px;overflow-y:auto;background:#F9FAFB;border-radius:12px;padding:16px;margin-bottom:16px;">
                    <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;">
                        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#60A5FA);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;"><i class="fas fa-robot"></i></div>
                        <div style="background:white;padding:10px 14px;border-radius:12px;border:1px solid #E5E7EB;max-width:70%;font-size:14px;">你好！我是你的AI学习教练。把不会的题目发给我，我会为你详细讲解思路。</div>
                    </div>
                </div>
                <div style="display:flex;gap:10px;">
                    <input type="text" id="ai-explain-input" placeholder="输入题目或知识点，如：圆锥曲线第二问怎么做？" style="flex:1;padding:10px 14px;border:1px solid #E5E7EB;border-radius:10px;outline:none;font-size:14px;" onkeydown="if(event.key==='Enter') sendAIExplain()">
                    <button class="btn-primary" onclick="sendAIExplain()"><i class="fas fa-paper-plane"></i> 发送</button>
                </div>
            </div>
        </div>
    `;
}

function sendAIExplain() {
    const input = document.getElementById('ai-explain-input');
    const chat = document.getElementById('ai-explain-chat');
    const text = input.value.trim();
    if (!text) return;
    chat.innerHTML += `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;justify-content:flex-end;"><div style="background:#3B82F6;color:white;padding:10px 14px;border-radius:12px;max-width:70%;font-size:14px;">${escapeHtml(text)}</div></div>`;
    input.value = '';
    chat.scrollTop = chat.scrollHeight;
    // AI 气泡（模型路由 → RAG → 流式输出 → 模型归因）
    const aiWrap = document.createElement('div');
    aiWrap.style.cssText = 'display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;';
    aiWrap.innerHTML = '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#60A5FA);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;flex-shrink:0;"><i class="fas fa-robot"></i></div>';
    const bubble = document.createElement('div');
    bubble.style.cssText = 'background:white;padding:10px 14px;border-radius:12px;border:1px solid #E5E7EB;max-width:70%;font-size:14px;line-height:1.6;';
    aiWrap.appendChild(bubble);
    chat.appendChild(aiWrap);
    chat.scrollTop = chat.scrollHeight;
    streamAIReplyInto(bubble, chat, text);
}

// ========== AI学习教练 ==========
async function renderAICoachPage(container) {
    container.innerHTML = `
    <div class="page-header"><h2><i class="fas fa-robot"></i> AI学习教练</h2><p>你的专属AI学习助手</p></div>
    <div id="ai-coach-content"><div class="card" style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">加载中…</div></div></div>`;

    try {
        const data = await api.getPageData('ai-coach');
        if (!data) return;
        const el = document.getElementById('ai-coach-content');
        if (!el) return;
        const header = data.header || {};
        const sug = data.suggestion || {};

        el.innerHTML = `
            <div class="row">
                <div class="card" style="flex:1;background:linear-gradient(135deg,#10B981,#059669);color:white;padding:20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
                        <div style="width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;"><i class="fas ${header.avatar_icon||'fa-robot'}"></i></div>
                        <div style="flex:1;"><div style="font-size:15px;font-weight:700;">${header.name||'AI学习教练'} <span style="font-size:11px;background:rgba(255,255,255,0.2);padding:1px 6px;border-radius:8px;margin-left:4px;">${header.status||'在线'}</span></div><div style="font-size:12px;opacity:0.9;margin-top:2px;">${header.greeting||''}</div></div>
                    </div>
                    <div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:12px;margin-bottom:10px;"><div style="font-size:12px;opacity:0.9;">${sug.today_topic_label||'今天学什么'}</div><div style="font-size:16px;font-weight:700;margin-top:2px;">${sug.today_topic||''}</div></div>
                    <div style="display:flex;gap:10px;">
                        <div style="flex:1;background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;"><div style="font-size:11px;opacity:0.9;">${sug.reason_label||'为什么学'}</div><div style="font-size:13px;font-weight:600;margin-top:2px;line-height:1.4;">${sug.reason||''}</div></div>
                        <div style="flex:1;background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;"><div style="font-size:11px;opacity:0.9;">${sug.improve_label||'预计提高'}</div><div style="font-size:18px;font-weight:700;margin-top:2px;">${sug.improve_value||''}</div></div>
                    </div>
                </div>
            </div>
            <div class="row"><div class="card" style="flex:1;">
                <div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-comments" style="color:#3B82F6;margin-right:6px;"></i>${data.chat_section_title||'AI对话'}</div>
                <div id="ai-coach-messages" style="height:300px;overflow-y:auto;background:#F9FAFB;border-radius:12px;padding:16px;margin-bottom:12px;">
                    ${(data.messages||[]).map(m => m.role==='ai' ?
                        '<div style="display:flex;gap:8px;margin-bottom:10px;"><div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;flex-shrink:0;"><i class="fas fa-robot"></i></div><div style="background:white;border:1px solid #E5E7EB;border-radius:14px 14px 14px 4px;padding:10px 14px;font-size:13px;max-width:75%;line-height:1.6;">'+m.text+'</div></div>'
                        : '<div style="display:flex;gap:8px;margin-bottom:10px;flex-direction:row-reverse;"><div style="width:32px;height:32px;border-radius:50%;background:#3B82F6;display:flex;align-items:center;justify-content:center;color:white;font-size:13px;flex-shrink:0;"><i class="fas fa-user"></i></div><div style="background:#3B82F6;color:white;border-radius:14px 14px 4px 14px;padding:10px 14px;font-size:13px;max-width:75%;line-height:1.6;">'+m.text+'</div></div>'
                    ).join('')}
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
                    ${(data.quick_questions||[]).map(q => '<div onclick="window.__coachAsk(\''+q.replace(/'/g,"\\'")+'\')" style="background:#EFF6FF;border:1px solid #BFDBFE;color:#2563EB;padding:6px 12px;border-radius:16px;font-size:12px;cursor:pointer;">'+q+'</div>').join('')}
                </div>
                <div style="display:flex;gap:8px;">
                    <input type="text" id="ai-coach-input" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${data.input_placeholder||'问我任何学习问题...'}" style="flex:1;padding:10px 16px;border:1.5px solid #E5E7EB;border-radius:22px;font-size:14px;outline:none;caret-color:#3B82F6;user-select:text;-webkit-user-select:text;">
                    <div onclick="window.__coachSend()" style="width:40px;height:40px;border-radius:50%;background:#3B82F6;color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;"><i class="fas fa-paper-plane"></i></div>
                </div>
            </div></div>`;

        // 使用 composition 标记变量，兼容所有浏览器和输入法的中文输入
        (function() {
            const input = document.getElementById('ai-coach-input');
            if (!input) return;
            let composing = false;
            input.addEventListener('compositionstart', function() { composing = true; });
            input.addEventListener('compositionend', function() { composing = false; });
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    // IME 正在组合候选词时，让浏览器处理，不触发发送
                    if (composing || e.isComposing || e.keyCode === 229 || e.code === '229') {
                        return;
                    }
                    e.preventDefault();
                    window.__coachSend();
                }
            });
        })();

        window.__coachSend = function() {
            const input = document.getElementById('ai-coach-input');
            const chat = document.getElementById('ai-coach-messages');
            const text = input.value.trim();
            if (!text) return;
            // 用户消息
            chat.innerHTML += '<div style="display:flex;gap:8px;margin-bottom:10px;flex-direction:row-reverse;"><div style="width:32px;height:32px;border-radius:50%;background:#3B82F6;display:flex;align-items:center;justify-content:center;color:white;font-size:13px;flex-shrink:0;"><i class="fas fa-user"></i></div><div style="background:#3B82F6;color:white;border-radius:14px 14px 4px 14px;padding:10px 14px;font-size:13px;max-width:75%;line-height:1.6;">'+escapeHtml(text)+'</div></div>';
            input.value = '';
            chat.scrollTop = chat.scrollHeight;
            // AI 气泡（模型路由 → RAG → 流式输出 → 模型归因）
            const aiWrap = document.createElement('div');
            aiWrap.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;';
            aiWrap.innerHTML = '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;flex-shrink:0;"><i class="fas fa-robot"></i></div>';
            const bubble = document.createElement('div');
            bubble.style.cssText = 'background:white;border:1px solid #E5E7EB;border-radius:14px 14px 14px 4px;padding:10px 14px;font-size:13px;max-width:82%;line-height:1.6;';
            aiWrap.appendChild(bubble);
            chat.appendChild(aiWrap);
            chat.scrollTop = chat.scrollHeight;
            streamAIReplyInto(bubble, chat, text);
        };
        window.__coachAsk = function(q) {
            const input = document.getElementById('ai-coach-input');
            if (input) { input.value = q; window.__coachSend(); }
        };
    } catch(e) { console.warn('AI教练加载失败', e); }
}

// ========== AI答疑 ==========
async function renderAIQAPage(container) {
    container.innerHTML = `
    <div class="page-header"><h2><i class="fas fa-question-circle"></i> AI答疑</h2><p>智能问答，解决你的学习疑惑</p></div>
    <div id="ai-qa-content"><div class="card" style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">加载中…</div></div></div>`;

    try {
        const data = await api.getPageData('ai-qa');
        if (!data) return;
        const el = document.getElementById('ai-qa-content');
        if (!el) return;
        const tip = data.top_tip || {};
        const ans = data.ai_answer || {};

        el.innerHTML = `
            <div class="row">
                <div class="card" style="flex:1;">
                    <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:8px;"><i class="fas ${tip.icon||'fa-comments'}" style="color:${tip.color||'#3B82F6'};"></i><span style="font-size:12px;color:#2563EB;">${tip.text||''}</span></div>
                    <div id="ai-qa-messages" style="height:320px;overflow-y:auto;background:#F9FAFB;border-radius:12px;padding:16px;margin-bottom:12px;">
                        <div style="display:flex;gap:8px;margin-bottom:14px;flex-direction:row-reverse;"><div style="width:32px;height:32px;border-radius:50%;background:#3B82F6;display:flex;align-items:center;justify-content:center;color:white;font-size:13px;flex-shrink:0;"><i class="fas fa-user"></i></div><div style="background:#3B82F6;color:white;border-radius:14px 14px 4px 14px;padding:12px 14px;font-size:13px;max-width:78%;line-height:1.6;">${data.user_question||''}</div></div>
                        <div style="display:flex;gap:8px;margin-bottom:14px;"><div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;flex-shrink:0;"><i class="fas fa-robot"></i></div><div style="flex:1;max-width:82%;"><div style="background:white;border:1px solid #E5E7EB;border-radius:14px 14px 14px 4px;padding:12px 14px;font-size:13px;line-height:1.7;">${(ans.sections||[]).map(sec => '<div style="font-weight:700;color:'+(sec.title_color||'#10B981')+';margin-bottom:6px;">'+sec.title+'</div><div style="margin-bottom:10px;">'+sec.content+'<br><span style="font-family:monospace;background:#FEF3C7;padding:1px 6px;border-radius:4px;">'+sec.formula+'</span></div>').join('')}</div><div style="background:linear-gradient(180deg,#F0F4FF 0%,#E0E7FF 100%);border-radius:10px;margin-top:8px;padding:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#6B7280;font-size:12px;min-height:100px;"><i class="fas ${ans.drawing_icon||'fa-draw-polygon'}" style="font-size:28px;margin-bottom:8px;color:#8B5CF6;"></i><span>${ans.drawing_text||''}</span></div></div></div>
                    </div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;">
                        ${(data.follow_up_questions||[]).map(q => '<div onclick="window.__qaAsk(\''+q.replace(/'/g,"\\'")+'\')" style="background:#EFF6FF;border:1px solid #BFDBFE;color:#2563EB;padding:6px 12px;border-radius:16px;font-size:12px;cursor:pointer;">'+q+'</div>').join('')}
                    </div>
                </div>
            </div>
            <div class="row"><div class="card" style="flex:1;">
                <div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-history" style="color:#8B5CF6;margin-right:6px;"></i>${data.history_title||'历史问答'}</div>
                ${(data.history||[]).map(h => '<div onclick="window.__qaAsk(\''+(h.title||'').replace(/'/g,"\\'")+'\')" style="display:flex;align-items:center;gap:10px;padding:12px;background:#F9FAFB;border-radius:10px;margin-bottom:8px;cursor:pointer;"><div style="width:32px;height:32px;border-radius:50%;background:'+(h.color||'#3B82F6')+';display:flex;align-items:center;justify-content:center;color:white;font-size:12px;flex-shrink:0;"><i class="fas '+(h.icon||'fa-question-circle')+'"></i></div><div style="flex:1;"><div style="font-size:13px;font-weight:600;">'+(h.title||'')+'</div><div style="font-size:11px;color:#9CA3AF;">'+(h.desc||'')+'</div></div><i class="fas fa-redo" style="color:#9CA3AF;font-size:12px;"></i></div>').join('')}
            </div></div>
            <div class="row"><div class="card" style="flex:1;display:flex;gap:8px;align-items:center;">
                <div onclick="alert(\'拍照提问功能开发中\')" style="width:40px;height:40px;border-radius:50%;background:#F3F4F6;color:#3B82F6;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;"><i class="fas ${data.camera_icon||'fa-camera'}"></i></div>
                <input type="text" id="ai-qa-input" placeholder="${data.input_placeholder||'输入你的问题...'}" style="flex:1;padding:10px 16px;border:1.5px solid #E5E7EB;border-radius:22px;font-size:14px;outline:none;" onkeydown="if(event.key==='Enter') window.__qaSend()">
                <div onclick="window.__qaSend()" style="width:40px;height:40px;border-radius:50%;background:#3B82F6;color:white;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;"><i class="fas fa-paper-plane"></i></div>
            </div></div>`;

        window.__qaSend = function() {
            const input = document.getElementById('ai-qa-input');
            const chat = document.getElementById('ai-qa-messages');
            const text = input.value.trim();
            if (!text) return;
            chat.innerHTML += '<div style="display:flex;gap:8px;margin-bottom:14px;flex-direction:row-reverse;"><div style="width:32px;height:32px;border-radius:50%;background:#3B82F6;display:flex;align-items:center;justify-content:center;color:white;font-size:13px;flex-shrink:0;"><i class="fas fa-user"></i></div><div style="background:#3B82F6;color:white;border-radius:14px 14px 4px 14px;padding:12px 14px;font-size:13px;max-width:78%;line-height:1.6;">'+escapeHtml(text)+'</div></div>';
            input.value = '';
            chat.scrollTop = chat.scrollHeight;
            const aiWrap = document.createElement('div');
            aiWrap.style.cssText = 'display:flex;gap:8px;margin-bottom:14px;';
            aiWrap.innerHTML = '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;flex-shrink:0;"><i class="fas fa-robot"></i></div>';
            const bubble = document.createElement('div');
            bubble.style.cssText = 'flex:1;max-width:82%;';
            const inner = document.createElement('div');
            inner.style.cssText = 'background:white;border:1px solid #E5E7EB;border-radius:14px 14px 14px 4px;padding:12px 14px;font-size:13px;line-height:1.7;';
            bubble.appendChild(inner);
            aiWrap.appendChild(bubble);
            chat.appendChild(aiWrap);
            chat.scrollTop = chat.scrollHeight;
            streamAIReplyInto(inner, chat, text);
        };
        window.__qaAsk = function(q) {
            const input = document.getElementById('ai-qa-input');
            if (input) { input.value = q; window.__qaSend(); }
        };
    } catch(e) { console.warn('AI答疑加载失败', e); }
}

// ========== AI错题分析 ==========
async function renderAIErrorPage(container) {
    container.innerHTML = `
    <div class="page-header"><h2><i class="fas fa-bug"></i> AI错题分析</h2><p>智能分析错题，精准提分</p></div>
    <div id="ai-error-content"><div class="card" style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">加载中…</div></div></div>`;

    try {
        const data = await api.getPageData('ai-error');
        if (!data) return;
        const el = document.getElementById('ai-error-content');
        if (!el) return;
        const stats = data.stats_card || {};
        const rec = data.ai_recommend || {};

        let errorListHtml = '';
        if (data.errors && data.errors.length) {
            errorListHtml = data.errors.map((e, i) => `
                <div style="background:white;border-radius:10px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
                        <span style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:${e.subjectColor||'#3B82F6'};color:white;">${e.subject}</span>
                        <span style="font-size:11px;color:#9CA3AF;">错${i+1}次 · ${(e.days_ago||0)}天前</span>
                        <span style="margin-left:auto;font-size:11px;color:#EF4444;"><i class="fas fa-fire"></i> 出错${e.error_count||0}次</span>
                    </div>
                    <div style="font-size:13px;font-weight:600;line-height:1.5;margin-bottom:6px;">${e.q}</div>
                    <div style="font-size:12px;color:#EF4444;margin-bottom:4px;"><i class="fas fa-times-circle"></i> 错误原因：${e.reason}</div>
                    <div style="font-size:12px;color:#2563EB;"><i class="fas fa-robot"></i> AI解析：${e.ai}</div>
                </div>`).join('');
        } else {
            errorListHtml = '<div style="text-align:center;padding:30px;color:#9CA3AF;font-size:13px;">暂无错题</div>';
        }

        let subjectDistHtml = '';
        const subjMap = {};
        (data.errors||[]).forEach(e => {
            if (!subjMap[e.subject]) subjMap[e.subject] = {label:e.subject, value:0, color:e.subjectColor||'#3B82F6'};
            subjMap[e.subject].value += (e.error_count||1);
        });
        const subjArr = Object.values(subjMap);
        if (subjArr.length) {
            let total = subjArr.reduce((s,x) => s+x.value, 0);
            subjectDistHtml = subjArr.map(s => {
                const pct = Math.round(s.value/total*100);
                return '<div style="display:flex;align-items:center;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span><span style="display:inline-block;width:10px;height:10px;background:'+s.color+';border-radius:2px;margin-right:6px;"></span>'+s.label+'</span><span style="font-weight:600;color:'+s.color+';">'+s.value+'道 ('+pct+'%)</span></div>';
            }).join('');
        } else {
            subjectDistHtml = '<div style="text-align:center;padding:20px;color:#9CA3AF;font-size:13px;">暂无数据</div>';
        }

        el.innerHTML = `
            <div class="row">
                <div class="card" style="flex:1;background:linear-gradient(135deg,#F59E0B,#EF4444);color:white;padding:20px;cursor:pointer;" onclick="switchPage('mistakes')">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;"><i class="fas ${stats.icon||'fa-bug'}" style="font-size:18px;"></i><span style="font-size:16px;font-weight:700;">${stats.title||'本月错题统计'}</span></div>
                    <div style="display:flex;gap:8px;">
                        <div style="flex:1;background:rgba(255,255,255,0.18);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:24px;font-weight:700;">${stats.total||0}</div><div style="font-size:11px;opacity:0.9;">总错题</div></div>
                        <div style="flex:1;background:rgba(255,255,255,0.18);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:24px;font-weight:700;">${stats.mastered||0}</div><div style="font-size:11px;opacity:0.9;">已掌握</div></div>
                        <div style="flex:1;background:rgba(255,255,255,0.18);border-radius:10px;padding:10px;text-align:center;"><div style="font-size:24px;font-weight:700;">${stats.pending||0}</div><div style="font-size:11px;opacity:0.9;">待复习</div></div>
                    </div>
                </div>
            </div>
            <div class="row"><div class="card" style="flex:1;">
                <div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-chart-pie" style="color:#8B5CF6;margin-right:6px;"></i>${data.subject_distribution_title||'按科目分布'}</div>
                ${subjectDistHtml}
            </div></div>
            <div class="row"><div class="card" style="flex:1;">
                <div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-list-alt" style="color:#EF4444;margin-right:6px;"></i>${data.error_type_title||'错误类型分析'}</div>
                ${(data.error_types||[]).map(t => '<div style="margin-bottom:10px;"><div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;"><span>'+t.name+'</span><span style="color:'+t.color+';font-weight:600;">'+t.percent+'%</span></div><div style="height:8px;background:#E5E7EB;border-radius:4px;overflow:hidden;"><div style="height:100%;background:'+t.color+';border-radius:4px;width:'+t.percent+'%;transition:width 0.6s;"></div></div>'+(t.advice?'<div style="font-size:11px;color:#6B7280;margin-top:4px;">'+t.advice+'</div>':'')+'</div>').join('')}
            </div></div>
            <div class="row">
                <div class="card" style="flex:1;background:linear-gradient(135deg,#8B5CF6,#6366F1);color:white;padding:16px;">
                    <div style="display:flex;align-items:flex-start;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-lightbulb"></i></div><div style="flex:1;"><div style="font-size:13px;font-weight:700;margin-bottom:4px;">${rec.title||'AI个性化推荐'}</div><div style="font-size:12px;line-height:1.5;opacity:0.95;">${rec.content||''}</div></div></div>
                </div>
            </div>
            <div class="row"><div class="card" style="flex:1;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><div style="font-size:14px;font-weight:700;"><i class="fas fa-list" style="color:#3B82F6;margin-right:6px;"></i>${data.error_list_title||'错题列表'}</div><span onclick="switchPage('mistakes')" style="font-size:12px;color:#3B82F6;cursor:pointer;">${data.error_list_more||'查看全部'} ›</span></div>
                ${errorListHtml}
            </div></div>
            <button onclick="switchPage('home-task')" style="width:100%;height:44px;background:linear-gradient(135deg,#3B82F6,#8B5CF6);color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;margin-top:8px;"><i class="fas ${data.train_button_icon||'fa-play'}"></i> ${data.train_button_text||'开始错题训练'}</button>`;
    } catch(e) { console.warn('AI错题分析加载失败', e); }
}

// ========== AI学习规划 ==========
async function renderAIPlanPage(container) {
    container.innerHTML = `
    <div class="page-header"><h2><i class="fas fa-map"></i> AI学习规划</h2><p>AI为你定制30天冲刺计划</p></div>
    <div id="ai-plan-content"><div class="card" style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">加载中…</div></div></div>`;

    try {
        const data = await api.getPageData('ai-plan');
        if (!data) return;
        const el = document.getElementById('ai-plan-content');
        if (!el) return;
        const goal = data.goal_card || {};
        const predict = data.ai_predict || {};
        const op = data.overall_progress || {};

        el.innerHTML = `
            <div class="row">
                <div class="card" style="flex:1;background:linear-gradient(135deg,#3B82F6,#1E40AF);color:white;padding:20px;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><i class="fas ${goal.icon||'fa-bullseye'}" style="font-size:18px;"></i><span style="font-size:16px;font-weight:700;">${goal.title||'目标分数分解'}</span></div>
                    <div style="font-size:13px;opacity:0.9;margin-bottom:12px;">总分目标 <span style="font-size:22px;font-weight:700;">${goal.total_target||0}</span> 分</div>
                    <div style="display:flex;gap:8px;">${(goal.subjects||[]).map(s => '<div style="flex:1;background:rgba(255,255,255,0.18);border-radius:8px;padding:8px;text-align:center;"><div style="font-size:18px;font-weight:700;">'+s.target+'</div><div style="font-size:10px;opacity:0.9;">'+s.name+'</div></div>').join('')}</div>
                </div>
            </div>
            <div class="row">
                <div class="card" style="flex:1;background:linear-gradient(135deg,#10B981,#059669);color:white;padding:14px;display:flex;align-items:center;gap:10px;">
                    <i class="fas ${predict.icon||'fa-chart-line'}" style="font-size:22px;"></i>
                    <div><div style="font-size:13px;font-weight:700;">${predict.title||'AI预测'}</div><div style="font-size:12px;opacity:0.95;">${predict.content_prefix||''} <span style="font-size:16px;font-weight:700;">${predict.improve||''}</span></div></div>
                </div>
            </div>
            <div class="row"><div class="card" style="flex:1;">
                <div style="font-size:14px;font-weight:700;margin-bottom:14px;"><i class="fas ${data.plan_title_icon||'fa-calendar-alt'}" style="color:#3B82F6;margin-right:6px;"></i>${data.plan_title||'30天冲刺计划'}</div>
                ${(data.weeks||[]).map((w,i) => {
                    const isLast = i === (data.weeks||[]).length-1;
                    return '<div style="display:flex;gap:12px;margin-bottom:0;">'+
                        '<div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">'+
                            '<div style="width:32px;height:32px;border-radius:50%;background:'+(w.done?'#10B981':w.color)+';color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">'+(w.done?'✓':'W'+w.week)+'</div>'+
                            (isLast?'':'<div style="width:2px;flex:1;background:#E5E7EB;margin:4px 0;min-height:30px;"></div>')+
                        '</div>'+
                        '<div style="flex:1;margin-bottom:14px;">'+
                            '<div style="background:white;border:1px solid #E5E7EB;border-radius:10px;padding:12px;">'+
                                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">'+
                                    '<span style="font-size:14px;font-weight:700;color:'+w.color+';">第'+w.week+'周 · '+w.theme+'</span>'+
                                    (w.done?'<span style="font-size:11px;background:#D1FAE5;color:#065F46;padding:2px 8px;border-radius:8px;">已完成</span>':'<span style="font-size:11px;background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:8px;">进行中</span>')+
                                '</div>'+
                                '<div style="font-size:11px;color:#9CA3AF;margin-bottom:8px;">第 '+((w.week-1)*7+1)+'-'+(w.week*7)+' 天</div>'+
                                '<div style="display:flex;flex-direction:column;gap:6px;">'+
                                    (w.tasks||[]).map(t => '<div style="font-size:12px;color:#374151;display:flex;align-items:center;gap:6px;"><i class="fas fa-check-circle" style="color:'+(w.done?'#10B981':'#D1D5DB')+';font-size:11px;"></i> '+t+'</div>').join('')+
                                '</div>'+
                            '</div>'+
                        '</div>'+
                    '</div>';
                }).join('')}
            </div></div>
            <div class="row"><div class="card" style="flex:1;">
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span style="font-weight:600;">${op.label||'整体进度'}</span><span style="color:${op.color||'#3B82F6'};font-weight:600;">${op.percent||0}%</span></div>
                <div style="height:8px;background:#E5E7EB;border-radius:4px;overflow:hidden;"><div style="height:100%;background:${op.color||'#3B82F6'};border-radius:4px;width:${op.percent||0}%;transition:width 0.6s;"></div></div>
                <div style="font-size:11px;color:#9CA3AF;margin-top:6px;">已完成 ${op.completed_days||0}/${op.total_days||0} 天 · ${op.tip||''}</div>
            </div></div>
            <div style="display:flex;gap:10px;margin-top:8px;">
                <button onclick="switchPage('plan')" style="flex:1;height:44px;background:linear-gradient(135deg,#3B82F6,#8B5CF6);color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;"><i class="fas fa-sync-alt"></i> AI重新规划</button>
                <button onclick="alert('报告导出功能开发中')" style="flex:1;height:44px;background:white;color:#3B82F6;border:1.5px solid #3B82F6;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;"><i class="fas fa-file-download"></i> 导出报告</button>
            </div>`;
    } catch(e) { console.warn('AI学习规划加载失败', e); }
}

// ========== 真题 ==========
async function renderRealExamPage(container) {
    container.innerHTML = `
    <div class="page-header"><h2><i class="fas fa-file-alt"></i> 真题练习</h2><p>历年高考真题，实战演练</p></div>
    <div id="practice-real-exam-content"><div class="card" style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">加载中…</div></div></div>`;

    try {
        const data = await api.getPageData('practice-real-exam');
        if (!data) return;
        const el = document.getElementById('practice-real-exam-content');
        if (!el) return;
        const subjects = data.subjects || [];
        const years = data.years || [];
        const exams = data.exams || [];

        const subjFilterHtml = subjects.map((s, i) => `<div data-subj-idx="${i}" onclick="window.__examFilterSubject(${i})" style="padding:6px 14px;border-radius:16px;font-size:12px;white-space:nowrap;cursor:pointer;${i===0?'background:#3B82F6;color:white;font-weight:600;':'background:white;color:#374151;'}">${s}</div>`).join('');
        const yearFilterHtml = years.map(y => `<div data-year="${y.year}" onclick="window.__examFilterYear('${y.year}')" style="padding:6px 14px;border-radius:16px;font-size:12px;white-space:nowrap;cursor:pointer;background:white;color:#374151;">${y.year}</div>`).join('');

        window.__examData = data;
        window.__examFilter = { subjectIdx: 0, year: null };
        window.__examFilterSubject = function(idx) {
            window.__examFilter.subjectIdx = idx;
            window.__examRerender();
        };
        window.__examFilterYear = function(year) {
            window.__examFilter.year = window.__examFilter.year === year ? null : year;
            window.__examRerender();
        };
        window.__examRerender = function() {
            const d = window.__examData;
            const f = window.__examFilter;
            const filtered = (d.exams||[]).filter(e => {
                let okSubj = f.subjectIdx === 0 || e.subject === d.subjects[f.subjectIdx];
                let okYear = !f.year || String(e.year) === String(f.year);
                return okSubj && okYear;
            });
            const subjBtns = el.querySelectorAll('[data-subj-idx]');
            subjBtns.forEach(btn => {
                const i = parseInt(btn.getAttribute('data-subj-idx'));
                btn.style.background = i === f.subjectIdx ? '#3B82F6' : 'white';
                btn.style.color = i === f.subjectIdx ? 'white' : '#374151';
                btn.style.fontWeight = i === f.subjectIdx ? '600' : '400';
            });
            const yearBtns = el.querySelectorAll('[data-year]');
            yearBtns.forEach(btn => {
                const y = btn.getAttribute('data-year');
                btn.style.background = f.year && f.year === y ? '#3B82F6' : 'white';
                btn.style.color = f.year && f.year === y ? 'white' : '#374151';
                btn.style.fontWeight = f.year && f.year === y ? '600' : '400';
            });
            const countEl = el.querySelector('[data-exam-count]');
            if (countEl) countEl.innerHTML = '共找到 <span style="color:#3B82F6;font-weight:600;">' + filtered.length + '</span> 道真题';
            const listEl = el.querySelector('[data-exam-list]');
            if (listEl) listEl.innerHTML = window.__examCardsHtml(filtered);
        };
        window.__examCardsHtml = function(exams) {
            if (!exams || !exams.length) return '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-folder-open" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无符合条件的真题</div></div>';
            return exams.map(e => {
                const stars = '★'.repeat(e.level||3) + '☆'.repeat(5-(e.level||3));
                return '<div style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.08);cursor:pointer;" onclick="switchPage(\'home-task-learn\')">' +
                    '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap;">' +
                    '<span style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:'+(e.subjectColor||'#3B82F6')+';color:white;">'+e.subject+'</span>' +
                    '<span style="font-size:12px;color:#6B7280;font-weight:600;">'+e.year+'</span>' +
                    '<span style="font-size:12px;color:#374151;">'+e.region+'</span>' +
                    (e.hot ? '<span style="font-size:11px;background:#FEE2E2;color:#991B1B;padding:1px 6px;border-radius:6px;"><i class="fas fa-fire"></i> 热门</span>' : '') +
                    '</div>' +
                    '<div style="font-size:14px;font-weight:600;margin-bottom:8px;">'+e.no+'</div>' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#6B7280;">' +
                    '<span>难度 <span style="color:#F59E0B;">'+stars+'</span></span>' +
                    '<span>分值 <span style="color:#3B82F6;font-weight:600;">'+e.score+'分</span></span>' +
                    '</div></div>';
            }).join('');
        };

        el.innerHTML = `
            <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:10px;margin-bottom:6px;">${subjFilterHtml}</div>
            <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:10px;margin-bottom:6px;">${yearFilterHtml}</div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin:14px 0 10px;">
                <span data-exam-count style="font-size:13px;color:#6B7280;">共找到 <span style="color:#3B82F6;font-weight:600;">${exams.length}</span> 道真题</span>
                <span style="font-size:12px;color:#3B82F6;cursor:pointer;"><i class="fas fa-filter"></i> 筛选</span>
            </div>
            <div data-exam-list>${window.__examCardsHtml(exams)}</div>`;
    } catch(e) { console.warn('真题加载失败', e); }
}

// ========== 模拟题 ==========
async function renderMockExamPage(container) {
    container.innerHTML = `
    <div class="page-header"><h2><i class="fas fa-copy"></i> 模拟题</h2><p>名校模拟题，AI智能组卷</p></div>
    <div id="practice-mock-content"><div class="card" style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">加载中…</div></div></div>`;

    try {
        const data = await api.getPageData('practice-mock');
        if (!data) return;
        const el = document.getElementById('practice-mock-content');
        if (!el) return;
        const subjects = data.subjects || [];
        const sources = data.sources || [];
        const mocks = data.mocks || [];

        el.innerHTML = `
            <div class="row">
                <div class="card" style="flex:1;background:linear-gradient(135deg,#8B5CF6,#6366F1);color:white;padding:16px;cursor:pointer;" onclick="switchPage('home-task')">
                    <div style="display:flex;align-items:center;gap:14px;">
                        <div style="width:48px;height:48px;border-radius:14px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;"><i class="fas fa-magic"></i></div>
                        <div style="flex:1;"><div style="font-size:16px;font-weight:700;">AI智能组卷</div><div style="font-size:12px;opacity:0.9;margin-top:2px;">根据你的学情自动生成专属试卷</div></div>
                        <i class="fas fa-chevron-right" style="font-size:14px;opacity:0.8;"></i>
                    </div>
                </div>
            </div>
            <div style="display:flex;gap:8px;overflow-x:auto;padding:10px 0;margin-bottom:6px;">
                ${subjects.map((s,i) => '<div style="padding:6px 14px;border-radius:16px;font-size:12px;white-space:nowrap;cursor:pointer;'+(i===0?'background:#3B82F6;color:white;font-weight:600;':'background:white;color:#374151;')+'">'+s+'</div>').join('')}
            </div>
            <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:10px;margin-bottom:6px;">
                ${sources.map(s => '<div style="padding:6px 14px;border-radius:16px;font-size:12px;white-space:nowrap;cursor:pointer;'+(s.active?'background:#3B82F6;color:white;font-weight:600;':'background:white;color:#374151;')+'">'+s.name+'</div>').join('')}
            </div>
            <div style="font-size:14px;font-weight:700;margin:14px 0 10px;"><i class="fas fa-star" style="color:#F59E0B;margin-right:6px;"></i>精选模拟卷</div>
            ${mocks.map(m => {
                const stars = '★'.repeat(m.level||3) + '☆'.repeat(5-(m.level||3));
                return '<div onclick="switchPage(\'home-task-learn\')" style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.08);cursor:pointer;">' +
                    '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap;">' +
                    '<span style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:'+(m.subjectColor||'#3B82F6')+';color:white;">'+m.subject+'</span>' +
                    '<span style="padding:3px 8px;border-radius:10px;font-size:11px;background:'+(m.source==='AI生成'?'#EDE9FE;color:#5B21B6':m.source==='衡水中学'||m.source==='黄冈中学'?'#DBEAFE;color:#1E40AF':'#D1FAE5;color:#065F46')+';">'+m.source+'</span>' +
                    '</div>' +
                    '<div style="font-size:14px;font-weight:600;margin-bottom:8px;">'+m.name+'</div>' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#6B7280;">' +
                    '<span>难度 <span style="color:#F59E0B;">'+stars+'</span></span>' +
                    '<span><i class="fas fa-user"></i> '+((m.count||0)/1000).toFixed(1)+'k人完成</span>' +
                    '<span><i class="fas fa-thumbs-up" style="color:#10B981;"></i> '+(m.rate||0)+'%</span>' +
                    '</div></div>';
            }).join('')}`;
    } catch(e) { console.warn('模拟题加载失败', e); }
}

// ========== AI推荐题 ==========
async function renderAIRecommendPage(container) {
    container.innerHTML = `
    <div class="page-header"><h2><i class="fas fa-brain"></i> AI推荐题</h2><p>基于学情数据，AI为你精准推荐</p></div>
    <div id="practice-ai-recommend-content"><div class="card" style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">加载中…</div></div></div>`;

    try {
        const data = await api.getPageData('practice-ai-recommend');
        if (!data) return;
        const el = document.getElementById('practice-ai-recommend-content');
        if (!el) return;
        const recommends = data.recommends || [];

        el.innerHTML = `
            <div class="row">
                <div class="card" style="flex:1;background:linear-gradient(135deg,#06B6D4,#0891B2);color:white;padding:16px;">
                    <div style="display:flex;align-items:flex-start;gap:12px;">
                        <div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;"><i class="fas fa-brain"></i></div>
                        <div><div style="font-size:15px;font-weight:700;margin-bottom:4px;">AI 智能推荐</div><div style="font-size:12px;line-height:1.5;opacity:0.95;">基于你的学习数据，AI为你推荐以下 <span style="font-size:16px;font-weight:700;">${data.total_recommend||recommends.length}</span> 道最值得做的题目</div></div>
                    </div>
                </div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin:14px 0;">
                ${(data.reasons||[]).map(r => '<span style="background:'+(r.bg||'#EFF6FF')+';color:'+(r.color||'#2563EB')+';padding:5px 12px;border-radius:14px;font-size:12px;font-weight:600;"><i class="fas '+(r.icon||'fa-tag')+'"></i> '+(r.text||'')+'</span>').join('')}
            </div>
            ${recommends.map(r => {
                const stars = '★'.repeat(r.level||3) + '☆'.repeat(5-(r.level||3));
                const reasonBg = r.reasonColor === 'red' ? '#FEE2E2' : r.reasonColor === 'orange' ? '#FEF3C7' : '#EDE9FE';
                const reasonColor = r.reasonColor === 'red' ? '#991B1B' : r.reasonColor === 'orange' ? '#92400E' : '#5B21B6';
                return '<div onclick="switchPage(\'home-task-learn\')" style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.08);cursor:pointer;">' +
                    '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap;">' +
                    '<span style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;background:'+(r.subjectColor||'#3B82F6')+';color:white;">'+r.subject+'</span>' +
                    '<span style="font-size:11px;background:'+reasonBg+';color:'+reasonColor+';padding:2px 8px;border-radius:6px;font-weight:600;">'+r.reason+'</span>' +
                    '<span style="margin-left:auto;font-size:11px;color:#10B981;font-weight:600;">匹配度 '+(r.match||0)+'%</span>' +
                    '</div>' +
                    '<div style="font-size:13px;font-weight:600;line-height:1.5;margin-bottom:8px;">'+r.q+'</div>' +
                    '<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#6B7280;">' +
                    '<span>难度 <span style="color:#F59E0B;">'+stars+'</span></span>' +
                    '<span><i class="fas fa-clock"></i> 预计 '+(r.time||10)+'分钟</span>' +
                    '</div></div>';
            }).join('')}
            <button onclick="switchPage('home-task')" style="width:100%;height:44px;background:linear-gradient(135deg,#3B82F6,#8B5CF6);color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;margin-top:8px;"><i class="fas fa-play"></i> 开始推荐训练</button>`;
    } catch(e) { console.warn('AI推荐题加载失败', e); }
}

// ========== 高频考点 ==========
async function renderHotpointsPage(container) {
    container.innerHTML = `
    <div class="page-header"><h2><i class="fas fa-fire"></i> 高频考点</h2><p>高考高频考点专项突破</p></div>
    <div id="practice-hotpoints-content"><div class="card" style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">加载中…</div></div></div>`;

    try {
        const data = await api.getPageData('practice-hotpoints');
        if (!data) return;
        const el = document.getElementById('practice-hotpoints-content');
        if (!el) return;
        const subjects = data.subjects || [];
        const hotpoints = data.hotpoints || {};

        window.__hotpointsData = data;
        window.__renderHotpointsList = function(subj) {
            const points = (hotpoints[subj] || []);
            return points.map((p, i) => {
                return '<div style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.08);cursor:pointer;" onclick="switchPage(\'home-task-learn\')">' +
                    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
                    '<div style="width:28px;height:28px;border-radius:50%;background:'+(p.color||'#EF4444')+';color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">'+(i+1)+'</div>' +
                    '<span style="font-size:14px;font-weight:700;color:'+(p.color||'#EF4444')+';">'+p.name+'</span>' +
                    '<span style="margin-left:auto;font-size:11px;background:#FEE2E2;color:#991B1B;padding:2px 8px;border-radius:6px;font-weight:600;"><i class="fas fa-fire"></i> '+(p.frequency||'高频')+'</span>' +
                    '</div>' +
                    '<div style="font-size:12px;color:#6B7280;margin-bottom:8px;">'+(p.desc||'')+'</div>' +
                    '<div style="display:flex;gap:12px;font-size:11px;color:#9CA3AF;">' +
                    '<span>出现频率 '+(p.rate||0)+'%</span>' +
                    '<span>掌握率 '+(p.mastery||0)+'%</span>' +
                    '<span>预计 '+(p.time||15)+'min</span>' +
                    '</div></div>';
            }).join('');
        };

        window.__switchHotpointSubject = function(subj, el2) {
            const items = el.querySelectorAll('.hp-subj-item');
            items.forEach(item => { item.style.background = 'transparent'; item.style.color = '#6B7280'; });
            el2.style.background = 'white'; el2.style.color = '#2563EB';
            const listEl = document.getElementById('hotpoints-list');
            if (listEl) listEl.innerHTML = window.__renderHotpointsList(subj);
        };

        el.innerHTML = `
            <div style="display:flex;background:#F3F4F6;border-radius:10px;padding:3px;margin-bottom:14px;overflow-x:auto;">
                ${subjects.map((s, i) => '<div class="hp-subj-item" onclick="window.__switchHotpointSubject(\''+s+'\', this)" style="min-width:48px;text-align:center;padding:6px 8px;font-size:12px;font-weight:500;border-radius:8px;cursor:pointer;transition:all .2s;'+(i===0?'background:white;color:#2563EB;box-shadow:0 1px 2px rgba(0,0,0,0.06);':'color:#6B7280;')+'">'+s+'</div>').join('')}
            </div>
            <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:8px;">
                <i class="fas fa-info-circle" style="color:#3B82F6;"></i><span style="font-size:12px;color:#2563EB;">${data.info||'高频考点是历年高考出现频率最高的知识点'}</span>
            </div>
            <div id="hotpoints-list">${window.__renderHotpointsList(subjects[0]||'数学')}</div>`;
    } catch(e) { console.warn('高频考点加载失败', e); }
}

async function renderExamPredictPage(container) {
    const report = await api.getPredictReport();
    let subjectHTML = '';
    if (report && report.subject_scores) {
        subjectHTML = report.subject_scores.map(s => `
            <div class="analysis-card">
                <div class="analysis-subject">${s.subject}</div>
                <div style="font-size:28px;font-weight:700;color:#3B82F6;margin:8px 0;">${s.score}<span style="font-size:14px;color:#9CA3AF;font-weight:400;">/${s.max_score}</span></div>
                <div class="mastery-bar"><div class="mastery-fill blue" style="width:${Math.round(s.score/s.max_score*100)}%"></div></div>
                <div style="font-size:12px;color:#6B7280;margin-top:4px;">得分率 ${Math.round(s.score/s.max_score*100)}%</div>
            </div>
        `).join('');
    }
    let adviceHTML = '';
    if (report && report.weak_advice) {
        adviceHTML = report.weak_advice.map(a => `<div style="padding:10px 14px;background:#FEF3C7;border-radius:8px;margin-bottom:8px;font-size:13px;color:#92400E;"><i class="fas fa-exclamation-triangle" style="margin-right:6px;"></i>${a}</div>`).join('');
    }
    container.innerHTML = `
        <div class="page-header"><h2><i class="fas fa-chart-line"></i> 模考预测</h2><p>基于AI大数据分析，预测你的高考成绩</p></div>
        <div class="row">
            <div class="card" style="flex:1;text-align:center;">
                <div style="font-size:14px;color:#6B7280;margin-bottom:8px;">预测高考分数</div>
                <div style="font-size:48px;font-weight:700;color:#3B82F6;">${report?.predicted_score||'--'}</div>
                <div style="font-size:14px;color:#6B7280;margin-top:4px;">目标 ${report?.target_score||'--'} 分 · 差距 ${(report?.target_score||0)-(report?.predicted_score||0)} 分</div>
            </div>
            <div class="card" style="flex:1;text-align:center;">
                <div style="font-size:14px;color:#6B7280;margin-bottom:8px;">预测全省排名</div>
                <div style="font-size:48px;font-weight:700;color:#8B5CF6;">${report?.rank?.toLocaleString()||'--'}</div>
                <div style="font-size:14px;color:#6B7280;margin-top:4px;">超过 ${report?.percentile||'--'}% 考生 · 置信度 ${report?.confidence||'--'}%</div>
            </div>
            <div class="card" style="flex:1;text-align:center;">
                <div style="font-size:14px;color:#6B7280;margin-bottom:8px;">录取概率</div>
                <div style="display:flex;justify-content:space-around;margin-top:16px;">
                    <div><div style="font-size:24px;font-weight:700;color:#10B981;">${report?.probability?.yiben||0}%</div><div style="font-size:12px;color:#6B7280;">一本</div></div>
                    <div><div style="font-size:24px;font-weight:700;color:#3B82F6;">${report?.probability?.p211||0}%</div><div style="font-size:12px;color:#6B7280;">211</div></div>
                    <div><div style="font-size:24px;font-weight:700;color:#8B5CF6;">${report?.probability?.p985||0}%</div><div style="font-size:12px;color:#6B7280;">985</div></div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="card" style="flex:1"><div class="card-title">各科预测分数</div><div class="analysis-grid">${subjectHTML||'<div style="color:#9CA3AF;padding:20px;text-align:center;">暂无数据</div>'}</div></div>
        </div>
        <div class="row">
            <div class="card" style="flex:1"><div class="card-title">提分建议</div>${adviceHTML||'<div style="color:#9CA3AF;padding:20px;text-align:center;">暂无建议</div>'}</div>
        </div>
    `;
}

// ========== 高考倒计时 ==========
function renderCountdownPage(container) {
    const today = new Date();
    const gaokaoYear = today.getMonth() > 5 || (today.getMonth() === 5 && today.getDate() > 9) ? today.getFullYear() + 1 : today.getFullYear();
    const gaokaoDate = new Date(gaokaoYear, 5, 7);
    const diffMs = gaokaoDate - today;
    const countdownDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    const days = ['一','二','三','四','五','六','日'];
    const firstDay = new Date(gaokaoYear, 5, 1);
    const lastDay = new Date(gaokaoYear, 6, 0);
    const daysInMonth = lastDay.getDate();
    const blankCells = (firstDay.getDay() + 6) % 7;
    const cells = [];
    for (let i = 0; i < blankCells; i++) cells.push({empty:true});
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({dayNum:d, isExam:d>=7&&d<=9, isToday:today.getFullYear()===gaokaoYear&&today.getMonth()===5&&today.getDate()===d});
    }
    while (cells.length % 7 !== 0) cells.push({empty:true});

    const defaults = [
        {subject:'数学',percent:55,color:'#3B82F6',icon:'fa-square-root-variable'},
        {subject:'语文',percent:61,color:'#F59E0B',icon:'fa-book'},
        {subject:'英语',percent:66,color:'#10B981',icon:'fa-language'},
        {subject:'物理',percent:58,color:'#8B5CF6',icon:'fa-atom'},
        {subject:'化学',percent:66,color:'#06B6D4',icon:'fa-flask'},
        {subject:'生物',percent:66,color:'#EC4899',icon:'fa-dna'},
        {subject:'政治',percent:63,color:'#EF4444',icon:'fa-landmark'},
        {subject:'历史',percent:64,color:'#D97706',icon:'fa-ribbon'},
        {subject:'地理',percent:64,color:'#059669',icon:'fa-globe-asia'}
    ];

    container.innerHTML = `
    <div class="page-header"><h2><i class="fas fa-flag-checkered"></i> 高考倒计时</h2><p>距离${gaokaoYear}年高考还有 ${countdownDays} 天</p></div>
    <div class="row">
        <div class="card" style="flex:1;background:linear-gradient(135deg,#EF4444,#F59E0B);color:white;text-align:center;padding:30px;">
            <div style="font-size:13px;opacity:0.9;">距离${gaokaoYear}年高考</div>
            <div style="font-size:64px;font-weight:800;line-height:1.1;margin:8px 0;"><span style="color:#FCD34D;">${countdownDays}</span><span style="font-size:22px;"> 天</span></div>
            <div style="font-size:12px;opacity:0.9;"><i class="fas fa-calendar-alt"></i> ${gaokaoYear}年6月7日 - 6月9日</div>
            <div style="margin-top:12px;background:rgba(255,255,255,0.18);border-radius:20px;padding:6px 16px;display:inline-block;font-size:12px;">最后冲刺，坚持就是胜利！</div>
        </div>
    </div>
    <div class="row">
        <div class="card" style="flex:1;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                <div style="font-size:15px;font-weight:700;"><i class="fas fa-chart-pie" style="color:#3B82F6;margin-right:6px;"></i>各科复习进度</div>
                <span style="font-size:11px;color:#9CA3AF;">基于知识点掌握率</span>
            </div>
            <div id="review-progress-list" style="display:flex;flex-direction:column;gap:12px;">
                <div style="text-align:center;padding:20px;color:#9CA3AF;font-size:13px;"><i class="fas fa-spinner fa-spin"></i> 正在加载…</div>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="card" style="flex:1;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <div style="font-size:15px;font-weight:700;"><i class="fas fa-calendar-day" style="color:#8B5CF6;margin-right:6px;"></i>倒计时日历</div>
                <div style="font-size:12px;color:#6B7280;">${gaokaoYear}年6月</div>
            </div>
            <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:11px;color:#9CA3AF;margin-bottom:6px;">
                ${days.map(d=>`<div style="padding:4px 0;">${d}</div>`).join('')}
            </div>
            <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">
                ${cells.map(c=>{
                    if(c.empty) return '<div style="aspect-ratio:1;"></div>';
                    if(c.isExam) return '<div style="aspect-ratio:1;background:#EF4444;color:white;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:700;"><span style="font-size:13px;">'+c.dayNum+'</span><span style="font-size:8px;">高考</span></div>';
                    if(c.isToday) return '<div style="aspect-ratio:1;background:#3B82F6;color:white;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">'+c.dayNum+'</div>';
                    return '<div style="aspect-ratio:1;background:#F9FAFB;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#374151;">'+c.dayNum+'</div>';
                }).join('')}
            </div>
            <div style="display:flex;gap:12px;margin-top:12px;font-size:11px;color:#6B7280;">
                <span><span style="display:inline-block;width:10px;height:10px;background:#EF4444;border-radius:3px;vertical-align:middle;margin-right:4px;"></span>高考日</span>
                <span><span style="display:inline-block;width:10px;height:10px;background:#3B82F6;border-radius:3px;vertical-align:middle;margin-right:4px;"></span>今天</span>
            </div>
        </div>
    </div>
    <div class="row">
        <div class="card" style="flex:1;background:linear-gradient(135deg,#F59E0B,#EF4444);color:white;text-align:center;padding:20px;">
            <i class="fas fa-quote-left" style="opacity:0.5;font-size:14px;"></i>
            <div style="font-size:16px;font-weight:700;margin:8px 0;letter-spacing:1px;">最后冲刺，坚持就是胜利</div>
            <div style="font-size:11px;opacity:0.85;">—— AI高考每日寄语</div>
        </div>
    </div>`;

    // 异步加载复习进度
    const listEl = document.getElementById('review-progress-list');
    if (listEl) {
        if (typeof api !== 'undefined' && api.getReviewProgress) {
            api.getReviewProgress().then(data => {
                const list = (data && data.length) ? data : defaults;
                listEl.innerHTML = list.map(s => `
                    <div>
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                            <div style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;"><i class="fas ${s.icon}" style="color:${s.color};width:16px;"></i> ${s.subject}</div>
                            <span style="font-size:13px;font-weight:700;color:${s.color};">${s.percent}%</span>
                        </div>
                        <div style="height:8px;background:#E5E7EB;border-radius:4px;overflow:hidden;"><div style="height:100%;background:${s.color};border-radius:4px;width:${s.percent}%;transition:width 0.6s;"></div></div>
                    </div>`).join('');
            }).catch(() => {
                listEl.innerHTML = defaults.map(s => `
                    <div>
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                            <div style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;"><i class="fas ${s.icon}" style="color:${s.color};width:16px;"></i> ${s.subject}</div>
                            <span style="font-size:13px;font-weight:700;color:${s.color};">${s.percent}%</span>
                        </div>
                        <div style="height:8px;background:#E5E7EB;border-radius:4px;overflow:hidden;"><div style="height:100%;background:${s.color};border-radius:4px;width:${s.percent}%;transition:width 0.6s;"></div></div>
                    </div>`).join('');
            });
        } else {
            listEl.innerHTML = defaults.map(s => `
                <div>
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                        <div style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;"><i class="fas ${s.icon}" style="color:${s.color};width:16px;"></i> ${s.subject}</div>
                        <span style="font-size:13px;font-weight:700;color:${s.color};">${s.percent}%</span>
                    </div>
                    <div style="height:8px;background:#E5E7EB;border-radius:4px;overflow:hidden;"><div style="height:100%;background:${s.color};border-radius:4px;width:${s.percent}%;transition:width 0.6s;"></div></div>
                </div>`).join('');
        }
    }
}

// ========== 今日任务 ==========
function renderTodayTaskPage(container) {
    container.innerHTML = `
    <div class="page-header"><h2><i class="fas fa-tasks"></i> 今日任务</h2><p>AI为你安排的今日学习计划</p></div>
    <div class="row">
        <div class="card" style="flex:1;background:linear-gradient(135deg,#3B82F6,#8B5CF6);color:white;padding:20px;">
            <div id="today-task-header" style="display:flex;align-items:center;justify-content:space-between;">
                <div>
                    <div style="font-size:12px;opacity:0.85;"><i class="fas fa-calendar-check"></i> 今日任务</div>
                    <div style="font-size:20px;font-weight:800;margin-top:4px;">加载中…</div>
                </div>
            </div>
        </div>
    </div>
    <div id="today-task-list" style="margin-top:12px;">
        <div class="card" style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">正在加载今日任务…</div></div>
    </div>
    <div class="row">
        <div class="card" style="flex:1;" id="today-task-stats">
            <div style="text-align:center;padding:20px;color:#9CA3AF;font-size:13px;"><i class="fas fa-spinner fa-spin"></i> 加载中…</div>
        </div>
    </div>
    <button onclick="switchPage('home-task-learn')" style="width:100%;height:48px;background:linear-gradient(135deg,#3B82F6,#8B5CF6);color:white;border:none;border-radius:24px;font-size:15px;font-weight:600;cursor:pointer;margin-top:12px;"><i class="fas fa-play"></i> 开始学习</button>`;

    setTimeout(async () => {
        try {
            let data = await api.getTodayTasks();
            // 云端静态环境回退：API 失败时使用静态 JSON 文件
            if (!data || !data.tasks) {
                try {
                    const resp = await fetch('prototype/data/pages/home-task.json');
                    if (resp.ok) {
                        data = await resp.json();
                    }
                } catch(e2) {}
            }
            if (!data || !data.tasks) {
                // 静态 JSON 也失败时，显示友好的默认状态（含实时日期）
                const _now = new Date();
                const _weekNames = ['日','一','二','三','四','五','六'];
                const _todayStr = (_now.getMonth() + 1) + '月' + _now.getDate() + '日 周' + _weekNames[_now.getDay()];
                const headerEl = document.getElementById('today-task-header');
                if (headerEl) {
                    headerEl.innerHTML = `
                        <div>
                            <div style="font-size:12px;opacity:0.85;"><i class="fas fa-calendar-check"></i> 今日任务</div>
                            <div style="font-size:20px;font-weight:800;margin-top:4px;">${_todayStr}</div>
                            <div style="font-size:12px;opacity:0.85;margin-top:2px;">点击下方按钮开始今日学习</div>
                        </div>
                        <div style="text-align:center;">
                            <div style="width:72px;height:72px;border-radius:50%;background:conic-gradient(#FCD34D 0deg,rgba(255,255,255,0.2) 0);display:flex;align-items:center;justify-content:center;">
                                <div style="width:56px;height:56px;border-radius:50%;background:rgba(59,130,246,0.8);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;">0%</div>
                            </div>
                            <div style="font-size:11px;opacity:0.85;margin-top:4px;">完成率</div>
                        </div>`;
                }
                const listEl = document.getElementById('today-task-list');
                if (listEl) {
                    listEl.innerHTML = '<div class="card" style="text-align:center;padding:30px;color:#6B7280;"><i class="fas fa-clipboard-list" style="font-size:28px;color:#3B82F6;margin-bottom:8px;"></i><div style="font-size:14px;font-weight:600;color:#374151;">今日学习计划</div><div style="font-size:12px;margin-top:6px;">点击"开始学习"进入今日学习会话</div></div>';
                }
                const statsEl = document.getElementById('today-task-stats');
                if (statsEl) {
                    statsEl.innerHTML = `
                        <div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-chart-bar" style="color:#3B82F6;margin-right:6px;"></i>今日进度</div>
                        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;">
                            <div style="text-align:center;padding:10px;background:rgba(16,185,129,0.06);border-radius:8px;"><div style="font-size:20px;font-weight:800;color:#10B981;">0</div><div style="font-size:11px;color:#6B7280;">已完成</div></div>
                            <div style="text-align:center;padding:10px;background:rgba(245,158,11,0.06);border-radius:8px;"><div style="font-size:20px;font-weight:800;color:#F59E0B;">0</div><div style="font-size:11px;color:#6B7280;">待完成</div></div>
                            <div style="text-align:center;padding:10px;background:rgba(59,130,246,0.06);border-radius:8px;"><div style="font-size:20px;font-weight:800;color:#3B82F6;">0</div><div style="font-size:11px;color:#6B7280;">总任务</div></div>
                        </div>
                        <div style="height:8px;background:#E5E7EB;border-radius:4px;overflow:hidden;"><div style="height:100%;background:#3B82F6;border-radius:4px;width:0%;transition:width 0.6s;"></div></div>
                        <div style="font-size:11px;color:#9CA3AF;margin-top:6px;">暂无任务数据</div>`;
                }
                return;
            }
            const tasks = data.tasks;
            const tagClass = {'数学':'tag-math','语文':'tag-chinese','英语':'tag-english','物理':'tag-physics','化学':'tag-chem','生物':'tag-bio','政治':'tag-politics','历史':'tag-history','地理':'tag-geo'};

            // 如果 API 返回的日期为空，使用实时日期
            const _now2 = new Date();
            const _weekNames2 = ['日','一','二','三','四','五','六'];
            const _todayStr2 = (_now2.getMonth() + 1) + '月' + _now2.getDate() + '日 周' + _weekNames2[_now2.getDay()];
            const displayDate = data.date || _todayStr2;

            const headerEl = document.getElementById('today-task-header');
            if (headerEl) {
                headerEl.innerHTML = `
                    <div>
                        <div style="font-size:12px;opacity:0.85;"><i class="fas fa-calendar-check"></i> 今日任务</div>
                        <div style="font-size:20px;font-weight:800;margin-top:4px;">${displayDate}</div>
                        <div style="font-size:12px;opacity:0.85;margin-top:2px;">已完成 ${data.done_count}/${data.total_count}，加油冲刺！</div>
                    </div>
                    <div style="text-align:center;">
                        <div style="width:72px;height:72px;border-radius:50%;background:conic-gradient(#FCD34D ${data.completion_rate*3.6}deg,rgba(255,255,255,0.2) 0);display:flex;align-items:center;justify-content:center;">
                            <div style="width:56px;height:56px;border-radius:50%;background:rgba(59,130,246,0.8);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;">${data.completion_rate}%</div>
                        </div>
                        <div style="font-size:11px;opacity:0.85;margin-top:4px;">完成率</div>
                    </div>`;
            }

            const listEl = document.getElementById('today-task-list');
            if (listEl) {
                if (tasks.length > 0) {
                    listEl.innerHTML = tasks.map(t => {
                        const isDone = t.status === 'done';
                        const cls = tagClass[t.subject] || 'tag-math';
                        return `<div class="card" style="margin-bottom:10px;border-left:3px solid ${isDone?'#10B981':'#F59E0B'};padding:14px;">
                            <div style="display:flex;align-items:flex-start;gap:12px;">
                                <div style="width:40px;height:40px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-book" style="color:#3B82F6;"></i></div>
                                <div style="flex:1;">
                                    <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;flex-wrap:wrap;">
                                        <span class="${cls}" style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;">${t.subject}</span>
                                        <span style="padding:3px 8px;border-radius:10px;font-size:11px;background:#F3F4F6;color:#6B7280;">${t.difficulty||'中等'}</span>
                                        <span style="padding:3px 8px;border-radius:10px;font-size:11px;background:${isDone?'rgba(16,185,129,0.1)':'rgba(245,158,11,0.1)'};color:${isDone?'#10B981':'#F59E0B'};">${isDone?'已完成':'待完成'}</span>
                                    </div>
                                    <div style="font-size:14px;font-weight:700;${isDone?'text-decoration:line-through;color:#9CA3AF;':''}">${t.point}</div>
                                    <div style="display:flex;align-items:center;gap:14px;margin-top:8px;font-size:11px;color:#6B7280;flex-wrap:wrap;">
                                        <span><i class="far fa-clock"></i> 预计 ${t.time}</span>
                                        <span><i class="fas fa-book"></i> ${t.questions_count||8} 道题</span>
                                    </div>
                                </div>
                            </div>
                            <div style="display:flex;gap:8px;margin-top:12px;">
                                <button onclick="switchPage('home-task-learn')" style="flex:1;height:36px;border:none;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:${isDone?'white':'#3B82F6'};color:${isDone?'#3B82F6':'white'};border:1px solid #3B82F6;"><i class="fas fa-play"></i> ${isDone?'再练一次':'开始学习'}</button>
                                <button onclick="switchPage('analysis')" style="height:36px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;background:white;color:#6B7280;border:1px solid #E5E7EB;width:44px;"><i class="fas fa-ellipsis-h"></i></button>
                            </div>
                        </div>`;
                    }).join('');
                } else {
                    listEl.innerHTML = '<div class="card" style="text-align:center;padding:30px;color:#9CA3AF;"><i class="fas fa-check-circle" style="font-size:28px;color:#10B981;margin-bottom:8px;"></i><div style="font-size:14px;font-weight:600;">今日任务已完成</div></div>';
                }
            }

            const statsEl = document.getElementById('today-task-stats');
            if (statsEl) {
                const doneCount = data.done_count;
                const todoCount = data.total_count - doneCount;
                const totalMin = tasks.reduce((s,t) => s + parseInt(t.time), 0);
                statsEl.innerHTML = `
                    <div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-chart-bar" style="color:#3B82F6;margin-right:6px;"></i>今日进度</div>
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;">
                        <div style="text-align:center;padding:10px;background:rgba(16,185,129,0.06);border-radius:8px;"><div style="font-size:20px;font-weight:800;color:#10B981;">${doneCount}</div><div style="font-size:11px;color:#6B7280;">已完成</div></div>
                        <div style="text-align:center;padding:10px;background:rgba(245,158,11,0.06);border-radius:8px;"><div style="font-size:20px;font-weight:800;color:#F59E0B;">${todoCount}</div><div style="font-size:11px;color:#6B7280;">待完成</div></div>
                        <div style="text-align:center;padding:10px;background:rgba(59,130,246,0.06);border-radius:8px;"><div style="font-size:20px;font-weight:800;color:#3B82F6;">${data.total_count}</div><div style="font-size:11px;color:#6B7280;">总任务</div></div>
                    </div>
                    <div style="height:8px;background:#E5E7EB;border-radius:4px;overflow:hidden;"><div style="height:100%;background:#3B82F6;border-radius:4px;width:${data.completion_rate}%;transition:width 0.6s;"></div></div>
                    <div style="font-size:11px;color:#9CA3AF;margin-top:6px;">总时长 ${totalMin}min · 预计还需 ${Math.max(0, totalMin)}min</div>`;
            }
        } catch(e) { console.warn('加载今日任务失败', e); }
    }, 100);
}

// ========== 学习时长 ==========
async function renderDurationPage(container) {
    container.innerHTML = `
    <div class="page-header"><h2><i class="fas fa-stopwatch"></i> 学习时长</h2><p>追踪你的学习时间分配</p></div>
    <div id="duration-page-content">
        <div class="card" style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">加载中…</div></div>
    </div>`;

    try {
        const data = await api.getDurationStats();
        if (!data) return;
        const el = document.getElementById('duration-page-content');
        if (!el) return;
        const t = data.today || {};
        const s = data.summary || {};
        const weekly = data.weekly || [];
        const subjects = data.subjects || [];

        const weekMax = Math.max(0.1, ...weekly.map(w => w.hours));
        const barsHtml = weekly.map(b => {
            const hPct = weekMax > 0 ? Math.round(b.hours / weekMax * 100) : 0;
            const isToday = b.is_today;
            return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:140px;justify-content:flex-end;">
                <span style="font-size:10px;color:#6B7280;">${b.hours}h</span>
                <div style="width:60%;height:${hPct}%;background:${isToday?'linear-gradient(180deg,#10B981,#34D399)':'linear-gradient(180deg,#3B82F6,#60A5FA)'};border-radius:4px 4px 0 0;min-height:2px;"></div>
                <span style="font-size:11px;color:${isToday?'#10B981':'#6B7280'};font-weight:${isToday?700:400};">${b.day}</span>
            </div>`;
        }).join('');

        let pieHtml = '';
        if (subjects.length > 0) {
            let gradStops = [], acc = 0;
            subjects.forEach(s2 => { gradStops.push(s2.color + ' ' + acc + '% ' + (acc + s2.percent) + '%'); acc += s2.percent; });
            pieHtml = '<div style="display:flex;align-items:center;gap:16px;">' +
                '<div style="width:120px;height:120px;border-radius:50%;background:conic-gradient(' + gradStops.join(', ') + ');position:relative;flex-shrink:0;">' +
                '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:60px;height:60px;border-radius:50%;background:white;display:flex;flex-direction:column;align-items:center;justify-content:center;"><span style="font-size:18px;font-weight:800;color:#111827;">' + (data.subject_total_hours||0) + 'h</span><span style="font-size:9px;color:#9CA3AF;">总计</span></div></div>' +
                '<div style="flex:1;display:flex;flex-direction:column;gap:6px;font-size:12px;">' + subjects.map(s2 => '<div style="display:flex;align-items:center;justify-content:space-between;"><span><span style="display:inline-block;width:8px;height:8px;background:' + s2.color + ';border-radius:2px;margin-right:6px;"></span>' + s2.subject + '</span><span style="font-weight:600;">' + s2.hours + 'h · ' + s2.percent + '%</span></div>').join('') + '</div></div>';
        } else {
            pieHtml = '<div style="text-align:center;padding:30px;color:#9CA3AF;font-size:13px;">本周暂无各科学习数据</div>';
        }

        el.innerHTML = `
            <div class="row">
                <div class="card" style="flex:1;background:linear-gradient(135deg,#10B981,#34D399);color:white;padding:20px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                        <div>
                            <div style="font-size:12px;opacity:0.85;"><i class="fas fa-stopwatch"></i> 今日学习时长</div>
                            <div style="font-size:36px;font-weight:800;margin:6px 0;">${t.duration_hours||0}<span style="font-size:16px;opacity:0.85;">小时</span></div>
                            <div style="font-size:12px;opacity:0.9;">日目标 ${t.daily_goal_hours||6}h</div>
                        </div>
                        <div style="text-align:center;">
                            <div style="width:80px;height:80px;border-radius:50%;background:conic-gradient(#FCD34D ${(t.goal_rate||0)*3.6}deg,rgba(255,255,255,0.2) 0);display:flex;align-items:center;justify-content:center;">
                                <div style="width:62px;height:62px;border-radius:50%;background:rgba(16,185,129,0.8);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;">${t.goal_rate||0}%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:12px;">
                <div class="card" style="text-align:center;padding:14px;"><div style="font-size:20px;font-weight:800;color:#3B82F6;">${s.week_hours||0}h</div><div style="font-size:11px;color:#9CA3AF;">本周时长</div></div>
                <div class="card" style="text-align:center;padding:14px;"><div style="font-size:20px;font-weight:800;color:#8B5CF6;">${s.month_hours||0}h</div><div style="font-size:11px;color:#9CA3AF;">本月时长</div></div>
                <div class="card" style="text-align:center;padding:14px;"><div style="font-size:20px;font-weight:800;color:#10B981;">${s.avg_hours||0}h</div><div style="font-size:11px;color:#9CA3AF;">日均时长</div></div>
            </div>
            <div class="row" style="margin-top:12px;"><div class="card" style="flex:1;">
                <div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-chart-column" style="color:#3B82F6;margin-right:6px;"></i>本周学习时长分布</div>
                <div style="display:flex;align-items:flex-end;justify-content:space-between;padding:0 4px;">${barsHtml}</div>
                <div style="font-size:11px;color:#9CA3AF;margin-top:10px;text-align:center;">本周累计 ${data.week_total_hours||0}h · 目标 ${data.week_goal_hours||42}h · 完成率 ${data.week_goal_rate||0}%</div>
            </div></div>
            <div class="row" style="margin-top:12px;"><div class="card" style="flex:1;">
                <div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-chart-pie" style="color:#8B5CF6;margin-right:6px;"></i>各科学习时长分布</div>
                ${pieHtml}
            </div></div>
            ${data.advice ? '<div class="row" style="margin-top:12px;"><div class="card" style="flex:1;background:linear-gradient(135deg,#F59E0B,#EF4444);color:white;padding:16px;"><div style="display:flex;align-items:flex-start;gap:10px;"><div style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-lightbulb"></i></div><div style="flex:1;font-size:13px;line-height:1.6;">' + data.advice + '</div></div></div></div>' : ''}`;
    } catch(e) {
        console.warn('加载时长统计失败', e);
    }
}

// ========== 学习会话 ==========
function renderLearnSessionPage(container) {
    container.innerHTML = `
    <div class="page-header"><h2><i class="fas fa-chalkboard-teacher"></i> 学习会话</h2><p>AI智能出题，针对性练习</p></div>
    <div class="row"><div class="card" style="flex:1;padding:20px;">
        <div id="learn-session-content" style="text-align:center;padding:40px;color:#9CA3AF;">
            <i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:8px;"></i>
            <div style="font-size:13px;">正在加载题目…</div>
        </div>
    </div></div>`;

    setTimeout(async () => {
        const el = document.getElementById('learn-session-content');
        if (!el) return;
        try {
            const data = await api.request('/api/questions?count=5');
            if (!data || !data.length) {
                el.innerHTML = '<div style="text-align:center;padding:30px;color:#9CA3AF;"><i class="fas fa-info-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无题目，请稍后再试</div></div>';
                return;
            }
            window.__learnSession = { questions: data, index: 0 };
            renderLearnSessionQuestion(el);
        } catch(e) {
            el.innerHTML = '<div style="text-align:center;padding:30px;color:#9CA3AF;"><div style="font-size:13px;">加载失败，请稍后重试</div></div>';
        }
    }, 100);
}

function renderLearnSessionQuestion(el) {
    const session = window.__learnSession;
    if (!session || !session.questions) return;
    const q = session.questions[session.index];
    if (!q) {
        el.innerHTML = '<div style="text-align:center;padding:40px;"><i class="fas fa-check-circle" style="font-size:36px;color:#10B981;margin-bottom:12px;"></i><div style="font-size:16px;font-weight:700;color:#111827;">本组题目已完成！</div><div style="font-size:13px;color:#6B7280;margin-top:8px;">共完成 ' + session.questions.length + ' 题</div><button onclick="switchPage(\'home-task\')" style="margin-top:16px;padding:8px 24px;background:#3B82F6;color:white;border:none;border-radius:20px;font-size:13px;cursor:pointer;">返回任务列表</button></div>';
        return;
    }
    // 重置容器颜色，避免继承加载状态的灰色
    el.style.color = '#111827';
    const tagClass = {'数学':'tag-math','语文':'tag-chinese','英语':'tag-english','物理':'tag-physics','化学':'tag-chem','生物':'tag-bio','政治':'tag-politics','历史':'tag-history','地理':'tag-geo'};
    const cls = tagClass[q.subject] || 'tag-math';
    let optionsHtml = '';
    if (q.options && Array.isArray(q.options)) {
        optionsHtml = q.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            return '<div onclick="window.__selectAnswer(\'' + letter + '\')" data-opt="' + letter + '" style="display:flex;align-items:center;gap:10px;padding:12px;margin-bottom:8px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;cursor:pointer;transition:all 0.2s;" onmouseover="this.style.borderColor=\'#3B82F6\';this.style.background=\'#EFF6FF\'" onmouseout="this.style.borderColor=\'#E5E7EB\';this.style.background=\'#F9FAFB\'"><div style="width:28px;height:28px;border-radius:50%;background:#E5E7EB;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#374151;flex-shrink:0;">' + letter + '</div><div style="font-size:14px;color:#1F2937;flex:1;white-space:pre-wrap;">' + opt + '</div></div>';
        }).join('');
    }

    el.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><div style="display:flex;align-items:center;gap:8px;"><span class="' + cls + '" style="padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;">' + q.subject + '</span><span style="font-size:11px;color:#6B7280;">' + (q.type||'选择题') + '</span><span style="font-size:11px;color:#6B7280;">难度' + '★'.repeat(q.difficulty||3) + '</span></div><span style="font-size:12px;color:#6B7280;">第 ' + (session.index+1) + '/' + session.questions.length + ' 题</span></div><div style="font-size:15px;line-height:1.8;margin-bottom:16px;white-space:pre-wrap;color:#111827;font-weight:500;">' + (q.content || q.title || '') + '</div>' + (q.knowledge_point_name ? '<div style="font-size:11px;color:#6B7280;margin-bottom:12px;"><i class="fas fa-tag"></i> 知识点：' + q.knowledge_point_name + '</div>' : '') + '<div id="learn-options">' + optionsHtml + '</div><div id="learn-feedback" style="margin-top:12px;"></div><div style="display:flex;justify-content:space-between;margin-top:16px;"><button onclick="window.__prevQuestion()" style="padding:8px 16px;background:white;color:#6B7280;border:1px solid #E5E7EB;border-radius:8px;font-size:13px;cursor:pointer;' + (session.index===0?'opacity:0.5;cursor:not-allowed;':'') + '"><i class="fas fa-chevron-left"></i> 上一题</button><button onclick="window.__nextQuestion()" style="padding:8px 16px;background:#3B82F6;color:white;border:none;border-radius:8px;font-size:13px;cursor:pointer;">下一题 <i class="fas fa-chevron-right"></i></button></div>';

    window.__selectAnswer = function(letter) {
        const opts = document.querySelectorAll('#learn-options [data-opt]');
        opts.forEach(o => { o.style.borderColor = '#E5E7EB'; o.style.background = '#F9FAFB'; });
        const sel = document.querySelector('#learn-options [data-opt="' + letter + '"]');
        if (sel) { sel.style.borderColor = '#3B82F6'; sel.style.background = '#EFF6FF'; }
        const feedback = document.getElementById('learn-feedback');
        const correct = q.answer && q.answer.indexOf(letter) >= 0;
        if (feedback) {
            feedback.innerHTML = '<div style="padding:12px;border-radius:8px;background:' + (correct ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)') + ';border:1px solid ' + (correct ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)') + ';"><div style="font-size:13px;font-weight:700;color:' + (correct ? '#10B981' : '#EF4444') + ';margin-bottom:4px;"><i class="fas ' + (correct ? 'fa-check-circle' : 'fa-times-circle') + '"></i> ' + (correct ? '回答正确！' : '回答错误') + '</div><div style="font-size:12px;color:#6B7280;margin-bottom:6px;">正确答案：' + q.answer + '</div>' + (q.analysis ? '<div style="font-size:12px;color:#374151;line-height:1.6;">' + q.analysis + '</div>' : '') + '</div>';
        }
    };
    window.__nextQuestion = function() {
        if (session.index < session.questions.length - 1) { session.index++; renderLearnSessionQuestion(el); }
        else { renderLearnSessionQuestion(el); }
    };
    window.__prevQuestion = function() {
        if (session.index > 0) { session.index--; renderLearnSessionQuestion(el); }
    };
}

function renderVolunteerPage(container) {
    container.innerHTML = `
        <div class="page-header"><h2><i class="fas fa-university"></i> 志愿填报</h2><p>AI智能推荐适合你的院校和专业</p></div>
        <div class="row"><div class="card" style="flex:1;padding:0;overflow:hidden;">
            <div style="display:flex;overflow-x:auto;border-bottom:1px solid #E5E7EB;">
                ${[
                    {key:'recommend',name:'AI院校推荐',icon:'fa-university'},
                    {key:'major',name:'专业推荐',icon:'fa-graduation-cap'},
                    {key:'rank',name:'位次分析',icon:'fa-list-ol'}
                ].map((t,i)=>`
                    <div class="volunteer-tab ${i===0?'active':''}" data-tab="${t.key}" onclick="switchVolunteerTab('${t.key}')" style="flex:1;min-width:100px;text-align:center;padding:12px 8px;cursor:pointer;font-size:13px;color:${i===0?'#3B82F6':'#6B7280'};border-bottom:${i===0?'2px solid #3B82F6':'2px solid transparent'};font-weight:${i===0?'600':'400'};">
                        <i class="fas ${t.icon}" style="margin-right:4px;"></i>${t.name}
                    </div>
                `).join('')}
            </div>
            <div id="volunteer-content" style="padding:16px;min-height:300px;">
                <div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">加载中…</div></div>
            </div>
        </div></div>
    `;
    loadVolunteerTab('recommend');
}

window.switchVolunteerTab = function(key) {
    document.querySelectorAll('.volunteer-tab').forEach(t => {
        const active = t.dataset.tab === key;
        t.classList.toggle('active', active);
        t.style.color = active ? '#3B82F6' : '#6B7280';
        t.style.borderBottom = `2px solid ${active ? '#3B82F6' : 'transparent'}`;
        t.style.fontWeight = active ? '600' : '400';
    });
    loadVolunteerTab(key);
};

async function loadVolunteerTab(key) {
    const content = document.getElementById('volunteer-content');
    if (!content) return;
    content.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">加载中…</div></div>';
    try {
        const resp = await fetch(`/api/page-data/college-${key}`);
        const json = await resp.json();
        const data = json.data;
        if (!data) { content.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">暂无数据</div></div>'; return; }
        if (key === 'recommend') renderCollegeRecommendTab(content, data);
        else if (key === 'major') renderCollegeMajorTab(content, data);
        else if (key === 'rank') renderCollegeRankTab(content, data);
    } catch (e) {
        content.innerHTML = `<div style="text-align:center;padding:40px;color:#EF4444;"><div style="font-size:13px;">加载失败：${e.message}</div></div>`;
    }
}

function renderCollegeRecommendTab(container, data) {
    let html = '';
    window.__collegeData = data.colleges || [];
    const condTags = (data.conditions || []).map(c => `<span style="background:rgba(59,130,246,0.1);color:#3B82F6;padding:4px 10px;border-radius:12px;font-size:12px;font-weight:500;">${c}</span>`).join('');
    if (condTags) {
        html += `<div style="background:linear-gradient(135deg,#3B82F6,#8B5CF6);color:white;padding:14px;border-radius:12px;margin-bottom:16px;">
            <div style="font-size:13px;opacity:0.9;margin-bottom:8px;"><i class="fas fa-sliders-h"></i> 推荐条件</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">${(data.conditions||[]).map(c=>`<span style="background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:12px;font-size:12px;">${c}</span>`).join('')}</div>
        </div>`;
    }
    const colleges = data.colleges || [];
    if (!colleges.length) { html += '<div style="text-align:center;padding:30px;color:#9CA3AF;">暂无推荐院校</div>'; }
    else {
        colleges.forEach(c => {
            const probColor = c.prob >= 80 ? '#10B981' : c.prob >= 60 ? '#F59E0B' : '#EF4444';
            const tagBg = c.tag === 'red' ? '#FEE2E2' : c.tag === 'orange' ? '#FEF3C7' : '#DBEAFE';
            const tagColor = c.tag === 'red' ? '#991B1B' : c.tag === 'orange' ? '#92400E' : '#1E40AF';
            const tagText = c.type === '冲刺' ? '冲刺' : c.type === '稳妥' ? '稳妥' : '保底';
            html += `<div onclick="openCollegeDetail('${c.name.replace(/'/g, "\\'")}')" style="background:white;border:1px solid #E5E7EB;border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer;" onmouseover="this.style.borderColor='#3B82F6'" onmouseout="this.style.borderColor='#E5E7EB'">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div style="width:36px;height:36px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;"><i class="fas ${c.icon||'fa-university'}" style="color:#3B82F6;"></i></div>
                        <div>
                            <div style="font-size:15px;font-weight:700;color:#111827;">${c.name}</div>
                            <div style="font-size:11px;color:#9CA3AF;">2025录取线 ${c.score}分</div>
                        </div>
                    </div>
                    <span style="background:${tagBg};color:${tagColor};padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;">${tagText}</span>
                </div>
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                    <div style="flex:1;">
                        <div style="font-size:11px;color:#6B7280;margin-bottom:4px;">录取概率</div>
                        <div style="height:6px;background:#F3F4F6;border-radius:3px;overflow:hidden;"><div style="height:100%;width:${c.prob}%;background:${probColor};"></div></div>
                    </div>
                    <div style="font-size:18px;font-weight:700;color:${probColor};">${c.prob}%</div>
                </div>
                <div style="font-size:12px;color:#6B7280;background:#F9FAFB;border-radius:8px;padding:8px 10px;"><i class="fas fa-star" style="color:#F59E0B;margin-right:4px;"></i>优势专业：${c.majors}</div>
            </div>`;
        });
    }
    html += `<button onclick="window.collegeRecommendAdjust()" style="margin-top:8px;width:100%;padding:10px;border:1px solid #3B82F6;background:white;color:#3B82F6;border-radius:10px;font-size:13px;cursor:pointer;font-weight:600;"><i class="fas fa-sliders-h"></i> 调整推荐条件</button>`;
    container.innerHTML = html;
}

// 调整推荐条件：弹出表单模态框
window.collegeRecommendAdjust = function() {
    const data = window.__collegeData || [];
    // 从当前显示的推荐条件解析默认值
    let curScore = '598', curProv = '浙江省', curSub = '物化生', curRank = '8231';
    const condEl = document.querySelector('[style*="推荐条件"]');
    if (condEl) {
        const condText = condEl.textContent;
        const scoreMatch = condText.match(/预估\s*(\d+)\s*分/);
        const rankMatch = condText.match(/全省\s*([\d,]+)\s*名/);
        if (scoreMatch) curScore = scoreMatch[1];
        if (rankMatch) curRank = rankMatch[1].replace(/,/g, '');
        // 查找省份
        const provinces = ['北京市','天津市','河北省','山西省','辽宁省','吉林省','黑龙江省','上海市','江苏省','浙江省','安徽省','福建省','江西省','山东省','河南省','湖北省','湖南省','广东省','海南省','重庆市','四川省','贵州省','云南省','陕西省','甘肃省','青海省'];
        for (const p of provinces) {
            if (condText.indexOf(p) >= 0) { curProv = p; break; }
        }
        // 查找选科组合
        const subjectSets = ['物化生','物化政','物化地','物生政','物生地','史政地','史政生','史地生'];
        for (const s of subjectSets) {
            if (condText.indexOf(s) >= 0) { curSub = s; break; }
        }
    }

    const provinces = ['北京市','天津市','河北省','山西省','辽宁省','吉林省','黑龙江省','上海市','江苏省','浙江省','安徽省','福建省','江西省','山东省','河南省','湖北省','湖南省','广东省','海南省','重庆市','四川省','贵州省','云南省','陕西省','甘肃省','青海省'];
    const subjectSets = ['物化生','物化政','物化地','物生政','物生地','史政地','史政生','史地生'];
    const provOpts = provinces.map(p => `<option value="${p}"${p===curProv?' selected':''}>${p}</option>`).join('');
    const subOpts = subjectSets.map(s => `<option value="${s}"${s===curSub?' selected':''}>${s}</option>`).join('');

    const formHtml = `
        <div style="font-size:12px;color:#6B7280;margin-bottom:14px;line-height:1.6;">调整以下条件，AI 将重新计算录取概率并重新排序推荐院校。</div>
        <div style="margin-bottom:14px;">
            <div style="font-size:12px;color:#6B7280;margin-bottom:6px;">预估分数</div>
            <input id="cr-score" type="number" value="${curScore}" style="width:100%;height:40px;padding:0 12px;border:1.5px solid #E5E7EB;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box;">
        </div>
        <div style="margin-bottom:14px;">
            <div style="font-size:12px;color:#6B7280;margin-bottom:6px;">所在省份</div>
            <select id="cr-province" style="width:100%;height:40px;padding:0 12px;border:1.5px solid #E5E7EB;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box;">${provOpts}</select>
        </div>
        <div style="margin-bottom:14px;">
            <div style="font-size:12px;color:#6B7280;margin-bottom:6px;">选科组合</div>
            <select id="cr-subject" style="width:100%;height:40px;padding:0 12px;border:1.5px solid #E5E7EB;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box;">${subOpts}</select>
        </div>
        <div style="margin-bottom:18px;">
            <div style="font-size:12px;color:#6B7280;margin-bottom:6px;">全省位次</div>
            <input id="cr-rank" type="number" value="${curRank}" style="width:100%;height:40px;padding:0 12px;border:1.5px solid #E5E7EB;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box;">
        </div>
        <button onclick="window.collegeRecommendReapply()" style="width:100%;height:44px;border-radius:8px;background:#3B82F6;color:white;border:none;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"><i class="fas fa-sync-alt"></i> 重新推荐</button>
    `;

    openModal('调整推荐条件', formHtml);
};

// 根据新条件重新计算录取概率并重新渲染
window.collegeRecommendReapply = function() {
    const scoreEl = document.getElementById('cr-score');
    const provEl = document.getElementById('cr-province');
    const subEl = document.getElementById('cr-subject');
    const rankEl = document.getElementById('cr-rank');
    if (!scoreEl || !provEl || !subEl || !rankEl) return;

    const score = parseInt(scoreEl.value, 10) || 598;
    const province = provEl.value;
    const subject = subEl.value;
    const rank = parseInt(rankEl.value, 10) || 8231;

    // 关闭模态框
    document.getElementById('modal-overlay').classList.remove('show');

    // 获取当前院校数据
    const oldData = window.__collegeData || [];
    if (!oldData.length) { showToast('院校数据未加载', 'warning'); return; }

    // 重新计算每所院校的录取概率
    const newColleges = oldData.map(c => {
        const collegeScore = c.score || 600;
        const diff = score - collegeScore;
        // 基础概率：分数差越大，概率越高
        let prob;
        if (diff >= 30) prob = 95;
        else if (diff >= 15) prob = 85;
        else if (diff >= 0) prob = 70;
        else if (diff >= -10) prob = 50;
        else if (diff >= -20) prob = 35;
        else if (diff >= -30) prob = 20;
        else prob = 10;

        // 位次调整：位次越靠前，概率越高
        if (rank < 5000) prob = Math.min(99, prob + 5);
        else if (rank > 15000) prob = Math.max(5, prob - 5);

        // 同省院校加成
        if (c.province && c.province === province) prob = Math.min(99, prob + 3);

        // 确定类型
        let type;
        if (prob >= 75) type = '保底';
        else if (prob >= 50) type = '稳妥';
        else type = '冲刺';

        return { ...c, prob, type };
    });

    // 按概率降序排序
    newColleges.sort((a, b) => b.prob - a.prob);

    // 更新数据缓存
    window.__collegeData = newColleges;

    // 更新推荐条件标签
    const newConditions = [`预估 ${score}分`, province, subject, `全省${rank.toLocaleString('en')}名`];

    // 重新渲染
    const content = document.getElementById('volunteer-content');
    if (!content) return;

    // 显示加载状态
    content.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">AI 正在重新计算录取概率...</div></div>';

    setTimeout(() => {
        // 调用后端保存条件
        if (typeof api !== 'undefined' && api.saveCollegeConditions) {
            api.saveCollegeConditions({ score, province, subject, rank }).catch(() => {});
        }

        // 构建新的数据对象
        const newData = { colleges: newColleges, conditions: newConditions };
        renderCollegeRecommendTab(content, newData);
        showToast('已根据新条件重新推荐', 'success');
    }, 800);
};

window.openCollegeDetail = function(name) {
    const data = window.__collegeData || [];
    const c = data.find(x => x.name === name);
    if (!c) { showToast('院校数据加载中','info'); return; }
    const tagText = c.type === '冲刺' ? '冲刺院校' : c.type === '稳妥' ? '稳妥院校' : '保底院校';
    openModal('院校详情 · ' + c.name, `<div style="padding:14px;font-size:13px;color:#374151;line-height:1.8;">
        <div style="background:linear-gradient(135deg,#3B82F6,#8B5CF6);color:white;padding:14px;border-radius:10px;margin-bottom:12px;">
            <div style="font-size:18px;font-weight:700;margin-bottom:6px;">${c.name}</div>
            <span style="background:rgba(255,255,255,0.25);padding:3px 10px;border-radius:12px;font-size:12px;">${tagText}</span>
        </div>
        <div style="background:#F9FAFB;padding:10px 12px;border-radius:8px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span>2025录取线</span><strong>${c.score}分</strong></div>
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span>录取概率</span><strong style="color:${c.prob>=80?'#10B981':c.prob>=60?'#F59E0B':'#EF4444'};">${c.prob}%</strong></div>
        </div>
        <div style="margin-top:10px;"><b>优势专业</b><div style="margin-top:6px;color:#6B7280;">${c.majors}</div></div>
        <div style="margin-top:14px;text-align:center;"><button onclick="showToast('已加入志愿收藏','success');closeModal()" style="background:#3B82F6;color:white;border:none;padding:10px 24px;border-radius:8px;cursor:pointer;font-weight:600;"><i class="fas fa-bookmark"></i> 加入志愿收藏</button></div>
    </div>`);
};

function renderCollegeMajorTab(container, data) {
    const majors = data.majors || data.items || [];
    if (!majors.length) { container.innerHTML = '<div style="text-align:center;padding:30px;color:#9CA3AF;">暂无专业推荐</div>'; return; }
    let html = '';
    majors.forEach((m, i) => {
        html += `<div style="background:white;border:1px solid #E5E7EB;border-radius:12px;padding:14px;margin-bottom:10px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
                <div style="font-size:15px;font-weight:700;color:#111827;">${m.name}</div>
                <span style="background:#DBEAFE;color:#1E40AF;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;">${m.category || ''}</span>
            </div>
            <div style="font-size:12px;color:#6B7280;line-height:1.6;margin-bottom:8px;">${m.desc || m.introduction || ''}</div>
            <div style="display:flex;gap:12px;font-size:11px;color:#9CA3AF;">
                <span><i class="fas fa-chart-line"></i> 就业率 ${m.employment || 0}%</span>
                <span><i class="fas fa-money-bill-wave"></i> 平均薪资 ${m.salary || '—'}</span>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function renderCollegeRankTab(container, data) {
    let html = '';
    if (data.rank_info) {
        const r = data.rank_info;
        html += `<div style="background:linear-gradient(135deg,#8B5CF6,#3B82F6);color:white;padding:18px;border-radius:12px;margin-bottom:16px;text-align:center;">
            <div style="font-size:13px;opacity:0.9;margin-bottom:8px;">预估全省排名</div>
            <div style="font-size:36px;font-weight:700;">${(r.rank||'--').toLocaleString()}</div>
            <div style="font-size:12px;opacity:0.9;margin-top:6px;">超过 ${r.percentile||'--'}% 考生</div>
        </div>`;
    }
    const schools = data.schools || data.ranks || [];
    if (schools.length) {
        html += '<div style="font-size:14px;font-weight:600;color:#374151;margin-bottom:10px;">同分考生去向</div>';
        schools.forEach((s, i) => {
            html += `<div style="background:white;border:1px solid #E5E7EB;border-radius:12px;padding:12px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                <div><div style="font-size:13px;font-weight:600;">${s.name||s.school}</div><div style="font-size:11px;color:#9CA3AF;">${s.major||''}</div></div>
                <span style="background:#F3F4F6;color:#374151;padding:3px 10px;border-radius:12px;font-size:11px;">${s.percent||0}%</span>
            </div>`;
        });
    } else {
        html += '<div style="text-align:center;padding:30px;color:#9CA3AF;">暂无位次数据</div>';
    }
    container.innerHTML = html;
}

// ============================================================
// 渲染登录/注册模块（4 tab：密码/微信/验证码/家长绑定）
// 完整页面（renderProfilePage）与模态框（openAuthModal）共用此函数
// 用 data-auth-panel 属性标记每个 panel，便于 switchAuthTab 同步操作多套实例
// ============================================================
function renderAuthPanels() {
    return `
        <div class="auth-tabs">
            <div class="auth-tab active" data-tab="password" onclick="switchAuthTab('password')">密码登录</div>
            <div class="auth-tab" data-tab="wechat" onclick="switchAuthTab('wechat')">微信登录</div>
            <div class="auth-tab" data-tab="sms" onclick="switchAuthTab('sms')">验证码登录</div>
            <div class="auth-tab" data-tab="parent" onclick="switchAuthTab('parent')">家长绑定</div>
        </div>

        <!-- 模块1：密码登录/注册 -->
        <div data-auth-panel="password" class="auth-tab-panel">
            <div style="display:flex;gap:0;margin-bottom:16px;border-bottom:1px solid #E5E7EB;">
                <div class="auth-subtab active" data-subtab="login" onclick="switchAuthSubTab('password','login')" style="flex:1;text-align:center;padding:10px 0;cursor:pointer;font-weight:600;border-bottom:2px solid #3B82F6;color:#3B82F6;">登录</div>
                <div class="auth-subtab" data-subtab="register" onclick="switchAuthSubTab('password','register')" style="flex:1;text-align:center;padding:10px 0;cursor:pointer;color:#6B7280;">注册</div>
            </div>
            <form id="login-form" class="auth-form" onsubmit="handleLogin(event)">
                <div class="auth-field">
                    <label>用户名</label>
                    <input type="text" id="login-username" placeholder="输入用户名或演示账户 u_001" required>
                </div>
                <div class="auth-field">
                    <label>密码</label>
                    <input type="password" id="login-password" placeholder="输入密码" required>
                </div>
                <button type="submit" class="btn-primary auth-submit"><i class="fas fa-sign-in-alt"></i> 登录</button>
                <div class="auth-hint"><i class="fas fa-info-circle"></i> 演示账户：<strong>u_001</strong> / 密码：<strong>u_001</strong></div>
            </form>
            <form id="register-form" class="auth-form" style="display:none;" onsubmit="handleRegister(event)">
                <div class="auth-field">
                    <label>用户名 <span style="color:#9CA3AF;font-weight:400;">（3-20位）</span></label>
                    <input type="text" id="reg-username" placeholder="设置登录用户名" minlength="3" maxlength="20" required>
                </div>
                <div class="auth-field">
                    <label>密码 <span style="color:#9CA3AF;font-weight:400;">（至少6位）</span></label>
                    <input type="password" id="reg-password" placeholder="设置登录密码" minlength="6" required>
                </div>
                <div class="auth-field">
                    <label>确认密码</label>
                    <input type="password" id="reg-password2" placeholder="请再次输入密码" minlength="6" required>
                </div>
                <div class="auth-field">
                    <label>昵称 <span style="color:#9CA3AF;font-weight:400;">（选填）</span></label>
                    <input type="text" id="reg-name" placeholder="如何称呼你？">
                </div>
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;font-size:12px;color:#6B7280;cursor:pointer;" onclick="this.querySelector('.agree-box').classList.toggle('checked');">
                    <span class="agree-box" style="display:inline-flex;width:16px;height:16px;border-radius:50%;border:1.5px solid #D1D5DB;align-items:center;justify-content:center;color:transparent;flex-shrink:0;">
                        <i class="fas fa-check" style="font-size:9px;"></i>
                    </span>
                    <span>我已阅读并同意 <span style="color:#3B82F6;cursor:pointer;" onclick="event.stopPropagation();showProtoModal('用户协议')">《用户协议》</span> 和 <span style="color:#3B82F6;cursor:pointer;" onclick="event.stopPropagation();showProtoModal('隐私政策')">《隐私政策》</span></span>
                </div>
                <button type="submit" class="btn-primary auth-submit"><i class="fas fa-user-plus"></i> 注册并登录</button>
            </form>
        </div>

        <!-- 模块2：微信登录（一键授权 + 扫码登录） -->
        <div data-auth-panel="wechat" class="auth-tab-panel" style="display:none;">
            <div style="display:flex;gap:0;margin-bottom:18px;border-bottom:1px solid #E5E7EB;">
                <div class="wx-subtab active" data-wxsub="oauth" onclick="switchWechatSubTab('oauth')" style="flex:1;text-align:center;padding:10px 0;cursor:pointer;font-weight:600;border-bottom:2px solid #07C160;color:#07C160;"><i class="fab fa-weixin"></i> 一键授权</div>
                <div class="wx-subtab" data-wxsub="qrcode" onclick="switchWechatSubTab('qrcode')" style="flex:1;text-align:center;padding:10px 0;cursor:pointer;color:#6B7280;"><i class="fas fa-qrcode"></i> 扫码登录</div>
            </div>
            <div id="wx-sub-oauth" style="padding:10px 4px;">
                <div style="text-align:center;">
                    <div style="width:72px;height:72px;border-radius:20px;background:#07C160;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(7,193,96,0.3);">
                        <i class="fab fa-weixin" style="font-size:36px;color:white;"></i>
                    </div>
                    <div style="font-size:16px;font-weight:700;margin-bottom:6px;">微信授权登录</div>
                    <div style="font-size:13px;color:#6B7280;margin-bottom:20px;">模拟微信 OAuth 授权，点击按钮即可使用微信账号登录</div>
                    <button class="btn-primary" style="background:#07C160;width:100%;border-radius:24px;height:48px;font-size:16px;" onclick="handleWechatLogin()">
                        <i class="fab fa-weixin"></i> 微信一键登录
                    </button>
                    <div style="font-size:11px;color:#9CA3AF;margin-top:14px;">授权即表示同意 <span style="color:#3B82F6;cursor:pointer;" onclick="showProtoModal('用户协议')">《用户协议》</span> 与 <span style="color:#3B82F6;cursor:pointer;" onclick="showProtoModal('隐私政策')">《隐私政策》</span></div>
                </div>
            </div>
            <div id="wx-sub-qrcode" style="display:none;padding:10px 4px;">
                <div id="wx-qrcode-box" style="text-align:center;">
                    <div id="wx-qrcode-wrap" style="position:relative;display:inline-block;margin:4px auto 14px;padding:16px;background:white;border:1px solid #E5E7EB;border-radius:16px;">
                        <img id="wx-qrcode-img" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="扫码登录二维码" style="width:220px;height:220px;display:block;" onerror="handleQrImgError(this)">
                        <div id="wx-qrcode-mask" style="display:none;position:absolute;inset:16px;background:rgba(255,255,255,0.92);border-radius:12px;align-items:center;justify-content:center;flex-direction:column;padding:12px;">
                            <div id="wx-qrcode-mask-icon" style="font-size:42px;"><i class="fas fa-mobile-alt" style="color:#07C160;"></i></div>
                            <div id="wx-qrcode-mask-text" style="font-size:14px;font-weight:700;color:#111827;text-align:center;">正在生成二维码...</div>
                        </div>
                    </div>
                    <div id="wx-qrcode-tip" style="font-size:14px;font-weight:700;color:#111827;">正在生成登录二维码...</div>
                    <div id="wx-qrcode-subtip" style="font-size:12px;color:#6B7280;margin-top:6px;min-height:16px;">
                        二维码 <span id="wx-qrcode-countdown">300</span>s 后过期，<a href="javascript:void(0)" onclick="refreshWechatQrcode()" style="color:#07C160;text-decoration:none;">刷新</a>
                    </div>
                </div>
                <div style="margin-top:14px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:12px 10px;">
                    <div style="font-size:12px;font-weight:700;color:#166534;margin-bottom:8px;"><i class="fas fa-vial"></i> 演示模式 · 模拟手机微信操作</div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <button class="btn-primary" style="flex:1 1 30%;height:36px;border-radius:10px;font-size:13px;" onclick="mockWechatAction('scan')"><i class="fas fa-mobile-alt"></i> 模拟扫码</button>
                        <button class="btn-primary" style="flex:1 1 30%;height:36px;border-radius:10px;font-size:13px;background:#16A34A;" onclick="mockWechatAction('confirm')"><i class="fas fa-check-circle"></i> 模拟确认</button>
                        <button class="btn-danger" style="flex:1 1 30%;height:36px;border-radius:10px;font-size:13px;" onclick="mockWechatAction('cancel')"><i class="fas fa-times-circle"></i> 模拟取消</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 模块3：手机验证码登录 -->
        <div data-auth-panel="sms" class="auth-tab-panel" style="display:none;">
            <form id="sms-login-form" class="auth-form" onsubmit="handleSmsLogin(event)">
                <div class="auth-field">
                    <label>手机号</label>
                    <input type="tel" id="sms-phone" maxlength="11" placeholder="请输入11位手机号" required>
                </div>
                <div class="auth-field">
                    <label>验证码</label>
                    <div style="display:flex;gap:10px;">
                        <input type="text" id="sms-code" maxlength="6" placeholder="请输入6位验证码" style="flex:1;" required>
                        <button type="button" id="sms-send-btn" onclick="handleSmsSend(event)" style="flex-shrink:0;width:130px;background:white;border:1.5px solid #3B82F6;color:#3B82F6;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">获取验证码</button>
                    </div>
                </div>
                <button type="submit" class="btn-primary auth-submit"><i class="fas fa-shield-alt"></i> 验证码登录</button>
                <div class="auth-hint"><i class="fas fa-info-circle"></i> 验证码将显示在后端控制台，便于测试</div>
            </form>
        </div>

        <!-- 模块4：家长绑定 -->
        <div data-auth-panel="parent" class="auth-tab-panel" style="display:none;">
            <div style="background:linear-gradient(135deg,#FFF7ED,#FFEDD5);border-radius:10px;padding:12px;margin-bottom:16px;font-size:12px;color:#92400E;">
                <i class="fas fa-hand-holding-heart"></i> 绑定孩子账号后，家长可查看学习进度、成绩趋势与提分情况。
            </div>
            <form id="parent-bind-form" class="auth-form" onsubmit="handleParentBind(event)">
                <div class="auth-field">
                    <label>学生手机号</label>
                    <input type="tel" id="bind-student-phone" maxlength="11" placeholder="请输入孩子的手机号" required>
                </div>
                <div class="auth-field">
                    <label>与学生关系</label>
                    <div style="display:flex;gap:10px;margin-top:6px;" class="relation-group">
                        <div onclick="selectRelation(this,'父亲')" class="relation-chip active" style="flex:1;text-align:center;padding:10px;border-radius:10px;background:#EFF6FF;color:#2563EB;font-size:13px;font-weight:600;border:1.5px solid #3B82F6;cursor:pointer;"><i class="fas fa-male"></i> 父亲</div>
                        <div onclick="selectRelation(this,'母亲')" class="relation-chip" style="flex:1;text-align:center;padding:10px;border-radius:10px;background:#F9FAFB;color:#6B7280;font-size:13px;font-weight:600;border:1.5px solid #E5E7EB;cursor:pointer;"><i class="fas fa-female"></i> 母亲</div>
                        <div onclick="selectRelation(this,'其他')" class="relation-chip" style="flex:1;text-align:center;padding:10px;border-radius:10px;background:#F9FAFB;color:#6B7280;font-size:13px;font-weight:600;border:1.5px solid #E5E7EB;cursor:pointer;"><i class="fas fa-user"></i> 其他</div>
                    </div>
                </div>
                <div class="auth-field">
                    <label>家长手机号</label>
                    <input type="tel" id="bind-parent-phone" maxlength="11" placeholder="请输入家长手机号" required>
                </div>
                <div class="auth-field">
                    <label>家长短信验证码</label>
                    <div style="display:flex;gap:10px;">
                        <input type="text" id="bind-sms-code" maxlength="6" placeholder="请输入6位验证码" style="flex:1;">
                        <button type="button" onclick="handleSmsSendForParent(event)" style="flex-shrink:0;width:130px;background:white;border:1.5px solid #3B82F6;color:#3B82F6;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">获取验证码</button>
                    </div>
                </div>
                <button type="submit" class="btn-primary auth-submit"><i class="fas fa-link"></i> 确认绑定</button>
                <div class="auth-hint"><i class="fas fa-info-circle"></i> 绑定后需学生端确认同意，一个家长最多绑定3个学生</div>
            </form>
        </div>
    `;
}

async function renderProfilePage(container) {
    const loggedIn = Auth.isLoggedIn();
    if (loggedIn) {
        const user = await api.getUser();
        if (!user) {
            Auth.clear();
            renderProfilePage(container);
            return;
        }
        // 获取家长绑定列表
        const bindings = await api.getParentBindings();
        const bindingHTML = bindings && bindings.length ? `
            <div class="profile-section">
                <h3><i class="fas fa-users"></i> 家长绑定（${bindings.length}/3）</h3>
                ${bindings.map(b => `
                    <div class="binding-item">
                        <div><strong>${b.relation}</strong> · ${b.parent_phone}</div>
                        <div style="font-size:12px;color:#9CA3AF;">
                            ${b.status === 'confirmed' ? '<span style="color:#10B981;">已确认</span>' : '<span style="color:#F59E0B;">待确认</span>'}
                            ${b.status === 'pending' ? `<button class="btn-sm" onclick="confirmBinding('${b.id}')">确认</button>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : `
            <div class="profile-section">
                <h3><i class="fas fa-users"></i> 家长绑定</h3>
                <p style="color:#9CA3AF;font-size:13px;">暂未绑定家长账号，可在登录页添加</p>
            </div>
        `;

        container.innerHTML = `
            <div class="page-header"><h2><i class="fas fa-user"></i> 个人中心</h2><p>管理你的个人信息和学习设置</p></div>
            <div class="row">
                <div class="card" style="flex:1;max-width:500px;">
                    <div style="text-align:center;margin-bottom:24px;">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name||'user')}" style="width:80px;height:80px;border-radius:50%;margin-bottom:12px;">
                        <div style="font-size:20px;font-weight:700;">${user.name||'--'}</div>
                        <div style="color:#6B7280;font-size:14px;">${user.grade||'--'} · ${user.province||'--'}</div>
                        ${user.phone ? `<div style="color:#9CA3AF;font-size:12px;margin-top:4px;"><i class="fas fa-mobile-alt"></i> ${user.phone}</div>` : ''}
                        <div style="margin-top:6px;display:inline-flex;align-items:center;gap:6px;background:#ECFDF5;color:#047857;padding:4px 10px;border-radius:12px;font-size:12px;"><i class="fas fa-check-circle"></i> 已登录</div>
                    </div>
                    <div class="profile-row"><span>目标分数</span><strong>${user.target_score||'--'} 分</strong></div>
                    <div class="profile-row"><span>当前估分</span><strong>${user.current_score||'--'} 分</strong></div>
                    <div class="profile-row"><span>高考日期</span><strong>${user.exam_date||'--'}</strong></div>
                    ${bindingHTML}
                    <div style="margin-top:20px;display:flex;gap:10px;">
                        <button class="btn-primary" style="flex:1;" onclick="editGoalScore()"><i class="fas fa-edit"></i> 编辑目标分数</button>
                        <button class="btn-danger" style="flex:1;" onclick="handleLogout()"><i class="fas fa-sign-out-alt"></i> 退出登录</button>
                    </div>
                </div>
            </div>
        `;
    } else {
        // 未登录：渲染登录/注册模块（与模态框共用 renderAuthPanels）
        container.innerHTML = `
            <div class="page-header"><h2><i class="fas fa-user"></i> 个人中心</h2><p>支持4种登录方式：密码登录、微信登录、验证码登录、家长绑定</p></div>
            <div class="row">
                <div class="card" style="flex:1;max-width:480px;margin:0 auto;">
                    ${renderAuthPanels()}
                </div>
            </div>
        `;
        // 绑定关系选择器
        window._selectedRelation = '父亲';
    }
}

// 切换顶层认证标签（密码/微信/验证码/家长）
// 用 data-auth-panel 属性同步操作模态框和完整页面的 panel（支持多套实例共存）
function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    // 只隐藏顶层 panel（data-auth-panel 标记的），不影响 panel 内部的 form 显示状态
    document.querySelectorAll('[data-auth-panel]').forEach(p => p.style.display = 'none');
    // 显示所有匹配 data-auth-panel="<tab>" 的 panel（模态框+完整页面同步）
    document.querySelectorAll('[data-auth-panel="' + tab + '"]').forEach(p => p.style.display = 'block');
    // 扫码子tab：切到微信 tab 时不自动触发扫码（由 switchWechatSubTab 控制）；切走时停止轮询
    if (typeof stopWechatPolling === 'function') stopWechatPolling(false);
}

// 子标签切换（密码模块内的登录/注册）
// 用 form 上下文同步操作多套实例
function switchAuthSubTab(tab, subTab) {
    document.querySelectorAll('.auth-subtab').forEach(t => {
        if (t.dataset.subtab === subTab) {
            t.classList.add('active');
            t.style.color = '#3B82F6';
            t.style.borderBottom = '2px solid #3B82F6';
        } else {
            t.classList.remove('active');
            t.style.color = '#6B7280';
            t.style.borderBottom = 'none';
        }
    });
    // 同步操作所有 login-form / register-form（模态框+完整页面）
    document.querySelectorAll('#login-form, [id="login-form"]').forEach(f => f.style.display = subTab === 'login' ? 'block' : 'none');
    document.querySelectorAll('#register-form, [id="register-form"]').forEach(f => f.style.display = subTab === 'register' ? 'block' : 'none');
}

// 关系选择
function selectRelation(el, relation) {
    window._selectedRelation = relation;
    document.querySelectorAll('.relation-chip').forEach(c => {
        c.style.background = '#F9FAFB';
        c.style.color = '#6B7280';
        c.style.border = '1.5px solid #E5E7EB';
    });
    el.style.background = '#EFF6FF';
    el.style.color = '#2563EB';
    el.style.border = '1.5px solid #3B82F6';
}

// 微信登录
async function handleWechatLogin() {
    openModal('微信授权登录', `
        <div style="text-align:center;padding:20px;">
            <div style="width:72px;height:72px;border-radius:18px;background:#07C160;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;">
                <i class="fab fa-weixin" style="font-size:36px;color:white;"></i>
            </div>
            <div style="font-size:15px;font-weight:700;margin-bottom:8px;">AI高考 申请获取以下权限</div>
            <div style="font-size:12px;color:#6B7280;margin-bottom:16px;">授权后即可使用微信账号登录</div>
            <div style="background:#F9FAFB;border-radius:8px;padding:12px;text-align:left;margin-bottom:16px;font-size:13px;color:#374151;">
                <div><i class="fas fa-user-circle" style="color:#07C160;"></i> 获取你的昵称、头像</div>
                <div style="margin-top:6px;"><i class="fas fa-mobile-alt" style="color:#07C160;"></i> 获取你的手机号</div>
            </div>
            <button class="btn-primary" style="background:#07C160;width:100%;border-radius:24px;height:44px;" onclick="doWechatLogin()"><i class="fab fa-weixin"></i> 确认授权</button>
        </div>
    `);
}

async function doWechatLogin() {
    closeModal();
    showToast('正在通过微信登录...', 'info');
    // 模拟：用随机 code 换取登录态
    const code = 'wx_code_' + Math.random().toString(36).slice(2, 10);
    const data = await api.wechatLogin(code);
    if (data && data.token) {
        Auth.setSession(data.token, data.user_id, data.user);
        showToast('微信登录成功，欢迎 ' + (data.user.name || '微信用户'), 'success');
        if (typeof updateUserUI === 'function') updateUserUI(data.user);
        setTimeout(() => renderProfilePage(document.querySelector('.content-scroll')), 500);
    } else {
        showToast('微信登录失败', 'error');
    }
}

// ============== 微信扫码登录 ==============
window._wxQrState = {
    sceneId: null,
    pollingTimer: null,
    countdownTimer: null,
    ttl: 300,
    remain: 300,
    finished: false,
    sse: null,           // EventSource 实例（长连接 SSE 优先）
    sseFailed: false,    // SSE 失败过一次则降级到轮询（同一会话不再重试）
    retryCount: 0        // 轮询连续失败计数（用于降级重试）
};

function switchWechatSubTab(sub) {
    document.querySelectorAll('.wx-subtab').forEach(t => {
        const active = t.dataset.wxsub === sub;
        t.classList.toggle('active', active);
        if (active) {
            t.style.color = '#07C160';
            t.style.borderBottom = '2px solid #07C160';
        } else {
            t.style.color = '#6B7280';
            t.style.borderBottom = 'none';
        }
    });
    // 同步操作所有 wx-sub-oauth / wx-sub-qrcode（模态框+完整页面）
    document.querySelectorAll('#wx-sub-oauth, [id="wx-sub-oauth"]').forEach(el => el.style.display = sub === 'oauth' ? 'block' : 'none');
    document.querySelectorAll('#wx-sub-qrcode, [id="wx-sub-qrcode"]').forEach(el => el.style.display = sub === 'qrcode' ? 'block' : 'none');
    if (sub === 'qrcode') {
        refreshWechatQrcode();
    } else {
        stopWechatPolling(/*keepSession*/ false);
    }
}

async function refreshWechatQrcode() {
    stopWechatPolling(false);
    window._wxQrState.finished = false;
    // 重置 SSE 降级标志（新会话可以再次尝试 SSE 长连接）
    window._wxQrState.sseFailed = false;
    window._wxQrState.retryCount = 0;
    // 初始加载 UI
    const imgEl = document.getElementById('wx-qrcode-img');
    const tipEl = document.getElementById('wx-qrcode-tip');
    const subTipEl = document.getElementById('wx-qrcode-subtip');
    const maskEl = document.getElementById('wx-qrcode-mask');
    if (imgEl) {
        imgEl.removeAttribute('data-err'); // 重置 onerror 防重入标志
    }
    if (tipEl) tipEl.textContent = '正在生成登录二维码...';
    // 生成期间显示 loading 遮罩（保留旧二维码避免闪白）
    showQrMask('loading', { msg: '正在生成二维码...' });
    const data = await api.wechatQrcodeCreate();

    // 用本地纯JS二维码生成器渲染二维码（不依赖外部图片服务）
    // scanUrl 优先取后端返回的 scan_url；API 失败时本地降级生成演示扫码会话
    let scanUrl, sceneId, expiresIn, scanHint;
    if (data && (data.scan_url || data.qrcode_url)) {
        sceneId = data.scene_id;
        scanUrl = data.scan_url || data.qrcode_url || '';
        expiresIn = data.expires_in || 300;
        scanHint = data.scan_hint || '请使用微信扫一扫登录';
    } else {
        // API 不可达（如云端无 auth 路由）→ 本地降级生成演示扫码会话
        sceneId = 'demo_scene_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        scanUrl = location.origin + '/api/auth/wechat-scan-callback?scene=' + sceneId;
        expiresIn = 300;
        scanHint = '请使用微信扫一扫登录（演示模式）';
    }

    // 生成微信开放平台标准授权二维码内容
    //   PC 扫码: https://open.weixin.qq.com/connect/qrconnect?...#wechat_redirect
    // redirect_uri 指向统一回调 /api/auth/wechat-callback，state 携带一次性 scene_id 用于轮询关联。
    const WECHAT_APPID = window.__WECHAT_APPID__ || 'wxDEMO000000000000';
    const REDIRECT_BASE = (window.__AUTH_CALLBACK_BASE__ || location.origin || 'https://ai-gaokao-static.pages.dev').replace(/\/$/, '');
    const rawRedirect = REDIRECT_BASE + '/api/auth/wechat-callback';
    const encRedirect = encodeURIComponent(rawRedirect);
    const encState = encodeURIComponent(sceneId);
    let qrContent = 'https://open.weixin.qq.com/connect/qrconnect?appid=' + WECHAT_APPID
        + '&redirect_uri=' + encRedirect
        + '&response_type=code&scope=snsapi_login&state=' + encState
        + '#wechat_redirect';

    // 若后端明确返回了微信官方 scan_url，则优先使用（并清理异常反斜杠）
    if (data && typeof (data.scan_url || data.qrcode_url) === 'string') {
        const given = (data.scan_url || data.qrcode_url || '').replace(/\\/g, '');
        if (/^https?:\/\/open\.weixin\.qq\.com\//.test(given)) qrContent = given;
    }
    // 再次清理：移除残留反斜杠与 %5C，避免二维码末尾脏字符
    qrContent = qrContent.replace(/\\/g, '').replace(/%5[cC]/g, '');

    window._wxQrState.sceneId = sceneId;
    window._wxQrState.ttl = expiresIn;
    window._wxQrState.remain = expiresIn;
    window._wxQrState.isDemo = !(data && data.scene_id);
    window._wxQrState.lastQrContent = qrContent;

    // 用内嵌生成器画出真实二维码（精确 220x220，与 img 容器一致，避免浏览器拉伸模糊）
    let rendered = false;
    try {
        if (window.QRCodeGen && imgEl) {
            var dataUrl = window.QRCodeGen.makeDataURL(qrContent, 220);
            if (dataUrl) {
                imgEl.src = dataUrl;
                imgEl.alt = '微信扫码登录二维码';
                rendered = true;
            }
        }
    } catch (e) {
        console.warn('[wechat-qr] 本地生成异常', e);
    }
    if (!rendered && imgEl) {
        // 本地生成器不可用：降级用后端图片URL（onerror 会防循环并提示失败）
        if (data && data.qrcode_url) {
            imgEl.src = data.qrcode_url;
            if (data.fallback_qrcode) imgEl.dataset.fallback = data.fallback_qrcode;
            imgEl.alt = '微信扫码登录二维码';
        } else {
            showQrMask('error', { msg: '二维码生成失败，请点刷新' });
        }
    } else if (rendered) {
        // 本地生成成功，隐藏 loading 遮罩，露出真实二维码
        hideQrMask();
    }
    if (tipEl) tipEl.textContent = scanHint;
    updateCountdown();
    window._wxQrState.countdownTimer = setInterval(() => {
        window._wxQrState.remain = Math.max(0, window._wxQrState.remain - 1);
        updateCountdown();
        if (window._wxQrState.remain <= 0 && !window._wxQrState.finished) {
            stopWechatPolling(false);
            if (tipEl) tipEl.textContent = '二维码已过期';
            if (subTipEl) subTipEl.innerHTML = '点击 <a href="javascript:void(0)" onclick="refreshWechatQrcode()" style="color:#07C160;text-decoration:none;">刷新二维码</a> 重新登录';
            showQrMask('expired');
        }
    }, 1000);
    startWechatPolling();
}

function updateCountdown() {
    const el = document.getElementById('wx-qrcode-countdown');
    if (el) el.textContent = String(window._wxQrState.remain);
}

function startWechatPolling() {
    if (!window._wxQrState.sceneId) return;
    // 演示模式：后端不可达，轮询无意义，状态由模拟按钮本地驱动
    if (window._wxQrState.isDemo) return;

    // 优先尝试 SSE 长连接（仅本地后端支持，云端 Pages 单次推送后关闭会触发 onerror 降级到轮询）
    if (!window._wxQrState.sseFailed && window.EventSource) {
        try {
            const sid = window._wxQrState.sceneId;
            const url = api.wechatQrcodeStreamUrl(sid);
            const es = new EventSource(url);
            window._wxQrState.sse = es;
            es.onmessage = (ev) => {
                if (window._wxQrState.finished) { es.close(); return; }
                try {
                    const obj = JSON.parse(ev.data);
                    if (obj && obj.code === 0 && obj.data) {
                        window._wxQrState.retryCount = 0;
                        handleWechatQrStatus(obj.data);
                    }
                } catch (e) { /* 忽略解析失败的心跳行 */ }
            };
            es.onerror = () => {
                // 关闭并降级到轮询（Cloudflare Pages 单次推送后也会触发此处）
                try { es.close(); } catch {}
                window._wxQrState.sse = null;
                if (window._wxQrState.finished) return;
                // 仅首次失败降级；避免循环重连
                if (!window._wxQrState.sseFailed) {
                    window._wxQrState.sseFailed = true;
                    startPollingFallback();
                }
            };
            return;
        } catch (e) {
            window._wxQrState.sseFailed = true;
        }
    }
    startPollingFallback();
}

// 轮询降级：连续失败 3 次延长间隔，避免无后端时狂打请求
function startPollingFallback() {
    const tick = async () => {
        if (window._wxQrState.finished) return;
        const sid = window._wxQrState.sceneId;
        if (!sid) return;
        const data = await api.wechatQrcodeStatus(sid);
        // await 期间可能已 finished，复查避免 pending 覆盖错误遮罩
        if (window._wxQrState.finished) return;
        if (!data) {
            window._wxQrState.retryCount++;
            const delay = window._wxQrState.retryCount > 3 ? 5000 : 2500;
            window._wxQrState.pollingTimer = setTimeout(tick, delay);
            return;
        }
        window._wxQrState.retryCount = 0;
        handleWechatQrStatus(data);
        if (!window._wxQrState.finished) {
            window._wxQrState.pollingTimer = setTimeout(tick, 2000);
        }
    };
    window._wxQrState.pollingTimer = setTimeout(tick, 1500);
}

function stopWechatPolling(keepSession) {
    if (window._wxQrState.sse) {
        try { window._wxQrState.sse.close(); } catch {}
        window._wxQrState.sse = null;
    }
    if (window._wxQrState.pollingTimer) {
        clearTimeout(window._wxQrState.pollingTimer);
        window._wxQrState.pollingTimer = null;
    }
    if (window._wxQrState.countdownTimer) {
        clearInterval(window._wxQrState.countdownTimer);
        window._wxQrState.countdownTimer = null;
    }
    const sid = window._wxQrState.sceneId;
    if (!keepSession && sid) {
        api.wechatQrcodeCancel(sid).catch(() => {});
    }
}

// 取消当前扫码会话（waiting_confirm 状态下用户主动取消）
async function cancelWechatQrcode() {
    const sid = window._wxQrState.sceneId;
    if (sid && !window._wxQrState.isDemo) {
        try { await api.wechatQrcodeCancel(sid); } catch {}
    }
    window._wxQrState.finished = true;
    stopWechatPolling(true);
    showQrMask('cancelled', { msg: '用户已取消登录' });
}

function showQrMask(type, extra) {
    const maskEl = document.getElementById('wx-qrcode-mask');
    const iconEl = document.getElementById('wx-mask-icon');
    const textEl = document.getElementById('wx-mask-text');
    if (!maskEl) return;
    maskEl.style.display = 'flex';
    if (!extra) extra = {};
    if (type === 'loading') {
        maskEl.style.background = 'rgba(255,255,255,0.92)';
        if (iconEl) iconEl.innerHTML = '<i class="fas fa-spinner fa-pulse" style="color:#07C160;font-size:32px;"></i>';
        if (textEl) textEl.innerHTML = extra.msg || '正在生成二维码...';
    } else if (type === 'waiting') {
        maskEl.style.background = 'rgba(255,255,255,0.88)';
        if (iconEl) iconEl.innerHTML = '<i class="fas fa-mobile-alt" style="color:#07C160;"></i>';
        if (textEl) textEl.innerHTML = extra.msg || '等待扫码中...';
    } else if (type === 'waiting_confirm') {
        maskEl.style.background = 'rgba(240,253,244,0.96)';
        if (iconEl) iconEl.innerHTML = '<i class="fas fa-check-circle" style="color:#07C160;"></i>';
        // 已扫码状态：显示取消登录按钮，用户可在微信端取消
        if (textEl) textEl.innerHTML = (extra.msg || '已扫码，请在微信上确认登录') +
            '<div style="margin-top:14px;"><button onclick="cancelWechatQrcode()" style="background:#fff;border:1px solid #D1D5DB;color:#6B7280;padding:8px 18px;border-radius:18px;font-size:13px;cursor:pointer;"><i class="fas fa-times"></i> 取消登录</button></div>';
    } else if (type === 'confirmed') {
        maskEl.style.background = 'rgba(240,253,244,0.98)';
        if (iconEl) iconEl.innerHTML = '<i class="fas fa-check" style="color:#07C160;"></i>';
        if (textEl) textEl.innerHTML = extra.msg || '登录成功，正在跳转...';
    } else if (type === 'cancelled') {
        maskEl.style.background = 'rgba(254,242,242,0.96)';
        if (iconEl) iconEl.innerHTML = '<i class="fas fa-times-circle" style="color:#EF4444;"></i>';
        if (textEl) textEl.innerHTML = (extra.msg || '用户已取消登录') +
            '<div style="margin-top:14px;"><button onclick="refreshWechatQrcode()" style="background:#07C160;border:none;color:#fff;padding:8px 18px;border-radius:18px;font-size:13px;cursor:pointer;"><i class="fas fa-redo"></i> 重新生成</button></div>';
    } else if (type === 'expired') {
        maskEl.style.background = 'rgba(255,251,235,0.96)';
        if (iconEl) iconEl.innerHTML = '<i class="fas fa-hourglass-half" style="color:#F59E0B;"></i>';
        if (textEl) textEl.innerHTML = (extra.msg || '二维码已过期') +
            '<div style="margin-top:14px;"><button onclick="refreshWechatQrcode()" style="background:#07C160;border:none;color:#fff;padding:8px 18px;border-radius:18px;font-size:13px;cursor:pointer;"><i class="fas fa-redo"></i> 刷新二维码</button></div>';
    } else if (type === 'error') {
        maskEl.style.background = 'rgba(254,242,242,0.96)';
        if (iconEl) iconEl.innerHTML = '<i class="fas fa-exclamation-triangle" style="color:#EF4444;"></i>';
        if (textEl) textEl.innerHTML = (extra.msg || '登录异常，请重试') +
            '<div style="margin-top:14px;"><button onclick="refreshWechatQrcode()" style="background:#07C160;border:none;color:#fff;padding:8px 18px;border-radius:18px;font-size:13px;cursor:pointer;"><i class="fas fa-redo"></i> 重试</button></div>';
    }
}

function hideQrMask() {
    const maskEl = document.getElementById('wx-qrcode-mask');
    if (maskEl) maskEl.style.display = 'none';
}

// 二维码图片加载失败处理：防 onerror 死循环，失败一次即停止并提示
function handleQrImgError(img) {
    if (!img || img.dataset.err) return; // 防重入
    img.dataset.err = '1';
    img.alt = '二维码加载失败，请点刷新';
    // 标记结束并停止轮询，避免 pending 状态的 hideQrMask 覆盖错误遮罩
    window._wxQrState.finished = true;
    stopWechatPolling(true);
    showQrMask('error', { msg: '二维码加载失败，请点刷新' });
}

function handleWechatQrStatus(data) {
    const status = data.status || 'pending';
    const tipEl = document.getElementById('wx-qrcode-tip');
    if (status === 'pending') {
        hideQrMask();
        if (tipEl) tipEl.textContent = data.msg || '请使用微信扫一扫登录';
    } else if (status === 'waiting_confirm') {
        if (tipEl) tipEl.textContent = '已扫码';
        showQrMask('waiting_confirm', { msg: data.msg });
    } else if (status === 'confirmed') {
        window._wxQrState.finished = true;
        stopWechatPolling(true);
        showQrMask('confirmed', { msg: data.msg });
        setTimeout(() => {
            const token = data.token;
            const userId = data.user_id;
            const user = data.user;
            if (token && userId) {
                Auth.setSession(token, userId, user || null);
                showToast('扫码登录成功，欢迎 ' + ((user && user.name) || '微信用户'), 'success');
                if (typeof updateUserUI === 'function') updateUserUI(user);
                closeModal();
                setTimeout(() => renderProfilePage(document.querySelector('.content-scroll')), 600);
            } else {
                showToast('扫码登录异常，未获取到登录态', 'error');
            }
        }, 600);
    } else if (status === 'cancelled') {
        window._wxQrState.finished = true;
        stopWechatPolling(true);
        showQrMask('cancelled', { msg: data.msg });
        // 不自动刷新，由用户点击遮罩内「重新生成」按钮触发
    } else if (status === 'expired') {
        window._wxQrState.finished = true;
        stopWechatPolling(true);
        showQrMask('expired', { msg: data.msg });
        // 不自动刷新，由用户点击遮罩内「刷新二维码」按钮触发
    }
}

async function mockWechatAction(action) {
    if (!window._wxQrState.sceneId) {
        showToast('请先生成二维码', 'warning');
        return;
    }
    // 演示模式（后端不可达）：本地模拟扫码流程，不调用后端
    if (window._wxQrState.isDemo) {
        if (action === 'scan') {
            window._wxQrState._mockScanned = true;
            handleWechatQrStatus({ status: 'waiting_confirm', msg: '已扫码，请在微信上确认登录（演示）' });
            showToast('已模拟扫码（演示）', 'success');
        } else if (action === 'confirm') {
            window._wxQrState._mockScanned = true;
            const demoUid = 'demo_' + Date.now().toString(36);
            handleWechatQrStatus({
                status: 'confirmed',
                token: 'demo_token_' + Date.now().toString(36),
                user_id: demoUid,
                user: { id: demoUid, name: '微信演示用户', avatar: '', role: 'student' },
                msg: '登录成功（演示模式），正在跳转...'
            });
            showToast('模拟扫码确认登录成功（演示）', 'success');
        } else if (action === 'cancel') {
            window._wxQrState._mockScanned = false;
            handleWechatQrStatus({ status: 'cancelled', msg: '用户已取消登录（演示）' });
            showToast('已取消扫码登录（演示）', 'info');
        }
        return;
    }
    if (action === 'confirm' && !window._wxQrState._mockScanned) {
        // 若没先模拟扫码，则先自动做一次 scan
        await api.wechatQrcodeMockScan(window._wxQrState.sceneId, 'scan');
        window._wxQrState._mockScanned = true;
        handleWechatQrStatus({ status: 'waiting_confirm', msg: '已扫码，请在微信上确认登录' });
        showToast('已模拟扫码', 'info');
        await new Promise(r => setTimeout(r, 700));
    }
    const res = await api.wechatQrcodeMockScan(window._wxQrState.sceneId, action);
    if (!res) {
        showToast('模拟' + (action === 'scan' ? '扫码' : action === 'confirm' ? '确认' : '取消') + '失败', 'error');
        return;
    }
    if (action === 'scan') {
        window._wxQrState._mockScanned = true;
        handleWechatQrStatus({ status: 'waiting_confirm', msg: '已扫码，请在微信上确认登录' });
        showToast('已模拟扫码，请点击模拟确认完成登录', 'success');
    } else if (action === 'confirm') {
        window._wxQrState._mockScanned = true;
        handleWechatQrStatus({
            status: 'confirmed',
            token: res.token,
            user_id: res.user_id,
            user: res.user,
            msg: '登录成功，正在跳转...'
        });
        showToast(res.msg || '模拟扫码确认登录成功', 'success');
    } else if (action === 'cancel') {
        window._wxQrState._mockScanned = false;
        handleWechatQrStatus({ status: 'cancelled', msg: res.msg || '用户已取消登录' });
        showToast(res.msg || '已取消扫码登录', 'info');
    }
}

// 验证码发送（通用）
// 用 event 上下文定位触发的按钮所在表单，避免模态框/完整页面 ID 冲突
async function handleSmsSend(event) {
    const btn = event && event.target ? event.target.closest('button') : document.getElementById('sms-send-btn');
    const form = btn ? btn.closest('form') : null;
    const phoneEl = form ? form.querySelector('#sms-phone, [id="sms-phone"]') : document.getElementById('sms-phone');
    const phone = phoneEl ? phoneEl.value.trim() : '';
    if (!phone || !/^1\d{10}$/.test(phone)) {
        return showToast('请输入正确的11位手机号', 'warning');
    }
    if (btn) { btn.disabled = true; btn.textContent = '发送中...'; }

    const data = await api.smsSend(phone);
    if (btn) btn.disabled = false;

    if (data && data.code) {
        // 显示验证码（演示模式）
        openModal('验证码已发送', `
            <div style="text-align:center;padding:20px;">
                <div style="font-size:13px;color:#6B7280;margin-bottom:8px;">验证码已发送到 ${phone}</div>
                <div style="font-size:36px;font-weight:800;color:#3B82F6;letter-spacing:8px;margin:16px 0;">${data.code}</div>
                <div style="font-size:12px;color:#9CA3AF;">有效期5分钟，请在下方输入</div>
                <button class="btn-primary" style="margin-top:16px;" onclick="closeModal()">知道了</button>
            </div>
        `);
        // 60秒倒计时（用按钮引用，不依赖全局 ID）
        if (btn) startSmsCountdownBtn(btn);
        showToast('验证码已发送', 'success');
    } else {
        showToast('验证码发送失败', 'error');
        if (btn) btn.textContent = '获取验证码';
    }
}

// 家长绑定专用验证码发送
async function handleSmsSendForParent(event) {
    const btn = event && event.target ? event.target.closest('button') : null;
    const form = btn ? btn.closest('form') : document.getElementById('parent-bind-form');
    const phoneEl = form ? form.querySelector('#bind-parent-phone, [id="bind-parent-phone"]') : document.getElementById('bind-parent-phone');
    const phone = phoneEl ? phoneEl.value.trim() : '';
    if (!phone || !/^1\d{10}$/.test(phone)) {
        return showToast('请输入正确的家长手机号', 'warning');
    }
    const data = await api.smsSend(phone);
    if (data && data.code) {
        openModal('家长验证码已发送', `
            <div style="text-align:center;padding:20px;">
                <div style="font-size:13px;color:#6B7280;margin-bottom:8px;">验证码已发送到 ${phone}</div>
                <div style="font-size:36px;font-weight:800;color:#3B82F6;letter-spacing:8px;margin:16px 0;">${data.code}</div>
                <div style="font-size:12px;color:#9CA3AF;">请将验证码填入家长绑定表单</div>
                <button class="btn-primary" style="margin-top:16px;" onclick="closeModal()">知道了</button>
            </div>
        `);
    } else {
        showToast('验证码发送失败', 'error');
    }
}

// 验证码登录
async function handleSmsLogin(event) {
    event.preventDefault();
    const form = event.target;
    const phoneEl = form.querySelector('#sms-phone, [id="sms-phone"]');
    const codeEl = form.querySelector('#sms-code, [id="sms-code"]');
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const code = codeEl ? codeEl.value.trim() : '';
    if (!phone || !code) return showToast('请输入手机号和验证码', 'warning');

    const data = await api.smsLogin(phone, code);
    if (data && data.token) {
        Auth.setSession(data.token, data.user_id, data.user);
        showToast('验证码登录成功，欢迎 ' + (data.user.name || phone), 'success');
        if (typeof updateUserUI === 'function') updateUserUI(data.user);
        setTimeout(() => renderProfilePage(document.querySelector('.content-scroll')), 500);
    } else {
        showToast('验证码错误或已过期', 'error');
    }
}

// 家长绑定
async function handleParentBind(event) {
    event.preventDefault();
    const form = event.target;
    const studentPhoneEl = form.querySelector('#bind-student-phone, [id="bind-student-phone"]');
    const parentPhoneEl = form.querySelector('#bind-parent-phone, [id="bind-parent-phone"]');
    const smsCodeEl = form.querySelector('#bind-sms-code, [id="bind-sms-code"]');
    const studentPhone = studentPhoneEl ? studentPhoneEl.value.trim() : '';
    const parentPhone = parentPhoneEl ? parentPhoneEl.value.trim() : '';
    const relation = window._selectedRelation || '父亲';
    const smsCode = smsCodeEl ? smsCodeEl.value.trim() : '';

    if (!studentPhone || !parentPhone) return showToast('请填写完整信息', 'warning');

    const data = await api.parentBind(studentPhone, parentPhone, relation, smsCode || null);
    if (data) {
        showToast('家长绑定申请已提交，等待学生确认', 'success');
        setTimeout(() => renderProfilePage(document.querySelector('.content-scroll')), 500);
    }
}

// 确认家长绑定
async function confirmBinding(id) {
    const data = await api.confirmParentBinding(id);
    if (data) {
        showToast('已确认家长绑定', 'success');
        setTimeout(() => renderProfilePage(document.querySelector('.content-scroll')), 500);
    }
}

// 验证码倒计时（按按钮 ID，兼容旧调用）
function startSmsCountdown(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    startSmsCountdownBtn(btn);
}

// 验证码倒计时（按按钮引用，不依赖全局 ID，支持模态框/完整页面多实例）
function startSmsCountdownBtn(btn) {
    if (!btn) return;
    let seconds = 60;
    btn.disabled = true;
    const originalText = '获取验证码';
    btn.textContent = `${seconds}s 后重发`;
    const timer = setInterval(() => {
        seconds--;
        if (seconds <= 0) {
            clearInterval(timer);
            btn.disabled = false;
            btn.textContent = originalText;
        } else {
            btn.textContent = `${seconds}s 后重发`;
        }
    }, 1000);
}

// 处理登录（用 form 上下文查找元素，支持模态框/完整页面多实例）
async function handleLogin(event) {
    event.preventDefault();
    const form = event.target;
    const usernameEl = form.querySelector('#login-username, [id="login-username"]');
    const passwordEl = form.querySelector('#login-password, [id="login-password"]');
    const username = usernameEl ? usernameEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value : '';
    if (!username || !password) return showToast('请输入用户名和密码', 'warning');

    const btn = form.querySelector('.auth-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 登录中...';
    btn.disabled = true;

    const data = await api.login(username, password);
    btn.innerHTML = originalText;
    btn.disabled = false;

    if (data && data.token) {
        Auth.setSession(data.token, data.user_id, data.user);
        showToast('登录成功，欢迎回来 ' + (data.user.name || username), 'success');
        // 更新顶部欢迎语
        if (typeof updateUserUI === 'function') updateUserUI(data.user);
        // 重新渲染个人中心
        setTimeout(() => renderProfilePage(document.querySelector('.content-scroll')), 500);
    } else {
        showToast('登录失败：用户名或密码错误', 'error');
    }
}

// 处理注册（用 form 上下文查找元素，支持模态框/完整页面多实例）
async function handleRegister(event) {
    event.preventDefault();
    const form = event.target;
    const usernameEl = form.querySelector('#reg-username, [id="reg-username"]');
    const passwordEl = form.querySelector('#reg-password, [id="reg-password"]');
    const password2El = form.querySelector('#reg-password2, [id="reg-password2"]');
    const nameEl = form.querySelector('#reg-name, [id="reg-name"]');
    const agreeBox = form.querySelector('.agree-box');
    const username = usernameEl ? usernameEl.value.trim() : '';
    const password = passwordEl ? passwordEl.value : '';
    const password2 = password2El ? password2El.value : '';
    const name = nameEl ? nameEl.value.trim() : '';
    if (!username || !password) return showToast('请输入用户名和密码', 'warning');
    if (password.length < 6) return showToast('密码至少6位', 'warning');
    if (password !== password2) return showToast('两次密码不一致', 'warning');
    if (!agreeBox || !agreeBox.classList.contains('checked')) return showToast('请先同意用户协议和隐私政策', 'warning');

    const btn = event.target.querySelector('.auth-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 注册中...';
    btn.disabled = true;

    const data = await api.register(username, password, name);
    btn.innerHTML = originalText;
    btn.disabled = false;

    if (data && data.token) {
        Auth.setSession(data.token, data.user_id, data.user);
        showToast('注册成功，欢迎加入 ' + (data.user.name || username), 'success');
        if (typeof updateUserUI === 'function') updateUserUI(data.user);
        setTimeout(() => renderProfilePage(document.querySelector('.content-scroll')), 500);
    } else {
        showToast('注册失败：用户名可能已被占用', 'error');
    }
}

// 处理退出登录
async function handleLogout() {
    await api.logout();
    Auth.clear();
    showToast('已退出登录', 'info');
    // 更新顶部欢迎语为默认
    const welcomeEl = document.getElementById('welcome-text');
    if (welcomeEl) welcomeEl.textContent = 'Hi, 访客 👋';
    setTimeout(() => renderProfilePage(document.querySelector('.content-scroll')), 500);
}

// ====== ZH 徽章弹窗：登录 / 注册 / 已登录态 ======
// 点击顶部 ZH 头像徽章时弹出登录注册弹窗（不跳转页面）
async function openAuthModal() {
    if (Auth.isLoggedIn()) {
        // 已登录：显示账户信息 + 退出登录
        const user = await api.getUser();
        if (!user) { Auth.clear(); return openAuthModal(); }
        openModal('账户信息', `
            <div style="text-align:center;padding:10px 6px 6px;">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name||'user')}" style="width:72px;height:72px;border-radius:50%;margin-bottom:10px;">
                <div style="font-size:18px;font-weight:700;">${user.name||'--'}</div>
                <div style="color:#6B7280;font-size:13px;margin-top:2px;">${user.grade||'--'} · ${user.province||'--'}</div>
                <div style="margin-top:8px;display:inline-flex;align-items:center;gap:6px;background:#ECFDF5;color:#047857;padding:4px 10px;border-radius:12px;font-size:12px;"><i class="fas fa-check-circle"></i> 已登录</div>
            </div>
            <div style="margin-top:14px;display:flex;flex-direction:column;gap:8px;">
                <div style="display:flex;justify-content:space-between;padding:8px 4px;border-bottom:1px solid #F3F4F6;font-size:13px;"><span style="color:#6B7280;">目标分数</span><strong>${user.target_score||'--'} 分</strong></div>
                <div style="display:flex;justify-content:space-between;padding:8px 4px;border-bottom:1px solid #F3F4F6;font-size:13px;"><span style="color:#6B7280;">当前估分</span><strong>${user.current_score||'--'} 分</strong></div>
                <div style="display:flex;justify-content:space-between;padding:8px 4px;border-bottom:1px solid #F3F4F6;font-size:13px;"><span style="color:#6B7280;">高考日期</span><strong>${user.exam_date||'--'}</strong></div>
            </div>
            <div style="margin-top:18px;display:flex;gap:10px;">
                <button class="btn-primary" style="flex:1;height:40px;border-radius:20px;" onclick="closeModal();editGoalScore()"><i class="fas fa-edit"></i> 编辑目标分</button>
                <button class="btn-danger" style="flex:1;height:40px;border-radius:20px;" onclick="handleLogout()"><i class="fas fa-sign-out-alt"></i> 退出登录</button>
            </div>
        `);
        return;
    }
    // 未登录：弹出登录/注册表单（与完整页面共用 renderAuthPanels）
    openModal('登录 / 注册', renderAuthPanels());
    // 绑定关系选择器默认值
    window._selectedRelation = '父亲';
    // 默认展示密码登录 tab（含登录/注册子tab）
    switchAuthTab('password');
}

// ============================================================
// ========== 首页模块编辑模式系统 ==========
// ============================================================

// 编辑模式状态
let editMode = false;
// 模块配置缓存
let moduleConfigs = {};

// 各模块定义：key → { name, desc, icon }
const MODULE_DEFS = {
    'goal':       { name: '高考目标分',   desc: '当前估分、目标分数、达成率',     icon: 'fa-bullseye' },
    'plan':       { name: '今日学习计划', desc: '今日学习任务列表',               icon: 'fa-calendar-check' },
    'weak-points':{ name: '薄弱知识点',   desc: '知识点掌握情况与提分建议',       icon: 'fa-chart-bar' },
    'radar':      { name: '学科能力雷达图', desc: '各科得分与能力雷达',           icon: 'fa-project-diagram' },
    'recommend':  { name: 'AI智能推荐',   desc: '智能组卷/错题/考点/真题入口',    icon: 'fa-robot' },
    'calendar':   { name: '学习日历',     desc: '本周学习情况与打卡',             icon: 'fa-calendar' },
    'exam-predict':{ name: '模考预测',    desc: '预测分数、排名、置信度',         icon: 'fa-chart-line' },
    'growth':     { name: '成长记录',     desc: '学习时长、题目、正确率、积分',   icon: 'fa-seedling' },
    'banner':     { name: '高考冲刺计划', desc: '底部横幅标题与描述',             icon: 'fa-graduation-cap' }
};

// 切换编辑模式
function toggleEditMode() {
    editMode = !editMode;
    document.body.classList.toggle('edit-mode', editMode);

    const btn = document.getElementById('edit-mode-toggle');
    if (btn) {
        btn.innerHTML = editMode
            ? '<i class="fas fa-check"></i> 完成编辑'
            : '<i class="fas fa-edit"></i> 编辑模式';
        btn.classList.toggle('active', editMode);
    }

    if (editMode) {
        injectEditOverlays();
        showToast('编辑模式已开启，点击各模块右上角按钮进行编辑或导入本地资料', 'info');
    } else {
        removeEditOverlays();
        showToast('编辑模式已关闭', 'info');
    }
}

// 为每个可编辑卡片注入悬浮编辑按钮
function injectEditOverlays() {
    const cards = document.querySelectorAll('[data-module]');
    cards.forEach(card => {
        if (card.querySelector('.module-edit-overlay')) return;
        const key = card.dataset.module;
        const def = MODULE_DEFS[key];
        if (!def) return;

        const overlay = document.createElement('div');
        overlay.className = 'module-edit-overlay';
        overlay.innerHTML = `
            <div class="module-edit-badge"><i class="fas fa-pen"></i> 可编辑</div>
            <div class="module-edit-actions">
                <button class="module-edit-btn" onclick="event.stopPropagation();editModule('${key}')" title="编辑「${def.name}」">
                    <i class="fas fa-edit"></i> 编辑
                </button>
                <button class="module-import-btn" onclick="event.stopPropagation();importModuleFile('${key}')" title="从本地电脑导入资料">
                    <i class="fas fa-file-import"></i> 导入
                </button>
                <button class="module-reset-btn" onclick="event.stopPropagation();resetModule('${key}')" title="重置为默认">
                    <i class="fas fa-undo"></i> 重置
                </button>
            </div>
        `;
        card.style.position = 'relative';
        card.appendChild(overlay);
    });
}

// 移除编辑按钮
function removeEditOverlays() {
    document.querySelectorAll('.module-edit-overlay').forEach(el => el.remove());
}

// ========== 编辑模块通用入口 ==========
function editModule(key) {
    const def = MODULE_DEFS[key];
    if (!def) return;
    const config = moduleConfigs[key] || {};

    switch (key) {
        case 'goal':        return editGoalModule(config);
        case 'plan':        return editPlanModule(config);
        case 'weak-points': return editWeakPointsModule(config);
        case 'radar':       return editRadarModule(config);
        case 'recommend':   return editRecommendModule(config);
        case 'calendar':    return editCalendarModule(config);
        case 'exam-predict':return editExamPredictModule(config);
        case 'growth':      return editGrowthModule(config);
        case 'banner':      return editBannerModule(config);
    }
}

// ========== 通用：编辑弹窗中的"导入本地文件"区域 ==========
function renderImportSection(key) {
    return `
        <div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:10px;padding:12px 14px;margin-top:16px;">
            <div style="font-size:13px;font-weight:600;color:#0369A1;margin-bottom:8px;">
                <i class="fas fa-file-import"></i> 从本地电脑导入资料
            </div>
            <div style="font-size:12px;color:#6B7280;margin-bottom:10px;line-height:1.5;">
                支持 JSON / CSV / TXT 格式。选择文件后自动解析并填充到编辑表单中。
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <label class="modal-btn secondary" style="padding:6px 12px;font-size:12px;cursor:pointer;">
                    <i class="fas fa-upload"></i> 选择本地文件
                    <input type="file" accept=".json,.csv,.txt" style="display:none;" onchange="handleFileSelect(event,'${key}')">
                </label>
                <button class="modal-btn secondary" style="padding:6px 12px;font-size:12px;" onclick="pasteImportData('${key}')">
                    <i class="fas fa-paste"></i> 粘贴文本导入
                </button>
            </div>
            <div id="file-import-result" style="margin-top:8px;"></div>
        </div>
    `;
}

// 处理文件选择（通过 FileReader 读取本地文件）
function handleFileSelect(event, key) {
    const file = event.target.files[0];
    if (!file) return;

    const resultDiv = document.getElementById('file-import-result');
    resultDiv.innerHTML = `<div style="font-size:12px;color:#3B82F6;"><i class="fas fa-spinner fa-spin"></i> 正在读取 ${file.name}...</div>`;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const ext = file.name.split('.').pop().toLowerCase();
        let format = 'text';
        if (ext === 'json') format = 'json';
        else if (ext === 'csv') format = 'csv';

        try {
            let parsed = null;
            if (format === 'json') {
                parsed = JSON.parse(content);
            } else if (format === 'csv') {
                const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
                if (lines.length >= 2) {
                    const headers = lines[0].split(',').map(h => h.trim());
                    parsed = { items: [] };
                    for (let i = 1; i < lines.length; i++) {
                        const values = lines[i].split(',').map(v => v.trim());
                        const row = {};
                        headers.forEach((h, j) => { row[h] = values[j] || ''; });
                        parsed.items.push(row);
                    }
                }
            } else {
                parsed = {};
                content.split('\n').forEach(line => {
                    const idx = line.indexOf(':');
                    if (idx > 0) {
                        const k = line.slice(0, idx).trim();
                        const v = line.slice(idx + 1).trim();
                        const num = parseFloat(v);
                        parsed[k] = isNaN(num) ? v : num;
                    }
                });
            }

            resultDiv.innerHTML = `<div style="font-size:12px;color:#10B981;"><i class="fas fa-check-circle"></i> 文件 ${file.name} 解析成功！已自动填充到表单下方。</div>`;
            // 将解析结果填入编辑表单
            applyImportToForm(key, parsed);
            showToast(`文件 ${file.name} 导入成功`, 'success');
        } catch (err) {
            resultDiv.innerHTML = `<div style="font-size:12px;color:#EF4444;"><i class="fas fa-exclamation-circle"></i> 解析失败: ${err.message}</div>`;
            showToast('文件解析失败', 'error');
        }
    };
    reader.readAsText(file);
}

// 粘贴文本导入
function pasteImportData(key) {
    const def = MODULE_DEFS[key];
    const bodyHTML = `
        <div style="margin-bottom:12px;">
            <div style="font-size:13px;color:#374151;margin-bottom:8px;">将本地电脑中的资料内容粘贴到下方文本框，系统会自动解析并导入到「${def.name}」模块。</div>
            <div style="font-size:12px;color:#6B7280;margin-bottom:8px;">支持格式：<strong>JSON</strong>（对象/数组）| <strong>CSV</strong>（逗号分隔，首行表头）| <strong>文本</strong>（key: value 逐行）</div>
            <textarea id="paste-textarea" style="width:100%;min-height:200px;border:1px solid #D1D5DB;border-radius:8px;padding:10px;font-size:12px;font-family:monospace;" placeholder='JSON示例: {"current_score":580,"target_score":640}&#10;CSV示例: 科目,分数,满分&#10;数学,120,150&#10;英语,130,150&#10;文本示例:&#10;current_score: 580&#10;target_score: 640'></textarea>
            <div id="paste-result" style="margin-top:8px;"></div>
        </div>
        <div class="modal-footer" style="border:none;padding:10px 0 0;">
            <button class="modal-btn secondary" onclick="closeModal()">取消</button>
            <button class="modal-btn primary" onclick="submitPasteImport('${key}')">
                <i class="fas fa-download"></i> 解析并导入
            </button>
        </div>
    `;
    openModal('粘贴导入 - ' + def.name, bodyHTML);
}

async function submitPasteImport(key) {
    const textarea = document.getElementById('paste-textarea');
    const resultDiv = document.getElementById('paste-result');
    const text = textarea.value.trim();
    if (!text) { showToast('请先粘贴内容', 'warning'); return; }

    let format = 'text';
    let data = text;
    if (text.startsWith('{') || text.startsWith('[')) format = 'json';
    else if (text.split('\n')[0].includes(',')) format = 'csv';

    resultDiv.innerHTML = '<div style="text-align:center;padding:8px;"><i class="fas fa-spinner fa-spin" style="color:#3B82F6;"></i> 正在导入...</div>';
    const result = await api.importModuleData(key, format, data);
    if (result) {
        resultDiv.innerHTML = `<div style="background:#ECFDF5;border:1px solid #6EE7B7;border-radius:8px;padding:10px;color:#065F46;font-size:13px;"><i class="fas fa-check-circle"></i> 导入成功！</div>`;
        moduleConfigs[key] = result.config;
        showToast('导入成功，正在刷新模块...', 'success');
        setTimeout(() => { closeModal(); applyModuleConfig(key, result.config); }, 1000);
    } else {
        resultDiv.innerHTML = `<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:10px;color:#991B1B;font-size:13px;"><i class="fas fa-exclamation-circle"></i> 导入失败，请检查格式</div>`;
    }
}

// 将导入的数据应用到编辑表单
function applyImportToForm(key, data) {
    if (!data) return;
    // 通用逻辑：遍历 data 的 key，如果表单中有对应 id 的 input，则填入
    const fillForm = (obj, prefix = '') => {
        Object.keys(obj).forEach(k => {
            const inputId = prefix ? `${prefix}_${k}` : `edit-${k}`;
            const input = document.getElementById(inputId);
            if (input && typeof obj[k] !== 'object') {
                input.value = obj[k];
            }
        });
    };
    fillForm(data);

    // 如果是列表数据（items 数组），提示用户
    if (data.items && Array.isArray(data.items)) {
        const resultDiv = document.getElementById('file-import-result');
        if (resultDiv) {
            resultDiv.innerHTML += `<div style="font-size:12px;color:#8B5CF6;margin-top:6px;">检测到 ${data.items.length} 条记录，保存后将更新模块列表。</div>`;
        }
        // 存到临时变量供保存时使用
        window._importedItems = window._importedItems || {};
        window._importedItems[key] = data.items;
    }
}

// ========== 各模块编辑弹窗 ==========

// 1. 高考目标分
function editGoalModule(config) {
    const current = config.current_score || document.getElementById('current-score-num')?.textContent || '615';
    const target = config.target_score || document.getElementById('target-score-num')?.textContent || '633';
    const examDate = config.exam_date || '2026-06-07';

    openModal('编辑 - 高考目标分', `
        <div style="display:flex;flex-direction:column;gap:14px;">
            <div>
                <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">当前估分</label>
                <input type="number" id="edit-current_score" value="${current}" min="0" max="750" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:8px;font-size:14px;">
            </div>
            <div>
                <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">目标分数</label>
                <input type="number" id="edit-target_score" value="${target}" min="0" max="750" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:8px;font-size:14px;">
            </div>
            <div>
                <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">高考日期</label>
                <input type="date" id="edit-exam_date" value="${examDate}" style="width:100%;padding:8px 10px;border:1px solid #D1D5DB;border-radius:8px;font-size:14px;">
            </div>
            ${renderImportSection('goal')}
            <div class="modal-footer" style="border:none;padding:10px 0 0;">
                <button class="modal-btn secondary" onclick="closeModal()">取消</button>
                <button class="modal-btn primary" onclick="saveModuleFromForm('goal')">保存修改</button>
            </div>
        </div>
    `);
}

// 2. 今日学习计划
function editPlanModule(config) {
    const items = config.items || [];
    const itemsHTML = items.length ? items.map((item, i) => `
        <div class="edit-list-item" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
            <input type="text" placeholder="科目" value="${item.subject || ''}" class="edit-plan-subject" style="width:60px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
            <input type="text" placeholder="任务名称" value="${item.name || ''}" class="edit-plan-name" style="flex:1;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
            <input type="text" placeholder="时长" value="${item.time || ''}" class="edit-plan-time" style="width:70px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
            <button class="modal-btn secondary" style="padding:4px 8px;font-size:12px;" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
        </div>
    `).join('') : '<div style="color:#9CA3AF;font-size:13px;padding:8px;">暂无任务，点击下方添加</div>';

    openModal('编辑 - 今日学习计划', `
        <div id="plan-items-container">${itemsHTML}</div>
        <button class="modal-btn secondary" style="margin-top:8px;padding:6px 12px;font-size:12px;" onclick="addPlanItem()">
            <i class="fas fa-plus"></i> 添加任务
        </button>
        ${renderImportSection('plan')}
        <div class="modal-footer" style="border:none;padding:10px 0 0;">
            <button class="modal-btn secondary" onclick="closeModal()">取消</button>
            <button class="modal-btn primary" onclick="saveModuleFromForm('plan')">保存修改</button>
        </div>
    `);
}

function addPlanItem() {
    const container = document.getElementById('plan-items-container');
    const div = document.createElement('div');
    div.className = 'edit-list-item';
    div.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px;';
    div.innerHTML = `
        <input type="text" placeholder="科目" class="edit-plan-subject" style="width:60px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
        <input type="text" placeholder="任务名称" class="edit-plan-name" style="flex:1;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
        <input type="text" placeholder="时长" class="edit-plan-time" style="width:70px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
        <button class="modal-btn secondary" style="padding:4px 8px;font-size:12px;" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(div);
}

// 3. 薄弱知识点
function editWeakPointsModule(config) {
    const items = config.items || [];
    const itemsHTML = items.length ? items.map((item, i) => `
        <div class="edit-list-item" style="display:flex;gap:6px;align-items:center;margin-bottom:8px;flex-wrap:wrap;">
            <input type="text" placeholder="科目" value="${item.subject || ''}" class="edit-wp-subject" style="width:55px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
            <input type="text" placeholder="知识点" value="${item.name || ''}" class="edit-wp-name" style="flex:1;min-width:100px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
            <input type="number" placeholder="掌握率%" value="${item.mastery_rate || ''}" class="edit-wp-mastery" style="width:70px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
            <input type="number" placeholder="提分" value="${item.score_gain || ''}" class="edit-wp-gain" style="width:60px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
            <input type="text" placeholder="建议" value="${item.advice || ''}" class="edit-wp-advice" style="width:80px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
            <button class="modal-btn secondary" style="padding:4px 8px;font-size:12px;" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
        </div>
    `).join('') : '<div style="color:#9CA3AF;font-size:13px;padding:8px;">暂无数据，点击下方添加或导入</div>';

    openModal('编辑 - 薄弱知识点', `
        <div style="font-size:12px;color:#6B7280;margin-bottom:8px;">字段：科目 | 知识点 | 掌握率(%) | 预计提分 | 建议</div>
        <div id="wp-items-container">${itemsHTML}</div>
        <button class="modal-btn secondary" style="margin-top:8px;padding:6px 12px;font-size:12px;" onclick="addWeakPointItem()">
            <i class="fas fa-plus"></i> 添加知识点
        </button>
        ${renderImportSection('weak-points')}
        <div class="modal-footer" style="border:none;padding:10px 0 0;">
            <button class="modal-btn secondary" onclick="closeModal()">取消</button>
            <button class="modal-btn primary" onclick="saveModuleFromForm('weak-points')">保存修改</button>
        </div>
    `);
}

function addWeakPointItem() {
    const container = document.getElementById('wp-items-container');
    const div = document.createElement('div');
    div.className = 'edit-list-item';
    div.style.cssText = 'display:flex;gap:6px;align-items:center;margin-bottom:8px;flex-wrap:wrap;';
    div.innerHTML = `
        <input type="text" placeholder="科目" class="edit-wp-subject" style="width:55px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
        <input type="text" placeholder="知识点" class="edit-wp-name" style="flex:1;min-width:100px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
        <input type="number" placeholder="掌握率%" class="edit-wp-mastery" style="width:70px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
        <input type="number" placeholder="提分" class="edit-wp-gain" style="width:60px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
        <input type="text" placeholder="建议" class="edit-wp-advice" style="width:80px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
        <button class="modal-btn secondary" style="padding:4px 8px;font-size:12px;" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(div);
}

// 4. 学科能力雷达图
function editRadarModule(config) {
    const items = config.items || [];
    const itemsHTML = items.length ? items.map(item => `
        <div class="edit-list-item" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
            <input type="text" placeholder="科目" value="${item.subject || ''}" class="edit-rd-subject" style="width:70px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
            <input type="number" placeholder="得分" value="${item.score || ''}" class="edit-rd-score" style="width:70px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
            <span style="color:#9CA3AF;">/</span>
            <input type="number" placeholder="满分" value="${item.max_score || ''}" class="edit-rd-max" style="width:70px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
            <button class="modal-btn secondary" style="padding:4px 8px;font-size:12px;" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
        </div>
    `).join('') : '<div style="color:#9CA3AF;font-size:13px;padding:8px;">暂无数据</div>';

    openModal('编辑 - 学科能力雷达图', `
        <div id="rd-items-container">${itemsHTML}</div>
        <button class="modal-btn secondary" style="margin-top:8px;padding:6px 12px;font-size:12px;" onclick="addRadarItem()">
            <i class="fas fa-plus"></i> 添加科目
        </button>
        ${renderImportSection('radar')}
        <div class="modal-footer" style="border:none;padding:10px 0 0;">
            <button class="modal-btn secondary" onclick="closeModal()">取消</button>
            <button class="modal-btn primary" onclick="saveModuleFromForm('radar')">保存修改</button>
        </div>
    `);
}

function addRadarItem() {
    const container = document.getElementById('rd-items-container');
    const div = document.createElement('div');
    div.className = 'edit-list-item';
    div.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:8px;';
    div.innerHTML = `
        <input type="text" placeholder="科目" class="edit-rd-subject" style="width:70px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
        <input type="number" placeholder="得分" class="edit-rd-score" style="width:70px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
        <span style="color:#9CA3AF;">/</span>
        <input type="number" placeholder="满分" class="edit-rd-max" style="width:70px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
        <button class="modal-btn secondary" style="padding:4px 8px;font-size:12px;" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(div);
}

// 5. AI智能推荐（编辑名称和描述）
function editRecommendModule(config) {
    const items = config.items || [
        { name: '智能组卷', desc: '根据你的薄弱点\n生成专属试卷' },
        { name: '错题强化', desc: '巩固薄弱知识点\n减少重复错误' },
        { name: '考点训练', desc: '高频考点专项训练\n精准提分' },
        { name: '真题演练', desc: '近10年真题精选\n掌握命题趋势' }
    ];
    const itemsHTML = items.map(item => `
        <div class="edit-list-item" style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
            <input type="text" placeholder="名称" value="${item.name || ''}" class="edit-rec-name" style="width:100px;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
            <input type="text" placeholder="描述（用\\n换行）" value="${(item.desc || '').replace(/\n/g, '\\n')}" class="edit-rec-desc" style="flex:1;padding:6px;border:1px solid #D1D5DB;border-radius:6px;font-size:13px;">
            <button class="modal-btn secondary" style="padding:4px 8px;font-size:12px;" onclick="this.parentElement.remove()"><i class="fas fa-trash"></i></button>
        </div>
    `).join('');

    openModal('编辑 - AI智能推荐', `
        <div id="rec-items-container">${itemsHTML}</div>
        ${renderImportSection('recommend')}
        <div class="modal-footer" style="border:none;padding:10px 0 0;">
            <button class="modal-btn secondary" onclick="closeModal()">取消</button>
            <button class="modal-btn primary" onclick="saveModuleFromForm('recommend')">保存修改</button>
        </div>
    `);
}

// 6. 学习日历
function editCalendarModule(config) {
    const hours = config.hours || 28;
    const totalHours = config.total_hours || 42;
    const taskDone = config.task_done || 3;
    const taskTotal = config.task_total || 4;
    const encourage = config.encourage || '继续加油！坚持就是胜利 💪';

    openModal('编辑 - 学习日历', `
        <div style="display:flex;flex-direction:column;gap:14px;">
            <div style="display:flex;gap:12px;">
                <div style="flex:1;"><label style="font-size:13px;display:block;margin-bottom:4px;">本周学习时长</label><input type="number" id="edit-hours" value="${hours}" style="width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:8px;"></div>
                <div style="flex:1;"><label style="font-size:13px;display:block;margin-bottom:4px;">目标时长</label><input type="number" id="edit-total_hours" value="${totalHours}" style="width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:8px;"></div>
            </div>
            <div style="display:flex;gap:12px;">
                <div style="flex:1;"><label style="font-size:13px;display:block;margin-bottom:4px;">今日完成任务</label><input type="number" id="edit-task_done" value="${taskDone}" style="width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:8px;"></div>
                <div style="flex:1;"><label style="font-size:13px;display:block;margin-bottom:4px;">总任务数</label><input type="number" id="edit-task_total" value="${taskTotal}" style="width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:8px;"></div>
            </div>
            <div><label style="font-size:13px;display:block;margin-bottom:4px;">鼓励语</label><input type="text" id="edit-encourage" value="${encourage}" style="width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:8px;"></div>
            ${renderImportSection('calendar')}
            <div class="modal-footer" style="border:none;padding:10px 0 0;">
                <button class="modal-btn secondary" onclick="closeModal()">取消</button>
                <button class="modal-btn primary" onclick="saveModuleFromForm('calendar')">保存修改</button>
            </div>
        </div>
    `);
}

// 7. 模考预测
function editExamPredictModule(config) {
    const score = config.predicted_score || 620;
    const rank = config.rank || 1286;
    const confidence = config.confidence || 85;
    const probability = config.probability || 67;

    openModal('编辑 - 模考预测', `
        <div style="display:flex;flex-direction:column;gap:14px;">
            <div><label style="font-size:13px;display:block;margin-bottom:4px;">预测分数</label><input type="number" id="edit-predicted_score" value="${score}" style="width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:8px;"></div>
            <div><label style="font-size:13px;display:block;margin-bottom:4px;">预测排名</label><input type="number" id="edit-rank" value="${rank}" style="width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:8px;"></div>
            <div><label style="font-size:13px;display:block;margin-bottom:4px;">置信度(%)</label><input type="number" id="edit-confidence" value="${confidence}" style="width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:8px;"></div>
            <div><label style="font-size:13px;display:block;margin-bottom:4px;">985概率(%)</label><input type="number" id="edit-probability" value="${probability}" style="width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:8px;"></div>
            ${renderImportSection('exam-predict')}
            <div class="modal-footer" style="border:none;padding:10px 0 0;">
                <button class="modal-btn secondary" onclick="closeModal()">取消</button>
                <button class="modal-btn primary" onclick="saveModuleFromForm('exam-predict')">保存修改</button>
            </div>
        </div>
    `);
}

// 8. 成长记录
function editGrowthModule(config) {
    const duration = config.duration_hours || 18.5;
    const questions = config.questions_count || 326;
    const correctRate = config.correct_rate || 78;
    const points = config.points || 1286;

    openModal('编辑 - 成长记录', `
        <div style="display:flex;flex-direction:column;gap:14px;">
            <div><label style="font-size:13px;display:block;margin-bottom:4px;">学习时长(小时)</label><input type="number" step="0.1" id="edit-duration_hours" value="${duration}" style="width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:8px;"></div>
            <div><label style="font-size:13px;display:block;margin-bottom:4px;">完成题目数</label><input type="number" id="edit-questions_count" value="${questions}" style="width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:8px;"></div>
            <div><label style="font-size:13px;display:block;margin-bottom:4px;">正确率(%)</label><input type="number" id="edit-correct_rate" value="${correctRate}" style="width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:8px;"></div>
            <div><label style="font-size:13px;display:block;margin-bottom:4px;">获得积分</label><input type="number" id="edit-points" value="${points}" style="width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:8px;"></div>
            ${renderImportSection('growth')}
            <div class="modal-footer" style="border:none;padding:10px 0 0;">
                <button class="modal-btn secondary" onclick="closeModal()">取消</button>
                <button class="modal-btn primary" onclick="saveModuleFromForm('growth')">保存修改</button>
            </div>
        </div>
    `);
}

// 9. 高考冲刺计划横幅
function editBannerModule(config) {
    const title = config.title || '高考冲刺计划';
    const desc = config.desc || '90天冲刺，科学规划，助你实现梦想大学！';
    const btnText = config.btn_text || '立即查看';

    openModal('编辑 - 高考冲刺计划', `
        <div style="display:flex;flex-direction:column;gap:14px;">
            <div><label style="font-size:13px;display:block;margin-bottom:4px;">标题</label><input type="text" id="edit-title" value="${title}" style="width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:8px;"></div>
            <div><label style="font-size:13px;display:block;margin-bottom:4px;">描述</label><textarea id="edit-desc" style="width:100%;min-height:60px;padding:8px;border:1px solid #D1D5DB;border-radius:8px;">${desc}</textarea></div>
            <div><label style="font-size:13px;display:block;margin-bottom:4px;">按钮文字</label><input type="text" id="edit-btn_text" value="${btnText}" style="width:100%;padding:8px;border:1px solid #D1D5DB;border-radius:8px;"></div>
            ${renderImportSection('banner')}
            <div class="modal-footer" style="border:none;padding:10px 0 0;">
                <button class="modal-btn secondary" onclick="closeModal()">取消</button>
                <button class="modal-btn primary" onclick="saveModuleFromForm('banner')">保存修改</button>
            </div>
        </div>
    `);
}

// ========== 从表单收集数据并保存 ==========
async function saveModuleFromForm(key) {
    let config = {};

    switch (key) {
        case 'goal':
            config.current_score = parseInt(document.getElementById('edit-current_score')?.value) || 0;
            config.target_score = parseInt(document.getElementById('edit-target_score')?.value) || 0;
            config.exam_date = document.getElementById('edit-exam_date')?.value || '';
            break;
        case 'plan':
            config.items = [];
            document.querySelectorAll('.edit-plan-subject').forEach((el, i) => {
                config.items.push({
                    subject: el.value,
                    name: document.querySelectorAll('.edit-plan-name')[i].value,
                    time: document.querySelectorAll('.edit-plan-time')[i].value
                });
            });
            break;
        case 'weak-points':
            config.items = [];
            document.querySelectorAll('.edit-wp-subject').forEach((el, i) => {
                config.items.push({
                    subject: el.value,
                    name: document.querySelectorAll('.edit-wp-name')[i].value,
                    mastery_rate: parseFloat(document.querySelectorAll('.edit-wp-mastery')[i].value) || 0,
                    score_gain: parseInt(document.querySelectorAll('.edit-wp-gain')[i].value) || 0,
                    advice: document.querySelectorAll('.edit-wp-advice')[i].value
                });
            });
            break;
        case 'radar':
            config.items = [];
            document.querySelectorAll('.edit-rd-subject').forEach((el, i) => {
                config.items.push({
                    subject: el.value,
                    score: parseInt(document.querySelectorAll('.edit-rd-score')[i].value) || 0,
                    max_score: parseInt(document.querySelectorAll('.edit-rd-max')[i].value) || 0
                });
            });
            break;
        case 'recommend':
            config.items = [];
            document.querySelectorAll('.edit-rec-name').forEach((el, i) => {
                config.items.push({
                    name: el.value,
                    desc: document.querySelectorAll('.edit-rec-desc')[i].value.replace(/\\n/g, '\n')
                });
            });
            break;
        case 'calendar':
            config.hours = parseFloat(document.getElementById('edit-hours')?.value) || 0;
            config.total_hours = parseFloat(document.getElementById('edit-total_hours')?.value) || 0;
            config.task_done = parseInt(document.getElementById('edit-task_done')?.value) || 0;
            config.task_total = parseInt(document.getElementById('edit-task_total')?.value) || 0;
            config.encourage = document.getElementById('edit-encourage')?.value || '';
            break;
        case 'exam-predict':
            config.predicted_score = parseInt(document.getElementById('edit-predicted_score')?.value) || 0;
            config.rank = parseInt(document.getElementById('edit-rank')?.value) || 0;
            config.confidence = parseInt(document.getElementById('edit-confidence')?.value) || 0;
            config.probability = parseInt(document.getElementById('edit-probability')?.value) || 0;
            break;
        case 'growth':
            config.duration_hours = parseFloat(document.getElementById('edit-duration_hours')?.value) || 0;
            config.questions_count = parseInt(document.getElementById('edit-questions_count')?.value) || 0;
            config.correct_rate = parseInt(document.getElementById('edit-correct_rate')?.value) || 0;
            config.points = parseInt(document.getElementById('edit-points')?.value) || 0;
            break;
        case 'banner':
            config.title = document.getElementById('edit-title')?.value || '';
            config.desc = document.getElementById('edit-desc')?.value || '';
            config.btn_text = document.getElementById('edit-btn_text')?.value || '';
            break;
    }

    // 如果有导入的列表数据，合并
    if (window._importedItems && window._importedItems[key]) {
        if (!config.items) config.items = window._importedItems[key];
        delete window._importedItems[key];
    }

    // 保存到后端
    showToast('正在保存...', 'info');
    const result = await api.saveModuleConfig(key, config);
    if (result !== null) {
        moduleConfigs[key] = config;
        applyModuleConfig(key, config);
        closeModal();
        showToast(`${MODULE_DEFS[key].name} 已保存并更新`, 'success');
        // 触发模块联动引擎（自动更新关联模块）
        await triggerLinkages(key, config);
        // 联动后重新绑定薄弱知识点点击事件
        if (key === 'weak-points') setTimeout(() => bindWeakPointClickEvents(), 500);
    } else {
        showToast('保存失败，请重试', 'error');
    }
}

// ========== 将配置应用到页面 DOM ==========
function applyModuleConfig(key, config) {
    if (!config) return;

    switch (key) {
        case 'goal':
            if (config.current_score) {
                const el = document.getElementById('current-score-num');
                if (el) el.textContent = config.current_score;
            }
            if (config.target_score) {
                const el = document.getElementById('target-score-num');
                if (el) el.textContent = config.target_score;
                const impEl = document.getElementById('improvement-num');
                if (impEl) impEl.textContent = config.target_score - (config.current_score || 0);
            }
            if (config.current_score && config.target_score) {
                const rate = Math.min(99, Math.round(config.current_score / config.target_score * 100));
                const rateEl = document.getElementById('goal-rate');
                const fillEl = document.getElementById('goal-progress-fill');
                if (rateEl) rateEl.textContent = rate + '%';
                if (fillEl) fillEl.style.width = rate + '%';
                // 更新折线图
                const chart = Chart.getChart('scoreChart');
                if (chart) {
                    const improvement = config.target_score - config.current_score;
                    chart.data.datasets[0].data = [
                        config.current_score,
                        Math.round(config.current_score + improvement * 0.3),
                        Math.round(config.current_score + improvement * 0.6),
                        config.target_score
                    ];
                    chart.update();
                }
            }
            break;

        case 'plan':
            const planList = document.querySelector('.plan-list');
            if (planList && config.items) {
                const subjectClass = { '数学': 'subject-math', '英语': 'subject-english', '物理': 'subject-physics', '化学': 'subject-chem', '语文': 'subject-chinese' };
                const subjectChar = { '数学': '数', '英语': '英', '物理': '物', '化学': '化', '语文': '语' };
                planList.innerHTML = config.items.map(item => `
                    <div class="plan-item">
                        <div class="plan-subject ${subjectClass[item.subject] || 'subject-math'}">${subjectChar[item.subject] || item.subject[0]}</div>
                        <div class="plan-name">${item.name}</div>
                        <div class="plan-time">${item.time}</div>
                    </div>
                `).join('');
                initInteractions();
            }
            break;

        case 'weak-points':
            const tbody = document.querySelector('.weak-table tbody');
            if (tbody && config.items) {
                const tagClass = { '数学': 'tag-math', '英语': 'tag-english', '物理': 'tag-physics', '化学': 'tag-chem', '语文': 'tag-chinese' };
                const tagText = { '数学': '数', '英语': '英', '物理': '物', '化学': '化', '语文': '语' };
                const fillClass = (rate) => rate < 45 ? 'red' : (rate < 55 ? 'orange' : (rate < 65 ? 'blue' : 'green'));
                const adviceClass = (rate) => {
                    if (rate < 45) return '<span class="advice advice-priority">优先突破</span>';
                    if (rate < 55) return '<span class="advice advice-focus">重点突破</span>';
                    if (rate < 65) return '<span class="advice advice-train">加强训练</span>';
                    return '<span class="advice advice-solid">巩固提升</span>';
                };
                tbody.innerHTML = config.items.map(item => {
                    const rate = item.mastery_rate || 0;
                    return `
                    <tr onclick="onWeakPointClick('${item.subject}','${item.name}')">
                        <td><span class="tag ${tagClass[item.subject] || 'tag-math'}">${tagText[item.subject] || '综'}</span>${item.name}</td>
                        <td>
                            <div class="mastery-bar"><div class="mastery-fill ${fillClass(rate)}" style="width:${rate}%"></div></div>
                            <span class="mastery-text">${rate}%</span>
                        </td>
                        <td><span class="score-gain">+${item.score_gain || 0}分</span></td>
                        <td>${adviceClass(rate)}</td>
                    </tr>`;
                }).join('');
                // 重新绑定联动点击事件
                bindWeakPointClickEvents();
            }
            break;

        case 'radar':
            const scoresContainer = document.querySelector('.subject-scores');
            if (scoresContainer && config.items) {
                scoresContainer.innerHTML = config.items.map(s => `
                    <div class="sub-score">
                        <div class="sub-name">${s.subject}</div>
                        <div class="sub-num">${s.score}/${s.max_score}</div>
                    </div>
                `).join('');
                const total = config.items.reduce((sum, s) => sum + s.score, 0);
                const radarScore = document.querySelector('.radar-score strong');
                if (radarScore) radarScore.textContent = total;
                // 更新雷达图
                const chart = Chart.getChart('radarChart');
                if (chart) {
                    chart.data.datasets[0].data = config.items.map(s => Math.round(s.score / s.max_score * 100));
                    chart.update();
                }
            }
            break;

        case 'recommend':
            const recGrid = document.querySelector('.recommend-grid');
            if (recGrid && config.items) {
                const iconMap = { '智能组卷': 'fa-file-alt', '错题强化': 'fa-times-circle', '考点训练': 'fa-bullseye', '真题演练': 'fa-book' };
                const colorMap = { '智能组卷': 'blue', '错题强化': 'orange', '考点训练': 'cyan', '真题演练': 'green' };
                recGrid.innerHTML = config.items.map(item => `
                    <div class="recommend-item">
                        <div class="recommend-info">
                            <div class="recommend-name">${item.name}</div>
                            <div class="recommend-desc">${(item.desc || '').replace(/\n/g, '<br>')}</div>
                            <button class="recommend-btn" onclick="handleRecommend('${item.name}')">${item.name === '真题演练' ? '去演练' : (item.name === '智能组卷' ? '去组卷' : (item.name === '错题强化' ? '去强化' : '去训练'))}</button>
                        </div>
                        <div class="recommend-icon ${colorMap[item.name] || 'blue'}">
                            <i class="fas ${iconMap[item.name] || 'fa-star'}"></i>
                        </div>
                    </div>
                `).join('');
            }
            break;

        case 'calendar':
            const hoursNum = document.querySelector('.hours-num');
            if (hoursNum && config.hours) hoursNum.textContent = config.hours;
            const hoursTotal = document.querySelector('.hours-total');
            if (hoursTotal && config.total_hours) hoursTotal.textContent = `/ ${config.total_hours} 小时`;
            const progressSpan = document.querySelector('.today-progress-label span:last-child');
            if (progressSpan && config.task_done && config.task_total) progressSpan.textContent = `${config.task_done}/${config.task_total}`;
            const progressFill = document.querySelector('.today-progress .progress-fill');
            if (progressFill && config.task_done && config.task_total) progressFill.style.width = Math.round(config.task_done / config.task_total * 100) + '%';
            const encourageEl = document.querySelector('.encourage-text');
            if (encourageEl && config.encourage) encourageEl.textContent = config.encourage;
            break;

        case 'exam-predict':
            const predictScore = document.querySelector('.predict-score');
            if (predictScore && config.predicted_score) predictScore.innerHTML = `${config.predicted_score}<span class="score-unit">分</span>`;
            const predictRank = document.querySelector('.predict-rank');
            if (predictRank && config.rank) predictRank.innerHTML = `预测排名：全省 <strong>${config.rank.toLocaleString()}</strong> 名`;
            const confidence = document.querySelector('.confidence');
            if (confidence && config.confidence) confidence.innerHTML = `置信度：<strong>${config.confidence}%</strong>`;
            const ringPercent = document.querySelector('.ring-percent');
            if (ringPercent && config.probability) ringPercent.textContent = config.probability + '%';
            const ringFill = document.querySelector('.ring-fill');
            if (ringFill && config.probability) {
                const circumference = 2 * Math.PI * 50;
                ringFill.style.strokeDashoffset = circumference - (config.probability / 100) * circumference;
            }
            break;

        case 'growth':
            const values = document.querySelectorAll('.growth-value');
            if (values.length >= 4) {
                if (config.duration_hours) values[0].textContent = config.duration_hours + ' 小时';
                if (config.questions_count) values[1].textContent = config.questions_count + ' 题';
                if (config.correct_rate) values[2].textContent = config.correct_rate + '%';
                if (config.points) values[3].textContent = config.points + ' 分';
            }
            break;

        case 'banner':
            const bannerTitle = document.querySelector('.banner-title');
            if (bannerTitle && config.title) bannerTitle.textContent = config.title;
            const bannerDesc = document.querySelector('.banner-desc');
            if (bannerDesc && config.desc) bannerDesc.textContent = config.desc;
            const bannerBtn = document.querySelector('.banner-btn');
            if (bannerBtn && config.btn_text) bannerBtn.textContent = config.btn_text;
            break;
    }
}

// ========== 重置模块为默认 ==========
async function resetModule(key) {
    if (!confirm(`确定要重置「${MODULE_DEFS[key].name}」为默认值吗？`)) return;
    showToast('正在重置...', 'info');
    const result = await api.resetModuleConfig(key);
    if (result !== null) {
        delete moduleConfigs[key];
        closeModal();
        showToast(`${MODULE_DEFS[key].name} 已重置为默认，刷新页面生效`, 'success');
        setTimeout(() => location.reload(), 1500);
    } else {
        showToast('重置失败', 'error');
    }
}

// ========== 直接触发文件选择（不打开编辑弹窗时）==========
function importModuleFile(key) {
    const def = MODULE_DEFS[key];
    openModal('导入本地资料 - ' + def.name, `
        <div style="background:#F0F9FF;border:1px solid #BAE6FD;border-radius:10px;padding:14px;margin-bottom:14px;">
            <div style="font-size:13px;font-weight:600;color:#0369A1;margin-bottom:8px;">
                <i class="fas fa-file-import"></i> 从本地电脑导入资料到「${def.name}」
            </div>
            <div style="font-size:12px;color:#6B7280;line-height:1.6;margin-bottom:12px;">
                选择本地电脑中的文件（JSON / CSV / TXT），系统会自动解析内容并更新模块。<br>
                导入后会保存到后端，刷新页面后仍然有效。
            </div>
            <label class="modal-btn primary" style="display:inline-block;padding:10px 20px;cursor:pointer;text-align:center;">
                <i class="fas fa-upload"></i> 选择本地文件
                <input type="file" accept=".json,.csv,.txt" style="display:none;" onchange="handleDirectFileImport(event,'${key}')">
            </label>
        </div>
        <div id="direct-import-result"></div>
        <div style="margin-top:12px;">
            <button class="modal-btn secondary" style="padding:6px 12px;font-size:12px;" onclick="pasteImportData('${key}')">
                <i class="fas fa-paste"></i> 或粘贴文本导入
            </button>
        </div>
        <div class="modal-footer" style="border:none;padding:10px 0 0;">
            <button class="modal-btn secondary" onclick="closeModal()">关闭</button>
        </div>
    `);
}

async function handleDirectFileImport(event, key) {
    const file = event.target.files[0];
    if (!file) return;
    const resultDiv = document.getElementById('direct-import-result');
    resultDiv.innerHTML = `<div style="font-size:13px;color:#3B82F6;"><i class="fas fa-spinner fa-spin"></i> 正在读取并导入 ${file.name}...</div>`;

    const reader = new FileReader();
    reader.onload = async function(e) {
        const content = e.target.result;
        const ext = file.name.split('.').pop().toLowerCase();
        let format = 'text';
        if (ext === 'json') format = 'json';
        else if (ext === 'csv') format = 'csv';

        const result = await api.importModuleData(key, format, content);
        if (result) {
            moduleConfigs[key] = result.config;
            applyModuleConfig(key, result.config);
            resultDiv.innerHTML = `
                <div style="background:#ECFDF5;border:1px solid #6EE7B7;border-radius:8px;padding:12px;color:#065F46;font-size:13px;">
                    <i class="fas fa-check-circle"></i> 文件 ${file.name} 导入成功！模块已更新。
                </div>
            `;
            showToast(`${file.name} 导入成功`, 'success');
        } else {
            resultDiv.innerHTML = `<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:12px;color:#991B1B;font-size:13px;"><i class="fas fa-exclamation-circle"></i> 导入失败，请检查文件格式</div>`;
        }
    };
    reader.readAsText(file);
}

// ========== 页面加载时读取已保存的模块配置 ==========
async function loadModuleConfigs() {
    const result = await api.getAllModuleConfigs();
    if (result && typeof result === 'object') {
        Object.keys(result).forEach(key => {
            const item = result[key];
            if (item && item.config) {
                moduleConfigs[key] = item.config;
                applyModuleConfig(key, item.config);
            }
        });
    }
}

// ============================================================
// ========== 模块联动引擎 ==========
// ============================================================
// 分析9个功能模块间的关联关系，当某模块数据变化时，
// 自动推导并更新关联模块，形成逻辑互动。
// 无关联的模块（如banner）保持独立运行。

// 联动关系映射表：source → [targets]
// 每条关系包含：触发条件 → 推导规则 → 目标更新
const MODULE_LINKAGES = {
    // 联动1: 雷达图各科分数变化 → 目标分当前估分 = 各科分数总和
    'radar': {
        targets: ['goal'],
        rule: 'sum_subjects_to_current_score',
        desc: '各科分数总和自动汇总为当前估分'
    },
    // 联动2: 目标分变化 → 模考预测重新计算（当前分+成长数据→预测分）
    'goal': {
        targets: ['exam-predict'],
        rule: 'recalc_predict_from_goal',
        desc: '目标分变化触发模考预测重新计算'
    },
    // 联动3: 薄弱知识点 → 学习计划（按薄弱科目自动关联任务）
    'weak-points': {
        targets: ['plan', 'recommend'],
        rule: 'weakpoints_to_plan_and_recommend',
        desc: '薄弱知识点驱动学习计划和AI推荐'
    },
    // 联动4: 学习计划 → 学习日历（任务总数同步到日历进度）
    'plan': {
        targets: ['calendar'],
        rule: 'plan_to_calendar_progress',
        desc: '学习计划任务数同步到学习日历进度'
    },
    // 联动5: 成长记录 → 学习日历（时长同步）+ 模考预测（正确率影响预测）
    'growth': {
        targets: ['calendar', 'exam-predict'],
        rule: 'growth_to_calendar_and_predict',
        desc: '成长记录数据同步到日历和模考预测'
    }
};

// 独立模块（无联动关系）：banner
const INDEPENDENT_MODULES = ['banner'];

// 联动事件触发器 —— 在 saveModuleFromForm 后调用
async function triggerLinkages(sourceKey, sourceConfig) {
    const linkage = MODULE_LINKAGES[sourceKey];
    if (!linkage) return; // 独立模块，无联动

    const updates = []; // 收集所有需要更新的目标模块

    switch (linkage.rule) {
        // ===== 联动1: 雷达图 → 目标分 =====
        case 'sum_subjects_to_current_score':
            if (sourceConfig.items && sourceConfig.items.length > 0) {
                const totalScore = sourceConfig.items.reduce((sum, s) => sum + (s.score || 0), 0);
                const goalConfig = moduleConfigs['goal'] || {};
                goalConfig.current_score = totalScore;
                updates.push({ key: 'goal', config: goalConfig, reason: `各科总分(${totalScore})自动同步为当前估分` });
            }
            break;

        // ===== 联动2: 目标分 → 模考预测 =====
        case 'recalc_predict_from_goal':
            const growthConfig = moduleConfigs['growth'] || {};
            const currentScore = sourceConfig.current_score || 0;
            const targetScore = sourceConfig.target_score || 0;
            const correctRate = growthConfig.correct_rate || 78;
            // 预测公式：当前分 + (目标分-当前分) × 正确率权重(0.3~0.6)
            const growthWeight = Math.min(0.6, Math.max(0.3, correctRate / 200));
            const predictedScore = Math.round(currentScore + (targetScore - currentScore) * growthWeight);
            const confidence = Math.min(95, Math.round(50 + correctRate * 0.4 + (currentScore / targetScore) * 15));
            const probability = Math.min(99, Math.round((currentScore / 750) * 100 + correctRate * 0.2));
            const rank = Math.max(100, Math.round(50000 / (predictedScore / 300)));
            const predictConfig = moduleConfigs['exam-predict'] || {};
            predictConfig.predicted_score = predictedScore;
            predictConfig.confidence = confidence;
            predictConfig.probability = probability;
            predictConfig.rank = rank;
            updates.push({ key: 'exam-predict', config: predictConfig, reason: `基于当前分${currentScore}+目标分${targetScore}+正确率${correctRate}%重新预测` });
            break;

        // ===== 联动3: 薄弱知识点 → 学习计划 + AI推荐 =====
        case 'weakpoints_to_plan_and_recommend':
            if (sourceConfig.items && sourceConfig.items.length > 0) {
                // 按掌握率排序，取最薄弱的4个生成学习计划
                const sorted = [...sourceConfig.items].sort((a, b) => (a.mastery_rate || 0) - (b.mastery_rate || 0));
                const topWeak = sorted.slice(0, 4);
                const subjectTimeMap = { '数学': '30分钟', '英语': '20分钟', '物理': '20分钟', '化学': '15分钟', '语文': '25分钟' };
                const planConfig = moduleConfigs['plan'] || {};
                planConfig.items = topWeak.map(wp => ({
                    subject: wp.subject,
                    name: wp.name + ' 专项',
                    time: subjectTimeMap[wp.subject] || '20分钟'
                }));
                updates.push({ key: 'plan', config: planConfig, reason: `根据薄弱知识点自动生成${topWeak.length}项学习计划` });

                // 同步推荐：根据薄弱科目调整推荐优先级
                const weakSubjects = [...new Set(topWeak.map(wp => wp.subject))];
                const recommendConfig = moduleConfigs['recommend'] || {};
                // 标记薄弱科目到推荐配置
                recommendConfig.weak_subjects = weakSubjects;
                recommendConfig.items = recommendConfig.items || [
                    { name: '智能组卷', desc: '根据你的薄弱点\n生成专属试卷' },
                    { name: '错题强化', desc: '巩固薄弱知识点\n减少重复错误' },
                    { name: '考点训练', desc: '高频考点专项训练\n精准提分' },
                    { name: '真题演练', desc: '近10年真题精选\n掌握命题趋势' }
                ];
                // 在推荐描述中体现薄弱科目
                recommendConfig.items[0].desc = `根据薄弱点(${weakSubjects.join('/')})\n生成专属试卷`;
                updates.push({ key: 'recommend', config: recommendConfig, reason: `AI推荐已关联薄弱科目：${weakSubjects.join('、')}` });
            }
            break;

        // ===== 联动4: 学习计划 → 学习日历进度 =====
        case 'plan_to_calendar_progress':
            if (sourceConfig.items) {
                const taskTotal = sourceConfig.items.length;
                const calendarConfig = moduleConfigs['calendar'] || {};
                calendarConfig.task_total = taskTotal;
                // 假设已完成数不变，但总任务数更新
                if (!calendarConfig.task_done) calendarConfig.task_done = Math.min(3, taskTotal);
                updates.push({ key: 'calendar', config: calendarConfig, reason: `学习计划${taskTotal}项任务同步到日历进度` });
            }
            break;

        // ===== 联动5: 成长记录 → 学习日历 + 模考预测 =====
        case 'growth_to_calendar_and_predict':
            const durationHours = sourceConfig.duration_hours || 0;
            const correctRateG = sourceConfig.correct_rate || 0;
            const questionsCount = sourceConfig.questions_count || 0;

            // 5a: 学习时长 → 学习日历
            const calConfig = moduleConfigs['calendar'] || {};
            calConfig.hours = durationHours;
            updates.push({ key: 'calendar', config: calConfig, reason: `学习时长${durationHours}h同步到学习日历` });

            // 5b: 正确率 → 模考预测置信度
            const goalCfg = moduleConfigs['goal'] || {};
            const currentS = goalCfg.current_score || 0;
            const targetS = goalCfg.target_score || 0;
            if (currentS > 0 && targetS > 0) {
                const growthW = Math.min(0.6, Math.max(0.3, correctRateG / 200));
                const predScore = Math.round(currentS + (targetS - currentS) * growthW);
                const conf = Math.min(95, Math.round(50 + correctRateG * 0.4 + (currentS / targetS) * 15));
                const prob = Math.min(99, Math.round((currentS / 750) * 100 + correctRateG * 0.2));
                const rnk = Math.max(100, Math.round(50000 / (predScore / 300)));
                const predConfig = moduleConfigs['exam-predict'] || {};
                predConfig.predicted_score = predScore;
                predConfig.confidence = conf;
                predConfig.probability = prob;
                predConfig.rank = rnk;
                updates.push({ key: 'exam-predict', config: predConfig, reason: `正确率${correctRateG}%影响预测：分数${predScore}，置信度${conf}%` });
            }
            break;
    }

    // 执行所有更新
    for (const update of updates) {
        moduleConfigs[update.key] = update.config;
        applyModuleConfig(update.key, update.config);
        // 显示联动提示动画
        showLinkageAnimation(sourceKey, update.key, update.reason);
        // 异步保存到后端（不阻塞UI）
        api.saveModuleConfig(update.key, update.config).catch(() => {});
    }

    // 如果有联动更新，显示汇总提示
    if (updates.length > 0) {
        const reasons = updates.map(u => u.reason).join('；');
        showToast(`智能联动：${reasons}`, 'success');
    }

    // 级联联动：如果更新了某个模块，而该模块本身也有联动关系，则继续触发
    // 例如：radar→goal 之后，goal 本身有联动到 exam-predict，需要级联触发
    // 使用 setTimeout 避免同步递归过深
    for (const update of updates) {
        if (MODULE_LINKAGES[update.key] && update.key !== sourceKey) {
            setTimeout(() => triggerLinkages(update.key, update.config), 500);
        }
    }
}

// 联动高亮动画：在源模块和目标模块之间显示关联提示
function showLinkageAnimation(sourceKey, targetKey, reason) {
    const sourceEl = document.querySelector(`[data-module="${sourceKey}"]`);
    const targetEl = document.querySelector(`[data-module="${targetKey}"]`);
    if (!sourceEl || !targetEl) return;

    // 源模块：蓝色脉冲
    sourceEl.style.transition = 'box-shadow 0.3s';
    sourceEl.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.4)';
    setTimeout(() => { sourceEl.style.boxShadow = ''; }, 1500);

    // 目标模块：延迟0.3秒后绿色脉冲 + 联动提示标签
    setTimeout(() => {
        targetEl.style.transition = 'box-shadow 0.3s';
        targetEl.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.5)';
        // 添加浮动提示
        const tip = document.createElement('div');
        tip.className = 'linkage-tip';
        tip.innerHTML = `<i class="fas fa-link"></i> ${reason}`;
        targetEl.style.position = 'relative';
        targetEl.appendChild(tip);
        // 3秒后移除
        setTimeout(() => {
            targetEl.style.boxShadow = '';
            if (tip.parentNode) tip.remove();
        }, 3000);
    }, 300);
}

// 薄弱知识点行点击 → 跳转到AI推荐对应训练
function onWeakPointClick(subject, name) {
    // 根据科目选择最合适的推荐类型
    const recommendMap = {
        '数学': '考点训练',
        '英语': '考点训练',
        '物理': '智能组卷',
        '化学': '智能组卷',
        '语文': '错题强化'
    };
    const recommendName = recommendMap[subject] || '考点训练';
    showToast(`薄弱知识点「${name}」→ 正在为你打开${recommendName}...`, 'info');
    setTimeout(() => handleRecommend(recommendName), 600);
}

// 为薄弱知识点表格行添加点击事件
function bindWeakPointClickEvents() {
    const rows = document.querySelectorAll('.weak-table tbody tr');
    rows.forEach(row => {
        row.style.cursor = 'pointer';
        row.onclick = function() {
            const tag = this.querySelector('.tag');
            const nameEl = this.querySelector('td:first-child');
            if (!tag || !nameEl) return;
            const subjectMap = { 'tag-math': '数学', 'tag-english': '英语', 'tag-physics': '物理', 'tag-chem': '化学', 'tag-chinese': '语文' };
            const subject = subjectMap[tag.className.split(' ').find(c => c.startsWith('tag-'))] || '综合';
            // 提取知识点名称（去掉标签文字）
            const name = nameEl.textContent.replace(/^[数英物化语]\s*/, '').trim();
            onWeakPointClick(subject, name);
        };
    });
}

// 初始化联动事件绑定
function initLinkageEvents() {
    bindWeakPointClickEvents();
}

// ========== 发现页数据：备考干货 & 名师课程（九科覆盖，含解题技巧详情） ==========
const DISCOVER_SUBJECTS = [
    { name: '全部', color: '#6B7280', bg: '#F3F4F6' },
    { name: '语文', color: '#EF4444', bg: '#FEE2E2' },
    { name: '数学', color: '#3B82F6', bg: '#DBEAFE' },
    { name: '英语', color: '#10B981', bg: '#D1FAE5' },
    { name: '物理', color: '#8B5CF6', bg: '#EDE9FE' },
    { name: '化学', color: '#F59E0B', bg: '#FEF3C7' },
    { name: '生物', color: '#14B8A6', bg: '#CCFBF1' },
    { name: '政治', color: '#6366F1', bg: '#E0E7FF' },
    { name: '历史', color: '#F43F5E', bg: '#FFE4E6' },
    { name: '地理', color: '#06B6D4', bg: '#CFFAFE' }
];

const DISCOVER_ARTICLES = [
    { subject: '语文', tagBg: '#FEE2E2', tagColor: '#EF4444', title: '高考作文5大主题万能开头模板，阅卷老师一眼心动', read: '3.2万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📖 语文 · 作文 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:8px;">一、引言式开头（适合哲理类）</p><p style="margin-bottom:6px;">以名言警句或诗句开篇，迅速提升文章格调。模板：<b>"XX曾言：……。诚哉斯言，……"</b></p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 8px;">二、排比式开头（适合情感类）</p><p style="margin-bottom:6px;">三句以上结构相似排比铺陈，气势恢宏。模板：<b>"是……，是……，更是……"</b></p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 8px;">三、设问式开头（适合思辨类）</p><p style="margin-bottom:6px;">以反问引出论点，激发思考。模板：<b>"何为……？答案或许不在……，而在……"</b></p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 8px;">四、场景式开头（适合记叙类）</p><p style="margin-bottom:6px;">以画面感切入，增强代入感。模板：<b>"暮色四合，……处，……正……"</b></p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 8px;">五、对比式开头（适合议论类）</p><p style="margin-bottom:6px;">正反对比鲜明立论。模板：<b>"世人皆重……，却轻……，殊不知……"</b></p>' +
        '<div style="margin-top:12px;padding:10px;background:#FEF3C7;border-radius:8px;font-size:12px;color:#92400E;"><b>⚠ 易错提醒：</b>开头勿超80字，忌套话堆砌；每段务必回扣题目关键词。</div></div>' },
    { subject: '语文', tagBg: '#FEE2E2', tagColor: '#EF4444', title: '古诗词鉴赏答题套路：形象、语言、表达技巧三步法', read: '1.9万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📖 语文 · 古诗鉴赏 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:8px;">第一步：析形象（4分题必考）</p><p style="margin-bottom:6px;">①找意象（景物+物象）→②概括画面特征（孤寂/壮阔/清新）→③点出人物形象。模板：<b>"诗中通过……意象，营造了……氛围，塑造了……形象"</b></p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 8px;">第二步：赏语言（炼字题）</p><p style="margin-bottom:6px;">①释义→②析效果（修辞/动静/色彩）→③悟情感。模板：<b>"XX字本义……，此处生动写出……，传达了……之情"</b></p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 8px;">第三步：辨技巧（表达方式分析）</p><p style="margin-bottom:6px;">常见技巧：借景抒情、托物言志、虚实结合、用典、对仗、视听结合。模板：<b>"本诗运用……手法，将……与……结合，达到……效果"</b></p>' +
        '<div style="margin-top:12px;padding:10px;background:#FEF3C7;border-radius:8px;font-size:12px;color:#92400E;"><b>⚠ 易错提醒：</b>切忌只罗列术语不结合诗句；每条赏析必须"引原句+释手法+说效果"。</div></div>' },
    { subject: '语文', tagBg: '#FEE2E2', tagColor: '#EF4444', title: '文言文翻译6大推断法：实词虚词一网打尽', read: '1.5万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📖 语文 · 文言文 · 翻译技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">1. 字形推断法</p><p style="margin-bottom:6px;">形旁表义：如"刂"旁多与刀斩有关，"氵"旁多与水有关。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">2. 语境推断法</p><p style="margin-bottom:6px;">结合上下文逻辑推断，关注前后主语、宾语搭配。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">3. 语法推断法</p><p style="margin-bottom:6px;">看其在句中位置定词性：主语前多为名词，"之""其"等可作代词或助词。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">4. 对举推断法</p><p style="margin-bottom:6px;">对偶/并列结构中，对应位置词义相近或相反。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">5. 成语推断法</p><p style="margin-bottom:6px;">保留在成语中的古义可作参照，如"不速之客"的"速"=邀请。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">6. 课内迁移法</p><p style="margin-bottom:6px;">将教材所学义项迁移到课外语境中验证。</p>' +
        '<div style="margin-top:10px;padding:10px;background:#FEF3C7;border-radius:8px;font-size:12px;color:#92400E;"><b>⚠ 翻译口诀：</b>留（专有名词）删（虚词）换（古义→今义）调（倒装）补（省略）变（修辞）。</div></div>' },
    { subject: '数学', tagBg: '#DBEAFE', tagColor: '#3B82F6', title: '导数压轴题5大解题套路，看完稳拿12分', read: '4.1万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📐 数学 · 导数 · 压轴解题</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">套路一：单调性讨论</p><p style="margin-bottom:6px;">求f\'(x)→因式分解→讨论参数a的临界值→列表判定单调区间。<b>关键：找f\'(x)=0的根是否在定义域内。</b></p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">套路二：极值/最值问题</p><p style="margin-bottom:6px;">令f\'(x)=0求驻点→列表分析→比较端点值与极值。含参时分类讨论a的范围。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">套路三：零点个数</p><p style="margin-bottom:6px;">①直接法：解方程f(x)=0；②图像法：画y=f(x)与x轴交点；③分离参数：a=g(x)交点个数。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">套路四：不等式证明</p><p style="margin-bottom:6px;">构造函数F(x)=f(x)-g(x)→证F(x)≥0→求F\'(x)最值。常用构造：xlnx、e^x-ax等。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">套路五：恒成立/存在性</p><p style="margin-bottom:6px;">"恒成立"→≥0最值≥0；"存在"→最值≥0即可。分离参数后转化为值域问题。</p>' +
        '<div style="margin-top:10px;padding:10px;background:#DBEAFE;border-radius:8px;font-size:12px;color:#1E40AF;"><b>💡 提分点：</b>①列表格式工整②定义域必写③端点值必验证④含参讨论不重不漏。</div></div>' },
    { subject: '数学', tagBg: '#DBEAFE', tagColor: '#3B82F6', title: '圆锥曲线韦达定理应用大全：联立-韦达-判别式三步', read: '3.5万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📐 数学 · 圆锥曲线 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">标准三步法</p><p style="margin-bottom:6px;">①设直线l：y=kx+m（注意斜率不存在单独讨论）<br>②联立曲线方程，消元得一元二次方程 Ax²+Bx+C=0<br>③判别式Δ>0 + 韦达定理：x₁+x₂=-B/A，x₁x₂=C/A</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">常见目标转化</p><p style="margin-bottom:6px;">• 弦长：|AB|=√(1+k²)·|x₁-x₂|<br>• 中点弦：x₀=(x₁+x₂)/2<br>• 面积：S=(1/2)|m|·|x₁-x₂|<br>• 斜率关系：kOA·kOB=定值→定点/定线问题</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">点差法（中点弦专用）</p><p style="margin-bottom:6px;">设弦端点代入曲线方程作差→得k=-b²x₀/(a²y₀)。适合已知中点求斜率。</p>' +
        '<div style="margin-top:10px;padding:10px;background:#DBEAFE;border-radius:8px;font-size:12px;color:#1E40AF;"><b>💡 提分点：</b>①设直线必讨论斜率不存在②Δ>0必写③韦达代换化简要耐心④定点定值用特殊值探路。</div></div>' },
    { subject: '数学', tagBg: '#DBEAFE', tagColor: '#3B82F6', title: '数列通项与求和4大方法：累加、累乘、构造、错位相减', read: '2.7万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📐 数学 · 数列 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">通项公式4法</p><p style="margin-bottom:6px;">①累加法：aₙ-aₙ₋₁=f(n)，各项相加消去<br>②累乘法：aₙ/aₙ₋₁=f(n)，各项相乘约分<br>③构造法：aₙ₊₁+λ=K(aₙ+λ)，待定λ化等比<br>④公式法：aₙ=Sₙ-Sₙ₋₁(n≥2)，验证n=1</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">求和4法</p><p style="margin-bottom:6px;">①等差/等比公式直接用<br>②裂项相消：1/[n(n+1)]=1/n-1/(n+1)<br>③错位相减：等差×等比型，乘公比后两式相减<br>④分组求和：可拆成几个可求和数列之和</p>' +
        '<div style="margin-top:10px;padding:10px;background:#DBEAFE;border-radius:8px;font-size:12px;color:#1E40AF;"><b>⚠ 易错提醒：</b>aₙ=Sₙ-Sₙ₋₁只对n≥2成立，n=1必须单独验证是否等于S₁，否则需写分段形式。</div></div>' },
    { subject: '英语', tagBg: '#D1FAE5', tagColor: '#10B981', title: '阅读理解主旨题3秒定位法，准确率提升40%', read: '4.8万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📘 英语 · 阅读理解 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">3秒定位法</p><p style="margin-bottom:6px;">①扫首段末句（thesis statement常在此）<br>②扫各段首句（topic sentence）<br>③扫尾段（结论重申主旨）<br>三处信息融合即为文章主旨。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">主旨题选项特征</p><p style="margin-bottom:6px;">✓ 正确项：涵盖全文、概括性强、中性客观<br>✗ 干扰项：以偏概全、过度引申、与文意相反、范围过大</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">标题选择题（Best Title）</p><p style="margin-bottom:6px;">好标题三要素：①概括核心话题②引发兴趣③简洁醒目。优先选含文章高频关键词的选项。</p>' +
        '<div style="margin-top:10px;padding:10px;background:#D1FAE5;border-radius:8px;font-size:12px;color:#065F46;"><b>💡 提分点：</b>主旨题放最后做；警惕however、but后的转折，主旨常在转折后。</div></div>' },
    { subject: '英语', tagBg: '#D1FAE5', tagColor: '#10B981', title: '完形填空5大逻辑推断法：上下文语境为王', read: '3.2万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📘 英语 · 完形填空 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">5大推断法</p><p style="margin-bottom:6px;">①上下文复现：空格前后会出现同根词/同义词/反义词线索<br>②逻辑关系：and（并列）、but（转折）、so（因果）<br>③感情色彩：判断段落褒贬基调选词<br>④固定搭配：look forward to + doing等<br>⑤常识背景：结合生活常识与文化背景</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">做题顺序</p><p style="margin-bottom:6px;">①通读首句（不设空）把握基调→②跳读全篇了解大意→③逐题用线索推断→④回填复读验证逻辑通顺</p>' +
        '<div style="margin-top:10px;padding:10px;background:#D1FAE5;border-radius:8px;font-size:12px;color:#065F46;"><b>⚠ 易错提醒：</b>切忌看到一个空就选，务必前后各看2-3句；首句不设空，是全文基调钥匙。</div></div>' },
    { subject: '英语', tagBg: '#D1FAE5', tagColor: '#10B981', title: '七选五解题套路：衔接词与逻辑关系判定', read: '2.4万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📘 英语 · 七选五 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">逻辑关系4类</p><p style="margin-bottom:6px;">①并列/递进：also, too, besides, furthermore<br>②转折：however, nevertheless, instead<br>③因果：therefore, thus, as a result<br>④解释/举例：for example, namely, such as</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">代词线索法</p><p style="margin-bottom:6px;">空格后出现he/they/this/such，前文必有指代对象；空格前出现名词，后文可能用代词回指。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">结构复现法</p><p style="margin-bottom:6px;">段首句常是topic sentence，空格处多为支撑句；段尾空格常是总结句，注意总结性词汇。</p>' +
        '<div style="margin-top:10px;padding:10px;background:#D1FAE5;border-radius:8px;font-size:12px;color:#065F46;"><b>💡 提分点：</b>先做有把握的（有明确衔接词的），再用排除法；段首空格优先看与上一段尾的衔接。</div></div>' },
    { subject: '物理', tagBg: '#EDE9FE', tagColor: '#8B5CF6', title: '电磁感应双杆模型全解析：动量与能量联用', read: '3.1万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🔬 物理 · 电磁感应 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">双杆模型核心</p><p style="margin-bottom:6px;">两杆在导轨上运动，通过安培力相互制约，最终达到稳定状态（加速度相同或相对静止）。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">解题四步</p><p style="margin-bottom:6px;">①画受力分析（重力、支持力、安培力F=BIL）<br>②列牛顿第二定律：F合=ma，I=BLv_rel/R<br>③稳定条件：a₁=a₂（加速度相同），此时v_rel恒定<br>④动量/能量：动量守恒（光滑导轨）或功能关系（求焦耳热）</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">能量守恒</p><p style="margin-bottom:6px;">克服安培力做的功=回路产生的焦耳热：W_A=Q。</p>' +
        '<div style="margin-top:10px;padding:10px;background:#EDE9FE;border-radius:8px;font-size:12px;color:#5B21B6;"><b>💡 提分点：</b>①安培力方向用左手定则②I=BLv_rel/R中v是相对速度③稳定时不是v=0而是a相同④动量守恒只适用于无外力情况。</div></div>' },
    { subject: '物理', tagBg: '#EDE9FE', tagColor: '#8B5CF6', title: '力学综合题模板：动量守恒+能量守恒联用', read: '2.8万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🔬 物理 · 力学综合 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">动量守恒适用判断</p><p style="margin-bottom:6px;">①系统不受外力或合外力为零→严格守恒<br>②某方向合外力为零→该方向守恒<br>③内力远大于外力（爆炸、碰撞）→近似守恒</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">能量守恒+功能关系</p><p style="margin-bottom:6px;">①W_G=-(ΔE_p)（重力做功=-重力势能变化）<br>②W_合=ΔE_k（动能定理）<br>③W_其他=ΔE_机（除重力外其他力做功=机械能变化）<br>④Q=f_滑·Δs相对（摩擦生热=滑动摩擦力×相对路程）</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">碰撞类型速判</p><p style="margin-bottom:6px;">弹性碰撞：动量守恒+动能守恒<br>完全非弹性：动量守恒+共速（动能损失最大）<br>非弹性：动量守恒+动能损失</p>' +
        '<div style="margin-top:10px;padding:10px;background:#EDE9FE;border-radius:8px;font-size:12px;color:#5B21B6;"><b>⚠ 易错提醒：</b>动量守恒用合外力判断而非"光滑"；Q=f·Δs_相对中Δs是两物相对位移非对地位移。</div></div>' },
    { subject: '物理', tagBg: '#EDE9FE', tagColor: '#8B5CF6', title: '带电粒子在复合场中运动：圆心与半径确定法', read: '2.1万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🔬 物理 · 复合场 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">圆心确定3法</p><p style="margin-bottom:6px;">①已知入射方向+出射方向：两速度垂线交点即圆心<br>②已知入射点+出射点+入射方向：入射点做速度垂线，与弦中垂线交点即圆心<br>③已知入射点+边界几何关系：结合边界角度分析</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">半径与时间</p><p style="margin-bottom:6px;">r=mv/(qB)；周期T=2πm/(qB)；运动时间t=(θ/2π)·T（θ为圆心角，弧度制）<br>弦长=2r·sin(θ/2)</p>' +
        '<div style="margin-top:10px;padding:10px;background:#EDE9FE;border-radius:8px;font-size:12px;color:#5B21B6;"><b>💡 提分点：</b>画轨迹图是关键；临界问题找几何极值（恰好出射/不出射）。</div></div>' },
    { subject: '化学', tagBg: '#FEF3C7', tagColor: '#F59E0B', title: '化学平衡常数计算三步法：浓度-平衡-判断', read: '2.9万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🧪 化学 · 化学平衡 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">三步法</p><p style="margin-bottom:6px;">第一步：列三段式（起始/转化/平衡浓度或分压）<br>第二步：代入K表达式求值或求参<br>第三步：用Q与K比较判断方向（Q<K正向，Q>K逆向，Q=K平衡）</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">三段式书写规范</p><p style="margin-bottom:6px;">如 aA+bB⇌cC+dD<br>起始 c₁ c₂ 0 0<br>转化 ax bx cx dx<br>平衡 c₁-ax c₂-bx cx dx<br>K=c(C)^c·c(D)^d/[c(A)^a·c(B)^b]</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">等效平衡判断</p><p style="margin-bottom:6px;">恒温恒容：反应前后气体体积不变→折算后各物质n比相同即等效<br>恒温恒压：折算后各物质n比相同即等效</p>' +
        '<div style="margin-top:10px;padding:10px;background:#FEF3C7;border-radius:8px;font-size:12px;color:#92400E;"><b>⚠ 易错提醒：</b>固体/纯液体不计入K；K只与温度有关；三段式单位要统一。</div></div>' },
    { subject: '化学', tagBg: '#FEF3C7', tagColor: '#F59E0B', title: '有机推断突破口：官能团转化与特征反应图谱', read: '2.5万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🧪 化学 · 有机推断 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">特征反应突破口</p><p style="margin-bottom:6px;">• 银镜/斐林反应→醛基-CHO<br>• NaOH醇溶液加热消去→卤代烃或醇<br>• 酯化反应（浓硫酸催化）→羧酸+醇<br>• 加成（H₂/Ni）→C=C或C=O或苯环<br>• NaHCO₃放CO₂→羧基-COOH<br>• Na放H₂→-OH（醇/酚/羧酸）</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">分子式→结构式推断</p><p style="margin-bottom:6px;">①算不饱和度Ω=(2C+2-H-X+N)/2<br>②Ω=1→一个双键或环；Ω=4→可能含苯环<br>③结合特征反应定官能团位置<br>④注意同分异构（-OH/-O-、-COOH/-COOC-）</p>' +
        '<div style="margin-top:10px;padding:10px;background:#FEF3C7;border-radius:8px;font-size:12px;color:#92400E;"><b>💡 提分点：</b>先找信息最明确的物质（银镜=醛、银镜+水解=甲酸酯）做突破口，再双向推断。</div></div>' },
    { subject: '化学', tagBg: '#FEF3C7', tagColor: '#F59E0B', title: '电化学解题流程：原电池vs电解池一图分清', read: '2.0万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🧪 化学 · 电化学 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">原电池（自发反应）</p><p style="margin-bottom:6px;">负极→失电子→氧化反应→活泼金属（或燃料）<br>正极→得电子→还原反应→不活泼金属（或O₂）<br>电流方向：正极→外电路→负极<br>阳离子向正极迁移，阴离子向负极迁移</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">电解池（外接电源）</p><p style="margin-bottom:6px;">阳极→接电源正极→失电子→氧化（若是活泼金属则金属溶解）<br>阴极→接电源负极→得电子→还原<br>阳离子向阴极，阴离子向阳极</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">电极反应式书写</p><p style="margin-bottom:6px;">①判断电极②写总反应③拆分得正负/阴阳极④配平（电子守恒）⑤补环境（酸/碱/熔融）</p>' +
        '<div style="margin-top:10px;padding:10px;background:#FEF3C7;border-radius:8px;font-size:12px;color:#92400E;"><b>⚠ 易错提醒：</b>原电池"正正负负"（正极得电子）；电解池"阴阳阳阴"（阳极氧化失电子）。</div></div>' },
    { subject: '生物', tagBg: '#CCFBF1', tagColor: '#14B8A6', title: '遗传题概率计算：三大定律与棋盘法应用', read: '2.7万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🧬 生物 · 遗传 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">三大定律</p><p style="margin-bottom:6px;">①分离定律：一对等位基因→3:1（杂合自交）<br>②自由组合定律：n对独立基因→(3:1)ⁿ展开<br>③连锁交换：基因在同一条染色体上，可发生交叉互换</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">概率计算法</p><p style="margin-bottom:6px;">①棋盘法：列父本配子×母本配子表<br>②分支法：逐对基因拆分计算再相乘（适合多对基因）<br>③逆推法：后代比例→亲本基因型（3:1→Aa×Aa；1:1→Aa×aa；全显→AA×_）</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">伴性遗传特例</p><p style="margin-bottom:6px;">X染色体：男→女传女不传子（交叉遗传）；Y染色体：父传子代代男。色盲系谱判断：男多于女、母→子交叉。</p>' +
        '<div style="margin-top:10px;padding:10px;background:#CCFBF1;border-radius:8px;font-size:12px;color:#115E59;"><b>⚠ 易错提醒：</b>求"患病概率"分清是"患病男孩"还是"男孩患病"；概率相乘用独立事件，相加用互斥事件。</div></div>' },
    { subject: '生物', tagBg: '#CCFBF1', tagColor: '#14B8A6', title: '光合与呼吸综合题：图像分析与坐标判断', read: '2.2万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🧬 生物 · 光合呼吸 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">关键点判断</p><p style="margin-bottom:6px;">• CO₂吸收=0点：光合=呼吸（光补偿点）<br>• 光饱和点：光合速率不再随光强增加<br>• CO₂补偿点：光合=呼吸<br>• 黑暗条件下：仅呼吸，曲线=呼吸速率</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">总光合与净光合</p><p style="margin-bottom:6px;">净光合速率=总光合速率-呼吸速率<br>实验测得的"O₂释放/CO₂吸收"=净光合<br>总光合=净光合+呼吸（用黑暗组测呼吸）</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">影响因子分析</p><p style="margin-bottom:6px;">光合：光强/CO₂浓度/温度/必需矿质（Mg/N/P）<br>呼吸：温度/O₂浓度/含水量</p>' +
        '<div style="margin-top:10px;padding:10px;background:#CCFBF1;border-radius:8px;font-size:12px;color:#115E59;"><b>💡 提分点：</b>看清纵坐标单位（O₂/CO₂）和符号方向；"积累量"是净光合，"制造量"是总光合。</div></div>' },
    { subject: '生物', tagBg: '#CCFBF1', tagColor: '#14B8A6', title: '生态系统能量流动计算：传递效率与营养级关系', read: '1.8万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🧬 生物 · 生态 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">能量流动特点</p><p style="margin-bottom:6px;">单向流动、逐级递减，传递效率10%-20%（相邻营养级之间）。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">计算公式</p><p style="margin-bottom:6px;">• 下一营养级同化量=上一营养级同化量×(10%-20%)<br>• 流向下一营养级+分解者+未利用=上一营养级同化量<br>• 能量传递效率=下一营养级同化量/上一营养级同化量×100%</p>' +
        '<div style="margin-top:10px;padding:10px;background:#CCFBF1;border-radius:8px;font-size:12px;color:#115E59;"><b>⚠ 易错提醒：</b>同化量=摄入量-粪便量（粪便不算该营养级同化，算上一营养级流向分解者）；呼吸散失的能量不能再被利用。</div></div>' },
    { subject: '政治', tagBg: '#E0E7FF', tagColor: '#6366F1', title: '政治主观题答题模板：原因类、意义类、措施类', read: '3.0万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📋 政治 · 主观题 · 答题模板</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">原因类（"为什么/分析原因"）</p><p style="margin-bottom:6px;">答题逻辑：①必要性（理论依据+现状）②重要性（意义作用）③可能性（条件具备）<br>模板：<b>"……是……的客观要求；有利于……；具备……条件"</b></p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">意义类（"有何意义/影响"）</p><p style="margin-bottom:6px;">答题逻辑：对主体A的意义+对主体B的意义+对国家/社会的意义<br>常用词：有利于、促进、推动、保障、提高、维护<br>角度：经济/政治/文化/生态/社会</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">措施类（"如何/怎样做"）</p><p style="margin-bottom:6px;">答题逻辑：主体分析法→国家（政府）、企业、公民各怎么做<br>模板：<b>"国家应……；企业应……；公民应……"</b></p>' +
        '<div style="margin-top:10px;padding:10px;background:#E0E7FF;border-radius:8px;font-size:12px;color:#3730A3;"><b>💡 提分点：</b>①原理+材料分析②分点作答③先书后材料④学科术语规范。</div></div>' },
    { subject: '政治', tagBg: '#E0E7FF', tagColor: '#6366F1', title: '经济常识计算题公式大全：价值量、汇率、恩格尔系数', read: '2.3万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📋 政治 · 经济计算 · 公式集</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">1. 单位商品价值量</p><p style="margin-bottom:6px;">=社会总价值/总使用价值量；生产率提高后：新价值量=原价值量×(原生产率/新生产率)</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">2. 汇率变动</p><p style="margin-bottom:6px;">本币升值→出口减/进口增；本币贬值→出口增/进口减。变化后汇率=原汇率×(1±变化率)</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">3. 恩格尔系数</p><p style="margin-bottom:6px;">=食品支出/消费总支出×100%；越低生活水平越高（<30%富裕，30-40%相对富裕）</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">4. GDP/收入增长</p><p style="margin-bottom:6px;">实际增长率=名义增长率-通货膨胀率</p>' +
        '<div style="margin-top:10px;padding:10px;background:#E0E7FF;border-radius:8px;font-size:12px;color:#3730A3;"><b>⚠ 易错提醒：</b>分清"社会劳动生产率"（影响价值量）与"个别劳动生产率"（影响价值总量）。</div></div>' },
    { subject: '政治', tagBg: '#E0E7FF', tagColor: '#6366F1', title: '哲学原理答题框架：唯物论、辩证法、认识论', read: '2.5万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📋 政治 · 哲学 · 答题框架</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">唯物论（物质意识）</p><p style="margin-bottom:6px;">①物质决定意识→一切从实际出发<br>②意识具有能动作用→正确意识促进发展<br>③规律客观性→按规律办事+发挥主观能动性</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">辩证法（联系发展矛盾）</p><p style="margin-bottom:6px;">①联系观：普遍/客观/多样/条件<br>②发展观：量变质变/前进曲折/新事物<br>③矛盾观：普遍性/特殊性/主次矛盾/主次方面<br>④辩证否定观：扬弃+创新</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">认识论（实践认识）</p><p style="margin-bottom:6px;">①实践是认识的基础（来源/动力/标准/目的）<br>②认识反复性/无限性/上升性→追求真理<br>③真理客观性/具体性/条件性</p>' +
        '<div style="margin-top:10px;padding:10px;background:#E0E7FF;border-radius:8px;font-size:12px;color:#3730A3;"><b>💡 提分点：</b>答题="原理+方法论+材料分析"，三者缺一不可。</div></div>' },
    { subject: '历史', tagBg: '#FFE4E6', tagColor: '#F43F5E', title: '历史材料题答题技巧：论从史出、史论结合', read: '2.6万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📜 历史 · 材料题 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">阅读材料三步</p><p style="margin-bottom:6px;">①先看设问（带问题读材料）→②精读材料提取关键信息（时间/人物/事件/观点）→③关联课本知识定位考点</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">答题规范</p><p style="margin-bottom:6px;">①论从史出：观点必须有材料支撑<br>②史论结合：既引材料原文又给课本结论<br>③按设问分值分点（1分1点或2分1点）<br>④材料信息+课本知识+自己概括</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">常见设问类型</p><p style="margin-bottom:6px;">• "根据材料概括"→答案在材料中提炼<br>• "结合所学分析"→必须用课本知识<br>• "谈谈认识/启示"→史实+规律+现实意义</p>' +
        '<div style="margin-top:10px;padding:10px;background:#FFE4E6;border-radius:8px;font-size:12px;color:#9F1239;"><b>💡 提分点：</b>①引用材料要标"材料x云"②概括要抽象不要照抄原文③多角度（政治/经济/文化/外交）。</div></div>' },
    { subject: '历史', tagBg: '#FFE4E6', tagColor: '#F43F5E', title: '中国近代史高频考点：阶段特征与重大事件因果', read: '2.1万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📜 历史 · 中国近代史 · 考点梳理</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">阶段特征（1840-1949）</p><p style="margin-bottom:6px;">①1840-1894：开眼看世界→器物层面学习（洋务运动）<br>②1894-1919：制度层面探索（戊戌变法/辛亥革命）→思想解放（新文化运动）<br>③1919-1949：新民主主义革命（中共领导走向独立）</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">重大事件因果链</p><p style="margin-bottom:6px;">鸦片战争→列强侵略→太平天国（反抗）<br>甲午战败→民族危机→戊戌变法+辛亥革命（救亡）<br>巴黎和会→山东问题→五四运动→新文化运动深化<br>十月革命→马克思主义传播→中共成立</p>' +
        '<div style="margin-top:10px;padding:10px;background:#FFE4E6;border-radius:8px;font-size:12px;color:#9F1239;"><b>💡 提分点：</b>近代史主线"独立（反侵略）+富强（近代化）"；答题从政治/经济/思想三维度分析。</div></div>' },
    { subject: '历史', tagBg: '#FFE4E6', tagColor: '#F43F5E', title: '世界近现代史时间轴：重大事件因果关系梳理', read: '1.7万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📜 历史 · 世界史 · 时间轴</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">资本主义发展四阶段</p><p style="margin-bottom:6px;">①14-16C：萌芽（文艺复兴/新航路）<br>②17-18C：确立（启蒙运动/英美法革命）<br>③18C末-19C：扩展（工业革命/资本主义体系形成）<br>④20C：调整（两次大战/罗斯福新政/全球化）</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">两次世界大战因果</p><p style="margin-bottom:6px;">一战：帝国主义政治经济发展不平衡→同盟对立→萨拉热窝→凡尔赛-华盛顿体系<br>二战：经济大萧条+凡华体系矛盾+法西斯兴起→二战→雅尔塔体系（冷战格局）</p>' +
        '<div style="margin-top:10px;padding:10px;background:#FFE4E6;border-radius:8px;font-size:12px;color:#9F1239;"><b>💡 提分点：</b>世界史答题角度：经济（生产/市场）+政治（制度/格局）+思想（启蒙/解放）。</div></div>' },
    { subject: '地理', tagBg: '#CFFAFE', tagColor: '#06B6D4', title: '地理综合题答题框架：自然+人文要素分析法', read: '2.8万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🌍 地理 · 综合题 · 答题框架</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">自然要素（"在哪里/为何如此"）</p><p style="margin-bottom:6px;">位置（经纬/海陆）→地形（类型/地势）→气候（类型/特征）→水文（河流/湖泊）→土壤→植被<br>分析"原因"题：从位置→气候→水文→地貌逐层推导</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">人文要素（"做什么/如何发展"）</p><p style="margin-bottom:6px;">人口（数量/迁移）→城市（化/分布）→农业（类型/区位）→工业（部门/区位）→交通（方式/布局）<br>分析"影响"题：经济/社会/生态三效益分析</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">区位分析万能模板</p><p style="margin-bottom:6px;">自然区位：地形/气候/水源/土壤<br>社会经济：市场/交通/劳动力/政策/科技/原料<br>评价类：优势+劣势+发展方向</p>' +
        '<div style="margin-top:10px;padding:10px;background:#CFFAFE;border-radius:8px;font-size:12px;color:#155E75;"><b>💡 提分点：</b>①先定位（经纬度/海陆位置）②要素齐全③结合具体区域特征③使用学科语言。</div></div>' },
    { subject: '地理', tagBg: '#CFFAFE', tagColor: '#06B6D4', title: '区域地理分析六步法：位置地形气候水文土壤植被', read: '2.2万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🌍 地理 · 区域分析 · 六步法</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">六要素逐项分析</p><p style="margin-bottom:6px;">①位置：经纬度/海陆/相邻关系→定区域归属<br>②地形：类型（平原/高原/山地）+地势<br>③气候：类型+特征（气温/降水/季节分配）<br>④水文：河流流量/汛期/含沙量/冰期<br>⑤土壤：类型+肥力（黑土/红壤/黄土）<br>⑥植被：类型+分布（森林/草原/荒漠）</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">区域差异对比</p><p style="margin-bottom:6px;">南北差异：秦岭-淮河一线（温度带/干湿区/农业类型）<br>东西差异：季风区vs非季风区（降水/植被/经济）<br>垂直差异：海拔变化→气候/植被垂直分异</p>' +
        '<div style="margin-top:10px;padding:10px;background:#CFFAFE;border-radius:8px;font-size:12px;color:#155E75;"><b>⚠ 易错提醒：</b>区域分析必须"具体区域具体分析"，避免套话；结合地图记忆典型区域特征。</div></div>' },
    { subject: '地理', tagBg: '#CFFAFE', tagColor: '#06B6D4', title: '地理图表判读技巧：等值线、统计图、示意图', read: '1.9万', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🌍 地理 · 图表判读 · 技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">等值线判读</p><p style="margin-bottom:6px;">①看数值（极值/递变方向）②看疏密（密=变化大）③看弯曲（高高低低法则）④看闭合（中心高=高值区）<br>等温线：南凸→北半球夏季/南半球冬季</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">统计图判读</p><p style="margin-bottom:6px;">柱状图：看高低/趋势<br>折线图：看峰谷/变化率<br>扇形图：看比重/构成<br>坐标图：看清正负/象限</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">示意图判读</p><p style="margin-bottom:6px;">①先读图名+图例②判断空间/时间尺度③理解箭头/符号含义④联系课本原理</p>' +
        '<div style="margin-top:10px;padding:10px;background:#CFFAFE;border-radius:8px;font-size:12px;color:#155E75;"><b>💡 提分点：</b>判图先定类型（等值线/统计/示意），再用对应方法；等值线"凸高为低"是核心法则。</div></div>' }
];

const DISCOVER_COURSES = [
    { name: '王老师', subject: '数学', title: '高考导数满分冲刺课', lessons: 12, price: '¥99', color: '#3B82F6', bg: '#DBEAFE', students: '1.2万', rating: '4.9', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👨‍🏫 数学 · 12课时 · 王老师</div><p style="margin-bottom:10px;">导数压轴题专项突破，从单调性到不等式证明，系统梳理12类常考题型。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p><p style="margin-bottom:6px;">1-3课：单调性讨论与极值问题<br>4-6课：零点个数与方程根<br>7-9课：不等式证明（构造法）<br>10-12课：恒成立与存在性+综合演练</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#DBEAFE;border-radius:8px;font-size:12px;color:#1E40AF;"><span>⭐ 4.9分</span><span>👥 1.2万人在学</span><span>📚 12课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#3B82F6;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥99</button></div>' },
    { name: '李老师', subject: '物理', title: '力学综合突破精讲', lessons: 10, price: '¥89', color: '#8B5CF6', bg: '#EDE9FE', students: '8600', rating: '4.8', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👨‍🏫 物理 · 10课时 · 李老师</div><p style="margin-bottom:10px;">动量守恒+能量守恒联用，碰撞模型全解析，攻克力学压轴题。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p><p style="margin-bottom:6px;">1-3课：动量定理与动量守恒<br>4-6课：碰撞模型（弹性/非弹性）<br>7-8课：功能关系与机械能守恒<br>9-10课：综合题实战</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#EDE9FE;border-radius:8px;font-size:12px;color:#5B21B6;"><span>⭐ 4.8分</span><span>👥 8600人在学</span><span>📚 10课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#8B5CF6;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥89</button></div>' },
    { name: '张老师', subject: '语文', title: '高考作文提分特训营', lessons: 15, price: '¥129', color: '#EF4444', bg: '#FEE2E2', students: '2.1万', rating: '4.9', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👩‍🏫 语文 · 15课时 · 张老师</div><p style="margin-bottom:10px;">从素材积累到结构构建，15课时带你写出55+高分作文。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p><p style="margin-bottom:6px;">1-3课：审题立意与开头模板<br>4-6课：分论点设置与论证方法<br>7-9课：素材积累与时政热点<br>10-12课：结构升级与语言润色<br>13-15课：真题演练+批改</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#FEE2E2;border-radius:8px;font-size:12px;color:#991B1B;"><span>⭐ 4.9分</span><span>👥 2.1万人在学</span><span>📚 15课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#EF4444;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥129</button></div>' },
    { name: '陈老师', subject: '英语', title: '阅读理解满分突破', lessons: 12, price: '¥99', color: '#10B981', bg: '#D1FAE5', students: '1.5万', rating: '4.8', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👨‍🏫 英语 · 12课时 · 陈老师</div><p style="margin-bottom:10px;">主旨题、细节题、推断题、词义题四大题型全覆盖，3秒定位法实战。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p><p style="margin-bottom:6px;">1-3课：主旨题3秒定位法<br>4-6课：细节题与推断题<br>7-9课：词义猜测与七选五<br>10-12课：真题限时训练</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#D1FAE5;border-radius:8px;font-size:12px;color:#065F46;"><span>⭐ 4.8分</span><span>👥 1.5万人在学</span><span>📚 12课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#10B981;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥99</button></div>' },
    { name: '刘老师', subject: '化学', title: '化学反应原理精讲', lessons: 10, price: '¥89', color: '#F59E0B', bg: '#FEF3C7', students: '7800', rating: '4.7', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👨‍🏫 化学 · 10课时 · 刘老师</div><p style="margin-bottom:10px;">化学平衡、电离水解、电化学核心原理+计算技巧。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p><p style="margin-bottom:6px;">1-3课：化学平衡与平衡常数<br>4-6课：弱电解质电离与水解<br>7-8课：沉淀溶解平衡<br>9-10课：电化学（原电池/电解池）</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#FEF3C7;border-radius:8px;font-size:12px;color:#92400E;"><span>⭐ 4.7分</span><span>👥 7800人在学</span><span>📚 10课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#F59E0B;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥89</button></div>' },
    { name: '赵老师', subject: '生物', title: '遗传学专题突破', lessons: 8, price: '¥79', color: '#14B8A6', bg: '#CCFBF1', students: '6500', rating: '4.8', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👩‍🏫 生物 · 8课时 · 赵老师</div><p style="margin-bottom:10px;">三大遗传定律+概率计算+伴性遗传，专攻遗传压轴题。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p><p style="margin-bottom:6px;">1-2课：分离定律与自由组合<br>3-4课：连锁交换与伴性遗传<br>5-6课：概率计算（棋盘/分支法）<br>7-8课：遗传系谱分析与真题</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#CCFBF1;border-radius:8px;font-size:12px;color:#115E59;"><span>⭐ 4.8分</span><span>👥 6500人在学</span><span>📚 8课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#14B8A6;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥79</button></div>' },
    { name: '周老师', subject: '政治', title: '主观题答题技巧课', lessons: 10, price: '¥89', color: '#6366F1', bg: '#E0E7FF', students: '5400', rating: '4.7', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👨‍🏫 政治 · 10课时 · 周老师</div><p style="margin-bottom:10px;">原因类/意义类/措施类/认识类四大题型答题模板+学科术语规范。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p><p style="margin-bottom:6px;">1-2课：经济主观题答题框架<br>3-4课：政治主观题（政府/党/公民）<br>5-6课：哲学原理+方法论<br>7-8课：文化主观题<br>9-10课：开放性试题与真题演练</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#E0E7FF;border-radius:8px;font-size:12px;color:#3730A3;"><span>⭐ 4.7分</span><span>👥 5400人在学</span><span>📚 10课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#6366F1;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥89</button></div>' },
    { name: '吴老师', subject: '历史', title: '史料分析专项突破', lessons: 10, price: '¥89', color: '#F43F5E', bg: '#FFE4E6', students: '4800', rating: '4.7', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👩‍🏫 历史 · 10课时 · 吴老师</div><p style="margin-bottom:10px;">论从史出、史论结合，材料题答题规范+阶段特征梳理。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p><p style="margin-bottom:6px;">1-2课：材料阅读与信息提取<br>3-4课：中国古代史阶段特征<br>5-6课：中国近代史主线梳理<br>7-8课：世界史时间轴与因果<br>9-10课：综合材料题实战</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#FFE4E6;border-radius:8px;font-size:12px;color:#9F1239;"><span>⭐ 4.7分</span><span>👥 4800人在学</span><span>📚 10课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#F43F5E;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥89</button></div>' },
    { name: '孙老师', subject: '地理', title: '区域地理综合分析', lessons: 12, price: '¥99', color: '#06B6D4', bg: '#CFFAFE', students: '6200', rating: '4.8', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👨‍🏫 地理 · 12课时 · 孙老师</div><p style="margin-bottom:10px;">自然+人文要素分析框架+图表判读+区位分析模板。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p><p style="margin-bottom:6px;">1-3课：自然地理要素分析（六步法）<br>4-6课：人文地理区位分析<br>7-8课：等值线与统计图判读<br>9-10课：区域差异与可持续发展<br>11-12课：综合题实战</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#CFFAFE;border-radius:8px;font-size:12px;color:#155E75;"><span>⭐ 4.8分</span><span>👥 6200人在学</span><span>📚 12课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#06B6D4;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥99</button></div>' },
    { name: '黄老师', subject: '数学', title: '圆锥曲线压轴题秒杀课', lessons: 8, price: '¥79', color: '#3B82F6', bg: '#DBEAFE', students: '9300', rating: '4.8', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👩‍🏫 数学 · 8课时 · 黄老师</div><p style="margin-bottom:10px;">联立-韦达-判别式三步法+定点定值+非对称问题，专攻圆锥曲线压轴。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p><p style="margin-bottom:6px;">1-2课：联立与韦达定理应用<br>3-4课：弦长/面积/中点问题<br>5-6课：定点定值与最值<br>7-8课：非对称韦达与点差法</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#DBEAFE;border-radius:8px;font-size:12px;color:#1E40AF;"><span>⭐ 4.8分</span><span>👥 9300人在学</span><span>📚 8课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#3B82F6;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥79</button></div>' },
    { name: '林老师', subject: '英语', title: '语法填空与短文改错专项', lessons: 6, price: '¥59', color: '#10B981', bg: '#D1FAE5', students: '7200', rating: '4.6', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👨‍🏫 英语 · 6课时 · 林老师</div><p style="margin-bottom:10px;">语法填空7大考点+短文改错10类错误，6课时提分20+。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p><p style="margin-bottom:6px;">1-2课：语法填空（动词/非谓语/词性转换）<br>3-4课：短文改错（多/缺/错词）<br>5-6课：真题限时训练</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#D1FAE5;border-radius:8px;font-size:12px;color:#065F46;"><span>⭐ 4.6分</span><span>👥 7200人在学</span><span>📚 6课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#10B981;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥59</button></div>' },
    { name: '郑老师', subject: '化学', title: '有机推断题突破口课', lessons: 8, price: '¥79', color: '#F59E0B', bg: '#FEF3C7', students: '5100', rating: '4.7', content:
        '<div style="padding:6px 2px;"><div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👨‍🏫 化学 · 8课时 · 郑老师</div><p style="margin-bottom:10px;">官能团转化图谱+特征反应突破口+同分异构书写技巧。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p><p style="margin-bottom:6px;">1-2课：官能团与特征反应<br>3-4课：不饱和度与分子式推断<br>5-6课：同分异构书写规范<br>7-8课：综合推断真题实战</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#FEF3C7;border-radius:8px;font-size:12px;color:#92400E;"><span>⭐ 4.7分</span><span>👥 5100人在学</span><span>📚 8课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#F59E0B;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥79</button></div>' }
];

// 备考干货/名师课程交互函数（挂载到 window）
window.openDiscoverArticle = function (idx) {
    const a = DISCOVER_ARTICLES[idx];
    if (!a) return;
    openModal(a.title, a.content);
};
window.openDiscoverCourse = function (idx) {
    const t = DISCOVER_COURSES[idx];
    if (!t) return;
    openModal(t.title, t.content);
};
window.filterDiscoverArticles = function (subject) {
    document.querySelectorAll('.article-item').forEach(function (el) {
        el.style.display = (subject === '全部' || el.getAttribute('data-subject') === subject) ? '' : 'none';
    });
    document.querySelectorAll('.subj-tab').forEach(function (t) {
        const isActive = t.getAttribute('data-subject') === subject;
        t.style.background = isActive ? '#3B82F6' : '#F3F4F6';
        t.style.color = isActive ? 'white' : '#374151';
    });
};

// ========== 发现页（API 驱动 + 硬编码降级） ==========
async function renderDiscoverPage(container) {
    // 尝试从后端 API 加载数据，失败时降级到硬编码数据
    try {
        const [apiArticles, apiCourses, apiSubjects] = await Promise.all([
            api.getPageData('discover-articles'),
            api.getPageData('discover-courses'),
            api.getPageData('discover-subjects')
        ]);
        if (apiArticles && Array.isArray(apiArticles) && apiArticles.length > 0) {
            DISCOVER_ARTICLES.length = 0;
            DISCOVER_ARTICLES.push(...apiArticles);
        }
        if (apiCourses && Array.isArray(apiCourses) && apiCourses.length > 0) {
            DISCOVER_COURSES.length = 0;
            DISCOVER_COURSES.push(...apiCourses);
        }
        if (apiSubjects && Array.isArray(apiSubjects) && apiSubjects.length > 0) {
            DISCOVER_SUBJECTS.length = 0;
            DISCOVER_SUBJECTS.push(...apiSubjects);
        }
    } catch (e) {
        console.log('[Discover] API 降级到硬编码数据:', e.message);
    }

    // 热门功能九宫格：点击跳转到主应用对应模块
    const features = [
        { icon: 'fa-book-open', bg: '#DBEAFE', color: '#3B82F6', label: '真题库', action: "handleRecommend('真题演练')" },
        { icon: 'fa-camera', bg: '#FCE7F3', color: '#EC4899', label: '拍照搜题', action: "switchPage('photo-ocr');setTimeout(function(){(window.__PHOTO_CAMERAGO__||function(){});(window.__PHOTO_CAMERA__&&typeof window.__PHOTO_CAMERA__.open==='function')&&window.__PHOTO_CAMERA__.open('camera','photo-parse');},180);" },
        { icon: 'fa-chart-line', bg: '#D1FAE5', color: '#10B981', label: '成绩分析', action: "switchPage('analysis')" },
        { icon: 'fa-map', bg: '#FEF3C7', color: '#F59E0B', label: '知识图谱', action: "switchPage('knowledge')" },
        { icon: 'fa-robot', bg: '#EDE9FE', color: '#8B5CF6', label: 'AI教练', action: "switchPage('ai-coach')" },
        { icon: 'fa-file-alt', bg: '#DBEAFE', color: '#3B82F6', label: 'AI组卷', action: "handleRecommend('智能组卷')" },
        { icon: 'fa-university', bg: '#FEE2E2', color: '#EF4444', label: '院校推荐', action: "switchPage('volunteer')" },
        { icon: 'fa-bullseye', bg: '#D1FAE5', color: '#10B981', label: '提分预测', action: "switchPage('exam-predict')" }
    ];
    const featuresHTML = features.map(f => `
        <div style="text-align:center;cursor:pointer;padding:8px 4px;border-radius:10px;transition:background 0.2s;" onclick="${f.action}" onmouseover="this.style.background='#F3F4F6'" onmouseout="this.style.background='transparent'">
            <div style="width:44px;height:44px;border-radius:12px;background:${f.bg};color:${f.color};display:flex;align-items:center;justify-content:center;font-size:18px;margin:0 auto 6px;"><i class="fas ${f.icon}"></i></div>
            <div style="font-size:12px;color:#374151;">${f.label}</div>
        </div>
    `).join('');

    // 备考干货 - 九科覆盖 + 学科筛选 + 解题技巧详情（使用全局 DISCOVER_ARTICLES）
    const articlesHTML = DISCOVER_ARTICLES.map((a, idx) => `
        <div class="article-item" data-subject="${a.subject}" style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #F3F4F6;cursor:pointer;" onclick="openDiscoverArticle(${idx})">
            <div style="width:60px;height:60px;border-radius:10px;background:${a.tagBg};color:${a.tagColor};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;"><i class="fas fa-book"></i></div>
            <div style="flex:1;min-width:0;">
                <span style="font-size:11px;background:${a.tagBg};color:${a.tagColor};padding:2px 6px;border-radius:4px;">${a.subject}</span>
                <div style="font-size:14px;font-weight:600;margin-top:4px;line-height:1.4;color:#374151;">${a.title}</div>
                <div style="font-size:12px;color:#9CA3AF;margin-top:4px;"><i class="far fa-eye"></i> ${a.read} 阅读</div>
            </div>
        </div>
    `).join('');

    // 学科筛选标签栏
    const subjTabsHTML = DISCOVER_SUBJECTS.map((s, i) => `
        <span class="subj-tab" data-subject="${s.name}" onclick="filterDiscoverArticles('${s.name}')" style="flex-shrink:0;padding:4px 12px;border-radius:14px;background:${i === 0 ? '#3B82F6' : '#F3F4F6'};color:${i === 0 ? 'white' : '#374151'};font-size:12px;cursor:pointer;white-space:nowrap;">${s.name}</span>
    `).join('');

    // 名师课程 - 九科覆盖 + 课程详情（使用全局 DISCOVER_COURSES）
    const coursesHTML = DISCOVER_COURSES.map((t, idx) => `
        <div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #F3F4F6;cursor:pointer;" onclick="openDiscoverCourse(${idx})">
            <div style="width:48px;height:48px;border-radius:50%;background:${t.bg};color:${t.color};display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;flex-shrink:0;">${t.name.charAt(0)}</div>
            <div style="flex:1;min-width:0;"><div style="font-size:14px;font-weight:600;color:#374151;">${t.title}</div><div style="font-size:12px;color:#9CA3AF;margin-top:3px;">${t.name} · ${t.subject} · ${t.lessons}课时 · ⭐${t.rating}</div></div>
            <div style="font-size:16px;font-weight:700;color:#EF4444;align-self:center;">${t.price}</div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="page-header"><h2><i class="fas fa-compass"></i> 发现</h2><p>探索学习资源、名师课程与备考干货</p></div>
        <div class="row">
            <div class="card" style="flex:1;max-width:680px;">
                <div style="display:flex;align-items:center;gap:12px;padding:16px;background:linear-gradient(135deg,#8B5CF6,#6D28D9);border-radius:12px;color:white;margin-bottom:16px;">
                    <div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;"><i class="fas fa-compass"></i></div>
                    <div style="flex:1;"><div style="font-size:17px;font-weight:700;">发现更多</div><div style="font-size:12px;opacity:0.85;margin-top:2px;">探索学习资源、名师课程与备考干货</div></div>
                </div>
                <div class="card-title"><i class="fas fa-th-large" style="color:#3B82F6;margin-right:6px;"></i>热门功能</div>
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px 4px;margin-top:12px;">${featuresHTML}</div>
            </div>
        </div>
        <div class="row">
            <div class="card" style="flex:1;max-width:680px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                    <div class="card-title"><i class="fas fa-fire" style="color:#EF4444;margin-right:6px;"></i>备考干货 · 九科解题技巧</div>
                    <span style="font-size:12px;color:#9CA3AF;">共${DISCOVER_ARTICLES.length}篇</span>
                </div>
                <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;margin-bottom:4px;-webkit-overflow-scrolling:touch;">${subjTabsHTML}</div>
                ${articlesHTML}
            </div>
        </div>
        <div class="row">
            <div class="card" style="flex:1;max-width:680px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                    <div class="card-title"><i class="fas fa-chalkboard-teacher" style="color:#8B5CF6;margin-right:6px;"></i>名师课程</div>
                    <span style="font-size:12px;color:#9CA3AF;">共${DISCOVER_COURSES.length}门</span>
                </div>
                ${coursesHTML}
            </div>
        </div>
    `;
}

// ========== navigateTo shim：兼容原型的动作按钮，将页面key映射到主应用switchPage ==========
if (typeof window.navigateTo !== 'function') {
    window.navigateTo = function (pageKey) {
        // 页面key映射表：原型page key -> main.js switchPage key
        const MAP = {
            'home': 'home',
            'error-book': 'mistakes',
            'mistakes': 'mistakes',
            'home-task-learn': 'home-task-learn',
            'ai-plan': 'ai-plan',
            'home-plan': 'plan',
            'plan': 'plan',
            'score-monthly': 'analysis',
            'score-rank': 'analysis',
            'analysis': 'analysis',
            'profile-badges': 'profile',
            'profile-main': 'profile',
            'profile-vip': 'profile',
            'profile': 'profile',
            'video-course': 'discover',
            'chat': 'discover',
            'discover': 'discover',
            'ai-explain': 'ai-explain',
            'knowledge': 'knowledge',
            'training': 'training',
            'exam-predict': 'exam-predict',
            'volunteer': 'volunteer',
            'message': 'message',
            'photo-ocr': 'photo-ocr'
        };
        const mapped = MAP[pageKey];
        if (mapped && typeof switchPage === 'function') {
            switchPage(mapped);
        } else {
            showToast('即将跳转「' + pageKey + '」', 'info');
        }
    };
}

// ========== 消息页（完整产品原型 message 模块：4分类+9条消息+富详情+操作+已读管理） ==========
(function installMainAppMessageModule() {
    if (typeof window.__MSG_DATA__ === 'undefined') {
        window.__MSG_CATS__ = [
            { key: 'study',   icon: 'fa-bell',        bg: '#DBEAFE', color: '#3B82F6', label: '学习提醒' },
            { key: 'task',    icon: 'fa-check-circle', bg: '#D1FAE5', color: '#10B981', label: '任务通知' },
            { key: 'social',  icon: 'fa-comments',    bg: '#FEF3C7', color: '#F59E0B', label: '互动消息' },
            { key: 'sys',     icon: 'fa-bullhorn',    bg: '#FEE2E2', color: '#EF4444', label: '系统公告' }
        ];
        window.__MSG_LIST__ = [
            {
                id: 'm_coach_001', cat: 'study', icon: 'fa-robot',      bg: '#EDE9FE', color: '#8B5CF6',
                title: 'AI学习教练', time: '刚刚', unread: true, pin: true,
                preview: '今日数学导数练习已完成，正确率75%，建议复习极值求解知识点…',
                body: [
                    '✅ 本次练习 <b>8/12 题做对</b>，正确率 <b style="color:#3B82F6;">75%</b>，略低于目标 85%。',
                    '📊 薄弱知识点定位：<b>极值求解的分类讨论</b>（5题做对2题），其次是 <b>端点比较</b>。',
                    '🎯 教练建议：',
                    '&nbsp;&nbsp;1) 今晚立即复习《选修2-2 极值与最值》3 个典型题。',
                    '&nbsp;&nbsp;2) 明天 08:00 已自动为你加入 1 次 <b>极值专题小测</b>。',
                    '&nbsp;&nbsp;3) 建议连续 3 天正确率 ≥ 85% 后再解锁「圆锥曲线」新章节。'
                ],
                actions: [
                    { label: '前往错题本',     page: 'error-book',    icon: 'fa-book' },
                    { label: '立即开始复习',   page: 'home-task-learn', icon: 'fa-play-circle', color: '#8B5CF6', primary: true }
                ]
            },
            {
                id: 'm_study_003', cat: 'study', icon: 'fa-bell',       bg: '#DBEAFE', color: '#3B82F6',
                title: '学习提醒', time: '10分钟前', unread: true, pin: false,
                preview: '你今天还有3个学习任务未完成，预计需要95分钟，加油！',
                body: [
                    '📋 今日任务一览：',
                    '&nbsp;&nbsp;1. <b>数学 · 圆锥曲线综合</b>　47 分钟　<span style="color:#F59E0B;">⏳ 待完成</span>',
                    '&nbsp;&nbsp;2. <b>生物 · 遗传规律</b>　　　 35 分钟　<span style="color:#F59E0B;">⏳ 待完成</span>',
                    '&nbsp;&nbsp;3. <b>历史 · 世界近代史</b>　　 32 分钟　<span style="color:#F59E0B;">⏳ 待完成</span>',
                    '',
                    '🔥 为了保持本周学习进度，建议今天优先做「数学 · 圆锥曲线综合」。',
                    '🎁 完成今日全部任务，可额外获得 <b style="color:#F59E0B;">+20 积分</b>。'
                ],
                actions: [
                    { label: '查看今日任务', page: 'home',          icon: 'fa-list-check' },
                    { label: '立即开始数学', page: 'home-task-learn', icon: 'fa-play-circle', color: '#3B82F6', primary: true }
                ]
            },
            {
                id: 'm_task_001', cat: 'task', icon: 'fa-flag-checkered', bg: '#D1FAE5', color: '#10B981',
                title: '任务通知', time: '30分钟前', unread: true, pin: false,
                preview: '「AI今日提分」模块自动为你安排了明天的学习计划，请确认。',
                body: [
                    '🗓 明日学习计划，已根据今日学情自动生成：',
                    '&nbsp;&nbsp;1. <b>数学：极值求解</b> 45min　<span style="color:#8B5CF6;">薄弱强化</span>',
                    '&nbsp;&nbsp;2. <b>英语：阅读理解专题</b> 40min　<span style="color:#F59E0B;">保持手感</span>',
                    '&nbsp;&nbsp;3. <b>物理：电磁感应练习</b> 40min　<span style="color:#10B981;">基础巩固</span>',
                    '&nbsp;&nbsp;4. <b>语文：古诗文赏析</b> 25min　<span style="color:#3B82F6;">日常积累</span>',
                    '',
                    '⏱ 总计 150 分钟，预计提升 <b style="color:#10B981;">+4 分</b>。',
                    '若需要调整，可前往「AI学习计划」页面手动增删任务。'
                ],
                actions: [
                    { label: '前往AI学习计划', page: 'ai-plan', icon: 'fa-calendar-check' },
                    { label: '确认并发送提醒', onclick: 'window.__MSG_CONFIRM_PLAN__()', icon: 'fa-check-circle', color: '#10B981', primary: true }
                ]
            },
            {
                id: 'm_task_002', cat: 'task', icon: 'fa-bullseye', bg: '#ECFDF5', color: '#059669',
                title: '任务通知', time: '2小时前', unread: false, pin: false,
                preview: '本月月考目标完成挑战已更新：冲击「总分 620」！',
                body: [
                    '🏆 本月目标：总分 <b style="color:#EF4444;">620</b>',
                    '当前估分：580 → 目标差值：<b>+40 分</b>',
                    '各科建议提分：数学 +10 / 英语 +8 / 语文 +6 / 物理 +6 / 化学 +4 / 生物 +3 / 其他 +3',
                    '',
                    '🚀 系统已为你生成「冲刺提分路线图」，点下方「查看详情」查看。'
                ],
                actions: [
                    { label: '查看月考分析', page: 'score-monthly', icon: 'fa-chart-line' },
                    { label: '确认参与挑战', onclick: 'window.__MSG_JOIN_CHALLENGE__()', icon: 'fa-bullseye', color: '#059669', primary: true }
                ]
            },
            {
                id: 'm_study_002', cat: 'study', icon: 'fa-trophy',       bg: '#FEF3C7', color: '#F59E0B',
                title: '成就解锁', time: '1小时前', unread: false, pin: false,
                preview: '恭喜你连续学习7天，已解锁「坚持之星」勋章！',
                body: [
                    '🏅 <b style="font-size:16px;">坚持之星（Lv.7）</b>',
                    '你已连续学习 <b style="color:#F59E0B;">7 天</b>，累计 <b style="color:#10B981;">28 小时</b>！',
                    '',
                    '🎁 奖励：',
                    '&nbsp;&nbsp;· 积分：<b>+100</b>',
                    '&nbsp;&nbsp;· 1 次「AI讲题引擎」深度使用机会',
                    '&nbsp;&nbsp;· 解锁「坚持之星」头像框（有效期 30 天）',
                    '',
                    '💪 下一枚勋章：<b style="color:#8B5CF6;">连续学习 14 天「学习强者」</b>（+500积分 + VIP 3天）'
                ],
                actions: [
                    { label: '查看全部勋章', page: 'profile-badges', icon: 'fa-medal' },
                    { label: '去个人中心佩戴', page: 'profile-main', icon: 'fa-user-circle', color: '#F59E0B', primary: true }
                ]
            },
            {
                id: 'm_social_001', cat: 'social', icon: 'fa-user-graduate', bg: '#FEF3C7', color: '#D97706',
                title: '互动消息', time: '2小时前', unread: false, pin: false,
                preview: '名师「王老师（数学特级）」回复了你的提问：「极值求解……」',
                body: [
                    '👨‍🏫 <b>王老师（数学特级）</b> 回复了你：',
                    '<div style="background:#EFF6FF;border-radius:10px;padding:12px;margin:8px 0;font-size:13px;line-height:1.7;color:#1E3A8A;">',
                    '&nbsp;&nbsp;同学你好，这题的关键在于「对 a 做分类讨论 + 验证端点可导性」。我已经上传了一段 <b>8 分钟</b> 的手写板书视频，你点下方链接就能看到。看完自己再做一遍哦！',
                    '</div>',
                    '📎 老师已附带：<b>极值·板书视频.mp4</b>（8:12） · <b>同类推荐 5 题.pdf</b>'
                ],
                actions: [
                    { label: '打开聊天', page: 'chat',          icon: 'fa-comments' },
                    { label: '查看板书视频', page: 'video-course', icon: 'fa-circle-play', color: '#D97706', primary: true }
                ]
            },
            {
                id: 'm_score_001', cat: 'study', icon: 'fa-chart-line', bg: '#D1FAE5', color: '#10B981',
                title: '成绩报告', time: '3小时前', unread: false, pin: false,
                preview: '你的本月月考分析报告已生成，总体成绩提升8分，点击查看详情。',
                body: [
                    '📄 <b>月考分析报告 · 2026 年 8 月</b>',
                    '总分：<b style="color:#10B981;">588 分</b>　上次：<b>580 分</b>　<b style="color:#10B981;">↑ +8</b>',
                    '校排名：<b>46 / 512</b>（↑ 8 名）　全省预估：<b>前 6.7%</b>',
                    '',
                    '📈 各科表现：',
                    '&nbsp;&nbsp;· 语文 <b>112</b>（↑3）　数学 <b>121</b>（↑4）　英语 <b>128</b>（↑2）',
                    '&nbsp;&nbsp;· 物理 <b>86</b>（↑1）　化学 <b>74</b>（↓2 ↓ 警示）　生物 <b>67</b>（↑0）',
                    '',
                    '⚠️ 下次重点：化学「有机合成」部分严重失分，建议本周重点攻克。'
                ],
                actions: [
                    { label: '查看完整报告', page: 'score-monthly', icon: 'fa-chart-column', color: '#10B981', primary: true },
                    { label: '全省预测排名', page: 'score-rank',    icon: 'fa-ranking-star' }
                ]
            },
            {
                id: 'm_sys_001', cat: 'sys', icon: 'fa-bullhorn', bg: '#FEE2E2', color: '#EF4444',
                title: '系统公告', time: '昨天', unread: false, pin: false,
                preview: '系统将于今晚22:00-23:00进行维护升级，届时部分功能可能不可用。',
                body: [
                    '📢 <b>系统维护升级通知 v2026.08</b>',
                    '⏰ 时间：<b>今晚 22:00 — 23:00（约 60 分钟）</b>',
                    '',
                    '✨ 升级内容：',
                    '&nbsp;&nbsp;1. AI 学习教练大模型升级 → 答题准确率提升 12%',
                    '&nbsp;&nbsp;2. 拍照搜题引擎 v3 上线 → 支持手写体、公式识别',
                    '&nbsp;&nbsp;3. 错题本新增「知识点脉络图」功能',
                    '&nbsp;&nbsp;4. 修复若干已知的加载问题',
                    '',
                    '⚠️ 维护期间：所有作答、拍照、提交功能将暂停；已生成的任务与数据不会丢失。',
                    '给您带来的不便，敬请谅解～'
                ],
                actions: [
                    { label: '查看完整公告', onclick: 'window.__MSG_SHOW_ANNOUNCE__()', icon: 'fa-scroll' },
                    { label: '提前预约升级提醒', onclick: 'window.__MSG_REMINDER__()', icon: 'fa-bell', color: '#EF4444', primary: true }
                ]
            },
            {
                id: 'm_sys_002', cat: 'sys', icon: 'fa-gift', bg: '#FDF4FF', color: '#A855F7',
                title: '系统公告 · 活动', time: '昨天', unread: false, pin: false,
                preview: '🎁 开学季福利：VIP 会员 3 折，前 1000 名额外赠「压轴题密卷」！',
                body: [
                    '🎉 <b>2026 开学季 · AI 高考 VIP 限时福利</b>',
                    '📅 活动时间：2026.08.20 — 2026.09.10',
                    '',
                    '💰 限时折扣：',
                    '&nbsp;&nbsp;· 月卡：原价 ¥38　<b style="color:#EF4444;">¥ 12</b>（3 折）',
                    '&nbsp;&nbsp;· 季卡：原价 ¥98　<b style="color:#EF4444;">¥ 38</b>（3.9 折）',
                    '&nbsp;&nbsp;· 年卡：原价 ¥298　<b style="color:#EF4444;">¥ 128</b>（4.3 折，赠 2 个月）',
                    '',
                    '🎁 前 1000 名购买：额外赠送《2026 高考名校压轴题密卷 · 20 套 + 名师视频讲解》'
                ],
                actions: [
                    { label: '前往VIP会员', page: 'profile-vip', icon: 'fa-crown', color: '#A855F7', primary: true },
                    { label: '分享活动',       onclick: 'window.__MSG_SHARE__()', icon: 'fa-share-alt' }
                ]
            }
        ];
    }
    if (typeof window.__MSG_COUNT__ !== 'function') {
        window.__MSG_COUNT__ = function (catKey) {
            const list = window.__MSG_LIST__ || [];
            if (!catKey) return list.filter(m => m.unread).length;
            return list.filter(m => m.cat === catKey && m.unread).length;
        };
    }
    if (typeof window.__MSG_OPEN_CAT__ !== 'function') {
        window.__MSG_OPEN_CAT__ = function (catKey) {
            const cat = (window.__MSG_CATS__ || []).find(c => c.key === catKey);
            if (!cat) return;
            const list = (window.__MSG_LIST__ || []).filter(m => m.cat === catKey);
            const unreadCount = list.filter(m => m.unread).length;
            let rows = '';
            if (list.length === 0) {
                rows = '<div style="text-align:center;color:#9CA3AF;padding:30px 10px;font-size:13px;"><i class="fas fa-inbox" style="font-size:28px;margin-bottom:10px;display:block;"></i>暂无更多' + cat.label + '。</div>';
            } else {
                list.forEach((m) => {
                    const realIdx = window.__MSG_LIST__.indexOf(m);
                    rows += ''
                        + '<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #F3F4F6;cursor:pointer;" '
                        +       'onclick="closeModal();window.__MSG_OPEN_DETAIL__(' + realIdx + ')">'
                        +   '<div style="width:42px;height:42px;border-radius:12px;background:' + m.bg + ';color:' + m.color + ';display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;position:relative;">'
                        +     '<i class="fas ' + m.icon + '"></i>'
                        +     (m.unread ? '<span style="position:absolute;top:-2px;right:-2px;width:8px;height:8px;background:#EF4444;border-radius:50%;border:1.5px solid white;"></span>' : '')
                        +   '</div>'
                        +   '<div style="flex:1;min-width:0;">'
                        +     '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">'
                        +       '<span style="font-size:13px;font-weight:600;color:#374151;">' + m.title + '</span>'
                        +       '<span style="font-size:11px;color:#9CA3AF;flex-shrink:0;">' + m.time + '</span>'
                        +     '</div>'
                        +     '<div style="font-size:12px;color:#6B7280;margin-top:3px;line-height:1.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + m.preview + '</div>'
                        +   '</div>'
                        +   '<i class="fas fa-chevron-right" style="color:#D1D5DB;font-size:12px;align-self:center;"></i>'
                        + '</div>';
                });
            }
            const header = ''
                + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">'
                +   '<div style="display:flex;align-items:center;gap:10px;">'
                +     '<div style="width:38px;height:38px;border-radius:12px;background:' + cat.bg + ';color:' + cat.color + ';display:flex;align-items:center;justify-content:center;"><i class="fas ' + cat.icon + '"></i></div>'
                +     '<div style="line-height:1.25;">'
                +       '<div style="font-size:15px;font-weight:700;color:#111827;">' + cat.label + '</div>'
                +       '<div style="font-size:11px;color:#6B7280;margin-top:2px;">共 ' + list.length + ' 条' + (unreadCount ? (' · 未读 ' + unreadCount) : '') + '</div>'
                +     '</div>'
                +   '</div>'
                +   (unreadCount
                    ?   '<button type="button" style="background:#EFF6FF;color:#3B82F6;border:none;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;" '
                        +     'onclick="window.__MSG_MARK_CAT_READ__(\'' + catKey + '\');this.innerText=\'已全部标记\';this.style.background=\'#F3F4F6\';this.style.color=\'#6B7280\';"><i class="fas fa-check-double"></i> 全部标为已读</button>'
                    :   '')
                + '</div>';
            openModal(cat.label + ' · ' + list.length + ' 条', header + rows);
        };
    }
    if (typeof window.__MSG_OPEN_DETAIL__ !== 'function') {
        window.__MSG_OPEN_DETAIL__ = function (idx) {
            const m = window.__MSG_LIST__[idx | 0];
            if (!m) { showToast && showToast('消息不存在'); return; }
            const cat = (window.__MSG_CATS__ || []).find(c => c.key === m.cat) || {};
            m.unread = false;
            const banner = ''
                + '<div style="display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:12px;background:linear-gradient(135deg,' + (m.bg || '#E0E7FF') + ' 0%,#FFFFFF 100%);margin-bottom:14px;">'
                +   '<div style="width:48px;height:48px;border-radius:14px;background:white;color:' + m.color + ';display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 10px rgba(0,0,0,0.06);">'
                +     '<i class="fas ' + m.icon + '"></i>'
                +   '</div>'
                +   '<div style="flex:1;min-width:0;line-height:1.4;">'
                +     '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">'
                +       '<span style="font-size:15px;font-weight:700;color:#111827;">' + m.title + '</span>'
                +       (cat.label ? ('<span style="padding:3px 8px;border-radius:999px;font-size:10px;font-weight:600;background:' + cat.bg + ';color:' + cat.color + ';">' + cat.label + '</span>') : '')
                +     '</div>'
                +     '<div style="font-size:12px;color:#6B7280;margin-top:4px;"><i class="far fa-clock"></i> ' + m.time + (m.pin ? '　<i class="fas fa-thumbtack" style="color:#EF4444;"></i> 已置顶' : '') + '</div>'
                +   '</div>'
                + '</div>';
            const body = (m.body || [m.preview || '']).map(p => '<p style="margin:4px 0 8px;">' + p + '</p>').join('');
            let actionsHTML = '';
            if (Array.isArray(m.actions) && m.actions.length) {
                actionsHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">'
                    + m.actions.map((a) => {
                        const bg = a.primary ? (a.color || '#3B82F6') : 'white';
                        const fc = a.primary ? 'white' : (a.color || '#374151');
                        const bd = a.primary ? 'none' : '1px solid #E5E7EB';
                        let click = '';
                        if (a.page) {
                            click = "closeModal();window.navigateTo('" + a.page + "');";
                        } else if (a.onclick) {
                            click = "closeModal();" + a.onclick;
                        }
                        return '<button type="button" style="flex:1 1 45%;min-width:150px;height:40px;border-radius:10px;font-size:13px;font-weight:600;'
                            + 'background:' + bg + ';color:' + fc + ';border:' + bd + ';cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;"'
                            + ' onclick="' + click + '">'
                            + (a.icon ? ('<i class="fas ' + a.icon + '"></i>') : '')
                            + a.label + '</button>';
                    }).join('')
                    + '</div>';
            }
            openModal(m.title, banner + body + actionsHTML);
        };
    }
    if (typeof window.__MSG_MARK_CAT_READ__ !== 'function') {
        window.__MSG_MARK_CAT_READ__ = function (catKey) {
            (window.__MSG_LIST__ || []).forEach(m => {
                if (!catKey || catKey === 'all' || m.cat === catKey) m.unread = false;
            });
            try {
                document.querySelectorAll('[data-unread-dot]').forEach(function (n) { n.style.display = 'none'; });
                const badge = document.querySelector('[data-unread-total]');
                if (badge) badge.style.display = 'none';
            } catch (e) {}
            if (typeof showToast === 'function') showToast('已标为已读', 'success');
            // 主应用：刷新消息页
            try {
                const scrollArea = document.querySelector('.content-scroll');
                if (scrollArea) renderMessagePage(scrollArea);
            } catch (e) {}
        };
    }
    if (typeof window.__MSG_CONFIRM_PLAN__ !== 'function') {
        window.__MSG_CONFIRM_PLAN__ = function () { showToast && showToast('✅ 明日学习计划已确认，明早 07:30 会通过微信提醒你~', 'success'); };
        window.__MSG_JOIN_CHALLENGE__ = function () { showToast && showToast('🎯 挑战已开启！完成即获得「620 分冲刺」专属勋章', 'success'); };
        window.__MSG_SHOW_ANNOUNCE__ = function () {
            openModal('完整公告 · v2026.08 维护升级',
                '<div style="font-size:13px;line-height:1.8;color:#374151;">'
                + '<p><b style="color:#EF4444;">Q&A · 维护常见问题：</b></p>'
                + '<p><b>Q1：我做到一半的题会丢失吗？</b><br>A：不会，已作答自动保存，结束后可继续。</p>'
                + '<p><b>Q2：错题本、我的笔记能正常看吗？</b><br>A：浏览正常，仅无法上传新内容。</p>'
                + '<p><b>Q3：维护超时怎么办？</b><br>A：超时超过 15 分钟，自动补偿「AI 讲题」1 次。</p>'
                + '<p style="text-align:center;color:#6B7280;margin-top:12px;">— 感谢你对 AI 高考的支持 —</p>'
                + '</div>');
        };
        window.__MSG_REMINDER__ = function () { showToast && showToast('🔔 已预约 22:00 升级提醒，会提前 5 分钟弹出通知', 'success'); };
        window.__MSG_SHARE__ = function () { showToast && showToast('📤 开学季分享链接已生成，并复制到剪贴板（演示）', 'success'); };
    }
})();

function renderMessagePage(container) {
    const cats = window.__MSG_CATS__;
    const list = window.__MSG_LIST__;
    const unreadTotal = list.filter(m => m.unread).length;

    // 分类入口卡片
    let catsHTML = '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">';
    cats.forEach(function (t) {
        const count = window.__MSG_COUNT__(t.key);
        catsHTML += '<div style="text-align:center;cursor:pointer;position:relative;padding:10px 4px;border-radius:10px;transition:background 0.2s;" '
            +       'onclick="window.__MSG_OPEN_CAT__(\'' + t.key + '\')" onmouseover="this.style.background=\'#F3F4F6\'" onmouseout="this.style.background=\'transparent\'">'
            +   '<div style="width:46px;height:46px;border-radius:50%;background:' + t.bg + ';color:' + t.color + ';display:flex;align-items:center;justify-content:center;font-size:18px;margin:0 auto 6px;position:relative;"><i class="fas ' + t.icon + '"></i>'
            +     (count > 0 ? '<span style="position:absolute;top:-2px;right:-2px;background:#EF4444;color:white;font-size:10px;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px;">' + count + '</span>' : '')
            +   '</div>'
            +   '<div style="font-size:12px;color:#374151;">' + t.label + '</div>'
            + '</div>';
    });
    catsHTML += '</div>';

    // 最新消息列表
    const pins = list.filter(m => m.pin);
    const normals = list.filter(m => !m.pin);
    const ordered = pins.concat(normals);
    let msgsHTML = '';
    ordered.forEach(function (m) {
        const realIdx = list.indexOf(m);
        msgsHTML += ''
            + '<div style="display:flex;gap:12px;padding:14px 0;border-bottom:1px solid #F3F4F6;cursor:pointer;" '
            +       'onclick="window.__MSG_OPEN_DETAIL__(' + realIdx + ')">'
            +   '<div style="width:44px;height:44px;border-radius:12px;background:' + m.bg + ';color:' + m.color + ';display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;position:relative;"><i class="fas ' + m.icon + '"></i>'
            +     (m.unread ? '<span data-unread-dot style="position:absolute;top:-2px;right:-2px;width:8px;height:8px;background:#EF4444;border-radius:50%;border:1.5px solid white;"></span>' : '')
            +   '</div>'
            +   '<div style="flex:1;min-width:0;">'
            +     '<div style="display:flex;justify-content:space-between;align-items:center;">'
            +       '<span style="font-size:15px;font-weight:600;color:#374151;">' + m.title + (m.pin ? ' <i class="fas fa-thumbtack" style="color:#EF4444;font-size:10px;"></i>' : '') + '</span>'
            +       '<span style="font-size:12px;color:#9CA3AF;flex-shrink:0;">' + m.time + '</span>'
            +     '</div>'
            +     '<div style="font-size:13px;color:#6B7280;margin-top:3px;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + m.preview + '</div>'
            +   '</div>'
            +   '<i class="fas fa-chevron-right" style="color:#D1D5DB;font-size:14px;align-self:center;"></i>'
            + '</div>';
    });

    container.innerHTML = `
        <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
            <div>
                <h2><i class="fas fa-comment-dots"></i> 消息</h2>
                <p>学习通知与系统消息中心
                    ${unreadTotal ? '　<span data-unread-total style="background:#EF4444;color:white;font-size:11px;padding:2px 10px;border-radius:999px;font-weight:600;">' + unreadTotal + ' 未读</span>' : ''}
                </p>
            </div>
            <button type="button" style="background:white;border:1px solid #E5E7EB;border-radius:999px;padding:8px 18px;font-size:13px;color:#374151;cursor:pointer;font-weight:600;" onclick="window.__MSG_MARK_CAT_READ__('all');"><i class="fas fa-check-double"></i> 全部已读</button>
        </div>
        <div class="row">
            <div class="card" style="flex:1;max-width:680px;">
                ${catsHTML}
            </div>
        </div>
        <div class="row">
            <div class="card" style="flex:1;max-width:680px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                    <div class="card-title" style="margin:0;">最新消息</div>
                    <div style="font-size:12px;color:#6B7280;">共 ${list.length} 条</div>
                </div>
                <div style="margin-top:8px;">${msgsHTML}</div>
            </div>
        </div>
    `;
}

// ========== 主应用：相机动态镜头（与原型 pages-photo.js 同步） ==========
(function installMainAppCamera(){
    if (window.__PHOTO_CAMERA__) return;
    // 若主应用没有全局 showToast，补一个轻提示
    if (typeof window.showToast !== 'function') {
        window.showToast = function (msg /*, type*/) {
            var old = document.getElementById('main-app-toast');
            if (old) old.remove();
            var t = document.createElement('div');
            t.id = 'main-app-toast';
            t.textContent = msg;
            t.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(17,24,39,0.92);color:#fff;padding:12px 22px;border-radius:24px;font-size:14px;z-index:12000;box-shadow:0 8px 24px rgba(0,0,0,0.25);max-width:82%;text-align:center;';
            document.body.appendChild(t);
            setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 1600);
            setTimeout(function () { t.remove(); }, 2000);
        };
    }
    window.__PHOTO_CAMERAGO__ = function (mode, afterTarget) {
        try {
            if (window.__PHOTO_CAMERA__ && typeof window.__PHOTO_CAMERA__.open === 'function') {
                window.__PHOTO_CAMERA__.open(mode || 'camera', afterTarget || 'photo-parse');
                return true;
            }
        } catch (e) {}
        window.showToast && window.showToast('打开相机镜头…');
        if (typeof window.switchPage === 'function') {
            try { window.switchPage(afterTarget || 'photo-parse'); } catch (ee) {}
        }
        return false;
    };
    var cam = {
        timers: [],
        flashOn: false,
        clear: function () {
            (this.timers || []).forEach(function (id) { clearInterval(id); clearTimeout(id); });
            this.timers = [];
            var old = document.getElementById('main-camera-overlay');
            if (old) old.remove();
        },
        close: function (cb) {
            this.clear();
            if (typeof cb === 'function') setTimeout(cb, 50);
        },
        shoot: function (afterTarget) {
            var self = this;
            var flash = document.querySelector('#mcam-flash-layer');
            var prog = document.querySelector('#mcam-progress');
            var pText = document.querySelector('#mcam-p-text');
            var pBar = document.querySelector('#mcam-p-bar');
            if (!flash || !prog) return;
            flash.style.transition = 'opacity 80ms linear';
            flash.style.opacity = '1';
            setTimeout(function () { flash.style.transition = 'opacity 220ms ease-out'; flash.style.opacity = '0'; }, 90);
            var ov = document.getElementById('main-camera-overlay');
            if (ov) ov.style.animation = 'mainCamShake 180ms';
            setTimeout(function () {
                prog.style.display = 'flex';
                var steps = ['正在检测题目区域…','正在矫正透视畸变…','正在 OCR 文字识别…','正在匹配题库与 AI 推理…','正在生成解析与相似题…'];
                var i = 0;
                var next = function () {
                    if (i >= steps.length) {
                        self.close();
                        window.showToast && window.showToast('✅ 识别完成，跳转解析…');
                        if (typeof window.switchPage === 'function') {
                            try { window.switchPage(afterTarget); return; } catch (e) {}
                        }
                        return;
                    }
                    pText.textContent = steps[i];
                    pBar.style.width = Math.round(((i+1)/steps.length)*100) + '%';
                    i++;
                    var t = setTimeout(next, 650);
                    self.timers.push(t);
                };
                next();
            }, 260);
        },
        open: function (mode, afterTarget) {
            mode = mode || 'camera';
            afterTarget = afterTarget || 'photo-parse';
            var self = this;
            this.clear();
            // 注入样式
            if (!document.getElementById('main-cam-css')) {
                var s = document.createElement('style');
                s.id = 'main-cam-css';
                s.textContent = [
                    '@keyframes mainCamBreath { 0%,100%{opacity:.2;transform:scale(1)} 50%{opacity:.55;transform:scale(1.08)} }',
                    '@keyframes mainCamScan   { 0%{transform:translateY(0)} 100%{transform:translateY(calc(100vh - 340px))} }',
                    '@keyframes mainCamFocus  { 0%{transform:translate(0,0) rotate(0)} 30%{transform:translate(40px,-20px) rotate(6deg)} 60%{transform:translate(-30px,28px) rotate(-4deg)} 100%{transform:translate(0,0) rotate(0)} }',
                    '@keyframes mainCamSpin   { to { transform: rotate(360deg) } }',
                    '@keyframes mainCamShake  { 0%,100%{transform:translate(0,0)} 20%{transform:translate(-2px,1px)} 40%{transform:translate(2px,-1px)} 60%{transform:translate(-1px,2px)} 80%{transform:translate(1px,-2px)} }'
                ].join('\n');
                document.head.appendChild(s);
            }
            var overlay = document.createElement('div');
            overlay.id = 'main-camera-overlay';
            overlay.style.cssText = 'position:fixed;inset:0;background:#000;z-index:11000;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;overflow:hidden;';
            var lens, shutterHint;
            if (mode === 'camera') {
                lens =
                '<div style="position:absolute;inset:0;">' +
                  '<div id="mcam-bg" style="position:absolute;inset:0;background:radial-gradient(ellipse at 30% 30%, rgba(96,165,250,0.22), transparent 55%),radial-gradient(ellipse at 70% 70%, rgba(16,185,129,0.22), transparent 55%),linear-gradient(135deg,#1f2937,#111827,#0b1220);transition:background 2.8s ease-in-out;"></div>' +
                  '<div style="position:absolute;inset:0;opacity:0.08;background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.5) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(255,255,255,0.3) 0 1px,transparent 1px 2px);mix-blend-mode:overlay;"></div>' +
                  '<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18) 0%, transparent 38%);animation:mainCamBreath 3.2s ease-in-out infinite;"></div>' +
                '</div>' +
                // 四角取景
                '<div style="position:absolute;top:70px;left:16px;width:44px;height:44px;border-top:4px solid #34D399;border-left:4px solid #34D399;border-radius:8px 0 0 0;z-index:2;"></div>' +
                '<div style="position:absolute;top:70px;right:16px;width:44px;height:44px;border-top:4px solid #34D399;border-right:4px solid #34D399;border-radius:0 8px 0 0;z-index:2;"></div>' +
                '<div style="position:absolute;bottom:220px;left:16px;width:44px;height:44px;border-bottom:4px solid #34D399;border-left:4px solid #34D399;border-radius:0 0 0 8px;z-index:2;"></div>' +
                '<div style="position:absolute;bottom:220px;right:16px;width:44px;height:44px;border-bottom:4px solid #34D399;border-right:4px solid #34D399;border-radius:0 0 8px 0;z-index:2;"></div>' +
                // 扫描线
                '<div style="position:absolute;left:8%;right:8%;top:90px;height:2px;background:linear-gradient(90deg,transparent,#34D399,#60A5FA,transparent);box-shadow:0 0 14px #34D399,0 0 3px #fff;z-index:2;animation:mainCamScan 2.6s ease-in-out infinite alternate;"></div>' +
                // 九宫格
                '<div style="position:absolute;top:25%;left:0;right:0;height:1px;background:rgba(255,255,255,0.14);z-index:1;"></div>' +
                '<div style="position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(255,255,255,0.14);z-index:1;"></div>' +
                '<div style="position:absolute;top:75%;left:0;right:0;height:1px;background:rgba(255,255,255,0.14);z-index:1;"></div>' +
                '<div style="position:absolute;top:0;bottom:0;left:33.333%;width:1px;background:rgba(255,255,255,0.14);z-index:1;"></div>' +
                '<div style="position:absolute;top:0;bottom:0;left:66.666%;width:1px;background:rgba(255,255,255,0.14);z-index:1;"></div>' +
                // 对焦框
                '<div style="position:absolute;top:42%;left:38%;width:120px;height:120px;border:1.5px dashed #F87171;border-radius:8px;animation:mainCamFocus 3.8s ease-in-out infinite;z-index:2;"></div>' +
                // 取景提示
                '<div style="position:absolute;top:130px;left:50%;transform:translateX(-50%);padding:6px 14px;border-radius:16px;background:rgba(0,0,0,0.45);font-size:12px;color:#D1FAE5;letter-spacing:.5px;z-index:3;">📐 请将题目放入取景框</div>' +
                // AI 状态提示
                '<div id="mcam-status" style="position:absolute;top:58px;right:16px;padding:4px 10px;border-radius:12px;background:rgba(52,211,153,0.18);color:#6EE7B7;font-size:11px;border:1px solid rgba(52,211,153,0.35);z-index:3;"><i class="fas fa-sync-alt fa-spin" style="margin-right:4px;"></i>AI 识别就绪</div>' +
                // 模式切换
                '<div style="position:absolute;left:0;right:0;bottom:180px;text-align:center;z-index:3;">' +
                  '<div id="mcam-modes" style="display:inline-flex;gap:20px;padding:6px 14px;border-radius:22px;background:rgba(0,0,0,0.45);font-size:13px;">' +
                    '<span data-m="video" style="color:rgba(255,255,255,0.55);cursor:pointer;">视频</span>' +
                    '<span data-m="camera" style="color:#fff;font-weight:700;cursor:pointer;">拍照</span>' +
                    '<span data-m="album" style="color:rgba(255,255,255,0.55);cursor:pointer;">相册</span>' +
                  '</div>' +
                '</div>';
                shutterHint = '轻触快门按钮拍照';
            } else {
                // 相册模式
                var thumbs = '';
                for (var i = 0; i < 9; i++) {
                    var c1 = ['#DBEAFE','#FCE7F3','#FEF3C7','#EDE9FE','#D1FAE5','#FED7AA','#FFE4E6','#CFFAFE','#F3E8FF'][i];
                    var c2 = ['#3B82F6','#EC4899','#F59E0B','#8B5CF6','#10B981','#EA580C','#E11D48','#0891B2','#7C3AED'][i];
                    var ic = ['fa-square-root-alt','fa-atom','fa-flask','fa-language','fa-paragraph','fa-chart-line','fa-function','fa-vector-square','fa-hashtag'][i] || 'fa-image';
                    thumbs += '<div class="mcam-t" data-i="' + i + '" style="position:relative;aspect-ratio:1/1;border-radius:8px;background:' + c1 + ';display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;">' +
                        '<i class="fas ' + ic + '" style="font-size:26px;color:' + c2 + ';opacity:.85;"></i>' +
                        '<div class="mcam-ck" style="position:absolute;top:6px;right:6px;width:20px;height:20px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.85);display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(.5);transition:all .2s;"></div>' +
                        '</div>';
                }
                lens = '<div style="position:absolute;top:60px;bottom:180px;left:0;right:0;padding:14px;overflow-y:auto;background:#000;">' +
                    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">' + thumbs + '</div></div>';
                shutterHint = '点击一张照片以识别';
            }
            var topBar = '<div style="position:absolute;top:0;left:0;right:0;padding:14px 16px 10px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(180deg,rgba(0,0,0,0.6),transparent);z-index:3;">' +
                '<div id="mcam-close" style="width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;cursor:pointer;"><i class="fas fa-times"></i></div>' +
                '<div style="font-size:15px;font-weight:600;letter-spacing:1px;">' + (mode === 'album' ? '选择照片' : '相机') + '</div>' +
                '<div id="mcam-flash" style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;background:' + (this.flashOn ? '#F59E0B' : 'rgba(255,255,255,0.15)') + ';"><i class="fas fa-bolt"></i></div>' +
                '</div>';
            var bottomBar = '<div style="position:absolute;left:0;right:0;bottom:0;padding:24px 16px 28px;background:linear-gradient(0deg,rgba(0,0,0,0.85),transparent);z-index:3;text-align:center;">' +
              '<div style="display:flex;align-items:center;justify-content:space-around;">' +
                '<div id="mcam-open-album" style="width:46px;height:46px;border-radius:10px;overflow:hidden;cursor:pointer;border:1.5px solid rgba(255,255,255,0.6);background:linear-gradient(135deg,#60A5FA,#EC4899);display:flex;align-items:center;justify-content:center;"><i class="fas fa-images" style="font-size:20px;"></i></div>' +
                '<div id="mcam-shutter" style="width:74px;height:74px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 0 0 3px #000,0 0 0 5px #fff;">' +
                  '<div style="width:62px;height:62px;border-radius:50%;background:#fff;border:3px solid #111827;"></div>' +
                '</div>' +
                '<div id="mcam-switch" style="width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;cursor:pointer;"><i class="fas fa-sync-alt" style="font-size:18px;"></i></div>' +
              '</div>' +
              '<div style="margin-top:14px;font-size:12px;color:rgba(255,255,255,0.6);">' + shutterHint + '</div>' +
            '</div>';
            var flash = '<div id="mcam-flash-layer" style="position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;z-index:9;"></div>';
            var progress = '<div id="mcam-progress" style="position:absolute;inset:0;background:rgba(0,0,0,0.82);z-index:10;display:none;align-items:center;justify-content:center;flex-direction:column;">' +
              '<div style="width:64px;height:64px;border-radius:50%;border:3px solid rgba(255,255,255,0.15);border-top-color:#34D399;animation:mainCamSpin .9s linear infinite;margin-bottom:18px;"></div>' +
              '<div id="mcam-p-text" style="font-size:14px;color:#D1FAE5;letter-spacing:1px;">正在检测题目区域…</div>' +
              '<div style="width:220px;height:4px;border-radius:2px;background:rgba(255,255,255,0.12);margin-top:16px;overflow:hidden;"><div id="mcam-p-bar" style="width:0%;height:100%;background:linear-gradient(90deg,#34D399,#60A5FA);transition:width .4s ease;"></div></div>' +
            '</div>';
            overlay.innerHTML = topBar + lens + bottomBar + flash + progress;
            document.body.appendChild(overlay);

            var $ = function (id) { return overlay.querySelector('#' + id); };
            var c = $('mcam-close'); if (c) c.onclick = function () { self.close(); };
            var f = $('mcam-flash'); if (f) f.onclick = function () {
                self.flashOn = !self.flashOn;
                f.style.background = self.flashOn ? '#F59E0B' : 'rgba(255,255,255,0.15)';
                window.showToast && window.showToast(self.flashOn ? '闪光灯：开' : '闪光灯：关');
                var bg = $('mcam-bg');
                if (bg) bg.style.background = self.flashOn ? 'radial-gradient(ellipse at 50% 50%, rgba(255,251,235,0.55), transparent 60%),linear-gradient(135deg,#374151,#1F2937,#0b1220)' : '';
            };
            var sh = $('mcam-shutter'); if (sh) sh.onclick = function () { self.shoot(afterTarget); };
            var al = $('mcam-open-album'); if (al) al.onclick = function () { self.close(function () { self.open('album', afterTarget); }); };
            var sw = $('mcam-switch'); if (sw) sw.onclick = function () {
                var bg = $('mcam-bg');
                if (bg) { bg.style.transition = 'background 1s'; bg.style.background = 'radial-gradient(ellipse at 70% 40%, rgba(236,72,153,0.3), transparent 60%),radial-gradient(ellipse at 30% 80%, rgba(96,165,250,0.3), transparent 60%),linear-gradient(135deg,#111827,#1f2937,#0b1220)'; }
                window.showToast && window.showToast('已切换摄像头');
            };
            var modes = overlay.querySelectorAll('#mcam-modes [data-m]');
            modes.forEach(function (el) {
                el.onclick = function () {
                    var m = this.getAttribute('data-m');
                    modes.forEach(function (x) { x.style.color = 'rgba(255,255,255,0.55)'; x.style.fontWeight = '400'; });
                    this.style.color = '#fff'; this.style.fontWeight = '700';
                    if (m === 'camera' || m === 'album') self.close(function () { self.open(m, afterTarget); });
                    else window.showToast && window.showToast('视频模式 · 敬请期待');
                };
            });
            overlay.querySelectorAll('.mcam-t').forEach(function (t) {
                t.onclick = function () {
                    var ck = this.querySelector('.mcam-ck');
                    if (ck) { ck.innerHTML = '<i class="fas fa-check" style="color:#10B981;font-size:12px;"></i>'; ck.style.opacity='1'; ck.style.background='#fff'; ck.style.transform='scale(1)'; }
                    this.style.animation = 'mainCamShake .25s';
                    setTimeout(function () { self.shoot(afterTarget); }, 320);
                };
            });

            if (mode === 'camera') {
                var bgModes = [
                    'radial-gradient(ellipse at 30% 30%, rgba(96,165,250,0.22), transparent 55%),radial-gradient(ellipse at 70% 70%, rgba(16,185,129,0.22), transparent 55%),linear-gradient(135deg,#1f2937,#111827,#0b1220)',
                    'radial-gradient(ellipse at 60% 20%, rgba(236,72,153,0.18), transparent 55%),radial-gradient(ellipse at 40% 80%, rgba(139,92,246,0.22), transparent 55%),linear-gradient(135deg,#111827,#1F2937,#0f172a)',
                    'radial-gradient(ellipse at 50% 40%, rgba(52,211,153,0.22), transparent 55%),radial-gradient(ellipse at 20% 70%, rgba(245,158,11,0.20), transparent 55%),linear-gradient(135deg,#1F2937,#0b1220,#020617)'
                ];
                var step = 0;
                var t1 = setInterval(function () { var b = $('mcam-bg'); if (!b) return; b.style.background = bgModes[++step % bgModes.length]; }, 3000);
                this.timers.push(t1);
                var statuses = ['📖 识别印刷体中…','📐 检测题目边框…','✍️  识别手写体公式…','✅ AI 识别就绪'];
                var sIdx = 0;
                var t2 = setInterval(function () { var s = $('mcam-status'); if (!s) return; sIdx = (sIdx+1)%statuses.length; s.innerHTML='<i class="fas fa-sync-alt fa-spin" style="margin-right:4px;"></i>'+statuses[sIdx]; }, 1900);
                this.timers.push(t2);
            }
        }
    };
    window.__PHOTO_CAMERA__ = cam;
})();

// ========== 拍照搜题页（内容与完整产品原型 photo-ocr 模块一致） ==========
function renderPhotoOcrPage(container) {
    // 最近搜题记录（含题目详情，点击可查看完整解析）
    const records = [
        {
            subject: '数学', q: '已知函数 f(x)=x³-3x+1，求极值', time: '2小时前', bg: '#DBEAFE', icon: 'fa-book-open',
            answer: 'f(x)在 x=1 处取得极大值 -1；在 x=-1 处取得极小值 3',
            analysis: '【L1 定位】三次函数求极值，考查导数应用\n【L2 方法】f\'(x)=3x²-3，令 f\'(x)=0 解得 x=±1\n【L3 步骤】\n① 求导：f\'(x) = 3x² - 3 = 3(x²-1) = 3(x-1)(x+1)\n② 令 f\'(x)=0，得 x₁=1, x₂=-1\n③ 列表判断单调性：\n   x < -1：f\'(x) > 0，f 单调递增\n   -1 < x < 1：f\'(x) < 0，f 单调递减\n   x > 1：f\'(x) > 0，f 单调递增\n④ 极值：x=-1 处极大值 f(-1)=3；x=1 处极小值 f(1)=-1\n【L4 检验】f\'\'(x)=6x，f\'\'(-1)=-6<0 确为极大值点\n【L5 反思】三次函数 ax³+bx²+cx+d 至多两个极值点',
            similar: '① f(x)=x³-3x²+2，求极值\n② f(x)=2x³-9x²+12x-3，求极值与最值'
        },
        {
            subject: '物理', q: '通电导线在磁场中受力方向判断', time: '昨天', bg: '#EDE9FE', icon: 'fa-atom',
            answer: '根据左手定则判断安培力方向：F = BIL × sinθ',
            analysis: '【L1 定位】考查安培力与左手定则\n【L2 方法】左手定则：磁场线穿掌心，四指指电流方向，拇指指安培力方向\n【L3 步骤】\n① 确定磁场 B 的方向\n② 确定电流 I 的方向\n③ 伸开左手，掌心迎向 B，四指指向 I 方向\n④ 拇指垂直于四指的方向即为安培力 F 的方向\n⑤ F = BILsinθ，θ为 B 与 I 的夹角\n【L4 检验】当 θ=90° 时 F 最大；当 θ=0° 时 F=0\n【L5 反思】安培力总是垂直于 B 和 I 所在的平面',
            similar: '① 两根平行通电导线间相互作用力方向判断\n② 螺线管内部小磁针的偏转方向'
        },
        {
            subject: '化学', q: '氧化还原反应电子转移表示法', time: '3天前', bg: '#FEF3C7', icon: 'fa-flask',
            answer: '双线桥法：从反应物指向生成物；单线桥法：从还原剂指向氧化剂',
            analysis: '【L1 定位】氧化还原反应电子转移表示法\n【L2 方法】双线桥法与单线桥法\n【L3 步骤】\n① 标出反应前后化合价变化\n② 双线桥：箭头从反应物某元素指向生成物对应元素\n   - 标注"失去"或"得到"电子数\n   - 电子数 = 化合价变化数 × 原子数\n③ 单线桥：箭头从还原剂(失电子)指向氧化剂(得电子)\n   - 只标注电子总数，不写"得失"\n④ 守恒检验：失电子总数 = 得电子总数\n【L4 检验】例如 2Na + Cl₂ = 2NaCl，Na 失 2e⁻，Cl 得 2e⁻\n【L5 反思】单线桥法在配平复杂反应时更直观',
            similar: '① 用双线桥法表示 Cu + 2H₂SO₄(浓) = CuSO₄ + SO₂↑+ 2H₂O 的电子转移\n② 用单线桥法表示 2Fe + 3Cl₂ = 2FeCl₃ 的电子转移'
        }
    ];
    window.__photoRecords = records;
    const recordsHTML = records.map((r, idx) => `
        <div style="display:flex;align-items:center;gap:12px;padding:14px;background:white;border-radius:12px;margin-bottom:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);cursor:pointer;" onclick="window.showPhotoRecordDetail(${idx})">
            <div style="width:40px;height:40px;border-radius:10px;background:${r.bg};display:flex;align-items:center;justify-content:center;font-size:18px;color:#3B82F6;flex-shrink:0;"><i class="fas ${r.icon}"></i></div>
            <div style="flex:1;min-width:0;">
                <div style="font-size:14px;font-weight:600;color:#374151;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${r.subject} · ${r.q}</div>
                <div style="font-size:12px;color:#9CA3AF;margin-top:2px;">${r.time}</div>
            </div>
            <i class="fas fa-chevron-right" style="color:#D1D5DB;font-size:14px;"></i>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="page-header"><h2><i class="fas fa-camera"></i> 拍照搜题</h2><p>拍下题目，AI秒出解析与相似题推荐</p></div>
        <div class="row">
            <div class="card" style="flex:1;max-width:680px;">
                <div style="text-align:center;padding:20px;background:linear-gradient(135deg,#3B82F6,#1D4ED8);border-radius:12px;color:white;margin-bottom:16px;">
                    <div style="font-size:18px;font-weight:700;margin-bottom:6px;"><i class="fas fa-camera"></i> 拍照搜题</div>
                    <div style="font-size:13px;opacity:0.9;">支持数学、物理、化学、英语等全学科题目识别</div>
                </div>
                <div style="background:linear-gradient(135deg,#1F2937,#111827);border-radius:16px;padding:30px 20px;margin-bottom:16px;text-align:center;position:relative;overflow:hidden;cursor:pointer;" onclick="window.__PHOTO_CAMERAGO__('camera','photo-parse')">
                    <div style="position:absolute;top:12px;left:12px;width:26px;height:26px;border-top:3px solid rgba(255,255,255,0.45);border-left:3px solid rgba(255,255,255,0.45);"></div>
                    <div style="position:absolute;top:12px;right:12px;width:26px;height:26px;border-top:3px solid rgba(255,255,255,0.45);border-right:3px solid rgba(255,255,255,0.45);"></div>
                    <div style="position:absolute;bottom:12px;left:12px;width:26px;height:26px;border-bottom:3px solid rgba(255,255,255,0.45);border-left:3px solid rgba(255,255,255,0.45);"></div>
                    <div style="position:absolute;bottom:12px;right:12px;width:26px;height:26px;border-bottom:3px solid rgba(255,255,255,0.45);border-right:3px solid rgba(255,255,255,0.45);"></div>
                    <div style="width:108px;height:108px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#1D4ED8);margin:18px auto 16px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 6px rgba(255,255,255,0.15),0 0 0 13px rgba(255,255,255,0.08);">
                        <i class="fas fa-camera" style="font-size:42px;color:white;"></i>
                    </div>
                    <div style="color:rgba(255,255,255,0.92);font-size:15px;font-weight:600;">点击拍照（打开相机镜头）</div>
                    <div style="color:rgba(255,255,255,0.55);font-size:12px;margin-top:4px;">支持手写体、印刷体题目识别</div>
                </div>
                <div style="display:flex;gap:12px;margin-bottom:16px;">
                    <div onclick="window.__PHOTO_CAMERAGO__('album','photo-parse')" style="flex:1;background:white;border-radius:12px;padding:14px;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);cursor:pointer;">
                        <i class="fas fa-images" style="color:#3B82F6;font-size:18px;"></i><span style="font-size:14px;font-weight:600;">从相册选择</span>
                    </div>
                    <div onclick="window.__PHOTO_CAMERAGO__('camera','photo-parse')" style="flex:1;background:white;border-radius:12px;padding:14px;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);cursor:pointer;">
                        <i class="fas fa-bolt" style="color:#F59E0B;font-size:18px;"></i><span style="font-size:14px;font-weight:600;">闪光灯</span>
                    </div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                    <div class="card-title" style="margin:0;">最近搜题记录</div>
                    <span style="font-size:13px;color:#3B82F6;cursor:pointer;" onclick="window.__PHOTO_CAMERAGO__('camera','photo-parse')">再搜一题 ›</span>
                </div>
                ${recordsHTML}
            </div>
        </div>
    `;
}

// 显示搜题记录的题目详情（含答案、五层架构解析、相似题推荐）
window.showPhotoRecordDetail = function(idx) {
    const records = window.__photoRecords || [];
    const r = records[idx];
    if (!r) { showToast('记录不存在', 'warning'); return; }

    const subjectColor = r.subject === '数学' ? '#3B82F6' : r.subject === '物理' ? '#8B5CF6' : r.subject === '化学' ? '#F59E0B' : '#6B7280';

    const html = `
        <div style="padding:0;font-size:13px;line-height:1.7;">
            <!-- 题目 -->
            <div style="background:linear-gradient(135deg,${subjectColor}11,${subjectColor}05);border-left:4px solid ${subjectColor};padding:14px;border-radius:8px;margin-bottom:14px;">
                <div style="font-size:11px;color:${subjectColor};font-weight:700;margin-bottom:8px;"><i class="fas ${r.icon}"></i> ${r.subject} · 搜题记录</div>
                <div style="font-size:15px;font-weight:600;color:#111827;margin-bottom:6px;">${r.q}</div>
                <div style="font-size:11px;color:#9CA3AF;">${r.time}</div>
            </div>

            <!-- 答案 -->
            <div style="background:#ECFDF5;border:1px solid #A7F3D0;border-radius:10px;padding:12px;margin-bottom:14px;">
                <div style="font-size:12px;color:#047857;font-weight:700;margin-bottom:6px;"><i class="fas fa-check-circle"></i> 参考答案</div>
                <div style="font-size:13px;color:#065F46;line-height:1.8;">${r.answer}</div>
            </div>

            <!-- AI 解析（五层架构） -->
            <div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:12px;margin-bottom:14px;">
                <div style="font-size:12px;color:#92400E;font-weight:700;margin-bottom:8px;"><i class="fas fa-lightbulb"></i> AI 五层架构解析</div>
                <div style="font-size:13px;color:#78350F;line-height:1.9;white-space:pre-wrap;">${r.analysis}</div>
            </div>

            <!-- 相似题推荐 -->
            <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:12px;margin-bottom:14px;">
                <div style="font-size:12px;color:#1E40AF;font-weight:700;margin-bottom:8px;"><i class="fas fa-clone"></i> 相似题推荐</div>
                <div style="font-size:13px;color:#1E3A8A;line-height:1.9;white-space:pre-wrap;">${r.similar}</div>
            </div>

            <!-- 操作按钮 -->
            <div style="display:flex;gap:10px;">
                <button onclick="document.getElementById('modal-overlay').classList.remove('show');window.__PHOTO_CAMERAGO__('camera','photo-parse')" style="flex:1;padding:11px;border:1px solid ${subjectColor};background:white;color:${subjectColor};border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;"><i class="fas fa-redo"></i> 再搜一题</button>
                <button onclick="document.getElementById('modal-overlay').classList.remove('show');showToast('已加入错题本','success')" style="flex:1;padding:11px;border:none;background:${subjectColor};color:white;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;"><i class="fas fa-bookmark"></i> 加入错题本</button>
            </div>
        </div>
    `;

    openModal(r.subject + ' · 搜题解析', html);
};
