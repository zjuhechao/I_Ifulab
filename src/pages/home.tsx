import { useEffect, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  ScanFace, Sparkles, Scale, Wand2, CalendarCheck, TrendingUp,
  ChevronRight, Bell, Plus, Lightbulb, Clock, BookOpen, CheckCircle2, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/supabase/client";
import { getTextGenAIConfig } from "@/services/aiConfig";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MedicalDisclaimer } from "@/components/medical-disclaimer";

const FEATURE_CARDS = [
  { id: "skin-test", title: "AI测肤", description: "拍照生成肤质报告", icon: ScanFace, gradient: "from-sky-400 to-cyan-400", path: "/skin-test" },
  { id: "recommend", title: "产品推荐", description: "个性化护肤方案", icon: Sparkles, gradient: "from-rose-400 to-pink-400", path: "/recommend" },
  { id: "price-compare", title: "商品比价", description: "淘宝京东价格对比", icon: Scale, gradient: "from-amber-400 to-orange-400", path: "/price-compare" },
  { id: "beauty-transform", title: "形象改造", description: "AI生成美妆造型", icon: Wand2, gradient: "from-violet-400 to-purple-400", path: "/beauty-transform" },
  { id: "check-in", title: "每日打卡", description: "记录护肤作息饮食", icon: CalendarCheck, gradient: "from-emerald-400 to-teal-400", path: "/check-in" },
  { id: "tracking", title: "肤质追踪", description: "查看肌肤变化趋势", icon: TrendingUp, gradient: "from-blue-400 to-indigo-400", path: "/tracking" },
];

interface Tip {
  id: string;
  content: string;
  category: string | null;
}

interface Article {
  id: string;
  title: string;
  summary: string | null;
  cover_image: string | null;
  category: string | null;
  author: string | null;
  read_count: number | null;
  isFallback?: boolean;
}

