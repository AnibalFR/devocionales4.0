/**
 * Date helper utilities for calendar functionality
 */

/**
 * Get the start of the week (Monday) for a given date
 */
export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Adjust when day is Sunday (0)
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get the end of the week (Sunday) for a given date
 */
export const getWeekEnd = (date: Date): Date => {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

/**
 * Get an array of 7 dates representing the week (Monday to Sunday)
 */
export const getWeekDates = (startDate: Date): Date[] => {
  const dates: Date[] = [];
  const start = getWeekStart(startDate);

  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }

  return dates;
};

/**
 * Format week range for display (e.g., "12 Ene - 18 Ene")
 */
export const formatWeekRange = (start: Date, end: Date): string => {
  const startStr = start.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });
  const endStr = end.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
  });

  // If same month, show month only once
  const startMonth = start.getMonth();
  const endMonth = end.getMonth();

  if (startMonth === endMonth) {
    const startDay = start.getDate();
    const month = start.toLocaleDateString('es-MX', { month: 'short' });
    return `${startDay} - ${end.getDate()} ${month}`;
  }

  return `${startStr} - ${endStr}`;
};

/**
 * Check if a date is today
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return isSameDay(date, today);
};

/**
 * Check if two dates are the same day
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Get day name abbreviation (e.g., "Lun", "Mar")
 */
export const getDayAbbreviation = (date: Date): string => {
  return date.toLocaleDateString('es-MX', { weekday: 'short' });
};

/**
 * Get day number (e.g., 12, 13, 14)
 */
export const getDayNumber = (date: Date): number => {
  return date.getDate();
};

/**
 * Convert date string (YYYY-MM-DD) to Date object at midnight
 */
export const parseDateString = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
};

/**
 * Format date to YYYY-MM-DD string
 */
export const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
