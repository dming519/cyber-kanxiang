"use client";

import { useEffect, useState } from "react";

const STAGES = [
  { until: 15_000, text: "凝神运气，掌定乾坤……" },
  { until: 40_000, text: "推演吉凶，参详气数……" },
  { until: 90_000, text: "朱笔落点，结论将出……" },
  { until: Infinity, text: "天机将启，敬请稍候……" },
];

export function LoadingOverlay({ open }: { open: boolean }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!open) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const t = setInterval(() => setElapsed(Date.now() - start), 200);
    return () => clearInterval(t);
  }, [open]);

  if (!open) return null;

  const stage = STAGES.find((s) => elapsed < s.until) ?? STAGES[STAGES.length - 1];
  const seconds = Math.floor(elapsed / 1000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#201913]/90 backdrop-blur-md">
      <div className="flex flex-col items-center gap-8 px-6 text-center">
        <Taiji />
        <div>
          <p className="font-serif text-2xl text-[#f7f4ee]">{stage.text}</p>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.4em] text-brand-primary/60">
            elapsed {seconds}s · AI generating
          </p>
        </div>
        <div className="h-1 w-72 overflow-hidden rounded-full bg-[#edeade]/10">
          <div className="h-full w-1/3 animate-scan-line bg-gradient-to-r from-transparent via-brand-primary to-transparent" />
        </div>
        <p className="max-w-md text-xs leading-relaxed text-[#a3988f]">
          通常需要 30-90 秒。请保持页面打开，断线则需重新提交。
        </p>
      </div>
    </div>
  );
}

function Taiji() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="size-32 animate-spin-taiji drop-shadow-[0_0_20px_rgba(204,144,92,0.25)]"
    >
      <defs>
        <clipPath id="left">
          <path d="M50,0 A50,50 0 0,0 50,100 A25,25 0 0,1 50,50 A25,25 0 0,0 50,0 Z" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="48" fill="#201913" stroke="#cc905c" strokeWidth="1.5" />
      <path
        d="M50,2 A48,48 0 0,1 50,98 A24,24 0 0,1 50,50 A24,24 0 0,0 50,2 Z"
        fill="#cc905c"
      />
      <circle cx="50" cy="26" r="6" fill="#201913" />
      <circle cx="50" cy="74" r="6" fill="#cc905c" />
    </svg>
  );
}
