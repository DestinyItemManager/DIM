function routes($stateProvider, $urlServiceProvider) {
  'ngInject';

  if ($DIM_FLAVOR === 'dev') {
    $stateProvider.state({
      name: 'developer',
      url: '/developer',
      template: require('app/scripts/developer/developer.html')
    });
  }

  $urlServiceProvider.rules.initial('/d1');
  $urlServiceProvider.rules.otherwise('/d1');
}

export default routes;
