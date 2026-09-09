export function planIssue(items, cart, details) {
  if (!Array.isArray(cart) || !cart.length) throw new Error('Choose at least one item.');
  if (cart.length > 200) throw new Error('Issue at most 200 different items at once.');
  const ids = new Set();
  const updatedItems = [];
  const newLogs = cart.map(entry => {
    const item = items.find(i => i.id === entry.item.id);
    const quantity = Number(entry.quantity);
    if (!item || !Number.isInteger(quantity) || quantity <= 0 || !Number.isFinite(item.stock) || item.stock < quantity) throw new Error(`Insufficient stock or invalid quantity for ${entry.item.name}.`);
    if (ids.has(item.id)) throw new Error('The cart contains a duplicate item.');
    ids.add(item.id);
    const rate = entry.isFree ? 0 : Number(details.rateType === 'staff' ? item.staffRate || 0 : item.guestRate || 0);
    const purchaseRate = Number(item.purchaseRate || 0);
    if (!Number.isFinite(rate) || rate < 0 || !Number.isFinite(purchaseRate) || purchaseRate < 0) throw new Error('Invalid item pricing.');
    updatedItems.push({ ...item, stock: item.stock - quantity });
    return {
      ...details, id: entry.logId, itemId: item.id, itemName: item.name,
      itemCategory: item.category, quantity,
      stockBefore: item.stock, stockAfter: item.stock - quantity,
      rateType: entry.isFree ? 'Amenity' : details.rateType,
      unitRate: rate, totalAmount: Math.round(rate * 100) * quantity / 100,
      purchaseRate, purchaseCost: Math.round(purchaseRate * 100) * quantity / 100,
      paymentMethod: entry.isFree ? 'Amenity' : details.paymentMethod,
      isFreeAmenity: Boolean(entry.isFree),
    };
  });
  return { updatedItems, newLogs };
}

export function planLogChange(log, item, updates) {
  if (!log) throw new Error('This entry no longer exists. Refresh and try again.');
  const quantity = updates === null ? 0 : Number(updates.quantity ?? log.quantity);
  if (!Number.isInteger(quantity) || quantity < (updates === null ? 0 : 1)) throw new Error('Quantity must be a positive whole number.');
  const difference = log.quantity - quantity;
  if (!item && difference !== 0) throw new Error('Restore the inventory item before changing its quantity.');
  if (item && item.stock + difference < 0) throw new Error('There is not enough stock for this change.');
  const allowed = {};
  for (const key of ['roomNumber', 'notes', 'paymentMethod']) if (updates && updates[key] !== undefined) allowed[key] = updates[key];
  const editableLog = { ...log };
  if (quantity !== log.quantity) { delete editableLog.stockBefore; delete editableLog.stockAfter; }
  return {
    updatedItem: item ? { ...item, stock: item.stock + difference } : null,
    updatedLog: updates === null ? null : { ...editableLog, ...allowed, quantity, totalAmount: Math.round(log.unitRate * 100) * quantity / 100, purchaseCost: Math.round((log.purchaseRate || 0) * 100) * quantity / 100 },
  };
}
