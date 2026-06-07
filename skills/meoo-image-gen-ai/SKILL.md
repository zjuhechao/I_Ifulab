---
name: meoo-image-gen-ai
description: >
  AI文生图+图片编辑能力。仅用于在用户应用代码里接入生图/编辑图片能力，例如页面里加 AI 生图按钮、让应用用户生成或编辑图片、部署 ai-image-gen Edge Function；不是对话中直接生图或构建态生成 hero 图/插画/logo/背景图等页面素材的入口。对话中或构建态素材生图必须使用 Bash 工具 meoo-cli image-generate，不加载本技能。提供 qwen-image-2.0（快速同步出图）和 wan2.7-image（高质量同步出图，支持多图参考与图像编辑）两种模型，通过Edge Function服务端代理统一鉴权，支持多尺寸输出、多图参考、颜色主题、提示词增强。仅支持单图生成，不支持组图模式。
  【BLOCKING】MUST first load meoo-cloud skill and initialize before use
---

# Meoo AI 图片生成与编辑能力集成

在 Meoo 项目中接入"用文字生成图片"或"用文字编辑图片"类 AI 能力的标准指南。

## 技能定位

本技能处理"文字 → 图片"和"文字+图片 → 图片"两个方向：

- **文生图**：用户提供文字描述，AI 返回生成的图片
- **图像编辑**：用户提供参考图片+文字指令，AI 返回编辑后的图片
- **交互式编辑**：用户框选图片区域+文字指令，AI 在指定位置编辑

> "图片 → 文字"用 `meoo-vision-ai`，纯文本用 `meoo-llm-ai`。

### 何时加载本技能 vs 用 Bash 工具

| 场景 | 处理方式 | 是否加载本技能 |
|------|---------|:---:|
| 用户要在自己的应用里**接入**生图功能（按钮、页面、Edge Function 部署） | 本技能（接入代码） | ✅ |
| 用户在当前对话中要**直接生成一张图** ("生成一张赛博风格城市图") | Bash 工具 `meoo-cli image-generate --prompt "..."` | ❌ |
| 构建态/设计态要给页面生成素材（hero 图、插画、logo、背景图、贴纸等） | Bash 工具 `meoo-cli image-generate --prompt "..."`，再把产物写入页面 | ❌ |
| 用户要给生成的图片做永久存储/画廊 | 本技能（持久化章节） | ✅ |

**关键判断**：用户是要"**做一个会生图的应用**"还是"**让你帮他生一张图/给当前页面生成素材**"。前者写代码（本技能），后者一行 bash（不加载本技能）。两者不要混淆——对话内生图和构建态素材生图直接 bash，无需 Cloud 初始化、无需 Edge Function。

## 前置检查（阻断性）

**Meoo Cloud Service 是所有 AI 能力的必要前提。Cloud 未成功启用时，禁止生成任何 Edge Function 或 AI 接入代码。**

1. 如果尚未加载 meoo-cloud 技能，必须先使用 Skill 工具加载：`skill: "meoo-cloud"`
2. 加载完成后，使用 `init` 命令检查并初始化当前项目的 Cloud 功能。
3. 如果 Cloud 已初始化 → 继续后续步骤。
4. 如果 Cloud 未初始化 → 使用 `init` 命令引导用户完成初始化。
5. **以下任一情况，立即终止，拒绝生成任何 Edge Function 或 AI 接入代码：**
   - `init` 命令执行失败
   - Cloud 初始化过程报错
   - 用户主动拒绝启用 Cloud Service
6. 终止时统一提示：**「请先成功初始化 Meoo Cloud Service，然后再尝试使用 Meoo 模型服务。」**
7. 不得在 Cloud 未成功初始化的状态下编写任何边缘函数代码，即使用户要求也必须拒绝并说明原因。

## 凭证与接口

Meoo AI 域名：`https://api.meoo.host`

服务 AK **不写在前端**，由 Edge Function 从环境变量 `MEOO_PROJECT_API_KEY` 读取。

图片生成/编辑接口（Edge Function 内部使用）：

```
POST /meoo-ai/api/v1/services/aigc/image-generation/generation
```

请求头：

```http
Authorization: Bearer <MEOO_PROJECT_API_KEY>
Content-Type: application/json
```

## 模型

| 模型 | 特点 |
|------|------|
| `qwen-image-2.0` | 速度快，适合实时预览，prompt 上限 800 字符 |
| `wan2.7-image` | 质量更高，支持多图输入、图像编辑 |

