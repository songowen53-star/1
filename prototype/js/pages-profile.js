// ============================================================
// 个人中心模块 - pages-profile.js（动态加载：数据来自 /api/page-data/:key）
// ============================================================

// ============================================================
// 1. 我的 - 个人中心主页
// ============================================================
registerPage('profile-main', '我的', '个人中心', 'fa-user', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('profile-main-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('profile-main').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div><button class="proto-btn proto-btn-primary" style="margin-top:16px;height:38px;border-radius:19px;padding:0 24px;font-size:13px;" onclick="navigateTo(\'home\')"><i class="fas fa-home"></i> 返回首页</button></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var u = data.user || {};
        // 动态计算高考倒计时（与首页 getNextGaokao 逻辑保持一致）
        var _now = new Date();
        var _gy = _now.getFullYear();
        var _gd = new Date(_gy, 5, 7);
        if (_now > new Date(_gy, 5, 9, 23, 59, 59)) {
            _gy = _gy + 1;
            _gd = new Date(_gy, 5, 7);
        }
        var _days = Math.max(0, Math.ceil((_gd - _now) / (1000 * 60 * 60 * 24)));
        u.days_to_gaokao = _days;
        // 统一头像：与首页一致使用 svgAvatar 内联 SVG（避免外链跨域与样式不一致）
        u.avatar = (typeof window.svgAvatar === 'function')
            ? window.svgAvatar(u.name ? u.name.charAt(0) : '李', '#3B82F6', 64)
            : u.avatar;
        var html = '';

        // 用户信息卡片（蓝色渐变）
        html += GradientCard('blue', `
            <div style="display:flex;align-items:center;gap:14px;cursor:pointer;" onclick="openModal('编辑资料', '<div style=&quot;padding:16px;line-height:1.8;font-size:14px;&quot;><b>昵称：</b>${u.name}<br><b>年级：</b>${u.grade}<br><b>省份：</b>${u.province}<br><b>目标分数：</b>${u.target_score}<br><b>当前估分：</b>${u.current_score}<br><b>距高考：</b>${u.days_to_gaokao} 天</div>')">
                <img src="${u.avatar}" style="width:64px;height:64px;border-radius:50%;border:2.5px solid rgba(255,255,255,0.6);">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:18px;font-weight:700;">${u.name}</span>
                        ${u.is_vip ? '<span style="background:linear-gradient(135deg,#FCD34D,#F59E0B);color:#7C2D12;font-size:11px;font-weight:700;padding:2px 8px;border-radius:10px;"><i class="fas fa-crown"></i> VIP</span>' : ''}
                    </div>
                    <div style="font-size:12px;opacity:0.9;margin-top:4px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                        <span><i class="fas fa-graduation-cap"></i> ${u.grade}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${u.province}</span>
                        <span><i class="fas fa-calendar-day"></i> 距高考 ${u.days_to_gaokao} 天</span>
                    </div>
                </div>
                <i class="fas fa-chevron-right" style="opacity:0.7;"></i>
            </div>
            <div style="display:flex;gap:8px;margin-top:14px;">
                <div style="flex:1;background:rgba(255,255,255,0.18);border-radius:10px;padding:8px;text-align:center;">
                    <div style="font-size:11px;opacity:0.85;">目标分数</div>
                    <div style="font-size:18px;font-weight:700;color:#FCD34D;">${u.target_score}</div>
                </div>
                <div style="flex:1;background:rgba(255,255,255,0.18);border-radius:10px;padding:8px;text-align:center;">
                    <div style="font-size:11px;opacity:0.85;">当前估分</div>
                    <div style="font-size:18px;font-weight:700;">${u.current_score}</div>
                </div>
            </div>
        `);

        // 学习数据概览
        var statsHtml = (data.stats || []).map(function (s) {
            return StatCard(s.label, s.value, s.change, s.color);
        }).join('');
        html += `
            <div style="background:white;border-radius:14px;padding:14px;margin:12px 0;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                    <div style="font-size:15px;font-weight:700;"><i class="fas fa-chart-line" style="color:#3B82F6;margin-right:6px;"></i>学习数据概览</div>
                    <span style="font-size:12px;color:#3B82F6;cursor:pointer;" onclick="navigateTo('profile-report')">本月 ›</span>
                </div>
                <div class="proto-grid-3">
                    ${statsHtml}
                </div>
            </div>`;

        // 功能列表
        var menuHtml = (data.menu_items || []).map(function (m) {
            return ListItem(m.icon, m.bg, m.title, m.desc, m.page);
        }).join('');
        html += `
            <div style="background:white;border-radius:14px;margin:0 0 12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                ${menuHtml}
            </div>`;

        // 个人中心子模块快捷入口（4个入口）
        var subEntries = [
            { icon: 'fa-crown',        bg: '#FEF3C7', color: '#F59E0B', label: 'VIP会员',   page: 'profile-vip',     desc: '专属权益' },
            { icon: 'fa-file-alt',     bg: '#DBEAFE', color: '#3B82F6', label: '学习报告',   page: 'profile-report',   desc: '本月学情' },
            { icon: 'fa-user-friends', bg: '#D1FAE5', color: '#10B981', label: '家长中心',   page: 'profile-parent',  desc: '家长查看' },
            { icon: 'fa-cog',           bg: '#F3F4F6', color: '#6B7280', label: '设置',       page: 'profile-settings',desc: '账户管理' },
            { icon: 'fa-medal',         bg: '#FEE2E2', color: '#EF4444', label: '勋章墙',     page: 'profile-badges',  desc: '我的成就' },
            { icon: 'fa-chart-line',    bg: '#EDE9FE', color: '#8B5CF6', label: '学情分析',   page: 'home-analysis',   desc: '能力诊断' },
            { icon: 'fa-bullseye',      bg: '#ECFDF5', color: '#059669', label: '提分预测',   page: 'home-predict',    desc: 'AI预测' },
            { icon: 'fa-calendar-check',bg: '#FEF3C7', color: '#D97706', label: '学习计划',   page: 'home-task',       desc: '今日任务' }
        ];
        html += `
        <div style="background:white;border-radius:14px;margin:0 0 12px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
            <div style="font-size:15px;font-weight:700;margin-bottom:14px;"><i class="fas fa-th-large" style="color:#3B82F6;margin-right:6px;"></i>个人中心</div>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px 8px;">`;
        subEntries.forEach(function (e) {
            html += `
                <div style="text-align:center;cursor:pointer;" onclick="navigateTo('${e.page}')">
                    <div style="width:44px;height:44px;border-radius:12px;background:${e.bg};color:${e.color};display:flex;align-items:center;justify-content:center;font-size:18px;margin:0 auto 6px;"><i class="fas ${e.icon}"></i></div>
                    <div style="font-size:12px;font-weight:600;color:#374151;">${e.label}</div>
                    <div style="font-size:10px;color:#9CA3AF;margin-top:2px;">${e.desc}</div>
                </div>`;
        });
        html += `</div></div>`;

        // 今日学习摘要
        var ts = data.today_summary || {};
        html += GradientCard('purple', `
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fas fa-bolt" style="font-size:18px;"></i>
                </div>
                <div style="flex:1;">
                    <div style="font-size:14px;font-weight:700;">今日已学习 ${ts.hours} 小时</div>
                    <div style="font-size:12px;opacity:0.9;margin-top:2px;">${ts.tip}</div>
                </div>
            </div>
        `);

        container.innerHTML = html;
    }

    return Page({
        title: '我的',
        navbar: false,
        tabbar: 'profile',
        content: '<div id="profile-main-content" style="background:#F3F4F6;min-height:100%;padding-bottom:12px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// ============================================================
// 2. VIP会员
// ============================================================
registerPage('profile-vip', 'VIP会员', '个人中心', 'fa-user', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('profile-vip-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('profile-vip').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div><button class="proto-btn proto-btn-primary" style="margin-top:16px;height:38px;border-radius:19px;padding:0 24px;font-size:13px;" onclick="navigateTo(\'home\')"><i class="fas fa-home"></i> 返回首页</button></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var html = '';

        // VIP特权展示卡片（金色渐变）
        html += GradientCard('orange', `
            <div style="text-align:center;padding:6px 0;">
                <div style="display:inline-flex;align-items:center;justify-content:center;width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,0.25);margin-bottom:10px;">
                    <i class="fas fa-crown" style="font-size:30px;color:white;"></i>
                </div>
                <div style="font-size:22px;font-weight:800;letter-spacing:1px;">${data.title}</div>
                <div style="font-size:12px;opacity:0.9;margin-top:4px;">${data.subtitle}</div>
                <div style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,0.2);padding:4px 12px;border-radius:12px;font-size:11px;font-weight:600;margin-top:10px;">
                    <i class="fas fa-fire"></i> 已有 ${data.users_count} 同学开通
                </div>
            </div>
        `);

        // 特权列表
        html += `<div style="font-size:15px;font-weight:700;margin:16px 4px 10px;"><i class="fas fa-gem" style="color:#F59E0B;margin-right:6px;"></i>VIP专属特权</div>`;
        var privHtml = (data.privileges || []).map(function (p) {
            return `
                <div style="display:flex;align-items:center;gap:12px;padding:14px 16px;border-bottom:1px solid #F3F4F6;cursor:pointer;" onclick="openModal('${p.title}特权详情', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b>特权名称：</b>${p.title}<br><b>特权说明：</b>${p.desc}<br><b>适用范围：</b>全体VIP会员<br><b>有效期：</b>会员有效期内不限次使用<br><br><span style=&quot;color:#6B7280;&quot;>开通VIP后即可享受此特权。</span></div>')">
                    <div style="width:40px;height:40px;border-radius:12px;background:${p.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fas ${p.icon}" style="color:white;font-size:16px;"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="font-size:14px;font-weight:600;">${p.title}</div>
                        <div style="font-size:12px;color:#9CA3AF;margin-top:2px;">${p.desc}</div>
                    </div>
                    <i class="fas fa-check-circle" style="color:#10B981;"></i>
                </div>`;
        }).join('');
        html += `<div style="background:white;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">${privHtml}</div>`;

        // 套餐选择
        html += `<div style="font-size:15px;font-weight:700;margin:18px 4px 10px;"><i class="fas fa-gift" style="color:#F59E0B;margin-right:6px;"></i>选择套餐</div>`;
        var plansHtml = (data.plans || []).map(function (p) {
            var bg = p.popular ? 'linear-gradient(160deg,#3B82F6,#1D4ED8)' : 'white';
            var color = p.popular ? 'white' : '#111827';
            var border = p.popular ? 'border:2px solid #3B82F6;' : 'border:2px solid #E5E7EB;';
            var popularBadge = p.popular ? '<div style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);background:#FCD34D;color:#7C2D12;font-size:10px;font-weight:700;padding:2px 8px;border-radius:8px;white-space:nowrap;">推荐</div>' : '';
            return `
                <div class="vip-plan-card" style="flex:1;background:${bg};color:${color};border-radius:14px;padding:16px 8px;text-align:center;position:relative;box-shadow:0 2px 8px rgba(0,0,0,0.08);${border}cursor:pointer;" onclick="document.querySelectorAll('.vip-plan-card').forEach(function(c){c.style.borderColor='';c.style.borderWidth='1px';});this.style.borderColor='#3B82F6';this.style.borderWidth='2px';showToast('已选择${p.name}，点击下方立即开通')">
                    ${popularBadge}
                    <div style="font-size:13px;font-weight:600;margin-bottom:8px;">${p.name}</div>
                    <div style="font-size:11px;opacity:0.85;">￥</div>
                    <div style="font-size:28px;font-weight:800;line-height:1;margin:2px 0;">${p.price}</div>
                    <div style="font-size:11px;opacity:0.85;">${p.unit}</div>
                    <div style="font-size:10px;margin-top:8px;opacity:0.9;">${p.desc}</div>
                </div>`;
        }).join('');
        html += `<div style="display:flex;gap:10px;">${plansHtml}</div>`;

        // 开通按钮
        html += `
            <button class="proto-btn proto-btn-primary" style="height:48px;font-size:16px;border-radius:24px;margin-top:18px;" onclick="openModal('确认开通', '<div style=&quot;padding:16px;line-height:1.8;font-size:14px;&quot;><b>套餐：</b>${data.cta_name}<br><b>价格：</b>￥${data.cta_price}<br><b>特权：</b>解锁全部VIP专属功能<br><br>支付即表示同意《VIP会员服务协议》</div>')">
                <i class="fas fa-crown"></i> 立即开通${data.cta_name} ￥${data.cta_price}
            </button>`;

        // 底部说明
        html += `
            <div style="font-size:11px;color:#9CA3AF;text-align:center;line-height:1.7;margin-top:14px;padding:0 8px;">
                <i class="fas fa-shield-alt"></i> 支付即表示同意《VIP会员服务协议》<br>
                · 会员有效期内可享全部VIP特权<br>
                · 续费可随时在设置中关闭自动续费
            </div>`;

        container.innerHTML = html;
    }

    return Page({
        title: 'VIP会员',
        back: true,
        content: '<div id="profile-vip-content" style="background:#F3F4F6;min-height:100%;padding-bottom:24px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// ============================================================
// 3. 学习报告
// ============================================================
registerPage('profile-report', '学习报告', '个人中心', 'fa-user', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('profile-report-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('profile-report').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div><button class="proto-btn proto-btn-primary" style="margin-top:16px;height:38px;border-radius:19px;padding:0 24px;font-size:13px;" onclick="navigateTo(\'home\')"><i class="fas fa-home"></i> 返回首页</button></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var html = '';

        // 报告周期
        html += Segment(data.periods || [], data.active_period || 0);

        // 学习概览
        var overviewHtml = (data.overview_stats || []).map(function (s) {
            return StatCard(s.label, s.value, s.change, s.color);
        }).join('');
        html += `
            <div style="background:white;border-radius:14px;padding:14px;margin:12px 0;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                <div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-tachometer-alt" style="color:#3B82F6;margin-right:6px;"></i>学习概览</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    ${overviewHtml}
                </div>
            </div>`;

        // 各科学习数据雷达图
        var subjectsHtml = (data.subjects || []).map(function (s) {
            return `
                <div>
                    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
                        <span style="color:${s.color};font-weight:600;">${s.name}</span>
                        <span style="color:#6B7280;">${s.score}分 · 掌握率 ${s.percent}%</span>
                    </div>
                    ${Progress(s.percent, s.color)}
                </div>`;
        }).join('');
        html += `
            <div style="background:white;border-radius:14px;padding:14px;margin:0 0 12px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                <div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-chart-pie" style="color:#8B5CF6;margin-right:6px;"></i>各科掌握程度</div>
                ${ChartPlaceholder(data.radar_chart_label, 160)}
                <div style="display:flex;flex-direction:column;gap:8px;margin-top:12px;">
                    ${subjectsHtml}
                </div>
            </div>`;

        // 知识点掌握热力图
        html += `
            <div style="background:white;border-radius:14px;padding:14px;margin:0 0 12px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                <div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-fire" style="color:#EF4444;margin-right:6px;"></i>知识点掌握热力图</div>
                ${ChartPlaceholder(data.heatmap_label, 120)}
                <div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;font-size:10px;color:#9CA3AF;margin-top:8px;">
                    未掌握
                    <span style="display:inline-block;width:12px;height:12px;background:#DBEAFE;border-radius:2px;"></span>
                    <span style="display:inline-block;width:12px;height:12px;background:#93C5FD;border-radius:2px;"></span>
                    <span style="display:inline-block;width:12px;height:12px;background:#3B82F6;border-radius:2px;"></span>
                    <span style="display:inline-block;width:12px;height:12px;background:#1D4ED8;border-radius:2px;"></span>
                    熟练
                </div>
            </div>`;

        // AI评语卡片（绿色渐变）
        html += GradientCard('green', `
            <div style="display:flex;align-items:flex-start;gap:12px;">
                <div style="width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fas fa-robot" style="font-size:18px;"></i>
                </div>
                <div style="flex:1;">
                    <div style="font-size:15px;font-weight:700;margin-bottom:6px;">AI学情评语</div>
                    <div style="font-size:13px;line-height:1.7;opacity:0.95;">${data.ai_comment}</div>
                </div>
            </div>
        `);

        // 操作按钮
        html += `
            <div style="display:flex;gap:10px;margin-top:14px;">
                <button class="proto-btn proto-btn-outline" style="height:44px;border-radius:22px;" onclick="openModal('分享学习报告', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b>分享链接已生成：</b><br><div style=&quot;background:#F3F4F6;padding:10px;border-radius:8px;margin:8px 0;word-break:break-all;font-size:12px;color:#3B82F6;&quot;>https://edu.example.com/share/report/${Date.now()}</div><b>二维码：</b><br><div style=&quot;text-align:center;padding:20px;background:#F9FAFB;border-radius:8px;margin:8px 0;&quot;><i class=&quot;fas fa-qrcode&quot; style=&quot;font-size:80px;color:#374151;&quot;></i></div><span style=&quot;color:#6B7280;&quot;>链接7天内有效，可分享给家长或老师查看。</span></div>')"><i class="fas fa-share-alt"></i> 分享报告</button>
                <button class="proto-btn proto-btn-primary" style="height:44px;border-radius:22px;" onclick="openModal('学习报告导出', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b>报告概要：</b><br>· 报告类型：${data.period || '本学期'}学习报告<br>· 包含内容：成绩趋势、学科分析、学习建议<br>· 页数：约 ${data.pages || 8} 页<br>· 格式：PDF<br><br><div style=&quot;text-align:center;padding:16px;background:#F0FDF4;border-radius:8px;margin:8px 0;&quot;><i class=&quot;fas fa-check-circle&quot; style=&quot;font-size:32px;color:#10B981;&quot;></i><div style=&quot;margin-top:8px;font-weight:600;color:#10B981;&quot;>报告已生成完毕</div></div><span style=&quot;color:#6B7280;&quot;>点击下方按钮下载PDF文件。</span></div>')"><i class="fas fa-file-pdf"></i> 导出PDF</button>
            </div>`;

        container.innerHTML = html;
    }

    return Page({
        title: '学习报告',
        back: true,
        content: '<div id="profile-report-content" style="background:#F3F4F6;min-height:100%;padding-bottom:24px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// ============================================================
// 4. 家长中心
// ============================================================
registerPage('profile-parent', '家长中心', '个人中心', 'fa-user', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('profile-parent-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('profile-parent').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div><button class="proto-btn proto-btn-primary" style="margin-top:16px;height:38px;border-radius:19px;padding:0 24px;font-size:13px;" onclick="navigateTo(\'home\')"><i class="fas fa-home"></i> 返回首页</button></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var html = '';
        var st = data.student || {};

        // 绑定孩子信息卡片
        html += GradientCard('blue', `
            <div style="display:flex;align-items:center;gap:12px;">
                <img src="${st.avatar}" style="width:52px;height:52px;border-radius:50%;border:2px solid rgba(255,255,255,0.6);">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:16px;font-weight:700;">${st.name}</span>
                        <span style="background:rgba(255,255,255,0.2);padding:1px 8px;border-radius:8px;font-size:11px;">已绑定</span>
                    </div>
                    <div style="font-size:12px;opacity:0.9;margin-top:4px;">${st.grade} · ${st.province} · ${st.school}</div>
                    <div style="font-size:11px;opacity:0.85;margin-top:2px;"><i class="fas fa-link"></i> 关系：${st.relation}</div>
                </div>
                <div style="text-align:center;background:rgba(255,255,255,0.18);border-radius:10px;padding:6px 10px;">
                    <div style="font-size:18px;font-weight:700;">${st.current_score}</div>
                    <div style="font-size:10px;opacity:0.85;">当前估分</div>
                </div>
            </div>
        `);

        // 孩子学习概览
        var overviewHtml = (data.overview_stats || []).map(function (s) {
            return StatCard(s.label, s.value, s.change, s.color);
        }).join('');
        html += `
            <div style="background:white;border-radius:14px;padding:14px;margin:12px 0;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                <div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-chart-line" style="color:#3B82F6;margin-right:6px;"></i>学习概览</div>
                <div class="proto-grid-3">
                    ${overviewHtml}
                </div>
            </div>`;

        // 学习日报列表
        html += `<div style="font-size:15px;font-weight:700;margin:4px 4px 10px;"><i class="fas fa-calendar-check" style="color:#8B5CF6;margin-right:6px;"></i>最近7天日报</div>`;
        var reports = data.daily_reports || [];
        var reportsHtml = reports.map(function (d, i) {
            var rateColor = d.rate >= 80 ? '#10B981' : '#F59E0B';
            var isLast = i === reports.length - 1;
            var border = isLast ? 'none' : '1px solid #F3F4F6';
            var dayParts = d.day.split('/');
            return `
                <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:${border};cursor:pointer;" onclick="openModal('学习日报', '<div style=&quot;padding:16px;line-height:1.8;font-size:14px;&quot;><b>日期：</b>${d.day}<br><b>学习时长：</b>${d.time}<br><b>做题数量：</b>${d.count} 题<br><b>正确率：</b>${d.rate}%<br><br>坚持每日学习，稳步提升成绩！</div>')">
                    <div style="width:44px;height:44px;border-radius:12px;background:#EFF6FF;display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">
                        <span style="font-size:11px;color:#6B7280;">${dayParts[0]}</span>
                        <span style="font-size:15px;font-weight:700;color:#3B82F6;">${dayParts[1]}</span>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex;align-items:center;gap:10px;font-size:12px;color:#6B7280;">
                            <span><i class="far fa-clock"></i> ${d.time}</span>
                            <span><i class="fas fa-pencil-alt"></i> ${d.count}题</span>
                        </div>
                        <div style="margin-top:6px;">${Progress(d.rate, rateColor)}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:16px;font-weight:700;color:${rateColor};">${d.rate}%</div>
                        <div style="font-size:10px;color:#9CA3AF;">正确率</div>
                    </div>
                </div>`;
        }).join('');
        html += `<div style="background:white;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">${reportsHtml}</div>`;

        // 成绩变化趋势图
        html += `
            <div style="background:white;border-radius:14px;padding:14px;margin:12px 0;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                <div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-chart-line" style="color:#10B981;margin-right:6px;"></i>成绩变化趋势</div>
                ${ChartPlaceholder(data.trend_chart_label, 140)}
            </div>`;

        // AI学情周报摘要卡片
        var wr = data.weekly_report || {};
        html += GradientCard('purple', `
            <div style="display:flex;align-items:flex-start;gap:12px;">
                <div style="width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fas fa-robot" style="font-size:18px;"></i>
                </div>
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;justify-content:space-between;">
                        <span style="font-size:15px;font-weight:700;">AI学情周报</span>
                        <span style="font-size:11px;background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:8px;">${wr.week}</span>
                    </div>
                    <div style="font-size:12px;line-height:1.7;opacity:0.95;margin-top:6px;">${wr.content}</div>
                </div>
            </div>
        `);

        // 操作按钮
        html += `
            <div style="display:flex;gap:10px;margin-top:14px;">
                <button class="proto-btn proto-btn-outline" style="height:44px;border-radius:22px;" onclick="openModal('设置学习目标', '<div style=&quot;padding:16px;line-height:1.8;font-size:14px;&quot;>请输入孩子的目标分数与重点提升科目，系统将根据目标智能规划学习路径。<br><br><b>当前估分：</b>${st.current_score}</div>')"><i class="fas fa-bullseye"></i> 设置学习目标</button>
                <button class="proto-btn proto-btn-primary" style="height:44px;border-radius:22px;" onclick="openModal('消息通知', '<div style=&quot;padding:16px;line-height:1.8;font-size:14px;&quot;>家长消息通知设置：<br>· 每日学习日报推送<br>· 周报智能汇总<br>· 异常学习提醒<br>· 考试成绩通知</div>')"><i class="fas fa-bell"></i> 消息通知</button>
            </div>`;

        container.innerHTML = html;
    }

    return Page({
        title: '家长中心',
        back: true,
        content: '<div id="profile-parent-content" style="background:#F3F4F6;min-height:100%;padding-bottom:24px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// ============================================================
// 5. 设置
// ============================================================
registerPage('profile-settings', '设置', '个人中心', 'fa-user', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('profile-settings-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('profile-settings').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div><button class="proto-btn proto-btn-primary" style="margin-top:16px;height:38px;border-radius:19px;padding:0 24px;font-size:13px;" onclick="navigateTo(\'home\')"><i class="fas fa-home"></i> 返回首页</button></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function sectionTitle(text) {
        return '<div style="font-size:13px;color:#6B7280;font-weight:600;margin:16px 4px 8px;padding-left:4px;">' + text + '</div>';
    }

    // 渲染普通列表项区块（账号/学习/其他）
    function renderListSection(section) {
        var items = section.items || [];
        var itemsHtml = items.map(function (it) {
            return '<div class="proto-list-item" onclick="openModal(\'' + it.title + '\', \'<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b>' + it.title + '</b><br>' + it.desc + '<br><br><span style=&quot;color:#6B7280;&quot;>该功能正在开发中，敬请期待。</span></div>\')">' +
                '<div class="icon" style="background:' + it.bg + '"><i class="fas ' + it.icon + '"></i></div>' +
                '<div class="text"><div class="title">' + it.title + '</div>' + (it.desc ? '<div class="desc">' + it.desc + '</div>' : '') + '</div>' +
                '<div class="arrow"><i class="fas fa-chevron-right"></i></div>' +
                '</div>';
        }).join('');
        return sectionTitle(section.title) +
            '<div style="background:white;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">' + itemsHtml + '</div>';
    }

    // 渲染通知设置区块（带开关）
    function renderNotificationSection(section) {
        var itemsHtml = (section.items || []).map(function (it, i) {
            var isLast = i === section.items.length - 1;
            var border = isLast ? '' : 'border-bottom:1px solid #F3F4F6;';
            var toggleBg = it.enabled ? '#3B82F6' : '#E5E7EB';
            var toggleTransform = it.enabled ? 'translateX(20px)' : 'translateX(0)';
            return `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;${border}">
                    <div style="display:flex;align-items:center;gap:12px;flex:1;">
                        <div style="width:36px;height:36px;border-radius:10px;background:${it.bg};display:flex;align-items:center;justify-content:center;"><i class="fas ${it.icon}" style="color:white;"></i></div>
                        <div>
                            <div style="font-size:14px;font-weight:600;">${it.title}</div>
                            <div style="font-size:12px;color:#9CA3AF;">${it.desc}</div>
                        </div>
                    </div>
                    <div data-enabled="${it.enabled}" style="width:42px;height:24px;border-radius:12px;background:${toggleBg};position:relative;cursor:pointer;" onclick="var dot=this.querySelector('div');var en=this.getAttribute('data-enabled')==='true';if(en){dot.style.transform='translateX(0)';this.style.background='#D1D5DB';}else{dot.style.transform='translateX(20px)';this.style.background='#3B82F6';}this.setAttribute('data-enabled',!en);showToast('${it.title}已'+(!en?'开启':'关闭'))"><div style="position:absolute;top:2px;left:2px;transform:${toggleTransform};transition:transform 0.2s;width:20px;height:20px;border-radius:50%;background:white;"></div></div>
                </div>`;
        }).join('');
        return sectionTitle(section.title) +
            '<div style="background:white;border-radius:14px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">' + itemsHtml + '</div>';
    }

    function renderPageContent(container, data) {
        var html = '';

        // 账号设置
        html += renderListSection(data.account_section);
        // 学习设置
        html += renderListSection(data.study_section);
        // 通知设置
        html += renderNotificationSection(data.notification_section);
        // 其他
        html += renderListSection(data.other_section);

        // 退出登录
        html += `
            <button class="proto-btn proto-btn-outline" style="height:48px;border-radius:24px;margin-top:20px;color:#EF4444;border-color:#FCA5A5;" onclick="openModal('退出登录', '<div style=&quot;text-align:center;padding:8px 0 4px;&quot;><i class=&quot;fas fa-sign-out-alt&quot; style=&quot;font-size:32px;color:#EF4444;&quot;></i><div style=&quot;font-size:14px;color:#374151;margin-top:10px;line-height:1.7;&quot;>确定要退出当前账号吗？<br>退出后需重新登录。</div><button class=&quot;proto-btn proto-btn-primary&quot; style=&quot;background:#EF4444;margin-top:16px;height:42px;border-radius:21px;&quot; onclick=&quot;closeModal();openModal('正在退出...', '<div style=&amp;quot;padding:20px;text-align:center;&amp;quot;><i class=&amp;quot;fas fa-spinner fa-spin&amp;quot; style=&amp;quot;font-size:24px;color:#3B82F6;&amp;quot;></i><div style=&amp;quot;margin-top:12px;font-size:13px;color:#6B7280;&amp;quot;>正在安全退出登录...</div></div>');setTimeout(function(){closeModal();navigateTo('home');},1500)&quot;>确认退出</button></div>')">
                <i class="fas fa-sign-out-alt"></i> 退出登录
            </button>
            <div style="text-align:center;font-size:11px;color:#9CA3AF;margin-top:14px;">${data.version}</div>`;

        container.innerHTML = html;
    }

    return Page({
        title: '设置',
        back: true,
        content: '<div id="profile-settings-content" style="background:#F3F4F6;min-height:100%;padding-bottom:24px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});
