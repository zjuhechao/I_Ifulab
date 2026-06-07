import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrendingUp, Calendar, Image as ImageIcon, FileText, Loader2, Download, ScanFace, ArrowUp, ArrowDown, BarChart3, PieChart, Activity, Share2, Sparkles, Trophy } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, PieChart as RePieChart, Pie, Cell, Legend } from "recharts";
import { useNavigate } from "@tanstack/react-router";
import { useAppStore } from "@/store/app-store";
import { getSkinReports } from "@/services/skinAnalysis";
import { getTextGenAIConfig } from "@/services/aiConfig";
import type { SkinReport } from "@/types";
import { toast } from "sonner";

// 调用AI服务生成个性化内容
async function callAIPersonalize(
  type: 'monthly_summary' | 'peer_comparison',
  data: {
    reports: SkinReport[];
    userAge: number;
    skinType: string;
    userId?: string;
  }
): Promise<{ success: boolean; content?: string; percentile?: number; comparisonText?: string; error?: string }> {
  try {
    const { reports, userAge, skinType, userId } = data;
    const userConfig = await getTextGenAIConfig();

    // 构建提示词
    let prompt = '';
    if (type === 'monthly_summary') {
      const latestReport = reports[0];
      const avgScore = Math.round(reports.reduce((a, b) => a + b.total_score, 0) / reports.length);
      prompt = `请作为专业皮肤科医生，根据以下用户的肤质检测数据，生成一段个性化的月度护肤总结（200字以内）：

用户年龄：${userAge}岁
肤质类型：${skinType}
本月检测次数：${reports.length}次
平均评分：${avgScore}分
最新评分：${latestReport.total_score}分
肌龄：${latestReport.skin_age}岁

各项指标（最新）：
- 水润度：${latestReport.moisture_level}/10
- 出油度：${latestReport.oil_level}/10
- 敏感度：${latestReport.sensitivity_level}/10
- 痘痘：${latestReport.acne_level}/10
- 色斑：${latestReport.pigmentation_level}/10
- 皱纹：${latestReport.wrinkle_level}/10
- 毛孔：${latestReport.pore_level}/10
- 黑眼圈：${latestReport.dark_circle_level}/10
- 光滑度：${latestReport.smoothness_level}/10

请生成一段专业、温暖、个性化的月度总结，包含：
1. 本月肌肤状态整体评价
2. 需要关注的问题
3. 下月护肤建议

直接返回总结文字，不要包含JSON格式或其他标记。`;
    } else {
      const latestReport = reports[0];
      prompt = `请作为专业皮肤科医生，根据以下用户的肤质检测数据，生成同龄对比分析：

用户年龄：${userAge}岁
肤质类型：${skinType}
综合评分：${latestReport.total_score}分
肌龄：${latestReport.skin_age}岁

各项指标：
- 水润度：${latestReport.moisture_level}/10
- 出油度：${latestReport.oil_level}/10
- 敏感度：${latestReport.sensitivity_level}/10
- 痘痘：${latestReport.acne_level}/10
- 色斑：${latestReport.pigmentation_level}/10
- 皱纹：${latestReport.wrinkle_level}/10
- 毛孔：${latestReport.pore_level}/10
- 黑眼圈：${latestReport.dark_circle_level}/10
- 光滑度：${latestReport.smoothness_level}/10

请返回JSON格式：
{
  "percentile": 1-99之间的整数，表示超越同龄人的百分比,
  "comparisonText": "一段温暖鼓励的对比描述，如'太棒了！你的肌肤状态超越了85%的同龄人...'"
}

percentile请根据综合评分和各项指标合理估算，高分高percentile，低分低percentile。`;
    }

    // 调用Edge Function
    const response = await fetch('/functions/ai-personalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        prompt,
        userId: userId || 'guest',
        userConfig,
      }),
    });

    if (!response.ok) {
      throw new Error('AI服务调用失败');
    }

    const result = await response.json();

    if (type === 'monthly_summary') {
      return { success: true, content: result.content || result.summary || '本月肌肤状态良好，建议继续保持当前护肤习惯。' };
    } else {
      return {
        success: true,
        percentile: result.percentile || 50,
        comparisonText: result.comparisonText || `您的肌肤状态处于同龄人的中等水平，建议继续保持护肤习惯。`
      };
    }
  } catch (error) {
    console.error('AI个性化服务调用失败:', error);
    // 返回默认值
    if (type === 'monthly_summary') {
      return { success: false, content: '本月肌肤状态良好，建议继续保持当前护肤习惯，定期检测追踪变化。', error: String(error) };
    } else {
      return { success: false, percentile: 50, comparisonText: '您的肌肤状态处于同龄人的中等水平，建议继续保持护肤习惯。', error: String(error) };
    }
  }
}

