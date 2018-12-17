import { getToken } from '../oauth/oauth-token.service';
import { t } from 'i18next';
import { StorageAdapter, DimData } from './sync.service';
import { Subject } from 'rxjs/Subject';

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

export interface DriveAboutResource {
  user: {
    displayName?: string;
    photoLink?: string;
    emailAddress?: string;
  };
  storageQuota: {
    limit?: number;
    usage: number;
    dimQuotaUsed?: number;
  };
}

export class GoogleDriveStorage implements StorageAdapter {
  readonly name = 'GoogleDriveStorage';
  readonly supported = $featureFlags.gdrive;

  signIn$ = new Subject();
  enabled$ = new Subject<boolean>();

  get enabled(): boolean {
    return this._enabled;
  }
  set enabled(val) {
    this._enabled = val;
    this.enabled$.next(val);
  }

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

  private _enabled: boolean;

  constructor() {
    this.ready = new Promise((resolve) => (this.readyResolve = resolve));
    // This means we enable gdrive at first, in case you're signed in, so we can block on loading it.
    this.enabled = Boolean(localStorage.getItem('gdrive-fileid'));
  }

  async get(): Promise<DimData> {
    await this.ready;
    if (this.enabled) {
      return this._get();
    } else {
      return {};
    }
  }

  // TODO: set a timestamp for merging?
  async set(value: object): Promise<void> {
    await this.ready;
    if (!this.enabled) {
      return;
    }
    try {
      const fileId = await this.getFileId();
      return await gapi.client.request({
        path: `/upload/drive/v3/files/${fileId}`,
        method: 'PATCH',
        params: {
          uploadType: 'media',
          alt: 'json'
        },
        body: value
      });
    } catch (resp) {
      // TODO: error handling
      // this.revokeDrive();
      console.error('Error saving to Google Drive', resp);
      throw new Error(`error saving. ${gdriveErrorMessage(resp)}`);
    }
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
              throw new Error('GoogleDriveStorage: No auth instance - has it not initialized??');
            }

            // Listen for sign-in state changes.
            auth.isSignedIn.listen(this.updateSigninStatus.bind(this));

            // Handle the initial sign-in state.
            return this.updateSigninStatus(auth.isSignedIn.get()).then(() => {
              if (auth.isSignedIn.get()) {
                this.signIn$.next();
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
  async authorize() {
    await this.ready;
    const auth = gapi.auth2.getAuthInstance();
    if (!auth) {
      throw new Error('GoogleDriveStorage: No auth instance - has it not initialized??');
    }

    if (auth.isSignedIn.get()) {
      if ($featureFlags.debugSync) {
        console.log('Google Drive already authorized');
      }
      return;
    } else {
      if ($featureFlags.debugSync) {
        console.log('authorizing Google Drive');
      }

      try {
        await auth.signIn();
        // This won't happen since we'll redirect
        await this.updateSigninStatus(true);
      } catch (e) {
        throw new Error(`Failed to sign in to Google Drive: ${gdriveErrorMessage(e)}`);
      }
    }
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
  async getFileId(): Promise<string> {
    // if we already have the fileId, just return.
    if (this.fileId) {
      return this.fileId;
    }

    this.fileId = localStorage.getItem('gdrive-fileid');
    if (this.fileId) {
      return this.fileId;
    }

    const fileName = this.getFileName();

    if (!fileName) {
      // TODO: localize
      // TODO: observe logged in / platforms and don't load before that
      throw new Error("GoogleDriveStorage: You're not logged in yet");
    }

    // grab all of the list files
    try {
      const list = await gapi.client.drive.files.list({ spaces: 'appDataFolder' });
      if (!list.result || !list.result.files) {
        // TODO: error handling
        throw new Error(
          `GoogleDriveStorage: No list files response! Response was: ${JSON.stringify(list)}`
        );
      }

      const files = list.result.files;

      // look for the saved file.
      let file = files.find((f) => f.name === fileName);
      if (file) {
        this.fileId = file.id;
        return this.fileId!;
      }

      // couldn't find the file, lets create a new one.
      file = await gapi.client.drive.files.create({
        name: fileName,
        media: {
          mimeType: 'application/json'
        },
        parents: ['appDataFolder']
      });
      if ($featureFlags.debugSync) {
        console.log('created file in Google Drive', file);
      }
      this.fileId = file.result.id;
      return this.fileId!;
    } catch (e) {
      // TODO: error handling
      console.error(e);
      throw new Error(t('SyncService.GoogleDriveReAuth'));
    } finally {
      if (this.fileId) {
        localStorage.setItem('gdrive-fileid', this.fileId);
        this.enabled = true;
      }
    }
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

  // https://developers.google.com/drive/api/v3/reference/about#resource
  async getDriveInfo(): Promise<DriveAboutResource> {
    await this.ready;
    try {
      const result = await gapi.client.drive.about.get({ fields: 'user,storageQuota' });
      try {
        const quotaUsed = await this.getQuotaUsed();
        if (quotaUsed) {
          result.result.storageQuota.dimQuotaUsed = parseInt(quotaUsed.quotaBytesUsed, 10);
        }
      } catch (e) {
        console.error(`Couldn't get quota: ${gdriveErrorMessage(e)}`);
      }
      return result.result;
    } catch (e) {
      throw new Error(`Unable to get Google Drive info: ${gdriveErrorMessage(e)}`);
    }
  }

  private async _get(triedFallback = false): Promise<DimData> {
    try {
      const fileId = await this.getFileId();
      const resp = await gapi.client.drive.files.get({
        fileId,
        alt: 'media'
      });
      return resp.result;
    } catch (e) {
      if (triedFallback || e.status !== 404) {
        console.error(`Unable to load GDrive file ${this.fileId}`);
        throw new Error(`GDrive Error: ${gdriveErrorMessage(e)}`);
      } else {
        this.fileId = null;
        localStorage.removeItem('gdrive-fileid');
        return this.getFileId().then(() => this._get(true));
      }
    }
  }

  private async getQuotaUsed(): Promise<DimData> {
    try {
      const fileId = await this.getFileId();
      const resp = await gapi.client.drive.files.get({
        fileId,
        fields: 'quotaBytesUsed'
      });
      return resp.result;
    } catch (e) {
      if (e.status !== 404) {
        console.error(`Unable to load GDrive file ${this.fileId}`);
        throw new Error(`GDrive Error: ${gdriveErrorMessage(e)}`);
      } else {
        this.fileId = null;
        localStorage.removeItem('gdrive-fileid');
        return this.getFileId().then(() => this._get(true));
      }
    }
  }

  /**
   * React to changes in sign-in status.
   */
  private async updateSigninStatus(isSignedIn: boolean): Promise<string | undefined> {
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
