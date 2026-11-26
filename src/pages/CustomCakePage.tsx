import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { CustomRequest, OrderType } from '../types';
import { useSettings } from '../context/SettingsContext';
import { useTitle } from '../hooks/useTitle';
import { submitCustomRequest } from '../services/api';
import { Icon } from '../components/Icon';
import { checkCustomDate, earliestCustomDate, slotLabel, quoteDelivery } from '../lib/rules';
import { formatDateLong } from '../lib/dates';
import { fileToThumbnail, MAX_UPLOAD_BYTES } from '../lib/images';
import { whatsappLink } from '../lib/links';
import { CAKE_MESSAGE_MAX, MAX_REFERENCE_IMAGES } from '../config/shop';

const OCCASIONS = ['Birthday', 'Anniversary', 'Wedding', 'Engagement', 'Baby shower', 'Naming ceremony', 'Corporate event', 'Other'];
const FLAVOURS = [
  'Chocolate truffle', 'Black Forest', 'Red velvet', 'Butterscotch', 'Pineapple', 'Vanilla',
  'Rasmalai', 'Pista badam', 'Fresh fruit', 'Not sure – suggest one',
];
const WEIGHTS = [1, 1.5, 2, 3, 4, 5];
const BUDGETS = ['Under ₹1,000', '₹1,000 – ₹2,000', '₹2,000 – ₹3,500', '₹3,500 – ₹5,000', '₹5,000+'];

type Field =
  | 'occasion' | 'theme' | 'flavour' | 'weight' | 'tiers' | 'neededBy' | 'slot'
  | 'line1' | 'pincode' | 'budget' | 'name' | 'phone' | 'photos';

