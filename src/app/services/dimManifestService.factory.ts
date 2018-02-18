import * as _ from 'underscore';
import * as idbKeyval from 'idb-keyval';

// For zip
// tslint:disable-next-line:no-implicit-dependencies
import 'imports-loader?this=>window!@destiny-item-manager/zip.js';
// tslint:disable-next-line:no-implicit-dependencies
import inflate from 'file-loader?name=[name]-[hash:6].[ext]!@destiny-item-manager/zip.js/WebContent/inflate.js';
// tslint:disable-next-line:no-implicit-dependencies
import zipWorker from 'file-loader?name=[name]-[hash:6].[ext]!@destiny-item-manager/zip.js/WebContent/z-worker.js';

import { requireSqlLib } from './database';
import { reportException } from '../exceptions';
import { getManifest as d2GetManifest } from '../bungie-api/destiny2-api';
import { getManifest as d1GetManifest } from '../bungie-api/destiny1-api';
import { IPromise, IHttpService, IQService } from 'angular';

declare const zip: any;

// Two separate copies of the service, with separate state and separate storage

export function ManifestService($q, $http, toaster, dimSettingsService, $i18next, $rootScope) {
  'ngInject';
  return makeManifestService('manifest-version', 'dimManifest', $q, d1GetManifest, $http, toaster, dimSettingsService, $i18next, $rootScope);
}

export function D2ManifestService($q, $http, toaster, dimSettingsService, $i18next, $rootScope) {
  'ngInject';
  return makeManifestService('d2-manifest-version', 'd2-manifest', $q, d2GetManifest, $http, toaster, dimSettingsService, $i18next, $rootScope);
}

