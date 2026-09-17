// POST /api/modules/:key/import  body: { format: 'json'|'csv'|'text', data: ... } — 从本地文件导入数据到指定模块
// 对应后端 backend/routes/modules.js 中的 router.post('/:key/import')

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

export async function onRequestPost({ params, env, request }) {
    try {
        const key = params.key;
        const body = await request.json();
        const { format, data } = body || {};
        let parsedConfig = null;

        if (format === 'json') {
            parsedConfig = typeof data === 'string' ? JSON.parse(data) : data;
        } else if (format === 'csv') {
            const lines = String(data).split('\n').map(l => l.trim()).filter(Boolean);
            if (lines.length < 2) {
                return Response.json({ code: 1, msg: 'CSV 数据至少需要表头+1行数据' }, { status: 400 });
            }
            const headers = lines[0].split(',').map(h => h.trim());
            const rows = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());
                const row = {};
                headers.forEach((h, j) => { row[h] = values[j] || ''; });
                rows.push(row);
            }
            parsedConfig = { items: rows, imported_at: new Date().toISOString() };
        } else if (format === 'text') {
            const lines = String(data).split('\n').map(l => l.trim()).filter(Boolean);
            parsedConfig = {};
            lines.forEach(line => {
                const idx = line.indexOf(':');
                if (idx > 0) {
                    const k = line.slice(0, idx).trim();
                    const v = line.slice(idx + 1).trim();
                    const num = parseFloat(v);
                    parsedConfig[k] = isNaN(num) ? v : num;
                }
            });
            parsedConfig.imported_at = new Date().toISOString();
        } else {
            return Response.json({ code: 1, msg: 'format 必须是 json、csv 或 text' }, { status: 400 });
        }

        const obj = await readConfigs(env);
        const existing = obj[key];
        let record;
        if (existing) {
            record = {
                ...existing,
                module_key: key,
                config: parsedConfig,
                updated_at: new Date().toISOString()
            };
        } else {
            record = {
                id: 'mod_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
                module_key: key,
                config: parsedConfig,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        }
        obj[key] = record;
        await env.DATA_STORE.put('module_configs.json', JSON.stringify(obj, null, 2));
        return Response.json({ code: 0, data: record, msg: '文件数据已导入并保存' });
    } catch (e) {
        return Response.json({ code: 1, msg: '导入失败: ' + e.message }, { status: 500 });
    }
}
