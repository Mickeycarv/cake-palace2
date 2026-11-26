import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { CartProvider } from './context/CartContext';
import { SettingsProvider } from './context/SettingsContext';
import './styles/global.css';

const container = document.getElementById('root')!;
const app = (
  <StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </SettingsProvider>
    </BrowserRouter>
  </StrictMode>
);

// Pre-rendered pages (Home, About, Cakes, Gallery, Reviews, Contact) already have
// their HTML: React attaches to it ("hydrates") instead of rebuilding it, so the
// page stays exactly as first painted. Other pages render from scratch.
if (container.hasAttribute('data-prerendered') && container.firstChild) hydrateRoot(container, app);
else createRoot(container).render(app);
