import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useTitle';
import { Img } from '../components/Img';
import { CallButton, WhatsAppButton } from '../components/Enquiry';
import { productImage } from '../lib/links';

// GALLERY — placeholder illustrations for now. Replace with real photos of
// Cake Palace cakes (same file names, see README → Photos), or add new entries
// here pointing at files in /public/images/gallery/.
type Shot = { src: string; caption: string };

const SECTIONS: { title: string; shots: Shot[] }[] = [
  {
    title: 'Birthday cakes',
    shots: [
      { src: productImage('black-forest'), caption: 'Black Forest' },
      { src: productImage('chocolate-truffle'), caption: 'Chocolate Truffle' },
      { src: productImage('butterscotch-crunch'), caption: 'Butterscotch Crunch' },
      { src: productImage('classic-vanilla'), caption: 'Classic Vanilla for kids' },
      { src: productImage('fresh-fruit-cake', 3), caption: 'Fresh Fruit (top view)' },
      { src: productImage('dutch-truffle', 2), caption: 'Dutch Truffle slice' },
    ],
  },
  {
    title: 'Celebration & custom cakes',
    shots: [
      { src: productImage('red-velvet'), caption: 'Red Velvet anniversary cake' },
      { src: productImage('rasmalai-cake'), caption: 'Rasmalai fusion cake' },
      { src: productImage('pista-badam-cake'), caption: 'Pista Badam for family functions' },
      { src: '/images/site/custom-cake.svg', caption: 'Two-tier custom cake' },
      { src: '/images/custom/cr-1002-ref-1.svg', caption: 'White & gold theme' },
      { src: '/images/custom/cr-1003-ref-1.svg', caption: 'Baby shower theme' },
    ],
  },
  {
    title: 'Pastries & treats',
    shots: [
      { src: productImage('belgian-chocolate-pastry'), caption: 'Belgian Chocolate pastry' },
      { src: productImage('red-velvet-cupcake'), caption: 'Red Velvet cupcakes' },
      { src: productImage('tiramisu-jar'), caption: 'Tiramisu jar' },
      { src: productImage('osmania-cookies'), caption: 'Osmania-style cookies' },
      { src: productImage('plum-cake'), caption: 'Rich plum cake' },
      { src: productImage('blueberry-cheesecake'), caption: 'Blueberry cheesecake' },
    ],
  },
];

export function GalleryPage() {
  useSeo('/gallery');
  return (
    <div className="container section">
      <p className="eyebrow">Gallery</p>
      <h1>Our cakes</h1>
      <p className="lead">A few of the cakes we bake. See something you like? Send us the photo on WhatsApp and we'll make it for you.</p>
      <p className="tag">Placeholder illustrations – real photos coming soon</p>

      {SECTIONS.map((s, si) => (
        <section key={s.title} className="gallery-section" aria-labelledby={`g-${si}`}>
          <h2 id={`g-${si}`}>{s.title}</h2>
          <ul className="gallery-grid">
            {s.shots.map((shot, i) => (
              <li key={shot.src}>
                <figure>
                  {/* The caption names the cake, so the image itself needs no separate alt text. */}
                  <Img src={shot.src} alt="" width={600} height={600} eager={si === 0 && i < 2} />
                  <figcaption>{shot.caption}</figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="cta-panel">
        <h2>Like a design?</h2>
        <p>Tell us which one, the size and the date — we'll confirm the price.</p>
        <div className="cta-row center-row">
          <CallButton />
          <WhatsAppButton text="Hi Cake Palace! I saw a cake in your gallery and would like a quote." />
        </div>
        <Link to="/contact#enquiry" className="text-link">Or fill in the enquiry form</Link>
      </div>
    </div>
  );
}
