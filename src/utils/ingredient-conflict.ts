// 成分冲突检测工具
// 用于检测护肤产品成分之间是否存在冲突

export type ConflictLevel = 'forbidden' | 'caution' | 'safe';

export interface ConflictRule {
  ingredients: string[]; // 冲突的成分组合
  level: ConflictLevel;
  reason: string;
  advice: string;
}

// 常见冲突成分规则
const CONFLICT_RULES: ConflictRule[] = [
  {
    ingredients: ['视黄醇', 'A醇', '水杨酸', '果酸', 'AHA', 'BHA'],
    level: 'caution',
    reason: 'A醇与酸类都具有剥脱角质作用，叠加使用可能导致皮肤屏障受损、敏感泛红',
    advice: '建议分开时段使用：酸类早上用，A醇晚上用；或隔天交替使用',
  },
  {
    ingredients: ['维C', '维生素C', '烟酰胺'],
    level: 'caution',
    reason: '高浓度维C（>15%）与烟酰胺（>5%）叠加可能刺激皮肤',
    advice: '低浓度可以叠加，高浓度建议分开使用：维C早上用，烟酰胺晚上用',
  },
  {
    ingredients: ['过氧化苯甲酰', '维C', '维生素C'],
    level: 'forbidden',
    reason: '过氧化苯甲酰会氧化维C，使两者都失去活性',
    advice: '严禁叠加使用，建议分开早晚使用',
  },
  {
    ingredients: ['铜肽', '维C', '维生素C'],
    level: 'forbidden',
    reason: '铜肽与维C会发生反应，降低彼此功效',
    advice: '建议分开时段使用，间隔至少30分钟',
  },
  {
    ingredients: ['视黄醇', 'A醇', '二裂酵母'],
    level: 'safe',
    reason: '两者可以协同作用，二裂酵母能缓解A醇的刺激',
    advice: '可以叠加使用，适合抗老修护',
  },
];

export interface ConflictResult {
  hasConflict: boolean;
  level: ConflictLevel;
  conflicts: Array<{
    ingredients: string[];
    reason: string;
    advice: string;
  }>;
}

/**
 * 检测成分列表中的冲突
 */
export function detectConflicts(ingredients: string[]): ConflictResult {
  const conflicts: Array<{ ingredients: string[]; reason: string; advice: string }> = [];
  let maxLevel: ConflictLevel = 'safe';

  for (const rule of CONFLICT_RULES) {
    // 检查是否包含冲突成分
    const matched = rule.ingredients.filter(ing => 
      ingredients.some(i => i.toLowerCase().includes(ing.toLowerCase()) || 
                           ing.toLowerCase().includes(i.toLowerCase()))
    );

    if (matched.length >= 2) {
      conflicts.push({
        ingredients: matched,
        reason: rule.reason,
        advice: rule.advice,
      });

      // 更新最高冲突等级
      if (rule.level === 'forbidden') {
        maxLevel = 'forbidden';
      } else if (rule.level === 'caution' && maxLevel !== 'forbidden') {
        maxLevel = 'caution';
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    level: maxLevel,
    conflicts,
  };
}

/**
 * 检测两个产品之间的成分冲突
 */
export function detectProductConflict(
  productAIngredients: string[],
  productBIngredients: string[]
): ConflictResult {
  const combined = [...productAIngredients, ...productBIngredients];
  return detectConflicts(combined);
}

/**
 * 获取冲突等级标签
 */
export function getConflictLevelLabel(level: ConflictLevel): string {
  const labels: Record<ConflictLevel, string> = {
    forbidden: '严禁叠加',
    caution: '谨慎叠加',
    safe: '可以叠加',
  };
  return labels[level];
}

/**
 * 获取冲突等级颜色
 */
export function getConflictLevelColor(level: ConflictLevel): string {
  const colors: Record<ConflictLevel, string> = {
    forbidden: 'text-rose-600 bg-rose-50',
    caution: 'text-amber-600 bg-amber-50',
    safe: 'text-emerald-600 bg-emerald-50',
  };
  return colors[level];
}