默认使用 `qwen-image-2.0`。用户追求质量或需要图像编辑时切换到 `wan2.7-image`。

Meoo 平台只提供上表中的生图模型。DALL-E、Midjourney、Stable Diffusion 等外部服务不可用。

## 尺寸限制

不符合限制的尺寸会直接返回 `InvalidParameter` 错误。

### qwen-image-2.0

尺寸格式为 `宽*高`（星号分隔，不是 `x`/`×`/含空格）。总像素必须在 **262,144（512×512）~ 4,194,304（2048×2048）** 范围内。

常用安全尺寸：

| 比例 | 尺寸 | 像素数 |
|------|------|--------|
| 1:1 | `1024*1024` | 1,048,576 |
| 3:4 竖版 | `768*1024` | 786,432 |
| 4:3 横版 | `1024*768` | 786,432 |
| 9:16 竖版 | `720*1280` | 921,600 |
| 16:9 横版 | `1280*720` | 921,600 |

默认：`1024*1536`

### wan2.7-image

两种方式指定分辨率（不可混用）：

**预设分辨率（推荐）**：`"1K"`（~1024×1024）或 `"2K"`（~2048×2048，默认）

**自定义宽高**：总像素 [768×768, 2048×2048]，宽高比 [1:8, 8:1]

有图片输入时，输出宽高比与输入图像（多图时为最后一张）一致。无图片输入时，输出为正方形。

### 尺寸校验

```ts
function validateImageSize(
  size: string,
  model: 'qwen-image-2.0' | 'wan2.7-image'
): boolean {
  if (model === 'qwen-image-2.0') {
    const parts = size.split('*');
    if (parts.length !== 2) return false;
    const w = parseInt(parts[0], 10);
    const h = parseInt(parts[1], 10);
    return w * h >= 512 * 512 && w * h <= 2048 * 2048;
  }
  if (['1K', '2K'].includes(size)) return true;
  const parts = size.split('*');
  if (parts.length !== 2) return false;
  const w = parseInt(parts[0], 10);
  const h = parseInt(parts[1], 10);
  const ratio = w / h;
  return w * h >= 768 * 768 && w * h <= 2048 * 2048 && ratio >= 1 / 8 && ratio <= 8;
}
```

## 输入图片压缩（必须）

**所有用户上传的图片在传给 API 之前，必须经过压缩处理。** 无论图片来源是本地文件还是已有 URL，都必须确保符合以下硬限制：

| 限制项 | 值 |
|--------|-----|
| 格式 | JPEG、JPG、PNG（不支持透明通道）、BMP、WEBP |
| 分辨率 | 宽高各 [240, 8000] 像素 |
| 宽高比 | [1:8, 8:1] |
| 文件大小 | ≤ 1MB |
| 数量 | 0-9 张 |

### 压缩工具函数

```ts
/**
 * 智能压缩图片，确保符合 API 输入限制
 * 返回压缩后的 File 对象
 */
export async function compressImage(
  file: File,
  options?: {
    maxSizeMB?: number;        // 默认 1
    maxWidthOrHeight?: number; // 默认 8000
    minWidthOrHeight?: number; // 默认 240
    quality?: number;          // 初始质量 0-1，默认 0.85
    outputFormat?: 'image/jpeg' | 'image/webp'; // 默认 image/webp
  }
): Promise<File> {
  const {
    maxSizeMB = 1,
    maxWidthOrHeight = 8000,
    minWidthOrHeight = 240,
    quality = 0.85,
    outputFormat = 'image/webp',
  } = options || {};

  const maxBytes = maxSizeMB * 1024 * 1024;

  // 如果文件已经符合限制，直接返回
  if (file.size <= maxBytes) {
    const img = await loadImage(file);
    if (img.width >= minWidthOrHeight && img.width <= maxWidthOrHeight &&
        img.height >= minWidthOrHeight && img.height <= maxWidthOrHeight) {
      return file;
    }
  }

  const img = await loadImage(file);
  let { width, height } = img;

  // 缩放超大图片
  if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
    const scale = Math.min(maxWidthOrHeight / width, maxWidthOrHeight / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  // 放大过小图片（保持宽高比）
  if (width < minWidthOrHeight && height < minWidthOrHeight) {
    const scale = Math.max(minWidthOrHeight / width, minWidthOrHeight / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);

  // 递减质量直到文件大小达标
  let currentQuality = quality;
  while (currentQuality > 0.1) {
    const blob = await canvasToBlob(canvas, outputFormat, currentQuality);
    if (blob.size <= maxBytes) {
      const ext = outputFormat === 'image/webp' ? 'webp' : 'jpg';
      return new File([blob], `compressed.${ext}`, { type: outputFormat });
    }
    currentQuality -= 0.1;
  }

  // 兜底：最低质量
  const blob = await canvasToBlob(canvas, outputFormat, 0.1);
  const ext = outputFormat === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], `compressed.${ext}`, { type: outputFormat });
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement, type: string, quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
      type,
      quality
    );
  });
}
```

