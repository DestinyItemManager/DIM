import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp')
  .factory('SyncService', SyncService);


function SyncService($q, $translate) {
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

    return new $q((resolve, reject) => {
      // load the drive client.
      gapi.client.load('drive', 'v2', function() {
        // grab all of the list files
        gapi.client.drive.files.list().execute(function(list) {
          if (list.code === 401) {
            reject(new Error($translate.instant('SyncService.GoogleDriveReAuth')));
            return;
          }

          // look for the saved file.
          for (var i = list.items.length - 1; i > 0; i--) {
            if (list.items[i].title === 'DIM-' + membershipId) {
              fileId = list.items[i].id;
              get(true).then(function(data) {
                set(data, true);
                resolve();
              });
              return;
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
            }).then(resolve);
          });

          return;
        });
      });
    });
  }

  // check if the user is authorized with google drive
  function authorize() {
    return new $q((resolve, reject) => {
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
          getFileId().then(resolve);
        });
      } else { // otherwise we do the normal auth flow
        gapi.auth.authorize(drive, function(result) {
          // if no errors, we're good to sync!
          drive.immediate = result && !result.error;

          // resolve promise for errors
          if (!result || result.error) {
            reject(new Error(result));
            return;
          }

          getFileId().then(resolve);
        });
      }
    });
  }

  // function byteLength(str) {
  //   // returns the byte length of an utf8 string
  //   var s = str.length;
  //   for (var i = str.length - 1; i >= 0; i--) {
  //     var code = str.charCodeAt(i);
  //     if (code > 0x7f && code <= 0x7ff) {
  //       s++;
  //     } else if (code > 0x7ff && code <= 0xffff) {
  //       s += 2;
  //     }

  //     if (code >= 0xDC00 && code <= 0xDFFF) {
  //       i--; // trail surrogate
  //     }
  //   }
  //   return s;
  // }

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
      return new $q((resolve, reject) => {
        chrome.storage.sync.set(cached, () => {
          if (chrome.runtime.lastError) {
            const message = chrome.runtime.lastError.message;
            if (message.indexOf('QUOTA_BYTES_PER_ITEM') > -1) {
              reject(new Error($translate.instant('SyncService.OneItemTooLarge')));
            } else if (message.indexOf('QUOTA_BYTES') > -1) {
              reject(new Error($translate.instant('SyncService.SaveTooLarge')));
            } else {
              reject(new Error(message));
            }
          } else {
            resolve();
          }
        });
      });
    }


    // TODO: Do we want to save to both sync and drive?
    fileId = cached.fileId;

    // save to google drive
    if (fileId) {
      return new $q((resolve, reject) => {
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
            revokeDrive();
            reject(new Error('error saving. revoking drive: ' + resp.error));
            return;
          } else {
            resolve();
          }
        });
      });
    }

    return $q.when();
  }

  // get DIM saved data
  function get(force) {
    // if we already have it and we're not forcing a sync
    if (cached && !force) {
      return $q.resolve(cached);
    }

    // grab from localStorage first
    cached = JSON.parse(localStorage.getItem('DIM'));

    // if we have drive sync enabled, get from google drive
    if (fileId || (cached && cached.fileId)) {
      fileId = fileId || cached.fileId;

      return ready.promise.then(authorize).then(function() {
        return new $q((resolve) => {
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
              resolve(cached);
            });
          });
        });
      });
    } // else get from chrome sync
    else if (window.chrome && chrome.storage && chrome.storage.sync) {
      return new $q((resolve) => {
        chrome.storage.sync.get(null, function(data) {
          cached = data;
          resolve(cached);
        });
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
      return $q.when(cached);
    }
  }

  // remove something from DIM by key
  function remove(key) {
    // just delete that key, maybe someday save to an undo array?

    if (_.isArray(key)) {
      _.each(key, (k) => {
        delete cached[k];
      });
    } else {
      delete cached[key];
    }

    // if we have drive sync enabled, get from google drive
    if (fileId || (cached && cached.fileId)) {
      return set(cached, true);
    }

    if (window.chrome && chrome.storage && chrome.storage.sync) {
      return $q((resolve, reject) => {
        chrome.storage.sync.remove(key, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    } else {
      return set(cached, true);
    }
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
