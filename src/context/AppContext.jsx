import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_ITEMS, DEFAULT_USERS, getCurrentShift } from '../data/mockData';

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
  const [toast, setToast] = useState(null);

  useEffect(() => { localStorage.setItem('cis_items', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('cis_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('cis_users', JSON.stringify(users)); }, [users]);

  // PIN-based login
  const loginWithPin = (pin) => {
    const user = users.find(u => u.pin === pin);
    if (user) {
      setCurrentUser(user);
      return user;
    }
    return null;
  };

  const logout = () => setCurrentUser(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Add new staff
  const addStaff = (name, pin, role = 'Front Desk') => {
    if (users.find(u => u.pin === pin)) {
      showToast('PIN already in use!', 'error');
      return false;
    }
    const newUser = { id: Date.now(), name, pin, role };
    setUsers(prev => [...prev, newUser]);
    showToast(`${name} added successfully`);
    return true;
  };

  // Remove staff
  const removeStaff = (userId) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    showToast('Staff removed');
  };

  // Issue multiple items at once (cart)
  const logCartUsage = (cartItems, roomNumber, notes, rateType = 'guest') => {
    for (const ci of cartItems) {
      const currentItem = items.find(i => i.id === ci.item.id);
      if (!currentItem || currentItem.stock < ci.quantity) {
        showToast(`Insufficient stock for ${ci.item.name}!`, 'error');
        return false;
      }
    }

    const updatedItems = items.map(i => {
      const cartEntry = cartItems.find(ci => ci.item.id === i.id);
      if (cartEntry) return { ...i, stock: i.stock - cartEntry.quantity };
      return i;
    });
    setItems(updatedItems);

    const shift = getCurrentShift();
    const batchId = Date.now();

    const newLogs = cartItems.map((ci, idx) => {
      const rate = rateType === 'staff' ? (ci.item.staffRate || 0) : (ci.item.guestRate || 0);
      return {
        id: batchId + idx,
        batchId,
        itemId: ci.item.id,
        itemName: ci.item.name,
        itemCategory: ci.item.category,
        quantity: ci.quantity,
        rateType,
        unitRate: rate,
        totalAmount: rate * ci.quantity,
        roomNumber: roomNumber || '',
        notes: notes || '',
        staffId: currentUser?.id,
        staffName: currentUser?.name,
        shift: shift.id,
        shiftLabel: shift.label,
        timestamp: new Date().toISOString(),
      };
    });

    setLogs(prev => [...newLogs.reverse(), ...prev]);
    const totalQty = cartItems.reduce((s, ci) => s + ci.quantity, 0);
    showToast(`${cartItems.length} item(s), ${totalQty} qty issued${roomNumber ? ` → Room ${roomNumber}` : ''}`);
    return true;
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
      currentUser, loginWithPin, logout,
      items, setItems, logs, users,
      logCartUsage, addStaff, removeStaff,
      toast, showToast, getShiftStats,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
