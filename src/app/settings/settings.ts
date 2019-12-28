import i18next from 'i18next';
import _ from 'lodash';
import { SyncService } from '../storage/sync.service';
import store from '../store/store';
import { loaded } from './actions';
import { observeStore } from '../utils/redux-utils';
import { Unsubscribe } from 'redux';
import { initialState } from './reducer';

let readyResolve;
export const settingsReady = new Promise((resolve) => (readyResolve = resolve));

// This is a backwards-compatibility shim for all the code that directly uses settings
export let settings = initialState;

const saveSettings = _.throttle(
  (settings) =>
    SyncService.set({
      'settings-v1.0': settings
    }),
  1000
);

function saveSettingsOnUpdate() {
  return observeStore(
    (state) => state.settings,
    (_currentState, nextState) => {
      settings = nextState;
      saveSettings(nextState);
    }
  );
}

let unsubscribe: Unsubscribe;

// Load settings async.
export function initSettings() {
  if (unsubscribe) {
    // Stop saving settings changes
    unsubscribe();
  }

  SyncService.get().then((data) => {
    data = data || {};

    const savedSettings = data['settings-v1.0'] || {};

    const languageChanged = savedSettings.language !== i18next.language;
    store.dispatch(loaded(savedSettings));
    const settings = store.getState().settings;
    localStorage.setItem('dimLanguage', settings.language);
    if (languageChanged) {
      i18next.changeLanguage(settings.language);
    }

    readyResolve();
    // Start saving settings changes
    unsubscribe = saveSettingsOnUpdate();
  });
}
