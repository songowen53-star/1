# AI 学习计划模块交互说明文档

> 版本：v20260901 ｜ 更新日期：2026-08-31 ｜ 覆盖端：主应用 `/index-home.html#page=plan` + 原型端 `/prototype/#home-plan`

---

## 1. 模块定位

**AI 学习计划** 是「首页」子模块下的核心功能页，基于用户的 **薄弱知识点掌握度数据 + 近期学习记录** 按时间维度（本周 / 下周 / 本月）生成个性化任务编排，并支持「AI 重新规划」一键刷新。

- 用户可交互入口：
  - 主应用：首页「今日学习计划」卡片 → 「查看全部」 或 URL Hash：`switchPage('plan')`
  - 原型端：左侧目录树「首页 → AI学习计划」

---

## 2. 分段控制器（Segmented Control）交互核心

### 2.1 UI 结构

页面头部摘要区下方渲染 3 段分段控件：

| 分段文本 | 对应 `range` 参数 | 数据规模 | 默认激活 |
|---------|-------------------|---------|---------|
| 本周    | `this_week`       | 7 天    | ✅ 是    |
| 下周    | `next_week`       | 7 天    | 否      |
| 本月    | `this_month`      | 28 天   | 否      |

DOM 结构：

```html
<div id="week-plan-segment">
  <div class="wp-segment-item active" onclick="window.switchSegment(this)">本周</div>
  <div class="wp-segment-item"        onclick="window.switchSegment(this)">下周</div>
  <div class="wp-segment-item"        onclick="window.switchSegment(this)">本月</div>
</div>
```

> 原型端使用的 class 名为 `proto-segment-item`，但 `onclick` 签名完全一致，所以同一套 `window.switchSegment(this)` 函数可覆盖两端。

### 2.2 交互流程（点击任意分段）

```
用户点击分段按钮
      │
      ▼
 ① switchSegment(el) ── 切换 CSS active 样式（白背景 + 阴影 + 蓝字 ↔ 灰字透明）
      │
      │  文本 → range 映射：{本周:this_week, 下周:next_week, 本月:this_month}
      ▼
 ② window._currentPlanRange = newRange  （全局记录当前范围，供「重新规划」复用）
      │
      ▼
 ③ loadSegmentPlan(range, shuffle=false)
      │
      ├─ 容器写入 loading 文案：「加载中，AI 正在为您生成计划…」
      │
      ├─ 调 api.getWeekPlan(shuffle, range)
      │     GET /api/recommend/{user_id}/week-plan?shuffle=0&range=this_week|next_week|this_month
      │
      ├─ 成功：fillWeekPlanSummary(data) 更新头部（摘要 + 已完成 N/总数）
      │        renderWeekPlanGrouped(data.week_plan, data.range) 渲染列表
      │
      └─ 失败：写入红色错误提示，并给出重试按钮
```

---

## 3. API 契约

### 3.1 请求

```
GET  /api/recommend/:user_id/week-plan
Query:
  shuffle   0|1    可选，默认 0，传 1 表示打乱重排
  range     string 可选，this_week（默认）| next_week | this_month
```

后端默认演示用户：`u_001`。真实已登录用户会使用 `Auth.getUserId()`。

### 3.2 响应（HTTP 200）

```json
{
  "code": 0,
  "data": {
    "week_plan": [
      {
        "day": "周一",
        "date": "9/7",
        "isToday": false,
        "week_group": 0,
        "week_group_name": "第1周",     // 仅 range=this_month 时非 null
        "tasks": [
          {
            "subject": "数学",
            "color": "blue",
            "point": "导数第二问",
            "time": "41min",
            "done": false
          }
        ]
      }
    ],
    "total_tasks": 25,
    "done_tasks": 12,
    "estimated_score_gain": 48,
    "weak_point_count": 24,
    "replanned": false,
    "range": "next_week",
    "range_label": "下周"
  }
}
```

字段语义：

| 字段 | 说明 |
|------|------|
| `week_plan[].date`  | 本地化 `M/D` 格式，下周一一定是本周周一日期 + 7 |
| `week_plan[].week_group` | 0/1/2/3 组号，本月视图每周一组 |
| `week_plan[].week_group_name` | 仅 `this_month` 时写为「第1周」~「第4周」 |
| `range_label` | 直接作为头部摘要中的「本周/下周/本月」文案源 |
| `done` | 仅 `this_week` 范围内今天之前的日期会根据近期学习记录置 true |
| `total_tasks / done_tasks` | 头部已完成进度条 & 摘要使用 |

### 3.3 后端双实现

项目同时支持两种后端运行模式，能力 100% 对等：

| 模式 | 文件 | 路由匹配 |
|------|------|---------|
| Cloudflare Pages Functions | [functions/api/recommend/[user_id]/week-plan.js](../functions/api/recommend/%5Buser_id%5D/week-plan.js) | 文件路径即路由 |
| Express (本地 `node backend/server.js`) | [backend/routes/recommend.js](../backend/routes/recommend.js) L276–L412 | `GET /api/recommend/:userId/week-plan` |

