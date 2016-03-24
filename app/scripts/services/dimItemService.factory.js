  (function() {
    'use strict';

    angular.module('dimApp')
      .factory('dimItemService', ItemService);

    ItemService.$inject = ['dimStoreService', 'dimBungieService', 'dimItemTier', 'dimCategory', '$q'];

    function ItemService(dimStoreService, dimBungieService, dimItemTier, dimCategory, $q) {
      // We'll reload the stores to check if things have been
      // thrown away or moved and we just don't have up to date info. But let's
      // throttle these calls so we don't just keep refreshing over and over.
      // This needs to be up here because of how we return the service object.
      var throttledReloadStores = _.throttle(function() {
        return dimStoreService.reloadStores();
      }, 10000, { trailing: false });

      return {
        getSimilarItem: getSimilarItem,
        getItem: getItem,
        getItems: getItems,
        moveTo: moveTo,
        makeRoomForItem: makeRoomForItem,
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

      // Make room to move this item into a full store. This assumes you've already
      // checked to see that the store is full. excludes are an optional list
      // of which items we are not allowed to move. storeReservations is for recursion.
      function makeRoomForItem(item, store, excludes, storeReservations) {
        var stores = dimStoreService.getStores();

        if (!excludes) {
          excludes = [];
        }

        // Reserve enough space for the transfer to succeed, even if we recurse
        if (!storeReservations) {
          storeReservations = {};
          stores.forEach(function(s) {
            storeReservations[s.id] = (s.id === store.id ? 1 : 0);
          });
          // guardian-to-guardian transfer will need space in the vault
          if (item.owner !== 'vault' && !store.isVault) {
            storeReservations['vault'] = 1;
          }
        }

        function spaceLeft(s, i) {
          return Math.max(s.spaceLeftForItem(i) - storeReservations[s.id], 0);
        }

        var moveAsideCandidates;
        if (!moveAsideCandidates) {
          if (store.isVault && !_.any(stores, function(s) { return spaceLeft(s, item); })) {
            // If it's the vault, we can get rid of anything in the same sort category.
            // Pick whatever we have the most space for on some guardian.
            var bestType = _.max(dimCategory[item.sort], function(type) {
              var res = _.max(stores.map(function(s) {
                if (s.id == store.id || !_.any(store.items, { type: type })) {
                  return 0;
                } else {
                  return spaceLeft(s, { type: type });
                }
              }));
              return res;
            });

            moveAsideCandidates = _.filter(store.items, { type: bestType });
          } else {
            moveAsideCandidates = _.filter(store.items, { type: item.type });
          }
        }

        // Don't move that which cannot be moved
        moveAsideCandidates = _.reject(moveAsideCandidates, function(i) {
          return i.notransfer || _.any(excludes, { id: i.id, hash: i.hash });
        });

        if (moveAsideCandidates.length === 0) {
          return $q.reject(new Error("There's nothing we can move aside to make room for " + item.name));
        }

        // For the vault, try to move the highest-value item to a character. For a
        // character, move the lowest-value item to the vault (or another character).
        // We move the highest-value item out of the vault because it seems better
        // not to gunk up characters with garbage or year 1 stuff.
        var moveAsideItem = _[store.isVault ? 'max' : 'min'](moveAsideCandidates, function(i) {
          // Lower means more likely to get moved away
          // Prefer not moving the equipped item
          var value = i.equipped ? 10 : 0;
          // Prefer moving lower-tier
          value += {
            Common: 0,
            Uncommon: 1,
            Rare: 2,
            Legendary: 3,
            Exotic: 4
          }[i.tier];
          // And low-stat
          if (i.primStat) {
            value += i.primStat.value / 1000.0;
          }
          return value;
        });

        var target;
        if (store.isVault) {
          // Find the character with the most space
          target = _.max(stores, function(s) { return spaceLeft(s, moveAsideItem); });
        } else {
          var vault = dimStoreService.getVault();
          // Prefer moving to the vault
          if (spaceLeft(vault, moveAsideItem) > 0) {
            target = vault;
          } else {
            target = _.max(stores, function(s) { return spaceLeft(s, moveAsideItem); });
          }
        }

        if (spaceLeft(target, moveAsideItem) <= 0) {
          var failure = $q.reject(new Error('There are too many \'' + (store.isVault ? item.sort : item.type) + '\' items in the ' + (store.isVault ? 'vault' : 'guardian') + '.'));
          if (!store.isVault) {
            return makeRoomForItem(moveAsideItem, dimStoreService.getVault(), excludes, storeReservations)
              .then(function() {
                return makeRoomForItem(item, store, excludes, storeReservations);
              })
              .catch(function() { return failure; });
          } else {
            return failure;
          }
        } else {
          return moveTo(moveAsideItem, target);
        }
      }

      // Is there anough space to move the given item into store? This will refresh
      // data and/or move items aside in an attempt to make a move possible.
      function canMoveToStore(item, store, triedFallback) {
        if (item.owner === store.id) {
          return $q.resolve(true);
        }

        var slotsNeededForTransfer = 0;

        if (item.maxStackSize > 1) {
          var stackAmount = store.amountOfItem(item);
          slotsNeededForTransfer = Math.ceil((stackAmount + item.amount) / item.maxStackSize) - Math.ceil((stackAmount) / item.maxStackSize);
        } else {
          if (item.owner === store.id) {
            slotsNeededForTransfer = 0;
          } else {
            slotsNeededForTransfer = 1;
          }
        }

        if (store.spaceLeftForItem(item) >= slotsNeededForTransfer) {
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
          if (store.isVault || triedFallback) {
            return makeRoomForItem(item, store).then(function() {
              return canMoveToStore(item, store);
            });
          } else {
            // Refresh the store
            var reloadPromise = throttledReloadStores();
            if (!reloadPromise) {
              reloadPromise = $q.when(dimStoreService.getStores());
            }
            return reloadPromise.then(function(stores) {
              store = _.find(stores, { id: store.id });
              return canMoveToStore(item, store, true);
            });
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
