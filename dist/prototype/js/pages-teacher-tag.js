// ============================================================
// AI 标知识点模块 - 独立原型文件
// 版本: 20260820A
// 来源: 重写 prototype/js/pages-teacher.js 第1198-1258行(原模块所有按钮仅静态 openModal,无真实交互)
// 说明: 实现采纳/忽略/添加/移除/上一题/下一题/重新推荐/全部确认/AI重新分析/批量标注的真实交互
// 依赖: api.js / design-system.js (openModal, closeModal, showToast, teacherCard, teacherLoading, AdminPage, TEACHER_MENU, registerPage)
// 用法: 在原型 index.html 中通过 <script src="js/pages-teacher-tag.js?v=20260820A"></script> 加载即可生效
// ============================================================

// ---- 依赖保护 ----
(function () {
    if (typeof registerPage !== 'function') {
        window.PAGES = window.PAGES || {};
        window.registerPage = function (key, title, group, icon, render) {
            window.PAGES[key] = { key: key, title: title, group: group, render: render };
        };
    }
    if (typeof openModal !== 'function') {
        window.openModal = function (title, html) {
            closeModal && closeModal();
            var o = document.createElement('div');
            o.id = 'proto-modal-overlay';
            o.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
            var m = document.createElement('div');
            m.style.cssText = 'background:white;border-radius:16px;width:100%;max-width:340px;max-height:80vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.3);';
            m.innerHTML = '<div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #E5E7EB;"><div style="font-size:16px;font-weight:700;">' + title + '</div><i class="fas fa-times" onclick="closeModal()" style="color:#9CA3AF;cursor:pointer;font-size:18px;"></i></div><div style="padding:20px;overflow-y:auto;font-size:14px;color:#374151;line-height:1.7;">' + html + '</div>';
            o.appendChild(m);
            o.addEventListener('click', function (e) { if (e.target === o) closeModal && closeModal(); });
            document.body.appendChild(o);
        };
    }
    if (typeof closeModal !== 'function') {
        window.closeModal = function () { var o = document.getElementById('proto-modal-overlay'); if (o) o.remove(); };
    }
    if (typeof showToast !== 'function') {
        window.showToast = function (msg) {
            var t = document.createElement('div');
            t.style.cssText = 'position:fixed;left:50%;top:60px;transform:translateX(-50%);background:rgba(31,41,55,0.95);color:white;padding:8px 16px;border-radius:8px;font-size:13px;z-index:10000;max-width:80%;text-align:center;';
            t.textContent = msg;
            document.body.appendChild(t);
            setTimeout(function () { t.remove(); }, 2000);
        };
    }
    if (typeof teacherCard !== 'function') {
        window.teacherCard = function (title, right, content) {
            return '<div style="background:white;border-radius:12px;padding:18px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">'
                + (title ? '<div style="font-size:15px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;"><span>' + title + '</span>' + (right || '') + '</div>' : '')
                + content + '</div>';
        };
    }
    if (typeof teacherLoading !== 'function') {
        window.teacherLoading = function (key) {
            return '<div id="' + key + '-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>';
        };
    }
    if (typeof AdminPage !== 'function') {
        window.AdminPage = function (title, menu, activeKey, content) {
            return '<div style="padding:16px;">' + content + '</div>';
        };
    }
    if (typeof TEACHER_MENU === 'undefined') {
        window.TEACHER_MENU = [
            { key: 'dashboard', icon: 'fa-home', label: '教学首页', page: 'teacher-dashboard' },
            { key: 'upload', icon: 'fa-upload', label: '上传试卷', page: 'teacher-upload' },
            { key: 'split', icon: 'fa-cut', label: 'AI切题', page: 'teacher-split' },
            { key: 'parse', icon: 'fa-magic', label: 'AI解析', page: 'teacher-parse' },
            { key: 'tag', icon: 'fa-tag', label: 'AI标知识点', page: 'teacher-tag' },
            { key: 'exercise', icon: 'fa-chalkboard', label: 'AI课堂练习', page: 'teacher-exercise' },
            { key: 'paper', icon: 'fa-file-alt', label: 'AI组卷', page: 'teacher-paper' }
        ];
    }
})();

