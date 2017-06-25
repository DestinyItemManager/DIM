import angular from 'angular';
import _ from 'underscore';
import template from './dimLoadout.directive.html';

angular.module('dimApp').directive('dimLoadout', Loadout);


function Loadout(dimLoadoutService, $i18next) {
  return {
    controller: LoadoutCtrl,
    controllerAs: 'vm',
    bindToController: true,
    link: Link,
    scope: {},
    template: template
  };

  function Link(scope) {
    const vm = scope.vm;

    scope.$on('dim-stores-updated', (evt, data) => {
      vm.classTypeValues = [{ label: $i18next.t('Loadouts.Any'), value: -1 }];

      /*
      Bug here was localization tried to change the label order, but users have saved their loadouts with data that was in the original order.
      These changes broke loadouts.  Next time, you have to map values between new and old values to preserve backwards compatability.
      */

      _.each(_.uniq(_.reject(data.stores, 'isVault'), false, (store) => { return store.classType; }), (store) => {
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
    });

    scope.$on('dim-create-new-loadout', () => {
      vm.show = true;
      dimLoadoutService.dialogOpen = true;
      vm.loadout = angular.copy(vm.defaults);
    });

    scope.$on('dim-delete-loadout', () => {
      vm.show = false;
      dimLoadoutService.dialogOpen = false;
      vm.loadout = angular.copy(vm.defaults);
    });

    scope.$watchCollection('vm.originalLoadout.items', () => {
      vm.loadout = angular.copy(vm.originalLoadout);
    });

    scope.$on('dim-edit-loadout', (event, args) => {
      vm.showClass = args.showClass;
      if (args.loadout) {
        vm.show = true;
        dimLoadoutService.dialogOpen = true;
        vm.originalLoadout = args.loadout;

        // Filter out any vendor items and equip all if requested
        args.loadout.warnitems = _.reduce(args.loadout.items, (o, items) => {
          const vendorItems = _.filter(items, (item) => { return !item.owner; });
          o = o.concat(...vendorItems);
          return o;
        }, []);

        _.each(args.loadout.items, (items, type) => {
          args.loadout.items[type] = _.filter(items, (item) => { return item.owner; });
          if (args.equipAll && args.loadout.items[type][0]) {
            args.loadout.items[type][0].equipped = true;
          }
        });
        vm.loadout = angular.copy(args.loadout);
      }
    });

    scope.$on('dim-store-item-clicked', (event, args) => {
      vm.add(args.item, args.clickEvent);
    });

    scope.$on('dim-active-platform-updated', () => {
      vm.show = false;
    });

    scope.$watchCollection('vm.loadout.items', () => {
      vm.recalculateStats();
    });
  }
}


function LoadoutCtrl(dimLoadoutService, dimCategory, toaster, dimPlatformService, dimSettingsService, $i18next, dimStoreService, dimDefinitions) {
  const vm = this;

  vm.settings = dimSettingsService;

  vm.types = _.chain(dimCategory)
    .values()
    .flatten()
    .map((t) => {
      return t.toLowerCase();
    })
    .value();

  vm.show = false;
  dimLoadoutService.dialogOpen = false;
  vm.defaults = {
    classType: -1,
    items: {}
  };
  vm.loadout = angular.copy(vm.defaults);

  vm.save = function save() {
    const platform = dimPlatformService.getActive();
    vm.loadout.platform = platform.label; // Playstation or Xbox
    dimLoadoutService
      .saveLoadout(vm.loadout)
      .catch((e) => {
        toaster.pop('error',
                    $i18next.t('Loadouts.SaveErrorTitle'),
                    $i18next.t('Loadouts.SaveErrorDescription', { loadoutName: vm.loadout.name, error: e.message }));
        console.error(e);
      });
    vm.cancel();
  };

  vm.saveAsNew = function saveAsNew() {
    delete vm.loadout.id; // Let it be a new ID
    vm.save();
  };

  vm.cancel = function cancel() {
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

      const dupe = _.findWhere(typeInventory, { hash: clone.hash, id: clone.id });

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
        if (item.isExotic) {
          const exotic = _.chain(vm.loadout.items)
            .values()
            .flatten()
            .findWhere({
              sort: item.bucket.sort,
              isExotic: true,
              equipped: true
            })
            .value();

          if (!_.isUndefined(exotic)) {
            exotic.equipped = false;
          }
        }

        _.chain(vm.loadout.items)
          .values()
          .flatten()
          .where({
            type: item.type,
            equipped: true
          })
          .each((i) => {
            i.equipped = false;
          });

        item.equipped = true;
      }
    }

    vm.recalculateStats(vm.loadout.items);
  };

  vm.recalculateStats = function() {
    if (!vm.loadout || !vm.loadout.items) {
      vm.stats = null;
      return;
    }

    const items = vm.loadout.items;
    const interestingStats = new Set(['STAT_INTELLECT', 'STAT_DISCIPLINE', 'STAT_STRENGTH']);

    let numInterestingStats = 0;
    const combinedStats = _.chain(items)
      .values()
      .flatten()
      .filter('equipped')
      .map('stats')
      .flatten()
      .filter()
      .filter((stat) => interestingStats.has(stat.id))
      .reduce((stats, stat) => {
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
      }, {})
      .value();

    // Seven types of things that contribute to these stats, times 3 stats, equals
    // a complete set of armor, ghost and artifact.
    vm.hasArmor = numInterestingStats > 0;
    vm.completeArmor = numInterestingStats === (7 * 3);

    if (_.isEmpty(combinedStats)) {
      vm.stats = null;
      return;
    }

    dimDefinitions.getDefinitions().then((defs) => {
      vm.stats = dimStoreService.getCharacterStatsData(defs.Stat, { stats: combinedStats });
    });
  };
}
