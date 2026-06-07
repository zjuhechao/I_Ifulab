import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  onClick?: () => void;
  className?: string;
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
  gradient,
  onClick,
  className,
}: FeatureCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "group relative overflow-hidden cursor-pointer",
        "border-0 shadow-soft transition-all duration-300",
        "hover:shadow-soft-lg hover:-translate-y-1",
        "active:scale-[0.98]",
        className
      )}
    >
      {/* 渐变背景 */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300",
          "group-hover:opacity-100",
          gradient
        )}
      />

      {/* 内容 */}
      <div className="relative p-5 flex flex-col items-center text-center">
        {/* 图标容器 */}
        <div
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center mb-3",
            "bg-gradient-to-br shadow-soft transition-transform duration-300",
            "group-hover:scale-110 group-hover:shadow-glow",
            gradient
          )}
        >
          <Icon className="w-7 h-7 text-white" strokeWidth={2} />
        </div>

        {/* 标题 */}
        <h3 className="font-semibold text-foreground text-base mb-1">
          {title}
        </h3>

        {/* 描述 */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {description}
        </p>
      </div>
    </Card>
  );
}
