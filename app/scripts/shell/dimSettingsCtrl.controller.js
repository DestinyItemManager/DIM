(function() {
  'use strict';

  angular.module('dimApp').controller('dimSettingsCtrl', SettingsController);

  SettingsController.$inject = ['dimSettingsService', '$scope', 'SyncService', 'dimCsvService', 'dimStoreService', 'dimInfoService', 'dimFeatureFlags'];

  function SettingsController(settings, $scope, SyncService, dimCsvService, dimStoreService, dimInfoService, dimFeatureFlags) {
    var vm = this;

    vm.featureFlags = dimFeatureFlags;

    $scope.$watchCollection('vm.settings', function() {
      settings.save();
    });

    vm.charColOptions = _.range(3, 6).map((num) => ({ id: num, name: num }));
    vm.vaultColOptions = _.range(5, 21).map((num) => ({ id: num, name: num }));
    vm.vaultColOptions.unshift({ id: 999, name: 'Auto' });

    vm.languageOptions = {
      en: 'English',
      de: 'Deutsch',
      fr: 'Français',
      es: 'Español',
      it: 'Italiano',
      ja: '日本語',
      'pt-br': 'Português do Brasil'
    };

    vm.settings = settings;

    vm.showSync = function() {
      return SyncService.drive();
    };

    vm.driveSync = function() {
      SyncService.authorize();
    };

    vm.downloadWeaponCsv = function() {
      dimCsvService.downloadCsvFiles(dimStoreService.getStores(), "Weapons");
      _gaq.push(['_trackEvent', 'Download CSV', 'Weapons']);
    };

    vm.downloadArmorCsv = function() {
      dimCsvService.downloadCsvFiles(dimStoreService.getStores(), "Armor");
      _gaq.push(['_trackEvent', 'Download CSV', 'Armor']);
    };

    vm.resetHiddenInfos = function() {
      dimInfoService.resetHiddenInfos();
    };
  }
})();