// ============================================================
// 5. AI标知识点（真实交互版）
// ============================================================
// 状态:题目列表 / 当前题号索引 / 每题的已确认知识点集合 / 已忽略知识点集合
var teacherTagState = {
    questions: [],   // 题目数组(来自后端 teacher-tag.json,首项为初始题;若为多题题库则支持上/下题切换)
    currentIndex: 0, // 当前题目索引
    // 每题的知识点状态(运行时维护): { 0: { confirmed:[...], ignored:[...] }, 1: {...} }
    perQuestion: {},
    paperName: ''
};

// 根据后端原始数据初始化 state(perQuestion 用 confirmed 数组初始化,ignored 初始为空)
function teacherTagInitState(data) {
    var state = teacherTagState;
    // 多题题库支持:若 data.questions 为数组则用之,否则把 data.question 包成单题数组
    if (Array.isArray(data.questions) && data.questions.length > 0) {
        state.questions = data.questions.map(function (q, i) {
            return {
                subject: q.subject || '数学',
                topic: q.topic || '综合',
                no: q.no || (i + 1),
                difficulty: q.difficulty || '★★★☆☆',
                score: q.score || 5,
                content: q.content || '（题目内容加载中）'
            };
        });
    } else {
        var q = data.question || {};
        state.questions = [{
            subject: q.subject || '数学',
            topic: q.topic || '综合',
            no: q.no || 1,
            difficulty: q.difficulty || '★★★☆☆',
            score: q.score || 5,
            content: q.content || '（题目内容加载中）'
        }];
    }
    state.currentIndex = 0;
    state.paperName = data.paperName || '未命名试卷';
    state.perQuestion = {};
    // 用每题自带的 confirmed 初始化(若有)
    var qs = Array.isArray(data.questions) ? data.questions : [data.question];
    qs.forEach(function (qq, i) {
        var confirmed = (qq && qq.confirmed) ? qq.confirmed.slice() : (i === 0 && data.confirmed ? data.confirmed.slice() : []);
        var ignored = (qq && qq.ignored) ? qq.ignored.slice() : [];
        var recommended = (qq && qq.recommended) ? qq.recommended.slice() : (i === 0 && data.recommended ? data.recommended.slice() : []);
        state.perQuestion[i] = { confirmed: confirmed, ignored: ignored, recommended: recommended };
    });
}

// 获取当前题目对象
function teacherTagCurrentQ() {
    var state = teacherTagState;
    return state.questions[state.currentIndex] || state.questions[0];
}

// 获取当前题目的状态(已确认/已忽略/推荐)
function teacherTagCurrentState() {
    var state = teacherTagState;
    var idx = state.currentIndex;
    if (!state.perQuestion[idx]) {
        state.perQuestion[idx] = { confirmed: [], ignored: [], recommended: [] };
    }
    return state.perQuestion[idx];
}

