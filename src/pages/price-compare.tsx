import { useState, useEffect } from "react";
import { Search, ExternalLink, ShoppingBag, TrendingDown, Loader2, AlertCircle, Database, Globe, Settings, Info, Sparkles, History, TrendingUp, Award, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getSupabaseUrl } from "@/supabase/client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface PriceItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  platform: "taobao" | "jd" | "tmall" | "database";
  url: string;
  shop: string;
  sales?: string;
  rating?: number;
  tags: string[];
  source: "database" | "external_api";
  lastUpdated: string;
}

interface SearchMeta {
  query: string;
  total: number;
  lowestPrice: number | null;
  highestPrice: number | null;
  dataSources: string[];
  externalAPIEnabled: boolean;
  externalAPIStatus: Array<{
    name: string;
    enabled: boolean;
    configured: boolean;
  }>;
  timestamp: string;
  note?: string;
}

interface AIAnalysis {
  bestPlatform: string;
  bestPrice: number;
  recommendation: string;
  reason: string;
}

const HOT_SEARCHES = ["雅诗兰黛小棕瓶", "兰蔻粉水", "SK-II神仙水", "欧莱雅精华", "资生堂红腰子"];

const MOCK_PRICE_HISTORY = [
  { date: "1月", taobao: 520, jd: 540, tmall: 535 },
  { date: "2月", taobao: 510, jd: 530, tmall: 525 },
  { date: "3月", taobao: 499, jd: 520, tmall: 515 },
  { date: "4月", taobao: 489, jd: 510, tmall: 505 },
  { date: "5月", taobao: 479, jd: 499, tmall: 495 },
  { date: "6月", taobao: 459, jd: 479, tmall: 475 },
];

