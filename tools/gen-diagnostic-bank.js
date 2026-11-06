// 从 backend/data/diagnostic-bank.json 生成 Functions 侧题库模块
// 用法：node tools/gen-diagnostic-bank.js
// 数据源唯一：backend/data/diagnostic-bank.json，请勿手改生成结果。
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const bank = require(path.join(root, 'backend/data/diagnostic-bank.json'));
const out = path.join(root, 'functions/api/_diagnostic-bank.js');

const content =
    '// 自动生成，请勿手改。数据源：backend/data/diagnostic-bank.json\n' +
    'export default ' + JSON.stringify(bank.questions, null, 2) + ';\n';

fs.writeFileSync(out, content);
console.log('generated ' + bank.questions.length + ' questions -> ' + out);
