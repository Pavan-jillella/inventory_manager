import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { InventoryImport } from './InventoryImport';

export function InventoryImportDialog({ onClose }) {
  const dialog = useRef(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { dialog.current.showModal(); }, []);
  return <dialog className="catalog-import-dialog" ref={dialog} aria-labelledby="inventory-import-title" onClose={onClose} onCancel={event => { if (busy) event.preventDefault(); }}>
    <div className="catalog-import-top"><h2 id="inventory-import-title">Import CSV</h2><button aria-label="Close CSV import" disabled={busy} onClick={() => dialog.current.close()}><X size={20} /></button></div>
    <InventoryImport csvOnly onBusyChange={setBusy} />
  </dialog>;
}
