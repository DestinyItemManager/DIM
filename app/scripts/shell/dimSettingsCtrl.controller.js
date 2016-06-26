(function() {
  'use strict';

  angular.module('dimApp').controller('dimSettingsCtrl', SettingsController);

  SettingsController.$inject = ['dimSettingsService', '$scope', '$rootScope', 'SyncService'];

  function SettingsController(settings, $scope, $rootScope, SyncService) {
    var vm = $scope.vm = {};

    vm.charColOptions = [
      { id: 3, name: '3' },
      { id: 4, name: '4' },
      { id: 5, name: '5' }
    ];

    settings.getSetting()
      .then(function(s) {
        vm.settings = s;
      });

    vm.save = function(key) {
      settings.saveSetting(key, vm.settings[key]);
    };

    vm.showSync = function() {
      return SyncService.drive();
    };

    vm.driveSync = function() {
      SyncService.authorize().then(function() {
        // TODO: still requires a hard refresh... why does this not work?
        $rootScope.$broadcast('dim-settings-updated');
      });
    };
  }
})();
