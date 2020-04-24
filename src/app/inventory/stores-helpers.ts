/**
 * Generic helpers for working with whole stores (character inventories) or lists of stores.
 */

import { DimStore, DimVault } from './store-types';
import { DimItem } from './item-types';

/**
 * Get whichever character was last played.
 */
export const getCurrentStore = <Store extends DimStore>(stores: Store[]) =>
  stores.find((s) => s.current);

/**
 * Get a store from a list by ID.
 */
export const getStore = <Store extends DimStore>(stores: Store[], id: string) =>
  stores.find((s) => s.id === id);

/**
 * Get the Vault from a list of stores.
 */
export const getVault = (stores: DimStore[]): DimVault | undefined =>
  stores.find((s) => s.isVault) as DimVault | undefined;

/**
 * Get all items from all stores as a flat list.
 */
export const getAllItems = <Item extends DimItem, Store extends DimStore<Item>>(
  stores: Store[],
  filter?: (item: Item) => unknown
) => stores.flatMap((s) => (filter ? s.items.filter(filter) : s.items));

/**
 * Find an item among all stores that matches the params provided.
 */
export function getItemAcrossStores<Item extends DimItem, Store extends DimStore<Item>>(
  stores: Store[],
  params: {
    id?: string;
    hash?: number;
    notransfer?: boolean;
    amount?: number;
  }
) {
  const predicate = (i: DimItem) =>
    (params.id === undefined || params.id === i.id) &&
    (params.hash === undefined || params.hash === i.hash) &&
    (params.notransfer === undefined || params.notransfer === i.notransfer) &&
    (params.amount === undefined || params.amount === i.amount);

  for (const store of stores) {
    for (const item of store.items) {
      if (predicate(item)) {
        return item;
      }
    }
  }
  return undefined;
}

/** Get the bonus power from the Seasonal Artifact */
export function getArtifactBonus(store: DimStore) {
  const artifact = (store.buckets[1506418338] || []).find((i) => i.equipped);
  return artifact?.primStat?.value || 0;
}
