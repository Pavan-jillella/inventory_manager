import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Bell, Tag, Plus, X, Mail, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useState } from 'react';

export const SettingsPage = () => {
  const { settings, setSettings, showToast, clearRevenueData, factoryReset } = useAppContext();
  const [newCat, setNewCat] = useState('');
  const [isDeletingRevenue, setIsDeletingRevenue] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const updateSetting = (path, value) => {
    setSettings(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      if (keys.length === 1) updated[keys[0]] = value;
      else if (keys.length === 2) updated[keys[0]] = { ...updated[keys[0]], [keys[1]]: value };
      return updated;
    });
    showToast('Settings updated', 'success');
  };

  const addCategory = () => {
    if (newCat.trim() && !settings.categories.includes(newCat.trim())) {
      updateSetting('categories', [...settings.categories, newCat.trim()]);
      setNewCat('');
    }
  };

  const removeCategory = (cat) => {
    updateSetting('categories', settings.categories.filter(c => c !== cat));
  };

  const clearAllRevenue = async () => {
    if (!window.confirm('Delete all old revenue/activity data? This removes all logs permanently.')) return;
    setIsDeletingRevenue(true);
    try {
      await clearRevenueData();
    } finally {
      setIsDeletingRevenue(false);
    }
  };

  return (
    <div style={{ maxWidth: '720px' }}>
      <div className="app-header">
        <div>
          <h1>Settings</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Changes save automatically in real-time.</p>
        </div>
        <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Auto-Save On</span>
      </div>

      {/* Hotel Details */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Building2 size={18} style={{ color: 'var(--accent-color)' }} />
          <h3 style={{ margin: 0 }}>Hotel Details</h3>
        </div>
        <div className="input-group">
          <label>Hotel Name</label>
          <input type="text" className="input" value={settings.hotelName} onChange={e => updateSetting('hotelName', e.target.value)} />
        </div>
        <div className="input-group" style={{ marginBottom: 0 }}>
          <label>Address</label>
          <input type="text" className="input" value={settings.hotelAddress} onChange={e => updateSetting('hotelAddress', e.target.value)} />
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Tag size={18} style={{ color: 'var(--accent-color)' }} />
          <h3 style={{ margin: 0 }}>Item Categories</h3>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
          {settings.categories.map(cat => (
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
              <input type="checkbox" checked={settings.notifications[item.key]} onChange={() => updateSetting(`notifications.${item.key}`, !settings.notifications[item.key])} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: 'absolute', inset: 0, borderRadius: '999px', transition: 'all 0.2s ease', background: settings.notifications[item.key] ? 'var(--accent-gradient)' : '#e5e7eb' }}>
                <span style={{ position: 'absolute', top: '2px', left: settings.notifications[item.key] ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
              </span>
            </label>
          </div>
        ))}
      </motion.div>

      {/* Daily Email Reports */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-soft)', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <Mail size={18} style={{ color: 'var(--accent-color)' }} />
          <h3 style={{ margin: 0 }}>Automated Daily Reports</h3>
        </div>
        <div className="input-group">
          <label>Enable Daily 7:00 AM Report</label>
          <label style={{ position: 'relative', width: '44px', height: '24px', cursor: 'pointer', display: 'inline-block' }}>
            <input
              type="checkbox"
              checked={Boolean(settings.emailReports?.enabled)}
              onChange={() => updateSetting('emailReports.enabled', !settings.emailReports?.enabled)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{ position: 'absolute', inset: 0, borderRadius: '999px', transition: 'all 0.2s ease', background: settings.emailReports?.enabled ? 'var(--accent-gradient)' : '#e5e7eb' }}>
              <span style={{ position: 'absolute', top: '2px', left: settings.emailReports?.enabled ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
            </span>
          </label>
          <p className="text-secondary" style={{ fontSize: '0.78rem', marginTop: '0.4rem' }}>
            Sends one combined sheet-like report for Morning, Afternoon, and Night shifts at 7:00 AM.
          </p>
        </div>

        <div className="input-group" style={{ marginBottom: '0.75rem' }}>
          <label>Recipient Emails (comma separated)</label>
          <input
            type="text"
            className="input"
            value={settings.emailReports?.recipients || ''}
            onChange={(e) => updateSetting('emailReports.recipients', e.target.value)}
            placeholder="manager@hotel.com, owner@hotel.com"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Time</label>
            <input
              type="time"
              className="input"
              value={settings.emailReports?.scheduleTime || '07:00'}
              onChange={(e) => updateSetting('emailReports.scheduleTime', e.target.value)}
            />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label>Time Zone</label>
            <input
              type="text"
              className="input"
              value={settings.emailReports?.timeZone || 'America/New_York'}
              onChange={(e) => updateSetting('emailReports.timeZone', e.target.value)}
              placeholder="America/New_York"
            />
          </div>
        </div>
      </motion.div>

      {/* Data Cleanup */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ background: 'white', border: '1px solid #fecaca', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-soft)', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Trash2 size={18} style={{ color: 'var(--danger-color)' }} />
          <h3 style={{ margin: 0, color: 'var(--danger-color)' }}>Data Cleanup</h3>
        </div>
        <p className="text-secondary" style={{ fontSize: '0.82rem', marginBottom: '1.5rem' }}>
          Careful: These actions are permanent. Use "Factory Reset" to wipe everything clean for your client.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button className="btn btn-outline" onClick={() => void clearAllRevenue()} disabled={isDeletingRevenue} style={{ borderColor: '#fecaca', color: 'var(--danger-color)', alignSelf: 'flex-start' }}>
            <Trash2 size={14} /> {isDeletingRevenue ? 'Deleting...' : 'Delete All Old Revenue Data'}
          </button>
          
          <button 
            className="btn btn-danger" 
            onClick={async () => {
              if (window.confirm('FACTORY RESET: This will delete ALL products, ALL staff, and ALL logs from both your browser and the cloud database. The client will receive a 100% empty website. Continue?')) {
                setIsResetting(true);
                await factoryReset();
                setIsResetting(false);
                window.location.reload();
              }
            }} 
            disabled={isResetting}
            style={{ alignSelf: 'flex-start' }}
          >
            <Trash2 size={14} /> {isResetting ? 'Resetting Everything...' : 'Factory Reset (Wipe Entire Website Clean)'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
