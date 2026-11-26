// Shared domain types. When a real API is added, its responses should map onto these.

export type CategoryId = 'cakes' | 'pastries' | 'cupcakes' | 'jar-cakes' | 'dry-cakes-cookies';

export type WeightKg = 0.5 | 1 | 1.5 | 2;
export type WeightKey = '0.5' | '1' | '1.5' | '2';

/** both = customer chooses; eggless-only / egg-only = fixed recipe. */
export type EggOption = 'both' | 'eggless-only' | 'egg-only';

export type Pricing =
  | { kind: 'weight'; prices: Partial<Record<WeightKey, number>> }
  | { kind: 'unit'; price: number; unitLabel: string };

export interface Category {
  id: CategoryId;
  name: string;
  blurb: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategoryId;
  description: string;
  pricing: Pricing;
  egg: EggOption;
  sameDay: boolean;
  bestseller: boolean;
  soldOut: boolean;
  seasonal?: boolean;
  /** How many gallery images exist in /public/images/products (<slug>-1 … <slug>-n). */
  imageCount: number;
}

export interface CartItem {
  key: string;
  productId: string;
  slug: string;
  name: string;
  weight: WeightKg | null;
  eggless: boolean;
  message: string;
  qty: number;
  unitPrice: number;
  sameDay: boolean;
}

export type OrderType = 'pickup' | 'delivery';

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'baking'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'picked_up'
  | 'rejected'
  | 'cancelled';

export interface Address {
  line1: string;
  line2: string;
  landmark: string;
  pincode: string;
  area: string;
}

export interface OrderItem {
  productId: string;
  slug: string;
  name: string;
  weight: WeightKg | number | null;
  eggless: boolean;
  message: string;
  qty: number;
  unitPrice: number;
}

export interface StatusEvent {
  status: OrderStatus;
  at: string;
  note?: string;
}

export type DeliveryMethod = 'own' | 'porter' | 'rapido';

export interface DeliveryAssignment {
  method: DeliveryMethod;
  personId?: string;
  reference?: string;
  assignedAt: string;
}

export interface Payment {
  status: 'paid' | 'refunded';
  method: string;
  reference: string;
  paidAt: string;
}

export interface Order {
  id: string;
  createdAt: string;
  customer: { name: string; phone: string };
  type: OrderType;
  address?: Address;
  distanceKm?: number;
  /** YYYY-MM-DD (shop local date) */
  date: string;
  slotId: string;
  notes: string;
  items: OrderItem[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  payment: Payment;
  status: OrderStatus;
  history: StatusEvent[];
  isNew: boolean;
  delivery?: DeliveryAssignment;
  rejectReason?: string;
  customRequestId?: string;
  /** Seeded demo data (regenerated daily so dates stay fresh). */
  sample?: boolean;
  /** Sample orders shown in "My Orders" as if this browser placed them. */
  demoMine?: boolean;
}

export type CustomRequestStatus = 'new' | 'quoted' | 'paid' | 'declined';

export interface CustomQuote {
  price: number;
  notes: string;
  validUntil: string;
  sentAt: string;
}

export interface CustomRequest {
  id: string;
  createdAt: string;
  occasion: string;
  theme: string;
  flavour: string;
  weightKg: number;
  eggless: boolean;
  tiers: 1 | 2 | 3;
  message: string;
  /** Image URLs (sample SVGs) or small data: URLs made in the browser — never uploaded in v1. */
  referenceImages: string[];
  neededBy: string;
  slotId: string;
  fulfilment: OrderType;
  address?: Address;
  budget: string;
  name: string;
  phone: string;
  notes: string;
  status: CustomRequestStatus;
  quote?: CustomQuote;
  orderId?: string;
  declineReason?: string;
  sample?: boolean;
}

export interface TimeSlot {
  id: string;
  startHour: number;
  endHour: number;
  enabled: boolean;
}

export interface DeliveryTier {
  /** Charge applies up to and including this distance. */
  maxKm: number;
  charge: number;
}

export interface ShopSettings {
  timeSlots: TimeSlot[];
  /** "HH:MM" 24h. After this, same-day menu items move to tomorrow. */
  sameDayCutoff: string;
  /** Minimum minutes between now and the start of a same-day slot. */
  slotLeadMinutes: number;
  customCakeNoticeDays: number;
  /** Notice for menu items NOT marked same-day. */
  advanceNoticeDays: number;
  deliveryTiers: DeliveryTier[];
  /** Beyond this distance we use Porter/Rapido. */
  ownDeliveryMaxKm: number;
  partnerFlatCharge: number;
  maxDeliveryKm: number;
  freeDeliveryMin: number;
  /** Orders at or above this value are suggested for Porter/Rapido. */
  partnerSuggestOrderValue: number;
  holidays: string[];
  whatsappNumber: string;
  egglessSurchargePerHalfKg: number;
  egglessSurchargePerUnit: number;
  /** How many days ahead customers can pick for menu orders. */
  bookingWindowDays: number;
}

export interface DeliveryPerson {
  id: string;
  name: string;
  phone: string;
}

export interface Review {
  id: string;
  name: string;
  area: string;
  rating: number;
  occasion: string;
  text: string;
}

export interface PincodeInfo {
  pincode: string;
  area: string;
  distanceKm: number;
}
