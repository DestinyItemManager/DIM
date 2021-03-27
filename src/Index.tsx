import { saveAccountsToIndexedDB } from 'app/accounts/observers';
import updateCSSVariables from 'app/css-variables';
import { loadDimApiData } from 'app/dim-api/actions';
import { saveItemInfosOnStateChange } from 'app/inventory/observers';
import { loadCoreSettings } from 'app/manifest/actions';
import { pollForBungieAlerts } from 'app/shell/actions';
import store from 'app/store/store';
import { infoLog } from 'app/utils/log';
import React from 'react';
import ReactDOM from 'react-dom';
import setupRateLimiter from './app/bungie-api/rate-limit-config';
import './app/google';
import { initi18n } from './app/i18n';
import './app/main.scss';
import registerServiceWorker from './app/register-service-worker';
import Root from './app/Root';
import { safariTouchFix } from './app/safari-touch-fix';
import { watchLanguageChanges } from './app/settings/observers';
import './app/utils/exceptions';
import { saveWishListToIndexedDB } from './app/wishlists/observers';

safariTouchFix();

if ($DIM_FLAVOR !== 'dev') {
  registerServiceWorker();
}

setupRateLimiter();
if ($featureFlags.wishLists) {
  saveWishListToIndexedDB();
}
saveAccountsToIndexedDB();
updateCSSVariables();

store.dispatch(loadDimApiData());
store.dispatch(loadCoreSettings());
store.dispatch(pollForBungieAlerts());

saveItemInfosOnStateChange();

initi18n().then(() => {
  // Settings depends on i18n
  watchLanguageChanges();

  infoLog(
    'app',
    `DIM v${$DIM_VERSION} (${$DIM_FLAVOR}) - Please report any errors to https://www.github.com/DestinyItemManager/DIM/issues`
  );

  ReactDOM.render(<Root />, document.getElementById('app'));
});
