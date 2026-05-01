import { HomeCard } from "@/components/HomeCard";
import { ALL_TYPES } from "@/lib/prompts";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16 sm:py-24">
      <header className="mb-16 text-center">
        <p className="mb-4 font-mono text-xs uppercase tracking-[0.6em] text-neon-cyan/80">
          CYBER × DIVINATION
        </p>
        <h1 className="font-serif text-5xl font-black leading-tight text-glow-purple sm:text-7xl">
          赛博<span className="mx-2 text-neon-cyan text-glow-cyan">看</span>相
        </h1>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base">
          于霓虹与卦象之间，由 AI 接续千年掌纹与面相的笔法。
          上传一张图片，朱笔自落点。
        </p>
        <div className="mt-6 flex justify-center gap-3 font-serif text-2xl text-cinnabar/40">
          <span>☰</span><span>☱</span><span>☲</span><span>☳</span>
          <span>☴</span><span>☵</span><span>☶</span><span>☷</span>
        </div>
      </header>

      <section className="grid w-full gap-6 sm:grid-cols-3">
        {ALL_TYPES.map((t) => (
          <HomeCard key={t} type={t} />
        ))}
      </section>

      <footer className="mt-24 text-center text-xs text-gray-600">
        <p>本站仅供文化娱乐参考，所有结果由 AI 生成，请勿据此作出重大人生决策。</p>
        <p className="mt-2 font-mono tracking-widest opacity-70">
          powered by gpt-image-2 · cloudflare workers
        </p>
      </footer>
    </main>
  );
}
