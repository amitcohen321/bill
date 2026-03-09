import * as Toast from '@radix-ui/react-toast';
import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface ToastMessage {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastMessage['type']) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within Toaster');
  return ctx;
}

export function Toaster({ children }: { children?: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastMessage['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      <Toast.Provider swipeDirection="right" duration={4000}>
        {children}
        {toasts.map((toast) => (
          <Toast.Root
            key={toast.id}
            onOpenChange={(open) => !open && remove(toast.id)}
            className={[
              'flex items-start gap-3 p-4 rounded-2xl border shadow-card',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[swipe=end]:animate-out data-[state=closed]:fade-out-80',
              'data-[state=open]:slide-in-from-bottom-2',
              toast.type === 'error'
                ? 'bg-red-950 border-red-800/50 text-red-200'
                : toast.type === 'success'
                  ? 'bg-green-950 border-green-800/50 text-green-200'
                  : 'bg-surface-elevated border-surface-border text-white',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <Toast.Description className="text-sm leading-relaxed">
              {toast.message}
            </Toast.Description>
            <Toast.Close className="shrink-0 opacity-60 hover:opacity-100 transition-opacity text-current">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Toast.Close>
          </Toast.Root>
        ))}
        <Toast.Viewport className="fixed bottom-4 inset-x-4 z-50 flex flex-col gap-2 max-w-sm mx-auto" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}
