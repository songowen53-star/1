// POST /api/photo/ocr — 拍照 OCR 识别
// 对应后端 backend/routes/photo.js 中的 router.post('/ocr')
// body: { image_base64, user_id }
import { listTable } from '../../_shared/kv-db.js';

// 学科猜测（简化版）
function guessSubjectByText(content) {
    if (/(函数|导数|方程|几何|概率|数列)/.test(content)) return '数学';
    if (/(力|电|磁|运动|能量)/.test(content)) return '物理';
    if (/(反应|化学|有机|平衡)/.test(content)) return '化学';
    if (/(基因|细胞|遗传|生物)/.test(content)) return '生物';
    if (/(翻译|语法|英语|grammar)/.test(content)) return '英语';
    if (/(文言|古诗|语文|阅读)/.test(content)) return '语文';
    return '通用';
}

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { image_base64, user_id } = body || {};
        if (!image_base64) {
            return Response.json({ code: 1, msg: 'image_base64 必填' }, { status: 400 });
        }

        // 模拟 OCR 识别结果
        const sampleContent = '已知函数 f(x) = ln x - ax，讨论 f(x) 的单调性';
        const subject = guessSubjectByText(sampleContent);
        const ocrId = 'ocr_' + Date.now();
        const now = new Date().toISOString();

        const record = {
            id: 'ocr_' + Date.now().toString(36),
            ocr_id: ocrId,
            user_id: user_id || 'guest',
            subject,
            confidence: 0.96,
            content: sampleContent,
            formulas: [{ latex: 'f(x) = \\ln x - ax', bbox: [120, 80, 280, 120] }],
            images: [],
            created_at: now,
            time: now
        };

        // 写入 ocr_records.json
        const raw = await env.DATA_STORE.get('ocr_records.json');
        const list = raw ? JSON.parse(raw) : [];
        list.push(record);
        await env.DATA_STORE.put('ocr_records.json', JSON.stringify(list, null, 2));

        return Response.json({
            code: 0,
            data: {
                ocr_id: ocrId,
                subject,
                confidence: 0.96,
                content: sampleContent,
                formulas: [{ latex: 'f(x) = \\ln x - ax', bbox: [120, 80, 280, 120] }],
                images: []
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: 'OCR 识别失败: ' + e.message }, { status: 500 });
    }
}
