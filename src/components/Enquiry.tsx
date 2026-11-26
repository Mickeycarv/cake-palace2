import { useEffect, useId, useState, type FormEvent } from 'react';
import { useIsClient } from '../hooks/useIsClient';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from './Icon';
import { useSettings } from '../context/SettingsContext';
import { SHOP } from '../config/shop';
import { whatsappLink } from '../lib/links';
import { todayISO, formatDateLong } from '../lib/dates';

export const OCCASIONS = [
  'Birthday',
  'Anniversary',
  'Wedding / engagement',
  'Baby shower',
  'Office / corporate',
  'Everyday treat',
  'Other',
];

/** Big tap-to-call button. PLACEHOLDER number comes from src/config/shop.ts. */
export function CallButton({ className = 'btn btn-primary btn-lg', label = 'Call now' }: { className?: string; label?: string }) {
  return (
    <a href={`tel:${SHOP.phoneE164}`} className={className}>
      <Icon name="phone" size={20} /> {label}
      <span className="visually-hidden"> {SHOP.phoneDisplay}</span>
    </a>
  );
}

export function WhatsAppButton({
  className = 'btn btn-secondary btn-lg',
  text = 'Hi Cake Palace! I would like to enquire about a cake.',
  label = 'WhatsApp us',
}: {
  className?: string;
  text?: string;
  label?: string;
}) {
  const settings = useSettings();
  return (
    <a href={whatsappLink(settings.whatsappNumber, text)} className={className} target="_blank" rel="noopener noreferrer">
      <Icon name="whatsapp" size={20} /> {label}
    </a>
  );
}

/**
 * Sticky Call / WhatsApp bar on phones for the information pages, so an
 * enquiry is always one tap away.
 */
export function MobileCallBar() {
  return (
    <div className="call-bar" role="region" aria-label="Contact Cake Palace">
      <CallButton className="btn btn-primary" label="Call" />
      <Link to="/contact#enquiry" className="btn btn-secondary">
        <Icon name="whatsapp" size={20} /> Enquire
      </Link>
    </div>
  );
}

type Field = 'name' | 'phone';

/**
 * Enquiry form. On submit it opens WhatsApp with the enquiry pre-filled to the
 * shop's number — the customer just taps Send. Nothing is stored on a server.
 * TODO (database/WhatsApp API): also save each enquiry and alert the shop
 * automatically, so enquiries aren't lost if the customer doesn't tap Send.
 */
