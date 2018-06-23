import { copy as angularCopy, IAngularEvent, IComponentOptions, IController } from 'angular';
import * as _ from 'underscore';
import { queueAction } from '../inventory/action-queue';
import {
  gatherEngramsLoadout,
  gatherTokensLoadout,
  itemLevelingLoadout,
  maxLightLoadout,
  searchLoadout
  } from './auto-loadouts';
import template from './loadout-popup.html';
import './loadout-popup.scss';
import { Loadout, LoadoutClass, dimLoadoutService, getLight } from './loadout.service';
import { makeRoomForPostmaster, pullablePostmasterItems, pullFromPostmaster } from './postmaster';
import { getActivePlatform, getPlatformMatching } from '../accounts/platform.service';
import { IDialogService } from 'ng-dialog';
import { getBuckets as d2GetBuckets } from '../destiny2/d2-buckets.service';
import { getBuckets as d1GetBuckets } from '../destiny1/d1-buckets.service';
import { dimItemService } from '../inventory/dimItemService.factory';
import { DimStore } from '../inventory/store-types';
import { SearchService } from '../search/search-filter.component';
import { D2FarmingService } from '../farming/d2farming.service';
import { D1FarmingService } from '../farming/farming.service';

export const LoadoutPopupComponent: IComponentOptions = {
  controller: LoadoutPopupCtrl,
  controllerAs: 'vm',
  bindings: {
    store: '<'
  },
  template
};

interface LoadoutPopupCtrlVM extends IController {
  loadout: Loadout;
  previousLoadout?: Loadout;
  classTypeId: LoadoutClass;
  store: DimStore;
  numPostmasterItems: number;
  search;
  loadouts: Loadout[];
  hasClassified: boolean;
  maxLightValue: string;

  newLoadout($event: IAngularEvent);
  newLoadoutFromEquipped($event: IAngularEvent);
  editLoadout(loadout: Loadout | {}, $event: IAngularEvent);
  deleteLoadout(loadout: Loadout);
  applyLoadout(loadout: Loadout, $event: IAngularEvent, filterToEquipped?: boolean);
  itemLevelingLoadout($event: IAngularEvent);
  maxLightLoadout($event: IAngularEvent);
  gatherEngramsLoadout($event: IAngularEvent);
  gatherTokensLoadout($event: IAngularEvent);
  searchLoadout($event: IAngularEvent);
  makeRoomForPostmaster();
  pullFromPostmaster();
  startFarming($event: IAngularEvent);
}