// 渲染整个 AI标知识点页面
function teacherTagRenderPage(container) {
    var state = teacherTagState;
    var q = teacherTagCurrentQ();
    var qs = teacherTagCurrentState();
    var recommended = qs.recommended || [];
    var confirmed = qs.confirmed || [];
    var ignored = qs.ignored || [];

    // 计算统计:总题数 / 已标注题数(至少有1个确认知识点视为已标注)
    var totalQ = state.questions.length;
    var taggedCount = 0;
    for (var i = 0; i < totalQ; i++) {
        var st = state.perQuestion[i] || { confirmed: [] };
        if (st.confirmed && st.confirmed.length > 0) taggedCount++;
    }

    // 推荐列表(排除已忽略的)
    var recommendedHtml = recommended.filter(function (r) {
        return ignored.indexOf(r.name) < 0;
    }).map(function (r) {
        var inConfirmed = confirmed.indexOf(r.name) >= 0;
        return '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:' + (inConfirmed ? '#F0FDF4' : '#F9FAFB') + ';border-radius:10px;border:1px solid ' + (inConfirmed ? '#BBF7D0' : '#F3F4F6') + ';">'
            + '<div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#8B5CF6,#6D28D9);display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
            + '<i class="fas fa-tag" style="color:white;font-size:14px;"></i></div>'
            + '<div style="flex:1;">'
            + '<div style="font-size:14px;font-weight:600;">' + r.name + (inConfirmed ? ' <i class="fas fa-check" style="color:#10B981;font-size:11px;"></i>' : '') + '</div>'
            + '<div style="font-size:11px;color:#9CA3AF;margin-top:2px;">AI匹配置信度</div></div>'
            + '<div style="text-align:center;width:60px;">'
            + '<div style="font-size:16px;font-weight:700;color:' + (r.confidence >= 90 ? '#10B981' : r.confidence >= 80 ? '#F59E0B' : '#9CA3AF') + ';">' + r.confidence + '%</div>'
            + '<div style="height:4px;background:#E5E7EB;border-radius:2px;margin-top:4px;overflow:hidden;"><div style="height:100%;width:' + r.confidence + '%;background:' + (r.confidence >= 90 ? '#10B981' : '#F59E0B') + ';"></div></div>'
            + '</div>'
            + '<div style="display:flex;gap:6px;">'
            + (inConfirmed
                ? '<button style="width:32px;height:32px;background:#9CA3AF;color:white;border:none;border-radius:8px;cursor:pointer;font-size:12px;" title="已采纳" disabled><i class="fas fa-check"></i></button>'
                : '<button style="width:32px;height:32px;background:#10B981;color:white;border:none;border-radius:8px;cursor:pointer;font-size:12px;" title="采纳" onclick="teacherTagAccept(\'' + teacherTagEsc(r.name) + '\', ' + r.confidence + ')"><i class="fas fa-check"></i></button>')
            + '<button style="width:32px;height:32px;background:#EF4444;color:white;border:none;border-radius:8px;cursor:pointer;font-size:12px;" title="忽略" onclick="teacherTagIgnore(\'' + teacherTagEsc(r.name) + '\')"><i class="fas fa-times"></i></button>'
            + '</div></div>';
    }).join('');

    if (!recommendedHtml) {
        recommendedHtml = '<div style="text-align:center;padding:24px;color:#9CA3AF;"><i class="fas fa-info-circle" style="font-size:20px;margin-bottom:8px;"></i><div style="font-size:13px;">当前题目暂无可推荐知识点</div><div style="margin-top:8px;"><button class="proto-btn proto-btn-outline" style="width:auto;padding:0 16px;height:34px;border-radius:8px;font-size:12px;" onclick="teacherTagReRecommend()"><i class="fas fa-redo"></i> AI 重新推荐</button></div></div>';
    }

    // 已确认知识点
    var confirmedHtml = confirmed.map(function (c) {
        return '<span style="display:inline-flex;align-items:center;gap:6px;background:#D1FAE5;color:#065F46;padding:6px 12px;border-radius:16px;font-size:13px;font-weight:600;">'
            + teacherTagUnEsc(c) + ' <i class="fas fa-times-circle" style="cursor:pointer;" onclick="teacherTagRemoveConfirmed(\'' + teacherTagEsc(c) + '\')"></i></span>';
    }).join('');

    // 已忽略知识点(浅灰展示,可恢复)
    var ignoredHtml = ignored.map(function (ig) {
        return '<span style="display:inline-flex;align-items:center;gap:6px;background:#F3F4F6;color:#9CA3AF;padding:6px 12px;border-radius:16px;font-size:12px;text-decoration:line-through;">'
            + teacherTagUnEsc(ig) + ' <i class="fas fa-undo" style="cursor:pointer;color:#3B82F6;" title="恢复推荐" onclick="teacherTagRestore(\'' + teacherTagEsc(ig) + '\')"></i></span>';
    }).join('');

    container.innerHTML = ''
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
        + '<div id="teacher-tag-head" style="font-size:13px;color:#6B7280;">' + state.paperName + ' · 第 ' + (state.currentIndex + 1) + ' / ' + totalQ + ' 题 · 已标注 ' + taggedCount + ' 题</div>'
        + '<div style="display:flex;gap:8px;">'
        + '<button class="proto-btn proto-btn-outline" style="width:auto;padding:0 14px;height:34px;border-radius:8px;font-size:12px;" onclick="teacherTagReRecommend()"><i class="fas fa-redo"></i> AI 重新推荐</button>'
        + '<button class="proto-btn proto-btn-primary" style="width:auto;padding:0 14px;height:34px;border-radius:8px;font-size:12px;background:#8B5CF6;" onclick="teacherTagBatchTag()"><i class="fas fa-magic"></i> 批量标注</button>'
        + '</div></div>'
        // 题目内容
        + '<div style="background:#1E293B;border-radius:12px;padding:16px;color:white;margin-bottom:16px;">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'
        + '<span style="font-size:12px;background:rgba(255,255,255,0.15);padding:3px 10px;border-radius:6px;"><i class="fas fa-book"></i> ' + q.subject + ' · ' + q.topic + ' · 第' + q.no + '题</span>'
        + '<span style="font-size:12px;opacity:0.7;">难度 ' + q.difficulty + ' · ' + q.score + '分</span>'
        + '</div>'
        + '<div style="font-size:14px;line-height:1.7;">' + q.content + '</div>'
        + '</div>'
        // AI推荐知识点
        + teacherCard('AI推荐知识点', '<span style="font-size:12px;color:#8B5CF6;font-weight:600;"><i class="fas fa-robot"></i> 置信度排序</span>', '<div id="teacher-tag-recommended" style="display:flex;flex-direction:column;gap:10px;">' + recommendedHtml + '</div>')
        // 已确认知识点
        + teacherCard('已确认知识点', '<span id="teacher-tag-confirmed-count" style="font-size:12px;color:#10B981;font-weight:600;">已选 ' + confirmed.length + ' 个</span>', ''
            + '<div id="teacher-tag-confirmed" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:' + (ignored.length > 0 ? '14px' : '0') + ';">' + (confirmedHtml || '<span style="color:#9CA3AF;font-size:13px;">暂无已确认知识点,点击推荐列表的"采纳"按钮添加</span>') + '</div>'
            + (ignored.length > 0 ? '<div style="margin-top:8px;border-top:1px dashed #E5E7EB;padding-top:10px;"><div style="font-size:11px;color:#9CA3AF;margin-bottom:6px;">已忽略(' + ignored.length + '):</div><div id="teacher-tag-ignored" style="display:flex;gap:6px;flex-wrap:wrap;">' + ignoredHtml + '</div></div>' : '')
            + '<div style="display:flex;gap:8px;margin-top:14px;">'
            + '<input id="teacher-tag-input" class="proto-input" placeholder="输入自定义知识点名称" style="flex:1;">'
            + '<button class="proto-btn proto-btn-primary" style="width:auto;padding:0 18px;height:42px;border-radius:8px;" onclick="teacherTagAddCustom()"><i class="fas fa-plus"></i> 添加</button>'
            + '</div>')
        // 操作按钮
        + '<div style="display:flex;gap:10px;">'
        + '<button class="proto-btn proto-btn-outline" style="height:44px;border-radius:8px;" onclick="teacherTagPrev()"><i class="fas fa-step-backward"></i> 上一题</button>'
        + '<button class="proto-btn proto-btn-primary" style="height:44px;border-radius:8px;flex:1;" onclick="teacherTagNext()"><i class="fas fa-check"></i> 确认并进入下一题</button>'
        + '</div>';
}

