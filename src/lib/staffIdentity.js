export function staffLoginEmail(value) {
  const identifier = String(value || '').trim().toLowerCase();
  if (identifier.includes('@')) return identifier;
  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(identifier)) throw new Error('Use a username of 3–32 letters, numbers, dots, underscores or hyphens.');
  return `${identifier}@staff.country-inn-suites.invalid`;
}
