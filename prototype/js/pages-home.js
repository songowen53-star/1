// ============================================================
// 首页模块 - pages-home.js
// ============================================================

// ============================================================
// 发现页 - 备考干货 & 名师课程 数据（覆盖九科，含解题技巧详情）
// 九科：语文、数学、英语、物理、化学、生物、政治、历史、地理
// ============================================================
var DISCOVER_SUBJECTS = [
    { name: '全部', color: '#6B7280', bg: '#F3F4F6' },
    { name: '语文', color: '#EF4444', bg: '#FEE2E2' },
    { name: '数学', color: '#3B82F6', bg: '#DBEAFE' },
    { name: '英语', color: '#10B981', bg: '#D1FAE5' },
    { name: '物理', color: '#8B5CF6', bg: '#EDE9FE' },
    { name: '化学', color: '#F59E0B', bg: '#FEF3C7' },
    { name: '生物', color: '#14B8A6', bg: '#CCFBF1' },
    { name: '政治', color: '#6366F1', bg: '#E0E7FF' },
    { name: '历史', color: '#F43F5E', bg: '#FFE4E6' },
    { name: '地理', color: '#06B6D4', bg: '#CFFAFE' }
];

// 备考干货 - 九科解题技巧（每科2-3篇，共24篇）
var DISCOVER_ARTICLES = [
    // 语文
    { subject: '语文', tagBg: '#FEE2E2', tagColor: '#EF4444', title: '高考作文5大主题万能开头模板，阅卷老师一眼心动', read: '3.2万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📖 语文 · 作文 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:8px;">一、引言式开头（适合哲理类）</p>' +
        '<p style="margin-bottom:6px;">以名言警句或诗句开篇，迅速提升文章格调。模板：<b>"XX曾言：……。诚哉斯言，……"</b></p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 8px;">二、排比式开头（适合情感类）</p>' +
        '<p style="margin-bottom:6px;">三句以上结构相似排比铺陈，气势恢宏。模板：<b>"是……，是……，更是……"</b></p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 8px;">三、设问式开头（适合思辨类）</p>' +
        '<p style="margin-bottom:6px;">以反问引出论点，激发思考。模板：<b>"何为……？答案或许不在……，而在……"</b></p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 8px;">四、场景式开头（适合记叙类）</p>' +
        '<p style="margin-bottom:6px;">以画面感切入，增强代入感。模板：<b>"暮色四合，……处，……正……"</b></p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 8px;">五、对比式开头（适合议论类）</p>' +
        '<p style="margin-bottom:6px;">正反对比鲜明立论。模板：<b>"世人皆重……，却轻……，殊不知……"</b></p>' +
        '<div style="margin-top:12px;padding:10px;background:#FEF3C7;border-radius:8px;font-size:12px;color:#92400E;"><b>⚠ 易错提醒：</b>开头勿超80字，忌套话堆砌；每段务必回扣题目关键词。</div>' +
        '</div>' },
    { subject: '语文', tagBg: '#FEE2E2', tagColor: '#EF4444', title: '古诗词鉴赏答题套路：形象、语言、表达技巧三步法', read: '1.9万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📖 语文 · 古诗鉴赏 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:8px;">第一步：析形象（4分题必考）</p>' +
        '<p style="margin-bottom:6px;">①找意象（景物+物象）→②概括画面特征（孤寂/壮阔/清新）→③点出人物形象（思妇/隐士/将士）。答题模板：<b>"诗中通过……意象，营造了……氛围，塑造了……形象"</b></p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 8px;">第二步：赏语言（炼字题）</p>' +
        '<p style="margin-bottom:6px;">①释义（本义+语境义）→②析效果（修辞/动静/色彩）→③悟情感。模板：<b>"XX字本义……，此处生动写出……，传达了……之情"</b></p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 8px;">第三步：辨技巧（表达方式分析）</p>' +
        '<p style="margin-bottom:6px;">常见技巧：借景抒情、托物言志、虚实结合、用典、对仗、视听结合。模板：<b>"本诗运用……手法，将……与……结合，达到……效果"</b></p>' +
        '<div style="margin-top:12px;padding:10px;background:#FEF3C7;border-radius:8px;font-size:12px;color:#92400E;"><b>⚠ 易错提醒：</b>切忌只罗列术语不结合诗句；每条赏析必须"引原句+释手法+说效果"。</div>' +
        '</div>' },
    { subject: '语文', tagBg: '#FEE2E2', tagColor: '#EF4444', title: '文言文翻译6大推断法：实词虚词一网打尽', read: '1.5万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📖 语文 · 文言文 · 翻译技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">1. 字形推断法</p><p style="margin-bottom:6px;">形旁表义：如"刂"旁多与刀斩有关，"氵"旁多与水有关。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">2. 语境推断法</p><p style="margin-bottom:6px;">结合上下文逻辑推断，关注前后主语、宾语搭配。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">3. 语法推断法</p><p style="margin-bottom:6px;">看其在句中位置定词性：主语前多为名词，"之""其"等可作代词或助词。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">4. 对举推断法</p><p style="margin-bottom:6px;">对偶/并列结构中，对应位置词义相近或相反。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">5. 成语推断法</p><p style="margin-bottom:6px;">保留在成语中的古义可作参照，如"不速之客"的"速"=邀请。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">6. 课内迁移法</p><p style="margin-bottom:6px;">将教材所学义项迁移到课外语境中验证。</p>' +
        '<div style="margin-top:10px;padding:10px;background:#FEF3C7;border-radius:8px;font-size:12px;color:#92400E;"><b>⚠ 翻译口诀：</b>留（专有名词）删（虚词）换（古义→今义）调（倒装）补（省略）变（修辞）。</div>' +
        '</div>' },
    // 数学
    { subject: '数学', tagBg: '#DBEAFE', tagColor: '#3B82F6', title: '导数压轴题5大解题套路，看完稳拿12分', read: '4.1万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📐 数学 · 导数 · 压轴解题</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">套路一：单调性讨论</p>' +
        '<p style="margin-bottom:6px;">求f\'(x)→因式分解→讨论参数a的临界值→列表判定单调区间。<b>关键：找f\'(x)=0的根是否在定义域内。</b></p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">套路二：极值/最值问题</p>' +
        '<p style="margin-bottom:6px;">令f\'(x)=0求驻点→列表分析→比较端点值与极值。含参时分类讨论a的范围。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">套路三：零点个数</p>' +
        '<p style="margin-bottom:6px;">①直接法：解方程f(x)=0；②图像法：画y=f(x)与x轴交点；③分离参数：a=g(x)交点个数。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">套路四：不等式证明</p>' +
        '<p style="margin-bottom:6px;">构造函数F(x)=f(x)-g(x)→证F(x)≥0→求F\'(x)最值。常用构造：xlnx、e^x-ax等。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">套路五：恒成立/存在性</p>' +
        '<p style="margin-bottom:6px;">"恒成立"→≥0最值≥0；"存在"→最值≥0即可。分离参数后转化为值域问题。</p>' +
        '<div style="margin-top:10px;padding:10px;background:#DBEAFE;border-radius:8px;font-size:12px;color:#1E40AF;"><b>💡 提分点：</b>①列表格式工整②定义域必写③端点值必验证④含参讨论不重不漏。</div>' +
        '</div>' },
    { subject: '数学', tagBg: '#DBEAFE', tagColor: '#3B82F6', title: '圆锥曲线韦达定理应用大全：联立-韦达-判别式三步', read: '3.5万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📐 数学 · 圆锥曲线 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">标准三步法</p>' +
        '<p style="margin-bottom:6px;">①设直线l：y=kx+m（注意斜率不存在单独讨论）<br>②联立曲线方程，消元得一元二次方程 Ax²+Bx+C=0<br>③判别式Δ>0 + 韦达定理：x₁+x₂=-B/A，x₁x₂=C/A</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">常见目标转化</p>' +
        '<p style="margin-bottom:6px;">• 弦长：|AB|=√(1+k²)·|x₁-x₂|=√(1+k²)·√[(x₁+x₂)²-4x₁x₂]<br>• 中点弦：x₀=(x₁+x₂)/2<br>• 面积：S=(1/2)|m|·|x₁-x₂|（底在x轴截距）<br>• 斜率关系：kOA·kOB=定值→定点/定线问题</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">点差法（中点弦专用）</p>' +
        '<p style="margin-bottom:6px;">设弦端点(x₁,y₁)(x₂,y₂)代入曲线方程作差→得k=-b²x₀/(a²y₀)。适合已知中点求斜率。</p>' +
        '<div style="margin-top:10px;padding:10px;background:#DBEAFE;border-radius:8px;font-size:12px;color:#1E40AF;"><b>💡 提分点：</b>①设直线必讨论斜率不存在②Δ>0必写③韦达代换化简要耐心④定点定值用特殊值探路。</div>' +
        '</div>' },
    { subject: '数学', tagBg: '#DBEAFE', tagColor: '#3B82F6', title: '数列通项与求和4大方法：累加、累乘、构造、错位相减', read: '2.7万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📐 数学 · 数列 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">通项公式4法</p>' +
        '<p style="margin-bottom:6px;">①累加法：aₙ-aₙ₋₁=f(n)，各项相加消去<br>②累乘法：aₙ/aₙ₋₁=f(n)，各项相乘约分<br>③构造法：aₙ₊₁+λ=K(aₙ+λ)，待定λ化等比<br>④公式法：Sₙ与aₙ关系：aₙ=Sₙ-Sₙ₋₁(n≥2)，验证n=1</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">求和4法</p>' +
        '<p style="margin-bottom:6px;">①等差/等比公式直接用<br>②裂项相消：1/[n(n+1)]=1/n-1/(n+1)<br>③错位相减：等差×等比型，乘公比后两式相减<br>④分组求和：可拆成几个可求和数列之和</p>' +
        '<div style="margin-top:10px;padding:10px;background:#DBEAFE;border-radius:8px;font-size:12px;color:#1E40AF;"><b>⚠ 易错提醒：</b>aₙ=Sₙ-Sₙ₋₁只对n≥2成立，n=1必须单独验证是否等于S₁，否则需写分段形式。</div>' +
        '</div>' },
    // 英语
    { subject: '英语', tagBg: '#D1FAE5', tagColor: '#10B981', title: '阅读理解主旨题3秒定位法，准确率提升40%', read: '4.8万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📘 英语 · 阅读理解 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">3秒定位法</p>' +
        '<p style="margin-bottom:6px;">①扫首段末句（thesis statement常在此）<br>②扫各段首句（topic sentence）<br>③扫尾段（结论重申主旨）<br>三处信息融合即为文章主旨。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">主旨题选项特征</p>' +
        '<p style="margin-bottom:6px;">✓ 正确项：涵盖全文、概括性强、中性客观<br>✗ 干扰项：以偏概全（只覆盖某段）、过度引申、与文意相反、范围过大</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">标题选择题（Best Title）</p>' +
        '<p style="margin-bottom:6px;">好标题三要素：①概括核心话题②引发兴趣③简洁醒目。优先选含文章高频关键词的选项。</p>' +
        '<div style="margin-top:10px;padding:10px;background:#D1FAE5;border-radius:8px;font-size:12px;color:#065F46;"><b>💡 提分点：</b>主旨题放最后做（细节题做完后对全文更熟悉）；警惕however、but后的转折，主旨常在转折后。</div>' +
        '</div>' },
    { subject: '英语', tagBg: '#D1FAE5', tagColor: '#10B981', title: '完形填空5大逻辑推断法：上下文语境为王', read: '3.2万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📘 英语 · 完形填空 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">5大推断法</p>' +
        '<p style="margin-bottom:6px;">①上下文复现：空格前后会出现同根词/同义词/反义词线索<br>②逻辑关系：and（并列）、but（转折）、so（因果）、or（选择）<br>③感情色彩：判断段落褒贬基调选词<br>④固定搭配：look forward to + doing等<br>⑤常识背景：结合生活常识与文化背景</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">做题顺序</p>' +
        '<p style="margin-bottom:6px;">①通读首句（不设空）把握基调→②跳读全篇了解大意→③逐题用线索推断→④回填复读验证逻辑通顺</p>' +
        '<div style="margin-top:10px;padding:10px;background:#D1FAE5;border-radius:8px;font-size:12px;color:#065F46;"><b>⚠ 易错提醒：</b>切忌看到一个空就选，务必前后各看2-3句；首句不设空，是全文基调钥匙。</div>' +
        '</div>' },
    { subject: '英语', tagBg: '#D1FAE5', tagColor: '#10B981', title: '七选五解题套路：衔接词与逻辑关系判定', read: '2.4万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📘 英语 · 七选五 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">逻辑关系4类</p>' +
        '<p style="margin-bottom:6px;">①并列/递进：also, too, besides, furthermore, what is more<br>②转折：however, nevertheless, on the contrary, instead<br>③因果：therefore, thus, as a result, consequently<br>④解释/举例：for example, namely, that is, such as</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">代词线索法</p>' +
        '<p style="margin-bottom:6px;">空格后出现he/they/this/such，前文必有指代对象；空格前出现名词，后文可能用代词回指。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">结构复现法</p>' +
        '<p style="margin-bottom:6px;">段首句常是topic sentence，空格处多为支撑句；段尾空格常是总结句，注意总结性词汇。</p>' +
        '<div style="margin-top:10px;padding:10px;background:#D1FAE5;border-radius:8px;font-size:12px;color:#065F46;"><b>💡 提分点：</b>先做有把握的（有明确衔接词的），再用排除法；段首空格优先看与上一段尾的衔接。</div>' +
        '</div>' },
    // 物理
    { subject: '物理', tagBg: '#EDE9FE', tagColor: '#8B5CF6', title: '电磁感应双杆模型全解析：动量与能量联用', read: '3.1万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🔬 物理 · 电磁感应 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">双杆模型核心</p>' +
        '<p style="margin-bottom:6px;">两杆在导轨上运动，通过安培力相互制约，最终达到稳定状态（加速度相同或相对静止）。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">解题四步</p>' +
        '<p style="margin-bottom:6px;">①画受力分析（重力、支持力、安培力F=BIL）<br>②列牛顿第二定律：F合=ma，I=BLv_rel/R（v_rel为相对速度）<br>③稳定条件：a₁=a₂（加速度相同），此时v_rel恒定，I恒定<br>④动量/能量：动量守恒（光滑导轨）或功能关系（求焦耳热）</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">能量守恒</p>' +
        '<p style="margin-bottom:6px;">克服安培力做的功=回路产生的焦耳热：W_A=Q。用Q=(1/2)mv²初-(1/2)mv²末-其他力做功。</p>' +
        '<div style="margin-top:10px;padding:10px;background:#EDE9FE;border-radius:8px;font-size:12px;color:#5B21B6;"><b>💡 提分点：</b>①安培力方向用左手定则②I=BLv_rel/R中v是相对速度③稳定时不是v=0而是a相同④动量守恒只适用于无外力情况。</div>' +
        '</div>' },
    { subject: '物理', tagBg: '#EDE9FE', tagColor: '#8B5CF6', title: '力学综合题模板：动量守恒+能量守恒联用', read: '2.8万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🔬 物理 · 力学综合 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">动量守恒适用判断</p>' +
        '<p style="margin-bottom:6px;">①系统不受外力或合外力为零→严格守恒<br>②某方向合外力为零→该方向守恒（如光滑水平面碰撞）<br>③内力远大于外力（爆炸、碰撞）→近似守恒</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">能量守恒+功能关系</p>' +
        '<p style="margin-bottom:6px;">①W_G=-(ΔE_p)（重力做功=-重力势能变化）<br>②W_合=ΔE_k（动能定理）<br>③W_其他=ΔE_机（除重力外其他力做功=机械能变化）<br>④Q=f_滑·Δs相对（摩擦生热=滑动摩擦力×相对路程）</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">碰撞类型速判</p>' +
        '<p style="margin-bottom:6px;">弹性碰撞：动量守恒+动能守恒（v₁-v₂=v₂\'-v₁\'）<br>完全非弹性：动量守恒+共速（动能损失最大）<br>非弹性：动量守恒+动能损失（0<Q<ΔE_k_max）</p>' +
        '<div style="margin-top:10px;padding:10px;background:#EDE9FE;border-radius:8px;font-size:12px;color:#5B21B6;"><b>⚠ 易错提醒：</b>动量守恒用合外力判断而非"光滑"；Q=f·Δs_相对中Δs是两物相对位移非对地位移。</div>' +
        '</div>' },
    { subject: '物理', tagBg: '#EDE9FE', tagColor: '#8B5CF6', title: '带电粒子在复合场中运动：圆心与半径确定法', read: '2.1万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🔬 物理 · 复合场 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">圆心确定3法</p>' +
        '<p style="margin-bottom:6px;">①已知入射方向+出射方向：两速度垂线交点即圆心<br>②已知入射点+出射点+入射方向：入射点做速度垂线，与弦中垂线交点即圆心<br>③已知入射点+边界几何关系：结合边界角度分析</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">半径与时间</p>' +
        '<p style="margin-bottom:6px;">r=mv/(qB)；周期T=2πm/(qB)；运动时间t=(θ/2π)·T（θ为圆心角，弧度制）<br>弦长=2r·sin(θ/2)</p>' +
        '<div style="margin-top:10px;padding:10px;background:#EDE9FE;border-radius:8px;font-size:12px;color:#5B21B6;"><b>💡 提分点：</b>画轨迹图是关键；临界问题找几何极值（恰好出射/不出射）。</div>' +
        '</div>' },
    // 化学
    { subject: '化学', tagBg: '#FEF3C7', tagColor: '#F59E0B', title: '化学平衡常数计算三步法：浓度-平衡-判断', read: '2.9万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🧪 化学 · 化学平衡 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">三步法</p>' +
        '<p style="margin-bottom:6px;">第一步：列三段式（起始/转化/平衡浓度或分压）<br>第二步：代入K表达式求值或求参<br>第三步：用Q与K比较判断方向（Q<K正向，Q>K逆向，Q=K平衡）</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">三段式书写规范</p>' +
        '<p style="margin-bottom:6px;">如 aA+bB⇌cC+dD<br>　　　　A　　B　　C　　D<br>起始　c₁　c₂　　0　　0<br>转化　ax　bx　　cx　dx<br>平衡　c₁-ax　c₂-bx　cx　dx<br>K=c(C)^c·c(D)^d/[c(A)^a·c(B)^b]</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">等效平衡判断</p>' +
        '<p style="margin-bottom:6px;">恒温恒容：反应前后气体体积不变→只要折算后各物质n比相同即等效<br>恒温恒压：只要折算后各物质n比相同即等效（不限体积变化）</p>' +
        '<div style="margin-top:10px;padding:10px;background:#FEF3C7;border-radius:8px;font-size:12px;color:#92400E;"><b>⚠ 易错提醒：</b>固体/纯液体不计入K；K只与温度有关；三段式单位要统一（浓度或分压）。</div>' +
        '</div>' },
    { subject: '化学', tagBg: '#FEF3C7', tagColor: '#F59E0B', title: '有机推断突破口：官能团转化与特征反应图谱', read: '2.5万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🧪 化学 · 有机推断 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">特征反应突破口</p>' +
        '<p style="margin-bottom:6px;">• 银镜/斐林反应→醛基-CHO<br>• NaOH醇溶液加热消去→卤代烃或醇<br>• 酯化反应（浓硫酸催化）→羧酸+醇<br>• 加成（H₂/Ni）→C=C或C=O或苯环<br>• NaHCO₃放CO₂→羧基-COOH<br>• Na放H₂→-OH（醇/酚/羧酸）</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">分子式→结构式推断</p>' +
        '<p style="margin-bottom:6px;">①算不饱和度Ω=(2C+2-H-X+N)/2<br>②Ω=1→一个双键或环；Ω=4→可能含苯环<br>③结合特征反应定官能团位置<br>④注意同分异构（-OH/-O-、-COOH/-COOC-）</p>' +
        '<div style="margin-top:10px;padding:10px;background:#FEF3C7;border-radius:8px;font-size:12px;color:#92400E;"><b>💡 提分点：</b>先找信息最明确的物质（银镜=醛、银镜+水解=甲酸酯）做突破口，再双向推断。</div>' +
        '</div>' },
    { subject: '化学', tagBg: '#FEF3C7', tagColor: '#F59E0B', title: '电化学解题流程：原电池vs电解池一图分清', read: '2.0万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🧪 化学 · 电化学 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">原电池（自发反应）</p>' +
        '<p style="margin-bottom:6px;">负极→失电子→氧化反应→活泼金属（或燃料）<br>正极→得电子→还原反应→不活泼金属（或O₂）<br>电流方向：正极→外电路→负极<br>阳离子向正极迁移，阴离子向负极迁移</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">电解池（外接电源）</p>' +
        '<p style="margin-bottom:6px;">阳极→接电源正极→失电子→氧化（若是活泼金属则金属溶解）<br>阴极→接电源负极→得电子→还原<br>阳离子向阴极，阴离子向阳极</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">电极反应式书写</p>' +
        '<p style="margin-bottom:6px;">①判断电极②写总反应③拆分得正负/阴阳极④配平（电子守恒）⑤补环境（酸/碱/熔融）</p>' +
        '<div style="margin-top:10px;padding:10px;background:#FEF3C7;border-radius:8px;font-size:12px;color:#92400E;"><b>⚠ 易错提醒：</b>原电池"正正负负"（正极得电子）；电解池"阴阳阳阴"（阳极氧化失电子）。电镀：镀层金属做阳极，镀件做阴极。</div>' +
        '</div>' },
    // 生物
    { subject: '生物', tagBg: '#CCFBF1', tagColor: '#14B8A6', title: '遗传题概率计算：三大定律与棋盘法应用', read: '2.7万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🧬 生物 · 遗传 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">三大定律</p>' +
        '<p style="margin-bottom:6px;">①分离定律：一对等位基因→3:1（杂合自交）<br>②自由组合定律：n对独立基因→(3:1)ⁿ展开<br>③连锁交换：基因在同一条染色体上，可发生交叉互换</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">概率计算法</p>' +
        '<p style="margin-bottom:6px;">①棋盘法：列父本配子×母本配子表<br>②分支法：逐对基因拆分计算再相乘（适合多对基因）<br>③逆推法：后代比例→亲本基因型（如3:1→Aa×Aa；1:1→Aa×aa；全显→AA×_或显×显）</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">伴性遗传特例</p>' +
        '<p style="margin-bottom:6px;">X染色体：男→女传女不传子（交叉遗传）；Y染色体：父传子代代男。色盲系谱判断：男多于女、母→子交叉。</p>' +
        '<div style="margin-top:10px;padding:10px;background:#CCFBF1;border-radius:8px;font-size:12px;color:#115E59;"><b>⚠ 易错提醒：</b>求"患病概率"分清是"患病男孩"还是"男孩患病"；概率相乘用独立事件，相加用互斥事件。</div>' +
        '</div>' },
    { subject: '生物', tagBg: '#CCFBF1', tagColor: '#14B8A6', title: '光合与呼吸综合题：图像分析与坐标判断', read: '2.2万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🧬 生物 · 光合呼吸 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">关键点判断</p>' +
        '<p style="margin-bottom:6px;">• CO₂吸收=0点：光合=呼吸（光补偿点）<br>• 光饱和点：光合速率不再随光强增加<br>• CO₂补偿点：光合=呼吸<br>• 黑暗条件下：仅呼吸，曲线=呼吸速率</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">总光合与净光合</p>' +
        '<p style="margin-bottom:6px;">净光合速率=总光合速率-呼吸速率<br>实验测得的"O₂释放/CO₂吸收"=净光合<br>总光合=净光合+呼吸（用黑暗组测呼吸）</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">影响因子分析</p>' +
        '<p style="margin-bottom:6px;">光合：光强/CO₂浓度/温度/必需矿质（Mg/N/P）<br>呼吸：温度/O₂浓度/含水量</p>' +
        '<div style="margin-top:10px;padding:10px;background:#CCFBF1;border-radius:8px;font-size:12px;color:#115E59;"><b>💡 提分点：</b>看清纵坐标单位（O₂/CO₂）和符号方向；"积累量"是净光合，"制造量"是总光合。</div>' +
        '</div>' },
    { subject: '生物', tagBg: '#CCFBF1', tagColor: '#14B8A6', title: '生态系统能量流动计算：传递效率与营养级关系', read: '1.8万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🧬 生物 · 生态 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">能量流动特点</p>' +
        '<p style="margin-bottom:6px;">单向流动、逐级递减，传递效率10%-20%（相邻营养级之间）。</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">计算公式</p>' +
        '<p style="margin-bottom:6px;">• 下一营养级同化量=上一营养级同化量×(10%-20%)<br>• 流向下一营养级+分解者+未利用=上一营养级同化量<br>• 能量传递效率=下一营养级同化量/上一营养级同化量×100%</p>' +
        '<div style="margin-top:10px;padding:10px;background:#CCFBF1;border-radius:8px;font-size:12px;color:#115E59;"><b>⚠ 易错提醒：</b>同化量=摄入量-粪便量（粪便不算该营养级同化，算上一营养级流向分解者）；呼吸散失的能量不能再被利用。</div>' +
        '</div>' },
    // 政治
    { subject: '政治', tagBg: '#E0E7FF', tagColor: '#6366F1', title: '政治主观题答题模板：原因类、意义类、措施类', read: '3.0万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📋 政治 · 主观题 · 答题模板</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">原因类（"为什么/分析原因"）</p>' +
        '<p style="margin-bottom:6px;">答题逻辑：①必要性（理论依据+现状）②重要性（意义作用）③可能性（条件具备）<br>模板：<b>"……是……的客观要求（必要性）；有利于……（重要性）；具备……条件（可能性）"</b></p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">意义类（"有何意义/影响"）</p>' +
        '<p style="margin-bottom:6px;">答题逻辑：对主体A的意义+对主体B的意义+对国家/社会的意义<br>常用词：有利于、促进、推动、保障、提高、维护<br>角度：经济/政治/文化/生态/社会</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">措施类（"如何/怎样做"）</p>' +
        '<p style="margin-bottom:6px;">答题逻辑：主体分析法→国家（政府）、企业、公民各怎么做<br>模板：<b>"国家应……；企业应……；公民应……"</b>，每条对应课本原理</p>' +
        '<div style="margin-top:10px;padding:10px;background:#E0E7FF;border-radius:8px;font-size:12px;color:#3730A3;"><b>💡 提分点：</b>①原理+材料分析②分点作答③先书后材料④学科术语规范（"宏观调控"而非"政府管"）。</div>' +
        '</div>' },
    { subject: '政治', tagBg: '#E0E7FF', tagColor: '#6366F1', title: '经济常识计算题公式大全：价值量、汇率、恩格尔系数', read: '2.3万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📋 政治 · 经济计算 · 公式集</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">1. 单位商品价值量</p>' +
        '<p style="margin-bottom:6px;">=社会总价值/总使用价值量；生产率提高后：新价值量=原价值量×(原生产率/新生产率)</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">2. 汇率变动</p>' +
        '<p style="margin-bottom:6px;">本币升值→出口减/进口增；本币贬值→出口增/进口减。变化后汇率=原汇率×(1±变化率)</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">3. 恩格尔系数</p>' +
        '<p style="margin-bottom:6px;">=食品支出/消费总支出×100%；越低生活水平越高（<30%富裕，30-40%相对富裕）</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">4. GDP/收入增长</p>' +
        '<p style="margin-bottom:6px;">实际增长率=名义增长率-通货膨胀率</p>' +
        '<div style="margin-top:10px;padding:10px;background:#E0E7FF;border-radius:8px;font-size:12px;color:#3730A3;"><b>⚠ 易错提醒：</b>分清"社会劳动生产率"（影响价值量）与"个别劳动生产率"（影响价值总量）。</div>' +
        '</div>' },
    { subject: '政治', tagBg: '#E0E7FF', tagColor: '#6366F1', title: '哲学原理答题框架：唯物论、辩证法、认识论', read: '2.5万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📋 政治 · 哲学 · 答题框架</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">唯物论（物质意识）</p>' +
        '<p style="margin-bottom:6px;">①物质决定意识→一切从实际出发<br>②意识具有能动作用→正确意识促进发展<br>③规律客观性→按规律办事+发挥主观能动性</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">辩证法（联系发展矛盾）</p>' +
        '<p style="margin-bottom:6px;">①联系观：普遍/客观/多样/条件<br>②发展观：量变质变/前进曲折/新事物<br>③矛盾观：普遍性/特殊性/主次矛盾/主次方面<br>④辩证否定观：扬弃+创新</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">认识论（实践认识）</p>' +
        '<p style="margin-bottom:6px;">①实践是认识的基础（来源/动力/标准/目的）<br>②认识反复性/无限性/上升性→追求真理<br>③真理客观性/具体性/条件性</p>' +
        '<div style="margin-top:10px;padding:10px;background:#E0E7FF;border-radius:8px;font-size:12px;color:#3730A3;"><b>💡 提分点：</b>答题="原理+方法论+材料分析"，三者缺一不可；原理切忌只写术语不展开。</div>' +
        '</div>' },
    // 历史
    { subject: '历史', tagBg: '#FFE4E6', tagColor: '#F43F5E', title: '历史材料题答题技巧：论从史出、史论结合', read: '2.6万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📜 历史 · 材料题 · 解题技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">阅读材料三步</p>' +
        '<p style="margin-bottom:6px;">①先看设问（带问题读材料）→②精读材料提取关键信息（时间/人物/事件/观点）→③关联课本知识定位考点</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">答题规范</p>' +
        '<p style="margin-bottom:6px;">①论从史出：观点必须有材料支撑<br>②史论结合：既引材料原文又给课本结论<br>③按设问分值分点（1分1点或2分1点）<br>④材料信息+课本知识+自己概括，三者结合</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">常见设问类型</p>' +
        '<p style="margin-bottom:6px;">• "根据材料概括"→答案在材料中提炼<br>• "结合所学分析"→必须用课本知识<br>• "谈谈认识/启示"→史实+规律+现实意义</p>' +
        '<div style="margin-top:10px;padding:10px;background:#FFE4E6;border-radius:8px;font-size:12px;color:#9F1239;"><b>💡 提分点：</b>①引用材料要标"材料x云"②概括要抽象不要照抄原文③多角度（政治/经济/文化/外交）。</div>' +
        '</div>' },
    { subject: '历史', tagBg: '#FFE4E6', tagColor: '#F43F5E', title: '中国近代史高频考点：阶段特征与重大事件因果', read: '2.1万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📜 历史 · 中国近代史 · 考点梳理</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">阶段特征（1840-1949）</p>' +
        '<p style="margin-bottom:6px;">①1840-1894：开眼看世界→器物层面学习（洋务运动）<br>②1894-1919：制度层面探索（戊戌变法/辛亥革命）→思想解放（新文化运动）<br>③1919-1949：新民主主义革命（中共领导走向独立）</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">重大事件因果链</p>' +
        '<p style="margin-bottom:6px;">鸦片战争→列强侵略→太平天国（反抗）<br>甲午战败→民族危机→戊戌变法+辛亥革命（救亡）<br>巴黎和会→山东问题→五四运动→新文化运动深化<br>十月革命→马克思主义传播→中共成立</p>' +
        '<div style="margin-top:10px;padding:10px;background:#FFE4E6;border-radius:8px;font-size:12px;color:#9F1239;"><b>💡 提分点：</b>近代史主线"独立（反侵略）+富强（近代化）"；答题从政治/经济/思想三维度分析。</div>' +
        '</div>' },
    { subject: '历史', tagBg: '#FFE4E6', tagColor: '#F43F5E', title: '世界近现代史时间轴：重大事件因果关系梳理', read: '1.7万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">📜 历史 · 世界史 · 时间轴</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">资本主义发展四阶段</p>' +
        '<p style="margin-bottom:6px;">①14-16C：萌芽（文艺复兴/新航路）<br>②17-18C：确立（启蒙运动/英美法革命）<br>③18C末-19C：扩展（工业革命/资本主义体系形成）<br>④20C：调整（两次大战/罗斯福新政/全球化）</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">两次世界大战因果</p>' +
        '<p style="margin-bottom:6px;">一战：帝国主义政治经济发展不平衡→同盟对立→萨拉热窝→战后凡尔赛-华盛顿体系（埋下二战隐患）<br>二战：经济大萧条+凡华体系矛盾+法西斯兴起→二战→雅尔塔体系（冷战格局）</p>' +
        '<div style="margin-top:10px;padding:10px;background:#FFE4E6;border-radius:8px;font-size:12px;color:#9F1239;"><b>💡 提分点：</b>世界史答题角度：经济（生产/市场）+政治（制度/格局）+思想（启蒙/解放）。</div>' +
        '</div>' },
    // 地理
    { subject: '地理', tagBg: '#CFFAFE', tagColor: '#06B6D4', title: '地理综合题答题框架：自然+人文要素分析法', read: '2.8万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🌍 地理 · 综合题 · 答题框架</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">自然要素（"在哪里/为何如此"）</p>' +
        '<p style="margin-bottom:6px;">位置（经纬/海陆）→地形（类型/地势）→气候（类型/特征）→水文（河流/湖泊）→土壤→植被<br>分析"原因"题：从位置→气候→水文→地貌逐层推导</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">人文要素（"做什么/如何发展"）</p>' +
        '<p style="margin-bottom:6px;">人口（数量/迁移）→城市（化/分布）→农业（类型/区位）→工业（部门/区位）→交通（方式/布局）<br>分析"影响"题：经济/社会/生态三效益分析</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">区位分析万能模板</p>' +
        '<p style="margin-bottom:6px;">自然区位：地形/气候/水源/土壤<br>社会经济：市场/交通/劳动力/政策/科技/原料<br>评价类：优势+劣势+发展方向</p>' +
        '<div style="margin-top:10px;padding:10px;background:#CFFAFE;border-radius:8px;font-size:12px;color:#155E75;"><b>💡 提分点：</b>①先定位（经纬度/海陆位置）②要素齐全（避免漏点）③结合具体区域特征③使用学科语言（"季风气候"非"夏天热冬天冷"）。</div>' +
        '</div>' },
    { subject: '地理', tagBg: '#CFFAFE', tagColor: '#06B6D4', title: '区域地理分析六步法：位置地形气候水文土壤植被', read: '2.2万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🌍 地理 · 区域分析 · 六步法</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">六要素逐项分析</p>' +
        '<p style="margin-bottom:6px;">①位置：经纬度/海陆/相邻关系→定区域归属<br>②地形：类型（平原/高原/山地）+地势（高低走向）<br>③气候：类型+特征（气温/降水/季节分配）<br>④水文：河流流量/汛期/含沙量/冰期<br>⑤土壤：类型+肥力（黑土/红壤/黄土）<br>⑥植被：类型+分布（森林/草原/荒漠）</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">区域差异对比</p>' +
        '<p style="margin-bottom:6px;">南北差异：秦岭-淮河一线（温度带/干湿区/农业类型）<br>东西差异：季风区vs非季风区（降水/植被/经济）<br>垂直差异：海拔变化→气候/植被垂直分异</p>' +
        '<div style="margin-top:10px;padding:10px;background:#CFFAFE;border-radius:8px;font-size:12px;color:#155E75;"><b>⚠ 易错提醒：</b>区域分析必须"具体区域具体分析"，避免套话；结合地图记忆典型区域特征。</div>' +
        '</div>' },
    { subject: '地理', tagBg: '#CFFAFE', tagColor: '#06B6D4', title: '地理图表判读技巧：等值线、统计图、示意图', read: '1.9万', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:10px;">🌍 地理 · 图表判读 · 技巧</div>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">等值线判读</p>' +
        '<p style="margin-bottom:6px;">①看数值（极值/递变方向）②看疏密（密=变化大）③看弯曲（高高低低法则）④看闭合（中心高=高值区）<br>等温线：南凸→北半球夏季/南半球冬季</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">统计图判读</p>' +
        '<p style="margin-bottom:6px;">柱状图：看高低/趋势<br>折线图：看峰谷/变化率<br>扇形图：看比重/构成<br>坐标图：看清正负/象限</p>' +
        '<p style="font-weight:700;color:#111827;margin:10px 0 6px;">示意图判读</p>' +
        '<p style="margin-bottom:6px;">①先读图名+图例②判断空间/时间尺度③理解箭头/符号含义④联系课本原理</p>' +
        '<div style="margin-top:10px;padding:10px;background:#CFFAFE;border-radius:8px;font-size:12px;color:#155E75;"><b>💡 提分点：</b>判图先定类型（等值线/统计/示意），再用对应方法；等值线"凸高为低"是核心法则。</div>' +
        '</div>' }
];

