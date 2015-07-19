(function() {
    'use strict';

    angular.module('dimApp')
        .directive('dimMovePopup', MovePopup);

    MovePopup.$inject = ['ngDialog'];

    function MovePopup(ngDialog) {
        return {
            controller: MovePopupController,
            controllerAs: 'vm',
            bindToController: true,
            restrict: 'A',
            scope: {
                store: '=dimStore',
                item: '=dimItem'
            },
            replace: true,
            template: [
                '<div class="move-popup" alt="" title="" ng-class="{\'popup-small\': !vm.showDetails}"">',
                '  <div dim-move-item-properties="vm.item"></div>',
                '   <div class="stats-wrap">',
                '     <div class="stats" ng-repeat="stat in vm.stats">',
                '       <div class="{{stat.label}}"></div><span>{{stat.label}}: {{stat.value}}</span>',
                '     </div>',
                '   </div>',
                '  <div class="stats-table" ng-show="vm.showDetails" ng-class="{\'col-xs-6\': vm.showDetails,\'col-xs-12\': !vm.showDetails}">',
                '   <div class="col-xs-12" ng-repeat="detail in vm.details">',
                '     <div class="stats-title col-xs-4">{{ detail.label }}</div>',
                '     <div class="stats-container col-xs-6">',
                '       <div class="stats-bar" style="width: {{detail.value}}%"></div>',
                '     </div>',
                '     <div class="stats-value col-xs-2">{{ detail.value }}</div>',
                '   </div>',
                '  </div>',
                '  <div class="location-wrap" ng-class="{\'col-xs-6\': vm.showDetails,\'col-xs-12\': !vm.showDetails}">',
                '   <div class="locations col-xs-12" ng-repeat="store in vm.stores" ng-if="vm.canShowVault(vm.item, vm.store, store)||vm.canShowEquip(vm.item, vm.store, store)||vm.canShowStore(vm.item, vm.store, store)">',
                '     <div class="location-thumb" style="background-image: url({{ store.icon}})"></div>',
                '     <div class="move-button move-vault" ng-class="{ \'little\': item.notransfer }" alt="{{ vm.characterInfo(store) }}" title="{{ vm.characterInfo(store) }}" ',
                '      ng-if="vm.canShowVault(vm.item, vm.store, store)" ng-click="vm.moveToVault(store, $event)" ',
                '      data-type="item" data-character="{{ store.id }}">',
                '       <i class="fa fa-archive"></i><span>Vault</span>',
                '     </div>',
                '     <div class="move-button move-store" ng-class="{ \'little\': item.notransfer }" alt="{{ vm.characterInfo(store) }}" title="{{ vm.characterInfo(store) }}" ',
                '      ng-if="vm.canShowStore(vm.item, vm.store, store)" ng-click="vm.moveToGuardian(store, $event)" ',
                '      data-type="item" data-character="{{ store.id }}"> ',
                '       <i class="fa fa-share"></i><span>Store</span>',
                '     </div>',
                '     <div class="move-button move-equip" ng-class="{ \'little\': item.notransfer }" alt="{{ vm.characterInfo(store) }}" title="{{ vm.characterInfo(store) }}" ',
                '      ng-if="vm.canShowEquip(vm.item, vm.store, store)" ng-click="vm.moveToEquip(store, $event)" ',
                '      data-type="equip" data-character="{{ store.id }}">',
                '       <i class="fa fa-user-plus"></i><span>Equip</span>',
                '     </div>',
                '   </div>',
                '  </div>',
                '</div>'
            ].join('')
        };
    }

    MovePopupController.$inject = ['$rootScope', 'dimStoreService', 'dimItemService', 'ngDialog', '$q', 'toaster'];

    function MovePopupController($rootScope, dimStoreService, dimItemService, ngDialog, $q, toaster) {
        var vm = this;

        vm.light = 0;
        vm.stats = [];
        vm.details = [];
        vm.showDetails = false;

        if(vm.item.sort == 'Weapons') {
          vm.showDetails = true;
        }

        /**
         * Handle Primary Stat
         * @param  {[type]} vm.item.primStat [description]
         * @return {[type]}                  [description]
         */
        if (vm.item.primStat) {
            if (vm.item.primStat.statHash === 3897883278) {
                // only 4 stats if there is a light element. other armor has only 3 stats.
                if (vm.item.stats.length === 4) {
                    vm.light = vm.item.stats[0].value;
                }

                var stats = ['int', 'dis', 'str'];
                var val = 0;

                for (var s = 0; s < stats.length; s++) {
                    val = vm.item.stats[s + (vm.item.stats.length === 4 ? 1 : 0)].value;
                    if (val !== 0) {
                        vm.stats.push({
                            'label': stats[s],
                            'value': val
                        });
                    }
                }
            } else if (vm.item.primStat.statHash === 368428387) {
                switch (vm.item.dmg) {
                    case 'arc':
                        {
                            //vm.classes['is-arc'] = true;
                            break;
                        }
                    case 'solar':
                        {
                            //vm.classes['is-solar'] = true;
                            break;
                        }
                    case 'void':
                        {
                            //vm.classes['is-void'] = true;
                            break;
                        }
                }

                vm.stats.push({
                    'label': 'attack',
                    'value': vm.item.primStat.value
                });
            }
        }
        /**
         * Handle Item Details
         * @param  {[type]} var i             [description]
         * @return {[type]}     [description]
         */
        for (var i = 0; i < vm.item.stats.length; i++){
          switch (vm.item.stats[i].statHash) {
            case 4284893193: {
              // RoF
              vm.details.push({
                'label': 'RoF',
                'value': vm.item.stats[i].value
              });
              break;
            }
            case 3614673599: {
              // Blast Radius
              vm.details.push({
                'label': 'Blast',
                'value': vm.item.stats[i].value
              });
              break;
            }
            case 2523465841: {
              // Velocity
              vm.details.push({
                'label': 'Velocity',
                'value': vm.item.stats[i].value
              });
              break;
            }
            case 4043523819: {
              // Impact
              vm.details.push({
                'label': 'Impact',
                'value': vm.item.stats[i].value
              });
              break;
            }
            case 1240592695: {
              // Range
              vm.details.push({
                'label': 'Range',
                'value': vm.item.stats[i].value
              });
              break;
            }
            case 155624089: {
              // Stability
              vm.details.push({
                'label': 'Stability',
                'value': vm.item.stats[i].value
              });
              break;
            }
            case 4188031367: {
              // Reload
              vm.details.push({
                'label': 'Reload',
                'value': vm.item.stats[i].value
              });
              break;
            }
            default: {
              // default
              break;
            }
          }
        }

        function capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }

        vm.characterInfo = function characterInfo(store) {
            if (store.id === 'vault') {
                return 'Vault';
            } else {
                return store.level + ' ' + capitalizeFirstLetter(store.race) + ' ' + capitalizeFirstLetter(store.gender) + ' ' + capitalizeFirstLetter(store.class);
            }
        };

        function moveItemUI(item, targetStore) {
            var sourceStore = (item.owner === targetStore.id) ? $q.when(targetStore) : dimStoreService.getStore(item.owner);

            return sourceStore
                .then(function(sourceStore) {
                    var i = _.indexOf(sourceStore.items, item);

                    if (i >= 0) {
                        sourceStore.items.splice(i, 1);
                        targetStore.items.push(item);
                        item.owner = targetStore.id;
                    }
                });
        }

        function moveToGuardianFn(store, e) {
            var promise = dimItemService.moveTo(vm.item, store)
                .catch(function(a) {
                    toaster.pop('error', vm.item.name, a.message);
                });

            $rootScope.loadingTracker.addPromise(promise);
        }

        function moveToVaultFn(store, e) {
            var promise = dimItemService.moveTo(vm.item, store)
                .catch(function(a) {
                    toaster.pop('error', vm.item.name, a.message);
                });

            $rootScope.loadingTracker.addPromise(promise);
        }

        function moveToEquipFn(store, e) {
            var promise = dimItemService.moveTo(vm.item, store, true)
                .catch(function(a) {
                    toaster.pop('error', vm.item.name, a.message);
                });

            $rootScope.loadingTracker.addPromise(promise);
        }

        vm.moveToVault = moveToVaultFn;
        vm.moveToEquip = moveToEquipFn;
        vm.moveToGuardian = moveToGuardianFn;

        vm.stores = dimStoreService.getStores();

        vm.canShowItem = function canShowItem(item, itemStore, buttonStore) {
            var result = false;
            // The item is in the vault
            if (item.id === 'vault') {
                if (buttonStore.id === 'vault') { // What to do about sending item back to the vault?
                    return false;
                } else { // Send the item to another Guardian.

                }
            } else { // or, the item is in a guardian's inventory
                if (buttonStore.id === 'vault') { // What to do about sending item to the vault?

                } else if (buttonStore.id === item.owner) { // What to about using item with it's owner?

                } else { // Send the item to another Guardian.

                }
            }

            return result;
        };

        this.canShowVault = function canShowButton(item, itemStore, buttonStore) {
            // If my itemStore is the vault, don't show a vault button.
            // Can't vault a vaulted item.
            if (itemStore.id === 'vault') {
                return false;
            }

            // If my buttonStore is the vault, then show a vault button.
            if (buttonStore.id !== 'vault') {
                return false;
            }

            // Can't move this item away from the current itemStore.
            if (item.notransfer) {
                return false;
            }

            return true;
        };

        this.canShowStore = function canShowButton(item, itemStore, buttonStore) {
            if (buttonStore.id === 'vault') {
                return false;
            }

            if (!item.notransfer) {
                if (itemStore.id !== buttonStore.id) {
                    return true;
                } else if (item.equipped) {
                    return true;
                }
            } else {
                if (item.equipped && itemStore.id === buttonStore.id) {
                    return true;
                }
            }

            return false;
        };

        this.canShowEquip = function canShowButton(item, itemStore, buttonStore) {
            if (buttonStore.id === 'vault') {
                return false;
            }

            if (!item.equipment) {
                return false;
            }

            if (!item.notransfer) {
                if ((itemStore.id !== buttonStore.id) && (item.sort !== 'Postmaster')) {
                    return true;
                } else if ((!item.equipped) && (item.sort !== 'Postmaster')) {
                    return true;
                }
            } else {
                if ((!item.equipped) && (itemStore.id === buttonStore.id) && (item.sort !== 'Postmaster')) {
                    return true;
                }
            }

            return false;
        };
    }
})();
