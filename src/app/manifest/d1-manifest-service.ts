import _ from 'lodash';
import { get, set, del } from 'idb-keyval';

import { reportException } from '../utils/exceptions';
import { settingsReady } from '../settings/settings';
import { t } from 'app/i18next-t';
import { showNotification } from '../notifications/notifications';
import { settingsSelector } from 'app/settings/reducer';
import store from 'app/store/store';
import { loadingEnd, loadingStart } from 'app/shell/actions';

// This file exports D1ManifestService at the bottom of the
// file (TS wants us to declare classes before using them)!

// Testing flags
const alwaysLoadRemote = false;

const manifestLangs = new Set(['en', 'fr', 'es', 'de', 'it', 'ja', 'pt-br']);

class ManifestService {
  version: string | null = null;

  private manifestPromise: Promise<object> | null = null;

  constructor(readonly localStorageKey: string, readonly idbKey: string) {}

  getManifest(): Promise<object> {
    if (this.manifestPromise) {
      return this.manifestPromise;
    }

    this.manifestPromise = this.doGetManifest();

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
  private async doGetManifest() {
    store.dispatch(loadingStart(t('Manifest.Load')));
    try {
      const manifest = await this.loadManifest();
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
          statusText: e.statusText
        });
      } else {
        // Something may be wrong with the manifest
        this.deleteManifestFile();
      }

      const statusText = t('Manifest.Error', { error: message });
      this.manifestPromise = null;
      console.error('Manifest loading error', { error: e }, e);
      reportException('manifest load', e);
      throw new Error(statusText);
    } finally {
      store.dispatch(loadingEnd(t('Manifest.Load')));
    }
  }

  private async loadManifest(): Promise<any> {
    await settingsReady; // wait for settings to be ready
    const language = settingsSelector(store.getState()).language;
    const manifestLang = manifestLangs.has(language) ? language : 'en';
    const path = `/data/d1/manifests/d1-manifest-${manifestLang}.json?v=2020-02-17`;

    // Use the path as the version
    const version = path;
    this.version = version;

    try {
      return await this.loadManifestFromCache(version);
    } catch (e) {
      return this.loadManifestRemote(version, path);
    }
  }

  /**
   * Returns a promise for the manifest data as a Uint8Array. Will cache it on succcess.
   */
  private async loadManifestRemote(version: string, path: string): Promise<object> {
    store.dispatch(loadingStart(t('Manifest.Download')));

    try {
      const response = await fetch(path);
      const manifest = await (response.ok ? response.json() : Promise.reject(response));

      // We intentionally don't wait on this promise
      this.saveManifestToIndexedDB(manifest, version);

      return manifest;
    } finally {
      store.dispatch(loadingEnd(t('Manifest.Download')));
    }
  }

  // This is not an anonymous arrow function inside loadManifestRemote because of https://bugs.webkit.org/show_bug.cgi?id=166879
  private async saveManifestToIndexedDB(typedArray: object, version: string) {
    try {
      await set(this.idbKey, typedArray);
      console.log(`Sucessfully stored manifest file.`);
      localStorage.setItem(this.localStorageKey, version);
    } catch (e) {
      console.error('Error saving manifest file', e);
      showNotification({
        title: t('Help.NoStorage'),
        body: t('Help.NoStorageMessage'),
        type: 'error'
      });
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
  private async loadManifestFromCache(version: string): Promise<object> {
    if (alwaysLoadRemote) {
      throw new Error('Testing - always load remote');
    }

    const currentManifestVersion = localStorage.getItem(this.localStorageKey);
    if (currentManifestVersion === version) {
      const manifest = await get<object>(this.idbKey);
      if (!manifest) {
        throw new Error('Empty cached manifest file');
      }
      return manifest;
    } else {
      throw new Error(`version mismatch: ${version} ${currentManifestVersion}`);
    }
  }
}

export const D1ManifestService = new ManifestService('d1-manifest-version', 'd1-manifest');
