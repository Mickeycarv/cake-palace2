import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CustomRequestStatus } from '../types';
import { getCustomRequests } from '../services/api';
import { useQuery } from '../hooks/useQuery';
import { useTitle } from '../hooks/useTitle';
import { EmptyState, Loading } from '../components/ui';
import { formatDateShort, relativeDayLabel } from '../lib/dates';
import { formatWeight } from '../lib/format';

export const REQUEST_STATUS_LABEL: Record<CustomRequestStatus, string> = {
  new: 'New',
  quoted: 'Quoted',
  paid: 'Paid',
  declined: 'Declined',
};

export default function CustomRequests() {
  useTitle('Custom requests · Admin');
  const { data: requests, loading } = useQuery(getCustomRequests);
  const [filter, setFilter] = useState<CustomRequestStatus | 'all'>('all');

  if (loading) return <Loading />;
  const list = (requests ?? []).filter((r) => filter === 'all' || r.status === filter);

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <h1>Custom cake requests</h1>
      </header>
      <div className="status-counts" role="group" aria-label="Filter by status">
        {(['all', 'new', 'quoted', 'paid', 'declined'] as const).map((s) => (
          <button key={s} type="button" className={`count-chip req-${s}`} aria-pressed={filter === s} onClick={() => setFilter(s)}>
            <strong>{s === 'all' ? requests?.length : requests?.filter((r) => r.status === s).length}</strong>{' '}
            {s === 'all' ? 'All' : REQUEST_STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState title="No requests here" />
      ) : (
        <ul className="request-list">
          {list.map((r) => (
            <li key={r.id}>
              <Link to={`/admin/custom/${r.id}`} className={`request-card ${r.status === 'new' ? 'is-new' : ''}`}>
                <img
                  src={r.referenceImages[0] ?? '/images/site/custom-cake.svg'}
                  alt=""
                  width={88}
                  height={88}
                  loading="lazy"
                  className="request-thumb"
                />
                <div className="request-main">
                  <p className="request-top">
                    <strong>{r.occasion}</strong> · {r.id}
                    {r.status === 'new' && <span className="new-badge">NEW</span>}
                  </p>
                  <p className="small">
                    {r.name} · {formatWeight(r.weightKg)}, {r.tiers} tier{r.tiers > 1 ? 's' : ''}
                  </p>
                  <p className="small muted">
                    Needed {relativeDayLabel(r.neededBy)} ({formatDateShort(r.neededBy)}) · Budget {r.budget}
                  </p>
                </div>
                <span className={`req-pill req-pill-${r.status}`}>{REQUEST_STATUS_LABEL[r.status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
