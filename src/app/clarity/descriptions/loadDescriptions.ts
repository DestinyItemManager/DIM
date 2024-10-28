import { get, set } from 'app/storage/idb-keyval';
import { ThunkResult } from 'app/store/types';
import { isEmpty } from 'app/utils/collections';
import { errorLog } from 'app/utils/log';
import { dedupePromise } from 'app/utils/promises';
import * as actions from '../actions';
import { ClarityCharacterStats, ClarityStatsVersion } from './character-stats';
import { ClarityDescription, ClarityVersions } from './descriptionInterface';

const CLARITY_BASE = 'https://database-clarity.github.io/';
const urls = {
  descriptions: `${CLARITY_BASE}Live-Clarity-Database/descriptions/dim.json`,
  characterStats: (version: string) =>
    `${CLARITY_BASE}Character-Stats/versions/${version}/CharacterStatInfo-NI.json`,
  version: `${CLARITY_BASE}Live-Clarity-Database/versions.json`,
  statsVersion: `${CLARITY_BASE}Character-Stats/update.json`,
} as const;

const CLARITY_STATS_SUPPORTED_SCHEMA = '1.9';

const fetchClarity = async <T>(type: keyof typeof urls, version?: string) => {
  const url = urls[type];
  const data = await fetch(typeof url === 'function' ? url(version!) : url);
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

const fetchRemoteStats = async (version: ClarityStatsVersion) => {
  const descriptions = await fetchClarity<ClarityCharacterStats>(
    'characterStats',
    version.schemaVersion,
  );
  set('clarity-characterStats', descriptions);
  localStorage.setItem('clarityStatsVersion2', JSON.stringify(version));
  return descriptions;
};

const loadClarityStats = dedupePromise(async (loadFromIndexedDB: boolean) => {
  const savedStatsValue = localStorage.getItem('clarityStatsVersion2');
  const savedStats =
    savedStatsValue !== null ? (JSON.parse(savedStatsValue) as ClarityStatsVersion) : undefined;
  let liveStatsVersion: ClarityStatsVersion | undefined;
  try {
    liveStatsVersion = await fetchClarity<ClarityStatsVersion>('statsVersion');
    if (
      liveStatsVersion.schemaVersion === CLARITY_STATS_SUPPORTED_SCHEMA &&
      (!savedStats || savedStats.lastUpdate !== liveStatsVersion.lastUpdate)
    ) {
      // There's been a live update and we support the update's schema -- fetch it
      return await fetchRemoteStats(liveStatsVersion);
    }
  } catch (e) {
    errorLog('clarity', 'failed to load remote character stats', e);
  }

  if (loadFromIndexedDB) {
    if (savedStats?.schemaVersion === CLARITY_STATS_SUPPORTED_SCHEMA) {
      const savedCharacterStats = await get<ClarityCharacterStats>('clarity-characterStats');
      if (savedCharacterStats) {
        return savedCharacterStats;
      }
    }

    // If IDB doesn't have the data (e.g. after deleting IDB but not localStorage),
    // or our IDB data has an unsupported schema version, fetch whatever we need
    const remoteToFetch =
      liveStatsVersion?.schemaVersion === CLARITY_STATS_SUPPORTED_SCHEMA
        ? liveStatsVersion
        : // NB if we're an old app release and don't support the most recent schema,
          // we don't get a useful `lastUpdate` value anyway, and we'll never
          // use this `lastUpdate` to decide when to re-fetch -- outdated apps
          // use whatever they have in IDB, only fetching if there's nothing useful in IDB
          { schemaVersion: CLARITY_STATS_SUPPORTED_SCHEMA, lastUpdate: 0 };
    return fetchRemoteStats(remoteToFetch);
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
