// ─────────────────────────────────────────────────────────────────────────────
// Data access layer. Every screen gets and changes data ONLY through these
// functions, which return Promises. Today they read/write the in-browser demo
// store; later, replace each body with a fetch() to the real API — no screen
// needs to change.
// ─────────────────────────────────────────────────────────────────────────────
import type {
  Address,
  CartItem,
  CustomRequest,
  DeliveryAssignment,
  Order,
  OrderItem,
  OrderStatus,
  OrderType,
  Product,
  ShopSettings,
} from '../types';
import { commit, readDb, resetDemoDb } from './demoStore';
import { nextStatus, quoteDelivery, unitPriceFor, isHoliday, slotsForDate, checkCustomDate } from '../lib/rules';
import { readJSON, STORAGE_KEYS, writeJSON } from '../lib/storage';
import { todayISO } from '../lib/dates';
import { DELIVERY_PEOPLE } from '../data/people';

/** TODO (database): GET /api/staff/delivery */
export async function getDeliveryPeople() {
  return structuredClone(DELIVERY_PEOPLE);
}

/** Small fake network delay so loading states are exercised. */
const wait = (ms = 80) => new Promise<void>((r) => setTimeout(r, ms));
const clone = <T>(v: T): T => structuredClone(v);
const nowIso = () => new Date().toISOString();

class ApiError extends Error {}

// ── Settings ───────────────────────────────────────────────────────────────

export async function getSettings(): Promise<ShopSettings> {
  await wait(0);
  return clone(readDb().settings);
}

export async function saveSettings(settings: ShopSettings): Promise<ShopSettings> {
  // TODO (login): only the owner may call this — enforce on the server.
  await wait();
  commit((d) => {
    d.settings = clone(settings);
  });
  return clone(readDb().settings);
}

// ── Menu ───────────────────────────────────────────────────────────────────

export async function getMenu(): Promise<Product[]> {
  await wait();
  return clone(readDb().menu);
}

export async function getProduct(slug: string): Promise<Product | null> {
  await wait();
  const p = readDb().menu.find((m) => m.slug === slug);
  return p ? clone(p) : null;
}

export async function saveMenuItem(product: Product): Promise<Product> {
  // TODO (database): POST/PUT /api/menu; photo upload to storage.
  await wait();
  commit((d) => {
    const i = d.menu.findIndex((m) => m.id === product.id);
    if (i >= 0) d.menu[i] = clone(product);
    else d.menu.push(clone(product));
  });
  return clone(product);
}

export async function setSoldOut(productId: string, soldOut: boolean): Promise<void> {
  await wait(40);
  commit((d) => {
    const p = d.menu.find((m) => m.id === productId);
    if (p) p.soldOut = soldOut;
  });
}

// ── Orders (customer) ──────────────────────────────────────────────────────

export interface PlaceOrderInput {
  customer: { name: string; phone: string };
  type: OrderType;
  address?: Omit<Address, 'area'>;
  date: string;
  slotId: string;
  notes: string;
  items: CartItem[];
  paymentMethod: string;
}

function nextOrderId(orders: Order[]): string {
  const max = orders.reduce((m, o) => Math.max(m, Number(o.id.replace(/\D/g, '')) || 0), 10254);
  return `CP-${max + 1}`;
}

function rememberMyOrder(id: string) {
  const mine = readJSON<string[]>(STORAGE_KEYS.myOrders, []);
  if (!mine.includes(id)) writeJSON(STORAGE_KEYS.myOrders, [id, ...mine]);
}

/**
 * Creates a paid order. Prices and delivery charges are recalculated here from
 * the menu and settings — never trusted from the cart.
 * TODO (Razorpay): the real flow is (1) server creates a Razorpay order for the
 * total, (2) browser opens Razorpay Checkout, (3) server verifies the payment
 * signature, then (4) saves the order. This mock skips straight to (4).
 * TODO (WhatsApp): after saving, the server sends the shop a WhatsApp alert and
 * the customer a confirmation (WhatsApp Business API / SMS fallback).
 */
