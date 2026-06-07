import { useNavigate, useLocation } from "@tanstack/react-router";
import { Home, ScanFace, CalendarCheck, Package, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  color: string;
  activeColor: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { id: "home", label: "首页", icon: Home, path: "/", color: "text-sky-500", activeColor: "bg-sky-500" },
  { id: "skin-test", label: "测肤", icon: ScanFace, path: "/skin-test", color: "text-rose-500", activeColor: "bg-rose-500" },
  { id: "check-in", label: "打卡", icon: CalendarCheck, path: "/check-in", color: "text-emerald-500", activeColor: "bg-emerald-500" },
  { id: "my-products", label: "方案", icon: Package, path: "/my-products", color: "text-violet-500", activeColor: "bg-violet-500" },
  { id: "profile", label: "我的", icon: User, path: "/profile", color: "text-amber-500", activeColor: "bg-amber-500" },
  { id: "ai-config", label: "AI配置", icon: Settings, path: "/ai-config", color: "text-cyan-500", activeColor: "bg-cyan-500" },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = currentPath === item.path || currentPath.startsWith(item.path + "/");
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => navigate({ to: item.path })}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full relative",
                "transition-all duration-200",
                isActive ? item.color : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                isActive ? "bg-white shadow-md" : "bg-transparent"
              )}>
                <Icon className={cn("w-5 h-5", isActive && "fill-current")} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] rounded-full flex items-center justify-center font-medium">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </div>
              <span className={cn("text-xs mt-0.5", isActive && "font-medium")}>{item.label}</span>
              {isActive && (
                <div className={cn("absolute -bottom-0.5 w-6 h-1 rounded-full", item.activeColor)} />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
