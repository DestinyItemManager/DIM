import { VendorItem } from "./vendor-item";
import * as React from "react";
import BungieImage, { bungieBackgroundStyle } from "../dim-ui/BungieImage";
import classNames from 'classnames';
import { D2ManifestDefinitions } from "../destiny2/d2-definitions.service";
import { DestinyItemQuantity } from "bungie-api-ts/destiny2";
import { ngDialog, $state } from "../ngimport-more";
import { IDialogOpenResult } from "ng-dialog";
import dialogTemplate from './vendor-item-dialog.html';
import { getBuckets } from "../destiny2/d2-buckets.service";
import { DestinyTrackerService } from "../item-review/destiny-tracker.service";
import { dtrRatingColor } from "../shell/dimAngularFilters.filter";
import { ratePerks } from "../destinyTrackerApi/d2-perkRater";
import checkMark from '../../images/check.svg';
import { D2Item } from "../inventory/item-types";
import { D2RatingData } from "../item-review/d2-dtr-api-types";
import { percent } from "../inventory/dimPercentWidth.directive";

interface Props {
  defs: D2ManifestDefinitions;
  item: VendorItem;
  trackerService?: DestinyTrackerService;
  owned: boolean;
}

export default class VendorItemComponent extends React.Component<Props> {
  private static otherDialog: IDialogOpenResult | null = null;
  private dialogResult: IDialogOpenResult | null = null;
  private itemElement = React.createRef<HTMLDivElement>();

  shouldComponentUpdate(
    nextProps: Readonly<Props>) {
    return !nextProps.item.equals(this.props.item);
  }

  componentWillUnmount() {
    if (this.dialogResult) {
      this.dialogResult.close();
    }
  }

  previewVendor = () => {
    if (this.props.item.previewVendorHash) {
      $state.go('destiny2.vendor', { id: this.props.item.previewVendorHash });
    }
    return false;
  }

  render() {
    const { item, defs, owned } = this.props;

    if (item.displayTile) {
      return (
        <div className="vendor-item">
          <a onClick={this.previewVendor}>
            <BungieImage
              className="vendor-tile"
              title={item.displayProperties.name}
              src={item.displayProperties.icon}
            />
          </a>
          {item.displayProperties.name}
        </div>
      );
    }

    let title = item.displayProperties.name;
    if (!item.canBeSold) {
      title = `${title}\n${item.failureStrings.join("\n")}`;
    }

    const progress = item.objectiveProgress;

    return (
      <div className={classNames("vendor-item", { owned })}>
        {(!item.canPurchase || !item.canBeSold) &&
          <div className="locked-overlay"/>
        }
        <div className="item" title={item.displayProperties.name} ref={this.itemElement} onClick={this.openDetailsPopup}>
          {progress > 0 && !item.canPurchase &&
            <div
              className="item-xp-bar-small"
              style={{ width: percent(progress) }}
            />
          }
          <div
            className={classNames("item-img", { transparent: item.borderless })}
            style={bungieBackgroundStyle(item.displayProperties.icon)}
          />
          {owned && <img className="owned-icon" src={checkMark}/>}
          {Boolean(item.primaryStat || item.rating) &&
            <div>
              {item.rating && item.rating > 0 && <div className="item-stat item-review">
                {item.rating}
                <i className="fa fa-star" style={dtrRatingColor(item.rating)}/>
              </div>}
              {Boolean(item.primaryStat) && <div className="item-stat item-equipment">{item.primaryStat}</div>}
            </div>}
          {progress > 0 && !item.canPurchase &&
            <div className="item-stat item-equipment">{percent(progress)}</div>
          }
        </div>
        <div className="vendor-costs">
          {item.costs.map((cost) =>
            <VendorItemCost key={cost.itemHash} defs={defs} cost={cost} />
          )}
        </div>
      </div>
    );
  }

  private openDetailsPopup = async(e) => {
    const { item, trackerService } = this.props;

    e.stopPropagation();

    if (VendorItemComponent.otherDialog) {
      if (ngDialog.isOpen(VendorItemComponent.otherDialog.id)) {
        VendorItemComponent.otherDialog.close();
      }
      VendorItemComponent.otherDialog = null;
    }

    if (this.dialogResult) {
      if (ngDialog.isOpen(this.dialogResult.id)) {
        this.dialogResult.close();
        this.dialogResult = null;
      }
    } else {
      let dimItem: D2Item | null = null;
      let cachedItem: D2RatingData | null = null;
      const buckets = await getBuckets();

      if (trackerService) {
        cachedItem = trackerService.getD2ReviewDataCache().getRatingData(undefined, item.itemHash);

        if (cachedItem && (!cachedItem.reviewsResponse || !cachedItem.reviewsResponse.reviews)) {
          trackerService.getItemReviewAsync(item.itemHash).then(() => {
            cachedItem = trackerService.getD2ReviewDataCache().getRatingData(undefined, item.itemHash);
            // TODO: it'd be nice to push this into tracker service
            Object.assign(dimItem, item.toDimItem(buckets, cachedItem));
            ratePerks(dimItem!);
          });
        }
      }
      dimItem = item.toDimItem(buckets, cachedItem);

      this.dialogResult = ngDialog.open({
        template: dialogTemplate,
        overlay: false,
        className: 'move-popup-dialog vendor-move-popup',
        showClose: false,
        data: this.itemElement.current as {}, // Dialog anchor
        controllerAs: 'vm',
        controller() {
          this.item = dimItem;
          this.vendorItem = item;
        },
        // Setting these focus options prevents the page from
        // jumping as dialogs are shown/hidden
        trapFocus: false,
        preserveFocus: false
      });

      VendorItemComponent.otherDialog = this.dialogResult;

      this.dialogResult.closePromise.then(() => {
        this.dialogResult = null;
      });
    }
  }
}

function VendorItemCost({
  cost,
  defs
}: {
  defs: D2ManifestDefinitions;
  cost: DestinyItemQuantity;
}) {
  const currencyItem = defs.InventoryItem.get(cost.itemHash);
  return (
    <div key={cost.itemHash} className="cost">
      {cost.quantity}{' '}
      <span className="currency">
        <BungieImage
          src={currencyItem.displayProperties.icon}
          title={currencyItem.displayProperties.name}
        />
      </span>
    </div>
  );
}
