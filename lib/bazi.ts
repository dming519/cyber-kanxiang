import { Solar, Lunar } from "lunar-typescript";

export type Gender = "male" | "female" | "unknown";
export type CalendarKind = "solar" | "lunar";

export interface BaziInput {
  gender: Gender;
  calendar: CalendarKind;
  /** YYYY-MM-DD */
  birthDate: string;
  /** HH:mm */
  birthTime: string;
  /** 仅农历有效:是否闰月 */
  leapMonth?: boolean;
}

export interface PillarInfo {
  pillar: string;       // 完整柱(干+支)
  gan: string;          // 天干
  zhi: string;          // 地支
  wuxing: string;       // 五行
  nayin: string;        // 纳音
  hideGan: string[];    // 藏干
  shiShenGan: string;   // 主气十神
  shiShenZhi: string[]; // 藏干十神
  diShi: string;        // 地势
}

export interface DaYunStep {
  startAge: number;
  endAge: number;
  startYear: number;
  endYear: number;
  ganZhi: string;
}

export type ElementKey = "木" | "火" | "土" | "金" | "水";

export interface BaziChart {
  input: BaziInput;
  solarText: string;        // 公历可读字符串
  lunarText: string;        // 农历可读字符串
  pillars: {
    year: PillarInfo;
    month: PillarInfo;
    day: PillarInfo;
    time: PillarInfo;
  };
  dayMaster: string;        // 日主天干
  dayMasterWuxing: string;  // 日主五行
  elementCounts: Record<ElementKey, number>;
  daYun: DaYunStep[];       // 大运,前 8 步
  startAge: { years: number; months: number; days: number }; // 起运信息
}

const HOUR_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDateTime(date: string, time: string): {
  y: number; m: number; d: number; hh: number; mm: number;
} {
  const dm = DATE_RE.exec(date);
  const tm = HOUR_RE.exec(time);
  if (!dm) throw new Error(`非法日期格式: ${date}`);
  if (!tm) throw new Error(`非法时间格式: ${time}`);
  return {
    y: Number(dm[1]),
    m: Number(dm[2]),
    d: Number(dm[3]),
    hh: Number(tm[1]),
    mm: Number(tm[2]),
  };
}

function buildLunar(input: BaziInput): Lunar {
  const { y, m, d, hh, mm } = parseDateTime(input.birthDate, input.birthTime);

  if (input.calendar === "solar") {
    const solar = Solar.fromYmdHms(y, m, d, hh, mm, 0);
    return solar.getLunar();
  }

  // 农历:闰月用负数月份
  const month = input.leapMonth ? -m : m;
  return Lunar.fromYmdHms(y, month, d, hh, mm, 0);
}

function genderToCode(g: Gender): number {
  // lunar-typescript: 1 = 男, 0 = 女
  return g === "female" ? 0 : 1;
}

function pillarFromEightChar(
  pillar: "Year" | "Month" | "Day" | "Time",
  ec: ReturnType<Lunar["getEightChar"]>,
): PillarInfo {
  const get = (k: string) => (ec as unknown as Record<string, () => unknown>)[k]() as never;
  return {
    pillar: get(`get${pillar}`),
    gan: get(`get${pillar}Gan`),
    zhi: get(`get${pillar}Zhi`),
    wuxing: get(`get${pillar}WuXing`),
    nayin: get(`get${pillar}NaYin`),
    hideGan: get(`get${pillar}HideGan`),
    shiShenGan: get(`get${pillar}ShiShenGan`),
    shiShenZhi: get(`get${pillar}ShiShenZhi`),
    diShi: get(`get${pillar}DiShi`),
  };
}

const GAN_TO_WUXING: Record<string, ElementKey> = {
  甲: "木", 乙: "木",
  丙: "火", 丁: "火",
  戊: "土", 己: "土",
  庚: "金", 辛: "金",
  壬: "水", 癸: "水",
};

const ZHI_TO_WUXING: Record<string, ElementKey> = {
  寅: "木", 卯: "木",
  巳: "火", 午: "火",
  辰: "土", 戌: "土", 丑: "土", 未: "土",
  申: "金", 酉: "金",
  亥: "水", 子: "水",
};

function countElements(pillars: BaziChart["pillars"]): Record<ElementKey, number> {
  const counts: Record<ElementKey, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const all = [pillars.year, pillars.month, pillars.day, pillars.time];
  for (const p of all) {
    const ge = GAN_TO_WUXING[p.gan];
    const ze = ZHI_TO_WUXING[p.zhi];
    if (ge) counts[ge] += 1;
    if (ze) counts[ze] += 1;
  }
  return counts;
}

export function calculateBazi(input: BaziInput): BaziChart {
  const lunar = buildLunar(input);
  const ec = lunar.getEightChar();
  const solar = lunar.getSolar();

  const pillars = {
    year: pillarFromEightChar("Year", ec),
    month: pillarFromEightChar("Month", ec),
    day: pillarFromEightChar("Day", ec),
    time: pillarFromEightChar("Time", ec),
  };

  const elementCounts = countElements(pillars);
  const dayMaster = pillars.day.gan;
  const dayMasterWuxing = pillars.day.wuxing;

  // 大运
  const yun = ec.getYun(genderToCode(input.gender), 2);
  const daYunRaw = yun.getDaYun(8);
  const daYun: DaYunStep[] = daYunRaw.map((d) => ({
    startAge: d.getStartAge(),
    endAge: d.getEndAge(),
    startYear: d.getStartYear(),
    endYear: d.getEndYear(),
    ganZhi: d.getGanZhi(),
  }));

  return {
    input,
    solarText: solar.toFullString(),
    lunarText: lunar.toFullString(),
    pillars,
    dayMaster,
    dayMasterWuxing,
    elementCounts,
    daYun,
    startAge: {
      years: yun.getStartYear(),
      months: yun.getStartMonth(),
      days: yun.getStartDay(),
    },
  };
}

export function validateBaziInput(raw: unknown): BaziInput {
  if (!raw || typeof raw !== "object") {
    throw new Error("请求体必须为 JSON 对象");
  }
  const r = raw as Record<string, unknown>;

  const gender =
    r.gender === "male" || r.gender === "female" || r.gender === "unknown"
      ? (r.gender as Gender)
      : null;
  if (!gender) throw new Error("gender 必须为 male / female / unknown");

  const calendar =
    r.calendar === "solar" || r.calendar === "lunar"
      ? (r.calendar as CalendarKind)
      : null;
  if (!calendar) throw new Error("calendar 必须为 solar / lunar");

  if (typeof r.birthDate !== "string" || !DATE_RE.test(r.birthDate)) {
    throw new Error("birthDate 必须为 YYYY-MM-DD");
  }
  if (typeof r.birthTime !== "string" || !HOUR_RE.test(r.birthTime)) {
    throw new Error("birthTime 必须为 HH:mm");
  }
  const leapMonth = r.leapMonth === true;
  if (leapMonth && calendar !== "lunar") {
    throw new Error("仅农历输入可使用 leapMonth");
  }

  return {
    gender,
    calendar,
    birthDate: r.birthDate,
    birthTime: r.birthTime,
    leapMonth,
  };
}
