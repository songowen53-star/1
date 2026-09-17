// ========== 题库路由 ==========
// 提供题目CRUD + 多维筛选
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');

// 允许访问的本地目录白名单（安全：防止路径穿越访问任意文件）
const SAFE_IMPORT_ROOTS = [
    path.resolve(__dirname, '..', '..', '高考数据库'),  // /workspace/高考数据库（等价 D:\高考数据库）
    path.resolve(__dirname, '..', 'data'),                // /workspace/backend/data
    path.resolve(__dirname, '..', '..', 'import-data'),   // /workspace/import-data（预留）
];
// 同时允许路径前缀包含这些关键目录名（跨平台兼容 Windows D:\ 等盘符映射）
const SAFE_DIRNAME_MARKERS = ['高考数据库', 'import-data', 'backend/data'];

// ========== 学科名归一化（统一入口：别名 / 英文 / 变体 → 标准中文名） ==========
const SUBJECT_ALIASES = {
    math: '数学', maths: '数学', shuxue: '数学', '数学': '数学',
    chinese: '语文', yuwen: '语文', '语文': '语文',
    english: '英语', yingyu: '英语', '英语': '英语',
    physics: '物理', wuli: '物理', '物理': '物理',
    chemistry: '化学', huaxue: '化学', '化学': '化学',
    biology: '生物', shengwu: '生物', '生物': '生物',
    politics: '政治', zhengzhi: '政治', '政治': '政治',
    '思想政治': '政治', '思政': '政治', '道德与法治': '政治',
    history: '历史', lishi: '历史', '历史': '历史',
    geography: '地理', dili: '地理', '地理': '地理'
};
const normSubject = (s) => {
    if (!s) return s;
    var key = String(s).trim().toLowerCase().replace(/\s+/g, '');
    if (SUBJECT_ALIASES[key]) return SUBJECT_ALIASES[key];
    // 兼容"思想政治/政治/思政/道德与法治"中文匹配（大小写trim后已处理）
    if (/思想?政治?|思政|道德与法治/.test(String(s))) return '政治';
    return s;
};
// 过滤器：取 questions 列表 + 条件对象（subject / difficulty / type / source / knowledge_point_id / count）
function filterQuestions(cond) {
    cond = cond || {};
    let list = db.list('questions');
    if (cond.subject) {
        var ns = normSubject(cond.subject);
        list = list.filter(q => normSubject(q.subject) === ns);
    }
    if (cond.knowledge_point_id) list = list.filter(q => q.knowledge_point_id === cond.knowledge_point_id);
    if (cond.difficulty != null && cond.difficulty !== '') {
        var d = parseInt(cond.difficulty);
        if (!isNaN(d)) list = list.filter(q => q.difficulty === d);
    }
    if (cond.type) list = list.filter(q => q.type === cond.type);
    if (cond.source) {
        if (cond.source === 'real_exam') list = list.filter(q => q.source === 'real_exam');
        else list = list.filter(q => (q.source || 'other') === cond.source);
    }
    var total = list.length;
    var count = parseInt(cond.count || cond.limit || '0', 10);
    if (count > 0 && count < list.length) list = list.slice(0, count);
    return { list: list, total: total };
}

// 题目列表（支持科目、考点、难度、题型、来源、数量筛选）
// GET /api/questions?subject=数学|math&knowledge_point_id=kp_math_01&difficulty=5&type=解答题&source=real_exam&count=8
router.get('/', (req, res) => {
    var r = filterQuestions(req.query);
    res.json({ code: 0, data: r.list, total: r.total });
});

// POST 多维搜索（Body 传参：避开代理/防火墙对中文 URL 查询参数的拦截）
// POST /api/questions/search  body: { subject, difficulty, type, source, knowledge_point_id, count }
router.post('/search', (req, res) => {
    try {
        var r = filterQuestions(req.body || {});
        res.json({ code: 0, data: r.list, total: r.total });
    } catch (e) {
        console.error('[questions/search error]', e);
        res.status(500).json({ code: 1, msg: e.message });
    }
});

