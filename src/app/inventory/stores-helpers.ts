/**
 * Generic helpers for working with whole stores (character inventories) or lists of stores.
 */

import { DimStore, DimVault } from './store-types';
import { DimItem } from './item-types';

/**
 * Get whichever character was last played.
 */
export const getCurrentStore = (stores: DimStore[]) => stores.find((s) => s.current);

/**
 * Get a store from a list by ID.
 */
export const getStore = (stores: DimStore[], id: string) => stores.find((s) => s.id === id);

/**
 * Get the Vault from a list of stores.
 */
export const getVault = (stores: DimStore[]) =>
  stores.find((s) => s.isVault) as DimVault | undefined;

/**
 * Get all items from all stores as a flat list.
 */
export const getAllItems = (stores: DimStore[], filter?: (item: DimItem) => unknown) =>
  stores.flatMap((s) => (filter ? s.items.filter(filter) : s.items));

/**
 * Find an item among all stores that matches the params provided.
 */
export function getItemAcrossStores(
  stores: DimStore[],
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
