import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  Sparkles, Droplets, Zap, Shield, Sun, Moon, Clock,
  AlertTriangle, CheckCircle2, Plus, Trash2, Info,
  ChevronRight, Wallet, Timer, Wand2
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price_min: number;
  price_max: number;
  image_url: string | null;
  description: string | null;
  ingredients: string[] | null;
  skin_types: string[] | null;
  rating?: number | null;
}

interface RoutineStep {
  id: string;
  order: number;
  timeOfDay: 'morning' | 'evening';
  product: Product;
  waitTime: number;
  usage: string;
  amount: string;
}

const STEP_CONFIG: Record<string, { order: number; icon: any; waitTime: number; usage: string; amount: string; label: string }> = {
  cleanser: { order: 1, icon: Sparkles, waitTime: 0, usage: "取适量于掌心，加水揉搓起泡后轻柔按摩面部30秒，温水洗净", amount: "黄豆大小", label: "洁面" },
  toner: { order: 2, icon: Droplets, waitTime: 1, usage: "倒在化妆棉上轻拍面部，或用手掌轻拍至吸收", amount: "3-5滴", label: "爽肤水" },
  essence: { order: 3, icon: Zap, waitTime: 2, usage: "取适量点涂于面部，由内向外轻柔按摩至吸收", amount: "2-3滴", label: "精华" },
  moisturizer: { order: 4, icon: Shield, waitTime: 1, usage: "取适量均匀涂抹于面部和颈部，轻柔按摩至吸收", amount: "珍珠大小", label: "乳液/面霜" },
  sunscreen: { order: 5, icon: Sun, waitTime: 2, usage: "护肤最后一步，出门前15分钟涂抹，均匀覆盖面部", amount: "一元硬币大小", label: "防晒" },
};

// 自动生成方案
async function generateAutoRoutine(skinType: string, budgetLevel: string, age: number) {
  const steps = ['cleanser', 'toner', 'essence', 'moisturizer', 'sunscreen'];
  const routine: Product[] = [];
  
  for (const step of steps) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('category', step)
      .contains('skin_types', [skinType])
      .order('rating', { ascending: false })
      .limit(1);
    
    if (data && data[0]) routine.push(data[0]);
  }
  
  return routine;
}

