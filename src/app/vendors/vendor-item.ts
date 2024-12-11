import { D2ManifestDefinitions } from 'app/destiny2/d2-definitions';
import { createCollectibleFinder } from 'app/records/collectible-matching';
import { THE_FORBIDDEN_BUCKET, VendorHashes } from 'app/search/d2-known-values';
import { emptyArray } from 'app/utils/empty';
import {
  DestinyCollectibleState,
  DestinyDisplayPropertiesDefinition,
  DestinyInventoryItemDefinition,
  DestinyItemQuantity,
  DestinyProfileResponse,
  DestinyVendorDefinition,
  DestinyVendorItemDefinition,
  DestinyVendorItemState,
  DestinyVendorSaleItemComponent,
} from 'bungie-api-ts/destiny2';
import { BucketHashes } from 'data/d2/generated-enums';
import { DimItem } from '../inventory/item-types';
import { ItemCreationContext, makeFakeItem } from '../inventory/store/d2-item-factory';

/**
 * This represents an item inside a vendor.
 */
export interface VendorItem {
  readonly item: DimItem | undefined;
  readonly failureStrings: string[];
  /** The index in the vendor definition's saleItems array. Unique to this item within a vendor. */
  readonly vendorItemIndex: number;
  readonly displayProperties: DestinyDisplayPropertiesDefinition;
  readonly borderless: boolean;
  readonly displayTile: boolean;
  /** Indicates that the vendor API marks this item as owned, which is used for upgrades. */
  readonly owned: boolean;
  /** Indicates that the vendor API marks this item as locked, which is used for time-gated upgrades */
  readonly locked: boolean;
  readonly canBeSold: boolean;
  readonly displayCategoryIndex?: number;
  readonly originalCategoryIndex?: number;
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
  defs: D2ManifestDefinitions,
  inventoryItem: DestinyInventoryItemDefinition,
  profileResponse: DestinyProfileResponse | undefined,
  characterId: string,
) {
  const collectibleFinder = createCollectibleFinder(defs);
  const collectibleHash = collectibleFinder(inventoryItem)?.hash;
  let collectibleState: DestinyCollectibleState | undefined;
  if (collectibleHash) {
    collectibleState =
      profileResponse?.profileCollectibles?.data?.collectibles[collectibleHash]?.state ??
      (characterId
        ? profileResponse?.characterCollectibles?.data?.[characterId]?.collectibles[collectibleHash]
            ?.state
        : undefined);
  }
  return collectibleState;
}

function makeVendorItem(
  context: ItemCreationContext,
  itemHash: number,
  failureStrings: string[],
  vendorHash: number,
  vendorItemDef: DestinyVendorItemDefinition,
  saleItem: DestinyVendorSaleItemComponent | undefined,
  // the character to whom this item is being offered
  characterId: string,
  // the index in the vendor's items array
  vendorItemIndex: number,
  nextRefreshDate?: string,
): VendorItem {
  const { defs, profileResponse } = context;

  const inventoryItem = defs.InventoryItem.get(itemHash);
  const vendorItem: VendorItem = {
    failureStrings,
    vendorItemIndex,
    displayProperties: inventoryItem.displayProperties,
    borderless: Boolean(inventoryItem.uiItemDisplayStyle),
    displayTile: inventoryItem.uiItemDisplayStyle === 'ui_display_style_set_container',
    owned: Boolean(
      (!inventoryItem.inventory ||
        inventoryItem.inventory.bucketTypeHash === THE_FORBIDDEN_BUCKET) &&
        (saleItem?.augments || 0) & DestinyVendorItemState.Owned,
    ),
    locked: Boolean((saleItem?.augments || 0) & DestinyVendorItemState.Locked),
    canBeSold: !saleItem || saleItem.failureIndexes.length === 0,
    displayCategoryIndex: vendorItemDef?.displayCategoryIndex,
    originalCategoryIndex: vendorItemDef?.originalCategoryIndex,
    costs: saleItem?.costs || [],
    previewVendorHash: inventoryItem.preview?.previewVendorHash,
    collectibleState: getCollectibleState(
      context.defs,
      inventoryItem,
      profileResponse,
      characterId,
    ),
    item: makeFakeItem(context, itemHash, {
      // For sale items the item ID needs to be the vendor item index, since that's how we look up item components for perks
      itemInstanceId: vendorItemIndex.toString(),
      quantity: vendorItemDef ? vendorItemDef.quantity : 1,
      // vendor items are wish list enabled!
      allowWishList: true,
      itemValueVisibility: saleItem?.itemValueVisibility,
    }),
  };

  if (vendorItem.item) {
    vendorItem.item.hidePercentage = true;

    // override the DimItem.id for vendor items, so they are each unique enough to identify
    // (otherwise they'd get their vendor index as an id, which is only unique per-vendor)
    vendorItem.item.id = `${vendorHash}-${vendorItem.vendorItemIndex}-${nextRefreshDate ?? '0'}`;
    vendorItem.item.index = vendorItem.item.id;
    vendorItem.item.instanced = false;
    // These would normally be false already, but certain rules like "finishers
    // are lockable" mess that up, so we set them explicitly here.
    vendorItem.item.lockable = false;

    // since this is sold by a vendor, add vendor information
    vendorItem.item.vendor = { vendorHash, vendorItemIndex, characterId };
    if (vendorItem.item.equipment && vendorItem.item.bucket.hash !== BucketHashes.Emblems) {
      vendorItem.item.comparable = true;
    }
  }

  // only apply for 2255782930, master rahool
  if (vendorHash === VendorHashes.Rahool && saleItem?.overrideStyleItemHash && vendorItem.item) {
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
  context: ItemCreationContext,
  vendorDef: DestinyVendorDefinition,
  saleItem: DestinyVendorSaleItemComponent,
  /** all DIM vendor calls are character-specific. any sale item should have an associated character. */
  characterId: string,
  nextRefreshDate?: string,
): VendorItem {
  const vendorItemDef = vendorDef.itemList[saleItem.vendorItemIndex];
  const failureStrings =
    saleItem && vendorDef && saleItem.failureIndexes
      ? saleItem.failureIndexes.map((i) => vendorDef.failureStrings[i])
      : emptyArray<string>();

  return makeVendorItem(
    context,
    saleItem.itemHash,
    failureStrings,
    vendorDef.hash,
    vendorItemDef,
    saleItem,
    characterId,
    saleItem.vendorItemIndex,
    nextRefreshDate,
  );
}

/**
 * creates a VendorItem solely according to a vendor's definition.
 * some vendors are set up so statically, that they have no data in the live Vendors response
 */
export function vendorItemForDefinitionItem(
  context: ItemCreationContext,
  vendorItemDef: DestinyVendorItemDefinition,
  characterId: string,
  // the index in the vendor's items array
  vendorItemIndex: number,
  nextRefreshDate?: string,
): VendorItem {
  const item = makeVendorItem(
    context,
    vendorItemDef.itemHash,
    [],
    0,
    vendorItemDef,
    undefined,
    characterId,
    vendorItemIndex,
    nextRefreshDate,
  );
  return item;
}