// HTML转义辅助(知识点名称可能含特殊字符)
function teacherTagEsc(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}
function teacherTagUnEsc(s) {
    return String(s);
}

// 采纳推荐知识点 -> 加入已确认列表 + 更新UI
function teacherTagAccept(name, confidence) {
    var qs = teacherTagCurrentState();
    if (qs.confirmed.indexOf(name) >= 0) {
        showToast('「' + name + '」已在已确认列表中');
        return;
    }
    qs.confirmed.push(name);
    // 从已忽略中移除(如果之前被忽略过)
    var igIdx = qs.ignored.indexOf(name);
    if (igIdx >= 0) qs.ignored.splice(igIdx, 1);
    showToast('已采纳知识点:「' + name + '」(置信度 ' + confidence + '%)');
    teacherTagReRender();
    teacherTagSaveState();
}

// 忽略推荐知识点 -> 加入已忽略列表 + 从推荐中隐藏 + 更新UI
function teacherTagIgnore(name) {
    var qs = teacherTagCurrentState();
    if (qs.ignored.indexOf(name) >= 0) {
        showToast('「' + name + '」已在已忽略列表中');
        return;
    }
    qs.ignored.push(name);
    // 从已确认中移除(如果之前已采纳过)
    var cfIdx = qs.confirmed.indexOf(name);
    if (cfIdx >= 0) qs.confirmed.splice(cfIdx, 1);
    showToast('已忽略知识点:「' + name + '」');
    teacherTagReRender();
    teacherTagSaveState();
}

