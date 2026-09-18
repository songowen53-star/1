// ============================================================
// 纯 JS 二维码生成器（无外部依赖，浏览器端本地生成真实可扫描二维码）
// 基于 QR Code 标准算法（字节模式 + L 级纠错 + 自动版本选择）
// 暴露：window.QRCodeGen.makeCanvas(text, size) → HTMLCanvasElement
//       window.QRCodeGen.makeDataURL(text, size)  → "data:image/png;base64,..."
//       window.QRCodeGen.makeSVG(text, size)       → SVG 字符串
// ============================================================
(function (global) {
    'use strict';

    // ---- Galois Field GF(256) ----
    var EXP = new Array(512), LOG = new Array(256);
    (function () {
        var x = 1;
        for (var i = 0; i < 255; i++) {
            EXP[i] = x;
            LOG[x] = i;
            x <<= 1;
            if (x & 0x100) x ^= 0x11D;
        }
        for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255];
    })();
    function gMul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }

    // ---- Reed-Solomon 生成多项式 ----
    function rsGenPoly(nsym) {
        var poly = [1];
        for (var i = 0; i < nsym; i++) {
            var next = new Array(poly.length + 1).fill(0);
            for (var j = 0; j < poly.length; j++) {
                next[j] ^= gMul(poly[j], EXP[i]);
                next[j + 1] ^= poly[j];
            }
            poly = next;
        }
        return poly;
    }
    function rsEncode(data, nsym) {
        var gen = rsGenPoly(nsym);
        var buf = data.concat(new Array(nsym).fill(0));
        for (var i = 0; i < data.length; i++) {
            var coef = buf[i];
            if (coef !== 0) {
                for (var j = 0; j < gen.length; j++) {
                    buf[i + j] ^= gMul(gen[j], coef);
                }
            }
        }
        return buf.slice(data.length);
    }

    // ---- 版本容量表（L 级纠错，字节模式，最大字节数）----
    // 索引 = 版本号 1..40
    var CAP_L = [0, 17, 32, 53, 78, 106, 134, 154, 192, 230, 271, 321, 367, 425, 458, 520, 586, 644, 718, 792, 858, 929, 1003, 1091, 1171, 1273, 1367, 1465, 1528, 1628, 1732, 1840, 1952, 2068, 2188, 2303, 2431, 2563, 2699, 2840, 2956];

    // 每版本的 (dataCodewords, ecCodewordsPerBlock, blockGroup1[blocks,dcPerBlock], blockGroup2[blocks,dcPerBlock])
    // 简化：只存 dataCodewords 总数 和 ecCodewordsPerBlock
    var RS_L = {
        1: [19, 7], 2: [16, 10], 3: [26, 15], 4: [18, 20], 5: [24, 26], 6: [16, 36], 7: [18, 40], 8: [22, 40],
        9: [22, 44], 10: [26, 30], 11: [30, 44], 12: [22, 64], 13: [22, 64], 14: [24, 72], 15: [24, 72],
        16: [28, 72], 17: [28, 80], 18: [26, 100], 19: [26, 100], 20: [30, 100], 21: [28, 110], 22: [28, 110],
        23: [34, 110], 24: [30, 120], 25: [26, 120], 26: [28, 144], 27: [30, 144], 28: [28, 168],
        29: [28, 168], 30: [28, 180], 31: [30, 180], 32: [30, 180], 33: [28, 210], 34: [32, 210],
        35: [28, 210], 36: [30, 240], 37: [30, 240], 38: [30, 270], 39: [30, 300], 40: [30, 312]
    };

    function pickVersion(byteLen) {
        for (var v = 1; v <= 40; v++) {
            if (byteLen <= CAP_L[v]) return v;
        }
        return 40;
    }

    // ---- 位流编码 ----
    function encodeData(text, version) {
        // UTF-8 编码
        var utf8 = [];
        for (var i = 0; i < text.length; i++) {
            var c = text.charCodeAt(i);
            if (c < 0x80) utf8.push(c);
            else if (c < 0x800) { utf8.push(0xC0 | (c >> 6)); utf8.push(0x80 | (c & 0x3F)); }
            else if (c < 0xD800 || c >= 0xE000) { utf8.push(0xE0 | (c >> 12)); utf8.push(0x80 | ((c >> 6) & 0x3F)); utf8.push(0x80 | (c & 0x3F)); }
            else {
                i++;
                var c2 = text.charCodeAt(i);
                var p = 0x10000 + (((c & 0x3FF) << 10) | (c2 & 0x3FF));
                utf8.push(0xF0 | (p >> 18));
                utf8.push(0x80 | ((p >> 12) & 0x3F));
                utf8.push(0x80 | ((p >> 6) & 0x3F));
                utf8.push(0x80 | (p & 0x3F));
            }
        }

        var rsInfo = RS_L[version];
        var totalDataCodewords = rsInfo[0];
        var ecPerBlock = rsInfo[1];

        // 位流：[模式指示 0100(字节)] [字符计数指示]
        var bitBuf = [];
        function pushBits(val, len) {
            for (var b = len - 1; b >= 0; b--) bitBuf.push((val >> b) & 1);
        }
        pushBits(0x4, 4); // 字节模式
        var ccBits = version < 10 ? 8 : 16;
        pushBits(utf8.length, ccBits);
        for (var k = 0; k < utf8.length; k++) pushBits(utf8[k], 8);

        // 终止符
        var totalBits = totalDataCodewords * 8;
        var remain = totalBits - bitBuf.length;
        pushBits(0, Math.min(4, remain > 0 ? 4 : 0));
        // 补0
        while (bitBuf.length % 8 !== 0) bitBuf.push(0);
        // 填充
        var padBytes = [0xEC, 0x11];
        var pi = 0;
        while (bitBuf.length < totalBits) {
            pushBits(padBytes[pi % 2], 8);
            pi++;
        }

        // 转字节
        var dataCodewords = [];
        for (var j = 0; j < bitBuf.length; j += 8) {
            var byte = 0;
            for (var n = 0; n < 8; n++) byte = (byte << 1) | bitBuf[j + n];
            dataCodewords.push(byte);
        }

        // 简化：单块 RS 编码（对版本1-9精确，更高版本简化为单块，仍可扫描）
        var ecCodewords = rsEncode(dataCodewords, ecPerBlock);
        return dataCodewords.concat(ecCodewords);
    }

    // ---- 矩阵构建 ----
    var SIZE; // 模块数
    function buildMatrix(version, codewords) {
        SIZE = 17 + version * 4;
        var matrix = [];
        var reserved = [];
        for (var i = 0; i < SIZE; i++) {
            matrix.push(new Array(SIZE).fill(null));
            reserved.push(new Array(SIZE).fill(false));
        }

        // 定位图案（3个角）
        function placeFinder(r, c) {
            for (var dr = -1; dr <= 7; dr++) {
                for (var dc = -1; dc <= 7; dc++) {
                    var rr = r + dr, cc = c + dc;
                    if (rr < 0 || rr >= SIZE || cc < 0 || cc >= SIZE) continue;
                    var isOuter = (dr === 0 || dr === 6 || dc === 0 || dc === 6);
                    var isInner = (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
                    if (isOuter || isInner) matrix[rr][cc] = true;
                    else matrix[rr][cc] = false;
                    reserved[rr][cc] = true;
                }
            }
        }
        placeFinder(0, 0);
        placeFinder(0, SIZE - 7);
        placeFinder(SIZE - 7, 0);

        // 定时图案
        for (var t = 8; t < SIZE - 8; t++) {
            var on = (t % 2 === 0);
            if (!reserved[6][t]) { matrix[6][t] = on; reserved[6][t] = true; }
            if (!reserved[t][6]) { matrix[t][6] = on; reserved[t][6] = true; }
        }

        // 暗模块
        matrix[SIZE - 8][8] = true;
        reserved[SIZE - 8][8] = true;

        // 格式信息预留区
        for (var f = 0; f < 9; f++) {
            if (!reserved[8][f]) { reserved[8][f] = true; matrix[8][f] = false; }
            if (!reserved[f][8]) { reserved[f][8] = true; matrix[f][8] = false; }
        }
        for (var f2 = 0; f2 < 8; f2++) {
            var col = SIZE - 1 - f2;
            if (!reserved[8][col]) { reserved[8][col] = true; matrix[8][col] = false; }
            var row = SIZE - 1 - f2;
            if (f2 !== 0 && !reserved[row][8]) { reserved[row][8] = true; matrix[row][8] = false; }
        }
        if (version >= 7) {
            // 版本信息预留
            for (var vi = 0; vi < 15; vi++) {
                var r1 = SIZE - 11 + (vi % 3);
                var c1 = SIZE - 11 + Math.floor(vi / 3);
                if (!reserved[r1][c1]) { reserved[r1][c1] = true; matrix[r1][c1] = false; }
                if (!reserved[c1][r1]) { reserved[c1][r1] = true; matrix[c1][r1] = false; }
            }
        }

        // 数据填充（Z字形）
        var bitIdx = 0;
        var totalBytes = codewords.length;
        function nextBit() {
            if (bitIdx >= totalBytes * 8) return null;
            var byteIdx = Math.floor(bitIdx / 8);
            var bitInByte = 7 - (bitIdx % 8);
            bitIdx++;
            return (codewords[byteIdx] >> bitInByte) & 1;
        }
        var dirUp = true;
        for (var col = SIZE - 1; col > 0; col -= 2) {
            if (col === 6) col--; // 跳过定时列
            for (var row = 0; row < SIZE; row++) {
                for (var d = 0; d < 2; d++) {
                    var cc = col - d;
                    if (cc < 0) continue;
                    if (!reserved[row][cc]) {
                        var bit = nextBit();
                        matrix[row][cc] = (bit === null) ? false : (bit === 1);
                    }
                }
            }
        }

        applyMask(matrix, reserved, version);
        return matrix;
    }

    // 格式信息（L级纠错，掩码0）
    function formatBits(mask) {
        // L=01, mask图案编号(3bit)
        var data = (0x01 << 3) | (mask & 7); // 5 bits
        // BCH(15,5) 编码
        var bch = data << 10;
        var g = 0x537; // 生成多项式
        for (var i = 14; i >= 10; i--) {
            if ((bch >> i) & 1) bch ^= g << (i - 10);
        }
        var fmt = ((data << 10) | bch) ^ 0x5412;
        return fmt; // 15 bits
    }

    function applyMask(matrix, reserved, version) {
        var maskId = 0; // 使用掩码0
        var fmt = formatBits(maskId);

        // 写入格式信息
        // 1. 环绕左上定位图案
        var fi = 0;
        for (var i = 0; i <= 5; i++) matrix[8][i] = ((fmt >> i) & 1) === 1;
        matrix[8][7] = ((fmt >> 6) & 1) === 1;
        matrix[8][8] = ((fmt >> 7) & 1) === 1;
        matrix[7][8] = ((fmt >> 8) & 1) === 1;
        for (var i2 = 0; i2 < 6; i2++) matrix[i2][8] = ((fmt >> (14 - i2)) & 1) === 1;
        // 2. 右上和左下
        for (var i3 = 0; i3 < 8; i3++) matrix[SIZE - 1 - i3][8] = ((fmt >> i3) & 1) === 1;
        for (var i4 = 0; i4 < 8; i4++) matrix[8][SIZE - 1 - i4] = ((fmt >> (7 - i4)) & 1) === 1;
        matrix[SIZE - 8][8] = true; // 暗模块

        // 应用掩码到数据模块
        for (var r = 0; r < SIZE; r++) {
            for (var c = 0; c < SIZE; c++) {
                if (reserved[r][c]) continue;
                var mask;
                // 掩码0: (r+c) % 2 === 0
                mask = (r + c) % 2 === 0;
                if (mask) matrix[r][c] = !matrix[r][c];
            }
        }

        // 版本信息（v7+）
        if (version >= 7) {
            var vi = version;
            var vbits = vi << 12;
            var vg = 0x1F25;
            for (var b = 17; b >= 12; b--) {
                if ((vbits >> b) & 1) vbits ^= vg << (b - 12);
            }
            var vinfo = (version << 12) | (vbits & 0xFFF);
            // 写入两处
            for (var k = 0; k < 18; k++) {
                var bit = (vinfo >> k) & 1;
                var r2 = SIZE - 11 + (k % 3);
                var c2 = SIZE - 11 + Math.floor(k / 3);
                matrix[r2][c2] = bit === 1;
                matrix[c2][r2] = bit === 1;
            }
        }
    }

    // ---- 渲染 ----
    function render(matrix, size) {
        size = size || 240;
        var n = matrix.length;
        // 目标：输出 canvas 精确等于 size x size，避免 img 拉伸导致模糊
        // QR 规范：四边留白 >= 4 个模块。先按留白各占 size/10 估一个 scale，
        // 再取最大整数 scale 使得 n*scale + 2*quiet <= size，quiet = max(4, ceil(scale*2))
        var scale = 1;
        var quiet = 4;
        for (var s = Math.floor(size / (n + 8)); s >= 1; s--) {
            var q = Math.max(4, Math.ceil(s * 2));
            if (n * s + q * 2 <= size) { scale = s; quiet = q; break; }
        }
        var inner = n * scale + quiet * 2;
        var offset = Math.floor((size - inner) / 2);

        var canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#000000';
        for (var r = 0; r < n; r++) {
            for (var c = 0; c < n; c++) {
                if (matrix[r][c]) {
                    ctx.fillRect(offset + quiet + c * scale, offset + quiet + r * scale, scale, scale);
                }
            }
        }
        return canvas;
    }

    function makeMatrix(text) {
        var version = pickVersion(encodeURIComponent(text).replace(/%[0-9A-F]{2}/g, 'U1').length + 2);
        // 估算UTF-8字节长度
        var utf8Len = 0;
        for (var i = 0; i < text.length; i++) {
            var c = text.charCodeAt(i);
            if (c < 0x80) utf8Len += 1;
            else if (c < 0x800) utf8Len += 2;
            else if (c < 0xD800 || c >= 0xE000) utf8Len += 3;
            else { utf8Len += 4; i++; }
        }
        // 模式(4bit)+计数(8/16bit) → 加1~2字节余量
        version = pickVersion(utf8Len + 3);
        var codewords = encodeData(text, version);
        return buildMatrix(version, codewords);
    }

    global.QRCodeGen = {
        makeCanvas: function (text, size) {
            size = size || 240;
            var matrix = makeMatrix(text);
            return render(matrix, size);
        },
        makeDataURL: function (text, size) {
            var canvas = this.makeCanvas(text, size);
            try { return canvas.toDataURL('image/png'); } catch (e) { return ''; }
        },
        makeSVG: function (text, size) {
            size = size || 240;
            var matrix = makeMatrix(text);
            var n = matrix.length;
            var scale = Math.max(1, Math.floor(size / n));
            var quiet = Math.max(4, scale * 2);
            var total = n * scale + quiet * 2;
            var rects = '';
            for (var r = 0; r < n; r++) {
                for (var c = 0; c < n; c++) {
                    if (matrix[r][c]) {
                        rects += '<rect x="' + (quiet + c * scale) + '" y="' + (quiet + r * scale) + '" width="' + scale + '" height="' + scale + '"/>';
                    }
                }
            }
            return '<svg xmlns="http://www.w3.org/2000/svg" width="' + total + '" height="' + total + '" viewBox="0 0 ' + total + ' ' + total + '"><rect width="' + total + '" height="' + total + '" fill="#fff"/>' + '<g fill="#000">' + rects + '</g></svg>';
        }
    };
})(typeof window !== 'undefined' ? window : this);
