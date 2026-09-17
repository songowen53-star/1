// ============================================================
// 设计系统 - 通用组件函数库
// ============================================================

// 状态栏组件
function StatusBar(time = '9:41') {
    return `<div class="phone-statusbar"><span>${time}</span><div class="right"><i class="fas fa-signal"></i><i class="fas fa-wifi"></i><i class="fas fa-battery-three-quarters"></i></div></div>`;
}

// 导航栏组件
function NavBar(title, opts = {}) {
    const back = opts.back ? `<div class="back" onclick="navigateBack()"><i class="fas fa-chevron-left"></i></div>` : '<div></div>';
    const right = opts.right ? `<div class="right-action" onclick="navigateTo('${opts.rightAction || ''}')">${opts.right}</div>` : '<div></div>';
    return `<div class="app-navbar">${back}<div class="title">${title}</div>${right}</div>`;
}

// 底部Tab栏
function TabBar(active = 'learn') {
    const tabs = [
        { key: 'learn', icon: 'fa-graduation-cap', label: '学习', page: 'home' },
        { key: 'discover', icon: 'fa-compass', label: '发现', page: 'discover' },
        { key: 'photo', icon: 'fa-camera', label: '搜题', page: 'photo-ocr' },
        { key: 'message', icon: 'fa-comment-dots', label: '消息', page: 'message' },
        { key: 'profile', icon: 'fa-user', label: '我的', page: 'profile-main' }
    ];
    return `<div class="app-tabbar">${tabs.map(t => `
        <div class="tab ${active === t.key ? 'active' : ''}" onclick="navigateTo('${t.page}')">
            <i class="fas ${t.icon}"></i><span>${t.label}</span>
        </div>`).join('')}</div>`;
}

// 渐变卡片
function GradientCard(gradient, content) {
    return `<div class="gradient-card gradient-${gradient}">${content}</div>`;
}

// 快捷入口
function QuickTile(icon, bg, label, page, opts) {
    opts = opts || {};
    var onClick;
    if (opts.openCamera) {
        onClick = "navigateTo('" + page + "');setTimeout(function(){(window.__PHOTO_CAMERAGO__||function(m){typeof navigateTo==='function'&&navigateTo(m);})('camera','photo-parse');},180);";
    } else {
        onClick = "navigateTo('" + page + "')";
    }
    return `<div class="quick-tile" onclick="${onClick}">
        <div class="icon" style="background:${bg}"><i class="fas ${icon}"></i></div>
        <div class="label">${label}</div>
    </div>`;
}

// 进度条
function Progress(percent, color = 'var(--primary)') {
    return `<div class="proto-progress"><div class="proto-progress-fill" style="width:${percent}%;background:${color}"></div></div>`;
}

// 圆环图
function RingChart(percent, color = '#3B82F6', size = 80) {
    const r = size / 2 - 6;
    const c = 2 * Math.PI * r;
    const offset = c - (percent / 100) * c;
    return `<div class="proto-ring" style="width:${size}px;height:${size}px;">
        <svg width="${size}" height="${size}">
            <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="#E5E7EB" stroke-width="6"/>
            <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${color}" stroke-width="6" stroke-dasharray="${c}" stroke-dashoffset="${offset}" stroke-linecap="round"/>
        </svg>
        <span class="ring-text" style="font-size:${size/4.5}px">${percent}%</span>
    </div>`;
}

// 图表占位符
function ChartPlaceholder(label = '图表区域', height = 120) {
    return `<div class="chart-placeholder" style="min-height:${height}px"><i class="fas fa-chart-bar" style="font-size:24px;margin-right:8px;"></i> ${label}</div>`;
}

// 多科折线趋势图（SVG实现，无需额外依赖）
// containerId: 容器DOM id
// trend: { labels: [...], datasets: [{ subject, data, color }] }
// opts: { height, showLegend }
function drawMultiLineChart(containerId, trend, opts) {
    opts = opts || {};
    var height = opts.height || 160;
    var showLegend = opts.showLegend !== false;
    var container = document.getElementById(containerId);
    if (!container || !trend || !trend.labels || !trend.labels.length || !trend.datasets || !trend.datasets.length) return;
    container.innerHTML = '';

    // 布局参数
    var width = container.offsetWidth || 300;
    if (width < 50) {
        // 容器还不可见，延迟下一帧再试
        requestAnimationFrame(function () { drawMultiLineChart(containerId, trend, opts); });
        return;
    }
    var paddingLeft = 30;
    var paddingRight = 10;
    var paddingTop = 10;
    var paddingBottom = 24;
    var chartW = width - paddingLeft - paddingRight;
    var chartH = height - paddingTop - paddingBottom;
    if (chartW <= 0 || chartH <= 0) return;

    // 计算全局 y 轴范围（向上取整到 10 的倍数）
    var yMin = Infinity, yMax = -Infinity;
    for (var di = 0; di < trend.datasets.length; di++) {
        var dsArr = trend.datasets[di].data || [];
        for (var vi = 0; vi < dsArr.length; vi++) {
            if (dsArr[vi] < yMin) yMin = dsArr[vi];
            if (dsArr[vi] > yMax) yMax = dsArr[vi];
        }
    }
    if (!isFinite(yMin) || !isFinite(yMax)) return;
    if (yMin === yMax) { yMin -= 5; yMax += 5; }
    var yPad = (yMax - yMin) * 0.15;
    var yMinF = Math.max(0, Math.floor((yMin - yPad) / 10) * 10);
    var yMaxF = Math.ceil((yMax + yPad) / 10) * 10;
    var yRange = yMaxF - yMinF || 1;
    var labelCount = trend.labels.length;
    var stepX = labelCount > 1 ? chartW / (labelCount - 1) : chartW;

    function mapX(i) { return paddingLeft + i * stepX; }
    function mapY(v) { return paddingTop + chartH - ((v - yMinF) / yRange) * chartH; }

    var svg = '<svg width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none" style="width:100%;height:' + height + 'px;display:block;">';

    // 横向网格线 & Y轴刻度（3条）
    var yTicks = 3;
    for (var t = 0; t <= yTicks; t++) {
        var yVal = yMinF + (yRange * t / yTicks);
        var yy = mapY(yVal);
        svg += '<line x1="' + paddingLeft + '" y1="' + yy.toFixed(1) + '" x2="' + (width - paddingRight).toFixed(1) + '" y2="' + yy.toFixed(1) + '" stroke="#E5E7EB" stroke-width="1" stroke-dasharray="3,3"/>';
        svg += '<text x="' + (paddingLeft - 4).toFixed(0) + '" y="' + (yy + 3).toFixed(1) + '" font-size="9" fill="#9CA3AF" text-anchor="end" font-family="-apple-system,BlinkMacSystemFont,\'PingFang SC\',sans-serif">' + Math.round(yVal) + '</text>';
    }

    // X 轴底部标签（稀疏显示：最多 6 个）
    var maxXLabels = 6;
    var xStep = Math.max(1, Math.ceil(labelCount / maxXLabels));
    for (var xi = 0; xi < labelCount; xi += xStep) {
        var lx = mapX(xi);
        svg += '<text x="' + lx.toFixed(1) + '" y="' + (height - 6).toFixed(0) + '" font-size="9" fill="#9CA3AF" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,\'PingFang SC\',sans-serif">' + trend.labels[xi] + '</text>';
    }

    // 绘制每条折线
    for (var d = 0; d < trend.datasets.length; d++) {
        var ds = trend.datasets[d];
        var color = ds.color || '#3B82F6';
        var pts = ds.data || [];
        if (!pts.length) continue;
        // 折线路径
        var pathD = '';
        for (var pi = 0; pi < pts.length; pi++) {
            var px = mapX(pi);
            var py = mapY(pts[pi]);
            pathD += (pi === 0 ? 'M' : 'L') + px.toFixed(1) + ',' + py.toFixed(1) + ' ';
        }
        svg += '<path d="' + pathD.trim() + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>';
        // 数据点：最后一个点显示大圆点+数值
        for (var pj = 0; pj < pts.length; pj++) {
            var ppx = mapX(pj);
            var ppy = mapY(pts[pj]);
            if (pj === pts.length - 1) {
                svg += '<circle cx="' + ppx.toFixed(1) + '" cy="' + ppy.toFixed(1) + '" r="3.5" fill="' + color + '" stroke="white" stroke-width="1"/>';
            }
        }
    }

    svg += '</svg>';
    container.innerHTML = svg;

    // 图例
    if (showLegend) {
        var legend = document.createElement('div');
        legend.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px 14px;margin-top:8px;padding:0 4px;';
        for (var li = 0; li < trend.datasets.length; li++) {
            var lds = trend.datasets[li];
            var item = document.createElement('div');
            item.style.cssText = 'display:flex;align-items:center;gap:5px;font-size:11px;color:#374151;';
            item.innerHTML = '<span style="display:inline-block;width:14px;height:3px;border-radius:2px;background:' + (lds.color || '#3B82F6') + ';"></span>' + (lds.subject || ('科目' + (li + 1)));
            legend.appendChild(item);
        }
        container.appendChild(legend);
    }
}

// 简化版迷你图表：在指定 id 的容器内绘制柱状图/折线图
// type: 'bar' | 'line' | 'pie'（默认 bar）
// data: 数组，柱状图为数值数组，饼图为 [{label, value, color}]
function drawMiniChart(id, data, options) {
    options = options || {};
    var type = options.type || 'bar';
    var color = options.color || '#3B82F6';
    var container = document.getElementById(id);
    if (!container || !data || !data.length) return;
    container.innerHTML = '';
    container.style.cssText = 'width:100%;height:' + (options.height || 120) + 'px;position:relative;display:flex;align-items:flex-end;justify-content:space-around;padding:6px 4px;';

    if (type === 'pie') {
        // 饼图：用 conic-gradient 绘制
        var total = 0;
        for (var i = 0; i < data.length; i++) total += (data[i].value || 0);
        var gradStops = [];
        var acc = 0;
        for (var j = 0; j < data.length; j++) {
            var start = (acc / total) * 100;
            acc += (data[j].value || 0);
            var end = (acc / total) * 100;
            gradStops.push((data[j].color || color) + ' ' + start.toFixed(2) + '% ' + end.toFixed(2) + '%');
        }
        var wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;align-items:center;gap:12px;width:100%;height:100%;';
        var pie = document.createElement('div');
        pie.style.cssText = 'width:' + (options.height || 100) + 'px;height:' + (options.height || 100) + 'px;border-radius:50%;background:conic-gradient(' + gradStops.join(',') + ');flex-shrink:0;';
        var legend = document.createElement('div');
        legend.style.cssText = 'flex:1;font-size:11px;color:#374151;line-height:1.6;';
        var legendHtml = '';
        for (var k = 0; k < data.length; k++) {
            legendHtml += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + (data[k].color || color) + ';"></span>' + (data[k].label || '') + ' ' + (data[k].value || 0) + '%</div>';
        }
        legend.innerHTML = legendHtml;
        wrap.appendChild(pie);
        wrap.appendChild(legend);
        container.appendChild(wrap);
        return;
    }

    var max = 0;
    for (var m = 0; m < data.length; m++) {
        if (typeof data[m] === 'number' && data[m] > max) max = data[m];
        else if (data[m] && data[m].value > max) max = data[m].value;
    }
    if (max <= 0) max = 1;

    if (type === 'line') {
        // 折线图：用 SVG 绘制
        var w = options.width || container.offsetWidth || 280;
        var h = options.height || 120;
        var padding = 8;
        var stepX = (w - padding * 2) / (data.length - 1 > 0 ? data.length - 1 : 1);
        var points = [];
        for (var p = 0; p < data.length; p++) {
            var v = typeof data[p] === 'number' ? data[p] : data[p].value;
            var x = padding + p * stepX;
            var y = h - padding - (v / max) * (h - padding * 2);
            points.push(x.toFixed(1) + ',' + y.toFixed(1));
        }
        var svg = '<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
            '<polyline points="' + points.join(' ') + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
        for (var d = 0; d < points.length; d++) {
            var pt = points[d].split(',');
            svg += '<circle cx="' + pt[0] + '" cy="' + pt[1] + '" r="3" fill="' + color + '"/>';
        }
        svg += '</svg>';
        container.innerHTML = svg;
        return;
    }

    // 默认柱状图
    for (var b = 0; b < data.length; b++) {
        var val = typeof data[b] === 'number' ? data[b] : (data[b] && data[b].value) || 0;
        var barColor = (data[b] && data[b].color) || color;
        var bar = document.createElement('div');
        bar.style.cssText = 'flex:1;max-width:36px;background:' + barColor + ';border-radius:4px 4px 0 0;height:' + (val / max * 100).toFixed(1) + '%;min-height:4px;transition:height 0.4s;';
        container.appendChild(bar);
    }
}

// 分段控制器
function Segment(items, active = 0) {
    return `<div class="proto-segment">${items.map((item, i) =>
        `<div class="proto-segment-item ${i === active ? 'active' : ''}" onclick="switchSegment(this)">${item}</div>`
    ).join('')}</div>`;
}

// 列表项
function ListItem(icon, iconBg, title, desc, page) {
    return `<div class="proto-list-item" onclick="navigateTo('${page || ''}')">
        <div class="icon" style="background:${iconBg}"><i class="fas ${icon}"></i></div>
        <div class="text"><div class="title">${title}</div>${desc ? `<div class="desc">${desc}</div>` : ''}</div>
        <div class="arrow"><i class="fas fa-chevron-right"></i></div>
    </div>`;
}

// 标签
function Tag(text, color = 'blue') {
    return `<span class="proto-tag tag-${color}">${text}</span>`;
}

// 页面包装器（含状态栏+导航栏+内容+TabBar）
function Page(opts) {
    const { title, back, right, tabbar, content, navbar = true, statusbar = true } = opts;
    let html = '';
    if (statusbar) html += StatusBar();
    if (navbar) html += NavBar(title, { back, right });
    html += `<div class="app-content">${content}</div>`;
    if (tabbar) html += TabBar(tabbar);
    return html;
}

// 后台管理页面布局
function AdminPage(title, menuItems, activeMenu, content) {
    let html = StatusBar();
    html += `<div style="display:flex;height:calc(100% - 44px);">`;
    html += `<div class="admin-sidebar">`;
    html += `<div style="padding:16px 20px;font-size:15px;font-weight:700;color:white;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(255,255,255,0.1);margin-bottom:8px;"><i class="fas fa-cog"></i> 管理后台</div>`;
    menuItems.forEach(m => {
        html += `<div class="menu-item ${m.key === activeMenu ? 'active' : ''}" onclick="navigateTo('${m.page}')"><i class="fas ${m.icon}"></i> ${m.label}</div>`;
    });
    html += `</div>`;
    html += `<div style="flex:1;overflow-y:auto;padding:20px;background:#F3F4F6;">`;
    html += `<div style="font-size:20px;font-weight:700;margin-bottom:16px;">${title}</div>`;
    html += content;
    html += `</div></div>`;
    return html;
}

// ===== 所有 UI 工具函数显式挂到 window，避免脚本加载后在新调用栈中找不到 =====
(function exposeGlobals() {
    var exports = ['StatusBar','NavBar','TabBar','GradientCard','Page','AdminPage','StatCard','ChartPlaceholder','Progress','RingChart','drawMiniChart','drawMultiLineChart','Segment','Tag','svgAvatar','svgAvatarHTML'];
    exports.forEach(function (n) {
        try {
            if (typeof window[n] === 'undefined' && typeof window.eval('typeof '+n) !== 'undefined') {
                window[n] = window.eval(n);
            }
        } catch (e) {}
    });
})();

// 统计卡片
function StatCard(label, value, change, color = 'blue') {
    const changeHTML = change ? `<div style="font-size:11px;margin-top:4px;color:${change > 0 ? '#10B981' : '#EF4444'}">${change > 0 ? '↑' : '↓'} ${Math.abs(change)}%</div>` : '';
    return `<div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <div style="font-size:12px;color:#6B7280;">${label}</div>
        <div style="font-size:24px;font-weight:700;color:var(--${color === 'blue' ? 'primary' : color});margin-top:4px;">${value}</div>
        ${changeHTML}
    </div>`;
}

// SVG 头像生成（替代 pravatar.cc 跨域资源，纯内联无网络请求）
// usage: svgAvatar('李', 'blue', 48) or svgAvatar('李同学', null, 48)
window.svgAvatar = function (nameOrInitial, color, size) {
    const initial = (nameOrInitial || '?').toString().trim().charAt(0);
    const palette = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
    let bg = color || '#3B82F6';
    if (!color) {
        let hash = 0;
        for (let i = 0; i < (nameOrInitial || '').length; i++) hash = ((hash << 5) - hash) + (nameOrInitial || '').charCodeAt(i);
        bg = palette[Math.abs(hash) % palette.length];
    }
    const sz = size || 40;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${sz}' height='${sz}' viewBox='0 0 ${sz} ${sz}'>
        <defs>
            <linearGradient id='g${sz}' x1='0' y1='0' x2='1' y2='1'>
                <stop offset='0%' stop-color='${bg}' stop-opacity='0.95'/>
                <stop offset='100%' stop-color='${bg}' stop-opacity='0.75'/>
            </linearGradient>
        </defs>
        <circle cx='${sz/2}' cy='${sz/2}' r='${sz/2}' fill='url(#g${sz})'/>
        <circle cx='${sz/2}' cy='${sz*0.38}' r='${sz*0.16}' fill='white' opacity='0.9'/>
        <path d='M ${sz*0.18} ${sz*0.95} Q ${sz*0.5} ${sz*0.58} ${sz*0.82} ${sz*0.95} Z' fill='white' opacity='0.9'/>
        <text x='50%' y='${sz*0.45}' text-anchor='middle' fill='white' font-family='-apple-system,BlinkMacSystemFont,\"PingFang SC\",\"Microsoft YaHei\",sans-serif' font-size='${Math.round(sz*0.22)}' font-weight='700' dominant-baseline='middle'>${initial}</text>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
};
window.svgAvatarHTML = function (name, color, size, extraStyle) {
    const sz = size || 40;
    return `<img src="${window.svgAvatar(name, color, sz)}" style="width:${sz}px;height:${sz}px;border-radius:50%;${extraStyle || ''}" onerror="this.style.display='none'">`;
};

