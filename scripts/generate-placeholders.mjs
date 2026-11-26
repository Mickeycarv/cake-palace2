// Generates soft illustrated placeholder SVGs in /public/images.
// Run with: npm run images
//
// Naming scheme (keep it when adding real photos):
//   public/images/products/<slug>-1.svg … <slug>-3.svg   (gallery, 1 = main photo)
//   public/images/products/placeholder.svg               (fallback for new items)
//   public/images/categories/<category-id>.svg
//   public/images/site/hero.svg, site/custom-cake.svg
//   public/images/custom/<request-id>-ref-<n>.svg         (sample reference photos)
//
// Product slugs/names/categories are read from src/data/menu.ts.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = (p, svg) => {
  const file = join(root, 'public', 'images', p);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, svg.trim() + '\n', 'utf8');
};

const BROWN = '#5A2E1E';
const PINK = '#F2A7B5';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Flavour palettes: [sponge, cream, topping]
function palette(slug) {
  const has = (...k) => k.some((w) => slug.includes(w));
  if (has('red-velvet')) return ['#A3404F', '#FFF6F0', '#F2A7B5'];
  if (has('black-forest')) return ['#5E3324', '#FFF8F2', '#8E2436'];
  if (has('white-forest')) return ['#F3E3C3', '#FFFFFF', '#B23A48'];
  if (has('chocolate', 'truffle', 'mocha', 'belgian', 'choco', 'nutella')) return ['#6B3A28', '#4A2418', '#F2D7B6'];
  if (has('tiramisu')) return ['#C8A27A', '#FBF1E3', '#6B3A28'];
  if (has('pineapple')) return ['#F6E2A8', '#FFF8EC', '#F2C14E'];
  if (has('mango')) return ['#F8DD9A', '#FFF4DC', '#F0A830'];
  if (has('butterscotch')) return ['#E9C48A', '#F6E7CF', '#C98B3C'];
  if (has('rasmalai', 'pista', 'badam')) return ['#F4E3B5', '#FBF3DE', '#9DBB7E'];
  if (has('gulab')) return ['#F2DDB8', '#FFF6EA', '#7A3B1E'];
  if (has('blueberry')) return ['#F3E4C6', '#FFF9EE', '#6C5B8E'];
  if (has('fruit-cake')) return ['#F6E9CF', '#FFFFFF', '#E25B5B'];
  if (has('plum', 'rusk')) return ['#9A5E3A', '#C88B5E', '#5A2E1E'];
  if (has('banana')) return ['#C68D58', '#E3B988', '#6B4A2E'];
  if (has('cookie')) return ['#D9A866', '#EBC58E', '#8A5A2B'];
  if (has('vanilla')) return ['#F6E6C8', '#FFFFFF', PINK];
  return ['#EBC9A6', '#FFF6EE', PINK];
}

const BGS = [
  ['#FFF8F3', '#FCE3E8'],
  ['#FCE8EC', '#FFF3EA'],
  ['#FFF3EA', '#F7DCE2'],
];

function frame(inner, { bg = 0, label, caption = 'Photo coming soon' } = {}) {
  const [a, b] = BGS[bg % BGS.length];
  const id = `g${bg}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600" role="img"${label ? ` aria-label="${esc(label)} (placeholder illustration)"` : ''}>
  <defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>
    <filter id="s" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="${BROWN}" flood-opacity=".14"/></filter>
  </defs>
  <rect width="600" height="600" fill="url(#${id})"/>
  <circle cx="90" cy="95" r="70" fill="#FFFFFF" opacity=".45"/>
  <circle cx="530" cy="140" r="40" fill="${PINK}" opacity=".25"/>
  <circle cx="520" cy="470" r="90" fill="#FFFFFF" opacity=".35"/>
  ${inner}
  ${label ? `<rect x="60" y="500" width="480" height="64" rx="32" fill="#FFFFFF" opacity=".92"/>
  <text x="300" y="541" text-anchor="middle" font-family="Poppins, 'Segoe UI', Arial, sans-serif" font-size="${label.length > 22 ? 26 : 30}" font-weight="600" fill="${BROWN}">${esc(label)}</text>` : ''}
  ${caption ? `<text x="300" y="44" text-anchor="middle" font-family="Poppins, 'Segoe UI', Arial, sans-serif" font-size="16" fill="${BROWN}" opacity=".55">${esc(caption)}</text>` : ''}
</svg>`;
}

// ── Illustrations ──────────────────────────────────────────────────────────
const plate = (cy = 420, rx = 210) =>
  `<ellipse cx="300" cy="${cy}" rx="${rx}" ry="${rx * 0.2}" fill="#FFFFFF" filter="url(#s)"/><ellipse cx="300" cy="${cy - 4}" rx="${rx - 25}" ry="${(rx - 25) * 0.18}" fill="#F6EEE9"/>`;

