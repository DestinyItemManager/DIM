import debugItem from 'app/views/debugItem.html';
import login from 'app/scripts/login/login.html';

function routes($stateProvider, $urlRouterProvider) {
  'ngInject';

  const states = [{
    name: 'debugItem',
    parent: 'content',
    url: '/debugItem/:itemId',
    template: debugItem
  }, {
    name: 'login',
    url: '/login',
    template: login,
    params: {
      reauth: false
    }
  }];

  if ($featureFlags.materialsExchangeEnabled) {
    states.push({
      name: 'materials-exchange',
      parent: 'content',
      url: '/materials-exchange',
      template: require('app/views/mats-exchange.html')
    });
  }

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
