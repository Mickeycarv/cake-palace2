# Cake Palace — bakery website (v1, front end only)

The Cake Palace website for Hyderabad. Its main job is to get **enquiries**: every page has a Call button (plus a sticky Call / Enquire bar on phones), and Home and Contact have an enquiry form that sends the details to the shop's WhatsApp.

- **Information pages:** Home, About, Cakes (what we sell + prices), Gallery, Reviews, Contact.
- **Online ordering (secondary):** customers can also browse the menu, add to cart, choose pickup or delivery with a date and time slot, "pay" and track their order, or request a custom-cake quote.
- **Staff:** a shop admin area and a simple screen for delivery staff.

**Everything runs in the browser on sample data.** There is no real login, database, payment or WhatsApp/SMS sending yet — those places are marked with mock labels on screen and `TODO` comments in the code.

## Run it on your computer

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev
```

Open http://localhost:5173.

| Page | Address |
| --- | --- |
| Home (Call + enquiry form) | `/` |
| About | `/about` |
| Cakes ("Cake Selling": occasions, flavours, prices) | `/cakes` |
| Gallery | `/gallery` |
| Reviews | `/reviews` |
| Contact (Call + enquiry form) | `/contact` |
| Menu (order online) | `/menu` |
| Product | `/product/black-forest` (any item's slug) |
| Custom cake request | `/custom-cake` |
| Cart / Checkout | `/cart`, `/checkout` |
| Order confirmed | `/order/CP-10246` |
| My orders / tracking | `/orders` |
| Custom-cake quote | `/quote/CR-1002` |
| Admin – orders board | `/admin` |
| Admin – order detail | `/admin/orders/CP-10251` |
| Admin – custom requests | `/admin/custom`, `/admin/custom/CR-1001` |
| Admin – menu, settings, daily summary | `/admin/menu`, `/admin/settings`, `/admin/summary` |
| Delivery person | `/delivery` |

**Demo tip:** open the customer site in one tab and `/admin` in another. Orders you place show up on the admin board straight away (the demo data is shared through the browser's storage). To start again, use **Admin → Settings → Reset demo data**.

## Enquiries

The enquiry form (Home and Contact) checks the name and mobile number, then opens **WhatsApp with the enquiry already written** to the shop's number — the customer just taps Send. Nothing is stored on a server yet, so an enquiry only reaches the shop if the customer sends that WhatsApp message. Links like "Enquire about Red Velvet" on the Cakes page pre-fill the form.

The shop's WhatsApp number is `whatsappDefault` in `src/config/shop.ts` (digits only with country code, e.g. `919000000000`).

## Google search (SEO)

Each information page's Google **title and description** are in `src/config/seo.ts`. They all mention "Bakery in Hyderabad":

| Page | Title |
| --- | --- |
| Home | Cake Palace – Bakery in Hyderabad \| Fresh Cakes Daily |
| About | About Cake Palace \| Bakery in Hyderabad, Banjara Hills |
| Cakes | Cakes for Every Occasion \| Bakery in Hyderabad |
| Gallery | Cake Gallery \| Cake Palace, Bakery in Hyderabad |
| Reviews | Customer Reviews \| Cake Palace, Bakery in Hyderabad |
| Contact | Contact Cake Palace \| Bakery in Hyderabad – Call Us |

`npm run build` **pre-renders** these six pages into real HTML files (`dist/index.html`, `dist/about.html`, …), with the title, description, social-sharing tags and, on Home and Contact, schema.org "Bakery" details for Google Maps-style results. So Google, WhatsApp link previews and slow phones all see the page without waiting for JavaScript. It also writes `robots.txt`, which keeps cart, checkout, order and staff pages out of Google.

**Before launch, set `SITE_URL`** in `src/config/seo.ts` to the real address (e.g. `https://www.cakepalace.in`). The build then also adds canonical links and `sitemap.xml`. Submit the sitemap in Google Search Console, and set up a Google Business Profile with the same name, address and phone.

## Speed on phones

- Information pages are pre-rendered HTML: text, buttons and images show before any JavaScript runs.
- Online-ordering, admin and delivery screens are separate downloads, loaded only when opened.
- The Poppins font loads without blocking the page, with a size-matched fallback so text doesn't jump when it arrives.
- Images have fixed sizes (no layout shift) and load lazily below the fold.

Lighthouse (mobile, simulated slow 4G, with gzip like Cloudflare) scored **90–99 performance, 100 SEO, 100 accessibility, 100 best practices** on all six pages, with zero layout shift. After deploying, check the live site at https://pagespeed.web.dev. **Real photos are the biggest risk to speed:** keep each under ~200 KB (WebP or compressed JPEG, about 1200 px square).

## Build

```bash
npm run build     # type-checks, builds into ./dist, then pre-renders the 6 information pages
npm run preview   # serves the built site locally
npm run preview:cloudflare   # builds, then serves it with Cloudflare's real runtime at http://localhost:8787
```

`preview:cloudflare` is the closest check to the live site (e.g. `/about` → `about.html`). On Windows it needs the **Microsoft Visual C++ Redistributable (x64)**; without it, Wrangler fails with `write EOF` / exit code `0xC0000135`. Install it with `winget install Microsoft.VCRedist.2015+.x64`.

