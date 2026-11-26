// ─────────────────────────────────────────────────────────────────────────────
// Google search titles and descriptions — one per page.
// Used in two places:
//   1. scripts/prerender.mjs writes them into each page's HTML at build time
//      (so Google and link previews see them without running JavaScript);
//   2. useSeo() updates them in the browser when moving between pages.
// Keep titles under ~60 characters and descriptions under ~155.
// ─────────────────────────────────────────────────────────────────────────────
import { SHOP } from './shop';

/**
 * PLACEHOLDER — the live website address, e.g. 'https://www.cakepalace.in'
 * (no trailing slash). While empty, canonical links and sitemap.xml are skipped
 * so a wrong domain is never published. Set it before launch.
 */
export const SITE_URL = 'https://mickeycarvalho.com';

export interface PageSeo {
  path: string;
  title: string;
  description: string;
  /** Pre-render this page to static HTML at build time. */
  prerender: boolean;
}

export const SEO_PAGES: PageSeo[] = [
  {
    path: '/',
    title: 'Cake Palace – Bakery in Hyderabad | Fresh Cakes Daily',
    description:
      'Cake Palace is a bakery in Hyderabad (Banjara Hills) baking fresh birthday, anniversary and custom cakes daily. Eggless options. Call or WhatsApp us.',
    prerender: true,
  },
  {
    path: '/about',
    title: 'About Cake Palace | Bakery in Hyderabad, Banjara Hills',
    description:
      'Meet Cake Palace, a neighbourhood bakery in Hyderabad. Cakes and pastries baked fresh every day in Banjara Hills, with eggless options and custom designs.',
    prerender: true,
  },
  {
    path: '/cakes',
    title: 'Cakes for Every Occasion | Bakery in Hyderabad',
    description:
      'Birthday, anniversary, wedding and eggless cakes from Cake Palace, a bakery in Hyderabad. See flavours and prices, then call or WhatsApp to enquire.',
    prerender: true,
  },
  {
    path: '/gallery',
    title: 'Cake Gallery | Cake Palace, Bakery in Hyderabad',
    description:
      'See birthday, celebration and custom cakes made by Cake Palace, a bakery in Hyderabad. Like a design? Send us a photo on WhatsApp for a quote.',
    prerender: true,
  },
  {
    path: '/reviews',
    title: 'Customer Reviews | Cake Palace, Bakery in Hyderabad',
    description:
      'What customers say about Cake Palace, a bakery in Hyderabad for fresh celebration cakes and pastries. Read reviews, then call or WhatsApp to order.',
    prerender: true,
  },
  {
    path: '/contact',
    title: 'Contact Cake Palace | Bakery in Hyderabad – Call Us',
    description:
      'Call or WhatsApp Cake Palace, a bakery in Hyderabad at Road No. 12, Banjara Hills. Open 9 AM–10 PM daily. Send a cake enquiry and we reply quickly.',
    prerender: true,
  },
];

export const DEFAULT_SEO = SEO_PAGES[0];

/** Ordering and staff pages: useful to visitors but kept out of Google. */
export const NOINDEX_PREFIXES = ['/cart', '/checkout', '/order', '/orders', '/quote', '/admin', '/delivery'];

export function seoFor(path: string): PageSeo | undefined {
  return SEO_PAGES.find((p) => p.path === path);
}

/**
 * schema.org "Bakery" details for Google's local results (Home and Contact).
 * Uses the PLACEHOLDER contact details from shop.ts — they must be real before launch.
 * No ratings are included: only add aggregateRating once there are genuine reviews.
 */
export function bakeryJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: SHOP.name,
    telephone: SHOP.phoneE164,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Road No. 12, Banjara Hills',
      addressLocality: 'Hyderabad',
      addressRegion: 'Telangana',
      postalCode: '500034',
      addressCountry: 'IN',
    },
    openingHours: 'Mo-Su 09:00-22:00',
    servesCuisine: 'Cakes, pastries and desserts',
    priceRange: '₹₹',
    ...(SITE_URL ? { url: SITE_URL, image: `${SITE_URL}/images/site/hero.svg` } : {}),
  };
}
