// ============================================================
// 登录注册模块 - pages-login.js
// ============================================================

// 验证码倒计时（全局复用）
function startSmsCountdown(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn || btn.dataset.counting === '1') return;
    
    // 获取手机号（根据按钮所在页面判断）
    let phoneInput;
    if (btnId === 'sms-code-btn') {
        phoneInput = document.getElementById('sms-phone-input');
    } else if (btnId === 'parent-code-btn') {
        phoneInput = document.getElementById('bind-parent-phone-input');
    } else if (btnId === 'forgot-code-btn') {
        phoneInput = document.getElementById('forgot-phone-input');
    }
    
    const phone = phoneInput ? phoneInput.value.trim() : '';
    if (!phone || !/^1\d{10}$/.test(phone)) {
        openModal('提示', '<p style="text-align:center;padding:20px;">请先输入正确的11位手机号</p>');
        return;
    }
    
    // 调用后端API发送验证码
    fetch('/api/auth/sms-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
    })
    .then(r => r.json())
    .then(data => {
        if (data.code === 0) {
            // 确定验证码输入框ID
            const codeInputId = btnId === 'sms-code-btn' ? 'sms-code-input' :
                               btnId === 'parent-code-btn' ? 'parent-code-input' : null;

            // 演示模式：后端返回 data.code，弹窗显示便于测试
            // 生产模式（阿里云）：不返回 data.code，仅 toast 提示
            if (data.data && data.data.code) {
                openModal('验证码已发送（演示模式）', `
                    <div style="text-align:center;padding:20px;">
                        <div style="font-size:13px;color:#6B7280;margin-bottom:8px;">验证码已发送到 ${phone}</div>
                        <div style="font-size:36px;font-weight:800;color:#3B82F6;letter-spacing:8px;margin:16px 0;">${data.data.code}</div>
                        <div style="font-size:12px;color:#9CA3AF;">有效期5分钟，请在下方输入</div>
                        <button class="proto-btn proto-btn-primary" style="margin-top:16px;height:40px;border-radius:20px;" onclick="closeModal();${codeInputId ? `setTimeout(function(){var inp=document.getElementById('${codeInputId}');if(inp){inp.focus();inp.scrollIntoView({block:'center'});}},50);` : ''}">知道了</button>
                    </div>
                `);
            } else {
                if (typeof showToast === 'function') {
                    showToast('验证码已发送到 ' + phone, 'success');
                } else {
                    openModal('已发送', '<p style="text-align:center;padding:20px;">验证码已发送到 ' + phone + '</p>');
                }
            }

            // 开始倒计时
            let seconds = 60;
            btn.dataset.counting = '1';
            btn.style.color = '#9CA3AF';
            btn.style.pointerEvents = 'none';
            const original = btn.textContent;
            btn.textContent = seconds + 's 后重发';
            const timer = setInterval(() => {
                seconds--;
                if (seconds <= 0) {
                    clearInterval(timer);
                    btn.dataset.counting = '0';
                    btn.textContent = '获取验证码';
                    btn.style.color = '';
                    btn.style.pointerEvents = '';
                } else {
                    btn.textContent = seconds + 's 后重发';
                }
            }, 1000);
        } else {
            openModal('发送失败', `<p style="text-align:center;padding:20px;color:#EF4444;">${data.msg || '验证码发送失败，请稍后重试'}</p>`);
        }
    })
    .catch(err => {
        openModal('发送失败', '<p style="text-align:center;padding:20px;color:#EF4444;">网络错误，请检查服务器是否启动</p>');
    });
}

// 手机验证码登录：调用后端 /api/auth/sms-login，写入 session 后跳转首页
async function handleProtoSmsLogin() {
    const phoneInput = document.getElementById('sms-phone-input');
    const codeInput = document.getElementById('sms-code-input');
    const btn = document.getElementById('proto-sms-login-btn');
    if (!phoneInput || !codeInput) {
        openModal('提示', '<p style="text-align:center;padding:20px;">表单元素缺失</p>');
        return;
    }
    const phone = phoneInput.value.trim();
    const code = codeInput.value.trim();
    if (!phone || !/^1\d{10}$/.test(phone)) {
        openModal('提示', '<p style="text-align:center;padding:20px;">请输入正确的11位手机号</p>');
        return;
    }
    if (!code) {
        openModal('提示', '<p style="text-align:center;padding:20px;">请输入验证码</p>');
        return;
    }

    // 防重复提交
    if (btn && btn.dataset.busy === '1') return;
    if (btn) {
        btn.dataset.busy = '1';
        btn.textContent = '登录中...';
        btn.style.pointerEvents = 'none';
        btn.style.opacity = '0.7';
    }

    try {
        const data = await api.smsLogin(phone, code);
        // api.request 在 code!==0 时 throw 并返回 null；成功时返回 data.data 子对象
        // 因此 data 存在即代表登录成功，且 data 已是 {token, user_id, user, ...} 结构
        if (data && data.token) {
            if (typeof Auth !== 'undefined' && Auth.setSession) {
                Auth.setSession(data.token, data.user_id, data.user || null);
            }
            if (typeof showToast === 'function') {
                showToast('登录成功，欢迎 ' + ((data.user && data.user.name) || phone), 'success');
            }
            // 恢复按钮状态
            if (btn) { btn.dataset.busy = '0'; btn.textContent = '登 录'; btn.style.pointerEvents = ''; btn.style.opacity = ''; }
            setTimeout(() => navigateTo('home'), 400);
        } else {
            if (btn) { btn.dataset.busy = '0'; btn.textContent = '登 录'; btn.style.pointerEvents = ''; btn.style.opacity = ''; }
            openModal('登录失败', '<p style="text-align:center;padding:20px;color:#EF4444;">验证码错误或已过期</p>');
        }
    } catch (e) {
        if (btn) { btn.dataset.busy = '0'; btn.textContent = '登 录'; btn.style.pointerEvents = ''; btn.style.opacity = ''; }
        openModal('登录失败', '<p style="text-align:center;padding:20px;color:#EF4444;">网络错误：' + (e && e.message || '') + '</p>');
    }
}

// 联系客服弹窗
function showCustomerService() {
    openModal('联系客服', `
        <div style="text-align:center;padding:8px 0 12px;">
            <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#1D4ED8);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
                <i class="fas fa-headset" style="font-size:30px;color:white;"></i>
            </div>
            <div style="font-size:16px;font-weight:700;margin-bottom:4px;">AI高考客服中心</div>
            <div style="font-size:12px;color:#9CA3AF;">7×24小时为您服务</div>
        </div>

        <!-- 客服联系方式 -->
        <div style="background:#F9FAFB;border-radius:12px;overflow:hidden;margin-bottom:14px;">
            <div onclick="copyText('400-888-6688', '客服热线')" style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid #E5E7EB;cursor:pointer;">
                <div style="width:36px;height:36px;border-radius:10px;background:#EFF6FF;display:flex;align-items:center;justify-content:center;margin-right:12px;flex-shrink:0;">
                    <i class="fas fa-phone-alt" style="color:#3B82F6;font-size:16px;"></i>
                </div>
                <div style="flex:1;">
                    <div style="font-size:14px;font-weight:600;color:#111827;">客服热线</div>
                    <div style="font-size:12px;color:#6B7280;margin-top:2px;">400-888-6688（点击复制）</div>
                </div>
                <i class="fas fa-chevron-right" style="color:#9CA3AF;font-size:12px;"></i>
            </div>

            <div onclick="copyText('aigaokao_support', '微信公众号')" style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid #E5E7EB;cursor:pointer;">
                <div style="width:36px;height:36px;border-radius:10px;background:#E8F5E9;display:flex;align-items:center;justify-content:center;margin-right:12px;flex-shrink:0;">
                    <i class="fab fa-weixin" style="color:#07C160;font-size:18px;"></i>
                </div>
                <div style="flex:1;">
                    <div style="font-size:14px;font-weight:600;color:#111827;">微信公众号</div>
                    <div style="font-size:12px;color:#6B7280;margin-top:2px;">aigaokao_support（点击复制）</div>
                </div>
                <i class="fas fa-chevron-right" style="color:#9CA3AF;font-size:12px;"></i>
            </div>

            <div onclick="copyText('support@aigaokao.com', '客服邮箱')" style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid #E5E7EB;cursor:pointer;">
                <div style="width:36px;height:36px;border-radius:10px;background:#FFF7ED;display:flex;align-items:center;justify-content:center;margin-right:12px;flex-shrink:0;">
                    <i class="fas fa-envelope" style="color:#F59E0B;font-size:16px;"></i>
                </div>
                <div style="flex:1;">
                    <div style="font-size:14px;font-weight:600;color:#111827;">客服邮箱</div>
                    <div style="font-size:12px;color:#6B7280;margin-top:2px;">support@aigaokao.com（点击复制）</div>
                </div>
                <i class="fas fa-chevron-right" style="color:#9CA3AF;font-size:12px;"></i>
            </div>

            <div onclick="copyText('aigaokao_qq', 'QQ群')" style="display:flex;align-items:center;padding:14px 16px;cursor:pointer;">
                <div style="width:36px;height:36px;border-radius:10px;background:#FEF2F2;display:flex;align-items:center;justify-content:center;margin-right:12px;flex-shrink:0;">
                    <i class="fab fa-qq" style="color:#EF4444;font-size:18px;"></i>
                </div>
                <div style="flex:1;">
                    <div style="font-size:14px;font-weight:600;color:#111827;">QQ用户群</div>
                    <div style="font-size:12px;color:#6B7280;margin-top:2px;">123456789（点击复制）</div>
                </div>
                <i class="fas fa-chevron-right" style="color:#9CA3AF;font-size:12px;"></i>
            </div>
        </div>

        <!-- 在线咨询按钮 -->
        <button class="proto-btn proto-btn-primary" style="height:44px;border-radius:22px;display:flex;align-items:center;justify-content:center;gap:8px;" onclick="startOnlineChat()">
            <i class="fas fa-comments"></i> 开始在线咨询
        </button>

        <div style="text-align:center;margin-top:12px;font-size:11px;color:#9CA3AF;">
            <i class="fas fa-clock"></i> 工作时间：周一至周日 9:00-22:00
        </div>
    `);
}

// 复制文本到剪贴板
function copyText(text, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function() {
            openModal('已复制', '<p style="text-align:center;padding:20px;color:#10B981;"><i class="fas fa-check-circle" style="font-size:36px;margin-bottom:8px;"></i><br>' + label + '已复制到剪贴板<br><span style="color:#3B82F6;font-weight:600;">' + text + '</span></p>');
        }).catch(function() {
            fallbackCopy(text, label);
        });
    } else {
        fallbackCopy(text, label);
    }
}

