// SAMPLE MENU — realistic placeholder items and prices for the demo.
// Edit names, prices and flags here (or in Admin → Menu for this browser only).
// TODO (database): replace with the real menu from the API via src/services/api.ts.
//
// Keep `slug, name, category` on the first line of each item:
// scripts/generate-placeholders.mjs reads them to draw placeholder images.
import type { Category, Product, Pricing, WeightKey } from '../types';

export const CATEGORIES: Category[] = [
  { id: 'cakes', name: 'Cakes', blurb: 'Birthday, anniversary and celebration cakes' },
  { id: 'pastries', name: 'Pastries', blurb: 'Single slices for everyday treats' },
  { id: 'cupcakes', name: 'Cupcakes', blurb: 'Frosted bites, great for parties' },
  { id: 'jar-cakes', name: 'Jar Cakes', blurb: 'Layered cake in a jar, spoon ready' },
  { id: 'dry-cakes-cookies', name: 'Dry Cakes & Cookies', blurb: 'Tea-time loaves, biscuits and cookies' },
];

export const WEIGHTS: { kg: 0.5 | 1 | 1.5 | 2; key: WeightKey }[] = [
  { kg: 0.5, key: '0.5' },
  { kg: 1, key: '1' },
  { kg: 1.5, key: '1.5' },
  { kg: 2, key: '2' },
];

/** Price ladder from the ½ kg price: bigger cakes get a small per-kg saving. */
function cake(halfKg: number): Pricing {
  return {
    kind: 'weight',
    prices: { '0.5': halfKg, '1': halfKg * 2 - 50, '1.5': halfKg * 3 - 100, '2': halfKg * 4 - 150 },
  };
}

function unit(price: number, unitLabel: string): Pricing {
  return { kind: 'unit', price, unitLabel };
}

type Seed = Omit<Product, 'id' | 'imageCount' | 'soldOut' | 'bestseller' | 'sameDay'> &
  Partial<Pick<Product, 'soldOut' | 'bestseller' | 'sameDay' | 'imageCount'>>;

