export const CATEGORIES = ['Drinks', 'Snacks', 'Essentials', 'Medicines'];

export const MOCK_ITEMS = [
  { id: 1,  name: 'Soda',             category: 'Drinks',     stock: 142, minStock: 30,  staffRate: 1.00, guestRate: 1.50, purchaseRate: 0.60, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=200&auto=format&fit=crop' },
  { id: 2,  name: 'Gatorade',         category: 'Drinks',     stock: 18,  minStock: 10,  staffRate: 1.50, guestRate: 2.50, purchaseRate: 0.90, image: 'https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?q=80&w=200&auto=format&fit=crop' },
  { id: 3,  name: 'Chips',            category: 'Snacks',     stock: 45,  minStock: 15,  staffRate: 1.00, guestRate: 2.00, purchaseRate: 0.50, image: 'https://images.unsplash.com/photo-1566478989037-eade2e592198?q=80&w=200&auto=format&fit=crop' },
  { id: 4,  name: 'Clippers',         category: 'Essentials', stock: 12,  minStock: 5,   staffRate: 2.00, guestRate: 3.50, purchaseRate: 1.00, image: 'https://images.unsplash.com/photo-1585747860019-f3dbfa643c82?q=80&w=200&auto=format&fit=crop' },
  { id: 5,  name: 'Oreo',             category: 'Snacks',     stock: 20,  minStock: 10,  staffRate: 1.00, guestRate: 2.00, purchaseRate: 0.50, image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=200&auto=format&fit=crop' },
  { id: 6,  name: 'Cough Candy',      category: 'Medicines',  stock: 13,  minStock: 5,   staffRate: 1.50, guestRate: 3.00, purchaseRate: 0.80, image: 'https://images.unsplash.com/photo-1584308666744-24d5e12f6720?q=80&w=200&auto=format&fit=crop' },
  { id: 7,  name: 'Popcorn',          category: 'Snacks',     stock: 6,   minStock: 8,   staffRate: 1.50, guestRate: 2.50, purchaseRate: 0.70, image: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?q=80&w=200&auto=format&fit=crop' },
  { id: 8,  name: 'Granola',          category: 'Snacks',     stock: 1,   minStock: 3,   staffRate: 2.00, guestRate: 3.50, purchaseRate: 1.20, image: 'https://images.unsplash.com/photo-1517093602195-b40af9688b46?q=80&w=200&auto=format&fit=crop' },
  { id: 9,  name: 'TicTac',           category: 'Snacks',     stock: 5,   minStock: 5,   staffRate: 0.75, guestRate: 1.50, purchaseRate: 0.30, image: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?q=80&w=200&auto=format&fit=crop' },
  { id: 10, name: 'Gums',             category: 'Snacks',     stock: 1,   minStock: 3,   staffRate: 0.75, guestRate: 1.50, purchaseRate: 0.30, image: 'https://images.unsplash.com/photo-1600952841320-db92ec4047ca?q=80&w=200&auto=format&fit=crop' },
  { id: 11, name: 'Chocolate',        category: 'Snacks',     stock: 33,  minStock: 10,  staffRate: 1.00, guestRate: 2.00, purchaseRate: 0.55, image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4c?q=80&w=200&auto=format&fit=crop' },
  { id: 12, name: 'Crackers',         category: 'Snacks',     stock: 22,  minStock: 10,  staffRate: 1.00, guestRate: 1.75, purchaseRate: 0.45, image: 'https://images.unsplash.com/photo-1590005354167-6da97870c757?q=80&w=200&auto=format&fit=crop' },
  { id: 13, name: 'Peanuts',          category: 'Snacks',     stock: 15,  minStock: 8,   staffRate: 1.00, guestRate: 2.00, purchaseRate: 0.50, image: 'https://images.unsplash.com/photo-1567892737950-30e3cbe5765b?q=80&w=200&auto=format&fit=crop' },
  { id: 14, name: 'Tablets',          category: 'Medicines',  stock: 6,   minStock: 5,   staffRate: 2.00, guestRate: 4.00, purchaseRate: 1.00, image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?q=80&w=200&auto=format&fit=crop' },
  { id: 15, name: 'Eye Cleaner',      category: 'Medicines',  stock: 6,   minStock: 3,   staffRate: 3.00, guestRate: 5.00, purchaseRate: 1.50, image: 'https://images.unsplash.com/photo-1584308666744-24d5e12f6720?q=80&w=200&auto=format&fit=crop' },
  { id: 16, name: 'Stomach Tablets',  category: 'Medicines',  stock: 6,   minStock: 5,   staffRate: 2.50, guestRate: 4.50, purchaseRate: 1.20, image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?q=80&w=200&auto=format&fit=crop' },
];

export const DEFAULT_USERS = [
  { id: 1, name: 'Admin',       role: 'Admin',      username: 'admin',  password: 'admin' },
  { id: 2, name: 'Front Desk',  role: 'Front Desk', username: 'desk',   password: 'desk' },
];

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
