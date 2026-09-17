// ========== JSON 文件存储层 ==========
// 提供简单的持久化存储，无需数据库依赖
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// 内存缓存，提升读取性能
const cache = {};

function fileOf(name) {
    return path.join(DATA_DIR, `${name}.json`);
}

function load(name) {
    if (cache[name]) return cache[name];
    const fp = fileOf(name);
    if (!fs.existsSync(fp)) {
        cache[name] = [];
        return cache[name];
    }
    try {
        cache[name] = JSON.parse(fs.readFileSync(fp, 'utf8') || '[]');
    } catch (e) {
        cache[name] = [];
    }
    return cache[name];
}

function save(name) {
    fs.writeFileSync(fileOf(name), JSON.stringify(cache[name] || [], null, 2));
}

// 通用 CRUD
const db = {
    list(table) {
        return load(table);
    },
    find(table, predicate) {
        return load(table).filter(predicate);
    },
    findById(table, id) {
        return load(table).find(r => r.id === id);
    },
    insert(table, record) {
        const arr = load(table);
        if (!record.id) record.id = `${table}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        record.created_at = record.created_at || new Date().toISOString();
        record.updated_at = new Date().toISOString();
        arr.push(record);
        save(table);
        return record;
    },
    update(table, id, patch) {
        const arr = load(table);
        const idx = arr.findIndex(r => r.id === id);
        if (idx === -1) return null;
        arr[idx] = { ...arr[idx], ...patch, updated_at: new Date().toISOString() };
        save(table);
        return arr[idx];
    },
    remove(table, id) {
        const arr = load(table);
        const idx = arr.findIndex(r => r.id === id);
        if (idx === -1) return false;
        arr.splice(idx, 1);
        save(table);
        return true;
    },
    // 批量插入（用于种子数据）
    bulkInsert(table, records) {
        const arr = load(table);
        records.forEach(r => {
            if (!r.id) r.id = `${table}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            r.created_at = r.created_at || new Date().toISOString();
            arr.push(r);
        });
        save(table);
    },
    // 重置表
    reset(table) {
        cache[table] = [];
        save(table);
    }
};

module.exports = db;
