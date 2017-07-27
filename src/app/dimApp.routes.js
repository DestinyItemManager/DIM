function routes($stateProvider, $urlServiceProvider) {
  'ngInject';

  $urlServiceProvider.rules.initial({ state: 'default-account' });
  $urlServiceProvider.rules.otherwise({ state: 'default-account' });
}

export default routes;
