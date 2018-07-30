import * as React from 'react';
import { DimItem } from './item-types';
import { dimLoadoutService } from '../loadout/loadout.service';
import { CompareService } from '../compare/compare.service';
import { ngDialog } from '../ngimport-more';
import { NewItemsService } from './store/new-items.service';
import dialogTemplate from './dimStoreItem.directive.dialog.html';
import './dimStoreItem.scss';

let otherDialog: any = null;

interface Props {
  item: DimItem;
  children?: React.ReactNode;
}

/**
 * This wraps its children in a div which, when clicked, will show the move popup for the provided item.
 */
export default class ItemPopupTrigger extends React.Component<Props> {
  private dialogResult: any;
  private ref = React.createRef<HTMLDivElement>();

  render() {
    const { children } = this.props;

    return (
      <div ref={this.ref} onClick={this.clicked}>
        {children}
      </div>
    );
  }

  private clicked = (e) => {
    e.stopPropagation();

    const item = this.props.item;

    // TODO: What was this?
    /*
    if (shiftClickCallback && e.shiftKey) {
      shiftClickCallback(item);
      return;
    }
    */

    NewItemsService.dropNewItem(item);

    if (otherDialog) {
      if (ngDialog.isOpen(otherDialog.id)) {
        otherDialog.close();
      }
      otherDialog = null;
    }

    if (this.dialogResult) {
      if (ngDialog.isOpen(this.dialogResult.id)) {
        this.dialogResult.close();
        this.dialogResult = null;
      }
    } else if (dimLoadoutService.dialogOpen) {
      dimLoadoutService.addItemToLoadout(item, e);
    } else if (CompareService.dialogOpen) {
      CompareService.addItemToCompare(item, e);
    } else {
      // This is separate to hopefully work around an issue where Angular can't instantiate the controller with ES6 object shorthands
      function dialogController() {
        'ngInject';
        this.item = item;
        this.store = item.getStoresService().getStore(this.item.owner);
      }

      this.dialogResult = ngDialog.open({
        template: dialogTemplate,
        plain: true,
        overlay: false,
        className: 'move-popup-dialog',
        showClose: false,
        data: this.ref.current as {},
        controllerAs: 'vm',
        controller: dialogController,
        // Setting these focus options prevents the page from
        // jumping as dialogs are shown/hidden
        trapFocus: false,
        preserveFocus: false
      });
      otherDialog = this.dialogResult;

      this.dialogResult.closePromise.then(() => {
        this.dialogResult = null;
      });
    }
  }
}
