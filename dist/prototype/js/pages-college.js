// ============================================================
// 志愿填报模块 - 3个页面（动态加载：数据来自 /api/page-data/:key）
// ============================================================

// 1. AI院校推荐
// 缓存最近一次加载的数据，供「调整推荐条件」后重新计算渲染使用
var collegeRecommendData = null;

// 院校池：覆盖中国全部116所985与211高校（含军校4所：国防科大/二医/三医/四医）
// 字段：name(校名) / province(所在省) / score(2025录取线参考) / majors(优势专业) / subjects(选科要求，空=不限) / icon
var COLLEGE_POOL = [
    // ---------- 北京市（26所，8所985） ----------
    { name: '清华大学', province: '北京市', score: 685, majors: '计算机/电子信息/经济与金融', subjects: ['物化生','物化政','物化地'], icon: 'fa-university' },
    { name: '北京大学', province: '北京市', score: 682, majors: '数学/物理/光华管理', subjects: ['物化生','物化政','物化地','物生地'], icon: 'fa-university' },
    { name: '中国人民大学', province: '北京市', score: 655, majors: '法学/新闻/金融学', subjects: ['物化政','史政地','史政生'], icon: 'fa-university' },
    { name: '北京航空航天大学', province: '北京市', score: 642, majors: '航空航天/计算机/电子信息', subjects: ['物化生','物化政','物化地'], icon: 'fa-university' },
    { name: '北京理工大学', province: '北京市', score: 635, majors: '兵器/车辆工程/计算机', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '中国农业大学', province: '北京市', score: 618, majors: '农学/食品科学/动物医学', subjects: ['物化生','物生地'], icon: 'fa-university' },
    { name: '北京师范大学', province: '北京市', score: 638, majors: '心理学/教育学/汉语言文学', subjects: ['史政地','史政生','物化生'], icon: 'fa-university' },
    { name: '中央民族大学', province: '北京市', score: 575, majors: '民族学/中国语言文学/历史', subjects: ['史政地','史政生','物化政'], icon: 'fa-university' },
    { name: '北京交通大学', province: '北京市', score: 595, majors: '交通运输/信息与通信/计算机', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '北京工业大学', province: '北京市', score: 580, majors: '土木/材料/环境', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '北京科技大学', province: '北京市', score: 598, majors: '冶金/材料/机械', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '北京化工大学', province: '北京市', score: 575, majors: '化工/材料/环境', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '北京邮电大学', province: '北京市', score: 615, majors: '通信/电子/计算机', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '北京林业大学', province: '北京市', score: 568, majors: '林学/风景园林/生物学', subjects: ['物化生','物生地'], icon: 'fa-university' },
    { name: '北京中医药大学', province: '北京市', score: 555, majors: '中医学/中药学/针灸', subjects: ['物化生','史政生'], icon: 'fa-university' },
    { name: '北京外国语大学', province: '北京市', score: 580, majors: '英语/小语种/翻译', subjects: ['物化政','史政地','史政生'], icon: 'fa-university' },
    { name: '中国传媒大学', province: '北京市', score: 595, majors: '播音主持/新闻/广播电视', subjects: ['物化政','史政地'], icon: 'fa-university' },
    { name: '中央财经大学', province: '北京市', score: 615, majors: '金融/会计/经济', subjects: ['物化政','物化生','史政地'], icon: 'fa-university' },
    { name: '对外经济贸易大学', province: '北京市', score: 605, majors: '国际贸易/金融/工商管理', subjects: ['物化政','史政地'], icon: 'fa-university' },
    { name: '北京体育大学', province: '北京市', score: 530, majors: '体育教育/运动训练/运动人体科学', subjects: ['物化生','物化政','史政地'], icon: 'fa-university' },
    { name: '中央音乐学院', province: '北京市', score: 555, majors: '音乐表演/音乐学/作曲', subjects: ['史政地','史政生'], icon: 'fa-university' },
    { name: '中国政法大学', province: '北京市', score: 605, majors: '法学/政治学/社会学', subjects: ['物化政','史政地','史政生'], icon: 'fa-university' },
    { name: '华北电力大学', province: '北京市', score: 590, majors: '电气/动力/自动化', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '中国矿业大学(北京)', province: '北京市', score: 565, majors: '矿业/安全/地质', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '中国石油大学(北京)', province: '北京市', score: 575, majors: '石油/化工/地质', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '中国地质大学(北京)', province: '北京市', score: 565, majors: '地质/资源/环境', subjects: ['物化生','物化地'], icon: 'fa-university' },

    // ---------- 上海市（10所，4所985） ----------
    { name: '复旦大学', province: '上海市', score: 672, majors: '新闻/经济学/临床医学', subjects: ['物化生','物化政','史政地'], icon: 'fa-university' },
    { name: '上海交通大学', province: '上海市', score: 670, majors: '船舶/计算机/临床医学', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '同济大学', province: '上海市', score: 632, majors: '土木工程/建筑/车辆工程', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '华东理工大学', province: '上海市', score: 595, majors: '化工/材料/控制科学', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '东华大学', province: '上海市', score: 575, majors: '纺织/材料/设计', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '华东师范大学', province: '上海市', score: 615, majors: '教育学/心理学/软件工程', subjects: ['物化生','史政地'], icon: 'fa-university' },
    { name: '上海外国语大学', province: '上海市', score: 580, majors: '英语/小语种/翻译', subjects: ['物化政','史政地'], icon: 'fa-university' },
    { name: '上海财经大学', province: '上海市', score: 605, majors: '会计/金融/经济', subjects: ['物化政','物化生','史政地'], icon: 'fa-university' },
    { name: '上海大学', province: '上海市', score: 570, majors: '美术/社会学/机械', subjects: ['物化生','史政地','物化政'], icon: 'fa-university' },
    { name: '海军军医大学', province: '上海市', score: 580, majors: '临床医学/海军医学/药学', subjects: ['物化生'], icon: 'fa-university' },

    // ---------- 江苏省（11所，2所985） ----------
    { name: '南京大学', province: '江苏省', score: 652, majors: '天文/物理/计算机', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '东南大学', province: '江苏省', score: 628, majors: '建筑/电子/信息工程', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '苏州大学', province: '江苏省', score: 580, majors: '法学/纺织/医学', subjects: ['物化生','史政地'], icon: 'fa-university' },
    { name: '南京航空航天大学', province: '江苏省', score: 600, majors: '航空/机械/飞行器', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '南京理工大学', province: '江苏省', score: 595, majors: '兵器/光学/化工', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '中国矿业大学', province: '江苏省', score: 575, majors: '矿业/安全/测绘', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '河海大学', province: '江苏省', score: 580, majors: '水利/土木/环境', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '江南大学', province: '江苏省', score: 565, majors: '食品/设计/纺织', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '南京农业大学', province: '江苏省', score: 560, majors: '农学/植物保护/园艺', subjects: ['物化生','物生地'], icon: 'fa-university' },
    { name: '中国药科大学', province: '江苏省', score: 580, majors: '药学/中药学/药物制剂', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '南京师范大学', province: '江苏省', score: 565, majors: '教育学/汉语言/地理', subjects: ['史政地','史政生','物化生'], icon: 'fa-university' },

    // ---------- 陕西省（8所，3所985） ----------
    { name: '西安交通大学', province: '陕西省', score: 610, majors: '电气/能动/管理科学', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '西北工业大学', province: '陕西省', score: 605, majors: '航空/材料/机械', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '西北农林科技大学', province: '陕西省', score: 545, majors: '农学/林学/植物保护', subjects: ['物化生','物生地'], icon: 'fa-university' },
    { name: '西北大学', province: '陕西省', score: 555, majors: '地质/经济学/历史', subjects: ['物化生','史政地'], icon: 'fa-university' },
    { name: '西安电子科技大学', province: '陕西省', score: 590, majors: '电子/通信/计算机', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '长安大学', province: '陕西省', score: 565, majors: '交通/公路/地质', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '陕西师范大学', province: '陕西省', score: 555, majors: '教育学/汉语言/历史', subjects: ['史政地','史政生','物化生'], icon: 'fa-university' },
    { name: '空军军医大学', province: '陕西省', score: 575, majors: '口腔医学/临床医学/药学', subjects: ['物化生'], icon: 'fa-university' },

    // ---------- 湖北省（7所，2所985） ----------
    { name: '武汉大学', province: '湖北省', score: 612, majors: '测绘/法学/马克思主义理论', subjects: ['物化生','史政地','史政生'], icon: 'fa-university' },
    { name: '华中科技大学', province: '湖北省', score: 608, majors: '机械/光学/公共卫生', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '武汉理工大学', province: '湖北省', score: 580, majors: '材料/汽车/船舶', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '中国地质大学(武汉)', province: '湖北省', score: 575, majors: '地质/珠宝/资源', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '华中农业大学', province: '湖北省', score: 560, majors: '园艺/畜牧/生物学', subjects: ['物化生','物生地'], icon: 'fa-university' },
    { name: '中南财经政法大学', province: '湖北省', score: 595, majors: '法学/金融/会计', subjects: ['物化政','史政地','史政生'], icon: 'fa-university' },
    { name: '华中师范大学', province: '湖北省', score: 575, majors: '教育学/汉语言/政治', subjects: ['史政地','史政生','物化生'], icon: 'fa-university' },

    // ---------- 四川省（5所，2所985） ----------
    { name: '四川大学', province: '四川省', score: 595, majors: '口腔/数学/化学', subjects: ['物化生','物生地'], icon: 'fa-university' },
    { name: '电子科技大学', province: '四川省', score: 592, majors: '电子科学/信息通信/计算机', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '西南交通大学', province: '四川省', score: 580, majors: '轨道交通/机械/电气', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '西南财经大学', province: '四川省', score: 580, majors: '金融/会计/经济', subjects: ['物化政','史政地'], icon: 'fa-university' },
    { name: '四川农业大学', province: '四川省', score: 545, majors: '农学/动物科学/林学', subjects: ['物化生','物生地'], icon: 'fa-university' },

    // ---------- 广东省（4所，2所985） ----------
    { name: '中山大学', province: '广东省', score: 625, majors: '工商管理/生物学/化学', subjects: ['物化生','物生地'], icon: 'fa-university' },
    { name: '华南理工大学', province: '广东省', score: 602, majors: '轻工/建筑/材料', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '暨南大学', province: '广东省', score: 575, majors: '新闻/经济/药学', subjects: ['物化政','史政地','物化生'], icon: 'fa-university' },
    { name: '华南师范大学', province: '广东省', score: 565, majors: '教育/心理学/物理', subjects: ['物化生','史政地'], icon: 'fa-university' },

    // ---------- 辽宁省（4所，2所985） ----------
    { name: '大连理工大学', province: '辽宁省', score: 586, majors: '化工/机械/土木', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '东北大学', province: '辽宁省', score: 568, majors: '自动化/计算机/冶金', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '辽宁大学', province: '辽宁省', score: 545, majors: '经济学/哲学/法学', subjects: ['物化政','史政地'], icon: 'fa-university' },
    { name: '大连海事大学', province: '辽宁省', score: 555, majors: '航海/交通/船舶', subjects: ['物化生','物化地'], icon: 'fa-university' },

    // ---------- 湖南省（4所，3所985） ----------
    { name: '国防科技大学', province: '湖南省', score: 645, majors: '计算机/航天/电子', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '湖南大学', province: '湖南省', score: 585, majors: '土木/车辆/工商管理', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '中南大学', province: '湖南省', score: 582, majors: '冶金/医学/材料', subjects: ['物化生','物生地'], icon: 'fa-university' },
    { name: '湖南师范大学', province: '湖南省', score: 565, majors: '教育学/汉语言/外语', subjects: ['史政地','史政生','物化生'], icon: 'fa-university' },

    // ---------- 黑龙江省（4所，1所985） ----------
    { name: '哈尔滨工业大学', province: '黑龙江省', score: 605, majors: '航天/焊接/计算机', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '哈尔滨工程大学', province: '黑龙江省', score: 565, majors: '船舶/水声/核科学', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '东北农业大学', province: '黑龙江省', score: 535, majors: '农学/兽医/食品', subjects: ['物化生','物生地'], icon: 'fa-university' },
    { name: '东北林业大学', province: '黑龙江省', score: 535, majors: '林学/木材/野生动植物', subjects: ['物化生','物生地'], icon: 'fa-university' },

    // ---------- 天津市（4所，2所985） ----------
    { name: '南开大学', province: '天津市', score: 628, majors: '数学/化学/经济', subjects: ['物化生','物化政'], icon: 'fa-university' },
    { name: '天津大学', province: '天津市', score: 615, majors: '化工/建筑/精仪', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '天津医科大学', province: '天津市', score: 555, majors: '临床医学/口腔/药学', subjects: ['物化生'], icon: 'fa-university' },
    { name: '河北工业大学', province: '天津市', score: 565, majors: '电气/机械/化工', subjects: ['物化生','物化地'], icon: 'fa-university' },

    // ---------- 吉林省（3所，1所985） ----------
    { name: '吉林大学', province: '吉林省', score: 580, majors: '车辆工程/法学/考古', subjects: ['物化生','史政地'], icon: 'fa-university' },
    { name: '延边大学', province: '吉林省', score: 515, majors: '朝鲜语/医学/化学', subjects: ['物化生','史政地'], icon: 'fa-university' },
    { name: '东北师范大学', province: '吉林省', score: 560, majors: '教育学/心理学/历史', subjects: ['史政地','史政生'], icon: 'fa-university' },

    // ---------- 安徽省（3所，1所985） ----------
    { name: '中国科学技术大学', province: '安徽省', score: 670, majors: '物理/化学/数学', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '合肥工业大学', province: '安徽省', score: 580, majors: '机械/电气/管理', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '安徽大学', province: '安徽省', score: 565, majors: '法学/汉语言/计算机', subjects: ['物化生','史政地'], icon: 'fa-university' },

    // ---------- 山东省（3所，2所985） ----------
    { name: '山东大学', province: '山东省', score: 590, majors: '数学/中文/医学', subjects: ['物化生','史政地'], icon: 'fa-university' },
    { name: '中国海洋大学', province: '山东省', score: 578, majors: '海洋科学/水产/食品', subjects: ['物化生','物生地'], icon: 'fa-university' },
    { name: '中国石油大学(华东)', province: '山东省', score: 565, majors: '石油/化工/地质', subjects: ['物化生','物化地'], icon: 'fa-university' },

    // ---------- 重庆市（3所，1所985） ----------
    { name: '重庆大学', province: '重庆市', score: 588, majors: '建筑/机械/电气', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '西南大学', province: '重庆市', score: 565, majors: '心理学/教育学/农学', subjects: ['史政地','史政生','物化生'], icon: 'fa-university' },
    { name: '陆军军医大学', province: '重庆市', score: 565, majors: '临床医学/野战外科/药学', subjects: ['物化生'], icon: 'fa-university' },

    // ---------- 福建省（2所，1所985） ----------
    { name: '厦门大学', province: '福建省', score: 600, majors: '会计/经济/化学', subjects: ['物化生','史政地','物化政'], icon: 'fa-university' },
    { name: '福州大学', province: '福建省', score: 565, majors: '化学/电气/土木', subjects: ['物化生','物化地'], icon: 'fa-university' },

    // ---------- 新疆维吾尔自治区（2所） ----------
    { name: '新疆大学', province: '新疆维吾尔自治区', score: 495, majors: '草业/资源/数学', subjects: ['物化生','史政地'], icon: 'fa-university' },
    { name: '石河子大学', province: '新疆维吾尔自治区', score: 480, majors: '农业/医学/经济', subjects: ['物化生','史政地'], icon: 'fa-university' },

    // ---------- 其余每省1所 ----------
    { name: '浙江大学', province: '浙江省', score: 638, majors: '计算机/控制科学/光学工程', subjects: ['物化生','物化政','物化地'], icon: 'fa-university' },
    { name: '兰州大学', province: '甘肃省', score: 560, majors: '核物理/化学/草业科学', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '云南大学', province: '云南省', score: 555, majors: '民族学/生态学/软件', subjects: ['物化生','史政地','物生地'], icon: 'fa-university' },
    { name: '贵州大学', province: '贵州省', score: 545, majors: '计算机/土木/机械', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '广西大学', province: '广西壮族自治区', score: 540, majors: '土木/轻工/农业', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '海南大学', province: '海南省', score: 530, majors: '法学/园艺/旅游', subjects: ['物化生','史政地'], icon: 'fa-university' },
    { name: '内蒙古大学', province: '内蒙古自治区', score: 510, majors: '生物学/生态学/民族学', subjects: ['物化生','史政地'], icon: 'fa-university' },
    { name: '太原理工大学', province: '山西省', score: 545, majors: '煤化工/机械/材料', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '南昌大学', province: '江西省', score: 555, majors: '食品/材料/医学', subjects: ['物化生','物化地'], icon: 'fa-university' },
    { name: '郑州大学', province: '河南省', score: 555, majors: '化学/医学/材料', subjects: ['物化生','史政地'], icon: 'fa-university' },
    { name: '西藏大学', province: '西藏自治区', score: 490, majors: '生态学/中国语言文学/数学', subjects: ['物化生','史政地'], icon: 'fa-university' },
    { name: '青海大学', province: '青海省', score: 485, majors: '生态学/草地/医学', subjects: ['物化生','物生地'], icon: 'fa-university' },
    { name: '宁夏大学', province: '宁夏回族自治区', score: 490, majors: '草业/汉语言/机械', subjects: ['物化生','史政地'], icon: 'fa-university' }
];

