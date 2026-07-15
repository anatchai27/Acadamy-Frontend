import { useToast, hideToast, Toast } from './toast';

export function ToastContainer() {
  const toasts = useToast();

  if (toasts.length === 0) return null;

  return (
    <div class="fixed top-20 right-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          onRemove={hideToast}
        />
      ))}
    </div>
  );
}
