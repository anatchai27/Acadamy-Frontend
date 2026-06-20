import { useState } from 'preact/hooks';

/**
 * ScannerCamera
 * ตัวอ่าน QR Code — viewfinder UI พร้อม manual input สำหรับทดสอบ
 *
 * Props:
 *   onScan(value)  — เรียกเมื่อสแกน/กรอกรหัสสำเร็จ
 *   onError(err)   — เรียกเมื่อเกิดข้อผิดพลาด
 *   active         — แสดงสถานะกำลังเปิดกล้อง
 */
export function ScannerCamera({ onScan, onError, active = true }) {
  const [manualValue, setManualValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const value = manualValue.trim();
    if (!value) {
      onError?.(new Error('กรุณากรอกรหัสนักเรียน'));
      return;
    }
    onScan?.(value);
    setManualValue('');
  };

  return (
    <div class="flex flex-col gap-4">
      {/* Viewfinder */}
      <div class="relative w-full aspect-square max-w-md mx-auto bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
        {/* Corner brackets */}
        <div class="absolute inset-8 pointer-events-none">
          <div class="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-amber-500 rounded-tl-lg" />
          <div class="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-amber-500 rounded-tr-lg" />
          <div class="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-amber-500 rounded-bl-lg" />
          <div class="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-amber-500 rounded-br-lg" />
        </div>

        {/* Scan line animation */}
        {active && (
          <div class="absolute inset-x-8 top-8 bottom-8 overflow-hidden pointer-events-none">
            <div class="w-full h-0.5 bg-amber-500/80 shadow-[0_0_8px_2px_rgba(245,158,11,0.6)] animate-pulse" />
          </div>
        )}

        <div class="text-center text-slate-400 px-6">
          <svg class="h-12 w-12 mx-auto mb-3 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z" />
          </svg>
          <p class="text-sm">ส่องกล้องไปที่ QR Code</p>
        </div>
      </div>

      {/* Manual input fallback */}
      <form onSubmit={handleSubmit} class="flex gap-2 max-w-md mx-auto w-full">
        <input
          type="text"
          value={manualValue}
          onInput={(e) => setManualValue(e.target.value)}
          placeholder="หรือพิมพ์รหัสนักเรียน"
          class="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-sm text-sm focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white placeholder:text-slate-400"
        />
        <button
          type="submit"
          class="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-sm transition-colors"
        >
          ยืนยัน
        </button>
      </form>
    </div>
  );
}
