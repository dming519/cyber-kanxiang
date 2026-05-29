import { HomeCard, type HomeCardMeta } from "@/components/HomeCard";
import { ALL_TYPES } from "@/lib/prompts";

const EXTRA_FEATURES: HomeCardMeta[] = [
  {
    href: "/bazi",
    title: "看八字",
    subtitle: "Bazi · 四柱排盘",
    tagline: "公历农历皆可入，本地排盘 + AI 命理流式解读。",
    trigram: "☷",
    accent: "from-brand-primary to-[#d97706]",
    cta: "开始排盘",
  },
  {
    href: "/naming",
    title: "起名",
    subtitle: "Naming · 八字补益",
    tagline: "按喜用神补益，结合字义、音律、典故与避忌。",
    trigram: "☴",
    accent: "from-brand-primary to-[#059669]",
    cta: "落笔取名",
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="font-serif text-3xl font-black leading-tight text-brand-primary sm:text-4xl">
          赛博看相
        </h1>
        <p className="mt-3 text-base leading-relaxed text-[#edeade]">
          上传图片或输入生辰，由 AI 生成传统相术与命理解析。
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {["图片推演", "本地排盘", "流式解读", "文化娱乐参考"].map((item) => (
            <span
              key={item}
              className="rounded-full bg-[#edeade]/5 px-3 py-1.5 text-sm font-medium text-[#f7f4ee]"
            >
              {item}
            </span>
          ))}
        </div>
      </header>

      <section className="mx-auto mt-8 max-w-6xl rounded-2xl border border-[#edeade]/10 bg-[#2e261f]/70 p-4 shadow-[0_24px_80px_-56px_rgba(0,0,0,1)] backdrop-blur-sm sm:p-6">
        <div className="mb-5 flex flex-col justify-between gap-3 border-b border-[#edeade]/10 pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-brand-primary/75">
              AI Divination Tools
            </p>
            <h2 className="mt-2 font-serif text-2xl font-bold text-[#f7f4ee]">
              选择一个工具开始
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-[#a3988f]">
            图像类生成结果图；八字与起名使用流式文本输出。
          </p>
        </div>
        <div className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ALL_TYPES.map((t) => (
            <HomeCard key={t} type={t} />
          ))}
          {EXTRA_FEATURES.map((m) => (
            <HomeCard key={m.href} meta={m} />
          ))}
        </div>
      </section>

      <footer className="mt-16 text-center text-xs text-[#a3988f]/60">
        <p>本站仅供文化娱乐参考，所有结果由 AI 生成，请勿据此作出重大人生决策。</p>
        <a
          href="https://github.com/dming519/cyber-kanxiang"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub 项目地址"
          className="mx-auto mt-3 grid size-9 place-items-center rounded-full border border-[#edeade]/10 bg-[#edeade]/5 text-[#a3988f] transition hover:border-brand-primary/45 hover:bg-brand-light hover:text-brand-primary"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.58 2 12.24c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.99c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.12 10.12 0 0 0 22 12.24C22 6.58 17.52 2 12 2Z" />
          </svg>
        </a>
      </footer>
    </main>
  );
}
