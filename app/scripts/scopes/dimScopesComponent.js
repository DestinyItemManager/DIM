
function scopesController($http) {

  var vm = this;

  vm.$onInit = function() {
    $http
      .get(`http://localhost:8080/${vm.hash}`)
      .then(function(res) {
        vm.scopes = res.data[0];
      });
  }

}

scopesController.$inject = ['$http'];

angular
  .module('dimApp')
  .filter('remoteImg', function() {
    return function(input) {
      return `http://www.destinyscopes.com/${input}`;
    }
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
            <li ng-if="$ctrl.scopes.Stats.Stability">Stability: <span>{{$ctrl.scopes.Stats.Stability}}</span></li>
            <li ng-if="$ctrl.scopes.Stats.Reload">Reload: <span>{{$ctrl.scopes.Stats.Reload}}</span></li>
            <li ng-if="$ctrl.scopes.Stats.Handling">Handling: <span>{{$ctrl.scopes.Stats.Handling}}</span></li>
            <li ng-if="$ctrl.scopes['Aim Assist']">Aim Assist: <span>{{$ctrl.scopes['Aim Assist']}}</span></li>
          </ul>
        </div>
        <img ng-src="{{$ctrl.scopes.Image[1] | remoteImg}}" />
      </div>
    `,
    controller: scopesController,
    bindings: {
      hash: '<'
    }
  });