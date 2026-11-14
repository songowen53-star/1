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

// 新高考 3+1+2 满分 750：语数外必选(各150) + 物理/历史二选一(100) + 四选二(各100)
const TOTAL_FULL_SCORE = 750;
// 默认选科组合（用户未设置时使用）：语数英 + 物理 + 化学 + 生物 = 750
const DEFAULT_GAOKAO_SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物'];

import DIAGNOSTIC_BANK from './_diagnostic-bank.js';
import BLUEPRINT from './_diagnostic-blueprint.js';
import PAGE_DATA from './_page-data.js';


const KP_META = {};
DIAGNOSTIC_BANK.forEach(q => {
    KP_META[q.knowledge_point_id] = { id: q.knowledge_point_id, subject: q.subject, name: q.knowledge_point, difficulty: q.difficulty, domain: q.domain };
});
const QUESTION_MAP = {};
const BANK_MAP = {};
DIAGNOSTIC_BANK.forEach(q => { QUESTION_MAP[q.id] = q; BANK_MAP[q.id] = q; });

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
    userById: (uid) => 's:userid:' + uid,
    parentBinding: (id) => 'pb:id:' + id,
    parentBindingIds: (phone) => 'pb:phone:' + phone
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
    if (user.phone) await env.DATA_STORE.put('phone:' + user.phone, username);
    return user;
}
async function findUserByName(env, username) {
    const raw = await env.DATA_STORE.get('user:' + String(username || '').trim());
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
}
async function findUserByIdentifier(env, identifier) {
    const name = String(identifier || '').trim();
    let u = await findUserByName(env, name);
    if (u) return u;
    // 手机号作为 identifier 时，同时查找 phone 映射
    if (/^1\d{10}$/.test(name)) {
        const mapped = await env.DATA_STORE.get('phone:' + name);
        if (mapped) return findUserByName(env, mapped);
    }
    return null;
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
// 从 goal.subjects 中提取选科名称数组（兼容字符串数组和 {name,target} 对象数组）
function extractSubjectNames(subjects) {
    if (!Array.isArray(subjects) || !subjects.length) return null;
    const names = subjects.map(s => (typeof s === 'string' ? s : (s && s.name) || '')).filter(Boolean);
    return names.length ? names : null;
}

// ---------- 命题蓝图组卷 ----------
const round3 = (v) => Math.round(v * 1000) / 1000;
function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
    return h;
}
function bandOf(q) {
    const d = Number(q.difficulty);
    const bands = BLUEPRINT.difficulty_bands || {};
    for (const name of Object.keys(bands)) {
        if ((bands[name].levels || []).indexOf(d) !== -1) return name;
    }
    return '中档';
}
// 3+1+2 选科归一：语数外 + 首选(物理/历史) + 再选 2 科
function normalizeSelection(subjectNames) {
    const names = (subjectNames && subjectNames.length) ? subjectNames.slice() : DEFAULT_GAOKAO_SUBJECTS.slice();
    const st = BLUEPRINT.structure;
    const required = st.required.filter(s => names.indexOf(s) !== -1);
    const req = required.length ? required : st.required.slice();
    const first = st.first_choice.filter(s => names.indexOf(s) !== -1);
    const firstChoice = first.length ? first[0] : (names.indexOf('历史') !== -1 ? '历史' : '物理');
    const electives = st.electives.filter(s => names.indexOf(s) !== -1 && s !== firstChoice);
    st.electives.forEach(s => {
        if (electives.length < 2 && s !== firstChoice && electives.indexOf(s) === -1) electives.push(s);
    });
    return {
        subjects: req.concat([firstChoice], electives.slice(0, 2)),
        firstChoice,
        electives: electives.slice(0, 2)
    };
}
// 蓝图难度目标：最大余数法保证各档之和等于配额
function bandTargets(quota) {
    const bands = BLUEPRINT.difficulty_bands || {};
    const rows = Object.keys(bands).map(name => {
        const x = quota * (Number(bands[name].target) || 0);
        return { name, base: Math.floor(x), frac: x - Math.floor(x) };
    });
    let remain = quota - rows.reduce((s, r) => s + r.base, 0);
    rows.slice().sort((a, b) => b.frac - a.frac).forEach(r => {
        if (remain > 0) { r.base++; remain--; }
    });
    const out = {};
    rows.forEach(r => { out[r.name] = r.base; });
    return out;
}
// 按命题蓝图 + 选科分层组卷（同一学生同一天结果稳定，便于断点续答）
function selectQuestions(subjectNames, seed) {
    const sel = normalizeSelection(subjectNames);
    const picked = [];
    const quotas = {};
    sel.subjects.forEach(subject => {
        const quota = BLUEPRINT.subject_quota[subject] || 0;
        const pool = DIAGNOSTIC_BANK.filter(q => q.subject === subject);
        const used = {};
        const byBand = {};
        const targets = bandTargets(quota);
        ['难', '基础', '中档'].forEach(band => {
            const cfg = BLUEPRINT.difficulty_bands[band];
            if (!cfg) return;
            const want = targets[band] || 0;
            byBand[band] = pool
                .filter(q => !used[q.id] && (cfg.levels || []).indexOf(Number(q.difficulty)) !== -1)
                .sort((a, b) => hashStr(seed + a.id) - hashStr(seed + b.id))
                .slice(0, want);
            byBand[band].forEach(q => { used[q.id] = true; });
        });
        const chosen = [];
        ['基础', '中档', '难'].forEach(band => {
            (byBand[band] || []).forEach(q => { if (chosen.length < quota) chosen.push(q); });
        });
        if (chosen.length < quota) {
            pool.filter(q => !used[q.id])
                .sort((a, b) => Math.abs(a.p_value - 0.6) - Math.abs(b.p_value - 0.6))
                .forEach(q => { if (chosen.length < quota) { chosen.push(q); used[q.id] = true; } });
        }
        // 强制领域覆盖：每个必考领域至少 1 题（等量替换）
        const requiredDomains = ((BLUEPRINT.domains || {})[subject] || []).map(d => d.name);
        const domainCount = {};
        chosen.forEach(q => { domainCount[q.domain] = (domainCount[q.domain] || 0) + 1; });
        requiredDomains.forEach(domain => {
            if (domainCount[domain]) return;
            const cands = pool
                .filter(q => !used[q.id] && q.domain === domain)
                .sort((a, b) => hashStr(seed + a.id) - hashStr(seed + b.id));
            if (!cands.length) return;
            const cand = cands[0];
            const victims = chosen
                .filter(q => (domainCount[q.domain] || 0) > 1)
                .sort((a, b) => {
                    const sa = (bandOf(a) === bandOf(cand) ? 100 : 0) + (domainCount[a.domain] || 0);
                    const sb = (bandOf(b) === bandOf(cand) ? 100 : 0) + (domainCount[b.domain] || 0);
                    return sb - sa || hashStr(seed + a.id) - hashStr(seed + b.id);
                });
            if (!victims.length) return;
            const victim = victims[0];
            chosen[chosen.indexOf(victim)] = cand;
            used[cand.id] = true;
            domainCount[victim.domain]--;
            domainCount[domain] = (domainCount[domain] || 0) + 1;
        });
        const bandOrder = ['基础', '中档', '难'];
        chosen.sort((a, b) => bandOrder.indexOf(bandOf(a)) - bandOrder.indexOf(bandOf(b)) || a.id.localeCompare(b.id));
        quotas[subject] = chosen.length;
        chosen.forEach(q => picked.push(q));
    });
    return { questions: picked, quotas, selection: sel };
}

