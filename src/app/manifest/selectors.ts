import { RootState } from 'app/store/types';

export const destiny2CoreSettingsSelector = (state: RootState) =>
  state.manifest.destiny2CoreSettings;