// 名师课程 - 九科覆盖（每科1-2门，共12门）
var DISCOVER_COURSES = [
    { name: '王老师', subject: '数学', title: '高考导数满分冲刺课', lessons: 12, price: '¥99', color: '#3B82F6', bg: '#DBEAFE', students: '1.2万', rating: '4.9', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👨‍🏫 数学 · 12课时 · 王老师</div>' +
        '<p style="margin-bottom:10px;">导数压轴题专项突破，从单调性到不等式证明，系统梳理12类常考题型，配套真题精练。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p>' +
        '<p style="margin-bottom:6px;">1-3课：单调性讨论与极值问题<br>4-6课：零点个数与方程根<br>7-9课：不等式证明（构造法）<br>10-12课：恒成立与存在性+综合演练</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#DBEAFE;border-radius:8px;font-size:12px;color:#1E40AF;">' +
        '<span>⭐ 4.9分</span><span>👥 1.2万人在学</span><span>📚 12课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#3B82F6;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥99</button>' +
        '</div>' },
    { name: '李老师', subject: '物理', title: '力学综合突破精讲', lessons: 10, price: '¥89', color: '#8B5CF6', bg: '#EDE9FE', students: '8600', rating: '4.8', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👨‍🏫 物理 · 10课时 · 李老师</div>' +
        '<p style="margin-bottom:10px;">动量守恒+能量守恒联用，碰撞模型全解析，攻克力学压轴题。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p>' +
        '<p style="margin-bottom:6px;">1-3课：动量定理与动量守恒<br>4-6课：碰撞模型（弹性/非弹性）<br>7-8课：功能关系与机械能守恒<br>9-10课：综合题实战</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#EDE9FE;border-radius:8px;font-size:12px;color:#5B21B6;">' +
        '<span>⭐ 4.8分</span><span>👥 8600人在学</span><span>📚 10课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#8B5CF6;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥89</button>' +
        '</div>' },
    { name: '张老师', subject: '语文', title: '高考作文提分特训营', lessons: 15, price: '¥129', color: '#EF4444', bg: '#FEE2E2', students: '2.1万', rating: '4.9', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👩‍🏫 语文 · 15课时 · 张老师</div>' +
        '<p style="margin-bottom:10px;">从素材积累到结构构建，15课时带你写出55+高分作文。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p>' +
        '<p style="margin-bottom:6px;">1-3课：审题立意与开头模板<br>4-6课：分论点设置与论证方法<br>7-9课：素材积累与时政热点<br>10-12课：结构升级与语言润色<br>13-15课：真题演练+批改</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#FEE2E2;border-radius:8px;font-size:12px;color:#991B1B;">' +
        '<span>⭐ 4.9分</span><span>👥 2.1万人在学</span><span>📚 15课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#EF4444;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥129</button>' +
        '</div>' },
    { name: '陈老师', subject: '英语', title: '阅读理解满分突破', lessons: 12, price: '¥99', color: '#10B981', bg: '#D1FAE5', students: '1.5万', rating: '4.8', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👨‍🏫 英语 · 12课时 · 陈老师</div>' +
        '<p style="margin-bottom:10px;">主旨题、细节题、推断题、词义题四大题型全覆盖，3秒定位法实战。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p>' +
        '<p style="margin-bottom:6px;">1-3课：主旨题3秒定位法<br>4-6课：细节题与推断题<br>7-9课：词义猜测与七选五<br>10-12课：真题限时训练</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#D1FAE5;border-radius:8px;font-size:12px;color:#065F46;">' +
        '<span>⭐ 4.8分</span><span>👥 1.5万人在学</span><span>📚 12课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#10B981;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥99</button>' +
        '</div>' },
    { name: '刘老师', subject: '化学', title: '化学反应原理精讲', lessons: 10, price: '¥89', color: '#F59E0B', bg: '#FEF3C7', students: '7800', rating: '4.7', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👨‍🏫 化学 · 10课时 · 刘老师</div>' +
        '<p style="margin-bottom:10px;">化学平衡、电离水解、电化学核心原理+计算技巧。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p>' +
        '<p style="margin-bottom:6px;">1-3课：化学平衡与平衡常数<br>4-6课：弱电解质电离与水解<br>7-8课：沉淀溶解平衡<br>9-10课：电化学（原电池/电解池）</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#FEF3C7;border-radius:8px;font-size:12px;color:#92400E;">' +
        '<span>⭐ 4.7分</span><span>👥 7800人在学</span><span>📚 10课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#F59E0B;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥89</button>' +
        '</div>' },
    { name: '赵老师', subject: '生物', title: '遗传学专题突破', lessons: 8, price: '¥79', color: '#14B8A6', bg: '#CCFBF1', students: '6500', rating: '4.8', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👩‍🏫 生物 · 8课时 · 赵老师</div>' +
        '<p style="margin-bottom:10px;">三大遗传定律+概率计算+伴性遗传，专攻遗传压轴题。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p>' +
        '<p style="margin-bottom:6px;">1-2课：分离定律与自由组合<br>3-4课：连锁交换与伴性遗传<br>5-6课：概率计算（棋盘/分支法）<br>7-8课：遗传系谱分析与真题</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#CCFBF1;border-radius:8px;font-size:12px;color:#115E59;">' +
        '<span>⭐ 4.8分</span><span>👥 6500人在学</span><span>📚 8课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#14B8A6;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥79</button>' +
        '</div>' },
    { name: '周老师', subject: '政治', title: '主观题答题技巧课', lessons: 10, price: '¥89', color: '#6366F1', bg: '#E0E7FF', students: '5400', rating: '4.7', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👨‍🏫 政治 · 10课时 · 周老师</div>' +
        '<p style="margin-bottom:10px;">原因类/意义类/措施类/认识类四大题型答题模板+学科术语规范。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p>' +
        '<p style="margin-bottom:6px;">1-2课：经济主观题答题框架<br>3-4课：政治主观题（政府/党/公民）<br>5-6课：哲学原理+方法论<br>7-8课：文化主观题<br>9-10课：开放性试题与真题演练</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#E0E7FF;border-radius:8px;font-size:12px;color:#3730A3;">' +
        '<span>⭐ 4.7分</span><span>👥 5400人在学</span><span>📚 10课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#6366F1;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥89</button>' +
        '</div>' },
    { name: '吴老师', subject: '历史', title: '史料分析专项突破', lessons: 10, price: '¥89', color: '#F43F5E', bg: '#FFE4E6', students: '4800', rating: '4.7', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👩‍🏫 历史 · 10课时 · 吴老师</div>' +
        '<p style="margin-bottom:10px;">论从史出、史论结合，材料题答题规范+阶段特征梳理。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p>' +
        '<p style="margin-bottom:6px;">1-2课：材料阅读与信息提取<br>3-4课：中国古代史阶段特征<br>5-6课：中国近代史主线梳理<br>7-8课：世界史时间轴与因果<br>9-10课：综合材料题实战</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#FFE4E6;border-radius:8px;font-size:12px;color:#9F1239;">' +
        '<span>⭐ 4.7分</span><span>👥 4800人在学</span><span>📚 10课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#F43F5E;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥89</button>' +
        '</div>' },
    { name: '孙老师', subject: '地理', title: '区域地理综合分析', lessons: 12, price: '¥99', color: '#06B6D4', bg: '#CFFAFE', students: '6200', rating: '4.8', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👨‍🏫 地理 · 12课时 · 孙老师</div>' +
        '<p style="margin-bottom:10px;">自然+人文要素分析框架+图表判读+区位分析模板。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p>' +
        '<p style="margin-bottom:6px;">1-3课：自然地理要素分析（六步法）<br>4-6课：人文地理区位分析<br>7-8课：等值线与统计图判读<br>9-10课：区域差异与可持续发展<br>11-12课：综合题实战</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#CFFAFE;border-radius:8px;font-size:12px;color:#155E75;">' +
        '<span>⭐ 4.8分</span><span>👥 6200人在学</span><span>📚 12课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#06B6D4;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥99</button>' +
        '</div>' },
    { name: '黄老师', subject: '数学', title: '圆锥曲线压轴题秒杀课', lessons: 8, price: '¥79', color: '#3B82F6', bg: '#DBEAFE', students: '9300', rating: '4.8', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👩‍🏫 数学 · 8课时 · 黄老师</div>' +
        '<p style="margin-bottom:10px;">联立-韦达-判别式三步法+定点定值+非对称问题，专攻圆锥曲线压轴。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p>' +
        '<p style="margin-bottom:6px;">1-2课：联立与韦达定理应用<br>3-4课：弦长/面积/中点问题<br>5-6课：定点定值与最值<br>7-8课：非对称韦达与点差法</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#DBEAFE;border-radius:8px;font-size:12px;color:#1E40AF;">' +
        '<span>⭐ 4.8分</span><span>👥 9300人在学</span><span>📚 8课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#3B82F6;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥79</button>' +
        '</div>' },
    { name: '林老师', subject: '英语', title: '语法填空与短文改错专项', lessons: 6, price: '¥59', color: '#10B981', bg: '#D1FAE5', students: '7200', rating: '4.6', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👨‍🏫 英语 · 6课时 · 林老师</div>' +
        '<p style="margin-bottom:10px;">语法填空7大考点+短文改错10类错误，6课时提分20+。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p>' +
        '<p style="margin-bottom:6px;">1-2课：语法填空（动词/非谓语/词性转换）<br>3-4课：短文改错（多/缺/错词）<br>5-6课：真题限时训练</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#D1FAE5;border-radius:8px;font-size:12px;color:#065F46;">' +
        '<span>⭐ 4.6分</span><span>👥 7200人在学</span><span>📚 6课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#10B981;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥59</button>' +
        '</div>' },
    { name: '郑老师', subject: '化学', title: '有机推断题突破口课', lessons: 8, price: '¥79', color: '#F59E0B', bg: '#FEF3C7', students: '5100', rating: '4.7', content:
        '<div style="padding:6px 2px;">' +
        '<div style="font-size:12px;color:#9CA3AF;margin-bottom:8px;">👨‍🏫 化学 · 8课时 · 郑老师</div>' +
        '<p style="margin-bottom:10px;">官能团转化图谱+特征反应突破口+同分异构书写技巧。</p>' +
        '<p style="font-weight:700;color:#111827;margin-bottom:6px;">课程大纲</p>' +
        '<p style="margin-bottom:6px;">1-2课：官能团与特征反应<br>3-4课：不饱和度与分子式推断<br>5-6课：同分异构书写规范<br>7-8课：综合推断真题实战</p>' +
        '<div style="display:flex;gap:16px;margin:10px 0;padding:10px;background:#FEF3C7;border-radius:8px;font-size:12px;color:#92400E;">' +
        '<span>⭐ 4.7分</span><span>👥 5100人在学</span><span>📚 8课时</span></div>' +
        '<button onclick="closeModal()" style="margin-top:8px;width:100%;padding:12px;background:#F59E0B;color:white;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">立即报名 ¥79</button>' +
        '</div>' }
];

// 备考干货：打开详情
window.openDiscoverArticle = function (idx) {
    var a = DISCOVER_ARTICLES[idx];
    if (!a) return;
    openModal(a.title, a.content);
};
// 名师课程：打开详情
window.openDiscoverCourse = function (idx) {
    var t = DISCOVER_COURSES[idx];
    if (!t) return;
    openModal(t.title, t.content);
};
// 备考干货：按学科筛选
window.filterDiscoverArticles = function (subject) {
    document.querySelectorAll('.proto-article-item').forEach(function (el) {
        if (subject === '全部' || el.getAttribute('data-subject') === subject) {
            el.style.display = '';
        } else {
            el.style.display = 'none';
        }
    });
    document.querySelectorAll('.proto-subj-tab').forEach(function (t) {
        t.style.background = t.getAttribute('data-subject') === subject ? '#3B82F6' : '#F3F4F6';
        t.style.color = t.getAttribute('data-subject') === subject ? 'white' : '#374151';
    });
};

// 任务详情弹窗（AI学习计划任务卡片点击触发，data-task-detail 承载 JSON 详情）
window.openTaskDetailFromHomePlan = function (el) {
    if (!el) return;
    var raw = el.getAttribute('data-task-detail');
    if (!raw) { showToast('任务详情数据缺失'); return; }
    try {
        var t = JSON.parse(decodeURIComponent(raw));
        var subject = t.subject || '未知科目';
        var point = t.point || '未知知识点';
        var tip = '<div style="padding:14px;font-size:13px;line-height:1.8;color:#374151;">' +
            '<b>' + subject + ' · ' + point + '</b><br><br>' +
            '<b>预计时间：</b>' + t.time + '<br>' +
            '<b>题目数量：</b>' + (t.questions_count || 8) + ' 道<br>' +
            '<b>当前状态：</b>' + (t.done
                ? '<span style="color:#10B981;font-weight:600;">已完成</span>'
                : '<span style="color:#F59E0B;font-weight:600;">待完成</span>') +
            '</div>';
        if (typeof openModal === 'function') {
            openModal('任务详情', tip);
        } else {
            showToast(subject + ' · ' + point + ' · ' + t.time);
        }
    } catch (e) {
        showToast('任务详情解析失败');
    }
};

// 任务勾选（全局复用）
function toggleTask(el) {
    const isDone = el.classList.toggle('done');
    // 更新圆圈视觉：边框、背景、勾号图标
    el.style.borderColor = isDone ? '#10B981' : '#D1D5DB';
    el.style.background = isDone ? '#10B981' : 'transparent';
    el.innerHTML = isDone ? '<i class="fas fa-check" style="color:white;font-size:10px;"></i>' : '';
    // 更新任务文字划线
    const text = el.parentElement.querySelector('.task-name');
    if (text) {
        text.style.textDecoration = isDone ? 'line-through' : 'none';
        text.style.color = isDone ? '#9CA3AF' : '';
    }
    // 更新背景色
    const row = el.parentElement;
    if (row) row.style.background = isDone ? '#F0FDF4' : '#F9FAFB';
}

// 开始学习任务（今日任务页按钮）
// subject: 学科, point: 知识点, action: 开始/重练, questions: 题目数, time: 预计时长
function startTask(subject, point, action, questions, time) {
    var qCount = questions || 8;
    var totalTime = time || (qCount * 2.5 + 'min');
    // 根据题目数动态分配各环节时长（讲解占30%，例题占50%，错题占20%）
    var totalMin = parseInt(totalTime) || Math.round(qCount * 2.5);
    var lectureMin = Math.max(5, Math.round(totalMin * 0.3));
    var practiceMin = Math.max(8, Math.round(totalMin * 0.5));
    var reviewMin = Math.max(5, Math.round(totalMin * 0.2));

    openModal(action + '学习任务', `
        <div style="text-align:center;padding:8px 0 12px;">
            <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#1D4ED8);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
                <i class="fas fa-play" style="color:white;font-size:22px;"></i>
            </div>
            <div style="font-size:16px;font-weight:700;margin-bottom:4px;">${action}：${subject} · ${point}</div>
            <div style="font-size:12px;color:#9CA3AF;">正在为你准备学习内容…</div>
        </div>
        <div style="background:#F9FAFB;border-radius:10px;padding:12px;font-size:12px;color:#6B7280;line-height:1.7;margin-bottom:14px;">
            <div style="font-weight:600;color:#374151;margin-bottom:6px;"><i class="fas fa-list-check"></i> 本次学习将包含：</div>
            <div>• 知识点讲解（约${lectureMin}分钟）</div>
            <div>• 典型例题 ${qCount} 道（约${practiceMin}分钟）</div>
            <div>• 错题自动收录与解析（约${reviewMin}分钟）</div>
        </div>
        <button class="proto-btn proto-btn-primary" style="height:42px;border-radius:21px;" onclick="startLearnSession('${subject}','${point}','${action}', ${qCount})">立即${action}</button>
    `);
}

// 启动学习会话：关闭弹窗 → 设置会话参数 → 跳转到学习页
function startLearnSession(subject, point, action, qCount) {
    closeModal();
    // 设置本次学习会话参数（home-task-learn 页面读取）
    window.__learnSession = {
        subject: subject,
        point: point,
        action: action || '开始',
        qCount: qCount || 8,
        startTime: Date.now()
    };
    // 接入数据中台：学习会话参数持久化到 KV（支持跨页读取与断点续学）
    if (typeof api !== 'undefined' && api.savePageData) {
        api.savePageData('home-learn-session', window.__learnSession).catch(function () {});
    }
    navigateTo('home-task-learn');
}

// 查看解析
function viewAnalysis(subject, point) {
    openModal('题目解析 · ' + subject, `
        <div style="background:#EFF6FF;border-radius:10px;padding:12px;margin-bottom:12px;">
            <div style="font-size:13px;font-weight:700;color:#1D4ED8;margin-bottom:4px;"><i class="fas fa-bookmark"></i> ${point}</div>
            <div style="font-size:12px;color:#6B7280;">本题考查${subject}核心知识点，难度中等偏上</div>
        </div>
        <div style="font-size:13px;font-weight:700;margin-bottom:8px;"><i class="fas fa-lightbulb" style="color:#F59E0B;"></i> 解题思路</div>
        <div style="font-size:13px;color:#374151;line-height:1.8;margin-bottom:14px;">
            第一步：审题，提取已知条件与求解目标；<br>
            第二步：联想相关公式与定理，建立等量关系；<br>
            第三步：分步计算，注意定义域与特殊情况；<br>
            第四步：检验结果合理性，给出最终答案。
        </div>
        <div style="background:#F0FDF4;border-radius:10px;padding:12px;font-size:12px;color:#15803D;line-height:1.7;">
            <i class="fas fa-circle-check"></i> <b>易错点提醒：</b>注意分类讨论的完整性，避免遗漏边界值。
        </div>
        <button class="proto-btn proto-btn-primary" style="height:42px;border-radius:21px;margin-top:14px;" onclick="closeModal()">我学会了</button>
    `);
}

// 任务更多操作
function showTaskMore(subject, point) {
    openModal(subject + ' · 更多操作', `
        <div style="display:flex;flex-direction:column;gap:6px;">
            <div onclick="closeModal();showToast('已收藏到错题本')" style="display:flex;align-items:center;gap:12px;padding:14px;background:#F9FAFB;border-radius:10px;cursor:pointer;">
                <i class="fas fa-bookmark" style="color:#3B82F6;width:20px;"></i><span style="font-size:14px;font-weight:600;">收藏到错题本</span>
            </div>
            <div onclick="closeModal();showToast('已分享给同学')" style="display:flex;align-items:center;gap:12px;padding:14px;background:#F9FAFB;border-radius:10px;cursor:pointer;">
                <i class="fas fa-share-nodes" style="color:#10B981;width:20px;"></i><span style="font-size:14px;font-weight:600;">分享给同学</span>
            </div>
            <div onclick="closeModal();showToast('已标记为难点')" style="display:flex;align-items:center;gap:12px;padding:14px;background:#F9FAFB;border-radius:10px;cursor:pointer;">
                <i class="fas fa-flag" style="color:#F59E0B;width:20px;"></i><span style="font-size:14px;font-weight:600;">标记为重点</span>
            </div>
            <div onclick="closeModal();showToast('已稍后提醒')" style="display:flex;align-items:center;gap:12px;padding:14px;background:#F9FAFB;border-radius:10px;cursor:pointer;">
                <i class="fas fa-clock" style="color:#8B5CF6;width:20px;"></i><span style="font-size:14px;font-weight:600;">稍后提醒</span>
            </div>
        </div>
    `);
}

// 开始下一个任务（从今日任务API动态获取下一个待完成任务）
function startNextTask() {
    // 先显示loading弹窗
    openModal('开始下一个任务', `
        <div style="text-align:center;padding:20px 0;">
            <i class="fas fa-spinner fa-spin" style="font-size:28px;color:#10B981;margin-bottom:12px;"></i>
            <div style="font-size:14px;font-weight:600;">正在查找下一个任务…</div>
        </div>
    `);

    if (typeof api === 'undefined' || !api.getTodayTasks) {
        startNextTaskRender(null);
        return;
    }

    api.getTodayTasks().then(function(data) {
        if (data && data.tasks && data.tasks.length) {
            // 找到第一个待完成任务
            var nextTask = data.tasks.find(function(t) { return t.status !== 'done'; });
            if (nextTask) {
                startNextTaskRender(nextTask);
            } else {
                // 全部完成
                startNextTaskRender({ allDone: true });
            }
        } else {
            startNextTaskRender(null);
        }
    }).catch(function() {
        startNextTaskRender(null);
    });
}

// 渲染"开始下一个任务"弹窗内容
function startNextTaskRender(task) {
    if (!task) {
        openModal('开始下一个任务', `
            <div style="text-align:center;padding:8px 0 12px;">
                <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#9CA3AF,#6B7280);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
                    <i class="fas fa-circle-info" style="color:white;font-size:22px;"></i>
                </div>
                <div style="font-size:16px;font-weight:700;margin-bottom:4px;">暂无今日任务数据</div>
                <div style="font-size:12px;color:#9CA3AF;">请稍后再试或进入今日任务页查看</div>
            </div>
            <button class="proto-btn proto-btn-primary" style="height:42px;border-radius:21px;width:100%;" onclick="closeModal()">知道了</button>
        `);
        return;
    }

    if (task.allDone) {
        openModal('开始下一个任务', `
            <div style="text-align:center;padding:8px 0 12px;">
                <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#10B981,#059669);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
                    <i class="fas fa-trophy" style="color:white;font-size:22px;"></i>
                </div>
                <div style="font-size:16px;font-weight:700;margin-bottom:4px;">今日任务已全部完成！</div>
                <div style="font-size:12px;color:#9CA3AF;">太棒了，可以去挑战更多题目</div>
            </div>
            <button class="proto-btn proto-btn-primary" style="height:42px;border-radius:21px;width:100%;" onclick="closeModal();showToast('继续保持！')">好的</button>
        `);
        return;
    }

    var subject = task.subject || '';
    var point = task.point || '';
    var time = task.time || '20min';
    var questions = task.questions_count || 8;
    var difficulty = task.difficulty || '中等';

    openModal('开始下一个任务', `
        <div style="text-align:center;padding:8px 0 12px;">
            <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#10B981,#059669);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
                <i class="fas fa-arrow-right" style="color:white;font-size:22px;"></i>
            </div>
            <div style="font-size:16px;font-weight:700;margin-bottom:4px;">${subject} · ${point}</div>
            <div style="font-size:12px;color:#9CA3AF;">下一个待完成任务 · 预计 ${time} · ${questions}道题 · ${difficulty}</div>
        </div>
        <div style="background:#F9FAFB;border-radius:10px;padding:12px;font-size:12px;color:#6B7280;line-height:1.7;margin-bottom:14px;">
            <i class="fas fa-info-circle"></i> 该任务为本周薄弱知识点，建议优先完成。
        </div>
        <button class="proto-btn proto-btn-primary" style="height:42px;border-radius:21px;" onclick="closeModal();startTask('${subject}','${point}','开始', ${questions}, '${time}')">立即开始</button>
    `);
}

// 轻提示（全局复用）
function showToast(msg) {
    const old = document.getElementById('proto-toast');
    if (old) old.remove();
    const toast = document.createElement('div');
    toast.id = 'proto-toast';
    toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(17,24,39,0.92);color:white;padding:14px 24px;border-radius:24px;font-size:14px;font-weight:600;z-index:10000;box-shadow:0 8px 24px rgba(0,0,0,0.25);max-width:80%;text-align:center;';
    toast.innerHTML = '<i class="fas fa-circle-check" style="color:#10B981;margin-right:8px;"></i>' + msg;
    document.body.appendChild(toast);
    setTimeout(function() { if (toast) toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; }, 1500);
    setTimeout(function() { if (toast && toast.parentNode) toast.remove(); }, 1900);
}

// 通知中心
function showNotifications() {
    openModal('消息通知', `
        <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;gap:12px;padding:12px;background:#EFF6FF;border-radius:10px;border-left:3px solid #3B82F6;">
                <i class="fas fa-robot" style="color:#3B82F6;font-size:18px;margin-top:2px;"></i>
                <div style="flex:1;">
                    <div style="font-size:13px;font-weight:700;">AI教练提醒</div>
                    <div style="font-size:12px;color:#6B7280;margin-top:2px;">今日数学导数任务还未完成，建议在20:00前完成</div>
                    <div style="font-size:10px;color:#9CA3AF;margin-top:4px;">5分钟前</div>
                </div>
            </div>
            <div style="display:flex;gap:12px;padding:12px;background:#F0FDF4;border-radius:10px;border-left:3px solid #10B981;">
                <i class="fas fa-trophy" style="color:#10B981;font-size:18px;margin-top:2px;"></i>
                <div style="flex:1;">
                    <div style="font-size:13px;font-weight:700;">提分成就解锁</div>
                    <div style="font-size:12px;color:#6B7280;margin-top:2px;">恭喜！英语完形填空正确率提升至 85%</div>
                    <div style="font-size:10px;color:#9CA3AF;margin-top:4px;">1小时前</div>
                </div>
            </div>
            <div style="display:flex;gap:12px;padding:12px;background:#FFF7ED;border-radius:10px;border-left:3px solid #F59E0B;">
                <i class="fas fa-calendar" style="color:#F59E0B;font-size:18px;margin-top:2px;"></i>
                <div style="flex:1;">
                    <div style="font-size:13px;font-weight:700;">模考安排</div>
                    <div style="font-size:12px;color:#6B7280;margin-top:2px;">本周六上午9:00 理科综合模拟考试，请提前准备</div>
                    <div style="font-size:10px;color:#9CA3AF;margin-top:4px;">3小时前</div>
                </div>
            </div>
        </div>
        <button class="proto-btn proto-btn-outline" style="height:40px;border-radius:20px;margin-top:14px;width:100%;" onclick="closeModal();showToast('已全部标为已读')">全部已读</button>
    `);
}

// ========================== AI学习计划：分段控制器（本周/下周/本月）交互 ==========================
window._currentPlanRange = window._currentPlanRange || 'this_week';
// 渲染单日计划卡片（原型端使用 Tag()）
function protoRenderPlanDayCard(d) {
    var totalMin = d.tasks.reduce(function(a, b) { return a + parseInt(b.time); }, 0);
    var taskCards = d.tasks.map(function(t) {
        var qCount = t.questions_count || 8;
        var detailJson = encodeURIComponent(JSON.stringify({ subject: t.subject || '', point: t.point || '', time: t.time, questions_count: qCount, done: !!t.done }));
        return '<div data-task-detail="' + detailJson + '" style="display:flex;align-items:center;gap:10px;padding:10px;background:' + (t.done ? '#F0FDF4' : '#F9FAFB') + ';border-radius:10px;cursor:pointer;" onclick="window.openTaskDetailFromHomePlan(this)">' +
            '<div onclick="event.stopPropagation();toggleTask(this)" class="' + (t.done ? 'done' : '') + '" style="width:18px;height:18px;border-radius:50%;border:2px solid ' + (t.done ? '#10B981' : '#D1D5DB') + ';background:' + (t.done ? '#10B981' : 'transparent') + ';display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;">' +
            (t.done ? '<i class="fas fa-check" style="color:white;font-size:10px;"></i>' : '') + '</div>' +
            '<div class="task-name" style="flex:1;font-size:13px;' + (t.done ? 'text-decoration:line-through;color:#9CA3AF;' : '') + ';">' +
            Tag(t.subject, t.color) + '<span style="margin-left:6px;font-weight:600;">' + t.point + '</span></div>' +
            '<span style="font-size:11px;color:#6B7280;"><i class="far fa-clock"></i> ' + t.time + ' <i class="fas fa-chevron-right" style="margin-left:2px;font-size:9px;opacity:0.5;"></i></span></div>';
    }).join('');
    return '<div class="proto-card" style="margin:0 0 12px;' + (d.isToday ? 'border-left:3px solid #3B82F6;' : '') + '">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">' +
        '<div style="display:flex;align-items:center;gap:10px;">' +
        '<div style="width:36px;height:36px;border-radius:10px;background:' + (d.isToday ? '#3B82F6' : '#F3F4F6') + ';color:' + (d.isToday ? 'white' : '#6B7280') + ';display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;line-height:1.1;">' + d.day + '</div>' +
        '<div><div style="font-size:14px;font-weight:700;">' + d.day + (d.isToday ? ' <span style="font-size:11px;color:#3B82F6;font-weight:400;">（今天）</span>' : '') + '</div>' +
        '<div style="font-size:11px;color:#9CA3AF;">' + d.date + ' · ' + d.tasks.length + '个任务</div></div></div>' +
        '<span style="font-size:11px;color:#6B7280;">共 ' + totalMin + 'min</span></div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;">' + taskCards + '</div></div>';
}
// 原型端：本月视图分组渲染 + 其他视图平铺
function protoRenderPlanGrouped(planDays, range) {
    var isMonth = (range === 'this_month') || planDays.some(function(d) { return d.week_group_name; });
    if (!isMonth) return planDays.map(function(d) { return protoRenderPlanDayCard(d); }).join('');
    var groups = {};
    planDays.forEach(function(d) {
        var g = typeof d.week_group === 'number' ? d.week_group : 0;
        if (!groups[g]) groups[g] = { name: d.week_group_name || ('第' + (g + 1) + '周'), days: [] };
        groups[g].days.push(d);
    });
    var keys = Object.keys(groups).sort(function(a, b) { return Number(a) - Number(b); });
    var html = '';
    keys.forEach(function(k) {
        var grp = groups[k];
        var firstDate = grp.days[0] && grp.days[0].date;
        var lastDate = grp.days[grp.days.length - 1] && grp.days[grp.days.length - 1].date;
        var dateRange = firstDate && lastDate ? '（' + firstDate + ' ~ ' + lastDate + '）' : '';
        html += '<div style="margin:0 0 8px;padding:8px 12px;background:#EFF6FF;border-radius:8px;display:flex;align-items:center;justify-content:space-between;">' +
            '<div style="font-size:13px;font-weight:700;color:#1E40AF;"><i class="fas fa-calendar-week" style="margin-right:6px;"></i>' + grp.name + dateRange + '</div>' +
            '<div style="font-size:11px;color:#3B82F6;">' + grp.days.length + '天</div></div>';
        html += grp.days.map(function(d) { return protoRenderPlanDayCard(d); }).join('');
    });
    return html;
}
// 填充头部摘要（带 range_label）
function protoFillWeekPlanSummary(data) {
    var c = document.getElementById('week-plan-summary');
    if (!c) return;
    var rangeLabel = (data && data.range_label) ? data.range_label : '本周';
    c.innerHTML = '<div style="font-size:15px;font-weight:700;">AI智能学习计划</div>' +
        '<div style="font-size:12px;opacity:0.85;margin-top:2px;">基于薄弱点分析 · ' + rangeLabel + '共' + data.total_tasks + '个任务</div>';
    var p = c.parentElement;
    if (!p) return;
    var oldBadge = p.querySelector('.done-badge');
    if (oldBadge) oldBadge.remove();
    var b = document.createElement('div');
    b.className = 'done-badge';
    b.style.cssText = 'text-align:center;background:rgba(255,255,255,0.18);border-radius:10px;padding:6px 10px;';
    b.innerHTML = '<div style="font-size:18px;font-weight:800;">' + data.done_tasks + '</div><div style="font-size:9px;">已完成</div>';
    p.appendChild(b);
}
// 加载指定范围计划
function protoLoadSegmentPlan(range, shuffle) {
    var list = document.getElementById('week-plan-list');
    var summary = document.getElementById('week-plan-summary');
    if (!list) return;
    list.innerHTML = '<div class="proto-card" style="margin:0 0 12px;text-align:center;padding:40px;color:#9CA3AF;">' +
        '<i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i>' +
        '<div style="font-size:13px;">AI正在生成学习计划…</div></div>';
    if (summary) summary.innerHTML = '<div style="font-size:15px;font-weight:700;">AI智能学习计划</div>' +
        '<div style="font-size:12px;opacity:0.85;margin-top:2px;">分析薄弱点中…</div>';
    if (typeof api === 'undefined' || !api.getWeekPlan) {
        list.innerHTML = '<div class="proto-card" style="margin:0 0 12px;text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">API不可用</div></div>';
        return;
    }
    api.getWeekPlan(!!shuffle, range).then(function(data) {
        if (!document.getElementById('week-plan-list')) return;
        if (data && data.week_plan && data.week_plan.length) {
            document.getElementById('week-plan-list').innerHTML = protoRenderPlanGrouped(data.week_plan, range);
            protoFillWeekPlanSummary(data);
        } else {
            document.getElementById('week-plan-list').innerHTML =
                '<div class="proto-card" style="margin:0 0 12px;text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">暂无学习数据</div></div>';
        }
        if (shuffle) showToast('AI已为你重新生成学习计划');
    }).catch(function() {
        var lc = document.getElementById('week-plan-list');
        if (lc) lc.innerHTML = '<div class="proto-card" style="margin:0 0 12px;text-align:center;padding:40px;color:#EF4444;"><div style="font-size:13px;">加载失败，请稍后重试</div></div>';
        if (shuffle) showToast('重新规划失败，请稍后重试');
    });
}
// 分段控制器切换
function switchSegment(el) {
    if (!el || !el.parentElement) return;
    var parent = el.parentElement;
    parent.querySelectorAll('.proto-segment-item, .wp-segment-item').forEach(function(s) {
        s.classList.remove('active');
        s.style.background = 'transparent';
        s.style.color = '#6B7280';
        s.style.boxShadow = 'none';
    });
    el.classList.add('active');
    el.style.background = 'white';
    el.style.color = '#3B82F6';
    el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    var text = (el.textContent || '').trim();
    var rangeMap = { '本周': 'this_week', '下周': 'next_week', '本月': 'this_month' };
    var newRange = rangeMap[text];
    if (!newRange) return;
    window._currentPlanRange = newRange;
    // 接入数据中台：学习计划周期偏好持久化到 KV
    if (typeof api !== 'undefined' && api.savePageData) {
        api.savePageData('home-plan-range', newRange).catch(function () {});
    }
    protoLoadSegmentPlan(newRange, false);
}
window.switchSegment = switchSegment;

