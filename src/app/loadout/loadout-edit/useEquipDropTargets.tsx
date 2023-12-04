import { DimItem } from 'app/inventory/item-types';
import { singularBucketHashes } from 'app/loadout-drawer/loadout-utils';
import { isItemLoadoutCompatible, itemCanBeInLoadout } from 'app/utils/item-utils';
import { DestinyClass } from 'bungie-api-ts/destiny2';
import { TargetType } from 'dnd-core';
import { DropTargetHookSpec, useDrop } from 'react-dnd';

/**
 * This hook is used to setup dnd for loadout editing and in particular the use of dnd to add, equip or unequip items.
 *
 * It is a light wrapper around the `useDrop` hook from react-dnd, handling the creation of the drop specs for both
 * equipped and unequipped versions of the drop target.
 *
 * The main requirement which needs to be built for this is the `accept` parameter. This is identical to the `accept`
 * parameter of `useDrop` from react-dnd and is passed directly to it. Basically, it defines an identifier or a list
 * of identifiers that when an item is dragged, this target will be "active" if the dragged item's identifier matches
 * one of this targets identifiers.
 *
 * The accept param is used in a dependency array (basically a useMemo dep array), so ensure to memo it if it is not
 * stable in this regard.
 *
 * To use this, create your accept parameter however seems appropriate, and then use the refs in the drop targets for
 * the equipped and unequipped sections of the ui. Finally, the `canDrop*` and `isOver*` can be used to trigger CSS
 * states for the user indicating that the drop target is both available for drop and is currently targetted
 * respectively.
 *
 * @example
 * const acceptTarget = `${store.id}-${bucket.hash}`;
 *
 * const {
 *   equippedRef,
 *   unequippedRef,
 *   isOverEquipped,
 *   isOverUnequipped,
 *   canDropEquipped,
 *   canDropUnequipped,
 * } = useEquipDropTargets(acceptTarget, classType);
 *
 * return (
 *   <>
 *     <div ref={equippedRef}>Equipped Target!</div>
 *     <div ref={unequippedRef}>Unequipped Target!</div>
 *   </>
 * );
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
        isItemLoadoutCompatible(i.classType, classType) &&
        (type === 'equipped' || !singularBucketHashes.includes(i.bucket.hash)),
      collect: (monitor) => ({
        isOver: monitor.isOver() && monitor.canDrop(),
        canDrop: monitor.canDrop(),
      }),
    });

  const [{ isOver: isOverEquipped, canDrop: canDropEquipped }, equippedRef] = useDrop(
    dropSpec('equipped'),
    [accept, classType],
  );

  const [{ isOver: isOverUnequipped, canDrop: canDropUnequipped }, unequippedRef] = useDrop(
    dropSpec('unequipped'),
    [accept, classType],
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
