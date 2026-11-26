import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useTitle';
import { Img } from '../components/Img';
import { Icon } from '../components/Icon';
import { CallButton, WhatsAppButton } from '../components/Enquiry';
import { SHOP, SHOP_MAPS_URL } from '../config/shop';

// PLACEHOLDER COPY — the owner should check and personalise this story
// (when the shop opened, who bakes, what makes it special) before launch.
// No dates, awards or numbers are stated so nothing untrue is published.
export function AboutPage() {
  useSeo('/about');
  return (
    <>
      <section className="page-hero">
        <div className="container page-hero-inner">
          <div>
            <p className="eyebrow">About us</p>
            <h1>A neighbourhood bakery in Hyderabad</h1>
            <p className="lead">
              Cake Palace is a bakery in Banjara Hills, Hyderabad, baking cakes and pastries fresh every day for birthdays, anniversaries
              and everyday treats.
            </p>
            <div className="cta-row">
              <CallButton />
              <Link to="/contact#enquiry" className="text-link">
                Send an enquiry <Icon name="arrowRight" size={16} />
              </Link>
            </div>
          </div>
          <Img src="/images/site/custom-cake.svg" alt="A celebration cake from Cake Palace" eager width={600} height={600} className="page-hero-img" />
        </div>
      </section>

      <section className="section container narrow">
        <h2>Our story</h2>
        <p>
          We started Cake Palace to bake the kind of cakes Hyderabad families want on their special days — soft, fresh, not too sweet, and
          made the way you asked. Every cake is baked in our own kitchen in Banjara Hills and finished by hand.
        </p>
        <p>
          From a classic Black Forest for a birthday to a Rasmalai cake for a family function, or a tiered custom cake for a wedding, we
          take care of every order as if it were for our own family.
        </p>
      </section>

      <section className="section container" aria-labelledby="why-h">
        <h2 id="why-h" className="center">Why customers choose us</h2>
        <ul className="feature-grid">
          <li>
            <span className="feature-icon" aria-hidden="true"><Icon name="clock" size={22} /></span>
            <h3>Baked fresh daily</h3>
            <p>Cakes and pastries are made every day — many menu cakes are available the same day.</p>
          </li>
          <li>
            <span className="feature-icon" aria-hidden="true"><Icon name="cake" size={22} /></span>
            <h3>Eggless on request</h3>
            <p>Most of our cakes can be made eggless, so everyone at the party can enjoy a slice.</p>
          </li>
          <li>
            <span className="feature-icon" aria-hidden="true"><Icon name="sparkle" size={22} /></span>
            <h3>Custom designs</h3>
            <p>Share a photo or an idea on WhatsApp — themes, tiers, colours and your message on the cake.</p>
          </li>
          <li>
            <span className="feature-icon" aria-hidden="true"><Icon name="truck" size={22} /></span>
            <h3>Pickup or delivery</h3>
            <p>Collect from our shop in Banjara Hills or get it delivered across Hyderabad.</p>
          </li>
        </ul>
      </section>

      <section className="section container narrow">
        <div className="cta-panel">
          <h2>Visit or call us</h2>
          {/* PLACEHOLDER address and hours — see src/config/shop.ts */}
          <p>
            <a href={SHOP_MAPS_URL} target="_blank" rel="noopener noreferrer">{SHOP.address}</a>
            <br />
            Open daily {SHOP.hours}
          </p>
          <div className="cta-row center-row">
            <CallButton />
            <WhatsAppButton />
          </div>
        </div>
      </section>
    </>
  );
}
