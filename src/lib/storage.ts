// Safe localStorage wrappers. Storage can be unavailable (private mode, blocked
// site data) or full, so every access is wrapped and failures fall back quietly.

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Returns false if the value could not be saved (e.g. storage full or blocked). */
export function writeJSON(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const STORAGE_KEYS = {
  cart: 'cp_cart_v1',
  myOrders: 'cp_my_orders_v1',
  myRequests: 'cp_my_requests_v1',
  demoDb: 'cp_demo_db_v1',
  deliveryPerson: 'cp_delivery_person_v1',
} as const;
