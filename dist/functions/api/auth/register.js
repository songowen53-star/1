// POST /api/auth/register — 密码注册
// body: { username(phone), password, name?, grade?, province? }
import { listTable } from '../../_shared/kv-db.js';

// 简单哈希（与后端保持一致）
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
        const username = body.username;
        const password = body.password;
        const name = body.name;
        const grade = body.grade || '高三';
        const province = body.province || '浙江';

        if (!username || !password) {
            return Response.json({ code: 1, msg: '用户名和密码不能为空' }, { status: 400 });
        }
        if (username.length < 3 || username.length > 20) {
            return Response.json({ code: 1, msg: '用户名长度需3-20位' }, { status: 400 });
        }
        if (password.length < 6) {
            return Response.json({ code: 1, msg: '密码至少6位' }, { status: 400 });
        }

        // 读取已有账号列表
        const accounts = await listTable(env, 'accounts');
        if (accounts.find(a => a.username === username)) {
            return Response.json({ code: 1, msg: '用户名已被注册' }, { status: 409 });
        }

        // 创建账户
        const userId = 'u_' + Date.now().toString(36);
        const accountId = 'acc_' + Date.now().toString(36);
        const newAccount = {
            id: accountId,
            user_id: userId,
            username,
            password: await hashPwd(password)
        };

        const newUser = {
            id: userId,
            name: name || username,
            grade,
            province,
            target_score: 633,
            current_score: 500,
            exam_date: '2026-06-07'
        };

        // 保存到 KV
        if (env.DATA_STORE) {
            const accountsData = await env.DATA_STORE.get('accounts.json');
            let accountsList = accountsData ? JSON.parse(accountsData) : [];
            accountsList.push(newAccount);
            await env.DATA_STORE.put('accounts.json', JSON.stringify(accountsList, null, 2));

            const usersData = await env.DATA_STORE.get('users.json');
            let usersList = usersData ? JSON.parse(usersData) : [];
            usersList.push(newUser);
            await env.DATA_STORE.put('users.json', JSON.stringify(usersList, null, 2));

            // 存储 token 映射
            const token = genToken(userId);
            await env.DATA_STORE.put('token_' + token, userId, { expirationTtl: 86400 });
        }

        const token = genToken(userId);
        return Response.json({
            code: 0,
            msg: '注册成功',
            data: { token, user_id: userId, user: newUser }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '注册失败: ' + e.message }, { status: 500 });
    }
}