export function CustomCakePage() {
  useTitle('Custom Cake');
  const settings = useSettings();
  const minDate = earliestCustomDate(settings);

  const [form, setForm] = useState({
    occasion: '', theme: '', flavour: '', weight: '1', eggless: false, tiers: 1 as 1 | 2 | 3, message: '',
    neededBy: '', slotId: '', fulfilment: 'pickup' as OrderType, line1: '', pincode: '',
    budget: '', name: '', phone: '', notes: '',
  });
  const [photos, setPhotos] = useState<string[]>([]);
  // Field errors appear after the first submit attempt and then update live.
  const [submitted, setSubmitted] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState<CustomRequest | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function onFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    const room = MAX_REFERENCE_IMAGES - photos.length;
    setPhotoError(files.length > room ? `You can add up to ${MAX_REFERENCE_IMAGES} photos.` : null);
    const accepted = files.slice(0, Math.max(0, room)).filter((f) => f.type.startsWith('image/') && f.size <= MAX_UPLOAD_BYTES);
    if (accepted.length < Math.min(files.length, room)) {
      setPhotoError('Some files were skipped — please choose images under 10 MB.');
    }
    const thumbs = await Promise.all(accepted.map((f) => fileToThumbnail(f).catch(() => null)));
    setPhotos((p) => [...p, ...thumbs.filter((t): t is string => !!t)].slice(0, MAX_REFERENCE_IMAGES));
  }

  function validate() {
    const e: Partial<Record<Field, string>> = {};
    if (!form.occasion) e.occasion = 'Choose the occasion.';
    if (form.theme.trim().length < 3) e.theme = 'Tell us the theme or design idea.';
    if (!form.flavour) e.flavour = 'Choose a flavour.';
    const w = Number(form.weight);
    if (form.tiers === 2 && w < 2) e.tiers = '2 tiers need at least 2 kg.';
    if (form.tiers === 3 && w < 3) e.tiers = '3 tiers need at least 3 kg.';
    const dateErr = checkCustomDate(form.neededBy, settings);
    if (dateErr) e.neededBy = dateErr;
    if (!form.slotId) e.slot = 'Choose a preferred time.';
    if (form.fulfilment === 'delivery') {
      if (form.line1.trim().length < 5) e.line1 = 'Enter the delivery address.';
      const q = quoteDelivery(form.pincode, 0, settings);
      if (!q.ok) e.pincode = q.message;
    }
    if (!form.budget) e.budget = 'Choose a budget range.';
    if (form.name.trim().length < 2) e.name = 'Please enter your name.';
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a 10-digit Indian mobile number.';
    return e;
  }

  const errors: Partial<Record<Field, string>> = submitted ? validate() : {};
  if (photoError) errors.photos = photoError;

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setSubmitted(true);
    const e = validate();
    setSubmitError(null);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => {
        const first = formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
        first?.focus();
        first?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
      return;
    }
    setSubmitting(true);
    try {
      const q = form.fulfilment === 'delivery' ? quoteDelivery(form.pincode, 0, settings) : null;
      const req = await submitCustomRequest({
        occasion: form.occasion,
        theme: form.theme.trim(),
        flavour: form.flavour,
        weightKg: Number(form.weight),
        eggless: form.eggless,
        tiers: form.tiers,
        message: form.message.trim(),
        referenceImages: photos,
        neededBy: form.neededBy,
        slotId: form.slotId,
        fulfilment: form.fulfilment,
        address:
          form.fulfilment === 'delivery'
            ? { line1: form.line1.trim(), line2: '', landmark: '', pincode: form.pincode, area: q?.ok ? q.area : '' }
            : undefined,
        budget: form.budget,
        name: form.name.trim(),
        phone: `+91 ${form.phone}`,
        notes: form.notes.trim(),
      });
      setDone(req);
      window.scrollTo(0, 0);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not send your request.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="container section narrow">
        <div className="confirm-hero">
          <span className="confirm-icon" aria-hidden="true">
            <Icon name="check" size={36} />
          </span>
          <h1>Request sent!</h1>
          <p className="lead">
            Request number <strong className="order-no">{done.id}</strong>
          </p>
          <p>
            Thank you, {done.name.split(' ')[0]}. Our cake designer will look at your idea and send you a <strong>quote on WhatsApp</strong>{' '}
            (usually within a few hours) for {formatDateLong(done.neededBy)}.
          </p>
          <p className="wa-alert-note">
            <Icon name="whatsapp" size={18} /> The shop has been alerted on WhatsApp <span className="tag">demo</span>
          </p>
        </div>
        <div className="page-actions">
          <Link to={`/quote/${done.id}`} className="btn btn-primary btn-lg">
            Check quote status
          </Link>
          <a
            className="text-link"
            href={whatsappLink(settings.whatsappNumber, `Hi Cake Palace, about my custom cake request ${done.id}.`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Message us on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  const inv = (k: Field) => ({ 'aria-invalid': errors[k] ? true : undefined, 'aria-describedby': errors[k] ? `cc-${k}-err` : undefined });
  const err = (k: Field) => (errors[k] ? <p id={`cc-${k}-err`} className="field-error">{errors[k]}</p> : null);

  return (
    <div className="container section narrow">
      <h1>Custom cake request</h1>
      <p className="lead">
        Tell us your idea and share up to {MAX_REFERENCE_IMAGES} reference photos. We'll reply with a price on WhatsApp. Custom cakes need at
        least {settings.customCakeNoticeDays} days' notice.
      </p>

      <form ref={formRef} onSubmit={onSubmit} noValidate className="stack-lg">
        <section className="card" aria-labelledby="cc-cake">
          <h2 id="cc-cake">The cake</h2>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="cc-occasion">Occasion</label>
              <select id="cc-occasion" value={form.occasion} onChange={(e) => set('occasion', e.target.value)} {...inv('occasion')}>
                <option value="">Choose…</option>
                {OCCASIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
              {err('occasion')}
            </div>
            <div className="field">
              <label htmlFor="cc-flavour">Flavour</label>
              <select id="cc-flavour" value={form.flavour} onChange={(e) => set('flavour', e.target.value)} {...inv('flavour')}>
                <option value="">Choose…</option>
                {FLAVOURS.map((o) => <option key={o}>{o}</option>)}
              </select>
              {err('flavour')}
            </div>
            <div className="field field-full">
              <label htmlFor="cc-theme">Theme or design idea</label>
              <input
                id="cc-theme"
                value={form.theme}
                onChange={(e) => set('theme', e.target.value)}
                placeholder="e.g. Cricket theme, blue and white, with a bat topper"
                {...inv('theme')}
              />
              {err('theme')}
            </div>
            <div className="field">
              <label htmlFor="cc-weight">Weight</label>
              <select id="cc-weight" value={form.weight} onChange={(e) => set('weight', e.target.value)}>
                {WEIGHTS.map((w) => <option key={w} value={w}>{w} kg</option>)}
              </select>
            </div>
            <fieldset className="field">
              <legend>Tiers</legend>
              <div className="option-grid option-grid-3">
                {([1, 2, 3] as const).map((t) => (
                  <label key={t} className={`option-chip ${form.tiers === t ? 'is-selected' : ''}`}>
                    <input type="radio" name="tiers" checked={form.tiers === t} onChange={() => set('tiers', t)} {...inv('tiers')} />
                    <span className="option-main">{t}</span>
                  </label>
                ))}
              </div>
              {err('tiers')}
            </fieldset>
            <fieldset className="field">
              <legend>Egg or eggless</legend>
              <div className="option-grid option-grid-2">
                <label className={`option-chip ${!form.eggless ? 'is-selected' : ''}`}>
                  <input type="radio" name="cc-egg" checked={!form.eggless} onChange={() => set('eggless', false)} />
                  <span className="option-main">With egg</span>
                </label>
                <label className={`option-chip ${form.eggless ? 'is-selected' : ''}`}>
                  <input type="radio" name="cc-egg" checked={form.eggless} onChange={() => set('eggless', true)} />
                  <span className="option-main">Eggless</span>
                </label>
              </div>
            </fieldset>
            <div className="field">
              <label htmlFor="cc-message">
                Message on cake <span className="optional">(optional)</span>
              </label>
              <input
                id="cc-message"
                maxLength={CAKE_MESSAGE_MAX}
                value={form.message}
                onChange={(e) => set('message', e.target.value.slice(0, CAKE_MESSAGE_MAX))}
                aria-describedby="cc-msg-count"
              />
              <p id="cc-msg-count" className={`char-count ${form.message.length >= CAKE_MESSAGE_MAX ? 'is-max' : ''}`} aria-live="polite">
                {form.message.length}/{CAKE_MESSAGE_MAX} characters
              </p>
            </div>
          </div>
        </section>

        <section className="card" aria-labelledby="cc-photos">
          <h2 id="cc-photos">Reference photos <span className="optional">(optional, up to {MAX_REFERENCE_IMAGES})</span></h2>
          <p className="muted small">Photos stay on your device in this demo — they're only shown as a preview.</p>
          <div className="photo-grid">
            {photos.map((src, i) => (
              <figure key={i} className="photo-preview">
                <img src={src} alt={`Reference photo ${i + 1}`} width={160} height={160} />
                <button
                  type="button"
                  className="icon-btn photo-remove"
                  onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                  aria-label={`Remove reference photo ${i + 1}`}
                >
                  <Icon name="x" size={16} />
                </button>
              </figure>
            ))}
            {photos.length < MAX_REFERENCE_IMAGES && (
              <label className="photo-add">
                <Icon name="upload" size={24} />
                <span>Add photo</span>
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={onFiles} className="visually-hidden" />
              </label>
            )}
          </div>
          {err('photos')}
        </section>

        <section className="card" aria-labelledby="cc-when">
          <h2 id="cc-when">When and where</h2>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="cc-date">Needed by</label>
              <input
                id="cc-date"
                type="date"
                min={minDate}
                value={form.neededBy}
                onChange={(e) => set('neededBy', e.target.value)}
                {...inv('neededBy')}
              />
              <p className="hint">Earliest: {formatDateLong(minDate)}</p>
              {settings.holidays.length > 0 && (
                <p className="hint">Closed on: {settings.holidays.map((h) => formatDateLong(h)).join(', ')}</p>
              )}
              {err('neededBy')}
            </div>
            <div className="field">
              <label htmlFor="cc-slot">Preferred time</label>
              <select id="cc-slot" value={form.slotId} onChange={(e) => set('slotId', e.target.value)} {...inv('slot')}>
                <option value="">Choose…</option>
                {settings.timeSlots.filter((s) => s.enabled).map((s) => (
                  <option key={s.id} value={s.id}>{slotLabel(s)}</option>
                ))}
              </select>
              {err('slot')}
            </div>
            <fieldset className="field field-full">
              <legend>Pickup or delivery</legend>
              <div className="segmented">
                {(['pickup', 'delivery'] as OrderType[]).map((t) => (
                  <label key={t} className={`segment ${form.fulfilment === t ? 'is-selected' : ''}`}>
                    <input type="radio" name="cc-type" checked={form.fulfilment === t} onChange={() => set('fulfilment', t)} />
                    <Icon name={t === 'delivery' ? 'truck' : 'store'} size={18} />
                    {t === 'delivery' ? 'Delivery' : 'Pickup'}
                  </label>
                ))}
              </div>
            </fieldset>
            {form.fulfilment === 'delivery' && (
              <>
                <div className="field">
                  <label htmlFor="cc-line1">Delivery address</label>
                  <input id="cc-line1" value={form.line1} onChange={(e) => set('line1', e.target.value)} autoComplete="street-address" {...inv('line1')} />
                  {err('line1')}
                </div>
                <div className="field">
                  <label htmlFor="cc-pin">Pincode</label>
                  <input
                    id="cc-pin"
                    inputMode="numeric"
                    maxLength={6}
                    value={form.pincode}
                    onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoComplete="postal-code"
                    {...inv('pincode')}
                  />
                  {err('pincode')}
                </div>
              </>
            )}
            <div className="field">
              <label htmlFor="cc-budget">Budget</label>
              <select id="cc-budget" value={form.budget} onChange={(e) => set('budget', e.target.value)} {...inv('budget')}>
                <option value="">Choose…</option>
                {BUDGETS.map((b) => <option key={b}>{b}</option>)}
              </select>
              {err('budget')}
            </div>
          </div>
        </section>

        <section className="card" aria-labelledby="cc-you">
          <h2 id="cc-you">Your details</h2>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="cc-name">Name</label>
              <input id="cc-name" value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" {...inv('name')} />
              {err('name')}
            </div>
            <div className="field">
              <label htmlFor="cc-phone">WhatsApp number</label>
              <div className="input-prefix">
                <span aria-hidden="true">+91</span>
                <input
                  id="cc-phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  autoComplete="tel-national"
                  {...inv('phone')}
                />
              </div>
              {err('phone')}
            </div>
            <div className="field field-full">
              <label htmlFor="cc-notes">
                Anything else? <span className="optional">(optional)</span>
              </label>
              <textarea id="cc-notes" rows={3} maxLength={500} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </div>
        </section>

        {submitError && <p className="form-error" role="alert">{submitError}</p>}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
          {submitting ? 'Sending…' : 'Request Quote'}
        </button>
      </form>
    </div>
  );
}
