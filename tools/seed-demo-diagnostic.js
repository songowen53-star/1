// 为 AI 学情诊断模块生成「登录后真实数据」：注册演示账号并完整跑一遍诊断流程
// 用法：node tools/seed-demo-diagnostic.js [baseUrl]
// 默认本地 http://localhost:8080；云端传 https://ai-gaokao-static.pages.dev
const fs = require('fs');
const path = require('path');

const BASE = (process.argv[2] || process.env.BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const USERNAME = process.env.DEMO_USER || 'demodiag2026';
const PASSWORD = process.env.DEMO_PASS || 'Demo1234';
const SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物'];

const bank = JSON.parse(fs.readFileSync(path.join(__dirname, '../backend/data/diagnostic-bank.json'), 'utf8')).questions;

function hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000;
    return h / 1000;
}
// 让不同学科呈现不同掌握度，形成真实的薄弱点分布
const WRONG_RATE = { 语文: 0.15, 数学: 0.45, 英语: 0.2, 物理: 0.4, 化学: 0.3, 生物: 0.25 };

async function call(method, url, body, token) {
    const res = await fetch(BASE + url, {
        method,
        headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
        body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { throw new Error(url + ' 非 JSON: ' + text.slice(0, 120)); }
    if (data.code !== 0) throw new Error(url + ' 失败: ' + data.msg);
    return data.data;
}

(async () => {
    console.log('目标环境:', BASE);

    let auth = null;
    try {
        auth = await call('POST', '/api/auth/register', {
            username: USERNAME, password: PASSWORD,
            name: '李思远', grade: '高三', province: '江苏',
            target_score: 650, target_school: '南京大学', exam_year: 2027
        });
        console.log('已注册演示账号');
    } catch (e) {
        console.log('账号已存在，直接登录');
        auth = await call('POST', '/api/auth/login', { username: USERNAME, password: PASSWORD });
    }
    const token = auth.token;
    console.log('登录成功:', auth.user_id);

    await call('PUT', '/api/student/goal', {
        subjects: SUBJECTS, target_score: 650, target_school: '南京大学',
        exam_year: 2027, daily_minutes: 120
    }, token);
    console.log('选科已设置:', SUBJECTS.join('/'));

    const started = await call('POST', '/api/diagnostic/start', null, token);
    console.log('诊断会话:', started.session_id, '题目数:', started.total_questions);

    let wrongCount = 0;
    for (let i = 0; i < bank.length; i++) {
        const q = bank[i];
        const wantWrong = ((i * 37 + 13) % 100) / 100 < (WRONG_RATE[q.subject] || 0.25);
        const answerIndex = wantWrong
            ? (q.answer_index + 1) % q.options.length
            : q.answer_index;
        const r = await call('POST', `/api/diagnostic/${started.session_id}/answer`, {
            question_id: q.id, answer_index: answerIndex, duration_sec: 25 + (q.difficulty || 3) * 5
        }, token);
        if (!r.is_correct) wrongCount++;
    }
    console.log('作答完成，错题数:', wrongCount, '/', bank.length);

    const submitted = await call('POST', `/api/diagnostic/${started.session_id}/submit`, null, token);
    const s = submitted.report.summary;
    console.log('\n===== 诊断报告 =====');
    console.log('预估总分:', s.estimated_score, '| 正确率:', s.accuracy_pct + '%', '| 目标:', s.target_score);
    console.log('各科掌握:');
    submitted.report.ability_profile.forEach(a => {
        console.log('  ' + a.subject + ': 掌握 ' + Math.round(a.mastery * 100) + '% · 估分 ' + a.estimated_score + ' · ' + a.level);
    });
    console.log('薄弱知识点:');
    submitted.report.weak_points.forEach(w => console.log('  ' + w.subject + '·' + w.knowledge_point + ' 掌握 ' + Math.round(w.mastery * 100) + '%'));
    console.log('\n演示账号: ' + USERNAME + ' / ' + PASSWORD + '（' + BASE + '）');
})().catch(e => { console.error('执行失败:', e.message); process.exit(1); });
