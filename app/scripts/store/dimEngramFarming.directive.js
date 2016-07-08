(function() {
  'use strict';

  angular.module('dimApp').directive('dimEngramFarming', EngramFarming);

  function EngramFarming() {
    return {
      controller: EngramFarmingCtrl,
      controllerAs: 'vm',
      bindToController: true,
      scope: {},
      template: [
        '<div id="engram-farming" ng-if="vm.service.active">',
        '  <div class="engram-icon">',
        '    <div class="engram-count">{{vm.service.engramsMoved}}</div>',
        '    <img class="engram" ng-class="{ active: (vm.service.movingEngrams || vm.service.makingRoom) }" src="/images/engram.svg" height="60" width="60"/>',
        '  </div>',
        '  <div class="engram-details">',
        '    <h1>Sending {{vm.service.store.name}}\'s engrams to the vault</h1>',
        '    <p>DIM will watch for engrams and move them to the vault. It\'ll also keep one space open per type to keep engrams from going to the Postmaster.</p>',
        '  </div>',
        '  <button ng-click="vm.stop($event)">Stop</button>',
        '</div>'
      ].join('')
    };
  }

  EngramFarmingCtrl.$inject = ['dimEngramFarmingService'];

  function EngramFarmingCtrl(dimEngramFarmingService) {
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
