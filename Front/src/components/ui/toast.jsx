import { useState, useEffect } from 'preact/hooks';

let toastListeners = [];

export function showToast(message, type = 'info', duration = 3000) {
  const id = Date.now();
  toastListeners.forEach((listener) => listener({ id, message, type }));
  if (duration > 0) {
    setTimeout(() => hideToast(id), duration);
  }
  return id;
}

export function hideToast(id) {
  toastListeners.forEach((listener) => listener({ id, remove: true }));
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const listener = (event) => {
      if (event.remove) {
        setToasts((prev) => prev.filter((t) => t.id !== event.id));
      } else {
        setToasts((prev) => [...prev, event]);
      }
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  return toasts;
}

const icons = {
  success: (
    <svg class="w-5 h-5 text-oasis-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg class="w-5 h-5 text-oasis-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg class="w-5 h-5 text-oasis-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  info: (
    <svg class="w-5 h-5 text-oasis-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export function Toast({ id, message, type, onRemove }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onRemove(id), 200);
  };

  const bgColors = {
    success: 'bg-oasis-success-light/80 border-oasis-success/20',
    error: 'bg-oasis-danger-light/80 border-oasis-danger/20',
    warning: 'bg-oasis-warning-light/80 border-oasis-warning/20',
    info: 'bg-oasis-primary/5 border-oasis-primary/20',
  };

  return (
    <div
      class={`pointer-events-auto w-80 rounded-xl border shadow-sm p-4 transition-all duration-200 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'} ${bgColors[type]}`}
    >
      <div class="flex items-start gap-3">
        {icons[type]}
        <p class="text-sm text-zinc-800 flex-1">{message}</p>
        <button
          type="button"
          class="text-zinc-400 hover:text-zinc-600 bg-transparent border-none cursor-pointer p-0"
          onClick={handleClose}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
