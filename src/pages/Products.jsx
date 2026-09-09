import { prepareProductImage } from '../lib/productImage';
import { InventoryImport } from '../components/InventoryImport';
import { parseInventory } from '../lib/operations';
import './Operations.css';
import './DashboardRefresh.css';
import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Package, LayoutGrid, List, Table, UploadCloud } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { isFirebaseStorageConfigured, uploadProductImage } from '../lib/firebase';

const emptyProduct = { name: '', category: 'Drinks', stock: 0, minStock: 5, purchaseRate: 0, staffRate: 0, guestRate: 0, image: '' };

export const Products = () => {
  const { items, addItem, updateItem, deleteItem, settings, showToast } = useAppContext();
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [viewMode, setViewMode] = useState('table'); // 'table', 'grid', 'list'
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const categoryOptions = (settings.categories && settings.categories.length > 0)
    ? settings.categories
    : [form.category || 'General'];

  const filteredItems = items.filter(item => categoryFilter === 'All' || item.category === categoryFilter).filter(item => stockFilter === 'All' || (stockFilter === 'Low stock' ? item.stock <= item.minStock : item.stock === 0)).filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => sortBy === 'stock' ? a.stock - b.stock || a.name.localeCompare(b.name) : a.name.localeCompare(b.name));

  const openAdd = () => {
    setEditingItem(null);
    setForm({ ...emptyProduct, category: settings.categories?.[0] || 'General' });
    setShowModal(true);
  };
  const openEdit = (item) => {
    setEditingItem(item);
    setForm({ name: item.name, category: item.category, stock: item.stock, minStock: item.minStock, purchaseRate: item.purchaseRate || 0, staffRate: item.staffRate || 0, guestRate: item.guestRate || 0, image: item.image || '' });
    setShowModal(true);
  };
  const handleDelete = async (id) => {
    if (window.confirm('Delete this product?')) {
      await deleteItem(id);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || isUploadingImage || isSaving) return;
    setIsSaving(true);
    try {
      const validated = { ...parseInventory(JSON.stringify([form]), 'json')[0], image: form.image };
      if (editingItem) await updateItem(editingItem.id, validated);
      else await addItem(validated);
      setShowModal(false);
    } catch (e) { showToast(e.message || 'Unable to save product.', 'error'); }
    finally { setIsSaving(false); }
  };

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const getStockStatus = (item) => {
    if (item.stock === 0) return { label: 'Out', cls: 'badge-danger' };
    if (item.stock <= item.minStock) return { label: 'Low', cls: 'badge-warning' };
    return { label: 'OK', cls: 'badge-success' };
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file || isUploadingImage) return;
    setIsUploadingImage(true); setUploadProgress(0);
    try {
      const prepared = await prepareProductImage(file);
      const url = isFirebaseStorageConfigured
        ? await uploadProductImage(prepared.blob, setUploadProgress)
        : prepared.dataUrl;
      if (!url) throw new Error('Upload failed. Please try again.');
      updateForm('image', url); setUploadProgress(100);
      showToast('Image ready');
    } catch (e) { showToast(e.message || 'Unable to process image.', 'error'); }
    finally { setIsUploadingImage(false); }
  };

  const onDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    handleImageUpload(e);
  };

  return (
    <div className="suite-page inventory-dashboard" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="app-header">
        <div>
          <h1>Inventory</h1>
          <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Manage products, stock levels, and pricing.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Product</button>
      </div>

      {/* Add/Edit Modal */}
      <div className="ops-stats inventory-overview"><article><span>Products in inventory</span><strong>{items.length}</strong><small>Across {new Set(items.map(i => i.category)).size} categories</small></article><article><span>Needs replenishment</span><strong>{items.filter(i => i.stock <= i.minStock).length}</strong><small>At or below minimum stock</small></article><article><span>Stock purchase value</span><strong>${items.reduce((sum, i) => sum + i.stock * (i.purchaseRate || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong><small>On-hand quantity × purchase rate</small></article></div>
      <details className="ops-card inventory-import"><summary>Import inventory from a file <span>CSV, TSV or JSON · review before saving</span></summary><InventoryImport /></details>
      <div className="inventory-filters" aria-label="Filter inventory by stock">{['All', 'Low stock', 'Out of stock'].map(filter => <button key={filter} className="btn btn-secondary" aria-pressed={stockFilter === filter} onClick={() => setStockFilter(filter)}>{filter}</button>)}<span>{filteredItems.length} products shown</span></div>
      <div className="suite-toolbar"><label className="ops-field"><span>Category filter</span><select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>{['All', ...new Set(items.map(i => i.category))].map(c => <option key={c}>{c}</option>)}</select></label><label className="ops-field"><span>Sort inventory</span><select value={sortBy} onChange={e => setSortBy(e.target.value)}><option value="name">Name A–Z</option><option value="stock">Lowest stock first</option></select></label></div>
      <AnimatePresence>
        {showModal && (
          <Motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <Motion.div
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
                  {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="input-group">
                <label>Product Image</label>
                <div 
                  onDragOver={onDragOver} 
                  onDrop={onDrop}
                  style={{ 
                    border: '2px dashed var(--border-color)', borderRadius: '0.75rem', padding: '1rem', 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', 
                    background: '#fafafa', cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
                  }}
                  onClick={(event) => { if (!event.target.closest('input')) document.getElementById('imageUpload').click(); }}
                >
                  <input type="file" id="imageUpload" aria-label="Upload product image" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleImageUpload} />
                  {form.image ? (
                    <div style={{ position: 'relative', width: '100%', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <img src={form.image} alt="" style={{ width: '60px', height: '60px', borderRadius: '0.5rem', objectFit: 'contain', background: '#fff', border: '1px solid var(--border-color)' }} />
                      <div style={{ flex: 1 }}>
                        <input type="text" className="input" value={form.image} onChange={e => updateForm('image', e.target.value)} onClick={e => e.stopPropagation()} placeholder="Or paste image link here..." style={{ width: '100%', fontSize: '0.75rem' }} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud size={24} style={{ color: 'var(--text-muted)' }} />
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Click or Drag & Drop to upload image</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Or paste a link below</div>
                      <input type="text" className="input" value={form.image} onChange={e => { e.stopPropagation(); updateForm('image', e.target.value); }} onClick={e => e.stopPropagation()} placeholder="https://..." style={{ width: '100%', marginTop: '0.5rem', fontSize: '0.75rem' }} />
                    </>
                  )}
                </div>
                {isUploadingImage && (
                  <div style={{ marginTop: '0.65rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Uploading...</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{uploadProgress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '7px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--accent-gradient)', transition: 'width 0.2s ease' }} />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '0.75rem' }}>
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
                <button className="btn btn-primary" onClick={() => void handleSave()} style={{ flex: 1, opacity: form.name.trim() && !isUploadingImage ? 1 : 0.5 }} disabled={!form.name.trim() || isUploadingImage || isSaving}>
                  {isUploadingImage ? 'Uploading Image...' : editingItem ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="input" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', paddingLeft: '2.75rem' }} placeholder="Search products..." />
        </div>
        <div style={{ display: 'flex', gap: '0.2rem', padding: '0.2rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
          <button aria-label="View inventory as table" onClick={() => setViewMode('table')} style={{ padding: '0.4rem', borderRadius: '0.35rem', background: viewMode === 'table' ? 'white' : 'transparent', boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', color: viewMode === 'table' ? 'var(--accent-dark)' : 'var(--text-muted)' }}><Table size={16} /></button>
          <button aria-label="View inventory as list" onClick={() => setViewMode('list')} style={{ padding: '0.4rem', borderRadius: '0.35rem', background: viewMode === 'list' ? 'white' : 'transparent', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', color: viewMode === 'list' ? 'var(--accent-dark)' : 'var(--text-muted)' }}><List size={16} /></button>
          <button aria-label="View inventory as grid" onClick={() => setViewMode('grid')} style={{ padding: '0.4rem', borderRadius: '0.35rem', background: viewMode === 'grid' ? 'white' : 'transparent', boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', color: viewMode === 'grid' ? 'var(--accent-dark)' : 'var(--text-muted)' }}><LayoutGrid size={16} /></button>
        </div>
      </div>

      {viewMode === 'table' && (
        <div style={{ background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', flex: 1, overflowY: 'auto', boxShadow: 'var(--shadow-soft)' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th><th>Category</th><th>Stock</th><th>Purchase</th><th>Staff</th><th>Guest</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No products found.</td></tr>
              ) : (
                filteredItems.map(item => {
                  const status = getStockStatus(item);
                  return (
                    <Motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {item.image ? <img src={item.image} alt={item.name} style={{ width: '32px', height: '32px', borderRadius: '0.4rem', objectFit: 'contain', background: '#fff', border: '1px solid var(--border-color)' }} /> : <div style={{ width: '32px', height: '32px', borderRadius: '0.4rem', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={14} style={{ color: 'var(--accent-light)' }} /></div>}
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
                    </Motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {viewMode === 'grid' && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem', alignContent: 'start' }}>
          {filteredItems.map(item => {
            const status = getStockStatus(item);
            return (
              <Motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '1.25rem', boxShadow: 'var(--shadow-soft)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  {item.image ? <img src={item.image} alt={item.name} style={{ width: '48px', height: '48px', borderRadius: '0.5rem', objectFit: 'contain', background: '#fff' }} /> : <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={20} style={{ color: '#9ca3af' }} /></div>}
                  <span className={`badge ${status.cls}`}>{status.label}</span>
                </div>
                <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.25rem 0', fontWeight: 600 }}>{item.name}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.category}</span>
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '0.5rem' }}>
                  <div><div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Stock</div><div style={{ fontWeight: 600 }}>{item.stock}</div></div>
                  <div><div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Guest Rate</div><div style={{ fontWeight: 600, color: 'var(--accent-dark)' }}>${item.guestRate?.toFixed(2)}</div></div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button className="btn btn-outline" style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => openEdit(item)}>Edit</button>
                  <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--danger-color)', borderColor: '#fecaca' }} onClick={() => handleDelete(item.id)}><Trash2 size={14} /></button>
                </div>
              </Motion.div>
            )
          })}
        </div>
      )}

      {viewMode === 'list' && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredItems.map(item => {
            const status = getStockStatus(item);
            return (
              <Motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {item.image ? <img src={item.image} alt={item.name} style={{ width: '40px', height: '40px', borderRadius: '0.5rem', objectFit: 'contain', background: '#fff' }} /> : <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={18} style={{ color: '#9ca3af' }} /></div>}
                  <div>
                    <h3 style={{ fontSize: '1rem', margin: '0 0 0.2rem 0', fontWeight: 600 }}>{item.name}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.category}</span>
                      <span className={`badge ${status.cls}`}>{status.label}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Stock</div><div style={{ fontWeight: 600 }}>{item.stock} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {item.minStock}</span></div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Guest Rate</div><div style={{ fontWeight: 600, color: 'var(--accent-dark)' }}>${item.guestRate?.toFixed(2)}</div></div>
                  <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Staff Rate</div><div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>${item.staffRate?.toFixed(2)}</div></div>
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)}><Edit2 size={16} /></button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-color)' }} onClick={() => handleDelete(item.id)}><Trash2 size={16} /></button>
                  </div>
                </div>
              </Motion.div>
            )
          })}
        </div>
      )}
    </div>
  );
};
