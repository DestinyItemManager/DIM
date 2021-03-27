import { RootState } from 'app/store/types';

export const isPhonePortraitSelector = (state: RootState) => state.shell.isPhonePortrait;
export const querySelector = (state: RootState) => state.shell.searchQuery;
export const searchQueryVersionSelector = (state: RootState) => state.shell.searchQueryVersion;
export const bungieAlertsSelector = (state: RootState) => state.shell.bungieAlerts;
