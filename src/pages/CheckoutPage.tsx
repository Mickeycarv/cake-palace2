import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { OrderType } from '../types';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { useTitle } from '../hooks/useTitle';
import { placeOrder } from '../services/api';
import { DatePicker, SlotPicker } from '../components/Pickers';
import { PaymentSheet } from '../components/PaymentSheet';
import { EmptyState } from '../components/ui';
import { Icon } from '../components/Icon';
import { orderDateOptions, quoteDelivery, slotsForDate } from '../lib/rules';
import { describeItemOptions, formatINR } from '../lib/format';
import { SHOP, SHOP_MAPS_URL } from '../config/shop';
import { PINCODES } from '../data/pincodes';

type Errors = Partial<Record<'name' | 'phone' | 'line1' | 'pincode' | 'date' | 'slot', string>>;

export function CheckoutPage() {
  useTitle('Checkout');
  const cart = useCart();
  const settings = useSettings();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<OrderType>('delivery');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [date, setDate] = useState('');
  const [slotId, setSlotId] = useState('');
  const [notes, setNotes] = useState('');
  // Errors only show after the first "Pay" attempt, then update live as fields are fixed.
  const [submitted, setSubmitted] = useState(false);
  const [paying, setPaying] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const allSameDay = cart.items.every((i) => i.sameDay);
  const dateOptions = useMemo(() => orderDateOptions(allSameDay, settings), [allSameDay, settings]);
  const slots = useMemo(() => (date ? slotsForDate(date, settings) : []), [date, settings]);

  // Default to the first available date; drop a chosen slot that's no longer offered.
  useEffect(() => {
    if (!date || dateOptions.find((o) => o.date === date)?.disabled) {
      setDate(dateOptions.find((o) => !o.disabled)?.date ?? '');
    }
  }, [dateOptions, date]);
  useEffect(() => {
    if (slotId && !slots.some((s) => s.id === slotId)) setSlotId('');
  }, [slots, slotId]);

  const delivery = type === 'delivery' && pincode.length === 6 ? quoteDelivery(pincode, cart.subtotal, settings) : null;
  const deliveryCharge = type === 'delivery' && delivery?.ok ? delivery.charge : 0;
  const total = cart.subtotal + deliveryCharge;

  if (cart.items.length === 0 && !paying) {
    return (
      <div className="container section">
        <h1>Checkout</h1>
        <EmptyState title="Your cart is empty" action={<Link to="/menu" className="btn btn-primary">Browse the menu</Link>} />
      </div>
    );
  }

  function validate(): Errors {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = 'Please enter your name.';
    if (!/^[6-9]\d{9}$/.test(phone)) e.phone = 'Enter a 10-digit Indian mobile number.';
    if (type === 'delivery') {
      if (line1.trim().length < 5) e.line1 = 'Please enter your house/flat and street.';
      if (!delivery) e.pincode = 'Enter a 6-digit pincode.';
      else if (!delivery.ok) e.pincode = delivery.message;
    }
    if (!date) e.date = 'Please choose a date.';
    if (!slotId) e.slot = 'Please choose a time slot.';
    return e;
  }

  const errors: Errors = submitted ? validate() : {};

  function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setSubmitted(true);
    const e = validate();
    if (Object.keys(e).length) {
      // Move focus to the first problem so keyboard and screen-reader users find it.
      requestAnimationFrame(() => {
        const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], .field-error');
        first?.scrollIntoView({ block: 'center', behavior: 'smooth' });
        if (first instanceof HTMLInputElement) first.focus();
      });
      return;
    }
    setPaying(true);
  }

  async function onPaid(method: string) {
    const order = await placeOrder({
      customer: { name: name.trim(), phone: `+91 ${phone.replace(/\D/g, '').slice(-10)}` },
      type,
      address: type === 'delivery' ? { line1: line1.trim(), line2: line2.trim(), landmark: landmark.trim(), pincode } : undefined,
      date,
      slotId,
      notes: notes.trim(),
      items: cart.items,
      paymentMethod: method,
    });
    cart.clear();
    navigate(`/order/${order.id}`, { replace: true });
  }

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p id={`${k}-error`} className="field-error">
        {errors[k]}
      </p>
    ) : null;
  const a11y = (k: keyof Errors) => ({ 'aria-invalid': errors[k] ? true : undefined, 'aria-describedby': errors[k] ? `${k}-error` : undefined });

  return (
    <div className="container section">
      <h1>Checkout</h1>
      <form ref={formRef} className="checkout-layout" onSubmit={onSubmit} noValidate>
        <div className="checkout-main">
          <section className="card" aria-labelledby="details-h">
            <h2 id="details-h">Your details</h2>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="name">Full name</label>
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" {...a11y('name')} />
                {err('name')}
              </div>
              <div className="field">
                <label htmlFor="phone">Mobile number</label>
                <div className="input-prefix">
                  <span aria-hidden="true">+91</span>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    autoComplete="tel-national"
                    {...a11y('phone')}
                  />
                </div>
                {err('phone')}
                {/* TODO (login): send and verify a phone OTP here before payment. */}
                <p className="hint otp-slot">
                  <Icon name="phone" size={14} /> We'll verify this number with a one-time code (OTP) — coming soon.
                </p>
              </div>
            </div>
          </section>

          <section className="card" aria-labelledby="fulfil-h">
            <h2 id="fulfil-h">Pickup or delivery</h2>
            <div className="segmented" role="radiogroup" aria-label="Pickup or delivery">
              {(['delivery', 'pickup'] as OrderType[]).map((t) => (
                <label key={t} className={`segment ${type === t ? 'is-selected' : ''}`}>
                  <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} />
                  <Icon name={t === 'delivery' ? 'truck' : 'store'} size={18} />
                  {t === 'delivery' ? 'Delivery' : 'Pickup from shop'}
                </label>
              ))}
            </div>

            {type === 'delivery' ? (
              <div className="form-grid">
                <div className="field field-full">
                  <label htmlFor="line1">House / flat, building and street</label>
                  <input id="line1" value={line1} onChange={(e) => setLine1(e.target.value)} autoComplete="address-line1" {...a11y('line1')} />
                  {err('line1')}
                </div>
                <div className="field">
                  <label htmlFor="line2">
                    Area / colony <span className="optional">(optional)</span>
                  </label>
                  <input id="line2" value={line2} onChange={(e) => setLine2(e.target.value)} autoComplete="address-line2" />
                </div>
                <div className="field">
                  <label htmlFor="landmark">
                    Landmark <span className="optional">(optional)</span>
                  </label>
                  <input id="landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="pincode">Pincode</label>
                  <input
                    id="pincode"
                    inputMode="numeric"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoComplete="postal-code"
                    list="known-pincodes"
                    {...a11y('pincode')}
                  />
                  <datalist id="known-pincodes">
                    {PINCODES.map((p) => (
                      <option key={p.pincode} value={p.pincode}>
                        {p.area}
                      </option>
                    ))}
                  </datalist>
                  {err('pincode')}
                </div>
                <div className="field" aria-live="polite">
                  {/* TODO (maps): replace the mock pincode distance with a real distance from the address. */}
                  {delivery?.ok && (
                    <div className="delivery-quote">
                      <p>
                        <strong>{delivery.area}</strong> · about {delivery.distanceKm} km <span className="tag">mock distance</span>
                      </p>
                      <p>
                        Delivery: <strong>{delivery.charge === 0 ? 'Free' : formatINR(delivery.charge)}</strong>
                      </p>
                      <p className="muted small">{delivery.note}</p>
                    </div>
                  )}
                  {delivery && !delivery.ok && !errors.pincode && (
                    <p className="field-error" id="pincode-live-error">
                      {delivery.message}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="pickup-info">
                <Icon name="map" />
                <div>
                  <p>
                    <strong>Pick up from:</strong> {SHOP.address}
                  </p>
                  <a href={SHOP_MAPS_URL} target="_blank" rel="noopener noreferrer" className="text-link">
                    Open in Google Maps
                  </a>
                </div>
              </div>
            )}
          </section>

          <section className="card" aria-labelledby="when-h">
            <h2 id="when-h">When?</h2>
            {!allSameDay && (
              <p className="notice">
                <Icon name="clock" size={18} /> Some items need advance notice, so the earliest date is later than today.
              </p>
            )}
            <DatePicker options={dateOptions} value={date} onChange={setDate} legend="Date" error={errors.date} />
            <SlotPicker slots={slots} value={slotId} onChange={setSlotId} legend="Time slot" error={errors.slot} />
          </section>

          <section className="card">
            <div className="field">
              <label htmlFor="notes">
                Order notes <span className="optional">(optional)</span>
              </label>
              <textarea
                id="notes"
                rows={3}
                maxLength={300}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Please call when you reach the gate"
              />
            </div>
          </section>
        </div>

        <aside className="checkout-side">
          <section className="summary-card sticky" aria-labelledby="summary-h">
            <h2 id="summary-h">Order summary</h2>
            <ul className="mini-items">
              {cart.items.map((i) => (
                <li key={i.key}>
                  <span>
                    {i.qty} × {i.name}
                    <small>{describeItemOptions(i)}</small>
                  </span>
                  <span>{formatINR(i.unitPrice * i.qty)}</span>
                </li>
              ))}
            </ul>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatINR(cart.subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span>
                {type === 'pickup' ? 'Pickup – free' : delivery?.ok ? (delivery.charge === 0 ? 'Free' : formatINR(delivery.charge)) : '—'}
              </span>
            </div>
            <div className="summary-row summary-total">
              <span>Total</span>
              <strong>{formatINR(total)}</strong>
            </div>
            <button type="submit" className="btn btn-primary btn-lg btn-block">
              Pay {formatINR(total)}
            </button>
            <p className="muted small center">Secure online payment · UPI, cards, net banking</p>
          </section>
        </aside>
      </form>

      <PaymentSheet open={paying} amount={total} onClose={() => setPaying(false)} onSuccess={onPaid} />
    </div>
  );
}
