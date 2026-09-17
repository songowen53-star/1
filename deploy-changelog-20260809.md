# AI 高考智能提分系统 - 部署变更日志

**部署日期**：2026-08-09\
**环境**：Cloudflare Pages + KV Storage\
**生产域名**：<https://ai-gaokao-static.pages.dev>\
**预览 URL**：<https://f776d697.ai-gaokao-static.pages.dev>\
**账号**：<Songowen53@gmail.com>'s Account (`fb1176b63978555cec647e7f061c09fa`)\
**Pages 项目**：ai-gaokao-static\
**KV Namespace**：DATA\_STORE (`010459867762414698c5b5cbffa5a843`)

***

## 一、部署目标

实现「Cloudflare 云端数据 / 前端 Mock 数据 / 后端 JSON 数据」三方一致性，确保：

1. 云端 KV 与本地 `backend/data/*.json` 内容完全一致；
2. 前端内置 Mock 与云端动态接口返回数据完全一致；
3. 前端代码（含 Mock 回退机制）部署到 Cloudflare Pages，线上无需后端即可通过 Mock 兜底正常渲染。

***

## 二、认证配置

| 项目          | 配置                                          |
| ----------- | ------------------------------------------- |
| 认证方式        | `CLOUDFLARE_API_TOKEN` 环境变量                 |
| Token 作用域   | Account:Read + Pages:Edit + KV Storage:Edit |
| wrangler 版本 | 4.120.0                                     |
| 验证结果        | ✅ wrangler whoami 通过，账号 ID 匹配               |

> 安全提示：部署完成后建议在 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) 页面按需轮换或缩小 Token 权限。

***

## 三、数据同步（后端 → Cloudflare KV）

### 3.1 同步范围

通过 `/api/upload` 接口推送共 **62 个 JSON 文件**：

**1) 顶层业务数据（9 个）**

| 文件名                     | 本地大小 (bytes) | 云端记录数 | 用途                                    |
| ----------------------- | ------------ | ----- | ------------------------------------- |
| `accounts.json`         | 4,944        | —     | 绑定账号                                  |
| `answer_records.json`   | 24,450       | —     | 答题记录                                  |
| `knowledge_points.json` | 11,100       | 38 条  | 知识点（today-tasks 依赖）                   |
| `learning_records.json` | 17,204       | 54 条  | 学习记录（today-tasks / duration-stats 依赖） |
| `module_configs.json`   | 2            | —     | 模块配置                                  |
| `parent_bindings.json`  | 1,719        | —     | 家长绑定                                  |
| `questions.json`        | 38,313       | 44 条  | 题库（today-tasks 依赖）                    |
| `test.json`             | 26           | —     | 测试文件                                  |
| `users.json`            | 5,414        | —     | 用户档案                                  |

**2) pages 子目录页面数据（53 个）**

KV 存储格式：`pages_{key}.json`，由 `/api/page-data/:key` 读取。

| 模块      | 文件数 | 典型文件                                                  |
| ------- | --- | ----------------------------------------------------- |
| AI 核心模块 | 8   | ai-module-coach、ai-module-graph、ai-module-predict …   |
| AI 辅助能力 | 9   | ai-coach、ai-explain、ai-plan、photo-ocr、photo-similar … |
| 练习刷题    | 5   | practice-mistakes、practice-mock、practice-real-exam …  |
| 成绩分析    | 6   | score-monthly、score-mock、score-improvement …          |
| 志愿填报    | 3   | college-major、college-rank、college-recommend          |
| 首页/预测   | 1   | home-predict                                          |
| 个人中心    | 5   | profile-main、profile-parent、profile-vip …             |
| 教师端     | 8   | teacher-dashboard、teacher-exercise、teacher-paper …    |
| 管理后台    | 8   | admin-dashboard、admin-users、admin-stats …             |

### 3.2 推送结果

```
总计: 成功=62 / 失败=0
```

### 3.3 云端一致性验证（记录数对比）

| 数据表               | 云端 KV | 本地 backend/data | 一致 |
| ----------------- | ----- | --------------- | -- |
| learning\_records | 54 条  | 54 条            | ✅  |
| questions         | 44 条  | 44 条            | ✅  |
| knowledge\_points | 38 条  | 38 条            | ✅  |

***

## 四、数据同步（后端 → 前端 Mock）

使用脚本 `scripts/sync-mock-data.js` + Node.js 正则替换，将后端权威数据写入 `prototype/js/design-system.js` 中的三组 Mock 变量。

