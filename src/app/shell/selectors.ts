import { RootState } from 'app/store/types';
import { useSelector } from 'react-redux';

export const isPhonePortraitSelector = (state: RootState) => state.shell.isPhonePortrait;
export const querySelector = (state: RootState) => state.shell.searchQuery;
export const hasSearchQuerySelector = (state: RootState) => Boolean(state.shell.searchQuery);
export const searchQueryVersionSelector = (state: RootState) => state.shell.searchQueryVersion;
export const bungieAlertsSelector = (state: RootState) => state.shell.bungieAlerts;
export const searchResultsOpenSelector = (state: RootState) => state.shell.searchResultsOpen;
export const routerLocationSelector = (state: RootState) => state.shell.routerLocation;

export function useIsPhonePortrait() {
  return useSelector(isPhonePortraitSelector);
}
