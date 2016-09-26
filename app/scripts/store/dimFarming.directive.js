(function() {
  'use strict';

  angular.module('dimApp').directive('dimFarming', Farming);

  function Farming() {
    return {
      controller: FarmingCtrl,
      controllerAs: 'vm',
      bindToController: true,
      scope: {},
      template: [
        '<div id="item-farming" ng-if="vm.service.active">',
        '  <div class="engram-icon">',
        '    <div class="item-count">{{vm.service.itemsMoved}}</div>',
        '    <img class="engram" ng-class="{ active: (vm.service.movingItems || vm.service.makingRoom) }" src="/images/engram.svg" height="60" width="60"/>',
        '  </div>',
        '  <div class="item-details">',
        '    <h1>Sending {{vm.service.store.name}}\'s items to the vault</h1>',
        '    <p>DIM will watch for new items and move them to the vault. It\'ll also keep one space open per type to keep anything from going to the Postmaster.</p>',
        '    <ul><li><input type="checkbox" id="farm-engrams" ng-model="vm.settings.engrams"/><label for="farm-engrams">Engrams</label>',
        '      </li><li><input type="checkbox" id="farm-glimmer" ng-model="vm.settings.glimmer"/><label for="farm-glimmer">Glimmer items</label>',
        '    </li></ul>',
        '  </div>',
        '  <button ng-click="vm.stop($event)">Stop</button>',
        '</div>'
      ].join('')
    };
  }

  FarmingCtrl.$inject = ['dimFarmingService', 'dimSettingsService'];

  function FarmingCtrl(dimFarmingService, dimSettingsService) {
    var vm = this;
    angular.extend(vm, {
      service: dimFarmingService,
      settings: dimSettingsService.farming,
      stop: function($event) {
        $event.preventDefault();
        dimFarmingService.stop();
      }
    });
  }
})();
