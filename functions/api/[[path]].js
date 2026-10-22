// ============================================================
// Pages Functions - 学生智能档案 API（KV 存储）
// 与 backend/student-api.js 保持同一数据契约（snake_case）
// 未覆盖的 /api/* 请求转发到原 Worker，保证旧模块数据不断链
// ============================================================

const TZ = 'Asia/Shanghai';
const WORKER_BASE = 'https://ai-gaokao-api.songowen53.workers.dev';

const SUBJECT_META = {
    '语文': { color: 'red', icon: 'fa-book', full_score: 150 },
    '数学': { color: 'blue', icon: 'fa-square-root-variable', full_score: 150 },
    '英语': { color: 'green', icon: 'fa-language', full_score: 150 },
    '物理': { color: 'purple', icon: 'fa-atom', full_score: 100 },
    '化学': { color: 'orange', icon: 'fa-flask', full_score: 100 },
    '生物': { color: 'cyan', icon: 'fa-dna', full_score: 100 },
    '政治': { color: 'red', icon: 'fa-landmark', full_score: 100 },
    '历史': { color: 'amber', icon: 'fa-ribbon', full_score: 100 },
    '地理': { color: 'teal', icon: 'fa-globe-asia', full_score: 100 }
};

const DIAGNOSTIC_BANK = [
    {
        id: 'dg_math_01', subject: '数学', knowledge_point_id: 'kp_math_conic', knowledge_point: '圆锥曲线综合',
        difficulty: 4, stem: '已知椭圆 x²/4 + y²/3 = 1，过点 P(1,1) 的直线与椭圆交于 A、B 两点，则弦长 |AB| 的取值范围是？',
        options: ['A. [2, 2√3]', 'B. [√3, 2√3]', 'C. [2, 4]', 'D. [√2, 2√2]'], answer_index: 1,
        analysis: '设直线斜率 k，联立椭圆方程用韦达定理求 |AB|，再求最值域。'
    },
    {
        id: 'dg_math_02', subject: '数学', knowledge_point_id: 'kp_math_derivative', knowledge_point: '导数应用专题',
        difficulty: 5, stem: '设 f(x)=x³-3x+1，下列关于其极值与零点个数的说法正确的是？',
        options: ['A. 极大值 3，极小值 -1，3 个零点', 'B. 极大值 -1，极小值 3，3 个零点', 'C. 极大值 3，极小值 -1，1 个零点', 'D. 无极值，1 个零点'], answer_index: 0,
        analysis: "f'(x)=3x²-3，驻点 x=±1；f(-1)=3 为极大值，f(1)=-1 为极小值，结合零点定理有 3 个零点。"
    },
    {
        id: 'dg_math_03', subject: '数学', knowledge_point_id: 'kp_math_sequence', knowledge_point: '数列求和方法',
        difficulty: 3, stem: '数列 {aₙ} 满足 aₙ = 1/[n(n+1)]，则其前 n 项和 Sₙ = ?',
        options: ['A. n/(n+1)', 'B. (n+1)/(n+2)', 'C. 1-1/n', 'D. n/(2n+1)'], answer_index: 0,
        analysis: '裂项相消：1/[n(n+1)] = 1/n - 1/(n+1)，求和得 1 - 1/(n+1) = n/(n+1)。'
    },
    {
        id: 'dg_math_04', subject: '数学', knowledge_point_id: 'kp_math_probability', knowledge_point: '概率统计',
        difficulty: 3, stem: '从 5 男 3 女中任选 3 人，至少有 1 名女生的概率是？',
        options: ['A. 5/14', 'B. 9/14', 'C. 15/28', 'D. 23/28'], answer_index: 3,
        analysis: '对立事件为全男：C(5,3)/C(8,3)=10/56，故所求 1-10/56=23/28。'
    },
    {
        id: 'dg_phy_01', subject: '物理', knowledge_point_id: 'kp_phy_induction', knowledge_point: '电磁感应综合题',
        difficulty: 4, stem: '导体棒在匀强磁场 B 中以速度 v 垂直切割磁感线，回路总电阻为 R，则感应电流大小为？',
        options: ['A. BLv/R', 'B. Bv/R', 'C. BL/R', 'D. BLvR'], answer_index: 0,
        analysis: 'ε=BLv，闭合电路欧姆定律 I=ε/R=BLv/R。'
    },
    {
        id: 'dg_phy_02', subject: '物理', knowledge_point_id: 'kp_phy_mechanics', knowledge_point: '力学综合分析',
        difficulty: 4, stem: '物体自高 h 处自由下落，落地速度为 v，质量为 m，则下落过程中合外力做功为？',
        options: ['A. mgh', 'B. ½mv²', 'C. mgh - ½mv²', 'D. 0'], answer_index: 1,
        analysis: '动能定理：合外力做功等于动能变化量 ½mv²。'
    },
    {
        id: 'dg_phy_03', subject: '物理', knowledge_point_id: 'kp_phy_momentum', knowledge_point: '动量与冲量',
        difficulty: 3, stem: '质量 2kg 的物体速度从 3m/s 增大到 5m/s，动量变化量大小为？',
        options: ['A. 4 kg·m/s', 'B. 6 kg·m/s', 'C. 8 kg·m/s', 'D. 10 kg·m/s'], answer_index: 0,
        analysis: 'Δp = m(v₂-v₁) = 2×(5-3) = 4 kg·m/s。'
    },
    {
        id: 'dg_chem_01', subject: '化学', knowledge_point_id: 'kp_chem_equilibrium', knowledge_point: '化学平衡计算',
        difficulty: 4, stem: '对于反应 aA+bB⇌cC+dD，化学平衡常数 K 的表达式为？',
        options: ['A. [c(C)·c(D)]/[c(A)·c(B)]', 'B. c(C)^c·c(D)^d /[c(A)^a·c(B)^b]', 'C. c(A)^a·c(B)^b /[c(C)^c·c(D)^d]', 'D. (a+b)/(c+d)'], answer_index: 1,
        analysis: 'K 为生成物浓度幂之积除以反应物浓度幂之积，固体与纯液体不计入。'
    },
    {
        id: 'dg_chem_02', subject: '化学', knowledge_point_id: 'kp_chem_organic', knowledge_point: '有机推断题型',
        difficulty: 5, stem: '某链状化合物 A 分子式 C₄H₈O₂，能与 NaHCO₃ 反应放出 CO₂，则 A 的结构简式为？',
        options: ['A. CH₃CH₂CH₂COOH', 'B. CH₃COOCH₂CH₃', 'C. HOCH₂CH₂CH₂CHO', 'D. CH₃CH₂OCH₂CH₃'], answer_index: 0,
        analysis: '与 NaHCO₃ 反应说明含羧基，C₄H₈O₂ 不饱和度为 1，故为丁酸。'
    },
    {
        id: 'dg_chem_03', subject: '化学', knowledge_point_id: 'kp_chem_electro', knowledge_point: '电化学原理',
        difficulty: 3, stem: '关于原电池，下列说法正确的是？',
        options: ['A. 正极发生氧化反应', 'B. 负极发生还原反应', 'C. 电子由负极经外电路流向正极', 'D. 阳离子向负极迁移'], answer_index: 2,
        analysis: '负极失电子被氧化，电子经外电路流向正极；阳离子向正极迁移。'
    },
    {
        id: 'dg_eng_01', subject: '英语', knowledge_point_id: 'kp_eng_cloze', knowledge_point: '完形填空技巧',
        difficulty: 3, stem: "The students were ___ by the teacher's inspiring speech.",
        options: ['A. bored', 'B. moved', 'C. confused', 'D. scared'], answer_index: 1,
        analysis: 'inspiring speech 暗示积极情绪，moved（感动）最符合语境。'
    },
    {
        id: 'dg_eng_02', subject: '英语', knowledge_point_id: 'kp_eng_grammar', knowledge_point: '语法填空',
        difficulty: 4, stem: 'Not only ___ he finished the task, but he also helped others.',
        options: ['A. did', 'B. has', 'C. had', 'D. does'], answer_index: 0,
        analysis: 'Not only 置于句首时主句部分倒装，一般过去时用助动词 did。'
    }
];

