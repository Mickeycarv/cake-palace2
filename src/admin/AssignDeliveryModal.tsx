import { useState } from 'react';
import type { DeliveryMethod, Order } from '../types';
import { Modal } from '../components/Modal';
import { assignDelivery } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { suggestDeliveryMethod } from '../lib/rules';
import { formatINR } from '../lib/format';
import { DELIVERY_PEOPLE } from '../data/people';

export function AssignDeliveryModal({ order, open, onClose }: { order: Order; open: boolean; onClose: () => void }) {
  const settings = useSettings();
  const suggestion = suggestDeliveryMethod(order, settings);
  const [choice, setChoice] = useState<string>(
    order.delivery?.method === 'own'
      ? order.delivery.personId ?? DELIVERY_PEOPLE[0].id
      : order.delivery?.method ?? (suggestion.method === 'own' ? DELIVERY_PEOPLE[0].id : 'porter'),
  );
  const [reference, setReference] = useState(order.delivery?.reference ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isPartner = choice === 'porter' || choice === 'rapido';

  async function submit() {
    if (isPartner && reference.trim().length < 3) {
      setError('Enter the Porter/Rapido booking reference.');
      return;
    }
    setBusy(true);
    try {
      await assignDelivery(order.id, {
        method: (isPartner ? choice : 'own') as DeliveryMethod,
        personId: isPartner ? undefined : choice,
        reference: isPartner ? reference.trim() : undefined,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not assign.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Assign delivery · ${order.id}`}
      footer={
        <button type="button" className="btn btn-primary btn-block" onClick={submit} disabled={busy}>
          {busy ? 'Assigning…' : 'Assign'}
        </button>
      }
    >
      <dl className="detail-list compact">
        <div>
          <dt>Distance</dt>
          <dd>
            {order.distanceKm ?? '—'} km · {order.address?.area} <span className="tag">mock</span>
          </dd>
        </div>
        <div>
          <dt>Order value</dt>
          <dd>{formatINR(order.total)}</dd>
        </div>
      </dl>
      <p className="suggestion">
        <strong>Suggested: {suggestion.method === 'own' ? 'Own delivery person' : 'Porter / Rapido'}</strong>
        <br />
        <span className="small">{suggestion.reason}</span>
      </p>

      <fieldset className="field">
        <legend>Send with</legend>
        <div className="radio-list">
          {DELIVERY_PEOPLE.map((p) => (
            <label key={p.id} className={`radio-row ${choice === p.id ? 'is-selected' : ''}`}>
              <input type="radio" name="assign" value={p.id} checked={choice === p.id} onChange={() => setChoice(p.id)} />
              <span>
                <strong>{p.name}</strong>
                <small>Own delivery · {p.phone}</small>
              </span>
            </label>
          ))}
          {(['porter', 'rapido'] as const).map((m) => (
            <label key={m} className={`radio-row ${choice === m ? 'is-selected' : ''}`}>
              <input type="radio" name="assign" value={m} checked={choice === m} onChange={() => setChoice(m)} />
              <span>
                <strong>{m === 'porter' ? 'Porter' : 'Rapido'}</strong>
                <small>Book in their app, then enter the reference</small>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {isPartner && (
        <div className="field">
          {/* TODO (Porter/Rapido): book automatically through their business APIs. */}
          <label htmlFor="partner-ref">Booking reference number</label>
          <input id="partner-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. PTR-58213" />
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
