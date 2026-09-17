// GET /api/auth/wechat-qrcode — 生成微信扫码登录二维码
export async function onRequestGet({ request, env }) {
    try {
        const sceneId = 'wx_scene_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
        const ttl = 300; // 5分钟

        // 存储扫码会话到 KV
        if (env.DATA_STORE) {
            await env.DATA_STORE.put('wx_scan_' + sceneId, JSON.stringify({
                sceneId, status: 'pending', expireAt: Date.now() + ttl * 1000
            }), { expirationTtl: ttl });
        }

        const scanURL = new URL(request.url);
        scanURL.pathname = '/api/auth/wechat-scan-callback';
        scanURL.search = '?scene=' + sceneId;

        // 生成二维码 URL（使用免费服务）
        const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(scanURL.toString())}`;

        return Response.json({
            code: 0,
            data: {
                scene_id: sceneId,
                scan_url: scanURL.toString(),
                qrcode_url: qrCode,
                fallback_qrcode: qrCode,
                expires_in: ttl,
                scan_hint: '请使用微信扫一扫登录'
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '生成二维码失败: ' + e.message }, { status: 500 });
    }
}
