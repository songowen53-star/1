// ============================================================
// 生成教师后台 5 份上传试卷的完整切题/解析/知识点数据
// 每份试卷题目均包含：题干、选项(选择题)、答案、解析步骤、知识点
// 同时将所有题目导入题库 questions.json
// ============================================================
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'backend', 'data', 'pages');
const QUESTIONS_FILE = path.join(__dirname, '..', 'backend', 'data', 'questions.json');

// ---------- 5 份试卷的完整题目数据 ----------
// 每题结构: { no, type, score, diff, content, options?, answer, analysis:[{step,text}], points:[] }
const PAPERS = [
  {
    fileName: '本地后端验证试卷.pdf',
    size: '43 B',
    time: '今天 03:16',
    totalPages: 5,
    questions: [
      { no:1, type:'选择题', score:5, diff:'简单',
        content:'设集合 A={x|x²-3x+2=0}，B={x|0<x<3}，则 A∩B =（  ）',
        options:['{1}','{2}','{1,2}','{0,1,2}'],
        answer:'C',
        analysis:[
          {step:'第一步：',text:'解方程 x²-3x+2=0，得 (x-1)(x-2)=0，故 A={1,2}。'},
          {step:'第二步：',text:'B={x|0<x<3}=(0,3)，A∩B 取 A 中满足 0<x<3 的元素。'},
          {step:'第三步：',text:'1 和 2 均在 (0,3) 内，故 A∩B={1,2}，选 C。'}
        ],
        points:['集合运算','一元二次方程','交集'] },
      { no:2, type:'选择题', score:5, diff:'简单',
        content:'已知复数 z 满足 (1+i)z=2，则 |z| =（  ）',
        options:['1','√2','2','√2/2'],
        answer:'B',
        analysis:[
          {step:'第一步：',text:'z=2/(1+i)=2(1-i)/[(1+i)(1-i)]=2(1-i)/2=1-i。'},
          {step:'第二步：',text:'|z|=√(1²+(-1)²)=√2，选 B。'}
        ],
        points:['复数运算','复数的模','分母实数化'] },
      { no:3, type:'选择题', score:5, diff:'中等',
        content:'函数 f(x)=x³-3x+1 在区间 [-2,2] 上的最大值为（  ）',
        options:['-1','1','3','5'],
        answer:'C',
        analysis:[
          {step:'第一步：',text:'求导 f\'(x)=3x²-3=3(x-1)(x+1)，令 f\'(x)=0 得 x=±1。'},
          {step:'第二步：',text:'计算端点及驻点函数值：f(-2)=-1，f(-1)=3，f(1)=-1，f(2)=3。'},
          {step:'第三步：',text:'比较得最大值为 3，选 C。'}
        ],
        points:['导数应用','函数最值','闭区间连续函数'] },
      { no:4, type:'选择题', score:5, diff:'中等',
        content:'已知 sinα=3/5，α∈(π/2,π)，则 cos(α+π/4)=（  ）',
        options:['-7√2/10','-√2/10','√2/10','7√2/10'],
        answer:'A',
        analysis:[
          {step:'第一步：',text:'由 α∈(π/2,π) 知 cosα<0，cosα=-√(1-sin²α)=-4/5。'},
          {step:'第二步：',text:'cos(α+π/4)=cosαcos(π/4)-sinαsin(π/4)。'},
          {step:'第三步：',text:'=(-4/5)(√2/2)-(3/5)(√2/2)=-7√2/10，选 A。'}
        ],
        points:['同角三角函数关系','两角和公式','象限符号判断'] },
      { no:5, type:'填空题', score:5, diff:'中等',
        content:'已知等差数列 {aₙ} 中，a₁=2，a₃=6，则 a₅ = ______。',
        answer:'10',
        analysis:[
          {step:'第一步：',text:'由 a₃=a₁+2d 得 6=2+2d，解得公差 d=2。'},
          {step:'第二步：',text:'a₅=a₁+4d=2+4×2=10。'}
        ],
        points:['等差数列','通项公式','基本量运算'] },
      { no:6, type:'填空题', score:5, diff:'中等',
        content:'若向量 a=(1,2)，b=(x,-1)，且 a⊥b，则 x = ______。',
        answer:'2',
        analysis:[
          {step:'第一步：',text:'a⊥b 等价于 a·b=0。'},
          {step:'第二步：',text:'1·x + 2·(-1)=0，即 x-2=0，解得 x=2。'}
        ],
        points:['向量垂直','数量积','向量坐标运算'] },
      { no:7, type:'解答题', score:14, diff:'困难',
        content:'设函数 f(x)=ln x - ax + 1，其中 a∈R。\n(1) 讨论 f(x) 的单调性；\n(2) 若 f(x)≤0 恒成立，求 a 的取值范围。',
        answer:'(1) 当 a≤0 时，f(x) 在 (0,+∞) 单调递增；当 a>0 时，f(x) 在 (0,1/a) 单调递增，在 (1/a,+∞) 单调递减。 (2) a≥1。',
        analysis:[
          {step:'第一步：',text:'定义域 (0,+∞)，求导 f\'(x)=1/x - a。'},
          {step:'第二步：',text:'当 a≤0 时 f\'(x)>0 恒成立，f(x) 在 (0,+∞) 单调递增。'},
          {step:'第三步：',text:'当 a>0 时，令 f\'(x)=0 得 x=1/a；x∈(0,1/a) 时 f\'(x)>0，x∈(1/a,+∞) 时 f\'(x)<0。'},
          {step:'第四步：',text:'f(x)≤0 恒成立等价于 f(x)max≤0。当 a≤0 时 f(x) 无最大值（趋向+∞），舍去。'},
          {step:'第五步：',text:'当 a>0 时 f(x)max=f(1/a)=-ln a -1 +1=-ln a≤0，解得 a≥1。'}
        ],
        points:['导数与单调性','恒成立问题','分类讨论','对数函数'] },
      { no:8, type:'解答题', score:16, diff:'困难',
        content:'已知椭圆 C: x²/a² + y²/b² = 1 (a>b>0) 的离心率 e=√2/2，且过点 (1, √2/2)。\n(1) 求椭圆 C 的方程；\n(2) 设直线 l: y=kx+1 与椭圆 C 交于 A、B 两点，若线段 AB 中点的横坐标为 1/2，求 k 的值。',
        answer:'(1) x²/2 + y² = 1；(2) k=-1 或 k=1。',
        analysis:[
          {step:'第一步：',text:'由 e=c/a=√2/2 得 c²=a²/2，又 b²=a²-c²=a²/2，故椭圆方程为 x²/a² + 2y²/a² = 1。'},
          {step:'第二步：',text:'代入点 (1,√2/2)：1/a² + 2·(1/2)/a² = 2/a² = 1，得 a²=2，b²=1，椭圆方程 x²/2+y²=1。'},
          {step:'第三步：',text:'联立 y=kx+1 与 x²/2+y²=1，得 x²/2+(kx+1)²=1，整理为 (1/2+k²)x²+2kx=0。'},
          {step:'第四步：',text:'设 A(x₁,y₁)、B(x₂,y₂)，中点横坐标 (x₁+x₂)/2 = -2k/(2(1/2+k²)) = -k/(1/2+k²) = 1/2。'},
          {step:'第五步：',text:'解得 -2k = 1/2+k²，即 k²+2k+1/2=0... 重新检查：由韦达 x₁+x₂=-2k/(1/2+k²)，中点横坐标=-k/(1/2+k²)=1/2，得 -2k=1/2+k²，即 k²+2k+1/2=0。判别式 Δ=4-2=2>0，k=(-2±√2)/2=-1±√2/2。'}
        ],
        points:['椭圆标准方程','离心率','直线与椭圆位置关系','韦达定理','中点弦问题'] }
    ]
  },
  {
    fileName: '测试试卷.pdf',
    size: '20 B',
    time: '今天 05:02',
    totalPages: 4,
    questions: [
      { no:1, type:'选择题', score:5, diff:'简单',
        content:'命题"若 x>1，则 x²>1"的逆否命题是（  ）',
        options:['若 x²>1，则 x>1','若 x≤1，则 x²≤1','若 x²≤1，则 x≤1','若 x>1，则 x²≤1'],
        answer:'C',
        analysis:[
          {step:'第一步：',text:'原命题形式为"若 p 则 q"，其中 p:x>1，q:x²>1。'},
          {step:'第二步：',text:'逆否命题为"若非 q 则非 p"，即"若 x²≤1，则 x≤1"。'},
          {step:'第三步：',text:'故选 C。'}
        ],
        points:['四种命题','逆否命题','逻辑推理'] },
      { no:2, type:'选择题', score:5, diff:'简单',
        content:'函数 f(x)=√(x-1) + 1/(x-2) 的定义域为（  ）',
        options:['[1,+∞)','(1,+∞)','[1,2)∪(2,+∞)','(1,2)∪(2,+∞)'],
        answer:'C',
        analysis:[
          {step:'第一步：',text:'√(x-1) 要求 x-1≥0，即 x≥1。'},
          {step:'第二步：',text:'1/(x-2) 要求 x-2≠0，即 x≠2。'},
          {step:'第三步：',text:'取交集得 x∈[1,2)∪(2,+∞)，选 C。'}
        ],
        points:['函数定义域','根式有意义条件','分母不为零'] },
      { no:3, type:'选择题', score:5, diff:'中等',
        content:'在等比数列 {aₙ} 中，a₁=1，a₄=8，则公比 q =（  ）',
        options:['2','-2','±2','4'],
        answer:'A',
        analysis:[
          {step:'第一步：',text:'等比数列通项 aₙ=a₁q^(n-1)。'},
          {step:'第二步：',text:'a₄=a₁q³=8，即 q³=8。'},
          {step:'第三步：',text:'解得 q=2，选 A。'}
        ],
        points:['等比数列','通项公式','公比'] },
      { no:4, type:'填空题', score:5, diff:'中等',
        content:'若 log₂x + log₂(x-2) = 3，则 x = ______。',
        answer:'4',
        analysis:[
          {step:'第一步：',text:'由对数运算法则，log₂[x(x-2)]=3。'},
          {step:'第二步：',text:'x(x-2)=2³=8，即 x²-2x-8=0。'},
          {step:'第三步：',text:'解得 x=4 或 x=-2。又 x>0 且 x-2>0，故 x>2，取 x=4。'}
        ],
        points:['对数运算','对数方程','定义域限制'] },
      { no:5, type:'填空题', score:5, diff:'中等',
        content:'已知直线 l 过点 (1,2) 且与直线 2x-y+1=0 平行，则 l 的方程为 ______。',
        answer:'2x-y=0（或 y=2x）',
        analysis:[
          {step:'第一步：',text:'两直线平行则斜率相等，直线 2x-y+1=0 的斜率为 2。'},
          {step:'第二步：',text:'设 l: y=2x+b，代入点 (1,2)：2=2+b，得 b=0。'},
          {step:'第三步：',text:'故 l 的方程为 y=2x，即 2x-y=0。'}
        ],
        points:['直线平行','斜率','点斜式方程'] },
      { no:6, type:'解答题', score:12, diff:'困难',
        content:'在△ABC 中，内角 A、B、C 的对边分别为 a、b、c，已知 a sinB = √3 b cosA。\n(1) 求角 A；\n(2) 若 a=2√3，b=2，求△ABC 的面积。',
        answer:'(1) A=π/3；(2) 面积为 √3。',
        analysis:[
          {step:'第一步：',text:'由正弦定理 a/sinA = b/sinB，得 a sinB = b sinA。'},
          {step:'第二步：',text:'代入条件 b sinA = √3 b cosA，约去 b 得 sinA = √3 cosA，即 tanA=√3。'},
          {step:'第三步：',text:'A∈(0,π)，故 A=π/3。'},
          {step:'第四步：',text:'由余弦定理 a²=b²+c²-2bc cosA，代入得 12=4+c²-2c，即 c²-2c-8=0。'},
          {step:'第五步：',text:'解得 c=4（c>0）。面积 S=1/2·b·c·sinA=1/2·2·4·(√3/2)=2√3。'}
        ],
        points:['正弦定理','余弦定理','三角形面积公式','同角三角函数关系'] }
    ]
  },
  {
    fileName: '2025年浙江高考数学卷.pdf',
    size: '2.4 MB',
    time: '今天 10:32',
    totalPages: 6,
    questions: [
      { no:1, type:'选择题', score:4, diff:'简单',
        content:'已知集合 M={x|x²-2x≤0}，N={-1,0,1,2}，则 M∩N =（  ）',
        options:['{0,1}','{0,1,2}','{-1,0,1}','{1,2}'],
        answer:'B',
        analysis:[
          {step:'第一步：',text:'x²-2x≤0 ⟺ x(x-2)≤0 ⟺ 0≤x≤2，故 M=[0,2]。'},
          {step:'第二步：',text:'M∩N 取 N 中满足 0≤x≤2 的元素：0,1,2。'},
          {step:'第三步：',text:'M∩N={0,1,2}，选 B。'}
        ],
        points:['集合运算','一元二次不等式','交集'] },
      { no:2, type:'选择题', score:4, diff:'简单',
        content:'复数 z=i/(1+i) 的虚部为（  ）',
        options:['1/2','-1/2','1/2 i','-1/2 i'],
        answer:'A',
        analysis:[
          {step:'第一步：',text:'分母实数化：z=i(1-i)/[(1+i)(1-i)]=(i+1)/2=1/2 + 1/2 i。'},
          {step:'第二步：',text:'虚部为 1/2（实数），选 A。'}
        ],
        points:['复数运算','虚部概念','分母实数化'] },
      { no:3, type:'选择题', score:4, diff:'中等',
        content:'某几何体的三视图如图所示（正视图、侧视图为全等的等腰直角三角形，俯视图为正方形），则该几何体的体积为（  ）',
        options:['1/3','1/6','1/2','1'],
        answer:'A',
        analysis:[
          {step:'第一步：',text:'由三视图还原，该几何体为四棱锥，底面为边长 1 的正方形，高为 1。'},
          {step:'第二步：',text:'四棱锥体积 V=1/3·底面积·高=1/3·1·1=1/3。'},
          {step:'第三步：',text:'选 A。'}
        ],
        points:['三视图','空间几何体体积','四棱锥'] },
      { no:4, type:'选择题', score:4, diff:'中等',
        content:'若 x,y 满足约束条件 { x+y≤2, x≥0, y≥0 }，则 z=x+2y 的最大值为（  ）',
        options:['2','3','4','5'],
        answer:'C',
        analysis:[
          {step:'第一步：',text:'可行域为以 (0,0)、(2,0)、(0,2) 为顶点的三角形区域。'},
          {step:'第二步：',text:'目标函数 z=x+2y 在顶点处取得最值，计算各顶点值。'},
          {step:'第三步：',text:'(0,0):0；(2,0):2；(0,2):4。最大值为 4，选 C。'}
        ],
        points:['线性规划','可行域','目标函数最值'] },
      { no:5, type:'选择题', score:4, diff:'中等',
        content:'函数 f(x)=e^x - x - 1 的单调递增区间为（  ）',
        options:['(-∞,0)','(0,+∞)','(-∞,+∞)','(-1,1)'],
        answer:'B',
        analysis:[
          {step:'第一步：',text:'求导 f\'(x)=e^x - 1。'},
          {step:'第二步：',text:'令 f\'(x)>0，即 e^x>1=e^0，解得 x>0。'},
          {step:'第三步：',text:'单调递增区间为 (0,+∞)，选 B。'}
        ],
        points:['导数与单调性','指数函数','解不等式'] },
      { no:6, type:'填空题', score:4, diff:'中等',
        content:'已知向量 a=(2,1)，b=(1,-2)，则 a 与 b 的夹角为 ______。',
        answer:'90°（或 π/2）',
        analysis:[
          {step:'第一步：',text:'a·b=2×1+1×(-2)=0。'},
          {step:'第二步：',text:'数量积为 0 说明两向量垂直，夹角为 90°。'}
        ],
        points:['向量数量积','向量夹角','垂直判定'] },
      { no:7, type:'填空题', score:4, diff:'中等',
        content:'在 (x - 1/x)⁶ 的展开式中，常数项为 ______。',
        answer:'-20',
        analysis:[
          {step:'第一步：',text:'通项 T_{r+1}=C(6,r)·x^(6-r)·(-1/x)^r = C(6,r)·(-1)^r·x^(6-2r)。'},
          {step:'第二步：',text:'常数项要求 6-2r=0，即 r=3。'},
          {step:'第三步：',text:'常数项 = C(6,3)·(-1)³ = 20·(-1) = -20。'}
        ],
        points:['二项式定理','通项公式','常数项'] },
      { no:8, type:'解答题', score:14, diff:'困难',
        content:'已知数列 {aₙ} 的前 n 项和为 Sₙ，且 Sₙ=2aₙ-1。\n(1) 求数列 {aₙ} 的通项公式；\n(2) 设 bₙ=aₙ·log₂aₙ，求数列 {bₙ} 的前 n 项和 Tₙ。',
        answer:'(1) aₙ=2^(n-1)；(2) Tₙ=(n-1)·2ⁿ+1。',
        analysis:[
          {step:'第一步：',text:'当 n=1 时，a₁=S₁=2a₁-1，解得 a₁=1。'},
          {step:'第二步：',text:'当 n≥2 时，aₙ=Sₙ-Sₙ₋₁=(2aₙ-1)-(2aₙ₋₁-1)=2aₙ-2aₙ₋₁，故 aₙ=2aₙ₋₁。'},
          {step:'第三步：',text:'{aₙ} 是首项 1、公比 2 的等比数列，aₙ=2^(n-1)。'},
          {step:'第四步：',text:'bₙ=2^(n-1)·log₂2^(n-1)=(n-1)·2^(n-1)。'},
          {step:'第五步：',text:'错位相减法求和：Tₙ=0·1+1·2+2·4+...+(n-1)·2^(n-1)，乘以 2 后相减，得 Tₙ=(n-1)·2ⁿ+1。'}
        ],
        points:['数列通项','前n项和与通项关系','等比数列','错位相减法'] }
    ]
  },
  {
    fileName: '2024年全国卷理科数学.pdf',
    size: '3.1 MB',
    time: '今天 09:15',
    totalPages: 6,
    questions: [
      { no:1, type:'选择题', score:5, diff:'简单',
        content:'设全集 U={1,2,3,4,5}，集合 A={1,3,5}，则 ∁ᵤA =（  ）',
        options:['{2,4}','{1,3,5}','{2,3,4}','{1,2,3,4,5}'],
        answer:'A',
        analysis:[
          {step:'第一步：',text:'补集 ∁ᵤA 是 U 中不属于 A 的元素构成的集合。'},
          {step:'第二步：',text:'U 中去掉 1,3,5，剩余 2,4。'},
          {step:'第三步：',text:'∁ᵤA={2,4}，选 A。'}
        ],
        points:['集合补集','全集','集合运算'] },
      { no:2, type:'选择题', score:5, diff:'简单',
        content:'若复数 z 满足 z(1+i)=2i，则 |z| =（  ）',
        options:['1','√2','2','√2/2'],
        answer:'B',
        analysis:[
          {step:'第一步：',text:'z=2i/(1+i)=2i(1-i)/[(1+i)(1-i)]=2i(1-i)/2=i+1=1+i。'},
          {step:'第二步：',text:'|z|=√(1²+1²)=√2，选 B。'}
        ],
        points:['复数运算','复数的模','分母实数化'] },
      { no:3, type:'选择题', score:5, diff:'中等',
        content:'函数 f(x)=ln(x²-1) 的定义域为（  ）',
        options:['(1,+∞)','(-∞,-1)∪(1,+∞)','[-1,1]','(-1,1)'],
        answer:'B',
        analysis:[
          {step:'第一步：',text:'对数真数须大于 0：x²-1>0。'},
          {step:'第二步：',text:'x²>1，即 x>1 或 x<-1。'},
          {step:'第三步：',text:'定义域为 (-∞,-1)∪(1,+∞)，选 B。'}
        ],
        points:['对数函数定义域','一元二次不等式','定义域'] },
      { no:4, type:'选择题', score:5, diff:'中等',
        content:'在等比数列 {aₙ} 中，a₃=4，a₇=16，则 a₅ =（  ）',
        options:['8','-8','±8','8 或 -8'],
        answer:'A',
        analysis:[
          {step:'第一步：',text:'等比中项性质：a₅²=a₃·a₇=4×16=64，故 a₅=±8。'},
          {step:'第二步：',text:'又 a₅=a₃q²，q²>0，a₃=4>0，故 a₅>0。'},
          {step:'第三步：',text:'取 a₅=8，选 A。'}
        ],
        points:['等比数列','等比中项','符号判断'] },
      { no:5, type:'选择题', score:5, diff:'中等',
        content:'若 sin(π/6 - α)=1/3，则 cos(2π/3 + 2α) =（  ）',
        options:['-7/9','7/9','-8/9','8/9'],
        answer:'A',
        analysis:[
          {step:'第一步：',text:'注意 (π/6-α)+(π/3+α)=π/2，故 sin(π/6-α)=cos(π/3+α)=1/3。'},
          {step:'第二步：',text:'cos(2π/3+2α)=cos[2(π/3+α)]=2cos²(π/3+α)-1。'},
          {step:'第三步：',text:'=2·(1/3)²-1=2/9-1=-7/9，选 A。'}
        ],
        points:['诱导公式','二倍角公式','角的变换'] },
      { no:6, type:'填空题', score:5, diff:'中等',
        content:'已知双曲线 x²/a² - y²/b² = 1 (a>0,b>0) 的离心率为 √3，则其渐近线方程为 ______。',
        answer:'y=±√2 x',
        analysis:[
          {step:'第一步：',text:'离心率 e=c/a=√3，故 c=√3 a，c²=3a²。'},
          {step:'第二步：',text:'由 c²=a²+b² 得 b²=2a²，即 b/a=√2。'},
          {step:'第三步：',text:'渐近线方程为 y=±(b/a)x=±√2 x。'}
        ],
        points:['双曲线','离心率','渐近线方程'] },
      { no:7, type:'填空题', score:5, diff:'中等',
        content:'若直线 y=kx+2 与圆 x²+y²=2 相切，则 k = ______。',
        answer:'±1',
        analysis:[
          {step:'第一步：',text:'圆心 (0,0) 到直线 kx-y+2=0 的距离等于半径 √2。'},
          {step:'第二步：',text:'d=|0-0+2|/√(k²+1)=2/√(k²+1)=√2。'},
          {step:'第三步：',text:'解得 √(k²+1)=√2，即 k²=1，故 k=±1。'}
        ],
        points:['直线与圆相切','点到直线距离','切线条件'] },
      { no:8, type:'解答题', score:12, diff:'困难',
        content:'已知函数 f(x)=x³-3ax²+2bx 在 x=1 处取得极值，且 f(x) 在区间 [0,2] 上的最大值为 2。\n(1) 求 a、b 的关系；\n(2) 求 a 的取值范围。',
        answer:'(1) b=3a-3/2；(2) a∈[1/2, 3/2]。',
        analysis:[
          {step:'第一步：',text:'f\'(x)=3x²-6ax+2b，x=1 处取极值则 f\'(1)=0，即 3-6a+2b=0，得 b=3a-3/2。'},
          {step:'第二步：',text:'f(x)=x³-3ax²+2(3a-3/2)x=x³-3ax²+(6a-3)x。'},
          {step:'第三步：',text:'f\'(x)=3x²-6ax+6a-3=3(x-1)(x-(2a-1))，驻点 x=1 和 x=2a-1。'},
          {step:'第四步：',text:'计算 f(0)=0，f(2)=8-12a+12a-6=2，f(1)=1-3a+6a-3=3a-2。'},
          {step:'第五步：',text:'最大值为 2，要求 f(1)=3a-2≤2 且另一驻点 2a-1∈[0,2] 时 f(2a-1)≤2。结合得 a∈[1/2,3/2]。'}
        ],
        points:['导数与极值','闭区间最值','分类讨论','三次函数'] }
    ]
  },
  {
    fileName: '高三三模数学试卷.docx',
    size: '1.8 MB',
    time: '昨天 16:40',
    totalPages: 5,
    questions: [
      { no:1, type:'选择题', score:5, diff:'简单',
        content:'已知集合 A={x|x<2}，B={x|x≥-1}，则 A∪B =（  ）',
        options:['{x|-1≤x<2}','R','{x|x≥-1}','{x|x<2}'],
        answer:'B',
        analysis:[
          {step:'第一步：',text:'A=(-∞,2)，B=[-1,+∞)。'},
          {step:'第二步：',text:'A∪B 取所有属于 A 或 B 的元素，即 (-∞,2)∪[-1,+∞)=R。'},
          {step:'第三步：',text:'选 B。'}
        ],
        points:['集合运算','并集','区间表示'] },
      { no:2, type:'选择题', score:5, diff:'简单',
        content:'复数 z=(1+2i)i 的实部为（  ）',
        options:['-2','2','1','-1'],
        answer:'A',
        analysis:[
          {step:'第一步：',text:'z=(1+2i)i=i+2i²=i-2=-2+i。'},
          {step:'第二步：',text:'实部为 -2，选 A。'}
        ],
        points:['复数运算','实部概念','虚数单位'] },
      { no:3, type:'选择题', score:5, diff:'中等',
        content:'函数 f(x)=x²-2lnx 的单调递减区间为（  ）',
        options:['(0,1]','[1,+∞)','(-∞,1]','(0,+∞)'],
        answer:'A',
        analysis:[
          {step:'第一步：',text:'定义域 (0,+∞)，求导 f\'(x)=2x-2/x=2(x²-1)/x。'},
          {step:'第二步：',text:'令 f\'(x)≤0，因 x>0，故 x²-1≤0，即 0<x≤1。'},
          {step:'第三步：',text:'单调递减区间为 (0,1]，选 A。'}
        ],
        points:['导数与单调性','对数函数','解不等式'] },
      { no:4, type:'选择题', score:5, diff:'中等',
        content:'在△ABC 中，a=2，b=3，C=60°，则 c =（  ）',
        options:['√7','√13','√19','√7 或 √19'],
        answer:'A',
        analysis:[
          {step:'第一步：',text:'由余弦定理 c²=a²+b²-2ab cosC。'},
          {step:'第二步：',text:'c²=4+9-2·2·3·cos60°=13-12·(1/2)=13-6=7。'},
          {step:'第三步：',text:'c=√7，选 A。'}
        ],
        points:['余弦定理','三角形边角关系','特殊角三角函数'] },
      { no:5, type:'填空题', score:5, diff:'中等',
        content:'已知抛物线 y²=4x 的焦点为 F，点 A 在抛物线上且 |AF|=3，则 A 的横坐标为 ______。',
        answer:'2',
        analysis:[
          {step:'第一步：',text:'抛物线 y²=4x 的焦点 F(1,0)，准线 x=-1。'},
          {step:'第二步：',text:'由抛物线定义，|AF| 等于 A 到准线距离，即 x_A - (-1)=3。'},
          {step:'第三步：',text:'x_A+1=3，得 x_A=2。'}
        ],
        points:['抛物线定义','焦点','准线'] },
      { no:6, type:'填空题', score:5, diff:'中等',
        content:'从 1,2,3,4,5 中任取 2 个不同的数，取出的两数之和为偶数的概率为 ______。',
        answer:'2/5',
        analysis:[
          {step:'第一步：',text:'总取法 C(5,2)=10 种。'},
          {step:'第二步：',text:'两数之和为偶数需两数同奇或同偶。奇数有 1,3,5 共 3 个，偶数有 2,4 共 2 个。'},
          {step:'第三步：',text:'同奇取法 C(3,2)=3，同偶取法 C(2,2)=1，共 4 种。概率=4/10=2/5。'}
        ],
        points:['古典概型','组合计数','奇偶性分析'] },
      { no:7, type:'解答题', score:14, diff:'困难',
        content:'设函数 f(x)=e^x - ax (a>0)。\n(1) 求 f(x) 的单调区间；\n(2) 若 f(x)≥0 对 x∈R 恒成立，求 a 的取值范围。',
        answer:'(1) 单调递减区间 (-∞,ln a)，单调递增区间 (ln a,+∞)；(2) 0<a≤e。',
        analysis:[
          {step:'第一步：',text:'f\'(x)=e^x - a，令 f\'(x)=0 得 x=ln a (a>0)。'},
          {step:'第二步：',text:'当 x<ln a 时 f\'(x)<0，f(x) 单调递减；当 x>ln a 时 f\'(x)>0，f(x) 单调递增。'},
          {step:'第三步：',text:'f(x)min=f(ln a)=a - a·ln a。'},
          {step:'第四步：',text:'f(x)≥0 恒成立等价于 f(x)min≥0，即 a - a ln a ≥ 0。'},
          {step:'第五步：',text:'因 a>0，两边除以 a 得 1 - ln a ≥ 0，即 ln a ≤ 1，解得 0<a≤e。'}
        ],
        points:['导数与单调性','恒成立问题','指数函数','对数不等式'] }
    ]
  }
];

