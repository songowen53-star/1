/**
 * 调整题库比例：语数外各 20 题（共 60，占 60%），物化生政史地 40 题
 * 物理 8、化学 8、生物 7、政治 5、历史 5、地理 5
 */
const fs = require('fs');
const path = require('path');

const BANK_PATH = path.join(__dirname, 'backend/data/diagnostic-bank.json');
const bank = JSON.parse(fs.readFileSync(BANK_PATH, 'utf8'));

// ============ 1) 删掉的非语数外题目（28 题） ============
const REMOVE_IDS = [
  // 物理 11 → 8（删 3）
  'dg_phy_09', 'dg_phy_10', 'dg_phy_11',
  // 化学 11 → 8（删 3）
  'dg_chem_09', 'dg_chem_10', 'dg_chem_11',
  // 生物 11 → 7（删 4）
  'dg_bio_08', 'dg_bio_09', 'dg_bio_10', 'dg_bio_11',
  // 政治 11 → 5（删 6）
  'dg_pol_05', 'dg_pol_07', 'dg_pol_08', 'dg_pol_09', 'dg_pol_10', 'dg_pol_11',
  // 历史 11 → 5（删 6）
  'dg_his_04', 'dg_his_06', 'dg_his_08', 'dg_his_09', 'dg_his_10', 'dg_his_11',
  // 地理 11 → 5（删 6）
  'dg_geo_04', 'dg_geo_06', 'dg_geo_07', 'dg_geo_08', 'dg_geo_09', 'dg_geo_11'
];

const before = bank.questions.length;
bank.questions = bank.questions.filter(q => !REMOVE_IDS.includes(q.id));
console.log(`✅ 删除 ${before - bank.questions.length} 道非语数外题`);

// ============ 2) 追加数学新题（12 → 20，补 8 题） ============
const NEW_MATH = [
  {
    id: 'dg_math_13', subject: '数学', knowledge_point_id: 'kp_math_func', knowledge_point: '函数定义域与值域',
    difficulty: 3,
    stem: '函数 f(x) = √(x-1) + 1/(x-2) 的定义域为？',
    options: ['A. [1, 2) ∪ (2, +∞)', 'B. (1, 2) ∪ (2, +∞)', 'C. [1, +∞)', 'D. (2, +∞)'],
    answer_index: 0,
    analysis: 'x-1 ≥ 0 ⇒ x ≥ 1；x-2 ≠ 0 ⇒ x ≠ 2。取交集得 [1,2)∪(2,+∞)。'
  },
  {
    id: 'dg_math_14', subject: '数学', knowledge_point_id: 'kp_math_inverse', knowledge_point: '反函数',
    difficulty: 3,
    stem: '函数 y = 2x+1 的反函数是？',
    options: ['A. y = (x-1)/2', 'B. y = (x+1)/2', 'C. y = 2x-1', 'D. y = (1-x)/2'],
    answer_index: 0,
    analysis: 'y = 2x+1 ⇒ x = (y-1)/2，交换 x、y 得反函数 y = (x-1)/2。'
  },
  {
    id: 'dg_math_15', subject: '数学', knowledge_point_id: 'kp_math_exp_log', knowledge_point: '指数与对数',
    difficulty: 3,
    stem: 'log_2 8 + log_3 (1/9) = ？',
    options: ['A. 1', 'B. 2', 'C. 3', 'D. -1'],
    answer_index: 0,
    analysis: 'log_2 8 = 3；log_3(1/9) = log_3 3^-2 = -2；3 + (-2) = 1。'
  },
  {
    id: 'dg_math_16', subject: '数学', knowledge_point_id: 'kp_math_trig', knowledge_point: '三角函数求值',
    difficulty: 3,
    stem: 'sin 30° + cos 60° + tan 45° = ？',
    options: ['A. 1', 'B. 1.5', 'C. 2', 'D. 2.5'],
    answer_index: 2,
    analysis: 'sin30° = 1/2，cos60° = 1/2，tan45° = 1，合计 1/2+1/2+1 = 2。'
  },
  {
    id: 'dg_math_17', subject: '数学', knowledge_point_id: 'kp_math_trig2', knowledge_point: '三角函数诱导公式',
    difficulty: 4,
    stem: '若 sin α = 3/5，α 为第二象限角，则 cos α 的值为？',
    options: ['A. 4/5', 'B. -4/5', 'C. 3/5', 'D. -3/5'],
    answer_index: 1,
    analysis: 'cos^2 α = 1 - sin^2 α = 16/25，α 在第二象限 cos α < 0，故 cos α = -4/5。'
  },
  {
    id: 'dg_math_18', subject: '数学', knowledge_point_id: 'kp_math_vector', knowledge_point: '平面向量数量积',
    difficulty: 3,
    stem: '向量 a = (1, 2)，b = (3, -1)，则 a · b = ？',
    options: ['A. 1', 'B. 3', 'C. -1', 'D. 5'],
    answer_index: 0,
    analysis: 'a·b = 1×3 + 2×(-1) = 3 - 2 = 1。'
  },
  {
    id: 'dg_math_19', subject: '数学', knowledge_point_id: 'kp_math_line', knowledge_point: '直线与圆',
    difficulty: 4,
    stem: '圆 x^2 + y^2 = 4 上到直线 x + y - 2 = 0 距离最近的点的坐标是？',
    options: ['A. (√2, √2)', 'B. (-√2, -√2)', 'C. (1, 1)', 'D. (2, 0)'],
    answer_index: 0,
    analysis: '圆心 (0,0) 在直线上的垂足为 (1,1)，最近点为圆心沿 (1,1) 方向推进半径 2 倍：(√2, √2)。'
  },
  {
    id: 'dg_math_20', subject: '数学', knowledge_point_id: 'kp_math_limit', knowledge_point: '极限与导数定义',
    difficulty: 4,
    stem: '设 f(x) = x^2，则 f\'(1) 的值为？',
    options: ['A. 1', 'B. 2', 'C. 3', 'D. 4'],
    answer_index: 1,
    analysis: 'f\'(x) = 2x，f\'(1) = 2；或用定义 f\'(1) = lim(h→0) [(1+h)^2 - 1]/h = lim(2+h) = 2。'
  }
];

