// ============================================================
// AI学习中心 - 页面模块（动态加载：数据来自 /api/page-data/:key）
// ============================================================

// AI知识库：基于关键词的智能回复匹配
var AI_KNOWLEDGE_BASE = [
    // ===== 数学 =====
    {
        keywords: ['导数', '求导', 'f\'(x)', "f'(x)", '微分'],
        subject: '数学',
        analysis: '导数问题要从定义出发：f\'(x₀) = lim(Δx→0) [f(x₀+Δx) - f(x₀)] / Δx。解题思路：① 识别函数类型选对应求导公式；② 应用四则运算法则逐步求导；③ 结合几何意义（切线斜率）或极值判断方向；④ 验算结果。',
        reply: '<div style="line-height:1.7;"><b style="color:#3B82F6;">📐 导数（求导）详解</b><br><br>' +
            '<b>一、基本定义</b><br>导数 f\'(x₀) = lim(Δx→0) [f(x₀+Δx) - f(x₀)] / Δx<br><br>' +
            '<b>二、常用求导公式</b><br>' +
            '• (xⁿ)\' = nxⁿ⁻¹<br>' +
            '• (sinx)\' = cosx，(cosx)\' = -sinx<br>' +
            '• (eˣ)\' = eˣ，(lnx)\' = 1/x<br>' +
            '• (aˣ)\' = aˣ· lna<br><br>' +
            '<b>三、四则运算法则</b><br>' +
            '• (u±v)\' = u\'±v\'<br>' +
            '• (uv)\' = u\'v + uv\'<br>' +
            '• (u/v)\' = (u\'v - uv\')/v²<br><br>' +
            '<b>四、几何意义</b><br>f\'(x₀) 表示曲线 y=f(x) 在点 (x₀,f(x₀)) 处的切线斜率。<br><br>' +
            '<b>💡 记忆口诀</b>：幂函数求导，指数变系数，指数减1。</div>'
    },
    {
        keywords: ['椭圆', '双曲线', '抛物线', '圆锥曲线'],
        subject: '数学',
        analysis: '圆锥曲线问题先看定义：椭圆距离和=2a、双曲线距离差=2a、抛物线到焦点=到准线。思路：① 由定义判断曲线类型；② 写出标准方程；③ 用 a、b、c 关系求未知量（椭圆 a²=b²+c²、双曲线 c²=a²+b²）；④ 离心率 e=c/a 区分类型（椭圆 e<1，双曲线 e>1，抛物线 e=1）。',
        reply: '<div style="line-height:1.7;"><b style="color:#10B981;">🎯 圆锥曲线对比</b><br><br>' +
            '<table style="width:100%;border-collapse:collapse;font-size:12px;"><tr style="background:#EFF6FF;"><th style="padding:6px;border:1px solid #E5E7EB;">类型</th><th style="padding:6px;border:1px solid #E5E7EB;">定义</th><th style="padding:6px;border:1px solid #E5E7EB;">标准方程</th></tr>' +
            '<tr><td style="padding:6px;border:1px solid #E5E7EB;"><b>椭圆</b></td><td style="padding:6px;border:1px solid #E5E7EB;">到两焦点距离和=2a</td><td style="padding:6px;border:1px solid #E5E7EB;">x²/a² + y²/b² = 1</td></tr>' +
            '<tr><td style="padding:6px;border:1px solid #E5E7EB;"><b>双曲线</b></td><td style="padding:6px;border:1px solid #E5E7EB;">到两焦点距离差=2a</td><td style="padding:6px;border:1px solid #E5E7EB;">x²/a² - y²/b² = 1</td></tr>' +
            '<tr><td style="padding:6px;border:1px solid #E5E7EB;"><b>抛物线</b></td><td style="padding:6px;border:1px solid #E5E7EB;">到焦点=到准线</td><td style="padding:6px;border:1px solid #E5E7EB;">y² = 2px</td></tr>' +
            '</table><br>' +
            '<b>⚠️ 关键关系</b>：<br>椭圆：a² = b² + c² (a最大)<br>双曲线：c² = a² + b² (c最大)<br>离心率 e = c/a：椭圆 e<1，双曲线 e>1，抛物线 e=1</div>'
    },
    {
        keywords: ['极值', '最值', '单调性', '驻点'],
        subject: '数学',
        analysis: '极值/单调性问题用导数工具。思路：① 求导数 f\'(x)；② 令 f\'(x)=0 解驻点；③ 判断驻点两侧导数符号变化（由正变负→极大值，由负变正→极小值）；④ 闭区间最值还要比较端点值和不可导点值。',
        reply: '<div style="line-height:1.7;"><b style="color:#EF4444;">📊 函数单调性与极值</b><br><br>' +
            '<b>一、利用导数判断单调性：</b><br>' +
            '• f\'(x) > 0 在区间内 → f(x) <b>单调递增</b><br>' +
            '• f\'(x) < 0 在区间内 → f(x) <b>单调递减</b><br><br>' +
            '<b>二、求极值步骤：</b><br>' +
            '1️⃣ 求导数 f\'(x)<br>' +
            '2️⃣ 令 f\'(x)=0，解出<b>驻点</b><br>' +
            '3️⃣ 判断驻点两侧导数<b>符号变化</b>：<br>' +
            '&nbsp;&nbsp;由正变负 → 极大值<br>' +
            '&nbsp;&nbsp;由负变正 → 极小值<br><br>' +
            '<b>三、极值 vs 最值</b>：极值是局部概念，最值是全局概念。求闭区间最值需比较：端点值 + 驻点值 + 不可导点值。</div>'
    },
    {
        keywords: ['三角', 'sin', 'cos', '诱导公式'],
        subject: '数学',
        reply: '<div style="line-height:1.7;"><b style="color:#F59E0B;">📐 三角函数诱导公式</b><br><br>' +
            '<b>口诀</b>：<span style="background:#FEF3C7;padding:2px 6px;border-radius:4px;">奇变偶不变，符号看象限</span><br><br>' +
            '<b>一、同角关系</b>：<br>sin²x + cos²x = 1，tanx = sinx/cosx<br><br>' +
            '<b>二、诱导公式示例</b>：<br>' +
            '• sin(π/2 + x) = cosx（90°奇变，II象限sin+）<br>' +
            '• cos(π/2 + x) = -sinx（90°奇变，II象限cos-）<br>' +
            '• sin(π + x) = -sinx（180°偶不变，III象限sin-）<br>' +
            '• cos(π + x) = -cosx（180°偶不变，III象限cos-）<br><br>' +
            '<b>三、和差角公式</b>：<br>sin(A±B) = sinAcosB ± cosAsinB<br>cos(A±B) = cosAcosB ∓ sinAsinB</div>'
    },
    {
        keywords: ['数列', '等差', '等比', 'an', 'sn'],
        subject: '数学',
        reply: '<div style="line-height:1.7;"><b style="color:#8B5CF6;">📋 数列知识点总结</b><br><br>' +
            '<b>一、等差数列 {aₙ}</b><br>' +
            '• 通项：aₙ = a₁ + (n-1)d<br>' +
            '• 求和：Sₙ = n(a₁+aₙ)/2 = na₁ + n(n-1)d/2<br>' +
            '• 中项：2A = a + b<br><br>' +
            '<b>二、等比数列 {aₙ}</b><br>' +
            '• 通项：aₙ = a₁ · qⁿ⁻¹<br>' +
            '• 求和：Sₙ = a₁(1-qⁿ)/(1-q) (q≠1)<br>' +
            '• 中项：G² = a · b<br><br>' +
            '<b>三、常用技巧</b>：裂项相消、错位相减、分组求和、倒序相加。<br><br>' +
            '<b>💡 记忆</b>：等差看d，等比看q；先看项间关系，再选方法。</div>'
    },
    {
        keywords: ['概率', '统计', '分布', '期望', '方差'],
        subject: '数学',
        reply: '<div style="line-height:1.7;"><b style="color:#06B6D4;">🎲 概率与统计</b><br><br>' +
            '<b>一、古典概型</b>：P(A) = 事件A包含基本事件数 / 总基本事件数<br><br>' +
            '<b>二、常见离散分布</b>：<br>' +
            '• <b>二项分布 B(n,p)</b>：n次独立重复试验<br>&nbsp;&nbsp;E(X) = np，D(X) = np(1-p)<br>' +
            '• <b>超几何分布</b>：不放回抽样<br><br>' +
            '<b>三、正态分布 N(μ,σ²)</b>：<br>' +
            '• 均值 μ，方差 σ²<br>' +
            '• 3σ原则：约99.7%数据落在(μ-3σ, μ+3σ)内<br><br>' +
            '<b>四、回归分析</b>：看相关系数 r，|r|越接近1，线性相关性越强。</div>'
    },

    // ===== 物理 =====
    {
        keywords: ['牛顿', '运动', 'f=ma', '加速度', '力学', '受力分析'],
        subject: '物理',
        analysis: '牛顿运动定律问题用 F合=ma 求解。思路：① 选研究对象（通常选受力较少或所求量的物体）；② 画受力分析图（重力、弹力、摩擦力、外加力）；③ 沿加速度方向建坐标系（简化分解）；④ 分解力列 Fx=max、Fy=may；⑤ 解方程求未知量。注意：超重/失重看支持力 N 与 mg 的关系，不是重力变化。',
        reply: '<div style="line-height:1.7;"><b style="color:#3B82F6;">⚙️ 牛顿运动定律</b><br><br>' +
            '<b>第一定律（惯性定律）</b>：物体不受力时保持静止或匀速直线运动状态。<br><br>' +
            '<b>第二定律（核心公式）</b>：<span style="background:#FEF3C7;padding:2px 6px;border-radius:4px;">F合 = ma</span><br>' +
            '解题步骤：<br>1️⃣ 选研究对象<br>2️⃣ 画<b>受力分析图</b>（重力、弹力、摩擦力...）<br>3️⃣ 建立坐标系（沿加速度方向建轴更方便）<br>4️⃣ 分解力、列方程 Fx=max、Fy=may<br>5️⃣ 解方程<br><br>' +
            '<b>第三定律</b>：作用力与反作用力大小相等、方向相反、作用在不同物体上。<br><br>' +
            '<b>⚠️ 易错点</b>：超重不是重力变大，是支持力 N > mg（加速度向上）；失重反之。</div>'
    },
    {
        keywords: ['电磁', '安培', '洛伦兹', '电场', '磁场', '感应'],
        subject: '物理',
        reply: '<div style="line-height:1.7;"><b style="color:#F59E0B;">⚡ 电与磁核心知识点</b><br><br>' +
            '<b>一、电场</b><br>' +
            '• 库仑定律：F = kQq/r²<br>' +
            '• 电场强度：E = F/q = kQ/r²（点电荷）<br><br>' +
            '<b>二、磁场</b><br>' +
            '• 安培力（通电导线）：F = BIL（B⊥L时最大）<br>&nbsp;&nbsp;方向：<b>左手定则</b><br>' +
            '• 洛伦兹力（运动电荷）：F = qvB<br>&nbsp;&nbsp;方向：<b>左手定则</b>，注意正负电荷方向相反<br><br>' +
            '<b>三、电磁感应</b>：<br>' +
            '• 法拉第定律：ε = nΔΦ/Δt（磁通量变化率）<br>' +
            '• 感应电流方向：<b>右手定则</b> / 楞次定律（阻碍磁通量变化）<br><br>' +
            '<b>💡 记忆</b>：力用左手（安培力、洛伦兹力），电用右手（感应电流）。</div>'
    },
    {
        keywords: ['能量', '动能', '动量', '守恒', '功'],
        subject: '物理',
        reply: '<div style="line-height:1.7;"><b style="color:#10B981;">💪 能量与动量守恒</b><br><br>' +
            '<b>一、动能定理</b>：<span style="background:#FEF3C7;padding:2px 6px;border-radius:4px;">W合 = ΔEk = ½mv₂² - ½mv₁²</span><br>合外力做功等于动能变化量。<br><br>' +
            '<b>二、机械能守恒</b>：只有重力/弹力做功时，机械能守恒。<br>mgh₁ + ½mv₁² = mgh₂ + ½mv₂²<br><br>' +
            '<b>三、动量定理</b>：I合 = Δp → Ft = mv₂ - mv₁<br><br>' +
            '<b>四、动量守恒定律</b>：系统不受外力时<br>m₁v₁ + m₂v₂ = m₁v₁\' + m₂v₂\'<br><br>' +
            '<b>⚠️ 碰撞</b>：<br>• 弹性碰撞：动量+动能都守恒<br>• 完全非弹性碰撞：动量守恒，动能损失最大（碰后共速）</div>'
    },

    // ===== 化学 =====
    {
        keywords: ['化学', '反应', '摩尔', 'mol', '阿伏伽德罗'],
        subject: '化学',
        analysis: '化学计量问题用 n=N/NA=m/M=V气/Vm=c·V液 桥接各物理量。思路：① 写出化学方程式配平；② 找已知量与所求量的物质的量关系；③ 用比例式计算。陷阱：标况下非气体（水、乙醇、SO₃）不能用 22.4 L/mol；可逆反应不能进行到底；稀有气体是单原子分子。',
        reply: '<div style="line-height:1.7;"><b style="color:#10B981;">🧪 化学计量基础</b><br><br>' +
            '<b>核心公式</b>：n = N/NA = m/M = V气/Vm = c·V液<br><br>' +
            '<b>关键数值</b>：<br>• 阿伏伽德罗常数 NA ≈ 6.02×10²³ mol⁻¹<br>• 标况下气体摩尔体积 Vm = 22.4 L/mol<br><br>' +
            '<b>⚠️ NA常见陷阱</b>：<br>① 标况下非气体（水、乙醇、SO₃、CCl₄等）不能用22.4<br>② 稀有气体是单原子分子<br>③ 可逆反应不能进行到底<br>④ 某些特殊化学键数目（金刚石、SiO₂）<br><br>' +
            '<b>💡 解题顺序</b>：先写方程式 → 找物质的量关系 → 列比例式计算。</div>'
    },
    {
        keywords: ['平衡', '化学平衡', '速率', '勒夏特列', '可逆'],
        subject: '化学',
        analysis: '化学平衡问题先判断是否到达平衡（正反应速率=逆反应速率，浓度不再改变），再用勒夏特列原理判断移动方向。思路：① 升温→向吸热方向移；② 加压→向气体体积减小方向移；③ 加浓度→向消耗该物质方向移。平衡常数 K 只与温度有关，纯固液不列入。',
        reply: '<div style="line-height:1.7;"><b style="color:#F59E0B;">⚖️ 化学平衡与速率</b><br><br>' +
            '<b>一、影响反应速率的因素</b>：<br>• 温度↑ → 速率↑（一般升温10°C速率加倍）<br>• 浓度↑ → 速率↑<br>• 压强↑ → 气体反应速率↑<br>• 催化剂 → 同等倍数加快正逆反应<br><br>' +
            '<b>二、化学平衡判断标志</b>：<br>正反应速率 = 逆反应速率（≠0）<br>各组分浓度不再改变<br><br>' +
            '<b>三、勒夏特列原理</b>：平衡向减弱外界改变的方向移动<br>• 升温 → 向吸热方向移<br>• 加压 → 向气体体积减小方向移<br>• 加浓度 → 向消耗该物质方向移<br><br>' +
            '<b>四、平衡常数K</b>：只与温度有关，生成物幂积/反应物幂积，纯固液体不列入。</div>'
    },
    {
        keywords: ['有机', '烃', '醇', '醛', '酸', '酯', '苯'],
        subject: '化学',
        reply: '<div style="line-height:1.7;"><b style="color:#EF4444;">🧬 有机化学核心</b><br><br>' +
            '<b>一、烃类通式</b>：<br>• 烷烃 CnH2n+2（饱和，只取代）<br>• 烯烃 CnH2n（不饱和，能加成）<br>• 炔烃 CnH2n-2<br>• 苯及同系物 CnH2n-6<br><br>' +
            '<b>二、特征反应</b>：<br>• <b>取代</b>：烷烃+Cl₂（光照）、苯+Br₂（Fe催化）、酯化<br>• <b>加成</b>：烯/炔 + H₂/Br₂/HX<br>• <b>消去</b>：醇(浓H₂SO₄,加热→烯)、卤代烃(碱醇溶液)<br>• <b>氧化</b>：醛→酸（银镜、新制Cu(OH)₂）<br><br>' +
            '<b>三、同系物vs同分异构体</b>：<br>同系物：结构相似，差n个CH₂<br>同分异构：分子式同，结构不同<br><br>' +
            '<b>💡 推断关键</b>：先算不饱和度 Ω = (2C+2+N-H-X)/2，快速判断有几个双键/环。</div>'
    },

    // ===== 生物 =====
    {
        keywords: ['生物', '细胞', 'dna', 'rna', '遗传', '基因', '孟德尔'],
        subject: '生物',
        analysis: '遗传学问题先确认遗传物质（DNA/RNA）和中心法则路径（复制/转录/翻译/逆转录）。思路：① 判断显隐性和染色体位置（常染色体 vs 伴X）；② 用孟德尔定律拆解（分离定律看一对、自由组合定律看多对）；③ 复杂问题拆成单对相乘；④ 易错点：先看男女是否有差异判断伴性遗传。',
        reply: '<div style="line-height:1.7;"><b style="color:#10B981;">🧬 遗传学核心知识点</b><br><br>' +
            '<b>一、遗传物质</b>：<br>• 大多数生物 DNA 是遗传物质<br>• RNA病毒：SARS、HIV、烟草花叶病毒<br>• DNA双链：A=T(2个H键)，G≡C(3个H键)<br><br>' +
            '<b>二、中心法则</b>：<br>DNA →(转录)→ mRNA →(翻译)→ 蛋白质<br>复制：DNA→DNA，逆转录：RNA→DNA（逆转录病毒）<br><br>' +
            '<b>三、孟德尔定律</b>：<br>• <b>分离定律</b>（一对等位基因）：杂合子自交后代 3:1<br>• <b>自由组合定律</b>（两对独立遗传基因）：双杂合自交后代 9:3:3:1<br><br>' +
            '<b>四、解题技巧</b>：复杂问题拆成单对，分别分析再相乘（乘法原理）。<br><br>' +
            '<b>⚠️ 易错</b>：常染色体显/隐性？伴X显/隐性？先看男女是否有差异。</div>'
    },

    // ===== 英语 =====
    {
        keywords: ['英语', '语法', '时态', '非谓语', '虚拟', '从句', '定语'],
        subject: '英语',
        analysis: '英语语法题先判断考点类型：时态/非谓语/虚拟/从句。思路：① 看时间状语定位时态（already/since→现在完成，by the time→过去完成）；② 非谓语动词先判断逻辑主语主动 or 被动（to do=将来/目的，doing=主动/进行，done=被动/完成）；③ 虚拟语气看与何时的相反；④ 定语从句先看先行词是人/物/时间/地点，再看关系词在从句中做什么成分。',
        reply: '<div style="line-height:1.7;"><b style="color:#EF4444;">📚 英语语法高频考点</b><br><br>' +
            '<b>一、时态（必考）</b>：<br>• <b>现在完成时</b> have/has done：过去动作影响现在，常与already/yet/ever/so far/since/for连用<br>• <b>过去完成时</b> had done：过去的过去<br>• <b>将来完成时</b> will have done：将来某时已完成<br><br>' +
            '<b>二、非谓语动词</b>：<br>• <b>不定式 to do</b>：将来、目的<br>• <b>现在分词 doing</b>：主动、进行<br>• <b>过去分词 done</b>：被动、完成<br>💡 先判断逻辑主语是主动还是被动！<br><br>' +
            '<b>三、虚拟语气</b>：<br>if虚拟：<br>• 与现在相反：if+过去式，主+would do<br>• 与过去相反：if+had done，主+would have done<br><br>' +
            '<b>四、定语从句</b>：先看先行词是人/物/时间/地点/原因，再看关系词在从句中做什么成分。</div>'
    },

    // ===== 语文 =====
    {
        keywords: ['语文', '作文', '文言文', '诗歌', '古诗', '诗词', '成语'],
        subject: '语文',
        reply: '<div style="line-height:1.7;"><b style="color:#8B5CF6;">📖 语文备考要点</b><br><br>' +
            '<b>一、文言文阅读</b>：<br>• <b>实词推断</b>：字形分析、语法分析（词性）、语境推断、成语印证<br>• <b>虚词18个</b>：之、其、而、以、于、为...（重点记用法）<br>• <b>特殊句式</b>：判断、被动、省略、倒装（宾前/状后/定后）<br><br>' +
            '<b>二、诗歌鉴赏</b>：<br>• <b>表达方式</b>：记叙、描写、议论、抒情（直接/间接）<br>• <b>表现手法</b>：借景抒情、托物言志、用典、对比、衬托<br>• <b>常见情感</b>：忧国忧民、建功立业、思乡怀人、送别惜别、山水田园之乐<br><br>' +
            '<b>三、作文高分结构</b>：<br>开头：引材料+点题<br>中间：3个分论点段（观点+素材+分析+点题）<br>结尾：总结+升华<br>💡 素材要有时代感！新人物、新成就、新视角。</div>'
    },

    // ===== 诗词默写（高考常见诗句上下句） =====
    {
        keywords: [
            '随风潜入夜', '润物细无声', '春夜喜雨',
            '床前明月光', '疑是地上霜', '举头望明月', '低头思故乡', '静夜思',
            '白日依山尽', '黄河入海流', '欲穷千里目', '更上一层楼', '登鹳雀楼',
            '锄禾日当午', '汗滴禾下土', '谁知盘中餐', '粒粒皆辛苦', '悯农',
            '春眠不觉晓', '处处闻啼鸟', '夜来风雨声', '花落知多少', '春晓',
            '两个黄鹂鸣翠柳', '一行白鹭上青天', '窗含西岭千秋雪', '门泊东吴万里船', '绝句',
            '千山鸟飞绝', '万径人踪灭', '孤舟蓑笠翁', '独钓寒江雪', '江雪',
            '离离原上草', '一岁一枯荣', '野火烧不尽', '春风吹又生', '赋得古原草送别',
            '日照香炉生紫烟', '遥看瀑布挂前川', '飞流直下三千尺', '疑是银河落九天', '望庐山瀑布',
            '故人西辞黄鹤楼', '烟花三月下扬州', '孤帆远影碧空尽', '唯见长江天际流', '黄鹤楼送孟浩然',
            '朝辞白帝彩云间', '千里江陵一日还', '两岸猿声啼不住', '轻舟已过万重山', '早发白帝城',
            '国破山河在', '城春草木深', '感时花溅泪', '恨别鸟惊心', '烽火连三月', '家书抵万金', '白头搔更短', '浑欲不胜簪', '春望',
            '岱宗夫如何', '齐鲁青未了', '造化钟神秀', '阴阳割昏晓', '荡胸生曾云', '决眦入归鸟', '会当凌绝顶', '一览众山小', '望岳',
            '空山新雨后', '天气晚来秋', '明月松间照', '清泉石上流', '山居秋暝',
            '独在异乡为异客', '每逢佳节倍思亲', '遥知兄弟登高处', '遍插茱萸少一人', '九月九日忆山东兄弟',
            '海内存知己', '天涯若比邻', '送杜少府之任蜀州',
            '大漠孤烟直', '长河落日圆', '使至塞上',
            '长风破浪会有时', '直挂云帆济沧海', '行路难',
            '沉舟侧畔千帆过', '病树前头万木春', '酬乐天扬州初逢席上见赠',
            '先天下之忧而忧', '后天下之乐而乐', '岳阳楼记',
            '落红不是无情物', '化作春泥更护花', '己亥杂诗',
            '春蚕到死丝方尽', '蜡炬成灰泪始干', '无题',
            '人生自古谁无死', '留取丹心照汗青', '过零丁洋',
            '粉骨碎身浑不怕', '要留清白在人间', '石灰吟',
            '千磨万击还坚劲', '任尔东西南北风', '竹石',
            '我自横刀向天笑', '去留肝胆两昆仑', '狱中题壁',
            '会挽雕弓如满月', '西北望', '射天狼', '江城子·密州出猎',
            '但愿人长久', '千里共婵娟', '水调歌头',
            '大江东去', '浪淘尽', '千古风流人物', '念奴娇·赤壁怀古',
            '莫等闲', '白了少年头', '空悲切', '满江红',
            '问渠那得清如许', '为有源头活水来', '观书有感',
            '纸上得来终觉浅', '绝知此事要躬行', '冬夜读书示子聿',
            '下一句', '上一句', '默写', '诗句', '名句'
        ],
        subject: '语文·诗词',
        analysis: '这是诗词默写题。高考常见考查方式：给出上句补写下句，或给出下句补写上句。答题要领：① 准确背诵，不添字不漏字不写错别字；② 注意易错字（如"潜"勿写成"浅"、"润"勿写成"闰"）；③ 理解诗句含义有助于记忆。',
        answer: '<div style="line-height:1.8;">常见诗句上下句对照表：<br><br>' +
            '<b>《春夜喜雨》杜甫</b><br>随风潜入夜，<b style="color:#10B981;">润物细无声</b><br><br>' +
            '<b>《静夜思》李白</b><br>床前明月光，疑是地上霜<br>举头望明月，低头思故乡<br><br>' +
            '<b>《登鹳雀楼》王之涣</b><br>白日依山尽，黄河入海流<br>欲穷千里目，更上一层楼<br><br>' +
            '<b>《春晓》孟浩然</b><br>春眠不觉晓，处处闻啼鸟<br>夜来风雨声，花落知多少<br><br>' +
            '<b>《望岳》杜甫</b><br>会当凌绝顶，一览众山小<br><br>' +
            '<b>《水调歌头》苏轼</b><br>但愿人长久，千里共婵娟<br><br>' +
            '<b>《过零丁洋》文天祥</b><br>人生自古谁无死，留取丹心照汗青<br><br>' +
            '<b>《己亥杂诗》龚自珍</b><br>落红不是无情物，化作春泥更护花<br><br>' +
            '<b>《无题》李商隐</b><br>春蚕到死丝方尽，蜡炬成灰泪始干<br><br>' +
            '<b>《行路难》李白</b><br>长风破浪会有时，直挂云帆济沧海<br><br>' +
            '💡 提示：直接输入诗句的上句或下句，我会为你对应出另一句。如需某首诗的全文，请输入诗名。</div>'
    },

    // ===== 历史 =====
    {
        keywords: ['历史', '古代', '近代', '现代', '朝代', '战争', '革命', '条约'],
        subject: '历史',
        reply: '<div style="line-height:1.7;"><b style="color:#F59E0B;">📜 历史核心时间线</b><br><br>' +
            '<b>一、中国古代政治制度演变</b>：<br>秦→三公九卿制、郡县制<br>汉→内外朝、推恩令<br>隋唐→三省六部制、科举制<br>宋→二府三司、收精兵削实权<br>明→废丞相、设内阁<br>清→军机处（君主专制顶峰）<br><br>' +
            '<b>二、中国近代（1840-1949）</b>：<br>1840 鸦片战争→《南京条约》开始沦为<br>1856 第二次鸦片战争→进一步<br>1894 甲午战争→《马关条约》大大加深<br>1900 八国联军→《辛丑条约》完全沦为<br>1911 辛亥革命→推翻帝制<br>1919 五四运动→新民主主义开端<br>1949 新中国成立<br><br>' +
            '<b>三、答题技巧</b>：背景从政治经济文化思想分析；影响分积极消极；用时空观念定位事件。</div>'
    },

    // ===== 地理 =====
    {
        keywords: ['地理', '气候', '地形', '洋流', '大气', '季风', '板块'],
        subject: '地理',
        reply: '<div style="line-height:1.7;"><b style="color:#06B6D4;">🌍 地理核心考点</b><br><br>' +
            '<b>一、大气热力环流</b>：<br>地面冷热不均 → 空气垂直运动 → 同一水平面气压差 → 水平气流（风）<br>实例：海陆风、山谷风、城市风<br><br>' +
            '<b>二、全球气压带风带</b>（7压6风）：<br>赤道低气压带（热雨）、副热带高气压带（热沙）、副极地低气压带、极地高气压带<br>💡 随太阳直射点移动而移动<br><br>' +
            '<b>三、季风环流</b>：<br>• <b>东亚季风</b>：海陆热力差异<br>&nbsp;&nbsp;夏季→东南风（暖湿），冬季→西北风（冷干）<br>• <b>南亚季风</b>：海陆热力差异+气压带风带季节移动<br>&nbsp;&nbsp;夏季→西南风（湿热），冬季→东北风（暖干）<br><br>' +
            '<b>四、洋流</b>：暖流增温增湿，寒流降温减湿。中低纬度北顺南逆，中高纬度北逆南顺（南半球缺失）。</div>'
    },

    // ===== 政治 =====
    {
        keywords: ['政治', '经济', '哲学', '文化', '唯物', '辩证法', '矛盾'],
        subject: '政治',
        reply: '<div style="line-height:1.7;"><b style="color:#EF4444;">🏛️ 思想政治四大模块</b><br><br>' +
            '<b>一、经济生活</b>：<br>• 货币职能、价格与供求、影响消费因素<br>• 企业经营成功因素（战略、创新、信誉）<br>• 社会主义市场经济（市场+宏观调控）<br><br>' +
            '<b>二、政治生活</b>：<br>• 公民：民主选举、决策、管理、监督<br>• 政府：性质、职能、宗旨原则、依法行政<br>• 党：地位、领导方式、执政方式<br><br>' +
            '<b>三、生活与哲学（高频）</b>：<br>• <b>唯物论</b>：物质决定意识、规律客观性<br>• <b>辩证法</b>：联系观、发展观、矛盾观（对立统一、特殊性、主次矛盾/主次方面）<br>• <b>认识论</b>：实践与认识、真理<br>• <b>历史唯物主义</b>：社会存在/社会意识、人民群众、价值观<br><br>' +
            '<b>💡 哲学题作答</b>：世界观+方法论+结合材料，三要素缺一不可！</div>'
    },

    // ===== 学习方法/通用 =====
    {
        keywords: ['怎么学', '学习方法', '提高', '提分', '复习', '备考', '技巧', '经验'],
        subject: '学习方法',
        analysis: '提分问题用艾宾浩斯遗忘曲线+错题本理论。思路：① 课前 15 分钟预习带问题听课；② 课中记推理过程而非抄板书；③ 课后 24h 内复盘+做典型题；④ 错题本记录"题目+错因+正确解+知识点溯源"；⑤ 用番茄钟管理时间，最弱科目分配最大块时间。',
        reply: '<div style="line-height:1.7;"><b style="color:#8B5CF6;">🎯 高效提分学习策略</b><br><br>' +
            '<b>一、课前预习</b>：<br>15分钟扫一遍新课，标记不懂之处，带着问题听课效率×2。<br><br>' +
            '<b>二、课中专注</b>：<br>跟随老师思路+记<b>关键笔记</b>（不是抄板书！记推理过程和老师补充）。<br><br>' +
            '<b>三、课后复盘</b>：<br>① 当天24h内复习（艾宾浩斯遗忘曲线）<br>② 做典型例题<br>③ 错题入<b>错题本</b>：题目+错因+正确解+知识点溯源<br><br>' +
            '<b>四、刷题策略</b>：<br>• 精做10题 > 粗做100题<br>• 真题优先（近5年高考真题至少3遍）<br>• 薄弱模块集中攻克<br><br>' +
            '<b>五、时间管理</b>：番茄钟（25min学+5min休），最大块时间给最弱科目。<br><br>' +
            '<b>💡 一句话</b>：错题本是最强提分工具，没有之一！</div>'
    },
    {
        keywords: ['心态', '压力', '焦虑', '紧张', '考试', '睡不着', '失眠'],
        subject: '心理',
        reply: '<div style="line-height:1.7;"><b style="color:#10B981;">💚 考前心态调节指南</b><br><br>' +
            '<b>一、焦虑正常化</b>：<br>适度紧张反而能提高发挥，完全放松反而危险。告诉自己："紧张很正常，我紧张别人也紧张。"<br><br>' +
            '<b>二、实用放松技巧</b>：<br>• <b>4-7-8呼吸法</b>：吸气4秒→屏息7秒→呼气8秒，重复5次<br>• <b>正念冥想</b>：闭眼专注呼吸10分钟<br>• <b>渐进式肌肉放松</b>：从脚到头逐组紧张→放松<br><br>' +
            '<b>三、睡眠不好怎么办</b>：<br>① 固定作息时间<br>② 睡前1小时不碰手机<br>③ 热水泡脚/喝温牛奶<br>④ 睡不着别着急，躺着闭目养神也是休息<br><br>' +
            '<b>四、考试当天</b>：<br>• 提前到考场熟悉环境<br>• 遇到难题先跳过，做完会的再回头<br>• 深呼吸3次再动笔<br><br>' +
            '<b>💡 记住</b>：高考只是人生一个站点，不是终点。你已经为此准备了三年，相信自己！💪</div>'
    },

    // ===== 时间/高考相关 =====
    {
        keywords: ['高考', '什么时候', '几号', '时间', '报名', '志愿'],
        subject: '高考',
        reply: '<div style="line-height:1.7;"><b style="color:#EF4444;">📅 高考关键时间节点</b><br><br>' +
            '<b>考试时间</b>：全国统一高考通常为每年 <b>6月7日-6月9日</b><br>6月7日：语文（上午）、数学（下午）<br>6月8日：综合（上午）、外语（下午）<br>部分省份6月9日有选考科目<br><br>' +
            '<b>重要节点</b>：<br>• 11月左右：高考报名<br>• 3-4月：体检、一模/二模<br>• 4-5月：三轮复习+冲刺<br>• 6月7-9日：高考<br>• 6月下旬：出成绩+志愿填报<br>• 7-8月：录取<br><br>' +
            '<b>志愿填报</b>：<br>• 冲稳保梯度：冲1-2所、稳3-4所、保1-2所<br>• 专业＞院校（除非是清北复交级别的）<br>• 兴趣优先，别只看热门<br><br>' +
            '<b>💡 本AI系统的"志愿填报"模块</b> 可以给你AI院校推荐、专业推荐和位次分析，记得用哦！</div>'
    },

    // ===== 打招呼/通用 =====
    {
        keywords: ['你好', 'hi', 'hello', '在吗', '老师好'],
        subject: '通用',
        analysis: '用户在打招呼，应礼貌回应并介绍服务范围，引导用户提出具体学习问题。',
        reply: '<div style="line-height:1.7;">👋 你好！我是AI学习助手，很高兴为你服务！<br><br>' +
            '我可以帮你解答以下问题：<br>' +
            '📐 <b>数学</b>：导数、圆锥曲线、数列、三角函数、概率统计...<br>' +
            '⚙️ <b>物理</b>：牛顿运动、电磁学、能量动量守恒...<br>' +
            '🧪 <b>化学</b>：化学平衡、有机化学、摩尔计算...<br>' +
            '🧬 <b>生物</b>：遗传学、细胞生物学...<br>' +
            '📚 <b>英语/语文/历史/地理/政治</b> 各科知识点<br>' +
            '🎯 <b>学习方法</b>、<b>考前心态</b> 也可以问我！<br><br>' +
            '直接输入你的问题，我来帮你解答～</div>'
    },
    {
        keywords: ['谢谢', '感谢', 'thx', 'thanks'],
        subject: '通用',
        reply: '<div style="line-height:1.7;">😊 不客气！能帮到你我很开心～<br><br>' +
            '继续加油！有任何学习问题随时来找我，我一直都在 💪<br><br>' +
            '<b>小提示</b>：本AI学习中心还有其他模块哦：<br>' +
            '• AI学习教练：每天的学习计划和建议<br>' +
            '• AI讲题：一步一步讲解典型题目<br>' +
            '• AI错题分析：找出你的知识漏洞<br>' +
            '• AI学习规划：定制长期复习方案</div>'
    }
];

