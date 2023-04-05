// organize-imports-ignore
// We want our main CSS to load before all other CSS.
import './app/main.scss';
import { saveAccountsToIndexedDB } from 'app/accounts/observers';
import updateCSSVariables from 'app/css-variables';
import { loadDimApiData } from 'app/dim-api/actions';
import { saveItemInfosOnStateChange } from 'app/inventory/observers';
import { pollForBungieAlerts } from 'app/shell/alerts';
import store from 'app/store/store';
import { lazyLoadStreamDeck, startStreamDeckConnection } from 'app/stream-deck/stream-deck';
import { streamDeckEnabled } from 'app/stream-deck/util/local-storage';
import { infoLog } from 'app/utils/log';
import { scheduleMemoryMeasurement } from 'app/utils/measure-memory';
import ReactDOM from 'react-dom/client';
import idbReady from 'safari-14-idb-fix';
import { StorageBroken, storageTest } from './StorageTest';
import Root from './app/Root';
import setupRateLimiter from './app/bungie-api/rate-limit-config';
import './app/google';
import { initi18n } from './app/i18n';
import registerServiceWorker from './app/register-service-worker';
import { safariTouchFix } from './app/safari-touch-fix';
import { watchLanguageChanges } from './app/settings/observers';
import './app/utils/exceptions';
import { saveWishListToIndexedDB } from './app/wishlists/observers';

infoLog(
  'app',
  `DIM v${$DIM_VERSION} (${$DIM_FLAVOR}) - Please report any errors to https://www.github.com/DestinyItemManager/DIM/issues`
);

safariTouchFix();

if ($DIM_FLAVOR !== 'dev') {
  registerServiceWorker();
}

setupRateLimiter();
scheduleMemoryMeasurement();

const i18nPromise = initi18n();

(async () => {
  const root = ReactDOM.createRoot(document.getElementById('app')!);

  // idbReady works around a bug in Safari 14 where IndexedDB doesn't initialize sometimes
  await idbReady();
  // Block on testing that we can use LocalStorage and IDB, before everything starts trying to use it
  const storageWorks = await storageTest();
  if (!storageWorks) {
    // Make sure localization is loaded
    await i18nPromise;
    root.render(<StorageBroken />);
    return;
  }

  if ($featureFlags.wishLists) {
    saveWishListToIndexedDB();
  }
  saveAccountsToIndexedDB();
  updateCSSVariables();

  store.dispatch(loadDimApiData());
  store.dispatch(pollForBungieAlerts());

  if ($featureFlags.elgatoStreamDeck && streamDeckEnabled()) {
    await lazyLoadStreamDeck();
    store.dispatch(startStreamDeckConnection());
  }

  saveItemInfosOnStateChange();

  // Make sure localization is loaded
  await i18nPromise;

  // Settings depends on i18n
  watchLanguageChanges();

  root.render(<Root />);
})();