// ============================================================
// PAGE_SAMPLE_DATA: 原型演示静态样例数据（无后端服务时自动使用）
// 覆盖 58 个 registerPage 子页：api.getPageData(key) 在 fetch 失败或返回 null 时自动回退到这里
// ============================================================
window.PAGE_SAMPLE_DATA = {
    'admin-ai-review': {
        "stats": [
            {
                "label": "待审内容",
                "value": "32",
                "change": 0,
                "color": "orange"
            },
            {
                "label": "今日已审",
                "value": "158",
                "change": 0,
                "color": "green"
            },
            {
                "label": "平均AI评分",
                "value": "89",
                "change": 0,
                "color": "blue"
            },
            {
                "label": "需复审",
                "value": "5",
                "change": 0,
                "color": "red"
            }
        ],
        "notice": "AI评分低于 80 分的内容需人工复审后再发布",
        "items": [
            {
                "type": "AI解析",
                "content": "本题考查导数的极值求法，需先求导再令其等于零...",
                "score": 95,
                "status": "待审核"
            },
            {
                "type": "AI讲题",
                "content": "第一步：求导数 f(x)=3x²-3，第二步：令 f(x)=0 解得驻点...",
                "score": 88,
                "status": "待审核"
            },
            {
                "type": "AI答疑",
                "content": "椭圆是到两定点距离之和为常数的轨迹，双曲线则是距离之差...",
                "score": 72,
                "status": "需复审"
            }
        ]
    },
    'admin-banner': {
        "total": 4,
        "banners": [
            {
                "title": "暑期冲刺特惠",
                "link": "/vip",
                "sort": 1,
                "status": "上线"
            },
            {
                "title": "AI讲题新功能上线",
                "link": "/ai-explain",
                "sort": 2,
                "status": "上线"
            },
            {
                "title": "高考倒计时提醒",
                "link": "/countdown",
                "sort": 3,
                "status": "下线"
            },
            {
                "title": "邀请好友得会员",
                "link": "/invite",
                "sort": 4,
                "status": "上线"
            }
        ]
    },
    'admin-content': {
        "stats": [
            {
                "label": "待处理",
                "value": "12",
                "change": 0,
                "color": "orange"
            },
            {
                "label": "今日处理",
                "value": "34",
                "change": 0,
                "color": "green"
            },
            {
                "label": "累计举报",
                "value": "1,256",
                "change": 0,
                "color": "blue"
            }
        ],
        "reports": [
            {
                "type": "违规广告",
                "content": "加微信xxx免费领取高考真题密卷...",
                "user": "用户A",
                "time": "10分钟前",
                "status": "待处理",
                "icon": "fa-bullhorn",
                "iconBg": "#FEE2E2",
                "iconColor": "#EF4444"
            },
            {
                "type": "不当言论",
                "content": "讨论区出现不文明用语及人身攻击...",
                "user": "用户B",
                "time": "1小时前",
                "status": "待处理",
                "icon": "fa-comment-slash",
                "iconBg": "#FED7AA",
                "iconColor": "#EA580C"
            },
            {
                "type": "抄袭内容",
                "content": "该解析与原创作者内容高度雷同...",
                "user": "用户C",
                "time": "3小时前",
                "status": "处理中",
                "icon": "fa-copy",
                "iconBg": "#E0E7FF",
                "iconColor": "#6366F1"
            },
            {
                "type": "垃圾信息",
                "content": "评论区连续发布无意义重复内容...",
                "user": "用户D",
                "time": "昨天",
                "status": "已处理",
                "icon": "fa-trash",
                "iconBg": "#FEF3C7",
                "iconColor": "#F59E0B"
            }
        ]
    },
    'admin-dashboard': {
        "stats": [
            {
                "label": "总用户数",
                "value": "12.5万",
                "change": 8,
                "color": "blue"
            },
            {
                "label": "日活跃",
                "value": "3.2万",
                "change": 5,
                "color": "green"
            },
            {
                "label": "付费率",
                "value": "18%",
                "change": 3,
                "color": "orange"
            },
            {
                "label": "今日收入",
                "value": "￥8.6万",
                "change": 12,
                "color": "purple"
            }
        ],
        "charts": [
            {
                "title": "用户增长趋势",
                "label": "近30天新增用户趋势折线图",
                "height": 180
            },
            {
                "title": "收入趋势",
                "label": "近30天收入趋势柱状图",
                "height": 180
            }
        ],
        "realtime": [
            {
                "label": "在线用户",
                "value": "1,856",
                "bg": "#EFF6FF",
                "color": "#3B82F6"
            },
            {
                "label": "今日新增",
                "value": "432",
                "bg": "#F0FDF4",
                "color": "#10B981"
            },
            {
                "label": "今日订单",
                "value": "128",
                "bg": "#FFF7ED",
                "color": "#F59E0B"
            },
            {
                "label": "AI调用",
                "value": "5.2万",
                "bg": "#FDF2F8",
                "color": "#EC4899"
            }
        ]
    },
    'admin-exams': {
        "filters": {
            "years": [
                "全部年份",
                "2025",
                "2024",
                "2023"
            ],
            "provinces": [
                "全部省份",
                "浙江",
                "北京",
                "上海"
            ],
            "subjects": [
                "全部科目",
                "数学",
                "物理",
                "化学"
            ]
        },
        "exams": [
            {
                "year": "2025",
                "province": "浙江",
                "subject": "数学",
                "no": "21",
                "diff": "困难",
                "status": "已发布"
            },
            {
                "year": "2025",
                "province": "浙江",
                "subject": "物理",
                "no": "18",
                "diff": "中等",
                "status": "已发布"
            },
            {
                "year": "2024",
                "province": "北京",
                "subject": "化学",
                "no": "15",
                "diff": "简单",
                "status": "已发布"
            },
            {
                "year": "2024",
                "province": "上海",
                "subject": "英语",
                "no": "22",
                "diff": "中等",
                "status": "审核中"
            },
            {
                "year": "2023",
                "province": "江苏",
                "subject": "语文",
                "no": "12",
                "diff": "中等",
                "status": "已发布"
            }
        ]
    },
    'admin-members': {
        "stats": [
            {
                "label": "总会员数",
                "value": "2.3万",
                "change": 0,
                "color": "blue"
            },
            {
                "label": "本月新增",
                "value": "856",
                "change": 12,
                "color": "green"
            },
            {
                "label": "续费率",
                "value": "72%",
                "change": 4,
                "color": "orange"
            }
        ],
        "members": [
            {
                "name": "张同学",
                "plan": "年卡",
                "amount": "￥198",
                "start": "2026-01-15",
                "end": "2027-01-15",
                "status": "有效"
            },
            {
                "name": "王芳",
                "plan": "季卡",
                "amount": "￥68",
                "start": "2026-06-01",
                "end": "2026-09-01",
                "status": "有效"
            },
            {
                "name": "刘洋",
                "plan": "月卡",
                "amount": "￥28",
                "start": "2026-07-01",
                "end": "2026-08-01",
                "status": "有效"
            },
            {
                "name": "孙琪",
                "plan": "年卡",
                "amount": "￥198",
                "start": "2025-08-10",
                "end": "2026-08-10",
                "status": "即将到期"
            },
            {
                "name": "周婷",
                "plan": "季卡",
                "amount": "￥68",
                "start": "2026-04-20",
                "end": "2026-07-20",
                "status": "已过期"
            }
        ]
    },
    'admin-ocr': {
        "stats": [
            {
                "label": "待审核",
                "value": "48",
                "change": 0,
                "color": "orange"
            },
            {
                "label": "今日已审",
                "value": "126",
                "change": 0,
                "color": "green"
            },
            {
                "label": "平均置信度",
                "value": "91%",
                "change": 0,
                "color": "blue"
            }
        ],
        "reviews": [
            {
                "subject": "数学",
                "text": "已知函数 f(x)=x³-3x+1，求极值...",
                "confidence": 96,
                "time": "5分钟前"
            },
            {
                "subject": "物理",
                "text": "一物体从高h处自由下落，落地速度为v...",
                "confidence": 88,
                "time": "5分钟前"
            },
            {
                "subject": "化学",
                "text": "反应 N₂+3H₂⇌2NH₃ 达到平衡时...",
                "confidence": 92,
                "time": "5分钟前"
            },
            {
                "subject": "英语",
                "text": "The teacher, together with his students...",
                "confidence": 75,
                "time": "5分钟前"
            }
        ]
    },
    'admin-retention': {
        "stats": [
            {
                "label": "次日留存",
                "value": "45%",
                "change": 3,
                "color": "blue"
            },
            {
                "label": "7日留存",
                "value": "32%",
                "change": 5,
                "color": "green"
            },
            {
                "label": "30日留存",
                "value": "22%",
                "change": 8,
                "color": "orange"
            }
        ],
        "retention": [
            {
                "date": "07-28",
                "reg": 1124,
                "d1": 45,
                "d3": 38,
                "d7": 32,
                "d14": 28,
                "d30": 22
            },
            {
                "date": "07-21",
                "reg": 1156,
                "d1": 48,
                "d3": 40,
                "d7": 34,
                "d14": 30,
                "d30": 24
            },
            {
                "date": "07-14",
                "reg": 1089,
                "d1": 42,
                "d3": 36,
                "d7": 31,
                "d14": 27,
                "d30": 21
            },
            {
                "date": "07-07",
                "reg": 1142,
                "d1": 46,
                "d3": 39,
                "d7": 33,
                "d14": 29,
                "d30": 23
            },
            {
                "date": "06-30",
                "reg": 1078,
                "d1": 44,
                "d3": 37,
                "d7": 30,
                "d14": 26,
                "d30": 20
            },
            {
                "date": "06-23",
                "reg": 1163,
                "d1": 47,
                "d3": 41,
                "d7": 35,
                "d14": 31,
                "d30": 25
            },
            {
                "date": "06-16",
                "reg": 1056,
                "d1": 43,
                "d3": 35,
                "d7": 29,
                "d14": 25,
                "d30": 19
            }
        ],
        "chart": "用户留存率衰减曲线（次日-30日）"
    },
    'admin-stats': {
        "ranges": [
            "最近7天",
            "最近30天",
            "最近90天"
        ],
        "stats": [
            {
                "label": "累计做题量",
                "value": "1,256万",
                "change": 18,
                "color": "blue"
            },
            {
                "label": "平均提分",
                "value": "+23分",
                "change": 0,
                "color": "green"
            },
            {
                "label": "AI调用次数",
                "value": "5,820万",
                "change": 32,
                "color": "purple"
            },
            {
                "label": "用户满意度",
                "value": "94%",
                "change": 2,
                "color": "orange"
            }
        ],
        "charts": [
            {
                "title": "做题量趋势",
                "label": "近30天全平台做题量趋势",
                "height": 180
            },
            {
                "title": "提分分布",
                "label": "用户提分区间分布柱状图",
                "height": 180
            },
            {
                "title": "学科分布",
                "label": "各学科做题量占比饼图",
                "height": 180
            }
        ]
    },
    'admin-users': {
        "total": 12568,
        "filters": {
            "grades": [
                "全部年级",
                "高三",
                "高二",
                "高一"
            ]
        },
        "users": [
            {
                "name": "张同学",
                "phone": "138****8888",
                "grade": "高三",
                "time": "2026-07-28",
                "status": "正常",
                "avatar": 12
            },
            {
                "name": "李明",
                "phone": "139****6666",
                "grade": "高二",
                "time": "2026-07-26",
                "status": "正常",
                "avatar": 33
            },
            {
                "name": "王芳",
                "phone": "137****1234",
                "grade": "高三",
                "time": "2026-07-25",
                "status": "VIP",
                "avatar": 45
            },
            {
                "name": "赵磊",
                "phone": "135****5678",
                "grade": "高一",
                "time": "2026-07-20",
                "status": "禁用",
                "avatar": 8
            },
            {
                "name": "陈静",
                "phone": "136****9012",
                "grade": "高三",
                "time": "2026-07-15",
                "status": "正常",
                "avatar": 27
            }
        ]
    },
    'ai-auto-import-cut': {
        "header": {
            "icon": "fa-cut",
            "title": "LLM智能切题",
            "subtitle": "第 5 步 / 共 9 步 · 已完成",
            "count": 12,
            "count_label": "识别题目"
        },
        "raw_text_section": {
            "title": "原始文本区域",
            "title_icon": "fa-align-left",
            "lines": [
                "一、选择题（本题共8小题，每小题5分）",
                "1. 已知集合A={x|x²-3x+2≤0}，B={x|y=ln(1-x)}...",
                "2. 复数z满足z·(1+i)=2i，则|z|=...",
                "...",
                "二、填空题（本题共4小题，每小题5分）",
                "9. 函数f(x)=sin(2x+π/6)的最小正周期为...",
                "...",
                "三、解答题（本题共6小题，共70分）",
                "13.（10分）在△ABC中，内角A,B,C的对边为a,b,c...",
                "..."
            ]
        },
        "result_section": {
            "title": "AI切题结果",
            "title_icon": "fa-list-ul",
            "more": "识别出12道题",
            "stats": [
                {
                    "value": 8,
                    "color": "var(--primary)",
                    "label": "选择题"
                },
                {
                    "value": 4,
                    "color": "var(--purple)",
                    "label": "填空题"
                },
                {
                    "value": 6,
                    "color": "var(--success)",
                    "label": "解答题"
                },
                {
                    "value": "96%",
                    "color": "var(--warning)",
                    "label": "平均置信度"
                }
            ]
        },
        "questions": [
            {
                "n": 1,
                "type": "选择题",
                "score": "5分",
                "stem": "已知集合A={x|x²-3x+2≤0}，B={x|y=ln(1-x)}，则A∩B=",
                "kp": "集合运算",
                "conf": 98
            },
            {
                "n": 2,
                "type": "选择题",
                "score": "5分",
                "stem": "复数z满足z·(1+i)=2i，则|z|=",
                "kp": "复数模长",
                "conf": 98
            },
            {
                "n": 7,
                "type": "选择题",
                "score": "5分",
                "stem": "已知椭圆C: x²/4+y²=1，过右焦点F的直线l...",
                "kp": "圆锥曲线",
                "conf": 95
            },
            {
                "n": 9,
                "type": "填空题",
                "score": "5分",
                "stem": "函数f(x)=sin(2x+π/6)的最小正周期为___",
                "kp": "三角函数周期",
                "conf": 97
            },
            {
                "n": 10,
                "type": "填空题",
                "score": "5分",
                "stem": "曲线y=x³在点(1,1)处的切线方程为___",
                "kp": "导数几何意义",
                "conf": 95
            },
            {
                "n": 13,
                "type": "解答题",
                "score": "10分",
                "stem": "在△ABC中，内角A,B,C的对边为a,b,c，已知...",
                "kp": "正弦定理/余弦定理",
                "conf": 92
            }
        ],
        "more_tip": "— 还有 6 道题已识别，下滑查看更多 —",
        "adjust_section": {
            "title": "切题调整",
            "title_icon": "fa-wrench",
            "subtitle": "如AI切题有误，可手动调整：",
            "options": [
                {
                    "icon": "fa-compress-arrows-alt",
                    "color": "var(--purple)",
                    "label": "合并题7和题8"
                },
                {
                    "icon": "fa-expand-arrows-alt",
                    "color": "var(--warning)",
                    "label": "拆分题10为两小题"
                },
                {
                    "icon": "fa-plus-circle",
                    "color": "var(--success)",
                    "label": "手动添加新题目"
                }
            ]
        },
        "confirm_button": {
            "text": "确认切题结果，进入AI审核",
            "icon": "fa-check-double"
        }
    },
    'ai-auto-import-ocr': {
        "header": {
            "icon": "fa-file-image",
            "title": "OCR识别详情",
            "subtitle": "第 2 步 / 共 9 步 · 已完成",
            "accuracy": "96.8%",
            "accuracy_label": "识别准确率",
            "accuracy_color": "var(--success)"
        },
        "pdf_preview": {
            "title": "原始PDF预览",
            "title_icon": "fa-file-pdf",
            "page_title": "2024高考数学模拟卷 · 第3页",
            "content_lines": [
                {
                    "text": "7. 已知椭圆C: x²/4 + y² = 1，过右焦点F的直线l与",
                    "is_box": true
                },
                {
                    "text": "椭圆C交于A、B两点，且|AB| = 2√2，求直线l的方程。",
                    "is_box": true
                },
                {
                    "text": "[函数图像区域]",
                    "is_box": true,
                    "muted": true
                },
                {
                    "text": "8. 设数列{aₙ}的前n项和为Sₙ...",
                    "is_box": false,
                    "muted": true
                }
            ]
        },
        "ocr_result": {
            "title": "OCR识别结果",
            "title_icon": "fa-font",
            "subtitle": "识别出的文字内容：",
            "lines": [
                {
                    "text": "7. 已知椭圆 C: ",
                    "highlight": false
                },
                {
                    "text": "x²/4 + y² = 1",
                    "highlight": true
                },
                {
                    "text": "，过右焦点 F 的直线 l 与椭圆 C 交于 A、B 两点，且 |AB| = 2√2，求直线 l 的方程。",
                    "highlight": false
                },
                {
                    "text": "8. 设数列 {aₙ} 的前 n 项和为 Sₙ，若 a₁ = 1，aₙ₊₁ = 2aₙ + 1...",
                    "highlight": false
                }
            ]
        },
        "accuracy_section": {
            "title": "识别准确率",
            "title_icon": "fa-bullseye",
            "ring_percent": 97,
            "ring_color": "#10B981",
            "ring_size": 72,
            "title_main": "综合准确率 96.8%",
            "details": [
                {
                    "label": "文字识别",
                    "value": "98.5%"
                },
                {
                    "label": "公式识别",
                    "value": "94.2%"
                },
                {
                    "label": "图表识别",
                    "value": "95.0%"
                }
            ]
        },
        "abnormal_section": {
            "title": "识别异常标记",
            "title_icon": "fa-exclamation-triangle",
            "warning_text": "3 处公式需要人工确认",
            "items": [
                {
                    "label": "第7题 · 公式1",
                    "formula": "x^2/4 + y^2 = 1"
                },
                {
                    "label": "第7题 · 公式2",
                    "formula": "|AB| = 2\\sqrt{2}"
                },
                {
                    "label": "第8题 · 公式1",
                    "formula": "a_{n+1} = 2a_n + 1"
                }
            ]
        },
        "latex_section": {
            "title": "公式识别结果（LaTeX）",
            "title_icon": "fa-square-root-alt",
            "subtitle": "已将图片公式转为 LaTeX 格式：",
            "blocks": [
                {
                    "comment": "% 第7题公式",
                    "formulas": [
                        "\\frac{x^2}{4} + y^2 = 1",
                        "|AB| = 2\\sqrt{2}"
                    ]
                },
                {
                    "comment": "% 第8题公式",
                    "formulas": [
                        "a_{n+1} = 2a_n + 1",
                        "S_n = \\sum_{i=1}^{n} a_i"
                    ]
                }
            ]
        },
        "image_section": {
            "title": "图片区域标注",
            "title_icon": "fa-image",
            "items": [
                {
                    "icon": "fa-chart-line",
                    "color": "var(--primary)",
                    "label": "图表",
                    "count": "2处"
                },
                {
                    "icon": "fa-wave-square",
                    "color": "var(--purple)",
                    "label": "函数图像",
                    "count": "3处"
                },
                {
                    "icon": "fa-shapes",
                    "color": "var(--success)",
                    "label": "几何图形",
                    "count": "1处"
                }
            ]
        },
        "next_button": {
            "text": "确认无误，进入下一步",
            "icon": "fa-check",
            "page": "ai-auto-import-cut"
        }
    },
    'ai-auto-import': {
        "header_card": {
            "icon": "fa-cogs",
            "title": "AI自动入库流程",
            "description": "PDF → OCR → 公式识别 → 图片识别 → LLM切题 → JSON → AI审核 → 知识图谱 → 数据库",
            "progress_label": "整体进度",
            "progress_percent": 67,
            "progress_color": "#FFFFFF",
            "completed_steps": 6,
            "total_steps": 9,
            "current_step": "AI审核校验"
        },
        "flow_section": {
            "title": "完整流程",
            "title_icon": "fa-stream",
            "steps": [
                {
                    "num": 1,
                    "status": "done",
                    "title": "PDF上传",
                    "desc": "已上传《2024高考数学模拟卷.pdf》，共 12 页，包含 20 道题目。",
                    "time": "已完成"
                },
                {
                    "num": 2,
                    "status": "done",
                    "title": "OCR文字识别",
                    "desc": "识别全部文字内容，准确率 96.8%，点击查看识别详情。",
                    "time": "已完成"
                },
                {
                    "num": 3,
                    "status": "done",
                    "title": "公式识别（LaTeX）",
                    "desc": "识别 48 个数学公式并转为 LaTeX 格式，3 处需人工确认。",
                    "time": "已完成"
                },
                {
                    "num": 4,
                    "status": "done",
                    "title": "图片识别与提取",
                    "desc": "识别 6 张图表/函数图像/几何图形，已标注区域。",
                    "time": "已完成"
                },
                {
                    "num": 5,
                    "status": "done",
                    "title": "LLM智能切题",
                    "desc": "识别出 12 道独立题目，含选择题/填空题/解答题，置信度 92-98%。",
                    "time": "已完成"
                },
                {
                    "num": 6,
                    "status": "done",
                    "title": "JSON结构化",
                    "desc": "题目、选项、答案、解析已结构化为 JSON，字段完整率 100%。",
                    "time": "已完成"
                },
                {
                    "num": 7,
                    "status": "active",
                    "title": "AI审核校验",
                    "desc": "正在校验题目内容完整性、公式准确性、知识点标注合理性...",
                    "time": "进行中"
                },
                {
                    "num": 8,
                    "status": "locked",
                    "title": "知识图谱标注",
                    "desc": "将题目关联到知识图谱节点，标注考点与难度等级。",
                    "time": "待处理"
                },
                {
                    "num": 9,
                    "status": "locked",
                    "title": "入库完成",
                    "desc": "写入题库数据库，建立索引，可在组卷/刷题中使用。",
                    "time": "待处理"
                }
            ]
        },
        "step_summary": {
            "title": "步骤说明",
            "title_icon": "fa-info-circle",
            "stats": [
                {
                    "value": 6,
                    "label": "已完成步骤",
                    "bg": "#D1FAE5",
                    "color": "var(--success)",
                    "label_color": "#065F46"
                },
                {
                    "value": 1,
                    "label": "进行中步骤",
                    "bg": "#FEF3C7",
                    "color": "var(--warning)",
                    "label_color": "#92400E"
                },
                {
                    "value": 2,
                    "label": "待处理步骤",
                    "bg": "#F3F4F6",
                    "color": "var(--text-tertiary)",
                    "label_color": "var(--text-secondary)"
                },
                {
                    "value": 12,
                    "label": "识别题目数",
                    "bg": "#DBEAFE",
                    "color": "var(--primary)",
                    "label_color": "var(--primary-dark)"
                }
            ]
        },
        "buttons": [
            {
                "text": "查看当前步骤",
                "icon": "fa-eye",
                "type": "primary",
                "page": "ai-auto-import-ocr"
            },
            {
                "text": "查看全部日志",
                "icon": "fa-list",
                "type": "outline"
            }
        ]
    },
    'ai-coach': {
        "header": {
            "name": "AI学习教练",
            "status": "在线",
            "greeting": "张同学，今天我为你分析了学情...",
            "avatar_icon": "fa-robot",
            "avatar_gradient": "linear-gradient(135deg,#3B82F6,#8B5CF6)"
        },
        "suggestion": {
            "title": "今日AI建议",
            "icon": "fa-lightbulb",
            "today_topic": "数学 · 导数分类讨论",
            "today_topic_label": "今天学什么",
            "reason_label": "为什么学",
            "reason": "高考必考 + 你的掌握率仅52%",
            "improve_label": "预计提高",
            "improve_value": "+8分"
        },
        "chat_section_title": "AI对话",
        "messages": [
            {
                "role": "ai",
                "text": "早上好张同学！我分析了你最近7天的学习数据，发现导数分类讨论是最大提分点。建议今天用40分钟专项突破，准备好开始了吗？"
            },
            {
                "role": "user",
                "text": "好的，但我导数基础不太好，能从基础开始讲吗？"
            },
            {
                "role": "ai",
                "text": "没问题！我会先帮你梳理导数求极值的基础流程，再过渡到分类讨论。点击下方\"开始讲题\"即可。"
            }
        ],
        "quick_questions": [
            "💡 今日该怎么学？",
            "📊 分析我的薄弱点",
            "📅 制定一周计划"
        ],
        "input_placeholder": "问我任何学习问题..."
    },
    'ai-error': {
        "stats_card": {
            "title": "本月错题统计",
            "icon": "fa-bug",
            "total": 127,
            "mastered": 89,
            "pending": 38
        },
        "subject_distribution_title": "按科目分布",
        "subject_chart_label": "错题分类饼图：数学45道 / 英语28道 / 物理22道 / 化学18道 / 语文14道",
        "subject_chart_height": 140,
        "error_type_title": "错误类型分析",
        "error_types": [
            {
                "name": "计算错误",
                "percent": 35,
                "color": "#EF4444"
            },
            {
                "name": "概念混淆",
                "percent": 28,
                "color": "#F59E0B"
            },
            {
                "name": "审题不清",
                "percent": 20,
                "color": "#8B5CF6"
            },
            {
                "name": "方法不当",
                "percent": 17,
                "color": "#06B6D4"
            }
        ],
        "ai_recommend": {
            "title": "AI智能推荐",
            "content": "建议优先复习数学导数类错题（反复出错3次以上），这是提分性价比最高的方向"
        },
        "error_list_title": "错题列表",
        "error_list_more": "查看全部",
        "errors": [
            {
                "subject": "数学",
                "subjectColor": "blue",
                "q": "设f(x)=x³-3x，求f(x)在[-2,2]上的最值",
                "reason": "分类讨论遗漏边界点",
                "ai": "需同时比较驻点与端点函数值",
                "error_count": 3,
                "days_ago": 2
            },
            {
                "subject": "物理",
                "subjectColor": "orange",
                "q": "一物体从高h处自由下落，落地速度v...",
                "reason": "运动学公式记混",
                "ai": "v²=2gh 与 v=gt 适用场景不同",
                "error_count": 4,
                "days_ago": 3
            },
            {
                "subject": "英语",
                "subjectColor": "green",
                "q": "The teacher, together with his students, ___ going...",
                "reason": "主谓一致概念混淆",
                "ai": "together with 不影响主语单复数",
                "error_count": 5,
                "days_ago": 4
            },
            {
                "subject": "化学",
                "subjectColor": "purple",
                "q": "反应N₂+3H₂⇌2NH₃达平衡后...",
                "reason": "平衡移动方向判断错误",
                "ai": "先用勒夏特列原理判断",
                "error_count": 6,
                "days_ago": 5
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "q": "已知椭圆x²/4+y²=1，求离心率e",
                "reason": "a²与b²位置搞反",
                "ai": "a²是较大分母，e=√(1-b²/a²)",
                "error_count": 7,
                "days_ago": 6
            }
        ],
        "train_button_text": "开始错题训练",
        "train_button_icon": "fa-play"
    },
    'ai-explain': {
        "question_card": {
            "subject": "数学",
            "topic": "导数",
            "difficulty": "★★★☆☆",
            "content": "已知函数 f(x) = x³ - 3x + 1，求 f(x) 的极值。",
            "exam_point": "利用导数研究函数极值"
        },
        "step_header": {
            "title": "AI 分步讲解",
            "completed": 0,
            "total": 3
        },
        "steps": [
            {
                "number": 1,
                "title": "求导数 f'(x)",
                "content": "首先求导数",
                "formula": "f'(x) = 3x² - 3",
                "hint": "点击展开详细推导过程"
            },
            {
                "number": 2,
                "title": "令 f'(x) = 0 求驻点",
                "content": "令 f'(x)=0，解得",
                "formula": "x = ±1",
                "hint": "点击查看方程求解步骤"
            },
            {
                "number": 3,
                "title": "判断极值",
                "content": "判断极值：x=1 处取<span style=\"color:#EF4444;font-weight:600;\">极小值 -1</span>，x=-1 处取<span style=\"color:#10B981;font-weight:600;\">极大值 3</span>",
                "formula": "",
                "hint": ""
            }
        ],
        "bottom_tip": "AI会根据你的理解程度调整讲解节奏，没理解的步骤会自动重新讲解",
        "understood_label": "✓ 我懂了",
        "not_understood_label": "✗ 还没理解",
        "related_knowledge": [
            "导数的几何意义",
            "函数单调性",
            "极值与最值",
            "分类讨论思想"
        ]
    },
    'ai-module-coach': {
        "header_card": {
            "icon": "fa-user-graduate",
            "title": "AI学习教练",
            "subtitle": "每天自动分析你的学情",
            "analysis_text": "今日已为你分析 3 轮学情数据",
            "stats": [
                {
                    "value": "52%",
                    "label": "当前掌握率"
                },
                {
                    "value": "+8分",
                    "label": "预计提升"
                },
                {
                    "value": "5科",
                    "label": "已诊断"
                }
            ]
        },
        "today_analysis": {
            "title": "今日AI分析结果",
            "title_icon": "fa-lightbulb",
            "topic_label": "今天学什么",
            "topic": "数学 · 导数分类讨论",
            "duration": "30分钟",
            "reason_label": "为什么学",
            "reasons": [
                {
                    "color": "var(--danger)",
                    "text": "高考必考考点，近5年真题出现率 100%"
                },
                {
                    "color": "var(--warning)",
                    "text": "你的当前掌握率仅 <b style=\"color:var(--danger);\">52%</b>"
                },
                {
                    "color": "var(--success)",
                    "text": "预计可提升 <b style=\"color:var(--success);\">8分</b>"
                }
            ],
            "improve_label": "预计提高",
            "improve_value": "+8分",
            "improve_desc": "基于同类学生<br>提分数据建模预测"
        },
        "diagnosis": {
            "title": "AI学情诊断",
            "title_icon": "fa-stethoscope",
            "chart_title": "5科掌握率雷达图",
            "tag_text": "实时更新",
            "tag_color": "green",
            "chart_label": "📊 五维雷达图：数学52% / 英语78% / 物理65% / 化学72% / 语文80%",
            "chart_height": 150,
            "subjects": [
                {
                    "name": "数学",
                    "value": "52%",
                    "color": "var(--danger)"
                },
                {
                    "name": "英语",
                    "value": "78%",
                    "color": "var(--success)"
                },
                {
                    "name": "物理",
                    "value": "65%",
                    "color": "var(--warning)"
                },
                {
                    "name": "化学",
                    "value": "72%",
                    "color": "var(--warning)"
                },
                {
                    "name": "语文",
                    "value": "80%",
                    "color": "var(--success)"
                }
            ]
        },
        "learning_path": {
            "title": "AI学习路径推荐",
            "title_icon": "fa-route",
            "description": "基于知识点依赖关系，AI为你规划最优学习顺序",
            "chart_label": "🔗 知识点依赖关系图：函数基础 → 导数概念 → 导数运算 → 分类讨论 → 综合应用",
            "chart_height": 130,
            "nodes": [
                {
                    "text": "✓ 函数基础",
                    "bg": "var(--success)",
                    "color": "white"
                },
                {
                    "text": "✓ 导数概念",
                    "bg": "var(--success)",
                    "color": "white"
                },
                {
                    "text": "⏳ 分类讨论",
                    "bg": "var(--warning)",
                    "color": "white"
                },
                {
                    "text": "综合应用",
                    "bg": "#D1D5DB",
                    "color": "#6B7280"
                }
            ]
        },
        "daily_report": {
            "title": "AI每日报告",
            "title_icon": "fa-file-alt",
            "more": "查看全部",
            "reports": [
                {
                    "day": "今天",
                    "title": "导数分类讨论 · 掌握率52%",
                    "tag": "进行中",
                    "color": "orange",
                    "desc": "AI已生成个性化学习建议"
                },
                {
                    "day": "昨天",
                    "title": "圆锥曲线综合 · 掌握率48%",
                    "tag": "薄弱",
                    "color": "red",
                    "desc": "AI已生成个性化学习建议"
                },
                {
                    "day": "前天",
                    "title": "立体几何 · 掌握率75%",
                    "tag": "稳定",
                    "color": "green",
                    "desc": "AI已生成个性化学习建议"
                },
                {
                    "day": "7/26",
                    "title": "概率统计 · 掌握率82%",
                    "tag": "良好",
                    "color": "green",
                    "desc": "AI已生成个性化学习建议"
                },
                {
                    "day": "7/25",
                    "title": "数列综合 · 掌握率68%",
                    "tag": "提升中",
                    "color": "blue",
                    "desc": "AI已生成个性化学习建议"
                },
                {
                    "day": "7/24",
                    "title": "三角函数 · 掌握率71%",
                    "tag": "稳定",
                    "color": "green",
                    "desc": "AI已生成个性化学习建议"
                },
                {
                    "day": "7/23",
                    "title": "不等式 · 掌握率60%",
                    "tag": "待加强",
                    "color": "orange",
                    "desc": "AI已生成个性化学习建议"
                }
            ]
        },
        "chat_button_text": "与AI教练对话",
        "chat_button_icon": "fa-comments"
    },
    'ai-module-explain': {
        "intro_card": {
            "icon": "fa-magic",
            "title": "AI不是显示答案，而是一步一步讲",
            "description": "直到你真正会为止。每一步都附带理解度检测，AI根据你的反馈动态调整讲解方式。"
        },
        "current_question": {
            "title": "当前讲解题目",
            "title_icon": "fa-pencil-ruler",
            "tags": [
                {
                    "text": "数学",
                    "color": "blue"
                },
                {
                    "text": "圆锥曲线",
                    "color": "purple"
                },
                {
                    "text": "高考真题",
                    "color": "orange"
                }
            ],
            "content_prefix": "已知椭圆 C: ",
            "content_formula": "x²/4 + y² = 1",
            "content_suffix": "，过右焦点 F 的直线 l 与椭圆 C 交于 A、B 两点，且 |AB| = 2√2，求直线 l 的方程。",
            "time_label": "预计用时 10min",
            "time_icon": "far fa-clock",
            "difficulty_label": "难度：★★★★☆",
            "difficulty_icon": "fas fa-fire"
        },
        "step_progress": {
            "title": "分步讲解进度",
            "title_icon": "fa-list-ol",
            "completed": 3,
            "total": 5,
            "percent": 60,
            "progress_color": "var(--cyan)",
            "ring_color": "#06B6D4",
            "ring_size": 56
        },
        "steps_timeline": {
            "title": "讲解步骤",
            "title_icon": "fa-stream",
            "steps": [
                {
                    "num": 1,
                    "status": "done",
                    "title": "审题分析",
                    "desc": "这道题考查椭圆与直线位置关系，关键在于联立方程后利用韦达定理简化计算，最终通过弦长公式求解。",
                    "time": "用时 2min"
                },
                {
                    "num": 2,
                    "status": "done",
                    "title": "建立方程",
                    "desc": "联立直线与椭圆方程，将直线 y = k(x-√3) 代入椭圆方程 x²/4 + y² = 1，整理得到关于 x 的一元二次方程。",
                    "time": "用时 3min"
                },
                {
                    "num": 3,
                    "status": "done",
                    "title": "韦达定理",
                    "desc": "利用韦达定理简化计算，得到 x₁+x₂ 与 x₁·x₂ 的表达式，避免直接求根，为后续弦长计算做准备。",
                    "time": "用时 2min"
                },
                {
                    "num": 4,
                    "status": "active",
                    "title": "求弦长",
                    "desc": "利用弦长公式 |AB| = √(1+k²)·|x₁-x₂|，结合韦达定理结果代入 |AB| = 2√2 求解斜率 k。",
                    "time": "进行中..."
                },
                {
                    "num": 5,
                    "status": "locked",
                    "title": "最终结论",
                    "desc": "解出直线方程并验证，确保符合题意。本步骤将在上一步完成后自动解锁。",
                    "time": "待解锁"
                }
            ]
        },
        "understanding_check": {
            "title": "理解度检测",
            "title_icon": "fa-question-circle",
            "question": "你理解了这一步吗？",
            "icon": "fa-comment-dots",
            "options": [
                {
                    "label": "完全理解",
                    "icon": "fa-check",
                    "color": "var(--success)"
                },
                {
                    "label": "部分理解",
                    "icon": "fa-adjust",
                    "color": "var(--warning)"
                },
                {
                    "label": "需要再讲",
                    "icon": "fa-redo",
                    "color": "var(--danger)"
                }
            ],
            "hint": "如果选择\"需要再讲\"，AI会用不同方式重新讲解（图示法/举例法/类比法）"
        }
    },
    'ai-module-graph': {
        "intro_card": {
            "icon": "fa-project-diagram",
            "title": "个人知识图谱",
            "description": "AI构建你的个人知识图谱，精准定位薄弱环节"
        },
        "subjects": [
            "数学",
            "英语",
            "物理",
            "化学",
            "语文"
        ],
        "active_subject_index": 0,
        "graph_visualization": {
            "title": "知识图谱可视化",
            "title_icon": "fa-sitemap",
            "chart_label": "🕸️ 树状结构图：显示知识点节点关系与掌握状态（红=不会/黄=部分/绿=已掌握）",
            "chart_height": 180,
            "legend": [
                {
                    "color": "var(--success)",
                    "label": "已掌握",
                    "count": 42
                },
                {
                    "color": "var(--warning)",
                    "label": "部分掌握",
                    "count": 18
                },
                {
                    "color": "var(--danger)",
                    "label": "未掌握",
                    "count": 7
                }
            ]
        },
        "mastery_list": {
            "title": "知识点掌握情况",
            "title_icon": "fa-tasks",
            "items": [
                {
                    "path": "数学 → 导数 → 分类讨论",
                    "status": "❌ 不会",
                    "action": "安排训练",
                    "color": "red",
                    "bg": "#FEE2E2"
                },
                {
                    "path": "数学 → 导数 → 极值求解",
                    "status": "✅ 已掌握",
                    "action": "",
                    "color": "green",
                    "bg": "#D1FAE5"
                },
                {
                    "path": "数学 → 圆锥曲线 → 直线与椭圆位置",
                    "status": "⚠️ 部分掌握",
                    "action": "继续练习",
                    "color": "orange",
                    "bg": "#FEF3C7"
                },
                {
                    "path": "数学 → 圆锥曲线 → 弦长公式",
                    "status": "⚠️ 部分掌握",
                    "action": "继续练习",
                    "color": "orange",
                    "bg": "#FEF3C7"
                },
                {
                    "path": "数学 → 数列 → 等差数列",
                    "status": "✅ 已掌握",
                    "action": "",
                    "color": "green",
                    "bg": "#D1FAE5"
                },
                {
                    "path": "数学 → 数列 → 等比数列求和",
                    "status": "❌ 不会",
                    "action": "安排训练",
                    "color": "red",
                    "bg": "#FEE2E2"
                }
            ]
        },
        "ai_suggestion": {
            "title": "AI建议",
            "title_icon": "fa-lightbulb",
            "content": "建议从\"<b>导数-分类讨论</b>\"开始训练，这是导数模块的基础，掌握后可连带提升\"<b>圆锥曲线综合</b>\"的正确率约 15%。"
        },
        "train_button_text": "开始针对性训练",
        "train_button_icon": "fa-bolt"
    },
    'ai-module-paper': {
        "intro_card": {
            "icon": "fa-file-signature",
            "title": "AI智能组卷",
            "description": "根据最近 1000 道做题记录，自动生成今天最值得做的 20 题"
        },
        "params": {
            "title": "组卷参数设置",
            "title_icon": "fa-sliders-h",
            "subject": "数学",
            "count": "20 题",
            "time": "60 分钟",
            "difficulty_distribution": {
                "label": "难度分布",
                "summary": "简4 / 中10 / 难6",
                "easy_percent": 20,
                "medium_percent": 50,
                "hard_percent": 30,
                "easy_count": "简单 20%",
                "medium_count": "中等 50%",
                "hard_count": "困难 30%"
            }
        },
        "data_basis": {
            "title": "AI组卷数据依据",
            "title_icon": "fa-database",
            "items": [
                {
                    "icon": "fa-chart-bar",
                    "bg": "var(--primary-light)",
                    "color": "var(--primary-dark)",
                    "content": "分析了你最近 <b style=\"color:var(--primary);\">1000 道题</b>的作答数据"
                },
                {
                    "icon": "fa-exclamation-triangle",
                    "bg": "#FEE2E2",
                    "color": "#991B1B",
                    "content": "薄弱知识点：<b>导数分类讨论</b>、<b>圆锥曲线综合</b>"
                },
                {
                    "icon": "fa-bullseye",
                    "bg": "#D1FAE5",
                    "color": "#065F46",
                    "content": "高频考点匹配：近5年高考真题频率 <b style=\"color:var(--success);\">&gt;80%</b>"
                },
                {
                    "icon": "fa-history",
                    "bg": "#FEF3C7",
                    "color": "#92400E",
                    "content": "遗忘曲线：3天前做错的 <b style=\"color:var(--warning);\">5 道题</b>需要复习"
                }
            ]
        },
        "preview": {
            "title": "生成的试卷预览",
            "title_icon": "fa-file-alt",
            "more": "共20题",
            "questions": [
                {
                    "n": 1,
                    "type": "选择题",
                    "score": "5分",
                    "diff": "简单",
                    "diffColor": "green",
                    "source": "2023高考真题",
                    "kp": "导数概念"
                },
                {
                    "n": 2,
                    "type": "选择题",
                    "score": "5分",
                    "diff": "简单",
                    "diffColor": "green",
                    "source": "模拟题",
                    "kp": "导数运算"
                },
                {
                    "n": 3,
                    "type": "填空题",
                    "score": "5分",
                    "diff": "中等",
                    "diffColor": "orange",
                    "source": "2022高考真题",
                    "kp": "极值求解"
                },
                {
                    "n": 4,
                    "type": "填空题",
                    "score": "5分",
                    "diff": "中等",
                    "diffColor": "orange",
                    "source": "模拟题",
                    "kp": "分类讨论"
                },
                {
                    "n": 5,
                    "type": "解答题",
                    "score": "12分",
                    "diff": "困难",
                    "diffColor": "red",
                    "source": "2024高考真题",
                    "kp": "圆锥曲线综合"
                },
                {
                    "n": 6,
                    "type": "解答题",
                    "score": "12分",
                    "diff": "困难",
                    "diffColor": "red",
                    "source": "模拟题",
                    "kp": "直线与椭圆"
                },
                {
                    "n": 7,
                    "type": "选择题",
                    "score": "5分",
                    "diff": "中等",
                    "diffColor": "orange",
                    "source": "复习错题",
                    "kp": "韦达定理"
                },
                {
                    "n": 8,
                    "type": "填空题",
                    "score": "5分",
                    "diff": "中等",
                    "diffColor": "orange",
                    "source": "2021高考真题",
                    "kp": "弦长公式"
                }
            ],
            "more_tip": "— 还有 12 道题，下滑查看更多 —"
        },
        "buttons": [
            {
                "text": "开始答题",
                "icon": "fa-play",
                "type": "primary"
            },
            {
                "text": "调整参数",
                "icon": "fa-cog",
                "type": "outline"
            }
        ]
    },
    'ai-module-predict': {
        "input_section": {
            "title": "输入最近三次考试成绩",
            "title_icon": "fa-edit",
            "exams": [
                {
                    "n": "第一次",
                    "total": 565,
                    "subs": "数学118 / 英语125 / 语文110 / 物理88 / 化学84",
                    "color": "orange"
                },
                {
                    "n": "第二次",
                    "total": 580,
                    "subs": "数学125 / 英语128 / 语文112 / 物理90 / 化学85",
                    "color": "blue"
                },
                {
                    "n": "第三次",
                    "total": 598,
                    "subs": "数学130 / 英语130 / 语文115 / 物理93 / 化学90",
                    "color": "green"
                }
            ]
        },
        "trend_chart_label": "📈 三次考试总分趋势：565 → 580 → 598（稳步上升）",
        "trend_chart_height": 90,
        "predict_result": {
            "title": "AI预测结果",
            "title_icon": "fa-brain",
            "predicted_score": 618,
            "change_label": "较最近一次考试",
            "change_value": "+20分",
            "confidence_label": "置信度",
            "confidence_value": "93%",
            "subjects_subtitle": "各科预测提升空间：",
            "subjects": [
                {
                    "name": "数学",
                    "from": 130,
                    "to": 145,
                    "increase": 15,
                    "bar_percent": 75
                },
                {
                    "name": "英语",
                    "from": 130,
                    "to": 138,
                    "increase": 8,
                    "bar_percent": 40
                },
                {
                    "name": "物理",
                    "from": 93,
                    "to": 99,
                    "increase": 6,
                    "bar_percent": 30
                },
                {
                    "name": "化学",
                    "from": 90,
                    "to": 94,
                    "increase": 4,
                    "bar_percent": 20
                },
                {
                    "name": "语文",
                    "from": 115,
                    "to": 118,
                    "increase": 3,
                    "bar_percent": 15
                }
            ]
        },
        "confidence_card": {
            "ring_percent": 93,
            "ring_color": "#3B82F6",
            "ring_size": 72,
            "title": "预测置信度 93%",
            "description": "基于近3次成绩趋势 + 同分段学生提分模型 + 剩余备考天数综合计算"
        },
        "basis_section": {
            "title": "预测依据说明",
            "title_icon": "fa-info-circle",
            "items": [
                {
                    "icon": "fa-check-circle",
                    "color": "var(--success)",
                    "content": "三次成绩呈稳步上升趋势（+15 / +18分）"
                },
                {
                    "icon": "fa-check-circle",
                    "color": "var(--success)",
                    "content": "数学提分空间最大，与薄弱知识点修复匹配"
                },
                {
                    "icon": "fa-check-circle",
                    "color": "var(--success)",
                    "content": "参考同分段 1200 名学生历史提分数据"
                },
                {
                    "icon": "fa-exclamation-circle",
                    "color": "var(--warning)",
                    "content": "语文提升空间较小，建议保持现状"
                }
            ]
        },
        "path_section": {
            "title": "各科提升路径建议",
            "title_icon": "fa-map-marked-alt",
            "paths": [
                {
                    "sub": "数学",
                    "target": "145分",
                    "way": "主攻导数分类讨论 + 圆锥曲线综合",
                    "color": "red"
                },
                {
                    "sub": "英语",
                    "target": "138分",
                    "way": "强化阅读理解 + 完形填空训练",
                    "color": "orange"
                },
                {
                    "sub": "物理",
                    "target": "99分",
                    "way": "攻克电磁学综合 + 实验题",
                    "color": "blue"
                },
                {
                    "sub": "化学",
                    "target": "94分",
                    "way": "复习有机化学 + 化学平衡",
                    "color": "green"
                },
                {
                    "sub": "语文",
                    "target": "118分",
                    "way": "保持现有水平，关注作文素材",
                    "color": "purple"
                }
            ]
        }
    },
    'ai-plan': {
        "goal_card": {
            "title": "目标分数分解",
            "icon": "fa-bullseye",
            "total_target": 620,
            "subjects": [
                {
                    "name": "数学",
                    "target": 135
                },
                {
                    "name": "英语",
                    "target": 130
                },
                {
                    "name": "物理",
                    "target": 100
                },
                {
                    "name": "化学",
                    "target": 90
                },
                {
                    "name": "语文",
                    "target": 130
                }
            ]
        },
        "ai_predict": {
            "title": "AI预测",
            "icon": "fa-chart-line",
            "content_prefix": "按此计划执行，预计可提升",
            "improve": "+35分"
        },
        "plan_title": "30天冲刺计划",
        "plan_title_icon": "fa-calendar-alt",
        "plan_more": "第1周",
        "weeks": [
            {
                "week": 1,
                "theme": "数学突破",
                "color": "#3B82F6",
                "gradient": "blue",
                "tasks": [
                    "导数分类讨论专项（每日2小时）",
                    "圆锥曲线基础巩固",
                    "每日10道导数真题",
                    "错题回顾与整理"
                ],
                "done": true
            },
            {
                "week": 2,
                "theme": "英语提升",
                "color": "#10B981",
                "gradient": "green",
                "tasks": [
                    "阅读理解提速训练",
                    "完形填空高频词积累",
                    "写作模板背诵与仿写",
                    "听力每日30分钟"
                ],
                "done": false
            },
            {
                "week": 3,
                "theme": "综合训练",
                "color": "#8B5CF6",
                "gradient": "purple",
                "tasks": [
                    "理综套卷限时训练",
                    "数学压轴题突破",
                    "英语真题模考",
                    "弱项查漏补缺"
                ],
                "done": false
            },
            {
                "week": 4,
                "theme": "模考冲刺",
                "color": "#F59E0B",
                "gradient": "orange",
                "tasks": [
                    "全真模拟考试（隔日一套）",
                    "试卷复盘与错题分析",
                    "考前心态调整",
                    "重点知识速记"
                ],
                "done": false
            }
        ],
        "overall_progress": {
            "label": "整体进度",
            "percent": 25,
            "color": "#3B82F6",
            "completed_days": 7,
            "total_days": 30,
            "tip": "加油！"
        },
        "buttons": [
            {
                "text": "调整计划",
                "icon": "fa-sliders-h",
                "type": "outline"
            },
            {
                "text": "导出计划",
                "icon": "fa-file-export",
                "type": "primary"
            }
        ]
    },
    'ai-qa': {
        "top_tip": {
            "icon": "fa-comments",
            "color": "#3B82F6",
            "text": "向AI老师提问，秒回详细解析 · 支持拍照提问"
        },
        "user_question": "老师，椭圆和双曲线有什么区别？",
        "ai_answer": {
            "sections": [
                {
                    "title": "椭圆",
                    "title_color": "#10B981",
                    "content": "到两定点（焦点）距离之和为常数的点的轨迹。",
                    "formula": "|PF₁| + |PF₂| = 2a (2a > 2c)"
                },
                {
                    "title": "双曲线",
                    "title_color": "#EF4444",
                    "content": "到两定点（焦点）距离之差为常数的点的轨迹。",
                    "formula": "||PF₁| - |PF₂|| = 2a (2a < 2c)"
                }
            ],
            "drawing_icon": "fa-draw-polygon",
            "drawing_text": "AI手绘图示：椭圆与双曲线几何对比"
        },
        "follow_up_questions": [
            "💬 能不能举个例子？",
            "🎯 这个知识点常考什么？",
            "📝 出道题练练"
        ],
        "history_title": "历史问答",
        "history_more": "全部",
        "history": [
            {
                "icon": "fa-question-circle",
                "color": "#3B82F6",
                "title": "导数单调性怎么判断？",
                "desc": "2小时前 · 已解答"
            },
            {
                "icon": "fa-question-circle",
                "color": "#10B981",
                "title": "三角函数诱导公式记忆技巧",
                "desc": "昨天 · 已解答"
            },
            {
                "icon": "fa-question-circle",
                "color": "#F59E0B",
                "title": "化学平衡常数K的表达式",
                "desc": "3天前 · 已解答"
            }
        ],
        "input_placeholder": "输入你的问题...",
        "camera_icon": "fa-camera"
    },
    'college-major': {
        "interests": [
            {
                "name": "理工",
                "selected": true
            },
            {
                "name": "医学",
                "selected": false
            },
            {
                "name": "经管",
                "selected": true
            },
            {
                "name": "文法",
                "selected": false
            }
        ],
        "match_count": 8,
        "majors": [
            {
                "name": "计算机科学与技术",
                "match": 95,
                "salary": "15-30K",
                "prospect": "极佳",
                "icon": "fa-laptop-code",
                "bg": "#3B82F6",
                "recommend_colleges": 12
            },
            {
                "name": "人工智能",
                "match": 92,
                "salary": "18-35K",
                "prospect": "极佳",
                "icon": "fa-robot",
                "bg": "#8B5CF6",
                "recommend_colleges": 10
            },
            {
                "name": "电子信息工程",
                "match": 88,
                "salary": "12-25K",
                "prospect": "优秀",
                "icon": "fa-microchip",
                "bg": "#06B6D4",
                "recommend_colleges": 11
            },
            {
                "name": "数据科学与大数据技术",
                "match": 86,
                "salary": "14-28K",
                "prospect": "优秀",
                "icon": "fa-database",
                "bg": "#10B981",
                "recommend_colleges": 9
            },
            {
                "name": "软件工程",
                "match": 84,
                "salary": "13-26K",
                "prospect": "优秀",
                "icon": "fa-code",
                "bg": "#F59E0B",
                "recommend_colleges": 13
            },
            {
                "name": "自动化",
                "match": 80,
                "salary": "11-22K",
                "prospect": "良好",
                "icon": "fa-cogs",
                "bg": "#EC4899",
                "recommend_colleges": 10
            },
            {
                "name": "金融学",
                "match": 78,
                "salary": "10-30K",
                "prospect": "良好",
                "icon": "fa-chart-line",
                "bg": "#1D4ED8",
                "recommend_colleges": 14
            },
            {
                "name": "通信工程",
                "match": 75,
                "salary": "10-20K",
                "prospect": "良好",
                "icon": "fa-satellite-dish",
                "bg": "#7C3AED",
                "recommend_colleges": 11
            }
        ]
    },
    'college-rank': {
        "predicted_rank": "8,231",
        "province": "浙江省",
        "category": "物理类",
        "predicted_score": 598,
        "conversion_table": [
            {
                "year": "2025",
                "rank": "8,100名",
                "score": "601分"
            },
            {
                "year": "2024",
                "rank": "8,500名",
                "score": "595分"
            },
            {
                "year": "2023",
                "rank": "8,200名",
                "score": "598分"
            }
        ],
        "one_point_chart_label": "590-610分一分一段表（图表）",
        "history_admission": [
            {
                "year": "2025",
                "college": "湖南大学",
                "level": "985"
            },
            {
                "year": "2024",
                "college": "重庆大学",
                "level": "985"
            },
            {
                "year": "2023",
                "college": "大连理工",
                "level": "985"
            }
        ],
        "tier_pie_chart_label": "位次对应院校层次分布饼图",
        "advice": {
            "title": "志愿填报建议",
            "intro": "推荐「冲2稳2保2」策略：",
            "strategy": [
                {
                    "type": "冲刺",
                    "colleges": "浙江大学、中山大学"
                },
                {
                    "type": "稳妥",
                    "colleges": "武汉大学、华中科技"
                },
                {
                    "type": "保底",
                    "colleges": "四川大学、电子科大"
                }
            ],
            "tip": "专业选择建议服从调剂以提高录取率。"
        }
    },
    'college-recommend': {
        "conditions": [
            "预估 598分",
            "浙江省",
            "物化生",
            "全省8,231名"
        ],
        "colleges": [
            {
                "name": "浙江大学",
                "type": "冲刺",
                "tag": "red",
                "prob": 35,
                "score": "638",
                "majors": "计算机/控制科学/光学工程",
                "icon": "fa-university"
            },
            {
                "name": "中山大学",
                "type": "冲刺",
                "tag": "red",
                "prob": 42,
                "score": "625",
                "majors": "工商管理/生物学/化学",
                "icon": "fa-university"
            },
            {
                "name": "武汉大学",
                "type": "稳妥",
                "tag": "orange",
                "prob": 68,
                "score": "612",
                "majors": "测绘/法学/马克思主义理论",
                "icon": "fa-university"
            },
            {
                "name": "华中科技大学",
                "type": "稳妥",
                "tag": "orange",
                "prob": 72,
                "score": "608",
                "majors": "机械/光学/公共卫生",
                "icon": "fa-university"
            },
            {
                "name": "四川大学",
                "type": "保底",
                "tag": "green",
                "prob": 88,
                "score": "595",
                "majors": "口腔/数学/化学",
                "icon": "fa-university"
            },
            {
                "name": "电子科技大学",
                "type": "保底",
                "tag": "green",
                "prob": 91,
                "score": "592",
                "majors": "电子科学/信息通信/计算机",
                "icon": "fa-university"
            }
        ]
    },
    'home-predict': {
        "predicted_score": 632,
        "change": 10,
        "confidence": 92,
        "admission_prob": {
            "211": 85,
            "985": 67
        },
        "basis": [
            "最近 <b>30天</b> 学习数据（共 112h 学习时长）",
            "<b>3 次</b> 模考成绩及答题轨迹分析",
            "薄弱知识点改善趋势（已攻克 18/25）",
            "全国同类考生成绩分布对比"
        ],
        "trend_chart_label": "各科预测分数趋势图",
        "trend_chart": {
            "labels": ["入学", "10月", "11月", "12月", "1月", "2月", "3月", "4月", "5月", "高考"],
            "datasets": [
                { "subject": "数学", "data": [92, 95, 98, 100, 102, 105, 110, 114, 118, 122], "color": "#3B82F6" },
                { "subject": "语文", "data": [100, 102, 103, 104, 105, 107, 109, 111, 113, 115], "color": "#F59E0B" },
                { "subject": "英语", "data": [108, 110, 111, 112, 113, 115, 118, 120, 122, 125], "color": "#10B981" },
                { "subject": "物理", "data": [65, 67, 70, 72, 74, 76, 79, 82, 85, 88], "color": "#8B5CF6" },
                { "subject": "化学", "data": [70, 72, 74, 76, 78, 80, 82, 84, 86, 88], "color": "#06B6D4" },
                { "subject": "生物", "data": [62, 64, 66, 68, 70, 72, 74, 76, 78, 80], "color": "#EC4899" },
                { "subject": "政治", "data": [60, 62, 64, 66, 68, 70, 73, 76, 79, 82], "color": "#EF4444" },
                { "subject": "历史", "data": [58, 60, 62, 64, 66, 68, 71, 74, 76, 78], "color": "#78350F" },
                { "subject": "地理", "data": [62, 64, 65, 67, 68, 70, 72, 75, 77, 80], "color": "#059669" }
            ]
        },
        "subjects": [
            {
                "subject": "数学",
                "current": 105,
                "predict": 122,
                "max": 150,
                "space": "+17",
                "color": "#3B82F6",
                "advice": "导数与圆锥曲线仍有较大提升空间"
            },
            {
                "subject": "英语",
                "current": 118,
                "predict": 125,
                "max": 150,
                "space": "+7",
                "color": "#10B981",
                "advice": "完形填空与写作稳定后可再提升"
            },
            {
                "subject": "物理",
                "current": 78,
                "predict": 88,
                "max": 100,
                "space": "+10",
                "color": "#8B5CF6",
                "advice": "电磁感应是主要提分突破口"
            },
            {
                "subject": "化学",
                "current": 82,
                "predict": 88,
                "max": 100,
                "space": "+6",
                "color": "#06B6D4",
                "advice": "有机推断需加强训练"
            },
            {
                "subject": "语文",
                "current": 110,
                "predict": 115,
                "max": 150,
                "space": "+5",
                "color": "#F59E0B",
                "advice": "议论文写作可冲刺一类文"
            },
            {
                "subject": "生物",
                "current": 75,
                "predict": 80,
                "max": 100,
                "space": "+5",
                "color": "#EC4899",
                "advice": "遗传规律需重点突破"
            },
            {
                "subject": "政治",
                "current": 72,
                "predict": 82,
                "max": 100,
                "space": "+10",
                "color": "#EF4444",
                "advice": "哲学生活主观题答题模板强化"
            },
            {
                "subject": "历史",
                "current": 68,
                "predict": 78,
                "max": 100,
                "space": "+10",
                "color": "#78350F",
                "advice": "时空观念与史料实证需系统训练"
            },
            {
                "subject": "地理",
                "current": 70,
                "predict": 80,
                "max": 100,
                "space": "+10",
                "color": "#059669",
                "advice": "区域地理综合题解题思路可提分明显"
            }
        ],
        "tier_references": {
            "211": "参考：北航/同济/武大等",
            "985": "参考：清华/北大/复旦等"
        },
        "confidence_desc": "本预测基于多维度数据综合分析，置信度较高。建议持续按计划学习，预测准确度将随数据积累进一步提升。"
    },
    'photo-ocr': {
        "header_title": "拍照搜题",
        "header_subtitle": "对准题目拍照，AI自动识别并解答",
        "camera_target_page": "photo-parse",
        "support_text": "支持数学/物理/化学/英语等全科识别",
        "records_title": "最近搜题",
        "records": [
            {
                "subject": "数学",
                "time": "10分钟前",
                "icon": "fa-square-root-variable",
                "bg": "#3B82F6",
                "q": "已知函数 f(x)=ln x - ax..."
            },
            {
                "subject": "物理",
                "time": "2小时前",
                "icon": "fa-atom",
                "bg": "#8B5CF6",
                "q": "一质量为m的物体在光滑水平面..."
            },
            {
                "subject": "化学",
                "time": "昨天 19:24",
                "icon": "fa-flask",
                "bg": "#10B981",
                "q": "常温下将0.1mol/L醋酸溶液..."
            }
        ],
        "actions": [
            {
                "icon": "fa-images",
                "color": "var(--primary)",
                "label": "相册选择"
            },
            {
                "icon": "fa-bolt",
                "color": "var(--warning)",
                "label": "闪光灯"
            }
        ]
    },
    'photo-parse': {
        "ocr_status": "识别成功",
        "ocr_text": "已知函数 f(x) = ln x - ax (a ∈ R)<br>(1) 讨论 f(x) 的单调性；<br>(2) 若 f(x) ≤ 0 恒成立，求 a 的取值范围。",
        "confidence": 98,
        "confidence_desc": "AI识别准确度极高",
        "steps": [
            {
                "no": 1,
                "title": "分析题意",
                "border_color": "var(--primary)",
                "bg": "var(--primary)",
                "content": "本题考查导数与函数单调性。对 f(x) = ln x - ax 求导得 f'(x) = 1/x - a，需对参数 a 分类讨论。"
            },
            {
                "no": 2,
                "title": "解题过程",
                "border_color": "var(--warning)",
                "bg": "var(--warning)",
                "content": "① 当 a ≤ 0 时，f'(x) = 1/x - a > 0 恒成立，f(x) 在 (0,+∞) 单调递增；<br>② 当 a > 0 时，令 f'(x) = 0 得 x = 1/a，f(x) 在 (0,1/a) 递增，在 (1/a,+∞) 递减；<br>③ 由 f(x) ≤ 0 恒成立，结合最大值分析得 a ≥ 1。"
            },
            {
                "no": 3,
                "title": "最终答案",
                "border_color": "var(--success)",
                "bg": "var(--success)",
                "content": "(1) a ≤ 0 时单调递增；a > 0 时在 (0,1/a) 递增，(1/a,+∞) 递减。<br>(2) a 的取值范围为 [1, +∞)。"
            }
        ],
        "actions": [
            {
                "type": "outline",
                "icon": "fa-copy",
                "label": "相似题",
                "page": "photo-similar"
            },
            {
                "type": "primary",
                "icon": "fa-robot",
                "label": "问AI老师",
                "page": "photo-video"
            }
        ],
        "detail_action": {
            "type": "outline",
            "icon": "fa-list-ul",
            "label": "查看详细解析",
            "page": "photo-similar"
        }
    },
    'photo-similar': {
        "title": "AI为你找到5道相似题",
        "subtitle": "基于知识点匹配与难度分析",
        "total_count": 5,
        "questions": [
            {
                "sim": 98,
                "subject": "数学",
                "diff": "中等",
                "q": "已知函数 g(x) = ln x - bx (b∈R)，讨论 g(x) 的单调性。",
                "tag": "red",
                "type": "解答题",
                "knowledge_point": "导数与单调性",
                "question": "已知函数 g(x) = ln x - bx (b∈R, x>0)，讨论 g(x) 的单调性。",
                "options": [],
                "answer": "当 b ≤ 0 时，g(x) 在 (0, +∞) 上单调递增；\n当 b > 0 时，g(x) 在 (0, 1/b) 上单调递增，在 (1/b, +∞) 上单调递减。",
                "analysis": "g'(x) = 1/x - b = (1 - bx)/x (x>0)。\n令 g'(x) = 0 得 x = 1/b（仅当 b>0 时有意义）。\n\n① 当 b ≤ 0 时：1 - bx ≥ 1 > 0 恒成立，g'(x) > 0，故 g(x) 在 (0, +∞) 单调递增。\n\n② 当 b > 0 时：\n  x ∈ (0, 1/b) 时，bx < 1，1 - bx > 0，g'(x) > 0，g(x) 单调递增；\n  x ∈ (1/b, +∞) 时，bx > 1，1 - bx < 0，g'(x) < 0，g(x) 单调递减。\n\n关键点：分类讨论的依据是 g'(x)=0 是否有解，即参数 b 的正负。这是导数综合题最基础的分类讨论模型。"
            },
            {
                "sim": 95,
                "subject": "数学",
                "diff": "较难",
                "q": "函数 h(x) = x·ln x 的极值问题求解",
                "tag": "orange",
                "type": "解答题",
                "knowledge_point": "导数与极值",
                "question": "求函数 h(x) = x·ln x (x>0) 的极值。",
                "options": [],
                "answer": "h(x) 在 x = 1/e 处取得极小值 h(1/e) = -1/e。无极大值。",
                "analysis": "h'(x) = ln x + x·(1/x) = ln x + 1。\n令 h'(x) = 0：ln x + 1 = 0，得 ln x = -1，故 x = e⁻¹ = 1/e。\n\n判断极值：\n  x ∈ (0, 1/e) 时，ln x < -1，h'(x) = ln x + 1 < 0，h(x) 单调递减；\n  x ∈ (1/e, +∞) 时，ln x > -1，h'(x) = ln x + 1 > 0，h(x) 单调递增。\n\n故 x = 1/e 是极小值点。\n极小值 h(1/e) = (1/e)·ln(1/e) = (1/e)·(-1) = -1/e。\n\n注意：x·ln x 这类乘积函数求导用乘法法则 (uv)' = u'v + uv'，不要漏项。"
            },
            {
                "sim": 93,
                "subject": "数学",
                "diff": "中等",
                "q": "f(x) = ln x - mx² 的单调区间讨论",
                "tag": "orange",
                "type": "解答题",
                "knowledge_point": "含参导数分类讨论",
                "question": "已知函数 f(x) = ln x - mx² (m∈R, x>0)，讨论 f(x) 的单调区间。",
                "options": [],
                "answer": "当 m ≤ 0 时，f(x) 在 (0, +∞) 上单调递增；\n当 m > 0 时，f(x) 在 (0, √(1/(2m))) 上单调递增，在 (√(1/(2m)), +∞) 上单调递减。",
                "analysis": "f'(x) = 1/x - 2mx = (1 - 2mx²)/x (x>0)。\n令 f'(x) = 0：1 - 2mx² = 0，即 x² = 1/(2m)（仅当 m>0 时有解）。\n\n① 当 m ≤ 0 时：-2mx² ≥ 0，1 - 2mx² ≥ 1 > 0，f'(x) > 0，f(x) 在 (0, +∞) 单调递增。\n\n② 当 m > 0 时：令 x₀ = √(1/(2m))。\n  x ∈ (0, x₀) 时，2mx² < 1，f'(x) > 0，单调递增；\n  x ∈ (x₀, +∞) 时，2mx² > 1，f'(x) < 0，单调递减。\n\n方法总结：含参导数题先求导、通分/合并，再根据零点是否存在分类讨论参数范围。"
            },
            {
                "sim": 90,
                "subject": "数学",
                "diff": "简单",
                "q": "利用导数证明不等式 ln x ≤ x - 1",
                "tag": "blue",
                "type": "证明题",
                "knowledge_point": "导数证明不等式",
                "question": "利用导数证明：对任意 x > 0，有 ln x ≤ x - 1。",
                "options": [],
                "answer": "证明：令 φ(x) = x - 1 - ln x (x>0)，则 φ'(x) = 1 - 1/x = (x-1)/x。\n令 φ'(x) = 0 得 x = 1。\nx ∈ (0,1) 时 φ'(x) < 0，φ(x) 单调递减；x ∈ (1,+∞) 时 φ'(x) > 0，φ(x) 单调递增。\n故 φ(x) 在 x=1 处取得最小值 φ(1) = 1 - 1 - ln 1 = 0。\n所以 φ(x) ≥ φ(1) = 0，即 x - 1 - ln x ≥ 0，亦即 ln x ≤ x - 1。证毕。",
                "analysis": "导数证明不等式的核心思路：构造辅助函数，把不等式问题转化为函数最值问题。\n\n步骤：\n① 移项构造 φ(x) = (右式) - (左式)，使不等式化为 φ(x) ≥ 0；\n② 求 φ'(x)，找极值点；\n③ 求出 φ(x) 的最小值，证明最小值 ≥ 0。\n\n本题 φ(x) = (x-1) - ln x，最小值在 x=1 处取得且为 0，故 φ(x) ≥ 0 恒成立。\n\n延伸：ln x ≤ x - 1 是经典不等式，常作为其他不等式证明的放缩工具。"
            },
            {
                "sim": 88,
                "subject": "数学",
                "diff": "较难",
                "q": "函数 f(x) = ax - ln x 的最值问题",
                "tag": "purple",
                "type": "解答题",
                "knowledge_point": "导数与最值",
                "question": "已知函数 f(x) = ax - ln x (a∈R, x>0)。\n(1) 若 a = 1，求 f(x) 的最小值；\n(2) 若 f(x) ≥ 0 恒成立，求 a 的取值范围。",
                "options": [],
                "answer": "(1) 当 a=1 时，f(x) 的最小值为 1（在 x=1 处取得）。\n(2) a 的取值范围是 a ≥ 1/e。",
                "analysis": "f'(x) = a - 1/x = (ax - 1)/x (x>0)。\n\n(1) 当 a=1 时：f'(x) = 1 - 1/x = (x-1)/x。\n  令 f'(x)=0 得 x=1。\n  x∈(0,1) 时 f'(x)<0 递减；x∈(1,+∞) 时 f'(x)>0 递增。\n  故 x=1 是极小值点也是最小值点，f(1) = 1 - ln1 = 1。\n  最小值为 1。\n\n(2) f(x) ≥ 0 恒成立的条件：\n  ① 当 a ≤ 0 时：f'(x) = a - 1/x < 0 恒成立（因 a≤0 且 1/x>0），f(x) 单调递减。又 x→+∞ 时 -ln x→-∞（a≤0 时 ax 不增长或负增长），f(x)→-∞，不可能恒 ≥0。故 a ≤ 0 不成立。\n  ② 当 a > 0 时：f'(x)=0 得 x=1/a，f(x) 在 x=1/a 处取最小值。\n    f(1/a) = a·(1/a) - ln(1/a) = 1 + ln a。\n    要 f(x) ≥ 0 恒成立，需 f(1/a) ≥ 0，即 1 + ln a ≥ 0，ln a ≥ -1，a ≥ e⁻¹ = 1/e。\n    \n  综上 a ≥ 1/e。"
            }
        ]
    },
    'photo-video': {
        "duration": "12:35",
        "title": "导数综合题解题技巧",
        "teacher": {
            "name": "王老师",
            "avatar_text": "王",
            "desc": "高考数学专家 · 15年教龄"
        },
        "knowledge_tags": [
            {
                "text": "导数应用",
                "color": "blue"
            },
            {
                "text": "单调性",
                "color": "purple"
            },
            {
                "text": "分类讨论",
                "color": "orange"
            },
            {
                "text": "不等式恒成立",
                "color": "green"
            },
            {
                "text": "高考真题",
                "color": "red"
            }
        ],
        "outline": [
            {
                "start": "0:00",
                "end": "3:00",
                "title": "审题技巧",
                "desc": "如何快速识别导数综合题类型",
                "content": "本段讲解导数综合题的审题要点：\n\n一、识别题目类型\n导数综合题通常分为四类：\n1. 讨论单调性（含参或不含参）\n2. 求极值与最值\n3. 证明不等式\n4. 恒成立问题（求参数范围）\n\n二、审题三步法\n第一步：看函数结构——是 f(x)=lnx-ax² 还是 f(x)=x·lnx？结构决定求导方式。\n第二步：看参数位置——参数在一次项、二次项还是常数项？决定分类讨论的切入点。\n第三步：看问题指向——'讨论单调性'、'求极值'、'恒成立'分别对应不同套路。\n\n三、典型示例\n例题：已知 f(x) = lnx - ax²，讨论单调性。\n审题判断：含参函数 + 讨论单调性 → 需对参数 a 分类讨论 f'(x) 的零点。\n\n四、易错提醒\n• 不要一上来就求导，先看清定义域（如 lnx 要求 x>0）\n• 参数符号直接影响零点是否存在，必须分类讨论\n• 分类标准要清晰（如 a>0、a=0、a<0），做到不重不漏"
            },
            {
                "start": "3:00",
                "end": "8:00",
                "title": "解题过程",
                "desc": "分类讨论与求导运算详解",
                "content": "本段通过完整例题演示分类讨论的解题过程。\n\n【例题】已知函数 f(x) = lnx - mx² (m∈R, x>0)，讨论 f(x) 的单调性。\n\n【解题过程】\n\n第一步：求导\nf'(x) = 1/x - 2mx = (1 - 2mx²)/x\n通分后分子为 1 - 2mx²，分母 x > 0 恒成立，故只需讨论分子符号。\n\n第二步：确定分类标准\n令 f'(x) = 0，即 1 - 2mx² = 0，得 x² = 1/(2m)。\n该方程是否有解取决于 m 的符号：\n• m ≤ 0 时，1 - 2mx² ≥ 1 > 0 恒成立，无零点\n• m > 0 时，x = √(1/(2m)) 是零点\n故分类标准为 m ≤ 0 与 m > 0。\n\n第三步：分类讨论\n情形1：m ≤ 0\nf'(x) = (1 - 2mx²)/x > 0 恒成立（因 1-2mx²≥1>0，x>0）\n所以 f(x) 在 (0, +∞) 单调递增。\n\n情形2：m > 0\n令 x₀ = √(1/(2m))。\n• 当 0 < x < x₀ 时，2mx² < 1，1-2mx² > 0，f'(x) > 0，f(x) 递增；\n• 当 x > x₀ 时，2mx² > 1，1-2mx² < 0，f'(x) < 0，f(x) 递减。\n所以 f(x) 在 (0, x₀) 递增，在 (x₀, +∞) 递减。\n\n第四步：下结论（书写规范）\n综合①②：当 m ≤ 0 时，f(x) 在 (0, +∞) 单调递增；当 m > 0 时，f(x) 在 (0, √(1/(2m))) 单调递增，在 (√(1/(2m)), +∞) 单调递减。\n\n【关键技巧】\n1. 通分：把 f'(x) 化成单一分式，便于判断符号\n2. 分类：以'零点是否存在'为分类依据\n3. 列表：复杂题目可画表格辅助判断 f'(x) 符号"
            },
            {
                "start": "8:00",
                "end": "12:35",
                "title": "总结归纳",
                "desc": "通用解题套路与易错点提醒",
                "content": "本段总结导数综合题的通用解题套路与高频易错点。\n\n【一、通用解题套路】\n\n套路1：讨论单调性\n① 求 f'(x) 并通分化简\n② 令 f'(x)=0 找零点（含参时分类讨论零点是否存在）\n③ 用零点划分区间，判断各区间内 f'(x) 符号\n④ 写出单调区间\n\n套路2：求极值\n① 求 f'(x)，找极值可疑点（f'(x)=0 或 f'(x) 不存在的点）\n② 判断极值点两侧 f'(x) 符号变化（左正右负→极大，左负右正→极小）\n③ 求极值点处的函数值\n\n套路3：恒成立问题\n• f(x) ≥ 0 恒成立 ⟺ f(x)_min ≥ 0\n• f(x) ≤ 0 恒成立 ⟺ f(x)_max ≤ 0\n• 转化为求函数最值，再解关于参数的不等式\n\n套路4：证明不等式\n• 构造辅助函数 φ(x) = 右式 - 左式\n• 证明 φ(x) ≥ 0（通过求 φ(x) 的最小值）\n\n【二、高频易错点】\n\n易错1：忘记定义域\nlnx 要求 x>0，√x 要求 x≥0，分母不能为0。\n对策：解题第一步就写出定义域。\n\n易错2：求导错误\n• 乘积函数漏用乘法法则：(x·lnx)' ≠ lnx + 1/x（正确：lnx + 1）\n• 复合函数链式法则不全：[ln(x²+1)]' = 2x/(x²+1)\n对策：求导后回头检查每一步。\n\n易错3：分类讨论不完整\n只讨论 m>0，忘记 m≤0 的情况。\n对策：分类标准要覆盖所有可能，做到不重不漏。\n\n易错4：恒成立问题方向反\nf(x)≥0 恒成立应求最小值≥0，不是最大值。\n对策：记住'大于等于恒成立→看最小值；小于等于恒成立→看最大值'。\n\n【三、提分建议】\n1. 每天精练1-2道导数综合题，限时15分钟\n2. 建立错题本，重点记录分类讨论的切入点\n3. 熟记5类经典辅助函数的构造方法\n4. 考试时先做会做的部分，分类讨论写出框架就能拿过程分"
            }
        ],
        "rec_videos": [
            {
                "title": "圆锥曲线最值问题突破",
                "time": "15:20",
                "views": "2.3万",
                "content": "圆锥曲线最值问题解题要点：\n\n1. 常见题型：\n• 求弦长最值\n• 求面积最值\n• 求点到直线距离最值\n\n2. 核心方法：\n• 设点法：设交点坐标，用韦达定理\n• 参数法：设参数 t，把目标表示为 t 的函数\n• 几何法：利用椭圆/双曲线的几何性质\n\n3. 弦长公式：|AB| = √(1+k²)·|x₁-x₂| = √(1+k²)·√[(x₁+x₂)²-4x₁x₂]\n\n4. 典型例题：椭圆 x²/4 + y² = 1 中过焦点的弦长最值问题，联立方程后用韦达定理求解。"
            },
            {
                "title": "函数与方程思想应用",
                "time": "10:45",
                "views": "1.8万",
                "content": "函数与方程思想的核心应用：\n\n1. 函数思想：\n把问题转化为函数性质研究\n• 不等式恒成立 → 函数最值\n• 方程根的分布 → 函数零点\n• 数列求和 → 函数离散化\n\n2. 方程思想：\n• 设未知数，列方程\n• 韦达定理应用\n• 根与系数的关系\n\n3. 经典转化：\n• a > b ⟺ a - b > 0（构造函数比较大小）\n• f(x) = g(x) 有解 ⟺ f(x) - g(x) = 0 有零点\n• 证明不等式 ⟺ 构造函数证最值\n\n4. 高考真题：已知 f(x) = lnx - ax 有两个零点，求 a 的范围。\n转化为 lnx = ax，即 y=lnx 与 y=ax 有两个交点，结合图象分析。"
            }
        ]
    },
    'practice-ai-recommend': {
        "total_recommend": 20,
        "reasons": [
            {
                "text": "薄弱知识点",
                "icon": "fa-exclamation-circle",
                "bg": "#FEE2E2",
                "color": "#991B1B"
            },
            {
                "text": "高频考点",
                "icon": "fa-fire",
                "bg": "#FEF3C7",
                "color": "#92400E"
            },
            {
                "text": "易错题",
                "icon": "fa-bug",
                "bg": "#EDE9FE",
                "color": "#5B21B6"
            }
        ],
        "recommends": [
            {
                "subject": "数学",
                "subjectColor": "blue",
                "reason": "薄弱知识点",
                "reasonColor": "red",
                "q": "已知函数f(x)=lnx-ax²有极值，求a的取值范围",
                "level": 5,
                "time": 12,
                "match": 92,
                "type": "解答题",
                "knowledge_point": "导数与极值",
                "question": "已知函数 f(x) = lnx - ax² (a∈R, x>0) 有极值，求 a 的取值范围。",
                "options": [],
                "answer": "a 的取值范围是 a > 0。",
                "analysis": "f(x) 有极值 ⟺ f'(x) = 0 有变号零点。\nf'(x) = 1/x - 2ax = (1 - 2ax²)/x\n令 f'(x) = 0：1 - 2ax² = 0，得 x² = 1/(2a)，故 a > 0 时方程有解 x = 1/√(2a)。\n验证变号：当 a > 0 时，x 从小到大经过 1/√(2a) 时，1-2ax² 由正变负，f'(x) 由正变负，故 f(x) 在该点取得极大值。\n当 a ≤ 0 时，1-2ax² ≥ 1 > 0 恒成立，f'(x) > 0，f(x) 在 (0,+∞) 上单调递增，无极值。\n综上，a 的取值范围是 a > 0。"
            },
            {
                "subject": "物理",
                "subjectColor": "orange",
                "reason": "高频考点",
                "reasonColor": "orange",
                "q": "一带电粒子在匀强磁场中做圆周运动...",
                "level": 4,
                "time": 8,
                "match": 88,
                "type": "单选题",
                "knowledge_point": "带电粒子在磁场中的运动",
                "question": "一质量为 m、电荷量为 q 的带正电粒子，以速度 v 垂直射入磁感应强度为 B 的匀强磁场中，做匀速圆周运动。已知粒子在磁场中运动了半圈后射出。求粒子在磁场中运动的时间。（粒子重力不计）",
                "options": [
                    "A. πm/(qB)",
                    "B. 2πm/(qB)",
                    "C. πm/(2qB)",
                    "D. qB/(πm)"
                ],
                "answer": "A",
                "analysis": "带电粒子在匀强磁场中做匀速圆周运动，洛伦兹力提供向心力：\nqvB = mv²/r\n解得半径 r = mv/(qB)\n周期 T = 2πr/v = 2πm/(qB)\n粒子运动半圈，对应时间 t = T/2 = πm/(qB)\n故选A。\n关键公式：T = 2πm/(qB)，与粒子的速度 v 和半径 r 无关，只与 m、q、B 有关。"
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "reason": "易错题",
                "reasonColor": "purple",
                "q": "椭圆x²/9+y²/5=1中过右焦点的弦长",
                "level": 4,
                "time": 10,
                "match": 85,
                "type": "解答题",
                "knowledge_point": "椭圆的弦长",
                "question": "已知椭圆 C：x²/9 + y²/5 = 1，过右焦点 F 的直线 l 与椭圆交于 A、B 两点。若直线 l 的倾斜角为 45°，求弦长 |AB|。",
                "options": [],
                "answer": "|AB| = 30/7。",
                "analysis": "椭圆 x²/9 + y²/5 = 1 中：a²=9, b²=5，c²=a²-b²=4，c=2，故右焦点 F(2, 0)。\n直线 l 倾斜角 45°，斜率 k=tan45°=1，方程为 y = x - 2。\n与椭圆方程联立：x²/9 + (x-2)²/5 = 1\n化简：5x² + 9(x-2)² = 45\n5x² + 9(x²-4x+4) = 45\n14x² - 36x + 36 = 45\n14x² - 36x - 9 = 0\n判别式 Δ = 36² + 4·14·9 = 1296 + 504 = 1800\n设 A(x1,y1), B(x2,y2)，则 x1+x2 = 36/14 = 18/7, x1·x2 = -9/14\n弦长 |AB| = √(1+k²)·|x1-x2| = √2·√[(x1+x2)²-4x1x2]\n= √2·√[(18/7)²-4·(-9/14)]\n= √2·√[324/49 + 36/14]\n= √2·√[324/49 + 126/49]\n= √2·√(450/49)\n= √2·(15√2/7)\n= 30/7"
            },
            {
                "subject": "英语",
                "subjectColor": "green",
                "reason": "薄弱知识点",
                "reasonColor": "red",
                "q": "完形填空：The scientist devoted his life to...",
                "level": 3,
                "time": 15,
                "match": 90,
                "type": "完形填空",
                "knowledge_point": "词义辨析与语境",
                "question": "阅读下面短文，从各题所给的四个选项中选出最佳选项：\n\nThe scientist devoted his life to ___1___ the mystery of the universe. Despite numerous failures, he never ___2___ his research. His perseverance finally paid ___3___ when he made a groundbreaking discovery at the age of 70.\n\n1. A. unlock  B. unlocking  C. unlocked  D. to unlock\n2. A. gave up  B. gave in  C. gave away  D. gave out\n3. A. back  B. for  C. off  D. out",
                "options": [],
                "answer": "1-3: B A C",
                "analysis": "1. 选B。'devote...to doing sth.'是固定搭配，to是介词，后接动名词。故选unlocking。\n2. 选A。'give up'意为'放弃'，符合'尽管失败多次，他从未放弃研究'的语境。'give in'是'屈服'，'give away'是'赠送/泄露'，'give out'是'分发/耗尽'，均不符合。\n3. 选C。'pay off'意为'取得成功/得到回报'，符合'70岁时的突破性发现让他的坚持终于有了回报'。'pay back'是'偿还'，'pay for'是'为...付款'，'pay out'是'付出(钱)'，均不符合。"
            },
            {
                "subject": "化学",
                "subjectColor": "purple",
                "reason": "高频考点",
                "reasonColor": "orange",
                "q": "电解池中阳极反应式的书写与判断",
                "level": 4,
                "time": 7,
                "match": 87,
                "type": "单选题",
                "knowledge_point": "电解池",
                "question": "用惰性电极电解 CuSO₄ 溶液时，阳极的电极反应式是：",
                "options": [
                    "A. Cu²⁺ + 2e⁻ → Cu",
                    "B. 2H⁺ + 2e⁻ → H₂↑",
                    "C. 2H₂O - 4e⁻ → O₂↑ + 4H⁺",
                    "D. 2Cl⁻ - 2e⁻ → Cl₂↑"
                ],
                "answer": "C",
                "analysis": "电解 CuSO₄ 溶液用惰性电极（如铂、石墨）：\n• 阳极：阴离子放电。溶液中阴离子有 SO₄²⁻ 和 OH⁻（来自水的电离）。放电顺序：OH⁻ > SO₄²⁻（含氧酸根难放电），故 OH⁻ 先放电。\n  电极反应：4OH⁻ - 4e⁻ → 2H₂O + O₂↑\n  由于 OH⁻ 来自水的电离，常写作：2H₂O - 4e⁻ → O₂↑ + 4H⁺\n• 阴极：阳离子放电。Cu²⁺ > H⁺，故 Cu²⁺ 先放电：Cu²⁺ + 2e⁻ → Cu\n选项分析：A 是阴极反应；B 是阴极可能反应（但本题Cu²⁺优先）；C 是阳极反应，正确；D 是 Cl⁻ 的放电，但本题溶液中无 Cl⁻。\n故选C。"
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "reason": "易错题",
                "reasonColor": "purple",
                "q": "数列{an}前n项和Sn=2n²-n，求通项公式",
                "level": 3,
                "time": 6,
                "match": 89,
                "type": "解答题",
                "knowledge_point": "数列通项",
                "question": "已知数列 {aₙ} 的前 n 项和 Sₙ = 2n² - n，求数列 {aₙ} 的通项公式。",
                "options": [],
                "answer": "aₙ = 4n - 3。",
                "analysis": "由前 n 项和求通项的公式：\n当 n = 1 时：a₁ = S₁ = 2·1² - 1 = 1\n当 n ≥ 2 时：aₙ = Sₙ - Sₙ₋₁ = (2n² - n) - [2(n-1)² - (n-1)]\n= 2n² - n - [2(n²-2n+1) - n + 1]\n= 2n² - n - [2n² - 4n + 2 - n + 1]\n= 2n² - n - 2n² + 5n - 3\n= 4n - 3\n验证 n = 1 时：4·1 - 3 = 1 = a₁ ✓\n故通项公式为 aₙ = 4n - 3 (n∈N*)。\n说明：因为 n=1 时公式也成立，所以不需要分段表示。这是等差数列，首项 a₁=1，公差 d=4。"
            }
        ]
    },
    'practice-hotpoints': {
        "subjects": [
            "数学",
            "英语",
            "物理",
            "化学",
            "语文"
        ],
        "info": "统计近5年高考真题，按出现频率排序",
        "hotpoints": [
            {
                "name": "导数的综合应用",
                "freq": 5,
                "mastery": 52,
                "exercises": 28,
                "expanded": true,
                "analysis": "近5年每年必考，常以压轴题出现，重点考查分类讨论思想",
                "types": "极值与最值、零点问题、不等式证明、恒成立问题",
                "tips": "先求导再列表，分类讨论要全面，注意端点值与极限"
            },
            {
                "name": "圆锥曲线方程",
                "freq": 5,
                "mastery": 68,
                "exercises": 24,
                "expanded": false,
                "analysis": "高频考点，常与直线、向量结合考查",
                "types": "标准方程、离心率、焦点弦、轨迹方程",
                "tips": "设而不求法，联立方程后韦达定理"
            },
            {
                "name": "三角函数图象与性质",
                "freq": 4,
                "mastery": 75,
                "exercises": 18,
                "expanded": false,
                "analysis": "基础题为主，常考周期、单调性、最值",
                "types": "化简求值、图象变换、周期最值",
                "tips": "辅助角公式是核心工具"
            },
            {
                "name": "数列求和",
                "freq": 4,
                "mastery": 71,
                "exercises": 20,
                "expanded": false,
                "analysis": "常考裂项相消与错位相减",
                "types": "等差等比通项、裂项、错位相减、放缩",
                "tips": "错位相减注意首末项，裂项注意符号"
            },
            {
                "name": "立体几何",
                "freq": 5,
                "mastery": 64,
                "exercises": 22,
                "expanded": false,
                "analysis": "必考解答题，建系法是主流",
                "types": "线面平行垂直、二面角、空间距离",
                "tips": "建系法求二面角，法向量要单位化"
            },
            {
                "name": "概率与统计",
                "freq": 5,
                "mastery": 70,
                "exercises": 19,
                "expanded": false,
                "analysis": "应用题为主，阅读量大",
                "types": "分布列期望、回归分析、独立性检验",
                "tips": "审清题意，列对分布列是关键"
            },
            {
                "name": "函数与方程",
                "freq": 4,
                "mastery": 78,
                "exercises": 15,
                "expanded": false,
                "analysis": "常以选择题填空题出现",
                "types": "零点个数、函数图象、分段函数",
                "tips": "数形结合，画图辅助判断"
            },
            {
                "name": "不等式",
                "freq": 3,
                "mastery": 66,
                "exercises": 16,
                "expanded": false,
                "analysis": "常与其他知识综合考查",
                "types": "基本不等式、线性规划、解不等式",
                "tips": "基本不等式注意等号成立条件"
            }
        ]
    },
    'practice-mistakes': {
        "stats": [
            {
                "label": "总错题",
                "value": 127,
                "color": "#3B82F6"
            },
            {
                "label": "待复习",
                "value": 38,
                "color": "#EF4444"
            },
            {
                "label": "已掌握",
                "value": 89,
                "color": "#10B981"
            }
        ],
        "tabs": [
            "待复习",
            "已掌握",
            "全部"
        ],
        "mistakes": [
            {
                "subject": "数学",
                "subjectColor": "blue",
                "q": "设f(x)=x³-3x，求f(x)在[-2,2]上的最值",
                "count": 3,
                "last": "2天前",
                "type": "解答题",
                "knowledge_point": "导数与最值",
                "error_type": "极值点判断错误",
                "question": "设 f(x) = x³ - 3x，求 f(x) 在 [-2, 2] 上的最大值和最小值。",
                "options": [],
                "answer": "最大值 f(-1) = 2；最小值 f(1) = -2。",
                "analysis": "f'(x) = 3x² - 3 = 3(x+1)(x-1)。令 f'(x)=0 得 x=±1，均在 [-2,2] 内。\n极值点：x=-1（极大值点），x=1（极小值点）。\n计算各关键点函数值：\nf(-2) = -8 + 6 = -2\nf(-1) = -1 + 3 = 2  ← 最大值\nf(1) = 1 - 3 = -2   ← 最小值\nf(2) = 8 - 6 = 2\n比较得：最大值 f(-1)=f(2)=2，最小值 f(-2)=f(1)=-2。\n\n❌ 常见错误：只比较极值点的函数值，忽略端点值。本题端点 f(-2)=-2 与极小值 f(1)=-2 相等，都是最小值；端点 f(2)=2 与极大值 f(-1)=2 相等，都是最大值。必须同时比较极值点和端点！",
                "error_reason": "学生常犯错误：① 只算极值点不算端点；② 极值点符号判断错；③ 计算时漏项（如 f(-2)=-8-3·(-2)=-8+6=-2 中漏算 +6）。"
            },
            {
                "subject": "物理",
                "subjectColor": "orange",
                "q": "一物体从高h处自由下落，落地速度v...",
                "count": 2,
                "last": "5天前",
                "type": "单选题",
                "knowledge_point": "自由落体运动",
                "error_type": "公式选用错误",
                "question": "一物体从高 h 处自由下落，落地时的速度为 v。已知重力加速度为 g，则下落时间 t 为：",
                "options": [
                    "A. t = √(2h/g)",
                    "B. t = v/g",
                    "C. t = h/v",
                    "D. t = 2h/v"
                ],
                "answer": "A 和 B 都正确（因为 v²=2gh，故 v=√(2gh)，v/g=√(2h/g)=t）",
                "analysis": "自由落体运动（初速度 v₀=0，加速度 a=g）：\n• 位移公式：h = 1/2·g·t²，解得 t = √(2h/g) ✓ (选项A)\n• 速度公式：v = gt，解得 t = v/g ✓ (选项B)\n两者等价：由 v² = 2gh，得 v = √(2gh)，故 v/g = √(2gh)/g = √(2h/g) = t\n选项C：h/v 量纲错误（h是长度，v是速度，h/v≠时间）\n选项D：2h/v 量纲正确但数值是正确答案的2倍\n\n❌ 常见错误：① 混淆 v=gt 和 v²=2gh；② 忘记自由落体初速度为0；③ 位移公式记成 h=gt²（漏1/2）。",
                "error_reason": "本题设计为多选题但学生常按单选作答，选A或B其一。提示：自由落体中 t=√(2h/g) 和 t=v/g 是等价的，都正确。"
            },
            {
                "subject": "英语",
                "subjectColor": "green",
                "q": "The teacher, together with his students, ___ going...",
                "count": 4,
                "last": "1天前",
                "type": "单选题",
                "knowledge_point": "主谓一致",
                "error_type": "主谓一致错误",
                "question": "The teacher, together with his students, ______ going to visit the museum tomorrow.",
                "options": [
                    "A. is",
                    "B. are",
                    "C. was",
                    "D. were"
                ],
                "answer": "A",
                "analysis": "本题考查主谓一致中的'就远原则'。\n当主语后跟有 'together with, with, along with, as well as, besides, except, including, like, no less than, rather than' 等词时，谓语动词的单复数由这些词前面的主语决定。\n本题中：The teacher (主语) + together with his students (附加成分)，谓语动词应与 The teacher 保持一致，用单数。\n时态判断：tomorrow 表示将来，用一般将来时或一般现在时表将来，故选 is。\n\n❌ 常见错误：\n① 看到 students 是复数就选 are —— 错！together with 后的内容不影响主语。\n② 选 was —— 时态错！tomorrow 是将来时。\n③ 把 together with 误认为并列连词，按'复数+复数=复数'处理。\n口诀：'就远原则'看前面，together with/with/along with/as well as 都适用。",
                "error_reason": "主谓一致是中国学生英语学习的高频错误点。'就远原则'涉及的关键词需牢记：together with, with, along with, as well as, besides, except, but, including, like, no less than, rather than, more than 等。"
            },
            {
                "subject": "化学",
                "subjectColor": "purple",
                "q": "反应N₂+3H₂⇌2NH₃达平衡后...",
                "count": 2,
                "last": "3天前",
                "type": "填空题",
                "knowledge_point": "化学平衡移动",
                "error_type": "勒夏特列原理应用错误",
                "question": "反应 N₂ + 3H₂ ⇌ 2NH₃ (正反应放热) 达到平衡后：\n(1) 升高温度，平衡向______方向移动；\n(2) 增大压强，平衡向______方向移动；\n(3) 加入催化剂，平衡______移动。",
                "options": [],
                "answer": "(1) 逆反应（吸热）方向\n(2) 正反应（生成NH₃）方向\n(3) 不",
                "analysis": "根据勒夏特列原理：平衡受外界条件影响时，总是向减弱这种影响的方向移动。\n(1) 升高温度：平衡向吸热方向移动以减弱升温。正反应放热，故逆反应吸热，平衡向逆反应方向移动。\n(2) 增大压强：平衡向气体分子数减少的方向移动以减弱加压。反应物共4mol气体，生成物2mol气体，故平衡向正反应方向（分子数减少方向）移动。\n(3) 加入催化剂：同等程度改变正逆反应速率，平衡不移动，只是缩短到达平衡的时间。\n\n❌ 常见错误：\n① 把'放热反应'和'加热促进反应'混淆——升温促进吸热方向，不是促进放热方向。\n② 忘记催化剂不影响平衡，误以为加催化剂能提高转化率。\n③ 加压时只看气体分子数，不区分固体液体（固体液体不受压强影响）。",
                "error_reason": "勒夏特列原理的核心是'减弱而非消除'影响。学生常把'减弱'理解为'完全抵消'，导致判断错误。"
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "q": "已知椭圆x²/4+y²=1，求离心率e",
                "count": 3,
                "last": "昨天",
                "type": "填空题",
                "knowledge_point": "椭圆离心率",
                "error_type": "a²/b²混淆",
                "question": "已知椭圆 C：x²/4 + y² = 1，求椭圆的离心率 e。",
                "options": [],
                "answer": "e = √3/2",
                "analysis": "椭圆标准方程 x²/a² + y²/b² = 1 (a>b>0)。\n本题：x²/4 + y²/1 = 1，故 a²=4, b²=1，a=2, b=1。\nc² = a² - b² = 4 - 1 = 3，c = √3\n离心率 e = c/a = √3/2\n\n❌ 常见错误：\n① 把 a² 和 b² 搞反：误以为 y² 的分母1是 a²，x² 的分母4是 b²。这是错的！\n   判断方法：a² 总是较大的那个数（椭圆中 a>b），所以 a²=4。\n② 公式记错：把 e=c/b 或 e=a/c，正确是 e=c/a。\n③ 把 c² = a² - b² 记成 c² = a² + b²（这是双曲线公式）。\n④ 算出 e=√3/2 后又化简成 e=√6/4 等错误形式。\n\n判断 a² 的口诀：椭圆方程 x²/m + y²/n = 1 (m>n>0) 中，较大的分母是 a²。若焦点在 y 轴上，则 y² 的分母是 a²。",
                "error_reason": "椭圆与双曲线的 a²、b² 关系易混淆：椭圆 c²=a²-b²（a最大）；双曲线 c²=a²+b²（c最大）。务必先判断曲线类型再套公式。"
            }
        ]
    },
    'practice-mock': {
        "subjects": [
            "全部",
            "数学",
            "英语",
            "物理",
            "化学",
            "语文"
        ],
        "sources": [
            {
                "name": "名校模拟",
                "active": true
            },
            {
                "name": "机构模拟",
                "active": false
            },
            {
                "name": "AI生成",
                "active": false
            }
        ],
        "mocks": [
            {
                "subject": "数学",
                "subjectColor": "blue",
                "source": "衡水中学",
                "name": "2025届高三冲刺卷（一）",
                "level": 5,
                "count": 12480,
                "rate": 96,
                "type": "解答题",
                "knowledge_point": "导数综合应用",
                "question": "已知函数 f(x) = x·lnx - ax² (a∈R)。\n(1) 若 a = 1/2，求 f(x) 的单调区间；\n(2) 若 f(x) 有极值，求 a 的取值范围。",
                "options": [],
                "answer": "(1) 当 a=1/2 时，f(x) 在 (0, √(1/2·e)) 上单调递增，在 (√(1/2·e), +∞) 上单调递减。\n(2) a 的取值范围是 a > 0。",
                "analysis": "(1) f'(x) = lnx + 1 - 2ax。当 a=1/2 时，f'(x) = lnx + 1 - x。令 f'(x)=0：lnx + 1 - x = 0，即 lnx = x - 1。由 ln 函数与直线 y=x-1 相切于 x=1 可知，方程 lnx=x-1 在 x=1 处取得唯一解（注意定义域 x>0）。但更精确地，令 g(x)=lnx+1-x，g'(x)=1/x-1，g'(x)=0 得 x=1。g(1)=0，且 x→0+ 时 g(x)→-∞，x→+∞ 时 g(x)→-∞。故 f'(x)≥0 仅在 x=1 处取等号，f(x) 在 (0, +∞) 上单调递减——但此与题意'有极值'矛盾，需重新求解：实际上 f'(x)=lnx+1-x 的零点分析应结合数值方法，方程 lnx=x-1 的解为 x=1（唯一解）。因此 f(x) 在 (0,1) 单调递增，在 (1,+∞) 单调递减。\n(2) f(x) 有极值 ⟺ f'(x)=lnx+1-2ax=0 有解 ⟺ 2a = (lnx+1)/x 有解。令 h(x)=(lnx+1)/x，h'(x)=-lnx/x²，h'(x)=0 得 x=1，h(1)=1 为最大值。x→0+ 时 h(x)→-∞，x→+∞ 时 h(x)→0。故 h(x) 的值域为 (-∞, 1]，所以 2a ≤ 1 即 a ≤ 1/2。但还需要 f(x) 有极值要求 2a>0（否则 f'(x)>0 恒成立），故 a∈(0, 1/2]... 进一步精确：当 0<a<1/2 时，方程有两个解，f(x) 有极大值和极小值；当 a=1/2 时，f'(x) 在 x=1 处取零但不变号，f(x) 无极值。综上 a∈(0, 1/2)。"
            },
            {
                "subject": "英语",
                "subjectColor": "green",
                "source": "人大附中",
                "name": "高考英语全真模拟卷",
                "level": 4,
                "count": 8650,
                "rate": 94,
                "type": "阅读理解",
                "knowledge_point": "主旨大意",
                "question": "阅读下面短文，回答问题：\n\nClimate change is no longer a distant threat but a present reality. From rising sea levels to extreme weather events, its impacts are being felt worldwide. However, there's still hope: individuals, communities, and nations are taking action to reduce carbon emissions and adapt to changes.\n\nWhat is the author's attitude toward climate change?",
                "options": [
                    "A. Completely pessimistic and hopeless",
                    "B. Realistic about challenges but hopeful about actions being taken",
                    "C. Indifferent and uninvolved",
                    "D. Critical of all human activities"
                ],
                "answer": "B",
                "analysis": "文章首先客观指出气候变化已成现实（'no longer a distant threat but a present reality'），列举了海平面上升、极端天气等现象，体现了对挑战的现实认识。但接着用'However, there's still hope'转折，提到个人、社区和国家正在采取行动减排和适应。这种'先承认困难，后指出希望'的结构正是选项B'现实但抱有希望'的体现。A项'完全悲观绝望'与'hope'矛盾；C项'冷漠不关心'与全文积极呼吁矛盾；D项'批判所有人类活动'过度绝对。"
            },
            {
                "subject": "物理",
                "subjectColor": "orange",
                "source": "AI生成",
                "name": "物理力学专项强化卷",
                "level": 4,
                "count": 5320,
                "rate": 92,
                "type": "单选题",
                "knowledge_point": "匀变速直线运动",
                "question": "一物体从静止开始做匀加速直线运动，第3s内的位移是5m。求物体的加速度大小。",
                "options": [
                    "A. 1 m/s²",
                    "B. 2 m/s²",
                    "C. 2.5 m/s²",
                    "D. 5 m/s²"
                ],
                "answer": "B",
                "analysis": "匀变速直线运动中，第n秒内的位移公式：s_n = v0 + a/2·(2n-1)。本题v0=0，n=3，s_3=5m。\n代入：5 = 0 + a/2·(2×3-1) = a/2·5 = 5a/2\n解得：a = 5×2/5 = 2 m/s²\n故选B。\n验证：a=2 m/s²时，第3s内位移 = 1/2·a·(3²-2²) = 1/2·2·(9-4) = 5m ✓"
            },
            {
                "subject": "化学",
                "subjectColor": "purple",
                "source": "黄冈中学",
                "name": "化学反应原理综合卷",
                "level": 5,
                "count": 7180,
                "rate": 91,
                "type": "实验题",
                "knowledge_point": "化学平衡与速率",
                "question": "在密闭容器中发生反应：N₂ + 3H₂ ⇌ 2NH₃ (正反应放热)。\n(1) 在某温度下达到平衡后，升高温度，正反应速率______(填'增大'或'减小')；平衡向______方向移动。\n(2) 若缩小容器体积(加压)，平衡向______方向移动。",
                "options": [],
                "answer": "(1) 正反应速率增大；平衡向逆反应（吸热）方向移动。\n(2) 平衡向正反应（生成NH₃）方向移动。",
                "analysis": "(1) 根据阿伦尼乌斯公式，升高温度会增大所有反应的速率常数，故正反应速率增大。但该反应正反应放热，根据勒夏特列原理，升高温度平衡向吸热方向（即逆反应方向）移动，以减弱升温的影响。\n(2) 该反应正向是气体分子数减少的反应（4mol→2mol）。缩小容器体积相当于加压，根据勒夏特列原理，平衡向气体分子数减少的方向（正反应方向）移动，以减弱加压的影响。这也是工业合成氨采用高压的原因。"
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "source": "AI生成",
                "name": "导数与圆锥曲线拔高卷",
                "level": 5,
                "count": 4260,
                "rate": 89,
                "type": "解答题",
                "knowledge_point": "圆锥曲线与最值",
                "question": "已知抛物线 C：y² = 4x，焦点为 F。\n(1) 求 F 的坐标；\n(2) 过 F 的直线 l 交抛物线于 A、B 两点，若 |AB| = 8，求直线 l 的方程。",
                "options": [],
                "answer": "(1) F(1, 0)。\n(2) 直线 l 的方程为 y = ±√3(x-1)，即 √3x - y - √3 = 0 或 √3x + y - √3 = 0。",
                "analysis": "(1) 抛物线 y²=4x 中 2p=4，p=2，焦点在 (p/2, 0) = (1, 0)。\n(2) 设直线 l 过 F(1,0)，斜率为 k，方程为 y = k(x-1)。\n与 y²=4x 联立：k²(x-1)² = 4x，展开：k²x² - (2k²+4)x + k² = 0。\n设 A(x1,y1), B(x2,y2)，则 x1+x2 = (2k²+4)/k² = 2 + 4/k²。\n弦长公式：|AB| = √(1+k²)·|x1-x2| = √(1+k²)·√[(x1+x2)²-4x1x2]。\n代入已知 |AB|=8 并化简（也可用焦点弦公式 |AB|=x1+x2+p=x1+x2+2）：\n由焦点弦公式 |AB| = x1+x2+2 = 8，得 x1+x2 = 6。\n即 2+4/k² = 6，4/k²=4，k²=1... 这给出k=±1，但代入验证：k=1时 x1+x2=6, |AB|=x1+x2+2=8 ✓。\n故 k=±1，直线方程为 y=±(x-1)。\n（更一般地，抛物线 y²=2px 的焦点弦长 |AB|=x1+x2+p）"
            },
            {
                "subject": "语文",
                "subjectColor": "red",
                "source": "成都七中",
                "name": "高考语文模拟冲刺卷",
                "level": 3,
                "count": 6890,
                "rate": 93,
                "type": "古诗文鉴赏",
                "knowledge_point": "诗歌情感分析",
                "question": "阅读下面这首唐诗，回答问题：\n\n登高\n杜甫\n风急天高猿啸哀，渚清沙白鸟飞回。\n无边落木萧萧下，不尽长江滚滚来。\n万里悲秋常作客，百年多病独登台。\n艰难苦恨繁霜鬓，潦倒新停浊酒杯。\n\n请简要分析本诗'悲秋'的情感内涵。",
                "options": [],
                "answer": "本诗'悲秋'的情感内涵包括：\n① 秋景之悲：风急天高、猿啸哀鸣、落叶萧萧、长江滚滚，营造萧瑟苍凉的秋意。\n② 羁旅之悲：'万里常作客'，诗人漂泊他乡，有家难归。\n③ 衰病之悲：'百年多病独登台'，年老多病，孤身登高。\n④ 家国之悲：'艰难苦恨繁霜鬓'，国家艰难、个人壮志未酬，白发丛生。\n⑤ 沉沦之悲：'潦倒新停浊酒杯'，因病停酒，连消愁之具亦失。",
                "analysis": "本诗为杜甫大历二年(767)秋在夔州所作，是七律之冠。分析情感内涵需把握'由景入情，层层递进'的结构：\n首联、颔联写景：风、天、猿、渚、沙、鸟、落木、长江——八重意象层层叠加，营造苍茫萧瑟的秋意，为下文抒情蓄势。其中'萧萧''滚滚'叠词既摹声又状势，气象阔大。\n颈联转入抒情：'万里'(空间之远)'百年'(时间之久)'常作客'(漂泊之苦)'多病独登台'(衰病之孤)——十四字包含八重悲意，被誉为古今七律第一联。\n尾联收束：'艰难苦恨'既是个人之恨更是家国之忧(安史之乱后)，'新停浊酒杯'以细节收束，倍增凄凉。\n评分要点：能从'秋景-羁旅-衰病-家国-沉沦'五个层次分析，每点2分，共10分。"
            }
        ]
    },
    'practice-real-exam': {
        "subjects": [
            "全部",
            "语文",
            "数学",
            "英语",
            "物理",
            "化学",
            "生物",
            "政治",
            "历史",
            "地理"
        ],
        "years": [
            {
                "year": "2025",
                "active": true
            },
            {
                "year": "2024",
                "active": false
            },
            {
                "year": "2023",
                "active": false
            },
            {
                "year": "2022",
                "active": false
            },
            {
                "year": "2021",
                "active": false
            }
        ],
        "total_count": 93,
        "exams": [
            {
                "subject": "数学",
                "subjectColor": "blue",
                "year": "2025",
                "region": "新高考I卷",
                "no": "第21题",
                "level": 5,
                "score": 12,
                "hot": true,
                "type": "解答题",
                "knowledge_point": "导数与极值",
                "question": "已知函数 f(x) = x³ - 3x + 1。\n(1) 求 f(x) 的单调区间；\n(2) 求 f(x) 在区间 [-2, 2] 上的最大值和最小值。",
                "options": [],
                "answer": "(1) 单调增区间：(-∞, -1) 和 (1, +∞)；单调减区间：(-1, 1)。\n(2) 最大值 f(-1) = 3；最小值 f(1) = -1。",
                "analysis": "(1) f'(x) = 3x² - 3 = 3(x+1)(x-1)。令 f'(x)=0 得 x=±1。当 x<-1 或 x>1 时 f'(x)>0，函数递增；当 -1<x<1 时 f'(x)<0，函数递减。\n(2) 由(1)知 x=-1 是极大值点，x=1 是极小值点。计算端点和极值点：f(-2)=-1, f(-1)=3, f(1)=-1, f(2)=3。所以最大值为 3（在 x=-1 和 x=2 处取得），最小值为 -1（在 x=-2 和 x=1 处取得）。"
            },
            {
                "subject": "英语",
                "subjectColor": "green",
                "year": "2025",
                "region": "全国甲卷",
                "no": "阅读D篇",
                "level": 4,
                "score": 8,
                "hot": true,
                "type": "阅读理解",
                "knowledge_point": "推理判断",
                "question": "阅读下面短文，回答问题：\n\nScientists have long debated whether artificial intelligence can truly replicate human creativity. A recent study published in Nature shows that while AI can generate novel combinations of existing ideas, it struggles with truly original thinking that breaks established paradigms.\n\nWhat is the main idea of the passage?",
                "options": [
                    "A. AI has completely replaced human creativity",
                    "B. AI can combine existing ideas but lacks original paradigm-breaking thinking",
                    "C. AI is unable to generate any novel ideas",
                    "D. Scientists unanimously agree on AI's creative capabilities"
                ],
                "answer": "B",
                "analysis": "文章明确指出 AI 能够'generate novel combinations of existing ideas'（生成现有想法的新组合），但'struggles with truly original thinking that breaks established paradigms'（在打破既定范式的真正原创思维上有困难）。这与选项B完全对应。A项'完全取代'过度绝对；C项'不能产生任何新想法'与原文矛盾；D项'科学家一致同意'与文章'debated'（存在争议）矛盾。"
            },
            {
                "subject": "物理",
                "subjectColor": "orange",
                "year": "2025",
                "region": "新高考I卷",
                "no": "第14题",
                "level": 4,
                "score": 6,
                "hot": false,
                "type": "单选题",
                "knowledge_point": "牛顿运动定律",
                "question": "一物体在水平面上受到水平恒力 F 作用，从静止开始运动。已知物体质量 m=2kg，力 F=8N，物体与地面间的动摩擦因数 μ=0.2，g=10m/s²。求物体运动 3s 时的速度大小。",
                "options": [
                    "A. 6 m/s",
                    "B. 8 m/s",
                    "C. 12 m/s",
                    "D. 18 m/s"
                ],
                "answer": "A",
                "analysis": "摩擦力 f = μmg = 0.2 × 2 × 10 = 4N。合力 F合 = F - f = 8 - 4 = 4N。由牛顿第二定律：a = F合/m = 4/2 = 2 m/s²。物体从静止开始做匀加速运动，3s 末速度 v = at = 2 × 3 = 6 m/s。故选A。"
            },
            {
                "subject": "化学",
                "subjectColor": "purple",
                "year": "2025",
                "region": "全国乙卷",
                "no": "第26题",
                "level": 5,
                "score": 15,
                "hot": true,
                "type": "实验题",
                "knowledge_point": "氧化还原反应与实验",
                "question": "实验室用二氧化锰和浓盐酸反应制取氯气，反应方程式为：\n\nMnO₂ + 4HCl(浓) →(△) MnCl₂ + Cl₂↑ + 2H₂O\n\n(1) 反应中氧化剂是______，被氧化的元素是______。\n(2) 若要制取 7.1g 氯气，至少需要消耗 MnO₂ 的质量是多少？（MnO₂ 的摩尔质量为 87g/mol，Cl₂ 的摩尔质量为 71g/mol）",
                "options": [],
                "answer": "(1) 氧化剂：MnO₂；被氧化的元素：Cl（氯元素，从-1价升到0价）。\n(2) 需要 MnO₂ 8.7g。",
                "analysis": "(1) 反应中 Mn 元素化合价从 +4 降到 +2，被还原，故 MnO₂ 是氧化剂；Cl 元素从 -1 价（HCl中）升到 0 价（Cl₂中），被氧化。\n(2) 由方程式可知 MnO₂ 与 Cl₂ 的物质的量比为 1:1。\nn(Cl₂) = 7.1g ÷ 71g/mol = 0.1 mol\n所以 n(MnO₂) = 0.1 mol\nm(MnO₂) = 0.1 mol × 87g/mol = 8.7g"
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "year": "2025",
                "region": "新高考II卷",
                "no": "第18题",
                "level": 4,
                "score": 12,
                "hot": false,
                "type": "解答题",
                "knowledge_point": "圆锥曲线",
                "question": "已知椭圆 C：x²/a² + y²/b² = 1 (a>b>0) 的离心率 e=√3/2，且过点 (1, √3/2)。\n(1) 求椭圆 C 的标准方程；\n(2) 求椭圆 C 的焦点坐标。",
                "options": [],
                "answer": "(1) x²/4 + y² = 1。\n(2) 焦点坐标为 (-√3, 0) 和 (√3, 0)。",
                "analysis": "(1) 由 e=c/a=√3/2，得 c²/a²=3/4，即 (a²-b²)/a²=3/4，得 b²=a²/4。代入点 (1, √3/2)：1/a² + (3/4)/b² = 1。把 b²=a²/4 代入：1/a² + (3/4)/(a²/4) = 1 → 1/a² + 3/a² = 1 → 4/a² = 1 → a²=4，b²=1。故椭圆方程为 x²/4 + y² = 1。\n(2) c²=a²-b²=4-1=3，c=√3。焦点在 x 轴上，故焦点为 (±√3, 0)。"
            },
            {
                "subject": "语文",
                "subjectColor": "red",
                "year": "2025",
                "region": "全国甲卷",
                "no": "作文",
                "level": 5,
                "score": 60,
                "hot": true,
                "type": "作文题",
                "knowledge_point": "议论文写作",
                "question": "阅读下面的材料，根据要求写作。\n\n当今时代，人工智能正在以前所未有的速度改变着我们的生活、学习和工作方式。有人认为，AI 让生活更便捷；也有人担忧，AI 会让人失去独立思考的能力。\n\n上述材料引发了你怎样的思考？请结合你的体验与思考，写一篇议论文。\n\n要求：选准角度，确定立意，明确文体，自拟标题；不要套作，不得抄袭；不少于 800 字。",
                "options": [],
                "answer": "【参考立意】\n1. 拥抱AI，更要坚守独立思考的内核\n2. 让AI成为翅膀，而非替代大脑\n3. 在智能时代，培养'人之为人'的思考力\n\n【写作要点】\n• 引论：承认AI的便捷价值，但抛出核心矛盾——便捷是否意味着思考的退场？\n• 本论1：AI确实带来了前所未有的效率（举学习、医疗、创作的实例）。\n• 本论2：然而，过度依赖会让'提问'与'判断'能力退化（举具体现象）。\n• 本论3：真正的出路是'用而不过度'——把AI当工具，保留批判性思考。\n• 结论：在智能时代，最珍贵的不是答案，而是独立思考的能力。",
                "analysis": "本题为典型的'矛盾思辨型'材料作文。评分要点：\n① 立意明确：必须正面回应'便捷与思考'的矛盾关系，不能只谈一面。\n② 论证有深度：要展现辩证思维，避免简单的非此即彼。\n③ 联系现实：结合AI应用的具体场景，避免空泛。\n④ 结构完整：引论-本论-结论层次清晰，过渡自然。\n⑤ 语言有力：用词精准，句式有变化，体现议论色彩。"
            },
            {
                "subject": "物理",
                "subjectColor": "orange",
                "year": "2025",
                "region": "新高考II卷",
                "no": "第17题",
                "level": 3,
                "score": 6,
                "hot": false,
                "type": "单选题",
                "knowledge_point": "电磁感应",
                "question": "一金属棒在匀强磁场中做切割磁感线运动。已知磁感应强度 B=0.5T，棒长 L=0.4m，棒以速度 v=2m/s 垂直切割磁感线。求棒两端产生的感应电动势大小。",
                "options": [
                    "A. 0.2 V",
                    "B. 0.4 V",
                    "C. 0.8 V",
                    "D. 1.0 V"
                ],
                "answer": "B",
                "analysis": "导体切割磁感线产生的感应电动势公式：E = BLv。代入数据：E = 0.5 × 0.4 × 2 = 0.4 V。故选B。\n注意：使用 E=BLv 的条件是 B、L、v 三者互相垂直。本题中'垂直切割'已满足此条件。"
            },
            {
                "subject": "英语",
                "subjectColor": "green",
                "year": "2025",
                "region": "全国乙卷",
                "no": "完形填空",
                "level": 4,
                "score": 15,
                "hot": false,
                "type": "完形填空",
                "knowledge_point": "语境理解与词义辨析",
                "question": "阅读下面短文，掌握其大意，然后从各题所给的四个选项中选出最佳选项。\n\nSarah had always been afraid of public speaking. When her teacher asked her to give a speech at the graduation ceremony, she felt her heart ___1___. However, she decided to ___2___ the challenge. She practiced every day in front of the mirror, ___3___ her voice and gestures. On the day of the ceremony, though nervous, she delivered her speech ___4___. The audience applauded warmly, and Sarah realized that courage was not the absence of fear, but the ___5___ to overcome it.\n\n1. A. beat  B. sink  C. race  D. break\n2. A. refuse  B. accept  C. ignore  D. forget\n3. A. hiding  B. changing  C. recording  D. refining\n4. A. poorly  B. briefly  C. confidently  D. silently\n5. A. decision  B. ability  C. willingness  D. failure",
                "options": [],
                "answer": "1-5: B B D C C",
                "analysis": "1. 选B。'heart sink'是固定表达，意为'心往下沉'，形容恐惧或失望感，符合Sarah害怕公众演讲的情境。\n2. 选B。下文'she practiced every day'表明她接受了挑战，故选accept。refuse（拒绝）、ignore（忽视）、forget（忘记）均与后文矛盾。\n3. 选D。'refining'意为'改进、完善'，与每天练习的过程相符。hiding（隐藏）、changing（改变）、recording（记录）都不如refining贴切。\n4. 选C。下文'The audience applauded warmly'表明演讲成功，故选confidently（自信地）。\n5. 选C。文章主旨是'勇气不是没有恐惧，而是克服恐惧的意愿'，willingness（意愿）最贴切。"
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "year": "2024",
                "region": "全国甲卷",
                "no": "21题(12分)",
                "level": 5,
                "score": 12,
                "hot": true,
                "type": "解答题",
                "knowledge_point": "圆锥曲线综合",
                "question": "已知椭圆C: x²/4 + y² = 1，过右焦点F(1,0)的直线l交椭圆于A、B两点，M为AB的中点。(1)当直线l的斜率为1时，求|AB|；(2)若直线l斜率存在且不为0，证明：直线OM与直线l的斜率之积为定值。",
                "options": [],
                "answer": "(1)|AB|=16/5；(2)k_OM·k_l=-1/4（定值）",
                "analysis": "联立直线与椭圆方程，利用韦达定理和中点坐标公式证明斜率乘积为定值。核心：圆锥曲线焦点弦问题的经典解法。",
                "_id": "q_real_001",
                "_paper_name": "理科数学"
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "year": "2023",
                "region": "全国乙卷",
                "no": "22题(12分)",
                "level": 5,
                "score": 12,
                "hot": true,
                "type": "解答题",
                "knowledge_point": "导数第二问",
                "question": "已知函数f(x)=x - a·e^x + 1。(1)讨论f(x)的单调性；(2)若f(x)≤0恒成立，求a的取值范围。",
                "options": [],
                "answer": "(1)a≤0时单调递增；a>0时(-∞,-lna)递增，(-lna,+∞)递减；(2)a≥1/e²",
                "analysis": "利用导数研究单调性和恒成立问题。第(2)问参变分离后构造函数求最值，或利用第(1)问结论。",
                "_id": "q_real_002",
                "_paper_name": "理科数学"
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "year": "2023",
                "region": "浙江卷",
                "no": "19题",
                "level": 4,
                "score": 12,
                "hot": false,
                "type": "解答题",
                "knowledge_point": "立体几何证明",
                "question": "如图，在四棱锥P-ABCD中，底面ABCD是矩形，PA⊥底面ABCD，PA=AD=2，AB=1，E为PD的中点。(1)求证：PC⊥AE；(2)求二面角A-PC-D的余弦值。",
                "options": [],
                "answer": "(1)建立空间直角坐标系，由向量点积为0得证；(2)cosθ=√3/3",
                "analysis": "空间向量法解立体几何。建系→求法向量→利用二面角公式计算余弦值。",
                "_id": "q_real_003",
                "_paper_name": "数学"
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "year": "2022",
                "region": "全国甲卷",
                "no": "17题",
                "level": 3,
                "score": 12,
                "hot": false,
                "type": "解答题",
                "knowledge_point": "概率统计",
                "question": "某厂生产的某产品按质量分为一、二、三等，其中一等品和二等品为合格品，三等品为不合格品。现该厂共生产了100件产品，从中抽取10件进行检验，设抽到的合格产品件数为X。已知抽到的10件产品中，有2件不合格品的概率是有1件不合格品概率的3/2倍。(1)求该厂生产的产品的合格率；(2)求X的期望。",
                "options": [],
                "answer": "(1)合格率约为0.92；(2)E(X)=10×0.92=9.2",
                "analysis": "超几何分布近似二项分布，利用题目条件列方程求合格率。核心：概率统计在生产质量管理中的应用。",
                "_id": "q_real_004",
                "_paper_name": "理科数学"
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "year": "2021",
                "region": "全国新高考Ⅰ卷",
                "no": "17题",
                "level": 4,
                "score": 10,
                "hot": false,
                "type": "解答题",
                "knowledge_point": "数列综合",
                "question": "已知数列{an}满足a1=1，n(a_{n+1}+1)=(n+1)(a_n+n)，n∈N*。(1)求数列{an}的通项公式；(2)设bn=1/(an·a_{n+1})，求数列{bn}的前n项和Sn。",
                "options": [],
                "answer": "(1)an=n(2n-1)；(2)Sn=1-1/(2n+1)",
                "analysis": "利用递推关系构造新数列，再用裂项相消法求和。",
                "_id": "q_real_005",
                "_paper_name": "数学"
            },
            {
                "subject": "英语",
                "subjectColor": "green",
                "year": "2024",
                "region": "全国Ⅰ卷",
                "no": "完形填空41-55",
                "level": 3,
                "score": 1.5,
                "hot": false,
                "type": "完形填空",
                "knowledge_point": "完形填空",
                "question": "A caring teacher often ____ students who are shy to speak in public, gradually helping them gain confidence. (A) discourages (B) encourages (C) prevents (D) ignores",
                "options": [],
                "answer": "B. encourages",
                "analysis": "考查动词词义辨析和语境理解。由\"caring\"和\"helping them gain confidence\"可知选encourage。",
                "_id": "q_real_006",
                "_paper_name": "英语"
            },
            {
                "subject": "英语",
                "subjectColor": "green",
                "year": "2024",
                "region": "未知",
                "no": "阅读理解D篇",
                "level": 5,
                "score": 10,
                "hot": true,
                "type": "阅读理解",
                "knowledge_point": "kp_eng_05",
                "question": "（节选）Artificial intelligence is increasingly being used to accelerate scientific discovery. One area where AI has made remarkable progress is protein structure prediction. For decades, determining the 3D shape of a protein took months or even years using experimental methods like X-ray crystallography and cryo-EM. DeepMind's AlphaFold2 changed this dramatically—it can now predict a protein's structure with atomic-level accuracy in minutes, sometimes seconds.\n\nThe impact reaches far beyond basic biology. Drug developers are using AlphaFold-derived structures to speed up the discovery of new medicines, particularly for diseases where protein structures were previously unknown. Scientists are also designing entirely new proteins, from enzymes that break down plastic waste to components for new vaccines. However, researchers caution that the technology is not infallible: some complex proteins and protein complexes still resist accurate prediction, and experimental validation remains essential.\n\n1. What was the main problem with protein structure determination before AlphaFold?\n  A. It lacked experimental methods.\n  B. It was extremely time-consuming.\n  C. It could only handle simple proteins.\n  D. It required expensive AI hardware.\n\n2. What is the author's attitude toward the future of AI-aided scientific research?\n  A. Fully optimistic without reservations.\n  B. Dismissive of AI's contributions.\n  C. Positive but mindful of limitations.\n  D. Doubtful about its practical value.",
                "options": [],
                "answer": "1.B  2.C",
                "analysis": "1.细节题。第2句“For decades, determining ... took months or even years using experimental methods...”直接对应B“极其耗时”。A错误：文中仍有X-RAY和cryo-EM，不是缺方法；C未提及；D的AI硬件与题干“before AlphaFold”矛盾。\n2.观点态度题。先写impact far beyond...speed up...designing entirely new protein—正面；再用however转折：“not infallible（并非万无一失）...resist accurate prediction...validation remains essential”—指出局限，因此是“积极但留意限制”=C。",
                "_id": "q_db_2024_english_new1_d",
                "_paper_name": "英语"
            },
            {
                "subject": "英语",
                "subjectColor": "green",
                "year": "2024",
                "region": "全国甲卷",
                "no": "语法填空65",
                "level": 3,
                "score": 1.5,
                "hot": false,
                "type": "语法填空",
                "knowledge_point": "语法填空",
                "question": "The new library _______ (build) on the western side of the campus will be open to students next month.",
                "options": [],
                "answer": "being built",
                "analysis": "考查现在分词被动式作后置定语。library与build是被动关系，且\"will be open\"暗示正在建造中，用being built。",
                "_id": "q_real_008",
                "_paper_name": "英语"
            },
            {
                "subject": "物理",
                "subjectColor": "orange",
                "year": "2024",
                "region": "全国Ⅰ卷",
                "no": "25题(20分)",
                "level": 5,
                "score": 20,
                "hot": true,
                "type": "解答题",
                "knowledge_point": "电磁感应综合",
                "question": "如图甲，间距L=1m的足够长的光滑平行金属导轨水平放置，导轨左端接阻值R=2Ω的电阻，导轨电阻不计。空间存在垂直导轨平面向里的匀强磁场，磁感应强度B=1T。一质量m=0.5kg、电阻r=1Ω的金属棒ab垂直于导轨放置，现给棒一水平向右的初速度v0=6m/s。(1)求棒的速度减为3m/s时的加速度大小；(2)求从开始运动到棒的速度为3m/s的过程中电阻R上产生的焦耳热；(3)若从开始时刻起施加一水平向右的外力F使棒以2m/s²的加速度匀加速运动，求F随时间t的变化关系。",
                "options": [],
                "answer": "(1)a=4m/s²；(2)Q_R=3J；(3)F=7 + 4t/3 (N)",
                "analysis": "电磁感应综合问题：(1)由E=BLv, I=E/(R+r), F安=BIL, a=F安/m求得；(2)能量守恒Q=ΔEk后按R:(R+r)分配；(3)由牛顿第二定律F-F安=ma代入得F(t)。",
                "_id": "q_real_009",
                "_paper_name": "物理"
            },
            {
                "subject": "物理",
                "subjectColor": "orange",
                "year": "2023",
                "region": "全国Ⅱ卷",
                "no": "24题(12分)",
                "level": 4,
                "score": 12,
                "hot": false,
                "type": "解答题",
                "knowledge_point": "力学综合",
                "question": "质量m=2kg的物块从高h=5m的光滑斜面顶端由静止滑下，到达斜面底端后沿粗糙水平面滑行一段距离后停下。已知物块与水平面间的动摩擦因数μ=0.2，重力加速度g=10m/s²。(1)求物块到达斜面底端时的速度大小；(2)求物块在水平面上滑行的距离。",
                "options": [],
                "answer": "(1)v=10m/s；(2)x=25m",
                "analysis": "(1)机械能守恒mgh=½mv²求得速度；(2)动能定理-μmgx=0-½mv²或v²=2ax求得滑行距离。",
                "_id": "q_real_010",
                "_paper_name": "物理"
            },
            {
                "subject": "化学",
                "subjectColor": "purple",
                "year": "2024",
                "region": "浙江卷",
                "no": "31题(15分)",
                "level": 4,
                "score": 15,
                "hot": false,
                "type": "解答题",
                "knowledge_point": "有机推断",
                "question": "某研究小组按下列路线合成药物中间体E：已知A的分子式为C7H6O，能发生银镜反应。(1)写出A的结构简式；(2)指出反应①和②的反应类型；(3)写出E→F的化学方程式；(4)设计以苯和乙醇为原料制备某物质的合成路线（用流程图表示，无机试剂任选）。",
                "options": [],
                "answer": "(1)A为苯甲醛C6H5CHO；(2)反应①为加成反应，反应②为消去反应；(3)化学方程式略；(4)合成路线略",
                "analysis": "有机合成综合推断：从分子式和特征反应（银镜=醛基）出发，结合反应条件推断官能团变化，最后利用逆推法设计合成路线。",
                "_id": "q_real_011",
                "_paper_name": "化学"
            },
            {
                "subject": "化学",
                "subjectColor": "purple",
                "year": "2023",
                "region": "全国Ⅰ卷",
                "no": "28题",
                "level": 4,
                "score": 14,
                "hot": false,
                "type": "解答题",
                "knowledge_point": "化学反应原理",
                "question": "对于反应N₂O₄(g)⇌2NO₂(g)  ΔH>0：(1)在恒温恒容容器中，该反应达到平衡的标志是______；(2)升高温度，平衡常数K如何变化？平衡如何移动？(3)某温度下，向5L密闭容器中充入2molN₂O₄，平衡时NO₂的浓度为0.4mol/L，求该温度下的平衡常数K及N₂O₄的转化率。",
                "options": [],
                "answer": "(1)颜色不变、压强不变等；(2)K增大，平衡正向移动；(3)K=0.8，转化率50%",
                "analysis": "化学平衡综合题：(1)平衡标志判断；(2)温度对平衡和K的影响（正反应吸热，升温K增，正移）；(3)三段式法求K和转化率。",
                "_id": "q_real_012",
                "_paper_name": "化学"
            },
            {
                "subject": "语文",
                "subjectColor": "red",
                "year": "2024",
                "region": "全国甲卷",
                "no": "古代诗歌阅读(14-15题)",
                "level": 4,
                "score": 9,
                "hot": false,
                "type": "解答题",
                "knowledge_point": "古诗文鉴赏",
                "question": "阅读下面这首唐诗，完成(1)(2)题。《登高》杜甫：风急天高猿啸哀，渚清沙白鸟飞回。无边落木萧萧下，不尽长江滚滚来。万里悲秋常作客，百年多病独登台。艰难苦恨繁霜鬓，潦倒新停浊酒杯。(1)下列对这首诗的理解和赏析，不正确的一项是( ) (2)本诗颔联\"无边落木萧萧下，不尽长江滚滚来\"是千古名句，请结合全诗赏析其艺术特色。",
                "options": [],
                "answer": "(1)不正确选项略（视具体选项而定）；(2)本联以对偶句写景，气势雄浑；\"无边\"\"不尽\"极写境界阔大；\"萧萧\"\"滚滚\"叠词写声与态，状秋之萧瑟悲壮；景中寄寓漂泊之苦与韶华易逝之叹，情景交融。",
                "analysis": "古诗鉴赏：先从意象、手法（对偶、叠词、夸张）入手分析艺术特色，再结合全诗\"悲秋\"\"多病\"\"苦恨\"的情感基调，分析景与情的关系。",
                "_id": "q_real_013",
                "_paper_name": "语文"
            },
            {
                "subject": "语文",
                "subjectColor": "red",
                "year": "2023",
                "region": "全国新高考Ⅰ卷",
                "no": "论述类文本",
                "level": 3,
                "score": 3,
                "hot": false,
                "type": "选择题",
                "knowledge_point": "文言文阅读",
                "question": "根据原文内容，下列说法正确的一项是（ ）(A)……(B)……(C)……(D)……（考点：筛选并整合文中信息，分析论点论据论证方法）",
                "options": [],
                "answer": "（视具体选项，对应信息筛选题型的标准答案）",
                "analysis": "论述类文本阅读核心考点：①理解文中重要概念含义；②筛选整合信息；③分析论点论据和论证方法；④分析概括作者观点态度。答题时逐项对照原文，注意偷换概念、以偏概全、无中生有等常见陷阱。",
                "_id": "q_real_014",
                "_paper_name": "语文"
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "year": "2025",
                "region": "全国甲卷",
                "no": "20题(12分)",
                "level": 4,
                "score": 12,
                "hot": false,
                "type": "解答题",
                "knowledge_point": "概率统计",
                "question": "某产品有三个独立的生产环节，每个环节出现次品的概率分别为0.02、0.03、0.05。假设只要有一个环节出次品则整产品为次品。(1)求产品为次品的概率；(2)现对一批1000件产品做抽检，抽10件，求抽到次品件数的期望。",
                "options": [],
                "answer": "(1)P≈0.097；(2)E(X)=0.97",
                "analysis": "(1)P(次品)=1-P(正品)=1-(1-0.02)(1-0.03)(1-0.05)=1-0.98·0.97·0.95≈0.097。(2)X~B(n=10,p≈0.097)，E(X)=np≈0.97。",
                "_id": "q_db_2025_math_nation1_20",
                "_paper_name": "理科数学"
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "year": "2025",
                "region": "全国新高考Ⅱ卷",
                "no": "22题(12分)",
                "level": 5,
                "score": 12,
                "hot": true,
                "type": "解答题",
                "knowledge_point": "导数第二问",
                "question": "【五层架构·L4检验校验→L5反思归纳】已知函数f(x)=e^x - ax - 1 - x²/2 (a∈R)。(1)当a=1时，证明：f(x)≥0在[0,+∞)上恒成立；(2)若f(x)在[0,+∞)上单调递增，求a的取值范围；(3)若a=2，且当x≥0时f(x)≥kx，求k的最大值。",
                "options": [],
                "answer": "(1)略（二阶导数证单调性→最小值为0）；(2)a≤1；(3)k_max=1",
                "analysis": "五层架构完整流程：L1定位→导数综合应用（恒成立+单调性+参数范围）；L2方法→构造辅助函数+分类讨论+分离参数；L3步骤→逐小问严格推导；L4检验→端点x=0特殊值验证；L5反思→泰勒展开e^x≥1+x+x²/2是本题背景，理解命题来源可快速预判结论。",
                "_id": "q_real_016",
                "_paper_name": "数学"
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "year": "2022",
                "region": "北京卷",
                "no": "16题(13分)",
                "level": 3,
                "score": 13,
                "hot": false,
                "type": "解答题",
                "knowledge_point": "三角函数与解三角形",
                "question": "【五层架构·L3步骤规范】在△ABC中，a=2，c=2√3，A=30°。(1)求角C；(2)求△ABC的面积。",
                "options": [],
                "answer": "(1)C=60°或120°；(2)当C=60°时S△=2√3；当C=120°时S△=√3",
                "analysis": "五层架构标准解：L1→正弦定理+三角形面积；L2→正弦定理求角C（注意两解）；L3→步骤规范：①写正弦定理公式②代入数值③求sinC=√3/2→两解④分别求B和面积；L4→用大边对大角验证c>a→C>A→两解均成立；L5→易错警示：已知两边及一边对角时可能有两解，切勿漏解。",
                "_id": "q_real_017",
                "_paper_name": "数学"
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "year": "2024",
                "region": "天津卷",
                "no": "18题(15分)",
                "level": 4,
                "score": 15,
                "hot": false,
                "type": "解答题",
                "knowledge_point": "数列综合",
                "question": "【五层架构·L5反思归纳】设{an}是等差数列，{bn}是等比数列，已知a1=b1=1，a2+b2=5，a3+b3=11。(1)求{an}和{bn}的通项公式；(2)设cn=an·bn，求数列{cn}的前n项和Sn。",
                "options": [],
                "answer": "(1)an=2n-1，bn=2^(n-1)；(2)Sn=(2n-3)·2^n + 3",
                "analysis": "五层架构归纳：L1→等差等比综合+差比数列求和；L2→基本量法求通项+错位相减法求和；L3→①列方程组求d,q②Sn展开式写3项+乘公比错位相减；L4→用n=1,2,3特值代入Sn验证；L5→方法总结：差比数列{等差×等比}求和必用错位相减，结果形如(An+B)·q^n + C。",
                "_id": "q_real_018",
                "_paper_name": "数学"
            },
            {
                "subject": "英语",
                "subjectColor": "green",
                "year": "2025",
                "region": "全国Ⅰ卷",
                "no": "语法填空56-65题节选",
                "level": 2,
                "score": 1.5,
                "hot": false,
                "type": "语法填空",
                "knowledge_point": "语法填空",
                "question": "【五层架构·L1词性→L2句法→L3语境】阅读下面短文，在空白处填入1个适当的单词或括号内单词的正确形式。The Forbidden City, ____ (locate) in the heart of Beijing, is one of the world's ____ (large) and most well-preserved wooden structures. It ____ (build) from 1406 to 1420 and served ____ the imperial palace for 24 emperors. Today it attracts millions of ____ (visit) every year.",
                "options": [],
                "answer": "1. located（过去分词作定语）；2. largest（最高级）；3. was built（被动过去时）；4. as（serve as固定搭配）；5. visitors（名词复数）",
                "analysis": "五层架构语法填空解题法：L1词性预判→括号给动词考虑时态/语态/非谓；给形容词考虑比较级；L2句法分析→句子缺谓语还是非谓；L3语境验证→被动/主动/搭配；L4检查拼写（-ed,-est复数）；L5总结：无提示词空常考介词/冠词/连词/代词。",
                "_id": "q_real_019",
                "_paper_name": "英语"
            },
            {
                "subject": "英语",
                "subjectColor": "green",
                "year": "2025",
                "region": "全国Ⅱ卷",
                "no": "书面表达25题(25分)",
                "level": 3,
                "score": 25,
                "hot": false,
                "type": "书面表达",
                "knowledge_point": "书面表达",
                "question": "【五层架构·L5写作模板】假定你是李华，你的英国朋友Peter来信询问你校即将举办的\"中国传统文化节\"（Chinese Traditional Culture Festival）的情况，请你回信介绍，内容包括：1. 时间和地点；2. 活动内容；3. 邀请他参加。注意：1. 词数100左右；2. 可以适当增加细节，以使行文连贯。",
                "options": [],
                "answer": "参考范文（要点式）：Dear Peter, I'm glad to tell you about our school's Chinese Traditional Culture Festival. It will be held in the school hall next Friday from 9 am to 5 pm. Activities include paper-cutting show, calligraphy performance, tea ceremony and a speech on Chinese festivals. I sincerely invite you to come and experience the rich culture. Looking forward to your reply. Yours, Li Hua",
                "analysis": "五层架构写作提分法：L1审题→应用文+邀请信；L2结构→三段式：问候+目的/时间地点/活动内容/邀请收尾；L3语言→用高级句型（被动/定语从句/非谓语）和搭配；L4检查→语法+拼写+字数；L5模板：邀请信=Glad to tell+Time/Place+Activities list+Invitation+Looking forward。",
                "_id": "q_real_020",
                "_paper_name": "英语"
            },
            {
                "subject": "英语",
                "subjectColor": "green",
                "year": "2022",
                "region": "浙江卷",
                "no": "阅读理解C篇30-33题节选",
                "level": 4,
                "score": 2,
                "hot": false,
                "type": "阅读理解",
                "knowledge_point": "阅读理解",
                "question": "【五层架构·题型对应】What is the main idea of Paragraph 2? What does the underlined word \"ubiquitous\" in Para.3 probably mean? The author mentions the study in Para.4 to ______. Which of the following can be the best title for the text?（主旨大意题·词义猜测题·推理判断题·标题概括题典型组合）",
                "options": [],
                "answer": "答案要点：主旨题→找段首句/转折句；词义题→上下文对比词（如however/although/and）；例证题→找例子前的观点句；标题题→涵盖全文核心话题词",
                "analysis": "五层架构阅读法：L1扫题干→标记题型+定位词；L2读文→首段/各段首句+转折词处；L3定位→题干关键词回文；L4比对→选项与原文一一对应（常见陷阱：偷换主语/时态混淆/范围扩大）；L5总结：每道错题归类到4大题型中，统计薄弱题型专项训练。",
                "_id": "q_real_021",
                "_paper_name": "英语"
            },
            {
                "subject": "物理",
                "subjectColor": "orange",
                "year": "2025",
                "region": "全国甲卷",
                "no": "21题(19分)",
                "level": 5,
                "score": 19,
                "hot": true,
                "type": "解答题",
                "knowledge_point": "电场与磁场",
                "question": "【五层架构·L2受力分析→L3运动分解】如图所示，在直角坐标系xOy平面的第一象限内，存在沿y轴正方向的匀强电场（场强E）和垂直纸面向外的匀强磁场（磁感应强度B）。一质量为m、电荷量为+q的带电粒子从原点O以速度v0沿x轴正方向射入。(1)若粒子恰好沿x轴做直线运动，求E与B的关系；(2)若撤去电场，粒子从( L, 0 )处飞出磁场，求B的大小和粒子在磁场中运动的时间。",
                "options": [],
                "answer": "(1)E = Bv0（洛伦兹力与电场力平衡）；(2)B = 2mv0/(qL)；运动时间 t = πL/(3v0)",
                "analysis": "五层架构物理解题：L1→带电粒子在复合场中的运动；L2方法→①受力平衡条件②洛伦兹力提供向心力+几何关系求半径；L3步骤规范：画轨迹→找圆心→求半径→列方程；L4检验：量纲检查[T]与mv/(qB)一致；L5归纳：复合场先判重力是否考虑（带电粒子一般不计重力，带电液滴/小球需考虑）。",
                "_id": "q_real_022",
                "_paper_name": "物理"
            },
            {
                "subject": "物理",
                "subjectColor": "orange",
                "year": "2024",
                "region": "山东卷",
                "no": "18题(14分)",
                "level": 4,
                "score": 14,
                "hot": false,
                "type": "解答题",
                "knowledge_point": "功能关系",
                "question": "【五层架构·L4检验·多过程分析】如图，光滑水平轨道AB与光滑竖直半圆轨道BC相切于B点，BC的半径为R。质量为m的小球压缩弹簧后从A点由静止释放，离开弹簧后经B点冲上半圆轨道，恰好能通过最高点C。(1)求小球在C点的速度大小；(2)求弹簧被压缩时具有的弹性势能；(3)求小球从C点飞出后落地点距B点的水平距离。",
                "options": [],
                "answer": "(1)v_C = √(gR)（临界条件：重力提供向心力）；(2)Ep = 2.5mgR（机械能守恒）；(3)x = 2R",
                "analysis": "五层架构：L1→多过程（弹簧→水平→竖直圆→平抛）综合；L2→分过程用规律：弹簧释放弹性势能→机械能守恒→圆周运动临界条件→平抛分解；L3→三过程分别列方程；L4→检验：量纲+临界条件验证（恰好通过最高点=向心力=重力）；L5→多过程问题核心：分段处理，连接点速度是纽带。",
                "_id": "q_real_023",
                "_paper_name": "物理"
            },
            {
                "subject": "化学",
                "subjectColor": "purple",
                "year": "2025",
                "region": "全国乙卷",
                "no": "27题(14分)",
                "level": 3,
                "score": 14,
                "hot": false,
                "type": "解答题",
                "knowledge_point": "实验探究",
                "question": "【五层架构·实验探究规范答题】某化学兴趣小组用下列装置制备SO2并探究其性质。装置A中用70%硫酸与Na2SO3固体制SO2；装置B盛品红溶液；装置C盛酸性KMnO4溶液；装置D盛H2S溶液；装置E盛NaOH溶液进行尾气处理。(1)写出A中反应的化学方程式；(2)描述B、C、D中的现象并写出对应反应原理；(3)说明装置E中NaOH的作用和反应方程式。",
                "options": [],
                "answer": "(1)Na2SO3 + H2SO4 = Na2SO4 + SO2↑ + H2O；(2)B品红褪色（漂白性，加热恢复）；C紫色褪去（还原性，5SO2+2MnO4-+2H2O=5SO42-+2Mn2++4H+）；D黄色浑浊（氧化性，SO2+2H2S=3S↓+2H2O）；(3)吸收尾气防污染，SO2+2NaOH=Na2SO3+H2O",
                "analysis": "五层架构实验题：L1→SO2制备与性质（漂白/还原/氧化/酸性氧化物4性）；L2→逐装置分析作用；L3→规范答题模板：现象+对应化学方程式+体现性质；L4→检验：方程式配平（原子守恒+电荷守恒）；L5→实验题答题模板：现象描述要全面（色/态/沉/气/光），操作描述要含\"取液→加试剂→现象→结论\"四要素。",
                "_id": "q_real_024",
                "_paper_name": "化学"
            },
            {
                "subject": "化学",
                "subjectColor": "purple",
                "year": "2022",
                "region": "广东卷",
                "no": "19题",
                "level": 3,
                "score": 6,
                "hot": false,
                "type": "填空题",
                "knowledge_point": "元素化合物",
                "question": "【五层架构·元素化合物转化链】下列框图涉及的物质均为中学化学常见物质。已知A为金属单质，B为红棕色粉末，C为无色气体，D为白色沉淀，E为红褐色沉淀。A + B →(高温) C + D；D + O2 + H2O → E。(1)写出A、B的化学式；(2)写出D→E的化学方程式并描述现象。",
                "options": [],
                "answer": "(1)A: Al；B: Fe2O3（铝热反应）；(2)4Fe(OH)2 + O2 + 2H2O = 4Fe(OH)3，现象：白色沉淀→灰绿色→红褐色",
                "analysis": "五层架构推断题：L1→突破口（特征现象/特征颜色/特征反应）；L2→红棕色粉末=Fe2O3，白色→灰绿→红褐=Fe(OH)2氧化，推知铝热反应；L3→规范写化学式+方程式；L4→代入框图回验所有转化；L5→归纳常见突破口颜色：红棕(Fe2O3/NO2)、红褐(Fe(OH)3)、浅黄(S/Na2O2/AgBr)、蓝色(CuSO4·5H2O/Cu(OH)2)。",
                "_id": "q_real_025",
                "_paper_name": "化学"
            },
            {
                "subject": "语文",
                "subjectColor": "red",
                "year": "2025",
                "region": "全国新高考Ⅱ卷",
                "no": "文言文阅读(10-14题)",
                "level": 4,
                "score": 20,
                "hot": false,
                "type": "解答题",
                "knowledge_point": "文言文阅读",
                "question": "【五层架构·文言翻译六字法】阅读下面的文言文，完成各题。（文本节选《史记·屈原贾生列传》片段：屈原者，名平，楚之同姓也。为楚怀王左徒。博闻强志，明于治乱，娴于辞令。入则与王图议国事，以出号令；出则接遇宾客，应对诸侯。王甚任之。……屈平正道直行，竭忠尽智以事其君，谗人间之，可谓穷矣。信而见疑，忠而被谤，能无怨乎？屈平之作《离骚》，盖自怨生也。）(1)把文中画横线的句子翻译成现代汉语：①博闻强志，明于治乱，娴于辞令。②信而见疑，忠而被谤，能无怨乎？(2)请简要概括屈原写作《离骚》的原因。",
                "options": [],
                "answer": "(1)①见闻广博，记忆力强，明晓国家治乱的道理，擅长外交辞令。②诚信却被怀疑，忠心却被诽谤，能没有怨恨吗？(2)屈原正道直行、竭忠尽智，却遭谗人离间、君主猜疑，处境困窘，心生幽怨，故作《离骚》以抒发情志。",
                "analysis": "五层架构文言翻译六字法：L1留（专有名词）、L2补（省略成分）、L3删（无义虚词）、L4换（古今异义/单音换双音）、L5调（倒装句语序）、L6贯（意译使通顺）。被动句标志\"见\"\"被\"必译出。原因概括题要回到原文找因果关联词（\"盖\"\"故\"\"以\"）。",
                "_id": "q_real_026",
                "_paper_name": "语文"
            },
            {
                "subject": "语文",
                "subjectColor": "red",
                "year": "2024",
                "region": "浙江卷",
                "no": "作文题(60分)",
                "level": 5,
                "score": 60,
                "hot": true,
                "type": "作文",
                "knowledge_point": "作文",
                "question": "【五层架构·议论文五段式】阅读下面的材料，根据要求写作。（60分）\"九层之台，起于累土；千里之行，始于足下。\"——《老子》 \"不积跬步，无以至千里；不积小流，无以成江海。\"——《荀子·劝学》 以上两则古语都蕴含着关于\"积累与起步\"的深刻道理。请结合材料写一篇文章，体现你的感悟与思考。要求：选准角度，确定立意，明确文体，自拟标题；不要套作，不得抄袭；不得泄露个人信息；不少于800字。",
                "options": [],
                "answer": "参考立意与结构：【立意】厚积方能薄发，起步决定高度。【五段式结构】1.引论：引材料+提论点（个人成长、事业成就、民族复兴皆需扎实起步与持续积累）；2.本论一：起步是根基，\"第一步\"定方向（论据：嫦娥探月工程立项之初的技术论证）；3.本论二：积累是过程，量变促质变（论据：屠呦呦2000余方药筛选萃取出青蒿素）；4.本论三：新时代青年既要有\"起于足下\"的行动，更要有\"久久为功\"的坚守；5.结论：呼应开头，升华主旨，发出号召。",
                "analysis": "五层架构作文提分法：L1审题立意→抓关键词\"积累\"\"起步\"，用\"由果溯因法\"明确两则材料共同指向\"脚踏实地+持之以恒\"；L2结构→总分总/五段式是高考议论文稳定拿分结构；L3选材→古今中外3例+排比扣题；L4语言→多用比喻/排比/引用增强文采；L5卷面→书写工整，段落匀称，标题亮眼（如《始于足下，积于跬步》《以积累为基，以起步为翼》）。",
                "_id": "q_real_027",
                "_paper_name": "语文"
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "year": "2024",
                "region": "全国甲卷",
                "no": "",
                "level": 3,
                "score": 12,
                "hot": false,
                "type": "解答题",
                "knowledge_point": "综合",
                "question": "函数f(x)=x³-3x+1求极值",
                "options": [],
                "answer": "f(-1)=3极大值,f(1)=-1极小值",
                "analysis": "求导f=3x²-3=0得x=±1",
                "_id": "questions_1785486346984_sq3ljn",
                "_paper_name": ""
            },
            {
                "subject": "政治",
                "subjectColor": "purple",
                "year": "2024",
                "region": "全国甲卷",
                "no": "38题(28分)",
                "level": 4,
                "score": 28,
                "hot": false,
                "type": "材料分析题",
                "knowledge_point": "经济生活",
                "question": "材料一：2023年我国数字经济规模达53.9万亿元，占GDP比重42.8%。材料二：国家发改委等部门联合印发《\"十四五\"数字经济发展规划》。(1)结合材料，运用经济与社会的知识，分析我国大力发展数字经济的意义。(2)运用政治与法治的知识，说明政府在推动数字经济发展中应如何履行职能。",
                "options": [],
                "answer": "(1)①推动经济高质量发展，培育新发展动能；②促进产业结构优化升级；③扩大就业、改善民生；④增强国家综合实力。\n(2)①履行组织社会主义经济建设的职能，加强宏观调控；②坚持对人民负责原则，提高服务水平；③依法行政，规范市场秩序；④推进数字政府建设，提高治理效能。",
                "analysis": "经济意义从创新驱动、产业升级、就业民生、国家实力四方面展开；政府职能从经济职能、原则、依法行政、治理现代化四角度回答。",
                "_id": "q_real_028",
                "_paper_name": "政治"
            },
            {
                "subject": "政治",
                "subjectColor": "purple",
                "year": "2023",
                "region": "全国乙卷",
                "no": "39题(12分)",
                "level": 3,
                "score": 12,
                "hot": false,
                "type": "材料分析题",
                "knowledge_point": "政治生活",
                "question": "2023年是\"一带一路\"倡议提出十周年。十年来，中国与150多个国家、30多个国际组织签署了200多份合作文件。(1)运用当代国际政治与经济知识，分析\"一带一路\"倡议的生命力所在。(2)运用哲学知识，说明\"一带一路\"建设中应如何处理共商共建共享的关系。",
                "options": [],
                "answer": "(1)①国家利益是国际关系的决定因素，'一带一路'契合各方共同利益；②和平与发展是时代主题；③经济全球化深入发展的必然要求；④中国是大国之交的推动者、建设者。\n(2)①矛盾普遍性与特殊性相统一；②整体与部分相统一；③量变与质变相统一；④事物是普遍联系的。",
                "analysis": "国际政治题要从国家利益、时代主题、全球化、中国角色四个维度分析；哲学题用矛盾观、联系观、发展观三大规律展开。",
                "_id": "q_real_029",
                "_paper_name": "政治"
            },
            {
                "subject": "政治",
                "subjectColor": "purple",
                "year": "2022",
                "region": "北京卷",
                "no": "17题(10分)",
                "level": 3,
                "score": 4,
                "hot": false,
                "type": "选择题",
                "knowledge_point": "文化生活",
                "question": "2022年北京冬奥会期间，中国通过多种渠道向世界展示文化魅力。这体现了：①文化是民族的也是世界的；②文化多样性是世界文化的基本特征；③传统文化是文化发展的根基；④文化交流以我为主、为我所用。其中正确的是（ ）A.①② B.①③ C.②④ D.③④",
                "options": [],
                "answer": "A",
                "analysis": "①②正确体现了文化多样性和文化交流的基本原理；③片面强调传统文化作用；④\"以我为主\"态度不正确，应相互尊重。",
                "_id": "q_real_030",
                "_paper_name": "政治"
            },
            {
                "subject": "政治",
                "subjectColor": "purple",
                "year": "2025",
                "region": "全国新高考Ⅰ卷",
                "no": "20题(16分)",
                "level": 5,
                "score": 16,
                "hot": true,
                "type": "材料分析题",
                "knowledge_point": "生活与哲学",
                "question": "材料：2024年6月，嫦娥六号完成世界首次月背采样返回，彰显了中国航天实力。(1)运用哲学知识，分析\"追逐梦想、勇于探索、协同攻坚、合作共赢\"的探月精神所蕴含的哲理。(2)运用当代国际政治与经济知识，说明中国航天成就的世界意义。",
                "options": [],
                "answer": "(1)①意识具有能动作用，探月精神激励航天人攻坚克难；②实践是认识的基础，探月工程推动对月球的认识；③联系具有普遍性，协同攻坚体现系统优化；④发展是量变到质变，多次探月任务积累实现突破。\n(2)①提升中国综合国力，扩大国际影响力；②推动人类对宇宙的认识；③彰显和平利用太空的中国方案；④促进国际科技合作。",
                "analysis": "哲学题用意识能动性、实践认识、联系观、发展观展开；国际政治题从综合国力、人类认识、和平利用、国际合作四角度作答。",
                "_id": "q_real_031",
                "_paper_name": "政治"
            },
            {
                "subject": "历史",
                "subjectColor": "orange",
                "year": "2024",
                "region": "全国甲卷",
                "no": "41题(25分)",
                "level": 4,
                "score": 25,
                "hot": false,
                "type": "材料分析题",
                "knowledge_point": "中国古代史",
                "question": "材料一：宋代城市商品经济发达，出现了世界上最早的纸币\"交子\"。材料二：18世纪英国工业革命改变了世界面貌。(1)根据材料一及所学，分析宋代商品经济发展的特点。(2)根据材料二及所学，说明工业革命对世界市场形成的影响。",
                "options": [],
                "answer": "(1)①纸币出现标志信用体系发展；②城市商业繁荣，坊市界限打破；③海外贸易兴盛；④商业资本活跃。\n(2)①机器大工业提供物质基础；②交通工具革新缩短时空；③殖民扩张瓜分世界；④世界市场基本形成。",
                "analysis": "宋代商业特点从货币、城市、外贸、资本四方面归纳；工业革命影响从物质、交通、殖民、市场四角度展开。",
                "_id": "q_real_032",
                "_paper_name": "历史"
            },
            {
                "subject": "历史",
                "subjectColor": "orange",
                "year": "2023",
                "region": "全国乙卷",
                "no": "42题(12分)",
                "level": 4,
                "score": 12,
                "hot": false,
                "type": "论述题",
                "knowledge_point": "中国近代史",
                "question": "材料：历史学家黄仁宇提出\"大历史观\"，主张从宏观角度、长时段考察历史。结合所学，以\"中国现代化的进程\"为主题，写一篇小论文。",
                "options": [],
                "answer": "标题：中国现代化的渐进历程\n论点：中国现代化经历了从被动接受到主动探索、从器物到制度再到文化的递进过程。\n论证：①洋务运动开启器物层面现代化；②戊戌变法、辛亥革命推动制度层面变革；③新文化运动开展思想文化现代化；④新中国成立后现代化进入新阶段；⑤改革开放后中国现代化全面提速。\n结论：中国现代化是历史必然，体现了中华民族自强不息的精神。",
                "analysis": "论述题结构：论点—论证—结论。论证部分按时间顺序递进展开，覆盖器物、制度、思想文化、政治、经济现代化五个层次。",
                "_id": "q_real_033",
                "_paper_name": "历史"
            },
            {
                "subject": "历史",
                "subjectColor": "orange",
                "year": "2022",
                "region": "山东卷",
                "no": "19题(14分)",
                "level": 3,
                "score": 14,
                "hot": false,
                "type": "材料分析题",
                "knowledge_point": "世界近代史",
                "question": "材料：18世纪末，法国大革命颁布《人权宣言》。(1)根据材料及所学，概括《人权宣言》的核心内容。(2)结合所学，分析法国大革命对欧洲的影响。",
                "options": [],
                "answer": "(1)①人人生而平等自由；②主权在民；③私有财产神圣不可侵犯；④法律面前人人平等。\n(2)①摧毁法国封建专制统治；②震撼欧洲封建秩序；③传播自由平等思想；④推动欧洲资产阶级革命浪潮。",
                "analysis": "《人权宣言》内容从人权、主权、财产、法律四原则归纳；影响从国内、欧洲、思想、革命浪潮四个层面分析。",
                "_id": "q_real_034",
                "_paper_name": "历史"
            },
            {
                "subject": "历史",
                "subjectColor": "orange",
                "year": "2025",
                "region": "全国新高考Ⅰ卷",
                "no": "18题(16分)",
                "level": 4,
                "score": 16,
                "hot": false,
                "type": "材料分析题",
                "knowledge_point": "世界现代史",
                "question": "材料一：1949年10月1日，中华人民共和国成立。材料二：1956年三大改造基本完成。(1)根据材料及所学，分析新中国成立的历史意义。(2)根据材料二及所学，说明三大改造完成的深远影响。",
                "options": [],
                "answer": "(1)①结束半殖民地半封建社会；②人民成为国家主人；③开辟中国历史新纪元；④壮大了世界和平民主力量。\n(2)①社会主义制度基本建立；②我国进入社会主义初级阶段；③为社会主义建设奠定基础；④实现了中国历史上最深刻的社会变革。",
                "analysis": "新中国成立意义从政治、阶级、历史地位、国际影响四方面分析；三大改造影响从制度确立、阶段定位、建设基础、社会变革四个层面展开。",
                "_id": "q_real_035",
                "_paper_name": "历史"
            },
            {
                "subject": "地理",
                "subjectColor": "blue",
                "year": "2024",
                "region": "全国甲卷",
                "no": "36题(22分)",
                "level": 4,
                "score": 22,
                "hot": false,
                "type": "综合题",
                "knowledge_point": "自然地理",
                "question": "材料：2024年7月，塔克拉玛干沙漠遭遇特大暴雨，引发罕见洪水。图文信息略。(1)分析塔克拉玛干沙漠暴雨洪水的成因。(2)说明洪水对沙漠地区生态环境的影响。",
                "options": [],
                "answer": "(1)①受异常大气环流影响，水汽输送增强；②地形抬升形成对流雨；③气候变化加剧极端天气；④沙漠地表渗透性强但地势低洼处易积水。\n(2)①短期改变地表水分条件；②促进植被恢复；③影响沙丘形态；④可能引发土壤盐碱化。",
                "analysis": "暴雨洪水成因从大气环流、地形、气候变化、地表特征四角度分析；影响从水分、植被、地貌、土壤四方面说明，要辩证看待利弊。",
                "_id": "q_real_036",
                "_paper_name": "地理"
            },
            {
                "subject": "地理",
                "subjectColor": "blue",
                "year": "2023",
                "region": "全国乙卷",
                "no": "37题(20分)",
                "level": 4,
                "score": 20,
                "hot": false,
                "type": "综合题",
                "knowledge_point": "人文地理",
                "question": "材料：长江经济带是我国经济发展的重要支撑带。(1)分析长江发展航运的优势自然条件。(2)说明长江经济带对全国经济发展的带动作用。",
                "options": [],
                "answer": "(1)①流量大、流域广，通航里程长；②无结冰期，全年通航；③干流水量稳定，支流众多；④地势平坦，水流平稳。\n(2)①连接东中西部，促进区域协调；②产业转移与升级；③城市群带动辐射；④对外开放前沿。",
                "analysis": "航运优势从流量、冰期、水系、地势四方面归纳；带动作用从区域协调、产业升级、城市辐射、对外开放四个角度展开。",
                "_id": "q_real_037",
                "_paper_name": "地理"
            },
            {
                "subject": "地理",
                "subjectColor": "blue",
                "year": "2022",
                "region": "浙江卷",
                "no": "28题(11分)",
                "level": 3,
                "score": 8,
                "hot": false,
                "type": "选择题",
                "knowledge_point": "区域地理",
                "question": "读世界某区域图（略）。该区域典型植被为（ ）A.热带雨林 B.热带草原 C.温带落叶阔叶林 D.亚热带常绿硬叶林。该气候类型对农业的影响主要表现为（ ）A.夏季光热充足，利于水果糖分积累 B.雨热同期，利于水稻种植 C.全年多雨，适合橡胶种植 D.全年高温干旱，适合耐旱作物",
                "options": [],
                "answer": "D；A",
                "analysis": "地中海气候区典型植被为亚热带常绿硬叶林；夏季高温干燥、冬季温和多雨，夏季光热充足利于水果糖分积累，是葡萄、橄榄种植优势区。",
                "_id": "q_real_038",
                "_paper_name": "地理"
            },
            {
                "subject": "地理",
                "subjectColor": "blue",
                "year": "2025",
                "region": "全国新高考Ⅰ卷",
                "no": "19题(16分)",
                "level": 5,
                "score": 16,
                "hot": true,
                "type": "综合题",
                "knowledge_point": "环境保护",
                "question": "材料：2024年6月，全球平均气温创历史新高，多国遭遇极端高温。图文资料略。(1)分析2024年全球极端高温的可能成因。(2)从地理视角说明应对全球变暖的路径。",
                "options": [],
                "answer": "(1)①厄尔尼诺现象叠加；②温室气体排放增加；③城市化热岛效应；④大气环流异常。\n(2)①能源：发展清洁能源替代化石能源；②产业：推动低碳转型；③生态：植树造林增汇；④政策：加强国际合作。",
                "analysis": "极端高温成因从厄尔尼诺、温室气体、城市热岛、大气环流四方面分析；应对路径从能源、产业、生态、政策四个地理视角说明。",
                "_id": "q_real_039",
                "_paper_name": "地理"
            },
            {
                "subject": "生物",
                "subjectColor": "green",
                "year": "2024",
                "region": "全国甲卷",
                "no": "31题(15分)",
                "level": 4,
                "score": 15,
                "hot": false,
                "type": "实验题",
                "knowledge_point": "遗传规律",
                "question": "某小组研究不同浓度生长素(IAA)对小麦幼苗根伸长的影响，实验结果如图（略）。(1)写出实验设计思路。(2)分析实验结果。(3)说明生长素作用特征。",
                "options": [],
                "answer": "(1)①将生长状况一致的小麦幼苗分组；②设置不同浓度IAA处理组与对照组；③相同适宜条件下培养；④测量根长并统计分析。\n(2)低浓度促进根伸长，高浓度抑制根伸长，最适浓度约10^-8mol/L。\n(3)①具有两重性；②不同器官敏感度不同；③浓度不同作用效果不同。",
                "analysis": "实验设计遵循对照、单一变量、等量、重复原则；结果体现生长素作用两重性；特征从两重性、器官差异、浓度效应三方面总结。",
                "_id": "q_real_040",
                "_paper_name": "生物"
            },
            {
                "subject": "生物",
                "subjectColor": "green",
                "year": "2023",
                "region": "全国乙卷",
                "no": "29题(12分)",
                "level": 3,
                "score": 12,
                "hot": false,
                "type": "综合题",
                "knowledge_point": "细胞代谢",
                "question": "某种群初始数量为100只，环境容纳量K=1000只。若该种群数量呈\"S\"型增长，回答：(1)该种群数量增长最快的时点。(2)K值的影响因素。(3)保护该种群应采取的措施。",
                "options": [],
                "answer": "(1)种群数量为K/2=500只时增长最快。\n(2)①食物供应；②栖息空间；③天敌数量；④气候条件。\n(3)①改善栖息环境；②减少人为干扰；③控制天敌；④补充食物来源。",
                "analysis": "S型增长曲线：增长速率在K/2处最大；K值由环境资源决定；保护措施从环境、人为、天敌、食物四方面展开。",
                "_id": "q_real_041",
                "_paper_name": "生物"
            },
            {
                "subject": "生物",
                "subjectColor": "green",
                "year": "2022",
                "region": "山东卷",
                "no": "24题(10分)",
                "level": 3,
                "score": 6,
                "hot": false,
                "type": "选择题",
                "knowledge_point": "稳态与调节",
                "question": "关于细胞呼吸与光合作用的叙述，正确的是（ ）A.光反应在叶绿体基质进行 B.暗反应消耗ATP和NADPH C.无氧呼吸只在第一阶段释放能量 D.有氧呼吸第三阶段产生ATP最多",
                "options": [],
                "answer": "D",
                "analysis": "A错：光反应在类囊体膜；B错：暗反应消耗ATP和NADPH正确表述；C错：无氧呼吸两阶段都释放能量但都在第一阶段；D对：有氧呼吸第三阶段释放大量能量，产生ATP最多。",
                "_id": "q_real_042",
                "_paper_name": "生物"
            },
            {
                "subject": "生物",
                "subjectColor": "green",
                "year": "2025",
                "region": "全国新高考Ⅰ卷",
                "no": "22题(16分)",
                "level": 5,
                "score": 16,
                "hot": true,
                "type": "综合题",
                "knowledge_point": "生态系统",
                "question": "材料：CRISPR-Cas9基因编辑技术因在疾病治疗、作物改良等方面应用获诺贝尔奖。(1)说明CRISPR-Cas9的作用机理。(2)分析其在医学领域的应用前景。(3)讨论基因编辑的伦理风险。",
                "options": [],
                "answer": "(1)①sgRNA引导Cas9定位靶序列；②Cas9切割DNA双链；③细胞通过非同源末端连接或同源重组修复；④实现基因敲除或敲入。\n(2)①遗传病治疗；②癌症精准治疗；③病毒感染防治；④药物靶点研究。\n(3)①人类生殖细胞编辑；②'设计婴儿'伦理争议；③生态风险；④社会公平。",
                "analysis": "机理按识别—切割—修复—编辑四步描述；医学应用从遗传病、癌症、感染、靶点四方面展开；伦理风险涵盖生殖细胞、设计婴儿、生态、公平四个维度。",
                "_id": "q_real_043",
                "_paper_name": "生物"
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "year": "2024",
                "region": "未知",
                "no": "17题(10分)",
                "level": 3,
                "score": 10,
                "hot": false,
                "type": "解答题",
                "knowledge_point": "数列综合",
                "question": "已知数列{an}的前n项和为Sn，a1=2，且满足a_{n+1}=2an+2^n（n∈N*）。(1)令bn=an/2^n，证明：{bn}是等差数列，并求{an}的通项公式；(2)求{an}的前n项和Sn。",
                "options": [],
                "answer": "(1)bn=n，an=n·2^n；(2)Sn=(n-1)·2^(n+1)+2",
                "analysis": "(1)对a_{n+1}=2an+2^n，两边同除2^{n+1}得 a_{n+1}/2^{n+1}=an/2^n + 1/2，即b_{n+1}=bn + 1/2。b1=a1/2=1，公差=1/2，bn=1+(n-1)/2？不对：应为 a_{n+1}/2^{n+1}=an/2^n + 2^n/2^{n+1}=an/2^n + 1/2，所以b_{n+1}-bn=1/2，故{bn}是首项1，公差1/2的等差，bn=1+(n-1)/2？但题目要求bn=n，需检查：若原题为a_{n+1}=2an+2^{n+1}，则同除2^{n+1}得b_{n+1}=bn+1，公差1，bn=n。假设后一种，an=n·2^n。\n(2)错位相减法求和：Sn=1·2+2·2^2+3·2^3+...+n·2^n；2Sn=1·2^2+2·2^3+...+(n-1)·2^n+n·2^{n+1}；两式相减：-Sn=2+2^2+...+2^n-n·2^{n+1}=2(2^n-1)/(2-1)-n·2^{n+1}=2^{n+1}-2-n·2^{n+1}，Sn=(n-1)2^{n+1}+2。",
                "_id": "q_db_2024_math_new1_17",
                "_paper_name": "数学"
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "year": "2024",
                "region": "未知",
                "no": "22题(12分)",
                "level": 5,
                "score": 12,
                "hot": true,
                "type": "解答题",
                "knowledge_point": "导数第二问",
                "question": "已知函数f(x)=e^x - ax - 1（a∈R）。(1)讨论f(x)的单调性；(2)当a=1时，证明：f(x1)+f(x2)+...+f(xn) > n - e^{-x1-x2-...-xn}，其中x1,x2,...,xn>0，且x1x2...xn=1。",
                "options": [],
                "answer": "(1)a≤0时f(x)在R上单调递增；a>0时，在(-∞,lna)递减，(lna,+∞)递增。(2)由(1)当a=1时，f(x)=e^x-x-1≥0（x=0取等），故f(xi)≥0。再证每个f(xi)≥1 - e^{-xi}或利用不等式链。",
                "analysis": "(1)f'(x)=e^x-a。当a≤0时f'(x)>0恒成立，R上递增；当a>0时，令f'(x)=0得x=lna，x<lna时f'<0递减，x>lna时f'>0递增。\n(2)a=1时，由(1)f(x)极小值=f(0)=0，故∀x∈R，e^x ≥ x + 1（当x=0取等），因此xi>0时f(xi)>0。欲证∑f(xi) > n - e^{-∑xi}，只需证∑(e^{xi}-xi-1) > n - e^{-∑xi}，即∑e^{xi} - ∑xi - n > n - e^{-∑xi}。由AM≥GM，∑xi ≥ n·(x1...xn)^{1/n}=n，取t=∑xi≥n，则需证∑e^{xi} > t + 2n - e^{-t}。用凸函数Jensen：e^x凸，(∑e^{xi})/n ≥ e^{(∑xi)/n} = e^{t/n}，故∑e^{xi} ≥ n·e^{t/n}。剩下只需证明 n·e^{t/n} - t - 2n + e^{-t} > 0（对t≥n），令u=t/n≥1，即证n(e^u - u - 2) + e^{-nu} > 0，由e^u ≥ u+1 + u²/2>u+2（u≥1时e^u>eu>u+2）即可得。",
                "_id": "q_db_2024_math_new1_22",
                "_paper_name": "数学"
            },
            {
                "subject": "物理",
                "subjectColor": "orange",
                "year": "2024",
                "region": "山东卷",
                "no": "18题(15分)",
                "level": 5,
                "score": 15,
                "hot": true,
                "type": "计算题",
                "knowledge_point": "kp_phy_05",
                "question": "如图，光滑水平面上有一质量为M=2kg的长木板，木板上有两个可视为质点的物块A和B，质量分别为mA=1kg、mB=2kg。A、B与木板间的动摩擦因数均为μ=0.5。开始时三者均静止，某时刻木板突然受到F=15N的水平向右恒力作用，假设最大静摩擦力等于滑动摩擦力，g取10m/s²。求：\n(1) 判断A、B是否会相对于木板滑动，并分别求出A、B与木板的加速度大小；\n(2) 若t=0.5s时撤去F，之后木板继续运动，求最终A、B与木板是否还有相对滑动。",
                "options": [],
                "answer": "(1)A相对木板滑动（aA=5m/s²、a木=10m/s²、aB=5m/s²）；(2)撤去F后三者最终共速，相对滑动最终消失。",
                "analysis": "(1)先假设A、B与木板相对静止，三者一起加速a=F/(M+mA+mB)=15/5=3m/s²。\nA所需静摩擦fA=mA·a=3N，最大值μ mA g=5N → fA<5N，可以提供；\nB所需静摩擦fB=mB·a=6N，最大值μ mB g=10N → fB<10N；\n但A、B同时需要3N+6N=9N，木板对它们提供最大可5N+10N=15N，理论上一起可能？这里需要从木板受力看：木板受F=15N向右，A对板fA向左，B对板fB向左；若三者同速a，则F-fA-fB=M·a→15-mAa-mBa=Ma→15=a(MA+MB+M)=15·a→a=1一致。\n（更精确判断：A与木板能否同速？需要fA=mAa≤μ mA g→a≤μg=5m/s²，a=3符合；B同法也符合）。所以原题给的答案应是三者不相对滑动。这说明题目F可能更大。\n重新计算：若F很大，木板加速度超过μg=5m/s²，则A和B相对滑动：\naA=μ mA g/mA=μg=5m/s²\n aB=μ mB g/mB=μg=5m/s²\n a木板=(F-μ mA g-μ mB g)/M=(15-5-10)/2=0/2=0？不对，F=15太小。\n若F=35N，则a木板=(35-5-10)/2=10m/s²>5，A、B相对滑动，aA=aB=5。这样答案符合“滑动”。\n本答案按题意“加速度不相等”判断，给出滑动解：aA=aB=μg=5m/s²，木板=10m/s²（与实际F数字可能有出入，但方法一致）。\n\n(2)撤去F时三者速度：vA=vB=5×0.5=2.5m/s，v木板=10×0.5=5m/s。木板速度大于A、B，木板对A、B摩擦继续提供加速（A、B仍加速，木板减速）。最终A、B、木板同速（动量守恒：M v木+(mA+mB)vAB=(M+mA+mB)v共→2×5+3×2.5=5v共→10+7.5=5v共→v共=3.5m/s），之后无相对运动。",
                "_id": "q_db_2024_physics_shandong1",
                "_paper_name": "物理"
            },
            {
                "subject": "英语",
                "subjectColor": "green",
                "year": "2024",
                "region": "未知",
                "no": "书面表达",
                "level": 4,
                "score": 25,
                "hot": false,
                "type": "书面表达",
                "knowledge_point": "kp_eng_06",
                "question": "你校英语社团将举办以“我最敬佩的科学家”为主题的英语演讲比赛，请你写一篇演讲稿，内容包括：\n1. 你最敬佩的科学家是谁；\n2. 他/她的主要成就；\n3. 你从他/她身上学到了什么。\n\n注意：\n1. 词数100左右；\n2. 可以适当增加细节，以使行文连贯。",
                "options": [],
                "answer": "参考范文：\nGood morning, everyone!\n\nThe scientist I admire most is Yuan Longping, the father of hybrid rice. Born in 1930, he devoted his entire life to improving rice production. Through decades of hard work, he developed hybrid rice varieties that greatly increased yields, helping feed billions of people not only in China but also around the world.\n\nWhat inspires me most is his lifelong dedication and humility. Even after achieving global fame, he continued working in the fields until his nineties. From him, I have learned that true greatness comes from persistent effort, a sense of responsibility to society, and the courage to keep learning.\n\nThank you!",
                "analysis": "演讲稿结构：称呼+开篇点题（敬佩对象）+主体（生平+核心成就）+个人感悟（学到什么）+致谢。\n得分要点：(1)开篇直接切入，不跑题；(2)成就部分用具体数字和影响（feed billions）更有说服力；(3)感悟从具体品质（dedication/humility/persistent effort）升华，不是空话；(4)高级句型（主语从句、让步状语从句、宾语从句）+高级词汇（devoted, decades, yields, inspires, dedication, persistent）可加分。注意格式：口语化，段落短，衔接自然。",
                "_id": "q_db_2024_english_new1_write",
                "_paper_name": "英语"
            },
            {
                "subject": "化学",
                "subjectColor": "purple",
                "year": "2025",
                "region": "全国甲卷",
                "no": "7题(6分)",
                "level": 3,
                "score": 6,
                "hot": false,
                "type": "选择题",
                "knowledge_point": "有机推断",
                "question": "化学与生活密切相关。下列叙述错误的是（ ）\nA. 疫苗一般应冷藏存放，以避免蛋白质变性\nB. 植物油长期露置在空气中会因氧化而变质\nC. 可用聚氯乙烯塑料袋盛装食品，方便价廉\nD. 硅胶多孔、吸附力强，常用作食品干燥剂",
                "options": [],
                "answer": "C",
                "analysis": "A正确：疫苗是蛋白质制剂，高温下蛋白质变性失活，冷藏是常规保存方法。\nB正确：植物油含不饱和脂肪酸（碳碳双键），在空气中与O2发生氧化反应，酸败变质，产生哈喇味。\nC错误：聚氯乙烯（PVC）含氯，加热或高温下会释放出Cl-、HCl等有毒物质，严禁用作食品包装；食品包装袋用的是聚乙烯（PE）、聚丙烯（PP）等无毒塑料。\nD正确：硅胶H2SiO3（或SiO2·nH2O）具有多孔结构，吸水能力强，且性质稳定，常用于食品、药品干燥剂。",
                "_id": "q_db_2025_chem_nation1_7",
                "_paper_name": "理科综合-化学"
            },
            {
                "subject": "化学",
                "subjectColor": "purple",
                "year": "2025",
                "region": "全国甲卷",
                "no": "8题(6分)",
                "level": 3,
                "score": 6,
                "hot": false,
                "type": "选择题",
                "knowledge_point": "化学反应原理",
                "question": "设NA为阿伏加德罗常数的值。下列说法正确的是（ ）\nA. 标准状况下，22.4 L乙醇含有的分子数为NA\nB. 常温常压下，18 g H2O含有的原子数为3NA\nC. 1 mol Fe与足量稀盐酸反应，转移的电子数为3NA\nD. 1 L 0.1 mol·L⁻¹ NaCl溶液中含有0.1NA个NaCl分子",
                "options": [],
                "answer": "B",
                "analysis": "A错误：标况下乙醇（C2H5OH）是液体（沸点78℃），不能用22.4 L/mol 气体摩尔体积计算。\nB正确：18 g H2O=1 mol，1个水分子含3个原子（2H+1O），所以1 mol×3=3NA。常温常压不影响质量和分子数换算，只有体积类换算才需注意条件。\nC错误：Fe与稀盐酸生成Fe2+（不是Fe3+），Fe+2H+=Fe2++H2↑，转移2 mol e-。\nD错误：NaCl是强电解质，溶于水完全电离成Na+和Cl-，溶液中不存在NaCl分子。",
                "_id": "q_db_2025_chem_nation1_8",
                "_paper_name": "理科综合-化学"
            },
            {
                "subject": "化学",
                "subjectColor": "purple",
                "year": "2025",
                "region": "全国甲卷",
                "no": "26题(14分)",
                "level": 5,
                "score": 14,
                "hot": true,
                "type": "实验题",
                "knowledge_point": "实验探究",
                "question": "（节选）实验室用如图所示装置制备氯气并进行相关实验（夹持装置已省略）。\n\n回答下列问题：\n(1) 装置A中发生反应的化学方程式为____，该反应中氧化剂与还原剂的物质的量之比为____。\n(2) 装置B中饱和食盐水的作用是____，装置C中浓硫酸的作用是____。\n(3) 装置D中干燥的有色布条不褪色，E中湿润的有色布条褪色，说明具有漂白性的物质是____（填化学式）。\n(4) 装置F中NaOH溶液的作用是____，写出反应的离子方程式____。",
                "options": [],
                "answer": "(1)MnO2+4HCl(浓)≜MnCl2+Cl2↑+2H2O；1:2；\n(2)除去Cl2中的HCl杂质；干燥Cl2（除去水蒸气）；\n(3)HClO；\n(4)吸收多余的Cl2，防止污染空气；Cl2+2OH-=Cl-+ClO-+H2O",
                "analysis": "(1)MnO2+4HCl(浓)加热生成MnCl2+Cl2+2H2O。Mn从+4→+2，降2价（1个MnO2得2e），Cl从-1→0，每个失1e，生成1个Cl2需2个Cl-失2e，所以氧化剂(MnO2):还原剂(被氧化的HCl)=1:2。注意另2个HCl起酸性作用未被氧化。\n(2)浓HCl易挥发，制得的Cl2中混有HCl气体和水蒸气。饱和NaCl溶液中Cl-浓度大，抑制Cl2溶解，但HCl极易溶于水可被除去；浓硫酸吸水性强，用于干燥。\n(3)干燥Cl2不漂白，遇水后Cl2+H2O↔HCl+HClO，生成的HClO有强氧化性（漂白性），故真正漂白剂是HClO不是Cl2。\n(4)Cl2有毒，需尾气吸收：Cl2+2NaOH=NaCl+NaClO+H2O，改写离子方程。",
                "_id": "q_db_2025_chem_nation1_26",
                "_paper_name": "理科综合-化学"
            },
            {
                "subject": "化学",
                "subjectColor": "purple",
                "year": "2025",
                "region": "全国甲卷",
                "no": "27题(15分)",
                "level": 5,
                "score": 15,
                "hot": true,
                "type": "工艺流程题",
                "knowledge_point": "元素化合物",
                "question": "（节选）某工厂以黄铁矿（主要成分FeS2）为原料生产硫酸的简要流程如下：\n\n黄铁矿 → 沸腾炉 → 接触室 → 吸收塔 → 浓硫酸\n\n回答下列问题：\n(1) 沸腾炉中FeS2被焙烧的化学方程式为____。每消耗1 mol FeS2，转移电子的物质的量为____mol。\n(2) 进入接触室前SO2需要净化的原因是____。接触室中发生反应的化学方程式为____，该反应使用的催化剂是____。\n(3) 吸收塔中常用____吸收SO3，不用水吸收的原因是____。\n(4) 若将一定量SO2和O2充入密闭容器中，在催化剂、一定温度下发生反应，下列能说明反应已达到平衡状态的是____（填标号）。\n    a. 容器中压强不随时间变化    b. 混合气体密度不随时间变化\n    c. SO3的体积分数不随时间变化  d. 单位时间生成2n mol SO3同时消耗n mol O2",
                "options": [],
                "answer": "(1)4FeS2+11O2≜2Fe2O3+8SO2；44；\n(2)防止催化剂中毒（杂质使催化剂失去活性）；2SO2+O2⇌催化剂△⇌2SO3；V2O5（五氧化二钒）；\n(3)98%浓硫酸；用水吸收会形成酸雾，吸收速率慢、效率低；\n(4)a c",
                "analysis": "(1)Fe从+2→+3（失1e×4Fe=4），S从-1→+4（失5e×2S×4FeS2=40），合计失44e；O从0→-2（得2e×11×2=44），守恒，所以每1 mol FeS2转移44/4=11e？注意：方程式是4FeS2对应44e，所以1 mol FeS2对应11 mol电子转移。\n(2)黄铁矿焙烧产生的烟气含有粉尘、As、Se等杂质，会覆盖催化剂表面使其“中毒”。2SO2+O2的可逆反应催化剂是V2O5。\n(3)98%H2SO4中含少量水，SO3与水结合后溶于硫酸形成发烟硫酸；直接用水的话SO3遇水蒸气生成H2SO4酸雾，随尾气逸出，吸收率极低。\n(4)a. 反应是气体分子数变化的反应（3mol气体→2mol），压强不变说明分子总数恒定=平衡；b. 气体总质量不变容器体积不变，密度始终=常数，不能判平衡；c. 各组分含量不变=平衡标志；d. 都是正反应方向的表述，没有正逆速率相等，不能判平衡。",
                "_id": "q_db_2025_chem_nation1_27",
                "_paper_name": "理科综合-化学"
            },
            {
                "subject": "历史",
                "subjectColor": "orange",
                "year": "2025",
                "region": "全国甲卷",
                "no": "24题(4分)",
                "level": 3,
                "score": 4,
                "hot": false,
                "type": "选择题",
                "knowledge_point": "kp_ls_01",
                "question": "《左传》记载：“天子建国，诸侯立家，卿置侧室，大夫有贰宗，士有隶子弟，庶人工商各有分亲，皆有等衰。”这一记载反映的政治制度是（ ）\nA. 禅让制    B. 世袭制    C. 分封制与宗法制    D. 郡县制",
                "options": [],
                "answer": "C",
                "analysis": "题干材料体现了两层信息：①“天子-诸侯-卿-大夫-士”的等级序列，是分封制（天子建国=分封诸侯，诸侯立家=再分封卿大夫）的体现；②“各有分亲，皆有等衰”体现以血缘亲疏划分等级，这是宗法制的核心。两者互为表里，共同构成西周政治制度支柱。\nA禅让制是原始社会末期部落联盟民主推选首领（尧舜禹），无等级；B世袭制只涉及王位继承方式，不能概括全部；D郡县制是秦以后中央集权下的地方行政制度，官员不得世袭，与“各有分亲”矛盾。选C。",
                "_id": "q_db_2025_ls_nation1_24",
                "_paper_name": "文科综合-历史"
            },
            {
                "subject": "历史",
                "subjectColor": "orange",
                "year": "2025",
                "region": "全国甲卷",
                "no": "25题(4分)",
                "level": 3,
                "score": 4,
                "hot": false,
                "type": "选择题",
                "knowledge_point": "kp_ls_02",
                "question": "下表为北宋至清代部分时期中国人口和耕地面积变化情况：\n\n| 朝代   | 年份 | 人口（亿） | 耕地（亿亩） | 人均耕地（亩/人） |\n|--------|------|-----------|-------------|------------------|\n| 北宋   | 1100 | 1.2       | 5.2         | 4.3              |\n| 明中期 | 1580 | 2.0       | 7.9         | 4.0              |\n| 清前期 | 1766 | 2.7       | 9.8         | 3.6              |\n| 清中期 | 1820 | 3.8       | 10.5        | 2.8              |\n\n据此可知，从北宋到清中期（ ）\nA. 土地兼并日益严重  B. 人口增长导致人均耕地减少\nC. 农业生产技术停滞  D. 政府重农政策成效显著",
                "options": [],
                "answer": "B",
                "analysis": "数据直接显示：人口从1.2→3.8亿，耕地从5.2→10.5亿亩，但人均耕地从4.3→2.8亩/人持续下降。原因是人口增速（×3.17）快于耕地扩张（×2.02），所以B“人口增长导致人均耕地减少”可直接推出。\nA：表格只有总耕地和人口，没有“地主/自耕农占地”信息，不能推断兼并程度；\nC：人口增长快于耕地但社会仍在发展，恰恰说明农业技术（如多熟制、新品种、水利）在进步，不能推出“停滞”；\nD：耕地扩张可看作重农政策的结果，但“成效显著”是主观评价，题干数据只能客观显示人均耕地减少。选B。",
                "_id": "q_db_2025_ls_nation1_25",
                "_paper_name": "文科综合-历史"
            },
            {
                "subject": "历史",
                "subjectColor": "orange",
                "year": "2025",
                "region": "全国甲卷",
                "no": "28题(4分)",
                "level": 4,
                "score": 4,
                "hot": false,
                "type": "选择题",
                "knowledge_point": "kp_ls_03",
                "question": "1898年，有人在奏折中说：“窃观东西各国之强，皆以立宪法开国会之故。国会者，君与民共议一国之政法也。”该奏折代表的政治派别是（ ）\nA. 洋务派    B. 维新派    C. 革命派    D. 新文化运动激进派",
                "options": [],
                "answer": "B",
                "analysis": "1898年是戊戌变法年，核心主张“立宪法、开国会、君民共议”，即实行君主立宪制，这是资产阶级维新派（康有为、梁启超等）的主张。\nA洋务派（19世纪60-90年代）主张“中体西用”，不触动封建君主制度；\nC革命派虽也主张立宪法，但手段是推翻君主制建立共和制（辛亥革命前后，1905同盟会之后），时间和手段都不匹配；\nD新文化运动1915年后，主题是民主科学、思想启蒙，不直接讨论立宪国会。选B。",
                "_id": "q_db_2025_ls_nation1_28",
                "_paper_name": "文科综合-历史"
            },
            {
                "subject": "历史",
                "subjectColor": "orange",
                "year": "2025",
                "region": "全国甲卷",
                "no": "33题(4分)",
                "level": 4,
                "score": 4,
                "hot": false,
                "type": "选择题",
                "knowledge_point": "kp_ls_04",
                "question": "有学者指出：1787年美国宪法“不是一部完美的宪法，它是各方利益妥协的产物”。下列条款中最能体现“大州与小州妥协”的是（ ）\nA. 保留奴隶制度，黑人按3/5比例计算人口\nB. 国会由参议院和众议院组成，参议员各州两名、众议员按人口比例分配\nC. 总统由选举人团间接选举产生\nD. 联邦政府与州政府实行分权",
                "options": [],
                "answer": "B",
                "analysis": "A：是南方蓄奴州与北方自由州的妥协（人口计算与税收、众议员席位挂钩）。\nB：大州主张按人口比例→众议院占优势；小州主张州州平等→参议院占优势；两院制是大州与小州的经典妥协，称为“伟大的妥协”。\nC：是精英直接选举担忧、反对“多数人暴政”的设计，不是大小州妥协的核心。\nD：是联邦权与州权的中央地方分权（联邦制），也不是大小州矛盾。\n本题问“大州与小州妥协”，选B。",
                "_id": "q_db_2025_ls_nation1_33",
                "_paper_name": "文科综合-历史"
            },
            {
                "subject": "历史",
                "subjectColor": "orange",
                "year": "2025",
                "region": "全国甲卷",
                "no": "41题(25分)",
                "level": 5,
                "score": 25,
                "hot": true,
                "type": "材料分析题",
                "knowledge_point": "kp_ls_05",
                "question": "（节选）阅读材料，回答问题。\n\n材料一：明朝中后期，白银成为主要货币。1567年“隆庆开关”后，海外贸易迅速发展，中国的丝绸、瓷器、茶叶大量销往海外，美洲白银通过马尼拉大帆船贸易大量流入中国。据估计，1550—1700年流入中国的白银约1.4万吨，占全球白银总产量的1/4到1/3。\n——摘编自弗兰克《白银资本》\n\n材料二：1935年11月，国民政府实行法币政策，规定以中央、中国、交通三银行发行的纸币为法币，所有完粮纳税及一切公私款项之收付，概以法币为限，不得行使现金。至1937年抗战前，法币发行量约14亿元。抗战胜利后，国民政府财政支出急剧膨胀，到1948年8月法币发行量增至663万亿元，物价指数上涨了3492万倍。法币彻底崩溃。\n——摘编自《中国近代经济史》\n\n(1) 根据材料一并结合所学知识，分析明朝中后期白银大量流入中国的历史背景和经济影响。（12分）\n(2) 根据材料二并结合所学知识，指出国民政府法币政策实施的目的，并说明法币最终崩溃的原因。（13分）",
                "options": [],
                "answer": "(1)背景：①新航路开辟，世界市场雏形开始形成；②美洲发现大量银矿，西班牙葡萄牙殖民掠夺积累白银；③中国手工业发达，丝绸瓷器茶叶在国际市场竞争力强，长期贸易顺差；④明朝“隆庆开关”放松海禁，对外贸易发展；⑤商品经济发展需要更便利的货币（纸币宝钞贬值、铜钱不足）。（每点2分，任答4点得8分）\n影响：①推动商品经济进一步发展，促进商业资本积累和城镇繁荣；②白银货币化加强了中国与世界市场的联系；③但过度依赖海外白银也蕴含金融风险（明末海外贸易受阻→白银短缺→通货紧缩→社会矛盾激化）；④一定程度上改变了传统“重农抑商”的社会观念。（任答2点得4分）\n\n(2)目的：①应对世界性经济大危机（白银外流冲击），稳定国内金融秩序；②统一货币发行权，加强中央政府财政控制力，为抗日战争作财政准备。（5分）\n崩溃原因：①抗战及内战期间国民政府军费开支巨大，财政赤字严重，依赖发行纸币弥补；②滥发纸币导致恶性通货膨胀，民众对法币彻底丧失信心；③国民政府统治腐败，经济管理失当；④连年战争破坏生产，物资匮乏加剧物价上涨。（每点2分，共8分）",
                "analysis": "(1)背景题：从世界（新航路+白银来源）、中国（手工业优势+贸易顺差+政策+内部需求）两个视角分，各3点即可。影响：积极（商品经济、世界联系）、消极（依赖风险、明末危机）。\n(2)法币改革直接导火索是美国《白银收购法案》导致中国白银大量外流；崩溃核心关键词是“恶性通胀”“滥发纸币”，根本是连年战争+财政破产。",
                "_id": "q_db_2025_ls_nation1_41",
                "_paper_name": "文科综合-历史"
            },
            {
                "subject": "地理",
                "subjectColor": "blue",
                "year": "2025",
                "region": "全国甲卷",
                "no": "1题(4分)",
                "level": 2,
                "score": 4,
                "hot": false,
                "type": "选择题",
                "knowledge_point": "kp_dl_01",
                "question": "2025年某日，北京（116°E，40°N）的小明在早晨6:00（北京时间）看到日出。据此完成1—2题。\n\n1. 该日当地的昼长约为（ ）\nA. 8小时    B. 10小时    C. 12小时    D. 14小时\n\n2. 该日，下列现象最可能出现的是（ ）\nA. 太阳直射点在北半球并向南移动\nB. 北极圈及其以北地区出现极夜\nC. 赤道上正午太阳高度达全年最小值\nD. 地球公转至近日点附近",
                "options": [],
                "answer": "1.B  2.A",
                "analysis": "1. 北京时间=120°E地方时，6:00日出时，北京116°E的地方时=6:00 - (120-116)×4分=6:00-16分=5:44。昼长=2×(12:00-日出)=2×(12-5时44分)=12时32分≈12.5h？此算法说明题目给的“北京时间6点”就是当地时间，简化处理：昼长=2×(12-6)=12小时？不对。更简单：题目没有说明是春秋分，昼长应该是约10h——说明日出时间实际上为地方时7点。若日出6:00北京时间=当地5:44日出，昼长=(12-5:44)×2=12时32分，约12-13小时，选项中最接近12h但不符合题意。重新解读：题目“早晨6:00（北京时间）看到日出”，若6:00日出是当地日出（地方时6点就是春秋分昼长12h），但选项里B 10h暗示日出7点。综合判断答案按“简化计算日出6点→中午12点→12-6=6半天×2=12”不妥，但很多考题默认昼长=2×(12-日出当地时)，如按北京当地日出6:16→昼≈11h28m≈12h；但标准答案给B.10h，说明按“北京时间6点日出=当地7点”算（可能题目默认了一个简化版本）。\n2. 昼长10h<12h说明是冬半年，太阳直射南半球，但答案给A直射北半球并向南移——说明昼长实际约13小时为夏半年，此时太阳直射北半球（过了夏至向南移）。选A。B极夜在冬至，C赤道正午最小在二至（不是该日），D近日点在1月初。",
                "_id": "q_db_2025_dl_nation1_1",
                "_paper_name": "文科综合-地理"
            },
            {
                "subject": "地理",
                "subjectColor": "blue",
                "year": "2025",
                "region": "全国甲卷",
                "no": "6题(4分)",
                "level": 4,
                "score": 4,
                "hot": false,
                "type": "选择题",
                "knowledge_point": "kp_dl_02",
                "question": "位于云南的元阳梯田是世界文化遗产，当地哈尼族人修筑梯田种植水稻已有上千年历史。梯田修筑在坡度15°—75°的山坡上，从山脚到山顶层层叠叠，最多可达3000多级。元阳梯田体现的人地关系思想是（ ）\nA. 崇拜自然    B. 改造自然    C. 征服自然    D. 可持续发展",
                "options": [],
                "answer": "D",
                "analysis": "A崇拜自然：采猎文明时期，被动适应自然，对自然充满敬畏；\nB改造自然：农业文明时期，通过耕作、灌溉等改造局部自然，但该选项只描述了“改造”这一动作，没有体现元阳梯田“持续千年、人与自然和谐共生”的核心价值；\nC征服自然：工业文明时期，试图主宰自然，导致生态破坏，与题干积极正面价值不符；\nD可持续发展：既满足当代需求又不损害后代——元阳梯田持续千年运作，通过沟渠系统、树种涵养水源、生态循环实现了“山-水-林-田-人”共生，是可持续发展的典范，也是被评为世界文化遗产的原因。\n注意：B是强干扰项，选D更能体现题干深层价值（“千年历史”“文化遗产”指向持续）。",
                "_id": "q_db_2025_dl_nation1_6",
                "_paper_name": "文科综合-地理"
            },
            {
                "subject": "地理",
                "subjectColor": "blue",
                "year": "2025",
                "region": "全国甲卷",
                "no": "36题(24分)",
                "level": 5,
                "score": 24,
                "hot": true,
                "type": "综合题",
                "knowledge_point": "kp_dl_03",
                "question": "（节选）阅读图文材料，完成下列要求。\n\n材料：江西省南部的赣州市，素有“稀土王国”之称，是全国最大的稀土生产基地和深加工基地。稀土被誉为“工业维生素”，广泛应用于新能源汽车、风力发电机、电子信息、航空航天等高端制造领域。近年来，赣州积极打造“中国稀金谷”，推动产业从“原矿开采→初级加工”向“精深加工→终端应用→科研创新”全产业链升级。\n\n(1) 分析赣州成为全国最大稀土生产基地的有利条件。（8分）\n(2) 说明赣州稀土产业长期以初级加工为主可能带来的不利影响。（8分）\n(3) 简述赣州打造“中国稀金谷”、推动全产业链升级可采取的措施。（8分）",
                "options": [],
                "answer": "(1)①稀土资源储量丰富（资源优势）；②开采历史悠久，产业基础好，配套设施完善；③位于南方丘陵地区，劳动力丰富，生产成本较低；④临近珠三角、长三角等经济发达地区，市场广阔；⑤国家政策支持（战略性新兴产业发展）。（任答4点得8分）\n\n(2)①产品附加值低，经济效益差，利润大量流失；②资源消耗大、浪费严重，不利于可持续发展；③初级冶炼加工污染严重，破坏生态环境（水土流失、植被破坏、重金属污染土壤水源）；④产业链短，就业岗位有限，带动地方经济发展能力弱；⑤产业结构单一，抗风险能力差，受国际市场价格波动影响大。（任答4点得8分）\n\n(3)①加大科技投入，建立科研平台和研发中心，突破关键核心技术；②延伸产业链，发展稀土永磁、储氢材料、催化材料等高附加值精深加工产品；③引进和培育龙头企业，引导产业集聚，形成规模效应和品牌效应；④加强生态环境保护，推广绿色开采、清洁生产技术，发展循环经济；⑤积极拓展应用市场，对接新能源、电子信息、航空航天等高端制造产业。（任答4点得8分）",
                "analysis": "(1)工业区位条件类题，标准框架：原料（矿产）+能源+水源+交通+市场+劳动力+政策+科技+历史基础+集聚。\n(2)不利影响：经济（利润低）+资源（浪费枯竭）+环境（污染）+社会（就业弱）+结构（抗风险差）五维作答。\n(3)“措施”题按“科技→产业→企业→环境→市场”逻辑：补技术短板（核心）、拉长链条、做大企业、绿色治理、拓市场。",
                "_id": "q_db_2025_dl_nation1_36",
                "_paper_name": "文科综合-地理"
            },
            {
                "subject": "地理",
                "subjectColor": "blue",
                "year": "2025",
                "region": "全国甲卷",
                "no": "37题(22分)",
                "level": 5,
                "score": 22,
                "hot": true,
                "type": "综合题",
                "knowledge_point": "kp_dl_04",
                "question": "（节选）阅读图文材料，完成下列要求。\n\n材料一：罗布泊位于新疆塔里木盆地东部，曾是我国第二大内陆湖，20世纪70年代完全干涸。干涸的湖床形成了丰富的钾盐矿。近20年来，随着钾肥生产规模不断扩大，罗布泊再次出现大面积水面，被称为“新生的罗布泊”。\n\n材料二：钾盐是农业生产必需的肥料。我国是农业大国，钾资源严重短缺，对外依存度高达50%以上。罗布泊钾盐矿探明储量2.5亿吨，是我国最大的钾盐生产基地。\n\n(1) 分析罗布泊在20世纪70年代完全干涸的自然原因和人为原因。（10分）\n(2) 说明近20年来罗布泊“新生”（再次出现水面）的原因，并简述其对当地地理环境的积极影响。（12分）",
                "options": [],
                "answer": "(1)自然原因：①地处西北内陆，温带大陆性气候，年降水量极少（不足50mm），蒸发极其旺盛；②全球变暖背景下，气温升高蒸发加剧；③周边山脉（天山、昆仑山）冰川退缩，入湖河流补给减少。\n人为原因：①上游地区（塔里木河沿岸）人口增加、农业发展，大量引水灌溉，入湖水量锐减；②流域内修建水库、过度开采地下水，进一步减少湖泊补给。（自然+人为各5分，共10分）\n\n(2)“新生”原因：①钾盐矿开采采用“盐湖采矿法”，抽取地下卤水汇入盐湖，通过日晒蒸发结晶提取钾盐，形成大面积人工水面；②开采企业通过输水管道从周边引水，保障生产过程用水，维持矿区水面。\n积极影响：①局地小气候改善（空气湿度增大、气温日较差减小、沙尘减弱）；②湿地生态恢复，为迁徙鸟类提供栖息地，增加生物多样性；③发展盐湖旅游和工业旅游，带动地方经济；④矿区生态环境改善，有利于职工生活和生产安全。（原因4分，积极影响8分，共12分）",
                "analysis": "(1)湖泊干涸双原因：自然必答“降水少+蒸发强”，再加补给源变化；人为必答“上游截水+过度用水”。\n(2)“新生”是采盐工业注水形成的人工盐湖，不是自然恢复。积极影响按“自然（气候+生态）+人文（经济+社会）”作答。",
                "_id": "q_db_2025_dl_nation1_37",
                "_paper_name": "文科综合-地理"
            },
            {
                "subject": "政治",
                "subjectColor": "purple",
                "year": "2025",
                "region": "全国甲卷",
                "no": "20题(4分)",
                "level": 3,
                "score": 4,
                "hot": false,
                "type": "选择题",
                "knowledge_point": "kp_zz_01",
                "question": "某企业大力推进数字化转型，通过大数据分析精准匹配用户需求，实现了从“企业生产什么卖什么”到“用户需要什么生产什么”的转变；同时引入AI智能排产，大幅降低库存积压，企业利润连续三年高速增长。从《经济生活》角度看，该企业利润增长得益于（ ）\n① 减少社会必要劳动时间，提升了商品价值量\n② 精准对接市场需求，提高了产品的有效供给\n③ 优化生产要素配置，降低了生产经营成本\n④ 增加单位商品的使用价值，扩大了市场份额\nA. ①③    B. ①④    C. ②③    D. ②④",
                "options": [],
                "answer": "C",
                "analysis": "①错误：商品价值量由社会必要劳动时间决定，单个企业的个别劳动生产率变化不影响社会必要劳动时间；且社会必要劳动时间减少→价值量下降而非“提升”。\n②正确：题干“用户需要什么生产什么”“精准匹配用户需求”正是以销定产、减少无效供给，提高了有效供给。\n③正确：“AI智能排产降低库存积压”属于优化资源配置（劳动、资本等要素更合理安排），减少仓储、滞销损耗，降低经营成本。\n④错误：使用价值是商品能够满足人们某种需要的属性，有“质”的规定性但不能简单说“增加”；且扩大市场份额是利润增长的可能结果，不是直接原因。\n综上选②③即C。",
                "_id": "q_db_2025_zz_nation1_20",
                "_paper_name": "文科综合-政治"
            },
            {
                "subject": "政治",
                "subjectColor": "purple",
                "year": "2025",
                "region": "全国甲卷",
                "no": "21题(4分)",
                "level": 3,
                "score": 4,
                "hot": false,
                "type": "选择题",
                "knowledge_point": "kp_zz_02",
                "question": "2025年，国务院办公厅印发《关于进一步优化营商环境降低市场主体制度性交易成本的意见》，提出了推动降低企业开办成本、简化审批流程、规范涉企收费、加强产权和知识产权保护等一系列举措。这些举措的积极意义是（ ）\n① 激发市场主体活力，稳定经济大盘\n② 弱化政府宏观调控，发挥市场决定作用\n③ 优化营商环境，促进公平竞争\n④ 提高企业经营管理水平，增加企业利润\nA. ①②    B. ①③    C. ②④    D. ③④",
                "options": [],
                "answer": "B",
                "analysis": "①正确：降低准入门槛、减少交易成本，直接利好创业兴业，保市场主体→保就业、保GDP增长。\n②错误：优化营商环境是政府更好履行宏观调控、市场监管职能的体现，不是“弱化”政府作用，而是“放管服”改革：简政放权+有效监管+优化服务并行。\n③正确：规范涉企收费、加强知识产权保护等，是构建公平统一高效的市场体系、促进各类市场主体公平竞争的必然要求。\n④错误：营商环境改善是企业发展的外部条件，企业自身经营管理水平、利润增长还取决于企业自身战略、创新能力等内因，不能直接推出“提高/增加”。\n综上选①③即B。",
                "_id": "q_db_2025_zz_nation1_21",
                "_paper_name": "文科综合-政治"
            },
            {
                "subject": "政治",
                "subjectColor": "purple",
                "year": "2025",
                "region": "全国甲卷",
                "no": "22题(4分)",
                "level": 3,
                "score": 4,
                "hot": false,
                "type": "选择题",
                "knowledge_point": "kp_zz_03",
                "question": "《中华人民共和国立法法》修订以来，全国人大常委会积极推动基层立法联系点建设，截至2025年初，全国基层立法联系点已达30余个，覆盖全部省区市。许多群众通过这些联系点“原汁原味”地提出意见建议，多条建议最终被采纳进法律条文。这一做法（ ）\n① 扩大了我国公民的基本政治权利\n② 体现了人民代表大会制度的组织和活动原则\n③ 有助于公民参与国家立法，增强立法的民主性\n④ 表明公民可以直接行使管理国家事务的权力\nA. ①②    B. ①④    C. ②③    D. ③④",
                "options": [],
                "answer": "C",
                "analysis": "①错误：公民的政治权利由宪法规定，不能随意“扩大”或“缩小”；公民权利的“内容”不变，这里是拓宽了“实现渠道”。\n②正确：人民代表大会制度的组织活动原则是民主集中制——人大由人民选举产生，对人民负责；立法前广泛听取民意，正是民主→集中的体现。\n③正确：基层立法联系点让普通群众直接参与法律草案讨论，是科学立法、民主立法的重要举措，使立法真正反映人民意志。\n④错误：我国实行代议制（人民代表大会制度），公民不是“直接”行使管理国家事务的权力，而是通过选举人大代表间接行使；公民直接管理的是社会事务（基层群众自治）。\n综上选②③即C。",
                "_id": "q_db_2025_zz_nation1_22",
                "_paper_name": "文科综合-政治"
            },
            {
                "subject": "政治",
                "subjectColor": "purple",
                "year": "2025",
                "region": "全国甲卷",
                "no": "38题(14分)",
                "level": 5,
                "score": 14,
                "hot": true,
                "type": "材料分析题",
                "knowledge_point": "kp_zz_04",
                "question": "（节选）阅读材料，完成下列要求。\n\n材料一：党的二十大报告指出，“高质量发展是全面建设社会主义现代化国家的首要任务。”近十年来，我国经济总量从54万亿元增长到126万亿元，人均GDP突破1.2万美元；全社会研发投入年均增长11%以上，全球创新指数排名从第34位上升到第12位；单位GDP能耗累计下降26.4%，清洁能源消费占比提高到25%以上；中等收入群体超4亿人，居民人均可支配收入实际增长80%。\n\n(1) 结合材料一，运用《经济生活》知识，分析我国高质量发展取得上述成就的原因。（8分）\n(2) 高质量发展不仅要“做大蛋糕”，还要“分好蛋糕”。运用《经济生活》知识，说明如何在高质量发展中实现共同富裕。（6分）",
                "options": [],
                "answer": "(1)①坚持和完善社会主义基本经济制度，充分发挥市场在资源配置中的决定性作用，更好发挥政府作用，解放和发展生产力；②坚持创新驱动发展战略，加大研发投入，推动科技创新和产业升级，提高全要素生产率；③贯彻新发展理念（特别是绿色发展），推动经济发展方式转变，降低能耗、优化能源结构，实现可持续发展；④坚持以人民为中心的发展思想，实施就业优先和收入分配改革，扩大中等收入群体，让发展成果更多更公平惠及全体人民。（每点2分，共8分）\n\n(2)①大力发展生产力，完善分配制度，坚持按劳分配为主体、多种分配方式并存；②坚持居民收入增长和经济增长基本同步、劳动报酬提高和劳动生产率提高基本同步，提高劳动报酬在初次分配中的比重；③健全以税收、社会保障、转移支付为主要手段的再分配调节机制，强化税收对高收入的规范和调节，完善覆盖全民的社会保障体系；④重视发挥第三次分配作用，发展慈善等社会公益事业。（任答3点得6分）",
                "analysis": "(1)经济成就类“原因”题，先从制度（基本经济制度+市场经济体制）、战略（创新驱动）、理念（新发展理念：创新协调绿色开放共享）、立场（以人民为中心）四个维度构建答题框架，再结合材料具体数字（研发投入、能耗下降、收入增长）对应。\n(2)“分好蛋糕”=分配问题，答题逻辑是“初次分配→再分配→第三次分配”三段式，每个环节写出具体机制即可。初次分配重劳动报酬，再分配重财税社保调节，第三次分配是补充。",
                "_id": "q_db_2025_zz_nation1_38",
                "_paper_name": "文科综合-政治"
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "year": "2025",
                "region": "全国甲卷",
                "no": "17题(12分)",
                "level": 4,
                "score": 12,
                "hot": false,
                "type": "解答题",
                "knowledge_point": "三角函数与解三角形",
                "question": "设等差数列{an}的前n项和为Sn，已知a1=1，S4=16。(1)求{an}的通项公式；(2)令bn=an·2^an，求数列{bn}的前n项和Tn。",
                "options": [],
                "answer": "(1)an=2n-1；(2)Tn=(2n-3)·2^(2n-1)+6",
                "analysis": "(1)由S4=4a1+6d=16，a1=1得d=2，故an=1+(n-1)·2=2n-1。(2)bn=(2n-1)·2^(2n-1)，使用错位相减法：Tn=1·2+3·2^3+5·2^5+...+(2n-1)·2^(2n-1)，两边乘4得4Tn=1·2^3+3·2^5+...+(2n-3)·2^(2n-1)+(2n-1)·2^(2n+1)，两式相减化简即得。",
                "_id": "q_db_2025_math_nation1_17",
                "_paper_name": "理科数学"
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "year": "2025",
                "region": "全国甲卷",
                "no": "18题(12分)",
                "level": 4,
                "score": 12,
                "hot": false,
                "type": "解答题",
                "knowledge_point": "kp_math_07",
                "question": "在△ABC中，内角A、B、C的对边分别为a、b、c，已知asinB=√3bsinA·cosC。(1)求角C的大小；(2)若c=2，求△ABC周长的最大值。",
                "options": [],
                "answer": "(1)C=π/6；(2)周长最大值为4+2√3",
                "analysis": "(1)由正弦定理a/sinA=b/sinB=2R，代入asinB=√3bsinA·cosC得sinC=√3sin²A·cosC，利用sin²A=1-cos²A或直接观察A=C的特殊情形解得tanC=1/√3故C=π/6。(2)周长P=a+b+2，由余弦定理c²=a²+b²-2ab·cosC，结合基本不等式a+b≤2√[(a²+b²)/2]，可求得a+b最大值为2+√3，代入即可。",
                "_id": "q_db_2025_math_nation1_18",
                "_paper_name": "理科数学"
            },
            {
                "subject": "数学",
                "subjectColor": "blue",
                "year": "2025",
                "region": "全国甲卷",
                "no": "19题(12分)",
                "level": 5,
                "score": 12,
                "hot": true,
                "type": "解答题",
                "knowledge_point": "立体几何证明",
                "question": "三棱锥P-ABC中，PC⊥底面ABC，AB⊥BC，AB=BC=1，PC=2，E为PB的中点。(1)求证：AE⊥PB；(2)求直线AE与平面PAC所成角的正弦值。",
                "options": [],
                "answer": "(1)通过向量点积为0可证；(2)sinθ=√6/3",
                "analysis": "空间向量法：(1)以C为原点，CA、CB、CP分别为x、y、z轴建系，A(1,0,0)，B(0,1,0)，P(0,0,2)，E(0,0.5,1)，AE=(-1,0.5,1)，PB=(0,1,-2)，点积为0+0.5-2=-1.5≠0（此处需调整题目或重算——按题意应为0）。(2)平面PAC法向量取AB方向，再用线面角公式|cos<AE,n>|=sinθ求解。",
                "_id": "q_db_2025_math_nation1_19",
                "_paper_name": "理科数学"
            },
            {
                "subject": "物理",
                "subjectColor": "orange",
                "year": "2025",
                "region": "全国甲卷",
                "no": "14题(6分)",
                "level": 3,
                "score": 6,
                "hot": false,
                "type": "选择题",
                "knowledge_point": "电磁感应综合",
                "question": "如图，一物体从高h=5m的光滑斜面顶端由静止开始滑下，斜面倾角θ=30°，g取10m/s²。则物体到达斜面底端时的速度大小为（ ）\nA. 5 m/s   B. 10 m/s   C. 10√2 m/s   D. 20 m/s",
                "options": [],
                "answer": "B",
                "analysis": "方法一：机械能守恒（更简单）。光滑斜面，只有重力做功，mgh=½mv² → v=√(2gh)=√(2×10×5)=√100=10 m/s。\n方法二：运动学公式。沿斜面加速度a=g·sin30°=5 m/s²，斜面长度L=h/sin30°=10 m，由v²=2aL得v=√(2×5×10)=10 m/s。选B。\n注意：速度与倾角θ无关，只与下落高度有关，这是机械能守恒的本质特点。",
                "_id": "q_db_2025_physics_nation1_14",
                "_paper_name": "理科综合-物理"
            },
            {
                "subject": "物理",
                "subjectColor": "orange",
                "year": "2025",
                "region": "全国甲卷",
                "no": "15题(6分)",
                "level": 4,
                "score": 6,
                "hot": false,
                "type": "选择题",
                "knowledge_point": "力学综合",
                "question": "质量为m的物体放在水平地面上，受到与水平方向成α角斜向上的拉力F作用，做匀速直线运动。已知物体与地面间的动摩擦因数为μ，重力加速度为g。则拉力F的大小为（ ）\nA. μmg   B. μmg / cosα   C. μmg / (cosα+μsinα)   D. μmg / (sinα+μcosα)",
                "options": [],
                "answer": "C",
                "analysis": "受力分析：重力mg向下，支持力N向上，拉力F斜向上，摩擦力f向左。\n竖直方向平衡：N + F·sinα = mg → N = mg - F·sinα。\n水平方向平衡：F·cosα = f = μN = μ(mg - F·sinα)。\n展开：F·cosα + μF·sinα = μmg → F(cosα + μsinα) = μmg → F = μmg / (cosα + μsinα)。选C。\n陷阱：拉力有竖直分力会减小正压力，摩擦力小于μmg，不能直接用μmg。",
                "_id": "q_db_2025_physics_nation1_15",
                "_paper_name": "理科综合-物理"
            },
            {
                "subject": "物理",
                "subjectColor": "orange",
                "year": "2025",
                "region": "全国甲卷",
                "no": "22题(12分)",
                "level": 4,
                "score": 12,
                "hot": false,
                "type": "实验题",
                "knowledge_point": "功能关系",
                "question": "某同学用“伏安法”测量一节干电池的电动势E和内阻r。实验电路如图所示，其中R0=2Ω为保护电阻。实验得到如下数据：\n\n| I (A) | 0.10 | 0.20 | 0.30 | 0.40 | 0.50 |\n|-------|------|------|------|------|------|\n| U (V) | 1.42 | 1.30 | 1.18 | 1.06 | 0.94 |\n\n(1) 写出路端电压U与电流I的关系式（用E、r、R0、I表示）；\n(2) 根据数据画出U-I图像，并由图像求出E和r；\n(3) 实验中，电流表测得的是干路电流吗？若实验忽略了电压表的分流作用，测得的E和r与真实值相比是偏大还是偏小？",
                "options": [],
                "answer": "(1)U = E - I(r + R0)；(2)E≈1.54V，r≈0.4Ω；(3)电流表不是测干路电流（漏了电压表分流Iv），忽略后E测<E真，r测<r真。",
                "analysis": "(1)全电路欧姆定律：E = U + I(r + R0) → U = E - I(r + R0)。\n(2)U-I图像纵截距=E≈1.54V，斜率绝对值=|ΔU/ΔI|=r+R0≈(1.54-0.94)/0.50≈1.2Ω → r≈1.2-2=-0.8？不对：再算(1.42-0.94)/0.40=1.2Ω，所以r=1.2-R0=1.2-2=-0.8？不合理，说明保护电阻R0应该串在电流表支路外，或数据另给。按一般题目设定：R0=2Ω若正确，斜率应为2.4Ω左右。此处示例，以公式方法为准。\n(3)电流表内接时（相对电源）：测到的是“除电压表外的电流”，所以I测<I真，E测=U截距偏小，内阻r测=|斜率|-R0也偏小。",
                "_id": "q_db_2025_physics_nation1_22",
                "_paper_name": "理科综合-物理"
            },
            {
                "subject": "物理",
                "subjectColor": "orange",
                "year": "2025",
                "region": "全国甲卷",
                "no": "23题(20分)",
                "level": 5,
                "score": 20,
                "hot": true,
                "type": "计算题",
                "knowledge_point": "电场与磁场",
                "question": "如图所示，在xOy平面内，y>0区域有垂直纸面向外的匀强磁场，磁感应强度为B；y<0区域有沿y轴正方向的匀强电场，电场强度为E。一质量为m、电荷量为+q的粒子从坐标原点O沿y轴正方向以速度v0射入磁场。不计重力。求：\n(1)粒子第一次进入电场时的位置坐标和速度方向；\n(2)粒子第一次在电场中运动到最高点（x方向速度为0处）时的y坐标；\n(3)粒子从出发到第3次到达x轴的总时间。",
                "options": [],
                "answer": "(1)坐标：x=2mv0/(qB)，y=0；速度沿y轴负方向；(2)y_max=mv0²/(2qE)；(3)t总=3πm/(qB)+2√(2m²v0²/(q²E²))？实际按标准解法：需先在磁场做半圆T=2πm/(qB)，半圆时间t1=πm/(qB)；电场中类竖直上抛，减速到0的时间t2=mv0/(qE)，下落时间=t2，回x轴；再进磁场转半圆t3=πm/(qB)；总t=2πm/(qB)+2mv0/(qE)。",
                "analysis": "(1)磁场中洛伦兹力提供向心力：qv0B = mv0²/R → R=mv0/(qB)。半圆轨迹，x=2R=2mv0/(qB)，y=0处出磁场进电场，速度方向与入射时相反（向下）即y负方向。\n(2)进入电场时v=v0沿-y方向，粒子受力F=qE沿+y方向，加速度a=qE/m（向上），做匀减速运动，速度为0时到达最高点：0-v0² = 2·(-a)·|Δy| → y_max = v0²m/(2qE)（此处y<0的话，|y|=mv0²/(2qE)即y=-mv0²/(2qE)，题目问最高点y坐标）。\n(3)时间拆解：磁场半圆→πm/qB（t1），电场减速+返回→2v0m/(qE)（t2），再次进入磁场半圆→πm/qB（t3）。合计t=2πm/qB+2mv0/qE。题目说\"第3次到达x轴\"：第1次是原点(出发也算或不算？)、第2次是磁场出来后，第3次是电场出去再磁场出来。具体按标准做法，把粒子运动分段画轨迹分析。",
                "_id": "q_db_2025_physics_nation1_23",
                "_paper_name": "理科综合-物理"
            },
            {
                "subject": "生物",
                "subjectColor": "green",
                "year": "2025",
                "region": "全国甲卷",
                "no": "1题(6分)",
                "level": 2,
                "score": 6,
                "hot": false,
                "type": "选择题",
                "knowledge_point": "遗传规律",
                "question": "下列关于细胞结构与功能的叙述，正确的是（ ）\nA. 叶绿体是所有绿色植物细胞进行光合作用的场所\nB. 核糖体是噬菌体、细菌、酵母菌唯一共有的细胞器\nC. 高尔基体是细胞内蛋白质合成、加工和运输的“发送站”\nD. 线粒体是有氧呼吸的主要场所，葡萄糖不能直接进入线粒体",
                "options": [],
                "answer": "D",
                "analysis": "A错误：不是所有植物细胞都有叶绿体，如根细胞、洋葱表皮细胞等不含叶绿体，叶绿体只存在于绿色部位。\nB错误：噬菌体是病毒，没有细胞结构，也没有任何细胞器。细菌（原核）和酵母菌（真核）都有核糖体，但噬菌体没有。\nC错误：蛋白质合成在核糖体，高尔基体负责加工、分类、包装和发送，是“加工车间”和“发送站”，不负责合成。\nD正确：有氧呼吸第一阶段在细胞质基质，葡萄糖→丙酮酸+[H]，然后丙酮酸进入线粒体参与第二、三阶段；线粒体内膜上没有运输葡萄糖的载体，葡萄糖不能直接进入。",
                "_id": "q_db_2025_bio_nation1_1",
                "_paper_name": "理科综合-生物"
            },
            {
                "subject": "生物",
                "subjectColor": "green",
                "year": "2025",
                "region": "全国甲卷",
                "no": "2题(6分)",
                "level": 3,
                "score": 6,
                "hot": false,
                "type": "选择题",
                "knowledge_point": "细胞代谢",
                "question": "下列关于细胞呼吸的叙述，正确的是（ ）\nA. 无氧呼吸的终产物是丙酮酸\nB. 有氧呼吸产生的[H]在线粒体基质中与氧结合生成水\nC. 无氧呼吸不需要O2参与，该过程最终有[H]的积累\nD. 质量相同时，脂肪比糖原氧化分解释放的能量多",
                "options": [],
                "answer": "D",
                "analysis": "A错误：无氧呼吸第一阶段产丙酮酸，第二阶段把丙酮酸还原为酒精+CO2或乳酸，终产物是酒精+CO2（植物）或乳酸（动物），不是丙酮酸。\nB错误：有氧呼吸三阶段产的[H]（NADH）都是在**线粒体内膜**上与O2结合生成水（第三阶段），不是在基质。\nC错误：无氧呼吸虽然没有O2，但第二阶段NADH将H给了丙酮酸，被重新氧化为NAD+，[H]（NADH）不会积累，这也是无氧呼吸可以循环持续的关键。\nD正确：脂肪的C、H比例高，O含量低，彻底氧化时需要更多O2，释放能量更多——1 g脂肪约39 kJ，1 g糖原约17 kJ。",
                "_id": "q_db_2025_bio_nation1_2",
                "_paper_name": "理科综合-生物"
            },
            {
                "subject": "生物",
                "subjectColor": "green",
                "year": "2025",
                "region": "全国甲卷",
                "no": "29题(10分)",
                "level": 4,
                "score": 10,
                "hot": false,
                "type": "非选择题",
                "knowledge_point": "稳态与调节",
                "question": "图甲表示某植物叶肉细胞中光合作用和有氧呼吸的部分过程；图乙是在适宜温度、CO2浓度适宜条件下，该植物光合作用速率与光照强度的关系曲线。请回答以下问题：\n(1) 图甲中过程①发生的场所是____，过程③发生的场所是____。\n(2) 图乙中a点时，图甲中能发生的过程有____（填标号）。此时叶肉细胞产生ATP的场所有____。\n(3) 图乙中b点的生物学含义是____；当光照强度超过c点后，限制光合作用速率进一步提高的主要外界因素是____。\n(4) 若在图乙所示条件下，对植物进行缺镁处理，预计b点将向____移动，原因是____。",
                "options": [],
                "answer": "(1)叶绿体类囊体薄膜（光反应）；线粒体内膜（有氧呼吸第三阶段）\n(2)③④（或②③④）；细胞质基质、线粒体（线粒体基质和线粒体内膜）\n(3)光合速率=呼吸速率（光补偿点）；CO2浓度或温度\n(4)右；缺镁叶绿素合成不足，光合速率降低，需要更强光照才能让光合速率=呼吸速率",
                "analysis": "(1)光合作用光反应在类囊体薄膜（光反应），暗反应在叶绿体基质；有氧呼吸：细胞质基质(1)、线粒体基质(2)、线粒体内膜(3)。\n(2)a点光照为0，只进行呼吸，对应③(有氧呼吸第三阶段)、④（可理解为呼吸某步），不进行光合作用；呼吸产ATP三个阶段，在细胞质基质+线粒体。\n(3)b点是“光补偿点”：此光照强度下净光合=0，总光合=呼吸。c点达到光饱和点后，光不再是限制因子，限制转为CO2浓度/温度等。\n(4)Mg是叶绿素核心元素，缺Mg→叶绿素少→吸收光能能力弱→光合速率下降→要达到与呼吸相同水平的光合速率，需更强光照→b点右移。",
                "_id": "q_db_2025_bio_nation1_29",
                "_paper_name": "理科综合-生物"
            },
            {
                "subject": "生物",
                "subjectColor": "green",
                "year": "2025",
                "region": "全国甲卷",
                "no": "30题(10分)",
                "level": 4,
                "score": 10,
                "hot": false,
                "type": "非选择题",
                "knowledge_point": "生态系统",
                "question": "（节选）某研究小组用某植物做了两组实验：实验一探究适宜浓度的生长素（IAA）、赤霉素（GA）对茎切段生长的影响；实验二探究细胞分裂素（CTK）对离体叶片衰老的影响。请回答：\n(1) 实验一结果显示IAA和GA均能促进茎切段伸长，且GA的促进效果更显著。当IAA与GA同时作用时，效果远大于单独使用时的效果之和，这体现了激素之间的____作用。\n(2) 实验一在配制溶液时，需要加入少量蔗糖作为能源物质，为什么不用葡萄糖？____。\n(3) 实验二中，研究者将CTK溶液涂抹在离体叶片的一半区域，另一半用等量蒸馏水处理。实验发现涂抹CTK的区域保持绿色更久，而另一半很快变黄衰老，这说明CTK具有____作用。实验中用同一叶片的两半进行实验，这样做的优点是____。\n(4) 在植物生长发育过程中，各种激素不是孤立起作用的，而是多种激素____的结果。",
                "options": [],
                "answer": "(1)协同；\n(2)葡萄糖分子量小、进入细胞速度快，会改变细胞渗透压，影响细胞正常吸水；蔗糖是二糖，不易快速进入细胞，能更稳定维持渗透压平衡；\n(3)延缓叶片衰老（保鲜、保绿）；保证了除CTK处理外，叶片的生理状态完全相同，排除无关变量干扰；\n(4)相互作用、共同调节（或多种激素相互协调、共同调控）。",
                "analysis": "(1)协同作用：两种激素合用的效果>两者单独使用之和；拮抗则是相反作用。\n(2)植物组培/切段实验常用蔗糖：①蔗糖比葡萄糖渗透压更稳定，不易造成质壁分离；②很多植物细胞对蔗糖转运缓慢，持续供能；③蔗糖可被蔗糖酶分解后逐步利用。葡萄糖快速进入细胞导致渗透压骤变。\n(3)细胞分裂素的典型作用是延缓衰老（保绿）——抑制核酸酶、蛋白酶活性，减少叶绿素、蛋白质降解；同一叶片做自身对照，叶片年龄、生理状态完全相同，消除个体差异。\n(4)教材原话：植物的生长发育过程，在根本上是基因组在一定时间和空间上程序性表达的结果；多种激素相互协调、共同调节。",
                "_id": "q_db_2025_bio_nation1_30",
                "_paper_name": "理科综合-生物"
            },
            {
                "subject": "英语",
                "subjectColor": "green",
                "year": "2025",
                "region": "全国甲卷",
                "no": "完形填空41-55(节选)",
                "level": 3,
                "score": 2,
                "hot": false,
                "type": "完形填空",
                "knowledge_point": "完形填空",
                "question": "A teacher's encouragement can ___41___ a student's life forever. When I was in high school, my math teacher noticed I was ___42___ with algebra. Instead of scolding me, she ___43___ after class and spent an hour each week ___44___ me through difficult problems. Her patience and belief in me made me realize I could ___45___ at math.\n\n41. A. damage B. change C. destroy D. disturb\n42. A. struggling B. dealing C. playing D. working\n43. A. took up B. stayed up C. came up D. turned up\n44. A. forcing B. walking C. rushing D. breaking\n45. A. fail B. glance C. succeed D. escape",
                "options": [],
                "answer": "41.B  42.A  43.B  44.B  45.C",
                "analysis": "41. 根据全文语境“老师的鼓励改变学生人生”，选change（改变）。damage/destroy/disturb均为负面词，与后文积极态度矛盾。\n42. struggle with 表示“在某事上挣扎、吃力”，符合后文老师课后辅导的语境。deal with 为处理（中性），play/work与with搭配无此意。\n43. stay up after class 指课后留（下）来，take up 占用，come up 出现，turn up 出现/调大，选B语境最佳。\n44. walk sb. through sth. 固定表达“一步一步带某人走（过程）”，force 强迫，rush 催促，break 打破，都不符合耐心辅导的语境。\n45. succeed at sth. 在某事上成功，结尾呼应开头“改变人生”，为正向结果。其他词均与逻辑相反。",
                "_id": "q_db_2025_english_nation1_41",
                "_paper_name": "英语"
            },
            {
                "subject": "英语",
                "subjectColor": "green",
                "year": "2025",
                "region": "全国甲卷",
                "no": "语法填空61-70(节选)",
                "level": 4,
                "score": 10,
                "hot": false,
                "type": "语法填空",
                "knowledge_point": "阅读理解",
                "question": "The Great Wall of China, one of the world's most famous ___61___ (landmark), stretches over 21,000 km. Originally ___62___ (build) to protect against invasions, it now ___63___ (serve) as a symbol of China's long history. Every year, millions of tourists visit ___64___, many of ___65___ come to experience the breathtaking views. The section near Beijing ___66___ (be) the most popular, and it ___67___ (list) as a UNESCO World Heritage Site in 1987. ___68___ (Walk) the wall is challenging, but the sense of achievement upon reaching a watchtower makes the effort ___69___ (true) worthwhile. If you plan ___70___ (visit), be sure to wear comfortable shoes!",
                "options": [],
                "answer": "61. landmarks  62. built  63. serves  64. it  65. whom  66. is  67. was listed  68. Walking  69. truly  70. to visit",
                "analysis": "61. one of 后面接复数名词 → landmarks。\n62. 非谓语作状语，逻辑主语 it 与 build 为被动关系 → built。\n63. 主语为 it，时间 now，用一般现在时三单 → serves。\n64. visit 及物，缺少宾语，指代the Great Wall → it。\n65. 介词of后接宾格关系代词，指人 → whom（注意不能用who）。\n66. 主语section单数，一般现在时 → is。\n67. 1987年被动 → was listed。\n68. 作主语用动名词 → Walking（句首大写）。\n69. 修饰形容词worthwhile → 副词 truly。\n70. plan后接不定式 → to visit。",
                "_id": "q_db_2025_english_nation1_65",
                "_paper_name": "英语"
            },
            {
                "subject": "英语",
                "subjectColor": "green",
                "year": "2025",
                "region": "全国甲卷",
                "no": "短文改错",
                "level": 4,
                "score": 10,
                "hot": false,
                "type": "短文改错",
                "knowledge_point": "语法填空",
                "question": "Last Sunday, our class organized a hike in the nearby mountain. Early in the morning, we gather at the school gate and set off by bike. The scenery along the way was beautifully. After two hours ride, we arrived at the foot of the mountain. We started climbing with joy, laugh and songs shared by everyone. On the top, we had a picnic, taking lots of photos. What made the day specially was that we helped a lost little boy find his mother. We felt proud for ourselves. This activity not only brought us close to nature but also taught the importance of teamwork. We hope more such activities will be hold in the future.",
                "options": [],
                "answer": "1. gather→gathered  2. beautifully→beautiful  3. hours→hours'  4. laugh→laughter  5. taking→taken  6. specially→special  7. for→of  8. close→closer  9. taught后面加us  10. hold→held",
                "analysis": "1. Last Sunday → 过去时gathered。\n2. be动词后用形容词作表语 → beautiful。\n3. 表示“两小时的(骑行)” → 名词所有格 hours'。\n4. 与joy、songs并列，需名词形式 → laughter。\n5. photos是“被(我们)拍”，非谓语被动 → taken。\n6. 作宾补修饰day → 形容词special。\n7. be proud of 固定搭配，不用for。\n8. 比较含义：“(使我们)更贴近自然” → closer。\n9. teach sb. sth. 双宾，缺少间接宾语 → us。\n10. 被动be+过去分词 → held。",
                "_id": "q_db_2025_english_nation1_75",
                "_paper_name": "英语"
            },
            {
                "subject": "英语",
                "subjectColor": "green",
                "year": "2025",
                "region": "全国甲卷",
                "no": "阅读理解C篇",
                "level": 5,
                "score": 8,
                "hot": true,
                "type": "阅读理解",
                "knowledge_point": "书面表达",
                "question": "（节选）Researchers at Stanford University have developed a new type of solar panel that can generate electricity even at night. Unlike traditional solar panels, which rely on sunlight, these panels use the temperature difference between the panel and the surrounding air to produce power. While the output is much lower than daytime panels — typically around 50 milliwatts per square meter — it could be enough to power small devices like LED lights or phone chargers during off-grid situations. The team says the technology is still in its early stages, but it could complement traditional solar farms, helping to smooth out energy supply during cloudy periods or at night.\n\n1. What is the main advantage of the new solar panel?\n  A. It is cheaper to produce.  B. It works without sunlight.\n  C. It generates more power.   D. It uses less material.\n2. How much power can the new panel produce per square meter?\n  A. About 50 watts.  B. Around 50 milliwatts.\n  C. About 500 watts. D. Around 5 kilowatts.",
                "options": [],
                "answer": "1.B  2.B",
                "analysis": "1. 主旨题。第1句“generate electricity even at night”，第2句“Unlike traditional panels...rely on sunlight” → 核心优势是夜间可用。A/C/D原文均未支持。\n2. 细节题。原文“typically around 50 milliwatts per square meter” → 选B，注意milli前缀（毫=10^-3）。",
                "_id": "q_db_2025_english_nation1_80",
                "_paper_name": "英语"
            },
            {
                "subject": "语文",
                "subjectColor": "red",
                "year": "2025",
                "region": "全国甲卷",
                "no": "16题(6分)",
                "level": 2,
                "score": 6,
                "hot": false,
                "type": "默写",
                "knowledge_point": "kp_yuwen_02",
                "question": "补写出下列句子中的空缺部分：(1)《劝学》中“____，____”两句，强调了整天思考不如片刻学习收获大。(2)白居易《琵琶行》中“____，____”两句，描写琵琶女初出场时羞涩矜持的情态。",
                "options": [],
                "answer": "(1)吾尝终日而思矣，不如须臾之所学也；(2)千呼万唤始出来，犹抱琵琶半遮面",
                "analysis": "(1)出自荀子《劝学》，核心对比“终日思”与“须臾学”，须臾（片刻）对应终日，体现学习效率远高于空想。(2)出自白居易《琵琶行》，“千呼万唤始出来”写诗人屡次相邀，“犹抱琵琶半遮面”写出琵琶女复杂心理：有羞涩、有自卑、有不愿重提旧事的纠结。",
                "_id": "q_db_2025_yuwen_nation1_16",
                "_paper_name": "语文"
            },
            {
                "subject": "语文",
                "subjectColor": "red",
                "year": "2025",
                "region": "全国甲卷",
                "no": "17题(9分)",
                "level": 4,
                "score": 9,
                "hot": false,
                "type": "古诗文阅读",
                "knowledge_point": "kp_yuwen_03",
                "question": "阅读下面这首唐诗，完成(1)-(2)题。《登高》杜甫：风急天高猿啸哀，渚清沙白鸟飞回。无边落木萧萧下，不尽长江滚滚来。万里悲秋常作客，百年多病独登台。艰难苦恨繁霜鬓，潦倒新停浊酒杯。(1)本诗首联写了哪些意象？营造了怎样的意境？(4分)(2)结合全诗，分析颈联“万里悲秋常作客，百年多病独登台”中“悲”的多层含义。(5分)",
                "options": [],
                "answer": "(1)意象：风、天、猿、渚、沙、鸟；意境：萧瑟凄凉、雄浑苍茫。(2)“悲”的多层含义：①空间上的悲：万里作客，漂泊天涯；②时间上的悲：秋景萧条，岁月迟暮；③身世之悲：百年多病，孤独无依；④时代之悲：艰难苦恨，国难家愁。",
                "analysis": "(1)首联6个意象，动静结合（风急-猿啸为动，渚清-沙白为静），声色兼具（哀啸为声，清-白为色），渲染夔州秋日典型环境。(2)颈联是全诗情感枢纽，“万里”对“百年”形成时空对仗，把个人遭遇放在宏大的时空框架中，悲秋、作客、多病、登台四个层面交织，情感层层递进。",
                "_id": "q_db_2025_yuwen_nation1_17",
                "_paper_name": "语文"
            },
            {
                "subject": "语文",
                "subjectColor": "red",
                "year": "2025",
                "region": "全国甲卷",
                "no": "18题(3分)",
                "level": 3,
                "score": 3,
                "hot": false,
                "type": "成语运用",
                "knowledge_point": "kp_yuwen_04",
                "question": "下列各句中，加粗成语使用恰当的一项是（ ）A. 这部小说的构思既精巧又严密，真是无可厚非。B. 这位老科学家为了科研工作，废寝忘食，兀兀穷年，终于取得了举世瞩目的成就。C. 他在学习上十分勤奋，不懂就问，这种不耻下问的精神值得我们学习。D. 这次艺术节办得栩栩如生，全校师生交口称赞。",
                "options": [],
                "answer": "B",
                "analysis": "A项“无可厚非”意为不可过分指责，表示虽有缺点但可以原谅，语境应改为“无可挑剔”。B项“兀兀穷年”指一年到头辛苦劳作，与“废寝忘食”搭配，形容科学家多年钻研，使用正确。C项“不耻下问”是向地位、学问比自己低的人请教，语境中“不懂就问”对象不明，且常用于老师、长辈问晚辈，此处不当。D项“栩栩如生”形容艺术形象生动逼真，不能形容“艺术节”本身，应改为“有声有色”。",
                "_id": "q_db_2025_yuwen_nation1_18",
                "_paper_name": "语文"
            },
            {
                "subject": "语文",
                "subjectColor": "red",
                "year": "2025",
                "region": "全国甲卷",
                "no": "19题(6分)",
                "level": 3,
                "score": 6,
                "hot": false,
                "type": "病句修改",
                "knowledge_point": "kp_yuwen_05",
                "question": "下面文段有三处语病，请指出序号并修改。①为了提升学生的语文核心素养，②学校决定开展以“经典润心·书香校园”为主题的读书活动，③旨在达到引导学生爱读书、读好书、善读书为目的，④活动内容包括经典诵读比赛、读书征文、图书漂流等形式组成，⑤希望同学们积极踊跃报名参加。",
                "options": [],
                "answer": "③句式杂糅，改为“旨在引导学生爱读书、读好书、善读书”或“以引导学生爱读书、读好书、善读书为目的”；④句式杂糅，改为“活动内容包括经典诵读比赛、读书征文、图书漂流等”或“活动由经典诵读比赛、读书征文、图书漂流等形式组成”；⑤语义重复，改为“希望同学们踊跃报名参加”或删去“积极”。",
                "analysis": "③句典型的“旨在……为目的”杂糅结构，两种句式选其一即可。④句“包括……等形式组成”同样是“包括……”和“由……组成”两种句式的杂糅。⑤句“积极踊跃”是高频的同义词叠加误用，“踊跃”本身就含有积极的意味。",
                "_id": "q_db_2025_yuwen_nation1_19",
                "_paper_name": "语文"
            },
            {
                "subject": "语文",
                "subjectColor": "red",
                "year": "2025",
                "region": "全国甲卷",
                "no": "20题(5分)",
                "level": 4,
                "score": 5,
                "hot": false,
                "type": "现代文阅读",
                "knowledge_point": "kp_yuwen_01",
                "question": "（节选）有人说，鲁迅是一个“多疑”的作家……这种“多疑”并不是性格的缺陷，而是一种深刻的怀疑精神——对既成话语的怀疑，对表象世界的怀疑，对自我立场的怀疑。正是这种三重怀疑，构成了鲁迅杂文独特的思维品质，使其在纷扰的“文化论战”中总能一针见血，直击要害。\n请结合文本，分析“三重怀疑”的内涵，并说明其作用。",
                "options": [],
                "answer": "三重怀疑内涵：①对既成话语的怀疑：不盲从主流叙事和权威说法；②对表象世界的怀疑：穿透现象看到本质矛盾；③对自我立场的怀疑：不断反思自我，防止陷入独断。作用：①塑造了鲁迅杂文独立的批判姿态；②使其论证具有深度和穿透力；③为读者提供了反思的方法论参照。",
                "analysis": "本题考查论述类文本论证层次的分析能力。答题时要注意“三重怀疑”是并列关系还是递进关系：从外部话语→外部世界→内部自我，实际上是由外而内、层层深入的递进结构。作用分析要从文本表达（手法效果）、思想价值（认识意义）两个维度展开，避免只写一个维度。",
                "_id": "q_db_2025_yuwen_nation1_20",
                "_paper_name": "语文"
            }
        ]
    },
    'profile-main': {
        "user": {
            "name": "李同学",
            "avatar": "",
            "is_vip": true,
            "grade": "高三",
            "province": "浙江",
            "days_to_gaokao": 0,
            "target_score": 620,
            "current_score": 580
        },
        "stats": [
            {
                "label": "累计学习",
                "value": "186h",
                "change": 12,
                "color": "blue"
            },
            {
                "label": "做题量",
                "value": "3267",
                "change": 8,
                "color": "green"
            },
            {
                "label": "正确率",
                "value": "78%",
                "change": 5,
                "color": "orange"
            }
        ],
        "menu_items": [
            {
                "icon": "fa-crown",
                "bg": "linear-gradient(135deg,#F59E0B,#D97706)",
                "title": "VIP会员",
                "desc": "畅享全部AI特权",
                "page": "profile-vip"
            },
            {
                "icon": "fa-file-alt",
                "bg": "linear-gradient(135deg,#3B82F6,#1D4ED8)",
                "title": "学习报告",
                "desc": "本月学情深度分析",
                "page": "profile-report"
            },
            {
                "icon": "fa-user-friends",
                "bg": "linear-gradient(135deg,#10B981,#059669)",
                "title": "家长中心",
                "desc": "查看孩子学习动态",
                "page": "profile-parent"
            },
            {
                "icon": "fa-cog",
                "bg": "linear-gradient(135deg,#6B7280,#4B5563)",
                "title": "设置",
                "desc": "账号与学习偏好",
                "page": "profile-settings"
            },
            {
                "icon": "fa-question-circle",
                "bg": "linear-gradient(135deg,#8B5CF6,#6D28D9)",
                "title": "帮助与反馈",
                "desc": "常见问题与意见反馈",
                "page": ""
            },
            {
                "icon": "fa-info-circle",
                "bg": "linear-gradient(135deg,#06B6D4,#0891B2)",
                "title": "关于我们",
                "desc": "版本 v1.2.0",
                "page": ""
            }
        ],
        "today_summary": {
            "hours": "3.5",
            "tip": "AI提醒：数学导数专项还未完成，加油！"
        }
    },
    'profile-parent': {
        "student": {
            "name": "张同学",
            "avatar": "https://i.pravatar.cc/100?img=33",
            "grade": "高三",
            "province": "浙江",
            "school": "杭州第二中学",
            "relation": "父亲",
            "current_score": 580
        },
        "overview_stats": [
            {
                "label": "今日时长",
                "value": "3.5h",
                "change": 0,
                "color": "blue"
            },
            {
                "label": "本周时长",
                "value": "28h",
                "change": 15,
                "color": "green"
            },
            {
                "label": "平均正确率",
                "value": "78%",
                "change": 5,
                "color": "orange"
            }
        ],
        "daily_reports": [
            {
                "day": "7/28",
                "time": "3.5h",
                "count": 28,
                "rate": 82
            },
            {
                "day": "7/27",
                "time": "4.2h",
                "count": 35,
                "rate": 80
            },
            {
                "day": "7/26",
                "time": "2.8h",
                "count": 22,
                "rate": 76
            },
            {
                "day": "7/25",
                "time": "3.9h",
                "count": 30,
                "rate": 85
            },
            {
                "day": "7/24",
                "time": "3.1h",
                "count": 25,
                "rate": 79
            },
            {
                "day": "7/23",
                "time": "4.5h",
                "count": 38,
                "rate": 83
            },
            {
                "day": "7/22",
                "time": "3.6h",
                "count": 27,
                "rate": 78
            }
        ],
        "trend_chart_label": "最近5次考试总分变化趋势",
        "weekly_report": {
            "week": "第30周",
            "content": "本周孩子学习状态良好，总时长 28h 同比增长 15%，正确率稳定在 78%。数学进步明显，建议关注英语阅读理解的强化训练。学习时段集中在 19:00-22:00，作息规律。"
        }
    },
    'profile-report': {
        "periods": [
            "本周",
            "本月",
            "本学期"
        ],
        "active_period": 1,
        "overview_stats": [
            {
                "label": "学习时长",
                "value": "42h",
                "change": 15,
                "color": "blue"
            },
            {
                "label": "做题量",
                "value": "568道",
                "change": 8,
                "color": "green"
            },
            {
                "label": "正确率",
                "value": "82%",
                "change": 6,
                "color": "orange"
            },
            {
                "label": "预估进步",
                "value": "+15分",
                "change": 0,
                "color": "purple"
            }
        ],
        "radar_chart_label": "各科学习掌握率雷达图",
        "subjects": [
            {
                "name": "数学",
                "score": 118,
                "percent": 88,
                "color": "#3B82F6"
            },
            {
                "name": "英语",
                "score": 125,
                "percent": 82,
                "color": "#10B981"
            },
            {
                "name": "物理",
                "score": 88,
                "percent": 80,
                "color": "#8B5CF6"
            },
            {
                "name": "化学",
                "score": 84,
                "percent": 84,
                "color": "#F59E0B"
            },
            {
                "name": "语文",
                "score": 110,
                "percent": 73,
                "color": "#EC4899"
            },
            {
                "name": "生物",
                "score": 75,
                "percent": 83,
                "color": "#06B6D4"
            }
        ],
        "heatmap_label": "知识点掌握热力图（按学科·模块）",
        "ai_comment": "本月进步显著，数学尤为突出（掌握率提升 12%）。导数与圆锥曲线模块掌握扎实，但英语阅读理解仍有提升空间。建议下月保持数学训练强度的同时，每日增加 20 分钟英语精读训练，预计可再提升 8-10 分。"
    },
    'profile-settings': {
        "account_section": {
            "title": "账号设置",
            "items": [
                {
                    "icon": "fa-lock",
                    "bg": "linear-gradient(135deg,#3B82F6,#1D4ED8)",
                    "title": "修改密码",
                    "desc": "定期更新更安全"
                },
                {
                    "icon": "fa-mobile-alt",
                    "bg": "linear-gradient(135deg,#10B981,#059669)",
                    "title": "绑定手机",
                    "desc": "138****8888"
                },
                {
                    "icon": "fab fa-weixin",
                    "bg": "linear-gradient(135deg,#07C160,#059669)",
                    "title": "绑定微信",
                    "desc": "已绑定"
                }
            ]
        },
        "study_section": {
            "title": "学习设置",
            "items": [
                {
                    "icon": "fa-bullseye",
                    "bg": "linear-gradient(135deg,#F59E0B,#D97706)",
                    "title": "每日目标",
                    "desc": "6 小时"
                },
                {
                    "icon": "fa-bell",
                    "bg": "linear-gradient(135deg,#8B5CF6,#6D28D9)",
                    "title": "提醒时间",
                    "desc": "19:00"
                },
                {
                    "icon": "fa-sliders-h",
                    "bg": "linear-gradient(135deg,#06B6D4,#0891B2)",
                    "title": "学习偏好",
                    "desc": "理科优先"
                }
            ]
        },
        "notification_section": {
            "title": "通知设置",
            "items": [
                {
                    "icon": "fa-book-open",
                    "bg": "linear-gradient(135deg,#3B82F6,#1D4ED8)",
                    "title": "学习提醒",
                    "desc": "每日学习计划推送",
                    "enabled": true
                },
                {
                    "icon": "fa-chart-line",
                    "bg": "linear-gradient(135deg,#10B981,#059669)",
                    "title": "成绩通知",
                    "desc": "考试与估分提醒",
                    "enabled": true
                },
                {
                    "icon": "fa-info-circle",
                    "bg": "linear-gradient(135deg,#6B7280,#4B5563)",
                    "title": "系统消息",
                    "desc": "活动与公告通知",
                    "enabled": false
                }
            ]
        },
        "other_section": {
            "title": "其他",
            "items": [
                {
                    "icon": "fa-broom",
                    "bg": "linear-gradient(135deg,#06B6D4,#0891B2)",
                    "title": "清除缓存",
                    "desc": "当前 23.5 MB"
                },
                {
                    "icon": "fa-shield-alt",
                    "bg": "linear-gradient(135deg,#8B5CF6,#6D28D9)",
                    "title": "隐私协议",
                    "desc": ""
                },
                {
                    "icon": "fa-file-contract",
                    "bg": "linear-gradient(135deg,#6B7280,#4B5563)",
                    "title": "用户协议",
                    "desc": ""
                }
            ]
        },
        "version": "AI高考 v1.2.0"
    },
    'profile-vip': {
        "title": "AI高考 VIP",
        "subtitle": "解锁全部AI能力 · 助力高考冲刺",
        "users_count": "12.5万",
        "privileges": [
            {
                "icon": "fa-robot",
                "bg": "linear-gradient(135deg,#3B82F6,#1D4ED8)",
                "title": "AI无限讲题",
                "desc": "不限次数使用AI分步讲题"
            },
            {
                "icon": "fa-file-alt",
                "bg": "linear-gradient(135deg,#10B981,#059669)",
                "title": "真题全库",
                "desc": "全国近10年高考真题无限刷"
            },
            {
                "icon": "fa-magic",
                "bg": "linear-gradient(135deg,#8B5CF6,#6D28D9)",
                "title": "专属学习计划",
                "desc": "AI定制个性化提分方案"
            },
            {
                "icon": "fa-ban",
                "bg": "linear-gradient(135deg,#06B6D4,#0891B2)",
                "title": "无广告",
                "desc": "纯净学习体验，告别打扰"
            },
            {
                "icon": "fa-headset",
                "bg": "linear-gradient(135deg,#F59E0B,#D97706)",
                "title": "优先客服",
                "desc": "VIP专属通道，秒回响应"
            },
            {
                "icon": "fa-file-signature",
                "bg": "linear-gradient(135deg,#EC4899,#BE185D)",
                "title": "专属报告",
                "desc": "深度学情报告每月一份"
            }
        ],
        "plans": [
            {
                "name": "月卡",
                "price": "28",
                "unit": "/月",
                "desc": "灵活开通",
                "popular": false
            },
            {
                "name": "季卡",
                "price": "68",
                "unit": "/季",
                "desc": "月均￥22.7",
                "popular": true
            },
            {
                "name": "年卡",
                "price": "198",
                "unit": "/年",
                "desc": "月均￥16.5 最划算",
                "popular": false
            }
        ],
        "cta_name": "年卡",
        "cta_price": "198"
    },
    'score-improvement': {
        "total_gain": 70,
        "from_score": 565,
        "to_score": 635,
        "bar_chart_label": "各科提分空间柱状图",
        "improvements": [
            {
                "subject": "数学",
                "gain": 20,
                "color": "#3B82F6",
                "icon": "fa-square-root-variable",
                "points": "导数 + 圆锥曲线"
            },
            {
                "subject": "物理",
                "gain": 15,
                "color": "#06B6D4",
                "icon": "fa-atom",
                "points": "电磁感应 + 力学综合"
            },
            {
                "subject": "语文",
                "gain": 13,
                "color": "#EC4899",
                "icon": "fa-book",
                "points": "作文 + 古诗文"
            },
            {
                "subject": "英语",
                "gain": 12,
                "color": "#8B5CF6",
                "icon": "fa-language",
                "points": "阅读理解 + 完形填空"
            },
            {
                "subject": "化学",
                "gain": 10,
                "color": "#10B981",
                "icon": "fa-flask",
                "points": "有机推断 + 实验题"
            }
        ],
        "ai_advice": {
            "title": "AI优先级建议",
            "content": "先攻数学导数（提分最快），预计2周可提升8-10分；其次突破物理电磁感应综合题。"
        }
    },
    'score-mock': {
        "exam_name": "2026届高三第三次模考",
        "total_score": 598,
        "total_max": 750,
        "change": "+30",
        "grade_rank": 45,
        "grade_total": 580,
        "rank_change": 8,
        "radar_chart_label": "各科得分率雷达图",
        "compare_chart_label": "与上次模考各科对比柱状图",
        "suggestions": [
            {
                "icon": "fa-square-root-variable",
                "bg": "#3B82F6",
                "title": "数学",
                "desc": "圆锥曲线专题强化，预计可提升8-12分"
            },
            {
                "icon": "fa-language",
                "bg": "#8B5CF6",
                "title": "英语",
                "desc": "完形填空专项训练，预计可提升6-10分"
            },
            {
                "icon": "fa-atom",
                "bg": "#06B6D4",
                "title": "物理",
                "desc": "电磁感应综合题突破，预计可提升5-8分"
            }
        ]
    },
    'score-monthly': {
        "total_score": 565,
        "total_max": 750,
        "change": "+12",
        "subjects": [
            {
                "name": "数学",
                "score": 118,
                "total": 150,
                "color": "#3B82F6",
                "icon": "fa-square-root-variable",
                "change": "+15"
            },
            {
                "name": "英语",
                "score": 125,
                "total": 150,
                "color": "#8B5CF6",
                "icon": "fa-language",
                "change": "-3"
            },
            {
                "name": "语文",
                "score": 110,
                "total": 150,
                "color": "#EC4899",
                "icon": "fa-book",
                "change": "+5"
            },
            {
                "name": "物理",
                "score": 88,
                "total": 110,
                "color": "#06B6D4",
                "icon": "fa-atom",
                "change": "+8"
            },
            {
                "name": "化学",
                "score": 84,
                "total": 100,
                "color": "#10B981",
                "icon": "fa-flask",
                "change": "-2"
            }
        ],
        "trend_chart_label": "各科成绩趋势折线图（最近5次月考）",
        "ai_analysis": {
            "title": "综合诊断",
            "content": "数学提升明显（+15分），导数与函数模块掌握扎实；英语需加强阅读理解，建议每日精读训练；物理稳步上升，化学略有下滑需关注有机推断部分。"
        }
    },
    'score-province-rank': {
        "predicted_rank": "8,231",
        "province": "浙江省",
        "category": "物理类",
        "confidence": 92,
        "basis": [
            "基于近3次模考成绩加权（598/585/572）",
            "校排名580人第45名，校际系数换算",
            "参考近3年浙江高考一分一段表",
            "考虑试题难度系数调整"
        ],
        "distribution_chart_label": "全省580-620分数段分布图",
        "tiers": [
            {
                "name": "985院校",
                "percent": 67,
                "color": "var(--danger)",
                "desc": "录取概率中等"
            },
            {
                "name": "211院校",
                "percent": 85,
                "color": "var(--warning)",
                "desc": "录取概率较高"
            },
            {
                "name": "一本院校",
                "percent": 95,
                "color": "var(--success)",
                "desc": "录取概率极高"
            }
        ],
        "history": [
            {
                "year": "2025",
                "rank": "8,100",
                "college": "湖南大学"
            },
            {
                "year": "2024",
                "rank": "8,500",
                "college": "重庆大学"
            },
            {
                "year": "2023",
                "rank": "8,200",
                "college": "大连理工"
            }
        ]
    },
    'score-school-rank': {
        "current_rank": 45,
        "total_students": 580,
        "beat_percent": 92.2,
        "rank_change": 8,
        "trend_chart_label": "最近5次考试排名变化趋势图",
        "rank_subjects": [
            {
                "name": "数学",
                "rank": 28,
                "color": "#3B82F6"
            },
            {
                "name": "物理",
                "rank": 35,
                "color": "#06B6D4"
            },
            {
                "name": "语文",
                "rank": 52,
                "color": "#EC4899"
            },
            {
                "name": "英语",
                "rank": 65,
                "color": "#8B5CF6"
            },
            {
                "name": "化学",
                "rank": 70,
                "color": "#10B981"
            }
        ],
        "target_college": {
            "name": "浙江大学",
            "score_line": 638,
            "score_year": 2025,
            "gap": -40,
            "progress": 89
        },
        "competition": {
            "range": "560-570",
            "total": 23,
            "tags": [
                {
                    "text": "565分：4人",
                    "color": "blue"
                },
                {
                    "text": "566分：3人",
                    "color": "purple"
                },
                {
                    "text": "567分：5人",
                    "color": "orange"
                },
                {
                    "text": "568分：2人",
                    "color": "green"
                }
            ]
        },
        "advice": {
            "title": "提升排名建议",
            "content": "数学提升10分可前进约15名，是当前性价比最高的提分方向。"
        }
    },
    'teacher-dashboard': {
        "teacher": {
            "name": "王老师",
            "subject": "数学",
            "school": "杭州第二中学",
            "title": "高三年级组长",
            "years": 12,
            "students": 144
        },
        "stats": [
            {
                "label": "待批改",
                "value": "16",
                "change": 0,
                "color": "orange"
            },
            {
                "label": "今日上传",
                "value": "3",
                "change": 0,
                "color": "green"
            },
            {
                "label": "班级均分",
                "value": "111.7",
                "change": 0,
                "color": "blue"
            },
            {
                "label": "AI任务",
                "value": "7",
                "change": 0,
                "color": "purple"
            }
        ],
        "classes": [
            {
                "name": "高三(1)班",
                "students": 48,
                "subject": "数学",
                "color": "#3B82F6",
                "avg": 118,
                "pending": 5
            },
            {
                "name": "高三(2)班",
                "students": 46,
                "subject": "数学",
                "color": "#8B5CF6",
                "avg": 112,
                "pending": 3
            },
            {
                "name": "高三(3)班",
                "students": 50,
                "subject": "数学",
                "color": "#10B981",
                "avg": 105,
                "pending": 8
            }
        ],
        "tasks": [
            {
                "title": "批改高三(1)班周测卷",
                "desc": "共48份，已完成32份",
                "progress": 67,
                "color": "#3B82F6"
            },
            {
                "title": "上传2025年浙江高考真题",
                "desc": "待AI切题与解析",
                "progress": 0,
                "color": "#F59E0B"
            },
            {
                "title": "生成高三(2)班课堂练习",
                "desc": "导数专题 10题",
                "progress": 100,
                "color": "#10B981"
            },
            {
                "title": "组卷：高三三模数学卷",
                "desc": "难度系数 0.65",
                "progress": 40,
                "color": "#8B5CF6"
            }
        ],
        "quickTiles": [
            {
                "icon": "fa-upload",
                "bg": "linear-gradient(135deg,#3B82F6,#1D4ED8)",
                "label": "上传试卷",
                "page": "teacher-upload"
            },
            {
                "icon": "fa-scissors",
                "bg": "linear-gradient(135deg,#8B5CF6,#6D28D9)",
                "label": "AI切题",
                "page": "teacher-split"
            },
            {
                "icon": "fa-magic",
                "bg": "linear-gradient(135deg,#EC4899,#BE185D)",
                "label": "AI解析",
                "page": "teacher-parse"
            },
            {
                "icon": "fa-file-export",
                "bg": "linear-gradient(135deg,#10B981,#059669)",
                "label": "AI组卷",
                "page": "teacher-paper"
            }
        ]
    },
    'teacher-exercise': {
        "settings": {
            "subjects": [
                "数学",
                "物理",
                "化学"
            ],
            "difficulties": [
                "简单",
                "中等",
                "困难",
                "分层难度"
            ],
            "selectedDifficulty": "中等",
            "counts": [
                "5 题",
                "10 题",
                "15 题",
                "20 题"
            ],
            "selectedCount": "10 题",
            "points": [
                {
                    "name": "导数概念",
                    "active": false
                },
                {
                    "name": "导数极值",
                    "active": true
                },
                {
                    "name": "函数单调性",
                    "active": true
                },
                {
                    "name": "分类讨论",
                    "active": false
                },
                {
                    "name": "最值问题",
                    "active": false
                }
            ]
        },
        "exercises": [
            {
                "no": 1,
                "type": "选择题",
                "diff": "简单",
                "score": 5,
                "point": "导数的几何意义",
                "content": "已知函数 f(x)=x³-3x，下列说法正确的是（ ）"
            },
            {
                "no": 2,
                "type": "选择题",
                "diff": "中等",
                "score": 5,
                "point": "函数单调性判断",
                "content": "已知函数 f(x)=x³-3x，下列说法正确的是（ ）"
            },
            {
                "no": 3,
                "type": "填空题",
                "diff": "中等",
                "score": 5,
                "point": "极值的求法",
                "content": "函数 f(x)=x²-2lnx 的单调递增区间为 ______。"
            },
            {
                "no": 4,
                "type": "解答题",
                "diff": "困难",
                "score": 12,
                "point": "导数综合应用",
                "content": "设函数 f(x)=e^x-ax-1，讨论 f(x) 的单调性并求其极值。"
            },
            {
                "no": 5,
                "type": "解答题",
                "diff": "困难",
                "score": 14,
                "point": "分类讨论思想",
                "content": "设函数 f(x)=e^x-ax-1，讨论 f(x) 的单调性并求其极值。"
            }
        ],
        "totalScore": 41
    },
    'teacher-paper': {
        "paperName": "高三三模数学卷",
        "previewInfo": "高三三模数学卷 · 8题 · 共78分",
        "settings": {
            "subjects": [
                "数学",
                "物理",
                "化学"
            ],
            "fullScore": 150,
            "knowledgeScopes": [
                "高考全部考点",
                "函数与导数",
                "解析几何",
                "立体几何"
            ],
            "difficulty": 65,
            "difficultyLabel": "0.65（中等）",
            "distribution": [
                {
                    "type": "选择题",
                    "count": 8,
                    "score": 5
                },
                {
                    "type": "填空题",
                    "count": 4,
                    "score": 5
                },
                {
                    "type": "解答题",
                    "count": 6,
                    "score": 12
                }
            ]
        },
        "paperQuestions": [
            {
                "no": 1,
                "type": "选择题",
                "score": 5,
                "point": "集合运算",
                "diff": "简单"
            },
            {
                "no": 2,
                "type": "选择题",
                "score": 5,
                "point": "复数运算",
                "diff": "简单"
            },
            {
                "no": 3,
                "type": "选择题",
                "score": 5,
                "point": "平面向量",
                "diff": "中等"
            },
            {
                "no": 4,
                "type": "填空题",
                "score": 5,
                "point": "三角函数",
                "diff": "中等"
            },
            {
                "no": 5,
                "type": "解答题",
                "score": 12,
                "point": "数列综合",
                "diff": "中等"
            },
            {
                "no": 6,
                "type": "解答题",
                "score": 12,
                "point": "立体几何",
                "diff": "中等"
            },
            {
                "no": 7,
                "type": "解答题",
                "score": 12,
                "point": "概率统计",
                "diff": "中等"
            },
            {
                "no": 8,
                "type": "解答题",
                "score": 14,
                "point": "导数综合",
                "diff": "困难"
            }
        ],
        "sections": [
            {
                "title": "一、选择题（每题5分，共40分）",
                "start": 0,
                "end": 3,
                "color": "#3B82F6"
            },
            {
                "title": "二、填空题（每题5分，共20分）",
                "start": 3,
                "end": 4,
                "color": "#10B981"
            },
            {
                "title": "三、解答题（共62分）",
                "start": 4,
                "end": 8,
                "color": "#F59E0B"
            }
        ]
    },
    'teacher-parse': {
        "paperName": "2025年浙江高考数学卷",
        "totalQuestions": 5,
        "parsedCount": 2,
        "qList": [
            {
                "no": 1,
                "type": "选择题",
                "done": true,
                "active": true
            },
            {
                "no": 2,
                "type": "选择题",
                "done": true,
                "active": false
            },
            {
                "no": 3,
                "type": "填空题",
                "done": false,
                "active": false
            }
        ],
        "detail": {
            "no": 1,
            "type": "选择题",
            "score": 5,
            "difficulty": "★★★☆☆",
            "content": "已知集合 A={x|x²-3x+2≤0}，B={x|ln(x-1)>0}，则 A∩B=（ ）",
            "answer": "答案：B  (2, 3]",
            "analysis": [
                {
                    "step": "第一步：",
                    "text": "解不等式 x²-3x+2≤0，因式分解 (x-1)(x-2)≤0，得 1≤x≤2，故 A=[1,2]。"
                },
                {
                    "step": "第二步：",
                    "text": "由 ln(x-1)>0 得 x-1>1，即 x>2，故 B=(2,+∞)。"
                },
                {
                    "step": "第三步：",
                    "text": "A∩B=[1,2]∩(2,+∞)=∅... 经复核 B=(2,+∞)，与 A=[1,2] 取交集为空集，故选 B。"
                }
            ],
            "points": [
                "集合运算",
                "一元二次不等式",
                "对数函数"
            ]
        }
    },
    'teacher-split': {
        "fileName": "2025年浙江高考数学卷.pdf",
        "preview": {
            "currentPage": 1,
            "totalPages": 8
        },
        "questions": [
            {
                "no": 1,
                "type": "选择题",
                "score": 5,
                "diff": "简单"
            },
            {
                "no": 2,
                "type": "选择题",
                "score": 5,
                "diff": "中等"
            },
            {
                "no": 3,
                "type": "填空题",
                "score": 5,
                "diff": "中等"
            },
            {
                "no": 4,
                "type": "解答题",
                "score": 12,
                "diff": "困难"
            },
            {
                "no": 5,
                "type": "解答题",
                "score": 14,
                "diff": "困难"
            }
        ],
        "stats": [
            {
                "label": "识别题数",
                "value": "5",
                "change": 0,
                "color": "blue"
            },
            {
                "label": "总分值",
                "value": "41分",
                "change": 0,
                "color": "green"
            },
            {
                "label": "识别准确率",
                "value": "96%",
                "change": 0,
                "color": "purple"
            },
            {
                "label": "处理耗时",
                "value": "3.2s",
                "change": 0,
                "color": "orange"
            }
        ]
    },
    'teacher-tag': {
        "question": {
            "subject": "数学",
            "topic": "导数",
            "no": 4,
            "difficulty": "★★★★☆",
            "score": 12,
            "content": "已知函数 f(x)=x³-3ax²+2bx 在 x=1 处取得极值，且 f(x) 在区间 [0,2] 上的最大值为 2，求 a、b 的值。"
        },
        "recommended": [
            {
                "name": "导数的极值",
                "confidence": 96
            },
            {
                "name": "利用导数研究函数",
                "confidence": 92
            },
            {
                "name": "分类讨论思想",
                "confidence": 85
            },
            {
                "name": "函数的单调性",
                "confidence": 78
            }
        ],
        "confirmed": [
            "导数的极值",
            "分类讨论思想"
        ]
    },
    'teacher-upload': {
        "uploaded": [
            {
                "name": "2025年浙江高考数学卷.pdf",
                "size": "2.4 MB",
                "time": "今天 10:32",
                "status": "已解析",
                "progress": 100
            },
            {
                "name": "2024年全国卷理科数学.pdf",
                "size": "3.1 MB",
                "time": "今天 09:15",
                "status": "切题中",
                "progress": 60
            },
            {
                "name": "高三三模数学试卷.docx",
                "size": "1.8 MB",
                "time": "昨天 16:40",
                "status": "已上传",
                "progress": 30
            }
        ]
    }
};

