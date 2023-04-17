import { DimItem } from 'app/inventory/item-types';
import { singularBucketHashes } from 'app/loadout-drawer/loadout-utils';
import { itemCanBeInLoadout } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { TargetType } from 'dnd-core';
import { DropTargetHookSpec, useDrop } from 'react-dnd';

/**
 * Hook to setup dnd drops for loadout editing.
 *
 * The accept param is used in a dependency array so ensure to memo it.
 */
export function useEquipDropTargets(accept: TargetType, classType: DestinyClass) {
  const dropSpec =
    (type: 'equipped' | 'unequipped') =>
    (): DropTargetHookSpec<
      DimItem,
      { equipped: boolean },
      { isOver: boolean; canDrop: boolean }
    > => ({
      accept,
      drop: () => ({ equipped: type === 'equipped' }),
      canDrop: (i) =>
        itemCanBeInLoadout(i) &&
        (i.classType === DestinyClass.Unknown || classType === i.classType) &&
        (type === 'equipped' || !singularBucketHashes.includes(i.bucket.hash)),
      collect: (monitor) => ({
        isOver: monitor.isOver() && monitor.canDrop(),
        canDrop: monitor.canDrop(),
      }),
    });

  const [{ isOver: isOverEquipped, canDrop: canDropEquipped }, equippedRef] = useDrop(
    dropSpec('equipped'),
    [accept, classType]
  );

  const [{ isOver: isOverUnequipped, canDrop: canDropUnequipped }, unequippedRef] = useDrop(
    dropSpec('unequipped'),
    [accept, classType]
  );

  return {
    isOverEquipped,
    isOverUnequipped,
    canDropEquipped,
    canDropUnequipped,
    equippedRef,
    unequippedRef,
  };
}
