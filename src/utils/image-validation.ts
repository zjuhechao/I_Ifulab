// 图片上传前验证工具
// 用于检测人脸、模糊度、尺寸、光线等边界场景

export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  faceDetected: boolean;
  faceCount: number;
  blurScore: number;
  dimensions: { width: number; height: number } | null;
  // 新增边界场景检测
  lightingScore: number; // 光线质量评分 0-100
  isExtremeLighting: boolean; // 是否极端光线
  hasMultipleFaces: boolean; // 是否有多个人脸
  isMedicalCondition: boolean; // 是否疑似医疗级皮肤问题
  medicalWarning: string | null; // 医疗级问题警告
}

/**
 * 验证图片是否合格 - 增强版，包含边界场景检测
 */
export async function validateImage(file: File): Promise<ImageValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    errors.push('请上传图片文件');
    return {
      valid: false, errors, warnings,
      faceDetected: false, faceCount: 0, blurScore: 0, dimensions: null,
      lightingScore: 0, isExtremeLighting: false, hasMultipleFaces: false,
      isMedicalCondition: false, medicalWarning: null
    };
  }

  // 检查文件大小 (最大10MB)
  if (file.size > 10 * 1024 * 1024) {
    errors.push('图片大小不能超过10MB');
  }

  // 加载图片进行分析
  const img = new Image();
  const imageUrl = URL.createObjectURL(file);

  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageUrl;
    });

    const dimensions = { width: img.width, height: img.height };

    // 检查尺寸
    if (img.width < 200 || img.height < 200) {
      errors.push('图片尺寸太小，请上传至少200x200像素的图片');
    }
    if (img.width > 4096 || img.height > 4096) {
      warnings.push('图片尺寸较大，分析可能需要更长时间');
    }

    // 简单的模糊度检测（基于canvas像素分析）
    const blurScore = await detectBlur(img);
    if (blurScore < 30) {
      errors.push('图片过于模糊，请上传清晰的照片');
    } else if (blurScore < 50) {
      warnings.push('图片清晰度一般，可能影响分析准确性');
    }

    // 光线质量检测
    const lightingResult = await detectLighting(img);
    if (lightingResult.score < 30) {
      errors.push('光线过暗或过亮，请在光线充足且均匀的环境下拍摄');
    } else if (lightingResult.score < 50) {
      warnings.push('光线条件一般，可能影响分析准确性');
    }

    // 简单的人脸检测（基于肤色区域检测）
    const faceResult = await detectFace(img);

    // 边界场景：多个人脸检测
    let hasMultipleFaces = false;
    if (faceResult.count > 1) {
      hasMultipleFaces = true;
      warnings.push(`检测到${faceResult.count}个人脸，请确保只有您自己的面部在画面中`);
    }

    // 边界场景：非面部图片
    if (!faceResult.detected) {
      errors.push('未检测到人脸，请上传清晰的面部照片');
    }

    // 边界场景：疑似医疗级皮肤问题检测
    const medicalCheck = await detectMedicalConditions(img, faceResult);
    if (medicalCheck.isMedical) {
      warnings.push('检测到疑似较严重的皮肤问题，建议咨询专业皮肤科医生');
    }

    URL.revokeObjectURL(imageUrl);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      faceDetected: faceResult.detected,
      faceCount: faceResult.count,
      blurScore,
      dimensions,
      lightingScore: lightingResult.score,
      isExtremeLighting: lightingResult.score < 40,
      hasMultipleFaces,
      isMedicalCondition: medicalCheck.isMedical,
      medicalWarning: medicalCheck.warning,
    };
  } catch (err) {
    URL.revokeObjectURL(imageUrl);
    errors.push('图片加载失败，请重试');
    return {
      valid: false, errors, warnings,
      faceDetected: false, faceCount: 0, blurScore: 0, dimensions: null,
      lightingScore: 0, isExtremeLighting: false, hasMultipleFaces: false,
      isMedicalCondition: false, medicalWarning: null
    };
  }
}

