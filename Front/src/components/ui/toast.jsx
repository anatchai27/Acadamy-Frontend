import { useState, useEffect } from 'preact/hooks';
import { HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineExclamationTriangle, HiOutlineInformationCircle, HiOutlineXMark } from 'react-icons/hi2';
import { useDesignTheme } from '../../hooks/useDesignTheme';
let toastListeners = [];
export const showToast = (message, type = 'info', duration = 3000) => {
  const id = Date.now();
  toastListeners.map(listener => listener({
    id,
    message,
    type
  }));
  duration > 0 ? (() => {
    setTimeout(() => hideToast(id), duration);
  })() : () => {};
  return id;
};
export const hideToast = id => {
  toastListeners.map(listener => listener({
    id,
    remove: true
  }));
};
export const useToast = () => {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const listener = event => {
      return event.remove ? (() => {
        setToasts(prev => prev.filter(t => t.id !== event.id));
      })() : (() => {
        setToasts(prev => [...prev, event]);
      })();
    };
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter(l => l !== listener);
    };
  }, []);
  return toasts;
};
const icons = {
  success: HiOutlineCheckCircle,
  error: HiOutlineXCircle,
  warning: HiOutlineExclamationTriangle,
  info: HiOutlineInformationCircle
};
const themeConfig = {
  bento: {
    wrapper: {
      success: 'bg-oasis-success-light/90 border-oasis-success/30',
      error: 'bg-oasis-danger-light/90 border-oasis-danger/30',
      warning: 'bg-oasis-warning-light/90 border-oasis-warning/30',
      info: 'bg-oasis-primary/10 border-oasis-primary/25'
    },
    icon: {
      success: 'text-oasis-success',
      error: 'text-oasis-danger',
      warning: 'text-oasis-warning',
      info: 'text-oasis-primary'
    },
    text: 'text-zinc-800',
    close: 'text-zinc-400 hover:text-zinc-600'
  },
  neobrutalism: {
    wrapper: {
      success: 'bg-oasis-success-light border-2 border-black shadow-[3px_3px_0px_#000]',
      error: 'bg-oasis-danger-light border-2 border-black shadow-[3px_3px_0px_#000]',
      warning: 'bg-oasis-warning-light border-2 border-black shadow-[3px_3px_0px_#000]',
      info: 'bg-white border-2 border-black shadow-[3px_3px_0px_#000]'
    },
    icon: {
      success: 'text-oasis-success-dark',
      error: 'text-oasis-danger-dark',
      warning: 'text-oasis-warning-dark',
      info: 'text-oasis-primary-dark'
    },
    text: 'text-black font-medium',
    close: 'text-black/40 hover:text-black'
  }
};
export const Toast = ({
  id,
  message,
  type,
  onRemove
}) => {
  const [visible, setVisible] = useState(false);
  const {
    designTheme
  } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';
  const cfg = isNeo ? themeConfig.neobrutalism : themeConfig.bento;
  const Icon = icons[type];
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);
  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onRemove(id), 200);
  };
  return <div class={`pointer-events-auto transition-all duration-200 ${visible ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-8 scale-95'} ${isNeo ? 'p-4 border-2' : 'w-80 rounded-xl border shadow-sm p-4 backdrop-blur-sm'} ${cfg.wrapper[type]}`}>
      <div class="flex items-start gap-3">
        <Icon class={`w-5 h-5 shrink-0 mt-0.5 ${cfg.icon[type]}`} />
        <p class={`text-sm flex-1 ${cfg.text}`}>{message}</p>
        <button type="button" class={`bg-transparent border-none cursor-pointer p-0 transition-colors ${cfg.close}`} onClick={handleClose}>
          <HiOutlineXMark class="w-4 h-4" />
        </button>
      </div>
    </div>;
};