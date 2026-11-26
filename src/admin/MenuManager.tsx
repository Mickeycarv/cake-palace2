import { useEffect, useState } from 'react';
import type { CategoryId, EggOption, Product, WeightKey } from '../types';
import { getMenu, saveMenuItem, setSoldOut } from '../services/api';
import { useQuery } from '../hooks/useQuery';
import { useTitle } from '../hooks/useTitle';
import { Loading, Switch } from '../components/ui';
import { Modal } from '../components/Modal';
import { Img } from '../components/Img';
import { CATEGORIES } from '../data/menu';
import { productImage } from '../lib/links';
import { formatINR } from '../lib/format';

const WEIGHT_KEYS: WeightKey[] = ['0.5', '1', '1.5', '2'];
const WEIGHT_LABEL: Record<WeightKey, string> = { '0.5': '½ kg', '1': '1 kg', '1.5': '1½ kg', '2': '2 kg' };

function priceSummary(p: Product): string {
  if (p.pricing.kind === 'unit') return `${formatINR(p.pricing.price)} ${p.pricing.unitLabel}`;
  const prices = p.pricing.prices;
  return WEIGHT_KEYS.filter((k) => prices[k]).map((k) => `${WEIGHT_LABEL[k]} ${formatINR(prices[k]!)}`).join(' · ');
}

export default function MenuManager() {
  useTitle('Menu · Admin');
  const { data: menu, loading } = useQuery(getMenu);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [category, setCategory] = useState<CategoryId | 'all'>('all');

  if (loading) return <Loading />;
  const list = (menu ?? []).filter((p) => category === 'all' || p.category === category);

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <h1>Menu</h1>
          <p className="muted">{menu?.length} items · changes save in this browser (demo)</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
          Add Item
        </button>
      </header>

      <div className="field menu-cat-filter">
        <label htmlFor="mm-cat">Category</label>
        <select id="mm-cat" value={category} onChange={(e) => setCategory(e.target.value as CategoryId | 'all')}>
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <table className="menu-table">
          <thead>
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Category</th>
              <th scope="col">Prices</th>
              <th scope="col">Eggless</th>
              <th scope="col">Same-day</th>
              <th scope="col">Bestseller</th>
              <th scope="col">Sold out</th>
              <th scope="col"><span className="visually-hidden">Edit</span></th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className={p.soldOut ? 'is-sold-out' : ''}>
                <td data-label="Item">
                  <div className="menu-item-cell">
                    <Img src={productImage(p.slug)} alt="" width={48} height={48} />
                    <strong>{p.name}</strong>
                  </div>
                </td>
                <td data-label="Category">{CATEGORIES.find((c) => c.id === p.category)?.name}</td>
                <td data-label="Prices" className="small">{priceSummary(p)}</td>
                <td data-label="Eggless">{p.egg === 'both' ? 'Allowed' : p.egg === 'eggless-only' ? 'Always' : 'No'}</td>
                <td data-label="Same-day">{p.sameDay ? 'Yes' : 'No'}</td>
                <td data-label="Bestseller">{p.bestseller ? '★ Yes' : '—'}</td>
                <td data-label="Sold out">
                  <SoldOutSwitch product={p} />
                </td>
                <td>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(p)}>
                    Edit<span className="visually-hidden"> {p.name}</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <ItemForm
          key={editing === 'new' ? 'new' : editing.id}
          product={editing === 'new' ? null : editing}
          existing={menu ?? []}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

