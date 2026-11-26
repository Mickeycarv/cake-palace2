import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/**
 * false while rendering on the server and during hydration, true afterwards.
 * Use it for anything that depends on the browser (localStorage, today's date,
 * the URL query) so pre-rendered HTML and the first browser render match.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
