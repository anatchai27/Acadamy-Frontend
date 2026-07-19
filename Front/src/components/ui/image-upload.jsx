import { useState, useRef } from 'preact/hooks';
import { uploadService } from '../../services';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 1 * 1024 * 1024;
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;

function compressImage(file, maxW, maxH, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width;
      let h = img.height;
      if (w > maxW || h > maxH) {
        const ratio = Math.min(maxW / w, maxH / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('压缩失败'));
          return;
        }
        const compressedFile = new File([blob], file.name, {
          type: file.type,
          lastModified: Date.now(),
        });
        resolve(compressedFile);
      }, file.type, quality);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('无法加载图片'));
    };
    img.src = url;
  });
}

export function ImageUpload({
  label,
  preview,
  onChange,
  error,
  class: className = '',
}) {
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState(null);
  const [localError, setLocalError] = useState(null);
  const inputRef = useRef(null);

  const displayPreview = localPreview || preview;

  const handleFile = async (file) => {
    setLocalError(null);

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setLocalError('รองรับเฉพาะไฟล์ .jpg, .png, .webp เท่านั้น');
      return;
    }

    if (file.size > MAX_SIZE) {
      setLocalError('ไฟล์ต้องมีขนาดไม่เกิน 1MB');
      return;
    }

    try {
      const compressed = await compressImage(file, MAX_WIDTH, MAX_HEIGHT);

      if (compressed.size > MAX_SIZE) {
        const recompressed = await compressImage(file, MAX_WIDTH, MAX_HEIGHT, 0.6);
        const reader = new FileReader();
        reader.onload = (e) => {
          setLocalPreview(e.target.result);
          onChange?.(e.target.result, recompressed);
        };
        reader.readAsDataURL(recompressed);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setLocalPreview(e.target.result);
        onChange?.(e.target.result, compressed);
      };
      reader.readAsDataURL(compressed);
    } catch {
      setLocalError('ไม่สามารถย่อขนาดไฟล์ได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const handleFileSelect = (e) => {
    handleFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleRemove = () => {
    setLocalPreview(null);
    setLocalError(null);
    onChange?.(null, null);
  };

  const displayError = localError || error;

  return (
    <div class={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label class="text-sm font-medium text-zinc-800">{label}</label>
      )}
      <div
        class={`relative w-36 h-36 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
          displayError
            ? 'border-red-400 bg-red-50'
            : 'border-zinc-200 bg-white hover:border-oasis-primary/50'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {displayPreview ? (
          <>
            <img src={displayPreview} alt="preview" class="w-full h-full object-cover rounded-xl" />
            <button
              type="button"
              class="absolute -top-2 -right-2 bg-oasis-danger text-white rounded-full p-1 hover:bg-oasis-danger-dark transition-colors shadow-sm"
              onClick={(e) => { e.stopPropagation(); handleRemove(); }}
            >
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <div class="flex flex-col items-center gap-1.5 p-3 text-center">
            <svg class="h-8 w-8 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span class="text-xs text-zinc-400">คลิกหรือลากไฟล์</span>
            <span class="text-[10px] text-zinc-300">.jpg .png .webp สูงสุด 1MB</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp"
          class="hidden"
          onChange={handleFileSelect}
        />
      </div>
      {uploading && <p class="text-xs text-zinc-400">กำลังอัปโหลด...</p>}
      {displayError && <span class="text-xs text-red-500">{displayError}</span>}
    </div>
  );
}