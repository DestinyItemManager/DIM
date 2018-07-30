import * as React from 'react';
import classNames from 'classnames';
import { DimItem } from './item-types';
import { percent } from './dimPercentWidth.directive';
import { bungieBackgroundStyle } from '../dim-ui/BungieImage';
import { getColor, dtrRatingColor } from '../shell/dimAngularFilters.filter';
import { tagIconFilter } from './dimStoreItem.directive';
// tslint:disable-next-line:no-implicit-dependencies
import newOverlay from 'app/images/overlay.svg';
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
}

// TODO: Separate high and low levels, separate click-to-show-popup
export default class InventoryItem extends React.Component<Props> {
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
    const { item } = this.props;

    const itemImageStyles = {
      complete: item.complete,
      diamond: item.destinyVersion === 2 && item.bucket.hash === 3284755031,
      masterwork: item.masterwork
    };

    const showRating =
      item.dtrRating &&
      item.dtrRating.overallScore &&
      (item.dtrRating.ratingCount > (item.destinyVersion === 2 ? 0 : 1) ||
        item.dtrRating.highlightedRatingCount > 0);

    const badgeInfo = getBadgeInfo(item);

    return (
      <div
        ref={this.ref}
        id={item.index}
        title={`${item.name}\n${item.typeName}`}
        className={classNames('item', { 'search-hidden': !item.visible })}
        onClick={this.clicked}
        onDoubleClick={this.doubleClicked}
      >
        {item.percentComplete > 0 &&
          !item.complete && (
            <div
              className="item-xp-bar-small"
              style={{ width: percent(item.percentComplete) }}
            />
          )}
        <div
          className={classNames('item-img', itemImageStyles)}
          style={bungieBackgroundStyle(item.icon)}
        />
        {item.isDestiny1() &&
          item.quality && (
            <div
              className="item-stat item-quality"
              style={getColor(item.quality.min, 'backgroundColor')}
            >
              {item.quality.min}%
            </div>
          )}
        {item.dtrRating &&
          showRating && (
            <div className="item-stat item-review">
              {item.dtrRating.overallScore}
              <i
                className="fa fa-star"
                style={dtrRatingColor(item.dtrRating.overallScore)}
              />
            </div>
          )}
        <div className={classNames('item-element', item.dmg)} />
        <div className={tagIconFilter()(item.dimInfo.tag)} />
        {item.isNew && (
          <div className="new_overlay_overflow">
            <img
              className="new_overlay"
              src={newOverlay}
              height="44"
              width="44"
            />
          </div>
        )}
        {badgeInfo.showBadge && (
          <div className={classNames(badgeInfo.badgeClassNames)}>
            {badgeInfo.badgeCount}
          </div>
        )}
      </div>
    );
  }

  private clicked = (e) => {
    e.stopPropagation();

    const item = this.props.item;

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

function getBadgeInfo(
  item: DimItem
): {
  showBadge: boolean;
  badgeClassNames: { [key: string]: boolean };
  badgeCount: string;
} {
  if (!item.primStat && item.objectives) {
    return processBounty(item);
  } else if (item.maxStackSize > 1) {
    return processStackable(item);
  } else {
    return processItem(item);
  }
}

function processBounty(item: DimItem) {
  const showBountyPercentage = !item.complete && !item.hidePercentage;

  const result = {
    showBadge: showBountyPercentage,
    badgeClassNames: {},
    badgeCount: ''
  };

  if (showBountyPercentage) {
    result.badgeClassNames = { 'item-stat': true, 'item-bounty': true };
    result.badgeCount = `${Math.floor(100 * item.percentComplete)}%`;
  }

  return result;
}

function processStackable(item: DimItem) {
  return {
    showBadge: true,
    badgeClassNames: { 'item-stat': true, 'item-stackable': true },
    badgeCount: item.amount.toString()
  };
}

function processItem(item: DimItem) {
  const result = {
    showBadge: Boolean(item.primStat && item.primStat.value),
    badgeClassNames: {
      'item-equipment': true
    },
    badgeCount: ''
  };
  if (item.primStat && result.showBadge) {
    result.badgeClassNames['item-stat'] = true;
    result.badgeCount = item.primStat.value.toString();
  }
  return result;
}