// ---------- 测量学计算 ----------
// 猜测校正：4 选 1 盲猜期望正确率 1/k
function thetaOf(correct, n, k) {
    if (!n) return 0;
    const kk = k || 4;
    const p = correct / n;
    return Math.max(0, Math.min(1, (p - 1 / kk) / (1 - 1 / kk)));
}
// 小样本经验贝叶斯收缩，避免 1 题定生死
function shrink(theta, n) {
    const w = 1.5;
    return (theta * n + 0.5 * w) / (n + w);
}
function proportionSE(p, n) { return n > 0 ? Math.sqrt(Math.max(0, p * (1 - p)) / n) : 0; }
function confidenceOf(n) {
    const th = BLUEPRINT.confidence_thresholds || { high: 10, medium: 4 };
    if (n >= th.high) return '高';
    if (n >= th.medium) return '中';
    return '低';
}

// KR-20 需要考生群体 × 同题矩阵：把最近 120 份诊断的作答向量存 KV，跨用户计算
async function kr20Cohort(env, session, records) {
    const qids = session.question_ids || [];
    if (qids.length < 10) return null;
    const KEY = 'diag:cohort:vectors';
    const prev = await getJson(env, KEY, []);
    const items = {};
    records.forEach(r => { items[r.question_id] = r.is_correct ? 1 : 0; });
    const vectors = (Array.isArray(prev) ? prev : [])
        .filter(x => x && x.session_id !== session.session_id)
        .concat([{ session_id: session.session_id, at: nowIso(), items }])
        .slice(-120);
    await putJson(env, KEY, vectors);

    const minOverlap = Math.max(10, Math.ceil(qids.length * 0.2));
    const matrix = vectors.map(v => v.items || {}).filter(m => Object.keys(m).length >= minOverlap);
    if (matrix.length < 3) return null;
    const common = qids.filter(id => matrix.every(m => m[id] !== undefined));
    if (common.length < 10) return null;
    const totals = matrix.map(m => common.reduce((s, id) => s + m[id], 0));
    const meanT = totals.reduce((a, b) => a + b, 0) / totals.length;
    const varT = totals.reduce((a, b) => a + (b - meanT) * (b - meanT), 0) / totals.length;
    if (varT <= 0) return null;
    const sumPQ = common.reduce((s, id) => {
        const pi = matrix.reduce((acc, m) => acc + m[id], 0) / matrix.length;
        return s + pi * (1 - pi);
    }, 0);
    const value = Math.max(0, Math.min(1, (common.length / (common.length - 1)) * (1 - sumPQ / varT)));
    return { value: round3(value), examinees: matrix.length, items: common.length };
}

