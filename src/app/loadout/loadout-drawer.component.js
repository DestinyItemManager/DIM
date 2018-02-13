import angular from 'angular';
import _ from 'underscore';
import template from './loadout-drawer.html';
import './loadout-drawer.scss';
import { getCharacterStatsData } from '../inventory/store/character-utils';
import { D2Categories } from '../destiny2/d2-buckets.service';
import { flatMap } from '../util';

export const LoadoutDrawerComponent = {
  controller: LoadoutDrawerCtrl,
  controllerAs: 'vm',
  bindings: {
    account: '<',
    stores: '<'
  },
  template
};

function LoadoutDrawerCtrl($scope, dimLoadoutService, dimCategory, toaster, dimSettingsService, $i18next, dimDefinitions) {
  'ngInject';
  const vm = this;

  const dimItemCategories = dimSettingsService.destinyVersion === 2 ? D2Categories : dimCategory;

  this.$onChanges = function(changes) {
    if (changes.stores) {
      const stores = vm.stores || [];
      vm.classTypeValues = [{ label: $i18next.t('Loadouts.Any'), value: -1 }];

      /*
      Bug here was localization tried to change the label order, but users have saved their loadouts with data that was in the original order.
      These changes broke loadouts.  Next time, you have to map values between new and old values to preserve backwards compatability.
      */

      _.each(_.uniq(_.reject(stores, 'isVault'), false, (store) => store.classType), (store) => {
        let classType = 0;

        switch (parseInt(store.classType, 10)) {
        case 0: {
          classType = 1;
          break;
        }
        case 1: {
          classType = 2;
          break;
        }
        case 2: {
          classType = 0;
          break;
        }
        }

        vm.classTypeValues.push({ label: store.className, value: classType });
      });
    }

    if (changes.account) {
      vm.show = false;
    }
  };

  $scope.$on('dim-delete-loadout', () => {
    vm.show = false;
    dimLoadoutService.dialogOpen = false;
    vm.loadout = angular.copy(vm.defaults);
  });

  $scope.$on('dim-edit-loadout', (event, args) => {
    vm.showClass = args.showClass;
    if (args.loadout) {
      vm.loadout = angular.copy(args.loadout);
      vm.show = true;
      dimLoadoutService.dialogOpen = true;
      if (vm.loadout.classType === undefined) {
        vm.loadout.classType = -1;
      }
      vm.loadout.items = vm.loadout.items || {};

      // Filter out any vendor items and equip all if requested
      vm.loadout.warnitems = flatMap(vm.loadout.items, (o, items) => _.filter(items, (item) => !item.owner));

      _.each(vm.loadout.items, (items, type) => {
        vm.loadout.items[type] = _.filter(items, (item) => item.owner);
        if (args.equipAll && vm.loadout.items[type][0]) {
          vm.loadout.items[type][0].equipped = true;
        }
      });
    }
  });

  $scope.$on('dim-store-item-clicked', (event, args) => {
    vm.add(args.item, args.clickEvent);
  });

  $scope.$watchCollection('vm.loadout.items', () => {
    vm.recalculateStats();
  });

  vm.settings = dimSettingsService;

  vm.types = _.flatten(Object.values(dimItemCategories)).map((t) => t.toLowerCase());

  vm.show = false;
  dimLoadoutService.dialogOpen = false;
  vm.defaults = {
    classType: -1,
    items: {}
  };
  vm.loadout = angular.copy(vm.defaults);

  vm.save = function save($event) {
    $event.preventDefault();
    vm.loadout.platform = vm.account.platformLabel; // Playstation or Xbox
    vm.loadout.destinyVersion = dimSettingsService.destinyVersion; // D1 or D2
    dimLoadoutService
      .saveLoadout(vm.loadout)
      .catch((e) => {
        toaster.pop('error',
                    $i18next.t('Loadouts.SaveErrorTitle'),
                    $i18next.t('Loadouts.SaveErrorDescription', { loadoutName: vm.loadout.name, error: e.message }));
        console.error(e);
      });
    vm.cancel($event);
  };

  vm.saveAsNew = function saveAsNew($event) {
    $event.preventDefault();
    delete vm.loadout.id; // Let it be a new ID
    vm.save($event);
  };

  vm.cancel = function cancel($event) {
    $event.preventDefault();
    vm.loadout = angular.copy(vm.defaults);
    dimLoadoutService.dialogOpen = false;
    vm.show = false;
  };

  vm.add = function add(item, $event) {
    if (item.canBeInLoadout()) {
      const clone = angular.copy(item);

      const discriminator = clone.type.toLowerCase();
      const typeInventory = vm.loadout.items[discriminator] = (vm.loadout.items[discriminator] || []);

      clone.amount = Math.min(clone.amount, $event.shiftKey ? 5 : 1);

      const dupe = _.find(typeInventory, { hash: clone.hash, id: clone.id });

      let maxSlots = 10;
      if (item.type === 'Material') {
        maxSlots = 20;
      } else if (item.type === 'Consumable') {
        maxSlots = 19;
      }

      if (!dupe) {
        if (typeInventory.length < maxSlots) {
          clone.equipped = item.equipment && (typeInventory.length === 0);

          // Only allow one subclass per burn
          if (clone.type === 'Class') {
            const other = vm.loadout.items.class;
            if (other && other.length && other[0].dmg !== clone.dmg) {
              vm.loadout.items.class.splice(0, vm.loadout.items.class.length);
            }
            clone.equipped = true;
          }

          typeInventory.push(clone);
        } else {
          toaster.pop('warning', '', $i18next.t('Loadouts.MaxSlots', { slots: maxSlots }));
        }
      } else if (dupe && clone.maxStackSize > 1) {
        const increment = Math.min(dupe.amount + clone.amount, dupe.maxStackSize) - dupe.amount;
        dupe.amount += increment;
        // TODO: handle stack splits
      }
    } else {
      toaster.pop('warning', '', $i18next.t('Loadouts.OnlyItems'));
    }

    vm.recalculateStats();
  };

  vm.remove = function remove(item, $event) {
    const discriminator = item.type.toLowerCase();
    const typeInventory = vm.loadout.items[discriminator] = (vm.loadout.items[discriminator] || []);

    const index = _.findIndex(typeInventory, (i) => {
      return i.hash === item.hash && i.id === item.id;
    });

    if (index >= 0) {
      const decrement = $event.shiftKey ? 5 : 1;
      item.amount -= decrement;
      if (item.amount <= 0) {
        typeInventory.splice(index, 1);
      }
    }

    if (item.equipped && typeInventory.length > 0) {
      typeInventory[0].equipped = true;
    }

    vm.recalculateStats();
  };

  vm.equip = function equip(item) {
    if (item.equipment) {
      if ((item.type === 'Class') && (!item.equipped)) {
        item.equipped = true;
      } else if (item.equipped) {
        item.equipped = false;
      } else {
        const allItems = _.flatten(Object.values(vm.loadout.items));
        if (item.isExotic) {
          const exotic = _.find(allItems, {
            sort: item.bucket.sort,
            isExotic: true,
            equipped: true
          });

          if (!_.isUndefined(exotic)) {
            exotic.equipped = false;
          }
        }

        _.filter(allItems, {
          type: item.type,
          equipped: true
        }).forEach((i) => {
          i.equipped = false;
        });

        item.equipped = true;
      }
    }

    vm.recalculateStats(vm.loadout.items);
  };

  vm.recalculateStats = function() {
    if (vm.settings.destinyVersion !== 1 || !vm.loadout || !vm.loadout.items) {
      vm.stats = null;
      return;
    }

    const items = vm.loadout.items;
    const interestingStats = new Set(['STAT_INTELLECT', 'STAT_DISCIPLINE', 'STAT_STRENGTH']);

    let numInterestingStats = 0;
    const allItems = _.flatten(Object.values(items));
    const equipped = _.filter(allItems, 'equipped');
    const stats = _.flatten(_.map(equipped, 'stats'));
    const filteredStats = _.filter(stats, (stat) => stat && interestingStats.has(stat.id));
    const combinedStats = _.reduce(filteredStats, (stats, stat) => {
      numInterestingStats++;
      if (stats[stat.id]) {
        stats[stat.id].value += stat.value;
      } else {
        stats[stat.id] = {
          statHash: stat.statHash,
          value: stat.value
        };
      }
      return stats;
    }, {});

    // Seven types of things that contribute to these stats, times 3 stats, equals
    // a complete set of armor, ghost and artifact.
    vm.hasArmor = numInterestingStats > 0;
    vm.completeArmor = numInterestingStats === (7 * 3);

    if (_.isEmpty(combinedStats)) {
      vm.stats = null;
      return;
    }

    dimDefinitions.getDefinitions().then((defs) => {
      vm.stats = getCharacterStatsData(defs.Stat, { stats: combinedStats });
    });
  };
}
