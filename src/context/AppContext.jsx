import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_ITEMS, DEFAULT_USERS, getCurrentShift, CATEGORIES } from '../data/mockData';
import {
  isFirebaseConfigured,
  readCollection,
  upsertManyDocs,
  upsertDocById,
  deleteDocById,
  readSettings,
  writeSettings,
} from '../lib/firebase';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cis_items');
      if (saved && saved !== 'undefined' && saved !== 'null') return JSON.parse(saved);
    } catch(e) {}
    return MOCK_ITEMS;
  });
  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('cis_logs');
      if (saved && saved !== 'undefined' && saved !== 'null') return JSON.parse(saved);
    } catch(e) {}
    return [];
  });
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('cis_users');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        // Ensure new defaults (maddy, pavan) are injected if missing
        DEFAULT_USERS.forEach(defaultUser => {
          if (!parsed.find(u => u.username === defaultUser.username)) {
            parsed.push(defaultUser);
          }
        });
        return parsed;
      }
    } catch(e) {}
    return DEFAULT_USERS;
  });
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('cis_settings');
      if (saved && saved !== 'undefined' && saved !== 'null') return JSON.parse(saved);
    } catch(e) {}
    return {
      hotelName: 'Country Inn & Suites',
      hotelAddress: '123 Luxury Ave, Suite 100',
      categories: CATEGORIES,
      notifications: { lowStock: true, outOfStock: true, shiftReport: false },
    };
  });
  const [toast, setToast] = useState(null);

  // Initial Firebase Fetch (if configured)
  useEffect(() => {
    if (!isFirebaseConfigured) return;
    const fetchFirebaseData = async () => {
      try {
        const [dbItems, dbUsers, dbLogs, dbSettings] = await Promise.all([
          readCollection('items'),
          readCollection('users'),
          readCollection('logs'),
          readSettings(),
        ]);

        if (dbItems.length > 0) {
          setItems(dbItems);
        } else {
          await upsertManyDocs('items', items);
        }

        if (dbUsers.length > 0) {
          setUsers(dbUsers);
        } else {
          await upsertManyDocs('users', users);
        }

        if (dbLogs.length > 0) {
          setLogs(dbLogs.sort((a, b) => {
            const tA = a.timestamp || '';
            const tB = b.timestamp || '';
            return tB.localeCompare(tA);
          }));
        } else if (logs.length > 0) {
          await upsertManyDocs('logs', logs);
        }

        if (dbSettings) {
          setSettings({
            hotelName: dbSettings.hotelName || 'Country Inn & Suites',
            hotelAddress: dbSettings.hotelAddress || '123 Luxury Ave, Suite 100',
            categories: dbSettings.categories || CATEGORIES,
            notifications: dbSettings.notifications || { lowStock: true, outOfStock: true, shiftReport: false }
          });
        } else {
          await writeSettings(settings);
        }
      } catch (e) {
        console.error('Firebase fetch error:', e);
      }
    };
    fetchFirebaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync to LocalStorage (Immediate persistence)
  useEffect(() => { localStorage.setItem('cis_items', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('cis_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('cis_users', JSON.stringify(users)); }, [users]);
  useEffect(() => {
    localStorage.setItem('cis_settings', JSON.stringify(settings));
    if (isFirebaseConfigured) {
      const syncSettings = async () => {
        try {
          await writeSettings(settings);
        } catch (e) {
          console.error('Settings sync failed:', e);
        }
      };
      syncSettings();
    }
  }, [settings]);

  const login = (username, password) => {
    const safeUsername = username.toLowerCase().trim();
    // Admin login with generic keys if none match, for ease of use
    const user = users.find(u => (u.username || '').toLowerCase() === safeUsername && u.password === password);
    if (user) { setCurrentUser(user); return user; }
    // Fallback if users empty/broken
    if (safeUsername === 'admin' && password === 'admin') {
      const fallback = { id: 1, name: 'Admin', role: 'Admin', username: 'admin' };
      setCurrentUser(fallback); return fallback;
    }
    return null;
  };
  const logout = () => setCurrentUser(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Staff CRUD ──
  const addStaff = async (name, username, password, role = 'Front Desk') => {
    if (users.find(u => u.username === username)) { showToast('Username already taken!', 'error'); return false; }
    const generatedId = Math.floor(Math.random() * 1000000) + 1000;
    const newUser = { id: generatedId, name, username, password, role };
    setUsers(prev => [...prev, newUser]);
    if (isFirebaseConfigured) await upsertDocById('users', newUser.id, newUser);
    showToast(`${name} added successfully`);
    return true;
  };
  const removeStaff = async (userId) => { 
    setUsers(prev => prev.filter(u => u.id !== userId)); 
    if (isFirebaseConfigured) await deleteDocById('users', userId);
    showToast('Staff removed'); 
  };

  // ── Item CRUD ──
  const addItem = async (item) => {
    const newItem = { ...item, id: Date.now(), stock: item.stock || 0, minStock: item.minStock || 5 };
    if (isFirebaseConfigured) await upsertDocById('items', newItem.id, newItem);
    setItems(prev => [...prev, newItem]);
    showToast(`${item.name} added to inventory`);
    return true;
  };

  const updateItem = async (id, updates) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    if (isFirebaseConfigured) {
      const current = items.find(i => i.id === id);
      if (current) await upsertDocById('items', id, { ...current, ...updates });
    }
    showToast('Product updated');
  };

  const deleteItem = async (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (isFirebaseConfigured) await deleteDocById('items', id);
    showToast('Product removed');
  };

  // ── Log Cart ──
  const logCartUsage = async (cartItems, roomNumber, notes, rateType = 'guest', paymentMethod = 'cash') => {
    for (const ci of cartItems) {
      const currentItem = items.find(i => i.id === ci.item.id);
      if (!currentItem || currentItem.stock < ci.quantity) {
        showToast(`Insufficient stock for ${ci.item.name}!`, 'error'); return false;
      }
    }
    
    // Decrease stock locally
    setItems(prev => prev.map(i => {
      const ce = cartItems.find(ci => ci.item.id === i.id);
      return ce ? { ...i, stock: i.stock - ce.quantity } : i;
    }));

    if (isFirebaseConfigured) {
      for (const ci of cartItems) {
        const currentItem = items.find(i => i.id === ci.item.id);
        if (!currentItem) continue;
        try {
          await upsertDocById('items', ci.item.id, { ...currentItem, stock: currentItem.stock - ci.quantity });
        } catch (e) {
          console.error('Firebase item sync failed:', e);
        }
      }
    }

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
    if (isFirebaseConfigured) {
      try {
        await upsertManyDocs('logs', newLogs);
      } catch (e) {
        console.error('Firebase log sync failed:', e);
      }
    }

    const totalQty = cartItems.reduce((s, ci) => s + ci.quantity, 0);
    showToast(`${cartItems.length} item(s), ${totalQty} qty issued${roomNumber ? ` → Room ${roomNumber}` : ''}`);
    return true;
  };

  // ── Log CRUD ──
  const updateLog = async (logId, updates) => {
    let stockDiff = 0;
    let itemId = null;
    let updatedLog = null;

    setLogs(prev => prev.map(l => {
      if (l.id === logId) {
        updatedLog = { ...l, ...updates };
        if (updates.quantity !== undefined) {
          updatedLog.totalAmount = updatedLog.unitRate * updates.quantity;
          updatedLog.purchaseCost = (updatedLog.purchaseRate || 0) * updates.quantity;
          stockDiff = l.quantity - updates.quantity;
          itemId = l.itemId;
          if (stockDiff !== 0) {
            setItems(prevItems => prevItems.map(i =>
              i.id === l.itemId ? { ...i, stock: i.stock + stockDiff } : i
            ));
          }
        }
        return updatedLog;
      }
      return l;
    }));

    if (isFirebaseConfigured && updatedLog) {
      await upsertDocById('logs', logId, updatedLog);
      if (stockDiff !== 0 && itemId) {
        const currentItem = items.find(i => i.id === itemId);
        if (currentItem) await upsertDocById('items', itemId, { ...currentItem, stock: currentItem.stock + stockDiff });
      }
    }
    showToast('Entry updated');
  };

  const deleteLog = async (logId) => {
    const log = logs.find(l => l.id === logId);
    if (log) {
      setItems(prev => prev.map(i =>
        i.id === log.itemId ? { ...i, stock: i.stock + log.quantity } : i
      ));
      if (isFirebaseConfigured) {
        const currentItem = items.find(i => i.id === log.itemId);
        if (currentItem) await upsertDocById('items', log.itemId, { ...currentItem, stock: currentItem.stock + log.quantity });
      }
    }
    setLogs(prev => prev.filter(l => l.id !== logId));
    if (isFirebaseConfigured) await deleteDocById('logs', logId);
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
