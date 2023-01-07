import { VENDORS } from 'app/search/d2-known-values';
import {
  DestinyCollectibleComponent,
  DestinyDisplayPropertiesDefinition,
  DestinyItemComponentSetOfint32,
  DestinyItemQuantity,
  DestinyItemSocketEntryPlugItemDefinition,
  DestinyProfileResponse,
  DestinyVendorDefinition,
  DestinyVendorItemDefinition,
  DestinyVendorItemState,
  DestinyVendorSaleItemComponent,
} from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions';
import { InventoryBuckets } from '../inventory/inventory-buckets';
import { DimItem } from '../inventory/item-types';
import { makeFakeItem } from '../inventory/store/d2-item-factory';

/**
 * Not actually always a vendor item.
 * This represents an item inside a vendor or an item contained in a plugset.
 */
export class VendorItem {
  /**
   * creates a VendorItem that's not actually at a vendor. it's part of a plug set.
   * this serves something about the collections interface?
   */
  static forPlugSetItem(
    defs: D2ManifestDefinitions,
    buckets: InventoryBuckets,
    plugItemDef: DestinyItemSocketEntryPlugItemDefinition,
    canPurchase = true
  ): VendorItem {
    return new VendorItem(
      defs,
      buckets,
      undefined,
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

  /**
   * creates a VendorItem being sold by a vendor in the API vendors response.
   * this can include "instanced" stats plugs etc which describe the specifics
   * of that copy they're selling
   */
  static forVendorSaleItem(
    defs: D2ManifestDefinitions,
    buckets: InventoryBuckets,
    vendorDef: DestinyVendorDefinition,
    profileResponse: DestinyProfileResponse | undefined,
    saleItem: DestinyVendorSaleItemComponent,
    // all DIM vendor calls are character-specific. any sale item should have an associated character.
    characterId: string,
    itemComponents: DestinyItemComponentSetOfint32 | undefined,
    mergedCollectibles:
      | {
          [hash: number]: DestinyCollectibleComponent;
        }
      | undefined
  ): VendorItem {
    const vendorItemDef = vendorDef.itemList[saleItem.vendorItemIndex];
    const failureStrings =
      saleItem && vendorDef
        ? (saleItem.failureIndexes || []).map((i) => vendorDef.failureStrings[i])
        : [];

    return new VendorItem(
      defs,
      buckets,
      profileResponse,
      saleItem.itemHash,
      failureStrings,
      vendorDef.hash,
      vendorItemDef,
      saleItem,
      itemComponents,
      mergedCollectibles,
      true, // why?
      characterId
    );
  }

  /**
   * creates a VendorItem solely according to a vendor's definition.
   * some vendors are set up so statically, that they have no data in the live Vendors response
   */
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
      undefined,
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
  readonly owned: boolean;
  readonly canBeSold: boolean;
  readonly displayCategoryIndex?: number;
  readonly costs: DestinyItemQuantity[];
  readonly previewVendorHash?: number;

  constructor(
    defs: D2ManifestDefinitions,
    buckets: InventoryBuckets,
    profileResponse: DestinyProfileResponse | undefined,
    itemHash: number,
    failureStrings: string[],
    vendorHash: number,
    vendorItemDef: DestinyVendorItemDefinition | undefined,
    saleItem: DestinyVendorSaleItemComponent | undefined,
    itemComponents: DestinyItemComponentSetOfint32 | undefined,
    mergedCollectibles:
      | {
          [hash: number]: DestinyCollectibleComponent;
        }
      | undefined,
    canPurchase = true,
    // the character to whom this item is being offered
    characterId?: string
  ) {
    const inventoryItem = defs.InventoryItem.get(itemHash);

    this.canPurchase = canPurchase;
    this.failureStrings = failureStrings;
    this.key = saleItem ? saleItem.vendorItemIndex : inventoryItem.hash;
    this.displayProperties = inventoryItem.displayProperties;
    this.borderless = Boolean(inventoryItem.uiItemDisplayStyle);
    this.displayTile = inventoryItem.uiItemDisplayStyle === 'ui_display_style_set_container';
    this.owned = Boolean((saleItem?.augments || 0) & DestinyVendorItemState.Owned);
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
      // For sale items the item ID needs to be the vendor item index, since that's how we look up item components for perks
      this.key.toString(),
      vendorItemDef ? vendorItemDef.quantity : 1,
      mergedCollectibles,
      profileResponse?.profileRecords.data,
      // vendor items are wish list enabled!
      true
    );

    if (this.item) {
      this.item.hidePercentage = true;

      // override the DimItem.id for vendor items, so they are each unique enough to identify
      // (otherwise they'd get their vendor index as an id, which is only unique per-vendor)
      this.item.id = `${vendorHash}-${this.key}`;
      this.item.index = this.item.id;
      this.item.instanced = false;

      // if this is sold by a vendor, add vendor information
      if (saleItem && characterId) {
        this.item.vendor = { vendorHash, saleIndex: saleItem.vendorItemIndex, characterId };
        if (this.item.equipment && this.item.bucket.hash !== BucketHashes.Emblems) {
          this.item.comparable = true;
        }
      }
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
