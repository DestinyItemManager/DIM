import { VENDORS } from 'app/search/d2-known-values';
import {
  DestinyCollectibleComponent,
  DestinyDisplayPropertiesDefinition,
  DestinyItemComponentSetOfint32,
  DestinyItemQuantity,
  DestinyItemSocketEntryPlugItemDefinition,
  DestinyVendorDefinition,
  DestinyVendorItemDefinition,
  DestinyVendorSaleItemComponent,
} from 'bungie-api-ts/destiny2';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { DimItem } from '../inventory/item-types';
import { makeFakeItem } from '../inventory/store/d2-item-factory';

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
  readonly previewVendorHash?: number;

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

    // Fix for ada-1 bounties ... https://github.com/Bungie-net/api/issues/1522
    // changes their sort to match the game
    if (itemHash === 3675595381 || itemHash === 171866827) {
      this.key = itemHash === 3675595381 ? 1 : 4;
    }

    // override the DimItem.id for vendor items, so they are each unique enough to identify
    // (otherwise they'd get their vendor index as an id, which is only unique per-vendor)
    const overrides: Partial<DimItem> = { id: `${vendorHash}-${this.key.toString()}` };

    // if this is sold by a vendor, add vendor information
    if (saleItem) {
      overrides.vendor = { vendorHash, saleIndex: saleItem.vendorItemIndex };
    }

    this.item = makeFakeItem(
      defs,
      buckets,
      itemComponents,
      itemHash,
      // For sale items the item ID needs to be the vendor item index, since that's how we look up item components for perks
      this.key.toString(),
      vendorItemDef ? vendorItemDef.quantity : 1,
      mergedCollectibles,
      overrides
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
