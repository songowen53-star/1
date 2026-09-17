const fs = require('fs');
const path = require('path');
process.chdir(path.join(__dirname, 'prototype'));

// =========================
// Mock DOM / Browser Env
// =========================
global.window = global;
global.addEventListener = () => {};
global.window.addEventListener = () => {};
global.history = { pushState:()=>{}, replaceState:()=>{} };
global.CustomEvent = function(){};
global.speechSynthesis = { onvoiceschanged:null, getVoices:()=>[], speak:()=>{}, cancel:()=>{} };
global.SpeechSynthesisUtterance = function(){};
global.navigator = { userAgent: 'node' };
global.localStorage = { getItem:()=>null, setItem:()=>{}, removeItem:()=>{} };
global.sessionStorage = { getItem:()=>null, setItem:()=>{} };
global.setTimeout = (fn, delay) => { try { fn(); } catch(e){} };
global.setInterval = () => {};

global.document = {
  getElementById: (id) => {
    global.__elById = global.__elById || {};
    if (!global.__elById[id]) global.__elById[id] = makeMockEl(id);
    return global.__elById[id];
  },
  querySelectorAll: (sel) => {
    // 仅在有 page content 时才查找（简单匹配）
    const all = Object.values(global.__elById || {});
    const matched = [];
    for (const el of all) {
      const h = el.innerHTML || '';
      if (sel === '.vip-plan-card') {
        // 直接匹配 class="vip-plan-card"
        const parts = h.split('class="vip-plan-card');
        for (let i=1;i<parts.length;i++) matched.push(makeMockEl());
      }
      if (sel === '.pg-num') {
        const parts = h.split('class="pg-num');
        for (let i=1;i<parts.length;i++) matched.push(makeMockEl());
      }
      if (sel === '[data-banner-row]') {
        const parts = h.split('data-banner-row');
        for (let i=1;i<parts.length;i++) matched.push(makeMockEl());
      }
    }
    return matched;
  },
  querySelector: () => null,
  createElement: (tag) => makeMockEl(null, tag),
  body: makeMockEl(),
  addEventListener: () => {},
  location: { hash: '' },
};

function makeMockEl(id, tag) {
  const el = {
    id: id || '',
    tagName: (tag || 'div').toUpperCase(),
    innerHTML: '',
    textContent: '',
    value: '',
    children: [],
    style: {},
    classList: { add:()=>{}, remove:()=>{}, contains:()=>false },
    __attr: {},
    scrollTop: 0,
    setAttribute(k,v){ el.__attr[k]=v; },
    getAttribute(k){ return el.__attr[k]; },
    closest(sel) {
      if (sel === 'tr') {
        // 构造一个行 mock，返回行 children 状态为第1,2,...child
        const row = makeMockEl();
        row.children = [
          {textContent:'李雷'},
          {textContent:'13800000001'},
          {textContent:'高三(1)班'},
          makeMockEl(), // role
          {innerHTML:'<span>正常</span>'}, // status
          makeMockEl()  // action
        ];
        return row;
      }
      return makeMockEl();
    },
    appendChild(c) { el.children.push(c); c.__parent = el; return c; },
    querySelector(s) { return null; },
    querySelectorAll(s) { return []; },
    addEventListener() {},
    dispatchEvent() {},
    remove() {
      if (el.__parent) el.__parent.children = el.__parent.children.filter(x => x !== el);
      if (el.id && global.__elById && global.__elById[el.id] === el) delete global.__elById[el.id];
    }
  };
  return el;
}

