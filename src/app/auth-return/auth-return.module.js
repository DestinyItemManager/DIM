import angular from 'angular';
import { ReturnComponent } from './return.component';

/**
 * Unlike all other modules, this one is not included in the main
 * app - it's included directly by authReturn.js (return.html).
 */
angular.module('authReturnModule', [])
  .component('dimReturn', ReturnComponent);
