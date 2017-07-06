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

  $urlRouterProvider.otherwise('/inventory');
}

export default routes;
