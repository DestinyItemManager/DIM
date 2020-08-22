import React from 'react';
import ReactDOM from 'react-dom';

import './app/google';
import './app/utils/exceptions';

import './app/main.scss';

import { initi18n } from './app/i18n';

import registerServiceWorker from './app/register-service-worker';
import { safariTouchFix } from './app/safari-touch-fix';
import Root from './app/Root';
import setupRateLimiter from './app/bungie-api/rate-limit-config';
import { watchLanguageChanges } from './app/settings/observers';
import { saveReviewsToIndexedDB } from './app/item-review/observers';
import { saveWishListToIndexedDB } from './app/wishlists/observers';
import { saveAccountsToIndexedDB } from 'app/accounts/observers';
import updateCSSVariables from 'app/css-variables';
import { saveVendorDropsToIndexedDB } from 'app/vendorEngramsXyzApi/observers';
import store from 'app/store/store';
import { loadDimApiData } from 'app/dim-api/actions';
import { saveItemInfosOnStateChange } from 'app/inventory/observers';

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
