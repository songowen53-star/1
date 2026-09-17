// POST /api/auth/login — 密码登录
import { listTable } from '../../_shared/kv-db.js';

async function hashPwd(pwd) {
    const data = new TextEncoder().encode(pwd + '::aigaokao_salt');
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function genToken(userId) {
    return crypto.randomUUID().replace(/-/g, '') + Date.now().toString(36);
}

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { username, password } = body;
        if (!username || !password) {
            return Response.json({ code: 1, msg: '用户名和密码不能为空' }, { status: 400 });
        }

        const accounts = await listTable(env, 'accounts');
        const account = accounts.find(a => a.username === username);

        if (!account) {
            // 尝试演示账户
            if (env.DATA_STORE) {
                const usersRaw = await env.DATA_STORE.get('users.json');
                const users = usersRaw ? JSON.parse(usersRaw) : [];
                const demoUser = users.find(u => u.id === username);
                if (demoUser) {
                    const token = genToken(username);
                    await env.DATA_STORE.put('token_' + token, username, { expirationTtl: 86400 });
                    return Response.json({ code: 0, msg: '登录成功', data: { token, user_id: username, user: demoUser } });
                }
            }
            return Response.json({ code: 1, msg: '用户名或密码错误' }, { status: 401 });
        }

        if (account.password !== await hashPwd(password)) {
            return Response.json({ code: 1, msg: '用户名或密码错误' }, { status: 401 });
        }

        // 查找用户档案
        const users = await listTable(env, 'users');
        const user = users.find(u => u.id === account.user_id);
        if (!user) {
            return Response.json({ code: 1, msg: '用户档案缺失' }, { status: 500 });
        }

        const token = genToken(account.user_id);
        if (env.DATA_STORE) {
            await env.DATA_STORE.put('token_' + token, account.user_id, { expirationTtl: 86400 });
        }

        return Response.json({ code: 0, msg: '登录成功', data: { token, user_id: account.user_id, user } });
    } catch (e) {
        return Response.json({ code: 1, msg: '登录失败: ' + e.message }, { status: 500 });
    }
}
