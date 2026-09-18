// ============================================================
// AI 组卷模块 - 独立原型文件
// 版本: 20260820C
// 来源: 重写 prototype/js/pages-teacher.js 第1347-1445行(原模块所有按钮仅 openModal 弹静态文案)
// 说明: 实现参数配置/AI智能组卷/题目替换/移除/难度调节/保存/导出PDF/发布到班级 的真实交互 + 数据同步
// 依赖: api.js / design-system.js (openModal, closeModal, showToast, teacherCard, teacherLoading, AdminPage, TEACHER_MENU, registerPage)
// 用法: 在原型 index.html 中通过 <script src="js/pages-teacher-paper.js?v=20260820C"></script> 加载即可生效
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
            return '<div class="proto-card" style="background:white;border-radius:12px;padding:18px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">'
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
// AI组卷（真实交互版）
// ============================================================
// 状态管理: 试卷元信息 + 参数设置 + 题目列表 + 章节划分
var teacherPaperState = {
    paperName: '',
    settings: {
        subjects: [], fullScore: 0, knowledgeScopes: [],
        difficulty: 0, difficultyLabel: '', distribution: []
    },
    paperQuestions: [],
    sections: [],
    selectedSubject: '',
    selectedScope: ''
};

// 初始化 state(从后端 data 加载)
function teacherPaperInitState(data) {
    var d = data || {};
    teacherPaperState.paperName = d.paperName || '未命名试卷';
    teacherPaperState.settings = d.settings || { subjects: [], fullScore: 100, knowledgeScopes: [], difficulty: 50, difficultyLabel: '0.50', distribution: [] };
    teacherPaperState.paperQuestions = (d.paperQuestions || []).map(function (q) { return Object.assign({}, q); });
    teacherPaperState.sections = (d.sections || []).map(function (s) { return Object.assign({}, s); });
    teacherPaperState.selectedSubject = teacherPaperState.settings.subjects[0] || '数学';
    teacherPaperState.selectedScope = teacherPaperState.settings.knowledgeScopes[0] || '高考全部考点';
}

// 计算当前总分
function teacherPaperCalcTotal() {
    var t = 0;
    teacherPaperState.paperQuestions.forEach(function (q) { t += (q.score || 0); });
    return t;
}

// 根据 sections 重新计算 start/end 与题号
function teacherPaperRebuildSections() {
    var st = teacherPaperState;
    // 按题型分组,重新分配题号
    var newQ = [];
    var no = 1;
    var groups = { '选择题': [], '填空题': [], '解答题': [] };
    st.paperQuestions.forEach(function (q) { if (groups[q.type]) groups[q.type].push(q); });
    Object.keys(groups).forEach(function (type) {
        groups[type].forEach(function (q) { q.no = no++; newQ.push(q); });
    });
    st.paperQuestions = newQ;
    // 重算 sections 的 start/end
    var start = 0;
    st.sections.forEach(function (sec) {
        var type = sec.title.indexOf('选择题') >= 0 ? '选择题' : sec.title.indexOf('填空题') >= 0 ? '填空题' : '解答题';
        var cnt = groups[type].length;
        sec.start = start; sec.end = start + cnt;
        start += cnt;
    });
}

