// GET /api/auth/me — 获取当前登录用户
import { listTable } from '../../_shared/kv-db.js';

export async function onRequestGet({ request, env }) {
    try {
        const token = (request.headers.get('Authorization') || '').replace('Bearer ', '');
        if (!token) {
            return Response.json({ code: 1, msg: '未登录或登录已过期' }, { status: 401 });
        }

        // 从 KV 读取 token 映射
        if (env.DATA_STORE) {
            const userId = await env.DATA_STORE.get('token_' + token);
            if (!userId) {
                return Response.json({ code: 1, msg: '未登录或登录已过期' }, { status: 401 });
            }

            const users = await listTable(env, 'users');
            const user = users.find(u => u.id === userId);
            if (!user) {
                return Response.json({ code: 1, msg: '用户不存在' }, { status: 401 });
            }

            return Response.json({ code: 0, data: { user_id: userId, user } });
        }

        // 无 KV 时返回演示用户
        const users = await listTable(env, 'users');
        const demoUser = users[0] || { id: 'u_demo', name: '李同学', grade: '高三', province: '浙江', target_score: 633, current_score: 580 };
        return Response.json({ code: 0, data: { user_id: demoUser.id, user: demoUser } });
    } catch (e) {
        return Response.json({ code: 1, msg: '获取用户信息失败: ' + e.message }, { status: 500 });
    }
}