function computeStates(records, session, subjectNames) {
    const items = records.map(r => {
        const q = BANK_MAP[r.question_id] || {};
        return {
            record: r,
            subject: r.subject || q.subject || '未知',
            knowledge_point_id: r.knowledge_point_id || q.knowledge_point_id || 'unknown',
            domain: q.domain || '未分类',
            ability: q.ability || '理解识记',
            k: (q.options && q.options.length) || 4
        };
    });

    // 以本次组卷实际涉及的科目为准（兼容旧版 34 题会话）
    const sessionSubjects = [];
    (session.question_ids || []).forEach(id => {
        const q = BANK_MAP[id];
        if (q && sessionSubjects.indexOf(q.subject) === -1) sessionSubjects.push(q.subject);
    });
    const validSubjects = sessionSubjects.length ? sessionSubjects
        : ((subjectNames && subjectNames.length) ? subjectNames : DEFAULT_GAOKAO_SUBJECTS);

    const kpAgg = {};
    items.forEach(it => {
        const id = it.knowledge_point_id;
        if (!kpAgg[id]) kpAgg[id] = { n: 0, correct: 0, subject: it.subject, domain: it.domain, k: it.k };
        kpAgg[id].n++;
        if (it.record.is_correct) kpAgg[id].correct++;
    });
    const knowledgeStates = Object.keys(kpAgg).map(id => {
        const meta = KP_META[id] || { id, subject: kpAgg[id].subject, name: id, domain: kpAgg[id].domain };
        const a = kpAgg[id];
        return {
            user_id: session.user_id,
            knowledge_point_id: id,
            knowledge_point: meta.name,
            subject: meta.subject,
            domain: meta.domain,
            mastery: round2(shrink(thetaOf(a.correct, a.n, a.k), a.n)),
            accuracy: round2(a.correct / a.n),
            attempts: a.n,
            correct: a.correct,
            confidence: confidenceOf(a.n),
            updated_at: nowIso()
        };
    }).sort((a, b) => a.mastery - b.mastery);

    // 知识领域层：诊断结论主体，避免 1 题定生死
    const domainAgg = {};
    items.forEach(it => {
        const key = it.subject + '|' + it.domain;
        if (!domainAgg[key]) domainAgg[key] = { subject: it.subject, domain: it.domain, n: 0, correct: 0, k: it.k };
        domainAgg[key].n++;
        if (it.record.is_correct) domainAgg[key].correct++;
    });
    const domainStates = Object.keys(domainAgg).map(key => {
        const a = domainAgg[key];
        return {
            subject: a.subject,
            domain: a.domain,
            mastery: round2(shrink(thetaOf(a.correct, a.n, a.k), a.n)),
            accuracy: round2(a.correct / a.n),
            attempts: a.n,
            correct: a.correct,
            confidence: confidenceOf(a.n)
        };
    }).sort((a, b) => a.mastery - b.mastery);

    const abilityStates = validSubjects.map(subject => {
        const meta = SUBJECT_META[subject];
        if (!meta) return null;
        const sub = items.filter(it => it.subject === subject);
        if (!sub.length) return null;
        const n = sub.length;
        const correct = sub.filter(it => it.record.is_correct).length;
        const p = correct / n;
        const k = sub[0].k || 4;
        const theta = thetaOf(correct, n, k);
        const thetaAdj = shrink(theta, n);
        const se = proportionSE(p, n) / (1 - 1 / k);
        const sem = round2(se * meta.full_score);
        const ci = Math.round(1.96 * sem);
        const estimated = Math.round(meta.full_score * thetaAdj);
        let level = '基础';
        if (thetaAdj >= 0.8) level = '优势';
        else if (thetaAdj >= 0.6) level = '进阶';
        const dimensions = (BLUEPRINT.ability_dimensions || []).map(dim => {
            const ds = sub.filter(it => it.ability === dim);
            const dn = ds.length;
            const dc = ds.filter(it => it.record.is_correct).length;
            return {
                dimension: dim,
                attempts: dn,
                correct: dc,
                mastery: dn ? round2(shrink(thetaOf(dc, dn, k), dn)) : null,
                confidence: confidenceOf(dn)
            };
        }).filter(d => d.attempts > 0);
        return {
            user_id: session.user_id,
            subject,
            color: meta.color,
            icon: meta.icon,
            full_score: meta.full_score,
            attempts: n,
            correct,
            accuracy: round2(p),
            mastery: round2(thetaAdj),
            guessing_corrected: round2(theta),
            estimated_score: estimated,
            score_range: [Math.max(0, estimated - ci), Math.min(meta.full_score, estimated + ci)],
            sem,
            confidence: confidenceOf(n),
            level,
            dimensions,
            updated_at: nowIso()
        };
    }).filter(Boolean);

    const totalQ = records.length;
    const totalCorrect = records.filter(r => r.is_correct).length;
    const accuracy = totalQ ? totalCorrect / totalQ : 0;
    const correctedAccuracy = thetaOf(totalCorrect, totalQ, 4);
    const estimatedScore = Math.min(abilityStates.reduce((s, a) => s + a.estimated_score, 0), TOTAL_FULL_SCORE);

    return {
        knowledgeStates, domainStates, abilityStates,
        totalQ, totalCorrect, accuracy, correctedAccuracy, estimatedScore,
        sessionSubjects: validSubjects
    };
}

