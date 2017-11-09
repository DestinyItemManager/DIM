import _ from 'underscore';
import template from './settings.html';
import './settings.scss';
import { isPhonePortraitStream } from '../mediaQueries';
import { subscribeOnScope } from '../rx-utils';

export const SettingsComponent = {
  template,
  controller: SettingsController,
  controllerAs: 'vm'
};

export function SettingsController(loadingTracker, dimSettingsService, $scope, dimCsvService, dimStoreService, D2StoresService, dimInfoService, OAuthTokenService, $state, $i18next, dimDestinyTrackerService) {
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

  vm.charColOptions = _.range(3, 6).map((num) => ({ id: num, name: $i18next.t('Settings.ColumnSize', { num }) }));
  vm.vaultColOptions = _.range(5, 21).map((num) => ({ id: num, name: $i18next.t('Settings.ColumnSize', { num }) }));
  vm.vaultColOptions.unshift({ id: 999, name: $i18next.t('Settings.ColumnSizeAuto') });

  subscribeOnScope($scope, isPhonePortraitStream(), (isPhonePortrait) => {
    $scope.$apply(() => {
      vm.isPhonePortrait = isPhonePortrait;
    });
  });

  vm.filters = {
    vendors: {
      FWC: $i18next.t('Filter.Vendors.FWC'),
      DO: $i18next.t('Filter.Vendors.DO'),
      NM: $i18next.t('Filter.Vendors.NM'),
      Speaker: $i18next.t('Filter.Vendors.Speaker'),
      Shipwright: $i18next.t('Filter.Vendors.Shipwright'),
      CQ: $i18next.t('Filter.Vendors.CQ'),
      EV: $i18next.t('Filter.Vendors.EV'),
      Gunsmith: $i18next.t('Filter.Vendors.Gunsmith'),
    },
    releases: {
      Vanilla: $i18next.t('Filter.Releases.Vanilla'),
      tTK: $i18next.t('Filter.Releases.tTK'),
      RoI: $i18next.t('Filter.Releases.RoI')
    },
    activities: {
      QW: $i18next.t('Filter.Activities.QW'),
      IB: $i18next.t('Filter.Activities.IB'),
      VoG: $i18next.t('Filter.Activities.VoG'),
      CE: $i18next.t('Filter.Activities.CE'),
      PoE: $i18next.t('Filter.Activities.PoE'),
      ToO: $i18next.t('Filter.Activities.ToO'),
      CoE: $i18next.t('Filter.Activities.CoE'),
      KF: $i18next.t('Filter.Activities.KF'),
      SRL: $i18next.t('Filter.Activities.SRL'),
      CD: $i18next.t('Filter.Activities.CD'),
      AF: $i18next.t('Filter.Activities.AF'),
      WotM: $i18next.t('Filter.Activities.WotM'),
      Dawning: $i18next.t('Filter.Activities.Dawning'),
      AoT: $i18next.t('Filter.Activities.AoT')
    }
  };

  vm.languageOptions = {
    de: 'Deutsch',
    en: 'English',
    es: 'Español (España)',
    'es-mx': 'Español (México)',
    fr: 'Français',
    it: 'Italiano',
    pl: 'Polski',
    'pt-br': 'Português (Brasil)',
    ru: 'Русский',
    ja: '日本語',
    'zh-cht': '繁體中文' // Chinese (Traditional)
  };

  vm.platformOptions = {
    0: $i18next.t('Filter.Platforms.All'),
    1: $i18next.t('Filter.Platforms.Xbox'),
    2: $i18next.t('Filter.Platforms.Playstation'),
    3: $i18next.t('Filter.Platforms.AllConsoles'),
    4: $i18next.t('Filter.Platforms.Pc')
  };

  if ($featureFlags.colorA11y) {
    vm.colorA11yOptions = ['-', 'Protanopia', 'Protanomaly', 'Deuteranopia', 'Deuteranomaly', 'Tritanopia', 'Tritanomaly', 'Achromatopsia', 'Achromatomaly'];
  }

  vm.settings = dimSettingsService;

  // Edge doesn't support these
  vm.supportsCssVar = window.CSS && window.CSS.supports && window.CSS.supports('width', 'var(--fake-var)', 0);

  vm.downloadWeaponCsv = function() {
    dimCsvService.downloadCsvFiles(vm.settings.destinyVersion === 2 ? D2StoresService.getStores() : dimStoreService.getStores(), "Weapons");
    ga('send', 'event', 'Download CSV', 'Weapons');
  };

  vm.downloadArmorCsv = function() {
    dimCsvService.downloadCsvFiles(vm.settings.destinyVersion === 2 ? D2StoresService.getStores() : dimStoreService.getStores(), "Armor");
    ga('send', 'event', 'Download CSV', 'Armor');
  };

  vm.resetHiddenInfos = function() {
    dimInfoService.resetHiddenInfos();
  };

  vm.resetItemSize = function() {
    vm.settings.itemSize = window.matchMedia('(max-width: 1025px)').matches ? 38 : 44;
  };

  vm.platformChanged = function() {
    // bugbug: need to get stores for fetch after this
    dimDestinyTrackerService.clearCache();
  };
}