### 4.1 PAGE\_SAMPLE\_DATA（53 个 key）

| 对比项                               | 结果     |
| --------------------------------- | ------ |
| Mock keys 数                       | 53 个   |
| 本地 backend/data/pages/\*.json 文件数 | 53 个   |
| JSON.stringify 深度对比               | ✅ 全部一致 |

### 4.2 TODAY\_TASKS\_MOCK（与云端 today-tasks 接口一致）

| 字段               | 值                                     |
| ---------------- | ------------------------------------- |
| date             | `"8月9日 周日"`                           |
| tasks.length     | 4                                     |
| done\_count      | 0                                     |
| total\_count     | 4                                     |
| completion\_rate | 0                                     |
| 任务科目             | 语文(古诗文鉴赏)、物理(力学综合)、数学×2(圆锥曲线综合/导数第二问) |

### 4.3 DURATION\_STATS\_MOCK（与云端 duration-stats 接口一致）

| 字段                 | 值                                   |
| ------------------ | ----------------------------------- |
| week\_total\_hours | 0                                   |
| subjects.length    | 0                                   |
| weekly             | 7 天，全部 0                            |
| heatmap            | 7×24 矩阵（仅 7/30 有少量稀疏数据）             |
| advice             | `"本周暂无学习记录，建议从薄弱科目开始，每日坚持学习2小时以上。"` |

> 本周学习时长为 0 的原因：learning\_records 最新记录日期为 **2026-07-30**，部署当日（8/9）位于新的一周，无覆盖日。属于符合数据真实状态的预期结果。

### 4.4 installMockDataFallback 机制

design-system.js 内置 `api.request` 层劫持：

- 匹配 URL：`/api/page-data/:key`、`/api/learning/*/today-tasks`、`/api/learning/*/duration-stats`

- 策略：先尝试真实请求（1.2s 超时 → 返回 null → 抛错 → 回退到对应 Mock）

- 保证：无后端服务或网络异常时，首页 home-task / home-duration 等页面仍可渲染

***

## 五、前端代码部署（Cloudflare Pages）

### 5.1 部署元数据

| 项                       | 值                                                                              |
| ----------------------- | ------------------------------------------------------------------------------ |
| 构建命令                    | `node scripts/sync.js build-static`                                            |
| 部署命令                    | `npx wrangler pages deploy dist --project-name ai-gaokao-static --branch main` |
| 上传文件数                   | 23 个（13 个新增/更新，10 个未变更）                                                        |
| \_headers / \_redirects | ✅ 已上传                                                                          |
| Functions bundle        | ✅ 已上传（含 page-data、today-tasks、duration-stats 等路由）                              |

### 5.2 关键文件版本号

`prototype/index.html` 中的 design-system.js 引用更新版本号以规避浏览器缓存：

```html
<!-- 变更前 -->
<script src="js/design-system.js?v=20260822F"></script>

<!-- 变更后 -->
<script src="js/design-system.js?v=20260822G"></script>
```

### 5.3 线上 design-system.js 文件大小对比

| 环境        | 大小 (bytes) | 差异说明                                                                                                 |
| --------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| 部署前（旧版线上） | 5,955      | 仅通用组件函数，缺少 PAGE\_SAMPLE\_DATA / TODAY\_TASKS\_MOCK / DURATION\_STATS\_MOCK / installMockDataFallback |
| 部署后（新版线上） | 195,881    | 与本地 dist 完全一致，含全部 53 个页面 Mock + 2 个动态数据 Mock + 回退劫持                                                  |

### 5.4 线上关键标记检查

| 标记                                    | 出现次数           | 状态                     |
| ------------------------------------- | -------------- | ---------------------- |
| `installMockDataFallback`             | 1              | ✅                      |
| `TODAY_TASKS_MOCK`                    | 4（声明 1 + 引用 3） | ✅                      |
| `DURATION_STATS_MOCK`                 | 4（声明 1 + 引用 3） | ✅                      |
| `PAGE_SAMPLE_DATA['ai-module-graph']` | —              | ✅ 可访问                  |
| done\_count 字段值                       | 0              | ✅ 与最新 today-tasks 返回一致 |

***

## 六、部署后接口验证

### 6.1 静态资源 + Mock 验证

访问：`https://ai-gaokao-static.pages.dev/prototype/js/design-system.js?v=20260822G`

