(function() {
  'use strict';

  var VendorItem = {
    bindings: {
      saleItem: '<',
      totalCoins: '<',
      itemClicked: '&'
    },
    templateUrl: 'scripts/vendors/dimVendorItems.directive.html'
  };

  var VendorItems = {
    controller: VendorItemsCtrl,
    controllerAs: 'vm',
    bindings: {
      vendors: '=vendorsData',
      types: '<displayTypes',
      totalCoins: '<',
      activeTab: '<'
    },
    templateUrl: 'scripts/vendors/dimVendorItems.directive-2.html'
  };

  angular.module('dimApp')
    .component('dimVendorItem', VendorItem)
    .component('dimVendorItems', VendorItems)
    .filter('vendorTab', function() {
      return function vendorTab(categories, prop) {
        if (!prop || !prop.length) {
          return categories;
        }
        return _.filter(categories, prop);
      };
    })
    .filter('vendorTabItems', function() {
      return function vendorTab(items, prop) {
        if (!prop || !prop.length) {
          return items;
        }
        return _.filter(items, {
          hasArmorWeaps: (saleItem) => (saleItem.item.bucket.sort === 'Weapons' || saleItem.item.bucket.sort === 'Armor' || saleItem.item.type === 'Artifact' || saleItem.item.type === 'Ghost'),
          hasVehicles: (saleItem) => (saleItem.item.type === 'Ship' || saleItem.item.type === 'Vehicle'),
          hasShadersEmbs: (saleItem) => (saleItem.item.type === "Emblem" || saleItem.item.type === "Shader"),
          hasEmotes: (saleItem) => (saleItem.item.type === "Emote"),
          hasConsumables: (saleItem) => (saleItem.item.type === "Material" || saleItem.item.type === "Consumable"),
          hasBounties: (saleItem) => (saleItem.item.type === 'Bounties')
        }[prop]);
      };
    })
    .filter('values', function() {
      return function values(obj) {
        return _.values(obj);
      };
    });

  // TODO: separate out class-specific stuff?

  VendorItemsCtrl.$inject = ['$scope', 'ngDialog', 'dimStoreService', 'dimSettingsService'];

  function VendorItemsCtrl($scope, ngDialog, dimStoreService, dimSettingsService) {
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
            template: 'scripts/vendors/dimVendorItems.directive-3.html',
            overlay: false,
            className: 'move-popup vendor-move-popup',
            showClose: false,

            scope: angular.extend($scope.$new(true), {
            }),

            controllerAs: 'vm',

            controller: [function() {
              var innerVm = this;
              angular.extend(innerVm, {
                settings: innerVm.settings,
                item: item,
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
      close: function() {
        if (dialogResult) {
          dialogResult.close();
        }
        $scope.closeThisDialog();
      },
      toggleSection: function(id) {
        vm.settings.collapsedSections[id] = !vm.settings.collapsedSections[id];
        vm.settings.save();
      }
    });
  }
})();
