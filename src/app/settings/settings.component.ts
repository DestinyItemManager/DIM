import * as _ from 'underscore';
import template from './settings.html';
import './settings.scss';
import { isPhonePortraitStream } from '../mediaQueries';
import { subscribeOnScope } from '../rx-utils';
import { changeLanguage } from 'i18next';
import { settings } from './settings';
// tslint:disable-next-line:no-implicit-dependencies
import exampleWeaponImage from 'app/images/example-weapon.jpg';
// tslint:disable-next-line:no-implicit-dependencies
import exampleArmorImage from 'app/images/example-armor.jpg';
import { IComponentOptions, IController, IScope, IRootScopeService } from 'angular';
import { getDefinitions } from '../destiny2/d2-definitions.service';
import { getReviewModes } from '../destinyTrackerApi/reviewModesFetcher';
import { downloadCsvFiles } from '../inventory/dimCsvService.factory';
import { D2StoresService } from '../inventory/d2-stores.service';
import { D1StoresService } from '../inventory/d1-stores.service';
import { getPlatformOptions } from '../destinyTrackerApi/platformOptionsFetcher';

export const SettingsComponent: IComponentOptions = {
  template,
  controller: SettingsController,
  controllerAs: 'vm'
};

export function SettingsController(
  this: IController,
  loadingTracker,
  $scope: IScope,
  $i18next,
  $rootScope: IRootScopeService
) {
  'ngInject';

  const vm = this;

  vm.featureFlags = {
    reviewsEnabled: $featureFlags.reviewsEnabled,
    forsakenTiles: $featureFlags.forsakenTiles,
    colorA11y: $featureFlags.colorA11y
  };
  vm.loadingTracker = loadingTracker;

  $scope.$watchCollection('vm.settings', () => {
    settings.save();
  });

  vm.charColOptions = _.range(3, 6).map((num) => ({
    id: num,
    name: $i18next.t('Settings.ColumnSize', { num })
  }));
  vm.vaultColOptions = _.range(5, 21).map((num) => ({
    id: num,
    name: $i18next.t('Settings.ColumnSize', { num })
  }));
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
    ko: '한국어',
    pl: 'Polski',
    'pt-br': 'Português (Brasil)',
    ru: 'Русский',
    ja: '日本語',
    'zh-cht': '繁體中文' // Chinese (Traditional)
  };

  vm.reviewsPlatformOptions = getPlatformOptions();

  getDefinitions().then((defs) => {
    vm.reviewModeOptions = getReviewModes(defs);
  });

  if ($featureFlags.colorA11y) {
    vm.colorA11yOptions = [
      '-',
      'Protanopia',
      'Protanomaly',
      'Deuteranopia',
      'Deuteranomaly',
      'Tritanopia',
      'Tritanomaly',
      'Achromatopsia',
      'Achromatomaly'
    ];
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
    bucket: {
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
    bucket: {
      type: 'energy'
    },
    visible: true,
    primStat: {
      value: 300
    }
  };

  vm.settings = settings;
  vm.initialLanguage = vm.settings.language;

  // Edge doesn't support these
  vm.supportsCssVar = window.CSS && window.CSS.supports && window.CSS.supports('(--foo: red)');

  vm.downloadWeaponCsv = () => {
    downloadCsvFiles(
      vm.settings.destinyVersion === 2 ? D2StoresService.getStores() : D1StoresService.getStores(),
      'Weapons'
    );
    ga('send', 'event', 'Download CSV', 'Weapons');
  };

  vm.downloadArmorCsv = () => {
    downloadCsvFiles(
      vm.settings.destinyVersion === 2 ? D2StoresService.getStores() : D1StoresService.getStores(),
      'Armor'
    );
    ga('send', 'event', 'Download CSV', 'Armor');
  };

  vm.resetItemSize = () => {
    vm.settings.itemSize = window.matchMedia('(max-width: 1025px)').matches ? 38 : 48;
  };

  vm.saveAndReloadReviews = () => {
    settings.save();
    D2StoresService.refreshRatingsData();
  };

  vm.changeLanguage = () => {
    localStorage.setItem('dimLanguage', vm.settings.language);
    changeLanguage(vm.settings.language, () => {
      $rootScope.$applyAsync(() => {
        $rootScope.$broadcast('i18nextLanguageChange');
      });
    });
  };

  vm.reloadDim = () => {
    window.location.reload(false);
  };

  const itemSortProperties = {
    typeName: $i18next.t('Settings.SortByType'),
    rarity: $i18next.t('Settings.SortByRarity'),
    primStat: $i18next.t('Settings.SortByPrimary'),
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
    rarityThenPrimary: 'Settings.SortRarity',
    quality: 'Settings.SortRoll',
    name: 'Settings.SortName',
    custom: 'Settings.SortCustom'
  };

  const sortOrder = vm.settings.itemSortOrder();
  if (!vm.itemSortPresets[vm.settings.itemSort]) {
    vm.settings.itemSortOrderCustom = sortOrder;
    vm.settings.itemSort = 'custom';
  }

  vm.itemSortCustom = _.sortBy(
    _.map(itemSortProperties, (displayName, id) => {
      return {
        id,
        displayName,
        enabled: sortOrder.includes(id)
      };
    }),
    (o) => {
      const index = sortOrder.indexOf(o.id);
      return index >= 0 ? index : 999;
    }
  );

  vm.itemSortOrderChanged = (sortOrder) => {
    vm.itemSortCustom = sortOrder;
    vm.settings.itemSortOrderCustom = sortOrder.filter((o) => o.enabled).map((o) => o.id);
    vm.settings.save();
  };

  vm.characterSortOrderChanged = (account, sortOrder) => {
    console.log(account, sortOrder);
  };
}
