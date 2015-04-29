(function() {
  'use strict';
  angular.module('dimApp')
    .directive('dimLoadoutPopup', LoadoutPopup);

  LoadoutPopup.$inject = [];

  function LoadoutPopup() {
    return {
      controller: LoadoutPopupCtrl,
      controllerAs: 'vm',
      bindToController: true,
      restrict: 'A',
      scope: {
        classType: '=dimClass',
        store: '=dimLoadoutPopup'
      },
      replace: true,
      template: [
        '<div class="loadout-popup-content">',
        '  <div class="loadout-set" ng-click="vm.newLoadout($event)">+ Create Loadout</div>',
        '  <div class="loadout-list">',
        '    <div ng-repeat="loadout in vm.loadouts track by loadout.id" class="loadout-set">',
        '      <span class="button-name" ng-click="vm.applyLoadout(loadout, $event)">{{ loadout.name }}</span>',
        '      <span class="button-delete" ng-click="vm.deleteLoadout(loadout, $event)">Delete</span>',
        '      <span class="button-edit" ng-click="vm.editLoadout(loadout, $event)">Edit</span>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    };
  }

  LoadoutPopupCtrl.$inject = ['$rootScope', 'ngDialog', 'dimLoadoutService', 'dimItemService', 'toaster'];

  function LoadoutPopupCtrl($rootScope, ngDialog, dimLoadoutService, dimItemService, toaster) {
    var vm = this;

    vm.classTypeId = -1;

    var chooseClass = {
      'warlock': 0,
      'titan': 1,
      'hunter': 2
    };

    vm.classTypeId = chooseClass[vm.classType] || 0;

    dimLoadoutService.getLoadouts()
      .then(function(loadouts) {
        vm.loadouts = loadouts || [];

        vm.loadouts = _.filter(vm.loadouts, function(item) {
          return ((item.classType === -1) || (item.classType === vm.classTypeId));
        });
      });

    vm.newLoadout = function newLoadout($event) {
      ngDialog.closeAll();
      $rootScope.$broadcast('dim-create-new-loadout', {});
    };

    vm.deleteLoadout = function deleteLoadout(loadout, $event) {
      dimLoadoutService.deleteLoadout(loadout);

      dimLoadoutService.getLoadouts()
        .then(function(loadouts) {
          vm.loadouts = loadouts || [];

          vm.loadouts = _.filter(vm.loadouts, function(item) {
            return ((item.classType === -1) || (item.classType === vm.classTypeId));
          });
        });
    };

    vm.editLoadout = function editLoadout(loadout, $event) {
      ngDialog.closeAll();
      $rootScope.$broadcast('dim-edit-loadout', {
        loadout: loadout
      });
    };

    vm.applyLoadout = function applyLoadout(loadout, $event) {
      ngDialog.closeAll();

      var items = _.chain(loadout.items)
        .values()
        .flatten()
        .value();

        applyLoadoutItems(items, loadout);
    };

    function applyLoadoutItems(items, loadout) {
      if (items.length > 0) {
        var pseudoItem = items.splice(0, 1)[0];
        var item = dimItemService.getItem(pseudoItem);

        var promise = dimItemService.moveTo(item, vm.store, pseudoItem.equipped)
          .catch(function(a) {
            toaster.pop('error', item.name, a.message);
          })
          .finally(function() {
            applyLoadoutItems(items, loadout);
          });
      } else {
        toaster.pop('success', loadout.name, "Your loadout has been transfered.");
      }
    }
  }
})();
