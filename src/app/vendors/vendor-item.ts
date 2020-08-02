import {
  DestinyVendorItemDefinition,
  DestinyVendorSaleItemComponent,
  DestinyItemComponentSetOfint32,
  DestinyVendorDefinition,
  DestinyItemSocketEntryPlugItemDefinition,
  DestinyDisplayPropertiesDefinition,
  DestinyItemQuantity,
  DestinyCollectibleComponent,
} from 'bungie-api-ts/destiny2';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { makeFakeItem } from '../inventory/store/d2-item-factory';
import { DimItem } from '../inventory/item-types';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import _ from 'lodash';
import { VENDORS } from 'app/search/d2-known-values';

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
      0,
      undefined,
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
    itemComponents?: DestinyItemComponentSetOfint32,
    mergedCollectibles?: {
      [hash: number]: DestinyCollectibleComponent;
    }
  ): VendorItem {
    const vendorItemDef = vendorDef.itemList[saleItem.vendorItemIndex];
    const failureStrings =
      saleItem && vendorDef
        ? (saleItem.failureIndexes || []).map((i) => vendorDef.failureStrings[i])
        : [];

    return new VendorItem(
      defs,
      buckets,
      saleItem.itemHash,
      failureStrings,
      vendorDef.hash,
      vendorItemDef,
      saleItem,
      itemComponents,
      mergedCollectibles
    );
  }

  static forVendorDefinitionItem(
    defs: D2ManifestDefinitions,
    buckets: InventoryBuckets,
    vendorItemDef: DestinyVendorItemDefinition,
    mergedCollectibles?: {
      [hash: number]: DestinyCollectibleComponent;
    }
  ): VendorItem {
    return new VendorItem(
      defs,
      buckets,
      vendorItemDef.itemHash,
      [],
      0,
      vendorItemDef,
      undefined,
      undefined,
      mergedCollectibles
    );
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
    vendorHash: number,
    vendorItemDef?: DestinyVendorItemDefinition,
    saleItem?: DestinyVendorSaleItemComponent,
    // TODO: this'll be useful for showing the move-popup details
    itemComponents?: DestinyItemComponentSetOfint32,
    mergedCollectibles?: {
      [hash: number]: DestinyCollectibleComponent;
    },
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
    this.costs = saleItem?.costs || [];
    if (inventoryItem.preview?.previewVendorHash) {
      this.previewVendorHash = inventoryItem.preview.previewVendorHash;
    }

    this.item = makeFakeItem(
      defs,
      buckets,
      itemComponents,
      itemHash,
      saleItem ? saleItem.vendorItemIndex.toString() : itemHash.toString(),
      vendorItemDef ? vendorItemDef.quantity : 1,
      mergedCollectibles
    );

    if (this.item) {
      this.item.hidePercentage = true;
    }

    // only apply for 2255782930, master rahool
    if (vendorHash === VENDORS.RAHOOL && saleItem?.overrideStyleItemHash && this.item) {
      const itemDef = defs.InventoryItem.get(saleItem.overrideStyleItemHash);
      if (itemDef) {
        const display = itemDef.displayProperties;
        this.item.name = display.name;
        this.item.icon = display.icon;
      }
    }
  }
}
