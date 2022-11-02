import { get, set } from 'app/storage/idb-keyval';
import { ThunkResult } from 'app/store/types';
import { errorLog } from 'app/utils/log';
import { dedupePromise } from 'app/utils/util';
import _ from 'lodash';
import * as actions from '../actions';
import { ClarityDescription, ClarityVersions } from './descriptionInterface';

const urls = {
  descriptions: 'https://ice-mourne.github.io/database-clarity/descriptions/dim.json',
  version: 'https://ice-mourne.github.io/database-clarity/versions.json',
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

    if (liveVersion.checkDescriptionVersion && savedVersion !== liveVersion.descriptions) {
      const descriptions: ClarityDescription = await fetchClarity('descriptions');
      set('clarity-descriptions', descriptions);
      localStorage.setItem('clarityDescriptionVersion', liveVersion.descriptions.toString());
      return descriptions;
    }
  } catch (e) {
    errorLog('clarity', 'failed to load remote descriptions', e);
  }

  if (loadFromIndexedDB) {
    const savedDescriptions: ClarityDescription = await get('clarity-descriptions');
    return savedDescriptions;
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
      const newDescriptions = await loadClarityDescriptions(!descriptions);
      if (newDescriptions) {
        dispatch(actions.loadDescriptions(newDescriptions));
      }
      lastDescriptionUpdate = Date.now();
    }
  };
}
