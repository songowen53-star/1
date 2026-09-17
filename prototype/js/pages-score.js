// ============================================================
// 成绩分析模块 - 5个页面（动态加载：数据来自 /api/page-data/:key）
// ============================================================

// 通用迷你图表绘制函数（Canvas）：支持 bar / line / radar
window.drawScoreChart = function(containerId, type, labels, values, colors) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    var canvas = document.createElement('canvas');
    canvas.width = container.offsetWidth || 300;
    canvas.height = container.offsetHeight || 140;
    container.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    var padding = {top:15, right:15, bottom:25, left:35};
    var chartW = W - padding.left - padding.right;
    var chartH = H - padding.top - padding.bottom;
    var maxV = Math.max.apply(null, values) * 1.1;
    var minV = Math.min.apply(null, values) * 0.9;
    var range = maxV - minV || 1;

    if (type === 'bar') {
        var barW = chartW / values.length * 0.6;
        values.forEach(function(v, i) {
            var x = padding.left + (chartW / values.length) * i + (chartW / values.length - barW) / 2;
            var barH = ((v - minV) / range) * chartH;
            var y = padding.top + chartH - barH;
            ctx.fillStyle = colors[i % colors.length];
            ctx.fillRect(x, y, barW, barH);
            // 标签
            ctx.fillStyle = '#9CA3AF';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(labels[i], x + barW/2, H - 8);
            // 数值
            ctx.fillStyle = '#374151';
            ctx.font = '10px sans-serif';
            ctx.fillText(v, x + barW/2, y - 4);
        });
    } else if (type === 'line') {
        ctx.strokeStyle = colors[0];
        ctx.lineWidth = 2;
        ctx.beginPath();
        values.forEach(function(v, i) {
            var x = padding.left + (chartW / (values.length - 1)) * i;
            var y = padding.top + chartH - ((v - minV) / range) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
        // 数据点
        values.forEach(function(v, i) {
            var x = padding.left + (chartW / (values.length - 1)) * i;
            var y = padding.top + chartH - ((v - minV) / range) * chartH;
            ctx.fillStyle = colors[0];
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#9CA3AF';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(labels[i], x, H - 8);
        });
    } else if (type === 'radar') {
        var cx = W / 2, cy = H / 2;
        var radius = Math.min(chartW, chartH) / 2 - 20;
        var n = values.length;
        // 网格
        for (var r = 1; r <= 4; r++) {
            ctx.strokeStyle = '#E5E7EB';
            ctx.beginPath();
            for (var i = 0; i < n; i++) {
                var angle = (Math.PI * 2 / n) * i - Math.PI / 2;
                var x = cx + Math.cos(angle) * radius * r / 4;
                var y = cy + Math.sin(angle) * radius * r / 4;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.stroke();
        }
        // 数据
        ctx.fillStyle = 'rgba(59,130,246,0.2)';
        ctx.strokeStyle = '#3B82F6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        values.forEach(function(v, i) {
            var angle = (Math.PI * 2 / n) * i - Math.PI / 2;
            var x = cx + Math.cos(angle) * radius * (v / 100);
            var y = cy + Math.sin(angle) * radius * (v / 100);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // 标签
        ctx.fillStyle = '#6B7280';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        values.forEach(function(v, i) {
            var angle = (Math.PI * 2 / n) * i - Math.PI / 2;
            var x = cx + Math.cos(angle) * (radius + 12);
            var y = cy + Math.sin(angle) * (radius + 12) + 4;
            ctx.fillText(labels[i], x, y);
        });
    }
    // Y轴刻度
    ctx.fillStyle = '#D1D5DB';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'right';
    for (var i = 0; i <= 4; i++) {
        var val = Math.round(minV + range * (4 - i) / 4);
        var y = padding.top + (chartH / 4) * i;
        ctx.fillText(val, padding.left - 5, y + 3);
    }
};

// 设置 innerHTML 并执行其中的内联 <script>（innerHTML 插入的 script 默认不执行）
function setHTMLWithScripts(container, html) {
    container.innerHTML = html;
    var nodes = container.getElementsByTagName('script');
    var arr = [];
    for (var i = 0; i < nodes.length; i++) arr.push(nodes[i]);
    for (var j = 0; j < arr.length; j++) {
        var old = arr[j];
        var ns = document.createElement('script');
        ns.textContent = old.textContent;
        old.parentNode.replaceChild(ns, old);
    }
}

// 1. 月考分析
registerPage('score-monthly', '月考分析', '成绩分析', 'fa-chart-line', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('score-monthly-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('score-monthly').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-inbox" style="font-size:32px;margin-bottom:12px;"></i><div style="font-size:13px;margin-bottom:16px;">暂无数据</div><button class="proto-btn proto-btn-outline" style="font-size:12px;" onclick="navigateTo(\'home\')">返回首页</button></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var html = '';

        // 最近月考成绩卡片
        html += GradientCard('blue', `
            <div style="text-align:center;">
                <div style="font-size:12px;opacity:0.9;">最近月考总分</div>
                <div style="font-size:42px;font-weight:700;margin:4px 0;">${data.total_score}<span style="font-size:18px;opacity:0.7;">/${data.total_max}</span></div>
                <div style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600;">
                    <i class="fas fa-arrow-up"></i> 较上次 ${data.change}分
                </div>
            </div>
        `);

        // 各科成绩列表
        html += `<div class="section-title">各科成绩</div>`;
        (data.subjects || []).forEach(function (s) {
            var percent = Math.round(s.score / s.total * 100);
            var isUp = s.change.startsWith('+');
            html += `
            <div class="proto-card" style="padding:12px 16px;cursor:pointer;" onclick="openModal('科目分析', '<div style=&quot;padding:14px;font-size:13px;color:#374151;line-height:1.8;&quot;><b>科目：</b>${s.name}<br><b>得分：</b>${s.score}/${s.total}<br><b>得分率：</b>${percent}%<br><b>变化：</b>${s.change}分</div>')">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                    <div style="width:36px;height:36px;border-radius:10px;background:${s.color}22;display:flex;align-items:center;justify-content:center;"><i class="fas ${s.icon}" style="color:${s.color};font-size:16px;"></i></div>
                    <div style="flex:1;">
                        <div style="font-size:14px;font-weight:600;">${s.name}</div>
                    </div>
                    <div style="text-align:right;">
                        <span style="font-size:18px;font-weight:700;">${s.score}</span>
                        <span style="font-size:12px;color:var(--text-tertiary);">/${s.total}</span>
                        <span style="font-size:11px;color:${isUp ? 'var(--success)' : 'var(--danger)'};margin-left:6px;">${isUp ? '↑' : '↓'}${s.change.replace(/[+-]/, '')}</span>
                    </div>
                </div>
                ${Progress(percent, s.color)}
            </div>`;
        });

        // 各科成绩趋势图
        html += `<div class="section-title">成绩趋势</div>`;
        var tLabels = (data.trend_data && data.trend_data.labels) || ['9月','10月','11月','12月','1月'];
        var tValues = (data.trend_data && data.trend_data.values) || [580, 595, 588, 610, 605];
        html += '<div id="score-monthly-trend-chart" style="height:140px;"></div><script>setTimeout(function(){drawScoreChart(\'score-monthly-trend-chart\',\'line\',' + JSON.stringify(tLabels) + ',' + JSON.stringify(tValues) + ',' + JSON.stringify(['#3B82F6']) + ');},100)</script>';

        // AI分析
        html += `<div class="section-title">AI智能分析</div>`;
        var ai = data.ai_analysis || {};
        html += `
        <div class="gradient-card gradient-purple">
            <div style="display:flex;align-items:flex-start;gap:10px;">
                <i class="fas fa-robot" style="font-size:20px;margin-top:2px;"></i>
                <div style="font-size:13px;line-height:1.7;">
                    <div style="font-weight:700;margin-bottom:6px;">${ai.title || ''}</div>
                    ${ai.content || ''}
                </div>
            </div>
        </div>`;

        // 智能学习入口：跳转学情分析 + 针对性刷题
        html += `
        <div class="section-title">智能学习入口</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
            <div class="proto-card" style="padding:14px;cursor:pointer;text-align:center;" onclick="navigateTo('home-analysis')">
                <div style="width:40px;height:40px;border-radius:10px;background:#DBEAFE;color:#3B82F6;display:flex;align-items:center;justify-content:center;font-size:18px;margin:0 auto 8px;"><i class="fas fa-chart-radar"></i></div>
                <div style="font-size:13px;font-weight:600;">查看学情分析</div>
                <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">薄弱知识点诊断</div>
            </div>
            <div class="proto-card" style="padding:14px;cursor:pointer;text-align:center;" onclick="navigateTo('practice-ai-recommend')">
                <div style="width:40px;height:40px;border-radius:10px;background:#D1FAE5;color:#10B981;display:flex;align-items:center;justify-content:center;font-size:18px;margin:0 auto 8px;"><i class="fas fa-bullseye"></i></div>
                <div style="font-size:13px;font-weight:600;">针对性刷题</div>
                <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">AI推荐薄弱知识点题</div>
            </div>
            <div class="proto-card" style="padding:14px;cursor:pointer;text-align:center;" onclick="navigateTo('practice-mistakes')">
                <div style="width:40px;height:40px;border-radius:10px;background:#FEE2E2;color:#EF4444;display:flex;align-items:center;justify-content:center;font-size:18px;margin:0 auto 8px;"><i class="fas fa-times-circle"></i></div>
                <div style="font-size:13px;font-weight:600;">错题本</div>
                <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">复习本次失分题目</div>
            </div>
            <div class="proto-card" style="padding:14px;cursor:pointer;text-align:center;" onclick="navigateTo('home-task')">
                <div style="width:40px;height:40px;border-radius:10px;background:#FEF3C7;color:#F59E0B;display:flex;align-items:center;justify-content:center;font-size:18px;margin:0 auto 8px;"><i class="fas fa-calendar-check"></i></div>
                <div style="font-size:13px;font-weight:600;">学习计划</div>
                <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">AI自动生成提分计划</div>
            </div>
        </div>`;

        setHTMLWithScripts(container, html);
    }

    return Page({
        title: '月考分析',
        tabbar: 'learn',
        content: '<div id="score-monthly-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// 2. 模考分析
registerPage('score-mock', '模考分析', '成绩分析', 'fa-file-alt', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('score-mock-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('score-mock').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-inbox" style="font-size:32px;margin-bottom:12px;"></i><div style="font-size:13px;margin-bottom:16px;">暂无数据</div><button class="proto-btn proto-btn-outline" style="font-size:12px;" onclick="navigateTo(\'home\')">返回首页</button></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var html = '';

        // 模考名称与总分
        html += GradientCard('orange', `
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <div style="font-size:13px;opacity:0.9;">${data.exam_name}</div>
                    <div style="font-size:36px;font-weight:700;margin-top:4px;">${data.total_score}<span style="font-size:16px;opacity:0.7;">/${data.total_max}</span></div>
                    <div style="font-size:12px;opacity:0.9;margin-top:2px;">较上次模考 ${data.change}分</div>
                </div>
                <div style="text-align:center;background:rgba(255,255,255,0.2);padding:12px 16px;border-radius:12px;">
                    <div style="font-size:11px;opacity:0.9;">年级排名</div>
                    <div style="font-size:28px;font-weight:700;">${data.grade_rank}<span style="font-size:12px;opacity:0.7;">/${data.grade_total}</span></div>
                    <div style="font-size:11px;opacity:0.9;">↑ 前进${data.rank_change}名</div>
                </div>
            </div>
        `);

        // 各科得分率雷达图
        html += `<div class="section-title">各科得分率</div>`;
        var rLabels, rValues;
        if (data.subjects && data.subjects.length) {
            rLabels = data.subjects.map(function (s) { return s.name; });
            rValues = data.subjects.map(function (s) { return Math.round(s.score / s.total * 100); });
        } else {
            rLabels = ['语文', '数学', '英语', '物理', '化学'];
            rValues = [85, 78, 92, 70, 80];
        }
        html += '<div id="score-mock-radar-chart" style="height:180px;"></div><script>setTimeout(function(){drawScoreChart(\'score-mock-radar-chart\',\'radar\',' + JSON.stringify(rLabels) + ',' + JSON.stringify(rValues) + ',' + JSON.stringify(['#3B82F6']) + ');},100)</script>';

        // 与上次模考对比
        html += `<div class="section-title">模考对比</div>`;
        var cLabels, cValues;
        if (data.subjects && data.subjects.length) {
            cLabels = data.subjects.map(function (s) { return s.name; });
            cValues = data.subjects.map(function (s) { return s.score; });
        } else {
            cLabels = ['语文', '数学', '英语', '物理', '化学'];
            cValues = [110, 118, 125, 78, 82];
        }
        html += '<div id="score-mock-compare-chart" style="height:140px;"></div><script>setTimeout(function(){drawScoreChart(\'score-mock-compare-chart\',\'bar\',' + JSON.stringify(cLabels) + ',' + JSON.stringify(cValues) + ',' + JSON.stringify(['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']) + ');},100)</script>';

        // AI提分建议
        html += `<div class="section-title">AI提分建议</div>`;
        (data.suggestions || []).forEach(function (s) {
            html += `
            <div class="proto-list-item" style="border-radius:12px;margin-bottom:8px;cursor:pointer;" onclick="openModal('提分建议', '<div style=&quot;padding:14px;font-size:13px;color:#374151;line-height:1.8;&quot;><b>建议：</b>${s.title}<br><b>详情：</b>${s.desc}</div>')">
                <div class="icon" style="background:${s.bg}"><i class="fas ${s.icon}"></i></div>
                <div class="text">
                    <div class="title">${s.title}</div>
                    <div class="desc">${s.desc}</div>
                </div>
                <i class="fas fa-lightbulb" style="color:var(--warning);"></i>
            </div>`;
        });

        // 按钮
        html += `<button class="proto-btn proto-btn-primary" style="margin-top:12px;" onclick="openModal('试卷分析', '<div style=&quot;padding:14px;font-size:13px;color:#374151;line-height:1.8;&quot;>展示本次模考各题得分、错题分布、知识点掌握情况及针对性练习建议。</div>')"><i class="fas fa-file-invoice"></i> 查看详细试卷分析</button>`;

        // 智能学习入口：跳转学情分析 + 针对性刷题
        html += `
        <div class="section-title">智能学习入口</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
            <div class="proto-card" style="padding:14px;cursor:pointer;text-align:center;" onclick="navigateTo('home-analysis')">
                <div style="width:40px;height:40px;border-radius:10px;background:#DBEAFE;color:#3B82F6;display:flex;align-items:center;justify-content:center;font-size:18px;margin:0 auto 8px;"><i class="fas fa-chart-radar"></i></div>
                <div style="font-size:13px;font-weight:600;">查看学情分析</div>
                <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">模考失分归因诊断</div>
            </div>
            <div class="proto-card" style="padding:14px;cursor:pointer;text-align:center;" onclick="navigateTo('practice-ai-recommend')">
                <div style="width:40px;height:40px;border-radius:10px;background:#D1FAE5;color:#10B981;display:flex;align-items:center;justify-content:center;font-size:18px;margin:0 auto 8px;"><i class="fas fa-bullseye"></i></div>
                <div style="font-size:13px;font-weight:600;">针对性刷题</div>
                <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">AI推荐薄弱知识点题</div>
            </div>
            <div class="proto-card" style="padding:14px;cursor:pointer;text-align:center;" onclick="navigateTo('practice-mistakes')">
                <div style="width:40px;height:40px;border-radius:10px;background:#FEE2E2;color:#EF4444;display:flex;align-items:center;justify-content:center;font-size:18px;margin:0 auto 8px;"><i class="fas fa-times-circle"></i></div>
                <div style="font-size:13px;font-weight:600;">错题本</div>
                <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">复习模考失分题目</div>
            </div>
            <div class="proto-card" style="padding:14px;cursor:pointer;text-align:center;" onclick="navigateTo('ai-module-predict')">
                <div style="width:40px;height:40px;border-radius:10px;background:#EDE9FE;color:#8B5CF6;display:flex;align-items:center;justify-content:center;font-size:18px;margin:0 auto 8px;"><i class="fas fa-chart-line"></i></div>
                <div style="font-size:13px;font-weight:600;">AI预测高考</div>
                <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">模考成绩趋势预测</div>
            </div>
        </div>`;

        setHTMLWithScripts(container, html);
    }

    return Page({
        title: '模考分析',
        back: true,
        content: '<div id="score-mock-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// 3. 校内排名分析
registerPage('score-school-rank', '校排名', '成绩分析', 'fa-trophy', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('score-school-rank-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('score-school-rank').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-inbox" style="font-size:32px;margin-bottom:12px;"></i><div style="font-size:13px;margin-bottom:16px;">暂无数据</div><button class="proto-btn proto-btn-outline" style="font-size:12px;" onclick="navigateTo(\'home\')">返回首页</button></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var html = '';

        // 当前排名卡片
        html += GradientCard('purple', `
            <div style="text-align:center;">
                <div style="font-size:12px;opacity:0.9;">当前年级排名</div>
                <div style="font-size:48px;font-weight:700;margin:4px 0;">第${data.current_rank}名</div>
                <div style="font-size:13px;opacity:0.9;">共${data.total_students}人 · 超越${data.beat_percent}%同学</div>
                <div style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;margin-top:8px;">
                    <i class="fas fa-arrow-up"></i> 较上次前进${data.rank_change}名
                </div>
            </div>
        `);

        // 排名变化趋势图
        html += `<div class="section-title">排名趋势</div>`;
        var rtLabels = (data.rank_trend && data.rank_trend.labels) || ['9月', '10月', '11月', '12月', '1月'];
        var rtValues = (data.rank_trend && data.rank_trend.values) || [120, 95, 88, 72, 68];
        html += '<div id="score-school-rank-trend-chart" style="height:140px;"></div><script>setTimeout(function(){drawScoreChart(\'score-school-rank-trend-chart\',\'line\',' + JSON.stringify(rtLabels) + ',' + JSON.stringify(rtValues) + ',' + JSON.stringify(['#8B5CF6']) + ');},100)</script>';

        // 各科年级排名对比
        html += `<div class="section-title">各科年级排名</div>`;
        html += `<div class="proto-card" style="padding:0;overflow:hidden;">`;
        (data.rank_subjects || []).forEach(function (s) {
            var topPercent = Math.round(s.rank / data.total_students * 100);
            html += `
            <div style="display:flex;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border);cursor:pointer;" onclick="openModal('科目排名', '<div style=&quot;padding:14px;font-size:13px;color:#374151;line-height:1.8;&quot;><b>科目：</b>${s.name}<br><b>年级排名：</b>第${s.rank}名<br><b>总人数：</b>${data.total_students}人<br><b>超越：</b>${100 - topPercent}%同学</div>')">
                <div style="width:50px;font-size:14px;font-weight:600;">${s.name}</div>
                <div style="flex:1;margin:0 12px;">
                    ${Progress(100 - topPercent, s.color)}
                </div>
                <div style="font-size:13px;font-weight:700;color:${s.color};">第${s.rank}名</div>
            </div>`;
        });
        html += `</div>`;

        // 与目标大学录取线差距
        var tc = data.target_college || {};
        html += `<div class="section-title">目标大学差距</div>`;
        html += `
        <div class="proto-card" style="cursor:pointer;" onclick="openModal('目标大学', '<div style=&quot;padding:14px;font-size:13px;color:#374151;line-height:1.8;&quot;><b>院校：</b>${tc.name}<br><b>录取年份：</b>${tc.score_year}<br><b>录取线：</b>${tc.score_line}分<br><b>当前差距：</b>${tc.gap}分<br>继续努力，缩小差距！</div>')">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                <div>
                    <div style="font-size:14px;font-weight:700;">${tc.name}</div>
                    <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${tc.score_year}年录取线 ${tc.score_line}分</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:20px;font-weight:700;color:var(--danger);">${tc.gap}分</div>
                    <div style="font-size:11px;color:var(--text-tertiary);">尚有差距</div>
                </div>
            </div>
            ${Progress(tc.progress, 'var(--danger)')}
        </div>`;

        // 同分段竞争分析
        var comp = data.competition || {};
        html += `<div class="section-title">同分段竞争</div>`;
        var compTags = (comp.tags || []).map(function (t) { return Tag(t.text, t.color); }).join('');
        var compLabels = (comp.tags || []).map(function (t) { return '· <span style=&quot;font-weight:600;&quot;>' + t.text + '</span>：同段考生常见特征，需据此设计志愿梯度。'; }).join('<br>') || '<span style=&quot;color:#6B7280;&quot;>暂无标签数据</span>';
        var compDetail = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b>同分段范围：</b>' + comp.range + '分<br><b>总竞争人数：</b><span style=&quot;color:#3B82F6;font-weight:700;&quot;>' + comp.total + ' 人</span><br><br><b>竞争标签解读：</b><br>' + compLabels + '<br><br><span style=&quot;color:#6B7280;&quot;>※ 建议：把院校志愿拉开 20~40 分梯度，避免滑档风险。</span></div>';
        html += `
        <div class="proto-card" style="cursor:pointer;" onclick="openModal('同分段竞争分析', '${compDetail}')">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                <div style="font-size:13px;color:var(--text-secondary);">${comp.range}分段共 <span style="font-weight:700;color:var(--primary);">${comp.total}人</span></div>
                <i class="fas fa-chevron-right" style="font-size:11px;color:#9CA3AF;"></i>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                ${compTags}
            </div>
        </div>`;

        // 提升排名建议
        var adv = data.advice || {};
        html += `
        <div class="gradient-card gradient-green">
            <div style="display:flex;align-items:flex-start;gap:10px;">
                <i class="fas fa-lightbulb" style="font-size:20px;margin-top:2px;"></i>
                <div style="font-size:13px;line-height:1.7;">
                    <div style="font-weight:700;margin-bottom:4px;">${adv.title || ''}</div>
                    ${adv.content || ''}
                </div>
            </div>
        </div>`;

        // 智能学习入口：跳转学情分析 + 针对性刷题
        html += `
        <div class="section-title">智能学习入口</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;">
            <div class="proto-card" style="padding:14px;cursor:pointer;text-align:center;" onclick="navigateTo('home-analysis')">
                <div style="width:40px;height:40px;border-radius:10px;background:#DBEAFE;color:#3B82F6;display:flex;align-items:center;justify-content:center;font-size:18px;margin:0 auto 8px;"><i class="fas fa-chart-radar"></i></div>
                <div style="font-size:13px;font-weight:600;">查看学情分析</div>
                <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">各科排名薄弱诊断</div>
            </div>
            <div class="proto-card" style="padding:14px;cursor:pointer;text-align:center;" onclick="navigateTo('practice-ai-recommend')">
                <div style="width:40px;height:40px;border-radius:10px;background:#D1FAE5;color:#10B981;display:flex;align-items:center;justify-content:center;font-size:18px;margin:0 auto 8px;"><i class="fas fa-bullseye"></i></div>
                <div style="font-size:13px;font-weight:600;">针对性刷题</div>
                <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">提升排名的关键练习</div>
            </div>
            <div class="proto-card" style="padding:14px;cursor:pointer;text-align:center;" onclick="navigateTo('ai-module-predict')">
                <div style="width:40px;height:40px;border-radius:10px;background:#EDE9FE;color:#8B5CF6;display:flex;align-items:center;justify-content:center;font-size:18px;margin:0 auto 8px;"><i class="fas fa-chart-line"></i></div>
                <div style="font-size:13px;font-weight:600;">AI预测高考</div>
                <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">预测高考排名区间</div>
            </div>
            <div class="proto-card" style="padding:14px;cursor:pointer;text-align:center;" onclick="navigateTo('volunteer')">
                <div style="width:40px;height:40px;border-radius:10px;background:#FEE2E2;color:#EF4444;display:flex;align-items:center;justify-content:center;font-size:18px;margin:0 auto 8px;"><i class="fas fa-graduation-cap"></i></div>
                <div style="font-size:13px;font-weight:600;">志愿填报</div>
                <div style="font-size:11px;color:#9CA3AF;margin-top:4px;">目标院校差距分析</div>
            </div>
        </div>`;

        setHTMLWithScripts(container, html);
    }

    return Page({
        title: '校排名',
        back: true,
        content: '<div id="score-school-rank-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// 4. 全省排名预测
registerPage('score-province-rank', '全省排名预测', '成绩分析', 'fa-globe-asia', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('score-province-rank-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('score-province-rank').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-inbox" style="font-size:32px;margin-bottom:12px;"></i><div style="font-size:13px;margin-bottom:16px;">暂无数据</div><button class="proto-btn proto-btn-outline" style="font-size:12px;" onclick="navigateTo(\'home\')">返回首页</button></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var html = '';

        // 预测全省排名
        html += GradientCard('cyan', `
            <div style="text-align:center;">
                <div style="font-size:12px;opacity:0.9;">AI预测全省排名</div>
                <div style="font-size:42px;font-weight:700;margin:4px 0;">第${data.predicted_rank}名</div>
                <div style="font-size:13px;opacity:0.9;">${data.province} · ${data.category}</div>
                <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:12px;font-size:12px;font-weight:600;margin-top:8px;">
                    <i class="fas fa-check-circle"></i> 置信度 ${data.confidence}%
                </div>
            </div>
        `);

        // 预测依据
        html += `<div class="section-title">预测依据</div>`;
        var basisItems = (data.basis || []).map(function (b) {
            return `<div style="display:flex;gap:8px;margin-bottom:6px;"><i class="fas fa-check" style="color:var(--success);margin-top:4px;"></i><span>${b}</span></div>`;
        }).join('');
        var basisDetail = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b style=&quot;font-size:14px;&quot;>预测模型说明</b><br><br>' +
            '本预测基于 AI 多维学情模型，综合以下 5 大类数据维度加权计算：<br><br>' +
            (data.basis || []).map(function (b, i) { return '<b>维度' + (i + 1) + '：</b>' + b + '<br>'; }).join('') +
            '<br><b>模型版本：</b>v3.2 · 近 10 万高三学生样本训练<br>' +
            '<b>更新频率：</b>每次月考后重新训练<br>' +
            '<span style=&quot;color:#6B7280;&quot;>※ 预测结果仅供参考，实际以当年官方公布为准。</span></div>';
        html += `
        <div class="proto-card" style="cursor:pointer;" onclick="openModal('预测依据说明', '${basisDetail}')">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <div style="font-size:12px;color:var(--text-secondary);">基于 ${(data.basis || []).length} 大维度数据综合计算</div>
                <i class="fas fa-chevron-right" style="font-size:11px;color:#9CA3AF;"></i>
            </div>
            <div style="font-size:13px;line-height:1.8;color:var(--text-secondary);">
                ${basisItems}
            </div>
        </div>`;

        // 全省分数段分布图
        html += `<div class="section-title">分数段分布</div>`;
        var dLabels = (data.distribution && data.distribution.labels) || ['<400', '400-450', '450-500', '500-550', '550-600', '600-650', '>650'];
        var dValues = (data.distribution && data.distribution.values) || [320, 580, 920, 1450, 1180, 760, 310];
        html += '<div id="score-province-rank-distribution-chart" style="height:150px;"></div><script>setTimeout(function(){drawScoreChart(\'score-province-rank-distribution-chart\',\'bar\',' + JSON.stringify(dLabels) + ',' + JSON.stringify(dValues) + ',' + JSON.stringify(['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']) + ');},100)</script>';

        // 预测可录取院校层次
        html += `<div class="section-title">可录取院校层次</div>`;
        (data.tiers || []).forEach(function (t) {
            html += `
            <div class="proto-card" style="padding:12px 16px;cursor:pointer;" onclick="openModal('录取概率', '<div style=&quot;padding:14px;font-size:13px;color:#374151;line-height:1.8;&quot;><b>院校层次：</b>${t.name}<br><b>录取概率：</b>${t.percent}%<br><b>说明：</b>${t.desc}</div>')">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <div style="font-size:14px;font-weight:600;">${t.name}</div>
                    <div style="font-size:16px;font-weight:700;color:${t.color};">${t.percent}%</div>
                </div>
                ${Progress(t.percent, t.color)}
                <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;">${t.desc}</div>
            </div>`;
        });

        // 历年同排名录取情况
        html += `<div class="section-title">历年同位次录取</div>`;
        var historyRows = (data.history || []).map(function (h, idx) {
            var border = idx < (data.history.length - 1) ? 'border-bottom:1px solid var(--border);' : '';
            var historyDetail = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b>年份：</b>' + h.year + '<br><b>等效位次：</b><span style=&quot;color:#3B82F6;font-weight:700;&quot;>第 ' + h.rank + ' 名</span><br><b>录取院校：</b>' + h.college + '<br><br><span style=&quot;color:#6B7280;&quot;>参考：你当前预测位次与之相近，可把该校纳入志愿「冲/稳/保」评估。</span></div>';
            return `<div style="display:flex;padding:12px 16px;${border}font-size:13px;cursor:pointer;align-items:center;" onclick="openModal('${h.year}年录取详情', '${historyDetail}')">
                <div style="flex:1;font-weight:600;">${h.year}</div><div style="flex:1;color:var(--primary);font-weight:600;">${h.rank}</div><div style="flex:1;color:var(--primary);">${h.college}</div><i class="fas fa-chevron-right" style="font-size:10px;color:#9CA3AF;"></i>
            </div>`;
        }).join('');
        html += `
        <div class="proto-card" style="padding:0;overflow:hidden;">
            <div style="display:flex;padding:10px 16px;background:#F9FAFB;font-size:12px;font-weight:700;color:var(--text-secondary);">
                <div style="flex:1;">年份</div><div style="flex:1;">等效位次</div><div style="flex:1;">录取院校</div>
            </div>
            ${historyRows}
        </div>`;

        // 按钮
        html += `<button class="proto-btn proto-btn-primary" style="margin-top:12px;" onclick="navigateTo('college-recommend')"><i class="fas fa-university"></i> 查看匹配院校</button>`;

        setHTMLWithScripts(container, html);
    }

    return Page({
        title: '全省排名预测',
        back: true,
        content: '<div id="score-province-rank-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// 5. 提分空间分析
registerPage('score-improvement', '提分空间', '成绩分析', 'fa-rocket', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('score-improvement-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('score-improvement').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-inbox" style="font-size:32px;margin-bottom:12px;"></i><div style="font-size:13px;margin-bottom:16px;">暂无数据</div><button class="proto-btn proto-btn-outline" style="font-size:12px;" onclick="navigateTo(\'home\')">返回首页</button></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var html = '';

        // 总提分空间
        html += GradientCard('green', `
            <div style="text-align:center;">
                <div style="font-size:12px;opacity:0.9;">总提分空间</div>
                <div style="font-size:42px;font-weight:700;margin:4px 0;">+${data.total_gain}分</div>
                <div style="font-size:13px;opacity:0.9;">从 ${data.from_score} → ${data.to_score} 分</div>
            </div>
        `);

        // 各科提分空间柱状图
        html += `<div class="section-title">各科提分空间</div>`;
        var iLabels, iValues;
        if (data.improvements && data.improvements.length) {
            iLabels = data.improvements.map(function (s) { return s.subject; });
            iValues = data.improvements.map(function (s) { return s.gain; });
        } else {
            iLabels = ['语文', '数学', '英语', '物理', '化学'];
            iValues = [15, 25, 18, 22, 12];
        }
        html += '<div id="score-improvement-bar-chart" style="height:150px;"></div><script>setTimeout(function(){drawScoreChart(\'score-improvement-bar-chart\',\'bar\',' + JSON.stringify(iLabels) + ',' + JSON.stringify(iValues) + ',' + JSON.stringify(['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']) + ');},100)</script>';

        // 各科详细分解
        html += `<div class="section-title">提分路径分解</div>`;
        (data.improvements || []).forEach(function (s) {
            html += `
            <div class="proto-card" style="padding:12px 16px;cursor:pointer;" onclick="openModal('提分路径', '<div style=&quot;padding:14px;font-size:13px;color:#374151;line-height:1.8;&quot;><b>科目：</b>${s.subject}<br><b>可提分：</b>+${s.gain}分<br><b>提分重点：</b>${s.points}</div>')">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
                    <div style="width:36px;height:36px;border-radius:10px;background:${s.color}22;display:flex;align-items:center;justify-content:center;"><i class="fas ${s.icon}" style="color:${s.color};font-size:16px;"></i></div>
                    <div style="flex:1;">
                        <div style="font-size:14px;font-weight:600;">${s.subject}</div>
                        <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">重点：${s.points}</div>
                    </div>
                    <div style="font-size:18px;font-weight:700;color:var(--success);">+${s.gain}分</div>
                </div>
                ${Progress(s.gain * 4, s.color)}
            </div>`;
        });

        // AI优先级建议
        var adv = data.ai_advice || {};
        html += `
        <div class="gradient-card gradient-orange">
            <div style="display:flex;align-items:flex-start;gap:10px;">
                <i class="fas fa-rocket" style="font-size:20px;margin-top:2px;"></i>
                <div style="font-size:13px;line-height:1.7;">
                    <div style="font-weight:700;margin-bottom:4px;">${adv.title || ''}</div>
                    ${adv.content || ''}
                </div>
            </div>
        </div>`;

        setHTMLWithScripts(container, html);
    }

    return Page({
        title: '提分空间',
        back: true,
        content: '<div id="score-improvement-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});
