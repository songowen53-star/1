// POST /api/auth/logout — 登出
export async function onRequestPost({ request, env }) {
    try {
        const token = (request.headers.get('Authorization') || '').replace('Bearer ', '');
        const body = await request.json().catch(() => ({}));
        const tokenVal = token || body.token;
        if (tokenVal && env.DATA_STORE) {
            await env.DATA_STORE.delete('token_' + tokenVal);
        }
        return Response.json({ code: 0, msg: '已退出登录' });
    } catch (e) {
        return Response.json({ code: 0, msg: '已退出登录' });
    }
}
