/**
 * 将 AI 学情诊断题库从 34 题扩充到 ~100 题
 * 用法: node expand-bank.js
 * 输出: 写回 backend/data/diagnostic-bank.json
 */
const fs = require('fs');
const path = require('path');

const BANK_PATH = path.join(__dirname, 'backend/data/diagnostic-bank.json');
const bank = JSON.parse(fs.readFileSync(BANK_PATH, 'utf8'));
const existingIds = new Set(bank.questions.map(q => q.id));

// ============ 新增题目（66 道，保持结构与原题库完全一致） ============
const NEW_QUESTIONS = [
  // ========== 数学（补 4 题，总计 12） ==========
  {
    id: 'dg_math_09', subject: '数学', knowledge_point_id: 'kp_math_seq', knowledge_point: '数列通项与求和',
    difficulty: 3,
    stem: '等差数列 {a_n} 中，a_1 = 2，公差 d = 3，则 a_10 的值为？',
    options: ['A. 27', 'B. 29', 'C. 31', 'D. 33'],
    answer_index: 1,
    analysis: 'a_n = a_1 + (n-1)d = 2 + 9×3 = 29。'
  },
  {
    id: 'dg_math_10', subject: '数学', knowledge_point_id: 'kp_math_geometric', knowledge_point: '等比数列求和',
    difficulty: 3,
    stem: '等比数列前 5 项和 S_5 = 62，公比 q = 2，则首项 a_1 为？',
    options: ['A. 1', 'B. 2', 'C. 3', 'D. 4'],
    answer_index: 1,
    analysis: 'S_5 = a_1(2^5 - 1)/(2-1) = 31·a_1 = 62，得 a_1 = 2。'
  },
  {
    id: 'dg_math_11', subject: '数学', knowledge_point_id: 'kp_math_solid', knowledge_point: '立体几何体积',
    difficulty: 4,
    stem: '一个圆锥的底面半径 r = 3，高 h = 4，则其侧面积为？',
    options: ['A. 12π', 'B. 15π', 'C. 20π', 'D. 25π'],
    answer_index: 1,
    analysis: '母线 l = √(3^2 + 4^2) = 5，侧面积 = πrl = 15π。'
  },
  {
    id: 'dg_math_12', subject: '数学', knowledge_point_id: 'kp_math_prob', knowledge_point: '概率与统计',
    difficulty: 3,
    stem: '从 1、2、3、4、5 五个数中随机抽取两个不同的数，它们的和为偶数的概率是？',
    options: ['A. 2/5', 'B. 3/10', 'C. 1/2', 'D. 7/10'],
    answer_index: 0,
    analysis: '和为偶 ⟺ 两奇或两偶。C(3,2)+C(2,2) = 4，总 C(5,2)=10，P = 4/10 = 2/5。'
  },

  // ========== 物理（补 7 题，总计 11） ==========
  {
    id: 'dg_phy_05', subject: '物理', knowledge_point_id: 'kp_phy_kinematics', knowledge_point: '匀变速直线运动',
    difficulty: 3,
    stem: '一物体做匀加速直线运动，初速度 v_0 = 2 m/s，加速度 a = 3 m/s^2，则 4 秒后的速度为？',
    options: ['A. 10 m/s', 'B. 12 m/s', 'C. 14 m/s', 'D. 16 m/s'],
    answer_index: 2,
    analysis: 'v = v_0 + at = 2 + 3×4 = 14 m/s。'
  },
  {
    id: 'dg_phy_06', subject: '物理', knowledge_point_id: 'kp_phy_newton', knowledge_point: '牛顿第二定律',
    difficulty: 3,
    stem: '质量 m = 2 kg 的物体在水平面上受 F = 10 N 的水平拉力，摩擦系数 μ = 0.2，g = 10 m/s^2，则加速度为？',
    options: ['A. 2 m/s^2', 'B. 3 m/s^2', 'C. 4 m/s^2', 'D. 5 m/s^2'],
    answer_index: 1,
    analysis: 'f = μmg = 4 N，F合 = 6 N，a = F合/m = 3 m/s^2。'
  },
  {
    id: 'dg_phy_07', subject: '物理', knowledge_point_id: 'kp_phy_energy', knowledge_point: '动能定理',
    difficulty: 4,
    stem: '一物体从高 h = 20 m 处自由落下，落地时的动能是（不计空气阻力，g = 10 m/s^2）？',
    options: ['A. 200m J', 'B. 400m J', 'C. 100m J', 'D. 条件不足'],
    answer_index: 0,
    analysis: 'mgh = Ek，Ek = m·10·20 = 200m J。'
  },
  {
    id: 'dg_phy_08', subject: '物理', knowledge_point_id: 'kp_phy_circular', knowledge_point: '圆周运动向心力',
    difficulty: 3,
    stem: '汽车以 v = 20 m/s 的速度通过半径 r = 100 m 的凸形桥顶时，对桥面的压力是其重力的（g = 10 m/s^2）？',
    options: ['A. 0.6 倍', 'B. 0.8 倍', 'C. 1.0 倍', 'D. 1.2 倍'],
    answer_index: 1,
    analysis: 'mg - N = mv^2/r，N = m(g - v^2/r) = m(10 - 4) = 6m；6m/10m = 0.6。'
  },
  {
    id: 'dg_phy_09', subject: '物理', knowledge_point_id: 'kp_phy_electric', knowledge_point: '库仑定律',
    difficulty: 3,
    stem: '两个点电荷相距 r，相互作用力为 F。若距离变为 2r，则作用力变为？',
    options: ['A. F/2', 'B. F/4', 'C. 2F', 'D. 4F'],
    answer_index: 1,
    analysis: 'F ∝ 1/r^2，r 加倍则 F 变为 1/4。'
  },
  {
    id: 'dg_phy_10', subject: '物理', knowledge_point_id: 'kp_phy_circuit', knowledge_point: '闭合电路欧姆定律',
    difficulty: 4,
    stem: '电源电动势 E = 6 V，内阻 r = 1 Ω，外电路接 R = 2 Ω 的电阻，则路端电压为？',
    options: ['A. 2 V', 'B. 3 V', 'C. 4 V', 'D. 6 V'],
    answer_index: 2,
    analysis: 'I = E/(R+r) = 2 A，U = IR = 4 V。'
  },
  {
    id: 'dg_phy_11', subject: '物理', knowledge_point_id: 'kp_phy_magnet', knowledge_point: '安培力',
    difficulty: 4,
    stem: '一根长 L = 0.2 m 的导线垂直放入 B = 0.5 T 的匀强磁场中，通以 I = 4 A 的电流，则安培力大小为？',
    options: ['A. 0.2 N', 'B. 0.4 N', 'C. 0.8 N', 'D. 4 N'],
    answer_index: 1,
    analysis: 'F = BIL = 0.5×4×0.2 = 0.4 N。'
  },

  // ========== 化学（补 7 题，总计 11） ==========
  {
    id: 'dg_chem_05', subject: '化学', knowledge_point_id: 'kp_chem_atom', knowledge_point: '原子结构与元素周期律',
    difficulty: 3,
    stem: '下列元素中，原子半径最大的是？',
    options: ['A. Na', 'B. Mg', 'C. Al', 'D. K'],
    answer_index: 3,
    analysis: '电子层数越多半径越大，K 有 4 个电子层，其余均为 3 层。'
  },
  {
    id: 'dg_chem_06', subject: '化学', knowledge_point_id: 'kp_chem_bond', knowledge_point: '化学键类型判断',
    difficulty: 3,
    stem: '下列化合物中，只含有共价键的是？',
    options: ['A. NaCl', 'B. H2O', 'C. NaOH', 'D. CaCO3'],
    answer_index: 1,
    analysis: 'NaCl 含离子键；NaOH、CaCO3 既有离子键又有共价键；H2O 只含 O-H 共价键。'
  },
  {
    id: 'dg_chem_07', subject: '化学', knowledge_point_id: 'kp_chem_redox', knowledge_point: '氧化还原反应',
    difficulty: 4,
    stem: '反应 2KMnO4 + 16HCl = 2MnCl2 + 5Cl2↑ + 2KCl + 8H2O 中，氧化剂是？',
    options: ['A. HCl', 'B. KMnO4', 'C. MnCl2', 'D. Cl2'],
    answer_index: 1,
    analysis: 'KMnO4 中 Mn 从 +7 降到 +2，得到电子，是氧化剂。'
  },
  {
    id: 'dg_chem_08', subject: '化学', knowledge_point_id: 'kp_chem_solution', knowledge_point: '溶液 pH 计算',
    difficulty: 3,
    stem: '常温下，0.01 mol/L 的盐酸溶液，pH 为？',
    options: ['A. 1', 'B. 2', 'C. 12', 'D. 13'],
    answer_index: 1,
    analysis: 'c(H+) = 0.01 mol/L，pH = -lg(0.01) = 2。'
  },
  {
    id: 'dg_chem_09', subject: '化学', knowledge_point_id: 'kp_chem_org', knowledge_point: '有机化学基础',
    difficulty: 4,
    stem: '下列物质中，属于烃的是？',
    options: ['A. CH3OH', 'B. CH3COOH', 'C. C6H6', 'D. CH3CHO'],
    answer_index: 2,
    analysis: '烃是只含 C、H 两种元素的有机物。CH3OH 含 O，CH3COOH 含 O，CH3CHO 含 O；C6H6（苯）是烃。'
  },
  {
    id: 'dg_chem_10', subject: '化学', knowledge_point_id: 'kp_chem_equilibrium', knowledge_point: '化学平衡移动',
    difficulty: 4,
    stem: '反应 N2 + 3H2 ⇌ 2NH3 ΔH < 0，达到平衡后，下列条件能使平衡正向移动的是？',
    options: ['A. 升高温度', 'B. 减小压强', 'C. 增加 NH3 浓度', 'D. 增加 N2 浓度'],
    answer_index: 3,
    analysis: '升温平衡向吸热方向（逆向）；减压向气体增多方向（逆向）；增产物浓度逆向；增反应物浓度正向。'
  },
  {
    id: 'dg_chem_11', subject: '化学', knowledge_point_id: 'kp_chem_electrochem', knowledge_point: '电化学基础',
    difficulty: 4,
    stem: '铜锌原电池中，锌片是？',
    options: ['A. 正极，发生氧化反应', 'B. 正极，发生还原反应', 'C. 负极，发生氧化反应', 'D. 负极，发生还原反应'],
    answer_index: 2,
    analysis: 'Zn 活泼，失电子变为 Zn2+，为负极，发生氧化反应。'
  },

  // ========== 英语（补 7 题，总计 11） ==========
  {
    id: 'dg_eng_05', subject: '英语', knowledge_point_id: 'kp_eng_grammar_tense', knowledge_point: '时态辨析',
    difficulty: 3,
    stem: 'By the time he arrived at the station, the train ______ for ten minutes.',
    options: ['A. has left', 'B. had left', 'C. left', 'D. was leaving'],
    answer_index: 1,
    analysis: '"到他到达时"是过去的过去，主句谓语用过去完成时 had left。'
  },
  {
    id: 'dg_eng_06', subject: '英语', knowledge_point_id: 'kp_eng_grammar_subjunctive', knowledge_point: '虚拟语气',
    difficulty: 4,
    stem: 'If I ______ you, I would take the offer.',
    options: ['A. am', 'B. was', 'C. were', 'D. be'],
    answer_index: 2,
    analysis: '与现在事实相反的虚拟条件句，be 动词一律用 were。'
  },
  {
    id: 'dg_eng_07', subject: '英语', knowledge_point_id: 'kp_eng_clause_attr', knowledge_point: '定语从句',
    difficulty: 3,
    stem: 'The house ______ we visited yesterday was built in 1990.',
    options: ['A. where', 'B. which', 'C. what', 'D. when'],
    answer_index: 1,
    analysis: '先行词 house 是物，关系词在从句中作 visited 的宾语，用 which 或 that。'
  },
  {
    id: 'dg_eng_08', subject: '英语', knowledge_point_id: 'kp_eng_nonfinite', knowledge_point: '非谓语动词',
    difficulty: 4,
    stem: '______ late in the morning, Bob turned off the alarm clock.',
    options: ['A. To sleep', 'B. Sleeping', 'C. Sleep', 'D. Having slept'],
    answer_index: 0,
    analysis: '不定式 To sleep 作目的状语，表示"为了……"。'
  },
  {
    id: 'dg_eng_09', subject: '英语', knowledge_point_id: 'kp_eng_vocab', knowledge_point: '词义辨析',
    difficulty: 3,
    stem: 'The teacher asked us to ______ the homework before Friday.',
    options: ['A. hand out', 'B. hand in', 'C. hand over', 'D. hand up'],
    answer_index: 1,
    analysis: 'hand in 意为"上交（作业）"；hand out "分发"；hand over "移交"；hand up "举手"。'
  },
  {
    id: 'dg_eng_10', subject: '英语', knowledge_point_id: 'kp_eng_reading', knowledge_point: '阅读理解—主旨题',
    difficulty: 4,
    stem: 'An article mainly discusses the causes and effects of global warming. The best title is？',
    options: ['A. A Brief History of Climate Change', 'B. Global Warming: Causes and Consequences', 'C. How to Reduce Carbon Footprint', 'D. The Future of Renewable Energy'],
    answer_index: 1,
    analysis: '主旨题应涵盖全文两大要点——原因与影响，B 选项标题完全对应。'
  },
  {
    id: 'dg_eng_11', subject: '英语', knowledge_point_id: 'kp_eng_writing', knowledge_point: '书面表达',
    difficulty: 3,
    stem: 'Which sentence is grammatically correct?',
    options: ['A. He don\'t like apples.', 'B. She doesn\'t likes bananas.', 'C. They doesn\'t eat meat.', 'D. We don\'t drink coffee.'],
    answer_index: 3,
    analysis: '助动词 do/does 后必须接动词原形。只有 D 选项"我们不喝咖啡"语法正确。'
  },

  // ========== 语文（补 7 题，总计 11） ==========
  {
    id: 'dg_cn_05', subject: '语文', knowledge_point_id: 'kp_cn_poem', knowledge_point: '古诗文鉴赏',
    difficulty: 4,
    stem: '"大漠孤烟直，长河落日圆"出自哪位诗人的作品？',
    options: ['A. 李白', 'B. 杜甫', 'C. 王维', 'D. 岑参'],
    answer_index: 2,
    analysis: '此句出自王维《使至塞上》，是描写边塞壮阔景象的千古名句。'
  },
  {
    id: 'dg_cn_06', subject: '语文', knowledge_point_id: 'kp_cn_wenyan', knowledge_point: '文言虚词',
    difficulty: 4,
    stem: '"师者，所以传道受业解惑也"中"所以"的意思是？',
    options: ['A. 表因果的连词', 'B. 用来……的', 'C. 因此', 'D. 实在的原因'],
    answer_index: 1,
    analysis: '"所以"在古汉语中常用作"用来……的人/方法/原因"，此处意为"用来传授道理、教授学业、解答疑惑的人"。'
  },
  {
    id: 'dg_cn_07', subject: '语文', knowledge_point_id: 'kp_cn_idiom', knowledge_point: '成语使用',
    difficulty: 3,
    stem: '下列成语使用正确的一项是？',
    options: ['A. 他的演讲振聋发聩，让人昏昏欲睡', 'B. 这部小说情节跌宕起伏，引人入胜', 'C. 他对工作一丝不苟，经常敷衍塞责', 'D. 这篇文章妙笔生花，却错漏百出'],
    answer_index: 1,
    analysis: 'A、C、D 三项成语与其后描述自相矛盾；B 项"跌宕起伏、引人入胜"形容小说情节恰当。'
  },
  {
    id: 'dg_cn_08', subject: '语文', knowledge_point_id: 'kp_cn_modern', knowledge_point: '现代文阅读',
    difficulty: 4,
    stem: '鲁迅《拿来主义》的中心论点是？',
    options: ['A. 要全盘否定外国文化', 'B. 要全盘接受外国文化', 'C. 要运用脑髓，放出眼光，自己来拿', 'D. 要闭关锁国'],
    answer_index: 2,
    analysis: '鲁迅在文中主张对外国文化遗产采取批判继承、创新发展的态度，"运用脑髓，放出眼光，自己来拿"是核心观点。'
  },
  {
    id: 'dg_cn_09', subject: '语文', knowledge_point_id: 'kp_cn_sentence', knowledge_point: '病句辨析',
    difficulty: 3,
    stem: '下列句子没有语病的一项是？',
    options: ['A. 通过这次活动，使我们受益匪浅', 'B. 我们要继承和发扬老一辈革命家的优良传统', 'C. 能否坚持到底，是取得成功的关键', 'D. 为了防止不再生病，我加强了锻炼'],
    answer_index: 1,
    analysis: 'A 缺主语；C 两面对一面；D "防止""不再"双重否定表肯定，与原意矛盾。'
  },
  {
    id: 'dg_cn_10', subject: '语文', knowledge_point_id: 'kp_cn_poem2', knowledge_point: '古诗词背诵',
    difficulty: 2,
    stem: '"海内存知己，天涯若比邻"的作者是？',
    options: ['A. 王勃', 'B. 李白', 'C. 杜甫', 'D. 白居易'],
    answer_index: 0,
    analysis: '出自王勃《送杜少府之任蜀州》，是送别诗的千古名句。'
  },
  {
    id: 'dg_cn_11', subject: '语文', knowledge_point_id: 'kp_cn_calligraphy', knowledge_point: '汉字书写',
    difficulty: 2,
    stem: '下列词语中没有错别字的一组是？',
    options: ['A. 按步就班 再接再励', 'B. 川流不息 迫不及待', 'C. 一诺千斤 一愁莫展', 'D. 不径而走 甘败下风'],
    answer_index: 1,
    analysis: 'A 应为"按部就班、再接再厉"；C 应为"一诺千金、一筹莫展"；D 应为"不胫而走、甘拜下风"。'
  },

  // ========== 生物（补 7 题，总计 10） ==========
  {
    id: 'dg_bio_04', subject: '生物', knowledge_point_id: 'kp_bio_cell', knowledge_point: '细胞结构',
    difficulty: 3,
    stem: '下列结构中，植物细胞有而动物细胞没有的是？',
    options: ['A. 细胞膜', 'B. 细胞质', 'C. 细胞壁', 'D. 线粒体'],
    answer_index: 2,
    analysis: '细胞壁、叶绿体、液泡是植物细胞特有的结构。细胞膜、细胞质、线粒体动植物细胞都有。'
  },
  {
    id: 'dg_bio_05', subject: '生物', knowledge_point_id: 'kp_bio_photosynthesis', knowledge_point: '光合作用',
    difficulty: 4,
    stem: '光合作用的反应场所主要在？',
    options: ['A. 线粒体', 'B. 叶绿体', 'C. 核糖体', 'D. 细胞核'],
    answer_index: 1,
    analysis: '光合作用在叶绿体中进行，分为光反应（类囊体膜）和暗反应（基质）两个阶段。'
  },
  {
    id: 'dg_bio_06', subject: '生物', knowledge_point_id: 'kp_bio_respiration', knowledge_point: '细胞呼吸',
    difficulty: 4,
    stem: '有氧呼吸的主要场所是？',
    options: ['A. 细胞质基质', 'B. 线粒体', 'C. 叶绿体', 'D. 细胞核'],
    answer_index: 1,
    analysis: '有氧呼吸第一阶段在细胞质基质，第二、三阶段在线粒体（基质和内膜）进行，线粒体是主要场所。'
  },
  {
    id: 'dg_bio_07', subject: '生物', knowledge_point_id: 'kp_bio_genetic', knowledge_point: '遗传与变异',
    difficulty: 4,
    stem: '孟德尔遗传定律中，分离定律的实质是？',
    options: ['A. 子二代性状分离比 3:1', 'B. 减数分裂时等位基因彼此分离', 'C. 受精时雌雄配子随机结合', 'D. 基因发生了突变'],
    answer_index: 1,
    analysis: '分离定律实质：减数分裂形成配子时，等位基因随同源染色体分开而分离，分别进入两个配子。'
  },
  {
    id: 'dg_bio_08', subject: '生物', knowledge_point_id: 'kp_bio_dna', knowledge_point: 'DNA 复制与表达',
    difficulty: 4,
    stem: 'DNA 复制的特点是？',
    options: ['A. 全保留复制', 'B. 半保留复制', 'C. 分散复制', 'D. 以上都不对'],
    answer_index: 1,
    analysis: 'DNA 复制是半保留复制：每个子代 DNA 分子由一条母链和一条新合成的子链组成。'
  },
  {
    id: 'dg_bio_09', subject: '生物', knowledge_point_id: 'kp_bio_ecology', knowledge_point: '生态系统',
    difficulty: 3,
    stem: '在生态系统中，能量流动的特点是？',
    options: ['A. 循环流动', 'B. 单向流动，逐级递减', 'C. 双向流动', 'D. 逐级递增'],
    answer_index: 1,
    analysis: '能量沿食物链单向流动，传递效率约为 10%~20%，逐级递减。物质才是循环流动的。'
  },
  {
    id: 'dg_bio_10', subject: '生物', knowledge_point_id: 'kp_bio_regulation', knowledge_point: '生命活动调节',
    difficulty: 4,
    stem: '胰岛素的主要功能是？',
    options: ['A. 升高血糖浓度', 'B. 降低血糖浓度', 'C. 促进蛋白质合成', 'D. 调节水盐平衡'],
    answer_index: 1,
    analysis: '胰岛素由胰岛 B 细胞分泌，是人体内唯一降低血糖的激素；胰高血糖素则升高血糖。'
  },

  // ========== 政治（补 8 题，总计 11） ==========
  {
    id: 'dg_pol_04', subject: '政治', knowledge_point_id: 'kp_pol_economy', knowledge_point: '经济生活',
    difficulty: 3,
    stem: '下列选项中，属于商品的是？',
    options: ['A. 母亲为你织的毛衣', 'B. 同学送给你的钢笔', 'C. 超市里待售的牛奶', 'D. 农民自种自吃的蔬菜'],
    answer_index: 2,
    analysis: '商品是用于交换的劳动产品。A、B、D 都不是用于交换，只有 C 同时满足"劳动产品"和"用于交换"两个条件。'
  },
  {
    id: 'dg_pol_05', subject: '政治', knowledge_point_id: 'kp_pol_price', knowledge_point: '价格与供求',
    difficulty: 3,
    stem: '一般来说，商品价格上涨，会导致？',
    options: ['A. 需求量增加', 'B. 需求量减少', 'C. 供给量减少', 'D. 供需都不变'],
    answer_index: 1,
    analysis: '一般商品需求法则：价格与需求量成反比。价格上涨，消费者购买意愿减弱，需求量减少。'
  },
  {
    id: 'dg_pol_06', subject: '政治', knowledge_point_id: 'kp_pol_political', knowledge_point: '政治生活',
    difficulty: 3,
    stem: '我国的根本政治制度是？',
    options: ['A. 人民代表大会制度', 'B. 中国共产党领导的多党合作和政治协商制度', 'C. 民族区域自治制度', 'D. 基层群众自治制度'],
    answer_index: 0,
    analysis: '人民代表大会制度是我国的根本政治制度；B、C、D 是基本政治制度。'
  },
  {
    id: 'dg_pol_07', subject: '政治', knowledge_point_id: 'kp_pol_philosophy', knowledge_point: '生活与哲学',
    difficulty: 4,
    stem: '"存在即被感知"属于什么哲学派别？',
    options: ['A. 唯物主义', 'B. 唯心主义', 'C. 形而上学', 'D. 辩证法'],
    answer_index: 1,
    analysis: '"存在即被感知"是英国哲学家贝克莱的名言，认为世界的本质是意识，属于主观唯心主义。'
  },
  {
    id: 'dg_pol_08', subject: '政治', knowledge_point_id: 'kp_pol_materialism', knowledge_point: '辩证唯物主义',
    difficulty: 4,
    stem: '辩证唯物主义认为，世界的本原是？',
    options: ['A. 物质', 'B. 意识', 'C. 精神', 'D. 上帝'],
    answer_index: 0,
    analysis: '辩证唯物主义是彻底的唯物主义，认为物质是世界的本原，意识是物质的反映。'
  },
  {
    id: 'dg_pol_09', subject: '政治', knowledge_point_id: 'kp_pol_culture', knowledge_point: '文化生活',
    difficulty: 3,
    stem: '对待传统文化的正确态度是？',
    options: ['A. 全盘继承', 'B. 全盘否定', 'C. 取其精华，去其糟粕', 'D. 完全替换'],
    answer_index: 2,
    analysis: '对待传统文化的正确态度是"取其精华、去其糟粕"，在继承的基础上发展、创新。'
  },
  {
    id: 'dg_pol_10', subject: '政治', knowledge_point_id: 'kp_pol_market', knowledge_point: '市场经济',
    difficulty: 4,
    stem: '社会主义市场经济的基本特征不包括？',
    options: ['A. 坚持公有制的主体地位', 'B. 以共同富裕为根本目标', 'C. 能够实行科学的宏观调控', 'D. 完全由市场调节'],
    answer_index: 3,
    analysis: '社会主义市场经济的三大基本特征是 A、B、C；D 不是特征，且任何市场经济都需要宏观调控。'
  },
  {
    id: 'dg_pol_11', subject: '政治', knowledge_point_id: 'kp_pol_international', knowledge_point: '当代国际社会',
    difficulty: 3,
    stem: '国际关系的决定性因素是？',
    options: ['A. 国家性质', 'B. 国家利益', 'C. 国家力量', 'D. 国际地位'],
    answer_index: 1,
    analysis: '国家利益是国际关系的决定性因素；国家间的共同利益是合作的基础，利益对立则是冲突的根源。'
  },

  // ========== 历史（补 8 题，总计 10） ==========
  {
    id: 'dg_his_03', subject: '历史', knowledge_point_id: 'kp_his_ancient', knowledge_point: '中国古代史',
    difficulty: 3,
    stem: '中国历史上第一个统一的中央集权的封建国家是？',
    options: ['A. 夏朝', 'B. 商朝', 'C. 秦朝', 'D. 汉朝'],
    answer_index: 2,
    analysis: '公元前 221 年，秦王嬴政统一六国，建立了中国历史上第一个统一的中央集权制封建国家——秦朝。'
  },
  {
    id: 'dg_his_04', subject: '历史', knowledge_point_id: 'kp_his_imperial', knowledge_point: '君主专制的演变',
    difficulty: 4,
    stem: '标志着中国君主专制制度达到顶峰的是？',
    options: ['A. 明朝废除丞相', 'B. 明朝设立内阁', 'C. 清朝设立军机处', 'D. 清朝实行文字狱'],
    answer_index: 2,
    analysis: '清雍正年间设立军机处，军机大臣只能"跪受笔录"，军政大权全归皇帝，标志君主专制达到顶峰。'
  },
  {
    id: 'dg_his_05', subject: '历史', knowledge_point_id: 'kp_his_modern_cn', knowledge_point: '中国近代史',
    difficulty: 3,
    stem: '标志着中国近代史开端的事件是？',
    options: ['A. 辛亥革命', 'B. 鸦片战争', 'C. 五四运动', 'D. 新中国成立'],
    answer_index: 1,
    analysis: '1840 年鸦片战争是中国近代史的开端，中国开始沦为半殖民地半封建社会。'
  },
  {
    id: 'dg_his_06', subject: '历史', knowledge_point_id: 'kp_his_reform', knowledge_point: '近代化探索',
    difficulty: 4,
    stem: '"自强""求富"是哪一历史事件的口号？',
    options: ['A. 洋务运动', 'B. 戊戌变法', 'C. 辛亥革命', 'D. 新文化运动'],
    answer_index: 0,
    analysis: '19 世纪 60-90 年代的洋务运动，前期以"自强"为口号创办军事工业，后期以"求富"为口号创办民用工业。'
  },
  {
    id: 'dg_his_07', subject: '历史', knowledge_point_id: 'kp_his_contemporary', knowledge_point: '中国现代史',
    difficulty: 3,
    stem: '中华人民共和国成立于？',
    options: ['A. 1911 年', 'B. 1919 年', 'C. 1945 年', 'D. 1949 年'],
    answer_index: 3,
    analysis: '1949 年 10 月 1 日，毛泽东在天安门城楼上宣告中华人民共和国中央人民政府成立。'
  },
  {
    id: 'dg_his_08', subject: '历史', knowledge_point_id: 'kp_his_reform_open', knowledge_point: '改革开放',
    difficulty: 3,
    stem: '标志着中国进入改革开放新时期的会议是？',
    options: ['A. 中共八大', 'B. 中共十一届三中全会', 'C. 中共十二大', 'D. 中共十四大'],
    answer_index: 1,
    analysis: '1978 年 12 月召开的中共十一届三中全会，作出了把工作重点转移到经济建设上来、实行改革开放的伟大决策。'
  },
  {
    id: 'dg_his_09', subject: '历史', knowledge_point_id: 'kp_his_world_modern', knowledge_point: '世界近代史',
    difficulty: 4,
    stem: '英国君主立宪制确立的标志是？',
    options: ['A. 1640 年英国资产阶级革命爆发', 'B. 1688 年光荣革命', 'C. 1689 年《权利法案》颁布', 'D. 1832 年议会改革'],
    answer_index: 2,
    analysis: '1689 年议会通过《权利法案》，以法律形式限制王权、保障议会权力，标志英国君主立宪制确立。'
  },
  {
    id: 'dg_his_10', subject: '历史', knowledge_point_id: 'kp_his_world_contemporary', knowledge_point: '世界现代史',
    difficulty: 4,
    stem: '第二次世界大战结束于？',
    options: ['A. 1939 年', 'B. 1941 年', 'C. 1945 年', 'D. 1949 年'],
    answer_index: 2,
    analysis: '1945 年 8 月 15 日日本宣布无条件投降，9 月 2 日签署投降书，二战结束。'
  },

  // ========== 地理（补 8 题，总计 10） ==========
  {
    id: 'dg_geo_03', subject: '地理', knowledge_point_id: 'kp_geo_solar', knowledge_point: '太阳活动',
    difficulty: 3,
    stem: '太阳活动对地球的影响不包括？',
    options: ['A. 干扰无线电短波通讯', 'B. 产生磁暴现象', 'C. 引起地震', 'D. 在高纬产生极光'],
    answer_index: 2,
    analysis: '太阳活动能影响电离层、磁场和大气，但地震是地球内部能量释放的结果，与太阳活动无直接因果关系。'
  },
  {
    id: 'dg_geo_04', subject: '地理', knowledge_point_id: 'kp_geo_atmosphere', knowledge_point: '大气环流',
    difficulty: 4,
    stem: '全球气压带和风带的分布，赤道附近是？',
    options: ['A. 副热带高气压带', 'B. 赤道低气压带', 'C. 副极地低气压带', 'D. 极地高气压带'],
    answer_index: 1,
    analysis: '赤道附近受热多，空气上升，形成赤道低气压带（0°附近）；30°附近为副热带高压，60°附近为副极地低压。'
  },
  {
    id: 'dg_geo_05', subject: '地理', knowledge_point_id: 'kp_geo_climate', knowledge_point: '气候类型',
    difficulty: 4,
    stem: '地中海气候的特点是？',
    options: ['A. 全年高温多雨', 'B. 夏季高温多雨，冬季寒冷干燥', 'C. 夏季炎热干燥，冬季温和多雨', 'D. 全年温和湿润'],
    answer_index: 2,
    analysis: '地中海气候分布在大陆西岸 30°-40°，夏季受副高控制炎热干燥，冬季受西风带控制温和多雨。'
  },
  {
    id: 'dg_geo_06', subject: '地理', knowledge_point_id: 'kp_geo_ocean', knowledge_point: '洋流',
    difficulty: 4,
    stem: '北半球中低纬大洋环流的方向是？',
    options: ['A. 顺时针', 'B. 逆时针', 'C. 自南向北', 'D. 自北向南'],
    answer_index: 0,
    analysis: '北半球中低纬（0°-30°）大洋环流受信风带、西风带和地转偏向力影响，呈顺时针方向。'
  },
  {
    id: 'dg_geo_07', subject: '地理', knowledge_point_id: 'kp_geo_landform', knowledge_point: '地质作用与地貌',
    difficulty: 4,
    stem: '下列地貌主要由流水侵蚀作用形成的是？',
    options: ['A. 风蚀蘑菇', 'B. 冰川谷', 'C. 黄土高原千沟万壑', 'D. 沙丘'],
    answer_index: 2,
    analysis: '黄土高原千沟万壑是流水侵蚀的结果；风蚀蘑菇是风力侵蚀；冰川谷是冰川侵蚀；沙丘是风力堆积。'
  },
  {
    id: 'dg_geo_08', subject: '地理', knowledge_point_id: 'kp_geo_agriculture', knowledge_point: '农业区位',
    difficulty: 3,
    stem: '影响水稻种植最主要的自然因素是？',
    options: ['A. 地形', 'B. 气候', 'C. 土壤', 'D. 水源'],
    answer_index: 1,
    analysis: '水稻喜高温多湿，对热量和降水要求高，气候（热量+降水条件）是决定水稻能否种植的首要自然因素。'
  },
  {
    id: 'dg_geo_09', subject: '地理', knowledge_point_id: 'kp_geo_industry', knowledge_point: '工业区位',
    difficulty: 3,
    stem: '啤酒厂、家具厂、面包加工厂的区位选择最主要的共同因素是？',
    options: ['A. 原料', 'B. 市场', 'C. 劳动力', 'D. 技术'],
    answer_index: 1,
    analysis: '这三类都属于"市场导向型"工业——啤酒、面包易变质不宜长距离运输，家具运输成本高，均靠近消费市场布局。'
  },
  {
    id: 'dg_geo_10', subject: '地理', knowledge_point_id: 'kp_geo_china', knowledge_point: '中国地理',
    difficulty: 3,
    stem: '中国地势的主要特征是？',
    options: ['A. 西高东低，呈阶梯状分布', 'B. 东高西低，呈阶梯状分布', 'C. 南高北低，呈阶梯状分布', 'D. 中部高，四周低'],
    answer_index: 0,
    analysis: '中国地势西高东低，自西向东分为三大阶梯：第一级阶梯青藏高原，第二级阶梯高原盆地，第三级阶梯平原丘陵。'
  }
];

