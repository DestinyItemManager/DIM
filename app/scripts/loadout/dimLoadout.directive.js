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
        '<div class="loadout-content">',
        '  <div class="content">',
        '    <div id="loadout-options">',
        '      <input id="loadout-name" ng-model="vm.name" type="search" placeholder="Loadout Name..." />',
        '      <span id="loadout-save" ng-click="vm.save($event)">Save</span>',
        '      <span id="loadout-cancel">Cancel</span>',
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
        '</div>'
      ].join('')
    };

    function Link(scope, element, attrs) {
      element.addClass('loadout-create');

      scope.$on('dim-create-new-loadout', function(event, args) {
        element.css('display', 'block');

        if (args.loadout) {
          scope.vm.loadLoadout(args.loadout);
        }
      });

      scope.$on('dim-create-delete-loadout', function(event, args) {
      });

      scope.$on('dim-create-edit-loadout', function(event, args) {
        element.css('display', 'block');

        if (args.loadout) {
          scope.vm.loadLoadout(args.loadout);
        }
      });
    }
  }

  LoadoutCtrl.$inject = ['dimLoadoutService'];

  function LoadoutCtrl(dimLoadoutService) {
    var vm = this;

    vm.name = '';

    vm.save = function save($event) {
      var loadout = {
        name: vm.name
      };

      dimLoadoutService.saveLoadout(loadout);
    };

    vm.loadLoadout = function loadLoadout(loadout) {
      vm.name = loadout.name;
    }
  }
})();
