(function() {
  'use strict';

  angular.module('dimApp')
    .factory('dimItemService', ItemService);

  ItemService.$inject = ['dimStoreService', 'dimBungieService', 'dimCategory', '$q'];

  function ItemService(dimStoreService, dimBungieService, dimCategory, $q) {
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
      equipItems: equipItems,
      setItemState: setItemState
    };

    function setItemState(item, store, lockState, type) {
      return dimBungieService.setItemState(item, store, lockState, type)
        .then(function() {
          return lockState;
        });
    }


    // Returns the new or updated item (it may create a new item!)
    function updateItemModel(item, source, target, equip, amount) {
      // Refresh all the items - they may have been reloaded!
      source = dimStoreService.getStore(source.id);
      target = dimStoreService.getStore(target.id);
      item = getItem(item);

      // If we've moved to a new place
      if (source.id !== target.id) {
        // We handle moving stackable and nonstackable items almost exactly the same!
        var stackable = item.maxStackSize >
            1;
        // Items to be decremented
        var sourceItems = stackable
              ? _.sortBy(_.select(source.items, function(i) {
                return i.hash === item.hash &&
                  i.id === item.id &&
                  !i.notransfer;
              }), 'amount') : [item];
        // Items to be incremented. There's really only ever at most one of these, but
        // it's easier to deal with as a list.
        var targetItems = stackable
              ? _.sortBy(_.select(target.items, function(i) {
                return i.hash === item.hash &&
                  i.id === item.id &&
                  // Don't consider full stacks as targets
                  i.amount !== i.maxStackSize &&
                  !i.notransfer;
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
            if (source.removeItem(sourceItem)) {
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
            target.addItem(targetItem);
          }

          var amountToAdd = Math.min(addAmount, targetItem.maxStackSize - targetItem.amount);
          targetItem.amount += amountToAdd;
          addAmount -= amountToAdd;
        }
        item = targetItem; // The item we're operating on switches to the last target
      }

      if (equip) {
        var equipped = _.find(target.buckets[item.location.id], { equipped: true });
        if (equipped) {
          equipped.equipped = false;
        }
        item.equipped = true;
      }

      return item;
    }

    function getSimilarItem(item, exclusions) {
      var target = dimStoreService.getStore(item.owner);
      var sortedStores = _.sortBy(dimStoreService.getStores(), function(store) {
        if (target.id === store.id) {
          return 0;
        } else if (store.isVault) {
          return 1;
        } else {
          return 2;
        }
      });

      var result = null;
      sortedStores.find(function(store) {
        result = searchForSimilarItem(item, store, exclusions, target);
        return result !== null;
      });

      return result;
    }

    // Find an item in store like "item", excluding the exclusions, to be equipped
    // on target.
    function searchForSimilarItem(item, store, exclusions, target) {
      exclusions = exclusions || [];

      var candidates = _.filter(store.items, function(i) {
        return i.canBeEquippedBy(target) &&
          i.location.id === item.location.id &&
          !i.equipped &&
          // Not the same item
          i.id !== item.id &&
          // Not on the exclusion list
          !_.any(exclusions, { id: i.id, hash: i.hash });
      });

      if (!candidates.length) {
        return null;
      }

      var result = _.max(candidates, function(i) {
        var value = {
          Legendary: 4,
          Rare: 3,
          Uncommon: 2,
          Common: 1,
          Exotic: 0
        }[i.tier];
        if (i.primStat) {
          value += i.primStat.value / 1000.0;
        }
        return value;
      });

      if (result && result.isExotic) {
        var prefix = _.filter(store.items, function(i) {
          return i.equipped &&
            i.bucket.sort === item.bucket.sort &&
            i.isExotic;
        });

        if (prefix.length === 0) {
          return result;
        } else {
          return null;
        }
      }

      return result || null;
    }

    // Bulk equip items. Only use for multiple equips at once.
    function equipItems(store, items) {
      // Check for (and move aside) exotics
      const extraItemsToEquip = _.compact(items.map((i) => {
        if (i.isExotic) {
          const otherExotic = getOtherExoticThatNeedsDequipping(i, store);
          // If we aren't already equipping into that slot...
          if (otherExotic && !_.find(items, { type: otherExotic.type })) {
            const similarItem = getSimilarItem(otherExotic);
            if (!similarItem) {
              return $q.reject(new Error('Cannot find another item to equip in order to dequip ' + otherExotic.name));
            }
            const target = dimStoreService.getStore(similarItem.owner);

            if (store.id === target.id) {
              return similarItem;
            } else {
              // If we need to get the similar item from elsewhere, do that first
              return moveTo(similarItem, store, true).then(() => similarItem);
            }
          }
        }
        return undefined;
      }));

      return $q.all(extraItemsToEquip).then((extraItems) => {
        items = items.concat(extraItems);

        if (items.length === 1) {
          return equipItem(items[0]);
        }
        return dimBungieService.equipItems(store, items)
          .then(function(equippedItems) {
            return equippedItems.map(function(i) {
              return updateItemModel(i, store, store, true);
            });
          });
      });
    }

    function equipItem(item) {
      return dimBungieService.equip(item)
        .then(function() {
          const store = dimStoreService.getStore(item.owner);
          return updateItemModel(item, store, store, true);
        });
    }

    function dequipItem(item) {
      const similarItem = getSimilarItem(item);
      if (!similarItem) {
        return $q.reject(new Error('Cannot find another item to equip in order to dequip ' + item.name));
      }
      const source = dimStoreService.getStore(item.owner);
      const target = dimStoreService.getStore(similarItem.owner);

      let p = $q.when();
      if (source.id !== target.id) {
        p = moveTo(similarItem, source, true);
      }

      return p.then(() => equipItem(similarItem));
    }

    function moveToVault(item, amount) {
      return moveToStore(item, dimStoreService.getVault(), false, amount);
    }

    function moveToStore(item, store, equip, amount) {
      return dimBungieService.transfer(item, store, amount)
        .then(function() {
          var source = dimStoreService.getStore(item.owner);
          var newItem = updateItemModel(item, source, store, false, amount);
          if ((newItem.owner !== 'vault') && equip) {
            return equipItem(newItem);
          } else {
            return newItem;
          }
        });
    }

    /**
     * This returns a promise for true if the exotic can be
     * equipped. In the process it will move aside any existing exotic
     * that would conflict. If it could not move aside, this
     * rejects. It never returns false.
     */
    function canEquipExotic(item, store) {
      const otherExotic = getOtherExoticThatNeedsDequipping(item, store);
      if (otherExotic) {
        return dequipItem(otherExotic)
          .then(() => true)
          .catch(function() {
            throw new Error('\'' + item.name + '\' cannot be equipped because the exotic in the ' + otherExotic.type + ' slot cannot be unequipped.');
          });
      } else {
        return $q.resolve(true);
      }
    }

    /**
     * Identify the other exotic, if any, that needs to be moved
     * aside. This is not a promise, it returns immediately.
     */
    function getOtherExoticThatNeedsDequipping(item, store) {
      const equippedExotics = _.filter(store.items, (i) => {
        return (i.equipped &&
                i.location.id !== item.location.id &&
                i.location.sort === item.location.sort &&
                i.isExotic);
      });

      if (equippedExotics.length === 0) {
        return null;
      } else if (equippedExotics.length === 1) {
        const equippedExotic = equippedExotics[0];

        if (item.hasLifeExotic() || equippedExotic.hasLifeExotic()) {
          return null;
        } else {
          return equippedExotic;
        }
      } else if (equippedExotics.length === 2) {
        // Assume that only one of the equipped items has 'The Life Exotic' perk
        const hasLifeExotic = item.hasLifeExotic();
        return _.find(equippedExotics, (i) => {
          return hasLifeExotic ? i.hasLifeExotic() : !i.hasLifeExotic();
        });
      } else {
        throw new Error("We don't know how you got more than 2 equipped exotics!");
      }
    }

    function chooseMoveAsideItem(store, item, moveContext) {
      var moveAsideCandidates;
      var stores = dimStoreService.getStores();
      if (store.isVault && !_.any(stores, function(s) { return moveContext.spaceLeft(s, item); })) {
        // If it's the vault, we can get rid of anything in the same sort category.
        // Pick whatever we have the most space for on some guardian.
        var bestType = _.max(dimCategory[item.bucket.sort], function(type) {
          return _.max(stores.map(function(s) {
            if (s.id === store.id) {
              return 0;
            }
            var vaultItem = _.find(store.items, { type: type });
            return vaultItem ? moveContext.spaceLeft(s, vaultItem) : 0;
          }));
        });

        moveAsideCandidates = _.filter(store.items, { type: bestType });
      } else {
        moveAsideCandidates = _.filter(store.items, function(i) {
          return i.location.id === item.location.id;
        });
      }

      // Don't move that which cannot be moved
      moveAsideCandidates = _.reject(moveAsideCandidates, function(i) {
        return i.notransfer || _.any(moveContext.excludes, { id: i.id, hash: i.hash });
      });

      if (moveAsideCandidates.length === 0) {
        throw new Error("There's nothing we can move aside to make room for " + item.name);
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
        // Prefer things this character can use
        if (!store.isVault && i.canBeEquippedBy(store)) {
          value += 5;
        }
        // And low-stat
        if (i.primStat) {
          value += i.primStat.value / 1000.0;
        }
        return value;
      });

      return moveAsideItem;
    }

    function chooseMoveAsideTarget(store, moveAsideItem, moveContext) {
      var target;
      var stores = dimStoreService.getStores();
      if (store.isVault) {
        // Find the character with the most space
        target = _.max(_.reject(stores, 'isVault'), function(s) { return moveContext.spaceLeft(s, moveAsideItem); });
      } else {
        var vault = dimStoreService.getVault();
        // Prefer moving to the vault
        if (moveContext.spaceLeft(vault, moveAsideItem) > 0) {
          target = vault;
        } else {
          target = _.max(stores, function(s) { return moveContext.spaceLeft(s, moveAsideItem); });
        }
        if (moveContext.spaceLeft(target, moveAsideItem) <= 0) {
          target = vault;
        }
      }
      return target === -Infinity ? undefined : target;
    }

    function slotsNeededForTransferTo(store, item) {
      var slotsNeededForTransfer = 0;

      if (item.maxStackSize > 1) {
        var stackAmount = store.amountOfItem(item);
        slotsNeededForTransfer = Math.ceil((stackAmount + item.amount) / item.maxStackSize) - Math.ceil((stackAmount) / item.maxStackSize);
      } else {
        slotsNeededForTransfer = 1;
      }

      return slotsNeededForTransfer;
    }

    // Is there anough space to move the given item into store? This will refresh
    // data and/or move items aside in an attempt to make a move possible.
    function canMoveToStore(item, store, triedFallback, excludes) {
      if (item.owner === store.id) {
        return $q.resolve(true);
      }

      var stores = dimStoreService.getStores();
      // How much space will be needed in the various stores in order to make the transfer?
      var storeReservations = {};
      stores.forEach(function(s) {
        storeReservations[s.id] = (s.id === store.id ? slotsNeededForTransferTo(s, item) : 0);
      });
      // guardian-to-guardian transfer will also need space in the vault
      if (item.owner !== 'vault' && !store.isVault) {
        storeReservations.vault = slotsNeededForTransferTo(dimStoreService.getVault(), item);
      }

      // How many moves are needed from each
      var movesNeeded = {};
      dimStoreService.getStores().forEach(function(s) {
        movesNeeded[s.id] = Math.max(0, storeReservations[s.id] - s.spaceLeftForItem(item));
      });

      if (!_.any(movesNeeded)) {
        return $q.resolve(true);
      } else if (store.isVault || triedFallback) {
        // Move aside one of the items that's in the way
        var moveContext = {
          reservations: storeReservations,
          originalItemType: item.type,
          excludes: excludes || [],
          spaceLeft: function(s, i) {
            var left = s.spaceLeftForItem(i);
            if (i.type === this.originalItemType) {
              left = left - this.reservations[s.id];
            }
            return Math.max(0, left);
          }
        };

        // Move starting from the vault (which is always last)
        var move = _.pairs(movesNeeded)
              .reverse()
              .find(function(p) { return p[1] > 0; });
        var source = dimStoreService.getStore(move[0]);
        var moveAsideItem = chooseMoveAsideItem(source, item, moveContext);
        var target = chooseMoveAsideTarget(source, moveAsideItem, moveContext);

        if (!target || (!target.isVault && target.spaceLeftForItem(moveAsideItem) <= 0)) {
          return $q.reject(new Error('There are too many \'' + (target.isVault ? moveAsideItem.bucket.sort : moveAsideItem.type) + '\' items in the ' + target.name + '.'));
        } else {
          // Make one move and start over!
          return moveTo(moveAsideItem, target, false, moveAsideItem.amount, excludes).then(function() {
            return canMoveToStore(item, store, triedFallback, excludes);
          });
        }
      } else {
        // Refresh the stores to see if anything has changed
        var reloadPromise = throttledReloadStores() || $q.when(dimStoreService.getStores());
        return reloadPromise.then(function(stores) {
          store = _.find(stores, { id: store.id });
          return canMoveToStore(item, store, true, excludes);
        });
      }
    }

    function canEquip(item, store) {
      return $q(function(resolve, reject) {
        if (item.canBeEquippedBy(store)) {
          resolve(true);
        } else if (item.classified) {
          reject(new Error("This item is classified and can not be transferred at this time."));
        } else {
          reject(new Error("This can only be equipped on " + (item.classTypeName === 'unknown' ? 'character' : item.classTypeName) + "s at or above level " + item.equipRequiredLevel + "."));
        }
      });
    }

    function isValidTransfer(equip, store, item, excludes) {
      var promises = [];

      promises.push(canMoveToStore(item, store, false, excludes));

      if (equip) {
        promises.push(canEquip(item, store));
      }

      if ((item.isExotic) && equip) {
        promises.push(canEquipExotic(item, store));
      }

      return $q.all(promises);
    }

    function moveTo(item, target, equip, amount, excludes) {
      var data = {
        item: item,
        source: dimStoreService.getStore(item.owner),
        target: target,
        isVault: {
          source: item.owner === 'vault',
          target: target.isVault
        }
      };

      var movePlan = isValidTransfer(equip, target, item, excludes)
            .then(function() {
              // Replace the target store - isValidTransfer may have replaced it
              data.target = dimStoreService.getStore(target.id);
            })
            .then(function() {
              var promise = $q.when(item);

              if (!data.isVault.source && !data.isVault.target) { // Guardian to Guardian
                if (data.source.id !== data.target.id) { // Different Guardian
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
                    if (item.equipped) {
                      return $q.when(item);
                    } else {
                      return equipItem(item);
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
      return _.findWhere(items, _.pick(params, 'id', 'hash', 'notransfer'));
    }
  }
})();
