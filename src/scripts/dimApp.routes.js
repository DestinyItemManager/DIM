<<<<<<< HEAD
import content from 'app/views/content.html';
import inventory from 'app/views/inventory.template.html';
=======
>>>>>>> 2ed9f8e... Removed the controller from markup.
import best from 'app/views/best.template.html';
import vendors from 'app/views/vendors.template.html';
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
    name: 'vendors',
    parent: 'content',
    templateUrl: vendors,
    url: '/vendors'
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
