import { supabase, getSupabaseUrl } from '@/supabase/client';

export interface SkinAnalysisResult {
  total_score: number;
  skin_age: number;
  skin_age_delta: number;
  skin_type: string;
  moisture_level: number;
  oil_level: number;
  sensitivity_level: number;
  acne_level: number;
  pigmentation_level: number;
  wrinkle_level: number;
  pore_level: number;
  dark_circle_level: number;
  smoothness_level: number;
  analysis_summary: string;
}

// AI返回的原始数据结构
interface AIAnalysisResponse {
  total_score: number;
  skin_type: string;
  skin_tone?: string;
  undertone?: string;
  cheek_oil_rate?: number;
  t_zone_oil_rate?: number;
  chin_oil_rate?: number;
  smoothness_level?: number;
  dark_circle_type?: string;
  dark_circle_level?: string;
  acne_level?: string;
  blackhead_level?: string;
  forehead_pore_size?: string;
  nose_pore_size?: string;
  cheek_pore_size?: string;
  wrinkle_score?: number;
  elasticity_score?: number;
  pigmentation_score?: number;
  pore_score?: number;
  analysis_summary?: string;
  skin_age?: number;
  skin_age_delta?: number;
  skin_quality_score?: number;
}

// 将AI返回的数据映射到数据库字段
function mapAIResponseToResult(aiData: AIAnalysisResponse): SkinAnalysisResult {
  // 辅助函数：将各种格式转换为1-10的数字
  const toLevel = (val: string | number | undefined, defaultVal = 5): number => {
    if (typeof val === 'number') return Math.min(10, Math.max(1, Math.round(val / 10)));
    if (val === '无' || val === 'none') return 1;
    if (val === '轻度' || val === 'slight' || val === 'low') return 3;
    if (val === '中度' || val === 'moderate' || val === 'medium') return 5;
    if (val === '重度' || val === 'severe' || val === 'high') return 8;
    if (val === '细' || val === 'small') return 3;
    if (val === '中' || val === 'medium') return 5;
    if (val === '粗' || val === 'large') return 8;
    return defaultVal;
  };

  // 计算水润度（基于出油率和光滑度）
  const moistureLevel = aiData.smoothness_level
    ? Math.min(10, Math.max(1, Math.round(aiData.smoothness_level * 0.8)))
    : 5;

  // 计算出油度（基于T区出油率）
  const oilLevel = aiData.t_zone_oil_rate
    ? Math.min(10, Math.max(1, Math.round(aiData.t_zone_oil_rate / 10)))
    : 5;

  // 敏感度（默认中等）
  const sensitivityLevel = 5;

  return {
    total_score: aiData.total_score || 70,
    skin_age: aiData.skin_age || 25,
    skin_age_delta: aiData.skin_age_delta || 0,
    skin_type: aiData.skin_type || 'combination',
    moisture_level: moistureLevel,
    oil_level: oilLevel,
    sensitivity_level: sensitivityLevel,
    acne_level: toLevel(aiData.acne_level),
    pigmentation_level: toLevel(aiData.pigmentation_score, 5),
    wrinkle_level: toLevel(aiData.wrinkle_score, 5),
    pore_level: toLevel(aiData.pore_score, 5),
    dark_circle_level: toLevel(aiData.dark_circle_level),
    smoothness_level: aiData.smoothness_level || 5,
    analysis_summary: aiData.analysis_summary || '肌肤状态良好，建议保持日常护肤习惯。',
  };
}

export async function compressImage(
  file: File,
  options?: {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    quality?: number;
    outputFormat?: 'image/jpeg' | 'image/webp';
  }
): Promise<File> {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 8000,
    quality = 0.85,
    outputFormat = 'image/webp',
  } = options || {};

  const maxBytes = maxSizeMB * 1024 * 1024;

  if (file.size <= maxBytes) {
    const img = await loadImage(file);
    if (img.width <= maxWidthOrHeight && img.height <= maxWidthOrHeight) {
      return file;
    }
  }

  const img = await loadImage(file);
  let { width, height } = img;

  if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
    const scale = Math.min(maxWidthOrHeight / width, maxWidthOrHeight / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);

  let currentQuality = quality;
  while (currentQuality > 0.1) {
    const blob = await canvasToBlob(canvas, outputFormat, currentQuality);
    if (blob.size <= maxBytes) {
      const ext = outputFormat === 'image/webp' ? 'webp' : 'jpg';
      return new File([blob], `compressed.${ext}`, { type: outputFormat });
    }
    currentQuality -= 0.1;
  }

  const blob = await canvasToBlob(canvas, outputFormat, 0.1);
  const ext = outputFormat === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], `compressed.${ext}`, { type: outputFormat });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
      type, quality
    );
  });
}

export async function uploadSkinPhoto(file: File): Promise<{ publicUrl: string; storagePath: string }> {
  const compressed = await compressImage(file);
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(compressed);
  });

  const ext = compressed.name.split('.').pop()?.toLowerCase() || 'webp';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `uploads/${fileName}`;

  // 将 base64 转换为 ArrayBuffer
  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const { error: uploadError } = await supabase.storage
    .from('skin-photos')
    .upload(storagePath, base64ToArrayBuffer(base64), { contentType: compressed.type });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('skin-photos').getPublicUrl(storagePath);

  return { publicUrl, storagePath };
}

export interface AnalysisError {
  error: string;
  code: string;
  message?: string;
  suggestOfficial?: boolean;
  configError?: {
    provider: string;
    model: string;
    error: string;
  };
}

export async function analyzeSkin(
  imageUrl: string,
  userAge: number,
  userGender: string,
  questionnaireData?: Record<string, number>,
  options?: { useOfficialAI?: boolean; userId?: string }
): Promise<SkinAnalysisResult> {
  const response = await fetch(`${getSupabaseUrl()}/functions/v1/skin-analysis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageUrl,
      userAge,
      userGender,
      questionnaireData,
      userId: options?.userId,
      useOfficialAI: options?.useOfficialAI
    }),
  });

  if (!response.ok) {
    const error = await response.json() as AnalysisError;

    // 如果是自定义AI配置失败，抛出特殊错误供上层处理
    if (error.code === 'CUSTOM_AI_FAILED' && error.suggestOfficial) {
      const customError = new Error(error.message || error.error) as Error & {
        code: string;
        originalError: AnalysisError
      };
      customError.code = 'CUSTOM_AI_FAILED';
      customError.originalError = error;
      throw customError;
    }

    throw new Error(error.error || '分析失败');
  }

  const result = await response.json();
  // 使用映射函数将AI返回的数据转换为标准格式
  return mapAIResponseToResult(result.data);
}

export async function saveSkinReport(report: {
  user_id: string;
  photo_url: string;
  photo_path: string;
  total_score: number;
  skin_age: number;
  skin_age_delta: number;
  skin_type: string;
  moisture_level: number;
  oil_level: number;
  sensitivity_level: number;
  acne_level: number;
  pigmentation_level: number;
  wrinkle_level: number;
  pore_level: number;
  dark_circle_level: number;
  smoothness_level: number;
  analysis_summary: string;
  user_age: number;
  user_gender: string;
  user_age_group: string;
}) {
  const { data, error } = await supabase
    .from('skin_reports')
    .insert(report)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSkinReports(userId: string) {
  const { data, error } = await supabase
    .from('skin_reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