const KP_META = {};
DIAGNOSTIC_BANK.forEach(q => {
    KP_META[q.knowledge_point_id] = { id: q.knowledge_point_id, subject: q.subject, name: q.knowledge_point, difficulty: q.difficulty };
});

// ---------- 基础工具 ----------
const ok = (data) => ({ code: 0, data });
const err = (msg, code = 1) => ({ code, msg });
const round2 = (v) => Math.round(v * 100) / 100;
const nowIso = () => new Date().toISOString();

function uid(prefix) {
    const h = Array.from(crypto.getRandomValues(new Uint8Array(6))).map(b => b.toString(16).padStart(2, '0')).join('');
    return (prefix || 'id') + '_' + h;
}

function tzParts(d) {
    const date = d || new Date();
    const parts = {};
    new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).formatToParts(date).forEach(p => { parts[p.type] = p.value; });
    return parts;
}
function todayKey(d) {
    const p = tzParts(d);
    return p.year + '-' + p.month + '-' + p.day;
}
function todayLabelCN(d) {
    const date = d || new Date();
    const p = tzParts(date);
    const weekday = new Intl.DateTimeFormat('zh-CN', { timeZone: TZ, weekday: 'short' }).format(date).replace('星期', '周');
    return Number(p.month) + '月' + Number(p.day) + '日 ' + weekday;
}
function startOfWeekKey(d) {
    const date = d ? new Date(d) : new Date();
    const p = tzParts(date);
    const local = new Date(Number(p.year), Number(p.month) - 1, Number(p.day));
    const dow = (local.getDay() + 6) % 7;
    local.setDate(local.getDate() - dow);
    return todayKey(local);
}
function weekDayKeys(d) {
    const parts = startOfWeekKey(d).split('-').map(Number);
    const keys = [];
    for (let i = 0; i < 7; i++) {
        keys.push(todayKey(new Date(parts[0], parts[1] - 1, parts[2] + i)));
    }
    return keys;
}

