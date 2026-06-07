import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Copy, Check, Share2, Smartphone, Monitor } from "lucide-react";
import { toast } from "sonner";

export function InvitePage() {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    // 获取当前页面URL作为应用链接
    const currentUrl = window.location.origin;
    setAppUrl(currentUrl);
    
    // 生成二维码（使用QR Server API）
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}`;
    setQrCodeUrl(qrUrl);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      toast.success("链接已复制到剪贴板");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("复制失败，请手动复制");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "容·易 AI护肤助手 - 测试邀请",
          text: "快来体验AI智能测肤，获取个性化护肤方案！",
          url: appUrl,
        });
      } catch {
        // 用户取消分享
      }
    } else {
      handleCopy();
    }
  };

  const testFeatures = [
    { icon: "📸", title: "AI拍照测肤", desc: "上传照片，AI分析9项肤质指标" },
    { icon: "📋", title: "肤质问卷", desc: "10道问题，完善肌肤档案" },
    { icon: "📊", title: "护肤追踪", desc: "记录每日肌肤状态变化" },
    { icon: "🛍️", title: "产品推荐", desc: "根据肤质智能推荐护肤品" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-sky-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b px-4 py-4">
        <div className="text-center">
          <h1 className="text-lg font-semibold">测试邀请</h1>
          <p className="text-xs text-muted-foreground">容·易 AI护肤助手</p>
        </div>
      </div>

      <div className="p-6 max-w-md mx-auto">
        {/* 应用信息 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-400 to-orange-300 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-3xl">✨</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">容·易 AI护肤助手</h2>
          <p className="text-muted-foreground text-sm">智能测肤 · 个性推荐 · 护肤追踪</p>
        </div>

        {/* 二维码卡片 */}
        <Card className="p-6 mb-6 text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center justify-center gap-2">
            <QrCode className="w-4 h-4" />
            扫码体验
          </h3>
          <div className="bg-white p-4 rounded-xl inline-block shadow-sm mb-4">
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="测试二维码" 
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 bg-muted animate-pulse rounded-lg" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            使用手机相机或微信扫码
          </p>
        </Card>

        {/* 链接分享 */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm truncate">
              {appUrl || "加载中..."}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button 
              size="sm" 
              onClick={handleShare}
              className="shrink-0"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* 测试功能 */}
        <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          测试功能
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {testFeatures.map((feature) => (
            <Card key={feature.title} className="p-4">
              <div className="text-2xl mb-2">{feature.icon}</div>
              <h4 className="font-medium text-sm mb-1">{feature.title}</h4>
              <p className="text-xs text-muted-foreground">{feature.desc}</p>
            </Card>
          ))}
        </div>

        {/* 测试说明 */}
        <Card className="p-4 bg-amber-50 border-amber-200">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            测试须知
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• 支持手机端和电脑端访问</li>
            <li>• 首次使用可选择游客模式快速体验</li>
            <li>• AI测肤需要上传清晰的面部照片</li>
            <li>• 测试数据会保存在云端</li>
          </ul>
        </Card>

        {/* 开始测试按钮 */}
        <Button 
          size="lg" 
          className="w-full mt-6"
          onClick={() => window.location.href = "/"}
        >
          立即开始测试
        </Button>
      </div>
    </div>
  );
}
