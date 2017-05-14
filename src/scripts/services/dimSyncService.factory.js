import angular from 'angular';
import _ from 'underscore';
import idbKeyval from 'idb-keyval';

angular.module('dimApp')
  .factory('SyncService', SyncService);

function SyncService($q, $translate, dimBungieService, dimState, dimFeatureFlags) {
  var cached; // cached is the data in memory,

  // TODO: move these into subfiles
  const LocalStorage = {
    get: function() {
      return $q.resolve(JSON.parse(localStorage.getItem('DIM')));
    },

    set: function(value) {
      localStorage.setItem('DIM', JSON.stringify(value));
      return $q.resolve(value);
    },

    // TODO: disable if indexedDB is on
    enabled: true,
    name: 'LocalStorage'
  };

  const IndexedDBStorage = {
    get: function() {
      return idbKeyval.get('DIM-data');
    },

    set: function(value) {
      return idbKeyval.set('DIM-data', value);
    },

    enabled: true,
    name: 'IndexedDBStorage'
  };

  const ChromeSyncStorage = {
    get: function() {
      return new $q((resolve, reject) => {
        chrome.storage.sync.get(null, function(data) {
          if (chrome.runtime.lastError) {
            const message = chrome.runtime.lastError.message;
            reject(new Error(message));
          } else {
            resolve(data);
          }
        });
      });
    },

    set: function(value) {
      return new $q((resolve, reject) => {
        chrome.storage.sync.set(value, () => {
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
    },

    remove: function(key) {
      return $q((resolve, reject) => {
        chrome.storage.sync.remove(key, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError));
          } else {
            resolve();
          }
        });
      });
    },

    enabled: (window.chrome && chrome.storage && chrome.storage.sync),
    name: 'ChromeSyncStorage'
  };

  const GoogleDriveStorage = {
    drive: { // drive api data
      // client_id: $GOOGLE_DRIVE_CLIENT_ID,
      clientId: '22022180893-raop2mu1d7gih97t5da9vj26quqva9dc.apps.googleusercontent.com',
      scope: 'https://www.googleapis.com/auth/drive.appdata',
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
    },
    fileId: null,
    ready: $q.defer(),

    get: function() {
      return this.ready.promise
        .then(() => {
          if (!this.fileId) {
            throw new Error("no file!");
          }
          return gapi.client.drive.files.get({
            fileId: this.fileId,
            alt: 'media'
          });
        })
        .catch((e) => {
          //this.revokeDrive();
          throw e;
        });
    },

    // TODO: set a timestamp for merging?
    set: function(value) {
      return this.ready.promise
        .then(() => {
          if (!this.fileId) {
            throw new Error("no file!");
          }
          return gapi.client.request({
            path: '/upload/drive/v3/files/' + this.fileId,
            method: 'PATCH',
            params: {
              uploadType: 'media',
              alt: 'json'
            },
            body: value
          }).then((resp) => {
            if (resp && resp.error && (resp.error.code === 401 || resp.error.code === 404)) {
              //this.revokeDrive();
              throw new Error('error saving. revoking drive: ' + resp.error);
            } else {
              console.log("saved to GDrive!");
              return value;
            }
          });
        });
    },

    updateSigninStatus: function(isSignedIn) {
      if (isSignedIn) {
        console.log('signed in');
        this.getFileId();
      } else {
        console.log('not signed in');
        this.enabled = false;
      }
    },

    init: function() {
      if (!dimFeatureFlags.gdrive) {
        console.log("Google drive disabled");
        return;
      }
      console.log("gdrive init requested");
      gapi.load('client:auth2', () => {
        gapi.client.init(this.drive).then(() => {
          console.log("gdrive init complete");
          // Listen for sign-in state changes.
          gapi.auth2.getAuthInstance().isSignedIn.listen(this.updateSigninStatus.bind(this));

          // Handle the initial sign-in state.
          this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
          this.ready.resolve();
        });
      });
    },

    // TODO: need to store gdrive file id in local storage

    // TODO: don't redo this?
    // check if the user is authorized with google drive
    authorize: function() {
      // TODO: probably shouldn't do this unless clicked!
      if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
        console.log('already authorized');
      } else {
        console.log('authorizing');
        gapi.auth2.getAuthInstance().signIn();
        // TODO: On first signin, sync?
      }
    },

    getFileName: function() {
      const platform = dimState.active;
      if (platform) {
        return 'DIM-' + $DIM_FLAVOR + '-' + platform.membershipId;
      }
      return null;
    },

    // load the file from google drive
    getFileId: function() {
      // TODO: need a file per membership?
      // if we already have the fileId, just return.
      if (this.fileId) {
        return $q.resolve(this.fileId);
      }

      this.fileId = localStorage.getItem('gdrive-fileid');
      if (this.fileId) {
        return $q.resolve(this.fileId);
      }

      const fileName = this.getFileName();

      if (!fileName) {
        return $q.reject(new Error("You're not logged in yet"));
      }

      // grab all of the list files
      return $q.when(gapi.client.drive.files.list({ spaces: 'appDataFolder' }))
        .then((list) => {
          console.log('file list', list);

          if (!list.result || !list.result.files) {
            throw new Error("No files!");
          }

          const files = list.result.files;

          // look for the saved file.
          const file = _.find(files, { title: fileName });
          if (file) {
            this.fileId = file.id;
            return this.fileId;
          }

          // couldn't find the file, lets create a new one.
          return gapi.client.drive.files.create({
            title: fileName,
            media: {
              mimeType: 'application/json'
            },
            parents: ['appDataFolder']
          }).then((file) => {
            console.log('created file', file);
            this.fileId = file.result.id;
            return this.fileId;
          });
        })
        .then((fileId) => {
          console.log("fileid", fileId);
          localStorage.setItem('gdrive-fileid', fileId);
          this.enabled = true;
          return fileId;
        })
        .catch((e) => {
          console.error(e);
          throw new Error($translate.instant('SyncService.GoogleDriveReAuth'));
        });
    },

    revokeDrive: function() {
      console.log("revoke drive");
      this.fileId = undefined;
      this.enabled = false;
      localStorage.removeItem('gdrive-fileid');
      gapi.auth2.getAuthInstance().signOut();
    },

    enabled: dimFeatureFlags.gdrive && Boolean(localStorage.getItem('gdrive-fileid')),
    name: 'GoogleDriveStorage'
  };

  const adapters = [
    LocalStorage,
    IndexedDBStorage,
    ChromeSyncStorage,
    GoogleDriveStorage
  ];

  // save data {key: value}
  function set(value, PUT) {
    if (!cached) {
      throw new Error("Must call get at least once before setting");
    }

    if (!PUT && angular.equals(_.pick(cached, _.keys(value)), value)) {
      return $q.when();
    }

    // use replace to override the data. normally we're doing a PATCH
    if (PUT) { // update our data
      cached = value;
    } else {
      angular.extend(cached, value);
    }

    console.log('set', value);


    return adapters.reduce((promise, adapter) => {
      if (adapter.enabled) {
        return promise.then(() => {
          console.log('setting', adapter.name, cached);
          return adapter.set(cached);
        });
        // TODO: catch?
      }
      return promise;
    }, $q.when());
  }

  // get DIM saved data
  function get(force) {
    // if we already have it and we're not forcing a sync
    if (cached && !force) {
      return $q.resolve(cached);
    }

    // TODO: get from all adapters, setting along the way?
    // TODO: this prefers local data always, even if remote data has changed!
    // TODO: old code looked bottom-up

    return adapters.reverse()
      .reduce((promise, adapter) => {
        if (adapter.enabled) {
          return promise.then((value) => {
            if (value) {
              console.log('got from previous', value);
              return value;
            }
            console.log('getting', adapter.name);
            return adapter.get();
          });
          // TODO: catch, set status
        }
        return promise;
      }, $q.when())
      .then((value) => {
        console.log("caching value", value);
        cached = value || {};
        return value;
      });
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
    // TODO: remove where possible, get/set elsewhere?
    return adapters.reduce((promise, adapter) => {
      if (adapter.enabled) {
        if (adapter.remove) {
          return promise.then(() => adapter.remove(key));
        }
        return promise.then(() => adapter.set(cached));
        // TODO: catch?
      }
      return promise;
    }, $q.when());
  }

  function init() {
    return GoogleDriveStorage.init();
  }


  return {
    authorizeGdrive: function() {
      return GoogleDriveStorage.authorize();
    },
    logoutGdrive: function() {
      return GoogleDriveStorage.revokeDrive();
    },
    get: get,
    set: set,
    remove: remove,
    init: init,
    adapters: adapters
  };
}
