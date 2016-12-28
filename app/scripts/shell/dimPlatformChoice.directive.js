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
      templateUrl: 'scripts/shell/dimPlatformChoice.directive.html'
    };
  }

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
