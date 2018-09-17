import { VendorItem } from './vendor-item';
import * as React from 'react';
import BungieImage, { bungieBackgroundStyle } from '../dim-ui/BungieImage';
import classNames from 'classnames';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { DestinyItemQuantity } from 'bungie-api-ts/destiny2';
import { ngDialog } from '../ngimport-more';
import { IDialogOpenResult } from 'ng-dialog';
import dialogTemplate from './vendor-item-dialog.html';
import { getBuckets } from '../destiny2/d2-buckets.service';
import { DestinyTrackerService } from '../item-review/destiny-tracker.service';
import { dtrRatingColor } from '../shell/dimAngularFilters.filter';
import { ratePerks } from '../destinyTrackerApi/d2-perkRater';
import checkMark from '../../images/check.svg';
import { D2RatingData } from '../item-review/d2-dtr-api-types';
import { percent } from '../inventory/dimPercentWidth.directive';
import { UISref } from '@uirouter/react';

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

  constructor(props: Props) {
    super(props);
    // There's a Safari bug that makes "private openDetailsPopup = async() => {}" throw "Can't find private variable: @derivedConstructor". It's fixed in the latest iOS but not all of them. So instead we bind the old fashioned way.
    this.openDetailsPopup = this.openDetailsPopup.bind(this);
  }

  shouldComponentUpdate(nextProps: Readonly<Props>) {
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
          <UISref to="destiny2.vendor" params={{ id: item.previewVendorHash }}>
            <BungieImage
              className="vendor-tile"
              title={item.displayProperties.name}
              src={item.displayProperties.icon}
            />
          </UISref>
          {item.displayProperties.name}
        </div>
      );
    }

    let title = item.displayProperties.name;
    if (!item.canBeSold) {
      title = `${title}\n${item.failureStrings.join('\n')}`;
    }

    const progress = item.objectiveProgress;

    return (
      <div className={classNames('vendor-item', { owned })}>
        {(!item.canPurchase || !item.canBeSold) && <div className="locked-overlay" />}
        <div
          className="item"
          title={item.displayProperties.name}
          ref={this.itemElement}
          onClick={this.openDetailsPopup}
        >
          {progress > 0 &&
            !item.canPurchase && (
              <div className="item-xp-bar-small" style={{ width: percent(progress) }} />
            )}
          <div
            className={classNames('item-img', { transparent: item.borderless })}
            style={bungieBackgroundStyle(item.displayProperties.icon)}
          />
          {owned && <img className="owned-icon" src={checkMark} />}
          {Boolean(item.primaryStat || item.rating) && (
            <div>
              {Boolean(item.rating && item.rating > 0) && (
                <div className="item-stat item-review">
                  {item.rating}
                  <i className="fa fa-star" style={dtrRatingColor(item.rating!)} />
                </div>
              )}
              {Boolean(item.primaryStat) && (
                <div className="item-stat item-equipment">{item.primaryStat}</div>
              )}
            </div>
          )}
          {progress > 0 &&
            !item.canPurchase && (
              <div className="item-stat item-equipment">{percent(progress)}</div>
            )}
        </div>
        {item.costs.length > 0 && (
          <div className="vendor-costs">
            {item.costs.map((cost) => (
              <VendorItemCost key={cost.itemHash} defs={defs} cost={cost} />
            ))}
          </div>
        )}
      </div>
    );
  }

  private async openDetailsPopup(e) {
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
      const buckets = await getBuckets();

      let cachedItem: D2RatingData | null = null;
      if (trackerService) {
        cachedItem = trackerService.getD2ReviewDataCache().getRatingData(undefined, item.itemHash);
      }
      const dimItem = item.toDimItem(buckets, cachedItem);

      if (
        cachedItem &&
        (!cachedItem.reviewsResponse || !cachedItem.reviewsResponse.reviews) &&
        trackerService
      ) {
        trackerService.getItemReviewAsync(item.itemHash).then(() => {
          cachedItem = trackerService
            .getD2ReviewDataCache()
            .getRatingData(undefined, item.itemHash);
          // TODO: it'd be nice to push this into tracker service
          if (dimItem) {
            Object.assign(dimItem, item.toDimItem(buckets, cachedItem));
            ratePerks(dimItem!);
          } else {
            console.error(item);
          }
        });
      }

      const itemDef = this.props.defs.InventoryItem.get(item.itemHash);
      const rewards = (itemDef.value ? itemDef.value.itemValue.filter((v) => v.itemHash) : []).map(
        (iq) => ({
          quantity: iq.quantity,
          item: this.props.defs.InventoryItem.get(iq.itemHash)
        })
      );

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
          this.rewards = rewards;
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
