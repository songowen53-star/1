// ============================================================
// 志愿填报模块 - 3个页面（动态加载：数据来自 /api/page-data/:key）
// ============================================================

// 1. AI院校推荐
// 缓存最近一次加载的数据，供「调整推荐条件」后重新计算渲染使用
var collegeRecommendData = null;

// 院校池：覆盖不同省份、分数段、选科要求，供重新推荐时按条件筛选
// 字段：name(校名) / province(所在省) / score(2025录取线) / majors(优势专业) / subjects(选科要求，空=不限) / icon
var COLLEGE_POOL = [
    { name: '清华大学', province: '北京市', score: 685, majors: '计算机/电子信息/经济与金融', subjects: ['物化生','物化政','物化地'], icon: 'fa-university' },
    { name: '北京大学', province: '北京市', score: 682, majors: '数学/物理/光华管理', subjects: ['物化生','物化政','物化地','物生地'], icon: 'fa-university' },
    { name: '中国人民大学', province: '北京市', score: 655, majors: '法学/新闻/金融学', subjects: ['物化政','史政地','史政生'], icon: 'fa-university' },
    { name: '北京航空航天大学', province: '北京市', score: 642, majors: '航空航天/计算机/电子信息', subjects: ['物化生','物化政','物化地'], icon: 'fa-university' },
    { name: '北京理工大学', province: '北京市', score: 635, majors: '兵器/车辆工程/计算机', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '中国农业大学', province: '北京市', score: 618, majors: '农学/食品科学/动物医学', subjects: ['物化生','物生地'], icon: 'fa-university' },
    { name: '北京师范大学', province: '北京市', score: 638, majors: '心理学/教育学/汉语言文学', subjects: ['史政地','史政生','物化生'], icon: 'fa-university' },
    { name: '复旦大学', province: '上海市', score: 672, majors: '新闻/经济学/临床医学', subjects: ['物化生','物化政','史政地'], icon: 'fa-university' },
    { name: '上海交通大学', province: '上海市', score: 670, majors: '船舶/计算机/临床医学', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '同济大学', province: '上海市', score: 632, majors: '土木工程/建筑/车辆工程', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '华东师范大学', province: '上海市', score: 615, majors: '教育学/心理学/软件工程', subjects: ['物化生','史政地'], icon: 'fa-university' },
    { name: '南京大学', province: '江苏省', score: 652, majors: '天文/物理/计算机', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '东南大学', province: '江苏省', score: 628, majors: '建筑/电子/信息工程', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '浙江大学', province: '浙江省', score: 638, majors: '计算机/控制科学/光学工程', subjects: ['物化生','物化政','物化地'], icon: 'fa-university' },
    { name: '武汉大学', province: '湖北省', score: 612, majors: '测绘/法学/马克思主义理论', subjects: ['物化生','史政地','史政生'], icon: 'fa-university' },
    { name: '华中科技大学', province: '湖北省', score: 608, majors: '机械/光学/公共卫生', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '中山大学', province: '广东省', score: 625, majors: '工商管理/生物学/化学', subjects: ['物化生','物生地'], icon: 'fa-university' },
    { name: '华南理工大学', province: '广东省', score: 602, majors: '轻工/建筑/材料', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '四川大学', province: '四川省', score: 595, majors: '口腔/数学/化学', subjects: ['物化生','物生地'], icon: 'fa-university' },
    { name: '电子科技大学', province: '四川省', score: 592, majors: '电子科学/信息通信/计算机', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '重庆大学', province: '重庆市', score: 588, majors: '建筑/机械/电气', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '西安交通大学', province: '陕西省', score: 610, majors: '电气/能动/管理科学', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '哈尔滨工业大学', province: '黑龙江省', score: 605, majors: '航天/焊接/计算机', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '吉林大学', province: '吉林省', score: 580, majors: '车辆工程/法学/考古', subjects: ['物化生','史政地'], icon: 'fa-university' },
    { name: '山东大学', province: '山东省', score: 590, majors: '数学/中文/医学', subjects: ['物化生','史政地'], icon: 'fa-university' },
    { name: '中国海洋大学', province: '山东省', score: 578, majors: '海洋科学/水产/食品', subjects: ['物化生','物生地'], icon: 'fa-university' },
    { name: '厦门大学', province: '福建省', score: 600, majors: '会计/经济/化学', subjects: ['物化生','史政地','物化政'], icon: 'fa-university' },
    { name: '湖南大学', province: '湖南省', score: 585, majors: '土木/车辆/工商管理', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '中南大学', province: '湖南省', score: 582, majors: '冶金/医学/材料', subjects: ['物化生','物生地'], icon: 'fa-university' },
    { name: '天津大学', province: '天津市', score: 615, majors: '化工/建筑/精仪', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '南开大学', province: '天津市', score: 628, majors: '数学/化学/经济', subjects: ['物化生','物化政'], icon: 'fa-university' },
    { name: '大连理工大学', province: '辽宁省', score: 586, majors: '化工/机械/土木', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '东北大学', province: '辽宁省', score: 568, majors: '自动化/计算机/冶金', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '兰州大学', province: '甘肃省', score: 560, majors: '核物理/化学/草业科学', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '云南大学', province: '云南省', score: 555, majors: '民族学/生态学/软件', subjects: ['物化生','史政地','物生地'], icon: 'fa-university' },
    { name: '贵州大学', province: '贵州省', score: 545, majors: '计算机/土木/机械', subjects: ['物化生','物化地'], icon: 'fa-university' }
];

