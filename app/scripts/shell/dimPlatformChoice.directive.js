(function() {
  'use strict';

  angular.module('dimApp')
    .directive('dimPlatformChoice', PlatformChoice);

  PlatformChoice.$inject = [];

  function PlatformChoice() {
    return {
      controller: PlatformChoiceCtrl,
      controllerAs: 'vm',
      bindToController: true,
      scope: {},
      restrict: 'A',
      template: [
        '<select id="system" ng-if="vm.platforms.length > 1" ng-options="platform.label for platform in vm.platforms" ng-model="vm.active" ng-change="vm.update()"></select>',
        '<i ng-if="vm.active" class="fa fa-user"></i> <span id="user" class="header-right">{{ vm.active.id }}</span>'
      ].join('')
    };
  }

  PlatformChoiceCtrl.$inject = ['$scope', 'dimPlatformService', 'dimState', 'loadingTracker', '$http'];

  function PlatformChoiceCtrl($scope, dimPlatformService, dimState, loadingTracker, $http) {
    var vm = this;

    vm.active = null;
    vm.platforms = null;
    vm.update = function update() {
      dimPlatformService.setActive(vm.active);
    };

    activate();

    function activate() {
      var promise = $http.get('https://www.bungie.net', {
        timeout: 5000
      })
        .then(function() {
          return dimPlatformService.getPlatforms();
        }, function() {
          return dimPlatformService.getPlatforms();
        });

      loadingTracker.addPromise(promise);
    }

    $scope.$on('dim-platforms-updated', function(e, args) {
      vm.platforms = args.platforms;
    });

    $scope.$on('dim-active-platform-updated', function(e, args) {
      if (_.isNull(args.platform)) {
        dimState.active = vm.active = null;
      } else {
        // if (_.isNull(vm.active) || (vm.active.type !== args.platform.type)) {
        dimState.active = vm.active = args.platform;
        // }
      }
    });
  }
})();
