import * as _ from 'lodash';
import { reportException } from '../exceptions';
import { queuedAction } from './action-queue';
import { DimStore } from './store-types';
import { DimItem } from './item-types';
import { dimItemService } from './dimItemService.factory';
import { t } from 'i18next';
import { toaster } from '../ngimport-more';
import { loadingTracker } from '../shell/loading-tracker';

/**
 * Move the item to the specified store. Equip it if equip is true.
 */
export const moveItemTo = queuedAction(
  loadingTracker.trackPromise(
    async (item: DimItem, store: DimStore, equip: boolean, amount: number) => {
      const reload = item.equipped || equip;
      try {
        item = await dimItemService.moveTo(item, store, equip, amount);

        if (reload) {
          // Refresh light levels and such
          await item.getStoresService().updateCharacters();
        }

        item.updateManualMoveTimestamp();
      } catch (e) {
        toaster.pop('error', item.name, e.message);
        console.error('error moving item', item.name, 'to', store.name, e);
        // Some errors aren't worth reporting
        if (
          e.code !== 'wrong-level' &&
          e.code !== 'no-space' &&
          e.code !== 1671 /* PlatformErrorCodes.DestinyCannotPerformActionAtThisLocation */
        ) {
          reportException('moveItem', e);
        }
      }
    }
  )
);

/**
 * Consolidate all copies of a stackable item into a single stack in store.
 */
export const consolidate = queuedAction(
  loadingTracker.trackPromise(async (actionableItem: DimItem, store: DimStore) => {
    const storesService = actionableItem.getStoresService();
    const stores = storesService.getStores().filter((s) => !s.isVault);
    const vault = storesService.getVault()!;

    try {
      for (const s of stores) {
        // First move everything into the vault
        const item = s.items.find(
          (i) => store.id !== i.owner && i.hash === actionableItem.hash && !i.location.inPostmaster
        );
        if (item) {
          const amount = s.amountOfItem(actionableItem);
          await dimItemService.moveTo(item, vault, false, amount);
        }
      }

      // Then move from the vault to the character
      if (!store.isVault) {
        const vault = storesService.getVault()!;
        const item = vault.items.find(
          (i) => i.hash === actionableItem.hash && !i.location.inPostmaster
        );
        if (item) {
          const amount = vault.amountOfItem(actionableItem);
          await dimItemService.moveTo(item, store, false, amount);
        }
      }

      const message = t(store.isVault ? 'ItemMove.ToVault' : 'ItemMove.ToStore', {
        name: actionableItem.name
      });
      toaster.pop('success', t('ItemMove.Consolidate', { name: actionableItem.name }), message);
    } catch (a) {
      toaster.pop('error', actionableItem.name, a.message);
      console.error('error consolidating', actionableItem, a);
    }
  })
);

/**
 * Distribute a stackable item evently across characters.
 */
export const distribute = queuedAction(
  loadingTracker.trackPromise(async (actionableItem: DimItem) => {
    // Sort vault to the end
    const stores = _.sortBy(actionableItem.getStoresService().getStores(), (s) =>
      s.id === 'vault' ? 2 : 1
    );

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
      return pair[1]! - pair[0]!;
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
    async function applyMoves(moves) {
      for (const move of moves) {
        const item = move.source.items.find((i) => i.hash === actionableItem.hash);
        await dimItemService.moveTo(item, move.target, false, move.amount);
      }
    }

    try {
      await applyMoves(vaultMoves);
      await applyMoves(targetMoves);
      toaster.pop('success', t('ItemMove.Distributed', { name: actionableItem.name }));
    } catch (a) {
      toaster.pop('error', actionableItem.name, a.message);
      console.log('error distributing', actionableItem, a);
    }
  })
);
