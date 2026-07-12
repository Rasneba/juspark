export interface EthiopianHoliday {
  id: string;
  nameEn: string;
  nameAm: string;
  month: number;
  day: number;
  emoji: string;
  descriptionEn: string;
  descriptionAm: string;
  recurring: true;
}

export const ETHIOPIAN_HOLIDAYS: EthiopianHoliday[] = [
  {
    id: "enkutatash",
    nameEn: "Enkutatash",
    nameAm: "ዕንቁጣጣሽ",
    month: 9,
    day: 11,
    emoji: "🌸",
    descriptionEn: "Ethiopian New Year — flowers bloom, families celebrate",
    descriptionAm: "የኢትዮጵያ አዲስ ዓመት — አበቦች ይፈфорሻሉ፣ ቤተሰቦች ይከበራሉ",
    recurring: true,
  },
  {
    id: "meskel",
    nameEn: "Meskel",
    nameAm: "መስቀል",
    month: 9,
    day: 27,
    emoji: "🔥",
    descriptionEn: "Finding of the True Cross — bonfires light up every city",
    descriptionAm: "መስቀሉን ማግኘት — በሰፊ ከተማ ላይ እሳት ይወልጣል",
    recurring: true,
  },
  {
    id: "genna",
    nameEn: "Genna (Ethiopian Christmas)",
    nameAm: "ገና",
    month: 1,
    day: 7,
    emoji: "🎄",
    descriptionEn: "Ethiopian Christmas — church services, traditional games",
    descriptionAm: "የኢትዮጵያ ገና — የቤተክርስቲያን አገልግሎት፣ ባህላዊ ጨዋታ",
    recurring: true,
  },
  {
    id: "timkat",
    nameEn: "Timkat (Epiphany)",
    nameAm: "ጥምቀት",
    month: 1,
    day: 19,
    emoji: "💧",
    descriptionEn: "Epiphany — baptism of Jesus, colorful processions with Tabot",
    descriptionAm: "ጥምቀት — የኢየሱስ ጥምቀት፣ በታቦት የሚሰጥ ቀይ ሰዓት",
    recurring: true,
  },
  {
    id: "adwa",
    nameEn: "Victory of Adwa",
    nameAm: "አድዋ",
    month: 3,
    day: 2,
    emoji: "⚔️",
    descriptionEn: "Commemorates Ethiopia's victory over Italy (1896)",
    descriptionAm: "ኢትዮጵያ በጣሊያን ላይ ያደረገችውን ድል ያሰላል (1896)",
    recurring: true,
  },
  {
    id: "fasika",
    nameEn: "Fasika (Easter)",
    nameAm: "ፋሲካ",
    month: 4,
    day: 1,
    emoji: "✝️",
    descriptionEn: "Ethiopian Easter — 55 days of fasting end, joyous celebration",
    descriptionAm: "የኢትዮጵያ ፋሲካ — 55 ቀን ጾም ያለቅሳል፣ ታላላቅ በዓል",
    recurring: true,
  },
  {
    id: "irreecha",
    nameEn: "Irreecha",
    nameAm: "እርዠራ",
    month: 10,
    day: 1,
    emoji: "🌿",
    descriptionEn: "Oromo thanksgiving festival — lakeside celebrations",
    descriptionAm: "የኦሮሞ መቅደስ በዓል — በአomid ዳርቻ የሚከበር",
    recurring: true,
  },
  {
    id: "arbaeen",
    nameEn: "Arba'een",
    nameAm: "አርባዕን",
    month: 2,
    day: 14,
    emoji: "🙏",
    descriptionEn: "40 days after Easter — end of mourning period",
    descriptionAm: "ፋሲካ በኋላ 40 ቀን — የምራቻው ጊዜ መጨረሻ",
    recurring: true,
  },
];

export function getBlockedDatesForYear(year: number): { date: string; holiday: EthiopianHoliday }[] {
  return ETHIOPIAN_HOLIDAYS.filter((h) => h.month > 0 && h.day > 0).map((h) => ({
    date: `${year}-${String(h.month).padStart(2, "0")}-${String(h.day).padStart(2, "0")}`,
    holiday: h,
  }));
}

export function isEthiopianHoliday(dateStr: string): EthiopianHoliday | null {
  const month = parseInt(dateStr.split("-")[1], 10);
  const day = parseInt(dateStr.split("-")[2], 10);
  return ETHIOPIAN_HOLIDAYS.find((h) => h.month === month && h.day === day) || null;
}
