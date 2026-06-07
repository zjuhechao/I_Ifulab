import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, CheckCircle2, Info, Stethoscope } from "lucide-react";
import { supabase } from "@/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  category: string;
  categoryIcon: string;
  question: string;
  description: string;
  medicalRef: string;
  min: number;
  max: number;
  step: number;
  labels: { value: number; label: string; severity: string }[];
}

const questions: Question[] = [
  // 过敏史
  {
    id: "allergy_history",
    category: "过敏史",
    categoryIcon: "⚠️",
    question: "您是否有护肤品过敏史？",
    description: "评估皮肤对常见成分的耐受性",
    medicalRef: "过敏史是产品推荐的重要参考",
    min: 0,
    max: 10,
    step: 1,
    labels: [
      { value: 0, label: "无过敏", severity: "正常" },
      { value: 3, label: "轻微", severity: "轻度" },
      { value: 5, label: "有时", severity: "中度" },
      { value: 7, label: "经常", severity: "重度" },
      { value: 10, label: "严重", severity: "极重度" },
    ],
  },
  // 皮肤问题历史
  {
    id: "acne_history",
    category: "皮肤历史",
    categoryIcon: "📋",
    question: "您是否有过痘痘/痤疮史？",
    description: "评估过往皮肤问题对当前状态的影响",
    medicalRef: "痤疮史影响控油和祛痘产品选择",
    min: 0,
    max: 10,
    step: 1,
    labels: [
      { value: 0, label: "从无", severity: "正常" },
      { value: 3, label: "偶尔", severity: "轻度" },
      { value: 5, label: "青春期", severity: "中度" },
      { value: 7, label: "反复", severity: "重度" },
      { value: 10, label: "严重", severity: "极重度" },
    ],
  },
  {
    id: "sensitivity_history",
    category: "皮肤历史",
    categoryIcon: "📋",
    question: "您是否有过敏感肌史？",
    description: "评估皮肤屏障受损历史",
    medicalRef: "敏感史影响修护产品推荐",
    min: 0,
    max: 10,
    step: 1,
    labels: [
      { value: 0, label: "从无", severity: "正常" },
      { value: 3, label: "偶尔", severity: "轻度" },
      { value: 5, label: "换季时", severity: "中度" },
      { value: 7, label: "经常", severity: "重度" },
      { value: 10, label: "长期", severity: "极重度" },
    ],
  },
  // 护肤习惯
  {
    id: "morning_routine",
    category: "护肤习惯",
    categoryIcon: "🌅",
    question: "您的晨间护肤步骤完整度？",
    description: "评估晨间护肤规范性",
    medicalRef: "建议晨间：洁面→精华→防晒",
    min: 0,
    max: 10,
    step: 1,
    labels: [
      { value: 0, label: "完整", severity: "优秀" },
      { value: 3, label: "良好", severity: "良好" },
      { value: 5, label: "一般", severity: "中等" },
      { value: 7, label: "简单", severity: "偏差" },
      { value: 10, label: "无", severity: "很差" },
    ],
  },
  {
    id: "evening_routine",
    category: "护肤习惯",
    categoryIcon: "🌙",
    question: "您的晚间护肤步骤完整度？",
    description: "评估晚间修护规范性",
    medicalRef: "建议晚间：卸妆→洁面→精华→面霜",
    min: 0,
    max: 10,
    step: 1,
    labels: [
      { value: 0, label: "完整", severity: "优秀" },
      { value: 3, label: "良好", severity: "良好" },
      { value: 5, label: "一般", severity: "中等" },
      { value: 7, label: "简单", severity: "偏差" },
      { value: 10, label: "无", severity: "很差" },
    ],
  },
  {
    id: "product_usage",
    category: "护肤习惯",
    categoryIcon: "🧴",
    question: "您使用护肤品的频率？",
    description: "评估护肤坚持度",
    medicalRef: "规律护肤效果更佳",
    min: 0,
    max: 10,
    step: 1,
    labels: [
      { value: 0, label: "每天", severity: "优秀" },
      { value: 3, label: "经常", severity: "良好" },
      { value: 5, label: "有时", severity: "中等" },
      { value: 7, label: "偶尔", severity: "偏差" },
      { value: 10, label: "很少", severity: "很差" },
    ],
  },
  // 皮肤症状评估 (SCORAD/EASI风格)
  {
    id: "dryness",
    category: "皮肤症状",
    categoryIcon: "💧",
    question: "您的皮肤干燥程度如何？",
    description: "评估皮肤水分缺失状况",
    medicalRef: "参考SCORAD量表-干燥程度评分",
    min: 0,
    max: 10,
    step: 1,
    labels: [
      { value: 0, label: "无干燥", severity: "正常" },
      { value: 3, label: "轻微", severity: "轻度" },
      { value: 5, label: "明显", severity: "中度" },
      { value: 7, label: "严重", severity: "重度" },
      { value: 10, label: "极严重", severity: "极重度" },
    ],
  },
  {
    id: "oiliness",
    category: "皮肤症状",
    categoryIcon: "💧",
    question: "您的皮肤出油程度如何？",
    description: "评估皮脂分泌状况",
    medicalRef: "参考Sebumeter测量标准",
    min: 0,
    max: 10,
    step: 1,
    labels: [
      { value: 0, label: "无油光", severity: "正常" },
      { value: 3, label: "轻微", severity: "轻度" },
      { value: 5, label: "明显", severity: "中度" },
      { value: 7, label: "严重", severity: "重度" },
      { value: 10, label: "极严重", severity: "极重度" },
    ],
  },
  {
    id: "sensitivity",
    category: "皮肤症状",
    categoryIcon: "🔴",
    question: "您的皮肤敏感程度如何？",
    description: "评估皮肤对外界刺激的耐受性",
    medicalRef: "参考EASI量表-红斑/敏感评分",
    min: 0,
    max: 10,
    step: 1,
    labels: [
      { value: 0, label: "无敏感", severity: "正常" },
      { value: 3, label: "轻微", severity: "轻度" },
      { value: 5, label: "明显", severity: "中度" },
      { value: 7, label: "严重", severity: "重度" },
      { value: 10, label: "极严重", severity: "极重度" },
    ],
  },
  {
    id: "acne",
    category: "皮肤症状",
    categoryIcon: "🔴",
    question: "您的痘痘/痤疮程度如何？",
    description: "评估痤疮的严重程度",
    medicalRef: "参考IGA评分量表",
    min: 0,
    max: 10,
    step: 1,
    labels: [
      { value: 0, label: "无痘痘", severity: "正常" },
      { value: 3, label: "轻微", severity: "轻度" },
      { value: 5, label: "明显", severity: "中度" },
      { value: 7, label: "严重", severity: "重度" },
      { value: 10, label: "极严重", severity: "极重度" },
    ],
  },
  // 生活方式
  {
    id: "sleep_quality",
    category: "生活方式",
    categoryIcon: "🌙",
    question: "您的睡眠质量如何？",
    description: "评估睡眠对皮肤修复的影响",
    medicalRef: "睡眠评分与皮肤屏障功能相关",
    min: 0,
    max: 10,
    step: 1,
    labels: [
      { value: 0, label: "极佳", severity: "优秀" },
      { value: 3, label: "良好", severity: "良好" },
      { value: 5, label: "一般", severity: "中等" },
      { value: 7, label: "较差", severity: "偏差" },
      { value: 10, label: "极差", severity: "很差" },
    ],
  },
  {
    id: "stress_level",
    category: "生活方式",
    categoryIcon: "😰",
    question: "您的压力水平如何？",
    description: "评估心理压力对皮肤的影响",
    medicalRef: "压力激素与皮肤炎症反应相关",
    min: 0,
    max: 10,
    step: 1,
    labels: [
      { value: 0, label: "无压力", severity: "优秀" },
      { value: 3, label: "轻微", severity: "良好" },
      { value: 5, label: "中等", severity: "中等" },
      { value: 7, label: "较高", severity: "偏差" },
      { value: 10, label: "极高", severity: "很差" },
    ],
  },
  {
    id: "water_intake",
    category: "生活方式",
    categoryIcon: "💧",
    question: "您的日常饮水量如何？",
    description: "评估水分摄入对皮肤水合的影响",
    medicalRef: "建议每日饮水2000-2500ml",
    min: 0,
    max: 10,
    step: 1,
    labels: [
      { value: 0, label: "充足", severity: "优秀" },
      { value: 3, label: "良好", severity: "良好" },
      { value: 5, label: "一般", severity: "中等" },
      { value: 7, label: "不足", severity: "偏差" },
      { value: 10, label: "严重不足", severity: "很差" },
    ],
  },
  // 护肤习惯
  {
    id: "sunscreen_usage",
    category: "护肤习惯",
    categoryIcon: "☀️",
    question: "您的防晒习惯如何？",
    description: "评估紫外线防护意识",
    medicalRef: "SPF30+防晒霜建议每日使用",
    min: 0,
    max: 10,
    step: 1,
    labels: [
      { value: 0, label: "严格防晒", severity: "优秀" },
      { value: 3, label: "经常", severity: "良好" },
      { value: 5, label: "偶尔", severity: "中等" },
      { value: 7, label: "很少", severity: "偏差" },
      { value: 10, label: "从不", severity: "很差" },
    ],
  },
  {
    id: "cleansing_routine",
    category: "护肤习惯",
    categoryIcon: "🧼",
    question: "您的清洁习惯如何？",
    description: "评估面部清洁的规范性",
    medicalRef: "建议每日早晚温和清洁",
    min: 0,
    max: 10,
    step: 1,
    labels: [
      { value: 0, label: "非常规范", severity: "优秀" },
      { value: 3, label: "良好", severity: "良好" },
      { value: 5, label: "一般", severity: "中等" },
      { value: 7, label: "较差", severity: "偏差" },
      { value: 10, label: "很不规范", severity: "很差" },
    ],
  },
  {
    id: "makeup_frequency",
    category: "护肤习惯",
    categoryIcon: "💄",
    question: "您的化妆频率如何？",
    description: "评估化妆品对皮肤的负担",
    medicalRef: "频繁化妆需加强清洁和修护",
    min: 0,
    max: 10,
    step: 1,
    labels: [
      { value: 0, label: "从不", severity: "优秀" },
      { value: 3, label: "偶尔", severity: "良好" },
      { value: 5, label: "有时", severity: "中等" },
      { value: 7, label: "经常", severity: "偏差" },
      { value: 10, label: "每天", severity: "重度" },
    ],
  },
  // 环境因素
  {
    id: "pollution_exposure",
    category: "环境因素",
    categoryIcon: "🏭",
    question: "您所在环境的污染程度？",
    description: "评估环境污染对皮肤的影响",
    medicalRef: "PM2.5与皮肤氧化应激相关",
    min: 0,
    max: 10,
    step: 1,
    labels: [
      { value: 0, label: "无污染", severity: "优秀" },
      { value: 3, label: "轻微", severity: "良好" },
      { value: 5, label: "一般", severity: "中等" },
      { value: 7, label: "较重", severity: "偏差" },
      { value: 10, label: "严重", severity: "很差" },
    ],
  },
  {
    id: "uv_exposure",
    category: "环境因素",
    categoryIcon: "☀️",
    question: "您的紫外线暴露程度？",
    description: "评估日常紫外线接触量",
    medicalRef: "UV指数与光老化密切相关",
    min: 0,
    max: 10,
    step: 1,
    labels: [
      { value: 0, label: "极少", severity: "优秀" },
      { value: 3, label: "较少", severity: "良好" },
      { value: 5, label: "一般", severity: "中等" },
      { value: 7, label: "较多", severity: "偏差" },
      { value: 10, label: "极多", severity: "很差" },
    ],
  },
];

