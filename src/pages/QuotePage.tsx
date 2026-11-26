import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCustomRequest, payQuote } from '../services/api';
import { useQuery } from '../hooks/useQuery';
import { useTitle } from '../hooks/useTitle';
import { useSettings } from '../context/SettingsContext';
import { Loading, NotFound } from '../components/ui';
import { PaymentSheet } from '../components/PaymentSheet';
import { Icon } from '../components/Icon';
import { formatINR, formatWeight } from '../lib/format';
import { formatDateLong, todayISO } from '../lib/dates';
import { slotLabelById } from '../lib/rules';
import { whatsappLink } from '../lib/links';

/**
 * Customer-facing quote. In production this link is sent on WhatsApp and
 * protected with a hard-to-guess token. TODO (database/login): use a signed quote token instead of the request id.
 */
export function QuotePage() {
  const { id = '' } = useParams();
  const { data: req, loading } = useQuery(() => getCustomRequest(id), [id]);
  const settings = useSettings();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  useTitle(`Quote ${id}`);

  if (loading) return <Loading />;
  if (!req) return <div className="container section"><NotFound what="quote" /></div>;

  const wa = whatsappLink(settings.whatsappNumber, `Hi Cake Palace, about my custom cake quote ${req.id}.`);
  const expired = !!req.quote && req.quote.validUntil < todayISO();

  return (
    <div className="container section narrow">
      <p className="muted">Custom cake · {req.id}</p>
      <h1>Your quote</h1>

      {req.status === 'new' && (
        <div className="notice">
          <Icon name="clock" size={18} /> We're preparing your quote. We'll send it on WhatsApp — this page will update too.
        </div>
      )}
      {req.status === 'declined' && (
        <div className="notice">
          <Icon name="x" size={18} /> Sorry, we can't take this one. {req.declineReason}
        </div>
      )}

      <div className="quote-layout">
        <div className="quote-images">
          {req.referenceImages.length ? (
            req.referenceImages.map((src, i) => (
              <img key={i} src={src} alt={`Your reference photo ${i + 1}`} width={600} height={600} loading={i ? 'lazy' : 'eager'} />
            ))
          ) : (
            <img src="/images/site/custom-cake.svg" alt="" width={600} height={600} />
          )}
        </div>
        <div>
          <section className="card">
            <h2>Cake details</h2>
            <dl className="detail-list">
              <div><dt>Occasion</dt><dd>{req.occasion}</dd></div>
              <div><dt>Theme</dt><dd>{req.theme}</dd></div>
              <div><dt>Flavour</dt><dd>{req.flavour}</dd></div>
              <div>
                <dt>Size</dt>
                <dd>{formatWeight(req.weightKg)} · {req.tiers} tier{req.tiers > 1 ? 's' : ''} · {req.eggless ? 'Eggless' : 'With egg'}</dd>
              </div>
              {req.message && <div><dt>Message</dt><dd className="cake-msg-inline">“{req.message}”</dd></div>}
              <div>
                <dt>{req.fulfilment === 'delivery' ? 'Delivery' : 'Pickup'}</dt>
                <dd>{formatDateLong(req.neededBy)}, {slotLabelById(settings, req.slotId)}</dd>
              </div>
            </dl>
          </section>

          {req.quote && (
            <section className="card quote-card">
              <h2>Our price</h2>
              <p className="quote-price">{formatINR(req.quote.price)}</p>
              <p className="muted small">Includes {req.fulfilment === 'delivery' ? 'delivery' : 'packing'} · all taxes</p>
              <p>{req.quote.notes}</p>
              <p className={`small ${expired ? 'field-error' : 'muted'}`}>
                {expired ? 'Expired on ' : 'Valid until '}
                {formatDateLong(req.quote.validUntil)}
              </p>
              {req.status === 'quoted' && !expired && (
                <button type="button" className="btn btn-primary btn-lg btn-block" onClick={() => setPaying(true)}>
                  Pay & Confirm
                </button>
              )}
              {req.status === 'paid' && req.orderId && (
                <p className="added-note">
                  <Icon name="check" size={18} /> Paid and confirmed.{' '}
                  <Link className="text-link" to={`/order/${req.orderId}`}>View order {req.orderId}</Link>
                </p>
              )}
            </section>
          )}
          <a href={wa} target="_blank" rel="noopener noreferrer" className="text-link">
            <Icon name="whatsapp" size={18} /> Questions? Chat on WhatsApp
          </a>
        </div>
      </div>

      {req.quote && (
        <PaymentSheet
          open={paying}
          amount={req.quote.price}
          onClose={() => setPaying(false)}
          onSuccess={async (method) => {
            const order = await payQuote(req.id, method);
            navigate(`/order/${order.id}`, { replace: true });
          }}
        />
      )}
    </div>
  );
}
