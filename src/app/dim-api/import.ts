import { DimData } from 'app/storage/sync.service';
import { ThunkResult } from 'app/store/types';
import { importData } from './dim-api';
import { loadDimApiData } from './actions';
import { DimApiState, makeProfileKey } from './reducer';
import { profileLoadedFromIDB } from './basic-actions';
import { initialSettingsState } from 'app/settings/initial-settings';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import {
  Loadout,
  DestinyVersion,
  ItemAnnotation,
  ExportResponse,
} from '@destinyitemmanager/dim-api-types';
import { showNotification } from 'app/notifications/notifications';
import { t } from 'app/i18next-t';
import { observeStore } from 'app/utils/redux-utils';
import _ from 'lodash';

/**
 * Import data (either legacy-format from SyncService or the new DIM Sync export) into DIM Sync.
 * This is from a user clicking "Import" and will always overwrite the data saved locally or on the server.
 */
export function importDataBackup(data: DimData | ExportResponse, silent = false): ThunkResult {
  return async (dispatch, getState) => {
    const dimApiData = getState().dimApi;

    if (
      dimApiData.globalSettings.dimApiEnabled &&
      dimApiData.apiPermissionGranted &&
      !dimApiData.profileLoaded
    ) {
      await waitForProfileLoad();
    }

    if (dimApiData.globalSettings.dimApiEnabled && dimApiData.apiPermissionGranted) {
      try {
        console.log('[importLegacyData] Attempting to import legacy data into DIM API');
        const result = await importData(data);
        console.log('[importLegacyData] Successfully imported legacy data into DIM API', result);
        showImportSuccessNotification(result, true);

        // Reload from the server
        return dispatch(loadDimApiData(true));
      } catch (e) {
        if (!silent) {
          console.error('[importLegacyData] Error importing legacy data into DIM API', e);
          showImportFailedNotification(e);
        }
        return;
      }
    } else {
      // Import directly into local state, since the user doesn't want to use DIM Sync
      const settings = data.settings || data['settings-v1.0'];
      const loadouts = extractLoadouts(data);
      const tags = extractItemAnnotations(data);
      const triumphs: ExportResponse['triumphs'] = data.triumphs || [];
      const itemHashTags: ExportResponse['itemHashTags'] = data.itemHashTags || [];
      const importedSearches: ExportResponse['searches'] = data.searches || [];

      if (!loadouts.length && !tags.length) {
        if (!silent) {
          console.error(
            '[importLegacyData] Error importing legacy data into DIM API - no data',
            data
          );
          showImportFailedNotification(new Error(t('Storage.ImportNotification.NoData')));
        }
        return;
      }

      const profiles: DimApiState['profiles'] = {};

      for (const platformLoadout of loadouts) {
        const { platformMembershipId, destinyVersion, ...loadout } = platformLoadout;
        if (platformMembershipId && destinyVersion) {
          const key = makeProfileKey(platformMembershipId, destinyVersion);
          if (!profiles[key]) {
            profiles[key] = {
              loadouts: {},
              tags: {},
              triumphs: [],
            };
          }
          profiles[key].loadouts[loadout.id] = loadout;
        }
      }
      for (const platformTag of tags) {
        const { platformMembershipId, destinyVersion, ...tag } = platformTag;
        if (platformMembershipId && destinyVersion) {
          const key = makeProfileKey(platformMembershipId, destinyVersion);
          if (!profiles[key]) {
            profiles[key] = {
              loadouts: {},
              tags: {},
              triumphs: [],
            };
          }
          profiles[key].tags[tag.id] = tag;
        }
      }

      for (const triumphData of triumphs) {
        const { platformMembershipId, triumphs } = triumphData;
        if (platformMembershipId) {
          const key = makeProfileKey(platformMembershipId, 2);
          if (!profiles[key]) {
            profiles[key] = {
              loadouts: {},
              tags: {},
              triumphs: [],
            };
          }
          profiles[key].triumphs = triumphs;
        }
      }

      const searches: DimApiState['searches'] = {
        1: [],
        2: [],
      };
      for (const search of importedSearches) {
        searches[search.destinyVersion].push(search.search);
      }

      dispatch(
        profileLoadedFromIDB({
          settings: { ...initialSettingsState, ...settings },
          profiles,
          itemHashTags: _.keyBy(itemHashTags, (t) => t.hash),
          searches,
          updateQueue: [],
        })
      );
      showImportSuccessNotification(
        {
          loadouts: loadouts.length,
          tags: tags.length,
        },
        false
      );
    }
  };
}

