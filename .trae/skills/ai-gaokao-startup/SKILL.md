---
name: "ai-gaokao-startup"
description: "Starts the AI Gaokao prototype's backend (Express, port 8080) and frontend (proxy server, port 9999), verifies both are healthy, and opens the prototype in the browser with cache cleared. Invoke when the user asks to start local servers, launch the AI Gaokao prototype, or open the product prototype page."
---

# AI Gaokao Prototype Startup

Starts the local backend and frontend servers for the AI Gaokao product prototype, verifies they are running, and opens the prototype in the browser with the browser cache cleared.

## When to Invoke

- User says "启动本地服务器" / "启动前后端服务器"
- User says "打开 AI 高考产品原型" or "打开原型"
- User says "清除缓存并打开原型"
- User asks to start the local development / preview environment for the AI Gaokao project

## Preconditions

The workspace must contain:
- `backend/server.js` — Express backend server (default port `8080`)
- `proxy-server.js` — Frontend static + API proxy server (default port `9999`)
- `prototype/index.html` — The prototype entry page

## Workflow

### Step 1 — Check existing processes

Before starting, check whether ports `8080` and `9999` are already listening. If they are, skip the start step and go directly to Step 3 (verify).

```bash
(ss -ltnp 2>/dev/null || netstat -ltnp 2>/dev/null) | grep -E ':(8080|9999)'
```

### Step 2 — Start the backend server

Run the backend as a non-blocking web server:

```bash
# cwd: <workspace>/backend
node server.js
```

Expected startup log: `AI高考后端服务已启动: http://localhost:8080`

### Step 3 — Start the frontend proxy server

Run the frontend proxy as a non-blocking web server:

```bash
# cwd: <workspace>
node proxy-server.js
```

Expected startup log: `Proxy server on http://localhost:9999`

> The proxy server serves static files from `dist/` and proxies all `/api/*` requests to `http://127.0.0.1:8080`. It also returns `Cache-Control: no-cache, no-store, must-revalidate` headers, so browser caching is disabled by default.

### Step 4 — Verify both services are healthy

Run the following checks (combine into one command where possible):

```bash
# Backend prototype page
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/prototype/index.html

# Backend API (today-tasks returns a real-time date string)
curl -s http://localhost:8080/api/learning/u_001/today-tasks | head -c 200

# Frontend prototype page
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:9999/prototype/index.html

# Frontend proxied API
curl -s http://localhost:9999/api/learning/u_001/today-tasks | head -c 200
```

Expected: all four return HTTP `200` (or valid JSON `{"code":0,...}` for the API calls).

### Step 5 — Open the prototype in the browser

Open the prototype URL with a cache-busting query parameter to force a fresh load:

```
http://localhost:9999/prototype/index.html?v=<timestamp>
```

Wait ~2 seconds for the page to settle, then take a snapshot to confirm:
- Page title is "AI高考 - 完整产品原型"
- The sidebar navigation renders (should show ~69 pages)
- No "加载中…" / blank screen / console errors

### Step 6 — Verify the real-time calendar (optional but recommended)

Click the "今日任务" page in the sidebar. The page header should display the current date in the format `M月D日 周X`, matching the system date.

Example (system date 2026-10-21, Wednesday):
```
今日任务 10月21日 周三 已完成 0/4，加油冲刺！ 0% 完成率
```

If the date is stale or stuck on "加载中…", the real-time date logic in `prototype/js/pages-home.js` needs review.

### Step 7 — Provide the preview URL

Use the `OpenPreview` tool to expose `http://localhost:9999/prototype/index.html` to the user, binding it to the frontend server's command id.

## Stopping the servers

To stop both servers, use the `StopCommand` tool with the two command ids returned when starting the backend and frontend servers.

## Notes

- The backend server also serves the prototype at `http://localhost:8080/prototype/`, but the frontend proxy at `9999` is the recommended entry because it handles the `/api/*` proxying transparently.
- The `api.js` client uses root-relative URLs (`/api/...`), so the frontend and backend must be reachable on the same origin (handled by the proxy server).
- Do not hardcode credentials, tokens, or environment-specific URLs in the skill.