// HTML 转义辅助
function teacherPaperEsc(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// 渲染整个 AI组卷页面
function teacherPaperRenderPage(container) {
    var st = teacherPaperState;
    var settings = st.settings;
    var total = teacherPaperCalcTotal();

    var subjectsOpts = (settings.subjects || []).map(function (s) {
        return '<option ' + (s === st.selectedSubject ? 'selected' : '') + '>' + s + '</option>';
    }).join('');
    var scopeOpts = (settings.knowledgeScopes || []).map(function (s) {
        return '<option ' + (s === st.selectedScope ? 'selected' : '') + '>' + s + '</option>';
    }).join('');

    var distributionHtml = (settings.distribution || []).map(function (d, i) {
        return '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#F9FAFB;border-radius:6px;">'
            + '<span style="font-size:12px;">' + d.type + '</span>'
            + '<div style="display:flex;align-items:center;gap:6px;">'
            + '<input type="number" data-dist-idx="' + i + '" data-dist-field="count" value="' + d.count + '" style="width:42px;padding:4px;border:1px solid #E5E7EB;border-radius:4px;font-size:12px;text-align:center;" onchange="teacherPaperOnDistChange(' + i + ', \'count\', this.value)">题'
            + '<span style="font-size:12px;color:#6B7280;">/</span>'
            + '<input type="number" data-dist-idx="' + i + '" data-dist-field="score" value="' + d.score + '" style="width:42px;padding:4px;border:1px solid #E5E7EB;border-radius:4px;font-size:12px;text-align:center;" onchange="teacherPaperOnDistChange(' + i + ', \'score\', this.value)">分'
            + '</div></div>';
    }).join('');

    var sectionsHtml = st.sections.map(function (sec, secIdx) {
        var slice = st.paperQuestions.slice(sec.start, sec.end);
        var qHtml = slice.map(function (q) {
            var idx = st.paperQuestions.indexOf(q);
            var diffColor = q.diff === '困难' ? '#FEE2E2' : q.diff === '中等' ? '#FEF3C7' : '#D1FAE5';
            var diffText = q.diff === '困难' ? '#991B1B' : q.diff === '中等' ? '#92400E' : '#065F46';
            return '<div data-paper-q data-q-idx="' + idx + '" style="display:flex;gap:10px;padding:10px;background:#F9FAFB;border-radius:8px;">'
                + '<div style="width:24px;height:24px;border-radius:50%;background:' + sec.color + ';color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">' + q.no + '</div>'
                + '<div style="flex:1;">'
                + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">'
                + '<span style="font-size:12px;font-weight:600;">' + (q.point || '') + '</span>'
                + '<span style="background:' + diffColor + ';color:' + diffText + ';padding:1px 6px;border-radius:4px;font-size:10px;">' + q.diff + '</span>'
                + '</div>'
                + '<div style="font-size:12px;color:#6B7280;">' + q.type + ' · ' + q.score + '分</div>'
                + '</div>'
                + '<div style="display:flex;align-items:center;gap:4px;">'
                + '<button style="width:28px;height:28px;background:white;border:1px solid #E5E7EB;border-radius:6px;cursor:pointer;color:#8B5CF6;" title="AI替换" onclick="teacherPaperSwap(' + idx + ')"><i class="fas fa-sync" style="font-size:11px;"></i></button>'
                + '<button style="width:28px;height:28px;background:white;border:1px solid #E5E7EB;border-radius:6px;cursor:pointer;color:#EF4444;" title="移除" onclick="teacherPaperRemove(' + idx + ')"><i class="fas fa-times" style="font-size:11px;"></i></button>'
                + '</div></div>';
        }).join('');
        if (!qHtml) qHtml = '<div style="padding:10px;color:#9CA3AF;font-size:12px;text-align:center;">本大题暂无题目</div>';
        return '<div style="margin-bottom:10px;"><div style="font-size:13px;font-weight:700;color:#374151;padding:6px 0;border-bottom:1px solid #E5E7EB;">' + sec.title + '</div>' + qHtml + '</div>';
    }).join('');

    if (!sectionsHtml) {
        sectionsHtml = '<div style="text-align:center;padding:24px;color:#9CA3AF;"><i class="fas fa-inbox" style="font-size:20px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无题目,请点击"AI智能组卷"生成</div></div>';
    }

    container.innerHTML = ''
        + '<div style="display:grid;grid-template-columns:1fr 1.4fr;gap:16px;">'
        // 组卷参数设置
        + '<div>'
        + teacherCard('组卷参数', '<span style="font-size:12px;color:#3B82F6;font-weight:600;"><i class="fas fa-sliders-h"></i> 智能配置</span>', ''
            + '<div style="margin-bottom:14px;">'
            + '<div style="font-size:12px;color:#6B7280;margin-bottom:6px;">试卷名称</div>'
            + '<input id="paper-name-input" class="proto-input" value="' + teacherPaperEsc(st.paperName) + '" style="height:40px;" onchange="teacherPaperOnNameChange(this.value)" oninput="teacherPaperOnNameChange(this.value)">'
            + '</div>'
            + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">'
            + '<div><div style="font-size:12px;color:#6B7280;margin-bottom:6px;">科目</div>'
            + '<select id="paper-subject-select" class="proto-input" style="height:40px;" onchange="teacherPaperOnSelectChange(\'subject\', this.value)">' + subjectsOpts + '</select></div>'
            + '<div><div style="font-size:12px;color:#6B7280;margin-bottom:6px;">满分</div>'
            + '<input id="paper-fullscore-input" class="proto-input" type="number" value="' + settings.fullScore + '" style="height:40px;" onchange="teacherPaperOnFullScoreChange(this.value)"></div>'
            + '</div>'
            + '<div style="margin-bottom:14px;"><div style="font-size:12px;color:#6B7280;margin-bottom:6px;">知识范围</div>'
            + '<select id="paper-scope-select" class="proto-input" style="height:40px;" onchange="teacherPaperOnSelectChange(\'scope\', this.value)">' + scopeOpts + '</select></div>'
            + '<div style="margin-bottom:14px;">'
            + '<div style="display:flex;justify-content:space-between;font-size:12px;color:#6B7280;margin-bottom:6px;"><span>难度系数</span><span id="paper-diff-label" style="color:#3B82F6;font-weight:600;">' + settings.difficultyLabel + '</span></div>'
            + '<input id="paper-diff-range" type="range" min="0" max="100" value="' + settings.difficulty + '" style="width:100%;" oninput="teacherPaperOnDiffChange(this.value)">'
            + '<div style="display:flex;justify-content:space-between;font-size:10px;color:#9CA3AF;margin-top:4px;"><span>简单</span><span>中等</span><span>困难</span></div>'
            + '</div>'
            + '<div style="margin-bottom:14px;"><div style="font-size:12px;color:#6B7280;margin-bottom:6px;">分值分布</div>'
            + '<div style="display:flex;flex-direction:column;gap:8px;">' + distributionHtml + '</div></div>'
            + '<button class="proto-btn proto-btn-primary" style="height:44px;border-radius:8px;background:linear-gradient(135deg,#3B82F6,#8B5CF6);" onclick="teacherPaperGenerate()"><i class="fas fa-magic"></i> AI智能组卷</button>')
        + '</div>'
        // 生成试卷预览
        + '<div>'
        + teacherCard('试卷预览', '<span style="font-size:12px;color:#6B7280;">' + st.paperName + ' · ' + st.paperQuestions.length + '题 · 共' + total + '分</span>', '<div style="display:flex;flex-direction:column;gap:10px;max-height:540px;overflow-y:auto;">' + sectionsHtml + '</div>')
        + '</div>'
        + '</div>'
        // 底部操作
        + '<div style="display:flex;gap:10px;">'
        + '<button class="proto-btn proto-btn-outline" style="height:44px;border-radius:8px;" onclick="teacherPaperSave()"><i class="fas fa-save"></i> 保存试卷</button>'
        + '<button class="proto-btn proto-btn-outline" style="height:44px;border-radius:8px;" onclick="teacherPaperExportPDF()"><i class="fas fa-file-pdf"></i> 导出PDF</button>'
        + '<button class="proto-btn proto-btn-primary" style="height:44px;border-radius:8px;flex:1;background:#10B981;" onclick="teacherPaperPublish()"><i class="fas fa-paper-plane"></i> 发布到班级</button>'
        + '</div>';
}

// 试卷名称变更
function teacherPaperOnNameChange(v) {
    teacherPaperState.paperName = v;
    teacherPaperSaveState();
}

// 满分变更
function teacherPaperOnFullScoreChange(v) {
    teacherPaperState.settings.fullScore = parseInt(v, 10) || 0;
    showToast('已设置满分:' + v + '分');
    teacherPaperSaveState();
}

// select 切换
function teacherPaperOnSelectChange(field, value) {
    var st = teacherPaperState;
    if (field === 'subject') st.selectedSubject = value;
    else if (field === 'scope') st.selectedScope = value;
    showToast('已设置' + (field === 'subject' ? '科目' : '知识范围') + ':' + value);
    teacherPaperSaveState();
}

// 难度系数变更
function teacherPaperOnDiffChange(v) {
    var st = teacherPaperState;
    st.settings.difficulty = parseInt(v, 10) || 0;
    var d = st.settings.difficulty;
    var label = d < 30 ? '0.' + d + '(简单)' : d < 70 ? '0.' + d + '(中等)' : '0.' + d + '(困难)';
    st.settings.difficultyLabel = label;
    var el = document.getElementById('paper-diff-label');
    if (el) el.textContent = label;
    teacherPaperSaveState();
}

// 分值分布变更
function teacherPaperOnDistChange(idx, field, value) {
    var st = teacherPaperState;
    var d = st.settings.distribution[idx];
    if (!d) return;
    d[field] = parseInt(value, 10) || 0;
    showToast('已设置' + d.type + (field === 'count' ? '题数:' : '分值:') + value + (field === 'score' ? '分' : '题'));
    teacherPaperSaveState();
}

// AI 智能组卷(带进度,生成新题目填充列表)
function teacherPaperGenerate() {
    var st = teacherPaperState;
    var settings = st.settings;
    var totalCnt = (settings.distribution || []).reduce(function (s, d) { return s + (d.count || 0); }, 0);
    if (totalCnt === 0) {
        showToast('请先设置分值分布的题数');
        return;
    }
    openModal('AI 智能组卷', ''
        + '<div style="padding:18px;font-size:13px;line-height:1.9;color:#374151;">'
        + '<div style="text-align:center;padding:8px 0 14px;">'
        + '<i class="fas fa-spinner fa-spin" style="font-size:28px;color:#3B82F6;"></i>'
        + '<div style="margin-top:10px;font-weight:600;color:#1F2937;">AI 正在智能组卷...</div></div>'
        + '<div style="background:#F3F4F6;border-radius:8px;padding:10px 12px;font-size:12px;color:#6B7280;margin-bottom:10px;">'
        + '<div>· 试卷名称:' + st.paperName + '</div>'
        + '<div>· 科目:' + st.selectedSubject + '</div>'
        + '<div>· 满分:' + settings.fullScore + '分</div>'
        + '<div>· 知识范围:' + st.selectedScope + '</div>'
        + '<div>· 难度系数:' + settings.difficultyLabel + '</div>'
        + '<div>· 目标题数:' + totalCnt + '题</div>'
        + '</div>'
        + '<div id="paper-gen-log" style="background:#F3F4F6;border-radius:8px;padding:10px 12px;font-size:12px;color:#6B7280;min-height:60px;">'
        + '<div>· 启动 GPT-4 组卷模型</div></div></div>');

    var logEl = document.getElementById('paper-gen-log');
    var appendLog = function (msg) {
        if (!logEl) return;
        var div = document.createElement('div');
        div.textContent = '· ' + msg;
        logEl.appendChild(div);
    };
    var steps = ['检索题库', '智能匹配题目', '平衡难度分布', '校验分值总和'];
    var idx = 0;
    var progress = 0;
    var timer = setInterval(function () {
        progress += 18 + Math.random() * 8;
        if (progress >= 100) {
            progress = 100;
            clearInterval(timer);
            appendLog('组卷完成,共 ' + totalCnt + ' 题');
            // 生成新题目,按 distribution 配置
            var pointsPool = ['集合运算', '复数运算', '平面向量', '三角函数', '数列综合', '立体几何', '概率统计', '导数综合', '解析几何', '函数与导数'];
            var newQs = [];
            var no = 1;
            (settings.distribution || []).forEach(function (d) {
                for (var i = 0; i < d.count; i++) {
                    var pt = pointsPool[(no - 1) % pointsPool.length];
                    var diff = settings.difficulty < 30 ? '简单' : settings.difficulty < 70 ? '中等' : '困难';
                    newQs.push({ no: no, type: d.type, score: d.score, point: pt, diff: diff });
                    no++;
                }
            });
            st.paperQuestions = newQs;
            teacherPaperRebuildSections();
            setTimeout(function () {
                closeModal();
                showToast('AI 已智能组卷,共 ' + newQs.length + ' 题,总分 ' + teacherPaperCalcTotal() + ' 分');
                teacherPaperReRender();
                teacherPaperSaveState();
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

// AI 替换题目(同知识点同难度换题)
function teacherPaperSwap(qIdx) {
    var q = teacherPaperState.paperQuestions[qIdx];
    if (!q) return;
    openModal('AI 替换题目 - 第 ' + q.no + ' 题', ''
        + '<div style="padding:18px;font-size:13px;line-height:1.9;color:#374151;">'
        + '<div style="text-align:center;padding:8px 0 14px;">'
        + '<i class="fas fa-spinner fa-spin" style="font-size:28px;color:#8B5CF6;"></i>'
        + '<div style="margin-top:10px;font-weight:600;color:#1F2937;">AI 正在替换题目...</div></div>'
        + '<div id="paper-swap-log" style="background:#F3F4F6;border-radius:8px;padding:10px 12px;font-size:12px;color:#6B7280;min-height:50px;">'
        + '<div>· 当前题目:第 ' + q.no + ' 题</div>'
        + '<div>· 知识点:' + q.point + ' · 难度:' + q.diff + ' · 类型:' + q.type + '</div></div></div>');
    var logEl = document.getElementById('paper-swap-log');
    var appendLog = function (msg) {
        if (!logEl) return;
        var div = document.createElement('div');
        div.textContent = '· ' + msg;
        logEl.appendChild(div);
    };
    var steps = ['分析原题特征', '检索相似题库', '生成新题'];
    var stepIdx = 0;
    var progress = 0;
    var timer = setInterval(function () {
        progress += 25 + Math.random() * 10;
        if (progress >= 100) {
            progress = 100;
            clearInterval(timer);
            appendLog('替换完成');
            q.point = q.point + '(替换)';
            setTimeout(function () {
                closeModal();
                showToast('第 ' + q.no + ' 题已替换为新题');
                teacherPaperReRender();
                teacherPaperSaveState();
            }, 500);
            return;
        }
        var expected = Math.min(Math.floor(progress / 34), steps.length - 1);
        if (expected > stepIdx) {
            stepIdx = expected;
            appendLog(steps[stepIdx] + '... ' + Math.round(progress) + '%');
        }
    }, 450);
}

// 移除题目(二次确认)
function teacherPaperRemove(qIdx) {
    var q = teacherPaperState.paperQuestions[qIdx];
    if (!q) return;
    openModal('移除题目 - 第 ' + q.no + ' 题', ''
        + '<div style="padding:16px;font-size:13px;line-height:1.8;color:#374151;">'
        + '<div style="text-align:center;padding:14px;background:#FEF2F2;border-radius:8px;margin-bottom:12px;">'
        + '<i class="fas fa-trash-alt" style="font-size:28px;color:#EF4444;"></i>'
        + '<div style="margin-top:6px;font-weight:600;color:#EF4444;">确定移除第 ' + q.no + ' 题?</div></div>'
        + '<b>题目信息:</b><br>· 类型:' + q.type + '<br>· 分值:' + q.score + '分<br>· 知识点:' + q.point + '<br>'
        + '<div style="display:flex;gap:8px;margin-top:14px;">'
        + '<button class="proto-btn proto-btn-outline" style="flex:1;height:38px;border-radius:8px;" onclick="closeModal()">取消</button>'
        + '<button class="proto-btn proto-btn-primary" style="flex:1;height:38px;border-radius:8px;background:#EF4444;" onclick="teacherPaperConfirmRemove(' + qIdx + ')">确认移除</button>'
        + '</div></div>');
}

// 确认移除
function teacherPaperConfirmRemove(qIdx) {
    var q = teacherPaperState.paperQuestions[qIdx];
    var no = q ? q.no : '';
    teacherPaperState.paperQuestions.splice(qIdx, 1);
    teacherPaperRebuildSections();
    closeModal();
    showToast('已移除第 ' + no + ' 题');
    teacherPaperReRender();
    teacherPaperSaveState();
}

// 保存试卷
function teacherPaperSave() {
    var st = teacherPaperState;
    openModal('保存试卷', ''
        + '<div style="padding:18px;font-size:13px;line-height:1.9;color:#374151;">'
        + '<div style="text-align:center;padding:14px;background:#F0FDF4;border-radius:8px;margin-bottom:12px;">'
        + '<i class="fas fa-check-circle" style="font-size:28px;color:#10B981;"></i>'
        + '<div style="margin-top:6px;font-weight:600;color:#10B981;">保存中...</div></div>'
        + '<b>保存信息:</b><br>· 试卷名称:' + st.paperName + '<br>· 题目数:' + st.paperQuestions.length + '题<br>· 满分:' + st.settings.fullScore + '分<br>'
        + '<div style="text-align:center;margin-top:14px;"><button class="proto-btn proto-btn-primary" style="width:100%;height:40px;border-radius:8px;background:#10B981;" onclick="teacherPaperConfirmSave()">确认保存</button></div>'
        + '</div>');
}

// 确认保存
function teacherPaperConfirmSave() {
    closeModal();
    showToast('试卷已保存:' + teacherPaperState.paperName + ',共 ' + teacherPaperState.paperQuestions.length + ' 题');
    teacherPaperSaveState();
}

// 导出 PDF
function teacherPaperExportPDF() {
    var st = teacherPaperState;
    if (st.paperQuestions.length === 0) {
        showToast('当前无题目,请先组卷');
        return;
    }
    var pages = Math.ceil(st.paperQuestions.length / 5);
    openModal('导出 PDF', ''
        + '<div style="padding:18px;font-size:13px;line-height:1.9;color:#374151;">'
        + '<div style="text-align:center;padding:14px;background:#FEF2F2;border-radius:8px;margin-bottom:12px;">'
        + '<i class="fas fa-file-pdf" style="font-size:28px;color:#EF4444;"></i>'
        + '<div style="margin-top:6px;font-weight:600;color:#EF4444;">PDF 生成中...</div></div>'
        + '<b>导出信息:</b><br>· 试卷名称:' + st.paperName + '<br>· 题目数:' + st.paperQuestions.length + '题<br>· 文件大小:约1.2MB<br>· 页数:' + pages + '页<br>'
        + '<div style="text-align:center;margin-top:14px;"><button class="proto-btn proto-btn-primary" style="width:100%;height:40px;border-radius:8px;background:#EF4444;" onclick="teacherPaperConfirmExportPDF()">开始下载</button></div>'
        + '</div>');
}

// 确认导出 PDF
function teacherPaperConfirmExportPDF() {
    closeModal();
    showToast('PDF 已生成,' + Math.ceil(teacherPaperState.paperQuestions.length / 5) + ' 页,正在下载');
    teacherPaperSaveState();
}

// 发布到班级
function teacherPaperPublish() {
    var st = teacherPaperState;
    if (st.paperQuestions.length === 0) {
        showToast('当前无题目,请先组卷');
        return;
    }
    openModal('发布到班级', ''
        + '<div style="padding:18px;font-size:13px;line-height:1.9;color:#374151;">'
        + '<div style="text-align:center;padding:14px;background:#F0FDF4;border-radius:8px;margin-bottom:12px;">'
        + '<i class="fas fa-paper-plane" style="font-size:28px;color:#10B981;"></i>'
        + '<div style="margin-top:6px;font-weight:600;color:#10B981;">即将发布</div></div>'
        + '<b>发布信息:</b><br>· 试卷:' + st.paperName + '<br>· 班级:高三(1)班 · 45人<br>· 满分:' + st.settings.fullScore + '分<br>· 截止时间:3天后<br>'
        + '<div style="text-align:center;margin-top:14px;"><button class="proto-btn proto-btn-primary" style="width:100%;height:40px;border-radius:8px;background:#10B981;" onclick="teacherPaperConfirmPublish()">确认发布</button></div>'
        + '</div>');
}

// 确认发布
function teacherPaperConfirmPublish() {
    closeModal();
    showToast('已发布到高三(1)班,共 ' + teacherPaperState.paperQuestions.length + ' 题,45 人接收');
    teacherPaperSaveState();
}

// 重新渲染
function teacherPaperReRender() {
    var container = document.getElementById('teacher-paper-content');
    if (container) teacherPaperRenderPage(container);
}

// 保存状态到后端
function teacherPaperSaveState() {
    if (typeof api === 'undefined' || !api.savePageData) return;
    var st = teacherPaperState;
    var total = teacherPaperCalcTotal();
    var payload = {
        paperName: st.paperName,
        previewInfo: st.paperName + ' · ' + st.paperQuestions.length + '题 · 共' + total + '分',
        settings: st.settings,
        paperQuestions: st.paperQuestions,
        sections: st.sections
    };
    api.savePageData('teacher-paper', payload).then(function () {}).catch(function () {});
}

// 页面注册
registerPage('teacher-paper', 'AI组卷', '教师后台', '', function () {
    if (typeof teacherLoadData === 'function') {
        teacherLoadData('teacher-paper', function (container, data) {
            teacherPaperInitState(data);
            teacherPaperRenderPage(container);
        });
    } else {
        var container = document.getElementById('teacher-paper-content');
        if (!container) {
            var screen = document.getElementById('device-screen');
            if (screen) {
                screen.innerHTML = '<div id="teacher-paper-content"></div>';
                container = document.getElementById('teacher-paper-content');
            }
        }
        if (container) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div>';
            if (typeof api !== 'undefined' && api.getPageData) {
                api.getPageData('teacher-paper').then(function (data) {
                    teacherPaperInitState(data || {});
                    teacherPaperRenderPage(container);
                }).catch(function () {
                    teacherPaperInitState({});
                    teacherPaperRenderPage(container);
                });
            } else {
                teacherPaperInitState({});
                teacherPaperRenderPage(container);
            }
        }
    }
    return AdminPage('AI组卷', TEACHER_MENU, 'paper', teacherLoading('teacher-paper'));
});

// 暴露到 window
window.teacherPaperState = teacherPaperState;
window.teacherPaperInitState = teacherPaperInitState;
window.teacherPaperCalcTotal = teacherPaperCalcTotal;
window.teacherPaperRebuildSections = teacherPaperRebuildSections;
window.teacherPaperEsc = teacherPaperEsc;
window.teacherPaperRenderPage = teacherPaperRenderPage;
window.teacherPaperOnNameChange = teacherPaperOnNameChange;
window.teacherPaperOnFullScoreChange = teacherPaperOnFullScoreChange;
window.teacherPaperOnSelectChange = teacherPaperOnSelectChange;
window.teacherPaperOnDiffChange = teacherPaperOnDiffChange;
window.teacherPaperOnDistChange = teacherPaperOnDistChange;
window.teacherPaperGenerate = teacherPaperGenerate;
window.teacherPaperSwap = teacherPaperSwap;
window.teacherPaperRemove = teacherPaperRemove;
window.teacherPaperConfirmRemove = teacherPaperConfirmRemove;
window.teacherPaperSave = teacherPaperSave;
window.teacherPaperConfirmSave = teacherPaperConfirmSave;
window.teacherPaperExportPDF = teacherPaperExportPDF;
window.teacherPaperConfirmExportPDF = teacherPaperConfirmExportPDF;
window.teacherPaperPublish = teacherPaperPublish;
window.teacherPaperConfirmPublish = teacherPaperConfirmPublish;
window.teacherPaperReRender = teacherPaperReRender;
window.teacherPaperSaveState = teacherPaperSaveState;

console.log('[pages-teacher-paper] AI组卷模块已加载 v20260820C');
