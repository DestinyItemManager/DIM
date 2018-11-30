import {
  DestinyVendorItemDefinition,
  DestinyVendorSaleItemComponent,
  DestinyItemComponentSetOfint32,
  DestinyItemInstanceComponent,
  DestinyVendorDefinition,
  ItemBindStatus,
  ItemLocation,
  TransferStatuses,
  ItemState,
  DestinyItemSocketEntryPlugItemDefinition,
  DestinyObjectiveProgress,
  DestinyDisplayPropertiesDefinition,
  DestinyItemQuantity
} from 'bungie-api-ts/destiny2';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import { makeItem } from '../inventory/store/d2-item-factory.service';
import { DimItem } from '../inventory/item-types';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import * as _ from 'lodash';

/**
 * A displayable vendor item.
 */
export class VendorItem {
  static forPlugSetItem(
    defs: D2ManifestDefinitions,
    buckets: InventoryBuckets,
    plugItemDef: DestinyItemSocketEntryPlugItemDefinition,
    canPurchase = true
  ): VendorItem {
    return new VendorItem(
      defs,
      buckets,
      plugItemDef.plugItemHash,
      [],
      undefined,
      undefined,
      undefined,
      canPurchase
    );
  }

  static forVendorSaleItem(
    defs: D2ManifestDefinitions,
    buckets: InventoryBuckets,
    vendorDef: DestinyVendorDefinition,
    saleItem: DestinyVendorSaleItemComponent,
    // TODO: this'll be useful for showing the move-popup details
    itemComponents?: DestinyItemComponentSetOfint32
  ): VendorItem {
    const vendorItemDef = vendorDef.itemList[saleItem.vendorItemIndex];
    const failureStrings =
      saleItem && vendorDef
        ? (saleItem.failureIndexes || []).map((i) => vendorDef!.failureStrings[i])
        : [];

    return new VendorItem(
      defs,
      buckets,
      saleItem.itemHash,
      failureStrings,
      vendorItemDef,
      saleItem,
      itemComponents
    );
  }

  static forVendorDefinitionItem(
    defs: D2ManifestDefinitions,
    buckets: InventoryBuckets,
    vendorItemDef: DestinyVendorItemDefinition
  ): VendorItem {
    return new VendorItem(defs, buckets, vendorItemDef.itemHash, [], vendorItemDef);
  }

  // TODO: This is getting silly. Rethink this whole thing.
  static forOrnament(
    defs: D2ManifestDefinitions,
    buckets: InventoryBuckets,
    itemHash: number,
    objectives: DestinyObjectiveProgress[],
    enableFailReasons: string[],
    attachedItemHash?: number
  ): VendorItem {
    const fakeInstance = ({} as any) as DestinyItemInstanceComponent;
    const vendorItem = new VendorItem(
      defs,
      buckets,
      itemHash,
      enableFailReasons,
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
      }
    );

    if (attachedItemHash && vendorItem.item) {
      const itemDef = defs.InventoryItem.get(attachedItemHash);
      vendorItem.item.name = itemDef.displayProperties.name;
      vendorItem.item.icon = itemDef.displayProperties.icon;
    }
    return vendorItem;
  }

  readonly item: DimItem | null;
  readonly canPurchase: boolean;
  readonly failureStrings: string[];
  readonly key: number;
  readonly displayProperties: DestinyDisplayPropertiesDefinition;
  readonly borderless: boolean;
  readonly displayTile: boolean;
  readonly canBeSold: boolean;
  readonly displayCategoryIndex?: number;
  readonly costs: DestinyItemQuantity[];
  readonly previewVendorHash: number;

  constructor(
    defs: D2ManifestDefinitions,
    buckets: InventoryBuckets,
    itemHash: number,
    failureStrings: string[],
    vendorItemDef?: DestinyVendorItemDefinition,
    saleItem?: DestinyVendorSaleItemComponent,
    // TODO: this'll be useful for showing the move-popup details
    itemComponents?: DestinyItemComponentSetOfint32,
    canPurchase = true
  ) {
    const inventoryItem = defs.InventoryItem.get(itemHash);

    this.canPurchase = canPurchase;
    this.failureStrings = failureStrings;
    this.key = saleItem ? saleItem.vendorItemIndex : inventoryItem.hash;
    this.displayProperties = inventoryItem.displayProperties;
    this.borderless = Boolean(inventoryItem.uiItemDisplayStyle);
    this.displayTile = inventoryItem.uiItemDisplayStyle === 'ui_display_style_set_container';
    this.canBeSold = !saleItem || saleItem.failureIndexes.length === 0;
    this.displayCategoryIndex = vendorItemDef ? vendorItemDef.displayCategoryIndex : undefined;
    this.costs = (saleItem && saleItem.costs) || [];
    if (inventoryItem.preview && inventoryItem.preview.previewVendorHash) {
      this.previewVendorHash = inventoryItem.preview.previewVendorHash;
    }

    this.item = makeItem(
      defs,
      buckets,
      new Set(),
      new Set(),
      undefined,
      itemComponents,
      {
        itemHash,
        itemInstanceId: saleItem ? saleItem.vendorItemIndex.toString() : itemHash.toString(),
        quantity: vendorItemDef ? vendorItemDef.quantity : 1,
        bindStatus: ItemBindStatus.NotBound,
        location: ItemLocation.Vendor,
        bucketHash: 0,
        transferStatus: TransferStatuses.NotTransferrable,
        lockable: false,
        state: ItemState.None
      },
      undefined
    );

    if (this.item) {
      this.item.hidePercentage = true;
    }

    if (saleItem && saleItem.overrideStyleItemHash && this.item) {
      const itemDef = defs.InventoryItem.get(saleItem.overrideStyleItemHash);
      if (itemDef) {
        const display = itemDef.displayProperties;
        this.item.name = display.name;
        this.item.icon = display.icon;
      }
    }
  }
}
