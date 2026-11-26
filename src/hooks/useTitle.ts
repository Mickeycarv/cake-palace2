import { useEffect } from 'react';
import { DEFAULT_SEO, NOINDEX_PREFIXES, seoFor } from '../config/seo';

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

function robotsFor(pathname: string) {
  const hidden = NOINDEX_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  return hidden ? 'noindex, follow' : 'index, follow';
}

/** Marketing pages: title + description from src/config/seo.ts. */
export function useSeo(path: string) {
  useEffect(() => {
    const s = seoFor(path) ?? DEFAULT_SEO;
    document.title = s.title;
    setMeta('description', s.description);
    setMeta('robots', robotsFor(path));
  }, [path]);
}

/** Other pages: "<title> · Cake Palace" with the default description. */
export function useTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · Cake Palace – Bakery in Hyderabad` : DEFAULT_SEO.title;
    setMeta('description', DEFAULT_SEO.description);
    setMeta('robots', robotsFor(window.location.pathname));
  }, [title]);
}
