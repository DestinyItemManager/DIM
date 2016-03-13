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
        moveTo: moveTo,
        setLockState: setLockState
      };

      function setLockState(item, store, lockState) {
        return dimBungieService.setLockState(item, store, lockState)
          .then(function() {
            return lockState;
          });
      }

      // Returns the new or updated item (it may create a new item!)
      function updateItemModel(item, source, target, equip, amount) {
        // If we've moved to a new place
        if (source.id !== target.id) {
          // We handle moving stackable and nonstackable items almost exactly the same!
          var stackable = item.maxStackSize > 1;
          // Items to be decremented
          var sourceItems = stackable ?
                _.sortBy(_.select(source.items, function(i) {
                  return i.hash === item.hash &&
                    i.id === item.id;
                }), 'amount') : [item];
          // Items to be incremented. There's really only ever at most one of these, but
          // it's easier to deal with as a list.
          var targetItems = stackable ?
                _.sortBy(_.select(target.items, function(i) {
                  return i.hash === item.hash &&
                    i.id === item.id &&
                    // Don't consider full stacks as targets
                    i.amount !== i.maxStackSize;
                }), 'amount') : [];
          // moveAmount could be more than maxStackSize if there is more than one stack on a character!
          var moveAmount = amount || item.amount;
          var addAmount = moveAmount;
          var removeAmount = moveAmount;
          var removedSourceItem = false;

          // Remove inventory from the source
          while (removeAmount > 0) {
            var sourceItem = sourceItems.shift();
            if (!sourceItem) {
              throw new Error("Looks like you requested to move more of this item than exists in the source!");
            }

            var amountToRemove = Math.min(removeAmount, sourceItem.amount);
            if (amountToRemove === sourceItem.amount) {
              // Completely remove the source item
              var sourceIndex = _.findIndex(source.items, function(i) {
                return sourceItem.index === i.index;
              });
              if (sourceIndex >= 0) {
                source.items.splice(sourceIndex, 1);
                removedSourceItem = sourceItem.index === item.index;
              }
            } else {
              sourceItem.amount -= amountToRemove;
            }

            removeAmount -= amountToRemove;
          }

          // Add inventory to the target (destination)
          var targetItem;
          while (addAmount > 0) {
            targetItem = targetItems.shift();

            if (!targetItem) {
              targetItem = item;
              if (!removedSourceItem) {
                targetItem = angular.copy(item);
                targetItem.index = dimStoreService.createItemIndex(targetItem);
              }
              removedSourceItem = false; // only move without cloning once
              targetItem.amount = 0; // We'll increment amount below
              target.items.push(targetItem);
              targetItem.owner = target.id;
            }

            var amountToAdd = Math.min(addAmount, targetItem.maxStackSize - targetItem.amount);
            targetItem.amount += amountToAdd;
            addAmount -= amountToAdd;
          }
          item = targetItem; // The item we're operating on switches to the last target
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
              } else if (store.isVault) {
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
        var sortType = {
          Legendary: 0,
          Rare: 1,
          Uncommon: 2,
          Common: 3,
          Exotic: 5
        };

        var result = _.chain(store.items)
          .filter(function(i) {
            return i.equipment &&
              i.type === item.type &&
              !i.equipped &&
              // Compatible with this class
              (i.classTypeName === 'unknown' || i.classTypeName === store.class) &&
              // Not the same item
              i.id !== item.id;
          })
          .sortBy(function(i) {
            return sortType[i.tier];
          })
          .first()
          .value();

        if (result && result.tier === dimItemTier.exotic) {
          var prefix = _.filter(store.items, function(i) {
            return i.equipped &&
              i.sort === item.sort &&
              i.tier === dimItemTier.exotic;
          });

          if (prefix.length === 0) {
            return result;
          } else {
            return null;
          }
        }


        return (result) ? result : null;
      }

      function equipItem(item) {
        return dimBungieService.equip(item)
          .then(function() {
            var store = dimStoreService.getStore(item.owner);
            return updateItemModel(item, store, store, true);
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

            // TODO: move something in from the vault to equip!
            // TODO: do we need this exotic logic?
            // could this be removed now, along with all refrences to `equipExotic` that are passed in?
            if ((!equipExotic && similarItem && similarItem.tier === 'Exotic') || !similarItem) {
              return $q.reject(new Error('There are no items to equip in the \'' + item.type + '\' slot.'));
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
                vault = dimStoreService.getVault();
                p = dimBungieService.transfer(scope.similarItem, vault)
                  .then(function() {
                    return updateItemModel(scope.similarItem, vault, scope.source, false);
                  });
              }

              return p.then(function() {
                  return dimBungieService.transfer(scope.similarItem, scope.source);
                })
                .then(function() {
                  return updateItemModel(scope.similarItem, (vault) ? vault : scope.target, scope.source, false);
                });
            }
          })
          .then(function() {
            return equipItem(scope.similarItem);
          })
          .then(function() {
            return updateItemModel(scope.similarItem, scope.source, scope.source, true);
          })
          .catch(function(e) {
            return $q.reject(e);
          });
      }

      function moveToVault(item, amount) {
        return moveToStore(item, dimStoreService.getVault(), false, amount);
      }

      function moveToStore(item, store, equip, amount) {
        var scope = {
          source: dimStoreService.getStore(item.owner),
          target: store
        };

        return dimBungieService.transfer(item, scope.target, amount)
          .then(function() {
            var newItem = updateItemModel(item, scope.source, scope.target, false, amount);
            if ((newItem.owner !== 'vault') && equip) {
              return equipItem(newItem);
            } else {
              return newItem;
            }
          });
      }

      function canEquipExotic(item, store) {
        var deferred = $q.defer();
        var promise = deferred.promise;

        var equippedExotics = _.filter(store.items, function(i) {
            return (i.equipped &&
                    i.type !== item.type &&
                    i.sort === item.sort &&
                    i.tier === 'Exotic');
          });

        // Fix for "The Life Exotic" Perk on Exotic Items
        // Can equip multiples
        function hasLifeExotic(item) {
          return _.find(item.talentGrid.nodes, { name: 'The Life Exotic' }) !== undefined;
        }

        if (equippedExotics.length === 0) {
          deferred.resolve(true);
        } else if (equippedExotics.length === 1) {
          var equippedExotic = equippedExotics[0];

          if (hasLifeExotic(item) || hasLifeExotic(equippedExotic)) {
            deferred.resolve(true);
          } else {
            dequipItem(equippedExotic)
              .then(function(result) {
                deferred.resolve(true);
              })
              .catch(function(err) {
                deferred.reject(new Error('\'' + item.name + '\' cannot be equipped because the exotic in the ' + equippedExotic.type + ' slot cannot be unequipped.'));
              });
          }
        } else if (equippedExotics.length === 2) {
          // Assume that only one of the equipped items has 'The Life Exotic' perk
          if (hasLifeExotic(item)) {
            var exoticItemWithPerk = _.find(equippedExotics, hasLifeExotic(item));
            dequipItem(exoticItemWithPerk)
              .then(function(result) {
                deferred.resolve(true);
              })
              .catch(function(err) {
                deferred.reject(new Error('\'' + item.name + '\' cannot be equipped because the exotic in the ' + equippedExotic.type + ' slot cannot be unequipped.'));
              });
          } else {
            var equippedExoticWithoutPerk = _.find(equippedExotics, function(item) {
              return !hasLifeExotic(item);
            });

            dequipItem(equippedExoticWithoutPerk)
              .then(function(result) {
                deferred.resolve(true);
              })
              .catch(function(err) {
                deferred.reject(new Error('\'' + item.name + '\' cannot be equipped because the exotic in the ' + equippedExotic.type + ' slot cannot be unequipped.'));
              });
          }
        }

        return promise;
      }

      function canMoveToStore(item, store, triedFallback) {
        var stackAmount = 0;
        var slotsNeededForTransfer = 0;
        var predicate = store.isVault ? {
          sort: item.sort
        } : {
          type: item.type
        };

        var itemsInStore = _.where(store.items, predicate).length;

        if (item.maxStackSize > 1) {
          stackAmount = store.amountOfItem(item);
          slotsNeededForTransfer = Math.ceil((stackAmount + item.amount) / item.maxStackSize) - Math.ceil((stackAmount) / item.maxStackSize);
        } else {
          if (item.owner === store.id) {
            slotsNeededForTransfer = 0;
          } else {
            slotsNeededForTransfer = 1;
          }
        }

        var typeQtyCap = store.capacityForItem(item);

        if ((itemsInStore + slotsNeededForTransfer) <= typeQtyCap) {
          if ((item.owner !== store.id) && !store.isVault && (item.owner !== 'vault')) {
            // It's a guardian-to-guardian move, so we need to check
            // if there's space in the vault since the item has to go
            // through there.
            return canMoveToStore(item, dimStoreService.getVault());
          } else {
            return $q.resolve(true);
          }
        } else {
          // Not enough space!
          if (!triedFallback) {
            // Refresh the store
            return dimStoreService.reloadStores()
              .then(function(stores) {
                store = _.find(stores, { id: store.id });
                return canMoveToStore(item, store, true);
              });
          } else {
            return $q.reject(new Error('There are too many \'' + (store.isVault ? item.sort : item.type) + '\' items in the ' + (store.isVault ? 'vault' : 'guardian') + '.'));
          }
        }
      }

      function canEquip(item, store) {
        return $q(function(resolve, reject) {
          if (item.classTypeName === 'unknown' || item.classTypeName === store.class) {
            resolve(true);
          } else {
            reject(new Error("This can only be equipped on " + item.classTypeName + "s."));
          }
        });
      }

      function isValidTransfer(equip, store, item) {
        var promises = [];

        promises.push(canMoveToStore(item, store));

        if (equip) {
          promises.push(canEquip(item, store));
        }

        if ((item.tier === 'Exotic') && equip) {
          promises.push(canEquipExotic(item, store));
        }

        return $q.all(promises);
      }

      function moveTo(item, target, equip, amount) {
        var data = {
          item: item,
          source: dimStoreService.getStore(item.owner),
          target: target,
          isVault: {
            source: item.owner === 'vault',
            target: target.isVault
          }
        };

        var movePlan = isValidTransfer(equip, target, item)
          .then(function(targetStore) {
            // Replace the target store - isValidTransfer may have replaced it
            data.target = dimStoreService.getStore(target.id);
          })
          .then(function(a) {
            var promise = $q.when(item);

            if (!data.isVault.source && !data.isVault.target) { // Guardian to Guardian
              if (data.source.id != data.target.id) { // Different Guardian
                if (item.equipped) {
                  promise = promise.then(function() {
                    return dequipItem(item);
                  });
                }

                promise = promise
                  .then(function() {
                    return moveToVault(item, amount);
                  })
                  .then(function(item) {
                    return moveToStore(item, data.target, equip, amount);
                  });
              }

              if (equip) {
                promise = promise.then(function() {
                  if (!item.equipped) {
                    return equipItem(item);
                  } else {
                    return $q.when(item);
                  }
                });
              } else if (!equip) {
                promise = promise.then(function() {
                  if (item.equipped) {
                    return dequipItem(item);
                  } else {
                    return $q.when(item);
                  }
                });
              }
            } else if (data.isVault.source && data.isVault.target) { // Vault to Vault
              // Do Nothing.
              //console.log('vault-to-vault');
            } else if (data.isVault.source || data.isVault.target) { // Guardian to Vault
              if (item.equipped) {
                promise = promise.then(function() {
                  return dequipItem(item);
                });
              }

              promise = promise.then(function() {
                return moveToStore(item, data.target, equip, amount);
              });
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
        dimStoreService.getStores().forEach(function(store) {
          returnValue = returnValue.concat(store.items);
        });
        return returnValue;
      }

      function getItem(params, store) {
        var items = store ? store.items : getItems();
        return _.findWhere(items, { id: params.id, hash: params.hash });
      }

      return service;
    }
  })();
