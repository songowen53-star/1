// POST /api/auth/wechat-qrcode-cancel — 取消扫码会话
export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const sceneId = body.scene_id;
        if (sceneId && env.DATA_STORE) {
            const raw = await env.DATA_STORE.get('wx_scan_' + sceneId);
            if (raw) {
                const session = JSON.parse(raw);
                session.status = 'cancelled';
                await env.DATA_STORE.put('wx_scan_' + sceneId, JSON.stringify(session), { expirationTtl: 300 });
            }
        }
        return Response.json({ code: 0, msg: '已取消' });
    } catch (e) {
        return Response.json({ code: 1, msg: '操作失败: ' + e.message }, { status: 500 });
    }
}