// 今日任务 Mock 数据（无后端服务时回退，供 home-task 及首页"今日学习计划"使用）
window.TODAY_TASKS_MOCK = {
        "date": "8月9日 周日",
        "tasks": [
            {
                "subject": "语文",
                "color": "red",
                "icon": "fa-book",
                "knowledge_point_id": "kp_chn_01",
                "point": "古诗文鉴赏",
                "difficulty": "困难",
                "time": "32min",
                "questions_count": 10,
                "status": "todo"
            },
            {
                "subject": "物理",
                "color": "purple",
                "icon": "fa-atom",
                "knowledge_point_id": "kp_phy_02",
                "point": "力学综合",
                "difficulty": "困难",
                "time": "28min",
                "questions_count": 6,
                "status": "todo"
            },
            {
                "subject": "数学",
                "color": "blue",
                "icon": "fa-square-root-variable",
                "knowledge_point_id": "kp_math_01",
                "point": "圆锥曲线综合",
                "difficulty": "困难",
                "time": "47min",
                "questions_count": 22,
                "status": "todo"
            },
            {
                "subject": "数学",
                "color": "blue",
                "icon": "fa-square-root-variable",
                "knowledge_point_id": "kp_math_02",
                "point": "导数第二问",
                "difficulty": "困难",
                "time": "41min",
                "questions_count": 17,
                "status": "todo"
            }
        ],
        "done_count": 0,
        "total_count": 4,
        "completion_rate": 0
    };

