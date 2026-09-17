// ========== 认证路由 ==========
// 注册 / 登录 / 登出 / 获取当前登录用户
// 说明：演示项目，密码仅做简单哈希存储，请勿用于生产环境
const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');

// 共享 token 存储（与 middleware/auth.js 共用，便于统一校验）
const { tokenStore, issueToken, revokeToken } = require('../auth-store');

// 简单哈希函数（非加密安全，仅演示）
function hashPwd(pwd) {
    return crypto.createHash('sha256').update(pwd + '::aigaokao_salt').digest('hex');
}

// 生成简易 token
function genToken(userId) {
    return crypto.createHash('sha1').update(userId + '::' + Date.now() + '::' + Math.random()).digest('hex');
}

// ========== 注册 ==========
// POST /api/auth/register  body: { username, password, name?, grade?, province? }
router.post('/register', (req, res) => {
    const { username, password, name, grade, province } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ code: 1, msg: '用户名和密码不能为空' });
    }
    if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ code: 1, msg: '用户名长度需3-20位' });
    }
    if (password.length < 6) {
        return res.status(400).json({ code: 1, msg: '密码至少6位' });
    }

    // 检查用户名是否已存在（用户名存于 accounts 表）
    const accounts = db.list('accounts');
    if (accounts.find(a => a.username === username)) {
        return res.status(409).json({ code: 1, msg: '用户名已被注册' });
    }

    // 创建账户
    const userId = 'u_' + Date.now().toString(36);
    const account = db.insert('accounts', {
        id: 'acc_' + Date.now().toString(36),
        user_id: userId,
        username,
        password: hashPwd(password)
    });

    // 创建对应的用户档案（带默认值）
    const user = db.insert('users', {
        id: userId,
        name: name || username,
        grade: grade || '高三',
        province: province || '浙江',
        target_score: 633,
        current_score: 500,
        exam_date: '2026-06-07'
    });

    // 生成 token
    const token = genToken(userId);
    tokenStore[token] = userId;

    res.json({
        code: 0,
        msg: '注册成功',
        data: {
            token,
            user_id: userId,
            user
        }
    });
});

// ========== 登录 ==========
// POST /api/auth/login  body: { username, password }
router.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
        return res.status(400).json({ code: 1, msg: '用户名和密码不能为空' });
    }

    const accounts = db.list('accounts');
    const account = accounts.find(a => a.username === username);

    // 兼容演示账户 u_001（无 password 字段时，使用用户名作为密码）
    if (!account) {
        // 尝试演示账户：username 即用户ID，password 即用户名
        const demoUser = db.findById('users', username);
        if (demoUser) {
            const token = genToken(username);
            tokenStore[token] = username;
            return res.json({
                code: 0,
                msg: '登录成功',
                data: { token, user_id: username, user: demoUser }
            });
        }
        return res.status(401).json({ code: 1, msg: '用户名或密码错误' });
    }

    if (account.password !== hashPwd(password)) {
        return res.status(401).json({ code: 1, msg: '用户名或密码错误' });
    }

    const user = db.findById('users', account.user_id);
    if (!user) {
        return res.status(500).json({ code: 1, msg: '用户档案缺失' });
    }

    const token = genToken(account.user_id);
    tokenStore[token] = account.user_id;

    res.json({
        code: 0,
        msg: '登录成功',
        data: { token, user_id: account.user_id, user }
    });
});

// ========== 登出 ==========
// POST /api/auth/logout  header: { Authorization: Bearer <token> } 或 body: { token }
router.post('/logout', (req, res) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '') || req.body.token;
    if (token && tokenStore[token]) {
        delete tokenStore[token];
    }
    res.json({ code: 0, msg: '已退出登录' });
});