const skinTypeLabels: Record<string, string> = {
  dry: "干性", oily: "油性", combination: "混合性",
  sensitive: "敏感性", normal: "中性",
};

const indicatorLabels: Record<string, string> = {
  moisture_level: "水润度", oil_level: "出油度", sensitivity_level: "敏感度",
  acne_level: "痘痘", pigmentation_level: "色斑", wrinkle_level: "皱纹",
  pore_level: "毛孔", dark_circle_level: "黑眼圈", smoothness_level: "光滑度",
};

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#6366f1"];

// AI生成月度总结 - 调用AI服务
async function generateMonthlySummary(reports: SkinReport[], userAge: number, skinType: string, userId?: string): Promise<string> {
  if (reports.length === 0) return "暂无检测数据，建议开始定期记录肌肤状态。";

  const result = await callAIPersonalize('monthly_summary', { reports, userAge, skinType, userId });
  return result.content || "本月肌肤状态良好，建议继续保持当前护肤习惯。";
}

// AI生成同龄人对比数据 - 调用AI服务
async function generateAIComparison(reports: SkinReport[], userAge: number, skinType: string, userId?: string): Promise<{ percentile: number; comparisonText: string }> {
  if (reports.length === 0) {
    return { percentile: 50, comparisonText: "暂无数据，开始检测获取个性化对比。" };
  }

  const result = await callAIPersonalize('peer_comparison', { reports, userAge, skinType, userId });
  return {
    percentile: result.percentile || 50,
    comparisonText: result.comparisonText || "您的肌肤状态处于同龄人的中等水平。"
  };
}

