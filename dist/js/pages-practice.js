// ============================================================
// 智能刷题 - 页面模块（动态加载：数据来自 /api/page-data/:key）
// ============================================================

// ------------------------------------------------------------
// 全局工具函数（必须在文件最外层定义，确保任意子页面点击时均可调用）
// 说明：原先 buildExamDetailHtml 定义在“真题”页面的 registerPage 回调内部，
// 导致用户未先访问真题页面时，点击模拟题/AI推荐题/易错题卡片会因
// window.buildExamDetailHtml 为 undefined 而抛错、弹窗不出现。
// 现统一下沉到文件最外层，所有 open*Detail 仅依赖 window.__* 缓存数据。
// ------------------------------------------------------------

// 全局：构建题目详情弹窗HTML（题干+选项+答案+解析） —— 支持额外元信息条
window.buildExamDetailHtml = function (e, extraMetaHtml) {
    if (!e) return '<div style="padding:15px;">题目数据加载失败</div>';
    var html = '';
    // 顶部元信息条
    html += '<div style="background:linear-gradient(135deg,#3B82F6,#8B5CF6);color:white;padding:12px 14px;border-radius:10px 10px 0 0;font-size:12px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">';
    html += '<span style="background:rgba(255,255,255,0.25);padding:2px 8px;border-radius:10px;font-weight:600;">' + (e.subject || '未知科目') + '</span>';
    if (e.type) html += '<span style="background:rgba(255,255,255,0.25);padding:2px 8px;border-radius:10px;">' + e.type + '</span>';
    if (e.knowledge_point) html += '<span style="background:rgba(255,255,255,0.25);padding:2px 8px;border-radius:10px;">考点：' + e.knowledge_point + '</span>';
    html += '</div>';

    // 额外元信息条（来源/匹配度/错误次数等）
    if (extraMetaHtml) {
        html += '<div style="background:#F9FAFB;padding:10px 14px;border-bottom:1px solid #E5E7EB;font-size:12px;color:#374151;line-height:1.8;">' + extraMetaHtml + '</div>';
    }

    // 主体内容（滚动区）
    html += '<div style="padding:14px;max-height:60vh;overflow-y:auto;">';
    // 题干
    var questionText = e.question || e.q || '暂无题干';
    html += '<div style="font-size:14px;color:#111827;line-height:1.8;white-space:pre-wrap;word-break:break-word;margin-bottom:14px;">' + questionText + '</div>';
    // 选项
    if (e.options && e.options.length > 0) {
        html += '<div style="margin-bottom:14px;">';
        e.options.forEach(function (opt) {
            html += '<div style="background:#F9FAFB;border-radius:8px;padding:10px 12px;margin-bottom:6px;font-size:13px;color:#374151;line-height:1.6;">' + opt + '</div>';
        });
        html += '</div>';
    }
    // 答案区（默认隐藏，点击按钮显示）
    var ansId = 'practice-exam-ans-' + Math.random().toString(36).substr(2, 9);
    var anaId = 'practice-exam-ana-' + Math.random().toString(36).substr(2, 9);
    html += '<div style="display:flex;gap:8px;margin-bottom:14px;">';
    html += '<button onclick="(function(b){var a=document.getElementById(\'' + ansId + '\');if(a.style.display===\'none\'){a.style.display=\'block\';b.innerText=\'隐藏答案\';}else{a.style.display=\'none\';b.innerText=\'查看答案\';}})(this);" style="flex:1;background:#10B981;color:white;border:none;padding:10px;border-radius:8px;font-size:13px;cursor:pointer;font-weight:600;"><i class="fas fa-check-circle"></i> 查看答案</button>';
    html += '<button onclick="(function(b){var a=document.getElementById(\'' + anaId + '\');if(a.style.display===\'none\'){a.style.display=\'block\';b.innerText=\'隐藏解析\';}else{a.style.display=\'none\';b.innerText=\'查看解析\';}})(this);" style="flex:1;background:#3B82F6;color:white;border:none;padding:10px;border-radius:8px;font-size:13px;cursor:pointer;font-weight:600;"><i class="fas fa-lightbulb"></i> 查看解析</button>';
    html += '</div>';
    // 答案
    html += '<div id="' + ansId + '" style="display:none;background:#F0FDF4;border-left:3px solid #10B981;padding:10px 12px;border-radius:0 8px 8px 0;font-size:13px;color:#065F46;line-height:1.7;white-space:pre-wrap;word-break:break-word;margin-bottom:10px;"><b>✅ 参考答案</b><br>' + (e.answer || '暂无答案') + '</div>';
    // 解析（易错题额外显示错误原因）
    var analysisContent = e.analysis || '暂无解析';
    if (e.error_reason) {
        analysisContent += '\n\n📌 <b>错误原因分析</b>\n' + e.error_reason;
    }
    html += '<div id="' + anaId + '" style="display:none;background:#FFFBEB;border-left:3px solid #F59E0B;padding:10px 12px;border-radius:0 8px 8px 0;font-size:13px;color:#92400E;line-height:1.7;white-space:pre-wrap;word-break:break-word;"><b>💡 详细解析</b><br>' + analysisContent + '</div>';
    html += '</div>';
    return html;
}

