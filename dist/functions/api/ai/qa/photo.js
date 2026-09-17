// POST /api/ai/qa/photo — 拍照提问（转交 photo 模块，此处仅记录到 qa_history）
// 对应后端：backend/routes/ai-qa.js POST /photo
// body: { user_id, image_base64 }
import { listTable } from '../../../_shared/kv-db.js';

export async function onRequestPost({ env, request }) {
    try {
        const body = await request.json();
        const { user_id, image_base64 } = body || {};
        if (!image_base64) return Response.json({ code: 1, msg: 'image_base64 必填' }, { status: 400 });

        const arr = await listTable(env, 'qa_history');
        const record = {
            id: `qa_history_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            user_id: user_id || 'guest',
            question: '[拍照提问]',
            subject: '待识别',
            answer_preview: '',
            tokens: 0,
            time: new Date().toISOString(),
            type: 'photo',
            status: 'pending_ocr',
            created_at: new Date().toISOString()
        };
        arr.push(record);
        await env.DATA_STORE.put('qa_history.json', JSON.stringify(arr, null, 2));

        return Response.json({
            code: 0,
            data: { qa_id: record.id, msg: '已收到图片，请调用 /api/photo/ocr 进行识别' }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '拍照提问失败: ' + e.message }, { status: 500 });
    }
}