registerPage('college-recommend', 'AI院校推荐', '志愿填报', 'fa-university', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('college-recommend-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('college-recommend').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-inbox" style="font-size:32px;margin-bottom:12px;"></i><div style="font-size:13px;margin-bottom:16px;">暂无数据</div><button class="proto-btn proto-btn-outline" style="font-size:12px;" onclick="navigateTo(\'home\')">返回首页</button></div>';
                return;
            }
            collegeRecommendData = data;
            renderCollegeRecommendContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    return Page({
        title: 'AI院校推荐',
        back: true,
        content: '<div id="college-recommend-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// 渲染 AI院校推荐 内容（首屏加载与「重新推荐」共用）
function renderCollegeRecommendContent(container, data) {
    var html = '';

    // 推荐条件卡片
    var condTags = (data.conditions || []).map(function (c) {
        return '<span style="background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:12px;font-size:12px;">' + c + '</span>';
    }).join('');
    html += GradientCard('blue', `
        <div style="font-size:13px;opacity:0.9;margin-bottom:8px;"><i class="fas fa-sliders-h"></i> 推荐条件</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${condTags}
        </div>
    `);

    // 院校列表
    (data.colleges || []).forEach(function (c) {
        var probColor = c.prob >= 80 ? 'var(--success)' : c.prob >= 60 ? 'var(--warning)' : 'var(--danger)';
        html += `
        <div class="proto-card" style="cursor:pointer;" onclick="openModal('院校详情', '<div style=&quot;padding:14px;font-size:13px;color:#374151;line-height:1.8;&quot;><b>院校：</b>${c.name}<br><b>类型：</b>${c.type}<br><b>2025录取线：</b>${c.score}分<br><b>录取概率：</b>${c.prob}%<br><b>优势专业：</b>${c.majors}</div>')">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:36px;height:36px;border-radius:10px;background:var(--primary-light);display:flex;align-items:center;justify-content:center;"><i class="fas ${c.icon}" style="color:var(--primary);"></i></div>
                    <div>
                        <div style="font-size:15px;font-weight:700;">${c.name}</div>
                        <div style="font-size:11px;color:var(--text-tertiary);">2025录取线 ${c.score}分</div>
                    </div>
                </div>
                ${Tag(c.type, c.tag)}
            </div>
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                <div style="flex:1;">
                    <div style="font-size:11px;color:var(--text-secondary);margin-bottom:4px;">录取概率</div>
                    ${Progress(c.prob, probColor)}
                </div>
                <div style="font-size:18px;font-weight:700;color:${probColor};">${c.prob}%</div>
            </div>
            <div style="font-size:12px;color:var(--text-secondary);background:#F9FAFB;border-radius:8px;padding:8px 10px;">
                <i class="fas fa-star" style="color:var(--warning);margin-right:4px;"></i>优势专业：${c.majors}
            </div>
        </div>`;
    });

    // 调整按钮 —— 打开交互表单而非静态说明
    html += `<button class="proto-btn proto-btn-outline" style="margin-top:8px;" onclick="collegeRecommendAdjust()"><i class="fas fa-sliders-h"></i> 调整推荐条件</button>`;

    container.innerHTML = html;
}

// 打开「调整推荐条件」交互表单弹窗
function collegeRecommendAdjust() {
    var d = collegeRecommendData || {};
    var conds = d.conditions || [];
    // 解析当前条件，回填表单默认值
    var curScore = '598', curProv = '浙江省', curSub = '物化生', curRank = '8231';
    if (conds.length >= 1) curScore = (conds[0].match(/\d+/) || ['598'])[0];
    if (conds.length >= 2) curProv = conds[1];
    if (conds.length >= 3) curSub = conds[2];
    if (conds.length >= 4) { var rankMatch = conds[3].match(/[\d,]+/); curRank = rankMatch ? rankMatch[0].replace(/,/g, '') : '8231'; }

    var provinces = ['北京市','天津市','河北省','山西省','辽宁省','吉林省','黑龙江省','上海市','江苏省','浙江省','安徽省','福建省','江西省','山东省','河南省','湖北省','湖南省','广东省','海南省','重庆市','四川省','贵州省','云南省','陕西省','甘肃省','青海省'];
    var subjectSets = ['物化生','物化政','物化地','物生政','物生地','史政地','史政生','史地生'];
    var provOpts = provinces.map(function (p) { return '<option value="' + p + '"' + (p === curProv ? ' selected' : '') + '>' + p + '</option>'; }).join('');
    var subOpts = subjectSets.map(function (s) { return '<option value="' + s + '"' + (s === curSub ? ' selected' : '') + '>' + s + '</option>'; }).join('');

    var formHtml = '<div style="font-size:12px;color:#6B7280;margin-bottom:14px;line-height:1.6;">调整以下条件，AI 将重新计算录取概率并重新排序推荐院校。</div>'
        + '<div style="margin-bottom:14px;"><div style="font-size:12px;color:#6B7280;margin-bottom:6px;">预估分数</div><input id="cr-score" class="proto-input" type="number" value="' + curScore + '" style="height:40px;"></div>'
        + '<div style="margin-bottom:14px;"><div style="font-size:12px;color:#6B7280;margin-bottom:6px;">所在省份</div><select id="cr-province" class="proto-input" style="height:40px;">' + provOpts + '</select></div>'
        + '<div style="margin-bottom:14px;"><div style="font-size:12px;color:#6B7280;margin-bottom:6px;">选科组合</div><select id="cr-subject" class="proto-input" style="height:40px;">' + subOpts + '</select></div>'
        + '<div style="margin-bottom:18px;"><div style="font-size:12px;color:#6B7280;margin-bottom:6px;">全省位次</div><input id="cr-rank" class="proto-input" type="number" value="' + curRank + '" style="height:40px;"></div>'
        + '<button class="proto-btn proto-btn-primary" style="width:100%;height:44px;border-radius:8px;" onclick="collegeRecommendReapply()"><i class="fas fa-sync-alt"></i> 重新推荐</button>';

    openModal('调整推荐条件', formHtml, { width: 360 });
}

// 根据新条件重新计算录取概率并重新渲染
function collegeRecommendReapply() {
    var scoreEl = document.getElementById('cr-score');
    var provEl = document.getElementById('cr-province');
    var subEl = document.getElementById('cr-subject');
    var rankEl = document.getElementById('cr-rank');
    if (!scoreEl || !provEl || !subEl || !rankEl) return;

    var score = parseInt(scoreEl.value, 10) || 598;
    var province = provEl.value;
    var subject = subEl.value;
    var rank = parseInt(rankEl.value, 10) || 8231;

    closeModal();

    var container = document.getElementById('college-recommend-content');
    if (!container) return;
    var d = collegeRecommendData || { colleges: [] };

    // 更新推荐条件标签
    d.conditions = ['预估 ' + score + '分', province, subject, '全省' + rank.toLocaleString('en') + '名'];

    // 从院校池中筛选：
    //   1) 选科匹配（subjects 为空=不限；否则需包含当前选科组合）
    //   2) 分数在合理区间 [score-45, score+35]，保证冲刺/稳妥/保底都有
    //   3) 同省院校优先（提升其在排序中的权重）
    var candidates = COLLEGE_POOL.filter(function (c) {
        if (c.subjects && c.subjects.length > 0 && c.subjects.indexOf(subject) === -1) return false;
        var lo = score - 45, hi = score + 35;
        return c.score >= lo && c.score <= hi;
    });

    // 计算每所候选院校的录取概率（不修改 COLLEGE_POOL 原始 score 类型）
    candidates.forEach(function (c) {
        var cScore = (typeof c.score === 'number') ? c.score : parseInt(String(c.score).replace(/\D/g, ''), 10) || 0;
        var gap = cScore - score;
        var prob = 100 - gap * 1.5;
        // 同省院校：因招生计划多，概率小幅提升
        if (c.province === province) prob += 5;
        if (prob < 5) prob = 5;
        if (prob > 98) prob = 98;
        c.prob = Math.round(prob);
        if (c.prob >= 80) { c.type = '保底'; c.tag = 'green'; }
        else if (c.prob >= 55) { c.type = '稳妥'; c.tag = 'orange'; }
        else { c.type = '冲刺'; c.tag = 'red'; }
        // 保留原始 score 类型，仅在最后映射到展示对象时转 String
    });

    // 按录取概率降序排序
    candidates.sort(function (a, b) { return b.prob - a.prob; });

    // 若筛选结果为空（极端分数），从 COLLEGE_POOL 取分数最接近的 8 所并重新计算概率
    var finalList = candidates;
    if (finalList.length === 0) {
        finalList = COLLEGE_POOL.slice().sort(function (a, b) {
            return Math.abs(a.score - score) - Math.abs(b.score - score);
        }).slice(0, 8).map(function (c) {
            // 选科兼容者优先（若能判断）
            var gap = c.score - score;
            var prob = 100 - gap * 1.5;
            if (c.province === province) prob += 5;
            if (prob < 5) prob = 5;
            if (prob > 98) prob = 98;
            var p = Math.round(prob);
            var type, tag;
            if (p >= 80) { type = '保底'; tag = 'green'; }
            else if (p >= 55) { type = '稳妥'; tag = 'orange'; }
            else { type = '冲刺'; tag = 'red'; }
            return { name: c.name, province: c.province, score: c.score, majors: c.majors, icon: c.icon, prob: p, type: type, tag: tag };
        });
        finalList.forEach(function (c) { c.score = String(c.score); });
    }

    // 取前 8 所展示
    d.colleges = finalList.slice(0, 8).map(function (c) {
        return { name: c.name, type: c.type, tag: c.tag, prob: c.prob, score: String(c.score), majors: c.majors, icon: c.icon };
    });

    // 显示加载动画后重新渲染
    container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">AI 正在根据新条件重新计算…</div></div>';
    setTimeout(function () {
        renderCollegeRecommendContent(container, d);
        if (typeof showToast === 'function') showToast('已根据新条件重新推荐');
    }, 700);
}

// 2. 专业推荐
// 缓存最近一次加载的数据，供「根据院校推荐重新匹配」使用
var collegeMajorData = null;

// 专业池：根据 AI院校推荐 的院校优势专业（majors 字段）反向匹配
// 字段：name(专业名) / keywords(匹配关键词，命中院校 majors 任一 token 即算该院校开设) /
//       req(选科要求，空=不限；字符逐位校验，如 '物化' 要求用户选科含 物 与 化) /
//       career(就业方向) / prospect(前景) / salary(薪资) / icon / bg
var MAJOR_POOL = [
    { name: '计算机科学与技术', keywords: ['计算机','软件','信息工程','信息通信','控制科学','电子科学'], req: '物化', career: '互联网/软件开发/算法工程师', prospect: '极佳', salary: '15-35K', icon: 'fa-laptop-code', bg: '#3B82F6' },
    { name: '电子信息工程', keywords: ['电子信息','电子','通信','信息通信','船舶','水声','光电子'], req: '物化', career: '芯片设计/通信/硬件研发', prospect: '优秀', salary: '12-25K', icon: 'fa-microchip', bg: '#8B5CF6' },
    { name: '软件工程', keywords: ['软件','计算机','信息工程','控制科学'], req: '物化', career: '互联网/系统集成/产品研发', prospect: '极佳', salary: '15-32K', icon: 'fa-code', bg: '#3B82F6' },
    { name: '人工智能', keywords: ['计算机','控制科学','信息通信','电子科学','软件','数学'], req: '物化', career: '算法/AI/大数据研发', prospect: '极佳', salary: '18-40K', icon: 'fa-robot', bg: '#6366F1' },
    { name: '临床医学', keywords: ['临床医学','海军医学','野战外科','医学','口腔医学'], req: '物化生', career: '医院临床/医师规培', prospect: '稳定', salary: '10-22K', icon: 'fa-user-md', bg: '#EF4444' },
    { name: '口腔医学', keywords: ['口腔'], req: '物化生', career: '口腔医院/诊所医师', prospect: '优秀', salary: '15-30K', icon: 'fa-tooth', bg: '#EC4899' },
    { name: '药学', keywords: ['药学','中药学','药物制剂','药物'], req: '物化', career: '制药研发/临床监察', prospect: '良好', salary: '8-16K', icon: 'fa-pills', bg: '#10B981' },
    { name: '法学', keywords: ['法学','政治学','社会学','马克思主义理论'], req: '', career: '律师/法务/公务员', prospect: '良好', salary: '10-25K', icon: 'fa-gavel', bg: '#F59E0B' },
    { name: '金融学', keywords: ['金融','金融学','会计','国际贸易','光华管理','经济与金融'], req: '', career: '银行/证券/投资基金', prospect: '优秀', salary: '12-30K', icon: 'fa-chart-line', bg: '#14B8A6' },
    { name: '经济学', keywords: ['经济','经济学','资源','贸易'], req: '', career: '政府经济部门/外企', prospect: '良好', salary: '8-20K', icon: 'fa-balance-scale', bg: '#F97316' },
    { name: '会计学', keywords: ['会计','工商管理','审计'], req: '', career: '银行/券商/外企财务', prospect: '优秀', salary: '10-25K', icon: 'fa-coins', bg: '#0EA5E9' },
    { name: '工商管理', keywords: ['工商管理','管理科学','国际商务','企业管理'], req: '', career: '企业管理/咨询/投行', prospect: '良好', salary: '10-22K', icon: 'fa-briefcase', bg: '#6366F1' },
    { name: '数学与应用数学', keywords: ['数学','核物理','天文','草业科学'], req: '物化', career: '科研/量化金融/数据分析', prospect: '良好', salary: '10-25K', icon: 'fa-square-root-alt', bg: '#3B82F6' },
    { name: '物理学', keywords: ['物理','天文','核物理','核科学','光电子'], req: '物化', career: '科研院所/航天/半导体', prospect: '良好', salary: '10-22K', icon: 'fa-atom', bg: '#8B5CF6' },
    { name: '化学', keywords: ['化学','化工','中药学','药物','轻工'], req: '物化', career: '化工/材料/制药研发', prospect: '良好', salary: '8-18K', icon: 'fa-flask', bg: '#10B981' },
    { name: '机械工程', keywords: ['机械','车辆工程','车辆','兵器','焊接','冶金','仪器'], req: '物化', career: '制造/汽车/装备研发', prospect: '良好', salary: '8-18K', icon: 'fa-cogs', bg: '#64748B' },
    { name: '电气工程及其自动化', keywords: ['电气','动力','自动化','能源','核科学'], req: '物化', career: '国家电网/电力设计', prospect: '优秀', salary: '10-20K', icon: 'fa-bolt', bg: '#F59E0B' },
    { name: '土木工程', keywords: ['土木','建筑','交通','公路','航海','船舶'], req: '物化', career: '建筑/基建/规划设计', prospect: '良好', salary: '8-15K', icon: 'fa-building', bg: '#6366F1' },
    { name: '材料科学与工程', keywords: ['材料','冶金','轻工','珠宝','资源','核材料'], req: '物化', career: '制造/科研/半导体材料', prospect: '良好', salary: '8-16K', icon: 'fa-cubes', bg: '#0EA5E9' },
    { name: '航空航天工程', keywords: ['航空航天','航天','航空','飞行器','船舶','水声','焊接'], req: '物化', career: '航天院所/国防工业', prospect: '优秀', salary: '10-22K', icon: 'fa-rocket', bg: '#EF4444' },
    { name: '教育学', keywords: ['教育学','教育','心理学','学前教育'], req: '', career: '学校教师/教育机构', prospect: '稳定', salary: '6-12K', icon: 'fa-chalkboard-teacher', bg: '#14B8A6' },
    { name: '心理学', keywords: ['心理学','运动人体科学'], req: '', career: '心理咨询/人力资源', prospect: '良好', salary: '8-15K', icon: 'fa-brain', bg: '#EC4899' },
    { name: '汉语言文学', keywords: ['汉语言','中文','中国语言文学','民族学','历史','马克思主义理论'], req: '', career: '教师/编辑/文职', prospect: '稳定', salary: '6-12K', icon: 'fa-book', bg: '#F59E0B' },
    { name: '新闻传播学', keywords: ['新闻','播音主持','广播电视','广告'], req: '', career: '媒体/公关/品牌策划', prospect: '良好', salary: '7-15K', icon: 'fa-newspaper', bg: '#0EA5E9' },
    { name: '外国语言文学', keywords: ['英语','小语种','翻译','朝鲜语','音乐表演'], req: '', career: '翻译/外贸/外交', prospect: '良好', salary: '7-14K', icon: 'fa-language', bg: '#6366F1' },
    { name: '农学', keywords: ['农学','植物保护','园艺','畜牧','林学','木材','野生动植物','动物科学','食品科学','食品','草业','草地'], req: '物化生', career: '农林牧渔/科研院所', prospect: '稳定', salary: '6-12K', icon: 'fa-leaf', bg: '#10B981' },
    { name: '环境工程', keywords: ['环境','安全','资源','野生动植物','生态学','草业'], req: '物化', career: '环保/政府/科研', prospect: '良好', salary: '7-14K', icon: 'fa-leaf', bg: '#14B8A6' },
    { name: '海洋科学', keywords: ['海洋科学','水产','船舶','水声','航海'], req: '物化生', career: '海洋科研/海事/水产', prospect: '良好', salary: '7-15K', icon: 'fa-water', bg: '#0EA5E9' },
    { name: '体育学', keywords: ['体育教育','运动训练','运动人体科学'], req: '', career: '体育教师/教练/训练', prospect: '稳定', salary: '6-12K', icon: 'fa-futbol', bg: '#F97316' },
    { name: '音乐与舞蹈学', keywords: ['音乐表演','音乐学','作曲','舞蹈'], req: '', career: '演艺/教育/创作', prospect: '良好', salary: '5-15K', icon: 'fa-music', bg: '#EC4899' },
    { name: '中医学', keywords: ['中医学','中药学','针灸'], req: '', career: '中医院/诊所医师', prospect: '稳定', salary: '7-15K', icon: 'fa-leaf', bg: '#10B981' }
];

// 判断用户选科组合 subject（如 '物化生'）是否满足专业要求 req（如 '物化'，逐位校验）
function isSubjectCompatible(req, subject) {
    if (!req) return true;
    if (!subject) return true;
    for (var i = 0; i < req.length; i++) {
        if (subject.indexOf(req[i]) === -1) return false;
    }
    return true;
}

// 根据 AI院校推荐 的院校列表反向匹配专业
//   colleges: 推荐院校数组（含 majors 字符串，如 '计算机/电子信息/经济与金融'）
//   subject: 用户选科组合（来自 collegeRecommendData.conditions[2]）
//   返回：排序后的专业数组（含 match / recommend_colleges / _colleges）
function deriveMajorsFromColleges(colleges, subject) {
    if (!colleges || !colleges.length) {
        // 无院校数据时，按选科兼容性给出 fallback 专业
        return MAJOR_POOL.map(function (m) {
            var compatible = isSubjectCompatible(m.req, subject);
            var baseMatch = compatible ? 60 : 35;
            return {
                name: m.name, match: baseMatch, salary: m.salary, prospect: m.prospect,
                icon: m.icon, bg: m.bg, req: m.req || '不限', career: m.career,
                recommend_colleges: 0, _colleges: []
            };
        }).filter(function (m) { return isSubjectCompatible(m.req, subject); })
          .sort(function (a, b) { return b.match - a.match; })
          .slice(0, 8);
    }
    var offering = {}; // majorName -> [校名...]（去重）
    colleges.forEach(function (c) {
        var majorsStr = c.majors || '';
        // 拆分院校的优势专业字符串为 token
        var tokens = majorsStr.split(/[\/，,、]/).map(function (t) { return t.trim(); }).filter(Boolean);
        MAJOR_POOL.forEach(function (m) {
            var matched = m.keywords.some(function (kw) {
                return tokens.some(function (t) { return t.indexOf(kw) > -1 || kw.indexOf(t) > -1; });
            });
            if (matched) {
                if (!offering[m.name]) offering[m.name] = [];
                if (offering[m.name].indexOf(c.name) === -1) offering[m.name].push(c.name);
            }
        });
    });

    var list = MAJOR_POOL.map(function (m) {
        var collegesForMajor = offering[m.name] || [];
        var coverage = collegesForMajor.length / colleges.length; // 0..1：覆盖了多少推荐院校
        var baseMatch = Math.round(coverage * 85); // 基础匹配度上限 85
        var compatible = isSubjectCompatible(m.req, subject);
        if (compatible) baseMatch += 12; else baseMatch -= 35;
        if (baseMatch < 35) baseMatch = 35;
        if (baseMatch > 98) baseMatch = 98;
        return {
            name: m.name,
            match: baseMatch,
            salary: m.salary,
            prospect: m.prospect,
            icon: m.icon,
            bg: m.bg,
            req: m.req || '不限',
            career: m.career,
            recommend_colleges: collegesForMajor.length,
            _colleges: collegesForMajor
        };
    });

    // 仅保留至少 1 所推荐院校开设的专业
    list = list.filter(function (m) { return m.recommend_colleges > 0; });
    // 若无任何专业匹配到推荐院校（罕见），回退到选科兼容的 fallback 专业
    if (!list.length) {
        list = MAJOR_POOL.map(function (m) {
            var compatible = isSubjectCompatible(m.req, subject);
            return {
                name: m.name, match: compatible ? 60 : 35, salary: m.salary, prospect: m.prospect,
                icon: m.icon, bg: m.bg, req: m.req || '不限', career: m.career,
                recommend_colleges: 0, _colleges: []
            };
        }).filter(function (m) { return m.match >= 60; });
    }
    list.sort(function (a, b) { return b.match - a.match; });
    return list.slice(0, 8);
}

// 从 collegeRecommendData 推导并写回 collegeMajorData，返回是否成功匹配
function applyCollegeMajorFromRecommend(data) {
    if (!collegeRecommendData || !collegeRecommendData.colleges || !collegeRecommendData.colleges.length) return false;
    var subject = (collegeRecommendData.conditions && collegeRecommendData.conditions[2]) || '';
    var derived = deriveMajorsFromColleges(collegeRecommendData.colleges, subject);
    // 即使 derived 为空（不应发生，已有 fallback），也设置来源标记让 banner 显示
    if (derived.length) {
        data.majors = derived;
        data.match_count = derived.length;
    }
    data.source_conditions = collegeRecommendData.conditions || [];
    data.source_colleges = collegeRecommendData.colleges.map(function (c) { return c.name; });
    return true;
}

// 「根据院校推荐重新匹配」入口
function collegeMajorReapply() {
    var container = document.getElementById('college-major-content');
    if (!container) return;
    var d = collegeMajorData || { majors: [], interests: [] };
    var hasRecommend = !!(collegeRecommendData && collegeRecommendData.colleges && collegeRecommendData.colleges.length);

    container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">AI 正在根据院校推荐重新匹配专业…</div></div>';
    setTimeout(function () {
        if (hasRecommend) {
            var ok = applyCollegeMajorFromRecommend(d);
            if (!ok) { if (typeof showToast === 'function') showToast('未匹配到相关专业，请先在 AI院校推荐 调整条件'); }
        } else {
            if (typeof showToast === 'function') showToast('请先在 AI院校推荐 调整推荐条件');
        }
        renderCollegeMajorContent(container, d);
    }, 700);
}

registerPage('college-major', '专业推荐', '志愿填报', 'fa-graduation-cap', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('college-major-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('college-major').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-inbox" style="font-size:32px;margin-bottom:12px;"></i><div style="font-size:13px;margin-bottom:16px;">暂无数据</div><button class="proto-btn proto-btn-outline" style="font-size:12px;" onclick="navigateTo(\'home\')">返回首页</button></div>';
                return;
            }
            collegeMajorData = data;
            // 首次进入即根据 AI院校推荐 结果匹配专业（若有调整后的院校列表）
            applyCollegeMajorFromRecommend(data);
            renderCollegeMajorContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    // 渲染专业推荐内容（含来源条件 banner + 兴趣 + 专业列表）
    function renderCollegeMajorContent(container, data) {
        var html = '';

        // 来源条件 banner：仅在已根据 AI院校推荐 匹配时显示
        if (data.source_conditions && data.source_conditions.length) {
            var condTags = data.source_conditions.map(function (c) {
                return '<span style="background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:12px;font-size:12px;">' + c + '</span>';
            }).join('');
            html += GradientCard('green', `
                <div style="font-size:13px;opacity:0.95;margin-bottom:8px;"><i class="fas fa-link"></i> 已根据 AI院校推荐 匹配专业</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">${condTags}</div>
                <div style="display:flex;gap:8px;">
                    <button class="proto-btn proto-btn-primary" style="flex:1;height:38px;border-radius:8px;font-size:12px;" onclick="collegeMajorReapply()"><i class="fas fa-sync-alt"></i> 重新匹配</button>
                    <button class="proto-btn proto-btn-outline" style="flex:1;height:38px;border-radius:8px;font-size:12px;background:rgba(255,255,255,0.15);color:white;border-color:rgba(255,255,255,0.4);" onclick="navigateTo('college-recommend')"><i class="fas fa-sliders-h"></i> 调整院校条件</button>
                </div>
            `);
        } else if (collegeRecommendData && collegeRecommendData.colleges && collegeRecommendData.colleges.length) {
            // 有院校推荐数据但尚未联动（首次进入）—— 给出联动入口
            html += GradientCard('orange', `
                <div style="font-size:13px;line-height:1.6;">
                    <div style="font-weight:700;margin-bottom:6px;"><i class="fas fa-info-circle"></i> 当前为默认专业列表</div>
                    <div style="opacity:0.95;margin-bottom:10px;">已检测到 AI院校推荐 数据，点击下方按钮即可根据推荐院校重新匹配专业。</div>
                    <button class="proto-btn proto-btn-primary" style="width:100%;height:38px;border-radius:8px;font-size:12px;" onclick="collegeMajorReapply()"><i class="fas fa-sync-alt"></i> 根据院校推荐重新匹配</button>
                </div>
            `);
        } else {
            // 无院校推荐数据 —— 引导用户前往
            html += GradientCard('orange', `
                <div style="font-size:13px;line-height:1.6;">
                    <div style="font-weight:700;margin-bottom:6px;"><i class="fas fa-lightbulb"></i> 先去 AI院校推荐 调整条件</div>
                    <div style="opacity:0.95;margin-bottom:10px;">专业推荐会根据你的院校推荐结果动态匹配优势专业，调整院校条件后这里会自动更新。</div>
                    <button class="proto-btn proto-btn-primary" style="width:100%;height:38px;border-radius:8px;font-size:12px;" onclick="navigateTo('college-recommend')"><i class="fas fa-university"></i> 前往 AI院校推荐</button>
                </div>
            `);
        }

        // 兴趣标签选择
        html += `<div class="section-title">兴趣方向</div>`;
        var interestTags = (data.interests || []).map(function (it) {
            var stars = it.stars || 4;
            var info = '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b>专业名称：</b>' + it.name + '<br><b>选科要求：</b>' + (it.req || '物理+化学') + '<br><b>就业方向：</b>' + (it.career || '科研、工程、技术开发等') + '<br><b>推荐指数：</b><span style=&quot;color:#F59E0B;&quot;>' + '★'.repeat(stars) + '☆'.repeat(5 - stars) + '</span><br><br><span style=&quot;color:#6B7280;&quot;>该专业与你的兴趣匹配度较高，建议作为志愿填报的参考方向。</span></div>';
            if (it.selected) {
                return '<div style="padding:8px 16px;border-radius:20px;background:var(--primary);color:white;font-size:13px;font-weight:600;cursor:pointer;" onclick="openModal(\'' + it.name + '专业详情\', \'' + info + '\')"><i class="fas fa-check"></i> ' + it.name + '</div>';
            }
            return '<div style="padding:8px 16px;border-radius:20px;background:white;color:var(--text-secondary);font-size:13px;border:1px solid var(--border);cursor:pointer;" onclick="openModal(\'' + it.name + '专业详情\', \'' + info + '\')">' + it.name + '</div>';
        }).join('');
        html += `
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
            ${interestTags}
        </div>`;

        // 推荐专业列表
        var majors = data.majors || [];
        html += `<div class="section-title">AI推荐专业 <span class="more">${data.match_count != null ? data.match_count : majors.length}个匹配</span></div>`;

        majors.forEach(function (m) {
            var matchColor = m.match >= 90 ? '#10B981' : m.match >= 80 ? '#F59E0B' : '#6B7280';
            // 推荐院校详情：列出实际开设该专业的推荐院校
            var collList = (m._colleges || []).slice(0, 6).join('、') + (m._colleges && m._colleges.length > 6 ? ' 等' : '');
            var majorInfo = '<div style=&quot;padding:14px;font-size:13px;color:#374151;line-height:1.8;&quot;><b>专业：</b>' + m.name + '<br><b>选科要求：</b>' + (m.req || '不限') + '<br><b>匹配度：</b>' + m.match + '%<br><b>就业前景：</b>' + m.prospect + '<br><b>薪资水平：</b>' + m.salary + '<br><b>就业方向：</b>' + m.career + '<br><b>推荐院校：</b>' + m.recommend_colleges + ' 所' + (collList ? '<br>· ' + collList : '') + '</div>';
            html += `
            <div class="proto-card" style="cursor:pointer;" onclick="openModal('专业详情', '${majorInfo}')">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                    <div style="width:44px;height:44px;border-radius:12px;background:${m.bg};display:flex;align-items:center;justify-content:center;"><i class="fas ${m.icon}" style="color:white;font-size:18px;"></i></div>
                    <div style="flex:1;">
                        <div style="font-size:15px;font-weight:700;">${m.name}</div>
                        <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;">匹配度 ${m.match}% · 选科 ${m.req || '不限'}</div>
                    </div>
                    <div style="text-align:center;">
                        ${RingChart(m.match, matchColor, 48)}
                    </div>
                </div>
                <div style="display:flex;gap:8px;">
                    <div style="flex:1;background:#F9FAFB;border-radius:8px;padding:8px;text-align:center;">
                        <div style="font-size:10px;color:var(--text-tertiary);">就业前景</div>
                        <div style="font-size:13px;font-weight:700;color:var(--success);margin-top:2px;">${m.prospect}</div>
                    </div>
                    <div style="flex:1;background:#F9FAFB;border-radius:8px;padding:8px;text-align:center;">
                        <div style="font-size:10px;color:var(--text-tertiary);">薪资水平</div>
                        <div style="font-size:13px;font-weight:700;color:var(--primary);margin-top:2px;">${m.salary}</div>
                    </div>
                    <div style="flex:1;background:#F9FAFB;border-radius:8px;padding:8px;text-align:center;">
                        <div style="font-size:10px;color:var(--text-tertiary);">推荐院校</div>
                        <div style="font-size:13px;font-weight:700;color:var(--purple);margin-top:2px;">${m.recommend_colleges}所</div>
                    </div>
                </div>
                ${collList ? '<div style="font-size:11px;color:var(--text-secondary);margin-top:8px;background:#F9FAFB;border-radius:8px;padding:6px 10px;"><i class="fas fa-university" style="color:var(--primary);margin-right:4px;"></i>' + collList + '</div>' : ''}
            </div>`;
        });

        // 底部操作按钮
        if (data.source_conditions) {
            html += `<button class="proto-btn proto-btn-outline" style="margin-top:8px;" onclick="collegeMajorReapply()"><i class="fas fa-sync-alt"></i> 根据院校推荐重新匹配</button>`;
        } else {
            html += `<button class="proto-btn proto-btn-primary" style="margin-top:8px;" onclick="navigateTo('college-recommend')"><i class="fas fa-university"></i> 去 AI院校推荐 调整条件</button>`;
        }

        container.innerHTML = html;
    }

    return Page({
        title: '专业推荐',
        back: true,
        content: '<div id="college-major-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});

// 3. 位次分析
// 缓存最近一次加载的数据，供联动刷新使用
var collegeRankData = null;

// 从 collegeRecommendData.conditions 解析分数/省份/选科/位次
function parseRecommendConditions() {
    if (!collegeRecommendData || !collegeRecommendData.conditions) return null;
    var conds = collegeRecommendData.conditions;
    var score = 598, province = '浙江省', subject = '物化生', rank = 8231;
    if (conds.length >= 1) { var m = conds[0].match(/\d+/); if (m) score = parseInt(m[0], 10); }
    if (conds.length >= 2) province = conds[1];
    if (conds.length >= 3) subject = conds[2];
    if (conds.length >= 4) { var rm = conds[3].match(/[\d,]+/); if (rm) rank = parseInt(rm[0].replace(/,/g, ''), 10); }
    return { score: score, province: province, subject: subject, rank: rank };
}

// 根据分数估算位次（简化模型：分数越高位次越小，分段近似）
function estimateRankByScore(score) {
    if (score >= 680) return Math.max(50, Math.round(80 - (score - 680) * 5));
    if (score >= 650) return Math.round(300 - (score - 650) * 8);
    if (score >= 600) return Math.round(2000 - (score - 600) * 35);
    if (score >= 550) return Math.round(8000 - (score - 550) * 120);
    if (score >= 500) return Math.round(20000 - (score - 500) * 240);
    return Math.round(50000 - (score - 400) * 300);
}

// 根据院校推荐 + 专业推荐 推导位次分析数据，写回 collegeRankData
function applyCollegeRankFromRecommend(data) {
    var rec = parseRecommendConditions();
    if (!rec) return false;
    var score = rec.score, province = rec.province, subject = rec.subject, rank = rec.rank;

    // 1) 预估位次/分数
    data.predicted_score = score;
    data.predicted_rank = rank.toLocaleString('en');
    data.province = province;
    data.category = subject.indexOf('物') > -1 || subject.indexOf('化') > -1 ? '物理类' : '历史类';

    // 2) 位次换算表：根据当前分数生成年份换算（分数 ± 微调）
    var baseYears = ['2025', '2024', '2023'];
    var deltas = [-3, +3, 0];
    data.conversion_table = baseYears.map(function (y, i) {
        var eqScore = score + deltas[i];
        var eqRank = estimateRankByScore(eqScore);
        // 从推荐院校中取冲/稳/保三所作为参考
        var cols = (collegeRecommendData && collegeRecommendData.colleges) || [];
        var rush = cols[0] ? cols[0].name : '浙江大学';
        var steady = cols[Math.min(2, cols.length - 1)] ? cols[Math.min(2, cols.length - 1)].name : '武汉大学';
        var safe = cols[Math.min(4, cols.length - 1)] ? cols[Math.min(4, cols.length - 1)].name : '四川大学';
        return {
            year: y,
            rank: eqRank.toLocaleString('en') + '名',
            score: eqScore + '分',
            diff: deltas[i] >= 0 ? '+' + deltas[i] : deltas[i],
            college1: rush,
            college2: steady,
            college3: safe
        };
    });

    // 3) 一分一段表：以当前分数为中心生成 7 个分数点
    var center = score;
    var opLabels = [], opValues = [];
    for (var i = -3; i <= 3; i++) {
        var fs = center + i * 5;
        opLabels.push(String(fs));
        opValues.push(Math.round(120 - Math.abs(i) * 28));
    }
    data.one_point_data = { labels: opLabels, values: opValues };

    // 4) 同位次历年录取：用推荐院校的前 3 所作为历年录取参考
    var cols = (collegeRecommendData && collegeRecommendData.colleges) || [];
    // 按录取线判断院校层次：≥640 为 985，≥560 为 211，否则一本
    function levelByScore(scoreStr) {
        var s = parseInt(String(scoreStr).replace(/\D/g, ''), 10) || 580;
        if (s >= 640) return '985';
        if (s >= 560) return '211';
        return '一本';
    }
    data.history_admission = ['2025', '2024', '2023'].map(function (y, i) {
        var c = cols[i] || cols[0] || { name: '湖南大学', score: '580' };
        return { year: y, college: c.name, level: levelByScore(c.score) };
    });

    // 5) 院校层次分布：按录取线统计 985/211/一本 数量
    var tier = { '985': 0, '211': 0, '一本': 0 };
    cols.forEach(function (c) { var lv = levelByScore(c.score); if (tier[lv] != null) tier[lv]++; });
    data.tier_data = {
        labels: ['985', '211', '一本'],
        values: [tier['985'], tier['211'], tier['一本']]
    };

    // 6) 志愿填报建议：根据推荐院校按 prob 分组
    var rush = [], steady = [], safe = [];
    cols.forEach(function (c) {
        if (c.prob < 55) rush.push(c.name);
        else if (c.prob < 80) steady.push(c.name);
        else safe.push(c.name);
    });
    // 专业推荐 Top3 作为专业建议
    var majorList = (collegeMajorData && collegeMajorData.majors) || [];
    var topMajors = majorList.slice(0, 3).map(function (m) { return m.name; }).join('、');
    data.advice = {
        title: 'AI 志愿填报建议',
        intro: '根据你的院校推荐与专业匹配结果，推荐「冲' + Math.max(1, rush.length) + '稳' + Math.max(1, steady.length) + '保' + Math.max(1, safe.length) + '」策略：',
        strategy: [
            { type: '冲刺', colleges: (rush.length ? rush.join('、') : (cols[0] ? cols[0].name : '浙江大学')) },
            { type: '稳妥', colleges: (steady.length ? steady.join('、') : (cols[2] ? cols[2].name : '武汉大学')) },
            { type: '保底', colleges: (safe.length ? safe.join('、') : (cols[cols.length - 1] ? cols[cols.length - 1].name : '四川大学')) }
        ],
        tip: '推荐专业方向：' + (topMajors || '计算机/电子信息/金融') + '。建议服从调剂以提高录取率。'
    };

    data.source_conditions = collegeRecommendData.conditions || [];
    return true;
}

// 「根据院校+专业推荐重新分析」入口
function collegeRankReapply() {
    var container = document.getElementById('college-rank-content');
    if (!container) return;
    var d = collegeRankData || {};
    var hasRec = !!(collegeRecommendData && collegeRecommendData.colleges && collegeRecommendData.colleges.length);

    container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">AI 正在根据院校与专业推荐重新分析位次…</div></div>';
    setTimeout(function () {
        if (hasRec) {
            applyCollegeRankFromRecommend(d);
            if (typeof showToast === 'function') showToast('已根据院校与专业推荐重新分析');
        } else {
            if (typeof showToast === 'function') showToast('请先在 AI院校推荐 调整推荐条件');
        }
        renderCollegeRankContent(container, d);
    }, 700);
}

registerPage('college-rank', '位次分析', '志愿填报', 'fa-layer-group', function () {
    // 异步加载数据
    setTimeout(function () {
        var container = document.getElementById('college-rank-content');
        if (!container) return;
        if (typeof api === 'undefined' || !api.getPageData) return;

        api.getPageData('college-rank').then(function (data) {
            if (!data) {
                container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-inbox" style="font-size:32px;margin-bottom:12px;"></i><div style="font-size:13px;margin-bottom:16px;">暂无数据</div><button class="proto-btn proto-btn-outline" style="font-size:12px;" onclick="navigateTo(\'home\')">返回首页</button></div>';
                return;
            }
            collegeRankData = data;
            // 首次进入即根据 AI院校推荐 + 专业推荐 联动分析
            applyCollegeRankFromRecommend(data);
            renderCollegeRankContent(container, data);
        }).catch(function () {
            container.innerHTML = '<div style="text-align:center;padding:40px;color:#9CA3AF;"><div style="font-size:13px;">数据加载失败</div></div>';
        });
    }, 100);

    // 渲染位次分析内容（含来源条件 banner + 各分析模块）
    function renderCollegeRankContent(container, data) {
        var html = '';

        // 来源条件 banner
        if (data.source_conditions && data.source_conditions.length) {
            var condTags = data.source_conditions.map(function (c) {
                return '<span style="background:rgba(255,255,255,0.2);padding:4px 10px;border-radius:12px;font-size:12px;">' + c + '</span>';
            }).join('');
            html += GradientCard('purple', `
                <div style="font-size:13px;opacity:0.95;margin-bottom:8px;"><i class="fas fa-link"></i> 已根据 AI院校推荐 + 专业推荐 联动分析</div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">${condTags}</div>
                <div style="display:flex;gap:8px;">
                    <button class="proto-btn proto-btn-primary" style="flex:1;height:38px;border-radius:8px;font-size:12px;" onclick="collegeRankReapply()"><i class="fas fa-sync-alt"></i> 重新分析</button>
                    <button class="proto-btn proto-btn-outline" style="flex:1;height:38px;border-radius:8px;font-size:12px;background:rgba(255,255,255,0.15);color:white;border-color:rgba(255,255,255,0.4);" onclick="navigateTo('college-recommend')"><i class="fas fa-sliders-h"></i> 调整院校条件</button>
                </div>
            `);
        }

        // 预估位次
        html += GradientCard('blue', `
            <div style="text-align:center;">
                <div style="font-size:12px;opacity:0.9;">2026年预估位次</div>
                <div style="font-size:42px;font-weight:700;margin:4px 0;">第${data.predicted_rank}名</div>
                <div style="font-size:13px;opacity:0.9;">${data.province} · ${data.category} · 预估${data.predicted_score}分</div>
            </div>
        `);

        // 位次换算表
        html += `<div class="section-title">位次换算表</div>`;
        var convRows = (data.conversion_table || []).map(function (row, idx) {
            var arr = data.conversion_table || [];
            var border = idx < arr.length - 1 ? 'border-bottom:1px solid var(--border);' : '';
            return `<div style="display:flex;padding:12px 16px;${border}font-size:13px;cursor:pointer;" onclick="openModal('${row.year}年位次换算详情', '<div style=&quot;padding:14px;font-size:13px;line-height:1.8;color:#374151;&quot;><b>年份：</b>${row.year}<br><b>原始位次：</b>第 ${row.rank} 名<br><b>等效分数：</b><span style=&quot;color:#3B82F6;font-weight:700;&quot;>${row.score}分</span><br><b>一本线差：</b>${row.diff || '+0'}分<br><br><b>同位次可报院校参考：</b><br>· ${row.college1 || '浙江大学'}（冲）<br>· ${row.college2 || '武汉大学'}（稳）<br>· ${row.college3 || '四川大学'}（保）<br><br><span style=&quot;color:#6B7280;&quot;>※ 等效位次是根据历年分数线换算的参考值，实际录取以当年政策为准。</span></div>')">
                <div style="flex:1;font-weight:600;">${row.year}</div><div style="flex:1;color:var(--primary);font-weight:600;">${row.rank}</div><div style="flex:1;">${row.score}</div>
            </div>`;
        }).join('');
        html += `
        <div class="proto-card" style="padding:0;overflow:hidden;">
            <div style="display:flex;padding:10px 16px;background:#F9FAFB;font-size:12px;font-weight:700;color:var(--text-secondary);">
                <div style="flex:1;">年份</div><div style="flex:1;">等效位次</div><div style="flex:1;">等效分数</div>
            </div>
            ${convRows}
        </div>`;

        // 一分一段表
        html += `<div class="section-title">一分一段表</div>`;
        var opLabels = (data.one_point_data && data.one_point_data.labels) || ['590', '595', '600', '605', '610', '615', '620'];
        var opValues = (data.one_point_data && data.one_point_data.values) || [45, 62, 78, 95, 88, 70, 52];
        html += '<div id="college-rank-onepoint-chart" style="height:150px;"></div><script>setTimeout(function(){drawScoreChart(\'college-rank-onepoint-chart\',\'bar\',' + JSON.stringify(opLabels) + ',' + JSON.stringify(opValues) + ',' + JSON.stringify(['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6']) + ');},100)</script>';

        // 同位次历年录取统计
        html += `<div class="section-title">同位次历年录取</div>`;
        var historyRows = (data.history_admission || []).map(function (row, idx) {
            var arr = data.history_admission || [];
            var border = idx < arr.length - 1 ? 'border-bottom:1px solid var(--border);' : '';
            return `<div style="display:flex;padding:12px 16px;${border}font-size:13px;align-items:center;cursor:pointer;" onclick="openModal('录取详情', '<div style=&quot;padding:14px;font-size:13px;color:#374151;line-height:1.8;&quot;><b>年份：</b>${row.year}<br><b>录取院校：</b>${row.college}<br><b>院校层次：</b>${row.level}</div>')">
                <div style="flex:1;">${row.year}</div><div style="flex:1;">${row.college}</div><div style="flex:1;">${Tag(row.level, 'red')}</div>
            </div>`;
        }).join('');
        html += `
        <div class="proto-card" style="padding:0;overflow:hidden;">
            <div style="display:flex;padding:10px 16px;background:#F9FAFB;font-size:12px;font-weight:700;color:var(--text-secondary);">
                <div style="flex:1;">年份</div><div style="flex:1;">录取院校</div><div style="flex:1;">层次</div>
            </div>
            ${historyRows}
        </div>`;

        // 院校层次分布
        html += `<div class="section-title">推荐院校层次分布</div>`;
        var tpLabels = (data.tier_data && data.tier_data.labels) || ['985', '211', '一本'];
        var tpValues = (data.tier_data && data.tier_data.values) || [2, 3, 3];
        html += '<div id="college-rank-tier-chart" style="height:150px;"></div><script>setTimeout(function(){drawScoreChart(\'college-rank-tier-chart\',\'bar\',' + JSON.stringify(tpLabels) + ',' + JSON.stringify(tpValues) + ',' + JSON.stringify(['#8B5CF6', '#3B82F6', '#10B981']) + ');},100)</script>';

        // 志愿填报建议
        var adv = data.advice || {};
        var strategyLines = (adv.strategy || []).map(function (st) {
            return '· ' + st.type + '：' + st.colleges;
        }).join('<br>');
        html += `
        <div class="gradient-card gradient-orange">
            <div style="display:flex;align-items:flex-start;gap:10px;">
                <i class="fas fa-lightbulb" style="font-size:20px;margin-top:2px;"></i>
                <div style="font-size:13px;line-height:1.7;">
                    <div style="font-weight:700;margin-bottom:6px;">${adv.title || '志愿填报建议'}</div>
                    ${adv.intro || ''}<br>
                    ${strategyLines}<br>
                    ${adv.tip || ''}
                </div>
            </div>
        </div>`;

        // 底部操作按钮
        html += `<div style="display:flex;gap:8px;margin-top:8px;">`;
        html += `<button class="proto-btn proto-btn-outline" style="flex:1;" onclick="collegeRankReapply()"><i class="fas fa-sync-alt"></i> 重新分析</button>`;
        html += `<button class="proto-btn proto-btn-primary" style="flex:1;" onclick="navigateTo('college-recommend')"><i class="fas fa-university"></i> 院校推荐</button>`;
        html += `</div>`;

        setHTMLWithScripts(container, html);
    }

    return Page({
        title: '位次分析',
        back: true,
        content: '<div id="college-rank-content"><div style="text-align:center;padding:40px;color:#9CA3AF;"><i class="fas fa-spinner fa-spin" style="font-size:24px;margin-bottom:12px;"></i><div style="font-size:13px;">加载中…</div></div></div>'
    });
});
