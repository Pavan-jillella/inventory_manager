import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { parseInventory } from '../lib/operations';
import { planIssue, planLogChange } from '../lib/inventory';
import { staffAccessError, signInMessage } from '../lib/authMessages';
import { MOCK_ITEMS, DEFAULT_USERS, getCurrentShift, CATEGORIES } from '../data/mockData';
import {
  isFirebaseConfigured, manageCloudStaff,
  issueCloudItems, changeCloudLog,
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
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured);
  const [currentUser, setCurrentUser] = useState(() => {
    if (isFirebaseConfigured || !import.meta.env.DEV) return null;
    try {
      const saved = localStorage.getItem('cis_currentUser');
      if (saved && saved !== 'undefined' && saved !== 'null') return JSON.parse(saved);
    } catch { /* Use defaults when cached data is invalid. */ }
    return null;
  });
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cis_items');
      if (saved && saved !== 'undefined' && saved !== 'null') return JSON.parse(saved);
    } catch { /* Use defaults when cached data is invalid. */ }
    return MOCK_ITEMS;
  });
  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('cis_logs');
      if (saved && saved !== 'undefined' && saved !== 'null') return JSON.parse(saved);
    } catch { /* Use defaults when cached data is invalid. */ }
    return [];
  });
  const [users, setUsers] = useState(() => {
    if (isFirebaseConfigured) return [];
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
    } catch { /* Use defaults when cached data is invalid. */ }
    return DEFAULT_USERS.map((u) => ({ ...u, username: normalizeUsername(u.username) }));
  });
  const [settings, setSettingsState] = useState(() => {
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
    } catch { /* Use defaults when cached data is invalid. */ }
      return {
        hotelName: 'Country Inn & Suites',
        hotelAddress: '123 Luxury Ave, Suite 100',
        categories: CATEGORIES,
        notifications: { lowStock: true, outOfStock: true, shiftReport: false },
        emailReports: defaultEmailSettings,
      };
  });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, async user => {
      try {
        if (!user) { setCurrentUser(null); return; }
        const profile = await getDoc(doc(db, 'users', user.uid));
        if (!profile.exists()) throw staffAccessError('app/staff-profile-missing');
        if (!['Admin', 'Front Desk'].includes(profile.data().role)) throw staffAccessError('app/staff-role-invalid');
        setCurrentUser({ ...profile.data(), id: user.uid });
      } catch (error) { setCurrentUser(null); setToast({ message: signInMessage(error), type: 'error' }); }
      finally { setAuthReady(true); }
    });
  }, []);

  // Initial Firebase Fetch (if configured)
  useEffect(() => {
    if (!isFirebaseConfigured || !currentUser) return;
    const fetchFirebaseData = async () => {
      try {
        const [dbItems, dbUsers, dbLogs, dbSettings] = await Promise.all([
          readCollection('items'),
          currentUser.role === 'Admin' ? readCollection('users') : Promise.resolve([]),
          readCollection('logs'),
          readSettings(),
        ]);

        setItems(dbItems);

        if (dbUsers.length > 0) {
          setUsers(dbUsers.map((u) => ({ ...u, username: normalizeUsername(u.username) })));
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
          setSettingsState({
            hotelName: dbSettings.hotelName || 'Country Inn & Suites',
            hotelAddress: dbSettings.hotelAddress || '123 Luxury Ave, Suite 100',
            categories: Array.isArray(dbSettings.categories) ? dbSettings.categories : CATEGORIES,
            notifications: dbSettings.notifications || { lowStock: true, outOfStock: true, shiftReport: false },
            emailReports: { ...defaultEmailSettings, ...(dbSettings.emailReports || {}) },
          });
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
  }, [currentUser?.id]);

  // Cloud records are not cached with passwords or trusted as authentication.
  useEffect(() => {
    if (isFirebaseConfigured) return;
    try {
      for (const [key, value] of Object.entries({ items, logs, users, settings, currentUser })) {
        if (value === null) localStorage.removeItem(`cis_${key}`);
        else localStorage.setItem(`cis_${key}`, JSON.stringify(value));
      }
    } catch { setToast({ message: 'Browser storage is full or unavailable. Export your records before closing this page.', type: 'error' }); }
  }, [items, logs, users, settings, currentUser]);
  const setSettings = async (value) => {
    const next = typeof value === 'function' ? value(settings) : value;
    try {
      if (isFirebaseConfigured) await writeSettings(next);
      setSettingsState(next);
    } catch { setToast({ message: 'Settings could not be saved.', type: 'error' }); }
  };

  const login = async (username, password) => {
    if (auth) {
      const result = await signInWithEmailAndPassword(auth, username.trim(), password);
      const profile = await getDoc(doc(db, 'users', result.user.uid));
      if (!profile.exists()) throw staffAccessError('app/staff-profile-missing');
      if (!['Admin', 'Front Desk'].includes(profile.data().role)) throw staffAccessError('app/staff-role-invalid');
      const user = { ...profile.data(), id: result.user.uid };
      setCurrentUser(user); return user;
    }
    if (!import.meta.env.DEV) throw staffAccessError('app/auth-not-configured');
    const user = users.find(u => normalizeUsername(u.username) === normalizeUsername(username) && u.password === password);
    if (user) { setCurrentUser(user); return user; }
    return null;
  };
  const logout = async () => { if (auth) await signOut(auth); setCurrentUser(null); };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Staff CRUD ──
  const addStaff = async (name, username, password, role = 'Front Desk') => {
    if (isFirebaseConfigured) {
      try { const user = await manageCloudStaff({ action: 'create', name, email: username, password, role }); setUsers(prev => [...prev, user]); showToast('Staff account created'); return true; }
      catch (e) { showToast(e.message || 'Unable to create staff account.', 'error'); return false; }
    }
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
  const removeStaff = async userId => {
    try {
      if (userId === currentUser?.id) throw new Error('You cannot remove your own account.');
      if (isFirebaseConfigured) await manageCloudStaff({ action: 'remove', uid: userId });
      setUsers(prev => prev.filter(u => u.id !== userId)); showToast('Staff removed');
    } catch (e) { showToast(e.message || 'Unable to remove staff.', 'error'); }
  };

  // ── Item CRUD ──
  const addItem = async (item) => {
    const newItem = { ...item, id: crypto.randomUUID(), stock: item.stock ?? 0, minStock: item.minStock ?? 5 };
    if (isFirebaseConfigured) await upsertDocById('items', newItem.id, newItem);
    setItems(prev => [...prev, newItem]);
    showToast(`${item.name} added to inventory`);
    return true;
  };

  const updateItem = async (id, updates) => {
    if (isFirebaseConfigured) {
      const current = items.find(i => i.id === id);
      if (current) await upsertDocById('items', id, { ...current, ...updates });
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    showToast('Product updated');
  };

  const importItems = async (rows) => {
    const imported = parseInventory(JSON.stringify(rows), 'json').map(row => ({ ...row, id: crypto.randomUUID() }));
    if (isFirebaseConfigured) await upsertManyDocs('items', imported);
    else localStorage.setItem('cis_items', JSON.stringify([...items, ...imported]));
    setItems(prev => [...prev, ...imported]);
    showToast(`${imported.length} inventory items imported`);
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
    try {
      const shift = getCurrentShift();
      const cart = cartItems.map(entry => ({ ...entry, logId: crypto.randomUUID() }));
      const details = { batchId: crypto.randomUUID(), rateType, paymentMethod, roomNumber: roomNumber || '', notes: notes || '', membershipTier, staffId: currentUser.id, staffName: currentUser.name, shift: shift.id, shiftLabel: shift.label, timestamp: new Date().toISOString() };
      const plan = isFirebaseConfigured ? await issueCloudItems(cart, details) : planIssue(items, cart, details);
      setItems(previous => previous.map(item => plan.updatedItems.find(updated => updated.id === item.id) || item));
      setLogs(previous => [...plan.newLogs, ...previous]);
      showToast(`${cart.length} item(s) issued${roomNumber ? ` → Room ${roomNumber}` : ''}`);
      return true;
    } catch (error) {
      showToast(error.message || 'Transaction could not be saved. Your cart is unchanged.', 'error');
      return false;
    }
  };

  // ── Log CRUD ──
  const updateLog = async (logId, updates) => {
    try {
      const log = logs.find(entry => entry.id === logId);
      const plan = isFirebaseConfigured ? await changeCloudLog(logId, updates) : planLogChange(log, items.find(item => item.id === log?.itemId), updates);
      setLogs(previous => previous.map(entry => entry.id === logId ? plan.updatedLog : entry));
      if (plan.updatedItem) setItems(previous => previous.map(item => item.id === plan.updatedItem.id ? plan.updatedItem : item));
      showToast('Entry updated'); return true;
    } catch (error) { showToast(error.message || 'Unable to update entry.', 'error'); return false; }
  };

  const deleteLog = async (logId) => {
    try {
      const log = logs.find(entry => entry.id === logId);
      const plan = isFirebaseConfigured ? await changeCloudLog(logId, null) : planLogChange(log, items.find(item => item.id === log?.itemId), null);
      setLogs(previous => previous.filter(entry => entry.id !== logId));
      if (plan.updatedItem) setItems(previous => previous.map(item => item.id === plan.updatedItem.id ? plan.updatedItem : item));
      showToast('Entry deleted, stock restored'); return true;
    } catch (error) { showToast(error.message || 'Unable to delete entry.', 'error'); return false; }
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
      currentUser, authReady, items, logs, users, settings, toast,
      login, logout, showToast, 
      addStaff, removeStaff, 
      addItem, updateItem, deleteItem, importItems,
      logCartUsage, clearRevenueData, factoryReset,
      setSettings, updateLog, deleteLog, getShiftStats, getLogsForYear
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
