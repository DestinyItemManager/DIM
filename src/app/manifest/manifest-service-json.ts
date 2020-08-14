import _ from 'lodash';
import { get, set, del } from 'idb-keyval';

import { reportException } from '../utils/exceptions';
import { getManifest as d2GetManifest } from '../bungie-api/destiny2-api';
import { settingsReady } from '../settings/settings';
import { t } from 'app/i18next-t';
import { DestinyInventoryItemDefinition } from 'bungie-api-ts/destiny2';
import { deepEqual } from 'fast-equals';
import { showNotification } from '../notifications/notifications';
import { settingsSelector } from 'app/settings/reducer';
import { emptyObject, emptyArray } from 'app/utils/empty';
import { loadingStart, loadingEnd } from 'app/shell/actions';
import { SUBCLASS_BUCKET } from 'app/search/d2-known-values';
import { ThunkResult } from 'app/store/types';
import { dedupePromise } from 'app/utils/util';
import memoizeOne from 'memoize-one';

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

      def.action! = emptyObject();
      def.backgroundColor = emptyObject();
      def.translationBlock! = emptyObject();
      if (def.equippingBlock?.displayStrings?.length) {
        def.equippingBlock.displayStrings = emptyArray();
      }
      if (def.preview?.derivedItemCategories?.length) {
        def.preview.derivedItemCategories = emptyArray();
      }
      if (def.inventory!.bucketTypeHash !== SUBCLASS_BUCKET) {
        def.talentGrid! = emptyObject();
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

const getManifestAction = memoizeOne(
  (tableAllowList): ThunkResult<object> =>
    dedupePromise((dispatch) => dispatch(doGetManifest(tableAllowList)))
);

export function getManifest(tableAllowList: string[]): ThunkResult<object> {
  return getManifestAction(tableAllowList);
}

// This is not an anonymous arrow function inside getManifest because of https://bugs.webkit.org/show_bug.cgi?id=166879
function doGetManifest(tableAllowList: string[]): ThunkResult<object> {
  return async (dispatch) => {
    dispatch(loadingStart(t('Manifest.Load')));
    try {
      console.time('Load manifest');
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
      console.error('Manifest loading error', { error: e }, e);
      reportException('manifest load', e);
      const error = new Error(statusText);
      error.name = 'ManifestError';
      throw error;
    } finally {
      dispatch(loadingEnd(t('Manifest.Load')));
      console.timeEnd('Load manifest');
    }
  };
}

function loadManifest(tableAllowList: string[]): ThunkResult<any> {
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
        return loadManifestFromCache(version, tableAllowList);
      } else {
        throw e;
      }
    }

    try {
      return await loadManifestFromCache(version, tableAllowList);
    } catch (e) {
      return dispatch(loadManifestRemote(version, components, tableAllowList));
    }
  };
}

/**
 * Returns a promise for the manifest data as a Uint8Array. Will cache it on succcess.
 */
function loadManifestRemote(
  version: string,
  components: {
    [key: string]: string;
  },
  tableAllowList: string[]
): ThunkResult<object> {
  return async (dispatch) => {
    dispatch(loadingStart(t('Manifest.Download')));
    try {
      const manifest = {};
      // Adding a cache buster to work around bad cached CloudFlare data: https://github.com/DestinyItemManager/DIM/issues/5101
      // try canonical component URL which should likely be already cached,
      // then fall back to appending "?dim" then "?dim-[random numbers]",
      // in case cloudflare has inappropriately cached another domain's CORS headers or a 404 that's no longer a 404
      const cacheBusterStrings = [
        '',
        '?dim',
        `?dim-${Math.random().toString().split('.')[1] ?? 'dimCacheBust'}`,
      ];
      const futures = tableAllowList
        .map((t) => `Destiny${t}Definition`)
        .map(async (table) => {
          let response: Response | null = null;
          let error: any = null;

          for (const query of cacheBusterStrings) {
            try {
              response = await fetch(`https://www.bungie.net${components[table]}${query}`);
              if (response.ok) {
                break;
              }
              error = error ?? response;
            } catch (e) {
              error = error ?? e;
            }
          }
          const body = await (response?.ok ? response.json() : Promise.reject(error));
          manifest[table] = tableTrimmers[table] ? tableTrimmers[table](body) : body;
        });

      await Promise.all(futures);

      // We intentionally don't wait on this promise
      saveManifestToIndexedDB(manifest, version, tableAllowList);
      return manifest;
    } finally {
      dispatch(loadingEnd(t('Manifest.Download')));
    }
  };
}

// This is not an anonymous arrow function inside loadManifestRemote because of https://bugs.webkit.org/show_bug.cgi?id=166879
async function saveManifestToIndexedDB(
  typedArray: object,
  version: string,
  tableAllowList: string[]
) {
  try {
    await set(idbKey, typedArray);
    console.log(`Sucessfully stored manifest file.`);
    localStorage.setItem(localStorageKey, version);
    localStorage.setItem(localStorageKey + '-whitelist', JSON.stringify(tableAllowList));
  } catch (e) {
    console.error('Error saving manifest file', e);
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
async function loadManifestFromCache(version: string, tableAllowList: string[]): Promise<object> {
  if (alwaysLoadRemote) {
    throw new Error('Testing - always load remote');
  }

  const currentManifestVersion = localStorage.getItem(localStorageKey);
  const currentAllowList = JSON.parse(localStorage.getItem(localStorageKey + '-whitelist') || '[]');
  if (currentManifestVersion === version && deepEqual(currentAllowList, tableAllowList)) {
    const manifest = await get<object>(idbKey);
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