// ========== 微信登录（模拟）==========
// POST /api/auth/wechat-login  body: { code }
// 模拟微信 OAuth 授权流程：前端获取 code → 后端换取 openid → 登录/注册
const wechatUserStore = {};
router.post('/wechat-login', (req, res) => {
    const { code } = req.body || {};
    if (!code) {
        return res.status(400).json({ code: 1, msg: '微信授权码不能为空' });
    }

    // 模拟：用 code 生成 openid（实际应调用微信接口 code2session）
    const openid = 'wx_' + crypto.createHash('md5').update(code).digest('hex').slice(0, 16);

    // 查找是否已绑定该 openid 的用户
    const accounts = db.list('accounts');
    let account = accounts.find(a => a.wechat_openid === openid);

    if (account) {
        const user = db.findById('users', account.user_id);
        const token = genToken(account.user_id);
        tokenStore[token] = account.user_id;
        return res.json({
            code: 0,
            msg: '微信登录成功',
            data: { token, user_id: account.user_id, user, is_new: false }
        });
    }

    // 首次微信登录：自动创建账户
    const userId = 'u_' + Date.now().toString(36);
    const accountId = 'acc_' + Date.now().toString(36);
    account = db.insert('accounts', {
        id: accountId,
        user_id: userId,
        username: 'wx_' + openid.slice(-6),
        password: hashPwd('wx_auto_' + openid),
        wechat_openid: openid
    });
    const user = db.insert('users', {
        id: userId,
        name: '微信用户',
        grade: '高三',
        province: '浙江',
        target_score: 633,
        current_score: 500,
        exam_date: '2026-06-07',
        avatar_type: 'wechat'
    });
    const token = genToken(userId);
    tokenStore[token] = userId;

    res.json({
        code: 0,
        msg: '微信登录成功，已为你创建账号',
        data: { token, user_id: userId, user, is_new: true }
    });
});

// ========== 手机验证码 ==========
// 内存中存储已发送的验证码： { phone: { code, expireAt } }
const smsCodeStore = {};
const SMS_CODE_TTL = 300000; // 5分钟有效

// 阿里云短信 SDK（仅在配置了环境变量时启用真实发送）
const aliyunSms = require('../sms/aliyun-sms');

// 读取阿里云短信配置（未配置 → 降级演示模式）
function getSmsConfig() {
    return {
        accessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID,
        accessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET,
        signName: process.env.ALIYUN_SMS_SIGN_NAME,
        templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE
    };
}

function isSmsConfigured() {
    const c = getSmsConfig();
    return !!(c.accessKeyId && c.accessKeySecret && c.signName && c.templateCode);
}

// POST /api/auth/sms-send  body: { phone }
router.post('/sms-send', async (req, res) => {
    const { phone } = req.body || {};
    if (!phone) {
        return res.status(400).json({ code: 1, msg: '手机号不能为空' });
    }
    if (!/^1\d{10}$/.test(phone)) {
        return res.status(400).json({ code: 1, msg: '手机号格式不正确' });
    }

    // 防止60秒内重复发送
    const existing = smsCodeStore[phone];
    if (existing && Date.now() - existing.sentAt < 60000) {
        return res.status(429).json({ code: 1, msg: '验证码发送过于频繁，请60秒后重试' });
    }

    // 生成6位验证码
    const verifyCode = String(Math.floor(100000 + Math.random() * 900000));
    const ttlSec = Math.floor(SMS_CODE_TTL / 1000);

    // 已配置阿里云短信 → 调真实网关发送；否则降级演示模式
    if (isSmsConfigured()) {
        try {
            const cfg = getSmsConfig();
            const result = await aliyunSms.sendSmsCode({
                accessKeyId: cfg.accessKeyId,
                accessKeySecret: cfg.accessKeySecret,
                signName: cfg.signName,
                templateCode: cfg.templateCode,
                phone,
                code: verifyCode,
                ttl: ttlSec
            });
            if (!result.success) {
                console.error('[SMS] 阿里云发送失败:', result.code, result.msg);
                return res.status(502).json({
                    code: 1,
                    msg: '短信发送失败：' + (result.msg || result.code || '未知错误'),
                    data: { requestId: result.requestId }
                });
            }
            // 发送成功：写入会话存储（不返回验证码给前端）
            smsCodeStore[phone] = {
                code: verifyCode,
                expireAt: Date.now() + SMS_CODE_TTL,
                sentAt: Date.now()
            };
            console.log(`[SMS] 验证码已通过阿里云发送到 ${phone}（requestId=${result.requestId}）`);
            return res.json({
                code: 0,
                msg: '验证码已发送',
                data: { phone, expires_in: ttlSec }
            });
        } catch (e) {
            console.error('[SMS] 调用阿里云异常:', e.message);
            return res.status(502).json({ code: 1, msg: '短信服务异常: ' + e.message });
        }
    }

    // 演示模式：直接返回验证码（开发/未配置环境）
    smsCodeStore[phone] = {
        code: verifyCode,
        expireAt: Date.now() + SMS_CODE_TTL,
        sentAt: Date.now()
    };
    console.log(`[SMS] [演示模式] 验证码已发送到 ${phone}: ${verifyCode}`);
    res.json({
        code: 0,
        msg: '验证码已发送（演示模式）',
        data: { phone, code: verifyCode, expires_in: ttlSec, demo: true }
    });
});