export async function placeOrder(input: PlaceOrderInput): Promise<Order> {
  await wait(250);
  const { menu, settings, orders } = readDb();

  if (!input.items.length) throw new ApiError('Your cart is empty.');
  const items: OrderItem[] = input.items.map((ci) => {
    const p = menu.find((m) => m.id === ci.productId);
    if (!p) throw new ApiError(`${ci.name} is no longer on the menu.`);
    if (p.soldOut) throw new ApiError(`Sorry, ${p.name} just sold out. Please remove it from your cart.`);
    return {
      productId: p.id, slug: p.slug, name: p.name, weight: ci.weight,
      eggless: p.egg === 'eggless-only' ? true : ci.eggless && p.egg === 'both',
      message: ci.message.slice(0, 30), qty: Math.max(1, Math.floor(ci.qty)),
      unitPrice: unitPriceFor(p, ci.weight, ci.eggless, settings),
    };
  });
  if (isHoliday(input.date, settings)) throw new ApiError('The shop is closed on that date.');
  if (input.date === todayISO() && !slotsForDate(input.date, settings).some((s) => s.id === input.slotId)) {
    throw new ApiError('That time slot is no longer available. Please pick another.');
  }
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  let deliveryCharge = 0;
  let address: Address | undefined;
  let distanceKm: number | undefined;
  if (input.type === 'delivery') {
    if (!input.address) throw new ApiError('Delivery address missing.');
    const q = quoteDelivery(input.address.pincode, subtotal, settings);
    if (!q.ok) throw new ApiError(q.message);
    deliveryCharge = q.charge;
    distanceKm = q.distanceKm;
    address = { ...input.address, area: q.area };
  }

  const created = nowIso();
  const order: Order = {
    id: nextOrderId(orders),
    createdAt: created,
    customer: input.customer,
    type: input.type,
    address,
    distanceKm,
    date: input.date,
    slotId: input.slotId,
    notes: input.notes,
    items,
    subtotal,
    deliveryCharge,
    total: subtotal + deliveryCharge,
    payment: { status: 'paid', method: input.paymentMethod, reference: `pay_DEMO${Date.now()}`, paidAt: created },
    status: 'placed',
    history: [{ status: 'placed', at: created }],
    isNew: true,
  };
  commit((d) => {
    d.orders.push(order);
  });
  rememberMyOrder(order.id);
  return clone(order);
}

export async function getOrder(id: string): Promise<Order | null> {
  await wait();
  const o = readDb().orders.find((x) => x.id === id);
  return o ? clone(o) : null;
}

/**
 * Orders placed in this browser, plus two sample orders so the page isn't empty.
 * TODO (login): replace with GET /api/me/orders for the phone-OTP-verified customer.
 */
export async function getMyOrders(): Promise<Order[]> {
  await wait();
  const mine = readJSON<string[]>(STORAGE_KEYS.myOrders, []);
  return clone(readDb().orders.filter((o) => mine.includes(o.id) || o.demoMine)).sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
}

// ── Orders (admin) ─────────────────────────────────────────────────────────
// TODO (login): every admin function must require an owner session on the server.

export async function getOrders(): Promise<Order[]> {
  await wait();
  return clone(readDb().orders);
}

function updateOrder(id: string, fn: (o: Order) => void): Order {
  let updated: Order | undefined;
  commit((d) => {
    const o = d.orders.find((x) => x.id === id);
    if (!o) throw new ApiError(`Order ${id} not found.`);
    fn(o);
    updated = o;
  });
  if (!updated) throw new ApiError(`Order ${id} not found.`);
  return clone(updated);
}

function pushStatus(o: Order, status: OrderStatus, note?: string) {
  o.status = status;
  o.isNew = false;
  o.history.push({ status, at: nowIso(), note });
}

