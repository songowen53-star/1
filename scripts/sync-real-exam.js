// ============================================================
// sync-real-exam.js
// 功能：
//   1) [可选] --dir <目录> 或 --path "D:\\高考数据库"：先调用后端 POST /api/questions/import-dir
//      接口，从本地目录（按"年份/科目/试卷.json"组织）递归扫描，批量导入真题到 questions.json
//      示例：
//        node scripts/sync-real-exam.js --dir "/workspace/高考数据库"
//        node scripts/sync-real-exam.js --dir "D:\\高考数据库" --api-base "http://127.0.0.1:8788"
//   2) 从 backend/data/questions.json 提取 source=real_exam 的题目，同步到
//      backend/data/pages/practice-real-exam.json（前端智能刷题-真题页使用）
// ============================================================

const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const QUESTIONS_FILE = path.join(ROOT, 'backend', 'data', 'questions.json');
const KP_FILE = path.join(ROOT, 'backend', 'data', 'knowledge_points.json');
const OUTPUT_FILE = path.join(ROOT, 'backend', 'data', 'pages', 'practice-real-exam.json');

// ===== CLI 参数解析 =====
const argv = process.argv.slice(2);
function getArg(flag) {
    var i = argv.indexOf(flag);
    if (i < 0) i = argv.findIndex(function (a) { return a.indexOf(flag + '=') === 0; });
    if (i < 0) return null;
    var raw = argv[i];
    if (raw.indexOf(flag + '=') === 0) return raw.slice((flag + '=').length);
    return argv[i + 1] || '';
}
var DIR_PATH = getArg('--dir') || getArg('--path') || getArg('-d');
var API_BASE = getArg('--api-base') || getArg('--host') || 'http://127.0.0.1:8788';
var DRY_RUN = argv.indexOf('--dry-run') >= 0 || argv.indexOf('--preview') >= 0;
var NO_RECURSIVE = argv.indexOf('--no-recursive') >= 0;

// ===== 步骤0：若指定 --dir，先通过 /api/questions/import-dir 导入本地真题 =====
function runImportDirStep() {
    if (!DIR_PATH) return Promise.resolve({ skipped: true, reason: '未指定 --dir/--path，跳过"从本地目录导入真题"步骤' });
    return new Promise(function (resolve) {
        var body = JSON.stringify({
            dir_path: DIR_PATH,
            recursive: !NO_RECURSIVE,
            dry_run: DRY_RUN
        });
        var opts = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            },
            timeout: 60000
        };
        // 从 API_BASE 中解析 host/port/path
        var base = API_BASE.replace(/\/$/, '');
        var urlMatch = base.match(/^http:\/\/([^:/]+)(?::(\d+))?(.*)$/);
        if (!urlMatch) {
            resolve({ skipped: false, error: 'API_BASE 必须是 http://host[:port] 形式，当前值: ' + API_BASE });
            return;
        }
        var host = urlMatch[1];
        var port = Number(urlMatch[2] || 80);
        var prePath = urlMatch[3] || '';
        opts.host = host;
        opts.port = port;
        opts.path = prePath + '/api/questions/import-dir';

        console.log('[导入步骤] POST ' + 'http://' + host + ':' + port + opts.path);
        console.log('[导入步骤] dir_path=' + DIR_PATH + '  recursive=' + !NO_RECURSIVE + '  dry_run=' + DRY_RUN);

        var req = http.request(opts, function (res) {
            var chunks = [];
            res.on('data', function (c) { chunks.push(c); });
            res.on('end', function () {
                var text = Buffer.concat(chunks).toString('utf8');
                try {
                    var obj = JSON.parse(text);
                    resolve({ ok: obj.code === 0, status: res.statusCode, response: obj });
                } catch (e) {
                    resolve({ ok: false, status: res.statusCode, raw: text.slice(0, 500), parseError: e.message });
                }
            });
        });
        req.on('timeout', function () {
            req.destroy(new Error('请求超时(60s)'));
        });
        req.on('error', function (e) {
            resolve({ ok: false, error: '请求失败: ' + e.message + '。请确保后端服务运行于 ' + API_BASE });
        });
        req.write(body);
        req.end();
    });
}