function wholeCake(slug) {
  const [sponge, cream, top] = palette(slug);
  const dots = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const x = 180 + i * 40;
    return `<circle cx="${x}" cy="${222 + (i % 2) * 6}" r="11" fill="${top}"/>`;
  }).join('');
  const drips = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
    const x = 160 + i * 40;
    const h = 22 + ((i * 37) % 30);
    return `<rect x="${x - 9}" y="236" width="18" height="${h}" rx="9" fill="${cream}"/>`;
  }).join('');
  return `${plate()}
  <g filter="url(#s)">
    <path d="M140 240 v140 a160 34 0 0 0 320 0 v-140 z" fill="${sponge}"/>
    <path d="M140 300 a160 34 0 0 0 320 0" fill="none" stroke="${cream}" stroke-width="10" opacity=".85"/>
    <ellipse cx="300" cy="240" rx="160" ry="34" fill="${cream}"/>
    ${drips}
    ${dots}
    <rect x="292" y="150" width="16" height="70" rx="6" fill="${PINK}"/>
    <path d="M300 118 q14 18 0 30 q-14 -12 0 -30z" fill="#F2C14E"/>
  </g>`;
}

function sliceView(slug) {
  const [sponge, cream, top] = palette(slug);
  return `${plate(430, 190)}
  <g filter="url(#s)">
    <path d="M170 400 L430 400 L430 250 L170 330 Z" fill="${sponge}"/>
    <path d="M170 355 L430 355 L430 300" fill="none" stroke="${cream}" stroke-width="14"/>
    <path d="M170 330 L430 250 L430 236 L170 314 Z" fill="${cream}"/>
    <path d="M430 250 L470 262 L470 410 L430 400 Z" fill="${sponge}" opacity=".8"/>
    <circle cx="380" cy="246" r="14" fill="${top}"/><circle cx="330" cy="262" r="12" fill="${top}"/>
    <path d="M395 224 q12 -20 26 -8" stroke="#6B8E4E" stroke-width="5" fill="none"/>
  </g>`;
}

function topView(slug) {
  const [sponge, cream, top] = palette(slug);
  const ring = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2;
    return `<circle cx="${300 + Math.cos(a) * 150}" cy="${280 + Math.sin(a) * 150}" r="18" fill="${cream}" stroke="${sponge}" stroke-opacity=".25"/>`;
  }).join('');
  const inner = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return `<circle cx="${300 + Math.cos(a) * 80}" cy="${280 + Math.sin(a) * 80}" r="16" fill="${top}"/>`;
  }).join('');
  return `<g filter="url(#s)">
    <circle cx="300" cy="280" r="190" fill="#FFFFFF"/>
    <circle cx="300" cy="280" r="170" fill="${sponge}"/>
    <circle cx="300" cy="280" r="150" fill="${cream}" opacity=".9"/>
    ${ring}${inner}
    <circle cx="300" cy="280" r="26" fill="${PINK}"/>
  </g>`;
}

function cupcake(slug, n = 1) {
  const [sponge, cream, top] = palette(slug);
  const one = (x, s) => `<g transform="translate(${x} 0) scale(${s})" transform-origin="300 400">
    <path d="M220 300 L380 300 L360 420 L240 420 Z" fill="${PINK}"/>
    <path d="M245 300 L255 420 M275 300 L280 420 M300 300 L300 420 M325 300 L320 420 M355 300 L345 420" stroke="#FFFFFF" stroke-width="5" opacity=".7"/>
    <ellipse cx="300" cy="300" rx="90" ry="22" fill="${sponge}"/>
    <path d="M210 300 q-10 -60 50 -60 q0 -60 40 -70 q40 10 40 70 q60 0 50 60 z" fill="${cream === '#4A2418' ? sponge : cream}"/>
    <path d="M240 270 q60 -30 120 0" stroke="${top}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <circle cx="300" cy="168" r="14" fill="${top}"/>
  </g>`;
  return `${plate(430, 200)}<g filter="url(#s)">${n === 1 ? one(0, 1) : one(-110, 0.8) + one(110, 0.8)}</g>`;
}

function jar(slug, n = 1) {
  const [sponge, cream, top] = palette(slug);
  const one = (x) => `<g transform="translate(${x} 0)">
    <rect x="215" y="170" width="170" height="250" rx="26" fill="#FFFFFF" opacity=".75"/>
    <rect x="228" y="200" width="144" height="208" rx="18" fill="${cream}"/>
    <rect x="228" y="220" width="144" height="46" fill="${sponge}"/>
    <rect x="228" y="300" width="144" height="46" fill="${sponge}"/>
    <rect x="228" y="370" width="144" height="38" rx="14" fill="${sponge}"/>
    <ellipse cx="300" cy="200" rx="72" ry="12" fill="${top}"/>
    <rect x="225" y="150" width="150" height="26" rx="10" fill="${BROWN}"/>
  </g>`;
  return `${plate(440, 200)}<g filter="url(#s)">${n === 1 ? one(0) : `<g transform="scale(.8) translate(-10 90)">${one(-120)}${one(140)}</g>`}</g>`;
}

