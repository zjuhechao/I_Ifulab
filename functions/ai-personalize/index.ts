// AI个性化护肤方案生成 Edge Function
// 根据用户肤质、预算、年龄，从数据库筛选产品并生成完整方案

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI API调用基础URL（可由用户配置覆盖）
const DEFAULT_BASE_URL = 'https://api.meoo.host/meoo-ai/compatible-mode/v1';

interface UserProfile {
  skinType: string;
  age: number;
  ageGroup: string;
  budgetLevel: string;
  concerns?: string[];
  allergicIngredients?: string[];
}

interface SkinReport {
  total_score: number;
  skin_type: string;
  moisture_level: number;
  oil_level: number;
  sensitivity_level: number;
  acne_level: number;
  pigmentation_level: number;
  wrinkle_level: number;
  pore_level: number;
  dark_circle_level: number;
}

// 从数据库筛选匹配产品
async function getMatchingProducts(
  supabase: any,
  userProfile: UserProfile,
  category: string,
  limit: number = 5
): Promise<any[]> {
  const { skinType, budgetLevel, ageGroup, allergicIngredients } = userProfile;
  
  // 预算范围映射
  const budgetRanges: Record<string, { min: number; max: number }> = {
    ultra_budget: { min: 0, max: 50 },
    budget: { min: 50, max: 150 },
    mid: { min: 150, max: 400 },
    premium: { min: 400, max: 800 },
    luxury: { min: 800, max: 10000 },
  };
  
  const range = budgetRanges[budgetLevel] || { min: 0, max: 10000 };
  
  // 基础查询
  let query = supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .gte('price_min', range.min)
    .lte('price_max', range.max);
  
  // 肤质匹配 - 产品适合用户肤质或通用
  query = query.or(`skin_types.cs.{${skinType}},skin_types.cs.{normal},skin_types.cs.{all}`);
  
  // 年龄段匹配
  query = query.or(`suitable_age_groups.cs.{${ageGroup}},suitable_age_groups.cs.{adult}`);
  
  // 排除过敏成分
  if (allergicIngredients && allergicIngredients.length > 0) {
    for (const allergen of allergicIngredients) {
      query = query.not('ingredients', 'ilike', `%${allergen}%`);
    }
  }
  
  // 按评分和销量排序
  query = query
    .order('rating', { ascending: false })
    .order('review_count', { ascending: false })
    .limit(limit * 2); // 多取一些用于排序
  
  const { data, error } = await query;
  
  if (error || !data) {
    console.error('Database query error:', error);
    return [];
  }
  
  // 计算匹配度分数并排序
  const scoredProducts = data.map((p: any) => {
    let score = 0;
    
    // 肤质匹配 (40分)
    if (p.skin_types?.includes(skinType)) score += 40;
    else if (p.skin_types?.includes('normal')) score += 20;
    
    // 预算匹配 (30分) - 越接近预算中点分数越高
    const budgetMid = (range.min + range.max) / 2;
    const priceDiff = Math.abs(p.price_min - budgetMid);
    const budgetScore = Math.max(0, 30 - priceDiff / 10);
    score += budgetScore;
    
    // 年龄匹配 (20分)
    if (p.suitable_age_groups?.includes(ageGroup)) score += 20;
    else if (p.suitable_age_groups?.includes('adult')) score += 10;
    
    // 评分加成 (10分)
    score += Math.min(10, (p.rating || 0) * 2);
    
    return { ...p, matchScore: Math.round(score) };
  });
  
  // 按匹配度排序并取前N个
  return scoredProducts
    .sort((a: any, b: any) => b.matchScore - a.matchScore)
    .slice(0, limit);
}

// 生成产品推荐理由（需要用户配置的API）
async function generateProductReason(
  product: any,
  userProfile: UserProfile,
  report: SkinReport | null,
  apiKey: string,
  baseUrl: string
): Promise<string> {
  if (!apiKey) {
    throw new Error('NO_AI_CONFIG');
  }
  
  try {
    const prompt = `请为以下护肤产品生成一句个性化推荐理由（30字以内）：

产品：${product.brand} ${product.name}
价格：¥${product.price_min}
功效：${product.description || '保湿修护'}
适合肤质：${product.skin_types?.join('、') || '所有肤质'}

用户：${userProfile.age}岁，${userProfile.skinType}肤质，${userProfile.budgetLevel}预算
${report ? `肤质问题：水润度${report.moisture_level}/10，出油${report.oil_level}/10，敏感${report.sensitivity_level}/10` : ''}

请直接返回推荐理由，不要加标题。`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [{ role: 'user', content: prompt }],
        stream: false,
      }),
    });

    if (!response.ok) return `适合${userProfile.skinType}肤质，性价比优选`;
    
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.slice(0, 30) || `适合${userProfile.skinType}肤质`;
  } catch {
    return `适合${userProfile.skinType}肤质，推荐尝试`;
  }
}

