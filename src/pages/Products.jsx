import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const Products = () => {
  const { items } = useAppContext();
  const [search, setSearch] = useState('');

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const getStockStatus = (item) => {
    if (item.stock === 0) return { label: 'Out', cls: 'badge-danger' };
    if (item.stock <= item.minStock) return { label: 'Low', cls: 'badge-warning' };
    return { label: 'Healthy', cls: 'badge-success' };
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="app-header">
        <div>
          <h1>Inventory</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Manage products, stock levels, and thresholds.</p>
        </div>
        <button className="btn btn-primary"><Plus size={16} /> Add Product</button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <div style={{ position: 'relative', maxWidth: '360px' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="input" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: '100%', paddingLeft: '2.75rem' }} placeholder="Search products..." />
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', flex: 1, overflowY: 'auto', boxShadow: 'var(--shadow-soft)' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Min Stock</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => {
              const status = getStockStatus(item);
              return (
                <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img src={item.image} alt={item.name} style={{ width: '36px', height: '36px', borderRadius: '0.5rem', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                      <span style={{ fontWeight: 500 }}>{item.name}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-accent">{item.category}</span></td>
                  <td style={{ fontWeight: 600 }}>{item.stock}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{item.minStock}</td>
                  <td><span className={`badge ${status.cls}`}>{status.label}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '0.4rem' }}><Edit2 size={14} /></button>
                      <button className="btn btn-ghost btn-sm" style={{ padding: '0.4rem', color: 'var(--danger-color)' }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
