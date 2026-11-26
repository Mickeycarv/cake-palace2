// Ordering rules. Every function takes ShopSettings so values come from
// src/config/shop.ts (or the admin Settings screen), never hard-coded here.
// TODO (database): re-check all of these on the server when orders are created —
// browser checks are for convenience only and can be bypassed.
import type {
  Order,
  OrderStatus,
  OrderType,
  Product,
  ShopSettings,
  TimeSlot,
  WeightKg,
  WeightKey,
} from '../types';
import { PINCODES } from '../data/pincodes';
import { addDaysISO, formatHour, minutesNow, parseHHMM, todayISO } from './dates';
import { formatINR } from './format';

// ── Pricing ────────────────────────────────────────────────────────────────

export function weightKey(w: WeightKg): WeightKey {
  return String(w) as WeightKey;
}

export function availableWeights(p: Product): WeightKg[] {
  if (p.pricing.kind !== 'weight') return [];
  const prices = p.pricing.prices;
  return ([0.5, 1, 1.5, 2] as WeightKg[]).filter((w) => typeof prices[weightKey(w)] === 'number');
}

export function basePrice(p: Product, weight: WeightKg | null): number {
  if (p.pricing.kind === 'unit') return p.pricing.price;
  const w = weight ?? availableWeights(p)[0] ?? 0.5;
  return p.pricing.prices[weightKey(w)] ?? 0;
}

export function egglessSurcharge(p: Product, weight: WeightKg | null, s: ShopSettings): number {
  if (p.pricing.kind === 'unit') return s.egglessSurchargePerUnit;
  const w = weight ?? 0.5;
  return Math.round((w / 0.5) * s.egglessSurchargePerHalfKg);
}

/** Price for one item with the chosen options. Eggless-only items have no surcharge. */
export function unitPriceFor(p: Product, weight: WeightKg | null, eggless: boolean, s: ShopSettings): number {
  const extra = eggless && p.egg === 'both' ? egglessSurcharge(p, weight, s) : 0;
  return basePrice(p, weight) + extra;
}

export function startingPrice(p: Product): number {
  if (p.pricing.kind === 'unit') return p.pricing.price;
  return Math.min(...Object.values(p.pricing.prices).filter((v): v is number => typeof v === 'number'));
}

export function priceLabel(p: Product): string {
  if (p.pricing.kind === 'unit') return `${formatINR(p.pricing.price)} ${p.pricing.unitLabel}`;
  return `From ${formatINR(startingPrice(p))} (½ kg)`;
}

export function isEgglessAvailable(p: Product): boolean {
  return p.egg !== 'egg-only';
}

// ── Time slots and dates ───────────────────────────────────────────────────

export function slotLabel(slot: Pick<TimeSlot, 'startHour' | 'endHour'>): string {
  return `${formatHour(slot.startHour)} – ${formatHour(slot.endHour)}`;
}

export function slotLabelById(s: ShopSettings, id: string): string {
  const slot = s.timeSlots.find((t) => t.id === id);
  if (slot) return slotLabel(slot);
  // Slot may have been removed from settings after the order was placed.
  const [a, b] = id.split('-').map(Number);
  return Number.isFinite(a) && Number.isFinite(b) ? slotLabel({ startHour: a, endHour: b }) : id;
}

export function slotStartHour(s: ShopSettings, id: string): number {
  return s.timeSlots.find((t) => t.id === id)?.startHour ?? Number(id.split('-')[0]) ?? 0;
}

export function isHoliday(date: string, s: ShopSettings): boolean {
  return s.holidays.includes(date);
}

/** Enabled slots for a date. For today, slots starting too soon (or already past) are hidden. */
export function slotsForDate(date: string, s: ShopSettings, now: Date = new Date()): TimeSlot[] {
  const enabled = s.timeSlots.filter((t) => t.enabled).sort((a, b) => a.startHour - b.startHour);
  if (date !== todayISO(now)) return enabled;
  const earliestStart = minutesNow(now) + s.slotLeadMinutes;
  return enabled.filter((t) => t.startHour * 60 >= earliestStart);
}

export function isPastSameDayCutoff(s: ShopSettings, now: Date = new Date()): boolean {
  return minutesNow(now) >= parseHHMM(s.sameDayCutoff);
}

/** First date a menu order could be scheduled for, before holidays/slots are considered. */
export function earliestMenuDate(allSameDay: boolean, s: ShopSettings, now: Date = new Date()): string {
  const today = todayISO(now);
  if (!allSameDay) return addDaysISO(today, Math.max(1, s.advanceNoticeDays));
  return isPastSameDayCutoff(s, now) ? addDaysISO(today, 1) : today;
}

export function earliestCustomDate(s: ShopSettings, now: Date = new Date()): string {
  return addDaysISO(todayISO(now), s.customCakeNoticeDays);
}

export interface DateOption {
  date: string;
  disabled: boolean;
  reason?: string;
}

/** Date choices for checkout, with the reason each disabled day can't be picked. */
export function orderDateOptions(allSameDay: boolean, s: ShopSettings, now: Date = new Date()): DateOption[] {
  const today = todayISO(now);
  const earliest = earliestMenuDate(allSameDay, s, now);
  const out: DateOption[] = [];
  for (let i = 0; i < s.bookingWindowDays; i++) {
    const date = addDaysISO(today, i);
    if (date < earliest) {
      out.push({ date, disabled: true, reason: allSameDay ? 'Past same-day cut-off' : 'Needs advance notice' });
    } else if (isHoliday(date, s)) {
      out.push({ date, disabled: true, reason: 'Shop closed' });
    } else if (slotsForDate(date, s, now).length === 0) {
      out.push({ date, disabled: true, reason: 'No slots left' });
    } else {
      out.push({ date, disabled: false });
    }
  }
  return out;
}

