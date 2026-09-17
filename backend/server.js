// ========== 高分AI-AI高考智能提分教练 - 后端服务主入口 ==========
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const seedAll = require('./seed');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 强制禁用所有浏览器缓存（避免HTML/JS/CSS被本地硬盘/内存缓存）
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
});

// 请求日志（含响应状态码 + 响应大小，便于排障 4xx/5xx）
app.use((req, res, next) => {
    const startTs = Date.now();
    const origEnd = res.end.bind(res);
    let byteSize = 0;
    // 计算通过 res.write / res.end 写入的字节数（chunk 为 Buffer/string 时）
    const countBytes = (chunk) => {
        if (chunk == null) return;
        if (Buffer.isBuffer(chunk)) byteSize += chunk.length;
        else if (typeof chunk === 'string') byteSize += Buffer.byteLength(chunk, 'utf8');
    };
    if (res.write) {
        const origWrite = res.write.bind(res);
        res.write = function (chunk, enc, cb) {
            countBytes(chunk);
            return typeof enc === 'function' ? origWrite(chunk, enc) : origWrite(chunk, enc, cb);
        };
    }
    res.end = function (chunk, enc, cb) {
        countBytes(chunk);
        const status = res.statusCode;
        const dur = Date.now() - startTs;
        const url = req.originalUrl || req.url;
        console.log(`[${new Date().toISOString()}] ${req.method} ${url} → ${status} ${byteSize}B (${dur}ms)`);
        return typeof enc === 'function' ? origEnd(chunk, enc) : origEnd(chunk, enc, cb);
    };
    next();
});

// 初始化种子数据
seedAll();

// Token 鉴权中间件
const { requireAuth, optionalAuth } = require('./middleware/auth');

// ========== 挂载API路由 ==========
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/knowledge', require('./routes/knowledge'));
app.use('/api/questions', require('./routes/questions'));
app.use('/api/learning', require('./routes/learning'));
app.use('/api/answers', require('./routes/answers'));
app.use('/api/recommend', require('./routes/recommend'));
app.use('/api/predict', require('./routes/predict'));
app.use('/api/modules', require('./routes/modules'));
app.use('/api/page-data', require('./routes/page-data'));
app.use('/api/teacher', require('./routes/teacher'));
app.use('/api/teacher', require('./routes/teacher-ai'));

// ========== AI 路由（统一接入 Token 鉴权） ==========
// 策略：optionalAuth 软校验——有 token 则注入 userId 用于个性化，无 token 放行游客体验
// 写操作（explain/start, import/start, coach/proactive）使用 requireAuth 强校验
app.use('/api/ai', optionalAuth, require('./routes/ai'));
app.use('/api/ai/explain', optionalAuth, require('./routes/ai-explain'));
app.use('/api/ai/qa', optionalAuth, require('./routes/ai-qa'));
app.use('/api/ai/coach', optionalAuth, require('./routes/ai-coach'));
app.use('/api/ai/graph', optionalAuth, require('./routes/ai-graph'));
app.use('/api/ai/import', requireAuth, require('./routes/ai-import'));      // 入库需登录
app.use('/api/ai/models', requireAuth, require('./routes/ai-models'));      // 模型管理需登录
app.use('/api/ai/error', requireAuth, require('./routes/ai-error'));        // 错题分析需登录
app.use('/api/ai/engine', requireAuth, require('./routes/ai-engine'));      // 飞轮引擎需登录
app.use('/api/photo', optionalAuth, require('./routes/photo'));
app.use('/api/admin/review', requireAuth, require('./routes/admin-review')); // 运营审核需登录
app.use('/api/practice/hotpoints', require('./routes/practice-hotpoints'));
app.use('/api/favorites', requireAuth, require('./routes/favorites'));      // 收藏需登录
app.use('/api/events', optionalAuth, require('./routes/events'));

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ code: 0, msg: '服务运行中', time: new Date().toISOString() });
});

