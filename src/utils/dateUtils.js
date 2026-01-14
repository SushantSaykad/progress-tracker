export function getYearDates(year) {
  const dates = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  return dates;
}

export function getMonthDates(year, month) {
  const dates = [];
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d));
  }
  return dates;
}

export function getWeekDates(date) {
  const day = date.getDay() || 7; // Monday = 1
  const monday = new Date(date);
  monday.setDate(date.getDate() - day + 1);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}
