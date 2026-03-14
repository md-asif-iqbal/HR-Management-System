/**
 * Bangladesh Public Holidays
 * Weekends: Friday & Saturday
 */

// Fixed annual holidays (month is 1-indexed)
const FIXED_HOLIDAYS: { month: number; day: number; name: string }[] = [
  { month: 2,  day: 21, name: 'International Mother Language Day' },
  { month: 3,  day: 17, name: "Birth of Bangabandhu Sheikh Mujibur Rahman" },
  { month: 3,  day: 26, name: 'Independence Day' },
  { month: 4,  day: 14, name: 'Bengali New Year (Pohela Boishakh)' },
  { month: 5,  day: 1,  name: 'International Labour Day' },
  { month: 8,  day: 15, name: 'National Mourning Day' },
  { month: 12, day: 16, name: 'Victory Day' },
  { month: 12, day: 25, name: 'Christmas Day' },
];

// Variable holidays by year  (Eid, Durga Puja, etc. — update as announced)
const VARIABLE_HOLIDAYS: Record<number, { month: number; day: number; name: string }[]> = {
  2024: [
    { month: 4,  day: 10, name: 'Eid ul-Fitr (Day 1)' },
    { month: 4,  day: 11, name: 'Eid ul-Fitr (Day 2)' },
    { month: 4,  day: 12, name: 'Eid ul-Fitr (Day 3)' },
    { month: 6,  day: 17, name: 'Eid ul-Adha (Day 1)' },
    { month: 6,  day: 18, name: 'Eid ul-Adha (Day 2)' },
    { month: 6,  day: 19, name: 'Eid ul-Adha (Day 3)' },
    { month: 8,  day: 26, name: 'Janmashtami' },
    { month: 9,  day: 16, name: 'Durga Puja (Maha Navami)' },
    { month: 10, day: 14, name: 'Durga Puja' },
    { month: 10, day: 17, name: 'Eid-e-Milad-un-Nabi' },
  ],
  2025: [
    { month: 3,  day: 30, name: 'Eid ul-Fitr (Day 1)' },
    { month: 3,  day: 31, name: 'Eid ul-Fitr (Day 2)' },
    { month: 4,  day: 1,  name: 'Eid ul-Fitr (Day 3)' },
    { month: 6,  day: 7,  name: 'Eid ul-Adha (Day 1)' },
    { month: 6,  day: 8,  name: 'Eid ul-Adha (Day 2)' },
    { month: 6,  day: 9,  name: 'Eid ul-Adha (Day 3)' },
    { month: 9,  day: 5,  name: 'Janmashtami' },
    { month: 10, day: 3,  name: 'Durga Puja (Maha Navami)' },
    { month: 9,  day: 5,  name: 'Eid-e-Milad-un-Nabi' },
    { month: 4,  day: 19, name: 'Good Friday' },
    { month: 5,  day: 12, name: 'Buddha Purnima' },
  ],
  2026: [
    { month: 3,  day: 20, name: 'Eid ul-Fitr (Day 1)' },
    { month: 3,  day: 21, name: 'Eid ul-Fitr (Day 2)' },
    { month: 3,  day: 22, name: 'Eid ul-Fitr (Day 3)' },
    { month: 5,  day: 27, name: 'Eid ul-Adha (Day 1)' },
    { month: 5,  day: 28, name: 'Eid ul-Adha (Day 2)' },
    { month: 5,  day: 29, name: 'Eid ul-Adha (Day 3)' },
    { month: 8,  day: 25, name: 'Janmashtami' },
    { month: 9,  day: 24, name: 'Eid-e-Milad-un-Nabi' },
    { month: 10, day: 22, name: 'Durga Puja (Maha Navami)' },
    { month: 4,  day: 3,  name: 'Good Friday' },
  ],
};

/** Returns true if date is a BD weekend (Friday or Saturday) */
export function isWeekend(date: Date): boolean {
  const dow = date.getDay(); // 5=Fri, 6=Sat
  return dow === 5 || dow === 6;
}

/** Returns holiday name if date is a BD public holiday, otherwise null */
export function getHolidayName(date: Date): string | null {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const y = date.getFullYear();

  const fixed = FIXED_HOLIDAYS.find((h) => h.month === m && h.day === d);
  if (fixed) return fixed.name;

  const variable = (VARIABLE_HOLIDAYS[y] || []).find((h) => h.month === m && h.day === d);
  if (variable) return variable.name;

  return null;
}

/** Returns true if date is a BD public holiday */
export function isHoliday(date: Date): boolean {
  return getHolidayName(date) !== null;
}

/** Returns true if date is off (weekend OR public holiday) */
export function isDayOff(date: Date): boolean {
  return isWeekend(date) || isHoliday(date);
}

/** Get all holidays in a given month/year (for calendar legend) */
export function getHolidaysInMonth(month: number, year: number): { day: number; name: string; isWeekend: boolean }[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const result: { day: number; name: string; isWeekend: boolean }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const holidayName = getHolidayName(date);
    const weekend = isWeekend(date);
    if (holidayName) result.push({ day: d, name: holidayName, isWeekend: weekend });
  }
  return result;
}