function makeManifestService(
  localStorageKey: string,
  idbKey,
  $q: IQService,
  getManifestApi,
  $http: IHttpService,
  toaster,
  dimSettingsService,
  $i18next,
  $rootScope
) {
  // Testing flags
  const alwaysLoadRemote = false;

  let manifestPromise: Promise<any> | null = null;

  const makeStatement = _.memoize((table, db) => {
    return db.prepare(`select json from ${table} where id = ?`);
  });

  const service = {
    isLoaded: true,
    isError: false,
    statusText: null as string | null,
    version: null as string | null,

    // TODO: we probably want a way to unload this service

    // This tells users to reload the extension. It fires no more
    // often than every 10 seconds, and only warns if the manifest
    // version has actually changed.
    warnMissingDefinition: _.debounce(() => {
      getManifestApi()
        .then((data) => {
          const language = dimSettingsService.language;
          const path = data.mobileWorldContentPaths[language] || data.mobileWorldContentPaths.en;

          // The manifest has updated!
          if (path !== service.version) {
            toaster.pop('warning',
                        $i18next.t('Manifest.Outdated'),
                        $i18next.t('Manifest.OutdatedExplanation'));
          }
        });
    }, 10000, true),

    // TODO: redo all this with rxjs
    getManifest() {
      if (manifestPromise) {
        return manifestPromise;
      }

      service.isLoaded = false;

      manifestPromise = Promise
        .all([
          requireSqlLib(), // load in the sql.js library
          loadManifest()
        ])
        .then(([SQLLib, typedArray]) => {
          service.statusText = `${$i18next.t('Manifest.Build')}...`;
          const db = new SQLLib.Database(typedArray);
          // do a small request, just to test it out
          service.getAllRecords(db, 'DestinyRaceDefinition');
          return db;
        })
        .catch((e) => {
          let message = e.message || e;
          service.statusText = $i18next.t('Manifest.Error', { error: message });

          if (e.status === -1) {
            message = navigator.onLine
              ? $i18next.t('BungieService.NotConnectedOrBlocked')
              : $i18next.t('BungieService.NotConnected');
          // tslint:disable-next-line:space-in-parens
          } else if (e.status === 503 || e.status === 522 /* cloudflare */) {
            message = $i18next.t('BungieService.Down');
          } else if (e.status < 200 || e.status >= 400) {
            message = $i18next.t('BungieService.NetworkError', {
              status: e.status,
              statusText: e.statusText
            });
          } else {
            // Something may be wrong with the manifest
            deleteManifestFile();
          }

          manifestPromise = null;
          service.isError = true;
          console.error("Manifest loading error", { error: e }, e);
          reportException('manifest load', e);
          throw new Error(message);
        });

      return manifestPromise;
    },

    getRecord(db, table, id): object | null {
      const statement = makeStatement(table, db);
      // The ID in sqlite is a signed 32-bit int, while the id we
      // use is unsigned, so we must convert
      const sqlId = new Int32Array([id])[0];
      const result = statement.get([sqlId]);
      statement.reset();
      if (result.length) {
        return JSON.parse(result[0]);
      }
      return null;
    },

    getAllRecords(db, table): object {
      const rows = db.exec(`SELECT json FROM ${table}`);
      const result = {};
      rows[0].values.forEach((row) => {
        const obj = JSON.parse(row);
        result[obj.hash] = obj;
      });
      return result;
    }
  };

  return service;

  function loadManifest(): IPromise<Uint8Array> {
    return $q.all([
      getManifestApi(),
      dimSettingsService.ready // wait for settings to be ready
    ])
      .then(([data]) => {
        const language = dimSettingsService.language;
        const path = data.mobileWorldContentPaths[language] || data.mobileWorldContentPaths.en;

        // Use the path as the version, rather than the "version" field, because
        // Bungie can update the manifest file without changing that version.
        const version = path;
        service.version = version;

        return loadManifestFromCache(version)
          .catch(() => loadManifestRemote(version, path));
      });
  }

  /**
   * Returns a promise for the manifest data as a Uint8Array. Will cache it on succcess.
   */
  function loadManifestRemote(version, path): IPromise<Uint8Array> {
    service.statusText = `${$i18next.t('Manifest.Download')}...`;

    return $http.get(`https://www.bungie.net${path}?host=${window.location.hostname}`, { responseType: "blob" })
      .then((response) => {
        service.statusText = `${$i18next.t('Manifest.Unzip')}...`;
        return unzipManifest(response.data);
      })
      .then((arraybuffer) => {
        service.statusText = `${$i18next.t('Manifest.Save')}...`;

        const typedArray = new Uint8Array(arraybuffer);
        // We intentionally don't wait on this promise
        idbKeyval.set(idbKey, typedArray)
          .then(() => {
            console.log(`Sucessfully stored ${typedArray.length} byte manifest file.`);
            localStorage.setItem(localStorageKey, version);
          })
          .then(null, (e) => {
            console.error('Error saving manifest file', e);
            toaster.pop({
              title: $i18next.t('Help.NoStorage'),
              body: $i18next.t('Help.NoStorageMessage'),
              type: 'error'
            }, 0);
          });

        $rootScope.$broadcast('dim-new-manifest');
        return typedArray;
      });
  }

  function deleteManifestFile() {
    localStorage.removeItem(localStorageKey);
    idbKeyval.delete(idbKey);
  }

  /**
   * Returns a promise for the cached manifest of the specified
   * version as a Uint8Array, or rejects.
   */
  function loadManifestFromCache(version): IPromise<Uint8Array> {
    if (alwaysLoadRemote) {
      throw new Error("Testing - always load remote");
    }

    service.statusText = `${$i18next.t('Manifest.Load')}...`;
    const currentManifestVersion = localStorage.getItem(localStorageKey);
    if (currentManifestVersion === version) {
      return $q.when(idbKeyval.get(idbKey)).then((typedArray: Uint8Array) => {
        if (!typedArray) {
          throw new Error("Empty cached manifest file");
        }
        return typedArray;
      });
    } else {
      ga('send', 'event', 'Manifest', 'Need New Manifest');
      throw new Error(`version mismatch: ${version} ${currentManifestVersion}`);
    }
  }

  /**
   * Unzip a file from a ZIP Blob into an ArrayBuffer. Returns a promise.
   */
  function unzipManifest(blob): IPromise<ArrayBuffer> {
    return $q((resolve, reject) => {
      zip.useWebWorkers = true;
      zip.workerScripts = {
        inflater: [zipWorker, inflate]
      };
      zip.createReader(new zip.BlobReader(blob), (zipReader) => {
        // get all entries from the zip
        zipReader.getEntries((entries) => {
          if (entries.length) {
            entries[0].getData(new zip.BlobWriter(), (blob) => {
              const blobReader = new FileReader();
              blobReader.addEventListener("error", (e) => { reject(e); });
              blobReader.addEventListener("load", () => {
                zipReader.close(() => {
                  resolve(blobReader.result);
                });
              });
              blobReader.readAsArrayBuffer(blob);
            });
          }
        });
      }, (error) => {
        reject(error);
      });
    });
  }
}