// 组卷覆盖度：题量、领域、难度配比、信度
function buildCoverage(session, st, reliability) {
    const qids = session.question_ids || [];
    const counts = {}, domainCounts = {}, bands = {};
    qids.forEach(id => {
        const q = BANK_MAP[id];
        if (!q) return;
        counts[q.subject] = (counts[q.subject] || 0) + 1;
        const dk = q.subject + '|' + q.domain;
        domainCounts[dk] = (domainCounts[dk] || 0) + 1;
        const b = bandOf(q);
        bands[b] = (bands[b] || 0) + 1;
    });
    const quota = session.subject_quotas || {};
    const subjects = st.sessionSubjects.map(subject => {
        const reqDomains = (BLUEPRINT.domains[subject] || []).filter(d => d.required).map(d => d.name);
        const covered = reqDomains.filter(name => domainCounts[subject + '|' + name]);
        return {
            subject,
            planned: quota[subject] || 0,
            actual: counts[subject] || 0,
            domains_required: reqDomains.length,
            domains_covered: covered.length,
            missing_domains: reqDomains.filter(name => covered.indexOf(name) === -1)
        };
    });
    const totalPlanned = subjects.reduce((s, x) => s + x.planned, 0);
    const totalActual = subjects.reduce((s, x) => s + x.actual, 0);
    let delta = 0;
    Object.keys(BLUEPRINT.difficulty_bands).forEach(band => {
        const target = BLUEPRINT.difficulty_bands[band].target || 0;
        const actual = totalActual ? (bands[band] || 0) / totalActual : 0;
        delta += Math.abs(actual - target);
    });
    const gaps = [];
    if (totalActual < totalPlanned) gaps.push('题库题量不足，实组 ' + totalActual + '/' + totalPlanned + ' 题');
    subjects.forEach(s => {
        if (s.missing_domains.length) gaps.push(s.subject + ' 未覆盖：' + s.missing_domains.join('、'));
    });
    const hardRatio = totalActual ? (bands['难'] || 0) / totalActual : 0;
    if (hardRatio < 0.1) gaps.push('高难题占比 ' + Math.round(hardRatio * 100) + '%，低于蓝图 20%，顶尖水平区分度有限');
    if (reliability !== null && reliability < 0.8) gaps.push('整卷信度 KR-20=' + reliability + '，低于 0.8');
    return {
        blueprint_version: BLUEPRINT.version,
        total_planned: totalPlanned,
        total_actual: totalActual,
        completeness: totalPlanned ? round2(totalActual / totalPlanned) : 0,
        difficulty_distribution: bands,
        difficulty_compliance: round3(Math.max(0, 1 - delta / 2)),
        reliability_kr20: reliability,
        confidence: st.overallConfidence,
        subjects,
        gaps
    };
}

