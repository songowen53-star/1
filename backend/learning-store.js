// ============================================================
// 学生数据持久层（JSON 文件存储）
// 所有学生数据按 user_id 隔离，日期统一使用服务器/用户时区
// ============================================================
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const TZ = process.env.APP_TZ || 'Asia/Shanghai';
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = process.env.LEARNING_DB_PATH || path.join(DATA_DIR, 'learning-db.json');

function emptyDb() {
    return {
        meta: { version: 1, created_at: new Date().toISOString() },
        users: {},              // username -> user
        tokens: {},             // token -> { user_id, created_at, expires_at }
        student_profiles: {},   // user_id -> profile
        learning_goals: {},     // user_id -> goal
        diagnostic_sessions: {},// session_id -> session
        answer_records: [],     // 答题行为
        knowledge_states: {},   // user_id -> [ {knowledge_point_id, ...} ]
        ability_states: {},     // user_id -> [ {subject, ...} ]
        ai_diagnosis_reports: {}, // user_id -> report
        learning_plans: {},     // user_id -> plan
        learning_tasks: [],     // 学习任务
        behavior_events: []     // 行为事件
    };
}

let _db = null;

function load() {
    if (_db) return _db;
    try {
        if (fs.existsSync(DB_PATH)) {
            const raw = fs.readFileSync(DB_PATH, 'utf8');
            const parsed = JSON.parse(raw);
            _db = Object.assign(emptyDb(), parsed);
            ['users', 'tokens', 'student_profiles', 'learning_goals', 'diagnostic_sessions',
                'knowledge_states', 'ability_states', 'ai_diagnosis_reports', 'learning_plans'].forEach(k => {
                if (!_db[k] || typeof _db[k] !== 'object') _db[k] = {};
            });
            ['answer_records', 'learning_tasks', 'behavior_events'].forEach(k => {
                if (!Array.isArray(_db[k])) _db[k] = [];
            });
        } else {
            _db = emptyDb();
            persist();
        }
    } catch (e) {
        console.error('[STORE] 读取失败，使用空库:', e.message);
        _db = emptyDb();
    }
    return _db;
}

function persist() {
    if (!_db) return;
    try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
        const tmp = DB_PATH + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(_db, null, 2), 'utf8');
        fs.renameSync(tmp, DB_PATH);
    } catch (e) {
        console.error('[STORE] 写入失败:', e.message);
    }
}

function db() { return load(); }
function save() { persist(); }

// ---------- 时间（服务器时区） ----------
function tzParts(d) {
    const date = d || new Date();
    const parts = {};
    try {
        new Intl.DateTimeFormat('en-CA', {
            timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        }).formatToParts(date).forEach(p => { parts[p.type] = p.value; });
    } catch (e) {
        parts.year = String(date.getFullYear());
        parts.month = String(date.getMonth() + 1).padStart(2, '0');
        parts.day = String(date.getDate()).padStart(2, '0');
        parts.hour = String(date.getHours()).padStart(2, '0');
        parts.minute = String(date.getMinutes()).padStart(2, '0');
        parts.second = String(date.getSeconds()).padStart(2, '0');
    }
    return parts;
}

// 日期键：YYYY-MM-DD（用户时区）
function todayKey(d) {
    const p = tzParts(d);
    return p.year + '-' + p.month + '-' + p.day;
}

// 中文日期：10月23日 周四
function todayLabelCN(d) {
    const date = d || new Date();
    const p = tzParts(date);
    let weekday = '';
    try {
        weekday = new Intl.DateTimeFormat('zh-CN', { timeZone: TZ, weekday: 'short' }).format(date).replace('星期', '周');
    } catch (e) {
        weekday = '周' + ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
    }
    return Number(p.month) + '月' + Number(p.day) + '日 ' + weekday;
}

// 本周一日期键
function startOfWeekKey(d) {
    const date = d ? new Date(d) : new Date();
    const p = tzParts(date);
    const local = new Date(Number(p.year), Number(p.month) - 1, Number(p.day));
    const dow = (local.getDay() + 6) % 7; // 周一=0
    local.setDate(local.getDate() - dow);
    return todayKey(local);
}

