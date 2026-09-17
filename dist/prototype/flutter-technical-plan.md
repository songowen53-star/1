# AI高考 App — Flutter 技术方案

> 版本：v1.0
> 适用范围：AI高考 App 多端（Android / iOS / iPad / Web）客户端
> 编写日期：2026-07
> 维护团队：AI高考 App 客户端组

---

## 目录

- [一、技术选型](#一技术选型)
- [二、项目架构](#二项目架构)
- [三、核心模块技术方案](#三核心模块技术方案)
- [四、后端架构对接](#四后端架构对接)
- [五、AI自动入库流程技术方案](#五ai自动入库流程技术方案)
- [六、性能优化](#六性能优化)
- [七、CI/CD](#七cicd)
- [八、开发计划](#八开发计划)

---

## 一、技术选型

### 1.1 总体技术栈

| 维度 | 选型 | 版本 | 说明 |
| --- | --- | --- | --- |
| 框架 | Flutter | 3.x（≥3.22） | 一套代码覆盖 Android / iOS / iPad / Web |
| 语言 | Dart | 3.x（≥3.4） | 支持 record、pattern matching、null safety |
| 状态管理 | Riverpod | 2.x | 编译期安全、可测试、与代码生成配合 |
| 网络请求 | Dio | 5.x | 拦截器、CancelToken、FormData、流式响应 |
| 本地存储 KV | Hive | 2.x | 轻量、纯 Dart、高性能 |
| 本地存储 DB | drift | 2.x | 类型安全 SQLite ORM，支持响应式查询 |
| 路由 | go_router | 14.x | 声明式路由，支持深链与 Web URL |
| 图表 | fl_chart | 0.68+ | 雷达图、折线图、柱状图 |
| 相机 | camera | 0.11+ | 官方维护，跨端 |
| OCR | google_mlkit_text_recognition | 0.14+ | 离线 OCR，支持中文 |
| 公式渲染 | flutter_math_fork | 0.7+ | 渲染 LaTeX 公式 |
| 图片裁剪 | image_cropper | 8.0+ | 拍照搜题裁剪 |
| 图片加载 | cached_network_image | 3.4+ | 缓存 + 占位图 |
| 推送（海外） | firebase_messaging | 15.x | FCM |
| 推送（国内） | 极光推送 jpush_flutter | 3.x | 国内厂商通道兜底 |
| 后台任务 | workmanager | 0.5+ | 每日自动分析、本地通知 |
| 本地通知 | flutter_local_notifications | 17.x | 配合 workmanager |
| 国际化 | flutter_localizations + intl | — | 中英文 |
| 依赖注入 | Riverpod Provider | — | 与状态管理统一 |
| 代码生成 | build_runner + freezed + riverpod_generator + json_serializable + drift_dev | — | 减少样板代码 |

### 1.2 状态管理选型：Riverpod vs Bloc vs Provider

| 维度 | Riverpod | Bloc | Provider |
| --- | --- | --- | --- |
| 学习曲线 | 中等 | 偏高（需理解 Stream/事件） | 低 |
| 编译期安全 | ✅ 强（ref.read/watch 类型推断） | ⚠️ 中（依赖事件类） | ❌ 弱（运行时 InheritedWidget） |
| 样板代码 | 少（代码生成） | 多（State/Event/Bloc 三件套） | 少 |
| 可测试性 | 强（ProviderContainer override） | 强 | 弱 |
| 异步流支持 | ✅ AsyncValue 原生 | ✅ Stream 原生 | ⚠️ 需 FutureBuilder 拼接 |
| Web 适配 | ✅ | ✅ | ⚠️ |
| 社区活跃度 | 高且增长快 | 高 | 维护减弱 |

**结论**：选用 **Riverpod**。理由：

1. AI 高考 App 涉及大量异步（WebSocket、LLM 流式、OCR）→ `AsyncValue` 原生支持 loading/error/data 三态，减少手写状态机。
2. 与 `freezed` + `riverpod_generator` 配合可消除样板代码，编译期捕获错误。
3. 全局 `ProviderScope` + `override` 机制便于单元测试与 Widget 测试。
4. Web 端兼容良好，无需为多端额外迁移。

### 1.3 多端覆盖策略

一套 Dart 代码库覆盖 Android / iOS / iPad / Web，差异通过以下手段收敛：

- **响应式布局**：基于 `LayoutBuilder` + 断点（手机 < 600dp / 平板 600–840dp / 桌面 > 840dp），同一 Widget 在不同尺寸下自适应栅格列数。
- **平台条件代码**：通过 `defaultTargetPlatform` / `kIsWeb` 做最小化的平台分支（如推送通道、支付 SDK）。
- **平台特性插件隔离**：将厂商 SDK（极光、微信支付）封装在 `data/datasources/remote/` 下，对外暴露统一抽象接口，业务层不感知平台差异。
- **iPad 适配**：开启 `MaterialApp.router` 的 `useInheritedMediaQuery`，使用 `split view` / `master-detail` 布局，适配 sizeClass。
- **Web 适配**：禁用移动端独有手势冲突 API，使用 `ScrollConfiguration` 统一滚动行为，URL 通过 `go_router` 的 path 参数保持可分享。

---

## 二、项目架构

### 2.1 分层架构

采用 **Clean Architecture 分层**，自上而下：`Presentation → Domain → Data`，依赖方向单向向下。

```
┌────────────────────────────────────────────┐
│  Presentation (UI + 状态)                   │
│  Widgets / Pages / Riverpod Notifier        │
└──────────────────┬─────────────────────────┘
                   │ 依赖 Domain（接口）
┌──────────────────▼─────────────────────────┐
│  Domain (业务核心，纯 Dart)                  │
│  Entities / UseCases / Repository 接口      │
└──────────────────┬─────────────────────────┘
                   │ 依赖接口，实现由 Data 注入
┌──────────────────▼─────────────────────────┐
│  Data (实现层)                              │
│  Repositories / Datasources (Remote/Local)  │
└────────────────────────────────────────────┘
```

分层原则：

- **Domain 层不依赖 Flutter、不依赖 Riverpod**，可独立测试。
- **Presentation 通过 Riverpod `Provider` 注入 UseCase**，UI 只感知状态，不直接调用网络。
- **Data 层实现 Domain 暴露的 Repository 接口**，便于 Mock 测试。

### 2.2 目录结构设计

```
lib/
├── main.dart                          # 入口：初始化 ProviderScope、 runApp
├── app.dart                           # MaterialApp.router 配置
├── core/                              # 全局基础设施（与业务无关）
│   ├── config/
│   │   ├── env_config.dart            # 环境配置 (dev/staging/prod)
│   │   └── app_constants.dart         # 常量
│   ├── error/
│   │   ├── app_exception.dart         # 统一异常基类
│   │   ├── error_handler.dart         # 全局错误处理
│   │   └── failures.dart              # 业务失败模型
│   ├── network/
│   │   ├── dio_client.dart            # Dio 单例 + 拦截器
│   │   ├── api_interceptors.dart      # Auth / Log / Retry / Error 拦截器
│   │   ├── api_endpoints.dart         # 接口地址常量
│   │   └── ws_client.dart             # WebSocket 流式客户端
│   ├── storage/
│   │   ├── hive_setup.dart            # Hive 初始化 + Box 注册
│   │   ├── drift_db.dart              # drift 数据库定义
│   │   └── secure_storage.dart        # 敏感字段（token）flutter_secure_storage
│   ├── router/
│   │   ├── app_router.dart            # go_router 配置
│   │   ├── route_guards.dart          # 鉴权守卫
│   │   └── routes.dart                # 路由路径常量
│   ├── theme/
│   │   ├── app_theme.dart             # 主题（亮/暗）
│   │   ├── app_colors.dart
│   │   ├── app_text_styles.dart
│   │   └── app_dimensions.dart
│   ├── utils/
│   │   ├── date_utils.dart
│   │   ├── validator.dart
│   │   └── logger.dart
│   └── widgets/                       # 全局通用组件
│       ├── loading_indicator.dart
│       ├── error_view.dart
│       ├── empty_view.dart
│       └── async_value_widget.dart    # AsyncValue 通用包装
│
├── features/                          # 按业务特性分模块
│   ├── auth/                          # 登录注册
│   │   ├── data/
│   │   │   ├── datasources/
│   │   │   │   ├── auth_remote_datasource.dart
│   │   │   │   └── auth_local_datasource.dart
│   │   │   ├── models/
│   │   │   │   ├── login_request.dart
│   │   │   │   └── user_dto.dart
│   │   │   └── repositories/
│   │   │       └── auth_repository_impl.dart
│   │   ├── domain/
│   │   │   ├── entities/
│   │   │   │   └── user.dart
│   │   │   ├── repositories/
│   │   │   │   └── auth_repository.dart
│   │   │   └── usecases/
│   │   │       ├── login_usecase.dart
│   │   │       └── logout_usecase.dart
│   │   └── presentation/
│   │       ├── providers/
│   │       │   ├── auth_provider.dart
│   │       │   └── auth_state.dart
│   │       ├── pages/
│   │       │   ├── login_page.dart
│   │       │   └── register_page.dart
│   │       └── widgets/
│   │           └── social_login_button.dart
│   │
│   ├── ai_coach/                      # 3.1 AI学习教练
│   ├── ai_explainer/                  # 3.2 AI讲题引擎
│   ├── paper_generator/               # 3.3 AI智能组卷
│   ├── photo_search/                  # 3.4 拍照搜题
│   ├── knowledge_graph/               # 3.5 AI知识图谱
│   ├── gaokao_predict/                # 3.6 AI高考预测
│   ├── practice/                      # 刷题
│   ├── home/                          # 首页
│   ├── profile/                       # 个人中心
│   ├── score/                         # 成绩分析
│   ├── college/                       # 志愿填报
│   └── admin/                         # 运营/教师后台入口
│
├── shared/                            # 跨 feature 复用
│   ├── models/                        # 通用 DTO（分页、统一响应）
│   └── widgets/
│       ├── question_card.dart
│       ├── answer_sheet.dart
│       └── latex_renderer.dart
│
└── l10n/                              # 国际化
    ├── app_localizations.dart
    ├── app_zh.arb
    └── app_en.arb

test/                                  # 单元测试
integration_test/                      # 集成测试
assets/                                # 图片/字体/Lottie
  ├── images/
  ├── icons/
  └── lottie/
```

### 2.3 依赖注入方案（Riverpod Provider）

Riverpod 既负责状态管理，也承担依赖注入职责。原则：**接口在 Domain，实现在 Data，通过 Provider 注入**。

```dart
// domain/repositories/auth_repository.dart
abstract interface class AuthRepository {
  Future<User> login(LoginRequest req);
  Future<void> logout();
  User? get currentUser;
}

// data/repositories/auth_repository_impl.dart
class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl(this._remote, this._local, this._secure);
  final AuthRemoteDatasource _remote;
  final AuthLocalDatasource _local;
  final SecureStorage _secure;
  // ...
}

// presentation/providers/auth_provider.dart
@riverpod
AuthRemoteDatasource authRemoteDatasource(AuthRemoteDatasourceRef ref) {
  return AuthRemoteDatasource(ref.watch(dioClientProvider));
}

@riverpod
AuthRepository authRepository(AuthRepositoryRef ref) {
  return AuthRepositoryImpl(
    ref.watch(authRemoteDatasourceProvider),
    ref.watch(authLocalDatasourceProvider),
    ref.watch(secureStorageProvider),
  );
}

@riverpod
class AuthController extends _$AuthController {
  @override
  Future<AuthState> build() async { /* ... */ }
  Future<void> login(String username, String password) async { /* ... */ }
}
```

注入分层约定：

| 层 | Provider 类型 | 说明 |
| --- | --- | --- |
| 基础设施 | `Provider` | DioClient / HiveBox / DriftDb / SecureStorage |
| DataSource | `Provider` | Remote / Local |
| Repository | `Provider` | 实现 Domain 接口 |
| UseCase | `Provider` | 单一职责，可被多个 Controller 复用 |
| Controller | `AsyncNotifier / Notifier` | 持有 UI 状态 |

测试时通过 `ProviderScope(overrides: [...])` 替换 Repository 为 Mock。

### 2.4 错误处理统一方案

#### 2.4.1 异常分类

```dart
sealed class AppException implements Exception {
  final String message;
  final String? code;
  const AppException(this.message, {this.code});
}

class NetworkException extends AppException { ... }       // 网络层
class ServerException extends AppException { ... }        // HTTP 5xx / 业务码错误
class UnauthorizedException extends AppException { ... }  // 401，跳登录
class NotFoundException extends AppException { ... }      // 404
class ValidationException extends AppException { ... }    // 参数校验
class StorageException extends AppException { ... }       // 本地存储
class BusinessException extends AppException { ... }      // 业务规则失败
```

#### 2.4.2 处理链路

```
Dio Response
   │ (ErrorInterceptor 拦截)
   ▼
ServerException / NetworkException
   │ (Repository catch → 转 Failure)
   ▼
Failure (业务语义)
   │ (UseCase 透传)
   ▼
AsyncValue.error(failure)
   │ (AsyncValueWidget 统一渲染)
   ▼
ErrorView（含重试按钮）
```

- **Dio 拦截器**统一捕获 HTTP 错误 → 转 `AppException`，401 自动刷新 token 失败后发送全局登出事件。
- **Repository** 用 `Either<Failure, T>`（或直接抛 `AppException`）向上传递，避免网络细节泄漏到 Domain。
- **全局错误兜底**：在 `main.dart` 中包裹 `runZonedGuarded` + `FlutterError.onError`，将未捕获错误上报到 Sentry / 自建埋点。
- **UI 层**统一使用 `AsyncValueWidget<T>`：根据 `AsyncValue` 状态自动渲染 loading / error / data，error 状态带「重试」回调。

---

## 三、核心模块技术方案

### 3.1 AI学习教练

#### 3.1.1 对话式 UI 实现

- 使用 `CustomScrollView` + `SliverList` 构建聊天流，支持混合消息类型（文本 / 公式 / 卡片 / 图表）。
- 每条消息为独立 `Widget`，依据 `messageType` 通过工厂分发，避免巨型 `if-else`。
- 输入区使用 `SafeArea` + `Padding`，监听 `MediaQuery.viewInsets.bottom` 跟随键盘上推。
- 滚动到底部：`ScrollController.animateTo(maxScrollExtent)`，新增消息时触发。

```dart
class ChatPage extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final messages = ref.watch(chatMessagesProvider);
    return Scaffold(
      body: CustomScrollView(
        controller: _scrollController,
        slivers: [
          const SliverToBoxAdapter(child: CoachHeader()),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (ctx, i) => MessageBubble(message: messages[i]),
              childCount: messages.length,
            ),
          ),
        ],
      ),
      bottomNavigationBar: const ChatInputBar(),
    );
  }
}
```

#### 3.1.2 WebSocket 流式消息接收

- 封装 `WsClient`（基于 `web_socket_channel`），统一管理连接、心跳、断线重连、订阅。
- LLM 回复采用 **流式接收**：服务端按 token 推送，客户端增量追加到当前消息 bubble，模拟打字机效果。
- 状态机：`idle → connecting → streaming → done / error`，使用 `StreamController<MessageChunk>` 暴露给 Riverpod。

```dart
class ChatController extends _$ChatController {
  @override
  FutureOr<List<ChatMessage>> build() => [];

  Future<void> send(String text) async {
    final userMsg = ChatMessage.user(text);
    state = AsyncData([...state.value!, userMsg]);
    final aiMsg = ChatMessage.ai(streaming: true);
    state = AsyncData([...state.value!, aiMsg]);

    await ref.read(wsClientProvider).stream(
      ChatRequest(text: text),
      onChunk: (chunk) {
        // 增量更新最后一条 AI 消息
        aiMsg.content += chunk.delta;
        state = AsyncData(List.from(state.value!));
      },
      onDone: () => aiMsg.streaming = false,
      onError: (e) => state = AsyncError(e, StackTrace.current),
    );
  }
}
```

- **重连策略**：指数退避（1s → 2s → 4s → ... 最大 30s），网络恢复后自动重连并补发未完成请求。
- **降级方案**：WebSocket 不可用时降级为 HTTP SSE（Server-Sent Events）。

#### 3.1.3 每日自动分析（后台任务 + 本地通知）

- **触发**：`workmanager` 注册周期任务（每 24h 一次，凌晨 4:00 由系统调度窗口执行）。
- **流程**：
  1. 后台任务拉取昨日学习记录 → 调用 `/ai/daily-analysis` 接口。
  2. 服务端生成分析报告（薄弱点、推荐任务、激励话术）。
  3. 客户端写入 Hive 缓存，并通过 `flutter_local_notifications` 推送本地通知。
  4. 用户打开 App 时，首页顶部展示当日分析卡片。
- **限制**：iOS 后台执行受限，对 iOS 依赖服务端 FCM 推送唤起；Android 使用 workmanager 真后台执行。

```dart
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    await Hive.openBox('daily');
    await DailyAnalysisService().runOnce();
    await LocalNotifications.show(
      id: 1001,
      title: '今日学习报告已生成',
      body: '点击查看你的薄弱点与建议',
    );
    return true;
  });
}
```

### 3.2 AI讲题引擎

#### 3.2.1 分步讲解组件设计（StepByStepWidget）

- 每道题的讲解被切分为有序 `Step` 列表：题意分析 → 思路引导 → 关键公式 → 完整解答 → 易错点。
- `StepByStepWidget` 维护当前 `currentIndex`，提供「下一步 / 上一步 / 跳转」交互。
- 每个 Step 内部内容为富文本片段列表（文本 / 公式 / 图 / 表格），由 `RichContentRenderer` 统一渲染。

```dart
class StepByStepWidget extends StatefulWidget { ... }

class _StepState extends State<StepByStepWidget> {
  int _index = 0;
  @override
  Widget build(BuildContext context) {
    final step = widget.steps[_index];
    return Column(
      children: [
        StepProgressIndicator(total: widget.steps.length, current: _index),
        Expanded(child: RichContentRenderer(parts: step.parts)),
        StepNavigationBar(
          onPrev: () => setState(() => _index--),
          onNext: () => setState(() => _index++),
        ),
      ],
    );
  }
}
```

#### 3.2.2 交互式理解度检测

- 在关键 Step 后插入「理解度检测」卡片：选择题 / 「我懂了 / 再讲一遍」按钮。
- 「再讲一遍」→ 触发 LLM 基于当前 Step 重新生成更通俗解释（携带上下文）。
- 「我懂了」→ 推进到下一 Step，并记录该知识点的掌握度（写本地 + 上报服务端）。
- 检测结果通过 `UnderstandingDetectorWidget` 暴露 `onResult` 回调，由 `ExplainerController` 决策分支。

#### 3.2.3 LaTeX 公式渲染（flutter_math_fork）

- 富文本中的公式片段以 `$$...$$` 或 `$...$` 标记，由解析器切分。
- `flutter_math_fork` 渲染单条公式；行内公式与文字混排时使用 `RichText` + `WidgetSpan` 嵌入。
- 复杂表格公式：将表格拆分为单元格，每格内嵌 `Math.tex(cell)`。
- 性能：对长公式启用 `RepaintBoundary`，避免滚动时重绘。

```dart
Widget buildInline(String text) {
  final parts = LatexParser.split(text); // 切出 text / formula
  return RichText(
    text: TextSpan(
      children: parts.map((p) {
        if (p.isFormula) {
          return WidgetSpan(
            child: Math.tex(p.content, textStyle: bodyStyle),
            baseline: TextBaseline.alphabetic,
            alignment: PlaceholderAlignment.middle,
          );
        }
        return TextSpan(text: p.content, style: bodyStyle);
      }).toList(),
    ),
  );
}
```

#### 3.2.4 手写公式识别接入

- 客户端提供手写画板（`CustomPainter` 记录笔迹点序列）。
- 笔迹序列导出为 SVG / 图片 → 上传服务端 → 调用 **MathPix API** 或自研模型识别为 LaTeX 字符串。
- 识别结果回填到输入框，用户确认后插入到当前讲解或提问上下文。
- 离线兜底：对简单符号（加减乘除、等号、希腊字母）使用 `google_mlkit_digital_ink_recognition` 做端侧识别。

### 3.3 AI智能组卷

#### 3.3.1 组卷算法前端参数构建

前端不执行组卷算法，只负责构造一份结构化的「组卷请求」并展示进度。参数模型：

```dart
@freezed
class PaperSpec with _$PaperSpec {
  const factory PaperSpec({
    required String subject,             // 科目
    required List<String> knowledgeIds,  // 知识点范围
    required DifficultyDistribution difficulty, // 难度分布
    required Map<QuestionType, int> typeQuota,  // 题型配额
    required int totalTimeMinutes,
    @Default(70) int targetScore,        // 目标分
    @Default(false) bool includeWeakOnly,// 仅出薄弱题
  }) = _PaperSpec;
}
```

UI 表单采用分组 `Form` + `Riverpod` 状态管理，提交时调用 `GeneratePaperUsecase` → 服务端流式返回题目（边出题边渲染，避免长时间等待）。

#### 3.3.2 题目缓存策略（LRU + Hive）

- 本地维护两份缓存：
  - **Hive Box `question_cache`**：题目正文（id → Question），容量上限 2000 条，达到上限按 LRU 淘汰。
  - **drift 表 `paper_session`**：用户已生成的试卷会话（含答题进度）。
- 命中策略：先查 Hive → miss 则请求服务端，回写 Hive。
- 缓存失效：知识点结构变更 / 题目勘误时，服务端在响应头带 `X-Question-Version`，客户端比对版本号决定是否刷新。

```dart
class QuestionRepositoryImpl implements QuestionRepository {
  Future<Question> getById(String id) async {
    final cached = _hive.get(id);
    if (cached != null) {
      _lru.touch(id);
      return cached;
    }
    final remote = await _remote.fetch(id);
    _hive.put(id, remote);
    _lru.put(id);
    if (_lru.size > 2000) {
      final evicted = _lru.evict();
      evicted.forEach(_hive.delete);
    }
    return remote;
  }
}
```

#### 3.3.3 答题卡组件设计

- `AnswerSheet` 组件以网格方式展示题号，状态：未答 / 已答 / 标记 / 当前题。
- 与 `PaperController` 双向绑定：点击题号跳转；作答后同步刷新格子颜色。
- 支持横滑试卷 + 侧滑答题卡（平板端使用 Master-Detail 布局）。
- 交卷前弹出 `ConfirmSubmitDialog`，列出未答题数与标记题数。

### 3.4 拍照搜题

#### 3.4.1 相机插件集成（camera）

- 使用官方 `camera` 插件，封装 `CameraService` 单例，统一初始化、权限申请、相机切换。
- 权限申请封装为 `PermissionService`，Android/iOS 差异由内部处理，对外暴露 `Future<bool> ensureCamera()`.
- 拍照预览使用 `CameraPreview` + 自定义取景框（指示用户将题目置于框内）。
- 自动对焦与曝光锁定：长按取景框触发对焦，提升 OCR 成功率。

#### 3.4.2 图片裁剪与优化（image_cropper）

- 拍照后跳转裁剪页，允许用户旋转、四角拖拽裁剪。
- 裁剪后做图像优化：灰度化、对比度增强、二值化（自研 `ImageProcessor`，基于 `image` 包），提升 OCR 准确率。
- 大图压缩到长边 ≤ 1600px，控制上传体积。

#### 3.4.3 OCR 识别流程

```
拍照 → 裁剪 → [端侧 OCR (ML Kit 文本) ]
                │
                ▼
       公式区域识别 → 服务端 MathPix (LaTeX)
                │
                ▼
       服务端 LLM 切题 + 题干补全 → 结构化 JSON
                │
                ▼
       题库向量检索 (Milvus) → 相似题 Top-K
```

- **端侧 OCR**：`google_mlkit_text_recognition` 离线识别中文文本，减少一次网络往返。
- **公式识别**：客户端识别公式区域（基于版面分析）后上传服务端，调用 **MathPix API**（或自研模型）转为 LaTeX。
- **服务端补全**：将文本 + LaTeX 拼装后送 LLM，做错题切分、题干清洗、缺失信息补全，输出结构化 `Question` JSON。
- **失败兜底**：任一环节失败，记录原图与中间结果到失败队列，由运营后台人工补录。

#### 3.4.4 相似题推荐算法对接

- 服务端基于题干向量（向量化模型）在 Milvus 中检索 Top-K 相似题，过滤已做过的题目。
- 客户端展示相似题列表卡片，支持「换一批」与「加入错题本」。
- 推荐结果带 `similarityScore`，前端按分数排序并标记「高度相似 / 一般相似」。

### 3.5 AI知识图谱

#### 3.5.1 图谱可视化（graphview 或自定义 CustomPainter）

- 小规模子图（单知识点邻域，≤ 50 节点）使用 `graphview` 布局树/力导向。
- 大规模全图（整学科）使用 **自研 CustomPainter + 手势**：节点按层级同心圆布局，支持双指缩放、拖拽平移、惯性滚动。
- 节点渲染：自定义 `RenderBox`，依据知识点状态（掌握 / 薄弱 / 未学）着色，节点大小映射知识点权重。

#### 3.5.2 知识点树状结构数据模型

```dart
@freezed
class KnowledgeNode with _$KnowledgeNode {
  const factory KnowledgeNode({
    required String id,
    required String name,
    required String subject,
    @Default([]) List<String> parentIds,   // 支持多父节点（图而非树）
    @Default([]) List<String> childIds,
    @Default(0.0) double mastery,          // 0~1 掌握度
    @Default(0) int weight,                // 权重（考试频次）
    @Default(false) bool isWeak,
  }) = _KnowledgeNode;
}
```

- 数据来源：服务端 Neo4j 图数据库，按科目分片下发。
- 客户端维护 `Map<String, KnowledgeNode>` 索引，便于 O(1) 查找邻接关系。

#### 3.5.3 交互式节点点击与高亮

- 点击节点：高亮该节点 + 其直接父/子节点 + 连线，其余节点降透明度。
- 双击节点：弹出底部 Sheet，展示该知识点的详情（掌握度趋势、关联题、推荐讲解视频）。
- 长按节点：弹出菜单（加入重点、生成专项卷、跳转 AI 讲解）。
- 高亮路径通过 `AnimationController` 做渐变过渡，避免突兀。

### 3.6 AI高考预测

#### 3.6.1 输入表单设计（三次成绩输入）

- 表单要求输入最近三次模考成绩（科目 + 总分 + 排名），并选择目标年份与省份。
- 使用 `flutter_form_builder` + `form_builder_validators` 做校验（分数范围、必填、年份合法性）。
- 支持从历史成绩库「一键带入」，减少手动输入。
- 提交前展示数据确认页，明确告知预测仅供参考。

#### 3.6.2 预测结果可视化（雷达图 + 趋势线）

- **雷达图**（fl_chart `RadarChart`）：六维展示各科能力画像（基础 / 计算 / 应用 / 综合 / 速度 / 准确率）。
- **趋势线**（fl_chart `LineChart`）：三次模考 + 预测分绘成折线，预测分用虚线 + 置信区间阴影。
- **分数段概率柱状图**：横轴为分数段（如 550–580、580–610…），纵轴为概率，便于直观判断落点。

#### 3.6.3 预测置信度展示组件

- 服务端返回预测中心分 + 95% 置信区间 + 样本量 + 模型版本。
- 客户端 `ConfidenceIndicator` 组件：以进度条 + 文字展示置信度等级（高 / 中 / 低）。
- 预测页底部固定提示：「预测基于历史数据与统计模型，结果仅供参考，不作为唯一决策依据」。

---

## 四、后端架构对接

### 4.1 API Gateway 设计

- 统一入口：所有客户端请求经过 **API Gateway**（Spring Cloud Gateway / Nginx + Kong）。
- 职责：鉴权、限流、路由、协议转换、灰度发布、日志埋点。
- 客户端通过域名（如 `api.aigaokao.com`）访问，网关按路径前缀路由到下游微服务：

| 路径前缀 | 下游服务 |
| --- | --- |
| `/api/user/**` | 用户中心 |
| `/api/question/**` | 题库服务 |
| `/api/ai/**` | AI 服务 |
| `/api/paper/**` | 组卷服务 |
| `/api/pay/**` | 支付服务 |
| `/api/graph/**` | 知识图谱服务 |

- WebSocket 走 `/ws/**` 由网关透传到 AI 服务。
- 客户端只感知网关域名，不感知内部服务拆分。

### 4.2 Spring Boot 微服务划分

| 微服务 | 职责 | 主要技术 |
| --- | --- | --- |
| 用户中心 (user-service) | 注册登录、用户画像、会员等级、家长绑定 | Spring Boot + Spring Security + JWT |
| 题库服务 (question-service) | 题目 CRUD、版本管理、相似题检索 | Spring Boot + MySQL + ES |
| AI 服务 (ai-service) | LLM 调用、向量检索、流式编排、组卷算法 | Spring Boot + Python 子服务（LangChain） |
| 组卷服务 (paper-service) | 试卷生成、答题会话、批改 | Spring Boot + MySQL |
| 支付服务 (pay-service) | 订单、微信/支付宝、会员开通 | Spring Boot + 微信支付 / 支付宝 SDK |
| 知识图谱服务 (graph-service) | 知识点树、掌握度计算 | Spring Boot + Neo4j |
| 文件服务 (file-service) | 上传下载、OCR 图片存储 | Spring Boot + MinIO |

- 服务间通信：同步用 OpenFeign，异步用 RabbitMQ/Kafka。
- 注册中心：Nacos；配置中心：Nacos Config。

### 4.3 数据库选型

| 存储 | 用途 | 选型理由 |
| --- | --- | --- |
| MySQL | 业务数据（用户、订单、试卷、答题记录） | 强一致、成熟、生态完善 |
| Redis | 缓存、会话、限流、排行榜 | 高性能 KV，支持多种数据结构 |
| ElasticSearch | 题目全文检索、知识点搜索 | 倒排索引，中文分词好 |
| MinIO | 图片、PDF、音频文件 | S3 兼容，私有部署 |
| Milvus | 题目向量检索、相似题推荐 | 高性能向量数据库 |
| Neo4j | 知识图谱（节点关系） | 图查询友好 |

客户端不直接访问任何数据库，全部通过网关 + 微服务暴露的 RESTful / WebSocket 接口。

### 4.4 消息队列：RabbitMQ / Kafka

- **RabbitMQ**：业务异步事件（如「答题完成 → 触发掌握度更新 → 推送日报」），强调可靠投递与路由。
- **Kafka**：高吞吐日志与埋点流（用户行为日志、AI 对话日志），供离线分析与模型训练。
- 客户端无感知：客户端只发请求，服务端内部用 MQ 解耦。

### 4.5 AI 服务对接

- **LLM API 调用**：ai-service 封装统一 `LlmGateway`，对接 GPT-4 / 文心一言 / 通义千问，支持故障转移与配额管理。
- **向量检索**：题目向量化后写入 Milvus，按 cosine 相似度检索 Top-K。
- **流式编排**：ai-service 通过 WebSocket 将 LLM 输出透传给客户端；同时并行执行 RAG（向量召回 → 上下文拼装 → LLM 生成）。
- **成本控制**：客户端请求中带 `scene` 标记，服务端按场景路由到不同档位模型（如日报用便宜模型，讲题用强模型）。

---

## 五、AI自动入库流程技术方案

### 5.1 整体流程

```
PDF / 图片源
   │
   ▼
[1] PDF 解析 / 图片预处理
   │  (pdf_render 端侧预览 / 服务端 Apache PDFBox 切页转图)
   ▼
[2] OCR 文本识别 (google_mlkit_text_recognition)
   │
   ▼
[3] 公式识别 (MathPix API / 自研模型 → LaTeX)
   │
   ▼
[4] 图片识别 (图表/几何图 → 结构化描述)
   │
   ▼
[5] LLM 切题 (GPT-4 / 文心一言 → 切分题干/选项/答案)
   │
   ▼
[6] JSON 结构化 (自定义 Schema 校验)
   │
   ▼
[7] AI 审核 (自动审核 + 人工双审)
   │
   ▼
[8] 知识图谱挂载 (Neo4j 关联知识点)
   │
   ▼
[9] 入库 (MySQL 题库 + Milvus 向量 + ES 索引)
```

### 5.2 各环节技术选型

| 环节 | 选型 | 说明 |
| --- | --- | --- |
| PDF 解析 | 端侧 `pdf_render` 预览；服务端 **Apache PDFBox** | 服务端将每页转为高分辨率图片供后续 OCR |
| OCR | `google_mlkit_text_recognition`（端侧）/ PaddleOCR（服务端批量） | 中文识别，服务端批量更稳定 |
| 公式识别 | **MathPix API**（付费，精度高）/ 自研模型（基于 Pix2Tex） | 服务端调用，结果为 LaTeX |
| 图片识别 | 服务端自研模型（图表分类 + 几何图矢量化） | 输出图片类型与关键描述 |
| LLM 切题 | **GPT-4 / 文心一言 API** | Prompt 工程 + Few-shot，输出结构化 JSON |
| JSON 结构化 | 自定义 Schema（JSON Schema + json_serializable） | 校验失败自动重试 / 转人工 |
| AI 审核 | 自动审核（规则 + 模型）+ 人工双审 | 敏感题、争议答案必走人工 |
| 知识图谱 | **Neo4j** | 关联知识点节点，建立前置/后继关系 |
| 流程编排 | **Apache Airflow**（数据团队）/ 自研任务调度（业务团队） | DAG 管理失败重试与人工节点 |

### 5.3 自定义 JSON Schema（节选）

```json
{
  "type": "object",
  "required": ["id", "stem", "type", "subject", "difficulty"],
  "properties": {
    "id": { "type": "string" },
    "subject": { "enum": ["math", "physics", "chemistry", "biology", "chinese", "english"] },
    "type": { "enum": ["single_choice", "multi_choice", "fill_blank", "short_answer", "essay"] },
    "stem": {
      "type": "object",
      "required": ["segments"],
      "properties": {
        "segments": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "kind": { "enum": ["text", "latex", "image"] },
              "content": { "type": "string" }
            }
          }
        }
      }
    },
    "options": { "type": "array", "items": { "type": "object" } },
    "answer": { "type": "string" },
    "analysis": { "type": "string" },
    "knowledgeIds": { "type": "array", "items": { "type": "string" } },
    "difficulty": { "type": "number", "minimum": 1, "maximum": 5 },
    "source": { "type": "string" }
  }
}
```

### 5.4 AI 审核机制

- **自动审核**：
  - 答案唯一性校验（单选答案是否在选项内）。
  - 公式语法校验（LaTeX 能否被 `flutter_math_fork` 正常渲染）。
  - 敏感词与政治正确性扫描。
  - 知识点关联置信度（LLM 给出的 knowledgeIds 与图谱匹配度）。
- **人工双审**：自动审核通过后进入人工队列，由教研老师二审；争议题进入专家三审。
- **审核状态机**：`draft → auto_review_pass → human_review_pass → published / rejected`。

### 5.5 流程编排

- **Airflow DAG**：每个 PDF 为一个 DagRun，各环节为 Task，失败按策略重试（OCR 重试 3 次，LLM 重试 2 次并切换模型）。
- **人工节点**：使用 Airflow `ExternalTaskSensor` 或自研审批中心，等待人工结果回写后继续。
- **可观测**：每个环节输出中间产物到 MinIO，便于回溯；任务状态写入 MySQL，运营后台可视化追踪。

---

## 六、性能优化

### 6.1 列表性能

- 优先使用 `ListView.builder` / `GridView.builder` / `SliverList`，避免 `Column` 堆叠大量子项。
- 对复杂 item 启用 `RepaintBoundary`，隔离重绘范围。
- 长列表（题目列表、消息流）启用 `cacheExtent` 适度预渲染（如 1500px），平衡流畅度与内存。
- item 含图片/公式时，使用 `const` 构造与 `AutomaticKeepAliveClientMixin`（如答题卡需保留滚动位置）。

### 6.2 图片加载

- 统一使用 `cached_network_image`，内置磁盘缓存 + 内存缓存。
- 配置占位图（`placeholder`）与错误图（`errorWidget`），避免空白闪烁。
- 服务端按需返回多分辨率图（缩略图 / 详情图），客户端按 widget 尺寸请求对应规格。
- 列表缩略图使用 `BlurHash` 占位，提升主观加载速度。

### 6.3 包体积优化

- **deferred components（动态下发）**：将不常用模块（如知识图谱全图、运营后台）拆分为 deferred library，按需下载。
- **资源压缩**：图片优先使用 WebP，SVG 替代位图图标；字体只打包使用到的子集（`fonttools` subset）。
- **ProGuard / R8**：Android 开启 `--shrink` 与 `--obfuscate`；iOS 开启 strip。
- **按 ABI 拆包**：Android 使用 `split-per-abi` 或 AAB，避免单包含多架构 so。
- **Tree Shaking**：开启 `--split-debug-info` 与 `--obfuscate`，移除调试符号。

### 6.4 启动速度

- **原生启动屏**：Android `windowBackground` / iOS LaunchScreen，避免白屏。
- **Flutter 启动屏**：在 `main()` 中预加载关键资源（用户 token、首页配置），同时展示轻量 splash。
- **延迟初始化**：非首屏依赖（推送、统计、知识图谱）延迟到首屏渲染后初始化。
- **预加载**：登录态下，`Home` 页面首帧渲染后立即预拉取首页推荐数据。

### 6.5 Web 适配

- **响应式断点**：

| 断点 | 宽度范围 | 布局 |
| --- | --- | --- |
| compact | < 600dp | 单列，底部导航 |
| medium | 600–840dp | 双列，侧边窄导航 |
| expanded | 840–1200dp | 三列，Master-Detail |
| large | > 1200dp | 固定侧栏 + 多列内容 |

- 使用 `LayoutBuilder` + `MediaQuery` 自适应栅格列数（`ResponsiveGrid`）。
- Web 端禁用移动端独有手势（如某些 `onScaleStart`），改用鼠标交互。
- 路由使用 `go_router` 的 URL path，支持浏览器前进后退与分享。
- 大列表在 Web 端启用虚拟滚动，避免 DOM 节点过多。

---

## 七、CI/CD

### 7.1 Flutter Web

- **构建**：`flutter build web --release --wasm`（启用 WASM 编译，提升性能）。
- **CI**：GitHub Actions，节点 `ubuntu-latest`，缓存 `.pub-cache` 与 `build`。
- **部署**：构建产物 `build/web` 推送到 **Vercel / Netlify**，配置自定义域名与 HTTPS。
- **预览**：每个 PR 自动生成 preview deployment，便于评审。

### 7.2 Flutter Android

- **构建**：`flutter build appbundle --release --shrink --obfuscate --split-debug-info=...`。
- **签名**：keystore 通过 GitHub Actions Secrets 注入，`key.properties` 由 CI 生成。
- **发布**：**Fastlane `supply`** 上传 AAB 到 Google Play 内测轨道，通过后晋升生产轨道。
- **分发**：国内渠道（华为、小米、OPPO、vivo、应用宝）通过 Fastlane 或各厂商 CLI 分发；或使用蒲公英 / fir.im 内测分发。

### 7.3 Flutter iOS

- **构建**：`flutter build ipa --release --export-options-plist=ExportOptions.plist`。
- **签名**：使用 **Fastlane match** 管理证书与描述文件，CI 中 `match appstore`。
- **发布**：**Fastlane `pilot`** 上传到 App Store Connect 的 TestFlight；通过审核后 `deliver` 提交生产。
- **CI Runner**：macOS（GitHub Actions macOS-latest 或自建 Mac mini）。

### 7.4 Flutter iPad

- 在 iOS 工程基础上启用 iPad 支持（`Targeted Device Family = 1,2`）。
- 适配 **sizeClass**：使用 `LayoutBuilder` + `MediaQuery` 区分 compact / regular，Master-Detail 布局。
- 支持外接键盘快捷键（`Shortcuts` + `Actions`）与 Apple Pencil（手写公式画板）。
- 多窗口与 Stage Manager 适配：确保 `SafeArea` 与 `insets` 正确处理。

### 7.5 热更新策略探讨（Shorebird）

- **Shorebird** 是 Flutter 的代码热更新方案，可在不重新发版的情况下推送 Dart 代码补丁。
- **适用场景**：紧急 bug 修复、小范围 A/B 实验、运营活动配置下发。
- **限制**：
  - 不能更新原生代码（插件、Android/iOS 原生模块）。
  - 苹果 App Store 对热更新有合规要求（不能改变 App 核心功能与目的），需谨慎评估。
  - 国内 Android 渠道（尤其华为）对热更新态度不一，需逐家评估。
- **采用策略**：
  - iOS：仅在合规范围内用于 bug 修复，提交审核时声明；保留「下线补丁」能力。
  - Android：全量采用 Shorebird 用于紧急修复；重大功能仍走常规发版。
  - 全平台：建立补丁灰度机制（按比例下发），异常率超阈值自动回滚。

### 7.6 CI/CD 流水线总览

```
Push / PR
   │
   ▼
[ Lint ] flutter analyze + dart format --set-exit-if-changed
   │
   ▼
[ Test ] flutter test (unit + widget) + integration_test (selected)
   │
   ▼
[ Build ] matrix: web / android / ios
   │
   ▼
[ Deploy ]
   ├─ Web → Vercel/Netlify (preview + prod)
   ├─ Android → Google Play (internal → production) + 国内渠道
   └─ iOS → TestFlight → App Store
   │
   ▼
[ Hotfix ] (按需) Shorebird patch (Android 全量 / iOS 谨慎)
```

---

## 八、开发计划

按 2 周一个 Sprint 节奏推进，共 14 个 Sprint（约 7 个月）。

| Sprint | 目标 | 主要交付物 |
| --- | --- | --- |
| Sprint 1–2 | 基础框架 + 登录注册 + 首页 | 项目骨架（分层 + 路由 + 主题 + Dio + Riverpod）、登录/注册/找回密码、首页框架与底部导航、CI 流水线雏形 |
| Sprint 3–4 | AI学习中心 + 智能刷题 | AI 学习教练对话页（WebSocket 流式）、组卷参数表单、答题卡、刷题页、错题本 |
| Sprint 5–6 | 拍照搜题 + 成绩分析 | 相机集成、裁剪、OCR + 公式识别、相似题推荐、成绩录入与雷达图 |
| Sprint 7–8 | 志愿填报 + 个人中心 | 院校库、志愿推荐、个人资料、会员中心、设置 |
| Sprint 9–10 | 运营后台 + 教师后台 | 后台 Web 端框架、题目管理、用户运营、教师班级与学情 |
| Sprint 11–12 | AI 模块深化 + 自动入库 | AI 讲题引擎（分步 + LaTeX + 手写）、知识图谱可视化、AI 高考预测、自动入库流水线 |
| Sprint 13–14 | 性能优化 + 测试 + 上线 | 列表/图片/启动性能调优、包体积优化、全量回归测试、各端商店提审与上线 |

### 8.1 里程碑

- **M1（Sprint 2 末）**：可运行的登录 + 首页 Demo，三个端跑通。
- **M2（Sprint 4 末）**：核心学习闭环（教练 → 组卷 → 刷题 → 错题）可用。
- **M3（Sprint 6 末）**：拍照搜题与成绩分析上线内测。
- **M4（Sprint 10 末）**：双后台就绪，具备对外运营能力。
- **M5（Sprint 12 末）**：AI 全模块深化完成，自动入库流水线上线。
- **M6（Sprint 14 末）**：全端正式发版上线。

### 8.2 风险与应对

| 风险 | 影响 | 应对 |
| --- | --- | --- |
| LLM API 成本与延迟 | 高 | 多模型分级路由 + 缓存 + 流式；预算监控 |
| OCR / 公式识别精度 | 中 | 服务端补全 + 人工审核兜底 |
| iOS 后台任务受限 | 中 | 每日分析改由服务端 FCM 触发 |
| Shorebird 合规风险 | 高 | iOS 谨慎使用，仅限 bug 修复 |
| 多端 UI 一致性 | 中 | 设计系统 + 响应式断点 + 视觉走查 |

---

## 附录：关键依赖 pubspec.yaml 节选

```yaml
environment:
  sdk: ">=3.4.0 <4.0.0"
  flutter: ">=3.22.0"

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter

  # 状态管理 + DI
  flutter_riverpod: ^2.5.1
  riverpod_annotation: ^2.3.5

  # 路由
  go_router: ^14.2.0

  # 网络
  dio: ^5.5.0
  web_socket_channel: ^3.0.0

  # 存储
  hive: ^2.2.3
  hive_flutter: ^1.1.0
  drift: ^2.18.0
  sqlite3_flutter_libs: ^0.5.0
  flutter_secure_storage: ^9.2.0

  # UI / 图表 / 公式
  fl_chart: ^0.68.0
  flutter_math_fork: ^0.7.2
  cached_network_image: ^3.4.0
  graphview: ^1.2.0

  # 相机 / OCR / 裁剪
  camera: ^0.11.0
  image_cropper: ^8.0.0
  google_mlkit_text_recognition: ^0.14.0

  # 推送 / 后台
  firebase_messaging: ^15.0.0
  jpush_flutter: ^3.0.0
  workmanager: ^0.5.2
  flutter_local_notifications: ^17.2.0

  # 工具
  freezed_annotation: ^2.4.4
  json_annotation: ^4.9.0
  intl: ^0.19.0

dev_dependencies:
  build_runner: ^2.4.11
  freezed: ^2.5.7
  json_serializable: ^6.8.0
  riverpod_generator: ^2.4.0
  drift_dev: ^2.18.0
  hive_generator: ^2.0.1
  flutter_test:
    sdk: flutter
  integration_test:
    sdk: flutter
  mocktail: ^1.0.4
```

---

> 本文档为活文档，随项目迭代持续更新。所有技术选型变更需经客户端组评审并更新本文件版本号。
