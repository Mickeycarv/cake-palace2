import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Order } from '../types';
import { getMyOrders } from '../services/api';
import { useQuery } from '../hooks/useQuery';
import { useTitle } from '../hooks/useTitle';
import { useSettings } from '../context/SettingsContext';
import { EmptyState, Loading, StatusPill, StatusStepper } from '../components/ui';
import { Icon } from '../components/Icon';
import { isClosed, slotLabelById } from '../lib/rules';
import { formatINR } from '../lib/format';
import { relativeDayLabel } from '../lib/dates';
import { whatsappLink } from '../lib/links';

export function MyOrdersPage() {
  useTitle('My Orders');
  const { data: orders, loading } = useQuery(getMyOrders);
  const { hash } = useLocation();

  // Scroll to the order passed in the URL hash (from "Track Order").
  useEffect(() => {
    if (!orders || !hash) return;
    const el = document.getElementById(hash.slice(1));
    if (el) {
      el.scrollIntoView({ block: 'start' });
      el.focus({ preventScroll: true });
    }
  }, [orders, hash]);

  if (loading) return <Loading />;
  const current = (orders ?? []).filter((o) => !isClosed(o));
  const past = (orders ?? []).filter((o) => isClosed(o));

  return (
    <div className="container section narrow">
      <h1>My orders</h1>
      {/* TODO (login): after phone-OTP login, show this customer's orders from the server on any device. */}
      <p className="muted">
        Orders placed in this browser, plus two sample orders for the demo. Updates appear here as the shop moves your order along.
      </p>

      {orders && orders.length === 0 && (
        <EmptyState title="No orders yet" action={<Link to="/menu" className="btn btn-primary">Browse the menu</Link>} />
      )}

      {current.length > 0 && (
        <section aria-labelledby="current-h">
          <h2 id="current-h">Current</h2>
          {current.map((o) => (
            <OrderCard key={o.id} order={o} highlighted={hash === `#${o.id}`} />
          ))}
        </section>
      )}
      {past.length > 0 && (
        <section aria-labelledby="past-h">
          <h2 id="past-h">Past</h2>
          {past.map((o) => (
            <OrderCard key={o.id} order={o} highlighted={hash === `#${o.id}`} />
          ))}
        </section>
      )}
    </div>
  );
}

function OrderCard({ order, highlighted }: { order: Order; highlighted: boolean }) {
  const settings = useSettings();
  const wa = whatsappLink(settings.whatsappNumber, `Hi Cake Palace, I have a question about my order ${order.id}.`);
  return (
    <article id={order.id} tabIndex={-1} className={`card order-card ${highlighted ? 'is-highlighted' : ''}`} aria-labelledby={`${order.id}-h`}>
      <header className="order-card-head">
        <div>
          <h3 id={`${order.id}-h`}>
            Order {order.id} {order.sample && <span className="tag">sample</span>}
          </h3>
          <p className="muted small">
            {order.type === 'delivery' ? 'Delivery' : 'Pickup'} · {relativeDayLabel(order.date)}, {slotLabelById(settings, order.slotId)} ·{' '}
            {formatINR(order.total)}
          </p>
        </div>
        <StatusPill status={order.status} />
      </header>
      <p className="order-card-items">{order.items.map((i) => `${i.qty} × ${i.name}`).join(', ')}</p>
      <StatusStepper order={order} />
      <div className="order-card-actions">
        <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
          <Icon name="whatsapp" /> Chat on WhatsApp
        </a>
        <Link to={`/order/${order.id}`} className="text-link">
          Order details
        </Link>
      </div>
    </article>
  );
}
