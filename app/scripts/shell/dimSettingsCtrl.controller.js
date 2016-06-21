(function() {
  'use strict';

  angular.module('dimApp').controller('dimSettingsCtrl', SettingsController);

  SettingsController.$inject = ['dimSettingsService', '$scope'];

  function SettingsController(settings, $scope) {
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
  }
})();