export function PriceComparePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PriceItem[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState<"price" | "rating">("price");
  const [useExternalAPI, setUseExternalAPI] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PriceItem | null>(null);

  useEffect(() => {
    const history = localStorage.getItem("priceSearchHistory");
    if (history) setSearchHistory(JSON.parse(history));
  }, []);

  const saveSearchHistory = (q: string) => {
    const newHistory = [q, ...searchHistory.filter(h => h !== q)].slice(0, 8);
    setSearchHistory(newHistory);
    localStorage.setItem("priceSearchHistory", JSON.stringify(newHistory));
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    saveSearchHistory(query);
    
    try {
      const response = await fetch(`${getSupabaseUrl()}/functions/v1/price-search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, useExternalAPI }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResults(data.data);
        setMeta(data.meta);
        generateAIAnalysis(data.data);
        toast.success(`找到 ${data.data.length} 个结果`);
      } else {
        toast.error(data.error || "查询失败");
      }
    } catch (error) {
      toast.error("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  const generateAIAnalysis = (items: PriceItem[]) => {
    if (items.length === 0) return;
    const sorted = [...items].sort((a, b) => a.price - b.price);
    const best = sorted[0];
    const platformLabels: Record<string, string> = { taobao: "淘宝", jd: "京东", tmall: "天猫" };
    setAiAnalysis({
      bestPlatform: platformLabels[best.platform] || best.platform,
      bestPrice: best.price,
      recommendation: best.platform === "jd" ? "京东自营品质保障" : best.platform === "taobao" ? "淘宝价格最优" : "天猫旗舰店正品",
      reason: `比最高价省¥${sorted[sorted.length - 1].price - best.price}，${best.rating ? `评分${best.rating}分` : ""}`,
    });
  };

  const getPlatformLabel = (platform: string) => {
    const labels: Record<string, string> = { taobao: "淘宝", jd: "京东", tmall: "天猫", database: "数据库" };
    return labels[platform] || platform;
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'taobao': return 'bg-orange-500 text-white';
      case 'jd': return 'bg-red-500 text-white';
      case 'tmall': return 'bg-red-600 text-white';
      case 'database': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getPlatformLightColor = (platform: string) => {
    switch (platform) {
      case 'taobao': return 'bg-orange-50 text-orange-600 border-orange-200';
      case 'jd': return 'bg-red-50 text-red-600 border-red-200';
      case 'tmall': return 'bg-red-50 text-red-700 border-red-300';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const getSmartTag = (item: PriceItem, allItems: PriceItem[]) => {
    const sorted = [...allItems].sort((a, b) => a.price - b.price);
    if (item.id === sorted[0]?.id) return { label: "性价比之选", color: "bg-emerald-500" };
    if (item.sales?.includes("万")) return { label: "销量冠军", color: "bg-amber-500" };
    if (item.rating && item.rating >= 4.8) return { label: "好评推荐", color: "bg-violet-500" };
    return null;
  };

  const openCompare = (item: PriceItem) => {
    setSelectedProduct(item);
    setShowCompareDialog(true);
  };

  const filteredResults = results.filter(item => {
    if (activeTab === 'all') return true;
    return item.platform === activeTab;
  }).sort((a, b) => sortBy === 'price' ? a.price - b.price : (b.rating || 0) - (a.rating || 0));

  const lowestPrice = meta?.lowestPrice || 0;
  const highestPrice = meta?.highestPrice || 0;
  const priceSavings = highestPrice > lowestPrice ? highestPrice - lowestPrice : 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-gradient-to-r from-amber-400 to-orange-400 border-b px-4 py-4 safe-area-top">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-white">商品比价</h1>
          <button onClick={() => setShowSettings(!showSettings)} className="p-2 rounded-lg hover:bg-white/20">
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-md mx-auto">
        {showSettings && (
          <Card className="bg-amber-50 border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-600" />
                数据源设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">外部API</p>
                  <p className="text-xs text-muted-foreground">淘宝/京东实时价格</p>
                </div>
                <Switch checked={useExternalAPI} onCheckedChange={setUseExternalAPI} />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="搜索品牌或产品..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="rounded-xl"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading} className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>

        {/* 品牌快速筛选 */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">热门品牌:</span>
          {['百雀羚', '珀莱雅', '薇诺娜', 'HBN', '敷尔佳', '润百颜'].map((brand) => (
            <button
              key={brand}
              onClick={() => { setQuery(brand); handleSearch(); }}
              className="text-xs px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100"
            >
              {brand}
            </button>
          ))}
        </div>

        {searchHistory.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            {searchHistory.slice(0, 5).map((h) => (
              <button key={h} onClick={() => { setQuery(h); handleSearch(); }} className="text-xs px-2 py-1 rounded-full bg-secondary hover:bg-secondary/80">
                {h}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">热门搜索:</span>
          {HOT_SEARCHES.map((h) => (
            <button key={h} onClick={() => { setQuery(h); handleSearch(); }} className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100">
              {h}
            </button>
          ))}
        </div>

        {!searched ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-amber-400" />
            <p className="text-sm text-muted-foreground">输入商品名称开始比价</p>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-amber-500" />
            <p className="text-sm text-muted-foreground">AI正在分析价格...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-amber-400" />
            <p className="text-sm text-muted-foreground mb-4">未找到"{query}"相关商品</p>
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-amber-800 mb-3">试试搜索这些热门产品</p>
                <div className="flex flex-wrap gap-2">
                  {['面膜', '精华', '面霜', '洗面奶', '防晒', '眼霜'].map((keyword) => (
                    <button
                      key={keyword}
                      onClick={() => { setQuery(keyword); handleSearch(); }}
                      className="text-xs px-3 py-1.5 rounded-full bg-white text-amber-600 border border-amber-200 hover:bg-amber-100"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-amber-600 mt-3">或点击上方热门品牌快速搜索</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {aiAnalysis && (
              <Card className="bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-violet-600" />
                    <span className="font-semibold text-violet-800">AI比价建议</span>
                  </div>
                  <p className="text-sm text-violet-700">{aiAnalysis.recommendation}，{aiAnalysis.reason}</p>
                  <div className="flex gap-2 mt-3">
                    <Badge className="bg-emerald-500">最低价 ¥{aiAnalysis.bestPrice}</Badge>
                    <Badge className="bg-violet-500">{aiAnalysis.bestPlatform}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-emerald-700">全网最低价</p>
                    <p className="text-2xl font-bold text-emerald-600">¥{lowestPrice}</p>
                    {priceSavings > 0 && <p className="text-xs text-emerald-600">最高可省 ¥{priceSavings}</p>}
                  </div>
                  <TrendingDown className="w-8 h-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">全部</TabsTrigger>
                <TabsTrigger value="taobao" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">淘宝</TabsTrigger>
                <TabsTrigger value="jd" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">京东</TabsTrigger>
                <TabsTrigger value="tmall" className="data-[state=active]:bg-red-600 data-[state=active]:text-white">天猫</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-3">
              {filteredResults.map((item) => {
                const smartTag = getSmartTag(item, results);
                return (
                  <Card key={item.id} className="shadow-soft border-0 overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getPlatformColor(item.platform)}>{getPlatformLabel(item.platform)}</Badge>
                            {smartTag && <Badge className={smartTag.color}>{smartTag.label}</Badge>}
                          </div>
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-xs text-muted-foreground">{item.shop}</p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {item.sales && <span>{item.sales}</span>}
                            {item.rating && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" />{item.rating}</span>}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-emerald-600">¥{item.price}</p>
                          {item.originalPrice && <p className="text-xs text-muted-foreground line-through">¥{item.originalPrice}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => openCompare(item)}>
                          <TrendingUp className="w-3 h-3 mr-1" />同款比价
                        </Button>
                        <Button size="sm" className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500" onClick={() => window.open(item.url, '_blank')}>
                          <ExternalLink className="w-3 h-3 mr-1" />去购买
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      <Dialog open={showCompareDialog} onOpenChange={setShowCompareDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              同款比价 - {selectedProduct?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {["taobao", "jd", "tmall"].map((platform) => {
              const mockPrice = selectedProduct ? selectedProduct.price * (0.9 + Math.random() * 0.2) : 0;
              return (
                <div key={platform} className={`flex items-center justify-between p-3 rounded-xl border ${getPlatformLightColor(platform)}`}>
                  <div className="flex items-center gap-2">
                    <Badge className={getPlatformColor(platform)}>{getPlatformLabel(platform)}</Badge>
                    <span className="text-sm">{platform === selectedProduct?.platform ? "当前" : ""}</span>
                  </div>
                  <span className="font-bold">¥{Math.round(mockPrice)}</span>
                </div>
              );
            })}
            <Card className="bg-sky-50 border-sky-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-sky-600" />
                  价格趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={MOCK_PRICE_HISTORY}>
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                      <YAxis hide />
                      <Tooltip />
                      <Line type="monotone" dataKey="taobao" stroke="#f97316" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="jd" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
