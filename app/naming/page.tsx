"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
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
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-emerald-300/80">
          Naming · 起名补益
        </p>
        <h1 className="mt-2 flex items-baseline gap-3 font-serif text-4xl font-black text-glow-cyan sm:text-5xl">
          起名
          <span className="text-2xl text-emerald-300/80 sm:text-3xl">☴</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-400">
          按八字喜用神补益取名，结合字义、音律、典故与避忌。
        </p>
      </header>

      {!submitted && (
        <section className="rounded-2xl border border-emerald-400/30 bg-black/30 p-6 backdrop-blur-sm">
          <NamingForm busy={busy} onSubmit={handleSubmit} initial={initial} />
        </section>
      )}

      {submitted && (
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
                className="rounded-xl border border-emerald-400/50 bg-emerald-400/10 px-6 py-3 font-serif tracking-widest text-emerald-300 transition hover:bg-emerald-400/20"
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
                className="rounded-xl border border-purple-500/50 bg-purple-500/10 px-6 py-3 font-serif tracking-widest text-neon-purple transition hover:bg-purple-500/20"
              >
                复制结果
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

export default function NamingPage() {
  return (
    <Suspense fallback={<main className="px-5 py-12 text-gray-400">加载中…</main>}>
      <NamingInner />
    </Suspense>
  );
}
