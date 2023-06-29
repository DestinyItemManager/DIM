import { usePreview } from 'react-dnd-multi-backend';
import ConnectedInventoryItem from './ConnectedInventoryItem';
import { DimItem } from './item-types';

/**
 * When we are using the React DnD Touch Backend (iOS < 15 only), this will
 * render a placeholder so users can see the item they're dragging.
 *
 * This can be removed when we drop iOS 14 support and the TouchBackend.
 */
export function ItemDragPreview() {
  const preview = usePreview();

  if (
    !preview.display ||
    // Basic check that it's a DimItem
    !('bucket' in (preview.item as any))
  ) {
    return null;
  }

  const style = preview.style;
  const item = preview.item as DimItem;
  return (
    <div style={style}>
      <ConnectedInventoryItem item={item} />
    </div>
  );
}
