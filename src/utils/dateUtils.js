// IST timezone offset: UTC+5:30
const IST_OFFSET = 5.5 * 60 * 60 * 1000; // milliseconds

// Convert date to IST
export function toIST(date) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  return new Date(utc + IST_OFFSET);
}

// Get today's date in IST
export function getTodayIST() {
  return toIST(new Date());
}

// Format date as YYYY-MM-DD in IST
export function formatDateIST(date) {
  const istDate = toIST(date);
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Check if date is in the past (in IST)
export function isPastDate(dateStr) {
  const todayIST = formatDateIST(getTodayIST());
  return dateStr <= todayIST;
}

// Get year dates - properly handle 365/366 days and alignment
export function getYearDates(year) {
  const dates = [];
  const start = new Date(year, 0, 1); // Jan 1
  
  // Check if leap year
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const daysInYear = isLeapYear ? 366 : 365;

  for (let i = 0; i < daysInYear; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  return dates;
}

// Get day of week for Jan 1 of the year (0 = Sunday, 4 = Thursday)
export function getYearStartDay(year) {
  const jan1 = new Date(year, 0, 1);
  return jan1.getDay();
}

export function getMonthDates(year, month) {
  const dates = [];
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  return dates;
}

export function getWeekDates(date) {
  const istDate = toIST(date);
  const day = istDate.getDay(); // 0 = Sunday, 6 = Saturday
  const sunday = new Date(istDate);
  sunday.setDate(istDate.getDate() - day);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

// Get month abbreviation
export function getMonthAbbr(monthIndex) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return months[monthIndex];
}