// 题目详情（含考点信息）
router.get('/:id', (req, res) => {
    const q = db.findById('questions', req.params.id);
    if (!q) return res.status(404).json({ code: 1, msg: '题目不存在' });
    const kp = db.findById('knowledge_points', q.knowledge_point_id);
    res.json({ code: 0, data: { ...q, knowledge_point: kp } });
});

// 批量导入题目（支持粘贴真题文本或JSON数组）
// POST /api/questions/import  body: { format: 'json'|'text', data: [...] 或 "题干...\n答案...\n..." }
router.post('/import', (req, res) => {
    const { format, data } = req.body || {};
    let imported = [];
    try {
        if (format === 'json' && Array.isArray(data)) {
            data.forEach(item => {
                const record = db.insert('questions', {
                    source: item.source || 'real_exam',
                    year: item.year || null,
                    province: item.province || null,
                    paper_name: item.paper_name || null,
                    question_number: item.question_number || null,
                    subject: item.subject,
                    knowledge_point_id: item.knowledge_point_id || null,
                    type: item.type || '选择题',
                    difficulty: item.difficulty || 3,
                    score: item.score || 0,
                    content: item.content || '',
                    options: item.options || null,
                    answer: item.answer || '',
                    analysis: item.analysis || ''
                });
                imported.push(record);
            });
        } else if (format === 'text' && typeof data === 'string') {
            // 简单文本格式：按"【题干】【答案】【解析】【年份】"分隔，题目间以"---"分隔
            const blocks = data.split(/^---\s*$/m).map(b => b.trim()).filter(Boolean);
            blocks.forEach(block => {
                const extract = (tag) => {
                    const re = new RegExp(`【${tag}】\\s*([\\s\\S]*?)(?=【|$)`);
                    const m = block.match(re);
                    return m ? m[1].trim() : '';
                };
                const content = extract('题干') || block;
                const record = db.insert('questions', {
                    source: 'real_exam',
                    year: parseInt(extract('年份')) || null,
                    province: extract('省份') || null,
                    paper_name: extract('试卷') || null,
                    subject: extract('科目') || '数学',
                    type: extract('题型') || '解答题',
                    difficulty: parseInt(extract('难度')) || 3,
                    score: parseInt(extract('分值')) || 0,
                    content,
                    answer: extract('答案'),
                    analysis: extract('解析')
                });
                imported.push(record);
            });
        } else {
            return res.status(400).json({ code: 1, msg: 'format 必须是 json 或 text，data 不能为空' });
        }
    } catch (e) {
        console.error('[import error]', e);
        return res.status(500).json({ code: 1, msg: '导入失败: ' + e.message });
    }
    res.json({ code: 0, data: { count: imported.length, questions: imported }, msg: `成功导入 ${imported.length} 道题` });
});