// POST /api/auth/sms-login  body: { phone, code }
router.post('/sms-login', (req, res) => {
    const { phone, code } = req.body || {};
    if (!phone || !code) {
        return res.status(400).json({ code: 1, msg: '手机号和验证码不能为空' });
    }

    const record = smsCodeStore[phone];
    if (!record) {
        return res.status(400).json({ code: 1, msg: '请先获取验证码' });
    }
    if (Date.now() > record.expireAt) {
        delete smsCodeStore[phone];
        return res.status(400).json({ code: 1, msg: '验证码已过期，请重新获取' });
    }
    if (record.code !== code) {
        return res.status(400).json({ code: 1, msg: '验证码错误' });
    }

    // 验证通过，删除验证码
    delete smsCodeStore[phone];

    // 查找是否已绑定该手机号的用户
    const accounts = db.list('accounts');
    let account = accounts.find(a => a.phone === phone);

    if (account) {
        const user = db.findById('users', account.user_id);
        const token = genToken(account.user_id);
        tokenStore[token] = account.user_id;
        return res.json({
            code: 0,
            msg: '验证码登录成功',
            data: { token, user_id: account.user_id, user, is_new: false }
        });
    }

    // 新手机号：自动注册
    const userId = 'u_' + Date.now().toString(36);
    const accountId = 'acc_' + Date.now().toString(36);
    account = db.insert('accounts', {
        id: accountId,
        user_id: userId,
        username: 'phone_' + phone.slice(-4),
        password: hashPwd('sms_auto_' + phone),
        phone
    });
    const user = db.insert('users', {
        id: userId,
        name: '同学' + phone.slice(-4),
        grade: '高三',
        province: '浙江',
        target_score: 633,
        current_score: 500,
        exam_date: '2026-06-07',
        phone
    });
    const token = genToken(userId);
    tokenStore[token] = userId;

    res.json({
        code: 0,
        msg: '验证码登录成功，已为你创建账号',
        data: { token, user_id: userId, user, is_new: true }
    });
});

// ========== 家长绑定 ==========
// POST /api/auth/parent-bind  body: { student_phone, parent_phone, relation, sms_code }
router.post('/parent-bind', (req, res) => {
    const { student_phone, parent_phone, relation, sms_code } = req.body || {};
    if (!student_phone || !parent_phone || !relation) {
        return res.status(400).json({ code: 1, msg: '学生账号、家长手机号和关系不能为空' });
    }
    if (!/^1\d{10}$/.test(student_phone)) {
        return res.status(400).json({ code: 1, msg: '学生手机号格式不正确' });
    }
    if (!/^1\d{10}$/.test(parent_phone)) {
        return res.status(400).json({ code: 1, msg: '家长手机号格式不正确' });
    }
    if (!['父亲', '母亲', '其他'].includes(relation)) {
        return res.status(400).json({ code: 1, msg: '关系类型不正确' });
    }

    // 验证家长短信验证码（如果提供了）
    if (sms_code) {
        const record = smsCodeStore[parent_phone];
        if (!record) {
            return res.status(400).json({ code: 1, msg: '请先获取家长手机验证码' });
        }
        if (Date.now() > record.expireAt) {
            delete smsCodeStore[parent_phone];
            return res.status(400).json({ code: 1, msg: '验证码已过期' });
        }
        if (record.code !== sms_code) {
            return res.status(400).json({ code: 1, msg: '验证码错误' });
        }
        delete smsCodeStore[parent_phone];
    }

    // 查找学生账号
    const accounts = db.list('accounts');
    const studentAccount = accounts.find(a => a.phone === student_phone);
    if (!studentAccount) {
        return res.status(404).json({ code: 1, msg: '学生账号不存在，请确认手机号是否正确' });
    }

    // 检查是否已绑定
    const parents = db.list('parent_bindings');
    if (parents.find(p => p.student_id === studentAccount.user_id && p.parent_phone === parent_phone)) {
        return res.status(409).json({ code: 1, msg: '该家长已绑定此学生账号' });
    }

    // 检查绑定数量（最多3个家长）
    const existingBindings = parents.filter(p => p.student_id === studentAccount.user_id);
    if (existingBindings.length >= 3) {
        return res.status(400).json({ code: 1, msg: '一个学生账号最多可绑定3个家长' });
    }

    // 创建绑定
    const binding = db.insert('parent_bindings', {
        id: 'bind_' + Date.now().toString(36),
        student_id: studentAccount.user_id,
        parent_phone,
        relation,
        status: 'pending',
        created_at: new Date().toISOString()
    });

    res.json({
        code: 0,
        msg: '家长绑定申请已提交，等待学生确认',
        data: { binding, status: 'pending' }
    });
});

