// ============================================================
// 学生智能档案 API
// 诊断 → 答题记录 → 知识掌握度 → 能力状态 → AI报告 → 学习计划 → 今日任务
// 所有数据按 user_id 隔离，日期按服务器时区计算
// ============================================================
const store = require('./learning-store');

// ---------- 学科元数据 ----------
const SUBJECT_META = {
    '语文': { color: 'red', icon: 'fa-book', full_score: 150, paper: '语文' },
    '数学': { color: 'blue', icon: 'fa-square-root-variable', full_score: 150, paper: '数学' },
    '英语': { color: 'green', icon: 'fa-language', full_score: 150, paper: '英语' },
    '物理': { color: 'purple', icon: 'fa-atom', full_score: 100, paper: '物理' },
    '化学': { color: 'orange', icon: 'fa-flask', full_score: 100, paper: '化学' },
    '生物': { color: 'cyan', icon: 'fa-dna', full_score: 100, paper: '生物' },
    '政治': { color: 'red', icon: 'fa-landmark', full_score: 100, paper: '政治' },
    '历史': { color: 'amber', icon: 'fa-ribbon', full_score: 100, paper: '历史' },
    '地理': { color: 'teal', icon: 'fa-globe-asia', full_score: 100, paper: '地理' }
};

// 新高考 3+1+2 满分 750：语数外必选(各150) + 物理/历史二选一(100) + 四选二(各100)
const TOTAL_FULL_SCORE = 750;
// 默认选科组合（用户未设置时使用）：语数英 + 物理 + 化学 + 生物 = 750
const DEFAULT_GAOKAO_SUBJECTS = ['语文', '数学', '英语', '物理', '化学', '生物'];

// ---------- AI学情诊断题库 & 命题蓝图 ----------
const fs = require('fs');
const path = require('path');
const DIAGNOSTIC_BANK = require('./data/diagnostic-bank.json').questions;
const BLUEPRINT = require('./data/diagnostic-blueprint.json');

const BANK_MAP = {};
DIAGNOSTIC_BANK.forEach(q => { BANK_MAP[q.id] = q; });

// 题目参数校准文件：真实作答样本（n≥8）会覆盖先验 p 值
const CALIBRATION_FILE = path.join(__dirname, 'data', 'diagnostic-calibration.json');
try {
    if (fs.existsSync(CALIBRATION_FILE)) {
        const cal = JSON.parse(fs.readFileSync(CALIBRATION_FILE, 'utf8'));
        Object.keys(cal.items || {}).forEach(id => {
            if (!BANK_MAP[id]) return;
            BANK_MAP[id].p_value = cal.items[id].p_value;
            BANK_MAP[id].param_source = 'empirical';
            BANK_MAP[id].calibrated_n = cal.items[id].n;
        });
    }
} catch (e) { console.warn('[diagnostic] 校准文件读取失败', e.message); }

const KP_META = {};
DIAGNOSTIC_BANK.forEach(q => {
    KP_META[q.knowledge_point_id] = {
        id: q.knowledge_point_id, subject: q.subject, name: q.knowledge_point,
        difficulty: q.difficulty, domain: q.domain
    };
});

function round2(v) { return Math.round(v * 100) / 100; }
function round3(v) { return Math.round(v * 1000) / 1000; }
function hashStr(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
    return h;
}

// 难度分档：基础/中档/难（来自蓝图定义）
function bandOf(q) {
    const d = Number(q.difficulty);
    const bands = BLUEPRINT.difficulty_bands || {};
    for (const name of Object.keys(bands)) {
        if ((bands[name].levels || []).indexOf(d) !== -1) return name;
    }
    return '中档';
}

