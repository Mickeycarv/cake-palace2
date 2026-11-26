import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { CustomRequest } from '../types';
import { declineCustomRequest, getCustomRequest, sendQuote } from '../services/api';
import { useQuery } from '../hooks/useQuery';
import { useTitle } from '../hooks/useTitle';
import { useSettings } from '../context/SettingsContext';
import { Loading, NotFound } from '../components/ui';
import { Icon } from '../components/Icon';
import { REQUEST_STATUS_LABEL } from './CustomRequests';
import { addDaysISO, formatDateLong, todayISO } from '../lib/dates';
import { formatINR, formatPhone, formatWeight, telHref } from '../lib/format';
import { slotLabelById } from '../lib/rules';
import { whatsappLink } from '../lib/links';

export default function CustomRequestDetail() {
  const { id = '' } = useParams();
  const { data: req, loading } = useQuery(() => getCustomRequest(id), [id]);
  useTitle(`${id} · Admin`);

  if (loading) return <Loading />;
  if (!req) return <NotFound what="request" />;
  return <RequestView key={req.id + req.status} req={req} />;
}

function RequestView({ req }: { req: CustomRequest }) {
  const settings = useSettings();
  const [price, setPrice] = useState(req.quote ? String(req.quote.price) : '');
  const [notes, setNotes] = useState(req.quote?.notes ?? '');
  const [validUntil, setValidUntil] = useState(req.quote?.validUntil ?? addDaysISO(todayISO(), 2));
  const [declineReason, setDeclineReason] = useState('');
  const [showDecline, setShowDecline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const editable = req.status === 'new' || req.status === 'quoted';
  const quoteUrl = `${window.location.origin}/quote/${req.id}`;

  async function onSend() {
    const p = Number(price);
    if (!Number.isFinite(p) || p < 100) return setError('Enter a price of at least ₹100.');
    if (!validUntil || validUntil < todayISO()) return setError('"Valid until" must be today or later.');
    setBusy(true);
    setError(null);
    try {
      await sendQuote(req.id, { price: Math.round(p), notes: notes.trim(), validUntil });
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send quote.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-page">
      <Link to="/admin/custom" className="back-link">
        <Icon name="arrowLeft" size={16} /> All requests
      </Link>
      <header className="admin-page-head">
        <div>
          <h1>
            {req.occasion} cake · {req.id}
          </h1>
          <p className="muted">Received {new Date(req.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
        </div>
        <span className={`req-pill req-pill-${req.status}`}>{REQUEST_STATUS_LABEL[req.status]}</span>
      </header>

      <div className="detail-grid">
        <section className="card" aria-labelledby="rq-h">
          <h2 id="rq-h">Request</h2>
          <div className="ref-images">
            {req.referenceImages.length ? (
              req.referenceImages.map((src, i) => (
                <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                  <img src={src} alt={`Reference photo ${i + 1}`} width={160} height={160} loading="lazy" />
                </a>
              ))
            ) : (
              <p className="muted">No reference photos.</p>
            )}
          </div>
          <dl className="detail-list compact">
            <div><dt>Theme</dt><dd>{req.theme}</dd></div>
            <div><dt>Flavour</dt><dd>{req.flavour}</dd></div>
            <div>
              <dt>Size</dt>
              <dd>{formatWeight(req.weightKg)} · {req.tiers} tier{req.tiers > 1 ? 's' : ''} · {req.eggless ? 'Eggless' : 'With egg'}</dd>
            </div>
            {req.message && <div><dt>Message</dt><dd className="kitchen-message small-msg">“{req.message}”</dd></div>}
            <div><dt>Needed by</dt><dd>{formatDateLong(req.neededBy)}, {slotLabelById(settings, req.slotId)}</dd></div>
            <div>
              <dt>{req.fulfilment === 'delivery' ? 'Deliver to' : 'Fulfilment'}</dt>
              <dd>{req.fulfilment === 'delivery' && req.address ? `${req.address.line1}, ${req.address.area} ${req.address.pincode}` : 'Pickup'}</dd>
            </div>
            <div><dt>Budget</dt><dd>{req.budget}</dd></div>
            {req.notes && <div><dt>Notes</dt><dd>{req.notes}</dd></div>}
          </dl>
        </section>

        <section className="card" aria-labelledby="cu-h">
          <h2 id="cu-h">Customer</h2>
          <p><strong>{req.name}</strong></p>
          <p>
            <a href={telHref(req.phone)}>{formatPhone(req.phone)}</a> ·{' '}
            <a href={whatsappLink(req.phone.replace(/\D/g, ''), `Hi ${req.name}, this is Cake Palace about your custom cake request ${req.id}.`)} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
          </p>
          {req.orderId && (
            <p>
              Paid → order <Link to={`/admin/orders/${req.orderId}`}>{req.orderId}</Link>
            </p>
          )}
          {req.declineReason && <p className="small">Declined: {req.declineReason}</p>}
        </section>

        <section className="card quote-form" aria-labelledby="qf-h">
          <h2 id="qf-h">{req.status === 'quoted' ? 'Quote (sent)' : 'Quote'}</h2>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="q-price">Our price (₹)</label>
              <input id="q-price" type="number" inputMode="numeric" min={100} step={50} value={price} onChange={(e) => setPrice(e.target.value)} disabled={!editable} />
              {price && Number(price) > 0 && <p className="hint">{formatINR(Number(price))}</p>}
            </div>
            <div className="field">
              <label htmlFor="q-valid">Valid until</label>
              <input id="q-valid" type="date" min={todayISO()} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} disabled={!editable} />
            </div>
            <div className="field field-full">
              <label htmlFor="q-notes">Notes for the customer</label>
              <textarea
                id="q-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!editable}
                placeholder="What's included: tiers, toppers, colours, delivery…"
              />
            </div>
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          {editable && (
            <div className="page-actions start">
              <button type="button" className="btn btn-primary" onClick={onSend} disabled={busy}>
                {busy ? 'Sending…' : req.status === 'quoted' ? 'Send Updated Quote' : 'Send Quote'}
              </button>
              {!showDecline && (
                <button type="button" className="btn btn-ghost" onClick={() => setShowDecline(true)}>
                  Decline
                </button>
              )}
            </div>
          )}
          {showDecline && editable && (
            <div className="confirm-inline">
              <label htmlFor="decline-reason">Reason (sent to the customer)</label>
              <input id="decline-reason" value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                disabled={declineReason.trim().length < 3}
                onClick={() => declineCustomRequest(req.id, declineReason.trim())}
              >
                Decline request
              </button>
            </div>
          )}
          <div aria-live="polite">
            {(sent || req.status === 'quoted') && req.quote && (
              <p className="added-note">
                <Icon name="whatsapp" size={18} /> Quote sent on WhatsApp <span className="tag">demo</span> — customer link:{' '}
                <Link to={`/quote/${req.id}`} className="mono">{quoteUrl.replace(/^https?:\/\//, '')}</Link>
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
