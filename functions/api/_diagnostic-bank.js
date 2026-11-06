// 自动生成，请勿手改。数据源：backend/data/diagnostic-bank.json
export default [
  {
    "id": "dg_math_01",
    "subject": "数学",
    "knowledge_point_id": "kp_math_conic",
    "knowledge_point": "圆锥曲线综合",
    "difficulty": 4,
    "stem": "已知椭圆 x^2/4 + y^2/3 = 1，过点 P(1,1) 的直线与椭圆交于 A、B 两点，则弦长 |AB| 的取值范围是？",
    "options": [
      "A. [2, 2√3]",
      "B. [√3, 2√3]",
      "C. [2, 4]",
      "D. [√2, 2√2]"
    ],
    "answer_index": 1,
    "analysis": "设直线斜率 k，联立椭圆方程用韦达定理求 |AB|，再求最值域。"
  },
  {
    "id": "dg_math_02",
    "subject": "数学",
    "knowledge_point_id": "kp_math_derivative",
    "knowledge_point": "导数应用专题",
    "difficulty": 5,
    "stem": "设 f(x)=x^3-3x+1，下列关于其极值与零点个数的说法正确的是？",
    "options": [
      "A. 极大值 3，极小值 -1，3 个零点",
      "B. 极大值 -1，极小值 3，3 个零点",
      "C. 极大值 3，极小值 -1，1 个零点",
      "D. 无极值，1 个零点"
    ],
    "answer_index": 0,
    "analysis": "f'(x)=3x^2-3，驻点 x=±1；f(-1)=3 为极大值，f(1)=-1 为极小值，结合零点定理有 3 个零点。"
  },
  {
    "id": "dg_math_03",
    "subject": "数学",
    "knowledge_point_id": "kp_math_sequence",
    "knowledge_point": "数列求和方法",
    "difficulty": 3,
    "stem": "数列 {an} 满足 an = 1/[n(n+1)]，则其前 n 项和 Sn = ?",
    "options": [
      "A. n/(n+1)",
      "B. (n+1)/(n+2)",
      "C. 1-1/n",
      "D. n/(2n+1)"
    ],
    "answer_index": 0,
    "analysis": "裂项相消：1/[n(n+1)] = 1/n - 1/(n+1)，求和得 1 - 1/(n+1) = n/(n+1)。"
  },
  {
    "id": "dg_math_04",
    "subject": "数学",
    "knowledge_point_id": "kp_math_probability",
    "knowledge_point": "概率统计",
    "difficulty": 3,
    "stem": "从 5 男 3 女中任选 3 人，至少有 1 名女生的概率是？",
    "options": [
      "A. 5/14",
      "B. 9/14",
      "C. 15/28",
      "D. 23/28"
    ],
    "answer_index": 3,
    "analysis": "对立事件为全男：C(5,3)/C(8,3)=10/56，故所求 1-10/56=23/28。"
  },
  {
    "id": "dg_phy_01",
    "subject": "物理",
    "knowledge_point_id": "kp_phy_induction",
    "knowledge_point": "电磁感应综合题",
    "difficulty": 4,
    "stem": "导体棒在匀强磁场 B 中以速度 v 垂直切割磁感线，回路总电阻为 R，则感应电流大小为？",
    "options": [
      "A. BLv/R",
      "B. Bv/R",
      "C. BL/R",
      "D. BLvR"
    ],
    "answer_index": 0,
    "analysis": "ε=BLv，闭合电路欧姆定律 I=ε/R=BLv/R。"
  },
  {
    "id": "dg_phy_02",
    "subject": "物理",
    "knowledge_point_id": "kp_phy_mechanics",
    "knowledge_point": "力学综合分析",
    "difficulty": 4,
    "stem": "物体自高 h 处自由下落，落地速度为 v，质量为 m，则下落过程中合外力做功为？",
    "options": [
      "A. mgh",
      "B. 1/2mv^2",
      "C. mgh - 1/2mv^2",
      "D. 0"
    ],
    "answer_index": 1,
    "analysis": "动能定理：合外力做功等于动能变化量 1/2mv^2。"
  },
  {
    "id": "dg_phy_03",
    "subject": "物理",
    "knowledge_point_id": "kp_phy_momentum",
    "knowledge_point": "动量与冲量",
    "difficulty": 3,
    "stem": "质量 2kg 的物体速度从 3m/s 增大到 5m/s，动量变化量大小为？",
    "options": [
      "A. 4 kg·m/s",
      "B. 6 kg·m/s",
      "C. 8 kg·m/s",
      "D. 10 kg·m/s"
    ],
    "answer_index": 0,
    "analysis": "Δp = m(v2-v1) = 2×(5-3) = 4 kg·m/s。"
  },
  {
    "id": "dg_chem_01",
    "subject": "化学",
    "knowledge_point_id": "kp_chem_equilibrium",
    "knowledge_point": "化学平衡计算",
    "difficulty": 4,
    "stem": "对于反应 aA+bB↔cC+dD，化学平衡常数 K 的表达式为？",
    "options": [
      "A. [c(C)·c(D)]/[c(A)·c(B)]",
      "B. c(C)^c·c(D)^d /[c(A)^a·c(B)^b]",
      "C. c(A)^a·c(B)^b /[c(C)^c·c(D)^d]",
      "D. (a+b)/(c+d)"
    ],
    "answer_index": 1,
    "analysis": "K 为生成物浓度幂之积除以反应物浓度幂之积，固体与纯液体不计入。"
  },
  {
    "id": "dg_chem_02",
    "subject": "化学",
    "knowledge_point_id": "kp_chem_organic",
    "knowledge_point": "有机推断题型",
    "difficulty": 5,
    "stem": "某链状化合物 A 分子式 C4H8O2，能与 NaHCO3 反应放出 CO2，则 A 的结构简式为？",
    "options": [
      "A. CH3CH2CH2COOH",
      "B. CH3COOCH2CH3",
      "C. HOCH2CH2CH2CHO",
      "D. CH3CH2OCH2CH3"
    ],
    "answer_index": 0,
    "analysis": "与 NaHCO3 反应说明含羧基，C4H8O2 不饱和度为 1，故为丁酸。"
  },
  {
    "id": "dg_chem_03",
    "subject": "化学",
    "knowledge_point_id": "kp_chem_electro",
    "knowledge_point": "电化学原理",
    "difficulty": 3,
    "stem": "关于原电池，下列说法正确的是？",
    "options": [
      "A. 正极发生氧化反应",
      "B. 负极发生还原反应",
      "C. 电子由负极经外电路流向正极",
      "D. 阳离子向负极迁移"
    ],
    "answer_index": 2,
    "analysis": "负极失电子被氧化，电子经外电路流向正极；阳离子向正极迁移。"
  },
  {
    "id": "dg_eng_01",
    "subject": "英语",
    "knowledge_point_id": "kp_eng_cloze",
    "knowledge_point": "完形填空技巧",
    "difficulty": 3,
    "stem": "The students were ___ by the teacher's inspiring speech.",
    "options": [
      "A. bored",
      "B. moved",
      "C. confused",
      "D. scared"
    ],
    "answer_index": 1,
    "analysis": "inspiring speech 暗示积极情绪，moved（感动）最符合语境。"
  },
  {
    "id": "dg_eng_02",
    "subject": "英语",
    "knowledge_point_id": "kp_eng_grammar",
    "knowledge_point": "语法填空",
    "difficulty": 4,
    "stem": "Not only ___ he finished the task, but he also helped others.",
    "options": [
      "A. did",
      "B. has",
      "C. had",
      "D. does"
    ],
    "answer_index": 0,
    "analysis": "Not only 置于句首时主句部分倒装，一般过去时用助动词 did。"
  },
  {
    "id": "dg_chi_01",
    "subject": "语文",
    "knowledge_point_id": "kp_chi_classical",
    "knowledge_point": "文言文实词辨析",
    "difficulty": 3,
    "stem": "下列加点词解释有误的一项是？",
    "options": [
      "A. 沛公军霸上（军：驻扎）",
      "B. 素善留侯张良（善：与……交好）",
      "C. 项伯杀人，臣活之（活：活泼）",
      "D. 吾得兄事之（兄：像对待兄长一样）"
    ],
    "answer_index": 2,
    "analysis": "活，使动用法，使……活下来，不是\"活泼\"。"
  },
  {
    "id": "dg_chi_02",
    "subject": "语文",
    "knowledge_point_id": "kp_chi_poetry",
    "knowledge_point": "古代诗歌鉴赏",
    "difficulty": 4,
    "stem": "\"明月松间照，清泉石上流\"最突出的艺术手法是？",
    "options": [
      "A. 用典",
      "B. 动静结合",
      "C. 夸张",
      "D. 互文"
    ],
    "answer_index": 1,
    "analysis": "明月静照、清泉动流，一动一静相映成趣，体现王维\"诗中有画\"的意境。"
  },
  {
    "id": "dg_chi_03",
    "subject": "语文",
    "knowledge_point_id": "kp_chi_modern",
    "knowledge_point": "现代文阅读理解",
    "difficulty": 3,
    "stem": "鲁迅《拿来主义》中\"大宅子\"比喻的是？",
    "options": [
      "A. 封建文化遗产",
      "B. 外国先进技术",
      "C. 民族资本主义",
      "D. 封建社会"
    ],
    "answer_index": 0,
    "analysis": "\"大宅子\"比喻中外文化遗产，\"拿来主义\"主张取其精华去其糟粕。"
  },
  {
    "id": "dg_chi_04",
    "subject": "语文",
    "knowledge_point_id": "kp_chi_writing",
    "knowledge_point": "语言文字运用",
    "difficulty": 4,
    "stem": "下列句子中没有语病的一项是？",
    "options": [
      "A. 通过这次学习，使我明白了团结的重要性",
      "B. 能否坚持到底，是取得成功的关键",
      "C. 我们要继承和发扬老一辈革命家的优良传统",
      "D. 为了防止不再发生类似事故，我们加强了管理"
    ],
    "answer_index": 2,
    "analysis": "A 缺主语（删\"通过\"或\"使\"）；B 两面对一面；D 否定不当，应删\"不再\"。"
  },
  {
    "id": "dg_math_05",
    "subject": "数学",
    "knowledge_point_id": "kp_math_trig",
    "knowledge_point": "三角函数求值",
    "difficulty": 3,
    "stem": "已知 sinα + cosα = 1/5，则 sinα·cosα = ?",
    "options": [
      "A. -12/25",
      "B. 12/25",
      "C. -6/25",
      "D. 6/25"
    ],
    "answer_index": 0,
    "analysis": "两边平方：1 + 2sinαcosα = 1/25，故 sinαcosα = -12/25。"
  },
  {
    "id": "dg_math_06",
    "subject": "数学",
    "knowledge_point_id": "kp_math_vector",
    "knowledge_point": "平面向量数量积",
    "difficulty": 3,
    "stem": "向量 a=(1,2)，b=(x,-4)，若 a//b，则 x = ?",
    "options": [
      "A. -2",
      "B. 2",
      "C. -8",
      "D. 8"
    ],
    "answer_index": 0,
    "analysis": "a//b => 1·(-4) - 2·x = 0 => x = -2。"
  },
  {
    "id": "dg_math_07",
    "subject": "数学",
    "knowledge_point_id": "kp_math_stereo",
    "knowledge_point": "立体几何体积",
    "difficulty": 4,
    "stem": "正方体 ABCD-A1B1C1D1 棱长为 2，则三棱锥 A1-BC1D 的体积为？",
    "options": [
      "A. 4/3",
      "B. 8/3",
      "C. 4",
      "D. 2"
    ],
    "answer_index": 0,
    "analysis": "用正方体体积减去四个等体积三棱锥，或直接计算得 4/3。"
  },
  {
    "id": "dg_math_08",
    "subject": "数学",
    "knowledge_point_id": "kp_math_complex",
    "knowledge_point": "复数运算",
    "difficulty": 3,
    "stem": "复数 z = (1+i)/(1-i)，则 |z| = ?",
    "options": [
      "A. 0",
      "B. 1",
      "C. √2",
      "D. 2"
    ],
    "answer_index": 1,
    "analysis": "z = (1+i)^2/2 = i，|z| = 1。"
  },
  {
    "id": "dg_eng_03",
    "subject": "英语",
    "knowledge_point_id": "kp_eng_reading",
    "knowledge_point": "阅读理解主旨题",
    "difficulty": 4,
    "stem": "\"The main idea of the passage is that ___.\" 这类题目考察的是？",
    "options": [
      "A. 细节理解能力",
      "B. 文章主旨概括能力",
      "C. 词汇猜测能力",
      "D. 推理判断能力"
    ],
    "answer_index": 1,
    "analysis": "主旨题（main idea / best title）考察对文章中心思想的概括能力。"
  },
  {
    "id": "dg_eng_04",
    "subject": "英语",
    "knowledge_point_id": "kp_eng_writing",
    "knowledge_point": "应用文写作",
    "difficulty": 3,
    "stem": "正式邮件开头最合适的称呼是？",
    "options": [
      "A. Hey buddy",
      "B. Dear Sir/Madam",
      "C. What's up",
      "D. Hi guys"
    ],
    "answer_index": 1,
    "analysis": "正式邮件用 Dear Sir/Madam 或 Dear + 姓名，其余均为非正式用语。"
  },
  {
    "id": "dg_phy_04",
    "subject": "物理",
    "knowledge_point_id": "kp_phy_optics",
    "knowledge_point": "光的折射定律",
    "difficulty": 4,
    "stem": "光从空气射入水中，入射角为 60°，折射角为 30°，则水的折射率为？",
    "options": [
      "A. √3/3",
      "B. √3",
      "C. 3",
      "D. 1/3"
    ],
    "answer_index": 1,
    "analysis": "n = sinθ1/sinθ2 = sin60°/sin30° = (√3/2)/(1/2) = √3。"
  },
  {
    "id": "dg_chem_04",
    "subject": "化学",
    "knowledge_point_id": "kp_chem_calculation",
    "knowledge_point": "化学计算综合",
    "difficulty": 4,
    "stem": "标准状况下，11.2L CO2 与 18g H2O 分子数之比为？",
    "options": [
      "A. 1:1",
      "B. 1:2",
      "C. 2:1",
      "D. 1:3"
    ],
    "answer_index": 0,
    "analysis": "n(CO2) = 11.2/22.4 = 0.5mol，n(H2O) = 18/18 = 1mol，分子数之比 = 0.5:1 = 1:2。"
  },
  {
    "id": "dg_bio_01",
    "subject": "生物",
    "knowledge_point_id": "kp_bio_cell",
    "knowledge_point": "细胞结构与功能",
    "difficulty": 3,
    "stem": "下列细胞器中，具有双层膜结构的是？",
    "options": [
      "A. 核糖体",
      "B. 线粒体",
      "C. 内质网",
      "D. 高尔基体"
    ],
    "answer_index": 1,
    "analysis": "线粒体和叶绿体为双层膜；核糖体无膜；内质网和高尔基体为单层膜。"
  },
  {
    "id": "dg_bio_02",
    "subject": "生物",
    "knowledge_point_id": "kp_bio_genetics",
    "knowledge_point": "遗传定律应用",
    "difficulty": 4,
    "stem": "一对夫妇均为 A 型血，生了一个 O 型血孩子，他们的基因型是？",
    "options": [
      "A. IAIA × IAIA",
      "B. IAi × IAi",
      "C. IAIA × IAIB",
      "D. IAi × IAIB"
    ],
    "answer_index": 1,
    "analysis": "A 型血基因型为 IAIA 或 IAi；要生出 ii（O 型）孩子，双方必须都是 IAi。"
  },
  {
    "id": "dg_bio_03",
    "subject": "生物",
    "knowledge_point_id": "kp_bio_ecology",
    "knowledge_point": "生态系统能量流动",
    "difficulty": 3,
    "stem": "生态系统中能量流动的特点是？",
    "options": [
      "A. 循环流动",
      "B. 单向流动、逐级递减",
      "C. 双向流动",
      "D. 逐级递增"
    ],
    "answer_index": 1,
    "analysis": "能量在生态系统中单向流动、逐级递减（每级约 10%-20% 传递效率）。"
  },
  {
    "id": "dg_pol_01",
    "subject": "政治",
    "knowledge_point_id": "kp_pol_economy",
    "knowledge_point": "市场经济原理",
    "difficulty": 3,
    "stem": "市场经济中，资源配置的基础性手段是？",
    "options": [
      "A. 计划",
      "B. 市场",
      "C. 行政命令",
      "D. 法律法规"
    ],
    "answer_index": 1,
    "analysis": "市场在资源配置中起决定性作用，计划经济以计划为基础。"
  },
  {
    "id": "dg_pol_02",
    "subject": "政治",
    "knowledge_point_id": "kp_pol_politics",
    "knowledge_point": "我国政治制度",
    "difficulty": 3,
    "stem": "我国的根本政治制度是？",
    "options": [
      "A. 人民代表大会制度",
      "B. 中国共产党领导的多党合作和政治协商制度",
      "C. 民族区域自治制度",
      "D. 基层群众自治制度"
    ],
    "answer_index": 0,
    "analysis": "人民代表大会制度是我国的根本政治制度，其余为基本政治制度。"
  },
  {
    "id": "dg_pol_03",
    "subject": "政治",
    "knowledge_point_id": "kp_pol_philosophy",
    "knowledge_point": "马哲基本原理",
    "difficulty": 4,
    "stem": "\"世界是物质的，物质是运动的，运动是有规律的\"体现的哲学原理是？",
    "options": [
      "A. 唯心主义",
      "B. 形而上学",
      "C. 辩证唯物主义",
      "D. 相对主义"
    ],
    "answer_index": 2,
    "analysis": "物质观+运动观+规律观，是辩证唯物主义的基本观点。"
  },
  {
    "id": "dg_his_01",
    "subject": "历史",
    "knowledge_point_id": "kp_his_modern",
    "knowledge_point": "中国近代史",
    "difficulty": 3,
    "stem": "标志着中国新民主主义革命开端的事件是？",
    "options": [
      "A. 辛亥革命",
      "B. 五四运动",
      "C. 中国共产党成立",
      "D. 北伐战争"
    ],
    "answer_index": 1,
    "analysis": "1919 年五四运动中工人阶级登上政治舞台，标志新民主主义革命开始。"
  },
  {
    "id": "dg_his_02",
    "subject": "历史",
    "knowledge_point_id": "kp_his_world",
    "knowledge_point": "世界史工业革命",
    "difficulty": 4,
    "stem": "第一次工业革命的标志性发明是？",
    "options": [
      "A. 发电机",
      "B. 蒸汽机",
      "C. 计算机",
      "D. 内燃机"
    ],
    "answer_index": 1,
    "analysis": "瓦特改良蒸汽机（1785 年）是第一次工业革命的核心标志，人类进入\"蒸汽时代\"。"
  },
  {
    "id": "dg_geo_01",
    "subject": "地理",
    "knowledge_point_id": "kp_geo_climate",
    "knowledge_point": "气候类型分布",
    "difficulty": 3,
    "stem": "我国南方地区主要的气候类型是？",
    "options": [
      "A. 温带季风气候",
      "B. 亚热带季风气候",
      "C. 温带大陆性气候",
      "D. 地中海气候"
    ],
    "answer_index": 1,
    "analysis": "我国秦岭-淮河以南为亚热带季风气候，以北为温带季风气候。"
  },
  {
    "id": "dg_geo_02",
    "subject": "地理",
    "knowledge_point_id": "kp_geo_geography",
    "knowledge_point": "地球运动",
    "difficulty": 4,
    "stem": "北半球夏至日，下列城市白昼最长的是？",
    "options": [
      "A. 广州",
      "B. 武汉",
      "C. 北京",
      "D. 哈尔滨"
    ],
    "answer_index": 3,
    "analysis": "夏至日北半球纬度越高白昼越长，哈尔滨纬度最高（约 45°N）。"
  }
];
