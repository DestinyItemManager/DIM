import angular from 'angular';
import 'babel-polyfill';

require('./app/google');

// Drag and drop
const iosDragDropShim = require('drag-drop-webkit-mobile');

iosDragDropShim({
  enableEnterLeave: true,
  holdToDrag: 300
});
// https://github.com/timruffles/ios-html5-drag-drop-shim/issues/77
window.addEventListener('touchmove', () => {});

// Initialize the main DIM app
require('./app/app.module');

require('./app/services/dimActionQueue.factory');
require('./app/services/dimDefinitions.factory');
require('./app/services/dimManifestService.factory');
require('./app/services/dimBucketService.factory');
require('./app/services/dimInfoService.factory');
require('./app/services/dimPlatformService.factory');
require('./app/services/dimDestinyTrackerService.factory');

require('./app/shell/dimAngularFilters.filter');
require('./app/shell/dimClickAnywhereButHere.directive');
require('./app/shell/dimManifestProgress.directive');

require('./scss/main.scss');

if ($DIM_FLAVOR !== 'dev' && navigator.serviceWorker) {
  navigator.serviceWorker.register('/service-worker.js')
    .catch((err) => {
      console.error('Unable to register service worker.', err);
    });
}

angular.bootstrap(document.body, ['app'], { strictDi: true });
