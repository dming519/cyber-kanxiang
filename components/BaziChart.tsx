"use client";

import type { BaziChart } from "@/lib/bazi";

const ELEMENT_COLOR: Record<string, string> = {
  木: "text-[#7dd3a7]",
  火: "text-[#fca5a5]",
  土: "text-brand-primary",
  金: "text-[#edeade]",
  水: "text-[#93c5fd]",
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
    <div className="rounded-xl border border-[#edeade]/10 bg-[#201913]/45 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-xl tracking-wider text-[#f7f4ee]">四柱八字</h3>
        <span className="text-[11px] uppercase tracking-[0.3em] text-brand-primary/70">
          Four Pillars
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-center font-serif text-sm">
          <thead>
            <tr className="text-xs text-brand-primary/70">
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
                    className={`border border-[#edeade]/10 px-2 py-2 ${
                      ELEMENT_COLOR[p.wuxing] ?? ""
                    } ${isDayMaster ? "font-black text-2xl text-glow-cyan" : "text-xl"}`}
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
                    className={`border border-[#edeade]/10 px-2 py-2 text-xl ${
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
                    className={`border border-[#edeade]/10 px-2 py-2 text-sm ${
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
                  className="border border-[#edeade]/10 px-2 py-2 text-xs text-[#c9c0b6]"
                >
                  {chart.pillars[k].nayin}
                </td>
              ))}
            </Row>
            <Row label="十神">
              {cols.map(([, k]) => (
                <td
                  key={`ss-${k}`}
                  className="border border-[#edeade]/10 px-2 py-2 text-xs text-[#edeade]"
                >
                  {k === "day" ? "日主" : chart.pillars[k].shiShenGan}
                </td>
              ))}
            </Row>
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid gap-2 text-xs text-[#a3988f] sm:grid-cols-2">
        <p>
          <span className="text-brand-primary">公历：</span>
          {chart.solarText}
        </p>
        <p>
          <span className="text-brand-primary">农历：</span>
          {chart.lunarText}
        </p>
        <p>
          <span className="text-brand-primary">日主：</span>
          <span className={`font-serif text-base ${ELEMENT_COLOR[chart.dayMasterWuxing] ?? ""}`}>
            {chart.dayMaster}（{chart.dayMasterWuxing}）
          </span>
        </p>
        <p>
          <span className="text-brand-primary">起运：</span>
          约 {chart.startAge.years} 年 {chart.startAge.months} 月 {chart.startAge.days} 日后
        </p>
      </div>

      {chart.daYun.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-brand-primary/70">
            大运（前八步）
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {chart.daYun.map((d, i) => (
              <span
                key={i}
                className="rounded-md border border-[#edeade]/10 bg-[#edeade]/5 px-2 py-1 font-serif text-[#edeade]"
              >
                <span className="text-brand-primary">{d.ganZhi}</span>
                <span className="ml-2 text-[#a3988f]">
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
        className="border border-[#edeade]/10 px-2 py-1 text-left text-[11px] uppercase tracking-[0.2em] text-brand-primary/60"
      >
        {label}
      </th>
      {children}
    </tr>
  );
}
