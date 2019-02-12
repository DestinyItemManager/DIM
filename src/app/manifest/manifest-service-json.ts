import * as _ from 'lodash';
import { get, set, del } from 'idb-keyval';

import { reportException } from '../exceptions';
import { getManifest as d2GetManifest } from '../bungie-api/destiny2-api';
import { settings, settingsReady } from '../settings/settings';
import { toaster } from '../ngimport-more';
import { t } from 'i18next';
import { DestinyManifest } from 'bungie-api-ts/destiny2';
import '../rx-operators';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';
import { deepEqual } from 'fast-equals';

// This file exports D2ManifestService at the bottom of the
// file (TS wants us to declare classes before using them)!

// Testing flags
const alwaysLoadRemote = false;

export interface ManifestServiceState {
  loaded: boolean;
  error?: Error;
  statusText?: string;
}

class ManifestService {
  version: string | null = null;
  state: ManifestServiceState = {
    loaded: false
  };
  state$ = new BehaviorSubject<ManifestServiceState>(this.state);
  /** A signal for when we've loaded a new remote manifest. */
  newManifest$ = new Subject();

  /**
   * This tells users to reload the extension. It fires no more
   * often than every 10 seconds, and only warns if the manifest
   * version has actually changed.
   */
  warnMissingDefinition = _.debounce(
    // This is not async because of https://bugs.webkit.org/show_bug.cgi?id=166879
    () => {
      this.getManifestApi().then((data) => {
        const language = settings.language;
        const path = data.jsonWorldContentPaths[language] || data.jsonWorldContentPaths.en;

        // The manifest has updated!
        if (path !== this.version) {
          toaster.pop('warning', t('Manifest.Outdated'), t('Manifest.OutdatedExplanation'));
        }
      });
    },
    10000,
    {
      leading: true,
      trailing: false
    }
  );

  private manifestPromise: Promise<object> | null = null;

  constructor(
    readonly localStorageKey: string,
    readonly idbKey: string,
    readonly getManifestApi: () => Promise<DestinyManifest>
  ) {}

  set loaded(loaded: boolean) {
    this.setState({ loaded, error: undefined });
  }

  set statusText(statusText: string) {
    this.setState({ statusText });
  }

  getManifest(tableWhitelist: string[]): Promise<object> {
    if (this.manifestPromise) {
      return this.manifestPromise;
    }

    this.loaded = false;

    this.manifestPromise = this.doGetManifest(tableWhitelist);

    return this.manifestPromise;
  }

  getRecord(db: object, table: string, id: number): object | null {
    if (!db[table]) {
      throw new Error(`Table ${table} does not exist in the manifest`);
    }
    return db[table][id];
  }

  getAllRecords(db: object, table: string): object {
    return db[table];
  }

  // This is not an anonymous arrow function inside getManifest because of https://bugs.webkit.org/show_bug.cgi?id=166879
  private async doGetManifest(tableWhitelist: string[]) {
    try {
      const manifest = await this.loadManifest(tableWhitelist);
      if (!manifest.DestinyVendorDefinition) {
        throw new Error('Manifest corrupted, please reload');
      }
      return manifest;
    } catch (e) {
      let message = e.message || e;
      const statusText = t('Manifest.Error', { error: message });

      if (e instanceof TypeError || e.status === -1) {
        message = navigator.onLine
          ? t('BungieService.NotConnectedOrBlocked')
          : t('BungieService.NotConnected');
      } else if (e.status === 503 || e.status === 522 /* cloudflare */) {
        message = t('BungieService.Difficulties');
      } else if (e.status < 200 || e.status >= 400) {
        message = t('BungieService.NetworkError', {
          status: e.status,
          statusText: e.statusText
        });
      } else {
        // Something may be wrong with the manifest
        this.deleteManifestFile();
      }

      this.manifestPromise = null;
      this.setState({ error: e, statusText });
      console.error('Manifest loading error', { error: e }, e);
      reportException('manifest load', e);
      throw new Error(message);
    }
  }

  private async loadManifest(tableWhitelist: string[]): Promise<any> {
    const data = await this.getManifestApi();
    await settingsReady; // wait for settings to be ready
    const language = settings.language;
    const path = data.jsonWorldContentPaths[language] || data.jsonWorldContentPaths.en;

    // Use the path as the version, rather than the "version" field, because
    // Bungie can update the manifest file without changing that version.
    const version = path;
    this.version = version;

    try {
      return await this.loadManifestFromCache(version, tableWhitelist);
    } catch (e) {
      return this.loadManifestRemote(version, path, tableWhitelist);
    }
  }

  /**
   * Returns a promise for the manifest data as a Uint8Array. Will cache it on succcess.
   */
  private async loadManifestRemote(
    version: string,
    path: string,
    tableWhitelist: string[]
  ): Promise<object> {
    this.statusText = `${t('Manifest.Download')}...`;

    const response = await fetch(`https://www.bungie.net${path}`);
    const body = await (response.ok ? response.json() : Promise.reject(response));
    this.statusText = `${t('Manifest.Build')}...`;

    const manifest = _.pick(body, ...tableWhitelist.map((t) => `Destiny${t}Definition`));

    // We intentionally don't wait on this promise
    this.saveManifestToIndexedDB(manifest, version, tableWhitelist);

    this.newManifest$.next();
    return manifest;
  }

  // This is not an anonymous arrow function inside loadManifestRemote because of https://bugs.webkit.org/show_bug.cgi?id=166879
  private async saveManifestToIndexedDB(
    typedArray: object,
    version: string,
    tableWhitelist: string[]
  ) {
    try {
      await set(this.idbKey, typedArray);
      console.log(`Sucessfully stored manifest file.`);
      localStorage.setItem(this.localStorageKey, version);
      localStorage.setItem(this.localStorageKey + '-whitelist', JSON.stringify(tableWhitelist));
    } catch (e) {
      console.error('Error saving manifest file', e);
      toaster.pop(
        {
          title: t('Help.NoStorage'),
          body: t('Help.NoStorageMessage'),
          type: 'error'
        },
        0
      );
    }
  }

  private deleteManifestFile() {
    localStorage.removeItem(this.localStorageKey);
    del(this.idbKey);
  }

  /**
   * Returns a promise for the cached manifest of the specified
   * version as a Uint8Array, or rejects.
   */
  private async loadManifestFromCache(version: string, tableWhitelist: string[]): Promise<object> {
    if (alwaysLoadRemote) {
      throw new Error('Testing - always load remote');
    }

    this.statusText = `${t('Manifest.Load')}...`;
    const currentManifestVersion = localStorage.getItem(this.localStorageKey);
    const currentWhitelist = JSON.parse(
      localStorage.getItem(this.localStorageKey + '-whitelist') || '[]'
    );
    if (currentManifestVersion === version && deepEqual(currentWhitelist, tableWhitelist)) {
      const manifest = await get(this.idbKey);
      if (!manifest) {
        throw new Error('Empty cached manifest file');
      }
      return manifest;
    } else {
      throw new Error(`version mismatch: ${version} ${currentManifestVersion}`);
    }
  }

  private setState(newState: Partial<ManifestServiceState>) {
    this.state = { ...this.state, ...newState };
    this.state$.next(this.state);
  }
}

export const D2ManifestService = new ManifestService(
  'd2-manifest-version',
  'd2-manifest',
  d2GetManifest
);
