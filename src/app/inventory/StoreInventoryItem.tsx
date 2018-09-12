import * as React from 'react';
import { DimItem } from './item-types';
import DraggableInventoryItem from './DraggableInventoryItem';
import ItemPopupTrigger from './ItemPopupTrigger';
import InventoryItem from './InventoryItem';
import { queuedAction } from './action-queue';
import { CompareService } from '../compare/compare.service';
import { dimLoadoutService } from '../loadout/loadout.service';
import { moveItemTo } from './dimItemMoveService.factory';
import { TagValue } from './dim-item-info';

interface Props {
  item: DimItem;
  isNew: boolean;
  tag?: TagValue;
  rating?: number;
  searchHidden: boolean;
}

/**
 * The "full" inventory item, which can be dragged around and which pops up a move popup when clicked.
 */
export default class StoreInventoryItem extends React.Component<Props> {
  private doubleClicked = queuedAction((e) => {
    const item = this.props.item;
    if (!dimLoadoutService.dialogOpen && !CompareService.dialogOpen) {
      e.stopPropagation();
      const active = item.getStoresService().getActiveStore()!;

      // Equip if it's not equipped or it's on another character
      const equip = !item.equipped || item.owner !== active.id;

      moveItemTo(item, active, item.canBeEquippedBy(active) ? equip : false, item.amount);
    }
  });

  render() {
    const { item, isNew, tag, rating, searchHidden } = this.props;

    return (
      <DraggableInventoryItem item={item}>
        <ItemPopupTrigger item={item}>
          <InventoryItem
            item={item}
            onDoubleClick={this.doubleClicked}
            isNew={isNew}
            tag={tag}
            rating={rating}
            searchHidden={searchHidden}
          />
        </ItemPopupTrigger>
      </DraggableInventoryItem>
    );
  }
}
