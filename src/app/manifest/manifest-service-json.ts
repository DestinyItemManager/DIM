import { handleErrors } from 'app/bungie-api/bungie-service-helper';
import { HttpStatusError, toHttpStatusError } from 'app/bungie-api/http-client';
import { settingsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { loadingEnd, loadingStart } from 'app/shell/actions';
import { del, get, keys, set } from 'app/storage/idb-keyval';
import { ThunkResult } from 'app/store/types';
import { DimError } from 'app/utils/dim-error';
import { emptyArray, emptyObject } from 'app/utils/empty';
import { convertToError } from 'app/utils/errors';
import { errorLog, infoLog, timer } from 'app/utils/log';
import { dedupePromise } from 'app/utils/promises';
import { LookupTable } from 'app/utils/util-types';
import {
  AllDestinyManifestComponents,
  DestinyCollectibleDefinition,
  DestinyInventoryItemDefinition,
  DestinyItemActionBlockDefinition,
  DestinyItemTalentGridBlockDefinition,
  DestinyItemTranslationBlockDefinition,
  DestinyManifestComponentName,
  DestinyObjectiveDefinition,
  DestinyRecordDefinition,
} from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { once } from 'es-toolkit';
import { deepEqual } from 'fast-equals';
import { Draft } from 'immer';
import { getManifest as d2GetManifest } from '../bungie-api/destiny2-api';
import { showNotification } from '../notifications/notifications';
import { settingsReady } from '../settings/settings';
import { reportException } from '../utils/sentry';

const TAG = 'manifest';

// This file exports D2ManifestService at the bottom of the
// file (TS wants us to declare classes before using them)!

// TODO: replace this with a redux action!

// Testing flags
const alwaysLoadRemote = false;

/** Functions that can reduce the size of a table after it's downloaded but before it's saved to cache. */
const tableTrimmers: LookupTable<DestinyManifestComponentName, (table: any) => any> = {
  DestinyInventoryItemDefinition: (table: { [hash: number]: DestinyInventoryItemDefinition }) => {
    for (const key in table) {
      const def = table[key] as Draft<DestinyInventoryItemDefinition>;

      // Deleting properties can actually make memory usage go up as V8 replaces some efficient
      // structures from JSON parsing. Only replace objects with empties, and always test with the
      // memory profiler. Don't assume that deleting something makes this smaller.

      def.action = emptyObject<Draft<DestinyItemActionBlockDefinition>>();
      def.backgroundColor = emptyObject();
      def.translationBlock = emptyObject<Draft<DestinyItemTranslationBlockDefinition>>();
      if (def.equippingBlock?.displayStrings?.length) {
        def.equippingBlock.displayStrings = emptyArray();
      }
      if (def.preview) {
        if (def.preview.derivedItemCategories?.length) {
          def.preview.derivedItemCategories = emptyArray();
        }
        def.preview.screenStyle = '';
      }
      if (def.inventory) {
        if (def.inventory.bucketTypeHash !== BucketHashes.Subclass) {
          // The only useful bit about talent grids is for subclass damage types
          def.talentGrid = emptyObject<Draft<DestinyItemTalentGridBlockDefinition>>();
        }
        def.inventory.tierTypeName = '';
      }

      if (def.sockets) {
        def.sockets.intrinsicSockets = emptyArray();
        for (const socket of def.sockets.socketEntries) {
          if (socket.reusablePlugSetHash && socket.reusablePlugItems.length > 0) {
            socket.reusablePlugItems = emptyArray();
          }
        }
      }

      // We never figured out anything to do with icon sequences on items
      if (def.displayProperties.iconSequences) {
        def.displayProperties.iconSequences = emptyArray();
      }

      // We don't use these
      def.tooltipStyle = '';
      def.itemTypeAndTierDisplayName = '';
    }

    return table;
  },
  DestinyObjectiveDefinition: (table: { [hash: number]: DestinyObjectiveDefinition }) => {
    for (const key in table) {
      const def = table[key] as Draft<DestinyObjectiveDefinition>;

      def.stats = emptyObject();
      def.perks = emptyObject();
      // Believe it or not we don't use these
      def.displayProperties.description = '';
      def.displayProperties.name = '';
    }
    return table;
  },
  DestinyCollectibleDefinition: (table: { [hash: number]: DestinyCollectibleDefinition }) => {
    for (const key in table) {
      const def = table[key] as Draft<DestinyCollectibleDefinition>;

      def.acquisitionInfo = emptyObject();
      def.stateInfo = emptyObject();
    }
    return table;
  },
  DestinyRecordDefinition: (table: { [hash: number]: DestinyRecordDefinition }) => {
    for (const key in table) {
      const def = table[key] as Draft<DestinyRecordDefinition>;

      def.requirements = emptyObject();
      def.expirationInfo = emptyObject();
    }
    return table;
  },
};

// Module-local state
const localStorageKey = 'd2-manifest-version';
const idbKey = 'd2-manifest';
let version: string | null = null;

export async function checkForNewManifest() {
  const data = await d2GetManifest();
  // If none of the paths (for any language) matches what we downloaded...
  return version && !Object.values(data.jsonWorldContentPaths).includes(version);
}

type TrimTableName<T extends string> = T extends `Destiny${infer U}Definition` ? U : never;
type TableShortName = TrimTableName<DestinyManifestComponentName>;

const getManifestAction = once(
  (tableAllowList: TableShortName[]): ThunkResult<AllDestinyManifestComponents> =>
    dedupePromise((dispatch) => dispatch(doGetManifest(tableAllowList))),
);

export function getManifest(
  tableAllowList: TableShortName[],
): ThunkResult<AllDestinyManifestComponents> {
  return getManifestAction(tableAllowList);
}

function doGetManifest(
  tableAllowList: TableShortName[],
): ThunkResult<AllDestinyManifestComponents> {
  return async (dispatch) => {
    dispatch(loadingStart(t('Manifest.Load')));
    const stopTimer = timer(TAG, 'Load manifest');
    try {
      const manifest = await dispatch(loadManifest(tableAllowList));
      if (!manifest.DestinyVendorDefinition) {
        throw new Error('Manifest corrupted, please reload');
      }
      return manifest;
    } catch (err) {
      let e = convertToError(err);
      if (e instanceof DimError && e.cause) {
        e = e.cause;
      }
      if (e.cause instanceof TypeError || e.cause instanceof HttpStatusError) {
      } else {
        // Something may be wrong with the manifest
        deleteManifestFile();
      }

      errorLog(TAG, 'Manifest loading error', e);
      reportException('manifest load', e);
      throw new DimError('Manifest.Error', t('Manifest.Error', { error: e.message })).withError(e);
    } finally {
      dispatch(loadingEnd(t('Manifest.Load')));
      stopTimer();
    }
  };
}

function loadManifest(tableAllowList: TableShortName[]): ThunkResult<AllDestinyManifestComponents> {
  return async (dispatch, getState) => {
    let components: {
      [key: string]: string;
    };
    try {
      const data = await d2GetManifest();
      await settingsReady; // wait for settings to be ready
      const language = settingsSelector(getState()).language;
      const path = data.jsonWorldContentPaths[language] || data.jsonWorldContentPaths.en;
      components =
        data.jsonWorldComponentContentPaths[language] || data.jsonWorldComponentContentPaths.en;

      // Use the path as the version, rather than the "version" field, because
      // Bungie can update the manifest file without changing that version.
      version = `v2-${path}`; // the prefix is used to bust the cache if we change the table trimmers
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
      infoLog(TAG, 'Unable to use cached manifest, loading fresh manifest from Bungie.net', e);
      return dispatch(loadManifestRemote(version, components, tableAllowList));
    }
  };
}

/**
 * Downloads the manifest from Bungie.net, caching it in IndexedDB on success.
 */
function loadManifestRemote(
  version: string,
  components: {
    [key: string]: string;
  },
  tableAllowList: TableShortName[],
): ThunkResult<AllDestinyManifestComponents> {
  return async (dispatch) => {
    dispatch(loadingStart(t('Manifest.Download')));
    try {
      let saveError: Error | undefined;
      // Save each table to IndexedDB as it arrives, and wait for those saves,
      // so we never serialize the whole manifest at once and saving doesn't
      // overlap with building stores. Peak memory matters a lot on iOS, where
      // the OS will kill the page (black screen) if we use too much.
      const manifest = await downloadManifestComponents(
        components,
        tableAllowList,
        async (tableShort, records) => {
          try {
            await set(`${idbKey}-${tableShort}`, records);
          } catch (e) {
            saveError ??= convertToError(e);
          }
        },
      );

      if (saveError) {
        errorLog(TAG, 'Error saving manifest file', saveError);
        showNotification({
          title: t('Help.NoStorage'),
          body: t('Help.NoStorageMessage'),
          type: 'error',
        });
      } else {
        await del(idbKey); // the old storage location before per-table
        infoLog(TAG, `Successfully stored manifest file.`);
        localStorage.setItem(localStorageKey, version);
        localStorage.setItem(`${localStorageKey}-whitelist`, JSON.stringify(tableAllowList));
      }
      return manifest;
    } finally {
      dispatch(loadingEnd(t('Manifest.Download')));
    }
  };
}

/**
 * Tables so large that parsing them concurrently with anything else risks
 * running out of memory on iOS Safari. These are loaded one at a time, before
 * the other tables, while the heap is at its smallest.
 */
const hugeTables: TableShortName[] = ['InventoryItem', 'Vendor'];

/** How many of the remaining (smaller) tables to download and parse at once. */
const maxConcurrency = 4;

export async function downloadManifestComponents(
  components: {
    [key: string]: string;
  },
  tableAllowList: TableShortName[],
  /** Called (and awaited) with each table's trimmed contents before the next table is loaded. */
  onTableLoaded?: (
    tableShort: TableShortName,
    records: AllDestinyManifestComponents[DestinyManifestComponentName],
  ) => Promise<void>,
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

  const manifest: Partial<AllDestinyManifestComponents> = {};

  const loadTable = async (tableShort: TableShortName) => {
    const table = `Destiny${tableShort}Definition` as DestinyManifestComponentName;
    let response: Response;
    let error: Error | undefined;
    let body = null;

    for (const query of cacheBusterStrings) {
      try {
        response = await fetch(`https://www.bungie.net${components[table]}${query}`);
        if (response.ok) {
          // Sometimes the file is found, but isn't parseable as JSON
          body =
            (await response.json()) as AllDestinyManifestComponents[DestinyManifestComponentName];
          break;
        }
        error ??= await toHttpStatusError(response);
      } catch (e) {
        error ??= convertToError(e);
      }
    }
    if (!body) {
      handleErrors(error); // throws
    }

    const records = (
      table in tableTrimmers ? tableTrimmers[table]!(body) : body
    ) as AllDestinyManifestComponents[DestinyManifestComponentName];
    (manifest as Record<string, unknown>)[table] = records;
    await onTableLoaded?.(tableShort, records);
  };

  for (const tableShort of hugeTables) {
    if (tableAllowList.includes(tableShort)) {
      await loadTable(tableShort);
    }
  }

  // Load the remaining tables with limited concurrency - parsing them all at
  // once holds too many decoded bodies and parsed tables in memory
  // simultaneously.
  const queue = tableAllowList.filter((t) => !hugeTables.includes(t));
  await Promise.all(
    Array.from({ length: maxConcurrency }, async () => {
      let tableShort: TableShortName | undefined;
      while ((tableShort = queue.shift()) !== undefined) {
        await loadTable(tableShort);
      }
    }),
  );

  return manifest as AllDestinyManifestComponents;
}

async function deleteManifestFile() {
  localStorage.removeItem(localStorageKey);
  await Promise.all(
    (await keys()).map(async (key) => {
      if (typeof key === 'string' && key.startsWith(idbKey)) {
        await del(key);
      }
    }),
  );
}

/**
 * Returns a promise for the cached manifest of the specified
 * version as a Uint8Array, or rejects.
 */
async function loadManifestFromCache(
  version: string,
  tableAllowList: TableShortName[],
): Promise<AllDestinyManifestComponents> {
  if (alwaysLoadRemote) {
    throw new Error('Testing - always load remote');
  }

  const currentManifestVersion = localStorage.getItem(localStorageKey);
  const currentAllowList = JSON.parse(
    localStorage.getItem(`${localStorageKey}-whitelist`) || '[]',
  ) as string[];
  if (currentManifestVersion === version && deepEqual(currentAllowList, tableAllowList)) {
    const manifest = {} as AllDestinyManifestComponents;
    const loadTable = async (t: TableShortName) => {
      const records = await get<Record<number, any>>(`${idbKey}-${t}`);
      const tableName = `Destiny${t}Definition` as DestinyManifestComponentName;
      if (!records) {
        throw new Error(`No cached contents for table ${tableName}`);
      }
      manifest[tableName] = records;
    };
    // Deserialize the huge tables one at a time to limit peak memory, which
    // can get the page killed on iOS. See downloadManifestComponents.
    for (const t of hugeTables) {
      if (tableAllowList.includes(t)) {
        await loadTable(t);
      }
    }
    const queue = tableAllowList.filter((t) => !hugeTables.includes(t));
    await Promise.all(
      Array.from({ length: maxConcurrency }, async () => {
        let t: TableShortName | undefined;
        while ((t = queue.shift()) !== undefined) {
          await loadTable(t);
        }
      }),
    );
    return manifest;
  } else {
    // Delete the existing manifest first, to make space
    await deleteManifestFile();
    throw new Error(`version mismatch: ${version} ${currentManifestVersion}`);
  }
}
