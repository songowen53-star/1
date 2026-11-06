# PROGRESS — AI 高考智能提分教练

> 本文件用于跨会话交接：记录项目结构、运行方式、开发历程、关键决策与踩坑结论、当前待办。
> 最后更新：2026-11-06 ｜ 依据：`git log`、工作区实际代码、`git status`

---

## 1. 项目定位

面向高三学生的「AI 高考智能提分教练」：学情诊断 → 目标分管理 → 提分计划 → 模考预测 → 志愿填报，
包含完整产品原型（54 个页面）与可运行的后端 API（75 个路由）。

技术栈：原生 HTML/CSS/JS（无框架） + Express 后端（JSON 文件库） + Cloudflare Pages/Functions 部署。

---

## 2. 目录结构

```
/workspace
├── backend/                # Express 后端（端口 8080）
│   ├── server.js           # 主服务，75 个路由
│   ├── student-api.js      # 学生智能档案 API（独立模块）
│   ├── learning-store.js   # 存储层，读写 backend/data/learning-db.json
│   └── data/
│       ├── learning-db.json    # 唯一真源数据库（用户/档案/模块配置/行为事件）
│       ├── pages/*.json        # 各页面静态数据
│       └── *真题*_L5.json       # 题库（539 个文件，逐年逐卷）
├── prototype/              # 【源码单一真源】完整产品原型（54 页）
├── legacy/                  # 非原型生成、但运行时需要的根目录文件
│   ├── index-home.html     # 独立主应用页（真实产品入口，非同原型）
│   ├── index-static.html / data-manager.html
│   ├── css/style.css       # index-home 专属样式
│   ├── js/main.js          # index-home 主逻辑（8122 行）
│   ├── js/api.js           # 前端 API 客户端
│   └── _redirects / api/   # 静态 API fallback
├── dist/                   # 【发布产物】deploy.sh 生成，两层布局
├── functions/api/[[path]].js  # Cloudflare Functions，线上接管 /api/*
├── proxy-server.js         # 本地静态 + API 代理（端口 9999）
├── deploy.sh               # 一键构建 + 部署
└── .trae/skills/           # 本项目的两个技能：启动、双入口发布
```

**双入口发布规范**（详见 `.trae/skills/dual-root-publish/SKILL.md`）：
`dist/` 根目录同时铺一份 `css|js` 给入口页用，完整原型在 `dist/prototype/`，源码只维护 `prototype/` + `legacy/`。
`legacy/js/main.js` 必须在 `deploy.sh` 里 `rm -rf dist/js` **之后**注入，否则被覆盖。

---

## 3. 运行方式

```bash
# 后端
cd backend && node server.js          # → http://localhost:8080

# 前端（静态 + /api 代理，推荐入口）
node proxy-server.js                  # → http://localhost:9999

# 健康检查
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:9999/index-home.html
curl -s http://localhost:9999/api/learning/u_001/today-tasks | head -c 200
```

| 入口 | URL |
|---|---|
| 主应用（真实产品页） | `http://localhost:9999/index-home.html` |
| 完整产品原型 | `http://localhost:9999/prototype/index.html` |
| 线上根 | `https://ai-gaokao-static.pages.dev/` → 自动跳 `/prototype/` |

改前端后务必带 `?v=yyyymmddX` 版本号刷新，避免浏览器缓存旧 JS。

---

## 4. 开发历程（git 提交）

| 日期 | 提交 | 内容 |
|---|---|---|
| 2026-09-17 | `92158b3` | 初始化仓库 |
| 2026-09-18 | `dc9b801` | 院校推荐：新增院校池 + 按条件筛选（修"调条件推荐不变"） |
| 2026-09-18 | `7992a96` → `1717667` → `8628664` | 搭建 Cloudflare Pages 部署工作流，修正 Account ID |
| 2026-09-18 | `75148b4` | 志愿填报 + AI 中心模块同步到前端/云端 |
| 2026-09-18 | `b307a61` / `e9254a4` | 追加 GitHub Pages 部署（无需 secret） |
| 2026-09-18 | `7759c3c` / `69ea946` | 配 Cloudflare token；改用 secret 修复 push protection 阻塞 |
| 2026-09-18 | `0a2b1ec` / `efd9fc0` | 同步原型各功能模块到前端/后端/云端；补齐数据文件 |
| 2026-09-21 | `7a6de24` | 修学情分析页 `undefined` 报错 + 子模块无交互内容 |
| 2026-09-21 | `b6b15b7` | 修刷题训练各子模块无交互内容 |
| 2026-09-21 | `5185e53` | CI：`cloudflare/pages-action` → `wrangler-action@v3` |
| 2026-10-22 | `7ccda48` | **V1.0 第一阶段联调全链路**：`learning-store.js`、`learning-db.json`、`student-api.js` 落地，`server.js` 路由从 841 行扩到可用 |
| 2026-10-22 | `fd3e7f3` | 新增 Pages Functions 接管学生智能档案 API（KV 存储） |

