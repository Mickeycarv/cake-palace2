// In-browser demo "database". Only src/services/api.ts should import this.
// TODO (database): delete this file when api.ts calls real endpoints.
//
// Everything is saved in localStorage so the demo survives a refresh and is
// shared between tabs: place an order in one tab and it appears on /admin in another.
import type { CustomRequest, Order, Product, ShopSettings } from '../types';
import { SAMPLE_MENU } from '../data/menu';
import { buildSampleOrders } from '../data/orders';
import { buildSampleCustomRequests } from '../data/customRequests';
import { DEFAULT_SETTINGS } from '../config/shop';
import { readJSON, STORAGE_KEYS, writeJSON, removeKey } from '../lib/storage';
import { todayISO } from '../lib/dates';

export interface DemoDb {
  version: 1;
  seededOn: string;
  menu: Product[];
  orders: Order[];
  customRequests: CustomRequest[];
  settings: ShopSettings;
}

function seed(): DemoDb {
  return {
    version: 1,
    seededOn: todayISO(),
    menu: structuredClone(SAMPLE_MENU),
    orders: buildSampleOrders(),
    customRequests: buildSampleCustomRequests(),
    settings: structuredClone(DEFAULT_SETTINGS),
  };
}

function load(): DemoDb {
  const saved = readJSON<DemoDb | null>(STORAGE_KEYS.demoDb, null);
  if (!saved || saved.version !== 1 || !Array.isArray(saved.orders)) return seed();
  if (saved.seededOn !== todayISO()) {
    // New day: regenerate the sample orders/requests so their dates stay current,
    // but keep anything created in this browser.
    saved.orders = [...buildSampleOrders(), ...saved.orders.filter((o) => !o.sample)];
    saved.customRequests = [
      ...buildSampleCustomRequests(),
      ...saved.customRequests.filter((r) => !r.sample),
    ];
    saved.seededOn = todayISO();
  }
  saved.settings = { ...DEFAULT_SETTINGS, ...saved.settings };
  return saved;
}

let db: DemoDb = load();
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version++;
  listeners.forEach((l) => l());
}

function persist() {
  if (!writeJSON(STORAGE_KEYS.demoDb, db)) {
    // Storage full or blocked (e.g. large reference photos). The demo keeps working in memory.
    console.warn('Cake Palace demo: could not save to localStorage; changes will last until refresh.');
  }
}

export function readDb(): DemoDb {
  return db;
}

export function commit(mutate: (d: DemoDb) => void): void {
  mutate(db);
  persist();
  emit();
}

export function resetDemoDb(): void {
  db = seed();
  removeKey(STORAGE_KEYS.myOrders);
  persist();
  emit();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVersion(): number {
  return version;
}

// Keep tabs in sync (customer tab ↔ admin tab ↔ delivery tab).
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEYS.demoDb || e.key === null) {
      db = load();
      emit();
    }
  });
}
