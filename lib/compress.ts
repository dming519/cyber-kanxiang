"use client";

import imageCompression from "browser-image-compression";

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("仅支持图片文件");
  }
  if (file.size <= 1.8 * 1024 * 1024) return file;

  const compressed = await imageCompression(file, {
    maxSizeMB: 1.8,
    maxWidthOrHeight: 2048,
    useWebWorker: true,
    fileType: "image/jpeg",
    initialQuality: 0.86,
  });

  return new File([compressed], replaceExt(file.name, "jpg"), {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

function replaceExt(name: string, ext: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? `${name.slice(0, i)}.${ext}` : `${name}.${ext}`;
}
