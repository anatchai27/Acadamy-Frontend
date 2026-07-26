import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { HiOutlineCamera } from 'react-icons/hi2';
import jsQR from 'jsqr';

export function ScannerCamera({ onScan, onError, active = true }) {
  const [manualValue, setManualValue] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanningRef = useRef(false);
  const lastScanRef = useRef('');

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 640 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', '');
        await videoRef.current.play();
        setCameraReady(true);
        setCameraError(false);
        scanningRef.current = true;
        scanFrame();
      }
    } catch {
      setCameraError(true);
      onError?.(new Error('ไม่สามารถเปิดกล้องได้'));
    }
  }, [onError]);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  const scanFrame = () => {
    if (!scanningRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) {
      requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code && code.data !== lastScanRef.current) {
      lastScanRef.current = code.data;
      onScan?.(code.data);
      setTimeout(() => { lastScanRef.current = ''; }, 3000);
    }

    requestAnimationFrame(scanFrame);
  };

  useEffect(() => {
    if (active) {
      startCamera();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [active, startCamera, stopCamera]);

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
      <div class="relative w-full aspect-square max-w-md mx-auto bg-zinc-800 rounded-2xl overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          class={`w-full h-full object-cover ${cameraReady ? 'block' : 'hidden'}`}
          muted
          playsinline
        />
        <canvas ref={canvasRef} class="hidden" />

        {!cameraReady && !cameraError && (
          <div class="text-center text-zinc-400 px-6"><HiOutlineCamera class="h-12 w-12 mx-auto mb-3 text-oasis-primary animate-pulse" />
            <p class="text-sm">กำลังเปิดกล้อง...</p>
          </div>
        )}

        {cameraError && (
          <div class="text-center text-zinc-400 px-6"><HiOutlineCamera class="h-12 w-12 mx-auto mb-3 text-oasis-primary" />
            <p class="text-sm">ส่องกล้องไปที่ QR Code</p>
          </div>
        )}

        {cameraReady && (
          <>
            <div class="absolute inset-8 pointer-events-none">
              <div class="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-oasis-primary" />
              <div class="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-oasis-primary" />
              <div class="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-oasis-primary" />
              <div class="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-oasis-primary" />
            </div>
            <div class="absolute inset-x-8 top-8 bottom-8 overflow-hidden pointer-events-none">
              <div class="w-full h-0.5 bg-blue-500/80 shadow-[0_0_8px_2px_rgba(59,130,246,0.4)] animate-pulse" />
            </div>
          </>
        )}
      </div>

      <form onSubmit={handleSubmit} class="flex gap-2 max-w-md mx-auto w-full">
        <input
          type="text"
          value={manualValue}
          onInput={(e) => setManualValue(e.target.value)}
          placeholder="หรือพิมพ์รหัสนักเรียน"
          class="flex-1 px-4 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-oasis-primary focus:ring-2 focus:ring-oasis-primary/10 text-zinc-800 placeholder:text-zinc-400"
        />
        <button
          type="submit"
          class="px-5 py-2.5 bg-oasis-primary hover:bg-oasis-primary-dark text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          ยืนยัน
        </button>
      </form>
    </div>
  );
}