import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Building2, Bell, Tag, Plus, X } from 'lucide-react';
import { CATEGORIES } from '../data/mockData';

export const SettingsPage = () => {
  const [hotelName, setHotelName] = useState('Grand Palace Hotel');
  const [hotelAddress, setHotelAddress] = useState('123 Luxury Ave, Suite 100');
  const [categories, setCategories] = useState(CATEGORIES);
  const [newCat, setNewCat] = useState('');
  const [notifications, setNotifications] = useState({ lowStock: true, outOfStock: true, shiftReport: false });
  const [saved, setSaved] = useState(false);

  const addCategory = () => {
    if (newCat.trim() && !categories.includes(newCat.trim())) {
      setCategories([...categories, newCat.trim()]);
      setNewCat('');
    }
  };

  const removeCategory = (cat) => {
    setCategories(categories.filter(c => c !== cat));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div style={{ maxWidth: '720px' }}>
      <div className="app-header">
        <div>
          <h1>Settings</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Configure hotel details, categories, and notifications.</p>
        </div>
        <button className="btn btn-primary" onClick={handleSave}>
          <Save size={16} /> {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Hotel Details */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Building2 size={18} style={{ color: 'var(--accent-color)' }} />
          <h3 style={{ margin: 0 }}>Hotel Details</h3>
        </div>
        <div className="input-group">
          <label>Hotel Name</label>
          <input type="text" className="input" value={hotelName} onChange={e => setHotelName(e.target.value)} />
        </div>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label>Address</label>
          <input type="text" className="input" value={hotelAddress} onChange={e => setHotelAddress(e.target.value)} />
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Tag size={18} style={{ color: 'var(--accent-color)' }} />
          <h3 style={{ margin: 0 }}>Item Categories</h3>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {categories.map(cat => (
            <span key={cat} className="badge badge-accent" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              {cat}
              <button onClick={() => removeCategory(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--accent-dark)' }}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input type="text" className="input" value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="New category..." onKeyDown={e => e.key === 'Enter' && addCategory()} style={{ flex: 1 }} />
          <button className="btn btn-outline btn-sm" onClick={addCategory}><Plus size={14} /> Add</button>
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Bell size={18} style={{ color: 'var(--accent-color)' }} />
          <h3 style={{ margin: 0 }}>Notifications</h3>
        </div>
        {[
          { key: 'lowStock', label: 'Low Stock Alerts', desc: 'Notify when items fall below minimum threshold' },
          { key: 'outOfStock', label: 'Out of Stock Alerts', desc: 'Notify when items reach zero stock' },
          { key: 'shiftReport', label: 'Shift Reports', desc: 'Send usage summary at end of each shift' },
        ].map(item => (
          <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.label}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{item.desc}</div>
            </div>
            <label style={{ position: 'relative', width: '44px', height: '24px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={notifications[item.key]}
                onChange={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute', inset: 0, borderRadius: '999px', transition: 'all 0.2s ease',
                background: notifications[item.key] ? 'var(--accent-gradient)' : '#e5e7eb',
              }}>
                <span style={{
                  position: 'absolute', top: '2px', left: notifications[item.key] ? '22px' : '2px',
                  width: '20px', height: '20px', borderRadius: '50%', background: 'white',
                  transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                }} />
              </span>
            </label>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
