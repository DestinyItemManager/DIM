import {
  DestinyVersion,
  ExportResponse,
  ItemAnnotation,
  Loadout,
} from '@destinyitemmanager/dim-api-types';
import { t } from 'app/i18next-t';
import { showNotification } from 'app/notifications/notifications';
import { initialSettingsState } from 'app/settings/initial-settings';
import { ThunkResult } from 'app/store/types';
import { errorLog, infoLog } from 'app/utils/log';
import { observeStore } from 'app/utils/redux-utils';
import _ from 'lodash';
import { loadDimApiData } from './actions';
import { profileLoadedFromIDB } from './basic-actions';
import { importData } from './dim-api';
import type { DimApiState } from './reducer';
import { makeProfileKey } from './selectors';

/**
 * Import data in the DIM Sync export format into DIM Sync or local storage.
 * This is from a user clicking "Import" and will always overwrite the data saved locally or on the server.
 */
export function importDataBackup(data: ExportResponse, silent = false): ThunkResult {
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
        infoLog('importLegacyData', 'Attempting to import legacy data into DIM API');
        const result = await importData(data);
        infoLog('importLegacyData', 'Successfully imported legacy data into DIM API', result);
        showImportSuccessNotification(result, true);

        // Reload from the server
        return await dispatch(loadDimApiData(true));
      } catch (e) {
        if (!silent) {
          errorLog('importLegacyData', 'Error importing legacy data into DIM API', e);
          showImportFailedNotification(e);
        }
        return;
      }
    } else {
      // Import directly into local state, since the user doesn't want to use DIM Sync
      const settings = data.settings;
      const loadouts = extractLoadouts(data);
      const tags = extractItemAnnotations(data);
      const triumphs: ExportResponse['triumphs'] = data.triumphs || [];
      const itemHashTags: ExportResponse['itemHashTags'] = data.itemHashTags || [];
      const importedSearches: ExportResponse['searches'] = data.searches || [];

      if (!loadouts.length && !tags.length) {
        if (!silent) {
          errorLog(
            'importLegacyData',
            'Error importing legacy data into DIM - no data found in import file. (no settings upgrade/API upload attempted. DIM Sync is turned off)',
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
              profileLastLoaded: 0,
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
              profileLastLoaded: 0,
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
              profileLastLoaded: 0,
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
      (_prev, loaded) => {
        if (loaded) {
          unsubscribe();
          resolve(undefined);
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

type PlatformLoadout = Loadout & {
  platformMembershipId: string;
  destinyVersion: DestinyVersion;
};

/**
 * Extract loadouts in DIM API format from an export.
 */
function extractLoadouts(importData: ExportResponse): PlatformLoadout[] {
  if (importData.loadouts) {
    return importData.loadouts.map((l) => ({
      ...l.loadout,
      platformMembershipId: l.platformMembershipId,
      destinyVersion: l.destinyVersion,
    }));
  }
  return [];
}

type PlatformItemAnnotation = ItemAnnotation & {
  platformMembershipId: string;
  destinyVersion: DestinyVersion;
};

/**
 * Extract tags/notes in DIM API format from an export.
 */
function extractItemAnnotations(importData: ExportResponse): PlatformItemAnnotation[] {
  if (importData.tags) {
    return importData.tags.map((t) => ({
      ...t.annotation,
      platformMembershipId: t.platformMembershipId,
      destinyVersion: t.destinyVersion,
    }));
  }
  return [];
}
