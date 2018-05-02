import { DestinyVendorItemDefinition, DestinyVendorSaleItemComponent, DestinyItemComponentSetOfint32, DestinyInventoryItemDefinition, DestinyItemInstanceComponent, DestinyVendorDefinition, ItemBindStatus, ItemLocation, TransferStatuses, ItemState } from "bungie-api-ts/destiny2";
import { D2ManifestDefinitions } from "../destiny2/d2-definitions.service";
import { equals } from 'angular';
import { makeItem } from "../inventory/store/d2-item-factory.service";
import { D2ReviewDataCache } from "../destinyTrackerApi/d2-reviewDataCache";
import { DimWorkingUserReview } from "../item-review/destiny-tracker.service";
import { D2Item } from "../inventory/item-types";
import { InventoryBuckets } from "../inventory/inventory-buckets";

/**
 * A displayable vendor item. The only state it holds is raw responses/definitions - all
 * display properties are computed. The item itself is immutable and should be cheap to
 * construct, and relatively cheap to compare.
 *
 * This is the pattern I want to follow for our main items!
 */
export class VendorItem {
  canPurchase: boolean;
  private itemComponents?: DestinyItemComponentSetOfint32;
  private vendorItemDef: DestinyVendorItemDefinition;
  private saleItem?: DestinyVendorSaleItemComponent;
  private vendorDef: DestinyVendorDefinition;
  private inventoryItem: DestinyInventoryItemDefinition;
  // TODO: each useful component
  private instance: DestinyItemInstanceComponent;

  private defs: D2ManifestDefinitions;

  private reviewData: DimWorkingUserReview | null;

  constructor(
    defs: D2ManifestDefinitions,
    vendorDef: DestinyVendorDefinition,
    vendorItemDef: DestinyVendorItemDefinition,
    reviewCache?: D2ReviewDataCache,
    saleItem?: DestinyVendorSaleItemComponent,
    // TODO: this'll be useful for showing the move-popup details
    itemComponents?: DestinyItemComponentSetOfint32,
    canPurchase = true,
  ) {
    this.defs = defs;
    this.vendorDef = vendorDef;
    this.vendorItemDef = vendorItemDef;
    this.saleItem = saleItem;
    this.inventoryItem = this.defs.InventoryItem.get(this.vendorItemDef.itemHash);
    this.canPurchase = canPurchase;
    this.itemComponents = itemComponents;
    if (saleItem && itemComponents && itemComponents.instances && itemComponents.instances.data) {
      this.instance = itemComponents.instances.data[saleItem.vendorItemIndex];

      if (reviewCache) {
        this.reviewData = reviewCache.getRatingData(saleItem);
      }
      // TODO: more here, like perks and such
    } else if (reviewCache) {
      this.reviewData = reviewCache.getRatingData(undefined, vendorItemDef.itemHash);
    }
  }

  get key() {
    return this.saleItem ? this.saleItem.vendorItemIndex : this.vendorItemDef.itemHash;
  }

  get itemHash() {
    return this.vendorItemDef.itemHash;
  }

  // TODO: I'm not sold on having a bunch of property getters, vs just exposing the raw underlying stuff

  get displayProperties() {
    return this.inventoryItem.displayProperties;
  }

  /**
   * Should this item display "borderless" (vs. in a box)
   */
  get borderless() {
    return Boolean(this.inventoryItem.uiItemDisplayStyle);
  }

  /**
   * Should it display as a wide tile?
   */
  get displayTile() {
    return this.inventoryItem.uiItemDisplayStyle === 'ui_display_style_set_container';
  }

  /**
   * Should this be displayed in a vendor?
   */
  get canBeSold() {
    return (!this.saleItem || this.saleItem.failureIndexes.length === 0);
  }

  get failureStrings(): string[] {
    return this.saleItem
      ? (this.saleItem.failureIndexes || []).map((i) => this.vendorDef.failureStrings[i])
      : [];
  }

  /**
   * What category should this be shown in?
   */
  get displayCategoryIndex() {
    return this.vendorItemDef.displayCategoryIndex;
  }

  get costs() {
    return (this.saleItem && this.saleItem.costs) || [];
  }

  get primaryStat() {
    return (this.instance && this.instance.primaryStat && this.instance.primaryStat.value);
  }

  get rating(): number | null {
    if (this.reviewData) {
      return this.reviewData.rating;
    }

    return null;
  }

  equals(other: VendorItem) {
    // Defs can be ref-compared
    return this.vendorItemDef === other.vendorItemDef &&
      this.canPurchase === other.canPurchase &&
      this.rating === other.rating &&
      // Deep equals
      equals(this.saleItem, other.saleItem);
  }

  /**
   * TODO: This is really gross, but it allows us to make enough of an item to show the move popup.
   */
  toDimItem(
    buckets: InventoryBuckets,
    reviewData: DimWorkingUserReview | null
  ): D2Item | null {
    return makeItem(
      this.defs,
      buckets,
      new Set(),
      new Set(),
      undefined,
      this.itemComponents,
      {
        itemHash: this.itemHash,
        itemInstanceId: this.saleItem ? this.saleItem.vendorItemIndex.toString() : undefined,
        quantity: this.vendorItemDef.quantity,
        bindStatus: ItemBindStatus.NotBound,
        location: ItemLocation.Vendor,
        bucketHash: 0,
        transferStatus: TransferStatuses.NotTransferrable,
        lockable: false,
        state: ItemState.None
      },
      undefined,
      reviewData
    );
  }
}