function fallbackCopy(text, label) {
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        openModal('已复制', '<p style="text-align:center;padding:20px;color:#10B981;"><i class="fas fa-check-circle" style="font-size:36px;margin-bottom:8px;"></i><br>' + label + '已复制到剪贴板<br><span style="color:#3B82F6;font-weight:600;">' + text + '</span></p>');
    } catch (err) {
        openModal('复制失败', '<p style="text-align:center;padding:20px;color:#EF4444;">请手动复制：<br><span style="color:#3B82F6;font-weight:600;">' + text + '</span></p>');
    }
    document.body.removeChild(textarea);
}

// 开始在线咨询（模拟）
function startOnlineChat() {
    closeModal();
    setTimeout(function() {
        openModal('在线咨询', `
            <div style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border-radius:12px;padding:16px;margin-bottom:14px;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:40px;height:40px;border-radius:50%;background:white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(59,130,246,0.2);">
                        <i class="fas fa-robot" style="color:#3B82F6;font-size:18px;"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="font-size:14px;font-weight:700;color:#1E40AF;">AI智能客服小助手</div>
                        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                            <span style="width:6px;height:6px;border-radius:50%;background:#10B981;"></span>
                            <span style="font-size:11px;color:#059669;">在线 · 平均响应 1 分钟</span>
                        </div>
                    </div>
                </div>
            </div>

            <div style="background:#F3F4F6;border-radius:12px;padding:12px 14px;margin-bottom:12px;max-width:80%;">
                <div style="font-size:13px;color:#374151;line-height:1.6;">您好！我是AI高考智能客服，很高兴为您服务～</div>
                <div style="font-size:10px;color:#9CA3AF;margin-top:4px;">${new Date().toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit'})}</div>
            </div>

            <div style="background:#F3F4F6;border-radius:12px;padding:12px 14px;margin-bottom:14px;max-width:80%;">
                <div style="font-size:13px;color:#374151;line-height:1.6;">请问您需要什么帮助？常见问题：</div>
                <div style="margin-top:8px;display:flex;flex-direction:column;gap:6px;">
                    <div onclick="navigateTo('home')" style="background:white;padding:8px 12px;border-radius:8px;font-size:12px;color:#3B82F6;cursor:pointer;border:1px solid #E5E7EB;">如何完成账号注册？</div>
                    <div onclick="navigateTo('home')" style="background:white;padding:8px 12px;border-radius:8px;font-size:12px;color:#3B82F6;cursor:pointer;border:1px solid #E5E7EB;">家长绑定流程说明</div>
                    <div onclick="navigateTo('home')" style="background:white;padding:8px 12px;border-radius:8px;font-size:12px;color:#3B82F6;cursor:pointer;border:1px solid #E5E7EB;">VIP会员权益介绍</div>
                    <div onclick="navigateTo('home')" style="background:white;padding:8px 12px;border-radius:8px;font-size:12px;color:#3B82F6;cursor:pointer;border:1px solid #E5E7EB;">联系人工客服</div>
                </div>
            </div>

            <div style="display:flex;gap:8px;">
                <input class="proto-input" placeholder="请输入您的问题..." style="flex:1;border:1.5px solid #E5E7EB;border-radius:22px;padding:10px 16px;font-size:13px;background:white;outline:none;">
                <button class="proto-btn proto-btn-primary" style="width:60px;height:38px;border-radius:19px;flex-shrink:0;" onclick="closeModal()">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        `);
    }, 100);
}

// 勾选协议
function toggleAgree(el) {
    const box = el.querySelector('.agree-box');
    if (box) box.classList.toggle('checked');
}

// 选择与学生关系
function selectRelation(el) {
    const group = el.parentElement;
    group.querySelectorAll('.relation-chip').forEach(chip => {
        chip.classList.remove('active');
        chip.style.background = '#F9FAFB';
        chip.style.color = '#6B7280';
        chip.style.border = '1.5px solid #E5E7EB';
    });
    el.classList.add('active');
    el.style.background = '#EFF6FF';
    el.style.color = '#2563EB';
    el.style.border = '1.5px solid #3B82F6';
}

// 用户协议弹窗
function showUserAgreement() {
    openModal('用户协议', `
        <p style="margin-bottom:12px;"><strong>欢迎您使用高分AI-AI高考智能提分教练</strong></p>
        <p style="margin-bottom:10px;">本协议是您与AI高考之间就使用本服务所订立的契约。请您仔细阅读本协议全部内容，您勾选"我已阅读并同意"即视为您接受本协议全部条款。</p>
        <p style="margin-bottom:10px;"><strong>一、服务内容</strong></p>
        <p style="margin-bottom:10px;">本服务为高中生提供AI驱动的智能学习辅助，包括但不限于：智能刷题、AI讲题、成绩分析、志愿填报推荐、学习计划制定等功能。</p>
        <p style="margin-bottom:10px;"><strong>二、用户责任</strong></p>
        <p style="margin-bottom:10px;">1. 您应保证注册信息真实、准确；<br>2. 您不得将账号转让、出借给他人使用；<br>3. 您应合理使用本服务，不得利用本服务从事违法活动。</p>
        <p style="margin-bottom:10px;"><strong>三、知识产权</strong></p>
        <p style="margin-bottom:10px;">本服务中的所有内容（包括但不限于题库、AI模型、界面设计）的知识产权归AI高考所有，未经授权不得复制、传播。</p>
        <p><strong>四、免责声明</strong></p>
        <p>本服务提供的AI分析结果仅供参考，不构成最终决策建议。用户应根据自身情况做出判断。</p>
    `);
}

// 隐私政策弹窗
function showPrivacyPolicy() {
    openModal('隐私政策', `
        <p style="margin-bottom:12px;"><strong>我们重视您的隐私</strong></p>
        <p style="margin-bottom:10px;">本隐私政策说明我们如何收集、使用和保护您的个人信息。</p>
        <p style="margin-bottom:10px;"><strong>一、信息收集</strong></p>
        <p style="margin-bottom:10px;">我们可能收集以下信息：<br>1. 手机号（用于账号注册和登录验证）；<br>2. 学习数据（答题记录、成绩信息）；<br>3. 设备信息（用于服务优化）。</p>
        <p style="margin-bottom:10px;"><strong>二、信息使用</strong></p>
        <p style="margin-bottom:10px;">收集的信息将用于：<br>1. 提供个性化学习推荐；<br>2. 改善服务质量；<br>3. 向家长推送学习进度（需您授权绑定）。</p>
        <p style="margin-bottom:10px;"><strong>三、信息保护</strong></p>
        <p style="margin-bottom:10px;">我们采用业界标准的安全措施保护您的信息，未经您授权不会向第三方共享。</p>
        <p><strong>四、信息删除</strong></p>
        <p>您有权随时申请删除账号及相关数据，请联系客服处理。</p>
    `);
}

// 忘记密码弹窗
function showForgotPassword() {
    openModal('找回密码', `
        <p style="margin-bottom:16px;color:#6B7280;">请输入注册时的手机号，我们将发送验证码帮您重置密码。</p>
        <div style="display:flex;align-items:center;gap:10px;background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:8px;padding:0 12px;margin-bottom:14px;">
            <i class="fas fa-mobile-alt" style="color:#9CA3AF;font-size:16px;flex-shrink:0;"></i>
            <input id="forgot-phone-input" class="proto-input" type="tel" maxlength="11" placeholder="请输入手机号" style="border:none;background:transparent;padding:14px 0;font-size:15px;flex:1;outline:none;">
        </div>
        <div style="display:flex;gap:10px;margin-bottom:14px;">
            <input id="forgot-code-input" class="proto-input" type="tel" maxlength="6" placeholder="验证码" style="flex:1;border:1.5px solid #E5E7EB;border-radius:8px;padding:14px 12px;font-size:15px;outline:none;background:#F9FAFB;">
            <button onclick="startSmsCountdown('forgot-code-btn')" id="forgot-code-btn" style="flex-shrink:0;width:120px;background:white;border:1.5px solid #3B82F6;color:#3B82F6;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">获取验证码</button>
        </div>
        <div style="display:flex;align-items:center;gap:10px;background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:8px;padding:0 12px;margin-bottom:18px;">
            <i class="fas fa-lock" style="color:#9CA3AF;font-size:16px;flex-shrink:0;"></i>
            <input class="proto-input" type="password" placeholder="设置新密码" style="border:none;background:transparent;padding:14px 0;font-size:15px;flex:1;outline:none;">
        </div>
        <button class="proto-btn proto-btn-primary" style="height:44px;border-radius:22px;" onclick="closeModal();navigateTo('login');">确认重置</button>
        <div style="text-align:center;margin-top:12px;font-size:12px;color:#9CA3AF;">重置成功后请使用新密码登录</div>
    `);
}

