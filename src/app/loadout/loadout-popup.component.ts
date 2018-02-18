import { copy as angularCopy, IAngularEvent } from 'angular';
import * as _ from 'underscore';
import { StoreServiceType } from '../inventory/d2-stores.service';
import { DimStore } from '../inventory/store/d2-store-factory.service';
import { queueAction } from '../services/action-queue';
import {
  gatherEngramsLoadout,
  gatherTokensLoadout,
  itemLevelingLoadout,
  maxLightLoadout,
  searchLoadout
  } from './auto-loadouts';
import template from './loadout-popup.html';
import './loadout-popup.scss';
import { Loadout, LoadoutClass } from './loadout.service';
import { makeRoomForPostmaster, pullablePostmasterItems, pullFromPostmaster } from './postmaster';
import { PlatformServiceType } from '../accounts/platform.service';
import { IDialogService } from 'ng-dialog';

export const LoadoutPopupComponent = {
  controller: LoadoutPopupCtrl,
  controllerAs: 'vm',
  bindings: {
    store: '<'
  },
  template
};

interface LoadoutPopupCtrlVM {
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
  dimLoadoutService,
  dimItemService,
  toaster,
  dimFarmingService,
  D2FarmingService,
  $window,
  dimSearchService,
  dimPlatformService: PlatformServiceType,
  $i18next,
  dimBucketService,
  D2BucketsService,
  dimStoreService,
  D2StoresService,
  $stateParams
) {
  'ngInject';
  const vm = this;
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

  vm.search = dimSearchService;

  const storeService: StoreServiceType = this.store.destinyVersion === 1 ? dimStoreService : D2StoresService;

  function initLoadouts() {
    dimLoadoutService.getLoadouts()
      .then((loadouts) => {
        const platform = dimPlatformService.getActive();
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
  initLoadouts();

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
                      $i18next.t('Loadouts.DeleteErrorDescription', { loadoutName: vm.loadout.name, error: e.message }));
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

  vm.hasClassified = storeService.getAllItems().some((i) => {
    return i.classified &&
      (i.location.sort === 'Weapons' ||
       i.location.sort === 'Armor' ||
       i.type === 'Ghost');
  });
  vm.maxLightValue = dimLoadoutService.getLight(vm.store, maxLightLoadout(storeService, vm.store)) + (vm.hasClassified ? '*' : '');

  // TODO: move all these fancy loadouts to a new service

  vm.applyLoadout = function applyLoadout(loadout, $event, filterToEquipped) {
    $event.preventDefault();
    ngDialog.closeAll();
    dimFarmingService.stop();
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
    const loadout = itemLevelingLoadout(storeService, vm.store);
    vm.applyLoadout(loadout, $event);
  };

  // Apply a loadout that's dynamically calculated to maximize Light level (preferring not to change currently-equipped items)
  vm.maxLightLoadout = ($event: IAngularEvent) => {
    const loadout = maxLightLoadout(storeService, vm.store);
    vm.applyLoadout(loadout, $event);
  };

  // A dynamic loadout set up to level weapons and armor
  vm.gatherEngramsLoadout = ($event: IAngularEvent, options: { exotics: boolean } = { exotics: false }) => {
    let loadout;
    try {
      loadout = gatherEngramsLoadout(storeService, options);
    } catch (e) {
      toaster.pop('warning', $i18next.t('Loadouts.GatherEngrams'), e.message);
      return;
    }
    vm.applyLoadout(loadout, $event);
  };

  vm.gatherTokensLoadout = ($event: IAngularEvent) => {
    let loadout;
    try {
      loadout = gatherTokensLoadout(storeService);
    } catch (e) {
      toaster.pop('warning', $i18next.t('Loadouts.GatherTokens'), e.message);
      return;
    }
    vm.applyLoadout(loadout, $event);
  };

  // Move items matching the current search. Max 9 per type.
  vm.searchLoadout = ($event: IAngularEvent) => {
    const loadout = searchLoadout(storeService, vm.store);
    vm.applyLoadout(loadout, $event);
  };

  vm.makeRoomForPostmaster = () => {
    ngDialog.closeAll();
    const bucketsService = vm.store.destinyVersion === 1 ? dimBucketService : D2BucketsService;
    return queueAction(() => makeRoomForPostmaster(storeService, vm.store, dimItemService, toaster, bucketsService));
  };

  vm.pullFromPostmaster = () => {
    ngDialog.closeAll();
    return queueAction(() => pullFromPostmaster(vm.store, dimItemService, toaster));
  };

  vm.startFarming = function startFarming() {
    ngDialog.closeAll();
    (vm.store.destinyVersion === 2 ? D2FarmingService : dimFarmingService).start({
      membershipId: $stateParams.membershipId,
      platformType: $stateParams.platformType
    }, vm.store.id);
  };
}
