(function() {
  'use strict';

  angular.module('dimApp').controller('dimSettingsCtrl', SettingsController);

  SettingsController.$inject = ['dimSettingsService', '$scope', 'SyncService'];

  function SettingsController(settings, $scope, SyncService) {
    var vm = this;

    $scope.$watchCollection('vm.settings', function() {
      settings.save();
    });

    vm.charColOptions = [
      { id: 3, name: '3' },
      { id: 4, name: '4' },
      { id: 5, name: '5' }
    ];

    vm.settings = settings;

    vm.showSync = function() {
      return SyncService.drive();
    };

    vm.driveSync = function() {
      SyncService.authorize();
    };
  }
})();
