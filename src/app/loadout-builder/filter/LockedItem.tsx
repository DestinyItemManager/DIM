import ClosableContainer from 'app/dim-ui/ClosableContainer';
import ConnectedInventoryItem from 'app/inventory/ConnectedInventoryItem';
import DraggableInventoryItem from 'app/inventory/DraggableInventoryItem';
import { DimItem } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';

/**
 * Render a pinned or excluded item.
 */
export default function LockedItem({
  lockedItem,
  onRemove,
}: {
  lockedItem: DimItem;
  onRemove?: (item: DimItem) => void;
}) {
  return (
    <ClosableContainer
      onClose={onRemove ? () => onRemove(lockedItem) : undefined}
      key={lockedItem.id}
    >
      <DraggableInventoryItem item={lockedItem}>
        <ItemPopupTrigger item={lockedItem}>
          {(ref, onClick) => (
            <ConnectedInventoryItem
              item={lockedItem}
              onClick={onClick}
              ref={ref}
              // don't show the selected Super ability on subclasses because we aren't applying socket overrides
              // to locked subclasses based on what is selected using 'Customize subclass'
              hideSelectedSuper
            />
          )}
        </ItemPopupTrigger>
      </DraggableInventoryItem>
    </ClosableContainer>
  );
}
