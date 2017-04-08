import best from 'app/views/best.template.html';
import materialExchange from 'app/views/mats-exchange.template.html';
import debugItem from 'app/views/debugItem.template.html';
import developer from 'app/scripts/developer/developer.template.html';
import login from 'app/scripts/login/login.template.html';

function routes($stateProvider, $urlRouterProvider) {
  'ngInject';

  const states = [{
    name: 'root',
    abstract: true
  }, {
    name: 'best',
    parent: 'content',
    templateUrl: best,
    url: '/best'
  }, {
    name: 'materials-exchange',
    parent: 'content',
    url: '/materials-exchange',
    templateUrl: materialExchange
  }, {
    name: 'debugItem',
    parent: 'content',
    url: '/debugItem/:itemId',
    templateUrl: debugItem
  }, {
    name: 'developer',
    parent: 'content',
    url: '/developer',
    templateUrl: developer
  }, {
    name: 'login',
    parent: 'shell',
    url: '/login',
    templateUrl: login
  }];

  states.forEach((state) => {
    $stateProvider.state(state);
  });

  $urlRouterProvider.otherwise('/inventory');
}

export default routes;
