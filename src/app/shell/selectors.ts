import { RootState } from 'app/store/types';
import { useSyncExternalStore } from 'react';

export const isPhonePortraitSelector = (state: RootState) => state.shell.isPhonePortrait;
export const querySelector = (state: RootState) => state.shell.searchQuery;
export const hasSearchQuerySelector = (state: RootState) => Boolean(state.shell.searchQuery);
export const searchQueryVersionSelector = (state: RootState) => state.shell.searchQueryVersion;
export const bungieAlertsSelector = (state: RootState) => state.shell.bungieAlerts;
export const searchResultsOpenSelector = (state: RootState) => state.shell.searchResultsOpen;
export const routerLocationSelector = (state: RootState) => state.shell.routerLocation;

export function useMediaQuery(query: string) {
  const mql = window.matchMedia(query);
  return useSyncExternalStore(
    (onStoreChange) => {
      mql.addEventListener('change', onStoreChange);
      return () => mql.removeEventListener('change', onStoreChange);
    },
    () => mql.matches,
  );
}

export function useIsPhonePortrait() {
  return useMediaQuery('(max-width: 540px)');
}
