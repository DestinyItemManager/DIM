/* global zip */

import angular from 'angular';
import _ from 'underscore';
import idbKeyval from 'idb-keyval';

// For zip
require('imports-loader?this=>window!zip-js/WebContent/zip.js');

// require.ensure splits up the sql library so the user only loads it
// if they need it. So we can minify sql.js specifically (as explained
// in the Webpack config, we need to explicitly name this chunk, which
// can only be done using the require.ensure method
function requireSqlLib() {
  return new Promise((resolve) => {
    require.ensure('sql.js', (require) => {
      resolve(require('sql.js'));
    }, 'sqlLib');
  });
}

angular.module('dimApp')
  .factory('dimManifestService', ManifestService);


function ManifestService($q, dimBungieService, $http, toaster, dimSettingsService, $translate, $rootScope) {
  // Testing flags
  const alwaysLoadRemote = false;

  let manifestPromise = null;

  const makeStatement = _.memoize(function(table, db) {
    return db.prepare(`select json from ${table} where id = ?`);
  });

  const service = {
    isLoaded: true,
    isError: false,
    statusText: null,
    version: null,

    // This tells users to reload the extension. It fires no more
    // often than every 10 seconds, and only warns if the manifest
    // version has actually changed.
    warnMissingDefinition: _.debounce(function() {
      dimBungieService.getManifest()
        .then(function(data) {
          const language = dimSettingsService.language;
          const path = data.mobileWorldContentPaths[language] || data.mobileWorldContentPaths.en;

          // The manifest has updated!
          if (path !== service.version) {
            toaster.pop('error',
                        $translate.instant('Manifest.Outdated'),
                        $translate.instant('Manifest.OutdatedExplanation'));
          }
        });
    }, 10000, true),

    getManifest: function() {
      if (manifestPromise) {
        return manifestPromise;
      }

      service.isLoaded = false;

      manifestPromise = dimBungieService.getManifest()
        .then(function(data) {
          const language = dimSettingsService.language;
          const path = data.mobileWorldContentPaths[language] || data.mobileWorldContentPaths.en;

          // Use the path as the version, rather than the "version" field, because
          // Bungie can update the manifest file without changing that version.
          const version = path;
          service.version = version;

          return loadManifestFromCache(version)
            .catch(function(e) {
              return loadManifestRemote(version, language, path);
            })
            .then(function(typedArray) {
              service.statusText = $translate.instant('Manifest.Build') + '...';

              return Promise.all([
                typedArray,
                requireSqlLib(), // load in the sql.js library
              ]);
            })
            .then(function([typedArray, SQLLib]) {
              const db = new SQLLib.Database(typedArray);
              // do a small request, just to test it out
              service.getAllRecords(db, 'DestinyRaceDefinition');
              return db;
            });
        })
        .catch((e) => {
          let message = e.message || e;
          service.statusText = $translate.instant('Manifest.Error', { error: message });

          if (e.status === -1) {
            message = $translate.instant('BungieService.NotConnected');
          } else if (e.status === 503 || e.status === 522 /* cloudflare */) {
            message = $translate.instant('BungieService.Down');
          } else if (e.status < 200 || e.status >= 400) {
            message = $translate.instant('BungieService.NetworkError', {
              status: e.status,
              statusText: e.statusText
            });
          } else {
            // Something may be wrong with the manifest
            deleteManifestFile();
          }

          manifestPromise = null;
          service.isError = true;
          throw new Error(message);
        });

      return manifestPromise;
    },

    getRecord: function(db, table, id) {
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

    getAllRecords: function(db, table) {
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

  /**
   * Returns a promise for the manifest data as a Uint8Array. Will cache it on succcess.
   */
  function loadManifestRemote(version, language, path) {
    service.statusText = $translate.instant('Manifest.Download') + '...';

    return $http.get("https://www.bungie.net" + path + '?host=' + window.location.hostname, { responseType: "blob" })
      .then(function(response) {
        service.statusText = $translate.instant('Manifest.Unzip') + '...';
        return unzipManifest(response.data);
      })
      .then(function(arraybuffer) {
        service.statusText = $translate.instant('Manifest.Save') + '...';

        var typedArray = new Uint8Array(arraybuffer);
        idbKeyval.set('dimManifest', typedArray)
          .then(() => {
            console.log("Sucessfully stored " + typedArray.length + " byte manifest file.");
            localStorage.setItem('manifest-version', version);
          })
          .catch((e) => console.error('Error saving manifest file', e));

        $rootScope.$broadcast('dim-new-manifest');
        return typedArray;
      });
  }

  function deleteManifestFile() {
    localStorage.removeItem('manifest-version');
    idbKeyval.delete('dimManifest');
  }

  /**
   * Returns a promise for the cached manifest of the specified
   * version as a Uint8Array, or rejects.
   */
  function loadManifestFromCache(version) {
    if (alwaysLoadRemote) {
      return $q.reject(new Error("Testing - always load remote"));
    }

    service.statusText = $translate.instant('Manifest.Load') + '...';
    var currentManifestVersion = localStorage.getItem('manifest-version');
    if (currentManifestVersion === version) {
      return idbKeyval.get('dimManifest').then((typedArray) => {
        if (!typedArray) {
          throw new Error("Empty cached manifest file");
        }
        return typedArray;
      });
    } else {
      _gaq.push(['_trackEvent', 'Manifest', 'Need New Manifest']);
      return $q.reject(new Error("version mismatch: " + version + ' ' + currentManifestVersion));
    }
  }

  /**
   * Unzip a file from a ZIP Blob into an ArrayBuffer. Returns a promise.
   */
  function unzipManifest(blob) {
    return $q(function(resolve, reject) {
      zip.useWebWorkers = true;
      zip.workerScriptsPath = 'static/zipjs/';
      zip.createReader(new zip.BlobReader(blob), function(zipReader) {
        // get all entries from the zip
        zipReader.getEntries(function(entries) {
          if (entries.length) {
            entries[0].getData(new zip.BlobWriter(), function(blob) {
              var blobReader = new FileReader();
              blobReader.addEventListener("error", (e) => { reject(e); });
              blobReader.addEventListener("load", function() {
                zipReader.close(function() {
                  resolve(blobReader.result);
                });
              });
              blobReader.readAsArrayBuffer(blob);
            });
          }
        });
      }, function(error) {
        reject(error);
      });
    });
  }
}

