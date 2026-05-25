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
          ? "cursor-not-allowed border-[#edeade]/10 bg-[#3d3229]/30"
          : hover
            ? "border-brand-primary bg-brand-light shadow-[0_0_40px_-12px_rgba(204,144,92,0.55)]"
            : "border-[#edeade]/15 bg-[#2e261f]/60 hover:border-brand-primary/60 hover:bg-[#3d3229]/60"
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
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-[#edeade]/15 to-transparent animate-scan-line" />
          <span className="absolute bottom-3 right-3 rounded bg-[#201913]/75 px-2 py-1 text-xs text-[#edeade] backdrop-blur-sm">
            点击或拖拽更换
          </span>
        </>
      ) : (
        <div className="text-center">
          <div className="mb-3 select-none text-5xl text-brand-primary/75">⬆</div>
          <p className="font-serif text-lg text-[#edeade]">
            点击 / 拖拽上传图片
          </p>
          <p className="mt-1 text-xs text-[#a3988f]">
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
