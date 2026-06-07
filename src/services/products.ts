// 产品数据服务
import type { BudgetLevel } from '@/types';

// 本地Product类型定义
interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price_min: number;
  price_max: number;
  budget_level: BudgetLevel;
  skin_types: string[];
  suitable_age_groups: string[];
  image_url: string;
  description: string;
  ingredients: string[];
  purchase_url: string;
  rating: number;
  review_count: number;
}

// 生成唯一ID的辅助函数
const generateUUID = (seed: string): string => {
  return `prod-${seed.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 产品数据库
const productsDatabase: Product[] = [
  // 1-10
  { id: generateUUID('百雀羚-水嫩倍现'), name: '水嫩倍现保湿精华霜', brand: '百雀羚', category: '面霜', price_min: 89, price_max: 129, budget_level: 'budget', skin_types: ['干性', '混合性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', description: '经典国货，草本保湿，滋润不油腻', ingredients: ['草本精华', '透明质酸', '甘油'], purchase_url: '#', rating: 4.5, review_count: 12500 },
  { id: generateUUID('百雀羚-三生花'), name: '三生花面膜', brand: '百雀羚', category: '面膜', price_min: 59, price_max: 99, budget_level: 'budget', skin_types: ['混合性', '油性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400', description: '花萃精华，补水保湿，清爽控油', ingredients: ['花萃精华', '烟酰胺', '透明质酸'], purchase_url: '#', rating: 4.3, review_count: 8900 },
  { id: generateUUID('珀莱雅-红宝石'), name: '红宝石精华', brand: '珀莱雅', category: '精华', price_min: 299, price_max: 399, budget_level: 'premium', skin_types: ['混合性', '干性'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '抗老紧致，淡化细纹，修护肌肤', ingredients: ['视黄醇', '多肽', '神经酰胺'], purchase_url: '#', rating: 4.6, review_count: 15600 },
  { id: generateUUID('珀莱雅-双抗'), name: '双抗精华', brand: '珀莱雅', category: '精华', price_min: 239, price_max: 329, budget_level: 'mid', skin_types: ['混合性', '暗沉肌'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '抗氧化抗糖化，提亮肤色，改善暗沉', ingredients: ['虾青素', '肌肽', '烟酰胺'], purchase_url: '#', rating: 4.5, review_count: 13200 },
  { id: generateUUID('珀莱雅-源力'), name: '源力修护精华', brand: '珀莱雅', category: '精华', price_min: 199, price_max: 289, budget_level: 'mid', skin_types: ['敏感肌', '受损肌'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '修护屏障，舒缓敏感，强韧肌底', ingredients: ['神经酰胺', '积雪草', '泛醇'], purchase_url: '#', rating: 4.4, review_count: 9800 },
  { id: generateUUID('薇诺娜-特护霜'), name: '舒敏保湿特护霜', brand: '薇诺娜', category: '面霜', price_min: 268, price_max: 398, budget_level: 'premium', skin_types: ['敏感肌', '受损肌'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', description: '医学修护，舒缓敏感，深层保湿', ingredients: ['马齿苋', '青刺果', '神经酰胺'], purchase_url: '#', rating: 4.7, review_count: 22100 },
  { id: generateUUID('薇诺娜-防晒乳'), name: '清透防晒乳', brand: '薇诺娜', category: '防晒', price_min: 168, price_max: 268, budget_level: 'mid', skin_types: ['敏感肌', '混合性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', description: '敏感肌专用，物理防晒，清爽不油腻', ingredients: ['氧化锌', '二氧化钛', '马齿苋'], purchase_url: '#', rating: 4.5, review_count: 11500 },
  { id: generateUUID('玉泽-修护霜'), name: '皮肤屏障修护霜', brand: '玉泽', category: '面霜', price_min: 168, price_max: 288, budget_level: 'mid', skin_types: ['敏感肌', '受损肌'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', description: '医学修护，滋润保湿，重建屏障', ingredients: ['神经酰胺', '角鲨烷', '甘油'], purchase_url: '#', rating: 4.6, review_count: 8700 },
  { id: generateUUID('玉泽-修护精华'), name: '皮肤屏障修护精华', brand: '玉泽', category: '精华', price_min: 198, price_max: 328, budget_level: 'mid', skin_types: ['敏感肌', '受损肌'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '医学修护，重建屏障，舒缓敏感', ingredients: ['神经酰胺', '胆固醇', '脂肪酸'], purchase_url: '#', rating: 4.5, review_count: 7200 },
  { id: generateUUID('佰草集-新七白'), name: '新七白美白面膜', brand: '佰草集', category: '面膜', price_min: 168, price_max: 288, budget_level: 'mid', skin_types: ['混合性', '暗沉肌'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400', description: '七种本草美白，淡化色斑，提亮肤色', ingredients: ['白芍', '白蔹', '白芨', '白术', '白茯苓', '白珍珠', '白蒺藜'], purchase_url: '#', rating: 4.3, review_count: 6800 },

  // 11-20
  { id: generateUUID('佰草集-太极'), name: '太极日月精华', brand: '佰草集', category: '精华', price_min: 398, price_max: 598, budget_level: 'luxury', skin_types: ['混合性', '干性'], suitable_age_groups: ['35-44', '45+'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '日夜双精华，抗老修护，滋养紧致', ingredients: ['人参', '灵芝', '多肽', '胶原蛋白'], purchase_url: '#', rating: 4.6, review_count: 4200 },
  { id: generateUUID('自然堂-雪润'), name: '雪润皙白精华', brand: '自然堂', category: '精华', price_min: 228, price_max: 368, budget_level: 'mid', skin_types: ['混合性', '暗沉肌'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '喜马拉雅雪参，美白提亮，淡化色斑', ingredients: ['雪参', '烟酰胺', '维生素C'], purchase_url: '#', rating: 4.2, review_count: 8900 },
  { id: generateUUID('自然堂-冰川'), name: '冰川水面膜', brand: '自然堂', category: '面膜', price_min: 88, price_max: 158, budget_level: 'budget', skin_types: ['混合性', '油性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400', description: '喜马拉雅冰川水，深层补水，清爽保湿', ingredients: ['冰川水', '透明质酸', '矿物质'], purchase_url: '#', rating: 4.4, review_count: 10200 },
  { id: generateUUID('相宜本草-红景天'), name: '红景天焕亮精华', brand: '相宜本草', category: '精华', price_min: 198, price_max: 328, budget_level: 'mid', skin_types: ['混合性', '暗沉肌'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '红景天抗氧化，提亮肤色，淡化暗沉', ingredients: ['红景天', '烟酰胺', '维生素C'], purchase_url: '#', rating: 4.4, review_count: 7600 },
  { id: generateUUID('相宜本草-蚕丝'), name: '四倍蚕丝面膜', brand: '相宜本草', category: '面膜', price_min: 68, price_max: 128, budget_level: 'budget', skin_types: ['混合性', '干性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400', description: '蚕丝精华，深层补水，滋润保湿', ingredients: ['蚕丝蛋白', '透明质酸', '甘油'], purchase_url: '#', rating: 4.3, review_count: 9500 },
  { id: generateUUID('片仔癀-珍珠膏'), name: '皇后牌珍珠膏', brand: '片仔癀', category: '面霜', price_min: 68, price_max: 128, budget_level: 'budget', skin_types: ['混合性', '干性'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', description: '经典国货，珍珠美白，中药滋养', ingredients: ['珍珠粉', '片仔癀', '甘油'], purchase_url: '#', rating: 4.3, review_count: 11200 },
  { id: generateUUID('片仔癀-祛痘膏'), name: '片仔癀祛痘膏', brand: '片仔癀', category: '精华', price_min: 88, price_max: 158, budget_level: 'budget', skin_types: ['油性', '痘痘肌'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '中药祛痘，消炎镇静，修护痘印', ingredients: ['片仔癀', '水杨酸', '茶树精油'], purchase_url: '#', rating: 4.2, review_count: 6800 },
  { id: generateUUID('云南白药-面膜'), name: '采之汲面膜', brand: '云南白药', category: '面膜', price_min: 128, price_max: 228, budget_level: 'budget', skin_types: ['敏感肌', '混合性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400', description: '植物修护，舒缓敏感，补水保湿', ingredients: ['植物提取物', '透明质酸', '神经酰胺'], purchase_url: '#', rating: 4.4, review_count: 7800 },
  { id: generateUUID('云南白药-精华'), name: '采之汲精华', brand: '云南白药', category: '精华', price_min: 168, price_max: 298, budget_level: 'mid', skin_types: ['敏感肌', '混合性'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '植物滋养，修护屏障，温和护肤', ingredients: ['植物提取物', '神经酰胺', '透明质酸'], purchase_url: '#', rating: 4.3, review_count: 5600 },
  { id: generateUUID('马应龙-眼霜'), name: '八宝眼霜', brand: '马应龙', category: '眼霜', price_min: 128, price_max: 228, budget_level: 'budget', skin_types: ['混合性', '干性'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '中药眼霜，淡化黑眼圈，紧致眼周', ingredients: ['麝香', '珍珠', '冰片'], purchase_url: '#', rating: 4.1, review_count: 5200 },
  { id: generateUUID('马应龙-眼膜'), name: '八宝眼膜', brand: '马应龙', category: '眼膜', price_min: 98, price_max: 168, budget_level: 'budget', skin_types: ['混合性', '干性'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400', description: '中药眼膜，淡化细纹，紧致眼周', ingredients: ['麝香', '珍珠', '胶原蛋白'], purchase_url: '#', rating: 4.0, review_count: 3800 },

  // 21-30
  { id: generateUUID('敷尔佳-修复贴'), name: '医用透明质酸钠修复贴', brand: '敷尔佳', category: '面膜', price_min: 98, price_max: 168, budget_level: 'budget', skin_types: ['敏感肌', '受损肌'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400', description: '医用级修护，术后修复，舒缓镇静', ingredients: ['透明质酸钠', '胶原蛋白', '神经酰胺'], purchase_url: '#', rating: 4.6, review_count: 18500 },
  { id: generateUUID('敷尔佳-黑膜'), name: '黑膜', brand: '敷尔佳', category: '面膜', price_min: 128, price_max: 198, budget_level: 'mid', skin_types: ['油性', '痘痘肌'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400', description: '备长炭清洁，吸附油脂，净化毛孔', ingredients: ['备长炭', '透明质酸', '茶树精油'], purchase_url: '#', rating: 4.5, review_count: 13200 },
  { id: generateUUID('润百颜-玻尿酸'), name: '玻尿酸次抛原液', brand: '润百颜', category: '精华', price_min: 299, price_max: 459, budget_level: 'premium', skin_types: ['干性', '混合性'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '高浓度玻尿酸，深层补水，锁水保湿', ingredients: ['玻尿酸', '泛醇', '神经酰胺'], purchase_url: '#', rating: 4.5, review_count: 15600 },
  { id: generateUUID('润百颜-屏障'), name: '屏障次抛精华', brand: '润百颜', category: '精华', price_min: 269, price_max: 399, budget_level: 'premium', skin_types: ['敏感肌', '受损肌'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '修护屏障，舒缓敏感，强韧肌底', ingredients: ['神经酰胺', '积雪草', '泛醇'], purchase_url: '#', rating: 4.6, review_count: 9800 },
  { id: generateUUID('华熙生物-肌活'), name: '肌活糙米水', brand: '华熙生物', category: '爽肤水', price_min: 128, price_max: 198, budget_level: 'mid', skin_types: ['油性', '混合性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', description: '糙米发酵精华，控油补水，细腻毛孔', ingredients: ['糙米发酵液', '透明质酸', '烟酰胺'], purchase_url: '#', rating: 4.4, review_count: 11200 },
  { id: generateUUID('华熙生物-夸迪'), name: '夸迪次抛精华', brand: '华熙生物', category: '精华', price_min: 329, price_max: 499, budget_level: 'luxury', skin_types: ['混合性', '干性'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '高端抗老，紧致提拉，淡化细纹', ingredients: ['多肽', '视黄醇', '玻尿酸'], purchase_url: '#', rating: 4.7, review_count: 7600 },
  { id: generateUUID('米蓓尔-粉水'), name: '粉水', brand: '米蓓尔', category: '爽肤水', price_min: 98, price_max: 158, budget_level: 'budget', skin_types: ['敏感肌', '混合性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', description: '舒缓保湿，修护屏障，温和不刺激', ingredients: ['神经酰胺', '泛醇', '透明质酸'], purchase_url: '#', rating: 4.3, review_count: 8900 },
  { id: generateUUID('米蓓尔-蓝水'), name: '蓝水', brand: '米蓓尔', category: '爽肤水', price_min: 108, price_max: 168, budget_level: 'budget', skin_types: ['油性', '混合性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', description: '控油补水，清爽保湿，收缩毛孔', ingredients: ['水杨酸', '茶树精油', '透明质酸'], purchase_url: '#', rating: 4.2, review_count: 7200 },
  { id: generateUUID('HBN-发光水'), name: '发光水', brand: 'HBN', category: '爽肤水', price_min: 128, price_max: 198, budget_level: 'mid', skin_types: ['暗沉肌', '混合性'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', description: '熊果苷提亮，淡化暗沉，均匀肤色', ingredients: ['熊果苷', '烟酰胺', '维生素C'], purchase_url: '#', rating: 4.5, review_count: 14500 },
  { id: generateUUID('HBN-双A醇'), name: '双A醇精华乳', brand: 'HBN', category: '精华', price_min: 198, price_max: 298, budget_level: 'mid', skin_types: ['混合性', '干性'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '双A醇抗老，淡化细纹，紧致肌肤', ingredients: ['视黄醇', '视黄醇棕榈酸酯', '神经酰胺'], purchase_url: '#', rating: 4.6, review_count: 11200 },
  { id: generateUUID('HBN-洗面奶'), name: '氨基酸洗面奶', brand: 'HBN', category: '洁面', price_min: 78, price_max: 128, budget_level: 'budget', skin_types: ['敏感肌', '混合性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', description: '三重氨基酸，温和清洁，不紧绷', ingredients: ['氨基酸', '泛醇', '甘油'], purchase_url: '#', rating: 4.4, review_count: 9800 },

  // 31-40
  { id: generateUUID('至本-特安'), name: '特安修护乳液', brand: '至本', category: '乳液', price_min: 88, price_max: 138, budget_level: 'budget', skin_types: ['敏感肌', '混合性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', description: '舒缓敏感，修护屏障，温和保湿', ingredients: ['神经酰胺', '泛醇', '积雪草'], purchase_url: '#', rating: 4.5, review_count: 13200 },
  { id: generateUUID('至本-洗面奶'), name: '舒颜修护洁面乳', brand: '至本', category: '洁面', price_min: 58, price_max: 88, budget_level: 'budget', skin_types: ['敏感肌', '混合性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', description: '氨基酸洁面，温和清洁，不刺激', ingredients: ['氨基酸', '泛醇', '甘油'], purchase_url: '#', rating: 4.6, review_count: 15600 },
  { id: generateUUID('溪木源-山茶花'), name: '山茶花水乳套装', brand: '溪木源', category: '套装', price_min: 168, price_max: 268, budget_level: 'mid', skin_types: ['敏感肌', '混合性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', description: '山茶花修护，舒缓敏感，补水保湿', ingredients: ['山茶花提取物', '神经酰胺', '透明质酸'], purchase_url: '#', rating: 4.4, review_count: 8900 },
  { id: generateUUID('溪木源-层孔菌'), name: '层孔菌水乳套装', brand: '溪木源', category: '套装', price_min: 198, price_max: 298, budget_level: 'mid', skin_types: ['油性', '混合性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', description: '层孔菌控油，清爽保湿，收缩毛孔', ingredients: ['层孔菌提取物', '水杨酸', '烟酰胺'], purchase_url: '#', rating: 4.3, review_count: 7600 },
  { id: generateUUID('谷雨-光感水'), name: '光感水', brand: '谷雨', category: '爽肤水', price_min: 128, price_max: 198, budget_level: 'mid', skin_types: ['暗沉肌', '混合性'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', description: '光甘草定提亮，淡化暗沉，均匀肤色', ingredients: ['光甘草定', '烟酰胺', '维生素C'], purchase_url: '#', rating: 4.5, review_count: 11200 },
  { id: generateUUID('谷雨-奶皮面膜'), name: '奶皮面膜', brand: '谷雨', category: '面膜', price_min: 88, price_max: 138, budget_level: 'budget', skin_types: ['暗沉肌', '混合性'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400', description: '奶皮质地，提亮肤色，补水保湿', ingredients: ['光甘草定', '烟酰胺', '透明质酸'], purchase_url: '#', rating: 4.4, review_count: 9800 },
  { id: generateUUID('瑷尔博士-益生菌'), name: '益生菌水乳套装', brand: '瑷尔博士', category: '套装', price_min: 198, price_max: 298, budget_level: 'mid', skin_types: ['混合性', '敏感肌'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', description: '益生菌修护，平衡肌肤，强韧屏障', ingredients: ['益生菌', '神经酰胺', '透明质酸'], purchase_url: '#', rating: 4.5, review_count: 10200 },
  { id: generateUUID('瑷尔博士-洁颜蜜'), name: '洁颜蜜', brand: '瑷尔博士', category: '洁面', price_min: 68, price_max: 108, budget_level: 'budget', skin_types: ['敏感肌', '混合性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', description: '双重氨基酸，温和清洁，不紧绷', ingredients: ['氨基酸', '益生菌', '泛醇'], purchase_url: '#', rating: 4.6, review_count: 12500 },
  { id: generateUUID('PMPM-玫瑰'), name: '玫瑰红茶精华油', brand: 'PMPM', category: '精华', price_min: 168, price_max: 268, budget_level: 'mid', skin_types: ['干性', '混合性'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '玫瑰精华油，滋养修护，抗老紧致', ingredients: ['玫瑰精油', '红茶提取物', '角鲨烷'], purchase_url: '#', rating: 4.3, review_count: 7800 },
  { id: generateUUID('PMPM-海茴香'), name: '海糖水乳套装', brand: 'PMPM', category: '套装', price_min: 198, price_max: 298, budget_level: 'mid', skin_types: ['油性', '混合性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', description: '海茴香修护，控油补水，清爽保湿', ingredients: ['海茴香提取物', '水杨酸', '烟酰胺'], purchase_url: '#', rating: 4.2, review_count: 6500 },

  // 41-50
  { id: generateUUID('稀物集-松茸'), name: '松茸菌菇水乳套装', brand: '稀物集', category: '套装', price_min: 228, price_max: 348, budget_level: 'mid', skin_types: ['敏感肌', '混合性'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', description: '松茸修护，舒缓敏感，强韧屏障', ingredients: ['松茸提取物', '神经酰胺', '泛醇'], purchase_url: '#', rating: 4.5, review_count: 5600 },
  { id: generateUUID('稀物集-洗面奶'), name: '松茸菌菇洁面乳', brand: '稀物集', category: '洁面', price_min: 78, price_max: 128, budget_level: 'budget', skin_types: ['敏感肌', '混合性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', description: '氨基酸洁面，温和清洁，舒缓敏感', ingredients: ['氨基酸', '松茸提取物', '泛醇'], purchase_url: '#', rating: 4.6, review_count: 7200 },
  { id: generateUUID('优时颜-微笑'), name: '微笑眼霜', brand: '优时颜', category: '眼霜', price_min: 298, price_max: 398, budget_level: 'premium', skin_types: ['混合性', '干性'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '淡化细纹，紧致眼周，提亮肤色', ingredients: ['多肽', '视黄醇', '咖啡因'], purchase_url: '#', rating: 4.6, review_count: 8900 },
  { id: generateUUID('优时颜-黑引力'), name: '黑引力精华', brand: '优时颜', category: '精华', price_min: 328, price_max: 428, budget_level: 'premium', skin_types: ['混合性', '干性'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '双A双肽，抗老紧致，淡化细纹', ingredients: ['视黄醇', '多肽', '神经酰胺'], purchase_url: '#', rating: 4.7, review_count: 6500 },
  { id: generateUUID('毕生之研-早C晚A'), name: '早C晚A眼霜', brand: '毕生之研', category: '眼霜', price_min: 168, price_max: 248, budget_level: 'mid', skin_types: ['混合性', '干性'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '早C晚A，淡化黑眼圈，紧致眼周', ingredients: ['维生素C', '视黄醇', '咖啡因'], purchase_url: '#', rating: 4.4, review_count: 11200 },
  { id: generateUUID('毕生之研-五环'), name: '五环精华', brand: '毕生之研', category: '精华', price_min: 198, price_max: 298, budget_level: 'mid', skin_types: ['油性', '痘痘肌'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '五环修护，控油祛痘，舒缓镇静', ingredients: ['水杨酸', '茶树精油', '烟酰胺'], purchase_url: '#', rating: 4.3, review_count: 7800 },
  { id: generateUUID('上水和肌-水杨酸'), name: '水杨酸精华液', brand: '上水和肌', category: '精华', price_min: 58, price_max: 88, budget_level: 'budget', skin_types: ['油性', '痘痘肌'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '2%水杨酸，控油祛痘，疏通毛孔', ingredients: ['水杨酸', '茶树精油', '烟酰胺'], purchase_url: '#', rating: 4.2, review_count: 9200 },
  { id: generateUUID('上水和肌-屏障'), name: '屏障修护精华', brand: '上水和肌', category: '精华', price_min: 78, price_max: 118, budget_level: 'budget', skin_types: ['敏感肌', '受损肌'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '修护屏障，舒缓敏感，强韧肌底', ingredients: ['神经酰胺', '泛醇', '积雪草'], purchase_url: '#', rating: 4.3, review_count: 6500 },
  { id: generateUUID('John Jeff-油橄榄'), name: '油橄榄精华', brand: 'John Jeff', category: '精华', price_min: 68, price_max: 98, budget_level: 'budget', skin_types: ['敏感肌', '痘痘肌'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '油橄榄修护，舒缓消炎，淡化痘印', ingredients: ['油橄榄提取物', '积雪草', '烟酰胺'], purchase_url: '#', rating: 4.4, review_count: 11200 },
  { id: generateUUID('John Jeff-壬二酸'), name: '壬二酸面霜', brand: 'John Jeff', category: '面霜', price_min: 58, price_max: 88, budget_level: 'budget', skin_types: ['油性', '痘痘肌'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', description: '10%壬二酸，控油祛痘，淡化痘印', ingredients: ['壬二酸', '水杨酸', '烟酰胺'], purchase_url: '#', rating: 4.3, review_count: 8900 },
  { id: generateUUID('The Ordinary-烟酰胺'), name: '烟酰胺精华', brand: 'The Ordinary', category: '精华', price_min: 68, price_max: 98, budget_level: 'budget', skin_types: ['油性', '混合性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '10%烟酰胺，控油提亮，淡化痘印', ingredients: ['烟酰胺', '锌', '透明质酸'], purchase_url: '#', rating: 4.2, review_count: 18500 },
];

// 产品服务函数
export const ProductService = {
  // 获取所有产品
  getAllProducts: (): Product[] => {
    return [...productsDatabase];
  },

  // 根据ID获取产品
  getProductById: (id: string): Product | undefined => {
    return productsDatabase.find(p => p.id === id);
  },

  // 根据品牌筛选
  getProductsByBrand: (brand: string): Product[] => {
    return productsDatabase.filter(p => p.brand === brand);
  },

  // 根据品类筛选
  getProductsByCategory: (category: string): Product[] => {
    return productsDatabase.filter(p => p.category === category);
  },

  // 根据肤质筛选
  getProductsBySkinType: (skinType: string): Product[] => {
    return productsDatabase.filter(p => p.skin_types.includes(skinType));
  },

  // 根据预算级别筛选
  getProductsByBudget: (budget: BudgetLevel): Product[] => {
    return productsDatabase.filter(p => p.budget_level === budget);
  },

  // 根据年龄段筛选
  getProductsByAgeGroup: (ageGroup: string): Product[] => {
    return productsDatabase.filter(p => p.suitable_age_groups.includes(ageGroup));
  },

  // 综合筛选
  filterProducts: (filters: {
    brands?: string[];
    categories?: string[];
    skinTypes?: string[];
    budgetLevels?: BudgetLevel[];
    ageGroups?: string[];
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
  }): Product[] => {
    return productsDatabase.filter(product => {
      if (filters.brands?.length && !filters.brands.includes(product.brand)) return false;
      if (filters.categories?.length && !filters.categories.includes(product.category)) return false;
      if (filters.skinTypes?.length && !product.skin_types.some(st => filters.skinTypes?.includes(st))) return false;
      if (filters.budgetLevels?.length && !filters.budgetLevels.includes(product.budget_level)) return false;
      if (filters.ageGroups?.length && !product.suitable_age_groups.some(ag => filters.ageGroups?.includes(ag))) return false;
      if (filters.minPrice !== undefined && product.price_max < filters.minPrice) return false;
      if (filters.maxPrice !== undefined && product.price_min > filters.maxPrice) return false;
      if (filters.minRating !== undefined && product.rating < filters.minRating) return false;
      return true;
    });
  },

  // 搜索产品
  searchProducts: (query: string): Product[] => {
    const lowerQuery = query.toLowerCase();
    return productsDatabase.filter(product =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.brand.toLowerCase().includes(lowerQuery) ||
      product.category.toLowerCase().includes(lowerQuery) ||
      product.description.toLowerCase().includes(lowerQuery) ||
      product.ingredients.some(i => i.toLowerCase().includes(lowerQuery))
    );
  },

  // 获取推荐产品（基于肤质和预算）
  getRecommendations: (skinType: string, budget: BudgetLevel, limit: number = 5): Product[] => {
    const filtered = productsDatabase.filter(p =>
      p.skin_types.includes(skinType) && p.budget_level === budget
    );
    // 按评分和评论数排序
    return filtered
      .sort((a, b) => (b.rating * b.review_count) - (a.rating * a.review_count))
      .slice(0, limit);
  },

  // 获取热门产品
  getPopularProducts: (limit: number = 10): Product[] => {
    return productsDatabase
      .sort((a, b) => b.review_count - a.review_count)
      .slice(0, limit);
  },

  // 获取高评分产品
  getTopRatedProducts: (limit: number = 10): Product[] => {
    return productsDatabase
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  },

  // 获取所有品牌
  getAllBrands: (): string[] => {
    return [...new Set(productsDatabase.map(p => p.brand))].sort();
  },

  // 获取所有品类
  getAllCategories: (): string[] => {
    return [...new Set(productsDatabase.map(p => p.category))].sort();
  },

  // 获取所有肤质类型
  getAllSkinTypes: (): string[] => {
    const skinTypes = new Set<string>();
    productsDatabase.forEach(p => p.skin_types.forEach(st => skinTypes.add(st)));
    return [...skinTypes].sort();
  },

  // 获取所有年龄段
  getAllAgeGroups: (): string[] => {
    const ageGroups = new Set<string>();
    productsDatabase.forEach(p => p.suitable_age_groups.forEach(ag => ageGroups.add(ag)));
    return [...ageGroups].sort();
  },
};

export default ProductService;

// 导出产品数据供其他模块使用
export const PRODUCTS_DATA = productsDatabase;
