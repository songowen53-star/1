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

// ---------- AI学情诊断题库（34题/9科，数据源：backend/data/diagnostic-bank.json） ----------
const DIAGNOSTIC_BANK = require('./data/diagnostic-bank.json').questions;

const KP_META = {};
DIAGNOSTIC_BANK.forEach(q => {
    KP_META[q.knowledge_point_id] = {
        id: q.knowledge_point_id, subject: q.subject, name: q.knowledge_point, difficulty: q.difficulty
    };
});

function round2(v) { return Math.round(v * 100) / 100; }

// ---------- 诊断结果计算 ----------
// 从 goal.subjects 中提取选科名称数组（兼容字符串数组和 {name,target} 对象数组）
function extractSubjectNames(subjects) {
    if (!Array.isArray(subjects) || !subjects.length) return null;
    const names = subjects.map(s => (typeof s === 'string' ? s : (s && s.name) || '')).filter(Boolean);
    return names.length ? names : null;
}

function computeStates(userId, session, subjectNames) {
    // 限定只统计用户选考的科目，避免 9 科累加超过 750
    const validSubjects = (subjectNames && subjectNames.length) ? subjectNames : DEFAULT_GAOKAO_SUBJECTS;
    const db = store.db();
    const records = db.answer_records.filter(r => r.user_id === userId && r.session_id === session.session_id);

    // 按知识点聚合
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
        // 掌握度：正确率为主，难度做轻微加权
        const diffWeight = 1 - Math.min(0.2, (meta.difficulty - 3) * 0.05);
        const mastery = round2(Math.max(0, Math.min(1, accuracy * diffWeight)));
        return {
            user_id: userId,
            knowledge_point_id: id,
            knowledge_point: meta.name,
            subject: meta.subject,
            mastery,
            accuracy: round2(accuracy),
            attempts: agg.total,
            correct: agg.correct,
            updated_at: store.nowIso()
        };
    }).sort((a, b) => a.mastery - b.mastery);

    db.knowledge_states[userId] = knowledgeStates;

    // 能力状态：按学科聚合（仅用户选考科目）
    const abilityStates = validSubjects.map(subject => {
        const meta = SUBJECT_META[subject];
        if (!meta) return null;
        const ks = knowledgeStates.filter(k => k.subject === subject);
        if (!ks.length) return null;
        const total = ks.reduce((s, k) => s + k.attempts, 0);
        const correct = ks.reduce((s, k) => s + k.correct, 0);
        const accuracy = total ? correct / total : 0;
        const mastery = ks.reduce((s, k) => s + k.mastery, 0) / ks.length;
        const estimated = Math.round(meta.full_score * (0.4 + 0.55 * mastery));
        let level = '基础';
        if (mastery >= 0.8) level = '优势';
        else if (mastery >= 0.6) level = '进阶';
        return {
            user_id: userId,
            subject,
            color: meta.color,
            icon: meta.icon,
            full_score: meta.full_score,
            attempts: total,
            correct,
            accuracy: round2(accuracy),
            mastery: round2(mastery),
            estimated_score: estimated,
            level,
            updated_at: store.nowIso()
        };
    }).filter(Boolean);

    db.ability_states[userId] = abilityStates;
    store.save();

    const totalQ = records.length;
    const totalCorrect = records.filter(r => r.is_correct).length;
    const accuracy = totalQ ? totalCorrect / totalQ : 0;
    // 只累加选考科目估分，并硬上限到 750
    const estimatedScore = Math.min(
        abilityStates.reduce((s, a) => s + a.estimated_score, 0),
        TOTAL_FULL_SCORE
    );

    return { knowledgeStates, abilityStates, totalQ, totalCorrect, accuracy, estimatedScore };
}

function buildReport(userId, session) {
    const goal = store.getGoal(userId) || {};
    const subjectNames = extractSubjectNames(goal.subjects);
    const { knowledgeStates, abilityStates, totalQ, totalCorrect, accuracy, estimatedScore } = computeStates(userId, session, subjectNames);
    const targetScore = Number(goal.target_score) || 600;

    const selSubjects = subjectNames || DEFAULT_GAOKAO_SUBJECTS;
    const weak = knowledgeStates.filter(k => k.mastery < 0.6 && selSubjects.indexOf(k.subject) !== -1).slice(0, 5);
    const strong = knowledgeStates.filter(k => k.mastery >= 0.75 && selSubjects.indexOf(k.subject) !== -1);

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
        report_id: store.uid('rep'),
        user_id: userId,
        session_id: session.session_id,
        created_at: store.nowIso(),
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
        strengths: strong.map(w => ({
            subject: w.subject, knowledge_point: w.knowledge_point, mastery: w.mastery
        })),
        ability_profile: abilityStates.map(a => ({
            subject: a.subject, level: a.level, mastery: a.mastery,
            accuracy: a.accuracy, estimated_score: a.estimated_score, full_score: a.full_score
        })),
        paragraphs
    };

    store.db().ai_diagnosis_reports[userId] = report;
    store.save();
    return report;
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
        // 已有进行中的会话则复用
        let session = Object.values(db.diagnostic_sessions)
            .find(s => s.user_id === userId && s.status === 'in_progress');
        if (!session) {
            session = {
                session_id: store.uid('ds'),
                user_id: userId,
                status: 'in_progress',
                question_ids: DIAGNOSTIC_BANK.map(q => q.id),
                started_at: store.nowIso(),
                submitted_at: null,
                date_key: store.todayKey()
            };
            db.diagnostic_sessions[session.session_id] = session;
            store.save();
            store.addBehaviorEvent(userId, 'diagnostic_started', { session_id: session.session_id });
        }
        const answered = db.answer_records
            .filter(r => r.user_id === userId && r.session_id === session.session_id)
            .reduce((m, r) => { m[r.question_id] = r; return m; }, {});

        res.json(ok({
            session_id: session.session_id,
            status: session.status,
            started_at: session.started_at,
            total_questions: DIAGNOSTIC_BANK.length,
            questions: DIAGNOSTIC_BANK.map(q => ({
                id: q.id, subject: q.subject, knowledge_point_id: q.knowledge_point_id,
                knowledge_point: q.knowledge_point, difficulty: q.difficulty,
                stem: q.stem, options: q.options,
                answered: !!answered[q.id],
                answer_index: answered[q.id] ? answered[q.id].answer_index : null,
                is_correct: answered[q.id] ? !!answered[q.id].is_correct : null
            }))
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
        const q = DIAGNOSTIC_BANK.find(x => x.id === question_id);
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

        res.json(ok({
            session_id: s.session_id,
            status: 'completed',
            report,
            plan,
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