// 从本地目录递归扫描导入真题（JSON 文件）——支持按"年份/科目/试卷.json"结构组织
// POST /api/questions/import-dir  body: { dir_path: 'D:\\高考数据库' | '/workspace/高考数据库', recursive?: true, dry_run?: false }
// 安全：目录必须位于 SAFE_IMPORT_ROOTS 白名单下，或路径包含 SAFE_DIRNAME_MARKERS 关键词
router.post('/import-dir', (req, res) => {
    let { dir_path, recursive = true, dry_run = false } = req.body || {};
    if (!dir_path || typeof dir_path !== 'string') {
        return res.status(400).json({ code: 1, msg: 'dir_path 必填（字符串）' });
    }
    // 标准化路径分隔符并解析绝对路径
    var normalized = String(dir_path).replace(/\\\\/g, '/').replace(/\\/g, '/');
    // 兼容 Windows 盘符：D:\高考数据库 → /workspace/高考数据库
    var mapped = normalized;
    var driveLetterRe = /^[A-Za-z]:/;
    if (driveLetterRe.test(normalized)) {
        // 去掉盘符前缀 D:、D:\、D:/ 仅取后缀路径部分，映射到 /workspace 下
        var tail = normalized.replace(driveLetterRe, '');
        if (tail.charAt(0) === '/') tail = tail.slice(1);
        if (tail.charAt(0) === '/') tail = tail.slice(1);
        mapped = path.resolve(__dirname, '..', '..', tail);
    } else if (!path.isAbsolute(mapped)) {
        mapped = path.resolve(__dirname, '..', '..', mapped);
    }
    mapped = path.normalize(mapped);

    // 安全校验：白名单路径或包含安全标记
    var underSafeRoot = SAFE_IMPORT_ROOTS.some(function (r) {
        try { return mapped.indexOf(path.normalize(r)) === 0; } catch(e) { return false; }
    });
    var hasSafeMarker = SAFE_DIRNAME_MARKERS.some(function (m) {
        return mapped.indexOf(m) >= 0;
    });
    if (!underSafeRoot && !hasSafeMarker) {
        return res.status(403).json({
            code: 1,
            msg: '目录不在安全白名单范围内，仅允许导入 [高考数据库 | import-data | backend/data] 目录下的文件',
            safe_roots: SAFE_IMPORT_ROOTS
        });
    }
    // 目录必须存在
    if (!fs.existsSync(mapped) || !fs.statSync(mapped).isDirectory()) {
        return res.status(400).json({ code: 1, msg: '目录不存在或不是目录: ' + mapped, resolved: mapped });
    }

    // 递归扫描 JSON 文件
    function scanDir(dir, files) {
        var entries = fs.readdirSync(dir, { withFileTypes: true });
        entries.forEach(function (ent) {
            var full = path.join(dir, ent.name);
            if (ent.isDirectory()) {
                if (recursive) scanDir(full, files);
            } else if (ent.isFile() && ent.name.toLowerCase().endsWith('.json')) {
                files.push(full);
            }
        });
        return files;
    }
    var files = scanDir(mapped, []);
    var imported = [];
    var skipped = [];
    var errors = [];

    files.forEach(function (file) {
        try {
            var raw = fs.readFileSync(file, 'utf8');
            var data;
            try { data = JSON.parse(raw); } catch (pe) {
                skipped.push({ file: file, reason: 'JSON解析失败: ' + pe.message });
                return;
            }
            var items = Array.isArray(data) ? data : (data && Array.isArray(data.questions) ? data.questions : [data]);
            // 从文件路径推断默认字段：年份、科目、省份、试卷名
            var relPath = path.relative(mapped, file).replace(/\\/g, '/');
            var parts = relPath.split('/');  // ["2025年真题","数学","全国甲卷-理科数学.json"]
            var inferredYear = null;
            var inferredSubject = null;
            var inferredPaper = path.basename(file, '.json');
            if (parts.length >= 1) {
                var m = (parts[0] || '').match(/(20\d{2})/);
                if (m) inferredYear = Number(m[1]);
            }
            if (parts.length >= 2) inferredSubject = parts[1];

            items.forEach(function (it) {
                if (!it || typeof it !== 'object') return;
                // 若题目没有显式 id，生成稳定 id（防止重复导入）
                var itemId = it.id || 'q_import_' + hashStable(inferredPaper + '::' + (it.question_number || '') + '::' + String(it.content || '').slice(0, 40));
                // 去重键：subject+year+question_number+content前30字
                var dedupeKey = (it.subject || inferredSubject || '') + '|' + (it.year || inferredYear || '') + '|' + (it.question_number || '') + '|' + String(it.content || '').slice(0, 30);
                var existing = db.list('questions').find(function (q) {
                    var key = (q.subject || '') + '|' + (q.year || '') + '|' + (q.question_number || '') + '|' + String(q.content || '').slice(0, 30);
                    return key === dedupeKey;
                });
                if (existing) {
                    skipped.push({ file: file, no: it.question_number || '', key: dedupeKey.slice(0, 50), reason: '已存在同题，跳过' });
                    return;
                }
                if (!dry_run) {
                    var record = db.insert('questions', {
                        id: itemId,
                        source: it.source || 'real_exam',
                        year: it.year || inferredYear || null,
                        province: it.province || inferredPaper ? extractProvinceFromFilename(inferredPaper) : null,
                        paper_name: it.paper_name || inferredPaper || null,
                        question_number: it.question_number || null,
                        subject: it.subject || inferredSubject || '未分类',
                        knowledge_point_id: it.knowledge_point_id || null,
                        type: it.type || '解答题',
                        difficulty: it.difficulty || 3,
                        score: it.score || 0,
                        content: it.content || '',
                        options: it.options || null,
                        answer: it.answer || '',
                        analysis: it.analysis || ''
                    });
                    imported.push(record);
                } else {
                    imported.push({
                        id: itemId,
                        subject: it.subject || inferredSubject || '未分类',
                        year: it.year || inferredYear || null,
                        paper_name: it.paper_name || inferredPaper || null,
                        question_number: it.question_number || null,
                        type: it.type || '解答题',
                        difficulty: it.difficulty || 3,
                        score: it.score || 0,
                        _file: file,
                        _dry_run: true
                    });
                }
            });
        } catch (e) {
            errors.push({ file: file, reason: e.message });
        }
    });

    res.json({
        code: 0,
        msg: dry_run ? '预览完成（未实际写入数据库）' : `成功导入 ${imported.length} 道真题`,
        data: {
            resolved_dir: mapped,
            original_dir: dir_path,
            scanned_files: files.length,
            imported_count: imported.length,
            skipped_count: skipped.length,
            error_count: errors.length,
            imported: imported.slice(0, 200),  // 只返回前 200 条防止响应过大
            skipped: skipped.slice(0, 50),
            errors: errors.slice(0, 50)
        }
    });
});

