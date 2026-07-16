import { useState, useRef } from 'preact/hooks';

function CameraIcon() {
  return (
    <svg class="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </svg>
  );
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024;

export function LogoUpload({ value, onChange, error }) {
  const [preview, setPreview] = useState(value || null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

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
      <label class="text-sm text-zinc-800 font-medium">โลโก้สถาบัน</label>
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
