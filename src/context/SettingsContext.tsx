import { createContext, useContext, type ReactNode } from 'react';
import type { ShopSettings } from '../types';
import { DEFAULT_SETTINGS } from '../config/shop';
import { getSettings } from '../services/api';
import { useQuery } from '../hooks/useQuery';

const SettingsContext = createContext<ShopSettings>(DEFAULT_SETTINGS);

/** Starts with the defaults (no flash), then uses the saved settings from the service. */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery(getSettings);
  return <SettingsContext.Provider value={data ?? DEFAULT_SETTINGS}>{children}</SettingsContext.Provider>;
}

export function useSettings(): ShopSettings {
  return useContext(SettingsContext);
}