// ---------- 诊断结果计算 ----------
// 从 goal.subjects 中提取选科名称数组（兼容字符串数组和 {name,target} 对象数组）
function extractSubjectNames(subjects) {
    if (!Array.isArray(subjects) || !subjects.length) return null;
    const names = subjects.map(s => (typeof s === 'string' ? s : (s && s.name) || '')).filter(Boolean);
    return names.length ? names : null;
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

// 蓝图难度目标：按配额把 100% 拆到各难度档，最大余数法保证总和等于配额
function bandTargets(quota) {
    const bands = BLUEPRINT.difficulty_bands || {};
    const names = Object.keys(bands);
    const rows = names.map(name => {
        const x = quota * (Number(bands[name].target) || 0);
        return { name, x, base: Math.floor(x), frac: x - Math.floor(x) };
    });
    let remain = quota - rows.reduce((s, r) => s + r.base, 0);
    rows.slice().sort((a, b) => b.frac - a.frac).forEach(r => {
        if (remain > 0) {
            const row = rows.find(x => x.name === r.name);
            row.base++;
            remain--;
        }
    });
    const out = {};
    rows.forEach(r => { out[r.name] = r.base; });
    return out;
}

// 按命题蓝图 + 选科分层组卷（同一天同一学生结果稳定，便于断点续答）
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
        // 先按蓝图目标抽题：难 → 基础 → 中档（优先保障高难题配额）
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
        // 展示顺序仍按 基础 → 中档 → 难，由易到难
        const chosen = [];
        ['基础', '中档', '难'].forEach(band => {
            (byBand[band] || []).forEach(q => { if (chosen.length < quota) chosen.push(q); });
        });
        // 某档题不足时，用 p 值最接近中位难度的题补足配额
        if (chosen.length < quota) {
            pool.filter(q => !used[q.id])
                .sort((a, b) => Math.abs(a.p_value - 0.6) - Math.abs(b.p_value - 0.6))
                .forEach(q => { if (chosen.length < quota) { chosen.push(q); used[q.id] = true; } });
        }
        // 强制领域覆盖：每个必考领域至少 1 题（等量替换，不改变题量与难度结构）
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
            // 只替换“所在领域题数 > 1”的题目，避免拆掉已覆盖的领域
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
        // 展示顺序：基础 → 中档 → 难
        const bandOrder = ['基础', '中档', '难'];
        chosen.sort((a, b) => bandOrder.indexOf(bandOf(a)) - bandOrder.indexOf(bandOf(b)) || a.id.localeCompare(b.id));
        quotas[subject] = chosen.length;
        chosen.forEach(q => picked.push(q));
    });
    return { questions: picked, quotas, selection: sel };
}

// 猜测校正后的能力估计：4 选 1 盲猜期望正确率 1/k
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
// KR-20：二分题内部一致性信度（必须基于考生群体 × 同题矩阵，单人作答无法估计）
// 取与本次组卷重叠 ≥20% 的考生，保留所有人都作答过的公共题，考生数 ≥3 且公共题 ≥10 才计算
function kr20(session) {
    const db = store.db();
    const qids = session.question_ids || [];
    if (qids.length < 10) return null;
    const minOverlap = Math.max(10, Math.ceil(qids.length * 0.2));
    const byUser = {};
    db.answer_records.forEach(r => {
        if (qids.indexOf(r.question_id) === -1) return;
        if (!byUser[r.user_id]) byUser[r.user_id] = {};
        byUser[r.user_id][r.question_id] = r.is_correct ? 1 : 0;
    });
    const matrix = Object.keys(byUser)
        .map(u => byUser[u])
        .filter(m => Object.keys(m).length >= minOverlap);
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

function computeStates(userId, session, subjectNames) {
    const db = store.db();
    const records = db.answer_records.filter(r => r.user_id === userId && r.session_id === session.session_id);
    const items = records.map(r => {
        const q = BANK_MAP[r.question_id] || {};
        return {
            record: r,
            subject: r.subject || q.subject || '未知',
            knowledge_point_id: r.knowledge_point_id || q.knowledge_point_id || 'unknown',
            domain: q.domain || '未分类',
            ability: q.ability || '理解识记',
            p: Number(q.p_value) || 0.6,
            k: (q.options && q.options.length) || 4
        };
    });

    // 本次组卷实际涉及的科目（兼容旧版 34 题会话）
    const sessionSubjects = [];
    (session.question_ids || []).forEach(id => {
        const q = BANK_MAP[id];
        if (q && sessionSubjects.indexOf(q.subject) === -1) sessionSubjects.push(q.subject);
    });
    const validSubjects = sessionSubjects.length ? sessionSubjects
        : ((subjectNames && subjectNames.length) ? subjectNames : DEFAULT_GAOKAO_SUBJECTS);

    // ---- 知识点层（单题结论标低置信）----
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
        const theta = shrink(thetaOf(a.correct, a.n, a.k), a.n);
        return {
            user_id: userId,
            knowledge_point_id: id,
            knowledge_point: meta.name,
            subject: meta.subject,
            domain: meta.domain,
            mastery: round2(theta),
            accuracy: round2(a.correct / a.n),
            attempts: a.n,
            correct: a.correct,
            confidence: confidenceOf(a.n),
            updated_at: store.nowIso()
        };
    }).sort((a, b) => a.mastery - b.mastery);
    db.knowledge_states[userId] = knowledgeStates;

    // ---- 知识领域层（诊断结论主体，避免 1 题定生死）----
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

    // ---- 学科能力层 ----
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
            user_id: userId,
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
            updated_at: store.nowIso()
        };
    }).filter(Boolean);
    db.ability_states[userId] = abilityStates;
    store.save();

    const totalQ = records.length;
    const totalCorrect = records.filter(r => r.is_correct).length;
    const accuracy = totalQ ? totalCorrect / totalQ : 0;
    const correctedAccuracy = thetaOf(totalCorrect, totalQ, 4);
    const estimatedScore = Math.min(
        abilityStates.reduce((s, a) => s + a.estimated_score, 0),
        TOTAL_FULL_SCORE
    );
    const reliability = kr20(session);
    const reliabilityValue = reliability ? reliability.value : null;
    let overallConfidence = '低';
    if (totalQ >= 60 && (reliabilityValue === null || reliabilityValue >= 0.8)) overallConfidence = '高';
    else if (totalQ >= 30) overallConfidence = '中';
    if (reliabilityValue !== null && reliabilityValue < 0.6) overallConfidence = '低';

    return {
        knowledgeStates, domainStates, abilityStates,
        totalQ, totalCorrect, accuracy, correctedAccuracy,
        estimatedScore,
        reliability: reliabilityValue,
        reliabilityMeta: reliability,
        overallConfidence, sessionSubjects: validSubjects
    };
}

