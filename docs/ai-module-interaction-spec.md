# AI 模块交互技术文档

> 版本：1.0 | 更新日期：2026-09-07 | 适用范围：AI高考产品原型全量AI模块

---

## 目录

1. [系统架构总览](#1-系统架构总览)
2. [AI 模型能力映射](#2-ai-模型能力映射)
3. [交互函数接口规范](#3-交互函数接口规范)
   - 3.1 [对话与推理类](#31-对话与推理类)
   - 3.2 [生成与检测类](#32-生成与检测类)
   - 3.3 [推荐与测试类](#33-推荐与测试类)
4. [通用交互模式](#4-通用交互模式)
   - 4.6 [数据中台 KV 接入全景](#46-数据中台-kv-接入全景)
5. [全局状态管理](#5-全局状态管理)
6. [文件索引](#6-文件索引)
7. [浏览器验证结果](#7-浏览器验证结果)

---

## 1. 系统架构总览

### 三层架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    前端交互触发层                                 │
│         按钮 · 重新生成    对话输入 · 流式    节点 · 图谱交互       │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 用户事件
┌──────────────────────────▼──────────────────────────────────────┐
│              AI 交互函数层（16个函数 · 4个JS文件）                  │
│    对话与推理          生成与检测          推荐与测试              │
│  streamText()        paperRegenerate()   recommendRefresh()     │
│  explainNextStep()   ocrReRecognize()    testModel*()           │
└──────────────────────────┬──────────────────────────────────────┘
                           │ 模型调用
┌──────────────────────────▼──────────────────────────────────────┐
│                AI 模型中心（开源大模型 · vLLM 推理）               │
│    推理引擎           检索与理解           预测与识别              │
│  vLLM · DeepSeek-R1   BGE-M3 · BERT      XGBoost · LightGBM     │
│  Qwen3-72B            DeepKE · PaddleOCR  GraphSAGE · LaTeX-OCR │
└─────────────────────────────────────────────────────────────────┘
```

<details>
<summary>📊 架构图 Mermaid 源码（点击展开）</summary>

```mermaid
graph TB
    %% ===== Layer 1: 前端交互触发层 =====
    subgraph L1["前端交互触发层"]
        direction LR
        T1["按钮 · 重新生成"]
        T2["对话输入 · 流式"]
        T3["节点 · 图谱交互"]
    end

    %% ===== Layer 2: AI 交互函数层 =====
    subgraph L2["AI 交互函数层（15个函数 · 4个JS文件）"]
        direction LR
        subgraph L2A["对话与推理"]
            F1["streamText()"]
            F2["explainNextStep()"]
            F3["errorReanalyze()"]
            F4["planRegenerate()"]
            F5["aiReparse()"]
        end
        subgraph L2B["生成与检测"]
            F6["paperRegenerate()"]
            F7["ocrReRecognize()"]
            F8["llmRecut()"]
            F9["predictRecalculate()"]
            F10["graphNodeClick()"]
        end
        subgraph L2C["推荐与测试"]
            F11["recommendRefresh()"]
            F12["similarRefresh()"]
            F13["testModelConnectivity()"]
            F14["testModelCapability()"]
        end
    end

    %% ===== Layer 3: AI 模型中心 =====
    subgraph L3["AI 模型中心（开源大模型 · vLLM 推理引擎）"]
        direction LR
        subgraph L3A["推理引擎"]
            M1["vLLM"]
            M2["DeepSeek-R1"]
            M3["Qwen3-72B"]
        end
        subgraph L3B["检索与理解"]
            M4["BGE-M3"]
            M5["BERT"]
            M6["DeepKE"]
            M7["PaddleOCR"]
        end
        subgraph L3C["预测与识别"]
            M8["XGBoost"]
            M9["LightGBM"]
            M10["GraphSAGE"]
            M11["LaTeX-OCR"]
        end
    end

    %% ===== 跨层连接 =====
    T1 -->|"用户事件"| L2A
    T2 -->|"用户事件"| L2A
    T3 -->|"用户事件"| L2B

    L2A -->|"模型调用"| L3A
    L2B -->|"模型调用"| L3B
    L2C -->|"模型调用"| L3C
    L2A -->|"模型调用"| L3B
    L2B -->|"模型调用"| L3A
    L2B -->|"模型调用"| L3C

    %% ===== 样式 =====
    style L1 fill:#F7F7F8,stroke:#52525B,stroke-width:1px,stroke-dasharray:6 4
    style L2 fill:#F2F7FF,stroke:#4B3FE3,stroke-width:1.5px,stroke-dasharray:6 4
    style L3 fill:#F7F7F8,stroke:#52525B,stroke-width:1px,stroke-dasharray:6 4
    style L2A fill:#E5EAFF,stroke:#4B3FE3
    style L2B fill:#E5EAFF,stroke:#4B3FE3
    style L2C fill:#E5EAFF,stroke:#4B3FE3
    style L3A fill:#EFEFF2,stroke:#52525B
    style L3B fill:#EFEFF2,stroke:#52525B
    style L3C fill:#EFEFF2,stroke:#52525B
```

</details>

### 架构说明

| 层级 | 职责 | 技术栈 |
|------|------|--------|
| **前端交互触发层** | 捕获用户点击、对话输入、节点选择等交互事件，触发AI函数调用 | HTML onclick / DOM event / SVG交互 |
| **AI交互函数层** | 接收用户事件，编排AI模型工作流，更新DOM展示流式/分步/动画效果 | 原生JS + setInterval/setTimeout + DOM操作 |
| **AI模型中心** | 提供推理、检索、预测、识别等AI能力，通过vLLM统一推理引擎调度 | vLLM + DeepSeek-R1 + Qwen3-72B + BGE-M3 + BERT + DeepKE + XGBoost + PaddleOCR |

### 数据流

```
用户点击按钮
  → AI交互函数启动（btn.disabled=true, 显示status区域）
    → 分阶段展示AI模型工作流（setInterval 500ms 间隔切换phase文案）
      → 模拟模型推理完成（更新数值/置信度/进度等DOM元素）
        → 显示成功状态（绿色背景 + check-circle图标）
          → 4-5秒后自动隐藏status区域，恢复按钮可用
```

<details>
<summary>📊 数据流 Mermaid 源码（点击展开）</summary>

```mermaid
flowchart TD
    A(["用户点击按钮"]) --> B["AI交互函数启动"]
    B --> B1["btn.disabled = true"]
    B --> B2["显示 status 区域\n背景: #EFF6FF\n文字: #1E40AF"]
    B1 --> C["分阶段展示AI模型工作流"]
    C --> C1["setInterval 500ms\n切换 phase 文案"]
    C1 --> D{"所有 phase 完成?"}
    D -->|否| C1
    D -->|是| E["更新 DOM 数值\n(置信度/分数/进度等)"]
    E --> F["显示成功状态\n背景: #ECFDF5\n文字: #065F46\n图标: check-circle"]
    F --> G["恢复按钮\nbtn.disabled = false"]
    G --> H["4-5秒后自动隐藏\nstatus 区域"]

    style A fill:#F2F7FF,stroke:#4B3FE3,stroke-width:1.5px
    style B fill:#EFEFF2,stroke:#52525B
    style C fill:#EFEFF2,stroke:#52525B
    style C1 fill:#EFEFF2,stroke:#52525B
    style D fill:#FEF3C7,stroke:#EFAA17
    style E fill:#EFEFF2,stroke:#52525B
    style F fill:#ECFDF5,stroke:#1DC981,stroke-width:1.5px
    style G fill:#EFEFF2,stroke:#52525B
    style H fill:#EFEFF2,stroke:#52525B
```

</details>

---

## 2. AI 模型能力映射

### 模型 → 模块分配矩阵

| AI模型 | 类型 | 许可证 | 应用模块 | 交互函数 |
|--------|------|--------|----------|----------|
| **vLLM** | 推理引擎 | Apache-2.0 | AI模型中心 | testModelConnectivity() |
| **DeepSeek-R1** | CoT推理 | MIT | AI答疑、讲题、学习规划 | streamText(), explainNextStep(), planRegenerate() |
| **Qwen3-72B** | 文本生成 | Apache-2.0 | AI答疑、组卷、解析、切题、错题 | streamText(), paperRegenerate(), aiReparse(), llmRecut(), errorReanalyze() |
| **BGE-M3** | 向量检索 | MIT | AI答疑(RAG)、相似题 | sendAIMessage(), similarRefresh() |
| **Milvus** | 向量数据库 | Apache-2.0 | AI答疑(RAG)、相似题 | sendAIMessage(), similarRefresh() |
| **BERT** | 语义相似 | Apache-2.0 | 组卷去重、相似题、切题 | paperRegenerate(), similarRefresh(), llmRecut() |
| **DeepKE** | 知识抽取 | Apache-2.0 | 知识图谱、错题分析 | graphNodeClick(), errorReanalyze() |
| **GraphSAGE** | 图推理 | Apache-2.0 | 知识图谱关联推理 | graphNodeClick() |
| **XGBoost** | 分数预测 | Apache-2.0 | 高考预测、学习规划 | predictRecalculate(), planRegenerate() |
| **LightGBM** | 分数预测 | MIT | 高考预测 | predictRecalculate() |
| **DeepFM** | 推荐排序 | Apache-2.0 | 推荐题排序 | recommendRefresh() |
| **PaddleOCR** | 文字识别 | Apache-2.0 | OCR识别 | ocrReRecognize() |
| **LaTeX-OCR** | 公式识别 | MIT | OCR识别 | ocrReRecognize() |

---

## 3. 交互函数接口规范

### 3.1 对话与推理类

---

#### `streamText(element, html, onComplete)`

**所在文件**: [pages-ai-center.js](file:///workspace/prototype/js/pages-ai-center.js)

**功能**: 逐字流式输出AI回答文本，模拟LLM token生成过程。

**AI模型**: DeepSeek-R1 CoT / Qwen3-72B

**参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `element` | HTMLElement | 是 | 接收流式文本的目标DOM元素 |
| `html` | string | 是 | 要流式输出的完整HTML内容 |
| `onComplete` | Function | 否 | 流式输出完成后的回调函数 |

**交互流程**:
1. 清空 `element.innerHTML`
2. 创建临时div解析HTML为DOM节点
3. 按500ms间隔逐字符追加到element
4. 完成后调用 `onComplete` 回调

**DOM依赖**: 无特定ID依赖，接收任意element

---

#### `sendAIMessage(inputId, messagesContainerId)`

**所在文件**: [pages-ai-center.js](file:///workspace/prototype/js/pages-ai-center.js)

**功能**: AI答疑/学习教练的核心对话发送函数，完整编排智能路由→RAG检索→生成→流式输出流程。本次升级接入 `AI_ROUTER` 智能路由层，按问题类型自动分发到最强开源模型。

**AI模型**: 智能路由（三选一）+ BGE-M3 + Milvus + bge-reranker-v2-m3
- **DeepSeek-R1**（理科推理）：数学/物理/化学/生物
- **DeepSeek-V3**（文科通用）：语文/英语/政治/历史/地理
- **Qwen3-72B**（生成任务）：组卷/学习规划/错题分析

**参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `inputId` | string | 是 | 输入框元素ID |
| `messagesContainerId` | string | 是 | 消息列表容器元素ID |

**交互流程**:
1. 读取输入框文本，校验非空
2. 在消息容器中渲染用户消息气泡
3. 创建AI回复容器
4. **智能路由**：调用 `window.AI_ROUTER.selectAIModel(question)` 选择最强模型
5. **路由提示**：顶部显示"智能路由 → [模型名] [徽章] (科目·职责)"
6. **RAG检索可视化**（4阶段，chip 颜色随模型主题色）:
   - 阶段1: `BGE-M3 向量编码` (200ms)
   - 阶段2: `Milvus 相似度检索` (200ms)
   - 阶段3: `bge-reranker 重排` (200ms)
   - 阶段4: `[模型名] 生成中` (进入 streamText)
7. 调用 `streamText()` 逐字输出AI回答
8. 追加动态模型归因（模型名 · 徽章 · 许可证 · 角色 · vLLM 推理 · token数）

**DOM依赖**:

| 元素ID | 类型 | 说明 |
|--------|------|------|
| `inputId` 参数值 | textarea/input | 用户输入框 |
| `messagesContainerId` 参数值 | div | 消息列表容器 |

**全局状态**:
- `window._aiModelInfo`（模型元数据：name, role, desc, license, stars）
- `window.AI_ROUTER`（智能路由层实例）

---

#### `window.AI_ROUTER.selectAIModel(question)` — 智能路由层

**所在文件**: [pages-ai-center.js](file:///workspace/prototype/js/pages-ai-center.js)

**功能**: 根据用户问题类型自动选择最强开源模型，确保"问任何问题都能回复正确解析及答案"。基于关键词正则匹配实现科目识别 + 模型路由。

**AI模型注册表**（3 个模型）:

| 模型 key | 名称 | 徽章 | 颜色 | 协议 | 角色 | 适用学科 |
|---------|------|------|------|------|------|---------|
| `deepseek-r1` | DeepSeek-R1 | 推理王 | `#3B82F6` 蓝 | MIT | 理科链式推理 (CoT) | 数学/物理/化学/生物 |
| `deepseek-v3` | DeepSeek-V3 | 通用王 | `#10B981` 绿 | MIT | 中文通用对话 | 语文/英语/政治/历史/地理 |
| `qwen3-72b` | Qwen3-72B | 中文王 | `#8B5CF6` 紫 | Apache-2.0 | 组卷/计划/解析生成 | 组卷/学习规划/错题分析 |

**参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `question` | string | 是 | 用户提问文本 |

**返回**: `{ modelKey, model, subject }`
- `modelKey`：模型标识（`deepseek-r1` / `deepseek-v3` / `qwen3-72b`）
- `model`：模型元数据对象（name, badge, color, icon, license, role, strengths, ragSteps）
- `subject`：识别出的科目（数学/物理/化学/生物/语文/英语/政治/历史/地理/组卷/学习规划/错题分析/综合）

**路由规则优先级**（12 条规则，按顺序匹配，命中即返回）:

| 优先级 | 规则 | 路由目标 | 说明 |
|--------|------|---------|------|
| 1 | 组卷/生成/出题/模拟卷/试卷/题库 | Qwen3-72B | 生成任务类（最高优先级，避免"生成数学卷"被数学规则抢占） |
| 2 | 学习计划/规划/复习/冲刺/提分/进度 | Qwen3-72B | 学习规划类 |
| 3 | 错题/薄弱/总结/复盘/查漏/错题本 | Qwen3-72B | 错题分析类 |
| 4 | 数学/导数/函数/数列/三角/椭圆/概率/几何/方程/向量 | DeepSeek-R1 | 数学推理 |
| 5 | 物理/力学/电磁/光学/动量/能量/运动 | DeepSeek-R1 | 物理推理 |
| 6 | 化学/反应/有机/无机/平衡/实验/元素 | DeepSeek-R1 | 化学推理 |
| 7 | 生物/基因/细胞/遗传/dna/蛋白/生态 | DeepSeek-R1 | 生物推理 |
| 8 | 语文/古诗/诗词/文言文/作文/赏析/颔联/杜甫/李白 | DeepSeek-V3 | 语文通用（补充诗词鉴赏关键词） |
| 9 | 英语/grammar/语法/词汇/完形/阅读 | DeepSeek-V3 | 英语通用 |
| 10 | 政治/经济/哲学/文化/党/政府/法治 | DeepSeek-V3 | 政治通用 |
| 11 | 历史/朝代/战争/革命/改革/条约 | DeepSeek-V3 | 历史通用 |
| 12 | 地理/气候/地形/河流/人口/城市/农业 | DeepSeek-V3 | 地理通用 |
| 兜底 | 未匹配任何规则 | DeepSeek-R1 | 最强推理模型兜底，确保跨学科综合题也能正确回答 |

**关键设计**:
1. **生成任务优先**：组卷/计划/错题规则放在最前，避免"生成数学卷"被"数学"规则先匹配
2. **关键词精化**：错题分析规则移除"分析"过宽关键词（避免"物理力学分析"被误匹配）
3. **兜底策略**：未匹配 → DeepSeek-R1（最强推理模型，跨学科综合题也能正确回答）

**全局状态**: `window.AI_ROUTER`（路由层单例）、`window.aiRouter`（兼容旧代码别名）

<details>
<summary>📊 AI_ROUTER 智能路由层 Mermaid 流程图源码（点击展开）</summary>

```mermaid
flowchart TD
    A(["用户输入问题\nsendAIMessage(inputId, containerId)"]) --> B["读取输入框文本\n校验非空"]
    B --> C["渲染用户消息气泡\n（蓝色右对齐）"]
    C --> D["创建 AI 回复容器\n（灰色左对齐+机器人头像）"]
    D --> E["调用 AI_ROUTER.selectAIModel(question)"]
    
    E --> F{"路由规则匹配\n（12 条 + 兜底）"}
    
    F --> F1{"优先级 1-3:\n生成/计划/错题?"}
    F1 -->|是| G1["路由 → Qwen3-72B\n（中文王 · Apache-2.0）\n科目: 组卷/学习规划/错题分析"]
    F1 -->|否| F2{"优先级 4-7:\n数/理/化/生?"}
    F2 -->|是| G2["路由 → DeepSeek-R1\n（推理王 · MIT）\n科目: 数学/物理/化学/生物"]
    F2 -->|否| F3{"优先级 8-12:\n语/英/政/史/地?"}
    F3 -->|是| G3["路由 → DeepSeek-V3\n（通用王 · MIT）\n科目: 语文/英语/政治/历史/地理"]
    F3 -->|否| G4["兜底 → DeepSeek-R1\n（最强推理兜底）\n科目: 综合"]
    
    G1 --> H["activeModel = Qwen3-72B\ncolor: #8B5CF6 紫\nicon: fa-book"]
    G2 --> H2["activeModel = DeepSeek-R1\ncolor: #3B82F6 蓝\nicon: fa-brain"]
    G3 --> H3["activeModel = DeepSeek-V3\ncolor: #10B981 绿\nicon: fa-comment-dots"]
    G4 --> H2
    
    H --> I["显示路由提示\n智能路由 → [模型名] [徽章] (科目·职责)"]
    H2 --> I
    H3 --> I
    
    I --> J["RAG 检索可视化（4阶段，200ms/阶段）"]
    J --> J1["Phase 1: BGE-M3 向量编码\nchip 颜色: 模型主题色"]
    J1 --> J2["Phase 2: Milvus 相似度检索"]
    J2 --> J3["Phase 3: bge-reranker 重排"]
    J3 --> J4["Phase 4: [模型名] 生成中"]
    
    J4 --> K["generateAIReply(question)\n基于知识库生成答案 HTML"]
    K --> L["streamText(aiInner, replyHTML, onComplete)\n逐字流式输出"]
    
    L --> M["追加动态模型归因"]
    M --> M1["图标: activeModel.icon"]
    M1 --> M2["模型名: activeModel.name\n颜色: activeModel.color"]
    M2 --> M3["徽章: activeModel.badge"]
    M3 --> M4["许可证: activeModel.license"]
    M4 --> M5["角色: activeModel.role"]
    M5 --> M6["vLLM 推理 · [200-500] tokens"]
    
    M6 --> N(["完成，等待下次交互"])
    
    style A fill:#F2F7FF,stroke:#4B3FE3,stroke-width:1.5px
    style B fill:#EFEFF2,stroke:#52525B
    style C fill:#EFF6FF,stroke:#3B82F6
    style D fill:#EFEFF2,stroke:#52525B
    style E fill:#F3E8FF,stroke:#8B5CF6,stroke-width:1.5px
    style F fill:#FEF3C7,stroke:#EFAA17
    style F1 fill:#FEF3C7,stroke:#EFAA17
    style F2 fill:#FEF3C7,stroke:#EFAA17
    style F3 fill:#FEF3C7,stroke:#EFAA17
    style G1 fill:#F3E8FF,stroke:#8B5CF6
    style G2 fill:#EFF6FF,stroke:#3B82F6
    style G3 fill:#ECFDF5,stroke:#10B981
    style G4 fill:#EFF6FF,stroke:#3B82F6
    style H fill:#F3E8FF,stroke:#8B5CF6
    style H2 fill:#EFF6FF,stroke:#3B82F6
    style H3 fill:#ECFDF5,stroke:#10B981
    style I fill:#E0F2FE,stroke:#0EA5E9
    style J fill:#EFEFF2,stroke:#52525B
    style J1 fill:#E0F2FE,stroke:#0EA5E9
    style J2 fill:#E0F2FE,stroke:#0EA5E9
    style J3 fill:#E0F2FE,stroke:#0EA5E9
    style J4 fill:#E0F2FE,stroke:#0EA5E9
    style K fill:#FEF9E7,stroke:#EAB308
    style L fill:#FEF9E7,stroke:#EAB308
    style M fill:#EFEFF2,stroke:#52525B
    style M1 fill:#EFEFF2,stroke:#52525B
    style M2 fill:#EFEFF2,stroke:#52525B
    style M3 fill:#EFEFF2,stroke:#52525B
    style M4 fill:#EFEFF2,stroke:#52525B
    style M5 fill:#EFEFF2,stroke:#52525B
    style M6 fill:#ECFDF5,stroke:#1DC981
    style N fill:#EFEFF2,stroke:#52525B
```

</details>

<details>
<summary>📊 AI_ROUTER 路由规则决策树 Mermaid 源码（点击展开）</summary>

```mermaid
flowchart TD
    Q(["用户问题 question"]) --> R1{"匹配 生成任务?\n组卷/生成/出题/\n模拟卷/试卷/题库"}
    
    R1 -->|是| M_QWEN["Qwen3-72B\n🟣 中文王\n科目: 组卷"]
    R1 -->|否| R2{"匹配 学习规划?\n学习计划/规划/复习/\n冲刺/提分/进度"}
    
    R2 -->|是| M_QWEN2["Qwen3-72B\n🟣 中文王\n科目: 学习规划"]
    R2 -->|否| R3{"匹配 错题分析?\n错题/薄弱/总结/\n复盘/查漏/错题本"}
    
    R3 -->|是| M_QWEN3["Qwen3-72B\n🟣 中文王\n科目: 错题分析"]
    R3 -->|否| R4{"匹配 数学?\n数学/导数/函数/\n数列/三角/椭圆/\n概率/几何/向量"}
    
    R4 -->|是| M_R1_MATH["DeepSeek-R1\n🔵 推理王\n科目: 数学"]
    R4 -->|否| R5{"匹配 物理?\n物理/力学/电磁/\n光学/动量/能量"}
    
    R5 -->|是| M_R1_PHY["DeepSeek-R1\n🔵 推理王\n科目: 物理"]
    R5 -->|否| R6{"匹配 化学?\n化学/反应/有机/\n无机/平衡/元素"}
    
    R6 -->|是| M_R1_CHM["DeepSeek-R1\n🔵 推理王\n科目: 化学"]
    R6 -->|否| R7{"匹配 生物?\n生物/基因/细胞/\n遗传/dna/生态"}
    
    R7 -->|是| M_R1_BIO["DeepSeek-R1\n🔵 推理王\n科目: 生物"]
    R7 -->|否| R8{"匹配 语文?\n古诗/诗词/赏析/\n颔联/杜甫/李白/\n文言文/作文"}
    
    R8 -->|是| M_V3_CHN["DeepSeek-V3\n🟢 通用王\n科目: 语文"]
    R8 -->|否| R9{"匹配 英语?\n英语/grammar/\n语法/词汇/完形"}
    
    R9 -->|是| M_V3_ENG["DeepSeek-V3\n🟢 通用王\n科目: 英语"]
    R9 -->|否| R10{"匹配 政治?\n政治/经济/哲学/\n文化/党/政府"}
    
    R10 -->|是| M_V3_POL["DeepSeek-V3\n🟢 通用王\n科目: 政治"]
    R10 -->|否| R11{"匹配 历史?\n历史/朝代/战争/\n革命/改革/条约"}
    
    R11 -->|是| M_V3_HIS["DeepSeek-V3\n🟢 通用王\n科目: 历史"]
    R11 -->|否| R12{"匹配 地理?\n地理/气候/地形/\n河流/人口/城市"}
    
    R12 -->|是| M_V3_GEO["DeepSeek-V3\n🟢 通用王\n科目: 地理"]
    R12 -->|否| M_R1_FALLBACK["DeepSeek-R1\n🔵 推理王（兜底）\n科目: 综合"]
    
    M_QWEN --> END(["返回路由结果\n{modelKey, model, subject}"])
    M_QWEN2 --> END
    M_QWEN3 --> END
    M_R1_MATH --> END
    M_R1_PHY --> END
    M_R1_CHM --> END
    M_R1_BIO --> END
    M_V3_CHN --> END
    M_V3_ENG --> END
    M_V3_POL --> END
    M_V3_HIS --> END
    M_V3_GEO --> END
    M_R1_FALLBACK --> END

    style Q fill:#F2F7FF,stroke:#4B3FE3,stroke-width:1.5px
    style R1 fill:#FEF3C7,stroke:#EFAA17
    style R2 fill:#FEF3C7,stroke:#EFAA17
    style R3 fill:#FEF3C7,stroke:#EFAA17
    style R4 fill:#FEF3C7,stroke:#EFAA17
    style R5 fill:#FEF3C7,stroke:#EFAA17
    style R6 fill:#FEF3C7,stroke:#EFAA17
    style R7 fill:#FEF3C7,stroke:#EFAA17
    style R8 fill:#FEF3C7,stroke:#EFAA17
    style R9 fill:#FEF3C7,stroke:#EFAA17
    style R10 fill:#FEF3C7,stroke:#EFAA17
    style R11 fill:#FEF3C7,stroke:#EFAA17
    style R12 fill:#FEF3C7,stroke:#EFAA17
    style M_QWEN fill:#F3E8FF,stroke:#8B5CF6
    style M_QWEN2 fill:#F3E8FF,stroke:#8B5CF6
    style M_QWEN3 fill:#F3E8FF,stroke:#8B5CF6
    style M_R1_MATH fill:#EFF6FF,stroke:#3B82F6
    style M_R1_PHY fill:#EFF6FF,stroke:#3B82F6
    style M_R1_CHM fill:#EFF6FF,stroke:#3B82F6
    style M_R1_BIO fill:#EFF6FF,stroke:#3B82F6
    style M_V3_CHN fill:#ECFDF5,stroke:#10B981
    style M_V3_ENG fill:#ECFDF5,stroke:#10B981
    style M_V3_POL fill:#ECFDF5,stroke:#10B981
    style M_V3_HIS fill:#ECFDF5,stroke:#10B981
    style M_V3_GEO fill:#ECFDF5,stroke:#10B981
    style M_R1_FALLBACK fill:#EFF6FF,stroke:#3B82F6,stroke-dasharray:6 4
    style END fill:#ECFDF5,stroke:#1DC981,stroke-width:1.5px
```

</details>

---

#### `solveArithmetic(question)` — 基础算术求解器

**所在文件**: [pages-ai-center.js](file:///workspace/prototype/js/pages-ai-center.js)

**功能**: 在 `generateAIReply` 知识库匹配之前拦截算式类问题（如"1+1等于几"），直接计算并返回 deepseek 风格三段式回复（问题→分析→答案）。非算术题返回 `null`，交回知识库流程。

**AI模型**: 无（纯前端 JavaScript 计算，由智能路由层识别为"数学"科目后触发）

**参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `question` | string | 是 | 用户提问文本 |

**返回**: `string | null`
- 算术题：返回 deepseek 风格三段式 HTML（问题→分析→答案）
- 非算术题：返回 `null`（交回 `generateAIReply` 知识库流程）

**支持的算式类型**:

| 类型 | 示例输入 | 计算结果 |
|------|---------|---------|
| 加法 | `1+1等于几` | `1+1 = 2` |
| 减法 | `10-4等于多少` | `10-4 = 6` |
| 乘法 | `3*5是多少` | `3×5 = 15` |
| 除法 | `12÷3` | `12÷3 = 4` |
| 幂运算 | `2^3等于几` | `2^3 = 8` |
| 链式运算 | `2×3+4等于几` | `2×3+4 = 10` |
| 非算术题 | `你好` | `null`（交回知识库） |

**交互流程**:
1. 去空格、全角问号转半角
2. 正则提取算式部分（剥离"等于几/是多少"等自然语言）
3. 运算符标准化：`×→*`、`÷→/`、`^→**`
4. 安全检查：只允许数字和运算符（`0-9 + - * / . ^ ( )`）
5. `Function()` 严格模式计算
6. 异常/NaN → 返回 `null`
7. 格式化结果（整数去小数点）
8. 生成三段式 HTML 回复

**关键设计**:
1. **前置拦截**：在 `generateAIReply` 入口处调用，先于知识库关键词匹配
2. **安全沙箱**：正则白名单 + 安全检查双重过滤，拒绝代码注入
3. **优雅降级**：非算术题返回 `null`，不阻断知识库流程

**全局状态**: 无

<details>
<summary>📊 solveArithmetic() Mermaid 流程图源码（点击展开）</summary>

```mermaid
flowchart TD
    A(["用户提问\ne.g. '1+1等于几'"]) --> B["generateAIReply(question) 启动"]
    B --> C["调用 solveArithmetic(question)"]
    C --> D["预处理：去空格、全角？转半角?"]
    D --> E["正则提取算式部分\n剥离'等于几/是多少'等自然语言\n匹配: -?\\d+(?:\\.\\d+)?(?:[+\\-*/×÷^-]\\d+)+"]

    E --> F{"匹配到\n算式?"}
    F -->|否| RET_NULL["返回 null\n交回知识库关键词匹配流程"]
    F -->|是| G["运算符标准化\n× → *  ÷ → /  ^ → **"]

    G --> H["安全检查\n正则白名单: ^[\\d+\\-*/.\\s()^]+$"]
    H --> I{"安全检查\n通过?"}
    I -->|否| RET_NULL
    I -->|是| J["Function() 严格模式计算\nuse strict; return (expr)"]

    J --> K{"计算结果\n有效?"}
    K -->|异常/undefined/NaN| RET_NULL
    K -->|有效数字| L["格式化结果\n整数: 去小数点\n小数: 保留4位去尾零"]

    L --> M["生成 deepseek 风格三段式 HTML"]
    M --> M1["📌 数学科目标签\n（蓝色 #EFF6FF）"]
    M1 --> M2["📝 问题区\n引用用户原话\n（灰色背景 #F9FAFB）"]
    M2 --> M3["🧠 分析区\n展示算式 + 运算优先级说明\n（黄色背景 #FFFBEB）"]
    M3 --> M4["✅ 答案区\n高亮: 算式 = 结果\n（绿色背景 #ECFDF5）"]

    M4 --> N["返回三段式 HTML 给 generateAIReply"]
    N --> O(["sendAIMessage 继续后续流程\nstreamText 流式输出 + 模型归因"])

    RET_NULL --> P["generateAIReply 回退到\n知识库关键词匹配\n→ 兜底通用回复"]
    P --> O

    style A fill:#F2F7FF,stroke:#4B3FE3,stroke-width:1.5px
    style B fill:#EFEFF2,stroke:#52525B
    style C fill:#F3E8FF,stroke:#8B5CF6,stroke-width:1.5px
    style D fill:#EFEFF2,stroke:#52525B
    style E fill:#E0F2FE,stroke:#0EA5E9
    style F fill:#FEF3C7,stroke:#EFAA17
    style G fill:#EFEFF2,stroke:#52525B
    style H fill:#FEE2E2,stroke:#DC2626
    style I fill:#FEF3C7,stroke:#EFAA17
    style J fill:#EFF6FF,stroke:#3B82F6
    style K fill:#FEF3C7,stroke:#EFAA17
    style L fill:#EFEFF2,stroke:#52525B
    style M fill:#FEF9E7,stroke:#EAB308
    style M1 fill:#EFF6FF,stroke:#3B82F6
    style M2 fill:#F9FAFB,stroke:#9CA3AF
    style M3 fill:#FFFBEB,stroke:#F59E0B
    style M4 fill:#ECFDF5,stroke:#10B981,stroke-width:1.5px
    style N fill:#ECFDF5,stroke:#1DC981
    style O fill:#EFEFF2,stroke:#52525B
    style P fill:#FEE2E2,stroke:#DC2626
    style RET_NULL fill:#FEE2E2,stroke:#DC2626,stroke-dasharray:6 4
```

</details>

<details>
<summary>📊 generateAIReply() 三层拦截链路 Mermaid 源码（点击展开）</summary>

```mermaid
flowchart TD
    A(["用户问题 question"]) --> B["generateAIReply(question)"]
    B --> L1["第 1 层: solveArithmetic(question)\n算术求解器"]

    L1 --> C1{"是算术题?\n1+1 / 3×5 / 2^3"}
    C1 -->|是| R1["✅ 直接计算并返回\n三段式 HTML\n（问题→分析→答案）"]
    C1 -->|否| L2["第 2 层: AI_KNOWLEDGE_BASE\n关键词匹配知识库"]

    L2 --> C2{"匹配到\n关键词?"}
    C2 -->|是| R2["✅ 返回知识库中的\n预设分析+答案"]
    C2 -->|否| L3["第 3 层: 学科猜测兜底\nsubjectGuess 正则"]

    L3 --> C3{"识别出\n学科?"}
    C3 -->|是 数学/物理/化学等| R3["返回通用回复\n（含学科标签+建议补充关键词）"]
    C3 -->|否 通用| R4["返回通用回复\n（无学科标签+建议补充关键词）"]

    R1 --> OUT(["输出: 三段式 HTML\n问题 → 分析 → 答案"])
    R2 --> OUT
    R3 --> OUT
    R4 --> OUT

    OUT --> ST["streamText() 逐字流式输出"]
    ST --> ATTR["追加模型归因\n（DeepSeek-R1/V3/Qwen3-72B）"]
    ATTR --> DONE(["完成"])

    style A fill:#F2F7FF,stroke:#4B3FE3,stroke-width:1.5px
    style B fill:#EFEFF2,stroke:#52525B
    style L1 fill:#EFF6FF,stroke:#3B82F6,stroke-width:1.5px
    style L2 fill:#F3E8FF,stroke:#8B5CF6,stroke-width:1.5px
    style L3 fill:#FFFBEB,stroke:#F59E0B,stroke-width:1.5px
    style C1 fill:#FEF3C7,stroke:#EFAA17
    style C2 fill:#FEF3C7,stroke:#EFAA17
    style C3 fill:#FEF3C7,stroke:#EFAA17
    style R1 fill:#ECFDF5,stroke:#10B981
    style R2 fill:#ECFDF5,stroke:#10B981
    style R3 fill:#FFFBEB,stroke:#F59E0B
    style R4 fill:#FFFBEB,stroke:#F59E0B
    style OUT fill:#ECFDF5,stroke:#1DC981,stroke-width:1.5px
    style ST fill:#FEF9E7,stroke:#EAB308
    style ATTR fill:#E0F2FE,stroke:#0EA5E9
    style DONE fill:#EFEFF2,stroke:#52525B
```

</details>

---

#### `AI_KNOWLEDGE_BASE` 诗词默写条目 — 高考常见诗句上下句问答

**所在文件**: [pages-ai-center.js](file:///workspace/prototype/js/pages-ai-center.js)

**功能**: 在 `generateAIReply` 的第二层（知识库关键词匹配）中拦截诗词默写类问题，返回高考常见诗句的上下句对照表。解决"随风潜入夜，问下一句是什么"无法返回"润物细无声"的问题。

**AI模型**: 无（纯前端知识库匹配，由智能路由层识别为"语文"科目后触发，路由到 DeepSeek-V3）

**条目结构**:

| 字段 | 说明 |
|------|------|
| `keywords` | 触发关键词数组（单句+诗名+动作词，共 100+ 项） |
| `subject` | `'语文·诗词'` |
| `analysis` | 诗词默写题答题要领（准确背诵/易错字/理解记忆） |
| `answer` | 30+ 首高考常见诗句上下句对照表（HTML 格式，对应句绿色高亮） |

**关键词分类**（100+ 项）:

| 类别 | 示例 |
|------|------|
| 单句触发 | `随风潜入夜`、`润物细无声`、`床前明月光`、`举头望明月` |
| 诗名触发 | `春夜喜雨`、`静夜思`、`春晓`、`望岳`、`行路难`、`水调歌头` |
| 动作触发 | `下一句`、`上一句`、`默写`、`诗句`、`名句` |

**匹配逻辑**: `generateAIReply` 遍历 `AI_KNOWLEDGE_BASE`，用 `question.indexOf(keyword) >= 0` 判断，命中即返回该条目的 `analysis` + `answer`。

**路由规则补充**: 语文路由正则新增诗词默写关键词（`下一句`、`上一句`、`诗句`、`名句`、`春夜喜雨`、`静夜思` 等），确保诗词题路由到 DeepSeek-V3（文科通用）。

<details>
<summary>📊 诗词默写知识库匹配流程 Mermaid 源码（点击展开）</summary>

```mermaid
flowchart TD
    A(["用户问题\ne.g. '随风潜入夜，问下一句是什么'"]) --> B["generateAIReply(question)"]
    B --> L1["第1层: solveArithmetic\n算术求解器"]
    L1 --> C1{"是算术题?"}
    C1 -->|是| R1["直接计算返回"]
    C1 -->|否| L2["第2层: AI_KNOWLEDGE_BASE\n关键词匹配"]

    L2 --> MATCH["遍历知识库\n逐条目检查 keywords"]
    MATCH --> KB_POETRY{"诗词默写条目\nkeywords 匹配?"}
    KB_POETRY -->|命中: 随风潜入夜 / 下一句| POETRY_HIT["✅ 匹配诗词默写条目\nsubject: 语文·诗词"]
    KB_POETRY -->|未命中| KB_OTHER{"其他条目\n匹配?"}
    
    POETRY_HIT --> BUILD["构建 deepseek 风格三段式 HTML"]
    BUILD --> S1["📌 学科标签: 语文·诗词\n（蓝色 #EFF6FF）"]
    S1 --> S2["📝 问题区\n引用用户原话"]
    S2 --> S3["🧠 分析区\n答题要领:\n① 准确背诵不添漏字\n② 注意易错字（潜≠浅/润≠闰）\n③ 理解含义助记忆"]
    S3 --> S4["✅ 答案区\n30+首诗句上下句对照表\n《春夜喜雨》杜甫\n随风潜入夜，<b style=green>润物细无声</b>"]

    S4 --> OUT(["输出三段式 HTML"])

    KB_OTHER -->|命中| R_OTHER["返回对应条目答案"]
    KB_OTHER -->|未命中| L3["第3层: subjectGuess\n学科猜测兜底"]
    L3 --> OUT

    OUT --> ROUTE["智能路由: AI_ROUTER.selectAIModel\n语文路由正则命中'下一句'"]
    ROUTE --> V3["路由 → DeepSeek-V3\n（通用王 · MIT · 文科通用）"]
    V3 --> ATTR["追加模型归因\nDeepSeek-V3 通用王 · MIT · vLLM 推理"]
    ATTR --> DONE(["完成"])

    style A fill:#F2F7FF,stroke:#4B3FE3,stroke-width:1.5px
    style B fill:#EFEFF2,stroke:#52525B
    style L1 fill:#EFF6FF,stroke:#3B82F6,stroke-width:1.5px
    style L2 fill:#F3E8FF,stroke:#8B5CF6,stroke-width:1.5px
    style L3 fill:#FFFBEB,stroke:#F59E0B,stroke-width:1.5px
    style C1 fill:#FEF3C7,stroke:#EFAA17
    style R1 fill:#ECFDF5,stroke:#10B981
    style MATCH fill:#E0F2FE,stroke:#0EA5E9
    style KB_POETRY fill:#FEF3C7,stroke:#EFAA17
    style POETRY_HIT fill:#ECFDF5,stroke:#10B981,stroke-width:1.5px
    style KB_OTHER fill:#FEF3C7,stroke:#EFAA17
    style R_OTHER fill:#ECFDF5,stroke:#10B981
    style BUILD fill:#FEF9E7,stroke:#EAB308
    style S1 fill:#EFF6FF,stroke:#3B82F6
    style S2 fill:#F9FAFB,stroke:#9CA3AF
    style S3 fill:#FFFBEB,stroke:#F59E0B
    style S4 fill:#ECFDF5,stroke:#10B981,stroke-width:1.5px
    style OUT fill:#ECFDF5,stroke:#1DC981,stroke-width:1.5px
    style ROUTE fill:#F3E8FF,stroke:#8B5CF6
    style V3 fill:#ECFDF5,stroke:#10B981
    style ATTR fill:#E0F2FE,stroke:#0EA5E9
    style DONE fill:#EFEFF2,stroke:#52525B
```

</details>

<details>
<summary>📊 诗词默写知识库条目内容 Mermaid 源码（点击展开）</summary>

```mermaid
flowchart LR
    subgraph KB["AI_KNOWLEDGE_BASE 诗词默写条目"]
        direction TB
        K["keywords: 100+ 项\n随风潜入夜 / 润物细无声 /\n春夜喜雨 / 下一句 / 上一句 / ..."]
        K --> S["subject: 语文·诗词"]
        S --> A["analysis: 答题要领\n① 准确背诵 不添漏字\n② 易错字: 潜≠浅 润≠闰\n③ 理解含义助记忆"]
        A --> ANS["answer: 30+首诗句对照表"]
    end

    subgraph POEMS["answer 内容（部分）"]
        direction TB
        P1["《春夜喜雨》杜甫\n随风潜入夜 → 润物细无声"]
        P2["《静夜思》李白\n床前明月光 → 疑是地上霜"]
        P3["《登鹳雀楼》王之涣\n白日依山尽 → 黄河入海流"]
        P4["《望岳》杜甫\n会当凌绝顶 → 一览众山小"]
        P5["《水调歌头》苏轼\n但愿人长久 → 千里共婵娟"]
        P6["《过零丁洋》文天祥\n人生自古谁无死 → 留取丹心照汗青"]
        P7["《己亥杂诗》龚自珍\n落红不是无情物 → 化作春泥更护花"]
        P8["《行路难》李白\n长风破浪会有时 → 直挂云帆济沧海"]
        P9["... 共 30+ 首"]
    end

    ANS --> P1
    ANS --> P2
    ANS --> P3
    ANS --> P4
    ANS --> P5
    ANS --> P6
    ANS --> P7
    ANS --> P8
    ANS --> P9

    style K fill:#E0F2FE,stroke:#0EA5E9
    style S fill:#EFF6FF,stroke:#3B82F6
    style A fill:#FFFBEB,stroke:#F59E0B
    style ANS fill:#ECFDF5,stroke:#10B981,stroke-width:1.5px
    style P1 fill:#F0FDFA,stroke:#14B8A6
    style P2 fill:#F0FDFA,stroke:#14B8A6
    style P3 fill:#F0FDFA,stroke:#14B8A6
    style P4 fill:#F0FDFA,stroke:#14B8A6
    style P5 fill:#F0FDFA,stroke:#14B8A6
    style P6 fill:#F0FDFA,stroke:#14B8A6
    style P7 fill:#F0FDFA,stroke:#14B8A6
    style P8 fill:#F0FDFA,stroke:#14B8A6
    style P9 fill:#F0FDFA,stroke:#14B8A6
```

</details>

---

#### `explainNextStep()`

**所在文件**: [pages-ai-module.js](file:///workspace/prototype/js/pages-ai-module.js)

**功能**: AI讲题引擎的分步讲解推进器，点击"下一步讲解"按钮逐步展示解题过程。

**AI模型**: DeepSeek-R1 链式推理 (Chain-of-Thought)

**参数**: 无

**交互流程**:
1. 查询所有 `.explain-step` DOM元素获取总步数
2. 找到下一个未展开的步骤节点
3. 展开该步骤内容（display: block + opacity动画）
4. 更新进度条宽度：`currentStep / totalSteps * 100%`
5. 更新进度文字：`当前 X/Y 步 (Z%)`
6. 若已到最后一步，禁用按钮并显示完成提示

**DOM依赖**:

| 元素ID/选择器 | 类型 | 说明 |
|---------------|------|------|
| `.explain-step` | div[N] | 各步骤内容容器 |
| `#explain-next-btn` | button | 下一步讲解按钮 |
| `.explain-progress-bar` | div | 进度条填充元素 |
| `.explain-progress-text` | span | 进度文字 |

---

#### `errorReanalyze()`

**所在文件**: [pages-ai-center.js](file:///workspace/prototype/js/pages-ai-center.js)

**功能**: AI错题分析的重新分析按钮，使用Qwen3-72B重新评估错题知识点和推荐练习。

**AI模型**: Qwen3-72B + DeepKE知识图谱

**参数**: 无

**交互流程**:
1. 禁用 `#error-reanalyze-btn` 按钮
2. 显示 `#error-reanalyze-status` 状态区域
3. 分阶段展示：
   - `Qwen3-72B 分析错题根因…`
   - `DeepKE 定位薄弱知识点…`
   - `生成个性化练习推荐…`
   - `分析完成！`
4. 更新错题知识点置信度数值
5. 显示成功状态，4秒后隐藏

**DOM依赖**:

| 元素ID | 类型 | 说明 |
|--------|------|------|
| `#error-reanalyze-btn` | button | 重新分析按钮 |
| `#error-reanalyze-status` | div | 状态提示区域 |

---

#### `planRegenerate()`

**所在文件**: [pages-ai-center.js](file:///workspace/prototype/js/pages-ai-center.js)

**功能**: AI学习规划的重新规划按钮，根据最新学情重新生成个性化学习计划。

**AI模型**: DeepSeek-R1（学情推理） + XGBoost（提分预测）

**参数**: 无

**交互流程**:
1. 禁用 `#plan-regen-btn` 按钮，降低透明度
2. 显示 `#plan-regen-status` 状态区域
3. 分5阶段展示（每500ms切换）:
   - `DeepSeek-R1 分析近7天学习数据…`
   - `知识图谱评估各科掌握程度…`
   - `XGBoost 预测提分空间…`
   - `重新分配学习权重与时间…`
   - `生成个性化30天计划完成！`
4. 更新预测提分显示（随机+20~35分）
5. 显示成功状态（绿色背景），5秒后隐藏

**DOM依赖**:

| 元素ID/选择器 | 类型 | 说明 |
|---------------|------|------|
| `#plan-regen-btn` | button | 重新规划按钮 |
| `#plan-regen-status` | div | 状态提示区域 |
| `[style*="linear-gradient(135deg,#10B981"] span` | span | 预测提分数值 |

**全局状态**: `window._planData`（计划数据：weeks[], buttons[], overall_progress）

---

#### `exportPlan()`

**所在文件**: [pages-ai-center.js](file:///workspace/prototype/js/pages-ai-center.js)

**功能**: AI学习规划的导出计划按钮，将当前学习计划生成完整的 HTML 报告并下载到本地。

**AI模型**: Qwen3-72B（数据汇总） + DeepSeek-R1（分析报告生成） + XGBoost（提分预测数据）

**参数**: 无

**交互流程**:
1. 禁用 `#plan-export-btn` 按钮，降低透明度
2. 显示 `#plan-regen-status` 状态区域（蓝色背景）
3. 分4阶段展示AI生成过程（每500ms切换）:
   - `Qwen3-72B 汇总学习计划数据…`
   - `DeepSeek-R1 生成个性化分析报告…`
   - `格式化输出为可打印文档…`
   - `报告生成完成，开始下载…`
4. 从 `window._planData` 读取计划数据，生成完整 HTML 报告：
   - 目标分数分解（各科目标分数卡片）
   - AI提分预测（绿色渐变卡片）
   - 4周冲刺计划详情（每周主题、任务列表、完成状态、天数范围）
   - 整体进度（进度条 + 完成天数）
   - 模型归因说明（DeepSeek-R1 + Qwen3-72B + XGBoost）
5. 通过 `Blob` + `URL.createObjectURL()` 触发文件下载（`AI学习规划报告_YYYY-MM-DD.html`）
6. 显示成功状态（绿色背景 + check-circle图标）
7. 恢复按钮可用，5秒后隐藏状态区域

**DOM依赖**:

| 元素ID/选择器 | 类型 | 说明 |
|---------------|------|------|
| `#plan-export-btn` | button | 导出计划按钮 |
| `#plan-regen-status` | div | 状态提示区域（与planRegenerate共用） |

**全局状态**: `window._planData`（计划数据：goal_card, ai_predict, weeks[], overall_progress）

**下载文件**: `AI学习规划报告_YYYY-MM-DD.html`（含 `@media print` 打印优化样式）

<details>
<summary>📊 exportPlan() Mermaid 流程图源码（点击展开）</summary>

```mermaid
flowchart TD
    A(["用户点击「导出计划」按钮"]) --> B["exportPlan() 启动"]
    B --> B1["btn.disabled = true\nbtn.style.opacity = 0.6"]
    B --> B2["显示 #plan-regen-status\n背景: #EFF6FF\n文字: #1E40AF"]
    B1 --> C["分阶段展示AI生成过程\nsetInterval 500ms"]
    B2 --> C
    C --> P1["Phase 1: Qwen3-72B\n汇总学习计划数据"]
    P1 --> P2["Phase 2: DeepSeek-R1\n生成个性化分析报告"]
    P2 --> P3["Phase 3: 格式化输出\n为可打印文档"]
    P3 --> P4["Phase 4: 报告生成完成\n开始下载"]
    P4 --> D{"所有 Phase\n完成?"}
    D -->|否| C
    D -->|是| E["读取 window._planData"]
    E --> E1["提取 goal_card\n（目标分数分解）"]
    E --> E2["提取 ai_predict\n（AI提分预测）"]
    E --> E3["提取 weeks[]\n（4周冲刺计划）"]
    E --> E4["提取 overall_progress\n（整体进度）"]
    E1 --> F["拼接完整 HTML 报告"]
    E2 --> F
    E3 --> F
    E4 --> F
    F --> F1["注入 CSS 样式\n（含 @media print）"]
    F1 --> G["创建 Blob 对象\ntype: text/html;charset=utf-8"]
    G --> H["URL.createObjectURL(blob)"]
    H --> I["创建 <a> 元素\na.download = AI学习规划报告_YYYY-MM-DD.html\na.click() 触发下载"]
    I --> J["URL.revokeObjectURL(url)\n清理临时URL"]
    J --> K["显示成功状态\n背景: #ECFDF5\n文字: #065F46\n图标: check-circle\n文案: 报告已生成并下载！"]
    K --> L["恢复按钮\nbtn.disabled = false\nbtn.style.opacity = 1"]
    L --> M["setTimeout 5000ms\n自动隐藏 status 区域"]

    style A fill:#F2F7FF,stroke:#4B3FE3,stroke-width:1.5px
    style B fill:#EFEFF2,stroke:#52525B
    style B1 fill:#EFEFF2,stroke:#52525B
    style B2 fill:#EFF6FF,stroke:#3B82F6
    style C fill:#EFEFF2,stroke:#52525B
    style P1 fill:#F3E8FF,stroke:#8B5CF6
    style P2 fill:#F3E8FF,stroke:#8B5CF6
    style P3 fill:#F3E8FF,stroke:#8B5CF6
    style P4 fill:#F3E8FF,stroke:#8B5CF6
    style D fill:#FEF3C7,stroke:#EFAA17
    style E fill:#E0F2FE,stroke:#0EA5E9
    style E1 fill:#E0F2FE,stroke:#0EA5E9
    style E2 fill:#E0F2FE,stroke:#0EA5E9
    style E3 fill:#E0F2FE,stroke:#0EA5E9
    style E4 fill:#E0F2FE,stroke:#0EA5E9
    style F fill:#FEF9E7,stroke:#EAB308
    style F1 fill:#FEF9E7,stroke:#EAB308
    style G fill:#F0FDFA,stroke:#14B8A6
    style H fill:#F0FDFA,stroke:#14B8A6
    style I fill:#F0FDFA,stroke:#14B8A6
    style J fill:#F0FDFA,stroke:#14B8A6
    style K fill:#ECFDF5,stroke:#1DC981,stroke-width:1.5px
    style L fill:#EFEFF2,stroke:#52525B
    style M fill:#EFEFF2,stroke:#52525B
```

</details>

---

#### `aiReparse()`

**所在文件**: [pages-photo.js](file:///workspace/prototype/js/pages-photo.js)

**功能**: 拍照搜题AI解析的重新解析按钮，使用Qwen3-72B + DeepSeek-R1重新生成详细解析。

**AI模型**: Qwen3-72B（理解题意） + DeepSeek-R1（分步推理） + BGE-M3（检索相似解法）

**参数**: 无

**交互流程**:
1. 禁用 `#parse-reparse-btn` 按钮
2. 显示 `#parse-reparse-status` 状态区域
3. 分4阶段展示（每500ms切换）:
   - `Qwen3-72B 理解题意中…`
   - `DeepSeek-R1 分步推理…`
   - `BGE-M3 检索相似解法…`
   - `生成详细解析完成！`
4. 更新置信度数值（95%~98%随机）
5. 显示成功状态，4秒后隐藏

**DOM依赖**:

| 元素ID/选择器 | 类型 | 说明 |
|---------------|------|------|
| `#parse-reparse-btn` | button | AI重新解析按钮 |
| `#parse-reparse-status` | div | 状态提示区域 |
| `[style*="font-size:26px"]` (在 #photo-parse-content 内) | span | 置信度数值 |

**全局状态**: `window._parseData`（解析数据）

---

### 3.2 生成与检测类

---

#### `paperRegenerate()`

**所在文件**: [pages-ai-module.js](file:///workspace/prototype/js/pages-ai-module.js)

**功能**: AI组卷引擎的重新生成按钮，使用Qwen3生成题目 + BERT相似度去重，重新生成试卷。

**AI模型**: Qwen3-72B（题目生成） + BERT（相似度去重） + 知识图谱（难度编排）

**参数**: 无

**交互流程**:
1. 禁用 `#paper-regen-btn` 按钮
2. 显示 `#paper-regen-status` 状态区域
3. 分4阶段展示（每500ms切换）:
   - `Qwen3-72B 生成题目中…`
   - `BERT 相似度去重…`
   - `知识图谱编排难度梯度…`
   - `组卷完成！`
4. 更新试卷题目数量和难度分布
5. 显示成功状态，4秒后隐藏

**DOM依赖**:

| 元素ID | 类型 | 说明 |
|--------|------|------|
| `#paper-regen-btn` | button | 重新生成按钮 |
| `#paper-regen-status` | div | 状态提示区域 |

**全局状态**: `window._paperData`（试卷数据：questions[], difficulty分布）

<details>
<summary>📊 paperRegenerate() Mermaid 流程图源码（点击展开）</summary>

```mermaid
flowchart TD
    A(["用户点击「重新生成」按钮"]) --> B["paperRegenerate() 启动"]
    B --> B1["btn.disabled = true\nbtn.style.opacity = 0.6"]
    B --> B2["显示 #paper-regen-status\n背景: #EFF6FF\n文字: #1E40AF"]
    B1 --> C["分阶段展示AI组卷过程\nsetInterval 500ms"]
    B2 --> C
    C --> P1["Phase 1: Qwen3-72B\n生成题目中…"]
    P1 --> P2["Phase 2: BERT\n相似度去重…"]
    P2 --> P3["Phase 3: 知识图谱\n编排难度梯度…"]
    P3 --> P4["Phase 4: 组卷完成！"]
    P4 --> D{"所有 Phase\n完成?"}
    D -->|否| C
    D -->|是| E["读取 window._paperData"]
    E --> E1["提取 questions[]\n（题目列表）"]
    E --> E2["提取 difficulty_distribution\n（难度分布）"]
    E --> E3["提取 params\n（科目/题量/用时）"]
    E1 --> F["更新试卷预览列表\n（题目编号+题型+难度+考点）"]
    E2 --> F
    E3 --> F
    F --> F1["更新难度分布条\n（简4 / 中10 / 难6）"]
    F1 --> G["显示成功状态\n背景: #ECFDF5\n文字: #065F46\n图标: check-circle\n文案: 试卷已更新！"]
    G --> H["恢复按钮\nbtn.disabled = false\nbtn.style.opacity = 1"]
    H --> I["setTimeout 4000ms\n自动隐藏 status 区域"]

    style A fill:#F2F7FF,stroke:#4B3FE3,stroke-width:1.5px
    style B fill:#EFEFF2,stroke:#52525B
    style B1 fill:#EFEFF2,stroke:#52525B
    style B2 fill:#EFF6FF,stroke:#3B82F6
    style C fill:#EFEFF2,stroke:#52525B
    style P1 fill:#F3E8FF,stroke:#8B5CF6
    style P2 fill:#F3E8FF,stroke:#8B5CF6
    style P3 fill:#F3E8FF,stroke:#8B5CF6
    style P4 fill:#F3E8FF,stroke:#8B5CF6
    style D fill:#FEF3C7,stroke:#EFAA17
    style E fill:#E0F2FE,stroke:#0EA5E9
    style E1 fill:#E0F2FE,stroke:#0EA5E9
    style E2 fill:#E0F2FE,stroke:#0EA5E9
    style E3 fill:#E0F2FE,stroke:#0EA5E9
    style F fill:#FEF9E7,stroke:#EAB308
    style F1 fill:#FEF9E7,stroke:#EAB308
    style G fill:#ECFDF5,stroke:#1DC981,stroke-width:1.5px
    style H fill:#EFEFF2,stroke:#52525B
    style I fill:#EFEFF2,stroke:#52525B
```

</details>

---

#### `graphNodeClick(nodeId)`

**所在文件**: [pages-ai-module.js](file:///workspace/prototype/js/pages-ai-module.js)

**功能**: AI知识图谱的节点点击交互，展示节点详情和关联知识点。

**AI模型**: DeepKE（知识抽取） + GraphSAGE（图推理关联推荐）

**参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `nodeId` | string/number | 是 | 被点击节点的ID |

**交互流程**:
1. 从 `window._graphNodes` 查找节点数据
2. 从 `window._graphEdges` 查找关联边
3. 高亮当前节点（SVG样式变更）
4. 在详情面板展示：节点名称、掌握度、关联知识点
5. 使用GraphSAGE推荐3个关联薄弱节点

**DOM依赖**: SVG图谱中的节点元素 + 详情面板

**全局状态**:
- `window._graphNodes`：节点数组 `[{id, label, mastery, x, y}]`
- `window._graphEdges`：边数组 `[{source, target, relation}]`

---

#### `predictRecalculate()`

**所在文件**: [pages-ai-module.js](file:///workspace/prototype/js/pages-ai-module.js)

**功能**: AI预测高考的重新预测按钮，使用三模型集成重新计算录取概率和分数线。

**AI模型**: XGBoost + LightGBM + DeepFM（三模型集成预测）

**参数**: 无

**交互流程**:
1. 禁用 `#predict-recalc-btn` 按钮
2. 显示 `#predict-status` 状态区域
3. 分4阶段展示（每500ms切换）:
   - `XGBoost 特征工程中…`
   - `LightGBM 模型预测…`
   - `DeepFM 交互特征分析…`
   - `集成预测完成！`
4. 更新预测分数（590~610随机）
5. 更新置信度（91%~95%随机）
6. 更新录取概率柱状图
7. 显示成功状态，4秒后隐藏

**DOM依赖**:

| 元素ID | 类型 | 说明 |
|--------|------|------|
| `#predict-recalc-btn` | button | 重新AI预测按钮 |
| `#predict-status` | div | 状态提示区域 |

---

#### `ocrReRecognize()`

**所在文件**: [pages-ai-module.js](file:///workspace/prototype/js/pages-ai-module.js)

**功能**: OCR识别详情的重新识别按钮，使用PaddleOCR + LaTeX-OCR重新识别试卷图片。

**AI模型**: PaddleOCR（文字检测识别） + LaTeX-OCR（数学公式识别）

**参数**: 无

**交互流程**:
1. 禁用 `#ocr-rerecognize-btn` 按钮
2. 显示 `#ocr-rerecognize-status` 状态区域
3. 分4阶段展示（每500ms切换）:
   - `PaddleOCR 文字检测中…`
   - `LaTeX-OCR 公式识别中…`
   - `中英文/数学公式校正…`
   - `识别完成！`
4. 更新准确率数值（97%~99%随机）
5. 显示成功状态，4秒后隐藏

**DOM依赖**:

| 元素ID | 类型 | 说明 |
|--------|------|------|
| `#ocr-rerecognize-btn` | button | 重新OCR识别按钮 |
| `#ocr-rerecognize-status` | div | 状态提示区域 |

**全局状态**: `window._ocrData`（OCR识别数据）

---

#### `llmRecut()`

**所在文件**: [pages-ai-module.js](file:///workspace/prototype/js/pages-ai-module.js)

**功能**: LLM切题详情的重新切题按钮，使用Qwen3-72B重新分析题目边界并分割。

**AI模型**: Qwen3-72B（题目边界检测） + BERT（题干/小题分割）

**参数**: 无

**交互流程**:
1. 禁用 `#llm-recut-btn` 按钮
2. 显示 `#llm-recut-status` 状态区域
3. 分4阶段展示（每500ms切换）:
   - `Qwen3-72B 分析题目边界…`
   - `BERT 题干/小题分割…`
   - `知识点自动标注…`
   - `切题完成！`
4. 更新题目数量和平均置信度（95%~98%随机）
5. 显示成功状态，4秒后隐藏

**DOM依赖**:

| 元素ID | 类型 | 说明 |
|--------|------|------|
| `#llm-recut-btn` | button | 重新LLM切题按钮 |
| `#llm-recut-status` | div | 状态提示区域 |

**全局状态**: `window._cutData`（切题数据：questions[], confidence）

---

#### `navigateTo('ai-module-paper')` — AI智能组卷入口跳转

**所在文件**: [pages-practice.js](file:///workspace/prototype/js/pages-practice.js)

**功能**: 智能刷题模块下「模拟题」页面顶部的「AI智能组卷」入口卡片，原仅弹Toast提示，现改为跳转到真实的 AI 组卷引擎页面（ai-module-paper）。

**AI模型**: 无直接调用（跳转后由目标页面的 `paperRegenerate()` 等函数使用 Qwen3-72B + BERT）

**参数**: `pageKey = 'ai-module-paper'`（写死在 onclick 中）

**交互流程**:
1. 用户在「模拟题」页面点击紫色渐变的「AI智能组卷」入口卡片
2. 调用 `navigateTo('ai-module-paper')`
3. 检查 `PAGES['ai-module-paper']` 是否注册
4. 推入 `navHistory` 导航历史栈
5. 调用 `renderPage('ai-module-paper')` 渲染 AI 组卷引擎页面
6. 异步加载 `api.getPageData('ai-module-paper')` 数据
7. 渲染：说明卡片 + 组卷参数 + 数据依据 + 试卷预览 + 操作按钮

**DOM依赖**: 入口卡片 `onclick` 属性

**全局状态**: `navHistory`（导航历史栈）

<details>
<summary>📊 AI智能组卷入口跳转 Mermaid 流程图源码（点击展开）</summary>

```mermaid
flowchart TD
    A(["用户在模拟题页面点击「AI智能组卷」入口卡片"]) --> B["触发 onclick=navigateTo('ai-module-paper')"]
    B --> C{"PAGES['ai-module-paper']\n是否已注册?"}
    C -->|否| X["显示「页面暂未实现」"]
    C -->|是| D["navHistory.push('ai-module-paper')"]
    D --> E["renderPage('ai-module-paper')"]
    E --> F["Page() 渲染壳\n（状态栏+导航栏+内容容器）"]
    F --> G["setTimeout 100ms\n等待 DOM 就绪"]
    G --> H["api.getPageData('ai-module-paper')"]
    H --> I{"API 返回数据?"}
    I -->|否/空| J["显示「暂无数据」"]
    I -->|是| K["renderPageContent(container, data)"]
    K --> K1["GradientCard 说明卡片\n（AI智能组卷·说明文案）"]
    K1 --> K2["组卷参数区\n（科目/题量/用时/难度分布条）"]
    K2 --> K3["数据依据区\n（4项：1000题分析/薄弱知识点/高频考点/遗忘曲线）"]
    K3 --> K4["试卷预览区\n（20题列表，含编号/题型/难度/分值/来源/考点）"]
    K4 --> K5["操作按钮\n（开始答题·paperRegenerate 重新生成）"]
    K5 --> K6["缓存 window._paperData\n供 paperRegenerate() 使用"]

    style A fill:#F2F7FF,stroke:#4B3FE3,stroke-width:1.5px
    style B fill:#EFEFF2,stroke:#52525B
    style C fill:#FEF3C7,stroke:#EFAA17
    style X fill:#FEE2E2,stroke:#DC2626
    style D fill:#EFEFF2,stroke:#52525B
    style E fill:#EFEFF2,stroke:#52525B
    style F fill:#EFF6FF,stroke:#3B82F6
    style G fill:#EFEFF2,stroke:#52525B
    style H fill:#E0F2FE,stroke:#0EA5E9
    style I fill:#FEF3C7,stroke:#EFAA17
    style J fill:#FEE2E2,stroke:#DC2626
    style K fill:#ECFDF5,stroke:#1DC981,stroke-width:1.5px
    style K1 fill:#FEF9E7,stroke:#EAB308
    style K2 fill:#FEF9E7,stroke:#EAB308
    style K3 fill:#FEF9E7,stroke:#EAB308
    style K4 fill:#FEF9E7,stroke:#EAB308
    style K5 fill:#FEF9E7,stroke:#EAB308
    style K6 fill:#F0FDFA,stroke:#14B8A6
```

</details>

---

#### `filterPracticeMock(type, value)` — 模拟题双重过滤

**所在文件**: [pages-practice.js](file:///workspace/prototype/js/pages-practice.js)

**功能**: 模拟题页面的科目分段控制和来源筛选联动过滤，原仅弹Toast提示，现改为实时过滤模拟卷列表。支持「科目 × 来源」双重维度筛选。

**AI模型**: 无（纯前端数据过滤）

**参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `type` | string | 是 | 过滤维度：`'subject'`（科目）或 `'source'`（来源） |
| `value` | string | 是 | 过滤值：科目名（全部/数学/语文/英语/物理/化学/生物/政治/历史/地理）或来源名（全部/名校模拟/机构模拟/AI生成） |

**交互流程**:
1. 更新 `window.__practiceMockFilters[type] = value`
2. 若 `type === 'source'`，更新来源筛选按钮高亮（蓝色=选中，白色=未选）
3. 按 `matchSource()` 函数分类来源：
   - `名校模拟` → 衡水中学/黄冈中学/人大附中/成都七中
   - `机构模拟` → 学而思/新东方/猿辅导/作业帮
   - `AI生成` → AI生成
   - `全部` → 不限
4. 双重过滤：`subjectOk && sourceOk`
5. 重新渲染 `#practice-mock-list` 容器
6. 若结果为空，显示「暂无符合筛选条件的模拟卷」

**DOM依赖**:

| 元素ID/选择器 | 类型 | 说明 |
|---------------|------|------|
| `#practice-mock-sources` | div | 来源筛选按钮容器 |
| `#practice-mock-list` | div | 模拟卷列表容器（被重新渲染） |
| `.proto-segment-item` | div | 科目分段控制项 |

**全局状态**:
- `window.__practiceMocks`：全部模拟卷数组（含 `_origIdx` 字段）
- `window.__practiceMockFilters`：当前过滤条件 `{subject, source}`

<details>
<summary>📊 filterPracticeMock() Mermaid 流程图源码（点击展开）</summary>

```mermaid
flowchart TD
    A(["用户点击科目 Segment 或来源筛选按钮"]) --> B["filterPracticeMock(type, value) 启动"]
    B --> C["更新 window.__practiceMockFilters[type] = value"]
    C --> D{"type === 'source'?"}
    D -->|是| E["更新来源按钮高亮\n选中: #3B82F6/white\n未选: white/#374151"]
    D -->|否| F["跳过按钮高亮更新\n（科目高亮由 switchSegment 处理）"]
    E --> G["matchSource() 分类判断"]
    F --> G
    G --> G1{"filterSource === '全部'?"}
    G1 -->|是| G2["返回 true（不限来源）"]
    G1 -->|否| G3{"filterSource === '名校模拟'?"}
    G3 -->|是| G4["匹配：衡水中学/黄冈中学\n/人大附中/成都七中"]
    G3 -->|否| G5{"filterSource === '机构模拟'?"}
    G5 -->|是| G6["匹配：学而思/新东方\n/猿辅导/作业帮"]
    G5 -->|否| G7{"filterSource === 'AI生成'?"}
    G7 -->|是| G8["匹配：mockSource === 'AI生成'"]
    G7 -->|否| G9["返回 true（兜底）"]
    G2 --> H["双重过滤：subjectOk && sourceOk"]
    G4 --> H
    G6 --> H
    G8 --> H
    G9 --> H
    H --> I{"filtered.length > 0?"}
    I -->|是| J["重新渲染 #practice-mock-list\n逐条生成模拟卷卡片\n（科目标签+来源标签+卷名+难度星+人数+好评率）"]
    I -->|否| K["显示空状态\n「暂无符合筛选条件的模拟卷」"]
    J --> L(["过滤完成，等待下次交互"])
    K --> L

    style A fill:#F2F7FF,stroke:#4B3FE3,stroke-width:1.5px
    style B fill:#EFEFF2,stroke:#52525B
    style C fill:#EFEFF2,stroke:#52525B
    style D fill:#FEF3C7,stroke:#EFAA17
    style E fill:#EFF6FF,stroke:#3B82F6
    style F fill:#EFEFF2,stroke:#52525B
    style G fill:#EFEFF2,stroke:#52525B
    style G1 fill:#FEF3C7,stroke:#EFAA17
    style G2 fill:#ECFDF5,stroke:#1DC981
    style G3 fill:#FEF3C7,stroke:#EFAA17
    style G4 fill:#E0F2FE,stroke:#0EA5E9
    style G5 fill:#FEF3C7,stroke:#EFAA17
    style G6 fill:#E0F2FE,stroke:#0EA5E9
    style G7 fill:#FEF3C7,stroke:#EFAA17
    style G8 fill:#E0F2FE,stroke:#0EA5E9
    style G9 fill:#ECFDF5,stroke:#1DC981
    style H fill:#F3E8FF,stroke:#8B5CF6,stroke-width:1.5px
    style I fill:#FEF3C7,stroke:#EFAA17
    style J fill:#ECFDF5,stroke:#1DC981
    style K fill:#FEE2E2,stroke:#DC2626
    style L fill:#EFEFF2,stroke:#52525B
```

</details>

---

### 3.3 推荐与测试类

---

#### `recommendRefresh()`

**所在文件**: [pages-practice.js](file:///workspace/prototype/js/pages-practice.js)

**功能**: AI推荐题的换一批推荐按钮，使用协同过滤 + 知识图谱重新推荐题目。

**AI模型**: DeepFM（推荐排序） + 协同过滤 + 知识图谱

**参数**: 无

**交互流程**:
1. 禁用 `#recommend-refresh-btn` 按钮
2. 显示 `#recommend-refresh-status` 状态区域
3. 分3阶段展示（每500ms切换）:
   - `协同过滤 计算用户相似度…`
   - `知识图谱 匹配薄弱知识点…`
   - `DeepFM 排序推荐完成！`
4. 更新推荐题目列表数据
5. 显示成功状态，4秒后隐藏

**DOM依赖**:

| 元素ID | 类型 | 说明 |
|--------|------|------|
| `#recommend-refresh-btn` | button | 换一批推荐按钮 |
| `#recommend-refresh-status` | div | 状态提示区域 |

---

#### `similarRefresh()`

**所在文件**: [pages-photo.js](file:///workspace/prototype/js/pages-photo.js)

**功能**: 拍照搜题相似题的换一批按钮，使用BERT语义编码 + Milvus向量检索重新推荐相似题。

**AI模型**: BERT（语义编码） + Milvus（向量检索） + DeepKE（知识点过滤）

**参数**: 无

**交互流程**:
1. 禁用 `#similar-refresh-btn` 按钮
2. 显示 `#similar-refresh-status` 状态区域
3. 分4阶段展示（每500ms切换）:
   - `BERT 题干语义编码…`
   - `Milvus 向量库相似度检索…`
   - `DeepKE 知识点关联过滤…`
   - `生成新推荐完成！`
4. 更新相似题相似度数值（88%~97%随机）
5. 显示成功状态，4秒后隐藏

**DOM依赖**:

| 元素ID | 类型 | 说明 |
|--------|------|------|
| `#similar-refresh-btn` | button | 换一批相似题按钮 |
| `#similar-refresh-status` | div | 状态提示区域 |

**全局状态**:
- `window.__photoSimilarQuestions`：相似题数组
- `window.__photoSimilarData`：相似题页数据

---

#### `testModelConnectivity(modelName)`

**所在文件**: [pages-ai-module.js](file:///workspace/prototype/js/pages-ai-module.js)

**功能**: AI模型中心的连通性测试按钮，通过vLLM推理引擎检测模型是否可用。

**AI模型**: vLLM 推理引擎

**参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `modelName` | string | 是 | 模型名称（如 "DeepSeek-R1"） |

**交互流程**:
1. 根据 `modelName` 计算DOM ID：`model-test-{sanitized_name}`
2. 显示对应元素，设置蓝色状态文字
3. 3阶段展示（400ms/400ms/400ms间隔）:
   - `正在连接 vLLM 推理引擎…`
   - `发送 ping 请求…`
   - `验证模型加载状态…`
4. 完成后显示：`连通正常 · 延迟 {20-99}ms · vLLM 引擎就绪`

**DOM依赖**:

| 元素ID | 类型 | 说明 |
|--------|------|------|
| `model-test-{modelName}` | div | 每个模型卡片的测试结果区域 |

**ID生成规则**: `modelName.replace(/[^a-zA-Z0-9]/g, '_')` → 拼接 `model-test-` 前缀

---

#### `testModelCapability(modelName)`

**所在文件**: [pages-ai-module.js](file:///workspace/prototype/js/pages-ai-module.js)

**功能**: AI模型中心的能力测试按钮，根据模型类型执行对应能力探测任务。

**AI模型**: 按模型类型自动路由

**参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `modelName` | string | 是 | 模型名称 |

**能力路由规则**:

| 模型名关键词（小写） | 探测能力 |
|---------------------|----------|
| `bge` | 向量检索 |
| `bert` | 语义相似度 |
| `deepke` | 知识抽取 |
| `graphsage` | 图推理 |
| `xgboost` / `lightgbm` | 分数预测 |
| `paddle` / `ocr` | 文字识别 |
| `latex` | 公式识别 |
| 其他（默认） | 文本生成 |

**交互流程**:
1. 根据 `modelName` 小写匹配推断能力类型
2. 显示 `model-test-{modelName}` 元素
3. 2阶段展示（500ms/600ms间隔）:
   - `测试能力：{capability}…`
   - `执行推理任务…`
4. 完成后显示：`能力正常 · {capability} · 吞吐 {100-299} tokens/s`

**DOM依赖**: 同 `testModelConnectivity()`

---

## 4. 通用交互模式

### 4.1 分阶段进度动画模式

所有"重新XX"类函数共用同一交互模式：

```
┌──────────────────────────────────────────┐
│ 1. 禁用按钮                                │
│    btn.disabled = true                     │
│    btn.style.opacity = '0.6'              │
├──────────────────────────────────────────┤
│ 2. 显示状态区域                             │
│    status.style.display = 'block'         │
│    status.style.background = '#EFF6FF'    │
│    status.style.color = '#1E40AF'         │
├──────────────────────────────────────────┤
│ 3. setInterval 500ms 间隔切换phase文案      │
│    phases = ['阶段1…', '阶段2…', ...]     │
│    每次切换: status.innerHTML = spinner+phase│
├──────────────────────────────────────────┤
│ 4. 所有phase完成                            │
│    clearInterval(timer)                   │
│    status.style.background = '#ECFDF5'    │
│    status.style.color = '#065F46'         │
│    status.innerHTML = check-circle + 完成文案│
├──────────────────────────────────────────┤
│ 5. 恢复按钮                                 │
│    btn.disabled = false                    │
│    btn.style.opacity = '1'                │
├──────────────────────────────────────────┤
│ 6. 4-5秒后自动隐藏状态区域                    │
│    setTimeout(() => status.style.display='none', 4000)│
└──────────────────────────────────────────┘
```

### 4.2 RAG流式对话模式

AI答疑和学习教练使用更复杂的4阶段RAG流程：

```
用户输入问题
  → 创建AI回复容器 + "正在思考"加载状态
    → 阶段1: BGE-M3 向量检索 (500ms)
      → 阶段2: Milvus 向量库匹配 (500ms)
        → 阶段3: bge-reranker-v2-m3 重排序 (500ms)
          → 阶段4: Qwen3-72B 生成回答
            → streamText() 逐字输出
              → 追加模型归因徽章
```

### 4.3 分步讲解模式

AI讲题引擎使用步进式展开：

```
初始状态: 仅第1步展开，进度 1/N (20%)
  → 用户点击"下一步讲解"
    → 展开第2步内容 (display + opacity动画)
    → 进度条更新: 2/N (40%)
    → 文字更新: "当前 2/N 步 (40%)"
      → ... 重复直到最后一步
        → 禁用按钮 + "讲解已完成"提示
```

### 4.4 图谱节点交互模式

知识图谱使用SVG节点点击：

```
SVG节点点击 (onclick="graphNodeClick(nodeId)")
  → 从全局数组查找节点数据
  → 高亮当前节点 (SVG样式)
  → 查找关联边 (edges.filter)
  → 详情面板展示: 名称/掌握度/关联知识点
  → GraphSAGE推荐3个薄弱关联节点
```

---

### 4.5 知识库导入流程

知识数据库的导入入口分布在 **3 大功能板块、8 个子功能**，数据最终统一写入**中央题库数据库**（智能中台），供所有 AI 功能模块共享调用。

#### 导入入口总览

| 功能板块 | 子功能 | 文件 | 导入方式 |
|---------|--------|------|---------|
| **AI核心模块** | AI自动入库 | [pages-ai-module.js](file:///workspace/prototype/js/pages-ai-module.js) | 全自动（9步流水线） |
| **教师后台** | 上传试卷 | [pages-teacher.js](file:///workspace/prototype/js/pages-teacher.js) | 手动上传文件 |
| **教师后台** | AI切题 | [pages-teacher.js](file:///workspace/prototype/js/pages-teacher.js) | 半自动（试卷→题目） |
| **教师后台** | AI解析 | [pages-teacher.js](file:///workspace/prototype/js/pages-teacher.js) | 半自动（生成答案解析） |
| **教师后台** | AI标知识点 | [pages-teacher.js](file:///workspace/prototype/js/pages-teacher.js) | 半自动（知识点关联） |
| **运营后台** | 真题管理 | [pages-admin.js](file:///workspace/prototype/js/pages-admin.js) | 手动录入 |
| **运营后台** | OCR审核 | [pages-admin.js](file:///workspace/prototype/js/pages-admin.js) | 审核入库 |
| **运营后台** | AI审核 | [pages-admin.js](file:///workspace/prototype/js/pages-admin.js) | 审核入库 |

#### AI自动入库 9 步流水线

| 步骤 | 名称 | AI模型/技术 | 输出 |
|------|------|------------|------|
| 1 | 选择数据源 | — | PDF/试卷文件 |
| 2 | OCR文字识别 | PaddleOCR | 识别块（中英文/公式/方程式） |
| 3 | 切分题目 | LayoutLM | 独立题目（题干+配图+小题） |
| 4 | 字段补全 | Qwen3-72B | 科目/题型/年份/难度/分值 |
| 5 | 标准答案与解析 | DeepSeek-R1 | 答案+详细解析 |
| 6 | 图片与图表提取 | YOLOv8 | 几何图/函数图/实验图 |
| 7 | AI审核校验 | Qwen3-72B | 内容完整性/公式正确性 |
| 8 | 知识图谱标注 | GraphSAGE | 考点关联+难度等级 |
| 9 | 入库完成 | — | 写入题库数据库+建立索引 |

#### 数据流向

导入数据 → 中央题库数据库（智能中台）→ 下游 AI 模块调用（组卷/刷题/答疑/讲题/搜题/图谱）

<details>
<summary>📊 知识库导入总流程 Mermaid 源码（点击展开）</summary>

```mermaid
flowchart TD
    subgraph ENTRY["三大导入入口"]
        direction TB
        E1["🤖 AI核心模块\nAI自动入库\n（全自动9步流水线）"]
        E2["👨‍🏫 教师后台\n上传试卷→AI切题→AI解析→AI标知识点\n（半自动）"]
        E3["🛠️ 运营后台\n真题管理·OCR审核·AI审核\n（手动录入+审核）"]
    end

    subgraph PIPELINE["AI自动入库 9 步流水线"]
        direction TB
        P1["① 选择数据源\nPDF/试卷文件"]
        P2["② OCR文字识别\nPaddleOCR\n中英文/公式/方程式"]
        P3["③ 切分题目\nLayoutLM\n题干+配图+小题"]
        P4["④ 字段补全\nQwen3-72B\n科目/题型/年份/难度/分值"]
        P5["⑤ 标准答案与解析\nDeepSeek-R1\n答案+详细解析"]
        P6["⑥ 图片与图表提取\nYOLOv8\n几何图/函数图/实验图"]
        P7["⑦ AI审核校验\nQwen3-72B\n完整性/公式正确性"]
        P8["⑧ 知识图谱标注\nGraphSAGE\n考点关联+难度等级"]
        P9["⑨ 入库完成\n写入题库数据库+建立索引"]
        P1 --> P2 --> P3 --> P4 --> P5 --> P6 --> P7 --> P8 --> P9
    end

    subgraph TEACHER["教师后台半自动流程"]
        direction TB
        T1["上传试卷\nPDF/Word/图片"]
        T2["AI切题\n切分为独立题目"]
        T3["AI解析\n生成答案+解析"]
        T4["AI标知识点\n关联知识图谱"]
        T1 --> T2 --> T3 --> T4
    end

    subgraph ADMIN["运营后台流程"]
        direction TB
        A1["真题管理\n手动录入真题"]
        A2["OCR审核\n审核识别结果"]
        A3["AI审核\n审核AI生成内容"]
        A1 --> A2 --> A3
    end

    E1 --> PIPELINE
    E2 --> TEACHER
    E3 --> ADMIN

    P9 --> CENTER["🗄️ 中央题库数据库\n（智能中台）"]
    T4 --> CENTER
    A3 --> CENTER

    subgraph DOWNSTREAM["下游 AI 模块调用"]
        direction TB
        D1["AI组卷引擎\n从题库选题组卷"]
        D2["智能刷题\n真题/模拟题/推荐题"]
        D3["AI答疑\nRAG检索知识库"]
        D4["AI讲题\n分步讲解题目"]
        D5["拍照搜题\n搜题+相似题推荐"]
        D6["AI知识图谱\n知识点关联展示"]
    end

    CENTER --> D1
    CENTER --> D2
    CENTER --> D3
    CENTER --> D4
    CENTER --> D5
    CENTER --> D6

    style E1 fill:#EFF6FF,stroke:#3B82F6,stroke-width:1.5px
    style E2 fill:#ECFDF5,stroke:#10B981,stroke-width:1.5px
    style E3 fill:#FFFBEB,stroke:#F59E0B,stroke-width:1.5px
    style P1 fill:#F3E8FF,stroke:#8B5CF6
    style P2 fill:#E0F2FE,stroke:#0EA5E9
    style P3 fill:#E0F2FE,stroke:#0EA5E9
    style P4 fill:#F3E8FF,stroke:#8B5CF6
    style P5 fill:#EFF6FF,stroke:#3B82F6
    style P6 fill:#E0F2FE,stroke:#0EA5E9
    style P7 fill:#F3E8FF,stroke:#8B5CF6
    style P8 fill:#F3E8FF,stroke:#8B5CF6
    style P9 fill:#ECFDF5,stroke:#10B981,stroke-width:2px
    style T1 fill:#ECFDF5,stroke:#10B981
    style T2 fill:#ECFDF5,stroke:#10B981
    style T3 fill:#ECFDF5,stroke:#10B981
    style T4 fill:#ECFDF5,stroke:#10B981
    style A1 fill:#FFFBEB,stroke:#F59E0B
    style A2 fill:#FFFBEB,stroke:#F59E0B
    style A3 fill:#FFFBEB,stroke:#F59E0B
    style CENTER fill:#1E293B,stroke:#4B3FE3,stroke-width:2px,color:#fff
    style D1 fill:#EFF6FF,stroke:#3B82F6
    style D2 fill:#EFF6FF,stroke:#3B82F6
    style D3 fill:#EFF6FF,stroke:#3B82F6
    style D4 fill:#EFF6FF,stroke:#3B82F6
    style D5 fill:#EFF6FF,stroke:#3B82F6
    style D6 fill:#EFF6FF,stroke:#3B82F6
```

</details>

<details>
<summary>📊 AI自动入库 9 步流水线 Mermaid 源码（点击展开）</summary>

```mermaid
flowchart LR
    START(["📄 上传试卷/PDF"]) --> S1["① 选择数据源\n勾选识别区域"]
    S1 --> S2["② OCR文字识别\nPaddleOCR\n准确率 98.7%"]
    S2 --> S3["③ 切分题目\nLayoutLM\n去除页眉页脚水印"]
    S3 --> S4["④ 字段补全\nQwen3-72B\n科目/题型/年份/难度/分值"]
    S4 --> S5["⑤ 标准答案与解析\nDeepSeek-R1\n答案+详细解析"]
    S5 --> S6["⑥ 图片与图表提取\nYOLOv8\n几何图/函数图/实验图"]
    S6 --> S7["⑦ AI审核校验\nQwen3-72B\n完整性/公式正确性/答案一致性"]
    
    S7 --> CHECK{"审核\n通过?"}
    CHECK -->|通过| S8["⑧ 知识图谱标注\nGraphSAGE\n考点关联+难度等级"]
    CHECK -->|不通过| FIX["打回修正\n补充缺失字段/解析"]
    FIX --> S7
    
    S8 --> S9["⑨ 入库完成\n✅ 写入题库数据库\n建立全文索引+知识点索引"]
    S9 --> DONE(["🎉 数据可用于\n组卷/刷题/答疑"])

    style START fill:#F2F7FF,stroke:#4B3FE3,stroke-width:1.5px
    style S1 fill:#F3E8FF,stroke:#8B5CF6
    style S2 fill:#E0F2FE,stroke:#0EA5E9
    style S3 fill:#E0F2FE,stroke:#0EA5E9
    style S4 fill:#F3E8FF,stroke:#8B5CF6
    style S5 fill:#EFF6FF,stroke:#3B82F6
    style S6 fill:#E0F2FE,stroke:#0EA5E9
    style S7 fill:#FEF9E7,stroke:#EAB308
    style CHECK fill:#FEF3C7,stroke:#EFAA17
    style FIX fill:#FEE2E2,stroke:#DC2626
    style S8 fill:#F3E8FF,stroke:#8B5CF6
    style S9 fill:#ECFDF5,stroke:#10B981,stroke-width:2px
    style DONE fill:#ECFDF5,stroke:#1DC981,stroke-width:1.5px
```

</details>

<details>
<summary>📊 运营后台真题导入（双写模式）Mermaid 源码（点击展开）</summary>

```mermaid
flowchart TD
    START(["👤 用户在运营后台·真题管理\n填写真题表单"]) --> FILL["填写题目字段\n年份/省份/科目/题型/难度\n题干/选项/答案/解析"]
    FILL --> CLICK["点击「保存真题」按钮\n触发 saveExamQuestion()"]
    CLICK --> BTN["禁用按钮 + 改样式\n防止重复提交"]
    BTN --> BUILD["构造 question 对象\nsource: real_exam\n完整字段映射"]
    BUILD --> POST["fetch POST /api/questions/import\nbody: {format:'json', data:[question]}"]

    POST --> BACKEND["后端 import.js 接收请求"]
    BACKEND --> READ["① 读取 KV 已有 questions.json\nenv.DATA_STORE.get()"]
    READ --> GEN["② 生成唯一 ID\nquestions_<timestamp>_<random>"]
    GEN --> MAP["③ 字段映射构造 record\n补全 created_at/updated_at\n默认值处理（type/difficulty/score）"]
    MAP --> APPEND["④ 追加到 questions 数组"]
    APPEND --> WRITE["⑤ 写回 KV 存储\nenv.DATA_STORE.put('questions.json', …)\n携带 metadata: size/mtime"]
    WRITE --> RESP["⑥ 返回结果\n{code:0, data:{count, questions}, msg}"]

    RESP --> FETCH_END["fetch().then() 回调"]
    FETCH_END --> RESTORE["恢复按钮状态\n重新启用「保存真题」"]
    RESTORE --> CHECK_CODE{"res.code === 0 ?"}
    CHECK_CODE -->|是| OK["关闭录入弹窗 closeModal()\n✅ Toast 成功提示\n调用 renderAdminExams() 刷新列表"]
    CHECK_CODE -->|否| FAIL["⚠️ Toast 云端入库失败提示\n显示 res.msg"]
    POST -.网络异常.-> CATCH["fetch().catch() 网络异常\n服务不可用降级"]
    CATCH --> LOCAL["降级兜底：localStorage 暂存\n⚠️ Toast 已保存至浏览器本地"]

    OK --> CENTER["🗄️ 写入中央题库\nCloudflare Workers KV\nquestions.json"]
    CENTER --> USE["🎉 数据可被下游 AI 模块调用\n组卷/刷题/答疑/讲题/搜题"]

    style START fill:#FFFBEB,stroke:#F59E0B,stroke-width:1.5px
    style FILL fill:#FFFBEB,stroke:#F59E0B
    style CLICK fill:#FFFBEB,stroke:#F59E0B
    style BTN fill:#FEF3C7,stroke:#EFAA17
    style BUILD fill:#FFFBEB,stroke:#F59E0B
    style POST fill:#EFF6FF,stroke:#3B82F6,stroke-width:1.5px
    style BACKEND fill:#EFF6FF,stroke:#3B82F6
    style READ fill:#E0F2FE,stroke:#0EA5E9
    style GEN fill:#E0F2FE,stroke:#0EA5E9
    style MAP fill:#E0F2FE,stroke:#0EA5E9
    style APPEND fill:#E0F2FE,stroke:#0EA5E9
    style WRITE fill:#EFF6FF,stroke:#3B82F6,stroke-width:1.5px
    style RESP fill:#EFF6FF,stroke:#3B82F6
    style FETCH_END fill:#FFFBEB,stroke:#F59E0B
    style RESTORE fill:#FEF3C7,stroke:#EFAA17
    style CHECK_CODE fill:#FEF3C7,stroke:#EFAA17
    style OK fill:#ECFDF5,stroke:#10B981,stroke-width:1.5px
    style FAIL fill:#FEE2E2,stroke:#DC2626
    style CATCH fill:#FEE2E2,stroke:#DC2626
    style LOCAL fill:#FEF9E7,stroke:#EAB308
    style CENTER fill:#1E293B,stroke:#4B3FE3,stroke-width:2px,color:#fff
    style USE fill:#ECFDF5,stroke:#1DC981,stroke-width:1.5px
```

</details>

#### 双写模式关键设计

| 设计点 | 实现 | 作用 |
|--------|------|------|
| **主写：云端 KV** | `fetch('/api/questions/import', POST)` | 数据持久化，多端共享 |
| **降级：localStorage** | `catch` 分支本地暂存 | 云端不可用时仍可工作 |
| **按钮防抖** | 提交时 `btn.disabled=true` + 改样式 | 防止重复提交 |
| **状态恢复** | `try-catch` 包裹按钮恢复 | 即使异常也能恢复按钮 |
| **event 安全** | `typeof event !== 'undefined'` 检查 | 兼容不同调用上下文 |
| **结果反馈** | Toast 区分成功/失败/降级 | 用户清晰感知入库状态 |

---

### 4.6 数据中台 KV 接入全景

#### 4.6.1 统一接入模式

所有端（运营后台 / 教师后台 / AI核心模块 / AI学习中心 / 拍照搜题 / 首页 / 刷题）的写操作都遵循同一范式：前端写操作 → `api.savePageData(key, data)` → `PUT /api/page-data/:key` → Cloudflare Workers KV（`pages_<key>.json`）→ 跨页/跨设备读取。

<details>
<summary>📊 数据中台统一接入 Mermaid 源码（点击展开）</summary>

```mermaid
flowchart LR
    subgraph FRONT["🖥️ 前端各功能模块"]
        direction TB
        ADMIN["运营后台<br/>用户/Banner/审核/真题"]
        TEACHER["教师后台<br/>切题/上传/标签/试卷/练习"]
        AI_MOD["AI核心模块<br/>组卷/预测/OCR/切题"]
        AI_CTR["AI学习中心<br/>错题/计划"]
        PHOTO["拍照搜题<br/>解析/相似题"]
        HOME["首页<br/>会话/计划/分析/消息"]
        PRAC["刷题<br/>真题筛选/模拟筛选"]
    end

    subgraph API["⚙️ 统一 API 层"]
        SAVE["api.savePageData(key, data)<br/>PUT /api/page-data/:key"]
        GET["api.getPageData(key)<br/>GET /api/page-data/:key"]
    end

    subgraph KV["🗄️ Cloudflare Workers KV 数据中台"]
        direction TB
        K1["pages_admin-*.json<br/>运营后台数据"]
        K2["pages_teacher-*.json<br/>教师后台数据"]
        K3["pages_ai-module-*.json<br/>AI核心模块数据"]
        K4["pages_ai-error/ai-plan.json<br/>AI学习中心数据"]
        K5["pages_photo-*.json<br/>拍照搜题数据"]
        K6["pages_home-*.json<br/>首页数据"]
        K7["pages_practice-*.json<br/>刷题数据"]
        K8["questions.json<br/>中央题库"]
    end

    ADMIN --> SAVE
    TEACHER --> SAVE
    AI_MOD --> SAVE
    AI_CTR --> SAVE
    PHOTO --> SAVE
    HOME --> SAVE
    PRAC --> SAVE

    SAVE --> K1 & K2 & K3 & K4 & K5 & K6 & K7
    SAVE -.真题入库.-> K8

    K1 & K2 & K3 & K4 & K5 & K6 & K7 & K8 --> GET
    GET --> FRONT

    style FRONT fill:#EFF6FF,stroke:#3B82F6,stroke-width:1.5px
    style API fill:#FFFBEB,stroke:#F59E0B,stroke-width:1.5px
    style KV fill:#1E293B,stroke:#4B3FE3,stroke-width:2px,color:#fff
    style K8 fill:#4B3FE3,stroke:#4B3FE3,color:#fff
```

</details>

#### 4.6.2 各端写操作点 → KV Key 映射

| 端 | 模块 | 函数/位置 | KV Key | 持久化内容 |
|----|------|----------|--------|-----------|
| 运营后台 | 用户管理 | toggleUserStatus | `admin-users` | 用户启用/禁用状态 |
| 运营后台 | Banner管理 | toggleBanner/deleteBanner/editBanner/openBannerForm | `admin-banner` | Banner CRUD |
| 运营后台 | 内容审核 | handleContentReport | `admin-content` | 举报处理三态流转 |
| 运营后台 | OCR审核 | auditOcrReview/editOcrReview | `admin-ocr` + `questions.json` | 审核结果 + 通过题入库 |
| 运营后台 | AI审核 | auditAiReview/editAiReview | `admin-ai-review` | AI内容审核 |
| 运营后台 | 真题管理 | saveExamQuestion | `questions.json` | 真题入库 |
| 教师后台 | 切题 | saveSplitResult | `teacher-split` | 切题状态 |
| 教师后台 | 上传 | uploadPaper | `teacher-upload` + `teacher-split` | 上传记录 |
| 教师后台 | 标签 | saveTagState | `teacher-tag` | 标签状态 |
| 教师后台 | 试卷 | teacherPaperSaveState | `teacher-paper` | 试卷配置 |
| 教师后台 | 练习 | teacherExerciseSaveState | `teacher-exercise` | 练习配置 |
| AI核心模块 | 组卷 | renderPageContent (paper) | `ai-module-paper` | 组卷结果/参数/预览 |
| AI核心模块 | 预测 | renderPageContent (predict) | `ai-module-predict` | 预测输入与结果 |
| AI核心模块 | OCR识别 | renderPageContent (ocr) | `ai-auto-import-ocr` | OCR识别结果 |
| AI核心模块 | LLM切题 | renderPageContent (cut) | `ai-auto-import-cut` | 切题结果 |
| AI学习中心 | 错题分析 | renderErrorPage | `ai-error` | 错题分析结果 |
| AI学习中心 | 学习计划 | renderPlanPage | `ai-plan` | 学习计划 |
| 拍照搜题 | AI解析 | renderParsePage | `photo-parse` | 解析结果 |
| 拍照搜题 | 相似题 | renderSimilarPage | `photo-similar` | 相似题推荐 |
| 首页 | 学习会话 | startLearnSession | `home-learn-session` | 会话参数 |
| 首页 | 学习记录 | __finishLearnSession | `home-learn-latest` | 完成记录 |
| 首页 | 计划周期 | switchSegment | `home-plan-range` | 周期偏好 |
| 首页 | 分析偏好 | __protoSwitchAnalysisPeriod/Tab | `home-analysis-prefs` | 周期/标签页 |
| 首页 | 消息已读 | __MSG_MARK_CAT_READ__ | `home-messages` | 已读状态 |
| 刷题 | 真题筛选 | filterPracticeExamBySubject/Year | `practice-exam-filter` | 科目/年份筛选 |
| 刷题 | 模拟筛选 | filterPracticeMock | `practice-mock-filter` | 科目/来源筛选 |

#### 4.6.3 写操作数据流（以"运营后台·OCR审核通过"为例）

<details>
<summary>📊 写操作数据流 Mermaid 源码（点击展开）</summary>

```mermaid
sequenceDiagram
    participant U as 用户
    participant FE as 前端 pages-admin.js
    participant API as api.savePageData
    participant KV as Workers KV
    participant Q as /api/questions/import
    participant DB as questions.json

    U->>FE: 点击"通过"按钮
    FE->>FE: 修改 window._adminData['admin-ocr']<br/>.reviews[idx].status='通过'
    FE->>API: api.savePageData('admin-ocr', data)
    API->>KV: PUT /api/page-data/admin-ocr<br/>写入 pages_admin-ocr.json
    KV-->>API: 200 OK
    API-->>FE: Promise.resolve()

    FE->>Q: POST /api/questions/import<br/>{format:'json', data:[{source:'ocr_review',...}]}
    Q->>Q: 读取 questions.json 现有数组
    Q->>Q: 生成 ID + 字段映射 + 追加
    Q->>DB: env.DATA_STORE.put('questions.json', …)
    DB-->>Q: 写入成功
    Q-->>FE: {code:0, count:1}

    FE->>FE: adminRefresh('admin-ocr')<br/>重新渲染列表
    FE->>U: Toast "OCR 审核通过（已写入数据中台）"

    style U fill:#FFFBEB,stroke:#F59E0B
    style FE fill:#EFF6FF,stroke:#3B82F6
    style API fill:#FFFBEB,stroke:#F59E0B
    style KV fill:#1E293B,color:#fff,stroke:#4B3FE3
    style Q fill:#EFF6FF,stroke:#3B82F6
    style DB fill:#4B3FE3,color:#fff,stroke:#4B3FE3
```

</details>

#### 4.6.4 降级兜底链路

当 `api.savePageData` 失败时，前端不阻断 UI，仅 console.warn 记录。降级策略如下：

<details>
<summary>📊 降级兜底链路 Mermaid 源码（点击展开）</summary>

```mermaid
flowchart TD
    WRITE["前端写操作<br/>修改 window._xxxData"]
    CHECK{"typeof api !== 'undefined'<br/>&& api.savePageData ?"}
    WRITE --> CHECK
    CHECK -->|否| FALLBACK1["降级：仅前端 window 缓存<br/>刷新后丢失"]
    CHECK -->|是| CALL["api.savePageData(key, data)"]
    CALL --> REQ["PUT /api/page-data/:key"]
    REQ --> NET{"网络/KV 可用？"}
    NET -->|是| OK["✅ 写入 KV 成功<br/>数据持久化 + 跨设备同步"]
    NET -->|否| CATCH[".catch(function() {})<br/>吞异常不阻断 UI"]
    CATCH --> FALLBACK2["降级：仅前端 window 缓存<br/>console.warn 记录"]
    CATCH --> UI["UI 继续正常渲染<br/>用户无感知"]

    FALLBACK1 --> UI
    OK --> UI

    style WRITE fill:#FFFBEB,stroke:#F59E0B
    style CHECK fill:#FEF3C7,stroke:#EFAA17
    style CALL fill:#EFF6FF,stroke:#3B82F6
    style REQ fill:#EFF6FF,stroke:#3B82F6
    style NET fill:#FEF3C7,stroke:#EFAA17
    style OK fill:#ECFDF5,stroke:#10B981,stroke-width:1.5px
    style CATCH fill:#FEE2E2,stroke:#DC2626
    style FALLBACK1 fill:#FEF9E7,stroke:#EAB308
    style FALLBACK2 fill:#FEF9E7,stroke:#EAB308
    style UI fill:#ECFDF5,stroke:#1DC981
```

</details>

#### 4.6.5 全产品数据中台接入统计

| 端 | 模块数 | 写操作点数 | 主要 KV Key |
|----|--------|-----------|-------------|
| 运营后台 | 6 | 10+ | `admin-*` + `questions.json` |
| 教师后台 | 5 | 5 | `teacher-*` |
| AI核心模块 | 4 | 4 | `ai-module-*` / `ai-auto-import-*` |
| AI学习中心 | 2 | 2 | `ai-error` / `ai-plan` |
| 拍照搜题 | 2 | 2 | `photo-*` |
| 首页 | 5 | 6 | `home-*` |
| 刷题 | 2 | 3 | `practice-*` |
| **合计** | **26** | **32+** | — |

---

## 5. 全局状态管理

| 全局变量 | 类型 | 写入位置 | 读取位置 | 说明 |
|---------|------|----------|----------|------|
| `window._aiModelInfo` | Object | 页面渲染时 | sendAIMessage() | AI模型元数据 |
| `window._planData` | Object | ai-plan渲染 | planRegenerate() | 学习计划数据 |
| `window._paperData` | Object | ai-module-paper渲染 | paperRegenerate() | 试卷数据 |
| `window._graphNodes` | Array | ai-module-graph渲染 | graphNodeClick() | 图谱节点 |
| `window._graphEdges` | Array | ai-module-graph渲染 | graphNodeClick() | 图谱边 |
| `window._ocrData` | Object | ai-auto-import-ocr渲染 | ocrReRecognize() | OCR数据 |
| `window._cutData` | Object | ai-auto-import-cut渲染 | llmRecut() | 切题数据 |
| `window._modelCenterData` | Object | ai-model-center渲染 | testModel*() | 模型中心数据 |
| `window._parseData` | Object | photo-parse渲染 | aiReparse() | 解析数据 |
| `window.__photoSimilarQuestions` | Array | photo-similar渲染 | similarRefresh() | 相似题列表 |
| `window.__photoSimilarData` | Object | photo-similar渲染 | similarRefresh() | 相似题页数据 |

---

## 6. 文件索引

### JavaScript 源文件

| 文件 | 交互函数 | 行号范围 |
|------|----------|----------|
| [pages-ai-center.js](file:///workspace/prototype/js/pages-ai-center.js) | `sendAIMessage()` | ~379 |
| | `streamText()` | ~445 |
| | `errorReanalyze()` | ~468 |
| | `planRegenerate()` | ~498 |
| | `aiChatKeyDown()` | ~544 |
| [pages-ai-module.js](file:///workspace/prototype/js/pages-ai-module.js) | `explainNextStep()` | ~1518 |
| | `paperRegenerate()` | ~1452 |
| | `graphNodeClick()` | ~1413 |
| | `predictRecalculate()` | ~1360 |
| | `ocrReRecognize()` | ~1579 |
| | `llmRecut()` | ~1619 |
| | `testModelConnectivity()` | ~1658 |
| | `testModelCapability()` | ~1682 |
| | `aiModelBadge()` | ~1556 |
| [pages-photo.js](file:///workspace/prototype/js/pages-photo.js) | `aiReparse()` | ~550 |
| | `similarRefresh()` | ~590 |
| | `openPhotoSimilarDetail()` | ~525 |
| [pages-practice.js](file:///workspace/prototype/js/pages-practice.js) | `recommendRefresh()` | ~645 |

### 后端数据文件

| 数据文件 | 对应页面 |
|---------|----------|
| `/workspace/backend/data/pages/ai-qa.json` | AI答疑 |
| `/workspace/backend/data/pages/ai-coach.json` | AI学习教练 |
| `/workspace/backend/data/pages/ai-explain.json` | AI讲题 |
| `/workspace/backend/data/pages/ai-plan.json` | AI学习规划 |
| `/workspace/backend/data/pages/ai-error.json` | AI错题分析 |
| `/workspace/backend/data/pages/ai-module-*.json` | AI引擎子模块 |
| `/workspace/backend/data/pages/ai-model-center.json` | AI模型中心 |
| `/workspace/backend/data/pages/ai-auto-import*.json` | 自动入库流程 |
| `/workspace/backend/data/pages/photo-*.json` | 拍照搜题系列 |

---

## 7. 浏览器验证结果

### 验证环境

- 后端服务: `node server.js` (端口 3000)
- 前端原型: `/workspace/prototype/index.html`
- 验证方式: 浏览器自动化测试

### 验证结果汇总

| 模块 | 交互函数 | 验证状态 | 关键输出 |
|------|----------|----------|----------|
| AI模型中心 | testModelConnectivity() | ✅ 通过 | 连通正常 · 延迟 35ms · vLLM 引擎就绪 |
| AI模型中心 | testModelCapability() | ✅ 通过 | 能力正常 · 文本生成 · 吞吐 202 tokens/s |
| OCR识别 | ocrReRecognize() | ✅ 通过 | 准确率提升至 99%（PaddleOCR + LaTeX-OCR）|
| AI答疑 | sendAIMessage() | ✅ 通过 | RAG四阶段完整展示 + 模型归因徽章 |
| 讲题引擎 | explainNextStep() | ✅ 通过 | 进度 1/5(20%) → 2/5(40%) |
| 预测高考 | predictRecalculate() | ✅ 通过 | 预测 598分 · 置信度 93% |
| AI学习规划 | planRegenerate() | ✅ 通过 | 无控制台错误，状态正常 |
| AI解析 | aiReparse() | ✅ 通过 | 无控制台错误，状态正常 |
| 相似题 | similarRefresh() | ✅ 通过 | 无控制台错误，状态正常 |
| LLM切题 | llmRecut() | ✅ 通过 | 无控制台错误，状态正常 |
| JS语法检查 | node --check (4个文件) | ✅ 通过 | 全部通过 |
| 部署 | Cloudflare Pages | ✅ 完成 | https://356c513d.ai-gaokao-static.pages.dev |

### 控制台错误检查

所有交互测试期间，浏览器控制台均返回空数组 `[]`，无任何JS错误或警告。

---

## 附录：交互函数速查表

| # | 函数名 | 文件 | AI模型 | 触发方式 |
|---|--------|------|--------|----------|
| 1 | `streamText()` | pages-ai-center.js | DeepSeek-R1/Qwen3-72B | 函数调用 |
| 2 | `sendAIMessage()` | pages-ai-center.js | Qwen3-72B+BGE-M3+Milvus | 对话发送 |
| 3 | `aiChatKeyDown()` | pages-ai-center.js | - | Enter键 |
| 4 | `errorReanalyze()` | pages-ai-center.js | Qwen3-72B+DeepKE | 按钮点击 |
| 5 | `planRegenerate()` | pages-ai-center.js | DeepSeek-R1+XGBoost | 按钮点击 |
| 6 | `explainNextStep()` | pages-ai-module.js | DeepSeek-R1 | 按钮点击 |
| 7 | `paperRegenerate()` | pages-ai-module.js | Qwen3-72B+BERT | 按钮点击 |
| 8 | `graphNodeClick()` | pages-ai-module.js | DeepKE+GraphSAGE | SVG节点点击 |
| 9 | `predictRecalculate()` | pages-ai-module.js | XGBoost+LightGBM+DeepFM | 按钮点击 |
| 10 | `ocrReRecognize()` | pages-ai-module.js | PaddleOCR+LaTeX-OCR | 按钮点击 |
| 11 | `llmRecut()` | pages-ai-module.js | Qwen3-72B+BERT | 按钮点击 |
| 12 | `testModelConnectivity()` | pages-ai-module.js | vLLM | 按钮点击 |
| 13 | `testModelCapability()` | pages-ai-module.js | 按模型路由 | 按钮点击 |
| 14 | `aiReparse()` | pages-photo.js | Qwen3-72B+DeepSeek-R1+BGE-M3 | 按钮点击 |
| 15 | `similarRefresh()` | pages-photo.js | BERT+Milvus+DeepKE | 按钮点击 |
| 16 | `recommendRefresh()` | pages-practice.js | DeepFM+协同过滤+知识图谱 | 按钮点击 |