// GET /api/auth/parent-bindings  获取某学生的家长绑定列表
router.get('/parent-bindings', (req, res) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const userId = tokenStore[token];
    if (!userId) {
        return res.status(401).json({ code: 1, msg: '未登录' });
    }
    const bindings = db.list('parent_bindings').filter(b => b.student_id === userId);
    res.json({ code: 0, data: bindings });
});

// POST /api/auth/parent-bindings/:id/confirm  学生确认家长绑定
router.post('/parent-bindings/:id/confirm', (req, res) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    const userId = tokenStore[token];
    if (!userId) {
        return res.status(401).json({ code: 1, msg: '未登录' });
    }
    const binding = db.findById('parent_bindings', req.params.id);
    if (!binding) {
        return res.status(404).json({ code: 1, msg: '绑定记录不存在' });
    }
    if (binding.student_id !== userId) {
        return res.status(403).json({ code: 1, msg: '无权操作' });
    }
    const updated = db.update('parent_bindings', req.params.id, { status: 'confirmed' });
    res.json({ code: 0, msg: '已确认绑定', data: updated });
});

// ========== 获取当前登录用户 ==========
// GET /api/auth/me  header: { Authorization: Bearer <token> }
router.get('/me', (req, res) => {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    if (!token || !tokenStore[token]) {
        return res.status(401).json({ code: 1, msg: '未登录或登录已过期' });
    }
    const userId = tokenStore[token];
    const user = db.findById('users', userId);
    if (!user) {
        delete tokenStore[token];
        return res.status(401).json({ code: 1, msg: '用户不存在' });
    }
    res.json({ code: 0, data: { user_id: userId, user } });
});

// ========== 微信扫码登录 ==========
// 扫码会话存储：{ sceneId: { status, openid, user, token, expireAt, code, sseClients:[] } }
const wechatScanSessions = {};
const SCAN_TTL = 5 * 60 * 1000; // 5分钟过期

// 限流：每 IP 每分钟最多 10 次生成二维码 / 刷新，防滥用
const qrRateLimit = { windowMs: 60 * 1000, max: 10, hits: {} };
function qrRateCheck(ip) {
    const now = Date.now();
    const rec = qrRateLimit.hits[ip] || { count: 0, resetAt: now + qrRateLimit.windowMs };
    if (now > rec.resetAt) { rec.count = 0; rec.resetAt = now + qrRateLimit.windowMs; }
    rec.count++;
    qrRateLimit.hits[ip] = rec;
    // 清理过期记录（避免内存泄漏）
    if (Object.keys(qrRateLimit.hits).length > 1000) {
        for (const k of Object.keys(qrRateLimit.hits)) {
            if (now > (qrRateLimit.hits[k].resetAt || 0)) delete qrRateLimit.hits[k];
        }
    }
    return rec.count <= qrRateLimit.max;
}

