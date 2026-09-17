// ========== 统一 Event API（行为事件层） ==========
// 学生在 APP 内的所有行为（答题 / AI 对话 / 学习 / 收藏 / 浏览）都先汇入此层，
// 再由"数据处理服务"分发到答题库 / 学习行为库 / AI 数据库。
// 这是数据飞轮的入口：行为 → 事件 → 处理 → 各业务库 → AI 分析 → 个性化推荐 → 学生
const express = require('express');
const router = express.Router();
const db = require('../db');

// 支持的事件类型
const VALID_EVENTS = [
    'answer',           // 答题
    'learning',         // 学习行为（时长 / 题量）
    'ai_chat',          // AI 对话
    'favorite',         // 收藏
    'view',             // 页面浏览
    'practice',        // 真题演练
    'mock_exam',        // 模考
    'photo_solve',     // 拍照搜题
    'review',           // 复盘错题
    'plan_complete'     // 学习计划完成
];

// ========== 数据处理服务（核心：事件分发到各业务库） ==========
function dispatchEvent(event) {
    const dispatched = { learning: false, answer: false, ai: false, favorite: false };

    try {
        // ① 答题事件 → answer_records 表
        if (event.type === 'answer' && event.payload.question_id) {
            const q = db.findById('questions', event.payload.question_id);
            if (q) {
                db.insert('answer_records', {
                    user_id: event.user_id,
                    question_id: q.id,
                    knowledge_point_id: q.knowledge_point_id || null,
                    subject: q.subject,
                    type: q.type || '选择题',
                    user_answer: event.payload.user_answer || '',
                    correct_answer: q.answer || '',
                    is_correct: !!event.payload.is_correct,
                    time_cost_sec: event.payload.time_cost_sec || 0,
                    source: event.payload.source || 'practice'
                });
                dispatched.answer = true;

                // 数据飞轮：答题后自动更新对应知识点的掌握度
                updateKnowledgeMastery(event.user_id, q.knowledge_point_id, q.subject, !!event.payload.is_correct);
            }
        }

        // ② 学习行为事件 → learning_records 表
        if (event.type === 'learning') {
            db.insert('learning_records', {
                user_id: event.user_id,
                date: event.payload.date || new Date().toISOString().slice(0, 10),
                subject: event.payload.subject || '通用',
                knowledge_point_id: event.payload.knowledge_point_id || null,
                duration_min: event.payload.duration_min || 0,
                questions_count: event.payload.questions_count || 0,
                correct_count: event.payload.correct_count || 0
            });
            dispatched.learning = true;
        }

        // ③ AI 对话事件 → coach_history / qa_history 表
        if (event.type === 'ai_chat') {
            const table = event.payload.role === 'coach' ? 'coach_history' : 'qa_history';
            db.insert(table, {
                user_id: event.user_id,
                message: event.payload.message || '',
                reply: event.payload.reply || '',
                role: event.payload.role || 'qa',
                model: event.payload.model || 'qwen3-72b',
                tokens: event.payload.tokens || 0,
                subject: event.payload.subject || '通用',
                time: new Date().toISOString()
            });
            dispatched.ai = true;
        }

        // ④ 收藏事件 → favorites 表
        if (event.type === 'favorite' && event.payload.target_id) {
            const existing = db.find('favorites', f =>
                f.user_id === event.user_id &&
                f.type === (event.payload.target_type || 'question') &&
                f.target_id === event.payload.target_id
            );
            if (existing.length === 0) {
                db.insert('favorites', {
                    user_id: event.user_id,
                    type: event.payload.target_type || 'question',
                    target_id: event.payload.target_id,
                    subject: event.payload.subject || '通用',
                    note: event.payload.note || ''
                });
                dispatched.favorite = true;
            }
        }
    } catch (e) {
        console.error('[Event API dispatch error]', e.message);
    }

    return dispatched;
}

// ========== 数据飞轮核心：根据答题自动更新知识点掌握度 ==========
function updateKnowledgeMastery(userId, knowledgePointId, subject, isCorrect) {
    if (!knowledgePointId) return;

    const kp = db.findById('knowledge_points', knowledgePointId);
    if (!kp) return;

    // 取该知识点的所有答题记录（仅当前用户）
    const records = db.find('answer_records', r =>
        r.user_id === userId && r.knowledge_point_id === knowledgePointId
    );

    if (records.length === 0) return;

    // 新掌握度 = 正确题数 / 总题数（滑动窗口）
    const correctCount = records.filter(r => r.is_correct).length;
    const totalCount = records.length;
    const newMastery = totalCount > 0 ? correctCount / totalCount : 0;

    // 增量更新：避免掌握度突然下降太多，引入平滑因子
    const oldMastery = kp.mastery_rate || 0;
    const smoothed = oldMastery * 0.3 + newMastery * 0.7;  // 70% 新数据 + 30% 历史

    db.update('knowledge_points', knowledgePointId, {
        mastery_rate: +smoothed.toFixed(3),
        last_practice_at: new Date().toISOString(),
        practice_count: (kp.practice_count || 0) + 1,
        last_is_correct: isCorrect
    });

    console.log(`[飞轮] ${userId} 答题 ${isCorrect ? '✓' : '✗'} → ${kp.name} 掌握度 ${oldMastery.toFixed(2)} → ${smoothed.toFixed(2)} (n=${totalCount})`);
}