registerPage('college-recommend', 'AI院校推荐', '志愿填报', 'fa-university', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('college-recommend-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('college-recommend').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-inbox" style="font-size:32px;margin-bottom:12px;"></i><div style="font-size:13px;margin-bottom:16px;">暂无数据</div><button class="proto-btn proto-btn-outline" style="font-size:12px;" onclick="navigateTo(\'home\')">返回首页</button></div>';
                return;
            }
            collegeRecommendData = data;
            renderCollegeRecommendContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    return Page({
        title: 'AI院校推荐',
        back: true,
        content: '<div id="college-recommend-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// 渲染 AI院校推荐 内容（首屏加载与「重新推荐」共用）
function renderCollegeRecommendContent(container, data) {
    var html = '';

    // 推荐条件卡片
    var condTags = (data.conditions || []).map(function (c) {
        return '<span style="background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:12px;font-size:12px;">' + c + '</span>';
    }).join('');
    html += GradientCard('blue', `
        <div style="font-size:13px;opacity:0.9;margin-bottom:8px;"><i class="fas fa-sliders-h"></i> 推荐条件</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${condTags}
        </div>
    `);

    // 院校列表
    (data.colleges || []).forEach(function (c) {
        var probColor = c.prob >= 80 ? 'var(--success)' : c.prob >= 60 ? 'var(--warning)' : 'var(--danger)';
        html += `
        <div class="proto-card" style="cursor:pointer;" onclick="openModal('院校详情', '<div style=&quot;padding:14px;font-size:13px;color:#374151;line-height:1.8;&quot;><b>院校：</b>${c.name}<br><b>类型：</b>${c.type}<br><b>2025录取线：</b>${c.score}分<br><b>录取概率：</b>${c.prob}%<br><b>优势专业：</b>${c.majors}</div>')">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:36px;height:36px;border-radius:10px;background:var(--primary-light);display:flex;align-items:center;justify-content:center;"><i class="fas ${c.icon}" style="color:var(--primary);"></i></div>
                    <div>
                        <div style="font-size:15px;font-weight:700;">${c.name}</div>
                        <div style="font-size:11px;color:var(--text-tertiary);">2025录取线 ${c.score}分</div>
                    </div>
                </div>
                ${Tag(c.type, c.tag)}
            </div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                <div style="flex:1;">
                    <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;">录取概率</div>
                    ${Progress(c.prob, probColor)}
                </div>
                <div style="font-size:18px;font-weight:700;color:${probColor};">${c.prob}%</div>
            </div>
            <div style="font-size:12px;color:var(--text-secondary);background:#F9FAFB;border-radius:8px;padding:8px 10px;">
                <i class="fas fa-star" style="color:var(--warning);margin-right:4px;"></i>优势专业：${c.majors}
            </div>
        </div>`;
    });

    // 调整按钮 —— 打开交互表单而非静态说明
    html += `<button class="proto-btn proto-btn-outline" style="margin-top:8px;" onclick="collegeRecommendAdjust()"><i class="fas fa-sliders-h"></i> 调整推荐条件</button>`;

    container.innerHTML = html;
}

// 打开「调整推荐条件」交互表单弹窗
function collegeRecommendAdjust() {
    var d = collegeRecommendData || {};
    var conds = d.conditions || [];
    // 解析当前条件，回填表单默认值
    var curScore = '598', curProv = '浙江省', curSub = '物化生', curRank = '8231';
    if (conds.length >= 1) curScore = (conds[0].match(/\d+/) || ['598'])[0];
    if (conds.length >= 2) curProv = conds[1];
    if (conds.length >= 3) curSub = conds[2];
    if (conds.length >= 4) { var rankMatch = conds[3].match(/[\d,]+/); curRank = rankMatch ? rankMatch[0].replace(/,/g, '') : '8231'; }

    var provinces = ['北京市','天津市','河北省','山西省','辽宁省','吉林省','黑龙江省','上海市','江苏省','浙江省','安徽省','福建省','江西省','山东省','河南省','湖北省','湖南省','广东省','海南省','重庆市','四川省','贵州省','云南省','陕西省','甘肃省','青海省'];
    var subjectSets = ['物化生','物化政','物化地','物生政','物生地','史政地','史政生','史地生'];
    var provOpts = provinces.map(function (p) { return '<option value="' + p + '"' + (p === curProv ? ' selected' : '') + '>' + p + '</option>'; }).join('');
    var subOpts = subjectSets.map(function (s) { return '<option value="' + s + '"' + (s === curSub ? ' selected' : '') + '>' + s + '</option>'; }).join('');

    var formHtml = '<div style="font-size:12px;color:#6B7280;margin-bottom:14px;line-height:1.6;">调整以下条件，AI 将重新计算录取概率并重新排序推荐院校。</div>'
        + '<div style="margin-bottom:14px;"><div style="font-size:12px;color:#6B7280;margin-bottom:6px;">预估分数</div><input id="cr-score" class="proto-input" type="number" value="' + curScore + '" style="height:40px;"></div>'
        + '<div style="margin-bottom:14px;"><div style="font-size:12px;color:#6B7280;margin-bottom:6px;">所在省份</div><select id="cr-province" class="proto-input" style="height:40px;">' + provOpts + '</select></div>'
        + '<div style="margin-bottom:14px;"><div style="font-size:12px;color:#6B7280;margin-bottom:6px;">选科组合</div><select id="cr-subject" class="proto-input" style="height:40px;">' + subOpts + '</select></div>'
        + '<div style="margin-bottom:18px;"><div style="font-size:12px;color:#6B7280;margin-bottom:6px;">全省位次</div><input id="cr-rank" class="proto-input" type="number" value="' + curRank + '" style="height:40px;"></div>'
        + '<button class="proto-btn proto-btn-primary" style="width:100%;height:44px;border-radius:8px;" onclick="collegeRecommendReapply()"><i class="fas fa-sync-alt"></i> 重新推荐</button>';

    openModal('调整推荐条件', formHtml, { width: 360 });
}

// 根据新条件重新计算录取概率并重新渲染
function collegeRecommendReapply() {
    var scoreEl = document.getElementById('cr-score');
    var provEl = document.getElementById('cr-province');
    var subEl = document.getElementById('cr-subject');
    var rankEl = document.getElementById('cr-rank');
    if (!scoreEl || !provEl || !subEl || !rankEl) return;

    var score = parseInt(scoreEl.value, 10) || 598;
    var province = provEl.value;
    var subject = subEl.value;
    var rank = parseInt(rankEl.value, 10) || 8231;

    closeModal();

    var container = document.getElementById('college-recommend-content');
    if (!container) return;
    var d = collegeRecommendData || { colleges: [] };

    // 更新推荐条件标签
    d.conditions = ['预估 ' + score + '分', province, subject, '全省' + rank.toLocaleString('en') + '名'];

    // 从院校池中筛选：
    //   1) 选科匹配（subjects 为空=不限；否则需包含当前选科组合）
    //   2) 分数在合理区间 [score-45, score+35]，保证冲刺/稳妥/保底都有
    //   3) 同省院校优先（提升其在排序中的权重）
    var candidates = COLLEGE_POOL.filter(function (c) {
        if (c.subjects && c.subjects.length > 0 && c.subjects.indexOf(subject) === -1) return false;
        var lo = score - 45, hi = score + 35;
        return c.score >= lo && c.score <= hi;
    });

    // 计算每所候选院校的录取概率
    candidates.forEach(function (c) {
        var gap = c.score - score;
        var prob = 100 - gap * 1.5;
        // 同省院校：因招生计划多，概率小幅提升
        if (c.province === province) prob += 5;
        if (prob < 5) prob = 5;
        if (prob > 98) prob = 98;
        c.prob = Math.round(prob);
        if (c.prob >= 80) { c.type = '保底'; c.tag = 'green'; }
        else if (c.prob >= 55) { c.type = '稳妥'; c.tag = 'orange'; }
        else { c.type = '冲刺'; c.tag = 'red'; }
        c.score = String(c.score);
    });

    // 按录取概率降序排序
    candidates.sort(function (a, b) { return b.prob - a.prob; });

    // 若筛选结果为空（极端分数），回退到原始列表并重新计算概率
    var finalList = candidates.length > 0 ? candidates : (d.colleges || []);

    // 取前 8 所展示
    d.colleges = finalList.slice(0, 8).map(function (c) {
        return { name: c.name, type: c.type, tag: c.tag, prob: c.prob, score: String(c.score), majors: c.majors, icon: c.icon };
    });

    // 显示加载动画后重新渲染
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">AI 正在根据新条件重新计算…</div></div>';
    setTimeout(function () {
        renderCollegeRecommendContent(container, d);
        if (typeof showToast === 'function') showToast('已根据新条件重新推荐');
    }, 700);
}

// 2. 专业推荐
registerPage('college-major', '专业推荐', '志愿填报', 'fa-graduation-cap', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('college-major-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('college-major').then(function (data) {
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

        // 兴趣标签选择
        html += `<div class="section-title">兴趣方向</div>`;
        var interestTags = (data.interests || []).map(function (it) {
            var stars = it.stars || 4;
            var info = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b>专业名称：</b>' + it.name + '<br><b>选科要求：</b>' + (it.req || '物理+化学') + '<br><b>就业方向：</b>' + (it.career || '科研、工程、技术开发等') + '<br><b>推荐指数：</b><span style=&quot;color:#F59E0B;&quot;>' + '★'.repeat(stars) + '☆'.repeat(5 - stars) + '</span><br><br><span style=&quot;color:#6B7280;&quot;>该专业与你的兴趣匹配度较高，建议作为志愿填报的参考方向。</span></div>';
            if (it.selected) {
                return '<div style="padding:8px 16px;border-radius:20px;background:var(--primary);color:white;font-size:13px;font-weight:600;cursor:pointer;" onclick="openModal(\'' + it.name + '专业详情\', \'' + info + '\')"><i class="fas fa-check"></i> ' + it.name + '</div>';
            }
            return '<div style="padding:8px 16px;border-radius:20px;background:white;color:var(--text-secondary);font-size:13px;border:1px solid var(--border);cursor:pointer;" onclick="openModal(\'' + it.name + '专业详情\', \'' + info + '\')">' + it.name + '</div>';
        }).join('');
        html += `
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
            ${interestTags}
        </div>`;

        // 推荐专业列表
        html += `<div class="section-title">AI推荐专业 <span class="more">${data.match_count}个匹配</span></div>`;

        (data.majors || []).forEach(function (m) {
            var matchColor = m.match >= 90 ? '#10B981' : m.match >= 80 ? '#F59E0B' : '#6B7280';
            html += `
            <div class="proto-card" style="cursor:pointer;" onclick="openModal('专业详情', '<div style=&quot;padding:14px;font-size:13px;color:#374151;line-height:1.8;&quot;><b>专业：</b>${m.name}<br><b>匹配度：</b>${m.match}%<br><b>就业前景：</b>${m.prospect}<br><b>薪资水平：</b>${m.salary}<br><b>推荐院校：</b>${m.recommend_colleges}所</div>')">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                    <div style="width:44px;height:44px;border-radius:12px;background:${m.bg};display:flex;align-items:center;justify-content:center;"><i class="fas ${m.icon}" style="color:white;font-size:18px;"></i></div>
                    <div style="flex:1;">
                        <div style="font-size:15px;font-weight:700;">${m.name}</div>
                        <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;">匹配度 ${m.match}%</div>
                    </div>
                    <div style="text-align:center;">
                        ${RingChart(m.match, matchColor, 48)}
                    </div>
                </div>
                <div style="display:flex;gap:8px;">
                    <div style="flex:1;background:#F9FAFB;border-radius:8px;padding:8px;text-align:center;">
                        <div style="font-size:10px;color:var(--text-tertiary);">就业前景</div>
                        <div style="font-size:13px;font-weight:700;color:var(--success);margin-top:2px;">${m.prospect}</div>
                    </div>
                    <div style="flex:1;background:#F9FAFB;border-radius:8px;padding:8px;text-align:center;">
                        <div style="font-size:10px;color:var(--text-tertiary);">薪资水平</div>
                        <div style="font-size:13px;font-weight:700;color:var(--primary);margin-top:2px;">${m.salary}</div>
                    </div>
                    <div style="flex:1;background:#F9FAFB;border-radius:8px;padding:8px;text-align:center;">
                        <div style="font-size:10px;color:var(--text-tertiary);">推荐院校</div>
                        <div style="font-size:13px;font-weight:700;color:var(--purple);margin-top:2px;">${m.recommend_colleges}所</div>
                    </div>
                </div>
            </div>`;
        });

        container.innerHTML = html;
    }

    return Page({
        title: '专业推荐',
        back: true,
        content: '<div id="college-major-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// 3. 位次分析
registerPage('college-rank', '位次分析', '志愿填报', 'fa-layer-group', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('college-rank-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('college-rank').then(function (data) {
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

        // 预估位次
        html += GradientCard('purple', `
            <div style="text-align:center;">
                <div style="font-size:12px;opacity:0.9;">2026年预估位次</div>
                <div style="font-size:42px;font-weight:700;margin:4px 0;">第${data.predicted_rank}名</div>
                <div style="font-size:13px;opacity:0.9;">${data.province} · ${data.category} · 预估${data.predicted_score}分</div>
            </div>
        `);

        // 位次换算表
        html += `<div class="section-title">位次换算表</div>`;
        var convRows = (data.conversion_table || []).map(function (row, idx) {
            var border = idx < (data.conversion_table.length - 1) ? 'border-bottom:1px solid var(--border);' : '';
            return `<div style="display:flex;padding:12px 16px;${border}font-size:13px;cursor:pointer;" onclick="openModal('${row.year}年位次换算详情', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b>年份：</b>${row.year}<br><b>原始位次：</b>第 ${row.rank} 名<br><b>等效分数：</b><span style=&quot;color:#3B82F6;font-weight:700;&quot;>${row.score}分</span><br><b>一本线差：</b>+${row.diff || 35}分<br><br><b>同位次可报院校参考：</b><br>· ${row.college1 || '重庆大学'}（冲）<br>· ${row.college2 || '西南大学'}（稳）<br>· ${row.college3 || '湖南大学'}（保）<br><br><span style=&quot;color:#6B7280;&quot;>※ 等效位次是根据历年分数线换算的参考值，实际录取以当年政策为准。</span></div>')">
                <div style="flex:1;font-weight:600;">${row.year}</div><div style="flex:1;color:var(--primary);font-weight:600;">${row.rank}</div><div style="flex:1;">${row.score}</div>
            </div>`;
        }).join('');
        html += `
        <div class="proto-card" style="padding:0;overflow:hidden;">
            <div style="display:flex;padding:10px 16px;background:#F9FAFB;font-size:12px;font-weight:700;color:var(--text-secondary);">
                <div style="flex:1;">年份</div><div style="flex:1;">等效位次</div><div style="flex:1;">等效分数</div>
            </div>
            ${convRows}
        </div>`;

        // 一分一段表
        html += `<div class="section-title">一分一段表</div>`;
        var opLabels = (data.one_point_data && data.one_point_data.labels) || ['590', '595', '600', '605', '610', '615', '620'];
        var opValues = (data.one_point_data && data.one_point_data.values) || [45, 62, 78, 95, 88, 70, 52];
        html += '<div id="college-rank-onepoint-chart" style="height:150px;"></div><script>setTimeout(function(){drawScoreChart(\'college-rank-onepoint-chart\',\'bar\',' + JSON.stringify(opLabels) + ',' + JSON.stringify(opValues) + ',' + JSON.stringify(['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']) + ');},100)</script>';

        // 同位次历年录取统计
        html += `<div class="section-title">同位次历年录取</div>`;
        var historyRows = (data.history_admission || []).map(function (row, idx) {
            var border = idx < (data.history_admission.length - 1) ? 'border-bottom:1px solid var(--border);' : '';
            return `<div style="display:flex;padding:12px 16px;${border}font-size:13px;align-items:center;cursor:pointer;" onclick="openModal('录取详情', '<div style=&quot;padding:14px;font-size:13px;color:#374151;line-height:1.8;&quot;><b>年份：</b>${row.year}<br><b>录取院校：</b>${row.college}<br><b>院校层次：</b>${row.level}</div>')">
                <div style="flex:1;">${row.year}</div><div style="flex:1;">${row.college}</div><div style="flex:1;">${Tag(row.level, 'red')}</div>
            </div>`;
        }).join('');
        html += `
        <div class="proto-card" style="padding:0;overflow:hidden;">
            <div style="display:flex;padding:10px 16px;background:#F9FAFB;font-size:12px;font-weight:700;color:var(--text-secondary);">
                <div style="flex:1;">年份</div><div style="flex:1;">录取院校</div><div style="flex:1;">层次</div>
            </div>
            ${historyRows}
        </div>`;

        // 院校层次分布饼图
        html += `<div class="section-title">院校层次分布</div>`;
        var tpLabels = (data.tier_data && data.tier_data.labels) || ['985', '211', '一本', '二本', '专科'];
        var tpValues = (data.tier_data && data.tier_data.values) || [12, 28, 65, 120, 45];
        html += '<div id="college-rank-tier-chart" style="height:150px;"></div><script>setTimeout(function(){drawScoreChart(\'college-rank-tier-chart\',\'bar\',' + JSON.stringify(tpLabels) + ',' + JSON.stringify(tpValues) + ',' + JSON.stringify(['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#9CA3AF']) + ');},100)</script>';

        // 志愿填报建议
        var adv = data.advice || {};
        var strategyLines = (adv.strategy || []).map(function (st) {
            return '· ' + st.type + '：' + st.colleges;
        }).join('<br>');
        html += `
        <div class="gradient-card gradient-orange">
            <div style="display:flex;align-items:flex-start;gap:10px;">
                <i class="fas fa-lightbulb" style="font-size:20px;margin-top:2px;"></i>
                <div style="font-size:13px;line-height:1.7;">
                    <div style="font-weight:700;margin-bottom:6px;">${adv.title || ''}</div>
                    ${adv.intro || ''}<br>
                    ${strategyLines}<br>
                    ${adv.tip || ''}
                </div>
            </div>
        </div>`;

        html += `<button class="proto-btn proto-btn-primary" style="margin-top:8px;" onclick="navigateTo('college-recommend')"><i class="fas fa-university"></i> 查看推荐院校</button>`;

        setHTMLWithScripts(container, html);
    }

    return Page({
        title: '位次分析',
        back: true,
        content: '<div id="college-rank-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});
