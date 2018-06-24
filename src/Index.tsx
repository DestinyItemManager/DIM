import 'babel-polyfill';
// Promise.finally isn't in the base polyfill
import 'core-js/fn/promise/finally';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { module, bootstrap } from 'angular';
import { UIRouter } from '@uirouter/react';
import makeRouter from './router.config';

import './app/google';
import './app/exceptions';

// Initialize the main DIM app
import { AppModule } from './app/app.module';
import { App } from './app/App';

import './scss/main.scss';

import { initi18n } from './app/i18n';

// Drag and drop
import { polyfill } from "mobile-drag-drop";
import 'mobile-drag-drop/default.css';

import registerServiceWorker from './register-service-worker';
import { lazyInjector } from './lazyInjector';

polyfill({
  holdToDrag: 300
});

// https://github.com/timruffles/ios-html5-drag-drop-shim/issues/77
window.addEventListener('touchmove', () => { return; });

if ($DIM_FLAVOR !== 'dev') {
  registerServiceWorker();
}

initi18n().then(() => {
  module('Bootstrap', [AppModule])
    .run(($injector) => {
      'ngInject';
      lazyInjector.$injector = $injector;
      ReactDOM.render(
        <UIRouter router={makeRouter()}>
          <App/>
        </UIRouter>,
        document.getElementById('app')
      );
    });
  bootstrap(document.createElement('div'), ['Bootstrap'], { strictDi: true });
});
