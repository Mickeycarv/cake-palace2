import { useState } from 'react';
import { Modal } from './Modal';
import { formatINR } from '../lib/format';

const METHODS = [
  { id: 'UPI', label: 'UPI', hint: 'Pay with any UPI app' },
  { id: 'Card', label: 'Card', hint: 'Credit or debit card' },
  { id: 'Net banking', label: 'Net banking', hint: 'All major Indian banks' },
] as const;

/**
 * MOCK payment sheet in the style of an online checkout. No payment details are
 * collected and nothing is charged.
 * TODO (Razorpay): replace with Razorpay Checkout (checkout.js) opened with an
 * order_id created on the server; verify the signature server-side before
 * calling onSuccess.
 */
export function PaymentSheet({
  open,
  amount,
  onClose,
  onSuccess,
}: {
  open: boolean;
  amount: number;
  onClose: () => void;
  onSuccess: (method: string) => Promise<void>;
}) {
  const [method, setMethod] = useState<string>('UPI');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function simulate() {
    setBusy(true);
    setError(null);
    try {
      await onSuccess(method);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment could not be completed.');
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      title="Secure payment"
      footer={
        <>
          <button type="button" className="btn btn-primary btn-block" onClick={simulate} disabled={busy}>
            {busy ? 'Processing…' : `Simulate success · ${formatINR(amount)}`}
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={onClose} disabled={busy}>
            Cancel
          </button>
        </>
      }
    >
      <div className="pay-amount">
        <span>Amount to pay</span>
        <strong>{formatINR(amount)}</strong>
      </div>
      <p className="demo-note" role="note">
        Demo payment — no money is taken and no card or UPI details are asked for. Razorpay will appear here before launch.
      </p>
      <fieldset className="pay-methods">
        <legend>Choose a payment method</legend>
        {METHODS.map((m) => (
          <label key={m.id} className={`pay-method ${method === m.id ? 'is-selected' : ''}`}>
            <input type="radio" name="pay-method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} />
            <span>
              <strong>{m.label}</strong>
              <small>{m.hint}</small>
            </span>
          </label>
        ))}
      </fieldset>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
