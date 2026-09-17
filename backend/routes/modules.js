// ========== 首页模块配置路由 ==========
// 支持各功能模块的动态编辑、保存、读取、本地文件导入
const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取所有模块配置
// GET /api/modules
router.get('/', (req, res) => {
    const list = db.list('module_configs');
    // 转为 { moduleKey: config } 映射
    const map = {};
    list.forEach(item => {
        map[item.module_key] = item;
    });
    res.json({ code: 0, data: map });
});

// 获取单个模块配置
// GET /api/modules/:key
router.get('/:key', (req, res) => {
    const list = db.list('module_configs');
    const config = list.find(m => m.module_key === req.params.key);
    res.json({ code: 0, data: config || null });
});

// 保存（创建或更新）模块配置
// PUT /api/modules/:key  body: { config: {...} }
router.put('/:key', (req, res) => {
    const key = req.params.key;
    const config = req.body.config || req.body;
    const list = db.list('module_configs');
    const existing = list.find(m => m.module_key === key);

    if (existing) {
        const updated = db.update('module_configs', existing.id, {
            module_key: key,
            config: config,
            updated_at: new Date().toISOString()
        });
        res.json({ code: 0, data: updated, msg: '模块配置已保存' });
    } else {
        const record = db.insert('module_configs', {
            module_key: key,
            config: config
        });
        res.json({ code: 0, data: record, msg: '模块配置已创建' });
    }
});

// 批量保存模块配置
// PUT /api/modules  body: { modules: { key1: config1, key2: config2, ... } }
router.put('/', (req, res) => {
    const modules = req.body.modules || {};
    const list = db.list('module_configs');
    let saved = 0;

    Object.keys(modules).forEach(key => {
        const existing = list.find(m => m.module_key === key);
        if (existing) {
            db.update('module_configs', existing.id, {
                module_key: key,
                config: modules[key]
            });
        } else {
            db.insert('module_configs', {
                module_key: key,
                config: modules[key]
            });
        }
        saved++;
    });

    res.json({ code: 0, data: { count: saved }, msg: `已保存 ${saved} 个模块配置` });
});

// 重置单个模块配置（删除自定义配置，恢复默认）
// DELETE /api/modules/:key
router.delete('/:key', (req, res) => {
    const list = db.list('module_configs');
    const existing = list.find(m => m.module_key === req.params.key);
    if (existing) {
        db.remove('module_configs', existing.id);
        res.json({ code: 0, msg: '模块配置已重置为默认' });
    } else {
        res.json({ code: 0, msg: '模块配置本就是默认值' });
    }
});

// 从本地文件导入数据到指定模块
// POST /api/modules/:key/import  body: { format: 'json'|'csv'|'text', data: ... }
router.post('/:key/import', (req, res) => {
    const key = req.params.key;
    const { format, data } = req.body || {};
    let parsedConfig = null;

    try {
        if (format === 'json') {
            // data 可以是对象或 JSON 字符串
            parsedConfig = typeof data === 'string' ? JSON.parse(data) : data;
        } else if (format === 'csv') {
            // 简单 CSV 解析：第一行为表头，后续为数据行
            const lines = data.split('\n').map(l => l.trim()).filter(Boolean);
            if (lines.length < 2) {
                return res.status(400).json({ code: 1, msg: 'CSV 数据至少需要表头+1行数据' });
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
            // 文本格式：按行解析 key: value
            const lines = data.split('\n').map(l => l.trim()).filter(Boolean);
            parsedConfig = {};
            lines.forEach(line => {
                const idx = line.indexOf(':');
                if (idx > 0) {
                    const k = line.slice(0, idx).trim();
                    const v = line.slice(idx + 1).trim();
                    // 尝试转为数字
                    const num = parseFloat(v);
                    parsedConfig[k] = isNaN(num) ? v : num;
                }
            });
            parsedConfig.imported_at = new Date().toISOString();
        } else {
            return res.status(400).json({ code: 1, msg: 'format 必须是 json、csv 或 text' });
        }

        // 保存解析后的配置
        const list = db.list('module_configs');
        const existing = list.find(m => m.module_key === key);
        if (existing) {
            const updated = db.update('module_configs', existing.id, {
                module_key: key,
                config: parsedConfig
            });
            res.json({ code: 0, data: updated, msg: '文件数据已导入并保存' });
        } else {
            const record = db.insert('module_configs', {
                module_key: key,
                config: parsedConfig
            });
            res.json({ code: 0, data: record, msg: '文件数据已导入并保存' });
        }
    } catch (e) {
        console.error('[import error]', e);
        res.status(500).json({ code: 1, msg: '导入失败: ' + e.message });
    }
});

module.exports = router;
