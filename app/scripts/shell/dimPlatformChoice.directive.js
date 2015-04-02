/*jshint -W027*/

(function () {
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
        '<span id="user" class="header-right">{{ vm.active.id }}</span>',
        '<select id="system" ng-options="platform.label for platform in vm.platforms" ng-model="vm.active" ng-change="vm.update()"></select>'
      ].join('')
    };
  }

  PlatformChoiceCtrl.$inject = ['$scope', 'dimPlatformService'];

  function PlatformChoiceCtrl($scope, dimPlatformService) {
    var vm = this;

    vm.active = null;
    vm.platforms = null;
    vm.update = function update() {
      dimPlatformService.setActive(vm.active);
    };

    activate();

    function activate() {
      dimPlatformService.getPlatforms();
    }

    $scope.$on('dim-platforms-updated', function(e, args) {
      vm.platforms = args.platforms;
    });

    $scope.$on('dim-active-platform-updated', function(e, args) {
      if (_.isNull(args.platform)) {
        vm.active = null;
      } else {
        if (_.isNull(vm.active) || (vm.active.type !== args.platform.type)) {
          vm.active = args.platform;
        }
      }
    });
  }
})();