---

## 4. 渲染规则

### 4.1 本周 / 下周视图（flat 平铺）

- 按 **周一 → 周日** 依次渲染 7 张「日卡片」，卡片头显示「星期几（今天）· M/D · N个任务 · 共 Xmin」。
- 只有当 `range === this_week` 且日期 == 今日时，附加「（今天）」标签并高亮。
- 每张日卡片下方列出 N 条任务：学科色带 + 知识点名称 + 分钟数 + 播放/箭头图标，已完成任务前打勾并加删除线。

### 4.2 本月视图（grouped 分组）

共 28 天 = 连续 4 周（以本周周一为锚点），在 **每周第 1 天之前插入一条蓝色分组标题条**：

```
┌──────────────────────────────────────────────┐
│ 🌘 第1周  （8/31 ~ 9/6）            7 天     │  ← 分组标题条
├──────────────────────────────────────────────┤
│ 周一 · 8/31 · 4个任务 · 共 143min            │  ← 常规日卡
│ ...                                          │
│ 周日 · 9/6 · 3个任务 · 共 96min              │
├──────────────────────────────────────────────┤
│ 🌘 第2周  （9/7 ~ 9/13）           7 天     │
│ ...                                          │
│ 🌘 第4周  （9/21 ~ 9/27）          7 天     │
└──────────────────────────────────────────────┘
```

判定逻辑：

```javascript
// main.js: renderWeekPlanGrouped
// prototype: protoRenderPlanGrouped
if (range === 'this_month' || any(week_group_name 非空)) {
    按 week_group 分 4 组;
    每组插入 group header;
} else {
    平铺渲染;
}
```

### 4.3 头部摘要（`#week-plan-summary`）

结构：

```
AI智能学习计划
基于薄弱点分析 · {本周|下周|本月}共{total_tasks}个任务     {done}/{total_tasks} 已完成 · 预计提分 +{estimated_score_gain}
```

`{range_label}` / `{total_tasks}` / `{done_tasks}` / `{estimated_score_gain}` 每次 switchSegment 后都会刷新。

---

## 5. 「AI 重新规划」按钮

### 5.1 触发方式

页面底部按钮：「让 AI 重新规划」`class="btn-plan-replan"`。

### 5.2 交互链路

```
点击「重新规划」
   │
   ▼
executeReplan()
   │
   ├─ 读取当前 window._currentPlanRange（默认值 'this_week'，首次进入会初始化）
   │
   ├─ UI 过渡：按钮 → loading + disabled → 文案「AI 规划中…」
   │
   ├─ 调 loadSegmentPlan(currentRange, shuffle=true)
   │     GET ?shuffle=1&range=currentRange
   │     → shuffle 会在后端做：
   │          · 前 3 个高价值薄弱点随机内部分布
   │          · 后续薄弱点 Fisher-Yates 打乱
   │          · 起始天偏移 +0~6 天
   │          · 各任务分钟数 ±5 min 抖动
   │
   └─ 成功：重新渲染，并显示 toast：「规划已更新 · 当前范围：本周/下周/本月」
```

⚠️ **关键一致性约束**：点击「重新规划」后，**不会改变当前选中的分段范围**，仅在对应范围内打乱。若用户切到了「本月」再点重新规划，会返回 28 天的新版数据。

---

## 6. 代码入口一览（供研发）

### 6.1 主应用（/index-home.html → switchPage('plan')）