// ---------- KV 存取 ----------
const K = {
    profile: (uid) => 's:profile:' + uid,
    goal: (uid) => 's:goal:' + uid,
    session: (sid) => 's:session:' + sid,
    sessionIds: (uid) => 's:sessions:' + uid,
    answers: (sid) => 's:answers:' + sid,
    knowledge: (uid) => 's:ks:' + uid,
    ability: (uid) => 's:ab:' + uid,
    report: (uid) => 's:report:' + uid,
    plan: (uid) => 's:plan:' + uid,
    tasks: (uid) => 's:tasks:' + uid,
    events: (uid) => 's:events:' + uid,
    userById: (uid) => 's:userid:' + uid
};

async function getJson(env, key, def) {
    const raw = await env.DATA_STORE.get(key);
    if (!raw) return def;
    try { return JSON.parse(raw); } catch (e) { return def; }
}
async function putJson(env, key, val) {
    await env.DATA_STORE.put(key, JSON.stringify(val));
}

async function addBehaviorEvent(env, userId, type, payload) {
    const list = await getJson(env, K.events(userId), []);
    const ev = { id: uid('ev'), user_id: userId, type, payload: payload || {}, occurred_at: nowIso(), date_key: todayKey() };
    list.push(ev);
    if (list.length > 300) list.splice(0, list.length - 300);
    await putJson(env, K.events(userId), list);
    return ev;
}