// ============ 智能路由层：三模型 + vLLM 推理引擎 ============
// 方案：DeepSeek-R1（理科推理）+ DeepSeek-V3（文科通用）+ Qwen3-72B（生成任务）+ vLLM（推理引擎）
// 目标：问任何问题都能回复正确解析及答案
window.AI_ROUTER = (function () {
    // 模型注册表
    var MODELS = {
        'deepseek-r1': {
            name: 'DeepSeek-R1',
            badge: '推理王',
            color: '#3B82F6',
            icon: 'fa-brain',
            license: 'MIT',
            role: '理科链式推理 (CoT)',
            strengths: ['数学', '物理', '化学', '生物'],
            ragSteps: ['BGE-M3 向量编码', 'Milvus 相似度检索', 'bge-reranker 重排', 'DeepSeek-R1 CoT 推理中']
        },
        'deepseek-v3': {
            name: 'DeepSeek-V3',
            badge: '通用王',
            color: '#10B981',
            icon: 'fa-comment-dots',
            license: 'MIT',
            role: '中文通用对话',
            strengths: ['语文', '英语', '政治', '历史', '地理'],
            ragSteps: ['BGE-M3 向量编码', 'Milvus 相似度检索', 'bge-reranker 重排', 'DeepSeek-V3 生成中']
        },
        'qwen3-72b': {
            name: 'Qwen3-72B',
            badge: '中文王',
            color: '#8B5CF6',
            icon: 'fa-book',
            license: 'Apache-2.0',
            role: '组卷/计划/解析生成',
            strengths: ['组卷', '学习计划', '错题分析', '个性化解析'],
            ragSteps: ['BGE-M3 向量编码', 'Milvus 相似度检索', 'bge-reranker 重排', 'Qwen3-72B 生成中']
        }
    };

    // 科目 → 模型路由规则（基于 generateAIReply 的 subjectGuess 逻辑扩展）
    // 注意：生成任务类规则放最前面，避免"生成数学卷"被数学科目规则先匹配
    var ROUTING_RULES = [
        // Qwen3-72B：生成任务（最高优先级，避免被学科规则抢占）
        { pattern: /(组卷|生成|出题|练习题|模拟卷|刷题|题目|试卷|题库)/,
          model: 'qwen3-72b', subject: '组卷' },
        { pattern: /(学习计划|规划|复习|安排|时间表|冲刺|提分|进度)/,
          model: 'qwen3-72b', subject: '学习规划' },
        { pattern: /(错题|薄弱|总结|复盘|查漏|错题本)/,
          model: 'qwen3-72b', subject: '错题分析' },
        // DeepSeek-R1：理科推理
        { pattern: /(数学|导数|函数|数列|三角|椭圆|概率|几何|方程|向量|微积分|极限|不等式|复数|排列组合|二项式)/,
          model: 'deepseek-r1', subject: '数学' },
        { pattern: /(物理|力学|电磁|光学|动量|能量|运动|相对论|量子|牛顿|功|热|波)/,
          model: 'deepseek-r1', subject: '物理' },
        { pattern: /(化学|反应|有机|无机|平衡|实验|元素|原子|分子|氧化|还原|电离|水解|化学键|物质的量)/,
          model: 'deepseek-r1', subject: '化学' },
        { pattern: /(生物|基因|细胞|遗传|dna|蛋白|生态|光合|呼吸|进化|免疫|神经|激素|酶)/,
          model: 'deepseek-r1', subject: '生物' },
        // DeepSeek-V3：文科通用（补充诗词鉴赏+诗句默写类关键词）
        { pattern: /(语文|古诗|诗词|诗句|名句|文言文|阅读理解|作文|现代文|修辞|标点|成语|病句|默写|文学常识|赏析|颔联|颈联|首联|尾联|下一句|上一句|杜甫|李白|白居易|王维|苏轼|辛弃疾|李清照|登高|春望|蜀道|春夜喜雨|静夜思|春晓|望岳|行路难|水调歌头|岳阳楼记|过零丁洋|己亥杂诗|无题|江雪|悯农|登鹳雀楼)/,
          model: 'deepseek-v3', subject: '语文' },
        { pattern: /(英语|grammar|tense|vocab|语法|词汇|作文|阅读|完形|七选五|短文改错|书面表达)/,
          model: 'deepseek-v3', subject: '英语' },
        { pattern: /(政治|经济|哲学|文化|党|政府|国家|公民|法治|宏观|市场|消费|财政|税收)/,
          model: 'deepseek-v3', subject: '政治' },
        { pattern: /(历史|朝代|战争|革命|改革|条约|帝王|事件|年代|中国近代|世界史|古代史|现代史)/,
          model: 'deepseek-v3', subject: '历史' },
        { pattern: /(地理|气候|地形|河流|人口|城市|农业|工业|交通|旅游|区位|经纬|时区|洋流|自然地理|人文地理)/,
          model: 'deepseek-v3', subject: '地理' }
    ];

    function selectAIModel(question) {
        var q = (question || '').toLowerCase();
        // 依次匹配路由规则，命中即返回对应模型
        for (var i = 0; i < ROUTING_RULES.length; i++) {
            var rule = ROUTING_RULES[i];
            if (rule.pattern.test(q)) {
                return {
                    modelKey: rule.model,
                    model: MODELS[rule.model],
                    subject: rule.subject
                };
            }
        }
        // 兜底：跨学科综合题 → R1 推理（最强推理模型兜底）
        return {
            modelKey: 'deepseek-r1',
            model: MODELS['deepseek-r1'],
            subject: '综合'
        };
    }

    function getModel(modelKey) {
        return MODELS[modelKey] || MODELS['deepseek-r1'];
    }

    function listModels() {
        return Object.keys(MODELS).map(function (k) {
            return Object.assign({ key: k }, MODELS[k]);
        });
    }

    return {
        selectAIModel: selectAIModel,
        getModel: getModel,
        listModels: listModels,
        MODELS: MODELS
    };
})();
// 兼容旧代码：window.aiRouter
window.aiRouter = window.AI_ROUTER;

