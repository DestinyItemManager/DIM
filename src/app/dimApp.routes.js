function routes($stateProvider, $urlServiceProvider, $transitionsProvider) {
  'ngInject';

  $urlServiceProvider.rules.initial({ state: 'default-account' });
  $urlServiceProvider.rules.otherwise({ state: 'default-account' });

  if ($featureFlags.googleAnalyticsForRouter) {
    $transitionsProvider.onSuccess({ }, (transition) => {
      ga('send', 'pageview', transition.$to().name);
    });
  }
}

export default routes;
