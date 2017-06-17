import _ from 'underscore';

export function GoogleDriveStorage($q, $translate, OAuthTokenService) {
  'ngInject';

  return {
    drive: { // drive api data
      client_id: $GOOGLE_DRIVE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.appdata',
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
    },
    fileId: null,
    ready: $q.defer(),

    get: function() {
      return this.ready.promise
        .then(() => {
          if (!this.fileId) {
            // TODO: error handling
            throw new Error("no file!");
          }
          return gapi.client.drive.files.get({
            fileId: this.fileId,
            alt: 'media'
          });
        })
        .then((resp) => resp.result)
        .catch((e) => {
          // TODO: error handling
          // this.revokeDrive();
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
          return $q.when(gapi.client.request({
            path: '/upload/drive/v3/files/' + this.fileId,
            method: 'PATCH',
            params: {
              uploadType: 'media',
              alt: 'json'
            },
            body: value
          }))
            .then(() => value)
            .catch((resp) => {
              // TODO: error handling
              // this.revokeDrive();
              throw new Error('error saving. revoking drive: ' + resp.error);
            });
        });
    },

    updateSigninStatus: function(isSignedIn) {
      if (isSignedIn) {
        if ($featureFlags.debugSync) {
          console.log('signed in to Google Drive');
        }
        this.getFileId();
      } else {
        if ($featureFlags.debugSync) {
          console.log('not signed in to Google Drive');
        }
        this.enabled = false;
      }
    },

    init: function() {
      if (!$featureFlags.gdrive) {
        if ($featureFlags.debugSync) {
          console.log("Google Drive disabled");
        }
        return;
      }
      if ($featureFlags.debugSync) {
        console.log("gdrive init requested");
      }
      gapi.load('client:auth2', () => {
        gapi.client.init(this.drive).then(() => {
          if ($featureFlags.debugSync) {
            console.log("gdrive init complete");
          }
          // Listen for sign-in state changes.
          gapi.auth2.getAuthInstance().isSignedIn.listen(this.updateSigninStatus.bind(this));

          // Handle the initial sign-in state.
          this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
          this.ready.resolve();
        });
      });
    },

    authorize: function() {
      if (gapi.auth2.getAuthInstance().isSignedIn.get()) {
        if ($featureFlags.debugSync) {
          console.log('Google Drive already authorized');
        }
        return $q.when();
      } else {
        if ($featureFlags.debugSync) {
          console.log('authorizing Google Drive');
        }
        return gapi.auth2.getAuthInstance().signIn();
      }
    },

    getFileName: function() {
      // TODO: in the future wait for a promise or observable on this value
      const token = OAuthTokenService.getToken();
      if (token && token.bungieMembershipId) {
        return 'DIM-' + $DIM_FLAVOR + '-' + token.bungieMembershipId;
      }
      return null;
    },

    // load the file from google drive
    getFileId: function() {
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
        // TODO: localize
        // TODO: observe logged in / platforms and don't load before that
        return $q.reject(new Error("You're not logged in yet"));
      }

      // grab all of the list files
      return $q.when(gapi.client.drive.files.list({ spaces: 'appDataFolder' }))
        .then((list) => {
          if (!list.result || !list.result.files) {
            // TODO: error handling
            throw new Error("No files!");
          }

          const files = list.result.files;

          // look for the saved file.
          const file = _.find(files, { name: fileName });
          if (file) {
            this.fileId = file.id;
            return this.fileId;
          }

          // couldn't find the file, lets create a new one.
          return gapi.client.drive.files.create({
            name: fileName,
            media: {
              mimeType: 'application/json'
            },
            parents: ['appDataFolder']
          }).then((file) => {
            if ($featureFlags.debugSync) {
              console.log('created file in Google Drive', file);
            }
            this.fileId = file.result.id;
            return this.fileId;
          });
        })
        .then((fileId) => {
          localStorage.setItem('gdrive-fileid', fileId);
          this.enabled = true;
          return fileId;
        })
        .catch((e) => {
          // TODO: error handling
          console.error(e);
          throw new Error($translate.instant('SyncService.GoogleDriveReAuth'));
        });
    },

    revokeDrive: function() {
      console.log("revoking Google drive");
      this.fileId = undefined;
      this.enabled = false;
      localStorage.removeItem('gdrive-fileid');
      gapi.auth2.getAuthInstance().signOut();
    },

    supported: $featureFlags.gdrive,
    enabled: Boolean(localStorage.getItem('gdrive-fileid')),
    name: 'GoogleDriveStorage'
  };
}
