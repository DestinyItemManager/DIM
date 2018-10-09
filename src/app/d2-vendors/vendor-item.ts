import {
  DestinyVendorItemDefinition,
  DestinyVendorSaleItemComponent,
  DestinyItemComponentSetOfint32,
  DestinyInventoryItemDefinition,
  DestinyItemInstanceComponent,
  DestinyVendorDefinition,
  ItemBindStatus,
  ItemLocation,
  TransferStatuses,
  ItemState,
  DestinyItemSocketEntryPlugItemDefinition,
  DestinyObjectiveProgress
} from 'bungie-api-ts/destiny2';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { makeItem } from '../inventory/store/d2-item-factory.service';
import { D2ReviewDataCache } from '../destinyTrackerApi/d2-reviewDataCache';
import { D2Item } from '../inventory/item-types';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { D2RatingData } from '../item-review/d2-dtr-api-types';
import * as _ from 'lodash';

/**
 * A displayable vendor item. The only state it holds is raw responses/definitions - all
 * display properties are computed. The item itself is immutable and should be cheap to
 * construct, and relatively cheap to compare.
 *
 * This is the pattern I want to follow for our main items!
 */
// TODO: Replace with DimItem + vendory stuff
export class VendorItem {
  static forPlugSetItem(
    defs: D2ManifestDefinitions,
    plugItemDef: DestinyItemSocketEntryPlugItemDefinition,
    reviewCache?: D2ReviewDataCache,
    canPurchase = true
  ): VendorItem {
    return new VendorItem(
      defs,
      defs.InventoryItem.get(plugItemDef.plugItemHash),
      [],
      undefined,
      reviewCache ? reviewCache.getRatingData(undefined, plugItemDef.plugItemHash) : null,
      undefined,
      undefined,
      undefined,
      canPurchase
    );
  }

  static forKioskItem(
    defs: D2ManifestDefinitions,
    vendorDef: DestinyVendorDefinition,
    vendorItemDef: DestinyVendorItemDefinition,
    canPurchase: boolean,
    reviewCache?: D2ReviewDataCache
  ): VendorItem {
    const failureStrings =
      vendorItemDef && vendorDef
        ? (vendorItemDef.failureIndexes || []).map((i) => vendorDef!.failureStrings[i])
        : [];

    return new VendorItem(
      defs,
      defs.InventoryItem.get(vendorItemDef.itemHash),
      failureStrings,
      vendorItemDef,
      reviewCache ? reviewCache.getRatingData(undefined, vendorItemDef.itemHash) : null,
      undefined,
      undefined,
      undefined,
      canPurchase
    );
  }

  static forVendorSaleItem(
    defs: D2ManifestDefinitions,
    vendorDef: DestinyVendorDefinition,
    saleItem: DestinyVendorSaleItemComponent,
    reviewCache?: D2ReviewDataCache,
    // TODO: this'll be useful for showing the move-popup details
    itemComponents?: DestinyItemComponentSetOfint32
  ): VendorItem {
    let instance: DestinyItemInstanceComponent | undefined;
    if (saleItem && itemComponents && itemComponents.instances && itemComponents.instances.data) {
      instance = itemComponents.instances.data[saleItem.vendorItemIndex];
    }
    const vendorItemDef = vendorDef.itemList[saleItem.vendorItemIndex];
    const failureStrings =
      saleItem && vendorDef
        ? (saleItem.failureIndexes || []).map((i) => vendorDef!.failureStrings[i])
        : [];

    return new VendorItem(
      defs,
      defs.InventoryItem.get(vendorItemDef.itemHash),
      failureStrings,
      vendorItemDef,
      reviewCache ? reviewCache.getRatingData(saleItem) : null,
      saleItem,
      itemComponents,
      instance
    );
  }

  static forVendorDefinitionItem(
    defs: D2ManifestDefinitions,
    vendorItemDef: DestinyVendorItemDefinition,
    reviewCache?: D2ReviewDataCache
  ): VendorItem {
    return new VendorItem(
      defs,
      defs.InventoryItem.get(vendorItemDef.itemHash),
      [],
      vendorItemDef,
      reviewCache ? reviewCache.getRatingData(undefined, vendorItemDef.itemHash) : null
    );
  }

  // TODO: This is getting silly. Rethink this whole thing.
  static forOrnament(
    defs: D2ManifestDefinitions,
    itemHash: number,
    objectives: DestinyObjectiveProgress[],
    canInsert: boolean,
    enableFailReasons: string[]
  ): VendorItem {
    const fakeInstance = ({} as any) as DestinyItemInstanceComponent;
    return new VendorItem(
      defs,
      defs.InventoryItem.get(itemHash),
      enableFailReasons,
      undefined,
      undefined,
      undefined,
      {
        objectives: {
          data: {
            [itemHash]: {
              objectives,
              flavorObjective: (undefined as any) as DestinyObjectiveProgress
            }
          },
          privacy: 2
        },
        perks: { data: {}, privacy: 2 },
        renderData: { data: {}, privacy: 2 },
        stats: { data: {}, privacy: 2 },
        sockets: { data: {}, privacy: 2 },
        talentGrids: { data: {}, privacy: 2 },
        plugStates: { data: {}, privacy: 2 },
        instances: {
          data: {
            [itemHash]: fakeInstance
          },
          privacy: 2
        }
      },
      undefined,
      canInsert
    );
  }