// ============================================================
// 0. 密码注册页
// ============================================================
registerPage('login-register', '密码注册', '登录注册', 'fa-sign-in-alt', () => {
    return Page({
        title: '密码注册',
        back: true,
        content: `
        <div style="padding:32px 24px 24px;min-height:100%;">
            <!-- 标题 -->
            <div style="margin-bottom:24px;">
                <div style="font-size:24px;font-weight:800;">创建账号</div>
                <div style="font-size:13px;color:#6B7280;margin-top:6px;">填写以下信息，开启AI提分之旅</div>
            </div>

            <!-- 表单 -->
            <div style="background:white;border-radius:14px;padding:18px 16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);margin-bottom:16px;">
                <!-- 手机号 -->
                <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">手机号</div>
                <div style="display:flex;align-items:center;gap:10px;background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:8px;padding:0 12px;margin-bottom:14px;">
                    <i class="fas fa-mobile-alt" style="color:#9CA3AF;font-size:15px;flex-shrink:0;"></i>
                    <input id="reg-phone" class="proto-input" type="tel" maxlength="11" placeholder="请输入手机号" style="border:none;background:transparent;padding:14px 0;font-size:15px;flex:1;outline:none;">
                </div>

                <!-- 密码 -->
                <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">设置密码</div>
                <div style="display:flex;align-items:center;gap:10px;background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:8px;padding:0 12px;margin-bottom:6px;">
                    <i class="fas fa-lock" style="color:#9CA3AF;font-size:15px;flex-shrink:0;"></i>
                    <input id="reg-password" class="proto-input" type="password" placeholder="6-20位字母或数字" style="border:none;background:transparent;padding:14px 0;font-size:15px;flex:1;outline:none;">
                    <i class="fas fa-eye-slash" style="color:#9CA3AF;font-size:16px;cursor:pointer;" onclick="togglePwdVisibility(this,'reg-password')"></i>
                </div>
                <div style="font-size:11px;color:#9CA3AF;margin-bottom:14px;">密码需6-20位，支持字母和数字</div>

                <!-- 确认密码 -->
                <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">确认密码</div>
                <div style="display:flex;align-items:center;gap:10px;background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:8px;padding:0 12px;margin-bottom:14px;">
                    <i class="fas fa-lock" style="color:#9CA3AF;font-size:15px;flex-shrink:0;"></i>
                    <input id="reg-password2" class="proto-input" type="password" placeholder="请再次输入密码" style="border:none;background:transparent;padding:14px 0;font-size:15px;flex:1;outline:none;">
                </div>

                <!-- 省份选择 -->
                <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">所在省份</div>
                <select id="reg-province" class="proto-input" style="width:100%;border:1.5px solid #E5E7EB;border-radius:8px;padding:14px 12px;font-size:15px;background:#F9FAFB;margin-bottom:14px;outline:none;appearance:auto;">
                    <option value="">请选择省份</option>
                    <option value="四川">四川</option>
                    <option value="北京">北京</option>
                    <option value="江苏">江苏</option>
                    <option value="山东">山东</option>
                    <option value="广东">广东</option>
                    <option value="河南">河南</option>
                    <option value="湖北">湖北</option>
                    <option value="湖南">湖南</option>
                    <option value="河北">河北</option>
                    <option value="浙江">浙江</option>
                    <option value="安徽">安徽</option>
                    <option value="福建">福建</option>
                    <option value="江西">江西</option>
                    <option value="重庆">重庆</option>
                    <option value="陕西">陕西</option>
                    <option value="辽宁">辽宁</option>
                    <option value="黑龙江">黑龙江</option>
                    <option value="吉林">吉林</option>
                    <option value="山西">山西</option>
                    <option value="云南">云南</option>
                    <option value="贵州">贵州</option>
                    <option value="广西">广西</option>
                    <option value="甘肃">甘肃</option>
                    <option value="内蒙古">内蒙古</option>
                    <option value="新疆">新疆</option>
                    <option value="海南">海南</option>
                    <option value="宁夏">宁夏</option>
                    <option value="青海">青海</option>
                    <option value="西藏">西藏</option>
                    <option value="天津">天津</option>
                    <option value="上海">上海</option>
                </select>

                <!-- 年级选择 -->
                <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">年级</div>
                <div style="display:flex;gap:10px;margin-bottom:14px;" id="reg-grade-group">
                    <div onclick="selectChip(this,'reg-grade-group')" class="reg-chip active" data-val="高三" style="flex:1;text-align:center;padding:10px;border-radius:10px;background:#EFF6FF;color:#2563EB;font-size:13px;font-weight:600;border:1.5px solid #3B82F6;cursor:pointer;">高三</div>
                    <div onclick="selectChip(this,'reg-grade-group')" class="reg-chip" data-val="高二" style="flex:1;text-align:center;padding:10px;border-radius:10px;background:#F9FAFB;color:#6B7280;font-size:13px;font-weight:600;border:1.5px solid #E5E7EB;cursor:pointer;">高二</div>
                    <div onclick="selectChip(this,'reg-grade-group')" class="reg-chip" data-val="高一" style="flex:1;text-align:center;padding:10px;border-radius:10px;background:#F9FAFB;color:#6B7280;font-size:13px;font-weight:600;border:1.5px solid #E5E7EB;cursor:pointer;">高一</div>
                </div>

                <!-- 科目选择 -->
                <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">选科 / 文理科</div>
                <div style="display:flex;gap:10px;margin-bottom:14px;" id="reg-subject-group">
                    <div onclick="selectChip(this,'reg-subject-group')" class="reg-chip active" data-val="理科" style="flex:1;text-align:center;padding:10px;border-radius:10px;background:#EFF6FF;color:#2563EB;font-size:13px;font-weight:600;border:1.5px solid #3B82F6;cursor:pointer;">理科</div>
                    <div onclick="selectChip(this,'reg-subject-group')" class="reg-chip" data-val="文科" style="flex:1;text-align:center;padding:10px;border-radius:10px;background:#F9FAFB;color:#6B7280;font-size:13px;font-weight:600;border:1.5px solid #E5E7EB;cursor:pointer;">文科</div>
                    <div onclick="selectChip(this,'reg-subject-group')" class="reg-chip" data-val="新高考" style="flex:1;text-align:center;padding:10px;border-radius:10px;background:#F9FAFB;color:#6B7280;font-size:13px;font-weight:600;border:1.5px solid #E5E7EB;cursor:pointer;">新高考</div>
                </div>

                <!-- 目标分数 -->
                <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">目标分数</div>
                <div style="display:flex;align-items:center;gap:10px;background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:8px;padding:0 12px;margin-bottom:14px;">
                    <i class="fas fa-bullseye" style="color:#9CA3AF;font-size:15px;flex-shrink:0;"></i>
                    <input id="reg-target-score" class="proto-input" type="number" placeholder="如：650" style="border:none;background:transparent;padding:14px 0;font-size:15px;flex:1;outline:none;">
                </div>

                <!-- 目标院校 -->
                <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">目标院校（选填）</div>
                <div style="display:flex;align-items:center;gap:10px;background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:8px;padding:0 12px;margin-bottom:18px;">
                    <i class="fas fa-university" style="color:#9CA3AF;font-size:15px;flex-shrink:0;"></i>
                    <input id="reg-target-school" class="proto-input" placeholder="如：清华大学" style="border:none;background:transparent;padding:14px 0;font-size:15px;flex:1;outline:none;">
                </div>
            </div>

            <!-- 协议勾选 -->
            <div onclick="toggleAgree(this)" style="display:flex;align-items:center;gap:6px;font-size:12px;color:#6B7280;margin-bottom:18px;">
                <span style="display:inline-flex;width:16px;height:16px;border-radius:50%;border:1.5px solid #D1D5DB;align-items:center;justify-content:center;color:transparent;" class="agree-box">
                    <i class="fas fa-check" style="font-size:9px;"></i>
                </span>
                我已阅读并同意 <span style="color:#3B82F6;cursor:pointer;" onclick="event.stopPropagation();showUserAgreement()">《用户协议》</span> <span style="color:#3B82F6;cursor:pointer;" onclick="event.stopPropagation();showPrivacyPolicy()">《隐私政策》</span>
            </div>

            <!-- 注册按钮 -->
            <button class="proto-btn proto-btn-primary" style="height:48px;font-size:16px;border-radius:24px;" onclick="doRegister()">注 册</button>

            <!-- 底部链接 -->
            <div style="text-align:center;margin-top:20px;font-size:13px;color:#6B7280;">
                已有账号？<span style="color:#3B82F6;cursor:pointer;font-weight:600;" onclick="navigateTo('login')">返回登录</span>
            </div>
        </div>
        `
    });
});

// 密码可见性切换
function togglePwdVisibility(iconEl, inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
        input.type = 'text';
        iconEl.classList.remove('fa-eye-slash');
        iconEl.classList.add('fa-eye');
    } else {
        input.type = 'password';
        iconEl.classList.remove('fa-eye');
        iconEl.classList.add('fa-eye-slash');
    }
}

// 通用选项卡选择
function selectChip(el, groupId) {
    const group = document.getElementById(groupId);
    if (!group) return;
    group.querySelectorAll('.reg-chip').forEach(chip => {
        chip.classList.remove('active');
        chip.style.background = '#F9FAFB';
        chip.style.color = '#6B7280';
        chip.style.border = '1.5px solid #E5E7EB';
    });
    el.classList.add('active');
    el.style.background = '#EFF6FF';
    el.style.color = '#2563EB';
    el.style.border = '1.5px solid #3B82F6';
}

// 获取选中的选项值
function getSelectedChip(groupId) {
    const group = document.getElementById(groupId);
    if (!group) return '';
    const active = group.querySelector('.reg-chip.active');
    return active ? active.getAttribute('data-val') : '';
}

// 执行注册
function doRegister() {
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const password2 = document.getElementById('reg-password2').value;
    const province = document.getElementById('reg-province').value;
    const grade = getSelectedChip('reg-grade-group') || '高三';
    const subject = getSelectedChip('reg-subject-group') || '理科';
    const targetScore = document.getElementById('reg-target-score').value;
    const targetSchool = document.getElementById('reg-target-school').value.trim();

    // 表单验证
    if (!phone || !/^1\d{10}$/.test(phone)) {
        openModal('提示', '<p style="text-align:center;padding:20px;color:#EF4444;">请输入正确的11位手机号</p>');
        return;
    }
    if (!password || password.length < 6 || password.length > 20) {
        openModal('提示', '<p style="text-align:center;padding:20px;color:#EF4444;">密码需6-20位</p>');
        return;
    }
    if (password !== password2) {
        openModal('提示', '<p style="text-align:center;padding:20px;color:#EF4444;">两次密码不一致</p>');
        return;
    }
    if (!province) {
        openModal('提示', '<p style="text-align:center;padding:20px;color:#EF4444;">请选择省份</p>');
        return;
    }

    // 检查协议勾选
    const agreeBox = document.querySelector('.agree-box');
    if (agreeBox && !agreeBox.classList.contains('checked')) {
        openModal('提示', '<p style="text-align:center;padding:20px;color:#EF4444;">请先阅读并同意用户协议和隐私政策</p>');
        return;
    }

    // 调用注册API
    fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: phone,
            password: password,
            name: phone.slice(-4) + '同学',
            province: province,
            grade: grade,
            subject: subject,
            target_score: parseInt(targetScore) || 600,
            target_school: targetSchool || ''
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.code === 0) {
            openModal('注册成功', `
                <div style="text-align:center;padding:20px;">
                    <div style="width:64px;height:64px;border-radius:50%;background:#D1FAE5;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                        <i class="fas fa-check" style="font-size:32px;color:#10B981;"></i>
                    </div>
                    <div style="font-size:18px;font-weight:700;margin-bottom:8px;">恭喜，注册成功！</div>
                    <div style="font-size:13px;color:#6B7280;margin-bottom:20px;">账号：${phone}<br>欢迎开启AI提分之旅</div>
                    <button class="proto-btn proto-btn-primary" style="height:44px;border-radius:22px;width:100%;" onclick="closeModal();navigateTo('login');">返回登录</button>
                </div>
            `);
        } else {
            openModal('注册失败', '<p style="text-align:center;padding:20px;color:#EF4444;">' + (data.msg || '注册失败，该手机号可能已注册') + '</p>');
        }
    })
    .catch(err => {
        openModal('注册失败', '<p style="text-align:center;padding:20px;color:#EF4444;">网络错误，请检查网络连接</p>');
    });
}