/** Moves an order one step along its flow (Accept → Baking → Ready → …). */
export async function advanceOrder(id: string): Promise<Order> {
  // TODO (WhatsApp): notify the customer of each status change.
  await wait();
  return updateOrder(id, (o) => {
    const next = nextStatus(o);
    if (!next) throw new ApiError('This order is already complete.');
    if (next === 'out_for_delivery' && !o.delivery) throw new ApiError('Assign a delivery first.');
    pushStatus(o, next);
  });
}

export async function rejectOrder(id: string, reason: string): Promise<Order> {
  await wait();
  return updateOrder(id, (o) => {
    o.rejectReason = reason;
    pushStatus(o, 'rejected', reason);
  });
}

/** TODO (Razorpay): call the Razorpay refunds API from the server. */
export async function refundOrder(id: string): Promise<Order> {
  await wait(300);
  return updateOrder(id, (o) => {
    o.payment.status = 'refunded';
    o.history.push({ status: o.status, at: nowIso(), note: `Refund of ₹${o.total} issued (demo)` });
  });
}

export async function assignDelivery(id: string, assignment: Omit<DeliveryAssignment, 'assignedAt'>): Promise<Order> {
  // TODO (Porter/Rapido): book via their business APIs and store the real reference.
  await wait();
  return updateOrder(id, (o) => {
    o.delivery = { ...assignment, assignedAt: nowIso() };
    const who =
      assignment.method === 'own'
        ? `own delivery – ${DELIVERY_PEOPLE.find((p) => p.id === assignment.personId)?.name ?? assignment.personId}`
        : `${assignment.method === 'porter' ? 'Porter' : 'Rapido'} ref ${assignment.reference}`;
    o.history.push({ status: o.status, at: nowIso(), note: `Delivery assigned: ${who}` });
  });
}

// ── Delivery person ────────────────────────────────────────────────────────

/**
 * Today's own-delivery orders for one delivery person — without prices.
 * TODO (login): the server derives personId from the logged-in delivery person
 * and returns only these fields; prices/other orders never reach their phone.
 */
export type DeliveryJob = Pick<Order, 'id' | 'customer' | 'address' | 'date' | 'slotId' | 'notes' | 'status' | 'distanceKm'> & {
  items: Omit<OrderItem, 'unitPrice'>[];
};

export async function getMyDeliveries(personId: string): Promise<DeliveryJob[]> {
  await wait();
  const today = todayISO();
  return readDb()
    .orders.filter(
      (o) =>
        o.type === 'delivery' &&
        o.date === today &&
        o.delivery?.method === 'own' &&
        o.delivery.personId === personId &&
        o.status !== 'rejected' &&
        o.status !== 'cancelled',
    )
    .map((o) => ({
      id: o.id,
      customer: { ...o.customer },
      address: o.address ? { ...o.address } : undefined,
      date: o.date,
      slotId: o.slotId,
      notes: o.notes,
      status: o.status,
      distanceKm: o.distanceKm,
      items: o.items.map(({ unitPrice: _omit, ...rest }) => ({ ...rest })),
    }));
}

export async function riderPickedUp(id: string, personName: string): Promise<void> {
  await wait();
  updateOrder(id, (o) => {
    if (o.status !== 'ready') throw new ApiError('This order is not ready yet — check with the kitchen.');
    pushStatus(o, 'out_for_delivery', `Picked up by ${personName}`);
  });
}

export async function riderDelivered(id: string, personName: string): Promise<void> {
  await wait();
  updateOrder(id, (o) => {
    if (o.status !== 'out_for_delivery') throw new ApiError('Mark it picked up first.');
    pushStatus(o, 'delivered', `Delivered by ${personName}`);
  });
}

// ── Custom cakes ───────────────────────────────────────────────────────────

export type CustomRequestInput = Omit<CustomRequest, 'id' | 'createdAt' | 'status' | 'quote' | 'orderId' | 'sample'>;

/**
 * TODO (storage): upload reference photos (e.g. Cloudflare R2) and save URLs.
 * TODO (WhatsApp): alert the shop about the new request.
 */
