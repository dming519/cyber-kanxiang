"use client";

import { useCallback, useRef, useState } from "react";

interface Props {
  onFile: (file: File) => void;
  preview?: string | null;
  disabled?: boolean;
}

export function UploadZone({ onFile, preview, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const f = files[0];
      if (!f.type.startsWith("image/")) {
        alert("请选择图片文件");
        return;
      }
      onFile(f);
    },
    [onFile],
  );

  return (
    <div
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
      }}
      className={`relative flex aspect-[4/3] w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
        disabled
          ? "cursor-not-allowed border-gray-700 bg-gray-800/20"
          : hover
            ? "border-neon-cyan bg-cyan-400/10 shadow-[0_0_40px_-5px_rgba(34,211,238,0.6)]"
            : "border-purple-500/40 bg-purple-500/[.04] hover:border-neon-purple hover:bg-purple-500/[.10]"
      }`}
    >
      {preview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="预览"
            className="absolute inset-0 size-full object-contain"
          />
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-cyan-300/15 to-transparent animate-scan-line" />
          <span className="absolute bottom-3 right-3 rounded bg-black/55 px-2 py-1 text-xs text-cyan-200 backdrop-blur-sm">
            点击或拖拽更换
          </span>
        </>
      ) : (
        <div className="text-center">
          <div className="mb-3 select-none text-5xl text-purple-300/70">⬆</div>
          <p className="font-serif text-lg text-gray-200">
            点击 / 拖拽上传图片
          </p>
          <p className="mt-1 text-xs text-gray-500">
            支持 JPG / PNG · 自动压缩至 ≤2MB
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />
    </div>
  );
}