// ========== POST /api/events（统一行为上报） ==========
// body: { user_id, type, payload, ts?, source? }
router.post('/', (req, res) => {
    const { user_id, type, payload, ts, source } = req.body || {};
    if (!user_id) return res.status(400).json({ code: 1, msg: 'user_id 必填' });
    if (!type) return res.status(400).json({ code: 1, msg: 'type 必填' });
    if (!VALID_EVENTS.includes(type)) {
        return res.status(400).json({ code: 1, msg: `type 必须为 ${VALID_EVENTS.join(' / ')}` });
    }

    // 写入统一事件流
    const event = db.insert('events', {
        user_id,
        type,
        payload: payload || {},
        source: source || 'app',
        ts: ts || new Date().toISOString(),
        processed: false
    });

    // 同步分发到业务库
    const dispatched = dispatchEvent(event);

    // 标记已处理
    db.update('events', event.id, { processed: true, processed_at: new Date().toISOString() });

    res.json({
        code: 0,
        data: {
            event_id: event.id,
            type,
            dispatched
        },
        msg: '事件已采集并分发'
    });
});

// ========== 批量上报 ==========
// POST /api/events/batch  body: { user_id, events: [{type, payload, ts}] }
router.post('/batch', (req, res) => {
    const { user_id, events } = req.body || {};
    if (!user_id) return res.status(400).json({ code: 1, msg: 'user_id 必填' });
    if (!Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ code: 1, msg: 'events 必填且非空数组' });
    }
    if (events.length > 500) {
        return res.status(400).json({ code: 1, msg: '单次最多 500 条事件' });
    }

    const results = events.map(ev => {
        if (!ev.type || !VALID_EVENTS.includes(ev.type)) {
            return { ok: false, reason: 'invalid type', type: ev.type };
        }
        const event = db.insert('events', {
            user_id,
            type: ev.type,
            payload: ev.payload || {},
            source: 'app_batch',
            ts: ev.ts || new Date().toISOString(),
            processed: false
        });
        const dispatched = dispatchEvent(event);
        db.update('events', event.id, { processed: true, processed_at: new Date().toISOString() });
        return { ok: true, event_id: event.id, type: ev.type, dispatched };
    });

    const ok = results.filter(r => r.ok).length;
    const fail = results.length - ok;
    res.json({ code: 0, data: { total: results.length, ok, fail, results }, msg: `批量上报完成 ${ok}/${results.length}` });
});

// ========== 健康检查：飞轮链路状态 ==========
// 注意：必须放在 /:user_id 之前，否则 health 会被当作 user_id 参数
router.get('/health', (req, res) => {
    const totalEvents = db.list('events').length;
    const totalAnswers = db.list('answer_records').length;
    const totalKps = db.list('knowledge_points').filter(k => k.last_practice_at).length;
    res.json({
        code: 0,
        data: {
            total_events: totalEvents,
            total_answers: totalAnswers,
            knowledge_points_with_practice: totalKps,
            flywheel_status: totalEvents > 0 && totalAnswers > 0 ? 'running' : 'idle'
        }
    });
});

// ========== 事件查询（用于数据飞轮可观测） ==========
// GET /api/events/:user_id?type=&days=7&page=1&size=20
router.get('/:user_id', (req, res) => {
    const { user_id } = req.params;
    const { type } = req.query;
    const days = Math.min(90, Math.max(1, parseInt(req.query.days) || 7));
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const size = Math.min(100, Math.max(1, parseInt(req.query.size) || 20));

    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString();

    let list = db.find('events', e =>
        e.user_id === user_id && new Date(e.ts || e.created_at) >= since
    );
    if (type) list = list.filter(e => e.type === type);

    list.sort((a, b) => new Date(b.ts || b.created_at) - new Date(a.ts || a.created_at));

    const total = list.length;
    const start = (page - 1) * size;
    const paged = list.slice(start, start + size);

    // 类型分布统计
    const typeStats = {};
    list.forEach(e => { typeStats[e.type] = (typeStats[e.type] || 0) + 1; });

    res.json({
        code: 0,
        data: paged,
        total,
        page,
        size,
        pages: Math.ceil(total / size),
        type_stats: typeStats
    });
});

// ========== 事件流统计（数据飞轮运行状态） ==========
// GET /api/events/:user_id/stats?days=30
router.get('/:user_id/stats', (req, res) => {
    const { user_id } = req.params;
    const days = Math.min(180, Math.max(1, parseInt(req.query.days) || 30));
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString();

    const events = db.find('events', e =>
        e.user_id === user_id && new Date(e.ts || e.created_at) >= since
    );

    // 按类型统计
    const byType = {};
    VALID_EVENTS.forEach(t => { byType[t] = 0; });
    events.forEach(e => { byType[e.type] = (byType[e.type] || 0) + 1; });

    // 按天分布
    const byDay = {};
    events.forEach(e => {
        const day = (e.ts || e.created_at).slice(0, 10);
        byDay[day] = (byDay[day] || 0) + 1;
    });

    // 数据飞轮完整性指标
    const answerCount = byType.answer || 0;
    const learningCount = byType.learning || 0;
    const aiCount = byType.ai_chat || 0;

    // 是否触发知识状态更新（答题 → 掌握度）
    const kps = db.find('knowledge_points', k => k.user_id === user_id || k.last_practice_at);
    const updatedKps = kps.filter(k => k.last_practice_at && new Date(k.last_practice_at) >= since).length;

    res.json({
        code: 0,
        data: {
            total_events: events.length,
            by_type: byType,
            by_day: byDay,
            flywheel: {
                input: { answer: answerCount, learning: learningCount, ai_chat: aiCount },
                knowledge_updates: updatedKps,
                loop_active: answerCount > 0 && updatedKps > 0  // 飞轮闭环运行中
            }
        }
    });
});

module.exports = router;
