import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_ITEMS, MOCK_USERS, getCurrentShift } from '../data/mockData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('inventory_items');
    return saved ? JSON.parse(saved) : MOCK_ITEMS;
  });
  const [logs, setLogs] = useState(() => {
    const saved = localStorage.getItem('inventory_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    localStorage.setItem('inventory_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('inventory_logs', JSON.stringify(logs));
  }, [logs]);

  const login = (username, password) => {
    const user = MOCK_USERS.find(u => u.username === username && u.password === password);
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

  // Issue a single item
  const logUsage = (item, quantity, roomNumber, guestName, notes, rateType = 'guest') => {
    if (item.stock < quantity) {
      showToast('Insufficient stock!', 'error');
      return false;
    }
    const updatedItems = items.map(i =>
      i.id === item.id ? { ...i, stock: i.stock - quantity } : i
    );
    setItems(updatedItems);

    const shift = getCurrentShift();
    const rate = rateType === 'staff' ? (item.staffRate || 0) : (item.guestRate || 0);

    const newLog = {
      id: Date.now() + Math.random(),
      itemId: item.id,
      itemName: item.name,
      itemCategory: item.category,
      quantity,
      rateType,
      unitRate: rate,
      totalAmount: rate * quantity,
      roomNumber: roomNumber || '',
      guestName: guestName || '',
      notes: notes || '',
      staffId: currentUser?.id,
      staffName: currentUser?.name,
      shift: shift.id,
      shiftLabel: shift.label,
      timestamp: new Date().toISOString(),
    };
    setLogs(prev => [newLog, ...prev]);
    return true;
  };

  // Issue multiple items at once (cart)
  const logCartUsage = (cartItems, roomNumber, guestName, notes, rateType = 'guest') => {
    // Validate all stock
    for (const ci of cartItems) {
      const currentItem = items.find(i => i.id === ci.item.id);
      if (!currentItem || currentItem.stock < ci.quantity) {
        showToast(`Insufficient stock for ${ci.item.name}!`, 'error');
        return false;
      }
    }

    // Deduct stock for all items
    const updatedItems = items.map(i => {
      const cartEntry = cartItems.find(ci => ci.item.id === i.id);
      if (cartEntry) return { ...i, stock: i.stock - cartEntry.quantity };
      return i;
    });
    setItems(updatedItems);

    const shift = getCurrentShift();
    const batchId = Date.now();

    // Create logs for each item
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
        guestName: guestName || '',
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
      uniqueRooms: new Set(shiftLogs.filter(l => l.roomNumber).map(l => l.roomNumber)).size,
    };
  };

  return (
    <AppContext.Provider value={{
      currentUser, login, logout,
      items, setItems, logs,
      logUsage, logCartUsage,
      toast, showToast, getShiftStats,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
