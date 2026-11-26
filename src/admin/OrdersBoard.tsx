import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Order, OrderStatus, OrderType } from '../types';
import { advanceOrder, getOrders } from '../services/api';
import { useQuery } from '../hooks/useQuery';
import { useTitle } from '../hooks/useTitle';
import { useSettings } from '../context/SettingsContext';
import { EmptyState, Loading, StatusPill } from '../components/ui';
import { Icon } from '../components/Icon';
import { STATUS_LABEL, slotLabelById, slotStartHour } from '../lib/rules';
import { formatINR } from '../lib/format';
import { formatDateShort, relativeDayLabel, todayISO } from '../lib/dates';

const STATUS_ORDER: OrderStatus[] = [
  'placed', 'accepted', 'baking', 'ready', 'out_for_delivery', 'delivered', 'picked_up', 'rejected', 'cancelled',
];

export default function OrdersBoard() {
  useTitle('Orders · Admin');
  const settings = useSettings();
  const { data: orders, loading } = useQuery(getOrders);
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [type, setType] = useState<OrderType | 'all'>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const today = todayISO();

  const inScope = useMemo(() => (orders ?? []).filter((o) => o.date >= today), [orders, today]);
  const counts = useMemo(() => {
    const c: Partial<Record<OrderStatus, number>> = {};
    inScope.forEach((o) => (c[o.status] = (c[o.status] ?? 0) + 1));
    return c;
  }, [inScope]);

  const filtered = inScope
    .filter((o) => status === 'all' || o.status === status)
    .filter((o) => type === 'all' || o.type === type);

  // Group: date → slot → orders
  const groups = useMemo(() => {
    const byDate = new Map<string, Map<string, Order[]>>();
    [...filtered]
      .sort((a, b) => a.date.localeCompare(b.date) || slotStartHour(settings, a.slotId) - slotStartHour(settings, b.slotId) || Number(b.isNew) - Number(a.isNew))
      .forEach((o) => {
        if (!byDate.has(o.date)) byDate.set(o.date, new Map());
        const slots = byDate.get(o.date)!;
        if (!slots.has(o.slotId)) slots.set(o.slotId, []);
        slots.get(o.slotId)!.push(o);
      });
    return byDate;
  }, [filtered, settings]);

  async function accept(id: string) {
    setBusy(id);
    setError(null);
    try {
      await advanceOrder(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not accept order.');
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <h1>Orders</h1>
          <p className="muted">Today and upcoming · {formatDateShort(today)}</p>
        </div>
      </header>

      <div className="status-counts" role="group" aria-label="Filter by status">
        <button type="button" className="count-chip" aria-pressed={status === 'all'} onClick={() => setStatus('all')}>
          <strong>{inScope.length}</strong> All
        </button>
        {STATUS_ORDER.filter((s) => counts[s]).map((s) => (
          <button key={s} type="button" className={`count-chip count-${s}`} aria-pressed={status === s} onClick={() => setStatus(s)}>
            <strong>{counts[s]}</strong> {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="segmented segmented-sm" role="group" aria-label="Filter by pickup or delivery">
        {(['all', 'pickup', 'delivery'] as const).map((t) => (
          <button key={t} type="button" className={`segment ${type === t ? 'is-selected' : ''}`} aria-pressed={type === t} onClick={() => setType(t)}>
            {t === 'all' ? 'All' : t === 'pickup' ? 'Pickup' : 'Delivery'}
          </button>
        ))}
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      {groups.size === 0 && <EmptyState title="No orders match">Try another filter.</EmptyState>}

      {[...groups.entries()].map(([date, slots]) => (
        <section key={date} className="board-day" aria-labelledby={`d-${date}`}>
          <h2 id={`d-${date}`} className="board-day-title">
            {relativeDayLabel(date)}
            {relativeDayLabel(date) !== formatDateShort(date) && <span className="muted"> · {formatDateShort(date)}</span>}
          </h2>
          {[...slots.entries()].map(([slotId, list]) => (
            <div key={slotId} className="board-slot">
              <h3 className="board-slot-title">
                <Icon name="clock" size={16} /> {slotLabelById(settings, slotId)} <span className="muted">({list.length})</span>
              </h3>
              <ul className="board-list">
                {list.map((o) => (
                  <li key={o.id} className={`board-card ${o.isNew ? 'is-new' : ''}`}>
                    <div className="board-card-main">
                      <div className="board-card-top">
                        <Link to={`/admin/orders/${o.id}`} className="board-card-id">
                          {o.id}
                        </Link>
                        {o.isNew && <span className="new-badge">NEW</span>}
                        {o.isNew && (
                          <span className="wa-alert" title="WhatsApp alert sent to shop (demo)">
                            <Icon name="whatsapp" size={16} label="WhatsApp alert sent (demo)" />
                          </span>
                        )}
                        <StatusPill status={o.status} />
                      </div>
                      <p className="board-card-who">
                        <Icon name={o.type === 'delivery' ? 'truck' : 'store'} size={16} label={o.type === 'delivery' ? 'Delivery' : 'Pickup'} />{' '}
                        {o.customer.name}
                        {o.type === 'delivery' && o.address && <span className="muted"> · {o.address.area}</span>}
                      </p>
                      <p className="board-card-items">{o.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}</p>
                    </div>
                    <div className="board-card-side">
                      <strong>{formatINR(o.total)}</strong>
                      {o.status === 'placed' ? (
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => accept(o.id)} disabled={busy === o.id}>
                          {busy === o.id ? 'Accepting…' : 'Accept'}
                          <span className="visually-hidden"> order {o.id}</span>
                        </button>
                      ) : (
                        <Link to={`/admin/orders/${o.id}`} className="btn btn-secondary btn-sm">
                          Open<span className="visually-hidden"> order {o.id}</span>
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