// ============================================================
// 1. 登录页
// ============================================================
registerPage('login', '登录', '登录注册', 'fa-sign-in-alt', () => {
    return Page({
        title: '登录',
        navbar: false,
        content: `
        <div style="padding:40px 28px 24px;background:linear-gradient(180deg,#EFF6FF 0%,#FFFFFF 40%);min-height:100%;">
            <!-- Logo -->
            <div style="text-align:center;margin-bottom:32px;">
                <div style="width:84px;height:84px;border-radius:24px;background:linear-gradient(135deg,#3B82F6,#1D4ED8);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;box-shadow:0 12px 28px rgba(59,130,246,0.35);">
                    <i class="fas fa-graduation-cap" style="font-size:40px;color:white;"></i>
                </div>
                <div style="font-size:24px;font-weight:800;letter-spacing:1px;">AI高考</div>
                <div style="font-size:13px;color:#6B7280;margin-top:6px;">AI驱动的智能高考提分系统</div>
            </div>

            <!-- 输入区 -->
            <div style="margin-bottom:18px;">
                <div style="display:flex;align-items:center;gap:10px;background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:8px;padding:0 14px;margin-bottom:14px;">
                    <i class="fas fa-mobile-alt" style="color:#9CA3AF;font-size:16px;flex-shrink:0;"></i>
                    <input class="proto-input" type="tel" maxlength="11" placeholder="请输入手机号" style="border:none;background:transparent;padding:14px 0;font-size:15px;flex:1;outline:none;">
                </div>
                <div style="display:flex;align-items:center;gap:10px;background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:8px;padding:0 14px;">
                    <i class="fas fa-lock" style="color:#9CA3AF;font-size:16px;flex-shrink:0;"></i>
                    <input class="proto-input" type="password" placeholder="请输入密码" style="border:none;background:transparent;padding:14px 0;font-size:15px;flex:1;outline:none;">
                    <i class="fas fa-eye-slash" style="color:#9CA3AF;font-size:16px;flex-shrink:0;cursor:pointer;"></i>
                </div>
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-bottom:18px;">
                <div onclick="toggleAgree(this)" style="display:flex;align-items:center;gap:6px;color:#6B7280;">
                    <span style="display:inline-flex;width:16px;height:16px;border-radius:50%;border:1.5px solid #D1D5DB;align-items:center;justify-content:center;color:transparent;" class="agree-box">
                        <i class="fas fa-check" style="font-size:9px;"></i>
                    </span>
                    我已阅读并同意 <span style="color:#3B82F6;cursor:pointer;" onclick="event.stopPropagation();showUserAgreement()">《用户协议》</span> <span style="color:#3B82F6;cursor:pointer;" onclick="event.stopPropagation();showPrivacyPolicy()">《隐私政策》</span>
                </div>
                <span style="color:#3B82F6;cursor:pointer;" onclick="showForgotPassword()">忘记密码</span>
            </div>

            <!-- 登录按钮 -->
            <button class="proto-btn proto-btn-primary" style="height:48px;font-size:16px;border-radius:24px;" onclick="navigateTo('home')">登 录</button>

            <!-- 分隔线 -->
            <div style="display:flex;align-items:center;margin:24px 0 18px;color:#9CA3AF;font-size:12px;">
                <div style="flex:1;height:1px;background:#E5E7EB;"></div>
                <span style="padding:0 12px;">其他登录方式</span>
                <div style="flex:1;height:1px;background:#E5E7EB;"></div>
            </div>

            <!-- 微信登录 -->
            <button class="proto-btn" style="background:#07C160;color:white;width:100%;height:48px;font-size:16px;border-radius:24px;gap:8px;margin-bottom:12px;" onclick="navigateTo('login-wechat')">
                <i class="fab fa-weixin" style="font-size:20px;"></i> 微信登录
            </button>
            <!-- 扫码登录 -->
            <button class="proto-btn proto-btn-outline" style="width:100%;height:48px;font-size:16px;border-radius:24px;gap:8px;color:#111827;border-color:#D1D5DB;" onclick="navigateTo('login-wechat-qrcode')">
                <i class="fas fa-qrcode" style="font-size:20px;color:#07C160;"></i> 扫码登录
            </button>

            <!-- 底部链接 -->
            <div style="text-align:center;margin-top:28px;font-size:13px;color:#6B7280;">
                <span onclick="navigateTo('login-sms')" style="color:#3B82F6;cursor:pointer;">手机验证码登录</span>
                <span style="margin:0 10px;color:#D1D5DB;">|</span>
                <span>还没有账号？<span style="color:#3B82F6;cursor:pointer;" onclick="navigateTo('login-register')">立即注册</span></span>
            </div>
        </div>
        `
    });
});

// ============================================================
// 2. 微信授权登录
// ============================================================
registerPage('login-wechat', '微信登录', '登录注册', 'fa-sign-in-alt', () => {
    return Page({
        title: '微信登录',
        back: true,
        content: `
        <div style="padding:24px 20px;background:#F7F7F7;min-height:100%;">
            <!-- 微信头部 -->
            <div style="text-align:center;padding:20px 0 28px;">
                <div style="width:72px;height:72px;border-radius:18px;background:#07C160;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(7,193,96,0.3);">
                    <i class="fab fa-weixin" style="font-size:40px;color:white;"></i>
                </div>
                <div style="font-size:13px;color:#6B7280;">微信授权登录</div>
            </div>

            <!-- 申请权限卡片 -->
            <div style="background:white;border-radius:16px;padding:24px 20px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
                <div style="font-size:16px;font-weight:700;margin-bottom:6px;">AI高考 申请获取以下权限</div>
                <div style="font-size:12px;color:#9CA3AF;margin-bottom:20px;">授权后即可使用微信账号登录 AI高考</div>

                <div style="display:flex;align-items:flex-start;padding:14px 0;border-top:1px solid #F3F4F6;">
                    <div style="width:36px;height:36px;border-radius:10px;background:#E8F5E9;display:flex;align-items:center;justify-content:center;margin-right:12px;flex-shrink:0;">
                        <i class="fas fa-user-circle" style="font-size:18px;color:#07C160;"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="font-size:14px;font-weight:600;">获取你的昵称、头像</div>
                        <div style="font-size:12px;color:#9CA3AF;margin-top:2px;">用于完善个人资料，显示学习头像</div>
                    </div>
                    <i class="fas fa-check-circle" style="color:#07C160;font-size:18px;margin-top:8px;"></i>
                </div>

                <div style="display:flex;align-items:flex-start;padding:14px 0;border-top:1px solid #F3F4F6;">
                    <div style="width:36px;height:36px;border-radius:10px;background:#E8F5E9;display:flex;align-items:center;justify-content:center;margin-right:12px;flex-shrink:0;">
                        <i class="fas fa-mobile-alt" style="font-size:16px;color:#07C160;"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="font-size:14px;font-weight:600;">获取你的手机号</div>
                        <div style="font-size:12px;color:#9CA3AF;margin-top:2px;">用于账号绑定与登录验证</div>
                    </div>
                    <i class="fas fa-check-circle" style="color:#07C160;font-size:18px;margin-top:8px;"></i>
                </div>
            </div>

            <!-- 按钮 -->
            <div style="margin-top:24px;">
                <button class="proto-btn" style="background:#07C160;color:white;width:100%;height:48px;font-size:16px;border-radius:24px;" onclick="navigateTo('home')">
                    <i class="fab fa-weixin" style="font-size:20px;"></i> 确认授权
                </button>
                <button class="proto-btn proto-btn-outline" style="margin-top:12px;height:48px;border-radius:24px;" onclick="navigateBack()">拒绝</button>
            </div>

            <div style="text-align:center;margin-top:20px;font-size:11px;color:#9CA3AF;line-height:1.6;">
                授权即表示同意 <span style="color:#3B82F6;cursor:pointer;" onclick="showUserAgreement()">《用户协议》</span> 与 <span style="color:#3B82F6;cursor:pointer;" onclick="showPrivacyPolicy()">《隐私政策》</span><br>
                AI高考 不会向微信好友发送任何消息
            </div>
        </div>
        `
    });
});

// ============================================================
// 2.5 微信扫码登录
// ============================================================
registerPage('login-wechat-qrcode', '扫码登录', '登录注册', 'fa-qrcode', () => {
    return Page({
        title: '扫码登录',
        back: true,
        afterRender: () => { startProtoQrLogin(); },
        content: `
        <div style="padding:28px 20px 24px;background:#F7F7F7;min-height:100%;">
            <!-- 顶部标题 -->
            <div style="text-align:center;margin-bottom:18px;">
                <div style="width:64px;height:64px;border-radius:18px;background:#07C160;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(7,193,96,0.28);">
                    <i class="fas fa-qrcode" style="font-size:30px;color:white;"></i>
                </div>
                <div style="font-size:17px;font-weight:700;color:#111827;">微信扫码登录</div>
                <div style="font-size:12px;color:#6B7280;margin-top:4px;">使用微信扫一扫，快速登录 AI高考</div>
            </div>

            <!-- 二维码卡片 -->
            <div style="background:white;border-radius:18px;padding:22px 18px 18px;box-shadow:0 2px 8px rgba(0,0,0,0.04);text-align:center;">
                <div id="proto-qr-wrap" style="position:relative;display:inline-block;padding:14px;background:#fff;border:1px solid #F3F4F6;border-radius:14px;">
                    <img id="proto-qr-img" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="登录二维码" style="width:220px;height:220px;display:block;border-radius:6px;" onerror="handleProtoQrImgError(this)">
                    <!-- 状态遮罩 -->
                    <div id="proto-qr-mask" style="display:none;position:absolute;inset:14px;background:rgba(255,255,255,0.94);border-radius:10px;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:14px;">
                        <div id="proto-qr-mask-icon" style="font-size:42px;"><i class="fas fa-mobile-alt" style="color:#07C160;"></i></div>
                        <div id="proto-qr-mask-text" style="font-size:14px;font-weight:700;color:#111827;text-align:center;">正在生成二维码...</div>
                    </div>
                </div>
                <div id="proto-qr-tip" style="font-size:15px;font-weight:700;color:#111827;margin-top:14px;">正在生成登录二维码...</div>
                <div id="proto-qr-subtip" style="font-size:12px;color:#6B7280;margin-top:6px;min-height:16px;">
                    二维码 <span id="proto-qr-countdown">300</span>s 后过期，<a href="javascript:void(0)" onclick="refreshProtoQrLogin()" style="color:#07C160;text-decoration:none;">刷新</a>
                </div>
            </div>

            <!-- 演示操作 -->
            <div style="margin-top:18px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:14px;padding:14px 12px;">
                <div style="font-size:12px;font-weight:700;color:#166534;margin-bottom:10px;"><i class="fas fa-vial"></i> 演示模式 · 模拟手机微信操作</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="proto-btn" style="flex:1 1 30%;background:#07C160;color:white;height:38px;border-radius:10px;font-size:13px;" onclick="protoMockQrAction('scan')"><i class="fas fa-mobile-alt"></i> 模拟扫码</button>
                    <button class="proto-btn" style="flex:1 1 30%;background:#16A34A;color:white;height:38px;border-radius:10px;font-size:13px;" onclick="protoMockQrAction('confirm')"><i class="fas fa-check-circle"></i> 模拟确认</button>
                    <button class="proto-btn proto-btn-outline" style="flex:1 1 30%;height:38px;border-radius:10px;font-size:13px;color:#6B7280;border-color:#D1D5DB;" onclick="protoMockQrAction('cancel')"><i class="fas fa-times-circle"></i> 模拟取消</button>
                </div>
            </div>

            <!-- 底部切换 -->
            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:22px;font-size:12px;color:#6B7280;">
                <span onclick="navigateTo('login-wechat')" style="color:#3B82F6;cursor:pointer;"><i class="fab fa-weixin" style="color:#07C160;"></i> 使用微信一键授权</span>
                <span onclick="navigateTo('login')" style="color:#3B82F6;cursor:pointer;">密码登录</span>
            </div>
        </div>
        `
    });
});

