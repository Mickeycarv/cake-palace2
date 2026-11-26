import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CategoryId } from '../types';
import { CATEGORIES } from '../data/menu';
import { getMenu } from '../services/api';
import { useQuery } from '../hooks/useQuery';
import { useTitle } from '../hooks/useTitle';
import { ProductCard } from '../components/ProductCard';
import { Icon } from '../components/Icon';
import { EmptyState, Switch } from '../components/ui';
import { isEgglessAvailable } from '../lib/rules';
import { plural } from '../lib/format';
import { formatHHMM } from '../lib/dates';
import { useSettings } from '../context/SettingsContext';

export function MenuPage() {
  useTitle('Menu');
  const { data: menu, error } = useQuery(getMenu);
  const settings = useSettings();
  const [params, setParams] = useSearchParams();
  const category = (params.get('category') ?? 'all') as CategoryId | 'all';
  const q = params.get('q') ?? '';
  const egglessOnly = params.get('eggless') === '1';

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(params);
    if (value === null || value === '' || value === 'all') next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  }

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (menu ?? [])
      .filter((p) => category === 'all' || p.category === category)
      .filter((p) => !egglessOnly || isEgglessAvailable(p))
      .filter((p) => !term || p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term))
      .sort((a, b) => Number(a.soldOut) - Number(b.soldOut));
  }, [menu, category, q, egglessOnly]);

  return (
    <div className="container section">
      <h1>Our menu</h1>
      <p className="lead">
        Freshly baked every day. Items marked “Same-day” can be ordered for today until {formatHHMM(settings.sameDayCutoff)}.
      </p>

      <div className="menu-filters">
        <div className="chips" role="group" aria-label="Filter by category">
          <button type="button" className="chip" aria-pressed={category === 'all'} onClick={() => update('category', 'all')}>
            All
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" className="chip" aria-pressed={category === c.id} onClick={() => update('category', c.id)}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="menu-filters-row">
          <div className="search-box">
            <label htmlFor="menu-search" className="visually-hidden">
              Search the menu
            </label>
            <Icon name="search" size={18} />
            <input
              id="menu-search"
              type="search"
              placeholder="Search cakes, pastries…"
              value={q}
              onChange={(e) => update('q', e.target.value)}
              autoComplete="off"
            />
          </div>
          <Switch checked={egglessOnly} onChange={(v) => update('eggless', v ? '1' : null)} label="Eggless only" />
        </div>
      </div>

      <p className="result-count" aria-live="polite">
        {menu ? plural(results.length, 'item') : ''}
      </p>

      {error && <p className="form-error">{error}</p>}
      {menu && results.length === 0 ? (
        <EmptyState title="Nothing matches yet">Try another category, clear the search, or turn off “Eggless only”.</EmptyState>
      ) : (
        <div className="product-grid">
          {menu
            ? results.map((p) => <ProductCard key={p.id} product={p} headingLevel={2} />)
            : Array.from({ length: 8 }, (_, i) => <div key={i} className="product-card skeleton" aria-hidden="true" />)}
        </div>
      )}
    </div>
  );
}