function loaf(slug) {
  const [crust, crumb, fruit] = palette(slug);
  return `${plate(430, 210)}<g filter="url(#s)">
    <path d="M150 400 v-120 q0 -60 70 -60 h160 q70 0 70 60 v120 z" fill="${crust}"/>
    <rect x="390" y="250" width="70" height="150" rx="10" fill="${crumb}"/>
    ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${405 + (i % 2) * 30}" cy="${280 + i * 24}" r="7" fill="${fruit}"/>`).join('')}
    <path d="M190 250 q40 -20 80 0 q40 -20 80 0" stroke="${crumb}" stroke-width="8" fill="none" opacity=".7"/>
  </g>`;
}

function cookies(slug) {
  const [base, light, chip] = palette(slug);
  const c = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${base}"/><circle cx="${x}" cy="${y}" r="${r - 10}" fill="${light}" opacity=".6"/>
    ${[0, 1, 2, 3].map((i) => `<circle cx="${x - r / 3 + (i % 2) * r / 1.6}" cy="${y - r / 3 + Math.floor(i / 2) * r / 1.6}" r="6" fill="${chip}"/>`).join('')}`;
  return `${plate(430, 210)}<g filter="url(#s)">${c(220, 340, 70)}${c(380, 345, 70)}${c(300, 260, 74)}</g>`;
}

function illustration(slug, category, variant) {
  if (category === 'cakes') return [wholeCake, sliceView, topView][variant](slug);
  if (category === 'pastries') return [sliceView, topView, sliceView][variant](slug);
  if (category === 'cupcakes') return [(s) => cupcake(s, 1), (s) => cupcake(s, 2), topView][variant](slug);
  if (category === 'jar-cakes') return [(s) => jar(s, 1), (s) => jar(s, 2), topView][variant](slug);
  if (slug.includes('cookie')) return [cookies, cookies, topView][variant](slug);
  return [loaf, loaf, sliceView][variant](slug);
}

// ── Products ───────────────────────────────────────────────────────────────
const menuSrc = readFileSync(join(root, 'src', 'data', 'menu.ts'), 'utf8');
const items = [...menuSrc.matchAll(/slug:\s*'([^']+)',\s*name:\s*'([^']+)',\s*category:\s*'([^']+)'/g)].map((m) => ({
  slug: m[1],
  name: m[2],
  category: m[3],
}));
for (const it of items) {
  for (let v = 0; v < 3; v++) {
    out(`products/${it.slug}-${v + 1}.svg`, frame(illustration(it.slug, it.category, v), { bg: v, label: it.name }));
  }
}
out('products/placeholder.svg', frame(wholeCake('vanilla'), { label: 'Cake Palace' }));
out('products/custom-cake-1.svg', frame(wholeCake('red-velvet'), { label: 'Custom cake', bg: 1 }));

// ── Categories ─────────────────────────────────────────────────────────────
const cats = {
  cakes: wholeCake('black-forest'),
  pastries: sliceView('belgian-chocolate-pastry'),
  cupcakes: cupcake('red-velvet-cupcake', 2),
  'jar-cakes': jar('tiramisu-jar', 2),
  'dry-cakes-cookies': cookies('osmania-cookies'),
};
Object.entries(cats).forEach(([id, art], i) => out(`categories/${id}.svg`, frame(art, { bg: i, caption: '' })));

// ── Site art ───────────────────────────────────────────────────────────────
out('site/hero.svg', frame(wholeCake('red-velvet'), { bg: 1, caption: '' }));
out('site/custom-cake.svg', frame(`<g transform="translate(0 30)">${wholeCake('white-forest')}</g>
  <g transform="translate(0 -150) scale(1)"><path d="M190 260 v-70 a110 24 0 0 0 220 0 v70 z" fill="#F7E1E6" filter="url(#s)"/><ellipse cx="300" cy="190" rx="110" ry="24" fill="#FFFFFF"/></g>`, { bg: 2, caption: '' }));

// ── Sample custom-request reference images ────────────────────────────────
const refs = [
  ['cr-1001-ref-1', topView('vanilla'), 'Reference: unicorn theme'],
  ['cr-1001-ref-2', wholeCake('vanilla'), 'Reference: pastel colours'],
  ['cr-1002-ref-1', wholeCake('white-forest'), 'Reference: white & gold'],
  ['cr-1003-ref-1', wholeCake('butterscotch'), 'Reference: teddy theme'],
  ['cr-1004-ref-1', wholeCake('white-forest'), 'Reference: tiered cake'],
];
refs.forEach(([name, art, label], i) => out(`custom/${name}.svg`, frame(art, { bg: i, label, caption: 'Sample reference photo' })));

// ── Favicon ────────────────────────────────────────────────────────────────
writeFileSync(
  join(root, 'public', 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${BROWN}"/><path d="M14 36 v12 a18 5 0 0 0 36 0 v-12z" fill="${PINK}"/><ellipse cx="32" cy="36" rx="18" ry="5" fill="#FFF8F3"/><rect x="30" y="18" width="4" height="14" rx="2" fill="#FFF8F3"/><path d="M32 10 q4 5 0 8 q-4 -3 0 -8z" fill="#F2C14E"/></svg>\n`,
  'utf8',
);

console.log(`Generated ${items.length * 3} product images + categories, site art and references.`);
