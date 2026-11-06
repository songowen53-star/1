// ============================================================
// 教师后台模块 - pages-teacher.js（动态加载：数据来自 /api/page-data/:key）
// ============================================================

// 教师后台菜单常量
const TEACHER_MENU = [
    { key: 'dashboard', icon: 'fa-chalkboard', label: '教学首页', page: 'teacher-dashboard' },
    { key: 'upload', icon: 'fa-upload', label: '上传试卷', page: 'teacher-upload' },
    { key: 'split', icon: 'fa-scissors', label: 'AI切题', page: 'teacher-split' },
    { key: 'parse', icon: 'fa-magic', label: 'AI解析', page: 'teacher-parse' },
    { key: 'tag', icon: 'fa-tags', label: 'AI标知识点', page: 'teacher-tag' },
    { key: 'exercise', icon: 'fa-file-signature', label: 'AI课堂练习', page: 'teacher-exercise' },
    { key: 'paper', icon: 'fa-file-export', label: 'AI组卷', page: 'teacher-paper' }
];

// 后台区块卡片（参数顺序：标题 / 头部右侧附加 / 主体内容）
function teacherCard(title, right, content) {
    return `<div style="background:white;border-radius:12px;padding:18px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        ${title ? `<div style="font-size:15px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;"><span>${title}</span>${right || ''}</div>` : ''}
        ${content}
    </div>`;
}

// 加载中占位内容
function teacherLoading(key) {
    return `<div id="${key}-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>`;
}

