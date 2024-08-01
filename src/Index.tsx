// organize-imports-ignore
// We want our main CSS to load before all other CSS.
import './app/main.scss';
// Pull the sheet CSS up so it is at the top of the stylesheet and can be easily overridden.
import './app/dim-ui/Sheet.m.scss';
import './app/utils/sentry';
import { createSaveAccountsObserver } from 'app/accounts/observers';
import {
  createItemSizeObserver,
  createThemeObserver,
  createTilesPerCharColumnObserver,
  setCssVariableEventListeners,
} from 'app/css-variables';
import { loadDimApiData } from 'app/dim-api/actions';
import { createSaveItemInfosObserver } from 'app/inventory/observers';
import store from 'app/store/store';
import { lazyLoadStreamDeck, startStreamDeckConnection } from 'app/stream-deck/stream-deck';
import { infoLog } from 'app/utils/log';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { StorageBroken, storageTest } from './StorageTest';
import Root from './app/Root';
import setupRateLimiter from './app/bungie-api/rate-limit-config';
import { initGoogleAnalytics } from './app/google';
import { createLanguageObserver, initi18n } from './app/i18n';
import registerServiceWorker from './app/register-service-worker';
import { safariTouchFix } from './app/safari-touch-fix';
import { createWishlistObserver } from './app/wishlists/observers';
import { observe } from 'app/store/observerMiddleware';
infoLog(
  'app',
  `DIM v${$DIM_VERSION} (${$DIM_FLAVOR}) - Please report any errors to https://www.github.com/DestinyItemManager/DIM/issues`,
);

initGoogleAnalytics();
safariTouchFix();

if ($DIM_FLAVOR !== 'dev') {
  registerServiceWorker();
}

setupRateLimiter();

const i18nPromise = initi18n();

(async () => {
  const root = createRoot(document.getElementById('app')!);

  // Block on testing that we can use LocalStorage and IDB, before everything starts trying to use it
  const storageWorks = await storageTest();
  if (!storageWorks) {
    // Make sure localization is loaded
    await i18nPromise;
    root.render(
      <Provider store={store}>
        <StorageBroken />
      </Provider>,
    );
    return;
  }

  if ($featureFlags.wishLists) {
    store.dispatch(observe(createWishlistObserver()));
  }
  store.dispatch(observe(createSaveAccountsObserver()));
  store.dispatch(observe(createItemSizeObserver()));
  store.dispatch(observe(createThemeObserver()));
  store.dispatch(observe(createTilesPerCharColumnObserver()));
  setCssVariableEventListeners();

  store.dispatch(observe(createSaveItemInfosObserver()));

  store.dispatch(loadDimApiData());

  if ($featureFlags.elgatoStreamDeck && store.getState().streamDeck.enabled) {
    await lazyLoadStreamDeck();
    store.dispatch(startStreamDeckConnection());
  }

  // Make sure localization is loaded
  await i18nPromise;

  // Update the language in both i18n and local storage when the user
  // changes the language setting.
  store.dispatch(observe(createLanguageObserver()));

  root.render(<Root />);
})();
