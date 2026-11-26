// Runs after `vite build` (see package.json "build").
// For every page in src/config/seo.ts marked prerender:
//   - renders the React page to HTML,
//   - writes the Google title, description, social tags and (Home/Contact) Bakery details into <head>,
//   - saves it as dist/index.html (Home) or dist/<page>.html (e.g. dist/about.html).
// Cloudflare serves /about from about.html automatically.
// Also writes robots.txt, and sitemap.xml once SITE_URL is set.
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');
const ssrDir = join(root, 'dist-ssr');
const ssr = await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const template = readFileSync(join(dist, 'index.html'), 'utf8');
const site = ssr.SITE_URL.replace(/\/$/, '');
if (!site) console.warn('⚠ SITE_URL is empty in src/config/seo.ts — skipping canonical links and sitemap.xml.');

let count = 0;
for (const page of ssr.SEO_PAGES.filter((p) => p.prerender)) {
  const body = ssr.render(page.path);
  const url = site ? `${site}${page.path === '/' ? '/' : page.path}` : '';
  const head = [
    `<meta name="robots" content="index, follow" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Cake Palace" />`,
    `<meta property="og:locale" content="en_IN" />`,
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    url && `<link rel="canonical" href="${esc(url)}" />`,
    url && `<meta property="og:url" content="${esc(url)}" />`,
    page.path === '/' && `<link rel="preload" as="image" href="/images/site/hero.svg" fetchpriority="high" />`,
    (page.path === '/' || page.path === '/contact') &&
      `<script type="application/ld+json">${JSON.stringify(ssr.bakeryJsonLd()).replace(/</g, '\\u003c')}</script>`,
  ]
    .filter(Boolean)
    .join('\n    ');

  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`)
    .replace(/<meta\s+name="description"[^>]*>/, `<meta name="description" content="${esc(page.description)}" />`)
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root" data-prerendered="${esc(page.path)}">${body}</div>`);

  if (!html.includes('data-prerendered')) throw new Error('Could not find <div id="root"></div> in dist/index.html');
  if (!html.includes(`<meta name="description" content="${esc(page.description)}" />`))
    throw new Error(`Description for ${page.path} was not written — check the <meta name="description"> tag in index.html`);
  if (!html.includes(`<title>${esc(page.title)}</title>`)) throw new Error(`Title for ${page.path} was not written`);
  const file = page.path === '/' ? 'index.html' : `${page.path.slice(1)}.html`;
  writeFileSync(join(dist, file), html, 'utf8');
  count++;
}

const disallow = ssr.NOINDEX_PREFIXES.map((p) => `Disallow: ${p}`).join('\n');
writeFileSync(
  join(dist, 'robots.txt'),
  `User-agent: *\n${disallow}\n${site ? `\nSitemap: ${site}/sitemap.xml\n` : ''}`,
  'utf8',
);

if (site) {
  const urls = ssr.SEO_PAGES.map((p) => `  <url><loc>${esc(site + (p.path === '/' ? '/' : p.path))}</loc></url>`).join('\n');
  writeFileSync(
    join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    'utf8',
  );
}

rmSync(ssrDir, { recursive: true, force: true });
console.log(`Pre-rendered ${count} pages with Google titles and descriptions.`);
