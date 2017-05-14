import materialExchange from 'app/views/mats-exchange.template.html';
import debugItem from 'app/views/debugItem.template.html';
import login from 'app/scripts/login/login.template.html';

function routes($stateProvider, $urlRouterProvider) {
  'ngInject';

  const states = [{
    name: 'root',
    abstract: true
  }, {
    name: 'materials-exchange',
    parent: 'content',
    url: '/materials-exchange',
    template: materialExchange
  }, {
    name: 'debugItem',
    parent: 'content',
    url: '/debugItem/:itemId',
    template: debugItem
  }, {
    name: 'login',
    parent: 'shell',
    url: '/login',
    template: login
  }];

  if ($DIM_FLAVOR === 'dev') {
    states.push({
      name: 'developer',
      parent: 'content',
      url: '/developer',
      template: require('app/scripts/developer/developer.template.html')
    });
  }

  states.forEach((state) => {
    $stateProvider.state(state);
  });

  $urlRouterProvider.otherwise('/inventory');
}

export default routes;
