"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BaziForm, type BaziFormValue } from "@/components/BaziForm";
import { BaziChartView } from "@/components/BaziChart";
import { ElementBars } from "@/components/ElementBars";
import { StreamingText } from "@/components/StreamingText";
import { streamBazi } from "@/lib/baziApi";
import type { BaziChart } from "@/lib/bazi";

export default function BaziPage() {
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [chart, setChart] = useState<BaziChart | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState<BaziFormValue | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleSubmit = useCallback((v: BaziFormValue) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setBusy(true);
    setChart(null);
    setText("");
    setError(null);
    setInput(v);

    streamBazi(v, {
      onChart: (c) => setChart(c),
      onDelta: (t) => setText((prev) => prev + t),
      onDone: () => setBusy(false),
      onError: (msg) => {
        setError(msg);
        setBusy(false);
      },
    }, ac.signal);
  }, []);

  const goNaming = () => {
    if (!input || !chart) return;
    const params = new URLSearchParams({
      gender: input.gender,
      calendar: input.calendar,
      birthDate: input.birthDate,
      birthTime: input.birthTime,
      leapMonth: String(input.leapMonth),
      from: "bazi",
    });
    router.push(`/naming?${params.toString()}`);
  };

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
      <nav className="mb-6">
        <Link
          href="/"
          className="text-sm text-purple-300/80 transition hover:text-neon-cyan"
        >
          ← 回到入口
        </Link>
      </nav>

      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-amber-300/80">
          Bazi · 四柱八字
        </p>
        <h1 className="mt-2 flex items-baseline gap-3 font-serif text-4xl font-black text-glow-purple sm:text-5xl">
          看八字
          <span className="text-2xl text-amber-300/80 sm:text-3xl">☷</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-400">
          公历 / 农历皆可输入，本地精确排盘 + AI 命理流式解读。
        </p>
      </header>

      {!chart && (
        <section className="rounded-2xl border border-purple-500/30 bg-black/30 p-6 backdrop-blur-sm">
          <BaziForm busy={busy} onSubmit={handleSubmit} />
        </section>
      )}

      {chart && (
        <div className="space-y-6">
          <BaziChartView chart={chart} />
          <ElementBars chart={chart} />
          <StreamingText text={text} busy={busy} />

          {!busy && !error && text && (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={goNaming}
                className="rounded-xl border border-emerald-400/50 bg-emerald-400/10 px-6 py-3 font-serif tracking-widest text-emerald-300 transition hover:bg-emerald-400/20"
              >
                根据此八字起名 →
              </button>
              <button
                type="button"
                onClick={() => {
                  setChart(null);
                  setText("");
                  setError(null);
                }}
                className="rounded-xl border border-purple-500/50 bg-purple-500/10 px-6 py-3 font-serif tracking-widest text-neon-purple transition hover:bg-purple-500/20"
              >
                重新排盘
              </button>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              ⚠ {error}
            </p>
          )}
        </div>
      )}
    </main>
  );
}
