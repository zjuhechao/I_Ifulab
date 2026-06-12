import { useState, useRef, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Camera, ImageIcon, Sparkles, Download, Share2, Loader2, Wand2, RefreshCw, Eye, EyeOff, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase, getSupabaseUrl } from "@/supabase/client";
// base64-arraybuffer 已移除，使用原生实现
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";
import { getImageGenAIConfig } from "@/services/aiConfig";

const AGE_GROUPS = [
  { id: "teen", label: "18-22岁", desc: "青春校园", icon: "🎓", tips: ["轻薄底妆", "自然眉形", "淡粉唇彩"] },
  { id: "young", label: "23-28岁", desc: "时尚活力", icon: "✨", tips: ["清透底妆", "流行眼妆", "渐变唇妆"] },
  { id: "adult", label: "29-35岁", desc: "精致优雅", icon: "💎", tips: ["遮瑕底妆", "精致眼妆", "经典唇色"] },
  { id: "middle", label: "36-45岁", desc: "优雅知性", icon: "🌹", tips: ["保湿底妆", "提亮眼周", "柔和唇色"] },
  { id: "senior", label: "46岁+", desc: "端庄大方", icon: "👑", tips: ["滋润底妆", "柔和眉形", "暖色唇妆"] },
];

const STYLES = [
  { id: "natural", label: "日常裸妆", desc: "清新自然", icon: "🌸", effects: ["均匀肤色", "提亮气色", "无妆感"] },
  { id: "office", label: "职场精英", desc: "干练专业", icon: "💼", effects: ["精致遮瑕", "利落眉形", "经典唇色"] },
  { id: "date", label: "约会甜美", desc: "温柔浪漫", icon: "💕", effects: ["清透底妆", "柔和眼妆", "水润唇妆"] },
  { id: "sport", label: "运动活力", desc: "阳光健康", icon: "🏃", effects: ["防水底妆", "自然眉形", "清爽妆感"] },
  { id: "artistic", label: "文艺清新", desc: "淡雅知性", icon: "📖", effects: ["哑光底妆", "大地色眼妆", "豆沙唇色"] },
  { id: "party", label: "派对闪耀", desc: "华丽吸睛", icon: "✨", effects: ["精致底妆", "烟熏眼妆", "饱满唇妆"] },
  { id: "retro", label: "复古港风", desc: "经典韵味", icon: "🎞️", effects: ["哑光底妆", "浓眉", "复古红唇"] },
  { id: "korean", label: "韩系清透", desc: "水光肌感", icon: "🇰🇷", effects: ["水光底妆", "卧蚕眼妆", "渐变唇妆"] },
  { id: "western", label: "欧美立体", desc: "轮廓分明", icon: "🇺🇸", effects: ["立体修容", "深邃眼妆", "饱满唇妆"] },
  { id: "japanese", label: "日系可爱", desc: "甜美俏皮", icon: "🇯🇵", effects: ["轻薄底妆", "大眼妆效", "粉嫩腮红"] },
];

const MAKEUP_INTENSITY = [
  { id: "light", label: "自然", desc: "淡妆裸感", percent: "30%" },
  { id: "medium", label: "适中", desc: "日常精致", percent: "60%" },
  { id: "heavy", label: "浓妆", desc: "全妆效果", percent: "90%" },
];

const HAIRSTYLES = [
  { id: "long", label: "长发", icon: "💇‍♀️", desc: "柔顺自然" },
  { id: "short", label: "短发", icon: "💇", desc: "清爽利落" },
  { id: "curly", label: "卷发", icon: "🦱", desc: "浪漫柔美" },
  { id: "straight", label: "直发", icon: "✨", desc: "简约时尚" },
  { id: "updo", label: "盘发", icon: "👑", desc: "优雅端庄" },
];

