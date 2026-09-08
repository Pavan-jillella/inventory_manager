export const CATEGORIES = ['Drinks', 'Snacks', 'Essentials', 'Medicines'];
export const MEMBERSHIP_TIERS = ['None', 'Member', 'Gold', 'Platinum', 'Diamond', 'Titanium'];

export const MOCK_ITEMS = [];

// Local-only demo accounts are excluded from production bundles.
export const DEFAULT_USERS = import.meta.env.DEV ? [
  { id: 1, name: 'Demo Admin', role: 'Admin', username: 'admin', password: 'admin' },
  { id: 2, name: 'Demo Front Desk', role: 'Front Desk', username: 'desk', password: 'desk' },
] : [];

export const SHIFTS = [
  { id: 'morning', label: 'Morning', start: 7, end: 15 },
  { id: 'afternoon', label: 'Afternoon', start: 15, end: 23 },
  { id: 'night', label: 'Night', start: 23, end: 7 },
];

export const getCurrentShift = () => {
  const hour = new Date().getHours();
  if (hour >= 7 && hour < 15) return SHIFTS[0];
  if (hour >= 15 && hour < 23) return SHIFTS[1];
  return SHIFTS[2];
};