// ---------- 登录态 ----------
async function hashPassword(password, salt) {
    const data = new TextEncoder().encode(String(salt) + ':' + String(password || ''));
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function verifyPassword(password, user) {
    if (!user) return false;
    if (!user.password_hash) return String(password || '') === String(user.password || '');
    return (await hashPassword(password, user.password_salt)) === user.password_hash;
}
async function currentUser(request, env) {
    const auth = request.headers.get('authorization') || '';
    const m = auth.match(/^Bearer\s+(.+)$/);
    if (!m) return null;
    const exp = await env.DATA_STORE.get('token:exp:' + m[1]);
    if (exp && new Date(exp).getTime() < Date.now()) return null;
    const raw = await env.DATA_STORE.get('token:user:' + m[1]);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
}
async function issueToken(env, user) {
    const token = 'tk_' + uid('').slice(1) + uid('').slice(1);
    await env.DATA_STORE.put('token:' + token, user.id);
    await env.DATA_STORE.put('token:user:' + token, JSON.stringify(user));
    await env.DATA_STORE.put('token:exp:' + token, new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString());
    return token;
}
function publicUser(u) {
    if (!u) return null;
    return { id: u.id, username: u.username, name: u.name, grade: u.grade, province: u.province, role: u.role, created_at: u.created_at };
}
async function createUser(env, input) {
    const username = String(input.username || '').trim();
    const salt = uid('').slice(1);
    const user = {
        id: 'u_' + uid('').slice(1),
        username,
        password_salt: salt,
        password_hash: await hashPassword(input.password, salt),
        name: input.name || username,
        grade: input.grade || '高三',
        province: input.province || '',
        phone: input.phone || '',
        role: 'student',
        created_at: nowIso()
    };
    await env.DATA_STORE.put('user:' + username, JSON.stringify(user));
    await putJson(env, K.userById(user.id), user);
    return user;
}
async function findUserByName(env, username) {
    const raw = await env.DATA_STORE.get('user:' + String(username || '').trim());
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
}

// ---------- 档案与目标 ----------
async function getProfile(env, userId) { return getJson(env, K.profile(userId), null); }
async function saveProfile(env, userId, patch) {
    const cur = (await getProfile(env, userId)) || { user_id: userId, created_at: nowIso() };
    const next = Object.assign({}, cur, patch, { user_id: userId, updated_at: nowIso() });
    await putJson(env, K.profile(userId), next);
    return next;
}
async function getGoal(env, userId) { return getJson(env, K.goal(userId), null); }
async function saveGoal(env, userId, patch) {
    const cur = (await getGoal(env, userId)) || { user_id: userId, created_at: nowIso(), status: 'active' };
    const next = Object.assign({}, cur, patch, { user_id: userId, updated_at: nowIso() });
    await putJson(env, K.goal(userId), next);
    return next;
}

// ---------- 计算逻辑 ----------
function computeStates(records) {
    const kpAgg = {};
    records.forEach(r => {
        const id = r.knowledge_point_id || 'unknown';
        if (!kpAgg[id]) kpAgg[id] = { total: 0, correct: 0, difficulty: r.difficulty || 3, subject: r.subject };
        kpAgg[id].total++;
        if (r.is_correct) kpAgg[id].correct++;
    });

    const knowledgeStates = Object.keys(kpAgg).map(id => {
        const meta = KP_META[id] || { id, subject: kpAgg[id].subject, name: id, difficulty: kpAgg[id].difficulty };
        const agg = kpAgg[id];
        const accuracy = agg.correct / agg.total;
        const diffWeight = 1 - Math.min(0.2, (meta.difficulty - 3) * 0.05);
        return {
            knowledge_point_id: id,
            knowledge_point: meta.name,
            subject: meta.subject,
            mastery: round2(Math.max(0, Math.min(1, accuracy * diffWeight))),
            accuracy: round2(accuracy),
            attempts: agg.total,
            correct: agg.correct,
            updated_at: nowIso()
        };
    }).sort((a, b) => a.mastery - b.mastery);

    const abilityStates = Object.keys(SUBJECT_META).map(subject => {
        const ks = knowledgeStates.filter(k => k.subject === subject);
        if (!ks.length) return null;
        const total = ks.reduce((s, k) => s + k.attempts, 0);
        const correct = ks.reduce((s, k) => s + k.correct, 0);
        const accuracy = total ? correct / total : 0;
        const mastery = ks.reduce((s, k) => s + k.mastery, 0) / ks.length;
        const meta = SUBJECT_META[subject];
        let level = '基础';
        if (mastery >= 0.8) level = '优势';
        else if (mastery >= 0.6) level = '进阶';
        return {
            subject,
            color: meta.color,
            icon: meta.icon,
            full_score: meta.full_score,
            attempts: total,
            correct,
            accuracy: round2(accuracy),
            mastery: round2(mastery),
            estimated_score: Math.round(meta.full_score * (0.4 + 0.55 * mastery)),
            level,
            updated_at: nowIso()
        };
    }).filter(Boolean);

    const totalQ = records.length;
    const totalCorrect = records.filter(r => r.is_correct).length;
    const accuracy = totalQ ? totalCorrect / totalQ : 0;
    const estimatedScore = abilityStates.reduce((s, a) => s + a.estimated_score, 0);

    return { knowledgeStates, abilityStates, totalQ, totalCorrect, accuracy, estimatedScore };
}

async function buildReport(env, userId, session, records) {
    const { knowledgeStates, abilityStates, totalQ, totalCorrect, accuracy, estimatedScore } = computeStates(records);
    const goal = (await getGoal(env, userId)) || {};
    const targetScore = Number(goal.target_score) || 600;

    const weak = knowledgeStates.filter(k => k.mastery < 0.6).slice(0, 5);
    const strong = knowledgeStates.filter(k => k.mastery >= 0.75);

    const paragraphs = [];
    paragraphs.push('本次AI学情诊断共作答 ' + totalQ + ' 题，答对 ' + totalCorrect + ' 题，整体正确率 ' + Math.round(accuracy * 100) + '%。');
    if (abilityStates.length) {
        const best = abilityStates.slice().sort((a, b) => b.mastery - a.mastery)[0];
        const worst = abilityStates.slice().sort((a, b) => a.mastery - b.mastery)[0];
        paragraphs.push('学科能力上，' + best.subject + '表现最好（掌握度 ' + Math.round(best.mastery * 100) + '%），' + worst.subject + '相对薄弱（掌握度 ' + Math.round(worst.mastery * 100) + '%）。');
    }
    if (weak.length) {
        paragraphs.push('当前薄弱知识点集中在：' + weak.map(w => w.subject + '·' + w.knowledge_point).join('、') + '，建议优先安排专项训练。');
    }
    paragraphs.push('基于诊断数据估算当前水平约 ' + estimatedScore + ' 分，距离目标 ' + targetScore + ' 分还有 ' + Math.max(0, targetScore - estimatedScore) + ' 分的提升空间。');

    const report = {
        report_id: uid('rep'),
        user_id: userId,
        session_id: session.session_id,
        created_at: nowIso(),
        generated_from: 'diagnostic',
        summary: {
            total_questions: totalQ,
            correct_count: totalCorrect,
            accuracy: round2(accuracy),
            accuracy_pct: Math.round(accuracy * 100),
            current_level: estimatedScore,
            estimated_score: estimatedScore,
            target_score: targetScore,
            score_gap: Math.max(0, targetScore - estimatedScore),
            mastery_avg: abilityStates.length ? round2(abilityStates.reduce((s, a) => s + a.mastery, 0) / abilityStates.length) : 0
        },
        weak_points: weak.map(w => ({
            subject: w.subject, knowledge_point: w.knowledge_point,
            mastery: w.mastery, accuracy: w.accuracy,
            suggestion: '先看知识点讲解，再完成 8-10 道专项题，完成后立即复盘错题。'
        })),
        strengths: strong.map(w => ({ subject: w.subject, knowledge_point: w.knowledge_point, mastery: w.mastery })),
        ability_profile: abilityStates.map(a => ({
            subject: a.subject, level: a.level, mastery: a.mastery,
            accuracy: a.accuracy, estimated_score: a.estimated_score, full_score: a.full_score
        })),
        paragraphs
    };

    await putJson(env, K.report(userId), report);
    await putJson(env, K.knowledge(userId), knowledgeStates);
    await putJson(env, K.ability(userId), abilityStates);
    return report;
}

async function buildPlan(env, userId, report) {
    const weak = (report.weak_points || []).slice(0, 4);
    const list = weak.length ? weak : (report.ability_profile || []).slice(0, 3).map(a => ({
        subject: a.subject, knowledge_point: '基础巩固', mastery: a.mastery
    }));

    const planId = uid('plan');
    const dateKey = todayKey();
    const tasks = list.map((w, i) => {
        const meta = SUBJECT_META[w.subject] || SUBJECT_META['数学'];
        const planned = 30 + (i % 2) * 10;
        return {
            id: uid('task'),
            user_id: userId,
            plan_id: planId,
            subject: w.subject,
            color: meta.color,
            icon: meta.icon,
            point: w.knowledge_point,
            knowledge_point_id: 'kp_' + (i + 1),
            knowledge_point_name: w.knowledge_point,
            difficulty: (w.mastery || 0) < 0.35 ? '困难' : (w.mastery || 0) < 0.6 ? '中等' : '简单',
            time: planned + 'min',
            planned_minutes: planned,
            questions_count: 8 + (i % 2) * 2,
            status: 'todo',
            planned_date: dateKey,
            created_at: nowIso(),
            started_at: null,
            completed_at: null,
            duration_min: null,
            correct_rate: null
        };
    });

    const plan = {
        plan_id: planId,
        user_id: userId,
        report_id: report.report_id,
        created_at: nowIso(),
        plan_date: dateKey,
        total_minutes: tasks.reduce((s, t) => s + t.planned_minutes, 0),
        task_count: tasks.length,
        status: 'active',
        tasks
    };

    const existing = await getJson(env, K.tasks(userId), []);
    const kept = existing.filter(t => t.planned_date !== dateKey);
    await putJson(env, K.plan(userId), plan);
    await putJson(env, K.tasks(userId), kept.concat(tasks));
    return plan;
}

async function getTodayTasks(env, userId) {
    const dateKey = todayKey();
    const all = await getJson(env, K.tasks(userId), []);
    let tasks = all.filter(t => t.planned_date === dateKey);
    if (!tasks.length) tasks = all.filter(t => t.status !== 'done').slice(-4);
    const done = tasks.filter(t => t.status === 'done');
    const total = tasks.length;
    return {
        date: todayLabelCN(),
        date_key: dateKey,
        tasks,
        done_count: done.length,
        total_count: total,
        completion_rate: total ? Math.round(done.length / total * 100) : 0,
        planned_minutes: tasks.reduce((s, t) => s + (t.planned_minutes || parseInt(t.time) || 0), 0),
        spent_minutes: done.reduce((s, t) => s + (t.duration_min || 0), 0)
    };
}

// ---------- 响应封装 ----------
function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Cache-Control': 'no-store'
        }
    });
}
const fail = (status, msg) => json({ code: 1, msg }, status);

