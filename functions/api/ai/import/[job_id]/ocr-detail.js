// GET /api/ai/import/:job_id/ocr-detail?page=1 — OCR 识别详情
// 对应后端：backend/routes/ai-import.js GET /:job_id/ocr-detail
import { listTable } from '../../../../_shared/kv-db.js';

export async function onRequestGet({ params, env, request }) {
    try {
        const { job_id } = params;
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page')) || 1;

        const job = (await listTable(env, 'import_jobs')).find(j => j.job_id === job_id);
        if (!job) return Response.json({ code: 1009, msg: '入库任务不存在' }, { status: 404 });

        // 模拟 OCR 详情
        return Response.json({
            code: 0,
            data: {
                total_pages: 12,
                current_page: page,
                accuracy: 96.8,
                blocks: [
                    { type: 'text', content: '已知函数 f(x) = x³ - 3x² + 2，求 f(x) 的极值。', confidence: 0.98 },
                    { type: 'formula', content: "f'(x) = 3x² - 6x", latex: "f'(x) = 3x^2 - 6x", confidence: 0.95, need_review: false },
                    { type: 'image', content: '函数图像', bbox: [120, 80, 280, 200], confidence: 0.89 }
                ],
                need_review_count: 3
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载 OCR 详情失败: ' + e.message }, { status: 500 });
    }
}
