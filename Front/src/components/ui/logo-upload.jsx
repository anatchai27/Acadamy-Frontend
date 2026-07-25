import { useState, useRef } from 'preact/hooks';
import { HiOutlineCamera, HiOutlineTrash } from 'react-icons/hi2';
import { useDesignTheme } from '../../hooks/useDesignTheme';

function CameraIcon() {
  return <HiOutlineCamera class="w-10 h-10 text-zinc-400" />;
}

function TrashIcon() {
  return <HiOutlineTrash class="w-5 h-5" />;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024;

export function LogoUpload({ value, onChange, error }) {
  const [preview, setPreview] = useState(value || null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);
  const { designTheme } = useDesignTheme();
  const isNeo = designTheme === 'neobrutalism';

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'รองรับเฉพาะไฟล์ .jpg, .png, .webp เท่านั้น';
    }
    if (file.size > MAX_SIZE) {
      return 'ขนาดไฟล์ต้องไม่เกิน 2MB';
    }
    return null;
  };

  const processFile = (file) => {
    const validationError = validateFile(file);
    if (validationError) {
      onChange(null, validationError);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setPreview(base64);
      onChange(base64, null);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    processFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    onChange(null, null);
  };

  return (
    <div class="flex flex-col gap-1.5">
      <label class={`text-sm font-medium ${isNeo ? 'text-black' : 'text-zinc-800'}`}>โลโก้สถาบัน</label>
      <div
        class={`relative w-40 h-40 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
          error
            ? 'border-red-400 bg-red-50'
            : isDragging
            ? 'border-oasis-primary bg-oasis-primary/5'
            : 'border-zinc-200 bg-white hover:border-zinc-300'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {preview ? (
          <>
            <img src={preview} alt="โลโก้สถาบัน" class="w-full h-full object-cover rounded-xl" />
            <button
              type="button"
              class="absolute -top-2 -right-2 bg-oasis-danger text-white rounded-full p-1.5 hover:bg-oasis-danger-dark transition-colors shadow-sm"
              onClick={handleRemove}
              title="ลบรูปภาพ"
            >
              <TrashIcon />
            </button>
          </>
        ) : (
          <div class="flex flex-col items-center gap-2 p-4">
            <CameraIcon />
            <span class="text-xs text-zinc-500 text-center">คลิกหรือลากไฟล์มาวาง</span>
            <span class="text-xs text-zinc-400">.jpg .png .webp (สูงสุด 2MB)</span>
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
      {error && <span class="text-xs text-red-500">{error}</span>}
    </div>
  );
}