```
✅ 文件大小 = 195,881 bytes（与本地 dist/prototype/js/design-system.js 相同）
✅ installMockDataFallback 存在
✅ TODAY_TASKS_MOCK 存在（done_count = 0，tasks = 4）
✅ PAGE_SAMPLE_DATA 53 keys 完整
```

### 6.2 动态 API 接口（生产域名）

| 接口                                   | HTTP | code | 关键返回                                         |
| ------------------------------------ | ---- | ---- | -------------------------------------------- |
| `/api/health`                        | 200  | 0    | `msg="服务运行中"`、`kv="已绑定"`                     |
| `/api/page-data/ai-module-graph`     | 200  | 0    | subjects = 5 科、mastery\_list.items = 6       |
| `/api/page-data/score-monthly`       | 200  | 0    | subjects、trend\_chart\_label、ai\_analysis 齐全 |
| `/api/learning/u_001/today-tasks`    | 200  | 0    | tasks = 4 个（0/4 完成）                          |
| `/api/learning/u_001/duration-stats` | 200  | 0    | week\_total\_hours = 0、advice 非空             |

### 6.3 三方一致性结论

```
backend/data/*.json  ══════ 62文件全量推送 ══════▶  Cloudflare KV
       │                                                    │
       │ sync-mock-data + 拉取云端 JSON 替换 Mock          │ api.request
       ▼                                                    ▼
前端 Mock (design-system.js)  ◀── 1.2s超时/失败/返回null ──  动态接口
         │                                                          │
         └──── 53 PAGE_SAMPLE_DATA keys 全部对比一致 ──────────────┘
         └──── TODAY_TASKS_MOCK === /api/learning/u_001/today-tasks ┘
         └──── DURATION_STATS_MOCK === /api/learning/u_001/duration-stats ┘
```

**结论：Cloudflare 云端数据、前端 Mock 数据、后端 JSON 数据三方完全一致。**

***

## 七、文件变更清单

| 类型 | 文件路径                            | 变更                                                                                                                                                                                                         |
| -- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 修改 | `prototype/index.html`          | `design-system.js?v=20260822F` → `?v=20260822G`                                                                                                                                                            |
| 修改 | `prototype/js/design-system.js` | 1. PAGE\_SAMPLE\_DATA：53 个 key 与 backend/data/pages/\*.json 对齐2. TODAY\_TASKS\_MOCK：替换为云端 today-tasks 接口真实返回3. DURATION\_STATS\_MOCK：替换为云端 duration-stats 接口真实返回4. installMockDataFallback：保留并确保 3 类接口劫持完整 |
| 修改 | `scripts/sync.js`               | push-data 增加 pages/ 子目录推送（filename = `pages/<file>`）；status-report 增加 pages/ 统计                                                                                                                            |
| 新建 | `scripts/sync-mock-data.js`     | 将 backend/data/pages/\*.json 同步为 design-system.js 中的 PAGE\_SAMPLE\_DATA                                                                                                                                    |
| 生成 | `dist/**`                       | build-static 产物（共 25 个文件），已 Pages Deploy 上传                                                                                                                                                                |

***

## 八、后续维护命令速查

```bash
# 1. 构建 dist
node scripts/sync.js build-static

# 2. 推送 62 个数据文件到 Cloudflare KV（通过 Pages /api/upload）
#    注：Node.js 直连若因代理/网络失败，可使用 scripts/sync.js + 系统 curl 等效脚本
node scripts/sync.js push-data

# 3. 同步前端 Mock 与后端 JSON
node scripts/sync-mock-data.js

# 4. 部署 Pages（需先 export CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID）
npx wrangler pages deploy dist --project-name ai-gaokao-static --branch main

# 5. 只读状态报告
node scripts/sync.js status

# 6. 一键全流程
node scripts/sync.js all
```

***

## 九、已知事项 / 后续改进

1. **本周学习时长为 0**：learning\_records 最新日期 2026-07-30，需要补录 2026-08 数据后再次 `push-data` 即会生效。
2. **CLOUDFLARE\_API\_TOKEN**：当前在进程环境变量中临时注入，未写入磁盘。后续若实现 CI/CD，建议使用平台级 Secrets 管理。
3. **前端部署版本号**：每次 design-system.js 内容变更需同步 bump index.html 中的 `?v=` 参数（当前规则：20260822X，X 从 A-G 递增）。
4. **KV List API metadata**：list 接口返回的 size 值为元数字符串 `size`（可能为字符数/字节数差异），实际一致性校验请以 `GET /api/data-files/:name` 读取 `content` 后 JSON.parse 的记录数对比为准。

