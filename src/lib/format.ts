import type { OrderItem, CartItem, WeightKg } from '../types';

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

/** 1250 -> "₹1,250" */
export function formatINR(amount: number): string {
  return inr.format(Math.round(amount));
}

export function formatWeight(w: WeightKg | number): string {
  if (w === 0.5) return '½ kg';
  if (w === 1.5) return '1½ kg';
  return `${w} kg`;
}

/** "1 kg · Eggless" */
export function describeItemOptions(item: Pick<OrderItem | CartItem, 'weight' | 'eggless'>): string {
  const parts: string[] = [];
  if (item.weight) parts.push(formatWeight(item.weight));
  parts.push(item.eggless ? 'Eggless' : 'With egg');
  return parts.join(' · ');
}

/** "9000010001" or "+91 90000 10001" -> "+91 90000 10001" */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) return phone;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

/** "+91 90000 10001" -> "tel:+919000010001" */
export function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, '').slice(-10);
  return `tel:+91${digits}`;
}

export function plural(n: number, word: string, pluralWord = `${word}s`): string {
  return `${n} ${n === 1 ? word : pluralWord}`;
}
