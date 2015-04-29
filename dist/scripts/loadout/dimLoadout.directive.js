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
      restrict: 'A',
      scope: {},
      template: [
        '<div ng-class="vm.classList" ng-show="vm.show">',
        '  <div ng-messages="vm.form.name.$error" ng-if="vm.form.$submitted || vm.form.name.$touched">',
        '    <div ng-message="required">A name is required.</div>',
        '    <div ng-message="minlength">...</div>',
        '    <div ng-message="maxlength">...</div>',
        '  </div>',
        '  <div class="loadout-content">',
        '    <div class="content">',
        '      <div id="loadout-options">',
        '        <form name="vm.form">',
        '          <input name="name" ng-model="vm.loadout.name" minlength="1" maxlength="50" required type="search" placeholder="Loadout Name..." />',
        '          <select name="classType" ng-model="vm.loadout.classType" ng-options="item.value as item.label for item in vm.classTypeValues"></select>',
        '          <input type="button" ng-disabled="vm.form.$invalid" value="Save" ng-click="vm.save()"></input>',
        '          <input type="button" ng-click="vm.cancel()" value="Cancel"></input>',
        '          <p id="loadout-error"></p>',
        '        </form>',
        '      </div>',
        '      <span id="loadout-contents">',
        '        <span ng-repeat="value in vm.types" class="loadout-{{ value }}">',
        '          <div ng-repeat="item in vm.loadout.items[value]" ng-click="vm.equip(item)" id="loadout-item-{{:: $id }}" class="item" ng-class="{ \'complete\': item.complete}">',
        '            <img ng-src="{{ item.icon }}">',
        '            <div class="counter" ng-if="item.amount > 1">{{ item.amount }}</div>',
        '            <div class="close" ng-click="vm.remove(item); vm.form.name.$rollbackViewValue(); $event.stopPropagation();"></div>',
        '            <div class="equipped" ng-show="item.equipped"></div>',
        '            <div class="damage-type" ng-if="item.sort === \'Weapons\'" ng-class="\'damage-\' + item.dmg"></div>',
        '          </div>',
        '        </span>',
        '      </span>',
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

      vm.classList = {
        'loadout-create': true
      };

      scope.$on('dim-create-new-loadout', function(event, args) {
        vm.show = true;
        dimLoadoutService.dialogOpen = true;

        vm.loadout = _.clone(vm.defaults);
      });

      scope.$on('dim-delete-loadout', function(event, args) {
        vm.show = false;
        dimLoadoutService.dialogOpen = false;
        vm.loadout = _.clone(vm.defaults);
      });

      scope.$on('dim-edit-loadout', function(event, args) {
        if (args.loadout) {
          vm.show = true;
          dimLoadoutService.dialogOpen = true;
          vm.loadout = args.loadout;
        }
      });

      scope.$on('dim-store-item-clicked', function(event, args) {
        vm.add(args.item);
      });
    }
  }

  LoadoutCtrl.$inject = ['dimLoadoutService', 'dimCategory', 'dimItemTier'];

  function LoadoutCtrl(dimLoadoutService, dimCategory, dimItemTier) {
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
      if (_.has(vm.loadout, 'id')) {
        dimLoadoutService.saveLoadouts();
      } else {
        dimLoadoutService.saveLoadout(vm.loadout);
      }

      vm.loadout = angular.copy(vm.defaults);
      vm.show = false;
      dimLoadoutService.dialogOpen = false;
    };

    vm.cancel = function cancel() {
      vm.loadout = angular.copy(vm.defaults);
      dimLoadoutService.dialogOpen = false;
      vm.show = false;
    };

    vm.add = function add(item) {
      var clone = _.clone(item);

      var discriminator = clone.type.toLowerCase();
      var typeInventory = vm.loadout.items[discriminator] = (vm.loadout.items[discriminator] || []);

      var dupe = _.find(typeInventory, function(i) {
        return (i.id === clone.id);
      });

      if (_.isUndefined(dupe) && (_.size(typeInventory) < 9)) {
        clone.equipped = false;

        if (clone.type === 'Class') {
          if (_.has(vm.loadout.items, 'class')) {
            vm.loadout.items.class.splice(0, vm.loadout.items.class.length);
            clone.equipped = true;
          }
        }

        typeInventory.push(clone);
      }
    };

    vm.remove = function remove(item) {
      var discriminator = item.type.toLowerCase();
      var typeInventory = vm.loadout.items[discriminator] = (vm.loadout.items[discriminator] || []);

      var index = _.findIndex(typeInventory, function(i) {
        return i.id === item.id;
      });

      if (index >= 0) {
        typeInventory.splice(index, 1);
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
                sort: item.sort,
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
  }
})();
