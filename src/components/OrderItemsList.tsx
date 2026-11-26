import type { Order } from '../types';
import { describeItemOptions, formatINR } from '../lib/format';

/** Items with options and cake message, plus price summary (customer views). */
export function OrderItemsList({ order, showTotals = true }: { order: Order; showTotals?: boolean }) {
  return (
    <>
      <ul className="mini-items">
        {order.items.map((i, idx) => (
          <li key={idx}>
            <span>
              {i.qty} × {i.name}
              <small>{describeItemOptions(i)}</small>
              {i.message && <small className="cake-msg-inline">“{i.message}”</small>}
            </span>
            <span>{formatINR(i.unitPrice * i.qty)}</span>
          </li>
        ))}
      </ul>
      {showTotals && (
        <>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatINR(order.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span>{order.type === 'pickup' ? 'Pickup' : order.deliveryCharge === 0 ? 'Free' : formatINR(order.deliveryCharge)}</span>
          </div>
          <div className="summary-row summary-total">
            <span>Total</span>
            <strong>{formatINR(order.total)}</strong>
          </div>
        </>
      )}
    </>
  );
}
