import { PRODUCTS_DATA } from '../src/services/products';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncProducts() {
  console.log(`开始同步 ${PRODUCTS_DATA.length} 个产品到数据库...`);

  for (const product of PRODUCTS_DATA) {
    try {
      // 检查产品是否已存在
      const { data: existing } = await supabase
        .from('products')
        .select('id')
        .eq('id', product.id)
        .single();

      if (existing) {
        // 更新现有产品
        const { error } = await supabase
          .from('products')
          .update({
            name: product.name,
            brand: product.brand,
            category: product.category,
            price_min: product.price_min,
            price_max: product.price_max,
            budget_level: product.budget_level,
            skin_types: product.skin_types,
            suitable_age_groups: product.suitable_age_groups,
            image_url: product.image_url,
            description: product.description,
            ingredients: product.ingredients,
            purchase_url: product.purchase_url,
            rating: product.rating,
            review_count: product.review_count,
            updated_at: new Date().toISOString(),
          })
          .eq('id', product.id);

        if (error) {
          console.error(`更新产品 ${product.id} 失败:`, error);
        } else {
          console.log(`✓ 更新产品: ${product.brand} ${product.name}`);
        }
      } else {
        // 插入新产品
        const { error } = await supabase
          .from('products')
          .insert({
            id: product.id,
            name: product.name,
            brand: product.brand,
            category: product.category,
            price_min: product.price_min,
            price_max: product.price_max,
            budget_level: product.budget_level,
            skin_types: product.skin_types,
            suitable_age_groups: product.suitable_age_groups,
            image_url: product.image_url,
            description: product.description,
            ingredients: product.ingredients,
            purchase_url: product.purchase_url,
            rating: product.rating,
            review_count: product.review_count,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (error) {
          console.error(`插入产品 ${product.id} 失败:`, error);
        } else {
          console.log(`✓ 新增产品: ${product.brand} ${product.name}`);
        }
      }
    } catch (err) {
      console.error(`处理产品 ${product.id} 时出错:`, err);
    }
  }

  console.log('产品同步完成！');
}

syncProducts();
