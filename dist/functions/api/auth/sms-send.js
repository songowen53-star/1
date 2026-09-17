// POST /api/auth/sms-send — 发送手机验证码
// 演示模式：直接返回验证码（不实际发送短信）
export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const phone = body.phone;
        if (!phone) {
            return Response.json({ code: 1, msg: '手机号不能为空' }, { status: 400 });
        }
        if (!/^1\d{10}$/.test(phone)) {
            return Response.json({ code: 1, msg: '手机号格式不正确' }, { status: 400 });
        }

        // 生成6位验证码
        const code = String(Math.floor(100000 + Math.random() * 900000));
        const ttl = 300; // 5分钟有效

        // 存储到 KV（key: sms_code_<phone>）
        if (env.DATA_STORE) {
            await env.DATA_STORE.put('sms_code_' + phone, JSON.stringify({ code, expireAt: Date.now() + ttl * 1000 }), { expirationTtl: ttl });
        }

        return Response.json({
            code: 0,
            msg: '验证码已发送',
            data: { phone, code, expires_in: ttl }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '发送失败: ' + e.message }, { status: 500 });
    }
}
