import { useState } from 'react';
import { AlertTriangle, ArrowUpDown, Boxes, CircleDollarSign, Edit2, LayoutGrid, Package, Plus, Search, Table2, Trash2, Upload } from 'lucide-react';
import './InventoryCatalog.css';
import { ProductDetails } from './ProductDetails';
import { useAppContext } from '../context/AppContext';
import { stockEstimate } from '../lib/analytics';

const money = value => Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
const tone = category => ({ drinks: 'sky', snacks: 'peach', medicines: 'rose', essentials: 'lavender' })[String(category).toLowerCase()] || 'mint';
const stockStatus = item => item.stock === 0 ? { label: 'Out of stock', className: 'out' } : item.stock <= item.minStock ? { label: 'Low stock', className: 'low' } : { label: 'In stock', className: 'healthy' };

function ProductPhoto({ item }) {
  const [failed, setFailed] = useState(null);
  return <div className={`catalog-photo tone-${tone(item.category)}`}>
    {item.image && failed !== item.image
      ? <img src={item.image} alt={item.name} loading="lazy" onError={() => setFailed(item.image)} />
      : <div className="catalog-photo-placeholder"><Package size={36} strokeWidth={1.2} /><span>No photo yet</span></div>}
  </div>;
}

export function InventoryCatalog({ items, onAdd, onEdit, onDelete, onImport }) {
  const { logs } = useAppContext();
  const [detailId, setDetailId] = useState(null);
  const detailItem = items.find(item => item.id === detailId);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('All products');
  const [sort, setSort] = useState('name');
  const [view, setView] = useState('grid');
  const categories = [...new Set(items.map(item => item.category))].sort();
  const lowStock = items.filter(item => item.stock <= item.minStock).length;
  const shown = items.filter(item => (!category || item.category === category)
    && (stock === 'All products' || (stock === 'Low stock' ? item.stock > 0 && item.stock <= item.minStock : item.stock === 0))
    && `${item.name} ${item.category}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => (sort === 'stock' ? a.stock - b.stock : sort === 'price' ? Number(a.guestRate || 0) - Number(b.guestRate || 0) : 0) || a.name.localeCompare(b.name));
  const reset = () => { setSearch(''); setCategory(''); setStock('All products'); setSort('name'); };
  const actions = item => <div className="catalog-item-actions">
    <button className="catalog-edit" onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`}><Edit2 size={14} /> Edit product</button>
    <button className="catalog-delete" onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`}><Trash2 size={16} /></button>
  </div>;

  return <>
    {detailItem && <ProductDetails key={detailItem.id} item={detailItem} onClose={() => setDetailId(null)} />}
    <header className="catalog-heading">
      <div><span className="catalog-eyebrow">ADMINISTRATION / YOUR STOCKROOM</span><h1>Inventory</h1><p>A clear view of every product, price, and stock level.</p></div>
      <div className="catalog-header-actions"><button className="btn btn-outline" onClick={onImport}><Upload size={16} /> Import CSV</button><button className="btn btn-primary" onClick={onAdd}><Plus size={17} /> Add Product</button></div>
    </header>

    <section className="catalog-stats" aria-label="Inventory summary">
      <article className="tone-sky"><span className="catalog-stat-icon"><Package size={19} /></span><div><span>Products</span><strong>{items.length.toLocaleString()}</strong><small>{categories.length} categories</small></div></article>
      <article className="tone-mint"><span className="catalog-stat-icon"><Boxes size={19} /></span><div><span>Units on hand</span><strong>{items.reduce((sum, item) => sum + Number(item.stock || 0), 0).toLocaleString()}</strong><small>Across your inventory</small></div></article>
      <article className="tone-peach"><span className="catalog-stat-icon"><AlertTriangle size={19} /></span><div><span>Need restocking</span><strong>{lowStock.toLocaleString()}</strong><small>Low or out of stock</small></div></article>
      <article className="tone-lavender"><span className="catalog-stat-icon"><CircleDollarSign size={19} /></span><div><span>Purchase value</span><strong>{money(items.reduce((sum, item) => sum + item.stock * (item.purchaseRate || 0), 0))}</strong><small>On-hand stock at cost</small></div></article>
    </section>

    <section className="catalog-controls" aria-label="Find products">
      <div className="catalog-search-row">
        <label className="catalog-search"><Search size={18} /><input type="search" aria-label="Search products" placeholder="Search products or categories…" value={search} onChange={event => setSearch(event.target.value)} /></label>
        <label className="catalog-select"><span className="catalog-sr-only">Category</span><select aria-label="Category" value={category} onChange={event => setCategory(event.target.value)}><option value="">All categories</option>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
        <label className="catalog-select"><ArrowUpDown size={15} /><span className="catalog-sr-only">Sort products</span><select aria-label="Sort products" value={sort} onChange={event => setSort(event.target.value)}><option value="name">Name A–Z</option><option value="stock">Lowest stock</option><option value="price">Lowest guest price</option></select></label>
      </div>
      <div className="catalog-filter-row">
        <div className="catalog-stock-filters" aria-label="Stock status">{['All products', 'Low stock', 'Out of stock'].map(value => <button key={value} aria-pressed={stock === value} onClick={() => setStock(value)}>{value}<span>{value === 'All products' ? items.length : items.filter(item => value === 'Low stock' ? item.stock > 0 && item.stock <= item.minStock : item.stock === 0).length}</span></button>)}</div>
        <div className="catalog-view" aria-label="Inventory view"><button aria-label="Product cards" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><LayoutGrid size={17} /></button><button aria-label="Product table" aria-pressed={view === 'table'} onClick={() => setView('table')}><Table2 size={17} /></button></div>
      </div>
    </section>

    <div className="catalog-results-heading"><h2>Your products <span>{shown.length}</span></h2><span>{search || category || stock !== 'All products' ? <button onClick={reset}>Clear filters</button> : 'Ready for the next shift'}</span></div>
    {shown.length === 0 ? <section className="catalog-empty"><Package size={40} strokeWidth={1.2} /><h3>{items.length ? 'No products match these filters' : 'Your stockroom starts here'}</h3><p>{items.length ? 'Try a different name, category, or stock status.' : 'Add your first product or bring in your inventory with a CSV file.'}</p><button className="btn btn-outline" onClick={items.length ? reset : onAdd}>{items.length ? 'Clear filters' : 'Add Product'}</button></section>
      : view === 'grid' ? <div className="catalog-grid">{shown.map(item => { const status = stockStatus(item); return <article className="catalog-card" key={item.id}>
        <div className="catalog-card-image"><button className="catalog-detail-button" aria-label={`View details for ${item.name}`} onClick={() => setDetailId(item.id)}><ProductPhoto item={item} /></button><span className={`catalog-status status-${status.className}`}>{status.label}</span></div>
        <div className="catalog-card-body"><span className={`catalog-category tone-${tone(item.category)}`}>{item.category}</span><h3><button className="catalog-detail-button" onClick={() => setDetailId(item.id)}>{item.name}</button></h3>
          <div className="catalog-stock-line"><div><strong>{Number(item.stock).toLocaleString()}</strong><span> in stock</span></div><span>Min. {item.minStock}</span></div>
          <dl className="catalog-prices"><div><dt>Guest</dt><dd>{money(item.guestRate)}</dd></div><div><dt>Staff</dt><dd>{money(item.staffRate)}</dd></div><div><dt>Purchase</dt><dd>{money(item.purchaseRate)}</dd></div></dl>
          <p className="catalog-estimate">{stockEstimate(item, logs) ? `Estimated ${stockEstimate(item, logs).days.toFixed(1)} days remaining` : 'Restocking estimate: insufficient history'}</p>
          {actions(item)}
        </div>
      </article>; })}</div>
      : <div className="catalog-table-wrap" tabIndex={0} role="region" aria-label="Product table; scroll horizontally for all columns"><table className="catalog-table"><thead><tr><th>Product</th><th>Stock</th><th>Guest</th><th>Staff</th><th>Purchase</th><th>Status</th><th>Manage</th></tr></thead><tbody>{shown.map(item => { const status = stockStatus(item); return <tr key={item.id}><td><div className="catalog-table-product"><ProductPhoto item={item} /><div><button className="catalog-detail-button" onClick={() => setDetailId(item.id)}><strong>{item.name}</strong></button><span>{item.category}</span></div></div></td><td><strong>{item.stock}</strong><small>Min. {item.minStock}</small></td><td>{money(item.guestRate)}</td><td>{money(item.staffRate)}</td><td>{money(item.purchaseRate)}</td><td><span className={`catalog-status status-${status.className}`}>{status.label}</span></td><td>{actions(item)}</td></tr>; })}</tbody></table></div>}
  </>;
}
