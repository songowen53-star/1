// GET /api/ai/import/:job_id/status — 查询入库流程进度
// 对应后端：backend/routes/ai-import.js GET /:job_id/status
import { listTable } from '../../../../_shared/kv-db.js';

export async function onRequestGet({ params, env }) {
    try {
        const { job_id } = params;
        const job = (await listTable(env, 'import_jobs')).find(j => j.job_id === job_id);
        if (!job) return Response.json({ code: 1009, msg: '入库任务不存在' }, { status: 404 });

        return Response.json({
            code: 0,
            data: {
                job_id,
                current_step: job.current_step,
                current_status: job.current_status,
                completed_steps: job.completed_steps,
                total_steps: job.total_steps,
                progress_percent: job.progress_percent,
                steps: job.steps
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '查询进度失败: ' + e.message }, { status: 500 });
    }
}
