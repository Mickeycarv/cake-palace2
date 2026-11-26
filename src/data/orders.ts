// SAMPLE ORDERS — fake customers, phones and addresses for the demo.
// Dates are relative to today (day 0) so the Orders Board always looks "live".
// TODO (database): delete this file once orders come from the real API.
import type {
  Address, DeliveryMethod, Order, OrderItem, OrderStatus, OrderType, StatusEvent, WeightKg,
} from '../types';
import { SAMPLE_MENU } from './menu';
import { DEFAULT_SETTINGS } from '../config/shop';
import { lookupPincode, quoteDelivery, statusFlow, unitPriceFor } from '../lib/rules';
import { addDaysISO, todayISO } from '../lib/dates';

type ItemSpec = [slug: string, weight: WeightKg | null, eggless: boolean, message: string, qty: number];

interface Spec {
  id: string;
  day: number;
  slot: string;
  name: string;
  phone: string;
  type: OrderType;
  pincode?: string;
  line1?: string;
  items: ItemSpec[];
  status: OrderStatus;
  assign?: { method: DeliveryMethod; personId?: string; reference?: string };
  notes?: string;
  demoMine?: boolean;
  reason?: string;
  custom?: { requestId: string; name: string; weight: number; eggless: boolean; message: string; price: number };
}

