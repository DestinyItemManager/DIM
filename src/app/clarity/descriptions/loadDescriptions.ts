import { get, set } from 'app/storage/idb-keyval';
import { ThunkResult } from 'app/store/types';
import * as actions from '../actions';
import { ClarityDescription, ClarityVersions } from './descriptionInterface';

const urls = {
  descriptions: 'https://ice-mourne.github.io/database-clarity/descriptions.json',
  version: 'https://ice-mourne.github.io/database-clarity/versions.json',
} as const;

const fetchClarity = async (type: keyof typeof urls) => {
  const data = await fetch(urls[type]);
  const json = await data.json();
  return json;
};

const loadClarityDescriptions = async () => {
  const savedVersion = Number(localStorage.getItem('clarityDescriptionVersion') ?? '0');
  const liveVersion: ClarityVersions = await fetchClarity('version');

  if (savedVersion !== liveVersion.descriptions) {
    const descriptions: ClarityDescription = await fetchClarity('descriptions');
    set('clarity-descriptions', descriptions);
    localStorage.setItem('clarityDescriptionVersion', liveVersion.descriptions.toString());
    return descriptions;
  }

  const savedDescriptions: ClarityDescription = await get('clarity-descriptions');
  return savedDescriptions;
};

/**
 * Load the Clarity database, either remotely or from the local cache.
 * TODO: reload this every so often when stores reload
 */
export function loadClarity(): ThunkResult {
  return async (dispatch) => {
    const descriptions = await loadClarityDescriptions();
    dispatch(actions.loadDescriptions(descriptions));
  };
}