// 移除已确认知识点(点 x)
function teacherTagRemoveConfirmed(name) {
    var qs = teacherTagCurrentState();
    var idx = qs.confirmed.indexOf(name);
    if (idx >= 0) {
        qs.confirmed.splice(idx, 1);
        showToast('已移除知识点:「' + name + '」');
        teacherTagReRender();
        teacherTagSaveState();
    }
}

// 恢复被忽略的知识点(回到推荐列表)
function teacherTagRestore(name) {
    var qs = teacherTagCurrentState();
    var idx = qs.ignored.indexOf(name);
    if (idx >= 0) {
        qs.ignored.splice(idx, 1);
        showToast('已恢复推荐:「' + name + '」');
        teacherTagReRender();
        teacherTagSaveState();
    }
}

// 添加自定义知识点(从输入框)
function teacherTagAddCustom() {
    var inp = document.getElementById('teacher-tag-input');
    if (!inp) return;
    var v = (inp.value || '').trim();
    if (!v) {
        openModal('添加知识点', '<div style="padding:14px;font-size:13px;color:#374151;"><i class="fas fa-exclamation-circle" style="color:#F59E0B;font-size:24px;"></i><div style="margin-top:8px;">请输入知识点名称后再添加。</div></div>');
        return;
    }
    var qs = teacherTagCurrentState();
    if (qs.confirmed.indexOf(v) >= 0) {
        showToast('「' + v + '」已存在,无需重复添加');
        return;
    }
    qs.confirmed.push(v);
    inp.value = '';
    showToast('已添加自定义知识点:「' + v + '」');
    teacherTagReRender();
    teacherTagSaveState();
}

// 上一题
function teacherTagPrev() {
    var state = teacherTagState;
    if (state.currentIndex <= 0) {
        showToast('已是第一题');
        return;
    }
    state.currentIndex--;
    teacherTagReRender();
    showToast('已切换到上一题(第 ' + (state.currentIndex + 1) + ' 题)');
}

