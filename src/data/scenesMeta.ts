import type { SceneId, SceneMeta } from '../types/game';

export const SCENES_META: SceneMeta[] = [
  {
    id: 'platform',
    name: '高处平台',
    item: '生锈的风速杯',
    desc: '从平台风标上拆下的小铝杯，迎风时会轻响。',
  },
  {
    id: 'hellstone',
    name: '地狱石平台',
    item: '黑曜石余烬',
    desc: '表面还温热的暗红碎石，边缘锋利。',
  },
  {
    id: 'office',
    name: '写字楼念词',
    item: '折叠发言稿',
    desc: '折痕很深的一页A4纸，角落用红笔标着重音。',
  },
  {
    id: 'mall',
    name: '大商场汉堡店',
    item: '热敏点餐小票',
    desc: '84号餐，双层牛肉少酸黄瓜，油墨有点淡了。',
  },
  {
    id: 'garage',
    name: '地下车库',
    item: 'B2层停车券',
    desc: '边缘被闸机压出一道折痕的纸质计时卡。',
  },
  {
    id: 'infirmary',
    name: '小学医务室',
    item: '玻璃体温计盒',
    desc: '塑料外壳有点发黄，里面垫着一小团脱脂棉。',
  },
  {
    id: 'school_bbq',
    name: '小学门外烧烤',
    item: '半截白粉笔',
    desc: '混着一点炭烤孜然味，窗台边捡到的。',
  },
  {
    id: 'zigzag',
    name: '之字形台阶花田',
    item: '干枯小雏菊',
    desc: '夹在台阶扶手缝隙里的花瓣，还带着泥土气。',
  },
  {
    id: 'park_lot',
    name: '小区林荫停车场',
    item: '掉落的香樟叶',
    desc: '脉络清晰，揉一下有淡淡的樟脑清香。',
  },
  {
    id: 'hospital',
    name: '医院厚门走廊',
    item: '蓝色腕带扣',
    desc: '无菌室门外长椅底下拾到的备用塑料卡扣。',
  },
  {
    id: 'airport',
    name: '机场登机玻璃门',
    item: '撕半登机牌',
    desc: '座位14A，登机口3号，纸边毛糙。',
  },
  {
    id: 'waterpark',
    name: '商场水上乐园',
    item: '草莓味硬糖纸',
    desc: '被水汽润软的半透明糖纸，印着海洋气泡。',
  },
  {
    id: 'convenience',
    name: '便利店与修路木道',
    item: '关东煮竹签',
    desc: '上面烫着店名印章，关门前最后一根萝卜留下的。',
  },
  {
    id: 'subway',
    name: '多线地铁站',
    item: '旧磁条单程票',
    desc: '卡面磨出了细纹，背面印着早高峰换乘图。',
  },
  {
    id: 'studio',
    name: '小画室',
    item: '挤扁的群青颜料',
    desc: '金属管口干结了一圈蓝色，瓶身全是手印。',
  },
  {
    id: 'cave',
    name: '幽深洞穴',
    item: '湿润方解石',
    desc: '在手电光下泛着微弱蜂蜜色折光的小矿石。',
  },
];

export function sceneIdxById(id: SceneId): number {
  return SCENES_META.findIndex((m) => m.id === id);
}
