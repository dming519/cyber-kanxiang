"use client";

import { useEffect, useMemo, useRef } from "react";

interface Props {
  text: string;
  busy: boolean;
}

/**
 * 极简 Markdown 渲染:支持
 * - ## H2  / ### H3
 * - **bold**
 * - 列表行(- / 数字.)
 * - 段落与换行
 * 不引入额外依赖。流式过程中也能正常重排。
 */
export function StreamingText({ text, busy }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 自动滚动到结尾,只在流入新增时触发
  useEffect(() => {
    if (!busy) return;
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [text, busy]);

  const blocks = useMemo(() => parseBlocks(text), [text]);

  return (
    <div
      ref={containerRef}
      className="relative max-h-[70vh] overflow-y-auto rounded-2xl border border-purple-500/30 bg-gradient-to-b from-black/40 to-purple-950/20 p-6 leading-relaxed backdrop-blur-sm"
    >
      {blocks.length === 0 && busy && (
        <p className="text-sm italic text-purple-300/70">凝神运笔…</p>
      )}
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
      {busy && (
        <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-sm bg-neon-cyan align-middle" />
      )}
    </div>
  );
}

type Block =
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "p"; text: string };

function parseBlocks(text: string): Block[] {
  const lines = text.split("\n");
  const blocks: Block[] = [];
  let paraBuf: string[] = [];
  let listBuf: string[] = [];

  const flushPara = () => {
    if (paraBuf.length) {
      blocks.push({ kind: "p", text: paraBuf.join(" ").trim() });
      paraBuf = [];
    }
  };
  const flushList = () => {
    if (listBuf.length) {
      blocks.push({ kind: "ul", items: listBuf.slice() });
      listBuf = [];
    }
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    if (line.startsWith("## ")) {
      flushPara();
      flushList();
      blocks.push({ kind: "h2", text: line.slice(3).trim() });
      continue;
    }
    if (line.startsWith("### ")) {
      flushPara();
      flushList();
      blocks.push({ kind: "h3", text: line.slice(4).trim() });
      continue;
    }
    const listMatch = /^\s*(?:[-*]|\d+\.)\s+(.+)$/.exec(line);
    if (listMatch) {
      flushPara();
      listBuf.push(listMatch[1]);
      continue;
    }
    flushList();
    paraBuf.push(line);
  }
  flushPara();
  flushList();
  return blocks;
}

function BlockView({ block }: { block: Block }) {
  if (block.kind === "h2") {
    return (
      <h2 className="mt-6 mb-3 border-l-4 border-amber-400 pl-3 font-serif text-xl tracking-wider text-amber-300 first:mt-0">
        {block.text}
      </h2>
    );
  }
  if (block.kind === "h3") {
    return (
      <h3 className="mt-5 mb-2 font-serif text-base tracking-wide text-neon-cyan">
        {block.text}
      </h3>
    );
  }
  if (block.kind === "ul") {
    return (
      <ul className="mb-4 ml-5 list-disc space-y-1 text-sm text-gray-200 marker:text-fuchsia-400">
        {block.items.map((it, i) => (
          <li key={i}>{renderInline(it)}</li>
        ))}
      </ul>
    );
  }
  return (
    <p className="mb-3 text-sm text-gray-200">{renderInline(block.text)}</p>
  );
}

// **粗体** 简单转换
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index));
    parts.push(
      <strong key={`b-${key++}`} className="text-amber-300">
        {m[1]}
      </strong>,
    );
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