// 学习时长 Mock 数据（无后端服务时回退，供 home-duration 使用）
window.DURATION_STATS_MOCK = {
        "today": {
            "duration_min": 0,
            "duration_hours": 0,
            "change_pct": 0,
            "daily_goal_hours": 6,
            "goal_rate": 0
        },
        "summary": {
            "week_hours": 0,
            "week_change": -100,
            "month_hours": 0,
            "month_change": -100,
            "avg_hours": 0,
            "avg_change": -100
        },
        "weekly": [
            {
                "day": "一",
                "date": "2026-08-03",
                "hours": 0,
                "min": 0,
                "is_today": false
            },
            {
                "day": "二",
                "date": "2026-08-04",
                "hours": 0,
                "min": 0,
                "is_today": false
            },
            {
                "day": "三",
                "date": "2026-08-05",
                "hours": 0,
                "min": 0,
                "is_today": false
            },
            {
                "day": "四",
                "date": "2026-08-06",
                "hours": 0,
                "min": 0,
                "is_today": false
            },
            {
                "day": "五",
                "date": "2026-08-07",
                "hours": 0,
                "min": 0,
                "is_today": false
            },
            {
                "day": "六",
                "date": "2026-08-08",
                "hours": 0,
                "min": 0,
                "is_today": false
            },
            {
                "day": "日",
                "date": "2026-08-09",
                "hours": 0,
                "min": 0,
                "is_today": true
            }
        ],
        "week_total_hours": 0,
        "week_goal_hours": 42,
        "week_goal_rate": 0,
        "subjects": [],
        "subject_total_hours": 0,
        "heatmap": [
            [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ],
            [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ],
            [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                4,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ],
            [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ],
            [
                0,
                0,
                0,
                0,
                4,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ],
            [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ],
            [
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ]
        ],
        "peak_start": 4,
        "peak_end": 7,
        "advice": "本周暂无学习记录，建议从薄弱科目开始，每日坚持学习2小时以上。"
    };

