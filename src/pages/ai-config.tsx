import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings, Plus, Trash2, Edit2, Check, X, 
  Image as ImageIcon, MessageSquare, Eye, 
  Server, Key, Globe, Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/supabase/client";
import { useAppStore } from "@/store/app-store";
import { toast } from "sonner";

interface AIServiceConfig {
  id: string;
  service_type: string;
  provider: string;
  name: string;
  api_key: string | null;
  base_url: string | null;
  model: string | null;
  is_active: boolean;
  is_default: boolean;
  config: Record<string, unknown> | null;
  created_at: string | null;
}

const SERVICE_TYPES = [
  { id: 'image_gen', label: '图像生成', icon: ImageIcon, desc: 'AI生图、图像编辑' },
  { id: 'text_gen', label: '文本生成', icon: MessageSquare, desc: 'AI对话、文本生成' },
  { id: 'vision', label: '视觉理解', icon: Eye, desc: '图像识别、视觉分析' },
];

const PROVIDERS = [
  { id: 'meoo', label: 'Meoo AI', defaultUrl: 'https://api.meoo.host', models: ['wan2.7-image', 'qwen-image-2.0', 'qwen3.6-plus', 'qwen3-vl-plus'] },
  { id: 'openai', label: 'OpenAI', defaultUrl: 'https://api.openai.com/v1', models: ['gpt-4', 'gpt-4o', 'dall-e-3'] },
  { id: 'stability', label: 'Stability AI', defaultUrl: 'https://api.stability.ai', models: ['stable-diffusion-xl', 'stable-diffusion-3'] },
  { id: 'custom', label: '自定义', defaultUrl: '', models: [] },
];

