import React from 'react';
import { DimItem } from './item-types';
import DraggableInventoryItem from './DraggableInventoryItem';
import ItemPopupTrigger from './ItemPopupTrigger';
import { CompareService } from '../compare/compare.service';
import { moveItemTo } from './move-item';
import ConnectedInventoryItem from './ConnectedInventoryItem';
import { loadoutDialogOpen } from 'app/loadout/LoadoutDrawer';
import { getCurrentStore } from './stores-helpers';

interface Props {
  item: DimItem;
}

/**
 * The "full" inventory item, which can be dragged around and which pops up a move popup when clicked.
 */
export default class StoreInventoryItem extends React.PureComponent<Props> {
  render() {
    const { item } = this.props;

    return (
      <DraggableInventoryItem item={item}>
        <ItemPopupTrigger item={item}>
          {(ref, onClick) => (
            <ConnectedInventoryItem
              item={item}
              allowFilter={true}
              innerRef={ref}
              onClick={onClick}
              onDoubleClick={this.doubleClicked}
            />
          )}
        </ItemPopupTrigger>
      </DraggableInventoryItem>
    );
  }

  private doubleClicked = (e: React.MouseEvent) => {
    const item = this.props.item;
    if (!loadoutDialogOpen && !CompareService.dialogOpen) {
      e.stopPropagation();
      const active = getCurrentStore(item.getStoresService().getStores())!;

      // Equip if it's not equipped or it's on another character
      const equip = !item.equipped || item.owner !== active.id;

      moveItemTo(item, active, item.canBeEquippedBy(active) ? equip : false, item.amount);
    }
  };
}
