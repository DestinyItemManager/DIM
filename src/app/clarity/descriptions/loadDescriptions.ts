import { loadObject, storeObject } from 'app/storage/object-store';
import { ThunkResult } from 'app/store/types';
import { errorLog } from 'app/utils/log';
import { dedupePromise } from 'app/utils/util';
import _ from 'lodash';
import * as actions from '../actions';
import { ClarityCharacterStats, ClarityStatsVersion } from './character-stats';
import { ClarityDescription, ClarityVersions } from './descriptionInterface';

const CLARITY_BASE = 'https://database-clarity.github.io/';
const urls = {
  descriptions: `${CLARITY_BASE}Live-Clarity-Database/descriptions/dim.json`,
  characterStats: `${CLARITY_BASE}Character-Stats/CharacterStatInfo-NI.json`,
  version: `${CLARITY_BASE}Live-Clarity-Database/versions.json`,
  statsVersion: `${CLARITY_BASE}Character-Stats/update.json`,
} as const;

const fetchClarity = async <T>(type: keyof typeof urls) => {
  const data = await fetch(urls[type]);
  if (!data.ok) {
    throw new Error(`failed to fetch ${type}`);
  }
  const json = (await data.json()) as T;
  if (_.isEmpty(json)) {
    throw new Error(`empty response JSON for ${type}`);
  }
  return json;
};

const fetchRemoteDescriptions = async (version: number) => {
  const descriptions = await fetchClarity<ClarityDescription>('descriptions');
  storeObject('clarity-descriptions', descriptions);
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
    const savedDescriptions = await loadObject<ClarityDescription>('clarity-descriptions');
    return (
      savedDescriptions ??
      // If IDB doesn't have the data (e.g. after deleting IDB but not localStorage), fetch it
      (liveVersion && (await fetchRemoteDescriptions(liveVersion.descriptions)))
    );
  }

  return undefined;
});

const fetchRemoteStats = async (version: number) => {
  const descriptions = await fetchClarity<ClarityCharacterStats>('characterStats');
  storeObject('clarity-characterStats', descriptions);
  localStorage.setItem('clarityStatsVersion', version.toString());
  return descriptions;
};

const loadClarityStats = dedupePromise(async (loadFromIndexedDB: boolean) => {
  const savedStatsVersion = Number(localStorage.getItem('clarityStatsVersion') ?? '0');
  let liveStatsVersion: ClarityStatsVersion | undefined;
  try {
    liveStatsVersion = await fetchClarity<ClarityStatsVersion>('statsVersion');
    if (savedStatsVersion !== liveStatsVersion.lastUpdate) {
      return await fetchRemoteStats(liveStatsVersion.lastUpdate);
    }
  } catch (e) {
    errorLog('clarity', 'failed to load remote character stats', e);
  }

  if (loadFromIndexedDB) {
    const savedCharacterStats = await loadObject<ClarityCharacterStats>('clarity-characterStats');
    return (
      savedCharacterStats ??
      // If IDB doesn't have the data (e.g. after deleting IDB but not localStorage), fetch it
      (liveStatsVersion && (await fetchRemoteStats(liveStatsVersion.lastUpdate)))
    );
  }

  return undefined;
});

/** Reload descriptions at most every 1 hour */
const descriptionReloadAfter = 60 * 60 * 1000;
let lastDescriptionUpdate = 0;
let lastStatsUpdate = 0;

/**
 * Load the Clarity database, either remotely or from the local cache.
 */
export function loadClarity(): ThunkResult {
  return async (dispatch, getState) => {
    const { descriptions, characterStats } = getState().clarity;

    // Load if it's been long enough, or if there aren't descriptions loaded.
    // The latter helps if there was an error loading them - it forces the next
    // refresh to try again.
    if (!descriptions || Date.now() - lastDescriptionUpdate > descriptionReloadAfter) {
      const newInfo = await loadClarityDescriptions(!descriptions);
      if (newInfo) {
        dispatch(actions.loadDescriptions(newInfo));
      }
      lastDescriptionUpdate = Date.now();
    }

    if (!characterStats || Date.now() - lastStatsUpdate > descriptionReloadAfter) {
      const newInfo = await loadClarityStats(!characterStats);
      if (newInfo) {
        dispatch(actions.loadCharacterStats(newInfo));
      }
      lastStatsUpdate = Date.now();
    }
  };
}
