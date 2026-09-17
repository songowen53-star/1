// ========== 通用页面数据路由 ==========
// 为各原型页面提供动态数据，数据存储在 backend/data/pages/ 目录下
// 每个页面对应一个 JSON 文件，如 pages/score_monthly.json
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'data', 'pages');

// 确保目录存在
if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir, { recursive: true });
}

// 获取指定页面数据
// GET /api/page-data/:key
router.get('/:key', (req, res) => {
    const key = req.params.key.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(pagesDir, key + '.json');

    if (!fs.existsSync(filePath)) {
        return res.json({ code: 0, data: null, msg: '暂无数据' });
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        res.json({ code: 0, data: data });
    } catch (e) {
        res.status(500).json({ code: 1, msg: '数据解析失败: ' + e.message });
    }
});

// 保存页面数据
// PUT /api/page-data/:key  body: { data: {...} }
router.put('/:key', (req, res) => {
    const key = req.params.key.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filePath = path.join(pagesDir, key + '.json');
    const data = req.body.data || req.body;

    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        res.json({ code: 0, msg: '数据已保存' });
    } catch (e) {
        res.status(500).json({ code: 1, msg: '保存失败: ' + e.message });
    }
});

module.exports = router;
