// ============================================================
// AI 课堂练习模块 - 独立原型文件
// 版本: 20260820B
// 来源: 重写 prototype/js/pages-teacher.js 第1261-1344行(原模块所有按钮仅 openModal 弹静态文案)
// 说明: 实现知识点选择/生成练习/预览/编辑/换题/删除/推送/打印/导出 的真实交互 + 数据同步
// 依赖: api.js / design-system.js (openModal, closeModal, showToast, teacherCard, teacherLoading, AdminPage, TEACHER_MENU, registerPage)
// 用法: 在原型 index.html 中通过 <script src="js/pages-teacher-exercise.js?v=20260820B"></script> 加载即可生效
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
// AI课堂练习（真实交互版）
// ============================================================
// 状态管理: 生成设置(科目/难度/题量/知识点) + 题目列表 + UI 元素引用
var teacherExerciseState = {
    settings: { subjects: [], difficulties: [], counts: [], selectedDifficulty: '', selectedCount: '', points: [] },
    exercises: [],   // 题目数组(可增删/换题)
    totalScore: 0,
    selectedSubject: '',
    selectedDifficulty: '',
    selectedCount: '',
    selectedPoints: [] // 用户当前选中的知识点名称数组
};

// 初始化 state(从后端 data 加载)
function teacherExerciseInitState(data) {
    var s = (data && data.settings) || {};
    teacherExerciseState.settings = s;
    teacherExerciseState.exercises = (data && data.exercises) ? data.exercises.slice() : [];
    teacherExerciseState.totalScore = data && data.totalScore ? data.totalScore : 0;
    teacherExerciseState.selectedSubject = s.subjects && s.subjects[0] ? s.subjects[0] : '数学';
    teacherExerciseState.selectedDifficulty = s.selectedDifficulty || (s.difficulties && s.difficulties[0]) || '中等';
    teacherExerciseState.selectedCount = s.selectedCount || (s.counts && s.counts[0]) || '10 题';
    teacherExerciseState.selectedPoints = (s.points || []).filter(function (p) { return p.active; }).map(function (p) { return p.name; });
}

// 重算总分(根据 exercises 数组)
function teacherExerciseRecalcTotal() {
    var t = 0;
    teacherExerciseState.exercises.forEach(function (e) { t += (e.score || 0); });
    teacherExerciseState.totalScore = t;
}

