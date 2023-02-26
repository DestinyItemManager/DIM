import {
  CustomStatDef,
  CustomStatWeights,
  defaultLoadoutParameters,
  DestinyVersion,
} from '@destinyitemmanager/dim-api-types';
import { DestinyAccount } from 'app/accounts/destiny-account';
import { currentAccountSelector, destinyVersionSelector } from 'app/accounts/selectors';
import { t } from 'app/i18next-t';
import { CUSTOM_TOTAL_STAT_HASH } from 'app/search/d2-known-values';
import { Settings } from 'app/settings/initial-settings';
import { RootState } from 'app/store/types';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { createSelector } from 'reselect';

export function makeProfileKeyFromAccount(account: DestinyAccount) {
  return makeProfileKey(account.membershipId, account.destinyVersion);
}
export function makeProfileKey(platformMembershipId: string, destinyVersion: DestinyVersion) {
  return `${platformMembershipId}-d${destinyVersion}`;
}

export const settingsSelector = (state: RootState) => state.dimApi.settings;

/** A selector for a particular setting by property name */
export const settingSelector =
  <K extends keyof Settings>(key: K) =>
  (state: RootState) =>
    state.dimApi.settings[key];

/**
 * The last used Loadout Optimizer settings, with defaults filled in
 */
export const savedLoadoutParametersSelector = createSelector(
  (state: RootState) => settingsSelector(state).loParameters,
  (loParams) => ({ ...defaultLoadoutParameters, ...loParams })
);

export const savedLoStatConstraintsByClassSelector = (state: RootState) =>
  settingsSelector(state).loStatConstraintsByClass;

export const languageSelector = (state: RootState) => settingsSelector(state).language;

export const collapsedSelector =
  (sectionId: string) =>
  (state: RootState): boolean | undefined =>
    settingsSelector(state).collapsedSections[sectionId];

export const oldCustomTotalSelector = (state: RootState) =>
  settingsSelector(state).customTotalStatsByClass;

export const newCustomStatsSelector = (state: RootState) => settingsSelector(state).customStats;

// converts any old stats stored in the old setting, to the new format
export const normalizedCustomStatsSelector = (state: RootState) => {
  const oldCustomStats = oldCustomTotalSelector(state);
  const convertedOldStats: CustomStatDef[] = [];

  for (const classEnumString in oldCustomStats) {
    const classEnum: DestinyClass = parseInt(classEnumString);
    const statHashList = oldCustomStats[classEnum];

    if (classEnum !== DestinyClass.Unknown && statHashList?.length > 0) {
      const weights: CustomStatWeights = {};
      for (const statHash of statHashList) {
        weights[statHash] = 1;
      }
      convertedOldStats.push({
        label: t('Stats.Custom'),
        shortLabel: 'custom',
        class: classEnum,
        weights,
        // converted old stats get special permission to use stat hashes higher than CUSTOM_TOTAL_STAT_HASH
        // other are decremented from CUSTOM_TOTAL_STAT_HASH
        statHash: CUSTOM_TOTAL_STAT_HASH + 1 + classEnum,
      });
    }
  }
  return [...convertedOldStats, ...newCustomStatsSelector(state)];
};

export const apiPermissionGrantedSelector = (state: RootState) =>
  state.dimApi.apiPermissionGranted === true;

export const dimSyncErrorSelector = (state: RootState) => state.dimApi.profileLoadedError;

export const updateQueueLengthSelector = (state: RootState) => state.dimApi.updateQueue.length;

/**
 * Return saved API data for the currently active profile (account).
 */
export const currentProfileSelector = createSelector(
  currentAccountSelector,
  (state: RootState) => state.dimApi.profiles,
  (currentAccount, profiles) =>
    currentAccount ? profiles[makeProfileKeyFromAccount(currentAccount)] : undefined
);

/**
 * Returns all recent/saved searches.
 *
 * TODO: Sort/trim this list
 */
export const recentSearchesSelector = (state: RootState) =>
  state.dimApi.searches[destinyVersionSelector(state)];

export const trackedTriumphsSelector = createSelector(
  currentProfileSelector,
  (profile) => profile?.triumphs || []
);
