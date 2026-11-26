import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { advanceOrder, getOrder, refundOrder, rejectOrder } from '../services/api';
import { useQuery } from '../hooks/useQuery';
import { useTitle } from '../hooks/useTitle';
import { useSettings } from '../context/SettingsContext';
import { Loading, NotFound, StatusPill, StatusStepper } from '../components/ui';
import { Modal } from '../components/Modal';
import { Icon } from '../components/Icon';
import { AssignDeliveryModal } from './AssignDeliveryModal';
import { NEXT_ACTION_LABEL, STATUS_LABEL, isClosed, nextStatus, slotLabelById } from '../lib/rules';
import { describeItemOptions, formatINR, formatPhone, telHref } from '../lib/format';
import { formatDateLong, formatDateTime } from '../lib/dates';
import { mapsLink, whatsappLink } from '../lib/links';
import { DELIVERY_PEOPLE } from '../data/people';

const REJECT_REASONS = ['Fully booked for this slot', 'Item not available', 'Delivery area not serviceable', 'Customer asked to cancel'];

export default function OrderDetail() {
  const { id = '' } = useParams();
  const { data: order, loading } = useQuery(() => getOrder(id), [id]);
  const settings = useSettings();
  useTitle(`${id} · Admin`);

  const [assignOpen, setAssignOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState(REJECT_REASONS[0]);
  const [rejectOther, setRejectOther] = useState('');
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <Loading />;
  if (!order) return <NotFound what="order" />;

  const next = nextStatus(order);
  const needsAssign = next === 'out_for_delivery' && !order.delivery;
  const person = DELIVERY_PEOPLE.find((p) => p.id === order.delivery?.personId);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  const fullAddress = order.address
    ? [order.address.line1, order.address.line2, order.address.landmark, order.address.area, `Hyderabad ${order.address.pincode}`]
        .filter(Boolean)
        .join(', ')
    : '';

  return (
    <div className="admin-page">
      <Link to="/admin" className="back-link">
        <Icon name="arrowLeft" size={16} /> All orders
      </Link>
      <header className="admin-page-head">
        <div>
          <h1>
            {order.id} {order.isNew && <span className="new-badge">NEW</span>}
          </h1>
          <p className="muted">
            {order.type === 'delivery' ? 'Delivery' : 'Pickup'} · {formatDateLong(order.date)} · {slotLabelById(settings, order.slotId)}
          </p>
        </div>
        <StatusPill status={order.status} />
      </header>

      {/* Main action — sticky on phones so it's always one tap away */}
      {!isClosed(order) && next && (
        <div className="next-action-bar">
          {needsAssign ? (
            <button type="button" className="btn btn-primary btn-lg" onClick={() => setAssignOpen(true)}>
              Assign Delivery
            </button>
          ) : (
            <button type="button" className="btn btn-primary btn-lg" disabled={busy} onClick={() => run(() => advanceOrder(order.id))}>
              {NEXT_ACTION_LABEL[next] ?? `Mark ${STATUS_LABEL[next]}`}
            </button>
          )}
        </div>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="detail-grid">
        <section className="card kitchen-card" aria-labelledby="k-h">
          <h2 id="k-h">Items for the kitchen</h2>
          <ul className="kitchen-items">
            {order.items.map((i, idx) => (
              <li key={idx}>
                <p className="kitchen-item-name">
                  <span className="kitchen-qty">{i.qty}×</span> {i.name}
                </p>
                <p className="kitchen-item-opts">{describeItemOptions(i)}</p>
                {i.message && (
                  <p className="kitchen-message">
                    <span className="visually-hidden">Message on cake: </span>“{i.message}”
                  </p>
                )}
              </li>
            ))}
          </ul>
          {order.notes && (
            <p className="notice">
              <strong>Customer note:</strong> {order.notes}
            </p>
          )}
          {order.customRequestId && (
            <p className="muted small">
              From custom request <Link to={`/admin/custom/${order.customRequestId}`}>{order.customRequestId}</Link>
            </p>
          )}
        </section>

        <section className="card" aria-labelledby="c-h">
          <h2 id="c-h">Customer</h2>
          <dl className="detail-list compact">
            <div>
              <dt>Name</dt>
              <dd>{order.customer.name}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>
                <a href={telHref(order.customer.phone)}>{formatPhone(order.customer.phone)}</a> ·{' '}
                <a href={whatsappLink(order.customer.phone.replace(/\D/g, ''), `Hi ${order.customer.name}, this is Cake Palace about order ${order.id}.`)} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </dd>
            </div>
            {order.type === 'delivery' && order.address && (
              <div>
                <dt>Address</dt>
                <dd>
                  {fullAddress}
                  <br />
                  <a href={mapsLink(fullAddress)} target="_blank" rel="noopener noreferrer" className="text-link">
                    <Icon name="map" size={16} /> Map
                  </a>{' '}
                  · {order.distanceKm} km
                </dd>
              </div>
            )}
            <div>
              <dt>Slot</dt>
              <dd>
                {formatDateLong(order.date)}, {slotLabelById(settings, order.slotId)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="card" aria-labelledby="p-h">
          <h2 id="p-h">Payment</h2>
          <dl className="detail-list compact">
            <div>
              <dt>Status</dt>
              <dd>
                <span className={`pay-pill pay-${order.payment.status}`}>{order.payment.status === 'paid' ? 'Paid' : 'Refunded'}</span> ·{' '}
                {order.payment.method}
              </dd>
            </div>
            <div>
              <dt>Items</dt>
              <dd>{formatINR(order.subtotal)}</dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>{formatINR(order.deliveryCharge)}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>
                <strong>{formatINR(order.total)}</strong>
              </dd>
            </div>
            <div>
              <dt>Reference</dt>
              <dd className="mono">{order.payment.reference}</dd>
            </div>
          </dl>
        </section>

        {order.type === 'delivery' && (
          <section className="card" aria-labelledby="d-h">
            <h2 id="d-h">Delivery</h2>
            {order.delivery ? (
              <p>
                {order.delivery.method === 'own' ? (
                  <>
                    Own delivery: <strong>{person?.name ?? order.delivery.personId}</strong>
                  </>
                ) : (
                  <>
                    <strong>{order.delivery.method === 'porter' ? 'Porter' : 'Rapido'}</strong> · ref{' '}
                    <span className="mono">{order.delivery.reference}</span>
                  </>
                )}
              </p>
            ) : (
              <p className="muted">Not assigned yet.</p>
            )}
            {!isClosed(order) && order.status !== 'out_for_delivery' && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAssignOpen(true)}>
                {order.delivery ? 'Change assignment' : 'Assign delivery'}
              </button>
            )}
          </section>
        )}

        <section className="card" aria-labelledby="h-h">
          <h2 id="h-h">Progress</h2>
          <StatusStepper order={order} />
          <h3 className="small-heading">History</h3>
          <ol className="timeline">
            {[...order.history].reverse().map((h, i) => (
              <li key={i}>
                <strong>{STATUS_LABEL[h.status]}</strong> <span className="muted small">{formatDateTime(h.at)}</span>
                {h.note && <p className="small">{h.note}</p>}
              </li>
            ))}
          </ol>
        </section>

        <section className="card danger-zone" aria-labelledby="x-h">
          <h2 id="x-h">Problems</h2>
          <div className="danger-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRejectOpen(true)} disabled={isClosed(order)}>
              Reject order
            </button>
            {order.payment.status === 'paid' && !confirmRefund && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmRefund(true)}>
                Refund (mock)
              </button>
            )}
          </div>
          {confirmRefund && order.payment.status === 'paid' && (
            <div className="confirm-inline" role="group" aria-label="Confirm refund">
              <p>
                Refund <strong>{formatINR(order.total)}</strong> to the customer? <span className="tag">demo – no money moves</span>
              </p>
              <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => run(() => refundOrder(order.id)).then(() => setConfirmRefund(false))}>
                Yes, refund
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmRefund(false)}>
                Cancel
              </button>
            </div>
          )}
          {order.rejectReason && <p className="small">Reason: {order.rejectReason}</p>}
        </section>
      </div>

      {order.type === 'delivery' && (
        <AssignDeliveryModal key={`${order.id}-${assignOpen}`} order={order} open={assignOpen} onClose={() => setAssignOpen(false)} />
      )}

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title={`Reject ${order.id}?`}
        footer={
          <button
            type="button"
            className="btn btn-primary btn-block"
            disabled={busy || (rejectReason === 'Other' && rejectOther.trim().length < 3)}
            onClick={() =>
              run(() => rejectOrder(order.id, rejectReason === 'Other' ? rejectOther.trim() : rejectReason)).then(() => setRejectOpen(false))
            }
          >
            Reject order
          </button>
        }
      >
        <p>The customer will be told the reason. Remember to refund if they've paid.</p>
        <fieldset className="field">
          <legend>Reason</legend>
          <div className="radio-list">
            {[...REJECT_REASONS, 'Other'].map((r) => (
              <label key={r} className={`radio-row ${rejectReason === r ? 'is-selected' : ''}`}>
                <input type="radio" name="reject" checked={rejectReason === r} onChange={() => setRejectReason(r)} />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {rejectReason === 'Other' && (
          <div className="field">
            <label htmlFor="reject-other">Reason for the customer</label>
            <input id="reject-other" value={rejectOther} onChange={(e) => setRejectOther(e.target.value)} />
          </div>
        )}
      </Modal>
    </div>
  );
}
