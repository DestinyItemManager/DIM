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

require('angular-aria');
require('angular-ui-router');
require('angular-timer');

// require(
//   'imports?angular=>window.angular!' +
//   '../vendor/angular-cookies'
// );
