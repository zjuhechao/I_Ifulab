import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Package, Plus, Clock, Sun, Moon, Calendar, CheckCircle2, 
  AlertCircle, ChevronRight, Star, Trash2, Sparkles,
  Droplets, Shield, Zap, RotateCcw, TrendingUp, Award,
  Clock3, Info, Beaker, Loader2, Wand2, Lightbulb,
  RefreshCw, CheckCircle
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

interface UserProduct {
  id: string;
  user_id: string;
  product_id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  rating: number | null;
  notes: string | null;
  product: Product;
}

interface RoutineStep {
  id: string;
  step_order: number;
  time_of_day: 'morning' | 'evening' | 'both';
  usage_amount: string | null;
  usage_instructions: string | null;
  wait_time_minutes: number | null;
  user_product: UserProduct;
}

interface SkincareRoutine {
  id: string;
  name: string;
  description: string | null;
  steps: RoutineStep[];
}

interface AIRecommendation {
  category: string;
  product: Product;
  reason: string;
  usage: {
    timeOfDay: 'morning' | 'evening' | 'both';
    amount: string;
    instructions: string;
    waitTime: number;
  };
}

const stepIcons: Record<string, React.ElementType> = {
  cleanser: Sparkles,
  toner: Droplets,
  essence: Zap,
  moisturizer: Shield,
  sunscreen: Sun,
  mask: Beaker,
};

const stepLabels: Record<string, string> = {
  cleanser: "洁面",
  toner: "爽肤水",
  essence: "精华",
  moisturizer: "乳液/面霜",
  sunscreen: "防晒",
  mask: "面膜",
};

const stepOrder = ['cleanser', 'toner', 'essence', 'moisturizer', 'sunscreen'];

