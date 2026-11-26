import { Link, useNavigate } from 'react-router-dom';
import { useCart, CART_MAX_QTY } from '../context/CartContext';
import { useTitle } from '../hooks/useTitle';
import { Img } from '../components/Img';
import { Icon } from '../components/Icon';
import { EmptyState, QtyStepper } from '../components/ui';
import { productImage } from '../lib/links';
import { describeItemOptions, formatINR, plural } from '../lib/format';

export function CartPage() {
  useTitle('Cart');
  const cart = useCart();
  const navigate = useNavigate();

  if (cart.items.length === 0) {
    return (
      <div className="container section">
        <h1>Your cart</h1>
        <EmptyState
          title="Your cart is empty"
          action={
            <Link to="/menu" className="btn btn-primary">
              Browse the menu
            </Link>
          }
        >
          Add a cake or a few pastries to get started.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container section narrow">
      <h1>Your cart</h1>
      <ul className="cart-list">
        {cart.items.map((item) => (
          <li key={item.key} className="cart-item">
            <Img src={productImage(item.slug)} alt="" width={96} height={96} className="cart-thumb" />
            <div className="cart-item-main">
              <h2 className="cart-item-name">
                <Link to={`/product/${item.slug}`}>{item.name}</Link>
              </h2>
              <p className="muted">{describeItemOptions(item)}</p>
              {item.message && <p className="cake-msg-inline">“{item.message}”</p>}
              <div className="cart-item-controls">
                <QtyStepper
                  value={item.qty}
                  max={CART_MAX_QTY}
                  onChange={(n) => cart.setQty(item.key, n)}
                  label={`Quantity of ${item.name}`}
                />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => cart.remove(item.key)}>
                  <Icon name="trash" size={16} /> Remove<span className="visually-hidden"> {item.name}</span>
                </button>
              </div>
            </div>
            <p className="cart-item-price">{formatINR(item.unitPrice * item.qty)}</p>
          </li>
        ))}
      </ul>

      <div className="summary-card">
        <div className="summary-row summary-total">
          <span>Subtotal ({plural(cart.count, 'item')})</span>
          <strong>{formatINR(cart.subtotal)}</strong>
        </div>
        <p className="muted small">Delivery charge (if any) is worked out at checkout.</p>
        <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => navigate('/checkout')}>
          Checkout
        </button>
        <Link to="/menu" className="text-link center-block">
          Add more items
        </Link>
      </div>
    </div>
  );
}