// HTML 转义辅助
function teacherExerciseEsc(s) {
    return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

// 渲染整个 AI课堂练习页面
function teacherExerciseRenderPage(container) {
    var st = teacherExerciseState;
    var settings = st.settings;

    // 选项构造
    var subjectsOpts = (settings.subjects || []).map(function (s) {
        return '<option ' + (s === st.selectedSubject ? 'selected' : '') + '>' + s + '</option>';
    }).join('');
    var diffOpts = (settings.difficulties || []).map(function (d) {
        return '<option ' + (d === st.selectedDifficulty ? 'selected' : '') + '>' + d + '</option>';
    }).join('');
    var countOpts = (settings.counts || []).map(function (c) {
        return '<option ' + (c === st.selectedCount ? 'selected' : '') + '>' + c + '</option>';
    }).join('');

    // 知识点 chips
    var pointsHtml = (settings.points || []).map(function (p) {
        var active = st.selectedPoints.indexOf(p.name) >= 0;
        var style = active ? 'background:#3B82F6;color:white;' : 'background:#EFF6FF;color:#2563EB;';
        var label = active ? (p.name + ' ✓') : p.name;
        return '<span data-pt-name="' + teacherExerciseEsc(p.name) + '" style="' + style + 'padding:5px 12px;border-radius:14px;font-size:12px;cursor:pointer;' + (active ? 'active-pt' : '') + '" class="' + (active ? 'active-pt' : '') + '" onclick="teacherExerciseTogglePoint(this)">' + label + '</span>';
    }).join('');

    // 题目列表
    var exercisesHtml = st.exercises.map(function (e, idx) {
        var diffColor = e.diff === '困难' ? '#EF4444' : e.diff === '中等' ? '#F59E0B' : '#10B981';
        return '<div data-exercise-card data-ex-idx="' + idx + '" style="padding:12px;background:#F9FAFB;border-radius:10px;border-left:3px solid ' + diffColor + ';">'
            + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">'
            + '<div style="display:flex;align-items:center;gap:8px;">'
            + '<div style="width:26px;height:26px;border-radius:50%;background:#3B82F6;color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">' + e.no + '</div>'
            + '<span style="font-size:13px;font-weight:600;">第 ' + e.no + ' 题</span>'
            + '<span style="background:#EFF6FF;color:#2563EB;padding:1px 8px;border-radius:6px;font-size:11px;">' + e.type + '</span>'
            + '</div>'
            + '<div style="display:flex;align-items:center;gap:10px;font-size:12px;">'
            + '<span style="color:#8B5CF6;"><i class="fas fa-tag"></i> ' + (e.point || '') + '</span>'
            + '<span style="color:#9CA3AF;">|</span>'
            + '<span style="color:' + diffColor + ';">' + e.diff + '</span>'
            + '<span style="color:#9CA3AF;">|</span>'
            + '<span style="font-weight:600;color:#374151;">' + e.score + '分</span>'
            + '</div></div>'
            + '<div style="font-size:13px;color:#374151;line-height:1.6;padding:8px 10px;background:white;border-radius:6px;">' + (e.content || '') + '</div>'
            + '<div style="display:flex;gap:6px;margin-top:8px;">'
            + '<button style="padding:4px 12px;background:white;border:1px solid #E5E7EB;border-radius:6px;font-size:11px;cursor:pointer;color:#3B82F6;" onclick="teacherExercisePreview(' + idx + ')"><i class="fas fa-eye"></i> 预览</button>'
            + '<button style="padding:4px 12px;background:white;border:1px solid #E5E7EB;border-radius:6px;font-size:11px;cursor:pointer;color:#F59E0B;" onclick="teacherExerciseEdit(' + idx + ')"><i class="fas fa-edit"></i> 编辑</button>'
            + '<button style="padding:4px 12px;background:white;border:1px solid #E5E7EB;border-radius:6px;font-size:11px;cursor:pointer;color:#8B5CF6;" onclick="teacherExerciseSwap(' + idx + ')"><i class="fas fa-sync"></i> 换一题</button>'
            + '<button style="padding:4px 12px;background:white;border:1px solid #E5E7EB;border-radius:6px;font-size:11px;cursor:pointer;color:#EF4444;" onclick="teacherExerciseDelete(' + idx + ')"><i class="fas fa-trash"></i> 删除</button>'
            + '</div></div>';
    }).join('');

    if (!exercisesHtml) {
        exercisesHtml = '<div style="text-align:center;padding:24px;color:#9CA3AF;"><i class="fas fa-inbox" style="font-size:20px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无练习题,点击"生成课堂练习"创建</div></div>';
    }

    container.innerHTML = ''
        // 生成设置
        + teacherCard('生成设置', '<span style="font-size:12px;color:#3B82F6;font-weight:600;"><i class="fas fa-magic"></i> AI智能生成</span>', ''
            + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:14px;">'
            + '<div><div style="font-size:12px;color:#6B7280;margin-bottom:6px;">科目</div>'
            + '<select id="ex-set-subject" class="proto-input" style="height:40px;" onchange="teacherExerciseOnSelectChange(\'subject\', this.value)">' + subjectsOpts + '</select></div>'
            + '<div><div style="font-size:12px;color:#6B7280;margin-bottom:6px;">难度</div>'
            + '<select id="ex-set-diff" class="proto-input" style="height:40px;" onchange="teacherExerciseOnSelectChange(\'difficulty\', this.value)">' + diffOpts + '</select></div>'
            + '<div><div style="font-size:12px;color:#6B7280;margin-bottom:6px;">题量</div>'
            + '<select id="ex-set-count" class="proto-input" style="height:40px;" onchange="teacherExerciseOnSelectChange(\'count\', this.value)">' + countOpts + '</select></div>'
            + '</div>'
            + '<div style="margin-bottom:14px;"><div style="font-size:12px;color:#6B7280;margin-bottom:6px;">知识点范围</div>'
            + '<div style="display:flex;gap:6px;flex-wrap:wrap;">' + pointsHtml + '</div></div>'
            + '<div style="display:flex;gap:10px;">'
            + '<button class="proto-btn proto-btn-primary" style="width:auto;padding:0 24px;height:42px;border-radius:8px;flex:1;" onclick="teacherExerciseGenerate()"><i class="fas fa-magic"></i> 生成课堂练习</button>'
            + '<button class="proto-btn proto-btn-outline" style="width:auto;padding:0 20px;height:42px;border-radius:8px;" onclick="teacherExerciseExport()"><i class="fas fa-download"></i> 导出</button>'
            + '</div>')
        // 生成的练习题列表
        + teacherCard('生成的练习题', '<span style="font-size:12px;color:#6B7280;">共 ' + st.exercises.length + ' 题 · 总分 ' + st.totalScore + ' 分</span>', '<div style="display:flex;flex-direction:column;gap:10px;">' + exercisesHtml + '</div>')
        // 底部操作
        + '<div style="display:flex;gap:10px;">'
        + '<button class="proto-btn proto-btn-outline" style="height:44px;border-radius:8px;" onclick="teacherExercisePushToClass()"><i class="fas fa-paper-plane"></i> 推送到班级</button>'
        + '<button class="proto-btn proto-btn-primary" style="height:44px;border-radius:8px;flex:1;background:#10B981;" onclick="teacherExercisePrint()"><i class="fas fa-print"></i> 打印发放</button>'
        + '</div>';
}

// 切换知识点选中状态(点击 chip)
function teacherExerciseTogglePoint(el) {
    var name = el.getAttribute('data-pt-name');
    var st = teacherExerciseState;
    var idx = st.selectedPoints.indexOf(name);
    if (idx >= 0) {
        st.selectedPoints.splice(idx, 1);
        el.classList.remove('active-pt');
        el.style.background = '#EFF6FF';
        el.style.color = '#2563EB';
        el.textContent = name;
        showToast('已取消知识点:「' + name + '」');
    } else {
        st.selectedPoints.push(name);
        el.classList.add('active-pt');
        el.style.background = '#3B82F6';
        el.style.color = 'white';
        el.textContent = name + ' ✓';
        showToast('已选择知识点:「' + name + '」');
    }
    teacherExerciseSaveState();
}

// select 切换(科目/难度/题量)
function teacherExerciseOnSelectChange(field, value) {
    var st = teacherExerciseState;
    if (field === 'subject') st.selectedSubject = value;
    else if (field === 'difficulty') st.selectedDifficulty = value;
    else if (field === 'count') st.selectedCount = value;
    showToast('已设置' + (field === 'subject' ? '科目' : field === 'difficulty' ? '难度' : '题量') + ':' + value);
    teacherExerciseSaveState();
}

// 生成课堂练习(带进度推进,完成后追加新题目到列表)
function teacherExerciseGenerate() {
    var st = teacherExerciseState;
    var cnt = parseInt(st.selectedCount, 10) || 10;
    var diff = st.selectedDifficulty || '中等';
    var sub = st.selectedSubject || '数学';
    var pts = st.selectedPoints.length ? st.selectedPoints.slice() : ((st.settings.points || []).map(function (p) { return p.name; }));

    openModal('生成课堂练习', ''
        + '<div style="padding:18px;font-size:13px;line-height:1.9;color:#374151;">'
        + '<div style="text-align:center;padding:8px 0 14px;">'
        + '<i class="fas fa-spinner fa-spin" style="font-size:28px;color:#3B82F6;"></i>'
        + '<div style="margin-top:10px;font-weight:600;color:#1F2937;">AI 正在生成课堂练习...</div></div>'
        + '<div style="background:#F3F4F6;border-radius:8px;padding:10px 12px;font-size:12px;color:#6B7280;margin-bottom:10px;">'
        + '<div>· 科目:' + sub + '</div>'
        + '<div>· 难度:' + diff + '</div>'
        + '<div>· 题量:' + cnt + '题</div>'
        + '<div>· 知识点:' + (pts.length ? pts.join('、') : '全部') + '</div>'
        + '</div>'
        + '<div id="ex-gen-log" style="background:#F3F4F6;border-radius:8px;padding:10px 12px;font-size:12px;color:#6B7280;min-height:60px;">'
        + '<div>· 启动 GPT-4 教学版模型</div></div></div>');

    var logEl = document.getElementById('ex-gen-log');
    var appendLog = function (msg) {
        if (!logEl) return;
        var div = document.createElement('div');
        div.textContent = '· ' + msg;
        logEl.appendChild(div);
    };
    var steps = ['检索知识点题库', '匹配题型与难度', '生成题干内容', '校验答案与解析'];
    var idx = 0;
    var progress = 0;
    var timer = setInterval(function () {
        progress += 18 + Math.random() * 8;
        if (progress >= 100) {
            progress = 100;
            clearInterval(timer);
            appendLog('生成完成,共 ' + cnt + ' 道题');
            // 生成新题目(基于难度/科目/题量),追加到列表
            var typesPool = ['选择题', '填空题', '解答题'];
            var baseNo = st.exercises.length;
            var newExs = [];
            var typeIdx = 0;
            for (var i = 0; i < cnt; i++) {
                var t = typesPool[typeIdx % typesPool.length];
                typeIdx++;
                var score = t === '解答题' ? 12 : t === '填空题' ? 5 : 5;
                var ptName = pts.length ? pts[i % pts.length] : (sub + '综合');
                newExs.push({
                    no: baseNo + i + 1,
                    type: t,
                    diff: diff === '分层难度' ? ['简单', '中等', '困难'][i % 3] : diff,
                    score: score,
                    point: ptName,
                    content: '【AI生成·' + sub + '·' + ptName + '】' + t + '第' + (baseNo + i + 1) + '题:基于' + ptName + '的' + (diff === '分层难度' ? '分层' : diff) + '难度练习题,题干由 AI 智能生成,考查核心概念与解题方法。'
                });
            }
            st.exercises = st.exercises.concat(newExs);
            teacherExerciseRecalcTotal();
            setTimeout(function () {
                closeModal();
                showToast('AI 已生成 ' + cnt + ' 道题,共 ' + st.exercises.length + ' 题');
                teacherExerciseReRender();
                teacherExerciseSaveState();
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

// 预览题目(弹窗显示完整内容)
function teacherExercisePreview(idx) {
    var e = teacherExerciseState.exercises[idx];
    if (!e) return;
    openModal('题目预览 - 第 ' + e.no + ' 题', ''
        + '<div style="padding:16px;font-size:13px;color:#374151;line-height:1.8;">'
        + '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">'
        + '<span style="background:#EFF6FF;color:#2563EB;padding:3px 10px;border-radius:6px;font-size:11px;">' + e.type + '</span>'
        + '<span style="background:#FEF3C7;color:#92400E;padding:3px 10px;border-radius:6px;font-size:11px;">' + e.diff + '</span>'
        + '<span style="background:#F3E8FF;color:#6B21A8;padding:3px 10px;border-radius:6px;font-size:11px;">' + e.point + '</span>'
        + '<span style="background:#FEE2E2;color:#991B1B;padding:3px 10px;border-radius:6px;font-size:11px;">' + e.score + '分</span>'
        + '</div>'
        + '<div style="padding:12px;background:#F9FAFB;border-radius:8px;margin-bottom:12px;font-size:13px;line-height:1.8;">' + (e.content || '') + '</div>'
        + '<div style="font-size:12px;color:#6B7280;"><i class="fas fa-lightbulb"></i> <b>AI 参考解析:</b><br>本题考查 ' + e.point + ',关键在于掌握基本概念与解题步骤,需结合题干条件逐步推导。</div>'
        + '</div>');
}

// 编辑题目(修改题型/难度/分值/内容)
function teacherExerciseEdit(idx) {
    var e = teacherExerciseState.exercises[idx];
    if (!e) return;
    var diffOpts = ['简单', '中等', '困难'].map(function (d) {
        return '<option ' + (d === e.diff ? 'selected' : '') + '>' + d + '</option>';
    }).join('');
    var typeOpts = ['选择题', '填空题', '解答题'].map(function (t) {
        return '<option ' + (t === e.type ? 'selected' : '') + '>' + t + '</option>';
    }).join('');
    openModal('编辑题目 - 第 ' + e.no + ' 题', ''
        + '<div style="padding:16px;font-size:13px;color:#374151;line-height:1.8;">'
        + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:12px;">'
        + '<div><div style="font-size:11px;color:#6B7280;margin-bottom:4px;">题型</div><select id="ex-edit-type" class="proto-input" style="height:36px;">' + typeOpts + '</select></div>'
        + '<div><div style="font-size:11px;color:#6B7280;margin-bottom:4px;">难度</div><select id="ex-edit-diff" class="proto-input" style="height:36px;">' + diffOpts + '</select></div>'
        + '<div><div style="font-size:11px;color:#6B7280;margin-bottom:4px;">分值</div><input id="ex-edit-score" class="proto-input" type="number" value="' + e.score + '" style="height:36px;"></div>'
        + '</div>'
        + '<div style="margin-bottom:12px;"><div style="font-size:11px;color:#6B7280;margin-bottom:4px;">题干内容</div><textarea id="ex-edit-content" class="proto-input" style="width:100%;min-height:80px;padding:8px;">' + teacherExerciseEsc(e.content || '') + '</textarea></div>'
        + '<div style="display:flex;gap:8px;">'
        + '<button class="proto-btn proto-btn-outline" style="flex:1;height:38px;border-radius:8px;" onclick="closeModal()">取消</button>'
        + '<button class="proto-btn proto-btn-primary" style="flex:1;height:38px;border-radius:8px;" onclick="teacherExerciseSaveEdit(' + idx + ')">保存修改</button>'
        + '</div></div>');
}

// 保存编辑
function teacherExerciseSaveEdit(idx) {
    var e = teacherExerciseState.exercises[idx];
    if (!e) return;
    var typeEl = document.getElementById('ex-edit-type');
    var diffEl = document.getElementById('ex-edit-diff');
    var scoreEl = document.getElementById('ex-edit-score');
    var contentEl = document.getElementById('ex-edit-content');
    if (typeEl) e.type = typeEl.value;
    if (diffEl) e.diff = diffEl.value;
    if (scoreEl) e.score = parseInt(scoreEl.value, 10) || e.score;
    if (contentEl) e.content = contentEl.value;
    teacherExerciseRecalcTotal();
    closeModal();
    showToast('已保存第 ' + e.no + ' 题的修改');
    teacherExerciseReRender();
    teacherExerciseSaveState();
}

// 换一题(AI 重新生成同知识点同难度的新题)
function teacherExerciseSwap(idx) {
    var e = teacherExerciseState.exercises[idx];
    if (!e) return;
    openModal('AI 换题 - 第 ' + e.no + ' 题', ''
        + '<div style="padding:18px;font-size:13px;line-height:1.9;color:#374151;">'
        + '<div style="text-align:center;padding:8px 0 14px;">'
        + '<i class="fas fa-spinner fa-spin" style="font-size:28px;color:#8B5CF6;"></i>'
        + '<div style="margin-top:10px;font-weight:600;color:#1F2937;">AI 正在换一道题...</div></div>'
        + '<div id="ex-swap-log" style="background:#F3F4F6;border-radius:8px;padding:10px 12px;font-size:12px;color:#6B7280;min-height:50px;">'
        + '<div>· 当前题号:第 ' + e.no + ' 题</div>'
        + '<div>· 题型:' + e.type + ' · 难度:' + e.diff + ' · 知识点:' + e.point + '</div></div></div>');
    var logEl = document.getElementById('ex-swap-log');
    var appendLog = function (msg) {
        if (!logEl) return;
        var div = document.createElement('div');
        div.textContent = '· ' + msg;
        logEl.appendChild(div);
    };
    var steps = ['分析原题特征', '检索相似题库', '生成新题干'];
    var stepIdx = 0;
    var progress = 0;
    var timer = setInterval(function () {
        progress += 25 + Math.random() * 10;
        if (progress >= 100) {
            progress = 100;
            clearInterval(timer);
            appendLog('换题完成');
            // 生成新题替换
            e.content = '【AI换题·' + e.point + '】' + e.type + '第' + e.no + '题:由 AI 重新生成,考查 ' + e.point + ',难度 ' + e.diff + ',题干内容已更新,要求运用核心方法求解。';
            setTimeout(function () {
                closeModal();
                showToast('第 ' + e.no + ' 题已换为新题');
                teacherExerciseReRender();
                teacherExerciseSaveState();
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

// 删除题目
function teacherExerciseDelete(idx) {
    var e = teacherExerciseState.exercises[idx];
    if (!e) return;
    openModal('确认删除 - 第 ' + e.no + ' 题', ''
        + '<div style="padding:16px;font-size:13px;line-height:1.8;color:#374151;">'
        + '<div style="text-align:center;padding:14px;background:#FEF2F2;border-radius:8px;margin-bottom:12px;">'
        + '<i class="fas fa-exclamation-triangle" style="font-size:28px;color:#EF4444;"></i>'
        + '<div style="margin-top:6px;font-weight:600;color:#EF4444;">确定删除第 ' + e.no + ' 题?</div></div>'
        + '<b>题目信息:</b><br>· 题型:' + e.type + '<br>· 难度:' + e.diff + '<br>· 分值:' + e.score + '分<br>'
        + '<div style="display:flex;gap:8px;margin-top:14px;">'
        + '<button class="proto-btn proto-btn-outline" style="flex:1;height:38px;border-radius:8px;" onclick="closeModal()">取消</button>'
        + '<button class="proto-btn proto-btn-primary" style="flex:1;height:38px;border-radius:8px;background:#EF4444;" onclick="teacherExerciseConfirmDelete(' + idx + ')">确认删除</button>'
        + '</div></div>');
}

// 确认删除
function teacherExerciseConfirmDelete(idx) {
    var e = teacherExerciseState.exercises[idx];
    var no = e ? e.no : '';
    teacherExerciseState.exercises.splice(idx, 1);
    // 重排题号
    teacherExerciseState.exercises.forEach(function (ex, i) { ex.no = i + 1; });
    teacherExerciseRecalcTotal();
    closeModal();
    showToast('已删除第 ' + no + ' 题');
    teacherExerciseReRender();
    teacherExerciseSaveState();
}

// 推送到班级
function teacherExercisePushToClass() {
    var st = teacherExerciseState;
    if (st.exercises.length === 0) {
        showToast('当前无题目,请先生成练习');
        return;
    }
    openModal('推送到班级', ''
        + '<div style="padding:18px;font-size:13px;line-height:1.9;color:#374151;">'
        + '<div style="text-align:center;padding:14px;background:#F0FDF4;border-radius:8px;margin-bottom:12px;">'
        + '<i class="fas fa-paper-plane" style="font-size:28px;color:#10B981;"></i>'
        + '<div style="margin-top:6px;font-weight:600;color:#10B981;">推送中...</div></div>'
        + '<b>推送信息:</b><br>· 班级:高三(1)班 · 45人<br>· 题目数:' + st.exercises.length + '题<br>· 总分:' + st.totalScore + '分<br>· 截止时间:今日 18:00<br>'
        + '<div style="text-align:center;margin-top:14px;"><button class="proto-btn proto-btn-primary" style="width:100%;height:40px;border-radius:8px;background:#10B981;" onclick="teacherExerciseConfirmPush()">确认推送</button></div>'
        + '</div>');
}

// 确认推送
function teacherExerciseConfirmPush() {
    closeModal();
    showToast('已推送到高三(1)班,共 ' + teacherExerciseState.exercises.length + ' 题');
    teacherExerciseSaveState();
}

// 打印发放
function teacherExercisePrint() {
    var st = teacherExerciseState;
    if (st.exercises.length === 0) {
        showToast('当前无题目,请先生成练习');
        return;
    }
    var pages = Math.ceil(st.exercises.length / 4);
    openModal('打印预览', ''
        + '<div style="padding:18px;font-size:13px;line-height:1.9;color:#374151;">'
        + '<div style="text-align:center;padding:14px;background:#F9FAFB;border:1px dashed #D1D5DB;border-radius:8px;margin-bottom:12px;">'
        + '<i class="fas fa-print" style="font-size:28px;color:#3B82F6;"></i>'
        + '<div style="margin-top:6px;font-weight:600;">打印预览已生成</div></div>'
        + '<b>打印信息:</b><br>· 纸张:A4<br>· 题目数:' + st.exercises.length + '题<br>· 总分:' + st.totalScore + '分<br>· 页数:' + pages + '页<br>'
        + '<div style="text-align:center;margin-top:14px;"><button class="proto-btn proto-btn-primary" style="width:100%;height:40px;border-radius:8px;" onclick="teacherExerciseConfirmPrint()">开始打印</button></div>'
        + '</div>');
}

// 确认打印
function teacherExerciseConfirmPrint() {
    closeModal();
    showToast('已发送打印任务,' + Math.ceil(teacherExerciseState.exercises.length / 4) + ' 页,请前往取件');
    teacherExerciseSaveState();
}

// 导出(PDF/Word/图片)
function teacherExerciseExport() {
    var st = teacherExerciseState;
    if (st.exercises.length === 0) {
        showToast('当前无题目,请先生成练习');
        return;
    }
    openModal('导出练习', ''
        + '<div style="padding:18px;font-size:13px;line-height:1.9;color:#374151;">'
        + '<div style="text-align:center;padding:14px;background:#EFF6FF;border-radius:8px;margin-bottom:12px;">'
        + '<i class="fas fa-file-download" style="font-size:28px;color:#3B82F6;"></i></div>'
        + '<b>导出选项:</b><br>· 题目数:' + st.exercises.length + '题<br>· 总分:' + st.totalScore + '分<br>'
        + '<div style="display:flex;gap:8px;margin-top:14px;">'
        + '<button class="proto-btn proto-btn-outline" style="flex:1;height:38px;border-radius:8px;" onclick="teacherExerciseConfirmExport(\'PDF\')"><i class="fas fa-file-pdf"></i> PDF</button>'
        + '<button class="proto-btn proto-btn-outline" style="flex:1;height:38px;border-radius:8px;" onclick="teacherExerciseConfirmExport(\'Word\')"><i class="fas fa-file-word"></i> Word</button>'
        + '<button class="proto-btn proto-btn-outline" style="flex:1;height:38px;border-radius:8px;" onclick="teacherExerciseConfirmExport(\'图片\')"><i class="fas fa-image"></i> 图片</button>'
        + '</div></div>');
}

// 确认导出
function teacherExerciseConfirmExport(fmt) {
    closeModal();
    showToast('已导出 ' + fmt + ' 格式,共 ' + teacherExerciseState.exercises.length + ' 题,下载链接已生成');
    teacherExerciseSaveState();
}

// 重新渲染
function teacherExerciseReRender() {
    var container = document.getElementById('teacher-exercise-content');
    if (container) teacherExerciseRenderPage(container);
}

// 保存状态到后端
function teacherExerciseSaveState() {
    if (typeof api === 'undefined' || !api.savePageData) return;
    var st = teacherExerciseState;
    // 构造与原 JSON 结构兼容的 payload
    var settings = st.settings;
    // 同步 selectedPoints 到 points 数组的 active 标志
    var points = (settings.points || []).map(function (p) {
        return { name: p.name, active: st.selectedPoints.indexOf(p.name) >= 0 };
    });
    settings.selectedDifficulty = st.selectedDifficulty;
    settings.selectedCount = st.selectedCount;
    settings.points = points;
    var payload = {
        settings: settings,
        exercises: st.exercises,
        totalScore: st.totalScore
    };
    api.savePageData('teacher-exercise', payload).then(function () {
        // 静默保存
    }).catch(function () {});
}

// 页面注册
registerPage('teacher-exercise', 'AI课堂练习', '教师后台', '', function () {
    if (typeof teacherLoadData === 'function') {
        teacherLoadData('teacher-exercise', function (container, data) {
            teacherExerciseInitState(data);
            teacherExerciseRenderPage(container);
        });
    } else {
        var container = document.getElementById('teacher-exercise-content');
        if (!container) {
            var screen = document.getElementById('device-screen');
            if (screen) {
                screen.innerHTML = '<div id="teacher-exercise-content"></div>';
                container = document.getElementById('teacher-exercise-content');
            }
        }
        if (container) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div>';
            if (typeof api !== 'undefined' && api.getPageData) {
                api.getPageData('teacher-exercise').then(function (data) {
                    teacherExerciseInitState(data || {});
                    teacherExerciseRenderPage(container);
                }).catch(function () {
                    teacherExerciseInitState({});
                    teacherExerciseRenderPage(container);
                });
            } else {
                teacherExerciseInitState({});
                teacherExerciseRenderPage(container);
            }
        }
    }
    return AdminPage('AI课堂练习', TEACHER_MENU, 'exercise', teacherLoading('teacher-exercise'));
});

// 暴露到 window,确保 onclick 内联属性可访问
window.teacherExerciseState = teacherExerciseState;
window.teacherExerciseInitState = teacherExerciseInitState;
window.teacherExerciseRecalcTotal = teacherExerciseRecalcTotal;
window.teacherExerciseEsc = teacherExerciseEsc;
window.teacherExerciseRenderPage = teacherExerciseRenderPage;
window.teacherExerciseTogglePoint = teacherExerciseTogglePoint;
window.teacherExerciseOnSelectChange = teacherExerciseOnSelectChange;
window.teacherExerciseGenerate = teacherExerciseGenerate;
window.teacherExercisePreview = teacherExercisePreview;
window.teacherExerciseEdit = teacherExerciseEdit;
window.teacherExerciseSaveEdit = teacherExerciseSaveEdit;
window.teacherExerciseSwap = teacherExerciseSwap;
window.teacherExerciseDelete = teacherExerciseDelete;
window.teacherExerciseConfirmDelete = teacherExerciseConfirmDelete;
window.teacherExercisePushToClass = teacherExercisePushToClass;
window.teacherExerciseConfirmPush = teacherExerciseConfirmPush;
window.teacherExercisePrint = teacherExercisePrint;
window.teacherExerciseConfirmPrint = teacherExerciseConfirmPrint;
window.teacherExerciseExport = teacherExerciseExport;
window.teacherExerciseConfirmExport = teacherExerciseConfirmExport;
window.teacherExerciseReRender = teacherExerciseReRender;
window.teacherExerciseSaveState = teacherExerciseSaveState;

console.log('[pages-teacher-exercise] AI课堂练习模块已加载 v20260820B');