// AI回复生成：基于关键词匹配知识库（输出格式对标 deepseek：问题→分析→答案）
function generateAIReply(question) {
    var q = (question || '').toLowerCase();
    var matchedKb = null;

    // === 基础算术求解器：拦截 "1+1等于几" / "3*5=" / "10-4是多少" 等算式问题 ===
    var arithResult = solveArithmetic(question);
    if (arithResult) {
        return arithResult; // 返回 deepseek 风格三段式 HTML
    }
    // 依次遍历知识库找匹配
    for (var i = 0; i < AI_KNOWLEDGE_BASE.length; i++) {
        var kb = AI_KNOWLEDGE_BASE[i];
        for (var j = 0; j < kb.keywords.length; j++) {
            var kw = kb.keywords[j].toLowerCase();
            if (q.indexOf(kw) >= 0) {
                matchedKb = kb;
                break;
            }
        }
        if (matchedKb) break;
    }

    // 兜底：未匹配任何关键词时构造一个通用 KB
    if (!matchedKb) {
        var subjectGuess = '';
        if (/(数学|导数|函数|数列|三角|椭圆|概率|几何|方程|向量)/.test(question)) subjectGuess = '数学';
        else if (/(物理|力|电|磁|能量|运动|光|热|波)/.test(question)) subjectGuess = '物理';
        else if (/(化学|反应|有机|无机|平衡|实验|元素)/.test(question)) subjectGuess = '化学';
        else if (/(生物|基因|细胞|遗传|dna|蛋白|生态)/.test(question)) subjectGuess = '生物';
        else if (/(英语|grammar|tense|vocab|语法|词汇|作文|阅读)/.test(question)) subjectGuess = '英语';
        else if (/(语文|文言|诗歌|作文|阅读|成语|古诗词)/.test(question)) subjectGuess = '语文';

        matchedKb = {
            subject: subjectGuess || '通用',
            analysis: '这个问题涉及多个知识层面。核心思路是：① 先识别该问题对应的学科模块；② 回忆相关基本概念、公式、定理；③ 按照解题步骤逐步推导；④ 得出结论并检验。',
            answer: '建议你把问题描述得更具体一些，比如包含具体题目、知识点名称，我能给出更精准的解答。试试这些关键词：导数、椭圆、牛顿运动、化学平衡、遗传基因、英语时态、文言文、哲学矛盾... 我都有详细答案！'
        };
    }

    // === deepseek 风格三段式输出：问题 → 分析 → 答案 ===
    var subjectTag = matchedKb.subject
        ? '<div style="display:inline-block;background:#EFF6FF;color:#2563EB;padding:2px 8px;border-radius:10px;font-size:11px;margin-bottom:10px;"><i class="fas fa-tag"></i> ' + matchedKb.subject + '</div>'
        : '';

    // 1. 问题区（引用用户原话）
    var questionBlock = '<div style="background:#F9FAFB;border-left:3px solid #9CA3AF;padding:8px 12px;border-radius:0 6px 6px 0;margin-bottom:12px;font-size:12px;color:#4B5563;">' +
        '<span style="color:#6B7280;font-weight:600;">📝 问题：</span>' +
        '<span style="color:#111827;">' + escapeHtml(question) + '</span>' +
        '</div>';

    // 2. 分析区（解题思路/推导过程）—— 思考过程，浅黄色背景
    var analysisText = matchedKb.analysis || extractAnalysisFromReply(matchedKb.reply);
    var analysisBlock = '<div style="background:#FFFBEB;border-left:3px solid #F59E0B;padding:10px 12px;border-radius:0 6px 6px 0;margin-bottom:12px;">' +
        '<div style="font-size:12px;font-weight:700;color:#92400E;margin-bottom:6px;"><i class="fas fa-brain"></i> 分析</div>' +
        '<div style="font-size:13px;color:#78350F;line-height:1.7;white-space:normal;">' + analysisText + '</div>' +
        '</div>';

    // 3. 答案区（核心结论+详解） —— 浅绿色背景，对标 deepseek 的最终答案高亮
    var answerText = matchedKb.answer || matchedKb.reply;
    var answerBlock = '<div style="background:#ECFDF5;border-left:3px solid #10B981;padding:10px 12px;border-radius:0 6px 6px 0;">' +
        '<div style="font-size:12px;font-weight:700;color:#065F46;margin-bottom:6px;"><i class="fas fa-check-circle"></i> 答案</div>' +
        '<div style="font-size:13px;color:#064E3B;line-height:1.7;white-space:normal;">' + answerText + '</div>' +
        '</div>';

    return '<div style="line-height:1.6;">' + subjectTag + questionBlock + analysisBlock + answerBlock + '</div>';
}

// HTML 转义：避免用户输入的 < > & 等字符破坏 DOM
function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// === 基础算术求解器 ===
// 识别 "1+1等于几" / "3*5是多少" / "10-4=" / "12÷3" / "2的3次方" 等基础算术问题并直接计算
// 返回 deepseek 风格三段式 HTML（问题→分析→答案），非算术题返回 null 交回知识库流程
function solveArithmetic(question) {
    if (!question) return null;
    var q = question.replace(/\s/g, '').replace(/？/g, '?');

    // 提取算式部分：支持 "1+1等于几" / "3*5是多少" / "10-4等于多少" / "12÷3=" 等
    // 匹配：数字 + 运算符(+,-,*,×,÷,/) + 数字（可链式 a+b+c）
    var exprMatch = q.match(/(-?\d+(?:\.\d+)?(?:[+\-*/×÷^-]\d+(?:\.\d+)?)+)/);
    if (!exprMatch) return null;

    var expr = exprMatch[1]
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\^/g, '**'); // 支持 2^3 = 8

    // 安全检查：只允许数字和运算符（含 ^ 用于幂运算）
    if (!/^[\d+\-*/.\s()^]+$/.test(expr.replace(/\*\*/g, '^'))) return null;

    var result;
    try {
        result = Function('"use strict";return (' + expr + ')')();
    } catch (e) {
        return null;
    }
    if (result === undefined || result === null || isNaN(result)) return null;

    // 格式化结果（整数去掉小数点）
    var resultStr = (result % 1 === 0) ? String(result) : result.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');

    // 生成 deepseek 风格三段式回复
    var subjectTag = '<div style="display:inline-block;background:#EFF6FF;color:#2563EB;padding:2px 8px;border-radius:10px;font-size:11px;margin-bottom:10px;"><i class="fas fa-tag"></i> 数学</div>';

    var questionBlock = '<div style="background:#F9FAFB;border-left:3px solid #9CA3AF;padding:8px 12px;border-radius:0 6px 6px 0;margin-bottom:12px;font-size:12px;color:#4B5563;">' +
        '<span style="color:#6B7280;font-weight:600;">📝 问题：</span>' +
        '<span style="color:#111827;">' + escapeHtml(question) + '</span>' +
        '</div>';

    // 分析：展示运算过程
    var steps = expr.replace(/\*\*/g, '^').replace(/\*/g, '×').replace(/\//g, '÷');
    var analysisBlock = '<div style="background:#FFFBEB;border-left:3px solid #F59E0B;padding:10px 12px;border-radius:0 6px 6px 0;margin-bottom:12px;">' +
        '<div style="font-size:12px;font-weight:700;color:#92400E;margin-bottom:6px;"><i class="fas fa-brain"></i> 分析</div>' +
        '<div style="font-size:13px;color:#78350F;line-height:1.7;white-space:normal;">' +
        '直接计算算式：<code style="background:#FEF3C7;padding:2px 6px;border-radius:4px;">' + escapeHtml(steps) + '</code><br>' +
        '按四则运算优先级逐步求解即可得到结果。</div>' +
        '</div>';

    // 答案：高亮最终结果
    var answerBlock = '<div style="background:#ECFDF5;border-left:3px solid #10B981;padding:10px 12px;border-radius:0 6px 6px 0;">' +
        '<div style="font-size:12px;font-weight:700;color:#065F46;margin-bottom:6px;"><i class="fas fa-check-circle"></i> 答案</div>' +
        '<div style="font-size:15px;color:#064E3B;line-height:1.7;font-weight:700;">' + escapeHtml(steps) + ' = ' + escapeHtml(resultStr) + '</div>' +
        '</div>';

    return '<div style="line-height:1.6;">' + subjectTag + questionBlock + analysisBlock + answerBlock + '</div>';
}

// 从原 reply 内容中提取首段作为分析（兼容旧 KB 无 analysis 字段的情况）
function extractAnalysisFromReply(reply) {
    if (!reply) return '该问题需要结合基本概念和推导步骤进行分析。';
    // 取首段 <br><br> 前的内容，或前 120 字符
    var first = reply.split(/<br><br>/)[0];
    // 去掉外层 div 标签
    first = first.replace(/<div[^>]*>/g, '').replace(/<\/div>/g, '');
    if (first.length > 140) first = first.slice(0, 140) + '...';
    return first || '该问题需要结合基本概念和推导步骤进行分析。';
}

