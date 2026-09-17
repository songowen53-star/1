// ========== Token 鉴权中间件 ==========
// 应用于 AI 等需要登录态的路由
// Token 来源优先级：Authorization: Bearer <token> 头 → body.token → query.token
const { verifyToken } = require('../auth-store');

function extractToken(req) {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) return header.slice(7).trim();
    if (req.body && req.body.token) return req.body.token;
    if (req.query && req.query.token) return req.query.token;
    return null;
}

// 强制鉴权：无有效 token 返回 401
function requireAuth(req, res, next) {
    const token = extractToken(req);
    const userId = verifyToken(token);
    if (!userId) {
        return res.status(401).json({ code: 401, msg: '未登录或 token 已失效，请重新登录' });
    }
    req.userId = userId;
    req.token = token;
    next();
}

// 可选鉴权：有 token 则注入 userId，无则放行（用于兼容游客体验的接口）
function optionalAuth(req, res, next) {
    const token = extractToken(req);
    const userId = verifyToken(token);
    if (userId) {
        req.userId = userId;
        req.token = token;
    }
    next();
}

module.exports = { requireAuth, optionalAuth, extractToken };
