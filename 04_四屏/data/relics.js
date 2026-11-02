/* YUEBOX · 文物数据源
   依据 01 文档 §1.2 已核事实 + P1 选题表。
   每件文物的图版比例、热点坐标、工艺分解均独立。 */

window.RELICS = {
  molong: {
    id: 'molong', code: 'C1', name: '墨龙图', dynasty: '南宋',
    material: '绢本墨笔', size: '205.3 × 131 cm',
    img: 'img/c1_molong.jpg', ratio: 1.567, plate: 'silk',
    category: '馆藏书画', feature: true, seq: '01',
    tag: '数字复现',
    what: '南宋画家陈容所绘，粤博最名贵的古画之一，一级文物。',
    why: '墨分五色、浓淡破墨，龙身 S 形扭转，云雾全靠留白。',
    how: '原件不对外展出——正因如此，这里提供数字复现与局部放大，让看不到的细节被看见。',
    hotspots: [
      { x: 30, y: 22, title: '龙首', text: '龙首回望，须发以极细的笔线一根根勾出，浓墨压住结构，淡墨晕出体积。' },
      { x: 72, y: 50, title: '龙身', text: 'S 形扭转贯穿整幅，墨色由浓到淡分五层，越往后越淡，像从云里退出来。' },
      { x: 26, y: 74, title: '云雾', text: '云雾不画，靠留白。空白处就是云，龙身在空白里显形。' }
    ],
    craft: [
      { k: '绢本托裱', n: '01' },
      { k: '浓淡破墨', n: '02' },
      { k: '破墨留白', n: '03' }
    ]
  },

  shenkan: {
    id: 'shenkan', code: 'C2', name: '大神龛', dynasty: '清',
    material: '潮州金漆木雕', size: '高 330 × 宽 231 × 深 145 cm',
    img: 'img/c2_shenkan.jpg', ratio: 1.333, plate: 'lacquer',
    category: '潮州木雕', feature: true, seq: '02',
    tag: '金漆木雕',
    what: '潮州民间供奉祖先牌位的大型木雕龛，国宝一级文物，曾登央视《国家宝藏》。',
    why: '通体贴金、多层次镂通雕，一个龛里叠了十几层人物与花鸟，光走进去要拐好几道。',
    how: '先看它有多大——三米三高，比人还高。再看镂空：同样的光穿过十几层，越深越暗，所以显得「有洞」。',
    hotspots: [
      { x: 50, y: 18, title: '龛顶', text: '龛顶做成了潮汕民居的屋顶形制，脊上还立着人物，像把一座祠堂缩进了柜子。' },
      { x: 24, y: 52, title: '镂通雕', text: '十几层木料一层层凿通再叠起来，人物和花鸟能透过去看见后面的光。' },
      { x: 74, y: 78, title: '金漆', text: '通体贴金箔，再上一层漆固色。金色不是刷的，是一张张贴上去的。' }
    ],
    craft: [
      { k: '选樟木', n: '01' },
      { k: '镂通雕刻', n: '02' },
      { k: '贴金上漆', n: '03' }
    ]
  },

  houwang: {
    id: 'houwang', code: 'C3', name: '猴王砚', dynasty: '清光绪',
    material: '端石', size: '25.5 × 17.6 × 2.7 cm',
    img: 'img/c3_houwangyan.png', ratio: 1.503, plate: 'stone',
    category: '端砚', feature: true, seq: '03',
    tag: '端石工艺',
    what: '清末广东「三大名砚」之一，用端溪老坑大西洞石制成，粤博镇馆级藏品。',
    why: '石里天然长着一只猴子的纹路，砚工顺着纹路刻出猴形——不是刻上去的，是「看出来」的。',
    how: '先看颜色：紫蓝。再看那只猴——它一半是石头本身的纹，一半是人刻的线，交界处最难分。',
    hotspots: [
      { x: 46, y: 34, title: '猴纹', text: '石中天然的石品花纹形似猴子，砚工因势象形，只在关键处补几刀。' },
      { x: 30, y: 62, title: '紫蓝石色', text: '端溪老坑大西洞石，色紫蓝带青，细腻发墨，是端石里最上等的坑口。' },
      { x: 70, y: 72, title: '砚堂', text: '中间平处用来研墨，久用会磨出一道凹，叫「墨堂」。' }
    ],
    craft: [
      { k: '采石', n: '01' },
      { k: '因势象形', n: '02' },
      { k: '雕刻配盒', n: '03' }
    ]
  },

  guangcai: {
    id: 'guangcai', code: 'C9', name: '广彩龙纹双象耳瓶', dynasty: '清·道光',
    material: '瓷胎釉上彩描金', size: '盘口 · 长颈 · 鼓腹 · 圈足',
    img: 'img/c9_guangcai.jpg', ratio: 1.333, plate: 'porcelain',
    category: '历代陶瓷', feature: false, seq: '04',
    tag: '广彩织金',
    what: '广州织金彩瓷代表作。景德镇烧好白胎运到广州，再由广州画师加彩、低温复烧。',
    why: '它是中国最早为外国客户「定制」的商品之一——器型、纹样都按海外订单来，是设计史而非文物史。',
    how: '数金线：肩部如意云头、腹部龙纹、双耳象首，全是金。广彩的本事就是把金画得像绣上去的。',
    hotspots: [
      { x: 50, y: 20, title: '绿地粉彩', text: '颈部用绿彩打底再画花蝶，是广彩常见的「满地」画法。' },
      { x: 28, y: 46, title: '描金开光', text: '肩部蓝彩描金的如意云头，圈出一块「开光」区域，里面再画折枝花。' },
      { x: 66, y: 68, title: '金彩龙纹', text: '腹部云龙全部用金描出，金层有明显厚度，光下有金属的反光。' }
    ],
    craft: [
      { k: '景德镇制胎', n: '01' },
      { k: '广州加彩', n: '02' },
      { k: '低温复烧', n: '03' }
    ]
  },

  fan: {
    id: 'fan', code: 'C8', name: '省港澳港口风景图折扇', dynasty: '19 世纪',
    material: '纸本彩绘 · 竹骨', size: '外销折扇',
    img: 'img/c8_fan.jpg', ratio: 1.333, plate: 'silk',
    category: '广府工艺', feature: false, seq: '05',
    tag: '外销扇',
    what: '清代外销工艺品，扇面绘省港澳三地港口风景，是当时外国人对广东的第一印象。',
    why: '扇子是可携带的城市图像——把一座城折起来带走，这是最早的「旅游纪念品设计」。',
    how: '看扇骨分格：画面顺着扇形铺开，三座城被分在三个弧段里，合起来是一整个珠江口。',
    hotspots: [
      { x: 50, y: 26, title: '港口全景', text: '扇面中央画的是珠江口，能认出对岸的楼、江上的船。' },
      { x: 22, y: 58, title: '扇骨', text: '竹骨上也有装饰，展开时像一排细密的栅栏。' },
      { x: 76, y: 60, title: '彩绘', text: '纸本彩绘，颜色是矿物与植物颜料，两百年后仍然鲜。' }
    ],
    craft: [
      { k: '制骨', n: '01' },
      { k: '绘扇面', n: '02' },
      { k: '折叠装裱', n: '03' }
    ]
  },

  guangxiu: {
    id: 'guangxiu', code: 'C6', name: '广绣孔雀花卉纹插屏', dynasty: '清代',
    material: '丝质刺绣', size: '满地施绣',
    img: 'img/c6_guangxiu.jpg', ratio: 1.333, plate: 'silk',
    category: '广府工艺', feature: false, seq: '06',
    tag: '广绣',
    what: '广绣代表作，满地施绣的孔雀与花卉纹插屏，一件绣品就是几百个工时。',
    why: '它是「时间」的可视化——针脚密到看不出针脚，远看像画，近看全是线。',
    how: '退后看整体，是画；凑近看局部，是无数根丝线。广绣的本事是让线消失在图像里。',
    hotspots: [
      { x: 50, y: 30, title: '孔雀', text: '孔雀尾羽用劈丝绣，一根丝线劈成十几股，才能绣出羽毛的渐变。' },
      { x: 26, y: 62, title: '满地施绣', text: '底色也绣满，不留空白。整幅没有一处是布的本来颜色。' },
      { x: 74, y: 68, title: '丝光', text: '丝线有方向性，转动角度时整片花纹会一起变亮或变暗。' }
    ],
    craft: [
      { k: '劈丝', n: '01' },
      { k: '勾勒轮廓', n: '02' },
      { k: '满地施绣', n: '03' }
    ]
  },

  jinji: {
    id: 'jinji', code: 'C10', name: '金鸡报晓', dynasty: '现代',
    material: '玉雕', size: '约 24.5 × 15 × 17.5 cm',
    img: 'img/c10_jinji.jpg', ratio: 1.333, plate: 'stone',
    category: '广府工艺', feature: false, seq: '07',
    tag: '玉雕',
    what: '玉雕摆件，取整块玉料雕成一只报晓的雄鸡，连鸡皮的颗粒感都雕了出来。',
    why: '它是「会开玩笑的玉」——把最贵的材料，雕成最日常的一只白切鸡。',
    how: '看玉色怎么用：鸡冠用玉料本身的糖色，鸡身用青白，一块料分出两种颜色。',
    hotspots: [
      { x: 34, y: 28, title: '鸡冠', text: '用玉料表层的糖色雕成，不用另外上色。' },
      { x: 56, y: 52, title: '羽毛颗粒', text: '一颗颗凿出来的凹凸，模仿鸡皮上的毛孔。' },
      { x: 30, y: 74, title: '玉色分层', text: '同一块料，外层偏黄，内层偏青，工匠顺着颜色分层来安排部位。' }
    ],
    craft: [
      { k: '相玉', n: '01' },
      { k: '凿坯', n: '02' },
      { k: '细琢抛光', n: '03' }
    ]
  }
};

/* 按类目归类，供分类页使用 */
window.CATEGORIES = [
  { key: 'duanyan',   name: '端砚',     sub: '端石工艺',   relic: 'houwang',  plate: 'stone' },
  { key: 'chaozhou',  name: '潮州木雕', sub: '金漆工艺',   relic: 'shenkan',  plate: 'lacquer' },
  { key: 'taoci',     name: '历代陶瓷', sub: '广彩与窑口', relic: 'guangcai', plate: 'porcelain' },
  { key: 'shuhua',    name: '馆藏书画', sub: '绢本墨笔',   relic: 'molong',   plate: 'silk' },
  { key: 'guangfu',   name: '广府工艺', sub: '织绣 · 外销', relic: 'fan',     plate: 'silk' }
];

window.FEATURED = ['molong', 'shenkan', 'houwang'];
