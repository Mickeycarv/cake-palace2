import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { Route, Routes } from 'react-router-dom';
import { SiteLayout } from './components/SiteLayout';
import { Loading, NotFound } from './components/ui';
// Information pages: bundled up front and pre-rendered to static HTML at build time.
import { HomePage } from './pages/HomePage';
import { AboutPage } from './pages/AboutPage';
import { CakesPage } from './pages/CakesPage';
import { GalleryPage } from './pages/GalleryPage';
import { ReviewsPage } from './pages/ReviewsPage';
import { ContactPage } from './pages/ContactPage';

const named = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })));

// Online-ordering pages: loaded only when visited, keeping the first download small on phones.
const MenuPage = named(() => import('./pages/MenuPage'), 'MenuPage');
const ProductPage = named(() => import('./pages/ProductPage'), 'ProductPage');
const CustomCakePage = named(() => import('./pages/CustomCakePage'), 'CustomCakePage');
const CartPage = named(() => import('./pages/CartPage'), 'CartPage');
const CheckoutPage = named(() => import('./pages/CheckoutPage'), 'CheckoutPage');
const OrderConfirmedPage = named(() => import('./pages/OrderConfirmedPage'), 'OrderConfirmedPage');
const MyOrdersPage = named(() => import('./pages/MyOrdersPage'), 'MyOrdersPage');
const QuotePage = named(() => import('./pages/QuotePage'), 'QuotePage');

// Staff screens are split into separate chunks so customers never download them.
// TODO (login): protect /admin (owner) and /delivery (delivery staff) with phone
// OTP login + server-side role checks before launch.
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const OrdersBoard = lazy(() => import('./admin/OrdersBoard'));
const OrderDetail = lazy(() => import('./admin/OrderDetail'));
const CustomRequests = lazy(() => import('./admin/CustomRequests'));
const CustomRequestDetail = lazy(() => import('./admin/CustomRequestDetail'));
const MenuManager = lazy(() => import('./admin/MenuManager'));
const SettingsPage = lazy(() => import('./admin/SettingsPage'));
const DailySummary = lazy(() => import('./admin/DailySummary'));
const DeliveryPage = lazy(() => import('./delivery/DeliveryPage'));

const page = (el: ReactNode) => <Suspense fallback={<Loading />}>{el}</Suspense>;

export function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="cakes" element={<CakesPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="menu" element={page(<MenuPage />)} />
          <Route path="product/:slug" element={page(<ProductPage />)} />
          <Route path="custom-cake" element={page(<CustomCakePage />)} />
          <Route path="cart" element={page(<CartPage />)} />
          <Route path="checkout" element={page(<CheckoutPage />)} />
          <Route path="order/:id" element={page(<OrderConfirmedPage />)} />
          <Route path="orders" element={page(<MyOrdersPage />)} />
          <Route path="quote/:id" element={page(<QuotePage />)} />
          <Route path="*" element={<div className="container section"><NotFound /></div>} />
        </Route>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<OrdersBoard />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="custom" element={<CustomRequests />} />
          <Route path="custom/:id" element={<CustomRequestDetail />} />
          <Route path="menu" element={<MenuManager />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="summary" element={<DailySummary />} />
        </Route>
        <Route path="delivery" element={<DeliveryPage />} />
      </Routes>
    </Suspense>
  );
}
