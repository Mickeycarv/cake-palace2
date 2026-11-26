import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyDeliveries, riderDelivered, riderPickedUp, type DeliveryJob } from '../services/api';
import { useQuery } from '../hooks/useQuery';
import { useTitle } from '../hooks/useTitle';
import { useSettings } from '../context/SettingsContext';
import { DemoBanner, EmptyState, Loading, StatusPill } from '../components/ui';
import { Icon } from '../components/Icon';
import { Logo } from '../components/SiteLayout';
import { DELIVERY_PEOPLE } from '../data/people';
import { describeItemOptions, formatPhone, telHref } from '../lib/format';
import { formatDateLong, todayISO } from '../lib/dates';
import { slotLabelById, slotStartHour } from '../lib/rules';
import { mapsLink } from '../lib/links';
import { readJSON, STORAGE_KEYS, writeJSON } from '../lib/storage';
import '../admin/admin.css';

/**
 * Delivery person view: only today's own-delivery jobs assigned to them, no prices.
 * TODO (login): replace the "Viewing as" picker with the logged-in delivery person.
 */
export default function DeliveryPage() {
  useTitle('My deliveries');
  const [personId, setPersonId] = useState(() => readJSON(STORAGE_KEYS.deliveryPerson, DELIVERY_PEOPLE[0].id));
  const person = DELIVERY_PEOPLE.find((p) => p.id === personId) ?? DELIVERY_PEOPLE[0];
  const { data: jobs, loading } = useQuery(() => getMyDeliveries(person.id), [person.id]);
  const settings = useSettings();

  const sorted = [...(jobs ?? [])].sort((a, b) => slotStartHour(settings, a.slotId) - slotStartHour(settings, b.slotId));
  const open = sorted.filter((j) => j.status !== 'delivered');
  const done = sorted.filter((j) => j.status === 'delivered');

  return (
    <div className="delivery-shell">
      <DemoBanner />
      <header className="delivery-header">
        <Link to="/delivery" className="brand" aria-label="Cake Palace deliveries">
          <Logo />
        </Link>
        <div className="field delivery-who">
          <label htmlFor="dp-who">Viewing as</label>
          <select
            id="dp-who"
            value={person.id}
            onChange={(e) => {
              setPersonId(e.target.value);
              writeJSON(STORAGE_KEYS.deliveryPerson, e.target.value);
            }}
          >
            {DELIVERY_PEOPLE.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main id="main" className="delivery-main">
        <h1>My deliveries</h1>
        <p className="muted">{formatDateLong(todayISO())} · {open.length} to go</p>

        {loading ? (
          <Loading />
        ) : sorted.length === 0 ? (
          <EmptyState title="No deliveries assigned today">The shop will assign orders here.</EmptyState>
        ) : (
          <>
            <ol className="job-list">
              {open.map((j) => (
                <JobCard key={j.id} job={j} personName={person.name} />
              ))}
            </ol>
            {done.length > 0 && (
              <section aria-labelledby="done-h">
                <h2 id="done-h" className="small-heading">Delivered today ({done.length})</h2>
                <ol className="job-list">
                  {done.map((j) => (
                    <JobCard key={j.id} job={j} personName={person.name} />
                  ))}
                </ol>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function JobCard({ job, personName }: { job: DeliveryJob; personName: string }) {
  const settings = useSettings();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const a = job.address;
  const addressText = a ? [a.line1, a.line2, a.landmark, a.area, `Hyderabad ${a.pincode}`].filter(Boolean).join(', ') : '';
  const delivered = job.status === 'delivered';

  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className={`job-card ${delivered ? 'is-done' : ''}`}>
      <div className="job-top">
        <span className="job-slot">
          <Icon name="clock" size={16} /> {slotLabelById(settings, job.slotId)}
        </span>
        <StatusPill status={job.status} />
      </div>
      <h2 className="job-name">
        {job.customer.name} <span className="muted small">· {job.id}</span>
      </h2>
      <p className="job-address">{addressText}</p>
      <div className="job-links">
        <a href={telHref(job.customer.phone)} className="btn btn-secondary btn-sm">
          <Icon name="phone" size={16} /> {formatPhone(job.customer.phone)}
        </a>
        <a href={mapsLink(addressText)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
          <Icon name="map" size={16} /> Open in Maps
        </a>
      </div>
      <ul className="job-items">
        {job.items.map((i, idx) => (
          <li key={idx}>
            <strong>{i.qty} × {i.name}</strong> <span className="muted small">{describeItemOptions(i)}</span>
            {i.message && <span className="cake-msg-inline"> “{i.message}”</span>}
          </li>
        ))}
      </ul>
      {job.notes && <p className="notice small">{job.notes}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {!delivered && (
        <div className="job-actions">
          {job.status !== 'out_for_delivery' && (
            <button
              type="button"
              className="btn btn-secondary"
              disabled={busy || job.status !== 'ready'}
              onClick={() => act(() => riderPickedUp(job.id, personName))}
            >
              Picked up
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary btn-lg"
            disabled={busy || job.status !== 'out_for_delivery'}
            onClick={() => act(() => riderDelivered(job.id, personName))}
          >
            Mark Delivered
          </button>
          {job.status !== 'ready' && job.status !== 'out_for_delivery' && (
            <p className="muted small job-hint">Still in the kitchen — “Picked up” unlocks when the order is ready.</p>
          )}
        </div>
      )}
    </li>
  );
}
