import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Clock, Sun, Moon, AlertTriangle, CheckCircle2, 
  Sparkles, Droplets, Zap, Shield, Save, X
} from "lucide-react";
import { toast } from "sonner";
import { detectConflicts, getConflictLevelLabel, getConflictLevelColor } from "@/utils/ingredient-conflict";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  ingredients: string[];
  skin_types?: string[];
  price_min?: number;
}

interface RoutineStep {
  id: string;
  order: number;
  timeOfDay: 'morning' | 'evening';
  product: Product;
  waitTime: number;
}

interface SkincareRoutineGeneratorProps {
  products: Product[];
  userAllergens?: string[];
  alternativeProducts?: Product[];
  onSave?: (routine: { morning: RoutineStep[]; evening: RoutineStep[] }) => void;
  onReplaceProduct?: (oldProduct: Product, newProduct: Product) => void;
}

const STEP_ORDER: Record<string, number> = {
  '洁面': 1, '爽肤水': 2, '精华': 3, '乳液': 4, '面霜': 4, '防晒': 5,
};

const STEP_ICONS: Record<string, React.ReactNode> = {
  '洁面': <Sparkles className="w-4 h-4" />,
  '爽肤水': <Droplets className="w-4 h-4" />,
  '精华': <Zap className="w-4 h-4" />,
  '乳液': <Shield className="w-4 h-4" />,
  '面霜': <Shield className="w-4 h-4" />,
  '防晒': <Sun className="w-4 h-4" />,
};

const STEP_WAIT_TIME: Record<string, number> = {
  '洁面': 0, '爽肤水': 1, '精华': 2, '乳液': 1, '面霜': 0, '防晒': 2,
};

// 检查产品是否含过敏原
function checkAllergens(product: Product, allergens: string[]): { hasAllergen: boolean; matchedAllergens: string[] } {
  if (!allergens.length || !product.ingredients?.length) {
    return { hasAllergen: false, matchedAllergens: [] };
  }
  
  const matched = allergens.filter(allergen => 
    product.ingredients!.some(ing => 
      ing.toLowerCase().includes(allergen.toLowerCase()) ||
      allergen.toLowerCase().includes(ing.toLowerCase())
    )
  );
  
  return { hasAllergen: matched.length > 0, matchedAllergens: matched };
}

