// 容·易 - AI护肤助手 类型定义

// 用户基础信息
export interface UserProfile {
  id: string;
  nickname?: string;
  avatar?: string;
  skinType: SkinType;
  budgetLevel: BudgetLevel;
  age: number;
  gender: Gender;
  ageGroup: AgeGroup;
  allergicIngredients?: string[];
}

// 性别
export type Gender = 'female' | 'male';

// 年龄段
export type AgeGroup = 'infant' | 'child' | 'teen' | 'adult';

// 肤质类型
export type SkinType = 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';

// 预算档位
export type BudgetLevel = 'ultra_budget' | 'budget' | 'mid' | 'premium' | 'luxury';

export interface BudgetRange {
  level: BudgetLevel;
  min: number;
  max: number;
  label: string;
}

// 肤质报告 - 数据库字段格式 (snake_case)
export interface SkinReport {
  id: string;
  user_id: string;
  photo_url: string | null;
  photo_path: string | null;
  total_score: number;
  skin_age: number;
  skin_age_delta: number;
  skin_type: string;
  // 9项肤质指标
  moisture_level: number | null;
  oil_level: number | null;
  sensitivity_level: number | null;
  acne_level: number | null;
  pigmentation_level: number | null;
  wrinkle_level: number | null;
  pore_level: number | null;
  dark_circle_level: number | null;
  smoothness_level: number | null;
  analysis_summary: string | null;
  ai_analysis: Record<string, unknown> | null;
  user_age: number;
  user_gender: string;
  user_age_group: string;
  created_at: string | null;
}

// 产品 - 数据库字段格式
export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price_min: number;
  price_max: number;
  budget_level: string;
  skin_types: string[] | null;
  suitable_age_groups: string[] | null;
  image_url: string | null;
  description: string | null;
  ingredients: string[] | null;
  purchase_url: string | null;
  rating: number | null;
  review_count: number | null;
  created_at: string | null;
}

// 打卡记录 - 数据库字段格式
export interface CheckInRecord {
  id: string;
  user_id: string;
  date: string;
  mood: string | null;
  tasks: { id: string; completed: boolean }[] | null;
  progress: number | null;
  completed: boolean | null;
  created_at: string | null;
}

// 打卡任务
export interface CheckInTask {
  id: string;
  name: string;
  completed: boolean;
  category: TaskCategory;
}

// 任务类别
export type TaskCategory = 'cleansing' | 'skincare' | 'diet' | 'sleep' | 'exercise';

// 心情
export type Mood = 'great' | 'good' | 'neutral' | 'tired' | 'bad';

// 产品类别
export type ProductCategory = 
  | 'cleanser' 
  | 'toner' 
  | 'essence' 
  | 'serum' 
  | 'moisturizer' 
  | 'sunscreen' 
  | 'mask' 
  | 'makeup' 
  | 'anti-aging' 
  | 'acne';

// 功能入口
export interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  path: string;
}

// 导航项
export interface NavItem {
  path: string;
  label: string;
  icon: string;
  active?: boolean;
}

// AI分析结果
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