function decodeHtmlEntities(str) {
  return str.replace(/&amp;quot;/g, '"').replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

function runOnclickCode(code) {
  const fn = new Function('openModal','showToast','navigateTo','window','document', decodeHtmlEntities(code));
  const openModal = (t,h) => { global.__lastModal = {title:t, html:h}; global.__modalCount = (global.__modalCount||0)+1; };
  fn(openModal,
     (t)=>{ global.__lastToast=t; },
     (k)=>{ global.__lastNav=k; },
     global,
     global.document);
}

function flushPromises() { return new Promise(r => setImmediate(r)); }

// =========================
// Mock API data
// =========================
const genStudents = n => Array.from({length:n}, (_,i)=>({
  id: 1001+i, name: ['李雷','韩梅梅','王芳','张伟','刘洋','陈静','赵磊','黄丽','周宇','吴涛'][i%10],
  phone: '138'+(10000000+i), grade: '高三('+((i%12)+1)+')班', role: ['学生','家长','老师'][i%3],
  status: i%4===0 ? '禁用' : '正常',
  vip: i%3===0 ? 'VIP会员' : (i%3===1 ? '基础' : '试用'),
  expire: '2026-12-31', register: '2025-08-01', last: '2026-08-08', score: 520+i
}));
const genMembers = n => Array.from({length:n}, (_,i)=>({
  id:2001+i, name:['年度会员','半年会员','季度会员','月卡'][i%4], price:[998,598,298,68][i%4],
  users:1200+i*10, income:i%4===0?1280000:(i%4===1?680000:(i%4===2?320000:98000))
}));
const genExamRecords = n => Array.from({length:n}, (_,i)=>({
  id: 3001+i, year: ['2024','2023','2022','2021'][i%4], province: ['北京','上海','广东','江苏'][i%4],
  subject: ['数学','语文','英语','物理','化学','生物'][i%6], no: (i%20)+1,
  type: ['选择','填空','解答'][i%3], difficulty: i%3===0?'困难':(i%3===1?'中等':'简单'),
  uploader:'管理员'+((i%5)+1), time:'2025-0'+((i%9)+1)+'-15',
  ocr: i%5===0?'待审核':(i%5===1?'已通过':'已入库'),
  used: 100 + i*7, correct: .65 + (i%3)/10,
}));

global.api = {
  getPageData: (k) => Promise.resolve({
    // score*
    rank_subjects: [{name:'语文',rank:850,color:'#3B82F6'},{name:'数学',rank:620,color:'#EF4444'}],
    total_students: 5000,
    target_college:{name:'厦门大学', score_year:'2025', score_line:612, gap:32, progress:52},
    competition:{range:'570~580',total:1283,tags:[{text:'一本线附近',color:'blue'},{text:'冲211热门',color:'purple'},{text:'理综拉高段',color:'green'}]},
    advice:{title:'冲刺建议',content:'重点突破数学和物理'},
    trend_chart_label:'成绩趋势',
    radar_chart_label:'各科雷达',
    compare_chart_label:'对比图',
    distribution_chart_label:'分数段分布',
    bar_chart_label:'提分空间',
    subjects: [{name:'语文',score:110,pass_rate:.9},{name:'数学',score:135,pass_rate:.7},{name:'英语',score:120,pass_rate:.85},{name:'物理',score:88,pass_rate:.75},{name:'化学',score:82,pass_rate:.8},{name:'生物',score:85,pass_rate:.82}],
    exams: [{name:'9月月考',score:580},{name:'10月月考',score:595},{name:'11月模考',score:588},{name:'12月模考',score:610},{name:'1月模考',score:605}],
    province:'某省',category:'理科',confidence:92,
    basis:['近3次月考与模考成绩','年级排名趋势与波动','全省联考参考数据','学科知识点掌握图谱','目标院校近5年录取线'],
    tiers:[{name:'985高校',percent:35,color:'#EF4444',desc:'有差距但可冲'},{name:'211高校',percent:78,color:'#F59E0B',desc:'稳妥区间'}],
    history:[{year:'2024',rank:'12500',college:'重庆大学'},{year:'2023',rank:'13100',college:'西南大学'},{year:'2022',rank:'11800',college:'湖南大学'}],
    predicted_score:590,
    improvements:[{name:'数学',gap:25,color:'#EF4444'},{name:'物理',gap:18,color:'#F59E0B'},{name:'化学',gap:12,color:'#3B82F6'},{name:'语文',gap:5,color:'#10B981'}],
    trend_data: {labels:['9月','10月','11月','12月','1月'], values:[580,595,588,610,605]},
    rank_trend:{labels:['9月','10月','11月','12月','1月'], values:[820,750,680,620,640]},
    distribution:{labels:['<400','400-500','500-550','550-600','600-650','650+'], values:[520,1250,2100,3400,2800,1500]},
    radar_data:{labels:['语文','数学','英语','物理','化学','生物'], values:[88,92,85,78,82,86]},
    bar_data:{labels:['数学','物理','化学','语文','英语','生物'], values:[25,18,12,8,10,15]},

    // college*
    interests: [
      {name:'计算机科学',req:'物理+化学',career:'互联网、人工智能、软件开发',stars:5,selected:true,color:'#3B82F6'},
      {name:'电子信息工程',req:'物理+化学',career:'通信、芯片、嵌入式',stars:4,selected:false,color:'#8B5CF6'},
      {name:'临床医学',req:'物理+化学+生物',career:'医院、科研',stars:5,selected:false,color:'#EF4444'},
      {name:'金融学',req:'不限',career:'银行、证券、投资',stars:4,selected:true,color:'#F59E0B'},
      {name:'机械工程',req:'物理',career:'制造业、汽车、机器人',stars:4,selected:false,color:'#10B981'},
      {name:'法学',req:'不限',career:'律师、法院、检察院',stars:4,selected:false,color:'#6366F1'}
    ],
    rank_table:[
      {year:'2024',rank:'12500',score:590,diff:35,college1:'重庆大学',college2:'西南大学',college3:'湖南大学'},
      {year:'2023',rank:'13100',score:585,diff:32,college1:'四川大学',college2:'重庆大学',college3:'西南交通'},
      {year:'2022',rank:'11800',score:595,diff:38,college1:'华南理工',college2:'重庆大学',college3:'湖南大学'}
    ],
    admission_table:[
      {year:'2024',rank:'12500',college:'重庆大学',major:'机械工程',score:588,type:'稳'},
      {year:'2023',rank:'13100',college:'西南大学',major:'计算机科学',score:583,type:'稳'},
      {year:'2022',rank:'11800',college:'湖南大学',major:'电子信息',score:592,type:'冲'}
    ],

    // profile*
    period:'2025-2026上学期', pages:8,
    vip: {
      name: '李雷', level: 'VIP会员', expire:'2026-12-31',
      cards: [{name:'月卡',price:68,price_unit:'/月',tag:'最灵活',feature:['AI教练不限次','AI讲题50次']},{name:'年卡',price:998,price_unit:'/年',tag:'最划算',feature:['AI教练不限次','AI讲题不限次','专属班主任','家长周报']}],
      perks:[{title:'AI学习教练',desc:'24小时在线辅导，解答学习问题'},{title:'AI讲题引擎',desc:'拍照上传题目，AI分步讲解'},{title:'错题自动整理',desc:'错题自动归档，智能复习推送'},{title:'家长周报',desc:'每周学习数据，同步给家长'}]
    },
    report: {period:'2025-2026上学期',overview:'整体成绩进步较大，理科提升明显',pages:8,
      subjects:[{name:'语文',trend:'↗ +8'},{name:'数学',trend:'↗ +15'},{name:'英语',trend:'↗ +5'},{name:'物理',trend:'↗ +10'}],
      weeks:[{week:'第1周',time:12,score:560,tasks:18},{week:'第2周',time:14,score:572,tasks:22},{week:'第3周',time:13,score:568,tasks:20},{week:'第4周',time:16,score:585,tasks:25}]
    },
    parent: {kid_name:'李小明',kid_class:'高三(1)班',weekly_time:58,weekly_tasks:28,subject_scores:[{name:'语文',score:118},{name:'数学',score:135}]},
    settings: {
      account_section:[{icon:'fa-key',bg:'#3B82F6',title:'账号安全',desc:'修改密码、绑定手机',enabled:true},{icon:'fa-id-card',bg:'#8B5CF6',title:'个人资料',desc:'编辑头像、昵称、年级',enabled:true}],
      study_section:[{icon:'fa-bell',bg:'#F59E0B',title:'学习提醒',desc:'每日任务提醒推送',enabled:true},{icon:'fa-volume-up',bg:'#10B981',title:'语音播报',desc:'AI讲解时自动播放语音',enabled:false}],
      other_section:[{icon:'fa-shield-alt',bg:'#EF4444',title:'隐私设置',desc:'学习数据可见范围',enabled:true},{icon:'fa-question-circle',bg:'#6B7280',title:'帮助与反馈',desc:'常见问题和意见反馈',enabled:true}]
    },

    // admin*
    summary: {users: 12856, members: 2348, exams: 56000, revenue: 886000,
      users_growth: '+12.5%', members_growth: '+8.3%', exams_growth: '+15.2%', revenue_growth: '+22.1%',
      recent_kpi_labels:['周一','周二','周三','周四','周五','周六','周日'],
      recent_kpi_values:[180,210,195,230,250,310,280]
    },
    users: genStudents(10),
    members: genMembers(5),
    exams: genExamRecords(8),
    ocr_review:[
      {id:901,subject:'数学',time:'2026-08-08',ocr_accuracy:.96,detail:'15道题全部识别成功',status:'待审核'},
      {id:902,subject:'物理',time:'2026-08-07',ocr_accuracy:.89,detail:'3处公式识别异常',status:'待审核'},
      {id:903,subject:'英语',time:'2026-08-06',ocr_accuracy:.98,detail:'全部识别正确',status:'已通过'}
    ],
    ai_review:[
      {id:1001,type:'AI讲解视频',creator:'auto',time:'2026-08-08',content:'数学·三角函数',ai_safe:.98,status:'待审核'},
      {id:1002,type:'AI学情报告',creator:'auto',time:'2026-08-07',content:'李小明·8月周报',ai_safe:.95,status:'待审核'},
      {id:1003,type:'AI组卷',creator:'auto',time:'2026-08-06',content:'高三综合卷',ai_safe:.99,status:'已通过'}
    ],
    content_review:[
      {id:1101,type:'评论举报',reporter:'用户A',reported:'用户B',time:'2026-08-08',reason:'广告宣传',content:'...',status:'待处理'},
      {id:1102,type:'论坛帖子',reporter:'用户C',reported:'用户D',time:'2026-08-07',reason:'敏感内容',content:'...',status:'待处理'}
    ],
    banners:[
      {id:1,banner_id:'B001',title:'开学季大促',url:'/campaign',pv:28000,uv:12000,status:'上线',time:'2026-08-01'},
      {id:2,banner_id:'B002',title:'VIP限时8折',url:'/vip',pv:15000,uv:8000,status:'上线',time:'2026-08-05'},
      {id:3,banner_id:'B003',title:'模考报名入口',url:'/exam',pv:9000,uv:5000,status:'下线',time:'2026-08-03'}
    ],
    stats:{period:'近7天',labels:['8.2','8.3','8.4','8.5','8.6','8.7','8.8'],
      dau:[8800,9100,8950,9400,9700,10200,9900],
      vip:[240,280,265,310,330,380,360],
      orders:[120,145,130,160,180,220,198]
    },
    retention:{period:'近30天',labels:['第1天','第3天','第7天','第14天','第30天'],
      new_users:[1800,1680,1350,1020,850],
      rate:[.93,.75,.56,.34,.25]
    },

    // teacher* (t_dashboard...)
    t_dashboard: {
      teacher:{name:'王老师',subject:'数学',class:'高三(1)班',role:'班主任'},
      today_stats: {classes:3,students:45,submitted:38,grading:5},
      tasks:[
        {title:'数学周考批改',desc:'45份试卷中已批38份',progress:84,color:'#3B82F6'},
        {title:'AI切题审核',desc:'15道题已审核12道',progress:80,color:'#F59E0B'},
        {title:'课堂练习准备',desc:'高三(1)班明天第3节',progress:100,color:'#10B981'}
      ]
    },
    t_upload: {recent:[
      {name:'数学周考试卷.pdf',pages:4,time:'2026-08-08 14:30',size:2.4,status:'解析中'},
      {name:'物理模考.pdf',pages:3,time:'2026-08-07 09:15',size:1.8,status:'已入库'}
    ]},
    t_split: {filename:'数学周考试卷.pdf',pages:4,cur_page:1,total_pages:4,
      boxes:[
        {q_no:1,x:50,y:80,w:500,h:80,type:'选择',score:5},
        {q_no:2,x:50,y:170,w:500,h:80,type:'选择',score:5},
        {q_no:3,x:50,y:260,w:500,h:100,type:'填空',score:5},
      ]
    },
    t_parse: {count:15,current:1,
      q:{no:1,type:'选择',score:5,content:'已知函数f(x)=x²-2x+1，求f(3)=',knowledge:['二次函数','基础计算'],
        answer:'C',steps:['代入x=3','f(3)=9-6+1','结果=4','选C'],
        analysis:'本题考查二次函数的代入计算，易错点是计算时符号出错。',difficulty:'简单'}
    },
    t_tag: {count:15,current:1,
      q:{no:1,type:'选择',score:5,content:'已知函数f(x)=x²-2x+1，求f(3)=',
        suggested:[{name:'二次函数',confidence:.98,status:'pending'},{name:'代入计算',confidence:.92,status:'pending'}],
        confirmed:['二次函数','代入计算']}
    },
    t_exercise: {list:[
      {no:1,type:'选择',score:5,content:'题目1：已知集合A={x|x<3}，B={x|x>1}，则A∩B=？',diff:'中等'},
      {no:2,type:'填空',score:5,content:'题目2：函数f(x)=√(x-1)的定义域为________。',diff:'简单'},
      {no:3,type:'解答',score:12,content:'题目3：已知等差数列{an}，a1=2，公差d=3，求前10项和。',diff:'困难'}
    ]},
    t_paper: {count:15,total_score:150,
      structure:[{no:'选择题',count:12,score:5},{no:'填空题',count:4,score:5},{no:'解答题',count:6,score:12}],
      list:[
        {no:1,type:'选择',score:5,content:'1.已知集合A={1,2,3}，B={2,3,4}，A∩B=？'},
        {no:2,type:'选择',score:5,content:'2.函数f(x)=ln(x-1)的定义域为？'},
        {no:3,type:'填空',score:5,content:'3.向量a=(1,2)，b=(3,-1)，则a·b=________。'},
      ]
    },

    // ai-module*
    coach: {
      today: {
        summary:'根据最近3次考试和今日练习，你的数学提升最快，物理和化学需要加强。',
        overall: 88,
        items:[{name:'数学掌握率',val:92,color:'#10B981'},{name:'英语掌握率',val:86,color:'#3B82F6'},{name:'物理掌握率',val:72,color:'#F59E0B'}]
      },
      diag: {title:'本周数学学情诊断', weak:'三角函数：掌握率58%，低于班级平均20%', strong:'代数函数：掌握率92%，高于班级平均12%'},
      path: {weeks:4,
        nodes:[{label:'第1周·函数复习',done:true,color:'#10B981'},{label:'第2周·三角函数突破',done:false,color:'#F59E0B'}]
      },
      daily:[
        {date:'2026-08-08',summary:'今日完成情况：6/6任务完成率100%'},
        {date:'2026-08-07',summary:'今日完成情况：5/6任务完成率83%'},
      ]
    },
    explain: {
      q:{stem:'已知f(x)=x²-2x+1，求f(3)', steps:[
        {step:1,title:'理解题意',content:'题目要求计算f(3)，即把x=3代入函数。',passed:false},
        {step:2,title:'代入',content:'f(3)=3²-2×3+1',passed:false},
        {step:3,title:'计算',content:'9-6+1=4',passed:false},
      ]}
    },
    paper_eng: {
      info:{grade:'高三',subject:'数学',count:22,score:150},
      basis:{past_papers:50000,similarity_threshold:0.85,knowledge_coverage:'全年级96%'},
      preview:{count:15,list:[
        {no:1,type:'选择',score:5,content:'1.已知集合A={1,2,3}，B={2,3,4}，A∩B=？'},
        {no:2,type:'选择',score:5,content:'2.函数f(x)=ln(x-1)的定义域为？'},
      ]}
    },
    graph_view: {
      subject:'数学', total_nodes:48, mastered:36, learning:8, weak:4,
      legend:[{name:'已掌握',value:36,color:'#10B981'},{name:'学习中',value:8,color:'#F59E0B'},{name:'薄弱',value:4,color:'#EF4444'}],
      kp:[{name:'二次函数',percent:90,action:false,action_title:''},{name:'三角函数',percent:58,action:true,action_title:'加强训练'},{name:'圆锥曲线',percent:42,action:true,action_title:'查看知识点'}]
    },
    predict: {
      score:590, rank:12500, confidence:92,
      trend:{labels:['9月','10月','11月','12月','1月','2月'], scores:[555,570,565,582,590,595]},
      path:[
        {subject:'语文',current:110,target:118,gap:8,path:'加强古诗文默写和现代文阅读',trend:'↗ +5'},
        {subject:'数学',current:135,target:142,gap:7,path:'攻克压轴题，稳定选择填空',trend:'↗ +8'},
        {subject:'英语',current:120,target:128,gap:8,path:'提升完形填空和作文',trend:'↗ +3'},
      ]
    },
    auto_import: {
      page:'ai-auto-import-ocr',
      upload_filename:'高三数学周考试卷.pdf', total_steps:5,
      steps:[
        {title:'PDF上传解析',done:true,time:'10:05'},
        {title:'OCR识别切题',done:true,time:'10:07'},
        {title:'AI结构化入库',done:false,current:true,time:'进行中'},
        {title:'AI切题校验',done:false,time:'待开始'},
        {title:'完成入库',done:false,time:'待开始'},
      ]
    },
    ocr_detail: {
      file:'高三数学周考试卷.pdf',pages:4,stats:{total:15,success:13,fixed:1,failed:1},
      accuracy:96.8,formulas:'$$x^2 + 2x + 1$$、$$\\int_0^1 f(x)dx$$、$$\\sum_{i=1}^{n} a_i$$',
      regions:[{name:'文字区域',count:48,color:'#3B82F6'},{name:'公式区域',count:15,color:'#8B5CF6'},{name:'图表区域',count:3,color:'#10B981'}],
      issues:[{q_no:7,detail:'根号内部识别错误',fix:'已修正为√(x²+1)',status:'异常'},{q_no:11,detail:'分数识别为乱码',fix:'需人工确认',status:'未处理'}],
      next_step:{page:'ai-auto-import-cut',title:'下一步：LLM切题校验'}
    },
    cut_detail: {
      file:'高三数学周考试卷.pdf', total_questions:15,
      type_stat:[{type:'选择题',count:12,avg_score:5},{type:'填空题',count:4,avg_score:5},{type:'解答题',count:6,avg_score:12}],
      adjust_options:[{label:'题型分类更细',key:'fine',selected:false},{label:'按知识点归组',key:'kp',selected:true},{label:'按难度分层',key:'diff',selected:false}],
      list:[
        {no:1,type:'选择',score:5,knowledge:['集合','基础运算'],content:'1.已知集合A={1,2,3}，B={2,3,4}，A∩B=？'},
        {no:2,type:'选择',score:5,knowledge:['函数定义域'],content:'2.函数f(x)=ln(x-1)的定义域为？'},
      ]
    },

    // ai-center* pages: coach/explain/qa/error/plan (mock)
    acoach: {greeting:'你好，李雷！今天要复习什么？',suggests:['帮我分析上周数学错题','制定今天的学习计划','给我讲解三角函数',]},
    aexplain: {placeholder:'输入或粘贴题目内容，AI将为你分步讲解'},
    aqa: {placeholder:'输入你的问题，AI老师为你解答',
      history: [{q:'数学的导数怎么求？',a:'设函数y=f(x)在点x₀处附近有定义...',time:'8月7日'}]
    },
    aerror: {
      month:{total:68,newest:18,repeat:8,resolve_rate:.82},
      subject_stats:[{name:'数学',count:26,color:'#3B82F6'},{name:'物理',count:18,color:'#F59E0B'},{name:'化学',count:12,color:'#EF4444'},{name:'生物',count:7,color:'#10B981'},{name:'英语',count:5,color:'#8B5CF6'}],
      error_types:[{name:'概念理解错误',count:26,pct:.38},{name:'计算错误',count:20,pct:.29},{name:'审题不清',count:14,pct:.21},{name:'书写规范',count:8,pct:.12}],
      suggest:'建议重点突破数学概念理解类错题，该类错题占比最高且可快速提升。',
      list:[
        {subject:'数学',date:'2026-08-07',type:'选择',content:'已知集合A={x|x²-5x+6=0}，求A=？',reason:'概念理解错误',ai_parse:'x²-5x+6=(x-2)(x-3)，解为2和3，A={2,3}'},
        {subject:'物理',date:'2026-08-06',type:'解答',content:'一个物体以初速度v₀=10m/s水平抛出，不计空气阻力，2s后速度大小是？',reason:'公式记错',ai_parse:'水平vx=10，竖直vy=gt=20，v=√(10²+20²)=√500≈22.4m/s'},
        {subject:'化学',date:'2026-08-05',type:'填空',content:'将SO₂通入酸性KMnO₄溶液，现象是________。',reason:'审题不清',ai_parse:'紫红色褪去（SO₂被氧化为SO₄²⁻，MnO₄⁻被还原为Mn²⁺）'},
      ]
    },
    aplan: {
      target:{college:'厦门大学',major:'计算机科学',score_target:612,score_current:590,gap:22},
      predict:{math_prob:.78,admit_prob:.65,improved_score:18},
      breakdown:[{subject:'语文',current:110,target:118,add:8},{subject:'数学',current:135,target:142,add:7},{subject:'英语',current:120,target:128,add:8}],
      weeks:[
        {label:'第1周',focus:'函数与导数',focus_time:18,weak_count:5,strong_count:3,tests:2,tasks:['复习函数概念','完成导数专项训练']},
        {label:'第2周',focus:'三角函数',focus_time:15,weak_count:4,strong_count:4,tests:1,tasks:['记忆三角公式','刷三角函数综合题']},
        {label:'第3周',focus:'数列综合',focus_time:16,weak_count:3,strong_count:5,tests:2,tasks:['等差等比数列复习','完成数列压轴题']},
        {label:'第4周',focus:'立体几何',focus_time:17,weak_count:4,strong_count:4,tests:1,tasks:['空间向量复习','练习立体几何证明和计算']},
      ],
      progress:{done:45,total:120,pct:37.5}
    },
  }),
  getTodayTasks: () => Promise.resolve({})
};

// =========================
// Load scripts
// =========================
eval(fs.readFileSync('js/design-system.js','utf8'));
let proto = fs.readFileSync('js/prototype.js','utf8');
proto = proto.replace('const PAGES = {};','global.PAGES = global.window.PAGES = {}; const PAGES = global.PAGES;');
proto = proto.replace('const PAGE_GROUPS = [];','global.PAGE_GROUPS = global.window.PAGE_GROUPS = []; const PAGE_GROUPS = global.PAGE_GROUPS;');
proto += '\nglobal.registerPage = registerPage; global.navigateTo = navigateTo; global.renderPage = renderPage; global.closeModal = closeModal;';
eval(proto);
global.openModal = function(t,h){ global.__lastModal={title:t,html:h}; global.__modalCount=(global.__modalCount||0)+1; };
// 按 pages-*.js 的脚本文件加载顺序：home -> ai-center -> practice -> photo -> score -> college -> profile -> admin -> teacher -> ai-module
try{ eval(fs.readFileSync('js/pages-home.js','utf8')); }catch(e){console.log('pages-home err',e.message);}
try{ eval(fs.readFileSync('js/pages-ai-center.js','utf8')); }catch(e){console.log('pages-ai-center err',e.message);}
try{ eval(fs.readFileSync('js/pages-practice.js','utf8')); }catch(e){console.log('pages-practice err',e.message);}
try{ eval(fs.readFileSync('js/pages-photo.js','utf8')); }catch(e){console.log('pages-photo err',e.message);}
try{ eval(fs.readFileSync('js/pages-score.js','utf8')); }catch(e){console.log('pages-score err',e.message);}
try{ eval(fs.readFileSync('js/pages-college.js','utf8')); }catch(e){console.log('pages-college err',e.message);}
try{ eval(fs.readFileSync('js/pages-profile.js','utf8')); }catch(e){console.log('pages-profile err',e.message);}
try{ eval(fs.readFileSync('js/pages-admin.js','utf8')); }catch(e){console.log('pages-admin err',e.message);}
try{ eval(fs.readFileSync('js/pages-teacher.js','utf8')); }catch(e){console.log('pages-teacher err',e.message);}
try{ eval(fs.readFileSync('js/pages-ai-module.js','utf8')); }catch(e){console.log('pages-ai-module err',e.message);}

const scorePages = Object.keys(global.PAGES).filter(k=>k.startsWith('score-'));
const collegePages = Object.keys(global.PAGES).filter(k=>k.startsWith('college-'));
const profilePages = Object.keys(global.PAGES).filter(k=>k.startsWith('profile-'));
const adminPages = Object.keys(global.PAGES).filter(k=>k.startsWith('admin-'));
const teacherPages = Object.keys(global.PAGES).filter(k=>k.startsWith('teacher-'));
const aiModPages = Object.keys(global.PAGES).filter(k=>k.startsWith('ai-module-') || k.startsWith('ai-auto-import'));
const aiCntPages = Object.keys(global.PAGES).filter(k=>k.startsWith('ai-') && !k.startsWith('ai-module-') && !k.startsWith('ai-auto-import'));

console.log(`\n页面注册数：score=${scorePages.length}  college=${collegePages.length}  profile=${profilePages.length}  admin=${adminPages.length}  teacher=${teacherPages.length}  ai-module=${aiModPages.length}  ai-center=${aiCntPages.length}`);

(async () => {
  const checks = [];
  function check(name, ok) { checks.push({name, ok}); return ok; }

  // ========== UTIL：进入某页、渲染、刷新 HTML ==========
  async function go(pageKey, contentId) {
    global.__elById = {};
    global.__lastModal = null; global.__modalCount = 0; global.__lastToast = null; global.__lastNav = null;
    global.navigateTo(pageKey);
    for (let i=0;i<8;i++) await flushPromises();
    const screen = (global.__elById['device-screen'] || {}).innerHTML || '';
    const content = (global.__elById[contentId] || {}).innerHTML || '';
    return {screen, content};
  }

  function findOnclick(html, matchFn) {
    const matches = [...html.matchAll(/onclick="([^"]+)"/g)].map(x => x[1]).filter(matchFn || (()=>true));
    return matches;
  }

  function runOnclick(code) {
    global.__lastModal = null; global.__lastToast = null; global.__lastNav = null;
    runOnclickCode(code);
    return {modal: global.__lastModal, toast: global.__lastToast, nav: global.__lastNav};
  }

  // ========================================================================
  // 模块1：成绩分析 (pages-score.js: score-monthly/mock/school-rank/province-rank/improvement)
  // ========================================================================
  {
    const M = '成绩分析';
    // (A) ChartPlaceholder 残留检查
    for (const k of ['score-monthly','score-mock','score-school-rank','score-province-rank','score-improvement']) {
      const {content} = await go(k, k+'-content');
      check(`${M}.${k}：无 ChartPlaceholder 残留`, !/ChartPlaceholder\(/.test(content));
      check(`${M}.${k}：有真实 drawScoreChart 调用`, /drawScoreChart\(/.test(content));
    }
    // (B) 校排名 - 同分段竞争点击（之前已测，再次确认）
    const {content: srContent} = await go('score-school-rank','score-school-rank-content');
    const comp = findOnclick(srContent, c => c.includes("同分段竞争分析"));
    if (comp.length) { const r = runOnclick(comp[0]); check(`${M}.同分段竞争点击标题`, r.modal && r.modal.title === '同分段竞争分析'); check(`${M}.同分段竞争详情有范围`, r.modal && /570~580/.test(r.modal.html)); }
    // (C) 省排名 - 历年录取3行独立点击
    const {content: prContent} = await go('score-province-rank','score-province-rank-content');
    const rows = [...prContent.matchAll(/onclick="(openModal\('(\d{4})年录取详情',[\s\S]*?\))"/g)];
    check(`${M}.省排名-3行独立录取详情`, rows.length === 3 && rows.every(r=>{
      const result = runOnclick(r[1]);
      return result.modal && result.modal.title === r[2]+'年录取详情';
    }));
    // (D) "暂无数据"分支 - 检查是否有返回按钮（检查renderPageContent结构：函数包含navigateTo('home')在空分支）
    const src = fs.readFileSync('js/pages-score.js','utf8');
    check(`${M}：5个页面暂无数据都有返回按钮`, (src.match(/navigateTo\('home'\)/g)||[]).length >= 5);
  }

  // ========================================================================
  // 模块2：志愿填报 (pages-college.js: college-recommend/major/rank)
  // ========================================================================
  {
    const M = '志愿填报';
    // (A) 专业推荐页：兴趣标签点击 → openModal（不是 showToast）
    const {content: mj} = await go('college-major','college-major-content');
    const interestOnclicks = findOnclick(mj, c => c.includes("openModal") && c.includes("专业详情"));
    check(`${M}.兴趣标签：至少2个 openModal=专业详情`, interestOnclicks.length >= 2);
    // (B) 位次页：位次换算表行点击 → openModal（不是 showToast）
    const {content: rk} = await go('college-rank','college-rank-content');
    const rkRows = [...rk.matchAll(/onclick="(openModal\('(\d{4})年位次换算详情',[\s\S]*?\))"/g)];
    check(`${M}.位次换算行：3个 openModal=年份位次换算详情`, rkRows.length === 3);
    if (rkRows.length) { const r = runOnclick(rkRows[0][1]); check(`${M}.位次换算详情有冲稳保`, r.modal && /重庆大学|冲|稳|保/.test(r.modal.html)); }
    // (C) ChartPlaceholder 残留检查
    for (const k of ['college-recommend','college-major','college-rank']) {
      const {content} = await go(k, k+'-content');
      check(`${M}.${k}：无 ChartPlaceholder 残留`, !/ChartPlaceholder\(/.test(content));
    }
    // (D) 暂无数据 返回按钮
    const src = fs.readFileSync('js/pages-college.js','utf8');
    check(`${M}：3个页面暂无数据都有返回按钮`, (src.match(/navigateTo\('home'\)/g)||[]).length >= 3);
  }

  // ========================================================================
  // 模块3：个人中心 (pages-profile.js: profile-main/vip/report/parent/settings)
  // ========================================================================
  {
    const M = '个人中心';
    // (A) VIP 特权项 → openModal('xxx特权详情', ...)
    const {content: vip} = await go('profile-vip','profile-vip-content');
    const perks = [...vip.matchAll(/onclick="(openModal\('([^']+)特权详情',[\s\S]*?\))"/g)];
    check(`${M}.VIP特权：至少3个点击打开特权详情`, perks.length >= 3);
    // (B) VIP 套餐选择：有 vip-plan-card 且点击后 DOM 切换高亮（runOnclick -> DOM 变）
    const plans = [...vip.matchAll(/onclick="([^"]*vip-plan-card[^"]*)"/g)];
    check(`${M}.VIP套餐：有卡片点击高亮逻辑 (querySelectorAll('.vip-plan-card'))`, plans.length >= 2);
    // (C) 分享报告/导出 PDF：openModal（不是 showToast）
    const {content: rep} = await go('profile-report','profile-report-content');
    const shareBtn = findOnclick(rep, c=>c.includes('openModal') && c.includes('分享学习报告'));
    const pdfBtn = findOnclick(rep, c=>c.includes('openModal') && c.includes('学习报告导出'));
    check(`${M}.分享报告：openModal=分享学习报告`, shareBtn.length>=1);
    if (shareBtn.length){ const r=runOnclick(shareBtn[0]); check(`${M}.分享报告：有日期分享链接`, r.modal && /https:\/\/edu\.example\.com\/share\/report\/\d+/.test(r.modal.html)); }
    check(`${M}.导出PDF：openModal=学习报告导出`, pdfBtn.length>=1);
    if (pdfBtn.length){ const r=runOnclick(pdfBtn[0]); check(`${M}.导出PDF：有生成完毕提示`, r.modal && /报告已生成完毕|生成完毕/.test(r.modal.html)); }
    // (D) 通知开关：有可切换的 data-enabled + transform 代码
    const {content: st} = await go('profile-settings','profile-settings-content');
    const toggle = [...st.matchAll(/onclick="([^"]*data-enabled[^"]*)"/g)];
    check(`${M}.通知开关：有 data-enabled + transform 真实翻转`, toggle.length >= 2);
    // (E) 退出登录：确认后 navigateTo('home')
    const logoutOnclick = findOnclick(st, c => c.includes('navigateTo') && c.includes("home"));
    check(`${M}.退出登录：点击有 navigateTo('home') 跳转`, logoutOnclick.length >= 1);
    // (F) 设置项列表：有 openModal 不是空跳转
    const settingModals = [...st.matchAll(/onclick="openModal\(/g)];
    check(`${M}.设置列表项：至少 3 个 openModal 详情`, settingModals.length >= 3);
  }

  // ========================================================================
  // 模块4：运营后台 (pages-admin.js: 10 pages)
  // ========================================================================
  {
    const M = '运营后台';
    // (A) 用户管理：启用禁用 有 data-status 真实切换
    const {content: usr} = await go('admin-users','admin-users-content');
    const toggles = findOnclick(usr, c => c.includes('启用') || c.includes('禁用'));
    check(`${M}.用户管理：至少5个启用禁用 onclick`, toggles.length>=5);
    // (B) 用户搜索：openModal（非纯 showToast）
    const searchBtn = findOnclick(usr, c => c.includes('openModal') && (c.includes('搜索')||c.includes('结果')));
    check(`${M}.用户搜索：openModal 显示结果`, searchBtn.length>=1);
    // (C) 分页：数字按钮有 pg-num + data-page，可切换高亮
    const pgNum = [...usr.matchAll(/class="pg-num[^"]*"/g)];
    check(`${M}.分页：至少2个 pg-num 数字按钮`, pgNum.length >= 2);
    // (D) 真题管理：删除 -> openModal（非纯 showToast）
    const {content: exam} = await go('admin-exams','admin-exams-content');
    const delBtn = findOnclick(exam, c => c.includes('openModal') && c.includes('删除'));
    check(`${M}.删除真题：openModal 确认`, delBtn.length>=1);
    // (E) OCR审核：通过/拒绝 -> openModal
    const {content: ocr} = await go('admin-ocr','admin-ocr-content');
    const ocrBtns = findOnclick(ocr, c => c.includes('openModal') && (c.includes('审核')||c.includes('通过')||c.includes('拒绝')));
    check(`${M}.OCR审核：通过/拒绝有 openModal`, ocrBtns.length>=2);
    // (F) AI审核：通过发布/拒绝 -> openModal
    const {content: air} = await go('admin-ai-review','admin-ai-review-content');
    const aibtn = findOnclick(air, c => c.includes('openModal') && (c.includes('发布')||c.includes('拒绝')));
    check(`${M}.AI审核：通过/拒绝有 openModal`, aibtn.length>=2);
    // (G) 内容举报：处理按钮 -> openModal
    const {content: cr} = await go('admin-content','admin-content-content');
    const crbtns = findOnclick(cr, c => c.includes('openModal') && c.includes('处理'));
    check(`${M}.内容举报：处理按钮 openModal`, crbtns.length>=1);
    // (H) Banner：上下线按钮有 data-banner-row 切换状态
    const {content: bn} = await go('admin-banner','admin-banner-content');
    const bannerBtn = findOnclick(bn, c => c.includes('data-banner-row') || (c.includes('上线')||c.includes('下线')) && c.includes('banner-status'));
    check(`${M}.Banner上下线：真实切换状态`, bannerBtn.length>=2);
    // (I) 数据统计：导出报表 -> openModal
    const {content: st2} = await go('admin-stats','admin-stats-content');
    const exportBtn = findOnclick(st2, c => c.includes('openModal') && (c.includes('导出')||c.includes('报表')));
    check(`${M}.数据统计：导出报表 openModal`, exportBtn.length>=1);
    // (J) 表单 onchange：users 搜索框/年级、exams 年份/省份/科目、stats 时间范围 都有 onchange
    const src = fs.readFileSync('js/pages-admin.js','utf8');
    check(`${M}.用户管理：搜索框 onchange`, src.includes('用户搜索') && src.includes('oninput=') || src.includes('onchange='));
    check(`${M}.所有select/input 都有 onchange/oninput`, (src.match(/onchange=|oninput=/g)||[]).length >= 6);
    // (K) 暂无数据/失败 有重试：adminLoadData 共享函数内有 navigateTo(key)
    check(`${M}.adminLoadData：暂无数据/失败 有重试按钮`, src.includes('重试') && src.includes("navigateTo(key)"));
  }

  // ========================================================================
  // 模块5：教师后台 (pages-teacher.js: 7 pages)
  // ========================================================================
  {
    const M = '教师后台';
    // (A) 教学首页：今日任务卡片可点击 -> openModal
    const {content: db} = await go('teacher-dashboard','teacher-dashboard-content');
    const taskCards = [...db.matchAll(/onclick="openModal\('教学任务详情'/g)];
    check(`${M}.今日任务：至少3张卡片点击打开任务详情`, taskCards.length >= 3);
    // (B) 上传：选择文件按钮 -> openModal 上传UI（非 showToast('请选择')）
    const {content: up} = await go('teacher-upload','teacher-upload-content');
    const fileBtn = findOnclick(up, c => c.includes('openModal') && c.includes('上传'));
    check(`${M}.上传试卷：选择文件按钮打开上传弹窗`, fileBtn.length>=1);
    // (C) 切题：确认切题/重新切题 -> openModal
    const {content: sp} = await go('teacher-split','teacher-split-content');
    const confirm = findOnclick(sp, c => c.includes('openModal') && (c.includes('切题确认')||c.includes('切题')));
    check(`${M}.确认切题：openModal 切题确认`, confirm.length>=1);
    // (D) 解析：全部确认/单题确认/重新解析 -> openModal
    const {content: ps} = await go('teacher-parse','teacher-parse-content');
    const parseBtns = findOnclick(ps, c => c.includes('openModal') && (c.includes('解析')||c.includes('确认')));
    check(`${M}.解析：至少2个 openModal 按钮`, parseBtns.length>=2);
    // (E) 标知识点：采纳/忽略/添加 -> openModal
    const {content: tg} = await go('teacher-tag','teacher-tag-content');
    const tagBtns = findOnclick(tg, c => c.includes('openModal') && (c.includes('采纳')||c.includes('忽略')||c.includes('添加')||c.includes('知识点')));
    check(`${M}.标知识点：至少3个 openModal 按钮`, tagBtns.length>=3);
    // (F) 课堂练习：生成/导出/推送/打印 -> openModal
    const {content: ex} = await go('teacher-exercise','teacher-exercise-content');
    const exBtns = findOnclick(ex, c => c.includes('openModal') && (c.includes('生成')||c.includes('导出')||c.includes('班级')||c.includes('打印')));
    check(`${M}.课堂练习：至少4个 openModal 按钮`, exBtns.length>=4);
    // (G) 组卷：AI组卷/保存/导出/发布 -> openModal
    const {content: pp} = await go('teacher-paper','teacher-paper-content');
    const ppbtns = findOnclick(pp, c => c.includes('openModal') && (c.includes('组卷')||c.includes('保存')||c.includes('PDF')||c.includes('班级')));
    check(`${M}.AI组卷：至少4个 openModal 按钮`, ppbtns.length>=4);
    // (H) 表单：切题的 select/input、练习页 select、组卷页 input/range/select 都有 onchange/oninput
    const src = fs.readFileSync('js/pages-teacher.js','utf8');
    check(`${M}.表单：select/input/range 至少 10 个 onchange/oninput`, (src.match(/onchange=|oninput=/g)||[]).length >= 10);
    // (I) 翻页：上一页/下一页 能切换页码（含 parseInt + cur_page）
    check(`${M}.翻页：切题页有 parseInt + 切换页码`, src.includes('parseInt') && /cur_page|共\\d+页/.test(src));
  }

  // ========================================================================
  // 模块6：AI核心模块 (pages-ai-module.js + pages-ai-center.js)
  // ========================================================================
  {
    const M = 'AI核心模块';
    // (A) ai-module-coach 今日分析/学情诊断/学习路径 三张卡片 -> openModal
    const {content: m1} = await go('ai-module-coach','ai-module-coach-content');
    const coachCards = findOnclick(m1, c => c.includes('openModal') && (c.includes('分析')||c.includes('诊断')||c.includes('路径')));
    check(`${M}.AI学习教练：3张分析/诊断/路径卡片 openModal`, coachCards.length>=3);
    // (B) ai-module-predict 预测置信度/预测依据 -> openModal
    const {content: m2} = await go('ai-module-predict','ai-module-predict-content');
    const pCards = findOnclick(m2, c => c.includes('openModal') && (c.includes('置信')||c.includes('依据')));
    check(`${M}.AI预测：置信度/预测依据 openModal`, pCards.length>=2);
    // (C) ai-module-paper 题目预览卡片 -> openModal
    const {content: m3} = await go('ai-module-paper','ai-module-paper-content');
    const pqCards = findOnclick(m3, c => c.includes('openModal') && c.includes('题目'));
    check(`${M}.AI组卷：题目预览卡片点击 openModal=题目详情`, pqCards.length>=2);
    // (D) ChartPlaceholder 残留检查：pages-ai-module.js
    const src1 = fs.readFileSync('js/pages-ai-module.js','utf8');
    check(`${M}.pages-ai-module：无 ChartPlaceholder 残留`, !/ChartPlaceholder\(/.test(src1));
    // (E) ChartPlaceholder 残留检查：pages-ai-center.js
    const src2 = fs.readFileSync('js/pages-ai-center.js','utf8');
    check(`${M}.pages-ai-center：无 ChartPlaceholder 残留`, !/ChartPlaceholder\(/.test(src2));
    // (F) ai-center: ai-error 错题卡片 -> openModal 题目详情
    const {content: ae} = await go('ai-error','ai-error-content');
    const eCards = findOnclick(ae, c => c.includes('openModal') && c.includes('错题详情'));
    check(`${M}.AI错题分析：错题卡片 openModal=错题详情`, eCards.length>=3);
    // (G) ai-center: ai-plan 每周计划卡片 -> openModal 周详情
    const {content: ap} = await go('ai-plan','ai-plan-content');
    const wCards = findOnclick(ap, c => c.includes('openModal') && c.includes('周计划详情'));
    check(`${M}.AI学习规划：4个周计划卡片 openModal=周详情`, wCards.length>=4);
    // (H) ai-center: 其他假交互 showToast 替换 openModal：分享/拍照/完整计划/调整/导出
    const all = ae + ap;
    const modalsCount = (all.match(/openModal\(/g)||[]).length;
    check(`${M}.AI错题+规划：页面内总 openModal 调用数 ≥ 10`, modalsCount >= 10);
    // (I) 语音播报：showToast 之外有 speechSynthesis speak 或 openModal
    const {content: ac2} = await go('ai-coach','ai-coach-content');
    const voiceBtn = findOnclick(ac2, c => c.includes('语音') && (c.includes('openModal')||c.includes('speak')||c.includes('speechSynthesis')));
    check(`${M}.AI教练：语音播报按钮 有 openModal / speech`, voiceBtn.length>=1);
    // (J) ai-qa 查看全部历史 / 拍照提问 / ai-plan 查看完整计划 openModal
    const {content: aq} = await go('ai-qa','ai-qa-content');
    const historyBtn = findOnclick(aq, c => c.includes('历史') && c.includes('openModal'));
    const photoBtn = findOnclick(aq, c => c.includes('拍照') && c.includes('openModal'));
    check(`${M}.AI答疑：查看全部历史 openModal`, historyBtn.length>=1);
    check(`${M}.AI答疑：拍照提问 openModal`, photoBtn.length>=1);
    const fullPlanBtn = findOnclick(ap, c => c.includes('完整计划') && c.includes('openModal'));
    check(`${M}.学习规划：查看完整计划 openModal`, fullPlanBtn.length>=1);
  }

  // ========================================================================
  // 全局扫描：不再有"纯假 showToast"（表单 onchange 反馈除外）
  // ========================================================================
  {
    let badFake = 0;
    const files = [
      ['pages-score','js/pages-score.js'],
      ['pages-college','js/pages-college.js'],
      ['pages-profile','js/pages-profile.js'],
      ['pages-admin','js/pages-admin.js'],
      ['pages-teacher','js/pages-teacher.js'],
      ['pages-ai-module','js/pages-ai-module.js'],
      ['pages-ai-center','js/pages-ai-center.js']
    ];
    for (const [name, file] of files) {
      const s = fs.readFileSync(file, 'utf8');
      // 找出所有 onclick="...showToast(...)" 的调用
      const onclickShowToast = [...s.matchAll(/onclick="([^"]*showToast\([^)]+\)[^"]*)"/g)].map(m=>m[1]);
      for (const code of onclickShowToast) {
        // 如果只含 showToast，不含 openModal/navigateTo/document./window. -> 假
        if (/showToast\(/.test(code) && !/openModal|navigateTo|document\.|window\.|classList|style\.|transform|querySelector|innerHTML|textContent|getAttribute|setAttribute|data-|data\(|\.value/.test(code)) {
          badFake++;
          console.log(`  [疑似假交互] ${name}: ${code.slice(0,120)}`);
        }
      }
    }
    check(`全局：纯假 showToast onclick（不含任何 DOM/状态变更）数量为 0`, badFake === 0);
    console.log(`\n[全局纯假 showToast 扫描] 可疑数量 = ${badFake}`);
  }

  // ================ 汇总 ================
  console.log('\n================= VERIFICATION SUMMARY =================');
  const PASS = checks.filter(c=>c.ok).length;
  const FAIL = checks.filter(c=>!c.ok).length;
  console.log(`总计：${PASS} PASS / ${FAIL} FAIL / ${checks.length} 项检查`);
  console.log('\n-- FAIL 项 --');
  checks.filter(c=>!c.ok).forEach(c => console.log('  ❌', c.name));
  console.log('\n-- PASS 前 15 项示例 --');
  checks.filter(c=>c.ok).slice(0,15).forEach(c => console.log('  ✅', c.name));

  process.exit(FAIL ? 1 : 0);
})().catch(e => { console.log('验证脚本报错', e); process.exit(1); });