export function AIConfigPage() {
  const { user } = useAppStore();
  const [configs, setConfigs] = useState<AIServiceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<AIServiceConfig | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    service_type: 'image_gen',
    provider: 'meoo',
    name: '',
    api_key: '',
    base_url: '',
    model: '',
    is_active: true,
    is_default: false,
  });

  const userId = user?.id || 'guest';

  useEffect(() => {
    loadConfigs();
  }, []);

  async function loadConfigs() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_service_configs')
        .select('*')
        .or(`user_id.eq.${userId},user_id.eq.default`)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setConfigs((data as AIServiceConfig[]) || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }

  function handleProviderChange(providerId: string) {
    const provider = PROVIDERS.find(p => p.id === providerId);
    setFormData(prev => ({
      ...prev,
      provider: providerId,
      base_url: provider?.defaultUrl || '',
      model: provider?.models[0] || '',
    }));
  }

  async function handleSave() {
    try {
      if (!formData.name.trim()) {
        toast.error('请输入配置名称');
        return;
      }

      const configData = {
        user_id: userId,
        service_type: formData.service_type,
        provider: formData.provider,
        name: formData.name,
        api_key: formData.api_key || null,
        base_url: formData.base_url || null,
        model: formData.model || null,
        is_active: formData.is_active,
        is_default: formData.is_default,
        config: {},
      };

      if (editingConfig) {
        const { error } = await supabase
          .from('ai_service_configs')
          .update(configData)
          .eq('id', editingConfig.id);
        if (error) throw error;
        toast.success('配置已更新');
      } else {
        const { error } = await supabase
          .from('ai_service_configs')
          .insert(configData);
        if (error) throw error;
        toast.success('配置已添加');
      }

      if (formData.is_default) {
        await supabase
          .from('ai_service_configs')
          .update({ is_default: false })
          .eq('user_id', userId)
          .eq('service_type', formData.service_type)
          .neq('id', editingConfig?.id || '');
      }

      setIsDialogOpen(false);
      setEditingConfig(null);
      resetForm();
      loadConfigs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败');
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('ai_service_configs')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('配置已删除');
      loadConfigs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败');
    }
  }

  async function handleSetDefault(id: string, serviceType: string) {
    try {
      await supabase
        .from('ai_service_configs')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('service_type', serviceType);
      
      const { error } = await supabase
        .from('ai_service_configs')
        .update({ is_default: true })
        .eq('id', id);
      if (error) throw error;
      
      toast.success('默认配置已更新');
      loadConfigs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '设置失败');
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    try {
      const { error } = await supabase
        .from('ai_service_configs')
        .update({ is_active: !currentActive })
        .eq('id', id);
      if (error) throw error;
      loadConfigs();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败');
    }
  }

  function resetForm() {
    setFormData({
      service_type: 'image_gen',
      provider: 'meoo',
      name: '',
      api_key: '',
      base_url: PROVIDERS[0].defaultUrl,
      model: PROVIDERS[0].models[0],
      is_active: true,
      is_default: false,
    });
  }

  function openEditDialog(config: AIServiceConfig) {
    setEditingConfig(config);
    setFormData({
      service_type: config.service_type,
      provider: config.provider,
      name: config.name,
      api_key: config.api_key || '',
      base_url: config.base_url || '',
      model: config.model || '',
      is_active: config.is_active,
      is_default: config.is_default,
    });
    setIsDialogOpen(true);
  }

  function openAddDialog() {
    setEditingConfig(null);
    resetForm();
    setIsDialogOpen(true);
  }

  const getServiceTypeLabel = (type: string) => SERVICE_TYPES.find(t => t.id === type)?.label || type;
  const getProviderLabel = (id: string) => PROVIDERS.find(p => p.id === id)?.label || id;

  const groupedConfigs = configs.reduce((acc, config) => {
    if (!acc[config.service_type]) acc[config.service_type] = [];
    acc[config.service_type].push(config);
    return acc;
  }, {} as Record<string, AIServiceConfig[]>);

  const getServiceColor = (type: string) => {
    switch (type) {
      case 'image_gen': return { bg: 'bg-violet-500', text: 'text-violet-600', light: 'bg-violet-50', border: 'border-violet-200', gradient: 'from-violet-400 to-purple-500' };
      case 'text_gen': return { bg: 'bg-sky-500', text: 'text-sky-600', light: 'bg-sky-50', border: 'border-sky-200', gradient: 'from-sky-400 to-blue-500' };
      case 'vision': return { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-200', gradient: 'from-amber-400 to-orange-500' };
      default: return { bg: 'bg-primary', text: 'text-primary', light: 'bg-primary/5', border: 'border-primary/20', gradient: 'from-primary to-primary/80' };
    }
  };

  return (
    <div className="min-h-screen bg-background safe-area-bottom">
      <div className="sticky top-0 z-10 bg-gradient-to-r from-cyan-400 to-blue-500 border-b px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold flex items-center gap-2 text-white">
            <Settings className="w-5 h-5" />
            AI服务配置
          </h1>
          <Button size="sm" variant="secondary" onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-1" />
            添加
          </Button>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-4">
        <Card className="shadow-soft border-0 bg-gradient-to-r from-cyan-50 to-blue-50">
          <CardContent className="p-4">
            <h3 className="text-sm font-medium mb-3 text-cyan-800">支持的AI服务类型</h3>
            <div className="space-y-2">
              {SERVICE_TYPES.map(type => {
                const Icon = type.icon;
                const colors = getServiceColor(type.id);
                return (
                  <div key={type.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${colors.light} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${colors.text}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="image_gen" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted/50">
            <TabsTrigger value="image_gen" className="data-[state=active]:bg-violet-500 data-[state=active]:text-white">生图</TabsTrigger>
            <TabsTrigger value="text_gen" className="data-[state=active]:bg-sky-500 data-[state=active]:text-white">文本</TabsTrigger>
            <TabsTrigger value="vision" className="data-[state=active]:bg-amber-500 data-[state=active]:text-white">视觉</TabsTrigger>
          </TabsList>

          {SERVICE_TYPES.map(type => (
            <TabsContent key={type.id} value={type.id} className="space-y-3">
              {loading ? (
                <Card className="shadow-soft border-0">
                  <CardContent className="p-6 text-center text-muted-foreground">
                    加载中...
                  </CardContent>
                </Card>
              ) : groupedConfigs[type.id]?.length > 0 ? (
                groupedConfigs[type.id].map(config => {
                  const colors = getServiceColor(config.service_type);
                  return (
                  <Card key={config.id} className={cn(
                    "shadow-soft border-0 relative overflow-hidden",
                    config.is_default && "ring-2 ring-primary"
                  )}>
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.bg}`} />
                    <CardContent className="p-4 pl-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{config.name}</h4>
                            {config.is_default && (
                              <span className={`text-[10px] ${colors.bg} text-white px-1.5 py-0.5 rounded`}>
                                默认
                              </span>
                            )}
                            {!config.is_active && (
                              <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                                已停用
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {getProviderLabel(config.provider)} · {config.model}
                          </p>
                          {config.base_url && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {config.base_url}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Switch
                            checked={config.is_active}
                            onCheckedChange={() => handleToggleActive(config.id, config.is_active)}
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                        {!config.is_default && config.is_active && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleSetDefault(config.id, config.service_type)}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            设为默认
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(config)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(config.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })
              ) : (
                <Card className="shadow-soft border-0">
                  <CardContent className="p-6 text-center text-muted-foreground">
                    <Bot className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>暂无{type.label}配置</p>
                    <Button variant="outline" className="mt-3" onClick={openAddDialog}>
                      <Plus className="w-4 h-4 mr-1" />
                      添加配置
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingConfig ? '编辑配置' : '添加AI服务配置'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>服务类型</Label>
              <Select 
                value={formData.service_type} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, service_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>服务提供商</Label>
              <Select 
                value={formData.provider} 
                onValueChange={handleProviderChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>配置名称</Label>
              <Input 
                placeholder="例如：我的OpenAI配置"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Key className="w-3 h-3" />
                API Key
              </Label>
              <Input 
                type="password"
                placeholder="sk-..."
                value={formData.api_key}
                onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Base URL
              </Label>
              <Input 
                placeholder="https://api.example.com"
                value={formData.base_url}
                onChange={(e) => setFormData(prev => ({ ...prev, base_url: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Server className="w-3 h-3" />
                模型
              </Label>
              <Input 
                placeholder="gpt-4 或 dall-e-3"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              />
              {formData.provider === 'meoo' && (
                <p className="text-xs text-muted-foreground">
                  生图推荐：wan2.7-image（高质量）或 qwen-image-2.0（快速）
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
                />
                <Label className="text-sm">启用</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_default: v }))}
                />
                <Label className="text-sm">设为默认</Label>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
              <X className="w-4 h-4 mr-1" />
              取消
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              <Check className="w-4 h-4 mr-1" />
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
