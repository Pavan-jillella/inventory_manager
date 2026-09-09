function localParts(now, timeZone) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now).map(p => [p.type, p.value]));
}
function reportSchedule(now, timeZone, sendTime) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(sendTime)) throw new Error('Invalid report time');
  const p = localParts(now, timeZone);
  const reportDate = new Date(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day) - 1)).toISOString().slice(0, 10);
  return { due: `${p.hour}:${p.minute}` >= sendTime, reportDate };
}
function localDay(timestamp, timeZone) {
  const p = localParts(new Date(timestamp), timeZone);
  return `${p.year}-${p.month}-${p.day}`;
}
module.exports = { reportSchedule, localDay };
