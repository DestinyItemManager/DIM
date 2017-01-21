import angular from 'angular';
import routerHelperProvider from './router-helper.provider';

const name = 'blocks.router';

angular
  .module(name, [
    'ui.router'
  ])
  .provider('routerHelper', routerHelperProvider);

export default name;
