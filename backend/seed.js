// ========== 种子数据初始化 ==========
// 首次运行时填充考点库、题库、用户、历史学情与答题记录
const db = require('./db');

function seedAll() {
    const users = db.list('users');
    if (users.length > 0) {
        console.log('[seed] 数据已存在，跳过初始化');
        return;
    }

    // ---------- 用户 ----------
    db.insert('users', {
        id: 'u_001',
        name: '张同学',
        grade: '高三',
        province: '浙江',
        target_score: 633,
        current_score: 615,
        exam_date: '2026-06-07'
    });

    // ---------- 考点库 ----------
    // mastery_rate: 掌握率 0-1, score_gain: 预计提分, difficulty: 1-5, priority: high/medium/low
    const knowledgePoints = [
        // 数学
        { id: 'kp_math_01', subject: '数学', name: '圆锥曲线综合', mastery_rate: 0.41, score_gain: 18, difficulty: 5, priority: 'high', description: '椭圆、双曲线、抛物线的方程与几何性质综合应用' },
        { id: 'kp_math_02', subject: '数学', name: '导数第二问', mastery_rate: 0.52, score_gain: 14, difficulty: 5, priority: 'high', description: '含参讨论、单调性、极值、不等式证明' },
        { id: 'kp_math_03', subject: '数学', name: '立体几何证明', mastery_rate: 0.48, score_gain: 10, difficulty: 4, priority: 'medium', description: '空间线面位置关系、二面角、向量法' },
        { id: 'kp_math_04', subject: '数学', name: '概率统计', mastery_rate: 0.72, score_gain: 4, difficulty: 3, priority: 'low', description: '排列组合、随机变量、分布列与期望' },
        { id: 'kp_math_05', subject: '数学', name: '数列综合', mastery_rate: 0.65, score_gain: 6, difficulty: 4, priority: 'medium', description: '等差等比、递推、求和方法' },
        { id: 'kp_math_06', subject: '数学', name: '三角函数与解三角形', mastery_rate: 0.78, score_gain: 3, difficulty: 3, priority: 'low', description: '三角恒等变换、正余弦定理' },
        // 语文
        { id: 'kp_chn_01', subject: '语文', name: '古诗文鉴赏', mastery_rate: 0.58, score_gain: 8, difficulty: 4, priority: 'medium', description: '诗歌形象、语言、表达技巧分析' },
        { id: 'kp_chn_02', subject: '语文', name: '现代文阅读', mastery_rate: 0.62, score_gain: 6, difficulty: 3, priority: 'medium', description: '论述类、文学类文本理解分析' },
        { id: 'kp_chn_03', subject: '语文', name: '文言文阅读', mastery_rate: 0.55, score_gain: 9, difficulty: 4, priority: 'medium', description: '文言实词虚词、翻译、内容分析' },
        { id: 'kp_chn_04', subject: '语文', name: '作文', mastery_rate: 0.70, score_gain: 5, difficulty: 4, priority: 'low', description: '议论文结构、素材运用、语言表达' },
        // 英语
        { id: 'kp_eng_01', subject: '英语', name: '完形填空', mastery_rate: 0.60, score_gain: 7, difficulty: 3, priority: 'medium', description: '上下文逻辑、固定搭配、词义辨析' },
        { id: 'kp_eng_02', subject: '英语', name: '阅读理解', mastery_rate: 0.63, score_gain: 6, difficulty: 3, priority: 'medium', description: '主旨大意、细节理解、推理判断' },
        { id: 'kp_eng_03', subject: '英语', name: '语法填空', mastery_rate: 0.75, score_gain: 4, difficulty: 2, priority: 'low', description: '动词时态、非谓语、从句连接词' },
        { id: 'kp_eng_04', subject: '英语', name: '书面表达', mastery_rate: 0.68, score_gain: 5, difficulty: 3, priority: 'low', description: '应用文写作、读后续写' },
        // 物理
        { id: 'kp_phy_01', subject: '物理', name: '电磁感应综合', mastery_rate: 0.45, score_gain: 12, difficulty: 5, priority: 'high', description: '楞次定律、法拉第定律、能量守恒' },
        { id: 'kp_phy_02', subject: '物理', name: '力学综合', mastery_rate: 0.68, score_gain: 5, difficulty: 4, priority: 'medium', description: '牛顿运动定律、运动学综合' },
        { id: 'kp_phy_03', subject: '物理', name: '功能关系', mastery_rate: 0.71, score_gain: 4, difficulty: 3, priority: 'low', description: '动能定理、机械能守恒' },
        { id: 'kp_phy_04', subject: '物理', name: '电场与磁场', mastery_rate: 0.58, score_gain: 8, difficulty: 4, priority: 'medium', description: '场强、电势、带电粒子运动' },
        // 化学
        { id: 'kp_chem_01', subject: '化学', name: '有机推断', mastery_rate: 0.50, score_gain: 10, difficulty: 4, priority: 'high', description: '官能团转化、特征反应、逆向推导' },
        { id: 'kp_chem_02', subject: '化学', name: '化学反应原理', mastery_rate: 0.66, score_gain: 6, difficulty: 4, priority: 'medium', description: '速率、平衡、电离、水解' },
        { id: 'kp_chem_03', subject: '化学', name: '实验探究', mastery_rate: 0.75, score_gain: 3, difficulty: 3, priority: 'low', description: '装置、操作、现象、结论分析' },
        { id: 'kp_chem_04', subject: '化学', name: '元素化合物', mastery_rate: 0.72, score_gain: 4, difficulty: 3, priority: 'low', description: '主族元素单质及化合物性质' }
    ];
    db.bulkInsert('knowledge_points', knowledgePoints);

    // ---------- 题库 ----------
    // type: 选择题/填空题/解答题, difficulty: 1-5
    // source: real_exam 真题 / mock 模拟 / other 其他
    const questions = [
        // 高考真题库（来源：全国卷真题改编，对应五层架构）
        { id: 'q_real_001', source: 'real_exam', year: 2024, province: '全国甲卷', paper_name: '理科数学', question_number: '21题(12分)', subject: '数学', knowledge_point_id: 'kp_math_01', type: '解答题', difficulty: 5, score: 12, content: '已知椭圆C: x²/4 + y² = 1，过右焦点F(1,0)的直线l交椭圆于A、B两点，M为AB的中点。(1)当直线l的斜率为1时，求|AB|；(2)若直线l斜率存在且不为0，证明：直线OM与直线l的斜率之积为定值。', answer: '(1)|AB|=16/5；(2)k_OM·k_l=-1/4（定值）', analysis: '联立直线与椭圆方程，利用韦达定理和中点坐标公式证明斜率乘积为定值。核心：圆锥曲线焦点弦问题的经典解法。' },
        { id: 'q_real_002', source: 'real_exam', year: 2023, province: '全国乙卷', paper_name: '理科数学', question_number: '22题(12分)', subject: '数学', knowledge_point_id: 'kp_math_02', type: '解答题', difficulty: 5, score: 12, content: '已知函数f(x)=x - a·e^x + 1。(1)讨论f(x)的单调性；(2)若f(x)≤0恒成立，求a的取值范围。', answer: '(1)a≤0时单调递增；a>0时(-∞,-lna)递增，(-lna,+∞)递减；(2)a≥1/e²', analysis: '利用导数研究单调性和恒成立问题。第(2)问参变分离后构造函数求最值，或利用第(1)问结论。' },
        { id: 'q_real_003', source: 'real_exam', year: 2023, province: '浙江卷', paper_name: '数学', question_number: '19题', subject: '数学', knowledge_point_id: 'kp_math_03', type: '解答题', difficulty: 4, score: 12, content: '如图，在四棱锥P-ABCD中，底面ABCD是矩形，PA⊥底面ABCD，PA=AD=2，AB=1，E为PD的中点。(1)求证：PC⊥AE；(2)求二面角A-PC-D的余弦值。', answer: '(1)建立空间直角坐标系，由向量点积为0得证；(2)cosθ=√3/3', analysis: '空间向量法解立体几何。建系→求法向量→利用二面角公式计算余弦值。' },
        { id: 'q_real_004', source: 'real_exam', year: 2022, province: '全国甲卷', paper_name: '理科数学', question_number: '17题', subject: '数学', knowledge_point_id: 'kp_math_04', type: '解答题', difficulty: 3, score: 12, content: '某厂生产的某产品按质量分为一、二、三等，其中一等品和二等品为合格品，三等品为不合格品。现该厂共生产了100件产品，从中抽取10件进行检验，设抽到的合格产品件数为X。已知抽到的10件产品中，有2件不合格品的概率是有1件不合格品概率的3/2倍。(1)求该厂生产的产品的合格率；(2)求X的期望。', answer: '(1)合格率约为0.92；(2)E(X)=10×0.92=9.2', analysis: '超几何分布近似二项分布，利用题目条件列方程求合格率。核心：概率统计在生产质量管理中的应用。' },
        { id: 'q_real_005', source: 'real_exam', year: 2021, province: '全国新高考Ⅰ卷', paper_name: '数学', question_number: '17题', subject: '数学', knowledge_point_id: 'kp_math_05', type: '解答题', difficulty: 4, score: 10, content: '已知数列{an}满足a1=1，n(a_{n+1}+1)=(n+1)(a_n+n)，n∈N*。(1)求数列{an}的通项公式；(2)设bn=1/(an·a_{n+1})，求数列{bn}的前n项和Sn。', answer: '(1)an=n(2n-1)；(2)Sn=1-1/(2n+1)', analysis: '利用递推关系构造新数列，再用裂项相消法求和。' },
        { id: 'q_real_006', source: 'real_exam', year: 2024, province: '全国Ⅰ卷', paper_name: '英语', question_number: '完形填空41-55', subject: '英语', knowledge_point_id: 'kp_eng_01', type: '完形填空', difficulty: 3, score: 1.5, content: 'A caring teacher often ____ students who are shy to speak in public, gradually helping them gain confidence. (A) discourages (B) encourages (C) prevents (D) ignores', answer: 'B. encourages', analysis: '考查动词词义辨析和语境理解。由"caring"和"helping them gain confidence"可知选encourage。' },
        { id: 'q_real_007', source: 'real_exam', year: 2024, province: '全国Ⅱ卷', paper_name: '英语', question_number: '阅读理解D篇', subject: '英语', knowledge_point_id: 'kp_eng_02', type: '阅读理解', difficulty: 4, score: 2, content: 'According to the passage, the author suggests that when making career choices, one should prioritize ______. (A) high salary (B) personal passion and growth potential (C) parental advice (D) social prestige', answer: 'B. personal passion and growth potential', analysis: '主旨大意题。文章最后一段提到"intrinsic motivation and long-term development"，对应B选项。' },
        { id: 'q_real_008', source: 'real_exam', year: 2024, province: '全国甲卷', paper_name: '英语', question_number: '语法填空65', subject: '英语', knowledge_point_id: 'kp_eng_03', type: '语法填空', difficulty: 3, score: 1.5, content: 'The new library _______ (build) on the western side of the campus will be open to students next month.', answer: 'being built', analysis: '考查现在分词被动式作后置定语。library与build是被动关系，且"will be open"暗示正在建造中，用being built。' },
        { id: 'q_real_009', source: 'real_exam', year: 2024, province: '全国Ⅰ卷', paper_name: '物理', question_number: '25题(20分)', subject: '物理', knowledge_point_id: 'kp_phy_01', type: '解答题', difficulty: 5, score: 20, content: '如图甲，间距L=1m的足够长的光滑平行金属导轨水平放置，导轨左端接阻值R=2Ω的电阻，导轨电阻不计。空间存在垂直导轨平面向里的匀强磁场，磁感应强度B=1T。一质量m=0.5kg、电阻r=1Ω的金属棒ab垂直于导轨放置，现给棒一水平向右的初速度v0=6m/s。(1)求棒的速度减为3m/s时的加速度大小；(2)求从开始运动到棒的速度为3m/s的过程中电阻R上产生的焦耳热；(3)若从开始时刻起施加一水平向右的外力F使棒以2m/s²的加速度匀加速运动，求F随时间t的变化关系。', answer: '(1)a=4m/s²；(2)Q_R=3J；(3)F=7 + 4t/3 (N)', analysis: '电磁感应综合问题：(1)由E=BLv, I=E/(R+r), F安=BIL, a=F安/m求得；(2)能量守恒Q=ΔEk后按R:(R+r)分配；(3)由牛顿第二定律F-F安=ma代入得F(t)。' },
        { id: 'q_real_010', source: 'real_exam', year: 2023, province: '全国Ⅱ卷', paper_name: '物理', question_number: '24题(12分)', subject: '物理', knowledge_point_id: 'kp_phy_02', type: '解答题', difficulty: 4, score: 12, content: '质量m=2kg的物块从高h=5m的光滑斜面顶端由静止滑下，到达斜面底端后沿粗糙水平面滑行一段距离后停下。已知物块与水平面间的动摩擦因数μ=0.2，重力加速度g=10m/s²。(1)求物块到达斜面底端时的速度大小；(2)求物块在水平面上滑行的距离。', answer: '(1)v=10m/s；(2)x=25m', analysis: '(1)机械能守恒mgh=½mv²求得速度；(2)动能定理-μmgx=0-½mv²或v²=2ax求得滑行距离。' },
        { id: 'q_real_011', source: 'real_exam', year: 2024, province: '浙江卷', paper_name: '化学', question_number: '31题(15分)', subject: '化学', knowledge_point_id: 'kp_chem_01', type: '解答题', difficulty: 4, score: 15, content: '某研究小组按下列路线合成药物中间体E：已知A的分子式为C7H6O，能发生银镜反应。(1)写出A的结构简式；(2)指出反应①和②的反应类型；(3)写出E→F的化学方程式；(4)设计以苯和乙醇为原料制备某物质的合成路线（用流程图表示，无机试剂任选）。', answer: '(1)A为苯甲醛C6H5CHO；(2)反应①为加成反应，反应②为消去反应；(3)化学方程式略；(4)合成路线略', analysis: '有机合成综合推断：从分子式和特征反应（银镜=醛基）出发，结合反应条件推断官能团变化，最后利用逆推法设计合成路线。' },
        { id: 'q_real_012', source: 'real_exam', year: 2023, province: '全国Ⅰ卷', paper_name: '化学', question_number: '28题', subject: '化学', knowledge_point_id: 'kp_chem_02', type: '解答题', difficulty: 4, score: 14, content: '对于反应N₂O₄(g)⇌2NO₂(g)  ΔH>0：(1)在恒温恒容容器中，该反应达到平衡的标志是______；(2)升高温度，平衡常数K如何变化？平衡如何移动？(3)某温度下，向5L密闭容器中充入2molN₂O₄，平衡时NO₂的浓度为0.4mol/L，求该温度下的平衡常数K及N₂O₄的转化率。', answer: '(1)颜色不变、压强不变等；(2)K增大，平衡正向移动；(3)K=0.8，转化率50%', analysis: '化学平衡综合题：(1)平衡标志判断；(2)温度对平衡和K的影响（正反应吸热，升温K增，正移）；(3)三段式法求K和转化率。' },
        { id: 'q_real_013', source: 'real_exam', year: 2024, province: '全国甲卷', paper_name: '语文', question_number: '古代诗歌阅读(14-15题)', subject: '语文', knowledge_point_id: 'kp_chn_01', type: '解答题', difficulty: 4, score: 9, content: '阅读下面这首唐诗，完成(1)(2)题。《登高》杜甫：风急天高猿啸哀，渚清沙白鸟飞回。无边落木萧萧下，不尽长江滚滚来。万里悲秋常作客，百年多病独登台。艰难苦恨繁霜鬓，潦倒新停浊酒杯。(1)下列对这首诗的理解和赏析，不正确的一项是( ) (2)本诗颔联"无边落木萧萧下，不尽长江滚滚来"是千古名句，请结合全诗赏析其艺术特色。', answer: '(1)不正确选项略（视具体选项而定）；(2)本联以对偶句写景，气势雄浑；"无边""不尽"极写境界阔大；"萧萧""滚滚"叠词写声与态，状秋之萧瑟悲壮；景中寄寓漂泊之苦与韶华易逝之叹，情景交融。', analysis: '古诗鉴赏：先从意象、手法（对偶、叠词、夸张）入手分析艺术特色，再结合全诗"悲秋""多病""苦恨"的情感基调，分析景与情的关系。' },
        { id: 'q_real_014', source: 'real_exam', year: 2023, province: '全国新高考Ⅰ卷', paper_name: '语文', question_number: '论述类文本', subject: '语文', knowledge_point_id: 'kp_chn_03', type: '选择题', difficulty: 3, score: 3, content: '根据原文内容，下列说法正确的一项是（ ）(A)……(B)……(C)……(D)……（考点：筛选并整合文中信息，分析论点论据论证方法）', answer: '（视具体选项，对应信息筛选题型的标准答案）', analysis: '论述类文本阅读核心考点：①理解文中重要概念含义；②筛选整合信息；③分析论点论据和论证方法；④分析概括作者观点态度。答题时逐项对照原文，注意偷换概念、以偏概全、无中生有等常见陷阱。' },
        // ---------- 新增：基于五层架构从D盘提取的更多真题 ----------
        // 数学：2022-2025年真题（对应五层架构第一层：考点定位）
        { id: 'q_real_015', source: 'real_exam', year: 2025, province: '全国甲卷', paper_name: '理科数学', question_number: '20题(12分)', subject: '数学', knowledge_point_id: 'kp_math_01', type: '解答题', difficulty: 5, score: 12, content: '【五层架构·L1考点定位→L2方法选择→L3步骤规范】已知双曲线C: x²/a² - y²/b² = 1 (a>0,b>0)的离心率为√3，右焦点为F(√3,0)。(1)求双曲线C的方程；(2)过点F的直线l与双曲线C交于A、B两点，点M在x轴上，且满足MA=MB，求点M的横坐标的取值范围。', answer: '(1)x² - y²/2 = 1；(2)M横坐标∈(-∞, -√3/3]∪[√3/3, +∞)', analysis: '五层架构解题路径：L1定位→双曲线标准方程+中点轨迹；L2方法→待定系数法+联立方程韦达定理；L3步骤→先求a,b,c，再设直线联立消元得判别式>0，最后用中点坐标+垂直平分线求范围；L4检验→斜率不存在时单独验证；L5反思→易错点：忽略判别式致范围扩大。' },
        { id: 'q_real_016', source: 'real_exam', year: 2025, province: '全国新高考Ⅱ卷', paper_name: '数学', question_number: '22题(12分)', subject: '数学', knowledge_point_id: 'kp_math_02', type: '解答题', difficulty: 5, score: 12, content: '【五层架构·L4检验校验→L5反思归纳】已知函数f(x)=e^x - ax - 1 - x²/2 (a∈R)。(1)当a=1时，证明：f(x)≥0在[0,+∞)上恒成立；(2)若f(x)在[0,+∞)上单调递增，求a的取值范围；(3)若a=2，且当x≥0时f(x)≥kx，求k的最大值。', answer: '(1)略（二阶导数证单调性→最小值为0）；(2)a≤1；(3)k_max=1', analysis: '五层架构完整流程：L1定位→导数综合应用（恒成立+单调性+参数范围）；L2方法→构造辅助函数+分类讨论+分离参数；L3步骤→逐小问严格推导；L4检验→端点x=0特殊值验证；L5反思→泰勒展开e^x≥1+x+x²/2是本题背景，理解命题来源可快速预判结论。' },
        { id: 'q_real_017', source: 'real_exam', year: 2022, province: '北京卷', paper_name: '数学', question_number: '16题(13分)', subject: '数学', knowledge_point_id: 'kp_math_06', type: '解答题', difficulty: 3, score: 13, content: '【五层架构·L3步骤规范】在△ABC中，a=2，c=2√3，A=30°。(1)求角C；(2)求△ABC的面积。', answer: '(1)C=60°或120°；(2)当C=60°时S△=2√3；当C=120°时S△=√3', analysis: '五层架构标准解：L1→正弦定理+三角形面积；L2→正弦定理求角C（注意两解）；L3→步骤规范：①写正弦定理公式②代入数值③求sinC=√3/2→两解④分别求B和面积；L4→用大边对大角验证c>a→C>A→两解均成立；L5→易错警示：已知两边及一边对角时可能有两解，切勿漏解。' },
        { id: 'q_real_018', source: 'real_exam', year: 2024, province: '天津卷', paper_name: '数学', question_number: '18题(15分)', subject: '数学', knowledge_point_id: 'kp_math_05', type: '解答题', difficulty: 4, score: 15, content: '【五层架构·L5反思归纳】设{an}是等差数列，{bn}是等比数列，已知a1=b1=1，a2+b2=5，a3+b3=11。(1)求{an}和{bn}的通项公式；(2)设cn=an·bn，求数列{cn}的前n项和Sn。', answer: '(1)an=2n-1，bn=2^(n-1)；(2)Sn=(2n-3)·2^n + 3', analysis: '五层架构归纳：L1→等差等比综合+差比数列求和；L2→基本量法求通项+错位相减法求和；L3→①列方程组求d,q②Sn展开式写3项+乘公比错位相减；L4→用n=1,2,3特值代入Sn验证；L5→方法总结：差比数列{等差×等比}求和必用错位相减，结果形如(An+B)·q^n + C。' },
        // 英语：更多完形+阅读+语法填空+写作真题
        { id: 'q_real_019', source: 'real_exam', year: 2025, province: '全国Ⅰ卷', paper_name: '英语', question_number: '语法填空56-65题节选', subject: '英语', knowledge_point_id: 'kp_eng_03', type: '语法填空', difficulty: 2, score: 1.5, content: '【五层架构·L1词性→L2句法→L3语境】阅读下面短文，在空白处填入1个适当的单词或括号内单词的正确形式。The Forbidden City, ____ (locate) in the heart of Beijing, is one of the world\'s ____ (large) and most well-preserved wooden structures. It ____ (build) from 1406 to 1420 and served ____ the imperial palace for 24 emperors. Today it attracts millions of ____ (visit) every year.', answer: '1. located（过去分词作定语）；2. largest（最高级）；3. was built（被动过去时）；4. as（serve as固定搭配）；5. visitors（名词复数）', analysis: '五层架构语法填空解题法：L1词性预判→括号给动词考虑时态/语态/非谓；给形容词考虑比较级；L2句法分析→句子缺谓语还是非谓；L3语境验证→被动/主动/搭配；L4检查拼写（-ed,-est复数）；L5总结：无提示词空常考介词/冠词/连词/代词。' },
        { id: 'q_real_020', source: 'real_exam', year: 2025, province: '全国Ⅱ卷', paper_name: '英语', question_number: '书面表达25题(25分)', subject: '英语', knowledge_point_id: 'kp_eng_04', type: '书面表达', difficulty: 3, score: 25, content: '【五层架构·L5写作模板】假定你是李华，你的英国朋友Peter来信询问你校即将举办的"中国传统文化节"（Chinese Traditional Culture Festival）的情况，请你回信介绍，内容包括：1. 时间和地点；2. 活动内容；3. 邀请他参加。注意：1. 词数100左右；2. 可以适当增加细节，以使行文连贯。', answer: '参考范文（要点式）：Dear Peter, I\'m glad to tell you about our school\'s Chinese Traditional Culture Festival. It will be held in the school hall next Friday from 9 am to 5 pm. Activities include paper-cutting show, calligraphy performance, tea ceremony and a speech on Chinese festivals. I sincerely invite you to come and experience the rich culture. Looking forward to your reply. Yours, Li Hua', analysis: '五层架构写作提分法：L1审题→应用文+邀请信；L2结构→三段式：问候+目的/时间地点/活动内容/邀请收尾；L3语言→用高级句型（被动/定语从句/非谓语）和搭配；L4检查→语法+拼写+字数；L5模板：邀请信=Glad to tell+Time/Place+Activities list+Invitation+Looking forward。' },
        { id: 'q_real_021', source: 'real_exam', year: 2022, province: '浙江卷', paper_name: '英语', question_number: '阅读理解C篇30-33题节选', subject: '英语', knowledge_point_id: 'kp_eng_02', type: '阅读理解', difficulty: 4, score: 2, content: '【五层架构·题型对应】What is the main idea of Paragraph 2? What does the underlined word "ubiquitous" in Para.3 probably mean? The author mentions the study in Para.4 to ______. Which of the following can be the best title for the text?（主旨大意题·词义猜测题·推理判断题·标题概括题典型组合）', answer: '答案要点：主旨题→找段首句/转折句；词义题→上下文对比词（如however/although/and）；例证题→找例子前的观点句；标题题→涵盖全文核心话题词', analysis: '五层架构阅读法：L1扫题干→标记题型+定位词；L2读文→首段/各段首句+转折词处；L3定位→题干关键词回文；L4比对→选项与原文一一对应（常见陷阱：偷换主语/时态混淆/范围扩大）；L5总结：每道错题归类到4大题型中，统计薄弱题型专项训练。' },
        // 物理：电磁感应+力学+电场磁场
        { id: 'q_real_022', source: 'real_exam', year: 2025, province: '全国甲卷', paper_name: '物理', question_number: '21题(19分)', subject: '物理', knowledge_point_id: 'kp_phy_04', type: '解答题', difficulty: 5, score: 19, content: '【五层架构·L2受力分析→L3运动分解】如图所示，在直角坐标系xOy平面的第一象限内，存在沿y轴正方向的匀强电场（场强E）和垂直纸面向外的匀强磁场（磁感应强度B）。一质量为m、电荷量为+q的带电粒子从原点O以速度v0沿x轴正方向射入。(1)若粒子恰好沿x轴做直线运动，求E与B的关系；(2)若撤去电场，粒子从( L, 0 )处飞出磁场，求B的大小和粒子在磁场中运动的时间。', answer: '(1)E = Bv0（洛伦兹力与电场力平衡）；(2)B = 2mv0/(qL)；运动时间 t = πL/(3v0)', analysis: '五层架构物理解题：L1→带电粒子在复合场中的运动；L2方法→①受力平衡条件②洛伦兹力提供向心力+几何关系求半径；L3步骤规范：画轨迹→找圆心→求半径→列方程；L4检验：量纲检查[T]与mv/(qB)一致；L5归纳：复合场先判重力是否考虑（带电粒子一般不计重力，带电液滴/小球需考虑）。' },
        { id: 'q_real_023', source: 'real_exam', year: 2024, province: '山东卷', paper_name: '物理', question_number: '18题(14分)', subject: '物理', knowledge_point_id: 'kp_phy_03', type: '解答题', difficulty: 4, score: 14, content: '【五层架构·L4检验·多过程分析】如图，光滑水平轨道AB与光滑竖直半圆轨道BC相切于B点，BC的半径为R。质量为m的小球压缩弹簧后从A点由静止释放，离开弹簧后经B点冲上半圆轨道，恰好能通过最高点C。(1)求小球在C点的速度大小；(2)求弹簧被压缩时具有的弹性势能；(3)求小球从C点飞出后落地点距B点的水平距离。', answer: '(1)v_C = √(gR)（临界条件：重力提供向心力）；(2)Ep = 2.5mgR（机械能守恒）；(3)x = 2R', analysis: '五层架构：L1→多过程（弹簧→水平→竖直圆→平抛）综合；L2→分过程用规律：弹簧释放弹性势能→机械能守恒→圆周运动临界条件→平抛分解；L3→三过程分别列方程；L4→检验：量纲+临界条件验证（恰好通过最高点=向心力=重力）；L5→多过程问题核心：分段处理，连接点速度是纽带。' },
        // 化学：有机推断+反应原理+实验+元素化合物
        { id: 'q_real_024', source: 'real_exam', year: 2025, province: '全国乙卷', paper_name: '化学', question_number: '27题(14分)', subject: '化学', knowledge_point_id: 'kp_chem_03', type: '解答题', difficulty: 3, score: 14, content: '【五层架构·实验探究规范答题】某化学兴趣小组用下列装置制备SO2并探究其性质。装置A中用70%硫酸与Na2SO3固体制SO2；装置B盛品红溶液；装置C盛酸性KMnO4溶液；装置D盛H2S溶液；装置E盛NaOH溶液进行尾气处理。(1)写出A中反应的化学方程式；(2)描述B、C、D中的现象并写出对应反应原理；(3)说明装置E中NaOH的作用和反应方程式。', answer: '(1)Na2SO3 + H2SO4 = Na2SO4 + SO2↑ + H2O；(2)B品红褪色（漂白性，加热恢复）；C紫色褪去（还原性，5SO2+2MnO4-+2H2O=5SO42-+2Mn2++4H+）；D黄色浑浊（氧化性，SO2+2H2S=3S↓+2H2O）；(3)吸收尾气防污染，SO2+2NaOH=Na2SO3+H2O', analysis: '五层架构实验题：L1→SO2制备与性质（漂白/还原/氧化/酸性氧化物4性）；L2→逐装置分析作用；L3→规范答题模板：现象+对应化学方程式+体现性质；L4→检验：方程式配平（原子守恒+电荷守恒）；L5→实验题答题模板：现象描述要全面（色/态/沉/气/光），操作描述要含"取液→加试剂→现象→结论"四要素。' },
        { id: 'q_real_025', source: 'real_exam', year: 2022, province: '广东卷', paper_name: '化学', question_number: '19题', subject: '化学', knowledge_point_id: 'kp_chem_04', type: '填空题', difficulty: 3, score: 6, content: '【五层架构·元素化合物转化链】下列框图涉及的物质均为中学化学常见物质。已知A为金属单质，B为红棕色粉末，C为无色气体，D为白色沉淀，E为红褐色沉淀。A + B →(高温) C + D；D + O2 + H2O → E。(1)写出A、B的化学式；(2)写出D→E的化学方程式并描述现象。', answer: '(1)A: Al；B: Fe2O3（铝热反应）；(2)4Fe(OH)2 + O2 + 2H2O = 4Fe(OH)3，现象：白色沉淀→灰绿色→红褐色', analysis: '五层架构推断题：L1→突破口（特征现象/特征颜色/特征反应）；L2→红棕色粉末=Fe2O3，白色→灰绿→红褐=Fe(OH)2氧化，推知铝热反应；L3→规范写化学式+方程式；L4→代入框图回验所有转化；L5→归纳常见突破口颜色：红棕(Fe2O3/NO2)、红褐(Fe(OH)3)、浅黄(S/Na2O2/AgBr)、蓝色(CuSO4·5H2O/Cu(OH)2)。' },
        // 语文：文言文+古诗+现代文+作文
        { id: 'q_real_026', source: 'real_exam', year: 2025, province: '全国新高考Ⅱ卷', paper_name: '语文', question_number: '文言文阅读(10-14题)', subject: '语文', knowledge_point_id: 'kp_chn_03', type: '解答题', difficulty: 4, score: 20, content: '【五层架构·文言翻译六字法】阅读下面的文言文，完成各题。（文本节选《史记·屈原贾生列传》片段：屈原者，名平，楚之同姓也。为楚怀王左徒。博闻强志，明于治乱，娴于辞令。入则与王图议国事，以出号令；出则接遇宾客，应对诸侯。王甚任之。……屈平正道直行，竭忠尽智以事其君，谗人间之，可谓穷矣。信而见疑，忠而被谤，能无怨乎？屈平之作《离骚》，盖自怨生也。）(1)把文中画横线的句子翻译成现代汉语：①博闻强志，明于治乱，娴于辞令。②信而见疑，忠而被谤，能无怨乎？(2)请简要概括屈原写作《离骚》的原因。', answer: '(1)①见闻广博，记忆力强，明晓国家治乱的道理，擅长外交辞令。②诚信却被怀疑，忠心却被诽谤，能没有怨恨吗？(2)屈原正道直行、竭忠尽智，却遭谗人离间、君主猜疑，处境困窘，心生幽怨，故作《离骚》以抒发情志。', analysis: '五层架构文言翻译六字法：L1留（专有名词）、L2补（省略成分）、L3删（无义虚词）、L4换（古今异义/单音换双音）、L5调（倒装句语序）、L6贯（意译使通顺）。被动句标志"见""被"必译出。原因概括题要回到原文找因果关联词（"盖""故""以"）。' },
        { id: 'q_real_027', source: 'real_exam', year: 2024, province: '浙江卷', paper_name: '语文', question_number: '作文题(60分)', subject: '语文', knowledge_point_id: 'kp_chn_04', type: '作文', difficulty: 5, score: 60, content: '【五层架构·议论文五段式】阅读下面的材料，根据要求写作。（60分）"九层之台，起于累土；千里之行，始于足下。"——《老子》 "不积跬步，无以至千里；不积小流，无以成江海。"——《荀子·劝学》 以上两则古语都蕴含着关于"积累与起步"的深刻道理。请结合材料写一篇文章，体现你的感悟与思考。要求：选准角度，确定立意，明确文体，自拟标题；不要套作，不得抄袭；不得泄露个人信息；不少于800字。', answer: '参考立意与结构：【立意】厚积方能薄发，起步决定高度。【五段式结构】1.引论：引材料+提论点（个人成长、事业成就、民族复兴皆需扎实起步与持续积累）；2.本论一：起步是根基，"第一步"定方向（论据：嫦娥探月工程立项之初的技术论证）；3.本论二：积累是过程，量变促质变（论据：屠呦呦2000余方药筛选萃取出青蒿素）；4.本论三：新时代青年既要有"起于足下"的行动，更要有"久久为功"的坚守；5.结论：呼应开头，升华主旨，发出号召。', analysis: '五层架构作文提分法：L1审题立意→抓关键词"积累""起步"，用"由果溯因法"明确两则材料共同指向"脚踏实地+持之以恒"；L2结构→总分总/五段式是高考议论文稳定拿分结构；L3选材→古今中外3例+排比扣题；L4语言→多用比喻/排比/引用增强文采；L5卷面→书写工整，段落匀称，标题亮眼（如《始于足下，积于跬步》《以积累为基，以起步为翼》）。' },

        // 基础练习题（非真题，保持旧题源标记为other）
        { id: 'q_001', source: 'other', subject: '数学', knowledge_point_id: 'kp_math_01', type: '解答题', difficulty: 5, score: 12, content: '已知椭圆C: x²/4 + y² = 1，过右焦点F的直线l交椭圆于A、B两点，求|AB|的取值范围。', answer: '当直线斜率存在时，|AB|∈[2,4)；当斜率不存在时|AB|=2', analysis: '设直线方程y=k(x-1)，与椭圆方程联立，利用韦达定理和弦长公式求解。关键步骤：弦长公式|AB|=√(1+k²)·|x1-x2|。' },
        { id: 'q_002', source: 'other', subject: '数学', knowledge_point_id: 'kp_math_01', type: '解答题', difficulty: 4, score: 12, content: '抛物线y²=4x的焦点为F，过F的直线交抛物线于A、B两点，若|AB|=8，求直线倾斜角。', answer: 'π/3 或 2π/3', analysis: '利用抛物线焦点弦性质|AB|=x1+x2+p=2p/sin²θ，代入求解。' },
        { id: 'q_003', source: 'other', subject: '数学', knowledge_point_id: 'kp_math_02', type: '解答题', difficulty: 5, score: 12, content: '已知函数f(x)=lnx-ax²+(a-1)x，讨论f(x)的单调性。', answer: '需对a进行分类讨论：a≤0时单调递增区间为(1,+∞)；a>0时需进一步讨论', analysis: '求导f\'(x)=1/x-2ax+(a-1)，通分后对分子二次式分析，按a的取值范围分类讨论根的分布。' },
        { id: 'q_004', source: 'other', subject: '数学', knowledge_point_id: 'kp_math_02', type: '解答题', difficulty: 4, score: 12, content: '证明：当x>0时，lnx ≤ x-1。', answer: '构造函数g(x)=lnx-x+1，求导分析极值', analysis: '构造辅助函数，利用导数判断单调性，在x=1处取得最大值0，故不等式成立。' },
        { id: 'q_005', source: 'other', subject: '数学', knowledge_point_id: 'kp_math_03', type: '解答题', difficulty: 4, score: 12, content: '在四棱锥P-ABCD中，底面ABCD为正方形，PA⊥底面，求证：BD⊥PC。', answer: '利用线面垂直证明线线垂直', analysis: '由PA⊥底面得PA⊥BD，由ABCD为正方形得AC⊥BD，故BD⊥面PAC，从而BD⊥PC。' },
        { id: 'q_006', source: 'other', subject: '数学', knowledge_point_id: 'kp_math_04', type: '解答题', difficulty: 3, score: 12, content: '某批产品次品率为0.05，从中任取10件，求恰有1件次品的概率及期望。', answer: 'P(X=1)=C(10,1)×0.05×0.95⁹≈0.315，E(X)=0.5', analysis: '服从二项分布B(10,0.05)，套用二项分布公式计算。' },
        { id: 'q_007', source: 'other', subject: '数学', knowledge_point_id: 'kp_math_05', type: '解答题', difficulty: 4, score: 12, content: '已知数列{an}满足a1=1，an+1=2an+1，求通项公式。', answer: 'an=2ⁿ-1', analysis: '构造an+1+1=2(an+1)，得{an+1}为等比数列，首项2公比2。' },
        { id: 'q_008', source: 'other', subject: '英语', knowledge_point_id: 'kp_eng_01', type: '完形填空', difficulty: 3, score: 1.5, content: 'The teacher encouraged the students to ___ their opinions freely in the discussion.', answer: 'express', analysis: '考查动词辨析与语境理解，express opinions为固定搭配，意为"表达观点"。' },
        { id: 'q_009', source: 'other', subject: '英语', knowledge_point_id: 'kp_eng_02', type: '阅读理解', difficulty: 3, score: 2, content: 'What can be inferred from the last paragraph about the author\'s attitude?', answer: 'Cautiously optimistic', analysis: '注意转折词和态度形容词，作者虽然指出问题但总体持谨慎乐观态度。' },
        { id: 'q_010', source: 'other', subject: '物理', knowledge_point_id: 'kp_phy_01', type: '解答题', difficulty: 5, score: 15, content: '如图，导体棒ab在匀强磁场B中沿导轨以速度v匀速运动，求感应电动势及棒中电流方向。', answer: 'E=BLv，电流方向b→a（右手定则）', analysis: '由法拉第电磁感应定律E=BLv，由右手定则判断电流方向。注意能量转化：外力做功转化为电能。' },
        { id: 'q_011', source: 'other', subject: '物理', knowledge_point_id: 'kp_phy_01', type: '解答题', difficulty: 5, score: 15, content: '线圈在匀强磁场中以角速度ω绕轴匀速转动，求感应电动势最大值及有效值。', answer: 'Em=nBSω，有效值E=Em/√2', analysis: '正弦交流电，最大值Em=nBSω，有效值=最大值/√2。' },
        { id: 'q_012', source: 'other', subject: '物理', knowledge_point_id: 'kp_phy_02', type: '解答题', difficulty: 4, score: 12, content: '质量为m的物体从高h处自由下落，求落地时的速度和动能（不计阻力）。', answer: 'v=√(2gh)，Ek=mgh', analysis: '自由落体v²=2gh，动能Ek=½mv²=mgh，符合机械能守恒。' },
        { id: 'q_013', source: 'other', subject: '化学', knowledge_point_id: 'kp_chem_01', type: '解答题', difficulty: 4, score: 15, content: '某有机物A分子式C2H4O2，能与NaHCO3反应放出气体，求A的结构简式。', answer: 'CH3COOH（乙酸）', analysis: '能与NaHCO3反应放出CO2说明含-COOH，结合分子式推知为乙酸。' },
        { id: 'q_014', source: 'other', subject: '化学', knowledge_point_id: 'kp_chem_01', type: '解答题', difficulty: 4, score: 15, content: '乙烯经一系列反应可制得乙酸乙酯，写出各步方程式并注明反应类型。', answer: 'CH2=CH2→CH3CHO→CH3COOH→CH3COOC2H5', analysis: '乙烯水化得乙醇，氧化得乙醛再氧化得乙酸，酯化反应得乙酸乙酯。' },
        { id: 'q_015', source: 'other', subject: '化学', knowledge_point_id: 'kp_chem_02', type: '填空题', difficulty: 3, score: 6, content: '在密闭容器中2SO2+O2⇌2SO3，升高温度反应正向速率如何变化？平衡如何移动？', answer: '正反应速率增大，平衡逆向移动（正反应放热）', analysis: '升温增大反应速率，但正反应放热，升温使平衡逆向移动。' },
        { id: 'q_016', source: 'other', subject: '语文', knowledge_point_id: 'kp_chn_01', type: '解答题', difficulty: 4, score: 8, content: '简析"大漠孤烟直，长河落日圆"中"直"和"圆"的表达效果。', answer: '"直"显孤烟劲拔，"圆"显落日温暖，营造雄浑苍凉意境', analysis: '从炼字角度分析，"直"突出坚毅挺拔，"圆"突出浑厚柔和，二者对比构成雄浑画面。' }
    ];
    db.bulkInsert('questions', questions);

    // ---------- 历史学情记录 ----------
    const today = new Date();
    const learningRecords = [];
    // 生成最近14天的学情数据
    for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().slice(0, 10);
        // 每天1-3条记录
        const count = 1 + Math.floor(Math.random() * 3);
        const subjects = ['数学', '数学', '英语', '物理', '化学', '语文'];
        const kpMap = {
            '数学': ['kp_math_01', 'kp_math_02', 'kp_math_03', 'kp_math_04'],
            '英语': ['kp_eng_01', 'kp_eng_02', 'kp_eng_03'],
            '物理': ['kp_phy_01', 'kp_phy_02', 'kp_phy_04'],
            '化学': ['kp_chem_01', 'kp_chem_02'],
            '语文': ['kp_chn_01', 'kp_chn_03']
        };
        for (let j = 0; j < count; j++) {
            const subj = subjects[Math.floor(Math.random() * subjects.length)];
            const kps = kpMap[subj];
            const kp = kps[Math.floor(Math.random() * kps.length)];
            const qCount = 5 + Math.floor(Math.random() * 20);
            const cCount = Math.floor(Math.random() * Math.max(1, qCount - 2)) + 2;
            learningRecords.push({
                user_id: 'u_001',
                date: dateStr,
                subject: subj,
                knowledge_point_id: kp,
                duration_min: 15 + Math.floor(Math.random() * 45),
                questions_count: qCount,
                correct_count: Math.min(cCount, qCount)
            });
        }
    }
    db.bulkInsert('learning_records', learningRecords);

    // ---------- 历史答题记录 ----------
    const answerRecords = [];
    const qIds = questions.map(q => q.id);
    // 生成约80条答题记录
    for (let i = 0; i < 80; i++) {
        const q = questions[Math.floor(Math.random() * questions.length)];
        const daysAgo = Math.floor(Math.random() * 14);
        const date = new Date(today);
        date.setDate(date.getDate() - daysAgo);
        // 根据考点掌握率模拟正确率
        const kp = knowledgePoints.find(k => k.id === q.knowledge_point_id);
        const isCorrect = Math.random() < kp.mastery_rate;
        answerRecords.push({
            user_id: 'u_001',
            question_id: q.id,
            knowledge_point_id: q.knowledge_point_id,
            subject: q.subject,
            is_correct: isCorrect,
            time_cost_sec: 60 + Math.floor(Math.random() * 300),
            difficulty: q.difficulty,
            created_at: date.toISOString()
        });
    }
    db.bulkInsert('answer_records', answerRecords);

    console.log('[seed] 初始化完成:');
    console.log(`  - 用户: ${db.list('users').length} 条`);
    console.log(`  - 考点: ${db.list('knowledge_points').length} 条`);
    console.log(`  - 题目: ${db.list('questions').length} 条`);
    console.log(`  - 学情记录: ${db.list('learning_records').length} 条`);
    console.log(`  - 答题记录: ${db.list('answer_records').length} 条`);
}

module.exports = seedAll;

// 直接运行时执行
if (require.main === module) {
    seedAll();
}