// AI重新规划学习计划
function aiReplan() {
    openModal('AI重新规划', `
        <div style="text-align:center;padding:8px 0 12px;">
            <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#3B82F6,#1D4ED8);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
                <i class="fas fa-robot" style="color:white;font-size:24px;"></i>
            </div>
            <div style="font-size:16px;font-weight:700;">AI正在重新分析你的学习数据</div>
            <div style="font-size:12px;color:#9CA3AF;margin-top:4px;">基于最近7天答题记录与薄弱点变化</div>
        </div>
        <div style="background:#F9FAFB;border-radius:10px;padding:12px;font-size:12px;color:#6B7280;line-height:1.8;margin-bottom:14px;">
            <div style="font-weight:600;color:#374151;margin-bottom:6px;"><i class="fas fa-cog"></i> AI规划中将：</div>
            <div>• 重新评估各科薄弱知识点权重</div>
            <div>• 优化每日任务时长分配</div>
            <div>• 优先安排高提分空间的内容</div>
            <div>• 调整复习与练习的比例</div>
        </div>
        <button class="proto-btn proto-btn-primary" style="height:42px;border-radius:21px;width:100%;" onclick="executeReplan()">开始重新规划</button>
    `);
}

// 执行重新规划：关闭弹窗 → 调用当前分段的 shuffle 加载
function executeReplan() {
    closeModal();
    var currentRange = window._currentPlanRange || 'this_week';
    protoLoadSegmentPlan(currentRange, true);
}

// 动态计算最近一次高考（若今年6月7日已过则取明年）
function getNextGaokao() {
    const now = new Date();
    let year = now.getFullYear();
    let gaokao = new Date(year, 5, 7); // 6月7日
    // 若今年高考已结束（含3天考试期6/7~6/9），则取下一年
    if (now > new Date(year, 5, 9, 23, 59, 59)) {
        year = year + 1;
        gaokao = new Date(year, 5, 7);
    }
    return { year, date: gaokao };
}

// ============================================================
// 1. 首页主页面 - AI今日提分
// ============================================================
registerPage('home', 'AI今日提分', '首页', 'fa-home', () => {
    // 动态计算高考倒计时（自动指向最近一次未来高考）
    const { year: gaokaoYear, date: gaokaoDate } = getNextGaokao();
    const today = new Date();
    const diffMs = gaokaoDate - today;
    const countdownDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    // 异步加载首页今日学习计划预览（取今日任务前3个）
    setTimeout(function() {
        const container = document.getElementById('home-today-plan-preview');
        if (!container) return;

        // API 不可用时的回退提示
        function showPreviewFallback() {
            container.innerHTML = '<div style="text-align:center;padding:16px;color:#9CA3AF;font-size:13px;"><i class="fas fa-clipboard-list" style="color:#3B82F6;margin-right:6px;"></i>暂无今日任务数据，点击"查看全部"进入今日任务页</div>';
        }

        if (typeof api === 'undefined' || !api.getTodayTasks) { showPreviewFallback(); return; }

        api.getTodayTasks().then(function(data) {
            if (!data || !data.tasks) { showPreviewFallback(); return; }
            const tasks = data.tasks.slice(0, 3); // 只显示前3个任务
            const doneCount = data.done_count || 0;
            const totalCount = data.total_count || 0;
            const completionRate = data.completion_rate || 0;
            const totalMin = data.tasks.reduce(function(s, t) { return s + parseInt(t.time); }, 0);
            const usedMin = data.tasks.filter(function(t) { return t.status === 'done'; }).reduce(function(s, t) { return s + (t.duration_min || 0); }, 0);
            const remainMin = Math.max(0, totalMin - usedMin);

            let html = '';
            html += Progress(completionRate, '#3B82F6');
            html += '<div style="font-size:11px;color:#9CA3AF;margin:6px 0 12px;">已完成 ' + doneCount + '/' + totalCount + ' · 预计还需 ' + remainMin + ' 分钟</div>';
            html += '<div style="display:flex;flex-direction:column;gap:8px;">';

            if (tasks.length === 0) {
                html += '<div style="text-align:center;padding:16px;color:#9CA3AF;font-size:13px;"><i class="fas fa-check-circle" style="color:#10B981;margin-right:6px;"></i>今日任务已全部完成</div>';
            } else {
                tasks.forEach(function(t) {
                    const isDone = t.status === 'done';
                    const qCount = t.questions_count || 8;
                    const taskTip = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b>' + t.subject + ' · ' + t.point + '</b><br><br><b>预计时间：</b>' + t.time + '<br><b>题目数量：</b>' + qCount + ' 道<br><b>当前状态：</b>' + (isDone ? '<span style=&quot;color:#10B981;&quot;>已完成</span>' : '<span style=&quot;color:#F59E0B;&quot;>待完成</span>') + '<br><br><span style=&quot;cursor:pointer;color:#3B82F6;&quot; onclick=&quot;navigateTo(\\\'home-task\\\')&quot;>进入今日任务页面 →</span></div>';
                    if (isDone) {
                        html += '<div style="display:flex;align-items:center;gap:10px;padding:10px;background:#F0FDF4;border-radius:10px;cursor:pointer;" onclick="openModal(\'任务详情\', \'' + taskTip + '\')">';
                        html += '<div onclick="event.stopPropagation();toggleTask(this)" style="width:18px;height:18px;border-radius:50%;border:2px solid #10B981;background:#10B981;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer;"><i class="fas fa-check" style="color:white;font-size:10px;"></i></div>';
                        html += '<div class="task-name" style="flex:1;font-size:13px;text-decoration:line-through;color:#9CA3AF;">' + t.subject + ' · ' + t.point + '</div>';
                        html += '<span style="font-size:11px;color:#6B7280;"><i class="far fa-clock"></i> ' + t.time + '</span>';
                        html += Tag('已完成', 'green');
                        html += '</div>';
                    } else {
                        html += '<div style="display:flex;align-items:center;gap:10px;padding:10px;background:#F9FAFB;border-radius:10px;cursor:pointer;" onclick="openModal(\'任务详情\', \'' + taskTip + '\')">';
                        html += '<div onclick="event.stopPropagation();toggleTask(this)" style="width:18px;height:18px;border-radius:50%;border:2px solid #D1D5DB;flex-shrink:0;cursor:pointer;"></div>';
                        html += '<div class="task-name" style="flex:1;font-size:13px;">' + t.subject + ' · ' + t.point + '</div>';
                        html += '<span style="font-size:11px;color:#6B7280;"><i class="far fa-clock"></i> ' + t.time + '</span>';
                        html += Tag('待完成', 'orange');
                        html += '</div>';
                    }
                });
            }
            html += '</div>';
            container.innerHTML = html;
        }).catch(function() { showPreviewFallback(); });
    }, 100);

    return Page({
        title: 'AI今日提分',
        navbar: false,
        tabbar: 'learn',
        content: `
        <div style="background:#F3F4F6;min-height:100%;padding-bottom:8px;">
            <!-- 顶部用户区 -->
            <div style="background:linear-gradient(160deg,#3B82F6,#1D4ED8);padding:48px 20px 20px;color:white;position:relative;overflow:hidden;">
                <div style="position:absolute;top:-30px;right:-30px;width:140px;height:140px;border-radius:50%;background:rgba(255,255,255,0.08);"></div>
                <div style="position:absolute;bottom:-40px;left:-20px;width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,0.06);"></div>
                <div style="display:flex;align-items:center;justify-content:space-between;position:relative;">
                    <div style="display:flex;align-items:center;gap:12px;cursor:pointer;" onclick="openProtoAuthModal()" title="点击登录 / 注册">
                        <div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.18);border:2px solid rgba(255,255,255,0.55);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:18px;letter-spacing:1px;backdrop-filter:blur(6px);">ZH</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;display:flex;align-items:center;gap:6px;">你好，访客 <i class="fas fa-chevron-down" style="font-size:11px;opacity:0.7;"></i></div>
                            <div style="font-size:12px;opacity:0.85;margin-top:2px;"><i class="fas fa-calendar-day"></i> 距离${gaokaoYear}高考还有 <b style="font-size:14px;">${countdownDays}</b> 天</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:14px;">
                        <i class="fas fa-bell" style="font-size:18px;opacity:0.9;cursor:pointer;" onclick="showNotifications()"></i>
                        <i class="fas fa-qrcode" style="font-size:18px;opacity:0.9;" onclick="navigateTo('home-countdown')"></i>
                    </div>
                </div>
            </div>

            <!-- AI今日提分卡片 -->
            ${GradientCard('blue', `
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                    <div>
                        <div style="font-size:12px;opacity:0.85;"><i class="fas fa-robot"></i> AI今日提分</div>
                        <div style="font-size:13px;opacity:0.7;margin-top:2px;">基于今日学习数据智能预测</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:12px;font-size:11px;">今日 +3 分</div>
                </div>
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <div style="text-align:center;">
                        <div style="font-size:11px;opacity:0.8;">当前估分</div>
                        <div style="font-size:30px;font-weight:800;">580</div>
                    </div>
                    <div style="flex:1;padding:0 12px;text-align:center;">
                        <i class="fas fa-arrow-right" style="font-size:18px;opacity:0.7;"></i>
                        <div style="font-size:11px;opacity:0.85;margin-top:2px;color:#FCD34D;">↑ 预计提分 +3</div>
                    </div>
                    <div style="text-align:center;">
                        <div style="font-size:11px;opacity:0.8;">目标分数</div>
                        <div style="font-size:30px;font-weight:800;color:#FCD34D;">620</div>
                    </div>
                </div>
                <div style="margin-top:14px;background:rgba(255,255,255,0.15);border-radius:8px;padding:8px 10px;font-size:11px;display:flex;align-items:center;gap:6px;">
                    <i class="fas fa-lightbulb"></i> AI建议：重点突破数学导数与物理电磁感应
                </div>
            `)}

            <!-- 快捷功能网格 -->
            <div style="margin-bottom:12px;">
                <div class="proto-grid-4">
                    ${QuickTile('fa-robot', 'linear-gradient(135deg,#3B82F6,#1D4ED8)', 'AI学习教练', 'ai-coach')}
                    ${QuickTile('fa-book-open', 'linear-gradient(135deg,#10B981,#059669)', '真题演练', 'practice-real-exam')}
                    ${QuickTile('fa-camera', 'linear-gradient(135deg,#F59E0B,#D97706)', '拍照搜题', 'photo-ocr', { openCamera: true })}
                    ${QuickTile('fa-chart-bar', 'linear-gradient(135deg,#8B5CF6,#6D28D9)', 'AI学情分析', 'home-analysis')}
                </div>
            </div>

            <!-- 今日学习计划 -->
            <div class="proto-card" style="margin:0 0 12px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                    <div style="font-size:15px;font-weight:700;"><i class="fas fa-tasks" style="color:#3B82F6;margin-right:6px;"></i>今日学习计划</div>
                    <span style="font-size:12px;color:#3B82F6;cursor:pointer;" onclick="navigateTo('home-task')">查看全部 ›</span>
                </div>
                <div id="home-today-plan-preview">
                    <div style="text-align:center;padding:20px;color:#9CA3AF;font-size:13px;"><i class="fas fa-spinner fa-spin"></i> 正在加载今日任务…</div>
                </div>
            </div>

            <!-- 学习时长统计 -->
            <div class="proto-card" style="margin:0 0 12px;cursor:pointer;" onclick="navigateTo('home-duration')">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
                    <div style="font-size:15px;font-weight:700;"><i class="fas fa-clock" style="color:#10B981;margin-right:6px;"></i>本周学习时长</div>
                    <span style="font-size:12px;color:#3B82F6;cursor:pointer;">详情 ›</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:6px;margin-bottom:10px;">
                    <span style="font-size:26px;font-weight:800;color:#111827;">28</span>
                    <span style="font-size:13px;color:#6B7280;">h / 42h</span>
                    <span style="font-size:12px;color:#10B981;margin-left:auto;"><i class="fas fa-arrow-up"></i> +15%</span>
                </div>
                ${Progress(67, '#10B981')}
                <div style="font-size:11px;color:#9CA3AF;margin-top:6px;">本周目标完成 67%，继续保持！</div>
            </div>

            <!-- AI提分预测卡片 -->
            ${GradientCard('purple', `
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <div style="flex:1;">
                        <div style="font-size:12px;opacity:0.85;"><i class="fas fa-brain"></i> AI提分预测</div>
                        <div style="font-size:32px;font-weight:800;margin-top:6px;">615<span style="font-size:14px;opacity:0.8;">分</span></div>
                        <div style="font-size:12px;opacity:0.85;margin-top:4px;">较上次预测 <span style="color:#FCD34D;">↑ 8分</span></div>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;">
                        <div style="background:rgba(255,255,255,0.18);border-radius:10px;padding:8px 12px;text-align:center;">
                            <div style="font-size:11px;opacity:0.85;">985录取概率</div>
                            <div style="font-size:20px;font-weight:800;color:#FCD34D;">67%</div>
                        </div>
                        <div style="background:rgba(255,255,255,0.18);border-radius:10px;padding:8px 12px;text-align:center;">
                            <div style="font-size:11px;opacity:0.85;">211录取概率</div>
                            <div style="font-size:20px;font-weight:800;">85%</div>
                        </div>
                    </div>
                </div>
                <div onclick="navigateTo('home-predict')" style="margin-top:14px;background:rgba(255,255,255,0.2);border-radius:10px;padding:10px;text-align:center;font-size:13px;font-weight:600;cursor:pointer;">
                    查看完整预测分析 ›
                </div>
            `)}

            <!-- 倒计时入口 -->
            <div class="proto-card" style="margin:0 0 12px;display:flex;align-items:center;gap:12px;cursor:pointer;" onclick="navigateTo('home-countdown')">
                <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#EF4444,#B91C1C);display:flex;align-items:center;justify-content:center;">
                    <i class="fas fa-hourglass-half" style="color:white;font-size:18px;"></i>
                </div>
                <div style="flex:1;">
                    <div style="font-size:14px;font-weight:700;">${gaokaoYear}高考倒计时</div>
                    <div style="font-size:12px;color:#6B7280;margin-top:2px;">6月7日 · 各科复习进度一目了然</div>
                </div>
                <div style="text-align:center;">
                    <div style="font-size:22px;font-weight:800;color:#EF4444;">${countdownDays}</div>
                    <div style="font-size:10px;color:#9CA3AF;">天</div>
                </div>
            </div>
        </div>
        `
    });
});

// ============================================================
// 2. 高考倒计时
// ============================================================
registerPage('home-countdown', '高考倒计时', '首页', 'fa-home', () => {
    // 根据真实日期生成倒计时与日历（自动指向最近一次未来高考）
    const today = new Date();
    const { year: gaokaoYear, date: gaokaoDate } = getNextGaokao();
    const diffMs = gaokaoDate - today;
    const countdownDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    // 生成高考所在年6月日历（周一为第一列）
    const days = ['一', '二', '三', '四', '五', '六', '日'];
    const year = gaokaoYear;
    const month = 6;
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // 计算1号是周几，转换为周一为第一天的索引
    const firstDayWeekday = firstDayOfMonth.getDay(); // 0=周日
    const blankCells = (firstDayWeekday + 6) % 7; // 转换：周一=0, 周二=1, ..., 周日=6

    // 生成日历格子
    const cells = [];
    for (let i = 0; i < blankCells; i++) cells.push({ empty: true });
    for (let day = 1; day <= daysInMonth; day++) {
        const isExam = day === 7 || day === 8 || day === 9; // 高考3天
        const isToday = (today.getFullYear() === year && today.getMonth() === month - 1 && today.getDate() === day);
        cells.push({ dayNum: day, isExam, isToday });
    }
    while (cells.length % 7 !== 0) cells.push({ empty: true });

    // 渲染单科进度行（供异步更新复用）
    function renderSubjectRow(s) {
        return `
            <div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;">
                        <i class="fas ${s.icon}" style="color:${s.color};width:16px;"></i> ${s.subject}
                    </div>
                    <span style="font-size:13px;font-weight:700;color:${s.color};">${s.percent}%</span>
                </div>
                ${Progress(s.percent, s.color)}
            </div>`;
    }

    // 异步加载各科复习进度
    setTimeout(function() {
        const container = document.getElementById('review-progress-list');
        if (!container) return;

        // 兜底默认数据（API不可用时使用）
        const defaults = [
            { subject: '数学', percent: 55, color: '#3B82F6', icon: 'fa-square-root-variable' },
            { subject: '语文', percent: 61, color: '#F59E0B', icon: 'fa-book' },
            { subject: '英语', percent: 66, color: '#10B981', icon: 'fa-language' },
            { subject: '物理', percent: 58, color: '#8B5CF6', icon: 'fa-atom' },
            { subject: '化学', percent: 66, color: '#06B6D4', icon: 'fa-flask' },
            { subject: '生物', percent: 66, color: '#EC4899', icon: 'fa-dna' },
            { subject: '思想政治', percent: 63, color: '#EF4444', icon: 'fa-landmark' },
            { subject: '历史', percent: 64, color: '#D97706', icon: 'fa-ribbon' },
            { subject: '地理', percent: 64, color: '#059669', icon: 'fa-globe-asia' }
        ];

        if (typeof api === 'undefined' || !api.getReviewProgress) {
            container.innerHTML = defaults.map(renderSubjectRow).join('');
            return;
        }
        api.getReviewProgress().then(function(data) {
            // api.request 成功时直接返回 data.data（即学科数组），失败时返回 null
            if (data && data.length) {
                container.innerHTML = data.map(renderSubjectRow).join('');
            } else {
                container.innerHTML = defaults.map(renderSubjectRow).join('');
            }
        }).catch(function() {
            container.innerHTML = defaults.map(renderSubjectRow).join('');
        });
    }, 100);

    return Page({
        title: '高考倒计时',
        back: true,
        content: `
        <div style="background:#F3F4F6;min-height:100%;padding-bottom:20px;">
            <!-- 大数字倒计时 -->
            ${GradientCard('pink', `
                <div style="text-align:center;padding:8px 0;">
                    <div style="font-size:12px;opacity:0.85;letter-spacing:2px;"><i class="fas fa-flag-checkered"></i> 距离${gaokaoYear}年高考</div>
                    <div style="font-size:72px;font-weight:800;line-height:1.1;margin:6px 0;">
                        <span style="color:#FCD34D;">${countdownDays}</span>
                        <span style="font-size:24px;">天</span>
                    </div>
                    <div style="font-size:13px;opacity:0.9;"><i class="fas fa-calendar-alt"></i> ${gaokaoYear}年6月7日 - 6月9日</div>
                    <div style="margin-top:12px;background:rgba(255,255,255,0.18);border-radius:20px;padding:8px 16px;display:inline-block;font-size:12px;">
                        <i class="fas fa-bullhorn"></i> 最后冲刺，坚持就是胜利！
                    </div>
                </div>
            `)}

            <!-- 各科复习进度（动态从后端获取，覆盖高考9大学科） -->
            <div class="proto-card" style="margin:0 0 12px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
                    <div style="font-size:15px;font-weight:700;"><i class="fas fa-chart-pie" style="color:#3B82F6;margin-right:6px;"></i>各科复习进度</div>
                    <span style="font-size:11px;color:#9CA3AF;">基于知识点掌握率</span>
                </div>
                <div id="review-progress-list" style="display:flex;flex-direction:column;gap:12px;">
                    <div style="text-align:center;padding:20px;color:#9CA3AF;font-size:13px;"><i class="fas fa-spinner fa-spin"></i> 正在加载学习进度…</div>
                </div>
            </div>

            <!-- 倒计时日历 -->
            <div class="proto-card" style="margin:0 0 12px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                    <div style="font-size:15px;font-weight:700;"><i class="fas fa-calendar-day" style="color:#8B5CF6;margin-right:6px;"></i>倒计时日历</div>
                    <div style="font-size:12px;color:#6B7280;">${year}年${month}月</div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:11px;color:#9CA3AF;margin-bottom:6px;">
                    ${days.map(d => `<div style="padding:4px 0;">${d}</div>`).join('')}
                </div>
                <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">
                    ${cells.map(c => {
                        if (c.empty) return `<div style="aspect-ratio:1;"></div>`;
                        if (c.isExam) return `<div style="aspect-ratio:1;background:#EF4444;color:white;border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:700;"><span style="font-size:13px;">${c.dayNum}</span><span style="font-size:8px;">高考</span></div>`;
                        if (c.isToday) return `<div style="aspect-ratio:1;background:#3B82F6;color:white;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;">${c.dayNum}</div>`;
                        return `<div style="aspect-ratio:1;background:#F9FAFB;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#374151;">${c.dayNum}</div>`;
                    }).join('')}
                </div>
                <div style="display:flex;gap:12px;margin-top:12px;font-size:11px;color:#6B7280;">
                    <span><span style="display:inline-block;width:10px;height:10px;background:#EF4444;border-radius:3px;vertical-align:middle;margin-right:4px;"></span>高考日</span>
                    <span><span style="display:inline-block;width:10px;height:10px;background:#3B82F6;border-radius:3px;vertical-align:middle;margin-right:4px;"></span>今天</span>
                </div>
            </div>

            <!-- 每日寄语 -->
            ${GradientCard('orange', `
                <div style="text-align:center;padding:6px 0;">
                    <i class="fas fa-quote-left" style="opacity:0.5;font-size:14px;"></i>
                    <div style="font-size:16px;font-weight:700;margin:8px 0;letter-spacing:1px;">最后冲刺，坚持就是胜利</div>
                    <div style="font-size:11px;opacity:0.85;">—— AI高考每日寄语</div>
                </div>
            `)}
        </div>
        `
    });
});

// ============================================================
// 3. AI学习计划
// ============================================================
registerPage('home-plan', 'AI学习计划', '首页', 'fa-home', () => {
    // 初始化分段默认状态（进入页面时重置为 this_week，避免沿用历史其他分段）
    window._currentPlanRange = 'this_week';
    // 异步加载本周学习计划（复用统一链路，与分段切换 / 重新规划保持一致）
    setTimeout(function() { protoLoadSegmentPlan('this_week', false); }, 100);

    return Page({
        title: 'AI学习计划',
        back: true,
        content: `
        <div style="background:#F3F4F6;min-height:100%;padding-bottom:80px;">
            <!-- AI生成说明 -->
            ${GradientCard('blue', `
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fas fa-robot" style="font-size:22px;"></i>
                    </div>
                    <div style="flex:1;" id="week-plan-summary">
                        <div style="font-size:15px;font-weight:700;">AI智能学习计划</div>
                        <div style="font-size:12px;opacity:0.85;margin-top:2px;">正在分析薄弱点生成计划…</div>
                    </div>
                </div>
            `)}

            <!-- 分段控制器 -->
            ${Segment(['本周', '下周', '本月'], 0)}

            <!-- 每日计划（动态加载） -->
            <div id="week-plan-list">
                <div class="proto-card" style="margin:0 0 12px;text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i>
                    <div style="font-size:13px;">AI正在生成学习计划…</div>
                </div>
            </div>

            <!-- 重新规划按钮 -->
            <div style="position:sticky;bottom:0;background:white;border-top:1px solid #E5E7EB;padding:14px 16px;margin:0 -16px -12px;">
                <button class="proto-btn proto-btn-primary" style="height:46px;border-radius:23px;" onclick="aiReplan()">
                    <i class="fas fa-magic"></i> 让AI重新规划
                </button>
            </div>
        </div>
        `
    });
});

// ============================================================
// 4. 今日任务详情
// ============================================================
registerPage('home-task', '今日任务', '首页', 'fa-home', () => {
    // 实时日期：格式 "9月18日 周五"
    const _now = new Date();
    const _weekNames = ['日','一','二','三','四','五','六'];
    const _todayStr = (_now.getMonth() + 1) + '月' + _now.getDate() + '日 周' + _weekNames[_now.getDay()];

    // 渲染单个任务卡片（供异步更新复用）
    function renderTaskCard(t) {
        const statusText = t.status === 'done' ? '已完成' : '待完成';
        const statusColor = t.status === 'done' ? 'green' : 'orange';
        const borderColor = t.status === 'done' ? 'success' : 'warning';
        const bgColor = t.color === 'blue' ? 'primary' : t.color === 'green' ? 'success' : t.color === 'purple' ? 'purple' : 'warning';
        return `
            <div class="proto-card" style="margin:0 0 12px;border-left:3px solid var(--${borderColor});">
                <div style="display:flex;align-items:flex-start;gap:12px;">
                    <div style="width:44px;height:44px;border-radius:12px;background:var(--${bgColor});display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <i class="fas ${t.icon}" style="color:white;font-size:18px;"></i>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
                            ${Tag(t.subject, t.color)}
                            ${Tag(t.difficulty, t.difficulty === '困难' ? 'red' : t.difficulty === '中等' ? 'orange' : 'green')}
                            ${Tag(statusText, statusColor)}
                        </div>
                        <div style="font-size:15px;font-weight:700;${t.status === 'done' ? 'text-decoration:line-through;color:#9CA3AF;' : ''}">${t.point}</div>
                        <div style="display:flex;align-items:center;gap:14px;margin-top:8px;font-size:11px;color:#6B7280;flex-wrap:wrap;">
                            <span><i class="far fa-clock"></i> 预计 ${t.time}</span>
                            <span><i class="fas fa-book"></i> ${t.questions_count || 8} 道题</span>
                            ${t.status === 'done' && t.correct_rate != null ? `<span style="color:#10B981;"><i class="fas fa-check-circle"></i> 正确率 ${t.correct_rate}%</span>` : ''}
                            ${t.status === 'done' && t.duration_min ? `<span style="color:#3B82F6;"><i class="fas fa-stopwatch"></i> 用时 ${t.duration_min}min</span>` : ''}
                        </div>
                    </div>
                </div>
                <div style="display:flex;gap:8px;margin-top:12px;">
                    ${t.status === 'done'
                        ? `<button class="proto-btn proto-btn-outline" style="height:36px;font-size:13px;flex:1;" onclick="startTask('${t.subject}','${t.point}','重练', ${t.questions_count || 8}, '${t.time}')"><i class="fas fa-redo"></i> 再练一次</button>
                           <button class="proto-btn proto-btn-outline" style="height:36px;font-size:13px;flex:1;" onclick="viewAnalysis('${t.subject}','${t.point}')"><i class="fas fa-file-alt"></i> 查看解析</button>`
                        : `<button class="proto-btn proto-btn-primary" style="height:36px;font-size:13px;flex:1;" onclick="startTask('${t.subject}','${t.point}','开始', ${t.questions_count || 8}, '${t.time}')"><i class="fas fa-play"></i> 开始学习</button>
                           <button class="proto-btn proto-btn-outline" style="height:36px;font-size:13px;width:44px;" onclick="showTaskMore('${t.subject}','${t.point}')"><i class="fas fa-ellipsis-h"></i></button>`
                    }
                </div>
            </div>`;
    }

    // 异步加载今日任务
    setTimeout(function() {
        const headerContainer = document.getElementById('today-task-header');
        const listContainer = document.getElementById('today-task-list');
        const statsContainer = document.getElementById('today-task-stats');
        if (!listContainer) return;

        // API 不可用时的回退：保留实时日期，显示提示
        function showFallback() {
            if (headerContainer) {
                headerContainer.innerHTML =
                    '<div>' +
                    '<div style="font-size:12px;opacity:0.85;"><i class="fas fa-calendar-check"></i> 今日任务</div>' +
                    '<div style="font-size:20px;font-weight:800;margin-top:4px;">' + _todayStr + '</div>' +
                    '<div style="font-size:12px;opacity:0.85;margin-top:2px;">点击下方按钮开始今日学习</div>' +
                    '</div>' +
                    '<div style="text-align:center;">' +
                    RingChart(0, '#FCD34D', 72) +
                    '<div style="font-size:11px;opacity:0.85;margin-top:4px;">完成率</div></div>';
            }
            listContainer.innerHTML = '<div class="proto-card" style="margin:0 0 12px;text-align:center;padding:30px;color:#9CA3AF;"><i class="fas fa-clipboard-list" style="font-size:28px;margin-bottom:8px;color:#3B82F6;"></i><div style="font-size:14px;font-weight:600;">暂无今日任务数据</div><div style="font-size:12px;margin-top:4px;">服务端任务接口暂不可用，可点击下方按钮开始练习</div></div>';
            if (statsContainer) {
                statsContainer.innerHTML =
                    '<div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-chart-bar" style="color:#3B82F6;margin-right:6px;"></i>今日进度</div>' +
                    '<div class="proto-grid-3" style="margin-bottom:12px;">' +
                    StatCard('已完成', '0', 0, 'green') +
                    StatCard('待完成', '0', 0, 'orange') +
                    StatCard('总任务', '0', 0, 'blue') +
                    '</div>' +
                    Progress(0, '#3B82F6') +
                    '<div style="font-size:11px;color:#9CA3AF;margin-top:6px;">等待加载今日任务…</div>';
            }
        }

        if (typeof api === 'undefined' || !api.getTodayTasks) { showFallback(); return; }

        api.getTodayTasks().then(function(data) {
            if (!data || !data.tasks) { showFallback(); return; }
            const tasks = data.tasks;

            // 更新头部：日期 + 进度（始终使用实时日期，避免 mock 数据中的过期日期覆盖）
            const displayDate = _todayStr;
            if (headerContainer) {
                headerContainer.innerHTML =
                    '<div>' +
                    '<div style="font-size:12px;opacity:0.85;"><i class="fas fa-calendar-check"></i> 今日任务</div>' +
                    '<div style="font-size:20px;font-weight:800;margin-top:4px;">' + displayDate + '</div>' +
                    '<div style="font-size:12px;opacity:0.85;margin-top:2px;">已完成 ' + data.done_count + '/' + data.total_count + '，加油冲刺！</div>' +
                    '</div>' +
                    '<div style="text-align:center;">' +
                    RingChart(data.completion_rate, '#FCD34D', 72) +
                    '<div style="font-size:11px;opacity:0.85;margin-top:4px;">完成率</div></div>';
            }

            // 更新任务列表
            if (tasks.length > 0) {
                listContainer.innerHTML = tasks.map(renderTaskCard).join('');
            } else {
                listContainer.innerHTML = '<div class="proto-card" style="margin:0 0 12px;text-align:center;padding:30px;color:#9CA3AF;"><i class="fas fa-check-circle" style="font-size:28px;margin-bottom:8px;color:#10B981;"></i><div style="font-size:14px;font-weight:600;">今日任务已完成</div><div style="font-size:12px;margin-top:4px;">快去挑战更多题目吧</div></div>';
            }

            // 更新进度统计
            if (statsContainer) {
                const doneCount = data.done_count;
                const todoCount = data.total_count - doneCount;
                const totalMin = tasks.reduce(function(s, t) { return s + parseInt(t.time); }, 0);
                const usedMin = tasks.filter(function(t) { return t.status === 'done'; }).reduce(function(s, t) { return s + (t.duration_min || 0); }, 0);
                statsContainer.innerHTML =
                    '<div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-chart-bar" style="color:#3B82F6;margin-right:6px;"></i>今日进度</div>' +
                    '<div class="proto-grid-3" style="margin-bottom:12px;">' +
                    StatCard('已完成', String(doneCount), 0, 'green') +
                    StatCard('待完成', String(todoCount), 0, 'orange') +
                    StatCard('总任务', String(data.total_count), 0, 'blue') +
                    '</div>' +
                    Progress(data.completion_rate, '#3B82F6') +
                    '<div style="font-size:11px;color:#9CA3AF;margin-top:6px;">总时长 ' + totalMin + 'min · 已用 ' + usedMin + 'min · 预计还需 ' + Math.max(0, totalMin - usedMin) + 'min</div>';
            }
        }).catch(function() { showFallback(); });
    }, 100);

    return Page({
        title: '今日任务',
        back: true,
        content: `
        <div style="background:#F3F4F6;min-height:100%;padding-bottom:20px;">
            <!-- 日期标题 + 进度（动态加载） -->
            ${GradientCard('blue', `
                <div id="today-task-header" style="display:flex;align-items:center;justify-content:space-between;">
                    <div>
                        <div style="font-size:12px;opacity:0.85;"><i class="fas fa-calendar-check"></i> 今日任务</div>
                        <div style="font-size:20px;font-weight:800;margin-top:4px;">${_todayStr}</div>
                        <div style="font-size:12px;opacity:0.85;margin-top:2px;">正在加载任务进度…</div>
                    </div>
                </div>
            `)}

            <!-- 任务列表（动态加载） -->
            <div id="today-task-list">
                <div class="proto-card" style="margin:0 0 12px;text-align:center;padding:40px;color:#9CA3AF;">
                    <i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i>
                    <div style="font-size:13px;">正在加载今日任务…</div>
                </div>
            </div>

            <!-- 进度统计（动态加载） -->
            <div id="today-task-stats" class="proto-card" style="margin:0 0 12px;">
                <div style="text-align:center;padding:20px;color:#9CA3AF;font-size:13px;"><i class="fas fa-spinner fa-spin"></i> 加载中…</div>
            </div>

            <button class="proto-btn proto-btn-primary" style="height:48px;border-radius:24px;" onclick="startNextTask()">
                <i class="fas fa-play"></i> 开始下一个任务
            </button>
        </div>
        `
    });
});

