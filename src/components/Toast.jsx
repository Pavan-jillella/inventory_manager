import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export const Toast = () => {
  const { toast } = useAppContext();

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            background: toast.type === 'error' ? '#fef2f2' : '#ecfdf5',
            color: toast.type === 'error' ? '#dc2626' : '#059669',
            padding: '1rem 1.5rem',
            borderRadius: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
            border: `1px solid ${toast.type === 'error' ? '#fecaca' : '#a7f3d0'}`,
            zIndex: 9999,
            maxWidth: '380px',
          }}
        >
          {toast.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{toast.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
