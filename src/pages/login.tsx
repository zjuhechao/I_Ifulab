import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, X, Sparkles, User, Mail, Phone } from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/supabase/client";
import { toast } from "sonner";
import type { SkinType, BudgetLevel, Gender, AgeGroup } from "@/types";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginAsGuest } = useAppStore();
  const [loginType, setLoginType] = useState<"phone" | "email">("phone");
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const accountInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    accountInputRef.current?.focus();
  }, [loginType]);

  const handleLogin = async () => {
    if (!account.trim()) {
      toast.error(loginType === "phone" ? "请输入手机号" : "请输入邮箱");
      return;
    }
    if (!password.trim()) {
      toast.error("请输入密码");
      return;
    }

    setIsLoading(true);
    
    try {
      // 使用Supabase Auth进行真实登录
      const email = loginType === "phone" ? `${account}@phone.ifulab` : account;
      
      // 先尝试登录
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // 如果登录失败且用户不存在，则自动注册
      if (signInError && signInError.message.includes("Invalid login credentials")) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nickname: account.slice(0, 6),
              login_type: loginType,
            },
          },
        });

        if (signUpError) throw signUpError;
        
        // 注册成功后创建用户档案
        if (signUpData.user) {
          await supabase.from('user_profiles').insert({
            id: signUpData.user.id,
            nickname: account.slice(0, 6),
            skin_type: 'combination',
            budget_level: 'mid',
            age: 25,
            gender: 'female',
            age_group: 'adult',
            created_at: new Date().toISOString(),
          });
          
          toast.success("注册成功，已自动登录");
        login({
          id: signUpData.user.id,
          nickname: account.slice(0, 6),
          skinType: "combination" as SkinType,
          budgetLevel: "mid" as BudgetLevel,
          age: 25,
          gender: "female" as Gender,
          ageGroup: "adult" as AgeGroup,
        });
        }
      } else if (signInError) {
        throw signInError;
      } else if (signInData.user) {
        // 登录成功，获取用户档案
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', signInData.user.id)
          .single();
        
        toast.success("登录成功");
        login({
          id: signInData.user.id,
          nickname: profile?.nickname || signInData.user.user_metadata?.nickname || account.slice(0, 6),
          skinType: (profile?.skin_type as SkinType) || "combination",
          budgetLevel: (profile?.budget_level as BudgetLevel) || "mid",
          age: profile?.age || 25,
          gender: (profile?.gender as Gender) || "female",
          ageGroup: (profile?.age_group as AgeGroup) || "adult",
        });
      }
      
      navigate({ to: "/" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "登录失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    loginAsGuest();
    toast.success("已以游客身份登录");
    navigate({ to: "/" });
  };

  const clearAccount = () => {
    setAccount("");
    accountInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-rose-50 via-white to-sky-50">
      {/* 背景动效 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-rose-200/30 blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-sky-200/30 blur-3xl animate-pulse delay-700" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 rounded-full bg-amber-200/30 blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-400 to-orange-300 flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold">容·易</h1>
          <p className="text-sm text-muted-foreground mt-1">AI智能护肤助手</p>
        </div>

        {/* 登录卡片 */}
        <Card className="w-full max-w-sm p-6 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <Tabs value={loginType} onValueChange={(v) => setLoginType(v as "phone" | "email")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="phone" className="flex items-center gap-1">
                <Phone className="w-4 h-4" /> 手机号
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-1">
                <Mail className="w-4 h-4" /> 邮箱
              </TabsTrigger>
            </TabsList>

            <TabsContent value="phone" className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={accountInputRef}
                  type="tel"
                  placeholder="请输入手机号"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="pl-10 pr-10"
                  maxLength={11}
                />
                {account && (
                  <button onClick={clearAccount} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={accountInputRef}
                  type="email"
                  placeholder="请输入邮箱"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="pl-10 pr-10"
                />
                {account && (
                  <button onClick={clearAccount} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="relative mt-4">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
            </button>
          </div>

          <Button
            className="w-full mt-6"
            size="lg"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? "登录中..." : "登录"}
          </Button>

          {/* 游客入口 */}
          <Button
            variant="ghost"
            className="w-full mt-3"
            onClick={handleGuestLogin}
          >
            <User className="w-4 h-4 mr-2" />
            游客快速体验
          </Button>
        </Card>

        <p className="text-xs text-muted-foreground mt-6">
          登录即表示同意服务条款和隐私政策
        </p>
      </div>
    </div>
  );
}