export function MyProductsPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user, skinProfile, latestReport } = useAppStore();
  const [activeTab, setActiveTab] = useState("routine");
  const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
  const [routine, setRoutine] = useState<SkincareRoutine | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [showAIRecommendations, setShowAIRecommendations] = useState(false);
  const [usageStats, setUsageStats] = useState({
    totalUses: 0,
    streakDays: 0,
    satisfaction: 0,
  });

  useEffect(() => { 
    if (!isLoggedIn) navigate({ to: "/login" }); 
  }, [isLoggedIn, navigate]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadUserProducts(),
      loadRoutine(),
      loadUsageStats(),
    ]);
    setLoading(false);
  };

  const loadUserProducts = async () => {
    const { data } = await supabase
      .from('user_products')
      .select('*, product:products(*)')
      .eq('user_id', user?.id || 'guest')
      .eq('status', 'using')
      .order('created_at', { ascending: false });
    if (data) setUserProducts(data as UserProduct[]);
  };

  const loadRoutine = async () => {
    const { data: routines } = await supabase
      .from('skincare_routines')
      .select('*')
      .eq('user_id', user?.id || 'guest')
      .limit(1);
    
    if (routines && routines.length > 0) {
      const routineId = routines[0].id;
      const { data: steps } = await supabase
        .from('routine_steps')
        .select('*, user_product:user_products(*, product:products(*))')
        .eq('routine_id', routineId)
        .order('step_order', { ascending: true });
      
      setRoutine({
        ...routines[0],
        description: routines[0].description || '',
        steps: (steps || []) as RoutineStep[],
      });
    } else {
      const { data: newRoutine } = await supabase
        .from('skincare_routines')
        .insert({ user_id: user?.id || 'guest', name: '我的护肤方案' })
        .select()
        .single();
      if (newRoutine) {
        setRoutine({ ...newRoutine, description: '', steps: [] });
      }
    }
  };

  const loadUsageStats = async () => {
    const { data: logs } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', user?.id || 'guest')
      .order('used_at', { ascending: false });
    
    if (logs) {
      const totalUses = logs.length;
      const uniqueDays = new Set(logs.filter(l => l.used_at).map(l => l.used_at!.split('T')[0])).size;
      const avgSatisfaction = logs.length > 0 
        ? logs.reduce((sum, l) => sum + (l.satisfaction || 0), 0) / logs.length 
        : 0;
      
      setUsageStats({
        totalUses,
        streakDays: uniqueDays,
        satisfaction: Math.round(avgSatisfaction * 20),
      });
    }
  };

  // AI生成护肤方案
  const generateAIRecommendations = async () => {
    setGeneratingAI(true);
    
    try {
      // 获取所有可用产品
      const { data: allProducts } = await supabase.from('products').select('*');
      if (!allProducts) {
        toast.error("无法获取产品数据");
        return;
      }

      // 根据用户肤质和测肤结果智能推荐
      const skinType = skinProfile.skinType;
      const age = user?.age || 25;
      const budget = skinProfile.budgetLevel;
      const score = latestReport?.total_score || 70;
      
      const recommendations: AIRecommendation[] = [];
      
      // 为每个护肤步骤选择最合适的产品
      for (const category of stepOrder) {
        // 过滤符合肤质和预算的产品
        const suitableProducts = allProducts.filter(p => {
          const matchSkin = p.skin_types?.includes(skinType) || p.skin_types?.includes('normal');
          const matchBudget = p.budget_level === budget || (budget === 'mid' && ['budget', 'mid'].includes(p.budget_level));
          const matchCategory = p.category === category;
          return matchSkin && matchBudget && matchCategory;
        });
        
        if (suitableProducts.length > 0) {
          // 按评分和匹配度排序，选择最佳产品
          const bestProduct = suitableProducts.sort((a, b) => {
            let scoreA = (a.rating || 0);
            let scoreB = (b.rating || 0);
            if (a.skin_types?.includes(skinType)) scoreA += 2;
            if (b.skin_types?.includes(skinType)) scoreB += 2;
            return scoreB - scoreA;
          })[0];
          
          // 生成使用建议
          const usage = generateUsageInstructions(category, skinType, age);
          
          // 生成推荐理由
          const reason = generateRecommendationReason(bestProduct, skinType, score);
          
          recommendations.push({
            category,
            product: bestProduct,
            reason,
            usage,
          });
        }
      }
      
      setAiRecommendations(recommendations);
      setShowAIRecommendations(true);
      toast.success("AI方案生成完成！");
    } catch (error) {
      toast.error("生成失败，请重试");
    } finally {
      setGeneratingAI(false);
    }
  };

  // 生成使用说明
  const generateUsageInstructions = (category: string, skinType: string, age: number) => {
    const configs: Record<string, any> = {
      cleanser: {
        timeOfDay: 'both',
        amount: '黄豆大小',
        instructions: '温水打湿面部，取适量于掌心揉搓起泡，轻柔按摩面部30秒后清水洗净',
        waitTime: 0,
      },
      toner: {
        timeOfDay: 'both',
        amount: '3-5滴',
        instructions: '洁面后取适量于掌心或化妆棉，轻拍于面部至吸收',
        waitTime: 1,
      },
      essence: {
        timeOfDay: age > 25 ? 'both' : 'evening',
        amount: '2-3滴',
        instructions: '爽肤水后取适量于掌心，点涂于面部五点，由内向外轻柔推开',
        waitTime: 2,
      },
      moisturizer: {
        timeOfDay: 'both',
        amount: skinType === 'oily' ? '少量' : '适量',
        instructions: '精华吸收后，取适量均匀涂抹于面部和颈部，轻柔按摩至吸收',
        waitTime: 3,
      },
      sunscreen: {
        timeOfDay: 'morning',
        amount: '一元硬币大小',
        instructions: '护肤最后一步，取足量均匀涂抹于面部、颈部及暴露部位，出门前15分钟使用',
        waitTime: 0,
      },
    };
    return configs[category] || { timeOfDay: 'both', amount: '适量', instructions: '按说明使用', waitTime: 0 };
  };

  // 生成推荐理由
  const generateRecommendationReason = (product: Product, skinType: string, score: number) => {
    const reasons = [];
    if (product.skin_types?.includes(skinType)) reasons.push(`专为${skinType === 'dry' ? '干性' : skinType === 'oily' ? '油性' : skinType === 'sensitive' ? '敏感' : '混合'}肤质设计`);
    if ((product.rating || 0) >= 4.5) reasons.push('高分好评产品');
    if (score < 60) reasons.push('适合改善当前肌肤状态');
    if (product.budget_level === 'budget') reasons.push('性价比之选');
    return reasons.join('，') || '热门推荐产品';
  };

  // 应用AI推荐到方案
  const applyAIRecommendations = async () => {
    if (!routine || aiRecommendations.length === 0) return;
    
    // 清空现有方案
    await supabase.from('routine_steps').delete().eq('routine_id', routine.id);
    await supabase.from('user_products').delete().eq('user_id', user?.id || 'guest').eq('status', 'using');
    
    // 添加AI推荐的产品
    for (let i = 0; i < aiRecommendations.length; i++) {
      const rec = aiRecommendations[i];
      
      // 添加到user_products
      const { data: userProduct } = await supabase
        .from('user_products')
        .insert({
          user_id: user?.id || 'guest',
          product_id: rec.product.id,
          status: 'using',
        })
        .select('*, product:products(*)')
        .single();
      
      if (userProduct) {
        // 添加到routine_steps
        await supabase.from('routine_steps').insert({
          routine_id: routine.id,
          user_product_id: userProduct.id,
          step_order: i + 1,
          time_of_day: rec.usage.timeOfDay,
          usage_amount: rec.usage.amount,
          usage_instructions: rec.usage.instructions,
          wait_time_minutes: rec.usage.waitTime,
        });
      }
    }
    
    toast.success("AI方案已应用到您的护肤流程！");
    setShowAIRecommendations(false);
    loadData();
  };

  const removeFromRoutine = async (stepId: string, userProductId: string) => {
    await supabase.from('routine_steps').delete().eq('id', stepId);
    await supabase.from('user_products').delete().eq('id', userProductId);
    toast.success("已从方案中移除");
    loadData();
  };

  const logUsage = async (userProductId: string, satisfaction: number) => {
    await supabase.from('usage_logs').insert({
      user_id: user?.id || 'guest',
      user_product_id: userProductId,
      satisfaction,
    });
    toast.success("使用记录已保存");
    loadUsageStats();
  };

  const morningSteps = routine?.steps.filter(s => s.time_of_day === 'morning' || s.time_of_day === 'both') || [];
  const eveningSteps = routine?.steps.filter(s => s.time_of_day === 'evening' || s.time_of_day === 'both') || [];

  if (!isLoggedIn) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 顶部 */}
      <div className="gradient-fresh px-4 pt-12 pb-6 text-white">
        <h1 className="text-2xl font-bold mb-2">我的护肤方案</h1>
        <p className="text-white/80 text-sm">{userProducts.length} 款产品 · {routine?.steps.length || 0} 个步骤</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* AI生成按钮 */}
        <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-violet-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-sm text-violet-800">AI智能生成方案</h3>
                <p className="text-xs text-violet-600 mt-1">
                  基于您的{skinProfile.skinType}肤质、{user?.age || 25}岁年龄
                  {latestReport && `和${latestReport.total_score}分测肤结果`}，AI为您定制专属护肤方案
                </p>
                <Button 
                  size="sm" 
                  className="mt-3 bg-violet-500 hover:bg-violet-600"
                  onClick={generateAIRecommendations}
                  disabled={generatingAI}
                >
                  {generatingAI ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />生成中...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" />生成AI方案</>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-soft border-0">
            <CardContent className="p-3 text-center">
              <Package className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold">{userProducts.length}</p>
              <p className="text-xs text-muted-foreground">正在使用</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-0">
            <CardContent className="p-3 text-center">
              <RotateCcw className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{usageStats.totalUses}</p>
              <p className="text-xs text-muted-foreground">使用次数</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-0">
            <CardContent className="p-3 text-center">
              <Star className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-xl font-bold">{usageStats.satisfaction}%</p>
              <p className="text-xs text-muted-foreground">满意度</p>
            </CardContent>
          </Card>
        </div>

        {/* 标签页 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="routine">护肤流程</TabsTrigger>
            <TabsTrigger value="products">我的产品</TabsTrigger>
            <TabsTrigger value="stats">使用统计</TabsTrigger>
          </TabsList>

          {/* 护肤流程 */}
          <TabsContent value="routine" className="space-y-4 mt-4">
            {/* 晨间流程 */}
            <Card className="shadow-soft border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                    <Sun className="w-4 h-4 text-amber-600" />
                  </div>
                  晨间护肤流程
                  <Badge variant="secondary" className="ml-auto">{morningSteps.length} 步</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {morningSteps.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">暂无晨间护肤步骤</p>
                    <p className="text-xs mt-1">点击上方"生成AI方案"开始</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {morningSteps.map((step, index) => {
                      const Icon = stepIcons[step.user_product.product.category] || Package;
                      const isLast = index === morningSteps.length - 1;
                      return (
                        <div key={step.id} className="relative">
                          <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-xl">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">步骤 {index + 1}</span>
                                <Badge variant="secondary" className="text-[10px]">
                                  {stepLabels[step.user_product.product.category] || '护肤'}
                                </Badge>
                              </div>
                              <p className="font-medium text-sm">{step.user_product.product.name}</p>
                              <p className="text-xs text-muted-foreground">{step.user_product.product.brand}</p>
                              {step.usage_amount && (
                                <p className="text-xs text-sky-600 mt-1">用量: {step.usage_amount}</p>
                              )}
                              {step.usage_instructions && (
                                <p className="text-xs text-muted-foreground mt-0.5">{step.usage_instructions}</p>
                              )}
                              {(step.wait_time_minutes || 0) > 0 && !isLast && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                                  <Clock3 className="w-3 h-3" />
                                  等待 {step.wait_time_minutes} 分钟
                                </div>
                              )}
                            </div>
                            <button 
                              onClick={() => removeFromRoutine(step.id, step.user_product.id)}
                              className="p-1.5 text-muted-foreground hover:text-rose-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {!isLast && (
                            <div className="absolute left-5 top-full w-0.5 h-3 bg-border" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 晚间流程 */}
            <Card className="shadow-soft border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Moon className="w-4 h-4 text-indigo-600" />
                  </div>
                  晚间护肤流程
                  <Badge variant="secondary" className="ml-auto">{eveningSteps.length} 步</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {eveningSteps.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-sm">暂无晚间护肤步骤</p>
                    <p className="text-xs mt-1">点击上方"生成AI方案"开始</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {eveningSteps.map((step, index) => {
                      const Icon = stepIcons[step.user_product.product.category] || Package;
                      const isLast = index === eveningSteps.length - 1;
                      return (
                        <div key={step.id} className="relative">
                          <div className="flex items-start gap-3 p-3 bg-secondary/30 rounded-xl">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">步骤 {index + 1}</span>
                                <Badge variant="secondary" className="text-[10px]">
                                  {stepLabels[step.user_product.product.category] || '护肤'}
                                </Badge>
                              </div>
                              <p className="font-medium text-sm">{step.user_product.product.name}</p>
                              <p className="text-xs text-muted-foreground">{step.user_product.product.brand}</p>
                              {step.usage_amount && (
                                <p className="text-xs text-sky-600 mt-1">用量: {step.usage_amount}</p>
                              )}
                              {step.usage_instructions && (
                                <p className="text-xs text-muted-foreground mt-0.5">{step.usage_instructions}</p>
                              )}
                              {(step.wait_time_minutes || 0) > 0 && !isLast && (
                                <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                                  <Clock3 className="w-3 h-3" />
                                  等待 {step.wait_time_minutes} 分钟
                                </div>
                              )}
                            </div>
                            <button 
                              onClick={() => removeFromRoutine(step.id, step.user_product.id)}
                              className="p-1.5 text-muted-foreground hover:text-rose-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {!isLast && (
                            <div className="absolute left-5 top-full w-0.5 h-3 bg-border" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 我的产品 */}
          <TabsContent value="products" className="space-y-3 mt-4">
            {userProducts.map((up) => (
              <Card key={up.id} className="shadow-soft border-0">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <img 
                      src={up.product.image_url || ''} 
                      alt={up.product.name}
                      className="w-16 h-16 rounded-xl object-cover bg-muted"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{up.product.brand}</p>
                      <p className="font-medium text-sm">{up.product.name}</p>
                      <Badge variant="secondary" className="text-[10px] mt-1">
                        {stepLabels[up.product.category] || '护肤'}
                      </Badge>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">满意度</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => logUsage(up.id, star)}
                              className={cn(
                                "w-5 h-5",
                                (up.rating || 0) >= star ? "text-amber-400" : "text-muted-foreground"
                              )}
                            >
                              <Star className={cn("w-4 h-4", (up.rating || 0) >= star && "fill-amber-400")} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFromRoutine(
                        routine?.steps.find(s => s.user_product.id === up.id)?.id || '',
                        up.id
                      )}
                      className="p-2 text-muted-foreground hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {userProducts.length === 0 && (
              <Card className="p-8 text-center">
                <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">暂无正在使用的产品</p>
                <Button className="mt-4" onClick={generateAIRecommendations}>
                  <Wand2 className="w-4 h-4 mr-2" />
                  生成AI方案
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* 使用统计 */}
          <TabsContent value="stats" className="space-y-4 mt-4">
            <Card className="shadow-soft border-0">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  使用统计
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-sky-50 rounded-xl text-center">
                    <RotateCcw className="w-6 h-6 text-sky-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{usageStats.totalUses}</p>
                    <p className="text-xs text-muted-foreground">总使用次数</p>
                  </div>
                  <div className="p-4 bg-emerald-50 rounded-xl text-center">
                    <Calendar className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{usageStats.streakDays}</p>
                    <p className="text-xs text-muted-foreground">使用天数</p>
                  </div>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">整体满意度</span>
                    <span className="text-lg font-bold text-amber-600">{usageStats.satisfaction}%</span>
                  </div>
                  <Progress value={usageStats.satisfaction} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* AI推荐弹窗 */}
      <Sheet open={showAIRecommendations} onOpenChange={setShowAIRecommendations}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-violet-500" />
              AI为您推荐的方案
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-180px)] mt-4">
            <div className="space-y-4">
              <Alert className="bg-violet-50 border-violet-200">
                <Lightbulb className="w-4 h-4 text-violet-600" />
                <AlertDescription className="text-violet-700 text-sm">
                  基于您的肤质、年龄和测肤结果，AI为您精选了以下护肤方案
                </AlertDescription>
              </Alert>
              
              {aiRecommendations.map((rec, index) => {
                const Icon = stepIcons[rec.category] || Package;
                return (
                  <Card key={index} className="border-violet-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-violet-600" />
                        </div>
                        <div className="flex-1">
                          <Badge variant="secondary" className="text-[10px] mb-1">
                            {stepLabels[rec.category]}
                          </Badge>
                          <p className="font-medium text-sm">{rec.product.name}</p>
                          <p className="text-xs text-muted-foreground">{rec.product.brand}</p>
                          <p className="text-xs text-violet-600 mt-1">{rec.reason}</p>
                          <div className="mt-2 p-2 bg-secondary/50 rounded-lg text-xs">
                            <p><span className="text-muted-foreground">用量:</span> {rec.usage.amount}</p>
                            <p><span className="text-muted-foreground">时间:</span> {rec.usage.timeOfDay === 'morning' ? '晨间' : rec.usage.timeOfDay === 'evening' ? '晚间' : '早晚'}</p>
                            {rec.usage.waitTime > 0 && (
                              <p><span className="text-muted-foreground">等待:</span> {rec.usage.waitTime}分钟</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              
              <Button className="w-full" onClick={applyAIRecommendations}>
                <CheckCircle className="w-4 h-4 mr-2" />
                应用此方案
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setShowAIRecommendations(false)}>
                再看看
              </Button>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
