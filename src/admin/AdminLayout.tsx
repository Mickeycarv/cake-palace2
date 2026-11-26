import { Suspense } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { DemoBanner, Loading, ScrollToTop } from '../components/ui';
import { Icon, type IconName } from '../components/Icon';
import { Logo } from '../components/SiteLayout';
import { getOrders, getCustomRequests } from '../services/api';
import { useQuery } from '../hooks/useQuery';
import './admin.css';

const NAV: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/admin', label: 'Orders', icon: 'orders', end: true },
  { to: '/admin/custom', label: 'Custom', icon: 'sparkle' },
  { to: '/admin/menu', label: 'Menu', icon: 'cake' },
  { to: '/admin/summary', label: 'Summary', icon: 'chart' },
  { to: '/admin/settings', label: 'Settings', icon: 'settings' },
];

// TODO (login): wrap in an owner-only guard (phone OTP + role check on the server).
export default function AdminLayout() {
  const { data: orders } = useQuery(getOrders);
  const { data: requests } = useQuery(getCustomRequests);
  const newOrders = orders?.filter((o) => o.isNew).length ?? 0;
  const newRequests = requests?.filter((r) => r.status === 'new').length ?? 0;
  const badge = (to: string) => (to === '/admin' ? newOrders : to === '/admin/custom' ? newRequests : 0);

  return (
    <div className="admin-shell">
      <a href="#admin-main" className="skip-link">
        Skip to content
      </a>
      <ScrollToTop />
      <DemoBanner />
      <div className="admin-frame">
        <aside className="admin-sidebar" aria-label="Admin">
          <Link to="/admin" className="admin-brand">
            <Logo />
            <span className="admin-brand-sub">Shop admin</span>
          </Link>
          <nav className="admin-nav" aria-label="Admin sections">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end}>
                <Icon name={n.icon} />
                <span>{n.label}</span>
                {badge(n.to) > 0 && (
                  <span className="nav-badge" aria-label={`${badge(n.to)} new`}>
                    {badge(n.to)}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="admin-sidebar-foot">
            <Link to="/delivery">Delivery view</Link>
            <Link to="/">Customer site</Link>
          </div>
        </aside>
        <main id="admin-main" className="admin-main" tabIndex={-1}>
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <nav className="admin-tabbar" aria-label="Admin sections">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>
            <span className="tab-icon">
              <Icon name={n.icon} />
              {badge(n.to) > 0 && <span className="nav-dot" aria-label={`${badge(n.to)} new`} />}
            </span>
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
