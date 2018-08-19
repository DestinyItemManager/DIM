import * as _ from 'underscore';
import { reportException } from '../exceptions';
import { queuedAction } from './action-queue';
import { showInfoPopup } from '../shell/info-popup';
import { IPromise } from 'angular';
import { DimStore } from './store-types';
import { DimItem } from './item-types';
import { dimItemService } from './dimItemService.factory';
import { t } from 'i18next';
import { toaster, loadingTracker } from '../ngimport-more';
import { $q } from 'ngimport';

// Only show this once per session
const didYouKnow = _.once(() => {
  const didYouKnowTemplate = `<p>${t("DidYouKnow.DragAndDrop")}</p>
                              <p>${t("DidYouKnow.TryNext")}</p>`;
  showInfoPopup("movebox", {
    title: t("DidYouKnow.DidYouKnow"),
    body: didYouKnowTemplate,
    hide: t("DidYouKnow.DontShowAgain")
  });
});

/**
 * Move the item to the specified store. Equip it if equip is true.
 */
export const moveItemTo = queuedAction((item: DimItem, store: DimStore, equip: boolean, amount: number) => {
  didYouKnow();
  const reload = item.equipped || equip;
  let promise: IPromise<any> = dimItemService.moveTo(item, store, equip, amount);

  if (reload) {
    // Refresh light levels and such
    promise = promise.then((item: DimItem) => {
      return item.getStoresService()
        .updateCharacters()
        .then(() => item);
    });
  }

  promise = promise
    .then((item: DimItem) => item.updateManualMoveTimestamp())
    .catch((e) => {
      toaster.pop("error", item.name, e.message);
      console.error("error moving item", item.name, "to", store.name, e);
      // Some errors aren't worth reporting
      if (
        e.code !== "wrong-level" &&
        e.code !== "no-space" &&
        e.code !==
          1671 /* PlatformErrorCodes.DestinyCannotPerformActionAtThisLocation */
      ) {
        reportException("moveItem", e);
      }
    });

  loadingTracker.addPromise(promise);

  return promise;
});

/**
 * Consolidate all copies of a stackable item into a single stack in store.
 */
export const consolidate = queuedAction((actionableItem: DimItem, store: DimStore) => {
  const stores = _.filter(actionableItem.getStoresService().getStores(), (s) => {
    return !s.isVault;
  });
  const vault = actionableItem.getStoresService().getVault()!;

  let promise: IPromise<any> = $q.all(
    stores.map((s) => {
      // First move everything into the vault
      const item = _.find(s.items, (i) => {
        return (
          store.id !== i.owner &&
          i.hash === actionableItem.hash &&
          !i.location.inPostmaster
        );
      });
      if (item) {
        const amount = s.amountOfItem(actionableItem);
        return dimItemService.moveTo(item, vault, false, amount);
      }
      return undefined;
    })
  );

  // Then move from the vault to the character
  if (!store.isVault) {
    promise = promise.then((): IPromise<any> | undefined => {
      const item = vault.items.find((i) => i.hash === actionableItem.hash && !i.location.inPostmaster);
      if (item) {
        const amount = vault.amountOfItem(actionableItem);
        return dimItemService.moveTo(item, store, false, amount);
      }
      return undefined;
    });
  }

  promise = promise
    .then(() => {
      let message;
      if (store.isVault) {
        message = t("ItemMove.ToVault", {
          name: actionableItem.name
        });
      } else {
        message = t("ItemMove.ToStore", {
          name: actionableItem.name,
          store: store.name
        });
      }
      toaster.pop(
        "success",
        t("ItemMove.Consolidate", { name: actionableItem.name }),
        message
      );
    })
    .catch((a) => {
      toaster.pop("error", actionableItem.name, a.message);
      console.log("error consolidating", actionableItem, a);
    });

  loadingTracker.addPromise(promise);

  return promise;
});

/**
 * Distribute a stackable item evently across characters.
 */
export const distribute = queuedAction((actionableItem: DimItem) => {
  // Sort vault to the end
  const stores = _.sortBy(actionableItem.getStoresService().getStores(), (s) => {
    return s.id === "vault" ? 2 : 1;
  });

  let total = 0;
  const amounts = stores.map((store) => {
    const amount = store.amountOfItem(actionableItem);
    total += amount;
    return amount;
  });

  const numTargets = stores.length - 1; // exclude the vault
  let remainder = total % numTargets;
  const targets = stores.map((_store, index) => {
    if (index >= numTargets) {
      return 0; // don't want any in the vault
    }
    const result = remainder > 0 ? Math.ceil(total / numTargets) : Math.floor(total / numTargets);
    remainder--;
    return result;
  });
  const deltas = _.zip(amounts, targets).map((pair) => {
    return pair[1] - pair[0];
  });

  const vaultMoves: {
    source: DimStore;
    target: DimStore;
    amount: number;
  }[] = [];
  const targetMoves: {
    source: DimStore;
    target: DimStore;
    amount: number;
  }[] = [];
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
    return $q.all(
      moves.map((move) => {
        const item = move.source.items.find((i) => i.hash === actionableItem.hash);
        return dimItemService.moveTo(item, move.target, false, move.amount);
      })
    );
  }

  let promise: IPromise<any> = applyMoves(vaultMoves).then(() => {
    return applyMoves(targetMoves);
  });

  promise = promise
    .then(() => {
      toaster.pop(
        "success",
        t("ItemMove.Distributed", { name: actionableItem.name })
      );
    })
    .catch((a) => {
      toaster.pop("error", actionableItem.name, a.message);
      console.log("error distributing", actionableItem, a);
    });

  loadingTracker.addPromise(promise);

  return promise;
});
