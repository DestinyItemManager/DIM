import { get, set } from 'app/storage/idb-keyval';
import store from 'app/store/store';
import * as actions from '../actions';
import { ClarityDescription, ClarityVersions } from './descriptionInterface';

const fetchClarity = async (type: 'descriptions' | 'version') => {
  const urls = {
    descriptions: 'https://ice-mourne.github.io/database-clarity/descriptions.json',
    version: 'https://ice-mourne.github.io/database-clarity/versions.json',
  };
  const data = await fetch(urls[type]);
  const json = await data.json();
  return json;
};

const loadClarityDescriptions = async () => {
  const savedVersion = Number(localStorage.getItem('clarityDescriptionVersion'));
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

// technically this works fine but if i should move it just tell me where or just move it
loadClarityDescriptions().then((descriptions) => {
  store.dispatch(actions.loadDescriptions(descriptions));
});