// 下一题(若已是最后一题则提示完成)
function teacherTagNext() {
    var state = teacherTagState;
    var qs = teacherTagCurrentState();
    // 保存当前题状态(已在 adopt/remove 中实时保存,此处补充一次)
    teacherTagSaveState();
    if (state.currentIndex >= state.questions.length - 1) {
        // 最后一题,弹出完成汇总
        var totalQ = state.questions.length;
        var taggedCount = 0;
        var totalTags = 0;
        for (var i = 0; i < totalQ; i++) {
            var st = state.perQuestion[i] || { confirmed: [] };
            if (st.confirmed && st.confirmed.length > 0) { taggedCount++; totalTags += st.confirmed.length; }
        }
        openModal('标注完成', ''
            + '<div style="padding:18px;font-size:13px;line-height:1.8;color:#374151;">'
            + '<div style="text-align:center;padding:16px;background:#F0FDF4;border-radius:8px;margin-bottom:12px;">'
            + '<i class="fas fa-check-circle" style="font-size:32px;color:#10B981;"></i>'
            + '<div style="margin-top:8px;font-weight:600;color:#10B981;">全部题目标注完成</div></div>'
            + '<b>标注汇总:</b><br>'
            + '· 题目总数:' + totalQ + ' 题<br>'
            + '· 已标注题数:' + taggedCount + ' 题<br>'
            + '· 累计知识点:' + totalTags + ' 个<br>'
            + '· 当前题确认:' + (qs.confirmed.length) + ' 个知识点<br><br>'
            + '<span style="color:#6B7280;">已保存到题库,可进入「AI课堂练习」生成练习题。</span>'
            + '</div>');
        return;
    }
    state.currentIndex++;
    teacherTagReRender();
    showToast('已确认并切换到下一题(第 ' + (state.currentIndex + 1) + ' 题)');
}

// AI 重新推荐(带进度推进,完成后生成新推荐列表)
function teacherTagReRecommend() {
    openModal('AI 重新推荐知识点', ''
        + '<div style="padding:18px;font-size:13px;line-height:1.9;color:#374151;">'
        + '<div style="text-align:center;padding:8px 0 14px;">'
        + '<i class="fas fa-spinner fa-spin" style="font-size:28px;color:#8B5CF6;"></i>'
        + '<div style="margin-top:10px;font-weight:600;color:#1F2937;">AI 正在重新分析题目...</div></div>'
        + '<div id="tag-recommend-log" style="background:#F3F4F6;border-radius:8px;padding:10px 12px;font-size:12px;color:#6B7280;min-height:60px;">'
        + '<div>· 启动 GPT-4 教学版模型</div></div></div>');
    var logEl = document.getElementById('tag-recommend-log');
    var appendLog = function (msg) {
        if (!logEl) return;
        var div = document.createElement('div');
        div.textContent = '· ' + msg;
        logEl.appendChild(div);
    };
    var steps = ['解析题干关键词', '检索知识点图谱', '匹配相关知识点', '计算匹配置信度'];
    var idx = 0;
    var progress = 0;
    var timer = setInterval(function () {
        progress += 22 + Math.random() * 10;
        if (progress >= 100) {
            progress = 100;
            clearInterval(timer);
            appendLog('生成完成,共 4 个推荐知识点');
            // 重新生成推荐列表(基于题目 topic 生成相关知识点)
            var q = teacherTagCurrentQ();
            var topicPool = {
                '导数': ['导数的极值', '利用导数研究函数', '分类讨论思想', '函数的单调性', '导数的几何意义', '函数的零点'],
                '函数': ['函数的定义域', '函数的值域', '奇偶性', '单调性', '反函数'],
                '数列': ['等差数列', '等比数列', '通项公式', '前n项和', '递推关系'],
                '三角函数': ['同角三角函数', '诱导公式', '图像与性质', '恒等变换', '解三角形'],
                '解析几何': ['直线方程', '圆的方程', '椭圆', '双曲线', '抛物线'],
                '立体几何': ['空间点线面', '空间向量', '二面角', '体积与表面积', '线面位置关系'],
                '概率统计': ['古典概型', '条件概率', '随机变量', '期望与方差', '回归分析']
            };
            var pool = topicPool[q.topic] || ['基础知识', '综合应用', '解题方法', '易错点'];
            // 随机选4个,加 v2 标记
            var picked = [];
            var used = {};
            while (picked.length < 4 && pool.length > 0) {
                var r = pool[Math.floor(Math.random() * pool.length)];
                if (!used[r]) {
                    used[r] = true;
                    picked.push({ name: r + '(v2)', confidence: 80 + Math.floor(Math.random() * 18) });
                }
            }
            teacherTagCurrentState().recommended = picked;
            teacherTagCurrentState().ignored = []; // 清空已忽略,让新推荐重新展示
            setTimeout(function () {
                closeModal();
                showToast('AI 已重新推荐 ' + picked.length + ' 个知识点');
                teacherTagReRender();
                teacherTagSaveState();
            }, 600);
            return;
        }
        var expected = Math.min(Math.floor(progress / 25), steps.length - 1);
        if (expected > idx) {
            idx = expected;
            appendLog(steps[idx] + '... ' + Math.round(progress) + '%');
        }
    }, 450);
}

