-- 插入80个热门护肤品到 products 表
-- 国际大牌 - 雅诗兰黛
INSERT INTO products (id, name, brand, category, price_min, price_max, budget_level, skin_types, suitable_age_groups, image_url, description, ingredients, purchase_url, rating, review_count) VALUES
(gen_random_uuid(), '小棕瓶精华液', '雅诗兰黛', '精华', 850, 1200, 'premium', ARRAY['干性', '混合性', '油性'], ARRAY['25-34', '35-44', '45+'], 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400', '修护肌肤屏障，淡化细纹，提亮肤色，夜间修护经典', ARRAY['二裂酵母', '透明质酸', '维生素E'], '#', 4.8, 125000),
(gen_random_uuid(), '小棕瓶眼霜', '雅诗兰黛', '眼霜', 520, 680, 'premium', ARRAY['干性', '混合性'], ARRAY['25-34', '35-44'], 'https://images.unsplash.com/photo-1570194065650-d99fb4b38b15?w=400', '淡化黑眼圈，修护眼周细纹，抗蓝光', ARRAY['二裂酵母', '咖啡因', '透明质酸'], '#', 4.7, 89000),
(gen_random_uuid(), '红石榴洁面乳', '雅诗兰黛', '洁面', 280, 350, 'mid', ARRAY['混合性', '油性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', '深层清洁，提亮肤色，泡沫丰富细腻', ARRAY['红石榴精华', '维生素C', '甘油'], '#', 4.6, 45000);

-- 兰蔻
INSERT INTO products (id, name, brand, category, price_min, price_max, budget_level, skin_types, suitable_age_groups, image_url, description, ingredients, purchase_url, rating, review_count) VALUES
(gen_random_uuid(), '小黑瓶精华肌底液', '兰蔻', '精华', 780, 1080, 'premium', ARRAY['干性', '混合性', '油性', '敏感肌'], ARRAY['25-34', '35-44'], 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', '修护肌底，促进后续吸收，维稳肌肤', ARRAY['酵母精华', '透明质酸', '腺苷'], '#', 4.8, 156000),
(gen_random_uuid(), '粉水', '兰蔻', '爽肤水', 320, 420, 'mid', ARRAY['干性', '混合性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1608248543803-ba4f8c70a0d0?w=400', '温和补水，舒缓肌肤，适合干性和混合性肌肤', ARRAY['玫瑰精华', '透明质酸', '甘油'], '#', 4.5, 98000),
(gen_random_uuid(), '菁纯面霜', '兰蔻', '面霜', 1380, 2680, 'luxury', ARRAY['干性', '混合性'], ARRAY['35-44', '45+'], 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', '抗老紧致，淡化细纹，滋润修护', ARRAY['玻色因', '玫瑰精华', '腺苷'], '#', 4.9, 32000);

-- SK-II
INSERT INTO products (id, name, brand, category, price_min, price_max, budget_level, skin_types, suitable_age_groups, image_url, description, ingredients, purchase_url, rating, review_count) VALUES
(gen_random_uuid(), '神仙水', 'SK-II', '爽肤水', 1180, 2150, 'luxury', ARRAY['混合性', '油性'], ARRAY['25-34', '35-44'], 'https://images.unsplash.com/photo-1612817288484-6f916006741a?w=400', 'PITERA精华，调理肌肤水油平衡，改善肤质', ARRAY['PITERA', '丁二醇', '水'], '#', 4.7, 198000),
(gen_random_uuid(), '小灯泡精华', 'SK-II', '精华', 1280, 1980, 'luxury', ARRAY['混合性', '油性', '干性'], ARRAY['25-34', '35-44'], 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=400', '美白提亮，淡化色斑，均匀肤色', ARRAY['PITERA', '烟酰胺', '维生素C'], '#', 4.6, 76000),
(gen_random_uuid(), '大红瓶面霜', 'SK-II', '面霜', 980, 1480, 'premium', ARRAY['干性', '混合性'], ARRAY['35-44', '45+'], 'https://images.unsplash.com/photo-1571781926291-c477ebfd024c?w=400', '抗老紧致，深层滋润，修护肌肤', ARRAY['PITERA', '烟酰胺', '乳木果油'], '#', 4.7, 54000);

-- 资生堂
INSERT INTO products (id, name, brand, category, price_min, price_max, budget_level, skin_types, suitable_age_groups, image_url, description, ingredients, purchase_url, rating, review_count) VALUES
(gen_random_uuid(), '红腰子精华', '资生堂', '精华', 680, 1080, 'premium', ARRAY['混合性', '油性', '敏感肌'], ARRAY['25-34', '35-44'], 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', '维稳修护，提升肌肤免疫力，改善泛红', ARRAY['灵芝精华', '鸢尾花精华', '透明质酸'], '#', 4.6, 87000),
(gen_random_uuid(), '悦薇水乳套装', '资生堂', '乳液', 1080, 1440, 'premium', ARRAY['干性', '混合性'], ARRAY['25-34', '35-44'], 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400', '抗初老，提亮肤色，滋润保湿', ARRAY['4MSK', 'VP8', '透明质酸'], '#', 4.7, 43000),
(gen_random_uuid(), '蓝胖子防晒', '资生堂', '防晒', 280, 380, 'mid', ARRAY['混合性', '油性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', '高倍防晒，清爽不油腻，防水防汗', ARRAY['氧化锌', '二氧化钛', '甘油'], '#', 4.8, 112000);

-- 海蓝之谜
INSERT INTO products (id, name, brand, category, price_min, price_max, budget_level, skin_types, suitable_age_groups, image_url, description, ingredients, purchase_url, rating, review_count) VALUES
(gen_random_uuid(), '经典面霜', '海蓝之谜', '面霜', 2680, 4650, 'luxury', ARRAY['干性', '混合性', '敏感肌'], ARRAY['35-44', '45+'], 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', '修护传奇，深层滋润，舒缓修护', ARRAY['神奇活性精萃', '酸橙茶精华', '乳木果油'], '#', 4.8, 28000),
(gen_random_uuid(), '修护精萃水', '海蓝之谜', '爽肤水', 920, 1350, 'luxury', ARRAY['干性', '混合性', '敏感肌'], ARRAY['25-34', '35-44'], 'https://images.unsplash.com/photo-1608248543803-ba4f8c70a0d0?w=400', '保湿修护，舒缓肌肤，促进后续吸收', ARRAY['神奇活性精萃', '海洋精华', '透明质酸'], '#', 4.7, 35000);

-- 赫莲娜
INSERT INTO products (id, name, brand, category, price_min, price_max, budget_level, skin_types, suitable_age_groups, image_url, description, ingredients, purchase_url, rating, review_count) VALUES
(gen_random_uuid(), '黑绷带面霜', '赫莲娜', '面霜', 3580, 5580, 'luxury', ARRAY['混合性', '油性', '敏感肌'], ARRAY['35-44', '45+'], 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', '高浓度玻色因，修护抗老，紧致肌肤', ARRAY['30%玻色因', '甘草酸', '透明质酸'], '#', 4.9, 18000),
(gen_random_uuid(), '绿宝瓶精华', '赫莲娜', '精华', 1080, 1580, 'premium', ARRAY['混合性', '油性'], ARRAY['25-34', '35-44'], 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', '修护维稳，抗氧化，改善粗糙', ARRAY['海洋堇原生细胞', '益生菌', '透明质酸'], '#', 4.6, 25000);

-- 倩碧
INSERT INTO products (id, name, brand, category, price_min, price_max, budget_level, skin_types, suitable_age_groups, image_url, description, ingredients, purchase_url, rating, review_count) VALUES
(gen_random_uuid(), '黄油', '倩碧', '乳液', 298, 380, 'mid', ARRAY['混合性', '油性', '干性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400', '保湿滋润，修护屏障，经典三步曲', ARRAY['透明质酸', '甘油', '尿素'], '#', 4.5, 145000),
(gen_random_uuid(), '淡斑精华', '倩碧', '精华', 580, 780, 'premium', ARRAY['混合性', '油性', '干性'], ARRAY['25-34', '35-44'], 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=400', '淡化色斑，提亮肤色，温和美白', ARRAY['CL302', '维生素C', '水杨酸'], '#', 4.4, 32000);

-- 娇韵诗
INSERT INTO products (id, name, brand, category, price_min, price_max, budget_level, skin_types, suitable_age_groups, image_url, description, ingredients, purchase_url, rating, review_count) VALUES
(gen_random_uuid(), '双萃精华', '娇韵诗', '精华', 680, 960, 'premium', ARRAY['干性', '混合性'], ARRAY['25-34', '35-44'], 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', '水油双萃，修护抗老，提亮肤色', ARRAY['姜黄精华', '水飞蓟', '透明质酸'], '#', 4.7, 68000),
(gen_random_uuid(), '弹簧霜', '娇韵诗', '面霜', 580, 780, 'premium', ARRAY['干性', '混合性'], ARRAY['35-44', '45+'], 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', '紧致提拉，淡化细纹，滋润修护', ARRAY['袋鼠花精华', '燕麦糖', '乳木果油'], '#', 4.6, 28000);

-- 迪奥、香奈儿
INSERT INTO products (id, name, brand, category, price_min, price_max, budget_level, skin_types, suitable_age_groups, image_url, description, ingredients, purchase_url, rating, review_count) VALUES
(gen_random_uuid(), '花蜜活颜精华', '迪奥', '精华', 2200, 3200, 'luxury', ARRAY['干性', '混合性'], ARRAY['35-44', '45+'], 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', '奢华抗老，修护滋养，紧致提拉', ARRAY['格兰维尔玫瑰', '透明质酸', '腺苷'], '#', 4.7, 12000),
(gen_random_uuid(), '睡莲洁面', '迪奥', '洁面', 380, 480, 'mid', ARRAY['混合性', '油性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', '温和清洁，卸妆洁面二合一', ARRAY['睡莲精华', '甘油', '椰油'], '#', 4.5, 18000),
(gen_random_uuid(), '山茶花洁面', '香奈儿', '洁面', 420, 520, 'premium', ARRAY['混合性', '油性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', '温和清洁，泡沫丰富，经典山茶花香', ARRAY['山茶花精华', '甘油', '蓝藻'], '#', 4.6, 45000),
(gen_random_uuid(), '奢华精萃面霜', '香奈儿', '面霜', 3200, 4800, 'luxury', ARRAY['干性', '混合性'], ARRAY['35-44', '45+'], 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', '奢华抗老，深层滋养，紧致修护', ARRAY['五月香草', '透明质酸', '乳木果油'], '#', 4.8, 8000);

-- 国货品牌 - 珀莱雅
INSERT INTO products (id, name, brand, category, price_min, price_max, budget_level, skin_types, suitable_age_groups, image_url, description, ingredients, purchase_url, rating, review_count) VALUES
(gen_random_uuid(), '双抗精华', '珀莱雅', '精华', 239, 329, 'mid', ARRAY['混合性', '油性', '干性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', '抗氧化抗糖化，提亮肤色，改善暗沉', ARRAY['麦角硫因', '虾青素', '烟酰胺'], '#', 4.5, 89000),
(gen_random_uuid(), '红宝石面霜', '珀莱雅', '面霜', 289, 389, 'mid', ARRAY['干性', '混合性'], ARRAY['25-34', '35-44'], 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', '胜肽抗老，淡化细纹，紧致肌肤', ARRAY['六胜肽', '视黄醇', '神经酰胺'], '#', 4.6, 56000),
(gen_random_uuid(), '源力修护精华', '珀莱雅', '精华', 199, 279, 'mid', ARRAY['敏感肌', '混合性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', '修护屏障，舒缓维稳，改善泛红', ARRAY['神经酰胺', '积雪草', '泛醇'], '#', 4.7, 42000);

-- 薇诺娜
INSERT INTO products (id, name, brand, category, price_min, price_max, budget_level, skin_types, suitable_age_groups, image_url, description, ingredients, purchase_url, rating, review_count) VALUES
(gen_random_uuid(), '特护霜', '薇诺娜', '面霜', 168, 268, 'budget', ARRAY['敏感肌', '干性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', '敏感肌修护，舒缓泛红，修护屏障', ARRAY['马齿苋', '青刺果油', '神经酰胺'], '#', 4.8, 156000),
(gen_random_uuid(), '舒敏保湿面膜', '薇诺娜', '面膜', 128, 198, 'budget', ARRAY['敏感肌', '干性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400', '舒缓修护，补水保湿，敏感肌适用', ARRAY['马齿苋', '透明质酸', '甘草酸'], '#', 4.7, 78000),
(gen_random_uuid(), '清透防晒乳', '薇诺娜', '防晒', 89, 168, 'budget', ARRAY['敏感肌', '混合性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', '温和防晒，敏感肌专用，清爽不油腻', ARRAY['氧化锌', '二氧化钛', '马齿苋'], '#', 4.6, 92000);

-- 百雀羚、玉泽、自然堂、欧诗漫
INSERT INTO products (id, name, brand, category, price_min, price_max, budget_level, skin_types, suitable_age_groups, image_url, description, ingredients, purchase_url, rating, review_count) VALUES
(gen_random_uuid(), '帧颜淡纹霜', '百雀羚', '面霜', 298, 398, 'mid', ARRAY['干性', '混合性'], ARRAY['35-44', '45+'], 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', '东方草本抗老，淡化细纹，紧致肌肤', ARRAY['人参精华', '灵芝精华', '视黄醇'], '#', 4.5, 34000),
(gen_random_uuid(), '水嫩倍现精华水', '百雀羚', '爽肤水', 89, 138, 'budget', ARRAY['干性', '混合性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1608248543803-ba4f8c70a0d0?w=400', '草本补水，温和滋润，性价比高', ARRAY['益母草', '忍冬花', '红景天'], '#', 4.4, 89000),
(gen_random_uuid(), '皮肤屏障修护乳', '玉泽', '乳液', 158, 228, 'budget', ARRAY['敏感肌', '干性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400', '医院联合研发，修护屏障，舒缓敏感', ARRAY['神经酰胺', '胆固醇', '脂肪酸'], '#', 4.7, 45000),
(gen_random_uuid(), '积雪草面膜', '玉泽', '面膜', 128, 198, 'budget', ARRAY['敏感肌', '混合性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400', '舒缓修护，补水保湿，医美术后可用', ARRAY['积雪草', '透明质酸', '泛醇'], '#', 4.6, 28000),
(gen_random_uuid(), '小紫瓶精华', '自然堂', '精华', 199, 299, 'mid', ARRAY['混合性', '油性', '干性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', '烟酰胺提亮，改善暗沉，性价比高', ARRAY['烟酰胺', '酵母', '冰川水'], '#', 4.5, 67000),
(gen_random_uuid(), '凝时鲜颜霜', '自然堂', '面霜', 238, 338, 'mid', ARRAY['干性', '混合性'], ARRAY['25-34', '35-44'], 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', '抗初老，淡化细纹，滋润保湿', ARRAY['雪莲花', '冰川水', '腺苷'], '#', 4.4, 32000),
(gen_random_uuid(), '小白灯精华', '欧诗漫', '精华', 159, 239, 'budget', ARRAY['混合性', '油性', '干性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', '珍珠美白，提亮肤色，淡化色斑', ARRAY['珍珠多肽', '烟酰胺', '维生素C'], '#', 4.3, 45000),
(gen_random_uuid(), '珍珠面膜', '欧诗漫', '面膜', 69, 129, 'budget', ARRAY['混合性', '干性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400', '珍珠美白，补水保湿，提亮肤色', ARRAY['珍珠粉', '透明质酸', '甘油'], '#', 4.4, 56000);

-- 花西子、完美日记、HBN、夸迪
INSERT INTO products (id, name, brand, category, price_min, price_max, budget_level, skin_types, suitable_age_groups, image_url, description, ingredients, purchase_url, rating, review_count) VALUES
(gen_random_uuid(), '花西子卸妆油', '花西子', '洁面', 128, 198, 'budget', ARRAY['混合性', '油性', '敏感肌'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', '温和卸妆，乳化快，不闷痘', ARRAY['植物油脂', '维生素E', '山茶花'], '#', 4.5, 34000),
(gen_random_uuid(), '花西子防晒', '花西子', '防晒', 99, 159, 'budget', ARRAY['混合性', '干性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', '轻薄防晒，妆前可用，提亮肤色', ARRAY['二氧化钛', '氧化锌', '珍珠粉'], '#', 4.4, 28000),
(gen_random_uuid(), '白胖子洁面', '完美日记', '洁面', 49, 79, 'budget', ARRAY['混合性', '油性'], ARRAY['18-24'], 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', '氨基酸洁面，温和清洁，性价比高', ARRAY['氨基酸', '甘油', '透明质酸'], '#', 4.3, 78000),
(gen_random_uuid(), '小银盖防晒', '完美日记', '防晒', 59, 99, 'budget', ARRAY['混合性', '油性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', '清爽防晒，不油腻，学生党首选', ARRAY['化学防晒剂', '甘油', '透明质酸'], '#', 4.2, 45000),
(gen_random_uuid(), '发光水', 'HBN', '爽肤水', 109, 159, 'budget', ARRAY['混合性', '油性', '干性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1608248543803-ba4f8c70a0d0?w=400', '熊果苷提亮，改善暗沉，温和不刺激', ARRAY['熊果苷', '维生素C', '透明质酸'], '#', 4.5, 56000),
(gen_random_uuid(), '双A醇晚霜', 'HBN', '面霜', 199, 299, 'mid', ARRAY['混合性', '油性'], ARRAY['25-34', '35-44'], 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', '视黄醇抗老，淡化细纹，紧致肌肤', ARRAY['视黄醇', '视黄醇棕榈酸酯', '神经酰胺'], '#', 4.6, 34000),
(gen_random_uuid(), '5D玻尿酸次抛', '夸迪', '精华', 299, 459, 'mid', ARRAY['干性', '混合性', '敏感肌'], ARRAY['25-34', '35-44'], 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', '华熙生物出品，深层补水，修护屏障', ARRAY['5D玻尿酸', '神经酰胺', '泛醇'], '#', 4.7, 28000),
(gen_random_uuid(), '悬油次抛精华', '夸迪', '精华', 329, 499, 'mid', ARRAY['干性', '混合性'], ARRAY['25-34', '35-44'], 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', '水油同补，修护抗老，适合干皮', ARRAY['神经酰胺', '角鲨烷', '玻尿酸'], '#', 4.6, 18000);

-- 科颜氏、OLAY、欧莱雅
INSERT INTO products (id, name, brand, category, price_min, price_max, budget_level, skin_types, suitable_age_groups, image_url, description, ingredients, purchase_url, rating, review_count) VALUES
(gen_random_uuid(), '高保湿面霜', '科颜氏', '面霜', 315, 420, 'mid', ARRAY['干性', '混合性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', '深层保湿，修护屏障，经典保湿霜', ARRAY['角鲨烷', '冰川蛋白', '甘油'], '#', 4.6, 112000),
(gen_random_uuid(), '金盏花水', '科颜氏', '爽肤水', 280, 380, 'mid', ARRAY['混合性', '油性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1608248543803-ba4f8c70a0d0?w=400', '舒缓控油，收敛毛孔，油痘肌适用', ARRAY['金盏花', '牛蒡根', '洋常春藤'], '#', 4.5, 98000),
(gen_random_uuid(), '小白瓶精华', 'OLAY', '精华', 229, 329, 'mid', ARRAY['混合性', '油性', '干性'], ARRAY['25-34', '35-44'], 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', '烟酰胺美白，淡化色斑，提亮肤色', ARRAY['烟酰胺', '维生素C', '甘油'], '#', 4.5, 145000),
(gen_random_uuid(), '大红瓶面霜', 'OLAY', '面霜', 269, 369, 'mid', ARRAY['干性', '混合性'], ARRAY['35-44', '45+'], 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', '胜肽抗老，紧致肌肤，淡化细纹', ARRAY['五胜肽', '烟酰胺', '透明质酸'], '#', 4.6, 89000),
(gen_random_uuid(), '复颜玻尿酸水乳', '欧莱雅', '乳液', 189, 289, 'budget', ARRAY['干性', '混合性'], ARRAY['25-34', '35-44'], 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400', '玻尿酸补水，淡化细纹，性价比高', ARRAY['玻尿酸', '维生素C', '腺苷'], '#', 4.4, 67000),
(gen_random_uuid(), '小金管防晒', '欧莱雅', '防晒', 129, 189, 'budget', ARRAY['混合性', '油性', '干性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', '高倍防晒，清爽不油腻，麦色滤科技', ARRAY['麦色滤', '维生素E', '甘油'], '#', 4.6, 112000);

-- 露得清、适乐肤、理肤泉、雅漾
INSERT INTO products (id, name, brand, category, price_min, price_max, budget_level, skin_types, suitable_age_groups, image_url, description, ingredients, purchase_url, rating, review_count) VALUES
(gen_random_uuid(), 'A醇晚霜', '露得清', '面霜', 89, 139, 'budget', ARRAY['混合性', '油性'], ARRAY['25-34', '35-44'], 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', '入门A醇，抗老淡纹，性价比高', ARRAY['视黄醇', '维生素E', '甘油'], '#', 4.4, 56000),
(gen_random_uuid(), 'C乳', '适乐肤', '乳液', 98, 158, 'budget', ARRAY['敏感肌', '干性', '混合性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400', '神经酰胺修护，温和保湿，敏感肌适用', ARRAY['神经酰胺', '透明质酸', '甘油'], '#', 4.7, 78000),
(gen_random_uuid(), 'PM乳', '适乐肤', '乳液', 108, 168, 'budget', ARRAY['敏感肌', '混合性', '油性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400', '烟酰胺修护，夜间使用，清爽不油腻', ARRAY['神经酰胺', '烟酰胺', '透明质酸'], '#', 4.6, 45000),
(gen_random_uuid(), 'B5修复霜', '理肤泉', '面霜', 89, 139, 'budget', ARRAY['敏感肌', '干性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', '泛醇修护，舒缓敏感，医美术后可用', ARRAY['泛醇', '乳木果油', '甘油'], '#', 4.7, 92000),
(gen_random_uuid(), '大哥大防晒', '理肤泉', '防晒', 128, 198, 'budget', ARRAY['敏感肌', '混合性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', '高倍防晒，温和不刺激，敏感肌适用', ARRAY['麦色滤', '温泉水', '甘油'], '#', 4.6, 34000),
(gen_random_uuid(), '舒护活泉水', '雅漾', '爽肤水', 68, 128, 'budget', ARRAY['敏感肌', '干性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1608248543803-ba4f8c70a0d0?w=400', '温泉水舒缓，镇静肌肤，喷雾设计', ARRAY['雅漾温泉水', '氮'], '#', 4.5, 112000),
(gen_random_uuid(), '修护舒缓面膜', '雅漾', '面膜', 98, 158, 'budget', ARRAY['敏感肌', '干性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400', '舒缓修护，补水保湿，敏感肌专用', ARRAY['雅漾温泉水', '泛醇', '甘油'], '#', 4.6, 28000);

-- 其他热门品牌
INSERT INTO products (id, name, brand, category, price_min, price_max, budget_level, skin_types, suitable_age_groups, image_url, description, ingredients, purchase_url, rating, review_count) VALUES
(gen_random_uuid(), '小弹簧眼霜', '丸美', '眼霜', 298, 398, 'mid', ARRAY['干性', '混合性'], ARRAY['35-44', '45+'], 'https://images.unsplash.com/photo-1570194065650-d99fb4b38b15?w=400', '弹力蛋白，淡化细纹，紧致眼周', ARRAY['弹力蛋白', '胶原蛋白', '透明质酸'], '#', 4.5, 34000),
(gen_random_uuid(), '人参面霜', '片仔癀', '面霜', 168, 268, 'budget', ARRAY['干性', '混合性'], ARRAY['35-44', '45+'], 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', '传统草本，滋养修护，经典国货', ARRAY['片仔癀', '人参', '珍珠粉'], '#', 4.4, 28000),
(gen_random_uuid(), '氨基酸洁面', '芙丽芳丝', '洁面', 120, 180, 'budget', ARRAY['敏感肌', '混合性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', '温和氨基酸，敏感肌适用，日本进口', ARRAY['氨基酸', '甘油', '透明质酸'], '#', 4.7, 89000),
(gen_random_uuid(), '润浸保湿面霜', '珂润', '面霜', 158, 228, 'budget', ARRAY['敏感肌', '干性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400', '神经酰胺修护，温和保湿，日本药妆', ARRAY['神经酰胺', '蓝桉叶', '尿囊素'], '#', 4.7, 56000),
(gen_random_uuid(), '烟酰胺精华', 'The Ordinary', '精华', 58, 88, 'budget', ARRAY['油性', '混合性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', '高浓度烟酰胺，控油提亮，平价猛药', ARRAY['10%烟酰胺', '1%锌', '透明质酸'], '#', 4.3, 89000),
(gen_random_uuid(), '润燥精华', '雪花秀', '精华', 580, 820, 'premium', ARRAY['干性', '混合性'], ARRAY['35-44', '45+'], 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', '草本肌底液，促进吸收，提亮肤色', ARRAY['芍药', '莲花', '玉竹'], '#', 4.7, 28000),
(gen_random_uuid(), '睡眠面膜', '兰芝', '面膜', 168, 228, 'mid', ARRAY['干性', '混合性'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400', '夜间修护，补水保湿，懒人必备', ARRAY['水离子', '透明质酸', '甘油'], '#', 4.5, 112000),
(gen_random_uuid(), '蜗牛精华', 'COSRX', '精华', 98, 158, 'budget', ARRAY['混合性', '油性', '敏感肌'], ARRAY['18-24', '25-34'], 'https://images.unsplash.com/photo-1617897903246-719242758050?w=400', '蜗牛黏液修护，淡化痘印，舒缓肌肤', ARRAY['96%蜗牛黏液', '透明质酸', '甘油'], '#', 4.5, 34000);
