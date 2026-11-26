import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { WeightKg } from '../types';
import { getProduct } from '../services/api';
import { useQuery } from '../hooks/useQuery';
import { useTitle } from '../hooks/useTitle';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { Img } from '../components/Img';
import { Icon } from '../components/Icon';
import { Loading, NotFound, ProductTags, QtyStepper } from '../components/ui';
import { productImage } from '../lib/links';
import { availableWeights, egglessSurcharge, isPastSameDayCutoff, unitPriceFor } from '../lib/rules';
import { formatINR, formatWeight } from '../lib/format';
import { formatHHMM } from '../lib/dates';
import { CAKE_MESSAGE_MAX } from '../config/shop';
import { CATEGORIES } from '../data/menu';

export function ProductPage() {
  const { slug = '' } = useParams();
  const { data: product, loading } = useQuery(() => getProduct(slug), [slug]);
  const settings = useSettings();
  const cart = useCart();

  const [imageIdx, setImageIdx] = useState(1);
  const [weight, setWeight] = useState<WeightKg | null>(null);
  const [eggless, setEggless] = useState(false);
  const [message, setMessage] = useState('');
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useTitle(product?.name ?? 'Cake');

  // Reset choices when the product changes.
  useEffect(() => {
    if (!product) return;
    setImageIdx(1);
    setWeight(availableWeights(product)[0] ?? null);
    setEggless(product.egg === 'eggless-only');
    setMessage('');
    setQty(1);
    setAdded(false);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Loading />;
  if (!product) return <div className="container section"><NotFound what="cake" /></div>;

  const isCake = product.pricing.kind === 'weight';
  const weights = availableWeights(product);
  const unit = unitPriceFor(product, weight, eggless, settings);
  const total = unit * qty;
  const category = CATEGORIES.find((c) => c.id === product.category);
  const pastCutoff = isPastSameDayCutoff(settings);

  function addToCart() {
    if (!product || product.soldOut) return;
    cart.add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      weight: isCake ? weight : null,
      eggless,
      message: isCake ? message.trim() : '',
      qty,
      unitPrice: unit,
      sameDay: product.sameDay,
    });
    setAdded(true);
  }

  return (
    <div className="container section">
      <nav aria-label="Breadcrumb" className="breadcrumb">
        <Link to="/menu">Menu</Link> <span aria-hidden="true">/</span>{' '}
        <Link to={`/menu?category=${product.category}`}>{category?.name}</Link>
      </nav>

      <div className="product-layout">
        <div className="gallery">
          <div className="gallery-main">
            <Img
              src={productImage(product.slug, imageIdx)}
              alt={`${product.name} – photo ${imageIdx} of ${product.imageCount}`}
              eager
              width={600}
              height={600}
            />
            {product.soldOut && <span className="sold-out-label">Sold out</span>}
          </div>
          {product.imageCount > 1 && (
            <div className="gallery-thumbs" role="group" aria-label="Choose photo">
              {Array.from({ length: product.imageCount }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className="thumb"
                  aria-pressed={imageIdx === n}
                  aria-label={`Show photo ${n}`}
                  onClick={() => setImageIdx(n)}
                >
                  <Img src={productImage(product.slug, n)} alt="" width={120} height={120} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <ProductTags product={product} />
          <h1>{product.name}</h1>
          <p className="product-desc">{product.description}</p>

          <p className={`notice ${product.sameDay ? 'notice-ok' : ''}`}>
            <Icon name="clock" size={18} />
            {product.sameDay
              ? pastCutoff
                ? `Same-day available — today's cut-off (${formatHHMM(settings.sameDayCutoff)}) has passed, so the earliest is tomorrow.`
                : `Same-day available — order by ${formatHHMM(settings.sameDayCutoff)} for today.`
              : `Needs advance notice — order at least ${settings.advanceNoticeDays} day${settings.advanceNoticeDays > 1 ? 's' : ''} ahead.`}
          </p>

          <form
            className="product-form"
            onSubmit={(e) => {
              e.preventDefault();
              addToCart();
            }}
          >
            {isCake && (
              <fieldset className="field">
                <legend>Weight</legend>
                <div className="option-grid">
                  {weights.map((w) => (
                    <label key={w} className={`option-chip ${weight === w ? 'is-selected' : ''}`}>
                      <input type="radio" name="weight" checked={weight === w} onChange={() => setWeight(w)} />
                      <span className="option-main">{formatWeight(w)}</span>
                      <span className="option-sub">{formatINR(unitPriceFor(product, w, eggless, settings))}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            {product.egg === 'both' ? (
              <fieldset className="field">
                <legend>Egg or eggless</legend>
                <div className="option-grid option-grid-2">
                  <label className={`option-chip ${!eggless ? 'is-selected' : ''}`}>
                    <input type="radio" name="egg" checked={!eggless} onChange={() => setEggless(false)} />
                    <span className="option-main">With egg</span>
                  </label>
                  <label className={`option-chip ${eggless ? 'is-selected' : ''}`}>
                    <input type="radio" name="egg" checked={eggless} onChange={() => setEggless(true)} />
                    <span className="option-main">Eggless</span>
                    <span className="option-sub">+{formatINR(egglessSurcharge(product, weight, settings))}</span>
                  </label>
                </div>
              </fieldset>
            ) : (
              <p className="muted">{product.egg === 'eggless-only' ? '100% eggless recipe.' : 'Contains egg (no eggless version).'}</p>
            )}

            {isCake && (
              <div className="field">
                <label htmlFor="cake-message">
                  Message on cake <span className="optional">(optional)</span>
                </label>
                <input
                  id="cake-message"
                  type="text"
                  maxLength={CAKE_MESSAGE_MAX}
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, CAKE_MESSAGE_MAX))}
                  placeholder="e.g. Happy Birthday Ananya"
                  aria-describedby="msg-count"
                  autoComplete="off"
                />
                <p id="msg-count" className={`char-count ${message.length >= CAKE_MESSAGE_MAX ? 'is-max' : ''}`} aria-live="polite">
                  {message.length}/{CAKE_MESSAGE_MAX} characters
                </p>
              </div>
            )}

            <div className="field field-inline">
              <span className="field-label" id="qty-label">
                Quantity
              </span>
              <QtyStepper value={qty} onChange={setQty} label="Quantity" />
            </div>

            <div className="price-bar">
              <div>
                <span className="muted">Total</span>
                <strong className="price-total" aria-live="polite">
                  {formatINR(total)}
                </strong>
                {product.pricing.kind === 'unit' && <span className="muted"> ({formatINR(unit)} {product.pricing.unitLabel})</span>}
              </div>
              <button type="submit" className="btn btn-primary btn-lg" disabled={product.soldOut}>
                {product.soldOut ? 'Sold out' : 'Add to Cart'}
              </button>
            </div>
            <div aria-live="polite">
              {added && (
                <p className="added-note">
                  <Icon name="check" size={18} /> Added to your cart.{' '}
                  <Link to="/cart" className="text-link">
                    View cart ({cart.count})
                  </Link>
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