### 压缩调用时机

- **上传到存储桶之前**：`const compressed = await compressImage(file); await uploadImageForGeneration(compressed);`
- **强约束**：禁止跳过压缩直接上传原图

## 请求格式

### 文生图（Text-to-Image）

#### qwen-image-2.0

```json
{
  "model": "qwen-image-2.0",
  "input": {
    "messages": [{ "role": "user", "content": [{ "text": "一只坐在窗边的橘猫" }] }]
  },
  "parameters": { "size": "1024*1024" }
}
```

#### wan2.7-image

```json
{
  "model": "wan2.7-image",
  "input": {
    "messages": [{ "role": "user", "content": [{ "text": "一间充满鲜花的温馨花店" }] }]
  },
  "parameters": { "size": "2K", "n": 1, "watermark": false, "thinking_mode": true }
}
```

### 图像编辑（Image Editing）

```json
{
  "model": "wan2.7-image",
  "input": {
    "messages": [{
      "role": "user",
      "content": [
        { "image": "https://example.com/car.webp" },
        { "image": "https://example.com/paint.webp" },
        { "text": "把图2的涂鸦喷绘在图1的汽车上" }
      ]
    }]
  },
  "parameters": { "size": "2K", "n": 1, "watermark": false }
}
```

注意事项：
- 可传入 0-9 张图片，在 `content` 数组中按顺序排列
- 图像编辑最高支持 2K，不支持 `thinking_mode`

### 交互式编辑（Interactive Editing）

```json
{
  "model": "wan2.7-image",
  "input": {
    "messages": [{
      "role": "user",
      "content": [
        { "image": "https://example.com/room.webp" },
        { "image": "https://example.com/clock.webp" },
        { "text": "把图1的闹钟放在图2的框选位置" }
      ]
    }]
  },
  "parameters": {
    "bbox_list": [[], [[989, 515, 1138, 681]]],
    "size": "2K", "n": 1, "watermark": false
  }
}
```

**bbox_list 规则：**
- 长度必须与输入图片数量一致；无需编辑的图片传 `[]`
- 坐标格式：`[x1, y1, x2, y2]`，原点为左上角，使用原图绝对像素坐标
- 单张图片最多 2 个边界框

## 完整参数说明

| 参数 | 类型 | 说明 | 适用场景 |
|------|------|------|---------|
| `size` | string | 输出分辨率 | 所有 |
| `n` | int | **必填**，生成数量，范围 1-4。前端调用时必须显式传 `n: 1`（单图）。禁止省略此参数 | 所有 |
| `watermark` | bool | 右下角"AI生成"水印，默认 false | 所有 |
| `thinking_mode` | bool | 思考模式，默认 true。仅无图片输入时生效 | 文生图 |
| `bbox_list` | List[List[List[int]]] | 框选区域 | 交互式编辑 |
| `color_palette` | array | 3-10 种颜色，含 hex 和 ratio（之和=100.00%） | 文生图 |
| `seed` | int | 随机种子 [0, 2147483647] | 所有 |

## 响应解析

图片 URL 嵌套在 `output.choices[0].message.content` 数组里：

```json
{
  "output": {
    "choices": [{
      "finish_reason": "stop",
      "message": {
        "role": "assistant",
        "content": [{ "image": "https://dashscope-result-xxx.oss-cn-xxx.aliyuncs.com/xxx.png", "type": "image" }]
      }
    }],
    "finished": true
  },
  "usage": { "image_count": 1, "size": "2048*2048" }
}
```

### 图片 URL 提取

```ts
function extractImageUrl(response: any): string | null {
  return response?.output?.choices?.[0]?.message?.content?.[0]?.image ?? null;
}

function extractAllImageUrls(response: any): string[] {
  const content = response?.output?.choices?.[0]?.message?.content;
  if (!Array.isArray(content)) return [];
  return content.filter((c: any) => c.image).map((c: any) => c.image);
}
```

