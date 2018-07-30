import * as React from 'react';
import { DimItem } from './item-types';
import { queuedAction } from './action-queue';
import { dimLoadoutService } from '../loadout/loadout.service';
import { CompareService } from '../compare/compare.service';
import { moveItemTo } from './dimItemMoveService.factory';
import { ngDialog } from '../ngimport-more';
import { NewItemsService } from './store/new-items.service';
import dialogTemplate from './dimStoreItem.directive.dialog.html';
import './dimStoreItem.scss';

let otherDialog: any = null;

interface Props {
  item: DimItem;
  children?: React.ReactNode;
}

// TODO: Separate high and low levels, separate click-to-show-popup
export default class ItemPopupTrigger extends React.Component<Props> {
  private dialogResult: any;
  private ref = React.createRef<HTMLDivElement>();

  private doubleClicked = queuedAction((e) => {
    const item = this.props.item;
    if (!dimLoadoutService.dialogOpen && !CompareService.dialogOpen) {
      e.stopPropagation();
      const active = item.getStoresService().getActiveStore()!;

      // Equip if it's not equipped or it's on another character
      const equip = !item.equipped || item.owner !== active.id;

      moveItemTo(
        item,
        active,
        item.canBeEquippedBy(active) ? equip : false,
        item.amount
      );
    }
  });

  render() {
    const { children } = this.props;

    return (
      <div
        ref={this.ref}
        onClick={this.clicked}
        onDoubleClick={this.doubleClicked}
      >
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
        "ngInject";
        this.item = item;
        this.store = item.getStoresService().getStore(this.item.owner);
      }

      this.dialogResult = ngDialog.open({
        template: dialogTemplate,
        plain: true,
        overlay: false,
        className: "move-popup-dialog",
        showClose: false,
        data: this.ref.current as {},
        controllerAs: "vm",
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
