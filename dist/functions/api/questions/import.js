// POST /api/questions/import — 真题文本/JSON 批量导入到 KV questions.json
export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { format, data } = body || {};
        const imported = [];

        // 1. 读取 KV 中已有的 questions.json
        let questions = [];
        const existing = await env.DATA_STORE.get('questions.json');
        if (existing) {
            try {
                questions = JSON.parse(existing);
            } catch (_) { questions = []; }
        }

        // 2. 生成唯一 ID
        const genId = () => `questions_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const now = () => new Date().toISOString();

        if (format === 'json' && Array.isArray(data)) {
            data.forEach(item => {
                const record = {
                    id: genId(),
                    source: item.source || 'real_exam',
                    year: item.year || null,
                    province: item.province || null,
                    paper_name: item.paper_name || null,
                    question_number: item.question_number || null,
                    subject: item.subject,
                    knowledge_point_id: item.knowledge_point_id || null,
                    type: item.type || '选择题',
                    difficulty: item.difficulty || 3,
                    score: item.score || 0,
                    content: item.content || '',
                    options: item.options || null,
                    answer: item.answer || '',
                    analysis: item.analysis || '',
                    created_at: now(),
                    updated_at: now()
                };
                questions.push(record);
                imported.push(record);
            });
        } else if (format === 'text' && typeof data === 'string') {
            // 按 "---" 分隔题目块
            const blocks = data.split(/^---\s*$/m).map(b => b.trim()).filter(Boolean);
            blocks.forEach(block => {
                const extract = (tag) => {
                    const re = new RegExp(`【${tag}】\\s*([\\s\\S]*?)(?=【|$)`);
                    const m = block.match(re);
                    return m ? m[1].trim() : '';
                };
                const content = extract('题干') || block;
                const record = {
                    id: genId(),
                    source: 'real_exam',
                    year: parseInt(extract('年份')) || null,
                    province: extract('省份') || null,
                    paper_name: extract('试卷') || null,
                    subject: extract('科目') || '数学',
                    knowledge_point_id: null,
                    type: extract('题型') || '解答题',
                    difficulty: parseInt(extract('难度')) || 3,
                    score: parseInt(extract('分值')) || 0,
                    content,
                    options: null,
                    answer: extract('答案'),
                    analysis: extract('解析'),
                    created_at: now(),
                    updated_at: now()
                };
                questions.push(record);
                imported.push(record);
            });
        } else {
            return Response.json({ code: 1, msg: 'format 必须是 json 或 text，data 不能为空' }, { status: 400 });
        }

        // 3. 写回 KV
        const jsonStr = JSON.stringify(questions, null, 2);
        await env.DATA_STORE.put('questions.json', jsonStr, {
            metadata: { size: jsonStr.length, mtime: new Date().toISOString() }
        });

        return Response.json({
            code: 0,
            data: { count: imported.length, questions: imported },
            msg: `成功导入 ${imported.length} 道题`
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '导入失败: ' + e.message }, { status: 500 });
    }
}
