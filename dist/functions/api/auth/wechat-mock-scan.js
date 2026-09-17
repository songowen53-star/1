// POST /api/auth/wechat-mock-scan — 模拟微信扫码（scan/confirm/cancel）
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
        const { scene_id, action, mock_openid } = body;

        if (!env.DATA_STORE) {
            return Response.json({ code: 1, msg: '数据存储不可用' }, { status: 500 });
        }

        const raw = await env.DATA_STORE.get('wx_scan_' + scene_id);
        if (!raw) {
            return Response.json({ code: 1, msg: '二维码已过期，请重新生成' }, { status: 400 });
        }
        const session = JSON.parse(raw);
        if (session.expireAt < Date.now()) {
            return Response.json({ code: 1, msg: '二维码已过期，请重新生成' }, { status: 400 });
        }

        if (action === 'scan') {
            session.status = 'waiting_confirm';
            session.openid = mock_openid || ('wx_mock_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12));
            await env.DATA_STORE.put('wx_scan_' + scene_id, JSON.stringify(session), { expirationTtl: 300 });
            return Response.json({ code: 0, msg: '已扫码，等待用户确认', data: { status: session.status } });
        }

        if (action === 'cancel') {
            session.status = 'cancelled';
            await env.DATA_STORE.put('wx_scan_' + scene_id, JSON.stringify(session), { expirationTtl: 300 });
            return Response.json({ code: 0, msg: '用户已取消登录', data: { status: session.status } });
        }

        if (action === 'confirm') {
            const openid = session.openid || mock_openid || ('wx_mock_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12));
            const accounts = await listTable(env, 'accounts');
            let account = accounts.find(a => a.wechat_openid === openid);
            let user, userId, isNew = false;

            if (account) {
                userId = account.user_id;
                const users = await listTable(env, 'users');
                user = users.find(u => u.id === userId);
            } else {
                userId = 'u_' + Date.now().toString(36);
                const newAccount = {
                    id: 'acc_' + Date.now().toString(36), user_id: userId,
                    username: 'wx_' + openid.slice(-6),
                    password: await hashPwd('wx_auto_' + openid),
                    wechat_openid: openid
                };
                // 保存 account
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
            await env.DATA_STORE.put('wx_scan_' + scene_id, JSON.stringify(session), { expirationTtl: 300 });

            return Response.json({
                code: 0,
                msg: isNew ? '扫码登录成功，已为你创建账号' : '扫码登录成功',
                data: { status: 'confirmed', token, user_id: userId, user, is_new: isNew }
            });
        }

        return Response.json({ code: 1, msg: '未知操作: ' + action }, { status: 400 });
    } catch (e) {
        return Response.json({ code: 1, msg: '操作失败: ' + e.message }, { status: 500 });
    }
}
