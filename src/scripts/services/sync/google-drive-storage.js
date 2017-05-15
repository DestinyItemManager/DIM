import _ from 'underscore';

export function GoogleDriveStorage($q, $translate, dimState, dimFeatureFlags) {
  'ngInject';

  return {
    drive: { // drive api data
      client_id: $GOOGLE_DRIVE_CLIENT_ID,
      scope: 'https://www.googleapis.com/auth/drive.appdata',
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"]
    },
    fileId: null,
    ready: $q.defer(),
    // TODO: onEnabled

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
        .then((resp) => {
          console.log('got from gdrive', resp);
          return resp.result;
        })
        .catch((e) => {
          // this.revokeDrive();
          throw e;
        });
    },

    // TODO: set a timestamp for merging?
    set: function(value) {
      console.log("set in gdrive", value);
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
            .then((resp) => {
              console.log("saved to GDrive!", value, resp);
              return value;
            })
            .catch((resp) => {
              //this.revokeDrive();
              throw new Error('error saving. revoking drive: ' + resp.error);
            });
        });
    },

    updateSigninStatus: function(isSignedIn) {
      if (isSignedIn) {
        console.log('signed in to gdrive');
        this.getFileId();
      } else {
        console.log('not signed in to gdrive');
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
        return $q.when();
      } else {
        console.log('authorizing');
        return gapi.auth2.getAuthInstance().signIn();
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
}
