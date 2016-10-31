(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimManifestService', ManifestService);

  ManifestService.$inject = ['$q', 'dimBungieService', '$http', 'toaster', 'dimSettingsService', '$translate'];

  function ManifestService($q, dimBungieService, $http, toaster, dimSettingsService, $translate) {
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
              toaster.pop('error', 'Outdated Destiny Info', "Bungie has updated their Destiny info database. Reload DIM to pick up the new info. Note that some things in DIM may not work for a few hours after Bungie updates Destiny, as the new data propagates through their systems.");
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
                const db = new SQL.Database(typedArray);
                // do a small request, just to test it out
                service.getAllRecords(db, 'DestinyRaceDefinition');
                return db;
              });
          })
          .catch((e) => {
            service.statusText = $translate.instant('Manifest.Error1') + (e.message || e) + ". " + $translate.instant('Manifest.Error2');
            manifestPromise = null;
            service.isError = true;
            return deleteManifestFile().finally(() => $q.reject(e));
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
      return $http.get("https://www.bungie.net" + path, { responseType: "blob" })
        .then(function(response) {
          service.statusText = $translate.instant('Manifest.Unzip') + '...';
          return unzipManifest(response.data);
        })
        .then(function(arraybuffer) {
          service.statusText = $translate.instant('Manifest.Save') + '...';

          getLocalManifestFile()
            .then((fileEntry) => {
              fileEntry.createWriter((fileWriter) => {
                fileWriter.onwriteend = function(e) {
                  if (fileWriter.length === 0) { // truncate finished
                    fileWriter.write(new Blob([arraybuffer], { type: "application/octet-stream" }));
                  } else { // blob write finished
                    localStorage.setItem('manifest-version', version);
                    console.log("Sucessfully stored " + fileWriter.length + " byte manifest file.");
                    _gaq.push(['_trackEvent', 'Manifest', 'Downloaded']);
                  }
                };

                fileWriter.onerror = function(e) {
                  console.error('Write of manifest file failed', e);
                };

                fileWriter.truncate(0); // clear it out first
              });
            })
            .catch((e) => console.log('Error saving manifest file', e));

          var typedArray = new Uint8Array(arraybuffer);
          return typedArray;
        });
    }

    function getLocalManifestFile() {
      return $q((resolve, reject) => {
        const requestFileSystem = (window.requestFileSystem || window.webkitRequestFileSystem);
        // Ask for 60MB of temporary space. If Chrome gets rid of it we can always redownload.
        requestFileSystem(window.TEMPORARY, 60 * 1024 * 1024, (fs) => {
          fs.root.getFile('dimManifest', { create: true, exclusive: false }, (f) => resolve(f), (e) => reject(e));
        }, (e) => reject(e));
      });
    }

    function deleteManifestFile() {
      localStorage.removeItem('manifest-version');
      return getLocalManifestFile().then((fileEntry) => {
        return $q((resolve, reject) => {
          fileEntry.remove(resolve, reject);
        });
      });
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
        // One version of this used chrome.storage.local with a
        // base64-encoded string, which is a bit slower. We may need
        // to do that again if the requestFileSystem API gets
        // removed.
        return getLocalManifestFile()
          .then((fileEntry) => {
            return $q((resolve, reject) => {
              fileEntry.file((file) => {
                var reader = new FileReader();
                reader.addEventListener("error", (e) => { reject(e); });
                reader.addEventListener("load", () => {
                  var typedArray = new Uint8Array(reader.result);
                  if (typedArray.length) {
                    resolve(typedArray);
                  } else {
                    reject(new Error("Empty cached manifest file"));
                  }
                });
                reader.readAsArrayBuffer(file);
              }, (e) => reject(e));
            });
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
        zip.workerScriptsPath = "vendor/zip.js/WebContent/";
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
})();
