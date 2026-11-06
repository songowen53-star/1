---
name: "dual-root-publish"
description: "固化「源码子目录 + 发布根目录」双入口发布规范。当项目需要同时支持本地 file:// 直开、本地 server 子路径、线上托管根路径 + 子路径时调用。"
---

# 双入口发布规范（dual-root-publish）

## 问题场景

同一前端项目需要同时满足三种访问路径：

| 场景 | 入口 URL | 问题 |
|------|---------|------|
| 本地双击文件 | `file://.../dist/index.html` | 相对路径 `css/* js/*` 必须能在根目录命中 |
| 本地开发 server | `http://localhost:9999/prototype/` | 完整原型在 `/prototype/` 子路径 |
| 线上托管根路径 | `https://site.pages.dev/` | 自动跳转到子路径即可 |
| 线上托管子路径 | `https://site.pages.dev/prototype/` | 完整原型在子路径 |

常见反模式：
- 只把子目录复制成 `dist/prototype/`，根目录缺失 css/js → 双击根 index.html 白屏
- 把 index.html 改成写死绝对路径 → file:// 又炸
- 两套 index.html 手工维护 → 漂移

## 规范设计

**源码单一真源**：所有源码只写一份，放在 `prototype/`（或任意约定的子目录名）。

**dist 固定两层布局**：

```
dist/                              ← 发布根（Cloudflare Pages / 静态托管根路径）
├── index.html                     ← 精简入口页：引导按钮 + 线上自动跳转 JS
├── css/    ← 从 prototype/css 复制一份到根
├── js/     ← 从 prototype/js  复制一份到根
├── data/                       ← 静态数据源（pages/*.json 等）
├── functions/                  ← 边缘函数（Cloudflare Functions / Workers 绑定）
└── prototype/                     ← 完整子目录（与源码同构，本地 server 入口也是这里）
    ├── index.html                 ← 完整原型入口（相对路径 css/js 命中本目录下的同名文件）
    ├── css/
    ├── js/
    ├── data/
    └── ...
```

**三个路径统一命中**：

| 入口 | 行为 |
|------|------|
| `dist/prototype/index.html` | 直接加载相对路径 `css/* js/*`（本目录已有） → ✅ 完整原型 |
| `dist/index.html`（根目录） | 入口页，点击按钮跳 `prototype/index.html`；资源也能命中根目录复制的 css/js |
| 线上 `/` | 入口页中的 JS 自动 `location.replace('prototype/index.html' + hash + search)` |

## 实现要点

### 1. deploy.sh 中固化同步步骤

```bash
# ---------- 3. 清理 ----------
rm -rf dist && mkdir -p dist
cp prototype/_redirects dist/_redirects 2>/dev/null || true

# ---------- 4. 源码同步 ----------
cp -r prototype dist/                      # 完整子目录先放进去
rm -rf dist/css dist/js
cp -r prototype/css dist/css               # 再把根目录也铺一份资源
cp -r prototype/js  dist/js

# ---------- 5. 根目录入口页 ----------
cat > dist/index.html <<'EOF'
<!DOCTYPE html>
<html lang="zh-CN"><head>
  <meta charset="UTF-8">
  <title>AI高考 - 产品原型</title>
  <link rel="stylesheet" href="css/prototype.css?v=...">
  <link rel="stylesheet" href="css/fontawesome/all.min.css?v=...">
  <style>/* 卡片样式 */</style>
</head><body>
  <div class="wrap">
    <div class="logo">🎓</div>
    <h1>AI高考 - 产品原型</h1>
    <p>完整原型位于 prototype/index.html</p>
    <a class="btn" href="prototype/index.html">👉 点击进入完整原型</a>
    <a class="btn ghost" href="prototype/index.html">（或直接双击 prototype/index.html）</a>
    <small>线上自动跳转 · 本地请双击 prototype/index.html</small>
  </div>
  <script>
    // 线上 / 根路径自动跳转 /prototype/（保留 #hash 不丢页面状态）
    if (location.hostname && !["localhost","127.0.0.1","file"].includes(location.hostname)) {
      var p = location.pathname;
      if (p === "/" || p === "/index.html") {
        location.replace("prototype/index.html" + location.hash + location.search);
      }
    }
  </script>
</body></html>
EOF
```

