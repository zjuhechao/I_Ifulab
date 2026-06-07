---
name: react-design
description: React 项目脚手架（React 19 + Vite + shadcn/ui + Radix UI + Tailwind CSS v4 + TanStack Router 文件路由）。设计系统驱动、组件预置、自动适配暗黑模式、响应式布局。
---

# React Design 项目规范

<technology-stack>
React 19 + TypeScript（Vite 7，ESM）。UI 用 shadcn/ui (new-york) on Radix Primitives，`src/components/ui/` 已预置 46 个全量组件。样式 Tailwind v4，配置写在 `src/styles.css`，颜色一律 `oklch`，无 `tailwind.config.ts`。路由 TanStack Router 文件路由（`src/routes/`，`routeTree.gen.ts` 由 Vite 插件生成）。后端 Meoo Cloud（`@supabase/supabase-js` 已预置）。包管理 pnpm。
</technology-stack>

<contract>
**禁止改动**（违反会导致沙箱预览或 OSS 部署失败）：
- `vite.config.ts` 中：`server.port=3015` / `strictPort=true` / `host='0.0.0.0'` / `build.outDir='dist'` / `build.assetsDir='assets'`
- `package.json` / `index.html` 中带 `meoo-app-name` 标记的字段（系统托管）
- `src/routeTree.gen.ts`（Vite 插件生成；新建路由文件后跑一次 `pnpm run dev` 让它重新生成）

**强制规则**：
- 路径别名 `@` → `src/`
- 路由文件落 `src/routes/`，使用 `createFileRoute`；根布局在 `__root.tsx`
- 组件优先复用预置 shadcn；扩展用 `cva` 定义 variants，禁止内联条件 class；工具函数走 `src/lib/utils.ts:cn()`
- 图标用 `lucide-react`（已内置）
- 新增依赖一律改 `package.json` 后跑一次 `pnpm install`，禁止 `pnpm i <pkg>` 单装；shadcn 已全量预置，禁止重复装 Radix 原语
- 文件软上限约 260 行；新 UI 写新文件，组件 / 文件名要唯一
- 动效用 CSS keyframes 或预置的 `tw-animate-css`，不要再装其它动画库
</contract>

- `src/components/ui/` 已预置 46 个 shadcn/ui 组件，导入路径 `@/components/ui/{name}`
