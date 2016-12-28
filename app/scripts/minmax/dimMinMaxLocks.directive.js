(function() {
  'use strict';

  var MinMaxLocks = {
    controller: MinMaxLocksCtrl,
    controllerAs: 'vm',
    bindings: {
      lockedItems: '<',
      lockedPerks: '<',
      activePerks: '<',
      i18nItemNames: '<',
      lockedItemsValid: '&',
      onDrop: '&',
      onRemove: '&',
      getStore: '&',
      onPerkLocked: '&'
    },
    templateUrl: 'scripts/minmax/dimMinMaxLocks.directive.html'
  };

  angular.module('dimApp')
    .component('dimMinMaxLocks', MinMaxLocks);

  MinMaxLocksCtrl.$inject = ['$scope', 'hotkeys', 'ngDialog'];

  function MinMaxLocksCtrl($scope, hotkeys, ngDialog) {
    var vm = this;
    var dialogResult = null;
    var detailItemElement = null;

    $scope.$on('ngDialog.opened', function(event, $dialog) {
      if (dialogResult && $dialog[0].id === dialogResult.id) {
        $dialog.position({
          my: 'left-2 top-2',
          at: 'left top',
          of: detailItemElement,
          collision: 'flip flip'
        });
      }
    });

    angular.extend(vm, {
      getFirstPerk: function(lockedPerks, type) {
        return vm.lockedPerks[type][_.keys(vm.lockedPerks[type])[0]];
      },
      hasLockedPerks: function(lockedPerks, type) {
        return _.keys(lockedPerks[type]).length > 0;
      },
      addPerkClicked: function(perks, lockedPerks, type, e) {
        e.stopPropagation();
        if (dialogResult) {
          dialogResult.close();
        }

        detailItemElement = angular.element(e.currentTarget);

        dialogResult = ngDialog.open({
          template: 'scripts/minmax/dimMinMaxLocks.directive-2.html',
          overlay: false,
          className: 'perk-select-popup',
          showClose: false,
          scope: angular.extend($scope.$new(true), {}),
          controllerAs: 'vmd',

          controller: ['$document', function($document) {
            var vmd = this;

            $document.keyup(function(e) {
              if (vmd.shiftHeld) {
                $scope.$apply(function() {
                  vmd.shiftHeld = e.shiftKey;
                });
              }
            });

            $document.keydown(function(e) {
              if (vmd.shiftHeld === false && e.shiftKey) {
                $scope.$apply(function() {
                  vmd.shiftHeld = e.shiftKey;
                });
              }
            });

            angular.extend(vmd, {
              perks: perks,
              lockedPerks: lockedPerks,
              shiftHeld: false,
              type: type,
              onPerkLocked: vm.onPerkLocked
            });
          }],

          // Setting these focus options prevents the page from
          // jumping as dialogs are shown/hidden
          trapFocus: false,

          preserveFocus: false
        });
      },
      close: function() {
        if (dialogResult) {
          dialogResult.close();
        }
        $scope.closeThisDialog();
      }
    });
  }
})();
