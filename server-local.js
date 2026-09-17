// 本地开发服务器：强制禁用所有 HTTP 缓存 + CORS 全开放 + 静态文件服务
// 同时把 /api/* 反向代理到后端服务（端口 3000），解决前端调 api 时被 SPA 回退到 index.html 的问题
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8788;
const ROOT = path.join(__dirname, 'dist');
const BACKEND_PORT = process.env.BACKEND_PORT || 3000;
const BACKEND_HOST = process.env.BACKEND_HOST || '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.pdf':  'application/pdf',
  '.doc':  'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.map':  'application/json; charset=utf-8'
};

const server = http.createServer(function (req, res) {
  // --- CORS 全开 ---
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Range, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '0');

  // --- 彻底禁用所有缓存 ---
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader('Clear-Site-Data', '"cache", "storage"');
  // 加一个时间戳 header，方便调试确认每次都是 fresh response
  res.setHeader('X-Date', new Date().toISOString());

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  const parsed = url.parse(req.url);
  let relPath = decodeURIComponent(parsed.pathname || '/');
  if (relPath === '/') relPath = '/index.html';

  // ========== 反向代理 /api/* 到后端服务 ==========
  // 解决前端原型在调用 api.getPageData / savePageData / uploadPaper 时
  // 被静态服务器的 SPA 回退逻辑拦截返回 index.html 的问题
  if (relPath.indexOf('/api/') === 0) {
    const proxyReq = http.request({
      hostname: BACKEND_HOST,
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Authorization': req.headers['authorization'] || '',
        'Accept': req.headers['accept'] || '*/*'
      }
    }, function (proxyRes) {
      res.statusCode = proxyRes.statusCode || 200;
      // 透传后端响应头
      const skipHeaders = ['connection', 'keep-alive', 'transfer-encoding', 'date', 'x-date'];
      Object.keys(proxyRes.headers).forEach(function (k) {
        if (skipHeaders.indexOf(k.toLowerCase()) === -1) {
          res.setHeader(k, proxyRes.headers[k]);
        }
      });
      // 重新设置 CORS 与禁缓存头
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
      res.setHeader('X-Proxy', 'server-local->backend:' + BACKEND_PORT);
      proxyRes.pipe(res);
    });
    proxyReq.on('error', function (e) {
      console.error('[Proxy Error]', req.method, req.url, e.message);
      res.statusCode = 502;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ code: 1, msg: '后端服务不可用: ' + e.message }));
    });
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      req.pipe(proxyReq);
    } else {
      proxyReq.end();
    }
    return;
  }

  // ========== 静态文件服务 ==========
  let filePath = path.join(ROOT, relPath);
  // 防止路径穿越
  if (!filePath.startsWith(ROOT)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  // 目录路径 -> 补 index.html
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch (e) {}

  fs.readFile(filePath, function (err, data) {
    if (err) {
      // SPA 回退：找最近目录的 index.html（防止 404）
      const fallback = path.join(ROOT, 'index.html');
      fs.readFile(fallback, function (e2, data2) {
        if (e2) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end('Not Found: ' + relPath);
          return;
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', MIME['.html']);
        res.end(data2);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    res.setHeader('Content-Length', Buffer.byteLength(data));
    res.end(data);
  });
});

server.listen(PORT, function () {
  console.log('========================================');
  console.log(' Local server (cache disabled) running');
  console.log(' http://127.0.0.1:' + PORT);
  console.log(' Root: ' + ROOT);
  console.log(' Cache-Control: no-store,no-cache,max-age=0');
  console.log(' Clear-Site-Data: "cache","storage"');
  console.log('========================================');
});