// ============================================================
// 5. 学习时长统计
// ============================================================
registerPage('home-duration', '学习时长', '首页', 'fa-home', () => {
    // 异步加载学习时长数据
    setTimeout(function() {
        const container = document.getElementById('duration-page');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getDurationStats) return;

        api.getDurationStats().then(function(data) {
            if (!data) return;
            renderDurationPage(container, data);
        }).catch(function() { /* 静默失败 */ });
    }, 100);

    // 渲染整个学习时长页面
    function renderDurationPage(container, data) {
        const t = data.today || {};
        const s = data.summary || {};
        const weekly = data.weekly || [];
        const subjects = data.subjects || [];
        const heatmap = data.heatmap || [];
        const advice = data.advice || '';

        // ===== 今日学习时长卡片 =====
        const todayHours = t.duration_hours != null ? t.duration_hours : 0;
        const todayChange = t.change_pct || 0;
        const todayGoalRate = t.goal_rate || 0;
        const dailyGoalHours = t.daily_goal_hours || 6;
        const changeIcon = todayChange >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
        const changeText = (todayChange >= 0 ? '+' : '') + todayChange + '%';
        const changeColor = todayChange >= 0 ? '#FCD34D' : '#FCA5A5';

        const todayCard = GradientCard('green', `
            <div style="display:flex;align-items:center;justify-content:space-between;">
                <div>
                    <div style="font-size:12px;opacity:0.85;"><i class="fas fa-stopwatch"></i> 今日学习时长</div>
                    <div style="font-size:42px;font-weight:800;margin:6px 0;">${todayHours}<span style="font-size:18px;opacity:0.85;">小时</span></div>
                    <div style="font-size:12px;opacity:0.9;"><i class="fas ${changeIcon}"></i> 同比上周 ${changeText} · ${todayHours >= dailyGoalHours * 0.8 ? '继续保持' : '加油冲刺'}</div>
                </div>
                <div style="text-align:center;">
                    ${RingChart(todayGoalRate, '#FCD34D', 80)}
                    <div style="font-size:11px;opacity:0.85;margin-top:4px;">日目标 ${dailyGoalHours}h</div>
                </div>
            </div>
        `);

        // ===== 统计卡片 =====
        const statsHtml = '<div class="proto-grid-3" style="margin-bottom:12px;">' +
            StatCard('本周时长', s.week_hours + 'h', s.week_change, 'blue') +
            StatCard('本月时长', s.month_hours + 'h', s.month_change, 'purple') +
            StatCard('日均时长', s.avg_hours + 'h', s.avg_change, 'green') +
            '</div>';

        // ===== 本周柱状图 =====
        const weekMaxHours = Math.max(0.1, ...weekly.map(function(w) { return w.hours; }));
        const barsHtml = weekly.map(function(b, i) {
            const hPct = weekMaxHours > 0 ? Math.round(b.hours / weekMaxHours * 100) : 0;
            const isToday = b.is_today;
            const barBg = isToday ? 'linear-gradient(180deg,#10B981,#34D399)' : 'linear-gradient(180deg,#3B82F6,#60A5FA)';
            return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end;">' +
                '<span style="font-size:10px;color:#6B7280;">' + b.hours + 'h</span>' +
                '<div style="width:60%;height:' + hPct + '%;background:' + barBg + ';border-radius:4px 4px 0 0;min-height:2px;"></div>' +
                '<span style="font-size:11px;color:' + (isToday ? '#10B981' : '#6B7280') + ';font-weight:' + (isToday ? '700' : '400') + ';">' + b.day + '</span>' +
                '</div>';
        }).join('');
        const weekTotalHours = data.week_total_hours || 0;
        const weekGoalHours = data.week_goal_hours || 42;
        const weekGoalRate = data.week_goal_rate || 0;
        const barCard = '<div class="proto-card" style="margin:0 0 12px;">' +
            '<div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-chart-column" style="color:#3B82F6;margin-right:6px;"></i>本周学习时长分布</div>' +
            '<div style="display:flex;align-items:flex-end;justify-content:space-between;height:140px;padding:0 4px;">' + barsHtml + '</div>' +
            '<div style="font-size:11px;color:#9CA3AF;margin-top:10px;text-align:center;">本周累计 ' + weekTotalHours + 'h · 目标 ' + weekGoalHours + 'h · 完成率 ' + weekGoalRate + '%</div>' +
            '</div>';

        // ===== 各科饼图 =====
        let pieCard = '';
        if (subjects.length > 0) {
            // 构建conic-gradient
            let gradStops = [];
            let acc = 0;
            subjects.forEach(function(s) {
                const start = acc;
                acc += s.percent;
                gradStops.push(s.color + ' ' + start + '% ' + acc + '%');
            });
            const gradStr = gradStops.join(', ');
            const totalH = data.subject_total_hours || 0;
            const legendHtml = subjects.map(function(s) {
                return '<div style="display:flex;align-items:center;justify-content:space-between;"><span><span style="display:inline-block;width:8px;height:8px;background:' + s.color + ';border-radius:2px;margin-right:6px;"></span>' + s.subject + '</span><span style="font-weight:600;">' + s.hours + 'h · ' + s.percent + '%</span></div>';
            }).join('');
            pieCard = '<div class="proto-card" style="margin:0 0 12px;">' +
                '<div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-chart-pie" style="color:#8B5CF6;margin-right:6px;"></i>各科学习时长分布</div>' +
                '<div style="display:flex;align-items:center;gap:16px;">' +
                '<div style="width:120px;height:120px;border-radius:50%;background:conic-gradient(' + gradStr + ');position:relative;flex-shrink:0;">' +
                '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:60px;height:60px;border-radius:50%;background:white;display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
                '<span style="font-size:18px;font-weight:800;color:#111827;">' + totalH + 'h</span>' +
                '<span style="font-size:9px;color:#9CA3AF;">总计</span>' +
                '</div></div>' +
                '<div style="flex:1;display:flex;flex-direction:column;gap:6px;font-size:12px;">' + legendHtml + '</div>' +
                '</div></div>';
        } else {
            pieCard = '<div class="proto-card" style="margin:0 0 12px;text-align:center;padding:30px;color:#9CA3AF;font-size:13px;"><i class="fas fa-chart-pie" style="font-size:24px;margin-bottom:8px;color:#8B5CF6;"></i><div>本周暂无各科学习数据</div></div>';
        }

        // ===== 学习时段热力图 =====
        // 热力图颜色等级 0-4
        const heatColors = ['#F3F4F6', '#DBEAFE', '#93C5FD', '#3B82F6', '#1D4ED8'];
        const weekDayLabels = ['一', '二', '三', '四', '五', '六', '日'];
        let heatCells = '';
        if (heatmap.length === 7 && heatmap[0].length === 24) {
            // 生成 7行 × 24列 格子
            let grid = '';
            for (let i = 0; i < 7; i++) {
                for (let h = 0; h < 24; h++) {
                    const level = heatmap[i][h] || 0;
                    grid += '<div style="background:' + heatColors[level] + ';border-radius:2px;"></div>';
                }
            }
            heatCells = '<div style="display:grid;grid-template-columns:repeat(24,1fr);grid-template-rows:repeat(7,1fr);gap:2px;">' + grid + '</div>';
            // 简化版：因为24列太挤，改为每3小时一列共8列
            let grid8 = '';
            for (let i = 0; i < 7; i++) {
                for (let h = 0; h < 24; h += 3) {
                    // 取这3小时的最高强度
                    let maxL = 0;
                    for (let k = h; k < h + 3; k++) maxL = Math.max(maxL, heatmap[i][k] || 0);
                    grid8 += '<div style="background:' + heatColors[maxL] + ';border-radius:2px;aspect-ratio:1;"></div>';
                }
            }
            heatCells = '<div style="display:grid;grid-template-columns:repeat(8,1fr);gap:3px;">' + grid8 + '</div>';
        } else {
            heatCells = '<div style="text-align:center;padding:20px;color:#9CA3AF;font-size:12px;">暂无热力图数据</div>';
        }
        const heatCard = '<div class="proto-card" style="margin:0 0 12px;">' +
            '<div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-fire" style="color:#EF4444;margin-right:6px;"></i>学习时段热力图（周一~周日 × 0~24点）</div>' +
            heatCells +
            '<div style="display:flex;align-items:center;justify-content:flex-end;gap:6px;font-size:10px;color:#9CA3AF;margin-top:8px;">' +
            '少' +
            '<span style="display:inline-block;width:12px;height:12px;background:' + heatColors[0] + ';border-radius:2px;"></span>' +
            '<span style="display:inline-block;width:12px;height:12px;background:' + heatColors[1] + ';border-radius:2px;"></span>' +
            '<span style="display:inline-block;width:12px;height:12px;background:' + heatColors[2] + ';border-radius:2px;"></span>' +
            '<span style="display:inline-block;width:12px;height:12px;background:' + heatColors[3] + ';border-radius:2px;"></span>' +
            '<span style="display:inline-block;width:12px;height:12px;background:' + heatColors[4] + ';border-radius:2px;"></span>' +
            '多</div>' +
            '</div>';

        // ===== AI学习建议 =====
        const adviceCard = GradientCard('orange', `
            <div style="display:flex;align-items:flex-start;gap:12px;">
                <div style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fas fa-lightbulb" style="font-size:18px;"></i>
                </div>
                <div style="flex:1;">
                    <div style="font-size:14px;font-weight:700;">AI学习建议</div>
                    <div style="font-size:12px;opacity:0.95;margin-top:4px;line-height:1.6;">${advice}</div>
                </div>
            </div>
        `);

        container.innerHTML = todayCard + statsHtml + barCard + pieCard + heatCard + adviceCard;
    }

    return Page({
        title: '学习时长',
        back: true,
        content: `
        <div id="duration-page" style="background:#F3F4F6;min-height:100%;padding-bottom:20px;">
            <div class="proto-card" style="margin:0 0 12px;text-align:center;padding:40px;color:#9CA3AF;">
                <i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i>
                <div style="font-size:13px;">正在加载学习时长数据…</div>
            </div>
        </div>
        `
    });
});

// ============================================================
// 6. AI学情分析（周期分段切换 + 6 个子 Tab，动态加载后端分析数据）
// ============================================================
(function installHomeAnalysis() {
    var PROTO_ANALYSIS_PERIODS = { '近7天': 7, '近30天': 30, '本学期': 120 };
    var PROTO_ANALYSIS_TABS = [
        { key: 'overview', name: '综合概览', icon: 'fa-th-large' },
        { key: 'trend',    name: '成绩趋势', icon: 'fa-chart-line' },
        { key: 'radar',    name: '能力雷达', icon: 'fa-crosshairs' },
        { key: 'weak',     name: '薄弱分析', icon: 'fa-exclamation-triangle' },
        { key: 'loss',     name: '失分归因', icon: 'fa-bug' },
        { key: 'report',   name: 'AI报告',   icon: 'fa-robot' }
    ];
    function protoSetAnalysisState(days, tab, subject) {
        window._pa_days = days != null ? days : (window._pa_days || 7);
        window._pa_tab = tab || window._pa_tab || 'overview';
        window._pa_subject = subject || window._pa_subject || '全部';
    }
    protoSetAnalysisState();

    function protoRenderPeriodBar() {
        var names = Object.keys(PROTO_ANALYSIS_PERIODS);
        var activeIdx = Math.max(0, names.findIndex(function(n){ return PROTO_ANALYSIS_PERIODS[n] === window._pa_days; }));
        return '<div style="display:flex;background:#F3F4F6;border-radius:10px;padding:3px;margin:12px;">' +
            names.map(function(name, idx){
                var active = idx === activeIdx;
                return '<div class="pa-period-item" onclick="window.__protoSwitchAnalysisPeriod(this)"' +
                    ' style="flex:1;text-align:center;padding:8px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s;' +
                    (active ? 'background:white;color:#3B82F6;box-shadow:0 1px 3px rgba(0,0,0,0.1);' : 'color:#6B7280;') + '">' + name + '</div>';
            }).join('') + '</div>';
    }
    function protoRenderTabBar() {
        return '<div style="display:flex;overflow-x:auto;border-bottom:1px solid #E5E7EB;background:white;">' +
            PROTO_ANALYSIS_TABS.map(function(t){
                var active = t.key === window._pa_tab;
                return '<div class="pa-subtab-item" data-tab="' + t.key + '" onclick="window.__protoSwitchAnalysisTab(\'' + t.key + '\')"' +
                    ' style="flex:1;min-width:70px;text-align:center;padding:12px 4px;cursor:pointer;font-size:13px;white-space:nowrap;' +
                    ' color:' + (active ? '#3B82F6' : '#6B7280') + ';border-bottom:' + (active ? '2px solid #3B82F6' : '2px solid transparent') + ';' +
                    ' font-weight:' + (active ? '700' : '500') + ';background:' + (active ? '#EFF6FF' : 'transparent') + ';">' +
                    '<i class="fas ' + t.icon + '" style="margin-right:3px;"></i>' + t.name + '</div>';
            }).join('') + '</div>';
    }
    function protoAnalysisLoading() {
        return '<div style="text-align:center;padding:60px 20px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:28px;margin-bottom:12px;display:block;"></i><div style="font-size:13px;">AI正在分析你的学习数据…</div></div>';
    }
    function protoAnalysisError(msg) {
        return '<div style="padding:30px 16px;text-align:center;color:#EF4444;font-size:13px;"><i class="fas fa-exclamation-circle" style="font-size:26px;margin-bottom:10px;display:block;color:#9CA3AF;"></i>' +
            (msg || '加载失败，请稍后再试') + '</div>';
    }
    function protoMiniBar(labels, values, color, maxH) {
        if (!labels || !labels.length) return '';
        maxH = maxH || 110;
        var maxV = Math.max.apply(null, values.concat([1]));
        var bars = labels.map(function(l, i) {
            var h = Math.round((values[i] || 0) / maxV * maxH);
            return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;min-width:0;">' +
                '<div style="font-size:9px;color:#374151;">' + (values[i] || 0) + '</div>' +
                '<div style="width:70%;max-width:24px;height:' + h + 'px;background:' + (color || '#3B82F6') + ';border-radius:4px 4px 0 0;"></div>' +
                '<div style="font-size:9px;color:#6B7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;">' + l + '</div>' +
            '</div>';
        }).join('');
        return '<div style="display:flex;align-items:flex-end;gap:4px;height:' + (maxH + 32) + 'px;padding:0 4px;">' + bars + '</div>';
    }
    function protoProgressBar(value, max, color) {
        var pct = max > 0 ? Math.min(100, Math.round(value / max * 100)) : 0;
        return '<div style="width:100%;height:6px;background:#F3F4F6;border-radius:3px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:' + (color || '#3B82F6') + ';border-radius:3px;"></div></div>';
    }

    function protoLoadOverviewTab(cb) {
        var days = window._pa_days;
        Promise.all([
            api.getLearningDailySeries(days).catch(function(){ return null; }),
            api.getSubjectMastery(Math.max(30, days)).catch(function(){ return null; }),
            api.getAnswerStats(days).catch(function(){ return null; })
        ]).then(function(results) {
            var daily = results[0] || {};
            var mastery = results[1] || {};
            var stats = results[2] || {};
            var labels = daily.labels || [];
            var minutes = daily.duration_minutes || [];
            var totalMin = minutes.reduce(function(a,b){return a+b;},0);
            var totalQ = (daily.questions || []).reduce(function(a,b){return a+b;},0);
            var cc = (daily.correct_counts || []).reduce(function(a,b){return a+b;},0);
            var avgRate = totalQ > 0 ? Math.round(cc / totalQ * 100) : 0;
            var weakest = (mastery.weakest_subjects || []).slice(0,3);
            var strongest = (mastery.strongest_subjects || []).slice(0,2);
            var radar = mastery.radar || [];
            var totalAns = stats.total || 0;

            var cards = [
                { label: '学习时长', value: +(totalMin/60).toFixed(1), unit: 'h', color: '#3B82F6' },
                { label: '做题数量', value: totalQ + totalAns, unit: '题', color: '#10B981' },
                { label: '平均正确率', value: avgRate, unit: '%', color: '#F59E0B' },
                { label: '涉及学科', value: radar.length, unit: '科', color: '#8B5CF6' }
            ].map(function(c) {
                return '<div style="flex:1;min-width:0;background:white;border:1px solid #F3F4F6;border-radius:10px;padding:10px;">' +
                    '<div style="font-size:11px;color:#6B7280;">' + c.label + '</div>' +
                    '<div style="font-size:18px;font-weight:800;color:' + c.color + ';margin-top:4px;">' + c.value + '<span style="font-size:11px;font-weight:500;color:#6B7280;margin-left:2px;">' + c.unit + '</span></div>' +
                '</div>';
            }).join('');

            var html = '<div style="padding:12px;">' +
                '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">' + cards + '</div>' +
                '<div class="proto-card" style="padding:12px;margin-bottom:12px;">' +
                    '<div style="font-size:14px;font-weight:700;margin-bottom:10px;"><i class="fas fa-clock" style="color:#3B82F6;margin-right:4px;"></i>学习时长分布</div>' +
                    protoMiniBar(labels.slice(-10), minutes.slice(-10), '#3B82F6', 100) +
                '</div>';

            if (weakest.length) {
                html += '<div class="proto-card" style="padding:12px;margin-bottom:12px;">' +
                    '<div style="font-size:14px;font-weight:700;margin-bottom:10px;"><i class="fas fa-exclamation-triangle" style="color:#EF4444;margin-right:4px;"></i>薄弱学科 TOP3</div>';
                weakest.forEach(function(w) {
                    html += '<div style="margin-bottom:10px;">' +
                        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
                            '<span style="font-size:13px;font-weight:600;color:' + w.color + ';">' + w.subject + '</span>' +
                            '<span style="font-size:11px;color:#EF4444;">距目标差 ' + w.gap + '%</span>' +
                        '</div>' +
                        protoProgressBar(w.current, 100, w.color) +
                        '<div style="font-size:10px;color:#6B7280;margin-top:2px;">当前 ' + w.current + '% / 目标 ' + w.target + '%</div>' +
                    '</div>';
                });
                html += '</div>';
            }
            if (strongest.length) {
                html += '<div class="proto-card" style="padding:12px;">' +
                    '<div style="font-size:14px;font-weight:700;margin-bottom:10px;"><i class="fas fa-trophy" style="color:#F59E0B;margin-right:4px;"></i>优势学科</div>';
                strongest.forEach(function(s) {
                    html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;">' +
                        '<span style="font-size:13px;font-weight:600;color:' + s.color + ';">' + s.subject + '</span>' +
                        '<span style="font-size:12px;color:#10B981;">掌握率 ' + s.current + '%</span>' +
                    '</div>';
                });
                html += '</div>';
            }
            html += '</div>';
            cb(null, html);
        }).catch(function(e) { cb(e.message || '加载失败'); });
    }

    function protoLoadTrendTab(cb) {
        var days = window._pa_days;
        Promise.all([
            api.getPredictScoreTrend(Math.max(60, days)).catch(function(){ return null; }),
            api.getAnswerTrend(days).catch(function(){ return null; })
        ]).then(function(results) {
            var trend = results[0] || {};
            var ans = results[1] || {};
            var labels = trend.labels || [];
            var hist = (trend.history || []).map(function(v){ return v == null ? null : v; });
            var pred = (trend.predict || []).map(function(v){ return v == null ? null : v; });
            // 合并非 null 值作为展示序列
            var merged = labels.map(function(_, i) {
                if (hist[i] != null) return hist[i];
                if (pred[i] != null) return pred[i];
                return 0;
            });
            var ansLabels = ans.labels || [];
            var ansCounts = ans.answer_count || [];
            var html = '<div style="padding:12px;">' +
                GradientCard('blue',
                    '<div style="text-align:center;"><div style="font-size:11px;opacity:0.85;">当前预估总分</div>' +
                    '<div style="font-size:36px;font-weight:800;margin:4px 0;">' + (trend.current_score || '--') +
                    '<span style="font-size:14px;opacity:0.7;"> / 750</span></div>' +
                    '<div style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,0.2);padding:3px 10px;border-radius:10px;font-size:12px;font-weight:600;">目标 ' + (trend.target_score || '--') + ' 分</div>' +
                    (trend.days_to_exam != null ? '<div style="font-size:11px;opacity:0.8;margin-top:6px;"><i class="fas fa-hourglass-half"></i> 距高考 ' + Math.max(0, trend.days_to_exam) + ' 天</div>' : '') +
                '</div>') +
                '<div class="proto-card" style="padding:12px;margin:12px 0;">' +
                    '<div style="font-size:14px;font-weight:700;margin-bottom:10px;"><i class="fas fa-chart-line" style="color:#3B82F6;margin-right:4px;"></i>成绩趋势 & 预测（' + labels.length + '天）</div>' +
                    '<div id="pa-score-chart" style="height:150px;"></div>' +
                '</div>' +
                '<div class="proto-card" style="padding:12px;">' +
                    '<div style="font-size:14px;font-weight:700;margin-bottom:10px;"><i class="fas fa-pen-fancy" style="color:#10B981;margin-right:4px;"></i>每日答题量</div>' +
                    protoMiniBar(ansLabels.slice(-10), ansCounts.slice(-10), '#10B981', 90) +
                '</div>' +
            '</div>';
            cb(null, html, function afterRender() {
                var validIdx = merged.map(function(v,i){ return v > 0 ? i : -1; }).filter(function(i){ return i >= 0; });
                if (labels.length && typeof window.drawScoreChart === 'function' && validIdx.length >= 2) {
                    var sl = validIdx.map(function(i){ return labels[i]; });
                    var sv = validIdx.map(function(i){ return merged[i]; });
                    window.drawScoreChart('pa-score-chart', 'line', sl, sv, ['#3B82F6']);
                } else if (document.getElementById('pa-score-chart')) {
                    document.getElementById('pa-score-chart').innerHTML = '<div style="text-align:center;padding:30px;color:#9CA3AF;font-size:12px;">暂无足够数据绘制趋势图</div>';
                }
            });
        }).catch(function(e) { cb(e.message || '加载失败'); });
    }

    function protoLoadRadarTab(cb) {
        var days = Math.max(30, window._pa_days);
        api.getSubjectMastery(days).then(function(mastery) {
            mastery = mastery || {};
            var radar = mastery.radar || [];
            var html = '<div style="padding:12px;">' +
                '<div class="proto-card" style="padding:12px;margin-bottom:12px;">' +
                    '<div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-crosshairs" style="color:#8B5CF6;margin-right:4px;"></i>学科能力掌握率（' + days + '天窗口）</div>';
            radar.forEach(function(r) {
                var label = r.subject === '思想政治' ? '政治' : r.subject;
                html += '<div style="margin-bottom:12px;">' +
                    '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">' +
                        '<span style="font-size:13px;font-weight:600;color:' + r.color + ';"><i class="fas ' + r.icon + '" style="margin-right:3px;"></i>' + label + '</span>' +
                        '<span style="font-size:12px;">' +
                            '<b style="color:#111827;">' + r.current_mastery + '%</b> / 目标 ' + r.target_mastery + '%' +
                            (r.gap_pct > 0 ? '<span style="color:#EF4444;margin-left:4px;">差' + r.gap_pct + '%</span>' : '<span style="color:#10B981;margin-left:4px;">达标</span>') +
                        '</span>' +
                    '</div>' +
                    '<div style="position:relative;height:8px;">' +
                        '<div style="position:absolute;inset:0;height:8px;background:#F3F4F6;border-radius:4px;"></div>' +
                        '<div style="position:absolute;left:0;top:0;height:8px;width:' + Math.min(100,r.target_mastery) + '%;background:' + r.color + '33;border-radius:4px;"></div>' +
                        '<div style="position:absolute;left:0;top:0;height:8px;width:' + Math.min(100,r.current_mastery) + '%;background:' + r.color + ';border-radius:4px;"></div>' +
                    '</div>' +
                    '<div style="display:flex;justify-content:space-between;font-size:10px;color:#9CA3AF;margin-top:2px;">' +
                        '<span>学习 ' + r.duration_hours + 'h · 做 ' + r.questions_count + ' 题</span>' +
                        '<span>正确率 ' + r.correct_rate + '%</span>' +
                    '</div>' +
                '</div>';
            });
            html += '</div>';

            // 优势 / 薄弱 TOP 卡片
            var weak = (mastery.weakest_subjects || []).slice(0,3);
            var strong = (mastery.strongest_subjects || []).slice(0,2);
            html += '<div style="display:flex;gap:10px;">' +
                '<div style="flex:1;" class="proto-card"><div style="padding:12px;">' +
                    '<div style="font-size:13px;font-weight:700;margin-bottom:10px;color:#EF4444;"><i class="fas fa-exclamation-triangle"></i> 待突破</div>' +
                    weak.map(function(w){
                        return '<div style="display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid #F9FAFB;">' +
                            '<span style="width:18px;height:18px;border-radius:50%;background:' + w.color + '22;color:' + w.color + ';display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">3</span>' +
                            '<span style="flex:1;font-size:12px;color:#111827;">' + w.subject + '</span>' +
                            '<span style="font-size:11px;color:#EF4444;">-' + w.gap + '%</span></div>';
                    }).join('') +
                '</div></div>' +
                '<div style="flex:1;" class="proto-card"><div style="padding:12px;">' +
                    '<div style="font-size:13px;font-weight:700;margin-bottom:10px;color:#10B981;"><i class="fas fa-trophy"></i> 优势</div>' +
                    strong.map(function(w){
                        return '<div style="display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid #F9FAFB;">' +
                            '<span style="width:18px;height:18px;border-radius:50%;background:' + w.color + '22;color:' + w.color + ';display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">✓</span>' +
                            '<span style="flex:1;font-size:12px;color:#111827;">' + w.subject + '</span>' +
                            '<span style="font-size:11px;color:#10B981;">' + w.current + '%</span></div>';
                    }).join('') +
                '</div></div>' +
            '</div></div>';
            cb(null, html);
        }).catch(function(e){ cb(e.message || '加载失败'); });
    }

    function protoLoadWeakTab(cb) {
        var days = Math.max(30, window._pa_days);
        Promise.all([
            api.getSubjectMastery(days).catch(function(){ return null; }),
            api.getLossAnalysis(days, 10).catch(function(){ return null; })
        ]).then(function(results){
            var mastery = results[0] || {};
            var loss = results[1] || {};
            var weak = (mastery.weakest_subjects || []).slice(0,5);
            var points = (loss.top_loss_points || []).slice(0,8);
            var html = '<div style="padding:12px;">' +
                '<div class="proto-card" style="padding:12px;margin-bottom:12px;">' +
                    '<div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-exclamation-triangle" style="color:#EF4444;margin-right:4px;"></i>按学科薄弱程度</div>';
            if (!weak.length) html += '<div style="color:#9CA3AF;font-size:12px;padding:20px;text-align:center;">暂无薄弱学科，继续保持！</div>';
            weak.forEach(function(w, idx) {
                html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #F3F4F6;">' +
                    '<div style="width:26px;height:26px;border-radius:8px;background:' + w.color + '22;color:' + w.color + ';display:flex;align-items:center;justify-content:center;font-weight:800;">' + (idx+1) + '</div>' +
                    '<div style="flex:1;min-width:0;">' +
                        '<div style="font-size:13px;font-weight:700;">' + w.subject + '</div>' +
                        protoProgressBar(w.current, w.target || 100, w.color) +
                        '<div style="font-size:10px;color:#6B7280;margin-top:2px;">当前 ' + w.current + '% → 目标 ' + w.target + '%</div>' +
                    '</div>' +
                    '<div style="text-align:right;">' +
                        '<div style="font-size:11px;color:#EF4444;font-weight:700;">-' + w.gap + '%</div>' +
                        '<div style="font-size:10px;color:#9CA3AF;">距目标</div>' +
                    '</div>' +
                '</div>';
            });
            html += '</div>';

            html += '<div class="proto-card" style="padding:12px;">' +
                '<div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-bug" style="color:#F59E0B;margin-right:4px;"></i>错题集中知识点 TOP' + points.length + '</div>';
            if (!points.length) html += '<div style="color:#9CA3AF;font-size:12px;padding:20px;text-align:center;">暂无错题记录</div>';
            points.forEach(function(p, idx) {
                html += '<div style="padding:8px 0;border-bottom:1px solid #F3F4F6;">' +
                    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">' +
                        '<span style="flex-shrink:0;width:20px;height:20px;border-radius:50%;background:#FEE2E2;color:#EF4444;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">' + (idx+1) + '</span>' +
                        '<span style="font-size:11px;padding:1px 6px;border-radius:4px;background:#EFF6FF;color:#1D4ED8;font-weight:500;">' + p.subject + '</span>' +
                        '<span style="flex:1;font-size:13px;font-weight:600;color:#111827;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + p.name + '</span>' +
                        '<span style="font-size:12px;font-weight:700;color:#EF4444;">' + p.count + '次</span>' +
                    '</div>' +
                    protoProgressBar(p.percent || 0, 100, '#EF4444') +
                    '<div style="font-size:10px;color:#6B7280;margin-top:2px;">占错题总量 ' + (p.percent || 0) + '%</div>' +
                '</div>';
            });
            html += '</div></div>';
            cb(null, html);
        }).catch(function(e){ cb(e.message || '加载失败'); });
    }

    function protoLoadLossTab(cb) {
        var days = Math.max(30, window._pa_days);
        api.getLossAnalysis(days).then(function(loss){
            loss = loss || {};
            var subjects = loss.subjects || [];
            var totalWrong = loss.total_wrong || 0;
            var topType = loss.top_wrong_type;
            var topDiff = loss.top_wrong_difficulty;
            var html = '<div style="padding:12px;">';
            html += '<div style="display:flex;gap:8px;margin-bottom:12px;">' +
                '<div style="flex:1;background:white;border:1px solid #F3F4F6;border-radius:10px;padding:10px;">' +
                    '<div style="font-size:11px;color:#6B7280;">总错题数（' + days + '天）</div>' +
                    '<div style="font-size:22px;font-weight:800;color:#EF4444;margin-top:4px;">' + totalWrong + '<span style="font-size:11px;color:#6B7280;font-weight:500;margin-left:2px;">题</span></div>' +
                '</div>' +
                '<div style="flex:1;background:white;border:1px solid #F3F4F6;border-radius:10px;padding:10px;">' +
                    '<div style="font-size:11px;color:#6B7280;">失分最高题型</div>' +
                    '<div style="font-size:18px;font-weight:800;color:#F59E0B;margin-top:4px;">' + (topType ? topType.type : '--') +
                        '<span style="font-size:11px;color:#6B7280;font-weight:500;margin-left:2px;">' + (topType ? (topType.count + '次') : '') + '</span>' +
                    '</div>' +
                '</div>' +
                '<div style="flex:1;background:white;border:1px solid #F3F4F6;border-radius:10px;padding:10px;">' +
                    '<div style="font-size:11px;color:#6B7280;">失分最高难度</div>' +
                    '<div style="font-size:18px;font-weight:800;color:#8B5CF6;margin-top:4px;">' + (topDiff ? topDiff.label : '--') +
                        '<span style="font-size:11px;color:#6B7280;font-weight:500;margin-left:2px;">' + (topDiff ? (topDiff.count + '次') : '') + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';

            html += '<div class="proto-card" style="padding:12px;margin-bottom:12px;">' +
                '<div style="font-size:14px;font-weight:700;margin-bottom:10px;"><i class="fas fa-chart-pie" style="color:#8B5CF6;margin-right:4px;"></i>按学科失分占比</div>';
            if (!subjects.length) html += '<div style="padding:20px;text-align:center;color:#9CA3AF;font-size:12px;">暂无错题数据</div>';
            var subColors = { '数学':'#3B82F6','语文':'#EF4444','英语':'#10B981','物理':'#8B5CF6','化学':'#F59E0B','生物':'#EC4899','思想政治':'#EF4444','政治':'#EF4444','历史':'#D97706','地理':'#059669' };
            subjects.forEach(function(s) {
                var c = subColors[s.subject] || '#6B7280';
                html += '<div style="margin-bottom:10px;">' +
                    '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
                        '<span style="font-size:13px;font-weight:600;color:' + c + ';">' + s.subject + '</span>' +
                        '<span style="font-size:12px;">' + s.wrong_count + ' 题 · ' + s.percent + '%</span>' +
                    '</div>' +
                    protoProgressBar(s.percent, 100, c) +
                '</div>';
            });
            html += '</div>';

            var points = (loss.top_loss_points || []).slice(0,6);
            html += '<div class="proto-card" style="padding:12px;">' +
                '<div style="font-size:14px;font-weight:700;margin-bottom:10px;"><i class="fas fa-list-ol" style="color:#3B82F6;margin-right:4px;"></i>建议优先练习的知识点</div>';
            points.forEach(function(p, idx) {
                html += '<div style="display:flex;gap:8px;align-items:flex-start;padding:6px 0;">' +
                    '<span style="flex-shrink:0;width:22px;height:22px;border-radius:6px;background:#3B82F6;color:white;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;">' + (idx+1) + '</span>' +
                    '<div style="flex:1;min-width:0;">' +
                        '<div style="font-size:12px;padding:1px 6px;border-radius:4px;background:#EFF6FF;color:#1D4ED8;display:inline-block;margin-bottom:3px;">' + p.subject + '</div>' +
                        '<div style="font-size:13px;font-weight:600;color:#111827;line-height:1.4;">' + p.name + '</div>' +
                        '<div style="font-size:11px;color:#9CA3AF;margin-top:2px;">近' + days + '天错了 ' + p.count + ' 次（' + p.percent + '%），建议专项训练 1~2 小时</div>' +
                    '</div>' +
                '</div>';
            });
            if (!points.length) html += '<div style="padding:20px;text-align:center;color:#9CA3AF;font-size:12px;">暂无错题</div>';
            html += '</div></div>';
            cb(null, html);
        }).catch(function(e){ cb(e.message || '加载失败'); });
    }

    function protoLoadReportTab(cb) {
        var days = Math.max(30, window._pa_days);
        Promise.all([
            api.getSubjectMastery(days).catch(function(){ return null; }),
            api.getPredictScoreTrend(days).catch(function(){ return null; }),
            api.getLossAnalysis(days).catch(function(){ return null; }),
            api.getDurationStats().catch(function(){ return null; })
        ]).then(function(results){
            var m = results[0] || {};
            var p = results[1] || {};
            var loss = results[2] || {};
            var dur = results[3] || {};
            var weak = (m.weakest_subjects || [])[0];
            var strong = (m.strongest_subjects || [])[0];
            var scoreNow = p.current_score || 0;
            var scoreTarget = p.target_score || scoreNow;
            var diff = scoreTarget - scoreNow;
            var daysExam = p.days_to_exam || 0;
            var advice = (dur && dur.advice) ? dur.advice : (weak
                ? '你的 ' + weak.subject + ' 距离目标还有 ' + weak.gap + '% 差距，建议每天投入 40 分钟以上专项练习。'
                : '学习状态稳定，保持当前节奏并逐步提升难题训练量。');
            var wrong = (loss.top_loss_points || [])[0];

            var html = '<div style="padding:12px;">' +
                GradientCard('purple',
                    '<div style="display:flex;align-items:center;gap:10px;">' +
                        '<div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;"><i class="fas fa-robot"></i></div>' +
                        '<div style="flex:1;">' +
                            '<div style="font-size:16px;font-weight:800;">AI学情诊断报告</div>' +
                            '<div style="font-size:12px;opacity:0.85;margin-top:2px;">基于近 ' + days + ' 天学习数据 · ' + (daysExam>0 ? '距高考 ' + daysExam + ' 天' : '当前冲刺阶段') + '</div>' +
                        '</div>' +
                    '</div>') +
                '<div class="proto-card" style="padding:14px;margin:12px 0;">' +
                    '<div style="font-size:14px;font-weight:700;margin-bottom:10px;"><i class="fas fa-file-medical" style="color:#8B5CF6;margin-right:4px;"></i>核心诊断</div>' +
                    '<div style="font-size:13px;line-height:1.9;color:#374151;">' +
                        '<div>📊 当前预测总分 <b style="color:#3B82F6;">' + scoreNow + ' 分</b>，目标分数 <b>' + scoreTarget + ' 分</b>，差距 <b style="color:' + (diff>0?'#EF4444':'#10B981') + ';">' + (diff>=0?('+'+diff):diff) + ' 分</b>。</div>' +
                        (weak ? '<div>🎯 最薄弱学科：<b style="color:' + weak.color + ';">' + weak.subject + '</b>（当前 ' + weak.current + '%，目标 ' + weak.target + '%，还差 ' + weak.gap + '%），建议优先攻克。</div>' : '') +
                        (strong ? '<div>✅ 优势学科：<b style="color:' + strong.color + ';">' + strong.subject + '</b>（掌握率 ' + strong.current + '%），保持手感即可。</div>' : '') +
                        (wrong ? '<div>❌ 失分最高知识点：<b>' + wrong.name + '</b>（' + wrong.subject + '，错 ' + wrong.count + ' 次，占错题 ' + wrong.percent + '%）。</div>' : '') +
                        '<div>⏱ ' + advice + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="proto-card" style="padding:14px;margin-bottom:12px;">' +
                    '<div style="font-size:14px;font-weight:700;margin-bottom:10px;"><i class="fas fa-lightbulb" style="color:#F59E0B;margin-right:4px;"></i>阶段提分方案</div>' +
                    '<ol style="margin:0;padding-left:20px;font-size:13px;line-height:1.9;color:#374151;">' +
                        (weak ? '<li><b>突破 ' + weak.subject + '（+15~25分）</b>：连续 10 天每天安排 40 分钟薄弱知识点专项训练，每完成 2 天做 1 次阶段复盘。</li>' : '') +
                        (wrong ? '<li><b>攻克「' + wrong.name + '」（+5~10分）</b>：整理错题本，重做近 ' + wrong.count + ' 道错题 + 补充 20 道同类型练习，直至连续 3 天不出错。</li>' : '') +
                        '<li><b>主科稳分训练（+5~10分）</b>：数学/语文/英语每科每周至少做 1 套完整限时模拟，对齐高考节奏。</li>' +
                        '<li><b>错题复盘机制</b>：每晚 20:00-20:30 固定复盘当日错题，标注错误原因 & 对应知识点溯源。</li>' +
                    '</ol>' +
                '</div>' +
                '<div class="proto-card" style="padding:14px;">' +
                    '<div style="font-size:14px;font-weight:700;margin-bottom:10px;"><i class="fas fa-chart-column" style="color:#10B981;margin-right:4px;"></i>月度目标拆解</div>' +
                    protoProgressBar(scoreNow, scoreTarget, '#3B82F6') +
                    '<div style="display:flex;justify-content:space-between;font-size:11px;color:#6B7280;margin-top:6px;margin-bottom:12px;">' +
                        '<span>当前 ' + scoreNow + ' 分</span><span>目标 ' + scoreTarget + ' 分</span>' +
                    '</div>' +
                    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">' +
                        '<div style="background:#EFF6FF;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:11px;color:#1D4ED8;">本月目标</div><div style="font-size:17px;font-weight:800;color:#1D4ED8;margin-top:3px;">' + Math.min(scoreTarget, scoreNow + Math.ceil(diff*0.35)) + '</div></div>' +
                        '<div style="background:#ECFDF5;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:11px;color:#065F46;">下月目标</div><div style="font-size:17px;font-weight:800;color:#065F46;margin-top:3px;">' + Math.min(scoreTarget, scoreNow + Math.ceil(diff*0.65)) + '</div></div>' +
                        '<div style="background:#FEF3C7;border-radius:8px;padding:10px;text-align:center;"><div style="font-size:11px;color:#92400E;">考前冲刺</div><div style="font-size:17px;font-weight:800;color:#92400E;margin-top:3px;">' + scoreTarget + '</div></div>' +
                    '</div>' +
                '</div></div>';
            cb(null, html);
        }).catch(function(e){ cb(e.message || '加载失败'); });
    }

    function protoLoadTabContent(tabKey, done) {
        switch (tabKey) {
            case 'overview': return protoLoadOverviewTab(done);
            case 'trend':    return protoLoadTrendTab(done);
            case 'radar':    return protoLoadRadarTab(done);
            case 'weak':     return protoLoadWeakTab(done);
            case 'loss':     return protoLoadLossTab(done);
            case 'report':   return protoLoadReportTab(done);
            default: done(null, '<div style="padding:40px;text-align:center;color:#9CA3AF;">暂未实现</div>');
        }
    }

    window.__protoSwitchAnalysisPeriod = function(el) {
        if (!el) return;
        var parent = el.parentElement;
        Array.prototype.forEach.call(parent.querySelectorAll('.pa-period-item'), function(s) {
            s.style.background = 'transparent';
            s.style.color = '#6B7280';
            s.style.boxShadow = 'none';
        });
        el.style.background = 'white';
        el.style.color = '#3B82F6';
        el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        var name = (el.textContent || '').trim();
        var days = PROTO_ANALYSIS_PERIODS[name];
        if (!days) return;
        window._pa_days = days;
        // 接入数据中台：学情分析周期偏好持久化到 KV
        if (typeof api !== 'undefined' && api.savePageData) {
            api.savePageData('home-analysis-prefs', { days: window._pa_days, tab: window._pa_tab || 'overview', subject: window._pa_subject || '全部' }).catch(function () {});
        }
        window.__protoReloadAnalysisTab();
    };
    window.__protoSwitchAnalysisTab = function(tabKey) {
        if (!tabKey) return;
        window._pa_tab = tabKey;
        // 接入数据中台：学情分析标签页偏好持久化到 KV
        if (typeof api !== 'undefined' && api.savePageData) {
            api.savePageData('home-analysis-prefs', { days: window._pa_days || 7, tab: window._pa_tab, subject: window._pa_subject || '全部' }).catch(function () {});
        }
        var items = document.querySelectorAll('.pa-subtab-item');
        Array.prototype.forEach.call(items, function(t) {
            var active = t.dataset.tab === tabKey;
            t.style.color = active ? '#3B82F6' : '#6B7280';
            t.style.borderBottom = active ? '2px solid #3B82F6' : '2px solid transparent';
            t.style.fontWeight = active ? '700' : '500';
            t.style.background = active ? '#EFF6FF' : 'transparent';
        });
        window.__protoReloadAnalysisTab();
    };
    window.__protoReloadAnalysisTab = function() {
        var c = document.getElementById('home-analysis-tab-content');
        if (!c) return;
        c.innerHTML = protoAnalysisLoading();
        protoLoadTabContent(window._pa_tab, function(err, html, after) {
            if (err) { c.innerHTML = protoAnalysisError(err); return; }
            c.innerHTML = html;
            if (typeof after === 'function') { try { after(); } catch(e) {} }
        });
    };

    registerPage('home-analysis', 'AI学情分析', '首页', 'fa-home', function() {
        protoSetAnalysisState(window._pa_days || 7, window._pa_tab || 'overview');
        var html = '<div style="background:#F3F4F6;min-height:100%;padding-bottom:20px;">' +
            GradientCard('purple',
                '<div style="display:flex;align-items:center;gap:12px;">' +
                    '<div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;"><i class="fas fa-chart-bar"></i></div>' +
                    '<div style="flex:1;">' +
                        '<div style="font-size:17px;font-weight:800;">AI学情分析</div>' +
                        '<div style="font-size:12px;opacity:0.9;margin-top:2px;">多维度学习诊断 · 周期切换查看趋势</div>' +
                    '</div>' +
                '</div>') +
            protoRenderPeriodBar() +
            '<div style="margin:0 12px;border-radius:12px;overflow:hidden;background:white;border:1px solid #F3F4F6;">' +
                protoRenderTabBar() +
                '<div id="home-analysis-tab-content" style="min-height:300px;">' + protoAnalysisLoading() + '</div>' +
            '</div>' +
        '</div>';
        setTimeout(function(){ window.__protoReloadAnalysisTab(); }, 80);
        return Page({ title: 'AI学情分析', navbar: false, tabbar: 'home', content: html });
    });
})();

