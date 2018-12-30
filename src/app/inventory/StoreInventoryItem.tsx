import * as React from 'react';
import { DimItem } from './item-types';
import DraggableInventoryItem from './DraggableInventoryItem';
import ItemPopupTrigger from './ItemPopupTrigger';
import { CompareService } from '../compare/compare.service';
import { dimLoadoutService } from '../loadout/loadout.service';
import { moveItemTo } from './dimItemMoveService.factory';
import ConnectedInventoryItem from './ConnectedInventoryItem';

interface Props {
  item: DimItem;
  equippedItem?: DimItem;
}

/**
 * The "full" inventory item, which can be dragged around and which pops up a move popup when clicked.
 */
export default class StoreInventoryItem extends React.PureComponent<Props> {
  render() {
    const { item, equippedItem } = this.props;

    return (
      <DraggableInventoryItem item={item}>
        <ItemPopupTrigger item={item} extraData={{ compareItem: equippedItem }}>
          <ConnectedInventoryItem
            item={item}
            allowFilter={true}
            onDoubleClick={this.doubleClicked}
          />
        </ItemPopupTrigger>
      </DraggableInventoryItem>
    );
  }

  private doubleClicked = (e) => {
    const item = this.props.item;
    if (!dimLoadoutService.dialogOpen && !CompareService.dialogOpen) {
      e.stopPropagation();
      const active = item.getStoresService().getActiveStore()!;

      // Equip if it's not equipped or it's on another character
      const equip = !item.equipped || item.owner !== active.id;

      moveItemTo(item, active, item.canBeEquippedBy(active) ? equip : false, item.amount);
    }
  };
}
