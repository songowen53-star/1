// ========== RAG 知识库存储层 ==========
// 将原本硬编码在 ai.js 的 AI_KB 抽离为独立模块
// 当前实现：基于关键词匹配的本地 JSON 检索（向后兼容）
// 未来扩展：可替换 retrieve() 为向量数据库（Milvus / Pinecone）+ embedding 检索
//   只需实现相同接口：{ retrieve(query, topK), all(), match(question) }，调用方无需改动
const fs = require('fs');
const path = require('path');

const KB_FILE = path.join(__dirname, '..', 'data', 'ai-kb.json');

// 内存缓存（启动时一次性加载）
let kbCache = null;

function loadKB() {
    if (kbCache) return kbCache;
    try {
        if (!fs.existsSync(KB_FILE)) {
            console.warn('[RAG] 知识库文件不存在:', KB_FILE);
            kbCache = [];
            return kbCache;
        }
        kbCache = JSON.parse(fs.readFileSync(KB_FILE, 'utf8') || '[]');
        console.log(`[RAG] 知识库已加载：${kbCache.length} 条`);
    } catch (e) {
        console.error('[RAG] 知识库加载失败:', e.message);
        kbCache = [];
    }
    return kbCache;
}

// 关键词匹配检索（当前实现）
// query: 学生问题文本
// 返回：第一条匹配的条目，或 null
function match(question) {
    const q = (question || '').toLowerCase();
    const kb = loadKB();
    for (const entry of kb) {
        if ((entry.keywords || []).some(kw => q.indexOf(kw.toLowerCase()) >= 0)) {
            return entry;
        }
    }
    return null;
}

// 向量检索接口（预留扩展点）
// 当前回退为关键词匹配；接入向量库后此处替换为 embedding + cosine 相似度
// query: 查询文本, topK: 返回条数
// 返回：[{ ...entry, score }] 按 score 降序
function retrieve(query, topK = 3) {
    const q = (query || '').toLowerCase();
    const kb = loadKB();
    const scored = kb.map(entry => {
        const score = (entry.keywords || []).reduce((s, kw) =>
            s + (q.indexOf(kw.toLowerCase()) >= 0 ? 1 : 0), 0
        );
        return { ...entry, score };
    }).filter(e => e.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
    return scored;
}

// 返回全部条目
function all() {
    return loadKB();
}

// 重新加载（数据文件更新后调用）
function reload() {
    kbCache = null;
    return loadKB();
}

module.exports = { match, retrieve, all, reload, loadKB };
