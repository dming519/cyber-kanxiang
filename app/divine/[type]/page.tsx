"use client";

import { useEffect, useMemo, useState } from "react";
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

  // 结果是 blob URL,组件卸载或重置时 revoke 释放内存
  useEffect(() => {
    if (!result) return;
    return () => {
      if (result.startsWith("blob:")) URL.revokeObjectURL(result);
    };
  }, [result]);

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
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
      <header className="mx-auto mb-8 max-w-xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-brand-primary/80">
          {meta.subtitle}
        </p>
        <h1 className="mt-3 font-serif text-4xl font-black text-brand-primary sm:text-5xl">
          {meta.title}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-[#edeade] sm:text-base">
          {meta.tagline}
        </p>
      </header>

      {!result && (
        <section className="mx-auto max-w-4xl rounded-2xl border border-[#edeade]/10 bg-[#2e261f]/75 p-4 shadow-[0_24px_80px_-56px_rgba(0,0,0,1)] backdrop-blur-sm sm:p-6">
          <div className="mb-5 flex flex-col justify-between gap-3 border-b border-[#edeade]/10 pb-5 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-serif text-2xl font-bold text-[#f7f4ee]">
                上传参考图片
              </h2>
              <p className="mt-1 text-sm text-[#a3988f]">
                图片会自动压缩，生成完成后直接展示结果图。
              </p>
            </div>
          </div>
          <div className="space-y-6">
          <UploadZone
            onFile={handlePick}
            preview={previewUrl}
            disabled={loading}
          />
          {file && (
            <p className="text-right font-mono text-xs text-[#a3988f]/70">
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
            <p className="rounded-lg border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-3 text-sm text-[#fca5a5]">
              ⚠ {error}
            </p>
          )}
          <p className="text-center text-xs leading-relaxed text-[#a3988f]/70">
            服务端生成结果，单次推演通常需 30-90 秒。
            <br />
            上传图片仅用于本次生成，不留存于服务器。
          </p>
          </div>
        </section>
      )}

      {result && (
        <section className="mx-auto max-w-4xl rounded-2xl border border-[#edeade]/10 bg-[#2e261f]/75 p-4 shadow-[0_24px_80px_-56px_rgba(0,0,0,1)] backdrop-blur-sm sm:p-6">
          <ResultView type={type} image={result} onReset={reset} />
        </section>
      )}

      <LoadingOverlay open={loading} />
    </main>
  );
}
