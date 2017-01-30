import angular from 'angular';
import _ from 'underscore';
import { sum, flatMap } from '../util';

var MinMaxItem = {
  controller: MinMaxItemCtrl,
  controllerAs: 'vm',
  bindings: {
    itemData: '<',
    storeData: '<',
    shiftClickCallback: '='
  },
  template: [
    '<div ng-if="vm.itemData.isVendorItem" class="item-overlay-container">',
    '  <div class="vendor-icon-background">',
    '    <img ng-src="{{vm.itemData.vendorIcon | bungieIcon}}" class="vendor-icon" />',
    '  </div>',
    '  <dim-simple-item ui-draggable="true" drag="::vm.itemData.index" drag-channel="{{ ::vm.itemData.type }}" id="vendor-{{::vm.itemData.hash}}" item-data="vm.itemData" ng-click="vm.itemClicked(vm.itemData, $event)" ng-class="{ \'search-hidden\': !vm.itemData.visible }"></dim-simple-item>',
    '</div>',
    '<dim-store-item ng-if="!vm.itemData.isVendorItem" shift-click-callback="vm.shiftClickCallback" item-data="vm.itemData" store-data="vm.storeData"></dim-store-item>'
  ].join('')
};

angular.module('dimApp')
  .component('dimMinMaxItem', MinMaxItem);


function MinMaxItemCtrl($scope, ngDialog, dimStoreService) {
  var vm = this;
  var dialogResult = null;
  var detailItem = null;
  var detailItemElement = null;

  $scope.$on('ngDialog.opened', function(event, $dialog) {
    if (dialogResult && $dialog[0].id === dialogResult.id) {
      $dialog.position({
        my: 'left top',
        at: 'left bottom+2',
        of: detailItemElement,
        collision: 'flip flip'
      });
    }
  });

  angular.extend(vm, {
    itemClicked: function(item, e) {
      e.stopPropagation();
      if (dialogResult) {
        dialogResult.close();
      }

      if (vm.shiftClickCallback && e.shiftKey) {
        vm.shiftClickCallback(vm.itemData);
        return;
      }

      if (detailItem === item) {
        detailItem = null;
        dialogResult = null;
        detailItemElement = null;
      } else {
        detailItem = item;
        detailItemElement = angular.element(e.currentTarget);

        var compareItems = flatMap(dimStoreService.getStores(), function(store) {
          return _.filter(store.items, { hash: item.hash });
        });

        var compareItemCount = sum(compareItems, 'amount');

        dialogResult = ngDialog.open({
          template: [
            '<div class="move-popup" dim-click-anywhere-but-here="closeThisDialog()">',
            '  <div dim-move-item-properties="vm.item" dim-compare-item="vm.compareItem"></div>',
            '  <div class="item-details more-item-details" ng-if="vm.item.equipment && vm.compareItems.length">',
            '    <div translate="Vendors.Compare">:</div>',
            '    <div class="compare-items">',
            '      <dim-simple-item ng-repeat="ownedItem in vm.compareItems track by ownedItem.index" item-data="ownedItem" ng-click="vm.setCompareItem(ownedItem)" ng-class="{ selected: (ownedItem.index === vm.compareItem.index) }"></dim-simple-item>',
            '    </div>',
            '  </div>',
            '  <div class="item-description" ng-if="!vm.item.equipment">You have {{vm.compareItemCount}} of these.</div>',
            '</div>'].join(''),
          plain: true,
          overlay: false,
          className: 'move-popup vendor-move-popup',
          showClose: false,
          scope: angular.extend($scope.$new(true), {
          }),
          controllerAs: 'vm',
          controller: [function() {
            var vm = this;
            angular.extend(vm, {
              item: item,
              compareItems: compareItems,
              compareItem: _.first(compareItems),
              compareItemCount: compareItemCount,
              setCompareItem: function(item) {
                this.compareItem = item;
              }
            });
          }],
          // Setting these focus options prevents the page from
          // jumping as dialogs are shown/hidden
          trapFocus: false,
          preserveFocus: false
        });
      }
    },
    close: function() {
      if (dialogResult) {
        dialogResult.close();
      }
      $scope.closeThisDialog();
    }
  });
}

