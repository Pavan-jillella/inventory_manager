import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_ITEMS, DEFAULT_USERS, getCurrentShift, CATEGORIES } from '../data/mockData';
import {
  isFirebaseConfigured,
  readCollection,
  upsertManyDocs,
  upsertDocById,
  deleteDocById,
  deleteManyDocsByIds,
  readSettings,
  writeSettings,
} from '../lib/firebase';

const AppContext = createContext();
const normalizeUsername = (value) => String(value || '').toLowerCase().trim();
const defaultEmailSettings = {
  enabled: false,
  recipients: '',
  scheduleTime: '07:00',
  timeZone: 'America/New_York',
  includeAllShifts: true,
  lastSentAt: null,
};

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('cis_currentUser');
      if (saved && saved !== 'undefined' && saved !== 'null') return JSON.parse(saved);
    } catch(e) {}
    return null;
  });
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
        DEFAULT_USERS.forEach((defaultUser) => {
          const defaultUsername = normalizeUsername(defaultUser.username);
          if (!parsed.find((u) => normalizeUsername(u.username) === defaultUsername)) {
            parsed.push({ ...defaultUser, username: defaultUsername });
          }
        });
        return parsed.map((u) => ({ ...u, username: normalizeUsername(u.username) }));
      }
    } catch(e) {}
    return DEFAULT_USERS.map((u) => ({ ...u, username: normalizeUsername(u.username) }));
  });
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('cis_settings');
      if (saved && saved !== 'undefined' && saved !== 'null') {
        const parsed = JSON.parse(saved);
        return {
          hotelName: parsed.hotelName || 'Country Inn & Suites',
          hotelAddress: parsed.hotelAddress || '123 Luxury Ave, Suite 100',
          categories: Array.isArray(parsed.categories) ? parsed.categories : CATEGORIES,
          notifications: {
            lowStock: parsed.notifications?.lowStock ?? true,
            outOfStock: parsed.notifications?.outOfStock ?? true,
            shiftReport: parsed.notifications?.shiftReport ?? false,
          },
          emailReports: { ...defaultEmailSettings, ...(parsed.emailReports || {}) },
        };
      }
    } catch(e) {}
      return {
        hotelName: 'Country Inn & Suites',
        hotelAddress: '123 Luxury Ave, Suite 100',
        categories: CATEGORIES,
        notifications: { lowStock: true, outOfStock: true, shiftReport: false },
        emailReports: defaultEmailSettings,
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

        setItems(dbItems);

        if (dbUsers.length > 0) {
          setUsers(dbUsers.map((u) => ({ ...u, username: normalizeUsername(u.username) })));
        } else {
          await upsertManyDocs('users', users);
        }

        if (dbLogs.length > 0) {
          setLogs(dbLogs.sort((a, b) => {
            const tA = a.timestamp || '';
            const tB = b.timestamp || '';
            return tB.localeCompare(tA);
          }));
        } else {
          setLogs([]);
        }

        if (dbSettings) {
          setSettings({
            hotelName: dbSettings.hotelName || 'Country Inn & Suites',
            hotelAddress: dbSettings.hotelAddress || '123 Luxury Ave, Suite 100',
            categories: Array.isArray(dbSettings.categories) ? dbSettings.categories : CATEGORIES,
            notifications: dbSettings.notifications || { lowStock: true, outOfStock: true, shiftReport: false },
            emailReports: { ...defaultEmailSettings, ...(dbSettings.emailReports || {}) },
          });
        } else {
          await writeSettings(settings);
        }
      } catch (e) {
        console.error('Firebase fetch error:', e);
      }
    };
    fetchFirebaseData();
    
    // AUTO-REFRESH: Keep devices in sync by fetching fresh data every 45 seconds
    const interval = setInterval(fetchFirebaseData, 45000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync to LocalStorage (Immediate persistence)
  useEffect(() => { localStorage.setItem('cis_items', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('cis_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('cis_users', JSON.stringify(users)); }, [users]);
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('cis_currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('cis_currentUser');
    }
  }, [currentUser]);
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
    const safeUsername = normalizeUsername(username);
    // Admin login with generic keys if none match, for ease of use
    const user = users.find((u) => normalizeUsername(u.username) === safeUsername && u.password === password);
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
    const safeUsername = normalizeUsername(username);
    if (!safeUsername) { showToast('Username is required', 'error'); return false; }
    if (users.find((u) => normalizeUsername(u.username) === safeUsername)) { showToast('Username already taken!', 'error'); return false; }
    const generatedId = Math.floor(Math.random() * 1000000) + 1000;
    const newUser = { id: generatedId, name, username: safeUsername, password, role };
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
    if (isFirebaseConfigured) {
      try {
        await deleteDocById('items', id);
      } catch (e) {
        console.error('Failed to delete product from Firebase:', e);
        showToast('Unable to delete product. Please try again.', 'error');
        return false;
      }
    }
    setItems(prev => prev.filter(i => i.id !== id));
    showToast('Product removed');
    return true;
  };

  // ── Log Cart ──
  const logCartUsage = async (cartItems, roomNumber, notes, rateType = 'guest', paymentMethod = 'cash', membershipTier = 'None') => {
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
      const rate = ci.isFree ? 0 : (rateType === 'staff' ? (ci.item.staffRate || 0) : (ci.item.guestRate || 0));
      return {
        id: batchId + idx, 
        batchId, 
        itemId: ci.item.id, 
        itemName: ci.item.name, 
        itemCategory: ci.item.category,
        quantity: ci.quantity, 
        rateType: ci.isFree ? 'Amenity' : rateType, 
        unitRate: rate, 
        totalAmount: rate * ci.quantity,
        purchaseRate: ci.item.purchaseRate || 0, 
        purchaseCost: (ci.item.purchaseRate || 0) * ci.quantity,
        paymentMethod: ci.isFree ? 'Amenity' : paymentMethod, 
        roomNumber: roomNumber || '', 
        notes: notes || '',
        membershipTier: membershipTier || 'None',
        isFreeAmenity: Boolean(ci.isFree),
        staffId: currentUser?.id, 
        staffName: currentUser?.name,
        shift: shift.id, 
        shiftLabel: shift.label, 
        timestamp: new Date().toISOString(),
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

  const clearRevenueData = async () => {
    setLogs([]);
    if (isFirebaseConfigured) {
      const logIds = logs.map(l => l.id);
      await deleteManyDocsByIds('logs', logIds);
    }
    showToast('Revenue logs cleared');
  };

  const factoryReset = async () => {
    setItems([]);
    setLogs([]);
    setUsers(DEFAULT_USERS);
    
    if (isFirebaseConfigured) {
      try {
        const [dbItems, dbLogs, dbUsers] = await Promise.all([
          readCollection('items'),
          readCollection('logs'),
          readCollection('users'),
        ]);
        
        await Promise.all([
          deleteManyDocsByIds('items', dbItems.map(i => i.id)),
          deleteManyDocsByIds('logs', dbLogs.map(l => l.id)),
          deleteManyDocsByIds('users', dbUsers.filter(u => u.username !== 'admin' && u.username !== 'desk').map(u => u.id))
        ]);
      } catch (e) {
        console.error('Cloud reset failed:', e);
      }
    }
    
    localStorage.clear();
    showToast('Platform reset to original state', 'success');
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
  const getLogsForYear = (year = new Date().getFullYear()) => {
    return logs.filter(l => {
      if (!l.timestamp) return false;
      return new Date(l.timestamp).getFullYear() === year;
    });
  };

  return (
    <AppContext.Provider value={{
      currentUser, items, logs, users, settings, toast,
      login, logout, showToast, 
      addStaff, removeStaff, 
      addItem, updateItem, deleteItem, 
      logCartUsage, clearRevenueData, factoryReset,
      setSettings, updateLog, deleteLog, getShiftStats, getLogsForYear
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
