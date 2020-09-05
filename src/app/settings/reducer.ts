import { RootState } from 'app/store/types';

export const settingsSelector = (state: RootState) => state.dimApi.settings;
