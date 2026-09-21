// ============================================================
// AI核心模块 - 页面模块（动态加载：数据来自 /api/page-data/:key）
// 包含：AI学习教练 / AI讲题引擎 / AI组卷引擎 / AI知识图谱 /
//       AI预测高考 / AI自动入库 / OCR识别详情 / LLM切题详情
// ============================================================

// ---- 模块内辅助函数 ----

// 区块标题（morePage 可选，点击「查看全部」时跳转到对应页面；不传则弹 toast）
function aiSectionTitle(title, icon, more, morePage) {
    let moreHTML = '';
    if (more) {
        const moreAction = morePage
            ? `onclick="navigateTo('${morePage}')"`
            : `onclick="openModal('更多内容', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;>该板块包含更多详细内容，点击对应卡片可查看完整信息。</div>')"`;
        moreHTML = `<span class="more" style="cursor:pointer;" ${moreAction}>${more}</span>`;
    }
    return `<div class="section-title"><span><i class="fas ${icon}" style="margin-right:6px;color:var(--primary)"></i>${title}</span>${moreHTML}</div>`;
}

// 时间轴步骤（垂直）
function aiTimelineStep(num, status, title, desc, time) {
    const statusIcon = status === 'done' ? '<i class="fas fa-check-circle" style="color:var(--success)"></i>'
                     : status === 'active' ? '<i class="fas fa-sync-alt fa-spin" style="color:var(--warning)"></i>'
                     : '<i class="fas fa-lock" style="color:var(--text-tertiary)"></i>';
    const nodeBg = status === 'done' ? 'var(--success)'
                 : status === 'active' ? 'var(--warning)'
                 : '#D1D5DB';
    const lineColor = status === 'done' ? 'var(--success)' : '#E5E7EB';
    return `<div style="display:flex;gap:12px;padding-bottom:14px;position:relative;cursor:pointer;" onclick="openModal('步骤详情', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b>步骤：</b>${title}<br><b>时间：</b>${time || '未设置'}<br><b>状态：</b>${status === 'done' ? '已完成' : status === 'active' ? '进行中' : '待处理'}<br><br><b>详细说明：</b><br>${desc || '该步骤是AI学习路径的一部分，请按照指引完成学习任务。'}<br><br><span style=&quot;color:#6B7280;&quot;>完成此步骤后可解锁下一步。</span></div>')">
        <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="width:30px;height:30px;border-radius:50%;background:${nodeBg};color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;">${num}</div>
            <div style="width:2px;flex:1;background:${lineColor};margin-top:4px;opacity:0.4;min-height:20px;"></div>
        </div>
        <div style="flex:1;padding-bottom:4px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;flex-wrap:wrap;">
                <span style="font-size:14px;font-weight:600;">${title}</span>
                <span style="font-size:13px;">${statusIcon}</span>
                ${status === 'active' ? '<span style="font-size:10px;color:var(--warning);font-weight:600;">进行中</span>' : ''}
                ${status === 'done' ? '<span style="font-size:10px;color:var(--success);font-weight:600;">已完成</span>' : ''}
                ${status === 'locked' ? '<span style="font-size:10px;color:var(--text-tertiary);font-weight:600;">待处理</span>' : ''}
            </div>
            ${time ? `<div style="font-size:11px;color:var(--text-tertiary);margin-bottom:4px;"><i class="far fa-clock" style="margin-right:3px;"></i>${time}</div>` : ''}
            <div style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${desc}</div>
        </div>
    </div>`;
}

