import { useState, type FormEvent } from 'react';
import type { ShopSettings } from '../types';
import { resetDemo, saveSettings } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { useTitle } from '../hooks/useTitle';
import { Switch } from '../components/ui';
import { Icon } from '../components/Icon';
import { formatHour, formatDateLong, todayISO } from '../lib/dates';
import { slotLabel } from '../lib/rules';

const HOURS = Array.from({ length: 16 }, (_, i) => i + 8); // 8 AM – 11 PM

export default function SettingsPage() {
  useTitle('Settings · Admin');
  const current = useSettings();
  // The form remounts when saved settings change, so the "saved" message lives up here.
  const [status, setStatus] = useState<string | null>(null);
  return <SettingsForm key={JSON.stringify(current)} initial={current} status={status} setStatus={setStatus} />;
}

function SettingsForm({
  initial,
  status,
  setStatus,
}: {
  initial: ShopSettings;
  status: string | null;
  setStatus: (s: string | null) => void;
}) {
  const [s, setS] = useState<ShopSettings>(() => structuredClone(initial));
  const [newHoliday, setNewHoliday] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const set = <K extends keyof ShopSettings>(k: K, v: ShopSettings[K]) => {
    setS((x) => ({ ...x, [k]: v }));
    setStatus(null);
  };
  const num = (v: string) => (v === '' ? 0 : Number(v));

  function validate(): string | null {
    for (const t of s.timeSlots) if (t.endHour <= t.startHour) return `Slot ${slotLabel(t)} must end after it starts.`;
    if (!s.timeSlots.some((t) => t.enabled)) return 'Keep at least one time slot switched on.';
    const tiers = [...s.deliveryTiers].sort((a, b) => a.maxKm - b.maxKm);
    if (tiers.some((t) => t.maxKm <= 0 || t.charge < 0)) return 'Delivery tiers need a distance above 0 and a charge of 0 or more.';
    if (s.ownDeliveryMaxKm > s.maxDeliveryKm) return 'Own-delivery range cannot be more than the max delivery distance.';
    if (!/^\d{11,13}$/.test(s.whatsappNumber)) return 'WhatsApp number: digits only with country code, e.g. 919000000000.';
    if (s.customCakeNoticeDays < 0 || s.advanceNoticeDays < 0) return 'Notice days cannot be negative.';
    return null;
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    const err = validate();
    setError(err);
    if (err) return;
    const cleaned: ShopSettings = {
      ...s,
      timeSlots: [...s.timeSlots]
        .map((t) => ({ ...t, id: `${t.startHour}-${t.endHour}` }))
        .sort((a, b) => a.startHour - b.startHour),
      deliveryTiers: [...s.deliveryTiers].sort((a, b) => a.maxKm - b.maxKm),
      holidays: [...new Set(s.holidays)].sort(),
    };
    await saveSettings(cleaned);
    setStatus('Settings saved.');
  }

  return (
    <form className="admin-page settings" onSubmit={onSave} noValidate>
      <header className="admin-page-head">
        <div>
          <h1>Settings</h1>
          <p className="muted">These rules drive the customer checkout. Saved in this browser for the demo.</p>
        </div>
        <button type="submit" className="btn btn-primary">
          Save
        </button>
      </header>
      <div aria-live="polite">
        {status && <p className="added-note"><Icon name="check" size={18} /> {status}</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>

      <section className="card" aria-labelledby="st-slots">
        <h2 id="st-slots">Time slots</h2>
        <ul className="slot-editor">
          {s.timeSlots.map((t, i) => (
            <li key={i}>
              <Switch
                checked={t.enabled}
                onChange={(v) => set('timeSlots', s.timeSlots.map((x, j) => (j === i ? { ...x, enabled: v } : x)))}
                label={`Slot ${slotLabel(t)} on`}
                hideLabel
              />
              <label className="visually-hidden" htmlFor={`slot-s-${i}`}>Start</label>
              <select
                id={`slot-s-${i}`}
                value={t.startHour}
                onChange={(e) => set('timeSlots', s.timeSlots.map((x, j) => (j === i ? { ...x, startHour: Number(e.target.value) } : x)))}
              >
                {HOURS.map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
              </select>
              <span aria-hidden="true">–</span>
              <label className="visually-hidden" htmlFor={`slot-e-${i}`}>End</label>
              <select
                id={`slot-e-${i}`}
                value={t.endHour}
                onChange={(e) => set('timeSlots', s.timeSlots.map((x, j) => (j === i ? { ...x, endHour: Number(e.target.value) } : x)))}
              >
                {HOURS.map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
              </select>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Remove slot ${slotLabel(t)}`}
                onClick={() => set('timeSlots', s.timeSlots.filter((_, j) => j !== i))}
              >
                <Icon name="trash" size={18} />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => set('timeSlots', [...s.timeSlots, { id: 'new', startHour: 20, endHour: 22, enabled: true }])}
        >
          <Icon name="plus" size={16} /> Add slot
        </button>
      </section>

      <section className="card" aria-labelledby="st-rules">
        <h2 id="st-rules">Ordering rules</h2>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="st-cutoff">Same-day cut-off time</label>
            <input id="st-cutoff" type="time" value={s.sameDayCutoff} onChange={(e) => set('sameDayCutoff', e.target.value)} />
            <p className="hint">After this, same-day items move to tomorrow.</p>
          </div>
          <div className="field">
            <label htmlFor="st-lead">Minimum prep time before a same-day slot (minutes)</label>
            <input id="st-lead" type="number" min={0} step={15} value={s.slotLeadMinutes} onChange={(e) => set('slotLeadMinutes', num(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="st-custom">Custom-cake notice (days)</label>
            <input id="st-custom" type="number" min={0} value={s.customCakeNoticeDays} onChange={(e) => set('customCakeNoticeDays', num(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="st-adv">Notice for non-same-day menu items (days)</label>
            <input id="st-adv" type="number" min={1} value={s.advanceNoticeDays} onChange={(e) => set('advanceNoticeDays', Math.max(1, num(e.target.value)))} />
          </div>
        </div>
      </section>

      <section className="card" aria-labelledby="st-del">
        <h2 id="st-del">Delivery charges</h2>
        <table className="tier-table">
          <thead>
            <tr>
              <th scope="col">Up to (km)</th>
              <th scope="col">Charge (₹)</th>
            </tr>
          </thead>
          <tbody>
            {s.deliveryTiers.map((t, i) => (
              <tr key={i}>
                <td>
                  <label className="visually-hidden" htmlFor={`tier-km-${i}`}>Tier {i + 1} distance</label>
                  <input
                    id={`tier-km-${i}`}
                    type="number"
                    min={0}
                    step={0.5}
                    value={t.maxKm}
                    onChange={(e) => set('deliveryTiers', s.deliveryTiers.map((x, j) => (j === i ? { ...x, maxKm: num(e.target.value) } : x)))}
                  />
                </td>
                <td>
                  <label className="visually-hidden" htmlFor={`tier-ch-${i}`}>Tier {i + 1} charge</label>
                  <input
                    id={`tier-ch-${i}`}
                    type="number"
                    min={0}
                    step={10}
                    value={t.charge}
                    onChange={(e) => set('deliveryTiers', s.deliveryTiers.map((x, j) => (j === i ? { ...x, charge: num(e.target.value) } : x)))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="st-own">Own delivery up to (km)</label>
            <input id="st-own" type="number" min={0} value={s.ownDeliveryMaxKm} onChange={(e) => set('ownDeliveryMaxKm', num(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="st-partner">Porter/Rapido flat charge (₹)</label>
            <input id="st-partner" type="number" min={0} value={s.partnerFlatCharge} onChange={(e) => set('partnerFlatCharge', num(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="st-max">Max delivery distance (km)</label>
            <input id="st-max" type="number" min={0} value={s.maxDeliveryKm} onChange={(e) => set('maxDeliveryKm', num(e.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="st-free">Free delivery on orders from (₹)</label>
            <input id="st-free" type="number" min={0} value={s.freeDeliveryMin} onChange={(e) => set('freeDeliveryMin', num(e.target.value))} />
            <p className="hint">Applies within the own-delivery range.</p>
          </div>
          <div className="field">
            <label htmlFor="st-big">Suggest Porter/Rapido for orders from (₹)</label>
            <input id="st-big" type="number" min={0} value={s.partnerSuggestOrderValue} onChange={(e) => set('partnerSuggestOrderValue', num(e.target.value))} />
          </div>
        </div>
      </section>

      <section className="card" aria-labelledby="st-hol">
        <h2 id="st-hol">Shop holidays</h2>
        <p className="muted small">Customers can't choose these dates.</p>
        <ul className="holiday-list">
          {s.holidays.length === 0 && <li className="muted">No holidays set.</li>}
          {s.holidays.map((h) => (
            <li key={h}>
              {formatDateLong(h)}
              <button type="button" className="icon-btn" aria-label={`Remove holiday ${formatDateLong(h)}`} onClick={() => set('holidays', s.holidays.filter((x) => x !== h))}>
                <Icon name="x" size={16} />
              </button>
            </li>
          ))}
        </ul>
        <div className="inline-add">
          <label htmlFor="st-newhol" className="visually-hidden">New holiday date</label>
          <input id="st-newhol" type="date" min={todayISO()} value={newHoliday} onChange={(e) => setNewHoliday(e.target.value)} />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={!newHoliday}
            onClick={() => {
              set('holidays', [...new Set([...s.holidays, newHoliday])].sort());
              setNewHoliday('');
            }}
          >
            Add holiday
          </button>
        </div>
      </section>

      <section className="card" aria-labelledby="st-wa">
        <h2 id="st-wa">Shop WhatsApp</h2>
        <div className="field">
          <label htmlFor="st-wa-num">WhatsApp number (country code + number, digits only)</label>
          {/* PLACEHOLDER default number — set the real one in src/config/shop.ts */}
          <input
            id="st-wa-num"
            inputMode="numeric"
            value={s.whatsappNumber}
            onChange={(e) => set('whatsappNumber', e.target.value.replace(/\D/g, '').slice(0, 13))}
          />
        </div>
      </section>

      <div className="page-actions start">
        <button type="submit" className="btn btn-primary btn-lg">
          Save
        </button>
      </div>

      <section className="card danger-zone" aria-labelledby="st-reset">
        <h2 id="st-reset">Demo data</h2>
        <p className="small">Put the sample menu, orders, requests and settings back to how they started.</p>
        {!confirmReset ? (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmReset(true)}>
            Reset demo data
          </button>
        ) : (
          <div className="confirm-inline">
            <p>This removes demo orders placed in this browser. Continue?</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => resetDemo().then(() => setConfirmReset(false))}>
              Yes, reset
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          </div>
        )}
      </section>
    </form>
  );
}
