// POST /api/auth/sms-login — 手机验证码登录
import { listTable } from '../../_shared/kv-db.js';

function genToken(userId) {
    return crypto.randomUUID().replace(/-/g, '') + Date.now().toString(36);
}

async function hashPwd(pwd) {
    const data = new TextEncoder().encode(pwd + '::aigaokao_salt');
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { phone, code } = body;
        if (!phone || !code) {
            return Response.json({ code: 1, msg: '手机号和验证码不能为空' }, { status: 400 });
        }

        // 从 KV 读取验证码
        let smsRecord = null;
        if (env.DATA_STORE) {
            const raw = await env.DATA_STORE.get('sms_code_' + phone);
            smsRecord = raw ? JSON.parse(raw) : null;
        }

        if (!smsRecord) {
            return Response.json({ code: 1, msg: '请先获取验证码' }, { status: 400 });
        }
        if (Date.now() > smsRecord.expireAt) {
            return Response.json({ code: 1, msg: '验证码已过期，请重新获取' }, { status: 400 });
        }
        if (smsRecord.code !== code) {
            return Response.json({ code: 1, msg: '验证码错误' }, { status: 400 });
        }

        // 验证通过，删除验证码
        if (env.DATA_STORE) {
            await env.DATA_STORE.delete('sms_code_' + phone);
        }

        // 查找用户
        const accounts = await listTable(env, 'accounts');
        let account = accounts.find(a => a.phone === phone);

        if (account) {
            const users = await listTable(env, 'users');
            const user = users.find(u => u.id === account.user_id);
            const token = genToken(account.user_id);
            if (env.DATA_STORE) {
                await env.DATA_STORE.put('token_' + token, account.user_id, { expirationTtl: 86400 });
            }
            return Response.json({ code: 0, msg: '验证码登录成功', data: { token, user_id: account.user_id, user, is_new: false } });
        }

        // 新手机号：自动注册
        const userId = 'u_' + Date.now().toString(36);
        const accountId = 'acc_' + Date.now().toString(36);
        const newAccount = { id: accountId, user_id: userId, username: 'phone_' + phone.slice(-4), password: await hashPwd('sms_auto_' + phone), phone };
        const newUser = { id: userId, name: '同学' + phone.slice(-4), grade: '高三', province: '浙江', target_score: 633, current_score: 500, exam_date: '2026-06-07', phone };

        if (env.DATA_STORE) {
            const accountsData = await env.DATA_STORE.get('accounts.json');
            let accountsList = accountsData ? JSON.parse(accountsData) : [];
            accountsList.push(newAccount);
            await env.DATA_STORE.put('accounts.json', JSON.stringify(accountsList, null, 2));

            const usersData = await env.DATA_STORE.get('users.json');
            let usersList = usersData ? JSON.parse(usersData) : [];
            usersList.push(newUser);
            await env.DATA_STORE.put('users.json', JSON.stringify(usersList, null, 2));

            const token = genToken(userId);
            await env.DATA_STORE.put('token_' + token, userId, { expirationTtl: 86400 });
            return Response.json({ code: 0, msg: '验证码登录成功，已为你创建账号', data: { token, user_id: userId, user: newUser, is_new: true } });
        }

        const token = genToken(userId);
        return Response.json({ code: 0, msg: '验证码登录成功，已为你创建账号', data: { token, user_id: userId, user: newUser, is_new: true } });
    } catch (e) {
        return Response.json({ code: 1, msg: '登录失败: ' + e.message }, { status: 500 });
    }
}
