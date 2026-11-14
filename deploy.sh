#!/usr/bin/env bash
# =====================================================================
# AI 高考原型 - Cloudflare Pages 一键部署脚本
#
# 用法：
#   1. 确保 CLOUDFLARE_API_TOKEN 环境变量已设置
#      或第一次运行时 prompt 输入
#   2. ./deploy.sh           # 完整部署（推荐）
#   3. ./deploy.sh --dry-run # 只同步不同步，不上传
#   4. ./deploy.sh --only data,pages,functions
#
# 部署链路：
#   backend/data/pages/  →  dist/data/pages/     ← 静态 fallback 数据源
#   prototype/           →  dist/prototype/       ← 前端源码
#   functions/api/*      →  dist/functions/api/     ← Cloudflare Functions
#   backend/data/pages/  →  prototype/data/pages/ ← 开发时本地 fallback 也保持同步
#   legacy/              →  dist/                 ← 非源码生成的根目录文件（主应用等）
# =====================================================================

set -euo pipefail

# 颜色输出
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}ℹ️${NC} $*"; }
ok()      { echo -e "${GREEN}✅${NC} $*"; }
warn()    { echo -e "${YELLOW}⚠️${NC} $*"; }
fail()    { echo -e "${RED}❌${NC} $*"; exit 1; }

# ---------- 参数解析 ----------
DRY_RUN=false
ONLY_TARGETS="all"
for arg in "$@"; do
  case $arg in
    --dry-run)  DRY_RUN=true ;;
    --only)     ONLY_TARGETS="$2"; shift ;;
    *)          fail "未知参数: $arg" ;;
  esac
done

PROJECT_NAME="ai-gaokao-static"
WORKDIR="$(cd "$(dirname "$0")" && pwd)"
cd "$WORKDIR"

# ---------- 1. 环境检查 ----------
info "Step 1: 环境检查"

command -v node >/dev/null 2>&1 || fail "未找到 node，请安装 Node.js 18+"
command -v npx >/dev/null 2>&1   || fail "未找到 npx（随 npm 一起安装）"
NODE_VER=$(node -v | sed 's/v//')
NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
[ "$NODE_MAJOR" -ge 18 ] || warn "Node.js 建议 >= 18，当前 v$NODE_VER"

[ -d "backend/data/pages" ]  || fail "缺失 backend/data/pages 目录"
[ -d "prototype" ]           || fail "缺失 prototype 目录"
[ -f "functions/api/[[path]].js" ] || fail "缺失 functions/api/[[path]].js"
ok "环境 OK（Node.js v$NODE_VER）"

# ---------- 2. Token ----------
info "Step 2: Cloudflare API Token"
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  warn "未检测到 CLOUDFLARE_API_TOKEN 环境变量"
  read -r -p "请输入 token（直接回车跳过上传）: " CLOUDFLARE_API_TOKEN
  export CLOUDFLARE_API_TOKEN
fi
if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then
  ok "Token 已就绪（前 ${#CLOUDFLARE_API_TOKEN} 字符）"
else
  warn "无 Token，本次仅同步 dist 目录"
fi

# ---------- 3. 清理旧 dist ----------
info "Step 3: 清理 dist 目录"
rm -rf dist
mkdir -p dist
cp prototype/_redirects dist/_redirects 2>/dev/null || true
ok "dist 已重建"

# ---------- 4. 同步 prototype 前端 ----------
if [[ "$ONLY_TARGETS" == "all" || "$ONLY_TARGETS" == *"pages"* ]]; then
  info "Step 4: 同步 prototype/  →  dist/prototype/"
  cp -r prototype dist/
  # dist/index.html 作为根目录入口：css/js 相对路径需在根目录也能命中
  rm -rf dist/css dist/js
  cp -r prototype/css dist/css
  cp -r prototype/js  dist/js
  # 生成一个入口页：本地双击 dist/index.html 直接指向 prototype/，线上 / 根路径自动跳转
  cat > dist/index.html <<'INDEXHTML_EOF'
