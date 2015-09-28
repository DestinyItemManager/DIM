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
        var matchingItem;

        if (source.id !== target.id) {
          var index = _.findIndex(source.items, function(i) {
            return (item.index === i.index);
          });

          if (item.maxStackSize > 1 && item.amount < item.maxStackSize) { // Balance the stacks.
            if (_.has(item, 'moveAmount') && (item.moveAmount > 0)) {
              matchingItem = _.reduce(source.items, function(memo, i) {
                if (item.hash === i.hash) {
                  if (!(_.has(i, 'moveAmount')) || ((_.has(i, 'moveAmount') && i.moveAmount === 0))) {
                    if (memo === null) {
                      memo = i;
                    } else if (memo.amount > i.amount) {
                      memo = i;
                    }
                  }
                }

                return memo;
              }, null);

              if (!_.isNull(matchingItem)) {
                if (item.moveAmount > item.amount) {
                  matchingItem.amount = matchingItem.amount + (item.amount - item.moveAmount);
                }
              }

              item.amount = item.moveAmount;
            }

            item.moveAmount = 0;

            matchingItem = _.filter(target.items, function(i) {
              return ((i.amount < item.maxStackSize) && (i.hash === item.hash));
            });

            if (_.size(matchingItem) > 0) {
              var mItem = matchingItem[0];
              var combinedTotal = mItem.amount + item.amount;

              item.moveAmount = item.amount;

              if (combinedTotal <= item.maxStackSize) {
                mItem.amount = combinedTotal;
                item.amount = 0;
              } else {
                mItem.amount = mItem.maxStackSize;
                item.amount = combinedTotal - item.maxStackSize;
              }
            }
          }

          item.owner = target.id;

          if (index >= 0) {
            source.items.splice(index, 1);
          }

          if (item.amount > 0) {
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
              return $q.reject('There are no items to equip in the \'' + item.type + '\' slot.');
            } else if (!similarItem) {
              return $q.reject('There are no items to equip in the \'' + item.type + '\' slot.');
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
              var p = $q.when();
              var vault;

              if (scope.similarItem.owner !== 'vault') {
                p = dimStoreService.getStore('vault')
                  .then(function(v) {
                    vault = v;
                    return dimBungieService.transfer(scope.similarItem, vault);
                  })
                  .then(function() {
                    updateItemModel(scope.similarItem, vault, scope.source, false);
                  });
              }

              return p.then(function() {
                  return dimBungieService.transfer(scope.similarItem, scope.source);
                })
                .then(function() {
                  updateItemModel(scope.similarItem, (vault) ? vault : scope.target, scope.source, false);
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

            // if (_.has(item, 'moveAmount') && (item.moveAmount > 0)) {
            //   item.amount = item.moveAmount;
            // }

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
        var hasLifeExotic = _.contains(item.talentPerks, 4044819214);

        var prefix = _(store.items)
          .chain()
          .filter(function(i) {
            return (i.equipped && i.type !== item.type && i.sort === item.sort && i.tier === dimItemTier.exotic)
          });

        var amount = prefix.size().value();

        // Fix for "The Life Exotic" Perk on Exotic Items
        // Can equip multiples

        if (amount === 0) {
          deferred.resolve(true);
        } else if (amount === 1) {
          var exoticItem = prefix.value()[0];

          if (hasLifeExotic) {
            deferred.resolve(true);
          } else if (_.contains(exoticItem.talentPerks, 4044819214)) {
            deferred.resolve(true);
          } else {
            dequipItem(exoticItem)
              .then(function(result) {
                deferred.resolve(true);
              })
              .catch(function(err) {
                deferred.reject(new Error('\'' + item.name + '\' cannot be equipped because the exotic in the ' + exoticItem.type + ' slot cannot be unequipped.'));
              });
          }
        } else if (amount === 2) {
          // Assume that only one item type has 'The Life Exotic' perk
          var exoticItems = prefix.value();

          var exoticItem = _.find(exoticItems, function(item) {
            return !_.contains(item.talentPerks, 4044819214);
          });

          var exoticItemWithPerk = _.find(exoticItems, function(item) {
            return _.contains(item.talentPerks, 4044819214);
          });

          if (hasLifeExotic) {
            dequipItem(exoticItemWithPerk)
              .then(function(result) {
                deferred.resolve(true);
              })
              .catch(function(err) {
                deferred.reject(new Error('\'' + item.name + '\' cannot be equipped because the exotic in the ' + exoticItem.type + ' slot cannot be unequipped.'));
              });
          } else {
            dequipItem(exoticItem)
              .then(function(result) {
                deferred.resolve(true);
              })
              .catch(function(err) {
                deferred.reject(new Error('\'' + item.name + '\' cannot be equipped because the exotic in the ' + exoticItem.type + ' slot cannot be unequipped.'));
              });
          }
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
            case 'Armor':
              {
                typeQtyCap = 72;
                break;
              }
            default:
              {
                typeQtyCap = 36;
                break;
              }
          }
        } else {
          switch (item.type) {
            case 'Material':
            case 'Consumable':
              {
                typeQtyCap = 20;
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

            if (item.owner !== 'vault') {
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
            return $q.reject('woopsie');
          });

        return promise;
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

            promise = promise
              .then(function() {
                item.moveAmount = 0;
              });

            return promise;
          })
          .catch(function(e) {
            return $q.reject(e);
          });

        return movePlan;
      }

      function updateLevels() {
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
