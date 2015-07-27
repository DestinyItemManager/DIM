(function() {
  'use strict';

  angular.module('dimApp').controller('dimSettingsCtrl', SettingsController);

  SettingsController.$inject = ['dimSettingsService', '$scope'];

  function SettingsController(settings, $scope) {
    var vm = $scope.vm = {};

    settings.getSetting()
      .then(function(s) {
        vm.settings = s;
      });

    vm.save = function(key) {
      settings.saveSetting(key, vm.settings[key]);
    };
  }
})();
