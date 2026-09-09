import { ref, uploadBytes, getBlob } from 'firebase/storage';
import { storage, auth } from './firebase';
import { validateReceipt, validateReceiptRecord } from './receiptValidation';

export async function uploadReceipt(file) {
  validateReceipt(file);
  if (!storage || !auth?.currentUser) throw new Error('Receipt attachments require shared storage and staff sign-in.');
  const path = `receipts/${auth.currentUser.uid}/${crypto.randomUUID()}`;
  await uploadBytes(ref(storage, path), file, { contentType: file.type });
  return { path, name: file.name.slice(0, 150), type: file.type };
}
export async function downloadReceipt(receipt) {
  validateReceiptRecord(receipt);
  const blob = await getBlob(ref(storage, receipt.path), 5 * 1024 * 1024);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = receipt.name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