// ============ 3) 追加语文新题（11 → 20，补 9 题） ============
const NEW_CN = [
  {
    id: 'dg_cn_12', subject: '语文', knowledge_point_id: 'kp_cn_poem3', knowledge_point: '古诗阅读·炼字',
    difficulty: 4,
    stem: '"红杏枝头春意闹"中，"闹"字的妙处在于？',
    options: ['A. 形容杏花多而杂乱', 'B. 以动写静，渲染春的生机', 'C. 直接点明春天喧闹', 'D. 表现诗人心情烦躁'],
    answer_index: 1,
    analysis: '"闹"是拟人化的动词，将无声的红杏写得富有动感，以动写静，渲染春意盎然、生机勃勃的氛围。'
  },
  {
    id: 'dg_cn_13', subject: '语文', knowledge_point_id: 'kp_cn_wenyan2', knowledge_point: '文言文实词',
    difficulty: 4,
    stem: '"沛公军霸上"中"军"的意思是？',
    options: ['A. 军队', 'B. 军营', 'C. 驻扎', 'D. 军用'],
    answer_index: 2,
    analysis: '"军"在这里是名词活用作动词，意为"驻扎（军队）"。'
  },
  {
    id: 'dg_cn_14', subject: '语文', knowledge_point_id: 'kp_cn_punct', knowledge_point: '标点符号',
    difficulty: 3,
    stem: '下列句子标点使用正确的一项是？',
    options: ['A. 他告诉我说：他身体很好', 'B. 参加活动的有：张三、李四、王五等五人', 'C. "这道题真难啊！"小明叹了口气说', 'D. 写作文要做到：观点明确，论据充分，结构清晰'],
    answer_index: 2,
    analysis: 'A 中"说"后面是间接引语不用冒号；B、D 中"有""做到"后不应用冒号（提示语后总括语）；C 正确。'
  },
  {
    id: 'dg_cn_15', subject: '语文', knowledge_point_id: 'kp_cn_fiction', knowledge_point: '小说阅读',
    difficulty: 4,
    stem: '《红楼梦》中林黛玉的性格特征最突出的是？',
    options: ['A. 豪放洒脱', 'B. 多愁善感、才情出众', 'C. 刚毅果敢', 'D. 活泼开朗'],
    answer_index: 1,
    analysis: '林黛玉才情出众、聪慧敏感，多愁善感是其最鲜明的性格标签，与封建大家族格格不入。'
  },
  {
    id: 'dg_cn_16', subject: '语文', knowledge_point_id: 'kp_cn_argument', knowledge_point: '议论文阅读',
    difficulty: 4,
    stem: '议论文中"破立结合"的"破"指的是？',
    options: ['A. 破坏文章结构', 'B. 批驳错误观点', 'C. 破坏论据', 'D. 打破论点顺序'],
    answer_index: 1,
    analysis: '"破立结合"是议论文论证方法："破"即批驳错误观点，"立"即树立正确观点，二者结合增强说服力。'
  },
  {
    id: 'dg_cn_17', subject: '语文', knowledge_point_id: 'kp_cn_ancient', knowledge_point: '古代文化常识',
    difficulty: 3,
    stem: '"四书"不包括下列哪一部？',
    options: ['A. 《大学》', 'B. 《中庸》', 'C. 《论语》', 'D. 《诗经》'],
    answer_index: 3,
    analysis: '四书：《大学》《中庸》《论语》《孟子》。《诗经》是"五经"之一，不属于四书。'
  },
  {
    id: 'dg_cn_18', subject: '语文', knowledge_point_id: 'kp_cn_poem4', knowledge_point: '词的鉴赏',
    difficulty: 4,
    stem: '"寻寻觅觅，冷冷清清，凄凄惨惨戚戚"出自哪位词人之手？',
    options: ['A. 苏轼', 'B. 李清照', 'C. 辛弃疾', 'D. 柳永'],
    answer_index: 1,
    analysis: '此句出自李清照《声声慢·寻寻觅觅》，开篇连下七组叠词，创词史叠词之先河。'
  },
  {
    id: 'dg_cn_19', subject: '语文', knowledge_point_id: 'kp_cn_translation', knowledge_point: '文言文翻译',
    difficulty: 4,
    stem: '"师者，所以传道受业解惑也"中"受"字通假哪个字？',
    options: ['A. 授', 'B. 收', 'C. 守', 'D. 首'],
    answer_index: 0,
    analysis: '"受"通"授"，意为"教授"。这是古文常见的同音通假现象。'
  },
  {
    id: 'dg_cn_20', subject: '语文', knowledge_point_id: 'kp_cn_compose', knowledge_point: '写作·立意',
    difficulty: 3,
    stem: '写议论文时，"立意深刻"主要是指？',
    options: ['A. 文章写得很长', 'B. 观点独到，有思想深度', 'C. 用词华丽', 'D. 举很多例子'],
    answer_index: 1,
    analysis: '"立意"即确立文章的中心论点，"深刻"指观点有思想深度、认识独到不停留在表面。'
  }
];

