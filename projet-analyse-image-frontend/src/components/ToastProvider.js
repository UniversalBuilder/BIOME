import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ToastContext = createContext({ add: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let idCounter = 1;

export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = (message, opts = {}) => {
    const id = idCounter++;
    const toast = {
      id,
      message: typeof message === 'string' ? message : (message?.toString?.() || 'Done'),
      type: opts.type || 'info',
      duration: typeof opts.duration === 'number' ? opts.duration : 3000
    };
    setToasts((prev) => [...prev, toast]);
    if (toast.duration > 0) {
      setTimeout(() => remove(id), toast.duration);
    }
    return id;
  };

  const remove = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  // Expose a simple global helper for convenience
  useEffect(() => {
    const api = (msg, opts) => add(msg, opts);
    window.toast = api;
    return () => { delete window.toast; };
  }, []);

  const value = useMemo(() => ({ add, remove }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className={`px-3 py-2 rounded shadow-md text-sm bg-white dark:bg-night-800 border ${
            t.type === 'success' ? 'border-green-400' : t.type === 'error' ? 'border-red-400' : 'border-slate-300 dark:border-night-600'
          }`}> 
            <span className={`${t.type === 'success' ? 'text-green-700 dark:text-green-400' : t.type === 'error' ? 'text-red-700 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>
              {t.message}
            </span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