const budgetOptions = [
  { value: "budget", label: "经济型", range: "100-300元", icon: "💰", desc: "基础护肤" },
  { value: "mid", label: "中端", range: "300-800元", icon: "💰💰", desc: "品质护肤" },
  { value: "premium", label: "高端", range: "800-2000元", icon: "💰💰💰", desc: "专业护肤" },
  { value: "luxury", label: "奢华", range: "2000元以上", icon: "💎", desc: "顶级护肤" },
];

interface QuestionnairePageProps {
  onComplete?: (answers: Record<string, number>, budget: string) => void;
  embedded?: boolean;
}

export function QuestionnairePage({ onComplete, embedded = false }: QuestionnairePageProps = {}) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [budget, setBudget] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBudgetStep, setShowBudgetStep] = useState(false);

  const isBudgetStep = showBudgetStep;
  const totalQuestions = questions.length + 1;
  const currentProgress = isBudgetStep ? questions.length + 1 : currentIndex + 1;
  const progress = (currentProgress / totalQuestions) * 100;

  const currentQuestion = questions[currentIndex];

  const getSeverityColor = (value: number) => {
    if (value <= 2) return "text-emerald-500";
    if (value <= 4) return "text-sky-500";
    if (value <= 6) return "text-amber-500";
    if (value <= 8) return "text-orange-500";
    return "text-rose-500";
  };

  const getSeverityBg = (value: number) => {
    if (value <= 2) return "bg-emerald-500";
    if (value <= 4) return "bg-sky-500";
    if (value <= 6) return "bg-amber-500";
    if (value <= 8) return "bg-orange-500";
    return "bg-rose-500";
  };

  const getSeverityLabel = (value: number) => {
    if (value <= 2) return "正常范围";
    if (value <= 4) return "轻度";
    if (value <= 6) return "中度";
    if (value <= 8) return "重度";
    return "极重度";
  };

  const handleAnswer = (value: number[]) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value[0] }));
  };

  const handleNext = () => {
    if (isBudgetStep) {
      handleSubmit();
    } else if (currentIndex < questions.length - 1) {
      // 检查是否已回答当前问题（0也是有效答案）
      if (answers[currentQuestion.id] === undefined) {
        // 如果没有回答，设置默认值0
        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: 0 }));
      }
      setCurrentIndex((prev) => prev + 1);
    } else {
      // 最后一个问题，确保有答案后进入预算步骤
      if (answers[currentQuestion.id] === undefined) {
        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: 0 }));
      }
      setShowBudgetStep(true);
    }
  };

  const handlePrev = () => {
    if (isBudgetStep) {
      setShowBudgetStep(false);
    } else if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!budget) {
      toast.error("请选择预算范围");
      return;
    }
    setIsSubmitting(true);
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const reportId = searchParams.get("report_id");

      if (!reportId) {
        toast.error("缺少报告ID");
        return;
      }

      const { error } = await supabase.from("skin_questionnaires").insert({
        report_id: reportId,
        user_id: "guest",
        ...answers,
        work_environment: budget,
      });

      if (error) throw error;

      toast.success("问卷提交成功！");

      // 检查是否来自测肤流程
      const fromSkinTest = searchParams.get("from_skin_test");
      if (fromSkinTest === "true") {
        // 触发自定义事件，通知测肤页面继续分析
        window.dispatchEvent(new CustomEvent("questionnaire-complete", {
          detail: { answers, budget, reportId }
        }));
        navigate({ to: "/skin-test" });
      } else {
        navigate({ to: "/tracking" });
      }
    } catch (e) {
      toast.error("提交失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentValue = isBudgetStep ? 0 : (answers[currentQuestion?.id] ?? 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* 医疗级头部 */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-semibold text-slate-900">肤质评估问卷</h1>
            <p className="text-xs text-slate-500">医学级专业评估</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-sky-600">{Math.round(progress)}%</span>
          </div>
        </div>
        <Progress value={progress} className="h-1.5 mt-3" />
      </div>

      <div className="p-6 max-w-lg mx-auto">
        {isBudgetStep ? (
          /* 预算选择步骤 */
          <div className="space-y-6">
            <div className="text-center mb-8">
              <Badge variant="outline" className="mb-3 bg-sky-50 text-sky-700 border-sky-200">
                最后一步
              </Badge>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">选择您的护肤预算</h2>
              <p className="text-sm text-slate-500">我们将根据预算推荐合适的产品</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {budgetOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBudget(option.value)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all duration-200",
                    budget === option.value
                      ? "border-sky-500 bg-sky-50 shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <div className="text-2xl mb-2">{option.icon}</div>
                  <div className="font-semibold text-slate-900">{option.label}</div>
                  <div className="text-sm text-sky-600 font-medium">{option.range}</div>
                  <div className="text-xs text-slate-500 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ) : currentQuestion ? (
          /* 问题步骤 */
          <div className="space-y-6">
            {/* 分类标签 */}
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentQuestion.categoryIcon}</span>
              <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                {currentQuestion.category}
              </Badge>
              <span className="text-xs text-slate-400">
                {currentIndex + 1} / {questions.length}
              </span>
            </div>

            {/* 问题标题 */}
            <div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                {currentQuestion.question}
              </h2>
              <p className="text-sm text-slate-500">{currentQuestion.description}</p>
            </div>

            {/* 医学参考 */}
            <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <p className="text-xs text-slate-500">{currentQuestion.medicalRef}</p>
            </div>

            {/* 评分卡片 */}
            <Card className="p-6 border-slate-200 shadow-sm">
              {/* 分数显示 */}
              <div className="text-center mb-6">
                <div className={cn(
                  "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors duration-300",
                  getSeverityBg(currentValue)
                )}>
                  <span className="text-3xl font-bold text-white">{currentValue}</span>
                </div>
                <div className={cn("text-sm font-medium", getSeverityColor(currentValue))}>
                  {getSeverityLabel(currentValue)}
                </div>
              </div>

              {/* 滑块 */}
              <Slider
                value={[currentValue]}
                onValueChange={handleAnswer}
                min={currentQuestion.min}
                max={currentQuestion.max}
                step={currentQuestion.step}
                className="mb-6"
              />

              {/* 标签 */}
              <div className="flex justify-between text-xs">
                {currentQuestion.labels.map((label) => (
                  <div
                    key={label.value}
                    className={cn(
                      "flex flex-col items-center gap-1 transition-all duration-200",
                      currentValue === label.value ? "opacity-100" : "opacity-40"
                    )}
                  >
                    <span className="font-medium text-slate-700">{label.label}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px]",
                      currentValue === label.value ? getSeverityBg(currentValue) + " text-white" : "bg-slate-100 text-slate-500"
                    )}>
                      {label.severity}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* 评分说明 */}
            <div className="grid grid-cols-5 gap-1 text-center">
              {[
                { color: "bg-emerald-500", label: "0-2" },
                { color: "bg-sky-500", label: "3-4" },
                { color: "bg-amber-500", label: "5-6" },
                { color: "bg-orange-500", label: "7-8" },
                { color: "bg-rose-500", label: "9-10" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-1">
                  <div className={cn("w-8 h-2 rounded-full", item.color)} />
                  <span className="text-[10px] text-slate-400">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* 导航按钮 */}
        <div className="flex gap-3 mt-8">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handlePrev}
            disabled={currentIndex === 0 && !isBudgetStep}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            上一题
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600"
            onClick={handleNext}
            disabled={isSubmitting || (!isBudgetStep ? false : !budget)}
          >
            {isSubmitting ? (
              "提交中..."
            ) : isBudgetStep ? (
              <>
                完成 <CheckCircle2 className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                下一题 <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