// 通用异步加载逻辑
function teacherLoadData(key, renderFn) {
    setTimeout(function () {
        var container = document.getElementById(key + '-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData(key).then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div></div>';
                return;
            }
            renderFn(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);
}

// ============================================================
// AI 重新切题：调用后端重新生成切题数据并刷新页面
// 解决原按钮只 openModal 静态弹窗、spinner 永不停止的问题
// ============================================================
function teacherReSplit() {
    // 第1步：打开带实时进度更新的加载弹窗（非静态 spinner）
    openModal('AI重新切题', ''
        + '<div style="padding:18px;font-size:13px;line-height:1.9;color:#374151;">'
        + '<div id="teacher-resplit-stage" style="text-align:center;padding:8px 0 14px;">'
        + '<i class="fas fa-spinner fa-spin" style="font-size:28px;color:#3B82F6;"></i>'
        + '<div style="margin-top:10px;font-weight:600;color:#1F2937;">AI 正在重新识别题目边界...</div>'
        + '</div>'
        + '<div id="teacher-resplit-log" style="background:#F3F4F6;border-radius:8px;padding:10px 12px;font-size:12px;color:#6B7280;min-height:60px;">'
        + '<div>· 启动重新切题流程...</div>'
        + '</div>'
        + '</div>'
    );

    var logEl = document.getElementById('teacher-resplit-log');
    var stageEl = document.getElementById('teacher-resplit-stage');
    var appendLog = function (msg) {
        if (!logEl) return;
        var div = document.createElement('div');
        div.textContent = '· ' + msg;
        logEl.appendChild(div);
    };

    // 先读取当前切题数据,获取试卷名(用于重新生成)
    api.getPageData('teacher-split').then(function (currentData) {
        var fileName = (currentData && currentData.fileName) ? currentData.fileName : '重新切题试卷.pdf';
        appendLog('读取当前试卷：' + fileName);

        // 第2步：模拟 AI 切题进度推进(0→100%),每 400ms 更新一次
        var progress = 0;
        var steps = ['检测页面边界', '识别题号位置', '切分题目区域', '推断题型与分值', '生成切题结果'];
        var stepIdx = 0;
        var timer = setInterval(function () {
            progress += 18 + Math.random() * 10;
            if (progress >= 100) {
                progress = 100;
                clearInterval(timer);
                appendLog('切题完成,识别置信度 96.8%');
                finishReSplit(fileName);
                return;
            }
            // 推进步骤日志
            var expectedStep = Math.min(Math.floor(progress / 20), steps.length - 1);
            if (expectedStep > stepIdx) {
                stepIdx = expectedStep;
                appendLog(steps[stepIdx] + '... ' + Math.round(progress) + '%');
            }
            // 更新 stage 进度数字
            if (stageEl) {
                var numEl = stageEl.querySelector('.resplit-pct');
                if (numEl) numEl.textContent = Math.round(progress) + '%';
            }
        }, 400);
    }).catch(function (e) {
        appendLog('读取当前数据失败,使用默认试卷名');
        finishReSplit('重新切题试卷.pdf');
    });

    // 第3步:重新生成切题数据,保存到后端,关闭弹窗并重新渲染页面
    function finishReSplit(fileName) {
        // 生成新的切题数据(题目数随机 5-8 题)
        var newCount = Math.floor(Math.random() * 4) + 5;
        var questions = [];
        var fullQuestions = [];
        var totalScore = 0;
        var typePool = ['选择题', '选择题', '填空题', '解答题'];
        var tplContent = {
            '选择题': { content: '设函数 f(x) = x³ - 3x + 1，则 f(x) 在区间 [-2, 2] 上的最大值为（  ）', options: ['-1','1','3','5'], answer: 'C',
                analysis: [{step:'第一步：',text:'求导 f\'(x)=3x²-3，令 f\'(x)=0 得 x=±1。'},{step:'第二步：',text:'计算端点及驻点：f(-2)=-1，f(-1)=3，f(1)=-1，f(2)=3。'},{step:'第三步：',text:'比较得最大值 f(-1)=f(2)=3，故选 C。'}],
                points: ['导数应用','函数最值','闭区间上连续函数'] },
            '填空题': { content: '已知等差数列 {aₙ} 中，a₁=2，a₃=6，则 a₅ = _________。', options: [], answer: '10',
                analysis: [{step:'第一步：',text:'由 a₃=a₁+2d 得 6=2+2d，解得 d=2。'},{step:'第二步：',text:'a₅=a₁+4d=2+4×2=10。'}],
                points: ['等差数列','通项公式','基本运算'] },
            '解答题': { content: '设函数 f(x) = ln x - ax + 1，其中 a ∈ R。\n(1) 讨论 f(x) 的单调性；\n(2) 若 f(x) ≤ 0 恒成立，求 a 的取值范围。', options: [], answer: '(1) 当 a≤0 时 f(x) 在 (0,+∞) 单调递增；当 a>0 时 在 (0,1/a) 单调递增，在 (1/a,+∞) 单调递减。(2) a ≥ 1。',
                analysis: [{step:'第一步：',text:'求导 f\'(x)=1/x-a (x>0)。'},{step:'第二步：',text:'分 a≤0 与 a>0 讨论单调性。'},{step:'第三步：',text:'由 f(x)≤0 恒成立，需 f(1)=1-a≤0 且最大值≤0，得 a≥1。'}],
                points: ['导数与单调性','恒成立问题','分类讨论'] }
        };
        for (var i = 1; i <= newCount; i++) {
            var typeIdx = Math.min(Math.floor((i - 1) / Math.ceil(newCount / 4)), 3);
            var type = typePool[typeIdx];
            var score = type === '选择题' ? 5 : type === '填空题' ? 5 : 12 + (i % 3) * 2;
            var diff = i <= 2 ? '简单' : i <= newCount - 2 ? '中等' : '困难';
            questions.push({ no: i, type: type, score: score, diff: diff });
            var tpl = tplContent[type] || tplContent['选择题'];
            fullQuestions.push({ no: i, type: type, score: score, diff: diff, content: tpl.content, options: tpl.options, answer: tpl.answer, analysis: tpl.analysis, points: tpl.points });
            totalScore += score;
        }
        var splitData = {
            fileName: fileName,
            preview: { currentPage: 1, totalPages: Math.max(Math.ceil(Math.random() * 3) + 2, 3) },
            questions: questions,
            fullQuestions: fullQuestions,
            stats: [
                { label: '识别题数', value: String(newCount), change: 0, color: 'blue' },
                { label: '总分值', value: totalScore + '分', change: 0, color: 'green' },
                { label: '识别准确率', value: '96%', change: 0, color: 'purple' },
                { label: '处理耗时', value: '3.2s', change: 0, color: 'orange' }
            ]
        };

        appendLog('正在保存切题结果到后端...');
        api.savePageData('teacher-split', splitData).then(function () {
            appendLog('保存成功,共识别 ' + newCount + ' 道题');
            // 第4步:1秒后关闭弹窗并显示结果,然后重新渲染切题页面
            setTimeout(function () {
                closeModal();
                // 显示完成结果弹窗
                openModal('重新切题完成', ''
                    + '<div style="padding:18px;font-size:13px;line-height:1.8;color:#374151;">'
                    + '<div style="text-align:center;padding:16px;background:#F0FDF4;border-radius:8px;margin-bottom:12px;">'
                    + '<i class="fas fa-check-circle" style="font-size:32px;color:#10B981;"></i>'
                    + '<div style="margin-top:8px;font-weight:600;color:#10B981;">重新切题完成</div>'
                    + '</div>'
                    + '<b>切题结果：</b><br>'
                    + '· 试卷：' + fileName + '<br>'
                    + '· 识别题数：' + newCount + ' 题<br>'
                    + '· 总分值：' + totalScore + ' 分<br>'
                    + '· 识别置信度：96.8%<br><br>'
                    + '<div style="text-align:center;margin-top:8px;">'
                    + '<button class="proto-btn proto-btn-primary" style="width:auto;padding:0 24px;height:38px;border-radius:8px;font-size:13px;" onclick="closeModal();navigateTo(\'teacher-split\')"><i class="fas fa-eye"></i>&nbsp; 查看切题结果</button>'
                    + '</div>'
                    + '</div>'
                );
                // 同时直接重新渲染切题页面(无需用户再点)
                setTimeout(function () { navigateTo('teacher-split'); }, 200);
            }, 600);
        }).catch(function (e) {
            appendLog('保存失败：' + (e && e.message ? e.message : '未知错误'));
            setTimeout(function () {
                closeModal();
                showToast('重新切题失败,请稍后重试', 'error');
            }, 800);
        });
    }
}

// ============================================================
// 试卷预览：渲染真实的模拟试卷页面(含题号、题干、切题框选高亮)
// 解决原试卷预览区只有图标本、无真实页面显示的问题
// ============================================================
function teacherRenderExamPage(currentPage, totalPages, questions) {
    currentPage = currentPage || 1;
    totalPages = totalPages || 5;
    questions = questions || [];

    // 每页显示的题目数(从第1题开始按页分配)
    var perPage = Math.max(2, Math.ceil(questions.length / totalPages));
    var startIdx = (currentPage - 1) * perPage;
    var endIdx = Math.min(startIdx + perPage, questions.length);
    var pageQuestions = questions.slice(startIdx, endIdx);

    // 模拟试卷页眉
    var html = ''
        + '<div style="text-align:center;border-bottom:2px solid #1F2937;padding-bottom:10px;margin-bottom:14px;">'
        + '<div style="font-size:18px;font-weight:700;letter-spacing:2px;">2025 年普通高等学校招生全国统一考试</div>'
        + '<div style="font-size:13px;color:#6B7280;margin-top:4px;">数学模拟卷 · 第 ' + currentPage + ' 页 / 共 ' + totalPages + ' 页</div>'
        + '<div style="font-size:11px;color:#9CA3AF;margin-top:2px;">本试卷共 ' + questions.length + ' 题,满分 150 分,考试用时 120 分钟</div>'
        + '</div>';

    // 注意事项(仅第1页显示)
    if (currentPage === 1) {
        html += '<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;padding:10px;margin-bottom:14px;font-size:12px;line-height:1.7;color:#92400E;">'
            + '<b>注意事项:</b><br>'
            + '1. 答题前,考生务必将自己的姓名、准考证号填写在答题卡上。<br>'
            + '2. 选择题答案使用 2B 铅笔填涂,非选择题答案使用 0.5 毫米黑色签字笔书写。'
            + '</div>';
    }

    // 渲染本页题目(含切题框选高亮) — 使用真实题目内容
    if (pageQuestions.length === 0) {
        html += '<div style="text-align:center;padding:40px;color:#9CA3AF;font-size:13px;">'
            + '<i class="fas fa-file-alt" style="font-size:32px;color:#D1D5DB;margin-bottom:8px;"></i><br>'
            + '本页暂无切题内容</div>';
    } else {
        pageQuestions.forEach(function (q, idx) {
            var globalNo = startIdx + idx + 1;
            // 切题框选:用蓝色虚线框 + 半透明蓝色背景模拟 AI 切题的题目边界
            html += '<div style="border:2px dashed #3B82F6;background:rgba(59,130,246,0.06);border-radius:6px;padding:10px;margin-bottom:12px;position:relative;">'
                + '<div style="position:absolute;top:-10px;left:10px;background:#3B82F6;color:white;font-size:10px;padding:2px 8px;border-radius:10px;font-weight:600;">'
                + 'AI 框选 #' + globalNo + '</div>'
                + '<div style="font-weight:700;margin-bottom:6px;margin-top:4px;">' + (q.no || globalNo) + '. ' + (q.type || '选择题') + '(本题 ' + (q.score || 5) + ' 分)</div>';

            // 题干：优先使用真实 content，否则回退到模拟内容
            var qContent = q.content || '';
            if (q.type === '选择题' && q.options && q.options.length) {
                html += '<div style="margin-bottom:6px;white-space:pre-wrap;">' + qContent + '</div>'
                    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px;color:#374151;">';
                var optLabels = ['A','B','C','D','E','F'];
                q.options.forEach(function (opt, oi) {
                    html += '<div>' + optLabels[oi] + '. ' + opt + '</div>';
                });
                html += '</div>';
            } else if (q.type === '填空题') {
                html += '<div style="margin-bottom:6px;white-space:pre-wrap;">' + qContent + '</div>'
                    + '<div style="height:1px;background:#D1D5DB;margin:8px 0;"></div>'
                    + '<div style="font-size:11px;color:#9CA3AF;">考生作答区(横线)</div>';
            } else {
                html += '<div style="margin-bottom:6px;white-space:pre-wrap;">' + qContent + '</div>'
                    + '<div style="height:60px;border-bottom:1px dashed #D1D5DB;margin-top:8px;"></div>'
                    + '<div style="font-size:11px;color:#9CA3AF;margin-top:4px;">考生作答区(空白)</div>';
            }

            // 难度标识
            var diffColor = q.diff === '简单' ? '#10B981' : q.diff === '中等' ? '#F59E0B' : '#EF4444';
            html += '<div style="font-size:10px;color:' + diffColor + ';margin-top:6px;border-top:1px solid #E5E7EB;padding-top:4px;">'
                + '<i class="fas fa-signal"></i> 难度: ' + (q.diff || '中等')
                + ' · 置信度 96.8%'
                + '</div>';

            html += '</div>';
        });
    }

    // 页脚
    html += '<div style="text-align:center;font-size:10px;color:#9CA3AF;margin-top:10px;border-top:1px solid #E5E7EB;padding-top:8px;">'
        + '— 第 ' + currentPage + ' 页 · 试卷预览(由 AI 自动切题框选)— '
        + '</div>';

    return html;
}

// 试卷预览翻页
function teacherChangePage(delta) {
    var infoEl = document.getElementById('teacher-split-pageinfo');
    var previewEl = document.getElementById('teacher-split-preview');
    if (!infoEl || !previewEl) return;

    var match = infoEl.textContent.match(/第\s*(\d+)\s*页\s*\/\s*共\s*(\d+)\s*页/);
    if (!match) return;
    var current = parseInt(match[1]);
    var total = parseInt(match[2]);
    var next = current + delta;

    if (next < 1) {
        showToast('已是第一页');
        return;
    }
    if (next > total) {
        showToast('已是最后一页');
        return;
    }

    // 更新页码显示
    infoEl.textContent = '第' + next + '页 / 共' + total + '页';

    // 重新渲染试卷页面(从当前选中试卷的完整数据获取 questions)
    var papers = (window._teacherSplitState && window._teacherSplitState.papers) ? window._teacherSplitState.papers : [];
    var curPaper = papers[window._teacherSplitState.currentPaper] || papers[0];
    var questions = (curPaper && curPaper.fullQuestions) ? curPaper.fullQuestions : [];
    if (questions.length > 0) {
        previewEl.scrollTop = 0;
        previewEl.innerHTML = teacherRenderExamPage(next, total, questions);
        showToast('已切换到第 ' + next + ' 页');
    } else {
        api.getPageData('teacher-split').then(function (data) {
            if (!data) { previewEl.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;">数据加载失败</div>'; return; }
            var qs = data.fullQuestions || data.questions || [];
            previewEl.scrollTop = 0;
            previewEl.innerHTML = teacherRenderExamPage(next, total, qs);
            showToast('已切换到第 ' + next + ' 页');
        }).catch(function (e) {
            previewEl.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;">加载失败: ' + (e.message || '') + '</div>';
        });
    }
}

// ============================================================
// 1. 教学首页
// ============================================================
registerPage('teacher-dashboard', '教学首页', '教师后台', '', function () {
    teacherLoadData('teacher-dashboard', function (container, data) {
        const teacher = data.teacher || {};
        const stats = data.stats || [];
        const classes = data.classes || [];
        const tasks = data.tasks || [];
        const quickTiles = data.quickTiles || [];

        const statsHtml = stats.map(s => StatCard(s.label, s.value, s.change, s.color)).join('');

        const classesHtml = classes.map(c => `
            <div style="border-radius:10px;padding:14px;background:linear-gradient(135deg,${c.color}15,${c.color}08);border:1px solid ${c.color}30;cursor:pointer;" onclick="navigateTo('teacher-exercise')">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                    <div style="width:32px;height:32px;border-radius:8px;background:${c.color};display:flex;align-items:center;justify-content:center;"><i class="fas fa-users" style="color:white;font-size:13px;"></i></div>
                    <span style="font-size:13px;font-weight:700;color:${c.color};">${c.name}</span>
                </div>
                <div style="font-size:12px;color:#6B7280;margin-bottom:8px;">${c.students}名学生 · ${c.subject}</div>
                <div style="display:flex;justify-content:space-between;font-size:12px;">
                    <div><div style="color:#9CA3AF;font-size:11px;">平均分</div><div style="font-weight:700;color:${c.color};">${c.avg}</div></div>
                    <div><div style="color:#9CA3AF;font-size:11px;">待处理</div><div style="font-weight:700;color:#F59E0B;">${c.pending}</div></div>
                </div>
            </div>
        `).join('');

        const tasksHtml = tasks.map(t => {
            const statusText = t.progress === 100 ? '已完成' : t.progress === 0 ? '待开始' : '进行中';
            return `
            <div style="padding:12px;background:#F9FAFB;border-radius:10px;border-left:3px solid ${t.color};cursor:pointer;" onclick="openModal('教学任务详情', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b>任务：</b>${t.title}<br><b>描述：</b>${t.desc}<br><b>进度：</b>${t.progress}%<br><b>状态：</b>${statusText}<br><br><div style=&quot;background:#F3F4F6;border-radius:8px;padding:8px;&quot;><b>建议步骤：</b><br>1. 准备相关教学资料<br>2. 进入对应模块执行任务<br>3. 完成后可在此处更新状态</div></div>')">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                    <span style="font-size:14px;font-weight:600;">${t.title}</span>
                    ${t.progress === 100 ? '<span style="background:#D1FAE5;color:#065F46;padding:2px 8px;border-radius:6px;font-size:11px;">已完成</span>' : t.progress === 0 ? '<span style="background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:6px;font-size:11px;">待开始</span>' : '<span style="background:#DBEAFE;color:#1E40AF;padding:2px 8px;border-radius:6px;font-size:11px;">进行中</span>'}
                </div>
                <div style="font-size:12px;color:#6B7280;margin-bottom:8px;">${t.desc}</div>
                ${Progress(t.progress, t.color)}
            </div>`;
        }).join('');

        const tilesHtml = quickTiles.map(t => QuickTile(t.icon, t.bg, t.label, t.page)).join('');

        container.innerHTML = `
            <!-- 教师信息卡片 -->
            <div style="background:linear-gradient(135deg,#3B82F6,#1D4ED8);border-radius:12px;padding:18px;color:white;margin-bottom:16px;display:flex;align-items:center;gap:14px;">
                <div style="width:56px;height:56px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0;">
                    <i class="fas fa-chalkboard-teacher"></i>
                </div>
                <div style="flex:1;">
                    <div style="font-size:17px;font-weight:700;">${teacher.name} <span style="font-size:12px;background:rgba(255,255,255,0.2);padding:2px 8px;border-radius:8px;margin-left:6px;">${teacher.subject}</span></div>
                    <div style="font-size:12px;opacity:0.9;margin-top:4px;">${teacher.school} · ${teacher.title} · 教龄${teacher.years}年</div>
                </div>
                <div style="text-align:center;background:rgba(255,255,255,0.18);border-radius:10px;padding:8px 12px;">
                    <div style="font-size:18px;font-weight:700;">${teacher.students}</div>
                    <div style="font-size:10px;opacity:0.9;">学生总数</div>
                </div>
            </div>

            <!-- 今日数据 -->
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:16px;">${statsHtml}</div>

            <!-- 班级列表 -->
            ${teacherCard('我的班级', '<span style="font-size:12px;color:#3B82F6;cursor:pointer;" onclick="openModal(\'我的班级\', \'<div style=&quot;padding:14px;font-size:13px;color:#374151;line-height:1.8;&quot;>共 3 个班级，142 名学生。<br>高三(1)班 · 平均分 82<br>高三(2)班 · 平均分 78<br>高三(3)班 · 平均分 85</div>\')">查看全部 ›</span>', `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">${classesHtml}</div>`)}

            <!-- 今日教学任务 -->
            ${teacherCard('今日教学任务', `<span style="font-size:12px;color:#6B7280;">${tasks.length} 项</span>`, `<div style="display:flex;flex-direction:column;gap:12px;">${tasksHtml}</div>`)}

            <!-- 快捷功能 -->
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">${tilesHtml}</div>
        `;
    });

    return AdminPage('教学首页', TEACHER_MENU, 'dashboard', teacherLoading('teacher-dashboard'));
});

// ============================================================
// 2. 上传试卷
// ============================================================
registerPage('teacher-upload', '上传试卷', '教师后台', '', function () {
    teacherLoadData('teacher-upload', function (container, data) {
        var uploaded = data.uploaded || [];

        function renderUploadedList() {
            var list = document.getElementById('teacher-upload-list');
            if (!list) return;
            if (uploaded.length === 0) {
                list.innerHTML = '<div style="text-align:center;padding:30px;color:#9CA3AF;font-size:13px;">暂无上传记录</div>';
                return;
            }
            list.innerHTML = uploaded.map(function (u) {
                return '<div style="display:flex;align-items:center;gap:14px;padding:14px;background:#F9FAFB;border-radius:10px;">' +
                    '<div style="width:44px;height:44px;border-radius:10px;background:' + (u.status === '已解析' ? '#D1FAE5' : u.status === '切题中' ? '#DBEAFE' : '#FEF3C7') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
                    '<i class="fas fa-file-alt" style="color:' + (u.status === '已解析' ? '#10B981' : u.status === '切题中' ? '#3B82F6' : '#F59E0B') + ';font-size:18px;"></i>' +
                    '</div>' +
                    '<div style="flex:1;">' +
                    '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:13px;font-weight:600;">' + u.name + '</span><span style="font-size:11px;color:#9CA3AF;">' + u.size + '</span></div>' +
                    '<div style="font-size:11px;color:#9CA3AF;margin-top:2px;">' + u.time + '</div>' +
                    '<div style="margin-top:8px;">' + Progress(u.progress, u.status === '已解析' ? '#10B981' : '#3B82F6') + '</div>' +
                    '</div>' +
                    '<div style="text-align:right;">' +
                    (u.status === '已解析' ? '<span style="background:#D1FAE5;color:#065F46;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:600;">已解析</span>'
                    : u.status === '切题中' ? '<span style="background:#DBEAFE;color:#1E40AF;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:600;">切题中</span>'
                    : '<span style="background:#FEF3C7;color:#92400E;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:600;">已上传</span>') +
                    '<div style="margin-top:6px;">' +
                    '<a style="font-size:12px;color:#3B82F6;cursor:pointer;" onclick="openModal(\'试卷详情\', \'<div style=&quot;padding:14px;font-size:13px;color:#374151;line-height:1.8;&quot;>试卷：' + u.name + '<br>大小：' + u.size + '<br>上传时间：' + u.time + '<br>状态：' + u.status + '</div>\')">查看</a>' +
                    (u.status === '已上传' || u.status === '切题中' ? '<a style="font-size:12px;color:#8B5CF6;cursor:pointer;margin-left:8px;" onclick="navigateTo(\'teacher-split\')">开始切题</a>' : '') +
                    '</div>' +
                    '</div>' +
                '</div>';
            }).join('');
            var countEl = document.getElementById('teacher-upload-count');
            if (countEl) countEl.textContent = '共 ' + uploaded.length + ' 份';
        }

        function formatFileSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }

        // 为新上传的试卷生成 AI 切题数据（含完整题干/选项/答案/解析/知识点）
        function generateSplitDataForFile(fileName, fileSizeBytes) {
            var baseName = fileName.replace(/\.[^.]+$/, '');
            var totalPages = Math.max(Math.ceil(fileSizeBytes / 30000) + 2, 3);
            var questionCount = Math.floor(Math.random() * 4) + 5; // 5-8 题
            var questions = [];
            var fullQuestions = [];
            var totalScore = 0;
            var typePool = ['选择题', '选择题', '填空题', '解答题'];
            // 按题型的模板内容（用于新上传试卷的模拟数据）
            var tplContent = {
                '选择题': {
                    content: '设函数 f(x) = x³ - 3x + 1，则 f(x) 在区间 [-2, 2] 上的最大值为（  ）',
                    options: ['-1', '1', '3', '5'],
                    answer: 'C',
                    analysis: [
                        { step: '第一步：', text: '求导 f\'(x) = 3x² - 3，令 f\'(x)=0 得 x=±1。' },
                        { step: '第二步：', text: '计算端点及驻点：f(-2)= -1，f(-1)=3，f(1)=-1，f(2)=3。' },
                        { step: '第三步：', text: '比较得最大值 f(-1)=f(2)=3，故选 C。' }
                    ],
                    points: ['导数应用', '函数最值', '闭区间上连续函数']
                },
                '填空题': {
                    content: '已知等差数列 {aₙ} 中，a₁=2，a₃=6，则 a₅ = _________。',
                    options: [],
                    answer: '10',
                    analysis: [
                        { step: '第一步：', text: '由 a₃=a₁+2d 得 6=2+2d，解得 d=2。' },
                        { step: '第二步：', text: 'a₅=a₁+4d=2+4×2=10。' }
                    ],
                    points: ['等差数列', '通项公式', '基本运算']
                },
                '解答题': {
                    content: '设函数 f(x) = ln x - ax + 1，其中 a ∈ R。\n(1) 讨论 f(x) 的单调性；\n(2) 若 f(x) ≤ 0 恒成立，求 a 的取值范围。',
                    options: [],
                    answer: '(1) 当 a≤0 时 f(x) 在 (0,+∞) 单调递增；当 a>0 时 在 (0,1/a) 单调递增，在 (1/a,+∞) 单调递减。(2) a ≥ 1。',
                    analysis: [
                        { step: '第一步：', text: '求导 f\'(x) = 1/x - a (x>0)。' },
                        { step: '第二步：', text: '分 a≤0 与 a>0 讨论单调性。' },
                        { step: '第三步：', text: '由 f(x)≤0 恒成立，需 f(1)=1-a≤0 且最大值 ≤0，得 a≥1。' }
                    ],
                    points: ['导数与单调性', '恒成立问题', '分类讨论']
                }
            };
            for (var i = 1; i <= questionCount; i++) {
                var typeIdx = Math.min(Math.floor((i - 1) / Math.ceil(questionCount / 4)), 3);
                var type = typePool[typeIdx];
                var score = type === '选择题' ? 5 : type === '填空题' ? 5 : 12 + (i % 3) * 2;
                var diff = i <= 2 ? '简单' : i <= questionCount - 2 ? '中等' : '困难';
                questions.push({ no: i, type: type, score: score, diff: diff });
                var tpl = tplContent[type] || tplContent['选择题'];
                fullQuestions.push({
                    no: i, type: type, score: score, diff: diff,
                    content: tpl.content, options: tpl.options, answer: tpl.answer,
                    analysis: tpl.analysis, points: tpl.points
                });
                totalScore += score;
            }
            return {
                fileName: fileName,
                preview: { currentPage: 1, totalPages: totalPages },
                questions: questions,
                fullQuestions: fullQuestions,
                stats: [
                    { label: '识别题数', value: String(questionCount), change: 0, color: 'blue' },
                    { label: '总分值', value: totalScore + '分', change: 0, color: 'green' },
                    { label: '识别准确率', value: '96%', change: 0, color: 'purple' },
                    { label: '处理耗时', value: '3.2s', change: 0, color: 'orange' }
                ]
            };
        }

        function handleFileSelect(fileList) {
            if (!fileList || fileList.length === 0) return;
            var file = fileList[0];
            if (!file || !file.name) return;
            var ext = (file.name.split('.').pop() || '').toLowerCase();
            var allowedExts = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];
            if (allowedExts.indexOf(ext) === -1) {
                showToast('不支持的文件格式：' + (ext || '未知') + '，请上传 PDF/Word/图片');
                return;
            }
            if (file.size > 50 * 1024 * 1024) {
                showToast('文件大小超过 50MB 限制');
                return;
            }

            var now = new Date();
            var timeStr = '今天 ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
            var newEntry = {
                name: file.name,
                size: formatFileSize(file.size),
                time: timeStr,
                status: '已上传',
                progress: 10
            };

            var uploadArea = document.getElementById('teacher-upload-outer');
            if (uploadArea) {
                uploadArea.innerHTML =
                    '<div id="teacher-upload-area" style="border:2px dashed #3B82F6;border-radius:12px;padding:20px;text-align:center;background:#EFF6FF;margin-bottom:16px;">' +
                    '<i class="fas fa-spinner fa-spin" style="font-size:28px;color:#3B82F6;margin-bottom:10px;"></i>' +
                    '<div style="font-size:14px;font-weight:600;color:#1F2937;">正在上传 ' + file.name + '...</div>' +
                    '<div style="font-size:12px;color:#6B7280;margin-top:4px;">' + formatFileSize(file.size) + '</div>' +
                    '<div style="margin-top:12px;max-width:300px;margin-left:auto;margin-right:auto;">' + Progress(10, '#3B82F6') + '</div>' +
                    '</div>';
            }

            var formData = null;
            try {
                formData = new FormData();
                formData.append('file', file);
                formData.append('name', file.name);
                formData.append('size', formatFileSize(file.size));
            } catch (e) { formData = null; }

            function uploadProgress() {
                var prog = 10;
                var timer = setInterval(function () {
                    prog += Math.random() * 30;
                    if (prog >= 100) {
                        prog = 100;
                        clearInterval(timer);
                        newEntry.progress = 30;
                        newEntry.status = '切题中';
                        uploaded.unshift(newEntry);
                        if (typeof api !== 'undefined' && api.savePageData) {
                            api.savePageData('teacher-upload', { uploaded: uploaded }).catch(function () {});
                        }
                        // 为新试卷生成 AI 切题数据并保存，使 AI 切题页面显示新试卷内容
                        var splitData = generateSplitDataForFile(file.name, file.size);
                        if (typeof api !== 'undefined' && api.savePageData) {
                            api.savePageData('teacher-split', splitData).catch(function () {});
                        }
                        if (uploadArea) {
                            uploadArea.innerHTML = getUploadAreaHtml();
                            bindUploadEvents();
                        }
                        renderUploadedList();
                        showToast('试卷上传成功，AI切题已自动启动：' + file.name);
                        setTimeout(function () {
                            openModal('上传成功', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><div style=&quot;text-align:center;padding:16px;background:#F0FDF4;border-radius:8px;margin-bottom:10px;&quot;><i class=&quot;fas fa-check-circle&quot; style=&quot;font-size:32px;color:#10B981;&quot;></i><div style=&quot;margin-top:8px;font-weight:600;color:#10B981;&quot;>试卷上传成功</div></div><b>文件信息：</b><br>· 文件名：' + file.name + '<br>· 大小：' + formatFileSize(file.size) + '<br>· 识别题数：' + splitData.questions.length + ' 题<br>· 总分值：' + splitData.stats[1].value + '<br>· 状态：AI切题中<br><br><div style=&quot;text-align:center;margin-top:10px;&quot;><button class=&quot;proto-btn proto-btn-primary&quot; style=&quot;width:auto;padding:0 24px;height:38px;border-radius:8px;font-size:13px;&quot; onclick=&quot;closeModal();navigateTo(\\&quot;teacher-split\\&quot;)&quot;><i class=&quot;fas fa-arrow-right&quot;></i>&nbsp; 查看AI切题结果</button></div></div>');
                        }, 300);
                    } else {
                        if (uploadArea) {
                            var progBar = uploadArea.querySelector('.proto-progress-bar');
                            if (progBar) progBar.style.width = prog + '%';
                        }
                    }
                }, 400);
            }

            if (formData && typeof api !== 'undefined' && api.uploadPaper) {
                api.uploadPaper(formData).then(function () { uploadProgress(); }).catch(function () { uploadProgress(); });
            } else {
                uploadProgress();
            }
        }

        // 生成上传区域 HTML（核心：用 <label> 包裹 <input type="file">，不依赖 JS 触发）
        // file input 绝对定位透明覆盖整个区域，保证 user gesture 直接命中原生控件
        function getUploadAreaHtml() {
            return '<div id="teacher-upload-area" style="border:2px dashed #3B82F6;border-radius:12px;padding:32px;text-align:center;background:#EFF6FF;margin-bottom:16px;position:relative;">' +
                '<label for="teacher-file-input" style="display:block;position:relative;z-index:1;cursor:pointer;">' +
                '<div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#1D4ED8);margin:0 auto 14px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(59,130,246,0.3);pointer-events:none;">' +
                '<i class="fas fa-cloud-upload-alt" style="color:white;font-size:26px;"></i>' +
                '</div>' +
                '<div style="font-size:16px;font-weight:700;color:#1F2937;pointer-events:none;">点击或拖拽文件到此处上传</div>' +
                '<div style="font-size:12px;color:#6B7280;margin-top:6px;pointer-events:none;">支持 PDF / Word / 图片格式，单个文件最大 50 MB</div>' +
                '<div class="proto-btn proto-btn-primary" style="display:inline-flex;align-items:center;justify-content:center;width:auto;padding:0 28px;height:42px;border-radius:21px;margin-top:14px;pointer-events:none;"><i class="fas fa-folder-open"></i>&nbsp; 选择文件</div>' +
                '</label>' +
                '<input type="file" id="teacher-file-input" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style="position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer;">' +
                '</div>';
        }

        function bindUploadEvents() {
            var fileInput = document.getElementById('teacher-file-input');
            var uploadArea = document.getElementById('teacher-upload-area');
            if (fileInput) {
                fileInput.addEventListener('change', function () {
                    var files = this.files;
                    this.value = '';
                    handleFileSelect(files);
                }, false);
            }
            if (uploadArea) {
                uploadArea.addEventListener('dragover', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.style.borderColor = '#1D4ED8';
                    this.style.background = '#DBEAFE';
                }, false);
                uploadArea.addEventListener('dragleave', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.style.borderColor = '#3B82F6';
                    this.style.background = '#EFF6FF';
                }, false);
                uploadArea.addEventListener('drop', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    this.style.borderColor = '#3B82F6';
                    this.style.background = '#EFF6FF';
                    if (e.dataTransfer && e.dataTransfer.files) {
                        handleFileSelect(e.dataTransfer.files);
                    }
                }, false);
            }
        }

        var uploadedHtml = uploaded.map(function (u) {
            return '<div style="display:flex;align-items:center;gap:14px;padding:14px;background:#F9FAFB;border-radius:10px;">' +
                '<div style="width:44px;height:44px;border-radius:10px;background:' + (u.status === '已解析' ? '#D1FAE5' : u.status === '切题中' ? '#DBEAFE' : '#FEF3C7') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;">' +
                '<i class="fas fa-file-alt" style="color:' + (u.status === '已解析' ? '#10B981' : u.status === '切题中' ? '#3B82F6' : '#F59E0B') + ';font-size:18px;"></i>' +
                '</div>' +
                '<div style="flex:1;">' +
                '<div style="display:flex;align-items:center;gap:8px;"><span style="font-size:13px;font-weight:600;">' + u.name + '</span><span style="font-size:11px;color:#9CA3AF;">' + u.size + '</span></div>' +
                '<div style="font-size:11px;color:#9CA3AF;margin-top:2px;">' + u.time + '</div>' +
                '<div style="margin-top:8px;">' + Progress(u.progress, u.status === '已解析' ? '#10B981' : '#3B82F6') + '</div>' +
                '</div>' +
                '<div style="text-align:right;">' +
                (u.status === '已解析' ? '<span style="background:#D1FAE5;color:#065F46;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:600;">已解析</span>'
                : u.status === '切题中' ? '<span style="background:#DBEAFE;color:#1E40AF;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:600;">切题中</span>'
                : '<span style="background:#FEF3C7;color:#92400E;padding:3px 10px;border-radius:6px;font-size:12px;font-weight:600;">已上传</span>') +
                '<div style="margin-top:6px;">' +
                '<a style="font-size:12px;color:#3B82F6;cursor:pointer;" onclick="openModal(\'试卷详情\', \'<div style=&quot;padding:14px;font-size:13px;color:#374151;line-height:1.8;&quot;>试卷：' + u.name + '<br>大小：' + u.size + '<br>上传时间：' + u.time + '<br>状态：' + u.status + '</div>\')">查看</a>' +
                (u.status === '已上传' ? '<a style="font-size:12px;color:#8B5CF6;cursor:pointer;margin-left:8px;" onclick="navigateTo(\'teacher-split\')">开始切题</a>' : '') +
                '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        container.innerHTML =
            '<div id="teacher-upload-outer">' + getUploadAreaHtml() + '</div>' +
            '<div style="background:#FFF7ED;border-left:4px solid #F59E0B;border-radius:8px;padding:12px 16px;margin-bottom:16px;display:flex;align-items:flex-start;gap:10px;">' +
            '<i class="fas fa-lightbulb" style="color:#F59E0B;font-size:16px;margin-top:2px;"></i>' +
            '<div style="font-size:12px;color:#92400E;line-height:1.6;">上传后将自动触发 <b>AI切题</b> 与 <b>AI解析</b> 流程，建议上传清晰度较高的 PDF 文件以获得最佳识别效果。</div>' +
            '</div>' +
            teacherCard('已上传试卷', '<span id="teacher-upload-count" style="font-size:12px;color:#6B7280;">共 ' + uploaded.length + ' 份</span>', '<div id="teacher-upload-list" style="display:flex;flex-direction:column;gap:12px;">' + uploadedHtml + '</div>');

        bindUploadEvents();
    });

    return AdminPage('上传试卷', TEACHER_MENU, 'upload', teacherLoading('teacher-upload'));
});

// ============================================================
// 3. AI切题
// ============================================================
// 全局状态：当前选中的试卷索引 + 完整切题数据
window._teacherSplitState = { currentPaper: 0, papers: [] };

registerPage('teacher-split', 'AI切题', '教师后台', '', function () {
    teacherLoadData('teacher-split', function (container, data) {
        // 支持多试卷格式(data.papers)与旧单试卷格式
        var papers = (data && data.papers && data.papers.length) ? data.papers : [];
        if (papers.length === 0 && data && data.fileName) {
            papers.push({ fileName: data.fileName, preview: data.preview, questions: data.questions, stats: data.stats, fullQuestions: data.fullQuestions || data.questions });
        }
        window._teacherSplitState.papers = papers;
        var curIdx = (typeof data.currentPaper === 'number') ? data.currentPaper : 0;
        if (curIdx < 0 || curIdx >= papers.length) curIdx = 0;
        window._teacherSplitState.currentPaper = curIdx;

        function renderSplitPage() {
            var cur = papers[window._teacherSplitState.currentPaper] || papers[0];
            if (!cur) { container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;">暂无切题数据</div>'; return; }
            var fileName = cur.fileName || '';
            var preview = cur.preview || {};
            // 使用 fullQuestions（含完整题干/选项/答案/解析/知识点），回退到 questions
            var fullQuestions = cur.fullQuestions || cur.questions || [];
            var questions = cur.questions || [];
            var stats = cur.stats || [];

            var statsHtml = stats.map(s => StatCard(s.label, s.value, s.change, s.color)).join('');
            var choiceCount = questions.filter(function (q) { return q.type === '选择题'; }).length;
            var fillCount = questions.filter(function (q) { return q.type === '填空题'; }).length;
            var solveCount = questions.filter(function (q) { return q.type === '解答题'; }).length;

            // 试卷选择器
            var paperTabs = papers.map(function (p, i) {
                var active = i === window._teacherSplitState.currentPaper;
                return '<div onclick="teacherSelectPaper(' + i + ')" style="padding:6px 12px;border-radius:16px;font-size:12px;cursor:pointer;white-space:nowrap;background:' + (active ? '#3B82F6' : '#EFF6FF') + ';color:' + (active ? 'white' : '#2563EB') + ';font-weight:' + (active ? '700' : '500') + ';">' + p.fileName.replace(/\.[^.]+$/, '') + '</div>';
            }).join('');

            var questionsHtml = fullQuestions.map(function (q) {
                var optHtml = '';
                if (q.type === '选择题' && q.options && q.options.length) {
                    var optLabels = ['A','B','C','D','E','F'];
                    optHtml = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px;color:#374151;margin-top:6px;">';
                    q.options.forEach(function (o, oi) { optHtml += '<div>' + optLabels[oi] + '. ' + o + '</div>'; });
                    optHtml += '</div>';
                }
                return '<div style="padding:12px;background:#F9FAFB;border-radius:10px;border-left:3px solid #3B82F6;">'
                    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">'
                    + '<div style="display:flex;align-items:center;gap:8px;">'
                    + '<div style="width:28px;height:28px;border-radius:50%;background:#3B82F6;color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">' + q.no + '</div>'
                    + '<span style="font-size:13px;font-weight:600;">第 ' + q.no + ' 题</span>'
                    + '<span style="background:#EFF6FF;color:#2563EB;padding:1px 8px;border-radius:6px;font-size:11px;">' + q.type + '</span>'
                    + '</div>'
                    + '<i class="fas fa-edit" style="color:#8B5CF6;cursor:pointer;font-size:13px;" onclick="openModal(\'编辑题目\', \'<div style=&quot;padding:14px;font-size:13px;color:#374151;line-height:1.8;&quot;>编辑第 ' + q.no + ' 题的切题框选区域与题型、分值、难度属性。</div>\')"></i>'
                    + '</div>'
                    + '<div style="font-size:13px;color:#1F2937;line-height:1.7;white-space:pre-wrap;margin-bottom:6px;">' + (q.content || '') + '</div>'
                    + optHtml
                    + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;">'
                    + '<div style="flex:1;"><div style="font-size:11px;color:#9CA3AF;margin-bottom:4px;">题型</div>'
                    + '<select style="width:100%;padding:6px 8px;border:1px solid #E5E7EB;border-radius:6px;font-size:12px;background:white;" onchange="showToast(\'已设置题型：\'+this.value)"><option' + (q.type === '选择题' ? ' selected' : '') + '>选择题</option><option' + (q.type === '填空题' ? ' selected' : '') + '>填空题</option><option' + (q.type === '解答题' ? ' selected' : '') + '>解答题</option></select></div>'
                    + '<div style="width:80px;"><div style="font-size:11px;color:#9CA3AF;margin-bottom:4px;">分值</div>'
                    + '<input type="number" value="' + q.score + '" style="width:100%;padding:6px 8px;border:1px solid #E5E7EB;border-radius:6px;font-size:12px;" onchange="showToast(\'已设置分值：\'+this.value+\'分\')"></div>'
                    + '<div style="width:80px;"><div style="font-size:11px;color:#9CA3AF;margin-bottom:4px;">难度</div>'
                    + '<select style="width:100%;padding:6px 8px;border:1px solid #E5E7EB;border-radius:6px;font-size:12px;background:white;" onchange="showToast(\'已设置难度：\'+this.value)"><option' + (q.diff === '简单' ? ' selected' : '') + '>简单</option><option' + (q.diff === '中等' ? ' selected' : '') + '>中等</option><option' + (q.diff === '困难' ? ' selected' : '') + '>困难</option></select></div>'
                    + '</div>'
                    + '</div>';
            }).join('');

            container.innerHTML = ''
                + '<div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:12px;">' + paperTabs + '</div>'
                + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">'
                + '<div style="font-size:13px;color:#6B7280;">' + fileName + '</div>'
                + '<div style="display:flex;gap:8px;">'
                + '<button class="proto-btn proto-btn-outline" style="width:auto;padding:0 16px;height:38px;border-radius:8px;font-size:13px;" onclick="teacherReSplit()"><i class="fas fa-redo"></i> 重新切题</button>'
                + '<button class="proto-btn proto-btn-primary" style="width:auto;padding:0 16px;height:38px;border-radius:8px;font-size:13px;background:#10B981;" onclick="openModal(\'切题确认\', \'<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><div style=&quot;text-align:center;padding:16px;background:#F0FDF4;border-radius:8px;&quot;><i class=&quot;fas fa-check-circle&quot; style=&quot;font-size:32px;color:#10B981;&quot;></i><div style=&quot;margin-top:8px;font-weight:600;color:#10B981;&quot;>切题结果已确认</div></div><b>确认信息：</b><br>· 题目总数：' + fullQuestions.length + '题<br>· 选择题：' + choiceCount + '题<br>· 填空题：' + fillCount + '题<br>· 解答题：' + solveCount + '题<br><br><span style=&quot;color:#6B7280;&quot;>已进入AI解析流程...</span></div>\')"><i class="fas fa-check"></i> 确认切题</button>'
                + '</div></div>'
                + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">'
                + teacherCard('试卷预览', null, '<div id="teacher-split-preview-wrap" style="background:#F9FAFB;border-radius:8px;padding:14px;">'
                    + '<div id="teacher-split-preview" style="background:white;border:1px solid #E5E7EB;border-radius:6px;padding:18px;height:300px;overflow-y:auto;position:relative;font-size:13px;line-height:1.8;color:#1F2937;">'
                    + teacherRenderExamPage(preview.currentPage || 1, preview.totalPages || 5, fullQuestions)
                    + '</div>'
                    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;">'
                    + '<button style="width:32px;height:32px;border:1px solid #E5E7EB;background:white;border-radius:6px;cursor:pointer;" onclick="teacherChangePage(-1)"><i class="fas fa-chevron-left"></i></button>'
                    + '<span id="teacher-split-pageinfo" style="font-size:12px;color:#374151;">第' + (preview.currentPage || 1) + '页 / 共' + (preview.totalPages || 5) + '页</span>'
                    + '<button style="width:32px;height:32px;border:1px solid #E5E7EB;background:white;border-radius:6px;cursor:pointer;" onclick="teacherChangePage(1)"><i class="fas fa-chevron-right"></i></button>'
                    + '</div></div>')
                + teacherCard('AI自动切题结果', '<span style="font-size:12px;color:#10B981;font-weight:600;"><i class="fas fa-robot"></i> 识别到 ' + fullQuestions.length + ' 道题</span>', '<div style="display:flex;flex-direction:column;gap:10px;max-height:340px;overflow-y:auto;">' + questionsHtml + '</div>')
                + '</div>'
                + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:16px;">' + statsHtml + '</div>';
        }

        renderSplitPage();
    });

    return AdminPage('AI切题', TEACHER_MENU, 'split', teacherLoading('teacher-split'));
});

// 切换试卷
function teacherSelectPaper(idx) {
    window._teacherSplitState.currentPaper = idx;
    // 保存选择到后端
    if (typeof api !== 'undefined' && api.getPageData) {
        api.getPageData('teacher-split').then(function (data) {
            if (data) { data.currentPaper = idx; api.savePageData('teacher-split', data).catch(function(){}); }
        }).catch(function(){});
    }
    navigateTo('teacher-split');
}

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
        + '<div style="font-size:13px;line-height:1.6;white-space:pre-wrap;">' + detail.content + '</div>'
        + (detail.type === '选择题' && detail.options && detail.options.length ? (function () {
            var labels = ['A','B','C','D','E','F'];
            return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;opacity:0.9;margin-top:8px;">' + detail.options.map(function (o, i) { return '<div>' + labels[i] + '. ' + o + '</div>'; }).join('') + '</div>';
        })() : '')
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

registerPage('teacher-parse', 'AI解析', '教师后台', '', function () {
    teacherLoadData('teacher-parse', function (container, data) {
        // 优先从 teacher-split 切题数据同步题目列表（使用真实完整题目内容）
        function renderWithSplit(splitData) {
            // 支持多试卷格式：取当前选中的试卷
            var papers = (splitData && splitData.papers && splitData.papers.length) ? splitData.papers : null;
            var curPaper;
            if (papers) {
                var idx = (typeof splitData.currentPaper === 'number') ? splitData.currentPaper : 0;
                curPaper = papers[idx] || papers[0];
            } else if (splitData && splitData.fileName) {
                curPaper = { fileName: splitData.fileName, fullQuestions: splitData.fullQuestions || splitData.questions, questions: splitData.questions };
            }
            var fullQs = (curPaper && curPaper.fullQuestions) ? curPaper.fullQuestions : [];
            var splitQs = (curPaper && curPaper.questions) ? curPaper.questions : ((splitData && splitData.questions) ? splitData.questions : []);
            var paperName = (curPaper && curPaper.fileName) ? curPaper.fileName : (data.paperName || '未命名试卷');
            var state = teacherParseState;
            state.paperName = paperName;
            state.parsedMap = {};
            state.details = {};
            // 使用真实题目内容（fullQuestions 含 content/answer/analysis/points）
            var useQs = fullQs.length > 0 ? fullQs : splitQs;
            useQs.forEach(function (q, i) {
                // 若 q 自带完整内容，直接使用；否则用模板生成
                if (q.content && q.answer) {
                    state.details[q.no] = {
                        no: q.no, type: q.type, score: q.score,
                        difficulty: q.diff === '简单' ? '★★☆☆☆' : q.diff === '中等' ? '★★★☆☆' : '★★★★★',
                        content: q.content,
                        options: q.options || [],
                        answer: q.answer,
                        analysis: q.analysis || [],
                        points: q.points || []
                    };
                } else {
                    state.details[q.no] = teacherGenParseDetail(q);
                }
                state.parsedMap[q.no] = true; // 已录入的试卷默认全部已解析
            });
            state.activeNo = useQs.length > 0 ? useQs[0].no : 1;
            renderParsePage(container, paperName, useQs);
        }
        // 异步获取切题数据
        if (typeof api !== 'undefined' && api.getPageData) {
            api.getPageData('teacher-split').then(function (splitData) {
                if (splitData && ((splitData.papers && splitData.papers.length) || (splitData.questions && splitData.questions.length))) {
                    renderWithSplit(splitData);
                } else {
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
            + '<div style="font-size:13px;line-height:1.6;white-space:pre-wrap;">' + detail.content + '</div>'
            + (detail.type === '选择题' && detail.options && detail.options.length ? (function () {
                var labels = ['A','B','C','D','E','F'];
                return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;opacity:0.9;margin-top:8px;">' + detail.options.map(function (o, i) { return '<div>' + labels[i] + '. ' + o + '</div>'; }).join('') + '</div>';
            })() : '')
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
// 注:保留原 registerPage 兼容性,新代码已通过函数引用挂载
window.teacherParseSwitch = teacherParseSwitch;
window.teacherParseConfirm = teacherParseConfirm;
window.teacherParseModify = teacherParseModify;
window.teacherParseSaveEdit = teacherParseSaveEdit;
window.teacherParseRegen = teacherParseRegen;
window.teacherParseReparse = teacherParseReparse;
window.teacherParseConfirmAll = teacherParseConfirmAll;
window.teacherGenParseDetail = teacherGenParseDetail;
window.renderParsePage = renderParsePage;
window.teacherParseState = teacherParseState;

// ============================================================
// 5. AI标知识点（支持多试卷 + 题目切换）
// ============================================================
// 全局状态：当前选中的试卷索引 + 当前题目索引
window._teacherTagState = { currentPaper: 0, currentQ: 0, papers: [] };

registerPage('teacher-tag', 'AI标知识点', '教师后台', '', function () {
    teacherLoadData('teacher-tag', function (container, data) {
        // 支持多试卷格式
        var papers = (data && data.papers && data.papers.length) ? data.papers : null;
        if (!papers && data && data.questions) {
            papers = [{ fileName: data.paperName || '未命名试卷', questions: data.questions }];
        }
        window._teacherTagState.papers = papers || [];
        var curPIdx = (typeof data.currentPaper === 'number') ? data.currentPaper : 0;
        if (curPIdx < 0 || curPIdx >= (papers ? papers.length : 0)) curPIdx = 0;
        window._teacherTagState.currentPaper = curPIdx;
        window._teacherTagState.currentQ = 0;

        function renderTagPage() {
            var st = window._teacherTagState;
            var papers = st.papers;
            if (!papers || papers.length === 0) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;">暂无知识点标注数据</div>';
                return;
            }
            var paper = papers[st.currentPaper] || papers[0];
            var questions = paper.questions || [];
            var q = questions[st.currentQ] || questions[0];
            if (!q) { container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;">该试卷暂无题目</div>'; return; }

            var recommended = q.recommended || [];
            var confirmed = q.confirmed || q.points || [];

            // 试卷选择器
            var paperTabs = papers.map(function (p, i) {
                var active = i === st.currentPaper;
                return '<div onclick="teacherTagSelectPaper(' + i + ')" style="padding:6px 12px;border-radius:16px;font-size:12px;cursor:pointer;white-space:nowrap;background:' + (active ? '#8B5CF6' : '#F3E8FF') + ';color:' + (active ? 'white' : '#6D28D9') + ';font-weight:' + (active ? '700' : '500') + ';">' + (p.fileName || '试卷' + (i+1)).replace(/\.[^.]+$/, '') + '</div>';
            }).join('');

            // 题目导航（小圆点）
            var qNavHtml = questions.map(function (qq, i) {
                var active = i === st.currentQ;
                return '<div onclick="teacherTagSelectQ(' + i + ')" title="第' + qq.no + '题" style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:12px;font-weight:700;background:' + (active ? '#8B5CF6' : '#F3E8FF') + ';color:' + (active ? 'white' : '#6D28D9') + ';">' + qq.no + '</div>';
            }).join('');

            // 推荐知识点
            var recommendedHtml = recommended.map(function (r) {
                return '<div style="display:flex;align-items:center;gap:12px;padding:12px;background:#F9FAFB;border-radius:10px;border:1px solid #F3F4F6;">'
                    + '<div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#8B5CF6,#6D28D9);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fas fa-tag" style="color:white;font-size:14px;"></i></div>'
                    + '<div style="flex:1;"><div style="font-size:14px;font-weight:600;">' + r.name + '</div><div style="font-size:11px;color:#9CA3AF;margin-top:2px;">AI匹配置信度</div></div>'
                    + '<div style="text-align:center;width:60px;"><div style="font-size:16px;font-weight:700;color:' + (r.confidence >= 90 ? '#10B981' : r.confidence >= 80 ? '#F59E0B' : '#9CA3AF') + ';">' + r.confidence + '%</div>' + Progress(r.confidence, r.confidence >= 90 ? '#10B981' : '#F59E0B') + '</div>'
                    + '</div>';
            }).join('');

            // 已确认知识点
            var confirmedHtml = confirmed.map(function (c) {
                return '<span style="display:inline-flex;align-items:center;gap:6px;background:#D1FAE5;color:#065F46;padding:6px 12px;border-radius:16px;font-size:13px;font-weight:600;margin:2px;">' + c + '</span>';
            }).join('');

            container.innerHTML = ''
                + '<div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:8px;margin-bottom:12px;">' + paperTabs + '</div>'
                + '<div style="background:#1E293B;border-radius:12px;padding:16px;color:white;margin-bottom:16px;">'
                + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'
                + '<span style="font-size:12px;background:rgba(255,255,255,0.15);padding:3px 10px;border-radius:6px;"><i class="fas fa-book"></i> ' + (q.subject || '数学') + ' · ' + (q.topic || '综合') + ' · 第' + q.no + '题</span>'
                + '<span style="font-size:12px;opacity:0.7;">难度 ' + (q.difficulty || '') + ' · ' + (q.score || 0) + '分</span>'
                + '</div>'
                + '<div style="font-size:14px;line-height:1.7;white-space:pre-wrap;">' + (q.content || '') + '</div>'
                + '</div>'
                + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;">' + qNavHtml + '</div>'
                + teacherCard('AI推荐知识点', '<span style="font-size:12px;color:#8B5CF6;font-weight:600;"><i class="fas fa-robot"></i> 置信度排序</span>', '<div style="display:flex;flex-direction:column;gap:10px;">' + recommendedHtml + '</div>')
                + teacherCard('已确认知识点', '<span style="font-size:12px;color:#10B981;font-weight:600;">已选 ' + confirmed.length + ' 个</span>', '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">' + (confirmedHtml || '<span style="font-size:13px;color:#9CA3AF;">暂无已确认知识点</span>') + '</div>')
                + '<div style="display:flex;gap:10px;margin-top:16px;">'
                + '<button class="proto-btn proto-btn-outline" style="height:44px;border-radius:8px;" onclick="teacherTagPrevQ()"><i class="fas fa-step-backward"></i> 上一题</button>'
                + '<button class="proto-btn proto-btn-primary" style="height:44px;border-radius:8px;flex:1;background:#8B5CF6;" onclick="teacherTagNextQ()"><i class="fas fa-check"></i> 确认并进入下一题</button>'
                + '</div>';
        }

        renderTagPage();
    });

    return AdminPage('AI标知识点', TEACHER_MENU, 'tag', teacherLoading('teacher-tag'));
});

// 知识点页面：切换试卷
function teacherTagSelectPaper(idx) {
    window._teacherTagState.currentPaper = idx;
    window._teacherTagState.currentQ = 0;
    if (typeof api !== 'undefined' && api.getPageData) {
        api.getPageData('teacher-tag').then(function (data) { if (data) { data.currentPaper = idx; api.savePageData('teacher-tag', data).catch(function(){}); } }).catch(function(){});
    }
    navigateTo('teacher-tag');
}

// 知识点页面：切换题目
function teacherTagSelectQ(idx) {
    window._teacherTagState.currentQ = idx;
    navigateTo('teacher-tag');
}
function teacherTagPrevQ() {
    var st = window._teacherTagState;
    if (st.currentQ > 0) { st.currentQ--; navigateTo('teacher-tag'); }
    else showToast('已是第一题');
}
function teacherTagNextQ() {
    var st = window._teacherTagState;
    var paper = st.papers[st.currentPaper];
    var total = paper ? (paper.questions ? paper.questions.length : 0) : 0;
    if (st.currentQ < total - 1) { st.currentQ++; navigateTo('teacher-tag'); }
    else showToast('已是最后一题，全部标注完成！');
}

// ============================================================
// 6. AI课堂练习
// ============================================================
registerPage('teacher-exercise', 'AI课堂练习', '教师后台', '', function () {
    teacherLoadData('teacher-exercise', function (container, data) {
        const settings = data.settings || {};
        const exercises = data.exercises || [];
        const totalScore = data.totalScore || 0;

        const subjectsOpts = (settings.subjects || []).map(s => `<option>${s}</option>`).join('');
        const diffOpts = (settings.difficulties || []).map(d => `<option ${d === settings.selectedDifficulty ? 'selected' : ''}>${d}</option>`).join('');
        const countOpts = (settings.counts || []).map(c => `<option ${c === settings.selectedCount ? 'selected' : ''}>${c}</option>`).join('');

        const pointsHtml = (settings.points || []).map(p => {
            const style = p.active ? 'background:#3B82F6;color:white;' : 'background:#EFF6FF;color:#2563EB;';
            const label = p.active ? `${p.name} ✓` : p.name;
            return `<span style="${style}padding:5px 12px;border-radius:14px;font-size:12px;cursor:pointer;" onclick="if(this.classList.contains('active-pt')){this.classList.remove('active-pt');this.style.background='#EFF6FF';this.style.color='#2563EB';this.textContent='${p.name}';showToast('已取消知识点：${p.name}')}else{this.classList.add('active-pt');this.style.background='#3B82F6';this.style.color='white';this.textContent='${p.name} ✓';showToast('已选择知识点：${p.name}')}">${label}</span>`;
        }).join('');

        const exercisesHtml = exercises.map(e => `
            <div data-exercise-card style="padding:12px;background:#F9FAFB;border-radius:10px;border-left:3px solid ${e.diff === '困难' ? '#EF4444' : e.diff === '中等' ? '#F59E0B' : '#10B981'};">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <div style="width:26px;height:26px;border-radius:50%;background:#3B82F6;color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">${e.no}</div>
                        <span style="font-size:13px;font-weight:600;">第 ${e.no} 题</span>
                        <span style="background:#EFF6FF;color:#2563EB;padding:1px 8px;border-radius:6px;font-size:11px;">${e.type}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;font-size:12px;">
                        <span style="color:#8B5CF6;"><i class="fas fa-tag"></i> ${e.point}</span>
                        <span style="color:#9CA3AF;">|</span>
                        <span style="color:${e.diff === '困难' ? '#EF4444' : e.diff === '中等' ? '#F59E0B' : '#10B981'};">${e.diff}</span>
                        <span style="color:#9CA3AF;">|</span>
                        <span style="font-weight:600;color:#374151;">${e.score}分</span>
                    </div>
                </div>
                <div style="font-size:13px;color:#374151;line-height:1.6;padding:8px 10px;background:white;border-radius:6px;">${e.content}</div>
                <div style="display:flex;gap:6px;margin-top:8px;">
                    <button style="padding:4px 12px;background:white;border:1px solid #E5E7EB;border-radius:6px;font-size:11px;cursor:pointer;color:#3B82F6;" onclick="openModal('题目预览', '<div style=&quot;padding:14px;font-size:13px;color:#374151;line-height:1.8;&quot;>查看第 ${e.no} 题的完整内容与解析。</div>')"><i class="fas fa-eye"></i> 预览</button>
                    <button style="padding:4px 12px;background:white;border:1px solid #E5E7EB;border-radius:6px;font-size:11px;cursor:pointer;color:#F59E0B;" onclick="openModal('编辑题目', '<div style=&quot;padding:14px;font-size:13px;color:#374151;line-height:1.8;&quot;>编辑第 ${e.no} 题的内容、分值与难度。</div>')"><i class="fas fa-edit"></i> 编辑</button>
                    <button style="padding:4px 12px;background:white;border:1px solid #E5E7EB;border-radius:6px;font-size:11px;cursor:pointer;color:#8B5CF6;" onclick="openModal('AI换题', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><div style=&quot;text-align:center;padding:16px;&quot;><i class=&quot;fas fa-spinner fa-spin&quot; style=&quot;font-size:24px;color:#8B5CF6;&quot;></i></div><b>AI正在为你换一题...</b><br>· 当前题号：第${e.no}题<br>· 题型：${e.type}<br>· 难度：${e.diff}<br>· 知识点：${e.point}<br>· 预计耗时：2秒<br><br><span style=&quot;color:#6B7280;&quot;>将生成相同难度与知识点的新题目。</span></div>')"><i class="fas fa-sync"></i> 换一题</button>
                    <button style="padding:4px 12px;background:white;border:1px solid #E5E7EB;border-radius:6px;font-size:11px;cursor:pointer;color:#EF4444;" onclick="openModal('确认删除', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><div style=&quot;text-align:center;padding:14px;background:#FEF2F2;border-radius:8px;margin-bottom:10px;&quot;><i class=&quot;fas fa-exclamation-triangle&quot; style=&quot;font-size:28px;color:#EF4444;&quot;></i><div style=&quot;margin-top:6px;font-weight:600;color:#EF4444;&quot;>确定删除第${e.no}题？</div></div><b>题目信息：</b><br>· 题型：${e.type}<br>· 难度：${e.diff}<br>· 分值：${e.score}分<br><br><span style=&quot;color:#6B7280;&quot;>删除后无法恢复，请确认操作。</span></div>');this.closest('[data-exercise-card]').remove();showToast('已删除第${e.no}题')"><i class="fas fa-trash"></i> 删除</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <!-- 生成设置 -->
            ${teacherCard('生成设置', `<span style="font-size:12px;color:#3B82F6;font-weight:600;"><i class="fas fa-magic"></i> AI智能生成</span>`, `
                <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:14px;">
                    <div>
                        <div style="font-size:12px;color:#6B7280;margin-bottom:6px;">科目</div>
                        <select class="proto-input" style="height:40px;" onchange="showToast('已设置科目：'+this.value)">${subjectsOpts}</select>
                    </div>
                    <div>
                        <div style="font-size:12px;color:#6B7280;margin-bottom:6px;">难度</div>
                        <select class="proto-input" style="height:40px;" onchange="showToast('已设置难度：'+this.value)">${diffOpts}</select>
                    </div>
                    <div>
                        <div style="font-size:12px;color:#6B7280;margin-bottom:6px;">题量</div>
                        <select class="proto-input" style="height:40px;" onchange="showToast('已设置题量：'+this.value+'题')">${countOpts}</select>
                    </div>
                </div>
                <div style="margin-bottom:14px;">
                    <div style="font-size:12px;color:#6B7280;margin-bottom:6px;">知识点范围</div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">${pointsHtml}</div>
                </div>
                <div style="display:flex;gap:10px;">
                    <button class="proto-btn proto-btn-primary" style="width:auto;padding:0 24px;height:42px;border-radius:8px;flex:1;" onclick="var card=this.closest('.proto-card')||this.parentElement.parentElement;var sels=card.querySelectorAll('select');var sub=sels[0]?sels[0].value:'未指定';var diff=sels[1]?sels[1].value:'未指定';var cnt=sels[2]?sels[2].value:'未指定';var pts=[];card.querySelectorAll('.active-pt').forEach(function(el){pts.push(el.textContent.replace('✓','').trim())});openModal('生成练习结果', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><div style=&quot;text-align:center;padding:16px;&quot;><i class=&quot;fas fa-spinner fa-spin&quot; style=&quot;font-size:24px;color:#3B82F6;&quot;></i></div><b>AI正在生成课堂练习...</b><br>· 科目：'+sub+'<br>· 难度：'+diff+'<br>· 题量：'+cnt+'题<br>· 已选知识点：'+(pts.length?pts.join('、'):'全部')+'<br>· 预计耗时：5秒<br><br><span style=&quot;color:#6B7280;&quot;>生成结果将展示在下方列表。</span></div>')"><i class="fas fa-magic"></i> 生成课堂练习</button>
                    <button class="proto-btn proto-btn-outline" style="width:auto;padding:0 20px;height:42px;border-radius:8px;" onclick="openModal('导出练习', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><div style=&quot;text-align:center;padding:14px;background:#EFF6FF;border-radius:8px;margin-bottom:10px;&quot;><i class=&quot;fas fa-file-download&quot; style=&quot;font-size:28px;color:#3B82F6;&quot;></i></div><b>导出选项：</b><br>· 格式：PDF / Word / 图片<br>· 题目数：'+exercises.length+'题<br>· 总分：'+totalScore+'分<br><br><span style=&quot;color:#6B7280;&quot;>已生成下载链接，点击下载。</span></div>')"><i class="fas fa-download"></i> 导出</button>
                </div>
            `)}

            <!-- 生成的练习题列表 -->
            ${teacherCard('生成的练习题', `<span style="font-size:12px;color:#6B7280;">共 ${exercises.length} 题 · 总分 ${totalScore} 分</span>`, `<div style="display:flex;flex-direction:column;gap:10px;">${exercisesHtml}</div>`)}

            <!-- 底部操作 -->
            <div style="display:flex;gap:10px;">
                <button class="proto-btn proto-btn-outline" style="height:44px;border-radius:8px;" onclick="openModal('推送到班级', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><div style=&quot;text-align:center;padding:14px;background:#F0FDF4;border-radius:8px;margin-bottom:10px;&quot;><i class=&quot;fas fa-paper-plane&quot; style=&quot;font-size:28px;color:#10B981;&quot;></i><div style=&quot;margin-top:6px;font-weight:600;color:#10B981;&quot;>推送成功</div></div><b>推送信息：</b><br>· 班级：高三(1)班<br>· 题目数：${exercises.length}题<br>· 总分：${totalScore}分<br>· 截止时间：今日 18:00<br><br><span style=&quot;color:#6B7280;&quot;>学生可在App中查看并作答。</span></div>')"><i class="fas fa-paper-plane"></i> 推送到班级</button>
                <button class="proto-btn proto-btn-primary" style="height:44px;border-radius:8px;flex:1;background:#10B981;" onclick="openModal('打印预览', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><div style=&quot;text-align:center;padding:14px;background:#F9FAFB;border:1px dashed #D1D5DB;border-radius:8px;margin-bottom:10px;&quot;><i class=&quot;fas fa-print&quot; style=&quot;font-size:28px;color:#3B82F6;&quot;></i><div style=&quot;margin-top:6px;font-weight:600;&quot;>打印预览已生成</div></div><b>打印信息：</b><br>· 纸张：A4<br>· 题目数：${exercises.length}题<br>· 总分：${totalScore}分<br>· 页数：${Math.ceil(exercises.length / 4)}页<br><br><span style=&quot;color:#6B7280;&quot;>已发送至默认打印机，请前往取件。</span></div>')"><i class="fas fa-print"></i> 打印发放</button>
            </div>
        `;
    });

    return AdminPage('AI课堂练习', TEACHER_MENU, 'exercise', teacherLoading('teacher-exercise'));
});

// ============================================================
// 7. AI组卷
// ============================================================
registerPage('teacher-paper', 'AI组卷', '教师后台', '', function () {
    teacherLoadData('teacher-paper', function (container, data) {
        const paperName = data.paperName || '';
        const previewInfo = data.previewInfo || '';
        const settings = data.settings || {};
        const paperQuestions = data.paperQuestions || [];
        const sections = data.sections || [];

        const subjectsOpts = (settings.subjects || []).map(s => `<option>${s}</option>`).join('');
        const scopeOpts = (settings.knowledgeScopes || []).map(s => `<option>${s}</option>`).join('');
        const distributionHtml = (settings.distribution || []).map(d => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:#F9FAFB;border-radius:6px;">
                <span style="font-size:12px;">${d.type}</span>
                <div style="display:flex;align-items:center;gap:6px;">
                    <input type="number" value="${d.count}" style="width:42px;padding:4px;border:1px solid #E5E7EB;border-radius:4px;font-size:12px;text-align:center;" onchange="showToast('已设置${d.type}题数：'+this.value)">题
                    <span style="font-size:12px;color:#6B7280;">/</span>
                    <input type="number" value="${d.score}" style="width:42px;padding:4px;border:1px solid #E5E7EB;border-radius:4px;font-size:12px;text-align:center;" onchange="showToast('已设置${d.type}分值：'+this.value+'分')">分
                </div>
            </div>
        `).join('');

        // 按章节（选择题/填空题/解答题）分组渲染试卷预览
        const sectionsHtml = sections.map(sec => {
            const slice = paperQuestions.slice(sec.start, sec.end);
            const qHtml = slice.map(q => `
                <div data-paper-q style="display:flex;gap:10px;padding:10px;background:#F9FAFB;border-radius:8px;">
                    <div style="width:24px;height:24px;border-radius:50%;background:${sec.color};color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">${q.no}</div>
                    <div style="flex:1;">
                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                            <span style="font-size:12px;font-weight:600;">${q.point}</span>
                            <span style="background:${q.diff === '困难' ? '#FEE2E2' : q.diff === '中等' ? '#FEF3C7' : '#D1FAE5'};color:${q.diff === '困难' ? '#991B1B' : q.diff === '中等' ? '#92400E' : '#065F46'};padding:1px 6px;border-radius:4px;font-size:10px;">${q.diff}</span>
                        </div>
                        <div style="font-size:12px;color:#6B7280;">${q.type} · ${q.score}分</div>
                    </div>
                    <div style="display:flex;align-items:center;gap:4px;">
                        <button style="width:28px;height:28px;background:white;border:1px solid #E5E7EB;border-radius:6px;cursor:pointer;color:#8B5CF6;" onclick="openModal('AI替换题目', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><div style=&quot;text-align:center;padding:14px;&quot;><i class=&quot;fas fa-spinner fa-spin&quot; style=&quot;font-size:22px;color:#8B5CF6;&quot;></i></div><b>AI正在替换题目...</b><br>· 当前题目：第${q.no}题<br>· 知识点：${q.point}<br>· 难度：${q.diff}<br>· 类型：${q.type}<br>· 预计耗时：2秒<br><br><span style=&quot;color:#6B7280;&quot;>将生成相同难度与知识点的新题。</span></div>')"><i class="fas fa-sync" style="font-size:11px;"></i></button>
                        <button style="width:28px;height:28px;background:white;border:1px solid #E5E7EB;border-radius:6px;cursor:pointer;color:#EF4444;" onclick="openModal('移除题目', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><div style=&quot;text-align:center;padding:12px;background:#FEF2F2;border-radius:8px;margin-bottom:10px;&quot;><i class=&quot;fas fa-trash-alt&quot; style=&quot;font-size:24px;color:#EF4444;&quot;></i><div style=&quot;margin-top:6px;font-weight:600;color:#EF4444;&quot;>已移除第${q.no}题</div></div><b>题目信息：</b><br>· 类型：${q.type}<br>· 分值：${q.score}分<br><br><span style=&quot;color:#6B7280;&quot;>移除后该题不再计入试卷。</span></div>');this.closest('[data-paper-q]').remove();showToast('已移除第${q.no}题')"><i class="fas fa-times" style="font-size:11px;"></i></button>
                    </div>
                </div>
            `).join('');
            return `<div style="font-size:13px;font-weight:700;color:#374151;padding:6px 0;border-bottom:1px solid #E5E7EB;">${sec.title}</div>${qHtml}`;
        }).join('');

        container.innerHTML = `
            <div style="display:grid;grid-template-columns:1fr 1.4fr;gap:16px;">
                <!-- 组卷参数设置 -->
                <div>
                    ${teacherCard('组卷参数', `<span style="font-size:12px;color:#3B82F6;font-weight:600;"><i class="fas fa-sliders-h"></i> 智能配置</span>`, `
                        <div style="margin-bottom:14px;">
                            <div style="font-size:12px;color:#6B7280;margin-bottom:6px;">试卷名称</div>
                            <input class="proto-input" value="${paperName}" style="height:40px;" onchange="showToast('已设置试卷名称：'+this.value)">
                        </div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">
                            <div>
                                <div style="font-size:12px;color:#6B7280;margin-bottom:6px;">科目</div>
                                <select class="proto-input" style="height:40px;" onchange="showToast('已设置科目：'+this.value)">${subjectsOpts}</select>
                            </div>
                            <div>
                                <div style="font-size:12px;color:#6B7280;margin-bottom:6px;">满分</div>
                                <input class="proto-input" type="number" value="${settings.fullScore}" style="height:40px;" onchange="showToast('已设置满分：'+this.value+'分')">
                            </div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div style="font-size:12px;color:#6B7280;margin-bottom:6px;">知识范围</div>
                            <select class="proto-input" style="height:40px;" onchange="showToast('已设置知识范围：'+this.value)">${scopeOpts}</select>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div style="display:flex;justify-content:space-between;font-size:12px;color:#6B7280;margin-bottom:6px;"><span>难度系数</span><span style="color:#3B82F6;font-weight:600;">${settings.difficultyLabel}</span></div>
                            <input type="range" min="0" max="100" value="${settings.difficulty}" style="width:100%;" oninput="showToast('已设置为'+this.value)">
                            <div style="display:flex;justify-content:space-between;font-size:10px;color:#9CA3AF;margin-top:4px;"><span>简单</span><span>中等</span><span>困难</span></div>
                        </div>
                        <!-- 分值分布 -->
                        <div style="margin-bottom:14px;">
                            <div style="font-size:12px;color:#6B7280;margin-bottom:6px;">分值分布</div>
                            <div style="display:flex;flex-direction:column;gap:8px;">${distributionHtml}</div>
                        </div>
                        <button class="proto-btn proto-btn-primary" style="height:44px;border-radius:8px;background:linear-gradient(135deg,#3B82F6,#8B5CF6);" onclick="var card=this.closest('.proto-card');var name=card.querySelector('input[type=text]')?card.querySelector('input[type=text]').value:(card.querySelector('input')?card.querySelector('input').value:'未命名');var sels=card.querySelectorAll('select');var sub=sels[0]?sels[0].value:'未指定';var scope=sels[1]?sels[1].value:'全部';var fullScore=card.querySelector('input[type=number]')?card.querySelector('input[type=number]').value:100;var diff=card.querySelector('input[type=range]')?card.querySelector('input[type=range]').value:50;var dist=card.querySelectorAll('input[type=number]');var distStr='';dist.forEach(function(d,i){distStr+='分布'+(i+1)+':'+d.value+'; '});openModal('AI智能组卷', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><div style=&quot;text-align:center;padding:16px;&quot;><i class=&quot;fas fa-spinner fa-spin&quot; style=&quot;font-size:24px;color:#3B82F6;&quot;></i></div><b>AI正在智能组卷...</b><br><b>组卷参数：</b><br>· 试卷名称：'+name+'<br>· 科目：'+sub+'<br>· 满分：'+fullScore+'分<br>· 知识范围：'+scope+'<br>· 难度系数：'+diff+'<br>· 分值分布：'+distStr+'<br><br><b>组卷进度：</b><br>· 检索题库中...<br>· 智能匹配题目...<br>· 平衡难度分布...<br>· 预计耗时：8秒<br><br><span style=&quot;color:#6B7280;&quot;>组卷结果将展示在右侧预览区。</span></div>')"><i class="fas fa-magic"></i> AI智能组卷</button>
                    `)}
                </div>

                <!-- 生成试卷预览 -->
                <div>
                    ${teacherCard('试卷预览', `<span style="font-size:12px;color:#6B7280;">${previewInfo}</span>`, `<div style="display:flex;flex-direction:column;gap:10px;max-height:540px;overflow-y:auto;">${sectionsHtml}</div>`)}
                </div>
            </div>

            <!-- 底部操作 -->
            <div style="display:flex;gap:10px;">
                <button class="proto-btn proto-btn-outline" style="height:44px;border-radius:8px;" onclick="openModal('保存试卷', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><div style=&quot;text-align:center;padding:14px;background:#F0FDF4;border-radius:8px;margin-bottom:10px;&quot;><i class=&quot;fas fa-check-circle&quot; style=&quot;font-size:28px;color:#10B981;&quot;></i><div style=&quot;margin-top:6px;font-weight:600;color:#10B981;&quot;>试卷已保存</div></div><b>保存信息：</b><br>· 试卷名称：${paperName}<br>· 题目数：${paperQuestions.length}题<br>· 满分：${settings.fullScore}分<br>· 保存时间：刚刚<br><br><span style=&quot;color:#6B7280;&quot;>已保存至题库，可在历史试卷中查看。</span></div>')"><i class="fas fa-save"></i> 保存试卷</button>
                <button class="proto-btn proto-btn-outline" style="height:44px;border-radius:8px;" onclick="openModal('导出PDF', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><div style=&quot;text-align:center;padding:14px;background:#FEF2F2;border-radius:8px;margin-bottom:10px;&quot;><i class=&quot;fas fa-file-pdf&quot; style=&quot;font-size:28px;color:#EF4444;&quot;></i><div style=&quot;margin-top:6px;font-weight:600;color:#EF4444;&quot;>PDF生成中...</div></div><b>导出信息：</b><br>· 试卷名称：${paperName}<br>· 题目数：${paperQuestions.length}题<br>· 文件大小：约1.2MB<br>· 页数：${Math.ceil(paperQuestions.length / 5)}页<br><br><span style=&quot;color:#6B7280;&quot;>PDF已生成，正在下载...</span></div>')"><i class="fas fa-file-pdf"></i> 导出PDF</button>
                <button class="proto-btn proto-btn-primary" style="height:44px;border-radius:8px;flex:1;background:#10B981;" onclick="openModal('发布到班级', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><div style=&quot;text-align:center;padding:14px;background:#F0FDF4;border-radius:8px;margin-bottom:10px;&quot;><i class=&quot;fas fa-paper-plane&quot; style=&quot;font-size:28px;color:#10B981;&quot;></i><div style=&quot;margin-top:6px;font-weight:600;color:#10B981;&quot;>已发布到班级</div></div><b>发布信息：</b><br>· 试卷：${paperName}<br>· 班级：高三(1)班<br>· 满分：${settings.fullScore}分<br>· 截止时间：3天后<br>· 接收学生：45人<br><br><span style=&quot;color:#6B7280;&quot;>学生可在App中查看并作答。</span></div>')"><i class="fas fa-paper-plane"></i> 发布到班级</button>
            </div>
        `;
    });

    return AdminPage('AI组卷', TEACHER_MENU, 'paper', teacherLoading('teacher-paper'));
});
