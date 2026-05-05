import type { BaziChart, Gender } from "./bazi";

export interface NamingExtra {
  surname: string;
  preferences?: string;
  baziContext?: BaziChart;
}

const GENDER_LABEL: Record<Gender, string> = {
  male: "男",
  female: "女",
  unknown: "未填",
};

function chartSummary(c: BaziChart): string {
  const counts = c.elementCounts;
  const elementLine = (Object.keys(counts) as Array<keyof typeof counts>)
    .map((k) => `${k}${counts[k]}`)
    .join(" · ");

  const daYun = c.daYun
    .map(
      (d) =>
        `[${d.startAge}-${d.endAge}岁/${d.startYear}-${d.endYear}年] ${d.ganZhi}`,
    )
    .join("，");

  return [
    `公历：${c.solarText}`,
    `农历：${c.lunarText}`,
    `性别：${GENDER_LABEL[c.input.gender]}`,
    "",
    "【四柱八字】",
    `年柱：${c.pillars.year.pillar}（${c.pillars.year.wuxing}・${c.pillars.year.nayin}）藏干 ${c.pillars.year.hideGan.join("/")} 主气十神 ${c.pillars.year.shiShenGan}`,
    `月柱：${c.pillars.month.pillar}（${c.pillars.month.wuxing}・${c.pillars.month.nayin}）藏干 ${c.pillars.month.hideGan.join("/")} 主气十神 ${c.pillars.month.shiShenGan}`,
    `日柱：${c.pillars.day.pillar}（${c.pillars.day.wuxing}・${c.pillars.day.nayin}）藏干 ${c.pillars.day.hideGan.join("/")} ※日主`,
    `时柱：${c.pillars.time.pillar}（${c.pillars.time.wuxing}・${c.pillars.time.nayin}）藏干 ${c.pillars.time.hideGan.join("/")} 主气十神 ${c.pillars.time.shiShenGan}`,
    "",
    `日主：${c.dayMaster}（${c.dayMasterWuxing}）`,
    `五行计数（天干+地支主气，仅作粗略参考，需结合月令、刑冲合害判断旺衰）：${elementLine}`,
    `起运：出生后约 ${c.startAge.years} 年 ${c.startAge.months} 月 ${c.startAge.days} 日交大运`,
    `大运（前八步）：${daYun || "（无）"}`,
  ].join("\n");
}

export function buildBaziPrompt(chart: BaziChart): { system: string; user: string } {
  const system = [
    "你是一位深谙易经、子平命理与中医气血学说的资深命理顾问。",
    "你以传统八字理论（喜用神 · 旺衰格局 · 十神象意 · 大运流年）为根本，结合现实生活给予稳健、克制、有建设性的建议。",
    "回应风格：庄重、温和，避免恐吓性语言，避免赌博式预言，避免对疾病/婚姻/官非给出绝对结论。",
    "所有输出必须为中文，使用 Markdown 章节标题，不要英文。",
    "严格遵循下面的输出结构。每节正文 80-180 字。",
    "结尾加一行小字：「以上为传统命理文化解读，仅供参考，请勿据此作出重大决策」。",
  ].join("\n");

  const user = [
    "下面是已经精确排盘的命主资料，请据此撰写解读：",
    "",
    chartSummary(chart),
    "",
    "请按以下章节顺序输出 Markdown，章节标题用 `## ` 开头，注意字数控制：",
    "",
    "## 一、四柱速览",
    "用一段话点出此命的整体气象与第一观感（避免直接说吉凶）。",
    "",
    "## 二、日主与格局初判",
    "判断日主旺衰，简要给出格局倾向（正格 / 从格 / 化格 / 杂气格 等）。",
    "",
    "## 三、五行喜用神",
    "明确写出**喜神**与**忌神**的五行，并给出依据。",
    "",
    "## 四、性格底色",
    "性格优劣并陈，包含与人相处的特点。",
    "",
    "## 五、事业财运",
    "适合的行业方向、财源类型、关键年份提示。",
    "",
    "## 六、感情家庭",
    "婚恋时机、相处模式、需要注意的关系议题（措辞克制）。",
    "",
    "## 七、健康作息",
    "结合中医五行，给作息、饮食、情绪调养建议。",
    "",
    "## 八、近年运势提示",
    `结合大运、近 3-5 年流年（约 ${new Date().getFullYear()}-${new Date().getFullYear() + 5}）给关键节点提醒。`,
    "",
    "## 九、起名 / 取字方向",
    "若要根据此八字取名或改字，应该补哪个五行、避哪个五行、字义/音律倾向如何。",
  ].join("\n");

  return { system, user };
}

