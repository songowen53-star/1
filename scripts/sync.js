#!/usr/bin/env node
/**
 * AI高考智能提分系统 - 本地 / Cloudflare 双向同步工具
 *
 * 用法:
 *   node scripts/sync.js build-static   本地源 HTML/prototype → dist
 *   node scripts/sync.js push-data      backend/data/*.json → 云端 KV (走 Pages /api/upload)
 *   node scripts/sync.js pull-data      云端 KV → backend/data/ (走 Pages /api/data-files)
 *   node scripts/sync.js deploy         dist → Cloudflare Pages (wrangler)
 *   node scripts/sync.js status         本地 & 云端 对比报告 (只读)
 *   node scripts/sync.js all            build-static → push-data → deploy (默认)
 *
 * 环境变量 (可覆盖默认值):
 *   CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID  (wrangler 用, push/pull 不需要)
 *   PAGES_PROJECT        默认 ai-gaokao-static
 *   KV_NAMESPACE_ID      默认 01045986... (保留兼容, 但 pull/push 走 Pages API)
 *   DEPLOY_BRANCH        默认 main
 *   PAGES_URL            默认 https://ai-gaokao-static.pages.dev
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const BACKEND_DATA = path.join(ROOT, 'backend', 'data');
const PROTOTYPE = path.join(ROOT, 'prototype');

const TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const ACC = process.env.CLOUDFLARE_ACCOUNT_ID;
const PROJECT = process.env.PAGES_PROJECT || 'ai-gaokao-static';
const NS_ID = process.env.KV_NAMESPACE_ID || '010459867762414698c5b5cbffa5a843';
const BRANCH = process.env.DEPLOY_BRANCH || 'main';
const PAGES_URL = process.env.PAGES_URL || 'https://ai-gaokao-static.pages.dev';

function log(level) {
    var args = Array.prototype.slice.call(arguments, 1);
    var prefixes = { ok: '✅ ', warn: '⚠️  ', err: '❌ ', info: 'ℹ️  ', cmd: '🚀 ', head: '' };
    console.log((prefixes[level] || '   ') + args.join(' '));
}
function ensureDir(p) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }
function listDir(dir, ext) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter(function (f) {
        var okFile = fs.statSync(path.join(dir, f)).isFile();
        if (!okFile) return false;
        if (!ext) return true;
        return f.indexOf(ext, f.length - ext.length) !== -1;
    });
}
function safeName(f) { return String(f).replace(/[^a-zA-Z0-9_\u4e00-\u9fa5.\-]/g, '_'); }
function humanSize(n) { return n < 1024 ? n + ' B' : (n / 1024).toFixed(1) + ' KB'; }
function countFilesRecursive(dir) {
    if (!fs.existsSync(dir)) return 0;
    var n = 0;
    fs.readdirSync(dir).forEach(function (e) {
        var f = path.join(dir, e);
        n += fs.statSync(f).isDirectory() ? countFilesRecursive(f) : 1;
    });
    return n;
}
function recursiveCopy(srcDir, dstDir) {
    ensureDir(dstDir);
    var out = [];
    fs.readdirSync(srcDir).forEach(function (entry) {
        var s = path.join(srcDir, entry);
        var d = path.join(dstDir, entry);
        var st = fs.statSync(s);
        if (st.isDirectory()) out = out.concat(recursiveCopy(s, d));
        else if (st.isFile()) { fs.copyFileSync(s, d); out.push(path.relative(DIST, d)); }
    });
    return out;
}

// 通用 HTTPS POST JSON（自动支持 HTTP(S)_PROXY 环境变量，通过 curl 走代理）
function httpsPostJson(urlStr, payload) {
    return new Promise(function (resolve, reject) {
        var body = JSON.stringify(payload);
        // 写入临时文件避免 shell 转义问题
        var tmp = path.join(require('os').tmpdir(), 'sync_payload_' + process.pid + '.json');
        fs.writeFileSync(tmp, body, 'utf8');
        var proxyOpt = '';
        var proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
        if (proxy) proxyOpt = ' --proxy ' + JSON.stringify(proxy);
        var cmd = 'curl -sS -m 30' + proxyOpt + ' -H "Content-Type: application/json" -H "User-Agent: ai-gaokao-sync/1.0" -X POST --data-binary @' + JSON.stringify(tmp) + ' -w "\\n__HTTP_STATUS__:%{http_code}" ' + JSON.stringify(urlStr);
        require('child_process').exec(cmd, { encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 }, function (err, stdout, stderr) {
            try { fs.unlinkSync(tmp); } catch (e) {}
            if (err) { reject(new Error('curl POST 失败: ' + (err.message || String(err)) + (stderr ? ' stderr=' + stderr.slice(0,200) : ''))); return; }
            var m = stdout.match(/__HTTP_STATUS__:(\d+)$/);
            var status = m ? parseInt(m[1], 10) : 0;
            var t = m ? stdout.slice(0, m.index) : stdout;
            t = t.replace(/\n$/, '');
            try { resolve({ status: status, data: JSON.parse(t) }); }
            catch (e) { resolve({ status: status, raw: t }); }
        });
    });
}

function httpsGetJson(urlStr) {
    return new Promise(function (resolve, reject) {
        var proxyOpt = '';
        var proxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
        if (proxy) proxyOpt = ' --proxy ' + JSON.stringify(proxy);
        var cmd = 'curl -sS -m 30' + proxyOpt + ' -H "User-Agent: ai-gaokao-sync/1.0" -w "\\n__HTTP_STATUS__:%{http_code}" ' + JSON.stringify(urlStr);
        require('child_process').exec(cmd, { encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 }, function (err, stdout, stderr) {
            if (err) { reject(new Error('curl GET 失败: ' + (err.message || String(err)) + (stderr ? ' stderr=' + stderr.slice(0,200) : ''))); return; }
            var m = stdout.match(/__HTTP_STATUS__:(\d+)$/);
            var status = m ? parseInt(m[1], 10) : 0;
            var t = m ? stdout.slice(0, m.index) : stdout;
            t = t.replace(/\n$/, '');
            if (status >= 400) { reject(new Error('HTTP ' + status + ': ' + t.slice(0, 200))); return; }
            try { resolve(JSON.parse(t)); }
            catch (e) { reject(new Error('非JSON(HTTP' + status + '): ' + t.slice(0, 200))); }
        });
    });
}

// ===== build-static
function buildStatic() {
    log('head', '─── build-static: 本地源 → dist ───');
    ensureDir(DIST);
    // 1. 顶层 HTML 文件
    var topHTML = ['index.html', 'index-home.html', 'index-static.html', 'data-manager.html'];
    topHTML.forEach(function (f) {
        var s = path.join(ROOT, f);
        var d = path.join(DIST, f);
        if (fs.existsSync(s)) { fs.copyFileSync(s, d); log('ok', '复制 ' + f + ' → dist/' + f); }
        else log('warn', '跳过(源缺) ' + f);
    });
    // 2. 顶层静态资源目录 + Cloudflare Pages Functions
    var assetDirs = ['js', 'css', 'images', 'assets', 'img', 'fonts', 'lib', 'functions'];
    assetDirs.forEach(function (dir) {
        var s = path.join(ROOT, dir);
        var d = path.join(DIST, dir);
        if (fs.existsSync(s) && fs.statSync(s).isDirectory()) {
            var files = recursiveCopy(s, d);
            log('ok', '复制 ' + dir + '/ → dist/' + dir + '/（共 ' + files.length + ' 个文件）');
        }
    });
    // 3. prototype 目录
    if (fs.existsSync(PROTOTYPE)) {
        var files = recursiveCopy(PROTOTYPE, path.join(DIST, 'prototype'));
        log('ok', '复制 prototype/ → dist/prototype/（共 ' + files.length + ' 个文件）');
    } else log('warn', '跳过(源缺) prototype/');
    log('info', 'dist 根目录条目: ' + fs.readdirSync(DIST).length + '，dist 总文件数: ' + countFilesRecursive(DIST));
}

// ===== push-data (通过 Pages /api/upload)
async function pushData() {
    log('head', '─── push-data: backend/data/*.json → 云端 KV ───');
    var ok = 0, fail = 0;

    // 1) 顶层 .json 文件 (filename = 文件名, 如 learning_records.json)
    var topFiles = listDir(BACKEND_DATA, '.json').filter(function (f) { return f.charAt(0) !== '.'; });
    log('info', '顶层 JSON 文件: ' + topFiles.length + ' 个');
    for (var i = 0; i < topFiles.length; i++) {
        var f = topFiles[i];
        var full = path.join(BACKEND_DATA, f);
        var content;
        try { content = fs.readFileSync(full, 'utf8'); } catch (e) { fail++; log('err', f + ' 读取失败: ' + e.message); continue; }
        try {
            var r = await httpsPostJson(PAGES_URL + '/api/upload', { filename: f, content: content });
            if (r.data && r.data.code === 0) {
                ok++;
                var kb = humanSize(Buffer.byteLength(content, 'utf8'));
                log('ok', f + ' (' + kb + ') 写入成功');
            } else {
                fail++;
                var msg = (r.data && (r.data.msg || JSON.stringify(r.data))) || ('HTTP ' + r.status + ' ' + (r.raw || '').slice(0, 100));
                log('err', f + ' 写入失败: ' + msg);
            }
        } catch (e) { fail++; log('err', f + ' 写入异常: ' + (e && e.message ? e.message : String(e))); }
    }

    // 2) pages/ 子目录 .json 文件 (filename = 'pages/<文件名>', upload 的 safeName 会把 / 转为 _,
    //    得到 KV key 'pages_<文件名>.json', 与 /api/page-data/:key 的 KV key 格式一致)
    var pagesDir = path.join(BACKEND_DATA, 'pages');
    var pageFiles = listDir(pagesDir, '.json').filter(function (f) { return f.charAt(0) !== '.'; });
    log('info', 'pages/ 子目录 JSON 文件: ' + pageFiles.length + ' 个');
    for (var j = 0; j < pageFiles.length; j++) {
        var pf = pageFiles[j];
        var pfull = path.join(pagesDir, pf);
        var pcontent;
        try { pcontent = fs.readFileSync(pfull, 'utf8'); } catch (e) { fail++; log('err', 'pages/' + pf + ' 读取失败: ' + e.message); continue; }
        var pname = 'pages/' + pf;
        try {
            var pr = await httpsPostJson(PAGES_URL + '/api/upload', { filename: pname, content: pcontent });
            if (pr.data && pr.data.code === 0) {
                ok++;
                var pkb = humanSize(Buffer.byteLength(pcontent, 'utf8'));
                log('ok', pname + ' (' + pkb + ') 写入成功');
            } else {
                fail++;
                var pmsg = (pr.data && (pr.data.msg || JSON.stringify(pr.data))) || ('HTTP ' + pr.status + ' ' + (pr.raw || '').slice(0, 100));
                log('err', pname + ' 写入失败: ' + pmsg);
            }
        } catch (e) { fail++; log('err', pname + ' 写入异常: ' + (e && e.message ? e.message : String(e))); }
    }

    log('info', '汇总(顶层 + pages/) 成功=' + ok + ' / 失败=' + fail);
    return { ok: ok, fail: fail };
}

// ===== pull-data (通过 Pages /api/data-files/:name)
async function pullData() {
    log('head', '─── pull-data: 云端 KV → backend/data/ ───');
    ensureDir(BACKEND_DATA);
    var listResp = await httpsGetJson(PAGES_URL + '/api/data-files');
    if (!listResp || !Array.isArray(listResp.data)) {
        throw new Error('KV LIST 返回格式错误: ' + JSON.stringify(listResp).slice(0, 200));
    }
    var ok = 0, fail = 0;
    for (var i = 0; i < listResp.data.length; i++) {
        var k = listResp.data[i].name;
        try {
            var one = await httpsGetJson(PAGES_URL + '/api/data-files/' + encodeURIComponent(k));
            if (!one || one.code !== 0 || !one.data || typeof one.data.content !== 'string') {
                throw new Error('响应异常: ' + JSON.stringify(one).slice(0, 150));
            }
            var safe = safeName(one.data.name || k);
            var dst = path.join(BACKEND_DATA, safe);
            fs.writeFileSync(dst, one.data.content);
            var sz = Buffer.byteLength(one.data.content, 'utf8');
            ok++;
            log('ok', k + ' (' + humanSize(sz) + ') → backend/data/' + safe);
        } catch (e) { fail++; log('err', k + ' 拉取失败: ' + (e.message || String(e))); }
    }
    log('info', '汇总 成功=' + ok + ' / 失败=' + fail);
    return { ok: ok, fail: fail };
}

// ===== deploy
function deployPages() {
    log('head', '─── deploy: dist → Cloudflare Pages ───');
    var cmd = 'npx -y wrangler@latest pages deploy "' + DIST + '" --project-name ' + PROJECT + ' --branch ' + BRANCH;
    log('cmd', cmd);
    try {
        var out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', maxBuffer: 30 * 1024 * 1024, stdio: 'pipe' });
        log('ok', '部署成功');
        process.stdout.write(out);
        return true;
    } catch (e) {
        log('err', '部署失败');
        if (e.stdout) process.stdout.write(String(e.stdout));
        else console.error(e.message || e);
        return false;
    }
}

// ===== status
async function statusReport() {
    var sep = '────────────────────────────────────────────────';
    console.log('\n' + sep);
    console.log('            📊 本地 ↔ 云端 同步状态报告');
    console.log(sep);
    // ① 静态
    console.log('\n① 本地源 vs dist 静态资源对比');
    console.log(sep);
    var flag;
    ['index.html', 'index-home.html', 'index-static.html', 'data-manager.html'].forEach(function (f) {
        var s = fs.existsSync(path.join(ROOT, f)) ? fs.statSync(path.join(ROOT, f)).size : -1;
        var d = fs.existsSync(path.join(DIST, f)) ? fs.statSync(path.join(DIST, f)).size : -1;
        if (s < 0) flag = '❌ 源缺';
        else if (d < 0) flag = '❌ dist缺';
        else if (s === d) flag = '✅ 一致';
        else flag = '⚠️ 差异';
        console.log('  ' + flag + '  ' + f.padEnd(20) + '  src=' + s + '  dist=' + d);
    });
    var pSrc = countFilesRecursive(PROTOTYPE);
    var pDst = countFilesRecursive(path.join(DIST, 'prototype'));
    console.log('  ' + (pSrc === pDst && pSrc > 0 ? '✅ 一致' : '⚠️ 差异') + '  prototype/ 总文件数 src=' + pSrc + '  dist=' + pDst);

    // ② 本地 JSON
    console.log('\n② backend/data/ 本地 JSON 统计');
    console.log(sep);
    var local = listDir(BACKEND_DATA, '.json');
    var localTotalSize = 0;
    local.forEach(function (f) {
        var sz = fs.statSync(path.join(BACKEND_DATA, f)).size;
        localTotalSize += sz;
        console.log('    ' + humanSize(sz).padStart(10) + '  ' + f);
    });
    console.log('  顶层合计 ' + local.length + ' 个 JSON 文件, 总大小 ' + humanSize(localTotalSize));

    // pages/ 子目录
    var pagesDir = path.join(BACKEND_DATA, 'pages');
    var pageFiles = listDir(pagesDir, '.json');
    if (pageFiles.length > 0) {
        var pagesTotalSize = 0;
        pageFiles.forEach(function (f) {
            var sz = fs.statSync(path.join(pagesDir, f)).size;
            pagesTotalSize += sz;
            console.log('    ' + humanSize(sz).padStart(10) + '  pages/' + f);
        });
        console.log('  pages/ 合计 ' + pageFiles.length + ' 个 JSON 文件, 总大小 ' + humanSize(pagesTotalSize));
        console.log('  总计 ' + (local.length + pageFiles.length) + ' 个 JSON 文件');
    } else {
        console.log('  pages/ (空或不存在)');
    }

    // ③ 云端
    console.log('\n③ 线上 Pages: ' + PAGES_URL);
    console.log(sep);
    try {
        var h = await httpsGetJson(PAGES_URL + '/api/health');
        console.log('  健康: ' + JSON.stringify(h));
    } catch (e) { console.log('  健康: ❌ ' + e.message); }
    try {
        var df = await httpsGetJson(PAGES_URL + '/api/data-files');
        if (df && Array.isArray(df.data)) {
            console.log('  KV 文件数: ' + df.data.length);
            df.data.forEach(function (f) {
                console.log('    ' + (f.name || '').padEnd(30) + ' ' + humanSize(f.size || 0));
            });
        }
    } catch (e) { console.log('  KV列表: ❌ ' + e.message); }

    console.log('\n' + sep);
    console.log('  使用命令:');
    console.log('    node scripts/sync.js status        # 只读报告');
    console.log('    node scripts/sync.js all           # 构建 → 数据推送 → Pages 部署');
    console.log('    node scripts/sync.js pull-data     # 云端数据拉回本地');
    console.log('    node scripts/sync.js build-static  # 仅把源文件同步到 dist');
    console.log(sep + '\n');
}

async function main() {
    var cmd = process.argv[2] || 'all';
    switch (cmd) {
        case 'build-static': buildStatic(); break;
        case 'push-data': await pushData(); break;
        case 'pull-data': await pullData(); break;
        case 'deploy': deployPages(); break;
        case 'status': await statusReport(); break;
        case 'all':
            buildStatic();
            try { await pushData(); } catch (e) { log('warn', 'push-data 失败: ' + (e.message || String(e))); }
            deployPages();
            log('ok', '全链路同步完成 → ' + PAGES_URL);
            break;
        default:
            var lines = fs.readFileSync(__filename, 'utf8').split(/\n/);
            for (var i = 1; i < 18; i++) console.log(lines[i]);
            process.exit(1);
    }
}
main().catch(function (e) {
    console.error('\n❌ 同步失败: ' + (e.stack || e.message || e));
    process.exit(1);
});