/** Returns a promise that resolves when the profile is fully loaded. */
function waitForProfileLoad() {
  return new Promise((resolve) => {
    const unsubscribe = observeStore(
      (state) => state.dimApi.profileLoaded,
      (_, loaded) => {
        if (loaded) {
          unsubscribe();
          resolve();
        }
      }
    );
  });
}

function showImportSuccessNotification(
  result: { loadouts: number; tags: number },
  dimSync: boolean
) {
  showNotification({
    type: 'success',
    title: t('Storage.ImportNotification.SuccessTitle'),
    body: dimSync
      ? t('Storage.ImportNotification.SuccessBodyForced', result)
      : t('Storage.ImportNotification.SuccessBodyLocal', result),
    duration: 15000,
  });
}

function showImportFailedNotification(e: Error) {
  showNotification({
    type: 'error',
    title: t('Storage.ImportNotification.FailedTitle'),
    body: t('Storage.ImportNotification.FailedBody', { error: e.message }),
    duration: 15000,
  });
}

/** This is the enum loadouts have been stored with - it does not align with DestinyClass */
const enum LoadoutClass {
  any = -1,
  warlock = 0,
  titan = 1,
  hunter = 2,
}

const loadoutClassToClassType = {
  [LoadoutClass.warlock]: DestinyClass.Warlock,
  [LoadoutClass.titan]: DestinyClass.Titan,
  [LoadoutClass.hunter]: DestinyClass.Hunter,
  [LoadoutClass.any]: DestinyClass.Unknown,
};

type PlatformLoadout = Loadout & {
  platformMembershipId: string;
  destinyVersion: DestinyVersion;
};

/**
 * Extract loadouts in DIM API format from the legacy DimData or a new DIM Sync export.
 */
function extractLoadouts(importData: DimData): PlatformLoadout[] {
  if (importData.loadouts) {
    return importData.loadouts.map((l) => ({
      ...l.loadout,
      platformMembershipId: l.platformMembershipId,
      destinyVersion: l.destinyVersion,
    }));
  }

  const ids = importData['loadouts-v3.0'];
  if (!ids) {
    return [];
  }
  return ids
    .map((id) => importData[id])
    .filter(Boolean)
    .map((rawLoadout) => ({
      platformMembershipId: rawLoadout.membershipId,
      destinyVersion: rawLoadout.destinyVersion,
      id: rawLoadout.id,
      name: rawLoadout.name,
      classType:
        loadoutClassToClassType[rawLoadout.classType === undefined ? -1 : rawLoadout.classType],
      clearSpace: rawLoadout.clearSpace || false,
      equipped: rawLoadout.items
        .filter((i) => i.equipped)
        .map((item) => ({ id: item.id, hash: item.hash, amount: item.amount })),
      unequipped: rawLoadout.items
        .filter((i) => !i.equipped)
        .map((item) => ({ id: item.id, hash: item.hash, amount: item.amount })),
    }));
}

type PlatformItemAnnotation = ItemAnnotation & {
  platformMembershipId: string;
  destinyVersion: DestinyVersion;
};

/**
 * Extract tags/notes in DIM API format from the legacy DimData or a new DIM Sync export.
 */
function extractItemAnnotations(importData: DimData): PlatformItemAnnotation[] {
  if (importData.tags) {
    return importData.tags.map((t) => ({
      ...t.annotation,
      platformMembershipId: t.platformMembershipId,
      destinyVersion: t.destinyVersion,
    }));
  }

  const annotations: PlatformItemAnnotation[] = [];
  for (const key in importData) {
    const match = /dimItemInfo-m(\d+)-d(1|2)/.exec(key);
    if (match) {
      const platformMembershipId = match[1];
      const destinyVersion = parseInt(match[2], 10) as DestinyVersion;
      for (const id in importData[key]) {
        const value = importData[key][id];
        annotations.push({
          platformMembershipId,
          destinyVersion,
          id,
          tag: value.tag,
          notes: value.notes,
        });
      }
    }
  }
  return annotations;
}