| 文件 | 关键函数 | 说明 |
|------|----------|------|
| [js/api.js](../js/api.js#L225-L233) | `api.getWeekPlan(shuffle, range)` | 拼接 `?shuffle=&range=` query，返回 `data`（已由 `api.request` 自动解包 `{code,data}`） |
| [js/main.js](../js/main.js#L1610-L1847) | `switchSegment(el)` | 分段点击主入口 |
| 同上 | `loadSegmentPlan(range, shuffle)` | AJAX + loading 过渡 + 渲染 |
| 同上 | `renderWeekPlanGrouped(planDays, range)` | 本月分组插入 / 平周平铺 |
| 同上 | `fillWeekPlanSummary(data)` | 写入 `#week-plan-summary` & 进度 |
| 同上 | `executeReplan()` | 读取 `window._currentPlanRange` 并 `shuffle=1` 重拉 |
| 同上 | `installPlanGlobals()` | 启动时把以上 4 个函数挂到 `window.*`，保证 `onclick` 内联可调用 |
| 同上 | `renderPlanPage(container)` | 生成 DOM 骨架 + 初始化 `_currentPlanRange='this_week'` + 首次 `loadSegmentPlan('this_week')` |

### 6.2 原型端（/prototype/ → home-plan 页）

| 文件 | 关键函数 | 说明 |
|------|----------|------|
| [prototype/js/api.js](../prototype/js/api.js#L241-L249) | `api.getWeekPlan(shuffle, range)` | 与主应用等价实现 |
| [prototype/js/pages-home.js](../prototype/js/pages-home.js#L736-L880) | `switchSegment(el)` | 挂到 window，响应 `Segment()` 生成的 `onclick="switchSegment(this)"` |
| 同上 | `protoLoadSegmentPlan(range, shuffle)` | 原型端 AJAX 加载 |
| 同上 | `protoRenderPlanGrouped(planDays, range)` | 原型端分组渲染（使用原型端 `Tag()` / `Card()`） |
| 同上 | `protoFillWeekPlanSummary(total, done, rangeLabel)` | 头部摘要填充 |
| 同上 | `registerPage('home-plan', {...})` | 切页时重置 range → `protoLoadSegmentPlan('this_week')` → 注入事件绑定 |

### 6.3 后端

| 文件 | 说明 |
|------|------|
| [functions/api/recommend/[user_id]/week-plan.js](../functions/api/recommend/%5Buser_id%5D/week-plan.js) | Functions 端，range 生成 → `buildDateRange(range, today)` → 分配薄弱点 → 补齐周六/周日模拟题 |
| [backend/routes/recommend.js](../backend/routes/recommend.js#L276-L412) | Express 端，算法与 Functions 端逐行对齐，返回结构完全相同 |

---

## 7. 调试与排查清单

若出现「点击下周/本月没有数据」或「分段点击无响应」，按以下顺序排查：

### ① `window.switchSegment` 是否定义？

```js
typeof window.switchSegment  // → 必须为 "function"
// 若 undefined：主应用检查 installPlanGlobals() 是否执行；原型端检查 pages-home.js 是否加载
```

### ② API 是否正常返回？

直接打开（替换 user_id 与 range）：

```
https://<PAGES_DOMAIN>/api/recommend/u_001/week-plan?range=next_week
https://<PAGES_DOMAIN>/api/recommend/u_001/week-plan?range=this_month
```

期望：`code === 0` 且 `data.week_plan.length === 7 或 28`。

### ③ 本周/下月日期锚点是否正确？

今天是 2026-08-31（周一），则：

| range | 首日 date | 周末 date |
|-------|-----------|-----------|
| this_week   | 8/31 | 9/6 |
| next_week   | 9/7  | 9/13 |
| this_month  | 8/31（第1周）→ 9/27（第4周末） | — |

若首日偏移异常，检查 `buildDateRange()` 中 `getMondayOf(today)` 的计算。

### ④ 本月视图分组数 ≠ 4？

先查 API：

```bash
curl 'https://<PAGES>/api/recommend/u_001/week-plan?range=this_month' \
  | jq '.data.week_plan | group_by(.week_group) | length'  # 期望 4
```

若 API 正确但前端未分组，检查 `renderWeekPlanGrouped` 中 `week_group_name` 判定是否被 `range !== 'this_month'` 短路。

### ⑤ 「重新规划」后跳回本周？

说明 `window._currentPlanRange` 未持久化，检查：

```js
// 进入 plan 页时必须有：
window._currentPlanRange = window._currentPlanRange || 'this_week';
```

### ⑥ 原型端显示 mock 数据而非真实请求？

原型端 `design-system.js` 会安装「API Mock Fallback」（浏览器 Console 可见），这是**降级策略**，只有在 API 请求失败/无网络时才生效。真实部署在 Cloudflare Pages 且健康检查通过时，将优先返回真实 week-plan 数据。可用 DevTools Network 面板确认请求 `status === 200` 且 URL 带 `?range=`。

---

## 8. 发布 & 验证流程

代码改动后，执行：

```bash
# 1) 同步到 dist/
node scripts/sync.js build-static

# 2) 发布到 Cloudflare Pages（需要 CLOUDFLARE_API_TOKEN 环境变量）
node scripts/sync.js deploy
# 或直接
CLOUDFLARE_API_TOKEN=<your_token> npx wrangler pages deploy ./dist --project-name ai-gaokao-static --branch main
```

部署后自动化验证（与 2026-08-31 本轮验证一致）：

1. 健康接口：`/api/health` → code=0, kv=已绑定
2. curl 三档 range → 7 / 7 / 28 天，本月 group_count=4，range_label 匹配
3. 浏览器点击三段：激活态切换 + AJAX 请求 URL 携带对应 `?range=` + 摘要文案更新
4. 本月视图分组标题：「第1周（8/31 ~ 9/6） / 第2周 / 第3周 / 第4周」
5. 原型端 / 主应用两侧都需独立走通

---

## 9. 变更历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v20260901 | 2026-08-31 | 新增「下周 / 本月」分段交互能力：week-plan API 支持 range 参数，主/原型双端 switchSegment 接入 loadSegmentPlan → 分组渲染；重新规划按钮固定在当前 range 内刷新 |
