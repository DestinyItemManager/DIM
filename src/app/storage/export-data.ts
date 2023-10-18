import { DestinyVersion, ExportResponse } from '@destinyitemmanager/dim-api-types';
import { parseProfileKey } from 'app/dim-api/reducer';
import { ThunkResult } from 'app/store/types';
import { download } from 'app/utils/download';

/**
 * Export the local IDB data to a format the DIM API could import.
 */
export function exportLocalData(): ThunkResult<ExportResponse> {
  return async (_dispatch, getState) => {
    const dimApiState = getState().dimApi;
    const exportResponse: ExportResponse = {
      settings: dimApiState.settings,
      loadouts: [],
      tags: [],
      triumphs: [],
      itemHashTags: [],
      searches: [],
    };

    for (const profileKey in dimApiState.profiles) {
      if (Object.prototype.hasOwnProperty.call(dimApiState.profiles, profileKey)) {
        const [platformMembershipId, destinyVersion] = parseProfileKey(profileKey);

        for (const loadout of Object.values(dimApiState.profiles[profileKey].loadouts)) {
          exportResponse.loadouts.push({
            loadout,
            platformMembershipId,
            destinyVersion,
          });
        }
        for (const annotation of Object.values(dimApiState.profiles[profileKey].tags)) {
          exportResponse.tags.push({
            annotation,
            platformMembershipId,
            destinyVersion,
          });
        }

        exportResponse.triumphs.push({
          platformMembershipId,
          triumphs: dimApiState.profiles[profileKey].triumphs,
        });
      }
    }

    exportResponse.itemHashTags = Object.values(dimApiState.itemHashTags);

    for (const destinyVersionStr in dimApiState.searches) {
      const destinyVersion = parseInt(destinyVersionStr, 10) as DestinyVersion;
      for (const search of dimApiState.searches[destinyVersion]) {
        exportResponse.searches.push({
          destinyVersion,
          search,
        });
      }
    }

    return exportResponse;
  };
}

/**
 * Export the data backup as a file
 */
export function exportBackupData(data: ExportResponse) {
  download(JSON.stringify(data), 'dim-data.json', 'application/json');
}