const SPECS: Spec[] = [
  // Past
  { id: 'CP-10231', day: -3, slot: '18-20', name: 'You (sample)', phone: '+91 90000 10001', type: 'delivery',
    pincode: '500033', line1: 'Flat 302, Sai Residency, Road No. 5', status: 'delivered', demoMine: true,
    items: [['black-forest', 1, false, 'Happy Birthday Amma', 1], ['choco-chip-cupcake', null, false, '', 6]],
    assign: { method: 'own', personId: 'dp-ravi' } },
  { id: 'CP-10235', day: -2, slot: '16-18', name: 'Arjun Rao', phone: '+91 90000 10002', type: 'pickup',
    status: 'picked_up', items: [['red-velvet', 0.5, true, 'Happy Anniversary', 1]] },
  { id: 'CP-10238', day: -1, slot: '12-14', name: 'Sana Fatima', phone: '+91 90000 10003', type: 'delivery',
    pincode: '500028', line1: 'H.No 12-2-417, Gudimalkapur', status: 'cancelled', reason: 'Customer asked to cancel — refunded',
    items: [['pineapple-cake', 1, false, 'Congrats Faiz', 1]] },
  { id: 'CP-10240', day: -1, slot: '20-22', name: 'Karthik Varma', phone: '+91 90000 10004', type: 'delivery',
    pincode: '500081', line1: 'Tower B, 1104, Cyber Meadows', status: 'delivered',
    items: [['chocolate-truffle', 1, false, 'Well done Team!', 1], ['tiramisu-jar', null, false, '', 4]],
    assign: { method: 'own', personId: 'dp-imran' } },

  // Today
  { id: 'CP-10241', day: 0, slot: '10-12', name: 'Meghana Goud', phone: '+91 90000 10005', type: 'pickup',
    status: 'picked_up', items: [['belgian-chocolate-pastry', null, false, '', 4], ['osmania-cookies', null, true, '', 2]] },
  { id: 'CP-10242', day: 0, slot: '12-14', name: 'Mohammed Irfan', phone: '+91 90000 10006', type: 'delivery',
    pincode: '500082', line1: '3rd floor, Raj Bhavan Road Apartments', status: 'delivered',
    items: [['butterscotch-crunch', 1, false, 'Happy Birthday Zaid', 1]], assign: { method: 'own', personId: 'dp-ravi' } },
  { id: 'CP-10243', day: 0, slot: '14-16', name: 'Sneha Kulkarni', phone: '+91 90000 10007', type: 'delivery',
    pincode: '500016', line1: 'Plot 45, Prakash Nagar', status: 'out_for_delivery',
    items: [['red-velvet', 1, true, 'Happy 25th Sneha', 1]], assign: { method: 'own', personId: 'dp-ravi' },
    notes: 'Please call before arriving — gate is locked.' },
  { id: 'CP-10244', day: 0, slot: '16-18', name: 'Rahul Agarwal', phone: '+91 90000 10008', type: 'delivery',
    pincode: '500028', line1: 'Flat 201, Laxmi Towers, Rethibowli', status: 'ready',
    items: [['dutch-truffle', 0.5, false, 'Get well soon Dadi', 1]], assign: { method: 'own', personId: 'dp-imran' } },
  { id: 'CP-10245', day: 0, slot: '16-18', name: 'Ayesha Siddiqui', phone: '+91 90000 10009', type: 'pickup',
    status: 'ready', items: [['rasmalai-pastry', null, false, '', 6], ['red-velvet-pastry', null, true, '', 2]] },
  { id: 'CP-10246', day: 0, slot: '18-20', name: 'You (sample)', phone: '+91 90000 10001', type: 'delivery',
    pincode: '500034', line1: 'Villa 7, Green Park Colony, Road No. 10', status: 'baking', demoMine: true,
    items: [['chocolate-truffle', 1.5, true, 'Happy 10th Birthday Riya', 1]], assign: { method: 'own', personId: 'dp-ravi' } },
  { id: 'CP-10247', day: 0, slot: '18-20', name: 'Vikram Naidu', phone: '+91 90000 10010', type: 'delivery',
    pincode: '500032', line1: 'Flat 1502, Aparna Towers, Nanakramguda', status: 'baking',
    items: [['pista-badam-cake', 1, false, 'Happy Diwali', 1]], assign: { method: 'porter', reference: 'PTR-58213' } },
  { id: 'CP-10248', day: 0, slot: '20-22', name: 'Lakshmi Prasanna', phone: '+91 90000 10011', type: 'pickup',
    status: 'accepted', items: [['classic-vanilla', 1, true, 'Happy Birthday Chinnu', 1]] },
  { id: 'CP-10249', day: 0, slot: '20-22', name: 'Faizan Ali', phone: '+91 90000 10012', type: 'delivery',
    pincode: '500033', line1: 'House 8-2-293, Film Nagar', status: 'placed',
    items: [['black-forest', 0.5, false, 'Love you Ammi', 1], ['black-forest-pastry', null, false, '', 2]] },
  { id: 'CP-10250', day: 0, slot: '20-22', name: 'Divya Sharma', phone: '+91 90000 10013', type: 'pickup',
    status: 'placed', items: [['blueberry-cheesecake-slice', null, false, '', 2], ['nutella-jar', null, true, '', 2]] },

  // Upcoming
  { id: 'CP-10251', day: 1, slot: '10-12', name: 'Nikhil Chowdary', phone: '+91 90000 10014', type: 'delivery',
    pincode: '500081', line1: 'Office: 6th floor, Mindspace Building 12A', status: 'placed',
    notes: 'Office party for 40 people. Deliver to reception.',
    items: [['chocolate-truffle', 2, false, 'Congrats on the launch!', 1], ['belgian-chocolate-pastry', null, false, '', 12],
      ['vanilla-sprinkle-cupcake', null, false, '', 12]] },
  { id: 'CP-10252', day: 1, slot: '14-16', name: 'Harika Yadav', phone: '+91 90000 10015', type: 'pickup',
    status: 'accepted', items: [['rasmalai-cake', 1, true, 'Happy Anniversary Amma Nanna', 1]] },
  { id: 'CP-10253', day: 1, slot: '18-20', name: 'Zoya Khan', phone: '+91 90000 10016', type: 'delivery',
    pincode: '500003', line1: 'Flat 4C, Paradise Apartments, SD Road', status: 'placed',
    items: [['red-velvet', 1, false, 'Happy Birthday Zoya', 1]] },
  { id: 'CP-10254', day: 2, slot: '16-18', name: 'Anjali Menon', phone: '+91 90000 10017', type: 'delivery',
    pincode: '500034', line1: 'Flat 9, Lake View Residency, Road No. 2', status: 'accepted', items: [],
    custom: { requestId: 'CR-1003', name: 'Custom baby shower cake (2 tiers)', weight: 2, eggless: true,
      message: 'Welcome Little One', price: 3200 } },
  { id: 'CP-10255', day: 3, slot: '12-14', name: 'Srinivas Murthy', phone: '+91 90000 10018', type: 'pickup',
    status: 'placed', items: [['gulab-jamun-cake', 1.5, true, 'Happy 60th Birthday Nanna', 1]] },
];

