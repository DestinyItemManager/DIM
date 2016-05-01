(function() {
  'use strict';

  angular.module('dimApp').directive('dimEngramFarming', EngramFarming);

  EngramFarming.$inject = ['dimEngramFarmingService'];

  function EngramFarming(dimEngramFarmingService) {
    return {
      controller: EngramFarmingCtrl,
      controllerAs: 'vm',
      bindToController: true,
      scope: {},
      template: [
        '<div id="engram-farming" ng-if="vm.service.active">',
        'Sending {{vm.service.store.name}}\'s engrams to the vault...',
        '<button ng-click="vm.stop($event)">Stop</button>',
        '<div>{{vm.service.engramsMoved}} moved so far.</div>',
        '<div ng-if="vm.service.movingEngrams">Moving engrams...</div>',
        '<div ng-if="vm.service.makingRoom">Making room for engrams...</div>',
        '</div>'
      ].join('')
    };
  }

  EngramFarmingCtrl.$inject = ['dimEngramFarmingService', 'dimCategory', 'dimItemTier', 'toaster', 'dimPlatformService', 'dimSettingsService', '$scope'];

  function EngramFarmingCtrl(dimEngramFarmingService, dimCategory, dimItemTier, toaster, dimPlatformService, dimSettingsService, $scope) {
    var vm = this;
    angular.extend(vm, {
      service: dimEngramFarmingService,
      stop: function($event) {
        $event.preventDefault();
        dimEngramFarmingService.stop();
      }
    });
  }
})();