function weekDayKeys(d) {
    const start = startOfWeekKey(d);
    const parts = start.split('-').map(Number);
    const keys = [];
    for (let i = 0; i < 7; i++) {
        const dt = new Date(parts[0], parts[1] - 1, parts[2] + i);
        keys.push(todayKey(dt));
    }
    return keys;
}

function nowIso() { return new Date().toISOString(); }
function uid(prefix) {
    return (prefix || 'id') + '_' + crypto.randomBytes(6).toString('hex');
}

// ---------- 用户与登录态 ----------
function hashPassword(password, salt) {
    const s = salt || crypto.randomBytes(16).toString('hex');
    const h = crypto.scryptSync(String(password || ''), s, 32).toString('hex');
    return { salt: s, hash: h };
}

function verifyPassword(password, user) {
    if (!user) return false;
    if (!user.password_hash) return String(password || '') === String(user.password || '');
    const h = crypto.scryptSync(String(password || ''), user.password_salt, 32).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(user.password_hash, 'hex'));
}

function findUserByName(username) {
    return db().users[String(username || '').trim()] || null;
}
function findUserById(id) {
    return Object.values(db().users).find(u => u.id === id) || null;
}
function createUser(input) {
    const username = String(input.username || '').trim();
    const { salt, hash } = hashPassword(input.password);
    const user = {
        id: uid('u'),
        username,
        password_salt: salt,
        password_hash: hash,
        name: input.name || username,
        grade: input.grade || '高三',
        province: input.province || '',
        phone: input.phone || '',
        openid: input.openid || '',
        role: 'student',
        created_at: nowIso()
    };
    db().users[username] = user;
    save();
    return user;
}
function issueToken(userId) {
    const token = 'tk_' + crypto.randomBytes(18).toString('hex');
    db().tokens[token] = {
        user_id: userId,
        created_at: nowIso(),
        expires_at: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
    };
    save();
    return token;
}
function revokeToken(token) {
    if (db().tokens[token]) { delete db().tokens[token]; save(); }
}
function userByToken(token) {
    const rec = db().tokens[token];
    if (!rec) return null;
    if (rec.expires_at && new Date(rec.expires_at).getTime() < Date.now()) {
        delete db().tokens[token]; save();
        return null;
    }
    return findUserById(rec.user_id);
}
function publicUser(u) {
    if (!u) return null;
    return {
        id: u.id, username: u.username, name: u.name, grade: u.grade,
        province: u.province, role: u.role, created_at: u.created_at
    };
}

// ---------- 学生档案 / 目标 ----------
function getProfile(userId) { return db().student_profiles[userId] || null; }
function saveProfile(userId, patch) {
    const cur = getProfile(userId) || { user_id: userId, created_at: nowIso() };
    const next = Object.assign({}, cur, patch, { user_id: userId, updated_at: nowIso() });
    db().student_profiles[userId] = next;
    save();
    return next;
}
function getGoal(userId) { return db().learning_goals[userId] || null; }
function saveGoal(userId, patch) {
    const cur = getGoal(userId) || { user_id: userId, created_at: nowIso(), status: 'active' };
    const next = Object.assign({}, cur, patch, { user_id: userId, updated_at: nowIso() });
    db().learning_goals[userId] = next;
    save();
    return next;
}

// ---------- 行为事件 ----------
function addBehaviorEvent(userId, type, payload) {
    const ev = {
        id: uid('ev'),
        user_id: userId,
        type,
        payload: payload || {},
        occurred_at: nowIso(),
        date_key: todayKey()
    };
    db().behavior_events.push(ev);
    if (db().behavior_events.length > 20000) db().behavior_events.splice(0, 5000);
    save();
    return ev;
}

module.exports = {
    TZ, DB_PATH,
    db, save, load,
    nowIso, uid,
    todayKey, todayLabelCN, startOfWeekKey, weekDayKeys,
    findUserByName, findUserById, createUser, issueToken, revokeToken, userByToken,
    verifyPassword, hashPassword, publicUser,
    getProfile, saveProfile, getGoal, saveGoal,
    addBehaviorEvent
};