// 批量标注(为所有未标注的题目自动添加 top1 推荐知识点)
function teacherTagBatchTag() {
    var state = teacherTagState;
    var untagged = [];
    for (var i = 0; i < state.questions.length; i++) {
        var st = state.perQuestion[i] || (state.perQuestion[i] = { confirmed: [], ignored: [], recommended: [] });
        if (!st.confirmed || st.confirmed.length === 0) untagged.push(i);
    }
    if (untagged.length === 0) {
        openModal('批量标注', '<div style="padding:18px;font-size:13px;color:#374151;text-align:center;"><i class="fas fa-check-circle" style="font-size:32px;color:#10B981;"></i><div style="margin-top:8px;">所有题目均已标注,无需批量操作</div></div>');
        return;
    }
    openModal('AI 批量标注', ''
        + '<div style="padding:18px;font-size:13px;line-height:1.9;color:#374151;">'
        + '<div style="text-align:center;padding:8px 0 14px;">'
        + '<i class="fas fa-spinner fa-spin" style="font-size:28px;color:#8B5CF6;"></i>'
        + '<div style="margin-top:10px;font-weight:600;color:#1F2937;">AI 正在批量标注 ' + untagged.length + ' 道题...</div></div>'
        + '<div id="tag-batch-log" style="background:#F3F4F6;border-radius:8px;padding:10px 12px;font-size:12px;color:#6B7280;min-height:80px;">'
        + '<div>· 共 ' + untagged.length + ' 道题待标注</div></div></div>');
    var logEl = document.getElementById('tag-batch-log');
    var appendLog = function (msg) {
        if (!logEl) return;
        var div = document.createElement('div');
        div.textContent = '· ' + msg;
        logEl.appendChild(div);
    };
    var i = 0;
    var timer = setInterval(function () {
        if (i >= untagged.length) {
            clearInterval(timer);
            appendLog('全部完成,共标注 ' + untagged.length + ' 题');
            setTimeout(function () {
                closeModal();
                showToast('已批量标注 ' + untagged.length + ' 题,每题添加1个知识点');
                teacherTagReRender();
                teacherTagSaveState();
            }, 600);
            return;
        }
        var qIdx = untagged[i];
        var st = state.perQuestion[qIdx];
        // 取推荐的第一个(若有),否则用题目的 topic 作为知识点
        var ptName = (st.recommended && st.recommended[0]) ? st.recommended[0].name : (state.questions[qIdx].topic + '综合');
        st.confirmed.push(ptName);
        appendLog('第 ' + (qIdx + 1) + ' 题: 添加知识点「' + ptName + '」');
        i++;
    }, 400);
}

