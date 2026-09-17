// ========== 用户路由 ==========
// 用户信息管理 + 目标分设置
const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取用户信息
router.get('/:id', (req, res) => {
    const user = db.findById('users', req.params.id);
    if (!user) return res.status(404).json({ code: 1, msg: '用户不存在' });
    res.json({ code: 0, data: user });
});

// 获取所有用户
router.get('/', (req, res) => {
    res.json({ code: 0, data: db.list('users') });
});

// 更新用户信息（如目标分）
// PUT /api/users/:id  body: { target_score, current_score, vip_level, vip_expire, ... }
router.put('/:id', (req, res) => {
    const user = db.update('users', req.params.id, req.body);
    if (!user) return res.status(404).json({ code: 1, msg: '用户不存在' });
    res.json({ code: 0, data: user, msg: '更新成功' });
});

// 会员权益查询
// GET /api/users/:id/membership
router.get('/:id/membership', (req, res) => {
    const user = db.findById('users', req.params.id);
    if (!user) return res.status(404).json({ code: 1, msg: '用户不存在' });

    const now = new Date();
    const expire = user.vip_expire ? new Date(user.vip_expire) : null;
    const isActive = expire ? expire > now : false;
    const daysLeft = isActive ? Math.ceil((expire - now) / 86400000) : 0;

    // 权益配置：不同等级对应不同功能配额
    const VIP_PLANS = {
        free: { ai_chat_daily: 5, predict_reports: 1, download_papers: 0, coach_chat: false, label: '免费版' },
        basic: { ai_chat_daily: 50, predict_reports: 5, download_papers: 3, coach_chat: false, label: '基础版' },
        pro: { ai_chat_daily: 200, predict_reports: 30, download_papers: 20, coach_chat: true, label: '专业版' },
        ultimate: { ai_chat_daily: -1, predict_reports: -1, download_papers: -1, coach_chat: true, label: '旗舰版' }
    };
    const level = user.vip_level || 'free';
    const plan = VIP_PLANS[level] || VIP_PLANS.free;

    res.json({
        code: 0,
        data: {
            user_id: user.id,
            name: user.name,
            vip_level: level,
            vip_label: plan.label,
            vip_active: isActive,
            vip_expire: user.vip_expire || null,
            days_left: daysLeft,
            benefits: {
                ai_chat_daily: plan.ai_chat_daily === -1 ? '无限' : plan.ai_chat_daily,
                predict_reports: plan.predict_reports === -1 ? '无限' : plan.predict_reports,
                download_papers: plan.download_papers === -1 ? '无限' : plan.download_papers,
                ai_coach: plan.coach_chat
            },
            account_target_score: user.target_score || null,
            account_current_score: user.current_score || null
        }
    });
});

// 更新会员等级（运营/支付回调调用）
// PUT /api/users/:id/membership  body: { vip_level: 'free'|'basic'|'pro'|'ultimate', vip_expire: ISO8601, order_id? }
router.put('/:id/membership', (req, res) => {
    const { vip_level, vip_expire, order_id } = req.body || {};
    const valid = ['free', 'basic', 'pro', 'ultimate'];
    if (!vip_level || !valid.includes(vip_level)) {
        return res.status(400).json({ code: 1, msg: 'vip_level 必须为 free|basic|pro|ultimate' });
    }
    const user = db.update('users', req.params.id, {
        vip_level,
        vip_expire: vip_expire || null,
        vip_order_id: order_id || null
    });
    if (!user) return res.status(404).json({ code: 1, msg: '用户不存在' });

    // 记录权益变更日志
    db.insert('membership_logs', {
        user_id: user.id,
        action: 'update',
        vip_level,
        vip_expire: vip_expire || null,
        order_id: order_id || null,
        operator: req.body.operator || 'system'
    });

    res.json({ code: 0, data: user, msg: '会员权益已更新' });
});

// 会员权益变更历史
// GET /api/users/:id/membership/logs
router.get('/:id/membership/logs', (req, res) => {
    const logs = db.find('membership_logs', l => l.user_id === req.params.id);
    logs.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    res.json({ code: 0, data: logs.slice(0, limit), total: logs.length });
});

module.exports = router;
