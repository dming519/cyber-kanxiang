"use client";

import { useState } from "react";

export interface NamingFormValue {
  gender: "male" | "female" | "unknown";
  surname: string;
  calendar: "solar" | "lunar";
  birthDate: string;
  birthTime: string;
  leapMonth: boolean;
  hasBirth: boolean;
  preferences: string;
}

interface Props {
  initial?: Partial<NamingFormValue>;
  busy?: boolean;
  onSubmit: (v: NamingFormValue) => void;
}

export function NamingForm({ initial, busy, onSubmit }: Props) {
  const [gender, setGender] = useState<NamingFormValue["gender"]>(
    initial?.gender ?? "male",
  );
  const [surname, setSurname] = useState(initial?.surname ?? "");
  const [hasBirth, setHasBirth] = useState(initial?.hasBirth ?? true);
  const [calendar, setCalendar] = useState<NamingFormValue["calendar"]>(
    initial?.calendar ?? "solar",
  );
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? "");
  const [birthTime, setBirthTime] = useState(initial?.birthTime ?? "08:00");
  const [leapMonth, setLeapMonth] = useState(initial?.leapMonth ?? false);
  const [preferences, setPreferences] = useState(initial?.preferences ?? "");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (busy) return;
        if (!surname.trim()) {
          setError("请输入姓氏");
          return;
        }
        if (hasBirth && !birthDate) {
          setError("请选择出生日期或取消勾选");
          return;
        }
        setError(null);
        onSubmit({
          gender,
          surname: surname.trim(),
          calendar,
          birthDate,
          birthTime,
          leapMonth,
          hasBirth,
          preferences: preferences.trim(),
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
        <FieldLabel text="姓氏">
          <input
            type="text"
            required
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
            maxLength={4}
            placeholder="李 / 欧阳"
            className="w-full rounded-lg border border-purple-500/40 bg-black/30 px-3 py-2 font-serif text-base text-neon-cyan outline-none transition focus:border-neon-cyan"
          />
        </FieldLabel>
        <FieldLabel text="性别">
          <SegmentedControl
            value={gender}
            onChange={(v) => setGender(v as NamingFormValue["gender"])}
            options={[
              { value: "male", label: "♂ 男" },
              { value: "female", label: "♀ 女" },
              { value: "unknown", label: "不限" },
            ]}
          />
        </FieldLabel>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={hasBirth}
          onChange={(e) => setHasBirth(e.target.checked)}
          className="size-4 accent-cyan-400"
        />
        提供出生日期（建议；用于按八字喜用神补益取名）
      </label>

      {hasBirth && (
        <>
          <FieldLabel text="历法">
            <SegmentedControl
              value={calendar}
              onChange={(v) => {
                setCalendar(v as NamingFormValue["calendar"]);
                if (v !== "lunar") setLeapMonth(false);
              }}
              options={[
                { value: "solar", label: "公历" },
                { value: "lunar", label: "农历" },
              ]}
            />
          </FieldLabel>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldLabel
              text={
                calendar === "solar" ? "公历日期" : "农历日期 (年-月-日)"
              }
            >
              <input
                type={calendar === "solar" ? "date" : "text"}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                placeholder="YYYY-MM-DD"
                className="w-full rounded-lg border border-purple-500/40 bg-black/30 px-3 py-2 font-mono text-sm text-gray-100 outline-none transition focus:border-neon-cyan"
              />
            </FieldLabel>
            <FieldLabel text="出生时刻">
              <input
                type="time"
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
        </>
      )}

      <FieldLabel text="偏好与忌讳（可选）">
        <textarea
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          maxLength={200}
          rows={2}
          placeholder="例：不要生僻字 / 倾向有典故 / 避免与家族长辈重字"
          className="w-full rounded-lg border border-purple-500/40 bg-black/30 px-3 py-2 text-sm text-gray-100 outline-none transition focus:border-neon-cyan"
        />
      </FieldLabel>

      {error && (
        <p className="rounded-md border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          ⚠ {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className={`mt-1 rounded-xl px-8 py-3 font-serif text-lg tracking-[0.3em] transition ${
          busy
            ? "cursor-not-allowed bg-gray-700/40 text-gray-500"
            : "animate-neon-pulse bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-500 text-white hover:scale-[1.01] active:scale-95"
        }`}
      >
        {busy ? "起名中…" : "落笔取名 · 八字补益"}
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
