import { DimItem } from 'app/inventory/item-types';

/**
 * A Perks can be populated with a bunch of items, and can then answer questions
 * such as:
 * 1. Are there any items that have (at least) all the same perks (in the same
 *    columns) as the input item? This covers both exactly-identical perk sets,
 *    as well as items that are perk-subsets of the input item (e.g. there may
 *    be another item that has all the same perks, plus some extra options in
 *    some columns).
 */
export class PerksSet {
  // A map from item ID to a list of columns, each of which has a set of perkHashes
  mapping = new Map<string, Set<number>[]>();

  insert(item: DimItem) {
    this.mapping.set(item.id, makePerksSet(item));
  }

  hasPerkDupes(item: DimItem) {
    const perksSet = makePerksSet(item);

    for (const [id, set] of this.mapping) {
      if (id === item.id) {
        continue;
      }

      if (perksSet.every((column) => set.some((otherColumn) => column.isSubsetOf(otherColumn)))) {
        return true;
      }
    }
    return false;
  }
}

function makePerksSet(item: DimItem) {
  return item
    .sockets!.allSockets.filter((s) => s.isPerk && s.socketDefinition.defaultVisible)
    .map((s) => new Set(s.plugOptions.map((p) => p.plugDef.hash)));
}