// 反向代理友好的 host 解析：优先取 X-Forwarded-* 头
function resolveExternalURL(req) {
    const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim();
    const host = (req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000').split(',')[0].trim();
    return `${proto}://${host}`;
}

// 清理过期会话（同时关闭挂起的 SSE 客户端）
function cleanExpiredScanSessions() {
    const now = Date.now();
    Object.keys(wechatScanSessions).forEach(sid => {
        const s = wechatScanSessions[sid];
        if (s.expireAt < now) {
            // 通知挂起的 SSE 客户端会话已过期
            if (Array.isArray(s.sseClients) && s.sseClients.length) {
                broadcastScanStatus(s, { status: 'expired', msg: '二维码已过期' });
            }
            delete wechatScanSessions[sid];
        }
    });
}
setInterval(cleanExpiredScanSessions, 60000);

// 向该 scene 的所有 SSE 客户端推送状态
function broadcastScanStatus(session, payload) {
    if (!session || !Array.isArray(session.sseClients) || !session.sseClients.length) return;
    const data = `data: ${JSON.stringify({ code: 0, data: payload })}\n\n`;
    session.sseClients = session.sseClients.filter(res => {
        try { res.write(data); return true; }
        catch { return false; } // 写入失败（客户端已断开）则移除
    });
}

// 生成二维码图片的函数（使用免费二维码服务返回图片URL，也可本地用库生成）
function genQRCodeURL(text, size) {
    size = size || 220;
    const data = encodeURIComponent(text);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${data}`;
}

// 1. 创建扫码会话，返回二维码
// GET /api/auth/wechat-qrcode
router.get('/wechat-qrcode', (req, res) => {
    const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
    if (!qrRateCheck(clientIp)) {
        return res.status(429).json({ code: 1, msg: '请求过于频繁，请稍后再试' });
    }
    cleanExpiredScanSessions();
    const sceneId = 'wx_scene_' + crypto.randomBytes(8).toString('hex');
    const now = Date.now();
    wechatScanSessions[sceneId] = {
        sceneId,
        status: 'pending', // pending -> waiting_confirm -> confirmed/expired/cancelled
        expireAt: now + SCAN_TTL,
        createdAt: now,
        openid: null,
        user: null,
        token: null,
        is_new: false,
        sseClients: []
    };
    const base = resolveExternalURL(req);
    const scanURL = `${base}/api/auth/wechat-scan-callback?scene=${sceneId}`;
    const qrCode = genQRCodeURL(scanURL, 240);
    res.json({
        code: 0,
        data: {
            scene_id: sceneId,
            // scan_url：扫码内容（真实可被微信识别的回调URL），前端用本地生成器据此画二维码
            scan_url: scanURL,
            // qrcode_url / fallback_qrcode：兼容旧前端的图片URL（云端无后端时由前端本地生成）
            qrcode_url: qrCode,
            fallback_qrcode: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(scanURL)}`,
            expires_in: Math.floor(SCAN_TTL / 1000),
            scan_hint: '请使用微信扫一扫登录'
        }
    });
});

