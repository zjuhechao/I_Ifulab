const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const products = [
  // 雅诗兰黛
  { name: '小棕瓶精华液', brand: '雅诗兰黛', category: '精华', price_min: 850, price_max: 1200, budget_level: 'premium', skin_types: ['干性', '混合性', '油性'], suitable_age_groups: ['25-34', '35-44', '45+'], image_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', description: '修护肌肤屏障，淡化细纹，提亮肤色，夜间修护经典', ingredients: ['二裂酵母', '透明质酸', '维生素E'], purchase_url: '#', rating: 4.8, review_count: 125000 },
  { name: '小棕瓶眼霜', brand: '雅诗兰黛', category: '眼霜', price_min: 520, price_max: 680, budget_level: 'premium', skin_types: ['干性', '混合性'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1570194065650-d99fb4b38b15?w=400', description: '淡化黑眼圈，修护眼周细纹，抗蓝光', ingredients: ['二裂酵母', '咖啡因', '透明质酸'], purchase_url: '#', rating: 4.7, review_count: 89000 },
  { name: '红石榴洁面乳', brand: '雅诗兰黛', category: '洁面', price_min: 280, price_max: 350, budget_level: 'mid', skin_types: ['混合性', '油性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', description: '深层清洁，提亮肤色，泡沫丰富细腻', ingredients: ['红石榴精华', '维生素C', '甘油'], purchase_url: '#', rating: 4.6, review_count: 45000 },
  // 兰蔻
  { name: '小黑瓶精华肌底液', brand: '兰蔻', category: '精华', price_min: 780, price_max: 1080, budget_level: 'premium', skin_types: ['干性', '混合性', '油性', '敏感肌'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '修护肌底，促进后续吸收，维稳肌肤', ingredients: ['酵母精华', '透明质酸', '腺苷'], purchase_url: '#', rating: 4.8, review_count: 156000 },
  { name: '粉水', brand: '兰蔻', category: '爽肤水', price_min: 320, price_max: 420, budget_level: 'mid', skin_types: ['干性', '混合性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70a0d0?w=400', description: '温和补水，舒缓肌肤，适合干性和混合性肌肤', ingredients: ['玫瑰精华', '透明质酸', '甘油'], purchase_url: '#', rating: 4.5, review_count: 98000 },
  { name: '菁纯面霜', brand: '兰蔻', category: '面霜', price_min: 1380, price_max: 2680, budget_level: 'luxury', skin_types: ['干性', '混合性'], suitable_age_groups: ['35-44', '45+'], image_url: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', description: '抗老紧致，淡化细纹，滋润修护', ingredients: ['玻色因', '玫瑰精华', '腺苷'], purchase_url: '#', rating: 4.9, review_count: 32000 },
  // SK-II
  { name: '神仙水', brand: 'SK-II', category: '爽肤水', price_min: 1180, price_max: 2150, budget_level: 'luxury', skin_types: ['混合性', '油性'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400', description: 'PITERA精华，调理肌肤水油平衡，改善肤质', ingredients: ['PITERA', '丁二醇', '水'], purchase_url: '#', rating: 4.7, review_count: 198000 },
  { name: '小灯泡精华', brand: 'SK-II', category: '精华', price_min: 1280, price_max: 1980, budget_level: 'luxury', skin_types: ['混合性', '油性', '干性'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=400', description: '美白提亮，淡化色斑，均匀肤色', ingredients: ['PITERA', '烟酰胺', '维生素C'], purchase_url: '#', rating: 4.6, review_count: 76000 },
  { name: '大红瓶面霜', brand: 'SK-II', category: '面霜', price_min: 980, price_max: 1480, budget_level: 'premium', skin_types: ['干性', '混合性'], suitable_age_groups: ['35-44', '45+'], image_url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024c?w=400', description: '抗老紧致，深层滋润，修护肌肤', ingredients: ['PITERA', '烟酰胺', '乳木果油'], purchase_url: '#', rating: 4.7, review_count: 54000 },
  // 资生堂
  { name: '红腰子精华', brand: '资生堂', category: '精华', price_min: 680, price_max: 1080, budget_level: 'premium', skin_types: ['混合性', '油性', '敏感肌'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', description: '维稳修护，提升肌肤免疫力，改善泛红', ingredients: ['灵芝精华', '鸢尾花精华', '透明质酸'], purchase_url: '#', rating: 4.6, review_count: 87000 },
  { name: '悦薇水乳套装', brand: '资生堂', category: '乳液', price_min: 1080, price_max: 1440, budget_level: 'premium', skin_types: ['干性', '混合性'], suitable_age_groups: ['25-34', '35-44'], image_url: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400', description: '抗初老，提亮肤色，滋润保湿', ingredients: ['4MSK', 'VP8', '透明质酸'], purchase_url: '#', rating: 4.7, review_count: 43000 },
  { name: '蓝胖子防晒', brand: '资生堂', category: '防晒', price_min: 280, price_max: 380, budget_level: 'mid', skin_types: ['混合性', '油性'], suitable_age_groups: ['18-24', '25-34'], image_url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', description: '高倍防晒，清爽不油腻，防水防汗', ingredients: ['氧化锌', '二氧化钛', '甘油'], purchase_url: '#', rating: 4.8, review_count: 112000 },
];

async function insertProducts() {
  console.log(`开始插入 ${products.length} 个产品...`);
  
  for (const product of products) {
    const { error } = await supabase.from('products').insert({
      ...product,
      created_at: new Date().toISOString(),
    });
    
    if (error) {
      console.error(`插入失败: ${product.brand} ${product.name}`, error.message);
    } else {
      console.log(`✓ 已插入: ${product.brand} ${product.name}`);
    }
  }
  
  console.log('插入完成！');
}

insertProducts();
