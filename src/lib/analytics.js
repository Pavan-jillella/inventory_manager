export const dateKey = value => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
export const shiftDate = (date, days) => {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
};
export function dateRange(preset, start, end, today = dateKey(new Date())) {
  const to = preset === 'custom' ? end : today;
  const from = preset === 'custom' ? start : shiftDate(to, preset === 'today' ? 0 : preset === '30' ? -29 : -6);
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
  if (!validDate(from) || !validDate(to) || from > to || to > today) return null;
  const days = Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000) + 1;
  if (days > 366) return null;
  return { from, to, days, previousFrom: shiftDate(from, -days), previousTo: shiftDate(from, -1) };
}
export const inRange = (date, from, to) => Boolean(date && date >= from && date <= to);
export const sumMoney = (rows, field) => rows.reduce((sum, row) => sum + Math.round(Number(row[field] || 0) * 100), 0) / 100;
export function comparison(current, previous) {
  if (!previous) return current ? 'No previous activity to compare' : 'No change';
  const change = (current - previous) / previous * 100;
  return `${change > 0 ? '+' : ''}${change.toFixed(1)}% vs previous period`;
}
export function stockEstimate(item, logs, today = dateKey(new Date())) {
  const first = shiftDate(today, -29);
  const rows = logs.filter(row => String(row.itemId) === String(item.id) && inRange(dateKey(row.timestamp), first, today) && row.quantity > 0);
  const days = [...new Set(rows.map(row => dateKey(row.timestamp)))].sort();
  const observedDays = days.length ? Math.round((Date.parse(`${today}T12:00:00Z`) - Date.parse(`${days[0]}T12:00:00Z`)) / 86400000) + 1 : 0;
  if (observedDays < 7 || days.length < 3) return null;
  const daily = rows.reduce((sum, row) => sum + Number(row.quantity), 0) / observedDays;
  return { daily, days: Number(item.stock) / daily, observedDays };
}
export function weeklyMileage(days, end) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = shiftDate(end, index - 6);
    const rows = days.flatMap(day => day.mileage || []).filter(row => row.date === date);
    const complete = rows.filter(row => row.end !== '' && Number.isFinite(row.end) && Number.isFinite(row.start) && row.end >= row.start);
    return { date, miles: complete.length ? complete.reduce((sum, row) => sum + row.end - row.start, 0) : null, incomplete: rows.length - complete.length };
  });
}
