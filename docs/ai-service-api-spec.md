# AI 服务接口定义文档

> 版本：2.0 | 更新日期：2026-09-15 | 适用范围：AI高考智能提分系统 · 后端 AI 服务全部子模块（4 核心 + 11 扩展）
> 对齐架构闭环：应用层 → API Gateway → 服务层（用户/学习/AI）→ 数据层 → 学情数据仓库 → 实时学情报告 → 输出层

---

## 目录

1. [文档概览](#1-文档概览)
2. [通用约定](#2-通用约定)
3. [AI 诊断子模块（核心）](#3-ai-诊断子模块核心)
4. [AI 规划子模块（核心）](#4-ai-规划子模块核心)
5. [AI 推荐子模块（核心）](#5-ai-推荐子模块核心)
6. [AI 报告子模块（核心）](#6-ai-报告子模块核心)
7. [AI 讲题引擎子模块（扩展）](#7-ai-讲题引擎子模块扩展)
8. [AI 答疑子模块（扩展）](#8-ai-答疑子模块扩展)
9. [AI 错题分析子模块（扩展）](#9-ai-错题分析子模块扩展)
10. [AI 学习教练子模块（扩展）](#10-ai-学习教练子模块扩展)
11. [AI 知识图谱子模块（扩展）](#11-ai-知识图谱子模块扩展)
12. [AI 自动入库子模块（扩展）](#12-ai-自动入库子模块扩展)
13. [AI 模型中心子模块（扩展）](#13-ai-模型中心子模块扩展)
14. [拍照搜题子模块（扩展）](#14-拍照搜题子模块扩展)
15. [教师 AI 工作台子模块（扩展）](#15-教师-ai-工作台子模块扩展)
16. [运营 AI 审核子模块（扩展）](#16-运营-ai-审核子模块扩展)
17. [高频考点子模块（扩展）](#17-高频考点子模块扩展)
18. [数据流闭环映射](#18-数据流闭环映射)
19. [错误码表](#19-错误码表)

---

## 1. 文档概览

### 1.1 与架构闭环的对应关系

```
应用层(学生APP/教师后台/运营后台)
        ↓ API/HTTPS
API Gateway (/api/* 接口层)
        ↓
服务层 ─┬─ 用户服务  (/api/auth, /api/users)
        ├─ 学习服务  (/api/learning, /api/knowledge, /api/questions, /api/answers)
        └─ AI 服务   ← 本文档（4 核心 + 11 扩展）
                ├─【核心】AI 诊断  (学情采集 + 薄弱点识别 + AI对话)
                ├─【核心】AI 规划  (学习计划 + 周计划)
                ├─【核心】AI 推荐  (题目推荐 + 智能组卷)
                ├─【核心】AI 报告  (分数预测 + 排名 + 趋势)
                ├─【扩展】AI 讲题引擎   (分步讲解 + 理解度检测)
                ├─【扩展】AI 答疑      (学科问答 + 拍照提问)
                ├─【扩展】AI 错题分析  (错题归因 + 提分空间)
                ├─【扩展】AI 学习教练  (1对1对话 + 学情诊断)
                ├─【扩展】AI 知识图谱  (个人图谱 + 节点关系)
                ├─【扩展】AI 自动入库  (PDF→OCR→LLM切题→JSON→审核)
                ├─【扩展】AI 模型中心  (模型管理 + 路由策略)
                ├─【扩展】拍照搜题     (OCR + 解析 + 相似 + 视频)
                ├─【扩展】教师 AI 工作台 (上传+切题+解析+标点+组卷)
                ├─【扩展】运营 AI 审核  (OCR审核 + AI审核队列)
                └─【扩展】高频考点     (考点热度 + 命题趋势)
        ↓
数据层 (用户库/题库/行为库/知识图谱/能力模型)
        ↓
学情数据仓库 → 实时学情报告 → 输出层(学生/教师/运营)
```

### 1.2 AI 服务全部子模块清单

#### 核心 4 子模块（已在 backend/routes 实现）

| 子模块 | 路由前缀 | 职责 | 输入 | 输出 |
|--------|---------|------|------|------|
| AI 诊断 | `/api/ai`, `/api/learning`, `/api/knowledge` | 采集学情、识别薄弱点、AI 对话推理 | 用户行为、答题记录、问题 | 学情记录、薄弱知识点、AI 解析 |
| AI 规划 | `/api/recommend` (plan 部分) | 基于学情生成每日/每周学习计划 | 学情数据、薄弱点 | 学习任务列表、周计划 |
| AI 推荐 | `/api/recommend` (questions/paper) | 难度自适应题目推荐与智能组卷 | 薄弱点、掌握率、难度 | 题目列表、组卷结果 |
| AI 报告 | `/api/predict` | 高考分数预测、排名预测、学情报告 | 学情数据、知识点掌握率 | 预测分数、排名、趋势报告 |

#### 扩展 11 子模块（已全部实现）

| 子模块 | 对应原型页面 | 路由前缀 | 实现状态 |
|--------|-------------|---------|---------|
| AI 讲题引擎 | `ai-module-explain`, `ai-explain` | `/api/ai/explain/*` | ✅ 已实现 (routes/ai-explain.js) |
| AI 答疑 | `ai-qa` | `/api/ai/qa/*` | ✅ 已实现 (routes/ai-qa.js) |
| AI 错题分析 | `ai-error` | `/api/ai/error/*` | ✅ 已实现 (routes/ai-error.js) |
| AI 学习教练 | `ai-module-coach`, `ai-coach` | `/api/ai/coach/*` | ✅ 已实现 (routes/ai-coach.js) |
| AI 知识图谱 | `ai-module-graph` | `/api/ai/graph/*` | ✅ 已实现 (routes/ai-graph.js) |
| AI 自动入库 | `ai-auto-import`, `ai-auto-import-ocr`, `ai-auto-import-cut` | `/api/ai/import/*` | ✅ 已实现 (routes/ai-import.js) |
| AI 模型中心 | `ai-model-center` | `/api/ai/models/*` | ✅ 已实现 (routes/ai-models.js) |
| 拍照搜题 | `photo-ocr`, `photo-parse`, `photo-similar`, `photo-video` | `/api/photo/*` | ✅ 已实现 (routes/photo.js) |
| 教师 AI 工作台 | `teacher-upload`, `teacher-split`, `teacher-parse`, `teacher-tag`, `teacher-paper`, `teacher-exercise` | `/api/teacher/*` | ✅ 已实现 (routes/teacher-ai.js 扩展) |
| 运营 AI 审核 | `admin-ocr`, `admin-ai-review` | `/api/admin/review/*` | ✅ 已实现 (routes/admin-review.js) |
| 高频考点 | `practice-hotpoints` | `/api/practice/hotpoints/*` | ✅ 已实现 (routes/practice-hotpoints.js) |

### 1.3 子模块间数据流向

```
[学情采集]→[薄弱点识别]→[AI规划/推荐]→[学生做题]→[新学情]→[AI报告]→[反馈调整]
   ↑                                                                    │
   └─────────────────────── 闭环反馈 ───────────────────────────────────┘
```

扩展子模块在闭环中的位置：
- **AI 讲题引擎 / AI 答疑 / AI 学习教练** ← 学生在「做题」环节触发，输出到「新学情」
- **AI 错题分析 / AI 知识图谱** ← 接收「新学情」后更新知识图谱与错题归因
- **AI 自动入库 / 教师 AI 工作台** ← 充实「题库」「知识图谱」，扩充 AI 推荐原料
- **运营 AI 审核** ← 校验「AI 自动入库」产出，保障数据质量
- **拍照搜题 / 高频考点 / AI 模型中心** ← 横切能力，贯穿学生/教师/运营三类用户

---

## 2. 通用约定

### 2.1 Base URL

| 环境 | Base URL |
|------|---------|
| 本地开发 | `http://127.0.0.1:3000` |
| 云端部署 | `https://ai-gaokao-static.pages.dev` (通过 Pages Functions 代理) |

### 2.2 请求规范

- **协议**: HTTP/1.1 或 HTTP/2 over HTTPS
- **编码**: UTF-8
- **请求体**: `Content-Type: application/json`
- **认证**: 请求头 `Authorization: Bearer <jwt_token>`（除 `/api/ai/health` 等公开接口）
- **限流**: 单用户 60 次/分钟，AI 对话接口 20 次/分钟

### 2.3 统一响应包装

所有接口（除 SSE 流式接口外）均使用统一响应格式：

```json
{
  "code": 0,
  "msg": "成功",
  "data": { },
  "total": 0
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | number | 0=成功，非 0=失败（见[错误码表](#8-错误码表)） |
| `msg` | string | 提示信息 |
| `data` | object/array/null | 业务数据 |
| `total` | number | 列表数据总条数（仅列表接口返回） |

### 2.4 SSE 流式响应规范

AI 对话接口使用 Server-Sent Events 流式输出：

- **Content-Type**: `text/event-stream; charset=utf-8`
- **Cache-Control**: `no-cache, no-store, must-revalidate`
- **Connection**: `keep-alive`
- **X-Accel-Buffering**: `no`（禁用 Nginx 缓冲）

事件序列：`route` → `rag` × N → `reply` → `attribution` → `done`

---

## 3. AI 诊断子模块（核心）

### 3.1 模块职责

- 采集学生学习行为数据（学习时长、做题记录、正确率）
- 识别薄弱知识点（掌握率 < 0.7）
- 提供 AI 对话推理能力（SSE 流式输出，含 RAG 检索）
- 支撑数据层"行为库"和"知识图谱"的写入与查询

### 3.2 接口清单

| 方法 | 路径 | 功能 | 来源文件 |
|------|------|------|---------|
| POST | `/api/learning` | 上传学情记录 | routes/learning.js |
| GET | `/api/learning/:user_id` | 获取学情列表 | routes/learning.js |
| GET | `/api/learning/:user_id/summary` | 学情汇总 | routes/learning.js |
| GET | `/api/learning/:user_id/subject-stats` | 学科统计 | routes/learning.js |
| GET | `/api/learning/:user_id/review-progress` | 复习进度 | routes/learning.js |
| GET | `/api/learning/:user_id/today-tasks` | 今日任务 | routes/learning.js |
| GET | `/api/learning/:user_id/duration-stats` | 学习时长统计 | routes/learning.js |
| GET | `/api/learning/:user_id/daily-series` | 每日学习序列 | routes/learning.js |
| GET | `/api/learning/:user_id/subject-mastery` | 学科掌握度 | routes/learning.js |
| GET | `/api/knowledge/weak` | 薄弱知识点 | routes/knowledge.js |
| GET | `/api/knowledge/` | 知识点列表 | routes/knowledge.js |
| GET | `/api/knowledge/:id` | 知识点详情 | routes/knowledge.js |
| POST | `/api/knowledge/` | 创建知识点 | routes/knowledge.js |
| POST | `/api/ai/chat` | AI 对话诊断（SSE） | routes/ai.js |
| GET | `/api/ai/health` | AI 服务健康检查 | routes/ai.js |

### 3.3 上传学情记录

**POST** `/api/learning`

采集一次学习行为数据，写入数据层"行为库"。

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `user_id` | string | 是 | 用户 ID |
| `date` | string | 否 | 学习日期 `YYYY-MM-DD`，默认今天 |
| `subject` | string | 是 | 学科（数学/语文/英语/物理/化学/生物/政治/历史/地理） |
| `knowledge_point_id` | string | 否 | 关联知识点 ID |
| `duration_min` | number | 否 | 学习时长（分钟） |
| `questions_count` | number | 否 | 做题数 |
| `correct_count` | number | 否 | 正确数 |

**请求示例**

```json
{
  "user_id": "u_001",
  "date": "2026-09-15",
  "subject": "数学",
  "knowledge_point_id": "kp_math_001",
  "duration_min": 41,
  "questions_count": 12,
  "correct_count": 8
}
```

**响应示例**

```json
{
  "code": 0,
  "msg": "学情已记录",
  "data": {
    "id": "lr_1789298920982",
    "user_id": "u_001",
    "date": "2026-09-15",
    "subject": "数学",
    "knowledge_point_id": "kp_math_001",
    "duration_min": 41,
    "questions_count": 12,
    "correct_count": 8,
    "created_at": "2026-09-15T06:17:34.962Z"
  }
}
```

**错误响应**

| HTTP | code | msg |
|------|------|-----|
| 400 | 1001 | user_id 和 subject 必填 |

### 3.4 获取学情列表

**GET** `/api/learning/:user_id?days=7`

**路径参数**

| 字段 | 类型 | 说明 |
|------|------|------|
| `user_id` | string | 用户 ID |

**查询参数**

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `days` | number | 7 | 查询最近 N 天 |

**响应示例**

```json
{
  "code": 0,
  "data": [
    {
      "id": "lr_1789298920982",
      "user_id": "u_001",
      "date": "2026-09-15",
      "subject": "数学",
      "duration_min": 41,
      "questions_count": 12,
      "correct_count": 8
    }
  ],
  "total": 1
}
```

### 3.5 学情汇总

**GET** `/api/learning/:user_id/summary?days=7`

返回指定时间窗口内的总时长、总题数、正确率、积分，支撑首页"成长记录"卡片。

**响应示例**

```json
{
  "code": 0,
  "data": {
    "total_duration_min": 280,
    "total_questions": 86,
    "total_correct": 62,
    "correct_rate": 72,
    "points": 1240,
    "vs_last_period": {
      "duration_pct": 15,
      "questions_pct": 8,
      "correct_rate_pct": 5,
      "points_pct": 12
    }
  }
}
```

### 3.6 学科统计

**GET** `/api/learning/:user_id/subject-stats?days=30`

按学科维度聚合学情数据，支撑"学科能力雷达图"。

**响应示例**

```json
{
  "code": 0,
  "data": [
    { "subject": "数学", "duration_min": 320, "questions": 45, "correct_rate": 68 },
    { "subject": "语文", "duration_min": 180, "questions": 22, "correct_rate": 82 }
  ]
}
```

### 3.7 复习进度

**GET** `/api/learning/:user_id/review-progress`

返回各学科知识点的复习覆盖率与待复习列表。

**响应示例**

```json
{
  "code": 0,
  "data": {
    "total_points": 320,
    "reviewed_points": 215,
    "coverage_rate": 67,
    "pending": [
      { "subject": "数学", "point": "导数第二问", "priority": "high" },
      { "subject": "物理", "point": "电磁感应综合", "priority": "medium" }
    ]
  }
}
```

### 3.8 今日任务

**GET** `/api/learning/:user_id/today-tasks`

返回今日学习计划任务清单（与 AI 规划子模块联动）。

**响应示例**

```json
{
  "code": 0,
  "data": {
    "date": "2026-09-15",
    "total": 8,
    "completed": 0,
    "estimated_min": 283,
    "tasks": [
      { "id": "t_001", "subject": "数学", "point": "导数第二问", "duration_min": 41, "status": "pending" },
      { "id": "t_002", "subject": "历史", "point": "中国近代史", "duration_min": 35, "status": "pending" }
    ]
  }
}
```

### 3.9 学习时长统计

**GET** `/api/learning/:user_id/duration-stats?days=7`

返回每日学习时长序列，支撑"学习日历"卡片。

**响应示例**

```json
{
  "code": 0,
  "data": {
    "total_min": 1680,
    "target_min": 2520,
    "completion_rate": 67,
    "daily": [
      { "date": "2026-09-09", "min": 240 },
      { "date": "2026-09-10", "min": 180 }
    ]
  }
}
```

### 3.10 每日学习序列

**GET** `/api/learning/:user_id/daily-series?days=30`

返回每日学习时长/做题数/正确率三指标时间序列，支撑趋势图。

**响应示例**

```json
{
  "code": 0,
  "data": [
    { "date": "2026-09-01", "min": 240, "questions": 30, "correct_rate": 70 },
    { "date": "2026-09-02", "min": 180, "questions": 22, "correct_rate": 75 }
  ]
}
```

### 3.11 学科掌握度

**GET** `/api/learning/:user_id/subject-mastery`

按学科聚合知识点掌握率，支撑"AI 学情分析"卡片。

**响应示例**

```json
{
  "code": 0,
  "data": [
    { "subject": "数学", "mastery_rate": 0.52, "score": 101, "max": 150 },
    { "subject": "语文", "mastery_rate": 0.75, "score": 113, "max": 150 }
  ]
}
```

### 3.12 薄弱知识点

**GET** `/api/knowledge/weak?subject=数学&limit=10`

返回掌握率 < 0.7 的知识点，按提分收益降序。AI 推荐与 AI 规划子模块的核心输入。

**查询参数**

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `subject` | string | - | 学科过滤 |
| `limit` | number | 10 | 返回条数 |

**响应示例**

```json
{
  "code": 0,
  "data": [
    {
      "id": "kp_math_001",
      "subject": "数学",
      "point": "圆锥曲线综合",
      "mastery_rate": 0.17,
      "score_gain": 18,
      "suggestion": "优先突破"
    },
    {
      "id": "kp_math_002",
      "subject": "数学",
      "point": "导数第二问",
      "mastery_rate": 0.52,
      "score_gain": 14,
      "suggestion": "重点突破"
    }
  ],
  "total": 2
}
```

### 3.13 知识点列表

**GET** `/api/knowledge/?subject=数学&page=1&size=20`

分页查询知识点，支撑知识图谱可视化。

**查询参数**

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `subject` | string | - | 学科过滤 |
| `page` | number | 1 | 页码 |
| `size` | number | 20 | 每页条数 |

### 3.14 知识点详情

**GET** `/api/knowledge/:id`

返回知识点详情，含关联题目和前置依赖。

**响应示例**

```json
{
  "code": 0,
  "data": {
    "id": "kp_math_001",
    "subject": "数学",
    "point": "圆锥曲线综合",
    "mastery_rate": 0.17,
    "score_gain": 18,
    "prerequisites": ["椭圆定义", "双曲线定义", "抛物线定义"],
    "related_questions": 24
  }
}
```

### 3.15 创建知识点

**POST** `/api/knowledge/`

教师后台/运营后台录入新知识点。

**请求体**

```json
{
  "subject": "数学",
  "point": "极坐标与参数方程",
  "score_gain": 8,
  "prerequisites": ["极坐标概念", "参数方程概念"]
}
```

### 3.16 AI 对话诊断（SSE 流式）

**POST** `/api/ai/chat`

AI 诊断的核心推理接口。基于规则路由选择 AI 模型，经 RAG 知识库检索后流式输出三段式回复（分析+答案）。

**请求体**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `question` | string | 是 | 学生提问内容 |
| `user_id` | string | 否 | 用户 ID，默认 `guest` |

**请求示例**

```json
{
  "question": "导数怎么求",
  "user_id": "u_001"
}
```

**SSE 事件序列**

```
event: route
data: {"modelKey":"deepseek-r1","modelName":"DeepSeek-R1","badge":"推理王","color":"#3B82F6","icon":"fa-brain","role":"理科链式推理 (CoT)","license":"MIT","subject":"数学","strengths":["数学","物理","化学","生物"]}

event: rag
data: {"step":0,"total":4,"label":"BGE-M3 向量编码"}

event: rag
data: {"step":1,"total":4,"label":"Milvus 相似度检索"}

event: rag
data: {"step":2,"total":4,"label":"bge-reranker 重排"}

event: rag
data: {"step":3,"total":4,"label":"DeepSeek-R1 CoT 推理中"}

event: reply
data: {"subject":"数学","question":"导数怎么求","analysis":"导数问题从定义出发...","answer":"<b>常用求导公式</b>：(xⁿ)'=nxⁿ⁻¹..."}

event: attribution
data: {"modelName":"DeepSeek-R1","badge":"推理王","color":"#3B82F6","icon":"fa-brain","license":"MIT","role":"理科链式推理 (CoT)","engine":"vLLM","tokens":342,"ragUsed":true,"retrievalCount":5}

event: done
data: {"code":0}
```

**模型路由规则**

| 关键词匹配 | 路由模型 | 适用学科 |
|-----------|---------|---------|
| 组卷/出题/练习题/试卷 | Qwen3-72B | 组卷 |
| 学习计划/规划/复习/冲刺 | Qwen3-72B | 学习规划 |
| 错题/薄弱/总结/复盘 | Qwen3-72B | 错题分析 |
| 数学/导数/函数/数列/概率 | DeepSeek-R1 | 数学 |
| 物理/力学/电磁/能量 | DeepSeek-R1 | 物理 |
| 化学/反应/有机/平衡 | DeepSeek-R1 | 化学 |
| 生物/基因/细胞/遗传 | DeepSeek-R1 | 生物 |
| 语文/古诗/文言文/作文 | DeepSeek-V3 | 语文 |
| 英语/grammar/词汇/阅读 | DeepSeek-V3 | 英语 |
| 政治/哲学/经济/文化 | DeepSeek-V3 | 政治 |
| 历史/朝代/战争/事件 | DeepSeek-V3 | 历史 |
| 地理/气候/地形/河流 | DeepSeek-V3 | 地理 |
| 默认（无匹配） | DeepSeek-R1 | 综合 |

**特殊能力**

- **算术求解器拦截**: 输入包含纯算式（如"125×8÷5等于多少"）时直接返回计算结果，不走 LLM 推理
- **RAG 知识库**: 内置高考核心知识点 KB，命中关键词时返回结构化分析与答案
- **学科兜底**: 未命中 KB 时按关键词猜测学科并返回通用解题思路

**错误响应**

| HTTP | code | msg |
|------|------|-----|
| 400 | 1002 | 问题不能为空 |

### 3.17 AI 服务健康检查

**GET** `/api/ai/health`

**响应示例**

```json
{
  "code": 0,
  "msg": "AI 推理服务运行中",
  "models": [
    { "key": "deepseek-r1", "name": "DeepSeek-R1", "status": "running", "engine": "vLLM" },
    { "key": "deepseek-v3", "name": "DeepSeek-V3", "status": "running", "engine": "vLLM" },
    { "key": "qwen3-72b", "name": "Qwen3-72B", "status": "running", "engine": "vLLM" }
  ],
  "ragPipeline": ["BGE-M3 向量编码", "Milvus 相似度检索", "bge-reranker 重排", "模型推理"],
  "time": "2026-09-15T06:17:34.962Z"
}
```

---

## 4. AI 规划子模块（核心）

### 4.1 模块职责

- 基于学情数据（AI 诊断输出）生成每日学习计划
- 生成每周学习计划
- 任务按薄弱点提分收益降序分配时长
- 输出供"今日任务"卡片与"AI 学习计划"卡片消费

### 4.2 接口清单

| 方法 | 路径 | 功能 | 来源文件 |
|------|------|------|---------|
| GET | `/api/recommend/:user_id/plan` | 生成今日学习计划 | routes/recommend.js |
| GET | `/api/recommend/:user_id/week-plan` | 生成本周学习计划 | routes/recommend.js |

### 4.3 生成今日学习计划

**GET** `/api/recommend/:user_id/plan?date=2026-09-15`

**查询参数**

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `date` | string | 今天 | 计划日期 `YYYY-MM-DD` |

**算法逻辑**

1. 查询用户薄弱知识点（掌握率 < 0.7）
2. 按提分收益（`score_gain`）降序排序
3. 按收益占比分配学习时长（总时长默认 280 分钟）
4. 每个薄弱点对应一个学习任务

**响应示例**

```json
{
  "code": 0,
  "data": {
    "date": "2026-09-15",
    "total_min": 283,
    "task_count": 8,
    "tasks": [
      {
        "id": "t_001",
        "subject": "数学",
        "knowledge_point": "导数第二问",
        "knowledge_point_id": "kp_math_002",
        "duration_min": 41,
        "priority": "high",
        "mastery_rate": 0.52,
        "score_gain": 14
      },
      {
        "id": "t_002",
        "subject": "历史",
        "knowledge_point": "中国近代史",
        "duration_min": 35,
        "priority": "medium",
        "mastery_rate": 0.65,
        "score_gain": 8
      }
    ]
  }
}
```

### 4.4 生成本周学习计划

**GET** `/api/recommend/:user_id/week-plan?start=2026-09-15`

**查询参数**

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `start` | string | 周一 | 起始日期 `YYYY-MM-DD` |

**响应示例**

```json
{
  "code": 0,
  "data": {
    "week_start": "2026-09-15",
    "week_end": "2026-09-21",
    "total_min": 1680,
    "target_min": 2520,
    "days": [
      {
        "date": "2026-09-15",
        "weekday": "一",
        "tasks_count": 8,
        "planned_min": 283,
        "focus_subjects": ["数学", "历史", "地理"]
      },
      {
        "date": "2026-09-16",
        "weekday": "二",
        "tasks_count": 7,
        "planned_min": 240,
        "focus_subjects": ["物理", "化学"]
      }
    ]
  }
}
```

---

## 5. AI 推荐子模块（核心）

### 5.1 模块职责

- 基于薄弱知识点 + 难度自适应推荐题目
- 智能组卷（生成完整试卷）
- 避免重复推荐已答过的题目
- 难度自适应规则：掌握率越低，推荐题目难度越低（基础题为主）

### 5.2 接口清单

| 方法 | 路径 | 功能 | 来源文件 |
|------|------|------|---------|
| GET | `/api/recommend/:user_id/questions` | 推荐题目 | routes/recommend.js |
| GET | `/api/recommend/:user_id/paper` | 智能组卷 | routes/recommend.js |

### 5.3 推荐题目

**GET** `/api/recommend/:user_id/questions?count=10&subject=数学`

**查询参数**

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `count` | number | 10 | 推荐题目数 |
| `subject` | string | - | 学科过滤 |

**算法逻辑**

1. 查询用户薄弱知识点（掌握率 < 0.7，且题库中确实有对应题目）
2. 按提分收益降序排序
3. 按收益占比分配题目数量
4. 每个薄弱点根据掌握率选择合适难度区间：
   - 掌握率 < 0.4 → 难度 1/2/3（基础题）
   - 掌握率 < 0.6 → 难度 2/3/4（中等题）
   - 掌握率 < 0.8 → 难度 3/4/5（提升题）
   - 掌握率 ≥ 0.8 → 难度 4/5（挑战题）
5. 排除用户已答过的题目

**响应示例**

```json
{
  "code": 0,
  "data": [
    {
      "id": "q_001",
      "knowledge_point_id": "kp_math_002",
      "subject": "数学",
      "knowledge_point": "导数第二问",
      "type": "解答题",
      "difficulty": 3,
      "content": "已知函数 f(x) = x³ - 3x² + 2，求 f(x) 的极值...",
      "options": null,
      "answer": "极大值 f(0)=2，极小值 f(2)=-2",
      "analysis": "求导 f'(x)=3x²-6x，令 f'(x)=0 得 x=0 或 x=2...",
      "mastery_rate": 0.52,
      "score_gain": 14
    }
  ],
  "total": 10,
  "strategy": "weakness_driven"
}
```

**特殊响应**

```json
{
  "code": 0,
  "data": [],
  "msg": "当前无薄弱知识点，可挑战综合题",
  "strategy": "maintain"
}
```

### 5.4 智能组卷

**GET** `/api/recommend/:user_id/paper?subject=数学&question_count=20&total_score=150`

**查询参数**

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `subject` | string | - | 学科 |
| `question_count` | number | 20 | 题目数量 |
| `total_score` | number | 150 | 试卷总分 |

**算法逻辑**

1. 综合考虑用户所有薄弱点
2. 题型分布按高考真题比例（选择 40% / 填空 20% / 解答 40%）
3. 难度分布：基础 30% / 中等 50% / 提升 20%
4. 每题分值按题型与总分自动分配

**响应示例**

```json
{
  "code": 0,
  "data": {
    "paper_id": "paper_20260915_u001",
    "paper_name": "u_001 专属智能组卷 · 2026-09-15",
    "subject": "数学",
    "total_score": 150,
    "question_count": 20,
    "duration_min": 120,
    "type_distribution": {
      "选择题": { "count": 8, "score_per": 5, "total": 40 },
      "填空题": { "count": 4, "score_per": 5, "total": 20 },
      "解答题": { "count": 8, "score_per": 11.25, "total": 90 }
    },
    "difficulty_distribution": {
      "基础": 6,
      "中等": 10,
      "提升": 4
    },
    "questions": [
      {
        "seq": 1,
        "id": "q_001",
        "type": "选择题",
        "difficulty": 2,
        "content": "已知集合 A={1,2,3}，B={2,3,4}，则 A∩B=？",
        "options": ["{1}", "{2,3}", "{1,2,3,4}", "∅"],
        "answer": "B",
        "score": 5,
        "knowledge_point": "集合运算",
        "knowledge_point_id": "kp_math_010"
      }
    ]
  }
}
```

---

## 6. AI 报告子模块（核心）

### 6.1 模块职责

- 基于考点掌握率 + 答题趋势预测高考分数
- 省排名预测（基于正态分布）
- 985/211 录取概率计算
- 生成综合学情报告，支撑"实时学情报告"层

### 6.2 接口清单

| 方法 | 路径 | 功能 | 来源文件 |
|------|------|------|---------|
| GET | `/api/predict/:user_id/score` | 高考分数预测 | routes/predict.js |
| GET | `/api/predict/:user_id/rank` | 排名预测 | routes/predict.js |
| GET | `/api/predict/:user_id/report` | 综合学情报告 | routes/predict.js |
| GET | `/api/predict/:user_id/score-trend` | 分数趋势 | routes/predict.js |

### 6.3 高考分数预测

**GET** `/api/predict/:user_id/score`

**算法逻辑**

1. 对每个核心科目（数学/语文/英语/物理/化学）：
   - 查询该科目所有知识点
   - 按 `score_gain + 1` 作为权重计算加权平均掌握率
   - 通过非线性映射得到得分率：`scoreRate = min(0.98, 0.45 + 0.5 × mastery)`
   - 预测分数 = 满分 × scoreRate
2. 计算学习趋势斜率（近 7 天 vs 前 7 天正确率变化）
3. 综合预测分数 = 基础预测 + 趋势修正
4. 计算 985/211 录取概率（基于省正态分布）

**响应示例**

```json
{
  "code": 0,
  "data": {
    "user_id": "u_001",
    "predicted_score": 615,
    "total_max": 750,
    "trend_slope": 0.008,
    "trend_delta": 8,
    "confidence": 0.92,
    "subject_scores": [
      { "subject": "数学", "predicted": 101, "max": 150, "mastery": 0.52 },
      { "subject": "语文", "predicted": 113, "max": 150, "mastery": 0.75 },
      { "subject": "英语", "predicted": 117, "max": 150, "mastery": 0.78 },
      { "subject": "物理", "predicted": 110, "max": 150, "mastery": 0.65 },
      { "subject": "化学", "predicted": 114, "max": 150, "mastery": 0.72 }
    ],
    "admission_probability": {
      "985": 0.67,
      "211": 0.85
    },
    "model_version": "weighted_mastery_v1"
  }
}
```

### 6.4 排名预测

**GET** `/api/predict/:user_id/rank?province=浙江`

**查询参数**

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `province` | string | 全国 | 省份 |

**算法逻辑**

1. 取预测分数
2. 基于省份正态分布参数（mean/std/count）计算 Z 分数
3. 通过标准正态分布累积分布函数计算百分位
4. 排名 = 考生总数 × (1 - 百分位)

**响应示例**

```json
{
  "code": 0,
  "data": {
    "user_id": "u_001",
    "predicted_score": 615,
    "province": "浙江",
    "province_rank": 55623,
    "province_total": 320000,
    "percentile": 0.826,
    "top_percent": 17.4,
    "confidence": 0.92
  }
}
```

### 6.5 综合学情报告

**GET** `/api/predict/:user_id/report`

返回完整的学情分析报告，包含分数预测、排名、薄弱点、学科掌握度、提分建议。

**响应示例**

```json
{
  "code": 0,
  "data": {
    "user_id": "u_001",
    "report_date": "2026-09-15",
    "summary": {
      "predicted_score": 615,
      "trend": "up",
      "trend_delta": 8,
      "confidence": 0.92
    },
    "subject_analysis": [
      {
        "subject": "数学",
        "predicted": 101,
        "max": 150,
        "mastery": 0.52,
        "weak_points": 3,
        "suggestion": "重点突破圆锥曲线与导数"
      }
    ],
    "weak_points": [
      { "subject": "数学", "point": "圆锥曲线综合", "mastery": 0.17, "score_gain": 18 },
      { "subject": "数学", "point": "导数第二问", "mastery": 0.52, "score_gain": 14 }
    ],
    "rank": {
      "province": "浙江",
      "rank": 55623,
      "top_percent": 17.4
    },
    "admission_probability": {
      "985": 0.67,
      "211": 0.85
    },
    "recommendation": "重点突破数学圆锥曲线综合（提分空间 18 分）和物理电磁感应综合（提分空间 12 分），预计可提升至 645 分"
  }
}
```

### 6.6 分数趋势

**GET** `/api/predict/:user_id/score-trend?days=30`

返回历史预测分数序列，支撑"AI 提分预测"卡片趋势图。

**查询参数**

| 字段 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `days` | number | 30 | 查询天数 |

**响应示例**

```json
{
  "code": 0,
  "data": {
    "current": 615,
    "previous": 607,
    "delta": 8,
    "trend": "up",
    "series": [
      { "date": "2026-08-16", "predicted": 580, "actual": 578 },
      { "date": "2026-08-23", "predicted": 588, "actual": 590 },
      { "date": "2026-08-30", "predicted": 595, "actual": 598 },
      { "date": "2026-09-06", "predicted": 607, "actual": 610 },
      { "date": "2026-09-15", "predicted": 615, "actual": null }
    ]
  }
}
```

---

## 7. AI 讲题引擎子模块（扩展）

### 7.1 模块职责

- 对单道题目进行分步讲解，AI 不是直接给答案，而是逐步引导
- 每一步附带「理解度检测」：学生反馈"懂了/没懂"，AI 动态调整下一步
- 讲解进度可视化（5 步完成 3 步）
- 与「AI 推荐题目」联动：学生做错或不会时，跳转到讲题引擎
- 对应原型：`ai-module-explain`（教师视角）+ `ai-explain`（学生视角）

### 7.2 接口清单（已实现）

| 方法 | 路径 | 功能 | 实现状态 |
|------|------|------|---------|
| POST | `/api/ai/explain/start` | 启动一道题的分步讲解 | ✅ 已实现 (ai-explain.js) |
| GET | `/api/ai/explain/:session_id/step/:step_no` | 获取指定步骤讲解 | ✅ 已实现 (ai-explain.js) |
| POST | `/api/ai/explain/:session_id/feedback` | 提交本步理解度反馈 | ✅ 已实现 (ai-explain.js) |
| GET | `/api/ai/explain/:session_id/progress` | 查询讲解进度 | ✅ 已实现 (ai-explain.js) |
| GET | `/api/ai/explain/history?user_id=xxx` | 历史讲题记录 | ✅ 已实现 (ai-explain.js) |

### 7.3 启动分步讲解

**POST** `/api/ai/explain/start`

**请求体**

```json
{
  "question_id": "q_001",
  "user_id": "u_001",
  "model": "deepseek-r1"
}
```

**响应示例**

```json
{
  "code": 0,
  "data": {
    "session_id": "exp_20260915_u001_q001",
    "question_id": "q_001",
    "total_steps": 5,
    "current_step": 1,
    "progress_percent": 0,
    "estimated_min": 10,
    "model": "DeepSeek-R1"
  }
}
```

### 7.4 获取指定步骤讲解（SSE 流式）

**GET** `/api/ai/explain/:session_id/step/:step_no`

返回单步讲解内容，含标题、描述、模型 tokens、用时。支持 SSE 流式输出每个子步骤。

**响应示例**

```json
{
  "code": 0,
  "data": {
    "session_id": "exp_20260915_u001_q001",
    "step_no": 1,
    "status": "done",
    "title": "审题分析",
    "desc": "这道题考查椭圆与直线位置关系，关键在于联立方程后利用韦达定理简化计算...",
    "time": "用时 2min",
    "tokens": 257,
    "model": "DeepSeek-R1",
    "understanding_check": {
      "question": "韦达定理的内容是什么？",
      "options": ["x₁+x₂=-b/a", "x₁·x₂=c/a", "以上都是", "都不对"]
    }
  }
}
```

### 7.5 提交理解度反馈

**POST** `/api/ai/explain/:session_id/feedback`

学生反馈本步是否理解，AI 据此决定下一步策略（推进 / 重讲 / 类比举例）。

**请求体**

```json
{
  "step_no": 1,
  "understood": true,
  "answer": "C",
  "confidence": 0.8
}
```

**响应示例**

```json
{
  "code": 0,
  "data": {
    "next_step": 2,
    "strategy": "advance",
    "progress_percent": 20,
    "remaining_steps": 4
  }
}
```

**AI 调整策略**

| 学生反馈 | 策略 | 下一步行为 |
|---------|------|-----------|
| `understood=true` & 答对 | `advance` | 推进到下一步 |
| `understood=true` & 答错 | `re_explain` | 用不同方式重讲本步 |
| `understood=false` | `example` | 给出类比举例后重讲 |
| 连续 3 次 `understood=false` | `escalate` | 转人工教师或简化前置知识 |

### 7.6 查询讲解进度

**GET** `/api/ai/explain/:session_id/progress`

**响应示例**

```json
{
  "code": 0,
  "data": {
    "session_id": "exp_20260915_u001_q001",
    "completed": 3,
    "total": 5,
    "percent": 60,
    "current_step": 4,
    "current_status": "active",
    "steps": [
      { "num": 1, "status": "done", "title": "审题分析", "time": "2min" },
      { "num": 2, "status": "done", "title": "建立方程", "time": "3min" },
      { "num": 3, "status": "done", "title": "韦达定理应用", "time": "2min" },
      { "num": 4, "status": "active", "title": "弦长公式求解", "time": "进行中" },
      { "num": 5, "status": "locked", "title": "结论验证", "time": "待处理" }
    ]
  }
}
```

---

## 8. AI 答疑子模块（扩展）

### 8.1 模块职责

- 学生可在对话中提问任意学科知识点（区别于 AI 诊断的"做题推理"）
- 支持拍照提问（与拍照搜题模块联动）
- AI 返回分段式回答（椭圆/双曲线对比等多段结构）+ 手绘图示
- 追问推荐（"能不能举个例子"、"常考什么"、"出道题练练"）
- 对应原型：`ai-qa`

### 8.2 接口清单（已实现）

| 方法 | 路径 | 功能 | 实现状态 |
|------|------|------|---------|
| POST | `/api/ai/qa/ask` | 学生提问（SSE 流式） | ✅ 已实现 (ai-qa.js) |
| GET | `/api/ai/qa/:user_id/history` | 历史问答 | ✅ 已实现 (ai-qa.js) |
| GET | `/api/ai/qa/follow-ups?question_id=xxx` | 推荐追问 | ✅ 已实现 (ai-qa.js) |
| POST | `/api/ai/qa/photo` | 拍照提问 | ✅ 已实现 (ai-qa.js) |

### 8.3 学生提问（SSE 流式）

**POST** `/api/ai/qa/ask`

**请求体**

```json
{
  "user_id": "u_001",
  "question": "椭圆和双曲线有什么区别？",
  "subject": "数学"
}
```

**SSE 事件序列**

```
event: route
data: {"modelKey":"qwen3-72b","badge":"中文王","role":"RAG增强问答"}

event: reply
data: {"sections":[{"title":"椭圆","content":"到两定点距离之和为常数的点的轨迹","formula":"|PF₁|+|PF₂|=2a"},{"title":"双曲线","content":"到两定点距离之差为常数的点的轨迹","formula":"||PF₁|-|PF₂||=2a"}],"drawing":{"icon":"fa-draw-polygon","text":"AI手绘图示：椭圆与双曲线几何对比"},"tokens":342,"latency_ms":1850}

event: follow_up
data: ["能不能举个例子？","这个知识点常考什么？","出道题练练"]

event: done
data: {"code":0}
```

### 8.4 历史问答

**GET** `/api/ai/qa/:user_id/history?limit=10`

**响应示例**

```json
{
  "code": 0,
  "data": [
    {
      "id": "qa_001",
      "question": "导数单调性怎么判断？",
      "answer_preview": "求导 f'(x)，令 f'(x)>0 得增区间...",
      "time": "2小时前",
      "subject": "数学",
      "tokens": 287
    }
  ],
  "total": 1
}
```

---

## 9. AI 错题分析子模块（扩展）

### 9.1 模块职责

- 聚合学生做错的题目，按错因分类（知识盲点 / 计算失误 / 审题失误 / 方法不当）
- 计算每个错因的提分空间（结合知识点 score_gain）
- 推荐同类题强化练习（与 AI 推荐子模块联动）
- 对应原型：`ai-error`

### 9.2 接口清单

| 方法 | 路径 | 功能 | 实现状态 |
|------|------|------|---------|
| GET | `/api/answers/:user_id/loss-analysis` | 错题归因分析 | ✅ 已实现 (answers.js) |
| GET | `/api/answers/:user_id/trend-series` | 答题趋势 | ✅ 已实现 (answers.js) |
| GET | `/api/ai/error/:user_id/summary` | 错题汇总 | ✅ 已实现 (ai-error.js) |
| GET | `/api/ai/error/:user_id/by-cause` | 按错因分类 | ✅ 已实现 (ai-error.js) |
| POST | `/api/ai/error/:user_id/similar` | 推荐同类强化题 | ✅ 已实现 (ai-error.js) |

### 9.3 错题归因分析（已实现）

**GET** `/api/answers/:user_id/loss-analysis?days=30`

**响应示例**

```json
{
  "code": 0,
  "data": {
    "total_wrong": 28,
    "total_score_lost": 42,
    "by_cause": [
      { "cause": "知识盲点", "count": 12, "score_lost": 22, "top_points": ["圆锥曲线", "导数第二问"] },
      { "cause": "计算失误", "count": 8, "score_lost": 10 },
      { "cause": "审题失误", "count": 5, "score_lost": 6 },
      { "cause": "方法不当", "count": 3, "score_lost": 4 }
    ],
    "score_gain_potential": 22,
    "suggestion": "优先突破知识盲点类错题，可提分 22 分"
  }
}
```

### 9.4 错题汇总

**GET** `/api/ai/error/:user_id/summary?days=30&subject=数学`

**响应示例**

```json
{
  "code": 0,
  "data": {
    "total_wrong": 28,
    "reviewed": 15,
    "mastered": 8,
    "still_weak": 5,
    "subjects": [
      { "subject": "数学", "wrong": 12, "reviewed": 7, "mastered": 4 },
      { "subject": "物理", "wrong": 8, "reviewed": 5, "mastered": 3 }
    ],
    "recent_wrong": [
      { "id": "q_001", "subject": "数学", "point": "导数第二问", "wrong_count": 3, "last_wrong": "2026-09-14" }
    ]
  }
}
```

---

## 10. AI 学习教练子模块（扩展）

### 10.1 模块职责

- 1对1 拟人化对话，长期跟踪学生学情
- 主动推送诊断信息（"你最近数学正确率下降 8%"）
- 集成诊断/规划/推荐/报告 4 大核心模块能力，对外统一对话入口
- 对应原型：`ai-module-coach`（教师视角）+ `ai-coach`（学生视角）

### 10.2 接口清单（已实现）

| 方法 | 路径 | 功能 | 实现状态 |
|------|------|------|---------|
| POST | `/api/ai/coach/chat` | 教练对话（SSE 流式） | ✅ 已实现 (ai-coach.js) |
| GET | `/api/ai/coach/:user_id/dashboard` | 教练驾驶舱 | ✅ 已实现 (ai-coach.js) |
| POST | `/api/ai/coach/:user_id/proactive` | 主动推送诊断 | ✅ 已实现 (ai-coach.js) |
| GET | `/api/ai/coach/:user_id/goals` | 长期目标跟踪 | ✅ 已实现 (ai-coach.js) |

### 10.3 教练对话（SSE 流式）

**POST** `/api/ai/coach/chat`

**请求体**

```json
{
  "user_id": "u_001",
  "message": "我今天学得怎么样？",
  "context": ["last_7_days_summary", "today_tasks"]
}
```

**SSE 响应**

```
event: route
data: {"modelKey":"qwen3-72b","role":"个性化教练"}

event: context
data: {"today_duration_min":180,"today_questions":22,"correct_rate":75,"weak_point":"导数第二问"}

event: reply
data: {"text":"今天学习时长 3 小时，比昨天多 30 分钟，棒！不过数学正确率从 82% 降到 75%，主要是导数第二问出错。我给你推荐 3 道导数练习题，做完我帮你复盘。","actions":[{"label":"开始练习","type":"practice","target":"q_001,q_002,q_003"}]}

event: done
data: {"code":0}
```

### 10.4 教练驾驶舱

**GET** `/api/ai/coach/:user_id/dashboard`

聚合学生全景学情，作为教练对话的上下文。

**响应示例**

```json
{
  "code": 0,
  "data": {
    "user_id": "u_001",
    "today": { "duration_min": 180, "questions": 22, "correct_rate": 75, "points": 180 },
    "week": { "duration_min": 1200, "questions": 86, "correct_rate": 72, "target_completion": 67 },
    "weak_points": 3,
    "predicted_score": 615,
    "score_trend": "up",
    "next_action": "继续突破导数第二问，预计提分 14"
  }
}
```

---

## 11. AI 知识图谱子模块（扩展）

### 11.1 模块职责

- 构建学生个人知识图谱（节点=知识点，边=依赖关系）
- 节点状态：已掌握（绿）/ 部分掌握（黄）/ 未掌握（红）
- 树状结构可视化（D3.js 或 ECharts Graph）
- 揭示前置依赖：未掌握节点的前置知识是哪些
- 对应原型：`ai-module-graph`

### 11.2 接口清单

| 方法 | 路径 | 功能 | 实现状态 |
|------|------|------|---------|
| GET | `/api/knowledge/` | 知识点列表（含分页/学科过滤） | ✅ 已实现 |
| GET | `/api/knowledge/:id` | 知识点详情 | ✅ 已实现 |
| GET | `/api/ai/graph/:user_id` | 学生个人图谱 | ✅ 已实现 (ai-graph.js) |
| GET | `/api/ai/graph/:user_id/subject/:subject` | 单学科图谱 | ✅ 已实现 (ai-graph.js) |
| GET | `/api/ai/graph/:user_id/prerequisites/:point_id` | 前置依赖链 | ✅ 已实现 (ai-graph.js) |

### 11.3 学生个人知识图谱

**GET** `/api/ai/graph/:user_id?subject=数学`

**响应示例**

```json
{
  "code": 0,
  "data": {
    "user_id": "u_001",
    "subject": "数学",
    "summary": {
      "total_points": 67,
      "mastered": 42,
      "partial": 18,
      "unmastered": 7
    },
    "nodes": [
      { "id": "kp_math_001", "label": "椭圆定义", "mastery": 0.85, "status": "green", "level": 1 },
      { "id": "kp_math_002", "label": "圆锥曲线综合", "mastery": 0.17, "status": "red", "level": 3 }
    ],
    "edges": [
      { "from": "kp_math_001", "to": "kp_math_002", "type": "prerequisite" }
    ]
  }
}
```

### 11.4 前置依赖链

**GET** `/api/ai/graph/:user_id/prerequisites/:point_id`

返回某未掌握节点的所有前置知识点链路，按顺序推荐学习路径。

**响应示例**

```json
{
  "code": 0,
  "data": {
    "target": { "id": "kp_math_002", "label": "圆锥曲线综合", "mastery": 0.17 },
    "chain": [
      { "id": "kp_math_010", "label": "椭圆定义", "mastery": 0.85, "status": "green" },
      { "id": "kp_math_011", "label": "双曲线定义", "mastery": 0.72, "status": "yellow" },
      { "id": "kp_math_012", "label": "抛物线定义", "mastery": 0.45, "status": "yellow" },
      { "id": "kp_math_002", "label": "圆锥曲线综合", "mastery": 0.17, "status": "red" }
    ],
    "learning_path": ["先复习抛物线定义 → 再突破圆锥曲线综合"]
  }
}
```

---

## 12. AI 自动入库子模块（扩展）

### 12.1 模块职责

- 将 PDF / 图片试卷一键入库，9 步自动化流程
- 流程：PDF上传 → OCR文字识别 → 公式识别(LaTeX) → 图片识别 → LLM智能切题 → JSON结构化 → AI审核校验 → 知识图谱标注 → 入库完成
- 每步可点击查看详情（OCR详情 / LLM切题详情）
- 与「教师 AI 工作台」「运营 AI 审核」联动
- 对应原型：`ai-auto-import`, `ai-auto-import-ocr`, `ai-auto-import-cut`

### 12.2 接口清单

| 方法 | 路径 | 功能 | 实现状态 |
|------|------|------|---------|
| POST | `/api/teacher/upload` | 上传 PDF/图片 | ✅ 已实现 (teacher.js) |
| POST | `/api/questions/import` | 批量导入题目 | ✅ 已实现 (questions.js) |
| POST | `/api/questions/import-dir` | 目录递归导入 | ✅ 已实现 (questions.js) |
| POST | `/api/ai/import/start` | 启动自动入库流程 | ✅ 已实现 (ai-import.js) |
| GET | `/api/ai/import/:job_id/status` | 查询流程进度 | ✅ 已实现 (ai-import.js) |
| GET | `/api/ai/import/:job_id/ocr-detail` | OCR 识别详情 | ✅ 已实现 (ai-import.js) |
| GET | `/api/ai/import/:job_id/cut-detail` | LLM 切题详情 | ✅ 已实现 (ai-import.js) |
| POST | `/api/ai/import/:job_id/review` | 提交审核结果 | ✅ 已实现 (ai-import.js) |

### 12.3 启动自动入库流程

**POST** `/api/ai/import/start`

**请求体**

```json
{
  "file_path": "/data/uploads/2024高考数学模拟卷.pdf",
  "source": "real_exam",
  "year": 2024,
  "subject": "数学"
}
```

**响应示例**

```json
{
  "code": 0,
  "data": {
    "job_id": "import_20260915_001",
    "total_steps": 9,
    "current_step": 1,
    "current_status": "PDF上传",
    "progress_percent": 0
  }
}
```

### 12.4 查询流程进度

**GET** `/api/ai/import/:job_id/status`

**响应示例**

```json
{
  "code": 0,
  "data": {
    "job_id": "import_20260915_001",
    "current_step": 7,
    "current_status": "AI审核校验",
    "completed_steps": 6,
    "total_steps": 9,
    "progress_percent": 67,
    "steps": [
      { "num": 1, "status": "done", "title": "PDF上传", "desc": "已上传 12 页，含 20 道题" },
      { "num": 2, "status": "done", "title": "OCR文字识别", "desc": "准确率 96.8%" },
      { "num": 3, "status": "done", "title": "公式识别", "desc": "识别 48 个公式，3 处待确认" },
      { "num": 4, "status": "done", "title": "图片识别", "desc": "识别 6 张图表" },
      { "num": 5, "status": "done", "title": "LLM智能切题", "desc": "切出 12 道题，置信度 92-98%" },
      { "num": 6, "status": "done", "title": "JSON结构化", "desc": "字段完整率 100%" },
      { "num": 7, "status": "active", "title": "AI审核校验", "desc": "校验内容完整性..." },
      { "num": 8, "status": "locked", "title": "知识图谱标注", "desc": "待处理" },
      { "num": 9, "status": "locked", "title": "入库完成", "desc": "待处理" }
    ]
  }
}
```

### 12.5 OCR 识别详情

**GET** `/api/ai/import/:job_id/ocr-detail?page=1`

**响应示例**

```json
{
  "code": 0,
  "data": {
    "total_pages": 12,
    "current_page": 1,
    "accuracy": 96.8,
    "blocks": [
      { "type": "text", "content": "已知函数 f(x) = x³ - 3x² + 2...", "confidence": 0.98 },
      { "type": "formula", "content": "f'(x) = 3x² - 6x", "latex": "f'(x) = 3x^2 - 6x", "confidence": 0.95, "need_review": false },
      { "type": "image", "content": "函数图像", "bbox": [120, 80, 280, 200], "confidence": 0.89 }
    ],
    "need_review_count": 3
  }
}
```

### 12.6 LLM 切题详情

**GET** `/api/ai/import/:job_id/cut-detail`

**响应示例**

```json
{
  "code": 0,
  "data": {
    "total_questions": 12,
    "cut_questions": [
      { "no": 1, "type": "选择题", "score": 5, "difficulty": "简单", "confidence": 0.98, "content_preview": "已知集合 A={1,2,3}..." },
      { "no": 5, "type": "填空题", "score": 5, "difficulty": "困难", "confidence": 0.92, "content_preview": "设函数 f(x)=..." }
    ],
    "low_confidence_count": 1
  }
}
```

### 12.7 提交审核结果

**POST** `/api/ai/import/:job_id/review`

运营人员对自动入库结果进行审核，确认后写入题库。

**请求体**

```json
{
  "reviewer": "admin_001",
  "decision": "approve",
  "comments": "题目切分合理，可入库",
  "adjustments": [
    { "no": 5, "action": "merge_with_next" }
  ]
}
```

---

## 13. AI 模型中心子模块（扩展）

### 13.1 模块职责

- 统一管理所有 AI 模型（DeepSeek-R1/V3, Qwen3-72B 等）
- 配置模型路由规则（关键词 → 模型映射）
- 监控模型运行状态、tokens 用量、平均延迟
- 切换主备模型
- 对应原型：`ai-model-center`

### 13.2 接口清单

| 方法 | 路径 | 功能 | 实现状态 |
|------|------|------|---------|
| GET | `/api/ai/health` | 服务健康检查 | ✅ 已实现 (ai.js) |
| GET | `/api/modules/` | 模块列表 | ✅ 已实现 (modules.js) |
| GET | `/api/modules/:key` | 模块详情 | ✅ 已实现 (modules.js) |
| GET | `/api/ai/models` | 模型列表 | ✅ 已实现 (ai-models.js) |
| PUT | `/api/ai/models/:key/route` | 更新路由规则 | ✅ 已实现 (ai-models.js) |
| GET | `/api/ai/models/usage` | 用量统计 | ✅ 已实现 (ai-models.js) |

### 13.3 模型列表

**GET** `/api/ai/models`

**响应示例**

```json
{
  "code": 0,
  "data": [
    {
      "key": "deepseek-r1",
      "name": "DeepSeek-R1",
      "badge": "推理王",
      "color": "#3B82F6",
      "icon": "fa-brain",
      "role": "理科链式推理 (CoT)",
      "license": "MIT",
      "engine": "vLLM",
      "status": "running",
      "strengths": ["数学", "物理", "化学", "生物"],
      "avg_latency_ms": 2400,
      "tokens_today": 12450
    },
    {
      "key": "deepseek-v3",
      "name": "DeepSeek-V3",
      "badge": "通用王",
      "role": "通用对话",
      "engine": "vLLM",
      "status": "running",
      "strengths": ["语文", "英语", "政治", "历史", "地理"],
      "avg_latency_ms": 1800,
      "tokens_today": 8200
    },
    {
      "key": "qwen3-72b",
      "name": "Qwen3-72B",
      "badge": "中文王",
      "role": "中文优化",
      "engine": "vLLM",
      "status": "running",
      "strengths": ["组卷", "学习规划", "错题分析"],
      "avg_latency_ms": 2100,
      "tokens_today": 5600
    }
  ]
}
```

### 13.4 更新路由规则

**PUT** `/api/ai/models/:key/route`

修改模型的关键词路由规则。

**请求体**

```json
{
  "keywords": ["数学", "导数", "函数", "数列", "概率"],
  "priority": 1
}
```

### 13.5 用量统计

**GET** `/api/ai/models/usage?days=7`

**响应示例**

```json
{
  "code": 0,
  "data": {
    "total_tokens": 26250,
    "total_calls": 142,
    "by_model": [
      { "key": "deepseek-r1", "tokens": 12450, "calls": 68, "avg_latency_ms": 2400 },
      { "key": "deepseek-v3", "tokens": 8200, "calls": 45, "avg_latency_ms": 1800 },
      { "key": "qwen3-72b", "tokens": 5600, "calls": 29, "avg_latency_ms": 2100 }
    ]
  }
}
```

---

## 14. 拍照搜题子模块（扩展）

### 14.1 模块职责

- 学生拍照上传题目，AI 自动 OCR 识别 → 解析 → 推荐相似题 → 视频讲解
- 全流程自动化，4 步完成
- 与「AI 答疑」「AI 讲题引擎」联动
- 对应原型：`photo-ocr`, `photo-parse`, `photo-similar`, `photo-video`

### 14.2 接口清单（已实现）

| 方法 | 路径 | 功能 | 实现状态 |
|------|------|------|---------|
| POST | `/api/photo/ocr` | 拍照 OCR 识别 | ✅ 已实现 (photo.js) |
| POST | `/api/photo/parse` | AI 解析题目 | ✅ 已实现 (photo.js) |
| GET | `/api/photo/similar?question_id=xxx` | 相似题推荐 | ✅ 已实现 (photo.js) |
| GET | `/api/photo/video?question_id=xxx` | 视频讲解 | ✅ 已实现 (photo.js) |
| GET | `/api/photo/:user_id/history` | 搜题历史 | ✅ 已实现 (photo.js) |

### 14.3 拍照 OCR 识别

**POST** `/api/photo/ocr`

**请求体**：`multipart/form-data`，字段 `image` 为图片文件

**响应示例**

```json
{
  "code": 0,
  "data": {
    "ocr_id": "ocr_20260915_001",
    "subject": "数学",
    "confidence": 0.96,
    "content": "已知函数 f(x) = ln x - ax，讨论 f(x) 的单调性",
    "formulas": [
      { "latex": "f(x) = \\ln x - ax", "bbox": [120, 80, 280, 120] }
    ],
    "images": []
  }
}
```

### 14.4 AI 解析题目

**POST** `/api/photo/parse`

**请求体**

```json
{
  "ocr_id": "ocr_20260915_001",
  "user_id": "u_001"
}
```

**响应示例（SSE 流式）**

```
event: route
data: {"modelKey":"deepseek-r1","role":"数学推理"}

event: reply
data: {"analysis":"对数函数 ln x 定义域 x>0，对 f(x) 求导...","answer":"a≥0 时，f(x) 在 (0,1/a] 单调递增，在 [1/a,+∞) 单调递减；a<0 时，f(x) 在 (0,+∞) 单调递增"}

event: done
data: {"code":0}
```

### 14.5 相似题推荐

**GET** `/api/photo/similar?question_id=xxx&count=5`

**响应示例**

```json
{
  "code": 0,
  "data": [
    { "id": "q_sim_001", "content": "已知函数 f(x) = ln x - 2x，讨论单调性...", "similarity": 0.92 },
    { "id": "q_sim_002", "content": "已知函数 f(x) = x ln x，求极值...", "similarity": 0.85 }
  ],
  "total": 5
}
```

### 14.6 视频讲解

**GET** `/api/photo/video?question_id=xxx`

返回该题的视频讲解链接（或 AI 生成的动态讲解）。

**响应示例**

```json
{
  "code": 0,
  "data": {
    "video_url": "https://cdn.example.com/videos/q_001_explain.mp4",
    "duration_sec": 180,
    "chapters": [
      { "time": 0, "title": "审题" },
      { "time": 30, "title": "求导" },
      { "time": 90, "title": "讨论单调性" }
    ]
  }
}
```

---

## 15. 教师 AI 工作台子模块（扩展）

### 15.1 模块职责

- 教师端 AI 工作流：上传试卷 → AI 切题 → AI 解析 → AI 标知识点 → AI 组卷 → AI 课堂练习
- 与「AI 自动入库」共用 OCR/LLM 能力，但侧重教师人工干预
- 对应原型：`teacher-upload`, `teacher-split`, `teacher-parse`, `teacher-tag`, `teacher-paper`, `teacher-exercise`

### 15.2 接口清单

| 方法 | 路径 | 功能 | 实现状态 |
|------|------|------|---------|
| POST | `/api/teacher/upload` | 上传试卷 | ✅ 已实现 (teacher.js) |
| POST | `/api/teacher/split` | AI 切题 | ✅ 已实现 (teacher-ai.js) |
| POST | `/api/teacher/parse` | AI 解析（生成答案+解析） | ✅ 已实现 (teacher-ai.js) |
| POST | `/api/teacher/tag` | AI 标知识点 | ✅ 已实现 (teacher-ai.js) |
| POST | `/api/teacher/paper` | AI 组卷 | ✅ 已实现 (teacher-ai.js) |
| POST | `/api/teacher/exercise` | 课堂练习下发 | ✅ 已实现 (teacher-ai.js) |

### 15.3 上传试卷（已实现）

**POST** `/api/teacher/upload`

**请求体**：`multipart/form-data`，字段 `file` 为 PDF/Word/图片（≤50MB）

**响应示例**

```json
{
  "code": 0,
  "msg": "试卷上传成功",
  "data": {
    "name": "本地后端验证试卷.pdf",
    "size": "2.4 MB",
    "time": "今天 14:30",
    "status": "已上传",
    "progress": 30,
    "filePath": "/data/uploads/本地后端验证试卷_1789298920982.pdf",
    "totalUploaded": 3
  }
}
```

### 15.4 AI 切题

**POST** `/api/teacher/split`

**请求体**

```json
{
  "file_path": "/data/uploads/试卷.pdf",
  "teacher_id": "t_001"
}
```

**响应示例**

```json
{
  "code": 0,
  "data": {
    "total_questions": 6,
    "questions": [
      { "no": 1, "type": "选择题", "score": 5, "difficulty": "简单", "content_preview": "已知集合 A=..." },
      { "no": 5, "type": "填空题", "score": 5, "difficulty": "困难", "content_preview": "设函数 f(x)=..." }
    ]
  }
}
```

### 15.5 AI 解析

**POST** `/api/teacher/parse`

为切题后的题目自动生成答案与解析。

**请求体**

```json
{
  "question_ids": ["q_new_001", "q_new_002"],
  "model": "deepseek-r1"
}
```

**响应示例**

```json
{
  "code": 0,
  "data": [
    { "id": "q_new_001", "answer": "B", "analysis": "由集合交集定义...", "confidence": 0.95 }
  ]
}
```

### 15.6 AI 标知识点

**POST** `/api/teacher/tag`

**请求体**

```json
{
  "question_ids": ["q_new_001"],
  "subject": "数学"
}
```

**响应示例**

```json
{
  "code": 0,
  "data": [
    { "id": "q_new_001", "knowledge_points": ["集合运算", "交集"], "kp_ids": ["kp_math_010"], "confidence": 0.92 }
  ]
}
```

### 15.7 课堂练习下发

**POST** `/api/teacher/exercise`

**请求体**

```json
{
  "teacher_id": "t_001",
  "class_id": "c_001",
  "question_ids": ["q_001", "q_002", "q_003"],
  "duration_min": 30
}
```

---

## 16. 运营 AI 审核子模块（扩展）

### 16.1 模块职责

- 运营人员对 AI 自动入库的题目进行二次审核
- OCR 审核：校验 OCR 识别准确性，纠正公式/图片
- AI 审核：校验答案/解析/知识点标注合理性
- 审核队列管理（待审/已审/驳回）
- 对应原型：`admin-ocr`, `admin-ai-review`

### 16.2 接口清单（已实现）

| 方法 | 路径 | 功能 | 实现状态 |
|------|------|------|---------|
| GET | `/api/admin/review/queue?type=ocr` | OCR 审核队列 | ✅ 已实现 (admin-review.js) |
| GET | `/api/admin/review/queue?type=ai` | AI 审核队列 | ✅ 已实现 (admin-review.js) |
| POST | `/api/admin/review/:item_id/decision` | 提交审核决定 | ✅ 已实现 (admin-review.js) |
| GET | `/api/admin/review/stats` | 审核统计 | ✅ 已实现 (admin-review.js) |

### 16.3 审核队列

**GET** `/api/admin/review/queue?type=ocr&status=pending&page=1&size=20`

**响应示例**

```json
{
  "code": 0,
  "data": [
    {
      "item_id": "rev_001",
      "job_id": "import_20260915_001",
      "question_no": 5,
      "type": "填空题",
      "content_preview": "设函数 f(x)=...",
      "ocr_confidence": 0.89,
      "need_review": true,
      "submitted_at": "2026-09-15 14:30"
    }
  ],
  "total": 8
}
```

### 16.4 提交审核决定

**POST** `/api/admin/review/:item_id/decision`

**请求体**

```json
{
  "reviewer": "admin_001",
  "decision": "approve",
  "comments": "OCR 识别准确",
  "corrections": {
    "content": "设函数 f(x) = ln x - ax"
  }
}
```

**响应示例**

```json
{
  "code": 0,
  "data": {
    "item_id": "rev_001",
    "decision": "approve",
    "reviewed_at": "2026-09-15 15:00",
    "next_pending": 7
  }
}
```

### 16.5 审核统计

**GET** `/api/admin/review/stats?days=7`

**响应示例**

```json
{
  "code": 0,
  "data": {
    "total_pending": 8,
    "total_reviewed": 42,
    "approved": 38,
    "rejected": 4,
    "avg_review_time_min": 3.5,
    "by_type": [
      { "type": "ocr", "pending": 3, "reviewed": 22 },
      { "type": "ai", "pending": 5, "reviewed": 20 }
    ]
  }
}
```

---

## 17. 高频考点子模块（扩展）

### 17.1 模块职责

- 按学科聚合近 5 年高考真题考点出现频次
- 揭示命题趋势（上升/稳定/下降）
- 推荐高频考点配套练习题
- 与「AI 推荐」联动：高频 + 薄弱双维度排序
- 对应原型：`practice-hotpoints`

### 17.2 接口清单（已实现）

| 方法 | 路径 | 功能 | 实现状态 |
|------|------|------|---------|
| GET | `/api/practice/hotpoints` | 高频考点列表 | ✅ 已实现 (practice-hotpoints.js) |
| GET | `/api/practice/hotpoints/:subject/trend` | 命题趋势 | ✅ 已实现 (practice-hotpoints.js) |
| GET | `/api/practice/hotpoints/:point_id/questions` | 配套练习题 | ✅ 已实现 (practice-hotpoints.js) |

### 17.3 高频考点列表

**GET** `/api/practice/hotpoints?subject=数学&limit=10`

**响应示例**

```json
{
  "code": 0,
  "data": [
    {
      "id": "hp_math_001",
      "subject": "数学",
      "point": "导数综合应用",
      "frequency": 18,
      "appear_years": [2020, 2021, 2022, 2023, 2024, 2025],
      "trend": "rising",
      "score_avg": 14,
      "difficulty": 4,
      "mastery_rate": 0.52
    },
    {
      "id": "hp_math_002",
      "subject": "数学",
      "point": "圆锥曲线综合",
      "frequency": 15,
      "appear_years": [2020, 2022, 2023, 2024, 2025],
      "trend": "stable",
      "score_avg": 12,
      "difficulty": 5,
      "mastery_rate": 0.17
    }
  ],
  "total": 10
}
```

### 17.4 命题趋势

**GET** `/api/practice/hotpoints/:subject/trend?years=5`

返回某学科近 N 年各考点出现频次序列。

**响应示例**

```json
{
  "code": 0,
  "data": {
    "subject": "数学",
    "series": [
      {
        "point": "导数综合应用",
        "frequency": [2, 3, 3, 4, 5, 5],
        "years": [2020, 2021, 2022, 2023, 2024, 2025],
        "trend": "rising",
        "change_pct": 150
      }
    ]
  }
}
```

### 17.5 配套练习题

**GET** `/api/practice/hotpoints/:point_id/questions?count=5`

**响应示例**

```json
{
  "code": 0,
  "data": [
    {
      "id": "q_001",
      "year": 2025,
      "province": "全国甲卷",
      "type": "解答题",
      "difficulty": 4,
      "content": "已知函数 f(x) = x³ - 3x² + 2..."
    }
  ],
  "total": 5
}
```

---

## 18. 数据流闭环映射

### 18.1 闭环数据流向表

| 阶段 | 数据流 | 涉及接口 | 数据层库 |
|------|--------|---------|---------|
| ① 采集 | 学生学习行为 → 行为库 | POST /api/learning | 行为库 |
| ② 识别 | 行为库 → 薄弱点 | GET /api/knowledge/weak | 知识图谱 + 能力模型 |
| ③ 诊断 | 学生提问 → AI 解析 | POST /api/ai/chat | 知识图谱（RAG） |
| ④ 规划 | 薄弱点 → 学习计划 | GET /api/recommend/:user_id/plan | 能力模型 |
| ⑤ 推荐 | 薄弱点 + 难度 → 题目 | GET /api/recommend/:user_id/questions | 题库 |
| ⑥ 做题 | 学生做题 → 新行为 | POST /api/learning | 行为库 |
| ⑦ 报告 | 学情数据 → 预测报告 | GET /api/predict/:user_id/report | 学情数据仓库 |
| ⑧ 反馈 | 报告 → 学生/教师/运营 | GET /api/predict/:user_id/score-trend | 实时学情报告 |
| ⑨ 讲题 | 学生做错 → 分步讲解 | POST /api/ai/explain/start | 行为库（理解度反馈） |
| ⑩ 答疑 | 学生提问 → 知识点问答 | POST /api/ai/qa/ask | 知识图谱（RAG） |
| ⑪ 错题 | 错题归因 → 提分空间 | GET /api/answers/:user_id/loss-analysis | 行为库 + 能力模型 |
| ⑫ 教练 | 全景学情 → 个性化对话 | POST /api/ai/coach/chat | 学情数据仓库 |
| ⑬ 图谱 | 知识点 → 个人图谱 | GET /api/ai/graph/:user_id | 知识图谱 |
| ⑭ 入库 | PDF → 题库 | POST /api/ai/import/start | 题库 + 知识图谱 |
| ⑮ 审核 | 入库产出 → 校验 | POST /api/admin/review/:item_id/decision | 题库（状态更新） |
| ⑯ 拍照 | 图片 → OCR → 解析 | POST /api/photo/ocr → /api/photo/parse | 题库（相似题） |
| ⑰ 教师 | 试卷 → 切题/解析/标点 | POST /api/teacher/split, parse, tag | 题库 + 知识图谱 |
| ⑱ 考点 | 真题 → 高频聚合 | GET /api/practice/hotpoints | 题库 |

### 18.2 子模块依赖关系

```
AI 诊断 (输入层)
  ├─→ AI 规划 (依赖薄弱点)
  │     └─→ 学生执行计划
  ├─→ AI 推荐 (依赖薄弱点 + 掌握率)
  │     └─→ 学生做题
  │           ├─→ AI 讲题引擎 (做错时触发分步讲解)
  │           ├─→ AI 答疑 (不懂时随时提问)
  │           └─→ 拍照搜题 (拍下题目 → OCR → 解析)
  ├─→ AI 报告 (依赖全部学情数据)
  │     ├─→ AI 错题分析 (错题归因 + 提分空间)
  │     ├─→ AI 知识图谱 (个人图谱更新)
  │     └─→ 反馈给 AI 诊断 (调整下一轮诊断权重)
  └─→ AI 学习教练 (统一对话入口，聚合诊断/规划/推荐/报告)

数据供给链（横向）:
  AI 自动入库 → 运营 AI 审核 → 题库 + 知识图谱
  教师 AI 工作台 → 题库 + 知识图谱
  AI 模型中心 → 路由规则 → 所有 AI 子模块
  高频考点 → AI 推荐 (高频+薄弱双维度排序)
```

### 18.3 与数据层 5 库的对应

| 数据库 | 写入接口 | 读取接口 |
|--------|---------|---------|
| 用户库 | POST /api/auth/register | GET /api/users/:id |
| 题库 | POST /api/questions, POST /api/questions/import, POST /api/questions/import-dir, POST /api/ai/import/start, POST /api/teacher/split | GET /api/questions, GET /api/recommend/:user_id/questions, GET /api/photo/similar, GET /api/practice/hotpoints/:point_id/questions |
| 行为库 | POST /api/learning, POST /api/answers, POST /api/ai/explain/:session_id/feedback | GET /api/learning/:user_id/*, GET /api/answers/:user_id/loss-analysis, GET /api/answers/:user_id/trend-series |
| 知识图谱 | POST /api/knowledge, POST /api/teacher/tag, POST /api/ai/import/:job_id/review | GET /api/knowledge/*, GET /api/knowledge/weak, GET /api/ai/graph/:user_id, GET /api/ai/graph/:user_id/prerequisites/:point_id |
| 能力模型 | （由 AI 报告子模块计算）, POST /api/ai/coach/:user_id/proactive | GET /api/predict/:user_id/score, GET /api/ai/coach/:user_id/dashboard |

---

## 19. 错误码表

### 19.1 通用错误码

| code | HTTP | 含义 | 触发场景 |
|------|------|------|---------|
| 0 | 200 | 成功 | 所有接口正常返回 |
| 1 | 400 | 参数错误 | 必填字段缺失 / 格式错误 |
| 1 | 401 | 未授权 | JWT 缺失或失效 |
| 1 | 403 | 无权限 | 无权访问该用户数据 |
| 1 | 404 | 资源不存在 | 用户/知识点/题目不存在 |
| 1 | 429 | 限流 | 超过 QPS 限制 |
| 1 | 500 | 服务器错误 | 内部异常 |

### 19.2 业务错误码

| code | msg | 触发接口 |
|------|------|---------|
| 1001 | user_id 和 subject 必填 | POST /api/learning |
| 1002 | 问题不能为空 | POST /api/ai/chat |
| 1003 | 用户不存在 | GET /api/predict/:user_id/* |
| 1004 | 学科不支持 | POST /api/learning |
| 1005 | 题目数量不足 | GET /api/recommend/:user_id/paper |
| 1006 | 知识点已存在 | POST /api/knowledge |
| 1007 | 讲题会话不存在 | GET /api/ai/explain/:session_id/* |
| 1008 | 步骤号超出范围 | GET /api/ai/explain/:session_id/step/:step_no |
| 1009 | 入库任务不存在 | GET /api/ai/import/:job_id/* |
| 1010 | 文件类型不支持 | POST /api/teacher/upload |
| 1011 | 文件大小超过 50MB | POST /api/teacher/upload |
| 1012 | 审核项不存在 | POST /api/admin/review/:item_id/decision |
| 1013 | 模型 key 不存在 | PUT /api/ai/models/:key/route |
| 1014 | 拍照图片识别失败 | POST /api/photo/ocr |
| 1015 | 高频考点不存在 | GET /api/practice/hotpoints/:point_id/questions |

---

## 附录 A：模型能力映射

| 模型 | 别名 | 适用场景 | RAG 步骤 |
|------|------|---------|---------|
| DeepSeek-R1 | 推理王 | 数学/物理/化学/生物链式推理 | BGE-M3 → Milvus → bge-reranker → CoT |
| DeepSeek-V3 | 通用王 | 语文/英语/政治/历史/地理通用对话 | BGE-M3 → Milvus → bge-reranker → 生成 |
| Qwen3-72B | 中文王 | 组卷/学习计划/错题分析/个性化解析 | BGE-M3 → Milvus → bge-reranker → 生成 |

## 附录 B：省份预测参数

| 省份 | 均值 | 标准差 | 考生数 |
|------|------|--------|--------|
| 浙江 | 480 | 90 | 320,000 |
| 四川 | 450 | 95 | 580,000 |
| 全国 | 450 | 95 | 1,000,000 |

## 附录 C：科目满分配置

| 科目类型 | 科目 | 满分 |
|---------|------|------|
| 主科 | 数学 / 语文 / 英语 | 150 |
| 理科选科 | 物理 / 化学 | 150 |
| 文科/其他选科 | 生物 / 政治 / 历史 / 地理 | 100 |
| **总分** | | **750** |

---

> 文档维护：AI 高考智能提分系统开发组
> 反馈渠道：通过 `/api/ai/health` 接口监控服务状态
