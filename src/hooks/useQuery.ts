import { useEffect, useState, useSyncExternalStore } from 'react';
import { getVersion, subscribe } from '../services/demoStore';

/**
 * Runs an async loader and re-runs it whenever the demo data changes (this tab
 * or another tab). With a real API this becomes a normal fetch + polling/websocket.
 */
export function useQuery<T>(loader: () => Promise<T>, deps: unknown[] = [], initialData?: T) {
  const version = useSyncExternalStore(subscribe, getVersion, getVersion);
  // initialData lets pre-rendered pages show real content immediately (no skeleton / layout shift).
  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    loader()
      .then((d) => {
        if (!alive) return;
        setData(d);
        setError(null);
      })
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : 'Something went wrong.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps]);

  return { data, error, loading: loading && data === undefined };
}
