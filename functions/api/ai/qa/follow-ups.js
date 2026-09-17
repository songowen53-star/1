// GET /api/ai/qa/follow-ups — 推荐追问列表
// 对应后端：backend/routes/ai-qa.js GET /follow-ups
const QA_FOLLOWUPS = ['能不能举个例子？', '这个知识点常考什么？', '出道题练练'];

export async function onRequestGet() {
    return Response.json({ code: 0, data: QA_FOLLOWUPS });
}