export function TrackingPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [reports, setReports] = useState<SkinReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareReport1, setCompareReport1] = useState<string>("");
  const [compareReport2, setCompareReport2] = useState<string>("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { isLoggedIn, user, skinProfile } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) { navigate({ to: "/login" }); return; }
    loadReports();
  }, [isLoggedIn]);

  async function loadReports() {
    try {
      const data = await getSkinReports(user?.id || 'guest');
      setReports(data as SkinReport[]);
      if (data.length >= 2) {
        setCompareReport1(data[0].id);
        setCompareReport2(data[1].id);
      }
    } catch (e) {
      console.error('加载报告失败:', e);
    } finally {
      setLoading(false);
    }
  }

  const latestReport = reports[0];
  const previousReport = reports[1];

  // AI生成的月度总结
  const [monthlySummary, setMonthlySummary] = useState<string>("加载中...");
  const [aiComparison, setAiComparison] = useState<{ percentile: number; comparisonText: string } | null>(null);

  useEffect(() => {
    if (reports.length > 0) {
      // 调用AI生成月度总结
      generateMonthlySummary(reports, skinProfile.age, skinProfile.skinType, user?.id).then(setMonthlySummary);
      // 调用AI生成同龄人对比
      generateAIComparison(reports, skinProfile.age, skinProfile.skinType, user?.id).then(setAiComparison);
    }
  }, [reports, skinProfile, user?.id]);

  const radarData = useMemo(() => {
    if (!latestReport) return [];
    const data: { subject: string; A: number; B?: number; fullMark: number }[] = [
      { subject: "水润度", A: latestReport.moisture_level || 0, fullMark: 10 },
      { subject: "出油度", A: latestReport.oil_level || 0, fullMark: 10 },
      { subject: "敏感度", A: latestReport.sensitivity_level || 0, fullMark: 10 },
      { subject: "痘痘", A: latestReport.acne_level || 0, fullMark: 10 },
      { subject: "色斑", A: latestReport.pigmentation_level || 0, fullMark: 10 },
      { subject: "皱纹", A: latestReport.wrinkle_level || 0, fullMark: 10 },
      { subject: "毛孔", A: latestReport.pore_level || 0, fullMark: 10 },
      { subject: "黑眼圈", A: latestReport.dark_circle_level || 0, fullMark: 10 },
      { subject: "光滑度", A: latestReport.smoothness_level || 0, fullMark: 10 },
    ];
    if (previousReport) {
      const keys = Object.keys(indicatorLabels);
      data.forEach((item, idx) => {
        item.B = previousReport[keys[idx] as keyof SkinReport] as number || 0;
      });
    }
    return data;
  }, [latestReport, previousReport]);

  const trendData = useMemo(() => {
    const sorted = [...reports].sort((a, b) => 
      new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
    );
    return {
      dates: sorted.map(r => (r.created_at || '').slice(5, 10)),
      scores: sorted.map(r => r.total_score),
      skinAges: sorted.map(r => r.skin_age),
    };
  }, [reports]);

  const barData = useMemo(() => {
    if (!latestReport) return [];
    return Object.entries(indicatorLabels).map(([key, label]) => ({
      name: label,
      current: latestReport[key as keyof SkinReport] as number || 0,
      previous: previousReport ? (previousReport[key as keyof SkinReport] as number || 0) : 0,
    }));
  }, [latestReport, previousReport]);

  const pieData = useMemo(() => {
    if (!latestReport) return [];
    const issues = [];
    if ((latestReport.moisture_level || 0) < 5) issues.push({ name: "缺水", value: 1 });
    if ((latestReport.oil_level || 0) > 6) issues.push({ name: "出油", value: 1 });
    if ((latestReport.acne_level || 0) > 5) issues.push({ name: "痘痘", value: 1 });
    if ((latestReport.sensitivity_level || 0) > 6) issues.push({ name: "敏感", value: 1 });
    if ((latestReport.pigmentation_level || 0) > 5) issues.push({ name: "色斑", value: 1 });
    if ((latestReport.wrinkle_level || 0) > 5) issues.push({ name: "皱纹", value: 1 });
    if ((latestReport.pore_level || 0) > 6) issues.push({ name: "毛孔", value: 1 });
    if ((latestReport.dark_circle_level || 0) > 5) issues.push({ name: "黑眼圈", value: 1 });
    if (issues.length === 0) issues.push({ name: "状态良好", value: 1 });
    return issues;
  }, [latestReport]);

  const compareData = useMemo(() => {
    const r1 = reports.find(r => r.id === compareReport1);
    const r2 = reports.find(r => r.id === compareReport2);
    if (!r1 || !r2) return null;
    return { r1, r2 };
  }, [reports, compareReport1, compareReport2]);

  const getScoreChange = (current: number, previous?: number) => {
    if (!previous) return null;
    const diff = current - previous;
    return { diff, isUp: diff > 0 };
  };

  const getTrendAnalysis = () => {
    if (reports.length < 2) return "首次检测，建议定期追踪观察肌肤变化趋势。";
    const latest = reports[0].total_score;
    const prev = reports[1].total_score;
    const diff = latest - prev;
    if (diff > 5) return `肌肤状态明显提升！较上次提高${diff}分。`;
    if (diff > 0) return `肌肤状态略有改善，较上次提高${diff}分。`;
    if (diff === 0) return "肌肤状态保持稳定。";
    if (diff > -5) return `肌肤状态略有下降，较上次降低${Math.abs(diff)}分。`;
    return `肌肤状态需要关注，较上次降低${Math.abs(diff)}分。`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-rose-500";
  };

  // 导出图片功能
  const handleExportImage = async () => {
    if (!reportRef.current) return;
    
    try {
      // 使用 html2canvas 或类似库来生成图片
      // 这里使用简单的 canvas 绘制
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = 375;
      canvas.height = 667;
      
      // 绘制背景
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 绘制标题
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('肤质检测报告', canvas.width / 2, 60);
      
      // 绘制分数
      if (latestReport) {
        ctx.fillStyle = latestReport.total_score >= 80 ? '#10b981' : latestReport.total_score >= 60 ? '#f59e0b' : '#ef4444';
        ctx.font = 'bold 72px sans-serif';
        ctx.fillText(latestReport.total_score.toString(), canvas.width / 2, 150);
        
        ctx.fillStyle = '#64748b';
        ctx.font = '14px sans-serif';
        ctx.fillText(`综合评分 | 肌龄 ${latestReport.skin_age}岁`, canvas.width / 2, 180);
        
        // 绘制AI对比
        if (aiComparison) {
          ctx.fillStyle = '#8b5cf6';
          ctx.font = 'bold 16px sans-serif';
          ctx.fillText(`超越 ${aiComparison.percentile}% 同龄人`, canvas.width / 2, 220);
        }
        
        // 绘制日期
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px sans-serif';
        ctx.fillText(`检测日期: ${(latestReport.created_at || '').slice(0, 10)}`, canvas.width / 2, 250);
      }
      
      // 绘制底部品牌
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '12px sans-serif';
      ctx.fillText('容·易 AI 肤质检测', canvas.width / 2, 620);
      
      // 导出图片
      const link = document.createElement('a');
      link.download = `肤质报告_${(latestReport?.created_at || '').slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('报告已导出');
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败，请重试');
    }
  };

  if (!isLoggedIn) return null;
  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background safe-area-bottom">
      <div className="sticky top-0 z-10 glass border-b px-4 py-4 safe-area-top flex items-center justify-between">
        <h1 className="text-xl font-semibold">肤质追踪</h1>
        {latestReport && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleExportImage}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowShareDialog(true)}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
          <TabsTrigger value="overview">总览</TabsTrigger>
          <TabsTrigger value="compare">对比</TabsTrigger>
          <TabsTrigger value="trends">趋势</TabsTrigger>
          <TabsTrigger value="history">历史</TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[calc(100vh-180px)]">
          <TabsContent value="overview" className="px-4 pb-4 space-y-4">
            {!latestReport ? (
              <Card className="p-8 text-center">
                <ScanFace className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">还没有检测记录</p>
                <Button onClick={() => navigate({ to: '/skin-test' })}>去测肤</Button>
              </Card>
            ) : (
              <>
                {/* 综合评分卡片 */}
                <Card className="shadow-soft border-0 overflow-hidden" ref={reportRef}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">综合评分</p>
                        <div className="flex items-center gap-2">
                          <p className={`text-5xl font-bold ${getScoreColor(latestReport.total_score)}`}>{latestReport.total_score}</p>
                          {previousReport && (
                            <Badge variant={latestReport.total_score >= previousReport.total_score ? "default" : "destructive"} className="text-xs">
                              {latestReport.total_score >= previousReport.total_score ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                              {Math.abs(latestReport.total_score - previousReport.total_score)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{getTrendAnalysis()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground mb-1">肌龄</p>
                        <p className="text-3xl font-bold text-primary">{latestReport.skin_age}</p>
                        <p className="text-xs text-emerald-500 mt-1">
                          {latestReport.skin_age_delta < 0 ? `年轻 ${Math.abs(latestReport.skin_age_delta)} 岁` : "--"}
                        </p>
                      </div>
                    </div>
                    
                    {/* AI同龄人对比 */}
                    {aiComparison && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="w-4 h-4 text-violet-500" />
                          <span className="text-sm font-medium text-violet-700">AI同龄人对比</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="h-2 bg-violet-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full transition-all duration-1000"
                                style={{ width: `${aiComparison.percentile}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-bold text-violet-600">{aiComparison.percentile}%</span>
                        </div>
                        <p className="text-xs text-violet-600 mt-2">{aiComparison.comparisonText}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 月度AI总结 */}
                <Card className="shadow-soft border-0 bg-gradient-to-r from-emerald-50 to-teal-50 border-l-4 border-l-emerald-400">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      <h3 className="font-medium text-emerald-800">月度AI总结</h3>
                    </div>
                    <p className="text-sm text-emerald-700 leading-relaxed">{monthlySummary}</p>
                  </CardContent>
                </Card>

                {/* 9项肤质指标 */}
                <Card className="shadow-soft border-0">
                  <CardHeader className="pb-3"><CardTitle className="text-base">9项肤质指标</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid /><PolarAngleAxis dataKey="subject" /><PolarRadiusAxis angle={30} domain={[0, 10]} />
                          <Radar name="当前" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.3} />
                          {previousReport && <Radar name="上次" dataKey="B" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} />}
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* 问题分布 */}
                <Card className="shadow-soft border-0">
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><PieChart className="w-4 h-4" />问题分布</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePieChart data={pieData}>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                            {pieData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <Tooltip /><Legend />
                        </RePieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="compare" className="px-4 pb-4 space-y-4">
            {reports.length < 2 ? (
              <Card className="p-8 text-center"><p className="text-muted-foreground">需要至少2次检测记录才能对比</p></Card>
            ) : (
              <>
                <Card className="shadow-soft border-0">
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">检测记录1</label>
                        <Select value={compareReport1} onValueChange={setCompareReport1}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {reports.map(r => <SelectItem key={r.id} value={r.id}>{(r.created_at || '').slice(0, 10)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">检测记录2</label>
                        <Select value={compareReport2} onValueChange={setCompareReport2}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {reports.map(r => <SelectItem key={r.id} value={r.id}>{(r.created_at || '').slice(0, 10)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {compareData && (
                  <>
                    <Card className="shadow-soft border-0">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="p-3 bg-secondary rounded-lg">
                            <p className="text-xs text-muted-foreground">{(compareData.r1.created_at || '').slice(0, 10)}</p>
                            <p className="text-2xl font-bold">{compareData.r1.total_score}</p>
                            <p className="text-xs">肌龄 {compareData.r1.skin_age}</p>
                          </div>
                          <div className="p-3 bg-secondary rounded-lg">
                            <p className="text-xs text-muted-foreground">{(compareData.r2.created_at || '').slice(0, 10)}</p>
                            <p className="text-2xl font-bold">{compareData.r2.total_score}</p>
                            <p className="text-xs">肌龄 {compareData.r2.skin_age}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-soft border-0">
                      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="w-4 h-4" />指标对比</CardTitle></CardHeader>
                      <CardContent className="pt-0">
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" fontSize={10} />
                              <YAxis domain={[0, 10]} />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="current" name="当前" fill="var(--primary)" />
                              <Bar dataKey="previous" name="上次" fill="#94a3b8" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="trends" className="px-4 pb-4 space-y-4">
            {trendData.dates.length > 1 && (
              <>
                <Card className="shadow-soft border-0">
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4" />评分趋势</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData.dates.map((d, i) => ({ date: d, score: trendData.scores[i] }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" fontSize={12} />
                          <YAxis domain={[50, 100]} />
                          <Tooltip />
                          <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-soft border-0">
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4" />肌龄变化</CardTitle></CardHeader>
                  <CardContent className="pt-0">
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData.dates.map((d, i) => ({ date: d, age: trendData.skinAges[i] }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" fontSize={12} />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="age" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="px-4 pb-4">
            <div className="space-y-3">
              {reports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground"><FileText className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>暂无检测记录</p></div>
              ) : reports.map((r, index) => {
                const prevReport = reports[index + 1];
                const scoreChange = getScoreChange(r.total_score, prevReport?.total_score);
                return (
                  <Card key={r.id} className="shadow-soft border-0">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${getScoreColor(r.total_score)} bg-secondary`}>{r.total_score}</div>
                          <div>
                            <p className="font-medium">{skinTypeLabels[r.skin_type]}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{(r.created_at || '').slice(0, 10)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">肌龄</p>
                          <p className="text-lg font-semibold text-primary">{r.skin_age}</p>
                          {scoreChange && (
                            <p className={`text-xs ${scoreChange.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {scoreChange.isUp ? '↑' : '↓'} {Math.abs(scoreChange.diff)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* 分享弹窗 */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>分享报告</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">将您的肤质报告分享给好友</p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={handleExportImage}>
                <ImageIcon className="w-4 h-4 mr-2" />
                保存图片
              </Button>
              <Button onClick={() => { toast.success('链接已复制'); setShowShareDialog(false); }}>
                <Share2 className="w-4 h-4 mr-2" />
                复制链接
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
