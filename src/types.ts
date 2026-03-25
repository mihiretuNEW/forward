export const ETHIOPIAN_MONTHS = [
  "Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit",
  "Megabit", "Miazia", "Ginbot", "Sene", "Hamle", "Nehasse", "Pagume"
];

export const ETHIOPIAN_MONTHS_AM = [
  "መስከረም", "ጥቅምት", "ህዳር", "ታህሳስ", "ጥር", "የካቲት",
  "መጋቢት", "ሚያዝያ", "ግንቦት", "ሰኔ", "ሐምሌ", "ነሐሴ", "ጳጉሜ"
];

export interface Trade {
  id: string;
  result: 'win' | 'loss' | null;
  reason: string;
}

export interface DailyJournal {
  trades: Trade[];
}

export interface CalendarEntry {
  value: number | null;
}

export interface UserSession {
  email: string;
  isAuthenticated: boolean;
}

export interface EthiopianDate {
  day: number;
  month: number; // 0-indexed
  year: number;
}
