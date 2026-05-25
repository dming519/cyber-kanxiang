"use client";

import { useCallback, useRef, useState } from "react";
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
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
      <header className="mx-auto mb-8 max-w-3xl text-center">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl border border-brand-primary/35 bg-brand-light font-serif text-3xl text-brand-primary">
          ☷
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-brand-primary/80">
          Bazi · 四柱八字
        </p>
        <h1 className="mt-3 font-serif text-4xl font-black text-brand-primary sm:text-5xl">
          看八字
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#edeade] sm:text-base">
          公历 / 农历皆可输入，本地精确排盘 + AI 命理流式解读。
        </p>
      </header>

      {!chart && (
        <section className="mx-auto max-w-4xl rounded-2xl border border-[#edeade]/10 bg-[#2e261f]/75 p-4 shadow-[0_24px_80px_-56px_rgba(0,0,0,1)] backdrop-blur-sm sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 border-b border-[#edeade]/10 pb-5 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#f7f4ee]">
                输入出生信息
              </h2>
              <p className="mt-1 text-sm text-[#a3988f]">
                前端本地排盘，提交后流式生成命理解读。
              </p>
            </div>
            <span className="rounded-full bg-[#edeade]/5 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.24em] text-brand-primary">
              Local Chart
            </span>
          </div>
          <BaziForm busy={busy} onSubmit={handleSubmit} />
        </section>
      )}

      {chart && (
        <section className="mx-auto max-w-5xl rounded-2xl border border-[#edeade]/10 bg-[#2e261f]/75 p-4 shadow-[0_24px_80px_-56px_rgba(0,0,0,1)] backdrop-blur-sm sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 border-b border-[#edeade]/10 pb-5 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#f7f4ee]">
                排盘与解读
              </h2>
              <p className="mt-1 text-sm text-[#a3988f]">
                四柱、五行统计与 AI 解读会在下方同步更新。
              </p>
            </div>
            <span className="rounded-full bg-[#edeade]/5 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.24em] text-brand-primary">
              Streaming
            </span>
          </div>
          <div className="space-y-6">
          <BaziChartView chart={chart} />
          <ElementBars chart={chart} />
          <StreamingText text={text} busy={busy} />

          {!busy && !error && text && (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={goNaming}
                className="rounded-full border border-[#059669]/50 bg-[#059669]/10 px-6 py-3 font-serif tracking-widest text-[#7dd3a7] transition hover:bg-[#059669]/20"
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
                className="rounded-full border border-brand-primary/50 bg-brand-light px-6 py-3 font-serif tracking-widest text-brand-primary transition hover:border-brand-primary hover:bg-brand-primary/20"
              >
                重新排盘
              </button>
            </div>
          )}

          {error && (
            <p className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#fca5a5]">
              ⚠ {error}
            </p>
          )}
          </div>
        </section>
      )}
    </main>
  );
}
