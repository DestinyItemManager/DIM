import React from 'react';
import ReactDOM from 'react-dom';

import './app/google';
import './app/utils/exceptions';

import './app/main.scss';

import { initi18n } from './app/i18n';

// Drag and drop
import { polyfill } from 'mobile-drag-drop';
import 'mobile-drag-drop/default.css';

import registerServiceWorker from './app/register-service-worker';
import { safariTouchFix } from './app/safari-touch-fix';
import Root from './app/Root';
import setupRateLimiter from './app/bungie-api/rate-limit-config';
import { SyncService } from './app/storage/sync.service';
import { initSettings } from './app/settings/settings';
import { saveReviewsToIndexedDB } from './app/item-review/reducer';
import { saveWishListToIndexedDB } from './app/wishlists/reducer';
import { saveAccountsToIndexedDB } from 'app/accounts/reducer';
import { getPlatforms, getActivePlatform } from 'app/accounts/platforms';
import { getDefinitions as getD2Definitions } from 'app/destiny2/d2-definitions';
import { getDefinitions as getD1Definitions } from 'app/destiny1/d1-definitions';
import updateCSSVariables from 'app/css-variables';

polyfill({
  holdToDrag: 300,
  dragImageCenterOnTouch: true
});

safariTouchFix();

if ($DIM_FLAVOR !== 'dev') {
  registerServiceWorker();
}

setupRateLimiter();
saveReviewsToIndexedDB();
saveWishListToIndexedDB();
saveAccountsToIndexedDB();
updateCSSVariables();

// Load some stuff at startup
SyncService.init();
(async () => {
  await getPlatforms();
  const activePlatform = getActivePlatform();
  if (activePlatform) {
    if (activePlatform.destinyVersion === 2) {
      return getD2Definitions();
    } else {
      return getD1Definitions();
    }
  }
})();

initi18n().then(() => {
  // Settings depends on i18n
  initSettings();

  console.log(
    `DIM v${$DIM_VERSION} (${$DIM_FLAVOR}) - Please report any errors to https://www.github.com/DestinyItemManager/DIM/issues`
  );

  ReactDOM.render(<Root />, document.getElementById('app'));
});
