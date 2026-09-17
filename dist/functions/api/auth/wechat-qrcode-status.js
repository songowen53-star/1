// GET /api/auth/wechat-qrcode-status?scene_id=xxx — 轮询扫码状态
export async function onRequestGet({ request, env, url }) {
    try {
        const sceneId = url.searchParams.get('scene_id');
        if (!sceneId) {
            return Response.json({ code: 1, msg: 'scene_id 不能为空' }, { status: 400 });
        }

        if (env.DATA_STORE) {
            const raw = await env.DATA_STORE.get('wx_scan_' + sceneId);
            if (!raw) {
                return Response.json({ code: 0, data: { status: 'expired', msg: '会话不存在或已过期' } });
            }
            const session = JSON.parse(raw);
            if (session.expireAt < Date.now()) {
                return Response.json({ code: 0, data: { status: 'expired', msg: '二维码已过期，请刷新' } });
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
            } else {
                payload.msg = '等待扫码中...';
            }
            return Response.json({ code: 0, data: payload });
        }

        return Response.json({ code: 0, data: { status: 'pending', msg: '等待扫码中...' } });
    } catch (e) {
        return Response.json({ code: 1, msg: '查询失败: ' + e.message }, { status: 500 });
    }
}
