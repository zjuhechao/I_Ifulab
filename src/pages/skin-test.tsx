import { useState, useRef, useEffect } from "react";
import { Camera, ChevronRight, Sparkles, Loader2, AlertCircle, RotateCcw, ChevronLeft, CheckCircle2, Info, Stethoscope, Activity, BarChart3, AlertTriangle, Lightbulb, FileText, TrendingUp, Building2, X, Hospital, Sparkle, Settings, User, ImageOff, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAppStore } from "@/store/app-store";
import { useNavigate } from "@tanstack/react-router";
import { analyzeSkin, uploadSkinPhoto, saveSkinReport } from "@/services/skinAnalysis";
import { getTextGenAIConfig } from "@/services/aiConfig";
import { supabase } from "@/supabase/client";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, PieChart, Pie } from "recharts";
import { cn } from "@/lib/utils";
import { MedicalDisclaimer } from "@/components/medical-disclaimer";
import { validateImage, getBoundaryGuidance, type ImageValidationResult } from "@/utils/image-validation";
import type { Gender, AgeGroup, SkinType } from "@/types";

const isMobile = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const ageGroups = [
  { min: 0, max: 3, group: "infant" as AgeGroup, message: "0-3岁仅限使用清洁、保湿、防晒类儿童化妆品" },
  { min: 3, max: 12, group: "child" as AgeGroup, message: "3-12岁可使用标注'儿童化妆品'的产品" },
  { min: 12, max: 18, group: "teen" as AgeGroup, message: "12岁以上可谨慎使用成人化妆品" },
  { min: 18, max: 100, group: "adult" as AgeGroup, message: "18岁以上可根据肤质选择适合的护肤产品" },
];

const skinTypeLabels: Record<SkinType, string> = {
  dry: "干性", oily: "油性", combination: "混合性", sensitive: "敏感性", normal: "中性",
};

const indicatorLabels: Record<string, string> = {
  moisture_level: "水润度", oil_level: "出油度", sensitivity_level: "敏感度",
  acne_level: "痘痘", pigmentation_level: "色斑", wrinkle_level: "皱纹",
  pore_level: "毛孔", dark_circle_level: "黑眼圈", smoothness_level: "光滑度",
};

const questions = [
  { id: "dryness", category: "皮肤症状", icon: "💧", question: "您的皮肤干燥程度如何？", desc: "0=水润不干燥，10=极度干燥脱皮", min: 0, max: 10 },
  { id: "oiliness", category: "皮肤症状", icon: "💧", question: "您的皮肤出油程度如何？", desc: "0=清爽不出油，10=严重油光", min: 0, max: 10 },
  { id: "sensitivity", category: "皮肤症状", icon: "🔴", question: "您的皮肤敏感程度如何？", desc: "0=从不敏感，10=极易过敏泛红", min: 0, max: 10 },
  { id: "acne", category: "皮肤症状", icon: "🔴", question: "您的痘痘/痤疮程度如何？", desc: "0=无痘痘，10=严重痤疮", min: 0, max: 10 },
  { id: "sleep_quality", category: "生活方式", icon: "🌙", question: "您的睡眠质量如何？", desc: "0=睡眠充足质量好，10=长期失眠熬夜", min: 0, max: 10 },
  { id: "stress_level", category: "生活方式", icon: "😰", question: "您的压力水平如何？", desc: "0=无压力轻松，10=压力极大焦虑", min: 0, max: 10 },
  { id: "water_intake", category: "生活方式", icon: "💧", question: "您的日常饮水量如何？", desc: "0=每天8杯以上(2000ml+)，10=几乎不喝水(<500ml)", min: 0, max: 10 },
  { id: "sunscreen_usage", category: "护肤习惯", icon: "☀️", question: "您的防晒习惯如何？", desc: "0=每天严格防晒，10=从不防晒", min: 0, max: 10 },
  { id: "cleansing_routine", category: "护肤习惯", icon: "🧼", question: "您的清洁习惯如何？", desc: "0=早晚科学清洁，10=很少清洁", min: 0, max: 10 },
  { id: "pollution_exposure", category: "环境因素", icon: "🏭", question: "您所在环境的污染程度？", desc: "0=空气清新，10=严重污染", min: 0, max: 10 },
  { id: "uv_exposure", category: "环境因素", icon: "☀️", question: "您的紫外线暴露程度？", desc: "0=极少日晒，10=长期户外暴晒", min: 0, max: 10 },
];

const budgetOptions = [
  { value: "ultra_budget", label: "极简", range: "100元以下", icon: "💰", monthly: "月均不到100元" },
  { value: "budget", label: "经济型", range: "100-300元", icon: "💰", monthly: "月均100-300元" },
  { value: "mid", label: "中端", range: "300-800元", icon: "💰💰", monthly: "月均300-800元" },
  { value: "premium", label: "高端", range: "800-2000元", icon: "💰💰💰", monthly: "月均800-2000元" },
  { value: "luxury", label: "奢华", range: "2000元以上", icon: "💎", monthly: "月均2000元以上" },
];

