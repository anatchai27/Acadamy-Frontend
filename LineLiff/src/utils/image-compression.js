const MAX_COMPRESSION_ATTEMPTS = 6;

const loadImage = file => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(url);
    resolve(image);
  };
  image.onerror = () => {
    URL.revokeObjectURL(url);
    reject(new Error('เปิดรูปภาพไม่สำเร็จ'));
  };
  image.src = url;
});

const canvasBlob = (canvas, quality) => new Promise((resolve, reject) => {
  canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('บีบอัดรูปภาพไม่สำเร็จ')), 'image/jpeg', quality);
});

export const compressImageFile = async (file, maxBytes = 2 * 1024 * 1024) => {
  if (!file || file.size <= maxBytes) return file;
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    throw new Error('อุปกรณ์นี้ไม่รองรับการบีบอัดรูปภาพ');
  }

  const image = await loadImage(file);
  let scale = Math.min(1, Math.sqrt(maxBytes / file.size) * 1.5);

  for (let attempt = 0; attempt < MAX_COMPRESSION_ATTEMPTS; attempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);

    const quality = Math.max(0.35, 0.82 - (attempt * 0.1));
    const blob = await canvasBlob(canvas, quality);
    if (blob.size <= maxBytes) {
      return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
        type: 'image/jpeg',
        lastModified: file.lastModified,
      });
    }
    scale *= 0.75;
  }

  throw new Error('รูปภาพใหญ่เกินไปหลังบีบอัด กรุณาถ่ายรูปใหม่ให้ใกล้ขึ้น');
};
