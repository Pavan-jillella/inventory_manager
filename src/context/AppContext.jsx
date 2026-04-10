import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_ITEMS, DEFAULT_USERS, getCurrentShift, CATEGORIES } from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('cis_items');
    return saved ? JSON.parse(saved) : MOCK_ITEMS;
  });
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('cis_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem('cis_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('cis_settings');
    return saved ? JSON.parse(saved) : {
      hotelName: 'Country Inn & Suites',
      hotelAddress: '123 Luxury Ave, Suite 100',
      categories: CATEGORIES,
      notifications: { lowStock: true, outOfStock: true, shiftReport: false },
    };
  });
  const [toast, setToast] = useState(null);

  useEffect(() => { localStorage.setItem('cis_items', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('cis_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('cis_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('cis_settings', JSON.stringify(settings)); }, [settings]);

  const login = (username, password) => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) { setCurrentUser(user); return user; }
    return null;
  };
  const logout = () => setCurrentUser(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Staff CRUD ──
  const addStaff = (name, username, password, role = 'Front Desk') => {
    if (users.find(u => u.username === username)) { showToast('Username already taken!', 'error'); return false; }
    setUsers(prev => [...prev, { id: Date.now(), name, username, password, role }]);
    showToast(`${name} added successfully`);
    return true;
  };
  const removeStaff = (userId) => { setUsers(prev => prev.filter(u => u.id !== userId)); showToast('Staff removed'); };

  // ── Item CRUD ──
  const addItem = (item) => {
    const newItem = { ...item, id: Date.now(), stock: item.stock || 0, minStock: item.minStock || 5 };
    setItems(prev => [...prev, newItem]);
    showToast(`${item.name} added to inventory`);
    return true;
  };
  const updateItem = (id, updates) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    showToast('Product updated');
  };
  const deleteItem = (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
    showToast('Product removed');
  };

  // ── Log Cart ──
  const logCartUsage = (cartItems, roomNumber, notes, rateType = 'guest', paymentMethod = 'cash') => {
    for (const ci of cartItems) {
      const currentItem = items.find(i => i.id === ci.item.id);
      if (!currentItem || currentItem.stock < ci.quantity) {
        showToast(`Insufficient stock for ${ci.item.name}!`, 'error'); return false;
      }
    }
    setItems(prev => prev.map(i => {
      const ce = cartItems.find(ci => ci.item.id === i.id);
      return ce ? { ...i, stock: i.stock - ce.quantity } : i;
    }));
    const shift = getCurrentShift();
    const batchId = Date.now();
    const newLogs = cartItems.map((ci, idx) => {
      const rate = rateType === 'staff' ? (ci.item.staffRate || 0) : (ci.item.guestRate || 0);
      return {
        id: batchId + idx, batchId, itemId: ci.item.id, itemName: ci.item.name, itemCategory: ci.item.category,
        quantity: ci.quantity, rateType, unitRate: rate, totalAmount: rate * ci.quantity,
        purchaseRate: ci.item.purchaseRate || 0, purchaseCost: (ci.item.purchaseRate || 0) * ci.quantity,
        paymentMethod, roomNumber: roomNumber || '', notes: notes || '',
        staffId: currentUser?.id, staffName: currentUser?.name,
        shift: shift.id, shiftLabel: shift.label, timestamp: new Date().toISOString(),
      };
    });
    setLogs(prev => [...newLogs.reverse(), ...prev]);
    const totalQty = cartItems.reduce((s, ci) => s + ci.quantity, 0);
    showToast(`${cartItems.length} item(s), ${totalQty} qty issued${roomNumber ? ` → Room ${roomNumber}` : ''}`);
    return true;
  };

  // ── Log CRUD ──
  const updateLog = (logId, updates) => {
    setLogs(prev => prev.map(l => {
      if (l.id === logId) {
        const updated = { ...l, ...updates };
        if (updates.quantity !== undefined) {
          updated.totalAmount = updated.unitRate * updates.quantity;
          updated.purchaseCost = (updated.purchaseRate || 0) * updates.quantity;
          // Adjust stock
          const diff = l.quantity - updates.quantity;
          if (diff !== 0) {
            setItems(prevItems => prevItems.map(i =>
              i.id === l.itemId ? { ...i, stock: i.stock + diff } : i
            ));
          }
        }
        return updated;
      }
      return l;
    }));
    showToast('Entry updated');
  };
  const deleteLog = (logId) => {
    const log = logs.find(l => l.id === logId);
    if (log) {
      setItems(prev => prev.map(i =>
        i.id === log.itemId ? { ...i, stock: i.stock + log.quantity } : i
      ));
    }
    setLogs(prev => prev.filter(l => l.id !== logId));
    showToast('Entry deleted, stock restored');
  };

  const getShiftStats = (shiftId) => {
    const today = new Date().toDateString();
    const shiftLogs = logs.filter(l => new Date(l.timestamp).toDateString() === today && l.shift === shiftId);
    return {
      totalItems: shiftLogs.reduce((sum, l) => sum + l.quantity, 0),
      totalEntries: shiftLogs.length,
      totalAmount: shiftLogs.reduce((sum, l) => sum + (l.totalAmount || 0), 0),
    };
  };

  return (
    <AppContext.Provider value={{
      currentUser, login, logout,
      items, setItems, logs, users, settings, setSettings,
      logCartUsage, addStaff, removeStaff,
      addItem, updateItem, deleteItem,
      updateLog, deleteLog,
      toast, showToast, getShiftStats,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
