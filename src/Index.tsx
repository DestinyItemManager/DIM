import React from 'react';
import ReactDOM from 'react-dom';

import './app/google';
import './app/exceptions';

import './app/main.scss';

import { initi18n } from './app/i18n';

// Drag and drop
import { polyfill } from 'mobile-drag-drop';
import 'mobile-drag-drop/default.css';

import registerServiceWorker from './register-service-worker';
import { safariTouchFix } from './safari-touch-fix';
import Root from './Root';
import updateCSSVariables from './app/css-variables';
import setupRateLimiter from './app/bungie-api/rate-limit-config';
import { SyncService } from './app/storage/sync.service';
import { initSettings } from './app/settings/settings';
import { saveReviewsToIndexedDB } from './app/item-review/reducer';
import { saveCurationsToIndexedDB } from './app/curated-rolls/reducer';
import { saveAccountsToIndexedDB } from 'app/accounts/reducer';

polyfill({
  holdToDrag: 300,
  dragImageCenterOnTouch: true
});

safariTouchFix();

if ($DIM_FLAVOR !== 'dev') {
  registerServiceWorker();
}

initi18n().then(() => {
  updateCSSVariables();
  setupRateLimiter();

  SyncService.init();
  initSettings();
  saveReviewsToIndexedDB();
  saveCurationsToIndexedDB();
  saveAccountsToIndexedDB();

  console.log(
    `DIM v${$DIM_VERSION} (${$DIM_FLAVOR}) - Please report any errors to https://www.github.com/DestinyItemManager/DIM/issues`
  );

  ReactDOM.render(<Root />, document.getElementById('app'));
});