// 2. 轮询扫码状态
// GET /api/auth/wechat-qrcode-status?scene_id=xxx
router.get('/wechat-qrcode-status', (req, res) => {
    const { scene_id } = req.query;
    const session = wechatScanSessions[scene_id];
    if (!session) {
        return res.json({ code: 0, data: { status: 'expired', msg: '会话不存在或已过期' } });
    }
    if (session.expireAt < Date.now()) {
        session.status = 'expired';
        delete wechatScanSessions[scene_id];
        return res.json({ code: 0, data: { status: 'expired', msg: '二维码已过期，请刷新' } });
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
    res.json({ code: 0, data: payload });
});

// 3. 模拟扫码（微信端扫码回调，实际生产应由微信服务器回调）
// POST /api/auth/wechat-mock-scan  body: { scene_id, action: 'scan'|'confirm'|'cancel' }
router.post('/wechat-mock-scan', (req, res) => {
    const { scene_id, action, mock_openid } = req.body || {};
    const session = wechatScanSessions[scene_id];
    if (!session || session.expireAt < Date.now()) {
        return res.status(400).json({ code: 1, msg: '二维码已过期，请重新生成' });
    }

    if (action === 'scan') {
        session.status = 'waiting_confirm';
        session.openid = mock_openid || ('wx_mock_' + crypto.randomBytes(6).toString('hex'));
        broadcastScanStatus(session, { status: 'waiting_confirm', msg: '已扫码，请在微信上确认登录' });
        return res.json({ code: 0, msg: '已扫码，等待用户确认', data: { status: session.status } });
    }

    if (action === 'cancel') {
        session.status = 'cancelled';
        broadcastScanStatus(session, { status: 'cancelled', msg: '用户已取消登录' });
        return res.json({ code: 0, msg: '用户已取消登录', data: { status: session.status } });
    }

    if (action === 'confirm') {
        const openid = session.openid || mock_openid || ('wx_mock_' + crypto.randomBytes(6).toString('hex'));
        const accounts = db.list('accounts');
        let account = accounts.find(a => a.wechat_openid === openid);
        let user, userId, isNew = false;

        if (account) {
            userId = account.user_id;
            user = db.findById('users', userId);
        } else {
            userId = 'u_' + Date.now().toString(36);
            const accountId = 'acc_' + Date.now().toString(36);
            account = db.insert('accounts', {
                id: accountId,
                user_id: userId,
                username: 'wx_' + openid.slice(-6),
                password: hashPwd('wx_auto_' + openid),
                wechat_openid: openid
            });
            user = db.insert('users', {
                id: userId,
                name: '微信用户',
                grade: '高三',
                province: '浙江',
                target_score: 633,
                current_score: 500,
                exam_date: '2026-06-07',
                avatar_type: 'wechat'
            });
            isNew = true;
        }

        const token = genToken(userId);
        tokenStore[token] = userId;
        session.status = 'confirmed';
        session.openid = openid;
        session.token = token;
        session.user = user;
        session.user_id = userId;
        session.is_new = isNew;
        broadcastScanStatus(session, { status: 'confirmed', msg: '登录成功', token, user_id: userId, user, is_new: isNew });

        return res.json({
            code: 0,
            msg: isNew ? '扫码登录成功，已为你创建账号' : '扫码登录成功',
            data: { status: 'confirmed', token, user_id: userId, user, is_new: isNew }
        });
    }

    res.status(400).json({ code: 1, msg: '未知操作: ' + action });
});

// 4. 真实微信扫码回调占位（实际场景微信服务器会带 code 到此地址）
// GET /api/auth/wechat-scan-callback?scene=xxx&code=xxx
router.get('/wechat-scan-callback', (req, res) => {
    const { scene, code } = req.query;
    const session = wechatScanSessions[scene];
    if (!session) {
        return res.send('<h2>登录二维码已失效</h2><p>请返回登录页重新生成二维码</p>');
    }
    // 自动把扫码动作当作 scan + confirm（便于演示点击URL即完成登录）
    const openid = code ? ('wx_' + crypto.createHash('md5').update(code).digest('hex').slice(0, 16)) : session.openid || ('wx_mock_' + crypto.randomBytes(6).toString('hex'));
    const accounts = db.list('accounts');
    let account = accounts.find(a => a.wechat_openid === openid);
    let user, userId, isNew = false;
    if (account) {
        userId = account.user_id;
        user = db.findById('users', userId);
    } else {
        userId = 'u_' + Date.now().toString(36);
        const accountId = 'acc_' + Date.now().toString(36);
        account = db.insert('accounts', {
            id: accountId, user_id: userId,
            username: 'wx_' + openid.slice(-6),
            password: hashPwd('wx_auto_' + openid),
            wechat_openid: openid
        });
        user = db.insert('users', {
            id: userId, name: '微信用户', grade: '高三', province: '浙江',
            target_score: 633, current_score: 500, exam_date: '2026-06-07', avatar_type: 'wechat'
        });
        isNew = true;
    }
    const token = genToken(userId);
    tokenStore[token] = userId;
    session.status = 'confirmed';
    session.token = token;
    session.user = user;
    session.user_id = userId;
    session.is_new = isNew;
    broadcastScanStatus(session, { status: 'confirmed', msg: '登录成功', token, user_id: userId, user, is_new: isNew });

    res.send(`
        <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <title>微信扫码登录成功</title>
        <style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F0F9F4;}
        .card{background:white;border-radius:16px;padding:32px 28px;text-align:center;box-shadow:0 10px 40px rgba(7,193,96,.15);max-width:340px;}
        .icon{width:64px;height:64px;border-radius:50%;background:#07C160;color:white;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:30px;}
        h1{font-size:20px;margin:0 0 8px;color:#111827;}p{color:#6B7280;margin:0;font-size:14px;line-height:1.6;}</style></head>
        <body><div class="card"><div class="icon">✓</div><h1>扫码登录成功</h1><p>欢迎回来，${user.name || '微信用户'}<br/>请返回 AI 高考 应用，页面会自动跳转到首页</p></div></body></html>
    `);
});

// 5. 取消/刷新扫码会话
// POST /api/auth/wechat-qrcode-cancel  body: { scene_id }
router.post('/wechat-qrcode-cancel', (req, res) => {
    const { scene_id } = req.body || {};
    if (scene_id && wechatScanSessions[scene_id]) {
        wechatScanSessions[scene_id].status = 'cancelled';
        broadcastScanStatus(wechatScanSessions[scene_id], { status: 'cancelled', msg: '用户已取消登录' });
    }
    res.json({ code: 0, msg: '已取消' });
});

// 6. SSE 实时状态推送（替代轮询，节省带宽与服务器开销）
// GET /api/auth/wechat-qrcode-stream?scene_id=xxx  → text/event-stream
router.get('/wechat-qrcode-stream', (req, res) => {
    const { scene_id } = req.query;
    const session = wechatScanSessions[scene_id];
    if (!session) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.write(`data: ${JSON.stringify({ code: 0, data: { status: 'expired', msg: '会话不存在或已过期' } })}\n\n`);
        return res.end();
    }
    if (session.expireAt < Date.now()) {
        session.status = 'expired';
        delete wechatScanSessions[scene_id];
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.write(`data: ${JSON.stringify({ code: 0, data: { status: 'expired', msg: '二维码已过期，请刷新' } })}\n\n`);
        return res.end();
    }
    // SSE headers（禁用压缩与缓冲，确保实时推送）
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Nginx 反代下关闭缓冲

    // 注册客户端
    if (!Array.isArray(session.sseClients)) session.sseClients = [];
    session.sseClients.push(res);

    // 立即推送一次当前状态，便于前端同步展示
    const initPayload = { status: session.status };
    if (session.status === 'confirmed') {
        initPayload.token = session.token;
        initPayload.user = session.user;
        initPayload.user_id = session.user_id;
        initPayload.is_new = session.is_new;
        initPayload.msg = '登录成功';
    } else if (session.status === 'waiting_confirm') {
        initPayload.msg = '已扫码，请在微信上确认登录';
    } else if (session.status === 'cancelled') {
        initPayload.msg = '用户取消了登录';
    } else {
        initPayload.msg = '等待扫码中...';
    }
    res.write(`data: ${JSON.stringify({ code: 0, data: initPayload })}\n\n`);

    // 心跳：每 15s 推送一次注释行，防止代理超时断开
    const heartbeat = setInterval(() => {
        try { res.write(`: keepalive ${Date.now()}\n\n`); }
        catch { clearInterval(heartbeat); }
    }, 15000);

    // 客户端断开：清理
    const cleanup = () => {
        clearInterval(heartbeat);
        const idx = session.sseClients ? session.sseClients.indexOf(res) : -1;
        if (idx >= 0) session.sseClients.splice(idx, 1);
    };
    req.on('close', cleanup);
    req.on('error', cleanup);
});

