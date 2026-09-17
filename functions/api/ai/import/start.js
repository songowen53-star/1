// POST /api/ai/import/start — 启动自动入库流程（9 步：PDF→OCR→公式→图片→切题→JSON→审核→图谱→入库）
// 对应后端：backend/routes/ai-import.js POST /start
// 后端用 setTimeout 模拟异步推进到第 7 步；Cloudflare 边缘无长连接，直接写入"已推进到第 7 步"状态
import { listTable } from '../../../_shared/kv-db.js';

const IMPORT_STEPS = [
    { num: 1, title: 'PDF上传', desc: '上传试卷文件' },
    { num: 2, title: 'OCR文字识别', desc: '识别全部文字内容' },
    { num: 3, title: '公式识别（LaTeX）', desc: '识别数学公式转为 LaTeX' },
    { num: 4, title: '图片识别与提取', desc: '识别图表/函数图像/几何图形' },
    { num: 5, title: 'LLM智能切题', desc: '识别独立题目，含题型/分值' },
    { num: 6, title: 'JSON结构化', desc: '题目/选项/答案/解析结构化' },
    { num: 7, title: 'AI审核校验', desc: '校验内容完整性、公式准确性' },
    { num: 8, title: '知识图谱标注', desc: '关联知识点节点，标注考点与难度' },
    { num: 9, title: '入库完成', desc: '写入题库数据库，建立索引' }
];

export async function onRequestPost({ env, request }) {
    try {
        const body = await request.json();
        const { file_path, source, year, subject } = body || {};
        if (!file_path) return Response.json({ code: 1, msg: 'file_path 必填' }, { status: 400 });

        const jobId = 'import_' + Date.now();
        const now = new Date().toISOString();

        // 直接写入"已推进到第 7 步（AI审核校验）"状态，模拟异步 OCR/LLM 已完成
        const steps = IMPORT_STEPS.map((s, i) => ({
            ...s,
            status: i < 6 ? 'done' : (i === 6 ? 'active' : 'locked'),
            time: i < 6 ? '已完成' : (i === 6 ? '进行中' : '待处理'),
            desc: s.desc
        }));

        const jobs = await listTable(env, 'import_jobs');
        const job = {
            id: `import_jobs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            job_id: jobId,
            file_path,
            source: source || 'real_exam',
            year: year || null,
            subject: subject || '数学',
            total_steps: 9,
            current_step: 7,
            current_status: 'AI审核校验',
            completed_steps: 6,
            progress_percent: 67,
            status: 'running',
            steps,
            created_at: now
        };
        jobs.push(job);
        await env.DATA_STORE.put('import_jobs.json', JSON.stringify(jobs, null, 2));

        // 返回初始状态（保持与后端 API 契约一致）
        return Response.json({
            code: 0,
            data: {
                job_id: jobId,
                total_steps: 9,
                current_step: 1,
                current_status: 'PDF上传',
                progress_percent: 0
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '启动入库失败: ' + e.message }, { status: 500 });
    }
}
