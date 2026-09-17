// POST /api/events/batch — 批量行为事件上报
// 对应后端：backend/routes/events.js POST /batch
// body: { user_id, events: [{type, payload, ts}] }，单次最多 500 条
import { listTable } from '../../_shared/kv-db.js';

const VALID_EVENTS = ['answer','learning','ai_chat','favorite','view','practice','mock_exam','photo_solve','review','plan_complete'];

async function insertIntoTable(env, tableName, record) {
    const arr = await listTable(env, tableName);
    const newRec = {
        id: `${tableName}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        created_at: new Date().toISOString(),
        ...record
    };
    arr.push(newRec);
    await env.DATA_STORE.put(`${tableName}.json`, JSON.stringify(arr, null, 2));
    return newRec;
}

async function updateInTable(env, tableName, id, patch) {
    const arr = await listTable(env, tableName);
    const idx = arr.findIndex(x => x.id === id);
    if (idx < 0) return null;
    arr[idx] = { ...arr[idx], ...patch };
    await env.DATA_STORE.put(`${tableName}.json`, JSON.stringify(arr, null, 2));
    return arr[idx];
}

async function findById(env, tableName, id) {
    const arr = await listTable(env, tableName);
    return arr.find(x => x.id === id) || null;
}

async function updateKnowledgeMastery(env, userId, knowledgePointId, subject, isCorrect) {
    if (!knowledgePointId) return;
    const kps = await listTable(env, 'knowledge_points');
    const kpIdx = kps.findIndex(k => k.id === knowledgePointId);
    if (kpIdx < 0) return;
    const kp = kps[kpIdx];
    const records = (await listTable(env, 'answer_records')).filter(r =>
        r.user_id === userId && r.knowledge_point_id === knowledgePointId
    );
    if (records.length === 0) return;
    const correctCount = records.filter(r => r.is_correct).length;
    const totalCount = records.length;
    const newMastery = totalCount > 0 ? correctCount / totalCount : 0;
    const oldMastery = kp.mastery_rate || 0;
    const smoothed = oldMastery * 0.3 + newMastery * 0.7;
    kps[kpIdx] = {
        ...kp,
        mastery_rate: +smoothed.toFixed(3),
        last_practice_at: new Date().toISOString(),
        practice_count: (kp.practice_count || 0) + 1,
        last_is_correct: isCorrect
    };
    await env.DATA_STORE.put('knowledge_points.json', JSON.stringify(kps, null, 2));
}

async function dispatchEvent(env, event) {
    const dispatched = { learning: false, answer: false, ai: false, favorite: false };
    try {
        if (event.type === 'answer' && event.payload && event.payload.question_id) {
            const q = await findById(env, 'questions', event.payload.question_id);
            if (q) {
                await insertIntoTable(env, 'answer_records', {
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
                await updateKnowledgeMastery(env, event.user_id, q.knowledge_point_id, q.subject, !!event.payload.is_correct);
            }
        }
        if (event.type === 'learning') {
            await insertIntoTable(env, 'learning_records', {
                user_id: event.user_id,
                date: (event.payload && event.payload.date) || new Date().toISOString().slice(0, 10),
                subject: (event.payload && event.payload.subject) || '通用',
                knowledge_point_id: (event.payload && event.payload.knowledge_point_id) || null,
                duration_min: (event.payload && event.payload.duration_min) || 0,
                questions_count: (event.payload && event.payload.questions_count) || 0,
                correct_count: (event.payload && event.payload.correct_count) || 0
            });
            dispatched.learning = true;
        }
        if (event.type === 'ai_chat') {
            const table = event.payload && event.payload.role === 'coach' ? 'coach_history' : 'qa_history';
            await insertIntoTable(env, table, {
                user_id: event.user_id,
                message: (event.payload && event.payload.message) || '',
                reply: (event.payload && event.payload.reply) || '',
                role: (event.payload && event.payload.role) || 'qa',
                model: (event.payload && event.payload.model) || 'qwen3-72b',
                tokens: (event.payload && event.payload.tokens) || 0,
                subject: (event.payload && event.payload.subject) || '通用',
                time: new Date().toISOString()
            });
            dispatched.ai = true;
        }
        if (event.type === 'favorite' && event.payload && event.payload.target_id) {
            const existing = (await listTable(env, 'favorites')).filter(f =>
                f.user_id === event.user_id &&
                f.type === (event.payload.target_type || 'question') &&
                f.target_id === event.payload.target_id
            );
            if (existing.length === 0) {
                await insertIntoTable(env, 'favorites', {
                    user_id: event.user_id,
                    type: (event.payload && event.payload.target_type) || 'question',
                    target_id: event.payload.target_id,
                    subject: (event.payload && event.payload.subject) || '通用',
                    note: (event.payload && event.payload.note) || ''
                });
                dispatched.favorite = true;
            }
        }
    } catch (e) {
        console.error('[Event batch dispatch error]', e && e.message);
    }
    return dispatched;
}

export async function onRequestPost({ env, request }) {
    try {
        const body = await request.json();
        const { user_id, events } = body || {};
        if (!user_id) return Response.json({ code: 1, msg: 'user_id 必填' }, { status: 400 });
        if (!Array.isArray(events) || events.length === 0) {
            return Response.json({ code: 1, msg: 'events 必填且非空数组' }, { status: 400 });
        }
        if (events.length > 500) {
            return Response.json({ code: 1, msg: '单次最多 500 条事件' }, { status: 400 });
        }

        const results = [];
        for (const ev of events) {
            if (!ev.type || !VALID_EVENTS.includes(ev.type)) {
                results.push({ ok: false, reason: 'invalid type', type: ev.type });
                continue;
            }
            const event = await insertIntoTable(env, 'events', {
                user_id,
                type: ev.type,
                payload: ev.payload || {},
                source: 'app_batch',
                ts: ev.ts || new Date().toISOString(),
                processed: false
            });
            const dispatched = await dispatchEvent(env, event);
            await updateInTable(env, 'events', event.id, { processed: true, processed_at: new Date().toISOString() });
            results.push({ ok: true, event_id: event.id, type: ev.type, dispatched });
        }

        const ok = results.filter(r => r.ok).length;
        const fail = results.length - ok;
        return Response.json({
            code: 0,
            data: { total: results.length, ok, fail, results },
            msg: `批量上报完成 ${ok}/${results.length}`
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '批量上报失败: ' + e.message }, { status: 500 });
    }
}