/** Flips instantly (optimistic), then follows the saved value. */
function SoldOutSwitch({ product }: { product: Product }) {
  const [on, setOn] = useState(product.soldOut);
  useEffect(() => setOn(product.soldOut), [product.soldOut]);
  return (
    <Switch
      checked={on}
      onChange={(v) => {
        setOn(v);
        setSoldOut(product.id, v).catch(() => setOn(!v));
      }}
      label={`${product.name} sold out`}
      hideLabel
    />
  );
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function ItemForm({ product, existing, onClose }: { product: Product | null; existing: Product[]; onClose: () => void }) {
  const [name, setName] = useState(product?.name ?? '');
  const [category, setCategory] = useState<CategoryId>(product?.category ?? 'cakes');
  const [description, setDescription] = useState(product?.description ?? '');
  const [egg, setEgg] = useState<EggOption>(product?.egg ?? 'both');
  const [sameDay, setSameDay] = useState(product?.sameDay ?? true);
  const [bestseller, setBestseller] = useState(product?.bestseller ?? false);
  const [weightPrices, setWeightPrices] = useState<Record<WeightKey, string>>(() => {
    const p = product?.pricing.kind === 'weight' ? product.pricing.prices : {};
    return { '0.5': String(p['0.5'] ?? ''), '1': String(p['1'] ?? ''), '1.5': String(p['1.5'] ?? ''), '2': String(p['2'] ?? '') };
  });
  const [unitPrice, setUnitPrice] = useState(product?.pricing.kind === 'unit' ? String(product.pricing.price) : '');
  const [unitLabel, setUnitLabel] = useState(product?.pricing.kind === 'unit' ? product.pricing.unitLabel : 'per piece');
  const [error, setError] = useState<string | null>(null);
  const byWeight = category === 'cakes';

  async function save() {
    if (name.trim().length < 3) return setError('Enter a name.');
    let pricing: Product['pricing'];
    if (byWeight) {
      const prices: Partial<Record<WeightKey, number>> = {};
      WEIGHT_KEYS.forEach((k) => {
        const v = Number(weightPrices[k]);
        if (weightPrices[k] && v > 0) prices[k] = Math.round(v);
      });
      if (!prices['0.5'] && !prices['1']) return setError('Enter at least the ½ kg or 1 kg price.');
      pricing = { kind: 'weight', prices };
    } else {
      const v = Number(unitPrice);
      if (!(v > 0)) return setError('Enter a price.');
      pricing = { kind: 'unit', price: Math.round(v), unitLabel: unitLabel.trim() || 'per piece' };
    }
    let slug = product?.slug ?? slugify(name);
    if (!product && existing.some((p) => p.slug === slug)) slug = `${slug}-${existing.length + 1}`;
    const id = product?.id ?? `p${String(existing.length + 1).padStart(3, '0')}-${Date.now().toString(36)}`;
    await saveMenuItem({
      id,
      slug,
      name: name.trim(),
      category,
      description: description.trim(),
      pricing,
      egg,
      sameDay,
      bestseller,
      soldOut: product?.soldOut ?? false,
      seasonal: product?.seasonal,
      // New items have no photos yet → the placeholder image is shown until <slug>-1 is added.
      imageCount: product?.imageCount ?? 1,
    });
    onClose();
  }

  return (
    <Modal
      open
      size="lg"
      onClose={onClose}
      title={product ? `Edit ${product.name}` : 'Add item'}
      footer={
        <button type="button" className="btn btn-primary btn-block" onClick={save}>
          {product ? 'Save changes' : 'Add Item'}
        </button>
      }
    >
      <div className="form-grid">
        <div className="field">
          <label htmlFor="if-name">Name</label>
          <input id="if-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="if-cat">Category</label>
          <select id="if-cat" value={category} onChange={(e) => setCategory(e.target.value as CategoryId)}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field field-full">
          <label htmlFor="if-desc">Description</label>
          <textarea id="if-desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {byWeight ? (
          <fieldset className="field field-full">
            <legend>Price per weight (₹) — leave blank if not offered</legend>
            <div className="price-inputs">
              {WEIGHT_KEYS.map((k) => (
                <div key={k} className="field">
                  <label htmlFor={`if-w-${k}`}>{WEIGHT_LABEL[k]}</label>
                  <input
                    id={`if-w-${k}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={weightPrices[k]}
                    onChange={(e) => setWeightPrices((w) => ({ ...w, [k]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </fieldset>
        ) : (
          <>
            <div className="field">
              <label htmlFor="if-price">Price (₹)</label>
              <input id="if-price" type="number" inputMode="numeric" min={0} value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="if-unit">Sold</label>
              <input id="if-unit" value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} placeholder="per piece / 200 g box" />
            </div>
          </>
        )}
        <div className="field">
          <label htmlFor="if-egg">Egg / eggless</label>
          <select id="if-egg" value={egg} onChange={(e) => setEgg(e.target.value as EggOption)}>
            <option value="both">Customer chooses (eggless allowed)</option>
            <option value="eggless-only">Always eggless</option>
            <option value="egg-only">Contains egg only</option>
          </select>
        </div>
        <div className="field switch-stack">
          <Switch checked={sameDay} onChange={setSameDay} label="Same-day allowed" />
          <Switch checked={bestseller} onChange={setBestseller} label="Bestseller" />
        </div>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </Modal>
  );
}