const SEED: Seed[] = [
  // ── Cakes ──────────────────────────────────────────────────────────────
  { slug: 'black-forest', name: 'Black Forest', category: 'cakes',
    description: 'Moist chocolate sponge layered with whipped cream, cherries and chocolate shavings. The classic birthday favourite.',
    pricing: cake(450), egg: 'both', bestseller: true, sameDay: true },
  { slug: 'pineapple-cake', name: 'Pineapple Cake', category: 'cakes',
    description: 'Light vanilla sponge soaked in pineapple syrup, with fresh cream and juicy pineapple bits.',
    pricing: cake(450), egg: 'both', sameDay: true },
  { slug: 'butterscotch-crunch', name: 'Butterscotch Crunch', category: 'cakes',
    description: 'Butterscotch sponge with caramel cream and crunchy praline in every bite.',
    pricing: cake(500), egg: 'both', bestseller: true, sameDay: true },
  { slug: 'red-velvet', name: 'Red Velvet', category: 'cakes',
    description: 'Soft red velvet layers with a smooth cream cheese frosting. Perfect for anniversaries.',
    pricing: cake(650), egg: 'both', bestseller: true, sameDay: true },
  { slug: 'chocolate-truffle', name: 'Chocolate Truffle', category: 'cakes',
    description: 'Rich chocolate sponge covered in silky dark chocolate ganache. For serious chocolate lovers.',
    pricing: cake(600), egg: 'both', bestseller: true, sameDay: true },
  { slug: 'dutch-truffle', name: 'Dutch Truffle', category: 'cakes',
    description: 'Dense Dutch cocoa layers with a glossy truffle glaze and chocolate curls.',
    pricing: cake(700), egg: 'both', sameDay: true },
  { slug: 'rasmalai-cake', name: 'Rasmalai Cake', category: 'cakes',
    description: 'Saffron and cardamom sponge with rasmalai pieces, rabdi cream and crushed pistachios. A festive fusion.',
    pricing: cake(750), egg: 'both', bestseller: true, sameDay: false },
  { slug: 'gulab-jamun-cake', name: 'Gulab Jamun Cake', category: 'cakes',
    description: 'Cardamom sponge with soft gulab jamuns, rose syrup and fresh cream. Made to order.',
    pricing: cake(700), egg: 'both', sameDay: false },
  { slug: 'mango-delight', name: 'Mango Delight (Seasonal)', category: 'cakes',
    description: 'Fresh Banganapalli mango cream and mango chunks on a vanilla sponge. Back in mango season.',
    pricing: cake(650), egg: 'both', seasonal: true, soldOut: true, sameDay: true },
  { slug: 'fresh-fruit-cake', name: 'Fresh Fruit Cake', category: 'cakes',
    description: 'Vanilla sponge with fresh cream and a colourful topping of seasonal fruits.',
    pricing: cake(600), egg: 'both', sameDay: true },
  { slug: 'blueberry-cheesecake', name: 'Blueberry Cheesecake', category: 'cakes',
    description: 'Baked New York-style cheesecake on a buttery biscuit base, topped with blueberry compote.',
    pricing: cake(900), egg: 'egg-only', sameDay: false },
  { slug: 'white-forest', name: 'White Forest', category: 'cakes',
    description: 'Vanilla sponge with whipped cream, cherries and white chocolate shavings.',
    pricing: cake(500), egg: 'both', sameDay: true },
  { slug: 'pista-badam-cake', name: 'Pista Badam Cake', category: 'cakes',
    description: 'Almond sponge with pistachio cream and roasted nuts — a festive favourite for family functions.',
    pricing: cake(750), egg: 'both', sameDay: false },
  { slug: 'coffee-mocha-cake', name: 'Coffee Mocha', category: 'cakes',
    description: 'Coffee-soaked chocolate sponge with mocha buttercream.',
    pricing: cake(600), egg: 'both', sameDay: true },
  { slug: 'classic-vanilla', name: 'Classic Vanilla', category: 'cakes',
    description: 'Simple, soft vanilla sponge with fresh cream and sprinkles. Kids love it.',
    pricing: cake(450), egg: 'both', sameDay: true },

  // ── Pastries ───────────────────────────────────────────────────────────
  { slug: 'belgian-chocolate-pastry', name: 'Belgian Chocolate Pastry', category: 'pastries',
    description: 'Layers of Belgian chocolate mousse and chocolate sponge.',
    pricing: unit(140, 'per piece'), egg: 'both', bestseller: true, sameDay: true },
  { slug: 'black-forest-pastry', name: 'Black Forest Pastry', category: 'pastries',
    description: 'A single slice of our classic Black Forest.',
    pricing: unit(90, 'per piece'), egg: 'both', sameDay: true },
  { slug: 'pineapple-pastry', name: 'Pineapple Pastry', category: 'pastries',
    description: 'Light, fresh-cream pineapple slice.',
    pricing: unit(80, 'per piece'), egg: 'both', sameDay: true },
  { slug: 'red-velvet-pastry', name: 'Red Velvet Pastry', category: 'pastries',
    description: 'Red velvet sponge with cream cheese frosting.',
    pricing: unit(120, 'per piece'), egg: 'both', sameDay: true },
  { slug: 'rasmalai-pastry', name: 'Rasmalai Pastry', category: 'pastries',
    description: 'Saffron sponge with rabdi cream and pistachio.',
    pricing: unit(130, 'per piece'), egg: 'both', sameDay: true },
  { slug: 'blueberry-cheesecake-slice', name: 'Blueberry Cheesecake Slice', category: 'pastries',
    description: 'A generous slice of baked blueberry cheesecake.',
    pricing: unit(180, 'per piece'), egg: 'egg-only', sameDay: true },

  // ── Cupcakes ───────────────────────────────────────────────────────────
  { slug: 'red-velvet-cupcake', name: 'Red Velvet Cupcake', category: 'cupcakes',
    description: 'Red velvet cupcake with a swirl of cream cheese frosting.',
    pricing: unit(90, 'per piece'), egg: 'both', sameDay: true },
  { slug: 'choco-chip-cupcake', name: 'Choco Chip Cupcake', category: 'cupcakes',
    description: 'Chocolate cupcake loaded with choco chips and chocolate frosting.',
    pricing: unit(80, 'per piece'), egg: 'both', bestseller: true, sameDay: true },
  { slug: 'vanilla-sprinkle-cupcake', name: 'Vanilla Sprinkle Cupcake', category: 'cupcakes',
    description: 'Vanilla cupcake with buttercream and rainbow sprinkles.',
    pricing: unit(70, 'per piece'), egg: 'both', sameDay: true },

  // ── Jar cakes ──────────────────────────────────────────────────────────
  { slug: 'tiramisu-jar', name: 'Tiramisu Jar', category: 'jar-cakes',
    description: 'Coffee-soaked sponge layered with mascarpone cream and cocoa.',
    pricing: unit(180, 'per jar'), egg: 'egg-only', sameDay: true },
  { slug: 'nutella-jar', name: 'Hazelnut Chocolate Jar', category: 'jar-cakes',
    description: 'Chocolate sponge layered with hazelnut chocolate spread and cream.',
    pricing: unit(170, 'per jar'), egg: 'both', sameDay: true },
  { slug: 'red-velvet-jar', name: 'Red Velvet Jar', category: 'jar-cakes',
    description: 'Red velvet crumbs layered with cream cheese frosting.',
    pricing: unit(160, 'per jar'), egg: 'both', sameDay: true },

  // ── Dry cakes & cookies ────────────────────────────────────────────────
  { slug: 'plum-cake', name: 'Rich Plum Cake', category: 'dry-cakes-cookies',
    description: 'Dense, spiced plum cake packed with soaked dry fruits. 500 g loaf.',
    pricing: unit(350, '500 g loaf'), egg: 'egg-only', sameDay: true },
  { slug: 'osmania-cookies', name: 'Osmania-style Cookies', category: 'dry-cakes-cookies',
    description: 'Melt-in-the-mouth sweet and salty tea biscuits, Hyderabad style. 200 g box.',
    pricing: unit(180, '200 g box'), egg: 'eggless-only', bestseller: true, sameDay: true },
  { slug: 'banana-walnut-loaf', name: 'Banana Walnut Loaf', category: 'dry-cakes-cookies',
    description: 'Moist banana loaf with toasted walnuts. 400 g loaf.',
    pricing: unit(320, '400 g loaf'), egg: 'both', sameDay: true },
  { slug: 'atta-jaggery-cookies', name: 'Atta Jaggery Cookies', category: 'dry-cakes-cookies',
    description: 'Whole-wheat cookies sweetened with jaggery. 200 g box.',
    pricing: unit(160, '200 g box'), egg: 'eggless-only', sameDay: true },
  { slug: 'fruit-rusk', name: 'Cake Rusk', category: 'dry-cakes-cookies',
    description: 'Twice-baked crunchy cake rusk, perfect with chai. 300 g pack.',
    pricing: unit(150, '300 g pack'), egg: 'egg-only', sameDay: true },
];

export const SAMPLE_MENU: Product[] = SEED.map((s, i) => ({
  ...s,
  id: `p${String(i + 1).padStart(3, '0')}`,
  soldOut: s.soldOut ?? false,
  bestseller: s.bestseller ?? false,
  sameDay: s.sameDay ?? true,
  imageCount: s.imageCount ?? 3,
}));
