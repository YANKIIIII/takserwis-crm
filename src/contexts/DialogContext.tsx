'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type DialogOptions = {
  title?: string;
  message: string;
  type: 'alert' | 'confirm';
  onConfirm: () => void;
  onCancel?: () => void;
};

type Toast = {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
};

interface DialogContextValue {
  showAlert: (message: string, title?: string) => Promise<void>;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogOptions | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showAlert = useCallback((message: string, title?: string) => {
    return new Promise<void>((resolve) => {
      setDialog({
        message,
        title: title || 'Powiadomienie',
        type: 'alert',
        onConfirm: () => {
          setDialog(null);
          resolve();
        }
      });
    });
  }, []);

  const showConfirm = useCallback((message: string, title?: string) => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        message,
        title: title || 'Potwierdzenie',
        type: 'confirm',
        onConfirm: () => {
          setDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setDialog(null);
          resolve(false);
        }
      });
    });
  }, []);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showToast }}>
      {children}
      {dialog && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
            <h2 className="modal-title" style={{ marginBottom: '16px', fontSize: '1.25rem', fontWeight: 600 }}>{dialog.title}</h2>
            <p style={{ marginBottom: '24px', color: 'var(--text-color)', fontSize: '1rem', lineHeight: 1.5 }}>{dialog.message}</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              {dialog.type === 'confirm' && (
                <button className="btn btn-secondary" onClick={dialog.onCancel}>Anuluj</button>
              )}
              <button className="btn btn-primary" onClick={dialog.onConfirm}>OK</button>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 999999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {toasts.map((toast) => (
          <div key={toast.id} className="animate-fade-in" style={{
            background: toast.type === 'error' ? 'var(--red)' : toast.type === 'success' ? 'var(--green)' : 'var(--text-primary)',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '0.9rem',
            fontWeight: 500,
            transition: 'opacity 0.3s'
          }}>
            {toast.message}
          </div>
        ))}
      </div>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used within DialogProvider');
  return context;
}