// ============================================================
// 3. 手机验证码登录
// ============================================================
registerPage('login-sms', '手机验证码', '登录注册', 'fa-sign-in-alt', () => {
    return Page({
        title: '手机验证码登录',
        back: true,
        content: `
        <div style="padding:32px 24px 20px;min-height:100%;">
            <!-- 标题 -->
            <div style="margin-bottom:28px;">
                <div style="font-size:24px;font-weight:800;">验证码登录</div>
                <div style="font-size:13px;color:#6B7280;margin-top:8px;">未注册的手机号将自动创建账号</div>
            </div>

            <!-- 手机号 -->
            <div style="display:flex;align-items:center;gap:10px;background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:8px;padding:0 14px;margin-bottom:18px;">
                <div style="display:flex;align-items:center;gap:6px;color:#111827;font-size:15px;font-weight:600;flex-shrink:0;border-right:1px solid #E5E7EB;padding-right:10px;">
                    +86 <i class="fas fa-chevron-down" style="font-size:10px;color:#9CA3AF;"></i>
                </div>
                <input id="sms-phone-input" class="proto-input" type="tel" maxlength="11" placeholder="请输入手机号" style="border:none;background:transparent;padding:14px 0;font-size:15px;flex:1;outline:none;">
            </div>

            <!-- 验证码 -->
            <div style="display:flex;gap:10px;margin-bottom:14px;">
                <div style="flex:1;display:flex;align-items:center;gap:10px;background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:8px;padding:0 12px;">
                    <i class="fas fa-shield-alt" style="color:#9CA3AF;font-size:16px;flex-shrink:0;"></i>
                    <input id="sms-code-input" class="proto-input" type="tel" maxlength="6" placeholder="请输入验证码" style="border:none;background:transparent;padding:14px 0;font-size:15px;flex:1;outline:none;">
                </div>
                <button id="sms-code-btn" onclick="startSmsCountdown('sms-code-btn')" style="flex-shrink:0;width:120px;background:white;border:1.5px solid #3B82F6;color:#3B82F6;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">
                    获取验证码
                </button>
            </div>

            <div style="font-size:11px;color:#9CA3AF;margin-bottom:24px;">
                <i class="fas fa-info-circle"></i> 验证码已发送至您的手机，5分钟内有效
            </div>

            <!-- 登录按钮 -->
            <button id="proto-sms-login-btn" class="proto-btn proto-btn-primary" style="height:48px;font-size:16px;border-radius:24px;" onclick="handleProtoSmsLogin()">登 录</button>

            <!-- 其他方式 -->
            <div style="display:flex;align-items:center;margin:28px 0 18px;color:#9CA3AF;font-size:12px;">
                <div style="flex:1;height:1px;background:#E5E7EB;"></div>
                <span style="padding:0 12px;">或</span>
                <div style="flex:1;height:1px;background:#E5E7EB;"></div>
            </div>

            <div style="display:flex;justify-content:center;gap:22px;flex-wrap:wrap;">
                <div onclick="navigateTo('login')" style="text-align:center;cursor:pointer;">
                    <div style="width:46px;height:46px;border-radius:50%;background:#EFF6FF;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;">
                        <i class="fas fa-lock" style="font-size:18px;color:#3B82F6;"></i>
                    </div>
                    <div style="font-size:11px;color:#6B7280;">密码登录</div>
                </div>
                <div onclick="navigateTo('login-wechat')" style="text-align:center;cursor:pointer;">
                    <div style="width:46px;height:46px;border-radius:50%;background:#E8F5E9;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;">
                        <i class="fab fa-weixin" style="font-size:20px;color:#07C160;"></i>
                    </div>
                    <div style="font-size:11px;color:#6B7280;">微信登录</div>
                </div>
                <div onclick="navigateTo('login-wechat-qrcode')" style="text-align:center;cursor:pointer;">
                    <div style="width:46px;height:46px;border-radius:50%;background:#ECFDF5;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;">
                        <i class="fas fa-qrcode" style="font-size:18px;color:#07C160;"></i>
                    </div>
                    <div style="font-size:11px;color:#6B7280;">扫码登录</div>
                </div>
                <div onclick="navigateTo('login-parent-bind')" style="text-align:center;cursor:pointer;">
                    <div style="width:46px;height:46px;border-radius:50%;background:#FFF7ED;display:flex;align-items:center;justify-content:center;margin:0 auto 6px;">
                        <i class="fas fa-users" style="font-size:18px;color:#F59E0B;"></i>
                    </div>
                    <div style="font-size:11px;color:#6B7280;">家长绑定</div>
                </div>
            </div>

            <div style="text-align:center;margin-top:32px;font-size:12px;color:#6B7280;">
                <span onclick="navigateBack()" style="color:#3B82F6;cursor:pointer;">返回密码登录</span>
            </div>
        </div>
        `
    });
});

// ============================================================
// 4. 家长绑定账号
// ============================================================
registerPage('login-parent-bind', '家长绑定', '登录注册', 'fa-sign-in-alt', () => {
    return Page({
        title: '家长绑定',
        back: true,
        content: `
        <div style="padding:24px 20px 20px;min-height:100%;">
            <!-- 说明卡片 -->
            <div style="background:linear-gradient(135deg,#FFF7ED,#FFEDD5);border-radius:14px;padding:16px;margin-bottom:20px;display:flex;align-items:flex-start;gap:12px;">
                <div style="width:36px;height:36px;border-radius:10px;background:#F59E0B;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fas fa-hand-holding-heart" style="color:white;font-size:16px;"></i>
                </div>
                <div>
                    <div style="font-size:14px;font-weight:700;color:#92400E;">绑定孩子账号后可查看学习进度</div>
                    <div style="font-size:12px;color:#B45309;margin-top:4px;line-height:1.5;">家长账号可实时查看孩子的学习数据、成绩趋势与提分情况，陪伴孩子冲刺高考。</div>
                </div>
            </div>

            <!-- 表单 -->
            <div style="background:white;border-radius:14px;padding:18px 16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);margin-bottom:16px;">
                <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">学生账号</div>
                <div style="display:flex;align-items:center;gap:10px;background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:8px;padding:0 12px;margin-bottom:16px;">
                    <i class="fas fa-user-graduate" style="color:#9CA3AF;font-size:15px;flex-shrink:0;"></i>
                    <input class="proto-input" placeholder="请输入孩子的手机号 / 学号" style="border:none;background:transparent;padding:14px 0;font-size:14px;flex:1;outline:none;">
                </div>

                <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:8px;">与学生关系</div>
                <div style="display:flex;gap:10px;margin-bottom:18px;" id="relation-group">
                    <div onclick="selectRelation(this)" class="relation-chip active" style="flex:1;text-align:center;padding:10px;border-radius:10px;background:#EFF6FF;color:#2563EB;font-size:13px;font-weight:600;border:1.5px solid #3B82F6;cursor:pointer;">
                        <i class="fas fa-male"></i> 父亲
                    </div>
                    <div onclick="selectRelation(this)" class="relation-chip" style="flex:1;text-align:center;padding:10px;border-radius:10px;background:#F9FAFB;color:#6B7280;font-size:13px;font-weight:600;border:1.5px solid #E5E7EB;cursor:pointer;">
                        <i class="fas fa-female"></i> 母亲
                    </div>
                    <div onclick="selectRelation(this)" class="relation-chip" style="flex:1;text-align:center;padding:10px;border-radius:10px;background:#F9FAFB;color:#6B7280;font-size:13px;font-weight:600;border:1.5px solid #E5E7EB;cursor:pointer;">
                        <i class="fas fa-user"></i> 其他
                    </div>
                </div>

                <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">家长手机号</div>
                <div style="display:flex;align-items:center;gap:10px;background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:8px;padding:0 12px;margin-bottom:16px;">
                    <i class="fas fa-mobile-alt" style="color:#9CA3AF;font-size:15px;flex-shrink:0;"></i>
                    <input id="bind-parent-phone-input" class="proto-input" type="tel" maxlength="11" placeholder="请输入家长手机号" style="border:none;background:transparent;padding:14px 0;font-size:14px;flex:1;outline:none;">
                </div>

                <div style="font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;">短信验证码</div>
                <div style="display:flex;gap:10px;">
                    <div style="flex:1;display:flex;align-items:center;gap:10px;background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:8px;padding:0 12px;">
                        <i class="fas fa-shield-alt" style="color:#9CA3AF;font-size:15px;flex-shrink:0;"></i>
                        <input id="parent-code-input" class="proto-input" type="tel" maxlength="6" placeholder="请输入验证码" style="border:none;background:transparent;padding:14px 0;font-size:14px;flex:1;outline:none;">
                    </div>
                    <button id="parent-code-btn" onclick="startSmsCountdown('parent-code-btn')" style="flex-shrink:0;width:110px;background:white;border:1.5px solid #3B82F6;color:#3B82F6;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">
                        获取验证码
                    </button>
                </div>
            </div>

            <!-- 提示 -->
            <div style="font-size:11px;color:#9CA3AF;line-height:1.6;margin-bottom:18px;padding:0 4px;">
                <i class="fas fa-info-circle"></i> 绑定后需孩子端确认同意，方可查看学习数据。<br>
                一个家长账号最多可绑定 3 个学生账号。
            </div>

            <!-- 绑定按钮 -->
            <button class="proto-btn proto-btn-primary" style="height:48px;font-size:16px;border-radius:24px;" onclick="navigateTo('home')">
                <i class="fas fa-link"></i> 确认绑定
            </button>

            <div style="text-align:center;margin-top:18px;font-size:12px;color:#6B7280;">
                绑定遇到问题？<span style="color:#3B82F6;cursor:pointer;font-weight:600;" onclick="showCustomerService()">联系客服</span>
            </div>
        </div>
        `
    });
});