export async function submitCustomRequest(input: CustomRequestInput): Promise<CustomRequest> {
  await wait(250);
  const { settings, customRequests } = readDb();
  const dateError = checkCustomDate(input.neededBy, settings);
  if (dateError) throw new ApiError(dateError);
  const max = customRequests.reduce((m, r) => Math.max(m, Number(r.id.replace(/\D/g, '')) || 0), 1004);
  const req: CustomRequest = { ...input, id: `CR-${max + 1}`, createdAt: nowIso(), status: 'new' };
  commit((d) => {
    d.customRequests.push(req);
  });
  return clone(req);
}

export async function getCustomRequests(): Promise<CustomRequest[]> {
  await wait();
  return clone(readDb().customRequests).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getCustomRequest(id: string): Promise<CustomRequest | null> {
  await wait();
  const r = readDb().customRequests.find((x) => x.id === id);
  return r ? clone(r) : null;
}

function updateRequest(id: string, fn: (r: CustomRequest) => void): CustomRequest {
  let updated: CustomRequest | undefined;
  commit((d) => {
    const r = d.customRequests.find((x) => x.id === id);
    if (!r) throw new ApiError(`Request ${id} not found.`);
    fn(r);
    updated = r;
  });
  return clone(updated as CustomRequest);
}

/** TODO (WhatsApp): send the customer the quote link /quote/:id on WhatsApp. */
export async function sendQuote(id: string, quote: { price: number; notes: string; validUntil: string }): Promise<CustomRequest> {
  await wait();
  return updateRequest(id, (r) => {
    r.quote = { ...quote, sentAt: nowIso() };
    r.status = 'quoted';
  });
}

export async function declineCustomRequest(id: string, reason: string): Promise<CustomRequest> {
  await wait();
  return updateRequest(id, (r) => {
    r.status = 'declined';
    r.declineReason = reason;
  });
}

/** Customer pays a quote (mock) → creates a confirmed order. TODO (Razorpay) as in placeOrder. */
export async function payQuote(id: string, paymentMethod: string): Promise<Order> {
  await wait(250);
  const { customRequests, orders, settings } = readDb();
  const r = customRequests.find((x) => x.id === id);
  if (!r || !r.quote) throw new ApiError('Quote not found.');
  if (r.status === 'paid' && r.orderId) throw new ApiError('This quote is already paid.');
  if (r.quote.validUntil < todayISO()) throw new ApiError('This quote has expired. Please message us on WhatsApp.');
  const created = nowIso();
  const order: Order = {
    id: nextOrderId(orders),
    createdAt: created,
    customer: { name: r.name, phone: r.phone },
    type: r.fulfilment,
    address: r.address,
    distanceKm: r.address ? (quoteDelivery(r.address.pincode, 0, settings) as { distanceKm?: number }).distanceKm : undefined,
    date: r.neededBy,
    slotId: r.slotId,
    notes: r.notes,
    items: [{
      productId: 'custom', slug: 'custom-cake',
      name: `Custom ${r.occasion.toLowerCase()} cake${r.tiers > 1 ? ` (${r.tiers} tiers)` : ''}`,
      weight: r.weightKg, eggless: r.eggless, message: r.message, qty: 1, unitPrice: r.quote.price,
    }],
    subtotal: r.quote.price,
    deliveryCharge: 0,
    total: r.quote.price,
    payment: { status: 'paid', method: paymentMethod, reference: `pay_DEMO${Date.now()}`, paidAt: created },
    status: 'placed',
    history: [{ status: 'placed', at: created, note: `From custom request ${r.id}` }],
    isNew: true,
    customRequestId: r.id,
  };
  commit((d) => {
    d.orders.push(order);
    const req = d.customRequests.find((x) => x.id === id);
    if (req) {
      req.status = 'paid';
      req.orderId = order.id;
    }
  });
  rememberMyOrder(order.id);
  return clone(order);
}

// ── Demo helpers ───────────────────────────────────────────────────────────

export async function resetDemo(): Promise<void> {
  await wait();
  resetDemoDb();
}

export { ApiError };
