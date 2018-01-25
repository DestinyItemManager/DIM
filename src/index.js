import angular from 'angular';
import 'babel-polyfill';

import './app/google';

// Initialize the main DIM app
import './app/app.module';

import './app/services/dimActionQueue.factory';
import './app/services/dimDefinitions.factory';
import './app/services/dimManifestService.factory';
import './app/services/dimBucketService.factory';
import './app/services/dimInfoService.factory';
import './app/services/dimPlatformService.factory';
import './app/services/dimDestinyTrackerService.factory';

import './app/shell/dimAngularFilters.filter';
import './app/shell/dimClickAnywhereButHere.directive';
import './app/shell/dimManifestProgress.directive';

import './scss/main.scss';

import { initi18n } from './app/i18n';

// Drag and drop
import { polyfill } from "mobile-drag-drop";
import 'mobile-drag-drop/default.css';

polyfill({
  holdToDrag: 300
});

// https://github.com/timruffles/ios-html5-drag-drop-shim/issues/77
window.addEventListener('touchmove', () => {});

if ($DIM_FLAVOR !== 'dev' && navigator.serviceWorker) {
  navigator.serviceWorker.register('/service-worker.js')
    .catch((err) => {
      console.error('Unable to register service worker.', err);
    });
}

initi18n().then(() => {
  angular.bootstrap(document.body, ['app'], { strictDi: true });
});
