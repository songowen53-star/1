// ============================================================
// AI 解析模块 - 独立原型文件
// 版本: 20260819A
// 来源: prototype/js/pages-teacher.js (第 706-1193 行)
// 说明: 修复各子项按钮点击无反应问题,与 AI切题数据同步
// 依赖: api.js (api.getPageData) / design-system.js (openModal, closeModal, showToast, teacherCard, teacherLoading, AdminPage, TEACHER_MENU, registerPage)
// 用法: 在原型 index.html 中通过 <script> 加载即可生效
// ============================================================

// ---- 依赖保护:若宿主未提供依赖,则用本地占位实现 ----
(function () {
    if (typeof registerPage !== 'function') {
        console.warn('[pages-teacher-parse] 宿主未提供 registerPage,使用本地占位');
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
        window.closeModal = function () {
            var o = document.getElementById('proto-modal-overlay');
            if (o) o.remove();
        };
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
                + content
                + '</div>';
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
// 4. AI解析（与 AI切题数据同步,各按钮真实交互）
// ============================================================
// 状态:每题是否已解析 / 当前选中的题目 / 每题的 AI 解析详情
var teacherParseState = { parsedMap: {}, activeNo: 1, details: {} };

// 根据题型/难度生成 AI 解析内容(题干/答案/解析步骤/考点)
function teacherGenParseDetail(q) {
    var typeMap = {
        '选择题': {
            content: '设函数 f(x) = x³ - 3x + 1,则 f(x) 在区间 [-2, 2] 上的最大值为(  )',
            answer: '答案:C  3',
            analysis: [
                { step: '第一步：', text: '求导 f\'(x) = 3x² - 3,令 f\'(x)=0 得 x=±1。' },
                { step: '第二步：', text: '计算端点及驻点:f(-2)= -1,f(-1)=3,f(1)=-1,f(2)=3。' },
                { step: '第三步：', text: '比较得最大值 f(-1)=f(2)=3,故选 C。' }
            ],
            points: ['导数应用', '函数最值', '闭区间上连续函数']
        },
        '填空题': {
            content: '已知等差数列 {aₙ} 中,a₁=2,a₃=6,则 a₅ = _________。',
            answer: '答案:10',
            analysis: [
                { step: '第一步：', text: '由 a₃=a₁+2d 得 6=2+2d,解得 d=2。' },
                { step: '第二步：', text: 'a₅=a₁+4d=2+4×2=10。' }
            ],
            points: ['等差数列', '通项公式', '基本运算']
        },
        '解答题': {
            content: '设函数 f(x) = ln x - ax + 1,其中 a ∈ R。<br>(1) 讨论 f(x) 的单调性;<br>(2) 若 f(x) ≤ 0 恒成立,求 a 的取值范围。',
            answer: '答案:(1) 当 a≤0 时 f(x) 在 (0,+∞) 单调递增;当 a>0 时 在 (0,1/a) 单调递增,在 (1/a,+∞) 单调递减。(2) a ≥ 1。',
            analysis: [
                { step: '第一步：', text: '求导 f\'(x) = 1/x - a (x>0)。' },
                { step: '第二步：', text: '分 a≤0 与 a>0 讨论单调性。' },
                { step: '第三步：', text: '由 f(x)≤0 恒成立,需 f(1)=1-a≤0 且最大值 ≤0,得 a≥1。' }
            ],
            points: ['导数与单调性', '恒成立问题', '分类讨论']
        }
    };
    var tpl = typeMap[q.type] || typeMap['选择题'];
    var diffStars = q.diff === '简单' ? '★★☆☆☆' : q.diff === '中等' ? '★★★☆☆' : '★★★★★';
    return {
        no: q.no,
        type: q.type,
        score: q.score,
        difficulty: diffStars,
        content: tpl.content,
        answer: tpl.answer,
        analysis: tpl.analysis,
        points: tpl.points
    };
}

// 切换右侧详情区显示指定题目的解析
function teacherParseSwitch(no) {
    var state = teacherParseState;
    state.activeNo = no;
    var detail = state.details[no];
    if (!detail) return;

    // 更新左侧题目列表 active 高亮
    var listEl = document.getElementById('teacher-parse-list');
    if (listEl) {
        var items = listEl.querySelectorAll('[data-no]');
        items.forEach(function (it) {
            var n = parseInt(it.getAttribute('data-no'));
            if (n === no) {
                it.style.background = '#EFF6FF';
                it.style.border = '1px solid #3B82F6';
            } else {
                it.style.background = '#F9FAFB';
                it.style.border = '1px solid transparent';
            }
        });
    }

    // 更新右侧详情区
    var detailEl = document.getElementById('teacher-parse-detail');
    if (!detailEl) return;
    var analysisHtml = (detail.analysis || []).map(function (a) {
        return '<div style="margin-bottom:8px;"><b>' + a.step + '</b>' + a.text + '</div>';
    }).join('');
    var pointsHtml = (detail.points || []).map(function (p) {
        return '<span style="background:#EDE9FE;color:#5B21B6;padding:4px 10px;border-radius:14px;font-size:12px;">' + p + '</span>';
    }).join('');
    var isDone = !!state.parsedMap[no];

    detailEl.innerHTML = ''
        + '<div style="background:#1E293B;border-radius:8px;padding:14px;color:white;margin-bottom:14px;">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">'
        + '<span style="font-size:11px;background:rgba(255,255,255,0.15);padding:2px 8px;border-radius:4px;">第' + detail.no + '题 · ' + detail.type + ' · ' + detail.score + '分</span>'
        + '<span style="font-size:11px;opacity:0.7;">难度 ' + detail.difficulty + '</span>'
        + '</div>'
        + '<div style="font-size:13px;line-height:1.6;">' + detail.content + '</div>'
        + '</div>'
        + '<div style="margin-bottom:14px;">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">'
        + '<span style="font-size:13px;font-weight:700;color:#10B981;"><i class="fas fa-check-circle"></i> 参考答案</span>'
        + '<i class="fas fa-edit" style="color:#8B5CF6;cursor:pointer;font-size:12px;" onclick="teacherParseModify(' + detail.no + ')"></i>'
        + '</div>'
        + '<div style="padding:10px 12px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;font-size:13px;">' + detail.answer + '</div>'
        + '</div>'
        + '<div style="margin-bottom:14px;">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">'
        + '<span style="font-size:13px;font-weight:700;color:#3B82F6;"><i class="fas fa-lightbulb"></i> 解析过程</span>'
        + '<i class="fas fa-edit" style="color:#8B5CF6;cursor:pointer;font-size:12px;" onclick="teacherParseModify(' + detail.no + ')"></i>'
        + '</div>'
        + '<div style="padding:12px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;font-size:13px;line-height:1.8;color:#1E40AF;">' + analysisHtml + '</div>'
        + '</div>'
        + '<div style="margin-bottom:14px;">'
        + '<div style="font-size:13px;font-weight:700;color:#8B5CF6;margin-bottom:6px;"><i class="fas fa-tag"></i> 考点</div>'
        + '<div style="display:flex;gap:6px;flex-wrap:wrap;">' + pointsHtml + '</div>'
        + '</div>'
        + '<div style="display:flex;gap:8px;">'
        + '<button style="flex:1;padding:8px;background:' + (isDone ? '#9CA3AF' : '#10B981') + ';color:white;border:none;border-radius:8px;font-size:13px;cursor:pointer;" onclick="teacherParseConfirm(' + detail.no + ')"><i class="fas fa-check"></i> ' + (isDone ? '已确认' : '确认解析') + '</button>'
        + '<button style="flex:1;padding:8px;background:#F59E0B;color:white;border:none;border-radius:8px;font-size:13px;cursor:pointer;" onclick="teacherParseModify(' + detail.no + ')"><i class="fas fa-edit"></i> 修改</button>'
        + '<button style="flex:1;padding:8px;background:#EF4444;color:white;border:none;border-radius:8px;font-size:13px;cursor:pointer;" onclick="teacherParseRegen(' + detail.no + ')"><i class="fas fa-redo"></i> 重新生成</button>'
        + '</div>';
}

// 确认单题解析(标记为已解析,更新左侧列表)
function teacherParseConfirm(no) {
    var state = teacherParseState;
    if (state.parsedMap[no]) {
        showToast('第 ' + no + ' 题已确认过');
        return;
    }
    state.parsedMap[no] = true;
    showToast('第 ' + no + ' 题解析已确认,已保存至题库');

    // 更新左侧列表该题的状态徽章
    var item = document.querySelector('#teacher-parse-list [data-no="' + no + '"]');
    if (item) {
        var badge = item.querySelector('.parse-badge');
        if (badge) {
            badge.style.background = '#D1FAE5';
            badge.style.color = '#065F46';
            badge.textContent = '已解析';
        }
        var dot = item.querySelector('.parse-dot');
        if (dot) {
            dot.style.background = '#10B981';
            dot.innerHTML = '<i class="fas fa-check"></i>';
        }
    }
    // 更新顶部统计
    teacherParseUpdateCount();
    // 重新渲染右侧按钮状态
    teacherParseSwitch(no);
}

// 修改解析(打开编辑弹窗,带可编辑文本框)
function teacherParseModify(no) {
    var detail = teacherParseState.details[no];
    if (!detail) return;
    openModal('修改第 ' + no + ' 题解析', ''
        + '<div style="padding:14px;font-size:13px;color:#374151;line-height:1.7;">'
        + '<div style="margin-bottom:10px;"><b>参考答案:</b></div>'
        + '<textarea id="parse-edit-answer" style="width:100%;min-height:60px;padding:8px;border:1px solid #E5E7EB;border-radius:6px;font-size:13px;box-sizing:border-box;">' + detail.answer + '</textarea>'
        + '<div style="margin:10px 0;"><b>解析过程:</b></div>'
        + '<textarea id="parse-edit-analysis" style="width:100%;min-height:100px;padding:8px;border:1px solid #E5E7EB;border-radius:6px;font-size:13px;box-sizing:border-box;">' + (detail.analysis || []).map(function (a) { return a.step + a.text; }).join('\n') + '</textarea>'
        + '<div style="text-align:right;margin-top:12px;">'
        + '<button class="proto-btn proto-btn-primary" style="width:auto;padding:0 18px;height:36px;border-radius:8px;font-size:13px;" onclick="teacherParseSaveEdit(' + no + ')"><i class="fas fa-save"></i> 保存修改</button>'
        + '</div>'
        + '</div>'
    );
}

// 保存修改后的解析
function teacherParseSaveEdit(no) {
    var detail = teacherParseState.details[no];
    if (!detail) return;
    var ansEl = document.getElementById('parse-edit-answer');
    var anaEl = document.getElementById('parse-edit-analysis');
    if (ansEl) detail.answer = ansEl.value;
    if (anaEl) {
        var lines = anaEl.value.split(/\r?\n/).filter(function (s) { return s.trim(); });
        detail.analysis = lines.map(function (line, i) {
            var m = line.match(/^(第[一二三四五六七八九十]+步[：:]?)(.*)$/);
            return m ? { step: m[1], text: m[2] } : { step: '步骤' + (i + 1) + '：', text: line };
        });
    }
    closeModal();
    showToast('第 ' + no + ' 题解析已更新');
    teacherParseSwitch(no);
}

// AI 重新生成单题解析(带进度弹窗,完成后更新详情)
function teacherParseRegen(no) {
    var detail = teacherParseState.details[no];
    if (!detail) return;
    openModal('AI 重新生成第 ' + no + ' 题', ''
        + '<div style="padding:18px;font-size:13px;line-height:1.9;color:#374151;">'
        + '<div style="text-align:center;padding:8px 0 14px;">'
        + '<i class="fas fa-spinner fa-spin" style="font-size:28px;color:#EF4444;"></i>'
        + '<div style="margin-top:10px;font-weight:600;color:#1F2937;">AI 正在重新生成解析...</div>'
        + '</div>'
        + '<div id="parse-regen-log" style="background:#F3F4F6;border-radius:8px;padding:10px 12px;font-size:12px;color:#6B7280;min-height:60px;">'
        + '<div>· 启动 GPT-4 教学版模型</div>'
        + '</div>'
        + '</div>'
    );
    var logEl = document.getElementById('parse-regen-log');
    var appendLog = function (msg) {
        if (!logEl) return;
        var div = document.createElement('div');
        div.textContent = '· ' + msg;
        logEl.appendChild(div);
    };
    var steps = ['分析题干类型', '检索关联知识点', '生成解题步骤', '校验答案合理性'];
    var idx = 0;
    var progress = 0;
    var timer = setInterval(function () {
        progress += 22 + Math.random() * 10;
        if (progress >= 100) {
            progress = 100;
            clearInterval(timer);
            appendLog('生成完成,置信度 98.5%');
            // 重新生成新解析(基于题型模板,内容略有变化)
            var newDetail = teacherGenParseDetail({ no: no, type: detail.type, score: detail.score, diff: detail.difficulty.indexOf('★★★★★') >= 0 ? '困难' : detail.difficulty.indexOf('★★★') >= 0 ? '中等' : '简单' });
            // 答案加随机标记,体现"重新生成"
            newDetail.answer = newDetail.answer + ' (v2 重生成)';
            teacherParseState.details[no] = newDetail;
            // 如果该题之前已确认,保持已确认状态
            setTimeout(function () {
                closeModal();
                showToast('第 ' + no + ' 题解析已重新生成');
                teacherParseSwitch(no);
            }, 500);
            return;
        }
        var expected = Math.min(Math.floor(progress / 25), steps.length - 1);
        if (expected > idx) {
            idx = expected;
            appendLog(steps[idx] + '... ' + Math.round(progress) + '%');
        }
    }, 450);
}

// 顶栏:全部重新解析(批量重新生成所有题)
function teacherParseReparse() {
    var state = teacherParseState;
    var total = Object.keys(state.details).length;
    if (total === 0) {
        showToast('暂无可解析的题目');
        return;
    }
    openModal('AI 批量重新解析', ''
        + '<div style="padding:18px;font-size:13px;line-height:1.9;color:#374151;">'
        + '<div style="text-align:center;padding:8px 0 14px;">'
        + '<i class="fas fa-spinner fa-spin" style="font-size:28px;color:#3B82F6;"></i>'
        + '<div style="margin-top:10px;font-weight:600;color:#1F2937;">AI 正在批量重新生成解析...</div>'
        + '</div>'
        + '<div id="parse-reparse-log" style="background:#F3F4F6;border-radius:8px;padding:10px 12px;font-size:12px;color:#6B7280;min-height:80px;">'
        + '<div>· 共 ' + total + ' 道题待重新解析</div>'
        + '</div>'
        + '</div>'
    );
    var logEl = document.getElementById('parse-reparse-log');
    var appendLog = function (msg) {
        if (!logEl) return;
        var div = document.createElement('div');
        div.textContent = '· ' + msg;
        logEl.appendChild(div);
    };
    var nos = Object.keys(state.details).map(function (n) { return parseInt(n); }).sort(function (a, b) { return a - b; });
    var i = 0;
    var timer = setInterval(function () {
        if (i >= nos.length) {
            clearInterval(timer);
            appendLog('全部完成,平均置信度 98.5%');
            setTimeout(function () {
                closeModal();
                showToast('已批量重新生成 ' + total + ' 道题的解析');
                teacherParseSwitch(state.activeNo);
            }, 600);
            return;
        }
        var no = nos[i];
        appendLog('第 ' + no + ' 题: ' + state.details[no].type + ' 重新生成完成');
        var newDetail = teacherGenParseDetail({ no: no, type: state.details[no].type, score: state.details[no].score, diff: '中等' });
        newDetail.answer = newDetail.answer + ' (批量v2)';
        state.details[no] = newDetail;
        i++;
    }, 500);
}

// 顶栏:全部确认(把所有未解析题目标记为已解析)
function teacherParseConfirmAll() {
    var state = teacherParseState;
    var nos = Object.keys(state.details).map(function (n) { return parseInt(n); });
    var confirmed = 0;
    nos.forEach(function (no) {
        if (!state.parsedMap[no]) {
            state.parsedMap[no] = true;
            confirmed++;
            // 更新左侧列表徽章
            var item = document.querySelector('#teacher-parse-list [data-no="' + no + '"]');
            if (item) {
                var badge = item.querySelector('.parse-badge');
                if (badge) {
                    badge.style.background = '#D1FAE5';
                    badge.style.color = '#065F46';
                    badge.textContent = '已解析';
                }
                var dot = item.querySelector('.parse-dot');
                if (dot) {
                    dot.style.background = '#10B981';
                    dot.innerHTML = '<i class="fas fa-check"></i>';
                }
            }
        }
    });
    openModal('全部解析已确认', ''
        + '<div style="padding:18px;font-size:13px;line-height:1.8;color:#374151;">'
        + '<div style="text-align:center;padding:16px;background:#F0FDF4;border-radius:8px;margin-bottom:12px;">'
        + '<i class="fas fa-check-circle" style="font-size:32px;color:#10B981;"></i>'
        + '<div style="margin-top:8px;font-weight:600;color:#10B981;">全部解析已确认</div>'
        + '</div>'
        + '<b>确认汇总:</b><br>'
        + '· 题目总数:' + nos.length + ' 题<br>'
        + '· 本次新确认:' + confirmed + ' 题<br>'
        + '· 累计已解析:' + nos.length + ' 题<br>'
        + '· 考点已标记完毕<br><br>'
        + '<span style="color:#6B7280;">已进入知识点标注流程...</span>'
        + '</div>'
    );
    teacherParseUpdateCount();
    teacherParseSwitch(state.activeNo);
}

// 更新顶部统计文字
function teacherParseUpdateCount() {
    var state = teacherParseState;
    var total = Object.keys(state.details).length;
    var parsed = Object.keys(state.parsedMap).length;
    var el = document.getElementById('teacher-parse-count');
    if (el) el.textContent = parsed + '/' + total + ' 已解析';
    // 同时更新顶栏左侧的题目数文案
    var headEl = document.getElementById('teacher-parse-head');
    if (headEl) headEl.textContent = (state.paperName || '') + ' · 共 ' + total + ' 题 · 已解析 ' + parsed + ' 题';
}

// 页面注册:加载时优先从 teacher-split 切题数据同步,实现前后端数据一致
registerPage('teacher-parse', 'AI解析', '教师后台', '', function () {
    teacherLoadData('teacher-parse', function (container, data) {
        // 优先从 teacher-split 切题数据同步题目列表
        function renderWithSplit(splitData) {
            var splitQs = (splitData && splitData.questions) ? splitData.questions : [];
            var paperName = (splitData && splitData.fileName) ? splitData.fileName : (data.paperName || '未命名试卷');
            // 用切题数据覆盖解析数据,实现同步
            var state = teacherParseState;
            state.paperName = paperName;
            state.parsedMap = {};
            state.details = {};
            // 默认前 ceil(N/2) 题已解析,其余待解析
            var initParsed = Math.ceil(splitQs.length / 2);
            splitQs.forEach(function (q, i) {
                state.details[q.no] = teacherGenParseDetail(q);
                if (i < initParsed) state.parsedMap[q.no] = true;
            });
            state.activeNo = splitQs.length > 0 ? splitQs[0].no : 1;
            renderParsePage(container, paperName, splitQs);
        }
        // 异步获取切题数据
        if (typeof api !== 'undefined' && api.getPageData) {
            api.getPageData('teacher-split').then(function (splitData) {
                if (splitData && splitData.questions && splitData.questions.length > 0) {
                    renderWithSplit(splitData);
                } else {
                    // 切题数据为空,回退到 teacher-parse 自身数据
                    renderParsePage(container, data.paperName || '未命名试卷', (data.qList || []).map(function (q) {
                        return { no: q.no, type: q.type, score: 5, diff: q.done ? '简单' : '中等' };
                    }));
                }
            }).catch(function () {
                renderParsePage(container, data.paperName || '未命名试卷', (data.qList || []).map(function (q) {
                    return { no: q.no, type: q.type, score: 5, diff: q.done ? '简单' : '中等' };
                }));
            });
        } else {
            renderParsePage(container, data.paperName || '未命名试卷', (data.qList || []).map(function (q) {
                return { no: q.no, type: q.type, score: 5, diff: q.done ? '简单' : '中等' };
            }));
        }
    });
    return AdminPage('AI解析', TEACHER_MENU, 'parse', teacherLoading('teacher-parse'));
});

// 渲染 AI 解析页面(独立函数,被同步逻辑调用)
function renderParsePage(container, paperName, questions) {
    var state = teacherParseState;
    // 初始化 details 和 parsedMap(若尚未初始化)
    if (Object.keys(state.details).length === 0 && questions.length > 0) {
        questions.forEach(function (q, i) {
            state.details[q.no] = teacherGenParseDetail(q);
            if (i < Math.ceil(questions.length / 2)) state.parsedMap[q.no] = true;
        });
        state.activeNo = questions[0].no;
    }
    var total = questions.length;
    var parsed = Object.keys(state.parsedMap).length;
    state.paperName = paperName;

    // 左侧题目列表
    var qListHtml = questions.map(function (q) {
        var done = !!state.parsedMap[q.no];
        var active = state.activeNo === q.no;
        return '<div data-no="' + q.no + '" style="padding:12px;background:' + (active ? '#EFF6FF' : '#F9FAFB') + ';border-radius:10px;border:1px solid ' + (active ? '#3B82F6' : 'transparent') + ';cursor:pointer;display:flex;align-items:center;gap:10px;" onclick="teacherParseSwitch(' + q.no + ')">'
            + '<div class="parse-dot" style="width:28px;height:28px;border-radius:50%;background:' + (done ? '#10B981' : '#E5E7EB') + ';color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">' + (done ? '<i class="fas fa-check"></i>' : q.no) + '</div>'
            + '<div style="flex:1;">'
            + '<div style="font-size:13px;font-weight:600;">第 ' + q.no + ' 题</div>'
            + '<div style="font-size:11px;color:#9CA3AF;">' + q.type + ' · ' + q.score + '分</div>'
            + '</div>'
            + '<span class="parse-badge" style="background:' + (done ? '#D1FAE5' : '#FEF3C7') + ';color:' + (done ? '#065F46' : '#92400E') + ';padding:2px 8px;border-radius:6px;font-size:11px;">' + (done ? '已解析' : '待解析') + '</span>'
            + '</div>';
    }).join('');

    // 右侧详情(默认显示 activeNo 对应的题目)
    var detail = state.details[state.activeNo] || (questions.length > 0 ? teacherGenParseDetail(questions[0]) : null);
    if (detail && !state.details[state.activeNo]) state.details[state.activeNo] = detail;
    var detailHtml = '';
    if (detail) {
        var analysisHtml = (detail.analysis || []).map(function (a) {
            return '<div style="margin-bottom:8px;"><b>' + a.step + '</b>' + a.text + '</div>';
        }).join('');
        var pointsHtml = (detail.points || []).map(function (p) {
            return '<span style="background:#EDE9FE;color:#5B21B6;padding:4px 10px;border-radius:14px;font-size:12px;">' + p + '</span>';
        }).join('');
        var isDone = !!state.parsedMap[detail.no];
        detailHtml = ''
            + '<div style="background:#1E293B;border-radius:8px;padding:14px;color:white;margin-bottom:14px;">'
            + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">'
            + '<span style="font-size:11px;background:rgba(255,255,255,0.15);padding:2px 8px;border-radius:4px;">第' + detail.no + '题 · ' + detail.type + ' · ' + detail.score + '分</span>'
            + '<span style="font-size:11px;opacity:0.7;">难度 ' + detail.difficulty + '</span>'
            + '</div>'
            + '<div style="font-size:13px;line-height:1.6;">' + detail.content + '</div>'
            + '</div>'
            + '<div style="margin-bottom:14px;">'
            + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">'
            + '<span style="font-size:13px;font-weight:700;color:#10B981;"><i class="fas fa-check-circle"></i> 参考答案</span>'
            + '<i class="fas fa-edit" style="color:#8B5CF6;cursor:pointer;font-size:12px;" onclick="teacherParseModify(' + detail.no + ')"></i>'
            + '</div>'
            + '<div style="padding:10px 12px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;font-size:13px;">' + detail.answer + '</div>'
            + '</div>'
            + '<div style="margin-bottom:14px;">'
            + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">'
            + '<span style="font-size:13px;font-weight:700;color:#3B82F6;"><i class="fas fa-lightbulb"></i> 解析过程</span>'
            + '<i class="fas fa-edit" style="color:#8B5CF6;cursor:pointer;font-size:12px;" onclick="teacherParseModify(' + detail.no + ')"></i>'
            + '</div>'
            + '<div style="padding:12px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:8px;font-size:13px;line-height:1.8;color:#1E40AF;">' + analysisHtml + '</div>'
            + '</div>'
            + '<div style="margin-bottom:14px;">'
            + '<div style="font-size:13px;font-weight:700;color:#8B5CF6;margin-bottom:6px;"><i class="fas fa-tag"></i> 考点</div>'
            + '<div style="display:flex;gap:6px;flex-wrap:wrap;">' + pointsHtml + '</div>'
            + '</div>'
            + '<div style="display:flex;gap:8px;">'
            + '<button style="flex:1;padding:8px;background:' + (isDone ? '#9CA3AF' : '#10B981') + ';color:white;border:none;border-radius:8px;font-size:13px;cursor:pointer;" onclick="teacherParseConfirm(' + detail.no + ')"><i class="fas fa-check"></i> ' + (isDone ? '已确认' : '确认解析') + '</button>'
            + '<button style="flex:1;padding:8px;background:#F59E0B;color:white;border:none;border-radius:8px;font-size:13px;cursor:pointer;" onclick="teacherParseModify(' + detail.no + ')"><i class="fas fa-edit"></i> 修改</button>'
            + '<button style="flex:1;padding:8px;background:#EF4444;color:white;border:none;border-radius:8px;font-size:13px;cursor:pointer;" onclick="teacherParseRegen(' + detail.no + ')"><i class="fas fa-redo"></i> 重新生成</button>'
            + '</div>';
    } else {
        detailHtml = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div>暂无题目数据,请先在 AI切题 中生成题目</div></div>';
    }

    container.innerHTML = ''
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
        + '<div id="teacher-parse-head" style="font-size:13px;color:#6B7280;">' + paperName + ' · 共 ' + total + ' 题 · 已解析 ' + parsed + ' 题</div>'
        + '<div style="display:flex;gap:8px;">'
        + '<button class="proto-btn proto-btn-outline" style="width:auto;padding:0 16px;height:38px;border-radius:8px;font-size:13px;" onclick="teacherParseReparse()"><i class="fas fa-redo"></i> 重新解析</button>'
        + '<button class="proto-btn proto-btn-primary" style="width:auto;padding:0 16px;height:38px;border-radius:8px;font-size:13px;background:#10B981;" onclick="teacherParseConfirmAll()"><i class="fas fa-check"></i> 全部确认</button>'
        + '</div>'
        + '</div>'
        + '<div style="display:grid;grid-template-columns:1fr 2fr;gap:16px;">'
        + teacherCard('题目列表', '<span id="teacher-parse-count" style="font-size:12px;color:#6B7280;">' + parsed + '/' + total + ' 已解析</span>', '<div id="teacher-parse-list" style="display:flex;flex-direction:column;gap:8px;">' + qListHtml + '</div>')
        + teacherCard('AI解析详情', '<span style="font-size:12px;color:#8B5CF6;font-weight:600;"><i class="fas fa-robot"></i> AI生成 · 可编辑</span>', '<div id="teacher-parse-detail">' + detailHtml + '</div>')
        + '</div>';
}

// 暴露到 window,确保 onclick 内联属性可访问
window.teacherParseState = teacherParseState;
window.teacherGenParseDetail = teacherGenParseDetail;
window.teacherParseSwitch = teacherParseSwitch;
window.teacherParseConfirm = teacherParseConfirm;
window.teacherParseModify = teacherParseModify;
window.teacherParseSaveEdit = teacherParseSaveEdit;
window.teacherParseRegen = teacherParseRegen;
window.teacherParseReparse = teacherParseReparse;
window.teacherParseConfirmAll = teacherParseConfirmAll;
window.teacherParseUpdateCount = teacherParseUpdateCount;
window.renderParsePage = renderParsePage;

console.log('[pages-teacher-parse] AI解析模块已加载 v20260819A');