**关键提醒：** 返回的图片 URL 是临时链接，约 24 小时有效。如需持久保存，参考「生成图片持久化存储」章节。

## Edge Function 服务端模板

文件位置：`/functions/ai-image-gen/index.ts`

```ts
const MEOO_AI_BASE_URL = 'https://api.meoo.host';
const MEOO_PROJECT_SERVICE_AK = Deno.env.get('MEOO_PROJECT_API_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AUTH_HEADERS = {
  'Authorization': `Bearer ${MEOO_PROJECT_SERVICE_AK}`,
  'Content-Type': 'application/json',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { prompt, model = 'qwen-image-2.0', size, images = [], n, ...restParams } = body;

    // n 是必填参数，前端必须显式传入
    if (typeof n !== 'number' || n < 1 || n > 4) {
      return new Response(
        JSON.stringify({ error: 'Parameter "n" is required and must be an integer between 1 and 4' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const defaultSize = model === 'qwen-image-2.0' ? '1024*1536' : '2K';
    const finalSize = size || defaultSize;

    const content: Array<{ text?: string; image?: string }> = [];
    for (const img of images) {
      content.push({ image: img });
    }
    content.push({ text: prompt });

    const requestBody: Record<string, unknown> = {
      model,
      input: { messages: [{ role: 'user', content }] },
      parameters: { size: finalSize, n, ...restParams },
    };

    const response = await fetch(
      `${MEOO_AI_BASE_URL}/meoo-ai/api/v1/services/aigc/image-generation/generation`,
      { method: 'POST', headers: AUTH_HEADERS, body: JSON.stringify(requestBody) }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      return new Response(errorBody, {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

部署：`CloudDeployFunction({ functionName: "ai-image-gen", verifyJwt: true })`

## 前端调用方式

```ts
import { getSupabaseUrl } from 'src/supabase/client.ts';

export async function generateImage(
  prompt: string,
  model: 'qwen-image-2.0' | 'wan2.7-image' = 'qwen-image-2.0',
  size?: string,
  options: {
    images?: string[];
    n?: number;
    watermark?: boolean;
    thinking_mode?: boolean;
    seed?: number;
    bbox_list?: number[][][];
    color_palette?: { hex: string; ratio: string }[];
  } = {}
) {
  // n 必须显式传入，默认单图生成
  const n = options.n ?? 1;
  const response = await fetch(
    `${getSupabaseUrl()}/functions/v1/ai-image-gen`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, model, size, n, ...options }),
    }
  );
  if (!response.ok) throw new Error(`请求失败: ${response.status}`);
  return response.json();
}
```

## 用户图片上传与存储（Meoo Cloud）

用户上传的本地图片必须**先压缩、再上传到 Meoo Cloud 存储桶**获取 public URL，用 public URL 调用 API。

### 前置依赖

- `@supabase/supabase-js`（项目已有）
- `base64-arraybuffer`（文件上传必需）

### 数据库与存储结构

通过 `CloudApplyMigration` 一次性创建（上传和持久化共用）：

```sql
-- 创建 images 存储桶（public 访问）
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- 创建 images 元数据表
CREATE TABLE IF NOT EXISTS public.images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 存储桶 RLS 策略
CREATE POLICY "Allow anonymous uploads" ON storage.objects
  FOR INSERT TO anon WITH CHECK (bucket_id = 'images');
CREATE POLICY "Allow anonymous select" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'images');
CREATE POLICY "Allow anonymous delete" ON storage.objects
  FOR DELETE TO anon USING (bucket_id = 'images');

-- images 表 RLS
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous access" ON public.images
  FOR ALL TO anon USING (true) WITH CHECK (true);
```

### 上传代码模板


```ts
import { supabase } from 'src/supabase/client.ts';
import { decode } from 'base64-arraybuffer';

/**
 * 压缩并上传图片到 Meoo Cloud，返回 public URL
 * 调用前必须先 compressImage()
 */
