// 临时预览服务：提供静态文件 + API代理到后端3000端口
const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const server = http.createServer((req, res) => {
    let url = req.url.split('?')[0];

    // API请求代理到后端3000端口
    if (url.startsWith('/api/')) {
        const proxy = http.request({
            hostname: '127.0.0.1',
            port: 3000,
            path: req.url,
            method: req.method,
            headers: req.headers
        }, (pr) => {
            res.writeHead(pr.statusCode, pr.headers);
            pr.pipe(res);
        });
        proxy.on('error', () => {
            res.writeHead(502);
            res.end('Bad Gateway');
        });
        req.pipe(proxy);
        return;
    }

    // 默认首页
    if (url === '/') url = '/prototype/index.html';

    const fp = path.join(root, url);
    fs.readFile(fp, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found: ' + url);
            return;
        }
        const ext = path.extname(fp);
        const types = {
            '.html': 'text/html;charset=utf-8',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml'
        };
        res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(8888, '0.0.0.0', () => {
    console.log('预览服务(含API代理)已启动: http://127.0.0.1:8888');
});
