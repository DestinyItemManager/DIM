import _ from 'underscore';
import template from './settings.html';
import './settings.scss';

export const SettingsComponent = {
  template,
  controller: SettingsController,
  controllerAs: 'vm'
};

export function SettingsController(loadingTracker, dimSettingsService, $scope, dimCsvService, dimStoreService, dimInfoService, OAuthTokenService, $state, $translate, ngDialog) {
  'ngInject';

  const vm = this;

  vm.featureFlags = {
    qualityEnabled: $featureFlags.qualityEnabled,
    reviewsEnabled: $featureFlags.reviewsEnabled,
    tagsEnabled: $featureFlags.tagsEnabled,
    colorA11y: $featureFlags.colorA11y
  };
  vm.loadingTracker = loadingTracker;

  $scope.$watchCollection('vm.settings', () => {
    dimSettingsService.save();
  });

  vm.charColOptions = _.range(3, 6).map((num) => ({ id: num, name: $translate.instant('Settings.ColumnSize', { num }) }));
  vm.vaultColOptions = _.range(5, 21).map((num) => ({ id: num, name: $translate.instant('Settings.ColumnSize', { num }) }));
  vm.vaultColOptions.unshift({ id: 999, name: $translate.instant('Settings.ColumnSizeAuto') });

  vm.filters = {};

  vm.filters.vendors = {
    FWC: $translate.instant('Filter.Vendors.FWC'),
    DO: $translate.instant('Filter.Vendors.DO'),
    NM: $translate.instant('Filter.Vendors.NM'),
    Speaker: $translate.instant('Filter.Vendors.Speaker'),
    Shipwright: $translate.instant('Filter.Vendors.Shipwright'),
    CQ: $translate.instant('Filter.Vendors.CQ'),
    EV: $translate.instant('Filter.Vendors.EV'),
    Gunsmith: $translate.instant('Filter.Vendors.Gunsmith'),
  };

  vm.filters.releases = {
    Vanilla: $translate.instant('Filter.Releases.Vanilla'),
    tTK: $translate.instant('Filter.Releases.tTK'),
    RoI: $translate.instant('Filter.Releases.RoI')
  };

  vm.filters.activities = {
    QW: $translate.instant('Filter.Activities.QW'),
    IB: $translate.instant('Filter.Activities.IB'),
    VoG: $translate.instant('Filter.Activities.VoG'),
    CE: $translate.instant('Filter.Activities.CE'),
    PoE: $translate.instant('Filter.Activities.PoE'),
    ToO: $translate.instant('Filter.Activities.ToO'),
    CoE: $translate.instant('Filter.Activities.CoE'),
    KF: $translate.instant('Filter.Activities.KF'),
    SRL: $translate.instant('Filter.Activities.SRL'),
    CD: $translate.instant('Filter.Activities.CD'),
    AF: $translate.instant('Filter.Activities.AF'),
    WotM: $translate.instant('Filter.Activities.WotM'),
    Dawning: $translate.instant('Filter.Activities.Dawning'),
    AoT: $translate.instant('Filter.Activities.AoT')
  };
  vm.languageOptions = {
    de: 'Deutsch',
    en: 'English',
    es: 'Español',
    fr: 'Français',
    it: 'Italiano',
    'pt-br': 'Português (Brasil)',
    ja: '日本語'
  };

  if ($featureFlags.colorA11y) {
    vm.colorA11yOptions = ['-', 'Protanopia', 'Protanomaly', 'Deuteranopia', 'Deuteranomaly', 'Tritanopia', 'Tritanomaly', 'Achromatopsia', 'Achromatomaly'];
  }

  vm.settings = dimSettingsService;

  // Edge doesn't support these
  vm.supportsCssVar = window.CSS && window.CSS.supports && window.CSS.supports('width', 'var(--fake-var)', 0);

  vm.logout = function() {
    OAuthTokenService.removeToken();
    ngDialog.closeAll();
    $state.go('login', { reauth: true });
  };

  vm.downloadWeaponCsv = function() {
    dimCsvService.downloadCsvFiles(dimStoreService.getStores(), "Weapons");
    ga('send', 'event', 'Download CSV', 'Weapons');
  };

  vm.downloadArmorCsv = function() {
    dimCsvService.downloadCsvFiles(dimStoreService.getStores(), "Armor");
    ga('send', 'event', 'Download CSV', 'Armor');
  };

  vm.resetHiddenInfos = function() {
    dimInfoService.resetHiddenInfos();
  };

  vm.resetItemSize = function() {
    vm.settings.itemSize = window.matchMedia('(max-width: 1025px)').matches ? 38 : 44;
  };
}
