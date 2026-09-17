// ============================================================
// 拍照搜题模块 - 4个页面（动态加载：数据来自 /api/page-data/:key）
// ============================================================

// ------------------------------------------------------------
// 全局工具函数（文件最外层定义，确保任意子页面点击时均可调用）
// ------------------------------------------------------------

// ============ 交互式视频播放器（模拟真实播放 + 动态白板 + 语音讲解） ============
// 播放器状态表：window.__videoPlayers[playerId] = { current, total, playing, timer, frameTimer, lastSpokenSeg }
window.__videoPlayers = window.__videoPlayers || {};

// ====== Web Speech API 语音朗读辅助 ======
window.__videoSpeech = window.__videoSpeech || { synth: null, voices: [], ready: false };
(function initSpeech() {
    try {
        if ('speechSynthesis' in window) {
            window.__videoSpeech.synth = window.speechSynthesis;
            window.__videoSpeech.ready = true;
            // 预加载语音列表（部分浏览器首次调用后才填充）
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = function () {
                    window.__videoSpeech.voices = window.speechSynthesis.getVoices();
                };
            }
            window.__videoSpeech.voices = window.speechSynthesis.getVoices();
        }
    } catch (e) { /* 不支持语音时静默失败 */ }
})();

// 选择中文语音
window.getChineseVoice = function () {
    var vList = window.__videoSpeech.voices;
    if (!vList || vList.length === 0) return null;
    // 优先选普通话中文
    var zh = vList.filter(function (v) { return /zh|Chinese|Mandarin/i.test(v.lang + ' ' + v.name); });
    if (zh.length > 0) {
        // 优先选 female / Google / Microsoft 的语音
        var best = zh.filter(function (v) { return /female|Google|Microsoft|Ting-Ting|Yaoyao|Kangkang/i.test(v.name); });
        return best.length > 0 ? best[0] : zh[0];
    }
    return null;
};

// 朗读一段文字（可打断）
window.speakText = function (text, playerId) {
    if (!window.__videoSpeech.ready || !window.__videoSpeech.synth || !text) return;
    try {
        window.__videoSpeech.synth.cancel();
        var utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'zh-CN';
        utter.rate = 1.0;
        utter.pitch = 1.0;
        utter.volume = 1.0;
        var cv = window.getChineseVoice();
        if (cv) utter.voice = cv;
        window.__videoSpeech.synth.speak(utter);
    } catch (e) { /* 静默 */ }
};

// 停止朗读
window.stopSpeaking = function () {
    try {
        if (window.__videoSpeech.synth) window.__videoSpeech.synth.cancel();
    } catch (e) {}
};

// 根据当前秒数，从 outline 中定位到对应段落及相对进度
window.findSegmentByTime = function (sec, outline) {
    if (!outline || outline.length === 0) return null;
    for (var i = 0; i < outline.length; i++) {
        var o = outline[i];
        var s = window.parseDuration(o.start);
        var e = window.parseDuration(o.end);
        if (sec >= s && sec < e) {
            return { idx: i, seg: o, localPct: (sec - s) / Math.max(1, (e - s)) };
        }
    }
    // 超过最后一段结尾，定位到最后一段
    var last = outline[outline.length - 1];
    var ls = window.parseDuration(last.start);
    var le = window.parseDuration(last.end);
    return { idx: outline.length - 1, seg: last, localPct: sec >= le ? 1 : Math.max(0, (sec - ls) / Math.max(1, le - ls)) };
};

// 根据题目/讲解内容构造"演示大纲"（若无 outline 数据则动态生成）
window.ensureDemoOutline = function (playerId, fallbackTitle, fallbackContent) {
    var st = window.__videoPlayers[playerId];
    if (!st) return;
    if (st.demoOutline && st.demoOutline.length > 0) return st.demoOutline;
    // 动态生成：把讲解内容按段落切成 4 个片段
    var total = st.total || 300;
    var segCount = 4;
    var titles = ['题目引入与分析', '解题思路与方法', '详细步骤讲解', '易错点与总结'];
    if (fallbackTitle) titles[0] = fallbackTitle;
    var contentPieces = [''];
    if (fallbackContent) {
        // 按句/换行切分
        var raw = String(fallbackContent).replace(/\r\n/g, '\n');
        var sentences = raw.split(/(?<=[。！？.!?\n])/).filter(function (s) { return s && s.trim().length > 0; });
        if (sentences.length >= 4) {
            contentPieces = [];
            var k = Math.ceil(sentences.length / 4);
            for (var i = 0; i < 4; i++) {
                contentPieces.push(sentences.slice(i * k, (i + 1) * k).join(''));
            }
        } else if (sentences.length > 0) {
            contentPieces = sentences.slice();
            while (contentPieces.length < 4) contentPieces.push(contentPieces[contentPieces.length - 1] || '');
        }
    }
    if (contentPieces.length < 4) while (contentPieces.length < 4) contentPieces.push('');
    var segDur = Math.floor(total / segCount);
    st.demoOutline = [];
    for (var j = 0; j < segCount; j++) {
        var sTime = j * segDur;
        var eTime = (j === segCount - 1) ? total : (j + 1) * segDur;
        st.demoOutline.push({
            start: window.formatDuration(sTime),
            end: window.formatDuration(eTime),
            title: titles[j] || ('第' + (j + 1) + '段'),
            content: contentPieces[j] || ('这是' + titles[j] + '的讲解内容')
        });
    }
    return st.demoOutline;
};

