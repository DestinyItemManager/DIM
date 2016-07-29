(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimManifestService', ManifestService);

  ManifestService.$inject = ['$rootScope', '$q', 'dimBungieService', '$http'];

  function ManifestService($rootScope, $q, dimBungieService, $http) {
    // Testing flags
    const alwaysLoadRemote = false;

    let manifestPromise = null;

    const service = {
      isLoaded: true,
      statusText: null,
      getManifest: function() {
        if (manifestPromise) {
          return manifestPromise;
        }

        service.isLoaded = false;

        // TODO: var language = window.navigator.language;
        var language = 'en';

        manifestPromise = dimBungieService.getManifest()
          .then(function(data) {
            var version = data.version;

            return loadManifestFromCache(version)
              .catch(function(e) {
                var path = data.mobileWorldContentPaths[language] || data.mobileWorldContentPaths.en;
                return loadManifestRemote(version, path);
              })
              .then(function(typedArray) {
                service.statusText = 'Building Destiny info database...';
                return new SQL.Database(typedArray);
              });
          });

        return manifestPromise;
      },

      getRecord: _.memoize(function(db, table, id) {
        // The ID in sqlite is a signed 32-bit int, while the id we use is unsigned, so we must convert
        const sqlId = new Int32Array([id])[0];
        const result = db.exec(`SELECT json FROM ${table} where id = ${sqlId}`);
        if (result.length && result[0].values && result[0].values.length) {
          return JSON.parse(result[0].values[0]);
        }
        return null;
      }, (db, table, id) => table + '-' + id),

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
    function loadManifestRemote(version, path) {
      service.statusText = 'Downloading latest Destiny info from Bungie...';
      return $http.get("https://www.bungie.net/" + path, { responseType: "blob" })
        .then(function(response) {
          service.statusText = 'Unzipping latest Destiny info...';
          return unzipManifest(response.data);
        })
        .then(function(arraybuffer) {
          service.statusText = 'Saving latest Destiny info...';
          var typedArray = new Uint8Array(arraybuffer);
          var encoded = base64js.fromByteArray(typedArray);
          return $q(function(resolve, reject) {
            // Note: this requires the 'unlimitedStorage' permission, as the
            // uncompressed manifest is ~40MB.
            chrome.storage.local.set({
              manifest: encoded,
              'manifest-version': version
            }, function() {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(typedArray);
              }
            });
          });
        });
    }

    /**
     * Returns a promise for the cached manifest of the specified
     * version as a Uint8Array, or rejects.
     */
    function loadManifestFromCache(version) {
      return $q(function(resolve, reject) {
        if (alwaysLoadRemote) {
          reject(new Error("Testing - always load remote"));
          return;
        }

        service.statusText = "Loading saved Destiny info...";
        chrome.storage.local.get('manifest-version', function(obj) {
          var currentManifestVersion = obj['manifest-version'];
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else if (currentManifestVersion === version) {
            chrome.storage.local.get('manifest', function(obj2) {
              var currentManifest = obj2.manifest;
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else if (currentManifest) {
                resolve(base64js.toByteArray(currentManifest));
              } else {
                reject(new Error("no stored manifest despite version"));
              }
            });
          } else {
            reject(new Error("version mismatch: " + version + ' ' + currentManifestVersion));
          }
        });
      });
    }

    /**
     * Unzip a file from a ZIP Blob into an ArrayBuffer. Returns a promise.
     */
    function unzipManifest(blob) {
      return $q(function(resolve, reject) {
        zip.workerScriptsPath = "vendor/zip.js/WebContent/";
        zip.createReader(new zip.BlobReader(blob), function(zipReader) {
          // get all entries from the zip
          zipReader.getEntries(function(entries) {
            if (entries.length) {
              entries[0].getData(new zip.BlobWriter(), function(blob) {
                var blobReader = new FileReader();
                blobReader.addEventListener("loadend", function() {
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
