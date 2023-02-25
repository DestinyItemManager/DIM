import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector } from 'app/inventory/selectors';
import { InGameLoadout } from 'app/loadout-drawer/loadout-types';
import { DestinyLoadoutItemComponent } from 'bungie-api-ts/destiny2';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

/**
 * Get all the real DimItems from ingame loadout items.
 *
 * TODO: These aren't ResolvedLoadoutItems because we don't know how D2 will handle missing items yet.
 */
export function getItemsFromInGameLoadout(
  loadoutItems: DestinyLoadoutItemComponent[],
  allItems: DimItem[]
): DimItem[] {
  const itemIds = new Set([...loadoutItems.map((li) => li.itemInstanceId)]);
  // TODO: apply socket overrides once we know what those are?
  return allItems.filter((i) => itemIds.has(i.id));
}

/**
 * Hook version of getItemsFromLoadouts
 */
export function useItemsFromInGameLoadout(loadout: InGameLoadout) {
  const allItems = useSelector(allItemsSelector);
  return useMemo(
    () => getItemsFromInGameLoadout(loadout.items, allItems),
    [loadout.items, allItems]
  );
}
