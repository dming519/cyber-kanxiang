"use client";

import { type DivineType, KIND_META } from "@/lib/prompts";

interface Props {
  type: DivineType;
  image: string;
  onReset: () => void;
}

export function ResultView({ type, image, onReset }: Props) {
  const meta = KIND_META[type];
  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl border border-cinnabar/40 bg-amber-50/5 shadow-[0_0_60px_-10px_rgba(220,38,38,0.35)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={`${meta.title}结果`} className="block w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={image}
          download={`cyber-kanxiang-${type}-${Date.now()}.png`}
          className="rounded-xl border border-neon-cyan/50 bg-cyan-400/10 px-6 py-3 text-center font-serif tracking-widest text-neon-cyan transition hover:bg-cyan-400/20"
        >
          下载结果图 ⬇
        </a>
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-purple-500/50 bg-purple-500/10 px-6 py-3 font-serif tracking-widest text-neon-purple transition hover:bg-purple-500/20"
        >
          重新推演
        </button>
      </div>
      <p className="text-center text-xs leading-relaxed text-gray-500">
        本图为 AI 生成，所有解读基于民俗文化与传统典籍，仅供文化娱乐参考，请勿据此作出重大决策。
      </p>
    </div>
  );
}
