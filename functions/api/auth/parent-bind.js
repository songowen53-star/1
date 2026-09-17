// POST /api/auth/parent-bind — 家长绑定
import { listTable } from '../../_shared/kv-db.js';

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { student_phone, parent_phone, relation, sms_code } = body;

        if (!student_phone || !parent_phone || !relation) {
            return Response.json({ code: 1, msg: '学生账号、家长手机号和关系不能为空' }, { status: 400 });
        }
        if (!/^1\d{10}$/.test(student_phone)) {
            return Response.json({ code: 1, msg: '学生手机号格式不正确' }, { status: 400 });
        }
        if (!/^1\d{10}$/.test(parent_phone)) {
            return Response.json({ code: 1, msg: '家长手机号格式不正确' }, { status: 400 });
        }
        if (!['父亲', '母亲', '其他'].includes(relation)) {
            return Response.json({ code: 1, msg: '关系类型不正确' }, { status: 400 });
        }

        // 验证短信验证码
        if (sms_code && env.DATA_STORE) {
            const raw = await env.DATA_STORE.get('sms_code_' + parent_phone);
            if (!raw) {
                return Response.json({ code: 1, msg: '请先获取家长手机验证码' }, { status: 400 });
            }
            const record = JSON.parse(raw);
            if (Date.now() > record.expireAt) {
                return Response.json({ code: 1, msg: '验证码已过期' }, { status: 400 });
            }
            if (record.code !== sms_code) {
                return Response.json({ code: 1, msg: '验证码错误' }, { status: 400 });
            }
            await env.DATA_STORE.delete('sms_code_' + parent_phone);
        }

        // 查找学生账号
        const accounts = await listTable(env, 'accounts');
        const studentAccount = accounts.find(a => a.phone === student_phone);
        if (!studentAccount) {
            return Response.json({ code: 1, msg: '学生账号不存在，请确认手机号是否正确' }, { status: 404 });
        }

        // 保存绑定
        const binding = {
            id: 'bind_' + Date.now().toString(36),
            student_id: studentAccount.user_id,
            parent_phone, relation, status: 'pending',
            created_at: new Date().toISOString()
        };

        if (env.DATA_STORE) {
            const raw = await env.DATA_STORE.get('parent_bindings.json');
            let list = raw ? JSON.parse(raw) : [];
            if (list.find(p => p.student_id === studentAccount.user_id && p.parent_phone === parent_phone)) {
                return Response.json({ code: 1, msg: '该家长已绑定此学生账号' }, { status: 409 });
            }
            if (list.filter(p => p.student_id === studentAccount.user_id).length >= 3) {
                return Response.json({ code: 1, msg: '一个学生账号最多可绑定3个家长' }, { status: 400 });
            }
            list.push(binding);
            await env.DATA_STORE.put('parent_bindings.json', JSON.stringify(list, null, 2));
        }

        return Response.json({ code: 0, msg: '家长绑定申请已提交，等待学生确认', data: { binding, status: 'pending' } });
    } catch (e) {
        return Response.json({ code: 1, msg: '绑定失败: ' + e.message }, { status: 500 });
    }
}
