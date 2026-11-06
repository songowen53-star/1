// AI高考 - 后端 API (Cloudflare Worker)
import PAGES from './data/index.js';

// ========== 工具函数 ==========
function ok(data) { return { code: 0, data }; }
function err(msg, code = 1) { return { code, msg }; }

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

function corsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// ========== KV 持久化用户表 ==========
// KV 键设计：
//   user:${username}  -> JSON.stringify(user)
//   token:${token}    -> userId
//   user:id:seq       -> 当前用户ID序号（自增）

function newToken() {
  return 'tk_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
async function newUserId(env) {
  const seq = parseInt((await env.AI_GAOKAO_USERS.get('user:id:seq')) || '0') + 1;
  await env.AI_GAOKAO_USERS.put('user:id:seq', String(seq));
  return 'u_' + String(seq).padStart(3, '0');
}
function userPublic(u) {
  if (!u) return null;
  const { password, ...pub } = u;
  return pub;
}
async function authUser(req, env) {
  const auth = req.headers.get('authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/);
  if (!m) return null;
  const uid = await env.AI_GAOKAO_USERS.get('token:' + m[1]);
  if (!uid) return null;
  // 遍历所有用户找到匹配 id 的用户（数据量小，可接受）
  // 优化：也可存 token -> username 的映射，这里直接存 token -> user JSON
  const userJson = await env.AI_GAOKAO_USERS.get('token:user:' + m[1]);
  if (userJson) {
    try { return JSON.parse(userJson); } catch {}
  }
  return null;
}

// ========== Mock 数据 ==========
const MOCK = {
  weakPoints: [
    { id: 'kp_001', subject: '数学', name: '圆锥曲线综合', mastery_rate: 0.41, score_gain: 18, total_questions: 45, correct_count: 18 },
    { id: 'kp_002', subject: '物理', name: '电磁感应综合题', mastery_rate: 0.48, score_gain: 12, total_questions: 38, correct_count: 18 },
    { id: 'kp_003', subject: '英语', name: '完形填空技巧', mastery_rate: 0.53, score_gain: 9, total_questions: 52, correct_count: 28 },
    { id: 'kp_004', subject: '化学', name: '有机推断题型', mastery_rate: 0.58, score_gain: 7, total_questions: 30, correct_count: 17 },
    { id: 'kp_005', subject: '数学', name: '概率统计', mastery_rate: 0.62, score_gain: 5, total_questions: 40, correct_count: 25 },
    { id: 'kp_006', subject: '物理', name: '力学综合分析', mastery_rate: 0.55, score_gain: 10, total_questions: 35, correct_count: 19 },
    { id: 'kp_007', subject: '英语', name: '阅读理解推理题', mastery_rate: 0.59, score_gain: 8, total_questions: 48, correct_count: 28 },
    { id: 'kp_008', subject: '化学', name: '电化学原理', mastery_rate: 0.51, score_gain: 11, total_questions: 28, correct_count: 14 },
    { id: 'kp_009', subject: '数学', name: '导数应用专题', mastery_rate: 0.45, score_gain: 15, total_questions: 42, correct_count: 19 },
    { id: 'kp_010', subject: '物理', name: '动量与冲量', mastery_rate: 0.57, score_gain: 8, total_questions: 32, correct_count: 18 },
  ],
  knowledgePoints: [
    { id: 'kp_001', subject: '数学', name: '圆锥曲线综合', mastery_rate: 0.41 },
    { id: 'kp_002', subject: '物理', name: '电磁感应综合题', mastery_rate: 0.48 },
    { id: 'kp_003', subject: '英语', name: '完形填空技巧', mastery_rate: 0.53 },
    { id: 'kp_004', subject: '化学', name: '有机推断题型', mastery_rate: 0.58 },
    { id: 'kp_005', subject: '数学', name: '概率统计', mastery_rate: 0.62 },
  ],
  recommendQuestions: [
    { id: 'q_1001', subject: '数学', type: '选择题', difficulty: 4, knowledge_point: '圆锥曲线综合', title: '已知椭圆 C: x²/4 + y²/3 = 1，过点 P(1,1) 的直线与椭圆交于 A,B 两点，求弦长 |AB| 的取值范围。', options: ['A. [2,2√3]', 'B. [√3,2√3]', 'C. [2,4]', 'D. [√2,2√2]'], answer: 'B', analysis: '设直线斜率为 k，联立椭圆方程，利用韦达定理求弦长公式。' },
    { id: 'q_1002', subject: '物理', type: '计算题', difficulty: 4, knowledge_point: '电磁感应综合题', title: '导体棒 ab 在匀强磁场 B 中以速度 v 向右运动，求感应电流。', answer: 'I = BLv/R', analysis: '由法拉第电磁感应定律和欧姆定律求解。' },
    { id: 'q_1003', subject: '化学', type: '推断题', difficulty: 5, knowledge_point: '有机推断题型', title: '某链状化合物 A 分子式 C₄H₈O₂，可与 NaHCO₃ 反应，推断结构。', answer: 'A: 丁酸', analysis: '根据官能团反应特性推断。' },
    { id: 'q_1004', subject: '英语', type: '完形填空', difficulty: 3, knowledge_point: '完形填空技巧', title: 'The students were ___ by the inspiring speech.', options: ['A. bored', 'B. moved', 'C. confused', 'D. scared'], answer: 'B', analysis: '语境推断题。' },
    { id: 'q_1005', subject: '数学', type: '解答题', difficulty: 5, knowledge_point: '导数应用专题', title: 'f(x) = x³ - 3x + 1，求极值及零点个数。', answer: '极大值3，极小值-1，3个零点', analysis: '利用导数和零点定理。' },
  ],
  recommendPlan: [
    { subject: '数学', knowledge_point_name: '导数应用专题', mastery_rate: 0.45, score_gain: 15, allocated_minutes: 35, strategy: '专项突破' },
    { subject: '数学', knowledge_point_name: '圆锥曲线综合', mastery_rate: 0.41, score_gain: 18, allocated_minutes: 40, strategy: '优先突破' },
    { subject: '物理', knowledge_point_name: '电磁感应综合题', mastery_rate: 0.48, score_gain: 12, allocated_minutes: 30, strategy: '重点突破' },
  ],
  recommendPaper: {
    paper: [
      { id: 'q_1001', subject: '数学', type: '选择题', difficulty: 4, title: '椭圆弦长取值范围', options: ['A. [2,2√3]', 'B. [√3,2√3]', 'C. [2,4]', 'D. [√2,2√2]'], answer: 'B' },
      { id: 'q_1002', subject: '物理', type: '计算题', difficulty: 4, title: '电磁感应电流', answer: 'I = BLv/R' },
    ],
    meta: { total_count: 10, subjects: ['数学', '物理', '化学', '英语'], total_score: 150, estimated_time: 120, difficulty: '中等偏难' },
  },
  learningSummary: { duration_hours: 12.5, questions_count: 156, correct_rate: 78, study_days: 6, avg_daily_hours: 2.1 },
  subjectStats: [
    { subject: '数学', hours: 5.2, questions: 68, correct_rate: 72 },
    { subject: '物理', hours: 3.8, questions: 42, correct_rate: 78 },
    { subject: '英语', hours: 3.5, questions: 46, correct_rate: 82 },
  ],
  predictReport: { predicted_score: 615, rank: 12500, percentile: 85, subjects: [{ name: '数学', score: 125, predicted: 135 }] },
};

// ========== 路由处理 ==========
async function handleRequest(req, env) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  const method = req.method;
  const query = url.searchParams;

  // CORS 预检
  if (method === 'OPTIONS') return corsResponse();

  // ---- 页面数据 ----
  if (method === 'GET' && pathname.startsWith('/api/page-data/')) {
    const key = pathname.replace('/api/page-data/', '');
    const data = PAGES[key];
    if (!data) return jsonResponse(err('page not found: ' + key), 404);
    // JSON 文件包含元数据 wrapper，前端只需要 inner data
    const inner = data && data.data != null ? data.data : data;
    return jsonResponse(ok(inner));
  }

  if (method === 'PUT' && pathname.startsWith('/api/page-data/')) {
    return jsonResponse(ok({ success: true }));
  }

  // ---- 认证 ----
  if (method === 'POST' && pathname === '/api/auth/register') {
    const body = await req.json().catch(() => ({}));
    const { username, password, name, grade, province, target_score, target_school } = body;
    if (!username || !password) return jsonResponse(err('用户名和密码必填'), 400);
    const existing = await env.AI_GAOKAO_USERS.get('user:' + username);
    if (existing) return jsonResponse(err('用户名已存在'), 409);
    const userId = await newUserId(env);
    const user = {
      id: userId, username, password,
      name: name || username, grade: grade || '高三', province: province || '浙江',
      target_score: parseInt(target_score) || 600,
      target_school: target_school || '',
      current_score: 580,
      days_to_gaokao: 249
    };
    await env.AI_GAOKAO_USERS.put('user:' + username, JSON.stringify(user));
    const token = newToken();
    await env.AI_GAOKAO_USERS.put('token:' + token, user.id);
    await env.AI_GAOKAO_USERS.put('token:user:' + token, JSON.stringify(user));
    return jsonResponse(ok({ token, user_id: user.id, user: userPublic(user) }));
  }

  if (method === 'POST' && pathname === '/api/auth/login') {
    const body = await req.json().catch(() => ({}));
    const { username, password } = body;
    const userJson = await env.AI_GAOKAO_USERS.get('user:' + username);
    const u = userJson ? JSON.parse(userJson) : null;
    if (!u || u.password !== password) return jsonResponse(err('用户名或密码错误'), 401);
    const token = newToken();
    await env.AI_GAOKAO_USERS.put('token:' + token, u.id);
    await env.AI_GAOKAO_USERS.put('token:user:' + token, JSON.stringify(u));
    return jsonResponse(ok({ token, user_id: u.id, user: userPublic(u) }));
  }

  if (method === 'POST' && pathname === '/api/auth/logout') {
    const auth = req.headers.get('authorization') || '';
    const m = auth.match(/^Bearer\s+(.+)$/);
    if (m) {
      await env.AI_GAOKAO_USERS.delete('token:' + m[1]);
      await env.AI_GAOKAO_USERS.delete('token:user:' + m[1]);
    }
    return jsonResponse(ok({ success: true }));
  }

  if (method === 'GET' && pathname === '/api/auth/me') {
    const u = await authUser(req, env);
    if (!u) return jsonResponse(err('未登录'), 401);
    return jsonResponse(ok(userPublic(u)));
  }

  if (method === 'POST' && pathname === '/api/auth/wechat-login') {
    const body = await req.json().catch(() => ({}));
    const code = body.code;
    if (!code) return jsonResponse(err('缺少 code'), 400);
    const username = 'wx_' + code.slice(0, 8);
    const existing = await env.AI_GAOKAO_USERS.get('user:' + username);
    let u = existing ? JSON.parse(existing) : null;
    if (!u) {
      const userId = await newUserId(env);
      u = { id: userId, username, password: '', name: '微信用户', grade: '高三', province: '浙江', openid: code };
      await env.AI_GAOKAO_USERS.put('user:' + username, JSON.stringify(u));
    }
    const token = newToken();
    await env.AI_GAOKAO_USERS.put('token:' + token, u.id);
    await env.AI_GAOKAO_USERS.put('token:user:' + token, JSON.stringify(u));
    return jsonResponse(ok({ token, user_id: u.id, user: userPublic(u), is_new: !u.password }));
  }

  if (method === 'GET' && pathname === '/api/auth/wechat-qrcode') {
    const sceneId = 'scene_' + Math.random().toString(36).slice(2, 10);
    return jsonResponse(ok({ scene_id: sceneId, qrcode_url: 'data:image/png;base64,iVBORw0KGgo=', expires_in: 120 }));
  }

  if (method === 'GET' && pathname === '/api/auth/wechat-qrcode-status') {
    return jsonResponse(ok({ status: 'waiting', expires_in: 120 }));
  }

  if (method === 'POST' && pathname === '/api/auth/wechat-mock-scan') {
    return jsonResponse(ok({ success: true }));
  }

  if (method === 'POST' && pathname === '/api/auth/wechat-qrcode-cancel') {
    return jsonResponse(ok({ success: true }));
  }

  if (method === 'POST' && pathname === '/api/auth/wechat-qrcode-refresh') {
    const sceneId = 'scene_' + Math.random().toString(36).slice(2, 10);
    return jsonResponse(ok({ scene_id: sceneId, qrcode_url: 'data:image/png;base64,iVBORw0KGgo=', expires_in: 120 }));
  }

  if (method === 'POST' && pathname === '/api/auth/sms-send') {
    return jsonResponse(ok({ success: true, message: '验证码已发送' }));
  }

  if (method === 'POST' && pathname === '/api/auth/sms-login') {
    const body = await req.json().catch(() => ({}));
    const { phone } = body;
    if (!phone) return jsonResponse(err('缺少手机号'), 400);
    const existing = await env.AI_GAOKAO_USERS.get('user:' + phone);
    let u = existing ? JSON.parse(existing) : null;
    if (!u) {
      const userId = await newUserId(env);
      u = { id: userId, username: phone, password: '', name: phone.slice(-4) + '同学', grade: '高三', province: '浙江' };
      await env.AI_GAOKAO_USERS.put('user:' + phone, JSON.stringify(u));
    }
    const token = newToken();
    await env.AI_GAOKAO_USERS.put('token:' + token, u.id);
    await env.AI_GAOKAO_USERS.put('token:user:' + token, JSON.stringify(u));
    return jsonResponse(ok({ token, user_id: u.id, user: userPublic(u) }));
  }

  if (method === 'POST' && pathname === '/api/auth/parent-bind') {
    return jsonResponse(ok({ success: true }));
  }
  if (method === 'GET' && pathname === '/api/auth/parent-bindings') {
    return jsonResponse(ok([]));
  }
  if (method === 'POST' && pathname.match(/^\/api\/auth\/parent-bindings\/[^/]+\/confirm$/)) {
    return jsonResponse(ok({ success: true }));
  }

  // ---- 考点库 ----
  if (method === 'GET' && pathname === '/api/knowledge') {
    let list = MOCK.knowledgePoints;
    const subject = query.get('subject');
    if (subject) list = list.filter(k => k.subject === subject);
    return jsonResponse(ok(list));
  }
  if (method === 'GET' && pathname === '/api/knowledge/weak') {
    const threshold = parseFloat(query.get('threshold')) || 0.6;
    const limit = parseInt(query.get('limit')) || 10;
    let list = MOCK.weakPoints.filter(k => k.mastery_rate < threshold).slice(0, limit);
    return jsonResponse(ok(list));
  }

  // ---- 题库 ----
  if (method === 'GET' && pathname === '/api/questions') {
    let list = MOCK.recommendQuestions;
    const subject = query.get('subject');
    if (subject) list = list.filter(q => q.subject === subject);
    if (query.get('source') === 'real_exam') list = list.map(q => ({ ...q, source: 'real_exam', year: 2024 }));
    const count = parseInt(query.get('count'));
    if (count && count > 0) list = list.slice(0, count);
    return jsonResponse(ok(list));
  }
  if (method === 'GET' && pathname.match(/^\/api\/questions\/[^/]+$/)) {
    const id = pathname.split('/').pop();
    const q = MOCK.recommendQuestions.find(q => q.id === id);
    if (q) return jsonResponse(ok(q));
    return jsonResponse(err('题目不存在'), 404);
  }
  if (method === 'POST' && pathname === '/api/questions/import') {
    const body = await req.json().catch(() => ({}));
    const { format, data } = body;
    if (!data) return jsonResponse(err('缺少数据'), 400);
    const count = Array.isArray(data) ? data.length : 1;
    return jsonResponse(ok({ format: format || 'json', imported: count, skipped: 0, imported_at: new Date().toISOString() }));
  }

  // ---- 学情 ----
  if (method === 'GET' && pathname.match(/^\/api\/learning\/[^/]+\/summary$/)) {
    const days = parseInt(query.get('days')) || 7;
    const factor = days / 7;
    const b = MOCK.learningSummary;
    return jsonResponse(ok({ ...b, duration_hours: Math.round(b.duration_hours * factor * 10) / 10, questions_count: Math.round(b.questions_count * factor), study_days: Math.min(7, Math.round(b.study_days * factor)) }));
  }
  if (method === 'GET' && pathname.match(/^\/api\/learning\/[^/]+\/subject-stats$/)) {
    return jsonResponse(ok(MOCK.subjectStats));
  }
  if (method === 'GET' && pathname.match(/^\/api\/learning\/[^/]+\/review-progress$/)) {
    return jsonResponse(ok({ total_points: 120, reviewed: 78, reviewing: 22, not_started: 20, review_rate: 0.65, next_review: ['导数应用专题', '电磁感应综合题'] }));
  }
  if (method === 'GET' && pathname.match(/^\/api\/learning\/[^/]+\/today-tasks$/)) {
    const _now = new Date();
    const _w = ['日', '一', '二', '三', '四', '五', '六'];
    const dateStr = `${_now.getMonth() + 1}月${_now.getDate()}日 周${_w[_now.getDay()]}`;
    return jsonResponse(ok({ date: dateStr, tasks: [
      { subject: '语文', color: 'red', icon: 'fa-book', point: '古诗文鉴赏', difficulty: '困难', time: '32min', questions_count: 10, status: 'todo' },
      { subject: '数学', color: 'blue', icon: 'fa-square-root-variable', point: '圆锥曲线综合', difficulty: '困难', time: '47min', questions_count: 22, status: 'todo' },
    ], done_count: 0, total_count: 2, completion_rate: 0 }));
  }
  if (method === 'GET' && pathname.match(/^\/api\/learning\/[^/]+\/duration-stats$/)) {
    const _now = new Date();
    const _w = ['日', '一', '二', '三', '四', '五', '六'];
    const _dayIdx = (_now.getDay() + 6) % 7;
    const _weekHours = [2.1, 2.8, 3.5, 2.0, 2.6, 1.4, 3.2];
    const _total = _weekHours.reduce((s, v) => s + v, 0);
    return jsonResponse(ok({
      today: { duration_min: Math.round(_weekHours[_dayIdx] * 60), duration_hours: _weekHours[_dayIdx], change_pct: 12, daily_goal_hours: 6, goal_rate: Math.round(_weekHours[_dayIdx] / 6 * 100) },
      summary: { week_hours: _total, week_change: 8, month_hours: _total * 4, avg_hours: Math.round(_total / 7 * 10) / 10 },
      weekly: _weekHours.map((h, i) => ({ day: ['一', '二', '三', '四', '五', '六', '日'][i], hours: h, min: Math.round(h * 60), is_today: i === _dayIdx })),
      week_total_hours: _total, week_goal_hours: 42, week_goal_rate: Math.round(_total / 42 * 100),
      subjects: [{ subject: '数学', hours: 5.2, color: '#3B82F6' }, { subject: '物理', hours: 3.8, color: '#F59E0B' }],
    }));
  }
  if (method === 'GET' && pathname.match(/^\/api\/learning\/[^/]+\/daily-series$/)) {
    const days = parseInt(query.get('days')) || 30;
    const subject = query.get('subject') || '全部';
    const series = [], labels = [], duration_minutes = [], answer_count = [], correct_rate = [];
    const _now = Date.now();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(_now - i * 86400000);
      const hours = Math.round((1.5 + Math.random() * 2.5) * 10) / 10;
      const questions = Math.floor(20 + Math.random() * 40);
      const rate = Math.floor(60 + Math.random() * 35);
      series.push({ date: d.toISOString().slice(0, 10), hours, questions, correct_rate: rate, subject });
      labels.push((d.getMonth() + 1) + '/' + d.getDate());
      duration_minutes.push(Math.round(hours * 60));
      answer_count.push(questions);
      correct_rate.push(rate);
    }
    return jsonResponse(ok({ days, subject, series, labels, duration_minutes, answer_count, correct_rate }));
  }
  if (method === 'GET' && pathname.match(/^\/api\/learning\/[^/]+\/subject-mastery$/)) {
    const subjects = [
      { subject: '数学', current_mastery: 68, target_mastery: 85, color: '#3B82F6', icon: 'fa-square-root-variable' },
      { subject: '语文', current_mastery: 75, target_mastery: 80, color: '#EF4444', icon: 'fa-book-open' },
      { subject: '英语', current_mastery: 80, target_mastery: 85, color: '#10B981', icon: 'fa-language' },
      { subject: '物理', current_mastery: 71, target_mastery: 82, color: '#8B5CF6', icon: 'fa-atom' },
      { subject: '化学', current_mastery: 66, target_mastery: 80, color: '#F59E0B', icon: 'fa-flask' },
    ];
    return jsonResponse(ok({ radar: subjects, radar_labels: subjects.map(s => s.subject), radar_current: subjects.map(s => s.current_mastery), radar_target: subjects.map(s => s.target_mastery) }));
  }

  // ---- 推荐 ----
  if (method === 'GET' && pathname.match(/^\/api\/recommend\/[^/]+\/plan$/)) {
    const available = parseInt(query.get('available_minutes')) || 120;
    const result = [];
    let total = 0;
    for (const p of MOCK.recommendPlan) {
      if (total + p.allocated_minutes <= available) { result.push(p); total += p.allocated_minutes; }
    }
    return jsonResponse(ok({ plan: result, total_minutes: total, task_count: result.length, estimated_score_gain: result.reduce((s, p) => s + p.score_gain, 0) }));
  }
  if (method === 'GET' && pathname.match(/^\/api\/recommend\/[^/]+\/questions$/)) {
    const count = parseInt(query.get('count')) || 10;
    const subject = query.get('subject');
    let list = MOCK.recommendQuestions;
    if (subject) list = list.filter(q => q.subject === subject);
    return jsonResponse(ok(list.slice(0, count)));
  }
  if (method === 'GET' && pathname.match(/^\/api\/recommend\/[^/]+\/paper$/)) {
    const count = parseInt(query.get('count')) || 10;
    const paper = MOCK.recommendPaper.paper.slice(0, count);
    return jsonResponse(ok({ paper, meta: { ...MOCK.recommendPaper.meta, total_count: paper.length } }));
  }
  if (method === 'GET' && pathname.match(/^\/api\/recommend\/[^/]+\/week-plan$/)) {
    return jsonResponse(ok({ week_plan: MOCK.recommendPlan.slice(0, 5), total_tasks: 5, estimated_gain: 50 }));
  }

  // ---- 预测 ----
  if (method === 'GET' && pathname.match(/^\/api\/predict\/[^/]+\/score$/)) {
    return jsonResponse(ok({ predicted_score: MOCK.predictReport.predicted_score }));
  }
  if (method === 'GET' && pathname.match(/^\/api\/predict\/[^/]+\/rank$/)) {
    return jsonResponse(ok({ rank: MOCK.predictReport.rank, percentile: MOCK.predictReport.percentile }));
  }
  if (method === 'GET' && pathname.match(/^\/api\/predict\/[^/]+\/report$/)) {
    return jsonResponse(ok(MOCK.predictReport));
  }
  if (method === 'GET' && pathname.match(/^\/api\/predict\/[^/]+\/score-trend$/)) {
    const days = parseInt(query.get('days')) || 60;
    const labels = [], scores = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      labels.push((d.getMonth() + 1) + '/' + d.getDate());
      scores.push(Math.round(560 + Math.random() * 60));
    }
    return jsonResponse(ok({ days, labels, scores, predicted_score: 615 }));
  }

  // ---- 答题 ----
  if (method === 'POST' && pathname === '/api/answers') {
    const body = await req.json().catch(() => ({}));
    return jsonResponse(ok({ success: true, question_id: body.question_id, is_correct: true }));
  }
  if (method === 'POST' && pathname === '/api/answers/batch') {
    const body = await req.json().catch(() => ({}));
    return jsonResponse(ok({ success: true, count: (body.records || []).length }));
  }
  if (method === 'GET' && pathname.match(/^\/api\/answers\/[^/]+\/stats$/)) {
    const b = MOCK.learningSummary;
    return jsonResponse(ok({ total: b.questions_count, correct: Math.round(b.questions_count * b.correct_rate / 100), correct_rate: b.correct_rate, avg_time_per_question: 180 }));
  }
  if (method === 'GET' && pathname.match(/^\/api\/answers\/[^/]+\/trend-series$/)) {
    const days = parseInt(query.get('days')) || 14;
    const labels = [], answer_count = [], correct_rate = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      labels.push((d.getMonth() + 1) + '/' + d.getDate());
      answer_count.push(Math.floor(15 + Math.random() * 30));
      correct_rate.push(Math.floor(65 + Math.random() * 30));
    }
    return jsonResponse(ok({ days, labels, answer_count, correct_rate }));
  }
  if (method === 'GET' && pathname.match(/^\/api\/answers\/[^/]+\/loss-analysis$/)) {
    return jsonResponse(ok([
      { reason: '计算失误', count: 12, rate: 0.3 },
      { reason: '概念不清', count: 8, rate: 0.2 },
      { reason: '审题错误', count: 6, rate: 0.15 },
    ]));
  }

  // ---- 内容 ----
  if (method === 'GET' && pathname === '/api/articles') {
    const limit = parseInt(query.get('limit')) || 20;
    return jsonResponse(ok([
      { id: 'a1', title: '2024高考数学压轴题5种解法', views: 12500, favorites: 1200, tag: '数学', summary: '圆锥曲线、导数等压轴题的5种经典解法详解。' },
      { id: 'a2', title: '高考英语完形填空三大技巧', views: 8700, favorites: 980, tag: '英语', summary: '语境推断、词义辨析、逻辑衔接三大核心技巧。' },
    ].slice(0, limit)));
  }
  if (method === 'GET' && pathname === '/api/courses') {
    const limit = parseInt(query.get('limit')) || 20;
    return jsonResponse(ok([
      { id: 'c1', title: '圆锥曲线专题突破', teacher: '王老师', lessons: 12, rating: 4.9, subject: '数学' },
      { id: 'c2', title: '英语写作高分模板', teacher: '李老师', lessons: 8, rating: 4.8, subject: '英语' },
    ].slice(0, limit)));
  }
  if (method === 'GET' && pathname === '/api/subjects') {
    return jsonResponse(ok([
      { id: 'math', name: '数学', icon: 'fa-square-root-variable', color: '#3B82F6' },
      { id: 'chinese', name: '语文', icon: 'fa-book', color: '#EF4444' },
      { id: 'english', name: '英语', icon: 'fa-language', color: '#8B5CF6' },
      { id: 'physics', name: '物理', icon: 'fa-atom', color: '#F59E0B' },
      { id: 'chemistry', name: '化学', icon: 'fa-flask', color: '#10B981' },
    ]));
  }

  // ---- 通知 ----
  if (method === 'GET' && pathname.match(/^\/api\/notifications\/[^/]+$/)) {
    return jsonResponse(ok([
      { id: 'n1', type: 'info', title: '学习周报已生成', content: '本周学习时长 12.5h，正确率提升 5%', created_at: new Date().toISOString(), is_read: false },
      { id: 'n2', type: 'warning', title: '错题本更新', content: '今日新增 3 道错题', created_at: new Date().toISOString(), is_read: false },
    ]));
  }
  if (method === 'POST' && pathname.match(/^\/api\/notifications\/[^/]+\/[^/]+\/read$/)) {
    return jsonResponse(ok({ success: true }));
  }

  // ---- 搜索 ----
  if (method === 'POST' && pathname === '/api/search/image') {
    return jsonResponse(ok({ question_id: 'q_1001', question: MOCK.recommendQuestions[0], candidates: MOCK.recommendQuestions.slice(0, 3), confidence: 0.92 }));
  }
  if (method === 'GET' && pathname.match(/^\/api\/search\/[^/]+\/history$/)) {
    return jsonResponse(ok([
      { id: 'h1', question_title: '圆锥曲线综合题', subject: '数学', searched_at: new Date().toISOString() },
    ]));
  }

  // ---- 用户 ----
  if (method === 'GET' && pathname.match(/^\/api\/users\/[^/]+$/)) {
    const uid = pathname.split('/').pop();
    // 优先从 token 缓存中找用户，否则返回默认
    const u = await authUser(req, env);
    if (u && u.id === uid) {
      return jsonResponse(ok({
        id: u.id, name: u.name, avatar: '', is_vip: true,
        grade: u.grade, province: u.province,
        current_score: u.current_score || 580,
        target_score: u.target_score || 620,
        target_school: u.target_school || '',
        days_to_gaokao: u.days_to_gaokao || 249
      }));
    }
    return jsonResponse(ok({ id: uid, name: '张同学', avatar: '', is_vip: true, grade: '高三', province: '浙江', current_score: 580, target_score: 620, target_school: '', days_to_gaokao: 249 }));
  }
  if (method === 'PUT' && pathname.match(/^\/api\/users\/[^/]+$/)) {
    const body = await req.json().catch(() => ({}));
    return jsonResponse(ok({ ...body, id: pathname.split('/').pop() }));
  }

  // ---- AI 模型中心 ----
  if (method === 'GET' && pathname === '/api/ai/model-center') {
    const data = PAGES['ai-model-center'] || {};
    return jsonResponse(ok(data));
  }
  if (method === 'POST' && pathname === '/api/ai/model-center/test') {
    return jsonResponse(ok({ success: true, latency_ms: 120, result: 'ok' }));
  }

  // ---- AI 模块 ----
  if (method === 'GET' && pathname === '/api/ai-module/coach') return jsonResponse(ok(PAGES['ai-module-coach'] || {}));
  if (method === 'GET' && pathname === '/api/ai-module/explain') return jsonResponse(ok(PAGES['ai-module-explain'] || {}));
  if (method === 'GET' && pathname === '/api/ai-module/paper') return jsonResponse(ok(PAGES['ai-module-paper'] || {}));
  if (method === 'GET' && pathname === '/api/ai-module/graph') return jsonResponse(ok(PAGES['ai-module-graph'] || {}));
  if (method === 'GET' && pathname === '/api/ai-module/predict') return jsonResponse(ok(PAGES['ai-module-predict'] || {}));

  // ---- 志愿填报 ----
  if (method === 'GET' && pathname === '/api/college/recommend') return jsonResponse(ok(PAGES['college-recommend'] || {}));
  if (method === 'GET' && pathname === '/api/college/major') return jsonResponse(ok(PAGES['college-major'] || {}));
  if (method === 'GET' && pathname === '/api/college/rank') return jsonResponse(ok(PAGES['college-rank'] || {}));
  if (method === 'PUT' && pathname === '/api/college/recommend/conditions') return jsonResponse(ok({ success: true }));

  // ---- 模块管理 ----
  if (method === 'GET' && pathname === '/api/modules') return jsonResponse(ok([]));
  if (method === 'GET' && pathname.match(/^\/api\/modules\/[^/]+$/)) {
    const key = pathname.split('/').pop();
    return jsonResponse(ok(PAGES[key] || {}));
  }
  if (method === 'PUT' && pathname === '/api/modules') return jsonResponse(ok({ success: true }));
  if (method === 'PUT' && pathname.match(/^\/api\/modules\/[^/]+$/)) return jsonResponse(ok({ success: true }));
  if (method === 'DELETE' && pathname.match(/^\/api\/modules\/[^/]+$/)) return jsonResponse(ok({ success: true }));
  if (method === 'POST' && pathname.match(/^\/api\/modules\/[^/]+\/import$/)) return jsonResponse(ok({ success: true }));

  // ---- 教师上传 ----
  if (method === 'POST' && pathname === '/api/teacher/upload') {
    return jsonResponse(ok({ success: true, file_url: 'https://example.com/file.pdf' }));
  }

  // 根路径
  if (method === 'GET' && pathname === '/') {
    return new Response('AI高考 API 服务运行中', { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Access-Control-Allow-Origin': '*' } });
  }

  // 404
  return jsonResponse(err('Not Found: ' + pathname), 404);
}

export default {
  async fetch(request, env) {
    try {
      return await handleRequest(request, env);
    } catch (e) {
      return jsonResponse(err('服务器错误: ' + e.message), 500);
    }
  },
};
