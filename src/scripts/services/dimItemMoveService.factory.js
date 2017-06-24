import angular from 'angular';
import _ from 'underscore';

angular.module('dimApp')
  .factory('dimItemMoveService', ItemMoveService);


function ItemMoveService($q, loadingTracker, toaster, dimStoreService, dimActionQueue, dimItemService, dimInfoService, $i18next) {
  const didYouKnowTemplate = `<p>${$i18next.t('DidYouKnow.DragAndDrop')}</p>
                              <p>${$i18next.t('DidYouKnow.TryNext')}</p>`;
  // Only show this once per session
  const didYouKnow = _.once(() => {
    dimInfoService.show('movebox', {
      title: $i18next.t('DidYouKnow'),
      body: didYouKnowTemplate,
      hide: $i18next.t('DidYouKnow.DontShowAgain')
    });
  });

  /**
   * Move the item to the specified store. Equip it if equip is true.
   */
  var moveItemTo = dimActionQueue.wrap(function moveItemTo(item, store, equip, amount, callback) {
    didYouKnow();

    var reload = item.equipped || equip;
    var promise = dimItemService.moveTo(item, store, equip, amount);

    if (reload) {
      // Refresh light levels and such
      promise = promise.then(function() {
        return dimStoreService.updateCharacters();
      });
    }

    promise = promise
      .catch(function(a) {
        toaster.pop('error', item.name, a.message);
        console.error('error moving item', item, 'to', store, a);
      });

    loadingTracker.addPromise(promise);
    (callback || angular.noop)();

    return promise;
  });


  var consolidate = dimActionQueue.wrap(function(actionableItem, store, callback) {
    var stores = _.filter(dimStoreService.getStores(), function(s) { return !s.isVault; });
    var vault = dimStoreService.getVault();

    var promise = $q.all(stores.map(function(s) {
      // First move everything into the vault
      var item = _.find(s.items, function(i) {
        return store.id !== i.owner && i.hash === actionableItem.hash && !i.location.inPostmaster;
      });
      if (item) {
        var amount = s.amountOfItem(actionableItem);
        return dimItemService.moveTo(item, vault, false, amount);
      }
      return undefined;
    }));

    // Then move from the vault to the character
    if (!store.isVault) {
      promise = promise.then(function() {
        var item = _.find(vault.items, function(i) {
          return i.hash === actionableItem.hash && !i.location.inPostmaster;
        });
        if (item) {
          var amount = vault.amountOfItem(actionableItem);
          return dimItemService.moveTo(item, store, false, amount);
        }
        return undefined;
      });
    }

    promise = promise.then(function() {
      var message;
      if (store.isVault) {
        message = $i18next.t('ItemMove.ToVault', { name: actionableItem.name });
      } else {
        message = $i18next.t('ItemMove.ToStore', { name: actionableItem.name, store: store.name });
      }
      toaster.pop('success', $i18next.t('ItemMove.Consolidate', { name: actionableItem.name }), message);
    })
    .catch(function(a) {
      toaster.pop('error', actionableItem.name, a.message);
      console.log('error consolidating', actionableItem, a);
    });

    loadingTracker.addPromise(promise);
    (callback || angular.noop)();

    return promise;
  });

  var distribute = dimActionQueue.wrap(function(actionableItem, store, callback) {
    // Sort vault to the end
    var stores = _.sortBy(dimStoreService.getStores(), function(s) { return s.id === 'vault' ? 2 : 1; });

    var total = 0;
    var amounts = stores.map(function(store) {
      var amount = store.amountOfItem(actionableItem);
      total += amount;
      return amount;
    });

    var numTargets = stores.length - 1; // exclude the vault
    var remainder = total % numTargets;
    var targets = stores.map(function(store, index) {
      if (index >= numTargets) {
        return 0; // don't want any in the vault
      }
      var result;
      if (remainder > 0) {
        result = Math.ceil(total / numTargets);
      } else {
        result = Math.floor(total / numTargets);
      }
      remainder--;
      return result;
    });
    var deltas = _.zip(amounts, targets).map(function(pair) {
      return pair[1] - pair[0];
    });

    var vaultMoves = [];
    var targetMoves = [];
    var vaultIndex = stores.length - 1;
    var vault = stores[vaultIndex];

    deltas.forEach(function(delta, index) {
      if (delta < 0 && index !== vaultIndex) {
        vaultMoves.push({
          source: stores[index],
          target: vault,
          amount: -delta
        });
      } else if (delta > 0) {
        targetMoves.push({
          source: vault,
          target: stores[index],
          amount: delta
        });
      }
    });

    // All moves to vault in parallel, then all moves to targets in parallel
    function applyMoves(moves) {
      return $q.all(moves.map(function(move) {
        var item = _.find(move.source.items, function(i) {
          return i.hash === actionableItem.hash;
        });
        return dimItemService.moveTo(item, move.target, false, move.amount);
      }));
    }

    var promise = applyMoves(vaultMoves).then(function() {
      return applyMoves(targetMoves);
    });

    promise = promise.then(function() {
      toaster.pop('success', $i18next.t('ItemMove.Distributed', { name: actionableItem.name }));
    })
    .catch(function(a) {
      toaster.pop('error', actionableItem.name, a.message);
      console.log('error distributing', actionableItem, a);
    });

    loadingTracker.addPromise(promise);
    (callback || angular.noop)();

    return promise;
  });

  return {
    consolidate: consolidate,
    distribute: distribute,
    moveItemTo: moveItemTo
  };
}
