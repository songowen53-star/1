// GET /api/ai/import/:job_id/cut-detail — LLM 切题详情
// 对应后端：backend/routes/ai-import.js GET /:job_id/cut-detail
import { listTable } from '../../../../_shared/kv-db.js';

export async function onRequestGet({ params, env }) {
    try {
        const { job_id } = params;
        const job = (await listTable(env, 'import_jobs')).find(j => j.job_id === job_id);
        if (!job) return Response.json({ code: 1009, msg: '入库任务不存在' }, { status: 404 });

        return Response.json({
            code: 0,
            data: {
                total_questions: 12,
                cut_questions: [
                    { no: 1, type: '选择题', score: 5, difficulty: '简单', confidence: 0.98, content_preview: '已知集合 A={1,2,3}...' },
                    { no: 5, type: '填空题', score: 5, difficulty: '困难', confidence: 0.92, content_preview: '设函数 f(x)=...' },
                    { no: 10, type: '解答题', score: 12, difficulty: '困难', confidence: 0.95, content_preview: '已知椭圆 C...' }
                ],
                low_confidence_count: 1
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载切题详情失败: ' + e.message }, { status: 500 });
    }
}
