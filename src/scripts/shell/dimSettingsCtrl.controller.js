import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp').controller('dimSettingsCtrl', SettingsController);

function SettingsController(loadingTracker, dimSettingsService, $scope, SyncService, dimCsvService, dimStoreService, dimInfoService, dimFeatureFlags, $window, $timeout) {
  var vm = this;

  vm.featureFlags = dimFeatureFlags;
  vm.loadingTracker = loadingTracker;

  $scope.$watchCollection('vm.settings', function() {
    dimSettingsService.save();
  });

  vm.charColOptions = _.range(3, 6).map((num) => ({ id: num, name: num }));
  vm.vaultColOptions = _.range(5, 21).map((num) => ({ id: num, name: num }));
  vm.vaultColOptions.unshift({ id: 999, name: 'Auto' });

  vm.languageOptions = {
    de: 'Deutsch',
    en: 'English',
    es: 'Español',
    fr: 'Français',
    it: 'Italiano',
    'pt-br': 'Português (Brasil)',
    ja: '日本語'
  };

  vm.settings = dimSettingsService;

  // Edge doesn't support these
  vm.supportsCssVar = window.CSS && window.CSS.supports && window.CSS.supports('width', 'var(--fake-var)', 0);

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

  vm.resetItemSize = function() {
    vm.settings.itemSize = window.matchMedia('(max-width: 1025px)').matches ? 38 : 44;
    vm.save();
  };

  vm.exportData = function() {
    // Function to download data to a file
    function download(data, filename, type) {
      var a = document.createElement("a");
      var file = new Blob([data], { type: type });
      var url = URL.createObjectURL(file);
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      $timeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      });
    }

    SyncService.get().then((data) => {
      download(JSON.stringify(data), 'dim-data.json', 'application/json');
    });
  };

  vm.importData = function() {
    var reader = new FileReader();
    reader.onload = function() {
      // TODO: we're kinda trusting that this is the right data here, no validation!
      SyncService.set(JSON.parse(reader.result), true);
      $window.alert("Imported DIM data!");
      $scope.$apply();
    };
    reader.readAsText(angular.element('#importFile')[0].files[0]);
  };
}
