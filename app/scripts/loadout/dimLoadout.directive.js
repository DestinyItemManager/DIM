(function() {
  'use strict';

  angular.module('dimApp').directive('dimLoadout', Loadout);

  Loadout.$inject = ['dimLoadoutService'];

  function Loadout(dimLoadoutService) {
    return {
      controller: LoadoutCtrl,
      controllerAs: 'vm',
      bindToController: true,
      link: Link,
      scope: {},
      template: [
        '<div id="loadout-drawer" ng-if="vm.show" class="loadout-create">',
        '  <div ng-messages="vm.form.name.$error" ng-if="vm.form.$submitted || vm.form.name.$touched">',
        '    <div ng-message="required">A name is required.</div>',
        '    <div ng-message="minlength">...</div>',
        '    <div ng-message="maxlength">...</div>',
        '  </div>',
        '  <div class="loadout-content">',
        '    <div id="loadout-options">',
        '      <form name="vm.form">',
        '        <input name="name" ng-model="vm.loadout.name" minlength="1" maxlength="50" required type="search" placeholder="Loadout Name..." />',
        '        <select name="classType" ng-model="vm.loadout.classType" ng-options="item.value as item.label for item in vm.classTypeValues"></select>',
        '        <input type="button" ng-disabled="vm.form.$invalid" value="Save" ng-click="vm.save()"></input>',
        '        <input type="button" ng-disabled="vm.form.$invalid || !vm.loadout.id" value="Save as New" ng-click="vm.saveAsNew()"></input>',
        '        <input type="button" ng-click="vm.cancel()" value="Cancel"></input>',
        '        <span>Items with the <img src="images/spartan.png" style="border: 1px solid #333; background-color: #f00; margin: 0 2px; width: 16px; height: 16px;  vertical-align: text-bottom;"> icon will be equipped.  Click on an item toggle equip.</span>',
        '        <p id="loadout-error"></p>',
        '      </form>',
        '    </div>',
        '    <div id="loadout-contents">',
        '      <div ng-repeat="value in vm.types track by value" class="loadout-{{ value }} loadout-bucket" ng-if="vm.loadout.items[value].length">',
        '        <div ng-repeat="item in vm.loadout.items[value] | sortItems:vm.itemSort track by item.index" ng-click="vm.equip(item)" id="loadout-item-{{:: $id }}" class="loadout-item">',
        '          <dim-simple-item item-data="item"></dim-simple-item>',
        '          <div class="close" ng-click="vm.remove(item, $event); vm.form.name.$rollbackViewValue(); $event.stopPropagation();"></div>',
        '          <div class="equipped" ng-show="item.equipped"></div>',
        '        </div>',
        '      </div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    };

    function Link(scope, element, attrs) {
      var vm = scope.vm;

      vm.classTypeValues = [{
        label: 'Any',
        value: -1
      }, {
        label: 'Warlock',
        value: 0
      }, {
        label: 'Titan',
        value: 1
      }, {
        label: 'Hunter',
        value: 2
      }];

      scope.$on('dim-create-new-loadout', function(event, args) {
        vm.show = true;
        dimLoadoutService.dialogOpen = true;
      });

      scope.$on('dim-delete-loadout', function(event, args) {
        vm.show = false;
        dimLoadoutService.dialogOpen = false;
        vm.loadout = angular.copy(vm.defaults);
      });

      scope.$on('dim-edit-loadout', function(event, args) {
        if (args.loadout) {
          vm.show = true;
          dimLoadoutService.dialogOpen = true;
          vm.loadout = angular.copy(args.loadout);
          if (args.equipAll) {
            _.each(vm.loadout.items, function(item) {
              if(item[0]) {
                item[0].equipped = true;
              }
            });
          }
        }
      });

      scope.$on('dim-store-item-clicked', function(event, args) {
        vm.add(args.item, args.clickEvent);
      });
    }
  }

  LoadoutCtrl.$inject = ['dimLoadoutService', 'dimCategory', 'dimItemTier', 'toaster', 'dimPlatformService', 'dimSettingsService', '$scope'];

  function LoadoutCtrl(dimLoadoutService, dimCategory, dimItemTier, toaster, dimPlatformService, dimSettingsService, $scope) {
    var vm = this;

    vm.types = _.chain(dimCategory)
      .values()
      .flatten()
      .map(function(t) {
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
      var platform = dimPlatformService.getActive();
      vm.loadout.platform = platform.label; // Playstation or Xbox
      dimLoadoutService.saveLoadout(vm.loadout);
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
        var clone = angular.copy(item);

        var discriminator = clone.type.toLowerCase();
        var typeInventory = vm.loadout.items[discriminator] = (vm.loadout.items[discriminator] || []);

        clone.amount = Math.min(clone.amount, $event.shiftKey ? 5 : 1);

        var dupe = _.findWhere(typeInventory, {hash: clone.hash, id: clone.id});

        var maxSlots = 10;
        if (item.type === 'Material') {
          maxSlots = 20;
        } else if(item.type === 'Consumable') {
          maxSlots = 19;
        }

        if (!dupe) {
          if (typeInventory.length < maxSlots) {
            clone.equipped = item.equipment && (typeInventory.length === 0);

            // Only allow one subclass
            if (clone.type === 'Class') {
              if (_.has(vm.loadout.items, 'class')) {
                vm.loadout.items.class.splice(0, vm.loadout.items.class.length);
                clone.equipped = true;
              }
            }

            typeInventory.push(clone);
          } else {
            toaster.pop('warning', '', 'You can only have ' + maxSlots + ' of that kind of item in a loadout.');
          }
        } else if (dupe && clone.maxStackSize > 1) {
          var increment = Math.min(dupe.amount + clone.amount, dupe.maxStackSize) - dupe.amount;
          dupe.amount += increment;
          // TODO: handle stack splits
        }
      } else {
        toaster.pop('warning', '', 'Only equippable items, materials, and consumables can be added to a loadout.');
      }
    };

    vm.remove = function remove(item, $event) {
      var discriminator = item.type.toLowerCase();
      var typeInventory = vm.loadout.items[discriminator] = (vm.loadout.items[discriminator] || []);

      var index = _.findIndex(typeInventory, function(i) {
        return i.hash == item.hash && i.id === item.id;
      });

      if (index >= 0) {
        var decrement = $event.shiftKey ? 5 : 1;
        item.amount -= decrement;
        if (item.amount <= 0) {
          typeInventory.splice(index, 1);
        }
      }

      if (item.equipped && typeInventory.length > 0) {
        typeInventory[0].equipped = true;
      }
    };

    vm.equip = function equip(item) {
      if (item.equipment) {
        var equipped = vm.loadout.equipped;

        if ((item.type === 'Class') && (!item.equipped)) {
          item.equipped = true;
        } else if (item.equipped) {
          item.equipped = false;
        } else {
          if (item.tier === dimItemTier.exotic) {
            var exotic = _.chain(vm.loadout.items)
              .values()
              .flatten()
              .findWhere({
                sort: item.bucket.sort,
                tier: dimItemTier.exotic,
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
            .each(function(i) {
              i.equipped = false;
            });

          item.equipped = true;
        }
      }
    };

    dimSettingsService.getSetting('itemSort').then(function(sort) {
      vm.itemSort = sort;
    });

    $scope.$on('dim-settings-updated', function(event, settings) {
      if (_.has(settings, 'itemSort')) {
        vm.itemSort = settings.itemSort;
      }
    });
  }
})();