// ============ 4) 追加英语新题（11 → 20，补 9 题） ============
const NEW_ENG = [
  {
    id: 'dg_eng_12', subject: '英语', knowledge_point_id: 'kp_eng_grammar_clause', knowledge_point: '名词性从句',
    difficulty: 4,
    stem: '______ he will come or not is still unknown.',
    options: ['A. If', 'B. Whether', 'C. What', 'D. That'],
    answer_index: 1,
    analysis: '引导主语从句且与 or not 搭配时，只能用 Whether，不能用 If。'
  },
  {
    id: 'dg_eng_13', subject: '英语', knowledge_point_id: 'kp_eng_grammar_modal', knowledge_point: '情态动词',
    difficulty: 3,
    stem: 'You ______ be careful when crossing the street.',
    options: ['A. can', 'B. may', 'C. must', 'D. might'],
    answer_index: 2,
    analysis: 'must 表示"必须"，语气强烈，适合告诫类语境；can/may/might 表可能性或许可，语气不符。'
  },
  {
    id: 'dg_eng_14', subject: '英语', knowledge_point_id: 'kp_eng_grammar_passive', knowledge_point: '被动语态',
    difficulty: 3,
    stem: 'The book ______ by millions of people since it was published.',
    options: ['A. has read', 'B. has been read', 'C. had read', 'D. was reading'],
    answer_index: 1,
    analysis: '书是"被读"，用被动语态；since 引导的时间状语从句与现在完成时连用。'
  },
  {
    id: 'dg_eng_15', subject: '英语', knowledge_point_id: 'kp_eng_grammar_compare', knowledge_point: '形容词副词比较级',
    difficulty: 3,
    stem: 'This book is ______ than that one.',
    options: ['A. interesting', 'B. more interesting', 'C. most interesting', 'D. the most interesting'],
    answer_index: 1,
    analysis: 'than 是比较级的标志词；interesting 是多音节形容词，比较级用 more + adj 形式。'
  },
  {
    id: 'dg_eng_16', subject: '英语', knowledge_point_id: 'kp_eng_vocab_phrase', knowledge_point: '动词短语辨析',
    difficulty: 4,
    stem: 'The firemen arrived and ______ the fire quickly.',
    options: ['A. put out', 'B. put off', 'C. put up', 'D. put away'],
    answer_index: 0,
    analysis: 'put out 意为"扑灭（火）"；put off "推迟"；put up "举起/张贴/留宿"；put away "收好"。'
  },
  {
    id: 'dg_eng_17', subject: '英语', knowledge_point_id: 'kp_eng_reading_detail', knowledge_point: '阅读理解·细节题',
    difficulty: 3,
    stem: 'A text mentions "The meeting starts at 9:00 a.m. on Friday." The meeting time is？',
    options: ['A. Friday 9:00 p.m.', 'B. Friday 9:00 a.m.', 'C. Thursday 9:00 a.m.', 'D. Monday 9:00 a.m.'],
    answer_index: 1,
    analysis: '细节题直接定位原文即可：星期五上午 9 点。'
  },
  {
    id: 'dg_eng_18', subject: '英语', knowledge_point_id: 'kp_eng_writing_letter', knowledge_point: '应用文·书信',
    difficulty: 3,
    stem: 'In a formal business letter, the correct closing is？',
    options: ['A. Love,', 'B. Cheers,', 'C. Sincerely,', 'D. Bye bye,'],
    answer_index: 2,
    analysis: '正式商务书信结尾常用 Sincerely / Yours sincerely；Love、Cheers 用于非正式场合。'
  },
  {
    id: 'dg_eng_19', subject: '英语', knowledge_point_id: 'kp_eng_grammar_inversion', knowledge_point: '倒装句',
    difficulty: 4,
    stem: 'Never ______ such a beautiful sunset.',
    options: ['A. I have seen', 'B. have I seen', 'C. I saw', 'D. did I saw'],
    answer_index: 1,
    analysis: '否定词 Never 置于句首引起部分倒装，助动词 have 提前，过去分词 seen 保留。'
  },
  {
    id: 'dg_eng_20', subject: '英语', knowledge_point_id: 'kp_eng_clause_adv', knowledge_point: '状语从句',
    difficulty: 4,
    stem: 'I will go to the library ______ it rains tomorrow.',
    options: ['A. if', 'B. unless', 'C. because', 'D. although'],
    answer_index: 1,
    analysis: 'unless 意为"除非、如果不"，句意为"明天除非下雨，否则我要去图书馆"；if 逻辑与 will 冲突。'
  }
];

