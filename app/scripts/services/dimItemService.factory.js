  (function() {
    'use strict';

    angular.module('dimApp')
      .factory('dimItemService', ItemService);

    ItemService.$inject = ['dimStoreService', 'dimBungieService', 'dimItemTier', 'dimCategory', '$q'];

    function ItemService(dimStoreService, dimBungieService, dimItemTier, dimCategory, $q) {
      return {
        getSimilarItem: getSimilarItem,
        getItem: getItem,
        getItems: getItems,
        moveTo: moveTo
      };

      function updateItemModel(item, source, target, equip) {
        if (source.id !== target.id) {
          var index = _.findIndex(source.items, function(i) {
            return (item.index === i.index);
          });

          if (index >= 0) {
            item.owner = target.id;
            source.items.splice(index, 1);
            target.items.push(item);
          }
        }

        if (equip) {
          var equipped = _.findWhere(target.items, {
            equipped: true,
            type: item.type
          });
          equipped.equipped = false;
          item.equipped = true;
        }

        return item;
      }

      function getSimilarItem(item) {
        return $q.when(dimStoreService.getStores())
          .then(function(stores) {
            var result = null;
            var source = _.find(stores, function(i) {
              return i.id === item.owner;
            });
            var sortedStores = _.sortBy(stores, function(store) {
              if (source.id === store.id) {
                return 0;
              } else if (store.id === 'vault') {
                return 1;
              } else {
                return 2;
              }
            });

            _.each(sortedStores, function(store) {
              if (_.isNull(result)) {
                result = searchForSimilarItem(item, store);
              }
            });

            return result;
          });
      }

      function searchForSimilarItem(item, store) {
        var result = null;
        var sortType = {
          Legendary: 0,
          Rare: 1,
          Uncommon: 2,
          Common: 3,
          Basic: 4,
          Exotic: 5
        };

        var results = _.chain(store.items)
          .where({
            classType: item.classType
          })
          .sortBy(function(i) {
            return sortType[i.tier];
          })
          .where({
            type: item.type,
            equipped: false,
            equipment: true
          })
          .value();

        if (_.size(results) > 0) {
          result = results[0];

          if ((result.id === item.id) && (result.hash === item.hash)) {
            if (_.size(results) > 1) {
              result = results[1];
            } else {
              result = null;
            }
          }
        }

        if (result !== null && result.tier === dimItemTier.exotic) {
          var prefix = _(store.items)
            .chain()
            .filter(function(i) {
              return (i.equipped && i.type !== item.type && i.sort === item.sort && i.tier === dimItemTier.exotic);
            });

          if (prefix.size()
            .value() === 0) {
            return result;
          } else {
            return null;
          }
        }


        return result;
      }

      function equipItem(item) {
        return dimBungieService.equip(item)
          .then(dimStoreService.getStore.bind(null, item.owner))
          .then(function(store) {
            updateItemModel(item, store, store, true);
          });
      }

      function dequipItem(item, equipExotic) {
        if (_.isUndefined(equipExotic)) {
          equipExotic = false;
        }

        var scope = {
          source: null,
          target: null,
          similarItem: null
        };

        var updateEquipped;

        return getSimilarItem(item)
          .then(function(similarItem) {
            scope.similarItem = similarItem;

            if (!equipExotic && (similarItem) && (similarItem.tier === 'Exotic')) {
              return $q.reject('There are no items to equip in the \'' + item.type + '\' slot.')
            } else if (!similarItem) {
              return $q.reject('There are no items to equip in the \'' + item.type + '\' slot.')
            }

            return dimStoreService.getStore(item.owner);
          })
          .then(function(source) {
            scope.source = source;

            return dimStoreService.getStore(scope.similarItem.owner);
          })
          .then(function(target) {
            scope.target = target;

            if (scope.source.id === scope.target.id) {
              return null;
            } else {
              return dimBungieService.transfer(scope.similarItem, scope.source)
                .then(function() {
                  updateItemModel(scope.similarItem, scope.target, scope.source, false)
                });
            }
          })
          .then(function() {
            return dimBungieService.equip(scope.similarItem);
          })
          .then(function() {
            return updateItemModel(scope.similarItem, scope.source, scope.source, true);
          })
          .catch(function(e) {
            return $q.reject(e);
          });
      }

      function moveToVault(item) {
        return dimStoreService.getStore('vault')
          .then(function(target) {
            return moveToStore(item, target, false);
          });
      }

      function moveToStore(item, store, equip) {
        var scope = {
          source: null,
          target: store
        };

        return dimStoreService.getStore(item.owner)
          .then(function(source) {
            scope.source = source;

            return dimBungieService.transfer(item, scope.target);
          })
          .then(function() {
            return updateItemModel(item, scope.source, scope.target, false);
          })
          .then(function(item) {
            if ((item.owner !== 'vault') && equip) {
              return equipItem(item);
            } else {
              return item;
            }
          });
      }

      function canEquipExotic(item, store) {
        var deferred = $q.defer();
        var promise = deferred.promise;

        var prefix = _(store.items)
          .chain()
          .filter(function(i) {
            return (i.equipped && i.type !== item.type && i.sort === item.sort && i.tier === dimItemTier.exotic)
          });

        if (prefix.size()
          .value() === 0) {
          deferred.resolve(true);
        } else {
          var exoticItem = prefix.value()[0];

          dequipItem(exoticItem)
            .then(function(result) {
              deferred.resolve(true);
            })
            .catch(function(err) {
              deferred.reject(new Error('\'' + item.name + '\' cannot be equipped because the exotic in the ' + exoticItem.type + ' slot cannot be unequipped.'));
            });
        }

        return promise;
      }

      function canMoveToStore(item, store) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        var stackAmount = 0;
        var slotsNeededForTransfer = 0;
        var predicate = (store.id === 'vault') ? {
          sort: item.sort
        } : {
          type: item.type
        };

        var itemsInStore = _(store.items)
          .chain()
          .where(predicate)
          .size()
          .value();

        if (item.maxStackSize > 1) {
          stackAmount = _(store.items)
            .chain()
            .where({
              hash: item.hash
            })
            .pluck('amount')
            .reduce(function(memo, amount) {
              return memo + amount;
            }, 0)
            .value();

          slotsNeededForTransfer = Math.ceil((stackAmount + item.amount) / item.maxStackSize) - Math.ceil((stackAmount) / item.maxStackSize);
        } else {
          if (item.owner === store.id) {
            slotsNeededForTransfer = 0;
          } else {
            slotsNeededForTransfer = 1;
          }
        }

        var typeQtyCap = 10;

        //TODO Hardcoded Item Quantity
        if (store.id === 'vault') {
          switch (item.sort) {
            case 'Weapons':
            case 'Weapon':
              {
                typeQtyCap = 36;
                break;
              }
            default:
              {
                typeQtyCap = 24;
                break;
              }
          }
        } else {
          switch (item.type) {
            case 'Material':
            case 'Consumable':
              {
                typeQtyCap = 15;
                break;
              }
            default:
              {
                typeQtyCap = 10;
                break;
              }
          }
        }

        // TODO Need to add support to transfer partial stacks.
        if ((itemsInStore + slotsNeededForTransfer) <= typeQtyCap) {
          if ((item.owner !== store.id) && (store.id !== 'vault')) {
            var vault;

            dimStoreService.getStore('vault')
              .then(function(v) {
                vault = v;
                return canMoveToStore(item, v);
              })
              .then(function() {
                deferred.resolve(true);
              })
              .catch(function(err) {
                // createSpace(vault, item, store)
                //   .then(function() {
                    deferred.reject(err);
                  // });
              });
          } else {
            deferred.resolve(true);
          }
        } else {
          // if (store.id !== 'vault') {
          //   createSpace(store, item, store)
          //     .catch(function() {
          //       deferred.reject(new Error('There are too many \'' + (store.id === 'vault' ? item.sort : item.type) + '\' items in the ' + (store.id === 'vault' ? 'vault' : 'guardian') + '.'));
          //     });
          // } else {
            deferred.reject(new Error('There are too many \'' + (store.id === 'vault' ? item.sort : item.type) + '\' items in the ' + (store.id === 'vault' ? 'vault' : 'guardian') + '.'));
          // }
        }

        return promise;
      }

      function createSpace(store, item, target) {
        var targetIsSource = (store.id === target.id);
        var scope = {};

        var promise = $q.when(dimStoreService.getStores())
          .then(function(stores) {
            // var sortedStores = _.chain(stores)
            //   .filter(function(s) {
            //     return (s.id !== 'vault');
            //   })
            //   .sortBy(function(s) {
            //        if (s.id === store.id) {
            //          return 2;
            //        } else if (s.id === target.id) {
            //          return 0;
            //        } else {
            //          return 1;
            //       }
            //    })
            //   .value();
            //
            // var i = _.findWhere(store.items, { type: item.type, equipped: false });

            return $q.reject('woopsie');
          });

        return promise;

        // var source = null;
        // var checkVault = true;
        //
        // return dimStoreService.getStore(item.owner)
        //   .then(function(store) {
        //     source = store;
        //
        //     if ((source.id === target.id) || (source.id === 'vault') || (target.id === 'vault')) {
        //       checkVault = false;
        //     }
        //
        //     if (checkVault) {
        //       var itemToMove;
        //       var stores;
        //       var vault;
        //
        //       return dimStoreService.getStores()
        //         .then(function(_stores) {
        //           stores = _stores;
        //
        //           vault = _.findWhere(stores, {
        //             id: 'vault'
        //           });
        //
        //           itemToMove = _.findWhere(store.items, {
        //             equipped: false,
        //             type: item.type
        //           });
        //         })
        //         .then(function() {
        //           // var overflow = _.chain(stores)
        //           //   .sortBy(function(s) {
        //           //     if (s.id === 'vault') {
        //           //       return 0;
        //           //     } else if (s.id === source.id) {
        //           //       return 2;
        //           //     } else if (s.id === target.id) {
        //           //       return 3;
        //           //     } else {
        //           //       return 1;
        //           //     }
        //           //   })
        //           //   .filter(function(s) {
        //           //     var count = _.chain(s.items)
        //           //       .where({
        //           //         equipped: false,
        //           //         type: item.type
        //           //       })
        //           //       .size()
        //           //       .value();
        //           //
        //           //     if (size < 9)
        //           //
        //           //       return ((s.id !== 'vault') && (s.id !== source.id) && (s.id !== target.id));
        //           //   });
        //           //
        //           // if (_.isUndefined(overflow)) {
        //           //
        //           // }
        //         });
        //     }
        //   })
        //   .then(function() {
        //
        //   });
      }

      function isVaultToVault(item, store) {
        var deferred = $q.defer();
        var promise = deferred.promise;
        var result = ((item.owner === 'vault') && (store.id === 'vault'));

        deferred.resolve(result ? deferred.reject(new Error('Cannot process vault-to-vault transfers.')) : false);

        return promise;
      }


      function isValidTransfer(equip, store, item) {
        return $q(function(resolve, reject) {
          var promises = [];

          promises.push(isVaultToVault(item, store));
          promises.push(canMoveToStore(item, store));

          if ((item.tier === 'Exotic') && equip) {
            promises.push(canEquipExotic(item, store));
          }

          resolve($q.all(promises));
        });
      }

      function moveTo(item, target, equip) {
        var data = {
          item: item,
          source: null,
          target: target,
          sameSource: (item.owner === target.id),
          isVault: {
            source: item.owner === 'vault',
            target: target.id === 'vault'
          }
        };

        var movePlan = dimStoreService.getStore(item.owner)
          .then(function(store) {
            data.source = store;

            return isValidTransfer(equip, target, item);
          })
          .then(function(a) {
            var promise = $q.when();

            if (!data.isVault.source && !data.isVault.target) { // Guardian to Guardian
              if (data.source.id != data.target.id) { // Different Guardian
                if (item.equipped) {
                  promise = promise.then(dequipItem.bind(null, item));
                }

                promise = promise.then(moveToVault.bind(null, item))
                  .then(moveToStore.bind(null, item, data.target, equip));
              }

              if (equip) {
                promise = promise.then(function() {
                  if (!item.equipped) {
                    return equipItem(item);
                  } else {
                    return $q.when(null);
                  }
                });
              } else if (!equip) {
                promise = promise.then(function() {
                  if (item.equipped) {
                    return dequipItem.bind(null, item)();
                  } else {
                    return $q.when(null);
                  }
                });
              }
            } else if (data.isVault.source && data.isVault.target) { // Vault to Vault
              // Do Nothing.
              //console.log('vault-to-vault');
            } else if (data.isVault.source || data.isVault.target) { // Guardian to Vault
              if (item.equipped) {
                promise = promise.then(dequipItem.bind(null, item));
              }

              promise = promise.then(moveToStore.bind(null, item, data.target, equip));
            }

            return promise;
          })
          .catch(function(e) {
            return $q.reject(e);
          });

        return movePlan;
      }

      function getItems() {
        var returnValue = [];
        var stores = dimStoreService.getStores();

        angular.forEach(stores, function(store) {
          returnValue = returnValue.concat(store.items);
        });

        return returnValue;
      }

      function getItem(id, hash, amount, store) {
        var items;

        if (store) {
          items = store.items;
        } else {
          items = getItems();
        }

        var item;

        if (_.isObject(id)) {
          var primitive = id;

          item = _.find(items, function(item) {
            return ((item.id === primitive.id) && (item.hash === primitive.hash));
          });
        } else {
          predicate = {};

          if (!_.isEmpty(id)) {
            predicate.id = id;
          }

          if (!_.isEmpty(hash)) {
            predicate.hash = hash;
          }

          item = _.findWhere(items, predicate);
        }

        return item;
      }

      return service;
    }
  })();