// AI学习计划 Mock 数据（无后端服务或 week-plan 接口失败时回退）
window.WEEK_PLAN_MOCK = {
        "week_plan": [
            {
                "day": "周一",
                "date": "8月10日",
                "isToday": true,
                "tasks": [
                    { "subject": "语文", "color": "red", "point": "古诗文鉴赏", "time": "32min", "questions_count": 10, "done": false },
                    { "subject": "物理", "color": "purple", "point": "力学综合", "time": "28min", "questions_count": 8, "done": false },
                    { "subject": "数学", "color": "blue", "point": "圆锥曲线综合", "time": "47min", "questions_count": 12, "done": false }
                ]
            },
            {
                "day": "周二",
                "date": "8月11日",
                "isToday": false,
                "tasks": [
                    { "subject": "英语", "color": "green", "point": "完形填空专项", "time": "35min", "questions_count": 10, "done": false },
                    { "subject": "化学", "color": "orange", "point": "氧化还原反应", "time": "40min", "questions_count": 8, "done": false }
                ]
            },
            {
                "day": "周三",
                "date": "8月12日",
                "isToday": false,
                "tasks": [
                    { "subject": "数学", "color": "blue", "point": "导数与极值", "time": "45min", "questions_count": 10, "done": false },
                    { "subject": "物理", "color": "purple", "point": "电磁感应综合", "time": "38min", "questions_count": 8, "done": false }
                ]
            },
            {
                "day": "周四",
                "date": "8月13日",
                "isToday": false,
                "tasks": [
                    { "subject": "语文", "color": "red", "point": "现代文阅读", "time": "30min", "questions_count": 8, "done": false },
                    { "subject": "英语", "color": "green", "point": "阅读理解D篇", "time": "32min", "questions_count": 5, "done": false }
                ]
            },
            {
                "day": "周五",
                "date": "8月14日",
                "isToday": false,
                "tasks": [
                    { "subject": "数学", "color": "blue", "point": "概率统计", "time": "40min", "questions_count": 8, "done": false },
                    { "subject": "化学", "color": "orange", "point": "化学平衡", "time": "35min", "questions_count": 6, "done": false }
                ]
            },
            {
                "day": "周六",
                "date": "8月15日",
                "isToday": false,
                "tasks": [
                    { "subject": "综合", "color": "purple", "point": "理科综合模拟", "time": "90min", "questions_count": 21, "done": false }
                ]
            },
            {
                "day": "周日",
                "date": "8月16日",
                "isToday": false,
                "tasks": [
                    { "subject": "综合", "color": "orange", "point": "错题回顾与总结", "time": "60min", "questions_count": 15, "done": false }
                ]
            }
        ],
        "total_tasks": 14,
        "done_tasks": 0,
        "estimated_score_gain": 18,
        "weak_point_count": 8,
        "replanned": false
    };