function LoadoutPopupCtrl(
  this: LoadoutPopupCtrlVM,
  $rootScope,
  $scope,
  ngDialog: IDialogService,
  toaster,
  $window,
  $i18next,
  $stateParams
) {
  'ngInject';
  const vm = this;

  vm.$onInit = () => {
    vm.previousLoadout = _.last(dimLoadoutService.previousLoadouts[vm.store.id]);

    vm.classTypeId = {
      warlock: 0,
      titan: 1,
      hunter: 2
    }[vm.store.class];
    if (vm.classTypeId === undefined) {
      vm.classTypeId = -1;
    }

    vm.numPostmasterItems = pullablePostmasterItems(this.store).length;

    initLoadouts();

    vm.hasClassified = vm.store.getStoresService().getAllItems().some((i) => {
      return i.classified &&
        (i.location.sort === 'Weapons' ||
        i.location.sort === 'Armor' ||
        i.type === 'Ghost');
    });
    vm.maxLightValue = getLight(vm.store, maxLightLoadout(vm.store.getStoresService(), vm.store)) + (vm.hasClassified ? '*' : '');
  };

  vm.search = SearchService;

  function initLoadouts() {
    dimLoadoutService.getLoadouts()
      .then((loadouts) => {
        const platform = getActivePlatform();
        if (!platform) {
          return;
        }

        vm.loadouts = _.sortBy(loadouts, 'name') || [];

        vm.loadouts = vm.loadouts.filter((loadout: Loadout) => {
          return (vm.store.destinyVersion === 2
            ? loadout.destinyVersion === 2 : loadout.destinyVersion !== 2) &&
            (_.isUndefined(loadout.platform) ||
                  loadout.platform === platform.platformLabel) &&
            (vm.classTypeId === -1 ||
             loadout.classType === -1 ||
             loadout.classType === vm.classTypeId);
        });
      });
  }
  $scope.$on('dim-save-loadout', initLoadouts);
  $scope.$on('dim-delete-loadout', initLoadouts);

  vm.newLoadout = function newLoadout($event: IAngularEvent) {
    ngDialog.closeAll();
    vm.editLoadout({}, $event);
  };

  vm.newLoadoutFromEquipped = function newLoadoutFromEquipped($event: IAngularEvent) {
    ngDialog.closeAll();

    const loadout = filterLoadoutToEquipped(vm.store.loadoutFromCurrentlyEquipped(""));
    // We don't want to prepopulate the loadout with a bunch of cosmetic junk
    // like emblems and ships and horns.
    loadout.items = _.pick(loadout.items,
                           'class',
                           'kinetic',
                           'energy',
                           'power',
                           'primary',
                           'special',
                           'heavy',
                           'helmet',
                           'gauntlets',
                           'chest',
                           'leg',
                           'classitem',
                           'artifact',
                           'ghost');
    loadout.classType = vm.classTypeId;
    vm.editLoadout(loadout, $event);
  };

  vm.deleteLoadout = function deleteLoadout(loadout: Loadout) {
    if ($window.confirm($i18next.t('Loadouts.ConfirmDelete', { name: loadout.name }))) {
      dimLoadoutService.deleteLoadout(loadout)
        .catch((e) => {
          toaster.pop('error',
                      $i18next.t('Loadouts.DeleteErrorTitle'),
                      $i18next.t('Loadouts.DeleteErrorDescription', { loadoutName: loadout.name, error: e.message }));
          console.error(e);
        });
    }
  };

  vm.editLoadout = function editLoadout(loadout: Loadout) {
    ngDialog.closeAll();
    $rootScope.$broadcast('dim-edit-loadout', {
      loadout,
      showClass: true
    });
  };

  // TODO: move all these fancy loadouts to a new service

  vm.applyLoadout = function applyLoadout(loadout, $event, filterToEquipped) {
    $event.preventDefault();
    ngDialog.closeAll();
    D1FarmingService.stop();
    D2FarmingService.stop();

    if (filterToEquipped) {
      loadout = filterLoadoutToEquipped(loadout);
    }

    dimLoadoutService.applyLoadout(vm.store, loadout, true).then(() => {
      vm.previousLoadout = _.last(dimLoadoutService.previousLoadouts[vm.store.id]);
    });
  };

  function filterLoadoutToEquipped(loadout: Loadout) {
    const filteredLoadout = angularCopy(loadout);
    filteredLoadout.items = _.mapObject(filteredLoadout.items, (items) => items.filter((i) => i.equipped));
    return filteredLoadout;
  }

  // A dynamic loadout set up to level weapons and armor
  vm.itemLevelingLoadout = ($event: IAngularEvent) => {
    const loadout = itemLevelingLoadout(vm.store.getStoresService(), vm.store);
    vm.applyLoadout(loadout, $event);
  };

  // Apply a loadout that's dynamically calculated to maximize Light level (preferring not to change currently-equipped items)
  vm.maxLightLoadout = ($event: IAngularEvent) => {
    const loadout = maxLightLoadout(vm.store.getStoresService(), vm.store);
    vm.applyLoadout(loadout, $event);
  };

  // A dynamic loadout set up to level weapons and armor
  vm.gatherEngramsLoadout = ($event: IAngularEvent, options: { exotics: boolean } = { exotics: false }) => {
    let loadout;
    try {
      loadout = gatherEngramsLoadout(vm.store.getStoresService(), options);
    } catch (e) {
      toaster.pop('warning', $i18next.t('Loadouts.GatherEngrams'), e.message);
      return;
    }
    vm.applyLoadout(loadout, $event);
  };

  vm.gatherTokensLoadout = ($event: IAngularEvent) => {
    let loadout;
    try {
      loadout = gatherTokensLoadout(vm.store.getStoresService());
    } catch (e) {
      toaster.pop('warning', $i18next.t('Loadouts.GatherTokens'), e.message);
      return;
    }
    vm.applyLoadout(loadout, $event);
  };

  // Move items matching the current search. Max 9 per type.
  vm.searchLoadout = ($event: IAngularEvent) => {
    const loadout = searchLoadout(vm.store.getStoresService(), vm.store);
    vm.applyLoadout(loadout, $event);
  };

  vm.makeRoomForPostmaster = () => {
    ngDialog.closeAll();
    const bucketsService = vm.store.destinyVersion === 1 ? d1GetBuckets : d2GetBuckets;
    return queueAction(() => makeRoomForPostmaster(vm.store, toaster, bucketsService));
  };

  vm.pullFromPostmaster = () => {
    ngDialog.closeAll();
    return queueAction(() => pullFromPostmaster(vm.store, dimItemService, toaster));
  };

  vm.startFarming = function startFarming() {
    ngDialog.closeAll();
    (vm.store.destinyVersion === 2 ? D2FarmingService : D1FarmingService).start(getPlatformMatching({
      membershipId: $stateParams.membershipId,
      platformType: $stateParams.platformType
    })!, vm.store.id);
  };
}
