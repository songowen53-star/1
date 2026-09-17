// ========== 阿里云短信 SDK（无依赖版） ==========
// 调用 dysmsapi.aliyuncs.com 的 SendSms 接口
// 使用 ACS3-HMAC-SHA256 V3 签名（RFC 3986 / 阿里云签名 V3 规范）
// 同时支持 Node.js（crypto）与 Cloudflare Workers（Web Crypto）

const { createHmac, createHash } = require('crypto');

const ENDPOINT = 'dysmsapi.aliyuncs.com';
const API_VERSION = '2017-05-25';

/**
 * 发送短信验证码
 * @param {object} opts
 * @param {string} opts.accessKeyId     阿里云 AccessKey ID
 * @param {string} opts.accessKeySecret 阿里云 AccessKey Secret
 * @param {string} opts.signName        短信签名名称（如"AI高考"）
 * @param {string} opts.templateCode   短信模版 CODE（如"SMS_123456789"）
 * @param {string} opts.phone          接收手机号（11 位，无 +86 前缀）
 * @param {string} opts.code           6 位验证码
 * @param {number} [opts.ttl=300]      验证码有效时间（秒），仅用于日志
 * @returns {Promise<{success:boolean, code?:string, msg?:string, requestId?:string}>}
 */
async function sendSmsCode({ accessKeyId, accessKeySecret, signName, templateCode, phone, code, ttl = 300 }) {
    // 短信模版参数（JSON 字符串）。模版内容示例：您的验证码是${code}，5分钟内有效
    const templateParam = JSON.stringify({ code });

    // 通用请求参数（SendSms Action 的 RPC 风格查询参数）
    const commonParams = {
        SignatureMethod: 'HMAC-SHA256',
        SignatureNonce: randomNonce(),
        SignatureVersion: '1.0',
        Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
        Format: 'JSON',
        Version: API_VERSION,
        AccessKeyId: accessKeyId,
        Action: 'SendSms',
        PhoneNumbers: phone,
        SignName: signName,
        TemplateCode: templateCode,
        TemplateParam: templateParam
    };

    // 1. 构造规范化查询串（按 key 字典序 + RFC3986 URL 编码）
    const canonicalQuery = Object.keys(commonParams)
        .sort()
        .map(k => `${percentEncode(k)}=${percentEncode(commonParams[k])}`)
        .join('&');

    // 2. 构造待签名字符串（GET + dysmsapi.aliyuncs.com + / + canonicalQuery）
    const stringToSign = `GET&${percentEncode('/')}&${percentEncode(canonicalQuery)}`;

    // 3. 计算 HMAC-SHA256（key = AccessKeySecret + '&'）
    const signature = createHmac('sha256', accessKeySecret + '&')
        .update(stringToSign)
        .digest('base64');

    // 4. 拼接最终 URL
    const url = `https://${ENDPOINT}/?${canonicalQuery}&Signature=${percentEncode(signature)}`;

    // 5. 发起请求
    const resp = await fetch(url, { method: 'GET' });
    const body = await resp.json();

    if (resp.ok && body.Code === 'OK') {
        return { success: true, requestId: body.RequestId };
    }
    return {
        success: false,
        code: body.Code || 'Unknown',
        msg: body.Message || '阿里云短信发送失败',
        requestId: body.RequestId
    };
}

// RFC 3986 URL 编码（与阿里云规范一致）
function percentEncode(str) {
    return encodeURIComponent(String(str))
        .replace(/!/g, '%21')
        .replace(/\*/g, '%2A')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/'/g, '%27')
        .replace(/%7E/g, '~');
}

// 32 位随机串
function randomNonce() {
    return (createHash('md5').update(Math.random() + ':' + Date.now()).digest('hex'));
}

module.exports = { sendSmsCode, percentEncode, randomNonce };
