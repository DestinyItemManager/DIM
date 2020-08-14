import _ from 'lodash';
import { get, set, del } from 'idb-keyval';

import { reportException } from '../utils/exceptions';
import { settingsReady } from '../settings/settings';
import { t } from 'app/i18next-t';
import { showNotification } from '../notifications/notifications';
import { settingsSelector } from 'app/settings/reducer';
import { loadingEnd, loadingStart } from 'app/shell/actions';
import { ThunkResult } from 'app/store/types';
import { dedupePromise } from 'app/utils/util';

// This file exports D1ManifestService at the bottom of the
// file (TS wants us to declare classes before using them)!

// Testing flags
const alwaysLoadRemote = false;

const manifestLangs = new Set(['en', 'fr', 'es', 'de', 'it', 'ja', 'pt-br']);
const localStorageKey = 'd1-manifest-version';
const idbKey = 'd1-manifest';
let version: string | null = null;

const getManifestAction: ThunkResult<object> = dedupePromise((dispatch) =>
  dispatch(doGetManifest())
);

export function getManifest(): ThunkResult<object> {
  return getManifestAction;
}

function doGetManifest(): ThunkResult<object> {
  return async (dispatch) => {
    dispatch(loadingStart(t('Manifest.Load')));
    try {
      const manifest = await dispatch(loadManifest());
      if (!manifest.DestinyVendorDefinition) {
        throw new Error('Manifest corrupted, please reload');
      }
      return manifest;
    } catch (e) {
      let message = e.message || e;

      if (e instanceof TypeError || e.status === -1) {
        message = navigator.onLine
          ? t('BungieService.NotConnectedOrBlocked')
          : t('BungieService.NotConnected');
      } else if (e.status === 503 || e.status === 522 /* cloudflare */) {
        message = t('BungieService.Difficulties');
      } else if (e.status < 200 || e.status >= 400) {
        message = t('BungieService.NetworkError', {
          status: e.status,
          statusText: e.statusText,
        });
      } else {
        // Something may be wrong with the manifest
        deleteManifestFile();
      }

      const statusText = t('Manifest.Error', { error: message });
      console.error('Manifest loading error', { error: e }, e);
      reportException('manifest load', e);
      throw new Error(statusText);
    } finally {
      dispatch(loadingEnd(t('Manifest.Load')));
    }
  };
}

function loadManifest(): ThunkResult<any> {
  return async (dispatch, getState) => {
    await settingsReady; // wait for settings to be ready
    const language = settingsSelector(getState()).language;
    const manifestLang = manifestLangs.has(language) ? language : 'en';
    const path = `/data/d1/manifests/d1-manifest-${manifestLang}.json?v=2020-02-17`;

    // Use the path as the version
    version = path;

    try {
      return await loadManifestFromCache(version);
    } catch (e) {
      return dispatch(loadManifestRemote(version, path));
    }
  };
}

/**
 * Returns a promise for the manifest data as a Uint8Array. Will cache it on succcess.
 */
function loadManifestRemote(version: string, path: string): ThunkResult<object> {
  return async (dispatch) => {
    dispatch(loadingStart(t('Manifest.Download')));

    try {
      const response = await fetch(path);
      const manifest = await (response.ok ? response.json() : Promise.reject(response));

      // We intentionally don't wait on this promise
      saveManifestToIndexedDB(manifest, version);

      return manifest;
    } finally {
      dispatch(loadingEnd(t('Manifest.Download')));
    }
  };
}

// This is not an anonymous arrow function inside loadManifestRemote because of https://bugs.webkit.org/show_bug.cgi?id=166879
async function saveManifestToIndexedDB(typedArray: object, version: string) {
  try {
    await set(idbKey, typedArray);
    console.log(`Sucessfully stored manifest file.`);
    localStorage.setItem(localStorageKey, version);
  } catch (e) {
    console.error('Error saving manifest file', e);
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
async function loadManifestFromCache(version: string): Promise<object> {
  if (alwaysLoadRemote) {
    throw new Error('Testing - always load remote');
  }

  const currentManifestVersion = localStorage.getItem(localStorageKey);
  if (currentManifestVersion === version) {
    const manifest = await get<object>(idbKey);
    if (!manifest) {
      throw new Error('Empty cached manifest file');
    }
    return manifest;
  } else {
    throw new Error(`version mismatch: ${version} ${currentManifestVersion}`);
  }
}
