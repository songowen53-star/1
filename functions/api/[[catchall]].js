// /api/[[catchall]].js — 未匹配的 /api/* 路由返回 404 JSON（而非 index.html）
export async function onRequest() {
    return Response.json(
        { code: 1, msg: 'API 接口不存在，请检查路径' },
        { status: 404 }
    );
}
