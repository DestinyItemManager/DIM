(function () {
  angular.module('dimApp')
    .directive('dimLoadoutPopup', LoadoutPopup);

  LoadoutPopup.$inject = [];

  function LoadoutPopup() {
    return {
      controller: LoadoutPopupCtrl,
      controllerAs: 'vm',
      bindToController: true,
      restrict: 'A',
      scope: {},
      replace: true,
      template: [
        '<div class="loadout-popup-content">',
        '  <div class="loadout-set" ng-click="vm.newLoadout($event)">+ Create Loadout</div>',
        '  <div class="loadout-list">',
        '    <div ng-repeat="loadout in vm.loadouts" class="loadout-set">',
        '      <span class="button-name">{{ loadout.name }}</span>',
        '      <span class="button-delete" ng-click="vm.deleteLoadout(loadout, $event)">Delete</span>',
        '      <span class="button-edit" ng-click="vm.editLoadout(loadout, $event)">Edit</span>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    };
  }

  LoadoutPopupCtrl.$inject = ['$rootScope', 'ngDialog', 'dimLoadoutService'];

  function LoadoutPopupCtrl($rootScope, ngDialog, dimLoadoutService) {
    var vm = this;

    dimLoadoutService.getLoadouts()
      .then(function (loadouts) {
        vm.loadouts = loadouts || [];
      });

    vm.newLoadout = function newLoadout($event) {
      $rootScope.$broadcast('dim-create-new-loadout', {});
      ngDialog.closeAll();
    };

    vm.deleteLoadout = function deleteLoadout(loadout, $event) {
      $rootScope.$broadcast('dim-create-delete-loadout', { loadout: loadout });
    };

    vm.editLoadout = function editLoadout(loadout, $event) {
      $rootScope.$broadcast('dim-create-edit-loadout', { loadout: loadout });
    };
  }
})();
