import debugItem from 'app/views/debugItem.html';
import login from 'app/scripts/login/login.html';

function routes($stateProvider, $urlRouterProvider) {
  'ngInject';

  const states = [{
    name: 'root',
    abstract: true
  }, {
    name: 'debugItem',
    parent: 'content',
    url: '/debugItem/:itemId',
    template: debugItem
  }, {
    name: 'login',
    parent: 'shell',
    url: '/login',
    template: login,
    params: {
      reauth: false
    }
  }];

  if ($DIM_FLAVOR === 'dev') {
    states.push({
      name: 'developer',
      parent: 'shell',
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