// 全局：打开真题详情弹窗
window.openPracticeExamDetail = function (idx) {
    var exam = window.__practiceRealExams && window.__practiceRealExams[idx];
    if (!exam) {
        showToast('题目数据加载中，请稍候');
        return;
    }
    var stars = '★'.repeat(exam.level) + '☆'.repeat(5 - exam.level);
    var meta = '<div style="display:flex;gap:14px;flex-wrap:wrap;">' +
        '<span><b>年份：</b>' + exam.year + ' · ' + exam.region + '</span>' +
        '<span><b>题号：</b>' + exam.no + '</span>' +
        '<span><b>难度：</b><span style="color:#F59E0B;">' + stars + '</span></span>' +
        '<span><b>分值：</b><span style="color:#3B82F6;font-weight:600;">' + exam.score + '分</span></span>' +
        '</div>';
    var detailHtml = window.buildExamDetailHtml(exam, meta);
    openModal('题目详情 · ' + exam.no, detailHtml);
}

// 全局：过滤模拟题列表（科目 Segment + 来源筛选联动）
window.filterPracticeMock = function (type, value) {
    var allMocks = window.__practiceMocks || [];
    var filters = window.__practiceMockFilters || {};
    filters[type] = value;
    // 接入数据中台：模拟题筛选状态持久化到 KV（刷新后保留偏好）
    if (typeof api !== 'undefined' && api.savePageData) {
        api.savePageData('practice-mock-filter', filters).catch(function () {});
    }

    // 更新来源筛选按钮高亮
    var sourcesContainer = document.getElementById('practice-mock-sources');
    if (sourcesContainer && type === 'source') {
        var sourceItems = sourcesContainer.children;
        for (var i = 0; i < sourceItems.length; i++) {
            var name = sourceItems[i].textContent.trim();
            if (name === value) {
                sourceItems[i].style.background = '#3B82F6';
                sourceItems[i].style.color = 'white';
                sourceItems[i].style.fontWeight = '600';
                sourceItems[i].style.boxShadow = '';
            } else {
                sourceItems[i].style.background = 'white';
                sourceItems[i].style.color = '#374151';
                sourceItems[i].style.fontWeight = '400';
                sourceItems[i].style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
            }
        }
    }

    // 判断来源类别（全部=不限，名校模拟=中学名校，机构模拟=培训机构，AI生成=AI生成）
    function matchSource(mockSource, filterSource) {
        if (filterSource === '全部') return true;
        if (filterSource === '名校模拟') {
            return ['衡水中学', '黄冈中学', '人大附中', '成都七中'].indexOf(mockSource) >= 0;
        }
        if (filterSource === '机构模拟') {
            return ['学而思', '新东方', '猿辅导', '作业帮'].indexOf(mockSource) >= 0;
        }
        if (filterSource === 'AI生成') {
            return mockSource === 'AI生成';
        }
        return true;
    }

    // 双重过滤：科目 + 来源
    var filtered = allMocks.filter(function (m) {
        var subjectOk = (filters.subject === '全部' || m.subject === filters.subject);
        var sourceOk = matchSource(m.source, filters.source);
        return subjectOk && sourceOk;
    });

    // 重新渲染列表
    var listContainer = document.getElementById('practice-mock-list');
    if (listContainer) {
        // 内联渲染函数（与 renderMockListHtml 等效）
        var html = '';
        filtered.forEach(function (m) {
            var stars = '★'.repeat(m.level) + '☆'.repeat(5 - m.level);
            var sourceTag = m.source === 'AI生成' ? Tag(m.source, 'purple') :
                (['衡水中学', '黄冈中学', '人大附中', '成都七中'].indexOf(m.source) >= 0 ? Tag(m.source, 'blue') : Tag(m.source, 'green'));
            html += '<div onclick="openPracticeMockDetail(' + m._origIdx + ')" data-mock-idx="' + m._origIdx + '" style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.08);cursor:pointer;">' +
                '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap;">' +
                Tag(m.subject, m.subjectColor) + sourceTag +
                '</div>' +
                '<div style="font-size:14px;font-weight:600;margin-bottom:8px;">' + m.name + '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#6B7280;">' +
                '<span>难度 <span style="color:#F59E0B;">' + stars + '</span></span>' +
                '<span><i class="fas fa-user"></i> ' + (m.count / 1000).toFixed(1) + 'k人完成</span>' +
                '<span><i class="fas fa-thumbs-up" style="color:#10B981;"></i> ' + m.rate + '%</span>' +
                '</div>' +
                '</div>';
        });
        if (filtered.length === 0) {
            html = '<div style="text-align:center;padding:30px;color:#9CA3AF;font-size:13px;"><i class="fas fa-inbox" style="font-size:24px;margin-bottom:8px;display:block;"></i>暂无符合筛选条件的模拟卷</div>';
        }
        listContainer.innerHTML = html;
    }
};

