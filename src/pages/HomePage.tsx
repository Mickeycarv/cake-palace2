import { Link } from 'react-router-dom';
import { CATEGORIES, SAMPLE_MENU } from '../data/menu';
import { SAMPLE_REVIEWS } from '../data/reviews';
import { getMenu } from '../services/api';
import { useQuery } from '../hooks/useQuery';
import { useSeo } from '../hooks/useTitle';
import { ProductCard } from '../components/ProductCard';
import { Img } from '../components/Img';
import { Icon } from '../components/Icon';
import { CallButton, EnquiryForm, WhatsAppButton } from '../components/Enquiry';
import { ReviewCard } from './ReviewsPage';
import { categoryImage } from '../lib/links';
import { SHOP, SHOP_MAPS_URL } from '../config/shop';

export function HomePage() {
  useSeo('/');
  // SAMPLE_MENU renders immediately (and in the pre-rendered HTML); live data replaces it.
  const { data: menu = SAMPLE_MENU } = useQuery(getMenu, [], SAMPLE_MENU);
  const bestsellers = menu.filter((p) => p.bestseller && !p.soldOut).slice(0, 6);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="badge">
              <Icon name="clock" size={16} /> Same-day delivery on menu cakes
            </p>
            <h1>Fresh cakes from your bakery in Hyderabad</h1>
            <p className="hero-sub">
              Birthday, anniversary and custom cakes baked fresh every day in Banjara Hills. Eggless options, pickup or delivery across
              Hyderabad.
            </p>
            <div className="hero-actions">
              <CallButton />
              <a href="#enquiry" className="btn btn-secondary btn-lg">
                Send an enquiry
              </a>
            </div>
            <p className="hero-note">
              <Link to="/menu" className="text-link">
                Or order online <Icon name="arrowRight" size={16} />
              </Link>
            </p>
          </div>
          <div className="hero-art">
            <Img src="/images/site/hero.svg" alt="A red velvet celebration cake with a candle" eager width={600} height={600} fetchPriority="high" />
          </div>
        </div>
      </section>

      <section className="section container" aria-labelledby="cat-heading">
        <div className="section-head">
          <h2 id="cat-heading">What we bake</h2>
          <Link to="/cakes" className="text-link">
            Flavours &amp; prices <Icon name="arrowRight" size={16} />
          </Link>
        </div>
        <ul className="category-grid">
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <Link to={`/cakes#cat-${c.id}`} className="category-tile">
                <Img src={categoryImage(c.id)} alt="" width={600} height={600} />
                <span className="category-name">{c.name}</span>
                <span className="category-blurb">{c.blurb}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="section enquiry-band" aria-label="Enquiry">
        <div className="container enquiry-layout">
          <div className="enquiry-side">
            <h2>Planning a celebration?</h2>
            <p>Tell us the occasion, the date and what you have in mind. We'll suggest the right cake and confirm the price on WhatsApp.</p>
            <ul className="check-list">
              <li><Icon name="check" size={18} /> Quick reply during shop hours</li>
              <li><Icon name="check" size={18} /> Eggless and custom designs</li>
              <li><Icon name="check" size={18} /> Pickup or delivery in Hyderabad</li>
            </ul>
            <div className="cta-row">
              <CallButton className="btn btn-primary" />
              <WhatsAppButton className="btn btn-secondary" />
            </div>
            {/* PLACEHOLDER address and hours — src/config/shop.ts */}
            <p className="muted small enquiry-address">
              <Icon name="map" size={16} /> <a href={SHOP_MAPS_URL} target="_blank" rel="noopener noreferrer">{SHOP.address}</a> · Open daily{' '}
              {SHOP.hours}
            </p>
          </div>
          <EnquiryForm />
        </div>
      </section>

      <section className="section container" aria-labelledby="best-heading">
        <div className="section-head">
          <h2 id="best-heading">Customer favourites</h2>
          <Link to="/cakes" className="text-link">
            All cakes <Icon name="arrowRight" size={16} />
          </Link>
        </div>
        <div className="product-grid product-grid-3">
          {bestsellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="custom-promo">
          <Img src="/images/site/custom-cake.svg" alt="A two-tier custom celebration cake" width={600} height={600} />
          <div>
            <h2>Custom cake for your occasion</h2>
            <p>
              Theme birthdays, tiered anniversary cakes, baby showers — share a reference photo and your budget, and we'll send a quote on
              WhatsApp.
            </p>
            <ul className="check-list">
              <li><Icon name="check" size={18} /> Up to 3 tiers, egg or eggless</li>
              <li><Icon name="check" size={18} /> Your message and colours</li>
              <li><Icon name="check" size={18} /> Order at least 2 days ahead</li>
            </ul>
            <Link to="/custom-cake" className="btn btn-secondary">
              Request a custom cake
            </Link>
          </div>
        </div>
      </section>

      {/* ⚠️ SAMPLE REVIEWS — placeholders, not real customers. Replace or remove before launch (src/data/reviews.ts). */}
      <section className="section container" aria-labelledby="reviews-heading">
        <div className="section-head">
          <h2 id="reviews-heading">What customers say</h2>
          <span className="tag">Sample reviews – for demo only</span>
        </div>
        <ul className="review-grid">
          {SAMPLE_REVIEWS.map((r) => (
            <ReviewCard key={r.id} r={r} />
          ))}
        </ul>
        <p className="center">
          <Link to="/reviews" className="text-link">
            More reviews <Icon name="arrowRight" size={16} />
          </Link>
        </p>
      </section>
    </>
  );
}
