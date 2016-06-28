(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimManifestService', ManifestService);

  ManifestService.$inject = ['$rootScope', '$q', 'dimBungieService', '$http'];

  function ManifestService($rootScope, $q, dimBungieService, $http) {
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
      }
    };

    /**
     * Returns a promise for the manifest data as a Uint8Array. Will cache it on succcess.
     */
    function loadManifestRemote(version, path) {
      // TODO: save zipped or post-zip?
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