// API总览
app.get('/api', (req, res) => {
    res.json({
        code: 0,
        name: '高分AI-AI高考智能提分教练API',
        version: '1.0.0',
        endpoints: {
            auth: ['/api/auth/register', '/api/auth/login', '/api/auth/logout', '/api/auth/me'],
            users: ['/api/users', '/api/users/:id'],
            knowledge: ['/api/knowledge', '/api/knowledge/weak', '/api/knowledge/:id', '/api/knowledge/:id/mastery'],
            questions: ['/api/questions', '/api/questions/:id'],
            learning: ['/api/learning', '/api/learning/:user_id', '/api/learning/:user_id/summary', '/api/learning/:user_id/subject-stats'],
            answers: ['/api/answers', '/api/answers/batch', '/api/answers/:user_id', '/api/answers/:user_id/stats'],
            recommend: ['/api/recommend/:user_id/questions', '/api/recommend/:user_id/paper', '/api/recommend/:user_id/plan'],
            predict: ['/api/predict/:user_id/score', '/api/predict/:user_id/rank', '/api/predict/:user_id/report'],
            ai: ['/api/ai/chat (SSE)', '/api/ai/health', '/api/ai/explain/*', '/api/ai/qa/*', '/api/ai/coach/*', '/api/ai/graph/*', '/api/ai/import/*', '/api/ai/models/*'],
            photo: ['/api/photo/ocr', '/api/photo/parse', '/api/photo/similar'],
            teacher_ai: ['/api/teacher/split', '/api/teacher/parse', '/api/teacher/tag', '/api/teacher/generate'],
            admin_review: ['/api/admin/review/pending', '/api/admin/review/:item_id/decision'],
            practice_hotpoints: ['/api/practice/hotpoints', '/api/practice/hotpoints/:point_id/questions']
        }
    });
});

// ========== 本地文件上传导入接口 ==========
// 支持上传JSON/TXT/CSV文件到 backend/data/ 目录
app.post('/api/upload', (req, res) => {
    try {
        const { filename, content } = req.body || {};

        if (!filename || !content) {
            return res.status(400).json({ code: 1, msg: '文件名和内容不能为空' });
        }

        // 安全检查：只允许字母数字下划线中文和点
        const safeName = filename.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5.-]/g, '_');
        const dataDir = path.join(__dirname, 'data');

        // 确保目录存在
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        const filePath = path.join(dataDir, safeName);
        fs.writeFileSync(filePath, content, 'utf8');

        // 如果是JSON文件，尝试解析并返回统计信息
        let stats = { filename: safeName, size: content.length };
        if (safeName.endsWith('.json')) {
            try {
                const data = JSON.parse(content);
                if (Array.isArray(data)) {
                    stats.records = data.length;
                    stats.type = 'array';
                } else if (typeof data === 'object') {
                    stats.keys = Object.keys(data).length;
                    stats.type = 'object';
                }
            } catch (e) {
                stats.jsonParseError = e.message;
            }
        }

        res.json({ code: 0, msg: `文件 ${safeName} 已保存到 backend/data/`, data: stats });
    } catch (e) {
        res.status(500).json({ code: 1, msg: '上传失败: ' + e.message });
    }
});

// 获取 data 目录文件列表
app.get('/api/data-files', (req, res) => {
    const dataDir = path.join(__dirname, 'data');
    try {
        const files = fs.readdirSync(dataDir).map(name => {
            const stat = fs.statSync(path.join(dataDir, name));
            return { name, size: stat.size, mtime: stat.mtime };
        });
        res.json({ code: 0, data: files });
    } catch (e) {
        res.status(500).json({ code: 1, msg: '读取目录失败' });
    }
});

// 读取 data 目录下指定文件内容
app.get('/api/data-files/:name', (req, res) => {
    const safeName = req.params.name.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5.-]/g, '_');
    const filePath = path.join(__dirname, 'data', safeName);
    try {
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ code: 1, msg: '文件不存在' });
        }
        const content = fs.readFileSync(filePath, 'utf8');
        res.json({ code: 0, data: { name: safeName, content } });
    } catch (e) {
        res.status(500).json({ code: 1, msg: '读取失败: ' + e.message });
    }
});

// 删除 data 目录下指定文件
app.delete('/api/data-files/:name', (req, res) => {
    const safeName = req.params.name.replace(/[^a-zA-Z0-9_\u4e00-\u9fa5.-]/g, '_');
    const filePath = path.join(__dirname, 'data', safeName);
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ code: 0, msg: `已删除 ${safeName}` });
        } else {
            res.status(404).json({ code: 1, msg: '文件不存在' });
        }
    } catch (e) {
        res.status(500).json({ code: 1, msg: '删除失败: ' + e.message });
    }
});

// 禁止访问 secrets 目录（安全保护）
app.use('/secrets', (req, res, next) => {
    res.status(403).json({ code: 1, msg: '禁止访问敏感文件' });
});

// 静态文件服务（前端）—— HTML/JS/CSS 禁用缓存，确保始终加载最新版本（开发环境）
app.use(express.static(path.join(__dirname, '..'), {
    etag: false,
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }
}));

// 启动服务
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n========================================`);
    console.log(`  高分AI-AI高考智能提分教练后端已启动`);
    console.log(`  服务地址: http://localhost:${PORT}`);
    console.log(`  API文档: http://localhost:${PORT}/api`);
    console.log(`  前端页面: http://localhost:${PORT}/index.html`);
    console.log(`========================================\n`);
});
