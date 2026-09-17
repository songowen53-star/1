// GET /api/ai/error/:user_id/by-cause?cause=&limit=10 — 按错因分类返回错题明细
// 对应后端：backend/routes/ai-error.js GET /:user_id/by-cause
import { listTable } from '../../../../_shared/kv-db.js';

const ERROR_CAUSES = [
    { code: 'concept', label: '概念不清', suggestion: '回顾课本定义与定理，重做基础题巩固。' },
    { code: 'calc', label: '计算失误', suggestion: '限时训练提升计算准确率，养成验算习惯。' },
    { code: 'method', label: '方法不当', suggestion: '归纳题型套路，建立"题型→方法"映射。' },
    { code: 'read', label: '审题不清', suggestion: '画关键字、列已知/求，养成结构化读题习惯。' },
    { code: 'formula', label: '公式记错', suggestion: '整理公式卡，每日默写 5 条核心公式。' },
    { code: 'logic', label: '推理跳跃', suggestion: '分步书写，每步注明依据，避免跳步。' },
    { code: 'other', label: '其他', suggestion: '单独整理到错题本，找老师面批一次。' }
];

export async function onRequestGet({ params, env, request }) {
    try {
        const userId = params.user_id;
        const url = new URL(request.url);
        const cause = url.searchParams.get('cause');
        const limit = Math.min(50, parseInt(url.searchParams.get('limit')) || 10);

        const answers = (await listTable(env, 'answer_records')).filter(a =>
            a.user_id === userId && a.is_correct === false &&
            (!cause || (a.cause || 'concept') === cause)
        );

        const questions = await listTable(env, 'questions');

        const items = answers.slice(0, limit).map(a => {
            const q = questions.find(x => x.id === a.question_id) || {};
            const meta = ERROR_CAUSES.find(c => c.code === (a.cause || 'concept')) || ERROR_CAUSES[0];
            return {
                question_id: a.question_id,
                subject: a.subject,
                content_preview: (q.content || a.content_preview || '示例错题内容').slice(0, 60),
                cause: a.cause || 'concept',
                cause_label: meta.label,
                suggestion: meta.suggestion,
                wrong_at: a.created_at,
                reviewed: a.reviewed || false
            };
        });

        while (items.length < Math.min(limit, 3)) {
            const meta = ERROR_CAUSES[items.length % ERROR_CAUSES.length];
            items.push({
                question_id: 'err_sample_' + items.length,
                subject: '数学',
                content_preview: '示例错题：设函数 f(x)=x³-3x²+2，求极值。',
                cause: meta.code,
                cause_label: meta.label,
                suggestion: meta.suggestion,
                wrong_at: new Date(Date.now() - items.length * 86400000).toISOString(),
                reviewed: false
            });
        }

        return Response.json({
            code: 0,
            data: {
                user_id: userId,
                cause: cause || 'all',
                total: items.length,
                items
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载错题明细失败: ' + e.message }, { status: 500 });
    }
}
