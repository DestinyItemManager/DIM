(function(angular) {
  'use strict';

  angular.module('dimApp')
    .factory('SyncService', SyncService);

  SyncService.$inject = ['$q', '$window'];

  function SyncService($q, $window) {
    var cached; // cached is the data in memory,
    var fileId; // reference to the file in drive
    var membershipId; // logged in bungie user id
    var drive = { // drive api data
      client_id: '22022180893-raop2mu1d7gih97t5da9vj26quqva9dc.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/drive.appfolder',
      immediate: false
    };
    var ready = $q.defer();

    function init() {
      return ready.resolve();
    }

    function revokeDrive() {
      if (fileId || cached.fileId) {
        fileId = undefined;
        remove('fileId');
      }
    }

    // load the file from google drive
    function getFileId() {
      // if we already have the fileId, just return.
      if (fileId) {
        return $q.resolve();
      }

      var deferred = $q.defer();

      // load the drive client.
      gapi.client.load('drive', 'v2', function() {
        // grab all of the list files
        gapi.client.drive.files.list().execute(function(list) {
          if (list.code === 401) {
            $window.alert('To re-authorize google drive, must restart your browser.');
            deferred.resolve();
            return deferred.promise;
          }

          // look for the saved file.
          for (var i = list.items.length - 1; i > 0; i--) {
            if (list.items[i].title === 'DIM-' + membershipId) {
              fileId = list.items[i].id;
              get(true).then(function(data) {
                set(data, true);
                deferred.resolve();
              });
              return deferred.promise;
            }
          }

          // couldn't find the file, lets create a new one.
          gapi.client.request({
            path: '/drive/v2/files',
            method: 'POST',
            body: {
              title: 'DIM-' + membershipId,
              mimeType: 'application/json',
              parents: [{
                id: 'appfolder'
              }]
            }
          }).execute(function(file) {
            fileId = file.id;
            set({
              fileId: fileId
            });
            deferred.resolve();
          });

          return deferred.promise;
        });
      });

      return deferred.promise;
    }

    // check if the user is authorized with google drive
    function authorize() {
      var deferred = $q.defer();

      // we're a chrome app so we do this
      if (window.chrome && chrome.identity) {
        chrome.identity.getAuthToken({
          interactive: true
        }, function(token) {
          if (chrome.runtime.lastError) {
            revokeDrive();
            return;
          }
          gapi.auth.setToken({
            access_token: token
          });
          getFileId().then(deferred.resolve);
        });
      } else { // otherwise we do the normal auth flow
        gapi.auth.authorize(drive, function(result) {
          // if no errors, we're good to sync!
          drive.immediate = result && !result.error;

          // resolve promise for errors
          if (!result || result.error) {
            deferred.reject(result);
            return;
          }

          getFileId().then(deferred.resolve);
        });
      }

      return deferred.promise;
    }

    // save data {key: value}
    function set(value, PUT) {
      //----
      // TODO:
      // if value === cached, we don't need to save....
      // this is a very naive check.
      //----
      //      if(JSON.stringify(value) === JSON.stringify(cached)) {
      //        console.log('nothing changed.');
      //        return;
      //      }

      // use replace to override the data. normally we're doing a PATCH
      if (PUT) { // update our data
        cached = value;
      } else if (cached) {
        angular.extend(cached, value);
      } else {
        cached = value;
      }

      // save to local storage
      localStorage.setItem('DIM', JSON.stringify(cached));

      // save to chrome sync
      if (window.chrome && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.set(cached, function() {
          if (chrome.runtime.lastError) {
            //            console.log('error with chrome sync.')
          }
        });
      }
      // else if(chrome.storage && chrome.storage.local) {
      //   chrome.storage.local.set(cached, function() {
      //     console.log('saved to chrome local.', cached);
      //     if (chrome.runtime.lastError) {
      //       console.log('error with chrome local.')
      //     }
      //   });
      // }

      fileId = cached.fileId;

      // save to google drive
      if (fileId) {
        gapi.client.request({
          path: '/upload/drive/v2/files/' + fileId,
          method: 'PUT',
          params: {
            uploadType: 'media',
            alt: 'json'
          },
          body: cached
        }).execute(function(resp) {
          if (resp && resp.error && (resp.error.code === 401 || resp.error.code === 404)) {
            console.log('error saving. revoking drive.');
            revokeDrive();
            return;
          }
        });
      }
    }

    // get DIM saved data
    function get(force) {
      // if we already have it and we're not forcing a sync
      if (cached && !force) {
        return $q.resolve(cached);
      }

      var deferred = $q.defer();

      // grab from localStorage first
      cached = JSON.parse(localStorage.getItem('DIM'));

      // if we have drive sync enabled, get from google drive
      if (fileId || (cached && cached.fileId)) {
        fileId = fileId || cached.fileId;

        ready.promise.then(authorize).then(function() {
          gapi.client.load('drive', 'v2', function() {
            gapi.client.drive.files.get({
              fileId: fileId,
              alt: 'media'
            }).execute(function(resp) {
              if (resp.code === 401 || resp.code === 404) {
                revokeDrive();
                return;
              }
              cached = resp;
              deferred.resolve(cached);
              return;
            });
          });
        });
      } // else get from chrome sync
      else if (window.chrome && chrome.storage && chrome.storage.sync) {
        chrome.storage.sync.get(null, function(data) {
          cached = data;
          deferred.resolve(cached);
        });
      } // else get from chrome local
      // else if(chrome.storage && chrome.storage.local) {
      //   chrome.storage.local.get(null, function(data) {
      //     cached = data;
      //     deferred.resolve(cached);
      //     console.log('loaded from chrome local', cached);
      //   });
      // }

      // otherwise, just use local storage
      else {
        deferred.resolve(cached);
      }

      return deferred.promise;
    }

    // remove something from DIM by key
    function remove(key) {
      // just delete that key, maybe someday save to an undo array?
      delete cached[key];

      // sync to data storage
      set(cached, true);
    }

    return {
      authorize: authorize,
      get: get,
      set: set,
      remove: remove,
      init: init,
      drive: function() {
        return fileId === undefined;
      }
    };
  }
})(angular);
