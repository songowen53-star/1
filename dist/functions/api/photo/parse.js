// POST /api/photo/parse — AI 解析题目
// 对应后端 backend/routes/photo.js 中的 router.post('/parse')
// 注：后端使用 SSE 流式输出，Cloudflare 边缘降级为一次性 JSON 响应
// body: { ocr_id, user_id }
import { listTable } from '../../_shared/kv-db.js';

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { ocr_id, user_id } = body || {};
        if (!ocr_id) {
            return Response.json({ code: 1, msg: 'ocr_id 必填' }, { status: 400 });
        }

        const ocr = (await listTable(env, 'ocr_records')).find(r => r.ocr_id === ocr_id);
        if (!ocr) {
            return Response.json({ code: 1, msg: 'OCR 记录不存在' }, { status: 404 });
        }

        // 模拟 AI 分析结果（后端为 SSE，此处一次性返回）
        const analysis = '对数函数 ln x 定义域 x>0，对 f(x) 求导得 f\'(x) = 1/x - a。讨论 f\'(x) 符号判断单调性。';
        const answer = 'a≥0 时，f(x) 在 (0,1/a] 单调递增，在 [1/a,+∞) 单调递减；a<0 时，f(x) 在 (0,+∞) 单调递增。';
        const now = new Date().toISOString();

        // 保存解析记录
        const record = {
            id: 'pp_' + Date.now().toString(36),
            ocr_id,
            user_id: user_id || 'guest',
            analysis,
            answer,
            model: 'deepseek-r1',
            created_at: now,
            time: now
        };
        const raw = await env.DATA_STORE.get('photo_parse_records.json');
        const list = raw ? JSON.parse(raw) : [];
        list.push(record);
        await env.DATA_STORE.put('photo_parse_records.json', JSON.stringify(list, null, 2));

        return Response.json({
            code: 0,
            data: {
                route: { modelKey: 'deepseek-r1', role: '数学推理' },
                analysis,
                answer,
                model: 'deepseek-r1'
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: 'AI 解析失败: ' + e.message }, { status: 500 });
    }
}