### 未提交改动（最近一轮开发，`git status` 可查）

- `backend/learning-store.js`、`backend/server.js`、`backend/student-api.js`、`backend/data/learning-db.json`
- `dist/js/main.js`、`dist/js/api.js`、`dist/index-home.html` 等前端产物
- `prototype/*` 与 `dist/prototype/*` 同步改动（页面数据、api.js、design-system、pages-home/login/score/profile）
- 大量未跟踪文件：题库 JSON（`backend/data/`、`prototype/`、`dist/prototype/` 各 537 个）、`deploy.sh`、`expand-bank.js`、`rebalance-bank.js`、`run-diagnostic.js`、`.trae/`
  → **待决策**：题库与大文件是否入库（三份副本约 1600+ 文件）

---

## 5. 关键决策与踩坑结论

### 5.1 后端：桩接口改真持久化
`/api/modules` 系列原先直接 `res.json(ok([]))` 或回显 body，前端读不到任何配置。
现改为：**按 `user_id` 分桶写入 `learning-db.json` 的 `module_configs`**，读取时与 `_defaultModuleConfigs` 合并；未登录用户落到 `__public__` 桶。

同一批加固还包括：
- 注册/登录支持手机号（`phone` 字段 + `^1\d{10}$` 识别），前端只传 `phone` 也能注册
- `parent-bind`：手机号格式校验、学生≠家长、一个家长最多绑 3 个学生、防重复绑定
- `delete /api/modules/:key` 支持重置为默认值

### 5.2 前端：`loadModuleConfigs()` 没解包响应（最关键的 bug）
`api.getAllModuleConfigs()` 返回 `{code, data}`，而 `main.js` 直接把它当配置字典用
→ `moduleConfigs` **永远是空对象**，所有"用户改过的配置"全部丢失，页面永远显示默认值。
修复：解包 `resp.data || resp`。

### 5.3 前端：`updateUserUI()` 有 7 处调用，会覆盖模块配置
`updateUserUI(user)` 用 `user.target_score`（620）写 DOM，而它在 `loadModuleConfigs()` 前后被反复调用
（`L125`、`L5612`、`L5937`、`L6092`、`L6218`、`L6256`…），每次都把已渲染的 700 改回 620。
修复：**moduleConfigs 优先，user API 只做兜底**：

```js
const current = moduleConfigs.goal?.current_score || user.current_score || 0;
const target  = moduleConfigs.goal?.target_score  || user.target_score  || 0;
```

### 5.4 浏览器缓存
`GET /api/modules` 被浏览器缓存，改了库仍返回旧值。修复：`api.js` 所有请求统一加 `Cache-Control: no-store`（proxy 也返回 `no-cache, no-store, must-revalidate`）。

### 5.5 `let` 声明的全局变量不挂 `window`
`let moduleConfigs = {}` 在顶层声明后**不会**成为 `window.moduleConfigs`。
在浏览器 console 调试时不要用 `window.moduleConfigs` 判断是否为空，会误判成"没加载"。

### 5.6 联动引擎（`triggerLinkages`）

`initLinkageEvents()` 给 `[data-module="goal"]` / `[data-module="growth"]` 绑**单击**（`click`）弹 prompt，
改值后调 `triggerLinkages(key)` 做级联：`radar → goal → exam-predict`。
> 注意：`dblclick` 在自动化浏览器里常被 CSS/遮罩拦截，用单击触发更稳。

**联动公式（`main.js` L6748 起）**：
- 权重 `w = min(0.6, max(0.3, correct_rate / 200))`
- `predicted_score = round(current + (target − current) × w)`
- `confidence = min(95, round(50 + correct_rate×0.4 + (current/target)×15))`
- `probability = min(99, round((current/target)×100 + correct_rate×0.2))`
- `rank = max(100, round(50000 / (predicted_score / 300)))`

