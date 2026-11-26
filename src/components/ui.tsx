// Small shared UI pieces.
import { useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { Order, OrderStatus, Product } from '../types';
import { Icon } from './Icon';
import { STATUS_LABEL, statusFlow } from '../lib/rules';
import { formatDateTime } from '../lib/dates';

export function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      // Wait a moment for the new page to render, then jump to the #section.
      const t = setTimeout(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView(), 60);
      return () => clearTimeout(t);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

export function DemoBanner() {
  return (
    <div className="demo-banner" role="note">
      <strong>Demo mode</strong> – login will be added before launch.
    </div>
  );
}

export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="page-state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      {label}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
  level = 2,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  level?: 1 | 2;
}) {
  const H = level === 1 ? 'h1' : 'h2';
  return (
    <div className="empty-state">
      <H>{title}</H>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function NotFound({ what = 'page' }: { what?: string }) {
  return (
    <EmptyState level={1} title={`We couldn't find that ${what}`} action={<Link to="/menu" className="btn btn-primary">Browse the menu</Link>}>
      It may have been moved or the link may be incomplete.
    </EmptyState>
  );
}

export function ProductTags({ product, compact = false }: { product: Product; compact?: boolean }) {
  return (
    <ul className="tags" aria-label="Highlights">
      {product.bestseller && <li className="tag tag-accent">Bestseller</li>}
      {product.egg === 'eggless-only' && <li className="tag">Eggless</li>}
      {product.egg === 'both' && <li className="tag">{compact ? 'Eggless option' : 'Eggless available'}</li>}
      {product.sameDay && <li className="tag">Same-day</li>}
      {product.seasonal && <li className="tag">Seasonal</li>}
    </ul>
  );
}

export function StatusPill({ status }: { status: OrderStatus }) {
  return <span className={`status-pill status-${status}`}>{STATUS_LABEL[status]}</span>;
}

/** Placed → Accepted → Baking → Ready → Out for delivery → Delivered (pickup ends at Picked up). */
export function StatusStepper({ order }: { order: Pick<Order, 'type' | 'status' | 'history'> }) {
  if (order.status === 'rejected' || order.status === 'cancelled') {
    const ev = [...order.history].reverse().find((h) => h.status === order.status);
    return (
      <p className="stepper-cancelled">
        <StatusPill status={order.status} /> {ev?.note}
      </p>
    );
  }
  const flow = statusFlow(order.type);
  const current = flow.indexOf(order.status);
  return (
    <ol className="stepper" aria-label="Order progress">
      {flow.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        const at = order.history.find((h) => h.status === s)?.at;
        return (
          <li key={s} className={`step step-${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="step-dot" aria-hidden="true">
              {state === 'done' ? <Icon name="check" size={14} /> : i + 1}
            </span>
            <span className="step-label">
              {STATUS_LABEL[s]}
              {at && state !== 'todo' && <small>{formatDateTime(at)}</small>}
              <span className="visually-hidden">{state === 'done' ? ' (done)' : state === 'current' ? ' (current)' : ''}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 50,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  return (
    <div className="qty" role="group" aria-label={label}>
      <button type="button" className="qty-btn" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Decrease quantity">
        <Icon name="minus" size={18} />
      </button>
      <output className="qty-value" aria-live="polite" aria-label={`Quantity ${value}`}>
        {value}
      </output>
      <button type="button" className="qty-btn" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Increase quantity">
        <Icon name="plus" size={18} />
      </button>
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  hideLabel = false,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hideLabel?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="switch">
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch-track" aria-hidden="true" />
      <span className={hideLabel ? 'visually-hidden' : 'switch-label'}>{label}</span>
    </label>
  );
}
