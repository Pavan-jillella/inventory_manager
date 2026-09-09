export const receiptTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export function validateReceipt(file) {
  if (!receiptTypes.includes(file.type)) throw new Error('Choose a JPEG, PNG, WebP, or PDF receipt.');
  if (!file.size || file.size > 5 * 1024 * 1024) throw new Error('Choose a receipt between 1 byte and 5 MB.');
}
export function validateReceiptRecord(receipt) {
  if (!receipt || !/^receipts\/[^/]+\/[a-zA-Z0-9-]+$/.test(receipt.path || '') || !receiptTypes.includes(receipt.type) || typeof receipt.name !== 'string' || !receipt.name || receipt.name.length > 150) throw new Error('Invalid receipt attachment. Upload the file again.');
  return { path: receipt.path, name: receipt.name, type: receipt.type };
}
