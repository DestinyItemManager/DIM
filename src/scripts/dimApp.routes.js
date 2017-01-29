import content from 'app/views/content.html';
import inventory from 'app/views/inventory.template.html';
import best from 'app/views/best.template.html';
import vendors from 'app/views/vendors.template.html';
import materialExchange from 'app/views/mats-exchange.template.html';
import debugItem from 'app/views/debugItem.template.html';
import developer from 'app/scripts/developer/developer.template.html';
import login from 'app/scripts/login/login.template.html';

function routes(routerHelper) {
  'ngInject';

  routerHelper.configureStates(getStates(), '/inventory');
}

function getStates() {
  return [{
    state: 'root',
    config: {
      abstract: true,
      templateUrl: content,
      url: ''
    }
  }, {
    state: 'inventory',
    config: {
      parent: 'root',
      templateUrl: inventory,
      url: '/inventory'
    }
  }, {
    state: 'best',
    config: {
      parent: 'root',
      templateUrl: best,
      url: '/best'
    }
  }, {
    state: 'vendors',
    config: {
      parent: 'root',
      templateUrl: vendors,
      url: '/vendors'
    }
  }, {
    state: 'materials-exchange',
    config: {
      parent: 'root',
      url: '/materials-exchange',
      templateUrl: materialExchange,
    }
  }, {
    state: 'debugItem',
    config: {
      parent: 'root',
      url: '/debugItem/:itemId',
      templateUrl: debugItem,
    }
  }, {
    state: 'developer',
    config: {
      parent: 'root',
      url: '/developer',
      templateUrl: developer,
    }
  }, {
    state: 'login',
    config: {
      parent: 'root',
      url: '/login',
      templateUrl: login,
    }
  }];
}

export default routes;
