import { getToken } from '../oauth/oauth-token.service';
import { t } from 'i18next';
import { $q, $rootScope } from 'ngimport';
import { StorageAdapter, DimData } from './sync.service';
import { IPromise } from 'angular';

declare const gapi: any;
declare global {
  interface Window {
    gapi: any;
  }
}

export interface GDriveRevision {
  id: string;
  kind: 'drive#revision';
  mimeType: 'application/json';
  modifiedTime: string;
}

export class GoogleDriveStorage implements StorageAdapter {
  supported = $featureFlags.gdrive;
  // This means we enable gdrive at first, in case you're signed in, so we can block on loading it.
  enabled = Boolean(localStorage.getItem('gdrive-fileid'));
  name = 'GoogleDriveStorage';

  // drive api data
  drive = {
    client_id: $GOOGLE_DRIVE_CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/drive.appdata',
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    fetch_basic_profile: false,
    ux_mode: 'redirect',
    redirect_uri: `${window.location.origin}/gdrive-return.html`
  };

  // The Google Drive ID of the file we use to save data.
  fileId: string | null = null;

  // A promise that will be resolved when the Google Drive API is available
  ready: Promise<void>;
  readyResolve: () => void;

  constructor() {
    this.ready = new Promise((resolve) => (this.readyResolve = resolve));
  }

  get(): Promise<DimData> {
    return this.ready.then(() => {
      if (this.enabled) {
        return this._get();
      } else {
        return {};
      }
    });
  }

  // TODO: set a timestamp for merging?
  set(value: object): Promise<void> {
    return this.ready.then(() => {
      if (!this.enabled) {
        return;
      }
      return this.getFileId()
        .then((fileId) => {
          return $q.when(
            gapi.client.request({
              path: `/upload/drive/v3/files/${fileId}`,
              method: 'PATCH',
              params: {
                uploadType: 'media',
                alt: 'json'
              },
              body: value
            })
          );
        })
        .catch((resp) => {
          // TODO: error handling
          // this.revokeDrive();
          console.error('Error saving to Google Drive', resp);
          throw new Error(`error saving. ${gdriveErrorMessage(resp)}`);
        });
    });
  }

  /**
   * Bootstrap the Google Drive client libraries and
   * authentication. If the user has authed in the past, they are
   * automatically signed back in.
   */
  init() {
    if (!$featureFlags.gdrive) {
      if ($featureFlags.debugSync) {
        console.log('Google Drive disabled');
      }
      return;
    }
    if ($featureFlags.debugSync) {
      console.log('gdrive init requested');
    }

    if (window.gapi) {
      gapi.load('client:auth2', () => {
        gapi.client.init(this.drive).then(
          () => {
            if ($featureFlags.debugSync) {
              console.log('gdrive init complete');
            }
            const auth = gapi.auth2.getAuthInstance();
            if (!auth) {
              return $q.reject(
                new Error('GoogleDriveStorage: No auth instance - has it not initialized??')
              );
            }

            // Listen for sign-in state changes.
            auth.isSignedIn.listen(this.updateSigninStatus.bind(this));

            // Handle the initial sign-in state.
            return this.updateSigninStatus(auth.isSignedIn.get()).then(() => {
              if (auth.isSignedIn.get()) {
                // TODO: switch to observable/event-emitter
                $rootScope.$broadcast('gdrive-sign-in');
              }
              this.readyResolve();
            });
          },
          (e) => {
            console.warn('Google Auth Client failed to initialize: ', e.details);
          }
        );
      });
    } else {
      console.warn('Google Drive API blocked');
      this.enabled = false;
    }
  }

  /**
   * Log in to Google Drive.
   */
  authorize() {
    return this.ready.then(() => {
      const auth = gapi.auth2.getAuthInstance();
      if (!auth) {
        return $q.reject(
          new Error('GoogleDriveStorage: No auth instance - has it not initialized??')
        );
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
        return (
          auth
            .signIn()
            // This won't happen since we'll redirect
            .then(() => this.updateSigninStatus(true))
            .catch((e) => {
              throw new Error(`Failed to sign in to Google Drive: ${gdriveErrorMessage(e)}`);
            })
        );
      }
    });
  }

