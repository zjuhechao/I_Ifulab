import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles, Droplets, Shield, AlertTriangle, ChevronRight,
  ShoppingBag, Heart, Share2, Star, CheckCircle2, ExternalLink,
  Filter, GitCompare, Zap, Leaf, Sun, Package, ThumbsUp, Search,
  Target, Sparkle, Info
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/supabase/client";
import { PRODUCTS_DATA } from "@/services/products";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SkinType, BudgetLevel, AgeGroup } from "@/types";

interface Product {
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
  target_concerns?: string[] | null;
  aiReason?: string;
  matchScore?: number;
  matchReasons?: string[];
}

const skinTypeLabels: Record<SkinType, string> = {
  dry: "干性", oily: "油性", combination: "混合性", sensitive: "敏感性", normal: "中性",
};
const budgetLabels: Record<BudgetLevel, string> = {
  ultra_budget: "极简", budget: "经济", mid: "中等", premium: "高端", luxury: "奢华",
};

const steps = [
  { id: "cleanser", label: "洁面", icon: Sparkles, desc: "清洁是护肤第一步" },
  { id: "toner", label: "爽肤水", icon: Droplets, desc: "补水调理肌肤" },
  { id: "essence", label: "精华", icon: Zap, desc: "高浓度活性成分" },
  { id: "moisturizer", label: "乳液/面霜", icon: Shield, desc: "锁住水分营养" },
  { id: "sunscreen", label: "防晒", icon: Sun, desc: "防护紫外线伤害" },
];

// 肤质问题关键词映射
const concernKeywords: Record<string, string[]> = {
  acne: ['水杨酸', '茶树', '烟酰胺', '锌', '果酸', '祛痘'],
  moisturizing: ['玻尿酸', '透明质酸', '神经酰胺', '甘油', '保湿', '补水'],
  soothing: ['积雪草', '洋甘菊', '芦荟', '泛醇', '舒缓', '修护'],
  whitening: ['维C', '烟酰胺', '熊果苷', '传明酸', '美白', '淡斑'],
  antiAging: ['A醇', '视黄醇', '肽', '胶原蛋白', '抗老', '紧致'],
  pore: ['水杨酸', '果酸', '烟酰胺', '毛孔'],
  oilControl: ['锌', '茶树', '水杨酸', '烟酰胺', '控油'],
};