**2026-11-06 修复的 3 个联动 bug**（均已浏览器端到端 + curl 双验证）：

| # | 问题 | 修复 | 位置 |
|---|---|---|---|
| 1 | 源模块（goal/growth）编辑后不落库——`triggerLinkages` 只保存衍生模块，刷新后回退 | 在 `triggerLinkages` 入口统一加 `api.saveModuleConfig(sourceKey, sourceConfig)`，所有编辑入口自动覆盖 | `main.js` ~L6734 |
| 2 | `exam-predict.target_score` 不随 goal 同步（一直是默认 620） | 联动2、联动5b 两处都补 `predictConfig.target_score = targetScore` | `main.js` ~L6764、~L6838 |
| 3 | 客户端漏传 `score_gap` 时浅合并保留脏数据 | 后端 `PUT /api/modules/:key` 对 goal 一律重算 `score_gap = target − current`，不信任客户端传值 | `server.js` ~L815 |

> 第 3 条顺便修正了此前文档里"750−456=244"的口算错误，正确值是 **294**；服务端公式为权威。

### 5.7 发布：不要把 backend 放进 legacy
`legacy/backend/` 曾把 `server.js`、DB 文件公开到 CDN（已移除）。新增文件前先问：这是运行时需要的静态资源吗？

---

## 6. 当前状态与待办

### 已验证通过
- [x] `/api/modules` 写入 → 落库 → **后端重启后仍能读回**（`target_score=700` 场景实测）
- [x] 首页目标卡片正常渲染真实数据：`456 当前估分 / 700 目标分数`（`v=20261105G` 加载即从后端取数）
- [x] goal 卡片单击能弹出「编辑目标分」prompt
- [x] **联动引擎端到端闭环**：点 goal 卡片 → prompt 输入 → 即时重算 → 刷新后不回退
  （公式值全吻合：`target=700, current=456 → predicted=551, confidence=91, probability=76, rank=27223`）
- [x] **Fix 1 源模块落库**：浏览器编辑 goal 后 `goal.target_score` 持久化到 DB
- [x] **Fix 2 target 同步**：`exam-predict.target_score` 从 620 同步为 700
- [x] **Fix 3 score_gap 服务端重算**：只传 `target_score=750` → 服务端返回 `score_gap=294`（750−456）
- [x] 带真实 token 写入 `u_f660e7e734c9` 桶的 `target_score` 能持久化并跨重启读回

### 待办
- [x] ~~端到端闭环验证（数据侧问题）~~ — 已澄清：无 token 的 PUT 只改 `__public__` 桶；带 token 写入后页面正常。联动 bug（源模块不落库 / target 不同步 / score_gap 脏数据）已在 2026-11-06 修复
- [ ] 确认 `legacy/js/main.js` 与 `dist/js/main.js` 的一致性；`deploy.sh` 是唯一合法同步路径，手工 `cp` 容易漏 `css/style.css`
- [ ] 决策题库文件（539×3 份）是否纳入 git
- [x] ~~`dist/backend/` 下被删除的后端副本残留标记~~ — 已在 `7bb6ce3` 提交中清理（7 个删除）
- [x] 本轮改动已提交 git：`7bb6ce3`（联动引擎 3 个修复 + PROGRESS.md + .trae 技能）、`f8b62b7`（补齐 334 个项目资产文件）

---

## 7. 给下一次接手的提示

1. 先跑 `git status` + `git log --oneline -5`，确认未提交改动的范围
2. 前后端是否在跑：`ss -ltnp | grep -E ':(8080|9999)'`
3. 前端改完必须同步 `legacy/ → dist/` 并 bump `?v=`（当前 `20261105G`），否则以为是"修了没生效"
4. 排查"页面显示旧值"的固定顺序：**响应包裹是否解包 → `triggerLinkages` 是否保存了源模块 → 是否有其他函数覆盖 DOM → 浏览器缓存 → token 是否有效（无 token 只改 `__public__` 桶）**
5. **典型信号**：目标卡片显示 `633 / 615` → 那是 `index-home.html` 里的硬编码默认值，说明 `loadModuleConfigs` 没跑（多半是后端挂了或请求失败），先查 `ss -ltnp` 和浏览器 console
6. 本会话的对话原文已被上下文压缩，细节以本文件 + `git diff` 为准