async function readBody(request) {
    try { return await request.json(); } catch (e) { return {}; }
}

// ---------- 路由 ----------
export async function onRequest(context) {
    const { request, env, params } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400'
            }
        });
    }

    const isNewRoute =
        path.startsWith('/api/student/') ||
        path.startsWith('/api/diagnostic/') ||
        path.startsWith('/api/behavior/') ||
        path === '/api/auth/register' || path === '/api/auth/login' ||
        path === '/api/auth/logout' || path === '/api/auth/me';

    if (!isNewRoute) {
        // 旧模块接口继续由原 Worker 提供服务
        const target = WORKER_BASE + path + url.search;
        return fetch(target, {
            method,
            headers: request.headers,
            body: (method === 'GET' || method === 'HEAD') ? undefined : request.body
        });
    }

    // ---- 认证 ----
    if (method === 'POST' && path === '/api/auth/register') {
        const b = await readBody(request);
        const username = String(b.username || '').trim();
        const password = String(b.password || '');
        if (!username || !password) return fail(400, '用户名和密码必填');
        if (await findUserByName(env, username)) return fail(409, '用户名已存在');
        const user = await createUser(env, { ...b, username, password });
        const profile = await saveProfile(env, user.id, {
            name: user.name, grade: user.grade, province: user.province,
            exam_year: parseInt(b.exam_year) || 2027,
            target_score: parseInt(b.target_score) || 600,
            target_school: b.target_school || ''
        });
        await saveGoal(env, user.id, {
            target_score: parseInt(b.target_score) || 600,
            target_school: b.target_school || '',
            exam_year: parseInt(b.exam_year) || 2027,
            daily_minutes: 120,
            status: 'active'
        });
        await addBehaviorEvent(env, user.id, 'user_registered', { username });
        const token = await issueToken(env, user);
        return json(ok({ token, user_id: user.id, user: publicUser(user), profile }));
    }

    if (method === 'POST' && path === '/api/auth/login') {
        const b = await readBody(request);
        const u = await findUserByName(env, b.username);
        if (!u || !(await verifyPassword(b.password, u))) return fail(401, '用户名或密码错误');
        const token = await issueToken(env, u);
        await addBehaviorEvent(env, u.id, 'user_login', {});
        return json(ok({ token, user_id: u.id, user: publicUser(u), profile: await getProfile(env, u.id) }));
    }

    if (method === 'POST' && path === '/api/auth/logout') {
        const auth = request.headers.get('authorization') || '';
        const m = auth.match(/^Bearer\s+(.+)$/);
        if (m) {
            await env.DATA_STORE.delete('token:' + m[1]);
            await env.DATA_STORE.delete('token:user:' + m[1]);
            await env.DATA_STORE.delete('token:exp:' + m[1]);
        }
        return json(ok({ success: true }));
    }

    const user = await currentUser(request, env);
    if (!user) return fail(401, '未登录或登录已过期');
    const userId = user.id;

    if (method === 'GET' && path === '/api/auth/me') {
        return json(ok(publicUser(user)));
    }

    // ---- 学生档案 ----
    if (path === '/api/student/profile') {
        if (method === 'GET') return json(ok(await getProfile(env, userId)));
        if (method === 'PUT') {
            const b = await readBody(request);
            const patch = {};
            ['name', 'grade', 'province', 'exam_year', 'school', 'gender'].forEach(k => {
                if (b[k] !== undefined) patch[k] = b[k];
            });
            const profile = await saveProfile(env, userId, patch);
            await addBehaviorEvent(env, userId, 'profile_updated', patch);
            return json(ok(profile));
        }
    }

    // ---- 学习目标 ----
    if (path === '/api/student/goal') {
        if (method === 'GET') return json(ok(await getGoal(env, userId)));
        if (method === 'PUT') {
            const b = await readBody(request);
            const patch = {};
            ['target_score', 'target_school', 'exam_year', 'daily_minutes', 'subjects'].forEach(k => {
                if (b[k] !== undefined) patch[k] = b[k];
            });
            if (patch.target_score !== undefined) patch.target_score = parseInt(patch.target_score) || 600;
            if (patch.daily_minutes !== undefined) patch.daily_minutes = parseInt(patch.daily_minutes) || 120;
            const goal = await saveGoal(env, userId, patch);
            const profile = await saveProfile(env, userId, {
                target_score: goal.target_score,
                target_school: goal.target_school || (await getProfile(env, userId) || {}).target_school || ''
            });
            await addBehaviorEvent(env, userId, 'goal_set', patch);
            return json(ok({ goal, profile }));
        }
    }

    // ---- 学情诊断 ----
    if (method === 'POST' && path === '/api/diagnostic/start') {
        const ids = await getJson(env, K.sessionIds(userId), []);
        let session = null;
        for (const sid of ids.slice().reverse()) {
            const s = await getJson(env, K.session(sid), null);
            if (s && s.status === 'in_progress') { session = s; break; }
        }
        if (!session) {
            session = {
                session_id: uid('ds'),
                user_id: userId,
                status: 'in_progress',
                question_ids: DIAGNOSTIC_BANK.map(q => q.id),
                started_at: nowIso(),
                submitted_at: null,
                date_key: todayKey()
            };
            await putJson(env, K.session(session.session_id), session);
            ids.push(session.session_id);
            await putJson(env, K.sessionIds(userId), ids);
            await addBehaviorEvent(env, userId, 'diagnostic_started', { session_id: session.session_id });
        }
        const answers = await getJson(env, K.answers(session.session_id), []);
        const answeredMap = {};
        answers.forEach(r => { answeredMap[r.question_id] = r; });

        return json(ok({
            session_id: session.session_id,
            status: session.status,
            started_at: session.started_at,
            total_questions: DIAGNOSTIC_BANK.length,
            questions: DIAGNOSTIC_BANK.map(q => ({
                id: q.id, subject: q.subject, knowledge_point_id: q.knowledge_point_id,
                knowledge_point: q.knowledge_point, difficulty: q.difficulty,
                stem: q.stem, options: q.options,
                answered: !!answeredMap[q.id],
                answer_index: answeredMap[q.id] ? answeredMap[q.id].answer_index : null,
                is_correct: answeredMap[q.id] ? !!answeredMap[q.id].is_correct : null
            }))
        }));
    }

    if (method === 'GET' && path === '/api/diagnostic/latest') {
        const ids = await getJson(env, K.sessionIds(userId), []);
        let latest = null;
        for (const sid of ids.slice().reverse()) {
            const s = await getJson(env, K.session(sid), null);
            if (s && (!latest || new Date(s.started_at) > new Date(latest.started_at))) latest = s;
        }
        return json(ok({
            status: latest ? latest.status : 'none',
            session: latest,
            report: await getJson(env, K.report(userId), null),
            plan: await getJson(env, K.plan(userId), null)
        }));
    }

    if (path === '/api/student/intelligence-profile' && method === 'GET') {
        const profile = await getProfile(env, userId);
        const goal = await getGoal(env, userId);
        const report = await getJson(env, K.report(userId), null);
        const plan = await getJson(env, K.plan(userId), null);
        const todayData = await getTodayTasks(env, userId);

        if (!todayData.tasks.length) {
            todayData.need_diagnosis = !report;
            todayData.message = report ? '今日暂无学习任务' : '完成AI学情诊断后自动生成学习计划';
        }

        const allTasks = await getJson(env, K.tasks(userId), []);
        const weekKeys = weekDayKeys();
        const weekTasks = allTasks.filter(t => t.status === 'done' && weekKeys.indexOf((t.completed_at || '').slice(0, 10)) >= 0);
        const weekHours = round2(weekTasks.reduce((s, t) => s + (t.duration_min || 0), 0) / 60);
        const dailyGoalMin = Number(goal && goal.daily_minutes) || 120;

        const ids = await getJson(env, K.sessionIds(userId), []);
        let status = 'none';
        if (report) status = 'completed';
        else if (ids.length) status = 'in_progress';

        const knowledgeStates = await getJson(env, K.knowledge(userId), []);
        const weakPoints = knowledgeStates
            .filter(k => k.mastery < 0.6)
            .sort((a, b) => a.mastery - b.mastery)
            .slice(0, 5)
            .map(k => ({
                subject: k.subject, knowledge_point: k.knowledge_point,
                mastery: k.mastery, accuracy: k.accuracy, attempts: k.attempts
            }));

        const prediction = report ? {
            available: true,
            predicted_score: report.summary.estimated_score,
            target_score: report.summary.target_score,
            score_gap: report.summary.score_gap,
            based_on: 'AI学情诊断（' + report.summary.total_questions + ' 题作答数据）',
            rank: null,
            percentile: null,
            confidence: null,
            admission_prob: null
        } : { available: false, reason: '暂无诊断数据，完成AI学情诊断后生成预测' };

        return json(ok({
            user_id: userId,
            server_time: nowIso(),
            timezone: TZ,
            today: todayKey(),
            today_label: todayLabelCN(),
            user: {
                user_id: userId,
                name: profile ? profile.name : user.name,
                grade: (profile && profile.grade) || user.grade || '',
                province: (profile && profile.province) || user.province || ''
            },
            profile,
            goal,
            diagnosis: {
                status,
                completed: !!report,
                session_id: ids.length ? ids[ids.length - 1] : null,
                report
            },
            level: {
                has_data: !!report,
                current_score: report ? report.summary.estimated_score : null,
                target_score: (goal && Number(goal.target_score)) || (report && report.summary.target_score) || null,
                score_gap: report ? report.summary.score_gap : null,
                accuracy: report ? report.summary.accuracy_pct : null
            },
            weak_points: weakPoints,
            ability_profile: await getJson(env, K.ability(userId), []),
            knowledge_states: knowledgeStates,
            today_tasks: todayData.tasks,
            today_stats: {
                done_count: todayData.done_count,
                total_count: todayData.total_count,
                completion_rate: todayData.completion_rate,
                planned_minutes: todayData.planned_minutes,
                spent_minutes: todayData.spent_minutes,
                need_diagnosis: !!todayData.need_diagnosis,
                message: todayData.message || ''
            },
            weekly: {
                week_hours: weekHours,
                goal_hours: round2(dailyGoalMin * 7 / 60),
                goal_rate: Math.round(Math.min(1, weekHours / Math.max(0.1, dailyGoalMin * 7 / 60)) * 100),
                today_minutes: todayData.spent_minutes || 0,
                daily_goal_minutes: dailyGoalMin
            },
            plan,
            prediction,
            onboarding: {
                need_profile: !profile,
                need_goal: !goal,
                need_diagnosis: !report,
                next_action: !profile ? 'profile' : (!goal ? 'goal' : (!report ? 'diagnosis' : 'study'))
            }
        }));
    }

    if (path === '/api/student/portrait' && method === 'GET') {
        return json(ok({
            user_id: userId,
            profile: await getProfile(env, userId),
            goal: await getGoal(env, userId),
            knowledge_states: await getJson(env, K.knowledge(userId), []),
            ability_states: await getJson(env, K.ability(userId), []),
            report: await getJson(env, K.report(userId), null),
            updated_at: nowIso()
        }));
    }

    if (path === '/api/student/today-tasks' && method === 'GET') {
        const data = await getTodayTasks(env, userId);
        const done = !!(await getJson(env, K.report(userId), null));
        if (!data.tasks.length) {
            data.need_diagnosis = !done;
            data.message = done ? '今日暂无学习任务' : '完成AI学情诊断后自动生成学习计划';
        }
        return json(ok(data));
    }

    // 诊断详情 / 答题 / 提交
    let m2 = path.match(/^\/api\/diagnostic\/([^/]+)\/answer$/);
    if (m2 && method === 'POST') {
        const session = await getJson(env, K.session(m2[1]), null);
        if (!session || session.user_id !== userId) return fail(404, '诊断会话不存在');
        if (session.status !== 'in_progress') return fail(400, '诊断已提交，不能继续作答');

        const b = await readBody(request);
        const q = DIAGNOSTIC_BANK.find(x => x.id === b.question_id);
        if (!q) return fail(400, '题目不存在');
        const idx = Number(b.answer_index);
        if (!(idx >= 0 && idx < q.options.length)) return fail(400, '答案无效');

        const answers = await getJson(env, K.answers(session.session_id), []);
        const existing = answers.find(r => r.question_id === q.id);
        const rec = existing || {
            id: uid('ans'),
            user_id: userId,
            session_id: session.session_id,
            question_id: q.id,
            subject: q.subject,
            knowledge_point_id: q.knowledge_point_id,
            knowledge_point: q.knowledge_point,
            difficulty: q.difficulty,
            answered_at: nowIso(),
            date_key: todayKey()
        };
        rec.answer_index = idx;
        rec.is_correct = idx === q.answer_index;
        rec.duration_sec = parseInt(b.duration_sec) || 0;
        rec.updated_at = nowIso();
        if (!existing) answers.push(rec);
        await putJson(env, K.answers(session.session_id), answers);
        await addBehaviorEvent(env, userId, 'diagnostic_answered', {
            session_id: session.session_id, question_id: q.id, is_correct: rec.is_correct, duration_sec: rec.duration_sec
        });

        return json(ok({
            question_id: q.id,
            is_correct: rec.is_correct,
            answer_index: q.answer_index,
            analysis: q.analysis,
            saved: true
        }));
    }

    let m3 = path.match(/^\/api\/diagnostic\/([^/]+)\/submit$/);
    if (m3 && method === 'POST') {
        const session = await getJson(env, K.session(m3[1]), null);
        if (!session || session.user_id !== userId) return fail(404, '诊断会话不存在');
        const answers = await getJson(env, K.answers(session.session_id), []);
        if (!answers.length) return fail(400, '请至少完成 1 道诊断题后再提交');

        session.status = 'completed';
        session.submitted_at = nowIso();
        await putJson(env, K.session(session.session_id), session);

        const report = await buildReport(env, userId, session, answers);
        const plan = await buildPlan(env, userId, report);
        await saveProfile(env, userId, {
            current_level: report.summary.estimated_score,
            diagnosis_completed_at: session.submitted_at,
            portrait_updated_at: nowIso()
        });
        await addBehaviorEvent(env, userId, 'diagnostic_completed', {
            session_id: session.session_id, report_id: report.report_id, plan_id: plan.plan_id
        });

        return json(ok({
            session_id: session.session_id,
            status: 'completed',
            report,
            plan,
            knowledge_states: await getJson(env, K.knowledge(userId), []),
            ability_states: await getJson(env, K.ability(userId), [])
        }));
    }

    let m4 = path.match(/^\/api\/diagnostic\/([^/]+)$/);
    if (m4 && method === 'GET') {
        const session = await getJson(env, K.session(m4[1]), null);
        if (!session || session.user_id !== userId) return fail(404, '诊断会话不存在');
        const answers = await getJson(env, K.answers(session.session_id), []);
        return json(ok({
            session,
            answers: answers.map(r => ({
                question_id: r.question_id, answer_index: r.answer_index,
                is_correct: r.is_correct, answered_at: r.answered_at
            })),
            total_questions: (session.question_ids || []).length
        }));
    }

    // 任务开始 / 完成
    let m5 = path.match(/^\/api\/student\/tasks\/([^/]+)\/(start|complete)$/);
    if (m5 && method === 'POST') {
        const taskId = m5[1];
        const action = m5[2];
        const tasks = await getJson(env, K.tasks(userId), []);
        const task = tasks.find(t => t.id === taskId);
        if (!task) return fail(404, '任务不存在');

        if (action === 'start') {
            if (task.status === 'done') return fail(400, '任务已完成');
            task.status = 'doing';
            task.started_at = nowIso();
            await putJson(env, K.tasks(userId), tasks);
            await addBehaviorEvent(env, userId, 'task_started', { task_id: task.id, subject: task.subject, point: task.point });
            return json(ok(task));
        }

        const b = await readBody(request);
        let duration = parseInt(b.duration_min);
        if (!duration && task.started_at) {
            duration = Math.max(1, Math.round((Date.now() - new Date(task.started_at).getTime()) / 60000));
        }
        task.status = 'done';
        task.completed_at = nowIso();
        task.duration_min = duration || task.planned_minutes || 30;
        if (b.answered != null) task.answered = parseInt(b.answered) || 0;
        if (b.correct != null && task.answered) {
            task.correct_rate = Math.round((parseInt(b.correct) || 0) / Math.max(1, task.answered) * 100);
        }
        await putJson(env, K.tasks(userId), tasks);

        const ks = await getJson(env, K.knowledge(userId), []);
        const state = ks.find(k => k.knowledge_point === task.point || k.knowledge_point_id === task.knowledge_point_id);
        if (state) {
            const gain = (task.correct_rate != null ? task.correct_rate / 100 : 0.6) * 0.08;
            state.mastery = round2(Math.min(1, state.mastery + gain));
            state.attempts += (task.answered || task.questions_count || 0);
            state.correct += (b.correct != null ? parseInt(b.correct) || 0 : Math.round((task.answered || 0) * 0.6));
            state.updated_at = nowIso();
            await putJson(env, K.knowledge(userId), ks);
        }

        const ability = await getJson(env, K.ability(userId), []);
        const ab = ability.find(a => a.subject === task.subject);
        if (ab) {
            const related = ks.filter(k => k.subject === task.subject);
            ab.mastery = related.length ? round2(related.reduce((s, k) => s + k.mastery, 0) / related.length) : ab.mastery;
            ab.updated_at = nowIso();
            await putJson(env, K.ability(userId), ability);
        }

        const today = await getTodayTasks(env, userId);
        const curProfile = (await getProfile(env, userId)) || {};
        const profile = await saveProfile(env, userId, {
            last_active_at: nowIso(),
            studies_count: (curProfile.studies_count || 0) + 1,
            portrait_updated_at: nowIso()
        });
        await addBehaviorEvent(env, userId, 'task_completed', {
            task_id: task.id, subject: task.subject, point: task.point,
            duration_min: task.duration_min, answered: task.answered || 0, correct_rate: task.correct_rate
        });

        return json(ok({ task, today_stats: today, knowledge_states: ks, ability_states: ability, profile }));
    }

    // 行为事件
    if (path === '/api/behavior/events') {
        if (method === 'POST') {
            const b = await readBody(request);
            if (!b.type) return fail(400, '缺少事件类型');
            const ev = await addBehaviorEvent(env, userId, b.type, b.payload || {});
            return json(ok(ev));
        }
        if (method === 'GET') {
            const limit = Math.min(200, parseInt(url.searchParams.get('limit')) || 50);
            const list = await getJson(env, K.events(userId), []);
            return json(ok(list.slice(-limit).reverse()));
        }
    }

    return fail(404, '接口不存在: ' + path);
}
