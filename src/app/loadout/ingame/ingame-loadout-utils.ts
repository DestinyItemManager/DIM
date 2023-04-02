import { DimItem } from 'app/inventory/item-types';
import { allItemsSelector, createItemContextSelector } from 'app/inventory/selectors';
import { ItemCreationContext } from 'app/inventory/store/d2-item-factory';
import { applySocketOverrides } from 'app/inventory/store/override-sockets';
import { convertInGameLoadoutPlugItemHashesToSocketOverrides } from 'app/loadout-drawer/loadout-type-converters';
import { InGameLoadout } from 'app/loadout-drawer/loadout-types';
import { potentialLoadoutItemsByItemId } from 'app/loadout-drawer/loadout-utils';
import { DestinyLoadoutItemComponent } from 'bungie-api-ts/destiny2';
import _ from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

/**
 * Get all the real DimItems from ingame loadout items.
 *
 * TODO: These aren't ResolvedLoadoutItems because we don't know how D2 will handle missing items yet.
 */
export function getItemsFromInGameLoadout(
  itemCreationContext: ItemCreationContext,
  loadoutItems: DestinyLoadoutItemComponent[],
  allItems: DimItem[]
): DimItem[] {
  // TODO: apply socket overrides once we know what those are?
  return _.compact(
    loadoutItems.map((li) => {
      const realItem =
        li.itemInstanceId !== '0'
          ? potentialLoadoutItemsByItemId(allItems)[li.itemInstanceId]
          : undefined;
      if (realItem) {
        return applySocketOverrides(
          itemCreationContext,
          realItem,
          convertInGameLoadoutPlugItemHashesToSocketOverrides(li.plugItemHashes)
        );
      }
      return realItem;
    })
  );
}

/**
 * Hook version of getItemsFromLoadouts
 */
export function useItemsFromInGameLoadout(loadout: InGameLoadout) {
  const allItems = useSelector(allItemsSelector);
  const itemCreationContext = useSelector(createItemContextSelector);
  return useMemo(
    () => getItemsFromInGameLoadout(itemCreationContext, loadout.items, allItems),
    [itemCreationContext, loadout.items, allItems]
  );
}
