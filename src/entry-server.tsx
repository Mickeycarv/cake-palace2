// Build-time renderer: scripts/prerender.mjs calls render() for each page in
// src/config/seo.ts and writes the HTML into dist/, so phones see content
// before JavaScript loads and Google sees every title and description.
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { App } from './App';
import { CartProvider } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';

export function render(url: string): string {
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <SettingsProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </SettingsProvider>
      </StaticRouter>
    </StrictMode>,
  );
}

export { SEO_PAGES, SITE_URL, NOINDEX_PREFIXES, bakeryJsonLd } from './config/seo';
