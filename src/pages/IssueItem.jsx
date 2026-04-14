import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, Check, Package, Hash, Zap, X, ShoppingCart, CreditCard, Banknote } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getCurrentShift, MEMBERSHIP_TIERS } from '../data/mockData';

export const IssueItem = () => {
  const { items, logCartUsage, currentUser, getShiftStats, settings } = useAppContext();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]); // [{ item, quantity }]
  const [roomNumber, setRoomNumber] = useState('');

  const [notes, setNotes] = useState('');
  const [rateType, setRateType] = useState('guest');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [membershipTier, setMembershipTier] = useState('None');
  const [isFreeAmenity, setIsFreeAmenity] = useState(false);
  const searchInputRef = useRef(null);

  const shift = getCurrentShift();
  const shiftStats = getShiftStats(shift.id);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, activeCategory]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.id === item.id);
      if (existing) {
        return prev.map(c => c.item.id === item.id ? { ...c, quantity: Math.min(c.quantity + 1, item.stock) } : c);
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateCartQty = (itemId, delta) => {
    setCart(prev => prev.map(c => {
      if (c.item.id === itemId) {
        const newQty = c.quantity + delta;
        if (newQty < 1) return c;
        if (newQty > c.item.stock) return c;
        return { ...c, quantity: newQty };
      }
      return c;
    }));
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(c => c.item.id !== itemId));
  };

  const cartTotal = useMemo(() => {
    if (isFreeAmenity) return 0;
    return cart.reduce((sum, c) => {
      const rate = rateType === 'staff' ? (c.item.staffRate || 0) : (c.item.guestRate || 0);
      return sum + rate * c.quantity;
    }, 0);
  }, [cart, rateType, isFreeAmenity]);

  const cartQty = cart.reduce((s, c) => s + c.quantity, 0);

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    const success = await logCartUsage(cart, roomNumber, notes, rateType, paymentMethod, membershipTier, isFreeAmenity);
    if (success) {
      setCart([]);
      setRoomNumber('');
      setNotes('');
      setSearch('');
      setPaymentMethod('cash');
      setMembershipTier('None');
      setIsFreeAmenity(false);
      searchInputRef.current?.focus();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && cart.length > 0 && !e.repeat && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        void handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, roomNumber, notes, rateType]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── Header with Glassy Shift Stats ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: '0.15rem', fontSize: '1.75rem' }}>Issue Item</h1>
          <p className="text-secondary" style={{ fontSize: '0.85rem' }}>
            <span style={{ fontWeight: 600, color: 'var(--accent-dark)' }}>{currentUser?.name}</span> · {shift.label} Shift
          </p>
        </div>
        {/* Glassy Stats Pills */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{
            padding: '0.5rem 1.25rem', borderRadius: '999px',
            background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-dark)', fontFamily: 'var(--font-display)' }}>{shiftStats.totalEntries}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Issues</span>
          </div>
          <div style={{
            padding: '0.5rem 1.25rem', borderRadius: '999px',
            background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-dark)', fontFamily: 'var(--font-display)' }}>{shiftStats.totalItems}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Items</span>
          </div>
          <div style={{
            padding: '0.5rem 1.25rem', borderRadius: '999px',
            background: 'linear-gradient(135deg, hsla(35,35%,55%,0.15), hsla(35,30%,42%,0.1))',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid hsla(35,30%,48%,0.15)', boxShadow: '0 2px 12px hsla(35,30%,48%,0.08)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-dark)', fontFamily: 'var(--font-display)' }}>${shiftStats.totalAmount?.toFixed(0) || 0}</span>
            <span style={{ fontSize: '0.65rem', color: 'var(--accent-dark)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.04em' }}>Value</span>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* ── Left: Catalog ── */}
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
              <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input ref={searchInputRef} type="text" className="input" value={search} onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', paddingLeft: '2.5rem', padding: '0.6rem 1rem 0.6rem 2.5rem', fontSize: '0.85rem' }} placeholder="Search items..." autoFocus />
            </div>
          </div>

          {/* Category Pills */}
          <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem', overflowX: 'auto', paddingBottom: '0.15rem' }}>
            {['All', ...(settings.categories || [])].map(cat => (
              <button key={cat}
                className={`btn ${activeCategory === cat ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setActiveCategory(cat)}
                style={{ whiteSpace: 'nowrap', borderRadius: '999px', fontSize: '0.7rem', padding: '0.3rem 0.85rem' }}
              >{cat}</button>
            ))}
          </div>

          {/* Items Grid — Compact */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '0.5rem', alignContent: 'start', paddingRight: '0.25rem' }}>
            {filteredItems.map(item => {
              const inCart = cart.find(c => c.item.id === item.id);
              const isLow = item.stock <= item.minStock;
              return (
                <motion.div
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  key={item.id} onClick={() => addToCart(item)}
                  style={{
                    cursor: 'pointer', padding: '0.5rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                    background: inCart ? 'var(--accent-bg)' : 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
                    border: `1.5px solid ${inCart ? 'var(--accent-color)' : 'rgba(0,0,0,0.06)'}`,
                    borderRadius: '0.85rem', transition: 'all 0.2s ease',
                    boxShadow: inCart ? 'var(--shadow-warm)' : '0 1px 8px rgba(0,0,0,0.03)',
                    position: 'relative',
                  }}
                >
                  {inCart && (
                    <div style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-gradient)', color: 'white', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                      {inCart.quantity}
                    </div>
                  )}
                  <div style={{ width: '52px', height: '52px', borderRadius: '0.5rem', overflow: 'hidden', marginBottom: '0.35rem', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.7rem', marginBottom: '0.15rem', color: 'var(--text-primary)', lineHeight: 1.25 }}>{item.name}</div>
                  <div style={{ fontSize: '0.6rem', color: isLow ? 'var(--danger-color)' : 'var(--success-color)', fontWeight: 600 }}>{item.stock} left</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--accent-dark)', fontWeight: 500, marginTop: '0.1rem' }}>
                    ${rateType === 'staff' ? item.staffRate?.toFixed(2) : item.guestRate?.toFixed(2)}
                  </div>
                </motion.div>
              );
            })}
            {filteredItems.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                <Package size={36} style={{ marginBottom: '0.5rem', opacity: 0.2 }} />
                <p style={{ fontSize: '0.85rem' }}>No items match your search</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Cart & Details ── */}
        <div style={{
          background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(0,0,0,0.06)', borderRadius: 'var(--radius-lg)',
          padding: '1.25rem', display: 'flex', flexDirection: 'column',
          boxShadow: '0 4px 30px rgba(0,0,0,0.04)', overflow: 'hidden',
        }}>
          {/* Rate Toggle */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', padding: '0.2rem', background: '#f3f4f6', borderRadius: '0.5rem' }}>
            <button
              onClick={() => setRateType('guest')}
              style={{
                flex: 1, padding: '0.45rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: 600,
                background: rateType === 'guest' ? 'white' : 'transparent',
                color: rateType === 'guest' ? 'var(--accent-dark)' : 'var(--text-muted)',
                boxShadow: rateType === 'guest' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >Guest Rate</button>
            <button
              onClick={() => setRateType('staff')}
              style={{
                flex: 1, padding: '0.45rem', borderRadius: '0.4rem', fontSize: '0.75rem', fontWeight: 600,
                background: rateType === 'staff' ? 'white' : 'transparent',
                color: rateType === 'staff' ? 'var(--accent-dark)' : 'var(--text-muted)',
                boxShadow: rateType === 'staff' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >Staff Rate</button>
          </div>

          {/* Cart Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShoppingCart size={16} style={{ color: 'var(--accent-color)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                Cart ({cart.length})
              </span>
            </div>
            {cart.length > 0 && (
              <button className="btn btn-ghost" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', color: 'var(--danger-color)' }} onClick={() => setCart([])}>
                Clear
              </button>
            )}
          </div>

          {/* Cart Items */}
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '0.75rem', minHeight: 0 }}>
            <AnimatePresence>
              {cart.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                    <ShoppingCart size={22} style={{ color: 'var(--accent-light)', opacity: 0.6 }} />
                  </div>
                  <p style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)', fontSize: '0.95rem' }}>Tap items to add</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>Add multiple items before issuing</p>
                </motion.div>
              ) : (
                cart.map(c => {
                  const rate = rateType === 'staff' ? (c.item.staffRate || 0) : (c.item.guestRate || 0);
                  return (
                    <motion.div
                      key={c.item.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.6rem', marginBottom: '0.4rem',
                        background: 'white', borderRadius: '0.65rem',
                        border: '1px solid rgba(0,0,0,0.05)',
                      }}
                    >
                      <img src={c.item.image} alt={c.item.name} style={{ width: '34px', height: '34px', borderRadius: '0.4rem', objectFit: 'cover' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.item.name}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--accent-dark)' }}>${rate.toFixed(2)} ea · ${(rate * c.quantity).toFixed(2)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <button onClick={() => updateCartQty(c.item.id, -1)} style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Minus size={11} />
                        </button>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>{c.quantity}</span>
                        <button onClick={() => updateCartQty(c.item.id, 1)} style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Plus size={11} />
                        </button>
                      </div>
                      <button onClick={() => removeFromCart(c.item.id)} style={{ color: 'var(--text-muted)', padding: '0.15rem' }}>
                        <X size={14} />
                      </button>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>

          {/* Details Fields */}
          {cart.length > 0 && (
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '0.75rem', overflowY: 'auto' }}>
              
              {/* Membership Tier */}
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', display: 'block' }}>Choice Privileges Tier</label>
                <select 
                  className="select" 
                  value={membershipTier} 
                  onChange={e => {
                    setMembershipTier(e.target.value);
                    if (e.target.value !== 'None' && e.target.value !== 'Member') setIsFreeAmenity(true);
                  }}
                  style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem' }}
                >
                  {MEMBERSHIP_TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Free Amenity Toggle */}
              <div style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', background: isFreeAmenity ? '#fff7ed' : 'transparent', borderRadius: '0.5rem', border: isFreeAmenity ? '1px solid #fed7aa' : '1px solid transparent' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: isFreeAmenity ? '#c2410c' : 'var(--text-primary)' }}>Free Amenity</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Tier member benefit (Price: $0)</div>
                </div>
                <label style={{ position: 'relative', width: '36px', height: '20px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={isFreeAmenity} onChange={() => setIsFreeAmenity(!isFreeAmenity)} style={{ opacity: 0, width: 0, height: 0 }} />
                  <span style={{ position: 'absolute', inset: 0, borderRadius: '999px', transition: 'all 0.2s ease', background: isFreeAmenity ? '#f97316' : '#e5e7eb' }}>
                    <span style={{ position: 'absolute', top: '2px', left: isFreeAmenity ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.2s ease' }} />
                  </span>
                </label>
              </div>

              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', display: 'block' }}>Room Number</label>
                <div style={{ position: 'relative' }}>
                  <Hash size={12} style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input type="text" className="input" value={roomNumber} onChange={e => setRoomNumber(e.target.value)} placeholder="e.g. 201" style={{ width: '100%', paddingLeft: '1.85rem', padding: '0.5rem 0.7rem 0.5rem 1.85rem', fontSize: '0.8rem' }} />
                </div>
              </div>

              {/* Payment Method */}
              <div style={{ marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', display: 'block' }}>Payment</label>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                      padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600,
                      background: paymentMethod === 'cash' ? '#ecfdf5' : '#f9fafb',
                      border: `1.5px solid ${paymentMethod === 'cash' ? 'var(--success-color)' : 'rgba(0,0,0,0.06)'}`,
                      color: paymentMethod === 'cash' ? 'var(--success-color)' : 'var(--text-muted)',
                      transition: 'all 0.2s ease',
                    }}
                  ><Banknote size={14} /> Cash</button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem',
                      padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 600,
                      background: paymentMethod === 'card' ? '#eff6ff' : '#f9fafb',
                      border: `1.5px solid ${paymentMethod === 'card' ? '#3b82f6' : 'rgba(0,0,0,0.06)'}`,
                      color: paymentMethod === 'card' ? '#3b82f6' : 'var(--text-muted)',
                      transition: 'all 0.2s ease',
                    }}
                  ><CreditCard size={14} /> Card</button>
                </div>
              </div>

              {/* Staff + Total */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.65rem', background: '#f9fafb', borderRadius: '0.5rem', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.55rem', fontWeight: 700 }}>
                    {currentUser?.name?.charAt(0)}
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{currentUser?.name}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-dark)', fontFamily: 'var(--font-display)' }}>${cartTotal.toFixed(2)}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{cartQty} items · {rateType} · {paymentMethod}</div>
                </div>
              </div>

              {/* Submit */}
              <button className="btn btn-primary" onClick={() => void handleSubmit()} style={{ width: '100%', padding: '0.7rem', fontSize: '0.85rem' }}>
                <Check size={16} /> Issue {cart.length} Item{cart.length > 1 ? 's' : ''}
                <span style={{ marginLeft: 'auto', fontSize: '0.65rem', opacity: 0.7, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                  <Zap size={10} /> Enter
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
