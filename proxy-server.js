// 简易前端 + API 代理服务器
// 监听 8888 端口，静态文件从 dist 提供，/api/* 代理到后端 8080
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const DIST_DIR = path.join(__dirname, 'dist');
const BACKEND_HOST = '127.0.0.1';
const BACKEND_PORT = 8080;
const PORT = 9999;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
    '.map': 'application/json'
};

const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true);
    const pathname = decodeURIComponent(parsed.pathname);

    // API 请求代理到后端
    if (pathname.startsWith('/api/')) {
        const proxyReq = http.request({
            host: BACKEND_HOST,
            port: BACKEND_PORT,
            path: req.url,
            method: req.method,
            headers: { ...req.headers, host: `${BACKEND_HOST}:${BACKEND_PORT}` }
        }, proxyRes => {
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res);
        });
        proxyReq.on('error', e => {
            res.writeHead(502);
            res.end(JSON.stringify({ error: 'Backend error: ' + e.message }));
        });
        req.pipe(proxyReq);
        return;
    }

    // 静态文件
    let filePath = path.join(DIST_DIR, pathname);
    if (pathname === '/' || pathname === '') filePath = path.join(DIST_DIR, 'index.html');

    fs.readFile(filePath, (err, data) => {
        if (err) {
            // 尝试加 index.html
            if (!path.extname(filePath)) {
                fs.readFile(path.join(DIST_DIR, 'index.html'), (e2, d2) => {
                    if (e2) { res.writeHead(404); res.end('Not found'); }
                    else { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(d2); }
                });
                return;
            }
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Proxy server on http://localhost:${PORT}`);
    console.log(`Static: dist/`);
    console.log(`API proxy: /api/* -> http://${BACKEND_HOST}:${BACKEND_PORT}`);
});
