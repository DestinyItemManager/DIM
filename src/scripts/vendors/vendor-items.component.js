import angular from 'angular';
import _ from 'underscore';
import { sum } from '../util';

export const VendorItems = {
  controller: VendorItemsCtrl,
  controllerAs: 'vm',
  bindings: {
    vendors: '=vendorsData',
    types: '<displayTypes',
    totalCoins: '<',
    activeTab: '<',
    extraMovePopupClass: '<'
  },
  template: [
    '<div class="vendor-char-items" ng-repeat="(vendorHash, vendor) in vm.vendors | values | vendorTab:vm.activeTab | orderBy:[\'vendorOrder\'] track by vendor.hash">',
    '  <div class="title">',
    '    <div class="collapse-handle" ng-click="vm.toggleSection(vendorHash)">',
    '      <i class="fa collapse" ng-class="vm.settings.collapsedSections[vendorHash] ? \'fa-plus-square-o\': \'fa-minus-square-o\'"></i>',
    '      <img class="vendor-icon" ng-src="{{::vendor.icon | bungieIcon}}" />',
    '      {{::vendor.name}}',
    '      <span class="vendor-location">{{::vendor.location}}</span>',
    '    </div>',
    '    <countdown class="vendor-timer" ng-if="vendor.nextRefreshDate[0] !== \'9\'" end-time="vendor.nextRefreshDate"></countdown>',
    '  </div>',
    '  <div class="vendor-row" ng-if="!vm.settings.collapsedSections[vendorHash]">',
    '    <vendor-currencies vendor-categories="vendor.categories" total-coins="vm.totalCoins" property-filter="vm.activeTab"></vendor-currencies>',
    '    <div class="vendor-category" ng-repeat="category in vendor.categories | vendorTab:vm.activeTab track by category.index">',
    '      <h3 class="category-title">{{::category.title}}</h3>',
    '      <div class="vendor-items">',
    '        <vendor-item ng-repeat="saleItem in category.saleItems | vendorTabItems:vm.activeTab track by saleItem.index" sale-item="saleItem" total-coins="vm.totalCoins" item-clicked="vm.itemClicked(saleItem, $event)"></vendor-item>',
    '      </div>',
    '    </div>',
    '  </div>',
    '</div>'
  ].join('')
};

function VendorItemsCtrl($scope, ngDialog, dimStoreService, dimSettingsService) {
  'ngInject';

  var vm = this;
  var dialogResult = null;
  var detailItem = null;
  var detailItemElement = null;

  vm.settings = dimSettingsService;

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
    itemClicked: function(saleItem, e) {
      e.stopPropagation();
      if (dialogResult) {
        dialogResult.close();
      }

      const item = saleItem.item;
      if (detailItem === item) {
        detailItem = null;
        dialogResult = null;
        detailItemElement = null;
      } else {
        detailItem = item;
        detailItemElement = angular.element(e.currentTarget);

        var compareItems = _.flatten(dimStoreService.getStores().map(function(store) {
          return _.filter(store.items, { hash: item.hash });
        }));

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
            '  <div class="item-description" ng-if="!vm.item.equipment && vm.compareItemCount">You have {{vm.compareItemCount}} of these.</div>',
            '  <div class="item-details" ng-if="vm.saleItem.failureStrings">{{vm.saleItem.failureStrings}}</div>',
            '  <div class="item-details" ng-if="vm.unlockStores.length">',
            '    <div translate="Vendors.Available">:</div>',
            '    <div class="unlocked-character" ng-repeat="store in vm.unlockStores | sortStores:vm.settings.characterOrder track by store.id">',
            '      <div class="emblem" ng-style="{ \'background-image\': \'url(\' + store.icon + \')\' }"></div>',
            '      {{store.name}}',
            '    </div>',
            '  </div>',
            '</div>'].join(''),
          plain: true,
          overlay: false,
          className: 'move-popup vendor-move-popup ' + (vm.extraMovePopupClass || ''),
          showClose: false,
          scope: angular.extend($scope.$new(true), {
          }),
          controllerAs: 'vm',
          controller: [function() {
            var innerVm = this;
            angular.extend(innerVm, {
              settings: innerVm.settings,
              item: item,
              saleItem: saleItem,
              unlockStores: saleItem.unlockedByCharacter.map((id) => _.find(dimStoreService.getStores(), { id })),
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
    $onDestroy: function() {
      if (dialogResult) {
        dialogResult.close();
      }
    },
    toggleSection: function(id) {
      vm.settings.collapsedSections[id] = !vm.settings.collapsedSections[id];
      vm.settings.save();
    }
  });
}

