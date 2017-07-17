function routes($stateProvider, $urlServiceProvider) {
  'ngInject';

  $urlServiceProvider.rules.initial('/d1');
  $urlServiceProvider.rules.otherwise('/d1');
}

export default routes;
