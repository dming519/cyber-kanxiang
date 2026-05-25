"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { NamingForm, type NamingFormValue } from "@/components/NamingForm";
import { BaziChartView } from "@/components/BaziChart";
import { StreamingText } from "@/components/StreamingText";
import { streamNaming } from "@/lib/baziApi";
import type { BaziChart } from "@/lib/bazi";

function NamingInner() {
  const sp = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [chart, setChart] = useState<BaziChart | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fromBazi = sp.get("from") === "bazi";
  const initial = fromBazi
    ? {
        gender: (sp.get("gender") as NamingFormValue["gender"]) ?? "male",
        calendar: (sp.get("calendar") as NamingFormValue["calendar"]) ?? "solar",
        birthDate: sp.get("birthDate") ?? "",
        birthTime: sp.get("birthTime") ?? "08:00",
        leapMonth: sp.get("leapMonth") === "true",
        hasBirth: true,
      }
    : undefined;

  const handleSubmit = useCallback((v: NamingFormValue) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setBusy(true);
    setChart(null);
    setText("");
    setError(null);
    setSubmitted(true);

    streamNaming(
      {
        gender: v.gender,
        surname: v.surname,
        ...(v.hasBirth
          ? {
              calendar: v.calendar,
              birthDate: v.birthDate,
              birthTime: v.birthTime,
              leapMonth: v.leapMonth,
            }
          : {}),
        preferences: v.preferences || undefined,
      },
      {
        onChart: (c) => setChart(c),
        onDelta: (t) => setText((prev) => prev + t),
        onDone: () => setBusy(false),
        onError: (msg) => {
          setError(msg);
          setBusy(false);
        },
      },
      ac.signal,
    );
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
      <header className="mx-auto mb-8 max-w-3xl text-center">
        <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl border border-brand-primary/35 bg-brand-light font-serif text-3xl text-brand-primary">
          ☴
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-brand-primary/80">
          Naming · 起名补益
        </p>
        <h1 className="mt-3 font-serif text-4xl font-black text-brand-primary sm:text-5xl">
          起名
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#edeade] sm:text-base">
          按八字喜用神补益取名，结合字义、音律、典故与避忌。
        </p>
      </header>

      {!submitted && (
        <section className="mx-auto max-w-4xl rounded-2xl border border-[#edeade]/10 bg-[#2e261f]/75 p-4 shadow-[0_24px_80px_-56px_rgba(0,0,0,1)] backdrop-blur-sm sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 border-b border-[#edeade]/10 pb-5 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#f7f4ee]">
                输入取名条件
              </h2>
              <p className="mt-1 text-sm text-[#a3988f]">
                可从八字页带入出生信息，也可单独按偏好取名。
              </p>
            </div>
            <span className="rounded-full bg-[#edeade]/5 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.24em] text-brand-primary">
              Bazi Naming
            </span>
          </div>
          <NamingForm busy={busy} onSubmit={handleSubmit} initial={initial} />
        </section>
      )}

      {submitted && (
        <section className="mx-auto max-w-5xl rounded-2xl border border-[#edeade]/10 bg-[#2e261f]/75 p-4 shadow-[0_24px_80px_-56px_rgba(0,0,0,1)] backdrop-blur-sm sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 border-b border-[#edeade]/10 pb-5 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#f7f4ee]">
                取名结果
              </h2>
              <p className="mt-1 text-sm text-[#a3988f]">
                八字信息与候选名建议会在下方同步输出。
              </p>
            </div>
            <span className="rounded-full bg-[#edeade]/5 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.24em] text-brand-primary">
              Streaming
            </span>
          </div>
          <div className="space-y-6">
          {chart && <BaziChartView chart={chart} />}
          <StreamingText text={text} busy={busy} />

          {!busy && (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setChart(null);
                  setText("");
                  setError(null);
                }}
                className="rounded-full border border-brand-primary/50 bg-brand-light px-6 py-3 font-serif tracking-widest text-brand-primary transition hover:border-brand-primary hover:bg-brand-primary/20"
              >
                重新起名
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(text);
                  } catch {
                    /* ignore */
                  }
                }}
                className="rounded-full border border-[#edeade]/15 bg-[#edeade]/5 px-6 py-3 font-serif tracking-widest text-[#edeade] transition hover:border-brand-primary/50 hover:text-brand-primary"
              >
                复制结果
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

export default function NamingPage() {
  return (
    <Suspense fallback={<main className="px-5 py-12 text-[#a3988f]">加载中…</main>}>
      <NamingInner />
    </Suspense>
  );
}