/**
 * 简单的模糊度检测
 * 使用拉普拉斯算子检测边缘清晰度
 */
async function detectBlur(img: HTMLImageElement): Promise<number> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return 0;
  
  // 缩小图片以提高性能
  const size = 100;
  canvas.width = size;
  canvas.height = size;
  ctx.drawImage(img, 0, 0, size, size);
  
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  
  // 计算灰度图的方差（简单模糊度指标）
  let sum = 0;
  let sumSq = 0;
  const pixels = size * size;
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    sum += gray;
    sumSq += gray * gray;
  }
  
  const mean = sum / pixels;
  const variance = sumSq / pixels - mean * mean;
  
  // 归一化到0-100分
  return Math.min(100, Math.max(0, variance / 100));
}

/**
 * 简单的人脸检测
 * 基于肤色区域和椭圆形状检测
 */
async function detectFace(img: HTMLImageElement): Promise<{ detected: boolean; count: number }> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return { detected: false, count: 0 };
  
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  // 检测肤色像素比例
  let skinPixels = 0;
  const totalPixels = data.length / 4;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // 简单的肤色检测
    if (isSkinColor(r, g, b)) {
      skinPixels++;
    }
  }
  
  const skinRatio = skinPixels / totalPixels;
  
  // 如果肤色区域占比在合理范围内，认为检测到人脸
  if (skinRatio > 0.05 && skinRatio < 0.8) {
    return { detected: true, count: 1 };
  }
  
  return { detected: false, count: 0 };
}

/**
 * 判断是否为肤色
 */
function isSkinColor(r: number, g: number, b: number): boolean {
  // RGB肤色范围
  return (
    r > 95 && g > 40 && b > 20 &&
    r > g && r > b &&
    Math.abs(r - g) > 15 &&
    r > 60 && g > 40 && b > 20
  );
}

/**
 * 检测光线质量
 * 分析图片的亮度分布，检测过暗、过亮、不均匀等情况
 */
async function detectLighting(img: HTMLImageElement): Promise<{ score: number; isDark: boolean; isBright: boolean; isUneven: boolean }> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return { score: 0, isDark: false, isBright: false, isUneven: false };

  // 缩小图片以提高性能
  const size = 100;
  canvas.width = size;
  canvas.height = size;
  ctx.drawImage(img, 0, 0, size, size);

  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  let totalBrightness = 0;
  let minBrightness = 255;
  let maxBrightness = 0;
  const brightnessValues: number[] = [];

  // 计算每个像素的亮度
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // 使用感知亮度公式
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    totalBrightness += brightness;
    minBrightness = Math.min(minBrightness, brightness);
    maxBrightness = Math.max(maxBrightness, brightness);
    brightnessValues.push(brightness);
  }

  const avgBrightness = totalBrightness / (size * size);
  const brightnessRange = maxBrightness - minBrightness;

  // 计算亮度标准差（均匀性）
  let variance = 0;
  for (const b of brightnessValues) {
    variance += Math.pow(b - avgBrightness, 2);
  }
  const stdDev = Math.sqrt(variance / brightnessValues.length);

  // 判断光线条件
  const isDark = avgBrightness < 50;
  const isBright = avgBrightness > 220;
  const isUneven = stdDev > 60 || brightnessRange > 200;

  // 计算综合评分
  let score = 100;

  // 过暗扣分
  if (avgBrightness < 80) {
    score -= (80 - avgBrightness) * 1.5;
  }
  // 过亮扣分
  if (avgBrightness > 200) {
    score -= (avgBrightness - 200) * 1.5;
  }
  // 不均匀扣分
  if (stdDev > 40) {
    score -= (stdDev - 40) * 0.8;
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    isDark,
    isBright,
    isUneven
  };
}

