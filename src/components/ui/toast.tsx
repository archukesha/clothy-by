"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { X, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  confirm: (message: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastId = 0;

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be inside ToastProvider");
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<{
    message: string;
    resolve: (value: boolean) => void;
  } | null>(null);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++toastId;
    setToasts((current) => [...current, { id, message, type }]);
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3500);
  }, []);

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ message, resolve });
    });
  }, []);

  function handleConfirm(value: boolean) {
    confirmState?.resolve(value);
    setConfirmState(null);
  }

  function removeToast(id: number) {
    setToasts((current) => current.filter((item) => item.id !== id));
  }

  const icons = {
    success: <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />,
    error: <XCircle className="h-5 w-5 shrink-0 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />,
    info: <Info className="h-5 w-5 shrink-0 text-blue-500" />,
  };

  return (
    <ToastContext value={{ toast, confirm }}>
      {children}

      <div className="fixed bottom-4 right-4 z-[200] flex max-w-sm flex-col gap-2">
        {toasts.map((toastItem) => (
          <div
            key={toastItem.id}
            className="animate-in slide-in-from-right fade-in flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-lg duration-200"
          >
            {icons[toastItem.type]}
            <p className="flex-1 text-sm text-neutral-800">{toastItem.message}</p>
            <button
              onClick={() => removeToast(toastItem.id)}
              className="shrink-0 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {confirmState ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 animate-in fade-in bg-black/40 duration-150"
            onClick={() => handleConfirm(false)}
          />
          <div className="animate-in zoom-in-95 fade-in relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl duration-150">
            <p className="mb-5 text-sm leading-relaxed text-neutral-800">{confirmState.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleConfirm(false)}
                className="rounded-xl bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-200"
              >
                Отмена
              </button>
              <button
                onClick={() => handleConfirm(true)}
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ToastContext>
  );
}
