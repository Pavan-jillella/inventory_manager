import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Package, LayoutGrid, List, Table, UploadCloud } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { isFirebaseStorageConfigured, uploadProductImage } from '../lib/firebase';

const emptyProduct = { name: '', category: 'Drinks', stock: 0, minStock: 5, purchaseRate: 0, staffRate: 0, guestRate: 0, image: '' };

export const Products = () => {
  const { items, addItem, updateItem, deleteItem, settings } = useAppContext();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [viewMode, setViewMode] = useState('table'); // 'table', 'grid', 'list'
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const categoryOptions = (settings.categories && settings.categories.length > 0)
    ? settings.categories
    : [form.category || 'General'];

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

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
    if (!form.name.trim() || isUploadingImage) return;
    if (editingItem) {
      await updateItem(editingItem.id, form);
    } else {
      await addItem(form);
    }
    setShowModal(false);
  };

  const updateForm = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const getStockStatus = (item) => {
    if (item.stock === 0) return { label: 'Out', cls: 'badge-danger' };
    if (item.stock <= item.minStock) return { label: 'Low', cls: 'badge-warning' };
    return { label: 'OK', cls: 'badge-success' };
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setIsUploadingImage(true);
    try {
      const imageUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onerror = () => resolve('');
        reader.onload = (event) => {
          const img = new window.Image();
          img.onerror = () => resolve('');
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 400;
            let width = img.width;
            let height = img.height;
            if (width > height && width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
            else if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }

            canvas.width = width; canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, width, height);

            const fallbackDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            if (!isFirebaseStorageConfigured) {
              resolve(fallbackDataUrl);
              return;
            }

            canvas.toBlob(async (blob) => {
              if (!blob) {
                resolve(fallbackDataUrl);
                return;
              }
              try {
                const url = await uploadProductImage(blob);
                resolve(url || fallbackDataUrl);
              } catch {
                resolve(fallbackDataUrl);
              }
            }, 'image/jpeg', 0.8);
          };
          img.src = event.target?.result;
        };
        reader.readAsDataURL(file);
      });
      updateForm('image', imageUrl || '');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const onDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    handleImageUpload(e);
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
                  onClick={() => document.getElementById('imageUpload').click()}
                >
                  <input type="file" id="imageUpload" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                  {form.image ? (
                    <div style={{ position: 'relative', width: '100%', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <img src={form.image} alt="" style={{ width: '60px', height: '60px', borderRadius: '0.5rem', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
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
                <button className="btn btn-primary" onClick={() => void handleSave()} style={{ flex: 1, opacity: form.name.trim() && !isUploadingImage ? 1 : 0.5 }} disabled={!form.name.trim() || isUploadingImage}>
                  {isUploadingImage ? 'Uploading Image...' : editingItem ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="input" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', paddingLeft: '2.75rem' }} placeholder="Search products..." />
        </div>
        <div style={{ display: 'flex', gap: '0.2rem', padding: '0.2rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
          <button onClick={() => setViewMode('table')} style={{ padding: '0.4rem', borderRadius: '0.35rem', background: viewMode === 'table' ? 'white' : 'transparent', boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', color: viewMode === 'table' ? 'var(--accent-dark)' : 'var(--text-muted)' }}><Table size={16} /></button>
          <button onClick={() => setViewMode('list')} style={{ padding: '0.4rem', borderRadius: '0.35rem', background: viewMode === 'list' ? 'white' : 'transparent', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', color: viewMode === 'list' ? 'var(--accent-dark)' : 'var(--text-muted)' }}><List size={16} /></button>
          <button onClick={() => setViewMode('grid')} style={{ padding: '0.4rem', borderRadius: '0.35rem', background: viewMode === 'grid' ? 'white' : 'transparent', boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', color: viewMode === 'grid' ? 'var(--accent-dark)' : 'var(--text-muted)' }}><LayoutGrid size={16} /></button>
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
                    <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          {item.image ? <img src={item.image} alt={item.name} style={{ width: '32px', height: '32px', borderRadius: '0.4rem', objectFit: 'cover', border: '1px solid var(--border-color)' }} /> : <div style={{ width: '32px', height: '32px', borderRadius: '0.4rem', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={14} style={{ color: 'var(--accent-light)' }} /></div>}
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
      )}

      {viewMode === 'grid' && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem', alignContent: 'start' }}>
          {filteredItems.map(item => {
            const status = getStockStatus(item);
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '1.25rem', boxShadow: 'var(--shadow-soft)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  {item.image ? <img src={item.image} style={{ width: '48px', height: '48px', borderRadius: '0.5rem', objectFit: 'cover' }} /> : <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={20} style={{ color: '#9ca3af' }} /></div>}
                  <span className={`badge ${status.cls}`}>{status.label}</span>
                </div>
                <h3 style={{ fontSize: '1.05rem', margin: '0 0 0.25rem 0', fontWeight: 600 }}>{item.name}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.category}</span>
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f9fafb', borderRadius: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div><div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Stock</div><div style={{ fontWeight: 600 }}>{item.stock}</div></div>
                  <div><div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Guest Rate</div><div style={{ fontWeight: 600, color: 'var(--accent-dark)' }}>${item.guestRate?.toFixed(2)}</div></div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                  <button className="btn btn-outline" style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem' }} onClick={() => openEdit(item)}>Edit</button>
                  <button className="btn btn-outline" style={{ padding: '0.4rem', color: 'var(--danger-color)', borderColor: '#fecaca' }} onClick={() => handleDelete(item.id)}><Trash2 size={14} /></button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {viewMode === 'list' && (
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredItems.map(item => {
            const status = getStockStatus(item);
            return (
              <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ background: 'white', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--shadow-soft)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {item.image ? <img src={item.image} style={{ width: '40px', height: '40px', borderRadius: '0.5rem', objectFit: 'cover' }} /> : <div style={{ width: '40px', height: '40px', borderRadius: '0.5rem', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={18} style={{ color: '#9ca3af' }} /></div>}
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
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  );
};
