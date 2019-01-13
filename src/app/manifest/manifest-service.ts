import * as _ from 'lodash';
import { get, set, del } from 'idb-keyval';

// For zip

import 'imports-loader?this=>window!@destiny-item-manager/zip.js';
import inflate from 'file-loader?name=[name]-[hash:6].[ext]!@destiny-item-manager/zip.js/WebContent/inflate.js';
import zipWorker from 'file-loader?name=[name]-[hash:6].[ext]!@destiny-item-manager/zip.js/WebContent/z-worker.js';

import { requireSqlLib } from './database';
import { reportException } from '../exceptions';
import { getManifest as d1GetManifest } from '../bungie-api/destiny1-api';
import { settings, settingsReady } from '../settings/settings';
import { toaster } from '../ngimport-more';
import { t } from 'i18next';
import { DestinyManifest } from 'bungie-api-ts/destiny2';
import '../rx-operators';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Subject } from 'rxjs/Subject';

declare const zip: any;

interface ManifestDB {
  exec(query: string);
  prepare(query: string);
}

// This file exports D1ManifestService at the bottom of the
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
        const path = data.mobileWorldContentPaths[language] || data.mobileWorldContentPaths.en;

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

  private manifestPromise: Promise<ManifestDB> | null = null;
  private makeStatement = _.memoize((table, db: ManifestDB) => {
    return db.prepare(`select json from ${table} where id = ?`);
  });

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

  getManifest(): Promise<ManifestDB> {
    if (this.manifestPromise) {
      return this.manifestPromise;
    }

    this.loaded = false;

    this.manifestPromise = this.doGetManifest();

    return this.manifestPromise;
  }

  getRecord(db: ManifestDB, table: string, id: number): object | null {
    const statement = this.makeStatement(table, db);
    // The ID in sqlite is a signed 32-bit int, while the id we
    // use is unsigned, so we must convert
    const sqlId = new Int32Array([id])[0];
    const result = statement.get([sqlId]);
    statement.reset();
    if (result.length) {
      return JSON.parse(result[0]);
    }
    return null;
  }

  getAllRecords(db: ManifestDB, table: string): object {
    const rows = db.exec(`SELECT json FROM ${table}`);
    const result = {};
    rows[0].values.forEach((row) => {
      const obj = JSON.parse(row);
      result[obj.hash] = obj;
    });
    return result;
  }

  // This is not an anonymous arrow function inside getManifest because of https://bugs.webkit.org/show_bug.cgi?id=166879
  private async doGetManifest() {
    try {
      const [SQLLib, typedArray] = await Promise.all([
        requireSqlLib(), // load in the sql.js library
        this.loadManifest()
      ]);
      this.statusText = `${t('Manifest.Build')}...`;
      const db = new SQLLib.Database(typedArray);
      // do a small request, just to test it out
      this.getAllRecords(db, 'DestinyRaceDefinition');
      return db;
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

  private async loadManifest(): Promise<Uint8Array> {
    const data = await this.getManifestApi();
    await settingsReady; // wait for settings to be ready
    const language = settings.language;
    const path = data.mobileWorldContentPaths[language] || data.mobileWorldContentPaths.en;

    // Use the path as the version, rather than the "version" field, because
    // Bungie can update the manifest file without changing that version.
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
  private async loadManifestRemote(version: string, path: string): Promise<Uint8Array> {
    this.statusText = `${t('Manifest.Download')}...`;

    const response = await fetch(`https://www.bungie.net${path}`);
    const body = await (response.ok ? response.blob() : Promise.reject(response));
    this.statusText = `${t('Manifest.Unzip')}...`;
    const arraybuffer = await unzipManifest(body);
    this.statusText = `${t('Manifest.Save')}...`;
    const typedArray = new Uint8Array(arraybuffer);

    // We intentionally don't wait on this promise
    this.saveManifestToIndexedDB(typedArray, version);

    this.newManifest$.next();
    return typedArray;
  }

  // This is not an anonymous arrow function inside loadManifestRemote because of https://bugs.webkit.org/show_bug.cgi?id=166879
  private async saveManifestToIndexedDB(typedArray: Uint8Array, version: string) {
    try {
      await set(this.idbKey, typedArray);
      console.log(`Sucessfully stored ${typedArray.length} byte manifest file.`);
      localStorage.setItem(this.localStorageKey, version);
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
  private async loadManifestFromCache(version: string): Promise<Uint8Array> {
    if (alwaysLoadRemote) {
      throw new Error('Testing - always load remote');
    }

    this.statusText = `${t('Manifest.Load')}...`;
    const currentManifestVersion = localStorage.getItem(this.localStorageKey);
    if (currentManifestVersion === version) {
      const typedArray = (await get(this.idbKey)) as Uint8Array;
      if (!typedArray) {
        throw new Error('Empty cached manifest file');
      }
      return typedArray;
    } else {
      throw new Error(`version mismatch: ${version} ${currentManifestVersion}`);
    }
  }

  private setState(newState: Partial<ManifestServiceState>) {
    this.state = { ...this.state, ...newState };
    this.state$.next(this.state);
  }
}

/**
 * Unzip a file from a ZIP Blob into an ArrayBuffer. Returns a promise.
 */
function unzipManifest(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    zip.useWebWorkers = true;
    zip.workerScripts = {
      inflater: [zipWorker, inflate]
    };
    zip.createReader(
      new zip.BlobReader(blob),
      (zipReader) => {
        // get all entries from the zip
        zipReader.getEntries((entries) => {
          if (entries.length) {
            entries[0].getData(new zip.BlobWriter(), (blob) => {
              const blobReader = new FileReader();
              blobReader.addEventListener('error', (e) => {
                reject(e);
              });
              blobReader.addEventListener('load', () => {
                zipReader.close(() => {
                  if (blobReader.result instanceof ArrayBuffer) {
                    resolve(blobReader.result);
                  }
                });
              });
              blobReader.readAsArrayBuffer(blob);
            });
          }
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
}

// Two separate copies of the service, with separate state and separate storage
export const D1ManifestService = new ManifestService(
  'manifest-version',
  'dimManifest',
  d1GetManifest
);
