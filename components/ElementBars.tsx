"use client";

import type { BaziChart } from "@/lib/bazi";

const ELEMENT_META = [
  { key: "木", color: "#22c55e", label: "木" },
  { key: "火", color: "#ef4444", label: "火" },
  { key: "土", color: "#eab308", label: "土" },
  { key: "金", color: "#e5e7eb", label: "金" },
  { key: "水", color: "#38bdf8", label: "水" },
] as const;

interface Props {
  chart: BaziChart;
}

export function ElementBars({ chart }: Props) {
  const counts = chart.elementCounts;
  const max = Math.max(1, ...Object.values(counts));

  return (
    <div className="rounded-xl border border-[#edeade]/10 bg-[#201913]/45 p-5 backdrop-blur-sm">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-serif text-lg tracking-wider text-[#f7f4ee]">五行能量</h3>
        <span className="text-[11px] uppercase tracking-[0.3em] text-brand-primary/70">
          Five Elements
        </span>
      </div>
      <div className="space-y-2">
        {ELEMENT_META.map((e) => {
          const v = counts[e.key];
          const w = `${(v / max) * 100}%`;
          return (
            <div key={e.key} className="flex items-center gap-3">
              <span
                className="w-6 text-center font-serif text-base"
                style={{ color: e.color }}
              >
                {e.label}
              </span>
              <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-[#edeade]/5">
                <span
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                  style={{
                    width: w,
                    background: `linear-gradient(90deg, ${e.color}aa 0%, ${e.color} 100%)`,
                    boxShadow: `0 0 10px ${e.color}55`,
                  }}
                />
              </div>
              <span className="w-6 text-right font-mono text-xs text-[#a3988f]">
                {v}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-[#a3988f]/75">
        计数为「天干 + 地支主气」粗略统计，仅用于直观感受。专业旺衰判断需结合月令、刑冲合害与流派理论，由 LLM 在解读中给出。
      </p>
    </div>
  );
}