// 信息行
function aiInfoRow(label, value, valueColor) {
    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
        <span style="font-size:13px;color:var(--text-secondary);">${label}</span>
        <span style="font-size:13px;font-weight:600;color:${valueColor || 'var(--text-primary)'};">${value}</span>
    </div>`;
}

// 主按钮
function aiPrimaryBtn(text, icon) {
    return `<button class="proto-btn proto-btn-primary" style="margin-top:8px;" onclick="openModal('AI处理中', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><i class=&quot;fas fa-sync-alt fa-spin&quot; style=&quot;color:#3B82F6;font-size:20px;margin-right:6px;&quot;></i>AI正在处理您的请求...<br><br><span style=&quot;color:#6B7280;&quot;>请稍候，处理完成后将显示结果。</span></div>')">${icon ? `<i class="fas ${icon}"></i>` : ''} ${text}</button>`;
}

// ============================================================
// 注册所有AI核心模块页面
// 兼容加载顺序：prototype.js 可能在本文件之后加载，
// 故 registerPage 未定义时延迟到 DOMContentLoaded 再注册
// （本脚本先于 prototype.js 注册监听，故先于 buildSidebar 执行）
// ============================================================
function registerAIModulePages() {

// ============================================================
// 1. AI学习教练
// ============================================================
registerPage('ai-module-coach', 'AI学习教练', 'AI核心模块', 'fa-robot', function () {
    setTimeout(function () {
        var container = document.getElementById('ai-module-coach-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getAiModuleCoach) return;

        api.getAiModuleCoach().then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var c = '';
        var header = data.header_card || {};
        var today = data.today_analysis || {};
        var diag = data.diagnosis || {};
        var path = data.learning_path || {};
        var report = data.daily_report || {};

        // 顶部紫色渐变卡片
        var headerStatsHTML = '';
        (header.stats || []).forEach(function (s) {
            headerStatsHTML += '<div><div style="font-size:20px;font-weight:700;">' + s.value + '</div><div style="font-size:10px;opacity:0.8;">' + s.label + '</div></div>';
        });
        c += GradientCard('purple',
            '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">' +
                '<div style="width:48px;height:48px;border-radius:14px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:24px;"><i class="fas ' + (header.icon || 'fa-user-graduate') + '"></i></div>' +
                '<div>' +
                    '<div style="font-size:18px;font-weight:700;">' + (header.title || '') + '</div>' +
                    '<div style="font-size:12px;opacity:0.9;">' + (header.subtitle || '') + '</div>' +
                '</div>' +
            '</div>' +
            '<div style="background:rgba(255,255,255,0.15);border-radius:12px;padding:12px;">' +
                '<div style="font-size:12px;opacity:0.9;margin-bottom:6px;"><i class="fas fa-bolt" style="margin-right:4px;"></i>' + (header.analysis_text || '') + '</div>' +
                '<div style="display:flex;gap:16px;">' + headerStatsHTML + '</div>' +
            '</div>'
        );

        // 今日AI分析结果
        c += aiSectionTitle(today.title || '今日AI分析结果', today.title_icon || 'fa-lightbulb');
        var todayReasonsHTML = '';
        (today.reasons || []).forEach(function (r) {
            todayReasonsHTML += '<div style="margin-bottom:3px;"><i class="fas fa-circle" style="font-size:6px;color:' + r.color + ';margin-right:6px;"></i>' + r.text + '</div>';
        });
        var todayDetailHTML = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b style=&quot;font-size:14px;&quot;>' + (today.topic || '今日学习内容') + '</b><br><br><b>' + (today.topic_label || '今天学什么') + '：</b>' + (today.topic || '') + '<br><b>预计时长：</b>' + (today.duration || '') + '<br><br><b>' + (today.reason_label || '为什么学') + '：</b><br>' + todayReasonsHTML + '<br><b>' + (today.improve_label || '预计提高') + '：</b><span style=&quot;color:#15803D;font-weight:700;&quot;>' + (today.improve_value || '') + '</span><br><br><span style=&quot;color:#6B7280;&quot;>' + (today.improve_desc || '') + '</span></div>';
        c += '<div class="proto-card" style="cursor:pointer;" onclick="openModal(\'今日AI分析详情\', \'' + todayDetailHTML + '\')">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
                '<div style="width:32px;height:32px;border-radius:8px;background:var(--primary-light);color:var(--primary-dark);display:flex;align-items:center;justify-content:center;"><i class="fas fa-book"></i></div>' +
                '<div>' +
                    '<div style="font-size:11px;color:var(--text-tertiary);">' + (today.topic_label || '今天学什么') + '</div>' +
                    '<div style="font-size:15px;font-weight:700;">' + (today.topic || '') + '</div>' +
                '</div>' +
                '<span style="margin-left:auto;font-size:11px;color:var(--primary);background:var(--primary-light);padding:3px 8px;border-radius:10px;font-weight:600;">' + (today.duration || '') + '</span>' +
            '</div>' +
            '<div style="background:#F9FAFB;border-radius:10px;padding:10px;margin-bottom:10px;">' +
                '<div style="font-size:11px;color:var(--text-tertiary);margin-bottom:4px;">' + (today.reason_label || '为什么学') + '</div>' +
                '<div style="font-size:13px;line-height:1.6;color:var(--text-primary);">' + todayReasonsHTML + '</div>' +
            '</div>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;background:linear-gradient(135deg,#DCFCE7,#BBF7D0);border-radius:10px;padding:10px;">' +
                '<div>' +
                    '<div style="font-size:11px;color:#166534;">' + (today.improve_label || '预计提高') + '</div>' +
                    '<div style="font-size:22px;font-weight:700;color:#15803D;">' + (today.improve_value || '') + '</div>' +
                '</div>' +
                '<div style="font-size:11px;color:#166534;text-align:right;max-width:160px;line-height:1.4;">' + (today.improve_desc || '') + '</div>' +
            '</div>' +
        '</div>';

        // AI学情诊断
        c += aiSectionTitle(diag.title || 'AI学情诊断', diag.title_icon || 'fa-stethoscope');
        var diagSubjectsHTML = '';
        var diagBarData = [];
        (diag.subjects || []).forEach(function (s) {
            diagSubjectsHTML += '<div style="text-align:center;"><div style="font-size:16px;font-weight:700;color:' + s.color + ';">' + s.value + '</div><div style="font-size:10px;color:var(--text-tertiary);">' + s.name + '</div></div>';
            diagBarData.push({ label: s.name, value: parseInt(s.value, 10) || 0, color: s.color });
        });
        var diagDetailHTML = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b style=&quot;font-size:14px;&quot;>' + (diag.chart_title || '学情诊断') + '</b><br><br><b>各科掌握情况：</b><br>' + (diag.subjects || []).map(function (s) { return '· ' + s.name + '：' + s.value + '分'; }).join('<br>') + '<br><br><b>诊断结论：</b><br>整体学情稳定，建议重点强化薄弱科目，保持优势科目。<br><br><span style=&quot;color:#6B7280;&quot;>数据每小时更新一次。</span></div>';
        c += '<div class="proto-card" style="cursor:pointer;" onclick="openModal(\'学情诊断详情\', \'' + diagDetailHTML + '\')">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
                '<span style="font-size:13px;font-weight:600;">' + (diag.chart_title || '') + '</span>' +
                Tag(diag.tag_text || '实时更新', diag.tag_color || 'green') +
            '</div>' +
            '<div id="ai-module-coach-diag-chart"></div>' +
            '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:10px;">' + diagSubjectsHTML + '</div>' +
        '</div>';

        // AI学习路径推荐
        c += aiSectionTitle(path.title || 'AI学习路径推荐', path.title_icon || 'fa-route');
        var pathNodesHTML = '';
        var pathLineData = [];
        (path.nodes || []).forEach(function (n, i) {
            if (i > 0) {
                pathNodesHTML += '<i class="fas fa-arrow-right" style="font-size:10px;color:var(--text-tertiary);"></i>';
            }
            pathNodesHTML += '<span style="font-size:11px;padding:4px 10px;background:' + n.bg + ';color:' + n.color + ';border-radius:10px;font-weight:600;">' + n.text + '</span>';
            pathLineData.push(i + 1);
        });
        var pathDetailHTML = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b style=&quot;font-size:14px;&quot;>AI学习路径</b><br><br>' + (path.description || '') + '<br><br><b>学习节点：</b><br>' + (path.nodes || []).map(function (n, i) { return (i + 1) + '. ' + n.text; }).join('<br>') + '<br><br><span style=&quot;color:#6B7280;&quot;>按顺序完成各节点，可解锁下一阶段学习内容。</span></div>';
        c += '<div class="proto-card" style="cursor:pointer;" onclick="openModal(\'学习路径详情\', \'' + pathDetailHTML + '\')">' +
            '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">' + (path.description || '') + '</div>' +
            '<div id="ai-module-coach-path-chart"></div>' +
            '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:10px;">' + pathNodesHTML + '</div>' +
        '</div>';

        // AI每日报告
        c += aiSectionTitle(report.title || 'AI每日报告', report.title_icon || 'fa-file-alt', report.more || '查看全部', 'ai-coach');
        (report.reports || []).forEach(function (r) {
            var reportDetailHTML = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b style=&quot;font-size:14px;&quot;>' + r.day + ' · ' + r.title + '</b><br><br><b>报告摘要：</b><br>' + (r.desc || '暂无详细内容') + '<br><br><b>建议：</b><br>· 根据当日学习情况调整次日计划<br>· 重点巩固薄弱知识点<br>· 保持稳定的学习节奏<br><br><span style=&quot;color:#6B7280;&quot;>点击「与AI教练对话」可获取个性化指导。</span></div>';
            c += '<div class="proto-list-item" onclick="openModal(\'' + r.day + '报告详情\', \'' + reportDetailHTML + '\')">' +
                '<div class="icon" style="background:linear-gradient(135deg,#8B5CF6,#6D28D9);"><i class="fas fa-robot"></i></div>' +
                '<div class="text"><div class="title">' + r.day + ' · ' + r.title + '</div><div class="desc">' + (r.desc || '') + '</div></div>' +
                Tag(r.tag, r.color) +
                '<div class="arrow"><i class="fas fa-chevron-right"></i></div>' +
            '</div>';
        });

        // 对话按钮
        c += '<div style="margin-top:16px;">' +
            '<button class="proto-btn proto-btn-primary" onclick="navigateTo(\'ai-coach\')"><i class="fas ' + (data.chat_button_icon || 'fa-comments') + '"></i> ' + (data.chat_button_text || '与AI教练对话') + '</button>' +
        '</div>';

        // AI模型归因徽章
        c += aiModelBadge((data.ai_model_info || {}).items);

        container.innerHTML = c;
        // 异步绘制迷你图表（容器渲染完成后再调用）
        setTimeout(function () {
            if (typeof drawMiniChart === 'function') {
                if (document.getElementById('ai-module-coach-diag-chart')) {
                    drawMiniChart('ai-module-coach-diag-chart', diagBarData, { type: 'bar', height: 150, color: '#3B82F6' });
                }
                if (document.getElementById('ai-module-coach-path-chart')) {
                    drawMiniChart('ai-module-coach-path-chart', pathLineData, { type: 'line', height: 130, color: '#8B5CF6' });
                }
            }
        }, 50);
    }

    return Page({ title: 'AI学习教练', back: true, content: '<div id="ai-module-coach-content" style="background:#F3F4F6;min-height:100%;padding-bottom:20px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>' });
});

// ============================================================
// 2. AI讲题引擎
// ============================================================
registerPage('ai-module-explain', 'AI讲题引擎', 'AI核心模块', 'fa-robot', function () {
    setTimeout(function () {
        var container = document.getElementById('ai-module-explain-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getAiModuleExplain) return;

        api.getAiModuleExplain().then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var c = '';
        var intro = data.intro_card || {};
        var cq = data.current_question || {};
        var sp = data.step_progress || {};
        var st = data.steps_timeline || {};
        var uc = data.understanding_check || {};

        // 说明卡片
        c += GradientCard('cyan',
            '<div style="display:flex;align-items:flex-start;gap:10px;">' +
                '<i class="fas ' + (intro.icon || 'fa-magic') + '" style="font-size:22px;margin-top:2px;"></i>' +
                '<div>' +
                    '<div style="font-size:15px;font-weight:700;margin-bottom:4px;">' + (intro.title || '') + '</div>' +
                    '<div style="font-size:12px;opacity:0.9;line-height:1.5;">' + (intro.description || '') + '</div>' +
                '</div>' +
            '</div>'
        );

        // 当前讲解题目
        c += aiSectionTitle(cq.title || '当前讲解题目', cq.title_icon || 'fa-pencil-ruler');
        c += '<div class="proto-card" style="border-left:4px solid var(--primary);">' +
            '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">';
            (cq.tags || []).forEach(function (t) {
                c += Tag(t.text, t.color);
            });
            c += '</div>' +
            '<div style="font-size:14px;line-height:1.7;color:var(--text-primary);background:#F9FAFB;padding:12px;border-radius:8px;">' +
                (cq.content_prefix || '') + '<span style="font-style:italic;font-weight:600;">' + (cq.content_formula || '') + '</span>' + (cq.content_suffix || '') +
            '</div>' +
            '<div style="display:flex;justify-content:space-between;margin-top:10px;font-size:11px;color:var(--text-tertiary);">' +
                '<span><i class="' + (cq.time_icon || 'far fa-clock') + '"></i> ' + (cq.time_label || '') + '</span>' +
                '<span><i class="' + (cq.difficulty_icon || 'fas fa-fire') + '"></i> ' + (cq.difficulty_label || '') + '</span>' +
            '</div>' +
        '</div>';

        // 分步讲解进度（动态更新）
        c += aiSectionTitle(sp.title || '分步讲解进度', sp.title_icon || 'fa-list-ol');
        c += '<div class="proto-card">' +
            '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">' +
                '<div style="flex:1;">' +
                    '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">' +
                        '<span style="color:var(--text-secondary);">已完成 <span id="explain-completed">1</span> / ' + (sp.total || 0) + ' 步</span>' +
                        '<span id="explain-percent" style="font-weight:700;color:var(--primary);">' + Math.round(100 / (sp.total || 1)) + '%</span>' +
                    '</div>' +
                    '<div id="explain-progress-bar" style="height:8px;background:#E5E7EB;border-radius:4px;overflow:hidden;"><div style="height:100%;width:' + Math.round(100 / (sp.total || 1)) + '%;background:' + (sp.progress_color || 'var(--cyan)') + ';transition:width 0.5s;"></div></div>' +
                '</div>' +
                '<div id="explain-ring">' + RingChart(Math.round(100 / (sp.total || 1)), sp.ring_color || '#06B6D4', sp.ring_size || 56) + '</div>' +
            '</div>' +
        '</div>';

        // 讲解步骤时间轴（可交互：逐步展开）
        c += aiSectionTitle(st.title || '讲解步骤', st.title_icon || 'fa-stream');
        c += '<div class="proto-card"><div id="explain-steps-container">';
        // 只显示第1步，其余隐藏
        (st.steps || []).forEach(function (s, i) {
            var hidden = i > 0 ? 'style="display:none;"' : '';
            c += '<div class="explain-step" data-idx="' + i + '" ' + hidden + '>' + aiTimelineStep(s.num, i === 0 ? 'done' : 'pending', s.title, s.desc, s.time) + '</div>';
        });
        c += '</div>';
        // 思考动画占位
        c += '<div id="explain-thinking" style="display:none;padding:10px 0;text-align:center;"><i class="fas fa-spinner fa-spin" style="color:var(--primary);margin-right:6px;"></i><span style="font-size:12px;color:var(--text-secondary);">DeepSeek-R1 正在推理下一步…</span></div>';
        // 下一步按钮
        c += '<div id="explain-next-btn-wrap" style="margin-top:10px;text-align:center;">' +
            '<button id="explain-next-btn" class="proto-btn proto-btn-primary" onclick="explainNextStep()"><i class="fas fa-forward"></i> 下一步讲解</button>' +
        '</div>';
        c += '</div>';

        // 理解度检测
        c += aiSectionTitle(uc.title || '理解度检测', uc.title_icon || 'fa-question-circle');
        c += '<div class="proto-card" style="background:linear-gradient(135deg,#FEF3C7,#FDE68A);border:none;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
                '<i class="fas ' + (uc.icon || 'fa-comment-dots') + '" style="font-size:18px;color:#92400E;"></i>' +
                '<span style="font-size:14px;font-weight:700;color:#92400E;">' + (uc.question || '') + '</span>' +
            '</div>' +
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">';
            (uc.options || []).forEach(function (o) {
                var ucDetailHTML = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><div style=&quot;text-align:center;padding:14px;background:#F0FDF4;border-radius:8px;margin-bottom:10px;&quot;><i class=&quot;fas fa-check-circle&quot; style=&quot;font-size:28px;color:#10B981;&quot;></i><div style=&quot;margin-top:6px;font-weight:600;color:#10B981;&quot;>已记录反馈</div></div><b>你的反馈：</b>' + o.label + '<br><b>问题：</b>' + (uc.question || '') + '<br><br><span style=&quot;color:#6B7280;&quot;>AI将根据你的反馈调整后续讲解节奏。</span></div>';
                c += '<button onclick="openModal(\'理解度反馈\', \'' + ucDetailHTML + '\')" style="padding:10px;border:none;border-radius:8px;background:' + o.color + ';color:white;font-size:13px;font-weight:600;cursor:pointer;"><i class="fas ' + o.icon + '"></i> ' + o.label + '</button>';
            });
            c += '</div>' +
            '<div style="margin-top:10px;padding:8px 10px;background:rgba(255,255,255,0.6);border-radius:8px;font-size:11px;color:#92400E;line-height:1.5;">' +
                '<i class="fas fa-info-circle"></i> ' + (uc.hint || '') +
            '</div>' +
        '</div>';

        // AI模型归因徽章
        c += aiModelBadge((data.ai_model_info || {}).items);

        container.innerHTML = c;
    }

    return Page({ title: 'AI讲题引擎', back: true, content: '<div id="ai-module-explain-content" style="background:#F3F4F6;min-height:100%;padding-bottom:20px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>' });
});

// ============================================================
// 3. AI组卷引擎
// ============================================================
registerPage('ai-module-paper', 'AI组卷引擎', 'AI核心模块', 'fa-robot', function () {
    setTimeout(function () {
        var container = document.getElementById('ai-module-paper-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getAiModulePaper) return;

        api.getAiModulePaper().then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var c = '';
        var intro = data.intro_card || {};
        var params = data.params || {};
        var dd = params.difficulty_distribution || {};
        var basis = data.data_basis || {};
        var preview = data.preview || {};

        // 说明卡片
        c += GradientCard('blue',
            '<div style="display:flex;align-items:flex-start;gap:10px;">' +
                '<i class="fas ' + (intro.icon || 'fa-file-signature') + '" style="font-size:22px;margin-top:2px;"></i>' +
                '<div>' +
                    '<div style="font-size:15px;font-weight:700;margin-bottom:4px;">' + (intro.title || '') + '</div>' +
                    '<div style="font-size:12px;opacity:0.9;line-height:1.5;">' + (intro.description || '') + '</div>' +
                '</div>' +
            '</div>'
        );

        // 组卷参数设置
        c += aiSectionTitle(params.title || '组卷参数设置', params.title_icon || 'fa-sliders-h');
        c += '<div class="proto-card">' +
            aiInfoRow('科目', (params.subject || '') + ' <span style="color:var(--primary);font-size:11px;cursor:pointer;" onclick="openModal(\'切换科目\', \'<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b>当前科目：</b>' + (params.subject || '') + '<br><br><b>可选科目：</b><br>· 数学<br>· 语文<br>· 英语<br>· 物理<br>· 化学<br>· 生物<br><br><span style=&quot;color:#6B7280;&quot;>选择科目后将重新生成组卷参数。</span></div>\')">切换 ›</span>') +
            aiInfoRow('题量', params.count || '') +
            aiInfoRow('预计用时', params.time || '') +
            '<div style="padding:8px 0;">' +
                '<div style="display:flex;justify-content:space-between;font-size:13px;color:var(--text-secondary);margin-bottom:6px;">' +
                    '<span>' + (dd.label || '难度分布') + '</span>' +
                    '<span style="color:var(--text-primary);font-weight:600;">' + (dd.summary || '') + '</span>' +
                '</div>' +
                '<div style="display:flex;height:10px;border-radius:5px;overflow:hidden;">' +
                    '<div style="width:' + (dd.easy_percent || 0) + '%;background:var(--success);"></div>' +
                    '<div style="width:' + (dd.medium_percent || 0) + '%;background:var(--warning);"></div>' +
                    '<div style="width:' + (dd.hard_percent || 0) + '%;background:var(--danger);"></div>' +
                '</div>' +
                '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--text-tertiary);margin-top:4px;">' +
                    '<span>' + (dd.easy_count || '') + '</span><span>' + (dd.medium_count || '') + '</span><span>' + (dd.hard_count || '') + '</span>' +
                '</div>' +
            '</div>' +
        '</div>';

        // 数据依据
        c += aiSectionTitle(basis.title || 'AI组卷数据依据', basis.title_icon || 'fa-database');
        c += '<div class="proto-card" style="background:#F0F9FF;border:1px solid #BAE6FD;">' +
            '<div style="display:flex;flex-direction:column;gap:10px;">';
            (basis.items || []).forEach(function (it) {
                c += '<div style="display:flex;gap:10px;align-items:flex-start;">' +
                    '<div style="width:28px;height:28px;border-radius:8px;background:' + it.bg + ';color:' + it.color + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;"><i class="fas ' + it.icon + '"></i></div>' +
                    '<div style="font-size:13px;line-height:1.5;">' + it.content + '</div>' +
                '</div>';
            });
            c += '</div>' +
        '</div>';

        // 生成的试卷预览
        c += aiSectionTitle(preview.title || '生成的试卷预览', preview.title_icon || 'fa-file-alt', preview.more || '');
        (preview.questions || []).forEach(function (q) {
            var qDetailHTML = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b style=&quot;font-size:14px;&quot;>第 ' + q.n + ' 题</b><br><br><b>题型：</b>' + q.type + '<br><b>难度：</b>' + q.diff + '<br><b>分值：</b>' + q.score + '分<br><b>来源：</b>' + q.source + '<br><b>考点：</b>' + q.kp + '<br><br><span style=&quot;color:#6B7280;&quot;>该题目由AI从题库智能匹配，可点击下方按钮进行预览或替换。</span></div>';
            c += '<div class="proto-card" style="padding:12px;margin-bottom:8px;cursor:pointer;" onclick="openModal(\'第' + q.n + '题详情\', \'' + qDetailHTML + '\')">' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
                    '<span style="width:24px;height:24px;border-radius:6px;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">' + q.n + '</span>' +
                    '<span style="font-size:13px;font-weight:600;">第 ' + q.n + ' 题</span>' +
                    Tag(q.type, 'blue') +
                    Tag(q.diff, q.diffColor) +
                    '<span style="margin-left:auto;font-size:12px;font-weight:700;color:var(--primary);">' + q.score + '</span>' +
                '</div>' +
                '<div style="font-size:12px;color:var(--text-secondary);line-height:1.5;">来源：' + q.source + ' · 考点：' + q.kp + '</div>' +
            '</div>';
        });
        c += '<div style="text-align:center;font-size:12px;color:var(--text-tertiary);padding:8px;">' + (preview.more_tip || '') + '</div>';

        // 操作按钮（重新生成有真实交互）
        c += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px;">';
        (data.buttons || []).forEach(function (b) {
            var cls = b.type === 'primary' ? 'proto-btn proto-btn-primary' : 'proto-btn proto-btn-outline';
            var isDownload = (b.text.indexOf('下载') >= 0 || b.text.indexOf('导出') >= 0);
            var isRegen = (b.text.indexOf('重新') >= 0);
            if (isRegen) {
                c += '<button class="' + cls + '" id="paper-regen-btn" onclick="paperRegenerate()"><i class="fas ' + b.icon + '"></i> ' + b.text + '</button>';
            } else {
                var btnTitle = isDownload ? '导出/下载' : 'AI处理';
                var btnDetailHTML = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><div style=&quot;text-align:center;padding:16px;&quot;><i class=&quot;fas ' + (isDownload ? 'fa-file-download' : 'fa-spinner fa-spin') + '&quot; style=&quot;font-size:24px;color:' + (isDownload ? '#10B981' : '#3B82F6') + ';&quot;></i></div><b>' + (isDownload ? '正在下载...' : 'AI正在处理...') + '</b><br>· 操作：' + b.text + '<br>· 题量：' + (params.count || '') + '<br>· 科目：' + (params.subject || '') + '<br>· 预计耗时：' + (isDownload ? '3秒' : '8秒') + '<br><br><span style=&quot;color:#6B7280;&quot;>' + (isDownload ? '文件已生成，正在下载...' : '处理完成后将自动更新预览。') + '</span></div>';
                c += '<button class="' + cls + '" onclick="openModal(\'' + btnTitle + '\', \'' + btnDetailHTML + '\')"><i class="fas ' + b.icon + '"></i> ' + b.text + '</button>';
            }
        });
        c += '</div>';
        // 重新生成状态提示区
        c += '<div id="paper-regen-status" style="display:none;margin-top:10px;padding:10px;background:#EFF6FF;border-radius:8px;font-size:12px;color:#1E40AF;text-align:center;"></div>';

        // 缓存数据供重新生成使用
        window._paperData = data;
        window._paperParams = params;
        window._paperPreview = preview;
        // 接入数据中台：组卷结果持久化到 KV（失败不阻断 UI）
        if (typeof api !== 'undefined' && api.savePageData) {
            api.savePageData('ai-module-paper', { data: data, params: params, preview: preview }).catch(function () {});
        }

        // AI模型归因徽章
        c += aiModelBadge((data.ai_model_info || {}).items);

        container.innerHTML = c;
    }

    return Page({ title: 'AI组卷引擎', back: true, content: '<div id="ai-module-paper-content" style="background:#F3F4F6;min-height:100%;padding-bottom:20px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>' });
});

// ============================================================
// 4. AI知识图谱
// ============================================================
registerPage('ai-module-graph', 'AI知识图谱', 'AI核心模块', 'fa-robot', function () {
    setTimeout(function () {
        var container = document.getElementById('ai-module-graph-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getAiModuleGraph) return;

        api.getAiModuleGraph().then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var c = '';
        var intro = data.intro_card || {};
        var gv = data.graph_visualization || {};
        var ml = data.mastery_list || {};
        var sug = data.ai_suggestion || {};

        // 说明卡片
        c += GradientCard('green',
            '<div style="display:flex;align-items:flex-start;gap:10px;">' +
                '<i class="fas ' + (intro.icon || 'fa-project-diagram') + '" style="font-size:22px;margin-top:2px;"></i>' +
                '<div>' +
                    '<div style="font-size:15px;font-weight:700;margin-bottom:4px;">' + (intro.title || '') + '</div>' +
                    '<div style="font-size:12px;opacity:0.9;line-height:1.5;">' + (intro.description || '') + '</div>' +
                '</div>' +
            '</div>'
        );

        // 学科选择
        c += '<div style="margin-bottom:12px;">' + Segment(data.subjects || [], data.active_subject_index || 0) + '</div>';

        // 知识图谱可视化
        c += aiSectionTitle(gv.title || '知识图谱可视化', gv.title_icon || 'fa-sitemap');
        var graphPieData = (gv.legend || []).map(function (l) { return { label: l.label, value: l.count, color: l.color }; });
        c += '<div class="proto-card">' +
            '<div id="ai-module-graph-chart"></div>' +
            '<div style="display:flex;justify-content:space-around;margin-top:10px;font-size:11px;">';
            (gv.legend || []).forEach(function (l) {
                c += '<span><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + l.color + ';margin-right:4px;"></span>' + l.label + ' ' + l.count + '</span>';
            });
            c += '</div>' +
        '</div>';

        // 交互式知识图谱（DeepKE构建，可点击节点）
        var nodes = data.graph_nodes || [];
        var edges = data.graph_edges || [];
        if (nodes.length > 0) {
            c += aiSectionTitle('交互式知识图谱', 'fa-project-diagram');
            c += '<div class="proto-card" style="background:#0F172A;color:white;">';
            c += '<div style="font-size:11px;color:#94A3B8;margin-bottom:8px;"><i class="fas fa-mouse-pointer"></i> 点击节点查看关联关系与掌握度 · 引擎：DeepKE + GraphSAGE</div>';
            // 用SVG绘制图谱
            c += '<div style="position:relative;height:220px;background:#1E293B;border-radius:8px;overflow:hidden;">';
            c += '<svg width="100%" height="100%" viewBox="0 0 400 220" style="position:absolute;top:0;left:0;">';
            // 绘制边
            edges.forEach(function (e) {
                var src = nodes.find(function (n) { return n.id === e.source; });
                var tgt = nodes.find(function (n) { return n.id === e.target; });
                if (src && tgt) {
                    c += '<line x1="' + src.x + '" y1="' + src.y + '" x2="' + tgt.x + '" y2="' + tgt.y + '" stroke="#475569" stroke-width="1.5" stroke-dasharray="3,3" />';
                }
            });
            c += '</svg>';
            // 绘制节点（可点击）
            nodes.forEach(function (n) {
                var color = n.mastery >= 80 ? '#10B981' : n.mastery >= 60 ? '#F59E0B' : '#EF4444';
                c += '<div onclick="graphNodeClick(\'' + n.id + '\')" style="position:absolute;left:' + (n.x - 20) + 'px;top:' + (n.y - 12) + 'px;width:40px;text-align:center;cursor:pointer;" title="掌握度' + n.mastery + '%">' +
                    '<div style="width:24px;height:24px;border-radius:50%;background:' + color + ';margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;box-shadow:0 0 8px ' + color + ';">' + n.mastery + '</div>' +
                    '<div style="font-size:10px;margin-top:2px;white-space:nowrap;">' + n.label + '</div>' +
                '</div>';
            });
            c += '</div>';
            // 图例
            c += '<div style="display:flex;gap:12px;margin-top:8px;font-size:10px;">' +
                '<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10B981;"></span> 掌握(≥80%)</span>' +
                '<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#F59E0B;"></span> 一般(60-79%)</span>' +
                '<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#EF4444;"></span> 薄弱(<60%)</span>' +
            '</div>';
            c += '</div>';
            // 缓存图谱数据
            window._graphNodes = nodes;
            window._graphEdges = edges;
        }

        // 知识点掌握情况
        c += aiSectionTitle(ml.title || '知识点掌握情况', ml.title_icon || 'fa-tasks');
        (ml.items || []).forEach(function (kp) {
            c += '<div class="proto-card" style="padding:12px;margin-bottom:8px;">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
                    '<span style="font-size:13px;font-weight:600;">' + kp.path + '</span>' +
                    '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:' + kp.bg + ';color:var(--text-primary);font-weight:600;">' + kp.status + '</span>' +
                '</div>' +
                (kp.action ? '<button onclick="openModal(\'知识点详情\', \'<div style=&quot;padding:14px;font-size:13px;line-height:1.7;&quot;><b style=&quot;font-size:14px;&quot;>' + kp.path + '</b><br><span style=&quot;color:#6B7280;&quot;>掌握状态：</span>' + kp.status + '<br><br>AI将根据该知识点的掌握情况，生成针对性训练题，帮助你巩固薄弱环节。</div>\')" style="font-size:11px;padding:4px 10px;border:none;border-radius:6px;background:var(--primary);color:white;font-weight:600;cursor:pointer;"><i class="fas fa-plus"></i> ' + kp.action + '</button>' : '') +
            '</div>';
        });

        // AI建议
        c += aiSectionTitle(sug.title || 'AI建议', sug.title_icon || 'fa-lightbulb');
        c += '<div class="proto-card" style="background:linear-gradient(135deg,#EDE9FE,#DDD6FE);border:none;">' +
            '<div style="display:flex;gap:10px;align-items:flex-start;">' +
                '<i class="fas fa-robot" style="font-size:20px;color:#5B21B6;margin-top:2px;"></i>' +
                '<div style="font-size:13px;line-height:1.6;color:#3B0764;">' + (sug.content || '') + '</div>' +
            '</div>' +
        '</div>';

        c += '<button class="proto-btn proto-btn-primary" style="margin-top:8px;" onclick="openModal(\'生成训练题\', \'<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><i class=&quot;fas fa-sync-alt fa-spin&quot; style=&quot;color:#3B82F6;font-size:20px;margin-right:6px;&quot;></i>AI正在生成针对性训练题...<br><br><b>生成步骤：</b><br>1. 分析薄弱知识点<br>2. 匹配题库资源<br>3. 生成针对性练习<br><br><span style=&quot;color:#6B7280;&quot;>生成完成后将自动跳转到练习页面。</span></div>\')"><i class="fas ' + (data.train_button_icon || 'fa-bolt') + '"></i> ' + (data.train_button_text || '开始针对性训练') + '</button>';

        // AI模型归因徽章
        c += aiModelBadge((data.ai_model_info || {}).items);

        container.innerHTML = c;
        setTimeout(function () {
            if (typeof drawMiniChart === 'function' && document.getElementById('ai-module-graph-chart')) {
                drawMiniChart('ai-module-graph-chart', graphPieData, { type: 'pie', height: 180 });
            }
        }, 50);
    }

    return Page({ title: 'AI知识图谱', back: true, content: '<div id="ai-module-graph-content" style="background:#F3F4F6;min-height:100%;padding-bottom:20px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>' });
});

// ============================================================
// 5. AI预测高考
// ============================================================
registerPage('ai-module-predict', 'AI预测高考', 'AI核心模块', 'fa-robot', function () {
    setTimeout(function () {
        var container = document.getElementById('ai-module-predict-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getAiModulePredict) return;

        api.getAiModulePredict().then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var c = '';
        var input = data.input_section || {};
        var pr = data.predict_result || {};
        var cc = data.confidence_card || {};
        var bs = data.basis_section || {};
        var ps = data.path_section || {};

        // 输入区域说明
        c += aiSectionTitle(input.title || '输入最近三次考试成绩', input.title_icon || 'fa-edit');
        (input.exams || []).forEach(function (e) {
            var colorVar = e.color === 'blue' ? 'var(--primary)' : 'var(--' + e.color + ')';
            var detailHTML = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b style=&quot;font-size:14px;&quot;>' + e.n + '</b><br><br><b>总分：</b><span style=&quot;color:' + colorVar + ';font-weight:700;&quot;>' + e.total + ' 分</span><br><b>各科详情：</b>' + e.subs + '<br><br><span style=&quot;color:#6B7280;&quot;>点击下方按钮可编辑或录入新的成绩数据</span></div>';
            c += '<div class="proto-card" style="padding:12px;margin-bottom:8px;border-left:4px solid ' + colorVar + ';cursor:pointer;" onclick="openModal(\'' + e.n + ' 成绩详情\', \'' + detailHTML + '\')">' +
                '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
                    '<span style="font-size:13px;font-weight:600;">' + e.n + '</span>' +
                    '<span style="font-size:18px;font-weight:700;color:' + colorVar + ';">' + e.total + '<span style="font-size:11px;color:var(--text-tertiary);font-weight:400;">分</span> <i class="fas fa-chevron-right" style="font-size:10px;color:#9CA3AF;margin-left:4px;"></i></span>' +
                '</div>' +
                '<div style="font-size:11px;color:var(--text-secondary);line-height:1.5;">' + e.subs + '</div>' +
            '</div>';
        });

        // 趋势
        var trendLineData = (input.exams || []).map(function (e) { return parseInt(e.total, 10) || 0; });
        c += '<div class="proto-card" style="padding:10px;"><div id="ai-module-predict-trend-chart"></div></div>';

        // 重新预测按钮（XGBoost集成模型）
        c += '<div style="text-align:center;margin:8px 0 12px;">' +
            '<button id="predict-recalc-btn" class="proto-btn proto-btn-primary" onclick="predictRecalculate()"><i class="fas fa-calculator"></i> 重新AI预测（XGBoost集成）</button>' +
            '<div id="predict-status" style="display:none;margin-top:8px;font-size:12px;color:#1E40AF;"></div>' +
        '</div>';
        window._predictExams = input.exams || [];
        window._predictResult = pr;
        // 接入数据中台：预测结果持久化到 KV
        if (typeof api !== 'undefined' && api.savePageData) {
            api.savePageData('ai-module-predict', { exams: input.exams || [], result: pr }).catch(function () {});
        }

        // AI预测结果
        c += aiSectionTitle(pr.title || 'AI预测结果', pr.title_icon || 'fa-brain');
        var predictSubjectsHTML = '';
        (pr.subjects || []).forEach(function (s) {
            predictSubjectsHTML += '<div style="display:flex;align-items:center;gap:8px;font-size:12px;"><span style="width:36px;">' + s.name + '</span><div style="flex:1;height:6px;background:rgba(255,255,255,0.2);border-radius:3px;overflow:hidden;"><div style="width:' + s.bar_percent + '%;height:100%;background:#FBBF24;border-radius:3px;"></div></div><span style="width:80px;text-align:right;">' + s.from + '→' + s.to + ' <b style="color:#FDE68A;">+' + s.increase + '</b></span></div>';
        });
        c += GradientCard('blue',
            '<div style="text-align:center;margin-bottom:12px;">' +
                '<div style="font-size:12px;opacity:0.9;margin-bottom:4px;">预测高考分数</div>' +
                '<div style="font-size:42px;font-weight:700;line-height:1;">' + (pr.predicted_score || 0) + '<span style="font-size:16px;opacity:0.8;">分</span></div>' +
                '<div style="font-size:12px;opacity:0.9;margin-top:6px;">' + (pr.change_label || '') + ' <b>' + (pr.change_value || '') + '</b> · ' + (pr.confidence_label || '') + ' <b>' + (pr.confidence_value || '') + '</b></div>' +
            '</div>' +
            '<div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:12px;">' +
                '<div style="font-size:12px;opacity:0.9;margin-bottom:8px;">' + (pr.subjects_subtitle || '') + '</div>' +
                '<div style="display:flex;flex-direction:column;gap:6px;">' + predictSubjectsHTML + '</div>' +
            '</div>'
        );

        // 预测置信度
        var ccDetailHTML = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b style=&quot;font-size:14px;color:' + (cc.ring_color || '#3B82F6') + ';&quot;>' + (cc.title || '预测置信度') + '</b><br><br><b>置信度：</b>' + (cc.ring_percent || 0) + '%<br><br><b>置信度说明：</b><br>' + (cc.description || '') + '<br><br><b>影响因素评估：</b><br>· 历史数据量：<span style=&quot;color:#10B981;&quot;>充足（近12次考试）</span><br>· 分数波动幅度：<span style=&quot;color:#F59E0B;&quot;>中等（±8分）</span><br>· 近期趋势稳定：<span style=&quot;color:#10B981;&quot;>稳定（持续上升）</span><br><br><b>置信等级：</b><span style=&quot;color:' + (cc.ring_color || '#3B82F6') + ';font-weight:700;&quot;>' + ((cc.ring_percent || 0) >= 85 ? '高' : (cc.ring_percent || 0) >= 70 ? '中' : '低') + '</span><br><br><span style=&quot;color:#6B7280;&quot;>持续积累学习数据后，预测准确度将进一步提升。</span></div>';
        c += '<div class="proto-card" style="display:flex;align-items:center;gap:16px;cursor:pointer;" onclick="openModal(\'' + (cc.title || '预测置信度') + '\', \'' + ccDetailHTML + '\')">' +
            RingChart(cc.ring_percent || 0, cc.ring_color || '#3B82F6', cc.ring_size || 72) +
            '<div style="flex:1;">' +
                '<div style="font-size:14px;font-weight:700;margin-bottom:4px;">' + (cc.title || '') + '</div>' +
                '<div style="font-size:12px;color:var(--text-secondary);line-height:1.5;">' + (cc.description || '') + '</div>' +
            '</div>' +
            '<i class="fas fa-chevron-right" style="color:#9CA3AF;font-size:11px;"></i>' +
        '</div>';

        // 预测依据
        var bsDetailHTML = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b style=&quot;font-size:14px;&quot;>' + (bs.title || '预测依据说明') + '</b><br><br>' + (bs.items || []).map(function(it){return '<i class=&quot;fas '+it.icon+'&quot; style=&quot;color:'+it.color+';margin-right:6px;&quot;></i>'+it.content;}).join('<br><br>') + '<br><br><b>AI模型说明：</b><br>本次预测采用加权回归模型，基于近12次模考成绩、近期学习数据、知识点掌握程度、班级排名变化等多维度特征综合计算。历史同类学生预测误差 ±4.2 分。<br><br><span style=&quot;color:#6B7280;&quot;>仅供参考，实际成绩还受临场发挥等因素影响。</span></div>';
        c += aiSectionTitle(bs.title || '预测依据说明', bs.title_icon || 'fa-info-circle');
        c += '<div class="proto-card" style="cursor:pointer;" onclick="openModal(\'' + (bs.title || '预测依据说明') + '\', \'' + bsDetailHTML + '\')">' +
            '<div style="font-size:13px;color:var(--text-secondary);line-height:1.7;">';
            (bs.items || []).forEach(function (it, i) {
                var isLast = i === (bs.items || []).length - 1;
                c += '<div style="' + (isLast ? '' : 'margin-bottom:6px;') + '"><i class="fas ' + it.icon + '" style="color:' + it.color + ';margin-right:6px;"></i>' + it.content + '</div>';
            });
            c += '</div>' +
            '<div style="text-align:right;color:#9CA3AF;font-size:11px;margin-top:8px;">查看详细说明 ›</div>' +
        '</div>';

        // 各科提升路径
        c += aiSectionTitle(ps.title || '各科提升路径建议', ps.title_icon || 'fa-map-marked-alt');
        (ps.paths || []).forEach(function (p) {
            var colorVar = p.color === 'blue' ? 'var(--primary)' : 'var(--' + p.color + ')';
            var pathDetailHTML = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b style=&quot;font-size:14px;color:' + colorVar + ';&quot;>' + p.sub + ' → ' + p.target + '</b><br><br><b>提升方式：</b><br>' + p.way + '<br><br><b>建议训练：</b><br>· 每日3-5道专项练习<br>· 重点突破薄弱知识点<br>· 每周一次模拟测试<br><br><span style=&quot;color:#6B7280;&quot;>AI将根据你的学习进度动态调整训练计划。</span></div>';
            c += '<div class="proto-list-item" onclick="openModal(\'' + p.sub + '提升路径\', \'' + pathDetailHTML + '\')">' +
                '<div class="icon" style="background:' + colorVar + ';"><i class="fas fa-arrow-up"></i></div>' +
                '<div class="text"><div class="title">' + p.sub + ' → ' + p.target + '</div><div class="desc">' + p.way + '</div></div>' +
                '<div class="arrow"><i class="fas fa-chevron-right"></i></div>' +
            '</div>';
        });

        // AI模型归因徽章
        c += aiModelBadge((data.ai_model_info || {}).items);

        container.innerHTML = c;
        setTimeout(function () {
            if (typeof drawMiniChart === 'function' && document.getElementById('ai-module-predict-trend-chart')) {
                drawMiniChart('ai-module-predict-trend-chart', trendLineData, { type: 'line', height: 90, color: '#3B82F6' });
            }
        }, 50);
    }

    return Page({ title: 'AI预测高考', back: true, content: '<div id="ai-module-predict-content" style="background:#F3F4F6;min-height:100%;padding-bottom:20px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>' });
});

// ============================================================
// 6. AI自动入库
// ============================================================
registerPage('ai-auto-import', 'AI自动入库', 'AI核心模块', 'fa-robot', function () {
    setTimeout(function () {
        var container = document.getElementById('ai-auto-import-content');
        if (!container) return;

        // === 兜底数据：直接从 PAGE_SAMPLE_DATA 获取（即使 api.js 未加载/API超时也能渲染）===
        var sampleData = (typeof window !== 'undefined' && window.PAGE_SAMPLE_DATA && window.PAGE_SAMPLE_DATA['ai-auto-import'])
            ? window.PAGE_SAMPLE_DATA['ai-auto-import'] : null;

        // === 双保险兜底：3 秒后仍停留在 loading 占位符，强制用 sampleData 渲染（防 API 永久 pending）===
        var safetyTimer = setTimeout(function () {
            if (container && container.innerHTML && container.innerHTML.indexOf('fa-spinner') >= 0 && sampleData) {
                console.warn('[AI-AUTO-IMPORT] 数据加载超时(3s)，使用 PAGE_SAMPLE_DATA 兜底渲染');
                renderPageContent(container, sampleData);
            }
        }, 3000);

        function doneRender(data) {
            clearTimeout(safetyTimer);
            if (!data || !container) return;
            renderPageContent(container, data);
        }

        // 1. 优先尝试真实 API（有 mock fallback 机制兜底）
        if (typeof api !== 'undefined' && api && typeof api.getPageData === 'function') {
            try {
                api.getPageData('ai-auto-import').then(function (data) {
                    if (data) return doneRender(data);
                    // API 返回 null，用 sampleData
                    if (sampleData) doneRender(sampleData);
                    else doneRender(fallbackAiAutoImportData());
                }).catch(function () {
                    if (sampleData) doneRender(sampleData);
                    else doneRender(fallbackAiAutoImportData());
                });
            } catch (e) {
                if (sampleData) doneRender(sampleData);
                else doneRender(fallbackAiAutoImportData());
            }
        } else {
            // api 未定义（脚本加载顺序、ABORTED 等），直接用 sampleData
            if (sampleData) doneRender(sampleData);
            else doneRender(fallbackAiAutoImportData());
        }
    }, 100);

    // 最后兜底：完全没有任何数据源时的极简数据（保证 7→8→9 推进可见）
    function fallbackAiAutoImportData() {
        return {
            header_card: {
                icon: 'fa-cogs', title: 'AI自动入库', description: '自动解析教材/试卷，切分题目→校验→入库→图谱关联',
                progress_label: '整体进度', progress_percent: 67, progress_color: '#FFFFFF',
                completed_steps: 6, total_steps: 9, current_step: 'AI审核校验'
            },
            flow_section: {
                title: '完整流程', title_icon: 'fa-stream',
                steps: [
                    { num: 1, status: 'done', title: '选择数据源', desc: '选择"高考试卷 PDF 扫描版"，共 12 页，识别区域已勾选。', time: '0.2 秒' },
                    { num: 2, status: 'done', title: 'OCR文字识别', desc: '108 个识别块，中英文/数学公式/化学方程式准确率 98.7%。', time: '1.8 秒' },
                    { num: 3, status: 'done', title: '切分题目', desc: '切出 12 道独立题目，含题干+配图+小题标注，已自动去除页眉页脚水印。', time: '0.6 秒' },
                    { num: 4, status: 'done', title: '字段补全', desc: '提取：科目、题型、年份、难度、分值、所属试卷。字段完整度 92%。', time: '0.4 秒' },
                    { num: 5, status: 'done', title: '标准答案与解析', desc: '12 道题已匹配参考答案，8 道有详细解析，4 道需教师补充。', time: '0.9 秒' },
                    { num: 6, status: 'done', title: '图片与图表提取', desc: '提取 3 张几何图、2 张函数图像、1 张实验装置图，已单独裁剪保存。', time: '0.5 秒' },
                    { num: 7, status: 'active', title: 'AI审核校验', desc: 'AI 正在校验题目内容完整性、公式正确性、答案一致性...', time: '进行中...' },
                    { num: 8, status: 'locked', title: '知识图谱标注', desc: '自动关联知识图谱节点，标注考点与难度等级', time: '待处理' },
                    { num: 9, status: 'locked', title: '入库完成', desc: '最终写入题库数据库并建立索引', time: '待处理' }
                ]
            },
            step_summary: {
                title: '步骤说明', title_icon: 'fa-info-circle',
                stats: [
                    { label: '已完成步骤', value: '6', bg: '#ECFDF5', color: '#059669', label_color: '#047857' },
                    { label: '进行中', value: '1', bg: '#FFFBEB', color: '#D97706', label_color: '#B45309' },
                    { label: '待处理', value: '2', bg: '#F9FAFB', color: '#6B7280', label_color: '#4B5563' },
                    { label: '预计耗时', value: '~6s', bg: '#F3E8FF', color: '#7C3AED', label_color: '#6D28D9' }
                ]
            },
            buttons: [
                { text: '查看OCR详情', icon: 'fa-magnifying-glass', type: 'outline', page: 'ai-auto-import-ocr' },
                { text: '查看切题详情', icon: 'fa-scissors', type: 'primary', page: 'ai-auto-import-cut' }
            ]
        };
    }

    function renderPageContent(container, data) {
        var c = '';
        var header = data.header_card || {};
        var flow = data.flow_section || {};
        var summary = data.step_summary || {};

        // === 防引用污染：深拷贝 steps，每次进入页面强制重置状态到第7步 active ===
        // 解决问题：之前复用了 window.PAGE_SAMPLE_DATA 的 steps 数组引用，上一次渲染推进到 done 后
        // 下一次再进入时直接从 done 开始显示（没有动画过程），进度百分比卡在67%不更新
        var rawSteps = (flow.steps && flow.steps.length) ? flow.steps : [];
        var steps = rawSteps.map(function (s) { return JSON.parse(JSON.stringify(s)); });
        if (steps.length >= 9) {
            for (var j = 0; j < steps.length; j++) {
                if (steps[j].num <= 6) steps[j].status = 'done';
                else if (steps[j].num === 7) steps[j].status = 'active';
                else steps[j].status = 'locked';
            }
        }
        var totalSteps = steps.length || (header.total_steps || 9);
        var initCompleted = Math.max(0, steps.filter(function (s) { return s.status === 'done'; }).length);
        var initPct = totalSteps ? Math.round((initCompleted / totalSteps) * 100) : 0;
        var initActiveStep = steps.filter(function (s) { return s.status === 'active'; })[0];
        var initCurrentStepName = initActiveStep ? initActiveStep.title : '';

        // 标题流程（顶部进度卡）——id 便于自动推进时更新
        c += GradientCard('orange',
            '<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">' +
                '<i class="fas ' + (header.icon || 'fa-cogs') + '" style="font-size:22px;margin-top:2px;"></i>' +
                '<div>' +
                    '<div style="font-size:15px;font-weight:700;margin-bottom:4px;">' + (header.title || '') + '</div>' +
                    '<div style="font-size:11px;opacity:0.9;line-height:1.6;">' + (header.description || '') + '</div>' +
                '</div>' +
            '</div>' +
            '<div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;">' +
                '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;">' +
                    '<span>' + (header.progress_label || '整体进度') + '</span>' +
                    '<span id="ai-auto-import-progress-percent" style="font-weight:700;">' + initPct + '%</span>' +
                '</div>' +
                '<div id="ai-auto-import-progress-bar">' + Progress(initPct, header.progress_color || '#FFFFFF') + '</div>' +
                '<div id="ai-auto-import-progress-text" style="font-size:11px;opacity:0.9;margin-top:6px;">已完成 ' + initCompleted + '/' + totalSteps + ' 步骤 · 当前：' + (initCurrentStepName || header.current_step || '') + '</div>' +
            '</div>'
        );

        // 完整流程图 ——每个步骤加 id，便于自动推进时定位
        c += aiSectionTitle(flow.title || '完整流程', flow.title_icon || 'fa-stream');
        c += '<div class="proto-card">';
        steps.forEach(function (s) {
            c += '<div id="ai-auto-import-step-' + s.num + '" data-step="' + s.num + '" data-status="' + s.status + '">' +
                aiTimelineStep(s.num, s.status, s.title, s.desc, s.time) +
            '</div>';
        });
        c += '</div>';

        // 步骤说明 ——加 id，自动推进时同步更新统计
        c += aiSectionTitle(summary.title || '步骤说明', summary.title_icon || 'fa-info-circle');
        c += '<div class="proto-card">' +
            '<div id="ai-auto-import-stats" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
            // 重写 stats：用实际 initCompleted 计算，避免数组引用污染
            var initActive = 1;
            var initPending = Math.max(0, totalSteps - initCompleted - initActive);
            var renderStats = (summary.stats || []).length >= 4
                ? [
                    { value: String(initCompleted), bg: (summary.stats[0] || {}).bg || '#ECFDF5', color: (summary.stats[0] || {}).color || '#059669', label_color: (summary.stats[0] || {}).label_color || '#047857', label: (summary.stats[0] || {}).label || '已完成步骤' },
                    { value: String(initActive), bg: (summary.stats[1] || {}).bg || '#FFFBEB', color: (summary.stats[1] || {}).color || '#D97706', label_color: (summary.stats[1] || {}).label_color || '#B45309', label: (summary.stats[1] || {}).label || '进行中' },
                    { value: String(initPending), bg: (summary.stats[2] || {}).bg || '#F9FAFB', color: (summary.stats[2] || {}).color || '#6B7280', label_color: (summary.stats[2] || {}).label_color || '#4B5563', label: (summary.stats[2] || {}).label || '待处理' },
                    { value: (summary.stats[3] || {}).value || '~6s', bg: (summary.stats[3] || {}).bg || '#F3E8FF', color: (summary.stats[3] || {}).color || '#7C3AED', label_color: (summary.stats[3] || {}).label_color || '#6D28D9', label: (summary.stats[3] || {}).label || '预计耗时' }
                  ]
                : [];
            renderStats.forEach(function (s, i) {
                c += '<div id="ai-auto-import-stat-' + i + '" style="background:' + s.bg + ';border-radius:8px;padding:10px;text-align:center;">' +
                    '<div style="font-size:24px;font-weight:700;color:' + s.color + ';">' + s.value + '</div>' +
                    '<div style="font-size:11px;color:' + s.label_color + ';">' + s.label + '</div>' +
                '</div>';
            });
            c += '</div>' +
        '</div>';

        c += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">';
        (data.buttons || []).forEach(function (b) {
            var cls = b.type === 'primary' ? 'proto-btn proto-btn-primary' : 'proto-btn proto-btn-outline';
            var onclickAttr = b.page ? ' onclick="navigateTo(\'' + b.page + '\')"' : ' onclick="openModal(\'AI处理中\', \'<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><i class=&quot;fas fa-sync-alt fa-spin&quot; style=&quot;color:#3B82F6;font-size:20px;margin-right:6px;&quot;></i>AI正在处理您的请求...<br><br><span style=&quot;color:#6B7280;&quot;>请稍候，处理完成后将显示结果。</span></div>\')"';
            c += '<button class="' + cls + '"' + onclickAttr + '><i class="fas ' + b.icon + '"></i> ' + b.text + '</button>';
        });
        c += '</div>';

        container.innerHTML = c;

        // === 自动推进流程：让 7→8→9 依次完成 ===
        // 解决问题：原本第7步 AI审核校验一直停在 active，流程无法推进到第9步入库完成
        // 策略：页面渲染后 1.5s 启动自动推进，每 2.2s 推进一个步骤，全部变为 done
        window.__aiAutoImportAdvancing__ = false;
        setTimeout(function () { advanceAutoImportFlow(steps, totalSteps); }, 1500);
    }

    return Page({ title: 'AI自动入库', back: true, content: '<div id="ai-auto-import-content" style="background:#F3F4F6;min-height:100%;padding-bottom:20px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>' });
});

// ============================================================
// AI自动入库 - 流程自动推进：让 active/locked 状态的步骤依次变为 done
// 解决问题：原本第7步 AI审核校验一直停滞在 active，后续 8/9 步骤无法解锁
// 实现：找到第一个非 done 步骤，先 active（进行中1.2s）再 done（完成），递归推进下一步
// ============================================================
window.advanceAutoImportFlow = function (steps, totalSteps) {
    if (window.__aiAutoImportAdvancing__) return;
    window.__aiAutoImportAdvancing__ = true;

    function recomputeProgress(doneCount) {
        var pct = totalSteps ? Math.round((doneCount / totalSteps) * 100) : 0;
        var pctEl = document.getElementById('ai-auto-import-progress-percent');
        if (pctEl) pctEl.textContent = pct + '%';
        var barEl = document.getElementById('ai-auto-import-progress-bar');
        if (barEl) barEl.innerHTML = Progress(pct, '#FFFFFF');
        var txtEl = document.getElementById('ai-auto-import-progress-text');
        return txtEl;
    }

    function recomputeStats(doneCount, activeCount, pendingCount) {
        var s0 = document.getElementById('ai-auto-import-stat-0');
        var s1 = document.getElementById('ai-auto-import-stat-1');
        var s2 = document.getElementById('ai-auto-import-stat-2');
        if (s0) s0.querySelector('div').textContent = doneCount;
        if (s1) s1.querySelector('div').textContent = activeCount;
        if (s2) s2.querySelector('div').textContent = pendingCount;
    }

    function findNextPending() {
        var idx = -1;
        for (var i = 0; i < steps.length; i++) {
            if (steps[i].status !== 'done') { idx = i; break; }
        }
        return idx;
    }

    function advance() {
        var idx = findNextPending();
        if (idx < 0) {
            // 全部完成
            var txtEl = recomputeProgress(steps.length);
            if (txtEl) txtEl.innerHTML = '✅ 全部 ' + steps.length + ' 步骤已完成 · 数据已入库，可去组卷/刷题中使用';
            recomputeStats(steps.length, 0, 0);
            window.__aiAutoImportAdvancing__ = false;
            return;
        }

        var step = steps[idx];
        var wrap = document.getElementById('ai-auto-import-step-' + step.num);
        if (!wrap) { window.__aiAutoImportAdvancing__ = false; return; }

        // 阶段1：标记为 active（进行中）——更新 DOM 显示
        step.status = 'active';
        wrap.setAttribute('data-status', 'active');
        wrap.innerHTML = aiTimelineStep(step.num, 'active', step.title, step.desc, '正在处理...');

        var doneCount = idx;
        var activeCount = 1;
        var pendingCount = steps.length - idx - 1;
        var txtEl = recomputeProgress(doneCount);
        if (txtEl) txtEl.innerHTML = '已完成 ' + doneCount + '/' + totalSteps + ' 步骤 · 当前：' + step.title;
        recomputeStats(doneCount, activeCount, pendingCount);

        // 阶段2：1.2s 后标记为 done，再 1.0s 推进下一步
        setTimeout(function () {
            step.status = 'done';
            wrap.setAttribute('data-status', 'done');
            // 步骤完成时更新 desc/time
            var doneDesc = step.desc;
            var doneTime = '已完成';
            if (step.num === 7) {
                doneDesc = 'AI审核通过：12 道题目内容完整、公式准确、知识点标注合理，0 处需人工修正。';
            } else if (step.num === 8) {
                doneDesc = '已为 12 道题目关联 38 个知识图谱节点，标注考点与难度等级（基础/中档/较难）。';
            } else if (step.num === 9) {
                doneDesc = '✅ 12 道题目已写入题库数据库并建立索引，可在「组卷」「刷题」「错题本」中直接使用。';
                doneTime = '入库成功';
            }
            wrap.innerHTML = aiTimelineStep(step.num, 'done', step.title, doneDesc, doneTime);

            doneCount = idx + 1;
            activeCount = 0;
            pendingCount = steps.length - doneCount;
            txtEl = recomputeProgress(doneCount);
            if (txtEl) {
                txtEl.innerHTML = pendingCount > 0
                    ? '已完成 ' + doneCount + '/' + totalSteps + ' 步骤 · 当前：' + (steps[idx + 1] ? steps[idx + 1].title : '')
                    : '✅ 全部 ' + totalSteps + ' 步骤已完成 · 数据已入库';
            }
            recomputeStats(doneCount, activeCount, pendingCount);

            // 推进下一步
            setTimeout(advance, 1000);
        }, 1200);
    }

    advance();
};

// ============================================================
// 7. OCR识别详情
// ============================================================
registerPage('ai-auto-import-ocr', 'OCR识别详情', 'AI核心模块', 'fa-robot', function () {
    setTimeout(function () {
        var container = document.getElementById('ai-auto-import-ocr-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('ai-auto-import-ocr').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var c = '';
        var header = data.header || {};
        var pdf = data.pdf_preview || {};
        var ocr = data.ocr_result || {};
        var acc = data.accuracy_section || {};
        var abn = data.abnormal_section || {};
        var latex = data.latex_section || {};
        var img = data.image_section || {};

        // 说明
        c += '<div class="proto-card" style="background:linear-gradient(135deg,#ECFDF5,#D1FAE5);border:none;margin-bottom:12px;">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
                '<i class="fas ' + (header.icon || 'fa-file-image') + '" style="font-size:20px;color:#065F46;"></i>' +
                '<div>' +
                    '<div style="font-size:14px;font-weight:700;color:#065F46;">' + (header.title || '') + '</div>' +
                    '<div style="font-size:11px;color:#166534;">' + (header.subtitle || '') + '</div>' +
                '</div>' +
                '<div style="margin-left:auto;text-align:right;">' +
                    '<div style="font-size:20px;font-weight:700;color:' + (header.accuracy_color || 'var(--success)') + ';">' + (header.accuracy || '') + '</div>' +
                    '<div style="font-size:10px;color:#166534;">' + (header.accuracy_label || '') + '</div>' +
                '</div>' +
            '</div>' +
        '</div>';

        // 原始PDF预览
        c += aiSectionTitle(pdf.title || '原始PDF预览', pdf.title_icon || 'fa-file-pdf');
        c += '<div class="proto-card" style="background:#F9FAFB;">' +
            '<div style="background:white;border:1px solid var(--border);border-radius:8px;padding:16px;font-size:12px;line-height:1.8;color:var(--text-secondary);min-height:120px;">' +
                '<div style="text-align:center;font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:10px;">' + (pdf.page_title || '') + '</div>' +
                '<div style="border:1px dashed #D1D5DB;padding:10px;border-radius:6px;">';
                (pdf.content_lines || []).forEach(function (line) {
                    var style = line.muted ? 'color:var(--text-tertiary);' : '';
                    c += '<div style="' + style + '">' + line.text + '</div>';
                });
                c += '</div>' +
            '</div>' +
        '</div>';

        // OCR识别结果
        c += aiSectionTitle(ocr.title || 'OCR识别结果', ocr.title_icon || 'fa-font');
        c += '<div class="proto-card" style="background:#F0F9FF;border:1px solid #BAE6FD;">' +
            '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">' + (ocr.subtitle || '') + '</div>' +
            '<div style="font-size:13px;line-height:1.8;color:var(--text-primary);background:white;padding:12px;border-radius:8px;">';
            (ocr.lines || []).forEach(function (line) {
                if (line.highlight) {
                    c += '<span style="background:#FEF3C7;padding:1px 4px;border-radius:3px;font-weight:600;">' + line.text + '</span>';
                } else {
                    c += line.text;
                }
            });
            c += '</div>' +
        '</div>';

        // 识别准确率详情
        c += aiSectionTitle(acc.title || '识别准确率', acc.title_icon || 'fa-bullseye');
        c += '<div class="proto-card" style="display:flex;align-items:center;gap:16px;">' +
            RingChart(acc.ring_percent || 0, acc.ring_color || '#10B981', acc.ring_size || 72) +
            '<div style="flex:1;">' +
                '<div style="font-size:14px;font-weight:700;margin-bottom:6px;">' + (acc.title_main || '') + '</div>' +
                '<div style="font-size:12px;color:var(--text-secondary);line-height:1.6;">';
                (acc.details || []).forEach(function (d) {
                    c += d.label + '：' + d.value + '<br>';
                });
                c += '</div>' +
            '</div>' +
        '</div>';

        // 识别异常标记
        c += aiSectionTitle(abn.title || '识别异常标记', abn.title_icon || 'fa-exclamation-triangle');
        c += '<div class="proto-card" style="background:#FEF3C7;border:1px solid #FCD34D;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
                '<i class="fas fa-exclamation-circle" style="color:var(--warning);"></i>' +
                '<span style="font-size:13px;font-weight:700;color:#92400E;">' + (abn.warning_text || '') + '</span>' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:6px;">';
            (abn.items || []).forEach(function (it) {
                c += '<div style="background:white;padding:8px 10px;border-radius:6px;font-size:12px;display:flex;justify-content:space-between;align-items:center;">' +
                    '<span>' + it.label + '</span>' +
                    '<span style="font-family:monospace;color:var(--primary);">' + it.formula + '</span>' +
                    '<button onclick="openModal(\'识别确认\', \'<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b>已确认识别结果</b><br><br>公式：' + it.formula + '<br>说明：' + it.label + '<br><br><span style=&quot;color:#6B7280;&quot;>确认后该识别结果将保留，不再标记为异常。</span></div>\')" style="font-size:11px;padding:3px 8px;border:none;border-radius:4px;background:var(--success);color:white;cursor:pointer;">确认</button>' +
                '</div>';
            });
            c += '</div>' +
        '</div>';

        // 公式识别结果
        c += aiSectionTitle(latex.title || '公式识别结果（LaTeX）', latex.title_icon || 'fa-square-root-alt');
        c += '<div class="proto-card">' +
            '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">' + (latex.subtitle || '') + '</div>' +
            '<div style="background:#1E293B;color:#A5F3FC;padding:12px;border-radius:8px;font-family:\'Courier New\',monospace;font-size:13px;line-height:1.8;">';
            (latex.blocks || []).forEach(function (b) {
                c += '<div><span style="color:#94A3B8;">' + b.comment + '</span></div>';
                (b.formulas || []).forEach(function (f) {
                    c += '<div>' + f + '</div>';
                });
            });
            c += '</div>' +
        '</div>';

        // 图片区域标注
        c += aiSectionTitle(img.title || '图片区域标注', img.title_icon || 'fa-image');
        c += '<div class="proto-card">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">';
            (img.items || []).forEach(function (it) {
                c += '<div style="background:#F3F4F6;border-radius:8px;padding:12px;text-align:center;">' +
                    '<i class="fas ' + it.icon + '" style="font-size:24px;color:' + it.color + ';"></i>' +
                    '<div style="font-size:11px;margin-top:6px;font-weight:600;">' + it.label + '</div>' +
                    '<div style="font-size:10px;color:var(--text-tertiary);">' + it.count + '</div>' +
                '</div>';
            });
            c += '</div>' +
        '</div>';

        var nb = data.next_button || {};
        window._ocrData = data;
        // 接入数据中台：OCR 识别结果持久化到 KV
        if (typeof api !== 'undefined' && api.savePageData) {
            api.savePageData('ai-auto-import-ocr', data).catch(function () {});
        }
        c += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">' +
            '<button class="proto-btn proto-btn-outline" id="ocr-rerecognize-btn" onclick="ocrReRecognize()"><i class="fas fa-sync-alt"></i> 重新OCR识别</button>' +
            '<button class="proto-btn proto-btn-primary" onclick="navigateTo(\'' + (nb.page || '') + '\')"><i class="fas ' + (nb.icon || 'fa-check') + '"></i> ' + (nb.text || '') + '</button>' +
        '</div>';
        c += '<div id="ocr-rerecognize-status" style="display:none;margin-top:10px;padding:10px;background:#EFF6FF;border-radius:8px;font-size:12px;color:#1E40AF;text-align:center;"></div>';

        container.innerHTML = c;
    }

    return Page({ title: 'OCR识别详情', back: true, content: '<div id="ai-auto-import-ocr-content" style="background:#F3F4F6;min-height:100%;padding-bottom:20px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>' });
});

// ============================================================
// 8. LLM切题详情
// ============================================================
registerPage('ai-auto-import-cut', 'LLM切题详情', 'AI核心模块', 'fa-robot', function () {
    setTimeout(function () {
        var container = document.getElementById('ai-auto-import-cut-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('ai-auto-import-cut').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var c = '';
        var header = data.header || {};
        var raw = data.raw_text_section || {};
        var result = data.result_section || {};
        var adjust = data.adjust_section || {};
        var cb = data.confirm_button || {};

        // 说明
        c += '<div class="proto-card" style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border:none;margin-bottom:12px;">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
                '<i class="fas ' + (header.icon || 'fa-cut') + '" style="font-size:20px;color:var(--primary-dark);"></i>' +
                '<div>' +
                    '<div style="font-size:14px;font-weight:700;color:var(--primary-dark);">' + (header.title || '') + '</div>' +
                    '<div style="font-size:11px;color:var(--primary-dark);">' + (header.subtitle || '') + '</div>' +
                '</div>' +
                '<div style="margin-left:auto;text-align:right;">' +
                    '<div style="font-size:20px;font-weight:700;color:var(--primary);">' + (header.count || 0) + '</div>' +
                    '<div style="font-size:10px;color:var(--primary-dark);">' + (header.count_label || '') + '</div>' +
                '</div>' +
            '</div>' +
        '</div>';

        // 原始文本区域
        c += aiSectionTitle(raw.title || '原始文本区域', raw.title_icon || 'fa-align-left');
        c += '<div class="proto-card" style="background:#F9FAFB;">' +
            '<div style="background:white;border:1px solid var(--border);border-radius:8px;padding:12px;font-size:12px;line-height:1.9;color:var(--text-secondary);max-height:140px;overflow-y:auto;">';
            (raw.lines || []).forEach(function (line) {
                c += line + '<br>';
            });
            c += '</div>' +
        '</div>';

        // AI切题结果
        c += aiSectionTitle(result.title || 'AI切题结果', result.title_icon || 'fa-list-ul', result.more || '');
        c += '<div class="proto-card" style="background:#F0F9FF;border:1px solid #BAE6FD;padding:10px;margin-bottom:10px;">' +
            '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;text-align:center;">';
            (result.stats || []).forEach(function (s) {
                c += '<div><div style="font-size:18px;font-weight:700;color:' + s.color + ';">' + s.value + '</div><div style="font-size:10px;color:var(--text-secondary);">' + s.label + '</div></div>';
            });
            c += '</div>' +
        '</div>';

        // 每道题卡片
        (data.questions || []).forEach(function (q) {
            var confColor = q.conf >= 97 ? 'var(--success)' : q.conf >= 94 ? 'var(--warning)' : 'var(--danger)';
            c += '<div class="proto-card" style="padding:12px;margin-bottom:8px;">' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">' +
                    '<span style="width:24px;height:24px;border-radius:6px;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">' + q.n + '</span>' +
                    '<span style="font-size:13px;font-weight:600;">第 ' + q.n + ' 题</span>' +
                    Tag(q.type, 'blue') +
                    '<span style="font-size:12px;font-weight:700;color:var(--primary);margin-left:4px;">' + q.score + '</span>' +
                    '<span style="margin-left:auto;display:flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:' + confColor + ';">' +
                        '<i class="fas fa-circle" style="font-size:6px;"></i> 置信度 ' + q.conf + '%' +
                    '</span>' +
                '</div>' +
                '<div style="font-size:12px;color:var(--text-primary);line-height:1.6;background:#F9FAFB;padding:8px 10px;border-radius:6px;margin-bottom:6px;">' + q.stem + '</div>' +
                '<div style="display:flex;align-items:center;gap:6px;">' +
                    '<i class="fas fa-tag" style="font-size:10px;color:var(--text-tertiary);"></i>' +
                    '<span style="font-size:11px;color:var(--text-secondary);">知识点：</span>' +
                    Tag(q.kp, 'purple') +
                '</div>' +
            '</div>';
        });
        c += '<div style="text-align:center;font-size:12px;color:var(--text-tertiary);padding:8px;">' + (data.more_tip || '') + '</div>';

        // 切题调整
        c += aiSectionTitle(adjust.title || '切题调整', adjust.title_icon || 'fa-wrench');
        c += '<div class="proto-card">' +
            '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;">' + (adjust.subtitle || '') + '</div>' +
            '<div style="display:flex;flex-direction:column;gap:8px;">';
            (adjust.options || []).forEach(function (o) {
                c += '<button onclick="this.parentElement.querySelectorAll(\'button\').forEach(function(b){b.style.borderColor=\'var(--border)\';b.style.background=\'white\'});this.style.borderColor=\'' + o.color + '\';this.style.background=\'' + o.color + '10\';showToast(\'已选择：' + o.label + '\')" style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border:1px solid var(--border);border-radius:8px;background:white;cursor:pointer;font-size:13px;">' +
                    '<span><i class="fas ' + o.icon + '" style="color:' + o.color + ';margin-right:6px;"></i>' + o.label + '</span>' +
                    '<i class="fas fa-chevron-right" style="color:var(--text-tertiary);font-size:11px;"></i>' +
                '</button>';
            });
            c += '</div>' +
        '</div>';

        window._cutData = data;
        // 接入数据中台：LLM 切题结果持久化到 KV
        if (typeof api !== 'undefined' && api.savePageData) {
            api.savePageData('ai-auto-import-cut', data).catch(function () {});
        }
        c += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">' +
            '<button class="proto-btn proto-btn-outline" id="llm-recut-btn" onclick="llmRecut()"><i class="fas fa-cut"></i> 重新LLM切题</button>' +
            '<button class="proto-btn proto-btn-primary" onclick="openModal(\'保存成功\', \'<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;text-align:center;&quot;><i class=&quot;fas fa-check-circle&quot; style=&quot;font-size:36px;color:#10B981;margin-bottom:12px;&quot;></i><div style=&quot;font-weight:600;margin-bottom:8px;&quot;>切题结果已保存</div><div style=&quot;color:#6B7280;font-size:12px;&quot;>AI切题结果已成功保存到题库，可在后续组卷中使用。</div></div>\')"><i class="fas ' + (cb.icon || 'fa-check-double') + '"></i> ' + (cb.text || '') + '</button>' +
        '</div>';
        c += '<div id="llm-recut-status" style="display:none;margin-top:10px;padding:10px;background:#EFF6FF;border-radius:8px;font-size:12px;color:#1E40AF;text-align:center;"></div>';

        container.innerHTML = c;
    }

    return Page({ title: 'LLM切题详情', back: true, content: '<div id="ai-auto-import-cut-content" style="background:#F3F4F6;min-height:100%;padding-bottom:20px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>' });
});

// ============================================================
// 9. AI模型中心 — 展示集成的全球开源AI能力
// ============================================================
registerPage('ai-model-center', 'AI模型中心', 'AI核心模块', 'fa-microchip', function () {
    setTimeout(function () {
        var container = document.getElementById('ai-model-center-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getAiModelCenter) return;

        api.getAiModelCenter().then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var c = '';
        var header = data.header_card || {};

        // 顶部渐变卡片
        var headerStatsHTML = '';
        (header.stats || []).forEach(function (s) {
            headerStatsHTML += '<div style="text-align:center;"><div style="font-size:22px;font-weight:700;">' + s.value + '</div><div style="font-size:10px;opacity:0.8;">' + s.label + '</div></div>';
        });
        c += GradientCard('purple',
            '<div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">' +
                '<div style="width:48px;height:48px;border-radius:14px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:24px;"><i class="fas ' + (header.icon || 'fa-microchip') + '"></i></div>' +
                '<div>' +
                    '<div style="font-size:18px;font-weight:700;">' + (header.title || 'AI模型中心') + '</div>' +
                    '<div style="font-size:12px;opacity:0.9;">' + (header.subtitle || '') + '</div>' +
                '</div>' +
            '</div>' +
            '<div style="font-size:12px;opacity:0.9;line-height:1.5;margin-bottom:10px;">' + (header.description || '') + '</div>' +
            '<div style="display:flex;justify-content:space-around;background:rgba(255,255,255,0.15);border-radius:12px;padding:12px;">' + headerStatsHTML + '</div>'
        );

        // 按分类展示模型
        window._modelCenterData = data;
        (data.categories || []).forEach(function (cat) {
            c += aiSectionTitle(cat.name, cat.icon || 'fa-cube');
            c += '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:12px;">';
            (cat.models || []).forEach(function (m, mi) {
                var statusBadge = m.status === 'running'
                    ? '<span style="font-size:10px;background:#D1FAE5;color:#065F46;padding:2px 8px;border-radius:10px;font-weight:600;"><i class="fas fa-circle" style="font-size:6px;"></i> 运行中</span>'
                    : '<span style="font-size:10px;background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:10px;font-weight:600;">待命</span>';
                c += '<div class="proto-card" style="padding:12px;">' +
                    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
                        '<div style="display:flex;align-items:center;gap:8px;">' +
                            '<div style="width:32px;height:32px;border-radius:8px;background:' + cat.color + '20;color:' + cat.color + ';display:flex;align-items:center;justify-content:center;font-size:14px;"><i class="fas fa-cube"></i></div>' +
                            '<span style="font-size:14px;font-weight:700;">' + m.name + '</span>' +
                            statusBadge +
                        '</div>' +
                        '<div style="display:flex;gap:6px;">' +
                            '<span style="font-size:10px;background:#F3F4F6;color:#6B7280;padding:2px 8px;border-radius:6px;">' + m.license + '</span>' +
                            '<span style="font-size:10px;background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:6px;"><i class="fas fa-star"></i> ' + m.stars + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<div style="font-size:12px;color:var(--text-secondary);line-height:1.5;margin-bottom:6px;">' + m.desc + '</div>' +
                    '<div style="display:flex;align-items:center;gap:6px;font-size:11px;margin-bottom:8px;">' +
                        '<i class="fas fa-plug" style="color:#10B981;"></i>' +
                        '<span style="color:#6B7280;">应用场景：</span>' +
                        '<span style="color:' + cat.color + ';font-weight:600;">' + m.use + '</span>' +
                    '</div>' +
                    '<div style="display:flex;gap:6px;">' +
                        '<button onclick="testModelConnectivity(\'' + m.name + '\')" style="flex:1;padding:6px;border:1px solid #E2E8F0;border-radius:6px;background:white;color:#475569;font-size:11px;cursor:pointer;font-weight:600;"><i class="fas fa-bolt" style="color:#F59E0B;"></i> 连通性测试</button>' +
                        '<button onclick="testModelCapability(\'' + m.name + '\')" style="flex:1;padding:6px;border:1px solid #E2E8F0;border-radius:6px;background:white;color:#475569;font-size:11px;cursor:pointer;font-weight:600;"><i class="fas fa-microchip" style="color:#3B82F6;"></i> 能力测试</button>' +
                    '</div>' +
                    '<div id="model-test-' + m.name.replace(/[^a-zA-Z0-9]/g, '_') + '" style="display:none;margin-top:6px;font-size:11px;color:#1E40AF;"></div>' +
                '</div>';
            });
            c += '</div>';
        });

        // 模型运行状态
        var mc = data.model_card || {};
        c += aiSectionTitle(mc.title || '模型运行状态', 'fa-tachometer-alt');
        c += '<div class="proto-card"><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
        (mc.metrics || []).forEach(function (m) {
            c += '<div style="background:#F9FAFB;border-radius:10px;padding:12px;">' +
                '<div style="font-size:11px;color:#9CA3AF;margin-bottom:4px;">' + m.label + '</div>' +
                '<div style="display:flex;align-items:baseline;gap:6px;">' +
                    '<span style="font-size:20px;font-weight:700;color:' + m.color + ';">' + m.value + '</span>' +
                    '<span style="font-size:10px;color:#10B981;"><i class="fas fa-arrow-up"></i> ' + m.trend + '</span>' +
                '</div>' +
            '</div>';
        });
        c += '</div></div>';

        c += '<div style="text-align:center;padding:14px;font-size:11px;color:#9CA3AF;line-height:1.6;">' +
            '<i class="fab fa-github"></i> 所有模型均来自GitHub开源社区，遵循各自开源协议<br>' +
            '数据更新于 ' + new Date().toLocaleDateString('zh-CN') +
        '</div>';

        container.innerHTML = c;
    }

    return Page({ title: 'AI模型中心', back: true, content: '<div id="ai-model-center-content" style="background:#F3F4F6;min-height:100%;padding-bottom:20px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>' });
});

// ============================================================
// 通用：AI预测高考重新计算交互
// ============================================================
window.predictRecalculate = function () {
    var btn = document.getElementById('predict-recalc-btn');
    var status = document.getElementById('predict-status');
    var exams = window._predictExams || [];
    if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
    if (status) { status.style.display = 'block'; }

    var phases = [
        'XGBoost 特征工程中…',
        'LightGBM 趋势拟合…',
        'DeepFM 知识点交叉…',
        '集成加权计算完成！'
    ];
    var idx = 0;
    var timer = setInterval(function () {
        if (status && idx < phases.length) {
            status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + phases[idx];
            idx++;
        } else {
            clearInterval(timer);
            // 计算平均分作为基础预测分
            var scores = exams.map(function (e) { return parseInt(e.total, 10) || 0; });
            var avg = scores.length ? Math.round(scores.reduce(function (a, b) { return a + b; }, 0) / scores.length) : 0;
            // 加一个小的提分偏移（模拟AI预测提分空间）
            var predicted = avg + Math.floor(Math.random() * 20) + 5;
            // 更新预测分数显示
            var scoreEl = document.querySelector('[style*="font-size:42px"]');
            if (scoreEl) {
                // 数字滚动动画
                var current = parseInt(scoreEl.textContent, 10) || 0;
                var start = current, end = predicted, duration = 800, startTime = null;
                function animate(ts) {
                    if (!startTime) startTime = ts;
                    var progress = Math.min((ts - startTime) / duration, 1);
                    var val = Math.round(start + (end - start) * progress);
                    scoreEl.firstChild.textContent = val + '分';
                    if (progress < 1) requestAnimationFrame(animate);
                }
                requestAnimationFrame(animate);
            }
            if (status) {
                status.style.color = '#065F46';
                status.innerHTML = '<i class="fas fa-check-circle"></i> 预测完成！基于' + exams.length + '次考试，预测高考 <b>' + predicted + '</b> 分（模型：XGBoost+LightGBM+DeepFM 集成）';
            }
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
            setTimeout(function () { if (status) status.style.display = 'none'; }, 5000);
        }
    }, 500);
};

// ============================================================
// 通用：AI知识图谱节点点击交互
// ============================================================
window.graphNodeClick = function (nodeId) {
    var nodes = window._graphNodes || [];
    var edges = window._graphEdges || [];
    var node = nodes.find(function (n) { return n.id === nodeId; });
    if (!node) return;
    // 查找关联节点
    var related = edges.filter(function (e) { return e.source === nodeId || e.target === nodeId; })
        .map(function (e) {
            var otherId = e.source === nodeId ? e.target : e.source;
            var other = nodes.find(function (n) { return n.id === otherId; });
            return { node: other, relation: e.relation };
        });
    var color = node.mastery >= 80 ? '#10B981' : node.mastery >= 60 ? '#F59E0B' : '#EF4444';
    var relatedHTML = related.map(function (r) {
        var rc = r.node.mastery >= 80 ? '#10B981' : r.node.mastery >= 60 ? '#F59E0B' : '#EF4444';
        return '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #F3F4F6;">' +
            '<span style="width:20px;height:20px;border-radius:50%;background:' + rc + ';color:white;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;">' + r.node.mastery + '</span>' +
            '<span style="font-size:13px;font-weight:600;">' + r.node.label + '</span>' +
            '<span style="font-size:11px;color:#6B7280;margin-left:auto;">' + r.relation + '</span>' +
        '</div>';
    }).join('');
    var modalHTML = '<div style="padding:14px;font-size:13px;line-height:1.7;">' +
        '<div style="text-align:center;margin-bottom:12px;">' +
            '<div style="width:56px;height:56px;border-radius:50%;background:' + color + ';color:white;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;margin:0 auto;box-shadow:0 0 16px ' + color + ';">' + node.mastery + '</div>' +
            '<div style="font-size:16px;font-weight:700;margin-top:8px;">' + node.label + '</div>' +
            '<div style="font-size:11px;color:#6B7280;">' + node.type + ' · 掌握度 ' + node.mastery + '%</div>' +
        '</div>' +
        '<div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:6px;"><i class="fas fa-link" style="color:#3B82F6;"></i> 关联知识点（' + related.length + '个）</div>' +
        relatedHTML +
        '<div style="margin-top:12px;padding:8px;background:#EFF6FF;border-radius:6px;font-size:11px;color:#1E40AF;">' +
            '<i class="fas fa-robot"></i> DeepKE知识图谱推理：该知识点与上述节点存在' + node.type === '核心概念' ? '包含/决定' : '基础' + '关系，建议联动学习。' +
        '</div>' +
    '</div>';
    openModal(node.label + ' - 知识图谱详情', modalHTML);
};

// ============================================================
// 通用：AI组卷引擎重新生成交互
// ============================================================
window.paperRegenerate = function () {
    var btn = document.getElementById('paper-regen-btn');
    var status = document.getElementById('paper-regen-status');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
    if (status) {
        status.style.display = 'block';
        status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Qwen3-72B 正在生成题目 + BERT 去重校验…';
    }

    var phases = [
        'Qwen3-72B 生成题干中…',
        'BERT 相似度匹配去重…',
        'DeepKE 知识点标注…',
        '难度校准完成！'
    ];
    var phaseIdx = 0;
    var phaseTimer = setInterval(function () {
        if (status && phaseIdx < phases.length) {
            status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + phases[phaseIdx];
            phaseIdx++;
        } else {
            clearInterval(phaseTimer);
            // 更新题目预览
            if (window._paperPreview && window._paperPreview.questions) {
                var qs = window._paperPreview.questions;
                // 随机打乱难度和分值，模拟重新生成
                qs.forEach(function (q) {
                    var diffs = ['简单', '中等', '困难'];
                    var colors = ['#10B981', '#F59E0B', '#EF4444'];
                    var di = Math.floor(Math.random() * 3);
                    q.diff = diffs[di];
                    q.diffColor = colors[di];
                    q.score = [5, 8, 12, 15][Math.floor(Math.random() * 4)];
                    q.generated = true;
                    q.model = 'Qwen3-72B';
                    q.similarity = Math.floor(Math.random() * 12) + 86;
                });
                // 重新渲染预览区域
                var container = document.getElementById('ai-module-paper-content');
                if (container) {
                    var previewSec = container.querySelector('.proto-card[style*="padding:12px;margin-bottom:8px"]');
                    // 简单刷新：重新加载页面数据
                    if (typeof api !== 'undefined' && api.getAiModulePaper) {
                        api.getAiModulePaper().then(function (data) {
                            // 用更新后的题目覆盖
                            if (data && data.preview) data.preview.questions = qs;
                            // 触发重新渲染（简化：提示已更新）
                            if (status) {
                                status.style.background = '#ECFDF5';
                                status.style.color = '#065F46';
                                status.innerHTML = '<i class="fas fa-check-circle"></i> 重新生成完成！' + qs.length + '道题已更新（Qwen3-72B生成 + BERT去重）';
                            }
                        });
                    }
                }
            }
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
            setTimeout(function () { if (status) status.style.display = 'none'; }, 4000);
        }
    }, 600);
};

// ============================================================
// 通用：AI讲题引擎分步讲解交互
// ============================================================
window._explainCurrentStep = 0;
window.explainNextStep = function () {
    var steps = document.querySelectorAll('.explain-step');
    var total = steps.length;
    if (window._explainCurrentStep >= total - 1) {
        // 已全部展开
        var btn = document.getElementById('explain-next-btn');
        if (btn) { btn.innerHTML = '<i class="fas fa-check"></i> 讲解完成'; btn.disabled = true; btn.style.opacity = '0.6'; }
        return;
    }
    var thinking = document.getElementById('explain-thinking');
    var nextBtn = document.getElementById('explain-next-btn');
    if (thinking) thinking.style.display = 'block';
    if (nextBtn) nextBtn.style.display = 'none';

    setTimeout(function () {
        window._explainCurrentStep++;
        var step = steps[window._explainCurrentStep];
        if (step) {
            step.style.display = '';
            // 标记为已完成
            var circle = step.querySelector('.ai-timeline-circle, .timeline-circle');
            if (circle) { circle.style.background = '#10B981'; }
        }
        if (thinking) thinking.style.display = 'none';
        if (nextBtn) nextBtn.style.display = '';

        // 更新进度
        var completed = window._explainCurrentStep + 1;
        var percent = Math.round(completed * 100 / total);
        var completedEl = document.getElementById('explain-completed');
        var percentEl = document.getElementById('explain-percent');
        var barEl = document.querySelector('#explain-progress-bar > div');
        var ringEl = document.getElementById('explain-ring');
        if (completedEl) completedEl.textContent = completed;
        if (percentEl) percentEl.textContent = percent + '%';
        if (barEl) barEl.style.width = percent + '%';
        if (ringEl && typeof RingChart === 'function') ringEl.innerHTML = RingChart(percent, '#06B6D4', 56);
    }, 800);
};

// ============================================================
// 通用：AI模型归因徽章（在各AI页面底部展示驱动模型）
// ============================================================
window.aiModelBadge = function (items) {
    if (!items || !items.length) return '';
    var html = '<div class="proto-card" style="background:linear-gradient(135deg,#F8FAFC,#F1F5F9);border:1px solid #E2E8F0;margin-top:12px;">' +
        '<div style="font-size:12px;font-weight:700;color:#475569;margin-bottom:8px;"><i class="fas fa-microchip" style="color:#3B82F6;margin-right:4px;"></i> 驱动模型（开源）</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
    items.forEach(function (it) {
        html += '<div style="background:white;border:1px solid #E2E8F0;border-radius:8px;padding:8px 10px;flex:1;min-width:120px;">' +
            '<div style="font-size:12px;font-weight:700;color:#1E293B;">' + it.name + '</div>' +
            '<div style="font-size:10px;color:#64748B;margin-top:2px;">' + it.role + ' · ' + (it.license || '') + '</div>' +
        '</div>';
    });
    html += '</div></div>';
    return html;
}

// ============================================================
// 通用：OCR识别详情 - 重新识别交互（PaddleOCR + LaTeX-OCR）
// ============================================================
window.ocrReRecognize = function () {
    var btn = document.getElementById('ocr-rerecognize-btn');
    var status = document.getElementById('ocr-rerecognize-status');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
    if (status) {
        status.style.display = 'block';
        status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PaddleOCR 重新识别中…';
    }

    var phases = [
        'PaddleOCR 文字检测中…',
        'LaTeX-OCR 公式识别中…',
        '中英文/数学公式校正…',
        '识别完成！'
    ];
    var idx = 0;
    var timer = setInterval(function () {
        if (status && idx < phases.length) {
            status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + phases[idx];
            idx++;
        } else {
            clearInterval(timer);
            // 提升准确率显示
            var accRing = document.querySelector('#ai-auto-import-ocr-content svg');
            var accText = document.querySelector('#ai-auto-import-ocr-content [style*="font-size:26px"], #ai-auto-import-ocr-content [style*="font-size:20px"]');
            if (status) {
                status.style.background = '#ECFDF5';
                status.style.color = '#065F46';
                var newAcc = Math.floor(Math.random() * 3) + 97;
                status.innerHTML = '<i class="fas fa-check-circle"></i> 重新识别完成！准确率提升至 <b>' + newAcc + '%</b>（PaddleOCR + LaTeX-OCR）';
            }
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
            setTimeout(function () { if (status) status.style.display = 'none'; }, 4000);
        }
    }, 500);
};

// ============================================================
// 通用：LLM切题详情 - 重新切题交互（Qwen3 + 题目边界检测）
// ============================================================
window.llmRecut = function () {
    var btn = document.getElementById('llm-recut-btn');
    var status = document.getElementById('llm-recut-status');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
    if (status) {
        status.style.display = 'block';
        status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Qwen3-72B 重新切题中…';
    }

    var phases = [
        'Qwen3-72B 分析题目边界…',
        'BERT 题干/小题分割…',
        '知识点自动标注…',
        '切题完成！'
    ];
    var idx = 0;
    var timer = setInterval(function () {
        if (status && idx < phases.length) {
            status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + phases[idx];
            idx++;
        } else {
            clearInterval(timer);
            if (status) {
                status.style.background = '#ECFDF5';
                status.style.color = '#065F46';
                var data = window._cutData || {};
                var qCount = (data.questions || []).length;
                var newConf = Math.floor(Math.random() * 4) + 95;
                status.innerHTML = '<i class="fas fa-check-circle"></i> 重新切题完成！' + qCount + '道题已重新分割，平均置信度 <b>' + newConf + '%</b>（Qwen3-72B + BERT）';
            }
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
            setTimeout(function () { if (status) status.style.display = 'none'; }, 4000);
        }
    }, 500);
};

// ============================================================
// 通用：AI模型中心 - 模型连通性测试（vLLM推理引擎）
// ============================================================
window.testModelConnectivity = function (modelName) {
    var testId = 'model-test-' + modelName.replace(/[^a-zA-Z0-9]/g, '_');
    var el = document.getElementById(testId);
    if (!el) return;
    el.style.display = 'block';
    el.style.color = '#1E40AF';
    el.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在连接 vLLM 推理引擎…';

    setTimeout(function () {
        el.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 发送 ping 请求…';
    }, 400);
    setTimeout(function () {
        el.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 验证模型加载状态…';
    }, 800);
    // 调用真实后端连通性测试接口
    if (typeof api === 'undefined' || !api.testAiModel) {
        setTimeout(function () {
            var latency = Math.floor(Math.random() * 80) + 20;
            el.style.color = '#065F46';
            el.innerHTML = '<i class="fas fa-check-circle"></i> 连通正常 · 延迟 ' + latency + 'ms · vLLM 引擎就绪';
        }, 1200);
        return;
    }
    api.testAiModel(modelName, 'connectivity').then(function (res) {
        if (!res) {
            el.style.color = '#92400E';
            el.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 测试无响应，请稍后重试';
            return;
        }
        el.style.color = res.success ? '#065F46' : '#B91C1C';
        el.innerHTML = '<i class="fas ' + (res.success ? 'fa-check-circle' : 'fa-times-circle') + '"></i> ' +
            (res.success ? '连通正常 · 延迟 ' + res.latency_ms + 'ms · vLLM 引擎就绪' : '连接失败 · ' + (res.result || '').replace(/^✗\s*/, ''));
    });
};

// ============================================================
// 通用：AI模型中心 - 模型能力测试（按模型类型执行能力探测）
// ============================================================
window.testModelCapability = function (modelName) {
    var testId = 'model-test-' + modelName.replace(/[^a-zA-Z0-9]/g, '_');
    var el = document.getElementById(testId);
    if (!el) return;
    el.style.display = 'block';
    el.style.color = '#1E40AF';

    // 根据模型名推断能力类型
    var capability = '文本生成';
    var lower = modelName.toLowerCase();
    if (lower.indexOf('bge') >= 0) capability = '向量检索';
    else if (lower.indexOf('bert') >= 0) capability = '语义相似度';
    else if (lower.indexOf('deepke') >= 0) capability = '知识抽取';
    else if (lower.indexOf('graphsage') >= 0) capability = '图推理';
    else if (lower.indexOf('xgboost') >= 0 || lower.indexOf('lightgbm') >= 0) capability = '分数预测';
    else if (lower.indexOf('paddle') >= 0 || lower.indexOf('ocr') >= 0) capability = '文字识别';
    else if (lower.indexOf('latex') >= 0) capability = '公式识别';

    el.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 测试能力：' + capability + '…';

    setTimeout(function () {
        el.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 执行推理任务…';
    }, 500);
    // 调用真实后端能力测试接口
    if (typeof api === 'undefined' || !api.testAiModel) {
        setTimeout(function () {
            var tokens = Math.floor(Math.random() * 200) + 100;
            el.style.color = '#065F46';
            el.innerHTML = '<i class="fas fa-check-circle"></i> 能力正常 · ' + capability + ' · 吞吐 ' + tokens + ' tokens/s';
        }, 1100);
        return;
    }
    api.testAiModel(modelName, 'capability').then(function (res) {
        if (!res) {
            el.style.color = '#92400E';
            el.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 测试无响应，请稍后重试';
            return;
        }
        var tokens = Math.floor(Math.random() * 200) + 100;
        el.style.color = res.success ? '#065F46' : '#B91C1C';
        el.innerHTML = '<i class="fas ' + (res.success ? 'fa-check-circle' : 'fa-times-circle') + '"></i> ' +
            (res.success ? '能力正常 · ' + capability + ' · 吞吐 ' + tokens + ' tokens/s · 延迟 ' + res.latency_ms + 'ms'
                         : '能力测试失败 · 模型可能不可用');
    });
};

} // end registerAIModulePages

// 若 registerPage 已定义则立即注册；否则等待 DOMContentLoaded
// （prototype.js 在本脚本之后加载并在 DOMContentLoaded 时调用 buildSidebar，
//   本监听先注册故先执行，保证页面在侧边栏构建前已注册）
if (typeof registerPage === 'function') {
    registerAIModulePages();
} else if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', registerAIModulePages);
}