// 全局：打开模拟题详情弹窗
window.openPracticeMockDetail = function (idx) {
    var mock = window.__practiceMocks && window.__practiceMocks[idx];
    if (!mock) {
        showToast('模拟卷数据加载中，请稍候');
        return;
    }
    var stars = '★'.repeat(mock.level) + '☆'.repeat(5 - mock.level);
    var meta = '<div style="display:flex;gap:14px;flex-wrap:wrap;">' +
        '<span><b>来源：</b>' + mock.source + '</span>' +
        '<span><b>难度：</b><span style="color:#F59E0B;">' + stars + '</span></span>' +
        '<span><b>完成人数：</b>' + mock.count.toLocaleString() + '人</span>' +
        '<span><b>好评率：</b><span style="color:#10B981;font-weight:600;">' + mock.rate + '%</span></span>' +
        '</div>' +
        '<div style="margin-top:6px;color:#6B7280;">本卷典型题目如下（点击查看完整解析）</div>';
    var detailHtml = window.buildExamDetailHtml(mock, meta);
    openModal('模拟卷详情 · ' + mock.name, detailHtml);
}

// 全局：打开AI推荐题详情弹窗
window.openPracticeRecommendDetail = function (idx) {
    var rec = window.__practiceRecommends && window.__practiceRecommends[idx];
    if (!rec) {
        showToast('推荐题数据加载中，请稍候');
        return;
    }
    var stars = '★'.repeat(rec.level) + '☆'.repeat(5 - rec.level);
    var reasonBg = rec.reasonColor === 'red' ? '#FEE2E2' : rec.reasonColor === 'orange' ? '#FEF3C7' : '#EDE9FE';
    var reasonColor = rec.reasonColor === 'red' ? '#991B1B' : rec.reasonColor === 'orange' ? '#92400E' : '#5B21B6';
    var meta = '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;">' +
        '<span><b>推荐理由：</b><span style="background:' + reasonBg + ';color:' + reasonColor + ';padding:2px 8px;border-radius:6px;font-weight:600;">' + rec.reason + '</span></span>' +
        '<span><b>匹配度：</b><span style="color:#10B981;font-weight:600;">' + rec.match + '%</span></span>' +
        '<span><b>难度：</b><span style="color:#F59E0B;">' + stars + '</span></span>' +
        '<span><b>预计用时：</b>' + rec.time + '分钟</span>' +
        '</div>' +
        '<div style="margin-top:6px;color:#6B7280;">AI 根据你的学情推荐，建议优先练习以补强薄弱环节</div>';
    var detailHtml = window.buildExamDetailHtml(rec, meta);
    openModal('AI推荐题详情', detailHtml);
}

// 全局：打开错题详情弹窗
window.openPracticeMistakeDetail = function (idx) {
    var mistake = window.__practiceMistakes && window.__practiceMistakes[idx];
    if (!mistake) {
        showToast('错题数据加载中，请稍候');
        return;
    }
    var meta = '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;">' +
        '<span><b>错误次数：</b><span style="color:#EF4444;font-weight:600;">' + mistake.count + '次</span></span>' +
        '<span><b>上次错误：</b>' + mistake.last + '</span>' +
        '</div>';
    if (mistake.error_type) {
        meta += '<div style="margin-top:6px;"><b>错误类型：</b><span style="background:#FEE2E2;color:#991B1B;padding:2px 8px;border-radius:6px;font-weight:600;">' + mistake.error_type + '</span></div>';
    }
    meta += '<div style="margin-top:6px;color:#6B7280;">下方为完整题目、参考答案与错误原因分析</div>';
    var detailHtml = window.buildExamDetailHtml(mistake, meta);
    openModal('错题解析 · ' + mistake.subject, detailHtml);
}

