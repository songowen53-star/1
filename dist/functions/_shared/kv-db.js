// 共享工具：从 KV 读取后端数据 JSON 文件，模拟 db.list 接口
// 后端 backend/data/*.json 通过 sync.js push-data 上传后，KV key = 文件名（如 users.json / knowledge_points.json）

const CACHE_TTL_MS = 30 * 1000; // 30 秒进程内缓存，避免重复读 KV
const _cache = new Map(); // key -> { value, expireAt }

async function kvGetJson(env, fileName) {
    const now = Date.now();
    const cached = _cache.get(fileName);
    if (cached && cached.expireAt > now) return cached.value;

    const raw = await env.DATA_STORE.get(fileName);
    let value = null;
    if (raw !== null && raw !== undefined) {
        try { value = JSON.parse(raw); } catch (e) { value = null; }
    }
    _cache.set(fileName, { value, expireAt: now + CACHE_TTL_MS });
    return value;
}

// 模拟 db.list(tableName)：大部分文件是数组；少数是对象（如 module_configs.json 用 key → config）
export async function listTable(env, tableName) {
    const fileName = tableName.endsWith('.json') ? tableName : tableName + '.json';
    const data = await kvGetJson(env, fileName);
    if (data === null) return [];
    if (Array.isArray(data)) return data;
    // 对象型：返回 Object.values（如 module_configs.json）
    if (data && typeof data === 'object') return Object.values(data);
    return [];
}

export async function getJsonObject(env, fileName) {
    return kvGetJson(env, fileName);
}

export function clearCache() {
    _cache.clear();
}
