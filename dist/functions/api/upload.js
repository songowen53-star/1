// POST /api/upload — 上传文件到 KV 存储
export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { filename, content } = body || {};

        if (!filename || !content) {
            return Response.json({ code: 1, msg: '文件名和内容不能为空' }, { status: 400 });
        }

        // 安全检查：只允许字母数字下划线中文和点
        const safeName = filename.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5.-]/g, '_');

        // 写入 KV（带元数据）
        await env.DATA_STORE.put(safeName, content, {
            metadata: { size: content.length, mtime: new Date().toISOString() }
        });

        // 如果是 JSON 文件，解析并返回统计信息
        const stats = { filename: safeName, size: content.length };
        if (safeName.endsWith('.json')) {
            try {
                const data = JSON.parse(content);
                if (Array.isArray(data)) {
                    stats.records = data.length;
                    stats.type = 'array';
                } else if (typeof data === 'object') {
                    stats.keys = Object.keys(data).length;
                    stats.type = 'object';
                }
            } catch (e) {
                stats.jsonParseError = e.message;
            }
        }

        return Response.json({
            code: 0,
            msg: `文件 ${safeName} 已保存到云端 KV 存储`,
            data: stats
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '上传失败: ' + e.message }, { status: 500 });
    }
}
