import { HttpStatusError, toHttpStatusError } from 'app/bungie-api/http-client';
import { AllD1DestinyManifestComponents } from 'app/destiny1/d1-manifest-types';
import { settingsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { loadingEnd, loadingStart } from 'app/shell/actions';
import { del, get, set } from 'app/storage/idb-keyval';
import { ThunkResult } from 'app/store/types';
import { errorLog, infoLog } from 'app/utils/log';
import { convertToError, dedupePromise } from 'app/utils/util';
import { showNotification } from '../notifications/notifications';
import { settingsReady } from '../settings/settings';
import { reportException } from '../utils/exceptions';

// This file exports D1ManifestService at the bottom of the
// file (TS wants us to declare classes before using them)!

// Testing flags
const alwaysLoadRemote = false;

const manifestLangs = new Set(['en', 'fr', 'es', 'de', 'it', 'ja', 'pt-br']);
const localStorageKey = 'd1-manifest-version';
const idbKey = 'd1-manifest';
let version: string | null = null;

const getManifestAction: ThunkResult<AllD1DestinyManifestComponents> = dedupePromise((dispatch) =>
  dispatch(doGetManifest())
);

export function getManifest(): ThunkResult<AllD1DestinyManifestComponents> {
  return getManifestAction;
}

function doGetManifest(): ThunkResult<AllD1DestinyManifestComponents> {
  return async (dispatch) => {
    dispatch(loadingStart(t('Manifest.Load')));
    try {
      const manifest = await dispatch(loadManifest());
      if (!manifest.DestinyVendorDefinition) {
        throw new Error('Manifest corrupted, please reload');
      }
      return manifest;
    } catch (err) {
      const e = convertToError(err);
      let message = e.message;

      if (e instanceof TypeError || (e instanceof HttpStatusError && e.status === -1)) {
        message = navigator.onLine
          ? t('BungieService.NotConnectedOrBlocked')
          : t('BungieService.NotConnected');
      } else if (e instanceof HttpStatusError) {
        if (e.status === 503 || e.status === 522 /* cloudflare */) {
          message = t('BungieService.Difficulties');
        } else if (e.status < 200 || e.status >= 400) {
          message = t('BungieService.NetworkError', {
            status: e.status,
            statusText: e.message,
          });
        }
      } else {
        // Something may be wrong with the manifest
        deleteManifestFile();
      }

      const statusText = t('Manifest.Error', { error: message });
      errorLog('manifest', 'Manifest loading error', { error: e }, e);
      reportException('manifest load', e);
      throw new Error(statusText);
    } finally {
      dispatch(loadingEnd(t('Manifest.Load')));
    }
  };
}

function loadManifest(): ThunkResult<AllD1DestinyManifestComponents> {
  return async (dispatch, getState) => {
    await settingsReady; // wait for settings to be ready
    const language = settingsSelector(getState()).language;
    const manifestLang = manifestLangs.has(language) ? language : 'en';
    const path = `/data/d1/manifests/d1-manifest-${manifestLang}.json?v=2021-12-05`;

    // Use the path as the version
    version = path;

    try {
      return await loadManifestFromCache(version);
    } catch (e) {
      return await dispatch(loadManifestRemote(version, path));
    }
  };
}

/**
 * Returns a promise for the manifest data as a Uint8Array. Will cache it on success.
 */
function loadManifestRemote(
  version: string,
  path: string
): ThunkResult<AllD1DestinyManifestComponents> {
  return async (dispatch) => {
    dispatch(loadingStart(t('Manifest.Download')));

    try {
      const response = await fetch(path);
      const manifest = await (response.ok
        ? (response.json() as Promise<AllD1DestinyManifestComponents>)
        : Promise.reject(await toHttpStatusError(response)));

      // We intentionally don't wait on this promise
      saveManifestToIndexedDB(manifest, version);

      return manifest;
    } finally {
      dispatch(loadingEnd(t('Manifest.Download')));
    }
  };
}

async function saveManifestToIndexedDB(typedArray: unknown, version: string) {
  try {
    await set(idbKey, typedArray);
    infoLog('manifest', `Successfully stored manifest file.`);
    localStorage.setItem(localStorageKey, version);
  } catch (e) {
    errorLog('manifest', 'Error saving manifest file', e);
    showNotification({
      title: t('Help.NoStorage'),
      body: t('Help.NoStorageMessage'),
      type: 'error',
    });
  }
}

function deleteManifestFile() {
  localStorage.removeItem(localStorageKey);
  del(idbKey);
}

/**
 * Returns a promise for the cached manifest of the specified
 * version as a Uint8Array, or rejects.
 */
async function loadManifestFromCache(version: string): Promise<AllD1DestinyManifestComponents> {
  if (alwaysLoadRemote) {
    throw new Error('Testing - always load remote');
  }

  const currentManifestVersion = localStorage.getItem(localStorageKey);
  if (currentManifestVersion === version) {
    const manifest = await get<AllD1DestinyManifestComponents>(idbKey);
    if (!manifest) {
      throw new Error('Empty cached manifest file');
    }
    return manifest;
  } else {
    throw new Error(`version mismatch: ${version} ${currentManifestVersion}`);
  }
}