function useTips() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTips() {
      try {
        const { data, error } = await supabase
          .from('tips')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        setTips(data || []);
      } catch {
        setTips([
          { id: '1', content: '每天饮水2000ml，肌肤更水润', category: 'general' },
          { id: '2', content: '防晒是抗老第一步，四季都要涂', category: 'general' },
          { id: '3', content: '洁面后3分钟内涂抹护肤品效果最佳', category: 'general' },
          { id: '4', content: '每周2次去角质，帮助护肤品吸收', category: 'general' },
          { id: '5', content: '睡眠不足会导致肌肤暗沉和细纹', category: 'general' },
          { id: '6', content: '氨基酸洁面比皂基更温和，适合敏感肌', category: 'cleaning' },
          { id: '7', content: '卸妆油乳化要充分，避免残留堵塞毛孔', category: 'cleaning' },
          { id: '8', content: '洗脸水温控制在32-35℃最适宜', category: 'cleaning' },
          { id: '9', content: '晨间洁面可只用清水，避免过度清洁', category: 'cleaning' },
          { id: '10', content: '定期清洁化妆刷，防止细菌滋生', category: 'cleaning' },
          { id: '11', content: '玻尿酸能吸收自身重量1000倍的水分', category: 'moisturizing' },
          { id: '12', content: '油皮也需要保湿，选择清爽质地即可', category: 'moisturizing' },
          { id: '13', content: '敷面膜时间控制在15-20分钟', category: 'moisturizing' },
          { id: '14', content: '面霜是锁水关键，精华后必须使用', category: 'moisturizing' },
          { id: '15', content: '喷雾后要用纸巾轻压，避免水分蒸发带走皮肤水分', category: 'moisturizing' },
          { id: '16', content: 'SPF30已足够日常通勤，关键是足量涂抹', category: 'sunscreen' },
          { id: '17', content: '防晒霜需要提前20分钟涂抹才能成膜', category: 'sunscreen' },
          { id: '18', content: '户外每2小时补涂一次防晒', category: 'sunscreen' },
          { id: '19', content: '阴天紫外线依然存在，防晒不能省', category: 'sunscreen' },
          { id: '20', content: '硬防晒（帽子、伞）比防晒霜更有效', category: 'sunscreen' },
          { id: '21', content: '维A醇是抗老黄金成分，需建立耐受', category: 'antiaging' },
          { id: '22', content: '抗氧化精华早上用，对抗自由基', category: 'antiaging' },
          { id: '23', content: '颈部护理不能忽视，暴露年龄的细节', category: 'antiaging' },
          { id: '24', content: '表情纹可通过肉毒素改善，护肤品效果有限', category: 'antiaging' },
          { id: '25', content: '胶原蛋白内服效果有限，外用更实际', category: 'antiaging' },
          { id: '26', content: '烟酰胺能阻断黑色素转运，美白效果显著', category: 'whitening' },
          { id: '27', content: '维C精华需避光保存，建议晚上使用', category: 'whitening' },
          { id: '28', content: '美白产品需连续使用28天才能见效', category: 'whitening' },
          { id: '29', content: '晒后72小时内是美白黄金期', category: 'whitening' },
          { id: '30', content: '果酸换肤后必须严格防晒', category: 'whitening' },
          { id: '31', content: '敏感肌避免使用含酒精、香精的产品', category: 'sensitive' },
          { id: '32', content: '皮肤屏障受损时精简护肤，只留基础保湿', category: 'sensitive' },
          { id: '33', content: '红血丝肌肤避免热水洗脸和蒸脸', category: 'sensitive' },
          { id: '34', content: ' patch test 是敏感肌试新品的必备步骤', category: 'sensitive' },
          { id: '35', content: '神经酰胺是修复屏障的明星成分', category: 'sensitive' },
          { id: '36', content: '痘痘肌避免用手挤痘，易留痘印痘坑', category: 'acne' },
          { id: '37', content: '水杨酸能深入毛孔溶解油脂，适合油痘肌', category: 'acne' },
          { id: '38', content: '痘痘贴只适用于已破口的痘痘', category: 'acne' },
          { id: '39', content: '反复长痘建议检查激素水平', category: 'acne' },
          { id: '40', content: '痘印分红色和褐色，处理方式不同', category: 'acne' },
          { id: '41', content: '多吃富含维C的水果有助于美白', category: 'diet' },
          { id: '42', content: '高糖饮食会加速皮肤糖化老化', category: 'diet' },
          { id: '43', content: '牛奶可能加重部分人的痘痘问题', category: 'diet' },
          { id: '44', content: '深海鱼油中的Omega-3有助抗炎', category: 'diet' },
          { id: '45', content: '睡前3小时避免大量饮水，防止水肿', category: 'diet' },
          { id: '46', content: '晚上11点前入睡有助于皮肤修复', category: 'sleep' },
          { id: '47', content: '侧睡可能加重法令纹，建议仰睡', category: 'sleep' },
          { id: '48', content: '定期更换枕套，减少细菌接触', category: 'sleep' },
          { id: '49', content: '运动后及时清洁，避免汗液刺激', category: 'exercise' },
          { id: '50', content: '瑜伽等运动能促进血液循环，改善气色', category: 'exercise' },
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchTips();
  }, []);

  return { tips, loading };
}

// 获取今天的日期字符串（YYYY-MM-DD格式）
function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// AI生成每日护肤文章
async function generateDailyArticle(): Promise<Article & { isFallback?: boolean }> {
  try {
    // 获取用户配置的AI
    const userConfig = await getTextGenAIConfig();

    const { data, error } = await supabase.functions.invoke('ai-personalize', {
      body: {
        type: 'daily_article',
        prompt: '请生成一篇每日护肤知识文章，包含标题和正文（400-500字），主题可以是：护肤技巧、成分科普、季节护理、误区解答等。返回JSON格式：{title: "文章标题", content: "文章内容"}',
        userConfig
      }
    });

    if (error) throw error;

    return {
      id: 'ai-daily-' + Date.now(),
      title: data?.title || '每日护肤小贴士',
      summary: data?.content || '保持规律作息，做好基础护肤。',
      cover_image: null,
      category: 'AI生成',
      author: '容·易 AI',
      read_count: Math.floor(Math.random() * 500) + 500,
      isFallback: false,
    };
  } catch {
    // 降级方案
    return {
      id: 'ai-daily-fallback',
      title: '每日护肤小贴士',
      summary: '护肤是一门科学，需要根据个人肤质、季节变化来调整。建议每天做好清洁、保湿、防晒三步基础护理。清洁能去除污垢和多余油脂，保湿帮助维持肌肤屏障，防晒则是预防光老化的关键。建议根据季节和肤质变化调整护肤品，定期观察肌肤状态，建立适合自己的护肤流程。',
      cover_image: null,
      category: 'AI生成',
      author: '容·易 AI',
      read_count: 500,
      isFallback: true,
    };
  }
}

// 本地存储的文章缓存键
const ARTICLE_CACHE_KEY = 'ifulab_daily_article';

interface ArticleCache {
  date: string;
  article: Article;
}

function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDailyArticle() {
      const today = getTodayString();
      setLoading(true);

      // 尝试从本地存储读取缓存
      try {
        const cached = localStorage.getItem(ARTICLE_CACHE_KEY);
        if (cached) {
          const cacheData: ArticleCache = JSON.parse(cached);
          // 如果缓存是今天的，直接使用
          if (cacheData.date === today) {
            setArticles([cacheData.article]);
            setLoading(false);
            return;
          }
        }
      } catch {
        // 本地存储读取失败，继续生成新文章
      }

      // 生成新文章并缓存
      const article = await generateDailyArticle();
      setArticles([article]);

      // 保存到本地存储（只有非降级内容才缓存）
      if (!article.isFallback) {
        try {
          const cacheData: ArticleCache = { date: today, article };
          localStorage.setItem(ARTICLE_CACHE_KEY, JSON.stringify(cacheData));
        } catch {
          // 本地存储写入失败，忽略
        }
      }

      setLoading(false);
    }

    loadDailyArticle();
  }, []);

  return { articles, loading };
}

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const [animated, setAnimated] = useState(false);
  
  useEffect(() => { setTimeout(() => setAnimated(true), 100); }, []);
  
  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="oklch(0.9 0.01 260)" strokeWidth="8" />
        <circle cx="50" cy="50" r="45" fill="none" stroke="oklch(0.65 0.12 220)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={animated ? strokeDashoffset : circumference}
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-foreground">{score}</span>
        <span className="text-xs text-muted-foreground">综合评分</span>
      </div>
    </div>
  );
}

