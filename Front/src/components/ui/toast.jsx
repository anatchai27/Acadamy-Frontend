import { useState, useEffect } from 'preact/hooks';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineExclamationTriangle, HiOutlineInformationCircle, HiOutlineXMark } from 'react-icons/hi2';

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
  success: <HiOutlineCheckCircle class="w-5 h-5 text-oasis-success" />,
  error: <HiOutlineXCircle class="w-5 h-5 text-oasis-danger" />,
  warning: <HiOutlineExclamationTriangle class="w-5 h-5 text-oasis-warning" />,
  info: <HiOutlineInformationCircle class="w-5 h-5 text-oasis-primary" />,
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
          <HiOutlineXMark class="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
