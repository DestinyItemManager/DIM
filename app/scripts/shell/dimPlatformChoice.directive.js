(function() {
  'use strict';

  angular.module('dimApp').component('dimPlatformChoice', {
    controller: PlatformChoiceCtrl,
    controllerAs: 'vm',
    bindToController: true,
    template: `
      <select id="system" ng-if="vm.platforms.length > 1" ng-options="platform.label for platform in vm.platforms" ng-model="vm.active" ng-change="vm.update()"></select>
      <i ng-if="vm.active" class="fa fa-user"></i> <span id="user" class="header-right">{{ vm.active.id }}</span>'
    `
  });

  PlatformChoiceCtrl.$inject = ['$scope', 'dimPlatformService', 'dimState', 'loadingTracker'];

  function PlatformChoiceCtrl($scope, dimPlatformService, dimState, loadingTracker) {
    var vm = this;

    vm.active = null;
    vm.platforms = null;
    vm.update = function update() {
      dimPlatformService.setActive(vm.active);
    };

    loadingTracker.addPromise(dimPlatformService.getPlatforms());

    $scope.$on('dim-platforms-updated', function(e, args) {
      vm.platforms = args.platforms;
    });

    $scope.$on('dim-active-platform-updated', function(e, args) {
      dimState.active = vm.active = args.platform;
    });
  }
})();
