import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ScoreDisplayProps {
  score: number;
  skinAge: number;
  actualAge: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function ScoreDisplay({
  score,
  skinAge,
  actualAge,
  size = "md",
  className,
}: ScoreDisplayProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const sizeConfig = {
    sm: { wrapper: "w-24 h-24", text: "text-2xl", sub: "text-xs" },
    md: { wrapper: "w-32 h-32", text: "text-4xl", sub: "text-sm" },
    lg: { wrapper: "w-40 h-40", text: "text-5xl", sub: "text-base" },
  };

  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;
  const ageDiff = skinAge - actualAge;

  useEffect(() => {
    setIsVisible(true);
    const duration = 1000;
    const steps = 60;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return "stroke-emerald-500";
    if (s >= 60) return "stroke-sky-500";
    if (s >= 40) return "stroke-amber-500";
    return "stroke-rose-500";
  };

  const getScoreLabel = (s: number) => {
    if (s >= 80) return "优秀";
    if (s >= 60) return "良好";
    if (s >= 40) return "一般";
    return "需改善";
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      {/* 环形进度条 */}
      <div
        className={cn(
          config.wrapper,
          "relative rounded-full transition-all duration-500",
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        )}
      >
        {/* 背景圆环 */}
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-muted/30"
          />
          {/* 进度圆环 */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className={cn(
              "transition-all duration-1000 ease-out",
              getScoreColor(animatedScore)
            )}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset: isVisible ? strokeDashoffset : circumference,
            }}
          />
        </svg>

        {/* 中心内容 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(config.text, "font-bold text-foreground")}>
            {animatedScore}
          </span>
          <span className={cn(config.sub, "text-muted-foreground")}>分</span>
        </div>
      </div>

      {/* 评分标签 */}
      <div
        className={cn(
          "px-3 py-1 rounded-full text-sm font-medium transition-all duration-500",
          animatedScore >= 80 && "bg-emerald-100 text-emerald-700",
          animatedScore >= 60 && animatedScore < 80 && "bg-sky-100 text-sky-700",
          animatedScore >= 40 && animatedScore < 60 && "bg-amber-100 text-amber-700",
          animatedScore < 40 && "bg-rose-100 text-rose-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}
        style={{ transitionDelay: "200ms" }}
      >
        {getScoreLabel(animatedScore)}
      </div>

      {/* 肌龄对比 */}
      <div
        className={cn(
          "flex items-center gap-2 text-sm transition-all duration-500",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}
        style={{ transitionDelay: "300ms" }}
      >
        <span className="text-muted-foreground">肌龄</span>
        <span className="font-semibold text-foreground">{skinAge}岁</span>
        {ageDiff !== 0 && (
          <span
            className={cn(
              "text-xs px-1.5 py-0.5 rounded",
              ageDiff < 0
                ? "bg-emerald-100 text-emerald-600"
                : "bg-rose-100 text-rose-600"
            )}
          >
            {ageDiff < 0 ? "年轻" : "偏老"}
            {Math.abs(ageDiff)}岁
          </span>
        )}
      </div>
    </div>
  );
}
