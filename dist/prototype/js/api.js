// ========== 前端API封装层 ==========
// 统一对接后端服务，所有数据走真实接口
const API_BASE = ''; // API方法URL均以/api/开头，为根相对路径，无需前缀

// 用户登录态管理
const Auth = {
    // 获取本地存储的 token 和 user_id
    getToken() { return localStorage.getItem('aigaokao_token') || ''; },
    getUserId() { return localStorage.getItem('aigaokao_user_id') || ''; },
    setSession(token, userId, user) {
        localStorage.setItem('aigaokao_token', token);
        localStorage.setItem('aigaokao_user_id', userId);
        if (user) localStorage.setItem('aigaokao_user', JSON.stringify(user));
    },
    clear() {
        localStorage.removeItem('aigaokao_token');
        localStorage.removeItem('aigaokao_user_id');
        localStorage.removeItem('aigaokao_user');
    },
    isLoggedIn() { return !!this.getToken(); },
    // 获取缓存的用户信息（不请求后端）
    getCachedUser() {
        const s = localStorage.getItem('aigaokao_user');
        try { return s ? JSON.parse(s) : null; } catch { return null; }
    }
};

// 动态 USER_ID：已登录用登录用户，否则用演示账户
function getUserId() {
    return Auth.getUserId() || 'u_001';
}

