import ConnectedInventoryItem from '../inventory/ConnectedInventoryItem';
import DraggableInventoryItem from '../inventory/DraggableInventoryItem';
import { DimItem } from '../inventory/item-types';
import ItemPopupTrigger from '../inventory/ItemPopupTrigger';

/**
 * A draggable item from an armor set. Shift-clicking will exclude the item.
 */
export default function LoadoutBuilderItem({
  item,
  onShiftClick,
}: {
  item: DimItem;
  onShiftClick: () => void;
}) {
  return (
    <DraggableInventoryItem item={item}>
      <ItemPopupTrigger item={item}>
        {(ref, onClick) => (
          <ConnectedInventoryItem
            item={item}
            onClick={onClick}
            onShiftClick={onShiftClick}
            ref={ref}
          />
        )}
      </ItemPopupTrigger>
    </DraggableInventoryItem>
  );
}
