function routes($stateProvider, $urlServiceProvider) {
  'ngInject';

  const states = [];

  if ($DIM_FLAVOR === 'dev') {
    states.push({
      name: 'developer',
      url: '/developer',
      template: require('app/scripts/developer/developer.html')
    });
  }

  states.forEach((state) => {
    $stateProvider.state(state);
  });

  // TODO: should redirect to index component, which should redirect to default character or offer selection?
  // TODO: should really be an "initial" rule and a separate 404 rule for otherwise
  $urlServiceProvider.rules.initial('/d1');
  $urlServiceProvider.rules.otherwise('/d1');
}

export default routes;