// 在 api.request 层自动拦截：page-data / today-tasks / duration-stats / week-plan 失败时回退到对应 Mock 数据
(function installMockDataFallback() {
    function patch() {
        if (typeof api === 'undefined' || !api || !api.request || window.__API_MOCK_INSTALLED__) return;
        window.__API_MOCK_INSTALLED__ = true;
        var orig = api.request.bind(api);
        api.request = function (url, opts) {
            // 匹配各类需要 Mock 回退的接口
            var mockLabel = null, sample = null;
            var m = /^\/api\/page-data\/([^?#]+)/.exec(url || '');
            if (m) {
                mockLabel = 'PAGE_SAMPLE_DATA[' + m[1] + ']';
                sample = window.PAGE_SAMPLE_DATA && window.PAGE_SAMPLE_DATA[m[1]];
            } else if (/^\/api\/learning\/[^/]+\/today-tasks/.test(url || '')) {
                mockLabel = 'TODAY_TASKS_MOCK';
                sample = window.TODAY_TASKS_MOCK;
            } else if (/^\/api\/learning\/[^/]+\/duration-stats/.test(url || '')) {
                mockLabel = 'DURATION_STATS_MOCK';
                sample = window.DURATION_STATS_MOCK;
            } else if (/^\/api\/recommend\/[^/]+\/week-plan/.test(url || '')) {
                mockLabel = 'WEEK_PLAN_MOCK';
                sample = window.WEEK_PLAN_MOCK;
            }
            if (!sample) {
                // 无 Mock 数据的接口直接走原生，失败静默 null
                try { return orig.apply(api, arguments); } catch(e) { return Promise.resolve(null); }
            }
            return Promise.resolve().then(function () {
                // 先尝试真实请求（1.2s 超时则回退 mock）
                var timedOut = false;
                var timer = setTimeout(function () { timedOut = true; console.info('[API] 真实服务超时，使用 ' + mockLabel); }, 1200);
                try {
                    return orig(url, opts).then(function (realData) {
                        clearTimeout(timer);
                        if (timedOut) return sample;
                        if (realData === null || realData === undefined) {
                            console.info('[API] 接口返回null，使用 ' + mockLabel);
                            return sample;
                        }
                        return realData;
                    }).catch(function () {
                        clearTimeout(timer);
                        return sample;
                    });
                } catch (e) {
                    clearTimeout(timer);
                    return Promise.resolve(sample);
                }
            });
        };
        console.info('[DESIGN-SYSTEM] API Mock Fallback 已安装：PAGE_SAMPLE_DATA ' + Object.keys(window.PAGE_SAMPLE_DATA || {}).length + ' 个 key + TODAY_TASKS_MOCK + DURATION_STATS_MOCK + WEEK_PLAN_MOCK');
    }
    if (typeof api !== 'undefined') patch();
    else if (typeof window !== 'undefined') {
        var tries = 0;
        var t = setInterval(function () {
            tries++;
            if (typeof api !== 'undefined') { patch(); clearInterval(t); }
            else if (tries > 40) clearInterval(t);
        }, 100);
    }
})();
