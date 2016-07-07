(function() {
  'use strict';

  function scopesController($http) {
    var vm = this;

    vm.$onInit = function() {
      $http
        .get('scripts/api-manifest/scopes.json')
        .then(function(res) {
          // search for scope with vm.hash
          vm.scopes = _.where(res.data, { Hash: vm.hash })[0];
          // better to catch if not is found...
        });
    };
  }

  scopesController.$inject = ['$http'];

  angular
    .module('dimApp')
    .filter('remoteImg', function() {
      return function(src) {
        if (src) {
          return `http://www.destinyscopes.com/${src}`;
        }
        return undefined;
      };
    });

  angular
    .module('dimApp')
    .component('scopes', {
      template: `
        <div class="mainScope">
          <div class="scopeInfo">

            <ul class="scopeData">
              <li>Type: <span>{{$ctrl.scopes.Type}}</span></li>
              <li>Name: <span>{{$ctrl.scopes.Name}}</span></li>
              <li ng-repeat="stat in $ctrl.scopes.Stats">{{stat[0]}}: <span>{{stat[1]}}</span></li>
            </ul>

          </div>
            
          <div class="thumb">
            <img ng-src="{{$ctrl.scopes.Image[0] | remoteImg}}" />
          </div>

          <img ng-src="{{$ctrl.scopes.Image[1] | remoteImg}}" />

        </div>
      `,
      controller: scopesController,
      bindings: {
        hash: '<'
      }
    });
})();