export function EnquiryForm({ heading = 'Send us an enquiry', headingLevel = 2 }: { heading?: string; headingLevel?: 2 | 3 }) {
  const settings = useSettings();
  const { search } = useLocation();
  const isClient = useIsClient();
  const uid = useId();
  const id = (k: string) => `${uid}-${k}`;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [occasion, setOccasion] = useState('');
  const [cake, setCake] = useState('');

  // Pre-fill from links like /contact?cake=Red%20Velvet (after hydration, so
  // the pre-rendered HTML and first render match).
  useEffect(() => {
    const params = new URLSearchParams(search);
    const o = params.get('occasion');
    if (o && OCCASIONS.includes(o)) setOccasion(o);
    const c = params.get('cake');
    if (c) setCake(c.slice(0, 60));
  }, [search]);
  const [date, setDate] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sentLink, setSentLink] = useState<string | null>(null);

  const errors: Partial<Record<Field, string>> = {};
  if (submitted) {
    if (name.trim().length < 2) errors.name = 'Please enter your name.';
    if (!/^[6-9]\d{9}$/.test(phone)) errors.phone = 'Enter a 10-digit mobile number so we can call you back.';
  }

  function buildMessage() {
    const lines = [
      'Hi Cake Palace! New enquiry from the website:',
      `Name: ${name.trim()}`,
      `Phone: +91 ${phone}`,
      occasion && `Occasion: ${occasion}`,
      cake.trim() && `Cake: ${cake.trim()}`,
      date && `Needed on: ${formatDateLong(date)}`,
      message.trim() && `Message: ${message.trim()}`,
    ];
    return lines.filter(Boolean).join('\n');
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const valid = name.trim().length >= 2 && /^[6-9]\d{9}$/.test(phone);
    if (!valid) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`#${CSS.escape(uid)}-form [aria-invalid="true"]`)?.focus());
      return;
    }
    const link = whatsappLink(settings.whatsappNumber, buildMessage());
    setSentLink(link);
    window.open(link, '_blank', 'noopener');
  }

  const H = headingLevel === 2 ? 'h2' : 'h3';

  if (sentLink) {
    return (
      <div className="enquiry-card enquiry-done" id="enquiry" tabIndex={-1} aria-live="polite">
        <span className="confirm-icon" aria-hidden="true">
          <Icon name="check" size={32} />
        </span>
        <H>Almost done — tap Send in WhatsApp</H>
        <p>Your enquiry is ready in WhatsApp. Once you send it, we usually reply within the hour during shop hours ({SHOP.hours}).</p>
        <div className="cta-row">
          <a href={sentLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            <Icon name="whatsapp" size={20} /> Open WhatsApp again
          </a>
          <CallButton className="btn btn-secondary" label="Or call us" />
        </div>
        <button type="button" className="text-link link-button" onClick={() => setSentLink(null)}>
          Send another enquiry
        </button>
      </div>
    );
  }

  const inv = (k: Field) => ({
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? id(`${k}-err`) : undefined,
  });

  return (
    <form className="enquiry-card" id="enquiry" onSubmit={onSubmit} noValidate aria-labelledby={id('h')}>
      <div id={`${uid}-form`}>
        <H id={id('h')}>{heading}</H>
        <p className="muted">Tell us what you need — we'll reply on WhatsApp or call you back.</p>
        <div className="form-grid">
          <div className="field">
            <label htmlFor={id('name')}>Your name</label>
            <input id={id('name')} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" {...inv('name')} />
            {errors.name && (
              <p id={id('name-err')} className="field-error">
                {errors.name}
              </p>
            )}
          </div>
          <div className="field">
            <label htmlFor={id('phone')}>Mobile number</label>
            <div className="input-prefix">
              <span aria-hidden="true">+91</span>
              <input
                id={id('phone')}
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                autoComplete="tel-national"
                {...inv('phone')}
              />
            </div>
            {errors.phone && (
              <p id={id('phone-err')} className="field-error">
                {errors.phone}
              </p>
            )}
          </div>
          <div className="field">
            <label htmlFor={id('occasion')}>
              Occasion <span className="optional">(optional)</span>
            </label>
            <select id={id('occasion')} value={occasion} onChange={(e) => setOccasion(e.target.value)}>
              <option value="">Choose…</option>
              {OCCASIONS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={id('date')}>
              Date needed <span className="optional">(optional)</span>
            </label>
            <input id={id('date')} type="date" min={isClient ? todayISO() : undefined} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field field-full">
            <label htmlFor={id('cake')}>
              Cake you're interested in <span className="optional">(optional)</span>
            </label>
            <input
              id={id('cake')}
              value={cake}
              onChange={(e) => setCake(e.target.value)}
              placeholder="e.g. 1 kg eggless Red Velvet"
            />
          </div>
          <div className="field field-full">
            <label htmlFor={id('msg')}>
              Message <span className="optional">(optional)</span>
            </label>
            <textarea
              id={id('msg')}
              rows={3}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Theme, message on cake, number of guests…"
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary btn-lg btn-block enquiry-submit">
          <Icon name="whatsapp" size={20} /> Send enquiry on WhatsApp
        </button>
        <p className="muted small center">Prefer to talk? <a href={`tel:${SHOP.phoneE164}`}>Call {SHOP.phoneDisplay}</a></p>
      </div>
    </form>
  );
}
