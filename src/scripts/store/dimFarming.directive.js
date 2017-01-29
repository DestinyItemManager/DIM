const angular = require('angular');

angular.module('dimApp').directive('dimFarming', Farming);

function Farming() {
  return {
    controller: FarmingCtrl,
    controllerAs: 'vm',
    bindToController: true,
    scope: {},
    templateUrl: require('./dimFarming.directive.template.html')
  };
}

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

