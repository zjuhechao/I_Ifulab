import { useRouter } from "@tanstack/react-router";
import { useState, useRef } from "react";
import {
  User,
  Settings,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Sparkles,
  Camera,
  Edit2,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/supabase/client";
import { toast } from "sonner";
import type { SkinType, BudgetLevel, Gender } from "@/types";

const skinTypeLabels: Record<SkinType, string> = {
  dry: "干性肤质",
  oily: "油性肤质",
  combination: "混合肤质",
  sensitive: "敏感肤质",
  normal: "中性肤质",
};

const budgetLabels: Record<BudgetLevel, string> = {
  ultra_budget: "极简护肤",
  budget: "经济型",
  mid: "中等预算",
  premium: "高端护肤",
  luxury: "奢华护肤",
};

const genderLabels: Record<Gender, string> = {
  female: "女性",
  male: "男性",
};

export function ProfilePage() {
  const router = useRouter();
  const { user, skinProfile, logout, isGuest, updateUserProfile, updateSkinProfile } = useAppStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newNickname, setNewNickname] = useState(user?.nickname || '');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 档案编辑弹窗状态
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [editSkinType, setEditSkinType] = useState<SkinType>(skinProfile.skinType);
  const [editBudgetLevel, setEditBudgetLevel] = useState<BudgetLevel>(skinProfile.budgetLevel);
  const [editAge, setEditAge] = useState(skinProfile.age.toString());
  const [editGender, setEditGender] = useState<Gender>(skinProfile.gender);
  const [editAllergens, setEditAllergens] = useState<string[]>(user?.allergicIngredients || []);
  const [newAllergen, setNewAllergen] = useState('');

  const handleLogout = () => {
    logout();
    router.navigate({ to: '/login' });
  };

  // 处理头像上传
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请上传图片文件');
      return;
    }

    // 验证文件大小（最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    setIsUploading(true);
    try {
      // 压缩图片
      const compressedFile = await compressImage(file);

      // 上传到 Supabase Storage
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `avatars/${user?.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(fileName, compressedFile, {
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 获取公开URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(fileName);

      // 更新用户资料
      updateUserProfile({ avatar: publicUrl });
      toast.success('头像更新成功');
    } catch (error) {
      console.error('上传失败:', error);
      toast.error('头像上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  // 压缩图片
  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          // 限制最大尺寸为 400x400
          const maxSize = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Canvas toBlob failed'));
              }
            },
            'image/jpeg',
            0.8
          );
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 处理昵称修改
  const handleSaveNickname = () => {
    if (newNickname.trim() && newNickname.trim() !== user?.nickname) {
      updateUserProfile({ nickname: newNickname.trim() });
      toast.success('昵称修改成功');
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setNewNickname(user?.nickname || '');
    setIsEditingName(false);
  };

  // 打开档案编辑弹窗
  const handleOpenProfileEdit = () => {
    setEditSkinType(skinProfile.skinType);
    setEditBudgetLevel(skinProfile.budgetLevel);
    setEditAge(skinProfile.age.toString());
    setEditGender(skinProfile.gender);
    setEditAllergens(user?.allergicIngredients || []);
    setNewAllergen('');
    setIsProfileEditOpen(true);
  };

  // 添加过敏成分
  const handleAddAllergen = () => {
    if (newAllergen.trim() && !editAllergens.includes(newAllergen.trim())) {
      setEditAllergens([...editAllergens, newAllergen.trim()]);
      setNewAllergen('');
    }
  };

  // 删除过敏成分
  const handleRemoveAllergen = (allergen: string) => {
    setEditAllergens(editAllergens.filter(a => a !== allergen));
  };

  // 保存档案修改
  const handleSaveProfile = () => {
    const ageNum = parseInt(editAge);
    if (isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
      toast.error('请输入有效的年龄（10-100岁）');
      return;
    }

    updateSkinProfile({
      skinType: editSkinType,
      budgetLevel: editBudgetLevel,
      age: ageNum,
      gender: editGender,
    });

    // 更新用户过敏成分
    updateUserProfile({
      allergicIngredients: editAllergens,
    });

    toast.success('档案更新成功');
    setIsProfileEditOpen(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-400 px-4 pt-12 pb-8 safe-area-top">
        <h1 className="text-xl font-semibold text-white text-center">个人中心</h1>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* 用户信息卡片 */}
        <Card className="shadow-soft-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {/* 可点击的头像 */}
              <div className="relative">
                <Avatar
                  className="h-16 w-16 ring-4 ring-primary/20 cursor-pointer hover:ring-primary/40 transition-all"
                  onClick={handleAvatarClick}
                >
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-xl">
                    {user?.nickname?.[0] || '用'}
                  </AvatarFallback>
                </Avatar>
                {/* 上传按钮覆盖层 */}
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={handleAvatarClick}
                >
                  <Camera className="w-6 h-6 text-white" />
                </div>
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <div className="flex-1">
                {/* 可编辑的昵称 */}
                <div className="flex items-center gap-2">
                  {isEditingName ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={newNickname}
                        onChange={(e) => setNewNickname(e.target.value)}
                        className="h-8 text-lg font-semibold"
                        placeholder="输入昵称"
                        maxLength={20}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveNickname();
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleSaveNickname}>
                        <Check className="w-4 h-4 text-emerald-500" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
                        <X className="w-4 h-4 text-rose-500" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-lg font-semibold">{user?.nickname || '用户'}</h2>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setIsEditingName(true)}
                      >
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                <div className="flex gap-2 mt-2">
                  {isGuest ? (
                    <Badge variant="secondary" className="text-xs">游客</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      VIP会员
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 肤质档案 */}
        <Card className="shadow-soft border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">肤质档案</h3>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-sky-50 to-sky-100 border border-sky-200">
                <p className="text-xs text-sky-600 mb-1">肤质类型</p>
                <p className="font-medium text-sky-800">{skinTypeLabels[skinProfile.skinType as SkinType]}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200">
                <p className="text-xs text-amber-600 mb-1">预算档位</p>
                <p className="font-medium text-amber-800">{budgetLabels[skinProfile.budgetLevel as BudgetLevel]}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200">
                <p className="text-xs text-emerald-600 mb-1">年龄</p>
                <p className="font-medium text-emerald-800">{skinProfile.age} 岁</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200">
                <p className="text-xs text-rose-600 mb-1">性别</p>
                <p className="font-medium text-rose-800">{skinProfile.gender === "female" ? "女性" : "男性"}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4 rounded-xl" onClick={handleOpenProfileEdit}>
              编辑档案
            </Button>
          </CardContent>
        </Card>

        {/* 设置选项 */}
        <Card className="shadow-soft border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-500" />
              <h3 className="font-semibold">设置</h3>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            {/* 消息通知 */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-sky-500" />
                </div>
                <Label htmlFor="notifications" className="font-normal cursor-pointer">
                  消息通知
                </Label>
              </div>
              <Switch id="notifications" defaultChecked />
            </div>
            <Separator />

            {/* 隐私设置 */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-emerald-500" />
                </div>
                <Label htmlFor="privacy" className="font-normal cursor-pointer">
                  隐私模式
                </Label>
              </div>
              <Switch id="privacy" />
            </div>
            <Separator />

            {/* 帮助中心 */}
            <button className="flex items-center justify-between w-full py-3 hover:text-primary transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4 text-violet-500" />
                </div>
                <span>帮助中心</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
            <Separator />

            {/* 关于我们 */}
            <button className="flex items-center justify-between w-full py-3 hover:text-primary transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                  <User className="w-4 h-4 text-rose-500" />
                </div>
                <span>关于我们</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </CardContent>
        </Card>

        {/* 退出登录 */}
        <Button
          variant="outline"
          className="w-full h-12 rounded-xl text-destructive border-destructive/20 hover:bg-destructive/5"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          退出登录
        </Button>

        {/* 版本信息 */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          容·易 v1.0.0
        </p>
      </div>

      {/* 档案编辑弹窗 */}
      <Dialog open={isProfileEditOpen} onOpenChange={setIsProfileEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>编辑肤质档案</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* 肤质类型 */}
            <div>
              <label className="text-sm font-medium mb-2 block">肤质类型</label>
              <div className="grid grid-cols-2 gap-2">
                {(['dry', 'oily', 'combination', 'sensitive', 'normal'] as SkinType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setEditSkinType(type)}
                    className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                      editSkinType === type
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-input hover:border-primary/50'
                    }`}
                  >
                    {skinTypeLabels[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* 预算档位 */}
            <div>
              <label className="text-sm font-medium mb-2 block">预算档位</label>
              <div className="grid grid-cols-2 gap-2">
                {(['ultra_budget', 'budget', 'mid', 'premium', 'luxury'] as BudgetLevel[]).map((level) => (
                  <button
                    key={level}
                    onClick={() => setEditBudgetLevel(level)}
                    className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                      editBudgetLevel === level
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-input hover:border-primary/50'
                    }`}
                  >
                    {budgetLabels[level]}
                  </button>
                ))}
              </div>
            </div>

            {/* 年龄 */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">年龄</label>
              <Input
                type="number"
                value={editAge}
                onChange={(e) => setEditAge(e.target.value)}
                placeholder="请输入年龄"
                min={10}
                max={100}
              />
            </div>

            {/* 性别 */}
            <div>
              <label className="text-sm font-medium mb-2 block">性别</label>
              <div className="flex gap-2">
                {(['female', 'male'] as Gender[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => setEditGender(g)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
                      editGender === g
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-input hover:border-primary/50'
                    }`}
                  >
                    {genderLabels[g]}
                  </button>
                ))}
              </div>
            </div>

            {/* 过敏成分 */}
            <div>
              <label className="text-sm font-medium mb-2 block">过敏成分</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newAllergen}
                  onChange={(e) => setNewAllergen(e.target.value)}
                  placeholder="输入过敏成分，如：酒精、香精"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAllergen();
                    }
                  }}
                />
                <Button variant="outline" size="sm" onClick={handleAddAllergen}>
                  添加
                </Button>
              </div>
              {editAllergens.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {editAllergens.map((allergen) => (
                    <Badge
                      key={allergen}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/20"
                      onClick={() => handleRemoveAllergen(allergen)}
                    >
                      {allergen}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}
              {editAllergens.length === 0 && (
                <p className="text-xs text-muted-foreground">暂无过敏成分，可添加常见过敏原如：酒精、香精、防腐剂等</p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsProfileEditOpen(false)}>
              取消
            </Button>
            <Button className="flex-1" onClick={handleSaveProfile}>
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
