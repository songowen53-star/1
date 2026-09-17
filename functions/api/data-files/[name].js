// GET  /api/data-files/:name — 读取 KV 中指定文件内容
// DELETE /api/data-files/:name — 删除 KV 中指定文件
export async function onRequestGet({ params, env }) {
    try {
        const safeName = (params.name || '').replace(/[^a-zA-Z0-9_\u4e00-\u9fa5.-]/g, '_');
        const content = await env.DATA_STORE.get(safeName);

        if (content === null) {
            return Response.json({ code: 1, msg: '文件不存在' }, { status: 404 });
        }

        return Response.json({ code: 0, data: { name: safeName, content } });
    } catch (e) {
        return Response.json({ code: 1, msg: '读取失败: ' + e.message }, { status: 500 });
    }
}

export async function onRequestDelete({ params, env }) {
    try {
        const safeName = (params.name || '').replace(/[^a-zA-Z0-9_\u4e00-\u9fa5.-]/g, '_');
        const existing = await env.DATA_STORE.get(safeName);

        if (existing === null) {
            return Response.json({ code: 1, msg: '文件不存在' }, { status: 404 });
        }

        await env.DATA_STORE.delete(safeName);
        return Response.json({ code: 0, msg: `已删除 ${safeName}` });
    } catch (e) {
        return Response.json({ code: 1, msg: '删除失败: ' + e.message }, { status: 500 });
    }
}
