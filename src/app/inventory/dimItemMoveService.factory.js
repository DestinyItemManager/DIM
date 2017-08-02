import angular from 'angular';
import _ from 'underscore';

export function ItemMoveService($q, loadingTracker, toaster, dimStoreService, dimActionQueue, dimItemService, dimInfoService, $i18next) {
  'ngInject';

  const didYouKnowTemplate = `<p>${$i18next.t('DidYouKnow.DragAndDrop')}</p>
                              <p>${$i18next.t('DidYouKnow.TryNext')}</p>`;
  // Only show this once per session
  const didYouKnow = _.once(() => {
    dimInfoService.show('movebox', {
      title: $i18next.t('DidYouKnow.DidYouKnow'),
      body: didYouKnowTemplate,
      hide: $i18next.t('DidYouKnow.DontShowAgain')
    });
  });

  /**
   * Move the item to the specified store. Equip it if equip is true.
   */
  const moveItemTo = dimActionQueue.wrap((item, store, equip, amount, callback) => {
    didYouKnow();

    const reload = item.equipped || equip;
    let promise = dimItemService.moveTo(item, store, equip, amount);

    if (reload) {
      // Refresh light levels and such
      promise = promise.then(() => {
        return dimStoreService.updateCharacters();
      });
    }

    promise = promise
      .catch((a) => {
        toaster.pop('error', item.name, a.message);
        console.error('error moving item', item, 'to', store, a);
      });

    loadingTracker.addPromise(promise);
    (callback || angular.noop)();

    return promise;
  });

  const consolidate = dimActionQueue.wrap((actionableItem, store, callback) => {
    const stores = _.filter(dimStoreService.getStores(), (s) => { return !s.isVault; });
    const vault = dimStoreService.getVault();

    let promise = $q.all(stores.map((s) => {
      // First move everything into the vault
      const item = _.find(s.items, (i) => {
        return store.id !== i.owner && i.hash === actionableItem.hash && !i.location.inPostmaster;
      });
      if (item) {
        const amount = s.amountOfItem(actionableItem);
        return dimItemService.moveTo(item, vault, false, amount);
      }
      return undefined;
    }));

    // Then move from the vault to the character
    if (!store.isVault) {
      promise = promise.then(() => {
        const item = _.find(vault.items, (i) => {
          return i.hash === actionableItem.hash && !i.location.inPostmaster;
        });
        if (item) {
          const amount = vault.amountOfItem(actionableItem);
          return dimItemService.moveTo(item, store, false, amount);
        }
        return undefined;
      });
    }

    promise = promise.then(() => {
      let message;
      if (store.isVault) {
        message = $i18next.t('ItemMove.ToVault', { name: actionableItem.name });
      } else {
        message = $i18next.t('ItemMove.ToStore', { name: actionableItem.name, store: store.name });
      }
      toaster.pop('success', $i18next.t('ItemMove.Consolidate', { name: actionableItem.name }), message);
    })
    .catch((a) => {
      toaster.pop('error', actionableItem.name, a.message);
      console.log('error consolidating', actionableItem, a);
    });

    loadingTracker.addPromise(promise);
    (callback || angular.noop)();

    return promise;
  });

  const distribute = dimActionQueue.wrap((actionableItem, store, callback) => {
    // Sort vault to the end
    const stores = _.sortBy(dimStoreService.getStores(), (s) => { return s.id === 'vault' ? 2 : 1; });

    let total = 0;
    const amounts = stores.map((store) => {
      const amount = store.amountOfItem(actionableItem);
      total += amount;
      return amount;
    });

    const numTargets = stores.length - 1; // exclude the vault
    let remainder = total % numTargets;
    const targets = stores.map((store, index) => {
      if (index >= numTargets) {
        return 0; // don't want any in the vault
      }
      let result;
      if (remainder > 0) {
        result = Math.ceil(total / numTargets);
      } else {
        result = Math.floor(total / numTargets);
      }
      remainder--;
      return result;
    });
    const deltas = _.zip(amounts, targets).map((pair) => {
      return pair[1] - pair[0];
    });

    const vaultMoves = [];
    const targetMoves = [];
    const vaultIndex = stores.length - 1;
    const vault = stores[vaultIndex];

    deltas.forEach((delta, index) => {
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
      return $q.all(moves.map((move) => {
        const item = _.find(move.source.items, (i) => {
          return i.hash === actionableItem.hash;
        });
        return dimItemService.moveTo(item, move.target, false, move.amount);
      }));
    }

    let promise = applyMoves(vaultMoves).then(() => {
      return applyMoves(targetMoves);
    });

    promise = promise.then(() => {
      toaster.pop('success', $i18next.t('ItemMove.Distributed', { name: actionableItem.name }));
    })
    .catch((a) => {
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