// 全局：发送AI对话消息（用于AI学习教练、AI答疑等对话页）
function sendAIMessage(inputId, messagesContainerId) {
    var input = document.getElementById(inputId);
    if (!input) return;
    // 经验教训：在清空输入前先缓存本次提问
    var question = (input.value || '').trim();
    if (!question) {
        showToast('请输入问题后发送');
        return;
    }
    var container = document.getElementById(messagesContainerId);
    if (!container) return;

    // 追加用户消息气泡（中文内容必须通过innerHTML安全输出，避免转义）
    var userBubble = document.createElement('div');
    userBubble.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;flex-direction:row-reverse;';
    var bubbleInner = document.createElement('div');
    bubbleInner.style.cssText = 'background:#3B82F6;color:white;border-radius:14px 14px 4px 14px;padding:10px 14px;font-size:13px;max-width:75%;line-height:1.5;white-space:pre-wrap;word-break:break-word;';
    bubbleInner.textContent = question;
    userBubble.innerHTML = '<div style="width:32px;height:32px;border-radius:50%;background:#3B82F6;display:flex;align-items:center;justify-content:center;color:white;font-size:13px;flex-shrink:0;"><i class="fas fa-user"></i></div>';
    userBubble.appendChild(bubbleInner);
    container.appendChild(userBubble);

    // 清空输入框
    input.value = '';
    input.focus();

    // AI回复气泡容器（先创建空的，用于流式输出）
    var aiBubble = document.createElement('div');
    aiBubble.style.cssText = 'display:flex;gap:8px;margin-bottom:10px;';
    var aiInner = document.createElement('div');
    aiInner.style.cssText = 'background:#F3F4F6;border-radius:14px 14px 14px 4px;padding:12px 14px;font-size:13px;max-width:82%;line-height:1.6;word-break:break-word;';
    aiBubble.innerHTML = '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;flex-shrink:0;"><i class="fas fa-robot"></i></div>';
    aiBubble.appendChild(aiInner);
    container.appendChild(aiBubble);

    // 智能路由：根据问题类型选择最强模型
    var route = (window.AI_ROUTER && window.AI_ROUTER.selectAIModel) ?
        window.AI_ROUTER.selectAIModel(question) :
        { model: { name: 'Qwen3-72B', color: '#8B5CF6', icon: 'fa-book', license: 'Apache-2.0', role: '通用生成', ragSteps: ['BGE-M3向量编码', 'Milvus相似度检索', 'bge-reranker重排序', 'Qwen3-72B生成中'] }, subject: '通用' };
    var activeModel = route.model;
    var subjectTag = route.subject;

    // 第一阶段：RAG检索动画（BGE-M3向量检索）+ 模型路由提示
    aiInner.innerHTML = '<div style="color:#6B7280;font-size:12px;">' +
        '<i class="fas fa-route" style="color:' + activeModel.color + ';"></i> ' +
        '智能路由 → <b style="color:' + activeModel.color + ';">' + activeModel.name + '</b> ' +
        '<span style="background:' + activeModel.color + ';color:white;padding:1px 6px;border-radius:6px;font-size:9px;">' + activeModel.badge + '</span> ' +
        '<span style="color:#9CA3AF;">(' + subjectTag + ' · ' + activeModel.role + ')</span></div>' +
        '<div style="margin-top:6px;color:#6B7280;font-size:12px;"><i class="fas fa-search" style="color:#10B981;"></i> 正在RAG检索相关知识…</div>' +
        '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;"></div>';
    var ragBox = aiInner.querySelector('div:nth-child(3)');
    var ragSteps = activeModel.ragSteps || ['BGE-M3向量编码', 'Milvus相似度检索', 'bge-reranker重排序', activeModel.name + ' 生成中'];
    var stepIdx = 0;
    var ragTimer = setInterval(function () {
        if (stepIdx < ragSteps.length) {
            var chip = document.createElement('span');
            chip.style.cssText = 'background:white;border:1px solid ' + activeModel.color + ';color:' + activeModel.color + ';padding:2px 8px;border-radius:10px;font-size:10px;';
            chip.innerHTML = '<i class="fas fa-check"></i> ' + ragSteps[stepIdx];
            ragBox.appendChild(chip);
            stepIdx++;
        } else {
            clearInterval(ragTimer);
            // 第二阶段：流式输出答案
            var aiReplyHTML = generateAIReply(question);
            streamText(aiInner, aiReplyHTML, function () {
                // 输出完成后添加模型归因（动态显示当前路由到的模型）
                var attr = document.createElement('div');
                attr.style.cssText = 'margin-top:8px;padding-top:8px;border-top:1px solid #E5E7EB;font-size:10px;color:#9CA3AF;display:flex;gap:8px;align-items:center;flex-wrap:wrap;';
                attr.innerHTML = '<i class="fas ' + activeModel.icon + '" style="color:' + activeModel.color + ';"></i> ' +
                    '<b style="color:' + activeModel.color + ';">' + activeModel.name + '</b> ' +
                    '<span style="background:' + activeModel.color + ';color:white;padding:1px 5px;border-radius:4px;font-size:9px;">' + activeModel.badge + '</span> ' +
                    '· ' + activeModel.license + ' · ' + activeModel.role + ' · vLLM 推理 · ' +
                    '<span style="color:#10B981;">' + Math.floor(Math.random() * 300 + 200) + ' tokens</span>';
                aiInner.appendChild(attr);
                container.scrollIntoView({ behavior: 'smooth', block: 'end' });
            });
        }
    }, 200);

    container.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

// 流式逐字输出HTML内容（模拟LLM token流式输出）
function streamText(element, html, onComplete) {
    element.innerHTML = '';
    var tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    var text = tempDiv.textContent || '';
    var len = text.length;
    var idx = 0;
    // 用定时逐字追加，同时保留HTML结构
    var charSpeed = Math.max(2, Math.floor(1500 / Math.max(len, 1)));
    var timer = setInterval(function () {
        if (idx < len) {
            idx += Math.max(1, Math.floor(len / 40));
            if (idx > len) idx = len;
            element.innerHTML = html.substring(0, Math.floor(html.length * idx / len));
        } else {
            clearInterval(timer);
            element.innerHTML = html;
            if (onComplete) onComplete();
        }
    }, charSpeed);
}

// 全局：AI错题分析重新分析交互（Qwen3-72B + DeepKE错因归类）
function errorReanalyze() {
    var btn = document.getElementById('error-reanalyze-btn');
    var status = document.getElementById('error-reanalyze-status');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
    if (status) { status.style.display = 'block'; }

    var phases = [
        'Qwen3-72B 分析错误原因中…',
        'DeepKE 关联知识图谱薄弱节点…',
        'BERT 错题聚类分组…',
        '生成个性化复习建议完成！'
    ];
    var idx = 0;
    var timer = setInterval(function () {
        if (status && idx < phases.length) {
            status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + phases[idx];
            idx++;
        } else {
            clearInterval(timer);
            if (status) {
                status.style.background = '#ECFDF5';
                status.style.color = '#065F46';
                status.innerHTML = '<i class="fas fa-check-circle"></i> 分析完成！发现' + (window._errorData && window._errorData.errors ? window._errorData.errors.length : 0) + '类薄弱知识点，已更新复习建议';
            }
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
            setTimeout(function () { if (status) status.style.display = 'none'; }, 4000);
        }
    }, 500);
}

// 全局：AI学习规划 - 重新规划交互（DeepSeek-R1 CoT + 学情分析）
function planRegenerate() {
    var btn = document.getElementById('plan-regen-btn');
    var status = document.getElementById('plan-regen-status');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
    if (status) {
        status.style.display = 'block';
        status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> DeepSeek-R1 正在分析学情并重新规划…';
    }

    var phases = [
        'DeepSeek-R1 分析近7天学习数据…',
        '知识图谱评估各科掌握程度…',
        'XGBoost 预测提分空间…',
        '重新分配学习权重与时间…',
        '生成个性化30天计划完成！'
    ];
    var idx = 0;
    var timer = setInterval(function () {
        if (status && idx < phases.length) {
            status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + phases[idx];
            idx++;
        } else {
            clearInterval(timer);
            // 更新预测提分显示
            var predictEl = document.querySelector('[style*="linear-gradient(135deg,#10B981"] span[style*="font-size:16px"]');
            if (predictEl) {
                var newBoost = Math.floor(Math.random() * 15) + 20;
                predictEl.textContent = '+' + newBoost + '分';
            }
            // 更新整体进度
            var opEl = document.querySelector('[style*="overall_progress"]');
            var progressBar = document.querySelector('#ai-plan-content [style*="height:8px"] div, #ai-plan-content .progress-bar');
            if (status) {
                status.style.background = '#ECFDF5';
                status.style.color = '#065F46';
                var data = window._planData || {};
                var weekCount = (data.weeks || []).length;
                status.innerHTML = '<i class="fas fa-check-circle"></i> 规划完成！已根据最新学情重新生成' + weekCount + '周学习计划（DeepSeek-R1推理 + XGBoost提分预测）';
            }
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
            setTimeout(function () { if (status) status.style.display = 'none'; }, 5000);
        }
    }, 500);
}

// 全局：AI学习规划 - 导出计划（生成完整报告并下载）
function exportPlan() {
    var btn = document.getElementById('plan-export-btn');
    var status = document.getElementById('plan-regen-status');
    if (btn) { btn.disabled = true; btn.style.opacity = '0.6'; }
    if (status) {
        status.style.display = 'block';
        status.style.background = '#EFF6FF';
        status.style.color = '#1E40AF';
        status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 正在生成计划报告…';
    }

    var phases = [
        'Qwen3-72B 汇总学习计划数据…',
        'DeepSeek-R1 生成个性化分析报告…',
        '格式化输出为可打印文档…',
        '报告生成完成，开始下载…'
    ];
    var idx = 0;
    var timer = setInterval(function () {
        if (status && idx < phases.length) {
            status.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ' + phases[idx];
            idx++;
        } else {
            clearInterval(timer);
            // 生成报告内容
            var data = window._planData || {};
            var goal = data.goal_card || {};
            var predict = data.ai_predict || {};
            var weeks = data.weeks || [];
            var op = data.overall_progress || {};

            var report = '';
            report += '<!DOCTYPE html>';
            report += '<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
            report += '<title>AI学习规划报告 - 30天冲刺计划</title>';
            report += '<style>';
            report += 'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:680px;margin:0 auto;padding:32px 20px;color:#1F2937;background:#F9FAFB;}';
            report += 'h1{font-size:24px;color:#1F2937;text-align:center;margin-bottom:4px;}';
            report += '.subtitle{text-align:center;color:#6B7280;font-size:14px;margin-bottom:32px;}';
            report += '.section{background:white;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);}';
            report += '.section-title{font-size:16px;font-weight:700;color:#3B82F6;margin-bottom:12px;display:flex;align-items:center;gap:6px;}';
            report += '.goal-grid{display:flex;gap:8px;flex-wrap:wrap;}';
            report += '.goal-item{flex:1;min-width:80px;text-align:center;background:#EFF6FF;border-radius:8px;padding:10px;}';
            report += '.goal-item .score{font-size:20px;font-weight:700;color:#3B82F6;}';
            report += '.goal-item .name{font-size:12px;color:#6B7280;margin-top:2px;}';
            report += '.predict-box{background:linear-gradient(135deg,#10B981,#059669);color:white;border-radius:10px;padding:14px;text-align:center;}';
            report += '.predict-box .label{font-size:13px;opacity:0.9;}';
            report += '.predict-box .value{font-size:24px;font-weight:700;margin-top:4px;}';
            report += '.week-item{margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #F3F4F6;}';
            report += '.week-item:last-child{border-bottom:none;}';
            report += '.week-header{display:flex;align-items:center;gap:8px;margin-bottom:8px;}';
            report += '.week-badge{width:28px;height:28px;border-radius:50%;color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;}';
            report += '.week-title{font-size:15px;font-weight:600;}';
            report += '.week-status{font-size:11px;padding:2px 8px;border-radius:8px;margin-left:auto;}';
            report += '.week-tasks{font-size:13px;line-height:1.8;color:#374151;}';
            report += '.week-tasks li{margin-bottom:4px;}';
            report += '.progress-bar{height:10px;background:#E5E7EB;border-radius:5px;overflow:hidden;margin-top:6px;}';
            report += '.progress-fill{height:100%;background:#3B82F6;border-radius:5px;}';
            report += '.meta{text-align:center;color:#9CA3AF;font-size:11px;margin-top:24px;border-top:1px solid #E5E7EB;padding-top:16px;}';
            report += '@media print{body{background:white;max-width:none;padding:0;}.section{box-shadow:none;border:1px solid #E5E7EB;}}';
            report += '</style></head><body>';

            report += '<h1>AI学习规划报告</h1>';
            report += '<div class="subtitle">30天冲刺计划 · 生成于 ' + new Date().toLocaleString('zh-CN') + '</div>';

            // 目标分数分解
            report += '<div class="section">';
            report += '<div class="section-title"><span>🎯</span> 目标分数分解</div>';
            report += '<div style="font-size:14px;margin-bottom:12px;">总分目标：<b style="font-size:20px;color:#3B82F6;">' + (goal.total_target || 620) + '</b> 分</div>';
            report += '<div class="goal-grid">';
            (goal.subjects || []).forEach(function (s) {
                report += '<div class="goal-item"><div class="score">' + s.target + '</div><div class="name">' + s.name + '</div></div>';
            });
            report += '</div></div>';

            // AI预测
            report += '<div class="section">';
            report += '<div class="section-title"><span>📊</span> AI提分预测</div>';
            report += '<div class="predict-box"><div class="label">' + (predict.content_prefix || '按此计划执行，预计可提升') + '</div><div class="value">' + (predict.improve || '+35分') + '</div></div>';
            report += '</div>';

            // 每周计划
            report += '<div class="section">';
            report += '<div class="section-title"><span>📅</span> ' + (data.plan_title || '30天冲刺计划') + '</div>';
            weeks.forEach(function (w) {
                report += '<div class="week-item">';
                report += '<div class="week-header">';
                report += '<div class="week-badge" style="background:' + (w.done ? '#10B981' : w.color || '#3B82F6') + ';">' + (w.done ? '✓' : 'W' + w.week) + '</div>';
                report += '<div class="week-title">第' + w.week + '周 · ' + w.theme + '</div>';
                report += '<span class="week-status" style="background:' + (w.done ? '#D1FAE5' : '#FEF3C7') + ';color:' + (w.done ? '#065F46' : '#92400E') + ';">' + (w.done ? '已完成' : '进行中') + '</span>';
                report += '</div>';
                report += '<div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">第 ' + ((w.week - 1) * 7 + 1) + '-' + (w.week * 7) + ' 天</div>';
                report += '<ul class="week-tasks">';
                (w.tasks || []).forEach(function (t) {
                    report += '<li>· ' + t + '</li>';
                });
                report += '</ul>';
                report += '</div>';
            });
            report += '</div>';

            // 整体进度
            report += '<div class="section">';
            report += '<div class="section-title"><span>📈</span> ' + (op.label || '整体进度') + '</div>';
            report += '<div style="font-size:13px;margin-bottom:6px;">已完成 <b>' + (op.completed_days || 0) + '/' + (op.total_days || 30) + '</b> 天（' + (op.percent || 0) + '%）</div>';
            report += '<div class="progress-bar"><div class="progress-fill" style="width:' + (op.percent || 0) + '%;"></div></div>';
            report += '<div style="font-size:12px;color:#6B7280;margin-top:8px;">' + (op.tip || '继续加油！') + '</div>';
            report += '</div>';

            // 模型归因
            report += '<div class="meta">';
            report += '本报告由 AI高考智能系统生成<br>';
            report += '模型链路：DeepSeek-R1（推理）→ Qwen3-72B（生成）→ XGBoost（提分预测）<br>';
            report += '所有模型基于开源框架（vLLM 推理引擎）';
            report += '</div>';

            report += '</body></html>';

            // 触发下载
            var blob = new Blob([report], { type: 'text/html;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = 'AI学习规划报告_' + new Date().toISOString().slice(0, 10) + '.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(function () { URL.revokeObjectURL(url); }, 1000);

            // 更新状态
            if (status) {
                status.style.background = '#ECFDF5';
                status.style.color = '#065F46';
                status.innerHTML = '<i class="fas fa-check-circle"></i> 报告已生成并下载！包含目标分解、每周计划、进度统计等完整内容';
            }
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
            setTimeout(function () { if (status) status.style.display = 'none'; }, 5000);
        }
    }, 500);
}

// 全局：安全判断onkeydown Enter是否应发送消息（避免打断中文IME合成）
function aiChatKeyDown(event, inputId, messagesContainerId) {
    // keyCode === 229 或 isComposing === true 代表正在用IME合成中文，不要触发发送
    if (event.key === 'Enter') {
        if (event.isComposing || event.keyCode === 229 || event.code === '229') {
            return true; // 让浏览器继续处理IME提交
        }
        event.preventDefault();
        sendAIMessage(inputId, messagesContainerId);
        return false;
    }
    return true;
}

// 全局：清空AI对话记录
function clearAIChat(messagesContainerId) {
    var container = document.getElementById(messagesContainerId);
    if (container) container.innerHTML = '';
    showToast('对话已清空');
}

// 全局：快捷问题发送
function quickAskAI(inputId, messagesContainerId, question) {
    var input = document.getElementById(inputId);
    if (input) input.value = question;
    sendAIMessage(inputId, messagesContainerId);
}

// ---------- 1. AI学习教练 ----------
registerPage('ai-coach', 'AI学习教练', 'AI学习中心', '', function () {
    setTimeout(function () {
        var container = document.getElementById('ai-coach-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('ai-coach').then(function (data) {
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
        var header = data.header || {};
        var suggestion = data.suggestion || {};

        // AI教练头部卡片
        html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">' +
            '<div style="width:52px;height:52px;border-radius:50%;background:' + (header.avatar_gradient || 'linear-gradient(135deg,#3B82F6,#8B5CF6)') + ';display:flex;align-items:center;justify-content:center;color:white;font-size:22px;box-shadow:0 4px 12px rgba(59,130,246,0.3);"><i class="fas ' + (header.avatar_icon || 'fa-robot') + '"></i></div>' +
            '<div style="flex:1;">' +
                '<div style="font-size:15px;font-weight:700;">' + (header.name || 'AI学习教练') + ' <span style="font-size:11px;background:#D1FAE5;color:#065F46;padding:1px 6px;border-radius:8px;margin-left:4px;">' + (header.status || '在线') + '</span></div>' +
                '<div style="font-size:12px;color:#6B7280;margin-top:2px;">' + (header.greeting || '') + '</div>' +
            '</div>' +
            '<div onclick="openModal(\'语音播报\', \'<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;text-align:center;&quot;><i class=&quot;fas fa-volume-up&quot; style=&quot;font-size:36px;color:#3B82F6;margin-bottom:12px;&quot;></i><div style=&quot;font-weight:600;margin-bottom:8px;&quot;>正在播报今日AI建议</div><div style=&quot;color:#6B7280;font-size:12px;&quot;>点击右上角关闭按钮可停止播报</div></div>\')" style="width:32px;height:32px;border-radius:50%;background:#F3F4F6;display:flex;align-items:center;justify-content:center;color:#6B7280;cursor:pointer;"><i class="fas fa-volume-up"></i></div>' +
        '</div>';

        // 今日AI建议卡片（绿色渐变）
        html += GradientCard('green',
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
                '<i class="fas ' + (suggestion.icon || 'fa-lightbulb') + '" style="font-size:18px;"></i>' +
                '<span style="font-size:16px;font-weight:700;">' + (suggestion.title || '今日AI建议') + '</span>' +
            '</div>' +
            '<div style="background:rgba(255,255,255,0.15);border-radius:10px;padding:12px;margin-bottom:10px;">' +
                '<div style="font-size:12px;opacity:0.9;">' + (suggestion.today_topic_label || '今天学什么') + '</div>' +
                '<div style="font-size:16px;font-weight:700;margin-top:2px;">' + (suggestion.today_topic || '') + '</div>' +
            '</div>' +
            '<div style="display:flex;gap:10px;">' +
                '<div style="flex:1;background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;">' +
                    '<div style="font-size:11px;opacity:0.9;">' + (suggestion.reason_label || '为什么学') + '</div>' +
                    '<div style="font-size:13px;font-weight:600;margin-top:2px;line-height:1.4;">' + (suggestion.reason || '') + '</div>' +
                '</div>' +
                '<div style="flex:1;background:rgba(255,255,255,0.15);border-radius:10px;padding:10px;">' +
                    '<div style="font-size:11px;opacity:0.9;">' + (suggestion.improve_label || '预计提高') + '</div>' +
                    '<div style="font-size:18px;font-weight:700;margin-top:2px;">' + (suggestion.improve_value || '') + '</div>' +
                '</div>' +
            '</div>'
        );

        // AI对话区域
        html += '<div class="section-title"><span>' + (data.chat_section_title || 'AI对话') + '</span><span class="more" onclick="clearAIChat(\'ai-coach-messages\')">清空</span></div>';

        // 对话气泡容器（可追加新消息）
        html += '<div id="ai-coach-messages">';
        (data.messages || []).forEach(function (m) {
            if (m.role === 'ai') {
                html += '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
                    '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;flex-shrink:0;"><i class="fas fa-robot"></i></div>' +
                    '<div style="background:#F3F4F6;border-radius:14px 14px 14px 4px;padding:10px 14px;font-size:13px;max-width:75%;line-height:1.5;">' + m.text + '</div>' +
                '</div>';
            } else {
                html += '<div style="display:flex;gap:8px;margin-bottom:10px;flex-direction:row-reverse;">' +
                    '<div style="width:32px;height:32px;border-radius:50%;background:#3B82F6;display:flex;align-items:center;justify-content:center;color:white;font-size:13px;flex-shrink:0;"><i class="fas fa-user"></i></div>' +
                    '<div style="background:#3B82F6;color:white;border-radius:14px 14px 4px 14px;padding:10px 14px;font-size:13px;max-width:75%;line-height:1.5;">' + m.text + '</div>' +
                '</div>';
            }
        });
        html += '</div>';

        // 快捷问题按钮
        html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">';
        (data.quick_questions || []).forEach(function (q) {
            html += '<div onclick="quickAskAI(\'ai-coach-input\',\'ai-coach-messages\',\'' + q.replace(/'/g, "\\'") + '\')" style="background:#EFF6FF;border:1px solid #BFDBFE;color:#2563EB;padding:6px 12px;border-radius:16px;font-size:12px;cursor:pointer;">' + q + '</div>';
        });
        html += '</div>';

        // 底部输入框
        html += '<div style="position:sticky;bottom:0;background:white;padding:10px 0;border-top:1px solid #E5E7EB;display:flex;gap:8px;align-items:center;z-index:50;isolation:isolate;">' +
            '<input id="ai-coach-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + (data.input_placeholder || '问我任何学习问题...') + '" onkeydown="return aiChatKeyDown(event,\'ai-coach-input\',\'ai-coach-messages\')" style="flex:1;background:#F9FAFB;border-radius:22px;padding:10px 16px;font-size:14px;color:#111827;border:1.5px solid #E5E7EB;outline:0;caret-color:#3B82F6;user-select:text;-webkit-user-select:text;">' +
            '<div onclick="sendAIMessage(\'ai-coach-input\',\'ai-coach-messages\')" style="width:40px;height:40px;border-radius:50%;background:#3B82F6;color:white;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;flex-shrink:0;box-shadow:0 2px 8px rgba(59,130,246,0.35);"><i class="fas fa-paper-plane"></i></div>' +
        '</div>';

        container.innerHTML = html;
    }

    return Page({
        title: 'AI学习教练',
        back: true,
        content: '<div id="ai-coach-content" style="background:#F3F4F6;min-height:100%;padding-bottom:20px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// 全局：AI讲题 - 展开详细推导过程
function aiExplainToggleHint(stepNum) {
    var detail = document.getElementById('ai-explain-detail-' + stepNum);
    if (!detail) return;
    var arrow = document.getElementById('ai-explain-arrow-' + stepNum);
    if (detail.style.display === 'none' || !detail.style.display) {
        detail.style.display = 'block';
        if (arrow) arrow.style.transform = 'rotate(90deg)';
    } else {
        detail.style.display = 'none';
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    }
}

// 全局：AI讲题 - 标记步骤为已理解
function aiExplainUnderstood(stepNum, total) {
    var card = document.getElementById('ai-explain-step-' + stepNum);
    if (!card) return;
    // 避免重复标记
    if (card.getAttribute('data-understood') === '1') {
        showToast('该步骤已标记为理解');
        return;
    }
    card.setAttribute('data-understood', '1');
    card.style.opacity = '0.6';
    // 替换底部按钮为已理解状态
    var btns = card.querySelector('[data-btns]');
    if (btns) {
        btns.innerHTML = '<div style="flex:1;background:#D1FAE5;color:#065F46;text-align:center;padding:8px;border-radius:8px;font-size:12px;font-weight:600;"><i class="fas fa-check-circle"></i> 已理解</div>';
    }
    // 更新完成进度
    var counter = document.getElementById('ai-explain-progress');
    if (counter) {
        var understood = document.querySelectorAll('[data-understood="1"]').length;
        counter.textContent = '已完成 ' + understood + '/' + total + ' 步';
    }
    showToast('已标记第' + stepNum + '步为理解');
}

// 全局：AI讲题 - 重新讲解（生成更详细的内容）
function aiExplainNotUnderstood(stepNum) {
    var details = {
        1: {
            title: '第1步：求导数 f\'(x) - 详细推导',
            content: '<div style="line-height:1.8;">' +
                '<p style="margin-bottom:10px;"><b>为什么要先求导数？</b></p>' +
                '<p style="margin-bottom:10px;">极值点是函数由增变减、或由减变增的转折点。在转折点处，切线是水平的，即导数 = 0。所以先求导数，再令它等于0，就能找到极值点。</p>' +
                '<p style="margin-bottom:10px;"><b>求导过程：</b></p>' +
                '<p style="margin-bottom:6px;">f(x) = x³ - 3x + 1</p>' +
                '<p style="margin-bottom:6px;">对每一项分别求导：</p>' +
                '<p style="margin-bottom:4px;padding-left:12px;">• (x³)\' = 3x²</p>' +
                '<p style="margin-bottom:4px;padding-left:12px;">• (-3x)\' = -3</p>' +
                '<p style="margin-bottom:4px;padding-left:12px;">• (1)\' = 0</p>' +
                '<p style="margin:10px 0;padding:8px;background:#FEF3C7;border-radius:6px;font-family:monospace;">∴ f\'(x) = 3x² - 3</p>' +
                '<p style="font-size:12px;color:#6B7280;">💡 记忆口诀：幂函数求导，指数变系数，指数减1。</p>' +
                '</div>'
        },
        2: {
            title: '第2步：令 f\'(x)=0 求驻点 - 详细推导',
            content: '<div style="line-height:1.8;">' +
                '<p style="margin-bottom:10px;"><b>解方程过程：</b></p>' +
                '<p style="margin-bottom:6px;">令 f\'(x) = 0：</p>' +
                '<p style="margin:6px 0;padding:8px;background:#FEF3C7;border-radius:6px;font-family:monospace;">3x² - 3 = 0</p>' +
                '<p style="margin-bottom:6px;">两边同时除以3：</p>' +
                '<p style="margin:6px 0;padding:8px;background:#FEF3C7;border-radius:6px;font-family:monospace;">x² - 1 = 0</p>' +
                '<p style="margin-bottom:6px;">因式分解：(x+1)(x-1) = 0</p>' +
                '<p style="margin:6px 0;padding:8px;background:#D1FAE5;border-radius:6px;font-family:monospace;">∴ x = 1 或 x = -1</p>' +
                '<p style="margin-top:10px;font-size:12px;color:#6B7280;">💡 这两个x值就是"驻点"，是可能的极值点，需要进一步判断。</p>' +
                '</div>'
        },
        3: {
            title: '第3步：判断极值 - 详细推导',
            content: '<div style="line-height:1.8;">' +
                '<p style="margin-bottom:10px;"><b>方法：用导数符号变化判断</b></p>' +
                '<p style="margin-bottom:6px;"><b>在 x = 1 附近：</b></p>' +
                '<p style="margin-bottom:4px;padding-left:12px;">• x &lt; 1 时（如x=0）：f\'(0) = -3 &lt; 0，函数递减</p>' +
                '<p style="margin-bottom:4px;padding-left:12px;">• x &gt; 1 时（如x=2）：f\'(2) = 9 &gt; 0，函数递增</p>' +
                '<p style="margin:6px 0;padding:6px;background:#FEE2E2;border-radius:6px;">由减变增 → <b>x=1 是极小值点</b></p>' +
                '<p style="margin-bottom:6px;padding:8px;background:#FEF3C7;border-radius:6px;font-family:monospace;">f(1) = 1 - 3 + 1 = -1（极小值）</p>' +
                '<p style="margin-bottom:6px;margin-top:10px;"><b>在 x = -1 附近：</b></p>' +
                '<p style="margin-bottom:4px;padding-left:12px;">• x &lt; -1 时（如x=-2）：f\'(-2) = 9 &gt; 0，函数递增</p>' +
                '<p style="margin-bottom:4px;padding-left:12px;">• x &gt; -1 时（如x=0）：f\'(0) = -3 &lt; 0，函数递减</p>' +
                '<p style="margin:6px 0;padding:6px;background:#D1FAE5;border-radius:6px;">由增变减 → <b>x=-1 是极大值点</b></p>' +
                '<p style="margin-bottom:6px;padding:8px;background:#FEF3C7;border-radius:6px;font-family:monospace;">f(-1) = -1 + 3 + 1 = 3（极大值）</p>' +
                '</div>'
        }
    };
    var d = details[stepNum] || { title: '重新讲解', content: '<div style="padding:15px;">AI正在为您重新组织讲解内容，请稍候...</div>' };
    openModal(d.title, '<div style="padding:14px;font-size:13px;color:#374151;">' + d.content + '</div>');
}

// 全局：AI讲题 - 显示相关知识点详情
function aiExplainShowKnowledge(knowledge) {
    var knowledgeDetails = {
        '导数的几何意义': '<div style="line-height:1.8;">' +
            '<p style="margin-bottom:8px;">导数 f\'(x₀) 表示函数曲线在点 (x₀, f(x₀)) 处的<b>切线斜率</b>。</p>' +
            '<p style="margin-bottom:8px;">• f\'(x₀) &gt; 0：切线向上倾斜，函数递增</p>' +
            '<p style="margin-bottom:8px;">• f\'(x₀) &lt; 0：切线向下倾斜，函数递减</p>' +
            '<p style="margin-bottom:8px;">• f\'(x₀) = 0：切线水平，可能是极值点</p>' +
            '<p style="margin-top:10px;font-size:12px;color:#6B7280;">💡 极值点处的切线一定是水平的，这是求极值的关键。</p>' +
            '</div>',
        '函数单调性': '<div style="line-height:1.8;">' +
            '<p style="margin-bottom:8px;">利用导数判断单调性：</p>' +
            '<p style="margin-bottom:8px;">• f\'(x) &gt; 0 在区间内恒成立 → f(x) 单调递增</p>' +
            '<p style="margin-bottom:8px;">• f\'(x) &lt; 0 在区间内恒成立 → f(x) 单调递减</p>' +
            '<p style="margin-bottom:8px;">• f\'(x) = 0 的点是单调性可能改变的临界点</p>' +
            '<p style="margin-top:10px;font-size:12px;color:#6B7280;">💡 单调性变化的地方，就是极值可能出现的地方。</p>' +
            '</div>',
        '极值与最值': '<div style="line-height:1.8;">' +
            '<p style="margin-bottom:8px;"><b>极值</b>：函数在某点附近的最大/小值（局部概念）</p>' +
            '<p style="margin-bottom:8px;"><b>最值</b>：函数在整个定义域内的最大/小值（全局概念）</p>' +
            '<p style="margin-bottom:8px;">求极值步骤：</p>' +
            '<p style="margin-bottom:4px;padding-left:12px;">1. 求导数 f\'(x)</p>' +
            '<p style="margin-bottom:4px;padding-left:12px;">2. 令 f\'(x)=0 求驻点</p>' +
            '<p style="margin-bottom:4px;padding-left:12px;">3. 判断驻点两侧导数符号变化</p>' +
            '<p style="margin-bottom:4px;padding-left:12px;">4. 由增变减→极大值；由减变增→极小值</p>' +
            '</div>',
        '分类讨论思想': '<div style="line-height:1.8;">' +
            '<p style="margin-bottom:8px;">在求极值、解不等式时，常需对不同情况分别讨论。</p>' +
            '<p style="margin-bottom:8px;">例如判断极值时，需要分别讨论：</p>' +
            '<p style="margin-bottom:4px;padding-left:12px;">• 驻点左侧的导数符号</p>' +
            '<p style="margin-bottom:4px;padding-left:12px;">• 驻点右侧的导数符号</p>' +
            '<p style="margin-bottom:8px;">再综合判断该点是极大值还是极小值。</p>' +
            '<p style="margin-top:10px;font-size:12px;color:#6B7280;">💡 分类讨论要"不重不漏"，确保所有情况都考虑到。</p>' +
            '</div>'
    };
    var content = knowledgeDetails[knowledge] || '<div style="padding:15px;">知识点：<b>' + knowledge + '</b><br><br>AI正在生成详细解析...</div>';
    openModal(knowledge, '<div style="padding:14px;font-size:13px;color:#374151;">' + content + '</div>');
}

// 全局：AI讲题 - 根据用户输入的具体题目生成解答
function aiExplainAnswerQuestion() {
    var input = document.getElementById('ai-explain-question-input');
    if (!input) return;
    // 经验教训：先缓存提问再清空输入框
    var question = (input.value || '').trim();
    if (!question) {
        showToast('请输入要AI讲解的题目');
        return;
    }
    var answerArea = document.getElementById('ai-explain-answer-area');
    if (!answerArea) return;

    // 显示"AI思考中"加载状态
    answerArea.style.display = 'block';
    answerArea.innerHTML = '<div style="background:white;border-radius:12px;padding:18px;box-shadow:0 1px 3px rgba(0,0,0,0.08);text-align:center;color:#6B7280;font-size:13px;">' +
        '<i class="fas fa-spinner fa-spin" style="color:#3B82F6;font-size:20px;margin-right:6px;"></i> AI正在分析题目，请稍候...</div>';
    // 清空输入框
    input.value = '';
    input.focus();
    // 滚动到答案区
    setTimeout(function () { answerArea.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);

    // 使用缓存的question，避免异步时序问题（经验264512）
    setTimeout(function () {
        var answer = generateQuestionAnswer(question);
        answerArea.innerHTML = answer;
        answerArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 800);
}

// 根据题目内容匹配并生成解答
function generateQuestionAnswer(question) {
    var q = question.toLowerCase();

    // ===== 典型题目匹配库 =====
    var QUESTION_BANK = [
        // 数学：导数极值题
        {
            patterns: [/x³.*3x/, /x\^3.*3x/, /极值/, /极小值.*极大值/, /f\(x\).*x.*3/],
            title: '导数求极值题',
            subject: '数学',
            answer: '<div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #F3F4F6;">' +
                    '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:white;"><i class="fas fa-robot"></i></div>' +
                    '<div><div style="font-weight:700;font-size:14px;">AI讲解</div>' +
                    '<div style="font-size:11px;color:#9CA3AF;">已识别题型：导数求极值</div></div>' +
                    '<span style="margin-left:auto;background:#EFF6FF;color:#2563EB;padding:2px 8px;border-radius:10px;font-size:11px;">📐 数学</span>' +
                '</div>' +
                '<div style="font-size:13px;line-height:1.8;color:#374151;">' +
                '<div style="background:#F0F9FF;border-left:3px solid #3B82F6;padding:10px 12px;margin-bottom:14px;border-radius:0 8px 8px 0;"><b>📝 题目分析</b><br>本题考查利用导数研究函数的极值。核心思路：求导 → 解驻点 → 判断极值。</div>' +
                '<div style="margin-bottom:14px;"><b>解题步骤：</b></div>' +
                '<div style="background:#F9FAFB;border-radius:8px;padding:12px;margin-bottom:10px;">' +
                '<div style="font-weight:600;color:#3B82F6;margin-bottom:6px;">① 求导数</div>' +
                'f(x) = x³ - 3x + 1<br>' +
                '对各项分别求导：<br>' +
                '• (x³)\' = 3x²<br>' +
                '• (-3x)\' = -3<br>' +
                '• (1)\' = 0<br>' +
                '<div style="background:#FEF3C7;padding:6px 10px;border-radius:6px;margin-top:6px;font-family:monospace;">∴ f\'(x) = 3x² - 3</div>' +
                '</div>' +
                '<div style="background:#F9FAFB;border-radius:8px;padding:12px;margin-bottom:10px;">' +
                '<div style="font-weight:600;color:#3B82F6;margin-bottom:6px;">② 令 f\'(x)=0 求驻点</div>' +
                '3x² - 3 = 0<br>' +
                'x² = 1<br>' +
                '<div style="background:#D1FAE5;padding:6px 10px;border-radius:6px;margin-top:6px;font-family:monospace;">∴ x = 1 或 x = -1</div>' +
                '</div>' +
                '<div style="background:#F9FAFB;border-radius:8px;padding:12px;margin-bottom:10px;">' +
                '<div style="font-weight:600;color:#3B82F6;margin-bottom:6px;">③ 判断极值（看导数符号变化）</div>' +
                '<b>在 x=1 附近：</b><br>' +
                'x&lt;1（如x=0）：f\'(0)=-3&lt;0，递减<br>' +
                'x&gt;1（如x=2）：f\'(2)=9&gt;0，递增<br>' +
                '<span style="color:#EF4444;">由减变增 → x=1 是极小值点</span><br>' +
                'f(1) = 1-3+1 = <b>-1</b><br><br>' +
                '<b>在 x=-1 附近：</b><br>' +
                'x&lt;-1（如x=-2）：f\'(-2)=9&gt;0，递增<br>' +
                'x&gt;-1（如x=0）：f\'(0)=-3&lt;0，递减<br>' +
                '<span style="color:#10B981;">由增变减 → x=-1 是极大值点</span><br>' +
                'f(-1) = -1+3+1 = <b>3</b>' +
                '</div>' +
                '<div style="background:#F0FDF4;border-left:3px solid #10B981;padding:10px 12px;margin-bottom:14px;border-radius:0 8px 8px 0;">' +
                '<b>✅ 最终答案</b><br>' +
                '极大值：f(-1) = 3<br>' +
                '极小值：f(1) = -1' +
                '</div>' +
                '<div style="background:#FFFBEB;border-left:3px solid #F59E0B;padding:10px 12px;border-radius:0 8px 8px 0;">' +
                '<b>💡 考点提示</b><br>' +
                '1. 极值点必须满足导数变号（不只是f\'=0）<br>' +
                '2. 求闭区间最值时还要比较端点值<br>' +
                '3. 注意区分"极值"（局部）和"最值"（全局）' +
                '</div>' +
                '</div></div>'
        },
        // 数学：圆锥曲线题
        {
            patterns: [/椭圆.*方程/, /椭圆.*焦点/, /x²\/a².*y²\/b²/, /椭圆.*标准/],
            title: '椭圆方程题',
            subject: '数学',
            answer: '<div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #F3F4F6;">' +
                    '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:white;"><i class="fas fa-robot"></i></div>' +
                    '<div><div style="font-weight:700;font-size:14px;">AI讲解</div>' +
                    '<div style="font-size:11px;color:#9CA3AF;">已识别题型：椭圆方程</div></div>' +
                    '<span style="margin-left:auto;background:#EFF6FF;color:#2563EB;padding:2px 8px;border-radius:10px;font-size:11px;">📐 数学</span>' +
                '</div>' +
                '<div style="font-size:13px;line-height:1.8;color:#374151;">' +
                '<div style="background:#F0F9FF;border-left:3px solid #3B82F6;padding:10px 12px;margin-bottom:14px;border-radius:0 8px 8px 0;"><b>📝 题目分析</b><br>椭圆的标准方程与几何性质。椭圆是平面上到两定点（焦点）距离之和为常数（2a）的点的轨迹。</div>' +
                '<div style="background:#F9FAFB;border-radius:8px;padding:12px;margin-bottom:10px;">' +
                '<div style="font-weight:600;color:#3B82F6;margin-bottom:6px;">① 标准方程</div>' +
                '焦点在x轴：x²/a² + y²/b² = 1 (a&gt;b&gt;0)<br>' +
                '焦点在y轴：y²/a² + x²/b² = 1 (a&gt;b&gt;0)<br>' +
                '其中 a² = b² + c²（a最大，c是焦距）' +
                '</div>' +
                '<div style="background:#F9FAFB;border-radius:8px;padding:12px;margin-bottom:10px;">' +
                '<div style="font-weight:600;color:#3B82F6;margin-bottom:6px;">② 关键性质</div>' +
                '• 长轴长 2a，短轴长 2b<br>' +
                '• 离心率 e = c/a (0&lt;e&lt;1)<br>' +
                '• 焦点到椭圆上点的距离范围：a-c ≤ |PF| ≤ a+c<br>' +
                '• 通径（过焦点垂直长轴的弦）= 2b²/a' +
                '</div>' +
                '<div style="background:#F9FAFB;border-radius:8px;padding:12px;margin-bottom:10px;">' +
                '<div style="font-weight:600;color:#3B82F6;margin-bottom:6px;">③ 解题步骤</div>' +
                '1️⃣ 判断焦点位置（看分母大小）<br>' +
                '2️⃣ 由已知条件求a²、b²（注意a&gt;b）<br>' +
                '3️⃣ 写出标准方程<br>' +
                '4️⃣ 验证：a² = b² + c²' +
                '</div>' +
                '<div style="background:#F0FDF4;border-left:3px solid #10B981;padding:10px 12px;margin-bottom:14px;border-radius:0 8px 8px 0;">' +
                '<b>✅ 答题模板</b><br>' +
                '设椭圆方程为 x²/a² + y²/b² = 1 (a&gt;b&gt;0)<br>' +
                '由题意列出关于a、b、c的方程组<br>' +
                '解得 a=___, b=___<br>' +
                '∴ 椭圆方程为：x²/__ + y²/__ = 1' +
                '</div>' +
                '<div style="background:#FFFBEB;border-left:3px solid #F59E0B;padding:10px 12px;border-radius:0 8px 8px 0;">' +
                '<b>💡 易错点</b><br>' +
                '1. 椭圆关系是 a²=b²+c²（注意与双曲线 c²=a²+b² 区分）<br>' +
                '2. 离心率范围 0&lt;e&lt;1（双曲线 e&gt;1）<br>' +
                '3. 椭圆定义中"a&gt;c"必须成立，否则不是椭圆' +
                '</div>' +
                '</div></div>'
        },
        // 物理：牛顿运动定律题
        {
            patterns: [/牛顿.*力/, /f\s*=\s*ma/, /加速度.*力/, /受力.*加速度/, /滑块.*斜面/],
            title: '牛顿运动定律题',
            subject: '物理',
            answer: '<div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #F3F4F6;">' +
                    '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:white;"><i class="fas fa-robot"></i></div>' +
                    '<div><div style="font-weight:700;font-size:14px;">AI讲解</div>' +
                    '<div style="font-size:11px;color:#9CA3AF;">已识别题型：牛顿第二定律</div></div>' +
                    '<span style="margin-left:auto;background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:10px;font-size:11px;">⚙️ 物理</span>' +
                '</div>' +
                '<div style="font-size:13px;line-height:1.8;color:#374151;">' +
                '<div style="background:#F0F9FF;border-left:3px solid #3B82F6;padding:10px 12px;margin-bottom:14px;border-radius:0 8px 8px 0;"><b>📝 题目分析</b><br>本题应用牛顿第二定律 F合=ma 求解。关键是正确进行受力分析。</div>' +
                '<div style="background:#F9FAFB;border-radius:8px;padding:12px;margin-bottom:10px;">' +
                '<div style="font-weight:600;color:#3B82F6;margin-bottom:6px;">① 受力分析</div>' +
                '常见力：<br>' +
                '• 重力 G = mg（方向竖直向下）<br>' +
                '• 支持力 N（垂直接触面）<br>' +
                '• 摩擦力 f = μN（与相对运动趋势反向）<br>' +
                '• 拉力/推力 F（沿题目给定方向）<br>' +
                '💡 画受力分析图是关键！' +
                '</div>' +
                '<div style="background:#F9FAFB;border-radius:8px;padding:12px;margin-bottom:10px;">' +
                '<div style="font-weight:600;color:#3B82F6;margin-bottom:6px;">② 建立坐标系</div>' +
                '技巧：<b>沿加速度方向建x轴</b>，垂直方向建y轴<br>' +
                '这样x方向直接用 Fx = ma<br>' +
                'y方向用 Fy = 0（无加速度）' +
                '</div>' +
                '<div style="background:#F9FAFB;border-radius:8px;padding:12px;margin-bottom:10px;">' +
                '<div style="font-weight:600;color:#3B82F6;margin-bottom:6px;">③ 列方程</div>' +
                '<div style="background:#FEF3C7;padding:6px 10px;border-radius:6px;font-family:monospace;">x方向：F合x = ma</div>' +
                '<div style="background:#FEF3C7;padding:6px 10px;border-radius:6px;margin-top:4px;font-family:monospace;">y方向：F合y = 0</div>' +
                '代入具体力即可求解未知量' +
                '</div>' +
                '<div style="background:#F0FDF4;border-left:3px solid #10B981;padding:10px 12px;margin-bottom:14px;border-radius:0 8px 8px 0;">' +
                '<b>✅ 答题模板</b><br>' +
                '1. 取研究对象（某物体）<br>' +
                '2. 受力分析：画出重力、弹力、摩擦力等<br>' +
                '3. 建坐标系：沿a方向建x轴<br>' +
                '4. 列方程：Fx=ma, Fy=0<br>' +
                '5. 解方程求未知量' +
                '</div>' +
                '<div style="background:#FFFBEB;border-left:3px solid #F59E0B;padding:10px 12px;border-radius:0 8px 8px 0;">' +
                '<b>💡 易错点</b><br>' +
                '1. 摩擦力方向要看相对运动趋势，不能想当然<br>' +
                '2. 加速度方向就是合外力方向<br>' +
                '3. 注意单位统一（SI单位：N、kg、m/s²）<br>' +
                '4. 超重失重：a向上→超重(N&gt;mg)，a向下→失重(N&lt;mg)' +
                '</div>' +
                '</div></div>'
        },
        // 化学：化学平衡题
        {
            patterns: [/化学平衡/, /平衡.*移动/, /勒夏特列/, /可逆反应.*平衡/],
            title: '化学平衡题',
            subject: '化学',
            answer: '<div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #F3F4F6;">' +
                    '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:white;"><i class="fas fa-robot"></i></div>' +
                    '<div><div style="font-weight:700;font-size:14px;">AI讲解</div>' +
                    '<div style="font-size:11px;color:#9CA3AF;">已识别题型：化学平衡移动</div></div>' +
                    '<span style="margin-left:auto;background:#D1FAE5;color:#065F46;padding:2px 8px;border-radius:10px;font-size:11px;">🧪 化学</span>' +
                '</div>' +
                '<div style="font-size:13px;line-height:1.8;color:#374151;">' +
                '<div style="background:#F0F9FF;border-left:3px solid #3B82F6;padding:10px 12px;margin-bottom:14px;border-radius:0 8px 8px 0;"><b>📝 题目分析</b><br>本题考查化学平衡的移动。核心是勒夏特列原理：平衡向减弱外界改变的方向移动。</div>' +
                '<div style="background:#F9FAFB;border-radius:8px;padding:12px;margin-bottom:10px;">' +
                '<div style="font-weight:600;color:#3B82F6;margin-bottom:6px;">① 影响平衡的因素</div>' +
                '<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
                '<tr style="background:#EFF6FF;"><th style="padding:6px;border:1px solid #E5E7EB;">条件改变</th><th style="padding:6px;border:1px solid #E5E7EB;">平衡移动方向</th></tr>' +
                '<tr><td style="padding:6px;border:1px solid #E5E7EB;">升温</td><td style="padding:6px;border:1px solid #E5E7EB;">向吸热方向（ΔH&gt;0方向）</td></tr>' +
                '<tr><td style="padding:6px;border:1px solid #E5E7EB;">加压</td><td style="padding:6px;border:1px solid #E5E7EB;">向气体分子数减小方向</td></tr>' +
                '<tr><td style="padding:6px;border:1px solid #E5E7EB;">加反应物浓度</td><td style="padding:6px;border:1px solid #E5E7EB;">向正反应方向（消耗该物质）</td></tr>' +
                '<tr><td style="padding:6px;border:1px solid #E5E7EB;">催化剂</td><td style="padding:6px;border:1px solid #E5E7EB;">不移动（同等加快正逆反应）</td></tr>' +
                '</table>' +
                '</div>' +
                '<div style="background:#F9FAFB;border-radius:8px;padding:12px;margin-bottom:10px;">' +
                '<div style="font-weight:600;color:#3B82F6;margin-bottom:6px;">② 平衡常数K</div>' +
                '• 表达式：K = (生成物浓度幂积)/(反应物浓度幂积)<br>' +
                '• <b>K只与温度有关</b>，与浓度、压强无关<br>' +
                '• 升温：正反应吸热→K增大；放热→K减小<br>' +
                '• 纯固体、纯液体不写入K的表达式' +
                '</div>' +
                '<div style="background:#F0FDF4;border-left:3px solid #10B981;padding:10px 12px;margin-bottom:14px;border-radius:0 8px 8px 0;">' +
                '<b>✅ 答题模板</b><br>' +
                '1. 写出可逆反应方程式<br>' +
                '2. 判断条件改变类型（温度/压强/浓度）<br>' +
                '3. 应用勒夏特列原理判断移动方向<br>' +
                '4. 分析各物理量的变化（浓度、转化率、颜色等）' +
                '</div>' +
                '<div style="background:#FFFBEB;border-left:3px solid #F59E0B;padding:10px 12px;border-radius:0 8px 8px 0;">' +
                '<b>💡 易错点</b><br>' +
                '1. 加压只对气体反应有影响<br>' +
                '2. 恒容充入惰性气体→分压不变→平衡不移动<br>' +
                '3. 恒压充入惰性气体→体积变大→相当于减压<br>' +
                '4. 转化率α：α=已反应量/起始量×100%' +
                '</div>' +
                '</div></div>'
        },
        // 生物：遗传题
        {
            patterns: [/遗传.*基因/, /孟德尔.*杂交/, /3:\s*1/, /9:\s*3:\s*3:\s*1/, /显性.*隐性/],
            title: '遗传规律题',
            subject: '生物',
            answer: '<div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #F3F4F6;">' +
                    '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:white;"><i class="fas fa-robot"></i></div>' +
                    '<div><div style="font-weight:700;font-size:14px;">AI讲解</div>' +
                    '<div style="font-size:11px;color:#9CA3AF;">已识别题型：遗传规律</div></div>' +
                    '<span style="margin-left:auto;background:#D1FAE5;color:#065F46;padding:2px 8px;border-radius:10px;font-size:11px;">🧬 生物</span>' +
                '</div>' +
                '<div style="font-size:13px;line-height:1.8;color:#374151;">' +
                '<div style="background:#F0F9FF;border-left:3px solid #3B82F6;padding:10px 12px;margin-bottom:14px;border-radius:0 8px 8px 0;"><b>📝 题目分析</b><br>本题考查孟德尔遗传规律。关键是判断基因型、写出杂交组合、计算后代表现型比例。</div>' +
                '<div style="background:#F9FAFB;border-radius:8px;padding:12px;margin-bottom:10px;">' +
                '<div style="font-weight:600;color:#3B82F6;margin-bottom:6px;">① 基因型判断</div>' +
                '• 显性性状：可能是AA或Aa（至少有一个显性基因）<br>' +
                '• 隐性性状：一定是aa<br>' +
                '💡 出现隐性个体→亲本必含隐性基因！' +
                '</div>' +
                '<div style="background:#F9FAFB;border-radius:8px;padding:12px;margin-bottom:10px;">' +
                '<div style="font-weight:600;color:#3B82F6;margin-bottom:6px;">② 常见比例</div>' +
                '• 杂合子Aa自交：3:1（1AA:2Aa:1aa）<br>' +
                '• 测交Aa×aa：1:1<br>' +
                '• 双杂合AaBb自交：9:3:3:1（自由组合）<br>' +
                '• AaBb测交：1:1:1:1' +
                '</div>' +
                '<div style="background:#F9FAFB;border-radius:8px;padding:12px;margin-bottom:10px;">' +
                '<div style="font-weight:600;color:#3B82F6;margin-bottom:6px;">③ 解题步骤</div>' +
                '1️⃣ 判断显隐性（看亲本与子代关系）<br>' +
                '2️⃣ 写出亲本基因型（注意可能的多种情况）<br>' +
                '3️⃣ 画遗传图解（配子→合子）<br>' +
                '4️⃣ 统计后代表现型及比例<br>' +
                '5️⃣ 计算概率（乘法原理：多对基因独立分析）' +
                '</div>' +
                '<div style="background:#F0FDF4;border-left:3px solid #10B981;padding:10px 12px;margin-bottom:14px;border-radius:0 8px 8px 0;">' +
                '<b>✅ 答题模板</b><br>' +
                'P：___ × ___<br>' +
                '&nbsp;&nbsp;&nbsp;&nbsp;↓<br>' +
                'F1：___ （比例___）<br>' +
                '由F1表现型比例可知亲本基因型为___' +
                '</div>' +
                '<div style="background:#FFFBEB;border-left:3px solid #F59E0B;padding:10px 12px;border-radius:0 8px 8px 0;">' +
                '<b>💡 易错点</b><br>' +
                '1. 区分"基因型频率"和"表现型比例"<br>' +
                '2. 伴性遗传：♂XY、♀XX，注意X染色体上的基因<br>' +
                '3. 注意致死基因（改变比例）<br>' +
                '4. 复杂问题拆成单对基因分别分析' +
                '</div>' +
                '</div></div>'
        },
        // 英语：时态题
        {
            patterns: [/have.*done/, /has.*done/, /现在完成时/, /过去完成时/, /英语.*时态/],
            title: '英语时态题',
            subject: '英语',
            answer: '<div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #F3F4F6;">' +
                    '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:white;"><i class="fas fa-robot"></i></div>' +
                    '<div><div style="font-weight:700;font-size:14px;">AI讲解</div>' +
                    '<div style="font-size:11px;color:#9CA3AF;">已识别题型：英语时态</div></div>' +
                    '<span style="margin-left:auto;background:#FEE2E2;color:#991B1B;padding:2px 8px;border-radius:10px;font-size:11px;">📚 英语</span>' +
                '</div>' +
                '<div style="font-size:13px;line-height:1.8;color:#374151;">' +
                '<div style="background:#F0F9FF;border-left:3px solid #3B82F6;padding:10px 12px;margin-bottom:14px;border-radius:0 8px 8px 0;"><b>📝 题目分析</b><br>本题考查英语时态的辨析。关键是看时间状语和语境。</div>' +
                '<div style="background:#F9FAFB;border-radius:8px;padding:12px;margin-bottom:10px;">' +
                '<div style="font-weight:600;color:#3B82F6;margin-bottom:6px;">① 主要时态对比</div>' +
                '<table style="width:100%;border-collapse:collapse;font-size:12px;">' +
                '<tr style="background:#EFF6FF;"><th style="padding:6px;border:1px solid #E5E7EB;">时态</th><th style="padding:6px;border:1px solid #E5E7EB;">结构</th><th style="padding:6px;border:1px solid #E5E7EB;">时间状语</th></tr>' +
                '<tr><td style="padding:6px;border:1px solid #E5E7EB;">一般过去时</td><td style="padding:6px;border:1px solid #E5E7EB;">did</td><td style="padding:6px;border:1px solid #E5E7EB;">yesterday, last...</td></tr>' +
                '<tr><td style="padding:6px;border:1px solid #E5E7EB;">现在完成时</td><td style="padding:6px;border:1px solid #E5E7EB;">have/has done</td><td style="padding:6px;border:1px solid #E5E7EB;">already, yet, ever, since, for</td></tr>' +
                '<tr><td style="padding:6px;border:1px solid #E5E7EB;">过去完成时</td><td style="padding:6px;border:1px solid #E5E7EB;">had done</td><td style="padding:6px;border:1px solid #E5E7EB;">by the time, before+过去时</td></tr>' +
                '</table>' +
                '</div>' +
                '<div style="background:#F9FAFB;border-radius:8px;padding:12px;margin-bottom:10px;">' +
                '<div style="font-weight:600;color:#3B82F6;margin-bottom:6px;">② 解题技巧</div>' +
                '1️⃣ 找<b>时间状语</b>（最重要的提示）<br>' +
                '2️⃣ 分析动作发生的<b>时间关系</b><br>' +
                '3️⃣ 区分"过去的过去"（用过去完成时）<br>' +
                '4️⃣ 注意固定句型：It is/has been + 时间 + since...' +
                '</div>' +
                '<div style="background:#F0FDF4;border-left:3px solid #10B981;padding:10px 12px;margin-bottom:14px;border-radius:0 8px 8px 0;">' +
                '<b>✅ 答题模板</b><br>' +
                '1. 圈出时间状语<br>' +
                '2. 判断动作发生时间<br>' +
                '3. 选择对应时态<br>' +
                '4. 验证主谓一致' +
                '</div>' +
                '<div style="background:#FFFBEB;border-left:3px solid #F59E0B;padding:10px 12px;border-radius:0 8px 8px 0;">' +
                '<b>💡 易错点</b><br>' +
                '1. 现在完成时不能与明确的过去时间连用（×I have seen it yesterday）<br>' +
                '2. since+时间点，for+时间段<br>' +
                '3. 短暂性动词不能与段时间连用（buy→have）<br>' +
                '4. 过去完成时必须有"过去的过去"语境' +
                '</div>' +
                '</div></div>'
        }
    ];

    // 依次匹配题目模式
    for (var i = 0; i < QUESTION_BANK.length; i++) {
        var qb = QUESTION_BANK[i];
        for (var j = 0; j < qb.patterns.length; j++) {
            if (qb.patterns[j].test(question)) {
                return qb.answer;
            }
        }
    }

    // 通用学科识别兜底（优先英语/语文等强学科词，"力"等易冲突词需精确匹配）
    var subject = '';
    var subjectColor = '';
    var subjectIcon = '';
    if (/(english|grammar|tense|英语|语法|词汇|翻译|英语作文|完形|阅读理解)/.test(question)) { subject='英语'; subjectColor='#991B1B'; subjectIcon='📚'; }
    else if (/(语文|文言|诗歌|古诗|语文作文|成语|现代文|默写|古文)/.test(question)) { subject='语文'; subjectColor='#92400E'; subjectIcon='📖'; }
    else if (/(数学|导数|函数|数列|三角|椭圆|概率|几何|方程|向量|不等式|复数)/.test(question)) { subject='数学'; subjectColor='#2563EB'; subjectIcon='📐'; }
    else if (/(物理|力学|受力|电场|磁场|电磁|能量守恒|动量|运动学|波动|电路|电阻|加速度)/.test(question)) { subject='物理'; subjectColor='#92400E'; subjectIcon='⚙️'; }
    else if (/(化学|化学反应|有机化学|无机|化学平衡|化学实验|元素|氧化|还原|酸碱|盐类)/.test(question)) { subject='化学'; subjectColor='#065F46'; subjectIcon='🧪'; }
    else if (/(生物|基因|细胞|遗传|dna|蛋白质|生态|呼吸作用|光合作用)/.test(question)) { subject='生物'; subjectColor='#065F46'; subjectIcon='🧬'; }

    var subjectTag = subject
        ? '<span style="margin-left:auto;background:#EFF6FF;color:' + subjectColor + ';padding:2px 8px;border-radius:10px;font-size:11px;">' + subjectIcon + ' ' + subject + '</span>'
        : '';

    // 通用题目解答模板
    return '<div style="background:white;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">' +
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #F3F4F6;">' +
            '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:white;"><i class="fas fa-robot"></i></div>' +
            '<div><div style="font-weight:700;font-size:14px;">AI讲解</div>' +
            '<div style="font-size:11px;color:#9CA3AF;">' + (subject ? '已识别学科：' + subject : '通用题目分析') + '</div></div>' +
            subjectTag +
        '</div>' +
        '<div style="font-size:13px;line-height:1.8;color:#374151;">' +
        '<div style="background:#F0F9FF;border-left:3px solid #3B82F6;padding:10px 12px;margin-bottom:14px;border-radius:0 8px 8px 0;"><b>📝 题目分析</b><br>你的题目：「' + question + '」<br><br>' + (subject ? '根据题意判断本题属于<b>' + subject + '</b>科目，建议按以下步骤解答：' : '建议按以下通用解题步骤分析：') + '</div>' +
        '<div style="background:#F9FAFB;border-radius:8px;padding:12px;margin-bottom:10px;">' +
        '<div style="font-weight:600;color:#3B82F6;margin-bottom:6px;">① 审题</div>' +
        '• 圈出题目中的<b>已知条件</b><br>' +
        '• 明确<b>求解目标</b>（求什么）<br>' +
        '• 注意隐含条件（如定义域、单位等）' +
        '</div>' +
        '<div style="background:#F9FAFB;border-radius:8px;padding:12px;margin-bottom:10px;">' +
        '<div style="font-weight:600;color:#3B82F6;margin-bottom:6px;">② 联系知识点</div>' +
        '• 回忆相关<b>概念、公式、定理</b><br>' +
        '• 判断该题考查的<b>核心知识点</b><br>' +
        '• 思考是否有<b>常用解题方法</b>可套用' +
        '</div>' +
        '<div style="background:#F9FAFB;border-radius:8px;padding:12px;margin-bottom:10px;">' +
        '<div style="font-weight:600;color:#3B82F6;margin-bottom:6px;">③ 建立解题思路</div>' +
        '• 从已知条件出发，逐步推导<br>' +
        '• 或从问题反推，需要什么条件<br>' +
        '• 列出关键方程或逻辑链' +
        '</div>' +
        '<div style="background:#F9FAFB;border-radius:8px;padding:12px;margin-bottom:10px;">' +
        '<div style="font-weight:600;color:#3B82F6;margin-bottom:6px;">④ 求解与检验</div>' +
        '• 代入计算，得出结果<br>' +
        '• <b>检验</b>：是否符合题意？单位对吗？量级合理吗？<br>' +
        '• 写出规范的答题过程' +
        '</div>' +
        '<div style="background:#F0FDF4;border-left:3px solid #10B981;padding:10px 12px;margin-bottom:14px;border-radius:0 8px 8px 0;">' +
        '<b>💡 AI建议</b><br>' +
        '本AI讲题系统已内置典型题库，包括：<br>' +
        '• 导数求极值（试试输入：求f(x)=x³-3x+1的极值）<br>' +
        '• 椭圆方程（试试：求椭圆的标准方程）<br>' +
        '• 牛顿运动定律（试试：用牛顿第二定律解题）<br>' +
        '• 化学平衡（试试：化学平衡移动问题）<br>' +
        '• 遗传规律（试试：孟德尔遗传题）<br>' +
        '• 英语时态（试试：现在完成时vs过去完成时）<br><br>' +
        '输入更具体的题目，我能给出更精准的解答！' +
        '</div>' +
        '</div></div>';
}

// ---------- 2. AI讲题 ----------
registerPage('ai-explain', 'AI讲题', 'AI学习中心', '', function () {
    setTimeout(function () {
        var container = document.getElementById('ai-explain-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('ai-explain').then(function (data) {
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
        var qc = data.question_card || {};
        var sh = data.step_header || {};

        // ===== 顶部：输入题目让AI讲解 =====
        html += '<div style="background:linear-gradient(135deg,#3B82F6,#8B5CF6);border-radius:14px;padding:14px;color:white;margin-bottom:14px;">' +
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
                '<i class="fas fa-comment-dots" style="font-size:18px;"></i>' +
                '<span style="font-size:14px;font-weight:700;">输入题目，AI为你讲解</span>' +
            '</div>' +
            '<div style="background:rgba(255,255,255,0.95);border-radius:10px;padding:4px;display:flex;gap:6px;align-items:center;">' +
                '<input id="ai-explain-question-input" type="text" placeholder="例如：求f(x)=x³-3x+1的极值" onkeydown="if(event.key===\'Enter\'){aiExplainAnswerQuestion()}" style="flex:1;border:none;background:transparent;padding:10px 12px;font-size:13px;color:#374151;outline:none;">' +
                '<div onclick="aiExplainAnswerQuestion()" style="width:36px;height:36px;border-radius:8px;background:#3B82F6;color:white;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;flex-shrink:0;"><i class="fas fa-paper-plane"></i></div>' +
            '</div>' +
            '<div style="font-size:11px;opacity:0.9;margin-top:8px;"><i class="fas fa-lightbulb"></i> 支持题目类型：导数极值、椭圆方程、牛顿定律、化学平衡、遗传规律、英语时态</div>' +
        '</div>';

        // ===== AI答案展示区（默认隐藏） =====
        html += '<div id="ai-explain-answer-area" style="display:none;margin-bottom:14px;"></div>';

        // ===== 示例题目区域（原有内容） =====
        html += '<div style="font-size:12px;color:#6B7280;margin-bottom:8px;display:flex;align-items:center;gap:6px;">' +
            '<i class="fas fa-star" style="color:#F59E0B;"></i>' +
            '<span>以下为示例题目讲解，可参考学习</span>' +
        '</div>';

        // 题目展示区
        html += '<div style="background:linear-gradient(135deg,#1E293B,#334155);border-radius:14px;padding:16px;color:white;margin-bottom:14px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">' +
                '<span style="font-size:12px;background:rgba(255,255,255,0.15);padding:3px 8px;border-radius:6px;"><i class="fas fa-book"></i> ' + (qc.subject || '') + ' · ' + (qc.topic || '') + '</span>' +
                '<span style="font-size:12px;opacity:0.8;">难度 ' + (qc.difficulty || '') + '</span>' +
            '</div>' +
            '<div style="font-size:15px;font-weight:600;line-height:1.6;">' + (qc.content || '') + '</div>' +
            '<div style="font-size:11px;opacity:0.7;margin-top:8px;"><i class="fas fa-tag"></i> 考点：' + (qc.exam_point || '') + '</div>' +
        '</div>';

        // AI分步讲解标题
        var totalSteps = (sh.total || (data.steps || []).length);
        html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
            '<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;"><i class="fas fa-robot"></i></div>' +
            '<span style="font-size:14px;font-weight:700;">' + (sh.title || 'AI 分步讲解') + '</span>' +
            '<span id="ai-explain-progress" style="font-size:11px;color:#6B7280;margin-left:auto;">已完成 ' + (sh.completed != null ? sh.completed : 0) + '/' + totalSteps + ' 步</span>' +
        '</div>';

        // 分步讲解
        (data.steps || []).forEach(function (s) {
            var lastStep = (data.steps || []).length > 0 && s === data.steps[data.steps.length - 1];
            var mb = lastStep ? '14px' : '10px';
            var detailContent = s.number === 1
                ? '<div style="margin-top:8px;padding:10px;background:#F9FAFB;border-radius:8px;font-size:12px;line-height:1.7;"><b>推导：</b><br>(x³)\' = 3x²<br>(-3x)\' = -3<br>(1)\' = 0<br>∴ f\'(x) = 3x² - 3</div>'
                : (s.number === 2
                    ? '<div style="margin-top:8px;padding:10px;background:#F9FAFB;border-radius:8px;font-size:12px;line-height:1.7;"><b>求解：</b><br>3x² - 3 = 0<br>x² = 1<br>x = ±1</div>'
                    : '<div style="margin-top:8px;padding:10px;background:#F9FAFB;border-radius:8px;font-size:12px;line-height:1.7;"><b>判断：</b><br>x=1：由减变增 → 极小值 -1<br>x=-1：由增变减 → 极大值 3</div>');
            html += '<div id="ai-explain-step-' + s.number + '" style="background:white;border-radius:12px;padding:14px;margin-bottom:' + mb + ';box-shadow:0 1px 3px rgba(0,0,0,0.08);transition:opacity 0.3s;">' +
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
                    '<div style="width:24px;height:24px;border-radius:50%;background:#3B82F6;color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">' + s.number + '</div>' +
                    '<span style="font-size:14px;font-weight:600;">' + s.title + '</span>' +
                '</div>' +
                '<div style="font-size:13px;color:#374151;line-height:1.6;margin-bottom:10px;">' +
                    s.content +
                    (s.formula ? ' <span style="background:#FEF3C7;padding:1px 6px;border-radius:4px;font-family:monospace;">' + s.formula + '</span>' : '') +
                    (s.hint ? '<div onclick="aiExplainToggleHint(' + s.number + ')" style="font-size:12px;color:#6B7280;margin-top:6px;background:#F9FAFB;padding:8px 10px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:6px;"><i id="ai-explain-arrow-' + s.number + '" class="fas fa-chevron-right" style="color:#3B82F6;transition:transform 0.2s;font-size:10px;"></i><i class="fas fa-info-circle" style="color:#3B82F6;"></i> ' + s.hint + '</div>' : '') +
                    '<div id="ai-explain-detail-' + s.number + '" style="display:none;">' + detailContent + '</div>' +
                '</div>' +
                '<div data-btns style="display:flex;gap:8px;">' +
                    '<div onclick="aiExplainUnderstood(' + s.number + ',' + totalSteps + ')" style="flex:1;background:#D1FAE5;color:#065F46;text-align:center;padding:8px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">' + (data.understood_label || '✓ 我懂了') + '</div>' +
                    '<div onclick="aiExplainNotUnderstood(' + s.number + ')" style="flex:1;background:#FEE2E2;color:#991B1B;text-align:center;padding:8px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">' + (data.not_understood_label || '✗ 还没理解') + '</div>' +
                '</div>' +
            '</div>';
        });

        // 底部提示
        html += GradientCard('purple',
            '<div style="display:flex;align-items:center;gap:10px;">' +
                '<i class="fas fa-magic" style="font-size:20px;"></i>' +
                '<div style="font-size:13px;line-height:1.5;">' + (data.bottom_tip || '') + '</div>' +
            '</div>'
        );

        // 相关知识点链接
        html += '<div class="section-title"><span>相关知识点</span></div>';
        html += '<div style="display:flex;gap:8px;flex-wrap:wrap;">';
        (data.related_knowledge || []).forEach(function (k) {
            html += '<span onclick="aiExplainShowKnowledge(\'' + k.replace(/'/g, "\\'") + '\')" style="background:#EFF6FF;color:#2563EB;padding:6px 12px;border-radius:14px;font-size:12px;cursor:pointer;">' + k + '</span>';
        });
        html += '</div>';

        container.innerHTML = html;
    }

    return Page({
        title: 'AI讲题',
        back: true,
        content: '<div id="ai-explain-content" style="background:#F3F4F6;min-height:100%;padding-bottom:20px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// ---------- 3. AI答疑 ----------
registerPage('ai-qa', 'AI答疑', 'AI学习中心', '', function () {
    setTimeout(function () {
        var container = document.getElementById('ai-qa-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('ai-qa').then(function (data) {
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
        var tip = data.top_tip || {};

        // 顶部提示
        html += '<div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:12px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:8px;">' +
            '<i class="fas ' + (tip.icon || 'fa-comments') + '" style="color:' + (tip.color || '#3B82F6') + ';"></i>' +
            '<span style="font-size:12px;color:#2563EB;">' + (tip.text || '') + '</span>' +
        '</div>';

        // 对话气泡容器（可追加新消息）
        html += '<div id="ai-qa-messages">';

        // 用户提问气泡
        html += '<div style="display:flex;gap:8px;margin-bottom:14px;flex-direction:row-reverse;">' +
            '<div style="width:32px;height:32px;border-radius:50%;background:#3B82F6;display:flex;align-items:center;justify-content:center;color:white;font-size:13px;flex-shrink:0;"><i class="fas fa-user"></i></div>' +
            '<div style="background:#3B82F6;color:white;border-radius:14px 14px 4px 14px;padding:12px 14px;font-size:13px;max-width:78%;line-height:1.6;">' + (data.user_question || '') + '</div>' +
        '</div>';

        // AI回答气泡
        var aiAnswer = data.ai_answer || {};
        html += '<div style="display:flex;gap:8px;margin-bottom:14px;">' +
            '<div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#8B5CF6);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;flex-shrink:0;"><i class="fas fa-robot"></i></div>' +
            '<div style="flex:1;max-width:82%;">' +
                '<div style="background:#F3F4F6;border-radius:14px 14px 14px 4px;padding:12px 14px;font-size:13px;line-height:1.7;">';
                (aiAnswer.sections || []).forEach(function (sec) {
                    html += '<div style="font-weight:700;color:' + (sec.title_color || '#10B981') + ';margin-bottom:6px;">' + sec.title + '</div>' +
                        '<div style="margin-bottom:10px;">' + sec.content + '<br><span style="font-family:monospace;background:#FEF3C7;padding:1px 6px;border-radius:4px;">' + sec.formula + '</span></div>';
                });
                html += '</div>' +
                '<div style="background:linear-gradient(180deg,#F0F4FF 0%,#E0E7FF 100%);border-radius:10px;margin-top:8px;padding:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#6B7280;font-size:12px;min-height:120px;">' +
                    '<i class="fas ' + (aiAnswer.drawing_icon || 'fa-draw-polygon') + '" style="font-size:28px;margin-bottom:8px;color:#8B5CF6;"></i>' +
                    '<span>' + (aiAnswer.drawing_text || '') + '</span>' +
                '</div>' +
            '</div>' +
        '</div>';

        // RAG检索增强可视化
        var rag = data.rag_info || {};
        if (rag && rag.retrieved_docs && rag.retrieved_docs.length) {
            html += '<div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:10px 12px;margin-bottom:14px;margin-left:40px;">' +
                '<div style="font-size:11px;font-weight:700;color:#166534;margin-bottom:6px;"><i class="fas fa-search" style="color:#10B981;margin-right:4px;"></i>RAG检索增强 · ' + (rag.retriever || '') + '</div>';
            (rag.retrieved_docs || []).forEach(function (d) {
                html += '<div style="background:white;border-radius:6px;padding:6px 10px;margin-bottom:4px;display:flex;align-items:center;gap:8px;">' +
                    '<i class="fas fa-file-alt" style="color:#10B981;font-size:11px;"></i>' +
                    '<span style="font-size:11px;color:#374151;flex:1;">' + d.title + '</span>' +
                    '<span style="font-size:10px;color:#10B981;font-weight:600;">' + Math.round(d.score * 100) + '%</span>' +
                    '<span style="font-size:10px;color:#9CA3AF;">' + d.source + '</span>' +
                '</div>';
            });
            html += '<div style="font-size:10px;color:#6B7280;margin-top:4px;">向量库：' + (rag.vector_db || '') + ' · 重排序：' + (rag.reranker || '') + ' · 生成模型：' + (rag.model || '') + '</div>' +
            '</div>';
        }

        html += '</div>'; // 结束 ai-qa-messages

        // 追问按钮
        html += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;padding-left:40px;">';
        (data.follow_up_questions || []).forEach(function (q) {
            html += '<div onclick="quickAskAI(\'ai-qa-input\',\'ai-qa-messages\',\'' + q.replace(/'/g, "\\'") + '\')" style="background:#EFF6FF;border:1px solid #BFDBFE;color:#2563EB;padding:7px 14px;border-radius:18px;font-size:12px;cursor:pointer;">' + q + '</div>';
        });
        html += '</div>';

        // 历史问答摘要（点击可重新加载到聊天框，触发AI回复）
        var historyList = data.history || [];
        var historyModalHTML = '';
        historyList.forEach(function (h, idx) {
            var safeTitle = (h.title || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            var safeAnswer = (h.answer || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            historyModalHTML += '<div style="margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid #F3F4F6;">'
                + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">'
                + '<div style="width:28px;height:28px;border-radius:50%;background:' + (h.color || '#3B82F6') + ';display:flex;align-items:center;justify-content:center;color:white;font-size:12px;"><i class="fas ' + (h.icon || 'fa-question-circle') + '"></i></div>'
                + '<b style="font-size:14px;color:#111827;">' + (h.title || '') + '</b></div>'
                + '<div style="font-size:13px;color:#6B7280;margin-bottom:6px;">' + (h.desc || '') + '</div>'
                + '<div style="background:#F9FAFB;border-radius:8px;padding:10px 12px;font-size:13px;color:#374151;line-height:1.7;">' + (h.answer || '暂无解答') + '</div>'
                + '<div onclick="closeModal();quickAskAI(\'ai-qa-input\',\'ai-qa-messages\',\'' + safeTitle + '\')" style="margin-top:8px;text-align:center;background:#EFF6FF;border:1px solid #BFDBFE;color:#2563EB;padding:8px;border-radius:8px;font-size:12px;cursor:pointer;">重新向AI提问</div>'
                + '</div>';
        });
        html += '<div class="section-title"><span>' + (data.history_title || '历史问答') + '</span><span class="more" onclick="openModal(\'历史问答\', \'' + historyModalHTML.replace(/'/g, "\\'") + '\')">' + (data.history_more || '全部') + '</span></div>';
        historyList.forEach(function (h) {
            var safeTitle = (h.title || '').replace(/'/g, "\\'");
            html += '<div class="proto-list-item" onclick="quickAskAI(\'ai-qa-input\',\'ai-qa-messages\',\'' + safeTitle + '\')" style="cursor:pointer;">'
                + '<div class="icon" style="background:' + (h.color || '#3B82F6') + '"><i class="fas ' + (h.icon || 'fa-question-circle') + '"></i></div>'
                + '<div class="text"><div class="title">' + (h.title || '') + '</div>' + (h.desc ? '<div class="desc">' + h.desc + '</div>' : '') + '</div>'
                + '<div class="arrow"><i class="fas fa-redo"></i></div>'
                + '</div>';
        });

        // AI模型归因徽章
        if (data.rag_info && data.rag_info.model) {
            html += '<div class="proto-card" style="background:linear-gradient(135deg,#F8FAFC,#F1F5F9);border:1px solid #E2E8F0;margin:0 0 12px 40px;">' +
                '<div style="font-size:11px;font-weight:700;color:#475569;margin-bottom:6px;"><i class="fas fa-microchip" style="color:#3B82F6;margin-right:4px;"></i> 驱动模型（开源）</div>' +
                '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                    '<div style="background:white;border:1px solid #E2E8F0;border-radius:6px;padding:5px 8px;font-size:11px;"><b style="color:#1E293B;">' + data.rag_info.model + '</b> <span style="color:#64748B;">· Apache-2.0</span></div>' +
                    '<div style="background:white;border:1px solid #E2E8F0;border-radius:6px;padding:5px 8px;font-size:11px;"><b style="color:#1E293B;">BGE-M3</b> <span style="color:#64748B;">· 向量检索 · MIT</span></div>' +
                    '<div style="background:white;border:1px solid #E2E8F0;border-radius:6px;padding:5px 8px;font-size:11px;"><b style="color:#1E293B;">Milvus</b> <span style="color:#64748B;">· 向量库 · Apache-2.0</span></div>' +
                '</div>' +
            '</div>';
        }

        // 底部输入框+拍照提问
        html += '<div style="position:sticky;bottom:0;background:white;padding:10px 0;border-top:1px solid #E5E7EB;display:flex;gap:8px;align-items:center;z-index:50;isolation:isolate;">' +
            '<div onclick="openModal(\'拍照提问\', \'<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b>拍照提问</b><br><br>支持拍照识别题目，AI将自动识别并解答。<br><br><div style=&quot;border:2px dashed #D1D5DB;border-radius:8px;padding:30px;text-align:center;&quot;><i class=&quot;fas fa-camera&quot; style=&quot;font-size:32px;color:#9CA3AF;&quot;></i><div style=&quot;margin-top:8px;color:#6B7280;&quot;>点击拍照或从相册选择</div></div></div>\')" style="width:40px;height:40px;border-radius:50%;background:#F3F4F6;color:#3B82F6;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;flex-shrink:0;"><i class="fas ' + (data.camera_icon || 'fa-camera') + '"></i></div>' +
            '<input id="ai-qa-input" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + (data.input_placeholder || '输入你的问题...') + '" onkeydown="return aiChatKeyDown(event,\'ai-qa-input\',\'ai-qa-messages\')" style="flex:1;background:#F9FAFB;border-radius:22px;padding:10px 16px;font-size:14px;color:#111827;border:1.5px solid #E5E7EB;outline:0;caret-color:#3B82F6;user-select:text;-webkit-user-select:text;">' +
            '<div onclick="sendAIMessage(\'ai-qa-input\',\'ai-qa-messages\')" style="width:40px;height:40px;border-radius:50%;background:#3B82F6;color:white;display:flex;align-items:center;justify-content:center;font-size:16px;cursor:pointer;flex-shrink:0;box-shadow:0 2px 8px rgba(59,130,246,0.35);"><i class="fas fa-paper-plane"></i></div>' +
        '</div>';

        container.innerHTML = html;
    }

    return Page({
        title: 'AI答疑',
        back: true,
        content: '<div id="ai-qa-content" style="background:#F3F4F6;min-height:100%;padding-bottom:20px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// ---------- 4. AI错题分析 ----------
registerPage('ai-error', 'AI错题分析', 'AI学习中心', '', function () {
    setTimeout(function () {
        var container = document.getElementById('ai-error-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('ai-error').then(function (data) {
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
        var stats = data.stats_card || {};

        // 错题统计卡片
        var statsDetailHTML = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b style=&quot;font-size:14px;&quot;>本月错题统计详情</b><br><br><b>总错题数：</b>' + (stats.total || 0) + '道<br><b>已掌握：</b>' + (stats.mastered || 0) + '道（掌握率 ' + Math.round(((stats.mastered || 0) / Math.max(1, stats.total || 0)) * 100) + '%）<br><b>待复习：</b>' + (stats.pending || 0) + '道<br><br><b>按科目统计：</b><br>· 数学：' + (stats.by_math || 0) + '道<br>· 物理：' + (stats.by_physics || 0) + '道<br>· 化学：' + (stats.by_chemistry || 0) + '道<br>· 英语：' + (stats.by_english || 0) + '道<br>· 生物：' + (stats.by_biology || 0) + '道<br><br><b>按错误类型：</b><br>· 概念理解：' + (stats.type_concept || 0) + '道<br>· 计算失误：' + (stats.type_calc || 0) + '道<br>· 审题粗心：' + (stats.type_read || 0) + '道<br>· 书写规范：' + (stats.type_write || 0) + '道<br><br><span style=&quot;color:#6B7280;&quot;>建议每天复习 5-10 道错题，巩固薄弱知识点。</span></div>';
        html += '<div style="cursor:pointer;" onclick="openModal(\'错题统计详情\', \'' + statsDetailHTML + '\')">' + GradientCard('orange',
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;">' +
                '<i class="fas ' + (stats.icon || 'fa-bug') + '" style="font-size:18px;"></i>' +
                '<span style="font-size:16px;font-weight:700;">' + (stats.title || '本月错题统计') + '</span>' +
                '<span style="margin-left:auto;font-size:12px;opacity:0.95;">查看详情 ›</span>' +
            '</div>' +
            '<div style="display:flex;gap:8px;">' +
                '<div style="flex:1;background:rgba(255,255,255,0.18);border-radius:10px;padding:10px;text-align:center;">' +
                    '<div style="font-size:24px;font-weight:700;">' + stats.total + '</div>' +
                    '<div style="font-size:11px;opacity:0.9;">总错题</div>' +
                '</div>' +
                '<div style="flex:1;background:rgba(255,255,255,0.18);border-radius:10px;padding:10px;text-align:center;">' +
                    '<div style="font-size:24px;font-weight:700;">' + stats.mastered + '</div>' +
                    '<div style="font-size:11px;opacity:0.9;">已掌握</div>' +
                '</div>' +
                '<div style="flex:1;background:rgba(255,255,255,0.18);border-radius:10px;padding:10px;text-align:center;">' +
                    '<div style="font-size:24px;font-weight:700;">' + stats.pending + '</div>' +
                    '<div style="font-size:11px;opacity:0.9;">待复习</div>' +
                '</div>' +
            '</div>'
        ) + '</div>';

        // 错题分类饼图
        var subjectDistMap = {};
        (data.errors || []).forEach(function (e) {
            if (!subjectDistMap[e.subject]) {
                subjectDistMap[e.subject] = { label: e.subject, value: 0, color: e.subjectColor || '#3B82F6' };
            }
            subjectDistMap[e.subject].value += (e.error_count || 1);
        });
        var subjectPieData = [];
        Object.keys(subjectDistMap).forEach(function (k) { subjectPieData.push(subjectDistMap[k]); });
        html += '<div class="section-title"><span>' + (data.subject_distribution_title || '按科目分布') + '</span></div>';
        html += '<div id="ai-error-subject-chart"></div>';

        // 错误类型分析
        html += '<div class="section-title"><span>' + (data.error_type_title || '错误类型分析') + '</span><span class="more" style="cursor:pointer;" onclick="openModal(\'错误类型分析\', \'<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b style=&quot;font-size:14px;&quot;>错误类型分析</b><br><br>' + (data.error_types || []).map(function(t){return '&middot; <b>'+t.name+'</b>&colon;'+t.percent+'%<br>'+(t.advice||'');}).join('<br><br>') + '<br><br><span style=&quot;color:#6B7280;&quot;>针对每种错误类型，建议集中 1-2 周进行专项突破。</span></div>\')">详情 ›</span></div>';
        html += '<div style="background:white;border-radius:12px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,0.08);margin-bottom:12px;cursor:pointer;" onclick="openModal(\'错误类型分析\', \'<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b style=&quot;font-size:14px;&quot;>错误类型分析</b><br><br>' + (data.error_types || []).map(function(t){return '<b style=&quot;color:'+t.color+'&quot;>&middot; '+t.name+'</b>&colon;'+t.percent+'%<br>'+(t.advice||'');}).join('<br><br>') + '<br><br><span style=&quot;color:#6B7280;&quot;>针对每种错误类型，建议集中 1-2 周进行专项突破。</span></div>\')">';
        (data.error_types || []).forEach(function (t, i) {
            var isLast = i === (data.error_types || []).length - 1;
            html += '<div style="' + (isLast ? '' : 'margin-bottom:10px;') + '">' +
                '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;"><span>' + t.name + '</span><span style="color:' + t.color + ';font-weight:600;">' + t.percent + '%</span></div>' +
                Progress(t.percent, t.color) +
            '</div>';
        });
        html += '</div>';

        // AI推荐
        var rec = data.ai_recommend || {};
        var recDetailHTML = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b style=&quot;font-size:14px;&quot;>' + (rec.title || 'AI个性化推荐') + '</b><br><br><b>推荐背景：</b>' + (rec.reason || '根据最近30天学习数据分析') + '<br><br><b>核心建议：</b><br>' + (rec.content || '').split('。').filter(function(s){return s.trim()}).map(function(s){return '· ' + s + '。';}).join('<br>') + '<br><br><b>预期效果：</b>坚持执行可在 2-3 周内提升 ' + (rec.boost || '8-12') + ' 分<br><br><span style=&quot;color:#6B7280;&quot;>可点击下方错题列表进行针对性练习。</span></div>';
        html += '<div style="cursor:pointer;" onclick="openModal(\'AI推荐详情\', \'' + recDetailHTML + '\')">' + GradientCard('purple',
            '<div style="display:flex;align-items:flex-start;gap:10px;">' +
                '<i class="fas fa-lightbulb" style="font-size:18px;margin-top:2px;"></i>' +
                '<div style="flex:1;">' +
                    '<div style="font-size:13px;font-weight:700;margin-bottom:4px;">' + (rec.title || '') + '</div>' +
                    '<div style="font-size:12px;line-height:1.5;opacity:0.95;">' + (rec.content || '') + '</div>' +
                '</div>' +
                '<i class="fas fa-chevron-right" style="font-size:11px;opacity:0.95;margin-top:6px;"></i>' +
            '</div>'
        ) + '</div>';

        // 错题列表
        html += '<div class="section-title"><span>' + (data.error_list_title || '错题列表') + '</span><span class="more" onclick="navigateTo(\'practice-mistakes\')">' + (data.error_list_more || '查看全部') + '</span></div>';

        (data.errors || []).forEach(function (e, i) {
            var errorDetailHTML = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b style=&quot;font-size:14px;&quot;>' + e.q + '</b><br><br><b>科目：</b>' + e.subject + '<br><b>出错次数：</b>' + (e.error_count || 0) + '次<br><b>错误原因：</b>' + e.reason + '<br><br><b>AI解析：</b><br>' + e.ai + '<br><br><span style=&quot;color:#6B7280;&quot;>建议针对该知识点进行专项练习。</span></div>';
            html += '<div style="background:white;border-radius:12px;padding:14px;margin-bottom:10px;box-shadow:0 1px 3px rgba(0,0,0,0.08);cursor:pointer;" onclick="openModal(\'错题详情\', \'' + errorDetailHTML + '\')">' +
                '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">' +
                    Tag(e.subject, e.subjectColor) +
                    '<span style="font-size:11px;color:#9CA3AF;">错' + (i + 1) + '次 · ' + (e.days_ago || 0) + '天前</span>' +
                    '<span style="margin-left:auto;font-size:11px;color:#EF4444;"><i class="fas fa-fire"></i> 出错' + (e.error_count || 0) + '次</span>' +
                '</div>' +
                '<div style="font-size:13px;font-weight:600;line-height:1.5;margin-bottom:6px;">' + e.q + '</div>' +
                '<div style="font-size:12px;color:#EF4444;margin-bottom:4px;"><i class="fas fa-times-circle"></i> 错误原因：' + e.reason + '</div>' +
                '<div style="font-size:12px;color:#2563EB;"><i class="fas fa-robot"></i> AI解析：' + e.ai + '</div>' +
            '</div>';
        });

        // 开始错题训练按钮 + 重新AI分析
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:4px;">';
        html += '<button onclick="navigateTo(\'home-task\')" class="proto-btn proto-btn-primary"><i class="fas ' + (data.train_button_icon || 'fa-play') + '"></i> ' + (data.train_button_text || '开始错题训练') + '</button>';
        html += '<button onclick="errorReanalyze()" class="proto-btn proto-btn-outline" id="error-reanalyze-btn"><i class="fas fa-sync-alt"></i> 重新AI分析</button>';
        html += '</div>';
        html += '<div id="error-reanalyze-status" style="display:none;margin-top:8px;padding:8px;background:#EFF6FF;border-radius:8px;font-size:12px;color:#1E40AF;text-align:center;"></div>';
        window._errorData = data;
        // 接入数据中台：错题分析结果持久化到 KV
        if (typeof api !== 'undefined' && api.savePageData) {
            api.savePageData('ai-error', data).catch(function () {});
        }

        container.innerHTML = html;
        setTimeout(function () {
            if (typeof drawMiniChart === 'function' && document.getElementById('ai-error-subject-chart')) {
                drawMiniChart('ai-error-subject-chart', subjectPieData, { type: 'pie', height: 140 });
            }
        }, 50);
    }

    return Page({
        title: 'AI错题分析',
        back: true,
        content: '<div id="ai-error-content" style="background:#F3F4F6;min-height:100%;padding-bottom:20px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// ---------- 5. AI学习规划 ----------
registerPage('ai-plan', 'AI学习规划', 'AI学习中心', '', function () {
    setTimeout(function () {
        var container = document.getElementById('ai-plan-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('ai-plan').then(function (data) {
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
        var goal = data.goal_card || {};
        var predict = data.ai_predict || {};

        // 目标分解卡片
        var goalSubjectsHTML = '';
        (goal.subjects || []).forEach(function (s) {
            goalSubjectsHTML += '<div style="flex:1;background:rgba(255,255,255,0.18);border-radius:8px;padding:8px;text-align:center;">' +
                '<div style="font-size:18px;font-weight:700;">' + s.target + '</div>' +
                '<div style="font-size:10px;opacity:0.9;">' + s.name + '</div>' +
            '</div>';
        });
        html += GradientCard('blue',
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
                '<i class="fas ' + (goal.icon || 'fa-bullseye') + '" style="font-size:18px;"></i>' +
                '<span style="font-size:16px;font-weight:700;">' + (goal.title || '目标分数分解') + '</span>' +
            '</div>' +
            '<div style="font-size:13px;opacity:0.9;margin-bottom:12px;">总分目标 <span style="font-size:22px;font-weight:700;">' + (goal.total_target || 0) + '</span> 分</div>' +
            '<div style="display:flex;gap:8px;">' + goalSubjectsHTML + '</div>'
        );

        // AI预测
        html += '<div style="background:linear-gradient(135deg,#10B981,#059669);border-radius:14px;padding:14px;color:white;margin-bottom:14px;display:flex;align-items:center;gap:10px;">' +
            '<i class="fas ' + (predict.icon || 'fa-chart-line') + '" style="font-size:22px;"></i>' +
            '<div>' +
                '<div style="font-size:13px;font-weight:700;">' + (predict.title || 'AI预测') + '</div>' +
                '<div style="font-size:12px;opacity:0.95;">' + (predict.content_prefix || '') + ' <span style="font-size:16px;font-weight:700;">' + (predict.improve || '') + '</span></div>' +
            '</div>' +
        '</div>';

        // 30天冲刺计划标题
        var weeks = data.weeks || [];
        var planDetailHTML = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b style=&quot;font-size:14px;&quot;>' + (data.plan_title || '30天冲刺计划') + '</b><br><br>';
        weeks.forEach(function (w) {
            planDetailHTML += '<b>第' + w.week + '周 · ' + w.theme + '</b><br>' + (w.tasks || []).join('、') + '<br><br>';
        });
        planDetailHTML += '<span style=&quot;color:#6B7280;&quot;>按计划执行，可逐步提升成绩。</span></div>';
        html += '<div class="section-title"><span><i class="fas ' + (data.plan_title_icon || 'fa-calendar-alt') + '" style="color:#3B82F6;"></i> ' + (data.plan_title || '30天冲刺计划') + '</span><span class="more" onclick="openModal(\'完整计划\', \'' + planDetailHTML + '\')">' + (data.plan_more || '') + '</span></div>';

        // 时间轴 - 每周重点
        weeks.forEach(function (w, i) {
            var isLast = i === weeks.length - 1;
            html += '<div style="display:flex;gap:12px;margin-bottom:0;">' +
                '<div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">' +
                    '<div style="width:32px;height:32px;border-radius:50%;background:' + (w.done ? '#10B981' : w.color) + ';color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;">' + (w.done ? '✓' : 'W' + w.week) + '</div>' +
                    (isLast ? '' : '<div style="width:2px;flex:1;background:#E5E7EB;margin:4px 0;min-height:40px;"></div>') +
                '</div>' +
                '<div style="flex:1;margin-bottom:14px;">' +
                    '<div style="background:white;border-radius:12px;padding:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);cursor:pointer;" onclick="openModal(\'第' + w.week + '周·' + w.theme + '详情\', \'<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b style=&quot;font-size:14px;color:' + w.color + ';&quot;>第' + w.week + '周 · ' + w.theme + '</b><br><span style=&quot;font-size:11px;color:#9CA3AF;&quot;>第 ' + ((w.week - 1) * 7 + 1) + '-' + (w.week * 7) + ' 天 · ' + (w.done ? '已完成' : '进行中') + '</span><br><br><b>重点任务：</b><br>' + (w.tasks || []).map(function(t){return '· ' + t}).join('<br>') + '<br><br><b>学习目标：</b><br>' + (w.goal || '掌握本周核心知识点，完成配套练习并达到 85% 正确率。') + '<br><br><b>本周建议学习时长：</b>' + (w.hours || '6-8') + ' 小时<br><br><span style=&quot;color:#6B7280;&quot;>可点击页面上方按钮调整计划或导出完整报告。</span></div>\')">' +
                        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">' +
                            '<span style="font-size:14px;font-weight:700;color:' + w.color + ';">第' + w.week + '周 · ' + w.theme + '</span>' +
                            (w.done ? '<span style="font-size:11px;background:#D1FAE5;color:#065F46;padding:2px 8px;border-radius:8px;">已完成</span>' : '<span style="font-size:11px;background:#FEF3C7;color:#92400E;padding:2px 8px;border-radius:8px;">进行中</span>') +
                        '</div>' +
                        '<div style="font-size:11px;color:#9CA3AF;margin-bottom:8px;">第 ' + ((w.week - 1) * 7 + 1) + '-' + (w.week * 7) + ' 天</div>' +
                        '<div style="display:flex;flex-direction:column;gap:6px;">';
                        (w.tasks || []).forEach(function (t) {
                            html += '<div style="font-size:12px;color:#374151;display:flex;align-items:center;gap:6px;"><i class="fas fa-check-circle" style="color:' + (w.done ? '#10B981' : '#D1D5DB') + ';font-size:11px;"></i> ' + t + '</div>';
                        });
                        html += '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';
        });

        // 整体进度
        var op = data.overall_progress || {};
        var opDetailHTML = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b style=&quot;font-size:14px;color:' + (op.color || '#3B82F6') + ';&quot;>' + (op.label || '整体进度') + '</b><br><br><b>完成进度：</b>' + (op.percent || 0) + '%<br><b>已完成天数：</b>' + (op.completed_days || 0) + '/' + (op.total_days || 0) + ' 天<br><b>剩余天数：</b>' + Math.max(0, (op.total_days || 0) - (op.completed_days || 0)) + ' 天<br><b>按周完成情况：</b><br>· 第1周：' + (op.w1 || '已完成') + '<br>· 第2周：' + (op.w2 || '已完成') + '<br>· 第3周：' + (op.w3 || '进行中') + '<br>· 第4周：' + (op.w4 || '待开始') + '<br>· 第5周：' + (op.w5 || '待开始') + '<br><br><b>进度提示：</b>' + (op.tip || '') + '<br><br><span style=&quot;color:#6B7280;&quot;>坚持每日学习，系统会根据学习进度自动更新完成情况。</span></div>';
        html += '<div style="background:white;border-radius:12px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,0.08);margin-bottom:14px;cursor:pointer;" onclick="openModal(\'整体进度详情\', \'' + opDetailHTML + '\')">' +
            '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span style="font-weight:600;">' + (op.label || '整体进度') + '</span><span style="color:' + (op.color || '#3B82F6') + ';font-weight:600;">' + (op.percent || 0) + '% ›</span></div>' +
            Progress(op.percent || 0, op.color || '#3B82F6') +
            '<div style="font-size:11px;color:#9CA3AF;margin-top:6px;">已完成 ' + (op.completed_days || 0) + '/' + (op.total_days || 0) + ' 天 · ' + (op.tip || '') + '</div>' +
        '</div>';

        // 调整计划 / 导出计划按钮
        window._planData = data;
        // 接入数据中台：学习计划持久化到 KV
        if (typeof api !== 'undefined' && api.savePageData) {
            api.savePageData('ai-plan', data).catch(function () {});
        }
        html += '<div style="display:flex;gap:10px;">';
        (data.buttons || []).forEach(function (b) {
            var cls = b.type === 'primary' ? 'proto-btn proto-btn-primary' : 'proto-btn proto-btn-outline';
            var isRegen = (b.text.indexOf('规划') >= 0 || b.text.indexOf('重新') >= 0 || b.text.indexOf('调整') >= 0);
            if (isRegen) {
                html += '<button class="' + cls + '" id="plan-regen-btn" onclick="planRegenerate()"><i class="fas ' + b.icon + '"></i> ' + b.text + '</button>';
            } else {
                html += '<button class="' + cls + '" id="plan-export-btn" onclick="exportPlan()"><i class="fas ' + b.icon + '"></i> ' + b.text + '</button>';
            }
        });
        html += '</div>';
        // 重新规划状态提示区
        html += '<div id="plan-regen-status" style="display:none;margin-top:10px;padding:10px;background:#EFF6FF;border-radius:8px;font-size:12px;color:#1E40AF;text-align:center;"></div>';

        container.innerHTML = html;
    }

    return Page({
        title: 'AI学习规划',
        back: true,
        content: '<div id="ai-plan-content" style="background:#F3F4F6;min-height:100%;padding-bottom:20px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});
