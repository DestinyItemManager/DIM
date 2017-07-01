import login from 'app/scripts/login/login.html';

function routes($stateProvider, $urlRouterProvider) {
  'ngInject';

  const states = [{
    name: 'login',
    url: '/login',
    template: login,
    params: {
      reauth: false
    }
  }];

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