export function SkincareRoutineGenerator({ 
  products, 
  userAllergens = [],
  alternativeProducts = [],
  onSave,
  onReplaceProduct 
}: SkincareRoutineGeneratorProps) {
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning');
  const [saved, setSaved] = useState(false);
  const [showReplacements, setShowReplacements] = useState<string | null>(null);

  // 过滤含过敏原的产品
  const safeProducts = products.filter(p => {
    const { hasAllergen } = checkAllergens(p, userAllergens);
    return !hasAllergen;
  });

  // 自动排序
  const sortedProducts = [...safeProducts].sort((a, b) => {
    const orderA = STEP_ORDER[a.category] || 99;
    const orderB = STEP_ORDER[b.category] || 99;
    return orderA - orderB;
  });

  const morningProducts = sortedProducts.filter(p => p.category === '防晒' || (p.category !== '洁面' && p.category !== '面膜'));
  const eveningProducts = sortedProducts.filter(p => p.category !== '防晒');

  const generateSteps = (productList: Product[], timeOfDay: 'morning' | 'evening'): RoutineStep[] => {
    return productList.map((product, index) => ({
      id: `${timeOfDay}-${product.id}`,
      order: index + 1,
      timeOfDay,
      product,
      waitTime: STEP_WAIT_TIME[product.category] || 1,
    }));
  };

  const morningSteps = generateSteps(morningProducts, 'morning');
  const eveningSteps = generateSteps(eveningProducts, 'evening');

  const checkFlowConflicts = (steps: RoutineStep[]) => {
    const allIngredients = steps.flatMap(s => s.product.ingredients || []);
    return detectConflicts(allIngredients);
  };

  const morningConflicts = checkFlowConflicts(morningSteps);
  const eveningConflicts = checkFlowConflicts(eveningSteps);
  const currentConflicts = activeTab === 'morning' ? morningConflicts : eveningConflicts;
  const currentSteps = activeTab === 'morning' ? morningSteps : eveningSteps;

  // 检查是否有产品被过滤
  const hasFilteredProducts = safeProducts.length < products.length;
  const filteredCount = products.length - safeProducts.length;

  const handleSave = () => {
    if (onSave) {
      onSave({ morning: morningSteps, evening: eveningSteps });
    }
    setSaved(true);
    toast.success("护肤方案已保存");
  };

  const handleReplace = (oldProduct: Product, newProduct: Product) => {
    if (onReplaceProduct) {
      onReplaceProduct(oldProduct, newProduct);
    }
    setShowReplacements(null);
    toast.success(`已替换为 ${newProduct.name}`);
  };

  // 获取某步骤的替代产品
  const getAlternatives = (category: string) => {
    return alternativeProducts.filter(p => 
      p.category === category && 
      !checkAllergens(p, userAllergens).hasAllergen
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            智能护肤流程
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'morning' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('morning')}
            >
              <Sun className="w-4 h-4 mr-1" />晨间
            </Button>
            <Button
              variant={activeTab === 'evening' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('evening')}
            >
              <Moon className="w-4 h-4 mr-1" />晚间
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 过敏原警告 */}
        {userAllergens.length > 0 && hasFilteredProducts && (
          <Alert className="border-rose-200 bg-rose-50">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <AlertDescription className="text-sm text-rose-700">
              <p className="font-medium">已过滤 {filteredCount} 个含过敏原产品</p>
              <p className="text-xs mt-1">您的过敏原：{userAllergens.join('、')}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* 成分冲突警告 */}
        {currentConflicts.hasConflict && (
          <Alert className={getConflictLevelColor(currentConflicts.level)}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <p className="font-medium">{getConflictLevelLabel(currentConflicts.level)}</p>
              {currentConflicts.conflicts.map((c, i) => (
                <p key={i} className="text-xs mt-1">{c.reason}</p>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* 护肤步骤 */}
        <div className="space-y-3">
          {currentSteps.map((step, index) => (
            <div key={step.id} className="relative">
              {index < currentSteps.length - 1 && (
                <div className="absolute left-4 top-10 w-0.5 h-6 bg-border" />
              )}
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                  {step.order}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {STEP_ICONS[step.product.category]}
                    <span className="font-medium text-sm">{step.product.category}</span>
                    <Badge variant="secondary" className="text-xs">{step.product.brand}</Badge>
                  </div>
                  <p className="text-sm text-foreground mt-1">{step.product.name}</p>
                  
                  {step.waitTime > 0 && index < currentSteps.length - 1 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      等待 {step.waitTime} 分钟
                    </div>
                  )}

                  {/* 替换按钮 */}
                  {alternativeProducts.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 text-xs"
                      onClick={() => setShowReplacements(showReplacements === step.id ? null : step.id)}
                    >
                      查看替代产品
                    </Button>
                  )}

                  {/* 替代产品列表 */}
                  {showReplacements === step.id && (
                    <div className="mt-2 space-y-2">
                      {getAlternatives(step.product.category).map(alt => (
                        <div key={alt.id} className="flex items-center justify-between p-2 bg-background rounded border">
                          <div>
                            <p className="text-xs font-medium">{alt.brand} {alt.name}</p>
                            <p className="text-xs text-muted-foreground">¥{alt.price_min}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleReplace(step.product, alt)}>
                            替换
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 总时长 */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
          <span>总步骤: {currentSteps.length}</span>
          <span>预计用时: {currentSteps.reduce((acc, s) => acc + s.waitTime, 0)} 分钟</span>
        </div>

        {/* 保存按钮 */}
        <Button className="w-full" onClick={handleSave} disabled={saved}>
          {saved ? <><CheckCircle2 className="w-4 h-4 mr-2" />已保存</> : <><Save className="w-4 h-4 mr-2" />保存护肤方案</>}
        </Button>
      </CardContent>
    </Card>
  );
}
