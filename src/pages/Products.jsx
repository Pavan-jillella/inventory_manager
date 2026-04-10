import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Package, Image } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CATEGORIES } from '../data/mockData';

const emptyProduct = { name: '', category: 'Drinks', stock: 0, minStock: 5, purchaseRate: 0, staffRate: 0, guestRate: 0, image: '' };

export const Products = () => {
  const { items, addItem, updateItem, deleteItem } = useAppContext();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyProduct);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditingItem(null); setForm(emptyProduct); setShowModal(true); };
  const openEdit = (item) => {
    setEditingItem(item);
    setForm({ name: item.name, category: item.category, stock: item.stock, minStock: item.minStock, purchaseRate: item.purchaseRate || 0, staffRate: item.staffRate || 0, guestRate: item.guestRate || 0, image: item.image || '' });
    setShowModal(true);
  };
  const handleDelete = (id) => { if (window.confirm('Delete this product?')) deleteItem(id); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingItem) {
      updateItem(editingItem.id, form);
    } else {
      addItem(form);
    }
    setShowModal(false);
  };

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const getStockStatus = (item) => {
    if (item.stock === 0) return { label: 'Out', cls: 'badge-danger' };
    if (item.stock <= item.minStock) return { label: 'Low', cls: 'badge-warning' };
    return { label: 'OK', cls: 'badge-success' };
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="app-header">
        <div>
          <h1>Inventory</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Manage products, stock levels, and pricing.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Product</button>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{editingItem ? 'Edit Product' : 'New Product'}</h2>
                <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
              </div>

              <div className="input-group">
                <label>Product Name</label>
                <input type="text" className="input" value={form.name} onChange={e => updateForm('name', e.target.value)} placeholder="e.g. Coca Cola" style={{ width: '100%' }} autoFocus />
              </div>

              <div className="input-group">
                <label>Category</label>
                <select className="select" value={form.category} onChange={e => updateForm('category', e.target.value)} style={{ width: '100%' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label>Image URL</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input type="text" className="input" value={form.image} onChange={e => updateForm('image', e.target.value)} placeholder="https://..." style={{ flex: 1 }} />
                  {form.image && <img src={form.image} alt="" style={{ width: '40px', height: '40px', borderRadius: '0.5rem', objectFit: 'cover', border: '1px solid var(--border-color)' }} />}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="input-group">
                  <label>Current Stock</label>
                  <input type="number" className="input" value={form.stock} onChange={e => updateForm('stock', parseInt(e.target.value) || 0)} min="0" style={{ width: '100%' }} />
                </div>
                <div className="input-group">
                  <label>Min Stock (Alert)</label>
                  <input type="number" className="input" value={form.minStock} onChange={e => updateForm('minStock', parseInt(e.target.value) || 0)} min="0" style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="input-group">
                  <label>Purchase Rate ($)</label>
                  <input type="number" className="input" value={form.purchaseRate} onChange={e => updateForm('purchaseRate', parseFloat(e.target.value) || 0)} min="0" step="0.01" style={{ width: '100%' }} />
                </div>
                <div className="input-group">
                  <label>Staff Rate ($)</label>
                  <input type="number" className="input" value={form.staffRate} onChange={e => updateForm('staffRate', parseFloat(e.target.value) || 0)} min="0" step="0.01" style={{ width: '100%' }} />
                </div>
                <div className="input-group">
                  <label>Guest Rate ($)</label>
                  <input type="number" className="input" value={form.guestRate} onChange={e => updateForm('guestRate', parseFloat(e.target.value) || 0)} min="0" step="0.01" style={{ width: '100%' }} />
                </div>
              </div>

              {form.purchaseRate > 0 && form.guestRate > 0 && (
                <div style={{ padding: '0.6rem 0.85rem', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--success-color)' }}>
                  Profit Margin: <strong>${(form.guestRate - form.purchaseRate).toFixed(2)}</strong> guest / <strong>${(form.staffRate - form.purchaseRate).toFixed(2)}</strong> staff per unit
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-ghost" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} style={{ flex: 1, opacity: form.name.trim() ? 1 : 0.5 }} disabled={!form.name.trim()}>
                  {editingItem ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative', maxWidth: '360px' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="input" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', paddingLeft: '2.75rem' }} placeholder="Search products..." />
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', flex: 1, overflowY: 'auto', boxShadow: 'var(--shadow-soft)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Purchase</th>
              <th>Staff</th>
              <th>Guest</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No products found.</td></tr>
            ) : (
              filteredItems.map(item => {
                const status = getStockStatus(item);
                return (
                  <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        {item.image ? (
                          <img src={item.image} alt={item.name} style={{ width: '32px', height: '32px', borderRadius: '0.4rem', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                        ) : (
                          <div style={{ width: '32px', height: '32px', borderRadius: '0.4rem', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={14} style={{ color: 'var(--accent-light)' }} /></div>
                        )}
                        <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.name}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-accent">{item.category}</span></td>
                    <td style={{ fontWeight: 600 }}>{item.stock}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>${item.purchaseRate?.toFixed(2) || '—'}</td>
                    <td style={{ fontSize: '0.85rem' }}>${item.staffRate?.toFixed(2) || '—'}</td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-dark)', fontSize: '0.85rem' }}>${item.guestRate?.toFixed(2) || '—'}</td>
                    <td><span className={`badge ${status.cls}`}>{status.label}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.25rem' }}>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '0.4rem' }} onClick={() => openEdit(item)}><Edit2 size={14} /></button>
                        <button className="btn btn-ghost btn-sm" style={{ padding: '0.4rem', color: 'var(--danger-color)' }} onClick={() => handleDelete(item.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
