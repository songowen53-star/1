// GET    /api/modules/:key — 获取单个模块配置
// PUT    /api/modules/:key  body: { config: {...} } — 保存（创建或更新）模块配置
// DELETE /api/modules/:key — 重置（删除自定义配置，恢复默认）
// 对应后端 backend/routes/modules.js 中的 router.get/put/delete('/:key')
import { listTable } from '../../_shared/kv-db.js';

// module_configs.json 在 KV 中以对象形式存储，此处读取原始对象
async function readConfigs(env) {
    const raw = await env.DATA_STORE.get('module_configs.json');
    if (!raw) return {};
    try {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
            const obj = {};
            data.forEach(item => { if (item && item.module_key) obj[item.module_key] = item; });
            return obj;
        }
        return data || {};
    } catch (e) { return {}; }
}

export async function onRequestGet({ params, env }) {
    try {
        const key = params.key;
        const list = await listTable(env, 'module_configs');
        const config = list.find(m => m.module_key === key);
        return Response.json({ code: 0, data: config || null });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载模块配置失败: ' + e.message }, { status: 500 });
    }
}

export async function onRequestPut({ params, env, request }) {
    try {
        const key = params.key;
        const body = await request.json();
        const config = body.config || body;
        const obj = await readConfigs(env);
        const existing = obj[key];
        let record;
        if (existing) {
            record = {
                ...existing,
                module_key: key,
                config,
                updated_at: new Date().toISOString()
            };
        } else {
            record = {
                id: 'mod_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
                module_key: key,
                config,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        }
        obj[key] = record;
        await env.DATA_STORE.put('module_configs.json', JSON.stringify(obj, null, 2));
        return Response.json({
            code: 0,
            data: record,
            msg: existing ? '模块配置已保存' : '模块配置已创建'
        });
    } catch (e) {
        return Response.json({ code: 1, msg: '保存模块配置失败: ' + e.message }, { status: 500 });
    }
}

export async function onRequestDelete({ params, env }) {
    try {
        const key = params.key;
        const obj = await readConfigs(env);
        if (obj[key]) {
            delete obj[key];
            await env.DATA_STORE.put('module_configs.json', JSON.stringify(obj, null, 2));
            return Response.json({ code: 0, msg: '模块配置已重置为默认' });
        }
        return Response.json({ code: 0, msg: '模块配置本就是默认值' });
    } catch (e) {
        return Response.json({ code: 1, msg: '重置模块配置失败: ' + e.message }, { status: 500 });
    }
}
