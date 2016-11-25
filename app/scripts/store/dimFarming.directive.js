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
          <span ng-show="!vm.showReport">
            <div class="farm-description"><span>
              <p translate="{{vm.settings.farming.makeRoomForItems ? 'FarmingMode.Desc' : 'FarmingMode.MakeRoom.Desc'}}" translate-values="{ store: vm.service.store.name }"></p>
              </span>
              <i class="fa fa-list-alt fa-2x link" ng-click="vm.toggleReport()"></i>
            </div>
            <div class="item-details"><span>
              <p translate="FarmingMode.Configuration"></p>
              <p><input id="farm-greens" type='checkbox' ng-change="vm.settings.save()" ng-model='vm.settings.farming.farmGreens' /><label for="farm-greens" translate-attr="{ title: 'FarmingMode.Greens.Tooltip'}" translate="FarmingMode.Greens"></p>
              <p><input id="make-room-for-items" type='checkbox' ng-change="vm.settings.save()" ng-model='vm.settings.farming.makeRoomForItems' /><label for="make-room-for-items" translate-attr="{title: 'FarmingMode.MakeRoom.Tooltip'}" translate="FarmingMode.MakeRoom"></label></p>
            </span><span>
              <p translate="FarmingMode.Quickmove"></p>
              <p><dim-simple-item ng-repeat="item in vm.service.consolidate track by $index" item-data="item" ng-click="vm.consolidate(item, vm.service.store)"></dim-simple-item></p>
            </span></div>
          </span>
          <span ng-show="vm.showReport" id="report-block">
            <div class="farm-description">              
              <p>Farming Summary</p>
              <p>Elapsed: {{vm.reportService.elapsed}}</p>  
              <p>{{vm.reportService.glimmer}} <img src="/images/glimmer.png"> / {{vm.reportService.marks}} <img src="/images/legendaryMarks.png"></p>
              <i class="fa fa-list-alt fa-2x link" ng-click="vm.toggleReport()"></i>
            </div>
            <div class="farm-report">
              <p><dim-farm-item ng-repeat="item in vm.reportService.report track by $index" item-data="item"></dim-farm-item></p>
            </div>
          </span>
          <span><button ng-click="vm.stop($event)" translate="FarmingMode.Stop"></button></span>
        </div>`
    };
  }

  FarmingCtrl.$inject = ['dimFarmingService', 'dimItemMoveService', 'dimSettingsService', 'dimFarmingReportService'];

  function FarmingCtrl(dimFarmingService, dimItemMoveService, dimSettingsService, dimFarmingReportService) {
    var vm = this;

    vm.showReport = false;

    vm.toggleReport = function() {
      vm.showReport = !vm.showReport;
    };

    angular.extend(vm, {
      service: dimFarmingService,
      settings: dimSettingsService,
      consolidate: dimItemMoveService.consolidate,
      reportService: dimFarmingReportService,
      stop: function($event) {
        $event.preventDefault();
        dimFarmingService.stop();
      }
    });
  }
})();
