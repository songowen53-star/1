// ========== AI 知识图谱路由 ==========
// 学生个人知识图谱 + 前置依赖链
// 对应原型：ai-module-graph
const express = require('express');
const router = express.Router();
const db = require('../db');

// 知识点依赖关系（简化版预定义）
const KP_DEPENDENCIES = {
    'kp_math_002': ['kp_math_010', 'kp_math_011', 'kp_math_012'], // 圆锥曲线综合 → 椭圆/双曲线/抛物线定义
    'kp_math_001': ['kp_math_020'], // 导数第二问 → 导数基础
    'kp_phy_001': ['kp_phy_010', 'kp_phy_011'] // 电磁感应综合 → 电磁基础/楞次定律
};

// GET /api/ai/graph/:user_id
// 学生个人知识图谱
router.get('/:user_id', (req, res) => {
    const { user_id } = req.params;
    const { subject } = req.query;

    let allKp = db.list('knowledge_points');
    if (subject) allKp = allKp.filter(k => k.subject === subject);

    // 过滤该用户的掌握情况（若 knowledge_points 表有 user_id 字段则用之，否则全量）
    const userKp = allKp.filter(k => !k.user_id || k.user_id === user_id);

    const nodes = userKp.map(k => {
        const mastery = k.mastery_rate || 0;
        let status = 'red';
        if (mastery >= 0.8) status = 'green';
        else if (mastery >= 0.5) status = 'yellow';
        return {
            id: k.id,
            label: k.name,
            mastery: mastery,
            status: status,
            level: k.level || 1,
            subject: k.subject,
            score_gain: k.score_gain || 5
        };
    });

    // 构建边：基于预定义依赖
    const edges = [];
    Object.entries(KP_DEPENDENCIES).forEach(([target, prereqs]) => {
        prereqs.forEach(from => {
            if (nodes.find(n => n.id === from) && nodes.find(n => n.id === target)) {
                edges.push({ from, to: target, type: 'prerequisite' });
            }
        });
    });

    const summary = {
        total_points: nodes.length,
        mastered: nodes.filter(n => n.status === 'green').length,
        partial: nodes.filter(n => n.status === 'yellow').length,
        unmastered: nodes.filter(n => n.status === 'red').length
    };

    res.json({
        code: 0,
        data: {
            user_id,
            subject: subject || 'all',
            summary,
            nodes,
            edges
        }
    });
});

// GET /api/ai/graph/:user_id/subject/:subject
// 单学科图谱（复用主路由逻辑，按学科过滤）
router.get('/:user_id/subject/:subject', (req, res) => {
    const { user_id, subject } = req.params;

    let allKp = db.list('knowledge_points').filter(k => k.subject === subject);
    const userKp = allKp.filter(k => !k.user_id || k.user_id === user_id);

    const nodes = userKp.map(k => {
        const mastery = k.mastery_rate || 0;
        let status = 'red';
        if (mastery >= 0.8) status = 'green';
        else if (mastery >= 0.5) status = 'yellow';
        return {
            id: k.id,
            label: k.name,
            mastery,
            status,
            level: k.level || 1,
            subject: k.subject,
            score_gain: k.score_gain || 5
        };
    });

    const edges = [];
    Object.entries(KP_DEPENDENCIES).forEach(([target, prereqs]) => {
        prereqs.forEach(from => {
            if (nodes.find(n => n.id === from) && nodes.find(n => n.id === target)) {
                edges.push({ from, to: target, type: 'prerequisite' });
            }
        });
    });

    const summary = {
        total_points: nodes.length,
        mastered: nodes.filter(n => n.status === 'green').length,
        partial: nodes.filter(n => n.status === 'yellow').length,
        unmastered: nodes.filter(n => n.status === 'red').length
    };

    res.json({
        code: 0,
        data: {
            user_id,
            subject,
            summary,
            nodes,
            edges
        }
    });
});

// GET /api/ai/graph/:user_id/prerequisites/:point_id
// 前置依赖链
router.get('/:user_id/prerequisites/:point_id', (req, res) => {
    const { user_id, point_id } = req.params;

    const target = db.findById('knowledge_points', point_id);
    if (!target) return res.status(404).json({ code: 1, msg: '知识点不存在' });

    // 递归获取前置链
    const chain = [];
    const visited = new Set();
    function collectPrereqs(pid) {
        if (visited.has(pid)) return;
        visited.add(pid);
        const prereqs = KP_DEPENDENCIES[pid] || [];
        prereqs.forEach(preId => {
            const kp = db.findById('knowledge_points', preId);
            if (kp) {
                const mastery = kp.mastery_rate || 0;
                let status = 'red';
                if (mastery >= 0.8) status = 'green';
                else if (mastery >= 0.5) status = 'yellow';
                chain.push({ id: kp.id, label: kp.name, mastery, status });
                collectPrereqs(preId);
            }
        });
    }
    collectPrereqs(point_id);

    // 加入目标节点本身
    const targetMastery = target.mastery_rate || 0;
    let targetStatus = 'red';
    if (targetMastery >= 0.8) targetStatus = 'green';
    else if (targetMastery >= 0.5) targetStatus = 'yellow';

    // 学习路径建议
    const learningPath = chain.filter(c => c.status !== 'green').map(c => c.label);

    res.json({
        code: 0,
        data: {
            target: { id: target.id, label: target.name, mastery: targetMastery, status: targetStatus },
            chain: chain.length > 0 ? chain : [{ id: target.id, label: target.name, mastery: targetMastery, status: targetStatus }],
            learning_path: learningPath.length > 0 ? ['先复习' + learningPath.join(' → ') + ' → 再突破' + target.name] : ['直接突破 ' + target.name]
        }
    });
});

module.exports = router;
