// POST /api/ai/import/:job_id/review — 提交审核结果（approve→入库完成 / reject→驳回）
// 对应后端：backend/routes/ai-import.js POST /:job_id/review
// body: { reviewer, decision, comments, adjustments }
import { listTable } from '../../../../_shared/kv-db.js';

export async function onRequestPost({ params, env, request }) {
    try {
        const { job_id } = params;
        const body = await request.json();
        const { reviewer, decision, comments, adjustments } = body || {};

        const jobs = await listTable(env, 'import_jobs');
        const idx = jobs.findIndex(j => j.job_id === job_id);
        if (idx < 0) return Response.json({ code: 1009, msg: '入库任务不存在' }, { status: 404 });

        const job = jobs[idx];

        if (decision === 'approve') {
            job.steps.forEach((s, i) => {
                if (i < 9) { s.status = 'done'; s.time = '已完成'; }
            });
            job.current_step = 9;
            job.current_status = '入库完成';
            job.completed_steps = 9;
            job.progress_percent = 100;
            job.status = 'completed';
        } else if (decision === 'reject') {
            job.steps[6].status = 'active';
            job.steps[6].desc = '审核驳回：' + (comments || '需重新校验');
            job.status = 'rejected';
        }

        jobs[idx] = {
            ...job,
            steps: job.steps,
            current_step: job.current_step,
            current_status: job.current_status,
            completed_steps: job.completed_steps,
            progress_percent: job.progress_percent,
            status: job.status,
            reviewer,
            review_comments: comments,
            reviewed_at: new Date().toISOString()
        };
        await env.DATA_STORE.put('import_jobs.json', JSON.stringify(jobs, null, 2));

        return Response.json({
            code: 0,
            data: {
                job_id,
                decision,
                progress_percent: job.progress_percent,
                status: job.status,
                msg: decision === 'approve' ? '审核通过，已入库' : '审核驳回，需重新处理'
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '提交审核失败: ' + e.message }, { status: 500 });
    }
}
