"use client";

import { useState } from "react";
import { type DivineType, KIND_META } from "@/lib/prompts";

interface Props {
  type: DivineType;
  image: string;
  onReset: () => void;
}

export function ResultView({ type, image, onReset }: Props) {
  const meta = KIND_META[type];
  const [renderError, setRenderError] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-xl border border-brand-primary/35 bg-[#2e261f]/70 shadow-[0_0_50px_-18px_rgba(204,144,92,0.35)]">
        {renderError ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="font-serif text-lg text-[#fca5a5]">⚠ 图片渲染失败</p>
            <p className="text-xs text-[#a3988f]">
              结果已生成，但当前浏览器未能渲染。点击下方按钮直接下载查看。
            </p>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={`${meta.title}结果`}
            className="block w-full"
            onError={() => setRenderError(true)}
          />
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={image}
          download={`cyber-kanxiang-${type}-${Date.now()}.png`}
          className="rounded-full border border-brand-primary/50 bg-brand-light px-6 py-3 text-center font-serif tracking-widest text-brand-primary transition hover:border-brand-primary hover:bg-brand-primary/20"
        >
          下载结果图 ⬇
        </a>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-[#edeade]/15 bg-[#edeade]/5 px-6 py-3 font-serif tracking-widest text-[#edeade] transition hover:border-brand-primary/50 hover:text-brand-primary"
        >
          重新推演
        </button>
      </div>
      <p className="text-center text-xs leading-relaxed text-[#a3988f]/70">
        本图为 AI 生成，所有解读基于民俗文化与传统典籍，仅供文化娱乐参考，请勿据此作出重大决策。
      </p>
    </div>
  );
}