export function buildNamingPrompt(
  extra: NamingExtra,
): { system: string; user: string } {
  const system = [
    "你是一位精通子平命理、汉字训诂、姓名学与音韵学的资深起名顾问。",
    "你的取名原则：补益八字喜用神，避忌字尽量回避；字形大方，字义雅正，音律朗朗上口；不使用过于生僻或异体字；尊重姓氏的发音与字形。",
    "回应风格：实用、可读、不浮夸。绝不输出迷信式承诺。所有输出必须为中文 Markdown，不要英文。",
  ].join("\n");

  const baziBlock = extra.baziContext
    ? [
        "命主八字资料（已精确排盘）：",
        chartSummary(extra.baziContext),
        "",
      ].join("\n")
    : "（命主未提供八字，按通用命名学原则推荐。）";

  const user = [
    `姓氏：${extra.surname}`,
    `性别：${
      extra.baziContext
        ? GENDER_LABEL[extra.baziContext.input.gender]
        : "（未提供）"
    }`,
    extra.preferences
      ? `偏好与忌讳：${extra.preferences}`
      : "偏好与忌讳：（未填）",
    "",
    baziBlock,
    "请按以下结构输出 Markdown：",
    "",
    "## 起名总策",
    "用 80-150 字概括本次取名的核心方向（补哪个五行、避哪个五行、整体气韵）。",
    "",
    "## 候选名（共 8 个）",
    "为每个候选名生成一张小卡，固定使用以下二级标题与列表格式：",
    "",
    "### 候选 N · 姓 + 名（拼音）",
    "- **五行补益**：…",
    "- **字义**：…",
    "- **音律**：…（声调与读感）",
    "- **典故/意象**：…（出处或文化意象）",
    "- **适合原因**：…（与八字喜用神/性别气质契合点）",
    "- **避忌说明**：…（已规避的字音/字义/谐音）",
    "",
    "## 起名守则",
    "用 3-5 条要点，提醒命主选名时还应注意什么（族谱字辈 / 重名查询 / 海外发音 等）。",
    "",
    "结尾加一行小字：「以上候选名仅为文化参考，最终请结合家族意愿、户籍规则等综合决定」。",
  ].join("\n");

  return { system, user };
}

export interface NamingInputValidated {
  gender: Gender;
  surname: string;
  calendar?: "solar" | "lunar";
  birthDate?: string;
  birthTime?: string;
  leapMonth?: boolean;
  preferences?: string;
  baziContext?: BaziChart;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const SURNAME_RE = /^[一-龥]{1,4}$/;

export function validateNamingInput(raw: unknown): NamingInputValidated {
  if (!raw || typeof raw !== "object") throw new Error("请求体必须为 JSON 对象");
  const r = raw as Record<string, unknown>;

  const gender =
    r.gender === "male" || r.gender === "female" || r.gender === "unknown"
      ? (r.gender as Gender)
      : null;
  if (!gender) throw new Error("gender 必须为 male / female / unknown");

  if (typeof r.surname !== "string" || !SURNAME_RE.test(r.surname.trim())) {
    throw new Error("surname 必须为 1-4 个汉字");
  }

  const calendar =
    r.calendar === "solar" || r.calendar === "lunar"
      ? (r.calendar as "solar" | "lunar")
      : undefined;

  let birthDate: string | undefined;
  let birthTime: string | undefined;
  if (typeof r.birthDate === "string" && r.birthDate) {
    if (!DATE_RE.test(r.birthDate)) throw new Error("birthDate 必须为 YYYY-MM-DD");
    birthDate = r.birthDate;
  }
  if (typeof r.birthTime === "string" && r.birthTime) {
    if (!TIME_RE.test(r.birthTime)) throw new Error("birthTime 必须为 HH:mm");
    birthTime = r.birthTime;
  }
  if ((birthDate && !birthTime) || (birthTime && !birthDate)) {
    throw new Error("birthDate 与 birthTime 必须同时提供或同时省略");
  }
  if (birthDate && !calendar) {
    throw new Error("提供出生日期时,calendar 必填");
  }

  const preferences =
    typeof r.preferences === "string" && r.preferences.trim().length
      ? r.preferences.trim().slice(0, 200)
      : undefined;

  const leapMonth = r.leapMonth === true;
  if (leapMonth && calendar !== "lunar") {
    throw new Error("仅农历输入可使用 leapMonth");
  }

  // baziContext 只信任结构字段,不做 schema 严校
  const baziContext = (r.baziContext && typeof r.baziContext === "object")
    ? (r.baziContext as BaziChart)
    : undefined;

  return {
    gender,
    surname: (r.surname as string).trim(),
    calendar,
    birthDate,
    birthTime,
    leapMonth,
    preferences,
    baziContext,
  };
}
