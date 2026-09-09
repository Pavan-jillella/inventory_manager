export function productChange(previous, updates, staff, id = crypto.randomUUID(), timestamp = new Date().toISOString()) {
  const fields = ['name', 'category', 'stock', 'minStock', 'purchaseRate', 'staffRate', 'guestRate', 'image'];
  const changes = fields.filter(key => updates[key] !== undefined && updates[key] !== previous[key]).map(key => ({ field: key, before: key === 'image' ? Boolean(previous[key]) : previous[key] ?? null, after: key === 'image' ? Boolean(updates[key]) : updates[key] }));
  return { id, itemId: previous.id, timestamp, staff: staff.name, staffId: staff.id, changes };
}

export function productPatch(current, updates, original) {
  const patch = { ...updates };
  if (updates.stock === original.stock) delete patch.stock;
  else if (current.stock !== original.stock) throw new Error('Stock changed on another device. Reopen the product before correcting its stock.');
  return patch;
}
