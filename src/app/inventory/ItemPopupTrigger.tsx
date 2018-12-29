import * as React from 'react';
import { DimItem } from './item-types';
import { dimLoadoutService } from '../loadout/loadout.service';
import { CompareService } from '../compare/compare.service';
import { NewItemsService } from './store/new-items.service';
import { $rootScope } from 'ngimport';
import { showItemPopup, ItemPopupExtraInfo } from '../item-popup/item-popup';

interface Props {
  item: DimItem;
  children?: React.ReactNode;
  extraData?: ItemPopupExtraInfo;
}

/**
 * This wraps its children in a div which, when clicked, will show the move popup for the provided item.
 */
export default class ItemPopupTrigger extends React.Component<Props> {
  private ref = React.createRef<HTMLDivElement>();

  render() {
    const { children } = this.props;

    return (
      <div ref={this.ref} onClick={this.clicked}>
        {children}
      </div>
    );
  }

  private clicked = (e: React.MouseEvent) => {
    e.stopPropagation();

    const { item, extraData } = this.props;

    NewItemsService.dropNewItem(item);

    // TODO: a dispatcher based on store state?
    if (dimLoadoutService.dialogOpen) {
      $rootScope.$apply(() => dimLoadoutService.addItemToLoadout(item, e));
    } else if (CompareService.dialogOpen) {
      $rootScope.$apply(() => CompareService.addItemToCompare(item));
    } else {
      showItemPopup(item, this.ref.current!, extraData);
      return false;
    }
  };
}
