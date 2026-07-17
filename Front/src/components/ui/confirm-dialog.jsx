import { useState, useEffect } from 'preact/hooks';

let dialogListeners = [];

export function showConfirm({ title, message, yesLabel = 'ยืนยัน', cancelLabel = 'ยกเลิก' }) {
  const id = Date.now();
  let resolver;
  const promise = new Promise((resolve) => { resolver = resolve; });

  dialogListeners.forEach((listener) => listener({ id, title, message, yesLabel, cancelLabel, resolver }));
  return promise;
}

export function useConfirmDialog() {
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    const listener = (event) => { setDialog(event); };
    dialogListeners.push(listener);
    return () => { dialogListeners = dialogListeners.filter((l) => l !== listener); };
  }, []);

  return dialog;
}

export function ConfirmDialog({ id, title, message, yesLabel, cancelLabel, resolver }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  const handleResolve = (value) => {
    setVisible(false);
    setTimeout(() => resolveAndClose(value), 200);
  };

  const resolveAndClose = (value) => {
    resolver(value);
    dialogListeners.forEach((listener) => listener(null));
  };

  return (
    <div class={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => handleResolve(false)} />

      <div class={`relative bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden transition-all duration-200 ${visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <div class="p-6">
          <h3 class="text-lg font-semibold text-zinc-900 mb-2">{title}</h3>
          <p class="text-sm text-zinc-500 leading-relaxed">{message}</p>
        </div>

        <div class="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            type="button"
            class="px-5 py-2.5 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
            onClick={() => handleResolve(false)}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            class="px-5 py-2.5 text-sm font-medium text-white bg-oasis-primary hover:bg-oasis-primary-dark rounded-xl transition-colors shadow-sm"
            onClick={() => handleResolve(true)}
          >
            {yesLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
