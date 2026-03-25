import { ETHIOPIAN_MONTHS, EthiopianDate } from '../types';

export const getEthiopianDaysInMonth = (monthIndex: number, year: number) => {
  if (monthIndex === 12) {
    // Pagume: 6 days if leap year, 5 otherwise
    // Ethiopian leap year is when (year + 1) % 4 == 0
    return (year + 1) % 4 === 0 ? 6 : 5;
  }
  return 30;
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    signDisplay: 'always'
  }).format(value);
};

/**
 * Simplified Gregorian to Ethiopian conversion
 * Based on the fact that Meskerem 1, 2016 (ET) was Sept 12, 2023 (GR)
 * and Meskerem 1, 2017 (ET) was Sept 11, 2024 (GR)
 */
export function toEthiopianDate(date: Date): EthiopianDate {
  const jdn = Math.floor(date.getTime() / 86400000) + 2440588;
  
  // Offset for Ethiopian calendar
  const ERA = 1723856;
  const n = jdn - ERA;
  
  const year = Math.floor(n / 1461) * 4 + Math.floor(Math.min(n % 1461, 1460) / 365);
  const dayOfYear = n - (Math.floor(year / 4) * 1461 + (year % 4) * 365);
  
  const month = Math.floor(dayOfYear / 30);
  const day = (dayOfYear % 30) + 1;
  
  return {
    year: year,
    month: month,
    day: day
  };
}

export function fromEthiopianDate(etDate: EthiopianDate): string {
  return `${etDate.year}-${etDate.month + 1}-${etDate.day}`;
}

export function getEthiopianDateString(date: Date): string {
  const et = toEthiopianDate(date);
  return `${ETHIOPIAN_MONTHS[et.month]} ${et.day}, ${et.year}`;
}

/**
 * Calculates the weekday of the 1st day of an Ethiopian month.
 * 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 */
export function getStartWeekday(month: number, year: number): number {
  // Reference: Meskerem 1, 2017 was Sept 11, 2024 (Wednesday = 3)
  const refYear = 2017;
  const refMonth = 0;
  const refWeekday = 3;

  // Total days from ref to target
  let totalDays = 0;
  
  // Year diff
  if (year >= refYear) {
    for (let y = refYear; y < year; y++) {
      totalDays += (y + 1) % 4 === 0 ? 366 : 365;
    }
  } else {
    for (let y = refYear - 1; y >= year; y--) {
      totalDays -= (y + 1) % 4 === 0 ? 366 : 365;
    }
  }

  // Month diff
  for (let m = 0; m < month; m++) {
    totalDays += getEthiopianDaysInMonth(m, year);
  }

  return (refWeekday + (totalDays % 7) + 7) % 7;
}
