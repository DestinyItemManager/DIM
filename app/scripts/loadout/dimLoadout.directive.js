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
      scope: {
      },
      template: [
        '<div ng-class="vm.classList" ng-show="vm.show">',
        '  <div ng-messages="vm.form.name.$error" ng-if="vm.form.$submitted || vm.form.name.$touched">',
        '    <div ng-message="required">...</div>',
        '    <div ng-message="minlength">...</div>',
        '    <div ng-message="maxlength">...</div>',
        '  </div>',
        '  <div class="loadout-content">',
        '    <div class="content">',
        '      <div id="loadout-options">',
        '        <form name="vm.form">',
        '          <input name="name" ng-model="vm.loadout.name" minlength="1" maxlength="50" required type="search" placeholder="Loadout Name..." />',
        '          <input type="submit" ng-disabled="vm.form.$invalid" value="Save" ng-click="vm.save()"></input>',
        '          <button ng-click="vm.cancel()">Cancel</button>',
        '          <p id="loadout-error"></p>',
        '        </form>',
        '      </div>',
        '      <span id="loadout-contents">',
        '        <span class="loadout-class">',
        '          <div ng-repeat="item in vm.loadout.items[\'Class\']" id="loadout-item-{{:: $id }}" class="item" ng-class="{ \'complete\': item.complete}">',
        '            <img ng-src="http://bungie.net/{{ item.icon }}">',
        '            <div class="counter" ng-if="item.amount > 1">{{ item.amount }}</div>',
        '            <div class="damage-type" ng-if="item.sort === \'Weapons\'" ng-class="\'damage-\' + item.dmg"></div>',
        '          </div>',
        '        </span>',
        '        <span class="loadout-primary">',
        '          <div ng-repeat="item in vm.loadout.items[\'Primary\']" id="loadout-item-{{:: $id }}" class="item" ng-class="{ \'complete\': item.complete}">',
        '            <img ng-src="http://bungie.net/{{ item.icon }}">',
        '            <div class="counter" ng-if="item.amount > 1">{{ item.amount }}</div>',
        '            <div class="damage-type" ng-if="item.sort === \'Weapons\'" ng-class="\'damage-\' + item.dmg"></div>',
        '          </div>',
        '        </span>',
        '        <span class="loadout-special">',
        '          <div ng-repeat="item in vm.loadout.items[\'Special\']" id="loadout-item-{{:: $id }}" class="item" ng-class="{ \'complete\': item.complete}">',
        '            <img ng-src="http://bungie.net/{{ item.icon }}">',
        '            <div class="counter" ng-if="item.amount > 1">{{ item.amount }}</div>',
        '            <div class="damage-type" ng-if="item.sort === \'Weapons\'" ng-class="\'damage-\' + item.dmg"></div>',
        '          </div>',
        '        </span>',
        '        <span class="loadout-heavy">',
        '          <div ng-repeat="item in vm.loadout.items[\'Heavy\']" id="loadout-item-{{:: $id }}" class="item" ng-class="{ \'complete\': item.complete}">',
        '            <img ng-src="http://bungie.net/{{ item.icon }}">',
        '            <div class="counter" ng-if="item.amount > 1">{{ item.amount }}</div>',
        '            <div class="damage-type" ng-if="item.sort === \'Weapons\'" ng-class="\'damage-\' + item.dmg"></div>',
        '          </div>',
        '        </span>',
        '        <span class="loadout-helmet">',
        '          <div ng-repeat="item in vm.loadout.items[\'Helmet\']" id="loadout-item-{{:: $id }}" class="item" ng-class="{ \'complete\': item.complete}">',
        '            <img ng-src="http://bungie.net/{{ item.icon }}">',
        '            <div class="counter" ng-if="item.amount > 1">{{ item.amount }}</div>',
        '            <div class="damage-type" ng-if="item.sort === \'Weapons\'" ng-class="\'damage-\' + item.dmg"></div>',
        '          </div>',
        '        </span>',
        '        <span class="loadout-gauntlets">',
        '          <div ng-repeat="item in vm.loadout.items[\'Gauntlets\']" id="loadout-item-{{:: $id }}" class="item" ng-class="{ \'complete\': item.complete}">',
        '            <img ng-src="http://bungie.net/{{ item.icon }}">',
        '            <div class="counter" ng-if="item.amount > 1">{{ item.amount }}</div>',
        '            <div class="damage-type" ng-if="item.sort === \'Weapons\'" ng-class="\'damage-\' + item.dmg"></div>',
        '          </div>',
        '        </span>',
        '        <span class="loadout-chest">',
        '          <div ng-repeat="item in vm.loadout.items[\'Chest\']" id="loadout-item-{{:: $id }}" class="item" ng-class="{ \'complete\': item.complete}">',
        '            <img ng-src="http://bungie.net/{{ item.icon }}">',
        '            <div class="counter" ng-if="item.amount > 1">{{ item.amount }}</div>',
        '            <div class="damage-type" ng-if="item.sort === \'Weapons\'" ng-class="\'damage-\' + item.dmg"></div>',
        '          </div>',
        '        </span>',
        '        <span class="loadout-leg">',
        '          <div ng-repeat="item in vm.loadout.items[\'Leg\']" id="loadout-item-{{:: $id }}" class="item" ng-class="{ \'complete\': item.complete}">',
        '            <img ng-src="http://bungie.net/{{ item.icon }}">',
        '            <div class="counter" ng-if="item.amount > 1">{{ item.amount }}</div>',
        '            <div class="damage-type" ng-if="item.sort === \'Weapons\'" ng-class="\'damage-\' + item.dmg"></div>',
        '          </div>',
        '        </span>',
        '        <span class="loadout-classItem">',
        '          <div ng-repeat="item in vm.loadout.items[\'ClassItem\']" id="loadout-item-{{:: $id }}" class="item" ng-class="{ \'complete\': item.complete}">',
        '            <img ng-src="http://bungie.net/{{ item.icon }}">',
        '            <div class="counter" ng-if="item.amount > 1">{{ item.amount }}</div>',
        '            <div class="damage-type" ng-if="item.sort === \'Weapons\'" ng-class="\'damage-\' + item.dmg"></div>',
        '          </div>',
        '        </span>',
        '        <span class="loadout-emblem">',
        '          <div ng-repeat="item in vm.loadout.items[\'Emblem\']" id="loadout-item-{{:: $id }}" class="item" ng-class="{ \'complete\': item.complete}">',
        '            <img ng-src="http://bungie.net/{{ item.icon }}">',
        '            <div class="counter" ng-if="item.amount > 1">{{ item.amount }}</div>',
        '            <div class="damage-type" ng-if="item.sort === \'Weapons\'" ng-class="\'damage-\' + item.dmg"></div>',
        '          </div>',
        '        </span>',
        '        <span class="loadout-armor">',
        '          <div ng-repeat="item in vm.loadout.items[\'Armor\']" id="loadout-item-{{:: $id }}" class="item" ng-class="{ \'complete\': item.complete}">',
        '            <img ng-src="http://bungie.net/{{ item.icon }}">',
        '            <div class="counter" ng-if="item.amount > 1">{{ item.amount }}</div>',
        '            <div class="damage-type" ng-if="item.sort === \'Weapons\'" ng-class="\'damage-\' + item.dmg"></div>',
        '          </div>',
        '        </span>',
        '        <span class="loadout-ghost">',
        '          <div ng-repeat="item in vm.loadout.items[\'Ghost\']" id="loadout-item-{{:: $id }}" class="item" ng-class="{ \'complete\': item.complete}">',
        '            <img ng-src="http://bungie.net/{{ item.icon }}">',
        '            <div class="counter" ng-if="item.amount > 1">{{ item.amount }}</div>',
        '            <div class="damage-type" ng-if="item.sort === \'Weapons\'" ng-class="\'damage-\' + item.dmg"></div>',
        '          </div>',
        '        </span>',
        '        <span class="loadout-ship">',
        '          <div ng-repeat="item in vm.loadout.items[\'Ship\']" id="loadout-item-{{:: $id }}" class="item" ng-class="{ \'complete\': item.complete}">',
        '            <img ng-src="http://bungie.net/{{ item.icon }}">',
        '            <div class="counter" ng-if="item.amount > 1">{{ item.amount }}</div>',
        '            <div class="damage-type" ng-if="item.sort === \'Weapons\'" ng-class="\'damage-\' + item.dmg"></div>',
        '          </div>',
        '        </span>',
        '        <span class="loadout-vehicle">',
        '          <div ng-repeat="item in vm.loadout.items[\'Vehicle\']" id="loadout-item-{{:: $id }}" class="item" ng-class="{ \'complete\': item.complete}">',
        '            <img ng-src="http://bungie.net/{{ item.icon }}">',
        '            <div class="counter" ng-if="item.amount > 1">{{ item.amount }}</div>',
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

      vm.classList = {
        'loadout-create': true
      };

      scope.$on('dim-create-new-loadout', function(event, args) {
        vm.show = true;
        dimLoadoutService.dialogOpen = true;

        vm.loadout = {
          items: {}
        };
      });

      scope.$on('dim-delete-loadout', function(event, args) {
        vm.show = false;
        dimLoadoutService.dialogOpen = false;
        vm.loadout = {
          items: {}
        };
      });

      scope.$on('dim-edit-loadout', function(event, args) {
        if (args.loadout) {
          vm.show = true;
          dimLoadoutService.dialogOpen = true;
          vm.loadout = args.loadout;
        }
      });

      scope.$on('dim-store-item-clicked', function(event, args) {
        if (_.isUndefined(vm.loadout.items[args.item.type])) {
          vm.loadout.items[args.item.type] = [];
        }

        if (_.isUndefined(_.find(vm.loadout.items[args.item.type], function(i) {
          return (i.id === args.item.id);
        }))) {
          vm.loadout.items[args.item.type] = [args.item];
        }
      });
    }
  }

  LoadoutCtrl.$inject = ['dimLoadoutService'];

  function LoadoutCtrl(dimLoadoutService) {
    var vm = this;

    vm.show = false;
    dimLoadoutService.dialogOpen = false;
    vm.loadout = {
      items: {}
    };

    vm.save = function save() {
      if (_.has(vm.loadout, 'id')) {
        dimLoadoutService.saveLoadouts();
      } else {
        dimLoadoutService.saveLoadout(vm.loadout);
      }

      vm.loadout = {};
      vm.show = false;
      dimLoadoutService.dialogOpen = false;
    };

    vm.cancel = function cancel() {
      vm.show = false;
      dimLoadoutService.dialogOpen = false;
      vm.loadout = {};
    }
  }
})();
