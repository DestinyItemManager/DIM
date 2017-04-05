import angular from 'angular';
import _ from 'underscore';

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
  template: [
    '<div ng-repeat="(type, lockeditem) in vm.lockedItems">',
    '  <div class="locked-item" ng-switch="lockeditem" ui-on-drop="vm.onDrop({$data: $data, type: type})" drag-channel="{{type}}" drop-channel="{{type}}" drop-validate="vm.lockedItemsValid({$data: $data, type: type})">',
    '    <div ng-switch-when="null" class="empty-item">',
    '      <div ng-switch="vm.hasLockedPerks(vm.lockedPerks, type)" class="perk-addition" ng-click="vm.addPerkClicked(vm.activePerks, vm.lockedPerks, type, $event)">',
    '        <div ng-switch-when="false" class="perk-addition-text-container">',
    '          <i class="fa fa-plus"></i>',
    '          <small class="perk-addition-text" translate="LB.LockPerk"></small>',
    '        </div>',
    '        <div ng-switch-when="true" class="locked-perk-notification">',
    '          <img ng-src="{{vm.getFirstPerk(vm.lockedPerks, type).icon | bungieIcon}}" ng-attr-title="{{vm.getFirstPerk(vm.lockedPerks, type).description}}" />',
    '        </div>',
    '      </div>',
    '    </div>',
    '    <div ng-switch-default>',
    '      <div class="lock-container">',
    '        <dim-min-max-item item-data="lockeditem" store-data="vm.getStore({owner: lockeditem.owner})"></dim-min-max-item>',
    '        <div class="close" ng-click="vm.onRemove({type: type})" role="button" tabindex="0"></div>',
    '      </div>',
    '    </div>',
    '    <div class="label">{{vm.i18nItemNames[type]}}</div>',
    '  </div>',
    '</div>'
  ].join('')
};

angular.module('dimApp')
  .component('dimMinMaxLocks', MinMaxLocks);


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
        collision: 'flip flip',
        within: '.store-bounds'
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
        template: [
          '<div class="perk-select-box" ng-class="{\'shift-held\' : vmd.shiftHeld }" dim-click-anywhere-but-here="closeThisDialog()">',
          '  <div class="perk" ng-class="{\'active-perk-or\' : vmd.lockedPerks[vmd.type][perk.hash].lockType === \'or\', \'active-perk-and\' : vmd.lockedPerks[vmd.type][perk.hash].lockType === \'and\'}" ng-repeat="perk in vmd.perks[vmd.type]" ng-click="vmd.onPerkLocked({perk: perk, type: vmd.type, $event: $event})">',
          '    <img ng-src="{{perk.icon | bungieIcon}}" ng-attr-title="{{perk.description}}" />',
          '    <small>{{perk.name}}</small>',
          '  </div>',
          '</div>'].join(''),
        plain: true,
        overlay: false,
        className: 'perk-select-popup',
        showClose: false,
        scope: angular.extend($scope.$new(true), {}),
        controllerAs: 'vmd',
        controller: function($document) {
          'ngInject';
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
        },
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

