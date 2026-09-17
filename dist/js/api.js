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
            const headers = { 'Content-Type': 'application/json', ...options.headers };
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
    // SSE 实时状态推送 URL（供 EventSource 使用）
    // 本地后端为长连接 SSE；Cloudflare Pages 无状态，单次推送后关闭，前端会自动降级到轮询
    wechatQrcodeStreamUrl(sceneId) {
        return `${API_BASE}/api/auth/wechat-qrcode-stream?scene_id=${encodeURIComponent(sceneId)}`;
    },
    // 同 scene 刷新二维码（重置状态与过期时间，保留 scene_id）
    wechatQrcodeRefresh(sceneId) {
        return this.request('/api/auth/wechat-qrcode-refresh', {
            method: 'POST',
            body: JSON.stringify({ scene_id: sceneId })
        });
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
    // 学习日序列（AI学情分析 → 成绩趋势 tab 柱状图）
    getLearningDailySeries(days = 7, subject) {
        const params = [`days=${days}`];
        if (subject && subject !== '全部') params.push(`subject=${encodeURIComponent(subject)}`);
        return this.request(`/api/learning/${getUserId()}/daily-series?${params.join('&')}`);
    },
    // 学科掌握雷达（AI学情分析 → 能力雷达 tab）
    getSubjectMastery(days = 30) {
        return this.request(`/api/learning/${getUserId()}/subject-mastery?days=${days}`);
    },
    // 答题趋势（AI学情分析 → 成绩趋势 tab）
    getAnswerTrend(days = 14) {
        return this.request(`/api/answers/${getUserId()}/trend-series?days=${days}`);
    },
    // 失分归因（AI学情分析 → 失分归因 tab）
    getLossAnalysis(days = 30, limit = 8) {
        return this.request(`/api/answers/${getUserId()}/loss-analysis?days=${days}&limit=${limit}`);
    },
    // 成绩预测趋势（AI学情分析 → AI报告 tab）
    getPredictScoreTrend(days = 60) {
        return this.request(`/api/predict/${getUserId()}/score-trend?days=${days}`);
    },
    // 通用页面数据加载
    getPageData(pageKey) {
        return this.request(`/api/page-data/${pageKey}`);
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
    },

    // ========== 会员权益 ==========
    getMembership() {
        return this.request(`/api/users/${getUserId()}/membership`);
    },
    updateMembership(vipLevel, vipExpire, orderId) {
        const body = { vip_level: vipLevel };
        if (vipExpire) body.vip_expire = vipExpire;
        if (orderId) body.order_id = orderId;
        return this.request(`/api/users/${getUserId()}/membership`, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    },
    getMembershipLogs(limit = 20) {
        return this.request(`/api/users/${getUserId()}/membership/logs?limit=${limit}`);
    },

    // ========== 收藏 ==========
    getFavorites(type, subject, page = 1, size = 20) {
        const params = new URLSearchParams();
        if (type) params.set('type', type);
        if (subject) params.set('subject', subject);
        params.set('page', page);
        params.set('size', size);
        return this.request(`/api/favorites/${getUserId()}?${params}`);
    },
    addFavorite(type, targetId, subject, note) {
        const body = { type, target_id: targetId };
        if (subject) body.subject = subject;
        if (note) body.note = note;
        return this.request('/api/favorites', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    },
    checkFavorite(type, targetId) {
        return this.request(`/api/favorites/${getUserId()}/check?type=${type}&target_id=${encodeURIComponent(targetId)}`);
    },
    removeFavorite(favoriteId) {
        return this.request(`/api/favorites/${favoriteId}`, { method: 'DELETE' });
    },
    batchRemoveFavorites(favoriteIds) {
        return this.request('/api/favorites/batch-remove', {
            method: 'POST',
            body: JSON.stringify({ favorite_ids: favoriteIds })
        });
    },
    getFavoriteStats() {
        return this.request(`/api/favorites/${getUserId()}/stats`);
    }
};

// ========== APP 本地缓存工具：题目缓存 ==========
// 会员登录后，部分题目缓存在 APP 本地，加速展示并支持离线浏览
const Cache = {
    KEY_PREFIX: 'aigaokao_qcache_',
    INDEX_KEY: 'aigaokao_qcache_index',
    MAX_PER_SUBJECT: 50,    // 每科最多缓存 50 道
    TTL_MS: 24 * 60 * 60 * 1000,  // 24 小时

    _readIndex() {
        try { return JSON.parse(localStorage.getItem(this.INDEX_KEY) || '[]'); }
        catch { return []; }
    },
    _writeIndex(idx) {
        localStorage.setItem(this.INDEX_KEY, JSON.stringify(idx));
    },

    // 写入一道题到缓存
    putQuestion(question) {
        if (!question || !question.id || !question.subject) return;
        const key = this.KEY_PREFIX + question.subject + '_' + question.id;
        try {
            localStorage.setItem(key, JSON.stringify({
                data: question,
                cached_at: Date.now()
            }));
        } catch (e) {
            // localStorage 空间满，清理最旧的
            this._evictOldest(10);
            try { localStorage.setItem(key, JSON.stringify({ data: question, cached_at: Date.now() })); } catch {}
        }
        // 维护索引：subject + id
        const idx = this._readIndex();
        const sig = question.subject + '|' + question.id;
        if (!idx.includes(sig)) {
            idx.push(sig);
            this._writeIndex(idx);
        }
        // 每科上限
        this._enforceSubjectLimit(question.subject);
    },
    putQuestions(list) {
        if (!Array.isArray(list)) return;
        list.forEach(q => this.putQuestion(q));
    },
    // 读取一道缓存题
    getQuestion(subject, questionId) {
        const key = this.KEY_PREFIX + subject + '_' + questionId;
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            const obj = JSON.parse(raw);
            // TTL 过期清理
            if (Date.now() - obj.cached_at > this.TTL_MS) {
                localStorage.removeItem(key);
                return null;
            }
            return obj.data;
        } catch { return null; }
    },
    // 取某科所有缓存题
    getQuestionsBySubject(subject) {
        const idx = this._readIndex();
        const list = [];
        idx.forEach(sig => {
            const [s, qid] = sig.split('|');
            if (s === subject) {
                const q = this.getQuestion(s, qid);
                if (q) list.push(q);
            }
        });
        return list;
    },
    // 是否已缓存
    hasQuestion(subject, questionId) {
        return !!this.getQuestion(subject, questionId);
    },
    // 清理某科最旧的 N 条
    _evictOldest(n) {
        const idx = this._readIndex();
        const withTime = idx.map(sig => {
            const [s, qid] = sig.split('|');
            const key = this.KEY_PREFIX + s + '_' + qid;
            try {
                const obj = JSON.parse(localStorage.getItem(key) || '{}');
                return { sig, t: obj.cached_at || 0 };
            } catch { return { sig, t: 0 }; }
        });
        withTime.sort((a, b) => a.t - b.t);
        const toRemove = withTime.slice(0, n);
        toRemove.forEach(item => {
            const [s, qid] = item.sig.split('|');
            localStorage.removeItem(this.KEY_PREFIX + s + '_' + qid);
        });
        const remaining = idx.filter(sig => !toRemove.find(t => t.sig === sig));
        this._writeIndex(remaining);
    },
    _enforceSubjectLimit(subject) {
        const idx = this._readIndex();
        const subjectItems = idx.filter(sig => sig.startsWith(subject + '|'));
        if (subjectItems.length > this.MAX_PER_SUBJECT) {
            // 按时间清理超出部分
            const toEvict = subjectItems.length - this.MAX_PER_SUBJECT;
            this._evictOldest(toEvict);
        }
    },
    // 清空所有题目缓存
    clearAll() {
        const idx = this._readIndex();
        idx.forEach(sig => {
            const [s, qid] = sig.split('|');
            localStorage.removeItem(this.KEY_PREFIX + s + '_' + qid);
        });
        localStorage.removeItem(this.INDEX_KEY);
    },
    // 缓存统计
    stats() {
        const idx = this._readIndex();
        const bySubject = {};
        idx.forEach(sig => {
            const s = sig.split('|')[0];
            bySubject[s] = (bySubject[s] || 0) + 1;
        });
        return { total: idx.length, by_subject: bySubject };
    }
};

// ========== APP 本地设置：界面设置 ==========
// 持久化用户偏好（主题、字号、夜间模式、学习提醒等）
const Settings = {
    KEY: 'aigaokao_settings',
    DEFAULTS: {
        theme: 'light',           // light | dark | auto
        font_size: 'medium',      // small | medium | large
        night_mode: false,        // 夜间模式开关
        accent_color: 'blue',    // blue | green | purple | orange
        study_reminder: true,     // 学习提醒开关
        reminder_time: '20:00',  // 提醒时间
        auto_play_audio: false,  // 自动播放讲解音频
        show_answer_immediately: false,  // 做题时立即显示答案
        language: 'zh-CN'
    },
    _load() {
        try {
            const raw = localStorage.getItem(this.KEY);
            if (!raw) return { ...this.DEFAULTS };
            return { ...this.DEFAULTS, ...JSON.parse(raw) };
        } catch { return { ...this.DEFAULTS }; }
    },
    _save(settings) {
        localStorage.setItem(this.KEY, JSON.stringify(settings));
    },
    get(key) {
        const s = this._load();
        return key ? s[key] : s;
    },
    set(key, value) {
        const s = this._load();
        s[key] = value;
        this._save(s);
        // 通知 UI 即时响应
        try {
            window.dispatchEvent(new CustomEvent('settings:change', { detail: { key, value, settings: s } }));
        } catch {}
        return s;
    },
    update(patch) {
        const s = this._load();
        const merged = { ...s, ...patch };
        this._save(merged);
        try {
            window.dispatchEvent(new CustomEvent('settings:change', { detail: { settings: merged } }));
        } catch {}
        return merged;
    },
    reset() {
        this._save({ ...this.DEFAULTS });
        try {
            window.dispatchEvent(new CustomEvent('settings:change', { detail: { settings: this.DEFAULTS } }));
        } catch {}
    },
    // 应用主题到 documentElement（在 HTML 中可直接调用）
    applyTheme() {
        const s = this._load();
        const root = document.documentElement;
        root.setAttribute('data-theme', s.theme);
        root.setAttribute('data-font-size', s.font_size);
        root.classList.toggle('night-mode', s.night_mode || s.theme === 'dark');
        root.setAttribute('data-accent', s.accent_color);
    }
};
