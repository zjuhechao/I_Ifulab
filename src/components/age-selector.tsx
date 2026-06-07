import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { AlertCircle, Info, CheckCircle2 } from "lucide-react";

interface AgeSelectorProps {
  value: number;
  onChange: (age: number) => void;
  className?: string;
}

type AgeGroup = "infant" | "child" | "teen" | "adult";

interface AgeGroupConfig {
  group: AgeGroup;
  min: number;
  max: number;
  label: string;
  message: string;
  variant: "warning" | "info" | "success";
}

const AGE_GROUPS: AgeGroupConfig[] = [
  {
    group: "infant",
    min: 0,
    max: 3,
    label: "婴幼儿",
    message: "0-3岁仅限使用清洁、保湿、防晒、爽身类儿童化妆品，不宜使用彩妆",
    variant: "warning",
  },
  {
    group: "child",
    min: 3,
    max: 12,
    label: "儿童",
    message: "3-12岁可使用标注'儿童化妆品'、含'小金盾'标志的产品，需在成人监护下使用",
    variant: "warning",
  },
  {
    group: "teen",
    min: 12,
    max: 18,
    label: "青少年",
    message: "12岁以上可谨慎使用成人化妆品，优先选择成分简单、无香精酒精的产品",
    variant: "info",
  },
  {
    group: "adult",
    min: 18,
    max: 100,
    label: "成人",
    message: "18岁以上可根据肤质选择适合的护肤产品",
    variant: "success",
  },
];

export function AgeSelector({ value, onChange, className }: AgeSelectorProps) {
  const [isDragging, setIsDragging] = useState(false);

  const currentGroup = useMemo(() => {
    return AGE_GROUPS.find((g) => value >= g.min && value < g.max) || AGE_GROUPS[3];
  }, [value]);

  const handleSliderChange = (values: number[]) => {
    onChange(values[0]);
  };

  const variantStyles = {
    warning: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300",
    info: "bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950/30 dark:border-sky-800 dark:text-sky-300",
    success: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300",
  };

  const variantIcons = {
    warning: AlertCircle,
    info: Info,
    success: CheckCircle2,
  };

  const Icon = variantIcons[currentGroup.variant];

  return (
    <div className={cn("space-y-4", className)}>
      {/* 年龄显示 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">年龄</span>
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              "text-3xl font-bold transition-all duration-300",
              isDragging && "scale-110 text-primary"
            )}
          >
            {value}
          </span>
          <span className="text-sm text-muted-foreground">岁</span>
        </div>
      </div>

      {/* 滑块 */}
      <div className="relative py-2">
        <Slider
          value={[value]}
          onValueChange={handleSliderChange}
          min={1}
          max={100}
          step={1}
          onPointerDown={() => setIsDragging(true)}
          onPointerUp={() => setIsDragging(false)}
          className="cursor-pointer"
        />
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>1岁</span>
          <span>50岁</span>
          <span>100岁</span>
        </div>
      </div>

      {/* 年龄段标签 */}
      <div className="flex gap-2">
        {AGE_GROUPS.map((group) => (
          <button
            key={group.group}
            onClick={() => onChange(group.min + 1)}
            className={cn(
              "flex-1 py-2 px-1 rounded-lg text-xs font-medium transition-all duration-200",
              currentGroup.group === group.group
                ? "bg-primary text-primary-foreground shadow-soft"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {group.label}
          </button>
        ))}
      </div>

      {/* 年龄段提示 */}
      <div
        className={cn(
          "flex items-start gap-3 p-4 rounded-xl border transition-all duration-300",
          variantStyles[currentGroup.variant]
        )}
      >
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">
            {currentGroup.label}护肤提示
          </p>
          <p className="text-xs opacity-90 leading-relaxed">
            {currentGroup.message}
          </p>
        </div>
      </div>
    </div>
  );
}
