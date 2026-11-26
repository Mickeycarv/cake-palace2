import { PRODUCT_IMAGE_EXT } from '../config/shop';
import type { CategoryId } from '../types';

/** /images/products/<slug>-<n>.<ext> — see the naming scheme in src/config/shop.ts. */
export function productImage(slug: string, n = 1): string {
  return `/images/products/${slug}-${n}.${PRODUCT_IMAGE_EXT}`;
}

export const PLACEHOLDER_IMAGE = '/images/products/placeholder.svg';

export function categoryImage(id: CategoryId): string {
  return `/images/categories/${id}.svg`;
}

/** wa.me link with a pre-filled message. Number = country code + digits, e.g. 919000000000. */
export function whatsappLink(number: string, text: string): string {
  return `https://wa.me/${number.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}

export function mapsLink(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