  // TODO: This is getting silly. Rethink this whole thing.
  static forCatalyst(
    defs: D2ManifestDefinitions,
    attachedItemHash: number,
    itemHash: number,
    objectives: DestinyObjectiveProgress[],
    canInsert: boolean,
    enableFailReasons: string[]
  ): VendorItem {
    const fakeInstance = ({} as any) as DestinyItemInstanceComponent;

    const modDef = defs.InventoryItem.get(itemHash);
    const itemDef = defs.InventoryItem.get(attachedItemHash);

    const fakedDef = {
      ...modDef,
      displayProperties: {
        ...modDef.displayProperties,
        name: itemDef.displayProperties.name,
        icon: itemDef.displayProperties.icon
      }
    };

    return new VendorItem(
      defs,
      fakedDef,
      enableFailReasons,
      undefined,
      undefined,
      undefined,
      {
        objectives: {
          data: {
            [itemHash]: {
              objectives,
              flavorObjective: (undefined as any) as DestinyObjectiveProgress
            }
          },
          privacy: 2
        },
        perks: { data: {}, privacy: 2 },
        renderData: { data: {}, privacy: 2 },
        stats: { data: {}, privacy: 2 },
        sockets: { data: {}, privacy: 2 },
        talentGrids: { data: {}, privacy: 2 },
        plugStates: { data: {}, privacy: 2 },
        instances: {
          data: {
            [itemHash]: fakeInstance
          },
          privacy: 2
        }
      },
      undefined,
      canInsert
    );
  }

  readonly canPurchase: boolean;
  readonly failureStrings: string[];

  private itemComponents?: DestinyItemComponentSetOfint32;
  private vendorItemDef?: DestinyVendorItemDefinition;
  private saleItem?: DestinyVendorSaleItemComponent;
  private inventoryItem: DestinyInventoryItemDefinition;
  private instance?: DestinyItemInstanceComponent;
  private defs: D2ManifestDefinitions;
  private reviewData: D2RatingData | null;

  constructor(
    defs: D2ManifestDefinitions,
    inventoryItem: DestinyInventoryItemDefinition,
    failureStrings: string[],
    vendorItemDef?: DestinyVendorItemDefinition,
    reviewData?: D2RatingData | null,
    saleItem?: DestinyVendorSaleItemComponent,
    // TODO: this'll be useful for showing the move-popup details
    itemComponents?: DestinyItemComponentSetOfint32,
    instance?: DestinyItemInstanceComponent,
    canPurchase = true
  ) {
    this.defs = defs;
    this.vendorItemDef = vendorItemDef;
    this.saleItem = saleItem;
    this.inventoryItem = inventoryItem;
    this.canPurchase = canPurchase;
    this.itemComponents = itemComponents;
    this.reviewData = reviewData || null;
    this.instance = instance;
    this.failureStrings = failureStrings;
  }

  get key() {
    return this.saleItem ? this.saleItem.vendorItemIndex : this.inventoryItem.hash;
  }

  get itemHash() {
    return this.inventoryItem.hash;
  }

  // TODO: I'm not sold on having a bunch of property getters, vs just exposing the raw underlying stuff

  get displayProperties() {
    if (this.saleItem && this.saleItem.overrideStyleItemHash) {
      return this.defs.InventoryItem.get(this.saleItem.overrideStyleItemHash).displayProperties;
    }
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
    return !this.saleItem || this.saleItem.failureIndexes.length === 0;
  }

  /**
   * What category should this be shown in?
   */
  get displayCategoryIndex() {
    return this.vendorItemDef ? this.vendorItemDef.displayCategoryIndex : undefined;
  }

  get costs() {
    return (this.saleItem && this.saleItem.costs) || [];
  }

  get primaryStat() {
    return this.instance && this.instance.primaryStat && this.instance.primaryStat.value;
  }

  get rating(): number | null {
    if (this.reviewData) {
      return this.reviewData.overallScore;
    }

    return null;
  }

  get previewVendorHash(): number | null {
    if (this.inventoryItem.preview && this.inventoryItem.preview.previewVendorHash) {
      return this.inventoryItem.preview.previewVendorHash;
    }
    return null;
  }

  get objectiveProgress(): number {
    if (
      this.itemComponents &&
      this.itemComponents.objectives &&
      this.itemComponents.objectives.data[this.inventoryItem.hash]
    ) {
      const objectives = this.itemComponents.objectives.data[this.inventoryItem.hash].objectives;
      return _.sumBy(objectives, (objective) => {
        if (objective.completionValue) {
          return (
            Math.min(1, (objective.progress || 0) / objective.completionValue) / objectives.length
          );
        } else {
          return 0;
        }
      });
    }
    return 0;
  }

  equals(other: VendorItem) {
    // Defs can be ref-compared
    return (
      this.vendorItemDef === other.vendorItemDef &&
      this.canPurchase === other.canPurchase &&
      this.rating === other.rating &&
      this.saleItem === other.saleItem
    );
  }

  /**
   * TODO: This is really gross, but it allows us to make enough of an item to show the move popup.
   */
  toDimItem(buckets: InventoryBuckets, reviewData: D2RatingData | null): D2Item | null {
    return makeItem(
      this.defs,
      buckets,
      new Set(),
      new Set(),
      undefined,
      this.itemComponents,
      {
        itemHash: this.itemHash,
        itemInstanceId: this.saleItem
          ? this.saleItem.vendorItemIndex.toString()
          : this.itemHash.toString(),
        quantity: this.vendorItemDef ? this.vendorItemDef.quantity : 1,
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
