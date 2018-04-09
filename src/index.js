import { bootstrap } from 'angular';
import 'babel-polyfill';
// Promise.finally isn't in the base polyfill
import 'core-js/fn/promise/finally';
// Polyfill fetch for iOS < 10.3
import 'whatwg-fetch';

import './app/google';
import './app/exceptions';

// Initialize the main DIM app
import './app/app.module';

import './scss/main.scss';

import { initi18n } from './app/i18n';

// Drag and drop
import { polyfill } from "mobile-drag-drop";
import 'mobile-drag-drop/default.css';

polyfill({
  holdToDrag: 300
});

// https://github.com/timruffles/ios-html5-drag-drop-shim/issues/77
window.addEventListener('touchmove', () => { });

if ($DIM_FLAVOR !== 'dev' && navigator.serviceWorker) {
  navigator.serviceWorker.register('/service-worker.js')
    .catch((err) => {
      console.error('Unable to register service worker.', err);
    });
}

initi18n().then(() => {
  bootstrap(document.body, ['app'], { strictDi: true });
});
