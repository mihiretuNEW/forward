export const ETHIOPIAN_MONTHS = [
  "Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit",
  "Megabit", "Miazia", "Ginbot", "Sene", "Hamle", "Nehasse", "Pagume"
];

export const ETHIOPIAN_MONTHS_AM = [
  "መስከረም", "ጥቅምት", "ህዳር", "ታህሳስ", "ጥር", "የካቲት",
  "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ"
];

export interface EthiopianDate {
  day: number;
  month: number; // 0-indexed
  year: number;
}

export interface PlanDayData {
  startBalance?: string;
  dailyResult?: string;
  rulesFollowed?: 'yes' | 'no' | null;
  emotionalState?: string;
}
