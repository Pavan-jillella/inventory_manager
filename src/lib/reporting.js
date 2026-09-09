export function inRecentDays(timestamp, days, now = new Date()) {
  const date = new Date(timestamp);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days + 1);
  return Number.isFinite(date.getTime()) && date >= start && date <= now;
}
