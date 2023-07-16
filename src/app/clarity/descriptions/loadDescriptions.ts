import { get, set } from 'app/storage/idb-keyval';
import { ThunkResult } from 'app/store/types';
import { errorLog } from 'app/utils/log';
import { dedupePromise } from 'app/utils/util';
import _ from 'lodash';
import * as actions from '../actions';
import { ClarityCharacterStats, ClarityStatsVersion } from './character-stats';
import { ClarityDescription, ClarityVersions } from './descriptionInterface';

const CLARITY_BASE = 'https://database-clarity.github.io/';
const urls = {
  descriptions: CLARITY_BASE + 'Live-Clarity-Database/descriptions/dim.json',
  characterStats: CLARITY_BASE + 'Character-Stats/CharacterStatInfo-NI.json',
  version: CLARITY_BASE + 'Live-Clarity-Database/versions.json',
  statsVersion: CLARITY_BASE + 'Character-Stats/update.json',
} as const;

const fetchClarity = async (type: keyof typeof urls) => {
  const data = await fetch(urls[type]);
  if (!data.ok) {
    throw new Error('failed to fetch ' + type);
  }
  const json = await data.json();
  if (_.isEmpty(json)) {
    throw new Error('empty response JSON for ' + type);
  }
  return json;
};

const loadClarityDescriptions = dedupePromise(async (loadFromIndexedDB) => {
  const savedVersion = Number(localStorage.getItem('clarityDescriptionVersion') ?? '0');

  try {
    const liveVersion: ClarityVersions = await fetchClarity('version');
    if (savedVersion !== liveVersion.descriptions) {
      const descriptions: ClarityDescription = await fetchClarity('descriptions');
      set('clarity-descriptions', descriptions);
      localStorage.setItem('clarityDescriptionVersion', liveVersion.descriptions.toString());
      return descriptions;
    }
  } catch (e) {
    errorLog('clarity', 'failed to load remote descriptions', e);
  }

  if (loadFromIndexedDB) {
    const savedDescriptions = await get<ClarityDescription>('clarity-descriptions');
    return savedDescriptions;
  }

  return undefined;
});

const loadClarityStats = dedupePromise(async (loadFromIndexedDB) => {
  const savedStatsVersion = Number(localStorage.getItem('clarityStatsVersion') ?? '0');

  try {
    const liveStatsVersion: ClarityStatsVersion = await fetchClarity('statsVersion');
    if (savedStatsVersion !== liveStatsVersion.lastUpdate) {
      const characterStats: ClarityCharacterStats = await fetchClarity('characterStats');
      set('clarity-characterStats', characterStats);
      localStorage.setItem(
        'clarityDescriptionVersion',
        liveStatsVersion.lastBreakingChange.toString()
      );
      return characterStats;
    }
  } catch (e) {
    errorLog('clarity', 'failed to load remote descriptions', e);
  }

  if (loadFromIndexedDB) {
    const savedCharacterStats = await get<ClarityCharacterStats>('clarity-characterStats');
    return savedCharacterStats;
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
