import _ from 'underscore';
import template from './settings.html';
import './settings.scss';
import { isPhonePortraitStream } from '../mediaQueries';
import { subscribeOnScope } from '../rx-utils';
import { changeLanguage } from 'i18next';
import exampleWeaponImage from 'app/images/example-weapon.jpg';
import exampleArmorImage from 'app/images/example-armor.jpg';

export const SettingsComponent = {
  template,
  controller: SettingsController,
  controllerAs: 'vm'
};

export function SettingsController(loadingTracker, dimSettingsService, $scope, dimCsvService, dimStoreService, D2StoresService, dimInfoService, OAuthTokenService, $state, $i18next, $rootScope) {
  'ngInject';

  const vm = this;

  vm.featureFlags = {
    qualityEnabled: $featureFlags.qualityEnabled,
    reviewsEnabled: $featureFlags.reviewsEnabled,
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
    vm.isPhonePortrait = isPhonePortrait;
  });

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


  vm.reviewsPlatformOptions = {
    0: $i18next.t('DtrReview.Platforms.All'),
    1: $i18next.t('DtrReview.Platforms.Xbox'),
    2: $i18next.t('DtrReview.Platforms.Playstation'),
    3: $i18next.t('DtrReview.Platforms.AllConsoles'),
    4: $i18next.t('DtrReview.Platforms.Pc')
  };

  if ($featureFlags.colorA11y) {
    vm.colorA11yOptions = ['-', 'Protanopia', 'Protanomaly', 'Deuteranopia', 'Deuteranomaly', 'Tritanopia', 'Tritanomaly', 'Achromatopsia', 'Achromatomaly'];
  }

  vm.fakeWeapon = {
    icon: `~${exampleWeaponImage}`,
    dtrRating: 4.6,
    dtrRatingCount: 100,
    dmg: 'void',
    isNew: true,
    location: {
      type: 'energy'
    },
    visible: true,
    primStat: {
      value: 300
    }
  };

  vm.fakeArmor = {
    icon: `~${exampleArmorImage}`,
    quality: {
      min: 96
    },
    isNew: true,
    location: {
      type: 'energy'
    },
    visible: true,
    primStat: {
      value: 300
    }
  };

  vm.settings = dimSettingsService;
  vm.initialLanguage = vm.settings.language;

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

  vm.reviewsPlatformChanged = function() {
    dimSettingsService.save();
    D2StoresService.refreshRatingsData();
  };

  vm.changeLanguage = function() {
    localStorage.dimLanguage = vm.settings.language;
    changeLanguage(vm.settings.language, () => {
      $rootScope.$applyAsync(() => {
        $rootScope.$broadcast('i18nextLanguageChange');
      });
    });
  };

  vm.reloadDim = function() {
    window.location.reload(false);
  };

  const itemSortProperties = {
    typeName: $i18next.t('Settings.SortByType'),
    rarity: $i18next.t('Settings.SortByRarity'),
    primStat: $i18next.t('Settings.SortByPrimary'),
    basePower: $i18next.t('Settings.SortByBasePower'),
    rating: $i18next.t('Settings.SortByRating'),
    classType: $i18next.t('Settings.SortByClassType'),
    name: $i18next.t('Settings.SortName')
    // archetype: 'Archetype'
  };

  // Sorts not on this list will be converted to "custom". This can be a different
  // list than the one in the settings service, since that list supports backwards
  // compatibility with old settings.
  vm.itemSortPresets = {
    primaryStat: 'Settings.SortPrimary',
    basePowerThenPrimary: 'Settings.SortBasePower',
    rarityThenPrimary: 'Settings.SortRarity',
    quality: 'Settings.SortRoll',
    name: 'Settings.SortName',
    typeThenPrimary: 'Settings.SortTypeThenPrimary',
    typeThenName: 'Settings.SortTypeThenName',
    custom: 'Settings.SortCustom'
  };

  const sortOrder = vm.settings.itemSortOrder();
  if (!vm.itemSortPresets[vm.settings.itemSort]) {
    vm.settings.itemSortOrderCustom = sortOrder;
    vm.settings.itemSort = 'custom';
  }

  vm.itemSortCustom = _.sortBy(_.map(itemSortProperties, (displayName, id) => {
    return {
      id,
      displayName,
      enabled: sortOrder.includes(id)
    };
  }), (o) => {
    const index = sortOrder.indexOf(o.id);
    return index >= 0 ? index : 999;
  });

  vm.itemSortOrderChanged = (sortOrder) => {
    vm.itemSortCustom = sortOrder;
    vm.settings.itemSortOrderCustom = sortOrder.filter((o) => o.enabled).map((o) => o.id);
    vm.settings.save();
  };
}