function FeatureCard({ card, index, onClick }: { card: typeof FEATURE_CARDS[0]; index: number; onClick: () => void }) {
  const Icon = card.icon;
  return (
    <button onClick={onClick} className={cn("group relative overflow-hidden rounded-2xl bg-card p-4 text-left shadow-soft transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1 active:scale-95")} style={{ animationDelay: `${index * 100}ms` }}>
      <div className={cn("absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-20 bg-gradient-to-br", card.gradient)} />
      <div className={cn("relative mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg", card.gradient)}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">{card.title}</h3>
      <p className="text-xs text-muted-foreground line-clamp-1">{card.description}</p>
      <ChevronRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-1" />
    </button>
  );
}

export function HomePage() {
  const router = useRouter();
  const { isLoggedIn, user, latestReport, todayCheckIn, checkInRecords } = useAppStore();
  const [currentTip, setCurrentTip] = useState(0);
  const { tips } = useTips();
  const { articles, loading: articleLoading } = useArticles();
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => { if (!isLoggedIn) router.navigate({ to: '/login' }); }, [isLoggedIn, router]);

  useEffect(() => {
    if (tips.length === 0) return;
    const timer = setInterval(() => setCurrentTip((prev) => (prev + 1) % tips.length), 5000);
    return () => clearInterval(timer);
  }, [tips.length]);

  const handleCardClick = (path: string) => router.navigate({ to: path });
  const userName = user?.nickname || '护肤达人';
  const lastScore = latestReport?.total_score || 0;
  const daysSinceLastTest = latestReport?.created_at ? Math.floor((Date.now() - new Date(latestReport.created_at).getTime()) / (1000 * 60 * 60 * 24)) : null;
  const needsRetest = daysSinceLastTest === null || daysSinceLastTest > 7;

  // 今日打卡数据 - 从数据库加载
  const [todayTasksData, setTodayTasksData] = useState<{completed: number; total: number; progress: number}>({ completed: 0, total: 6, progress: 0 });

  useEffect(() => {
    async function loadTodayCheckIn() {
      if (!user?.id) return;
      const today = new Date().toISOString().split('T')[0];
      const { data: record } = await supabase
        .from('check_in_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single();

      if (record?.tasks && Array.isArray(record.tasks)) {
        const tasks = record.tasks;
        const completed = tasks.filter((t: any) => t.completed).length;
        const total = tasks.length || 6;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        setTodayTasksData({ completed, total, progress });
      } else {
        // 如果没有打卡记录，使用默认任务数
        setTodayTasksData({ completed: 0, total: 6, progress: 0 });
      }
    }
    loadTodayCheckIn();
  }, [user?.id]);

  // 获取最近7天的肌肤分数趋势
  const skinScoreTrend = checkInRecords
    ?.filter(r => r.completed && r.progress && r.progress > 0)
    .slice(0, 7)
    .reverse()
    .map(r => ({
      day: new Date(r.date).toLocaleDateString('zh-CN', { weekday: 'narrow' }),
      score: r.progress || 0,
    })) || [];
  
  if (!isLoggedIn) return null;
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 顶部欢迎区 */}
      <header className="relative overflow-hidden bg-gradient-to-br from-sky-50 to-cyan-50 px-4 pt-12 pb-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-100/50 blur-3xl" />
        <div className="absolute -left-10 top-20 h-32 w-32 rounded-full bg-cyan-100/50 blur-3xl" />
        
        <div className="relative mx-auto max-w-md">
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-1">早上好，</p>
            <h1 className="text-2xl font-bold text-foreground">你好，{userName}</h1>
            <p className="text-sm text-muted-foreground mt-1">今天也是精致的一天</p>
          </div>
          
          {/* 评分卡片 */}
          {lastScore > 0 ? (
            <div className="flex items-center gap-4 rounded-2xl bg-card/80 p-4 shadow-soft backdrop-blur-sm">
              <ScoreRing score={lastScore} />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">上次检测评分</p>
                <p className="text-lg font-semibold text-foreground">肌肤状态良好</p>
                {daysSinceLastTest !== null && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />{daysSinceLastTest === 0 ? '今天' : `${daysSinceLastTest}天前`}检测
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 rounded-2xl bg-card/80 p-4 shadow-soft backdrop-blur-sm">
              <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center">
                <ScanFace className="w-12 h-12 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-1">欢迎使用 容·易</p>
                <p className="text-lg font-semibold text-foreground">开始您的第一次测肤</p>
                <p className="text-xs text-muted-foreground mt-1">点击AI测肤获取肤质报告</p>
              </div>
            </div>
          )}
        </div>
      </header>
      
      {/* 今日提醒 */}
      {needsRetest && (
        <div className="px-4 -mt-2">
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 p-4">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-amber-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">
                  {daysSinceLastTest === null ? '首次使用' : `已${daysSinceLastTest}天未检测`}
                </p>
                <p className="text-xs text-amber-600">定期测肤，追踪肌肤变化</p>
              </div>
              <Button size="sm" onClick={() => router.navigate({ to: '/skin-test' })}>去测肤</Button>
            </div>
          </Card>
        </div>
      )}
      
      {/* 功能入口区 */}
      <main className="px-4 py-4">
        <div className="mx-auto max-w-md">
          <h2 className="text-lg font-semibold text-foreground mb-4">功能服务</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {FEATURE_CARDS.map((card, index) => (
              <FeatureCard key={card.id} card={card} index={index} onClick={() => handleCardClick(card.path)} />
            ))}
          </div>
        </div>
      </main>

      {/* 今日护肤任务 */}
      <div className="px-4 py-2">
        <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-violet-600" />
              <span className="font-medium text-violet-800">今日护肤任务</span>
            </div>
            <span className="text-xs text-violet-600">{todayTasksData.completed}/{todayTasksData.total} 已完成</span>
          </div>
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-violet-600 mb-1">
              <span>完成进度</span>
              <span>{todayTasksData.progress}%</span>
            </div>
            <div className="h-2 bg-violet-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-500 rounded-full transition-all duration-500"
                style={{ width: `${todayTasksData.progress}%` }}
              />
            </div>
          </div>
          <Button
            size="sm"
            className="w-full bg-violet-500 hover:bg-violet-600"
            onClick={() => router.navigate({ to: '/check-in' })}
          >
            {todayTasksData.progress === 100 ? '今日打卡完成 ✨' : '开始今日护肤'}
          </Button>
        </Card>
      </div>

      {/* 肌肤状态趋势 */}
      {(lastScore > 0 || skinScoreTrend.length > 0) && (
        <div className="px-4 py-2">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-sky-600" />
                <span className="font-medium">肌肤趋势</span>
              </div>
              <span className="text-xs text-emerald-600 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {skinScoreTrend.length > 1 && skinScoreTrend[skinScoreTrend.length - 1]?.score >= skinScoreTrend[0]?.score ? '+' : ''}
                {skinScoreTrend.length > 1 && skinScoreTrend[0]?.score ? Math.round(((skinScoreTrend[skinScoreTrend.length - 1]?.score - skinScoreTrend[0]?.score) / skinScoreTrend[0]?.score) * 100) : 0}%
              </span>
            </div>
            <div className="flex items-end gap-1 h-16">
              {(skinScoreTrend.length > 0 ? skinScoreTrend : [{day: '一', score: 65}, {day: '二', score: 68}, {day: '三', score: 72}, {day: '四', score: 70}, {day: '五', score: 75}, {day: '六', score: 78}, {day: '日', score: 82}]).map((item, i, arr) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t transition-all duration-500 ${i === arr.length - 1 ? 'bg-sky-500' : 'bg-sky-200'}`}
                    style={{ height: `${item.score}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{item.day}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* 护肤小贴士 */}
      {tips.length > 0 && (
        <div className="px-4 py-2">
          <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-emerald-600 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-emerald-600 font-medium">护肤小贴士</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    {tips[currentTip]?.category === 'general' && '通用'}
                    {tips[currentTip]?.category === 'cleaning' && '清洁'}
                    {tips[currentTip]?.category === 'moisturizing' && '保湿'}
                    {tips[currentTip]?.category === 'sunscreen' && '防晒'}
                    {tips[currentTip]?.category === 'antiaging' && '抗老'}
                  </span>
                </div>
                <p className="text-sm text-emerald-800 transition-all duration-500">{tips[currentTip]?.content}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 每日护肤好文 */}
      <div className="px-4 py-4">
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              每日护肤好文
            </h2>
            <span className="text-[10px] px-2 py-1 rounded-full bg-gradient-to-r from-violet-100 to-purple-100 text-violet-700 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI生成
            </span>
          </div>

          {articleLoading ? (
            <Card className="p-4 border-l-4 border-l-violet-400">
              <div className="flex items-center justify-center py-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-muted-foreground">AI正在生成今日文章...</p>
                </div>
              </div>
            </Card>
          ) : articles.length > 0 ? (
            <Card
              className="p-4 cursor-pointer hover:shadow-soft-lg transition-shadow border-l-4 border-l-violet-400"
              onClick={() => setSelectedArticle(articles[0])}
            >
              <div className="flex gap-3">
                <div className="flex-1">
                  <h3 className="font-medium text-sm line-clamp-2 mb-2">{articles[0].title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">{articles[0].summary}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-muted-foreground">作者：{articles[0].author}</span>
                    <span className="text-[10px] text-muted-foreground">{articles[0].read_count}阅读</span>
                  </div>
                  {articles[0].isFallback && (
                    <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI生成超时，显示默认内容
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      </div>

      {/* 悬浮按钮 */}
      <button onClick={() => router.navigate({ to: '/skin-test' })} 
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 to-cyan-400 text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-50">
        <Plus className="w-6 h-6" />
      </button>

      {/* 文章详情弹窗 */}
      <Sheet open={!!selectedArticle} onOpenChange={() => setSelectedArticle(null)}>
        <SheetContent className="sm:max-w-md">
          {selectedArticle && (
            <>
              <SheetHeader>
                <SheetTitle className="text-left text-base">{selectedArticle.title}</SheetTitle>
              </SheetHeader>
              <ScrollArea className="h-[calc(100vh-100px)] mt-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {selectedArticle.category}
                    </span>
                    <span>作者：{selectedArticle.author}</span>
                    <span>{selectedArticle.read_count}阅读</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{selectedArticle.summary}</p>
                  <div className="mt-6 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-violet-500" />
                      本文内容由 AI 生成，仅供参考，不构成专业医疗建议
                    </p>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* 医疗免责声明 */}
      <div className="px-4 py-4">
        <MedicalDisclaimer />
      </div>
    </div>
  );
}
