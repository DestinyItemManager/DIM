import angular from 'angular';
import routerHelperProvider from './router-helper.provider';

export const RouterBlockModule = angular
  .module('blocks.router', [
    'ui.router'
  ])
  .provider('routerHelper', routerHelperProvider)
  .name;