  /**
   * Generate a filename that is unique per DIM flavor and Bungie.net account.
   */
  getFileName() {
    // TODO: in the future wait for a promise or observable on this value
    const token = getToken();
    if (token && token.bungieMembershipId) {
      return `DIM-${$DIM_FLAVOR}-${token.bungieMembershipId}`;
    }
    return null;
  }

  /**
   * Get the ID (not the filename) of the file in Google Drive. We
   * may have to create it.
   */
  getFileId(): IPromise<string> {
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
      return $q.reject(new Error("GoogleDriveStorage: You're not logged in yet"));
    }

    // grab all of the list files
    return $q
      .when(gapi.client.drive.files.list({ spaces: 'appDataFolder' }))
      .then((list) => {
        if (!list.result || !list.result.files) {
          // TODO: error handling
          throw new Error('GoogleDriveStorage: No files!');
        }

        const files = list.result.files;

        // look for the saved file.
        const file: any = files.find((f) => f.name === fileName);
        if (file) {
          this.fileId = file.id;
          return this.fileId;
        }

        // couldn't find the file, lets create a new one.
        return gapi.client.drive.files
          .create({
            name: fileName,
            media: {
              mimeType: 'application/json'
            },
            parents: ['appDataFolder']
          })
          .then((file) => {
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
        throw new Error(t('SyncService.GoogleDriveReAuth'));
      });
  }

  /**
   * Sign out of Google Drive. We leave the file there, so if you
   * sign in again, we can restore those saved settings.
   */
  revokeDrive() {
    console.log('revoking Google drive');
    this.fileId = null;
    this.enabled = false;
    localStorage.removeItem('gdrive-fileid');
    gapi.auth2.getAuthInstance().signOut();
  }

  async getRevisions(): Promise<GDriveRevision[]> {
    try {
      await this.ready;
      const fileId = await this.getFileId();
      const revisions = await gapi.client.drive.revisions.list({ fileId });
      if (revisions.status === 200) {
        return revisions.result.revisions as GDriveRevision[];
      } else {
        throw new Error('Error getting revisions: ' + gdriveErrorMessage(revisions));
      }
    } catch (e) {
      throw new Error(
        `Unable to load GDrive revisions for ${this.fileId}: ${gdriveErrorMessage(e)}`
      );
    }
  }

  async getRevisionContent(revisionId: string): Promise<object> {
    await this.ready;
    try {
      const fileId = await this.getFileId();
      const file = await gapi.client.drive.revisions.get({
        fileId,
        revisionId,
        alt: 'media'
      });

      if (file.status === 200) {
        return file.result;
      } else {
        throw new Error('Error getting revisions: ' + gdriveErrorMessage(file));
      }
    } catch (e) {
      throw new Error(`Unable to load revision ${revisionId}: ${gdriveErrorMessage(e)}`);
    }
  }

  private _get(triedFallback = false): IPromise<string> {
    return this.getFileId()
      .then((fileId) => {
        return gapi.client.drive.files.get({
          fileId,
          alt: 'media'
        });
      })
      .then((resp) => resp.result)
      .catch((e) => {
        if (triedFallback || e.status !== 404) {
          console.error(`Unable to load GDrive file ${this.fileId}`);
          throw new Error(`GDrive Error: ${gdriveErrorMessage(e)}`);
        } else {
          this.fileId = null;
          localStorage.removeItem('gdrive-fileid');
          return this.getFileId().then(() => this._get(true));
        }
      });
  }

  /**
   * React to changes in sign-in status.
   */
  private updateSigninStatus(isSignedIn: boolean): IPromise<string | undefined> {
    if (isSignedIn) {
      if ($featureFlags.debugSync) {
        console.log('signed in to Google Drive');
      }
      this.enabled = true;
      return this.getFileId();
    } else {
      if ($featureFlags.debugSync) {
        console.log('not signed in to Google Drive');
      }
      this.enabled = false;
      return $q.resolve(undefined);
    }
  }
}

function gdriveErrorMessage(error) {
  if (error.result && error.result.error && error.result.error.message) {
    return error.result.error.message;
  }
  if (error.status) {
    return `${error.status} ${error.statusText}`;
  }
  if (error.message) {
    return error.message;
  }
  return 'Unknown error';
}
