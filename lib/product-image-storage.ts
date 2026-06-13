export const PRODUCT_IMAGES_BUCKET = 'product-images';
export const PRODUCT_IMAGES_ROOT = 'seed-products';

function cleanSegment(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function createProductImageObjectPath(productId: string, fileName: string) {
  const dotIndex = fileName.lastIndexOf('.');
  const rawBase = dotIndex > -1 ? fileName.slice(0, dotIndex) : fileName;
  const rawExt = dotIndex > -1 ? fileName.slice(dotIndex + 1) : 'jpg';
  const base = cleanSegment(rawBase) || 'image';
  const ext = cleanSegment(rawExt) || 'jpg';
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  return `${PRODUCT_IMAGES_ROOT}/${productId}/${unique}-${base}.${ext}`;
}
