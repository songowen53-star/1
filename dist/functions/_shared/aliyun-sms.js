// ========== 阿里云短信 SDK（无依赖、Web Crypto 兼容版） ==========
// 适用于 Cloudflare Pages Functions / Workers
// 使用 ACS3-HMAC-SHA256 V3 签名调用 dysmsapi.aliyuncs.com SendSms

const ENDPOINT = 'dysmsapi.aliyuncs.com';
const API_VERSION = '2017-05-25';

/**
 * 发送短信验证码
 * @param {object} opts
 * @param {string} opts.accessKeyId
 * @param {string} opts.accessKeySecret
 * @param {string} opts.signName
 * @param {string} opts.templateCode
 * @param {string} opts.phone
 * @param {string} opts.code
 * @param {number} [opts.ttl=300]
 * @returns {Promise<{success:boolean, code?:string, msg?:string, requestId?:string}>}
 */
async function sendSmsCode({ accessKeyId, accessKeySecret, signName, templateCode, phone, code, ttl = 300 }) {
    const templateParam = JSON.stringify({ code });

    const commonParams = {
        SignatureMethod: 'HMAC-SHA256',
        SignatureNonce: await randomNonce(),
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

    const canonicalQuery = Object.keys(commonParams)
        .sort()
        .map(k => `${percentEncode(k)}=${percentEncode(commonParams[k])}`)
        .join('&');

    const stringToSign = `GET&${percentEncode('/')}&${percentEncode(canonicalQuery)}`;

    // Web Crypto HMAC-SHA256
    const keyBytes = new TextEncoder().encode(accessKeySecret + '&');
    const msgBytes = new TextEncoder().encode(stringToSign);
    const cryptoKey = await crypto.subtle.importKey(
        'raw', keyBytes,
        { name: 'HMAC', hash: 'SHA-256' },
        false, ['sign']
    );
    const sigBuf = await crypto.subtle.sign('HMAC', cryptoKey, msgBytes);
    const signature = base64(sigBuf);

    const url = `https://${ENDPOINT}/?${canonicalQuery}&Signature=${percentEncode(signature)}`;

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

function percentEncode(str) {
    return encodeURIComponent(String(str))
        .replace(/!/g, '%21')
        .replace(/\*/g, '%2A')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/'/g, '%27')
        .replace(/%7E/g, '~');
}

async function randomNonce() {
    const buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

function base64(buf) {
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

export { sendSmsCode, percentEncode, randomNonce };
