(function() {
  'use strict';

  angular.module('dimApp').directive('dimLoadout', Loadout);

  Loadout.$inject = [];

  function Loadout() {
    return {
      controller: LoadoutCtrl,
      controllerAs: 'vm',
      bindToController: true,
      link: Link,
      restrict: 'A',
      scope: {
      },
      template: [
        '<div ng-class="vm.classList" ng-show="vm.show"><div class="loadout-content">',
        '  <div class="content">',
        '    <div id="loadout-options">',
        '      <input id="loadout-name" ng-model="vm.loadout.name" type="search" placeholder="Loadout Name..." />',
        '      <a id="loadout-save" ng-click="vm.save()" href="">Save</a>',
        '      <a id="loadout-cancel" ng-click="vm.cancel()" href="">Cancel</a>',
        '      <p id="loadout-error"></p>',
        '    </div>',
        '    <span id="loadout-contents">',
        '      <span class="loadout-class"></span>',
        '      <span class="loadout-emblem"></span>',
        '      <span class="loadout-primary"</span>',
        '      <span class="loadout-special"></span>',
        '      <span class="loadout-heavy"></span>',
        '      <span class="loadout-helmet"></span>',
        '      <span class="loadout-gauntlets"></span>',
        '      <span class="loadout-chest"></span>',
        '      <span class="loadout-leg"></span>',
        '      <span class="loadout-armor"></span>',
        '      <span class="loadout-vehicle"></span>',
        '      <span class="loadout-ship"></span>',
        '      <span class="loadout-ghost"></span>',
        '      <span class="loadout-titan"></span>',
        '      <span class="loadout-hunter"></span>',
        '      <span class="loadout-warlock"></span>',
        '    </span>',
        '  </div>',
        '</div></div>'
      ].join('')
    };

    function Link(scope, element, attrs) {
      var vm = scope.vm;

      vm.classList = {
        'loadout-create': true
      };

      scope.$on('dim-create-new-loadout', function(event, args) {
        vm.show = true;
        vm.loadout = {};
      });

      scope.$on('dim-delete-loadout', function(event, args) {
        vm.show = false;
        vm.loadout = {};
      });

      scope.$on('dim-edit-loadout', function(event, args) {
        if (args.loadout) {
          vm.show = true;
          vm.loadout = args.loadout;
        }
      });
    }
  }

  LoadoutCtrl.$inject = ['dimLoadoutService'];

  function LoadoutCtrl(dimLoadoutService) {
    var vm = this;

    vm.show = false;
    vm.loadout = {};

    vm.save = function save() {
      if (_.has(vm.loadout, 'id')) {
        dimLoadoutService.saveLoadouts();
      } else {
        dimLoadoutService.saveLoadout(vm.loadout);
      }
      
      vm.loadout = {};
      vm.show = false;
    };

    vm.cancel = function cancel() {
      vm.show = false;
      vm.loadout = {};
    }
  }
})();
