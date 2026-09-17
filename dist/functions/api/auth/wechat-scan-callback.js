// GET /api/auth/wechat-scan-callback?scene=xxx&code=xxx — 微信扫码回调
import { listTable } from '../../_shared/kv-db.js';

function genToken(userId) {
    return crypto.randomUUID().replace(/-/g, '') + Date.now().toString(36);
}

async function hashPwd(pwd) {
    const data = new TextEncoder().encode(pwd + '::aigaokao_salt');
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestGet({ request, env, url }) {
    try {
        const scene = url.searchParams.get('scene');
        const code = url.searchParams.get('code');

        if (!scene || !env.DATA_STORE) {
            return new Response('<h2>参数缺失</h2>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }

        const raw = await env.DATA_STORE.get('wx_scan_' + scene);
        if (!raw) {
            return new Response('<h2>登录二维码已失效</h2><p>请返回登录页重新生成二维码</p>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
        }
        const session = JSON.parse(raw);

        const openid = code ? ('wx_' + Array.from(new Uint8Array(await crypto.subtle.digest('MD5', new TextEncoder().encode(code)))).map(b => b.toString(16).padStart(2, '0')).slice(0, 16).join('')) : session.openid || ('wx_mock_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12));

        const accounts = await listTable(env, 'accounts');
        let account = accounts.find(a => a.wechat_openid === openid);
        let user, userId, isNew = false;

        if (account) {
            userId = account.user_id;
            const users = await listTable(env, 'users');
            user = users.find(u => u.id === userId);
        } else {
            userId = 'u_' + Date.now().toString(36);
            const newAccount = { id: 'acc_' + Date.now().toString(36), user_id: userId, username: 'wx_' + openid.slice(-6), password: await hashPwd('wx_auto_' + openid), wechat_openid: openid };
            const accountsData = await env.DATA_STORE.get('accounts.json');
            let accountsList = accountsData ? JSON.parse(accountsData) : [];
            accountsList.push(newAccount);
            await env.DATA_STORE.put('accounts.json', JSON.stringify(accountsList, null, 2));

            user = { id: userId, name: '微信用户', grade: '高三', province: '浙江', target_score: 633, current_score: 500, exam_date: '2026-06-07', avatar_type: 'wechat' };
            const usersData = await env.DATA_STORE.get('users.json');
            let usersList = usersData ? JSON.parse(usersData) : [];
            usersList.push(user);
            await env.DATA_STORE.put('users.json', JSON.stringify(usersList, null, 2));
            isNew = true;
        }

        const token = genToken(userId);
        await env.DATA_STORE.put('token_' + token, userId, { expirationTtl: 86400 });
        session.status = 'confirmed';
        session.token = token;
        session.user = user;
        session.user_id = userId;
        session.is_new = isNew;
        await env.DATA_STORE.put('wx_scan_' + scene, JSON.stringify(session), { expirationTtl: 300 });

        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>微信扫码登录成功</title><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#F0F9F4;}.card{background:white;border-radius:16px;padding:32px 28px;text-align:center;box-shadow:0 10px 40px rgba(7,193,96,.15);max-width:340px;}.icon{width:64px;height:64px;border-radius:50%;background:#07C160;color:white;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:30px;}h1{font-size:20px;margin:0 0 8px;color:#111827;}p{color:#6B7280;margin:0;font-size:14px;line-height:1.6;}</style></head><body><div class="card"><div class="icon">✓</div><h1>扫码登录成功</h1><p>欢迎回来，${user.name || '微信用户'}<br/>请返回 AI 高考 应用，页面会自动跳转到首页</p></div></body></html>`;

        return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    } catch (e) {
        return new Response('<h2>登录失败</h2><p>' + e.message + '</p>', { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
}
