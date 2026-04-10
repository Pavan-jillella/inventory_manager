import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_ITEMS, DEFAULT_USERS, getCurrentShift, CATEGORIES } from '../data/mockData';
import { supabase } from '../lib/supabase';

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
      if (saved && saved !== 'undefined' && saved !== 'null') return JSON.parse(saved);
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

  // Initial Real Supabase Fetch (If configured)
  useEffect(() => {
    if (!supabase) return;
    const fetchSupabaseData = async () => {
      try {
        const { data: dbItems } = await supabase.from('items').select('*');
        if (dbItems && dbItems.length > 0) setItems(dbItems);

        const { data: dbUsers } = await supabase.from('users').select('*');
        if (dbUsers && dbUsers.length > 0) setUsers(dbUsers);

        const { data: dbLogs } = await supabase.from('logs').select('*');
        if (dbLogs && dbLogs.length > 0) {
          setLogs(dbLogs.sort((a,b) => {
             const tA = a.timestamp || '';
             const tB = b.timestamp || '';
             return tB.localeCompare(tA);
          }));
        }

        const { data: dbSettings } = await supabase.from('settings').select('*').eq('id', 1).single();
        if (dbSettings) {
          setSettings({
            hotelName: dbSettings.hotelName || 'Country Inn & Suites',
            hotelAddress: dbSettings.hotelAddress || '123 Luxury Ave, Suite 100',
            categories: dbSettings.categories || CATEGORIES,
            notifications: dbSettings.notifications || { lowStock: true, outOfStock: true, shiftReport: false }
          });
        }
      } catch (e) {
        console.error('Supabase fetch error:', e);
      }
    };
    fetchSupabaseData();
  }, []);

  // Sync to LocalStorage (Immediate persistence)
  useEffect(() => { localStorage.setItem('cis_items', JSON.stringify(items)); }, [items]);
  useEffect(() => { localStorage.setItem('cis_logs', JSON.stringify(logs)); }, [logs]);
  useEffect(() => { localStorage.setItem('cis_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { 
    localStorage.setItem('cis_settings', JSON.stringify(settings)); 
    if (supabase) {
      const syncSettings = async () => {
        try { await supabase.from('settings').upsert({ id: 1, ...settings }); } catch (e) {}
      };
      syncSettings();
    }
  }, [settings]);

  const login = (username, password) => {
    // Admin login with generic keys if none match, for ease of use
    const user = users.find(u => u.username === username && u.password === password);
    if (user) { setCurrentUser(user); return user; }
    // Fallback if users empty/broken
    if (username === 'admin' && password === 'admin') {
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
    const newUser = { id: Date.now(), name, username, password, role };
    setUsers(prev => [...prev, newUser]);
    if (supabase) await supabase.from('users').insert([{ name, username, password, role }]);
    showToast(`${name} added successfully`);
    return true;
  };
  const removeStaff = async (userId) => { 
    setUsers(prev => prev.filter(u => u.id !== userId)); 
    if (supabase) await supabase.from('users').delete().eq('id', userId);
    showToast('Staff removed'); 
  };

  // ── Item CRUD ──
  const addItem = async (item) => {
    let newItem = { ...item, stock: item.stock || 0, minStock: item.minStock || 5 };
    if (supabase) {
      const { data } = await supabase.from('items').insert([newItem]).select();
      if (data && data.length > 0) newItem = data[0];
    } else {
      newItem.id = Date.now();
    }
    setItems(prev => [...prev, newItem]);
    showToast(`${item.name} added to inventory`);
    return true;
  };

  const updateItem = async (id, updates) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
    if (supabase) await supabase.from('items').update(updates).eq('id', id);
    showToast('Product updated');
  };

  const deleteItem = async (id) => {
    setItems(prev => prev.filter(i => i.id !== id));
    if (supabase) await supabase.from('items').delete().eq('id', id);
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

    // If using supabase, we should arguably execute this decrement on DB
    if (supabase) {
      for (const ci of cartItems) {
        const currentItem = items.find(i => i.id === ci.item.id);
        if (currentItem) {
          await supabase.from('items').update({ stock: currentItem.stock - ci.quantity }).eq('id', ci.item.id);
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
    if (supabase) await supabase.from('logs').insert(newLogs);

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

    if (supabase && updatedLog) {
      await supabase.from('logs').update(updatedLog).eq('id', logId);
      if (stockDiff !== 0 && itemId) {
        const currentItem = items.find(i => i.id === itemId);
        if (currentItem) await supabase.from('items').update({ stock: currentItem.stock + stockDiff }).eq('id', itemId);
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
      if (supabase) {
        const currentItem = items.find(i => i.id === log.itemId);
        if (currentItem) await supabase.from('items').update({ stock: currentItem.stock + log.quantity }).eq('id', log.itemId);
      }
    }
    setLogs(prev => prev.filter(l => l.id !== logId));
    if (supabase) await supabase.from('logs').delete().eq('id', logId);
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
