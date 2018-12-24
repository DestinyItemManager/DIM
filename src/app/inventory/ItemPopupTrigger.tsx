import * as React from 'react';
import { DimItem } from './item-types';
import { dimLoadoutService } from '../loadout/loadout.service';
import { CompareService } from '../compare/compare.service';
import { NewItemsService } from './store/new-items.service';
import { $rootScope } from 'ngimport';
import { showItemPopup } from '../item-popup/ItemPopupContainer';

interface Props {
  item: DimItem;
  children?: React.ReactNode;
  // TODO: how to show these??
  template?: string;
  extraData?: {};
}

/**
 * This wraps its children in a div which, when clicked, will show the move popup for the provided item.
 */
export default class ItemPopupTrigger extends React.Component<Props> {
  private dialogResult: any;
  private ref?: HTMLDivElement;

  componentWillUnmount() {
    if (this.dialogResult) {
      this.dialogResult.close();
      this.dialogResult = null;
    }
  }

  render() {
    const { children } = this.props;

    return <div ref={this.captureRef}>{children}</div>;
  }

  // We're handling our own event so we can properly cancel clickOutside stuff
  private captureRef = (element: HTMLDivElement) => {
    if (!this.ref && element) {
      element.addEventListener('click', this.clicked, false);
    } else if (!element && this.ref) {
      this.ref.removeEventListener('click', this.clicked);
    }
    this.ref = element;
  };

  private clicked = (e: Event) => {
    e.stopPropagation();

    const { item } = this.props;

    NewItemsService.dropNewItem(item);

    // TODO: a dispatcher based on store state?
    if (dimLoadoutService.dialogOpen) {
      $rootScope.$apply(() => dimLoadoutService.addItemToLoadout(item, e));
    } else if (CompareService.dialogOpen) {
      $rootScope.$apply(() => CompareService.addItemToCompare(item));
    } else {
      showItemPopup(item, this.ref || undefined);
      return false;
    }
  };
}
