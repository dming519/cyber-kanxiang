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
        <p className="mt-2 font-mono tracking-widest opacity-70">
          powered by gpt-image-2 · gpt-5.4 · cloudflare workers
        </p>
      </footer>
    </main>
  );
}
