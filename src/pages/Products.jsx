import { prepareProductImage } from '../lib/productImage';
import { InventoryCatalog } from '../components/InventoryCatalog';
import { InventoryImportDialog } from '../components/InventoryImportDialog';
import { parseInventory } from '../lib/operations';
import './Operations.css';
import './DashboardRefresh.css';
import React, { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { X, UploadCloud } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { isFirebaseConfigured, isFirebaseStorageConfigured, uploadProductImage } from '../lib/firebase';

const emptyProduct = { name: '', category: 'Drinks', stock: 0, minStock: 5, purchaseRate: 0, staffRate: 0, guestRate: 0, image: '' };

export const Products = () => {
  const { items, addItem, updateItem, deleteItem, settings, showToast } = useAppContext();
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(emptyProduct);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageError, setImageError] = useState('');
  const categoryOptions = (settings.categories && settings.categories.length > 0)
    ? settings.categories
    : [form.category || 'General'];

  const openAdd = () => {
    setImageError('');
    setEditingItem(null);
    setForm({ ...emptyProduct, category: settings.categories?.[0] || 'General' });
    setShowModal(true);
  };
  const openEdit = (item) => {
    setImageError('');
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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0] || e.dataTransfer?.files?.[0];
    if (e.target.type === 'file') e.target.value = '';
    if (!file || isUploadingImage) return;
    setIsUploadingImage(true); setUploadProgress(0); setImageError('');
    try {
      if (isFirebaseConfigured && !isFirebaseStorageConfigured) throw new Error('Shared image storage is not configured. Contact your administrator.');
      const prepared = await prepareProductImage(file);
      const url = isFirebaseStorageConfigured
        ? await uploadProductImage(prepared.blob, setUploadProgress)
        : prepared.dataUrl;
      if (!url) throw new Error('Upload failed. Please try again.');
      updateForm('image', url); setUploadProgress(100);
      showToast('Image ready');
    } catch (e) {
      const message = e.code === 'storage/unauthorized'
        ? 'Image upload needs administrator access. Sign in again and retry.'
        : e.message || 'Unable to process image. Please retry.';
      setImageError(message); showToast(message, 'error');
    }
    finally { setIsUploadingImage(false); }
  };

  const onDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    handleImageUpload(e);
  };

  return (
    <div className="suite-page inventory-dashboard">
      <InventoryCatalog items={items} onAdd={openAdd} onEdit={openEdit} onDelete={handleDelete} onImport={() => setShowImport(true)} />
      {showImport && <InventoryImportDialog onClose={() => setShowImport(false)} />}
      <AnimatePresence>
        {showModal && (
          <Motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
            onClick={e => e.target === e.currentTarget && !isUploadingImage && !isSaving && setShowModal(false)}
          >
            <Motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              role="dialog" aria-modal="true" aria-label={editingItem ? 'Edit Product' : 'New Product'}
              style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{editingItem ? 'Edit Product' : 'New Product'}</h2>
                <button aria-label="Close product editor" disabled={isUploadingImage || isSaving} onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
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
                  <input type="file" id="imageUpload" aria-label="Upload product image" disabled={isUploadingImage} accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleImageUpload} />
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
                <button className="btn btn-secondary btn-sm" type="button" disabled={isUploadingImage} onClick={() => document.getElementById('imageUpload').click()}>Choose image</button>
                {imageError && <p role="alert" style={{ color: 'var(--danger-color, #b91c1c)', fontSize: '0.85rem' }}>{imageError}</p>}
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
                <button className="btn btn-ghost" disabled={isUploadingImage || isSaving} onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button className="btn btn-primary" onClick={() => void handleSave()} style={{ flex: 1, opacity: form.name.trim() && !isUploadingImage ? 1 : 0.5 }} disabled={!form.name.trim() || isUploadingImage || isSaving}>
                  {isUploadingImage ? 'Uploading Image...' : editingItem ? 'Save Changes' : 'Add Product'}
                </button>
              </div>
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
