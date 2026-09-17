// GET /api/users/:id — 用户信息（首页 AI今日提分：当前分数/目标分数/省份/高考时间）
import { listTable } from '../../_shared/kv-db.js';

export async function onRequestGet({ params, env }) {
    try {
        const userId = params.id || 'u_001';
        const users = await listTable(env, 'users');
        const user = users.find(u => u.id === userId) || users[0] || {
            id: userId,
            name: '张同学',
            grade: '高三',
            province: '四川',
            target_score: 650,
            current_score: 580,
            exam_date: '2027-06-07'
        };
        return Response.json({ code: 0, data: user });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载用户信息失败: ' + e.message }, { status: 500 });
    }
}