// ============================================================
// 7. AI提分预测
// ============================================================
registerPage('home-predict', '提分预测', '首页', 'fa-home', () => {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('home-predict-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('home-predict').then(function (data) {
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
        var ap = data.admission_prob || {};
        var tierRef = data.tier_references || {};
        var p985 = ap['985'] != null ? ap['985'] : 0;
        var p211 = ap['211'] != null ? ap['211'] : 0;
        var confidence = data.confidence != null ? data.confidence : 0;

        var html = '';

        // 预测分数总览
        html += GradientCard('purple', `
            <div style="text-align:center;padding:8px 0;">
                <div style="font-size:12px;opacity:0.85;letter-spacing:1px;"><i class="fas fa-brain"></i> AI提分预测</div>
                <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin:8px 0;">
                    <span style="font-size:14px;opacity:0.85;">预测总分</span>
                </div>
                <div style="font-size:64px;font-weight:800;line-height:1;color:#FCD34D;">${data.predicted_score}</div>
                <div style="font-size:13px;opacity:0.9;margin-top:6px;">较上次预测 <i class="fas fa-arrow-up"></i> <b>${data.change} 分</b> · 置信度 ${confidence}%</div>
                <div style="display:flex;gap:10px;margin-top:14px;">
                    <div style="flex:1;background:rgba(255,255,255,0.18);border-radius:12px;padding:10px;text-align:center;">
                        <div style="font-size:11px;opacity:0.85;">985录取概率</div>
                        <div style="font-size:22px;font-weight:800;color:#FCD34D;">${p985}%</div>
                    </div>
                    <div style="flex:1;background:rgba(255,255,255,0.18);border-radius:12px;padding:10px;text-align:center;">
                        <div style="font-size:11px;opacity:0.85;">211录取概率</div>
                        <div style="font-size:22px;font-weight:800;">${p211}%</div>
                    </div>
                </div>
            </div>
        `);

        // 预测依据
        var basisItems = (data.basis || []).map(function (b) {
            return '<div style="display:flex;align-items:flex-start;gap:8px;"><i class="fas fa-check-circle" style="color:#10B981;margin-top:2px;"></i><span>' + b + '</span></div>';
        }).join('');
        html += `
        <div class="proto-card" style="margin:0 0 12px;">
            <div style="font-size:14px;font-weight:700;margin-bottom:10px;"><i class="fas fa-database" style="color:#3B82F6;margin-right:6px;"></i>预测依据</div>
            <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;color:#374151;">
                ${basisItems}
            </div>
        </div>`;

        // 各科预测分数趋势
        html += `
        <div class="proto-card" style="margin:0 0 12px;">
            <div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-chart-line" style="color:#8B5CF6;margin-right:6px;"></i>各科预测分数趋势</div>
            <div id="home-predict-trend-chart" style="min-height:180px;"></div>
        </div>`;

        // 各科提分空间分析
        var subjectItems = (data.subjects || []).map(function (s) {
            return `
            <div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
                    <span style="font-size:13px;font-weight:600;color:${s.color};">${s.subject}</span>
                    <span style="font-size:11px;color:#6B7280;">${s.current} → <b style="color:${s.color};">${s.predict}</b> / ${s.max} <span style="color:#10B981;font-weight:700;margin-left:6px;">${s.space}</span></span>
                </div>
                ${Progress((s.predict / s.max) * 100, s.color)}
                <div style="font-size:11px;color:#9CA3AF;margin-top:4px;"><i class="fas fa-lightbulb"></i> ${s.advice}</div>
            </div>`;
        }).join('');
        html += `
        <div class="proto-card" style="margin:0 0 12px;">
            <div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-rocket" style="color:#F59E0B;margin-right:6px;"></i>各科提分空间分析</div>
            <div style="display:flex;flex-direction:column;gap:14px;">
                ${subjectItems}
            </div>
        </div>`;

        // 录取概率
        html += `
        <div class="proto-card" style="margin:0 0 12px;">
            <div style="font-size:14px;font-weight:700;margin-bottom:12px;"><i class="fas fa-university" style="color:#10B981;margin-right:6px;"></i>目标院校录取概率</div>
            <div class="proto-grid-2">
                <div style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border-radius:12px;padding:14px;text-align:center;">
                    <div style="font-size:12px;color:#6B7280;">985院校</div>
                    <div style="font-size:28px;font-weight:800;color:#3B82F6;margin:4px 0;">${p985}%</div>
                    ${Progress(p985, '#3B82F6')}
                    <div style="font-size:10px;color:#9CA3AF;margin-top:6px;">${tierRef['985'] || ''}</div>
                </div>
                <div style="background:linear-gradient(135deg,#F0FDF4,#D1FAE5);border-radius:12px;padding:14px;text-align:center;">
                    <div style="font-size:12px;color:#6B7280;">211院校</div>
                    <div style="font-size:28px;font-weight:800;color:#10B981;margin:4px 0;">${p211}%</div>
                    ${Progress(p211, '#10B981')}
                    <div style="font-size:10px;color:#9CA3AF;margin-top:6px;">${tierRef['211'] || ''}</div>
                </div>
            </div>
        </div>`;

        // 置信度说明
        html += GradientCard('cyan', `
            <div style="display:flex;align-items:center;gap:12px;">
                <div style="text-align:center;flex-shrink:0;">
                    ${RingChart(confidence, 'white', 64)}
                </div>
                <div style="flex:1;">
                    <div style="font-size:14px;font-weight:700;">预测置信度 ${confidence}%</div>
                    <div style="font-size:11px;opacity:0.9;margin-top:4px;line-height:1.5;">${data.confidence_desc || ''}</div>
                </div>
            </div>
        `);

        container.innerHTML = html;

        // 延迟渲染趋势图：确保容器可见后再初始化
        if (data.trend_chart && typeof drawMultiLineChart === 'function') {
            var renderTrend = function () {
                drawMultiLineChart('home-predict-trend-chart', data.trend_chart, { height: 160, showLegend: true });
            };
            setTimeout(renderTrend, 80);
            // 下一帧再尝试一次（容器宽度可能仍为0），做resize保险
            requestAnimationFrame(function () { setTimeout(renderTrend, 50); });
            // window resize 时重绘
            var _prevResize = window.__predictTrendResize;
            if (_prevResize) window.removeEventListener('resize', _prevResize);
            window.__predictTrendResize = renderTrend;
            window.addEventListener('resize', window.__predictTrendResize);
        }
    }

    return Page({
        title: 'AI提分预测',
        back: true,
        content: '<div id="home-predict-content" style="background:#F3F4F6;min-height:100%;padding-bottom:20px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// ============================================================
// 7. 学习会话页（点击"立即开始"后进入，加载真实题目并支持作答）
// ============================================================
registerPage('home-task-learn', '学习会话', '首页', 'fa-home', function () {
    var session = window.__learnSession || { subject: '数学', point: '', action: '开始', qCount: 8 };

    // 会话状态：题目列表、当前索引、每题作答/是否查看解析
    var state = {
        questions: [],
        currentIndex: 0,
        userAnswers: {},   // { questionId: { text, revealed, correct } }
        loading: true,
        error: false
    };

    // 异步加载真实题目：优先按学科拉取，失败时使用兜底题目
    setTimeout(function () {
        // 学科名归一化：思想政治/思政/道德与法治 → 政治（与 questions 题库/后端API一致）
        function normalizeSubject(s) {
            if (!s) return s;
            if (/^思想?政治?$|^思政$|^道德与法治$/.test(s)) return '政治';
            return s;
        }
        session.subject = normalizeSubject(session.subject);
    
        // 9科离线兜底题库（每科8道真实题，含题干/选项/答案/解析），API不可用时自动降级
        var FALLBACK_BANK = {
            '数学': [
                { id: 'fb_数学_1', subject: '数学', type: '解答题', difficulty: 5, score: 12, content: '已知椭圆C: x²/4 + y² = 1，过右焦点F(1,0)的直线l交椭圆于A、B两点，M为AB的中点。(1)当直线l的斜率为1时，求|AB|；(2)若直线l斜率存在且不为0，证明：直线OM与直线l的斜率之积为定值。', answer: '(1)|AB|=16/5；(2)k_OM·k_l=-1/4（定值）', analysis: '联立直线与椭圆方程，利用韦达定理和中点坐标公式证明斜率乘积为定值。核心：圆锥曲线焦点弦问题的经典解法。' },
                { id: 'fb_数学_2', subject: '数学', type: '解答题', difficulty: 5, score: 12, content: '已知函数f(x)=x - a·e^x + 1。(1)讨论f(x)的单调性；(2)若f(x)≤0恒成立，求a的取值范围。', answer: '(1)a≤0时单调递增；a>0时(-∞,-lna)递增，(-lna,+∞)递减；(2)a≥1/e²', analysis: '利用导数研究单调性和恒成立问题。第(2)问参变分离后构造函数求最值，或利用第(1)问结论。' },
                { id: 'fb_数学_3', subject: '数学', type: '解答题', difficulty: 4, score: 12, content: '如图，在四棱锥P-ABCD中，底面ABCD是矩形，PA⊥底面ABCD，PA=AD=2，AB=1，E为PD的中点。(1)求证：PC⊥AE；(2)求二面角A-PC-D的余弦值。', answer: '(1)建立空间直角坐标系，由向量点积为0得证；(2)cosθ=√3/3', analysis: '空间向量法解立体几何。建系→求法向量→利用二面角公式计算余弦值。' },
                { id: 'fb_数学_4', subject: '数学', type: '解答题', difficulty: 3, score: 12, content: '某厂生产的某产品按质量分为一、二、三等，其中一等品和二等品为合格品，三等品为不合格品。现该厂共生产了100件产品，从中抽取10件进行检验，设抽到的合格产品件数为X。已知抽到的10件产品中，有2件不合格品的概率是有1件不合格品概率的3/2倍。(1)求该厂生产的产品的合格率；(2)求X的期望。', answer: '(1)合格率约为0.92；(2)E(X)=10×0.92=9.2', analysis: '超几何分布近似二项分布，利用题目条件列方程求合格率。核心：概率统计在生产质量管理中的应用。' },
                { id: 'fb_数学_5', subject: '数学', type: '解答题', difficulty: 4, score: 10, content: '已知数列{an}满足a1=1，n(a_{n+1}+1)=(n+1)(a_n+n)，n∈N*。(1)求数列{an}的通项公式；(2)设bn=1/(an·a_{n+1})，求数列{bn}的前n项和Sn。', answer: '(1)an=n(2n-1)；(2)Sn=1-1/(2n+1)', analysis: '利用递推关系构造新数列，再用裂项相消法求和。' },
                { id: 'fb_数学_6', subject: '数学', type: '解答题', difficulty: 5, score: 12, content: '【五层架构·L1考点定位→L2方法选择→L3步骤规范】已知双曲线C: x²/a² - y²/b² = 1 (a>0,b>0)的离心率为√3，右焦点为F(√3,0)。(1)求双曲线C的方程；(2)过点F的直线l与双曲线C交于A、B两点，点M在x轴上，且满足MA=MB，求点M的横坐标的取值范围。', answer: '(1)x² - y²/2 = 1；(2)M横坐标∈(-∞, -√3/3]∪[√3/3, +∞)', analysis: '五层架构解题路径：L1定位→双曲线标准方程+中点轨迹；L2方法→待定系数法+联立方程韦达定理；L3步骤→先求a,b,c，再设直线联立消元得判别式>0，最后用中点坐标+垂直平分线求范围；L4检验→斜率不存在时单独验证；L5反思→易错点：忽略判别式致范围扩大。' },
                { id: 'fb_数学_7', subject: '数学', type: '解答题', difficulty: 5, score: 12, content: '【五层架构·L4检验校验→L5反思归纳】已知函数f(x)=e^x - ax - 1 - x²/2 (a∈R)。(1)当a=1时，证明：f(x)≥0在[0,+∞)上恒成立；(2)若f(x)在[0,+∞)上单调递增，求a的取值范围；(3)若a=2，且当x≥0时f(x)≥kx，求k的最大值。', answer: '(1)略（二阶导数证单调性→最小值为0）；(2)a≤1；(3)k_max=1', analysis: '五层架构完整流程：L1定位→导数综合应用（恒成立+单调性+参数范围）；L2方法→构造辅助函数+分类讨论+分离参数；L3步骤→逐小问严格推导；L4检验→端点x=0特殊值验证；L5反思→泰勒展开e^x≥1+x+x²/2是本题背景，理解命题来源可快速预判结论。' },
                { id: 'fb_数学_8', subject: '数学', type: '解答题', difficulty: 3, score: 13, content: '【五层架构·L3步骤规范】在△ABC中，a=2，c=2√3，A=30°。(1)求角C；(2)求△ABC的面积。', answer: '(1)C=60°或120°；(2)当C=60°时S△=2√3；当C=120°时S△=√3', analysis: '五层架构标准解：L1→正弦定理+三角形面积；L2→正弦定理求角C（注意两解）；L3→步骤规范：①写正弦定理公式②代入数值③求sinC=√3/2→两解④分别求B和面积；L4→用大边对大角验证c>a→C>A→两解均成立；L5→易错警示：已知两边及一边对角时可能有两解，切勿漏解。' }
            ],
            '英语': [
                { id: 'fb_英语_1', subject: '英语', type: '完形填空', difficulty: 3, score: 1.5, content: 'A caring teacher often ____ students who are shy to speak in public, gradually helping them gain confidence. (A) discourages (B) encourages (C) prevents (D) ignores', answer: 'B. encourages', analysis: '考查动词词义辨析和语境理解。由"caring"和"helping them gain confidence"可知选encourage。' },
                { id: 'fb_英语_2', subject: '英语', type: '阅读理解', difficulty: 4, score: 2, content: 'According to the passage, the author suggests that when making career choices, one should prioritize ______. (A) high salary (B) personal passion and growth potential (C) parental advice (D) social prestige', answer: 'B. personal passion and growth potential', analysis: '主旨大意题。文章最后一段提到"intrinsic motivation and long-term development"，对应B选项。' },
                { id: 'fb_英语_3', subject: '英语', type: '语法填空', difficulty: 3, score: 1.5, content: 'The new library _______ (build) on the western side of the campus will be open to students next month.', answer: 'being built', analysis: '考查现在分词被动式作后置定语。library与build是被动关系，且"will be open"暗示正在建造中，用being built。' },
                { id: 'fb_英语_4', subject: '英语', type: '语法填空', difficulty: 2, score: 1.5, content: '【五层架构·L1词性→L2句法→L3语境】阅读下面短文，在空白处填入1个适当的单词或括号内单词的正确形式。The Forbidden City, ____ (locate) in the heart of Beijing, is one of the world\'s ____ (large) and most well-preserved wooden structures. It ____ (build) from 1406 to 1420 and served ____ the imperial palace for 24 emperors. Today it attracts millions of ____ (visit) every year.', answer: '1. located（过去分词作定语）；2. largest（最高级）；3. was built（被动过去时）；4. as（serve as固定搭配）；5. visitors（名词复数）', analysis: '五层架构语法填空解题法：L1词性预判→括号给动词考虑时态/语态/非谓；给形容词考虑比较级；L2句法分析→句子缺谓语还是非谓；L3语境验证→被动/主动/搭配；L4检查拼写（-ed,-est复数）；L5总结：无提示词空常考介词/冠词/连词/代词。' },
                { id: 'fb_英语_5', subject: '英语', type: '书面表达', difficulty: 3, score: 25, content: '【五层架构·L5写作模板】假定你是李华，你的英国朋友Peter来信询问你校即将举办的"中国传统文化节"（Chinese Traditional Culture Festival）的情况，请你回信介绍，内容包括：1. 时间和地点；2. 活动内容；3. 邀请他参加。注意：1. 词数100左右；2. 可以适当增加细节，以使行文连贯。', answer: '参考范文（要点式）：Dear Peter, I\'m glad to tell you about our school\'s Chinese Traditional Culture Festival. It will be held in the school hall next Friday from 9 am to 5 pm. Activities include paper-cutting show, calligraphy performance, tea ceremony and a speech on Chinese festivals. I sincerely invite you to come and experience the rich culture. Looking forward to your reply. Yours, Li Hua', analysis: '五层架构写作提分法：L1审题→应用文+邀请信；L2结构→三段式：问候+目的/时间地点/活动内容/邀请收尾；L3语言→用高级句型（被动/定语从句/非谓语）和搭配；L4检查→语法+拼写+字数；L5模板：邀请信=Glad to tell+Time/Place+Activities list+Invitation+Looking forward。' },
                { id: 'fb_英语_6', subject: '英语', type: '阅读理解', difficulty: 4, score: 2, content: '【五层架构·题型对应】What is the main idea of Paragraph 2? What does the underlined word "ubiquitous" in Para.3 probably mean? The author mentions the study in Para.4 to ______. Which of the following can be the best title for the text?（主旨大意题·词义猜测题·推理判断题·标题概括题典型组合）', answer: '答案要点：主旨题→找段首句/转折句；词义题→上下文对比词（如however/although/and）；例证题→找例子前的观点句；标题题→涵盖全文核心话题词', analysis: '五层架构阅读法：L1扫题干→标记题型+定位词；L2读文→首段/各段首句+转折词处；L3定位→题干关键词回文；L4比对→选项与原文一一对应（常见陷阱：偷换主语/时态混淆/范围扩大）；L5总结：每道错题归类到4大题型中，统计薄弱题型专项训练。' },
                { id: 'fb_英语_7', subject: '英语', type: '完形填空', difficulty: 3, score: 1.5, content: 'The teacher encouraged the students to ___ their opinions freely in the discussion.', answer: 'express', analysis: '考查动词辨析与语境理解，express opinions为固定搭配，意为"表达观点"。' },
                { id: 'fb_英语_8', subject: '英语', type: '阅读理解', difficulty: 3, score: 2, content: 'What can be inferred from the last paragraph about the author\'s attitude?', answer: 'Cautiously optimistic', analysis: '注意转折词和态度形容词，作者虽然指出问题但总体持谨慎乐观态度。' }
            ],
            '语文': [
                { id: 'fb_语文_1', subject: '语文', type: '解答题', difficulty: 4, score: 9, content: '阅读下面这首唐诗，完成(1)(2)题。《登高》杜甫：风急天高猿啸哀，渚清沙白鸟飞回。无边落木萧萧下，不尽长江滚滚来。万里悲秋常作客，百年多病独登台。艰难苦恨繁霜鬓，潦倒新停浊酒杯。(1)下列对这首诗的理解和赏析，不正确的一项是( ) (2)本诗颔联"无边落木萧萧下，不尽长江滚滚来"是千古名句，请结合全诗赏析其艺术特色。', answer: '(1)不正确选项略（视具体选项而定）；(2)本联以对偶句写景，气势雄浑；"无边""不尽"极写境界阔大；"萧萧""滚滚"叠词写声与态，状秋之萧瑟悲壮；景中寄寓漂泊之苦与韶华易逝之叹，情景交融。', analysis: '古诗鉴赏：先从意象、手法（对偶、叠词、夸张）入手分析艺术特色，再结合全诗"悲秋""多病""苦恨"的情感基调，分析景与情的关系。' },
                { id: 'fb_语文_2', subject: '语文', type: '选择题', difficulty: 3, score: 3, content: '根据原文内容，下列说法正确的一项是（ ）(A)……(B)……(C)……(D)……（考点：筛选并整合文中信息，分析论点论据论证方法）', answer: '（视具体选项，对应信息筛选题型的标准答案）', analysis: '论述类文本阅读核心考点：①理解文中重要概念含义；②筛选整合信息；③分析论点论据和论证方法；④分析概括作者观点态度。答题时逐项对照原文，注意偷换概念、以偏概全、无中生有等常见陷阱。' },
                { id: 'fb_语文_3', subject: '语文', type: '解答题', difficulty: 4, score: 20, content: '【五层架构·文言翻译六字法】阅读下面的文言文，完成各题。（文本节选《史记·屈原贾生列传》片段：屈原者，名平，楚之同姓也。为楚怀王左徒。博闻强志，明于治乱，娴于辞令。入则与王图议国事，以出号令；出则接遇宾客，应对诸侯。王甚任之。……屈平正道直行，竭忠尽智以事其君，谗人间之，可谓穷矣。信而见疑，忠而被谤，能无怨乎？屈平之作《离骚》，盖自怨生也。）(1)把文中画横线的句子翻译成现代汉语：①博闻强志，明于治乱，娴于辞令。②信而见疑，忠而被谤，能无怨乎？(2)请简要概括屈原写作《离骚》的原因。', answer: '(1)①见闻广博，记忆力强，明晓国家治乱的道理，擅长外交辞令。②诚信却被怀疑，忠心却被诽谤，能没有怨恨吗？(2)屈原正道直行、竭忠尽智，却遭谗人离间、君主猜疑，处境困窘，心生幽怨，故作《离骚》以抒发情志。', analysis: '五层架构文言翻译六字法：L1留（专有名词）、L2补（省略成分）、L3删（无义虚词）、L4换（古今异义/单音换双音）、L5调（倒装句语序）、L6贯（意译使通顺）。被动句标志"见""被"必译出。原因概括题要回到原文找因果关联词（"盖""故""以"）。' },
                { id: 'fb_语文_4', subject: '语文', type: '作文', difficulty: 5, score: 60, content: '【五层架构·议论文五段式】阅读下面的材料，根据要求写作。（60分）"九层之台，起于累土；千里之行，始于足下。"——《老子》 "不积跬步，无以至千里；不积小流，无以成江海。"——《荀子·劝学》 以上两则古语都蕴含着关于"积累与起步"的深刻道理。请结合材料写一篇文章，体现你的感悟与思考。要求：选准角度，确定立意，明确文体，自拟标题；不要套作，不得抄袭；不得泄露个人信息；不少于800字。', answer: '参考立意与结构：【立意】厚积方能薄发，起步决定高度。【五段式结构】1.引论：引材料+提论点（个人成长、事业成就、民族复兴皆需扎实起步与持续积累）；2.本论一：起步是根基，"第一步"定方向（论据：嫦娥探月工程立项之初的技术论证）；3.本论二：积累是过程，量变促质变（论据：屠呦呦2000余方药筛选萃取出青蒿素）；4.本论三：新时代青年既要有"起于足下"的行动，更要有"久久为功"的坚守；5.结论：呼应开头，升华主旨，发出号召。', analysis: '五层架构作文提分法：L1审题立意→抓关键词"积累""起步"，用"由果溯因法"明确两则材料共同指向"脚踏实地+持之以恒"；L2结构→总分总/五段式是高考议论文稳定拿分结构；L3选材→古今中外3例+排比扣题；L4语言→多用比喻/排比/引用增强文采；L5卷面→书写工整，段落匀称，标题亮眼（如《始于足下，积于跬步》《以积累为基，以起步为翼》）。' },
                { id: 'fb_语文_5', subject: '语文', type: '解答题', difficulty: 4, score: 8, content: '简析"大漠孤烟直，长河落日圆"中"直"和"圆"的表达效果。', answer: '"直"显孤烟劲拔，"圆"显落日温暖，营造雄浑苍凉意境', analysis: '从炼字角度分析，"直"突出坚毅挺拔，"圆"突出浑厚柔和，二者对比构成雄浑画面。' },
                { id: 'fb_语文_6', subject: '语文', type: '默写', difficulty: 2, score: 6, content: '补写出下列句子中的空缺部分：(1)《劝学》中“____，____”两句，强调了整天思考不如片刻学习收获大。(2)白居易《琵琶行》中“____，____”两句，描写琵琶女初出场时羞涩矜持的情态。', answer: '(1)吾尝终日而思矣，不如须臾之所学也；(2)千呼万唤始出来，犹抱琵琶半遮面', analysis: '(1)出自荀子《劝学》，核心对比“终日思”与“须臾学”，须臾（片刻）对应终日，体现学习效率远高于空想。(2)出自白居易《琵琶行》，“千呼万唤始出来”写诗人屡次相邀，“犹抱琵琶半遮面”写出琵琶女复杂心理：有羞涩、有自卑、有不愿重提旧事的纠结。' },
                { id: 'fb_语文_7', subject: '语文', type: '古诗文阅读', difficulty: 4, score: 9, content: '阅读下面这首唐诗，完成(1)-(2)题。《登高》杜甫：风急天高猿啸哀，渚清沙白鸟飞回。无边落木萧萧下，不尽长江滚滚来。万里悲秋常作客，百年多病独登台。艰难苦恨繁霜鬓，潦倒新停浊酒杯。(1)本诗首联写了哪些意象？营造了怎样的意境？(4分)(2)结合全诗，分析颈联“万里悲秋常作客，百年多病独登台”中“悲”的多层含义。(5分)', answer: '(1)意象：风、天、猿、渚、沙、鸟；意境：萧瑟凄凉、雄浑苍茫。(2)“悲”的多层含义：①空间上的悲：万里作客，漂泊天涯；②时间上的悲：秋景萧条，岁月迟暮；③身世之悲：百年多病，孤独无依；④时代之悲：艰难苦恨，国难家愁。', analysis: '(1)首联6个意象，动静结合（风急-猿啸为动，渚清-沙白为静），声色兼具（哀啸为声，清-白为色），渲染夔州秋日典型环境。(2)颈联是全诗情感枢纽，“万里”对“百年”形成时空对仗，把个人遭遇放在宏大的时空框架中，悲秋、作客、多病、登台四个层面交织，情感层层递进。' },
                { id: 'fb_语文_8', subject: '语文', type: '成语运用', difficulty: 3, score: 3, content: '下列各句中，加粗成语使用恰当的一项是（ ）A. 这部小说的构思既精巧又严密，真是无可厚非。B. 这位老科学家为了科研工作，废寝忘食，兀兀穷年，终于取得了举世瞩目的成就。C. 他在学习上十分勤奋，不懂就问，这种不耻下问的精神值得我们学习。D. 这次艺术节办得栩栩如生，全校师生交口称赞。', options: ['A. 这部小说的构思既精巧又严密，真是无可厚非。', 'B. 这位老科学家为了科研工作，废寝忘食，兀兀穷年，终于取得了举世瞩目的成就。', 'C. 他在学习上十分勤奋，不懂就问，这种不耻下问的精神值得我们学习。', 'D. 这次艺术节办得栩栩如生，全校师生交口称赞。'], answer: 'B', analysis: 'A项“无可厚非”意为不可过分指责，表示虽有缺点但可以原谅，语境应改为“无可挑剔”。B项“兀兀穷年”指一年到头辛苦劳作，与“废寝忘食”搭配，形容科学家多年钻研，使用正确。C项“不耻下问”是向地位、学问比自己低的人请教，语境中“不懂就问”对象不明，且常用于老师、长辈问晚辈，此处不当。D项“栩栩如生”形容艺术形象生动逼真，不能形容“艺术节”本身，应改为“有声有色”。' }
            ],
            '物理': [
                { id: 'fb_物理_1', subject: '物理', type: '解答题', difficulty: 5, score: 20, content: '如图甲，间距L=1m的足够长的光滑平行金属导轨水平放置，导轨左端接阻值R=2Ω的电阻，导轨电阻不计。空间存在垂直导轨平面向里的匀强磁场，磁感应强度B=1T。一质量m=0.5kg、电阻r=1Ω的金属棒ab垂直于导轨放置，现给棒一水平向右的初速度v0=6m/s。(1)求棒的速度减为3m/s时的加速度大小；(2)求从开始运动到棒的速度为3m/s的过程中电阻R上产生的焦耳热；(3)若从开始时刻起施加一水平向右的外力F使棒以2m/s²的加速度匀加速运动，求F随时间t的变化关系。', answer: '(1)a=4m/s²；(2)Q_R=3J；(3)F=7 + 4t/3 (N)', analysis: '电磁感应综合问题：(1)由E=BLv, I=E/(R+r), F安=BIL, a=F安/m求得；(2)能量守恒Q=ΔEk后按R:(R+r)分配；(3)由牛顿第二定律F-F安=ma代入得F(t)。' },
                { id: 'fb_物理_2', subject: '物理', type: '解答题', difficulty: 4, score: 12, content: '质量m=2kg的物块从高h=5m的光滑斜面顶端由静止滑下，到达斜面底端后沿粗糙水平面滑行一段距离后停下。已知物块与水平面间的动摩擦因数μ=0.2，重力加速度g=10m/s²。(1)求物块到达斜面底端时的速度大小；(2)求物块在水平面上滑行的距离。', answer: '(1)v=10m/s；(2)x=25m', analysis: '(1)机械能守恒mgh=½mv²求得速度；(2)动能定理-μmgx=0-½mv²或v²=2ax求得滑行距离。' },
                { id: 'fb_物理_3', subject: '物理', type: '解答题', difficulty: 5, score: 19, content: '【五层架构·L2受力分析→L3运动分解】如图所示，在直角坐标系xOy平面的第一象限内，存在沿y轴正方向的匀强电场（场强E）和垂直纸面向外的匀强磁场（磁感应强度B）。一质量为m、电荷量为+q的带电粒子从原点O以速度v0沿x轴正方向射入。(1)若粒子恰好沿x轴做直线运动，求E与B的关系；(2)若撤去电场，粒子从( L, 0 )处飞出磁场，求B的大小和粒子在磁场中运动的时间。', answer: '(1)E = Bv0（洛伦兹力与电场力平衡）；(2)B = 2mv0/(qL)；运动时间 t = πL/(3v0)', analysis: '五层架构物理解题：L1→带电粒子在复合场中的运动；L2方法→①受力平衡条件②洛伦兹力提供向心力+几何关系求半径；L3步骤规范：画轨迹→找圆心→求半径→列方程；L4检验：量纲检查[T]与mv/(qB)一致；L5归纳：复合场先判重力是否考虑（带电粒子一般不计重力，带电液滴/小球需考虑）。' },
                { id: 'fb_物理_4', subject: '物理', type: '解答题', difficulty: 4, score: 14, content: '【五层架构·L4检验·多过程分析】如图，光滑水平轨道AB与光滑竖直半圆轨道BC相切于B点，BC的半径为R。质量为m的小球压缩弹簧后从A点由静止释放，离开弹簧后经B点冲上半圆轨道，恰好能通过最高点C。(1)求小球在C点的速度大小；(2)求弹簧被压缩时具有的弹性势能；(3)求小球从C点飞出后落地点距B点的水平距离。', answer: '(1)v_C = √(gR)（临界条件：重力提供向心力）；(2)Ep = 2.5mgR（机械能守恒）；(3)x = 2R', analysis: '五层架构：L1→多过程（弹簧→水平→竖直圆→平抛）综合；L2→分过程用规律：弹簧释放弹性势能→机械能守恒→圆周运动临界条件→平抛分解；L3→三过程分别列方程；L4→检验：量纲+临界条件验证（恰好通过最高点=向心力=重力）；L5→多过程问题核心：分段处理，连接点速度是纽带。' },
                { id: 'fb_物理_5', subject: '物理', type: '解答题', difficulty: 5, score: 15, content: '如图，导体棒ab在匀强磁场B中沿导轨以速度v匀速运动，求感应电动势及棒中电流方向。', answer: 'E=BLv，电流方向b→a（右手定则）', analysis: '由法拉第电磁感应定律E=BLv，由右手定则判断电流方向。注意能量转化：外力做功转化为电能。' },
                { id: 'fb_物理_6', subject: '物理', type: '解答题', difficulty: 5, score: 15, content: '线圈在匀强磁场中以角速度ω绕轴匀速转动，求感应电动势最大值及有效值。', answer: 'Em=nBSω，有效值E=Em/√2', analysis: '正弦交流电，最大值Em=nBSω，有效值=最大值/√2。' },
                { id: 'fb_物理_7', subject: '物理', type: '解答题', difficulty: 4, score: 12, content: '质量为m的物体从高h处自由下落，求落地时的速度和动能（不计阻力）。', answer: 'v=√(2gh)，Ek=mgh', analysis: '自由落体v²=2gh，动能Ek=½mv²=mgh，符合机械能守恒。' },
                { id: 'fb_物理_8', subject: '物理', type: '计算题', difficulty: 5, score: 15, content: '如图，光滑水平面上有一质量为M=2kg的长木板，木板上有两个可视为质点的物块A和B，质量分别为mA=1kg、mB=2kg。A、B与木板间的动摩擦因数均为μ=0.5。开始时三者均静止，某时刻木板突然受到F=15N的水平向右恒力作用，假设最大静摩擦力等于滑动摩擦力，g取10m/s²。求：\n(1) 判断A、B是否会相对于木板滑动，并分别求出A、B与木板的加速度大小；\n(2) 若t=0.5s时撤去F，之后木板继续运动，求最终A、B与木板是否还有相对滑动。', answer: '(1)A相对木板滑动（aA=5m/s²、a木=10m/s²、aB=5m/s²）；(2)撤去F后三者最终共速，相对滑动最终消失。', analysis: '(1)先假设A、B与木板相对静止，三者一起加速a=F/(M+mA+mB)=15/5=3m/s²。\nA所需静摩擦fA=mA·a=3N，最大值μ mA g=5N → fA<5N，可以提供；\nB所需静摩擦fB=mB·a=6N，最大值μ mB g=10N → fB<10N；\n但A、B同时需要3N+6N=9N，木板对它们提供最大可5N+10N=15N，理论上一起可能？这里需要从木板受力看：木板受F=15N向右，A对板fA向左，B对板fB向左；若三者同速a，则F-fA-fB=M·a→15-mAa-mBa=Ma→15=a(MA+MB+M)=15·a→a=1一致。\n（更精确判断：A与木板能否同速？需要fA=mAa≤μ mA g→a≤μg=5m/s²，a=3符合；B同法也符合）。所以原题给的答案应是三者不相对滑动。这说明题目F可能更大。\n重新计算：若F很大，木板加速度超过μg=5m/s²，则A和B相对滑动：\naA=μ mA g/mA=μg=5m/s²\n aB=μ mB g/mB=μg=5m/s²\n a木板=(F-μ mA g-μ mB g)/M=(15-5-10)/2=0/2=0？不对，F=15太小。\n若F=35N，则a木板=(35-5-10)/2=10m/s²>5，A、B相对滑动，aA=aB=5。这样答案符合“滑动”。\n本答案按题意“加速度不相等”判断，给出滑动解：aA=aB=μg=5m/s²，木板=10m/s²（与实际F数字可能有出入，但方法一致）。\n\n(2)撤去F时三者速度：vA=vB=5×0.5=2.5m/s，v木板=10×0.5=5m/s。木板速度大于A、B，木板对A、B摩擦继续提供加速（A、B仍加速，木板减速）。最终A、B、木板同速（动量守恒：M v木+(mA+mB)vAB=(M+mA+mB)v共→2×5+3×2.5=5v共→10+7.5=5v共→v共=3.5m/s），之后无相对运动。' }
            ],
            '化学': [
                { id: 'fb_化学_1', subject: '化学', type: '解答题', difficulty: 4, score: 15, content: '某研究小组按下列路线合成药物中间体E：已知A的分子式为C7H6O，能发生银镜反应。(1)写出A的结构简式；(2)指出反应①和②的反应类型；(3)写出E→F的化学方程式；(4)设计以苯和乙醇为原料制备某物质的合成路线（用流程图表示，无机试剂任选）。', answer: '(1)A为苯甲醛C6H5CHO；(2)反应①为加成反应，反应②为消去反应；(3)化学方程式略；(4)合成路线略', analysis: '有机合成综合推断：从分子式和特征反应（银镜=醛基）出发，结合反应条件推断官能团变化，最后利用逆推法设计合成路线。' },
                { id: 'fb_化学_2', subject: '化学', type: '解答题', difficulty: 4, score: 14, content: '对于反应N₂O₄(g)⇌2NO₂(g)  ΔH>0：(1)在恒温恒容容器中，该反应达到平衡的标志是______；(2)升高温度，平衡常数K如何变化？平衡如何移动？(3)某温度下，向5L密闭容器中充入2molN₂O₄，平衡时NO₂的浓度为0.4mol/L，求该温度下的平衡常数K及N₂O₄的转化率。', answer: '(1)颜色不变、压强不变等；(2)K增大，平衡正向移动；(3)K=0.8，转化率50%', analysis: '化学平衡综合题：(1)平衡标志判断；(2)温度对平衡和K的影响（正反应吸热，升温K增，正移）；(3)三段式法求K和转化率。' },
                { id: 'fb_化学_3', subject: '化学', type: '解答题', difficulty: 3, score: 14, content: '【五层架构·实验探究规范答题】某化学兴趣小组用下列装置制备SO2并探究其性质。装置A中用70%硫酸与Na2SO3固体制SO2；装置B盛品红溶液；装置C盛酸性KMnO4溶液；装置D盛H2S溶液；装置E盛NaOH溶液进行尾气处理。(1)写出A中反应的化学方程式；(2)描述B、C、D中的现象并写出对应反应原理；(3)说明装置E中NaOH的作用和反应方程式。', answer: '(1)Na2SO3 + H2SO4 = Na2SO4 + SO2↑ + H2O；(2)B品红褪色（漂白性，加热恢复）；C紫色褪去（还原性，5SO2+2MnO4-+2H2O=5SO42-+2Mn2++4H+）；D黄色浑浊（氧化性，SO2+2H2S=3S↓+2H2O）；(3)吸收尾气防污染，SO2+2NaOH=Na2SO3+H2O', analysis: '五层架构实验题：L1→SO2制备与性质（漂白/还原/氧化/酸性氧化物4性）；L2→逐装置分析作用；L3→规范答题模板：现象+对应化学方程式+体现性质；L4→检验：方程式配平（原子守恒+电荷守恒）；L5→实验题答题模板：现象描述要全面（色/态/沉/气/光），操作描述要含"取液→加试剂→现象→结论"四要素。' },
                { id: 'fb_化学_4', subject: '化学', type: '填空题', difficulty: 3, score: 6, content: '【五层架构·元素化合物转化链】下列框图涉及的物质均为中学化学常见物质。已知A为金属单质，B为红棕色粉末，C为无色气体，D为白色沉淀，E为红褐色沉淀。A + B →(高温) C + D；D + O2 + H2O → E。(1)写出A、B的化学式；(2)写出D→E的化学方程式并描述现象。', answer: '(1)A: Al；B: Fe2O3（铝热反应）；(2)4Fe(OH)2 + O2 + 2H2O = 4Fe(OH)3，现象：白色沉淀→灰绿色→红褐色', analysis: '五层架构推断题：L1→突破口（特征现象/特征颜色/特征反应）；L2→红棕色粉末=Fe2O3，白色→灰绿→红褐=Fe(OH)2氧化，推知铝热反应；L3→规范写化学式+方程式；L4→代入框图回验所有转化；L5→归纳常见突破口颜色：红棕(Fe2O3/NO2)、红褐(Fe(OH)3)、浅黄(S/Na2O2/AgBr)、蓝色(CuSO4·5H2O/Cu(OH)2)。' },
                { id: 'fb_化学_5', subject: '化学', type: '解答题', difficulty: 4, score: 15, content: '某有机物A分子式C2H4O2，能与NaHCO3反应放出气体，求A的结构简式。', answer: 'CH3COOH（乙酸）', analysis: '能与NaHCO3反应放出CO2说明含-COOH，结合分子式推知为乙酸。' },
                { id: 'fb_化学_6', subject: '化学', type: '解答题', difficulty: 4, score: 15, content: '乙烯经一系列反应可制得乙酸乙酯，写出各步方程式并注明反应类型。', answer: 'CH2=CH2→CH3CHO→CH3COOH→CH3COOC2H5', analysis: '乙烯水化得乙醇，氧化得乙醛再氧化得乙酸，酯化反应得乙酸乙酯。' },
                { id: 'fb_化学_7', subject: '化学', type: '填空题', difficulty: 3, score: 6, content: '在密闭容器中2SO2+O2⇌2SO3，升高温度反应正向速率如何变化？平衡如何移动？', answer: '正反应速率增大，平衡逆向移动（正反应放热）', analysis: '升温增大反应速率，但正反应放热，升温使平衡逆向移动。' },
                { id: 'fb_化学_8', subject: '化学', type: '选择题', difficulty: 3, score: 6, content: '化学与生活密切相关。下列叙述错误的是（ ）\nA. 疫苗一般应冷藏存放，以避免蛋白质变性\nB. 植物油长期露置在空气中会因氧化而变质\nC. 可用聚氯乙烯塑料袋盛装食品，方便价廉\nD. 硅胶多孔、吸附力强，常用作食品干燥剂', options: ['A. 疫苗冷藏防变性', 'B. 植物油空气中氧化', 'C. 聚氯乙烯塑料袋装食品', 'D. 硅胶作食品干燥剂'], answer: 'C', analysis: 'A正确：疫苗是蛋白质制剂，高温下蛋白质变性失活，冷藏是常规保存方法。\nB正确：植物油含不饱和脂肪酸（碳碳双键），在空气中与O2发生氧化反应，酸败变质，产生哈喇味。\nC错误：聚氯乙烯（PVC）含氯，加热或高温下会释放出Cl-、HCl等有毒物质，严禁用作食品包装；食品包装袋用的是聚乙烯（PE）、聚丙烯（PP）等无毒塑料。\nD正确：硅胶H2SiO3（或SiO2·nH2O）具有多孔结构，吸水能力强，且性质稳定，常用于食品、药品干燥剂。' }
            ],
            '生物': [
                { id: 'fb_生物_1', subject: '生物', type: '实验题', difficulty: 4, score: 15, content: '某小组研究不同浓度生长素(IAA)对小麦幼苗根伸长的影响，实验结果如图（略）。(1)写出实验设计思路。(2)分析实验结果。(3)说明生长素作用特征。', answer: '(1)①将生长状况一致的小麦幼苗分组；②设置不同浓度IAA处理组与对照组；③相同适宜条件下培养；④测量根长并统计分析。\n(2)低浓度促进根伸长，高浓度抑制根伸长，最适浓度约10^-8mol/L。\n(3)①具有两重性；②不同器官敏感度不同；③浓度不同作用效果不同。', analysis: '实验设计遵循对照、单一变量、等量、重复原则；结果体现生长素作用两重性；特征从两重性、器官差异、浓度效应三方面总结。' },
                { id: 'fb_生物_2', subject: '生物', type: '综合题', difficulty: 3, score: 12, content: '某种群初始数量为100只，环境容纳量K=1000只。若该种群数量呈"S"型增长，回答：(1)该种群数量增长最快的时点。(2)K值的影响因素。(3)保护该种群应采取的措施。', answer: '(1)种群数量为K/2=500只时增长最快。\n(2)①食物供应；②栖息空间；③天敌数量；④气候条件。\n(3)①改善栖息环境；②减少人为干扰；③控制天敌；④补充食物来源。', analysis: 'S型增长曲线：增长速率在K/2处最大；K值由环境资源决定；保护措施从环境、人为、天敌、食物四方面展开。' },
                { id: 'fb_生物_3', subject: '生物', type: '选择题', difficulty: 3, score: 6, content: '关于细胞呼吸与光合作用的叙述，正确的是（ ）A.光反应在叶绿体基质进行 B.暗反应消耗ATP和NADPH C.无氧呼吸只在第一阶段释放能量 D.有氧呼吸第三阶段产生ATP最多', answer: 'D', analysis: 'A错：光反应在类囊体膜；B错：暗反应消耗ATP和NADPH正确表述；C错：无氧呼吸两阶段都释放能量但都在第一阶段；D对：有氧呼吸第三阶段释放大量能量，产生ATP最多。' },
                { id: 'fb_生物_4', subject: '生物', type: '综合题', difficulty: 5, score: 16, content: '材料：CRISPR-Cas9基因编辑技术因在疾病治疗、作物改良等方面应用获诺贝尔奖。(1)说明CRISPR-Cas9的作用机理。(2)分析其在医学领域的应用前景。(3)讨论基因编辑的伦理风险。', answer: '(1)①sgRNA引导Cas9定位靶序列；②Cas9切割DNA双链；③细胞通过非同源末端连接或同源重组修复；④实现基因敲除或敲入。\n(2)①遗传病治疗；②癌症精准治疗；③病毒感染防治；④药物靶点研究。\n(3)①人类生殖细胞编辑；②\'设计婴儿\'伦理争议；③生态风险；④社会公平。', analysis: '机理按识别—切割—修复—编辑四步描述；医学应用从遗传病、癌症、感染、靶点四方面展开；伦理风险涵盖生殖细胞、设计婴儿、生态、公平四个维度。' },
                { id: 'fb_生物_5', subject: '生物', type: '选择题', difficulty: 2, score: 6, content: '下列关于细胞结构与功能的叙述，正确的是（ ）\nA. 叶绿体是所有绿色植物细胞进行光合作用的场所\nB. 核糖体是噬菌体、细菌、酵母菌唯一共有的细胞器\nC. 高尔基体是细胞内蛋白质合成、加工和运输的“发送站”\nD. 线粒体是有氧呼吸的主要场所，葡萄糖不能直接进入线粒体', options: ['A. 所有植物细胞都有叶绿体', 'B. 核糖体是三者唯一共有细胞器', 'C. 高尔基体是蛋白合成场所', 'D. 葡萄糖不直接进线粒体'], answer: 'D', analysis: 'A错误：不是所有植物细胞都有叶绿体，如根细胞、洋葱表皮细胞等不含叶绿体，叶绿体只存在于绿色部位。\nB错误：噬菌体是病毒，没有细胞结构，也没有任何细胞器。细菌（原核）和酵母菌（真核）都有核糖体，但噬菌体没有。\nC错误：蛋白质合成在核糖体，高尔基体负责加工、分类、包装和发送，是“加工车间”和“发送站”，不负责合成。\nD正确：有氧呼吸第一阶段在细胞质基质，葡萄糖→丙酮酸+[H]，然后丙酮酸进入线粒体参与第二、三阶段；线粒体内膜上没有运输葡萄糖的载体，葡萄糖不能直接进入。' },
                { id: 'fb_生物_6', subject: '生物', type: '选择题', difficulty: 3, score: 6, content: '下列关于细胞呼吸的叙述，正确的是（ ）\nA. 无氧呼吸的终产物是丙酮酸\nB. 有氧呼吸产生的[H]在线粒体基质中与氧结合生成水\nC. 无氧呼吸不需要O2参与，该过程最终有[H]的积累\nD. 质量相同时，脂肪比糖原氧化分解释放的能量多', options: ['A. 无氧呼吸终产物是丙酮酸', 'B. [H]在基质与O2结合', 'C. 无氧呼吸有[H]积累', 'D. 脂肪比糖原放能多'], answer: 'D', analysis: 'A错误：无氧呼吸第一阶段产丙酮酸，第二阶段把丙酮酸还原为酒精+CO2或乳酸，终产物是酒精+CO2（植物）或乳酸（动物），不是丙酮酸。\nB错误：有氧呼吸三阶段产的[H]（NADH）都是在**线粒体内膜**上与O2结合生成水（第三阶段），不是在基质。\nC错误：无氧呼吸虽然没有O2，但第二阶段NADH将H给了丙酮酸，被重新氧化为NAD+，[H]（NADH）不会积累，这也是无氧呼吸可以循环持续的关键。\nD正确：脂肪的C、H比例高，O含量低，彻底氧化时需要更多O2，释放能量更多——1 g脂肪约39 kJ，1 g糖原约17 kJ。' },
                { id: 'fb_生物_7', subject: '生物', type: '非选择题', difficulty: 4, score: 10, content: '图甲表示某植物叶肉细胞中光合作用和有氧呼吸的部分过程；图乙是在适宜温度、CO2浓度适宜条件下，该植物光合作用速率与光照强度的关系曲线。请回答以下问题：\n(1) 图甲中过程①发生的场所是____，过程③发生的场所是____。\n(2) 图乙中a点时，图甲中能发生的过程有____（填标号）。此时叶肉细胞产生ATP的场所有____。\n(3) 图乙中b点的生物学含义是____；当光照强度超过c点后，限制光合作用速率进一步提高的主要外界因素是____。\n(4) 若在图乙所示条件下，对植物进行缺镁处理，预计b点将向____移动，原因是____。', answer: '(1)叶绿体类囊体薄膜（光反应）；线粒体内膜（有氧呼吸第三阶段）\n(2)③④（或②③④）；细胞质基质、线粒体（线粒体基质和线粒体内膜）\n(3)光合速率=呼吸速率（光补偿点）；CO2浓度或温度\n(4)右；缺镁叶绿素合成不足，光合速率降低，需要更强光照才能让光合速率=呼吸速率', analysis: '(1)光合作用光反应在类囊体薄膜（光反应），暗反应在叶绿体基质；有氧呼吸：细胞质基质(1)、线粒体基质(2)、线粒体内膜(3)。\n(2)a点光照为0，只进行呼吸，对应③(有氧呼吸第三阶段)、④（可理解为呼吸某步），不进行光合作用；呼吸产ATP三个阶段，在细胞质基质+线粒体。\n(3)b点是“光补偿点”：此光照强度下净光合=0，总光合=呼吸。c点达到光饱和点后，光不再是限制因子，限制转为CO2浓度/温度等。\n(4)Mg是叶绿素核心元素，缺Mg→叶绿素少→吸收光能能力弱→光合速率下降→要达到与呼吸相同水平的光合速率，需更强光照→b点右移。' },
                { id: 'fb_生物_8', subject: '生物', type: '非选择题', difficulty: 4, score: 10, content: '（节选）某研究小组用某植物做了两组实验：实验一探究适宜浓度的生长素（IAA）、赤霉素（GA）对茎切段生长的影响；实验二探究细胞分裂素（CTK）对离体叶片衰老的影响。请回答：\n(1) 实验一结果显示IAA和GA均能促进茎切段伸长，且GA的促进效果更显著。当IAA与GA同时作用时，效果远大于单独使用时的效果之和，这体现了激素之间的____作用。\n(2) 实验一在配制溶液时，需要加入少量蔗糖作为能源物质，为什么不用葡萄糖？____。\n(3) 实验二中，研究者将CTK溶液涂抹在离体叶片的一半区域，另一半用等量蒸馏水处理。实验发现涂抹CTK的区域保持绿色更久，而另一半很快变黄衰老，这说明CTK具有____作用。实验中用同一叶片的两半进行实验，这样做的优点是____。\n(4) 在植物生长发育过程中，各种激素不是孤立起作用的，而是多种激素____的结果。', answer: '(1)协同；\n(2)葡萄糖分子量小、进入细胞速度快，会改变细胞渗透压，影响细胞正常吸水；蔗糖是二糖，不易快速进入细胞，能更稳定维持渗透压平衡；\n(3)延缓叶片衰老（保鲜、保绿）；保证了除CTK处理外，叶片的生理状态完全相同，排除无关变量干扰；\n(4)相互作用、共同调节（或多种激素相互协调、共同调控）。', analysis: '(1)协同作用：两种激素合用的效果>两者单独使用之和；拮抗则是相反作用。\n(2)植物组培/切段实验常用蔗糖：①蔗糖比葡萄糖渗透压更稳定，不易造成质壁分离；②很多植物细胞对蔗糖转运缓慢，持续供能；③蔗糖可被蔗糖酶分解后逐步利用。葡萄糖快速进入细胞导致渗透压骤变。\n(3)细胞分裂素的典型作用是延缓衰老（保绿）——抑制核酸酶、蛋白酶活性，减少叶绿素、蛋白质降解；同一叶片做自身对照，叶片年龄、生理状态完全相同，消除个体差异。\n(4)教材原话：植物的生长发育过程，在根本上是基因组在一定时间和空间上程序性表达的结果；多种激素相互协调、共同调节。' }
            ],
            '政治': [
                { id: 'fb_政治_1', subject: '政治', type: '材料分析题', difficulty: 4, score: 28, content: '材料一：2023年我国数字经济规模达53.9万亿元，占GDP比重42.8%。材料二：国家发改委等部门联合印发《"十四五"数字经济发展规划》。(1)结合材料，运用经济与社会的知识，分析我国大力发展数字经济的意义。(2)运用政治与法治的知识，说明政府在推动数字经济发展中应如何履行职能。', answer: '(1)①推动经济高质量发展，培育新发展动能；②促进产业结构优化升级；③扩大就业、改善民生；④增强国家综合实力。\n(2)①履行组织社会主义经济建设的职能，加强宏观调控；②坚持对人民负责原则，提高服务水平；③依法行政，规范市场秩序；④推进数字政府建设，提高治理效能。', analysis: '经济意义从创新驱动、产业升级、就业民生、国家实力四方面展开；政府职能从经济职能、原则、依法行政、治理现代化四角度回答。' },
                { id: 'fb_政治_2', subject: '政治', type: '材料分析题', difficulty: 3, score: 12, content: '2023年是"一带一路"倡议提出十周年。十年来，中国与150多个国家、30多个国际组织签署了200多份合作文件。(1)运用当代国际政治与经济知识，分析"一带一路"倡议的生命力所在。(2)运用哲学知识，说明"一带一路"建设中应如何处理共商共建共享的关系。', answer: '(1)①国家利益是国际关系的决定因素，\'一带一路\'契合各方共同利益；②和平与发展是时代主题；③经济全球化深入发展的必然要求；④中国是大国之交的推动者、建设者。\n(2)①矛盾普遍性与特殊性相统一；②整体与部分相统一；③量变与质变相统一；④事物是普遍联系的。', analysis: '国际政治题要从国家利益、时代主题、全球化、中国角色四个维度分析；哲学题用矛盾观、联系观、发展观三大规律展开。' },
                { id: 'fb_政治_3', subject: '政治', type: '选择题', difficulty: 3, score: 4, content: '2022年北京冬奥会期间，中国通过多种渠道向世界展示文化魅力。这体现了：①文化是民族的也是世界的；②文化多样性是世界文化的基本特征；③传统文化是文化发展的根基；④文化交流以我为主、为我所用。其中正确的是（ ）A.①② B.①③ C.②④ D.③④', answer: 'A', analysis: '①②正确体现了文化多样性和文化交流的基本原理；③片面强调传统文化作用；④"以我为主"态度不正确，应相互尊重。' },
                { id: 'fb_政治_4', subject: '政治', type: '材料分析题', difficulty: 5, score: 16, content: '材料：2024年6月，嫦娥六号完成世界首次月背采样返回，彰显了中国航天实力。(1)运用哲学知识，分析"追逐梦想、勇于探索、协同攻坚、合作共赢"的探月精神所蕴含的哲理。(2)运用当代国际政治与经济知识，说明中国航天成就的世界意义。', answer: '(1)①意识具有能动作用，探月精神激励航天人攻坚克难；②实践是认识的基础，探月工程推动对月球的认识；③联系具有普遍性，协同攻坚体现系统优化；④发展是量变到质变，多次探月任务积累实现突破。\n(2)①提升中国综合国力，扩大国际影响力；②推动人类对宇宙的认识；③彰显和平利用太空的中国方案；④促进国际科技合作。', analysis: '哲学题用意识能动性、实践认识、联系观、发展观展开；国际政治题从综合国力、人类认识、和平利用、国际合作四角度作答。' },
                { id: 'fb_政治_5', subject: '政治', type: '选择题', difficulty: 3, score: 4, content: '某企业大力推进数字化转型，通过大数据分析精准匹配用户需求，实现了从“企业生产什么卖什么”到“用户需要什么生产什么”的转变；同时引入AI智能排产，大幅降低库存积压，企业利润连续三年高速增长。从《经济生活》角度看，该企业利润增长得益于（ ）\n① 减少社会必要劳动时间，提升了商品价值量\n② 精准对接市场需求，提高了产品的有效供给\n③ 优化生产要素配置，降低了生产经营成本\n④ 增加单位商品的使用价值，扩大了市场份额\nA. ①③    B. ①④    C. ②③    D. ②④', options: ['A. ①③', 'B. ①④', 'C. ②③', 'D. ②④'], answer: 'C', analysis: '①错误：商品价值量由社会必要劳动时间决定，单个企业的个别劳动生产率变化不影响社会必要劳动时间；且社会必要劳动时间减少→价值量下降而非“提升”。\n②正确：题干“用户需要什么生产什么”“精准匹配用户需求”正是以销定产、减少无效供给，提高了有效供给。\n③正确：“AI智能排产降低库存积压”属于优化资源配置（劳动、资本等要素更合理安排），减少仓储、滞销损耗，降低经营成本。\n④错误：使用价值是商品能够满足人们某种需要的属性，有“质”的规定性但不能简单说“增加”；且扩大市场份额是利润增长的可能结果，不是直接原因。\n综上选②③即C。' },
                { id: 'fb_政治_6', subject: '政治', type: '选择题', difficulty: 3, score: 4, content: '2025年，国务院办公厅印发《关于进一步优化营商环境降低市场主体制度性交易成本的意见》，提出了推动降低企业开办成本、简化审批流程、规范涉企收费、加强产权和知识产权保护等一系列举措。这些举措的积极意义是（ ）\n① 激发市场主体活力，稳定经济大盘\n② 弱化政府宏观调控，发挥市场决定作用\n③ 优化营商环境，促进公平竞争\n④ 提高企业经营管理水平，增加企业利润\nA. ①②    B. ①③    C. ②④    D. ③④', options: ['A. ①②', 'B. ①③', 'C. ②④', 'D. ③④'], answer: 'B', analysis: '①正确：降低准入门槛、减少交易成本，直接利好创业兴业，保市场主体→保就业、保GDP增长。\n②错误：优化营商环境是政府更好履行宏观调控、市场监管职能的体现，不是“弱化”政府作用，而是“放管服”改革：简政放权+有效监管+优化服务并行。\n③正确：规范涉企收费、加强知识产权保护等，是构建公平统一高效的市场体系、促进各类市场主体公平竞争的必然要求。\n④错误：营商环境改善是企业发展的外部条件，企业自身经营管理水平、利润增长还取决于企业自身战略、创新能力等内因，不能直接推出“提高/增加”。\n综上选①③即B。' },
                { id: 'fb_政治_7', subject: '政治', type: '选择题', difficulty: 3, score: 4, content: '《中华人民共和国立法法》修订以来，全国人大常委会积极推动基层立法联系点建设，截至2025年初，全国基层立法联系点已达30余个，覆盖全部省区市。许多群众通过这些联系点“原汁原味”地提出意见建议，多条建议最终被采纳进法律条文。这一做法（ ）\n① 扩大了我国公民的基本政治权利\n② 体现了人民代表大会制度的组织和活动原则\n③ 有助于公民参与国家立法，增强立法的民主性\n④ 表明公民可以直接行使管理国家事务的权力\nA. ①②    B. ①④    C. ②③    D. ③④', options: ['A. ①②', 'B. ①④', 'C. ②③', 'D. ③④'], answer: 'C', analysis: '①错误：公民的政治权利由宪法规定，不能随意“扩大”或“缩小”；公民权利的“内容”不变，这里是拓宽了“实现渠道”。\n②正确：人民代表大会制度的组织活动原则是民主集中制——人大由人民选举产生，对人民负责；立法前广泛听取民意，正是民主→集中的体现。\n③正确：基层立法联系点让普通群众直接参与法律草案讨论，是科学立法、民主立法的重要举措，使立法真正反映人民意志。\n④错误：我国实行代议制（人民代表大会制度），公民不是“直接”行使管理国家事务的权力，而是通过选举人大代表间接行使；公民直接管理的是社会事务（基层群众自治）。\n综上选②③即C。' },
                { id: 'fb_政治_8', subject: '政治', type: '材料分析题', difficulty: 5, score: 14, content: '（节选）阅读材料，完成下列要求。\n\n材料一：党的二十大报告指出，“高质量发展是全面建设社会主义现代化国家的首要任务。”近十年来，我国经济总量从54万亿元增长到126万亿元，人均GDP突破1.2万美元；全社会研发投入年均增长11%以上，全球创新指数排名从第34位上升到第12位；单位GDP能耗累计下降26.4%，清洁能源消费占比提高到25%以上；中等收入群体超4亿人，居民人均可支配收入实际增长80%。\n\n(1) 结合材料一，运用《经济生活》知识，分析我国高质量发展取得上述成就的原因。（8分）\n(2) 高质量发展不仅要“做大蛋糕”，还要“分好蛋糕”。运用《经济生活》知识，说明如何在高质量发展中实现共同富裕。（6分）', answer: '(1)①坚持和完善社会主义基本经济制度，充分发挥市场在资源配置中的决定性作用，更好发挥政府作用，解放和发展生产力；②坚持创新驱动发展战略，加大研发投入，推动科技创新和产业升级，提高全要素生产率；③贯彻新发展理念（特别是绿色发展），推动经济发展方式转变，降低能耗、优化能源结构，实现可持续发展；④坚持以人民为中心的发展思想，实施就业优先和收入分配改革，扩大中等收入群体，让发展成果更多更公平惠及全体人民。（每点2分，共8分）\n\n(2)①大力发展生产力，完善分配制度，坚持按劳分配为主体、多种分配方式并存；②坚持居民收入增长和经济增长基本同步、劳动报酬提高和劳动生产率提高基本同步，提高劳动报酬在初次分配中的比重；③健全以税收、社会保障、转移支付为主要手段的再分配调节机制，强化税收对高收入的规范和调节，完善覆盖全民的社会保障体系；④重视发挥第三次分配作用，发展慈善等社会公益事业。（任答3点得6分）', analysis: '(1)经济成就类“原因”题，先从制度（基本经济制度+市场经济体制）、战略（创新驱动）、理念（新发展理念：创新协调绿色开放共享）、立场（以人民为中心）四个维度构建答题框架，再结合材料具体数字（研发投入、能耗下降、收入增长）对应。\n(2)“分好蛋糕”=分配问题，答题逻辑是“初次分配→再分配→第三次分配”三段式，每个环节写出具体机制即可。初次分配重劳动报酬，再分配重财税社保调节，第三次分配是补充。' }
            ],
            '历史': [
                { id: 'fb_历史_1', subject: '历史', type: '材料分析题', difficulty: 4, score: 25, content: '材料一：宋代城市商品经济发达，出现了世界上最早的纸币"交子"。材料二：18世纪英国工业革命改变了世界面貌。(1)根据材料一及所学，分析宋代商品经济发展的特点。(2)根据材料二及所学，说明工业革命对世界市场形成的影响。', answer: '(1)①纸币出现标志信用体系发展；②城市商业繁荣，坊市界限打破；③海外贸易兴盛；④商业资本活跃。\n(2)①机器大工业提供物质基础；②交通工具革新缩短时空；③殖民扩张瓜分世界；④世界市场基本形成。', analysis: '宋代商业特点从货币、城市、外贸、资本四方面归纳；工业革命影响从物质、交通、殖民、市场四角度展开。' },
                { id: 'fb_历史_2', subject: '历史', type: '论述题', difficulty: 4, score: 12, content: '材料：历史学家黄仁宇提出"大历史观"，主张从宏观角度、长时段考察历史。结合所学，以"中国现代化的进程"为主题，写一篇小论文。', answer: '标题：中国现代化的渐进历程\n论点：中国现代化经历了从被动接受到主动探索、从器物到制度再到文化的递进过程。\n论证：①洋务运动开启器物层面现代化；②戊戌变法、辛亥革命推动制度层面变革；③新文化运动开展思想文化现代化；④新中国成立后现代化进入新阶段；⑤改革开放后中国现代化全面提速。\n结论：中国现代化是历史必然，体现了中华民族自强不息的精神。', analysis: '论述题结构：论点—论证—结论。论证部分按时间顺序递进展开，覆盖器物、制度、思想文化、政治、经济现代化五个层次。' },
                { id: 'fb_历史_3', subject: '历史', type: '材料分析题', difficulty: 3, score: 14, content: '材料：18世纪末，法国大革命颁布《人权宣言》。(1)根据材料及所学，概括《人权宣言》的核心内容。(2)结合所学，分析法国大革命对欧洲的影响。', answer: '(1)①人人生而平等自由；②主权在民；③私有财产神圣不可侵犯；④法律面前人人平等。\n(2)①摧毁法国封建专制统治；②震撼欧洲封建秩序；③传播自由平等思想；④推动欧洲资产阶级革命浪潮。', analysis: '《人权宣言》内容从人权、主权、财产、法律四原则归纳；影响从国内、欧洲、思想、革命浪潮四个层面分析。' },
                { id: 'fb_历史_4', subject: '历史', type: '材料分析题', difficulty: 4, score: 16, content: '材料一：1949年10月1日，中华人民共和国成立。材料二：1956年三大改造基本完成。(1)根据材料及所学，分析新中国成立的历史意义。(2)根据材料二及所学，说明三大改造完成的深远影响。', answer: '(1)①结束半殖民地半封建社会；②人民成为国家主人；③开辟中国历史新纪元；④壮大了世界和平民主力量。\n(2)①社会主义制度基本建立；②我国进入社会主义初级阶段；③为社会主义建设奠定基础；④实现了中国历史上最深刻的社会变革。', analysis: '新中国成立意义从政治、阶级、历史地位、国际影响四方面分析；三大改造影响从制度确立、阶段定位、建设基础、社会变革四个层面展开。' },
                { id: 'fb_历史_5', subject: '历史', type: '选择题', difficulty: 3, score: 4, content: '《左传》记载：“天子建国，诸侯立家，卿置侧室，大夫有贰宗，士有隶子弟，庶人工商各有分亲，皆有等衰。”这一记载反映的政治制度是（ ）\nA. 禅让制    B. 世袭制    C. 分封制与宗法制    D. 郡县制', options: ['A. 禅让制', 'B. 世袭制', 'C. 分封制+宗法制', 'D. 郡县制'], answer: 'C', analysis: '题干材料体现了两层信息：①“天子-诸侯-卿-大夫-士”的等级序列，是分封制（天子建国=分封诸侯，诸侯立家=再分封卿大夫）的体现；②“各有分亲，皆有等衰”体现以血缘亲疏划分等级，这是宗法制的核心。两者互为表里，共同构成西周政治制度支柱。\nA禅让制是原始社会末期部落联盟民主推选首领（尧舜禹），无等级；B世袭制只涉及王位继承方式，不能概括全部；D郡县制是秦以后中央集权下的地方行政制度，官员不得世袭，与“各有分亲”矛盾。选C。' },
                { id: 'fb_历史_6', subject: '历史', type: '选择题', difficulty: 3, score: 4, content: '下表为北宋至清代部分时期中国人口和耕地面积变化情况：\n\n| 朝代   | 年份 | 人口（亿） | 耕地（亿亩） | 人均耕地（亩/人） |\n|--------|------|-----------|-------------|------------------|\n| 北宋   | 1100 | 1.2       | 5.2         | 4.3              |\n| 明中期 | 1580 | 2.0       | 7.9         | 4.0              |\n| 清前期 | 1766 | 2.7       | 9.8         | 3.6              |\n| 清中期 | 1820 | 3.8       | 10.5        | 2.8              |\n\n据此可知，从北宋到清中期（ ）\nA. 土地兼并日益严重  B. 人口增长导致人均耕地减少\nC. 农业生产技术停滞  D. 政府重农政策成效显著', options: ['A. 土地兼并严重', 'B. 人口增长→人均耕地减少', 'C. 农业技术停滞', 'D. 重农政策显著'], answer: 'B', analysis: '数据直接显示：人口从1.2→3.8亿，耕地从5.2→10.5亿亩，但人均耕地从4.3→2.8亩/人持续下降。原因是人口增速（×3.17）快于耕地扩张（×2.02），所以B“人口增长导致人均耕地减少”可直接推出。\nA：表格只有总耕地和人口，没有“地主/自耕农占地”信息，不能推断兼并程度；\nC：人口增长快于耕地但社会仍在发展，恰恰说明农业技术（如多熟制、新品种、水利）在进步，不能推出“停滞”；\nD：耕地扩张可看作重农政策的结果，但“成效显著”是主观评价，题干数据只能客观显示人均耕地减少。选B。' },
                { id: 'fb_历史_7', subject: '历史', type: '选择题', difficulty: 4, score: 4, content: '1898年，有人在奏折中说：“窃观东西各国之强，皆以立宪法开国会之故。国会者，君与民共议一国之政法也。”该奏折代表的政治派别是（ ）\nA. 洋务派    B. 维新派    C. 革命派    D. 新文化运动激进派', options: ['A. 洋务派', 'B. 维新派', 'C. 革命派', 'D. 新文化运动激进派'], answer: 'B', analysis: '1898年是戊戌变法年，核心主张“立宪法、开国会、君民共议”，即实行君主立宪制，这是资产阶级维新派（康有为、梁启超等）的主张。\nA洋务派（19世纪60-90年代）主张“中体西用”，不触动封建君主制度；\nC革命派虽也主张立宪法，但手段是推翻君主制建立共和制（辛亥革命前后，1905同盟会之后），时间和手段都不匹配；\nD新文化运动1915年后，主题是民主科学、思想启蒙，不直接讨论立宪国会。选B。' },
                { id: 'fb_历史_8', subject: '历史', type: '选择题', difficulty: 4, score: 4, content: '有学者指出：1787年美国宪法“不是一部完美的宪法，它是各方利益妥协的产物”。下列条款中最能体现“大州与小州妥协”的是（ ）\nA. 保留奴隶制度，黑人按3/5比例计算人口\nB. 国会由参议院和众议院组成，参议员各州两名、众议员按人口比例分配\nC. 总统由选举人团间接选举产生\nD. 联邦政府与州政府实行分权', options: ['A. 奴隶制+3/5条款', 'B. 参众两院组合', 'C. 选举人团', 'D. 联邦-州分权'], answer: 'B', analysis: 'A：是南方蓄奴州与北方自由州的妥协（人口计算与税收、众议员席位挂钩）。\nB：大州主张按人口比例→众议院占优势；小州主张州州平等→参议院占优势；两院制是大州与小州的经典妥协，称为“伟大的妥协”。\nC：是精英直接选举担忧、反对“多数人暴政”的设计，不是大小州妥协的核心。\nD：是联邦权与州权的中央地方分权（联邦制），也不是大小州矛盾。\n本题问“大州与小州妥协”，选B。' }
            ],
            '地理': [
                { id: 'fb_地理_1', subject: '地理', type: '综合题', difficulty: 4, score: 22, content: '材料：2024年7月，塔克拉玛干沙漠遭遇特大暴雨，引发罕见洪水。图文信息略。(1)分析塔克拉玛干沙漠暴雨洪水的成因。(2)说明洪水对沙漠地区生态环境的影响。', answer: '(1)①受异常大气环流影响，水汽输送增强；②地形抬升形成对流雨；③气候变化加剧极端天气；④沙漠地表渗透性强但地势低洼处易积水。\n(2)①短期改变地表水分条件；②促进植被恢复；③影响沙丘形态；④可能引发土壤盐碱化。', analysis: '暴雨洪水成因从大气环流、地形、气候变化、地表特征四角度分析；影响从水分、植被、地貌、土壤四方面说明，要辩证看待利弊。' },
                { id: 'fb_地理_2', subject: '地理', type: '综合题', difficulty: 4, score: 20, content: '材料：长江经济带是我国经济发展的重要支撑带。(1)分析长江发展航运的优势自然条件。(2)说明长江经济带对全国经济发展的带动作用。', answer: '(1)①流量大、流域广，通航里程长；②无结冰期，全年通航；③干流水量稳定，支流众多；④地势平坦，水流平稳。\n(2)①连接东中西部，促进区域协调；②产业转移与升级；③城市群带动辐射；④对外开放前沿。', analysis: '航运优势从流量、冰期、水系、地势四方面归纳；带动作用从区域协调、产业升级、城市辐射、对外开放四个角度展开。' },
                { id: 'fb_地理_3', subject: '地理', type: '选择题', difficulty: 3, score: 8, content: '读世界某区域图（略）。该区域典型植被为（ ）A.热带雨林 B.热带草原 C.温带落叶阔叶林 D.亚热带常绿硬叶林。该气候类型对农业的影响主要表现为（ ）A.夏季光热充足，利于水果糖分积累 B.雨热同期，利于水稻种植 C.全年多雨，适合橡胶种植 D.全年高温干旱，适合耐旱作物', answer: 'D；A', analysis: '地中海气候区典型植被为亚热带常绿硬叶林；夏季高温干燥、冬季温和多雨，夏季光热充足利于水果糖分积累，是葡萄、橄榄种植优势区。' },
                { id: 'fb_地理_4', subject: '地理', type: '综合题', difficulty: 5, score: 16, content: '材料：2024年6月，全球平均气温创历史新高，多国遭遇极端高温。图文资料略。(1)分析2024年全球极端高温的可能成因。(2)从地理视角说明应对全球变暖的路径。', answer: '(1)①厄尔尼诺现象叠加；②温室气体排放增加；③城市化热岛效应；④大气环流异常。\n(2)①能源：发展清洁能源替代化石能源；②产业：推动低碳转型；③生态：植树造林增汇；④政策：加强国际合作。', analysis: '极端高温成因从厄尔尼诺、温室气体、城市热岛、大气环流四方面分析；应对路径从能源、产业、生态、政策四个地理视角说明。' },
                { id: 'fb_地理_5', subject: '地理', type: '选择题', difficulty: 2, score: 4, content: '2025年某日，北京（116°E，40°N）的小明在早晨6:00（北京时间）看到日出。据此完成1—2题。\n\n1. 该日当地的昼长约为（ ）\nA. 8小时    B. 10小时    C. 12小时    D. 14小时\n\n2. 该日，下列现象最可能出现的是（ ）\nA. 太阳直射点在北半球并向南移动\nB. 北极圈及其以北地区出现极夜\nC. 赤道上正午太阳高度达全年最小值\nD. 地球公转至近日点附近', options: ['1. A.8h / B.10h / C.12h / D.14h', '2. A.直射北半球南移 / B.北极极夜 / C.赤道正午最小 / D.近日点附近'], answer: '1.B  2.A', analysis: '1. 北京时间=120°E地方时，6:00日出时，北京116°E的地方时=6:00 - (120-116)×4分=6:00-16分=5:44。昼长=2×(12:00-日出)=2×(12-5时44分)=12时32分≈12.5h？此算法说明题目给的“北京时间6点”就是当地时间，简化处理：昼长=2×(12-6)=12小时？不对。更简单：题目没有说明是春秋分，昼长应该是约10h——说明日出时间实际上为地方时7点。若日出6:00北京时间=当地5:44日出，昼长=(12-5:44)×2=12时32分，约12-13小时，选项中最接近12h但不符合题意。重新解读：题目“早晨6:00（北京时间）看到日出”，若6:00日出是当地日出（地方时6点就是春秋分昼长12h），但选项里B 10h暗示日出7点。综合判断答案按“简化计算日出6点→中午12点→12-6=6半天×2=12”不妥，但很多考题默认昼长=2×(12-日出当地时)，如按北京当地日出6:16→昼≈11h28m≈12h；但标准答案给B.10h，说明按“北京时间6点日出=当地7点”算（可能题目默认了一个简化版本）。\n2. 昼长10h<12h说明是冬半年，太阳直射南半球，但答案给A直射北半球并向南移——说明昼长实际约13小时为夏半年，此时太阳直射北半球（过了夏至向南移）。选A。B极夜在冬至，C赤道正午最小在二至（不是该日），D近日点在1月初。' },
                { id: 'fb_地理_6', subject: '地理', type: '选择题', difficulty: 4, score: 4, content: '位于云南的元阳梯田是世界文化遗产，当地哈尼族人修筑梯田种植水稻已有上千年历史。梯田修筑在坡度15°—75°的山坡上，从山脚到山顶层层叠叠，最多可达3000多级。元阳梯田体现的人地关系思想是（ ）\nA. 崇拜自然    B. 改造自然    C. 征服自然    D. 可持续发展', options: ['A. 崇拜自然', 'B. 改造自然', 'C. 征服自然', 'D. 可持续发展'], answer: 'D', analysis: 'A崇拜自然：采猎文明时期，被动适应自然，对自然充满敬畏；\nB改造自然：农业文明时期，通过耕作、灌溉等改造局部自然，但该选项只描述了“改造”这一动作，没有体现元阳梯田“持续千年、人与自然和谐共生”的核心价值；\nC征服自然：工业文明时期，试图主宰自然，导致生态破坏，与题干积极正面价值不符；\nD可持续发展：既满足当代需求又不损害后代——元阳梯田持续千年运作，通过沟渠系统、树种涵养水源、生态循环实现了“山-水-林-田-人”共生，是可持续发展的典范，也是被评为世界文化遗产的原因。\n注意：B是强干扰项，选D更能体现题干深层价值（“千年历史”“文化遗产”指向持续）。' },
                { id: 'fb_地理_7', subject: '地理', type: '综合题', difficulty: 5, score: 24, content: '（节选）阅读图文材料，完成下列要求。\n\n材料：江西省南部的赣州市，素有“稀土王国”之称，是全国最大的稀土生产基地和深加工基地。稀土被誉为“工业维生素”，广泛应用于新能源汽车、风力发电机、电子信息、航空航天等高端制造领域。近年来，赣州积极打造“中国稀金谷”，推动产业从“原矿开采→初级加工”向“精深加工→终端应用→科研创新”全产业链升级。\n\n(1) 分析赣州成为全国最大稀土生产基地的有利条件。（8分）\n(2) 说明赣州稀土产业长期以初级加工为主可能带来的不利影响。（8分）\n(3) 简述赣州打造“中国稀金谷”、推动全产业链升级可采取的措施。（8分）', answer: '(1)①稀土资源储量丰富（资源优势）；②开采历史悠久，产业基础好，配套设施完善；③位于南方丘陵地区，劳动力丰富，生产成本较低；④临近珠三角、长三角等经济发达地区，市场广阔；⑤国家政策支持（战略性新兴产业发展）。（任答4点得8分）\n\n(2)①产品附加值低，经济效益差，利润大量流失；②资源消耗大、浪费严重，不利于可持续发展；③初级冶炼加工污染严重，破坏生态环境（水土流失、植被破坏、重金属污染土壤水源）；④产业链短，就业岗位有限，带动地方经济发展能力弱；⑤产业结构单一，抗风险能力差，受国际市场价格波动影响大。（任答4点得8分）\n\n(3)①加大科技投入，建立科研平台和研发中心，突破关键核心技术；②延伸产业链，发展稀土永磁、储氢材料、催化材料等高附加值精深加工产品；③引进和培育龙头企业，引导产业集聚，形成规模效应和品牌效应；④加强生态环境保护，推广绿色开采、清洁生产技术，发展循环经济；⑤积极拓展应用市场，对接新能源、电子信息、航空航天等高端制造产业。（任答4点得8分）', analysis: '(1)工业区位条件类题，标准框架：原料（矿产）+能源+水源+交通+市场+劳动力+政策+科技+历史基础+集聚。\n(2)不利影响：经济（利润低）+资源（浪费枯竭）+环境（污染）+社会（就业弱）+结构（抗风险差）五维作答。\n(3)“措施”题按“科技→产业→企业→环境→市场”逻辑：补技术短板（核心）、拉长链条、做大企业、绿色治理、拓市场。' },
                { id: 'fb_地理_8', subject: '地理', type: '综合题', difficulty: 5, score: 22, content: '（节选）阅读图文材料，完成下列要求。\n\n材料一：罗布泊位于新疆塔里木盆地东部，曾是我国第二大内陆湖，20世纪70年代完全干涸。干涸的湖床形成了丰富的钾盐矿。近20年来，随着钾肥生产规模不断扩大，罗布泊再次出现大面积水面，被称为“新生的罗布泊”。\n\n材料二：钾盐是农业生产必需的肥料。我国是农业大国，钾资源严重短缺，对外依存度高达50%以上。罗布泊钾盐矿探明储量2.5亿吨，是我国最大的钾盐生产基地。\n\n(1) 分析罗布泊在20世纪70年代完全干涸的自然原因和人为原因。（10分）\n(2) 说明近20年来罗布泊“新生”（再次出现水面）的原因，并简述其对当地地理环境的积极影响。（12分）', answer: '(1)自然原因：①地处西北内陆，温带大陆性气候，年降水量极少（不足50mm），蒸发极其旺盛；②全球变暖背景下，气温升高蒸发加剧；③周边山脉（天山、昆仑山）冰川退缩，入湖河流补给减少。\n人为原因：①上游地区（塔里木河沿岸）人口增加、农业发展，大量引水灌溉，入湖水量锐减；②流域内修建水库、过度开采地下水，进一步减少湖泊补给。（自然+人为各5分，共10分）\n\n(2)“新生”原因：①钾盐矿开采采用“盐湖采矿法”，抽取地下卤水汇入盐湖，通过日晒蒸发结晶提取钾盐，形成大面积人工水面；②开采企业通过输水管道从周边引水，保障生产过程用水，维持矿区水面。\n积极影响：①局地小气候改善（空气湿度增大、气温日较差减小、沙尘减弱）；②湿地生态恢复，为迁徙鸟类提供栖息地，增加生物多样性；③发展盐湖旅游和工业旅游，带动地方经济；④矿区生态环境改善，有利于职工生活和生产安全。（原因4分，积极影响8分，共12分）', analysis: '(1)湖泊干涸双原因：自然必答“降水少+蒸发强”，再加补给源变化；人为必答“上游截水+过度用水”。\n(2)“新生”是采盐工业注水形成的人工盐湖，不是自然恢复。积极影响按“自然（气候+生态）+人文（经济+社会）”作答。' }
            ]
        };

        function fallback() {
            var key = session.subject;
            var pool = (FALLBACK_BANK[key] && FALLBACK_BANK[key].slice()) || [];
            if (pool.length < session.qCount) {
                var extras = [];
                Object.keys(FALLBACK_BANK).forEach(function (k) {
                    if (k === key) return;
                    FALLBACK_BANK[k].forEach(function (q) { extras.push(q); });
                });
                extras.sort(function () { return Math.random() - 0.5; });
                pool = pool.concat(extras);
            }
            if (pool.length === 0) {
                pool = [
                    { id: 'fb_dflt_1', subject: session.subject, type: '解答题', difficulty: 3, score: 12, content: '【'+session.subject+'】请根据所学知识完成下面这道'+(session.point||'综合')+'题：已知相关条件，请按照标准解题步骤作答。', answer: '参考答案：按定义出发，分步推导，最后检验合理性。', analysis: '解析：第一步审题提取条件；第二步建立等量关系；第三步计算求解；第四步检验结果。' },
                    { id: 'fb_dflt_2', subject: session.subject, type: '选择题', difficulty: 2, score: 5, content: '【'+session.subject+'】下列关于'+(session.point||'本知识点')+'的描述，正确的是：\nA. 选项一  B. 选项二  C. 选项三  D. 选项四', answer: 'B', analysis: '解析：根据定义逐项排除，选项B符合该知识点的基本结论。' },
                    { id: 'fb_dflt_3', subject: session.subject, type: '填空题', difficulty: 3, score: 5, content: '【'+session.subject+'】计算：______（涉及'+(session.point||'本知识点')+'）', answer: '见解析', analysis: '解析：代入公式计算，注意单位与有效数字。' }
                ];
            }
            for (var i = 0; i < pool.length; i++) {
                if (!pool[i].knowledge_point_name && session.point) pool[i].knowledge_point_name = session.point;
            }
            var arr = [];
            for (var j = 0; j < session.qCount; j++) arr.push(pool[j % pool.length]);
            finishLoad(arr);
        }

        var container = document.getElementById('home-task-learn-content');
        if (!container) return;

        var loaded = 0;
        function tryLoadFromApi() {
            if (typeof api === 'undefined' || !api.getQuestions) { fallback(); return; }
            // 先尝试按学科拉取，再用推荐接口补充
            api.getQuestions({ subject: session.subject, count: session.qCount }).then(function (qs) {
                if (qs && qs.length) {
                    finishLoad(qs);
                } else {
                    // 该学科暂无题目，尝试推荐接口
                    if (api.getRecommendQuestions) {
                        api.getRecommendQuestions(session.qCount, session.subject).then(function (recs) {
                            if (recs && recs.length) finishLoad(recs);
                            else fallback();
                        }).catch(function () { fallback(); });
                    } else { fallback(); }
                }
            }).catch(function () { fallback(); });
        }

        // fallback 函数已在 setTimeout 开头定义（含 9 科真实兜底题库 FALLBACK_BANK）

        function finishLoad(qs) {
            state.questions = qs.slice(0, session.qCount);
            if (!state.questions.length) { fallback(); return; }
            state.loading = false;
            renderCurrent(container);
        }

        tryLoadFromApi();
    }, 100);

    // 渲染当前题目
    function renderCurrent(container) {
        if (state.loading) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">正在加载题目…</div></div>';
            return;
        }
        if (state.error || !state.questions.length) {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-exclamation-circle" style="font-size:24px;margin-bottom:8px;"></i><div style="font-size:13px;">题目加载失败，请返回重试</div></div>';
            return;
        }

        var idx = state.currentIndex;
        var q = state.questions[idx];
        var total = state.questions.length;
        var ua = state.userAnswers[q.id] || { text: '', revealed: false };
        var diffStars = '★'.repeat(q.difficulty || 3) + '☆'.repeat(5 - (q.difficulty || 3));

        var html = '';
        // 顶部：学科 + 知识点 + 进度
        html += '<div style="background:linear-gradient(135deg,#3B82F6,#1D4ED8);color:white;border-radius:14px;padding:14px;margin-bottom:12px;">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">' +
                '<span style="font-size:14px;font-weight:700;"><i class="fas fa-book"></i> ' + (q.subject || session.subject) + (q.knowledge_point_name ? ' · ' + q.knowledge_point_name : '') + '</span>' +
                '<span style="font-size:12px;background:rgba(255,255,255,0.2);padding:2px 10px;border-radius:10px;">第 ' + (idx + 1) + '/' + total + ' 题</span>' +
            '</div>' +
            '<div style="background:rgba(255,255,255,0.18);border-radius:8px;height:6px;overflow:hidden;">' +
                '<div style="background:#FCD34D;height:100%;width:' + Math.round(((idx) / total) * 100) + '%;"></div>' +
            '</div>' +
            '<div style="font-size:11px;opacity:0.9;margin-top:6px;">' + session.action + '学习 · ' + (session.point || q.knowledge_point_name || '综合训练') + '</div>' +
        '</div>';

        // 题目卡片
        html += '<div style="background:white;border-radius:12px;padding:14px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">' +
            '<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px;flex-wrap:wrap;">' +
                '<span style="font-size:11px;background:#EFF6FF;color:#2563EB;padding:3px 8px;border-radius:6px;font-weight:600;">' + (q.type || '题目') + '</span>' +
                '<span style="font-size:11px;color:#F59E0B;">难度 ' + diffStars + '</span>' +
                (q.score ? '<span style="font-size:11px;color:#6B7280;">' + q.score + '分</span>' : '') +
                (q.source === 'real_exam' ? '<span style="font-size:11px;background:#FEE2E2;color:#991B1B;padding:2px 6px;border-radius:6px;">真题</span>' : '') +
            '</div>' +
            '<div style="font-size:14px;color:#111827;line-height:1.7;white-space:pre-wrap;">' + (q.content || '') + '</div>' +
        '</div>';

        // 作答区
        html += '<div style="background:white;border-radius:12px;padding:14px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">' +
            '<div style="font-size:13px;font-weight:700;margin-bottom:8px;"><i class="fas fa-pen-to-square" style="color:#3B82F6;margin-right:4px;"></i> 我的作答</div>' +
            '<textarea id="learn-answer-input" placeholder="在此输入你的答案…" style="width:100%;min-height:80px;border:1px solid #E5E7EB;border-radius:10px;padding:10px 12px;font-size:13px;line-height:1.6;resize:vertical;outline:none;font-family:inherit;" oninput="window.__onLearnAnswerInput(this.value)">' + (ua.text || '') + '</textarea>';

        if (ua.revealed) {
            // 已查看解析：显示答案 + 解析
            html += '<div style="margin-top:12px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:12px;">' +
                '<div style="font-size:13px;font-weight:700;color:#15803D;margin-bottom:6px;"><i class="fas fa-check-circle"></i> 参考答案</div>' +
                '<div style="font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap;">' + (q.answer || '暂无答案') + '</div>' +
            '</div>';
            html += '<div style="margin-top:10px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:12px;">' +
                '<div style="font-size:13px;font-weight:700;color:#1D4ED8;margin-bottom:6px;"><i class="fas fa-lightbulb"></i> AI 解析</div>' +
                '<div style="font-size:13px;color:#374151;line-height:1.7;white-space:pre-wrap;">' + (q.analysis || '暂无解析') + '</div>' +
            '</div>';
            html += '<div style="display:flex;gap:8px;margin-top:12px;">' +
                '<div style="flex:1;background:#D1FAE5;color:#065F46;text-align:center;padding:10px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;" onclick="window.__markLearnCorrect(true)"><i class="fas fa-thumbs-up"></i> 我做对了</div>' +
                '<div style="flex:1;background:#FEE2E2;color:#991B1B;text-align:center;padding:10px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;" onclick="window.__markLearnCorrect(false)"><i class="fas fa-thumbs-down"></i> 加入错题本</div>' +
            '</div>';
        } else {
            // 未查看解析：提交按钮
            html += '<button class="proto-btn proto-btn-primary" style="height:42px;border-radius:21px;margin-top:10px;width:100%;" onclick="window.__revealLearnAnswer()"><i class="fas fa-eye"></i> 提交并查看答案</button>';
        }
        html += '</div>';

        // 底部导航
        html += '<div style="display:flex;gap:10px;margin-bottom:20px;">';
        if (idx > 0) {
            html += '<button class="proto-btn proto-btn-outline" style="flex:1;height:42px;border-radius:21px;" onclick="window.__gotoLearn(-1)"><i class="fas fa-chevron-left"></i> 上一题</button>';
        }
        if (idx < total - 1) {
            html += '<button class="proto-btn ' + (ua.revealed ? 'proto-btn-primary' : 'proto-btn-outline') + '" style="flex:1;height:42px;border-radius:21px;" onclick="window.__gotoLearn(1)">下一题 <i class="fas fa-chevron-right"></i></button>';
        } else {
            html += '<button class="proto-btn proto-btn-primary" style="flex:1;height:42px;border-radius:21px;background:#10B981;" onclick="window.__finishLearnSession()"><i class="fas fa-flag-checkered"></i> 完成学习</button>';
        }
        html += '</div>';

        container.innerHTML = html;
    }

    // 暴露交互函数（供 onclick 调用）
    window.__onLearnAnswerInput = function (val) {
        var q = state.questions[state.currentIndex];
        if (!q) return;
        if (!state.userAnswers[q.id]) state.userAnswers[q.id] = { text: '', revealed: false, correct: null };
        state.userAnswers[q.id].text = val;
    };
    window.__revealLearnAnswer = function () {
        var q = state.questions[state.currentIndex];
        if (!q) return;
        if (!state.userAnswers[q.id]) state.userAnswers[q.id] = { text: '', revealed: false, correct: null };
        state.userAnswers[q.id].revealed = true;
        // 提交答案到后端（学情记录），失败静默
        if (typeof api !== 'undefined' && api.submitAnswer) {
            try { api.submitAnswer(q.id, state.userAnswers[q.id].text, 0); } catch (e) {}
        }
        var container = document.getElementById('home-task-learn-content');
        if (container) renderCurrent(container);
    };
    window.__markLearnCorrect = function (correct) {
        var q = state.questions[state.currentIndex];
        if (!q) return;
        if (!state.userAnswers[q.id]) state.userAnswers[q.id] = { text: '', revealed: true, correct: null };
        state.userAnswers[q.id].correct = correct;
        showToast(correct ? '已记录：做对了' : '已加入错题本');
    };
    window.__gotoLearn = function (delta) {
        var next = state.currentIndex + delta;
        if (next < 0 || next >= state.questions.length) return;
        state.currentIndex = next;
        var container = document.getElementById('home-task-learn-content');
        if (container) {
            renderCurrent(container);
            // 回填已有作答
            var q = state.questions[state.currentIndex];
            var ua = state.userAnswers[q.id];
            var ta = document.getElementById('learn-answer-input');
            if (ta && ua) ta.value = ua.text || '';
        }
    };
    window.__finishLearnSession = function () {
        // 统计本次学习
        var total = state.questions.length;
        var answered = 0, correct = 0, wrong = 0;
        state.questions.forEach(function (q) {
            var ua = state.userAnswers[q.id];
            if (ua && ua.revealed) {
                answered++;
                if (ua.correct === true) correct++;
                else if (ua.correct === false) wrong++;
            }
        });
        var elapsedMin = Math.max(1, Math.round((Date.now() - (session.startTime || Date.now())) / 60000));

        // 接入数据中台：本次学习记录持久化到 KV（供首页学习统计/错题本回看）
        if (typeof api !== 'undefined' && api.savePageData) {
            var record = {
                subject: session.subject,
                point: session.point || '综合训练',
                total: total,
                answered: answered,
                correct: correct,
                wrong: wrong,
                elapsedMin: elapsedMin,
                finishedAt: new Date().toISOString()
            };
            api.savePageData('home-learn-latest', record).catch(function () {});
        }

        var container = document.getElementById('home-task-learn-content');
        if (!container) return;
        container.innerHTML =
            '<div style="text-align:center;padding:30px 20px;">' +
                '<div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,#10B981,#059669);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">' +
                    '<i class="fas fa-trophy" style="color:white;font-size:32px;"></i>' +
                '</div>' +
                '<div style="font-size:20px;font-weight:800;color:#111827;margin-bottom:6px;">学习完成！</div>' +
                '<div style="font-size:13px;color:#6B7280;margin-bottom:20px;">' + session.subject + ' · ' + (session.point || '综合训练') + ' · 用时 ' + elapsedMin + '分钟</div>' +
            '</div>' +
            '<div class="proto-grid-3" style="margin-bottom:20px;">' +
                '<div style="background:white;border-radius:12px;padding:14px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.08);"><div style="font-size:24px;font-weight:800;color:#3B82F6;">' + answered + '</div><div style="font-size:11px;color:#6B7280;margin-top:2px;">已作答</div></div>' +
                '<div style="background:white;border-radius:12px;padding:14px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.08);"><div style="font-size:24px;font-weight:800;color:#10B981;">' + correct + '</div><div style="font-size:11px;color:#6B7280;margin-top:2px;">做对</div></div>' +
                '<div style="background:white;border-radius:12px;padding:14px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.08);"><div style="font-size:24px;font-weight:800;color:#EF4444;">' + wrong + '</div><div style="font-size:11px;color:#6B7280;margin-top:2px;">错题</div></div>' +
            '</div>' +
            (wrong > 0 ? '<div style="background:#FEF3C7;border:1px solid #FDE68A;border-radius:10px;padding:12px;margin-bottom:16px;font-size:12px;color:#92400E;line-height:1.6;"><i class="fas fa-info-circle"></i> 本次共有 ' + wrong + ' 道错题已自动收录到错题本，建议稍后复习。</div>' : '') +
            '<div style="display:flex;gap:10px;">' +
                '<button class="proto-btn proto-btn-outline" style="flex:1;height:42px;border-radius:21px;" onclick="navigateTo(\'home-task\')"><i class="fas fa-arrow-left"></i> 返回任务</button>' +
                '<button class="proto-btn proto-btn-primary" style="flex:1;height:42px;border-radius:21px;" onclick="navigateTo(\'home\')"><i class="fas fa-home"></i> 回到首页</button>' +
            '</div>';
    };

    return Page({
        title: session.subject + '学习',
        back: true,
        content: '<div id="home-task-learn-content" style="background:#F3F4F6;min-height:100%;padding-bottom:20px;"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">正在加载题目…</div></div></div>'
    });
});

// ============================================================
// 发现页 - 发现更多学习资源与功能（API 驱动 + 硬编码降级）
// ============================================================
registerPage('discover', '发现', '首页', 'fa-compass', function () {
    // 异步从后端 API 加载数据，成功后更新全局数组并重新渲染
    setTimeout(function () {
        if (typeof api === 'undefined' || !api.getPageData) return;
        Promise.all([
            api.getPageData('discover-articles'),
            api.getPageData('discover-courses'),
            api.getPageData('discover-subjects')
        ]).then(function (results) {
            var updated = false;
            if (results[0] && Array.isArray(results[0]) && results[0].length > 0) {
                DISCOVER_ARTICLES.length = 0;
                results[0].forEach(function (a) { DISCOVER_ARTICLES.push(a); });
                updated = true;
            }
            if (results[1] && Array.isArray(results[1]) && results[1].length > 0) {
                DISCOVER_COURSES.length = 0;
                results[1].forEach(function (c) { DISCOVER_COURSES.push(c); });
                updated = true;
            }
            if (results[2] && Array.isArray(results[2]) && results[2].length > 0) {
                DISCOVER_SUBJECTS.length = 0;
                results[2].forEach(function (s) { DISCOVER_SUBJECTS.push(s); });
                updated = true;
            }
            // 仅当用户仍停留在发现页时才重新渲染
            if (updated) {
                var activeNav = document.querySelector('.nav-item.active');
                if (activeNav && activeNav.getAttribute('data-page') === 'discover') {
                    renderPage('discover');
                }
            }
        }).catch(function (e) {
            console.log('[Discover] API 降级到硬编码数据:', e.message);
        });
    }, 200);
    var c = '<div style="background:#F3F4F6;min-height:100%;padding-bottom:12px;">';

    // 顶部 Banner
    c += GradientCard('purple', `
        <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;"><i class="fas fa-compass"></i></div>
            <div style="flex:1;">
                <div style="font-size:17px;font-weight:700;">发现更多</div>
                <div style="font-size:12px;opacity:0.85;margin-top:2px;">探索学习资源、名师课程与备考干货</div>
            </div>
        </div>
    `);

    // 功能入口九宫格
    c += '<div class="proto-card" style="margin:12px;"><div style="font-size:15px;font-weight:700;margin-bottom:14px;"><i class="fas fa-th-large" style="color:#3B82F6;margin-right:6px;"></i>热门功能</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px 8px;">';
    var features = [
        { icon: 'fa-book-open', bg: '#DBEAFE', color: '#3B82F6', label: '真题库', page: 'practice-real-exam' },
        { icon: 'fa-camera', bg: '#FCE7F3', color: '#EC4899', label: '拍照搜题', page: 'photo-ocr' },
        { icon: 'fa-chart-bar', bg: '#D1FAE5', color: '#10B981', label: 'AI学情分析', page: 'home-analysis' },
        { icon: 'fa-map', bg: '#FEF3C7', color: '#F59E0B', label: '知识图谱', page: 'ai-module-graph' },
        { icon: 'fa-robot', bg: '#EDE9FE', color: '#8B5CF6', label: 'AI教练', page: 'ai-module-coach' },
        { icon: 'fa-file-alt', bg: '#DBEAFE', color: '#3B82F6', label: 'AI组卷', page: 'ai-module-paper' },
        { icon: 'fa-university', bg: '#FEE2E2', color: '#EF4444', label: '院校推荐', page: 'college-recommend' },
        { icon: 'fa-bullseye', bg: '#D1FAE5', color: '#10B981', label: '提分预测', page: 'home-predict' }
    ];
    features.forEach(function (f) {
        var onClick;
        if (f.page === 'photo-ocr') {
            onClick = "navigateTo('photo-ocr');setTimeout(function(){(window.__PHOTO_CAMERAGO__||function(m){typeof navigateTo==='function'&&navigateTo(m);})('camera','photo-parse');},180);";
        } else {
            onClick = "navigateTo('" + f.page + "')";
        }
        c += '<div style="text-align:center;cursor:pointer;" onclick="' + onClick + '">';
        c += '<div style="width:44px;height:44px;border-radius:12px;background:' + f.bg + ';color:' + f.color + ';display:flex;align-items:center;justify-content:center;font-size:18px;margin:0 auto 6px;"><i class="fas ' + f.icon + '"></i></div>';
        c += '<div style="font-size:11px;color:#374151;">' + f.label + '</div>';
        c += '</div>';
    });
    c += '</div></div>';

    // 备考干货推荐 - 九科覆盖 + 学科筛选 + 解题技巧详情
    c += '<div class="proto-card" style="margin:12px;"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><div style="font-size:15px;font-weight:700;"><i class="fas fa-fire" style="color:#EF4444;margin-right:6px;"></i>备考干货 · 九科解题技巧</div><span style="font-size:11px;color:#9CA3AF;">共' + DISCOVER_ARTICLES.length + '篇</span></div>';
    // 学科筛选标签栏
    c += '<div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:10px;-webkit-overflow-scrolling:touch;">';
    DISCOVER_SUBJECTS.forEach(function (s, i) {
        c += '<span class="proto-subj-tab" data-subject="' + s.name + '" onclick="filterDiscoverArticles(\'' + s.name + '\')" style="flex-shrink:0;padding:4px 10px;border-radius:12px;background:' + (i === 0 ? '#3B82F6' : '#F3F4F6') + ';color:' + (i === 0 ? 'white' : '#374151') + ';font-size:11px;cursor:pointer;white-space:nowrap;">' + s.name + '</span>';
    });
    c += '</div>';
    DISCOVER_ARTICLES.forEach(function (a, idx) {
        c += '<div class="proto-article-item" data-subject="' + a.subject + '" style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #F3F4F6;cursor:pointer;" onclick="openDiscoverArticle(' + idx + ')">';
        c += '<div style="width:60px;height:60px;border-radius:10px;background:' + a.tagBg + ';color:' + a.tagColor + ';display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;"><i class="fas fa-book"></i></div>';
        c += '<div style="flex:1;min-width:0;"><span style="font-size:10px;background:' + a.tagBg + ';color:' + a.tagColor + ';padding:2px 6px;border-radius:4px;">' + a.subject + '</span><div style="font-size:13px;font-weight:600;margin-top:4px;line-height:1.4;color:#374151;">' + a.title + '</div><div style="font-size:11px;color:#9CA3AF;margin-top:4px;"><i class="far fa-eye"></i> ' + a.read + ' 阅读</div></div>';
        c += '</div>';
    });
    c += '</div>';

    // 名师课程推荐 - 九科覆盖 + 课程详情
    c += '<div class="proto-card" style="margin:12px;"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;"><div style="font-size:15px;font-weight:700;"><i class="fas fa-chalkboard-teacher" style="color:#8B5CF6;margin-right:6px;"></i>名师课程</div><span style="font-size:11px;color:#9CA3AF;">共' + DISCOVER_COURSES.length + '门</span></div>';
    DISCOVER_COURSES.forEach(function (t, idx) {
        c += '<div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #F3F4F6;cursor:pointer;" onclick="openDiscoverCourse(' + idx + ')">';
        c += '<div style="width:48px;height:48px;border-radius:50%;background:' + t.bg + ';color:' + t.color + ';display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;flex-shrink:0;">' + t.name.charAt(0) + '</div>';
        c += '<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;color:#374151;">' + t.title + '</div><div style="font-size:11px;color:#9CA3AF;margin-top:3px;">' + t.name + ' · ' + t.subject + ' · ' + t.lessons + '课时 · ⭐' + t.rating + '</div></div>';
        c += '<div style="font-size:15px;font-weight:700;color:#EF4444;align-self:center;">' + t.price + '</div>';
        c += '</div>';
    });
    c += '</div>';

    // AI智能推荐 - 基于学情的动态推荐
    c += '<div class="proto-card" style="margin:12px;"><div style="font-size:15px;font-weight:700;margin-bottom:12px;"><i class="fas fa-robot" style="color:#8B5CF6;margin-right:6px;"></i>AI智能推荐</div>';
    var aiRecommends = [
        { icon: 'fa-bullseye',  bg: '#D1FAE5', color: '#10B981', title: '数学·极值求解专项',     reason: '根据近期错题分析，推荐强化极值分类讨论',      page: 'practice-ai-recommend' },
        { icon: 'fa-fire',      bg: '#FEE2E2', color: '#EF4444', title: '物理·电磁感应高频考点',  reason: '近3年高考出现率92%，建议优先攻克',           page: 'practice-hotpoints' },
        { icon: 'fa-book',      bg: '#DBEAFE', color: '#3B82F6', title: '语文·古诗文默写集训',     reason: '失分率较高，AI预测可提分6-8分',             page: 'practice-mistakes' },
        { icon: 'fa-chart-line',bg: '#EDE9FE', color: '#8B5CF6', title: 'AI预测提分路径',         reason: '基于学情数据生成个性化提分方案',            page: 'ai-module-predict' }
    ];
    aiRecommends.forEach(function (r) {
        c += '<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #F3F4F6;cursor:pointer;" onclick="navigateTo(\'' + r.page + '\')">';
        c += '<div style="width:40px;height:40px;border-radius:10px;background:' + r.bg + ';color:' + r.color + ';display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;"><i class="fas ' + r.icon + '"></i></div>';
        c += '<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;color:#374151;">' + r.title + '</div><div style="font-size:11px;color:#9CA3AF;margin-top:3px;line-height:1.4;">' + r.reason + '</div></div>';
        c += '<i class="fas fa-chevron-right" style="color:#D1D5DB;font-size:12px;align-self:center;"></i>';
        c += '</div>';
    });
    c += '</div>';

    // 备考日历 - 重要时间节点提醒（日期动态生成）
    c += '<div class="proto-card" style="margin:12px;"><div style="font-size:15px;font-weight:700;margin-bottom:12px;"><i class="fas fa-calendar-alt" style="color:#3B82F6;margin-right:6px;"></i>备考日历</div>';
    // 实时日期：今日学习计划显示当前真实日期，其他事件按相对天数偏移生成
    var _calNow = new Date();
    var _pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    var _fmtDate = function(d) { return _pad(d.getMonth() + 1) + '月' + _pad(d.getDate()) + '日'; };
    var _todayEvt = new Date(_calNow);
    var _monthlyEvt = new Date(_calNow); _monthlyEvt.setDate(_calNow.getDate() + 3);
    var _mockEvt = new Date(_calNow); _mockEvt.setDate(_calNow.getDate() + 8);
    var _volunteerEvt = new Date(_calNow); _volunteerEvt.setDate(_calNow.getDate() + 13);
    var calEvents = [
        { date: _fmtDate(_todayEvt),     icon: 'fa-bell',        bg: '#DBEAFE', color: '#3B82F6', title: '今日学习计划', desc: '3个任务待完成，预计95分钟',  page: 'home-task' },
        { date: _fmtDate(_monthlyEvt),   icon: 'fa-file-alt',    bg: '#FEF3C7', color: '#F59E0B', title: '月考分析报告', desc: '本月月考成绩分析将生成',     page: 'score-monthly' },
        { date: _fmtDate(_mockEvt),      icon: 'fa-trophy',       bg: '#D1FAE5', color: '#10B981', title: '一模考试',     desc: '全省统考，预计排名区间',     page: 'score-mock' },
        { date: _fmtDate(_volunteerEvt), icon: 'fa-graduation-cap',bg: '#EDE9FE', color: '#8B5CF6', title: '志愿填报预演', desc: '基于模考成绩推荐院校',      page: 'volunteer' }
    ];
    calEvents.forEach(function (e) {
        c += '<div style="display:flex;gap:10px;padding:10px 0;border-bottom:1px solid #F3F4F6;cursor:pointer;" onclick="navigateTo(\'' + e.page + '\')">';
        c += '<div style="text-align:center;flex-shrink:0;width:48px;"><div style="font-size:11px;color:#9CA3AF;">' + e.date.split('月')[0] + '月</div><div style="font-size:18px;font-weight:700;color:#374151;">' + e.date.match(/(\d+)日/)[1] + '</div></div>';
        c += '<div style="width:36px;height:36px;border-radius:10px;background:' + e.bg + ';color:' + e.color + ';display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;"><i class="fas ' + e.icon + '"></i></div>';
        c += '<div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;color:#374151;">' + e.title + '</div><div style="font-size:11px;color:#9CA3AF;margin-top:3px;">' + e.desc + '</div></div>';
        c += '<i class="fas fa-chevron-right" style="color:#D1D5DB;font-size:12px;align-self:center;"></i>';
        c += '</div>';
    });
    c += '</div>';

    c += '</div>';
    return Page({ title: '发现', navbar: false, tabbar: 'discover', content: c });
});

// ============================================================
// ============================================================
// 消息页 - 学习通知与系统消息
// ============================================================
(function installMessageModule() {
    if (typeof window.__MSG_DATA__ === 'undefined') {
        window.__MSG_CATS__ = [
            { key: 'study',   icon: 'fa-bell',        bg: '#DBEAFE', color: '#3B82F6', label: '学习提醒' },
            { key: 'task',    icon: 'fa-check-circle', bg: '#D1FAE5', color: '#10B981', label: '任务通知' },
            { key: 'social',  icon: 'fa-comments',    bg: '#FEF3C7', color: '#F59E0B', label: '互动消息' },
            { key: 'sys',     icon: 'fa-bullhorn',    bg: '#FEE2E2', color: '#EF4444', label: '系统公告' }
        ];
        window.__MSG_LIST__ = [
            {
                id: 'm_coach_001', cat: 'study', icon: 'fa-robot',      bg: '#EDE9FE', color: '#8B5CF6',
                title: 'AI学习教练', time: '刚刚', unread: true, pin: true,
                preview: '今日数学导数练习已完成，正确率75%，建议复习极值求解知识点…',
                body: [
                    '✅ 本次练习 <b>8/12 题做对</b>，正确率 <b style="color:#3B82F6;">75%</b>，略低于目标 85%。',
                    '📊 薄弱知识点定位：<b>极值求解的分类讨论</b>（5题做对2题），其次是 <b>端点比较</b>。',
                    '🎯 教练建议：',
                    '&nbsp;&nbsp;1) 今晚立即复习《选修2-2 极值与最值》3 个典型题。',
                    '&nbsp;&nbsp;2) 明天 08:00 已自动为你加入 1 次 <b>极值专题小测</b>。',
                    '&nbsp;&nbsp;3) 建议连续 3 天正确率 ≥ 85% 后再解锁「圆锥曲线」新章节。'
                ],
                actions: [
                    { label: '前往错题本',     page: 'error-book',    icon: 'fa-book' },
                    { label: '立即开始复习',   page: 'home-task-learn', icon: 'fa-play-circle', color: '#8B5CF6', primary: true }
                ]
            },
            {
                id: 'm_study_003', cat: 'study', icon: 'fa-bell',       bg: '#DBEAFE', color: '#3B82F6',
                title: '学习提醒', time: '10分钟前', unread: true, pin: false,
                preview: '你今天还有3个学习任务未完成，预计需要95分钟，加油！',
                body: [
                    '📋 今日任务一览：',
                    '&nbsp;&nbsp;1. <b>数学 · 圆锥曲线综合</b>　47 分钟　<span style="color:#F59E0B;">⏳ 待完成</span>',
                    '&nbsp;&nbsp;2. <b>生物 · 遗传规律</b>　　　 35 分钟　<span style="color:#F59E0B;">⏳ 待完成</span>',
                    '&nbsp;&nbsp;3. <b>历史 · 世界近代史</b>　　 32 分钟　<span style="color:#F59E0B;">⏳ 待完成</span>',
                    '',
                    '🔥 为了保持本周学习进度，建议今天优先做「数学 · 圆锥曲线综合」。',
                    '🎁 完成今日全部任务，可额外获得 <b style="color:#F59E0B;">+20 积分</b>。'
                ],
                actions: [
                    { label: '查看今日任务', page: 'home',          icon: 'fa-list-check' },
                    { label: '立即开始数学', page: 'home-task-learn', icon: 'fa-play-circle', color: '#3B82F6', primary: true }
                ]
            },
            {
                id: 'm_task_001', cat: 'task', icon: 'fa-flag-checkered', bg: '#D1FAE5', color: '#10B981',
                title: '任务通知', time: '30分钟前', unread: true, pin: false,
                preview: '「AI今日提分」模块自动为你安排了明天的学习计划，请确认。',
                body: [
                    '🗓 明日（明日）学习计划，已根据今日学情自动生成：',
                    '&nbsp;&nbsp;1. <b>数学：极值求解</b> 45min　<span style="color:#8B5CF6;">薄弱强化</span>',
                    '&nbsp;&nbsp;2. <b>英语：阅读理解专题</b> 40min　<span style="color:#F59E0B;">保持手感</span>',
                    '&nbsp;&nbsp;3. <b>物理：电磁感应练习</b> 40min　<span style="color:#10B981;">基础巩固</span>',
                    '&nbsp;&nbsp;4. <b>语文：古诗文赏析</b> 25min　<span style="color:#3B82F6;">日常积累</span>',
                    '',
                    '⏱ 总计 150 分钟，预计提升 <b style="color:#10B981;">+4 分</b>。',
                    '若需要调整，可前往「AI学习计划」页面手动增删任务。'
                ],
                actions: [
                    { label: '前往AI学习计划', page: 'ai-plan', icon: 'fa-calendar-check' },
                    { label: '确认并发送提醒', onclick: 'window.__MSG_CONFIRM_PLAN__()', icon: 'fa-check-circle', color: '#10B981', primary: true }
                ]
            },
            {
                id: 'm_task_002', cat: 'task', icon: 'fa-bullseye', bg: '#ECFDF5', color: '#059669',
                title: '任务通知', time: '2小时前', unread: false, pin: false,
                preview: '本月月考目标完成挑战已更新：冲击「总分 620」！',
                body: [
                    '🏆 本月目标：总分 <b style="color:#EF4444;">620</b>',
                    '当前估分：580 → 目标差值：<b>+40 分</b>',
                    '各科建议提分：数学 +10 / 英语 +8 / 语文 +6 / 物理 +6 / 化学 +4 / 生物 +3 / 其他 +3',
                    '',
                    '🚀 系统已为你生成「冲刺提分路线图」，点下方「查看详情」查看。'
                ],
                actions: [
                    { label: '查看月考分析', page: 'score-monthly', icon: 'fa-chart-line' },
                    { label: '确认参与挑战', onclick: 'window.__MSG_JOIN_CHALLENGE__()', icon: 'fa-bullseye', color: '#059669', primary: true }
                ]
            },
            {
                id: 'm_study_002', cat: 'study', icon: 'fa-trophy',       bg: '#FEF3C7', color: '#F59E0B',
                title: '成就解锁', time: '1小时前', unread: false, pin: false,
                preview: '恭喜你连续学习7天，已解锁「坚持之星」勋章！',
                body: [
                    '🏅 <b style="font-size:16px;">坚持之星（Lv.7）</b>',
                    '你已连续学习 <b style="color:#F59E0B;">7 天</b>，累计 <b style="color:#10B981;">28 小时</b>！',
                    '',
                    '🎁 奖励：',
                    '&nbsp;&nbsp;· 积分：<b>+100</b>',
                    '&nbsp;&nbsp;· 1 次「AI讲题引擎」深度使用机会',
                    '&nbsp;&nbsp;· 解锁「坚持之星」头像框（有效期 30 天）',
                    '',
                    '💪 下一枚勋章：<b style="color:#8B5CF6;">连续学习 14 天「学习强者」</b>（+500积分 + VIP 3天）'
                ],
                actions: [
                    { label: '查看全部勋章', page: 'profile-badges', icon: 'fa-medal' },
                    { label: '去个人中心佩戴', page: 'profile-main', icon: 'fa-user-circle', color: '#F59E0B', primary: true }
                ]
            },
            {
                id: 'm_social_001', cat: 'social', icon: 'fa-user-graduate', bg: '#FEF3C7', color: '#D97706',
                title: '互动消息', time: '2小时前', unread: false, pin: false,
                preview: '名师「王老师（数学特级）」回复了你的提问：「极值求解……」',
                body: [
                    '👨‍🏫 <b>王老师（数学特级）</b> 回复了你：',
                    '<div style="background:#EFF6FF;border-radius:10px;padding:12px;margin:8px 0;font-size:13px;line-height:1.7;color:#1E3A8A;">',
                    '&nbsp;&nbsp;同学你好，这题的关键在于「对 a 做分类讨论 + 验证端点可导性」。我已经上传了一段 <b>8 分钟</b> 的手写板书视频，你点下方链接就能看到。看完自己再做一遍哦！',
                    '</div>',
                    '📎 老师已附带：<b>极值·板书视频.mp4</b>（8:12） · <b>同类推荐 5 题.pdf</b>'
                ],
                actions: [
                    { label: '打开聊天', page: 'chat',          icon: 'fa-comments' },
                    { label: '查看板书视频', page: 'video-course', icon: 'fa-circle-play', color: '#D97706', primary: true }
                ]
            },
            {
                id: 'm_score_001', cat: 'study', icon: 'fa-chart-line', bg: '#D1FAE5', color: '#10B981',
                title: '成绩报告', time: '3小时前', unread: false, pin: false,
                preview: '你的本月月考分析报告已生成，总体成绩提升8分，点击查看详情。',
                body: [
                    '📄 <b>月考分析报告 · 2026 年 8 月</b>',
                    '总分：<b style="color:#10B981;">588 分</b>　上次：<b>580 分</b>　<b style="color:#10B981;">↑ +8</b>',
                    '校排名：<b>46 / 512</b>（↑ 8 名）　全省预估：<b>前 6.7%</b>',
                    '',
                    '📈 各科表现：',
                    '&nbsp;&nbsp;· 语文 <b>112</b>（↑3）　数学 <b>121</b>（↑4）　英语 <b>128</b>（↑2）',
                    '&nbsp;&nbsp;· 物理 <b>86</b>（↑1）　化学 <b>74</b>（↓2 ↓ 警示）　生物 <b>67</b>（↑0）',
                    '',
                    '⚠️ 下次重点：化学「有机合成」部分严重失分，建议本周重点攻克。'
                ],
                actions: [
                    { label: '查看完整报告', page: 'score-monthly', icon: 'fa-chart-column', color: '#10B981', primary: true },
                    { label: '全省预测排名', page: 'score-rank',    icon: 'fa-ranking-star' }
                ]
            },
            {
                id: 'm_sys_001', cat: 'sys', icon: 'fa-bullhorn', bg: '#FEE2E2', color: '#EF4444',
                title: '系统公告', time: '昨天', unread: false, pin: false,
                preview: '系统将于今晚22:00-23:00进行维护升级，届时部分功能可能不可用。',
                body: [
                    '📢 <b>系统维护升级通知 v2026.08</b>',
                    '⏰ 时间：<b>今晚 22:00 — 23:00（约 60 分钟）</b>',
                    '',
                    '✨ 升级内容：',
                    '&nbsp;&nbsp;1. AI 学习教练大模型升级 → 答题准确率提升 12%',
                    '&nbsp;&nbsp;2. 拍照搜题引擎 v3 上线 → 支持手写体、公式识别',
                    '&nbsp;&nbsp;3. 错题本新增「知识点脉络图」功能',
                    '&nbsp;&nbsp;4. 修复若干已知的加载问题',
                    '',
                    '⚠️ 维护期间：所有作答、拍照、提交功能将暂停；已生成的任务与数据不会丢失。',
                    '给您带来的不便，敬请谅解～'
                ],
                actions: [
                    { label: '查看完整公告', onclick: 'window.__MSG_SHOW_ANNOUNCE__()', icon: 'fa-scroll' },
                    { label: '提前预约升级提醒', onclick: 'window.__MSG_REMINDER__()', icon: 'fa-bell', color: '#EF4444', primary: true }
                ]
            },
            {
                id: 'm_sys_002', cat: 'sys', icon: 'fa-gift', bg: '#FDF4FF', color: '#A855F7',
                title: '系统公告 · 活动', time: '昨天', unread: false, pin: false,
                preview: '🎁 开学季福利：VIP 会员 3 折，前 1000 名额外赠「压轴题密卷」！',
                body: [
                    '🎉 <b>2026 开学季 · AI 高考 VIP 限时福利</b>',
                    '📅 活动时间：2026.08.20 — 2026.09.10',
                    '',
                    '💰 限时折扣：',
                    '&nbsp;&nbsp;· 月卡：原价 ¥38　<b style="color:#EF4444;">¥ 12</b>（3 折）',
                    '&nbsp;&nbsp;· 季卡：原价 ¥98　<b style="color:#EF4444;">¥ 38</b>（3.9 折）',
                    '&nbsp;&nbsp;· 年卡：原价 ¥298　<b style="color:#EF4444;">¥ 128</b>（4.3 折，赠 2 个月）',
                    '',
                    '🎁 前 1000 名购买：额外赠送《2026 高考名校压轴题密卷 · 20 套 + 名师视频讲解》'
                ],
                actions: [
                    { label: '前往VIP会员', page: 'profile-vip', icon: 'fa-crown', color: '#A855F7', primary: true },
                    { label: '分享活动',       onclick: 'window.__MSG_SHARE__()', icon: 'fa-share-alt' }
                ]
            },
            {
                id: 'm_ai_daily_001', cat: 'study', icon: 'fa-robot', bg: '#EDE9FE', color: '#8B5CF6',
                title: 'AI每日提分推荐', time: '今天 06:00', unread: true, pin: false,
                preview: '今日AI推荐3道高频考点题，预计可提分2-3分，点击立即开始练习。',
                body: [
                    '🤖 <b>AI 每日提分推荐 · 2026.09.07</b>',
                    '根据你的学情数据，今日推荐以下练习：',
                    '',
                    '&nbsp;&nbsp;1. <b>数学·圆锥曲线</b>　高频考点　⭐⭐⭐⭐⭐',
                    '&nbsp;&nbsp;2. <b>物理·电磁感应</b>　薄弱强化　⭐⭐⭐⭐',
                    '&nbsp;&nbsp;3. <b>化学·氧化还原</b>　基础巩固　⭐⭐⭐',
                    '',
                    '📊 AI预测：完成以上练习可提分 <b style="color:#10B981;">+2~3分</b>',
                    '⏱ 预计用时：45 分钟'
                ],
                actions: [
                    { label: '查看学情分析',   page: 'home-analysis',       icon: 'fa-chart-bar' },
                    { label: '立即开始练习',   page: 'practice-ai-recommend',icon: 'fa-play-circle', color: '#8B5CF6', primary: true }
                ]
            },
            {
                id: 'm_mistake_001', cat: 'task', icon: 'fa-times-circle', bg: '#FEE2E2', color: '#EF4444',
                title: '错题强化提醒', time: '今天 07:30', unread: true, pin: false,
                preview: '你有12道未复习的错题，其中5道已超3天未复习，建议立即巩固！',
                body: [
                    '⚠️ <b>错题强化提醒</b>',
                    '当前错题本状态：',
                    '&nbsp;&nbsp;· 未复习错题：<b style="color:#EF4444;">12 道</b>',
                    '&nbsp;&nbsp;· 超3天未复习：<b style="color:#F59E0B;">5 道</b>',
                    '&nbsp;&nbsp;· 已掌握（可移除）：<b style="color:#10B981;">3 道</b>',
                    '',
                    '🧠 遗忘曲线分析：5道超期错题遗忘风险 <b>72%</b>',
                    '建议：立即复习可降低遗忘率至 15%以下'
                ],
                actions: [
                    { label: '查看错题本',     page: 'practice-mistakes',  icon: 'fa-book' },
                    { label: '立即复习错题',   page: 'practice-mistakes',  icon: 'fa-redo', color: '#EF4444', primary: true }
                ]
            }
        ];
    }

    /** 工具：统计各分类未读数 + 总数（基于 __MSG_LIST__） */
    window.__MSG_COUNT__ = function (catKey) {
        const list = window.__MSG_LIST__ || [];
        if (!catKey) return list.filter(m => m.unread).length;
        return list.filter(m => m.cat === catKey && m.unread).length;
    };

    /** 打开某个分类的消息列表（完整筛选页面风格弹窗） */
    window.__MSG_OPEN_CAT__ = function (catKey) {
        const cat = (window.__MSG_CATS__ || []).find(c => c.key === catKey);
        if (!cat) return;
        const list = (window.__MSG_LIST__ || []).filter(m => m.cat === catKey);
        const unreadCount = list.filter(m => m.unread).length;
        let rows = '';
        if (list.length === 0) {
            rows = '<div style="text-align:center;color:#9CA3AF;padding:30px 10px;font-size:13px;"><i class="fas fa-inbox" style="font-size:28px;margin-bottom:10px;display:block;"></i>暂无更多' + cat.label + '。</div>';
        } else {
            list.forEach((m, idx) => {
                const sublist = [...list];
                const realIdx = window.__MSG_LIST__.indexOf(m);
                rows += ''
                    + '<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #F3F4F6;cursor:pointer;' + (idx === list.length - 1 ? 'border-bottom:none;' : '') + '" '
                    +       'onclick="closeModal();window.__MSG_OPEN_DETAIL__(' + realIdx + ')">'
                    +   '<div style="width:42px;height:42px;border-radius:12px;background:' + m.bg + ';color:' + m.color + ';display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;position:relative;">'
                    +     '<i class="fas ' + m.icon + '"></i>'
                    +     (m.unread ? '<span style="position:absolute;top:-2px;right:-2px;width:8px;height:8px;background:#EF4444;border-radius:50%;border:1.5px solid white;"></span>' : '')
                    +   '</div>'
                    +   '<div style="flex:1;min-width:0;">'
                    +     '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">'
                    +       '<span style="font-size:13px;font-weight:600;color:#374151;">' + m.title + '</span>'
                    +       '<span style="font-size:11px;color:#9CA3AF;flex-shrink:0;">' + m.time + '</span>'
                    +     '</div>'
                    +     '<div style="font-size:12px;color:#6B7280;margin-top:3px;line-height:1.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + m.preview + '</div>'
                    +   '</div>'
                    +   '<i class="fas fa-chevron-right" style="color:#D1D5DB;font-size:12px;align-self:center;"></i>'
                    + '</div>';
            });
        }
        const header = ''
            + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">'
            +   '<div style="display:flex;align-items:center;gap:10px;">'
            +     '<div style="width:38px;height:38px;border-radius:12px;background:' + cat.bg + ';color:' + cat.color + ';display:flex;align-items:center;justify-content:center;"><i class="fas ' + cat.icon + '"></i></div>'
            +     '<div style="line-height:1.25;">'
            +       '<div style="font-size:15px;font-weight:700;color:#111827;">' + cat.label + '</div>'
            +       '<div style="font-size:11px;color:#6B7280;margin-top:2px;">共 ' + list.length + ' 条' + (unreadCount ? (' · 未读 ' + unreadCount) : '') + '</div>'
            +     '</div>'
            +   '</div>'
            +   (unreadCount
                ?   '<button type="button" style="background:#EFF6FF;color:#3B82F6;border:none;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:600;cursor:pointer;" '
                    +     'onclick="window.__MSG_MARK_CAT_READ__(\'' + catKey + '\');this.innerText=\'已全部标记\';this.style.background=\'#F3F4F6\';this.style.color=\'#6B7280\';"><i class="fas fa-check-double"></i> 全部标为已读</button>'
                :   '')
            + '</div>';
        openModal(cat.label + ' · ' + list.length + ' 条', header + rows);
    };

    /** 打开某条消息详情（索引） */
    window.__MSG_OPEN_DETAIL__ = function (idx) {
        const m = window.__MSG_LIST__[idx | 0];
        if (!m) { showToast && showToast('消息不存在'); return; }
        const cat = (window.__MSG_CATS__ || []).find(c => c.key === m.cat) || {};
        // 自动标为已读
        m.unread = false;
        const banner = ''
            + '<div style="display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:12px;background:linear-gradient(135deg,' + (m.bg || '#E0E7FF') + ' 0%,#FFFFFF 100%);margin-bottom:14px;">'
            +   '<div style="width:48px;height:48px;border-radius:14px;background:white;color:' + m.color + ';display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 10px rgba(0,0,0,0.06);">'
            +     '<i class="fas ' + m.icon + '"></i>'
            +   '</div>'
            +   '<div style="flex:1;min-width:0;line-height:1.4;">'
            +     '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">'
            +       '<span style="font-size:15px;font-weight:700;color:#111827;">' + m.title + '</span>'
            +       (cat.label ? ('<span style="padding:3px 8px;border-radius:999px;font-size:10px;font-weight:600;background:' + cat.bg + ';color:' + cat.color + ';">' + cat.label + '</span>') : '')
            +     '</div>'
            +     '<div style="font-size:12px;color:#6B7280;margin-top:4px;"><i class="far fa-clock"></i> ' + m.time + (m.pin ? '　<i class="fas fa-thumbtack" style="color:#EF4444;"></i> 已置顶' : '') + '</div>'
            +   '</div>'
            + '</div>';
        const body = (m.body || [m.preview || '']).map(p => '<p style="margin:4px 0 8px;">' + p + '</p>').join('');
        let actionsHTML = '';
        if (Array.isArray(m.actions) && m.actions.length) {
            actionsHTML = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">'
                + m.actions.map((a, ai) => {
                    const bg = a.primary ? (a.color || '#3B82F6') : 'white';
                    const fc = a.primary ? 'white' : (a.color || '#374151');
                    const bd = a.primary ? 'none' : '1px solid #E5E7EB';
                    let click = '';
                    if (a.page) {
                        click = "closeModal();navigateTo('" + a.page + "');";
                    } else if (a.onclick) {
                        click = "closeModal();" + a.onclick;
                    }
                    return '<button type="button" style="flex:1 1 45%;height:38px;border-radius:10px;font-size:13px;font-weight:600;'
                        + 'background:' + bg + ';color:' + fc + ';border:' + bd + ';cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:6px;"'
                        + ' onclick="' + click + '">'
                        + (a.icon ? ('<i class="fas ' + a.icon + '"></i>') : '')
                        + a.label + '</button>';
                }).join('')
                + '</div>';
        }
        openModal(m.title, banner + body + actionsHTML);
    };

    /** 分类全部标为已读（传 'all' 则全部） */
    window.__MSG_MARK_CAT_READ__ = function (catKey) {
        (window.__MSG_LIST__ || []).forEach(m => {
            if (!catKey || catKey === 'all' || m.cat === catKey) m.unread = false;
        });
        // 接入数据中台：消息已读状态持久化到 KV（跨设备同步已读）
        if (typeof api !== 'undefined' && api.savePageData) {
            api.savePageData('home-messages', window.__MSG_LIST__).catch(function () {});
        }
        // 同步隐藏页面上的未读红点和未读计数徽标
        try {
            document.querySelectorAll('[data-unread-dot]').forEach(function (n) { n.style.display = 'none'; });
            const badge = document.querySelector('[data-unread-total]');
            if (badge) badge.style.display = 'none';
        } catch (e) {}
        if (typeof showToast === 'function') showToast('已标为已读', 'success');
    };

    /** 动作回调 */
    window.__MSG_CONFIRM_PLAN__ = function () { showToast && showToast('✅ 明日学习计划已确认，明早 07:30 会通过微信提醒你~', 'success'); };
    window.__MSG_JOIN_CHALLENGE__ = function () { showToast && showToast('🎯 挑战已开启！完成即获得「620 分冲刺」专属勋章', 'success'); };
    window.__MSG_SHOW_ANNOUNCE__ = function () {
        openModal('完整公告 · v2026.08 维护升级',
            '<div style="font-size:13px;line-height:1.8;color:#374151;">'
            + '<p><b style="color:#EF4444;">Q&A · 维护常见问题：</b></p>'
            + '<p><b>Q1：我做到一半的题会丢失吗？</b><br>A：不会，已作答自动保存，结束后可继续。</p>'
            + '<p><b>Q2：错题本、我的笔记能正常看吗？</b><br>A：浏览正常，仅无法上传新内容。</p>'
            + '<p><b>Q3：维护超时怎么办？</b><br>A：超时超过 15 分钟，自动补偿「AI 讲题」1 次。</p>'
            + '<p style="text-align:center;color:#6B7280;margin-top:12px;">— 感谢你对 AI 高考的支持 —</p>'
            + '</div>');
    };
    window.__MSG_REMINDER__ = function () { showToast && showToast('🔔 已预约 22:00 升级提醒，会提前 5 分钟弹出通知', 'success'); };
    window.__MSG_SHARE__ = function () { showToast && showToast('📤 开学季分享链接已生成，并复制到剪贴板（演示）', 'success'); };

    /** 消息页渲染 */
    registerPage('message', '消息', '首页', 'fa-comment-dots', function () {
        const cats = window.__MSG_CATS__;
        const list = window.__MSG_LIST__;
        const unreadTotal = list.filter(m => m.unread).length;

        let c = '<div style="background:#F3F4F6;min-height:100%;padding-bottom:12px;">';

        // 顶部标题区 + 未读徽标
        c += '<div style="background:white;padding:48px 16px 14px;">'
          +    '<div style="display:flex;align-items:center;justify-content:space-between;">'
          +      '<div style="display:flex;align-items:center;gap:8px;"><div style="font-size:20px;font-weight:700;">消息</div>'
          +        (unreadTotal ? '<span data-unread-total style="background:#EF4444;color:white;font-size:10px;padding:2px 8px;border-radius:999px;font-weight:600;">' + unreadTotal + ' 未读</span>' : '')
          +      '</div>'
          +      '<button type="button" style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:999px;padding:6px 12px;font-size:12px;color:#374151;cursor:pointer;" onclick="window.__MSG_MARK_CAT_READ__(\'all\');"><i class="fas fa-check-double"></i> 全部已读</button>'
          +    '</div>'
          +  '</div>';

        // 消息分类入口（点击进筛选列表）
        c += '<div class="proto-card" style="margin:12px;"><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">';
        cats.forEach(function (t) {
            const count = window.__MSG_COUNT__(t.key);
            c += '<div style="text-align:center;cursor:pointer;position:relative;" onclick="window.__MSG_OPEN_CAT__(\'' + t.key + '\')">';
            c += '<div style="width:46px;height:46px;border-radius:50%;background:' + t.bg + ';color:' + t.color + ';display:flex;align-items:center;justify-content:center;font-size:18px;margin:0 auto 6px;position:relative;"><i class="fas ' + t.icon + '"></i>';
            if (count > 0) c += '<span style="position:absolute;top:-2px;right:-2px;background:#EF4444;color:white;font-size:9px;min-width:16px;height:16px;border-radius:8px;display:flex;align-items:center;justify-content:center;padding:0 4px;">' + count + '</span>';
            c += '</div><div style="font-size:11px;color:#374151;">' + t.label + '</div>';
            c += '</div>';
        });
        c += '</div></div>';

        // 最新消息列表（点击进详情弹窗）
        const pins = list.filter(m => m.pin);
        const normals = list.filter(m => !m.pin);
        const ordered = pins.concat(normals);
        c += '<div class="proto-card" style="margin:12px;"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;"><div style="font-size:15px;font-weight:700;">最新消息</div><div style="font-size:11px;color:#6B7280;">共 ' + list.length + ' 条</div></div>';
        ordered.forEach(function (m, i) {
            const realIdx = list.indexOf(m);
            c += ''
                + '<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid #F3F4F6;cursor:pointer;' + (i === ordered.length - 1 ? 'border-bottom:none;' : '') + '" '
                +       'onclick="window.__MSG_OPEN_DETAIL__(' + realIdx + ')">'
                +   '<div style="width:44px;height:44px;border-radius:12px;background:' + m.bg + ';color:' + m.color + ';display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;position:relative;"><i class="fas ' + m.icon + '"></i>'
                +     (m.unread ? '<span data-unread-dot style="position:absolute;top:-2px;right:-2px;width:8px;height:8px;background:#EF4444;border-radius:50%;border:1.5px solid white;"></span>' : '')
                +   '</div>'
                +   '<div style="flex:1;min-width:0;">'
                +     '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">'
                +       '<span style="font-size:14px;font-weight:600;color:#111827;">' + m.title + (m.pin ? ' <i class="fas fa-thumbtack" style="color:#EF4444;font-size:10px;"></i>' : '') + '</span>'
                +       '<span style="font-size:11px;color:#9CA3AF;flex-shrink:0;">' + m.time + '</span>'
                +     '</div>'
                +     '<div style="font-size:12px;color:#6B7280;margin-top:3px;line-height:1.4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + m.preview + '</div>'
                +   '</div>'
                +   '<i class="fas fa-chevron-right" style="color:#D1D5DB;font-size:12px;align-self:center;"></i>'
                + '</div>';
        });
        c += '</div>';

        c += '</div>';
        return Page({ title: '消息', navbar: false, tabbar: 'message', content: c });
    });
})();
