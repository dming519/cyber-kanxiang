"use client";

import { useState } from "react";

export interface BaziFormValue {
  gender: "male" | "female" | "unknown";
  calendar: "solar" | "lunar";
  birthDate: string;
  birthTime: string;
  leapMonth: boolean;
}

interface Props {
  initial?: Partial<BaziFormValue>;
  busy?: boolean;
  onSubmit: (v: BaziFormValue) => void;
  submitLabel?: string;
}

const todayIso = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 25);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

export function BaziForm({ initial, busy, onSubmit, submitLabel }: Props) {
  const [gender, setGender] = useState<BaziFormValue["gender"]>(
    initial?.gender ?? "male",
  );
  const [calendar, setCalendar] = useState<BaziFormValue["calendar"]>(
    initial?.calendar ?? "solar",
  );
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? todayIso());
  const [birthTime, setBirthTime] = useState(initial?.birthTime ?? "08:00");
  const [leapMonth, setLeapMonth] = useState(initial?.leapMonth ?? false);

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (busy) return;
        onSubmit({ gender, calendar, birthDate, birthTime, leapMonth });
      }}
    >
      <FieldLabel text="性别">
        <SegmentedControl
          value={gender}
          onChange={(v) => setGender(v as BaziFormValue["gender"])}
          options={[
            { value: "male", label: "♂ 男" },
            { value: "female", label: "♀ 女" },
            { value: "unknown", label: "不限" },
          ]}
        />
      </FieldLabel>

      <FieldLabel text="历法">
        <SegmentedControl
          value={calendar}
          onChange={(v) => {
            setCalendar(v as BaziFormValue["calendar"]);
            if (v !== "lunar") setLeapMonth(false);
          }}
          options={[
            { value: "solar", label: "公历" },
            { value: "lunar", label: "农历" },
          ]}
        />
      </FieldLabel>

      <div className="grid gap-4 sm:grid-cols-2">
        <FieldLabel text={calendar === "solar" ? "公历日期" : "农历日期 (年-月-日)"}>
          <input
            type={calendar === "solar" ? "date" : "text"}
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            placeholder="YYYY-MM-DD"
            className="w-full rounded-lg border border-purple-500/40 bg-black/30 px-3 py-2 font-mono text-sm text-gray-100 outline-none transition focus:border-neon-cyan"
          />
        </FieldLabel>
        <FieldLabel text="出生时刻">
          <input
            type="time"
            required
            value={birthTime}
            onChange={(e) => setBirthTime(e.target.value)}
            className="w-full rounded-lg border border-purple-500/40 bg-black/30 px-3 py-2 font-mono text-sm text-gray-100 outline-none transition focus:border-neon-cyan"
          />
        </FieldLabel>
      </div>

      {calendar === "lunar" && (
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input
            type="checkbox"
            checked={leapMonth}
            onChange={(e) => setLeapMonth(e.target.checked)}
            className="size-4 accent-fuchsia-500"
          />
          本月为闰月
        </label>
      )}

      <button
        type="submit"
        disabled={busy}
        className={`mt-2 rounded-xl px-8 py-3 font-serif text-lg tracking-[0.3em] transition ${
          busy
            ? "cursor-not-allowed bg-gray-700/40 text-gray-500"
            : "animate-neon-pulse bg-gradient-to-r from-amber-400 via-fuchsia-500 to-purple-600 text-white hover:scale-[1.01] active:scale-95"
        }`}
      >
        {busy ? "推演中…" : submitLabel ?? "开始排盘 · 朱笔落点"}
      </button>
    </form>
  );
}

function FieldLabel({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-purple-300/80">
      <span>{text}</span>
      {children}
    </label>
  );
}

interface SegOption {
  value: string;
  label: string;
}
function SegmentedControl({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SegOption[];
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const on = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-lg border px-3 py-2 text-sm font-serif transition ${
              on
                ? "border-neon-cyan bg-cyan-400/15 text-neon-cyan shadow-[0_0_18px_-4px_rgba(34,211,238,0.55)]"
                : "border-purple-500/30 bg-black/20 text-gray-400 hover:border-purple-400/60 hover:text-gray-200"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
