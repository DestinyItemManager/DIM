/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable no-console */
/* eslint-disable no-alert */
import type { DestinyVersion, ExportResponse } from '@destinyitemmanager/dim-api-types';
import type { DimApiState } from 'app/dim-api/reducer';

let exportData: ExportResponse;

function parseProfileKey(profileKey: string): [string, DestinyVersion] {
  const match = profileKey.match(/(\d+)-d(1|2)/);
  if (!match) {
    throw new Error("Profile key didn't match expected format");
  }
  return [match[1], parseInt(match[2], 10) as DestinyVersion];
}

const connection = indexedDB.open('keyval-store');
connection.onerror = (event) => {
  console.log((event.target as any)?.result);
  alert((event.target as any)?.result);
};
connection.onsuccess = (event) => {
  ((event.target as any).result as IDBDatabase)
    .transaction('keyval')
    .objectStore('keyval')
    .get('dim-api-profile').onsuccess = (event) => {
    const storedData = (event.target as any)?.result as DimApiState;
    if (storedData?.settings) {
      exportData = {
        settings: storedData.settings,
        loadouts: [],
        tags: [],
        triumphs: [],
        itemHashTags: [],
        searches: [],
      };

      if (storedData.profiles) {
        for (const profileKey in storedData.profiles) {
          if (Object.prototype.hasOwnProperty.call(storedData.profiles, profileKey)) {
            const [platformMembershipId, destinyVersion] = parseProfileKey(profileKey);

            for (const loadout of Object.values(storedData.profiles[profileKey].loadouts)) {
              exportData.loadouts.push({
                loadout,
                platformMembershipId,
                destinyVersion,
              });
            }
            for (const annotation of Object.values(storedData.profiles[profileKey].tags)) {
              exportData.tags.push({
                annotation,
                platformMembershipId,
                destinyVersion,
              });
            }

            exportData.triumphs.push({
              platformMembershipId,
              triumphs: storedData.profiles[profileKey].triumphs,
            });
          }
        }
      }

      if (storedData.itemHashTags) {
        exportData.itemHashTags = Object.values(storedData.itemHashTags);
      }

      if (storedData.searches) {
        for (const destinyVersionStr in storedData.searches) {
          const destinyVersion = parseInt(destinyVersionStr, 10) as DestinyVersion;
          for (const search of storedData.searches[destinyVersion]) {
            exportData.searches.push({
              destinyVersion,
              search,
            });
          }
        }
      }

      const profileTimestamps = storedData.profiles
        ? (Object.values(storedData.profiles)
            .map((p) => p.profileLastLoaded || null)
            .filter(Boolean) as number[])
        : null;

      const searchTimestamps = exportData.searches
        .map((s) => s?.search?.lastUsage || null)
        .filter(Boolean) as number[];

      const loadoutTimestamps = exportData.loadouts
        .map((l) => l?.loadout?.lastUpdatedAt || null)
        .filter(Boolean) as number[];

      document.getElementById('feedback')!.textContent =
        `Stored DIM data was found in the browser's storage.
It looks like it was last downloaded from DIM Sync ${stringifyLatestDate(profileTimestamps)}.
It appears to contain:
- ${Object.keys(exportData.settings ?? {}).length} settings
- ${exportData.loadouts.length} loadouts, last updated ${stringifyLatestDate(loadoutTimestamps)}
- ${exportData.tags.length} specific item tags/notes
- ${exportData.triumphs.length} tracked triumphs
- ${exportData.itemHashTags.length} item type tags/notes
- ${exportData.searches.length} searches, last used ${stringifyLatestDate(searchTimestamps)}`;
    }
  };
};

function stringifyLatestDate(datestamps: number[] | null) {
  return datestamps?.length ? new Date(Math.max(...datestamps)).toLocaleString() : '[unknown date]';
}

function downloadBackup() {
  const stringified = encodeURIComponent(JSON.stringify(exportData));
  const a = document.createElement('a');
  a.setAttribute('href', `data:application/json;charset=utf-8,${stringified}`);
  a.setAttribute('download', 'dim-data-emergency-backup.json');
  document.body.appendChild(a);
  a.click();
}

document.getElementById('download')?.addEventListener('click', downloadBackup);