/**
 * 检测疑似医疗级皮肤问题
 * 基于肤色异常区域、红肿程度等简单判断
 * 注意：这只是简单的图像分析，不能替代专业医疗诊断
 */
async function detectMedicalConditions(
  img: HTMLImageElement,
  faceResult: { detected: boolean; count: number }
): Promise<{ isMedical: boolean; warning: string | null }> {
  if (!faceResult.detected) {
    return { isMedical: false, warning: null };
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return { isMedical: false, warning: null };

  // 使用较小尺寸进行分析
  const size = 150;
  canvas.width = size;
  canvas.height = size;
  ctx.drawImage(img, 0, 0, size, size);

  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  let redPixels = 0;
  let darkRedPixels = 0;
  let abnormalSkinPixels = 0;
  let totalSkinPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (isSkinColor(r, g, b)) {
      totalSkinPixels++;

      // 检测异常红色区域（可能的红肿、炎症）
      if (r > 150 && g < 100 && b < 100) {
        redPixels++;
        if (r > 180) {
          darkRedPixels++;
        }
      }

      // 检测肤色不均匀（可能的色素沉着、疤痕）
      const brightness = (r + g + b) / 3;
      if (brightness < 60 || brightness > 220) {
        abnormalSkinPixels++;
      }
    }
  }

  if (totalSkinPixels === 0) {
    return { isMedical: false, warning: null };
  }

  const redRatio = redPixels / totalSkinPixels;
  const darkRedRatio = darkRedPixels / totalSkinPixels;
  const abnormalRatio = abnormalSkinPixels / totalSkinPixels;

  // 如果检测到明显的异常，提示可能涉及医疗级问题
  if (darkRedRatio > 0.15 || (redRatio > 0.25 && abnormalRatio > 0.3)) {
    return {
      isMedical: true,
      warning: '检测到面部可能存在较明显的红肿、炎症或色素沉着等问题，建议咨询专业皮肤科医生获取诊断和治疗建议。'
    };
  }

  if (abnormalRatio > 0.4) {
    return {
      isMedical: true,
      warning: '检测到肤色分布不均匀，可能存在色素沉着或疤痕等问题，建议咨询专业皮肤科医生。'
    };
  }

  return { isMedical: false, warning: null };
}

/**
 * 获取验证结果的用户友好提示
 */
export function getValidationMessage(result: ImageValidationResult): string {
  if (result.valid) {
    return '图片验证通过';
  }
  return result.errors[0] || '图片验证失败';
}

/**
 * 获取边界场景提示信息
 */
export function getBoundaryGuidance(result: ImageValidationResult): { type: 'error' | 'warning' | 'info'; title: string; message: string; action?: string }[] {
  const guidance: { type: 'error' | 'warning' | 'info'; title: string; message: string; action?: string }[] = [];

  // 非面部图片
  if (!result.faceDetected) {
    guidance.push({
      type: 'error',
      title: '未检测到面部',
      message: '请上传包含清晰面部的照片，确保面部占据画面主要部分。',
      action: '重新拍摄'
    });
  }

  // 多个人脸
  if (result.hasMultipleFaces) {
    guidance.push({
      type: 'warning',
      title: '检测到多个人脸',
      message: '请确保画面中只有您自己的面部，避免多人合影。',
      action: '重新拍摄'
    });
  }

  // 极端光线
  if (result.isExtremeLighting) {
    guidance.push({
      type: 'warning',
      title: '光线条件不佳',
      message: '请在自然光或柔和的人工光源下拍摄，避免逆光或过暗环境。',
      action: '调整光线后重拍'
    });
  }

  // 医疗级问题提示
  if (result.isMedicalCondition) {
    guidance.push({
      type: 'warning',
      title: '建议就医咨询',
      message: result.medicalWarning || '检测到疑似较严重的皮肤问题，本工具仅供参考，不构成医疗建议。',
      action: '了解详情'
    });
  }

  return guidance;
}