// ===== 主流程 =====
runImportDirStep().then(function (importResult) {
    console.log('\n======== 步骤0：目录批量导入真题 ========');
    if (importResult.skipped) {
        console.log('跳过：' + importResult.reason);
        console.log('提示：若要从 D:\\高考数据库（或 /workspace/高考数据库）导入，请使用：');
        console.log('  node scripts/sync-real-exam.js --dir "/workspace/高考数据库"');
        console.log('  node scripts/sync-real-exam.js --dir "D:\\\\高考数据库"');
    } else if (importResult.error) {
        console.warn('导入失败：' + importResult.error);
        console.warn('将继续执行后续同步（使用本地 questions.json 现有数据）');
    } else if (!importResult.ok) {
        console.warn('导入失败：HTTP ' + importResult.status + '，响应：' + JSON.stringify(importResult.response || importResult.raw));
        console.warn('将继续执行后续同步（使用本地 questions.json 现有数据）');
    } else {
        var d = importResult.response.data || {};
        console.log('导入成功：' + importResult.response.msg);
        console.log('解析目录：' + d.original_dir + ' → ' + d.resolved_dir);
        console.log('扫描 JSON 文件：' + d.scanned_files + ' 个');
        console.log('成功导入：' + d.imported_count + ' 道真题');
        if (d.skipped_count > 0) console.log('重复跳过：' + d.skipped_count + ' 道');
        if (d.error_count > 0) console.log('文件错误：' + d.error_count + ' 个（见 skipped/errors 明细）');
    }

    // ============ 原有同步逻辑（从 questions.json 到 practice-real-exam.json）============
    syncBackendToFrontend();
});

function syncBackendToFrontend() {
    console.log('\n======== 步骤1：后端真题 → 前端真题页面数据同步 ========');

// 科目 → 颜色映射（与现有 practice-real-exam.json 保持一致）
const SUBJECT_COLOR = {
    '数学': 'blue',
    '英语': 'green',
    '物理': 'orange',
    '化学': 'purple',
    '语文': 'red',
    '生物': 'green',
    '政治': 'purple',
    '思想政治': 'purple',
    '历史': 'orange',
    '地理': 'blue'
};

// 读取数据
const questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf8'));
const knowledgePoints = JSON.parse(fs.readFileSync(KP_FILE, 'utf8'));
const existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));

// 构建 knowledge_point_id → name 映射
const kpMap = {};
knowledgePoints.forEach(kp => { kpMap[kp.id] = kp.name; });

// 从后端提取真题
const realExams = questions.filter(q => q.source === 'real_exam');

// 转换为前端格式
const newExams = realExams.map(q => {
    return {
        subject: q.subject || '未知',
        subjectColor: SUBJECT_COLOR[q.subject] || 'blue',
        year: String(q.year),
        region: q.province || '未知',
        no: q.question_number || '',
        level: q.difficulty || 3,
        score: q.score || 0,
        hot: q.difficulty >= 5,  // 难度5以上的标为热门
        type: q.type || '解答题',
        knowledge_point: kpMap[q.knowledge_point_id] || q.knowledge_point_id || '综合',
        question: q.content || '',
        options: [],  // 后端暂无选项数据，预留空数组
        answer: q.answer || '暂无答案',
        analysis: q.analysis || '暂无解析',
        // 保留后端原始 ID，便于追溯
        _id: q.id,
        _paper_name: q.paper_name || ''
    };
});

// Mock 真题：保留无 _id 的原有 Mock 数据
const mockExams = (existingData.exams || []).filter(e => !e._id);

// 全量合并：Mock 真题 + 后端真题，去重键 subject+year+no
const mergedExams = [...mockExams];
const seenKeys = new Set(mockExams.map(e => (e.subject || '') + '_' + (e.year || '') + '_' + (e.no || '')));
let addedCount = 0;
newExams.forEach(e => {
    const key = e.subject + '_' + e.year + '_' + e.no;
    if (!seenKeys.has(key)) {
        mergedExams.push(e);
        seenKeys.add(key);
        addedCount++;
    } else {
        // 已存在同 subject+year+no，则用后端真题覆盖 Mock 版本
        const idx = mergedExams.findIndex(m => (m.subject || '') + '_' + (m.year || '') + '_' + (m.no || '') === key);
        if (idx >= 0) mergedExams[idx] = e;
    }
});

// 更新统计数据
const allYears = [...new Set(mergedExams.map(e => e.year))].sort((a, b) => Number(b) - Number(a));
const yearsData = allYears.map((y, i) => ({ year: y, active: i === 0 }));

// 科目列表（按标准高考九科顺序排列）
const STANDARD_SUBJECTS = ['全部', '语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];
const allSubjectsInData = [...new Set(mergedExams.map(e => e.subject))];
// 优先按标准顺序，新出现的科目追加到末尾
const finalSubjects = STANDARD_SUBJECTS.filter(s => s === '全部' || allSubjectsInData.includes(s));
allSubjectsInData.forEach(s => {
    if (!finalSubjects.includes(s)) finalSubjects.push(s);
});

// 写入文件
existingData.subjects = finalSubjects;
existingData.years = yearsData;
existingData.total_count = mergedExams.length;
existingData.exams = mergedExams;

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existingData, null, 2), 'utf8');

console.log('=== 同步完成：后端真题 → 前端真题页数据 ===');
console.log('后端真题总数:', realExams.length);
console.log('Mock 真题:', mockExams.length);
console.log('新增后端真题:', addedCount);
console.log('合并后真题总数:', mergedExams.length);
console.log('年份分布:', allYears.join(', '));
console.log('科目列表:', finalSubjects.join(', '));
console.log('输出文件:', OUTPUT_FILE);
}
