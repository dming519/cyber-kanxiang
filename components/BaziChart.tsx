"use client";

import type { BaziChart } from "@/lib/bazi";

const ELEMENT_COLOR: Record<string, string> = {
  木: "text-emerald-400",
  火: "text-rose-400",
  土: "text-amber-400",
  金: "text-gray-100",
  水: "text-sky-400",
};

interface Props {
  chart: BaziChart;
}

export function BaziChartView({ chart }: Props) {
  const cols: Array<["年" | "月" | "日" | "时", keyof BaziChart["pillars"]]> = [
    ["年", "year"],
    ["月", "month"],
    ["日", "day"],
    ["时", "time"],
  ];

  return (
    <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-purple-950/40 via-black/50 to-fuchsia-950/30 p-5 shadow-[0_0_50px_-10px_rgba(250,204,21,0.25)] backdrop-blur-sm">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-xl text-amber-300 tracking-wider">四柱八字</h3>
        <span className="text-[11px] uppercase tracking-[0.3em] text-purple-300/70">
          Four Pillars
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center font-serif text-sm">
          <thead>
            <tr className="text-purple-300/70 text-xs">
              <th className="px-2 py-1 text-left">柱位</th>
              {cols.map(([label]) => (
                <th key={label} className="px-2 py-1">
                  {label}柱
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="天干">
              {cols.map(([, k]) => {
                const p = chart.pillars[k];
                const isDayMaster = k === "day";
                return (
                  <td
                    key={`gan-${k}`}
                    className={`border border-purple-500/20 px-2 py-2 ${
                      ELEMENT_COLOR[p.wuxing] ?? ""
                    } ${isDayMaster ? "text-glow-cyan font-black text-2xl" : "text-xl"}`}
                  >
                    {p.gan}
                  </td>
                );
              })}
            </Row>
            <Row label="地支">
              {cols.map(([, k]) => {
                const p = chart.pillars[k];
                return (
                  <td
                    key={`zhi-${k}`}
                    className={`border border-purple-500/20 px-2 py-2 text-xl ${
                      ELEMENT_COLOR[p.wuxing] ?? ""
                    }`}
                  >
                    {p.zhi}
                  </td>
                );
              })}
            </Row>
            <Row label="五行">
              {cols.map(([, k]) => {
                const p = chart.pillars[k];
                return (
                  <td
                    key={`wx-${k}`}
                    className={`border border-purple-500/20 px-2 py-2 text-sm ${
                      ELEMENT_COLOR[p.wuxing] ?? ""
                    }`}
                  >
                    {p.wuxing}
                  </td>
                );
              })}
            </Row>
            <Row label="纳音">
              {cols.map(([, k]) => (
                <td
                  key={`ny-${k}`}
                  className="border border-purple-500/20 px-2 py-2 text-xs text-gray-300"
                >
                  {chart.pillars[k].nayin}
                </td>
              ))}
            </Row>
            <Row label="十神">
              {cols.map(([, k]) => (
                <td
                  key={`ss-${k}`}
                  className="border border-purple-500/20 px-2 py-2 text-xs text-purple-200"
                >
                  {k === "day" ? "日主" : chart.pillars[k].shiShenGan}
                </td>
              ))}
            </Row>
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-gray-400 sm:grid-cols-2">
        <p>
          <span className="text-purple-300">公历：</span>
          {chart.solarText}
        </p>
        <p>
          <span className="text-purple-300">农历：</span>
          {chart.lunarText}
        </p>
        <p>
          <span className="text-purple-300">日主：</span>
          <span className={`font-serif text-base ${ELEMENT_COLOR[chart.dayMasterWuxing] ?? ""}`}>
            {chart.dayMaster}（{chart.dayMasterWuxing}）
          </span>
        </p>
        <p>
          <span className="text-purple-300">起运：</span>
          约 {chart.startAge.years} 年 {chart.startAge.months} 月 {chart.startAge.days} 日后
        </p>
      </div>

      {chart.daYun.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-purple-300/70">
            大运（前八步）
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {chart.daYun.map((d, i) => (
              <span
                key={i}
                className="rounded-md border border-purple-500/30 bg-purple-500/10 px-2 py-1 font-serif text-gray-200"
              >
                <span className="text-amber-300">{d.ganZhi}</span>
                <span className="ml-2 text-gray-400">
                  {d.startAge}-{d.endAge}岁
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr>
      <th
        scope="row"
        className="border border-purple-500/20 px-2 py-1 text-left text-[11px] uppercase tracking-[0.2em] text-purple-300/60"
      >
        {label}
      </th>
      {children}
    </tr>
  );
}