// ============ 合并 & 校验 ============
const duplicates = NEW_QUESTIONS.filter(q => existingIds.has(q.id));
if (duplicates.length > 0) {
  console.error('❌ 新增题目 ID 与现有重复:', duplicates.map(q => q.id).join(', '));
  process.exit(1);
}

const merged = {
  source: bank.source,
  updated_at: bank.updated_at || new Date().toISOString().slice(0, 10),
  total: bank.questions.length + NEW_QUESTIONS.length,
  questions: [...bank.questions, ...NEW_QUESTIONS]
};

fs.writeFileSync(BANK_PATH, JSON.stringify(merged, null, 2) + '\n', 'utf8');

// ============ 打印结果 ============
const subjectCount = {};
merged.questions.forEach(q => { subjectCount[q.subject] = (subjectCount[q.subject] || 0) + 1; });
console.log('✅ 扩充完成!');
console.log('   原有:', bank.questions.length, '题');
console.log('   新增:', NEW_QUESTIONS.length, '题');
console.log('   总计:', merged.questions.length, '题');
console.log('\n📚 学科分布:');
Object.entries(subjectCount).sort((a,b) => b[1]-a[1]).forEach(([s, c]) => console.log(`   ${s.padEnd(4)}: ${c} 题`));
console.log('\n💾 已写入:', BANK_PATH);
