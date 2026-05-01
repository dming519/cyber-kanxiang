# 赛博看相 · Cyber Kanxiang

AI × 玄学。基于 gpt-image-2 的传统相术 Web 应用，提供 **看手相 / 看面相 / 看痣相** 三个功能。

## 技术栈

- Next.js 15 App Router + TypeScript
- Tailwind CSS（赛博朋克 × 玄学风格）
- Cloudflare Workers 部署，使用 [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare)
- 中转 API：`code.newcli.com/codex/v1`（OpenAI 兼容接口）

## 本地开发

```bash
pnpm install
pnpm dev          # Next.js dev server
pnpm preview      # 用 wrangler 模拟 Workers 运行生产 build
```

需要配置 secret：
- 本地开发：在项目根目录创建 `.env.local` 与 `.dev.vars`，写入 `NEWCLI_API_KEY=...`
- 线上：执行 `wrangler secret put NEWCLI_API_KEY` 注入

## 部署

```bash
pnpm deploy
```

首次部署后到 Cloudflare Dashboard → Workers → cyber-kanxiang → Settings → Domains 绑定自定义域名。

## 项目结构

```
app/
├── layout.tsx                根布局 + 字体
├── page.tsx                  首页三卡片
├── globals.css               Tailwind + 全局样式
├── divine/[type]/page.tsx    三个相术共享的客户端页面
└── api/divine/route.ts       同步 POST 路由
components/
├── HomeCard.tsx              首页卡片
├── UploadZone.tsx            上传区
├── DivineButton.tsx          霓虹脉冲按钮
├── LoadingOverlay.tsx        太极加载层
├── ResultView.tsx            结果展示
└── BgRunes.tsx               八卦背景
lib/
├── prompts.ts                三套优化 prompt
├── compress.ts               图片压缩
└── api.ts                    客户端调用封装
```

## 备注

- gpt-image-2 单次生成约 30-90 秒，Cloudflare Workers 无 wall-clock 硬限制（CPU 才 30s，等待外部 fetch 不计 CPU），故无需异步任务+轮询
- 输出 PNG 内嵌 C2PA 元数据（约 30-50KB），不影响展示
- 上传图片仅用于本次生成，服务端不持久化

## 免责

本站仅供文化娱乐参考，所有结果由 AI 生成，请勿据此作出重大人生决策。
