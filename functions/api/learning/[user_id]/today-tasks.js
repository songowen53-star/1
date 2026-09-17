// GET /api/learning/:user_id/today-tasks — 今日任务列表
import { listTable } from '../../../_shared/kv-db.js';

// 学科名归一化：统一"思想政治/思政/道德与法治" → "政治"（与 questions 题库一致）
function normSubject(s) {
    if (!s) return s;
    if (/^思想?政治?$|^思政$|^道德与法治$/.test(s)) return '政治';
    return s;
}

export async function onRequestGet({ params, env, request }) {
    try {
        const userId = params.user_id || 'u_001';
        const url = new URL(request.url);
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const todayWeekday = (today.getDay() + 6) % 7; // 周一=0

        // 学科图标配置（key 已归一化：政治 而非 思想政治）
        const subjectIcons = {
            '数学': { icon: 'fa-square-root-variable', color: 'blue' },
            '语文': { icon: 'fa-book', color: 'red' },
            '英语': { icon: 'fa-language', color: 'green' },
            '物理': { icon: 'fa-atom', color: 'purple' },
            '化学': { icon: 'fa-flask', color: 'orange' },
            '生物': { icon: 'fa-dna', color: 'green' },
            '政治': { icon: 'fa-landmark', color: 'red' },
            '历史': { icon: 'fa-ribbon', color: 'orange' },
            '地理': { icon: 'fa-globe-asia', color: 'blue' },
            '综合': { icon: 'fa-layer-group', color: 'purple' }
        };

        // 1. 获取薄弱知识点（只保留题库中有题目的，掌握率<0.7）
        const questions = await listTable(env, 'questions');
        const validKpIds = new Set(questions.map(q => q.knowledge_point_id).filter(Boolean));
        const kpList = await listTable(env, 'knowledge_points');
        let weakPoints = kpList.filter(k => k.mastery_rate < 0.7 && validKpIds.has(k.id));
        weakPoints.sort((a, b) => b.score_gain - a.score_gain);

        // 按 week-plan 分配逻辑取今天的任务
        const todayTasks = [];
        const learningRecords = await listTable(env, 'learning_records');
        const learnedKpIds = new Set(learningRecords
            .filter(r => r.user_id === userId)
            .map(r => r.knowledge_point_id));

        weakPoints.forEach((kp, idx) => {
            const dayIdx = idx % 7;
            if (dayIdx === todayWeekday) {
                const subj = normSubject(kp.subject) || '综合';
                const cfg = subjectIcons[subj] || subjectIcons['综合'];
                todayTasks.push({
                    subject: subj,
                    color: cfg.color,
                    icon: cfg.icon,
                    knowledge_point_id: kp.id,
                    point: kp.name,
                    difficulty: kp.difficulty >= 4 ? '困难' : (kp.difficulty >= 3 ? '中等' : '简单'),
                    time: (20 + Math.round((kp.score_gain || 5) * 1.5)) + 'min',
                    questions_count: Math.max(5, Math.round((kp.score_gain || 5) * 1.2)),
                    status: 'todo'
                });
            }
        });

        // 2. 今天的学习记录 → 更新任务状态
        const todayRecords = learningRecords.filter(r => r.user_id === userId && r.date === todayStr);
        todayRecords.forEach(rec => {
            const task = todayTasks.find(t => t.knowledge_point_id === rec.knowledge_point_id);
            if (task) {
                task.status = 'done';
                task.questions_count = rec.questions_count || task.questions_count;
                task.correct_rate = rec.questions_count > 0 ? Math.round(rec.correct_count / rec.questions_count * 100) : 0;
                task.duration_min = rec.duration_min;
            }
        });

        // 3. 保证学科多样性：9科中如果有薄弱知识点，则至少每个薄弱科出1个任务；总任务数4~8，未出现学科优先。
        const usedKpIds = new Set(todayTasks.map(t => t.knowledge_point_id));
        const usedSubjects = new Set(todayTasks.map(t => t.subject));
        const MAX_TASKS = 8;

        // 3.1 第一轮：补齐未出现过的学科（最多加到MAX_TASKS个）
        if (todayTasks.length < MAX_TASKS) {
            for (const kp of weakPoints) {
                if (todayTasks.length >= MAX_TASKS) break;
                if (usedKpIds.has(kp.id)) continue;
                const kpSubject = normSubject(kp.subject) || '综合';
                if (usedSubjects.has(kpSubject)) continue;
                const cfg = subjectIcons[kpSubject] || subjectIcons['综合'];
                todayTasks.push({
                    subject: kpSubject,
                    color: cfg.color,
                    icon: cfg.icon,
                    knowledge_point_id: kp.id,
                    point: kp.name,
                    difficulty: kp.difficulty >= 4 ? '困难' : (kp.difficulty >= 3 ? '中等' : '简单'),
                    time: (20 + Math.round((kp.score_gain || 5) * 1.5)) + 'min',
                    questions_count: Math.max(5, Math.round((kp.score_gain || 5) * 1.2)),
                    status: 'todo'
                });
                usedKpIds.add(kp.id);
                usedSubjects.add(kpSubject);
            }
        }

        // 3.2 第二轮：如果仍然少于4个任务，从剩余weak中按学科多样性再补充
        if (todayTasks.length < 4 && weakPoints.length > usedKpIds.size) {
            const candidates = [];
            for (const kp of weakPoints) {
                if (usedKpIds.has(kp.id)) continue;
                const subj = normSubject(kp.subject) || '综合';
                candidates.push({ kp, subj, isNew: !usedSubjects.has(subj) });
            }
            candidates.sort((a, b) => {
                if (a.isNew !== b.isNew) return a.isNew ? -1 : 1;
                return (b.kp.score_gain || 0) - (a.kp.score_gain || 0);
            });
            for (const { kp, subj } of candidates) {
                if (todayTasks.length >= 6) break;
                const cfg = subjectIcons[subj] || subjectIcons['综合'];
                todayTasks.push({
                    subject: subj,
                    color: cfg.color,
                    icon: cfg.icon,
                    knowledge_point_id: kp.id,
                    point: kp.name,
                    difficulty: kp.difficulty >= 4 ? '困难' : (kp.difficulty >= 3 ? '中等' : '简单'),
                    time: (20 + Math.round((kp.score_gain || 5) * 1.5)) + 'min',
                    questions_count: Math.max(5, Math.round((kp.score_gain || 5) * 1.2)),
                    status: 'todo'
                });
                usedKpIds.add(kp.id);
                usedSubjects.add(subj);
            }
        }

        // 4. 统计
        const doneCount = todayTasks.filter(t => t.status === 'done').length;
        const totalCount = todayTasks.length;
        const completionRate = totalCount > 0 ? Math.round(doneCount / totalCount * 100) : 0;

        // 5. 日期格式化
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const dateText = month + '月' + day + '日 ' + weekdayNames[today.getDay()];

        return Response.json({
            code: 0,
            data: {
                date: dateText,
                tasks: todayTasks,
                done_count: doneCount,
                total_count: totalCount,
                completion_rate: completionRate
            }
        });
    } catch (e) {
        return Response.json({ code: 1, msg: 'today-tasks 失败: ' + e.message }, { status: 500 });
    }
}
