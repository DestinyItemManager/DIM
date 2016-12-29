// import angular from 'angular';
// import angularUiRouter from 'angular-ui-router';
// import 'babel-polyfill';

// angular.module('dimApp', [
//   angularUiRouter
// ]);

// window._ = require('lodash');
window._ = require('underscore');
window.$ = window.jQuery = require('jquery');
window.angular = require('exports?window.angular!angular');
window.moment = require('moment');

require('jquery-ui/ui/position');

require('angular-aria');
require('angular-chrome-storage/angular-chrome-storage');
require('angular-moment');
require('angular-timer');
require('angular-ui-router');

// require(
//   'imports?angular=>window.angular!' +
//   '../vendor/angular-cookies'
// );
