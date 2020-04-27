import _ from 'lodash';
import { reportException } from '../utils/exceptions';
import { queuedAction } from './action-queue';
import { DimStore } from './store-types';
import { DimItem } from './item-types';
import { dimItemService } from './item-move-service';
import { t } from 'app/i18next-t';
import { loadingTracker } from '../shell/loading-tracker';
import { showNotification } from '../notifications/notifications';
import { hideItemPopup } from 'app/item-popup/item-popup';
import { moveItemNotification } from './MoveNotifications';
import { PlatformErrorCodes } from 'bungie-api-ts/common';
import { getVault } from './stores-helpers';
import { updateCharacters } from './d2-stores';
import rxStore from '../store/store';

/**
 * Move the item to the specified store. Equip it if equip is true.
 */
export const moveItemTo = queuedAction(
  loadingTracker.trackPromise(
    async (item: DimItem, store: DimStore, equip: boolean, amount: number) => {
      hideItemPopup();
      const reload = item.equipped || equip;
      try {
        const movePromise = dimItemService.moveTo(item, store, equip, amount);

        if ($featureFlags.moveNotifications) {
          showNotification(moveItemNotification(item, store, movePromise));
        }

        item = await movePromise;

        if (reload) {
          // TODO: only reload the character that changed?
          // Refresh light levels and such
          await (rxStore.dispatch(updateCharacters()) as any);
        }

        item.updateManualMoveTimestamp();
      } catch (e) {
        if (!$featureFlags.moveNotifications) {
          showNotification({ type: 'error', title: item.name, body: e.message });
        }
        console.error('error moving item', item.name, 'to', store.name, e);
        // Some errors aren't worth reporting
        if (
          e.code !== 'wrong-level' &&
          e.code !== 'no-space' &&
          e.code !== PlatformErrorCodes.DestinyCannotPerformActionAtThisLocation
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
    const stores = storesService.getStores();
    const characters = stores.filter((s) => !s.isVault);
    const vault = getVault(stores)!;

    try {
      for (const s of characters) {
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
        const vault = getVault(storesService.getStores())!;
        const item = vault.items.find(
          (i) => i.hash === actionableItem.hash && !i.location.inPostmaster
        );
        if (item) {
          const amount = vault.amountOfItem(actionableItem);
          await dimItemService.moveTo(item, store, false, amount);
        }
      }
      const data = { name: actionableItem.name, store: store.name };
      const message = store.isVault ? t('ItemMove.ToVault', data) : t('ItemMove.ToStore', data);
      showNotification({ type: 'success', title: t('ItemMove.Consolidate', data), body: message });
    } catch (a) {
      showNotification({ type: 'error', title: actionableItem.name, body: a.message });
      console.error('error consolidating', actionableItem, a);
    }
  })
);

interface Move {
  source: DimStore;
  target: DimStore;
  amount: number;
}

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
    const deltas = _.zip(amounts, targets).map(([amount, target]) => target! - amount!);

    const vaultMoves: Move[] = [];
    const targetMoves: Move[] = [];
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
    async function applyMoves(moves: Move[]) {
      for (const move of moves) {
        const item = move.source.items.find((i) => i.hash === actionableItem.hash)!;
        await dimItemService.moveTo(item, move.target, false, move.amount);
      }
    }

    try {
      await applyMoves(vaultMoves);
      await applyMoves(targetMoves);
      showNotification({
        type: 'success',
        title: t('ItemMove.Distributed', { name: actionableItem.name })
      });
    } catch (a) {
      showNotification({ type: 'error', title: actionableItem.name, body: a.message });
      console.error('error distributing', actionableItem, a);
    }
  })
);