// 压缩图片
async function compressImage(file: File): Promise<File> {
  const maxSizeMB = 1;
  const maxWidthOrHeight = 2048;
  const quality = 0.85;
  const outputFormat = 'image/jpeg';
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (file.size <= maxBytes) {
    const img = await loadImage(file);
    if (img.width <= maxWidthOrHeight && img.height <= maxWidthOrHeight) {
      return file;
    }
  }

  const img = await loadImage(file);
  let { width, height } = img;

  if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
    const scale = Math.min(maxWidthOrHeight / width, maxWidthOrHeight / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);

  let currentQuality = quality;
  while (currentQuality > 0.1) {
    const blob = await canvasToBlob(canvas, outputFormat, currentQuality);
    if (blob.size <= maxBytes) {
      return new File([blob], `compressed.jpg`, { type: outputFormat });
    }
    currentQuality -= 0.1;
  }

  const blob = await canvasToBlob(canvas, outputFormat, 0.1);
  return new File([blob], `compressed.jpg`, { type: outputFormat });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
      type,
      quality
    );
  });
}

// 上传图片到存储桶
async function uploadImage(file: File): Promise<string> {
  const compressed = await compressImage(file);
  
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(compressed);
  });

  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const storagePath = `beauty-transform/${fileName}`;

  // 将 base64 转换为 ArrayBuffer
  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const { error: uploadError } = await supabase.storage
    .from('skin-photos')
    .upload(storagePath, base64ToArrayBuffer(base64), { contentType: 'image/jpeg' });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('skin-photos').getPublicUrl(storagePath);
  return publicUrl;
}

// 调用AI形象改造
async function transformBeauty(
  imageUrl: string,
  style: string,
  intensity: string,
  hairstyle: string,
  ageGroup: string
): Promise<{ imageUrl: string; features: string[]; styleName: string }> {
  const response = await fetch(`${getSupabaseUrl()}/functions/v1/beauty-transform`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageUrl,
      style,
      intensity,
      hairstyle,
      ageGroup,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || '生成失败');
  }

  const result = await response.json();
  return {
    imageUrl: result.data.imageUrl,
    features: result.data.features,
    styleName: result.data.styleName,
  };
}

