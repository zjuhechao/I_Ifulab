// 商品价格查询 Edge Function
// 支持多数据源：数据库 + AI智能推荐 + 外部平台搜索

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PriceResult {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  platform: 'taobao' | 'jd' | 'tmall' | 'database' | 'ai_recommend';
  url: string;
  shop: string;
  sales?: string;
  rating?: number;
  image?: string;
  tags: string[];
  source: 'database' | 'external_api' | 'ai_recommend';
  lastUpdated: string;
  aiReason?: string;
}

// 生成平台搜索URL
function generatePlatformUrl(platform: string, productName: string, brand: string): string {
  const encoded = encodeURIComponent(`${brand} ${productName}`);
  switch (platform) {
    case 'taobao':
      return `https://s.taobao.com/search?q=${encoded}`;
    case 'tmall':
      return `https://list.tmall.com/search_product.htm?q=${encoded}`;
    case 'jd':
      return `https://search.jd.com/Search?keyword=${encoded}`;
    default:
      return `https://www.google.com/search?q=${encoded}`;
  }
}

// 调用AI获取产品价格和推荐
async function getAIProductRecommendation(query: string, apiKey: string): Promise<PriceResult[]> {
  try {
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          {
            role: 'system',
            content: `你是一个护肤产品专家。用户搜索产品时，请提供该产品的参考价格、品牌、购买建议等信息。
请返回JSON格式：{
  "products": [
    {
      "name": "产品名称",
      "brand": "品牌",
      "category": "类别(精华/面霜/洁面等)",
      "price": 参考价格(数字),
      "rating": 评分(4.0-5.0),
      "reason": "推荐理由",
      "tags": ["标签1", "标签2"]
    }
  ]
}`
          },
          {
            role: 'user',
            content: `请帮我查询"${query}"的相关产品信息，包括参考价格、品牌、购买建议。`
          }
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content from AI');
    }

    const parsed = JSON.parse(content);
    const products = parsed.products || [];

    return products.map((p: any, index: number) => ({
      id: `ai-${Date.now()}-${index}`,
      name: p.name || query,
      brand: p.brand || '未知品牌',
      price: p.price || 199,
      originalPrice: p.price ? Math.round(p.price * 1.2) : 239,
      platform: 'ai_recommend',
      url: generatePlatformUrl('tmall', p.name || query, p.brand || ''),
      shop: `${p.brand || '品牌'}天猫旗舰店`,
      sales: 'AI推荐',
      rating: p.rating || 4.5,
      tags: p.tags || ['AI推荐', p.category || '护肤品'],
      source: 'ai_recommend',
      lastUpdated: new Date().toISOString(),
      aiReason: p.reason || '根据您的搜索推荐',
    }));
  } catch (error) {
    console.error('AI recommendation error:', error);
    return [];
  }
}

// 从数据库获取产品信息
async function getProductsFromDB(supabase: any, query: string): Promise<PriceResult[]> {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
      .limit(20);
    
    if (error || !products || products.length === 0) {
      return [];
    }
    
    return products.map((p: any) => ({
      id: `${p.id}-db`,
      name: p.name,
      brand: p.brand,
      price: p.price_min,
      originalPrice: p.price_max > p.price_min ? p.price_max : undefined,
      platform: 'tmall',
      url: generatePlatformUrl('tmall', p.name, p.brand),
      shop: `${p.brand}天猫旗舰店`,
      sales: p.review_count ? `${Math.floor(p.review_count / 1000)}万+条评价` : undefined,
      rating: p.rating,
      tags: [p.category, ...(p.skin_types || [])].slice(0, 3),
      source: 'database',
      lastUpdated: p.created_at || new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

// 生成平台搜索结果（当数据库和AI都没有结果时）
function getPlatformSearchResults(query: string): PriceResult[] {
  const platforms = [
    { name: 'taobao' as const, label: '淘宝', color: 'orange' },
    { name: 'jd' as const, label: '京东', color: 'red' },
    { name: 'tmall' as const, label: '天猫', color: 'red' },
  ];
  
  return platforms.map((platform, index) => ({
    id: `search-${platform.name}-${Date.now()}`,
    name: `${query} - 搜索`,
    brand: query,
    price: 0,
    platform: platform.name,
    url: generatePlatformUrl(platform.name, query, ''),
    shop: `${platform.label}搜索`,
    sales: '点击搜索',
    rating: 0,
    tags: ['搜索', platform.label],
    source: 'external_api',
    lastUpdated: new Date().toISOString(),
    aiReason: `在${platform.label}搜索"${query}"`,
  }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, useAI = true } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: '请提供搜索关键词', code: 'MISSING_QUERY' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const aiApiKey = Deno.env.get('DASHSCOPE_API_KEY') || '';
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);

    let allResults: PriceResult[] = [];
    let dataSources: string[] = [];
    let aiUsed = false;

    // 1. 从数据库获取
    const dbResults = await getProductsFromDB(supabase, query);
    if (dbResults.length > 0) {
      allResults = [...allResults, ...dbResults];
      dataSources.push('database');
    }

    // 2. 如果数据库没有结果，调用AI推荐
    if (allResults.length === 0 && useAI && aiApiKey) {
      const aiResults = await getAIProductRecommendation(query, aiApiKey);
      if (aiResults.length > 0) {
        allResults = [...allResults, ...aiResults];
        dataSources.push('ai_recommend');
        aiUsed = true;
      }
    }

    // 3. 如果仍然没有结果，提供平台搜索链接
    if (allResults.length === 0) {
      const searchResults = getPlatformSearchResults(query);
      allResults = [...allResults, ...searchResults];
      dataSources.push('platform_search');
    }

    // 去重（按名称+平台）
    const seen = new Set();
    allResults = allResults.filter(item => {
      const key = `${item.name}-${item.platform}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 按价格排序（价格不为0的排在前面）
    allResults.sort((a, b) => {
      if (a.price === 0 && b.price > 0) return 1;
      if (a.price > 0 && b.price === 0) return -1;
      return a.price - b.price;
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: allResults,
        meta: {
          query,
          total: allResults.length,
          lowestPrice: allResults.length > 0 && allResults[0].price > 0 ? allResults[0].price : null,
          highestPrice: allResults.length > 0 ? allResults[allResults.length - 1].price : null,
          dataSources,
          aiUsed,
          timestamp: new Date().toISOString(),
          note: aiUsed ? 'AI根据您的搜索提供了参考价格' : 
                allResults.length === 0 ? '未找到匹配产品，请尝试其他关键词' : 
                undefined,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: '查询失败', message: error?.message || '未知错误', code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
