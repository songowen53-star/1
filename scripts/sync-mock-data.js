#!/usr/bin/env node
/**
 * 把 /workspace/backend/data/pages/*.json 的权威数据同步到前端
 * Mock 数据 window.PAGE_SAMPLE_DATA（位于 design-system.js）。
 *
 * 规则：
 *   - key = JSON 文件名去掉 .json 后缀
 *   - value = 解析后的 JSON 对象
 *   - 生成格式：window.PAGE_SAMPLE_DATA = { 'key1': {...}, ... };
 *   - 用 JSON.stringify(value, null, 4) 格式化（4 空格缩进）
 *   - 替换 design-system.js 中 `window.PAGE_SAMPLE_DATA = (function () { ... })();` 整段
 *   - 保留其后的 TODAY_TASKS_MOCK / DURATION_STATS_MOCK / installMockDataFallback 等
 *   - 幂等可重复执行
 */
'use strict';

var fs = require('fs');
var path = require('path');

var ROOT = path.resolve(__dirname, '..');
var PAGES_DIR = path.join(ROOT, 'backend', 'data', 'pages');
var DESIGN_SYSTEM = path.join(ROOT, 'prototype', 'js', 'design-system.js');

// 1. 收集所有 .json 文件
var files = fs.readdirSync(PAGES_DIR)
    .filter(function (f) { return f.endsWith('.json'); })
    .sort(); // 按文件名排序，保证输出稳定

if (files.length === 0) {
    console.error('❌ 在 ' + PAGES_DIR + ' 没有找到任何 .json 文件');
    process.exit(1);
}

// 2. 构建 data 对象
var data = {};
files.forEach(function (f) {
    var key = f.replace(/\.json$/, '');
    var raw = fs.readFileSync(path.join(PAGES_DIR, f), 'utf8');
    var value;
    try {
        value = JSON.parse(raw);
    } catch (e) {
        console.error('❌ 解析 ' + f + ' 失败：' + e.message);
        process.exit(1);
    }
    data[key] = value;
});

// 3. 生成新的 PAGE_SAMPLE_DATA 代码
//    key 用单引号包裹；value 用 JSON.stringify(value, null, 4)
//    整体格式：window.PAGE_SAMPLE_DATA = {\n    'key': {...}\n};
var lines = [];
Object.keys(data).forEach(function (k) {
    var valueStr = JSON.stringify(data[k], null, 4);
    // 把 valueStr 的每一行缩进 4 空格，与 'key': 对齐
    var indentedValue = valueStr.replace(/\n/g, '\n    ');
    lines.push("    '" + k + "': " + indentedValue);
});
var newBlock = 'window.PAGE_SAMPLE_DATA = {\n' + lines.join(',\n') + '\n};';

// 4. 读取 design-system.js
var oldContent = fs.readFileSync(DESIGN_SYSTEM, 'utf8');
var oldSize = Buffer.byteLength(oldContent, 'utf8');

// 5. 用正则匹配整段 PAGE_SAMPLE_DATA 代码块
//    优先匹配原始 IIFE 格式：`window.PAGE_SAMPLE_DATA = (function () { ... })();`
//    若未匹配（说明已被本脚本同步过），则回退匹配新对象字面量格式：
//    `window.PAGE_SAMPLE_DATA = { ... };`（}; 在行首），保证幂等可重复执行。
var iifePattern = /window\.PAGE_SAMPLE_DATA = \(function \(\) \{[\s\S]*?\}\)\(\);/;
var objectPattern = /window\.PAGE_SAMPLE_DATA = \{[\s\S]*?\n\};/;
var matched = null;
if (iifePattern.test(oldContent)) {
    matched = iifePattern;
} else if (objectPattern.test(oldContent)) {
    matched = objectPattern;
} else {
    console.error('❌ 没有在 design-system.js 中找到 PAGE_SAMPLE_DATA 的代码块');
    process.exit(1);
}

var newContent = oldContent.replace(matched, newBlock);
var newSize = Buffer.byteLength(newContent, 'utf8');

// 6. 写回
fs.writeFileSync(DESIGN_SYSTEM, newContent, 'utf8');

// 7. 统计输出
console.log('✅ 同步完成');
console.log('   处理 JSON 文件数：' + files.length);
console.log('   PAGE_SAMPLE_DATA keys：' + Object.keys(data).length);
console.log('   design-system.js 旧大小：' + oldSize + ' bytes');
console.log('   design-system.js 新大小：' + newSize + ' bytes');
console.log('   差值：' + (newSize - oldSize) + ' bytes');
