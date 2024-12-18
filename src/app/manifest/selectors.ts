import { destinyVersionSelector } from 'app/accounts/selectors';
import { RootState } from 'app/store/types';
import { emptyArray } from 'app/utils/empty';
import { useSelector } from 'react-redux';

export const destiny2CoreSettingsSelector = (state: RootState) =>
  state.manifest.destiny2CoreSettings;

export const rankProgressionHashesSelector = (state: RootState) =>
  state.manifest.destiny2CoreSettings?.currentRankProgressionHashes ?? emptyArray<number>();

const d1ManifestSelector = (state: RootState) => state.manifest.d1Manifest;
export const d2ManifestSelector = (state: RootState) => state.manifest.d2Manifest;

export const manifestSelector = (state: RootState) =>
  destinyVersionSelector(state) === 2 ? d2ManifestSelector(state) : d1ManifestSelector(state);

export function useD1Definitions() {
  return useSelector(d1ManifestSelector);
}
export function useD2Definitions() {
  return useSelector(d2ManifestSelector);
}
export function useDefinitions() {
  return useSelector(manifestSelector);
}
