// GET /api/auth/wechat-qrcode-stream?scene_id=xxx — SSE 实时状态推送
// 说明：Cloudflare Pages Functions 无状态、不支持长连接 SSE。
// 此端点单次推送当前状态后立即关闭流，前端 EventSource 检测到 onerror 后会自动降级到轮询。
// 本地后端（backend/routes/auth.js）才是真正的长连接 SSE 实现。
export async function onRequestGet({ request, env, url }) {
    const sceneId = url.searchParams.get('scene_id');
    const headers = {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    };

    if (!sceneId) {
        return new Response(`data: ${JSON.stringify({ code: 1, msg: 'scene_id 不能为空' })}\n\n`, { status: 400, headers });
    }

    try {
        if (env.DATA_STORE) {
            const raw = await env.DATA_STORE.get('wx_scan_' + sceneId);
            if (!raw) {
                const body = `data: ${JSON.stringify({ code: 0, data: { status: 'expired', msg: '会话不存在或已过期' } })}\n\n`;
                return new Response(body, { status: 200, headers });
            }
            const session = JSON.parse(raw);
            if (session.expireAt < Date.now()) {
                const body = `data: ${JSON.stringify({ code: 0, data: { status: 'expired', msg: '二维码已过期，请刷新' } })}\n\n`;
                return new Response(body, { status: 200, headers });
            }

            const payload = { status: session.status };
            if (session.status === 'confirmed') {
                payload.token = session.token;
                payload.user = session.user;
                payload.user_id = session.user_id;
                payload.is_new = session.is_new;
                payload.msg = '登录成功';
            } else if (session.status === 'waiting_confirm') {
                payload.msg = '已扫码，请在微信上确认登录';
            } else if (session.status === 'cancelled') {
                payload.msg = '用户取消了登录';
            } else {
                payload.msg = '等待扫码中...';
            }
            const body = `data: ${JSON.stringify({ code: 0, data: payload })}\n\n`;
            // 注：单次推送后流即关闭；前端 onerror 后会自动降级到 wechat-qrcode-status 轮询
            return new Response(body, { status: 200, headers });
        }
        // 无 KV：返回 pending，让前端降级轮询
        const body = `data: ${JSON.stringify({ code: 0, data: { status: 'pending', msg: '等待扫码中...' } })}\n\n`;
        return new Response(body, { status: 200, headers });
    } catch (e) {
        const body = `data: ${JSON.stringify({ code: 1, msg: '查询失败: ' + e.message })}\n\n`;
        return new Response(body, { status: 500, headers });
    }
}
