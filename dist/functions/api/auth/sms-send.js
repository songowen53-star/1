// POST /api/auth/sms-send — 发送手机验证码
// 已配置阿里云短信环境变量 → 调用真实网关发送
// 未配置 → 降级演示模式（返回验证码便于本地测试）
import { sendSmsCode } from '../../_shared/aliyun-sms.js';

function getSmsConfig(env) {
    return {
        accessKeyId: env.ALIYUN_SMS_ACCESS_KEY_ID,
        accessKeySecret: env.ALIYUN_SMS_ACCESS_KEY_SECRET,
        signName: env.ALIYUN_SMS_SIGN_NAME,
        templateCode: env.ALIYUN_SMS_TEMPLATE_CODE
    };
}

function isSmsConfigured(env) {
    const c = getSmsConfig(env);
    return !!(c.accessKeyId && c.accessKeySecret && c.signName && c.templateCode);
}

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

        const ttl = 300; // 5分钟有效
        const verifyCode = String(Math.floor(100000 + Math.random() * 900000));

        // 已配置阿里云短信 → 调真实网关发送
        if (isSmsConfigured(env)) {
            const cfg = getSmsConfig(env);
            const result = await sendSmsCode({
                accessKeyId: cfg.accessKeyId,
                accessKeySecret: cfg.accessKeySecret,
                signName: cfg.signName,
                templateCode: cfg.templateCode,
                phone,
                code: verifyCode,
                ttl
            });

            if (!result.success) {
                console.error('[SMS] 阿里云发送失败:', result.code, result.msg);
                return Response.json({
                    code: 1,
                    msg: '短信发送失败：' + (result.msg || result.code || '未知错误'),
                    data: { requestId: result.requestId }
                }, { status: 502 });
            }

            // 仅 KV 可用时存储验证码（用于后续 sms-login 校验）
            if (env.DATA_STORE) {
                await env.DATA_STORE.put(
                    'sms_code_' + phone,
                    JSON.stringify({ code: verifyCode, expireAt: Date.now() + ttl * 1000 }),
                    { expirationTtl: ttl }
                );
            }
            console.log(`[SMS] 验证码已通过阿里云发送到 ${phone}（requestId=${result.requestId}）`);
            return Response.json({
                code: 0,
                msg: '验证码已发送',
                data: { phone, expires_in: ttl }
            });
        }

        // 演示模式：直接返回验证码（开发/未配置环境）
        if (env.DATA_STORE) {
            await env.DATA_STORE.put(
                'sms_code_' + phone,
                JSON.stringify({ code: verifyCode, expireAt: Date.now() + ttl * 1000 }),
                { expirationTtl: ttl }
            );
        }
        console.log(`[SMS] [演示模式] 验证码已发送到 ${phone}: ${verifyCode}`);
        return Response.json({
            code: 0,
            msg: '验证码已发送（演示模式）',
            data: { phone, code: verifyCode, expires_in: ttl, demo: true }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '发送失败: ' + e.message }, { status: 500 });
    }
}