// 生成完整护肤方案
async function generateSkincareRoutine(
  supabase: any,
  userProfile: UserProfile,
  report: SkinReport | null,
  apiKey: string,
  baseUrl: string
): Promise<any> {
  const steps = ['cleanser', 'toner', 'essence', 'moisturizer', 'sunscreen'];
  const stepNames: Record<string, string> = {
    cleanser: '洁面',
    toner: '爽肤水',
    essence: '精华',
    moisturizer: '乳液/面霜',
    sunscreen: '防晒',
  };

  const routine: any[] = [];

  for (const step of steps) {
    const products = await getMatchingProducts(supabase, userProfile, step, 3);

    if (products.length > 0) {
      // 为每个产品生成推荐理由
      const productsWithReasons = await Promise.all(
        products.map(async (p) => ({
          ...p,
          aiReason: await generateProductReason(p, userProfile, report, apiKey, baseUrl),
        }))
      );

      routine.push({
        step,
        stepName: stepNames[step],
        products: productsWithReasons,
      });
    }
  }

  return routine;
}

// 生成方案总结（需要用户配置的API）
async function generateRoutineSummary(
  routine: any[],
  userProfile: UserProfile,
  report: SkinReport | null,
  apiKey: string,
  baseUrl: string
): Promise<{ title: string; description: string; tips: string[] }> {
  if (!apiKey) {
    throw new Error('NO_AI_CONFIG');
  }
  
  try {
    const prompt = `请为以下护肤方案生成总结（JSON格式）：

用户：${userProfile.age}岁，${userProfile.skinType}肤质，${userProfile.budgetLevel}预算
${report ? `肤质评分：${report.total_score}/100` : ''}
方案包含：${routine.map(r => r.stepName).join('、')}

请返回JSON格式：
{
  "title": "方案标题（15字以内）",
  "description": "方案描述（50字以内）",
  "tips": ["护肤建议1", "护肤建议2", "护肤建议3"]
}`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) throw new Error('API error');
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        title: parsed.title || `${userProfile.skinType}肤质专属方案`,
        description: parsed.description || `为您精选的个性化护肤方案`,
        tips: parsed.tips || ['坚持每日护肤', '注意防晒'],
      };
    }
  } catch {
    // fallback
  }
  
  return {
    title: `${userProfile.skinType}肤质专属方案`,
    description: `根据您的${userProfile.skinType}肤质和${userProfile.budgetLevel}预算，为您精选了${routine.length}步护肤方案。`,
    tips: ['坚持每日护肤', '注意防晒', '保持充足睡眠'],
  };
}

// 生成深度护理建议（需要用户配置的API）
async function generateDeepCareAdvice(
  analysisResult: any,
  apiKey: string,
  baseUrl: string
): Promise<{ projects: Array<{ name: string; type: 'beauty' | 'medical'; description: string; frequency: string; price: string; priority: 'high' | 'medium' | 'low' }>; summary: string }> {
  if (!apiKey) {
    throw new Error('NO_AI_CONFIG');
  }

  try {
    const prompt = `请作为专业医美顾问，根据以下肤质分析结果，生成个性化的专业美容/医美项目建议：

用户肤质数据：
- 肤质类型：${analysisResult.skin_type}
- 综合评分：${analysisResult.total_score}/100
- 年龄：${analysisResult.user_age}岁
- 水润度：${analysisResult.moisture_level}/10
- 出油度：${analysisResult.oil_level}/10
- 敏感度：${analysisResult.sensitivity_level}/10
- 痘痘：${analysisResult.acne_level}/10
- 色斑：${analysisResult.pigmentation_level}/10
- 皱纹：${analysisResult.wrinkle_level}/10
- 毛孔：${analysisResult.pore_level}/10
- 黑眼圈：${analysisResult.dark_circle_level}/10

请返回JSON格式：
{
  "projects": [
    {
      "name": "项目名称",
      "type": "beauty|medical",
      "description": "项目简介",
      "frequency": "建议频次",
      "price": "参考价格",
      "priority": "high|medium|low"
    }
  ],
  "summary": "100字以内的专业建议总结"
}

要求：
1. 推荐3-5个项目
2. 根据具体问题推荐针对性项目
3. 价格要合理
4. 优先级根据问题严重程度设定`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) throw new Error('API error');

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      return {
        projects: parsed.projects || [],
        summary: parsed.summary || '建议咨询专业机构获取个性化方案。'
      };
    }
  } catch (err) {
    console.error('Deep care advice error:', err);
  }

  return getFallbackDeepCareAdvice(analysisResult);
}

