import { supabase } from '@/supabase/client';

export interface UserAIConfig {
  provider: 'deepseek' | 'openai' | 'anthropic' | 'qwen' | 'meoo';
  apiKey: string;
  baseUrl: string;
  model: string;
}

// 获取用户配置的AI服务
export async function getUserAIConfig(serviceType: 'text_gen' | 'image_gen' | 'vision'): Promise<UserAIConfig | undefined> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return undefined;

    // 查询用户配置的AI服务
    const { data, error } = await supabase
      .from('ai_service_configs')
      .select('*')
      .eq('user_id', user.id)
      .eq('service_type', serviceType)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return undefined;

    // 只返回有API key的配置
    if (!data.api_key) return undefined;

    return {
      provider: data.provider as UserAIConfig['provider'],
      apiKey: data.api_key,
      baseUrl: data.base_url || '',
      model: data.model || '',
    };
  } catch {
    return undefined;
  }
}

// 获取文本生成的AI配置
export async function getTextGenAIConfig(): Promise<UserAIConfig | undefined> {
  return getUserAIConfig('text_gen');
}

// 获取图像生成的AI配置
export async function getImageGenAIConfig(): Promise<UserAIConfig | undefined> {
  return getUserAIConfig('image_gen');
}

// 获取视觉理解的AI配置
export async function getVisionAIConfig(): Promise<UserAIConfig | undefined> {
  return getUserAIConfig('vision');
}
