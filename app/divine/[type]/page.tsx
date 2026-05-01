"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { UploadZone } from "@/components/UploadZone";
import { DivineButton } from "@/components/DivineButton";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { ResultView } from "@/components/ResultView";
import { compressImage } from "@/lib/compress";
import { callDivine } from "@/lib/api";
import { KIND_META, isDivineType } from "@/lib/prompts";

export default function DivinePage() {
  const router = useRouter();
  const params = useParams<{ type: string }>();
  const rawType = params?.type ?? "";

  useEffect(() => {
    if (!isDivineType(rawType)) router.replace("/");
  }, [rawType, router]);

  if (!isDivineType(rawType)) return null;
  return <DivineInner type={rawType} />;
}

function DivineInner({ type }: { type: "palm" | "face" | "mole" }) {
  const meta = KIND_META[type];
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const sizeText = useMemo(() => {
    if (!file) return "";
    return `${(file.size / 1024 / 1024).toFixed(2)} MB`;
  }, [file]);

  async function handlePick(raw: File) {
    setError(null);
    setResult(null);
    try {
      const compressed = await compressImage(raw);
      setFile(compressed);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleSubmit() {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    const r = await callDivine(file, type);
    setLoading(false);
    if (r.ok) setResult(r.image);
    else setError(r.error);
  }

  function reset() {
    setResult(null);
    setError(null);
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
      <nav className="mb-6">
        <Link
          href="/"
          className="text-sm text-purple-300/80 transition hover:text-neon-cyan"
        >
          ← 回到入口
        </Link>
      </nav>

      <header className="mb-8">
        <p className="font-mono text-xs uppercase tracking-[0.4em] text-neon-cyan/80">
          {meta.subtitle}
        </p>
        <h1 className="mt-2 flex items-baseline gap-3 font-serif text-4xl font-black text-glow-purple sm:text-5xl">
          {meta.title}
          <span className="text-2xl text-cinnabar/70 sm:text-3xl">
            {meta.trigram}
          </span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-400">
          {meta.tagline}
        </p>
      </header>

      {!result && (
        <section className="space-y-6">
          <UploadZone
            onFile={handlePick}
            preview={previewUrl}
            disabled={loading}
          />
          {file && (
            <p className="text-right font-mono text-xs text-gray-500">
              {file.name} · {sizeText}
            </p>
          )}
          <DivineButton
            onClick={handleSubmit}
            disabled={!file}
            loading={loading}
          >
            朱笔落点 · 开始推演
          </DivineButton>
          {error && (
            <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              ⚠ {error}
            </p>
          )}
          <p className="text-center text-xs leading-relaxed text-gray-500">
            服务端调用 gpt-image-2，单次推演通常需 30-90 秒。
            <br />
            上传图片仅用于本次生成，不留存于服务器。
          </p>
        </section>
      )}

      {result && <ResultView type={type} image={result} onReset={reset} />}

      <LoadingOverlay open={loading} />
    </main>
  );
}
