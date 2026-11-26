import { Link, useNavigate, useParams } from 'react-router-dom';
import { getOrder } from '../services/api';
import { useQuery } from '../hooks/useQuery';
import { useTitle } from '../hooks/useTitle';
import { useSettings } from '../context/SettingsContext';
import { Loading, NotFound } from '../components/ui';
import { Icon } from '../components/Icon';
import { OrderItemsList } from '../components/OrderItemsList';
import { formatINR } from '../lib/format';
import { formatDateLong } from '../lib/dates';
import { slotLabelById } from '../lib/rules';
import { SHOP } from '../config/shop';

export function OrderConfirmedPage() {
  const { id = '' } = useParams();
  const { data: order, loading } = useQuery(() => getOrder(id), [id]);
  const settings = useSettings();
  const navigate = useNavigate();
  useTitle(order ? `Order ${order.id}` : 'Order');

  if (loading) return <Loading />;
  if (!order) return <div className="container section"><NotFound what="order" /></div>;

  return (
    <div className="container section narrow">
      <div className="confirm-hero">
        <span className="confirm-icon" aria-hidden="true">
          <Icon name="check" size={36} />
        </span>
        <h1>We've received your order</h1>
        <p className="lead">
          Order number <strong className="order-no">{order.id}</strong>
        </p>
        {/* TODO (WhatsApp): this alert is mocked — the server will send it via the WhatsApp Business API. */}
        <p className="wa-alert-note">
          <Icon name="whatsapp" size={18} /> The shop has been alerted on WhatsApp <span className="tag">demo</span>. You'll get updates as
          your cake is baked.
        </p>
      </div>

      <section className="card">
        <h2>{order.type === 'delivery' ? 'Delivery' : 'Pickup'} details</h2>
        <dl className="detail-list">
          <div>
            <dt>Date</dt>
            <dd>{formatDateLong(order.date)}</dd>
          </div>
          <div>
            <dt>Time slot</dt>
            <dd>{slotLabelById(settings, order.slotId)}</dd>
          </div>
          {order.type === 'delivery' && order.address ? (
            <div>
              <dt>Deliver to</dt>
              <dd>
                {order.customer.name}, {order.address.line1}
                {order.address.line2 && `, ${order.address.line2}`}, {order.address.area} {order.address.pincode}
              </dd>
            </div>
          ) : (
            <div>
              <dt>Pick up from</dt>
              <dd>{SHOP.address}</dd>
            </div>
          )}
          <div>
            <dt>Amount paid</dt>
            <dd>
              <strong>{formatINR(order.total)}</strong> via {order.payment.method} <span className="tag">demo payment</span>
            </dd>
          </div>
        </dl>
      </section>

      <section className="card">
        <h2>Items</h2>
        <OrderItemsList order={order} />
      </section>

      <div className="page-actions">
        <button type="button" className="btn btn-primary btn-lg" onClick={() => navigate(`/orders#${order.id}`)}>
          Track Order
        </button>
        <Link to="/menu" className="text-link">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