export function MyRoutinePage() {
  const navigate = useNavigate();
  const { isLoggedIn, user, skinProfile } = useAppStore();
  const [activeTab, setActiveTab] = useState<'morning' | 'evening'>('morning');
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [morningSteps, setMorningSteps] = useState<RoutineStep[]>([]);
  const [eveningSteps, setEveningSteps] = useState<RoutineStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => { if (!isLoggedIn) navigate({ to: "/login" }); }, [isLoggedIn, navigate]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    await loadMyProducts();
    setLoading(false);
  };

  const loadMyProducts = async () => {
    const { data } = await supabase
      .from('user_products')
      .select('product_id, products(*)')
      .eq('user_id', user?.id || 'guest')
      .eq('status', 'using');
    
    if (data && data.length > 0) {
      const products = data.map((d: any) => d.products);
      setMyProducts(products);
      generateRoutineSteps(products);
    } else {
      setMyProducts([]);
      setMorningSteps([]);
      setEveningSteps([]);
    }
  };

  const generateRoutineSteps = (products: Product[]) => {
    const createSteps = (timeOfDay: 'morning' | 'evening') => {
      const filtered = products.filter(p => {
        if (timeOfDay === 'morning') return p.category !== 'sunscreen' || p.category === 'sunscreen';
        return p.category !== 'sunscreen';
      });

      return filtered
        .map(p => ({
          id: `${timeOfDay}-${p.id}`,
          order: STEP_CONFIG[p.category]?.order || 99,
          timeOfDay,
          product: p,
          waitTime: STEP_CONFIG[p.category]?.waitTime || 1,
          usage: STEP_CONFIG[p.category]?.usage || "按说明使用",
          amount: STEP_CONFIG[p.category]?.amount || "适量",
        }))
        .sort((a, b) => a.order - b.order);
    };

    setMorningSteps(createSteps('morning'));
    setEveningSteps(createSteps('evening'));
  };

  const handleGenerateRoutine = async () => {
    setGenerating(true);
    try {
      const products = await generateAutoRoutine(skinProfile.skinType, skinProfile.budgetLevel, user?.age || 25);
      
      // 保存到用户方案
      for (const product of products) {
        await supabase.from('user_products').insert({
          user_id: user?.id || 'guest',
          product_id: product.id,
          status: 'using',
        });
      }
      
      toast.success("已生成个性化护肤方案");
      loadMyProducts();
    } catch (err) {
      toast.error("生成方案失败");
    }
    setGenerating(false);
  };

  const removeFromRoutine = async (productId: string) => {
    await supabase.from('user_products').delete()
      .eq('user_id', user?.id || 'guest')
      .eq('product_id', productId);
    toast.success("已移除");
    loadMyProducts();
  };

  const currentSteps = activeTab === 'morning' ? morningSteps : eveningSteps;
  const totalTime = currentSteps.reduce((acc, s) => acc + s.waitTime, 0);
  const totalCost = myProducts.reduce((acc, p) => acc + p.price_min, 0);

  if (loading) return <div className="p-8 text-center">加载中...</div>;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="gradient-fresh px-4 pt-12 pb-6 text-white">
        <h1 className="text-2xl font-bold">我的护肤方案</h1>
        <p className="text-white/80 text-sm mt-1">{myProducts.length > 0 ? '您的专属护肤流程' : '还没有护肤方案，点击下方生成'}</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {myProducts.length === 0 ? (
          <Card className="p-8 text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium mb-2">还没有护肤方案</h3>
            <p className="text-sm text-muted-foreground mb-4">根据您的肤质为您自动生成专属方案</p>
            <Button onClick={handleGenerateRoutine} disabled={generating} className="w-full">
              <Wand2 className="w-4 h-4 mr-2" />
              {generating ? '生成中...' : '一键生成方案'}
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
                <CardContent className="p-4 flex items-center gap-3">
                  <Wallet className="w-8 h-8 text-violet-600" />
                  <div>
                    <p className="text-xs text-violet-600">方案总费用</p>
                    <p className="text-xl font-bold text-violet-800">¥{totalCost}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-r from-sky-50 to-cyan-50 border-sky-200">
                <CardContent className="p-4 flex items-center gap-3">
                  <Timer className="w-8 h-8 text-sky-600" />
                  <div>
                    <p className="text-xs text-sky-600">预计用时</p>
                    <p className="text-xl font-bold text-sky-800">{totalTime}分钟</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'morning' | 'evening')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="morning" className="flex items-center gap-1">
                  <Sun className="w-4 h-4" />晨间
                </TabsTrigger>
                <TabsTrigger value="evening" className="flex items-center gap-1">
                  <Moon className="w-4 h-4" />晚间
                </TabsTrigger>
              </TabsList>

              <TabsContent value="morning" className="mt-4">
                <StepList steps={morningSteps} onRemove={removeFromRoutine} />
              </TabsContent>
              <TabsContent value="evening" className="mt-4">
                <StepList steps={eveningSteps} onRemove={removeFromRoutine} />
              </TabsContent>
            </Tabs>

            <Button variant="outline" className="w-full" onClick={handleGenerateRoutine} disabled={generating}>
              <Wand2 className="w-4 h-4 mr-2" />
              {generating ? '生成中...' : '重新生成方案'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function StepList({ steps, onRemove }: { steps: RoutineStep[]; onRemove: (id: string) => void }) {
  if (steps.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Info className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
        <p className="text-muted-foreground">暂无护肤步骤</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {steps.map((step, index) => {
        const Icon = STEP_CONFIG[step.product.category]?.icon || Sparkles;
        return (
          <Card key={step.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="font-medium">{STEP_CONFIG[step.product.category]?.label || step.product.category}</span>
                    <Badge variant="secondary" className="text-xs">{step.product.brand}</Badge>
                  </div>
                  <p className="text-sm font-medium mt-1">{step.product.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">用量：{step.amount}</p>
                  <p className="text-xs text-muted-foreground">{step.usage}</p>
                  {step.waitTime > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                      <Clock className="w-3 h-3" />
                      <span>等待{step.waitTime}分钟后下一步</span>
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" onClick={() => onRemove(step.product.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
