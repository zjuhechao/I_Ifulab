import type { Gender, SkinType } from "@/types";

// 肤质类型调整值
const skinTypeAdjustments: Record<SkinType, number> = {
  dry: 1,
  oily: -1,
  combination: 0,
  sensitive: 2,
  normal: -2,
};

// 性别基准
const genderBase: Record<Gender, number> = {
  female: 0,
  male: 1,
};

// 女性权重
const femaleWeights = {
  smoothness: 0.28,
  darkCircle: 0.18,
  pore: 0.18,
};

// 男性权重
const maleWeights = {
  smoothness: 0.22,
  darkCircle: 0.12,
  pore: 0.22,
  acne: 0.12,
  blackhead: 0.12,
};

interface SkinAnalysisInput {
  userAge: number;
  userGender: Gender;
  skinType: SkinType;
  totalScore: number;
  smoothnessLevel?: number;
  darkCircleLevel?: number;
  poreScore?: number;
  acneLevel?: number;
  blackheadLevel?: number;
}

interface SkinAnalysisResult {
  skinAge: number;
  skinAgeDelta: number;
  weightedScore: number;
}

/**
 * 计算肌龄
 * 公式: 肌龄 = 实际年龄 + (50 - 肤质得分) / 5 + 肤质类型调整 + 性别基准
 */
export function calculateSkinAge(input: SkinAnalysisInput): SkinAnalysisResult {
  const { userAge, userGender, skinType, totalScore } = input;

  // 基础计算
  const baseOffset = (50 - totalScore) / 5;
  const skinAdjustment = skinTypeAdjustments[skinType];
  const genderAdjustment = genderBase[userGender];

  // 计算肌龄
  const skinAge = Math.round(
    userAge + baseOffset + skinAdjustment + genderAdjustment
  );

  // 肌龄差值
  const skinAgeDelta = skinAge - userAge;

  // 加权评分（用于更精细的分析）
  const weightedScore = calculateWeightedScore(input);

  return {
    skinAge,
    skinAgeDelta,
    weightedScore,
  };
}

/**
 * 计算加权评分
 */
function calculateWeightedScore(input: SkinAnalysisInput): number {
  const { userGender, smoothnessLevel = 70, darkCircleLevel = 70, poreScore = 70 } = input;

  const weights = userGender === "female" ? femaleWeights : maleWeights;

  let weightedSum =
    smoothnessLevel * weights.smoothness +
    darkCircleLevel * weights.darkCircle +
    poreScore * weights.pore;

  let totalWeight = weights.smoothness + weights.darkCircle + weights.pore;

  // 男性额外权重
  if (userGender === "male") {
    const { acneLevel = 70, blackheadLevel = 70 } = input;
    weightedSum += acneLevel * maleWeights.acne + blackheadLevel * maleWeights.blackhead;
    totalWeight += maleWeights.acne + maleWeights.blackhead;
  }

  return Math.round(weightedSum / totalWeight);
}

/**
 * 获取肤质类型标签
 */
export function getSkinTypeLabel(skinType: SkinType): string {
  const labels: Record<SkinType, string> = {
    dry: "干性",
    oily: "油性",
    combination: "混合性",
    sensitive: "敏感性",
    normal: "中性",
  };
  return labels[skinType];
}

/**
 * 获取评分等级
 */
export function getScoreLevel(score: number): {
  level: string;
  color: string;
} {
  if (score >= 80) return { level: "优秀", color: "emerald" };
  if (score >= 60) return { level: "良好", color: "sky" };
  if (score >= 40) return { level: "一般", color: "amber" };
  return { level: "需改善", color: "rose" };
}
