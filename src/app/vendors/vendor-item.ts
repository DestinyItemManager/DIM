import { VENDORS } from 'app/search/d2-known-values';
import {
  DestinyCollectibleState,
  DestinyDisplayPropertiesDefinition,
  DestinyInventoryItemDefinition,
  DestinyItemComponentSetOfint32,
  DestinyItemQuantity,
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
 * This represents an item inside a vendor.
 */
export interface VendorItem {
  readonly item: DimItem | null;
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
  /** The state of this item in the user's D2 Collection */
  readonly collectibleState?: DestinyCollectibleState;
}

/**
 * Find the state of this item in the user's collections. This takes into account
 * the selected character.
 */
function getCollectibleState(
  inventoryItem: DestinyInventoryItemDefinition,
  profileResponse: DestinyProfileResponse | undefined,
  characterId: string
) {
  const collectibleHash = inventoryItem.collectibleHash;
  let collectibleState: DestinyCollectibleState | undefined;
  if (collectibleHash) {
    collectibleState =
      profileResponse?.profileCollectibles?.data?.[collectibleHash]?.state ??
      (characterId
        ? profileResponse?.characterCollectibles?.data?.[characterId]?.[collectibleHash]?.state
        : undefined);
  }
  return collectibleState;
}

function makeVendorItem(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  profileResponse: DestinyProfileResponse | undefined,
  itemHash: number,
  failureStrings: string[],
  vendorHash: number,
  vendorItemDef: DestinyVendorItemDefinition | undefined,
  saleItem: DestinyVendorSaleItemComponent | undefined,
  itemComponents: DestinyItemComponentSetOfint32 | undefined,
  // the character to whom this item is being offered
  characterId: string
): VendorItem {
  const inventoryItem = defs.InventoryItem.get(itemHash);
  const key = saleItem ? saleItem.vendorItemIndex : inventoryItem.hash;
  const vendorItem: VendorItem = {
    failureStrings,
    key,
    displayProperties: inventoryItem.displayProperties,
    borderless: Boolean(inventoryItem.uiItemDisplayStyle),
    displayTile: inventoryItem.uiItemDisplayStyle === 'ui_display_style_set_container',
    owned: Boolean((saleItem?.augments || 0) & DestinyVendorItemState.Owned),
    canBeSold: !saleItem || saleItem.failureIndexes.length === 0,
    displayCategoryIndex: vendorItemDef ? vendorItemDef.displayCategoryIndex : undefined,
    costs: saleItem?.costs || [],
    previewVendorHash: inventoryItem.preview?.previewVendorHash,
    collectibleState: getCollectibleState(inventoryItem, profileResponse, characterId),
    item: makeFakeItem(
      defs,
      buckets,
      itemComponents,
      itemHash,
      // For sale items the item ID needs to be the vendor item index, since that's how we look up item components for perks
      key.toString(),
      vendorItemDef ? vendorItemDef.quantity : 1,
      profileResponse?.profileRecords.data,
      // vendor items are wish list enabled!
      true
    ),
  };

  if (vendorItem.item) {
    vendorItem.item.hidePercentage = true;

    // override the DimItem.id for vendor items, so they are each unique enough to identify
    // (otherwise they'd get their vendor index as an id, which is only unique per-vendor)
    vendorItem.item.id = `${vendorHash}-${vendorItem.key}`;
    vendorItem.item.index = vendorItem.item.id;
    vendorItem.item.instanced = false;

    // if this is sold by a vendor, add vendor information
    if (saleItem && characterId) {
      vendorItem.item.vendor = { vendorHash, saleIndex: saleItem.vendorItemIndex, characterId };
      if (vendorItem.item.equipment && vendorItem.item.bucket.hash !== BucketHashes.Emblems) {
        vendorItem.item.comparable = true;
      }
    }
  }

  // only apply for 2255782930, master rahool
  if (vendorHash === VENDORS.RAHOOL && saleItem?.overrideStyleItemHash && vendorItem.item) {
    const itemDef = defs.InventoryItem.get(saleItem.overrideStyleItemHash);
    if (itemDef) {
      const display = itemDef.displayProperties;
      vendorItem.item.name = display.name;
      vendorItem.item.icon = display.icon;
    }
  }

  return vendorItem;
}

/**
 * creates a VendorItem being sold by a vendor in the API vendors response.
 * this can include "instanced" stats plugs etc which describe the specifics
 * of that copy they're selling
 */
export function vendorItemForSaleItem(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  vendorDef: DestinyVendorDefinition,
  profileResponse: DestinyProfileResponse | undefined,
  saleItem: DestinyVendorSaleItemComponent,
  // all DIM vendor calls are character-specific. any sale item should have an associated character.
  characterId: string,
  itemComponents: DestinyItemComponentSetOfint32 | undefined
): VendorItem {
  const vendorItemDef = vendorDef.itemList[saleItem.vendorItemIndex];
  const failureStrings =
    saleItem && vendorDef
      ? (saleItem.failureIndexes || []).map((i) => vendorDef.failureStrings[i])
      : [];

  return makeVendorItem(
    defs,
    buckets,
    profileResponse,
    saleItem.itemHash,
    failureStrings,
    vendorDef.hash,
    vendorItemDef,
    saleItem,
    itemComponents,
    characterId
  );
}

/**
 * creates a VendorItem solely according to a vendor's definition.
 * some vendors are set up so statically, that they have no data in the live Vendors response
 */
export function vendorItemForDefinitionItem(
  defs: D2ManifestDefinitions,
  buckets: InventoryBuckets,
  vendorItemDef: DestinyVendorItemDefinition,
  profileResponse: DestinyProfileResponse | undefined,
  characterId: string
): VendorItem {
  return makeVendorItem(
    defs,
    buckets,
    profileResponse,
    vendorItemDef.itemHash,
    [],
    0,
    vendorItemDef,
    undefined,
    undefined,
    characterId
  );
}
