export type CompressionResult = {
  file: File;
  originalBytes: number;
  compressedBytes: number;
  width: number;
  height: number;
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Không đọc được ảnh để nén'));
    };
    img.src = url;
  });
}

export async function compressImageForChat(file: File, maxDimension = 1600, quality = 0.82): Promise<CompressionResult> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Tệp đã chọn không phải ảnh');
  }

  if (typeof window === 'undefined') {
    return {
      file,
      originalBytes: file.size,
      compressedBytes: file.size,
      width: 0,
      height: 0
    };
  }

  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  const ratio = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * ratio));
  const height = Math.max(1, Math.round(img.height * ratio));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Không khởi tạo được canvas để nén ảnh');
  ctx.drawImage(img, 0, 0, width, height);

  const preferredType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, preferredType, quality));
  if (!blob) throw new Error('Không nén được ảnh');

  const output = new File(
    [blob],
    file.name.replace(/\.[^.]+$/, preferredType === 'image/png' ? '.png' : '.jpg'),
    { type: preferredType }
  );

  if (output.size >= file.size * 0.98) {
    return {
      file,
      originalBytes: file.size,
      compressedBytes: file.size,
      width,
      height
    };
  }

  return {
    file: output,
    originalBytes: file.size,
    compressedBytes: output.size,
    width,
    height
  };
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}
