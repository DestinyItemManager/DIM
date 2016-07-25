(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimManifestService', ManifestService);

  ManifestService.$inject = ['$rootScope', '$q', 'dimBungieService', '$http'];

  // TODO: profile memory of SQLite vs reading it all out at startup!
  // TODO: so far this uses a lot more memory
  function ManifestService($rootScope, $q, dimBungieService, $http) {
    // Testing flags
    const alwaysLoadRemote = false;

    // TODO: expose state properties, loading progress
    return {
      // TODO Do this entirely with webworkers?
      getManifest: function() {
        // TODO: var language = window.navigator.language;
        var language = 'en';
        console.time('manifest');

        return dimBungieService.getManifest()
          .then(function(data) {
            console.log(data);
            var version = data.version;

            return loadManifestFromCache(version)
              .catch(function(e) {
                console.log(e);
                // TODO: progress events

                console.log("loading from remote");
                var path = data.mobileWorldContentPaths[language] || data.mobileWorldContentPaths.en;
                return loadManifestRemote(version, path);
              })
              .then(function(typedArray) {
                console.log('got buffer', typedArray.byteLength);
                return new SQL.Database(typedArray);
              });
          });
      },

      // TODO: memoize provides dumb caching but probably not necessary!
      // TODO: have item services do it instead?
      getRecord: _.memoize(function(db, table, id) {
        console.time('getRecord ' + table + ' ' + id);
        // TODO: prepared statements?
        // TODO: web worker? 3.5ms per invocation right now. Time against normal DIM?
        try {
          // The ID in sqlite is a signed 32-bit int, while the id we use is unsigned, so we must convert
          const sqlId = new Int32Array([id])[0];
          const result = db.exec("SELECT json FROM " + table + " where id = " + sqlId);
          if (result.length && result[0].values && result[0].values.length) {
            return JSON.parse(result[0].values[0]);
          }
          return null;
        } finally {
          console.timeEnd('getRecord ' + table + ' ' + id);
        }
      }, (db, table, id) => table + '-' + id)
    };

    /**
     * Returns a promise for the manifest data as a Uint8Array. Will cache it on succcess.
     */
    function loadManifestRemote(version, path) {
      return $http.get("https://www.bungie.net/" + path, { responseType: "blob" })
        .then(function(response) {
          return unzipManifest(response.data);
        })
        .then(function(arraybuffer) {
          var typedArray = new Uint8Array(arraybuffer);
          console.time('base64');
          var encoded = base64js.fromByteArray(typedArray);
          console.timeEnd('base64');
          console.log(encoded.length);
          console.time('store');
          return $q(function(resolve, reject) {
            // Note: this requires the 'unlimitedStorage' permission, as the
            // uncompress manifest is ~40MB.
            chrome.storage.local.set({
              manifest: encoded,
              'manifest-version': version
            }, function() {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                console.timeEnd('store');
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
      // TODO: none of this works in Firefox?
      return $q(function(resolve, reject) {
        if (alwaysLoadRemote) {
          reject(new Error("Testing - always load remote"));
          return;
        }
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
                console.log("loading from localstorage");
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
      console.time('unzip');
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
                    console.timeEnd('unzip');
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
