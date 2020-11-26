import { loadoutDialogOpen } from 'app/loadout/LoadoutDrawer';
import { Inspect } from 'app/mobile-inspect/MobileInspect';
import { useThunkDispatch } from 'app/store/thunk-dispatch';
import React from 'react';
import { CompareService } from '../compare/compare.service';
import ConnectedInventoryItem from './ConnectedInventoryItem';
import DraggableInventoryItem from './DraggableInventoryItem';
import { DimItem } from './item-types';
import ItemPopupTrigger from './ItemPopupTrigger';
import { moveItemToCurrentStore } from './move-item';

interface Props {
  item: DimItem;
  isPhonePortrait?: boolean;
}

/**
 * The "full" inventory item, which can be dragged around and which pops up a move popup when clicked.
 */
export default function StoreInventoryItem({ item, isPhonePortrait }: Props) {
  const dispatch = useThunkDispatch();

  const doubleClicked = (e: React.MouseEvent) => {
    if (!loadoutDialogOpen && !CompareService.dialogOpen) {
      e.stopPropagation();
      dispatch(moveItemToCurrentStore(item));
    }
  };

  return (
    <DraggableInventoryItem
      item={item}
      isPhonePortrait={isPhonePortrait}
      inspect={Inspect.showMoveLocations}
    >
      <ItemPopupTrigger item={item}>
        {(ref, onClick) => (
          <ConnectedInventoryItem
            item={item}
            allowFilter={true}
            innerRef={ref}
            onClick={onClick}
            onDoubleClick={doubleClicked}
          />
        )}
      </ItemPopupTrigger>
    </DraggableInventoryItem>
  );
}
