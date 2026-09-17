// ========== 共享 Token 存储 ==========
// auth.js（签发）与 middleware/auth.js（校验）共用此 store
// 内存映射：token -> userId（重启后失效，需重新登录）
// 生产环境可替换为 Redis 持久化实现
const tokenStore = {};

// 校验 token，返回 userId 或 null
function verifyToken(token) {
    if (!token) return null;
    return tokenStore[token] || null;
}

// 签发 token 并绑定 userId
function issueToken(token, userId) {
    tokenStore[token] = userId;
}

// 撤销 token
function revokeToken(token) {
    delete tokenStore[token];
}

module.exports = { tokenStore, verifyToken, issueToken, revokeToken };
