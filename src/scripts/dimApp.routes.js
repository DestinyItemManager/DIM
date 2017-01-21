export default function routes($stateProvider, $urlRouterProvider) {
  "ngInject";

  $urlRouterProvider.otherwise("/inventory");

  $stateProvider
    .state('inventory', {
      url: '/inventory',
      templateUrl: require('app/views/inventory.template.html'),
    })
    .state('best', {
      url: '/best',
      templateUrl: require('app/views/best.template.html'),
    })
    .state('vendors', {
      url: '/vendors',
      templateUrl: require('app/views/vendors.template.html'),
    })
    .state('materials-exchange', {
      url: '/materials-exchange',
      templateUrl: require('app/views/mats-exchange.template.html'),
    })
    .state('debugItem', {
      url: '/debugItem/:itemId',
      templateUrl: require('app/views/debugItem.template.html'),
    })
    .state('developer', {
      url: '/developer',
      templateUrl: require('app/scripts/developer/developer.template.html'),
    })
    .state('login', {
      url: '/login',
      templateUrl: require('app/scripts/login/login.template.html'),
    });
}