const api = {
    // 通用请求（带 token）
    async request(url, options = {}) {
        try {
            const isFormData = options.body instanceof FormData;
            const headers = isFormData ? { ...options.headers } : { 'Content-Type': 'application/json', ...options.headers };
            const token = Auth.getToken();
            if (token) headers['Authorization'] = 'Bearer ' + token;
            const res = await fetch(API_BASE + url, { ...options, headers });
            const text = await res.text();
            let data;
            try { data = JSON.parse(text); } catch {
                console.warn('[API] 非JSON响应:', url, text.slice(0, 100));
                return null;
            }
            if (data.code !== 0) throw new Error(data.msg || '请求失败');
            return data.data;
        } catch (e) {
            console.error('[API Error]', url, e);
            return null;
        }
    },

    // ========== 认证 ==========
    register(username, password, name, grade, province) {
        return this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password, name, grade, province })
        });
    },
    login(username, password) {
        return this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },
    logout() {
        return this.request('/api/auth/logout', { method: 'POST' });
    },
    getMe() {
        return this.request('/api/auth/me');
    },
    wechatLogin(code) {
        return this.request('/api/auth/wechat-login', {
            method: 'POST',
            body: JSON.stringify({ code })
        });
    },
    // ===== 微信扫码登录 =====
    wechatQrcodeCreate() {
        return this.request('/api/auth/wechat-qrcode');
    },
    wechatQrcodeStatus(sceneId) {
        return this.request(`/api/auth/wechat-qrcode-status?scene_id=${encodeURIComponent(sceneId)}`);
    },
    wechatQrcodeMockScan(sceneId, action, mockOpenid) {
        const body = { scene_id: sceneId, action };
        if (mockOpenid) body.mock_openid = mockOpenid;
        return this.request('/api/auth/wechat-mock-scan', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },
    wechatQrcodeCancel(sceneId) {
        return this.request('/api/auth/wechat-qrcode-cancel', {
            method: 'POST',
            body: JSON.stringify({ scene_id: sceneId })
        });
    },
    // SSE 流端点 URL（用于 EventSource 实时接收扫码状态）
    wechatQrcodeStreamUrl(sceneId) {
        return `/api/auth/wechat-qrcode-stream?scene_id=${encodeURIComponent(sceneId)}`;
    },
    // 同 scene_id 刷新二维码
    wechatQrcodeRefresh(sceneId) {
        return this.request('/api/auth/wechat-qrcode-refresh', {
            method: 'POST',
            body: JSON.stringify({ scene_id: sceneId })
        });
    },
    smsSend(phone) {
        return this.request('/api/auth/sms-send', {
            method: 'POST',
            body: JSON.stringify({ phone })
        });
    },
    smsLogin(phone, code) {
        return this.request('/api/auth/sms-login', {
            method: 'POST',
            body: JSON.stringify({ phone, code })
        });
    },
    parentBind(studentPhone, parentPhone, relation, smsCode) {
        const body = { student_phone: studentPhone, parent_phone: parentPhone, relation };
        if (smsCode) body.sms_code = smsCode;
        return this.request('/api/auth/parent-bind', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },
    getParentBindings() {
        return this.request('/api/auth/parent-bindings');
    },
    confirmParentBinding(id) {
        return this.request(`/api/auth/parent-bindings/${id}/confirm`, { method: 'POST' });
    },

    // ========== 用户 ==========
    getUser() {
        return this.request(`/api/users/${getUserId()}`);
    },
    updateUser(patch) {
        return this.request(`/api/users/${getUserId()}`, {
            method: 'PUT',
            body: JSON.stringify(patch)
        });
    },

    // ========== 考点库 ==========
    getKnowledgePoints(subject) {
        const q = subject ? `?subject=${encodeURIComponent(subject)}` : '';
        return this.request(`/api/knowledge${q}`);
    },
    getWeakPoints(threshold = 0.6, limit = 5) {
        return this.request(`/api/knowledge/weak?threshold=${threshold}&limit=${limit}`);
    },

    // ========== 题库 ==========
    getQuestions(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        return this.request(`/api/questions?${params}`);
    },
    getRealExamQuestions(count, subject) {
        const params = new URLSearchParams({ source: 'real_exam' });
        if (count) params.set('count', count);
        if (subject) params.set('subject', subject);
        return this.request(`/api/questions?${params}`);
    },
    getQuestion(id) {
        return this.request(`/api/questions/${id}`);
    },
    // 批量导入真题
    importQuestions(format, data) {
        return this.request('/api/questions/import', {
            method: 'POST',
            body: JSON.stringify({ format, data })
        });
    },

    // ========== 学情数据 ==========
    getLearningSummary(days = 7) {
        return this.request(`/api/learning/${getUserId()}/summary?days=${days}`);
    },
    getSubjectStats(days = 14) {
        return this.request(`/api/learning/${getUserId()}/subject-stats?days=${days}`);
    },
    getReviewProgress() {
        return this.request(`/api/learning/${getUserId()}/review-progress`);
    },
    getTodayTasks() {
        return this.request(`/api/learning/${getUserId()}/today-tasks`);
    },
    getDurationStats() {
        return this.request(`/api/learning/${getUserId()}/duration-stats`);
    },
    // AI学情分析 - 每日学习序列
    getLearningDailySeries(days, subject) {
        const p = [];
        if (days) p.push('days=' + days);
        if (subject && subject !== '全部') p.push('subject=' + encodeURIComponent(subject));
        const q = p.length ? '?' + p.join('&') : '';
        return this.request(`/api/learning/${getUserId()}/daily-series${q}`);
    },
    // AI学情分析 - 学科掌握（能力雷达）
    getSubjectMastery(days) {
        return this.request(`/api/learning/${getUserId()}/subject-mastery?days=${days || 30}`);
    },
    // AI学情分析 - 答题趋势序列
    getAnswerTrend(days) {
        return this.request(`/api/answers/${getUserId()}/trend-series?days=${days || 14}`);
    },
    // AI学情分析 - 失分归因 Top N
    getLossAnalysis(days, limit) {
        const p = [];
        if (days) p.push('days=' + days);
        if (limit) p.push('limit=' + limit);
        const q = p.length ? '?' + p.join('&') : '';
        return this.request(`/api/answers/${getUserId()}/loss-analysis${q}`);
    },
    // AI学情分析 - 成绩趋势预测
    getPredictScoreTrend(days) {
        return this.request(`/api/predict/${getUserId()}/score-trend?days=${days || 60}`);
    },
    // 通用页面数据加载（API优先，失败时回退到静态JSON文件，确保离线可用）
    async getPageData(pageKey) {
        // 优先尝试后端 API
        try {
            var data = await this.request(`/api/page-data/${pageKey}`);
            if (data) return data;
        } catch (e) { /* API 不可用，继续回退 */ }
        // 回退：加载静态 JSON 文件（适用于 Cloudflare Pages 等静态部署，加时间戳防缓存）
        try {
            var res = await fetch(`data/pages/${pageKey}.json?t=${Date.now()}`);
            if (res.ok) return await res.json();
        } catch (e) { /* 静态文件也不可用 */ }
        return null;
    },
    // 通用页面数据保存
    savePageData(pageKey, data) {
        return this.request(`/api/page-data/${pageKey}`, {
            method: 'PUT',
            body: JSON.stringify({ data: data })
        });
    },

    // ========== AI模型中心 专用接口 ==========
    // 获取模型中心数据（含动态运行状态）
    async getAiModelCenter() {
        try {
            const data = await this.request('/api/ai/model-center');
            if (data) return data;
        } catch (e) { /* 专用接口不可用，回退 */ }
        return this.getPageData('ai-model-center');
    },
    // 模型连通性/能力测试
    testAiModel(modelName, testType) {
        return this.request('/api/ai/model-center/test', {
            method: 'POST',
            body: JSON.stringify({ model_name: modelName, test_type: testType || 'connectivity' })
        });
    },

    // ========== AI学习中心 专用接口 ==========
    // AI学习教练（含动态今日日期）
    async getAiModuleCoach() {
        try {
            const data = await this.request('/api/ai-module/coach');
            if (data) return data;
        } catch (e) { /* 回退 */ }
        return this.getPageData('ai-module-coach');
    },
    // AI讲题引擎
    async getAiModuleExplain() {
        try {
            const data = await this.request('/api/ai-module/explain');
            if (data) return data;
        } catch (e) { /* 回退 */ }
        return this.getPageData('ai-module-explain');
    },
    // AI组卷引擎（含动态生成时间）
    async getAiModulePaper() {
        try {
            const data = await this.request('/api/ai-module/paper');
            if (data) return data;
        } catch (e) { /* 回退 */ }
        return this.getPageData('ai-module-paper');
    },
    // AI知识图谱
    async getAiModuleGraph() {
        try {
            const data = await this.request('/api/ai-module/graph');
            if (data) return data;
        } catch (e) { /* 回退 */ }
        return this.getPageData('ai-module-graph');
    },
    // AI预测高考（含动态距高考天数）
    async getAiModulePredict() {
        try {
            const data = await this.request('/api/ai-module/predict');
            if (data) return data;
        } catch (e) { /* 回退 */ }
        return this.getPageData('ai-module-predict');
    },

    // ========== 志愿填报 专用接口 ==========
    // AI院校推荐（含个性化录取概率）
    async getCollegeRecommend() {
        try {
            const data = await this.request(`/api/college/recommend?user_id=${getUserId()}`);
            if (data) return data;
        } catch (e) { /* 回退 */ }
        return this.getPageData('college-recommend');
    },
    // 专业推荐
    async getCollegeMajor() {
        try {
            const data = await this.request('/api/college/major');
            if (data) return data;
        } catch (e) { /* 回退 */ }
        return this.getPageData('college-major');
    },
    // 位次分析
    async getCollegeRank() {
        try {
            const data = await this.request('/api/college/rank');
            if (data) return data;
        } catch (e) { /* 回退 */ }
        return this.getPageData('college-rank');
    },
    // 保存用户调整的推荐条件
    saveCollegeConditions(conditions) {
        return this.request('/api/college/recommend/conditions', {
            method: 'PUT',
            body: JSON.stringify({ user_id: getUserId(), conditions: conditions })
        });
    },
    // 教师上传试卷
    uploadPaper(formData) {
        return this.request('/api/teacher/upload', {
            method: 'POST',
            body: formData,
            headers: {}  // 让浏览器自动设置 multipart Content-Type
        });
    },

    // ========== 答题 ==========
    submitAnswer(questionId, userAnswer, timeCostSec) {
        return this.request('/api/answers', {
            method: 'POST',
            body: JSON.stringify({
                user_id: getUserId(),
                question_id: questionId,
                user_answer: userAnswer,
                time_cost_sec: timeCostSec
            })
        });
    },
    submitAnswersBatch(records) {
        return this.request('/api/answers/batch', {
            method: 'POST',
            body: JSON.stringify({ user_id: getUserId(), records })
        });
    },
    getAnswerStats(days = 30) {
        return this.request(`/api/answers/${getUserId()}/stats?days=${days}`);
    },

    // ========== AI推荐 ==========
    getRecommendQuestions(count = 10, subject) {
        const q = subject ? `&subject=${encodeURIComponent(subject)}` : '';
        return this.request(`/api/recommend/${getUserId()}/questions?count=${count}${q}`);
    },
    getRecommendPaper(count = 15, subjects) {
        const q = subjects ? `&subjects=${encodeURIComponent(subjects)}` : '';
        return this.request(`/api/recommend/${getUserId()}/paper?count=${count}${q}`);
    },
    getRecommendPlan(availableMinutes = 120) {
        return this.request(`/api/recommend/${getUserId()}/plan?available_minutes=${availableMinutes}`);
    },
    getWeekPlan(shuffle, range) {
        const params = [];
        if (shuffle) params.push('shuffle=1');
        if (range && ['this_week', 'next_week', 'this_month'].includes(range)) {
            params.push('range=' + range);
        }
        const q = params.length ? '?' + params.join('&') : '';
        return this.request(`/api/recommend/${getUserId()}/week-plan${q}`);
    },

    // ========== 模考预测 ==========
    getPredictScore() {
        return this.request(`/api/predict/${getUserId()}/score`);
    },
    getPredictRank() {
        return this.request(`/api/predict/${getUserId()}/rank`);
    },
    getPredictReport() {
        return this.request(`/api/predict/${getUserId()}/report`);
    },

    // ========== 首页模块配置（动态编辑）==========
    getAllModuleConfigs() {
        return this.request('/api/modules');
    },
    getModuleConfig(key) {
        return this.request(`/api/modules/${key}`);
    },
    saveModuleConfig(key, config) {
        return this.request(`/api/modules/${key}`, {
            method: 'PUT',
            body: JSON.stringify({ config })
        });
    },
    saveAllModuleConfigs(modules) {
        return this.request('/api/modules', {
            method: 'PUT',
            body: JSON.stringify({ modules })
        });
    },
    resetModuleConfig(key) {
        return this.request(`/api/modules/${key}`, { method: 'DELETE' });
    },
    importModuleData(key, format, data) {
        return this.request(`/api/modules/${key}/import`, {
            method: 'POST',
            body: JSON.stringify({ format, data })
        });
    }
};
