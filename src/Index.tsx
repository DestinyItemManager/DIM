import { saveAccountsToIndexedDB } from 'app/accounts/observers';
import updateCSSVariables from 'app/css-variables';
import { loadDimApiData } from 'app/dim-api/actions';
import { saveItemInfosOnStateChange } from 'app/inventory/observers';
import store from 'app/store/store';
import { saveVendorDropsToIndexedDB } from 'app/vendorEngramsXyzApi/observers';
import React from 'react';
import ReactDOM from 'react-dom';
import setupRateLimiter from './app/bungie-api/rate-limit-config';
import './app/google';
import { initi18n } from './app/i18n';
import { saveReviewsToIndexedDB } from './app/item-review/observers';
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
if ($featureFlags.reviewsEnabled) {
  saveReviewsToIndexedDB();
}
if ($featureFlags.wishLists) {
  saveWishListToIndexedDB();
}
saveAccountsToIndexedDB();
if ($featureFlags.vendorEngrams) {
  saveVendorDropsToIndexedDB();
}
updateCSSVariables();

store.dispatch(loadDimApiData());

saveItemInfosOnStateChange();

initi18n().then(() => {
  // Settings depends on i18n
  watchLanguageChanges();

  console.log(
    `DIM v${$DIM_VERSION} (${$DIM_FLAVOR}) - Please report any errors to https://www.github.com/DestinyItemManager/DIM/issues`
  );

  ReactDOM.render(<Root />, document.getElementById('app'));
});