function buildItems(spec: Spec): OrderItem[] {
  if (spec.custom) {
    return [{
      productId: 'custom', slug: 'custom-cake', name: spec.custom.name, weight: spec.custom.weight,
      eggless: spec.custom.eggless, message: spec.custom.message, qty: 1, unitPrice: spec.custom.price,
    }];
  }
  return spec.items.map(([slug, weight, eggless, message, qty]) => {
    const p = SAMPLE_MENU.find((m) => m.slug === slug);
    if (!p) throw new Error(`Sample order references unknown product ${slug}`);
    return {
      productId: p.id, slug, name: p.name, weight, eggless: p.egg === 'eggless-only' ? true : eggless,
      message, qty, unitPrice: unitPriceFor(p, weight, eggless, DEFAULT_SETTINGS),
    };
  });
}

export function buildSampleOrders(now: Date = new Date()): Order[] {
  const today = todayISO(now);
  return SPECS.map((spec, idx) => {
    const date = addDaysISO(today, spec.day);
    const items = buildItems(spec);
    const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);

    let address: Address | undefined;
    let distanceKm: number | undefined;
    let deliveryCharge = 0;
    if (spec.type === 'delivery' && spec.pincode) {
      const info = lookupPincode(spec.pincode);
      address = { line1: spec.line1 ?? '', line2: info?.area ?? '', landmark: '', pincode: spec.pincode, area: info?.area ?? '' };
      const q = quoteDelivery(spec.pincode, subtotal, DEFAULT_SETTINGS);
      if (q.ok) {
        distanceKm = q.distanceKm;
        deliveryCharge = spec.custom ? 0 : q.charge;
      }
    }

    // Created a day before for past/future orders, a few hours ago for today's.
    const created = new Date(now);
    if (spec.day === 0) created.setHours(Math.max(7, now.getHours() - 3 - (idx % 4)), (idx * 13) % 60, 0, 0);
    else {
      const base = new Date(`${addDaysISO(date, -1)}T00:00:00`);
      base.setHours(10 + (idx % 9), (idx * 17) % 60);
      created.setTime(Math.min(base.getTime(), now.getTime() - 3_600_000));
    }

    const flow = statusFlow(spec.type);
    const reached = spec.status === 'cancelled' || spec.status === 'rejected'
      ? ['placed' as OrderStatus]
      : flow.slice(0, flow.indexOf(spec.status) + 1);
    const history: StatusEvent[] = reached.map((status, i) => ({
      status,
      at: new Date(Math.min(created.getTime() + i * 35 * 60_000, now.getTime())).toISOString(),
    }));
    if (spec.status === 'cancelled' || spec.status === 'rejected') {
      history.push({ status: spec.status, at: new Date(created.getTime() + 20 * 60_000).toISOString(), note: spec.reason });
    }

    const order: Order = {
      id: spec.id,
      createdAt: created.toISOString(),
      customer: { name: spec.name, phone: spec.phone },
      type: spec.type,
      address,
      distanceKm,
      date,
      slotId: spec.slot,
      notes: spec.notes ?? '',
      items,
      subtotal,
      deliveryCharge,
      total: subtotal + deliveryCharge,
      payment: {
        status: spec.status === 'cancelled' ? 'refunded' : 'paid',
        method: ['UPI', 'Card', 'UPI', 'Net banking'][idx % 4],
        reference: `pay_DEMO${spec.id.replace(/\D/g, '')}`,
        paidAt: created.toISOString(),
      },
      status: spec.status,
      history,
      isNew: spec.status === 'placed',
      delivery: spec.assign ? { ...spec.assign, assignedAt: created.toISOString() } : undefined,
      rejectReason: spec.reason,
      customRequestId: spec.custom?.requestId,
      sample: true,
      demoMine: spec.demoMine,
    };
    return order;
  });
}
