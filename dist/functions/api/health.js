// GET /api/health — 健康检查
export async function onRequestGet({ env }) {
    return Response.json({
        code: 0,
        msg: '服务运行中（Cloudflare Pages Functions + KV）',
        time: new Date().toISOString(),
        kv: env.DATA_STORE ? '已绑定' : '未绑定'
    });
}