export async function uploadImageForGeneration(file: File): Promise<{
  publicUrl: string;
  storagePath: string;
  metadata: Record<string, unknown>;
}> {
  // 1. 读取文件为 base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // 2. 确定存储路径
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `uploads/${fileName}`;

  // 3. 上传（必须用 decode 后的 ArrayBuffer）
  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(storagePath, decode(base64), { contentType: file.type });
  if (uploadError) throw uploadError;

  // 4. 获取永久 public URL
  const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(storagePath);

  // 5. 保存元数据
  const { data, error: insertError } = await supabase
    .from('images')
    .insert({
      filename: fileName,
      original_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      storage_path: storagePath,
      public_url: publicUrl,
    })
    .select()
    .single();
  if (insertError) throw insertError;

  return { publicUrl, storagePath, metadata: data };
}
```




### 完整调用示例

```ts
// 1. 压缩 → 2. 上传 → 3. 用 public URL 调用 API
const compressed = await compressImage(file);
const { publicUrl } = await uploadImageForGeneration(compressed);
const result = await generateImage(
  '把这张图片变成卡通风格',
  'wan2.7-image',
  '2K',
  { images: [publicUrl] }
);
```

### 查询与删除

```ts
export async function listImages() {
  const { data, error } = await supabase
    .from('images')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// 删除顺序：先删存储文件，再删元数据
export async function deleteImage(id: string, storagePath: string) {
  await supabase.storage.from('images').remove([storagePath]);
  const { error } = await supabase.from('images').delete().eq('id', id);
  if (error) throw error;
}
```

## 生成图片持久化存储（Meoo Cloud）

AI 返回的图片 URL 是临时链接（~24h 有效）。需要画廊、历史记录、二次引用等场景时，将图片转存到 Meoo Cloud。

> 数据库结构与上方「用户图片上传与存储」共用同一套 SQL，无需重复执行 migration。

### 持久化代码模板


```ts
import { supabase } from 'src/supabase/client.ts';
import { decode } from 'base64-arraybuffer';

export async function persistGeneratedImage(tempUrl: string, originalPrompt: string) {
  const response = await fetch(tempUrl);
  if (!response.ok) throw new Error('图片下载失败');

  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  let binary = '';
  uint8Array.forEach(byte => (binary += String.fromCharCode(byte)));
  const base64 = btoa(binary);

  const mimeType = response.headers.get('content-type') || 'image/png';
  const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const storagePath = `generated/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('images')
    .upload(storagePath, decode(base64), { contentType: mimeType });
  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(storagePath);

  const { data, error: insertError } = await supabase
    .from('images')
    .insert({
      filename: fileName,
      original_name: originalPrompt.slice(0, 200),
      file_size: arrayBuffer.byteLength,
      mime_type: mimeType,
      storage_path: storagePath,
      public_url: publicUrl,
    })
    .select()
    .single();
  if (insertError) throw insertError;
  return data;
}

export async function persistGeneratedImages(tempUrls: string[], originalPrompt: string) {
  return Promise.all(tempUrls.map((url) => persistGeneratedImage(url, originalPrompt)));
}
```




## 执行步骤

1. 确认需求属于图片生成或图片编辑。
2. 定位落点：在哪个页面/模块需要生图/编辑能力。
3. 检查 Cloud 功能是否已初始化（未初始化则停止）。
4. 确定场景 → 选择模型和参数（见下方决策表）。
5. 确定尺寸并校验。
6. 创建或复用 Edge Function（`ai-image-gen`）。
7. 部署：`CloudDeployFunction({ functionName: "ai-image-gen", verifyJwt: true })`
8. 前端通过 supabase SDK 调用。
9. 如有图片输入：先 `compressImage()` → 再 `uploadImageForGeneration()` → 用 public URL 调用。
10. 正确解析响应，提取图片 URL。
11. 如需持久保存，用 `persistGeneratedImage()` 转存。
12. 完成 loading、error 状态处理。

### 场景决策表

| 场景 | 模型 | 关键参数 | 是否需要图片输入 |
|------|------|---------|:---:|
| 文生图（快速） | `qwen-image-2.0` | `n: 1`, `size: "1024*1536"` | 否 |
| 文生图（高质量） | `wan2.7-image` | `n: 1`, `size: "2K"`, `thinking_mode: true` | 否 |
| 图像编辑 | `wan2.7-image` | `n: 1`, `size: "2K"` | 是（0-9张） |
| 交互式编辑 | `wan2.7-image` | `n: 1`, `size: "2K"`, `bbox_list` | 是 |

## 规则与约束

### 必须（MUST）

- Cloud 功能必须已成功启用才能继续（启动失败或用户拒绝均视为未启用，禁止生成 Edge Function）
- AK 存放在 Edge Function 环境变量，禁止硬编码在前端
- 模型名严格使用 `qwen-image-2.0` 或 `wan2.7-image`
- 用户上传图片必须先 `compressImage()` 压缩至 ≤ 1MB 再上传，禁止跳过压缩
- 上传存储桶必须用 `base64-arraybuffer` 的 `decode()` + ArrayBuffer，禁止 Blob/File/FormData
- Edge Function 必须处理 CORS（OPTIONS）、try-catch、转发上游状态码
- 部署后生效——代码修改必须重新 `CloudDeployFunction`
- bbox_list 长度 = 输入图片数量；color_palette ratio 之和 = 100.00%
- 删除图片：先删存储文件，再删元数据
- **【BLOCKING】仅支持同步调用**：接口请求即返回图片 URL，一次 fetch 完成。禁止使用异步任务模式（task_id 提交 + 轮询 status）

### 禁止（MUST NOT）

- 不使用 DALL-E、Stable Diffusion 或任何第三方生图 API
- wan2.7-image 不支持 `prompt_extend`，禁止传此参数
- wan2.7-image 的 `size` 预设值 `"1K"`/`"2K"` 不要与 `宽*高` 混用
- 不支持组图模式（`enable_sequential`），禁止传此参数
- **【BLOCKING】禁止异步调用**：禁止使用 task_id 提交 + 轮询 status 的异步模式，meoo 生图接口仅接受同步调用，无任务提交/轮询端点
- 不因接入生图而做无关的工程改造（不重建目录、不新建无关页面/路由）
- 前端调用时禁止省略 `n` 参数，必须显式传 `n: 1`（单图）或用户指定的数量

### 默认（DEFAULT）

- 模型：`qwen-image-2.0`
- 生成数量：`n: 1`（单图），每次调用必须显式传入
- 尺寸：qwen 用 `1024*1536`，wan2.7 用 `"2K"`
- 通过 Edge Function 调用，使用 supabase SDK
- 不传 `thinking_mode`（API 默认 true）
- 不传 `watermark`（API 默认 false）

## 常见 InvalidParameter 排查

| 问题 | 原因 | 修复 |
|------|------|------|
| size 格式错误 | `"1024x1024"` / `"1024 * 1024"` | 用 `"1024*1024"` 或 `"1K"`/`"2K"` |
| size 超出范围 | qwen 低于 512×512 / wan2.7 传 `"3K"` | 参考尺寸限制章节 |
| model 拼写错误 | `z-image` / `qwen-wan` / `wanx-v1` | 严格用 `qwen-image-2.0` 或 `wan2.7-image` |
| wan2.7 传了 prompt_extend | 不支持此参数 | 移除 |
| prompt 超长 | qwen ≤ 800 字符，wan2.7 ≤ 5000 字符 | 截断 |
| input 结构错误 | content 不是数组 | 每个元素 `{ text }` 或 `{ image }` |
| bbox_list 格式错误 | 长度不匹配 / 坐标格式错 / 超过2个框 | 检查规则 |
| color_palette 错误 | 颜色数不在 3-10 / ratio 之和≠100% | 修正 |

## 异常处理

- Cloud 未初始化 / 启动失败 / 用户拒绝启用 → 立即停止所有 AI 集成工作，提示「请先成功初始化 Meoo Cloud Service，然后再尝试使用 Meoo 模型服务」，拒绝生成任何边缘函数代码
- 需求变成文本对话/视觉理解 → 引导用 `meoo-llm-ai` / `meoo-vision-ai`
- `InvalidParameter` → 按上方排查表逐项检查
- Edge Function 部署失败 → 检查 `MEOO_PROJECT_API_KEY`
- 请求 401 → 检查 AK 读取
- 图片过大超时 → 确认 `compressImage()` 是否正确调用

## 产出清单

基础（必须）：

- `/functions/ai-image-gen/index.ts`（Edge Function）
- `src/services/meooImageGen.ts`（前端封装 + compressImage + extractImageUrl）
- `src/components/ai/ImageGenerator.tsx` 或嵌入现有页面

如需图片上传：

- 上传代码 + 存储桶 migration

如需持久化：

- `src/services/imageStorage.ts`（持久化 + 查询 + 删除）
- `src/components/ai/ImageGallery.tsx`

## 完成标准

- Cloud 功能已初始化
- Edge Function 已部署，AK 从环境变量读取
- 前端通过 supabase SDK 调用 Edge Function
- 文本输入和图片输出正常工作
- 尺寸参数在允许范围内
- 图片输入经过 `compressImage()` 压缩
- 具备 loading、error 状态处理
- 代码只涉及图片生成/编辑功能本身