<!DOCTYPE html>
<html lang="zh-CN"><head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI高考 - 产品原型</title>
  <link rel="stylesheet" href="css/prototype.css?v=20260901E">
  <link rel="stylesheet" href="css/fontawesome/all.min.css?v=20260918I">
  <style>
    *{box-sizing:border-box}
    body{margin:0;font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;background:linear-gradient(135deg,#EEF2FF 0%,#E0E7FF 50%,#F5F3FF 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;color:#1F2937}
    .wrap{max-width:420px;padding:36px 28px;background:#fff;border-radius:20px;box-shadow:0 20px 60px rgba(79,70,229,0.15);text-align:center}
    .logo{width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,#4F46E5,#7C3AED);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:28px;color:#fff}
    h1{margin:0 0 6px;font-size:20px;font-weight:700}
    p{margin:0 0 22px;font-size:13px;color:#6B7280;line-height:1.6}
    a.btn{display:block;text-decoration:none;color:#fff;background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:14px;border-radius:12px;font-weight:600;font-size:14px;margin-bottom:10px;box-shadow:0 8px 24px rgba(79,70,229,0.3)}
    a.btn.ghost{background:#F3F4F6;color:#374151;box-shadow:none}
    small{display:block;margin-top:16px;color:#9CA3AF;font-size:11px}
  </style>
</head><body>
  <div class="wrap">
    <div class="logo"><i class="fas fa-graduation-cap"></i></div>
    <h1>AI高考 - 产品原型</h1>
    <p>完整原型位于 <b>prototype/index.html</b>，两种打开方式：</p>
    <a class="btn" href="prototype/index.html">👉 点击进入完整原型</a>
    <a class="btn ghost" href="prototype/index.html">（或直接双击 prototype/index.html）</a>
    <small>Cloudflare Pages 访问 /prototype/ · 本地请双击 prototype/index.html</small>
  </div>
  <script>
    // 线上 / 根路径自动跳转 /prototype/（保留 #hash 避免丢页面状态）
    if (location.hostname && !["localhost","127.0.0.1","file"].includes(location.hostname)) {
      var p = location.pathname;
      if (p === "/" || p === "/index.html") {
        location.replace("prototype/index.html" + location.hash + location.search);
      }
    }
  </script>
</body></html>
INDEXHTML_EOF
  # lib 和 css 完整复制（含字体文件）
  find prototype -name "*.html" -o -name "*.js" -o -name "*.css" -o -name "*.woff*" -o -name "*.ttf" -o -name "*.png" -o -name "*.jpg" -o -name "*.svg" | wc -l | xargs -I{} echo "  {} 个资源文件"
  ok "prototype → dist/prototype/ 完成"
fi

# ---------- 5. 同步 backend/data (pages 静态 fallback) ----------
if [[ "$ONLY_TARGETS" == "all" || "$ONLY_TARGETS" == *"data"* ]]; then
  info "Step 5: 同步 backend/data/  →  dist/data/ + prototype/data/"
  # dist/data/ 用于线上 Cloudflare Pages 静态访问（/data/pages/*.json）
  cp -r backend/data dist/data
  # prototype/data/ 用于开发时本地代理的 fallback
  cp -r backend/data prototype/data
  # 敏感数据不进 CDN：用户库、员工账号、题目校准
  rm -f dist/data/learning-db.json dist/data/staff.json dist/data/diagnostic-calibration.json
  rm -f prototype/data/learning-db.json prototype/data/staff.json prototype/data/diagnostic-calibration.json
  PAGE_COUNT=$(ls backend/data/pages/*.json 2>/dev/null | wc -l)
  PRACTICE_COUNT=$(node -e "const j=require('./backend/data/pages/practice-real-exam.json'); const d=j.data||j; console.log(d.exams?.length||'?');")
  echo "  pages/*.json:     $PAGE_COUNT 个"
  echo "  practice-real-exam exams: $PRACTICE_COUNT"
  ok "data 同步完成 ✅ 线上静态 fallback 与 API 数据源一致"
fi

# ---------- 6. 同步 Functions ----------
if [[ "$ONLY_TARGETS" == "all" || "$ONLY_TARGETS" == *"functions"* ]]; then
  info "Step 6: 同步 functions/api/[[path]].js  →  dist/functions/api/"
  node tools/gen-diagnostic-bank.js
  node tools/gen-page-data.js
  mkdir -p dist/functions/api
  cp "functions/api/[[path]].js" "dist/functions/api/"
  cp "functions/api/_diagnostic-bank.js" "dist/functions/api/"
  cp "functions/api/_diagnostic-blueprint.js" "dist/functions/api/"
  cp "functions/api/_page-data.js" "dist/functions/api/"
  node --check "functions/api/[[path]].js" && ok "Functions JS 语法校验通过 ✅" || fail "Functions JS 语法错误"
  wc -l "functions/api/[[path]].js" | awk '{print "  Functions 行数:", $1}'
fi

# ---------- 6.5 同步 legacy 根目录文件 ----------
# Step 3 的 rm -rf dist 会清掉所有非源码生成的文件，这里统一从 legacy/ 复制回来。
# legacy/ 收纳：index-home.html（主应用）、index-static.html、data-manager.html、
#               _redirects（/api/* → 静态 json 路由）、api/*.json（静态 fallback）、
#               css/style.css、js/main.js（主应用专属样式与脚本）
# 注意：不收纳 backend/ —— 后端源码不应公开到 CDN
if [[ "$ONLY_TARGETS" == "all" ]]; then
  info "Step 6.5: 同步 legacy/  →  dist/ 根目录"
  if [ -d "legacy" ]; then
    # 根目录 HTML、缓存头与 _redirects
    for f in legacy/*.html legacy/_redirects legacy/_headers; do
      if [ -f "$f" ]; then cp "$f" "dist/$(basename "$f")"; fi
    done
    # 主应用专属 css / js（prototype/ 中不存在，必须在 Step 4 重建后再注入）
    if [ -f "legacy/css/style.css" ]; then cp "legacy/css/style.css" "dist/css/style.css"; fi
    if [ -f "legacy/js/main.js" ];    then cp "legacy/js/main.js"    "dist/js/main.js";    fi
    # 静态 API fallback
    if [ -d "legacy/api" ]; then cp -r legacy/api dist/api; fi
    echo "  legacy 文件数: $(find legacy -type f | wc -l)"
    ok "legacy → dist/ 完成 ✅"
  else
    warn "未找到 legacy/ 目录，跳过（主应用 index-home.html 将不会部署）"
  fi
fi

# ---------- 7. 校验同步结果 ----------
info "Step 7: 同步结果校验"
[ -f "dist/index.html" ]                        && ok "dist/index.html" || fail "缺失"
[ -f "dist/prototype/index.html" ]              && ok "dist/prototype/index.html" || fail "缺失"
[ -f "dist/data/pages/practice-real-exam.json" ] && ok "dist/data/pages/practice-real-exam.json" || fail "缺失"
[ -f "dist/functions/api/[[path]].js" ]          && ok "dist/functions/api/[[path]].js" || fail "缺失"
[ -f "dist/functions/api/_diagnostic-bank.js" ]   && ok "dist/functions/api/_diagnostic-bank.js" || fail "缺失诊断题库模块"
[ -f "dist/index-home.html" ]                   && ok "dist/index-home.html（主应用）" || warn "dist/index-home.html 缺失"
[ -f "dist/css/style.css" ] && [ -f "dist/js/main.js" ] && ok "主应用 css/style.css + js/main.js" || warn "主应用样式/脚本缺失"
[ -f "dist/_redirects" ]                        && ok "dist/_redirects" || warn "dist/_redirects 缺失"

# critical: practice-real-exam 的 exams 数量必须 == 93（预期值）
ACTUAL=$(node -e "const j=require('./dist/data/pages/practice-real-exam.json'); const d=j.data||j; console.log(d.exams?.length||-1);")
if [ "$ACTUAL" = "93" ]; then
  ok "practice-real-exam exams=$ACTUAL ✅（预期 93）"
else
  fail "practice-real-exam exams=$ACTUAL ❌ 预期 93，可能数据源又漂了！"
fi

# critical: 诊断题库必须与数据源一致（脚本自动生成，禁止硬编码题数）
BANK_SRC=$(node -e "const b=require('./backend/data/diagnostic-bank.json'); console.log((b.questions||[]).length);")
BANK_DIST=$(node -e "const b=require('./dist/data/diagnostic-bank.json'); console.log((b.questions||[]).length);")
BANK_FN=$(grep -c '"id": "dg_' dist/functions/api/_diagnostic-bank.js || true)
if [ "$BANK_SRC" = "$BANK_DIST" ] && [ "$BANK_SRC" = "$BANK_FN" ] && [ "$BANK_SRC" -ge 100 ]; then
  ok "诊断题库 $BANK_SRC 题 ✅（JSON/静态/ Functions 三处一致）"
else
  fail "诊断题库不一致 ❌ src=$BANK_SRC dist=$BANK_DIST functions=$BANK_FN（要求 ≥100 且三处相等）"
fi

# ---------- 8. Dry run? ----------
if [ "$DRY_RUN" = true ]; then
  warn "--dry-run 模式，跳过上传"
  ls -la dist/ | head -10
  echo ""
  ok "✅ 本地同步完成（未上传 Cloudflare）"
  exit 0
fi

# ---------- 9. Cloudflare Pages 部署 ----------
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  warn "跳过 Cloudflare 部署（无 Token）"
  echo ""
  ok "✅ 本地同步完成"
  exit 0
fi

info "Step 8: wrangler pages deploy dist --project-name=$PROJECT_NAME"
CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" \
  npx wrangler pages deploy dist --project-name="$PROJECT_NAME" --branch=main 2>&1 | tee /tmp/deploy-output.log
EXIT_CODE=${PIPESTATUS[0]}

if [ $EXIT_CODE -ne 0 ]; then
  fail "wrangler deploy 失败（exit=$EXIT_CODE），完整日志："
  cat /tmp/deploy-output.log
  exit $EXIT_CODE
fi

DEPLOY_URL=$(grep -oP 'https://[a-f0-9]+\.ai-gaokao-static\.pages\.dev' /tmp/deploy-output.log | head -1 || true)
if [ -n "$DEPLOY_URL" ]; then
  ok "部署成功！预览：$DEPLOY_URL"
fi

echo ""
ok "========================================"
ok "  部署完成"
ok "========================================"
echo ""
echo "📦 项目：$PROJECT_NAME"
echo "🕸️  线上地址：https://ai-gaokao-static.pages.dev/prototype/"
echo "📁 同步内容：prototype + backend/data + functions/api + legacy"
echo "📋 practice-real-exam exams=$ACTUAL"
