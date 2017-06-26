import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp').controller('dimSettingsCtrl', SettingsController);

function SettingsController(loadingTracker, dimSettingsService, $scope, dimCsvService, dimStoreService, dimInfoService, OAuthTokenService, $state) {
  const vm = this;

  vm.featureFlags = {
    qualityEnabled: $featureFlags.qualityEnabled,
    reviewsEnabled: $featureFlags.reviewsEnabled,
    tagsEnabled: $featureFlags.tagsEnabled
  };
  vm.loadingTracker = loadingTracker;

  $scope.$watchCollection('vm.settings', () => {
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

  vm.logout = function() {
    OAuthTokenService.removeToken();
    $scope.closeThisDialog(); // eslint-disable-line angular/controller-as
    $state.go('login', { reauth: true });
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
}