// ============== 原型扫码登录 JS 逻辑 ==============
window._protoQrState = {
    sceneId: null,
    pollingTimer: null,
    countdownTimer: null,
    sse: null,            // EventSource 实例（SSE 优先模式）
    sseFailed: false,     // SSE 失败后降级到轮询，避免反复重试
    remain: 300,
    finished: false,
    mockScanned: false
};

function startProtoQrLogin() {
    refreshProtoQrLogin();
}
// 注册扫码登录页渲染钩子：页面渲染后自动生成二维码（无需手动点刷新）
if (typeof PAGES !== 'undefined' && PAGES['login-wechat-qrcode']) {
    PAGES['login-wechat-qrcode'].afterRender = startProtoQrLogin;
}

function stopProtoQrPolling(keepSession) {
    if (window._protoQrState.pollingTimer) {
        clearTimeout(window._protoQrState.pollingTimer);
        window._protoQrState.pollingTimer = null;
    }
    if (window._protoQrState.countdownTimer) {
        clearInterval(window._protoQrState.countdownTimer);
        window._protoQrState.countdownTimer = null;
    }
    if (window._protoQrState.sse) {
        try { window._protoQrState.sse.close(); } catch (e) {}
        window._protoQrState.sse = null;
    }
    const sid = window._protoQrState.sceneId;
    if (!keepSession && sid) {
        try { api.wechatQrcodeCancel(sid); } catch (e) {}
    }
}

function protoQrMask(type, extra) {
    const mask = document.getElementById('proto-qr-mask');
    const icon = document.getElementById('proto-qr-mask-icon');
    const text = document.getElementById('proto-qr-mask-text');
    if (!mask) return;
    if (!extra) extra = {};
    mask.style.display = 'flex';
    const setBg = bg => mask.style.background = bg;
    const setIcon = (cls, color) => { if (icon) icon.innerHTML = `<i class="${cls}" style="color:${color};"></i>`; };
    const setText = t => { if (text) text.textContent = t; };
    if (type === 'loading') {
        setBg('rgba(255,255,255,0.94)');
        setIcon('fas fa-spinner fa-spin', '#07C160');
        setText(extra.msg || '正在生成二维码...');
    } else if (type === 'waiting_confirm') {
        setBg('rgba(240,253,244,0.98)');
        setIcon('fas fa-check-circle', '#07C160');
        setText(extra.msg || '已扫码，请在微信上确认登录');
    } else if (type === 'confirmed') {
        setBg('rgba(240,253,244,0.98)');
        setIcon('fas fa-check', '#07C160');
        setText(extra.msg || '登录成功，正在进入...');
    } else if (type === 'cancelled') {
        setBg('rgba(254,242,242,0.96)');
        setIcon('fas fa-times-circle', '#EF4444');
        setText(extra.msg || '用户已取消登录');
    } else if (type === 'expired') {
        setBg('rgba(255,251,235,0.96)');
        setIcon('fas fa-hourglass-half', '#F59E0B');
        setText(extra.msg || '二维码已过期');
    } else if (type === 'error') {
        setBg('rgba(254,242,242,0.96)');
        setIcon('fas fa-exclamation-triangle', '#EF4444');
        setText(extra.msg || '生成失败，请点击刷新');
    }
}

function hideProtoQrMask() {
    const mask = document.getElementById('proto-qr-mask');
    if (mask) mask.style.display = 'none';
}

// 二维码图片加载失败处理：防 onerror 死循环，失败一次即停止并提示
function handleProtoQrImgError(img) {
    if (!img || img.dataset.err) return; // 防重入
    img.dataset.err = '1';
    img.alt = '二维码加载失败，请点刷新';
    // 标记结束并停止轮询，避免 pending 状态的 hideProtoQrMask 覆盖错误遮罩
    window._protoQrState.finished = true;
    stopProtoQrPolling(true);
    protoQrMask('error', { msg: '二维码加载失败，请点刷新' });
}