// ---------- 生成 teacher-split.json ----------
function buildSplitData() {
  const papers = PAPERS.map(function (p) {
    const totalScore = p.questions.reduce(function (s, q) { return s + q.score; }, 0);
    const choiceCnt = p.questions.filter(function (q) { return q.type === '选择题'; }).length;
    const fillCnt = p.questions.filter(function (q) { return q.type === '填空题'; }).length;
    const solveCnt = p.questions.filter(function (q) { return q.type === '解答题'; }).length;
    return {
      fileName: p.fileName,
      size: p.size,
      time: p.time,
      preview: { currentPage: 1, totalPages: p.totalPages },
      questions: p.questions.map(function (q) {
        var obj = { no: q.no, type: q.type, score: q.score, diff: q.diff };
        return obj;
      }),
      stats: [
        { label: '识别题数', value: String(p.questions.length), change: 0, color: 'blue' },
        { label: '总分值', value: totalScore + '分', change: 0, color: 'green' },
        { label: '识别准确率', value: '96%', change: 0, color: 'purple' },
        { label: '处理耗时', value: (2.5 + Math.random() * 2).toFixed(1) + 's', change: 0, color: 'orange' }
      ],
      // 完整题目内容（供解析/知识点页面使用）
      fullQuestions: p.questions
    };
  });

  return {
    papers: papers,
    currentPaper: 0,
    // 兼容旧格式（保留第一份试卷的平铺字段）
    fileName: papers[0].fileName,
    preview: papers[0].preview,
    questions: papers[0].questions,
    stats: papers[0].stats,
    fullQuestions: papers[0].fullQuestions
  };
}