### 1.5 legacy/：兜住「非源码生成」的根目录文件

`rm -rf dist` 会连同上一版里**手工维护、但不由 `prototype/` 生成**的文件一起删掉，例如独立主应用页
（`index-home.html` + 它专属的 `css/style.css`、`js/main.js`）、`_redirects`、`api/*.json` 静态 fallback。

做法：把这些文件从 `dist/` **上移到源码树**统一收纳，deploy.sh 在源码同步之后补一步复制回来。

```
legacy/
├── index-home.html        # 独立主应用页（index-home.html 依赖的专属资源放 css/ js/）
├── index-static.html
├── data-manager.html
├── _redirects             # /api/* → 静态 json 的兜底路由
├── api/                   # 静态 API fallback（*.json）
├── css/style.css          # prototype/css 里没有，必须单独注入
└── js/main.js             # prototype/js 里没有，必须单独注入
```

> **不要把 `backend/` 放进 legacy/**：部署到 CDN 等于把后端源码（`server.js`、DB 文件）公开下载。
> legacy 只收纳「前端运行时真正需要的静态文件」。

```bash
# ---------- 6. legacy 根目录文件（必须放在 step 4 之后，否则被 rm -rf dist/css|dist/js 覆盖）----------
if [ -d "legacy" ]; then
  for f in legacy/*.html legacy/_redirects; do
    if [ -f "$f" ]; then cp "$f" "dist/$(basename "$f")"; fi
  done
  if [ -f "legacy/css/style.css" ]; then cp "legacy/css/style.css" "dist/css/style.css"; fi
  if [ -f "legacy/js/main.js" ];    then cp "legacy/js/main.js"    "dist/js/main.js";    fi
  if [ -d "legacy/api" ];        then cp -r legacy/api        dist/api;        fi
fi
```

关键点：
- **顺序**：legacy 的 css/js 必须注入在 `rm -rf dist/css dist/js` **之后**，否则被覆盖
- **`_redirects` 安全性**：Cloudflare Pages 里 Functions 优先于 `_redirects`，实测 `/api/*/week-plan` 仍走 Functions，
  `/api/learning/:uid/summary` 走静态 json，二者可共存；部署后务必回归验证一次
- **绝不收纳后端源码**：`legacy/backend/` 曾把 `server.js` 公开到 CDN，已移除；新增文件前先问一句「这是运行时需要的静态资源吗」

```bash
# 核对线上是否真的部署成功（Pages 会把 /x.html 308 重定向到 /x）
curl -sL -o /dev/null -w "%{http_code} %{size_download}\n" https://site.pages.dev/index-home.html
# 期望 200 + 与本地 dist/index-home.html 相同的字节数
```


### 2. prototype/index.html 中的资源引用

**固定使用相对路径**，不要写 `/css/*` 或 `https://...`：

```html
<link rel="stylesheet" href="css/prototype.css?v=...">
<script src="js/api.js?v=..."></script>
```

相对路径的好处：
- `prototype/index.html` 在子目录命中 `prototype/css/*`
- `dist/index.html` 入口页命中根目录 `css/*`
- `file://` 协议下 `./css/*` 也是相对可解析的

### 3. 线上根路径自动跳转

入口页里的这段 JS 是核心：

```js
if (location.hostname && !["localhost","127.0.0.1","file"].includes(location.hostname)) {
  var p = location.pathname;
  if (p === "/" || p === "/index.html") {
    location.replace("prototype/index.html" + location.hash + location.search);
  }
}
```

为什么用 `replace` 而不是 `href`：
- 不制造浏览器历史回退点
- 用户从 `/prototype/#home-diagnostic` → 回退直接回到上一个页面，不会被 `/` 卡死

为什么只匹配 `path === "/"` 或 `/index.html`：
- 用户直接访问 `/prototype/ai-plan.html`（假设存在）时不强制跳
- 只拦根路径这一种 case

### 4. 本地 server

本地开发用代理 server（`node proxy-server.js`），根路径 `/api/*` 透传后端，静态文件从 `dist/` 根目录起提供：

```
http://localhost:9999/              → 入口页（同线上）
http://localhost:9999/prototype/     → 完整原型
http://localhost:9999/css/*         → 根目录复制的 css
http://localhost:9999/js/*          → 根目录复制的 js
http://localhost:9999/api/*         → 代理到 Express 后端
```

### 5. Cloudflare Pages 部署

`wrangler pages deploy dist --project-name=xxx`，**project root 就是 dist 根**：
- `/` → 入口页 → 自动 JS 跳 `/prototype/`
- `/prototype/` → 完整原型
- `/css/*` 和 `/js/*` → 根目录复制的资源（给入口页用）
- `/data/*` → 静态数据 fallback
- `/functions/api/[[path]].js` → Functions 接管 `/api/*`

## 变更影响矩阵

改了什么 → 需要同步到哪里：

| 改动 | prototype/ 子目录 | dist/ 根入口页 | 根目录 css/js |
|------|-------------------|---------------|--------------|
| 新增 JS/CSS | ✅ 源码 | — | deploy.sh 自动 cp |
| 改 index.html 模板 | ✅ 完整入口 | — | 不影响（用 prototype/index.html） |
| 新增图片/字体 | ✅ 源码 | — | deploy.sh cp -r 已覆盖 |
| 改根目录入口文案 | — | ✅ 修改 deploy.sh 中的 HERE 文档 | — |
| 新增页面 | ✅ prototype/index.html 注册 | — | 不影响 |

## 验收 checklist

每次改完 deploy.sh 或前端资源后，按这个清单走：

- [ ] `dist/` 根目录存在 `css/` 和 `js/`
- [ ] `dist/index.html` 存在、是精简入口页、含跳转脚本
- [ ] `dist/prototype/index.html` 与 `prototype/index.html` 内容一致（相对路径 `css/* js/*`）
- [ ] 本地 `file:///.../dist/prototype/index.html` 直接双击能跑
- [ ] 本地 server `/prototype/` 能跑
- [ ] 线上 `/prototype/` 能跑
- [ ] 线上 `/` 访问 → 几秒内自动到 `/prototype/`（观察 URL 栏变化）
- [ ] `curl -I https://site.pages.dev/css/prototype.css` 返回 `200`
- [ ] 线上 Functions 仍然接管 `/api/*`（`401 未登录` 等业务错误不是 404）

## 反模式索引（别做）

| 反模式 | 后果 |
|--------|------|
| index.html 里写绝对路径 `/css/*` | `file://` 协议下无法解析根 |
| 手工维护两份 index.html | 改一个忘改另一个，漂移 |
| 入口页用 `window.location = ...`（非 replace） | 回退按钮被卡死 |
| deploy.sh 先 cp prototype 再 cp css/js，但没 `rm -rf dist/css` | 旧版 css 残留（cache 时尤其坑） |
| 入口页 redirect 用纯 HTML `<meta http-equiv="refresh">` | 会闪白屏、SEO 也差 |

## 本项目实例

参见 `/workspace/deploy.sh` Step 3–5，其中：
- 源码：`/workspace/prototype/`
- 部署：`CLOUDFLARE_API_TOKEN=xxx ./deploy.sh`
- 入口 URL 矩阵：
  - 根入口：`https://ai-gaokao-static.pages.dev/`
  - 完整原型：`https://ai-gaokao-static.pages.dev/prototype/`
  - 本地 server：`http://localhost:9999/prototype/`
