// GET  /api/modules — 获取所有模块配置（转为 { moduleKey: config } 映射）
// PUT  /api/modules  body: { modules: { key1: config1, ... } } — 批量保存模块配置
// 对应后端 backend/routes/modules.js 中的 router.get('/') 与 router.put('/')
import { listTable } from '../../_shared/kv-db.js';

// module_configs.json 在 KV 中以对象形式存储（{ module_key: item }），此处读取原始对象
async function readConfigs(env) {
    const raw = await env.DATA_STORE.get('module_configs.json');
    if (!raw) return {};
    try {
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
            // 兼容数组形态：转为 { module_key: item }
            const obj = {};
            data.forEach(item => { if (item && item.module_key) obj[item.module_key] = item; });
            return obj;
        }
        return data || {};
    } catch (e) { return {}; }
}

export async function onRequestGet({ env }) {
    try {
        const list = await listTable(env, 'module_configs');
        const map = {};
        list.forEach(item => {
            if (item && item.module_key) map[item.module_key] = item;
        });
        return Response.json({ code: 0, data: map });
    } catch (e) {
        return Response.json({ code: 1, msg: '加载模块配置失败: ' + e.message }, { status: 500 });
    }
}

export async function onRequestPut({ request, env }) {
    try {
        const body = await request.json();
        const modules = body.modules || {};
        const obj = await readConfigs(env);
        let saved = 0;
        Object.keys(modules).forEach(key => {
            const existing = obj[key];
            if (existing) {
                obj[key] = {
                    ...existing,
                    module_key: key,
                    config: modules[key],
                    updated_at: new Date().toISOString()
                };
            } else {
                obj[key] = {
                    id: 'mod_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
                    module_key: key,
                    config: modules[key],
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };
            }
            saved++;
        });
        await env.DATA_STORE.put('module_configs.json', JSON.stringify(obj, null, 2));
        return Response.json({ code: 0, data: { count: saved }, msg: `已保存 ${saved} 个模块配置` });
    } catch (e) {
        return Response.json({ code: 1, msg: '批量保存模块配置失败: ' + e.message }, { status: 500 });
    }
}
