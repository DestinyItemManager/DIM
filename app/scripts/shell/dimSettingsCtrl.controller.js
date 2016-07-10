(function() {
  'use strict';

  angular.module('dimApp').controller('dimSettingsCtrl', SettingsController);

  SettingsController.$inject = ['dimSettingsService', '$scope', 'SyncService'];

  function SettingsController(settings, $scope, SyncService) {
    var vm = this;

    $scope.$watchCollection('vm.settings', function() {
      settings.save();
    });

    vm.charColOptions = _.range(3, 6).map((num) => ({ id: num, name: num }));
    vm.vaultColOptions = _.range(5, 21).map((num) => ({ id: num, name: num }));
    vm.vaultColOptions.unshift({ id: 999, name: 'Auto' });

    vm.settings = settings;

    vm.showSync = function() {
      return SyncService.drive();
    };

    vm.driveSync = function() {
      SyncService.authorize();
    };
  }
})();