// 组卷覆盖度：题量、知识领域、难度配比、信度
function buildCoverage(session, st) {
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
    if (st.reliability !== null && st.reliability < 0.8) gaps.push('整卷信度 KR-20=' + st.reliability + '，低于 0.8');
    return {
        blueprint_version: BLUEPRINT.version,
        total_planned: totalPlanned,
        total_actual: totalActual,
        completeness: totalPlanned ? round2(totalActual / totalPlanned) : 0,
        difficulty_distribution: bands,
        difficulty_compliance: round3(Math.max(0, 1 - delta / 2)),
        reliability_kr20: st.reliability,
        confidence: st.overallConfidence,
        subjects,
        gaps
    };
}

function buildReport(userId, session) {
    const goal = store.getGoal(userId) || {};
    const subjectNames = extractSubjectNames(goal.subjects);
    const st = computeStates(userId, session, subjectNames);
    const targetScore = Number(goal.target_score) || 600;
    const selSubjects = st.sessionSubjects;
    const inScope = subject => selSubjects.indexOf(subject) !== -1;
    const minItems = BLUEPRINT.min_items_for_conclusion || 2;

    // 结论以"≥2 题的知识领域"为主，避免单题定性
    let weak = st.domainStates
        .filter(d => inScope(d.subject) && d.attempts >= minItems && d.mastery < 0.6)
        .slice(0, 5)
        .map(d => ({
            subject: d.subject, knowledge_point: d.domain, domain: d.domain,
            mastery: d.mastery, accuracy: d.accuracy, attempts: d.attempts, confidence: d.confidence
        }));
    if (!weak.length) {
        weak = st.knowledgeStates
            .filter(k => inScope(k.subject) && k.mastery < 0.6)
            .slice(0, 5)
            .map(k => ({
                subject: k.subject, knowledge_point: k.knowledge_point, domain: k.domain,
                mastery: k.mastery, accuracy: k.accuracy, attempts: k.attempts, confidence: k.confidence
            }));
    }
    const strong = st.domainStates
        .filter(d => inScope(d.subject) && d.attempts >= minItems && d.mastery >= 0.75)
        .slice(0, 5)
        .map(d => ({
            subject: d.subject, knowledge_point: d.domain,
            mastery: d.mastery, attempts: d.attempts, confidence: d.confidence
        }));

    const coverage = buildCoverage(session, st);
    // 总分置信区间：各科测量误差相互独立，方差按平方和合成（而非直接相加区间）
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
    paragraphs.push('诊断质量：信度 KR-20=' + (st.reliability === null ? '样本不足'
        : st.reliability + '（' + st.reliabilityMeta.examinees + ' 名考生 × ' + st.reliabilityMeta.items + ' 道公共题）')
        + '，整体置信度' + st.overallConfidence + '，蓝图完成度 ' + Math.round(coverage.completeness * 100) + '%。'
        + (coverage.gaps.length ? '局限：' + coverage.gaps.slice(0, 2).join('；') + '。' : ''));

    const report = {
        report_id: store.uid('rep'),
        user_id: userId,
        session_id: session.session_id,
        created_at: store.nowIso(),
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
            reliability_kr20: st.reliability,
            confidence: st.overallConfidence,
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

    store.db().ai_diagnosis_reports[userId] = report;
    store.save();
    return report;
}

// 用真实作答统计校准题目 p 值（样本 n≥8 才生效），并落盘
function calibrateItems() {
    const db = store.db();
    const agg = {};
    db.answer_records.forEach(r => {
        if (!BANK_MAP[r.question_id]) return;
        if (!agg[r.question_id]) agg[r.question_id] = { n: 0, correct: 0 };
        agg[r.question_id].n++;
        if (r.is_correct) agg[r.question_id].correct++;
    });
    const items = {};
    Object.keys(agg).forEach(id => {
        if (agg[id].n >= 8) items[id] = { p_value: round3(agg[id].correct / agg[id].n), n: agg[id].n };
    });
    try {
        fs.writeFileSync(CALIBRATION_FILE, JSON.stringify({
            updated_at: store.nowIso(), min_n: 8, items
        }, null, 2) + '\n');
    } catch (e) { console.warn('[diagnostic] 校准写入失败', e.message); }
    Object.keys(items).forEach(id => {
        BANK_MAP[id].p_value = items[id].p_value;
        BANK_MAP[id].param_source = 'empirical';
        BANK_MAP[id].calibrated_n = items[id].n;
    });
    return { empirical_items: Object.keys(items).length, min_n: 8 };
}

function buildPlan(userId, report) {
    const db = store.db();
    const weak = (report.weak_points || []).slice(0, 4);
    const list = weak.length ? weak : (report.ability_profile || []).slice(0, 3).map(a => ({
        subject: a.subject, knowledge_point: '基础巩固', mastery: a.mastery
    }));

    const planId = store.uid('plan');
    const dateKey = store.todayKey();
    const tasks = list.map((w, i) => {
        const meta = SUBJECT_META[w.subject] || SUBJECT_META['数学'];
        const planned = 30 + (i % 2) * 10;
        return {
            id: store.uid('task'),
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
            created_at: store.nowIso(),
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
        created_at: store.nowIso(),
        plan_date: dateKey,
        total_minutes: tasks.reduce((s, t) => s + t.planned_minutes, 0),
        task_count: tasks.length,
        status: 'active',
        tasks
    };

    db.learning_plans[userId] = plan;
    db.learning_tasks = db.learning_tasks.filter(t => !(t.user_id === userId && t.planned_date === dateKey));
    db.learning_tasks.push.apply(db.learning_tasks, tasks);
    store.save();
    return plan;
}

function getTodayTasks(userId) {
    const db = store.db();
    const dateKey = store.todayKey();
    let tasks = db.learning_tasks.filter(t => t.user_id === userId && t.planned_date === dateKey);
    // 若当日无任务但存在更早未完成任务，展示为补做任务
    if (!tasks.length) {
        tasks = db.learning_tasks.filter(t => t.user_id === userId && t.status !== 'done').slice(-4);
    }
    const done = tasks.filter(t => t.status === 'done');
    const total = tasks.length;
    return {
        date: store.todayLabelCN(),
        date_key: dateKey,
        tasks,
        done_count: done.length,
        total_count: total,
        completion_rate: total ? Math.round(done.length / total * 100) : 0,
        planned_minutes: tasks.reduce((s, t) => s + (t.planned_minutes || parseInt(t.time) || 0), 0),
        spent_minutes: done.reduce((s, t) => s + (t.duration_min || 0), 0)
    };
}

module.exports = function registerStudentApi(app, ctx) {
    const ok = ctx.ok;
    const fail = (res, status, msg) => res.status(status).json({ code: 1, msg });

    function reqUser(req) {
        const auth = req.headers.authorization || '';
        const m = auth.match(/^Bearer\s+(.+)$/);
        if (!m) return null;
        return store.userByToken(m[1]);
    }
    function requireUser(req, res, next) {
        const u = reqUser(req);
        if (!u) return res.status(401).json({ code: 1, msg: '未登录或登录已过期' });
        req.user = u;
        next();
    }

    // ===== 学生档案 =====
    app.get('/api/student/profile', requireUser, (req, res) => {
        res.json(ok(store.getProfile(req.user.id)));
    });

    app.put('/api/student/profile', requireUser, (req, res) => {
        const b = req.body || {};
        const patch = {};
        ['name', 'grade', 'province', 'exam_year', 'school', 'gender'].forEach(k => {
            if (b[k] !== undefined) patch[k] = b[k];
        });
        const profile = store.saveProfile(req.user.id, patch);
        store.addBehaviorEvent(req.user.id, 'profile_updated', patch);
        res.json(ok(profile));
    });

    // ===== 学习目标 =====
    app.get('/api/student/goal', requireUser, (req, res) => {
        res.json(ok(store.getGoal(req.user.id)));
    });

    app.put('/api/student/goal', requireUser, (req, res) => {
        const b = req.body || {};
        const patch = {};
        ['target_score', 'target_school', 'exam_year', 'daily_minutes', 'subjects'].forEach(k => {
            if (b[k] !== undefined) patch[k] = b[k];
        });
        if (patch.target_score !== undefined) patch.target_score = parseInt(patch.target_score) || 600;
        if (patch.daily_minutes !== undefined) patch.daily_minutes = parseInt(patch.daily_minutes) || 120;
        const goal = store.saveGoal(req.user.id, patch);
        const profile = store.saveProfile(req.user.id, {
            target_score: goal.target_score,
            target_school: goal.target_school || (store.getProfile(req.user.id) || {}).target_school || ''
        });
        store.addBehaviorEvent(req.user.id, 'goal_set', patch);
        res.json(ok({ goal, profile }));
    });

    // ===== AI学情诊断 =====
    app.post('/api/diagnostic/start', requireUser, (req, res) => {
        const db = store.db();
        const userId = req.user.id;
        // 已有进行中的会话则复用（保留断点续答）
        let session = Object.values(db.diagnostic_sessions)
            .find(s => s.user_id === userId && s.status === 'in_progress');
        if (!session) {
            const goal = store.getGoal(userId) || {};
            const sel = selectQuestions(extractSubjectNames(goal.subjects), userId + '|' + store.todayKey());
            session = {
                session_id: store.uid('ds'),
                user_id: userId,
                status: 'in_progress',
                question_ids: sel.questions.map(q => q.id),
                subject_quotas: sel.quotas,
                selection: {
                    first_choice: sel.selection.firstChoice,
                    electives: sel.selection.electives,
                    subjects: sel.selection.subjects
                },
                blueprint_version: BLUEPRINT.version,
                started_at: store.nowIso(),
                submitted_at: null,
                date_key: store.todayKey()
            };
            db.diagnostic_sessions[session.session_id] = session;
            store.save();
            store.addBehaviorEvent(userId, 'diagnostic_started', {
                session_id: session.session_id, total: session.question_ids.length
            });
        }
        const answered = db.answer_records
            .filter(r => r.user_id === userId && r.session_id === session.session_id)
            .reduce((m, r) => { m[r.question_id] = r; return m; }, {});
        const ids = session.question_ids || [];
        const subjectCounts = {};
        ids.forEach(id => {
            const q = BANK_MAP[id];
            if (q) subjectCounts[q.subject] = (subjectCounts[q.subject] || 0) + 1;
        });

        res.json(ok({
            session_id: session.session_id,
            status: session.status,
            started_at: session.started_at,
            total_questions: ids.length,
            subject_counts: subjectCounts,
            blueprint: {
                version: BLUEPRINT.version,
                subject_quotas: session.subject_quotas || {},
                first_choice: session.selection ? session.selection.first_choice : null,
                electives: session.selection ? session.selection.electives : []
            },
            questions: ids.map(id => {
                const q = BANK_MAP[id];
                if (!q) return null;
                return {
                    id: q.id, subject: q.subject, knowledge_point_id: q.knowledge_point_id,
                    knowledge_point: q.knowledge_point, difficulty: q.difficulty,
                    domain: q.domain, ability: q.ability,
                    stem: q.stem, options: q.options,
                    answered: !!answered[q.id],
                    answer_index: answered[q.id] ? answered[q.id].answer_index : null,
                    is_correct: answered[q.id] ? !!answered[q.id].is_correct : null
                };
            }).filter(Boolean)
        }));
    });

    app.get('/api/diagnostic/latest', requireUser, (req, res) => {
        const db = store.db();
        const userId = req.user.id;
        const sessions = Object.values(db.diagnostic_sessions)
            .filter(s => s.user_id === userId)
            .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
        const latest = sessions[0] || null;
        res.json(ok({
            status: latest ? latest.status : 'none',
            session: latest,
            report: db.ai_diagnosis_reports[userId] || null,
            plan: db.learning_plans[userId] || null
        }));
    });

    app.get('/api/diagnostic/:sessionId', requireUser, (req, res) => {
        const db = store.db();
        const s = db.diagnostic_sessions[req.params.sessionId];
        if (!s || s.user_id !== req.user.id) return fail(res, 404, '诊断会话不存在');
        const records = db.answer_records.filter(r => r.user_id === req.user.id && r.session_id === s.session_id);
        res.json(ok({
            session: s,
            answers: records.map(r => ({
                question_id: r.question_id, answer_index: r.answer_index,
                is_correct: r.is_correct, answered_at: r.answered_at
            })),
            total_questions: (s.question_ids || []).length
        }));
    });

    // 提交单题作答：保存答题行为
    app.post('/api/diagnostic/:sessionId/answer', requireUser, (req, res) => {
        const db = store.db();
        const s = db.diagnostic_sessions[req.params.sessionId];
        if (!s || s.user_id !== req.user.id) return fail(res, 404, '诊断会话不存在');
        if (s.status !== 'in_progress') return fail(res, 400, '诊断已提交，不能继续作答');

        const { question_id, answer_index, duration_sec } = req.body || {};
        if ((s.question_ids || []).indexOf(question_id) === -1) return fail(res, 400, '该题不属于本次诊断');
        const q = BANK_MAP[question_id];
        if (!q) return fail(res, 400, '题目不存在');
        const idx = Number(answer_index);
        if (!(idx >= 0 && idx < q.options.length)) return fail(res, 400, '答案无效');

        const isCorrect = idx === q.answer_index;
        const existing = db.answer_records.find(r =>
            r.user_id === req.user.id && r.session_id === s.session_id && r.question_id === question_id);

        const rec = existing || {
            id: store.uid('ans'),
            user_id: req.user.id,
            session_id: s.session_id,
            question_id,
            subject: q.subject,
            knowledge_point_id: q.knowledge_point_id,
            knowledge_point: q.knowledge_point,
            difficulty: q.difficulty,
            answered_at: store.nowIso(),
            date_key: store.todayKey()
        };
        rec.answer_index = idx;
        rec.is_correct = isCorrect;
        rec.duration_sec = parseInt(duration_sec) || 0;
        rec.updated_at = store.nowIso();
        if (!existing) db.answer_records.push(rec);
        store.save();
        store.addBehaviorEvent(req.user.id, 'diagnostic_answered', {
            session_id: s.session_id, question_id, is_correct: isCorrect, duration_sec: rec.duration_sec
        });

        res.json(ok({
            question_id,
            is_correct: isCorrect,
            answer_index: q.answer_index,
            analysis: q.analysis,
            saved: true
        }));
    });

    // 提交诊断：计算掌握度/能力/报告/计划
    app.post('/api/diagnostic/:sessionId/submit', requireUser, (req, res) => {
        const db = store.db();
        const s = db.diagnostic_sessions[req.params.sessionId];
        if (!s || s.user_id !== req.user.id) return fail(res, 404, '诊断会话不存在');

        const answers = db.answer_records.filter(r => r.user_id === req.user.id && r.session_id === s.session_id);
        if (!answers.length) return fail(res, 400, '请至少完成 1 道诊断题后再提交');

        s.status = 'completed';
        s.submitted_at = store.nowIso();
        store.save();

        const report = buildReport(req.user.id, s);
        const plan = buildPlan(req.user.id, report);
        store.saveProfile(req.user.id, {
            current_level: report.summary.estimated_score,
            diagnosis_completed_at: s.submitted_at,
            portrait_updated_at: store.nowIso()
        });
        store.addBehaviorEvent(req.user.id, 'diagnostic_completed', {
            session_id: s.session_id,
            report_id: report.report_id,
            plan_id: plan.plan_id
        });
        const calibration = calibrateItems();

        res.json(ok({
            session_id: s.session_id,
            status: 'completed',
            report,
            plan,
            calibration,
            knowledge_states: db.knowledge_states[req.user.id] || [],
            ability_states: db.ability_states[req.user.id] || []
        }));
    });

    // ===== 今日任务 =====
    app.get('/api/student/today-tasks', requireUser, (req, res) => {
        const data = getTodayTasks(req.user.id);
        const diagnosisDone = !!store.db().ai_diagnosis_reports[req.user.id];
        if (!data.tasks.length) {
            data.need_diagnosis = !diagnosisDone;
            data.message = diagnosisDone ? '今日暂无学习任务' : '完成AI学情诊断后自动生成学习计划';
        }
        res.json(ok(data));
    });

    // ===== 今日任务 + 答题记录（学习进度快照，供教练等模块使用）=====
    app.get('/api/student/today-progress', requireUser, (req, res) => {
        const db = store.db();
        const dateKey = store.todayKey();
        const taskData = getTodayTasks(req.user.id);

        const records = db.answer_records.filter(r =>
            r.user_id === req.user.id && r.date_key === dateKey);
        const correctList = records.filter(r => r.is_correct);
        const diagnostic = records.filter(r => String(r.session_id || '').indexOf('ds_') === 0);
        const practice = records.filter(r => String(r.session_id || '').indexOf('ds_') !== 0);

        const subjectMap = {};
        records.forEach(r => {
            const key = r.subject || '未分类';
            if (!subjectMap[key]) subjectMap[key] = { subject: key, total: 0, correct: 0 };
            subjectMap[key].total++;
            if (r.is_correct) subjectMap[key].correct++;
        });

        const recent = records.slice(-5).reverse().map(r => ({
            subject: r.subject || '',
            knowledge_point: r.knowledge_point || '',
            is_correct: !!r.is_correct,
            answered_at: r.answered_at || ''
        }));

        res.json(ok({
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
                total: records.length,
                correct: correctList.length,
                correct_rate: records.length ? Math.round(correctList.length / records.length * 100) : 0,
                diagnostic: diagnostic.length,
                practice: practice.length,
                duration_min: Math.round(records.reduce((s, r) => s + (Number(r.duration_sec) || 0), 0) / 60)
            },
            subjects: Object.values(subjectMap).map(s => ({
                subject: s.subject,
                total: s.total,
                correct: s.correct,
                correct_rate: s.total ? Math.round(s.correct / s.total * 100) : 0
            })),
            recent: recent
        }));
    });

    app.post('/api/student/tasks/:taskId/start', requireUser, (req, res) => {
        const db = store.db();
        const task = db.learning_tasks.find(t => t.id === req.params.taskId && t.user_id === req.user.id);
        if (!task) return fail(res, 404, '任务不存在');
        if (task.status === 'done') return fail(res, 400, '任务已完成');
        task.status = 'doing';
        task.started_at = store.nowIso();
        store.save();
        store.addBehaviorEvent(req.user.id, 'task_started', { task_id: task.id, subject: task.subject, point: task.point });
        res.json(ok(task));
    });

    app.post('/api/student/tasks/:taskId/complete', requireUser, (req, res) => {
        const db = store.db();
        const task = db.learning_tasks.find(t => t.id === req.params.taskId && t.user_id === req.user.id);
        if (!task) return fail(res, 404, '任务不存在');

        const b = req.body || {};
        let duration = parseInt(b.duration_min);
        if (!duration && task.started_at) {
            duration = Math.max(1, Math.round((Date.now() - new Date(task.started_at).getTime()) / 60000));
        }
        task.status = 'done';
        task.completed_at = store.nowIso();
        task.duration_min = duration || task.planned_minutes || 30;
        if (b.answered != null) task.answered = parseInt(b.answered) || 0;
        if (b.correct != null && task.answered) {
            task.correct_rate = Math.round((parseInt(b.correct) || 0) / Math.max(1, task.answered) * 100);
        }
        store.save();

        // 更新知识点掌握度（真实完成任务带来的小幅提升）
        const ks = db.knowledge_states[req.user.id] || [];
        const state = ks.find(k => k.knowledge_point === task.point || k.knowledge_point_id === task.knowledge_point_id);
        if (state) {
            const gain = (task.correct_rate != null ? task.correct_rate / 100 : 0.6) * 0.08;
            state.mastery = round2(Math.min(1, state.mastery + gain));
            state.attempts += (task.answered || task.questions_count || 0);
            state.correct += (b.correct != null ? parseInt(b.correct) || 0 : Math.round((task.answered || 0) * 0.6));
            state.updated_at = store.nowIso();
            store.save();
        }

        // 更新能力状态与画像
        const ability = (db.ability_states[req.user.id] || []).find(a => a.subject === task.subject);
        if (ability) {
            const related = ks.filter(k => k.subject === task.subject);
            ability.mastery = related.length ? round2(related.reduce((s, k) => s + k.mastery, 0) / related.length) : ability.mastery;
            ability.updated_at = store.nowIso();
            store.save();
        }

        const today = getTodayTasks(req.user.id);
        const profile = store.saveProfile(req.user.id, {
            last_active_at: store.nowIso(),
            studies_count: ((store.getProfile(req.user.id) || {}).studies_count || 0) + 1,
            portrait_updated_at: store.nowIso()
        });

        store.addBehaviorEvent(req.user.id, 'task_completed', {
            task_id: task.id, subject: task.subject, point: task.point,
            duration_min: task.duration_min, answered: task.answered || 0, correct_rate: task.correct_rate
        });

        res.json(ok({
            task,
            today_stats: today,
            knowledge_states: ks,
            ability_states: db.ability_states[req.user.id] || [],
            profile
        }));
    });

    // ===== 统一学生智能档案（首页唯一数据源） =====
    app.get('/api/student/intelligence-profile', requireUser, (req, res) => {
        const db = store.db();
        const userId = req.user.id;
        const profile = store.getProfile(userId);
        const goal = store.getGoal(userId);
        const report = db.ai_diagnosis_reports[userId] || null;
        const plan = db.learning_plans[userId] || null;
        const today = getTodayTasks(userId);
        const todayData = today;

        if (!todayData.tasks.length) {
            todayData.need_diagnosis = !report;
            todayData.message = report ? '今日暂无学习任务' : '完成AI学情诊断后自动生成学习计划';
        }

        // 周学习时长：仅统计真实完成任务
        const weekKeys = store.weekDayKeys();
        const weekTasks = db.learning_tasks.filter(t =>
            t.user_id === userId && t.status === 'done' && weekKeys.indexOf((t.completed_at || '').slice(0, 10)) >= 0);
        const weekHours = round2(weekTasks.reduce((s, t) => s + (t.duration_min || 0), 0) / 60);
        const dailyGoalMin = Number(goal && goal.daily_minutes) || 120;
        const todayMinutes = todayData.spent_minutes || 0;

        const status = report ? 'completed' : (Object.values(db.diagnostic_sessions).some(s => s.user_id === userId) ? 'in_progress' : 'none');

        const weakPoints = (db.knowledge_states[userId] || [])
            .filter(k => k.mastery < 0.6)
            .sort((a, b) => a.mastery - b.mastery)
            .slice(0, 5)
            .map(k => ({
                subject: k.subject, knowledge_point: k.knowledge_point,
                mastery: k.mastery, accuracy: k.accuracy, attempts: k.attempts
            }));

        // 模考预测：仅使用真实已有数据，不生成虚假排名/置信度
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

        res.json(ok({
            user_id: userId,
            server_time: store.nowIso(),
            timezone: store.TZ,
            today: store.todayKey(),
            today_label: store.todayLabelCN(),
            user: {
                user_id: userId,
                name: profile ? profile.name : req.user.name,
                grade: (profile && profile.grade) || req.user.grade || '',
                province: (profile && profile.province) || req.user.province || ''
            },
            profile,
            goal,
            diagnosis: {
                status,
                completed: !!report,
                session_id: Object.values(db.diagnostic_sessions)
                    .filter(s => s.user_id === userId)
                    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
                    .map(s => s.session_id)[0] || null,
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
            ability_profile: db.ability_states[userId] || [],
            knowledge_states: db.knowledge_states[userId] || [],
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
                today_minutes: todayMinutes,
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
    });

    // ===== 学生画像 =====
    app.get('/api/student/portrait', requireUser, (req, res) => {
        const db = store.db();
        const userId = req.user.id;
        res.json(ok({
            user_id: userId,
            profile: store.getProfile(userId),
            goal: store.getGoal(userId),
            knowledge_states: db.knowledge_states[userId] || [],
            ability_states: db.ability_states[userId] || [],
            report: db.ai_diagnosis_reports[userId] || null,
            updated_at: store.nowIso()
        }));
    });

    // ===== 行为事件 =====
    app.post('/api/behavior/events', requireUser, (req, res) => {
        const b = req.body || {};
        if (!b.type) return fail(res, 400, '缺少事件类型');
        const ev = store.addBehaviorEvent(req.user.id, b.type, b.payload || {});
        res.json(ok(ev));
    });

    app.get('/api/behavior/events', requireUser, (req, res) => {
        const limit = Math.min(200, parseInt(req.query.limit) || 50);
        const list = store.db().behavior_events
            .filter(e => e.user_id === req.user.id)
            .slice(-limit)
            .reverse();
        res.json(ok(list));
    });

    // 供 server.js 复用
    app.locals.studentHelpers = {
        reqUser, getTodayTasks, DIAGNOSTIC_BANK, SUBJECT_META, round2,
        computeStates, buildReport, buildPlan
    };
};