// ---------- 1. 真题 ----------
registerPage('practice-real-exam', '真题', '智能刷题', '', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('practice-real-exam-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('practice-real-exam').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div></div>';
                return;
            }
            // 初始化筛选状态：科目=全部(0)，年份=最新
            window.__practiceExamFilter = { subjectIdx: 0, year: null };
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    // 重新渲染：根据当前筛选状态过滤真题列表
    window.renderPracticeRealExamFiltered = function (filterOnly) {
        var container = document.getElementById('practice-real-exam-content');
        var data = window.__practiceRealExamData;
        if (!container || !data) return;
        renderPageContent(container, data, filterOnly);
    };

    // 切换科目筛选
    window.filterPracticeExamBySubject = function (idx) {
        window.__practiceExamFilter = window.__practiceExamFilter || { subjectIdx: 0, year: null };
        window.__practiceExamFilter.subjectIdx = idx;
        // 接入数据中台：真题筛选状态持久化到 KV（刷新后保留偏好）
        if (typeof api !== 'undefined' && api.savePageData) {
            api.savePageData('practice-exam-filter', window.__practiceExamFilter).catch(function () {});
        }
        window.renderPracticeRealExamFiltered(true);
    };

    // 切换年份筛选
    window.filterPracticeExamByYear = function (year) {
        window.__practiceExamFilter = window.__practiceExamFilter || { subjectIdx: 0, year: null };
        // 再次点击同一年份 → 取消筛选
        if (window.__practiceExamFilter.year === year) {
            window.__practiceExamFilter.year = null;
        } else {
            window.__practiceExamFilter.year = year;
        }
        // 接入数据中台：真题筛选状态持久化到 KV（刷新后保留偏好）
        if (typeof api !== 'undefined' && api.savePageData) {
            api.savePageData('practice-exam-filter', window.__practiceExamFilter).catch(function () {});
        }
        window.renderPracticeRealExamFiltered(true);
    };

    function renderPageContent(container, data, filterOnly) {
        // 缓存原始数据
        window.__practiceRealExamData = data;

        var filter = window.__practiceExamFilter || { subjectIdx: 0, year: null };
        var subjects = data.subjects || [];
        var years = data.years || [];

        // 应用筛选
        var allExams = data.exams || [];
        var filtered = allExams.filter(function (e) {
            var okSubj = true, okYear = true;
            if (filter.subjectIdx > 0 && subjects[filter.subjectIdx] !== '全部') {
                okSubj = e.subject === subjects[filter.subjectIdx];
            }
            if (filter.year) {
                okYear = String(e.year) === String(filter.year);
            }
            return okSubj && okYear;
        });

        if (filterOnly) {
            // 仅更新科目条 + 年份条 + 列表区域，避免重置整页 DOM
            // 1. 更新科目 Segment 高亮
            var subjBtns = container.querySelectorAll('[data-subj-idx]');
            subjBtns.forEach(function (btn) {
                var i = parseInt(btn.getAttribute('data-subj-idx'), 10);
                if (i === filter.subjectIdx) {
                    btn.style.background = '#3B82F6';
                    btn.style.color = 'white';
                    btn.style.fontWeight = '600';
                    btn.style.boxShadow = '0 2px 6px rgba(59,130,246,0.3)';
                } else {
                    btn.style.background = 'white';
                    btn.style.color = '#374151';
                    btn.style.fontWeight = '400';
                    btn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                }
            });
            // 2. 更新年份按钮高亮
            var yearBtns = container.querySelectorAll('[data-year]');
            yearBtns.forEach(function (btn) {
                var y = btn.getAttribute('data-year');
                if (filter.year && String(filter.year) === String(y)) {
                    btn.style.background = '#3B82F6';
                    btn.style.color = 'white';
                    btn.style.fontWeight = '600';
                } else {
                    btn.style.background = 'white';
                    btn.style.color = '#374151';
                    btn.style.fontWeight = '400';
                }
            });
            // 3. 更新统计与列表
            var countEl = container.querySelector('[data-exam-count]');
            if (countEl) countEl.innerHTML = '共找到 <span style="color:#3B82F6;font-weight:600;">' + filtered.length + '</span> 道真题';
            var listEl = container.querySelector('[data-exam-list]');
            if (listEl) listEl.innerHTML = renderExamCardsHtml(filtered);
            return;
        }

        // 首次完整渲染
        var html = '';

        // 分段控制：科目（每个按钮自带 onclick 筛选）
        var subjHtml = subjects.map(function (s, i) {
            var active = i === filter.subjectIdx;
            var bg = active ? 'background:#3B82F6;color:white;font-weight:600;box-shadow:0 2px 6px rgba(59,130,246,0.3);' : 'background:white;color:#374151;box-shadow:0 1px 3px rgba(0,0,0,0.08);';
            return '<div data-subj-idx="' + i + '" onclick="window.filterPracticeExamBySubject(' + i + ')" style="' + bg + 'padding:6px 14px;border-radius:16px;font-size:12px;white-space:nowrap;cursor:pointer;transition:all 0.2s;">' + s + '</div>';
        }).join('');
        html += '<div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:10px;margin-bottom:6px;">' + subjHtml + '</div>';

        // 年份筛选（每个按钮自带 onclick 筛选）
        var yearsHtml = years.map(function (y) {
            var active = filter.year && String(filter.year) === String(y.year);
            var bg = active ? 'background:#3B82F6;color:white;font-weight:600;' : 'background:white;color:#374151;box-shadow:0 1px 3px rgba(0,0,0,0.08);';
            return '<div data-year="' + y.year + '" onclick="window.filterPracticeExamByYear(\'' + y.year + '\')" style="' + bg + 'padding:6px 14px;border-radius:16px;font-size:12px;white-space:nowrap;cursor:pointer;transition:all 0.2s;">' + y.year + '</div>';
        }).join('');
        html += '<div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:10px;margin-bottom:6px;">' + yearsHtml + '</div>';

        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin:14px 0 10px;">' +
            '<span data-exam-count style="font-size:13px;color:#6B7280;">共找到 <span style="color:#3B82F6;font-weight:600;">' + filtered.length + '</span> 道真题</span>' +
            '<span onclick="showToast(\'打开筛选\')" style="font-size:12px;color:#3B82F6;cursor:pointer;"><i class="fas fa-filter"></i> 筛选</span>' +
            '</div>';

        html += '<div data-exam-list>' + renderExamCardsHtml(filtered) + '</div>';

        container.innerHTML = html;
    }

    // 渲染真题卡片列表 HTML
    function renderExamCardsHtml(exams) {
        if (!exams || exams.length === 0) {
            return '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-folder-open" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无符合条件的真题</div></div>';
        }
        // 缓存当前筛选后的真题，供详情弹窗按 idx 查找
        window.__practiceRealExams = exams;
        return exams.map(function (e, idx) {
            var stars = '★'.repeat(e.level) + '☆'.repeat(5 - e.level);
            return '<div onclick="openPracticeExamDetail(' + idx + ')" data-exam-idx="' + idx + '" style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.08);cursor:pointer;">' +
                '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap;">' +
                Tag(e.subject, e.subjectColor) +
                '<span style="font-size:12px;color:#6B7280;font-weight:600;">' + e.year + '</span>' +
                '<span style="font-size:12px;color:#374151;">' + e.region + '</span>' +
                (e.hot ? '<span style="font-size:11px;background:#FEE2E2;color:#991B1B;padding:1px 6px;border-radius:6px;"><i class="fas fa-fire"></i> 热门</span>' : '') +
                '</div>' +
                '<div style="font-size:14px;font-weight:600;margin-bottom:8px;">' + e.no + '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                '<div style="display:flex;gap:12px;font-size:12px;color:#6B7280;">' +
                '<span>难度 <span style="color:#F59E0B;">' + stars + '</span></span>' +
                '<span>分值 <span style="color:#3B82F6;font-weight:600;">' + e.score + '分</span></span>' +
                '</div>' +
                Tag('含五层架构解析', 'green') +
                '</div>' +
                '</div>';
        }).join('');
    }

    return Page({
        title: '真题',
        tabbar: 'learn',
        content: '<div id="practice-real-exam-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// ---------- 2. 模拟题 ----------
registerPage('practice-mock', '模拟题', '智能刷题', '', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('practice-mock-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('practice-mock').then(function (data) {
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
        var html = '';

        // 缓存数据供过滤使用
        var allMocks = (data.mocks || []).map(function (m, i) {
            m._origIdx = i;
            return m;
        });
        window.__practiceMockData = data;
        window.__practiceMocks = allMocks;
        window.__practiceMockFilters = { subject: '全部', source: '全部' };

        // AI智能组卷入口卡片（紫色渐变）— 点击跳转到 AI 组卷引擎页面
        html += GradientCard('purple', `
            <div onclick="navigateTo('ai-module-paper')" style="display:flex;align-items:center;gap:14px;cursor:pointer;">
                <div style="width:48px;height:48px;border-radius:14px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;"><i class="fas fa-magic"></i></div>
                <div style="flex:1;">
                    <div style="font-size:16px;font-weight:700;">AI智能组卷</div>
                    <div style="font-size:12px;opacity:0.9;margin-top:2px;">根据你的学情自动生成专属试卷</div>
                </div>
                <i class="fas fa-chevron-right" style="font-size:14px;opacity:0.8;"></i>
            </div>
        `);

        // 分段控制：科目（点击过滤模拟题列表）
        var subjects = data.subjects || [];
        var subjectsHtml = subjects.map(function (s, i) {
            var isActive = (i === 0);
            var cls = 'proto-segment-item' + (isActive ? ' active' : '');
            return '<div class="' + cls + '" onclick="switchSegment(this);filterPracticeMock(\'subject\',\'' + s + '\')">' + s + '</div>';
        }).join('');
        html += '<div class="proto-segment">' + subjectsHtml + '</div>';

        // 模拟题来源筛选（点击过滤模拟题列表）
        var sources = data.sources || [];
        var sourcesHtml = sources.map(function (s) {
            var active = s.active;
            var bg = active ? 'background:#3B82F6;color:white;font-weight:600;' : 'background:white;color:#374151;box-shadow:0 1px 3px rgba(0,0,0,0.08);';
            return '<div onclick="filterPracticeMock(\'source\',\'' + s.name + '\')" style="' + bg + 'padding:6px 14px;border-radius:16px;font-size:12px;white-space:nowrap;cursor:pointer;">' + s.name + '</div>';
        }).join('');
        html += '<div id="practice-mock-sources" style="display:flex;gap:8px;overflow-x:auto;padding-bottom:10px;margin-bottom:6px;">' + sourcesHtml + '</div>';

        html += `<div class="section-title"><span>精选模拟卷</span><span class="more" onclick="showToast('查看更多')">更多</span></div>`;

        // 模拟题卡片列表容器（可被过滤函数重新渲染）
        html += '<div id="practice-mock-list">' + renderMockListHtml(allMocks) + '</div>';

        container.innerHTML = html;
    }

    // 渲染模拟题卡片列表（支持过滤后的子集）
    function renderMockListHtml(mocks) {
        var listHtml = '';
        mocks.forEach(function (m, idx) {
            var stars = '★'.repeat(m.level) + '☆'.repeat(5 - m.level);
            var sourceTag = m.source === 'AI生成' ? Tag(m.source, 'purple') : (m.source === '衡水中学' || m.source === '黄冈中学' || m.source === '人大附中' || m.source === '成都七中' ? Tag(m.source, 'blue') : Tag(m.source, 'green'));
            listHtml += '<div onclick="openPracticeMockDetail(' + m._origIdx + ')" data-mock-idx="' + m._origIdx + '" style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.08);cursor:pointer;">' +
                '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap;">' +
                Tag(m.subject, m.subjectColor) +
                sourceTag +
                '</div>' +
                '<div style="font-size:14px;font-weight:600;margin-bottom:8px;">' + m.name + '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#6B7280;">' +
                '<span>难度 <span style="color:#F59E0B;">' + stars + '</span></span>' +
                '<span><i class="fas fa-user"></i> ' + (m.count / 1000).toFixed(1) + 'k人完成</span>' +
                '<span><i class="fas fa-thumbs-up" style="color:#10B981;"></i> ' + m.rate + '%</span>' +
                '</div>' +
                '</div>';
        });
        if (mocks.length === 0) {
            listHtml = '<div style="text-align:center;padding:30px;color:#9CA3AF;font-size:13px;"><i class="fas fa-inbox" style="font-size:24px;margin-bottom:8px;display:block;"></i>暂无符合筛选条件的模拟卷</div>';
        }
        return listHtml;
    }

    return Page({
        title: '模拟题',
        tabbar: 'learn',
        content: '<div id="practice-mock-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// ---------- 3. AI推荐题 ----------
registerPage('practice-ai-recommend', 'AI推荐题', '智能刷题', '', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('practice-ai-recommend-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('practice-ai-recommend').then(function (data) {
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
        var html = '';

        // AI推荐说明
        html += GradientCard('cyan', `
            <div style="display:flex;align-items:flex-start;gap:12px;">
                <div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;"><i class="fas fa-brain"></i></div>
                <div>
                    <div style="font-size:15px;font-weight:700;margin-bottom:4px;">AI 智能推荐</div>
                    <div style="font-size:12px;line-height:1.5;opacity:0.95;">基于你的学习数据，AI为你推荐以下 <span style="font-size:16px;font-weight:700;">${data.total_recommend}</span> 道最值得做的题目</div>
                </div>
            </div>
        `);

        // 推荐理由标签
        var reasons = data.reasons || [];
        var reasonsHtml = reasons.map(function (r) {
            return '<span style="background:' + r.bg + ';color:' + r.color + ';padding:5px 12px;border-radius:14px;font-size:12px;font-weight:600;"><i class="fas ' + r.icon + '"></i> ' + r.text + '</span>';
        }).join('');
        html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">' + reasonsHtml + '</div>';

        // 题目列表
        (data.recommends || []).forEach(function (r, idx) {
            var stars = '★'.repeat(r.level) + '☆'.repeat(5 - r.level);
            var reasonBg = r.reasonColor === 'red' ? '#FEE2E2' : r.reasonColor === 'orange' ? '#FEF3C7' : '#EDE9FE';
            var reasonColor = r.reasonColor === 'red' ? '#991B1B' : r.reasonColor === 'orange' ? '#92400E' : '#5B21B6';
            html += '<div onclick="openPracticeRecommendDetail(' + idx + ')" data-recommend-idx="' + idx + '" style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.08);cursor:pointer;">' +
                '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap;">' +
                Tag(r.subject, r.subjectColor) +
                '<span style="font-size:11px;background:' + reasonBg + ';color:' + reasonColor + ';padding:2px 8px;border-radius:6px;font-weight:600;">' + r.reason + '</span>' +
                '<span style="margin-left:auto;font-size:11px;color:#10B981;font-weight:600;">匹配度 ' + r.match + '%</span>' +
                '</div>' +
                '<div style="font-size:13px;font-weight:600;line-height:1.5;margin-bottom:8px;">' + r.q + '</div>' +
                '<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#6B7280;">' +
                '<span>难度 <span style="color:#F59E0B;">' + stars + '</span></span>' +
                '<span><i class="fas fa-clock"></i> 预计 ' + r.time + '分钟</span>' +
                '</div>' +
                '</div>';
        });

        // 缓存AI推荐题数据
        window.__practiceRecommends = data.recommends || [];

        // 开始推荐训练按钮 + 换一批
        html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:4px;">
            <button class="proto-btn proto-btn-primary" onclick="navigateTo('home-task')"><i class="fas fa-play"></i> 开始推荐训练</button>
            <button class="proto-btn proto-btn-outline" onclick="recommendRefresh()" id="recommend-refresh-btn"><i class="fas fa-sync-alt"></i> 换一批推荐</button>
        </div>
        <div id="recommend-refresh-status" style="display:none;margin-top:8px;padding:8px;background:#EFF6FF;border-radius:8px;font-size:12px;color:#1E40AF;text-align:center;"></div>`;
        window.__recommendData = data;

        container.innerHTML = html;
    }

    return Page({
        title: 'AI推荐题',
        tabbar: 'learn',
        content: '<div id="practice-ai-recommend-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// ---------- 4. 易错题 ----------
registerPage('practice-mistakes', '易错题', '智能刷题', '', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('practice-mistakes-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('practice-mistakes').then(function (data) {
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
        var html = '';

        // 统计卡片
        var stats = data.stats || [];
        var statsHtml = stats.map(function (s) {
            return '<div style="background:white;border-radius:12px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,0.08);text-align:center;">' +
                '<div style="font-size:11px;color:#6B7280;">' + s.label + '</div>' +
                '<div style="font-size:24px;font-weight:700;color:' + s.color + ';margin-top:2px;">' + s.value + '</div>' +
                '</div>';
        }).join('');
        html += '<div class="proto-grid-3" style="margin-bottom:14px;">' + statsHtml + '</div>';

        // 分段控制
        html += Segment(data.tabs || [], 0);

        // 错题列表
        (data.mistakes || []).forEach(function (m, idx) {
            html += '<div style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">' +
                '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;flex-wrap:wrap;">' +
                Tag(m.subject, m.subjectColor) +
                '<span style="font-size:11px;color:#EF4444;font-weight:600;"><i class="fas fa-fire"></i> 错' + m.count + '次</span>' +
                '<span style="font-size:11px;color:#9CA3AF;margin-left:auto;">上次：' + m.last + '</span>' +
                '</div>' +
                '<div style="font-size:13px;font-weight:600;line-height:1.5;margin-bottom:10px;">' + m.q + '</div>' +
                '<div style="display:flex;gap:8px;">' +
                '<div onclick="navigateTo(\'home-task\')" style="flex:1;background:#3B82F6;color:white;text-align:center;padding:8px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;"><i class="fas fa-redo"></i> 重新做</div>' +
                '<div onclick="openPracticeMistakeDetail(' + idx + ')" style="flex:1;background:#F3F4F6;color:#2563EB;text-align:center;padding:8px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;"><i class="fas fa-book-open"></i> 查看解析</div>' +
                '</div>' +
                '</div>';
        });

        // 缓存错题数据
        window.__practiceMistakes = data.mistakes || [];

        container.innerHTML = html;
    }

    return Page({
        title: '易错题',
        tabbar: 'learn',
        content: '<div id="practice-mistakes-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// ---------- 5. 高频考点 ----------
window.__hotpointsData__ = null;
window.switchHotpointSubject = function (el) {
    var items = el.parentNode.querySelectorAll('.segment-item');
    for (var i = 0; i < items.length; i++) items[i].classList.remove('active');
    el.classList.add('active');
    var subject = el.textContent.trim();
    var container = document.getElementById('practice-hotpoints-content');
    if (!container || !window.__hotpointsData__) return;
    renderHotpointsList(container, window.__hotpointsData__, subject);
};

function renderHotpointsList(container, data, subject) {
    var hotpoints = (data.hotpoints && data.hotpoints[subject]) ? data.hotpoints[subject] : [];
    if (!hotpoints || hotpoints.length === 0) {
        container.querySelector('#hotpoints-list').innerHTML = '<div style="text-align:center;padding:30px;color:#9CA3AF;"><i class="fas fa-info-circle" style="font-size:20px;margin-bottom:8px;"></i><div style="font-size:13px;">该学科暂无高频考点数据</div></div>';
        return;
    }
    var html = '';
    hotpoints.forEach(function (h, i) {
        var masteryColor = h.mastery >= 75 ? '#10B981' : h.mastery >= 60 ? '#F59E0B' : '#EF4444';
        var modalHtml = '<div style=&quot;padding:8px;line-height:1.6;&quot;><div style=&quot;font-size:15px;font-weight:600;margin-bottom:10px;color:#111827;&quot;>' + h.name + '</div><div style=&quot;font-size:13px;color:#6B7280;margin-bottom:6px;&quot;>近5年出现 ' + h.freq + '次 · 推荐练习 ' + h.exercises + '题 · 掌握率 ' + h.mastery + '%</div><div style=&quot;font-size:13px;font-weight:600;color:#374151;margin-top:10px;margin-bottom:4px;&quot;><i class=&quot;fas fa-chart-bar&quot; style=&quot;color:#3B82F6;&quot;></i> 考情分析</div><div style=&quot;font-size:12px;color:#6B7280;&quot;>' + h.analysis + '</div><div style=&quot;font-size:13px;font-weight:600;color:#374151;margin-top:10px;margin-bottom:4px;&quot;><i class=&quot;fas fa-list&quot; style=&quot;color:#8B5CF6;&quot;></i> 典型题型</div><div style=&quot;font-size:12px;color:#6B7280;&quot;>' + h.types + '</div><div style=&quot;font-size:13px;font-weight:600;color:#374151;margin-top:10px;margin-bottom:4px;&quot;><i class=&quot;fas fa-lightbulb&quot; style=&quot;color:#F59E0B;&quot;></i> 解题技巧</div><div style=&quot;font-size:12px;color:#6B7280;&quot;>' + h.tips + '</div></div>';
        html += '<div style="background:white;border-radius:12px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;">' +
            '<div onclick="openModal(\'考点详情\', \'' + modalHtml + '\')" style="padding:14px;cursor:pointer;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
            '<div style="display:flex;align-items:center;gap:8px;flex:1;">' +
            '<span style="width:22px;height:22px;border-radius:50%;background:#FEF3C7;color:#92400E;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">' + (i + 1) + '</span>' +
            '<span style="font-size:14px;font-weight:600;">' + h.name + '</span>' +
            '</div>' +
            '<i class="fas fa-chevron-' + (h.expanded ? 'up' : 'down') + '" style="font-size:12px;color:#9CA3AF;"></i>' +
            '</div>' +
            '<div style="display:flex;gap:12px;font-size:12px;color:#6B7280;margin-bottom:8px;flex-wrap:wrap;">' +
            '<span><i class="fas fa-fire" style="color:#EF4444;"></i> 近5年出现 ' + h.freq + '次</span>' +
            '<span>推荐练习 <span style="color:#3B82F6;font-weight:600;">' + h.exercises + '</span> 题</span>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
            '<span style="font-size:11px;color:#6B7280;flex-shrink:0;">掌握率</span>' +
            '<div style="flex:1;">' + Progress(h.mastery, masteryColor) + '</div>' +
            '<span style="font-size:12px;font-weight:600;color:' + masteryColor + ';">' + h.mastery + '%</span>' +
            '</div>' +
            '</div>';
        if (h.expanded) {
            html += '<div style="background:#F9FAFB;padding:14px;border-top:1px solid #E5E7EB;">' +
                '<div style="margin-bottom:10px;">' +
                '<div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:4px;"><i class="fas fa-chart-bar" style="color:#3B82F6;"></i> 考情分析</div>' +
                '<div style="font-size:12px;color:#6B7280;line-height:1.5;">' + h.analysis + '</div>' +
                '</div>' +
                '<div style="margin-bottom:10px;">' +
                '<div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:4px;"><i class="fas fa-list" style="color:#8B5CF6;"></i> 典型题型</div>' +
                '<div style="font-size:12px;color:#6B7280;line-height:1.5;">' + h.types + '</div>' +
                '</div>' +
                '<div>' +
                '<div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:4px;"><i class="fas fa-lightbulb" style="color:#F59E0B;"></i> 解题技巧</div>' +
                '<div style="font-size:12px;color:#6B7280;line-height:1.5;">' + h.tips + '</div>' +
                '</div>' +
                '</div>';
        }
        html += '</div>';
    });
    html += '<button class="proto-btn proto-btn-primary" style="margin-top:4px;" onclick="navigateTo(\'home-task\')"><i class="fas fa-bolt"></i> 开始高频考点专项训练</button>';
    container.querySelector('#hotpoints-list').innerHTML = html;
}

registerPage('practice-hotpoints', '高频考点', '智能刷题', '', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('practice-hotpoints-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('practice-hotpoints').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div></div>';
                return;
            }
            window.__hotpointsData__ = data;
            renderHotpointsPage(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderHotpointsPage(container, data) {
        var html = '';
        // 科目选择分段控制（可点击切换）
        var subjects = data.subjects || [];
        html += '<div class="segment-control" style="display:flex;background:#F3F4F6;border-radius:10px;padding:3px;margin-bottom:14px;overflow-x:auto;">';
        subjects.forEach(function (s, i) {
            html += '<div class="segment-item' + (i === 0 ? ' active' : '') + '" onclick="switchHotpointSubject(this)" style="flex:1;min-width:48px;text-align:center;padding:6px 8px;font-size:12px;font-weight:500;border-radius:8px;cursor:pointer;transition:all .2s;' + (i === 0 ? 'background:white;color:#2563EB;box-shadow:0 1px 2px rgba(0,0,0,0.06);' : 'color:#6B7280;') + '">' + s + '</div>';
        });
        html += '</div>';
        // 说明
        html += '<div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:8px;">' +
            '<i class="fas fa-info-circle" style="color:#3B82F6;"></i>' +
            '<span style="font-size:12px;color:#2563EB;">' + data.info + '</span>' +
            '</div>';
        // 考点列表容器
        html += '<div id="hotpoints-list"></div>';
        container.innerHTML = html;
        // 初始渲染数学
        renderHotpointsList(container, data, subjects[0] || '数学');
    }

    return Page({
        title: '高频考点',
        tabbar: 'learn',
        content: '<div id="practice-hotpoints-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// 全局：AI推荐题"换一批"交互（协同过滤 + 知识图谱推荐）
window.recommendRefresh = function () {
    var btn = document.getElementById('recommend-refresh-btn');
    var status = document.getElementById('recommend-refresh-status');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
    if (status) { status.style.display = 'block'; }

    var phases = [
        '协同过滤分析相似学情…',
        'DeepKE知识图谱匹配薄弱点…',
        'BERT题库相似度检索…',
        '生成个性化推荐完成！'
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
                status.innerHTML = '<i class="fas fa-check-circle"></i> 推荐已更新！' + (window.__recommendData && window.__recommendData.recommends ? window.__recommendData.recommends.length : 0) + '道新题目已匹配（匹配度≥85%）';
            }
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
            setTimeout(function () { if (status) status.style.display = 'none'; }, 4000);
        }
    }, 500);
};