// ============ 5) 合并写入 ============
const existingIds = new Set(bank.questions.map(q => q.id));
const allNew = [...NEW_MATH, ...NEW_CN, ...NEW_ENG];
const dupes = allNew.filter(q => existingIds.has(q.id));
if (dupes.length) { console.error('❌ 重复 ID:', dupes.map(q=>q.id)); process.exit(1); }

bank.questions.push(...allNew);
bank.total = bank.questions.length;
bank.updated_at = new Date().toISOString().slice(0,10);

fs.writeFileSync(BANK_PATH, JSON.stringify(bank, null, 2) + '\n', 'utf8');

// ============ 6) 打印结果 ============
const sc = {};
bank.questions.forEach(q => { sc[q.subject] = (sc[q.subject]||0)+1; });
console.log('\n📊 调整后学科分布（总数', bank.questions.length, '）:');
['数学','语文','英语','物理','化学','生物','政治','历史','地理'].forEach(s => {
  const c = sc[s] || 0;
  const pct = (c/bank.questions.length*100).toFixed(1);
  const bar = '█'.repeat(Math.round(c/5));
  console.log(`  ${s.padEnd(4)}: ${String(c).padStart(2)} 题 (${pct}%) ${bar}`);
});
console.log('\n🎯 语数外合计:', (sc.数学+sc.语文+sc.英语), '题 /', bank.questions.length, '=',
  ((sc.数学+sc.语文+sc.英语)/bank.questions.length*100).toFixed(1) + '%');
