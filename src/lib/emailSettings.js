export function validateEmailSettings(settings = {}) {
  const recipients = String(settings.recipients || '').split(',').map(s => s.trim()).filter(Boolean);
  if (recipients.length > 20 || recipients.some(email => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) throw new Error('Enter up to 20 valid email addresses, separated by commas.');
  if (settings.enabled && !recipients.length) throw new Error('Enter at least one recipient before enabling reports.');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.scheduleTime || '07:00')) throw new Error('Choose a valid report delivery time.');
  try { new Intl.DateTimeFormat('en-US', { timeZone: settings.timeZone || 'America/New_York' }).format(); }
  catch { throw new Error('Enter a valid time zone, such as America/New_York.'); }
}