// 7. 同 scene 刷新二维码（保留 scene_id，重置过期时间与状态）
// POST /api/auth/wechat-qrcode-refresh  body: { scene_id }
router.post('/wechat-qrcode-refresh', (req, res) => {
    const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
    if (!qrRateCheck(clientIp)) {
        return res.status(429).json({ code: 1, msg: '请求过于频繁，请稍后再试' });
    }
    const { scene_id } = req.body || {};
    const session = wechatScanSessions[scene_id];
    if (!session) {
        return res.status(404).json({ code: 1, msg: '会话不存在，请重新生成二维码' });
    }
    const now = Date.now();
    session.status = 'pending';
    session.expireAt = now + SCAN_TTL;
    session.createdAt = now;
    session.openid = null;
    session.user = null;
    session.token = null;
    session.user_id = null;
    session.is_new = false;
    const base = resolveExternalURL(req);
    const scanURL = `${base}/api/auth/wechat-scan-callback?scene=${scene_id}`;
    broadcastScanStatus(session, { status: 'pending', msg: '二维码已刷新，请重新扫码' });
    res.json({
        code: 0,
        data: {
            scene_id,
            scan_url: scanURL,
            qrcode_url: genQRCodeURL(scanURL, 240),
            fallback_qrcode: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(scanURL)}`,
            expires_in: Math.floor(SCAN_TTL / 1000),
            scan_hint: '请使用微信扫一扫登录'
        }
    });
});

// 导出 token 校验函数（供其他路由可选使用）
function getUserIdFromToken(req) {
    const token = (req.headers.authorization || '').replace('Bearer ', '');
    return tokenStore[token] || null;
}

module.exports = router;
module.exports.getUserIdFromToken = getUserIdFromToken;
