// GET /api/page-data/:key — 从 KV 读取页面数据
// PUT /api/page-data/:key — 保存页面数据到 KV
export async function onRequestGet({ params, env }) {
    try {
        const key = (params.key || '').replace(/[^a-zA-Z0-9_-]/g, '_');
        if (!key) {
            return Response.json({ code: 1, msg: 'key 不能为空' }, { status: 400 });
        }

        // KV 实际存储的 key 格式: pages_ai-plan.json （/api/upload 的 safeName 把 / 替换为 _）
        const kvKey = 'pages_' + key + '.json';
        const content = await env.DATA_STORE.get(kvKey);

        if (content === null) {
            // 兼容：尝试不带 pages_ 前缀
            const alt = await env.DATA_STORE.get(key + '.json');
            if (alt !== null) {
                try {
                    return Response.json({ code: 0, data: JSON.parse(alt) });
                } catch (e) {
                    return Response.json({ code: 0, data: alt });
                }
            }
            return Response.json({ code: 0, data: null, msg: '暂无数据' });
        }

        try {
            return Response.json({ code: 0, data: JSON.parse(content) });
        } catch (e) {
            return Response.json({ code: 0, data: content });
        }
    } catch (e) {
        return Response.json({ code: 1, msg: '读取失败: ' + e.message }, { status: 500 });
    }
}

export async function onRequestPut({ params, request, env }) {
    try {
        const key = (params.key || '').replace(/[^a-zA-Z0-9_-]/g, '_');
        if (!key) {
            return Response.json({ code: 1, msg: 'key 不能为空' }, { status: 400 });
        }

        const body = await request.json();
        const data = body.data || body;
        const jsonStr = JSON.stringify(data, null, 2);
        const kvKey = 'pages_' + key + '.json';

        await env.DATA_STORE.put(kvKey, jsonStr, {
            metadata: { size: jsonStr.length, mtime: new Date().toISOString() }
        });

        return Response.json({ code: 0, msg: '数据已保存' });
    } catch (e) {
        return Response.json({ code: 1, msg: '保存失败: ' + e.message }, { status: 500 });
    }
}
