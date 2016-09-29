(function() {
  'use strict';

  angular.module('dimApp').directive('dimFarming', Farming);

  function Farming() {
    return {
      controller: FarmingCtrl,
      controllerAs: 'vm',
      bindToController: true,
      scope: {},
      template: `
        <div ng-if="vm.service.active" id="item-farming">
          <span class="engram-icon">
            <div class="item-count">{{vm.service.itemsMoved}}</div>
            <img class="engram" ng-class="{ active: (vm.service.movingItems || vm.service.makingRoom) }" src="/images/engram.svg" height="60" width="60"/>
          </span>
          <span>
            <p>DIM is moving new items from {{vm.service.store.name}} to the vault and leaving one space open per item type to prevent items from going to the Postmaster.</p>
            <p class="item-details">
              <span>
                <input type="checkbox" id="farm-vault" ng-model="vm.settings.characterStorage"/><label for="farm-vault">Use characters for storage <i class="fa fa-question-circle" title="If this is checked, then farmed items will be moved to the vault and any characters. If you're trying to maximize your storage options, keep this checked. Be warned, for the most efficient storage, some items may move to unexpected places on other characters."></i></label>
              </span><span>
                <input type="checkbox" id="farm-greens" ng-model="vm.settings.keepGreens"/><label for="farm-greens">Keep Uncommon Items <i class="fa fa-question-circle" title="If this is checked, then Uncommon (green) items will have a higher preference of staying on your active character. This is useful if you have an active habit of dismantling greens. Be warned, any other item may be moved out of your inventory to prioritize keeping the greens."></i></label>
              </span>
            </p>
            <div class="item-details"><span>
                <p>Farm Items</p>
                <ul>
                  <li><input type="checkbox" id="farm-engrams" ng-model="vm.settings.engrams"/><label for="farm-engrams">Engrams</label></li>
                  <li><input type="checkbox" id="farm-glimmer" ng-model="vm.settings.glimmer"/><label for="farm-glimmer">Glimmer Items</label></li>
                </ul>
              </span><span>
                <p>Quick Move</p>
                <p><dim-simple-item ng-repeat="item in vm.service.consolidate track by $index" item-data="item" ng-click="vm.consolidate(item, vm.service.store)"></dim-simple-item></p>
              </span>
            </div>
          </span>
          <span><button ng-click="vm.stop($event)">Stop</button></span>
        </div>`
    };
  }

  FarmingCtrl.$inject = ['dimFarmingService', 'dimSettingsService', 'dimItemMoveService'];

  function FarmingCtrl(dimFarmingService, dimSettingsService, dimItemMoveService) {
    var vm = this;

    angular.extend(vm, {
      service: dimFarmingService,
      settings: dimSettingsService.farming,
      consolidate: dimItemMoveService.consolidate,
      stop: function($event) {
        $event.preventDefault();
        dimFarmingService.stop();
      }
    });
  }
})();
