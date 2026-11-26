/**
 * Shrinks a chosen photo to a small JPEG data URL for preview (and so the demo
 * can show it on /admin/custom). Nothing is uploaded anywhere.
 * TODO (storage): upload the original to object storage (e.g. Cloudflare R2) via a signed URL.
 */
export async function fileToThumbnail(file: File, maxSide = 480): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.78);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