export function RecommendPage() {
  const navigate = useNavigate();
  const { isLoggedIn, skinProfile, user, latestReport } = useAppStore();
  
  const [activeStep, setActiveStep] = useState("cleanser");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const skinType = skinProfile.skinType;
  const age = user?.age || 25;
  const ageGroup = skinProfile.ageGroup;
  const budgetLevel = skinProfile.budgetLevel;

  useEffect(() => { if (!isLoggedIn) navigate({ to: "/login" }); }, [isLoggedIn, navigate]);

  useEffect(() => {
    loadProducts();
    loadFavorites();
  }, [activeStep, skinType, budgetLevel]);

  const loadProducts = async () => {
    setLoading(true);
    setUsingFallback(false);
    try {
      // 直接从数据库加载该分类的产品
      const { data: dbProducts, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', activeStep)
        .limit(50);
      
      if (error || !dbProducts || dbProducts.length === 0) {
        // 使用本地数据
        const localProducts = PRODUCTS_DATA.filter(p => p.category === activeStep);
        const scored = scoreAndSortProducts(localProducts);
        setProducts(scored);
        setUsingFallback(true);
      } else {
        const scored = scoreAndSortProducts(dbProducts);
        setProducts(scored);
      }
    } catch (err) {
      const localProducts = PRODUCTS_DATA.filter(p => p.category === activeStep);
      const scored = scoreAndSortProducts(localProducts);
      setProducts(scored);
      setUsingFallback(true);
    }
    setLoading(false);
  };

  // 根据用户数据计算产品匹配度并排序
  const scoreAndSortProducts = (products: Product[]): Product[] => {
    const budgetRanges: Record<string, { min: number; max: number }> = {
      ultra_budget: { min: 0, max: 100 },
      budget: { min: 50, max: 200 },
      mid: { min: 100, max: 500 },
      premium: { min: 300, max: 1000 },
      luxury: { min: 800, max: 10000 },
    };
    const range = budgetRanges[budgetLevel] || { min: 0, max: 10000 };

    // 获取用户肤质问题
    const userConcerns: string[] = [];
    if (latestReport) {
      if ((latestReport.acne_level || 0) > 4) userConcerns.push('acne');
      if ((latestReport.moisture_level || 0) < 5) userConcerns.push('moisturizing');
      if ((latestReport.sensitivity_level || 0) > 5) userConcerns.push('soothing');
      if ((latestReport.pigmentation_level || 0) > 4) userConcerns.push('whitening');
      if ((latestReport.wrinkle_level || 0) > 4) userConcerns.push('antiAging');
      if ((latestReport.pore_level || 0) > 5) userConcerns.push('pore');
      if ((latestReport.oil_level || 0) > 6) userConcerns.push('oilControl');
    }

    return products
      .map(p => {
        let score = 0;
        const reasons: string[] = [];

        // 肤质匹配 (最高40分)
        if (p.skin_types?.includes(skinType)) {
          score += 40;
          reasons.push(`适合${skinTypeLabels[skinType]}肤质`);
        } else if (p.skin_types?.includes('normal')) {
          score += 20;
          reasons.push('适合所有肤质');
        }

        // 预算匹配 (最高25分) - 更宽松
        if (p.price_min >= range.min && p.price_max <= range.max) {
          score += 25;
          reasons.push('符合预算');
        } else if (p.price_min <= range.max * 1.5) {
          score += 15;
          reasons.push('价格可接受');
        }

        // 年龄匹配 (最高15分)
        if (p.suitable_age_groups?.includes(ageGroup)) {
          score += 15;
          reasons.push('适合年龄段');
        }

        // 肤质问题针对性推荐 (最高30分) - 优先级最高
        userConcerns.forEach(concern => {
          const keywords = concernKeywords[concern] || [];
          const hasMatch = p.ingredients?.some(ing => 
            keywords.some(k => ing.toLowerCase().includes(k.toLowerCase()))
          ) || p.description?.toLowerCase().includes(concern.toLowerCase())
            || p.target_concerns?.includes(concern);
          
          if (hasMatch) {
            score += 30;
            const concernNames: Record<string, string> = {
              acne: '针对痘痘', moisturizing: '改善干燥', soothing: '舒缓敏感',
              whitening: '淡化色斑', antiAging: '抗老紧致', pore: '收缩毛孔', oilControl: '控油'
            };
            reasons.push(concernNames[concern] || '针对性护理');
          }
        });

        // 评分加成 (最高10分)
        if ((p.rating || 0) >= 4.5) {
          score += 10;
          reasons.push(`${p.rating}分好评`);
        }

        // 过敏成分检查 - 扣分但不排除
        if (user?.allergicIngredients?.length && p.ingredients) {
          const hasAllergen = user.allergicIngredients.some(allergen =>
            p.ingredients!.some(ing => ing.toLowerCase().includes(allergen.toLowerCase()))
          );
          if (hasAllergen) {
            score -= 50; // 大幅降低分数
            reasons.push('⚠️ 含过敏成分');
          }
        }

        return { ...p, matchScore: Math.max(0, score), matchReasons: reasons.slice(0, 3) };
      })
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  };

  const loadFavorites = async () => {
    const { data } = await supabase.from('user_favorites').select('product_id').eq('user_id', user?.id || 'guest');
    if (data) setFavorites(new Set(data.map(f => f.product_id)));
  };

  const toggleFavorite = async (productId: string) => {
    const userId = user?.id || 'guest';
    if (favorites.has(productId)) {
      await supabase.from('user_favorites').delete().eq('user_id', userId).eq('product_id', productId);
      setFavorites(prev => { const next = new Set(prev); next.delete(productId); return next; });
      toast.success("已取消收藏");
    } else {
      await supabase.from('user_favorites').insert({ user_id: userId, product_id: productId });
      setFavorites(prev => new Set(prev).add(productId));
      toast.success("已收藏");
    }
  };

  const toggleCompare = (product: Product) => {
    if (compareList.find(p => p.id === product.id)) {
      setCompareList(prev => prev.filter(p => p.id !== product.id));
    } else if (compareList.length < 2) {
      setCompareList(prev => [...prev, product]);
    } else {
      toast.error("最多对比2个产品");
    }
  };

  const filteredProducts = products.filter(p => 
    p.price_min >= priceRange[0] && p.price_max <= priceRange[1]
  );

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="gradient-fresh px-4 pt-12 pb-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">智能推荐</h1>
          <button onClick={() => setShowFilters(!showFilters)} className="p-2 rounded-lg bg-white/20">
            <Filter className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge className="bg-white/20 text-white border-0">
            <Sparkles className="w-3 h-3 mr-1" />
            {skinTypeLabels[skinType]}
          </Badge>
          <Badge className="bg-white/20 text-white border-0">{budgetLabels[budgetLevel]}</Badge>
          <Badge className="bg-white/20 text-white border-0">{age}岁</Badge>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {usingFallback && (
          <Alert className="border-amber-200 bg-amber-50">
            <Info className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-700 text-sm">
              正在使用本地产品数据为您推荐
            </AlertDescription>
          </Alert>
        )}

        {latestReport && (
          <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-violet-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm text-violet-800">基于您的肤质报告</h3>
                  <p className="text-xs text-violet-600 mt-1">评分: {latestReport.total_score}/100</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-soft border-0">
          <CardContent className="p-4">
            <div className="grid grid-cols-5 gap-2">
              {steps.map((step) => (
                <button 
                  key={step.id} 
                  onClick={() => setActiveStep(step.id)} 
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                    activeStep === step.id ? "bg-primary text-white" : "bg-secondary text-muted-foreground"
                  )}
                >
                  <step.icon className="w-4 h-4" />
                  <span className="text-[10px] font-medium">{step.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {showFilters && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">价格区间</span>
              <span className="text-xs text-muted-foreground">¥{priceRange[0]}-¥{priceRange[1]}</span>
            </div>
            <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={2000} step={50} />
          </Card>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Card key={i} className="h-28 animate-pulse bg-muted" />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card className="p-8 text-center">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-2">暂无符合条件的产品</p>
              <Button onClick={() => setPriceRange([0, 2000])}>重置筛选</Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredProducts.slice(0, 10).map((product, index) => {
                const isFavorite = favorites.has(product.id);
                return (
                  <Card key={product.id} className="shadow-soft border-0 overflow-hidden">
                    <CardContent className="p-3">
                      <div className="flex gap-3">
                        <img src={product.image_url || ''} alt={product.name} className="w-20 h-20 rounded-xl object-cover bg-muted" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs text-muted-foreground">{product.brand}</p>
                              <h3 className="font-medium text-sm truncate">{product.name}</h3>
                            </div>
                            <button onClick={() => toggleFavorite(product.id)} className={cn("p-1.5", isFavorite ? "text-rose-500" : "text-muted-foreground")}>
                              <Heart className={cn("w-4 h-4", isFavorite && "fill-rose-500")} />
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1 mt-1">
                            {product.matchReasons?.map((r, i) => (
                              <span key={i} className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded font-medium",
                                r.includes('过敏') ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"
                              )}>
                                {r}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-emerald-400 to-sky-400 rounded-full" style={{ width: `${Math.min(100, product.matchScore || 50)}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{product.matchScore}%</span>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              <span className="text-xs">{product.rating}</span>
                            </div>
                            <p className="text-lg font-bold text-primary">¥{product.price_min}</p>
                          </div>

                          <div className="flex gap-2 mt-2">
                            <Button size="sm" className="flex-1" onClick={() => { setSelectedProduct(product); setIsDetailOpen(true); }}>
                              查看详情
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <SheetContent className="sm:max-w-md">
          {selectedProduct && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedProduct.name}</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                <img src={selectedProduct.image_url || ''} alt={selectedProduct.name} className="w-full h-48 object-cover rounded-xl mb-4" />
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{selectedProduct.brand}</p>
                  <p className="text-2xl font-bold text-primary">¥{selectedProduct.price_min}</p>
                  <p className="text-sm">{selectedProduct.description}</p>
                  <Button className="w-full" onClick={() => selectedProduct.purchase_url && window.open(selectedProduct.purchase_url, '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" />去购买
                  </Button>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
