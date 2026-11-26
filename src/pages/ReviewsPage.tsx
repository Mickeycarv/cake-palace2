import { Link } from 'react-router-dom';
import { useSeo } from '../hooks/useTitle';
import { Icon } from '../components/Icon';
import { CallButton } from '../components/Enquiry';
import { SAMPLE_REVIEWS } from '../data/reviews';
import type { Review } from '../types';

/**
 * PLACEHOLDER — link to the shop's Google Business Profile "write a review" page
 * (Google Business Profile → Ask for reviews → copy link). Hidden while empty.
 */
const GOOGLE_REVIEW_URL = '';

export function ReviewCard({ r }: { r: Review }) {
  return (
    <li className="review-card">
      <p className="stars" role="img" aria-label={`${r.rating} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, i) => (
          <Icon key={i} name="star" size={16} className={i < r.rating ? 'star-on' : 'star-off'} />
        ))}
      </p>
      <blockquote>{r.text}</blockquote>
      <p className="review-meta">
        {r.name} · {r.area} · {r.occasion}
      </p>
    </li>
  );
}

// ⚠️ The reviews shown are SAMPLE placeholders (src/data/reviews.ts) and are
// labelled as such on the page. Replace them with genuine customer reviews
// (with permission) before launch. Do not add star-rating markup for Google
// until the reviews are real.
export function ReviewsPage() {
  useSeo('/reviews');
  return (
    <div className="container section">
      <p className="eyebrow">Reviews</p>
      <h1>What our customers say</h1>
      <p className="lead">Kind words from families and friends who celebrated with Cake Palace.</p>
      <p className="sample-notice" role="note">
        <strong>Sample reviews for the demo.</strong> Real customer reviews will be added here before the website goes live.
      </p>

      <ul className="review-grid">
        {SAMPLE_REVIEWS.map((r) => (
          <ReviewCard key={r.id} r={r} />
        ))}
      </ul>

      {GOOGLE_REVIEW_URL && (
        <p className="center">
          <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer" className="text-link">
            Loved your cake? Leave us a review on Google
          </a>
        </p>
      )}

      <div className="cta-panel">
        <h2>Planning a celebration?</h2>
        <p>Call us or send an enquiry — we'll help you pick the right cake.</p>
        <div className="cta-row center-row">
          <CallButton />
          <Link to="/contact#enquiry" className="btn btn-secondary btn-lg">
            Send an enquiry
          </Link>
        </div>
      </div>
    </div>
  );
}
