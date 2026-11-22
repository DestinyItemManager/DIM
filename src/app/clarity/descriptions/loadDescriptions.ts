import { get, set } from 'app/storage/idb-keyval';
import { ThunkResult } from 'app/store/types';
import { isEmpty } from 'app/utils/collections';
import { errorLog } from 'app/utils/log';
import { dedupePromise } from 'app/utils/promises';
import * as actions from '../actions';
import { ClarityDescription, ClarityVersions } from './descriptionInterface';

const CLARITY_BASE = 'https://database-clarity.github.io/';

const urls = {
  descriptions: `${CLARITY_BASE}Live-Clarity-Database/descriptions/dim.json`,
  version: `${CLARITY_BASE}Live-Clarity-Database/versions.json`,
} as const;

const fetchClarity = async <T>(type: keyof typeof urls) => {
  const url = urls[type];
  const data = await fetch(url);
  if (!data.ok) {
    throw new Error(`failed to fetch ${type}`);
  }
  const json = (await data.json()) as T;
  if (!json || isEmpty(json)) {
    throw new Error(`empty response JSON for ${type}`);
  }
  return json;
};

const fetchRemoteDescriptions = async (version: number) => {
  const descriptions = await fetchClarity<ClarityDescription>('descriptions');
  set('clarity-descriptions', descriptions);
  localStorage.setItem('clarityDescriptionVersion', version.toString());
  return descriptions;
};

const loadClarityDescriptions = dedupePromise(async (loadFromIndexedDB: boolean) => {
  const savedVersion = Number(localStorage.getItem('clarityDescriptionVersion') ?? '0');
  let liveVersion: ClarityVersions | undefined;
  try {
    liveVersion = await fetchClarity<ClarityVersions>('version');
    if (savedVersion !== liveVersion.descriptions) {
      return await fetchRemoteDescriptions(liveVersion.descriptions);
    }
  } catch (e) {
    errorLog('clarity', 'failed to load remote descriptions', e);
  }

  if (loadFromIndexedDB) {
    const savedDescriptions = await get<ClarityDescription>('clarity-descriptions');
    return (
      savedDescriptions ??
      // If IDB doesn't have the data (e.g. after deleting IDB but not localStorage), fetch it
      (liveVersion && (await fetchRemoteDescriptions(liveVersion.descriptions)))
    );
  }

  return undefined;
});

/** Reload descriptions at most every 1 hour */
const descriptionReloadAfter = 60 * 60 * 1000;
let lastDescriptionUpdate = 0;

/**
 * Load the Clarity database, either remotely or from the local cache.
 */
export function loadClarity(): ThunkResult {
  return async (dispatch, getState) => {
    const { descriptions } = getState().clarity;

    // Load if it's been long enough, or if there aren't descriptions loaded.
    // The latter helps if there was an error loading them - it forces the next
    // refresh to try again.
    if (!descriptions || Date.now() - lastDescriptionUpdate > descriptionReloadAfter) {
      // Clarity is an optional enhancement loaded from GitHub Pages, which can be flaky.
      // Swallow any failure so it doesn't become an unhandled rejection (loadClarity is
      // dispatched without awaiting) - DIM works fine with whatever Clarity data it has.
      try {
        const newInfo = await loadClarityDescriptions(!descriptions);
        if (newInfo) {
          dispatch(actions.loadDescriptions(newInfo));
        }
      } catch (e) {
        errorLog('clarity', 'failed to load descriptions', e);
      }
      lastDescriptionUpdate = Date.now();
    }
  };
}
