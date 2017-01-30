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
      url: '',
      templateUrl: content
    }
  }, {
    state: 'inventory',
    config: {
      parent: 'root',
      url: '/inventory',
      templateUrl: inventory
    }
  }, {
    state: 'best',
    config: {
      url: '/best',
      templateUrl: best
    }
  }, {
    state: 'vendors',
    config: {
      url: '/vendors',
      templateUrl: vendors
    }
  }, {
    state: 'materials-exchange',
    config: {
      url: '/materials-exchange',
      templateUrl: materialExchange
    }
  }, {
    state: 'debugItem',
    config: {
      url: '/debugItem/:itemId',
      templateUrl: debugItem
    }
  }, {
    state: 'developer',
    config: {
      url: '/developer',
      templateUrl: developer
    }
  }, {
    state: 'login',
    config: {
      url: '/login',
      templateUrl: login
    }
  }];
}

export default routes;
