import { VendorItem } from "./vendor-item";
import * as React from "react";
import BungieImage, { bungieBackgroundStyle } from "../dim-ui/BungieImage";
import classNames from 'classnames';
import { D2ManifestDefinitions } from "../destiny2/d2-definitions.service";
import { DestinyItemQuantity } from "bungie-api-ts/destiny2";
import { ngDialog } from "../ngimport-more";
import { IDialogOpenResult } from "ng-dialog";
import dialogTemplate from './vendor-item-dialog.html';
import { getBuckets } from "../destiny2/d2-buckets.service";
import { DestinyTrackerServiceType, DimWorkingUserReview } from "../item-review/destiny-tracker.service";
import { dtrRatingColor } from "../shell/dimAngularFilters.filter";
import checkMark from '../../images/check.svg';
import { D2Item } from "../inventory/item-types";
import { ratePerks } from "../destinyTrackerApi/d2-perkRater";

interface Props {
  defs: D2ManifestDefinitions;
  item: VendorItem;
  trackerService?: DestinyTrackerServiceType;
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

  render() {
    const { item, defs, owned } = this.props;

    if (item.displayTile) {
      return (
        <div className="vendor-item">
          <BungieImage
            className="vendor-tile"
            title={item.displayProperties.name}
            src={item.displayProperties.icon}
          />
          {item.displayProperties.name}
        </div>
      );
    }

    let title = item.displayProperties.name;
    if (!item.canBeSold) {
      title = `${title}\n${item.failureStrings.join("\n")}`;
    }

    return (
      <div className={classNames("vendor-item", { owned })}>
        {(!item.canPurchase || !item.canBeSold) &&
          <div className="locked-overlay"/>
        }
        <div className="item" title={item.displayProperties.name} ref={this.itemElement} onClick={this.openDetailsPopup}>
          <div
            className={classNames("item-img", { transparent: item.borderless })}
            style={bungieBackgroundStyle(item.displayProperties.icon)}
          />
          {owned && <img className="owned-icon" src={checkMark}/>}
          {(item.primaryStat || item.rating) &&
            <div>
              {item.rating && <div className="item-stat item-review">
                {item.rating}
                <i className="fa fa-star" style={dtrRatingColor(item.rating)}/>
              </div>}
              {item.primaryStat && <div className="item-stat item-equipment">{item.primaryStat}</div>}
            </div>}
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

      let reviewData: DimWorkingUserReview | null = null;
      let dimItem: D2Item | null = null;

      if (trackerService) {
        reviewData = trackerService.getD2ReviewDataCache().getRatingData(undefined, item.itemHash);

        if (reviewData && !reviewData.reviews) {
          trackerService.getItemReviewAsync(item.itemHash).then((reviewsData) => {
            Object.assign(reviewData, reviewsData);
            // TODO: it'd be nice to push this into tracker service
            Object.assign(dimItem, item.toDimItem(buckets, reviewData));
            ratePerks(dimItem!);
            dimItem!.reviewsUpdated = Date.now();
          });
        }
      }

      const buckets = await getBuckets();
      dimItem = item.toDimItem(buckets, reviewData);

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