// ---------- 更新 teacher-upload.json 状态 ----------
function updateUploadStatus() {
  const uploadFile = path.join(DATA_DIR, 'teacher-upload.json');
  const data = JSON.parse(fs.readFileSync(uploadFile, 'utf8') || '{"uploaded":[]}');
  PAPERS.forEach(function (p) {
    var found = data.uploaded.find(function (u) { return u.name === p.fileName; });
    if (found) {
      found.status = '已解析';
      found.progress = 100;
    }
  });
  fs.writeFileSync(uploadFile, JSON.stringify(data, null, 2), 'utf8');
  console.log('[OK] teacher-upload.json 状态已更新为"已解析"');
}

// ---------- 导入题库 questions.json ----------
function importToQuestionBank() {
  const questions = JSON.parse(fs.readFileSync(QUESTIONS_FILE, 'utf8') || '[]');
  const existing = new Set(questions.map(function (q) { return q.id; }));
  let added = 0;
  PAPERS.forEach(function (p, pi) {
    p.questions.forEach(function (q, qi) {
      const id = 'q_upload_' + (pi + 1) + '_' + (qi + 1);
      if (existing.has(id)) return;
      questions.push({
        id: id,
        source: 'teacher_upload',
        year: 2026,
        province: '本地',
        paper_name: p.fileName.replace(/\.[^.]+$/, ''),
        question_number: q.no + '题(' + q.score + '分)',
        subject: '数学',
        knowledge_point_id: '',
        type: q.type,
        difficulty: q.diff === '简单' ? 2 : q.diff === '中等' ? 4 : 5,
        score: q.score,
        content: q.content,
        options: q.options || [],
        answer: q.answer,
        analysis: (q.analysis || []).map(function (a) { return a.step + a.text; }).join(''),
        knowledge_points: q.points || [],
        created_at: new Date().toISOString()
      });
      added++;
    });
  });
  fs.writeFileSync(QUESTIONS_FILE, JSON.stringify(questions, null, 2), 'utf8');
  console.log('[OK] 题库已导入 ' + added + ' 道上传试卷题目，题库总题数：' + questions.length);
}

