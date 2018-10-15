import '@babel/polyfill';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { module as angularModule, bootstrap } from 'angular';

import './app/google';
import './app/exceptions';

// Initialize the main DIM app
import { AppModule } from './app/app.module';

import './scss/main.scss';

import { initi18n } from './app/i18n';

// Drag and drop
import { polyfill } from 'mobile-drag-drop';
import 'mobile-drag-drop/default.css';

import registerServiceWorker from './register-service-worker';
import { lazyInjector } from './lazyInjector';
import { safariTouchFix } from './safari-touch-fix';
import Root from './Root';
import updateCSSVariables from './app/css-variables';
import setupRateLimiter from './app/bungie-api/rate-limit-config';

polyfill({
  holdToDrag: 300,
  dragImageCenterOnTouch: true
});

safariTouchFix();

if ($DIM_FLAVOR !== 'dev') {
  registerServiceWorker();
}

initi18n().then(() => {
  angularModule('Bootstrap', [AppModule]).run(($injector) => {
    'ngInject';
    lazyInjector.$injector = $injector;
    updateCSSVariables();
    setupRateLimiter();

    ReactDOM.render(<Root />, document.getElementById('app'));
  });
  bootstrap(document.getElementById('angular')!, ['Bootstrap'], { strictDi: true });
});