async function refreshProtoQrLogin() {
    stopProtoQrPolling(false);
    window._protoQrState.finished = false;
    window._protoQrState.mockScanned = false;
    // 重置 SSE 失败标志，新会话重新尝试长连接
    window._protoQrState.sseFailed = false;
    const img = document.getElementById('proto-qr-img');
    const tip = document.getElementById('proto-qr-tip');
    const sub = document.getElementById('proto-qr-subtip');
    const cd = document.getElementById('proto-qr-countdown');
    if (img) img.removeAttribute('data-err'); // 重置 onerror 防重入标志，保留旧二维码避免闪白
    if (tip) tip.textContent = '正在生成登录二维码...';
    if (cd) cd.textContent = '300';
    protoQrMask('loading', { msg: '正在生成二维码...' });
    const data = await api.wechatQrcodeCreate();

    // 用本地纯JS二维码生成器渲染二维码（不依赖外部图片服务）
    // scanUrl 优先取后端返回的 scan_url；API 失败时本地降级生成演示扫码URL
    let scanUrl, sceneId, expiresIn, scanHint;
    if (data && (data.scan_url || data.qrcode_url)) {
        sceneId = data.scene_id;
        scanUrl = data.scan_url || data.qrcode_url || '';
        expiresIn = data.expires_in || 300;
        scanHint = data.scan_hint || '请使用微信扫一扫登录';
    } else {
        // API 不可达（如云端无 auth 路由）→ 本地降级生成演示扫码会话
        sceneId = 'demo_scene_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        scanUrl = location.origin + '/api/auth/wechat-scan-callback?scene=' + sceneId;
        expiresIn = 300;
        scanHint = '请使用微信扫一扫登录（演示模式）';
    }

    // 生成微信开放平台标准授权二维码内容
    //   移动端 H5: https://open.weixin.qq.com/connect/oauth2/authorize?...#wechat_redirect
    //   PC 扫码: https://open.weixin.qq.com/connect/qrconnect?...#wechat_redirect
    // 这里使用扫码登录页（qrconnect），微信扫一扫后会跳转 redirect_uri 完成授权。
    // redirect_uri 指向云端 /api/auth/wechat-callback，同时携带一次性 scene_id（state）做轮询关联。
    const WECHAT_APPID = window.__WECHAT_APPID__ || 'wxDEMO000000000000';
    const REDIRECT_BASE = (window.__AUTH_CALLBACK_BASE__ || location.origin || 'https://ai-gaokao-static.pages.dev').replace(/\/$/, '');
    const rawRedirect = REDIRECT_BASE + '/api/auth/wechat-callback';
    const encRedirect = encodeURIComponent(rawRedirect);
    const encState = encodeURIComponent(sceneId);
    let qrContent = 'https://open.weixin.qq.com/connect/qrconnect?appid=' + WECHAT_APPID
        + '&redirect_uri=' + encRedirect
        + '&response_type=code&scope=snsapi_login&state=' + encState
        + '#wechat_redirect';

    // 兜底：如果后端明确返回了 scan_url 且属于微信官方 URL，则优先使用（清理任何异常反斜杠）
    if (data && typeof (data.scan_url || data.qrcode_url) === 'string') {
        const given = (data.scan_url || data.qrcode_url || '').replace(/\\/g, '');
        if (/^https?:\/\/open\.weixin\.qq\.com\//.test(given)) qrContent = given;
    }
    // 最后再清理一遍异常反斜杠 / %5C 残留，避免二维码末尾出现脏字符
    qrContent = qrContent.replace(/\\/g, '').replace(/%5[cC]/g, '');

    // 用内嵌生成器画出真实二维码（精确 220x220，与 img 容器一致，避免浏览器拉伸模糊）
    window._protoQrState.sceneId = sceneId;
    window._protoQrState.remain = expiresIn;
    window._protoQrState.isDemo = !(data && data.scene_id);
    window._protoQrState.lastQrContent = qrContent; // 方便调试/展示 payload

    let rendered = false;
    try {
        if (window.QRCodeGen && img) {
            var dataUrl = window.QRCodeGen.makeDataURL(qrContent, 220);
            if (dataUrl) {
                img.src = dataUrl;
                rendered = true;
            }
        }
    } catch (e) {
        console.warn('[proto-qr] 本地生成异常', e);
    }
    if (!rendered) {
        // 本地生成器不可用：显示错误遮罩，避免依赖外部图片触发 onerror 循环
        protoQrMask('error', { msg: '二维码生成失败，请点刷新' });
        if (img) img.alt = '二维码生成失败';
    }

    if (tip) tip.textContent = scanHint;
    if (sub) sub.innerHTML = `二维码 <span id="proto-qr-countdown">${window._protoQrState.remain}</span>s 后过期，<a href="javascript:void(0)" onclick="refreshProtoQrLogin()" style="color:#07C160;text-decoration:none;">刷新</a>`;
    if (rendered) hideProtoQrMask(); // 仅生成成功时隐藏 loading 遮罩，露出真实二维码（失败时保留 error 遮罩）
    window._protoQrState.countdownTimer = setInterval(() => {
        window._protoQrState.remain = Math.max(0, window._protoQrState.remain - 1);
        const c = document.getElementById('proto-qr-countdown');
        if (c) c.textContent = String(window._protoQrState.remain);
        if (window._protoQrState.remain <= 0 && !window._protoQrState.finished) {
            stopProtoQrPolling(false);
            if (tip) tip.textContent = '二维码已过期';
            protoQrMask('expired', { msg: '二维码已过期' });
            setTimeout(refreshProtoQrLogin, 1500);
        }
    }, 1000);
    startProtoPolling();
}

function startProtoPolling() {
    if (!window._protoQrState.sceneId) return;
    // 演示模式：后端不可达，轮询/SSE 无意义，状态由模拟按钮本地驱动
    if (window._protoQrState.isDemo) return;

    // 优先尝试 SSE 长连接（实时推送扫码状态，节省带宽）
    if (!window._protoQrState.sseFailed && window.EventSource) {
        try {
            const sid = window._protoQrState.sceneId;
            const es = new EventSource(api.wechatQrcodeStreamUrl(sid));
            es.onmessage = (ev) => {
                if (window._protoQrState.finished) return;
                try {
                    const obj = JSON.parse(ev.data);
                    // 兼容后端两种格式：直接是 payload，或 {code:0, data: payload}
                    const payload = (obj && obj.code === 0 && obj.data) ? obj.data : obj;
                    if (payload) handleProtoQrStatus(payload);
                } catch (e) {
                    console.warn('[proto-qr-sse] 解析失败', e);
                }
            };
            es.onerror = () => {
                try { es.close(); } catch (e) {}
                window._protoQrState.sse = null;
                // SSE 失败一次后降级到轮询，避免反复重试
                if (!window._protoQrState.sseFailed) {
                    window._protoQrState.sseFailed = true;
                    startProtoPollingFallback();
                }
            };
            window._protoQrState.sse = es;
            return;
        } catch (e) {
            console.warn('[proto-qr-sse] 初始化失败，降级轮询', e);
            window._protoQrState.sseFailed = true;
        }
    }
    startProtoPollingFallback();
}

// 轮询降级（SSE 不可用时使用，2s 间隔）
function startProtoPollingFallback() {
    if (!window._protoQrState.sceneId || window._protoQrState.isDemo) return;
    const tick = async () => {
        if (window._protoQrState.finished) return;
        const sid = window._protoQrState.sceneId;
        if (!sid) return;
        const data = await api.wechatQrcodeStatus(sid);
        // await 期间可能 onerror/过期已置 finished，需复查避免 pending 覆盖错误遮罩
        if (window._protoQrState.finished) return;
        if (data) handleProtoQrStatus(data);
        if (!window._protoQrState.finished) {
            window._protoQrState.pollingTimer = setTimeout(tick, 2000);
        }
    };
    window._protoQrState.pollingTimer = setTimeout(tick, 1500);
}

function handleProtoQrStatus(data) {
    const status = data.status || 'pending';
    const tip = document.getElementById('proto-qr-tip');
    if (status === 'pending') {
        hideProtoQrMask();
        if (tip) tip.textContent = data.msg || '请使用微信扫一扫登录';
    } else if (status === 'waiting_confirm') {
        if (tip) tip.textContent = '已扫码';
        protoQrMask('waiting_confirm', { msg: data.msg });
    } else if (status === 'confirmed') {
        window._protoQrState.finished = true;
        stopProtoQrPolling(true);
        protoQrMask('confirmed', { msg: data.msg || '登录成功，正在进入首页...' });
        setTimeout(() => {
            const token = data.token, uid = data.user_id, user = data.user;
            if (token && uid) {
                Auth.setSession(token, uid, user || null);
            }
            if (typeof showToast === 'function') showToast('扫码登录成功', 'success');
            navigateTo('home');
        }, 800);
    } else if (status === 'cancelled') {
        window._protoQrState.finished = true;
        stopProtoQrPolling(true);
        protoQrMask('cancelled', { msg: data.msg });
        setTimeout(refreshProtoQrLogin, 1500);
    } else if (status === 'expired') {
        window._protoQrState.finished = true;
        stopProtoQrPolling(true);
        protoQrMask('expired', { msg: data.msg });
        setTimeout(refreshProtoQrLogin, 1500);
    }
}

async function protoMockQrAction(action) {
    if (!window._protoQrState.sceneId) {
        if (typeof showToast === 'function') showToast('请先生成二维码', 'warning');
        return;
    }
    // 演示模式（后端不可达）：本地模拟扫码流程，不调用后端
    if (window._protoQrState.isDemo) {
        if (action === 'scan') {
            window._protoQrState.mockScanned = true;
            handleProtoQrStatus({ status: 'waiting_confirm', msg: '已扫码，请在微信上确认登录（演示）' });
            if (typeof showToast === 'function') showToast('已模拟扫码（演示）', 'success');
        } else if (action === 'confirm') {
            window._protoQrState.mockScanned = true;
            const demoUid = 'demo_' + Date.now().toString(36);
            handleProtoQrStatus({
                status: 'confirmed',
                token: 'demo_token_' + Date.now().toString(36),
                user_id: demoUid,
                user: { id: demoUid, name: '微信演示用户', avatar: '', role: 'student' },
                msg: '登录成功（演示模式），正在进入首页...'
            });
        } else if (action === 'cancel') {
            window._protoQrState.mockScanned = false;
            handleProtoQrStatus({ status: 'cancelled', msg: '用户已取消登录（演示）' });
            if (typeof showToast === 'function') showToast('已取消扫码登录（演示）', 'info');
        }
        return;
    }
    if (action === 'confirm' && !window._protoQrState.mockScanned) {
        await api.wechatQrcodeMockScan(window._protoQrState.sceneId, 'scan');
        window._protoQrState.mockScanned = true;
        handleProtoQrStatus({ status: 'waiting_confirm', msg: '已扫码，请在微信上确认登录' });
        if (typeof showToast === 'function') showToast('已模拟扫码', 'info');
        await new Promise(r => setTimeout(r, 700));
    }
    const res = await api.wechatQrcodeMockScan(window._protoQrState.sceneId, action);
    if (!res) {
        if (typeof showToast === 'function') showToast('操作失败，请重试', 'error');
        return;
    }
    if (action === 'scan') {
        window._protoQrState.mockScanned = true;
        handleProtoQrStatus({ status: 'waiting_confirm', msg: '已扫码，请在微信上确认登录' });
        if (typeof showToast === 'function') showToast('已模拟扫码，请点击模拟确认', 'success');
    } else if (action === 'confirm') {
        window._protoQrState.mockScanned = true;
        handleProtoQrStatus({
            status: 'confirmed',
            token: res.token,
            user_id: res.user_id,
            user: res.user,
            msg: res.msg || '登录成功'
        });
    } else if (action === 'cancel') {
        window._protoQrState.mockScanned = false;
        handleProtoQrStatus({ status: 'cancelled', msg: res.msg || '用户已取消登录' });
    }
}

// ============================================================
// ZH 徽章弹窗：点击顶部 ZH 徽章弹出登录/注册模态框（不跳转页面）
// 与主应用 index-home.html 行为保持一致
// ============================================================
function openProtoAuthModal() {
    if (typeof Auth !== 'undefined' && Auth.isLoggedIn && Auth.isLoggedIn()) {
        // 已登录：显示账户信息 + 退出登录
        const user = (typeof Auth.getCachedUser === 'function') ? Auth.getCachedUser() : null;
        const name = (user && user.name) ? user.name : '同学';
        openModal('账户信息', `
            <div style="text-align:center;padding:10px 6px 6px;">
                <div style="width:72px;height:72px;border-radius:50%;margin:0 auto 10px;background:linear-gradient(135deg,#3B82F6,#1D4ED8);display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;font-weight:700;letter-spacing:1px;">${name.slice(0,1).toUpperCase() || 'U'}</div>
                <div style="font-size:18px;font-weight:700;">${name}</div>
                <div style="margin-top:8px;display:inline-flex;align-items:center;gap:6px;background:#ECFDF5;color:#047857;padding:4px 10px;border-radius:12px;font-size:12px;"><i class="fas fa-check-circle"></i> 已登录</div>
            </div>
            <div style="margin-top:18px;display:flex;gap:10px;">
                <button class="proto-btn proto-btn-primary" style="flex:1;height:40px;border-radius:20px;" onclick="closeModal();navigateTo('profile-main')"><i class="fas fa-user"></i> 个人中心</button>
                <button class="proto-btn proto-btn-outline" style="flex:1;height:40px;border-radius:20px;color:#DC2626;border-color:#FECACA;" onclick="handleProtoLogout()"><i class="fas fa-sign-out-alt"></i> 退出登录</button>
            </div>
        `);
        return;
    }
    // 未登录：弹出登录/注册模态框（4 个 tab，与主应用一致）
    openModal('登录 / 注册', `
        <div style="display:flex;border-bottom:1px solid #E5E7EB;margin-bottom:16px;">
            <div class="proto-auth-tab" data-tab="login" onclick="switchProtoAuthTab('login')" style="flex:1;padding:10px 4px;text-align:center;font-size:14px;font-weight:600;cursor:pointer;color:#3B82F6;border-bottom:2px solid #3B82F6;">登录</div>
            <div class="proto-auth-tab" data-tab="register" onclick="switchProtoAuthTab('register')" style="flex:1;padding:10px 4px;text-align:center;font-size:14px;font-weight:600;cursor:pointer;color:#6B7280;border-bottom:2px solid transparent;">注册</div>
            <div class="proto-auth-tab" data-tab="sms" onclick="switchProtoAuthTab('sms')" style="flex:1;padding:10px 4px;text-align:center;font-size:14px;font-weight:600;cursor:pointer;color:#6B7280;border-bottom:2px solid transparent;"><i class="fas fa-mobile-alt"></i> 手机号</div>
            <div class="proto-auth-tab" data-tab="qrcode" onclick="switchProtoAuthTab('qrcode')" style="flex:1;padding:10px 4px;text-align:center;font-size:14px;font-weight:600;cursor:pointer;color:#6B7280;border-bottom:2px solid transparent;"><i class="fas fa-qrcode"></i> 扫码</div>
        </div>

        <div id="proto-auth-login" class="proto-auth-pane">
            <div style="margin-bottom:12px;">
                <label style="font-size:12px;color:#6B7280;display:block;margin-bottom:6px;">用户名</label>
                <input id="proto-auth-login-username" class="proto-input" type="text" placeholder="演示账户 u_001" style="width:100%;height:42px;padding:0 12px;border:1px solid #D1D5DB;border-radius:10px;font-size:14px;outline:none;">
            </div>
            <div style="margin-bottom:16px;">
                <label style="font-size:12px;color:#6B7280;display:block;margin-bottom:6px;">密码</label>
                <input id="proto-auth-login-password" class="proto-input" type="password" placeholder="输入密码" style="width:100%;height:42px;padding:0 12px;border:1px solid #D1D5DB;border-radius:10px;font-size:14px;outline:none;">
            </div>
            <button class="proto-btn proto-btn-primary" style="width:100%;height:44px;border-radius:22px;font-size:15px;" onclick="handleProtoModalLogin()"><i class="fas fa-sign-in-alt"></i> 登录</button>
            <div style="margin-top:10px;font-size:12px;color:#9CA3AF;text-align:center;">
                <i class="fas fa-info-circle"></i> 演示账户：<b>u_001</b> / 密码：<b>u_001</b>
            </div>
        </div>

        <div id="proto-auth-register" class="proto-auth-pane" style="display:none;">
            <div style="margin-bottom:12px;">
                <label style="font-size:12px;color:#6B7280;display:block;margin-bottom:6px;">用户名 <span style="color:#9CA3AF;font-weight:400;">（3-20位）</span></label>
                <input id="proto-auth-reg-username" class="proto-input" type="text" minlength="3" maxlength="20" placeholder="设置登录用户名" style="width:100%;height:42px;padding:0 12px;border:1px solid #D1D5DB;border-radius:10px;font-size:14px;outline:none;">
            </div>
            <div style="margin-bottom:12px;">
                <label style="font-size:12px;color:#6B7280;display:block;margin-bottom:6px;">密码 <span style="color:#9CA3AF;font-weight:400;">（至少6位）</span></label>
                <input id="proto-auth-reg-password" class="proto-input" type="password" minlength="6" placeholder="设置登录密码" style="width:100%;height:42px;padding:0 12px;border:1px solid #D1D5DB;border-radius:10px;font-size:14px;outline:none;">
            </div>
            <div style="margin-bottom:12px;">
                <label style="font-size:12px;color:#6B7280;display:block;margin-bottom:6px;">确认密码</label>
                <input id="proto-auth-reg-password2" class="proto-input" type="password" minlength="6" placeholder="请再次输入密码" style="width:100%;height:42px;padding:0 12px;border:1px solid #D1D5DB;border-radius:10px;font-size:14px;outline:none;">
            </div>
            <div style="margin-bottom:16px;">
                <label style="font-size:12px;color:#6B7280;display:block;margin-bottom:6px;">昵称 <span style="color:#9CA3AF;font-weight:400;">（选填）</span></label>
                <input id="proto-auth-reg-name" class="proto-input" type="text" placeholder="如何称呼你？" style="width:100%;height:42px;padding:0 12px;border:1px solid #D1D5DB;border-radius:10px;font-size:14px;outline:none;">
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;font-size:12px;color:#6B7280;cursor:pointer;" onclick="this.querySelector('.proto-agree-box').classList.toggle('checked');">
                <span class="proto-agree-box" style="display:inline-flex;width:16px;height:16px;border-radius:50%;border:1.5px solid #D1D5DB;align-items:center;justify-content:center;color:transparent;flex-shrink:0;">
                    <i class="fas fa-check" style="font-size:9px;"></i>
                </span>
                <span>我已阅读并同意 <span style="color:#3B82F6;cursor:pointer;" onclick="event.stopPropagation();showUserAgreement()">《用户协议》</span> 和 <span style="color:#3B82F6;cursor:pointer;" onclick="event.stopPropagation();showPrivacyPolicy()">《隐私政策》</span></span>
            </div>
            <button class="proto-btn proto-btn-primary" style="width:100%;height:44px;border-radius:22px;font-size:15px;" onclick="handleProtoModalRegister()"><i class="fas fa-user-plus"></i> 注册并登录</button>
        </div>

        <div id="proto-auth-sms" class="proto-auth-pane" style="display:none;">
            <div style="margin-bottom:12px;">
                <label style="font-size:12px;color:#6B7280;display:block;margin-bottom:6px;">手机号</label>
                <input id="proto-auth-sms-phone" class="proto-input" type="tel" maxlength="11" placeholder="请输入11位手机号" style="width:100%;height:42px;padding:0 12px;border:1px solid #D1D5DB;border-radius:10px;font-size:14px;outline:none;">
            </div>
            <div style="display:flex;gap:10px;margin-bottom:16px;">
                <input id="proto-auth-sms-code" class="proto-input" type="tel" maxlength="6" placeholder="6位验证码" style="flex:1;height:42px;padding:0 12px;border:1px solid #D1D5DB;border-radius:10px;font-size:14px;outline:none;">
                <button id="proto-auth-sms-btn" onclick="handleProtoModalSmsSend()" style="flex-shrink:0;width:130px;height:42px;background:white;border:1.5px solid #3B82F6;color:#3B82F6;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;">获取验证码</button>
            </div>
            <button class="proto-btn proto-btn-primary" style="width:100%;height:44px;border-radius:22px;font-size:15px;" onclick="handleProtoModalSmsLogin()"><i class="fas fa-shield-alt"></i> 验证码登录</button>
            <div style="margin-top:10px;font-size:12px;color:#9CA3AF;text-align:center;"><i class="fas fa-info-circle"></i> 演示模式：验证码显示在弹窗与后端控制台</div>
        </div>

        <div id="proto-auth-qrcode" class="proto-auth-pane" style="display:none;text-align:center;">
            <div style="padding:8px 0 14px;color:#6B7280;font-size:13px;">微信扫码登录，无需输入账号密码</div>
            <div style="display:inline-block;padding:14px;background:white;border:1px solid #E5E7EB;border-radius:14px;">
                <div style="width:200px;height:200px;display:flex;align-items:center;justify-content:center;color:#9CA3AF;font-size:13px;">二维码占位</div>
            </div>
            <div style="margin-top:14px;">
                <button class="proto-btn proto-btn-outline" style="height:40px;border-radius:20px;color:#07C160;border-color:#07C160;" onclick="closeModal();navigateTo('login-wechat-qrcode')"><i class="fas fa-qrcode"></i> 打开完整扫码页</button>
            </div>
        </div>
    `);
}

// ZH 徽章弹窗：tab 切换
function switchProtoAuthTab(tab) {
    var panes = { login: 'proto-auth-login', register: 'proto-auth-register', sms: 'proto-auth-sms', qrcode: 'proto-auth-qrcode' };
    Object.keys(panes).forEach(function(k) {
        var pane = document.getElementById(panes[k]);
        if (pane) pane.style.display = (k === tab) ? '' : 'none';
    });
    document.querySelectorAll('.proto-auth-tab').forEach(function(el) {
        var active = el.getAttribute('data-tab') === tab;
        el.style.color = active ? '#3B82F6' : '#6B7280';
        el.style.borderBottom = active ? '2px solid #3B82F6' : '2px solid transparent';
    });
}

// 弹窗内：账号密码登录
async function handleProtoModalLogin() {
    var u = document.getElementById('proto-auth-login-username').value.trim();
    var p = document.getElementById('proto-auth-login-password').value;
    if (!u || !p) { if (typeof showToast === 'function') showToast('请输入用户名和密码', 'warning'); return; }
    try {
        var data = await api.login(u, p);
        if (data && data.token) {
            Auth.setSession(data.token, data.user_id || '', data.user || null);
            if (typeof showToast === 'function') showToast('登录成功', 'success');
            closeModal();
            if (typeof navigateTo === 'function') setTimeout(function(){ navigateTo('home'); }, 200);
        } else {
            if (typeof showToast === 'function') showToast('登录失败，请检查账号密码', 'error');
        }
    } catch (e) {
        if (typeof showToast === 'function') showToast('登录失败：' + (e.message || '未知错误'), 'error');
    }
}

// 弹窗内：注册（含确认密码 + 协议勾选验证）
async function handleProtoModalRegister() {
    var u = document.getElementById('proto-auth-reg-username').value.trim();
    var p = document.getElementById('proto-auth-reg-password').value;
    var p2 = document.getElementById('proto-auth-reg-password2').value;
    var n = document.getElementById('proto-auth-reg-name').value.trim();
    if (!u || !p) { if (typeof showToast === 'function') showToast('请输入用户名和密码', 'warning'); return; }
    if (p.length < 6) { if (typeof showToast === 'function') showToast('密码至少6位', 'warning'); return; }
    if (p !== p2) { if (typeof showToast === 'function') showToast('两次密码不一致', 'warning'); return; }
    var agreeBox = document.querySelector('#proto-auth-register .proto-agree-box');
    if (!agreeBox || !agreeBox.classList.contains('checked')) { if (typeof showToast === 'function') showToast('请先同意用户协议和隐私政策', 'warning'); return; }
    try {
        var data = await api.register(u, p, n || u, '高三', '北京');
        if (data && data.token) {
            Auth.setSession(data.token, data.user_id || '', data.user || null);
            if (typeof showToast === 'function') showToast('注册成功', 'success');
            closeModal();
            if (typeof navigateTo === 'function') setTimeout(function(){ navigateTo('home'); }, 200);
        } else {
            if (typeof showToast === 'function') showToast('注册失败', 'error');
        }
    } catch (e) {
        if (typeof showToast === 'function') showToast('注册失败：' + (e.message || '未知错误'), 'error');
    }
}

// 弹窗内：发送验证码
async function handleProtoModalSmsSend() {
    var phoneInput = document.getElementById('proto-auth-sms-phone');
    var phone = phoneInput ? phoneInput.value.trim() : '';
    if (!/^1\d{10}$/.test(phone)) { if (typeof showToast === 'function') showToast('请输入正确的11位手机号', 'warning'); return; }
    var btn = document.getElementById('proto-auth-sms-btn');
    btn.disabled = true;
    var countdown = 60;
    btn.textContent = countdown + 's 后重试';
    var timer = setInterval(function(){
        countdown--;
        if (countdown <= 0) { clearInterval(timer); btn.disabled = false; btn.textContent = '获取验证码'; return; }
        btn.textContent = countdown + 's 后重试';
    }, 1000);
    try {
        var res = await fetch('/api/auth/sms-send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: phone }) });
        var data = await res.json();
        if (data && data.code === 0) {
            if (typeof showToast === 'function') showToast('验证码已发送', 'success');
        } else {
            if (typeof showToast === 'function') showToast('发送失败：' + (data.msg || ''), 'error');
        }
    } catch (e) {
        if (typeof showToast === 'function') showToast('发送失败：' + (e.message || ''), 'error');
    }
}

// 弹窗内：手机验证码登录
async function handleProtoModalSmsLogin() {
    var phone = document.getElementById('proto-auth-sms-phone').value.trim();
    var code = document.getElementById('proto-auth-sms-code').value.trim();
    if (!phone || !code) { if (typeof showToast === 'function') showToast('请输入手机号和验证码', 'warning'); return; }
    try {
        var data = await api.smsLogin(phone, code);
        if (data && data.token) {
            Auth.setSession(data.token, data.user_id || '', data.user || null);
            if (typeof showToast === 'function') showToast('登录成功', 'success');
            closeModal();
            if (typeof navigateTo === 'function') setTimeout(function(){ navigateTo('home'); }, 200);
        } else {
            if (typeof showToast === 'function') showToast('验证码错误或已失效', 'error');
        }
    } catch (e) {
        if (typeof showToast === 'function') showToast('登录失败：' + (e.message || ''), 'error');
    }
}

// 弹窗内：退出登录
async function handleProtoLogout() {
    try { await api.logout(); } catch (e) {}
    if (typeof Auth !== 'undefined' && Auth.clear) Auth.clear();
    closeModal();
    if (typeof showToast === 'function') showToast('已退出登录', 'info');
    if (typeof navigateTo === 'function') setTimeout(function(){ navigateTo('home'); }, 200);
}