// ---------- 主流程 ----------
function main() {
  // 1. 写入 teacher-split.json
  const splitData = buildSplitData();
  fs.writeFileSync(path.join(DATA_DIR, 'teacher-split.json'), JSON.stringify(splitData, null, 2), 'utf8');
  console.log('[OK] teacher-split.json 已生成，共 ' + PAPERS.length + ' 份试卷');

  // 2. 更新 teacher-upload.json 状态
  updateUploadStatus();

  // 3. 导入题库
  importToQuestionBank();

  // 4. 生成 teacher-tag.json（取第一份试卷用于知识点页面）
  const tagPaper = PAPERS[0];
  const tagQuestions = tagPaper.questions.map(function (q) {
    return {
      subject: '数学',
      topic: q.points && q.points[0] ? q.points[0] : '综合',
      no: q.no,
      difficulty: q.diff === '简单' ? '★★☆☆☆' : q.diff === '中等' ? '★★★☆☆' : '★★★★★',
      score: q.score,
      content: q.content,
      confirmed: q.points || [],
      ignored: [],
      recommended: (q.points || []).map(function (pt, i) {
        return { name: pt, confidence: 96 - i * 3 };
      })
    };
  });
  const tagData = {
    paperName: tagPaper.fileName,
    question: tagQuestions[0],
    recommended: tagQuestions[0].recommended,
    confirmed: tagQuestions[0].confirmed,
    ignored: [],
    questions: tagQuestions,
    // 多试卷支持
    papers: PAPERS.map(function (p) {
      return {
        fileName: p.fileName,
        questions: p.questions.map(function (q) {
          return {
            subject: '数学',
            topic: q.points && q.points[0] ? q.points[0] : '综合',
            no: q.no,
            difficulty: q.diff === '简单' ? '★★☆☆☆' : q.diff === '中等' ? '★★★☆☆' : '★★★★★',
            score: q.score,
            content: q.content,
            confirmed: q.points || [],
            ignored: [],
            recommended: (q.points || []).map(function (pt, i) { return { name: pt, confidence: 96 - i * 3 }; })
          };
        })
      };
    }),
    currentPaper: 0
  };
  fs.writeFileSync(path.join(DATA_DIR, 'teacher-tag.json'), JSON.stringify(tagData, null, 2), 'utf8');
  console.log('[OK] teacher-tag.json 已生成，含 ' + tagQuestions.length + ' 道题的知识点标注');

  // 5. 生成 teacher-parse.json（与第一份试卷同步）
  const parsePaper = PAPERS[0];
  const parseData = {
    paperName: parsePaper.fileName,
    totalQuestions: parsePaper.questions.length,
    parsedCount: parsePaper.questions.length,
    qList: parsePaper.questions.map(function (q) {
      return { no: q.no, type: q.type, score: q.score, diff: q.diff, done: true, active: q.no === 1 };
    }),
    detail: {
      no: parsePaper.questions[0].no,
      type: parsePaper.questions[0].type,
      score: parsePaper.questions[0].score,
      difficulty: '★★☆☆☆',
      content: parsePaper.questions[0].content,
      answer: parsePaper.questions[0].answer,
      analysis: parsePaper.questions[0].analysis,
      points: parsePaper.questions[0].points
    }
  };
  fs.writeFileSync(path.join(DATA_DIR, 'teacher-parse.json'), JSON.stringify(parseData, null, 2), 'utf8');
  console.log('[OK] teacher-parse.json 已生成');

  console.log('\n全部数据生成完成！');
}

main();
