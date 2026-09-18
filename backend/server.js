// AI高考 - 后端服务（Express）
// 提供 /api/page-data/:key 接口与 prototype 静态托管
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// 简易请求日志中间件
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const dur = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${dur}ms`);
    });
    next();
});

// 静态托管 prototype 前端
app.use('/prototype', express.static(path.join(__dirname, '..', 'prototype')));

// API: 获取页面 mock 数据
app.get('/api/page-data/:key', (req, res) => {
    const key = req.params.key;
    const filePath = path.join(__dirname, 'data', 'pages', `${key}.json`);
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).json({ error: 'page not found', key });
        }
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            res.status(500).json({ error: 'invalid json', key });
        }
    });
});

// 根路径重定向到 prototype
app.get('/', (req, res) => res.redirect('/prototype/'));

app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI高考后端服务已启动: http://localhost:${PORT}`);
    console.log(`产品原型端: http://localhost:${PORT}/prototype/`);
    console.log(`API 示例: http://localhost:${PORT}/api/page-data/college-recommend`);
});
