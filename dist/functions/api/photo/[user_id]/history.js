// GET /api/photo/:user_id/history?limit= — 搜题历史
// 对应后端 backend/routes/photo.js 中的 router.get('/:user_id/history')
import { listTable } from '../../../_shared/kv-db.js';

export async function onRequestGet({ params, env, request }) {
    try {
        const { user_id } = params;
        const url = new URL(request.url);
        const limit = Math.min(50, parseInt(url.searchParams.get('limit')) || 10);

        const list = (await listTable(env, 'ocr_records'))
            .filter(r => r.user_id === user_id)
            .sort((a, b) => (b.created_at || b.time || '').localeCompare(a.created_at || a.time || ''))
            .slice(0, limit)
            .map(r => ({
                ocr_id: r.ocr_id,
                subject: r.subject,
                content: r.content ? r.content.slice(0, 40) + '...' : '',
                time: r.time,
                confidence: r.confidence
            }));

        return Response.json({ code: 0, data: list, total: list.length });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载搜题历史失败: ' + e.message }, { status: 500 });
    }
}
