import { handleErrors } from 'app/bungie-api/bungie-service-helper';
import { HttpStatusError, toHttpStatusError } from 'app/bungie-api/http-client';
import { AllD1DestinyManifestComponents } from 'app/destiny1/d1-manifest-types';
import { settingsSelector } from 'app/dim-api/selectors';
import { t } from 'app/i18next-t';
import { loadingEnd, loadingStart } from 'app/shell/actions';
import { del, get, set } from 'app/storage/idb-keyval';
import { ThunkResult } from 'app/store/types';
import { DimError } from 'app/utils/dim-error';
import { convertToError } from 'app/utils/errors';
import { errorLog, infoLog } from 'app/utils/log';
import { dedupePromise } from 'app/utils/promises';
import { reportException } from 'app/utils/sentry';
import { showNotification } from '../notifications/notifications';
import { settingsReady } from '../settings/settings';

const TAG = 'manifest';

// This file exports D1ManifestService at the bottom of the
// file (TS wants us to declare classes before using them)!

// Testing flags
const alwaysLoadRemote = false;

const manifestLangs = new Set(['en', 'fr', 'es', 'de', 'it', 'ja', 'pt-br']);
const localStorageKey = 'd1-manifest-version';
const idbKey = 'd1-manifest';
let version: string | null = null;

const getManifestAction: ThunkResult<AllD1DestinyManifestComponents> = dedupePromise((dispatch) =>
  dispatch(doGetManifest()),
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
      let e = convertToError(err);
      if (e instanceof DimError && e.cause) {
        e = e.cause;
      }
      if (e.cause instanceof TypeError || e.cause instanceof HttpStatusError) {
      } else {
        // Something may be wrong with the manifest
        deleteManifestFile();
      }

      errorLog(TAG, 'Manifest loading error', e);
      reportException('manifest load', e);
      throw new DimError('Manifest.Error', t('Manifest.Error', { error: e.message })).withError(e);
    } finally {
      dispatch(loadingEnd(t('Manifest.Load')));
    }
  };
}

// Bump this when the manifest files or split format change to invalidate cached copies.
const manifestVersionStamp = 'split-2024-04-19';

function loadManifest(): ThunkResult<AllD1DestinyManifestComponents> {
  return async (dispatch, getState) => {
    await settingsReady; // wait for settings to be ready
    const language = settingsSelector(getState()).language;
    const manifestLang = manifestLangs.has(language) ? language : 'en';

    // The manifest is split into a language-independent base (hashes, stats, etc.) and a small
    // per-language strings overlay (names, descriptions, ...). We download both and merge them
    // back into a full manifest. This avoids shipping the large numeric data once per language.
    const basePath = `/data/d1/manifests/d1-manifest-base.json?v=${manifestVersionStamp}`;
    const stringsPath = `/data/d1/manifests/d1-manifest-strings-${manifestLang}.json?v=${manifestVersionStamp}`;

    // The cached, merged manifest is keyed by the version stamp + language.
    version = `${manifestVersionStamp}-${manifestLang}`;

    try {
      return await loadManifestFromCache(version);
    } catch {
      return dispatch(loadManifestRemote(version, basePath, stringsPath));
    }
  };
}

/**
 * Deep-merges a per-language strings overlay onto the shared base manifest, reconstructing a full
 * manifest. Mirrors the split logic in build/split-d1-manifests.js:
 *  - objects merge per key (a key lives in exactly one of base/strings),
 *  - arrays merge per index, where a `null` strings slot means "use the base value".
 */
function mergeManifest(base: any, strings: any): any {
  if (strings === undefined) {
    return base;
  }
  if (Array.isArray(base) && Array.isArray(strings)) {
    return strings.map((s, i) => (s === null ? base[i] : mergeManifest(base[i], s)));
  }
  if (
    base &&
    typeof base === 'object' &&
    !Array.isArray(base) &&
    strings &&
    typeof strings === 'object' &&
    !Array.isArray(strings)
  ) {
    const out = { ...base };
    for (const k of Object.keys(strings)) {
      out[k] = mergeManifest(base[k], strings[k]);
    }
    return out;
  }
  return strings;
}

/**
 * Downloads the base manifest and the language-specific strings, merges them, and caches the
 * resulting full manifest.
 */
function loadManifestRemote(
  version: string,
  basePath: string,
  stringsPath: string,
): ThunkResult<AllD1DestinyManifestComponents> {
  return async (dispatch) => {
    dispatch(loadingStart(t('Manifest.Download')));

    try {
      const [base, strings] = await Promise.all([fetchJson(basePath), fetchJson(stringsPath)]);
      const manifest = mergeManifest(base, strings) as AllD1DestinyManifestComponents;

      // We intentionally don't wait on this promise
      saveManifestToIndexedDB(manifest, version);

      return manifest;
    } catch (e) {
      handleErrors(e); // throws
    } finally {
      dispatch(loadingEnd(t('Manifest.Download')));
    }
  };
}

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(path);
  if (!response.ok) {
    throw await toHttpStatusError(response);
  }
  return response.json();
}

async function saveManifestToIndexedDB(typedArray: unknown, version: string) {
  try {
    await set(idbKey, typedArray);
    infoLog(TAG, `Successfully stored manifest file.`);
    localStorage.setItem(localStorageKey, version);
  } catch (e) {
    errorLog(TAG, 'Error saving manifest file', e);
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
