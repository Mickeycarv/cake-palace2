import { useSeo } from '../hooks/useTitle';
import { Icon } from '../components/Icon';
import { CallButton, EnquiryForm, WhatsAppButton } from '../components/Enquiry';
import { SHOP, SHOP_MAPS_URL } from '../config/shop';

export function ContactPage() {
  useSeo('/contact');
  return (
    <div className="container section">
      <p className="eyebrow">Contact</p>
      <h1>Contact Cake Palace</h1>
      <p className="lead">Call, WhatsApp or send the form below — we'll help you choose the right cake and confirm the price.</p>

      <div className="contact-layout">
        <aside className="contact-card" aria-labelledby="reach-h">
          <h2 id="reach-h">Talk to us</h2>
          <div className="contact-ctas">
            <CallButton className="btn btn-primary btn-lg btn-block" label={`Call ${SHOP.phoneDisplay}`} />
            <WhatsAppButton className="btn btn-secondary btn-lg btn-block" />
          </div>
          {/* PLACEHOLDER contact details — replace in src/config/shop.ts before launch */}
          <dl className="contact-details">
            <div>
              <dt><Icon name="map" size={18} /> Address</dt>
              <dd>
                <address>{SHOP.address}</address>
                <a href={SHOP_MAPS_URL} target="_blank" rel="noopener noreferrer" className="text-link">
                  Get directions
                </a>
              </dd>
            </div>
            <div>
              <dt><Icon name="clock" size={18} /> Hours</dt>
              <dd>Open every day, {SHOP.hours}</dd>
            </div>
            <div>
              <dt><Icon name="phone" size={18} /> Phone & WhatsApp</dt>
              <dd>{SHOP.phoneDisplay}</dd>
            </div>
          </dl>
        </aside>

        <EnquiryForm />
      </div>
    </div>
  );
}
