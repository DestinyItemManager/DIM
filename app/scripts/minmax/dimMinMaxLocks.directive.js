(function() {
  'use strict';

  var MinMaxLocks = {
    controller: MinMaxLocksCtrl,
    controllerAs: 'vm',
    bindings: {
      lockedItems: '<',
      lockedPerks: '<',
      activePerks: '<',
      lockedItemsValid: '&',
      onDrop: '&',
      onRemove: '&',
      getStore: '&',
      onPerkLocked: '&'
    },
    template: [
      '<div ng-repeat="(type, lockeditem) in vm.lockedItems">',
      '  <div class="locked-item" ng-switch="lockeditem" ui-on-drop="vm.onDrop({$data: $data, type: type})" drag-channel="{{type}}" drop-channel="{{type}}" drop-validate="vm.lockedItemsValid({$data: $data, type: type})">',
      '    <div ng-switch-when="null" class="empty-item">',
      '      <div class="perk-addition" ng-click="vm.addPerkClicked(vm.activePerks, vm.lockedPerks, type, $event)">',
      '        <div ng-if="!vm.activePerks[type]" class="perk-addition-text-container">',
      '          <i class="fa fa-plus" aria-hidden="true"></i>',
      '          <small class="perk-addition-text">Lock perk</small>',
      '        </div>',
      '        <div ng-if="vm.activePerks[type]" class="perk-addition-text-container">',
      '          <i class="fa fa-plus" aria-hidden="true"></i>',
      '          <small class="perk-addition-text">Lock perk</small>',
      '        </div>',
      '      </div>',
      '    </div>',
      '    <div ng-switch-default>',
      '      <dim-min-max-item item-data="lockeditem" store-data="vm.getStore({owner: lockeditem.owner})"></dim-min-max-item>',
      '      <div class="close" ng-click="vm.onRemove({type: type})" role="button" tabindex="0"></div>',
      '    </div>',
      '    <div class="label">{{type}}</div>',
      '  </div>',
      '</div>'
    ].join('')
  };

  angular.module('dimApp')
    .component('dimMinMaxLocks', MinMaxLocks);

  MinMaxLocksCtrl.$inject = ['$scope', 'ngDialog'];

  function MinMaxLocksCtrl($scope, ngDialog) {
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
      addPerkClicked: function(perks, lockedPerks, type, e) {
        e.stopPropagation();
        if (dialogResult) {
          dialogResult.close();
        }

        if (vm.shiftClickCallback && e.shiftKey) {
          vm.shiftClickCallback(vm.itemData);
          return;
        }

        detailItemElement = angular.element(e.currentTarget);

        dialogResult = ngDialog.open({
          template: [
            '<div class="perk-select-box" dim-click-anywhere-but-here="closeThisDialog()">',
            '  <div class="perk" ng-class="{\'active-perk-or\' : vmd.lockedPerks[vmd.type][perk.hash] === \'or\', \'active-perk-and\' : vmd.lockedPerks[vmd.type][perk.hash] === \'and\'}" ng-repeat="perk in vmd.perks[vmd.type]" ng-click="vmd.onPerkLocked({perk: perk, type: vmd.type, $event: $event})">',
            '    <img ng-src="{{perk.icon}}" ng-attr-title="{{perk.description}}"></img>',
            '    <small>{{perk.name}}</small>',
            '  </div>',
            '</div>'].join(''),
          plain: true,
          overlay: false,
          className: 'perk-select-popup',
          showClose: false,
          scope: angular.extend($scope.$new(true), {
          }),
          controllerAs: 'vmd',
          controller: [function() {
            var vmd = this;
            angular.extend(vmd, {
              perks: perks,
              lockedPerks: lockedPerks,
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