// ====== 动态白板画面绘制（Canvas） ======
window.drawVideoWhiteboard = function (playerId) {
    var canvas = document.getElementById(playerId + '-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var st = window.__videoPlayers[playerId];
    if (!st) return;
    var W = canvas.width, H = canvas.height;

    // 背景：浅色黑板
    var grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#1E3A5F');
    grad.addColorStop(1, '#0F2744');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 背景网格线（淡）
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (var gx = 0; gx < W; gx += 30) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (var gy = 0; gy < H; gy += 30) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    // 左上角"讲师角标"
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(12, 12, 120, 36);
    ctx.fillStyle = '#FFD166';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('📺  高清视频课', 22, 36);

    // 右上角：当前时间
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(window.formatDuration(st.current) + ' / ' + window.formatDuration(st.total), W - 16, 32);
    ctx.textAlign = 'left';

    // 取当前段落
    var outline = st.demoOutline || [];
    var segInfo = window.findSegmentByTime(st.current, outline);
    if (!segInfo) return;
    var seg = segInfo.seg;
    var localPct = segInfo.localPct;

    // 段落标题条
    var titleBarY = 64;
    ctx.fillStyle = 'rgba(59,130,246,0.25)';
    ctx.fillRect(0, titleBarY, W, 34);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('▶ ' + (segInfo.idx + 1) + '. ' + (seg.title || ''), 20, titleBarY + 23);

    // 段落进度条（标题条下方细线）
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(0, titleBarY + 34, W, 2);
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(0, titleBarY + 34, Math.floor(W * localPct), 2);

    // 主体内容：分左侧"板书区"和右侧"提示区"
    var contentTop = titleBarY + 34 + 18;
    var leftX = 30;
    var rightX = Math.floor(W * 0.48);
    var contentW = Math.floor(W * 0.46);
    var maxChars = Math.floor(contentW / 16); // 每行大概字符数

    // 左侧：板书内容（讲解文字逐行显示）
    var content = seg.content || seg.desc || '';
    var lines = [];
    if (content) {
        var rawLines = content.split('\n');
        for (var li = 0; li < rawLines.length; li++) {
            var rl = rawLines[li];
            while (rl.length > maxChars) {
                lines.push(rl.substr(0, maxChars));
                rl = rl.substr(maxChars);
            }
            if (rl) lines.push(rl);
        }
    }
    if (lines.length === 0) lines = ['暂无讲解内容'];

    // 可见行数根据本地进度增长（讲解过程中行数逐渐出现）
    var totalLines = lines.length;
    var visibleLines = Math.max(1, Math.ceil(totalLines * localPct));
    var currentLineIdx = visibleLines - 1;
    var currentLineRevealPct = (totalLines * localPct) - currentLineIdx; // 0~1 当前行显示比例
    var lineH = 24;
    ctx.font = '14px "Microsoft YaHei", sans-serif';
    for (var k = 0; k < visibleLines; k++) {
        var txt = lines[k];
        if (k === currentLineIdx) {
            txt = txt.substr(0, Math.ceil(txt.length * currentLineRevealPct));
        }
        var y = contentTop + k * lineH;
        if (y > H - 50) break;
        // 要点行高亮
        var isKey = /步骤|解：|方法|公式|所以|关键|注意/.test(txt);
        if (isKey) {
            ctx.fillStyle = 'rgba(255,209,102,0.15)';
            ctx.fillRect(leftX - 4, y - 16, contentW, lineH);
            ctx.fillStyle = '#FFD166';
        } else {
            ctx.fillStyle = '#FFFFFF';
        }
        ctx.fillText(txt, leftX, y);
    }

    // 右侧：知识点提示卡片
    var boxX = rightX, boxY = contentTop;
    var boxW = W - rightX - 30, boxH = H - contentTop - 30;
    // 卡片背景
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    var r = 10;
    ctx.moveTo(boxX + r, boxY);
    ctx.lineTo(boxX + boxW - r, boxY);
    ctx.quadraticCurveTo(boxX + boxW, boxY, boxX + boxW, boxY + r);
    ctx.lineTo(boxX + boxW, boxY + boxH - r);
    ctx.quadraticCurveTo(boxX + boxW, boxY + boxH, boxX + boxW - r, boxY + boxH);
    ctx.lineTo(boxX + r, boxY + boxH);
    ctx.quadraticCurveTo(boxX, boxY + boxH, boxX, boxY + boxH - r);
    ctx.lineTo(boxX, boxY + r);
    ctx.quadraticCurveTo(boxX, boxY, boxX + r, boxY);
    ctx.closePath();
    ctx.fill();
    // 卡片标题
    ctx.fillStyle = '#93C5FD';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('💡 知识点提示', boxX + 16, boxY + 26);
    // 分隔线
    ctx.strokeStyle = 'rgba(147,197,253,0.3)';
    ctx.beginPath();
    ctx.moveTo(boxX + 16, boxY + 38);
    ctx.lineTo(boxX + boxW - 16, boxY + 38);
    ctx.stroke();
    // 要点列表
    var tips = [
        '① 认真读题，圈出已知条件',
        '② 联想相关公式与定理',
        '③ 分步书写解题过程',
        '④ 检验答案是否合理'
    ];
    // 标题：若 seg.title 中有关键词则替换
    if (/步骤|解题|分析/.test(seg.title || '')) tips = ['第一步：审题', '第二步：列公式', '第三步：代值计算', '第四步：验证'];
    if (/总结|易错/.test(seg.title || '')) tips = ['⚠ 符号容易出错', '⚠ 单位要统一', '⚠ 结果要合理', '✓ 完成后再检查一遍'];
    ctx.font = '12px "Microsoft YaHei", sans-serif';
    var tipStartY = boxY + 62;
    for (var t = 0; t < tips.length; t++) {
        var reveal = (t + 1) / tips.length;
        if (localPct >= reveal * 0.7) {
            ctx.fillStyle = localPct >= reveal ? '#FFFFFF' : 'rgba(255,255,255,0.4)';
            ctx.fillText(tips[t], boxX + 20, tipStartY + t * 26);
        }
    }
    // 讲师头像（右下角）
    var avX = boxX + boxW - 48, avY = boxY + boxH - 48;
    ctx.beginPath();
    ctx.arc(avX, avY, 18, 0, Math.PI * 2);
    var avGrad = ctx.createLinearGradient(avX - 18, avY - 18, avX + 18, avY + 18);
    avGrad.addColorStop(0, '#3B82F6');
    avGrad.addColorStop(1, '#8B5CF6');
    ctx.fillStyle = avGrad;
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('师', avX, avY + 5);
    ctx.textAlign = 'left';

    // 底部：大纲片段指示点
    if (outline && outline.length > 0) {
        var dotY = H - 22;
        var totalSegs = outline.length;
        var dotGap = 12;
        var dotW = 40;
        var totalW = totalSegs * dotW + (totalSegs - 1) * dotGap;
        var startX = Math.floor((W - totalW) / 2);
        for (var si = 0; si < totalSegs; si++) {
            var bx = startX + si * (dotW + dotGap);
            ctx.fillStyle = si === segInfo.idx ? '#3B82F6' : (si < segInfo.idx ? '#10B981' : 'rgba(255,255,255,0.2)');
            ctx.fillRect(bx, dotY, dotW, 4);
        }
    }
};

// 启动白板帧更新（约每秒 6 帧，足够平滑又省资源）
window.startVideoFrameLoop = function (playerId) {
    var st = window.__videoPlayers[playerId];
    if (!st) return;
    if (st.frameTimer) clearInterval(st.frameTimer);
    st.frameTimer = setInterval(function () {
        window.drawVideoWhiteboard(playerId);
    }, 160);
    // 立即绘制第一帧
    window.drawVideoWhiteboard(playerId);
};

window.stopVideoFrameLoop = function (playerId) {
    var st = window.__videoPlayers[playerId];
    if (!st) return;
    if (st.frameTimer) { clearInterval(st.frameTimer); st.frameTimer = null; }
};

// 时间字符串 "12:35" → 秒数
window.parseDuration = function (str) {
    if (!str) return 0;
    var parts = String(str).split(':');
    if (parts.length === 2) return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    if (parts.length === 3) return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
    return parseInt(str, 10) || 0;
};

// 秒数 → "m:ss" 字符串
window.formatDuration = function (sec) {
    sec = Math.max(0, Math.floor(sec));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ':' + (s < 10 ? '0' + s : s);
};

// 初始化一个播放器实例
window.initVideoPlayer = function (playerId, totalSec) {
    var players = window.__videoPlayers;
    // 清理旧计时器
    if (players[playerId]) {
        if (players[playerId].timer) clearInterval(players[playerId].timer);
        if (players[playerId].frameTimer) clearInterval(players[playerId].frameTimer);
    }
    players[playerId] = { current: 0, total: totalSec || 0, playing: false, timer: null, frameTimer: null, lastSpokenSeg: -1, demoOutline: null };
    // 启动帧循环（一直保持，白板会显示暂停状态）
    window.startVideoFrameLoop(playerId);
    window.updateVideoPlayerUI(playerId);
};

// 检查当前播放位置是否需要朗读新段落
window.checkVideoSpeech = function (playerId) {
    var st = window.__videoPlayers[playerId];
    if (!st || !st.playing || !st.demoOutline) return;
    var segInfo = window.findSegmentByTime(st.current, st.demoOutline);
    if (!segInfo) return;
    if (segInfo.idx !== st.lastSpokenSeg && segInfo.localPct < 0.15) {
        st.lastSpokenSeg = segInfo.idx;
        var speakText = (segInfo.seg.title || '') + '。' + (segInfo.seg.content || segInfo.seg.desc || '');
        window.speakText(speakText, playerId);
    }
};

// 更新播放器 UI（图标/进度条/时间 + 语音同步 + 覆盖层隐藏）
window.updateVideoPlayerUI = function (playerId) {
    var st = window.__videoPlayers[playerId];
    if (!st) return;
    var progress = document.getElementById(playerId + '-progress');
    // 弹窗已关闭（DOM 不存在）：自动停止计时器，避免空转
    if (!progress) {
        if (st.timer) { clearInterval(st.timer); st.timer = null; }
        if (st.frameTimer) { clearInterval(st.frameTimer); st.frameTimer = null; }
        st.playing = false;
        window.stopSpeaking();
        return;
    }
    var btn = document.getElementById(playerId + '-btn');
    var icon = document.getElementById(playerId + '-icon');
    var curTime = document.getElementById(playerId + '-cur');
    var label = document.getElementById(playerId + '-label');
    var overlay = document.getElementById(playerId + '-overlay');
    var pct = st.total > 0 ? (st.current / st.total) * 100 : 0;
    if (progress) progress.style.width = pct + '%';
    if (curTime) curTime.textContent = window.formatDuration(st.current);
    // 覆盖层：播放时淡出，暂停/结束时渐显
    if (overlay) {
        if (st.playing) {
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
        } else {
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'auto';
        }
    }
    // 图标：播放中→暂停，暂停→播放，结束→重播
    if (icon) {
        if (st.playing) {
            icon.className = 'fas fa-pause';
        } else if (st.current >= st.total && st.total > 0) {
            icon.className = 'fas fa-redo';
        } else {
            icon.className = 'fas fa-play';
        }
    }
    if (label) {
        if (st.playing) {
            label.textContent = '🔊 正在播放讲解…';
        } else if (st.current >= st.total && st.total > 0) {
            label.textContent = '播放结束，点击重播';
        } else if (st.current > 0) {
            label.textContent = '已暂停，点击继续';
        } else {
            label.textContent = '点击播放完整讲解（含语音）';
        }
    }
    // 语音检查
    window.checkVideoSpeech(playerId);
};

// 切换播放/暂停
window.toggleVideoPlayer = function (playerId) {
    var st = window.__videoPlayers[playerId];
    if (!st) return;
    // 确保 demoOutline 存在
    window.ensureDemoOutline(playerId);
    // 确保帧循环启动
    if (!st.frameTimer) window.startVideoFrameLoop(playerId);
    if (st.playing) {
        // 暂停
        clearInterval(st.timer);
        st.timer = null;
        st.playing = false;
        window.stopSpeaking();
    } else {
        // 若已结束，重置到开头
        if (st.current >= st.total && st.total > 0) {
            st.current = 0;
            st.lastSpokenSeg = -1;
        }
        st.playing = true;
        // 演示速度：每 500ms 推进 1 秒视频时长（即 2 倍速），12:35 视频约 375 秒播完
        // 稍微放慢，给语音讲解足够时间
        st.timer = setInterval(function () {
            st.current += 1;
            if (st.current >= st.total) {
                st.current = st.total;
                clearInterval(st.timer);
                st.timer = null;
                st.playing = false;
                window.stopSpeaking();
            }
            window.updateVideoPlayerUI(playerId);
        }, 500);
        // 立即触发一次朗读（若刚进入新段落）
        window.checkVideoSpeech(playerId);
    }
    window.updateVideoPlayerUI(playerId);
};

// 点击进度条跳转
window.seekVideoPlayer = function (playerId, event) {
    var st = window.__videoPlayers[playerId];
    if (!st) return;
    var bar = document.getElementById(playerId + '-bar');
    if (!bar) return;
    var rect = bar.getBoundingClientRect();
    var ratio = (event.clientX - rect.left) / rect.width;
    ratio = Math.max(0, Math.min(1, ratio));
    st.current = Math.floor(ratio * st.total);
    st.lastSpokenSeg = -1; // 重置，允许重新朗读该段落
    if (st.playing) window.stopSpeaking();
    window.updateVideoPlayerUI(playerId);
};

// 生成播放器 HTML（内嵌版，带 Canvas 动态白板）
window.buildVideoPlayerHTML = function (playerId, totalSec, durationStr, title) {
    window.__videoPlayers[playerId] = { current: 0, total: totalSec, playing: false, timer: null, frameTimer: null, lastSpokenSeg: -1, demoOutline: null };
    // DOM 注入后立即启动帧循环（通过 setTimeout 保证 canvas 已挂载）
    setTimeout(function () {
        var st = window.__videoPlayers[playerId];
        if (st) {
            window.ensureDemoOutline(playerId, title);
            window.startVideoFrameLoop(playerId);
        }
    }, 50);
    return '<div style="background:#0F2744;border-radius:12px;position:relative;margin-bottom:12px;overflow:hidden;aspect-ratio:16/9;">' +
        // Canvas 动态白板（铺满，位于最底层）
        '<canvas id="' + playerId + '-canvas" width="960" height="540" style="width:100%;height:100%;display:block;"></canvas>' +
        // 中央播放按钮叠加层（半透明遮罩 + 按钮）
        '<div id="' + playerId + '-overlay" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:opacity 0.3s;background:rgba(0,0,0,0.18);" onclick="toggleVideoPlayer(\'' + playerId + '\')">' +
        '<div style="text-align:center;">' +
        '<div id="' + playerId + '-btn" style="width:72px;height:72px;border-radius:50%;background:rgba(59,130,246,0.85);display:flex;align-items:center;justify-content:center;margin:0 auto;transition:all 0.2s;box-shadow:0 6px 20px rgba(59,130,246,0.5);" onmouseover="this.style.transform=\'scale(1.08)\'" onmouseout="this.style.transform=\'scale(1)\'">' +
        '<i id="' + playerId + '-icon" class="fas fa-play" style="font-size:28px;color:white;margin-left:6px;"></i>' +
        '</div>' +
        '<div id="' + playerId + '-label" style="color:white;font-size:13px;margin-top:12px;font-weight:600;text-shadow:0 2px 6px rgba(0,0,0,0.8);">点击播放完整讲解（含语音）</div>' +
        '</div>' +
        '</div>' +
        // 右上角时长标签
        '<div style="position:absolute;top:10px;right:12px;background:rgba(0,0,0,0.6);color:white;font-size:11px;padding:2px 8px;border-radius:4px;z-index:5;">' + durationStr + '</div>' +
        // 声音开关
        '<button onclick="event.stopPropagation();if(window.__videoSpeech.synth){window.__videoSpeech.synth.muted=!window.__videoSpeech.synth.muted;showToast(window.__videoSpeech.synth.muted?\'语音已静音\':\'语音已开启\');}else{showToast(\'当前浏览器不支持语音\');}" style="position:absolute;top:10px;left:12px;background:rgba(0,0,0,0.5);color:white;border:none;font-size:14px;padding:4px 10px;border-radius:6px;cursor:pointer;z-index:5;" title="开/关语音"><i class="fas fa-volume-up"></i></button>' +
        // 底部进度条
        '<div style="position:absolute;bottom:0;left:0;right:0;padding:10px 14px;background:linear-gradient(transparent,rgba(0,0,0,0.75));z-index:5;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
        '<span id="' + playerId + '-cur" style="color:white;font-size:12px;min-width:38px;font-family:monospace;">0:00</span>' +
        '<div id="' + playerId + '-bar" onclick="seekVideoPlayer(\'' + playerId + '\', event)" style="flex:1;height:5px;background:rgba(255,255,255,0.3);border-radius:3px;cursor:pointer;position:relative;">' +
        '<div id="' + playerId + '-progress" style="width:0%;height:100%;background:linear-gradient(90deg,#3B82F6,#8B5CF6);border-radius:3px;position:relative;">' +
        '<div style="position:absolute;right:-6px;top:50%;transform:translateY(-50%);width:12px;height:12px;border-radius:50%;background:white;box-shadow:0 0 6px rgba(59,130,246,0.8);border:2px solid #3B82F6;"></div>' +
        '</div>' +
        '</div>' +
        '<span style="color:white;font-size:12px;min-width:38px;font-family:monospace;">' + durationStr + '</span>' +
        '</div>' +
        '</div>' +
        '</div>';
};

// 全局：打开相似题详情弹窗（复用 buildExamDetailHtml 展示题干/选项/答案/解析）
window.openPhotoSimilarDetail = function (idx) {
    var q = window.__photoSimilarQuestions && window.__photoSimilarQuestions[idx];
    if (!q) {
        showToast('相似题数据加载中，请稍候');
        return;
    }
    var diffColor = q.diff === '简单' ? '#10B981' : q.diff === '中等' ? '#F59E0B' : '#EF4444';
    var meta = '<div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;">' +
        '<span><b>相似度：</b><span style="color:#EF4444;font-weight:600;">' + q.sim + '%</span></span>' +
        '<span><b>难度：</b><span style="color:' + diffColor + ';font-weight:600;">' + q.diff + '</span></span>' +
        '<span><b>第 ' + (idx + 1) + ' 题</b> / 共 ' + (window.__photoSimilarQuestions.length) + ' 题</span>' +
        '</div>' +
        '<div style="margin-top:6px;color:#6B7280;">点击下方按钮查看参考答案与详细解析</div>';
    var detailHtml = window.buildExamDetailHtml(q, meta);
    openModal('相似题详情 · ' + q.subject, detailHtml);
}

// 全局：AI解析 - 重新解析交互（Qwen3-72B + 分步推理）
window.aiReparse = function () {
    var btn = document.getElementById('parse-reparse-btn');
    var status = document.getElementById('parse-reparse-status');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
    if (status) {
        status.style.display = 'block';
        status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Qwen3-72B 正在重新解析题目…';
    }

    var phases = [
        'Qwen3-72B 理解题意中…',
        'DeepSeek-R1 分步推理…',
        'BGE-M3 检索相似解法…',
        '生成详细解析完成！'
    ];
    var idx = 0;
    var timer = setInterval(function () {
        if (status && idx < phases.length) {
            status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + phases[idx];
            idx++;
        } else {
            clearInterval(timer);
            // 提升置信度
            var confEl = document.querySelector('#photo-parse-content [style*="font-size:26px"]');
            if (confEl) {
                var newConf = Math.floor(Math.random() * 4) + 95;
                confEl.textContent = newConf + '%';
            }
            if (status) {
                status.style.background = '#ECFDF5';
                status.style.color = '#065F46';
                status.innerHTML = '<i class="fas fa-check-circle"></i> 重新解析完成！已生成更详细的分步解答（Qwen3-72B + DeepSeek-R1）';
            }
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
            setTimeout(function () { if (status) status.style.display = 'none'; }, 4000);
        }
    }, 500);
};

// 全局：相似题 - 换一批交互（BERT语义相似度 + 知识图谱）
window.similarRefresh = function () {
    var btn = document.getElementById('similar-refresh-btn');
    var status = document.getElementById('similar-refresh-status');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
    if (status) {
        status.style.display = 'block';
        status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> BERT 语义检索相似题中…';
    }

    var phases = [
        'BERT 题干语义编码…',
        'Milvus 向量库相似度检索…',
        'DeepKE 知识点关联过滤…',
        '生成新推荐完成！'
    ];
    var idx = 0;
    var timer = setInterval(function () {
        if (status && idx < phases.length) {
            status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + phases[idx];
            idx++;
        } else {
            clearInterval(timer);
            // 随机更新相似度
            if (window.__photoSimilarQuestions) {
                window.__photoSimilarQuestions.forEach(function (q) {
                    q.sim = Math.floor(Math.random() * 10) + 88;
                });
            }
            if (status) {
                status.style.background = '#ECFDF5';
                status.style.color = '#065F46';
                var data = window.__photoSimilarData || {};
                status.innerHTML = '<i class="fas fa-check-circle"></i> 已更新 ' + (data.total_count || 0) + ' 道相似题（匹配度≥88%，BERT + Milvus）';
            }
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
            setTimeout(function () { if (status) status.style.display = 'none'; }, 4000);
        }
    }, 500);
};

// 全局：打开视频讲解完整播放弹窗（可交互播放器 + 三段课程大纲讲解）
window.openPhotoVideoPlay = function () {
    var d = window.__photoVideoData;
    if (!d) {
        showToast('视频数据加载中，请稍候');
        return;
    }
    var html = '';
    // 可交互播放器
    var totalSec = window.parseDuration(d.duration);
    html += window.buildVideoPlayerHTML('video-modal', totalSec, d.duration, d.title);
    // 讲师
    var t = d.teacher || {};
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;padding:10px;background:#F9FAFB;border-radius:10px;">' +
        '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:white;font-size:14px;font-weight:700;">' + (t.avatar_text || '师') + '</div>' +
        '<div><div style="font-size:13px;font-weight:600;">' + (t.name || '讲师') + '</div><div style="font-size:11px;color:#6B7280;">' + (t.desc || '') + '</div></div>' +
        '</div>';
    // 各段讲解
    (d.outline || []).forEach(function (o, i) {
        html += '<div style="border-left:3px solid #3B82F6;padding:10px 12px;margin-bottom:10px;background:#F9FAFB;border-radius:0 8px 8px 0;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">' +
            '<span style="background:#3B82F6;color:white;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:600;">片段 ' + (i + 1) + '</span>' +
            '<span style="font-size:11px;color:#6B7280;">' + o.start + ' - ' + o.end + '</span>' +
            '</div>' +
            '<div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:6px;">' + o.title + '</div>' +
            '<div style="font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap;word-break:break-word;">' + (o.content || o.desc) + '</div>' +
            '</div>';
    });
    openModal('视频讲解 · ' + d.title, html);
    // openModal 注入 DOM 后，绑定真实 outline 到播放器 demoOutline
    setTimeout(function () {
        var st = window.__videoPlayers['video-modal'];
        if (st && d.outline && d.outline.length > 0) st.demoOutline = d.outline.slice();
        window.drawVideoWhiteboard('video-modal');
    }, 60);
}

// 全局：打开视频某段讲解弹窗（可交互播放器，定位到该片段起始时间）
window.openPhotoVideoSegment = function (idx) {
    var d = window.__photoVideoData;
    if (!d || !d.outline || !d.outline[idx]) {
        showToast('讲解内容加载中，请稍候');
        return;
    }
    var o = d.outline[idx];
    var html = '';
    // 可交互播放器，初始定位到该片段起始时间
    var totalSec = window.parseDuration(d.duration);
    var startSec = window.parseDuration(o.start);
    html += window.buildVideoPlayerHTML('video-seg', totalSec, d.duration, o.title);
    // 覆盖初始进度为片段起点（buildVideoPlayerHTML 默认 current=0）
    window.__videoPlayers['video-seg'].current = startSec;
    html += '<div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:10px;">' + o.title + '</div>';
    html += '<div style="font-size:12px;color:#6B7280;margin-bottom:12px;">时段：' + o.start + ' - ' + o.end + ' · ' + o.desc + '</div>';
    html += '<div style="background:#FFFBEB;border-left:3px solid #F59E0B;padding:12px 14px;border-radius:0 8px 8px 0;font-size:13px;color:#92400E;line-height:1.8;white-space:pre-wrap;word-break:break-word;"><b>📝 本段讲解内容</b><br><br>' + (o.content || o.desc) + '</div>';
    openModal('视频片段 · ' + o.title, html);
    // openModal 注入 DOM 后，绑定真实 outline
    setTimeout(function () {
        var st2 = window.__videoPlayers['video-seg'];
        if (st2 && d.outline) st2.demoOutline = d.outline.slice();
        window.updateVideoPlayerUI('video-seg');
        window.drawVideoWhiteboard('video-seg');
    }, 60);
}

// 全局：打开相关推荐视频讲解弹窗（可交互播放器 + 内容概要）
window.openPhotoVideoRec = function (idx) {
    var d = window.__photoVideoData;
    if (!d || !d.rec_videos || !d.rec_videos[idx]) {
        showToast('视频加载中，请稍候');
        return;
    }
    var v = d.rec_videos[idx];
    var html = '';
    // 可交互播放器
    var totalSec = window.parseDuration(v.time);
    html += window.buildVideoPlayerHTML('video-rec', totalSec, v.time, v.title);
    html += '<div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:6px;">' + v.title + '</div>';
    html += '<div style="font-size:12px;color:#6B7280;margin-bottom:12px;">时长 ' + v.time + ' · ' + v.views + ' 次播放</div>';
    html += '<div style="background:#EFF6FF;border-left:3px solid #3B82F6;padding:12px 14px;border-radius:0 8px 8px 0;font-size:13px;color:#1E40AF;line-height:1.8;white-space:pre-wrap;word-break:break-word;"><b>🎬 视频内容概要</b><br><br>' + (v.content || v.desc || '暂无内容概要') + '</div>';
    openModal('相关视频 · ' + v.title, html);
    // openModal 注入 DOM 后，绑定内容为 demoOutline（用 v.content 动态分段）
    setTimeout(function () {
        var st3 = window.__videoPlayers['video-rec'];
        if (st3) {
            window.ensureDemoOutline('video-rec', v.title, v.content || v.desc || v.title);
            window.drawVideoWhiteboard('video-rec');
        }
    }, 60);
}

// 全局桥接：统一的打开相机入口（无论点击首页入口/子模块按钮/相册/闪光都可以先调这里）
window.__PHOTO_CAMERAGO__ = function (mode, afterTarget) {
    try {
        if (window.__PHOTO_CAMERA__ && typeof window.__PHOTO_CAMERA__.open === 'function') {
            window.__PHOTO_CAMERA__.open(mode || 'camera', afterTarget || 'photo-parse');
            return true;
        }
    } catch (e) {}
    showToast && showToast('打开相机镜头…');
    if (typeof navigateTo === 'function') navigateTo(afterTarget || 'photo-parse');
    return false;
};

// ============ 相机动态镜头（全页取景框） ============
// 点击"拍照搜题"子模块 / 拍照按钮 / 相册 / 闪光灯 → 均先打开相机全屏动态镜头
//   mode: 'camera'(默认，实时镜头+扫描线) | 'album'(相册模拟：网格+选择动效)
//   afterTarget: 拍照/选择完成后跳转的页面（默认 photo-parse）
window.__PHOTO_CAMERA__ = {
    timers: [],
    flashOn: false,
    open: function (mode, afterTarget) {
        mode = mode || 'camera';
        afterTarget = afterTarget || 'photo-parse';
        closeModal && closeModal();
        var self = this;
        this.clear();

        var overlay = document.createElement('div');
        overlay.id = 'proto-camera-overlay';
        overlay.style.cssText = 'position:fixed;inset:0;background:#000;z-index:11000;color:white;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC",sans-serif;overflow:hidden;';

        // 顶部状态栏
        var topBar = '<div style="position:absolute;top:0;left:0;right:0;padding:14px 16px 10px;display:flex;align-items:center;justify-content:space-between;background:linear-gradient(180deg,rgba(0,0,0,0.6),transparent);z-index:3;">' +
            '<div id="cam-close" style="width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;cursor:pointer;"><i class="fas fa-times"></i></div>' +
            '<div style="font-size:15px;font-weight:600;letter-spacing:1px;">' + (mode === 'album' ? '选择照片' : '相机') + '</div>' +
            '<div id="cam-flash" style="width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;background:' + (this.flashOn ? '#F59E0B' : 'rgba(255,255,255,0.15)') + ';"><i class="fas fa-bolt"></i></div>' +
        '</div>';

        // 镜头画面：伪实时动态背景（CSS渐变叠加+噪点+呼吸光）
        var lensHTML = '';
        if (mode === 'camera') {
            lensHTML =
            '<div style="position:absolute;inset:0;">' +
              // 模拟实际镜头画面：缓慢变化的多层渐变，模拟教室/课桌动态取景
              '<div id="cam-bg" style="position:absolute;inset:0;background:radial-gradient(ellipse at 30% 30%, rgba(96,165,250,0.22), transparent 55%),radial-gradient(ellipse at 70% 70%, rgba(16,185,129,0.22), transparent 55%),linear-gradient(135deg,#1f2937 0%,#111827 50%,#0b1220 100%);transition:background 2.8s ease-in-out;"></div>' +
              // 噪点层
              '<div id="cam-noise" style="position:absolute;inset:0;opacity:0.08;background-image:repeating-linear-gradient(0deg,rgba(255,255,255,0.5) 0 1px,transparent 1px 3px),repeating-linear-gradient(90deg,rgba(255,255,255,0.3) 0 1px,transparent 1px 2px);mix-blend-mode:overlay;"></div>' +
              // 呼吸光晕（镜头光圈反馈）
              '<div id="cam-breath" style="position:absolute;inset:0;background:radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18) 0%, transparent 38%);animation:camBreath 3.2s ease-in-out infinite;"></div>' +
            '</div>' +
            // 四角取景框
            '<div style="position:absolute;top:70px;left:16px;width:44px;height:44px;border-top:4px solid #34D399;border-left:4px solid #34D399;border-radius:8px 0 0 0;z-index:2;"></div>' +
            '<div style="position:absolute;top:70px;right:16px;width:44px;height:44px;border-top:4px solid #34D399;border-right:4px solid #34D399;border-radius:0 8px 0 0;z-index:2;"></div>' +
            '<div style="position:absolute;bottom:220px;left:16px;width:44px;height:44px;border-bottom:4px solid #34D399;border-left:4px solid #34D399;border-radius:0 0 0 8px;z-index:2;"></div>' +
            '<div style="position:absolute;bottom:220px;right:16px;width:44px;height:44px;border-bottom:4px solid #34D399;border-right:4px solid #34D399;border-radius:0 0 8px 0;z-index:2;"></div>' +
            // 扫描线（上下移动）
            '<div id="cam-scan" style="position:absolute;left:8%;right:8%;top:90px;height:2px;background:linear-gradient(90deg,transparent,#34D399,#60A5FA,transparent);box-shadow:0 0 14px #34D399,0 0 3px #fff;z-index:2;animation:camScan 2.6s ease-in-out infinite alternate;"></div>' +
            // 辅助线（九宫格）
            '<div style="position:absolute;top:25%;left:0;right:0;height:1px;background:rgba(255,255,255,0.14);z-index:1;"></div>' +
            '<div style="position:absolute;top:50%;left:0;right:0;height:1px;background:rgba(255,255,255,0.14);z-index:1;"></div>' +
            '<div style="position:absolute;top:75%;left:0;right:0;height:1px;background:rgba(255,255,255,0.14);z-index:1;"></div>' +
            '<div style="position:absolute;top:0;bottom:0;left:33.333%;width:1px;background:rgba(255,255,255,0.14);z-index:1;"></div>' +
            '<div style="position:absolute;top:0;bottom:0;left:66.666%;width:1px;background:rgba(255,255,255,0.14);z-index:1;"></div>' +
            // 对焦框（随机漂移）
            '<div id="cam-focus" style="position:absolute;top:42%;left:38%;width:120px;height:120px;border:1.5px dashed #F87171;border-radius:8px;animation:camFocus 3.8s ease-in-out infinite;z-index:2;box-shadow:inset 0 0 0 1px rgba(248,113,113,0.2);"></div>' +
            // 取景提示
            '<div style="position:absolute;top:130px;left:50%;transform:translateX(-50%);padding:6px 14px;border-radius:16px;background:rgba(0,0,0,0.45);font-size:12px;color:#D1FAE5;letter-spacing:0.5px;z-index:3;">📐 请将题目放入取景框</div>' +
            // 顶部实时信息（OCR 状态）
            '<div id="cam-status" style="position:absolute;top:58px;right:16px;padding:4px 10px;border-radius:12px;background:rgba(52,211,153,0.18);color:#6EE7B7;font-size:11px;border:1px solid rgba(52,211,153,0.35);z-index:3;"><i class="fas fa-sync-alt fa-spin" style="margin-right:4px;"></i>AI 识别就绪</div>' +
            // 模式切换：拍照/相册/视频
            '<div style="position:absolute;left:0;right:0;bottom:180px;text-align:center;z-index:3;">' +
              '<div id="cam-modes" style="display:inline-flex;gap:20px;padding:6px 14px;border-radius:22px;background:rgba(0,0,0,0.45);font-size:13px;">' +
                '<span data-m="video" style="color:rgba(255,255,255,0.55);cursor:pointer;">视频</span>' +
                '<span data-m="camera" style="color:#fff;font-weight:700;cursor:pointer;">拍照</span>' +
                '<span data-m="album" style="color:rgba(255,255,255,0.55);cursor:pointer;">相册</span>' +
              '</div>' +
            '</div>';
        } else {
            // 相册模式：网格缩略图，点击一张"选中动画"后跳转
            var thumbs = '';
            for (var i = 0; i < 9; i++) {
                var c1 = ['#DBEAFE','#FCE7F3','#FEF3C7','#EDE9FE','#D1FAE5','#FED7AA','#FFE4E6','#CFFAFE','#F3E8FF'][i];
                var c2 = ['#3B82F6','#EC4899','#F59E0B','#8B5CF6','#10B981','#EA580C','#E11D48','#0891B2','#7C3AED'][i];
                var ic = ['fa-square-root-alt','fa-atom','fa-flask','fa-language','fa-paragraph','fa-chart-line','fa-function','fa-vector-square','fa-hashtag'][i] || 'fa-image';
                thumbs += '<div class="cam-thumb" data-i="' + i + '" style="position:relative;aspect-ratio:1/1;border-radius:8px;background:' + c1 + ';display:flex;align-items:center;justify-content:center;cursor:pointer;overflow:hidden;">' +
                    '<i class="fas ' + ic + '" style="font-size:26px;color:' + c2 + ';opacity:0.85;"></i>' +
                    '<div class="cam-thumb-check" style="position:absolute;top:6px;right:6px;width:20px;height:20px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.85);display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(0.5);transition:all .2s;"></div>' +
                    '</div>';
            }
            lensHTML =
            '<div style="position:absolute;top:60px;bottom:180px;left:0;right:0;padding:14px;overflow-y:auto;background:#000;">' +
              '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">' + thumbs + '</div>' +
            '</div>';
        }

        // 底部控件：快门 / 相册切换 / 切换前摄后摄
        var bottomBar =
        '<div style="position:absolute;left:0;right:0;bottom:0;padding:24px 16px 28px;background:linear-gradient(0deg,rgba(0,0,0,0.85),transparent);z-index:3;text-align:center;">' +
          '<div style="display:flex;align-items:center;justify-content:space-around;">' +
            // 左：打开相册
            '<div id="cam-open-album" style="width:46px;height:46px;border-radius:10px;overflow:hidden;cursor:pointer;border:1.5px solid rgba(255,255,255,0.6);background:linear-gradient(135deg,#60A5FA,#EC4899);display:flex;align-items:center;justify-content:center;"><i class="fas fa-images" style="font-size:20px;"></i></div>' +
            // 中：快门
            '<div id="cam-shutter" style="width:74px;height:74px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 0 0 3px #000,0 0 0 5px #fff;">' +
              '<div style="width:62px;height:62px;border-radius:50%;background:#fff;border:3px solid #111827;"></div>' +
            '</div>' +
            // 右：翻转摄像头
            '<div id="cam-switch" style="width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;cursor:pointer;"><i class="fas fa-sync-alt" style="font-size:18px;"></i></div>' +
          '</div>' +
          '<div id="cam-hint" style="margin-top:14px;font-size:12px;color:rgba(255,255,255,0.6);">' + (mode === 'album' ? '点击一张照片以识别' : '轻触快门按钮拍照') + '</div>' +
        '</div>';

        // 快门闪光层
        var flash = '<div id="cam-flash-layer" style="position:absolute;inset:0;background:white;opacity:0;pointer-events:none;z-index:9;"></div>';
        // 识别进度遮罩
        var progress = '<div id="cam-progress" style="position:absolute;inset:0;background:rgba(0,0,0,0.82);z-index:10;display:none;align-items:center;justify-content:center;flex-direction:column;">' +
          '<div style="width:64px;height:64px;border-radius:50%;border:3px solid rgba(255,255,255,0.15);border-top-color:#34D399;animation:camSpin 0.9s linear infinite;margin-bottom:18px;"></div>' +
          '<div id="cam-p-text" style="font-size:14px;color:#D1FAE5;letter-spacing:1px;">正在检测题目区域…</div>' +
          '<div style="width:220px;height:4px;border-radius:2px;background:rgba(255,255,255,0.12);margin-top:16px;overflow:hidden;"><div id="cam-p-bar" style="width:0%;height:100%;background:linear-gradient(90deg,#34D399,#60A5FA);transition:width .4s ease;"></div></div>' +
        '</div>';

        // 注入关键帧样式（避免重复）
        var style = document.createElement('style');
        style.id = 'cam-anim-css';
        style.textContent = [
            '@keyframes camBreath { 0%,100% { opacity:.2; transform: scale(1);} 50% { opacity:.55; transform: scale(1.08);} }',
            '@keyframes camScan   { 0% { transform: translateY(0);} 100% { transform: translateY(calc(100vh - 340px));} }',
            '@keyframes camFocus  { 0%   { transform: translate(0,0) rotate(0deg);} 30%  { transform: translate(40px,-20px) rotate(6deg);} 60%  { transform: translate(-30px,28px) rotate(-4deg);} 100% { transform: translate(0,0) rotate(0deg);} }',
            '@keyframes camSpin   { to { transform: rotate(360deg);} }',
            '@keyframes camShake  { 0%,100%{transform:translate(0,0)} 20%{transform:translate(-2px,1px)} 40%{transform:translate(2px,-1px)} 60%{transform:translate(-1px,2px)} 80%{transform:translate(1px,-2px)} }'
        ].join('\n');

        overlay.innerHTML = style.outerHTML + topBar + lensHTML + bottomBar + flash + progress;
        document.body.appendChild(overlay);

        // 绑定事件
        var $ = function (id) { return overlay.querySelector('#' + id); };
        var closeBtn = $('cam-close'), flashBtn = $('cam-flash');
        if (closeBtn) closeBtn.onclick = function () { self.close(); };
        if (flashBtn) flashBtn.onclick = function () {
            self.flashOn = !self.flashOn;
            this.style.background = self.flashOn ? '#F59E0B' : 'rgba(255,255,255,0.15)';
            showToast && showToast(self.flashOn ? '闪光灯：开' : '闪光灯：关');
            // 闪光灯开启时提亮镜头
            var bg = $('cam-bg');
            if (bg) bg.style.background = self.flashOn
                ? 'radial-gradient(ellipse at 50% 50%, rgba(255,251,235,0.55), transparent 60%),linear-gradient(135deg,#374151,#1F2937,#0b1220)'
                : '';
        };
        var shutter = $('cam-shutter');
        if (shutter) shutter.onclick = function () { self.shoot(afterTarget); };
        var alb = $('cam-open-album');
        if (alb) alb.onclick = function () { self.close(function () { self.open('album', afterTarget); }); };
        var sw = $('cam-switch');
        if (sw) sw.onclick = function () {
            var bg = $('cam-bg');
            if (bg) {
                bg.style.transition = 'background 1s';
                bg.style.background = 'radial-gradient(ellipse at 70% 40%, rgba(236,72,153,0.3), transparent 60%),radial-gradient(ellipse at 30% 80%, rgba(96,165,250,0.3), transparent 60%),linear-gradient(135deg,#111827,#1f2937,#0b1220)';
            }
            showToast && showToast('已切换摄像头');
        };
        // 模式切换标签
        var modes = overlay.querySelectorAll('#cam-modes [data-m]');
        modes.forEach(function (el) {
            el.onclick = function () {
                var m = this.getAttribute('data-m');
                modes.forEach(function (x) { x.style.color = 'rgba(255,255,255,0.55)'; x.style.fontWeight = '400'; });
                this.style.color = '#fff'; this.style.fontWeight = '700';
                if (m === 'camera' || m === 'album') {
                    self.close(function () { self.open(m, afterTarget); });
                } else {
                    showToast && showToast('视频模式 · 敬请期待');
                }
            };
        });
        // 相册缩略图点击：选中 → 闪光 → 进入识别 → 跳 photo-parse
        overlay.querySelectorAll('.cam-thumb').forEach(function (t) {
            t.onclick = function () {
                var ck = this.querySelector('.cam-thumb-check');
                if (ck) { ck.innerHTML = '<i class="fas fa-check" style="color:#10B981;font-size:12px;"></i>'; ck.style.opacity = '1'; ck.style.background = '#fff'; ck.style.transform = 'scale(1)'; }
                this.style.animation = 'camShake .25s';
                setTimeout(function () { self.shoot(afterTarget); }, 320);
            };
        });

        // 实时模拟：镜头背景每 ~3 秒换一次
        if (mode === 'camera') {
            var bgModes = [
                'radial-gradient(ellipse at 30% 30%, rgba(96,165,250,0.22), transparent 55%),radial-gradient(ellipse at 70% 70%, rgba(16,185,129,0.22), transparent 55%),linear-gradient(135deg,#1f2937,#111827,#0b1220)',
                'radial-gradient(ellipse at 60% 20%, rgba(236,72,153,0.18), transparent 55%),radial-gradient(ellipse at 40% 80%, rgba(139,92,246,0.22), transparent 55%),linear-gradient(135deg,#111827,#1F2937,#0f172a)',
                'radial-gradient(ellipse at 50% 40%, rgba(52,211,153,0.22), transparent 55%),radial-gradient(ellipse at 20% 70%, rgba(245,158,11,0.20), transparent 55%),linear-gradient(135deg,#1F2937,#0b1220,#020617)'
            ];
            var step = 0;
            var t1 = setInterval(function () {
                var b = $('cam-bg');
                if (!b) return;
                b.style.background = bgModes[++step % bgModes.length];
            }, 3000);
            this.timers.push(t1);

            // AI 状态提示：动态切换
            var statuses = ['📖 识别印刷体中…', '📐 检测题目边框…', '✍️  识别手写体公式…', '✅ AI 识别就绪'];
            var sIdx = 0;
            var t2 = setInterval(function () {
                var s = $('cam-status');
                if (!s) return;
                sIdx = (sIdx + 1) % statuses.length;
                s.innerHTML = '<i class="fas fa-sync-alt fa-spin" style="margin-right:4px;"></i>' + statuses[sIdx];
            }, 1900);
            this.timers.push(t2);
        }
    },
    clear: function () {
        (this.timers || []).forEach(function (id) { clearInterval(id); clearTimeout(id); });
        this.timers = [];
        var old = document.getElementById('proto-camera-overlay');
        if (old) old.remove();
    },
    close: function (cb) {
        var self = this;
        this.clear();
        if (typeof cb === 'function') setTimeout(cb, 50);
    },
    shoot: function (afterTarget) {
        var self = this;
        var flash = document.querySelector('#cam-flash-layer');
        var prog = document.querySelector('#cam-progress');
        var pText = document.querySelector('#cam-p-text');
        var pBar = document.querySelector('#cam-p-bar');
        if (!flash || !prog) return;

        // 1. 快门白光
        flash.style.transition = 'opacity 80ms linear';
        flash.style.opacity = '1';
        setTimeout(function () { flash.style.transition = 'opacity 220ms ease-out'; flash.style.opacity = '0'; }, 90);
        // 2. 机械快门声（可选：播放一次 CSS 触发的视觉反馈）
        var overlay = document.getElementById('proto-camera-overlay');
        if (overlay) { overlay.style.animation = 'camShake 180ms'; }

        // 3. 显示识别进度
        setTimeout(function () {
            prog.style.display = 'flex';
            var steps = [
                '正在检测题目区域…',
                '正在矫正透视畸变…',
                '正在 OCR 文字识别…',
                '正在匹配题库与 AI 推理…',
                '正在生成解析与相似题…'
            ];
            var i = 0;
            var next = function () {
                if (i >= steps.length) {
                    self.close();
                    showToast && showToast('✅ 识别完成，正在跳转解析…');
                    // 跳转目标页
                    if (typeof navigateTo === 'function') {
                        try { navigateTo(afterTarget); return; } catch (e) {}
                    }
                    if (typeof window.switchPage === 'function') {
                        try { window.switchPage(afterTarget); return; } catch (e) {}
                    }
                    if (typeof openModal === 'function') {
                        openModal('识别结果预览', '<div style="text-align:center;padding:18px 4px;"><i class="fas fa-check-circle" style="color:#10B981;font-size:40px;margin-bottom:12px;"></i><div style="font-size:15px;font-weight:600;color:#111827;">AI 识别完成</div><div style="font-size:12px;color:#6B7280;margin-top:6px;">题目: 已知函数 f(x)=x³-3x+1，求极值</div><div style="margin-top:14px;">相似题推荐：12 题 · 视频解析：2 个</div></div>');
                    }
                    return;
                }
                pText.textContent = steps[i];
                pBar.style.width = Math.round(((i + 1) / steps.length) * 100) + '%';
                i++;
                var t = setTimeout(next, 650);
                self.timers.push(t);
            };
            next();
        }, 260);
    }
};

// 1. 拍照搜题主页面
registerPage('photo-ocr', '拍照搜题', '拍照搜题', 'fa-camera', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('photo-ocr-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('photo-ocr').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var html = '';

        // 顶部说明
        html += GradientCard('blue', `
            <div style="text-align:center;">
                <div style="font-size:20px;font-weight:700;margin-bottom:6px;"><i class="fas fa-camera"></i> ${data.header_title}</div>
                <div style="font-size:13px;opacity:0.9;">${data.header_subtitle}</div>
            </div>
        `);

        // 大型拍照按钮区域（点击后打开全屏相机动态镜头）
        var targetPage = data.camera_target_page || 'photo-parse';
        var goCam = "window.__PHOTO_CAMERAGO__ && window.__PHOTO_CAMERAGO__('camera','" + targetPage + "')";
        html += `
        <div style="background:linear-gradient(135deg,#1F2937,#111827);border-radius:20px;padding:30px 20px;margin-bottom:12px;text-align:center;position:relative;overflow:hidden;cursor:pointer;" onclick="${goCam}">
            <div style="position:absolute;top:12px;left:12px;width:26px;height:26px;border-top:3px solid rgba(255,255,255,0.45);border-left:3px solid rgba(255,255,255,0.45);"></div>
            <div style="position:absolute;top:12px;right:12px;width:26px;height:26px;border-top:3px solid rgba(255,255,255,0.45);border-right:3px solid rgba(255,255,255,0.45);"></div>
            <div style="position:absolute;bottom:12px;left:12px;width:26px;height:26px;border-bottom:3px solid rgba(255,255,255,0.45);border-left:3px solid rgba(255,255,255,0.45);"></div>
            <div style="position:absolute;bottom:12px;right:12px;width:26px;height:26px;border-bottom:3px solid rgba(255,255,255,0.45);border-right:3px solid rgba(255,255,255,0.45);"></div>
            <div style="width:108px;height:108px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#1D4ED8);margin:18px auto 16px;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 6px rgba(255,255,255,0.15),0 0 0 13px rgba(255,255,255,0.08);">
                <i class="fas fa-camera" style="font-size:42px;color:white;"></i>
            </div>
            <div style="color:rgba(255,255,255,0.92);font-size:15px;font-weight:600;">点击拍照（打开相机镜头）</div>
            <div style="color:rgba(255,255,255,0.55);font-size:11px;margin-top:4px;">${data.support_text}</div>
        </div>`;

        // 最近搜题记录（点击后也打开相机镜头："再搜一题"的路径提示）
        html += `<div class="section-title">${data.records_title} <span class="more" onclick="showToast('查看全部搜题记录')">查看全部</span></div>`;

        (data.records || []).forEach(function (r) {
            html += `
            <div class="proto-list-item" onclick="window.__PHOTO_CAMERAGO__ && window.__PHOTO_CAMERAGO__('camera','photo-parse')" style="border-radius:12px;margin-bottom:8px;">
                <div class="icon" style="background:${r.bg}"><i class="fas ${r.icon}"></i></div>
                <div class="text">
                    <div class="title">${r.subject} · ${r.q}</div>
                    <div class="desc">${r.time}</div>
                </div>
                <div class="arrow"><i class="fas fa-chevron-right"></i></div>
            </div>`;
        });

        // 底部操作：相册选择 / 闪光灯切换 → 都先联动到相机镜头
        var actions = data.actions || [];
        var actionsHtml = actions.map(function (a) {
            var action;
            if (a.label.indexOf('相册') >= 0) {
                action = "window.__PHOTO_CAMERAGO__ && window.__PHOTO_CAMERAGO__('album','" + targetPage + "')";
            } else if (a.label.indexOf('闪光') >= 0) {
                action = "(window.__PHOTO_CAMERA__?window.__PHOTO_CAMERA__.open('camera','" + targetPage + "'):window.__PHOTO_CAMERAGO__&&window.__PHOTO_CAMERAGO__('camera','" + targetPage + "'))";
            } else {
                action = "window.__PHOTO_CAMERAGO__ && window.__PHOTO_CAMERAGO__('camera','" + targetPage + "')";
            }
            return '<div onclick="' + action + '" style="flex:1;background:white;border-radius:12px;padding:14px;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:var(--shadow-sm);cursor:pointer;">' +
                '<i class="fas ' + a.icon + '" style="color:' + a.color + ';font-size:18px;"></i>' +
                '<span style="font-size:14px;font-weight:600;">' + a.label + '</span>' +
                '</div>';
        }).join('');
        html += '<div style="display:flex;gap:12px;margin-top:16px;">' + actionsHtml + '</div>';

        container.innerHTML = html;
    }

    return Page({
        title: '拍照搜题',
        tabbar: 'photo',
        content: '<div id="photo-ocr-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// 2. AI解析结果页面
registerPage('photo-parse', 'AI解析', '拍照搜题', 'fa-magic', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('photo-parse-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('photo-parse').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var html = '';

        // 原题图片占位符
        html += `
        <div style="background:#F9FAFB;border-radius:12px;padding:30px;text-align:center;margin-bottom:12px;border:1.5px dashed var(--border);">
            <i class="fas fa-image" style="font-size:34px;color:var(--text-tertiary);margin-bottom:8px;"></i>
            <div style="font-size:12px;color:var(--text-tertiary);">原题图片</div>
        </div>`;

        // OCR识别文本区域
        html += `
        <div class="proto-card">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                <div style="font-size:14px;font-weight:700;"><i class="fas fa-font" style="color:var(--primary);margin-right:6px;"></i>OCR识别结果</div>
                ${Tag(data.ocr_status, 'green')}
            </div>
            <div style="background:#F9FAFB;border-radius:8px;padding:12px;font-size:13px;line-height:1.8;color:var(--text-primary);">
                ${data.ocr_text}
            </div>
        </div>`;

        // 解析置信度
        html += `
        <div class="proto-card" style="display:flex;align-items:center;gap:16px;">
            <div style="flex:1;">
                <div style="font-size:13px;color:var(--text-secondary);">解析置信度</div>
                <div style="font-size:26px;font-weight:700;color:var(--success);margin-top:2px;">${data.confidence}%</div>
                <div style="font-size:11px;color:var(--text-tertiary);margin-top:2px;">${data.confidence_desc}</div>
            </div>
            ${RingChart(data.confidence, '#10B981', 72)}
        </div>`;

        // AI解答区域（分步骤）
        html += `<div class="section-title"><span><i class="fas fa-lightbulb" style="color:var(--warning);margin-right:6px;"></i>AI分步解答</span></div>`;

        (data.steps || []).forEach(function (s, idx) {
            var stepId = 'parse-step-' + idx;
            html += `
            <div class="proto-card" style="border-left:3px solid ${s.border_color};">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;cursor:pointer;" onclick="(function(el,id){var c=document.getElementById(id);if(!c)return;var a=el.querySelector('.step-arrow');if(c.style.display==='none'){c.style.display='';if(a)a.style.transform='rotate(0deg)';}else{c.style.display='none';if(a)a.style.transform='rotate(-90deg)';}})(this,'${stepId}')">
                    <div style="width:24px;height:24px;border-radius:50%;background:${s.bg};color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">${s.no}</div>
                    <div style="font-size:14px;font-weight:700;flex:1;">${s.title}</div>
                    <i class="fas fa-chevron-down step-arrow" style="color:#9CA3AF;font-size:11px;transition:transform .2s;"></i>
                </div>
                <div id="${stepId}" style="font-size:13px;line-height:1.8;color:var(--text-secondary);padding-left:32px;">
                    ${s.content}
                </div>
            </div>`;
        });

        // 操作按钮
        window._parseData = data;
        // 接入数据中台：拍照解析结果持久化到 KV
        if (typeof api !== 'undefined' && api.savePageData) {
            api.savePageData('photo-parse', data).catch(function () {});
        }
        var actions = data.actions || [];
        var actionsHtml = actions.map(function (a) {
            var cls = a.type === 'primary' ? 'proto-btn proto-btn-primary' : 'proto-btn proto-btn-outline';
            var style = a.type === 'primary' ? 'width:auto;flex:1;' : 'width:auto;padding:12px 16px;';
            return '<button class="' + cls + '" style="' + style + '" onclick="navigateTo(\'' + a.page + '\')"><i class="fas ' + a.icon + '"></i> ' + a.label + '</button>';
        }).join('');
        html += '<div style="display:flex;gap:10px;margin-top:16px;">' + actionsHtml + '</div>';

        // AI重新解析按钮
        html += '<button class="proto-btn proto-btn-outline" style="width:100%;margin-top:10px;" id="parse-reparse-btn" onclick="aiReparse()"><i class="fas fa-sync-alt"></i> AI重新解析</button>';
        html += '<div id="parse-reparse-status" style="display:none;margin-top:8px;padding:8px;background:#EFF6FF;border-radius:8px;font-size:12px;color:#1E40AF;text-align:center;"></div>';

        var da = data.detail_action;
        if (da) {
            var daCls = da.type === 'primary' ? 'proto-btn proto-btn-primary' : 'proto-btn proto-btn-outline';
            html += '<button class="' + daCls + '" style="margin-top:10px;" onclick="navigateTo(\'' + da.page + '\')"><i class="fas ' + da.icon + '"></i> ' + da.label + '</button>';
        }

        container.innerHTML = html;
    }

    return Page({
        title: 'AI解析',
        back: true,
        content: '<div id="photo-parse-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// 3. 相似题推荐页面
registerPage('photo-similar', '相似题', '拍照搜题', 'fa-copy', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('photo-similar-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('photo-similar').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var html = '';

        // 标题
        html += GradientCard('purple', `
            <div style="display:flex;align-items:center;gap:12px;">
                <i class="fas fa-magic" style="font-size:28px;"></i>
                <div>
                    <div style="font-size:18px;font-weight:700;">${data.title}</div>
                    <div style="font-size:12px;opacity:0.9;margin-top:2px;">${data.subtitle}</div>
                </div>
            </div>
        `);

        // 相似题列表
        (data.questions || []).forEach(function (q, i) {
            var diffTagColor = q.diff === '简单' ? 'green' : q.diff === '中等' ? 'orange' : 'red';
            html += `
            <div class="proto-card">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                    <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                        ${Tag(q.sim + '%相似', q.tag)}
                        ${Tag(q.subject, 'blue')}
                        ${Tag(q.diff, diffTagColor)}
                    </div>
                    <div style="font-size:11px;color:var(--text-tertiary);">第${i + 1}题</div>
                </div>
                <div style="font-size:14px;font-weight:600;line-height:1.5;margin-bottom:12px;">${q.q}</div>
                <div style="display:flex;gap:8px;">
                    <button class="proto-btn proto-btn-outline" style="width:auto;padding:8px 14px;font-size:13px;" onclick="openPhotoSimilarDetail(${i})"><i class="fas fa-eye"></i> 预览</button>
                    <button class="proto-btn proto-btn-primary" style="width:auto;padding:8px 14px;font-size:13px;" onclick="openPhotoSimilarDetail(${i})"><i class="fas fa-pen"></i> 开始练习</button>
                </div>
            </div>`;
        });

        // 缓存相似题数据到全局，供点击弹窗时使用
        window.__photoSimilarQuestions = data.questions || [];
        window.__photoSimilarData = data;
        // 接入数据中台：相似题推荐结果持久化到 KV
        if (typeof api !== 'undefined' && api.savePageData) {
            api.savePageData('photo-similar', data).catch(function () {});
        }

        // 一键练习全部（从第一题开始）+ 换一批
        html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">
            <button class="proto-btn proto-btn-success" onclick="openPhotoSimilarDetail(0)"><i class="fas fa-layer-group"></i> 一键练习全部（${data.total_count}题）</button>
            <button class="proto-btn proto-btn-outline" id="similar-refresh-btn" onclick="similarRefresh()"><i class="fas fa-sync-alt"></i> 换一批相似题</button>
        </div>
        <div id="similar-refresh-status" style="display:none;margin-top:8px;padding:8px;background:#EFF6FF;border-radius:8px;font-size:12px;color:#1E40AF;text-align:center;"></div>`;

        container.innerHTML = html;
    }

    return Page({
        title: '相似题',
        back: true,
        content: '<div id="photo-similar-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// 4. 视频讲解页面
registerPage('photo-video', '视频讲解', '拍照搜题', 'fa-play-circle', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('photo-video-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('photo-video').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">暂无数据</div></div>';
                return;
            }
            renderPageContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    function renderPageContent(container, data) {
        var html = '';

        // 交互式视频播放器（可播放/暂停/拖动进度条）
        var totalSec = window.parseDuration(data.duration);
        html += window.buildVideoPlayerHTML('video-main', totalSec, data.duration, data.title);

        // 视频标题
        html += `<div style="font-size:17px;font-weight:700;line-height:1.4;margin-bottom:10px;">${data.title}</div>`;

        // 讲师信息
        var t = data.teacher || {};
        html += `
        <div class="proto-card" style="display:flex;align-items:center;gap:12px;">
            <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:700;">${t.avatar_text}</div>
            <div style="flex:1;">
                <div style="font-size:15px;font-weight:700;">${t.name}</div>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${t.desc}</div>
            </div>
            <button onclick="showToast('已关注')" style="padding:6px 14px;border-radius:16px;background:var(--primary-light);color:var(--primary);border:none;font-size:12px;font-weight:600;cursor:pointer;">+ 关注</button>
        </div>`;

        // 知识点标签
        html += `<div class="section-title">知识点</div>`;
        var tagsHtml = (data.knowledge_tags || []).map(function (k) {
            return Tag(k.text, k.color);
        }).join('');
        html += `<div style="display:flex;flex-wrap:wrap;gap:8px;">${tagsHtml}</div>`;

        // 课程大纲（时间轴）
        html += `<div class="section-title">课程大纲</div>`;
        var outlineHtml = (data.outline || []).map(function (o, i) {
            var border = i === (data.outline.length - 1) ? '' : 'border-bottom:1px solid var(--border);';
            return '<div onclick="openPhotoVideoSegment(' + i + ')" style="display:flex;align-items:center;padding:14px 16px;cursor:pointer;' + border + '">' +
                '<div style="width:52px;font-size:11px;color:var(--primary);font-weight:700;line-height:1.4;">' + o.start + '<br>' + o.end + '</div>' +
                '<div style="flex:1;">' +
                '<div style="font-size:14px;font-weight:600;">' + o.title + '</div>' +
                '<div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">' + o.desc + '</div>' +
                '</div>' +
                '<i class="fas fa-play-circle" style="color:var(--primary);font-size:20px;"></i>' +
                '</div>';
        }).join('');
        html += `
        <div class="proto-card" style="padding:0;overflow:hidden;">
            ${outlineHtml}
        </div>`;

        // 相关推荐视频
        html += `<div class="section-title">相关推荐</div>`;
        (data.rec_videos || []).forEach(function (v, i) {
            html += `
            <div class="proto-list-item" onclick="openPhotoVideoRec(${i})" style="border-radius:12px;margin-bottom:8px;">
                <div style="width:84px;height:50px;border-radius:8px;background:#000;display:flex;align-items:center;justify-content:center;margin-right:12px;position:relative;flex-shrink:0;">
                    <i class="fas fa-play" style="color:white;font-size:14px;"></i>
                    <div style="position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.7);color:white;font-size:9px;padding:1px 4px;border-radius:2px;">${v.time}</div>
                </div>
                <div class="text">
                    <div class="title" style="font-size:13px;">${v.title}</div>
                    <div class="desc">${v.views}次播放</div>
                </div>
            </div>`;
        });

        // 缓存视频数据到全局，供点击弹窗时使用
        window.__photoVideoData = data;

        container.innerHTML = html;

        // 渲染完成后，给内嵌播放器绑定真实 outline
        setTimeout(function () {
            var stMain = window.__videoPlayers['video-main'];
            if (stMain && data.outline && data.outline.length > 0) {
                stMain.demoOutline = data.outline.slice();
                window.drawVideoWhiteboard('video-main');
            }
        }, 80);
    }

    return Page({
        title: '视频讲解',
        back: true,
        content: '<div id="photo-video-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});
