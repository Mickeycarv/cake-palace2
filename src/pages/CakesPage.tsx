import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useTitle';
import { useQuery } from '../hooks/useQuery';
import { getMenu } from '../services/api';
import { CATEGORIES, SAMPLE_MENU } from '../data/menu';
import { Img } from '../components/Img';
import { Icon } from '../components/Icon';
import { CallButton } from '../components/Enquiry';
import { ProductTags } from '../components/ui';
import { productImage } from '../lib/links';
import { priceLabel } from '../lib/rules';

const OCCASION_CARDS = [
  { occasion: 'Birthday', text: 'Classic flavours or a theme cake with the name and age on top.' },
  { occasion: 'Anniversary', text: 'Red velvet, truffle or fresh fruit — with your message in icing.' },
  { occasion: 'Wedding / engagement', text: 'Tiered cakes up to 3 tiers, designed with you in advance.' },
  { occasion: 'Baby shower', text: 'Soft colours, cute toppers and eggless options for everyone.' },
  { occasion: 'Office / corporate', text: 'Large cakes, pastries and cupcakes for team celebrations.' },
  { occasion: 'Everyday treat', text: 'Pastries, jar cakes, tea cakes and Osmania-style cookies.' },
];

const enquireLink = (q: Record<string, string>) => `/contact?${new URLSearchParams(q).toString()}#enquiry`;

export function CakesPage() {
  useSeo('/cakes');
  // SAMPLE_MENU is shown first (and in the pre-rendered HTML), then replaced by live data.
  const { data: menu = SAMPLE_MENU } = useQuery(getMenu, [], SAMPLE_MENU);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">Our cakes</p>
          <h1>Cakes for every occasion</h1>
          <p className="lead">
            Fresh cream cakes, Indian-fusion favourites like Rasmalai and Gulab Jamun cake, cheesecakes, pastries and cookies — baked daily at
            our bakery in Hyderabad. Most cakes can be made eggless.
          </p>
          <div className="cta-row">
            <CallButton label="Call to enquire" />
            <Link to="/menu" className="text-link">
              Or order online <Icon name="arrowRight" size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section container" aria-labelledby="occ-h">
        <h2 id="occ-h">Cakes by occasion</h2>
        <ul className="occasion-grid">
          {OCCASION_CARDS.map((o) => (
            <li key={o.occasion} className="occasion-card">
              <h3>{o.occasion}</h3>
              <p>{o.text}</p>
              <Link to={enquireLink({ occasion: o.occasion })} className="text-link">
                Enquire<span className="visually-hidden"> about a {o.occasion.toLowerCase()} cake</span> <Icon name="arrowRight" size={16} />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="section container" aria-labelledby="price-h">
        <h2 id="price-h">Flavours &amp; prices</h2>
        <p className="muted">
          Cake prices are for ½ kg (1, 1½ and 2 kg also available). Eggless adds ₹50 per ½ kg. Prices are a guide — we confirm the final
          price when you enquire.
        </p>
        {CATEGORIES.map((c) => {
          const items = menu.filter((p) => p.category === c.id);
          if (!items.length) return null;
          return (
            <section key={c.id} className="price-section" aria-labelledby={`cat-${c.id}`}>
              <h3 id={`cat-${c.id}`} className="price-section-title">{c.name}</h3>
              <ul className="price-list">
                {items.map((p) => (
                  <li key={p.id} className="price-item">
                    <Img src={productImage(p.slug)} alt="" width={88} height={88} />
                    <div className="price-item-main">
                      <p className="price-item-name">
                        {p.name}
                        {p.soldOut && <span className="tag"> Currently unavailable</span>}
                      </p>
                      <p className="muted small">{priceLabel(p)}</p>
                      <ProductTags product={p} compact />
                    </div>
                    <Link to={enquireLink({ cake: p.name })} className="btn btn-secondary btn-sm">
                      Enquire<span className="visually-hidden"> about {p.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </section>

      <section className="section container narrow">
        <div className="cta-panel">
          <h2>Want something special?</h2>
          <p>Send us a photo or idea on WhatsApp and we'll quote within the day. Custom cakes need at least 2 days' notice.</p>
          <div className="cta-row center-row">
            <CallButton />
            <Link to="/contact#enquiry" className="btn btn-secondary btn-lg">
              Send an enquiry
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
