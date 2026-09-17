// POST /api/auth/wechat-qrcode-refresh — 同 scene 刷新二维码（重置状态与过期时间）
// body: { scene_id }
// 说明：保留原 scene_id，重置 status=pending、expireAt=now+300s、清空 openid/user/token
export async function onRequestPost({ request, env, url }) {
    try {
        const body = await request.json();
        const { scene_id } = body;
        if (!scene_id) {
            return Response.json({ code: 1, msg: 'scene_id 不能为空' }, { status: 400 });
        }
        if (!env.DATA_STORE) {
            return Response.json({ code: 1, msg: '数据存储不可用' }, { status: 500 });
        }

        const raw = await env.DATA_STORE.get('wx_scan_' + scene_id);
        if (!raw) {
            return Response.json({ code: 1, msg: '会话不存在，请重新生成二维码' }, { status: 404 });
        }

        const ttl = 300;
        const now = Date.now();
        const session = {
            sceneId: scene_id,
            status: 'pending',
            expireAt: now + ttl * 1000,
            createdAt: now,
            openid: null,
            user: null,
            token: null,
            user_id: null,
            is_new: false
        };
        await env.DATA_STORE.put('wx_scan_' + scene_id, JSON.stringify(session), { expirationTtl: ttl });

        // 构造扫码回调 URL
        const scanURL = new URL(request.url);
        scanURL.pathname = '/api/auth/wechat-scan-callback';
        scanURL.search = '?scene=' + scene_id;
        const scanUrlStr = scanURL.toString();
        const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(scanUrlStr)}`;

        return Response.json({
            code: 0,
            data: {
                scene_id,
                scan_url: scanUrlStr,
                qrcode_url: qrCode,
                fallback_qrcode: qrCode,
                expires_in: ttl,
                scan_hint: '请使用微信扫一扫登录'
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '刷新失败: ' + e.message }, { status: 500 });
    }
}
