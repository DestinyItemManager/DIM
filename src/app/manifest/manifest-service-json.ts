import { settingsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { loadingEnd, loadingStart } from 'app/shell/actions';
import { del, get, set } from 'app/storage/idb-keyval';
import { ThunkResult } from 'app/store/types';
import { emptyArray, emptyObject } from 'app/utils/empty';
import { errorLog, infoLog, timer } from 'app/utils/log';
import { dedupePromise } from 'app/utils/util';
import {
  AllDestinyManifestComponents,
  DestinyInventoryItemDefinition,
  DestinyItemActionBlockDefinition,
  DestinyItemTalentGridBlockDefinition,
  DestinyItemTranslationBlockDefinition,
} from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { deepEqual } from 'fast-equals';
import _ from 'lodash';
import { getManifest as d2GetManifest } from '../bungie-api/destiny2-api';
import { showNotification } from '../notifications/notifications';
import { settingsReady } from '../settings/settings';
import { reportException } from '../utils/exceptions';

// This file exports D2ManifestService at the bottom of the
// file (TS wants us to declare classes before using them)!

// TODO: replace this with a redux action!

// Testing flags
const alwaysLoadRemote = false;

type Mutable<T> = { -readonly [P in keyof T]: Mutable<T[P]> };
/** Functions that can reduce the size of a table after it's downloaded but before it's saved to cache. */
const tableTrimmers = {
  DestinyInventoryItemDefinition(table: { [hash: number]: DestinyInventoryItemDefinition }) {
    for (const key in table) {
      const def = table[key] as Mutable<DestinyInventoryItemDefinition>;

      // Deleting properties can actually make memory usage go up as V8 replaces some efficient
      // structures from JSON parsing. Only replace objects with empties, and always test with the
      // memory profiler. Don't assume that deleting something makes this smaller.

      def.action = emptyObject<Mutable<DestinyItemActionBlockDefinition>>();
      def.backgroundColor = emptyObject();
      def.translationBlock = emptyObject<Mutable<DestinyItemTranslationBlockDefinition>>();
      if (def.equippingBlock?.displayStrings?.length) {
        def.equippingBlock.displayStrings = emptyArray();
      }
      if (def.preview?.derivedItemCategories?.length) {
        def.preview.derivedItemCategories = emptyArray();
      }
      if (def.inventory!.bucketTypeHash !== BucketHashes.Subclass) {
        def.talentGrid = emptyObject<Mutable<DestinyItemTalentGridBlockDefinition>>();
      }

      if (def.sockets) {
        def.sockets.intrinsicSockets = emptyArray();
        for (const socket of def.sockets.socketEntries) {
          if (socket.reusablePlugSetHash && socket.reusablePlugItems.length > 0) {
            socket.reusablePlugItems = emptyArray();
          }
        }
      }
    }

    return table;
  },
};

// Module-local state
const localStorageKey = 'd2-manifest-version';
const idbKey = 'd2-manifest';
let version: string | null = null;

/**
 * This tells users to reload the app. It fires no more
 * often than every 10 seconds, and only warns if the manifest
 * version has actually changed.
 */
export const warnMissingDefinition = _.debounce(
  async () => {
    const data = await d2GetManifest();
    // If none of the paths (for any language) matches what we downloaded...
    if (version && !Object.values(data.jsonWorldContentPaths).includes(version)) {
      // The manifest has updated!
      showNotification({
        type: 'warning',
        title: t('Manifest.Outdated'),
        body: t('Manifest.OutdatedExplanation'),
      });
    }
  },
  10000,
  {
    leading: true,
    trailing: false,
  }
);

const getManifestAction = _.once(
  (tableAllowList: string[]): ThunkResult<AllDestinyManifestComponents> =>
    dedupePromise((dispatch) => dispatch(doGetManifest(tableAllowList)))
);

export function getManifest(tableAllowList: string[]): ThunkResult<AllDestinyManifestComponents> {
  return getManifestAction(tableAllowList);
}

// This is not an anonymous arrow function inside getManifest because of https://bugs.webkit.org/show_bug.cgi?id=166879
function doGetManifest(tableAllowList: string[]): ThunkResult<AllDestinyManifestComponents> {
  return async (dispatch) => {
    dispatch(loadingStart(t('Manifest.Load')));
    const stopTimer = timer('Load manifest');
    try {
      const manifest = await dispatch(loadManifest(tableAllowList));
      if (!manifest.DestinyVendorDefinition) {
        throw new Error('Manifest corrupted, please reload');
      }
      return manifest;
    } catch (e) {
      let message = e.message || e;

      if (e instanceof TypeError || e.status === -1) {
        message = navigator.onLine
          ? t('BungieService.NotConnectedOrBlocked')
          : t('BungieService.NotConnected');
      } else if (e.status === 503 || e.status === 522 /* cloudflare */) {
        message = t('BungieService.Difficulties');
      } else if (e.status < 200 || e.status >= 400) {
        message = t('BungieService.NetworkError', {
          status: e.status,
          statusText: e.statusText,
        });
      } else {
        // Something may be wrong with the manifest
        await deleteManifestFile();
      }

      const statusText = t('Manifest.Error', { error: message });
      errorLog('manifest', 'Manifest loading error', { error: e }, e);
      reportException('manifest load', e);
      const error = new Error(statusText);
      error.name = 'ManifestError';
      throw error;
    } finally {
      dispatch(loadingEnd(t('Manifest.Load')));
      stopTimer();
    }
  };
}

function loadManifest(tableAllowList: string[]): ThunkResult<AllDestinyManifestComponents> {
  return async (dispatch, getState) => {
    let components: {
      [key: string]: string;
    } | null = null;
    try {
      const data = await d2GetManifest();
      await settingsReady; // wait for settings to be ready
      const language = settingsSelector(getState()).language;
      const path = data.jsonWorldContentPaths[language] || data.jsonWorldContentPaths.en;
      components =
        data.jsonWorldComponentContentPaths[language] || data.jsonWorldComponentContentPaths.en;

      // Use the path as the version, rather than the "version" field, because
      // Bungie can update the manifest file without changing that version.
      version = path;
    } catch (e) {
      // If we can't get info about the current manifest, try to just use whatever's already saved.
      version = localStorage.getItem(localStorageKey);
      if (version) {
        return await loadManifestFromCache(version, tableAllowList);
      } else {
        throw e;
      }
    }

    try {
      return await loadManifestFromCache(version, tableAllowList);
    } catch (e) {
      return await dispatch(loadManifestRemote(version, components, tableAllowList));
    }
  };
}

/**
 * Returns a promise for the manifest data as a Uint8Array. Will cache it on success.
 */
function loadManifestRemote(
  version: string,
  components: {
    [key: string]: string;
  },
  tableAllowList: string[]
): ThunkResult<AllDestinyManifestComponents> {
  return async (dispatch) => {
    dispatch(loadingStart(t('Manifest.Download')));
    try {
      const manifest = await downloadManifestComponents(components, tableAllowList);

      // We intentionally don't wait on this promise
      saveManifestToIndexedDB(manifest, version, tableAllowList);
      return manifest;
    } finally {
      dispatch(loadingEnd(t('Manifest.Download')));
    }
  };
}

export async function downloadManifestComponents(
  components: {
    [key: string]: string;
  },
  tableAllowList: string[]
) {
  // Adding a cache buster to work around bad cached CloudFlare data: https://github.com/DestinyItemManager/DIM/issues/5101
  // try canonical component URL which should likely be already cached,
  // then fall back to appending "?dim" then "?dim-[random numbers]",
  // in case cloudflare has inappropriately cached another domain's CORS headers or a 404 that's no longer a 404
  const cacheBusterStrings = [
    '',
    '?dim',
    `?dim-${Math.random().toString().split('.')[1] ?? 'dimCacheBust'}`,
  ];

  const manifest = {};

  // Load the manifest tables we want table-by-table, in parallel. This is
  // faster and downloads less data than the single huge file.
  const futures = tableAllowList
    .map((t) => `Destiny${t}Definition`)
    .map(async (table) => {
      let response: Response | null = null;
      let error = null;
      let body = null;

      for (const query of cacheBusterStrings) {
        try {
          response = await fetch(`https://www.bungie.net${components[table]}${query}`);
          if (response.ok) {
            // Sometimes the file is found, but isn't parseable as JSON
            body = await response.json();
            break;
          }
          error ??= response;
        } catch (e) {
          error ??= e;
        }
      }
      if (!body && error) {
        throw error;
      }
      manifest[table] = tableTrimmers[table] ? tableTrimmers[table](body) : body;
    });

  await Promise.all(futures);

  return manifest as AllDestinyManifestComponents;
}

// This is not an anonymous arrow function inside loadManifestRemote because of https://bugs.webkit.org/show_bug.cgi?id=166879
async function saveManifestToIndexedDB(
  typedArray: object,
  version: string,
  tableAllowList: string[]
) {
  try {
    await set(idbKey, typedArray);
    infoLog('manifest', `Successfully stored manifest file.`);
    localStorage.setItem(localStorageKey, version);
    localStorage.setItem(localStorageKey + '-whitelist', JSON.stringify(tableAllowList));
  } catch (e) {
    errorLog('manifest', 'Error saving manifest file', e);
    showNotification({
      title: t('Help.NoStorage'),
      body: t('Help.NoStorageMessage'),
      type: 'error',
    });
  }
}

function deleteManifestFile() {
  localStorage.removeItem(localStorageKey);
  return del(idbKey);
}

/**
 * Returns a promise for the cached manifest of the specified
 * version as a Uint8Array, or rejects.
 */
async function loadManifestFromCache(
  version: string,
  tableAllowList: string[]
): Promise<AllDestinyManifestComponents> {
  if (alwaysLoadRemote) {
    throw new Error('Testing - always load remote');
  }

  const currentManifestVersion = localStorage.getItem(localStorageKey);
  const currentAllowList = JSON.parse(localStorage.getItem(localStorageKey + '-whitelist') || '[]');
  if (currentManifestVersion === version && deepEqual(currentAllowList, tableAllowList)) {
    const manifest = await get<AllDestinyManifestComponents>(idbKey);
    if (!manifest) {
      await deleteManifestFile();
      throw new Error('Empty cached manifest file');
    }
    return manifest;
  } else {
    // Delete the existing manifest first, to make space
    await deleteManifestFile();
    throw new Error(`version mismatch: ${version} ${currentManifestVersion}`);
  }
}