// 稳定 hash（FNV-1a 32bit），短 id 用
function hashStable(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(36);
}
function extractProvinceFromFilename(name) {
    var m = name.match(/(全国甲卷|全国乙卷|全国Ⅰ卷|全国Ⅱ卷|全国新高考Ⅰ卷|全国新高考Ⅱ卷|浙江卷|江苏卷|山东卷|广东卷|湖南卷|湖北卷|河北卷|福建卷|重庆卷|辽宁卷|海南卷|北京卷|上海卷|天津卷|四川卷|陕西卷)/);
    return m ? m[1] : null;
}

// 新增题目
router.post('/', (req, res) => {
    const { subject, knowledge_point_id, type, difficulty, score, content, answer, analysis, source, year, province, paper_name, question_number, options } = req.body;
    if (!subject || !content) return res.status(400).json({ code: 1, msg: '科目和题干必填' });
    const record = db.insert('questions', {
        subject, knowledge_point_id,
        type: type || '选择题',
        difficulty: difficulty || 3,
        score: score || 0,
        content,
        answer: answer || '',
        analysis: analysis || '',
        source: source || 'other',
        year: year || null,
        province: province || null,
        paper_name: paper_name || null,
        question_number: question_number || null,
        options: options || null
    });
    res.json({ code: 0, data: record, msg: '新增成功' });
});

// 更新题目
router.put('/:id', (req, res) => {
    const record = db.update('questions', req.params.id, req.body);
    if (!record) return res.status(404).json({ code: 1, msg: '题目不存在' });
    res.json({ code: 0, data: record, msg: '更新成功' });
});

// 删除题目
router.delete('/:id', (req, res) => {
    const ok = db.remove('questions', req.params.id);
    if (!ok) return res.status(404).json({ code: 1, msg: '题目不存在' });
    res.json({ code: 0, msg: '删除成功' });
});

module.exports = router;
