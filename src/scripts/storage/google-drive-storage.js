import _ from 'underscore';

export function GoogleDriveStorage($q, $translate, OAuthTokenService) {
  'ngInject';

  return {
    // drive api data
    drive: {
      client_id: $GOOGLE_DRIVE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.appdata',
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
    },

    // The Google Drive ID of the file we use to save data.
    fileId: null,

    // A promise that will be resolved when the Google Drive API is available
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
            path: `/upload/drive/v3/files/${this.fileId}`,
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
              throw new Error(`error saving. ${resp.error}`);
            });
        });
    },

    /**
     * React to changes in sign-in status.
     */
    updateSigninStatus: function(isSignedIn) {
      if (isSignedIn) {
        if ($featureFlags.debugSync) {
          console.log('signed in to Google Drive');
        }
        return this.getFileId();
      } else {
        if ($featureFlags.debugSync) {
          console.log('not signed in to Google Drive');
        }
        this.enabled = false;
        return $q.resolve();
      }
    },

    /**
     * Bootstrap the Google Drive client libraries and
     * authentication. If the user has authed in the past, they are
     * automatically signed back in.
     */
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
          const auth = gapi.auth2.getAuthInstance();
          if (!auth) {
            return $q.reject(new Error("No auth instance - has it not initialized??"));
          }

          // Listen for sign-in state changes.
          auth.isSignedIn.listen(this.updateSigninStatus.bind(this));

          // Handle the initial sign-in state.
          return this.updateSigninStatus(auth.isSignedIn.get()).then(() => this.ready.resolve());
        });
      });
    },

    /**
     * Log in to Google Drive.
     */
    authorize: function() {
      return this.ready.promise.then(() => {
        const auth = gapi.auth2.getAuthInstance();
        if (!auth) {
          return $q.reject(new Error("No auth instance - has it not initialized??"));
        }

        if (auth.isSignedIn.get()) {
          if ($featureFlags.debugSync) {
            console.log('Google Drive already authorized');
          }
          return $q.when();
        } else {
          if ($featureFlags.debugSync) {
            console.log('authorizing Google Drive');
          }
          return auth.signIn();
        }
      });
    },

    /**
     * Generate a filename that is unique per DIM flavor and Bungie.net account.
     */
    getFileName: function() {
      // TODO: in the future wait for a promise or observable on this value
      const token = OAuthTokenService.getToken();
      if (token && token.bungieMembershipId) {
        return `DIM-${$DIM_FLAVOR}-${token.bungieMembershipId}`;
      }
      return null;
    },

    /**
     * Get the ID (not the filename) of the file in Google Drive. We
     * may have to create it.
     */
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

    /**
     * Sign out of Google Drive. We leave the file there, so if you
     * sign in again, we can restore those saved settings.
     */
    revokeDrive: function() {
      console.log("revoking Google drive");
      this.fileId = undefined;
      this.enabled = false;
      localStorage.removeItem('gdrive-fileid');
      gapi.auth2.getAuthInstance().signOut();
    },

    supported: $featureFlags.gdrive && !(window.chrome && window.chrome.extension),
    enabled: Boolean(localStorage.getItem('gdrive-fileid')),
    name: 'GoogleDriveStorage'
  };
}