async function buildReport(env, userId, session, records) {
    const goal = (await getGoal(env, userId)) || {};
    const subjectNames = extractSubjectNames(goal.subjects);
    const st = computeStates(records, session, subjectNames);
    const targetScore = Number(goal.target_score) || 600;
    const selSubjects = st.sessionSubjects;
    const inScope = subject => selSubjects.indexOf(subject) !== -1;
    const minItems = BLUEPRINT.min_items_for_conclusion || 2;

    const reliabilityMeta = await kr20Cohort(env, session, records);
    const reliability = reliabilityMeta ? reliabilityMeta.value : null;
    let overallConfidence = '低';
    if (st.totalQ >= 60 && (reliability === null || reliability >= 0.8)) overallConfidence = '高';
    else if (st.totalQ >= 30) overallConfidence = '中';
    if (reliability !== null && reliability < 0.6) overallConfidence = '低';
    st.overallConfidence = overallConfidence;

    // 结论以“≥2 题的知识领域”为主，避免单题定性
    let weak = st.domainStates
        .filter(d => inScope(d.subject) && d.attempts >= minItems && d.mastery < 0.6)
        .slice(0, 5);
    if (!weak.length) {
        weak = st.knowledgeStates
            .filter(k => inScope(k.subject) && k.mastery < 0.6)
            .slice(0, 5);
    }
    let strong = st.domainStates
        .filter(d => inScope(d.subject) && d.attempts >= minItems && d.mastery >= 0.75)
        .slice(0, 5);

    const coverage = buildCoverage(session, st, reliability);
    // 总分区间：各科测量误差独立，方差按平方和合成
    const seTotal = Math.sqrt(st.abilityStates.reduce((s, a) => s + (a.sem * a.sem), 0));
    const ciTotal = Math.round(1.96 * seTotal);
    const low = Math.max(0, st.estimatedScore - ciTotal);
    const high = Math.min(TOTAL_FULL_SCORE, st.estimatedScore + ciTotal);

    const paragraphs = [];
    paragraphs.push('本次AI学情诊断实作答 ' + st.totalQ + ' 题（覆盖 ' + selSubjects.length + ' 科），答对 ' + st.totalCorrect
        + ' 题，原始正确率 ' + Math.round(st.accuracy * 100) + '%，扣除猜对因素后的能力估计为 ' + Math.round(st.correctedAccuracy * 100) + '%。');
    if (st.abilityStates.length) {
        const best = st.abilityStates.slice().sort((a, b) => b.mastery - a.mastery)[0];
        const worst = st.abilityStates.slice().sort((a, b) => a.mastery - b.mastery)[0];
        paragraphs.push('学科能力上，' + best.subject + '表现最好（掌握度 ' + Math.round(best.mastery * 100)
            + '%），' + worst.subject + '相对薄弱（掌握度 ' + Math.round(worst.mastery * 100) + '%）。');
    }
    if (weak.length) {
        paragraphs.push('薄弱领域集中在：' + weak.map(w => w.subject + '·' + w.knowledge_point + '（' + w.confidence + '置信）').join('、')
            + '，建议优先安排专项训练。');
    }
    paragraphs.push('本次估分 ' + st.estimatedScore + ' 分（95% 参考区间 ' + low + '～' + high + ' 分），距离目标 '
        + targetScore + ' 分还有 ' + Math.max(0, targetScore - st.estimatedScore) + ' 分的提升空间。');
    paragraphs.push('诊断质量：信度 KR-20=' + (reliability === null ? '样本不足'
        : reliability + '（' + reliabilityMeta.examinees + ' 名考生 × ' + reliabilityMeta.items + ' 道公共题）')
        + '，整体置信度' + overallConfidence + '，蓝图完成度 ' + Math.round(coverage.completeness * 100) + '%。'
        + (coverage.gaps.length ? '局限：' + coverage.gaps.slice(0, 2).join('；') + '。' : ''));

    const report = {
        report_id: uid('rep'),
        user_id: userId,
        session_id: session.session_id,
        created_at: nowIso(),
        generated_from: 'diagnostic',
        summary: {
            total_questions: st.totalQ,
            correct_count: st.totalCorrect,
            accuracy: round2(st.accuracy),
            accuracy_pct: Math.round(st.accuracy * 100),
            corrected_accuracy: round2(st.correctedAccuracy),
            corrected_accuracy_pct: Math.round(st.correctedAccuracy * 100),
            current_level: st.estimatedScore,
            estimated_score: st.estimatedScore,
            score_range: [low, high],
            target_score: targetScore,
            score_gap: Math.max(0, targetScore - st.estimatedScore),
            mastery_avg: st.abilityStates.length ? round2(st.abilityStates.reduce((s, a) => s + a.mastery, 0) / st.abilityStates.length) : 0,
            reliability_kr20: reliability,
            confidence: overallConfidence,
            coverage_rate: coverage.completeness
        },
        weak_points: weak.map(w => ({
            subject: w.subject, knowledge_point: w.knowledge_point, domain: w.domain,
            mastery: w.mastery, accuracy: w.accuracy, attempts: w.attempts, confidence: w.confidence,
            suggestion: '先看知识点讲解，再完成 8-10 道专项题，完成后立即复盘错题。'
        })),
        strengths: strong,
        ability_profile: st.abilityStates.map(a => ({
            subject: a.subject, level: a.level, mastery: a.mastery,
            accuracy: a.accuracy, estimated_score: a.estimated_score, full_score: a.full_score,
            score_range: a.score_range, sem: a.sem, confidence: a.confidence,
            attempts: a.attempts, dimensions: a.dimensions
        })),
        coverage,
        paragraphs
    };

    await putJson(env, K.report(userId), report);
    await putJson(env, K.knowledge(userId), st.knowledgeStates);
    await putJson(env, K.ability(userId), st.abilityStates);
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

    // ---- 页面模块数据（数据源 backend/data/pages，部署时生成）----
    // 必须在旧 Worker 转发之前处理，否则会读到旧模块的过期内容
    if (method === 'GET') {
        const pdMatch = path.match(/^\/api\/page-data\/([^/]+)$/);
        if (pdMatch) {
            const mod = PAGE_DATA[pdMatch[1]];
            if (!mod) return fail(404, '模块不存在: ' + pdMatch[1]);
            return json(ok(JSON.parse(JSON.stringify(mod))));
        }
        const amMatch = path.match(/^\/api\/ai-module\/([^/]+)$/);
        if (amMatch) {
            const mod = PAGE_DATA['ai-module-' + amMatch[1]];
            if (!mod) return fail(404, '模块不存在: ' + amMatch[1]);
            const copy = JSON.parse(JSON.stringify(mod));
            if (amMatch[1] === 'coach' && copy.today_analysis) {
                copy.today_analysis.date = new Date().toLocaleDateString('zh-CN');
            }
            if (amMatch[1] === 'paper' && copy.header_card) {
                copy.header_card.generated_at = new Date().toLocaleString('zh-CN');
            }
            if (amMatch[1] === 'predict' && copy.header_card && copy.header_card.stats) {
                const exam = new Date(2027, 5, 7);
                const days = Math.max(0, Math.ceil((exam - new Date()) / 86400000));
                copy.header_card.stats = copy.header_card.stats.map(s =>
                    s.label && s.label.includes('高考') ? { ...s, value: String(days) + '天' } : s
                );
            }
            return json(ok(copy));
        }
    }

    const isNewRoute =
        path.startsWith('/api/student/') ||
        path.startsWith('/api/diagnostic/') ||
        path.startsWith('/api/behavior/') ||
        /^\/api\/recommend\/[^/]+\/week-plan$/.test(path) ||
        path === '/api/auth/register' || path === '/api/auth/login' ||
        path === '/api/auth/logout' || path === '/api/auth/me' ||
        path === '/api/auth/parent-bind' || path === '/api/auth/parent-bindings' ||
        /^\/api\/auth\/parent-bindings\/[^/]+\/confirm$/.test(path);

    if (!isNewRoute) {
        // 旧模块接口继续由原 Worker 提供服务
        const target = WORKER_BASE + path + url.search;
        return fetch(target, {
            method,
            headers: request.headers,
            body: (method === 'GET' || method === 'HEAD') ? undefined : request.body
        });
    }

    // ---- AI学习计划（周/月视图，数据源与今日任务一致，按 path 中的 userId 读取）----
    const weekPlanMatch = path.match(/^\/api\/recommend\/([^/]+)\/week-plan$/);
    if (weekPlanMatch && method === 'GET') {
        const targetUserId = weekPlanMatch[1];
        const range = url.searchParams.get('range') || 'this_week';
        const rangeLabels = { this_week: '本周', next_week: '下周', this_month: '本月' };
        const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        const allTasks = await getJson(env, K.tasks(targetUserId), []);
        const plan = await getJson(env, K.plan(targetUserId), null);

        const keys = [];
        if (range === 'this_month') {
            // 覆盖整月：从当月 1 日所在周的周一开始，到当月最后一天所在周的周日结束
            const nowParts = tzParts(new Date());
            const y = Number(nowParts.year), m = Number(nowParts.month);
            const lastOfMonthKey = todayKey(new Date(y, m, 0));
            const startParts = startOfWeekKey(new Date(y, m - 1, 1)).split('-').map(Number);
            for (let i = 0; i < 42; i++) {
                const dayKey = todayKey(new Date(startParts[0], startParts[1] - 1, startParts[2] + i));
                keys.push(dayKey);
                const dow = new Date(Date.UTC(startParts[0], startParts[1] - 1, startParts[2] + i)).getUTCDay();
                if (dayKey >= lastOfMonthKey && dow === 0) break;
            }
        } else if (range === 'next_week') {
            weekDayKeys(new Date(Date.now() + 7 * 86400000)).forEach(k => keys.push(k));
        } else {
            weekDayKeys().forEach(k => keys.push(k));
        }

        const todayK = todayKey();
        const weekPlan = keys.map((k, i) => {
            const parts = k.split('-').map(Number);
            const dow = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])).getUTCDay();
            const tasks = allTasks.filter(t => t.planned_date === k).map(t => ({
                id: t.id,
                subject: t.subject,
                point: t.point,
                time: t.time || ((t.planned_minutes || 30) + 'min'),
                color: t.color,
                questions_count: t.questions_count || 8,
                status: t.status,
                done: t.status === 'done'
            }));
            const day = {
                day: dayNames[(dow + 6) % 7],
                date: k,
                is_today: k === todayK,
                isToday: k === todayK,
                tasks
            };
            if (range === 'this_month') {
                const weekIdx = Math.floor(i / 7);
                day.week_group = weekIdx;
                day.week_group_name = '第' + (weekIdx + 1) + '周';
            }
            return day;
        });

        const totalTasks = weekPlan.reduce((s, d) => s + d.tasks.length, 0);
        const doneTasks = weekPlan.reduce((s, d) => s + d.tasks.filter(t => t.done).length, 0);
        return json(ok({
            has_data: totalTasks > 0,
            range,
            range_label: rangeLabels[range] || '本周',
            plan_id: plan ? plan.plan_id : null,
            week_plan: weekPlan,
            days: weekPlan,
            total_tasks: totalTasks,
            done_tasks: doneTasks,
            message: totalTasks ? '' : (plan ? '当前时间段暂无学习任务' : '完成AI学情诊断后自动生成学习计划')
        }));
    }

    // ---- 认证 ----
    if (method === 'POST' && path === '/api/auth/register') {
        const b = await readBody(request);
        let username = String(b.username || '').trim();
        const phone = String(b.phone || '').trim();
        if (!username && phone && /^1\d{10}$/.test(phone)) username = phone;
        const password = String(b.password || '');
        if (!username || !password) return fail(400, '账号和密码必填');
        if (await findUserByName(env, username)) return fail(409, '该账号可能已注册');
        const user = await createUser(env, { ...b, username, password, phone: phone || (/^1\d{10}$/.test(username) ? username : '') });
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
        const u = await findUserByIdentifier(env, b.username);
        if (!u || !(await verifyPassword(b.password, u))) return fail(401, '账号或密码错误');
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

    // ---- 家长绑定（登录前即可使用）----
    if (method === 'POST' && path === '/api/auth/parent-bind') {
        const b = await readBody(request);
        const studentPhone = String(b.student_phone || '').trim();
        const parentPhone = String(b.parent_phone || '').trim();
        const relation = String(b.relation || '父');
        const smsCode = String(b.sms_code || '').trim();

        if (!studentPhone || !parentPhone) return fail(400, '学生/家长手机号必填');
        if (!/^1\d{10}$/.test(studentPhone)) return fail(400, '学生手机号格式不正确');
        if (!/^1\d{10}$/.test(parentPhone)) return fail(400, '家长手机号格式不正确');
        if (studentPhone === parentPhone) return fail(400, '学生与家长手机号不能相同');
        if (smsCode && smsCode !== '8888') return fail(401, '短信验证码错误');

        const ids = await getJson(env, K.parentBindingIds(parentPhone), []);
        if (ids.length >= 3) return fail(409, '一个家长账号最多绑定3个学生账号');
        const existing = (await Promise.all(ids.map(id => getJson(env, K.parentBinding(id), null)))).filter(Boolean);
        if (existing.some(r => r.student_phone === studentPhone)) return fail(409, '该学生已绑定过此家长账号');

        const rec = {
            binding_id: 'b_' + uid('').slice(1, 9),
            student_phone: studentPhone,
            parent_phone: parentPhone,
            relation,
            status: smsCode ? 'active' : 'pending',
            created_at: nowIso()
        };
        await putJson(env, K.parentBinding(rec.binding_id), rec);
        ids.push(rec.binding_id);
        await putJson(env, K.parentBindingIds(parentPhone), ids);
        return json(ok(rec));
    }

    if (method === 'GET' && path === '/api/auth/parent-bindings') {
        const parentPhone = String(url.searchParams.get('parent_phone') || '').trim();
        let ids;
        if (parentPhone) {
            ids = await getJson(env, K.parentBindingIds(parentPhone), []);
        } else {
            const listed = await env.DATA_STORE.list({ prefix: 'pb:id:' });
            ids = (listed.keys || []).map(k => k.name.slice('pb:id:'.length));
        }
        const records = (await Promise.all(ids.map(id => getJson(env, K.parentBinding(id), null)))).filter(Boolean);
        records.sort((a, b2) => String(b2.created_at).localeCompare(String(a.created_at)));
        return json(ok(records));
    }

    const confirmMatch = path.match(/^\/api\/auth\/parent-bindings\/([^/]+)\/confirm$/);
    if (confirmMatch && method === 'POST') {
        const rec = await getJson(env, K.parentBinding(confirmMatch[1]), null);
        if (!rec) return fail(404, '绑定记录不存在');
        rec.status = 'active';
        rec.confirmed_at = nowIso();
        await putJson(env, K.parentBinding(rec.binding_id), rec);
        return json(ok(rec));
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
            const goal = (await getGoal(env, userId)) || {};
            const subjectNames = extractSubjectNames(goal.subjects);
            const sel = selectQuestions(subjectNames, userId + '|' + todayKey());
            session = {
                session_id: uid('ds'),
                user_id: userId,
                status: 'in_progress',
                question_ids: sel.questions.map(q => q.id),
                subject_quotas: sel.quotas,
                selection: sel.selection,
                blueprint_version: BLUEPRINT.version,
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
        const sessionQuestions = (session.question_ids || []).map(id => BANK_MAP[id]).filter(Boolean);

        return json(ok({
            session_id: session.session_id,
            status: session.status,
            started_at: session.started_at,
            total_questions: sessionQuestions.length,
            subject_counts: session.subject_quotas || {},
            blueprint: {
                version: BLUEPRINT.version,
                subject_quotas: BLUEPRINT.subject_quota,
                first_choice: (session.selection || {}).firstChoice || null,
                electives: (session.selection || {}).electives || []
            },
            questions: sessionQuestions.map(q => ({
                id: q.id, subject: q.subject, knowledge_point_id: q.knowledge_point_id,
                knowledge_point: q.knowledge_point, difficulty: q.difficulty,
                domain: q.domain, ability: q.ability,
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

    // ---- 诊断答题 / 提交 ----
    const diagAction = path.match(/^\/api\/diagnostic\/([^/]+)\/(answer|submit)$/);
    if (method === 'POST' && diagAction) {
        const sessionId = decodeURIComponent(diagAction[1]);
        const action = diagAction[2];
        const session = await getJson(env, K.session(sessionId), null);
        if (!session || session.user_id !== userId) return fail(404, '诊断会话不存在');

        if (action === 'answer') {
            if (session.status !== 'in_progress') return fail(400, '诊断已提交，不能继续作答');
            const b = await readBody(request);
            const q = DIAGNOSTIC_BANK.find(x => x.id === b.question_id);
            if (!q) return fail(400, '题目不存在');
            const idx = Number(b.answer_index);
            if (!(idx >= 0 && idx < q.options.length)) return fail(400, '答案无效');
            if ((session.question_ids || []).indexOf(q.id) === -1) return fail(400, '该题不属于本次诊断');

            const isCorrect = idx === q.answer_index;
            const answers = await getJson(env, K.answers(sessionId), []);
            const existing = answers.find(r => r.question_id === q.id);
            const rec = existing || {
                id: uid('ans'),
                user_id: userId,
                session_id: sessionId,
                question_id: q.id,
                answered_at: nowIso(),
                date_key: todayKey()
            };
            rec.subject = q.subject;
            rec.knowledge_point_id = q.knowledge_point_id;
            rec.knowledge_point = q.knowledge_point;
            rec.difficulty = q.difficulty;
            rec.answer_index = idx;
            rec.is_correct = isCorrect;
            rec.duration_sec = parseInt(b.duration_sec) || 0;
            rec.updated_at = nowIso();
            if (!existing) answers.push(rec);
            await putJson(env, K.answers(sessionId), answers);
            await addBehaviorEvent(env, userId, 'diagnostic_answered', {
                session_id: sessionId, question_id: q.id, is_correct: isCorrect
            });
            return json(ok({
                question_id: q.id,
                is_correct: isCorrect,
                answer_index: q.answer_index,
                analysis: q.analysis,
                saved: true
            }));
        }

        // submit
        const answers = await getJson(env, K.answers(sessionId), []);
        if (!answers.length) return fail(400, '请至少完成 1 道诊断题后再提交');

        session.status = 'completed';
        session.submitted_at = nowIso();
        await putJson(env, K.session(sessionId), session);

        const report = await buildReport(env, userId, session, answers);
        const plan = await buildPlan(env, userId, report);
        await saveProfile(env, userId, {
            current_level: report.summary.estimated_score,
            diagnosis_completed_at: session.submitted_at,
            portrait_updated_at: nowIso()
        });
        await addBehaviorEvent(env, userId, 'diagnostic_completed', {
            session_id: sessionId, report_id: report.report_id, plan_id: plan.plan_id
        });

        return json(ok({
            session_id: sessionId,
            status: 'completed',
            report,
            plan,
            knowledge_states: await getJson(env, K.knowledge(userId), []),
            ability_states: await getJson(env, K.ability(userId), [])
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
            predicted_score: Math.min(report.summary.estimated_score, TOTAL_FULL_SCORE),
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

    // 今日任务 + 答题记录（学习进度快照，供教练等模块使用）
    if (path === '/api/student/today-progress' && method === 'GET') {
        const dateKey = todayKey();
        const taskData = await getTodayTasks(env, userId);

        const diagRecords = [];
        const sessionIds = await getJson(env, K.sessionIds(userId), []);
        for (const sid of sessionIds) {
            const session = await getJson(env, K.session(sid), null);
            if (!session) continue;
            const sKey = session.date_key ||
                (session.started_at ? todayKey(new Date(session.started_at)) : '');
            if (sKey !== dateKey) continue;
            const answers = await getJson(env, K.answers(sid), []);
            answers.forEach(a => diagRecords.push(a));
        }

        const subjectMap = {};
        diagRecords.forEach(a => {
            const q = QUESTION_MAP[a.question_id] || {};
            const key = q.subject || '未分类';
            if (!subjectMap[key]) subjectMap[key] = { subject: key, total: 0, correct: 0 };
            subjectMap[key].total++;
            if (a.is_correct) subjectMap[key].correct++;
        });

        let practiceTotal = 0;
        let practiceCorrect = 0;
        const taskRecent = [];
        taskData.tasks.filter(t => t.status === 'done').forEach(t => {
            const answered = Number(t.answered) || 0;
            practiceTotal += answered;
            const rate = Number(t.correct_rate);
            practiceCorrect += Number.isFinite(rate) ? Math.round(answered * rate / 100) : 0;
            if (answered) {
                taskRecent.push({
                    subject: t.subject || '',
                    knowledge_point: t.point || '',
                    is_correct: Number.isFinite(rate) ? rate >= 60 : true,
                    answered_at: t.completed_at || ''
                });
            }
        });

        const diagCorrect = diagRecords.filter(a => a.is_correct).length;
        const totalAnswers = diagRecords.length + practiceTotal;
        const totalCorrect = diagCorrect + practiceCorrect;

        const recentDiag = diagRecords.slice().sort((a, b) =>
            String(b.answered_at || '').localeCompare(String(a.answered_at || ''))
        ).slice(0, 5).map(a => {
            const q = QUESTION_MAP[a.question_id] || {};
            return {
                subject: q.subject || '',
                knowledge_point: q.knowledge_point || '',
                is_correct: !!a.is_correct,
                answered_at: a.answered_at || ''
            };
        });
        const recent = recentDiag.concat(taskRecent).slice(0, 5);

        return json(ok({
            date: taskData.date,
            date_key: dateKey,
            tasks: {
                total: taskData.total_count,
                done: taskData.done_count,
                completion_rate: taskData.completion_rate,
                planned_minutes: taskData.planned_minutes,
                spent_minutes: taskData.spent_minutes
            },
            answers: {
                total: totalAnswers,
                correct: totalCorrect,
                correct_rate: totalAnswers ? Math.round(totalCorrect / totalAnswers * 100) : 0,
                diagnostic: diagRecords.length,
                practice: practiceTotal,
                duration_min: Math.round(diagRecords.reduce((s, a) => s + (Number(a.duration_sec) || 0), 0) / 60)
            },
            subjects: Object.values(subjectMap).map(s => ({
                subject: s.subject,
                total: s.total,
                correct: s.correct,
                correct_rate: s.total ? Math.round(s.correct / s.total * 100) : 0
            })),
            recent
        }));
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