export function BeautyTransformPage() {
  const navigate = useNavigate();
  const { user } = useAppStore();
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>(user?.ageGroup === "teen" ? "teen" : user?.ageGroup === "adult" ? "adult" : "adult");
  const [selectedStyle, setSelectedStyle] = useState("natural");
  const [selectedIntensity, setSelectedIntensity] = useState("medium");
  const [selectedHair, setSelectedHair] = useState("long");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultFeatures, setResultFeatures] = useState<string[]>([]);
  const [resultStyleName, setResultStyleName] = useState("");
  const [compareMode, setCompareMode] = useState<"split" | "toggle">("split");
  const [showOriginal, setShowOriginal] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50);
  const [hasAIConfig, setHasAIConfig] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 检查用户是否配置了图像生成AI
  useEffect(() => {
    getImageGenAIConfig().then(config => setHasAIConfig(!!config));
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("正在上传图片...");
      const publicUrl = await uploadImage(file);
      setPhoto(publicUrl);
      setResult(null);
      toast.success("图片上传成功");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "上传失败");
    }
  };

  const handleGenerate = async () => {
    if (!photo) return;

    setIsGenerating(true);
    try {
      toast.info("AI正在改造中，请稍候...");
      const transformed = await transformBeauty(
        photo,
        selectedStyle,
        selectedIntensity,
        selectedHair,
        selectedAgeGroup
      );
      setResult(transformed.imageUrl);
      setResultFeatures(transformed.features);
      setResultStyleName(transformed.styleName);
      toast.success("形象改造完成！");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "生成失败";
      if (msg.includes('AI服务') || msg.includes('配置')) {
        toast.error("请先在AI配置页面添加图像生成服务的API密钥");
        setHasAIConfig(false);
      } else {
        toast.error(msg);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    try {
      const response = await fetch(result);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `beauty-transform-${Date.now()}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("图片已保存");
    } catch {
      toast.error("保存失败");
    }
  };

  const handleShare = async () => {
    if (!result) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: '我的AI形象改造',
          text: `看看我的${resultStyleName}效果！`,
          url: result,
        });
      } else {
        await navigator.clipboard.writeText(result);
        toast.success("链接已复制");
      }
    } catch {
      // 用户取消分享
    }
  };

  const handleSplitMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSplitPosition(percent);
  };

  const getSelectedAgeGroup = () => AGE_GROUPS.find(a => a.id === selectedAgeGroup);
  const getSelectedStyle = () => STYLES.find(s => s.id === selectedStyle);
  const getSelectedIntensity = () => MAKEUP_INTENSITY.find(i => i.id === selectedIntensity);
  const getSelectedHair = () => HAIRSTYLES.find(h => h.id === selectedHair);

  return (
    <div className="min-h-screen bg-background safe-area-bottom">
      <div className="sticky top-0 z-10 glass border-b px-4 py-3 safe-area-top">
        <h1 className="text-lg font-semibold text-center">形象改造</h1>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-4">
        {!photo ? (
          <Card className="shadow-soft border-0">
            <CardContent className="p-6">
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="p-6 rounded-xl border-2 border-dashed border-primary/30 hover:bg-accent transition-colors">
                  <Camera className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <span className="text-sm font-medium">拍照</span>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="p-6 rounded-xl border-2 border-dashed border-primary/30 hover:bg-accent transition-colors">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <span className="text-sm font-medium">相册</span>
                </button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* 照片预览区 - 对比模式 */}
            <Card className="shadow-soft border-0 overflow-hidden">
              <div 
                ref={containerRef}
                className="aspect-square relative cursor-ew-resize"
                onMouseMove={(e) => compareMode === "split" && result && handleSplitMove(e)}
                onClick={() => compareMode === "toggle" && result && setShowOriginal(!showOriginal)}
              >
                {result && compareMode === "split" ? (
                  // 分屏对比模式
                  <>
                    {/* 原图（左侧） */}
                    <div className="absolute inset-0">
                      <img src={photo} alt="原图" className="w-full h-full object-cover" />
                    </div>
                    {/* 效果图（右侧，带遮罩） */}
                    <div 
                      className="absolute inset-0 overflow-hidden"
                      style={{ clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }}
                    >
                      <img src={result} alt="改造后" className="w-full h-full object-cover" />
                    </div>
                    {/* 分割线 */}
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-white shadow-lg z-10"
                      style={{ left: `${splitPosition}%`, transform: 'translateX(-50%)' }}
                    >
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-1 shadow-lg">
                        <div className="flex">
                          <ChevronLeft className="w-3 h-3 text-primary" />
                          <ChevronRight className="w-3 h-3 text-primary" />
                        </div>
                      </div>
                    </div>
                    {/* 标签 */}
                    <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      原图
                    </div>
                    <div className="absolute top-3 right-3 bg-primary/80 text-white text-xs px-2 py-1 rounded">
                      改造后
                    </div>
                  </>
                ) : result && compareMode === "toggle" ? (
                  // 切换对比模式
                  <img 
                    src={showOriginal ? photo : result} 
                    alt={showOriginal ? "原图" : "改造后"} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // 仅显示原图
                  <img src={photo} alt="原图" className="w-full h-full object-cover" />
                )}
                
                {isGenerating && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center text-white">
                      <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2" />
                      <p className="text-sm">AI生成中...</p>
                      <p className="text-xs opacity-70 mt-1">大约需要10-30秒</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* 对比模式切换 */}
            {result && (
              <div className="flex gap-2">
                <button 
                  onClick={() => setCompareMode("split")}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                    compareMode === "split" ? "bg-primary text-white" : "bg-secondary hover:bg-accent"
                  )}
                >
                  分屏对比
                </button>
                <button 
                  onClick={() => setCompareMode("toggle")}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                    compareMode === "toggle" ? "bg-primary text-white" : "bg-secondary hover:bg-accent"
                  )}
                >
                  点击切换
                </button>
              </div>
            )}

            {/* 改造效果展示 */}
            {result && (
              <Card className="shadow-soft border-0 bg-gradient-to-r from-primary/5 to-primary/10">
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {resultStyleName}效果
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {resultFeatures.map((feature, i) => (
                      <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {feature}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 年龄段选择 */}
            <Card className="shadow-soft border-0">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-primary" />
                  选择年龄段
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {AGE_GROUPS.map((age) => (
                    <button key={age.id} onClick={() => setSelectedAgeGroup(age.id)} className={cn(
                      "p-2 rounded-xl text-center transition-all",
                      selectedAgeGroup === age.id ? "bg-primary text-white shadow-soft" : "bg-secondary hover:bg-accent"
                    )}>
                      <span className="text-lg">{age.icon}</span>
                      <span className="text-[10px] block mt-1">{age.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">{getSelectedAgeGroup()?.desc}</p>
                {/* 年龄段美妆建议 */}
                <div className="mt-3 p-3 bg-accent/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">推荐技法：</p>
                  <div className="flex flex-wrap gap-1">
                    {getSelectedAgeGroup()?.tips.map((tip, i) => (
                      <span key={i} className="text-xs bg-white/50 px-2 py-0.5 rounded">{tip}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 风格选择 */}
            <Card className="shadow-soft border-0">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-primary" />
                  选择风格
                </h3>
                <div className="grid grid-cols-5 gap-2">
                  {STYLES.map((style) => (
                    <button key={style.id} onClick={() => setSelectedStyle(style.id)} className={cn(
                      "p-2 rounded-xl text-center transition-all",
                      selectedStyle === style.id ? "bg-primary text-white shadow-soft" : "bg-secondary hover:bg-accent"
                    )}>
                      <span className="text-lg">{style.icon}</span>
                      <span className="text-[10px] block mt-1">{style.label}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">{getSelectedStyle()?.desc}</p>
                {/* 风格效果预览 */}
                <div className="mt-3 p-3 bg-accent/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">妆效重点：</p>
                  <div className="flex flex-wrap gap-1">
                    {getSelectedStyle()?.effects.map((effect, i) => (
                      <span key={i} className="text-xs bg-white/50 px-2 py-0.5 rounded">{effect}</span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 妆容强度 */}
            <Card className="shadow-soft border-0">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3">妆容强度</h3>
                <div className="flex gap-2">
                  {MAKEUP_INTENSITY.map((item) => (
                    <button key={item.id} onClick={() => setSelectedIntensity(item.id)} className={cn(
                      "flex-1 p-3 rounded-xl text-center transition-all",
                      selectedIntensity === item.id ? "bg-primary text-white" : "bg-secondary hover:bg-accent"
                    )}>
                      <span className="text-sm font-medium">{item.label}</span>
                      <span className="text-xs opacity-80 block">{item.desc}</span>
                      <span className="text-[10px] mt-1 block opacity-60">{item.percent}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 发型选择 */}
            <Card className="shadow-soft border-0">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3">发型选择</h3>
                <div className="flex gap-2">
                  {HAIRSTYLES.map((hair) => (
                    <button key={hair.id} onClick={() => setSelectedHair(hair.id)} className={cn(
                      "flex-1 p-3 rounded-xl text-center transition-all",
                      selectedHair === hair.id ? "bg-primary text-white" : "bg-secondary hover:bg-accent"
                    )}>
                      <span className="text-xl">{hair.icon}</span>
                      <span className="text-xs block mt-1">{hair.label}</span>
                      <span className="text-[10px] mt-0.5 block opacity-60">{hair.desc}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            {hasAIConfig === false ? (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4 text-center">
                  <Settings className="w-10 h-10 mx-auto mb-2 text-amber-500" />
                  <p className="text-sm font-medium text-amber-800 mb-1">AI服务未配置</p>
                  <p className="text-xs text-amber-600 mb-3">请先在AI配置页面添加图像生成服务的API密钥</p>
                  <Button size="sm" className="bg-amber-500 hover:bg-amber-600" onClick={() => navigate({ to: '/ai-config' })}>
                    <Settings className="w-3 h-3 mr-1" />
                    前往配置
                  </Button>
                </CardContent>
              </Card>
            ) : !result ? (
              <Button size="lg" className="w-full rounded-xl shadow-soft gradient-fresh" onClick={handleGenerate} disabled={isGenerating}>
                <Sparkles className="w-4 h-4 mr-2" />
                {isGenerating ? "生成中..." : "开始改造"}
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={handleGenerate} disabled={isGenerating}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重新生成
                </Button>
                <Button variant="outline" className="flex-1 rounded-xl" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  保存
                </Button>
                <Button variant="outline" className="flex-1 rounded-xl" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-2" />
                  分享
                </Button>
              </div>
            )}

            <Button variant="ghost" className="w-full" onClick={() => { setPhoto(null); setResult(null); }}>
              重新上传
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