/** Validation for a custom-cake "needed by" date. Returns an error message or null. */
export function checkCustomDate(date: string, s: ShopSettings, now: Date = new Date()): string | null {
  if (!date) return 'Please choose the date you need the cake.';
  if (date < earliestCustomDate(s, now))
    return `Custom cakes need at least ${s.customCakeNoticeDays} days' notice.`;
  if (isHoliday(date, s)) return 'The shop is closed on this date. Please pick another day.';
  return null;
}

// ── Delivery ───────────────────────────────────────────────────────────────

export type DeliveryQuote =
  | {
      ok: true;
      pincode: string;
      area: string;
      distanceKm: number;
      charge: number;
      viaPartner: boolean;
      freeApplied: boolean;
      note: string;
    }
  | { ok: false; reason: 'invalid' | 'unknown' | 'too-far'; message: string; distanceKm?: number };

export function lookupPincode(pincode: string) {
  return PINCODES.find((p) => p.pincode === pincode.trim());
}

/**
 * Mock delivery quote from the pincode table.
 * Tiers (default): ≤3 km free, ≤6 km ₹40, ≤8 km ₹80; beyond 8 km Porter/Rapido flat ₹120;
 * beyond 15 km not available. Orders ≥ ₹1,500 within 8 km deliver free.
 */
export function quoteDelivery(pincode: string, subtotal: number, s: ShopSettings): DeliveryQuote {
  if (!/^\d{6}$/.test(pincode.trim())) {
    return { ok: false, reason: 'invalid', message: 'Enter a 6-digit pincode.' };
  }
  const info = lookupPincode(pincode);
  if (!info) {
    return {
      ok: false,
      reason: 'unknown',
      message: "We don't have this pincode in our demo list yet. Try 500034, 500033, 500081 or 500032 — or choose pickup.",
    };
  }
  const d = info.distanceKm;
  if (d > s.maxDeliveryKm) {
    return {
      ok: false,
      reason: 'too-far',
      distanceKm: d,
      message: `Sorry, ${info.area} is about ${d} km away. We deliver up to ${s.maxDeliveryKm} km — pickup is available.`,
    };
  }
  if (d > s.ownDeliveryMaxKm) {
    return {
      ok: true,
      pincode: info.pincode,
      area: info.area,
      distanceKm: d,
      charge: s.partnerFlatCharge,
      viaPartner: true,
      freeApplied: false,
      note: `Delivered via Porter/Rapido – ${formatINR(s.partnerFlatCharge)} flat (sample)`,
    };
  }
  const tiers = [...s.deliveryTiers].sort((a, b) => a.maxKm - b.maxKm);
  const tier = tiers.find((t) => d <= t.maxKm) ?? tiers[tiers.length - 1];
  const tierCharge = tier?.charge ?? 0;
  const freeApplied = tierCharge > 0 && subtotal >= s.freeDeliveryMin;
  const charge = freeApplied ? 0 : tierCharge;
  let note: string;
  if (freeApplied) note = `Free delivery on orders of ${formatINR(s.freeDeliveryMin)} or more`;
  else if (charge === 0) note = 'Free delivery nearby';
  else note = `Add ${formatINR(s.freeDeliveryMin - subtotal)} more for free delivery`;
  return { ok: true, pincode: info.pincode, area: info.area, distanceKm: d, charge, viaPartner: false, freeApplied, note };
}

export function suggestDeliveryMethod(
  order: Pick<Order, 'distanceKm' | 'total'>,
  s: ShopSettings,
): { method: 'own' | 'partner'; reason: string } {
  const d = order.distanceKm ?? 0;
  if (d > s.ownDeliveryMaxKm)
    return { method: 'partner', reason: `${d} km is beyond our ${s.ownDeliveryMaxKm} km own-delivery range.` };
  if (order.total >= s.partnerSuggestOrderValue)
    return {
      method: 'partner',
      reason: `Large order (${formatINR(order.total)} ≥ ${formatINR(s.partnerSuggestOrderValue)}) — use Porter/Rapido for a safer ride.`,
    };
  return { method: 'own', reason: `${d} km is within ${s.ownDeliveryMaxKm} km — our own delivery person can take it.` };
}

// ── Order status ───────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: 'Placed',
  accepted: 'Accepted',
  baking: 'Baking',
  ready: 'Ready',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  picked_up: 'Picked up',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export function statusFlow(type: OrderType): OrderStatus[] {
  return type === 'delivery'
    ? ['placed', 'accepted', 'baking', 'ready', 'out_for_delivery', 'delivered']
    : ['placed', 'accepted', 'baking', 'ready', 'picked_up'];
}

export function nextStatus(order: Pick<Order, 'type' | 'status'>): OrderStatus | null {
  const flow = statusFlow(order.type);
  const i = flow.indexOf(order.status);
  if (i < 0 || i === flow.length - 1) return null;
  return flow[i + 1];
}

export const NEXT_ACTION_LABEL: Partial<Record<OrderStatus, string>> = {
  accepted: 'Accept',
  baking: 'Mark Baking',
  ready: 'Mark Ready',
  out_for_delivery: 'Mark Out for delivery',
  delivered: 'Mark Delivered',
  picked_up: 'Mark Picked up',
};

export function isClosed(order: Pick<Order, 'status'>): boolean {
  return ['delivered', 'picked_up', 'rejected', 'cancelled'].includes(order.status);
}

export function isCancelled(order: Pick<Order, 'status'>): boolean {
  return order.status === 'rejected' || order.status === 'cancelled';
}
