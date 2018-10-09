import copy from 'fast-copy';
import { deepEqual } from 'fast-equals';
import * as _ from 'lodash';
import { reportException } from '../exceptions';
import { IndexedDBStorage } from './indexed-db-storage';
import { GoogleDriveStorage } from './google-drive-storage';
import { BungieMembershipType } from 'bungie-api-ts/user';
import { initSettings } from '../settings/settings';
import { percent } from '../inventory/dimPercentWidth.directive';
import { humanBytes } from './human-bytes';

export interface DimData {
  platformType?: BungieMembershipType;
  destinyVersion?: 1 | 2;
  // membership IDs of ignored DTR reviewers
  ignoredUsers?: string[];
  // loadout ids
  'loadouts-v3.0'?: string[];
  'settings-v1.0'?: any; // settings

  // dimItemInfo-${account.platformType}
  // [`info.${id}`]
  [key: string]: any;
}

export interface StorageAdapter {
  readonly supported: boolean;
  readonly name: string;
  enabled: boolean;

  get(): Promise<DimData>;
  set(value: object): Promise<void>;
}

/**
 * The sync service allows us to save a single object to persistent
 * storage - potentially using multiple different storage
 * systems. Each system is a separate adapter that can be enabled or
 * disabled.
 */

// Request persistent storage.
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((persistent) => {
    if (persistent) {
      console.log('Sync: Storage will not be cleared except by explicit user action.');
    } else {
      console.log('Sync: Storage may be cleared under storage pressure.');
    }
  });
}
if ('storage' in navigator && 'estimate' in navigator.storage) {
  navigator.storage.estimate().then(({ usage, quota }) => {
    console.log(
      `Sync: DIM is using ${humanBytes(usage)} total out of ${humanBytes(
        quota
      )} in storage quota (${percent(usage / quota)}).`
    );
  });
}

const GoogleDriveStorageAdapter = new GoogleDriveStorage();
const adapters: StorageAdapter[] = [new IndexedDBStorage(), GoogleDriveStorageAdapter].filter(
  (a) => a.supported
);

// A cache for while we're already in the middle of loading
let _getPromise: Promise<DimData> | undefined;
let cached: DimData;

export const SyncService = {
  adapters,
  GoogleDriveStorage: GoogleDriveStorageAdapter,

  init() {
    GoogleDriveStorageAdapter.init();

    GoogleDriveStorageAdapter.signIn$.subscribe(() => {
      // Force refresh data
      console.log('GDrive sign in, refreshing data');
      this.get(true).then(initSettings);
    });
  },

  /**
   * Write some key/value pairs to storage. This will write to each
   * adapter in order.
   *
   * @param value an object that will be merged with the saved data object and persisted.
   * @param PUT if this is true, replace all data with value, rather than merging it
   */
  async set(value: Partial<DimData>, PUT = false): Promise<void> {
    if (!cached) {
      throw new Error('Must call get at least once before setting');
    }

    if (!PUT && deepEqual(_.pick(cached, Object.keys(value)), value)) {
      if ($featureFlags.debugSync) {
        console.log(_.pick(cached, Object.keys(value)), value);
        console.log('Skip save, already got it');
      }
      return;
    }

    // use replace to override the data. normally we're doing a PATCH
    if (PUT) {
      // update our data
      cached = copy(value) as DimData;
    } else {
      Object.assign(cached, copy(value));
    }

    for (const adapter of adapters) {
      if (adapter.enabled) {
        if ($featureFlags.debugSync) {
          console.log('setting', adapter.name, cached);
        }
        try {
          await adapter.set(cached);
        } catch (e) {
          console.error('Sync: Error saving to', adapter.name, e);
          reportException('Sync Save', e);
        }
      }
    }
  },

  /**
   * Load all the saved data. This attempts to load from each adapter
   * in reverse order, and returns whatever produces a result first.
   *
   * @param force bypass the in-memory cache.
   */
  // get DIM saved data
  get(force = false): Promise<DimData> {
    // if we already have it and we're not forcing a sync
    if (cached && !force) {
      return Promise.resolve(copy(cached));
    }

    _getPromise = _getPromise || getAndCacheFromAdapters();
    return _getPromise;
  },

  /**
   * Remove one or more keys from storage. It is removed from all adapters.
   *
   * @param keys to delete
   */
  async remove(key: string | string[]): Promise<void> {
    if (!cached) {
      // Nothing to do
      return;
    }

    let deleted = false;
    if (_.isArray(key)) {
      _.each(key, (k) => {
        if (cached[k]) {
          delete cached[k];
          deleted = true;
        }
      });
    } else {
      deleted = Boolean(cached[key]);
      delete cached[key];
    }

    if (!deleted) {
      return;
    }

    for (const adapter of adapters) {
      if (adapter.enabled) {
        await adapter.set(cached);
      }
    }
  }
};

async function getAndCacheFromAdapters(): Promise<DimData> {
  try {
    const value = await getFromAdapters();
    cached = value || {};
    return copy(cached);
  } finally {
    _getPromise = undefined;
  }
}

async function getFromAdapters(): Promise<DimData | undefined> {
  for (const adapter of adapters.slice().reverse()) {
    if (adapter.enabled) {
      if ($featureFlags.debugSync) {
        console.log('getting from ', adapter.name);
      }
      try {
        const value = await adapter.get();

        if (value && !_.isEmpty(value)) {
          if ($featureFlags.debugSync) {
            console.log('got', value, 'from adapter ', adapter.name);
          }
          return value;
        }
      } catch (e) {
        console.error('Sync: Error loading from', adapter.name, e);
        reportException('Sync Load', e);
      }
    } else if ($featureFlags.debugSync) {
      console.log(adapter.name, 'is disabled');
    }
  }
  return undefined;
}