// 重新渲染页面(只更新内容容器,不重新执行 AdminPage 外壳)
function teacherTagReRender() {
    var container = document.getElementById('teacher-tag-content');
    if (container) teacherTagRenderPage(container);
}

// 保存当前状态到后端(通过 api.savePageData 持久化)
function teacherTagSaveState() {
    if (typeof api === 'undefined' || !api.savePageData) return;
    var state = teacherTagState;
    var q = teacherTagCurrentQ();
    var qs = teacherTagCurrentState();
    var payload = {
        paperName: state.paperName,
        question: {
            subject: q.subject, topic: q.topic, no: q.no,
            difficulty: q.difficulty, score: q.score, content: q.content
        },
        recommended: qs.recommended || [],
        confirmed: qs.confirmed || [],
        ignored: qs.ignored || [],
        // 多题题库快照(供下次加载恢复)
        questions: state.questions.map(function (qq, i) {
            var st = state.perQuestion[i] || { confirmed: [], ignored: [], recommended: [] };
            return {
                subject: qq.subject, topic: qq.topic, no: qq.no,
                difficulty: qq.difficulty, score: qq.score, content: qq.content,
                confirmed: st.confirmed, ignored: st.ignored, recommended: st.recommended
            };
        })
    };
    api.savePageData('teacher-tag', payload).then(function () {
        // 静默保存成功
    }).catch(function () {
        // 保存失败也不阻断 UI
    });
}

// 页面注册
registerPage('teacher-tag', 'AI标知识点', '教师后台', '', function () {
    // 复用 teacherLoadData(若宿主提供),否则直接 fetch API
    if (typeof teacherLoadData === 'function') {
        teacherLoadData('teacher-tag', function (container, data) {
            teacherTagInitState(data);
            teacherTagRenderPage(container);
        });
    } else {
        var container = document.getElementById('teacher-tag-content');
        if (!container) {
            // fallback:用 device-screen 内新建容器
            var screen = document.getElementById('device-screen');
            if (screen) {
                screen.innerHTML = '<div id="teacher-tag-content"></div>';
                container = document.getElementById('teacher-tag-content');
            }
        }
        if (container) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div>';
            if (typeof api !== 'undefined' && api.getPageData) {
                api.getPageData('teacher-tag').then(function (data) {
                    teacherTagInitState(data || {});
                    teacherTagRenderPage(container);
                }).catch(function () {
                    teacherTagInitState({});
                    teacherTagRenderPage(container);
                });
            } else {
                teacherTagInitState({});
                teacherTagRenderPage(container);
            }
        }
    }
    return AdminPage('AI标知识点', TEACHER_MENU, 'tag', teacherLoading('teacher-tag'));
});

// 暴露到 window,确保 onclick 内联属性可访问
window.teacherTagState = teacherTagState;
window.teacherTagInitState = teacherTagInitState;
window.teacherTagCurrentQ = teacherTagCurrentQ;
window.teacherTagCurrentState = teacherTagCurrentState;
window.teacherTagRenderPage = teacherTagRenderPage;
window.teacherTagEsc = teacherTagEsc;
window.teacherTagUnEsc = teacherTagUnEsc;
window.teacherTagAccept = teacherTagAccept;
window.teacherTagIgnore = teacherTagIgnore;
window.teacherTagRemoveConfirmed = teacherTagRemoveConfirmed;
window.teacherTagRestore = teacherTagRestore;
window.teacherTagAddCustom = teacherTagAddCustom;
window.teacherTagPrev = teacherTagPrev;
window.teacherTagNext = teacherTagNext;
window.teacherTagReRecommend = teacherTagReRecommend;
window.teacherTagBatchTag = teacherTagBatchTag;
window.teacherTagReRender = teacherTagReRender;
window.teacherTagSaveState = teacherTagSaveState;

console.log('[pages-teacher-tag] AI标知识点模块已加载 v20260820A');
