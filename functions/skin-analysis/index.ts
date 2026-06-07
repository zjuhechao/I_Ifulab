const MEOO_AI_BASE_URL = 'https://api.meoo.host';
const MEOO_PROJECT_SERVICE_AK = Deno.env.get('MEOO_PROJECT_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// 从数据库获取用户的AI配置
async function getUserAIConfig(supabase: any, userId: string, serviceType: string = 'vision') {
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
    
    if (userConfig) return { config: userConfig, source: 'user' };
    
    // 如果没有，获取系统默认配置
    const { data: defaultConfig } = await supabase
      .from('ai_service_configs')
      .select('*')
      .eq('user_id', 'default')
      .eq('service_type', serviceType)
      .eq('is_default', true)
      .single();
    
    if (defaultConfig) return { config: defaultConfig, source: 'system' };
    
    return null;
  } catch {
    return null;
  }
}

// 调用AI服务进行分析
async function callAIAnalysis(
  config: any,
  imageUrl: string,
  userAge: number,
  userGender: string
): Promise<{ success: boolean; data?: any; error?: string; errorType?: 'config_invalid' | 'api_error' | 'parse_error' }> {
  const provider = config.provider || 'meoo';
  const baseUrl = config.base_url || MEOO_AI_BASE_URL;
  const apiKey = config.api_key || MEOO_PROJECT_SERVICE_AK;
  const model = config.model || 'qwen3-vl-plus';
  
  const prompt = `请作为专业皮肤科医生，详细分析这张面部照片，给出专业的肤质分析报告。

用户基本信息：
- 年龄：${userAge}岁
- 性别：${userGender === 'female' ? '女性' : '男性'}

请从以下维度进行专业分析，每个维度给出具体评分和描述：

1. 综合评分 (total_score): 0-100分，整体肤质状况
2. 肤质类型 (skin_type): 油性/干性/混合性/敏感性/中性
3. 肤色 (skin_tone): 白皙/偏白/中等/偏黄/暗沉
4. 冷暖色调 (undertone): 冷调/暖调/中性

5. 出油情况：
   - 脸颊出油率 (cheek_oil_rate): 0-100%
   - T区出油率 (t_zone_oil_rate): 0-100%
   - 下巴出油率 (chin_oil_rate): 0-100%

6. 光滑度 (smoothness_level): 1-10分

7. 黑眼圈：
   - 类型 (dark_circle_type): 色素型/血管型/结构型/无
   - 程度 (dark_circle_level): 无/轻度/中度/重度

8. 痘痘程度 (acne_level): 无/轻度/中度/重度

9. 黑头程度 (blackhead_level): 无/轻度/中度/重度

10. 毛孔大小：
    - 额头毛孔 (forehead_pore_size): 细/中/粗
    - 鼻子毛孔 (nose_pore_size): 细/中/粗
    - 脸颊毛孔 (cheek_pore_size): 细/中/粗

11. 衰老指标：
    - 皱纹评分 (wrinkle_score): 0-100
    - 弹性评分 (elasticity_score): 0-100
    - 色斑评分 (pigmentation_score): 0-100
    - 毛孔评分 (pore_score): 0-100

12. 肌龄估计 (skin_age): 根据肌肤状态估计的肌龄，必须是一个整数，可能高于、等于或低于实际年龄${userAge}岁

13. 同龄对比分析（必须根据实际肤质状况生成，不能固定）：
    - 同龄对比百分比 (peer_percentile): 1-99之间的整数，表示肌肤状态优于多少百分比的同龄人。请根据实际肤质状况判断：
      * 如果肌肤状态优秀（总分80+，无明显问题），建议70-95
      * 如果肌肤状态良好（总分65-79，少量问题），建议50-75
      * 如果肌肤状态一般（总分50-64，有明显问题），建议30-55
      * 如果肌肤状态较差（总分<50，问题较多），建议5-35
    - 同龄对比描述 (peer_comparison_text): 如"您的肌肤状态优于85%的同龄人，在同龄人中属于上乘水平"或"您的肌肤状态优于45%的同龄人，在同龄人中处于中等水平，建议加强护理"

14. 个性化护肤建议 (skincare_advice): 根据具体肤质数据生成的个性化建议数组，每个建议包含：
    - type: "warning"/"danger"/"info"/"success"
    - title: 建议标题（如"补水保湿"、"控油清洁"、"舒缓修护"等）
    - content: 详细建议内容，必须针对用户的具体数据（如"您的肌肤水分值仅为4分，属于严重缺水状态，建议早晚使用含透明质酸的保湿精华，每周敷2-3次补水面膜"）

15. 分析总结 (analysis_summary): 200字以内的专业总结

请以JSON格式返回，确保所有字段都存在：
{
  "total_score": 78,
  "skin_type": "combination",
  "skin_tone": "中等肤色",
  "undertone": "中性",
  "cheek_oil_rate": 35,
  "t_zone_oil_rate": 55,
  "chin_oil_rate": 40,
  "smoothness_level": 7,
  "dark_circle_type": "血管型",
  "dark_circle_level": "轻度",
  "acne_level": "轻度",
  "blackhead_level": "中度",
  "forehead_pore_size": "中",
  "nose_pore_size": "中",
  "cheek_pore_size": "细",
  "wrinkle_score": 70,
  "elasticity_score": 75,
  "pigmentation_score": 65,
  "pore_score": 80,
  "skin_age": 26,
  "peer_percentile": 72,
  "peer_comparison_text": "您的肌肤状态优于72%的同龄人，在同龄人中属于中上水平",
  "skincare_advice": [
    {"type": "warning", "title": "补水保湿", "content": "您的肌肤水分值偏低，建议加强保湿护理"},
    {"type": "info", "title": "防晒护理", "content": "您的色斑评分中等，建议做好日常防晒"}
  ],
  "analysis_summary": "专业分析建议..."
}`;

  try {
    // 构建请求
    const requestBody: any = {
      model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } },
        ],
      }],
      stream: false,
    };

    // 根据不同提供商调整请求格式
    let endpoint = `${baseUrl}/meoo-ai/compatible-mode/v1/chat/completions`;
    let headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };

    // OpenAI格式适配
    if (provider === 'openai') {
      endpoint = `${baseUrl}/v1/chat/completions`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      // 判断是否是配置问题（401/403通常是密钥问题）
      if (response.status === 401 || response.status === 403) {
        return { 
          success: false, 
          error: `API认证失败: ${errorBody}`, 
          errorType: 'config_invalid' 
        };
      }
      return { 
        success: false, 
        error: `API调用失败: ${errorBody}`, 
        errorType: 'api_error' 
      };
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';

    // 提取JSON
    let analysisData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法解析AI返回的数据');
      }
    } catch (e) {
      return { 
        success: false, 
        error: 'AI分析结果解析失败', 
        errorType: 'parse_error',
        data: { rawContent: content }
      };
    }

    return { success: true, data: analysisData };
  } catch (err) {
    const message = err instanceof Error ? err.message : '未知错误';
    return { 
      success: false, 
      error: message, 
      errorType: 'api_error' 
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageUrl, userAge, userGender, userId = 'guest', useOfficialAI = false } = await req.json();

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

    let analysisResult;
    let usedConfig: any = null;
    let configSource: string = 'official';

    // 如果用户明确要求使用官方AI，跳过配置检查
    if (!useOfficialAI) {
      // 获取用户的AI配置
      const configData = await getUserAIConfig(supabase, userId, 'vision');
      
      if (configData) {
        usedConfig = configData.config;
        configSource = configData.source;
        
        // 尝试使用用户配置的AI
        const result = await callAIAnalysis(usedConfig, imageUrl, userAge, userGender);
        
        if (result.success) {
          analysisResult = result.data;
        } else {
          // 配置存在但调用失败
          let errorMessage = '';
          let shouldSuggestOfficial = false;
          
          if (result.errorType === 'config_invalid') {
            errorMessage = '您配置的AI服务认证失败，请检查API密钥是否正确';
            shouldSuggestOfficial = true;
          } else if (result.errorType === 'api_error') {
            errorMessage = `您配置的AI服务调用失败: ${result.error}`;
            shouldSuggestOfficial = true;
          } else if (result.errorType === 'parse_error') {
            errorMessage = 'AI返回的数据格式异常';
            shouldSuggestOfficial = true;
          }
          
          if (shouldSuggestOfficial) {
            return new Response(JSON.stringify({
              error: errorMessage,
              code: 'CUSTOM_AI_FAILED',
              message: '您的AI配置存在问题，是否使用官方AI服务继续分析？',
              suggestOfficial: true,
              configError: {
                provider: usedConfig.provider,
                model: usedConfig.model,
                error: result.error,
              }
            }), {
              status: 422,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }
    }

    // 如果没有使用自定义配置或配置调用失败，使用官方AI
    if (!analysisResult) {
      const officialConfig = {
        provider: 'meoo',
        base_url: MEOO_AI_BASE_URL,
        api_key: MEOO_PROJECT_SERVICE_AK,
        model: 'qwen3-vl-plus',
      };
      
      const result = await callAIAnalysis(officialConfig, imageUrl, userAge, userGender);
      
      if (!result.success) {
        return new Response(JSON.stringify({
          error: result.error || 'AI分析失败',
          code: 'OFFICIAL_AI_FAILED',
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      analysisResult = result.data;
      configSource = 'official';
    }

    // 直接使用AI返回的肌龄数据
    const skinAge = analysisResult.skin_age || userAge;
    const skinAgeDelta = skinAge - userAge;

    return new Response(JSON.stringify({
      success: true,
      data: {
        ...analysisResult,
        skin_age: skinAge,
        skin_age_delta: skinAgeDelta,
        // 确保这些字段存在
        peer_percentile: analysisResult.peer_percentile || 50,
        peer_comparison_text: analysisResult.peer_comparison_text || '您的肌肤状态处于同龄人中等水平',
        skincare_advice: analysisResult.skincare_advice || [],
      },
      meta: {
        configSource,
        provider: usedConfig?.provider || 'meoo',
        model: usedConfig?.model || 'qwen3-vl-plus',
      }
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