export function SkinTestPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user, addReport, updateSkinProfile } = useAppStore();
  const [step, setStep] = useState<"guide" | "form" | "upload" | "modeSelect" | "questionnaire" | "analyzing" | "result">("guide");
  const [gender, setGender] = useState<Gender | null>(null);
  const [age, setAge] = useState(25);
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoPath, setPhotoPath] = useState<string>("");
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [budget, setBudget] = useState<string>("");
  const [showBudget, setShowBudget] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 深度护理建议
  const [showDeepCare, setShowDeepCare] = useState(false);
  const [deepCareLoading, setDeepCareLoading] = useState(false);
  const [deepCareAdvice, setDeepCareAdvice] = useState<{
    projects: Array<{
      name: string;
      type: 'beauty' | 'medical';
      description: string;
      frequency: string;
      price: string;
      priority: 'high' | 'medium' | 'low';
    }>;
    summary: string;
  } | null>(null);

  useEffect(() => { if (!isLoggedIn) navigate({ to: "/login" }); }, [isLoggedIn, navigate]);

  const currentAgeGroup = ageGroups.find(g => age >= g.min && age <= g.max);
  const currentQ = questions[qIndex];
  const isBudgetStep = showBudget;
  const qProgress = ((qIndex + (showBudget ? 1 : 0)) / (questions.length + 1)) * 100;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      // 边界场景检测：验证图片
      const validation = await validateImage(file);
      setValidationResult(validation);

      // 如果有错误，显示边界场景提示
      if (!validation.valid || validation.warnings.length > 0 || validation.isMedicalCondition) {
        const guidance = getBoundaryGuidance(validation);
        if (guidance.length > 0) {
          setBoundaryGuidance(guidance);
          setShowBoundaryDialog(true);

          // 如果有错误，阻止上传
          if (!validation.valid) {
            setIsLoading(false);
            return;
          }
        }
      }

      const { publicUrl, storagePath } = await uploadSkinPhoto(file);
      setPhoto(publicUrl);
      setPhotoPath(storagePath);
      setStep("modeSelect");
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 直接生成报告（跳过量表）
  const handleDirectAnalysis = async () => {
    setStep("analyzing");
    await performAnalysis();
  };

  // 进入量表精细化
  const handleDetailedAnalysis = () => {
    setStep("questionnaire");
  };

  // 生成深度护理建议 - 调用AI生成个性化建议
  const generateDeepCareAdvice = async () => {
    if (!analysisResult) return;
    setDeepCareLoading(true);

    try {
      // 获取用户配置的AI
      const userConfig = await getTextGenAIConfig();

      // 调用AI生成个性化深度护理建议
      const { data, error } = await supabase.functions.invoke('ai-personalize', {
        body: {
          type: 'deep_care_advice',
          analysisResult: {
            skin_type: analysisResult.skin_type,
            total_score: analysisResult.total_score,
            user_age: analysisResult.user_age || 25,
            moisture_level: analysisResult.moisture_level,
            oil_level: analysisResult.oil_level,
            acne_level: analysisResult.acne_level,
            pigmentation_level: analysisResult.pigmentation_level,
            wrinkle_level: analysisResult.wrinkle_level,
            pore_level: analysisResult.pore_level,
            sensitivity_level: analysisResult.sensitivity_level,
            dark_circle_level: analysisResult.dark_circle_level,
          },
          userConfig
        }
      });

      if (error) throw error;

      if (data?.projects && data?.summary) {
        setDeepCareAdvice({
          projects: data.projects,
          summary: data.summary
        });
      } else {
        // 降级方案
        setDeepCareAdvice(getFallbackDeepCareAdvice(analysisResult));
      }
    } catch (err) {
      console.error('生成深度护理建议失败:', err);
      // 降级方案
      setDeepCareAdvice(getFallbackDeepCareAdvice(analysisResult));
    } finally {
      setDeepCareLoading(false);
    }
  };

  // 降级方案：基础深度护理建议
  const getFallbackDeepCareAdvice = (result: any) => {
    const problemAreas = [];
    if ((result.moisture_level || 0) < 5) problemAreas.push('干燥缺水');
    if ((result.oil_level || 0) > 6) problemAreas.push('油脂分泌旺盛');
    if ((result.acne_level || 0) > 4) problemAreas.push('痘痘痤疮');
    if ((result.pigmentation_level || 0) > 4) problemAreas.push('色斑暗沉');
    if ((result.wrinkle_level || 0) > 4) problemAreas.push('细纹皱纹');
    if ((result.pore_level || 0) > 5) problemAreas.push('毛孔粗大');
    if ((result.sensitivity_level || 0) > 5) problemAreas.push('敏感泛红');
    if ((result.dark_circle_level || 0) > 5) problemAreas.push('黑眼圈眼袋');

    const projects: Array<{
      name: string;
      type: 'beauty' | 'medical';
      description: string;
      frequency: string;
      price: string;
      priority: 'high' | 'medium' | 'low';
    }> = [];

    // 根据问题推荐基础项目
    if (problemAreas.includes('干燥缺水')) {
      projects.push({
        name: '水光针',
        type: 'medical',
        description: '通过注射透明质酸，深层补水锁水',
        frequency: '建议每月1次',
        price: '800-3000元/次',
        priority: 'high'
      });
    }
    if (problemAreas.includes('痘痘痤疮')) {
      projects.push({
        name: '红蓝光治疗',
        type: 'medical',
        description: '蓝光杀菌消炎，红光修复',
        frequency: '建议每周2-3次',
        price: '100-300元/次',
        priority: 'high'
      });
    }
    if (problemAreas.includes('色斑暗沉')) {
      projects.push({
        name: '光子嫩肤',
        type: 'medical',
        description: '改善色斑、提亮肤色',
        frequency: '建议每月1次',
        price: '800-2500元/次',
        priority: 'medium'
      });
    }
    if (problemAreas.includes('细纹皱纹')) {
      projects.push({
        name: '射频紧肤',
        type: 'beauty',
        description: '温和射频提拉，促进胶原生成',
        frequency: '建议每2周1次',
        price: '300-800元/次',
        priority: 'medium'
      });
    }
    if (problemAreas.includes('敏感泛红')) {
      projects.push({
        name: '屏障修护护理',
        type: 'beauty',
        description: '专业修护敏感肌，重建皮脂膜',
        frequency: '建议每1-2周1次',
        price: '200-500元/次',
        priority: 'high'
      });
    }

    // 基础保养项目
    if (projects.length < 3) {
      projects.push({
        name: '深层清洁补水',
        type: 'beauty',
        description: '深层清洁毛孔，导入精华补水',
        frequency: '建议每2-4周1次',
        price: '150-400元/次',
        priority: 'low'
      });
    }

    const summary = `根据您的肤质分析（${skinTypeLabels[result.skin_type as SkinType] || '未知'}，综合评分${result.total_score}分），` +
      `${problemAreas.length > 0 ? `主要需要改善：${problemAreas.join('、')}。` : '肌肤状态良好，建议以保养为主。'}` +
      `以上项目建议仅供参考，具体方案请咨询专业机构。`;

    return { projects, summary };
  };

  const handleQAnswer = (value: number[]) => setAnswers(p => ({ ...p, [currentQ.id]: value[0] }));

  const handleQNext = () => {
    if (answers[currentQ.id] === undefined) setAnswers(p => ({ ...p, [currentQ.id]: 0 }));
    if (qIndex < questions.length - 1) {
      setQIndex(p => p + 1);
    } else {
      setShowBudget(true);
    }
  };

  const handleQPrev = () => {
    if (showBudget) setShowBudget(false);
    else if (qIndex > 0) setQIndex(p => p - 1);
  };

  const handleSubmit = async () => {
    if (!budget) return;
    setStep("analyzing");
    await performAnalysis();
  };

  // 是否使用官方AI的状态
  const [useOfficialAI, setUseOfficialAI] = useState(false);
  const [showAIConfigDialog, setShowAIConfigDialog] = useState(false);
  const [aiConfigError, setAiConfigError] = useState<{
    message: string;
    provider: string;
    model: string;
  } | null>(null);

  // 边界场景检测状态
  const [validationResult, setValidationResult] = useState<ImageValidationResult | null>(null);
  const [showBoundaryDialog, setShowBoundaryDialog] = useState(false);
  const [boundaryGuidance, setBoundaryGuidance] = useState<{ type: 'error' | 'warning' | 'info'; title: string; message: string; action?: string }[]>([]);

  const performAnalysis = async () => {
    if (!photo) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeSkin(
        photo,
        age,
        gender || "female",
        answers,
        { useOfficialAI, userId: user?.id }
      );
      const adjusted = adjustScore(result, answers);
      const ageGroup = ageGroups.find(g => age >= g.min && age <= g.max)?.group || "adult";
      const saved = await saveSkinReport({
        user_id: user?.id || "guest", photo_url: photo, photo_path: photoPath,
        ...adjusted, user_age: age, user_gender: gender || "female", user_age_group: ageGroup,
      });
      addReport({ id: saved?.id || Date.now().toString(), user_id: user?.id || "guest", photo_url: photo, photo_path: photoPath,
        ...adjusted, ai_analysis: {}, user_age: age, user_gender: gender || "female", user_age_group: ageGroup,
        created_at: new Date().toISOString().split("T")[0],
      });
      updateSkinProfile({ skinType: adjusted.skin_type as SkinType, age, gender: gender || "female" });
      setAnalysisResult(adjusted);
      setStep("result");
      // 重置使用官方AI的状态
      setUseOfficialAI(false);
    } catch (err: any) {
      // 处理自定义AI配置失败的情况
      if (err.code === 'CUSTOM_AI_FAILED' && err.originalError) {
        setAiConfigError({
          message: err.originalError.message || err.message,
          provider: err.originalError.configError?.provider || 'unknown',
          model: err.originalError.configError?.model || 'unknown',
        });
        setShowAIConfigDialog(true);
        setStep("modeSelect"); // 回到模式选择页面，让用户决定是否使用官方AI
      } else {
        setError(err.message || "分析失败");
        setStep("upload");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 使用官方AI继续分析
  const handleUseOfficialAI = () => {
    setShowAIConfigDialog(false);
    setUseOfficialAI(true);
    setStep("analyzing");
    // 延迟执行分析，让状态更新
    setTimeout(() => performAnalysis(), 100);
  };

  // 取消分析，去配置页面
  const handleGoToAIConfig = () => {
    setShowAIConfigDialog(false);
    navigate({ to: "/ai-config" });
  };

  const adjustScore = (result: any, ans: Record<string, number>) => {
    let adj = 0;
    if (ans.dryness > 6) adj -= 2;
    if (ans.oiliness > 6) adj -= 2;
    if (ans.sensitivity > 6) adj -= 3;
    if (ans.acne > 6) adj -= 3;
    if (ans.sleep_quality < 4) adj -= 2;
    if (ans.stress_level > 6) adj -= 2;
    return { ...result, total_score: Math.max(0, Math.min(100, result.total_score + adj)) };
  };

  const getScoreBg = (s: number) => s >= 80 ? "bg-emerald-500" : s >= 60 ? "bg-amber-500" : "bg-rose-500";
  const currentValue = isBudgetStep ? 0 : (answers[currentQ?.id] ?? 0);

  const renderGuide = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-400 flex items-center justify-center mb-6 shadow-lg">
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-2xl font-semibold mb-3">AI智能测肤</h1>
      <p className="text-muted-foreground mb-8">拍照填写问卷，AI结合量表数据生成精准肤质报告</p>
      <Button size="lg" className="w-full max-w-xs rounded-xl" onClick={() => setStep("form")}>开始检测 <ChevronRight className="w-4 h-4 ml-1" /></Button>
    </div>
  );

  const renderForm = () => (
    <div className="px-6 py-8">
      <h2 className="text-xl font-semibold mb-6">基础信息</h2>
      <div className="mb-6">
        <label className="text-sm font-medium mb-3 block">性别</label>
        <div className="grid grid-cols-2 gap-3">
          <Card className={cn("p-4 cursor-pointer text-center", gender === "female" ? "ring-2 ring-primary" : "")} onClick={() => setGender("female")}><span className="text-2xl">♀</span><span className="text-sm font-medium ml-2">女性</span></Card>
          <Card className={cn("p-4 cursor-pointer text-center", gender === "male" ? "ring-2 ring-primary" : "")} onClick={() => setGender("male")}><span className="text-2xl">♂</span><span className="text-sm font-medium ml-2">男性</span></Card>
        </div>
      </div>
      <div className="mb-6">
        <label className="text-sm font-medium mb-3 block">年龄</label>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4"><span className="text-3xl font-semibold text-primary">{age}</span><span className="text-sm text-muted-foreground">岁</span></div>
          <Slider value={[age]} onValueChange={([v]) => setAge(v)} min={1} max={100} step={1} />
        </Card>
      </div>
      <Button size="lg" className="w-full" disabled={!gender} onClick={() => setStep("upload")}>下一步 <ChevronRight className="w-4 h-4 ml-1" /></Button>
    </div>
  );

  const renderUpload = () => (
    <div className="px-6 py-8">
      <h2 className="text-xl font-semibold mb-4">上传照片</h2>
      <Card className="p-4 mb-4 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <h3 className="text-sm font-medium text-amber-800 mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4" />拍照小贴士</h3>
        <ul className="space-y-2 text-xs text-amber-700">
          {["光线充足，避免逆光", "面部无遮挡", "保持面部清洁", "素颜或淡妆", "距离20-30cm", "正面平视"].map((t, i) => (
            <li key={i} className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-amber-200 flex items-center justify-center text-[10px]">{i+1}</span>{t}</li>
          ))}
        </ul>
      </Card>
      {error && <Alert className="mb-4 bg-rose-50"><AlertDescription className="text-rose-700">{error}</AlertDescription></Alert>}

      {/* 拍照按钮 */}
      <div className="space-y-3">
        {isMobile() && (
          <>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <Card
              className="p-6 cursor-pointer border-2 border-dashed border-primary/30 text-center hover:bg-primary/5 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-8 h-8 text-primary mx-auto mb-2" />
              <span className="text-sm font-medium">拍照</span>
              <p className="text-xs text-muted-foreground mt-1">调用相机拍摄</p>
            </Card>
          </>
        )}

        {/* 相册选择按钮 */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          id="album-input"
        />
        <Card
          className="p-6 cursor-pointer border-2 border-dashed border-primary/30 text-center hover:bg-primary/5 transition-colors"
          onClick={() => document.getElementById('album-input')?.click()}
        >
          <svg className="w-8 h-8 text-primary mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm font-medium">从相册选择</span>
          <p className="text-xs text-muted-foreground mt-1">选择已有照片</p>
        </Card>
      </div>
    </div>
  );

  // 模式选择界面
  const renderModeSelect = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-400 to-cyan-400 flex items-center justify-center mb-6 shadow-lg">
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-2xl font-semibold mb-2">选择测肤模式</h1>
      <p className="text-muted-foreground mb-8 text-center">照片已上传，请选择您想要的测肤方式</p>

      <div className="w-full max-w-sm space-y-4">
        {/* 直接生成 */}
        <Card
          className="p-6 cursor-pointer border-2 border-primary/20 hover:border-primary hover:shadow-lg transition-all"
          onClick={handleDirectAnalysis}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">快速测肤</h3>
              <p className="text-sm text-muted-foreground">AI直接分析照片，30秒生成报告</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </Card>

        {/* 量表精细化 */}
        <Card
          className="p-6 cursor-pointer border-2 border-primary/20 hover:border-primary hover:shadow-lg transition-all"
          onClick={handleDetailedAnalysis}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-400 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">精准测肤</h3>
              <p className="text-sm text-muted-foreground">填写量表+照片分析，生成更精准报告</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
        </Card>
      </div>

      <Button variant="ghost" className="mt-6" onClick={() => setStep("upload")}>
        <ChevronLeft className="w-4 h-4 mr-1" />重新上传照片
      </Button>
    </div>
  );

  const renderQuestionnaire = () => (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center"><Stethoscope className="w-5 h-5 text-white" /></div>
          <div className="flex-1"><h1 className="font-semibold text-slate-900">肤质评估问卷</h1><p className="text-xs text-slate-500">医学级专业评估</p></div>
          <span className="text-sm font-medium text-sky-600">{Math.round(qProgress)}%</span>
        </div>
        <Progress value={qProgress} className="h-1.5 mt-3" />
      </div>
      <div className="p-6 max-w-lg mx-auto">
        {isBudgetStep ? (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Badge variant="outline" className="mb-3 bg-sky-50 text-sky-700">最后一步</Badge>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">选择您的护肤预算</h2>
            </div>
            <div className="text-center mb-4">
              <p className="text-sm text-slate-500">请选择您每月愿意投入的护肤预算</p>
            </div>
            {/* 第一行：极简（单独占满整行） */}
            <div className="mb-3">
              {budgetOptions.filter(o => o.value === 'ultra_budget').map(o => (
                <button key={o.value} onClick={() => setBudget(o.value)} className={cn("w-full p-4 rounded-xl border-2 text-left", budget === o.value ? "border-sky-500 bg-sky-50" : "border-slate-200")}>
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{o.icon}</div>
                    <div>
                      <div className="font-semibold">{o.label}</div>
                      <div className="text-sm text-sky-600">{o.monthly}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {/* 第二行：经济型和中端 */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {budgetOptions.filter(o => o.value === 'budget' || o.value === 'mid').map(o => (
                <button key={o.value} onClick={() => setBudget(o.value)} className={cn("p-4 rounded-xl border-2 text-left", budget === o.value ? "border-sky-500 bg-sky-50" : "border-slate-200")}>
                  <div className="text-2xl mb-2">{o.icon}</div>
                  <div className="font-semibold">{o.label}</div>
                  <div className="text-sm text-sky-600">{o.monthly}</div>
                </button>
              ))}
            </div>
            {/* 第三行：高端和奢华 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {budgetOptions.filter(o => o.value === 'premium' || o.value === 'luxury').map(o => (
                <button key={o.value} onClick={() => setBudget(o.value)} className={cn("p-4 rounded-xl border-2 text-left", budget === o.value ? "border-sky-500 bg-sky-50" : "border-slate-200")}>
                  <div className="text-2xl mb-2">{o.icon}</div>
                  <div className="font-semibold">{o.label}</div>
                  <div className="text-sm text-sky-600">{o.monthly}</div>
                </button>
              ))}
            </div>
            {/* 确认按钮 */}
            <Button
              className="w-full bg-gradient-to-r from-sky-500 to-cyan-500"
              onClick={handleSubmit}
              disabled={!budget}
            >
              确认选择 <CheckCircle2 className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentQ.icon}</span>
              <Badge variant="secondary">{currentQ.category}</Badge>
              <span className="text-xs text-slate-400">{qIndex + 1}/{questions.length}</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">{currentQ.question}</h2>
              <p className="text-sm text-slate-500">{currentQ.desc}</p>
            </div>
            <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg">
              <Info className="w-4 h-4 text-slate-400 mt-0.5" />
              <p className="text-xs text-slate-500">0=无/最佳，10=极严重/最差</p>
            </div>
            <Card className="p-6">
              <div className="text-center mb-6">
                <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 text-white text-3xl font-bold", getScoreBg(100 - currentValue * 10))}>{currentValue}</div>
              </div>
              <Slider value={[currentValue]} onValueChange={handleQAnswer} min={0} max={10} step={1} className="mb-6" />
              <div className="flex justify-between text-xs text-slate-400">
                <span>0-2 正常</span><span>3-4 轻度</span><span>5-6 中度</span><span>7-8 重度</span><span>9-10 极重</span>
              </div>
            </Card>
          </div>
        )}
        <div className="flex gap-3 mt-8">
          <Button variant="outline" className="flex-1" onClick={handleQPrev} disabled={qIndex === 0 && !isBudgetStep}><ChevronLeft className="w-4 h-4 mr-1" />上一题</Button>
          <Button className="flex-1 bg-gradient-to-r from-sky-500 to-cyan-500" onClick={isBudgetStep ? handleSubmit : handleQNext} disabled={isBudgetStep && !budget}>
            {isBudgetStep ? <>完成<CheckCircle2 className="w-4 h-4 ml-1" /></> : <>下一题<ChevronRight className="w-4 h-4 ml-1" /></>}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAnalyzing = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-sky-400 to-cyan-400 animate-pulse" />
        <Loader2 className="w-10 h-10 text-white absolute inset-0 m-auto animate-spin" />
      </div>
      <h2 className="text-xl font-semibold mb-2">AI分析中</h2>
      <p className="text-sm text-muted-foreground">结合量表数据生成精准报告...</p>
    </div>
  );

  const renderResult = () => {
    if (!analysisResult) return null;
    const radarData = Object.entries(indicatorLabels).map(([k, l]) => ({ subject: l, A: analysisResult[k] || 0 }));
    const ageData = [{ name: "实际年龄", value: age, color: "#3b82f6" }, { name: "肌肤年龄", value: analysisResult.skin_age, color: analysisResult.skin_age_delta <= 0 ? "#10b981" : "#f59e0b" }];

    // 获取问题指标（分数低于6的）
    const problemAreas = Object.entries(indicatorLabels)
      .filter(([key]) => (analysisResult[key] || 0) < 6)
      .map(([key, label]) => ({ key, label, value: analysisResult[key] || 0 }));

    // 获取优势指标（分数高于7的）
    const strengthAreas = Object.entries(indicatorLabels)
      .filter(([key]) => (analysisResult[key] || 0) >= 7)
      .map(([key, label]) => ({ key, label, value: analysisResult[key] || 0 }));

    // 同龄对比百分比 - 使用AI返回的数据
    const percentile = analysisResult.peer_percentile || Math.min(99, Math.max(1, analysisResult.total_score - 20));
    const peerComparisonText = analysisResult.peer_comparison_text || `您的肌肤状态优于${percentile}%的同龄人`;

    // 护肤建议 - 优先使用AI返回的个性化建议
    const skinAdvice = analysisResult.skincare_advice && analysisResult.skincare_advice.length > 0
      ? analysisResult.skincare_advice
      : (() => {
          const advice = [];
          if ((analysisResult.moisture_level || 0) < 5) {
            advice.push({ type: "warning", title: "补水保湿", content: "肌肤水分不足，建议早晚使用保湿精华，每周敷2-3次补水面膜" });
          }
          if ((analysisResult.oil_level || 0) > 6) {
            advice.push({ type: "warning", title: "控油清洁", content: "T区出油较多，建议使用控油洁面，避免过度清洁导致水油失衡" });
          }
          if ((analysisResult.sensitivity_level || 0) > 5) {
            advice.push({ type: "danger", title: "舒缓修护", content: "肌肤较为敏感，建议使用温和无刺激产品，避免含酒精、香精成分" });
          }
          if ((analysisResult.acne_level || 0) > 4) {
            advice.push({ type: "warning", title: "痘痘护理", content: "有痘痘困扰，建议局部使用祛痘产品，保持面部清洁，避免挤压" });
          }
          if ((analysisResult.pigmentation_level || 0) > 4) {
            advice.push({ type: "info", title: "美白淡斑", content: "有色斑问题，建议做好防晒，使用含烟酰胺、维C等美白成分产品" });
          }
          if ((analysisResult.wrinkle_level || 0) > 4) {
            advice.push({ type: "info", title: "抗老紧致", content: "有细纹出现，建议使用抗老精华，补充胶原蛋白，注意防晒" });
          }
          if (advice.length === 0) {
            advice.push({ type: "success", title: "保持现状", content: "您的肌肤状态良好，继续保持当前的护肤习惯即可" });
          }
          return advice;
        })();

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
        {/* 顶部评分卡片 */}
        <div className="bg-gradient-to-br from-sky-500 to-cyan-500 text-white px-6 pt-12 pb-8">
          <div className="text-center">
            <p className="text-sky-100 text-sm mb-2">综合评分</p>
            <div className="text-6xl font-bold mb-2">{analysisResult.total_score}</div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge className="bg-white/20 text-white border-0">{skinTypeLabels[analysisResult.skin_type as SkinType]}</Badge>
              <Badge className="bg-white/20 text-white border-0">肌龄 {analysisResult.skin_age}岁</Badge>
            </div>
            <p className="text-sky-100 text-sm">
              {analysisResult.skin_age_delta <= 0
                ? `比实际年龄年轻 ${Math.abs(analysisResult.skin_age_delta)} 岁 ✨`
                : `比实际年龄大 ${analysisResult.skin_age_delta} 岁`}
            </p>
          </div>
        </div>

        <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
          {/* 同龄对比 */}
          <Card className="shadow-soft border-0 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">同龄对比</p>
                  <p className="text-2xl font-bold text-primary">击败 {percentile}%</p>
                  <p className="text-xs text-muted-foreground">的同龄人</p>
                {peerComparisonText && (
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{peerComparisonText}</p>
                )}
                </div>
                <div className="w-20 h-20">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[{ name: "击败", value: percentile }, { name: "其他", value: 100 - percentile }]}
                           cx="50%" cy="50%" innerRadius={25} outerRadius={35} dataKey="value" startAngle={90} endAngle={-270}>
                        <Cell fill="hsl(var(--primary))" />
                        <Cell fill="#e2e8f0" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 肤质雷达图 */}
          <Card className="shadow-soft border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                9项肤质指标分析
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} />
                    <Radar dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              {/* 指标详情 */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                {Object.entries(indicatorLabels).map(([key, label]) => {
                  const value = analysisResult[key] || 0;
                  const color = value >= 7 ? "text-emerald-500" : value >= 5 ? "text-amber-500" : "text-rose-500";
                  return (
                    <div key={key} className="text-center p-2 bg-secondary/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className={`text-lg font-bold ${color}`}>{value}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 肌龄对比 */}
          <Card className="shadow-soft border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                肌龄对比分析
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, Math.max(age, analysisResult.skin_age) + 10]} hide />
                    <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {ageData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-700">
                  <span className="font-medium">分析：</span>
                  您的肌肤年龄为 {analysisResult.skin_age} 岁，
                  {analysisResult.skin_age_delta <= 0
                    ? `比实际年龄年轻 ${Math.abs(analysisResult.skin_age_delta)} 岁，肌肤状态良好！`
                    : `比实际年龄大 ${analysisResult.skin_age_delta} 岁，建议加强护肤。`}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 问题区域 */}
          {problemAreas.length > 0 && (
            <Card className="shadow-soft border-0 border-l-4 border-l-rose-400">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                  需要关注的问题
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {problemAreas.map((area) => (
                    <div key={area.key} className="flex items-center justify-between p-2 bg-rose-50 rounded-lg">
                      <span className="text-sm">{area.label}</span>
                      <Badge variant="destructive" className="text-xs">{area.value}/10</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 优势区域 */}
          {strengthAreas.length > 0 && (
            <Card className="shadow-soft border-0 border-l-4 border-l-emerald-400">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  肌肤优势
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {strengthAreas.map((area) => (
                    <div key={area.key} className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
                      <span className="text-sm">{area.label}</span>
                      <Badge className="bg-emerald-500 text-xs">{area.value}/10</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI分析总结 */}
          <Card className="shadow-soft border-0 bg-gradient-to-br from-sky-50 to-cyan-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600" />
                AI分析总结
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-slate-700 leading-relaxed">
                {analysisResult.analysis_summary || `您的肌肤属于${skinTypeLabels[analysisResult.skin_type as SkinType]}，综合评分${analysisResult.total_score}分。`}
                {problemAreas.length > 0 && `主要需要关注${problemAreas.slice(0, 2).map(a => a.label).join('、')}等问题。`}
                {strengthAreas.length > 0 && `您的${strengthAreas.slice(0, 2).map(a => a.label).join('、')}表现良好。`}
              </p>
            </CardContent>
          </Card>

          {/* 边界场景提示 */}
          {validationResult && (
            <Card className="shadow-soft border-0 border-l-4 border-l-amber-400">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-amber-700">
                  <Info className="w-4 h-4" />
                  检测质量报告
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">图片清晰度</span>
                  <Badge variant={validationResult.blurScore >= 50 ? "default" : "secondary"}>
                    {validationResult.blurScore >= 70 ? "优秀" : validationResult.blurScore >= 50 ? "良好" : "一般"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-600">光线条件</span>
                  <Badge variant={validationResult.lightingScore >= 50 ? "default" : "secondary"}>
                    {validationResult.lightingScore >= 70 ? "优秀" : validationResult.lightingScore >= 50 ? "良好" : "一般"}
                  </Badge>
                </div>
                {validationResult.hasMultipleFaces && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700 text-sm">
                      检测到多个人脸，分析结果可能不够精准
                    </AlertDescription>
                  </Alert>
                )}
                {validationResult.isMedicalCondition && (
                  <Alert className="bg-rose-50 border-rose-200">
                    <Stethoscope className="h-4 w-4 text-rose-600" />
                    <AlertDescription className="text-rose-700 text-sm">
                      {validationResult.medicalWarning}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* 医疗免责声明 */}
          <MedicalDisclaimer />

          {/* 护肤建议 */}
          <Card className="shadow-soft border-0">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                个性化护肤建议
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {skinAdvice.map((item: {type: string; title: string; content: string}, index: number) => (
                  <div key={index} className={cn(
                    "p-3 rounded-lg border-l-4",
                    item.type === "warning" && "bg-amber-50 border-l-amber-400",
                    item.type === "danger" && "bg-rose-50 border-l-rose-400",
                    item.type === "info" && "bg-sky-50 border-l-sky-400",
                    item.type === "success" && "bg-emerald-50 border-l-emerald-400"
                  )}>
                    <p className="font-medium text-sm mb-1">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.content}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 问卷数据回顾 */}
          {Object.keys(answers).length > 0 && (
            <Card className="shadow-soft border-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  问卷数据参考
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {questions.filter(q => answers[q.id] !== undefined).slice(0, 4).map((q) => (
                    <div key={q.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg">
                      <span className="text-xs text-muted-foreground">{q.question.replace(/您的|如何.*\?/g, '')}</span>
                      <span className="text-sm font-medium">{answers[q.id]}/10</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">* 以上问卷数据已参与AI分析评分</p>
              </CardContent>
            </Card>
          )}

          {/* 深度护理建议 */}
          <Card className="shadow-soft border-0 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-violet-700">
                <Building2 className="w-4 h-4" />
                专业美容护理建议
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-slate-600 mb-4">
                根据您的肤质分析结果，AI为您推荐适合的专业美容/医美项目，帮助您更精准地改善肌肤问题。
              </p>
              <Button
                className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                onClick={() => {
                  generateDeepCareAdvice();
                  setShowDeepCare(true);
                }}
                disabled={deepCareLoading}
              >
                {deepCareLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />生成中...</>
                ) : (
                  <><Hospital className="w-4 h-4 mr-2" />获取深度护理建议</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 操作按钮 */}
          <div className="flex gap-3 pt-4">
            <Button size="lg" className="flex-1 rounded-xl" onClick={() => navigate({ to: "/recommend" })}>
              <Sparkles className="w-4 h-4 mr-2" />
              获取产品推荐
            </Button>
            <Button size="lg" variant="outline" className="flex-1 rounded-xl" onClick={() => navigate({ to: "/tracking" })}>
              <TrendingUp className="w-4 h-4 mr-2" />
              查看追踪
            </Button>
          </div>
          <Button size="lg" variant="ghost" className="w-full" onClick={() => { setPhoto(null); setAnalysisResult(null); setStep("upload"); }}>
            <RotateCcw className="w-4 h-4 mr-2" />
            重新测试
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {step !== "questionnaire" && (
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 py-3 flex items-center">
          <Button variant="ghost" size="sm" onClick={() => step === "guide" ? navigate({ to: "/" }) : setStep("guide")}>返回</Button>
          <span className="flex-1 text-center font-medium">AI测肤</span>
          <div className="w-10" />
        </div>
      )}
      {step === "guide" && renderGuide()}
      {step === "form" && renderForm()}
      {step === "upload" && renderUpload()}
      {step === "modeSelect" && renderModeSelect()}
      {step === "questionnaire" && renderQuestionnaire()}
      {step === "analyzing" && renderAnalyzing()}
      {step === "result" && renderResult()}

      {/* 深度护理建议弹窗 */}
      <Sheet open={showDeepCare} onOpenChange={setShowDeepCare}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Hospital className="w-5 h-5 text-violet-500" />
              专业护理项目建议
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(85vh-80px)] px-4 py-4">
            {deepCareAdvice ? (
              <div className="space-y-4">
                {/* AI生成提示 */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <Sparkle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    以下内容由AI根据您的肤质分析结果生成，仅供参考。具体治疗方案请前往正规医院皮肤科或专业医美机构咨询。
                  </p>
                </div>

                {/* 总结 */}
                <div className="p-4 bg-violet-50 rounded-xl">
                  <p className="text-sm text-slate-700 leading-relaxed">{deepCareAdvice.summary}</p>
                </div>

                {/* 推荐项目 */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-violet-500" />
                    推荐项目
                  </h3>
                  {deepCareAdvice.projects.map((project, index) => (
                    <Card key={index} className={cn(
                      "border-l-4",
                      project.priority === 'high' ? "border-l-rose-400" :
                      project.priority === 'medium' ? "border-l-amber-400" : "border-l-emerald-400"
                    )}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            {project.name}
                            <Badge variant={project.type === 'medical' ? 'destructive' : 'secondary'} className="text-xs">
                              {project.type === 'medical' ? '医美' : '美容'}
                            </Badge>
                          </CardTitle>
                          <Badge variant="outline" className={cn(
                            "text-xs",
                            project.priority === 'high' ? "bg-rose-50 text-rose-700 border-rose-200" :
                            project.priority === 'medium' ? "bg-amber-50 text-amber-700 border-amber-200" :
                            "bg-emerald-50 text-emerald-700 border-emerald-200"
                          )}>
                            {project.priority === 'high' ? '优先推荐' : project.priority === 'medium' ? '建议尝试' : '可选保养'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <p className="text-sm text-slate-600">{project.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="p-2 bg-slate-50 rounded-lg">
                            <span className="text-slate-400">参考价格</span>
                            <p className="font-medium text-slate-700">{project.price}</p>
                          </div>
                          <div className="p-2 bg-slate-50 rounded-lg">
                            <span className="text-slate-400">建议频次</span>
                            <p className="font-medium text-slate-700">{project.frequency}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* 重要提示 */}
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
                  <h4 className="font-semibold text-rose-700 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" />
                    重要提示
                  </h4>
                  <ul className="text-xs text-rose-600 space-y-1 list-disc list-inside">
                    <li>以上项目建议仅供参考，不构成医疗建议</li>
                    <li>具体治疗方案请前往正规医院皮肤科或专业医美机构咨询</li>
                    <li>进行任何医美项目前，请务必咨询专业医生</li>
                    <li>选择正规机构，注意查看资质和医生执业证书</li>
                  </ul>
                </div>

                {/* 关闭按钮 */}
                <Button className="w-full" variant="outline" onClick={() => setShowDeepCare(false)}>
                  <X className="w-4 h-4 mr-2" />
                  关闭
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500 mb-4" />
                <p className="text-base font-medium text-violet-600 mb-2">咨询中，请稍后~</p>
                <p className="text-sm text-slate-500">AI正在为您生成个性化专业护理建议</p>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* 边界场景提示对话框 */}
      <Dialog open={showBoundaryDialog} onOpenChange={setShowBoundaryDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              图片检测提示
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 pt-2">
              我们在您的照片中检测到以下情况：
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {boundaryGuidance.map((guidance, index) => (
              <div
                key={index}
                className={cn(
                  "p-3 rounded-lg border",
                  guidance.type === 'error' && "bg-rose-50 border-rose-200",
                  guidance.type === 'warning' && "bg-amber-50 border-amber-200",
                  guidance.type === 'info' && "bg-sky-50 border-sky-200"
                )}
              >
                <div className="flex items-start gap-2">
                  {guidance.title.includes('面部') && <Camera className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />}
                  {guidance.title.includes('光线') && <Sun className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />}
                  {guidance.title.includes('医疗') && <Stethoscope className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />}
                  <div className="flex-1">
                    <p className={cn(
                      "font-medium text-sm",
                      guidance.type === 'error' && "text-rose-700",
                      guidance.type === 'warning' && "text-amber-700",
                      guidance.type === 'info' && "text-sky-700"
                    )}>
                      {guidance.title}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">{guidance.message}</p>
                  </div>
                </div>
              </div>
            ))}
            {/* 医疗免责声明 */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-500">
                <span className="font-medium">免责声明：</span>
                本工具仅供参考，不构成医疗建议。如有严重皮肤问题，请咨询专业皮肤科医生。
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowBoundaryDialog(false);
                setPhoto(null);
                setStep("upload");
              }}
            >
              重新上传
            </Button>
            {validationResult?.valid && (
              <Button
                className="flex-1"
                onClick={() => setShowBoundaryDialog(false)}
              >
                继续分析
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI配置错误对话框 */}
      <Dialog open={showAIConfigDialog} onOpenChange={setShowAIConfigDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              AI配置异常
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-600 pt-2">
              {aiConfigError?.message || '您配置的AI服务存在问题'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {aiConfigError && (
              <div className="p-3 bg-slate-50 rounded-lg text-xs">
                <p className="text-slate-500">配置提供商: <span className="font-medium text-slate-700">{aiConfigError.provider}</span></p>
                <p className="text-slate-500">模型: <span className="font-medium text-slate-700">{aiConfigError.model}</span></p>
              </div>
            )}
            <p className="text-sm text-slate-600">
              是否使用官方AI服务继续分析？官方AI服务由平台提供，无需额外配置。
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleGoToAIConfig}>
              <Settings className="w-4 h-4 mr-1" />
              去配置
            </Button>
            <Button className="flex-1" onClick={handleUseOfficialAI}>
              <Sparkles className="w-4 h-4 mr-1" />
              使用官方AI
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
