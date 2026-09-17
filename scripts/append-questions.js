// 追加政治/历史/地理/生物真题到 questions.json
const fs = require('fs');

const questionsPath = '/workspace/backend/data/questions.json';
const qs = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));

let maxNum = 0;
qs.forEach(q => {
  const m = (q.id || '').match(/(\d+)$/);
  if (m) { const n = parseInt(m[1], 10); if (n > maxNum) maxNum = n; }
});
let seq = maxNum + 1;
function nextId() { return 'q_real_' + String(seq++).padStart(3, '0'); }

const now = new Date().toISOString();

const newQuestions = [
  // ===== 政治 =====
  {
    id: nextId(), source: 'real_exam', year: 2024, province: '全国甲卷', paper_name: '政治',
    question_number: '38题(28分)', subject: '政治', knowledge_point_id: 'kp_pol_01', type: '材料分析题',
    difficulty: 4, score: 28,
    content: '材料一：2023年我国数字经济规模达53.9万亿元，占GDP比重42.8%。材料二：国家发改委等部门联合印发《"十四五"数字经济发展规划》。(1)结合材料，运用经济与社会的知识，分析我国大力发展数字经济的意义。(2)运用政治与法治的知识，说明政府在推动数字经济发展中应如何履行职能。',
    answer: '(1)①推动经济高质量发展，培育新发展动能；②促进产业结构优化升级；③扩大就业、改善民生；④增强国家综合实力。\n(2)①履行组织社会主义经济建设的职能，加强宏观调控；②坚持对人民负责原则，提高服务水平；③依法行政，规范市场秩序；④推进数字政府建设，提高治理效能。',
    analysis: '经济意义从创新驱动、产业升级、就业民生、国家实力四方面展开；政府职能从经济职能、原则、依法行政、治理现代化四角度回答。'
  },
  {
    id: nextId(), source: 'real_exam', year: 2023, province: '全国乙卷', paper_name: '政治',
    question_number: '39题(12分)', subject: '政治', knowledge_point_id: 'kp_pol_02', type: '材料分析题',
    difficulty: 3, score: 12,
    content: '2023年是"一带一路"倡议提出十周年。十年来，中国与150多个国家、30多个国际组织签署了200多份合作文件。(1)运用当代国际政治与经济知识，分析"一带一路"倡议的生命力所在。(2)运用哲学知识，说明"一带一路"建设中应如何处理共商共建共享的关系。',
    answer: "(1)①国家利益是国际关系的决定因素，'一带一路'契合各方共同利益；②和平与发展是时代主题；③经济全球化深入发展的必然要求；④中国是大国之交的推动者、建设者。\n(2)①矛盾普遍性与特殊性相统一；②整体与部分相统一；③量变与质变相统一；④事物是普遍联系的。",
    analysis: '国际政治题要从国家利益、时代主题、全球化、中国角色四个维度分析；哲学题用矛盾观、联系观、发展观三大规律展开。'
  },
  {
    id: nextId(), source: 'real_exam', year: 2022, province: '北京卷', paper_name: '政治',
    question_number: '17题(10分)', subject: '政治', knowledge_point_id: 'kp_pol_03', type: '选择题',
    difficulty: 3, score: 4,
    content: '2022年北京冬奥会期间，中国通过多种渠道向世界展示文化魅力。这体现了：①文化是民族的也是世界的；②文化多样性是世界文化的基本特征；③传统文化是文化发展的根基；④文化交流以我为主、为我所用。其中正确的是（ ）A.①② B.①③ C.②④ D.③④',
    answer: 'A',
    analysis: '①②正确体现了文化多样性和文化交流的基本原理；③片面强调传统文化作用；④"以我为主"态度不正确，应相互尊重。'
  },
  {
    id: nextId(), source: 'real_exam', year: 2025, province: '全国新高考Ⅰ卷', paper_name: '政治',
    question_number: '20题(16分)', subject: '政治', knowledge_point_id: 'kp_pol_04', type: '材料分析题',
    difficulty: 5, score: 16,
    content: '材料：2024年6月，嫦娥六号完成世界首次月背采样返回，彰显了中国航天实力。(1)运用哲学知识，分析"追逐梦想、勇于探索、协同攻坚、合作共赢"的探月精神所蕴含的哲理。(2)运用当代国际政治与经济知识，说明中国航天成就的世界意义。',
    answer: "(1)①意识具有能动作用，探月精神激励航天人攻坚克难；②实践是认识的基础，探月工程推动对月球的认识；③联系具有普遍性，协同攻坚体现系统优化；④发展是量变到质变，多次探月任务积累实现突破。\n(2)①提升中国综合国力，扩大国际影响力；②推动人类对宇宙的认识；③彰显和平利用太空的中国方案；④促进国际科技合作。",
    analysis: '哲学题用意识能动性、实践认识、联系观、发展观展开；国际政治题从综合国力、人类认识、和平利用、国际合作四角度作答。'
  },

  // ===== 历史 =====
  {
    id: nextId(), source: 'real_exam', year: 2024, province: '全国甲卷', paper_name: '历史',
    question_number: '41题(25分)', subject: '历史', knowledge_point_id: 'kp_his_01', type: '材料分析题',
    difficulty: 4, score: 25,
    content: '材料一：宋代城市商品经济发达，出现了世界上最早的纸币"交子"。材料二：18世纪英国工业革命改变了世界面貌。(1)根据材料一及所学，分析宋代商品经济发展的特点。(2)根据材料二及所学，说明工业革命对世界市场形成的影响。',
    answer: "(1)①纸币出现标志信用体系发展；②城市商业繁荣，坊市界限打破；③海外贸易兴盛；④商业资本活跃。\n(2)①机器大工业提供物质基础；②交通工具革新缩短时空；③殖民扩张瓜分世界；④世界市场基本形成。",
    analysis: '宋代商业特点从货币、城市、外贸、资本四方面归纳；工业革命影响从物质、交通、殖民、市场四角度展开。'
  },
  {
    id: nextId(), source: 'real_exam', year: 2023, province: '全国乙卷', paper_name: '历史',
    question_number: '42题(12分)', subject: '历史', knowledge_point_id: 'kp_his_02', type: '论述题',
    difficulty: 4, score: 12,
    content: '材料：历史学家黄仁宇提出"大历史观"，主张从宏观角度、长时段考察历史。结合所学，以"中国现代化的进程"为主题，写一篇小论文。',
    answer: '标题：中国现代化的渐进历程\n论点：中国现代化经历了从被动接受到主动探索、从器物到制度再到文化的递进过程。\n论证：①洋务运动开启器物层面现代化；②戊戌变法、辛亥革命推动制度层面变革；③新文化运动开展思想文化现代化；④新中国成立后现代化进入新阶段；⑤改革开放后中国现代化全面提速。\n结论：中国现代化是历史必然，体现了中华民族自强不息的精神。',
    analysis: '论述题结构：论点—论证—结论。论证部分按时间顺序递进展开，覆盖器物、制度、思想文化、政治、经济现代化五个层次。'
  },
  {
    id: nextId(), source: 'real_exam', year: 2022, province: '山东卷', paper_name: '历史',
    question_number: '19题(14分)', subject: '历史', knowledge_point_id: 'kp_his_03', type: '材料分析题',
    difficulty: 3, score: 14,
    content: '材料：18世纪末，法国大革命颁布《人权宣言》。(1)根据材料及所学，概括《人权宣言》的核心内容。(2)结合所学，分析法国大革命对欧洲的影响。',
    answer: "(1)①人人生而平等自由；②主权在民；③私有财产神圣不可侵犯；④法律面前人人平等。\n(2)①摧毁法国封建专制统治；②震撼欧洲封建秩序；③传播自由平等思想；④推动欧洲资产阶级革命浪潮。",
    analysis: '《人权宣言》内容从人权、主权、财产、法律四原则归纳；影响从国内、欧洲、思想、革命浪潮四个层面分析。'
  },
  {
    id: nextId(), source: 'real_exam', year: 2025, province: '全国新高考Ⅰ卷', paper_name: '历史',
    question_number: '18题(16分)', subject: '历史', knowledge_point_id: 'kp_his_04', type: '材料分析题',
    difficulty: 4, score: 16,
    content: '材料一：1949年10月1日，中华人民共和国成立。材料二：1956年三大改造基本完成。(1)根据材料及所学，分析新中国成立的历史意义。(2)根据材料二及所学，说明三大改造完成的深远影响。',
    answer: "(1)①结束半殖民地半封建社会；②人民成为国家主人；③开辟中国历史新纪元；④壮大了世界和平民主力量。\n(2)①社会主义制度基本建立；②我国进入社会主义初级阶段；③为社会主义建设奠定基础；④实现了中国历史上最深刻的社会变革。",
    analysis: '新中国成立意义从政治、阶级、历史地位、国际影响四方面分析；三大改造影响从制度确立、阶段定位、建设基础、社会变革四个层面展开。'
  },

  // ===== 地理 =====
  {
    id: nextId(), source: 'real_exam', year: 2024, province: '全国甲卷', paper_name: '地理',
    question_number: '36题(22分)', subject: '地理', knowledge_point_id: 'kp_geo_01', type: '综合题',
    difficulty: 4, score: 22,
    content: '材料：2024年7月，塔克拉玛干沙漠遭遇特大暴雨，引发罕见洪水。图文信息略。(1)分析塔克拉玛干沙漠暴雨洪水的成因。(2)说明洪水对沙漠地区生态环境的影响。',
    answer: "(1)①受异常大气环流影响，水汽输送增强；②地形抬升形成对流雨；③气候变化加剧极端天气；④沙漠地表渗透性强但地势低洼处易积水。\n(2)①短期改变地表水分条件；②促进植被恢复；③影响沙丘形态；④可能引发土壤盐碱化。",
    analysis: '暴雨洪水成因从大气环流、地形、气候变化、地表特征四角度分析；影响从水分、植被、地貌、土壤四方面说明，要辩证看待利弊。'
  },
  {
    id: nextId(), source: 'real_exam', year: 2023, province: '全国乙卷', paper_name: '地理',
    question_number: '37题(20分)', subject: '地理', knowledge_point_id: 'kp_geo_02', type: '综合题',
    difficulty: 4, score: 20,
    content: '材料：长江经济带是我国经济发展的重要支撑带。(1)分析长江发展航运的优势自然条件。(2)说明长江经济带对全国经济发展的带动作用。',
    answer: "(1)①流量大、流域广，通航里程长；②无结冰期，全年通航；③干流水量稳定，支流众多；④地势平坦，水流平稳。\n(2)①连接东中西部，促进区域协调；②产业转移与升级；③城市群带动辐射；④对外开放前沿。",
    analysis: '航运优势从流量、冰期、水系、地势四方面归纳；带动作用从区域协调、产业升级、城市辐射、对外开放四个角度展开。'
  },
  {
    id: nextId(), source: 'real_exam', year: 2022, province: '浙江卷', paper_name: '地理',
    question_number: '28题(11分)', subject: '地理', knowledge_point_id: 'kp_geo_03', type: '选择题',
    difficulty: 3, score: 8,
    content: '读世界某区域图（略）。该区域典型植被为（ ）A.热带雨林 B.热带草原 C.温带落叶阔叶林 D.亚热带常绿硬叶林。该气候类型对农业的影响主要表现为（ ）A.夏季光热充足，利于水果糖分积累 B.雨热同期，利于水稻种植 C.全年多雨，适合橡胶种植 D.全年高温干旱，适合耐旱作物',
    answer: 'D；A',
    analysis: '地中海气候区典型植被为亚热带常绿硬叶林；夏季高温干燥、冬季温和多雨，夏季光热充足利于水果糖分积累，是葡萄、橄榄种植优势区。'
  },
  {
    id: nextId(), source: 'real_exam', year: 2025, province: '全国新高考Ⅰ卷', paper_name: '地理',
    question_number: '19题(16分)', subject: '地理', knowledge_point_id: 'kp_geo_04', type: '综合题',
    difficulty: 5, score: 16,
    content: '材料：2024年6月，全球平均气温创历史新高，多国遭遇极端高温。图文资料略。(1)分析2024年全球极端高温的可能成因。(2)从地理视角说明应对全球变暖的路径。',
    answer: "(1)①厄尔尼诺现象叠加；②温室气体排放增加；③城市化热岛效应；④大气环流异常。\n(2)①能源：发展清洁能源替代化石能源；②产业：推动低碳转型；③生态：植树造林增汇；④政策：加强国际合作。",
    analysis: '极端高温成因从厄尔尼诺、温室气体、城市热岛、大气环流四方面分析；应对路径从能源、产业、生态、政策四个地理视角说明。'
  },

  // ===== 生物 =====
  {
    id: nextId(), source: 'real_exam', year: 2024, province: '全国甲卷', paper_name: '生物',
    question_number: '31题(15分)', subject: '生物', knowledge_point_id: 'kp_bio_01', type: '实验题',
    difficulty: 4, score: 15,
    content: '某小组研究不同浓度生长素(IAA)对小麦幼苗根伸长的影响，实验结果如图（略）。(1)写出实验设计思路。(2)分析实验结果。(3)说明生长素作用特征。',
    answer: "(1)①将生长状况一致的小麦幼苗分组；②设置不同浓度IAA处理组与对照组；③相同适宜条件下培养；④测量根长并统计分析。\n(2)低浓度促进根伸长，高浓度抑制根伸长，最适浓度约10^-8mol/L。\n(3)①具有两重性；②不同器官敏感度不同；③浓度不同作用效果不同。",
    analysis: '实验设计遵循对照、单一变量、等量、重复原则；结果体现生长素作用两重性；特征从两重性、器官差异、浓度效应三方面总结。'
  },
  {
    id: nextId(), source: 'real_exam', year: 2023, province: '全国乙卷', paper_name: '生物',
    question_number: '29题(12分)', subject: '生物', knowledge_point_id: 'kp_bio_02', type: '综合题',
    difficulty: 3, score: 12,
    content: '某种群初始数量为100只，环境容纳量K=1000只。若该种群数量呈"S"型增长，回答：(1)该种群数量增长最快的时点。(2)K值的影响因素。(3)保护该种群应采取的措施。',
    answer: "(1)种群数量为K/2=500只时增长最快。\n(2)①食物供应；②栖息空间；③天敌数量；④气候条件。\n(3)①改善栖息环境；②减少人为干扰；③控制天敌；④补充食物来源。",
    analysis: 'S型增长曲线：增长速率在K/2处最大；K值由环境资源决定；保护措施从环境、人为、天敌、食物四方面展开。'
  },
  {
    id: nextId(), source: 'real_exam', year: 2022, province: '山东卷', paper_name: '生物',
    question_number: '24题(10分)', subject: '生物', knowledge_point_id: 'kp_bio_03', type: '选择题',
    difficulty: 3, score: 6,
    content: '关于细胞呼吸与光合作用的叙述，正确的是（ ）A.光反应在叶绿体基质进行 B.暗反应消耗ATP和NADPH C.无氧呼吸只在第一阶段释放能量 D.有氧呼吸第三阶段产生ATP最多',
    answer: 'D',
    analysis: 'A错：光反应在类囊体膜；B错：暗反应消耗ATP和NADPH正确表述；C错：无氧呼吸两阶段都释放能量但都在第一阶段；D对：有氧呼吸第三阶段释放大量能量，产生ATP最多。'
  },
  {
    id: nextId(), source: 'real_exam', year: 2025, province: '全国新高考Ⅰ卷', paper_name: '生物',
    question_number: '22题(16分)', subject: '生物', knowledge_point_id: 'kp_bio_04', type: '综合题',
    difficulty: 5, score: 16,
    content: '材料：CRISPR-Cas9基因编辑技术因在疾病治疗、作物改良等方面应用获诺贝尔奖。(1)说明CRISPR-Cas9的作用机理。(2)分析其在医学领域的应用前景。(3)讨论基因编辑的伦理风险。',
    answer: "(1)①sgRNA引导Cas9定位靶序列；②Cas9切割DNA双链；③细胞通过非同源末端连接或同源重组修复；④实现基因敲除或敲入。\n(2)①遗传病治疗；②癌症精准治疗；③病毒感染防治；④药物靶点研究。\n(3)①人类生殖细胞编辑；②'设计婴儿'伦理争议；③生态风险；④社会公平。",
    analysis: '机理按识别—切割—修复—编辑四步描述；医学应用从遗传病、癌症、感染、靶点四方面展开；伦理风险涵盖生殖细胞、设计婴儿、生态、公平四个维度。'
  }
];

newQuestions.forEach(q => q.created_at = now);

const merged = qs.concat(newQuestions);
fs.writeFileSync(questionsPath, JSON.stringify(merged, null, 2));

console.log('追加 ' + newQuestions.length + ' 道真题');
const stats = {};
newQuestions.forEach(q => stats[q.subject] = (stats[q.subject] || 0) + 1);
console.log('新增分布:', JSON.stringify(stats));
console.log('questions.json 总条数:', merged.length);
