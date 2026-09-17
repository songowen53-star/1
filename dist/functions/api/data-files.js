// GET /api/data-files — 获取 KV 存储中的文件列表
export async function onRequestGet({ env }) {
    try {
        const listed = await env.DATA_STORE.list();
        const files = listed.keys.map(k => ({
            name: k.name,
            size: k.metadata?.size || 0,
            mtime: k.metadata?.mtime || null
        }));
        return Response.json({ code: 0, data: files });
    } catch (e) {
        return Response.json({ code: 1, msg: '读取 KV 存储失败: ' + e.message }, { status: 500 });
    }
}
