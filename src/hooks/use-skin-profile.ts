import { useState, useEffect, useCallback } from 'react';
import type { SkinType, BudgetLevel, AgeGroup, Gender, Product } from '@/types';

interface SkinProfile {
  skinType: SkinType;
  budgetLevel: BudgetLevel;
  age: number;
  gender: Gender;
  ageGroup: AgeGroup;
}

const AGE_GROUPS: { min: number; max: number; group: AgeGroup }[] = [
  { min: 0, max: 3, group: 'infant' },
  { min: 3, max: 12, group: 'child' },
  { min: 12, max: 18, group: 'teen' },
  { min: 18, max: 100, group: 'adult' },
];

const ALLOWED_CATEGORIES: Record<AgeGroup, string[]> = {
  infant: ['cleanser', 'moisturizer', 'sunscreen'],
  child: ['cleanser', 'moisturizer', 'sunscreen', 'makeup'],
  teen: ['cleanser', 'toner', 'moisturizer', 'sunscreen'],
  adult: ['cleanser', 'toner', 'essence', 'serum', 'moisturizer', 'sunscreen', 'mask', 'makeup', 'anti-aging', 'acne'],
};

const STORAGE_KEY = 'ifulab_skin_profile';

export function useSkinProfile() {
  const [profile, setProfile] = useState<SkinProfile>({
    skinType: 'combination',
    budgetLevel: 'mid',
    age: 25,
    gender: 'female',
    ageGroup: 'adult',
  });

  // 从本地存储加载
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile({
          ...parsed,
          ageGroup: calculateAgeGroup(parsed.age),
        });
      } catch {
        // 忽略解析错误
      }
    }
  }, []);

  // 保存到本地存储
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }, [profile]);

  // 计算年龄段
  const calculateAgeGroup = useCallback((age: number): AgeGroup => {
    const group = AGE_GROUPS.find(g => age >= g.min && age < g.max);
    return group?.group || 'adult';
  }, []);

  // 更新档案
  const updateProfile = useCallback((updates: Partial<SkinProfile>) => {
    setProfile(prev => {
      const newProfile = { ...prev, ...updates };
      if (updates.age !== undefined) {
        newProfile.ageGroup = calculateAgeGroup(updates.age);
      }
      return newProfile;
    });
  }, [calculateAgeGroup]);

  // 过滤产品
  const filterProductsByAge = useCallback((products: Product[]): Product[] => {
    const allowed = ALLOWED_CATEGORIES[profile.ageGroup] || ALLOWED_CATEGORIES.adult;
    return products.filter(p => allowed.includes(p.category));
  }, [profile.ageGroup]);

  // 是否未成年人
  const isMinor = profile.age < 18;

  return {
    profile,
    updateProfile,
    filterProductsByAge,
    isMinor,
    ageGroupLabel: getAgeGroupLabel(profile.ageGroup),
  };
}

function getAgeGroupLabel(group: AgeGroup): string {
  const labels: Record<AgeGroup, string> = {
    infant: '婴幼儿',
    child: '儿童',
    teen: '青少年',
    adult: '成人',
  };
  return labels[group];
}