// 降级方案
function getFallbackDeepCareAdvice(analysisResult: any): { projects: Array<{ name: string; type: 'beauty' | 'medical'; description: string; frequency: string; price: string; priority: 'high' | 'medium' | 'low' }>; summary: string } {
  const projects: Array<{ name: string; type: 'beauty' | 'medical'; description: string; frequency: string; price: string; priority: 'high' | 'medium' | 'low' }> = [];

  if ((analysisResult.acne_level || 0) > 5) {
    projects.push({ name: '果酸焕肤', type: 'medical' as const, description: '改善痘痘和痘印', frequency: '每月1次', price: '500-1500元/次', priority: 'high' as const });
  }
  if ((analysisResult.moisture_level || 0) < 5) {
    projects.push({ name: '水光针', type: 'medical' as const, description: '深层补水锁水', frequency: '每月1次', price: '800-3000元/次', priority: 'high' as const });
  }
  if ((analysisResult.pigmentation_level || 0) > 5) {
    projects.push({ name: '光子嫩肤', type: 'medical' as const, description: '淡化色斑提亮肤色', frequency: '每月1次', price: '800-2500元/次', priority: 'medium' as const });
  }
  if ((analysisResult.wrinkle_level || 0) > 5) {
    projects.push({ name: '射频紧肤', type: 'medical' as const, description: '紧致肌肤淡化细纹', frequency: '每3月1次', price: '2000-5000元/次', priority: 'medium' as const });
  }
  if (projects.length === 0) {
    projects.push(
      { name: '深层清洁', type: 'beauty' as const, description: '清洁毛孔去除角质', frequency: '每2周1次', price: '150-400元/次', priority: 'low' as const },
      { name: '保湿护理', type: 'beauty' as const, description: '深层补水保湿', frequency: '每月1次', price: '200-500元/次', priority: 'low' as const }
    );
  }

  return {
    projects,
    summary: `根据您的肤质状况，建议重点关注${projects.map((p) => p.name).join('、')}等项目。`
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { type, userProfile, report, userConfig } = body;

    // 从用户配置中获取API密钥和Base URL
    const apiKey = userConfig?.apiKey || '';
    const baseUrl = userConfig?.baseUrl || DEFAULT_BASE_URL;

    // 需要AI调用的操作类型
    const aiRequiredTypes = ['generate_routine', 'get_step_products', 'product_recommendation', 'deep_care_advice'];
    if (aiRequiredTypes.includes(type) && !apiKey) {
      return new Response(
        JSON.stringify({ error: '请先配置AI服务', code: 'NO_AI_CONFIG', message: '请在AI配置页面添加文本生成服务的API密钥后重试' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);

    let result;

    switch (type) {
      case 'generate_routine':
        // 生成完整护肤方案
        const routine = await generateSkincareRoutine(supabase, userProfile, report, apiKey, baseUrl);
        const summary = await generateRoutineSummary(routine, userProfile, report, apiKey, baseUrl);
        result = {
          routine,
          summary,
          totalSteps: routine.length,
          totalProducts: routine.reduce((sum: number, r: any) => sum + r.products.length, 0),
        };
        break;

      case 'get_step_products':
        // 获取某一步骤的产品
        const { step } = body;
        const stepProducts = await getMatchingProducts(supabase, userProfile, step, 5);
        const productsWithReasons = await Promise.all(
          stepProducts.map(async (p) => ({
            ...p,
            aiReason: await generateProductReason(p, userProfile, report, apiKey, baseUrl),
          }))
        );
        result = { products: productsWithReasons };
        break;

      case 'product_recommendation':
        // 单个产品推荐（兼容旧接口）
        const { product } = body;
        const reason = await generateProductReason(product, userProfile, report, apiKey, baseUrl);
        result = {
          reasons: [
            { text: reason, type: 'ai' },
            { text: `适合${userProfile.skinType}肤质`, type: 'match' },
            { text: `${userProfile.budgetLevel}价位`, type: 'budget' },
          ]
        };
        break;

      case 'deep_care_advice':
        // 深度护理建议
        const { analysisResult } = body;
        const deepCareAdvice = await generateDeepCareAdvice(analysisResult, apiKey, baseUrl);
        result = deepCareAdvice;
        break;

      default:
        return new Response(
          JSON.stringify({ error: '未知类型', code: 'UNKNOWN_TYPE' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    console.error('Error:', err);
    // NO_AI_CONFIG error thrown from helper functions
    if (err instanceof Error && err.message === 'NO_AI_CONFIG') {
      return new Response(
        JSON.stringify({ error: '请先配置AI服务', code: 'NO_AI_CONFIG', message: '请在AI配置页面添加文本生成服务的API密钥后重试' }),
        { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({ error: message, code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
