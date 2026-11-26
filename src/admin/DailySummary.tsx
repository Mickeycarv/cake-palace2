import { useMemo, useState } from 'react';
import type { Order } from '../types';
import { getOrders } from '../services/api';
import { useQuery } from '../hooks/useQuery';
import { useTitle } from '../hooks/useTitle';
import { useSettings } from '../context/SettingsContext';
import { Loading } from '../components/ui';
import { Icon } from '../components/Icon';
import { formatINR, formatWeight } from '../lib/format';
import { addDaysISO, formatDateLong, relativeDayLabel, todayISO } from '../lib/dates';
import { STATUS_LABEL, isCancelled, isClosed, slotLabelById } from '../lib/rules';

function summarise(orders: Order[]) {
  const valid = orders.filter((o) => !isCancelled(o));
  const sales = valid.filter((o) => o.payment.status === 'paid').reduce((s, o) => s + o.total, 0);
  const pickup = valid.filter((o) => o.type === 'pickup').length;
  const delivery = valid.filter((o) => o.type === 'delivery').length;
  const pending = valid.filter((o) => !isClosed(o)).length;
  const cancelled = orders.length - valid.length;
  const itemQty = new Map<string, number>();
  valid.forEach((o) => o.items.forEach((i) => itemQty.set(i.name, (itemQty.get(i.name) ?? 0) + i.qty)));
  const top = [...itemQty.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  return {
    count: orders.length,
    sales,
    aov: valid.length ? sales / valid.length : 0,
    pickup,
    delivery,
    pending,
    cancelled,
    top,
  };
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function DailySummary() {
  useTitle('Daily summary · Admin');
  const settings = useSettings();
  const { data: allOrders, loading } = useQuery(getOrders);
  const [date, setDate] = useState(todayISO());
  const orders = useMemo(() => (allOrders ?? []).filter((o) => o.date === date), [allOrders, date]);
  const sum = summarise(orders);

  function downloadCsv() {
    const header = ['Order', 'Date', 'Slot', 'Type', 'Customer', 'Phone', 'Items', 'Subtotal', 'Delivery', 'Total', 'Payment', 'Status'];
    const rows = orders.map((o) => [
      o.id,
      o.date,
      slotLabelById(settings, o.slotId),
      o.type,
      o.customer.name,
      o.customer.phone,
      o.items.map((i) => `${i.qty}x ${i.name}${i.weight ? ` (${formatWeight(i.weight)})` : ''}`).join('; '),
      o.subtotal,
      o.deliveryCharge,
      o.total,
      o.payment.status,
      STATUS_LABEL[o.status],
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cake-palace-orders-${date}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (loading) return <Loading />;
  const total = sum.pickup + sum.delivery || 1;

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <h1>Daily summary</h1>
          <p className="muted">{formatDateLong(date)}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={downloadCsv} disabled={orders.length === 0}>
          <Icon name="download" size={18} /> Download CSV
        </button>
      </header>

      <div className="day-switch" role="group" aria-label="Choose day">
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDate(addDaysISO(date, -1))}>
          <Icon name="arrowLeft" size={16} /> Previous day
        </button>
        <strong>{relativeDayLabel(date)}</strong>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDate(addDaysISO(date, 1))}>
          Next day <Icon name="arrowRight" size={16} />
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat"><span className="stat-label">Orders</span><strong className="stat-value">{sum.count}</strong></div>
        <div className="stat"><span className="stat-label">Sales</span><strong className="stat-value">{formatINR(sum.sales)}</strong></div>
        <div className="stat"><span className="stat-label">Average order</span><strong className="stat-value">{formatINR(sum.aov)}</strong></div>
        <div className="stat"><span className="stat-label">Pending</span><strong className="stat-value">{sum.pending}</strong></div>
        <div className="stat"><span className="stat-label">Cancelled / rejected</span><strong className="stat-value">{sum.cancelled}</strong></div>
      </div>

      <div className="detail-grid">
        <section className="card" aria-labelledby="split-h">
          <h2 id="split-h">Pickup vs delivery</h2>
          <div className="split-bar" role="img" aria-label={`${sum.pickup} pickup, ${sum.delivery} delivery`}>
            <span className="split-pickup" style={{ width: `${(sum.pickup / total) * 100}%` }} />
            <span className="split-delivery" style={{ width: `${(sum.delivery / total) * 100}%` }} />
          </div>
          <ul className="split-legend">
            <li><span className="key key-pickup" aria-hidden="true" /> Pickup <strong>{sum.pickup}</strong></li>
            <li><span className="key key-delivery" aria-hidden="true" /> Delivery <strong>{sum.delivery}</strong></li>
          </ul>
        </section>

        <section className="card" aria-labelledby="top-h">
          <h2 id="top-h">Top 5 items</h2>
          {sum.top.length === 0 ? (
            <p className="muted">No orders on this day.</p>
          ) : (
            <ol className="top-items">
              {sum.top.map(([name, qty]) => (
                <li key={name}>
                  <span>{name}</span>
                  <strong>{qty}</strong>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
