// 形象改造 - AI美妆编辑 Edge Function
// 支持多API配置，可从数据库读取用户配置的AI服务

const MEOO_AI_BASE_URL = 'https://api.meoo.host';
const MEOO_PROJECT_SERVICE_AK = Deno.env.get('MEOO_PROJECT_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 年龄段配置
const AGE_GROUP_CONFIG: Record<string, {
  focus: string;
  techniques: string[];
  avoid: string[];
}> = {
  teen: {
    focus: '清新自然，突出青春感',
    techniques: ['轻薄底妆', '自然眉形', '淡粉色唇彩', '轻微睫毛膏'],
    avoid: ['厚重粉底', '深色口红', '夸张眼线'],
  },
  young: {
    focus: '时尚活力，展现个性',
    techniques: ['清透底妆', '流行眼妆', '渐变唇妆', '自然修容'],
    avoid: ['过于成熟', '浓重妆容'],
  },
  adult: {
    focus: '精致优雅，职场适用',
    techniques: ['遮瑕底妆', '精致眼妆', '经典唇色', '适度修容'],
    avoid: ['过于稚嫩', '夸张色彩'],
  },
  middle: {
    focus: '优雅知性，减龄提亮',
    techniques: ['保湿底妆', '提亮眼周', '柔和唇色', '轻修容'],
    avoid: ['厚重粉底', '深色唇妆', '夸张眼妆'],
  },
  senior: {
    focus: '端庄大方，气色提升',
    techniques: ['滋润底妆', '柔和眉形', '暖色唇妆', '轻透妆感'],
    avoid: ['厚重遮瑕', '冷色调', '复杂眼妆'],
  },
};

// 风格配置
const STYLE_CONFIG: Record<string, {
  name: string;
  makeup: string;
  hair: string;
  features: string[];
}> = {
  natural: {
    name: '日常裸妆',
    makeup: '轻薄透气的底妆，自然眉形，淡粉色腮红，水润唇彩，轻微睫毛膏',
    hair: '自然柔顺的发型',
    features: ['清新', '自然', '无妆感'],
  },
  office: {
    name: '职场精英',
    makeup: '精致遮瑕底妆，利落眉形，大地色眼影，经典红唇或豆沙色，适度修容',
    hair: '干练整洁的发型',
    features: ['专业', '干练', '自信'],
  },
  date: {
    name: '约会甜美',
    makeup: '清透底妆，柔和眼妆，粉色系腮红，水润唇釉，自然睫毛',
    hair: '柔美浪漫的发型',
    features: ['温柔', '浪漫', '甜美'],
  },
  sport: {
    name: '运动活力',
    makeup: '防水轻薄底妆，自然眉形，裸色眼影，润色唇膏',
    hair: '清爽利落的发型',
    features: ['阳光', '健康', '活力'],
  },
  artistic: {
    name: '文艺清新',
    makeup: '哑光底妆，自然眉形，大地色眼影，豆沙色唇妆',
    hair: '随性自然的发型',
    features: ['淡雅', '知性', '文艺'],
  },
  party: {
    name: '派对闪耀',
    makeup: '精致底妆，烟熏眼妆或亮片眼影，高光修容，饱满唇妆',
    hair: '华丽造型',
    features: ['华丽', '吸睛', '闪耀'],
  },
  retro: {
    name: '复古港风',
    makeup: '哑光底妆，浓眉，复古红唇，经典眼线',
    hair: '复古卷发',
    features: ['经典', '韵味', '复古'],
  },
  korean: {
    name: '韩系清透',
    makeup: '水光肌底妆，平眉，卧蚕眼妆，渐变唇妆，自然腮红',
    hair: '韩系发型',
    features: ['清透', '水光', '甜美'],
  },
  western: {
    name: '欧美立体',
    makeup: '立体修容，挑眉，深邃眼妆，饱满唇妆，高光提亮',
    hair: '欧美风格发型',
    features: ['立体', '轮廓', '时尚'],
  },
  japanese: {
    name: '日系可爱',
    makeup: '轻薄底妆，自然眉形，大眼妆效，粉嫩腮红，水润唇彩',
    hair: '日系发型',
    features: ['可爱', '俏皮', '甜美'],
  },
};

// 从数据库获取用户的AI配置
async function getUserAIConfig(supabase: any, userId: string, serviceType: string = 'image_gen') {
  try {
    // 先尝试获取用户自己的默认配置
    const { data: userConfig } = await supabase
      .from('ai_service_configs')
      .select('*')
      .eq('user_id', userId)
      .eq('service_type', serviceType)
      .eq('is_default', true)
      .eq('is_active', true)
      .single();
    
    if (userConfig) return userConfig;
    
    // 如果没有，获取系统默认配置
    const { data: defaultConfig } = await supabase
      .from('ai_service_configs')
      .select('*')
      .eq('user_id', 'default')
      .eq('service_type', serviceType)
      .eq('is_default', true)
      .single();
    
    return defaultConfig;
  } catch {
    return null;
  }
}

// 调用不同的AI服务
async function callAIService(
  config: any,
  imageUrl: string,
  prompt: string
): Promise<string> {
  const provider = config.provider || 'meoo';
  const baseUrl = config.base_url || MEOO_AI_BASE_URL;
  const apiKey = config.api_key || MEOO_PROJECT_SERVICE_AK;
  const model = config.model || 'wan2.7-image';
  
  // 构建请求体
  const requestBody: any = {
    model,
    input: {
      messages: [{
        role: 'user',
        content: [
          { image: imageUrl },
          { text: prompt },
        ],
      }],
    },
    parameters: {
      size: config.config?.size || '2K',
      n: 1,
      watermark: config.config?.watermark || false,
    },
  };
  
  // 根据不同提供商调整请求格式
  let endpoint = `${baseUrl}/meoo-ai/api/v1/services/aigc/image-generation/generation`;
  let headers: Record<string, string> = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  
  // OpenAI格式适配
  if (provider === 'openai') {
    endpoint = `${baseUrl}/images/generations`;
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
    // OpenAI使用不同的请求格式
    const openaiBody = {
      model: model || 'dall-e-3',
      prompt: `${prompt}\n\n参考图片: ${imageUrl}`,
      n: 1,
      size: '1024x1024',
    };
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(openaiBody),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }
    
    const data = await response.json();
    return data.data?.[0]?.url;
  }
  
  // Stability AI适配
  if (provider === 'stability') {
    endpoint = `${baseUrl}/v1/generation/${model || 'stable-diffusion-xl-1024-v1-0'}/image-to-image`;
    // Stability需要特殊处理，这里简化处理
    throw new Error('Stability AI integration requires additional setup');
  }
  
  // 默认Meoo格式
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${error}`);
  }
  
  const data = await response.json();
  return data?.output?.choices?.[0]?.message?.content?.[0]?.image;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageUrl, style, intensity, hairstyle, ageGroup = 'adult', userId = 'guest', configId } = await req.json();

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: '缺少图片URL' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 创建Supabase客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 获取AI配置
    let aiConfig;
    if (configId) {
      // 使用指定的配置
      const { data } = await supabase
        .from('ai_service_configs')
        .select('*')
        .eq('id', configId)
        .single();
      aiConfig = data;
    } else {
      // 使用默认配置
      aiConfig = await getUserAIConfig(supabase, userId, 'image_gen');
    }
    
    // 如果没有配置，使用Meoo默认
    if (!aiConfig) {
      aiConfig = {
        provider: 'meoo',
        base_url: MEOO_AI_BASE_URL,
        api_key: MEOO_PROJECT_SERVICE_AK,
        model: 'wan2.7-image',
        config: { size: '2K', watermark: false },
      };
    }

    // 获取配置
    const styleConfig = STYLE_CONFIG[style] || STYLE_CONFIG.natural;
    const ageConfig = AGE_GROUP_CONFIG[ageGroup] || AGE_GROUP_CONFIG.adult;

    // 构建提示词
    const prompt = `请对这张人像照片进行专业的美妆改造，要求效果非常明显且自然：

【妆容风格】${styleConfig.name}
${styleConfig.makeup}

【妆容强度】${intensity === 'light' ? '淡妆裸感，轻微修饰（强度30%）' : intensity === 'heavy' ? '全妆效果，浓妆艳抹（强度90%）' : '日常精致，明显妆感（强度60%）'}

【发型要求】${hairstyle === 'long' ? '长发造型，柔顺自然' : hairstyle === 'short' ? '短发造型，清爽利落' : hairstyle === 'curly' ? '卷发造型，浪漫柔美' : hairstyle === 'straight' ? '直发造型，简约时尚' : '盘发造型，优雅端庄'}

【年龄段适配】${ageConfig.focus}
推荐技法：${ageConfig.techniques.join('、')}
避免：${ageConfig.avoid.join('、')}

【改造要求】
1. 必须产生明显的妆容变化，让人一眼能看出妆前妆后的区别
2. 底妆要均匀肤色，遮盖瑕疵，提亮肤色
3. 眼妆要有明显效果：眼影、眼线、睫毛都要清晰可见
4. 唇妆要有明显色彩，与素颜形成对比
5. 眉形要修整，轮廓清晰
6. 添加适当的腮红和修容，增加立体感
7. 保持人物原有面部特征和身份识别度
8. 妆容要自然融合，不要有突兀感或假面感
9. 输出高质量的美妆效果图，分辨率清晰

【重要】改造后的图片必须与原图有明显视觉差异，展现出化妆品和护肤品可以达到的真实美妆效果。`;

    // 调用AI服务
    const imageUrl_result = await callAIService(aiConfig, imageUrl, prompt);
    
    if (!imageUrl_result) {
      return new Response(JSON.stringify({ error: '生成失败，未返回图片' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        imageUrl: imageUrl_result,
        style,
        intensity,
        hairstyle,
        ageGroup,
        styleName: styleConfig.name,
        features: styleConfig.features,
        provider: aiConfig.provider,
        model: aiConfig.model,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
