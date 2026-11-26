import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Icon } from './Icon';
import { ScrollToTop } from './ui';
import { MobileCallBar } from './Enquiry';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { SHOP, SHOP_MAPS_URL } from '../config/shop';
import { whatsappLink } from '../lib/links';
import { useIsClient } from '../hooks/useIsClient';

const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/cakes', label: 'Cakes' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/reviews', label: 'Reviews' },
  { to: '/contact', label: 'Contact' },
];

/** Pages with their own pay button don't get the sticky call bar. */
const NO_CALL_BAR = ['/cart', '/checkout', '/order/', '/quote/'];

export function Logo() {
  return (
    <span className="logo">
      <img src="/favicon.svg" alt="" width={36} height={36} />
      <span>
        Cake <span className="logo-accent">Palace</span>
      </span>
    </span>
  );
}

function Header() {
  const { count: savedCount } = useCart();
  // Cart lives in this browser's storage, so the badge appears after hydration.
  const count = useIsClient() ? savedCount : 0;
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to="/" className="brand" aria-label="Cake Palace home">
          <Logo />
        </Link>
        <nav className="main-nav" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <a href={`tel:${SHOP.phoneE164}`} className="header-call">
            <Icon name="phone" size={18} /> <span>Call</span>
            <span className="visually-hidden"> {SHOP.phoneDisplay}</span>
          </a>
          <Link to="/menu" className="header-order">
            Order online
          </Link>
          <Link to="/cart" className="cart-link" aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}>
            <Icon name="cart" size={24} />
            {count > 0 && (
              <span className="cart-count" aria-hidden="true">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const settings = useSettings();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p className="footer-tag">{SHOP.tagline}. A bakery in Hyderabad, Banjara Hills.</p>
        </div>
        <div>
          <h2 className="footer-heading">Visit us</h2>
          {/* PLACEHOLDER address and hours — see src/config/shop.ts */}
          <address>
            <a href={SHOP_MAPS_URL} target="_blank" rel="noopener noreferrer">
              {SHOP.address}
            </a>
          </address>
          <p>Open daily {SHOP.hours}</p>
        </div>
        <div>
          <h2 className="footer-heading">Talk to us</h2>
          <p>
            <a href={`tel:${SHOP.phoneE164}`}>
              <Icon name="phone" size={16} /> {SHOP.phoneDisplay}
            </a>
          </p>
          <p>
            <a href={whatsappLink(settings.whatsappNumber, 'Hi Cake Palace! I have a question.')} target="_blank" rel="noopener noreferrer" className="footer-wa">
              <Icon name="whatsapp" /> WhatsApp us
            </a>
          </p>
          <p>
            <Link to="/contact#enquiry">Send an enquiry</Link>
          </p>
        </div>
        <div>
          <h2 className="footer-heading">Explore</h2>
          <ul className="footer-links">
            {NAV.slice(1).map((n) => (
              <li key={n.to}><Link to={n.to}>{n.label}</Link></li>
            ))}
            <li><Link to="/menu">Order online</Link></li>
            <li><Link to="/orders">Track an order</Link></li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <p suppressHydrationWarning>© {new Date().getFullYear()} Cake Palace, Hyderabad. Also on Swiggy & Zomato.</p>
        <p className="muted-on-dark">Demo version · sample content</p>
      </div>
    </footer>
  );
}

export function SiteLayout() {
  const { pathname } = useLocation();
  const showCallBar = !NO_CALL_BAR.some((p) => pathname === p || pathname.startsWith(p));
  return (
    <div className={showCallBar ? 'has-call-bar' : undefined}>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <ScrollToTop />
      <Header />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      {showCallBar && <MobileCallBar />}
    </div>
  );
}
