import React from 'react';
import { DimItem } from './item-types';
import { CompareService } from '../compare/compare.service';
import { NewItemsService } from './store/new-items';
import { showItemPopup, ItemPopupExtraInfo } from '../item-popup/item-popup';
import { loadoutDialogOpen, addItemToLoadout } from 'app/loadout/LoadoutDrawer';

interface Props {
  item: DimItem;
  extraData?: ItemPopupExtraInfo;
  children(ref: React.Ref<HTMLDivElement>, onClick: (e: React.MouseEvent) => void): React.ReactNode;
}

/**
 * This wraps its children in a div which, when clicked, will show the move popup for the provided item.
 */
export default class ItemPopupTrigger extends React.Component<Props> {
  private ref = React.createRef<HTMLDivElement>();

  render() {
    const { children } = this.props;

    return children(this.ref, this.clicked);
  }

  private clicked = (e: React.MouseEvent) => {
    e.stopPropagation();

    const { item, extraData } = this.props;

    NewItemsService.dropNewItem(item);

    // TODO: a dispatcher based on store state?
    if (loadoutDialogOpen) {
      addItemToLoadout(item, e);
    } else if (CompareService.dialogOpen) {
      CompareService.addItemsToCompare([item]);
    } else {
      showItemPopup(item, this.ref.current!, extraData);
      return false;
    }
  };
}