## Deploy to Cloudflare Workers

The site is served as static files by Cloudflare Workers ([Static Assets](https://developers.cloudflare.com/workers/static-assets/)); see `wrangler.jsonc`. Unknown paths fall back to `index.html` so links like `/admin` or `/order/CP-10260` work.

```bash
npx wrangler login    # once, opens your browser to sign in to Cloudflare
npm run deploy        # builds, then uploads to the "cake-palace" Worker
```

Wrangler prints the live URL (e.g. `https://cake-palace.<your-subdomain>.workers.dev`). Add a custom domain in the Cloudflare dashboard.

## Where to change things

| What | File |
| --- | --- |
| Shop name, phone, WhatsApp, address, hours (**placeholders**) | `src/config/shop.ts` → `SHOP` |
| Business rules: time slots, same-day cut-off (4 PM), custom-cake notice (2 days), delivery charges, free-delivery minimum, max distance, holidays, eggless surcharge | `src/config/shop.ts` → `DEFAULT_SETTINGS` |
| Menu items, prices, categories | `src/data/menu.ts` |
| Mock pincode → distance table | `src/data/pincodes.ts` |
| Sample orders / custom requests | `src/data/orders.ts`, `src/data/customRequests.ts` |
| Delivery staff | `src/data/people.ts` |
| Sample reviews (**not real**) | `src/data/reviews.ts` |
| Google titles & descriptions, `SITE_URL` | `src/config/seo.ts` |
| About page story (**placeholder copy**) | `src/pages/AboutPage.tsx` |
| Cakes page occasions | `src/pages/CakesPage.tsx` |
| Gallery photos and captions | `src/pages/GalleryPage.tsx` |
| Google review link | `GOOGLE_REVIEW_URL` in `src/pages/ReviewsPage.tsx` |
| Colours and font | top of `src/styles/global.css` (`--brown`, `--pink`, `--font`) |

The admin Settings and Menu screens change a copy stored in that browser only; edit the files above to change the defaults for everyone.

### Photos

Placeholder illustrations live in `public/images` with fixed names:

- `public/images/products/<slug>-1.svg`, `-2.svg`, `-3.svg` (1 is the main photo)
- `public/images/categories/<category>.svg`, `public/images/site/hero.svg`, `public/images/site/custom-cake.svg`

To use real photos, save them with the same base names (e.g. `black-forest-1.jpg`) and change `PRODUCT_IMAGE_EXT` in `src/config/shop.ts` to `'jpg'`. Square photos about 1200×1200 px, compressed to under 200 KB, work best. `npm run images` regenerates the placeholders.

## How the code is organised

- `src/services/api.ts` — **the only place screens get or change data.** Every function returns a Promise. To connect a real backend, rewrite these functions to call your API; the screens don't change. `src/services/demoStore.ts` is the in-browser stand-in and can then be deleted.
- `src/lib/rules.ts` — pricing, dates/slots, delivery charge and status-flow rules (all driven by settings).
- `src/pages` — customer screens. `src/admin` and `src/delivery` — staff screens, loaded separately so customers never download them.
- Cart and "orders placed in this browser" are saved in `localStorage`.

Search the code for `TODO` to find every integration point (login, database, Razorpay, WhatsApp, SMS, maps, photo storage, Porter/Rapido).

## Before launch checklist

- [ ] Set `SITE_URL` in `src/config/seo.ts`, deploy, submit `sitemap.xml` in Google Search Console, and create/verify a Google Business Profile
- [ ] Rewrite the About page story in the owner's words (it's placeholder copy) and add real Gallery photos
- [ ] Add the Google "write a review" link (`GOOGLE_REVIEW_URL`) and real reviews on the Reviews page
- [ ] Decide whether enquiries should also be saved/emailed automatically (today they rely on the customer tapping Send in WhatsApp)
- [ ] Real product photos in `public/images` (same file names), each under ~200 KB
- [ ] Real phone, WhatsApp number, address, hours and Instagram in `src/config/shop.ts`
- [ ] Remove or replace the sample reviews (`src/data/reviews.ts` and the Home page section)
- [ ] Replace the sample menu, prices and delivery-distance table with real ones
- [ ] Phone OTP login for customers
- [ ] Database + API for menu, orders, custom requests and settings (replace `src/services/api.ts` internals)
- [ ] Razorpay: create orders and verify payment signatures on the server; refunds via the Razorpay API
- [ ] WhatsApp Business API alerts to the shop and customers (SMS fallback)
- [ ] Real distance from the customer's address (maps API) instead of the pincode table
- [ ] Upload custom-cake reference photos to storage (e.g. Cloudflare R2)
- [ ] **Protect `/admin` (owner only) and `/delivery` (delivery staff only)** with login and server-side checks, and remove the "Demo mode" banners
- [ ] Re-check all ordering rules (prices, dates, slots, delivery charges) on the server
- [ ] Keep secrets out of git: copy `.env.example` to `.env` locally and use `npx wrangler secret put` for Worker secrets
