function routes($stateProvider, $urlRouterProvider) {
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
  $urlRouterProvider.otherwise('/d1/4611686018433092312-2/inventory');
}

export default routes;
