# 容·易 (I_Ifulab) — AI 护肤助手

> 拍照测肤、智能推荐、比价追踪，你的私人 AI 护肤管家

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🔬 **AI 测肤** | 上传面部照片或填写问卷，AI 分析 9 项肤质指标，生成专业肤质报告 |
| 🎯 **产品推荐** | 基于肤质、年龄、预算，5 步科学推荐合适的护肤产品（洁面→水→精华→乳液→防晒） |
| 💰 **商品比价** | 搜索护肤产品，跨平台比较淘宝/京东价格，AI 智能分析最低价和购买建议 |
| 💄 **形象改造** | 上传照片，选择 10 种风格（日常裸妆/职场/约会/韩系等）AI 生成美妆造型 |
| ✅ **每日打卡** | 记录每日护肤、饮食、睡眠、运动，追踪护肤习惯完成度 |
| 📈 **肤质追踪** | 趋势图表展示肌肤变化，AI 月度总结，同龄对比分析 |
| 📝 **精选护肤知识** | 内置 50 条精选护肤知识（清洁/保湿/防晒/抗老/美白/敏感/痘痘/饮食/睡眠） |
| ⚙️ **自定义 AI** | 支持配置自己的 AI 服务商和模型（OpenAI 等），所有 AI 功能需用户自行配置 API 密钥 |

---

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| **前端框架** | React 19 + TypeScript |
| **构建工具** | Vite 7 |
| **路由** | TanStack Router（文件路由） |
| **UI 组件** | shadcn/ui（New York 风格）+ Tailwind CSS 4 |
| **状态管理** | Zustand（持久化存储） |
| **表单验证** | React Hook Form + Zod |
| **图表可视化** | Recharts |
| **后端服务** | Supabase（数据库 / 认证 / 存储 / Edge Functions） |
| **AI 能力** | 用户可配置自有 AI API 密钥（OpenAI 等），通过 Supabase Edge Functions 调用自选 AI 模型 |

---

## 📁 项目结构

```
├── src/
│   ├── components/         # 公共组件（评分环、产品卡片、护肤流程生成器等）
│   │   └── ui/             # shadcn/ui 组件库
│   ├── pages/              # 页面组件
│   │   ├── skin-test.tsx   # AI 测肤
│   │   ├── recommend.tsx   # 产品推荐
│   │   ├── price-compare.tsx # 商品比价
│   │   ├── beauty-transform.tsx # 形象改造
│   │   ├── check-in.tsx    # 每日打卡
│   │   ├── tracking.tsx    # 肤质追踪
│   │   ├── home.tsx        # 首页
│   │   ├── profile.tsx     # 个人中心
│   │   ├── login.tsx       # 登录
│   │   ├── questionnaire.tsx # 肤质问卷
│   │   ├── my-products.tsx # 我的产品
│   │   ├── my-routine.tsx  # 我的护肤流程
│   │   ├── ai-config.tsx   # AI 配置
│   │   └── invite.tsx      # 邀请好友
│   ├── store/              # Zustand 全局状态
│   ├── services/           # API 服务（肤质分析、产品、AI 配置）
│   ├── supabase/           # Supabase 客户端 & 类型定义
│   ├── hooks/              # 自定义 Hooks
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   └── routes/             # TanStack Router 路由
├── functions/              # Supabase Edge Functions
│   ├── skin-analysis/      # AI 肤质分析
│   ├── beauty-transform/   # AI 美妆造型生成
│   ├── price-search/       # 商品价格搜索
│   └── ai-personalize/     # AI 个性化内容生成
├── migrations/             # 数据库迁移文件（14 个）
├── skills/                 # 项目技能模块
├── vite.config.ts
├── package.json
└── components.json         # shadcn/ui 配置
```

---

## 🚀 快速开始

### 环境要求

- **Node.js** >= 18
- **pnpm**（推荐）

### 安装 & 运行

```bash
# 安装依赖
pnpm install

# 启动开发服务器（默认端口 3015）
pnpm dev

# 类型检查
pnpm typecheck

# 构建生产版本
pnpm build

# 预览构建产物
pnpm preview
```

### Supabase 配置

本项目依赖 Supabase 作为后端服务。确保配置好以下服务：

1. **数据库** — 运行 `migrations/` 目录下的 SQL 迁移文件
2. **认证** — 配置用户注册/登录
3. **存储** — 创建 `skin-photos` 和 `user-avatars` 存储桶
4. **Edge Functions** — 部署 `functions/` 目录下的 4 个函数

---

## 🎨 肤质分析维度

AI 测肤会从以下 9 个维度评估肌肤状态：

- 💧 **水润度** — 肌肤含水量
- 🛢 **出油度** — T区/面颊油脂分泌
- 🔴 **敏感度** — 肌肤耐受性
- 🔴 **痘痘** — 痤疮程度
- ☀️ **色斑** — 色素沉着
- 🔻 **皱纹** — 细纹/皱纹程度
- 🔍 **毛孔** — 毛孔粗大程度
- 👁 **黑眼圈** — 眼周暗沉
- ✨ **光滑度** — 肤质细腻度

综合评分范围：0-100 分，同时估算肌龄与实际年龄的差值。

---

## 📊 数据库表

| 表名 | 用途 |
|------|------|
| `skin_reports` | 肤质检测报告（9 维指标 + AI 分析） |
| `products` | 护肤产品库（200+ 条京东数据） |
| `check_in_records` | 每日打卡记录 |
| `user_profiles` | 用户档案 |
| `tips` | 护肤小贴士 |
| `user_tasks` | 用户自定义任务 |
| `ai_service_configs` | AI 服务配置 |
| `skincare_routine_tables` | 护肤流程 |
| `skincare_content` | 护肤内容文章 |

---

## 🔑 AI 功能说明

本项目**不内置任何 AI 服务**，所有 AI 功能（测肤分析、形象改造、个性化推荐等）均需用户在「AI 配置」页面自行配置 API 密钥后方可使用。支持 OpenAI、自定义 API 等多种服务商。

## 📄 License

MIT
